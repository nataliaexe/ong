import { Logger } from "../core/Logger.js"

export class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api"
    this.logger = new Logger("ApiService")
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    try {
      const response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || "API Error")
      return data
    } catch (error) {
      this.logger.error(`API Error: ${endpoint}`, { error: error.message })
      throw error
    }
  }
  
  get(endpoint) { return this.request(endpoint, { method: "GET" }) }
  post(endpoint, data) { return this.request(endpoint, { method: "POST", body: JSON.stringify(data) }) }
  put(endpoint, data) { return this.request(endpoint, { method: "PUT", body: JSON.stringify(data) }) }
  delete(endpoint) { return this.request(endpoint, { method: "DELETE" }) }
}