"use client";

import { useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg } from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import type { AssignmentPriority } from "@/types/database";
import type { CalendarAssignment } from "@/lib/hooks/use-assignments";
import { getPriorityColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { cleanAssignmentTitle, formatStudyTime } from "@/lib/assignments/presentation";

type CalendarViewProps = {
  assignments: CalendarAssignment[];
};

function CalendarEventContent({ event }: EventContentArg) {
  const priority = event.extendedProps.priority as AssignmentPriority | undefined;

  return (
    <div className="flex items-center gap-1 overflow-hidden px-0.5 py-0.5">
      {priority && (
        <span
          className={cn(
            "shrink-0 rounded px-1 text-[9px] font-bold uppercase leading-tight",
            getPriorityColor(priority)
          )}
        >
          {priority.charAt(0)}
        </span>
      )}
      <span className="truncate text-xs">{event.title}</span>
    </div>
  );
}

export function CalendarView({ assignments }: CalendarViewProps) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);

  const events = useMemo(
    () =>
      assignments
        .filter((a) => a.due_date)
        .map((a) => ({
          id: a.id,
          title: `${cleanAssignmentTitle(a.title)} · ${formatStudyTime(a.estimated_minutes)}`,
          start: a.due_date!,
          backgroundColor: a.courses?.color || "#6366f1",
          borderColor: a.courses?.color || "#6366f1",
          extendedProps: { priority: a.priority, courseName: a.courses?.name },
        })),
    [assignments]
  );

  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Priority:</span>
        {(["urgent", "high", "medium", "low"] as AssignmentPriority[]).map((p) => (
          <span key={p} className={cn("rounded-full px-2 py-0.5 capitalize", getPriorityColor(p))}>
            {p}
          </span>
        ))}
        <span className="ml-auto">Events colored by course</span>
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={typeof window !== "undefined" && window.innerWidth < 640 ? "listWeek" : "dayGridMonth"}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        events={events}
        eventContent={CalendarEventContent}
        eventClick={(info) => router.push(`/assignments/${info.event.id}`)}
        height="auto"
        eventDisplay="block"
      />
    </div>
  );
}
