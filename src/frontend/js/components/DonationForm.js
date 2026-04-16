import { DonationService } from "../services/DonationService.js"

export class DonationForm {
  constructor(element) {
    this.element = element
    this.service = new DonationService()
    this.init()
  }
  
  init() {
    this.element.querySelectorAll(".donate-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const amount = btn.dataset.amount
        try {
          await this.service.donate(parseInt(amount))
          alert(`Obrigado pela doacao de R$${amount}!`)
        } catch (error) {
          alert("Erro ao processar doacao.")
        }
      })
    })
  }
}

export default DonationForm
