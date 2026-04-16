import { AppError } from "../utils/AppError.js"
import { AuthService } from "../services/AuthService.js"

const authService = new AuthService()

export const requireAdminAuth = (req, res, next) => {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  const payload = authService.verifyToken(token)

  if (!payload || payload.role !== "admin") {
    return next(new AppError("Acesso restrito ao admin", 401))
  }

  req.admin = payload
  next()
}

export default requireAdminAuth
