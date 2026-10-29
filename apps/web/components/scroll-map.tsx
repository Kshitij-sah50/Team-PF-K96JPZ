"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Maximize2, MapPin } from "lucide-react";

type Spot = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
  nightScore?: number | null;
};
type Props = {
  spots: Spot[];
  selectedId?: string;
  origin?: { lat: number; lng: number };
  onSelect: (id: string) => void;
  onSearch: (origin: { lat: number; lng: number }) => void;
};
const paths: Record<string, string> = {
  shrine: '<path d="M5 7Q16 12 27 7M7 15H25M10 10 9 28M22 10 23 28M14 12V15M18 12V15"/>',
  temple:
    '<path d="M5 12 16 6 27 12ZM7 20 16 15 25 20ZM8 28H24M11 21V28M21 21V28M16 2V6M12 13V16M20 13V16"/>',
  mountain: '<path d="M3 27 13 8 22 27ZM17 17 22 10 30 27H22M9 16 13 19 16 15"/>',
  observatory: '<path d="M5 18A11 11 0 0 1 27 18ZM7 19V28H25V19M16 7V18M12 3H20M16 3V7"/>',
  park: '<path d="M16 3 7 16H12L5 24H27L20 16H25ZM16 24V30"/>',
};
const markerSvg = (type: string) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type] ?? paths.mountain}</svg>`;

export function ScrollMap({ spots, selectedId, origin, onSelect, onSearch }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const library = useRef<typeof Leaflet | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const callback = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [fitVersion, setFitVersion] = useState(0);
  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    let canceled = false;
    let resize: ResizeObserver | undefined;
    const abort = new AbortController();
    import("leaflet")
      .then(async (L) => {
        if (canceled || !container.current) return;
        library.current = L;
        const instance = L.map(container.current, {
          zoomControl: false,
          scrollWheelZoom: false,
          minZoom: 2,
          maxZoom: 12,
          maxBounds: [
            [-85, -180],
            [85, 180],
          ],
          maxBoundsViscosity: 1,
          zoomAnimation: false,
          fadeAnimation: false,
        }).setView([26, 79], 4);
        map.current = instance;
        const updatePosition = () => {
          if (container.current) {
            const center = instance.getCenter();
            container.current.dataset.zoom = String(instance.getZoom());
            container.current.dataset.center = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
          }
        };
        instance.on("moveend zoomend", updatePosition);
        updatePosition();
        L.control.zoom({ position: "topright" }).addTo(instance);
        L.control.scale({ position: "bottomleft", imperial: false }).addTo(instance);
        instance.attributionControl.addAttribution(
          'Outlines: <a href="https://www.naturalearthdata.com/">Natural Earth</a>',
        );
        resize = new ResizeObserver(() => {
          instance.invalidateSize({ pan: false });
          setFitVersion((version) => version + 1);
        });
        resize.observe(container.current);
        setReady(true);
        try {
          const response = await fetch("/world-outline.geojson", { signal: abort.signal });
          if (!response.ok) throw new Error("Map outline unavailable");
          const geojson = await response.json();
          if (canceled) return;
          L.geoJSON(geojson, {
            style: { color: "#82683e", weight: 1, fillColor: "#b6a578", fillOpacity: 0.25 },
            onEachFeature(feature, layer) {
              const name = feature.properties?.NAME;
              if (typeof name === "string") {
                const text = document.createElement("span");
                text.textContent = name;
                layer.bindTooltip(text, { sticky: true, className: "scroll-country-label" });
              }
            },
          }).addTo(instance);
        } catch {
          if (!canceled)
            setError(
              "Geographic outlines could not load. Location markers still show their coordinates.",
            );
        }
      })
      .catch(() => {
        if (!canceled)
          setError("The map could not load. You can still select a destination from the list.");
      });
    return () => {
      canceled = true;
      abort.abort();
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const L = library.current,
      instance = map.current;
    if (!ready || !L || !instance) return;
    const group = L.layerGroup().addTo(instance);
    markers.current.clear();
    spots.forEach((spot, index) => {
      const icon = L.divIcon({
        className: "scroll-spot-marker",
        html: `<span class="scroll-marker-glyph">${markerSvg(spot.type)}</span><span class="scroll-marker-rank">${index + 1}</span>`,
        iconSize: [40, 46],
        iconAnchor: [20, 40],
        popupAnchor: [0, -36],
      });
      const marker = L.marker([spot.lat, spot.lng], {
        icon,
        title: `${spot.name} · ${spot.type}`,
        keyboard: true,
      }).addTo(group);
      const popup = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = spot.name;
      popup.append(heading);
      const detail = document.createElement("p");
      detail.textContent = `${spot.type}${spot.distanceKm === null ? "" : ` · ${Math.round(spot.distanceKm)} km away`}${spot.nightScore == null ? "" : ` · Sky score ${spot.nightScore}/100`}`;
      popup.append(detail);
      marker.bindPopup(popup, { autoPan: false, className: "scroll-spot-popup" });
      marker.on("click", () => callback.current(spot.id));
      marker.getElement()?.setAttribute("aria-label", `Select ${spot.name}, ${spot.type}`);
      markers.current.set(spot.id, marker);
    });
    if (origin)
      L.circleMarker([origin.lat, origin.lng], {
        radius: 7,
        color: "#a62e35",
        fillColor: "#a62e35",
        fillOpacity: 1,
        weight: 3,
      })
        .bindTooltip("Search origin")
        .addTo(group);
    const coordinates: Leaflet.LatLngTuple[] = spots.map((spot) => [spot.lat, spot.lng]);
    if (origin) coordinates.push([origin.lat, origin.lng]);
    if (coordinates.length)
      instance.fitBounds(L.latLngBounds(coordinates), {
        padding: [45, 45],
        maxZoom: 9,
        animate: false,
      });
    return () => {
      group.remove();
      markers.current.clear();
    };
  }, [ready, spots, origin, fitVersion]);
  useEffect(() => {
    if (!ready || !map.current) return;
    markers.current.forEach((marker, id) => {
      marker.getElement()?.classList.toggle("selected", id === selectedId);
      marker.getElement()?.setAttribute("aria-pressed", String(id === selectedId));
    });
    const selected = selectedId ? markers.current.get(selectedId) : undefined;
    if (selected) {
      selected.openPopup();
      if (!map.current.getBounds().contains(selected.getLatLng()))
        map.current.panTo(selected.getLatLng(), { animate: false });
    }
  }, [ready, selectedId, spots, fitVersion]);
  return (
    <div className="scroll-map-shell">
      <div className="scroll-map-ribbon">
        <span>星見の地図 · THE STARGAZER’S SCROLL</span>
        <span>北 N ↑</span>
      </div>
      <div
        className="scroll-map-canvas"
        ref={container}
        role="region"
        aria-label="Interactive stargazing map. Drag to pan and use plus or minus to zoom."
      />
      {!ready && !error && (
        <p className="scroll-map-loading" role="status">
          Unfurling the map…
        </p>
      )}
      <div className="scroll-map-actions">
        <button disabled={!ready} onClick={() => setFitVersion((version) => version + 1)}>
          <Maximize2 size={13} />
          Fit spots
        </button>
        <button
          disabled={!ready}
          onClick={() => {
            const center = map.current?.getCenter();
            if (center) onSearch({ lat: center.lat, lng: center.lng });
          }}
        >
          <MapPin size={13} />
          Search this area
        </button>
      </div>
      <div className="scroll-map-legend">
        {[
          { type: "shrine", label: "Shrine" },
          { type: "mountain", label: "Mountain" },
          { type: "temple", label: "Temple" },
          { type: "observatory", label: "Observatory" },
        ].map((item) => (
          <span key={item.type}>
            <svg
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: paths[item.type] ?? "" }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <p className="scroll-map-footnote">
        Drag to explore · + / − to zoom · Select a marker for conditions. Country outlines are
        approximate; this is not a route map.
      </p>
      {error && (
        <p className="scroll-map-error" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
