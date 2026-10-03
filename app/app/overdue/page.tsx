import { redirect } from "next/navigation";

/** UD-47 Overdue became Dues. Old links land on Dues with the Overdue filter on. */
export default function OverduePage() {
  redirect("/app/dues?filter=overdue");
}
