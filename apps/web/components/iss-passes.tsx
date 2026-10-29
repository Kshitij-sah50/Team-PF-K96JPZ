"use client";
import { trpc } from "~/trpc/client";
import { downloadEventCalendar } from "~/lib/event-calendar";
export function IssPasses({ locationId }: { locationId?: string }) {
  const query = trpc.celestial.iss.useQuery(
    { locationId: locationId ?? "" },
    { enabled: !!locationId, staleTime: 900000, retry: 0 },
  );
  return (
    <section className="celestial-scroll">
      <p className="watch-eyebrow">ISS · NEXT THREE DAYS</p>
      <h2>Catch a traveller crossing the sky.</h2>
      <p className="lens-help">
        For the selected Watchtower destination: elevation above 10°, Sun below −6°, and station
        mostly sunlit. SGP4 predictions use CelesTrak orbital data at 20-second resolution. Weather
        and orbital manoeuvres can change visibility.
      </p>
      {query.isLoading && <p role="status">Calculating ISS passes…</p>}
      {query.error && (
        <div className="watch-message" role="alert">
          {query.error.message}
          <button onClick={() => void query.refetch()}>Retry orbital data</button>
        </div>
      )}
      {query.data && (
        <>
          <p className="lens-help">
            {query.data.locationName} · orbital epoch {new Date(query.data.epoch).toLocaleString()}
          </p>
          {query.data.passes.length === 0 && (
            <p className="watch-message">No qualifying visible passes in the next three days.</p>
          )}
          {query.data.passes.map((pass) => (
            <article className="watch-note" key={pass.start}>
              <div>
                <h3>ISS visible pass · {Math.round(pass.maxElevation)}° maximum elevation</h3>
                <p>
                  {new Date(pass.start).toLocaleString()} –{" "}
                  {new Date(pass.end).toLocaleTimeString()}
                </p>
                <button
                  onClick={() =>
                    downloadEventCalendar({
                      id: `iss-${locationId}-${pass.start}`,
                      title: `ISS pass · ${query.data.locationName}`,
                      startUtc: pass.start,
                      endUtc: pass.end,
                      description:
                        "Predicted visible ISS segment; recheck orbital data before observing.",
                    })
                  }
                >
                  Add pass to calendar
                </button>
              </div>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
