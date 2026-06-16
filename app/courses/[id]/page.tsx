import { CourseDetailClient } from "./course-detail-client";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetailClient id={id} />;
}

