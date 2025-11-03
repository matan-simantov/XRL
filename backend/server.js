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
    console.log("Proxying to XRL DataToPlatform:", url, req.body)
    
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
    console.error("xrl-data-to-platform proxy error", e)
    return res.status(500).json({ error: "proxy_failed", message: e.message })
  }
})


// In-memory storage for results (replace with database in production)
const resultsCache = new Map()

// Helper for debugging
app.get("/api/debug/routes", (_, res) => {
  res.json({ routes: ["/api/health", "/api/n8n/callback", "/api/debug/routes"] })
})

// POST /api/n8n/callback - callback endpoint from n8n
// CORS פתוח רק לנתיב callback כדי לא לחסום שרת→שרת
app.post("/api/n8n/callback", cors(), async (req, res) => {
  console.log("callback hit headers:", JSON.stringify(req.headers))
  
  const required = process.env.N8N_CALLBACK_SECRET
  if (required) {
    const secret = req.header("x-n8n-secret")
    if (secret !== required) {
      console.log("callback unauthorized")
      return res.status(401).json({ error: "unauthorized" })
    }
  }

  console.log("callback payload:", JSON.stringify(req.body, null, 2))

  // Try to extract runId and results from different possible formats
  let runId = req.body.runId
  let results = req.body.results
  
  // If data comes in n8n format with domains object
  if (!runId && req.body.domains) {
    console.log("Detected n8n format with domains object")
    // Extract runId from meta or generate one
    runId = req.body.meta?.runId || req.body.meta?.flow || `n8n-${Date.now()}`
    
    // Convert domains object to results format
    // Expected format: { [domain]: { [paramIndex]: number } }
    results = {}
    
    if (req.body.domains && typeof req.body.domains === "object") {
      Object.keys(req.body.domains).forEach((domainKey) => {
        const domainValue = req.body.domains[domainKey]
        if (domainValue && domainValue !== "") {
          // Get domain name from key or value
          const domainName = domainKey.startsWith("Domain ") 
            ? domainValue  // If key is "Domain 1", use value as domain name
            : domainKey
          
          // If we have actual domain data, structure it properly
          // For now, store the value as parameter 0
          if (domainName && domainName !== "") {
            results[domainName] = {
              0: typeof domainValue === "string" ? parseFloat(domainValue) || 0 : domainValue
            }
          }
        }
      })
    }
    
    console.log("Converted format - runId:", runId, "results:", JSON.stringify(results, null, 2))
  }
  
  // If we still have proper runId and results format
  if (runId && results && typeof results === "object") {
    // Ensure results structure is correct: { [domain]: { [paramIndex]: number } }
    const normalizedResults = {}
    Object.keys(results).forEach((domain) => {
      const domainData = results[domain]
      if (domainData && typeof domainData === "object") {
        normalizedResults[domain] = {}
        Object.keys(domainData).forEach((key) => {
          const paramIndex = parseInt(key)
          const value = domainData[key]
          if (!isNaN(paramIndex)) {
            normalizedResults[domain][paramIndex] = typeof value === "string" 
              ? parseFloat(value) || 0 
              : (typeof value === "number" ? value : 0)
          }
        })
      }
    })

    resultsCache.set(runId, {
      runId,
      results: normalizedResults,
      receivedAt: new Date().toISOString()
    })
    console.log(`Results saved for runId: ${runId}`, JSON.stringify(normalizedResults, null, 2))
  } else {
    console.log("Warning: Missing runId or results. Full body:", JSON.stringify(req.body, null, 2))
  }

  return res.json({ ok: true, runId: runId || null, resultsReceived: !!results })
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
