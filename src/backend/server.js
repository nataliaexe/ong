import "express-async-errors"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import dotenv from "dotenv"

dotenv.config()

import config from "./config/index.js"
import { logger, requestLogger } from "./utils/logger.js"
import { correlationId } from "./middleware/correlationId.js"
import { globalErrorHandler } from "./middleware/errorHandler.js"
import { rateLimiter } from "./middleware/rateLimiter.js"
import routes from "./routes/index.js"
import { MetricsService } from "./services/MetricsService.js"

const app = express()
const metrics = new MetricsService()

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}))

app.use(cors({ origin: config.cors.origins, credentials: true }))
app.use(compression())
app.use(correlationId)
app.use(requestLogger)
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))
app.set("trust proxy", 1)
app.use(rateLimiter.global)

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    correlationId: req.correlationId
  })
})

app.get("/metrics", rateLimiter.metrics, (req, res) => {
  res.json(metrics.getAll())
})

app.use("/api", routes)

if (config.env === "production") {
  app.use(express.static("dist/frontend"))
  app.get("*", (req, res) => {
    res.sendFile("index.html", { root: "dist/frontend" })
  })
}

app.use(globalErrorHandler)

const server = app.listen(config.port, config.host, () => {
  logger.info("Servidor iniciado", { port: config.port, env: config.env })
})

process.on("SIGTERM", () => server.close(() => process.exit(0)))
process.on("SIGINT", () => server.close(() => process.exit(0)))

export default app
