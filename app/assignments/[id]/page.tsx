import { AssignmentDetailClient } from "./assignment-detail-client";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssignmentDetailClient id={id} />;
}
