// In development the Vite proxy forwards /api/* to localhost:5000,
// so the base URL is empty. In production builds Vite inlines the
// value from .env.production, pointing at the deployed Render API.
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
