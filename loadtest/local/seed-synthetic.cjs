/* eslint-disable @typescript-eslint/no-require-imports -- plain Node (CommonJS) script */
// Synthetic, production-sized data for the LOCAL load-test database only.
// No production data is read - volumes mirror production's table sizes.
// The 91 load-test Clerk accounts (tokens.json) get matching local users so
// their session tokens authenticate.
const { Pool } = require("pg");
const tokens = require("../tokens.json");
const pool = new Pool({ connectionString: "postgres://postgres:postgres@localhost:54317/main" });

(async () => {
  const q = (text, params) => pool.query(text, params);
  const t0 = Date.now();

  await q(`truncate faculty, users cascade`);

  // Faculties + departments (121, like production). The 10 departments the
  // test accounts belong to keep their ids.
  await q(`insert into faculty(id, name) select gen_random_uuid(), 'Faculty ' || g from generate_series(1, 12) g`);
  const tokenDepts = [...new Set(tokens.map((t) => t.departmentId))];
  await q(
    `insert into departments(id, name, faculty_id)
     select d.id, 'Department ' || row_number() over (), (select id from faculty order by random() limit 1)
     from unnest($1::uuid[]) as d(id)`,
    [tokenDepts],
  );
  await q(`insert into departments(id, name, faculty_id)
           select gen_random_uuid(), 'Department X' || g, (array(select id from faculty))[1 + (g % 12)]
           from generate_series(1, ${121 - tokenDepts.length}) g`);

  // Courses: 8 per department (5 first-semester, 3 second), ~970 total.
  // Test accounts' course ids are kept as first-semester courses.
  const tokenCourses = tokens.filter((t) => t.courseId).map((t) => [t.courseId, t.departmentId]);
  const uniqCourses = [...new Map(tokenCourses.map(([c, d]) => [c, d])).entries()];
  await q(
    `insert into courses(id, course_code, unit_load, level, semester, title, department_id, exam_date)
     select c.id, 'TST' || lpad(row_number() over ()::text, 4, '0'), 3, '300', 'FIRST', 'Test course', c.dept, now() + interval '20 days'
     from unnest($1::uuid[], $2::uuid[]) as c(id, dept)`,
    [uniqCourses.map((x) => x[0]), uniqCourses.map((x) => x[1])],
  );
  await q(`
    insert into courses(id, course_code, unit_load, level, semester, title, department_id, exam_date)
    select gen_random_uuid(), 'C' || lpad((row_number() over ())::text, 5, '0'), 1 + (random() * 3)::int,
           (array['100','200','300','400','500'])[1 + (random() * 4)::int]::level,
           case when n <= 5 then 'FIRST'::semester else 'SECOND'::semester end,
           'Course ' || n || ' of ' || d.name, d.id,
           case when n <= 5 and random() < 0.4 then now() + (3 + random() * 57) * interval '1 day' end
    from departments d cross join generate_series(1, 8) n`);

  // Users: 91 test accounts + 300 background students
  await q(
    `insert into users(id, clerk_id, full_name, email, level, faculty_id, department_id, matric_no, role, gender, address)
     select gen_random_uuid(), t.clerk, 'LoadTest ' || i, 'loadtest' || i || '@example.invalid', '300',
            (select faculty_id from departments where id = t.dept), t.dept, 'LT' || lpad(i::text, 5, '0'), 'STUDENT', 'MALE', 'N/A'
     from unnest($1::text[], $2::uuid[]) with ordinality as t(clerk, dept, i)`,
    [tokens.map((t) => t.clerkId), tokens.map((t) => t.departmentId)],
  );
  await q(`
    insert into users(id, clerk_id, full_name, email, level, faculty_id, department_id, matric_no, role, gender, address)
    select gen_random_uuid(), 'synthetic_' || g, 'Student ' || g, 'student' || g || '@example.invalid',
           (array['100','200','300','400','500'])[1 + (g % 5)]::level, d.faculty_id, d.id, 'SYN' || lpad(g::text, 6, '0'),
           'STUDENT', (array['MALE','FEMALE'])[1 + (g % 2)]::gender, 'N/A'
    from generate_series(1, 300) g
    cross join lateral (select id, faculty_id from departments order by random() + g * 0 limit 1) d`);

  // Registrations: every student takes their department's courses
  await q(`insert into student_courses(user_id, course_id, semester)
           select u.id, c.id, c.semester from users u join courses c on c.department_id = u.department_id
           on conflict do nothing`);

  // Books (~800 approved) linked to a course in their department
  await q(`
    insert into books(id, title, description, type, department_id, parse_status, file_url, page_count, review_status, user_id)
    select gen_random_uuid(), 'Book ' || g, 'Synthetic material', 'Material', c.department_id, 'completed',
           'https://example.invalid/file/bucket/books/' || g || '.pdf', 50 + (random() * 300)::int, 'APPROVED',
           coalesce((select id from users where department_id = c.department_id order by random() + g * 0 limit 1),
                    (select id from users order by random() + g * 0 limit 1))
    from generate_series(1, 800) g
    cross join lateral (select id, department_id from courses order by random() + g * 0 limit 1) c`);
  await q(`insert into book_courses(book_id, course_id)
           select b.id, (select id from courses c where c.department_id = b.department_id order by random() + length(b.id::text) * 0 limit 1)
           from books b`);

  // CBT question bank (~3,400) with 4 options each
  await q(`insert into questions(id, course_id, question_text)
           select gen_random_uuid(), c.id, 'Question ' || n || ' for ' || c.course_code
           from courses c cross join generate_series(1, 4) n where random() < 0.9`);
  await q(`insert into options(question_id, option_text, is_correct)
           select q.id, 'Option ' || n, n = 1 from questions q cross join generate_series(1, 4) n`);

  // Reading history: 6 books per student, ~15 active days in the last 30
  await q(`insert into user_books(user_id, book_id, read_count, progress, last_page)
           select u.id, b.id, 1 + (random() * 4)::int, (random() * 100)::int, (random() * 50)::int
           from users u cross join lateral (select id from books where department_id = u.department_id order by random() + length(u.id::text) * 0 limit 6) b
           on conflict do nothing`);
  await q(`insert into reading_sessions(user_id, book_id, date, pages_read, duration)
           select ub.user_id, ub.book_id, (current_date - (random() * 29)::int), 1 + (random() * 20)::int, 5 + (random() * 55)::int
           from user_books ub cross join generate_series(1, 3)
           on conflict do nothing`);

  // CBT attempts, notifications, activity, goals, study logs
  await q(`insert into sessions(user_id, course_id, started_at, completed_at, score)
           select sc.user_id, sc.course_id, now() - random() * interval '30 days', now() - random() * interval '30 days', (random() * 100)::int
           from student_courses sc where random() < 0.5`);
  await q(`insert into notifications(user_id, type, message, is_read, created_at)
           select u.id, 'GENERAL', 'Notification ' || n, random() < 0.7, now() - n * interval '7 hours'
           from users u cross join generate_series(1, 25) n`);
  await q(`insert into activities(user_id, type, target_id, meta, created_at)
           select ub.user_id, 'read_book', ub.book_id, '{"page": 3}'::jsonb, now() - random() * interval '20 days'
           from user_books ub`);
  await q(`insert into goals(user_id, type, target, frequency)
           select id, 'minutes_read', 300, 'weekly' from users where random() < 0.5`);
  await q(`insert into study_logs(user_id, course_id, date, times_read, minutes, method)
           select sc.user_id, sc.course_id, current_date - (random() * 10)::int, 1 + (random() * 2)::int,
                  case when random() < 0.7 then 30 + (random() * 90)::int end, 'TEXTBOOK'
           from student_courses sc where random() < 0.3`);

  // Grades for half the students
  await q(`insert into academic_profiles(user_id, prior_cgpa, prior_units, target_cgpa)
           select id, round((2.5 + random() * 2.3)::numeric, 2), 60 + (random() * 60)::int, 4.5 from users where random() < 0.5`);
  await q(`insert into semester_results(user_id, session, semester, level)
           select user_id, '2025/2026', 'FIRST', '300' from academic_profiles`);
  await q(`insert into course_grades(result_id, course_code, units, grade)
           select r.id, 'CG' || n, 3, (array['A','B','C','D','E','F'])[1 + (random() * 5)::int]::letter_grade
           from semester_results r cross join generate_series(1, 6) n`);

  await q(`analyze`);
  const counts = (await q(`select relname, n_live_tup from pg_stat_user_tables where n_live_tup > 0 order by n_live_tup desc`)).rows;
  console.log(`seeded in ${((Date.now() - t0) / 1000).toFixed(1)}s:`, counts.map((r) => `${r.relname}=${r.n_live_tup}`).join(" "));
  await pool.end();
})().catch((e) => { console.error("SEED ERROR:", e.message); process.exit(1); });