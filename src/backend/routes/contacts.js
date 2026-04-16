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
