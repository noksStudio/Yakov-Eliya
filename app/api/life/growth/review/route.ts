import { saveReview } from "@/lib/life/growth";
import { getLessonsStore } from "@/lib/life/lessons";
import { readJson, withStore } from "@/lib/life/service";

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
