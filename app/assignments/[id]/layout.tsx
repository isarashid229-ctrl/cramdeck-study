import type React from "react";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function AssignmentRouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
