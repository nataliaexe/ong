import { logger } from "../utils/logger.js"

export class EmailService {
  async send(to, subject, html) {
    logger.info("Email would be sent", { to, subject })
    return { messageId: "test-" + Date.now() }
  }
}
