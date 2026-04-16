import { ApiService } from "./ApiService.js"

export class DonationService {
  constructor() {
    this.api = new ApiService()
  }
  
  async donate(amount) {
    return this.api.post("/donations", { amount })
  }
}
