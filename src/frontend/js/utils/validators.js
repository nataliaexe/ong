export const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^[\d\s\-()+]{10,}$/.test(phone),
  required: (value) => value && value.toString().trim().length > 0
}

export const validateForm = (formData, rules) => {
  const errors = {}
  Object.keys(rules).forEach(field => {
    const value = formData.get(field)
    rules[field].forEach(rule => {
      if (!validators[rule](value)) {
        errors[field] = `Campo ${field} invalido`
      }
    })
  })
  return { isValid: Object.keys(errors).length === 0, errors }
}
