# setup.ps1 - Script de instalação completa do FlorAnimal ONG (Versão Corrigida)
# Execute: .\setup.ps1

Write-Host "Iniciando setup do FlorAnimal ONG..." -ForegroundColor Magenta

# ============================================
# FUNCAO AUXILIAR PARA CRIAR ARQUIVOS
# ============================================
function Create-File {
    param(
        [string]$Path,
        [string]$Content
    )
    
    $Dir = Split-Path $Path -Parent
    if (!(Test-Path $Dir)) {
        New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    }
    
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "  OK Criado: $Path" -ForegroundColor Green
  }
# ============================================
# BACKEND - CONFIG
# ============================================
Write-Host ""
Write-Host "Criando backend/config..." -ForegroundColor Cyan

Create-File -Path "src/backend/config/index.js" -Content @'
import dotenv from "dotenv"
dotenv.config()

export default {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",
  cors: {
    origins: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"]
  }
}
'@

Create-File -Path "src/backend/config/rateLimit.js" -Content @'
export default {
  global: { windowMs: 15 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  api: { windowMs: 60 * 1000, max: 60 },
  metrics: { windowMs: 60 * 1000, max: 10 },
  donations: { windowMs: 60 * 60 * 1000, max: 10 }
}
'@

# ============================================
# BACKEND - MIDDLEWARE
# ============================================
Write-Host ""
Write-Host "Criando backend/middleware..." -ForegroundColor Cyan

Create-File -Path "src/backend/middleware/correlationId.js" -Content @'
import { v4 as uuidv4 } from "uuid"
export const correlationId = (req, res, next) => {
  req.correlationId = req.headers["x-correlation-id"] || uuidv4()
  res.setHeader("X-Correlation-Id", req.correlationId)
  next()
}
'@

Create-File -Path "src/backend/middleware/errorHandler.js" -Content @'
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
'@

Create-File -Path "src/backend/middleware/rateLimiter.js" -Content @'
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
'@

Create-File -Path "src/backend/middleware/validation.js" -Content @'
export const validate = (schema) => (req, res, next) => {
  try {
    if (schema) schema.parse(req.body)
    next()
  } catch (error) {
    res.status(400).json({ success: false, error: "Validation Error", details: error.errors })
  }
}
'@

Create-File -Path "src/backend/middleware/sanitizer.js" -Content @'
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim().replace(/[<>]/g, "")
      }
    })
  }
  next()
}
'@

Create-File -Path "src/backend/middleware/logger.js" -Content @'
export const requestLogger = (req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${Date.now() - start}ms`)
  })
  next()
}
'@

# ============================================
# BACKEND - ROUTES
# ============================================
Write-Host ""
Write-Host "Criando backend/routes..." -ForegroundColor Cyan

Create-File -Path "src/backend/routes/index.js" -Content @'
import { Router } from "express"
import healthRouter from "./health.js"
import donationsRouter from "./donations.js"
import contactsRouter from "./contacts.js"
import animalsRouter from "./animals.js"

const router = Router()
router.use("/health", healthRouter)
router.use("/donations", donationsRouter)
router.use("/contacts", contactsRouter)
router.use("/animals", animalsRouter)
export default router
'@

Create-File -Path "src/backend/routes/health.js" -Content @'
import { Router } from "express"
const router = Router()
router.get("/", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime(), correlationId: req.correlationId })
})
export default router
'@

Create-File -Path "src/backend/routes/donations.js" -Content @'
import { Router } from "express"
import { rateLimiter } from "../middleware/rateLimiter.js"
import { sanitizeInput } from "../middleware/sanitizer.js"

const router = Router()
router.post("/", rateLimiter.donations, sanitizeInput, (req, res) => {
  res.json({ success: true, message: "Doacao recebida! Obrigado!", correlationId: req.correlationId })
})
export default router
'@

Create-File -Path "src/backend/routes/contacts.js" -Content @'
import { Router } from "express"
import { rateLimiter } from "../middleware/rateLimiter.js"
import { sanitizeInput } from "../middleware/sanitizer.js"

const router = Router()
router.post("/", rateLimiter.api, sanitizeInput, (req, res) => {
  const { name, email, message } = req.body
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "Todos os campos sao obrigatorios" })
  }
  console.log(`Mensagem de ${name} (${email}): ${message}`)
  res.json({ success: true, message: "Mensagem enviada!", correlationId: req.correlationId })
})
export default router
'@

Create-File -Path "src/backend/routes/animals.js" -Content @'
import { Router } from "express"
import { rateLimiter } from "../middleware/rateLimiter.js"

const router = Router()
const animals = [
  { id: 1, name: "Margarida", type: "dog", age: 2 },
  { id: 2, name: "Jasmim", type: "cat", age: 1 },
  { id: 3, name: "Tomilho", type: "dog", age: 3 },
  { id: 4, name: "Lavanda", type: "cat", age: 0.4 }
]

router.get("/", rateLimiter.api, (req, res) => {
  res.json({ success: true, data: animals, correlationId: req.correlationId })
})

router.get("/:id", rateLimiter.api, (req, res) => {
  const animal = animals.find(a => a.id === parseInt(req.params.id))
  if (!animal) return res.status(404).json({ success: false, error: "Animal nao encontrado" })
  res.json({ success: true, data: animal, correlationId: req.correlationId })
})
export default router
'@

# ============================================
# BACKEND - SERVICES
# ============================================
Write-Host ""
Write-Host "Criando backend/services..." -ForegroundColor Cyan

Create-File -Path "src/backend/services/MetricsService.js" -Content @'
export class MetricsService {
  constructor() {
    this.metrics = { requests: 0, errors: 0 }
  }
  increment(metric) { if (this.metrics[metric] !== undefined) this.metrics[metric]++ }
  getSummary() { return this.metrics }
  getAll() { return this.metrics }
  flush() {}
}
'@

Create-File -Path "src/backend/services/EmailService.js" -Content @'
import { logger } from "../utils/logger.js"

export class EmailService {
  async send(to, subject, html) {
    logger.info("Email would be sent", { to, subject })
    return { messageId: "test-" + Date.now() }
  }
}
'@

Create-File -Path "src/backend/services/DonationService.js" -Content @'
export class DonationService {
  async processDonation(data) {
    return { success: true, transactionId: "don_" + Date.now() }
  }
}
'@

# ============================================
# BACKEND - UTILS
# ============================================
Write-Host ""
Write-Host "Criando backend/utils..." -ForegroundColor Cyan

Create-File -Path "src/backend/utils/logger.js" -Content @'
import winston from "winston"

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
)

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  ]
})

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }))
}

export const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { correlationId: req.correlationId })
  next()
}
'@

Create-File -Path "src/backend/utils/AppError.js" -Content @'
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}
'@

Create-File -Path "src/backend/utils/asyncHandler.js" -Content @'
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
'@

Create-File -Path "src/backend/utils/retry.js" -Content @'
export async function withRetry(fn, options = {}) {
  const { maxAttempts = 3, initialDelay = 1000 } = options
  let lastError
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, initialDelay * Math.pow(2, i)))
      }
    }
  }
  throw lastError
}
'@

# ============================================
# BACKEND - VALIDATORS & TYPES
# ============================================
Write-Host ""
Write-Host "Criando backend/validators e types..." -ForegroundColor Cyan

Create-File -Path "src/backend/validators/index.js" -Content @'
import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000)
})

export const donationSchema = z.object({
  amount: z.number().min(1).max(10000),
  email: z.string().email().optional()
})
'@

Create-File -Path "src/backend/types/schemas.js" -Content @'
export const AnimalSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    type: { type: "string", enum: ["dog", "cat"] }
  }
}
'@

# ============================================
# BACKEND - SERVER.JS
# ============================================
Write-Host ""
Write-Host "Criando backend/server.js..." -ForegroundColor Cyan

Create-File -Path "src/backend/server.js" -Content @'
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
'@

# ============================================
# FRONTEND - CORE
# ============================================
Write-Host ""
Write-Host "Criando frontend/js/core..." -ForegroundColor Cyan

Create-File -Path "src/frontend/js/core/App.js" -Content @'
import { Logger } from "./Logger.js"
import { ErrorHandler } from "./ErrorHandler.js"
import { ApiService } from "../services/ApiService.js"

class App {
  static instance = null
  
  constructor() {
    if (App.instance) return App.instance
    this.logger = new Logger("App")
    this.errorHandler = new ErrorHandler()
    this.api = new ApiService()
    this.state = { initialized: false }
    App.instance = this
  }
  
  async init() {
    if (this.state.initialized) return this
    this.logger.info("Inicializando FlorAnimal ONG")
    this.setupGlobalErrorHandlers()
    this.state.initialized = true
    window.dispatchEvent(new CustomEvent("app:ready"))
    return this
  }
  
  setupGlobalErrorHandlers() {
    window.addEventListener("error", (e) => this.errorHandler.handleError(e.error))
    window.addEventListener("unhandledrejection", (e) => this.errorHandler.handleError(e.reason))
  }
}

export const app = new App()
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => app.init())
} else {
  app.init()
}
export default App
'@

Create-File -Path "src/frontend/js/core/ErrorHandler.js" -Content @'
import { Logger } from "./Logger.js"

export class ErrorHandler {
  constructor() {
    this.logger = new Logger("ErrorHandler")
  }
  
  handleError(error, context = {}) {
    this.logger.error(error?.message || "Erro desconhecido", context)
    this.showToast(error?.message || "Algo deu errado. Tente novamente.")
  }
  
  showToast(message) {
    const toast = document.createElement("div")
    toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:#ff4757;color:white;padding:12px 20px;border-radius:8px;z-index:9999"
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 5000)
  }
}
'@

Create-File -Path "src/frontend/js/core/Logger.js" -Content @'
export class Logger {
  constructor(module = "App") {
    this.module = module
  }
  
  _log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.module}]`
    const logData = { ...data, module: this.module }
    
    switch(level) {
      case "error": console.error(prefix, message, logData); break
      case "warn": console.warn(prefix, message, logData); break
      case "info": console.info(prefix, message, logData); break
      default: console.log(prefix, message, logData)
    }
  }
  
  info(m, d) { this._log("info", m, d) }
  warn(m, d) { this._log("warn", m, d) }
  error(m, d) { this._log("error", m, d) }
  debug(m, d) { this._log("debug", m, d) }
}
'@

# ============================================
# FRONTEND - SERVICES
# ============================================
Write-Host ""
Write-Host "Criando frontend/js/services..." -ForegroundColor Cyan

Create-File -Path "src/frontend/js/services/ApiService.js" -Content @'
import { Logger } from "../core/Logger.js"

export class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"
    this.logger = new Logger("ApiService")
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    try {
      const response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "API Error")
      return data
    } catch (error) {
      this.logger.error(`API Error: ${endpoint}`, { error: error.message })
      throw error
    }
  }
  
  get(endpoint) { return this.request(endpoint, { method: "GET" }) }
  post(endpoint, data) { return this.request(endpoint, { method: "POST", body: JSON.stringify(data) }) }
}
'@

Create-File -Path "src/frontend/js/services/DonationService.js" -Content @'
import { ApiService } from "./ApiService.js"

export class DonationService {
  constructor() {
    this.api = new ApiService()
  }
  
  async donate(amount) {
    return this.api.post("/donations", { amount })
  }
}
'@

Create-File -Path "src/frontend/js/services/ContactService.js" -Content @'
import { ApiService } from "./ApiService.js"

export class ContactService {
  constructor() {
    this.api = new ApiService()
  }
  
  async sendMessage(data) {
    return this.api.post("/contacts", data)
  }
}
'@

# ============================================
# FRONTEND - UTILS
# ============================================
Write-Host ""
Write-Host "Criando frontend/js/utils..." -ForegroundColor Cyan

Create-File -Path "src/frontend/js/utils/validators.js" -Content @'
export const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^[\d\s\-()+]{10,}$/.test(phone),
  required: (value) => value && value.toString().trim().length > 0
}

export const validateForm = (formData, rules) => {
  const errors = {}
  Object.keys(rules).forEach(field => {
    const value = formData.get(field)
    rules[field].forEach(rule => {
      if (!validators[rule](value)) {
        errors[field] = `Campo ${field} invalido`
      }
    })
  })
  return { isValid: Object.keys(errors).length === 0, errors }
}
'@

Create-File -Path "src/frontend/js/utils/sanitizer.js" -Content @'
export const sanitize = {
  html: (str) => str?.replace(/[<>]/g, "") || "",
  input: (str) => str?.trim() || "",
  email: (email) => email?.toLowerCase().trim() || ""
}
'@

Create-File -Path "src/frontend/js/utils/rateLimiter.js" -Content @'
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
    this.requests = []
  }
  
  canMakeRequest() {
    const now = Date.now()
    this.requests = this.requests.filter(t => now - t < this.timeWindow)
    if (this.requests.length >= this.maxRequests) return false
    this.requests.push(now)
    return true
  }
}
'@

# ============================================
# FRONTEND - COMPONENTS
# ============================================
Write-Host ""
Write-Host "Criando frontend/js/components..." -ForegroundColor Cyan

Create-File -Path "src/frontend/js/components/DonationForm.js" -Content @'
import { DonationService } from "../services/DonationService.js"

export class DonationForm {
  constructor(element) {
    this.element = element
    this.service = new DonationService()
    this.init()
  }
  
  init() {
    this.element.querySelectorAll(".donate-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const amount = btn.dataset.amount
        try {
          await this.service.donate(parseInt(amount))
          alert(`Obrigado pela doacao de R$${amount}!`)
        } catch (error) {
          alert("Erro ao processar doacao.")
        }
      })
    })
  }
}

export default DonationForm
'@

Create-File -Path "src/frontend/js/components/ContactForm.js" -Content @'
import { ContactService } from "../services/ContactService.js"
import { validateForm } from "../utils/validators.js"

export class ContactForm {
  constructor(form) {
    this.form = form
    this.service = new ContactService()
    this.init()
  }
  
  init() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(this.form)
      const data = Object.fromEntries(formData)
      
      const { isValid } = validateForm(formData, {
        name: ["required"],
        email: ["required", "email"],
        message: ["required"]
      })
      
      if (!isValid) {
        alert("Preencha todos os campos corretamente.")
        return
      }
      
      try {
        await this.service.sendMessage(data)
        alert("Mensagem enviada com sucesso!")
        this.form.reset()
      } catch (error) {
        alert("Erro ao enviar mensagem.")
      }
    })
  }
}

export default ContactForm
'@

Create-File -Path "src/frontend/js/components/AnimalCard.js" -Content @'
export class AnimalCard {
  constructor(element) {
    this.element = element
  }
  
  static initAll() {
    document.querySelectorAll(".animal-card").forEach(card => new AnimalCard(card))
  }
}

export default AnimalCard
'@

# ============================================
# FRONTEND - STYLES (SCSS)
# ============================================
Write-Host ""
Write-Host "Criando frontend/styles..." -ForegroundColor Cyan

Create-File -Path "src/frontend/styles/main.scss" -Content @'
@import "abstracts/variables";
@import "abstracts/mixins";
@import "base/reset";
@import "base/typography";
@import "components/buttons";
@import "components/cards";
@import "components/forms";
@import "layout/header";
@import "layout/footer";
@import "layout/hero";
@import "layout/sections";

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Quicksand", sans-serif; background: #fdf8f4; }
'@

Create-File -Path "src/frontend/styles/abstracts/_variables.scss" -Content @'
$color-floral-pink: #f7a1c4;
$color-floral-green: #7f9f80;
$color-floral-lavender: #c3a6d1;
$color-cream: #fff7ef;
$color-green-deep: #4a6741;
$color-text: #2e3b2c;
$font-primary: "Quicksand", sans-serif;
$font-heading: "Cormorant Garamond", serif;
$mobile: 680px;
'@

Create-File -Path "src/frontend/styles/abstracts/_mixins.scss" -Content @'
@mixin mobile { @media (max-width: $mobile) { @content; } }
@mixin button-base {
  border-radius: 60px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
'@

Create-File -Path "src/frontend/styles/abstracts/_functions.scss" -Content @'
@function rem($px) { @return ($px / 16) * 1rem; }
'@

Create-File -Path "src/frontend/styles/base/_reset.scss" -Content @'
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
'@

Create-File -Path "src/frontend/styles/base/_typography.scss" -Content @'
h1, h2, h3 { font-family: $font-heading; font-weight: 600; }
h1 { font-size: 3.5rem; @include mobile { font-size: 2.5rem; } }
h2 { font-size: 2.8rem; @include mobile { font-size: 2.2rem; } }
'@

Create-File -Path "src/frontend/styles/base/_animations.scss" -Content @'
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
'@

Create-File -Path "src/frontend/styles/components/_buttons.scss" -Content @'
.btn-primary {
  @include button-base;
  background: $color-floral-pink;
  color: $color-text;
  padding: 14px 36px;
  box-shadow: 0 12px 20px -8px rgba(247, 161, 196, 0.5);
  &:hover { background: #fbb6d2; }
}
.btn-outline {
  @include button-base;
  background: transparent;
  border: 2px solid $color-floral-green;
  color: $color-green-deep;
  padding: 12px 30px;
  &:hover { background: $color-floral-green; color: white; }
}
'@

Create-File -Path "src/frontend/styles/components/_cards.scss" -Content @'
.animal-card {
  background: white;
  border-radius: 32px;
  padding: 1.8rem;
  box-shadow: 0 20px 30px -8px rgba(90, 70, 60, 0.08);
  text-align: center;
  transition: transform 0.3s;
  &:hover { transform: translateY(-8px); }
  .animal-icon { font-size: 3.8rem; margin-bottom: 15px; }
}
'@

Create-File -Path "src/frontend/styles/components/_forms.scss" -Content @'
input, textarea {
  width: 100%;
  padding: 15px 18px;
  border: 1px solid #e1cdc0;
  border-radius: 40px;
  font-family: $font-primary;
  margin-bottom: 15px;
  &:focus { border-color: $color-floral-pink; outline: none; }
}
'@

Create-File -Path "src/frontend/styles/components/_modals.scss" -Content @'
.modal { display: none; &.active { display: flex; } }
'@

Create-File -Path "src/frontend/styles/layout/_header.scss" -Content @'
header {
  padding: 1.2rem 5%;
  background: rgba(255, 247, 239, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid $color-floral-pink;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    i { font-size: 2.4rem; color: $color-floral-pink; }
    span { font-size: 1.9rem; font-family: $font-heading; color: $color-green-deep; }
  }
  
  nav ul {
    display: flex;
    gap: 2.2rem;
    list-style: none;
    li a {
      text-decoration: none;
      font-weight: 600;
      color: #3a4e35;
      &:hover { color: $color-floral-pink; }
    }
  }
  
  @include mobile {
    flex-direction: column;
    gap: 12px;
    nav ul { gap: 1rem; }
  }
}
'@

Create-File -Path "src/frontend/styles/layout/_footer.scss" -Content @'
footer {
  background: #2b3a26;
  color: #f0e7dd;
  padding: 2.5rem 5%;
  text-align: center;
  border-top: 6px solid $color-floral-pink;
}
'@

Create-File -Path "src/frontend/styles/layout/_hero.scss" -Content @'
.hero {
  padding: 4rem 5%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2.5rem;
  background: linear-gradient(145deg, #fffaf5, #f7efe8);
  
  .hero-text {
    flex: 1 1 350px;
    p { font-size: 1.3rem; margin: 1.5rem 0; }
  }
  
  .hero-image {
    flex: 1 1 320px;
    img { max-width: 100%; border-radius: 40% 60% 30% 70% / 50% 40% 60% 50%; }
  }
  
  .floral-divider {
    width: 130px;
    height: 4px;
    background: repeating-linear-gradient(90deg, $color-floral-pink 0px, $color-floral-pink 8px, transparent 8px, transparent 16px);
    margin: 20px 0;
  }
}
'@

Create-File -Path "src/frontend/styles/layout/_sections.scss" -Content @'
section { padding: 5rem 5%; }
.section-title {
  font-size: 2.8rem;
  color: $color-green-deep;
  margin-bottom: 1rem;
  i { color: $color-floral-pink; margin-right: 12px; }
}
.animals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}
.donation-box {
  background: linear-gradient(120deg, #fbf1ea, #f9e7dd);
  padding: 2.5rem;
  border-radius: 30px;
  text-align: center;
}
.donation-options {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin: 2rem 0;
}
.donate-btn {
  background: white;
  border: none;
  padding: 16px 32px;
  border-radius: 60px;
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 6px 0 #b29484;
  transition: 0.15s;
  &:hover { transform: translateY(-3px); box-shadow: 0 9px 0 #9f8173; }
}
.sobre-stats {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
  font-size: 1.2rem;
}
.contact-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #e8f0e2;
  border-radius: 20px;
}
.btn-header {
  background: $color-floral-green;
  color: white;
  padding: 10px 22px;
  border-radius: 40px;
  text-decoration: none;
}
'@

# ============================================
# ARQUIVOS RAIZ
# ============================================
Write-Host ""
Write-Host "Criando arquivos raiz..." -ForegroundColor Cyan

Create-File -Path "src/frontend/main.js" -Content @'
import "./styles/main.scss"
import { app } from "./js/core/App.js"
import { DonationForm } from "./js/components/DonationForm.js"
import { ContactForm } from "./js/components/ContactForm.js"

window.addEventListener("app:ready", () => {
  console.log("FlorAnimal ONG - Aplicacao inicializada!")
  
  const donationBox = document.querySelector(".donation-box")
  if (donationBox) new DonationForm(donationBox)
  
  const contactForm = document.querySelector("#contactForm")
  if (contactForm) new ContactForm(contactForm)
})
'@

Create-File -Path "src/frontend/index.html" -Content @'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlorAnimal - ONG de Animais</title>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&amp;family=Cormorant+Garamond:wght@500;600&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <header>
        <div class="logo">
            <i class="fas fa-seedling"></i>
            <span>Flor<i class="fas fa-paw"></i>Animal</span>
        </div>
        <nav>
            <ul>
                <li><a href="#home">Inicio</a></li>
                <li><a href="#sobre">Sobre</a></li>
                <li><a href="#adotar">Adotar</a></li>
                <li><a href="#doar">Doar</a></li>
                <li><a href="#contato">Contato</a></li>
            </ul>
        </nav>
        <a href="#doar" class="btn-header">Apoie</a>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="hero-text">
                <h1>Cultivando amor <br>entre flores e patas</h1>
                <div class="floral-divider"></div>
                <p>Resgatamos e cuidamos de animais com muito carinho.</p>
                <div class="hero-buttons">
                    <a href="#adotar" class="btn-primary">Quero adotar</a>
                    <a href="#doar" class="btn-outline">Doar agora</a>
                </div>
            </div>
            <div class="hero-image">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Ccircle cx='200' cy='180' r='100' fill='%23fbe3d2'/%3E%3Ctext x='130' y='340' font-size='32' fill='%234a6741'%3E* F *%3C/text%3E%3C/svg%3E" alt="Pet com flores">
            </div>
        </section>

        <section id="sobre">
            <h2 class="section-title"><i class="fas fa-spa"></i> Nossa essencia</h2>
            <p>Acreditamos que cada animal merece um jardim seguro para florescer.</p>
            <div class="sobre-stats">
                <div>Cães resgatados: 237</div>
                <div>Gatos salvos: 189</div>
            </div>
        </section>

        <section id="adotar">
            <h2 class="section-title"><i class="fas fa-paw"></i> Amigos esperando</h2>
            <div class="animals-grid">
                <div class="animal-card"><div class="animal-icon">🐕</div><h3>Margarida</h3><p>Femea - 2 anos</p></div>
                <div class="animal-card"><div class="animal-icon">🐈</div><h3>Jasmim</h3><p>Femea - 1 ano</p></div>
                <div class="animal-card"><div class="animal-icon">🐕</div><h3>Tomilho</h3><p>Macho - 3 anos</p></div>
                <div class="animal-card"><div class="animal-icon">🐱</div><h3>Lavanda</h3><p>Femea - 4 meses</p></div>
            </div>
        </section>

        <section id="doar">
            <h2 class="section-title"><i class="fas fa-hand-holding-heart"></i> Cultive esperanca</h2>
            <div class="donation-box">
                <h3>Doe e faca florescer</h3>
                <div class="donation-options">
                    <button class="donate-btn" data-amount="20">R$ 20</button>
                    <button class="donate-btn" data-amount="50">R$ 50</button>
                    <button class="donate-btn" data-amount="100">R$ 100</button>
                </div>
                <p>PIX: floranimal@ong.org</p>
            </div>
        </section>

        <section id="contato">
            <h2 class="section-title"><i class="fas fa-envelope"></i> Fale conosco</h2>
            <form id="contactForm">
                <input type="text" name="name" placeholder="Seu nome" required>
                <input type="email" name="email" placeholder="E-mail" required>
                <textarea name="message" placeholder="Mensagem" required></textarea>
                <button type="submit" class="btn-primary">Enviar</button>
            </form>
            <div class="contact-info">
                <p><i class="fas fa-phone"></i> (11) 98765-4321</p>
                <p><i class="fab fa-whatsapp"></i> (11) 91234-5678</p>
            </div>
        </section>
    </main>

    <footer>
        <p>FlorAnimal - ONG de protecao animal</p>
        <p>"Onde ha amor, ha vida e flores."</p>
    </footer>

    <script type="module" src="./main.js"></script>
</body>
</html>
'@

Create-File -Path ".env.example" -Content @'
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
VITE_API_URL=http://localhost:3000/api
'@

Create-File -Path ".gitignore" -Content @'
node_modules/
dist/
logs/
.env
.DS_Store
*.log
'@

Create-File -Path "scripts/healthcheck.js" -Content @'
import http from "http"
const options = { host: "localhost", port: process.env.PORT || 3000, path: "/health", timeout: 2000 }
http.request(options, (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1)).end()
'@

Create-File -Path "logs/.gitkeep" -Content ""

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SETUP COMPLETO! Todos os arquivos criados." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Execute: npm install" -ForegroundColor White
Write-Host "  2. Execute: Copy-Item .env.example .env" -ForegroundColor White
Write-Host "  3. Execute: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "FlorAnimal ONG estara disponivel em http://localhost:5173" -ForegroundColor Magenta