interface Credentials {
  id?: string;
  clerkId: string | undefined;
  fullName: string;
  email: string | undefined;
  year: string;
  role: string;
  facultyId: string;
  departmentId: string;
  matricNo: string;
  onboarded: boolean;
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
  fileUrl: string;
  title: string;
  type: string;
  createdAt: string;
};
