import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { watchtowerRouter } from "./routes/watchtower/route";
import { celestialRouter } from "./routes/celestial/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  watchtower: watchtowerRouter,
  celestial: celestialRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
