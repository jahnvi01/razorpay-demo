import { redirect } from "next/navigation";

// The landing page arrives in UD-28. Until then, go straight to the app.
export default function RootPage() {
  redirect("/app");
}
