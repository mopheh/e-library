"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useUserData } from "@/hooks/useUsers";
import { toast } from "sonner";

const seenKey = (userId: string) => `contribute_welcome_${userId}`;

/**
 * One-time nudge toward the contribute-material flow, shown once per user
 * on their first dashboard visit. A toast rather than a modal so it doesn't
 * stack with the (already-blocking) CourseRegistrationModal / OnboardingTour
 * that can also fire on first login.
 */
export function ContributeWelcomeNudge() {
  const router = useRouter();
  const { user } = useUser();
  const { data: userData } = useUserData();

  useEffect(() => {
    if (!user?.id || !userData) return;
    if (userData.role === "ASPIRANT") return;
    if (localStorage.getItem(seenKey(user.id))) return;

    const timer = setTimeout(() => {
      toast("Welcome to the library!", {
        id: "contribute-welcome",
        duration: 12000,
        description:
          "This library grows from student contributions. Got notes, past questions, or a textbook to share?",
        action: {
          label: "Contribute material",
          onClick: () => router.push("/library?contribute=1"),
        },
      });
      localStorage.setItem(seenKey(user.id), "1");
    }, 2500);

    return () => clearTimeout(timer);
  }, [user?.id, userData, router]);

  return null;
}
