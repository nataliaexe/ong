import { logger } from "../utils/logger.js"
export const globalErrorHandler = (err, req, res, next) => {
  logger.error("Error:", { error: err.message, correlationId: req.correlationId })
  const status = err.statusCode || 500
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
    correlationId: req.correlationId
  })
}
