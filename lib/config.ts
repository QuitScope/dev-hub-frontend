export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  },
  app: {
    name: "Developer Hub",
    version: "1.0.0",
  },
} as const

export type Config = typeof config
