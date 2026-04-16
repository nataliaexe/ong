import { Router } from "express"
const router = Router()
router.get("/", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime(), correlationId: req.correlationId })
})
export default router
