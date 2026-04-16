import "./page.scss"
import { ApiService } from "../../js/services/ApiService.js"

const api = new ApiService()
const grid = document.querySelector("#petGrid")
const emptyState = document.querySelector("#emptyState")
const interestSelect = document.querySelector("#animalInterest")
let animals = []
let activeFilter = "todos"

const artClass = (variant) => `art-${variant || "margarida"}`
const normalizeTags = (animal) => [animal.type, animal.status, ...(animal.tags || [])]

const renderAnimals = () => {
  const filtered = animals.filter((animal) => {
    if (activeFilter === "todos") return animal.status !== "adopted"
    return normalizeTags(animal).includes(activeFilter)
  }).filter((animal) => animal.status !== "adopted")

  emptyState.hidden = filtered.length > 0
  grid.innerHTML = filtered.map((animal) => `
    <article class="pet-card" data-reveal>
      <div class="pet-card__art ${artClass(animal.coverVariant)}">${animal.name.slice(0, 2).toUpperCase()}</div>
      <div class="pet-card__body">
        <h2>${animal.name}</h2>
        <p>${animal.gender}, ${animal.ageLabel}, porte ${animal.size}. ${animal.description}</p>
        <div class="tags">${(animal.tags || []).map((tag) => `<span>${tag}</span>`).join("")}</div>
      </div>
    </article>
  `).join("")
}

const renderInterestOptions = () => {
  interestSelect.innerHTML = animals
    .filter((animal) => animal.status !== "adopted")
    .map((animal) => `<option value="${animal.id}">${animal.name}</option>`)
    .join("")
}

const setupLoader = () => {
  const loader = document.querySelector("[data-loader]")
  if (!loader) return
  const hide = () => {
    loader.classList.add("is-hidden")
    window.setTimeout(() => loader.remove(), 400)
  }
  if (document.readyState === "complete") hide()
  else {
    window.addEventListener("load", hide, { once: true })
    window.setTimeout(hide, 1200)
  }
}

const setupReveal = () => {
  const items = document.querySelectorAll("[data-reveal]")
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible")
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  items.forEach((item) => observer.observe(item))
}

const setupCursor = () => {
  if (!window.matchMedia("(pointer:fine)").matches) return
  const cursor = document.querySelector("[data-cursor]")
  if (!cursor) return
  document.addEventListener("mousemove", (event) => {
    cursor.style.left = `${event.clientX}px`
    cursor.style.top = `${event.clientY}px`
    cursor.classList.add("is-visible")
  })
  document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"))
}

const setupFilters = () => {
  const chips = [...document.querySelectorAll("[data-filter]")]
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((item) => item.classList.remove("is-active"))
      chip.classList.add("is-active")
      activeFilter = chip.dataset.filter
      renderAnimals()
    })
  })
}

const boot = async () => {
  setupLoader()
  setupCursor()
  setupFilters()
  const response = await api.get("/animals")
  animals = response.data || []
  renderAnimals()
  renderInterestOptions()
  setupReveal()
}

boot()