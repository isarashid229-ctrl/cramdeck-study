"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { awardPoints } from "@/lib/rewards";
import { useQueryClient } from "@tanstack/react-query";

type StudyTimerProps = {
  assignmentId: string;
  userId: string;
};

export function StudyTimer({ assignmentId, userId }: StudyTimerProps) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [running]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const startSession = async () => {
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: userId,
        assignment_id: assignmentId,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to start study session");
      return;
    }
    setSessionId(data.id);
    setRunning(true);
    toast.success("Study session started");
  };

  const pauseSession = () => setRunning(false);

  const resumeSession = () => setRunning(true);

  const endSession = async () => {
    if (!sessionId) return;
    const minutes = Math.max(1, Math.round(seconds / 60));

    const { error } = await supabase
      .from("study_sessions")
      .update({
        ended_at: new Date().toISOString(),
        minutes,
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to save study session");
      return;
    }

    setRunning(false);
    setSeconds(0);
    setSessionId(null);
    try {
      await awardPoints(supabase, userId, Math.min(100, Math.max(10, minutes * 2)), "Finished study session", "study_session", sessionId);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`Logged ${minutes} minutes of study time and earned points`);
    } catch {
      toast.success(`Logged ${minutes} minutes of study time`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Study Timer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="font-mono text-4xl font-bold tracking-wider">{formatTime(seconds)}</p>
          <div className="mt-4 flex justify-center gap-2">
            {!sessionId ? (
              <Button onClick={startSession} size="sm">
                <Play className="mr-1 h-4 w-4" /> Start
              </Button>
            ) : (
              <>
                {running ? (
                  <Button onClick={pauseSession} variant="outline" size="sm">
                    <Pause className="mr-1 h-4 w-4" /> Pause
                  </Button>
                ) : (
                  <Button onClick={resumeSession} size="sm">
                    <Play className="mr-1 h-4 w-4" /> Resume
                  </Button>
                )}
                <Button onClick={endSession} variant="destructive" size="sm">
                  <Square className="mr-1 h-4 w-4" /> End
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
