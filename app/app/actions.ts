"use server";

import { revalidatePath } from "next/cache";
import { resetDemo as resetSharedDemo } from "@/lib/sandbox/server";

/** Reset demo (UD-34). Resets the shared demo for everyone. */
export async function resetDemo(): Promise<void> {
  await resetSharedDemo();
  revalidatePath("/app", "layout");
}
