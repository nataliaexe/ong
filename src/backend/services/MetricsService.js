export class MetricsService {
  constructor() {
    this.metrics = { requests: 0, errors: 0 }
  }
  increment(metric) { if (this.metrics[metric] !== undefined) this.metrics[metric]++ }
  getSummary() { return this.metrics }
  getAll() { return this.metrics }
  flush() {}
}
