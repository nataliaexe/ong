import { mkdir, readFile, writeFile } from "fs/promises"
import { dirname } from "path"

export class DataStoreService {
  constructor(filePath, fallbackData = []) {
    this.filePath = filePath
    this.fallbackData = fallbackData
  }

  async ensureFile() {
    await mkdir(dirname(this.filePath), { recursive: true })

    try {
      await readFile(this.filePath, "utf8")
    } catch {
      await this.writeAll(this.fallbackData)
    }
  }

  async readAll() {
    await this.ensureFile()
    const content = await readFile(this.filePath, "utf8")
    return JSON.parse(content || "[]")
  }

  async writeAll(items) {
    await mkdir(dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, JSON.stringify(items, null, 2), "utf8")
    return items
  }

  async list(sorter) {
    const items = await this.readAll()
    return sorter ? [...items].sort(sorter) : items
  }

  async getById(id) {
    const items = await this.readAll()
    return items.find((item) => item.id === id) || null
  }

  async create(payload) {
    const items = await this.readAll()
    const nextId = items.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1
    const item = { id: nextId, ...payload }
    items.push(item)
    await this.writeAll(items)
    return item
  }

  async update(id, payload) {
    const items = await this.readAll()
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return null
    items[index] = { ...items[index], ...payload, id }
    await this.writeAll(items)
    return items[index]
  }

  async remove(id) {
    const items = await this.readAll()
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return false
    items.splice(index, 1)
    await this.writeAll(items)
    return true
  }
}

export default DataStoreService
