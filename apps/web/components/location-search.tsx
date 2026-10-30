"use client";
import { useEffect, useId, useState } from "react";
import { Search, MapPin, Mountain, X } from "lucide-react";
import { trpc } from "~/trpc/client";
import { useQuery } from "@tanstack/react-query";
import type { CityPlace } from "~/lib/geocoding";

export function LocationSearch({
  onDestination,
  onPlace,
}: {
  onDestination: (id: string) => void;
  onPlace: (origin: { lat: number; lng: number }, name: string) => void;
}) {
  const [value, setValue] = useState(""),
    [query, setQuery] = useState("");
  const listId = useId();
  useEffect(() => {
    const timer = setTimeout(() => setQuery(value.trim()), 350);
    return () => clearTimeout(timer);
  }, [value]);
  const search = trpc.watchtower.search.useQuery(
    { query, catalogOnly: true },
    { enabled: query.length >= 2, staleTime: 300000, retry: false },
  );
  const cities = useQuery<{ places: CityPlace[] }>({
    queryKey: ["city-suggestions", query],
    enabled: query.length >= 2,
    staleTime: 300000,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/cities?${new URLSearchParams({ query })}`, { signal });
      if (!response.ok)
        throw new Error("City search is temporarily unavailable. Please try again.");
      return response.json();
    },
  });
  const showing = value.trim().length >= 2;
  function clear() {
    setValue("");
    setQuery("");
  }
  return (
    <div className="watch-search">
      <label className="watch-search-input">
        <Search size={17} />
        <span className="sr-only">Search a city or stargazing destination</span>
        <input
          type="search"
          maxLength={80}
          placeholder="Search a city, shrine, mountain, or temple…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-controls={showing ? listId : undefined}
        />
        {value && (
          <button aria-label="Clear location search" onClick={clear}>
            <X size={14} />
          </button>
        )}
      </label>
      {showing && (
        <section
          className="watch-search-results"
          id={listId}
          aria-label="Location search results"
          aria-live="polite"
        >
          {(cities.isFetching || search.isFetching || query !== value.trim()) && (
            <p role="status">Searching the scroll…</p>
          )}
          {query === value.trim() && search.error && (
            <p role="alert">
              Catalog destinations are unavailable. City suggestions can still be selected.
            </p>
          )}
          {query === value.trim() && cities.error && <p role="alert">{cities.error.message}</p>}
          {query === value.trim() && (
            <>
              {!!search.data?.destinations.length && (
                <>
                  <h3>Catalog destinations</h3>
                  {search.data.destinations.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => {
                        onDestination(spot.id);
                        clear();
                      }}
                    >
                      <Mountain size={15} />
                      <span>
                        {spot.name}
                        <small>{spot.type}</small>
                      </span>
                      <span>View spot ↗</span>
                    </button>
                  ))}
                </>
              )}
              {!!cities.data?.places.length && (
                <>
                  <h3>Worldwide cities & places · Search nearby</h3>
                  {cities.data.places.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        onPlace({ lat: place.lat, lng: place.lng }, place.name);
                        clear();
                      }}
                    >
                      <MapPin size={15} />
                      <span>
                        {place.name}
                        <small>{place.region}</small>
                      </span>
                      <span>Nearby ↗</span>
                    </button>
                  ))}
                </>
              )}
              {!search.isFetching &&
                !cities.isFetching &&
                !search.error &&
                !cities.error &&
                search.data &&
                cities.data &&
                !search.data.destinations.length &&
                !cities.data.places.length && (
                  <p>No places match. Try a nearby city or a different spelling.</p>
                )}
              <p className="watch-search-credit">
                City search:{" "}
                <a
                  href="https://open-meteo.com/en/docs/geocoding-api"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open-Meteo / GeoNames
                </a>
                . Showing up to 20 name matches worldwide; type more of the name to narrow results.
                Nearby stargazing spots come from a separate small curated catalog.
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
