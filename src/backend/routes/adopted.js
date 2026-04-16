import { Router } from "express"
import { rateLimiter } from "../middleware/rateLimiter.js"
import { adoptedFile } from "../config/database.js"
import { DataStoreService } from "../services/DataStoreService.js"

const router = Router()
const adoptedStore = new DataStoreService(adoptedFile)

router.get("/", rateLimiter.api, async (req, res, next) => {
  try {
    const stories = await adoptedStore.list((a, b) => (a.adoptionDate < b.adoptionDate ? 1 : -1))
    res.json({ success: true, data: stories, correlationId: req.correlationId })
  } catch (error) {
    next(error)
  }
})

export default router