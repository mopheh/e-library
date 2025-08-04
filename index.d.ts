type FormData = {
  faculty: string;
  department: string;
  year: string;
  matric: string;
};
type Course = {
  id: string;
  courseCode: string;
  title: string;
  departmentId: string;
  unitLoad: number;
  semester: string;
  level: string;
  departments: string[];
};
