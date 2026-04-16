import "./page.scss"
import { ApiService } from "../../js/services/ApiService.js"

const api = new ApiService()
const book = document.querySelector("#storiesBook")
const artClass = (variant) => `art-${variant || "luna"}`

const renderStories = (stories) => {
  book.innerHTML = stories.map((story) => `
    <article class="spread">
      <div class="memory ${artClass(story.coverVariant)}">${story.name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h2>${story.name}</h2>
        <p>${story.summary}</p>
        <span class="stamp">${story.adoptionDate}</span>
      </div>
    </article>
  `).join("")
}

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
  const response = await api.get("/adopted")
  renderStories(response.data || [])
}

boot()