"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.survivalGuides = exports.examInsights = exports.questionTopics = exports.annotations = exports.studyRoomMembers = exports.studyRooms = exports.communityPosts = exports.departmentCommunities = exports.chatMessages = exports.chatRooms = exports.studentConnections = exports.connectionStatusEnum = exports.candidateAnswers = exports.candidateAttempts = exports.postUtmeOptions = exports.postUtmeQuestions = exports.verificationRequests = exports.candidateProfiles = exports.verificationStatusEnum = exports.notifications = exports.notificationTypeEnum = exports.complaints = exports.complaintStatusEnum = exports.auditLogs = exports.goals = exports.activitiesRelations = exports.activities = exports.answers = exports.sessions = exports.options = exports.questions = exports.bookPages = exports.readingSessions = exports.userBooks = exports.bookCourses = exports.books = exports.jobs = exports.comments = exports.threads = exports.studentCourses = exports.courses = exports.departments = exports.faculty = exports.users = exports.jobTypeEnum = exports.parseStatusEnum = exports.LEVEL_ENUM = exports.GENDER_ENUM = exports.SEMESTER_ENUM = exports.ROLE_ENUM = void 0;
exports.answersRelations = exports.cbtSessionsRelations = exports.optionsRelations = exports.questionsRelations = exports.annotationsRelations = exports.bookPagesRelations = exports.readingSessionsRelations = exports.userBooksRelations = exports.chatMessagesRelations = exports.chatRoomsRelations = exports.verificationRequestsRelations = exports.departmentsRelations = exports.facultyRelations = exports.usersRelations = exports.resourceRequestsRelations = exports.resourceRequests = exports.requestStatusEnum = exports.seniorQaAnswers = exports.seniorQa = exports.targetLevelEnum = exports.opportunities = exports.opportunityTypeEnum = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
exports.ROLE_ENUM = (0, pg_core_1.pgEnum)("role", ["STUDENT", "ADMIN", "FACULTY REP", "ASPIRANT"]);
exports.SEMESTER_ENUM = (0, pg_core_1.pgEnum)("semester", ["FIRST", "SECOND"]);
exports.GENDER_ENUM = (0, pg_core_1.pgEnum)("gender", ["MALE", "FEMALE"]);
exports.LEVEL_ENUM = (0, pg_core_1.pgEnum)("level", [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
]);
exports.parseStatusEnum = (0, pg_core_1.pgEnum)("parse_status", [
    "pending",
    "parsing",
    "parsed",
    "generating_questions",
    "processing",
    "completed",
    "failed",
]);
exports.jobTypeEnum = (0, pg_core_1.pgEnum)("job_type", [
    "parse_book",
    "generate_questions",
]);
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().notNull().unique().defaultRandom(),
    clerkId: (0, pg_core_1.varchar)("clerk_id", { length: 255 }).notNull().unique(),
    fullName: (0, pg_core_1.varchar)("full_name", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    phoneNumber: (0, pg_core_1.varchar)("phone_number", { length: 20 }),
    year: (0, exports.LEVEL_ENUM)("level").notNull(),
    facultyId: (0, pg_core_1.uuid)("faculty_id")
        .notNull()
        .references(function () { return exports.faculty.id; }, { onDelete: "cascade" }),
    departmentId: (0, pg_core_1.uuid)("department_id")
        .notNull()
        .references(function () { return exports.departments.id; }, { onDelete: "cascade" }),
    matricNo: (0, pg_core_1.varchar)("matric_no", { length: 255 }).notNull().unique(),
    dateOfBirth: (0, pg_core_1.varchar)("date_of_birth", { length: 255 }),
    role: (0, exports.ROLE_ENUM)("role").default("STUDENT"),
    gender: (0, exports.GENDER_ENUM)("gender").notNull(),
    address: (0, pg_core_1.varchar)("address", { length: 255 }).notNull(),
    interests: (0, pg_core_1.text)("interests"),
    lastActivityDate: (0, pg_core_1.date)("last_activity_date").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at", {
        withTimezone: true,
    }).defaultNow(),
}, function (table) { return ({
    emailIdx: (0, pg_core_1.uniqueIndex)("users_email_idx").on(table.email),
    matricIdx: (0, pg_core_1.uniqueIndex)("users_matric_idx").on(table.matricNo),
    facultyIdx: (0, pg_core_1.index)("users_faculty_idx").on(table.facultyId),
    departmentIdx: (0, pg_core_1.index)("users_department_idx").on(table.departmentId),
}); });
exports.faculty = (0, pg_core_1.pgTable)("faculty", {
    id: (0, pg_core_1.uuid)("id").primaryKey().notNull().unique().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
});
exports.departments = (0, pg_core_1.pgTable)("departments", {
    id: (0, pg_core_1.uuid)("id").primaryKey().notNull().unique().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull().unique(),
    facultyId: (0, pg_core_1.uuid)("faculty_id")
        .notNull()
        .references(function () { return exports.faculty.id; }, { onDelete: "cascade" }),
});
exports.courses = (0, pg_core_1.pgTable)("courses", {
    id: (0, pg_core_1.uuid)("id").primaryKey().notNull().unique().defaultRandom(),
    courseCode: (0, pg_core_1.varchar)("course_code", { length: 255 }).notNull().unique(),
    unitLoad: (0, pg_core_1.integer)("unit_load").notNull(),
    level: (0, exports.LEVEL_ENUM)("level").notNull(),
    semester: (0, exports.SEMESTER_ENUM)("semester").default("FIRST"),
    title: (0, pg_core_1.varchar)("title").notNull(),
    examDate: (0, pg_core_1.timestamp)("exam_date", { withTimezone: true }),
    departmentId: (0, pg_core_1.uuid)("department_id")
        .notNull()
        .references(function () { return exports.departments.id; }, { onDelete: "cascade" }),
});
// Removed redundant departmentCourses table (courses.departmentId is used instead)
exports.studentCourses = (0, pg_core_1.pgTable)("student_courses", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    courseId: (0, pg_core_1.uuid)("course_id")
        .notNull()
        .references(function () { return exports.courses.id; }, { onDelete: "cascade" }),
    semester: (0, exports.SEMESTER_ENUM)("semester").default("FIRST"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
}, function (t) { return ({
    userCourseUniq: (0, pg_core_1.uniqueIndex)("student_courses_user_course_idx").on(t.userId, t.courseId),
}); });
exports.threads = (0, pg_core_1.pgTable)("threads", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    courseId: (0, pg_core_1.uuid)("course_id")
        .notNull()
        .references(function () { return exports.courses.id; }, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.uuid)("author_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, function (table) { return ({
    courseIdx: (0, pg_core_1.index)("threads_course_idx").on(table.courseId, table.createdAt),
}); });
exports.comments = (0, pg_core_1.pgTable)("comments", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    threadId: (0, pg_core_1.uuid)("thread_id")
        .notNull()
        .references(function () { return exports.threads.id; }, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.uuid)("author_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    content: (0, pg_core_1.text)("content").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.jobs = (0, pg_core_1.pgTable)("jobs", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    type: (0, pg_core_1.text)("type").notNull(),
    payload: (0, pg_core_1.jsonb)("payload").$type().notNull(),
    status: (0, pg_core_1.text)("status").default("pending").notNull(),
    attempts: (0, pg_core_1.integer)("attempts").default(0).notNull(),
    maxAttempts: (0, pg_core_1.integer)("max_attempts").default(3).notNull(),
    lastError: (0, pg_core_1.text)("last_error"),
    lockedAt: (0, pg_core_1.timestamp)("locked_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.books = (0, pg_core_1.pgTable)("books", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, pg_core_1.varchar)("description", { length: 255 }).notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 255 }).notNull().default("Material"),
    departmentId: (0, pg_core_1.uuid)("department_id")
        .notNull()
        .references(function () { return exports.departments.id; }, { onDelete: "cascade" }),
    parseStatus: (0, exports.parseStatusEnum)("parse_status").default("pending"),
    fileUrl: (0, pg_core_1.varchar)("file_url", { length: 1000 }),
    fileSize: (0, pg_core_1.integer)("file_size"),
    pageCount: (0, pg_core_1.integer)("page_count"),
    postedBy: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
});
exports.bookCourses = (0, pg_core_1.pgTable)("book_courses", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    bookId: (0, pg_core_1.uuid)("book_id")
        .notNull()
        .references(function () { return exports.books.id; }, { onDelete: "cascade" }),
    courseId: (0, pg_core_1.uuid)("course_id")
        .notNull()
        .references(function () { return exports.courses.id; }, { onDelete: "cascade" }),
});
exports.userBooks = (0, pg_core_1.pgTable)("user_books", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    bookId: (0, pg_core_1.uuid)("book_id")
        .notNull()
        .references(function () { return exports.books.id; }),
    readCount: (0, pg_core_1.integer)("read_count").default(0).notNull(),
    downloadCount: (0, pg_core_1.integer)("download_count").default(0).notNull(),
    aiRequests: (0, pg_core_1.integer)("ai_requests").default(0).notNull(),
    progress: (0, pg_core_1.integer)("progress").default(0).notNull(), // 0-100
    lastPage: (0, pg_core_1.integer)("last_page").default(0).notNull(),
    lastReadAt: (0, pg_core_1.timestamp)("last_read_at", { withTimezone: true }).defaultNow(),
    lastDownloadedAt: (0, pg_core_1.timestamp)("last_downloaded_at", { withTimezone: true }),
    lastAIInteractionAt: (0, pg_core_1.timestamp)("last_ai_interaction_at", {
        withTimezone: true,
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
}, function (table) { return ({
    userIdx: (0, pg_core_1.index)("user_books_user_idx").on(table.userId),
    bookIdx: (0, pg_core_1.index)("user_books_book_idx").on(table.bookId),
    // optional composite if you query both together
    userBookIdx: (0, pg_core_1.uniqueIndex)("user_books_user_book_idx").on(table.userId, table.bookId),
}); });
exports.readingSessions = (0, pg_core_1.pgTable)("reading_sessions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().notNull().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }),
    bookId: (0, pg_core_1.uuid)("book_id")
        .notNull()
        .references(function () { return exports.books.id; }),
    date: (0, pg_core_1.date)("date").notNull(), // The day the session happened
    pagesRead: (0, pg_core_1.integer)("pages_read").notNull().default(0), // Number of pages read
    duration: (0, pg_core_1.integer)("duration").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
}, function (table) { return ({
    userDateIdx: (0, pg_core_1.index)("reading_user_date_idx").on(table.userId, table.date),
}); });
exports.bookPages = (0, pg_core_1.pgTable)("book_pages", {
    id: (0, pg_core_1.uuid)("id").primaryKey().unique().defaultRandom(),
    bookId: (0, pg_core_1.uuid)("book_id")
        .notNull()
        .references(function () { return exports.books.id; }, { onDelete: "cascade" }),
    pageNumber: (0, pg_core_1.integer)("page_number").notNull(),
    textChunk: (0, pg_core_1.text)("text_chunk"),
    embedding: (0, pg_core_1.vector)("embedding", { dimensions: 768 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, function (t) { return ({
    uniq: (0, pg_core_1.unique)().on(t.bookId, t.pageNumber),
}); });
exports.questions = (0, pg_core_1.pgTable)("questions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().unique().defaultRandom(),
    courseId: (0, pg_core_1.uuid)("course_id").references(function () { return exports.courses.id; }),
    questionText: (0, pg_core_1.varchar)("question_text").notNull(),
    type: (0, pg_core_1.varchar)("type").notNull().default("mcq"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.options = (0, pg_core_1.pgTable)("options", {
    id: (0, pg_core_1.uuid)("id").primaryKey().unique().defaultRandom(),
    questionId: (0, pg_core_1.uuid)("question_id").references(function () { return exports.questions.id; }),
    optionText: (0, pg_core_1.text)("option_text").notNull(),
    isCorrect: (0, pg_core_1.boolean)("is_correct").default(false),
});
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().unique().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").references(function () { return exports.users.id; }),
    courseId: (0, pg_core_1.uuid)("course_id").references(function () { return exports.courses.id; }),
    startedAt: (0, pg_core_1.timestamp)("started_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    score: (0, pg_core_1.integer)("score"),
});
exports.answers = (0, pg_core_1.pgTable)("answers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().unique().defaultRandom(),
    sessionId: (0, pg_core_1.uuid)("session_id").references(function () { return exports.sessions.id; }),
    questionId: (0, pg_core_1.uuid)("question_id").references(function () { return exports.questions.id; }),
    selectedOptionId: (0, pg_core_1.uuid)("selected_option_id").references(function () { return exports.options.id; }),
    isCorrect: (0, pg_core_1.boolean)("is_correct"),
});
exports.activities = (0, pg_core_1.pgTable)("activities", {
    id: (0, pg_core_1.uuid)("id").unique().defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    type: (0, pg_core_1.text)("type").notNull(),
    targetId: (0, pg_core_1.uuid)("target_id"), // could be bookId, cbtId, etc.
    meta: (0, pg_core_1.jsonb)("meta"), // extra info like page, score, duration
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, function (table) { return ({
    userDateIdx: (0, pg_core_1.index)("activities_user_date_idx").on(table.userId, table.createdAt),
}); });
exports.activitiesRelations = (0, drizzle_orm_1.relations)(exports.activities, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, {
            fields: [exports.activities.userId],
            references: [exports.users.id],
        }),
        book: one(exports.books, {
            fields: [exports.activities.targetId],
            references: [exports.books.id],
        }),
        // later: add CBT relation the same way
    });
});
exports.goals = (0, pg_core_1.pgTable)("goals", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    type: (0, pg_core_1.text)("type").notNull(), // 'books_read', 'minutes_read', etc.
    target: (0, pg_core_1.integer)("target").notNull(),
    frequency: (0, pg_core_1.text)("frequency").default("weekly").notNull(), // 'daily', 'weekly', 'monthly'
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.auditLogs = (0, pg_core_1.pgTable)("audit_logs", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    actionType: (0, pg_core_1.varchar)("action_type", { length: 255 }).notNull(),
    targetId: (0, pg_core_1.varchar)("target_id", { length: 255 }), // ID of the entity affected (user, book, etc.)
    performedBy: (0, pg_core_1.uuid)("performed_by")
        .notNull()
        .references(function () { return exports.users.id; }),
    details: (0, pg_core_1.jsonb)("details"), // e.g. { assignedRole: "FACULTY REP", facultyId: "..." }
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.complaintStatusEnum = (0, pg_core_1.pgEnum)("complaint_status", ["PENDING", "RESOLVED"]);
exports.complaints = (0, pg_core_1.pgTable)("complaints", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    studentId: (0, pg_core_1.uuid)("student_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    facultyRepId: (0, pg_core_1.uuid)("faculty_rep_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    message: (0, pg_core_1.text)("message").notNull(),
    status: (0, exports.complaintStatusEnum)("status").default("PENDING").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)("notification_type", ["COMPLAINT", "SYSTEM", "GENERAL", "CONNECTION_REQUEST", "MESSAGE"]);
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: "cascade" }), // recipient of notification
    type: (0, exports.notificationTypeEnum)("type").default("GENERAL").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    targetId: (0, pg_core_1.uuid)("target_id"),
    isRead: (0, pg_core_1.boolean)("is_read").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// Pre-Admission Hub Tables
exports.verificationStatusEnum = (0, pg_core_1.pgEnum)("verification_status", ["PENDING", "APPROVED", "REJECTED"]);
exports.candidateProfiles = (0, pg_core_1.pgTable)("candidate_profiles", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    jambScore: (0, pg_core_1.integer)("jamb_score"),
    intendedDepartmentId: (0, pg_core_1.uuid)("intended_department_id").references(function () { return exports.departments.id; }),
    subjectCombinations: (0, pg_core_1.jsonb)("subject_combinations").$type(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.verificationRequests = (0, pg_core_1.pgTable)("verification_requests", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    jambNo: (0, pg_core_1.varchar)("jamb_no", { length: 255 }).notNull(),
    proofUrl: (0, pg_core_1.text)("proof_url").notNull(),
    status: (0, exports.verificationStatusEnum)("status").default("PENDING").notNull(),
    approvedDepartmentId: (0, pg_core_1.uuid)("approved_department_id").references(function () { return exports.departments.id; }),
    approvedFacultyId: (0, pg_core_1.uuid)("approved_faculty_id").references(function () { return exports.faculty.id; }),
    subjectCombinations: (0, pg_core_1.jsonb)("subject_combinations").$type(),
    admissionYear: (0, pg_core_1.varchar)("admission_year", { length: 10 }),
    level: (0, exports.LEVEL_ENUM)("level"),
    reviewedBy: (0, pg_core_1.uuid)("reviewed_by").references(function () { return exports.users.id; }),
    reviewedAt: (0, pg_core_1.timestamp)("reviewed_at", { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.postUtmeQuestions = (0, pg_core_1.pgTable)("post_utme_questions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    subject: (0, pg_core_1.varchar)("subject", { length: 255 }).notNull(),
    questionText: (0, pg_core_1.text)("question_text").notNull(),
    explanation: (0, pg_core_1.text)("explanation"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.postUtmeOptions = (0, pg_core_1.pgTable)("post_utme_options", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    questionId: (0, pg_core_1.uuid)("question_id").notNull().references(function () { return exports.postUtmeQuestions.id; }, { onDelete: "cascade" }),
    optionText: (0, pg_core_1.text)("option_text").notNull(),
    isCorrect: (0, pg_core_1.boolean)("is_correct").default(false).notNull(),
});
exports.candidateAttempts = (0, pg_core_1.pgTable)("candidate_attempts", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    score: (0, pg_core_1.integer)("score"),
    totalQuestions: (0, pg_core_1.integer)("total_questions").notNull(),
    startedAt: (0, pg_core_1.timestamp)("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)("completed_at", { withTimezone: true }),
});
exports.candidateAnswers = (0, pg_core_1.pgTable)("candidate_answers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    attemptId: (0, pg_core_1.uuid)("attempt_id").notNull().references(function () { return exports.candidateAttempts.id; }, { onDelete: "cascade" }),
    questionId: (0, pg_core_1.uuid)("question_id").notNull().references(function () { return exports.postUtmeQuestions.id; }, { onDelete: "cascade" }),
    selectedOptionId: (0, pg_core_1.uuid)("selected_option_id").references(function () { return exports.postUtmeOptions.id; }),
    isCorrect: (0, pg_core_1.boolean)("is_correct"),
});
exports.connectionStatusEnum = (0, pg_core_1.pgEnum)("connection_status", ["PENDING", "ACCEPTED", "REJECTED"]);
exports.studentConnections = (0, pg_core_1.pgTable)("student_connections", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    aspirantId: (0, pg_core_1.uuid)("aspirant_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    studentId: (0, pg_core_1.uuid)("student_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    status: (0, exports.connectionStatusEnum)("status").default("PENDING").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow(),
});
exports.chatRooms = (0, pg_core_1.pgTable)("chat_rooms", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userOneId: (0, pg_core_1.uuid)("user_one_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    userTwoId: (0, pg_core_1.uuid)("user_two_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, function (t) { return ({
    uniqRoom: (0, pg_core_1.uniqueIndex)("chat_rooms_users_idx").on(t.userOneId, t.userTwoId),
}); });
exports.chatMessages = (0, pg_core_1.pgTable)("chat_messages", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    roomId: (0, pg_core_1.uuid)("room_id").notNull().references(function () { return exports.chatRooms.id; }, { onDelete: "cascade" }),
    senderId: (0, pg_core_1.uuid)("sender_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    content: (0, pg_core_1.text)("content").notNull(),
    isRead: (0, pg_core_1.boolean)("is_read").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.departmentCommunities = (0, pg_core_1.pgTable)("department_communities", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    departmentId: (0, pg_core_1.uuid)("department_id").notNull().references(function () { return exports.departments.id; }, { onDelete: "cascade" }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.communityPosts = (0, pg_core_1.pgTable)("community_posts", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    communityId: (0, pg_core_1.uuid)("community_id").notNull().references(function () { return exports.departmentCommunities.id; }, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.uuid)("author_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    content: (0, pg_core_1.text)("content").notNull(),
    isPinned: (0, pg_core_1.boolean)("is_pinned").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.studyRooms = (0, pg_core_1.pgTable)("study_rooms", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    courseId: (0, pg_core_1.uuid)("course_id").notNull().references(function () { return exports.courses.id; }, { onDelete: "cascade" }),
    hostId: (0, pg_core_1.uuid)("host_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.studyRoomMembers = (0, pg_core_1.pgTable)("study_room_members", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    roomId: (0, pg_core_1.uuid)("room_id").notNull().references(function () { return exports.studyRooms.id; }, { onDelete: "cascade" }),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    joinedAt: (0, pg_core_1.timestamp)("joined_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.annotations = (0, pg_core_1.pgTable)("annotations", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    bookId: (0, pg_core_1.uuid)("book_id").notNull().references(function () { return exports.books.id; }, { onDelete: "cascade" }),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    pageNumber: (0, pg_core_1.integer)("page_number").notNull(),
    text: (0, pg_core_1.text)("text").notNull(),
    coordinates: (0, pg_core_1.jsonb)("coordinates"), // To store x, y, width, height format
    color: (0, pg_core_1.varchar)("color", { length: 50 }).default("yellow"),
    isPublic: (0, pg_core_1.boolean)("is_public").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.questionTopics = (0, pg_core_1.pgTable)("question_topics", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    questionId: (0, pg_core_1.uuid)("question_id").notNull().references(function () { return exports.questions.id; }, { onDelete: "cascade" }),
    topicName: (0, pg_core_1.varchar)("topic_name", { length: 255 }).notNull(),
});
exports.examInsights = (0, pg_core_1.pgTable)("exam_insights", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    courseId: (0, pg_core_1.uuid)("course_id").notNull().references(function () { return exports.courses.id; }, { onDelete: "cascade" }),
    topicName: (0, pg_core_1.varchar)("topic_name", { length: 255 }).notNull(),
    frequencyPercentage: (0, pg_core_1.integer)("frequency_percentage").notNull(),
    lastCalculated: (0, pg_core_1.timestamp)("last_calculated", { withTimezone: true }).defaultNow().notNull(),
});
exports.survivalGuides = (0, pg_core_1.pgTable)("survival_guides", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    courseId: (0, pg_core_1.uuid)("course_id").notNull().references(function () { return exports.courses.id; }, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.uuid)("author_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    upvotes: (0, pg_core_1.integer)("upvotes").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.opportunityTypeEnum = (0, pg_core_1.pgEnum)("opportunity_type", ["INTERNSHIP", "SCHOLARSHIP", "HACKATHON", "JOB"]);
exports.opportunities = (0, pg_core_1.pgTable)("opportunities", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    company: (0, pg_core_1.varchar)("company", { length: 255 }).notNull(),
    url: (0, pg_core_1.text)("url").notNull(),
    type: (0, exports.opportunityTypeEnum)("type").default("INTERNSHIP").notNull(),
    deadline: (0, pg_core_1.timestamp)("deadline", { withTimezone: true }),
    departmentId: (0, pg_core_1.uuid)("department_id").references(function () { return exports.departments.id; }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.targetLevelEnum = (0, pg_core_1.pgEnum)("target_level", ["100", "200", "300", "400", "500", "600", "ALL"]);
exports.seniorQa = (0, pg_core_1.pgTable)("senior_qa", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    departmentId: (0, pg_core_1.uuid)("department_id").notNull().references(function () { return exports.departments.id; }, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.uuid)("author_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    targetLevel: (0, exports.targetLevelEnum)("target_level").default("ALL").notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    upvotes: (0, pg_core_1.integer)("upvotes").default(0).notNull(),
    isAnonymous: (0, pg_core_1.boolean)("is_anonymous").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.seniorQaAnswers = (0, pg_core_1.pgTable)("senior_qa_answers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    questionId: (0, pg_core_1.uuid)("question_id").notNull().references(function () { return exports.seniorQa.id; }, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.uuid)("author_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    content: (0, pg_core_1.text)("content").notNull(),
    upvotes: (0, pg_core_1.integer)("upvotes").default(0).notNull(),
    isAccepted: (0, pg_core_1.boolean)("is_accepted").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.requestStatusEnum = (0, pg_core_1.pgEnum)("request_status", ["PENDING", "FULFILLED", "REJECTED"]);
exports.resourceRequests = (0, pg_core_1.pgTable)("resource_requests", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    departmentId: (0, pg_core_1.uuid)("department_id").notNull().references(function () { return exports.departments.id; }, { onDelete: "cascade" }),
    courseId: (0, pg_core_1.uuid)("course_id").notNull().references(function () { return exports.courses.id; }, { onDelete: "cascade" }),
    description: (0, pg_core_1.text)("description").notNull(),
    status: (0, exports.requestStatusEnum)("status").default("PENDING").notNull(),
    fulfilledUrl: (0, pg_core_1.text)("fulfilled_url"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.resourceRequestsRelations = (0, drizzle_orm_1.relations)(exports.resourceRequests, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, {
            fields: [exports.resourceRequests.userId],
            references: [exports.users.id],
        }),
        department: one(exports.departments, {
            fields: [exports.resourceRequests.departmentId],
            references: [exports.departments.id],
        }),
        course: one(exports.courses, {
            fields: [exports.resourceRequests.courseId],
            references: [exports.courses.id],
        }),
    });
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        faculty: one(exports.faculty, {
            fields: [exports.users.facultyId],
            references: [exports.faculty.id],
        }),
        department: one(exports.departments, {
            fields: [exports.users.departmentId],
            references: [exports.departments.id],
        }),
        verificationRequests: many(exports.verificationRequests),
    });
});
exports.facultyRelations = (0, drizzle_orm_1.relations)(exports.faculty, function (_a) {
    var many = _a.many;
    return ({
        departments: many(exports.departments),
        users: many(exports.users),
    });
});
exports.departmentsRelations = (0, drizzle_orm_1.relations)(exports.departments, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        faculty: one(exports.faculty, {
            fields: [exports.departments.facultyId],
            references: [exports.faculty.id],
        }),
        users: many(exports.users),
        courses: many(exports.courses),
    });
});
exports.verificationRequestsRelations = (0, drizzle_orm_1.relations)(exports.verificationRequests, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, {
            fields: [exports.verificationRequests.userId],
            references: [exports.users.id],
        }),
        approvedDepartment: one(exports.departments, {
            fields: [exports.verificationRequests.approvedDepartmentId],
            references: [exports.departments.id],
        }),
        approvedFaculty: one(exports.faculty, {
            fields: [exports.verificationRequests.approvedFacultyId],
            references: [exports.faculty.id],
        }),
        reviewer: one(exports.users, {
            fields: [exports.verificationRequests.reviewedBy],
            references: [exports.users.id],
        }),
    });
});
exports.chatRoomsRelations = (0, drizzle_orm_1.relations)(exports.chatRooms, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        userOne: one(exports.users, {
            fields: [exports.chatRooms.userOneId],
            references: [exports.users.id],
        }),
        userTwo: one(exports.users, {
            fields: [exports.chatRooms.userTwoId],
            references: [exports.users.id],
        }),
        messages: many(exports.chatMessages),
    });
});
exports.chatMessagesRelations = (0, drizzle_orm_1.relations)(exports.chatMessages, function (_a) {
    var one = _a.one;
    return ({
        room: one(exports.chatRooms, {
            fields: [exports.chatMessages.roomId],
            references: [exports.chatRooms.id],
        }),
        sender: one(exports.users, {
            fields: [exports.chatMessages.senderId],
            references: [exports.users.id],
        }),
    });
});
// ── Previously-missing relations ──────────────────────────────────────────────
exports.userBooksRelations = (0, drizzle_orm_1.relations)(exports.userBooks, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, {
            fields: [exports.userBooks.userId],
            references: [exports.users.id],
        }),
        book: one(exports.books, {
            fields: [exports.userBooks.bookId],
            references: [exports.books.id],
        }),
    });
});
exports.readingSessionsRelations = (0, drizzle_orm_1.relations)(exports.readingSessions, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, {
            fields: [exports.readingSessions.userId],
            references: [exports.users.id],
        }),
        book: one(exports.books, {
            fields: [exports.readingSessions.bookId],
            references: [exports.books.id],
        }),
    });
});
exports.bookPagesRelations = (0, drizzle_orm_1.relations)(exports.bookPages, function (_a) {
    var one = _a.one;
    return ({
        book: one(exports.books, {
            fields: [exports.bookPages.bookId],
            references: [exports.books.id],
        }),
    });
});
exports.annotationsRelations = (0, drizzle_orm_1.relations)(exports.annotations, function (_a) {
    var one = _a.one;
    return ({
        book: one(exports.books, {
            fields: [exports.annotations.bookId],
            references: [exports.books.id],
        }),
        user: one(exports.users, {
            fields: [exports.annotations.userId],
            references: [exports.users.id],
        }),
    });
});
exports.questionsRelations = (0, drizzle_orm_1.relations)(exports.questions, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        course: one(exports.courses, {
            fields: [exports.questions.courseId],
            references: [exports.courses.id],
        }),
        options: many(exports.options),
        topics: many(exports.questionTopics),
    });
});
exports.optionsRelations = (0, drizzle_orm_1.relations)(exports.options, function (_a) {
    var one = _a.one;
    return ({
        question: one(exports.questions, {
            fields: [exports.options.questionId],
            references: [exports.questions.id],
        }),
    });
});
exports.cbtSessionsRelations = (0, drizzle_orm_1.relations)(exports.sessions, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user: one(exports.users, {
            fields: [exports.sessions.userId],
            references: [exports.users.id],
        }),
        course: one(exports.courses, {
            fields: [exports.sessions.courseId],
            references: [exports.courses.id],
        }),
        answers: many(exports.answers),
    });
});
exports.answersRelations = (0, drizzle_orm_1.relations)(exports.answers, function (_a) {
    var one = _a.one;
    return ({
        session: one(exports.sessions, {
            fields: [exports.answers.sessionId],
            references: [exports.sessions.id],
        }),
        question: one(exports.questions, {
            fields: [exports.answers.questionId],
            references: [exports.questions.id],
        }),
        selectedOption: one(exports.options, {
            fields: [exports.answers.selectedOptionId],
            references: [exports.options.id],
        }),
    });
});
