"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Cloud,
  Droplets,
  Eye,
  LocateFixed,
  MapPin,
  Mountain,
  Pause,
  Play,
  RefreshCw,
  ScrollText,
  Telescope,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { CelestialScroll } from "~/components/celestial-scroll";
import { IssPasses } from "~/components/iss-passes";
import { BackgroundAlerts } from "~/components/background-alerts";
import { ThemeToggle } from "~/components/theme-toggle";
import { SkyAtmosphere, DriftingPetals } from "~/components/sky-atmosphere";
import { ScrollMap } from "~/components/scroll-map";
import { MoonTracker } from "~/components/moon-tracker";
import { LocationSearch } from "~/components/location-search";
import { JapaneseText } from "~/components/japanese-text";
import { NavigationLink } from "~/components/navigation-hint";

const formatTime = (date: string | Date) =>
  new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function Home() {
  const [motionPaused, setMotionPaused] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setMotionPaused(localStorage.getItem("tsukuyomi-motion") === "paused");
    } catch {
      setMotionPaused(false);
    }
  }, []);
  function toggleMotion() {
    const paused = !motionPaused;
    setMotionPaused(paused);
    try {
      localStorage.setItem("tsukuyomi-motion", paused ? "paused" : "active");
    } catch {
      /* Keep the current tab usable when storage is blocked. */
    }
  }
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | undefined>();
  const [originName, setOriginName] = useState("Your location");
  const [radiusKm, setRadiusKm] = useState(500);
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rankBySky, setRankBySky] = useState(false);
  const locations = trpc.watchtower.locations.useQuery(
    { origin: origin ? { ...origin, radiusKm } : undefined },
    { staleTime: 300000, retry: 1 },
  );
  const ranked = trpc.watchtower.ranked.useQuery(
    { origin: origin ? { ...origin, radiusKm } : undefined },
    { enabled: rankBySky, staleTime: 300000, retry: 1 },
  );
  const spots = useMemo(
    () => (rankBySky ? (ranked.data ?? locations.data) : locations.data)?.slice(0, 8) ?? [],
    [rankBySky, ranked.data, locations.data],
  );
  const selected = spots.find((location) => location.id === selectedId) ?? spots[0];
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
        setOriginName("Your location");
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
    <div
      className="watchtower"
      data-motion={motionPaused === null ? "loading" : motionPaused ? "paused" : "active"}
    >
      <DriftingPetals />
      <aside className="watch-sidebar">
        <JapaneseText
          meaning="Moon · Tsukuyomi, the Japanese moon deity"
          asChild
          touchToggle={false}
        >
          <Link href="/" className="watch-brand">
            <span>月</span>
            <div>
              TSUKUYOMI<small>WATCH · 月読</small>
            </div>
          </Link>
        </JapaneseText>
        <p className="watch-nav-label">YOUR CELESTIAL GUIDE</p>
        <nav aria-label="Main navigation">
          <NavigationLink section="watchtower" href="#watchtower" aria-current="page">
            <Mountain className="watch-nav-icon" size={18} />
            <span>The Watchtower</span><ArrowUpRight className="watch-nav-arrow" size={14} />
          </NavigationLink>
          <NavigationLink section="scroll" href="#celestial-scroll">
            <ScrollText className="watch-nav-icon" size={18} />
            <span>Celestial Scroll</span><ArrowUpRight className="watch-nav-arrow" size={14} />
          </NavigationLink>
          <NavigationLink section="lens" href="/spirit-lens">
            <Telescope className="watch-nav-icon" size={18} />
            <span>Spirit Lens</span><ArrowUpRight className="watch-nav-arrow" size={14} />
          </NavigationLink>
          <NavigationLink section="signals" href="/analysis"><Telescope className="watch-nav-icon" size={18} /><span>Signal Observatory</span><ArrowUpRight className="watch-nav-arrow" size={14} /></NavigationLink>
          <NavigationLink section="honor" href="/dojo"><ScrollText className="watch-nav-icon" size={18} /><span>Honor journal</span><ArrowUpRight className="watch-nav-arrow" size={14} /></NavigationLink>
        </nav>
        <div className="watch-proverb">
          <JapaneseText meaning="In stillness, find the stars.">
            静寂の中に、星を見つける。
          </JapaneseText>
          <p>
            In stillness,
            <br />
            find your stars.
          </p>
          <small>THE WAY OF THE SKY</small>
        </div>
        <div className="watch-observer">
          <JapaneseText meaning="Journey; travel">旅</JapaneseText>
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
          <div className="watch-topbar-actions">
            <button
              type="button"
              onClick={toggleMotion}
              disabled={motionPaused === null}
              aria-label={motionPaused ? "Resume animations" : "Pause animations"}
              aria-pressed={motionPaused === true}
              title={motionPaused ? "Resume animations" : "Pause animations"}
            >
              {motionPaused ? (
                <Play size={15} aria-hidden="true" />
              ) : (
                <Pause size={15} aria-hidden="true" />
              )}
            </button>
            <ThemeToggle />
          </div>
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
          <div className="watch-sky">
            <SkyAtmosphere />
            <div className="watch-moon" />
            <JapaneseText meaning="Walk the path of the stars">星の道を歩む</JapaneseText>
            <div className="watch-ridge back" />
            <div className="watch-ridge front" />
            <small>BENEATH ONE MOON, A THOUSAND POSSIBILITIES</small>
          </div>
        </section>
        <section id="destinations" className="watch-destinations">
          <div className="watch-section-title">
            <div>
              <p className="watch-eyebrow">
                THE WATCHTOWER ·{" "}
                <JapaneseText meaning="Watchtower; lookout tower">望楼</JapaneseText>
              </p>
              <h2>Find your place beneath the stars.</h2>
            </div>
            <span>01 / EXPLORE</span>
          </div>
          <LocationSearch
            onDestination={(id) => {
              setOrigin(undefined);
              setSelectedId(id);
              setRankBySky(false);
            }}
            onPlace={(point, name) => {
              setOrigin(point);
              setOriginName(name);
            }}
          />
          <div className="watch-toolbar">
            <p>
              {origin ? `Top destinations near ${originName}` : "A small catalog. A boundless sky."}
            </p>
            <div>
              <label className="watch-radius">
                Sort{" "}
                <select
                  value={rankBySky ? "sky" : "nearest"}
                  onChange={(event) => setRankBySky(event.target.value === "sky")}
                >
                  <option value="nearest">Nearest first</option>
                  <option value="sky">Best sky score</option>
                </select>
              </label>
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
          {rankBySky && (
            <p className="watch-map-ranking-note" role="status">
              {ranked.isFetching
                ? "Comparing nighttime forecasts for up to eight nearby destinations…"
                : "Ranked by weather-only Night Honor Score. Missing forecasts appear last."}
            </p>
          )}
          {rankBySky && ranked.error && (
            <p className="watch-message" role="alert">
              {ranked.error.message}
            </p>
          )}
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
          {!!spots.length && (
            <div className="watch-explorer">
              <div className="watch-place-list" aria-label="Stargazing destinations">
                {spots.map((location, index) => (
                  <button
                    key={location.id}
                    className={selected?.id === location.id ? "chosen" : ""}
                    onClick={() => setSelectedId(location.id)}
                    aria-pressed={selected?.id === location.id}
                  >
                    <span className="watch-place-number">0{index + 1}</span>
                    <div>
                      <small>
                        {location.type.toUpperCase()}
                        {location.nightScore !== null && ` · ${location.nightScore}/100`}
                      </small>
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
              <ScrollMap
                spots={spots}
                selectedId={selected?.id}
                origin={origin}
                onSelect={setSelectedId}
                onSearch={(point) => {
                  setOrigin(point);
                  setOriginName("the map center");
                }}
              />
            </div>
          )}
        </section>
        {selected && <MoonTracker locationId={selected.id} locationName={selected.name} />}
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
        <IssPasses locationId={selected?.id} />
        <BackgroundAlerts locationId={selected?.id} />
        <section className="watch-note">
          <span>✧</span>
          <div>
            <p className="watch-eyebrow">A NOTE FOR THE JOURNEY</p>
            <p>Give your eyes time to adjust. The quietest wonders reveal themselves slowly.</p>
          </div>
          <JapaneseText meaning="The way; a path">道</JapaneseText>
        </section>
        <footer className="watch-footer">
          <span>TSUKUYOMI WATCH</span>
          <span>Look up. There is a whole universe waiting.</span>
          <JapaneseText meaning="Together with the moon">月と共に</JapaneseText>
        </footer>
      </main>
    </div>
  );
}
