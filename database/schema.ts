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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  year: varchar("year", { length: 255 }).notNull(),
  facultyId: uuid("faculty_id")
    .notNull()
    .references(() => faculty.id, { onDelete: "cascade" }),
  department: varchar("department", { length: 255 }).notNull(),
  matricNo: varchar("matric_no", { length: 255 }).notNull().unique(),
  role: ROLE_ENUM("role").default("STUDENT"),
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
  level: integer("level").notNull(),
  title: varchar("title").notNull(),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
});
