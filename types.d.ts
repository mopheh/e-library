interface Credentials {
  id?: string;
  clerkId: string;
  fullName: string;
  email: string | undefined;
  year: string;
  role: string;
  facultyId: string;
  departmentId: string;
  matricNo: string;
  onboarded: boolean;
  gender: string; // 👈 missing in your `Credentials`
  address: string;
  createdAt?: string;
  lastActivityDate?: string;
}
type Faculty = {
  id: string;
  name: string;
};
type Department = {
  departmentName?: string;
  facultyId?: string;
  facultyName?: string;
  id?: string;
  name?: string;
};

type Book = {
  id: string;
  course: string;
  fileUrl: string;
  title: string;
  type: string;
  createdAt: string;
};
