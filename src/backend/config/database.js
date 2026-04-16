import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export const dataDir = resolve(__dirname, "../data")
export const animalsFile = resolve(dataDir, "animals.json")
export const adoptedFile = resolve(dataDir, "adopted.json")

export default {
  dataDir,
  animalsFile,
  adoptedFile
}
