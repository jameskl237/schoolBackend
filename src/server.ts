import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./infrastructure/database/prisma.js";

const startServer = async () => {
  try {
    await prisma.$connect();

    logger.info("Database connected successfully");

    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
        },
        "Server started",
      );
    });

    const shutdown = async (signal: string) => {
      logger.info(
        {
          signal,
        },
        "Shutting down server",
      );

      server.close(async () => {
        await prisma.$disconnect();

        logger.info("Database disconnected");

        process.exit(0);
      });
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    logger.fatal(
      {
        err: error,
      },
      "Failed to start server",
    );

    await prisma.$disconnect();

    process.exit(1);
  }
};

void startServer();