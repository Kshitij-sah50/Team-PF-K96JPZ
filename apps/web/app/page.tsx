"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Cloud,
  Droplets,
  Eye,
  LocateFixed,
  MapPin,
  Moon,
  Mountain,
  RefreshCw,
  ScrollText,
  Telescope,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { CelestialScroll } from "~/components/celestial-scroll";

const formatTime = (date: string | Date) =>
  new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function Home() {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | undefined>();
  const [radiusKm, setRadiusKm] = useState(500);
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locations = trpc.watchtower.locations.useQuery(
    { origin: origin ? { ...origin, radiusKm } : undefined },
    { staleTime: 300000, retry: 1 },
  );
  const selected =
    locations.data?.find((location) => location.id === selectedId) ?? locations.data?.[0];
  const conditions = trpc.watchtower.conditions.useQuery(
    { locationId: selected?.id ?? "" },
    { enabled: !!selected, staleTime: 300000, retry: 1 },
  );
  const data = conditions.data;
  function locate() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Location access is unavailable in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError(
          "Could not access your location. Allow location access or browse all destinations.",
        );
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }
  return (
    <div className="watchtower">
      <aside className="watch-sidebar">
        <a href="/" className="watch-brand">
          <span>月</span>
          <div>
            TSUKUYOMI<small>WATCH · 月読</small>
          </div>
        </a>
        <p className="watch-nav-label">YOUR CELESTIAL GUIDE</p>
        <nav aria-label="Main navigation">
          <a href="#watchtower" aria-current="page">
            <Mountain size={18} />
            The Watchtower <ArrowUpRight size={15} />
          </a>
          <a href="#celestial-scroll">
            <ScrollText size={18} />
            Celestial Scroll
          </a>
          <span>
            <Telescope size={18} />
            Spirit Lens<small>Coming later</small>
          </span>
        </nav>
        <div className="watch-proverb">
          <span>静寂の中に、星を見つける。</span>
          <p>
            In stillness,
            <br />
            find your stars.
          </p>
          <small>THE WAY OF THE SKY</small>
        </div>
        <div className="watch-observer">
          <span>旅</span>
          <div>
            Wandering observer<small>Your journey starts here</small>
          </div>
        </div>
      </aside>
      <main className="watch-main" id="watchtower">
        <header className="watch-topbar">
          <span>
            <i /> THE NIGHT IS YOURS TO EXPLORE
          </span>
          <Moon size={18} />
        </header>
        <section className="watch-hero">
          <div>
            <p className="watch-eyebrow">THE SAMURAI’S CELESTIAL GUIDE</p>
            <h1>
              Every night holds
              <br />a little <em>infinity.</em>
            </h1>
            <p>
              Read the heavens. Find your stillness.
              <br />
              Let the moon guide your next adventure.
            </p>
            <a href="#destinations" className="watch-primary">
              Explore the night <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="watch-sky" aria-hidden="true">
            <div className="watch-moon" />
            <span>星の道を歩む</span>
            <div className="watch-ridge back" />
            <div className="watch-ridge front" />
            <small>BENEATH ONE MOON, A THOUSAND POSSIBILITIES</small>
          </div>
        </section>
        <section id="destinations" className="watch-destinations">
          <div className="watch-section-title">
            <div>
              <p className="watch-eyebrow">THE WATCHTOWER · 望楼</p>
              <h2>Find your place beneath the stars.</h2>
            </div>
            <span>01 / EXPLORE</span>
          </div>
          <div className="watch-toolbar">
            <p>
              {origin ? "Destinations near your location" : "A small catalog. A boundless sky."}
            </p>
            <div>
              <label className="watch-radius">
                Radius{" "}
                <select
                  value={radiusKm}
                  onChange={(event) => setRadiusKm(Number(event.target.value))}
                >
                  <option value={100}>100 km</option>
                  <option value={500}>500 km</option>
                  <option value={2000}>2,000 km</option>
                  <option value={20000}>20,000 km</option>
                </select>
              </label>
              <button onClick={locate} disabled={locating}>
                <LocateFixed size={15} />
                {locating ? "Locating…" : "Near me"}
              </button>
              {origin && (
                <button
                  onClick={() => {
                    setOrigin(undefined);
                    setGeoError("");
                  }}
                >
                  Show all
                </button>
              )}
            </div>
          </div>
          {geoError && (
            <p className="watch-message" role="alert">
              {geoError}
            </p>
          )}
          {locations.isLoading && (
            <p className="watch-message" role="status">
              Opening the Watchtower…
            </p>
          )}
          {locations.error && (
            <div className="watch-message" role="alert">
              <p>{locations.error.message}</p>
              <button onClick={() => void locations.refetch()}>Try again</button>
            </div>
          )}
          {locations.data?.length === 0 && (
            <div className="watch-message">
              <p>
                {origin
                  ? "No catalog destinations within this radius. Increase it or browse all locations."
                  : "No destinations yet. Run the database seed command to add the starting catalog."}
              </p>
            </div>
          )}
          {!!locations.data?.length && (
            <div className="watch-explorer">
              <div className="watch-place-list" aria-label="Stargazing destinations">
                {locations.data.map((location, index) => (
                  <button
                    key={location.id}
                    className={selected?.id === location.id ? "chosen" : ""}
                    onClick={() => setSelectedId(location.id)}
                    aria-pressed={selected?.id === location.id}
                  >
                    <span className="watch-place-number">0{index + 1}</span>
                    <div>
                      <small>{location.type.toUpperCase()}</small>
                      <h3>{location.name}</h3>
                      <p>
                        <MapPin size={12} />
                        {location.distanceKm == null
                          ? `${location.lat.toFixed(2)}° N · ${location.lng.toFixed(2)}° E`
                          : `${Math.round(location.distanceKm).toLocaleString()} km away`}
                      </p>
                    </div>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              </div>
              <div className="watch-map">
                {selected && (
                  <iframe
                    title={`Interactive map of ${selected.name}`}
                    key={selected.id}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selected.lng - 0.3},${selected.lat - 0.2},${selected.lng + 0.3},${selected.lat + 0.2}&layer=mapnik&marker=${selected.lat},${selected.lng}`}
                  />
                )}
                <div className="watch-map-caption">
                  <span>地図 · YOUR NEXT HORIZON</span>
                  {selected && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=12/${selected.lat}/${selected.lng}`}
                    >
                      Open map ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
        {selected && (
          <section className="watch-conditions" aria-label="Nighttime weather forecast">
            <div className="watch-conditions-heading">
              <div>
                <p className="watch-eyebrow">READING THE SKY</p>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
              </div>
              <button onClick={() => void conditions.refetch()} disabled={conditions.isFetching}>
                <RefreshCw size={15} className={conditions.isFetching ? "watch-spin" : ""} />
                Refresh
              </button>
            </div>
            {conditions.isLoading && (
              <p className="watch-message" role="status">
                Reading the next nighttime forecast…
              </p>
            )}
            {conditions.error && (
              <p className="watch-message" role="alert">
                {conditions.error.message}
              </p>
            )}
            {data && !conditions.error && (
              <>
                <div className="watch-weather-grid">
                  <div className="watch-score">
                    <small>NIGHT HONOR SCORE</small>
                    <div>
                      {data.score.score}
                      <span>/100</span>
                    </div>
                    <p>Weather-only estimate</p>
                  </div>
                  <div className="watch-weather-metric">
                    <Cloud />
                    <span>{data.weather.cloudCoverPct}%</span>
                    <small>Cloud cover</small>
                  </div>
                  <div className="watch-weather-metric">
                    <Eye />
                    <span>{data.weather.visibilityKm.toFixed(1)} km</span>
                    <small>Visibility</small>
                  </div>
                  <div className="watch-weather-metric">
                    <Droplets />
                    <span>{data.weather.humidityPct}%</span>
                    <small>Humidity</small>
                  </div>
                </div>
                <div className="watch-forecast-meta">
                  <span>Forecast for {formatTime(data.weather.forecastFor)} · Your local time</span>
                  <span>
                    {data.weather.temperatureC ?? "—"} °C · Wind {data.weather.windKph ?? "—"} km/h
                  </span>
                </div>
                <p className="watch-source">
                  Fetched {formatTime(data.weather.fetchedAt)}
                  {data.cached ? " · Cached" : ""} · Weather by{" "}
                  <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                    Open-Meteo
                  </a>
                </p>
                <details className="watch-method">
                  <summary>How is this score calculated?</summary>
                  <p>
                    The next nighttime forecast hour is scored using clear sky (40 points),
                    visibility (20 points, full credit at 20 km), and dry air (15 points). The total
                    is divided by 75 and scaled to 100. Moonlight and light pollution are not yet
                    included. Forecast night begins at sunset, not astronomical darkness.
                  </p>
                  <p>
                    Components: clear sky {data.score.cloudComponent.toFixed(1)}/40 · visibility{" "}
                    {data.score.visibilityComponent.toFixed(1)}/20 · dry air{" "}
                    {data.score.humidityComponent.toFixed(1)}/15. Weather is cached for up to 30
                    minutes.
                  </p>
                </details>
              </>
            )}
          </section>
        )}
        <CelestialScroll />
        <section className="watch-note">
          <span>✧</span>
          <div>
            <p className="watch-eyebrow">A NOTE FOR THE JOURNEY</p>
            <p>Give your eyes time to adjust. The quietest wonders reveal themselves slowly.</p>
          </div>
          <span aria-hidden="true">道</span>
        </section>
        <footer className="watch-footer">
          <span>TSUKUYOMI WATCH</span>
          <span>Look up. There is a whole universe waiting.</span>
          <span>月と共に</span>
        </footer>
      </main>
    </div>
  );
}
