import "./styles/main.scss"
import { app } from "./js/core/App.js"
import { DonationForm } from "./js/components/DonationForm.js"
import { ContactForm } from "./js/components/ContactForm.js"

let hasBootstrapped = false

const setupLoader = () => {
  const loader = document.querySelector("[data-loader]")
  if (!loader) return

  const hideLoader = () => {
    loader.classList.add("is-hidden")
    window.setTimeout(() => loader.remove(), 500)
  }

  if (document.readyState === "complete") {
    hideLoader()
  } else {
    window.addEventListener("load", hideLoader, { once: true })
    window.setTimeout(hideLoader, 1800)
  }
}

const setupRevealObserver = () => {
  const elements = document.querySelectorAll("[data-reveal]")
  if (!elements.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  )

  elements.forEach((element) => observer.observe(element))
}

const setupHelper = () => {
  const toggle = document.querySelector("[data-helper-toggle]")
  const modal = document.querySelector("#paw-helper")
  const close = document.querySelector("[data-helper-close]")
  if (!toggle || !modal || !close) return

  const setOpen = (value) => {
    modal.classList.toggle("is-open", value)
    toggle.setAttribute("aria-expanded", String(value))
    modal.setAttribute("aria-hidden", String(!value))
  }

  toggle.addEventListener("click", () => {
    const isOpen = modal.classList.contains("is-open")
    setOpen(!isOpen)
  })

  close.addEventListener("click", () => setOpen(false))
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false)
  })
}

const setupCursor = () => {
  if (!window.matchMedia("(pointer:fine)").matches) return

  const cursor = document.querySelector("[data-cursor]")
  if (!cursor) return

  const activate = () => cursor.classList.add("is-visible")
  const deactivate = () => cursor.classList.remove("is-visible")

  document.addEventListener("mousemove", (event) => {
    cursor.style.left = `${event.clientX}px`
    cursor.style.top = `${event.clientY}px`
    activate()
  })

  document.addEventListener("mouseleave", deactivate)
}

const setupGlobe = () => {
  const globe = document.querySelector("[data-globe]")
  if (!globe) return

  const updateTilt = (event) => {
    const bounds = globe.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -14
    globe.style.setProperty("--globe-tilt-x", `${x.toFixed(2)}deg`)
    globe.style.setProperty("--globe-tilt-y", `${y.toFixed(2)}deg`)
  }

  const resetTilt = () => {
    globe.style.setProperty("--globe-tilt-x", "0deg")
    globe.style.setProperty("--globe-tilt-y", "0deg")
  }

  globe.addEventListener("mousemove", updateTilt)
  globe.addEventListener("mouseleave", resetTilt)
}

const bootstrap = () => {
  if (hasBootstrapped) return
  hasBootstrapped = true

  const donationBox = document.querySelector(".donation-box")
  if (donationBox) new DonationForm(donationBox)

  const contactForm = document.querySelector("#contactForm")
  if (contactForm) new ContactForm(contactForm)

  setupLoader()
  setupRevealObserver()
  setupHelper()
  setupCursor()
  setupGlobe()
}

window.addEventListener("app:ready", bootstrap)

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true })
} else {
  bootstrap()
}
