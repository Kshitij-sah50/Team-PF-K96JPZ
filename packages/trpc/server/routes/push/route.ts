import { z } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  pushConfig,
  registerPush,
  listPush,
  removePush,
  cancelPush,
  schedulePush,
  deliverPush,
} from "@repo/services/alerts";
const token = z.string().min(40).max(80);
async function safe<T>(job: () => Promise<T>) {
  try {
    return await job();
  } catch (cause) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: cause instanceof Error ? cause.message : "Notification request failed.",
    });
  }
}
export const pushRouter = router({
  config: publicProcedure.query(() => pushConfig()),
  register: publicProcedure
    .input(
      z.object({
        endpoint: z.url().max(2048),
        keys: z.object({ auth: z.string().min(16).max(100), p256dh: z.string().min(60).max(200) }),
      }),
    )
    .mutation(({ input }) => safe(() => registerPush(input))),
  list: publicProcedure
    .input(z.object({ token }))
    .mutation(({ input }) => safe(() => listPush(input.token))),
  remove: publicProcedure
    .input(z.object({ token }))
    .mutation(({ input }) => safe(() => removePush(input.token))),
  cancel: publicProcedure
    .input(z.object({ token, id: z.uuid() }))
    .mutation(({ input }) => safe(() => cancelPush(input.token, input.id))),
  schedule: publicProcedure
    .input(
      z.object({
        token,
        eventId: z.uuid().optional(),
        locationId: z.uuid().optional(),
        lead: z.number().int().min(0).max(1440),
      }),
    )
    .mutation(({ input }) => safe(() => schedulePush(input))),
  deliver: publicProcedure
    .input(z.object({ secret: z.string().min(32).max(200) }))
    .mutation(({ input }) => safe(() => deliverPush(input.secret))),
});
