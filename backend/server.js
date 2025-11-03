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

// in-memory cache ל-MVP - התוצאה האחרונה בנורמליזציה חדשה
let latestNormalized = null

// עוזר לנרמול: הופך {domains:{'1':[...],...}} ל־
// { matrix, domainKeys, paramCount } כש־matrix הוא מערך דו־ממדית [domainIndex][paramIndex] = value|null
function normalizeDomainsPayload(body) {
  const domains = body?.domains || {}
  const domainKeys = ["1", "2", "3", "4", "5"]
  
  // כמה פרמטרים יש בסך הכל
  const paramCount = Object.values(domains)
    .reduce((max, arr) => {
      if (!Array.isArray(arr)) return max
      const maxParam = arr.reduce((m, item) => {
        const p = Number(item?.parameter) || 0
        return Math.max(m, p)
      }, 0)
      return Math.max(max, maxParam)
    }, 0)

  const matrix = domainKeys.map(() => Array.from({ length: paramCount }, () => null))

  domainKeys.forEach((k, di) => {
    const arr = Array.isArray(domains[k]) ? domains[k] : []
    for (const item of arr) {
      const p = Number(item?.parameter)
      const v = item?.value
      if (!Number.isInteger(p) || p <= 0) continue
      matrix[di][p - 1] = typeof v === "number" ? v : Number(v)
    }
  })

  return { matrix, domainKeys, paramCount }
}

// Helper for debugging
app.get("/api/debug/routes", (_, res) => {
  res.json({ routes: ["/api/health", "/api/n8n/callback", "/api/results/latest", "/api/debug/routes"] })
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

  // ולידציה בסיסית לפורמט החדש
  if (!req.body || !req.body.domains) {
    return res.status(400).json({ 
      error: "invalid_payload", 
      hint: "expected { domains: { '1': [ {parameter,value} ], ... } }" 
    })
  }

  // נרמול לפורמט החדש
  const normalized = normalizeDomainsPayload(req.body)
  latestNormalized = {
    receivedAt: new Date().toISOString(),
    meta: req.body.meta || {},
    ...normalized
  }

  console.log("Normalized data saved:", JSON.stringify(latestNormalized, null, 2))

  // שמירה גם ב-cache הישן למען תאימות לאחור
  let runId = req.body.meta?.runId || `n8n-${Date.now()}`
  resultsCache.set(runId, {
    runId,
    results: normalized,
    receivedAt: latestNormalized.receivedAt
  })

  return res.json({ ok: true, received: true, paramCount: normalized.paramCount })
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
