import { redirect } from "next/navigation";

// Home page is disabled — redirect to household dashboard
export default function DashboardPage() {
  redirect("/dashboard/household");
}
