export default {
  global: { windowMs: 15 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  api: { windowMs: 60 * 1000, max: 60 },
  metrics: { windowMs: 60 * 1000, max: 10 },
  donations: { windowMs: 60 * 60 * 1000, max: 10 }
}
