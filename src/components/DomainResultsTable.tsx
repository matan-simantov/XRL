import { useEffect, useState } from "react"
import { fetchLatestResults } from "../lib/api"

export default function DomainResultsTable() {
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestResults()
      .then(setData)
      .catch((e) => setErr(e?.message || "error"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4">Loading…</div>
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>
  if (!data) return <div className="p-4">No data</div>

  const { matrix, domainKeys, paramCount } = data

  return (
    <div className="p-4 overflow-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="px-3 py-2 border-b text-left">Domain</th>
            {Array.from({ length: paramCount }, (_, i) => (
              <th key={i} className="px-3 py-2 border-b text-left">Parameter {i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {domainKeys.map((dk: string, di: number) => (
            <tr key={dk} className="odd:bg-gray-50">
              <td className="px-3 py-2 border-b">Domain {dk}</td>
              {Array.from({ length: paramCount }, (_, pi) => {
                const val = matrix?.[di]?.[pi]
                return (
                  <td key={pi} className="px-3 py-2 border-b">
                    {val == null || Number.isNaN(val) ? "" : String(val)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

