import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import "dotenv/config"

const app = express()

// Parse JSON body
app.use(express.json())

// CORS configuration - support multiple origins
const allowedOrigins = process.env.FRONTEND_ORIGIN 
  ? process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim())
  : ["*"]

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-n8n-secret"],
  exposedHeaders: ["Content-Type"]
}

app.use(cors(corsOptions))

// Handle preflight requests explicitly
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

// POST /api/n8n/callback - callback endpoint from n8n
app.post("/api/n8n/callback", async (req, res) => {
  const secret = req.header("x-n8n-secret")
  
  if (secret !== process.env.N8N_CALLBACK_SECRET) {
    return res.status(401).json({ error: "unauthorized" })
  }

  const { runId, results } = req.body

  if (!runId) {
    return res.status(400).json({ error: "missing runId" })
  }

  // Save results to cache (in production, save to database)
  // Structure: { [domain]: { [paramIndex]: value } }
  if (results && typeof results === "object") {
    resultsCache.set(runId, {
      runId,
      results,
      receivedAt: new Date().toISOString()
    })
    console.log(`Results saved for runId: ${runId}`, results)
  } else {
    console.log("n8n callback received (no results):", req.body)
  }

  return res.json({ ok: true, runId })
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
