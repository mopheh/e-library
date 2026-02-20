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
} from "drizzle-orm/pg-core";

export const ROLE_ENUM = pgEnum("role", ["STUDENT", "ADMIN", "FACULTY REP"]);
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
});
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
