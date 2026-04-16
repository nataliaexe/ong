import "./page.scss"
import { ApiService } from "../../js/services/ApiService.js"

const api = new ApiService()
const tokenKey = "floranimal_admin_token"

const loginCard = document.querySelector("#loginCard")
const workspace = document.querySelector("#workspace")
const adminEmail = document.querySelector("#adminEmail")
const loginForm = document.querySelector("#loginForm")
const animalForm = document.querySelector("#animalForm")
const storyForm = document.querySelector("#storyForm")
const animalsList = document.querySelector("#animalsList")
const storiesList = document.querySelector("#storiesList")
const animalCount = document.querySelector("#animalCount")
const storyCount = document.querySelector("#storyCount")

const getToken = () => localStorage.getItem(tokenKey)
const setToken = (token) => localStorage.setItem(tokenKey, token)
const clearToken = () => localStorage.removeItem(tokenKey)

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` })

const request = (endpoint, options = {}) => api.request(endpoint, {
  ...options,
  headers: {
    ...(options.headers || {}),
    ...(getToken() ? authHeaders() : {})
  }
})

const setFeedback = (id, message, isError = false) => {
  const el = document.querySelector(id)
  if (!el) return
  el.textContent = message
  el.dataset.error = isError ? "true" : "false"
}

const revealWorkspace = (email) => {
  loginCard.classList.add("hidden")
  workspace.classList.remove("hidden")
  adminEmail.textContent = email
}

const showLogin = () => {
  workspace.classList.add("hidden")
  loginCard.classList.remove("hidden")
}

const renderAnimals = (animals) => {
  animalCount.textContent = `${animals.length} itens`
  animalsList.innerHTML = animals.map((animal) => `
    <article class="item-card">
      <div>
        <strong>${animal.name}</strong>
        <span>${animal.type} • ${animal.ageLabel} • ${animal.status}</span>
      </div>
      <div class="item-actions">
        <button type="button" data-edit-animal="${animal.id}">Editar</button>
        <button type="button" data-delete-animal="${animal.id}">Excluir</button>
      </div>
    </article>
  `).join("")

  animalsList.querySelectorAll("[data-edit-animal]").forEach((button) => {
    button.addEventListener("click", async () => {
      const animalsResponse = await request("/admin/animals")
      const animal = animalsResponse.data.find((item) => item.id === Number(button.dataset.editAnimal))
      if (!animal) return
      animalForm.elements.id.value = animal.id
      animalForm.elements.name.value = animal.name
      animalForm.elements.type.value = animal.type
      animalForm.elements.ageLabel.value = animal.ageLabel
      animalForm.elements.size.value = animal.size
      animalForm.elements.gender.value = animal.gender
      animalForm.elements.status.value = animal.status
      animalForm.elements.coverVariant.value = animal.coverVariant
      animalForm.elements.tags.value = animal.tags.join(", ")
      animalForm.elements.description.value = animal.description
      window.scrollTo({ top: animalForm.offsetTop - 40, behavior: "smooth" })
    })
  })

  animalsList.querySelectorAll("[data-delete-animal]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Excluir este animal?")) return
      await request(`/admin/animals/${button.dataset.deleteAnimal}`, { method: "DELETE" })
      setFeedback("#animalFeedback", "Animal removido com sucesso.")
      await loadDashboard()
    })
  })
}

const renderStories = (stories) => {
  storyCount.textContent = `${stories.length} itens`
  storiesList.innerHTML = stories.map((story) => `
    <article class="item-card">
      <div>
        <strong>${story.name}</strong>
        <span>${story.title}</span>
      </div>
      <div class="item-actions">
        <button type="button" data-edit-story="${story.id}">Editar</button>
        <button type="button" data-delete-story="${story.id}">Excluir</button>
      </div>
    </article>
  `).join("")

  storiesList.querySelectorAll("[data-edit-story]").forEach((button) => {
    button.addEventListener("click", async () => {
      const storiesResponse = await request("/admin/adopted")
      const story = storiesResponse.data.find((item) => item.id === Number(button.dataset.editStory))
      if (!story) return
      storyForm.elements.id.value = story.id
      storyForm.elements.name.value = story.name
      storyForm.elements.title.value = story.title
      storyForm.elements.adoptionDate.value = story.adoptionDate
      storyForm.elements.coverVariant.value = story.coverVariant
      storyForm.elements.summary.value = story.summary
      window.scrollTo({ top: storyForm.offsetTop - 40, behavior: "smooth" })
    })
  })

  storiesList.querySelectorAll("[data-delete-story]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Excluir esta historia?")) return
      await request(`/admin/adopted/${button.dataset.deleteStory}`, { method: "DELETE" })
      setFeedback("#storyFeedback", "Historia removida com sucesso.")
      await loadDashboard()
    })
  })
}

const loadDashboard = async () => {
  const [animalsResponse, storiesResponse] = await Promise.all([
    request("/admin/animals"),
    request("/admin/adopted")
  ])

  renderAnimals(animalsResponse.data)
  renderStories(storiesResponse.data)
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  setFeedback("#loginFeedback", "")
  const formData = new FormData(loginForm)
  try {
    const response = await api.post("/admin/login", Object.fromEntries(formData))
    setToken(response.data.token)
    revealWorkspace(response.data.admin.email)
    await loadDashboard()
    loginForm.reset()
  } catch (error) {
    setFeedback("#loginFeedback", error.message || "Falha no login.", true)
  }
})

animalForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  const formData = new FormData(animalForm)
  const payload = Object.fromEntries(formData)
  payload.tags = String(payload.tags || "").split(",").map((item) => item.trim()).filter(Boolean)
  try {
    if (payload.id) {
      await request(`/admin/animals/${payload.id}`, { method: "PUT", body: JSON.stringify(payload) })
      setFeedback("#animalFeedback", "Animal atualizado com sucesso.")
    } else {
      delete payload.id
      await request("/admin/animals", { method: "POST", body: JSON.stringify(payload) })
      setFeedback("#animalFeedback", "Animal cadastrado com sucesso.")
    }
    animalForm.reset()
    animalForm.elements.id.value = ""
    await loadDashboard()
  } catch (error) {
    setFeedback("#animalFeedback", error.message || "Erro ao salvar animal.", true)
  }
})

storyForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  const payload = Object.fromEntries(new FormData(storyForm))
  try {
    if (payload.id) {
      await request(`/admin/adopted/${payload.id}`, { method: "PUT", body: JSON.stringify(payload) })
      setFeedback("#storyFeedback", "Historia atualizada com sucesso.")
    } else {
      delete payload.id
      await request("/admin/adopted", { method: "POST", body: JSON.stringify(payload) })
      setFeedback("#storyFeedback", "Historia cadastrada com sucesso.")
    }
    storyForm.reset()
    storyForm.elements.id.value = ""
    await loadDashboard()
  } catch (error) {
    setFeedback("#storyFeedback", error.message || "Erro ao salvar historia.", true)
  }
})

document.querySelector("#logoutBtn").addEventListener("click", () => {
  clearToken()
  showLogin()
})

document.querySelector("#resetAnimal").addEventListener("click", () => {
  animalForm.reset()
  animalForm.elements.id.value = ""
  setFeedback("#animalFeedback", "")
})

document.querySelector("#resetStory").addEventListener("click", () => {
  storyForm.reset()
  storyForm.elements.id.value = ""
  setFeedback("#storyFeedback", "")
})

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible")
      observer.unobserve(entry.target)
    }
  })
}, { threshold: 0.12 })

document.querySelectorAll("[data-reveal]").forEach((item) => observer.observe(item))

const boot = async () => {
  const token = getToken()
  if (!token) return
  try {
    const session = await request("/admin/session")
    revealWorkspace(session.data.admin.email)
    await loadDashboard()
  } catch {
    clearToken()
    showLogin()
  }
}

boot()