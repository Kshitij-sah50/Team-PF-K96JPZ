import { TRPCError } from "@trpc/server";
import { listLocations, getConditions, rankedLocations } from "@repo/services/watchtower";
import { getMoonConditions } from "@repo/services/watchtower/moon";
import { searchLocations } from "@repo/services/watchtower/search";
import { z } from "../../schema";
import { publicProcedure, router } from "../../trpc";

export const watchtowerRouter = router({
  search: publicProcedure
    .input(
      z.object({ query: z.string().trim().min(2).max(80), catalogOnly: z.boolean().optional() }),
    )
    .query(async ({ input }) => {
      try {
        return await searchLocations(input.query, input.catalogOnly);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Location search is unavailable. Please try again.",
        });
      }
    }),
  moon: publicProcedure.input(z.object({ locationId: z.uuid() })).query(async ({ input }) => {
    try {
      const result = await getMoonConditions(input.locationId);
      if (result) return result;
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Moonrise data is unavailable. Please try again shortly.",
      });
    }
    throw new TRPCError({ code: "NOT_FOUND", message: "Location not found." });
  }),
  ranked: publicProcedure
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
        return await rankedLocations(input.origin);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nearby sky scores could not be loaded. Try nearest-first sorting.",
        });
      }
    }),
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
