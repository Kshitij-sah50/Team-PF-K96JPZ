import { TRPCError } from "@trpc/server";
import { getCelestialEvent, listCelestialEvents, listLunarEvents } from "@repo/services/celestial";
import { publicProcedure, router } from "../../trpc";
import { z } from "../../schema";
import { issPasses } from "@repo/services/celestial/iss";

export const celestialRouter = router({
  iss: publicProcedure.input(z.object({ locationId: z.uuid() })).query(async ({ input }) => {
    try {
      return await issPasses(input.locationId);
    } catch (cause) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: cause instanceof Error ? cause.message : "ISS predictions are unavailable.",
      });
    }
  }),
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
        lunarAnchor: z
          .string()
          .regex(/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/)
          .optional(),
        type: z.enum(["MOON_PHASE", "LAUNCH", "ECLIPSE", "METEOR"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const year = Number(input.month.slice(0, 4));
      if (
        input.lunarAnchor &&
        Math.abs(Number(input.lunarAnchor.slice(0, 4)) - new Date().getUTCFullYear()) > 1
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a lunar month in the previous, current, or next year.",
        });
      if (Math.abs(year - new Date().getUTCFullYear()) > 1)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a month in the previous, current, or next year.",
        });
      try {
        return input.lunarAnchor
          ? await listLunarEvents(input.lunarAnchor, input.type)
          : await listCelestialEvents(input.month, input.type);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "The Celestial Scroll could not be loaded. Check database migrations and try again.",
        });
      }
    }),
});
