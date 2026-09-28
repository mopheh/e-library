type CreateBookPayload = {
  title: string;
  description: string;
  departmentId: string;
  type: string;
  courseIds: string[];
  fileUrl?: string;
  fileSize?: number;
};

/** Carries the API's per-field messages so the form can show them inline. */
export class CreateBookError extends Error {
  constructor(message: string, public fieldErrors: Record<string, string>) {
    super(message);
    this.name = "CreateBookError";
  }
}

export function useCreateBook() {
  const createBook = async (payload: CreateBookPayload) => {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new CreateBookError(data?.error || "Failed to create book", data?.fieldErrors ?? {});
    }

    return res.json();
  };

  return { createBook };
}
