export const validate = (schema) => (req, res, next) => {
  try {
    if (schema) schema.parse(req.body)
    next()
  } catch (error) {
    res.status(400).json({ success: false, error: "Validation Error", details: error.errors })
  }
}
