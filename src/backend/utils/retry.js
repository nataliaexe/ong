export async function withRetry(fn, options = {}) {
  const { maxAttempts = 3, initialDelay = 1000 } = options
  let lastError
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, initialDelay * Math.pow(2, i)))
      }
    }
  }
  throw lastError
}
