import { saveReview } from "@/lib/life/growth";
import { getLessonsStore } from "@/lib/life/lessons";
import { getOpsStore } from "@/lib/life/ops-store";
import { reviewContext } from "@/lib/life/review";
import { dateSchema } from "@/lib/life/schemas";
import { readJson, withStore } from "@/lib/life/service";
import { israelToday } from "@/lib/life/time";

/** The week in numbers, last week's focus and the recurring reasons (`?date=` for testing). */
export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("date");
  return withStore(async (store) => ({ context: await reviewContext(store, getOpsStore(), param ? dateSchema.parse(param) : israelToday()) }));
}

/** Saves this week's review; with save_lesson, its lesson also goes to the lessons list. */
export async function PUT(request: Request) {
  const body = (await readJson(request)) as { save_lesson?: boolean; lesson?: string };
  return withStore(async (store) => {
    const review = await saveReview(store, body);
    if (body.save_lesson && review.lesson.trim().length >= 3) {
      await getLessonsStore().add({ rule: review.lesson, source: "mine" });
    }
    return { review };
  });
}
