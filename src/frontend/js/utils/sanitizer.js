export const sanitize = {
  html: (str) => str?.replace(/[<>]/g, "") || "",
  input: (str) => str?.trim() || "",
  email: (email) => email?.toLowerCase().trim() || ""
}
