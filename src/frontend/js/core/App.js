import { Logger } from "./Logger.js"
import { ErrorHandler } from "./ErrorHandler.js"
import { ApiService } from "../services/ApiService.js"

class App {
  static instance = null
  
  constructor() {
    if (App.instance) return App.instance
    this.logger = new Logger("App")
    this.errorHandler = new ErrorHandler()
    this.api = new ApiService()
    this.state = { initialized: false }
    App.instance = this
  }
  
  async init() {
    if (this.state.initialized) return this
    this.logger.info("Inicializando FlorAnimal ONG")
    this.setupGlobalErrorHandlers()
    this.state.initialized = true
    window.dispatchEvent(new CustomEvent("app:ready"))
    return this
  }
  
  setupGlobalErrorHandlers() {
    window.addEventListener("error", (e) => this.errorHandler.handleError(e.error))
    window.addEventListener("unhandledrejection", (e) => this.errorHandler.handleError(e.reason))
  }
}

export const app = new App()
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => app.init())
} else {
  app.init()
}
export default App
