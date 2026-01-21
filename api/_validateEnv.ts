export function validateEnv(vars: string[]) {
  const missing = vars.filter(v => !process.env[v])
  if (missing.length) {
    throw new Error("Missing ENV vars: " + missing.join(", "))
  }
}
