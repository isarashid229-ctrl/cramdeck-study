import { EditAssignmentClient } from "./edit-assignment-client";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditAssignmentClient id={id} />;
}
