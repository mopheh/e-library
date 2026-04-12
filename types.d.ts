export interface User {
  id: string;
  clerkId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  year: "100" | "200" | "300" | "400" | "500" | "600";
  role: "STUDENT" | "ADMIN" | "FACULTY REP" | "ASPIRANT";
  facultyId: string;
  faculty?: Faculty;
  departmentId: string;
  department?: Department;
  matricNo: string;
  gender: "MALE" | "FEMALE";
  address: string;
  dateOfBirth?: string | null;
  createdAt?: string;
  lastActivityDate?: string;
  imageUrl?: string | null;
}

export interface Faculty {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Department {
  id: string;
  name: string;
  facultyId: string;
  facultyName?: string;
}

export interface Course {
  id: string;
  courseCode: string;
  title: string;
  unitLoad: number;
  level: string;
  semester: "FIRST" | "SECOND";
  departmentId: string;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  type: string;
  departmentId: string;
  department?: Department;
  course?: string;
  parseStatus?: "pending" | "parsing" | "parsed" | "generating_questions" | "processing" | "completed" | "failed";
  fileUrl: string | null;
  coverUrl?: string | null;
  fileSize?: number | null;
  pageCount?: number | null;
  postedBy: string;
  postedByDetails?: Partial<User>;
  createdAt: string;
  lastReadAt?: string;
  readCount?: number;
}

export interface Question {
  id: string;
  courseId: string;
  questionText: string;
  type: "mcq" | "short_answer";
  topic?: string;
  options?: Option[];
  createdAt?: string;
}

export interface Option {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
}

export interface Thread {
  id: string;
  courseId: string;
  authorId: string;
  author?: {
    id: string;
    fullName: string;
  };
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  threadId: string;
  authorId: string;
  author?: {
    id: string;
    fullName: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: string;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export type JobType = "parse_book" | "generate_questions";

export interface JobPayload {
  bookId: string;
}

export type Credentials = User;
