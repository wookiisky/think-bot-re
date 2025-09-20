const requiredVariables = [
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "AZURE_OPENAI_KEY"
]

export const verifyEnv = () => {
  const missing = requiredVariables.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn("[script][verify-env] missing", missing)
  } else {
    console.info("[script][verify-env] all variables present")
  }
}

verifyEnv()
