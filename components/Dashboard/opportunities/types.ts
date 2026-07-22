export interface Opportunity {
  id: string;
  title: string;
  company: string;
  url: string;
  type: string;
  deadline: string | null;
  createdAt: string;
  departmentId: string | null;
}

export interface OpportunityFormValues {
  title: string;
  company: string;
  url: string;
  type: string;
  deadline: string;
  isGlobal: boolean;
}
