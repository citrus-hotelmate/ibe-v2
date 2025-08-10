// lib/tokenManager.ts
interface StoredTokens {
  accessToken: string
  refreshToken: string
  createdAt: number
}

let currentAccessToken: string | null = null
let currentRefreshToken: string | null = null

function loadStoredTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("ibeToken")
  if (!raw) return null
  return JSON.parse(raw) as StoredTokens
}

function saveTokens(tokens: StoredTokens) {
  currentAccessToken = tokens.accessToken
  currentRefreshToken = tokens.refreshToken
  if (typeof window !== "undefined") {
    localStorage.setItem("ibeToken", JSON.stringify(tokens))
  }
}

export function seedInitialTokens(accessToken: string, refreshToken: string) {
  saveTokens({ accessToken, refreshToken, createdAt: Date.now() })
}

async function fetchNewTokens(): Promise<string> {
  const stored = loadStoredTokens()
  if (!stored) {
    throw new Error("No stored tokens to refresh. Please call seedInitialTokens(...) first.")
  }

  const res = await fetch("https://api.hotelmate.app/api/Auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
    }),
  })

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`)
  }

  const json = await res.json()
  const next: StoredTokens = {
    accessToken: json.accessToken,
    refreshToken: json.refreshToken,
    createdAt: Date.now(),
  }
  saveTokens(next)
  return next.accessToken
}

export async function getToken(): Promise<string> {
  if (currentAccessToken) {
    return currentAccessToken
  }
  const stored = loadStoredTokens()
  if (stored && Date.now() - stored.createdAt < 5 * 60 * 1000) {
    currentAccessToken = stored.accessToken
    currentRefreshToken = stored.refreshToken
    return currentAccessToken
  }
  return fetchNewTokens()
}

export async function refreshToken(): Promise<string> {
  return fetchNewTokens()
}

export function clearTokens() {
  currentAccessToken = null
  currentRefreshToken = null
  if (typeof window !== "undefined") {
    localStorage.removeItem("ibeToken")
    localStorage.clear()
    sessionStorage.clear()
  }
}
