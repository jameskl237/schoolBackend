import type { ErrorRequestHandler } from "express";

import { logger } from "../../config/logger.js";

import { AppError } from "./app-error.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  logger.error(
    {
      err: error,
      method: req.method,
      url: req.originalUrl,
    },
    "Request failed",
  );

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });

    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
