import http from "http"
const options = { host: "localhost", port: process.env.PORT || 3000, path: "/health", timeout: 2000 }
http.request(options, (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1)).end()
