import { test } from "node:test";
import assert from "node:assert/strict";
import { findCities } from "./geocoding";

test("city suggestions query worldwide independently of the destination catalog", async () => {
  const places = await findCities("  Mumbai  ", async (input) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "geocoding-api.open-meteo.com");
    assert.equal(url.searchParams.get("name"), "Mumbai");
    assert.equal(url.searchParams.get("count"), "20");
    assert.equal(url.searchParams.has("countryCode"), false);
    return Response.json({
      results: [
        {
          id: 1275339,
          name: "Mumbai",
          latitude: 19.07283,
          longitude: 72.88261,
          country: "India",
          admin1: "Maharashtra",
        },
      ],
    });
  });
  assert.deepEqual(places, [
    { id: 1275339, name: "Mumbai", lat: 19.07283, lng: 72.88261, region: "Maharashtra, India" },
  ]);
});

test("empty city results differ from a failed or malformed provider response", async () => {
  assert.deepEqual(await findCities("Unknown", async () => Response.json({})), []);
  await assert.rejects(
    findCities("Mumbai", async () => new Response("", { status: 429 })),
    /429/,
  );
  await assert.rejects(findCities("Mumbai", async () => Response.json({ results: [{ id: 1 }] })));
  await assert.rejects(
    findCities("Mumbai", async () => {
      throw new Error("Connection failed");
    }),
    /Connection failed/,
  );
});

test("invalid city queries never reach the upstream provider", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return Response.json({});
  };
  await assert.rejects(findCities(" ", fetcher));
  await assert.rejects(findCities("a".repeat(81), fetcher));
  assert.equal(calls, 0);
});
