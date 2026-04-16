import { Router } from "express"
import { rateLimiter } from "../middleware/rateLimiter.js"
import { animalsFile } from "../config/database.js"
import { DataStoreService } from "../services/DataStoreService.js"

const router = Router()
const animalsStore = new DataStoreService(animalsFile)

router.get("/", rateLimiter.api, async (req, res, next) => {
  try {
    const status = req.query.status
    const type = req.query.type

    let animals = await animalsStore.list((a, b) => a.name.localeCompare(b.name))

    if (status) animals = animals.filter((animal) => animal.status === status)
    if (type) animals = animals.filter((animal) => animal.type === type)

    res.json({ success: true, data: animals, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

router.get("/:id", rateLimiter.api, async (req, res, next) => {
  try {
    const animal = await animalsStore.getById(parseInt(req.params.id))
    if (!animal) {
      return res.status(404).json({ success: false, error: "Animal nao encontrado" })
    }
    res.json({ success: true, data: animal, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

export default router