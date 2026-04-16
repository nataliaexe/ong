export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
    this.requests = []
  }
  
  canMakeRequest() {
    const now = Date.now()
    this.requests = this.requests.filter(t => now - t < this.timeWindow)
    if (this.requests.length >= this.maxRequests) return false
    this.requests.push(now)
    return true
  }
}
