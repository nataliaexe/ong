import { ContactService } from "../services/ContactService.js"
import { validateForm } from "../utils/validators.js"

export class ContactForm {
  constructor(form) {
    this.form = form
    this.service = new ContactService()
    this.init()
  }
  
  init() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(this.form)
      const data = Object.fromEntries(formData)
      
      const { isValid } = validateForm(formData, {
        name: ["required"],
        email: ["required", "email"],
        message: ["required"]
      })
      
      if (!isValid) {
        alert("Preencha todos os campos corretamente.")
        return
      }
      
      try {
        await this.service.sendMessage(data)
        alert("Mensagem enviada com sucesso!")
        this.form.reset()
      } catch (error) {
        alert("Erro ao enviar mensagem.")
      }
    })
  }
}

export default ContactForm
