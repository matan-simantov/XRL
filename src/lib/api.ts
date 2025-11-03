const API = import.meta.env.VITE_API_URL || "https://xrl.onrender.com"

export async function ping() {
  try {
    const r = await fetch(`${API}/api/health`)
    if (!r.ok) throw new Error("Health check failed")
    return r.json()
  } catch (error) {
    console.warn("Backend health check failed (this is okay if backend is not yet deployed):", error)
    return { status: "error", message: "Backend unavailable" }
  }
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

export async function fetchResultsFromN8n(runId: string) {
  const r = await fetch(`${API}/api/results/${runId}`)
  if (!r.ok) throw new Error("Failed to fetch results")
  return r.json()
}

