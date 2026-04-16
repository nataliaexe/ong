import bcrypt from "bcryptjs"
import crypto from "crypto"
import config from "../config/index.js"

const encode = (value) => Buffer.from(value).toString("base64url")
const decode = (value) => Buffer.from(value, "base64url").toString("utf8")

export class AuthService {
  async validateAdmin(email, password) {
    const normalizedEmail = email?.trim().toLowerCase()
    const expectedEmail = config.admin.email.trim().toLowerCase()

    if (normalizedEmail !== expectedEmail) return false

    if (config.admin.password.startsWith("$2")) {
      return bcrypt.compare(password, config.admin.password)
    }

    const left = Buffer.from(password || "")
    const right = Buffer.from(config.admin.password || "")

    if (left.length !== right.length) return false
    return crypto.timingSafeEqual(left, right)
  }

  createToken(payload) {
    const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    const body = encode(JSON.stringify(payload))
    const signature = crypto
      .createHmac("sha256", config.admin.tokenSecret)
      .update(`${header}.${body}`)
      .digest("base64url")

    return `${header}.${body}.${signature}`
  }

  verifyToken(token) {
    if (!token) return null

    const [header, body, signature] = token.split(".")
    if (!header || !body || !signature) return null

    const expectedSignature = crypto
      .createHmac("sha256", config.admin.tokenSecret)
      .update(`${header}.${body}`)
      .digest("base64url")

    const left = Buffer.from(signature)
    const right = Buffer.from(expectedSignature)

    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
      return null
    }

    const payload = JSON.parse(decode(body))
    if (payload.exp && Date.now() > payload.exp) return null
    return payload
  }

  issueAdminToken(email) {
    const ttlMs = config.admin.tokenTtlHours * 60 * 60 * 1000
    return this.createToken({
      sub: "admin",
      email,
      role: "admin",
      exp: Date.now() + ttlMs
    })
  }
}

export default AuthService
