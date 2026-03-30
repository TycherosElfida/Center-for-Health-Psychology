import { publicProcedure } from "../index";

export const healthRouter = {
  check: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "CHP Platform API is running smoothly",
    };
  }),
};
