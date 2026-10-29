import type { CSSProperties } from "react";

export function SkyAtmosphere() {
  return (
    <>
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
