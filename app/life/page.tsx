import { Suspense } from "react";
import { ScheduleHome } from "@/components/life/ScheduleHome";

export default function LifeTodayPage() {
  return (
    <Suspense>
      <ScheduleHome />
    </Suspense>
  );
}
