import type React from "react";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function EditAssignmentRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
