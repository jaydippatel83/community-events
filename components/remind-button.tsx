"use client";

import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RemindButton({
  on,
  pending,
  onClick,
  className,
}: {
  on: boolean;
  pending?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={on ? "secondary" : "outline"}
      size="lg"
      aria-pressed={on}
      aria-busy={pending}
      onClick={onClick}
      className={cn("transition-colors", className)}
    >
      {on ? <BellRing className="animate-in zoom-in-50" aria-hidden /> : <Bell aria-hidden />}
      {on ? "Reminder set" : "Remind me"}
    </Button>
  );
}
