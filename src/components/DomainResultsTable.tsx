import { useEffect, useState } from "react"
import { fetchLatestResults } from "../lib/api"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface DomainResultsTableProps {
  domains?: string[]
}

// Parameters that should show results (indices 0-6, 8, 10)
const RESULT_PARAMETER_INDICES = [0, 1, 2, 3, 4, 5, 6, 8, 10]

// Parameter names matching the order in WeightsTable
const PARAMETER_NAMES = [
  "IPOs Worldwide",
  "M&A Worldwide", 
  "Active Companies Worldwide",
  "New Companies Worldwide",
  "Pre-Seed & Seed Worldwide",
  "Series A Worldwide",
  "Series B–C Worldwide",
  "", // index 7 - not used
  "Series A/Seed Ratio Worldwide",
  "", // index 9 - not used
  "Avg Company Age Worldwide"
]

export default function DomainResultsTable({ domains = [] }: DomainResultsTableProps) {
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadResults = async () => {
    try {
      setIsRefreshing(true)
      const result = await fetchLatestResults()
      console.log("Fetched latest results:", result)
      setData(result)
      setErr(null)
    } catch (e: any) {
      console.error("Error fetching results:", e)
      // Don't show error if it's just "no data" - that's expected
      if (e?.message && !e.message.includes("404") && !e.message.includes("no_data")) {
        setErr(e?.message || "error")
      } else {
        setErr(null)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadResults()

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      if (!loading && !isRefreshing) {
        loadResults()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="p-4">Loading…</div>
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>
  if (!data) return <div className="p-4">No data</div>

  const { matrix, domainKeys, paramCount } = data

  if (!matrix || !Array.isArray(matrix)) {
    return <div className="p-4 text-red-600">Invalid data: matrix is missing or not an array</div>
  }

  if (!domainKeys || !Array.isArray(domainKeys)) {
    return <div className="p-4 text-red-600">Invalid data: domainKeys is missing or not an array</div>
  }

  // Use domain names from props if available, otherwise use Domain 1, 2, etc.
  const domainNames = domains.length >= domainKeys.length 
    ? domainKeys.map((_, idx) => domains[idx])
    : domainKeys.map((dk) => `Domain ${dk}`)

  // Filter to only show parameters that should have results
  const resultParameters = RESULT_PARAMETER_INDICES.filter(idx => idx < paramCount)

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Domain Results</h2>
        <Button
          onClick={loadResults}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="px-3 py-2 border-b text-left">Parameter</th>
            {domainNames.map((domainName, idx) => (
              <th key={idx} className="px-3 py-2 border-b text-left">{domainName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultParameters.map((paramIndex) => {
            const paramName = PARAMETER_NAMES[paramIndex] || `Parameter ${paramIndex + 1}`
            return (
              <tr key={paramIndex} className="odd:bg-gray-50">
                <td className="px-3 py-2 border-b font-medium">{paramName}</td>
                {domainKeys.map((_, domainIndex) => {
                  const val = matrix?.[paramIndex]?.[domainIndex]
                  return (
                    <td key={domainIndex} className="px-3 py-2 border-b">
                      {val == null || Number.isNaN(val) ? "" : String(val)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
