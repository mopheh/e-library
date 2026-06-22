export interface WorkspaceBook {
  id: string;
  title: string;
  description: string;
  type: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  pageCount?: number | null;
  parseStatus?: string | null;
  createdAt?: string | Date | null;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface WorkspaceCourse {
  id: string;
  courseCode: string;
  title: string;
  level: string;
  semester: string;
  unitLoad: number;
}
