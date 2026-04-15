import { JobPayload } from "@/types";
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const ROLE_ENUM = pgEnum("role", ["STUDENT", "ADMIN", "FACULTY REP", "ASPIRANT"]);
export const SEMESTER_ENUM = pgEnum("semester", ["FIRST", "SECOND"]);
export const GENDER_ENUM = pgEnum("gender", ["MALE", "FEMALE"]);
export const LEVEL_ENUM = pgEnum("level", [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
]);
export const parseStatusEnum = pgEnum("parse_status", [
  "pending",
  "parsing",
  "parsed",
  "generating_questions",
  "processing",
  "completed",
  "failed",
]);
export const jobTypeEnum = pgEnum("job_type", [
  "parse_book",
  "generate_questions",
]);
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),

    phoneNumber: varchar("phone_number", { length: 20 }),
    year: LEVEL_ENUM("level").notNull(),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => faculty.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    matricNo: varchar("matric_no", { length: 255 }).notNull().unique(),
    dateOfBirth: varchar("date_of_birth", { length: 255 }),
    role: ROLE_ENUM("role").default("STUDENT"),
    gender: GENDER_ENUM("gender").notNull(),
    address: varchar("address", { length: 255 }).notNull(),
    interests: text("interests"),

    lastActivityDate: date("last_activity_date").defaultNow(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    matricIdx: uniqueIndex("users_matric_idx").on(table.matricNo),

    facultyIdx: index("users_faculty_idx").on(table.facultyId),
    departmentIdx: index("users_department_idx").on(table.departmentId),
  }),
);

export const faculty = pgTable("faculty", {
  id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const departments = pgTable("department", {
  id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => faculty.id, { onDelete: "cascade" }),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
  courseCode: varchar("course_code", { length: 255 }).notNull().unique(),
  unitLoad: integer("unit_load").notNull(),
  level: LEVEL_ENUM("level").notNull(),
  semester: SEMESTER_ENUM("semester").default("FIRST"),
  title: varchar("title").notNull(),
  examDate: timestamp("exam_date", { withTimezone: true }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
});
export const departmentCourses = pgTable("department_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
});

export const studentCourses = pgTable(
  "student_courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    semester: SEMESTER_ENUM("semester").default("FIRST"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userCourseUniq: uniqueIndex("student_courses_user_course_idx").on(
      t.userId,
      t.courseId,
    ),
  }),
);

export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  courseIdx: index("threads_course_idx").on(table.courseId, table.createdAt),
}));

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<JobPayload>().notNull(),
  status: text("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  lastError: text("last_error"),
  lockedAt: timestamp("locked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull().default("Material"),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  parseStatus: parseStatusEnum("parse_status").default("pending"),
  fileUrl: varchar("file_url", { length: 1000 }),
  fileSize: integer("file_size"),

  pageCount: integer("page_count"),
  postedBy: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
export const bookCourses = pgTable("book_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
});

export const userBooks = pgTable(
  "user_books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id),

    readCount: integer("read_count").default(0).notNull(),
    downloadCount: integer("download_count").default(0).notNull(),
    aiRequests: integer("ai_requests").default(0).notNull(),

    progress: integer("progress").default(0).notNull(), // 0-100
    lastPage: integer("last_page").default(0).notNull(),

    lastReadAt: timestamp("last_read_at", { withTimezone: true }).defaultNow(),
    lastDownloadedAt: timestamp("last_downloaded_at", { withTimezone: true }),
    lastAIInteractionAt: timestamp("last_ai_interaction_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index("user_books_user_idx").on(table.userId),
    bookIdx: index("user_books_book_idx").on(table.bookId),

    // optional composite if you query both together
    userBookIdx: uniqueIndex("user_books_user_book_idx").on(
      table.userId,
      table.bookId,
    ),
  }),
);
export const readingSessions = pgTable(
  "reading_sessions",
  {
    id: uuid("id").notNull().unique().defaultRandom(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id),

    date: date("date").notNull(), // The day the session happened
    pagesRead: integer("pages_read").notNull().default(0), // Number of pages read
    duration: integer("duration").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userDateIdx: index("reading_user_date_idx").on(table.userId, table.date),
  }),
);
export const bookPages = pgTable(
  "book_pages",
  {
    id: uuid("id").primaryKey().unique().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),

    pageNumber: integer("page_number").notNull(),
    textChunk: text("text_chunk"),
    embedding: vector("embedding", { dimensions: 768 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniq: unique().on(t.bookId, t.pageNumber),
  }),
);

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id),
  questionText: varchar("question_text").notNull(),
  type: varchar("type").notNull().default("mcq"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const options = pgTable("options", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  questionId: uuid("question_id").references(() => questions.id),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  courseId: uuid("course_id").references(() => courses.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
});

export const answers = pgTable("answers", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  sessionId: uuid("session_id").references(() => sessions.id),
  questionId: uuid("question_id").references(() => questions.id),
  selectedOptionId: uuid("selected_option_id").references(() => options.id),
  isCorrect: boolean("is_correct"),
});

export const activities = pgTable("activities", {
  id: uuid("id").unique().defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  targetId: uuid("target_id"), // could be bookId, cbtId, etc.
  meta: jsonb("meta"), // extra info like page, score, duration
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("activities_user_date_idx").on(table.userId, table.createdAt),
}));
export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [activities.targetId],
    references: [books.id],
  }),
  // later: add CBT relation the same way
}));

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'books_read', 'minutes_read', etc.
  target: integer("target").notNull(),
  frequency: text("frequency").default("weekly").notNull(), // 'daily', 'weekly', 'monthly'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actionType: varchar("action_type", { length: 255 }).notNull(),
  targetId: varchar("target_id", { length: 255 }), // ID of the entity affected (user, book, etc.)
  performedBy: uuid("performed_by")
    .notNull()
    .references(() => users.id),
  details: jsonb("details"), // e.g. { assignedRole: "FACULTY REP", facultyId: "..." }
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const complaintStatusEnum = pgEnum("complaint_status", ["PENDING", "RESOLVED"]);

export const complaints = pgTable("complaints", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  facultyRepId: uuid("faculty_rep_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: complaintStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const notificationTypeEnum = pgEnum("notification_type", ["COMPLAINT", "SYSTEM", "GENERAL", "CONNECTION_REQUEST"]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // recipient of notification
  type: notificationTypeEnum("type").default("GENERAL").notNull(),
  message: text("message").notNull(),
  targetId: uuid("target_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Pre-Admission Hub Tables

export const verificationStatusEnum = pgEnum("verification_status", ["PENDING", "APPROVED", "REJECTED"]);

export const candidateProfiles = pgTable("candidate_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jambScore: integer("jamb_score"),
  intendedDepartmentId: uuid("intended_department_id").references(() => departments.id),
  subjectCombinations: jsonb("subject_combinations").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jambNo: varchar("jamb_no", { length: 255 }).notNull(),
  proofUrl: text("proof_url").notNull(),
  status: verificationStatusEnum("status").default("PENDING").notNull(),
  approvedDepartmentId: uuid("approved_department_id").references(() => departments.id),
  approvedFacultyId: uuid("approved_faculty_id").references(() => faculty.id),
  subjectCombinations: jsonb("subject_combinations").$type<string[]>(),
  admissionYear: varchar("admission_year", { length: 10 }),
  level: LEVEL_ENUM("level"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const postUtmeQuestions = pgTable("post_utme_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 255 }).notNull(),
  questionText: text("question_text").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const postUtmeOptions = pgTable("post_utme_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull().references(() => postUtmeQuestions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
});

export const candidateAttempts = pgTable("candidate_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const candidateAnswers = pgTable("candidate_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").notNull().references(() => candidateAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => postUtmeQuestions.id, { onDelete: "cascade" }),
  selectedOptionId: uuid("selected_option_id").references(() => postUtmeOptions.id),
  isCorrect: boolean("is_correct"),
});

export const connectionStatusEnum = pgEnum("connection_status", ["PENDING", "ACCEPTED", "REJECTED"]);

export const studentConnections = pgTable("student_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  aspirantId: uuid("aspirant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: connectionStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  userOneId: uuid("user_one_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userTwoId: uuid("user_two_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqRoom: uniqueIndex("chat_rooms_users_idx").on(t.userOneId, t.userTwoId),
}));

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const departmentCommunities = pgTable("department_communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => departmentCommunities.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studyRooms = pgTable("study_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  hostId: uuid("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studyRoomMembers = pgTable("study_room_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").notNull().references(() => studyRooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

export const annotations = pgTable("annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  text: text("text").notNull(),
  coordinates: jsonb("coordinates"), // To store x, y, width, height format
  color: varchar("color", { length: 50 }).default("yellow"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const questionTopics = pgTable("question_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  topicName: varchar("topic_name", { length: 255 }).notNull(),
});

export const examInsights = pgTable("exam_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  topicName: varchar("topic_name", { length: 255 }).notNull(),
  frequencyPercentage: integer("frequency_percentage").notNull(),
  lastCalculated: timestamp("last_calculated", { withTimezone: true }).defaultNow().notNull(),
});

export const survivalGuides = pgTable("survival_guides", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const opportunityTypeEnum = pgEnum("opportunity_type", ["INTERNSHIP", "SCHOLARSHIP", "HACKATHON", "JOB"]);

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  url: text("url").notNull(),
  type: opportunityTypeEnum("type").default("INTERNSHIP").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
  departmentId: uuid("department_id").references(() => departments.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const targetLevelEnum = pgEnum("target_level", ["100", "200", "300", "400", "500", "600", "ALL"]);

export const seniorQa = pgTable("senior_qa", {
  id: uuid("id").primaryKey().defaultRandom(),
  departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetLevel: targetLevelEnum("target_level").default("ALL").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const seniorQaAnswers = pgTable("senior_qa_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull().references(() => seniorQa.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  isAccepted: boolean("is_accepted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const requestStatusEnum = pgEnum("request_status", ["PENDING", "FULFILLED", "REJECTED"]);

export const resourceRequests = pgTable("resource_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  courseCode: varchar("course_code", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: requestStatusEnum("status").default("PENDING").notNull(),
  fulfilledUrl: text("fulfilled_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resourceRequestsRelations = relations(resourceRequests, ({ one }) => ({
  user: one(users, {
    fields: [resourceRequests.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [resourceRequests.departmentId],
    references: [departments.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  faculty: one(faculty, {
    fields: [users.facultyId],
    references: [faculty.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  verificationRequests: many(verificationRequests),
}));

export const facultyRelations = relations(faculty, ({ many }) => ({
  departments: many(departments),
  users: many(users),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  faculty: one(faculty, {
    fields: [departments.facultyId],
    references: [faculty.id],
  }),
  users: many(users),
  courses: many(courses),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(users, {
    fields: [verificationRequests.userId],
    references: [users.id],
  }),
  approvedDepartment: one(departments, {
    fields: [verificationRequests.approvedDepartmentId],
    references: [departments.id],
  }),
  approvedFaculty: one(faculty, {
    fields: [verificationRequests.approvedFacultyId],
    references: [faculty.id],
  }),
  reviewer: one(users, {
    fields: [verificationRequests.reviewedBy],
    references: [users.id],
  }),
}));

