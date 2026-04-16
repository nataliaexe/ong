import rateLimit from "express-rate-limit"
import config from "../config/rateLimit.js"

export const global = rateLimit({
  windowMs: config.global.windowMs,
  max: config.global.max,
  standardHeaders: true,
  legacyHeaders: false
})

export const auth = rateLimit({ windowMs: config.auth.windowMs, max: config.auth.max })
export const api = rateLimit({ windowMs: config.api.windowMs, max: config.api.max })
export const metrics = rateLimit({ windowMs: config.metrics.windowMs, max: config.metrics.max })
export const donations = rateLimit({ windowMs: config.donations.windowMs, max: config.donations.max })

export const rateLimiter = { global, auth, api, metrics, donations }
