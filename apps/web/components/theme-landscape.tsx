import { SkyAtmosphere } from "./sky-atmosphere";
import "~/app/theme-landscape.css";
export function ThemeLandscape() {
  return (
    <div className="theme-landscape" aria-hidden="true">
      <SkyAtmosphere />
      <div className="theme-landscape-moon" />
    </div>
  );
}
