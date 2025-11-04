import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import "dotenv/config"

const app = express()

app.use(express.json())

const raw = process.env.FRONTEND_ORIGIN || ""
const allowlist = raw.split(",").map(s => s.trim()).filter(Boolean)

// Allow common frontend origins
const allowedOrigins = [
  "https://xrl-front.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  ...allowlist
]

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // curl / healthchecks
    if (allowlist.includes(origin) || allowedOrigins.includes(origin)) return cb(null, true)
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

  // לוג של מה מתקבל בפועל לדייבוג
  console.log("=== n8n callback received ===")
  console.log("Headers:", JSON.stringify(req.headers, null, 2))
  console.log("Body type:", typeof body)
  console.log("Body keys:", body ? Object.keys(body) : "null/undefined")
  console.log("Body sample:", JSON.stringify(body, null, 2).substring(0, 500))

  // בדיקה אם body ריק או לא תקין
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ 
      error: "invalid_payload", 
      hint: "request body is empty or missing",
      received: "empty"
    })
  }

  // ניסיון לזהות את הפורמט
  let matrix = null
  let domainKeys = null
  let paramCount = null
  let meta = body.meta || {}

  // פורמט 1: { matrix: [[...]], domain_keys: [...], param_count: number }
  if (Array.isArray(body.matrix) && Array.isArray(body.domain_keys)) {
    matrix = body.matrix
    domainKeys = body.domain_keys
    paramCount = body.param_count || matrix.length
    console.log("Detected format: direct matrix array")
  }
  // פורמט 2: { matrix: { domain_keys: {...}, param_count: number, values: {...} } }
  else if (body.matrix && typeof body.matrix === "object" && body.matrix.domain_keys) {
    const matrixObj = body.matrix
    
    // domain_keys יכול להיות object {0:1, 1:2, ...} או array
    if (typeof matrixObj.domain_keys === "object" && !Array.isArray(matrixObj.domain_keys)) {
      domainKeys = Object.values(matrixObj.domain_keys).map(Number).sort((a, b) => a - b)
    } else if (Array.isArray(matrixObj.domain_keys)) {
      domainKeys = matrixObj.domain_keys.map(Number)
    } else {
      domainKeys = [1, 2, 3, 4, 5]
    }
    
    paramCount = matrixObj.param_count || 9
    
    // values יכול להיות array של arrays או object
    const values = matrixObj.values || {}
    
    if (Array.isArray(values)) {
      // אם values הוא array, זה כבר מטריצה!
      matrix = values
      console.log("Detected format: matrix object with values array")
    } else if (typeof values === "object") {
      // המרה מ-values object למטריצה
      // values הוא אובייקט שבו המפתח הוא paramIndex והערך הוא array או object של domainIndex: value
      matrix = Array.from({ length: paramCount }, () => 
        Array.from({ length: domainKeys.length }, () => null)
      )
      
      Object.keys(values).forEach((paramKey) => {
        const paramIndex = parseInt(paramKey)
        if (isNaN(paramIndex) || paramIndex < 0) return
        
        const domainValues = values[paramKey]
        
        // אם זה array
        if (Array.isArray(domainValues)) {
          domainValues.forEach((value, idx) => {
            if (idx < domainKeys.length && paramIndex < paramCount) {
              matrix[paramIndex][idx] = value
            }
          })
        }
        // אם זה object
        else if (typeof domainValues === "object") {
          Object.keys(domainValues).forEach((domainKey) => {
            const domainIndex = parseInt(domainKey)
            if (isNaN(domainIndex)) return
            const domainPos = domainKeys.indexOf(domainIndex)
            if (domainPos >= 0 && paramIndex >= 0 && paramIndex < paramCount) {
              matrix[paramIndex][domainPos] = domainValues[domainKey]
            }
          })
        }
      })
      
      console.log("Detected format: matrix object with values object")
    }
    
    console.log("Converted matrix:", {
      rows: matrix.length,
      cols: matrix[0]?.length || 0,
      sample: matrix[0]?.slice(0, 3)
    })
  }
  // פורמט 3: entries array (הישן)
  else if (Array.isArray(body.entries) || Array.isArray(body)) {
    const entries = Array.isArray(body) ? body : body.entries
    console.log("Detected format: entries array, converting to matrix")
    
    // המרה מ-entries למטריצה
    let maxParam = 0
    let maxDomain = 0
    
    entries.forEach((entry) => {
      const param = Number(entry?.parameter) || 0
      const domain = Number(entry?.index) || 0
      if (param > maxParam) maxParam = param
      if (domain > maxDomain) maxDomain = domain
    })
    
    paramCount = maxParam
    domainKeys = Array.from({ length: maxDomain }, (_, i) => i + 1)
    matrix = Array.from({ length: paramCount }, () => 
      Array.from({ length: domainKeys.length }, () => null)
    )
    
    entries.forEach((entry) => {
      const paramIndex = Number(entry?.parameter) - 1
      const domainIndex = Number(entry?.index) - 1
      const value = entry?.value
      
      if (paramIndex >= 0 && domainIndex >= 0 && 
          paramIndex < paramCount && domainIndex < domainKeys.length) {
        matrix[paramIndex][domainIndex] = typeof value === "number" ? value : Number(value)
      }
    })
  }
  else {
    return res.status(400).json({ 
      error: "invalid_payload", 
      hint: "expected one of: { matrix: [[...]], domain_keys: [...] } OR { matrix: { domain_keys: {...}, values: {...} } } OR { entries: [...] }",
      received_keys: body ? Object.keys(body) : []
    })
  }

  console.log("Normalized matrix:", {
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

  console.log("Data saved successfully")

  // שמירה גם ב-cache הישן למען תאימות לאחור
  let runId = meta?.runId || body.run_id || `n8n-${Date.now()}`
  resultsCache.set(runId, {
    runId,
    results: latestNormalized,
    receivedAt: latestNormalized.receivedAt
  })

  res.json({ ok: true, received: matrix.length, paramCount, domainCount: domainKeys.length })
})

// שליפה לפרונט - התוצאה האחרונה
app.get("/api/results/latest", (_, res) => {
  console.log("GET /api/results/latest called")
  if (!latestNormalized) {
    console.log("No data available in latestNormalized")
    return res.status(404).json({ error: "no_data" })
  }
  
  console.log("Returning latestNormalized:", {
    hasMatrix: !!latestNormalized.matrix,
    matrixLength: latestNormalized.matrix?.length,
    hasDomainKeys: !!latestNormalized.domainKeys,
    domainKeysLength: latestNormalized.domainKeys?.length,
    paramCount: latestNormalized.paramCount
  })
  
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
