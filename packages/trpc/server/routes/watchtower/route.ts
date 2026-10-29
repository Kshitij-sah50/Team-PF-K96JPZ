import { TRPCError } from "@trpc/server";
import { listLocations, getConditions } from "@repo/services/watchtower";
import { z } from "../../schema";
import { publicProcedure, router } from "../../trpc";

export const watchtowerRouter = router({
  locations: publicProcedure
    .input(
      z.object({
        origin: z
          .object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
            radiusKm: z.number().min(1).max(20000),
          })
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await listLocations(input.origin);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Locations could not be loaded. Check database setup and migrations.",
        });
      }
    }),
  conditions: publicProcedure.input(z.object({ locationId: z.uuid() })).query(async ({ input }) => {
    let conditions;
    try {
      conditions = await getConditions(input.locationId);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Night conditions are unavailable. Please try again shortly.",
      });
    }
    if (!conditions) throw new TRPCError({ code: "NOT_FOUND", message: "Location not found." });
    return conditions;
  }),
});
