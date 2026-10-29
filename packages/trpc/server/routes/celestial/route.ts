import { TRPCError } from "@trpc/server";
import { getCelestialEvent, listCelestialEvents } from "@repo/services/celestial";
import { publicProcedure, router } from "../../trpc";
import { z } from "../../schema";

export const celestialRouter = router({
  event: publicProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    let event;
    try {
      event = await getCelestialEvent(input.id);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Event details could not be loaded. Please try again.",
      });
    }
    return event;
  }),
  events: publicProcedure
    .input(
      z.object({
        month: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
        type: z.enum(["MOON_PHASE", "LAUNCH"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const year = Number(input.month.slice(0, 4));
      if (Math.abs(year - new Date().getUTCFullYear()) > 1)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a month in the previous, current, or next year.",
        });
      try {
        return await listCelestialEvents(input.month, input.type);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "The Celestial Scroll could not be loaded. Check database migrations and try again.",
        });
      }
    }),
});
