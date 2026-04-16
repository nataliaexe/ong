import { Router } from "express"
import { adoptedFile, animalsFile } from "../config/database.js"
import { rateLimiter } from "../middleware/rateLimiter.js"
import { requireAdminAuth } from "../middleware/requireAdminAuth.js"
import { sanitizeInput } from "../middleware/sanitizer.js"
import { validate } from "../middleware/validation.js"
import { AuthService } from "../services/AuthService.js"
import { DataStoreService } from "../services/DataStoreService.js"
import { adminLoginSchema, adoptedStorySchema, animalSchema } from "../validators/index.js"
import { AppError } from "../utils/AppError.js"

const router = Router()
const authService = new AuthService()
const animalsStore = new DataStoreService(animalsFile)
const adoptedStore = new DataStoreService(adoptedFile)

router.post("/login", rateLimiter.api, sanitizeInput, validate(adminLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body
    const isValid = await authService.validateAdmin(email, password)

    if (!isValid) {
      throw new AppError("Email ou senha invalidos", 401)
    }

    const token = authService.issueAdminToken(email)
    res.json({
      success: true,
      data: {
        token,
        admin: { email }
      },
      correlationId: req.correlationId
    })
  } catch (error) {
    next(error)
  }
})

router.get("/session", requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      admin: { email: req.admin.email }
    },
    correlationId: req.correlationId
  })
})

router.get("/animals", requireAdminAuth, async (req, res, next) => {
  try {
    const animals = await animalsStore.list((a, b) => a.name.localeCompare(b.name))
    res.json({ success: true, data: animals, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.post("/animals", requireAdminAuth, sanitizeInput, validate(animalSchema), async (req, res, next) => {
  try {
    const animal = await animalsStore.create(req.body)
    res.status(201).json({ success: true, data: animal, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.put("/animals/:id", requireAdminAuth, sanitizeInput, validate(animalSchema), async (req, res, next) => {
  try {
    const animal = await animalsStore.update(parseInt(req.params.id), req.body)
    if (!animal) throw new AppError("Animal nao encontrado", 404)
    res.json({ success: true, data: animal, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.delete("/animals/:id", requireAdminAuth, async (req, res, next) => {
  try {
    const removed = await animalsStore.remove(parseInt(req.params.id))
    if (!removed) throw new AppError("Animal nao encontrado", 404)
    res.json({ success: true, data: true, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.get("/adopted", requireAdminAuth, async (req, res, next) => {
  try {
    const stories = await adoptedStore.list((a, b) => (a.adoptionDate < b.adoptionDate ? 1 : -1))
    res.json({ success: true, data: stories, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.post("/adopted", requireAdminAuth, sanitizeInput, validate(adoptedStorySchema), async (req, res, next) => {
  try {
    const story = await adoptedStore.create(req.body)
    res.status(201).json({ success: true, data: story, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.put("/adopted/:id", requireAdminAuth, sanitizeInput, validate(adoptedStorySchema), async (req, res, next) => {
  try {
    const story = await adoptedStore.update(parseInt(req.params.id), req.body)
    if (!story) throw new AppError("Historia nao encontrada", 404)
    res.json({ success: true, data: story, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.delete("/adopted/:id", requireAdminAuth, async (req, res, next) => {
  try {
    const removed = await adoptedStore.remove(parseInt(req.params.id))
    if (!removed) throw new AppError("Historia nao encontrada", 404)
    res.json({ success: true, data: true, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

export default router