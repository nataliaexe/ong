import "./page.scss"

const loader = document.querySelector("[data-loader]")
const hide = () => {
  if (!loader) return
  loader.classList.add("is-hidden")
  window.setTimeout(() => loader.remove(), 350)
}
window.addEventListener("load", hide, { once: true })
window.setTimeout(hide, 1200)

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible")
      observer.unobserve(entry.target)
    }
  })
}, { threshold: 0.12 })

document.querySelectorAll("[data-reveal]").forEach((item) => observer.observe(item))