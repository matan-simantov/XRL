import express from "express"
import cors from "cors"
import "dotenv/config"

const app = express()

app.use(express.json())

const ORIGIN = process.env.FRONTEND_ORIGIN || "*"
app.use(cors({ origin: ORIGIN, credentials: true }))

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

    const text = await r.text()
    let data = null
    try { data = JSON.parse(text) } catch {}
    return res.status(r.status).json(data ?? { raw: text })
  } catch (e) {
    console.error("n8n proxy error", e)
    return res.status(500).json({ error: "proxy_failed" })
  }
})

// Proxy endpoint for Crunchbase webhook
app.post("/api/crunchbase", async (req, res) => {
  try {
    const url = process.env.N8N_CRUNCHBASE_URL || "https://shooky5.app.n8n.cloud/webhook/xrl-crunchbase-input"
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    })
    const text = await r.text()
    let data = null
    try { data = JSON.parse(text) } catch {}
    return res.status(r.status).json(data ?? { raw: text })
  } catch (e) {
    console.error("crunchbase proxy error", e)
    return res.status(500).json({ error: "proxy_failed" })
  }
})

// Proxy endpoint for XRL_DataToPlatform webhook (without test)
app.post("/api/xrl-data-to-platform", async (req, res) => {
  try {
    const url = process.env.N8N_XRL_DATA_URL || "https://shooky5.app.n8n.cloud/webhook/XRL_DataToPlatform"
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    })
    const text = await r.text()
    let data = null
    try { data = JSON.parse(text) } catch {}
    return res.status(r.status).json(data ?? { raw: text })
  } catch (e) {
    console.error("xrl-data-to-platform proxy error", e)
    return res.status(500).json({ error: "proxy_failed" })
  }
})

// Proxy endpoint for fetching results
app.get("/api/results/:runId", async (req, res) => {
  try {
    const { runId } = req.params
    const url = process.env.N8N_RESULTS_URL || `https://shooky5.app.n8n.cloud/webhook-test/XRL_DataToPlatform`
    const r = await fetch(`${url}?runId=${runId}`)
    const text = await r.text()
    let data = null
    try { data = JSON.parse(text) } catch {}
    return res.status(r.status).json(data ?? { raw: text })
  } catch (e) {
    console.error("results proxy error", e)
    return res.status(500).json({ error: "proxy_failed" })
  }
})

const port = process.env.PORT || 10000
app.listen(port, () => console.log(`api on ${port}`))
