import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import "dotenv/config"

const app = express()

app.use(express.json())

const raw = process.env.FRONTEND_ORIGIN || ""
const allowlist = raw.split(",").map(s => s.trim()).filter(Boolean)

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // curl / healthchecks
    if (allowlist.includes(origin)) return cb(null, true)
    console.log("CORS blocked origin:", origin)
    return cb(new Error("Not allowed by CORS"))
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-n8n-secret"]
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))

app.get("/api/health", (_, res) => res.json({ ok: true, service: "api", timestamp: new Date().toISOString() }))

app.get("/", (_, res) => res.send("XRL backend is live"))

// Proxy endpoint for n8n main webhook
app.post("/api/n8n", async (req, res) => {
  try {
    const url = process.env.N8N_WEBHOOK_URL || "https://shooky5.app.n8n.cloud/webhook/xrl"
    if (!url) return res.status(500).json({ error: "missing N8N_WEBHOOK_URL" })

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    })

    const txt = await r.text()
    let data = null
    try { data = JSON.parse(txt) } catch {}
    return res.status(r.status).json(data ?? { raw: txt })
  } catch (e) {
    console.error("n8n proxy error", e)
    return res.status(500).json({ error: "proxy_failed" })
  }
})

// Proxy endpoint for Crunchbase webhook
app.post("/api/crunchbase", async (req, res) => {
  try {
    const url = process.env.N8N_CRUNCHBASE_URL || "https://shooky5.app.n8n.cloud/webhook/xrl-crunchbase-input"
    console.log("Proxying to Crunchbase:", url, req.body)
    
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    })
    
    const txt = await r.text()
    let data = null
    try { 
      data = JSON.parse(txt) 
    } catch (parseError) {
      console.warn("Failed to parse response as JSON:", txt.substring(0, 100))
    }
    
    return res.status(r.status).json(data ?? { raw: txt, status: r.status })
  } catch (e) {
    console.error("crunchbase proxy error", e)
    return res.status(500).json({ error: "proxy_failed", message: e.message })
  }
})

// Proxy endpoint for XRL_DataToPlatform webhook
app.post("/api/xrl-data-to-platform", async (req, res) => {
  try {
    const url = process.env.N8N_XRL_DATA_URL || "https://shooky5.app.n8n.cloud/webhook/XRL_DataToPlatform"
    console.log("Proxying to XRL DataToPlatform:", url)
    console.log("Request body:", JSON.stringify(req.body, null, 2))
    
    if (!url || url.trim() === "") {
      console.error("N8N_XRL_DATA_URL is not set or empty")
      return res.status(500).json({ error: "proxy_config_error", message: "N8N_XRL_DATA_URL not configured" })
    }
    
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    })
    
    console.log("Response status from n8n:", r.status, r.statusText)
    
    const txt = await r.text()
    console.log("Response body from n8n (first 200 chars):", txt.substring(0, 200))
    
    let data = null
    try { 
      data = JSON.parse(txt) 
    } catch (parseError) {
      console.warn("Failed to parse response as JSON:", txt.substring(0, 100))
    }
    
    // אם n8n מחזיר שגיאה, נחזיר אותה עם פרטים
    if (!r.ok) {
      console.error(`n8n returned error status ${r.status}:`, txt.substring(0, 200))
      return res.status(r.status).json({ 
        error: "n8n_error", 
        status: r.status,
        statusText: r.statusText,
        body: data ?? txt.substring(0, 200)
      })
    }
    
    return res.status(200).json(data ?? { raw: txt, status: r.status })
  } catch (e) {
    console.error("xrl-data-to-platform proxy error:", e)
    console.error("Error stack:", e.stack)
    return res.status(500).json({ 
      error: "proxy_failed", 
      message: e.message,
      stack: process.env.NODE_ENV === "development" ? e.stack : undefined
    })
  }
})


// In-memory storage for results (replace with database in production)
const resultsCache = new Map()

// in-memory cache ל-MVP - התוצאה האחרונה
let latestNormalized = null

// Helper for debugging
app.get("/api/debug/routes", (_, res) => {
  res.json({ routes: ["/api/health", "/api/n8n/callback", "/api/results/latest", "/api/debug/routes"] })
})

// POST /api/n8n/callback - callback endpoint from n8n
// CORS פתוח רק לנתיב callback כדי לא לחסום שרת→שרת
app.post("/api/n8n/callback", cors(), (req, res) => {
  const secret = req.header("x-n8n-secret")

  if (process.env.N8N_CALLBACK_SECRET && secret !== process.env.N8N_CALLBACK_SECRET)
    return res.status(401).json({ error: "unauthorized" })

  const body = req.body

  // וולידציה של הפורמט מ-n8n
  if (!body || !Array.isArray(body.matrix) || !Array.isArray(body.domain_keys)) {
    return res.status(400).json({ 
      error: "invalid_payload", 
      hint: "expected { matrix: [[...]], domain_keys: [...], param_count: number, meta: {...} }" 
    })
  }

  const matrix = body.matrix
  const domainKeys = body.domain_keys
  const paramCount = body.param_count || matrix.length
  const meta = body.meta || {}

  console.log("received matrix:", {
    rows: matrix.length,
    cols: matrix[0]?.length || 0,
    paramCount,
    domainKeys
  })

  // שמירה ב-latestNormalized
  latestNormalized = {
    receivedAt: new Date().toISOString(),
    matrix,
    domainKeys,
    paramCount,
    meta
  }

  console.log("Data saved:", {
    paramCount,
    domainCount: domainKeys.length,
    sample: matrix[0]?.slice(0, 3)
  })

  // שמירה גם ב-cache הישן למען תאימות לאחור
  let runId = meta?.runId || `n8n-${Date.now()}`
  resultsCache.set(runId, {
    runId,
    results: latestNormalized,
    receivedAt: latestNormalized.receivedAt
  })

  res.json({ ok: true, received: matrix.length, paramCount, domainCount: domainKeys.length })
})

// שליפה לפרונט - התוצאה האחרונה
app.get("/api/results/latest", (_, res) => {
  if (!latestNormalized) return res.status(404).json({ error: "no_data" })
  res.json(latestNormalized)
})

// GET /api/results/:runId - get results for a specific run
app.get("/api/results/:runId", async (req, res) => {
  try {
    const { runId } = req.params
    
    // Try to get from cache first
    const cached = resultsCache.get(runId)
    if (cached) {
      return res.json({ runId, results: cached.results, fromCache: true })
    }

    // If not in cache, try to fetch from n8n results endpoint
    const url = process.env.N8N_RESULTS_URL || "https://shooky5.app.n8n.cloud/webhook-test/XRL_DataToPlatform"
    const r = await fetch(`${url}?runId=${runId}`)
    const txt = await r.text()
    let data = null
    try { data = JSON.parse(txt) } catch {}
    return res.status(r.status).json(data ?? { raw: txt })
  } catch (e) {
    console.error("results proxy error", e)
    return res.status(500).json({ error: "proxy_failed" })
  }
})

const port = process.env.PORT || 10000
app.listen(port, () => console.log(`api on ${port}`))
