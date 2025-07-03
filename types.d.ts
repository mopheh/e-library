interface Credentials {
  clerkId: string | undefined;
  fullName: string;
  email: string | undefined;
  year: string;
  facultyId: string;
  department: string;
  matricNo: string;
  onboarded: boolean;
}
type Faculty = {
  id: string;
  name: string;
};
