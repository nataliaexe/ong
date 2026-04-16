import { v4 as uuidv4 } from "uuid"
export const correlationId = (req, res, next) => {
  req.correlationId = req.headers["x-correlation-id"] || uuidv4()
  res.setHeader("X-Correlation-Id", req.correlationId)
  next()
}
