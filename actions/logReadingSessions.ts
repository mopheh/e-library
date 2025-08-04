// lib/actions/logReadingSession.ts

export const logReadingSession = async ({
  bookId,
  pagesRead,
  duration,
}: {
  bookId: string;
  pagesRead: number;
  duration?: number;
}) => {
  try {
    const res = await fetch("/api/users/reading-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookId,
        pagesRead,
        duration,
      }),
    });

    if (!res.ok) {
      console.error("Failed to log reading session");
    }
  } catch (error) {
    console.error("Error logging reading session:", error);
  }
};
