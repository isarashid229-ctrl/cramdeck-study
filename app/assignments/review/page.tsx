import { redirect } from "next/navigation";

/** Review is handled inline on /assignments/new — redirect there */
export default function AssignmentReviewPage() {
  redirect("/assignments/new");
}
