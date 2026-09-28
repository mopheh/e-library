import { redirect } from "next/navigation";
import { PREMIUM_ENABLED } from "@/lib/features";
import PricingView from "./PricingView";

export default function PricingPage() {
  if (!PREMIUM_ENABLED) redirect("/dashboard");
  return <PricingView />;
}
