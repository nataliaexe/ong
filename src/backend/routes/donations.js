import { Router } from "express"
import { rateLimiter } from "../middleware/rateLimiter.js"
import { sanitizeInput } from "../middleware/sanitizer.js"

const router = Router()
router.post("/", rateLimiter.donations, sanitizeInput, (req, res) => {
  res.json({ success: true, message: "Doacao recebida! Obrigado!", correlationId: req.correlationId })
})
export default router
