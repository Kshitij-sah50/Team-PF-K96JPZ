import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { watchtowerRouter } from "./routes/watchtower/route";
import { celestialRouter } from "./routes/celestial/route";
import { pushRouter } from "./routes/push/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  watchtower: watchtowerRouter,
  celestial: celestialRouter,
  push: pushRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
