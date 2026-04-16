import { Logger } from "./Logger.js"

export class ErrorHandler {
  constructor() {
    this.logger = new Logger("ErrorHandler")
  }
  
  handleError(error, context = {}) {
    this.logger.error(error?.message || "Erro desconhecido", context)
    this.showToast(error?.message || "Algo deu errado. Tente novamente.")
  }
  
  showToast(message) {
    const toast = document.createElement("div")
    toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:#ff4757;color:white;padding:12px 20px;border-radius:8px;z-index:9999"
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 5000)
  }
}
