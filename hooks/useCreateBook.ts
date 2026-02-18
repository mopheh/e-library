type CreateBookPayload = {
  title: string;
  description: string;
  departmentId: string;
  type: string;
  courseIds: string[];
  fileUrl?: string;
  link?: string;
};

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
      throw new Error("Failed to create book");
    }

    return res.json();
  };

  return { createBook };
}
