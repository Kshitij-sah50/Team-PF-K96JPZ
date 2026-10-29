import { useId, type CSSProperties } from "react";

export function SkyAtmosphere() {
  const washId = useId().replace(/:/g, "");
  return (
    <>
      <svg className="watch-ink-wash" viewBox="0 0 500 280" aria-hidden="true">
        <defs>
          <filter id={washId}>
            <feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="3" seed="8" />
            <feDisplacementMap in="SourceGraphic" scale="18" />
          </filter>
        </defs>
        <path
          d="M-20 280 60 220 130 240 235 80 300 165 340 130 520 270V300H-20Z"
          fill="var(--watch-ridge-back)"
          filter={`url(#${washId})`}
        />
      </svg>
      <svg className="watch-katana-motif" viewBox="0 0 100 200" aria-hidden="true">
        <g transform="rotate(28 50 100)">
          <path d="M43 145 46 20Q48 10 55 3L56 145Z" fill="var(--watch-moon-center)" />
          <path d="M48 140 51 20" stroke="var(--watch-accent)" strokeWidth="1" />
          <path d="M32 145H67V152H32Z" fill="var(--watch-accent)" />
          <path d="M44 153H55V193H44Z" fill="var(--watch-vermilion)" />
          <path
            d="M44 157 55 165 44 173 55 181 44 189"
            fill="none"
            stroke="var(--watch-accent)"
            strokeWidth="2"
          />
        </g>
      </svg>
      <svg className="watch-sakura-branch" viewBox="0 0 220 150" aria-hidden="true">
        <path
          d="M225 10Q165 45 125 58T40 115M170 37 155 4M127 57 111 25M98 72 67 57"
          fill="none"
          stroke="var(--watch-accent)"
          strokeWidth="3"
        />
        {[
          [155, 12],
          [115, 28],
          [128, 59],
          [70, 59],
          [46, 109],
          [177, 33],
        ].map(([x, y], index) => (
          <g key={index} transform={`translate(${x} ${y})`} fill="var(--watch-petal)">
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse key={angle} cy="-6" rx="4" ry="6" transform={`rotate(${angle})`} />
            ))}
            <circle r="2" fill="var(--watch-accent)" />
          </g>
        ))}
      </svg>
      <div className="watch-stars" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <span
            key={index}
            style={
              {
                left: `${5 + ((index * 37) % 89)}%`,
                top: `${5 + ((index * 23) % 66)}%`,
                width: index % 5 === 0 ? "3px" : "2px",
                height: index % 5 === 0 ? "3px" : "2px",
                "--star-delay": `${-index * 0.7}s`,
                "--star-duration": `${3 + (index % 4)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="watch-shooting-star" aria-hidden="true" />
      <svg className="watch-constellation" viewBox="0 0 180 160" fill="none" aria-hidden="true">
        <path d="M20 118 62 89 88 109 133 58 160 26" />
        <g>
          {[
            [20, 118],
            [62, 89],
            [88, 109],
            [133, 58],
            [160, 26],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r={index % 2 ? 2 : 3} />
          ))}
        </g>
      </svg>
      <svg className="watch-torii" viewBox="0 0 120 130" aria-hidden="true">
        <path d="M8 15Q60 30 112 15L112 24Q60 38 8 24Z M14 43H106V50H14Z M28 28H37L34 122H24Z M83 28H92L96 122H86Z M55 31H65V44H55Z" />
      </svg>
    </>
  );
}

export function DriftingPetals() {
  return (
    <div className="watch-petals" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => (
        <span
          key={index}
          style={
            {
              left: `${8 + index * 14}%`,
              "--petal-delay": `${-index * 3.5}s`,
              "--petal-duration": `${18 + index * 2}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
