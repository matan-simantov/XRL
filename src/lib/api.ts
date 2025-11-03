export const API = import.meta.env.VITE_API_URL || "https://xrl.onrender.com"

export async function ping() {
  const r = await fetch(`${API}/api/health`)
  if (!r.ok) throw new Error("health_failed")
  return r.json()
}

export async function runFlow(payload: any) {
  const r = await fetch(`${API}/api/n8n`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error("n8n_error")
  return r.json().catch(() => ({}))
}

export async function sendToN8n(payload: any) {
  const r = await fetch(`${API}/api/n8n`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error("n8n error")
  return r.json().catch(() => ({}))
}

export async function sendToCrunchbase(payload: any) {
  const r = await fetch(`${API}/api/crunchbase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error("crunchbase error")
  return r.json().catch(() => ({}))
}

export async function sendToXRLDataToPlatform(payload: any) {
  const r = await fetch(`${API}/api/xrl-data-to-platform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error("xrl-data-to-platform error")
  return r.json().catch(() => ({}))
}

export async function sendToXRLDataToPlatformDirect(payload: any) {
  // Send via backend proxy
  const r = await fetch(`${API}/api/xrl-data-to-platform`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error("XRL_DataToPlatform error")
  return r.json().catch(() => ({}))
}

export async function fetchResultsFromN8n(runId: string) {
  const r = await fetch(`${API}/api/results/${runId}`)
  if (!r.ok) throw new Error("Failed to fetch results")
  const data = await r.json()
  
  // If we got results, update localStorage
  if (data && data.results && typeof data.results === "object") {
    try {
      const session = getSession()
      if (session) {
        updateRunTableState(session.username, runId, { resultData: data.results })
      }
    } catch (error) {
      console.warn("Failed to update localStorage with results:", error)
    }
  }
  
  return data
}

function getSession(): any {
  try {
    if (typeof window === "undefined") return null
    const sessionStr = localStorage.getItem("xrl:session")
    if (!sessionStr) return null
    return JSON.parse(sessionStr)
  } catch {
    return null
  }
}

function updateRunTableState(username: string, runId: string, updates: { resultData?: any }) {
  try {
    if (typeof window === "undefined") return
    const runsKey = `xrl:${username}:runs`
    const runsStr = localStorage.getItem(runsKey)
    if (!runsStr) return
    
    const runs = JSON.parse(runsStr)
    const runIndex = runs.findIndex((r: any) => r.id === runId)
    if (runIndex === -1) return
    
    if (!runs[runIndex].tableState) {
      runs[runIndex].tableState = {}
    }
    
    if (updates.resultData) {
      runs[runIndex].tableState.resultData = updates.resultData
    }
    
    localStorage.setItem(runsKey, JSON.stringify(runs))
  } catch (error) {
    console.error("Failed to update run table state:", error)
  }
}

