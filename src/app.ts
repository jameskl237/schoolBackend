import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { errorHandler } from "./common/errors/error-handler.js";
import { logger } from "./config/logger.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import healthRouter from "./routes/health.routes.js";

const app = express();

app.use(
  pinoHttp({
    logger,
  }),
);

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(compression());

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(healthRouter);

app.use(notFoundMiddleware);

app.use(errorHandler);

export default app;
