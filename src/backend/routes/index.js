import { Router } from "express"
import healthRouter from "./health.js"
import donationsRouter from "./donations.js"
import contactsRouter from "./contacts.js"
import animalsRouter from "./animals.js"
import adoptedRouter from "./adopted.js"
import adminRouter from "./admin.js"

const router = Router()
router.use("/health", healthRouter)
router.use("/donations", donationsRouter)
router.use("/contacts", contactsRouter)
router.use("/animals", animalsRouter)
router.use("/adopted", adoptedRouter)
router.use("/admin", adminRouter)
export default router