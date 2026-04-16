import dotenv from "dotenv"
dotenv.config()

export default {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",
  cors: {
    origins: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"]
  },
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@floranimal.org",
    password: process.env.ADMIN_PASSWORD || "troque-essa-senha",
    tokenSecret: process.env.ADMIN_TOKEN_SECRET || "floranimal-dev-secret",
    tokenTtlHours: parseInt(process.env.ADMIN_TOKEN_TTL_HOURS || "12")
  }
}
