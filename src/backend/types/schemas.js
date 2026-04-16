export const AnimalSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    type: { type: "string", enum: ["dog", "cat"] }
  }
}
