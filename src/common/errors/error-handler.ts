import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

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

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.flatten().fieldErrors,
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
