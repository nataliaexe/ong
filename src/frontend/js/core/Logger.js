export class Logger {
  constructor(module = "App") {
    this.module = module
  }
  
  _log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.module}]`
    const logData = { ...data, module: this.module }
    
    switch(level) {
      case "error": console.error(prefix, message, logData); break
      case "warn": console.warn(prefix, message, logData); break
      case "info": console.info(prefix, message, logData); break
      default: console.log(prefix, message, logData)
    }
  }
  
  info(m, d) { this._log("info", m, d) }
  warn(m, d) { this._log("warn", m, d) }
  error(m, d) { this._log("error", m, d) }
  debug(m, d) { this._log("debug", m, d) }
}
