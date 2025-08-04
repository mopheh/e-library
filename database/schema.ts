import {
  date,
  integer,
  pgEnum,
  pgTable,
  timestamp,
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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
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
});

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

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull().default("Material"),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  fileUrl: varchar("file_url", { length: 1000 }),
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

export const userBooks = pgTable("user_books", {
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
});
export const readingSessions = pgTable("reading_sessions", {
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
});
