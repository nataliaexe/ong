import { ApiService } from "./ApiService.js"

export class ContactService {
  constructor() {
    this.api = new ApiService()
  }
  
  async sendMessage(data) {
    return this.api.post("/contacts", data)
  }
}
