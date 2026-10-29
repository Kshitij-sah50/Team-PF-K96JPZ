"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, ScanLine, ZoomIn, ZoomOut } from "lucide-react";
import type { LensObject } from "~/lib/spirit-lens/model";

export function ComparisonView({
  original,
  restored,
  width,
  height,
  objects,
  selected,
  onSelect,
}: {
  original: string;
  restored?: string;
  width: number;
  height: number;
  objects: LensObject[];
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  const [split, setSplit] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [overlays, setOverlays] = useState(true);
  const [containerWidth, setContainerWidth] = useState(700);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setContainerWidth(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setZoom(1);
    setSplit(50);
  }, [original]);
  const displayWidth = Math.max(1, Math.min(containerWidth, width) * zoom);
  const displayHeight = (displayWidth * height) / width;
  return (
    <section className="lens-comparison" aria-label="Image comparison">
      <div className="lens-view-toolbar">
        <span>
          <ScanLine size={15} /> {restored ? "Before / after" : "Input preview"}
        </span>
        <div>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
            disabled={zoom === 1}
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(4, value + 0.5))}
            disabled={zoom === 4}
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              viewport.current?.scrollTo(0, 0);
            }}
          >
            Fit
          </button>
          {restored && (
            <button type="button" onClick={() => setOverlays(!overlays)} aria-pressed={overlays}>
              <Eye size={14} /> Objects
            </button>
          )}
        </div>
      </div>
      <div
        ref={viewport}
        className="lens-viewport"
        tabIndex={0}
        aria-label="Image viewport. When zoomed, drag or scroll to pan."
        onPointerDown={(event) => {
          if (zoom === 1 || (event.target as Element).closest("[data-object]")) return;
          const node = event.currentTarget;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: node.scrollLeft,
            top: node.scrollTop,
          };
          node.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          event.currentTarget.scrollLeft = drag.current.left + drag.current.x - event.clientX;
          event.currentTarget.scrollTop = drag.current.top + drag.current.y - event.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        style={{ touchAction: zoom > 1 ? "none" : "auto", cursor: zoom > 1 ? "grab" : "default" }}
      >
        <div className="lens-image-stage" style={{ width: displayWidth, height: displayHeight }}>
          {/* Browser-local blob URLs need an unoptimized native image element. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={original}
            alt="Original image working preview"
            draggable={false}
            width={width}
            height={height}
          />
          {restored && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restored}
                alt="Restored image working preview"
                className="lens-after"
                draggable={false}
                width={width}
                height={height}
                style={{ clipPath: `inset(0 0 0 ${split}%)` }}
              />
              <span className="lens-split-line" style={{ left: `${split}%` }} aria-hidden="true">
                <i>↔</i>
              </span>
              {overlays && (
                <svg
                  className="lens-object-overlay"
                  viewBox={`0 0 ${width} ${height}`}
                  aria-label="Candidate object positions"
                >
                  {objects.map((object) => (
                    <g
                      key={object.id}
                      data-object={object.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Object ${object.id}: ${object.kind}`}
                      aria-pressed={selected === object.id}
                      onClick={() => onSelect(object.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect(object.id);
                        }
                      }}
                      className={selected === object.id ? "selected" : ""}
                    >
                      <circle
                        cx={object.x}
                        cy={object.y}
                        r={Math.max(5, object.radius)}
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        x={object.x + object.radius + 2}
                        y={object.y - object.radius}
                        fontSize={(10 * width) / displayWidth}
                      >
                        {object.id}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </>
          )}
        </div>
      </div>
      {restored ? (
        <div className="lens-compare-control">
          <div>
            <span>Original preview</span>
            <span>Restored preview</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            aria-label="Before and after comparison"
            aria-valuetext={`${split}% original, ${100 - split}% restored`}
          />
          <p>Drag the slider to compare. Zoom in and drag the image to inspect the details.</p>
        </div>
      ) : (
        <p className="lens-preview-note">
          Your original file stays unchanged. Cleanup will appear here for comparison.
        </p>
      )}
    </section>
  );
}
