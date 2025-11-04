import { useEffect, useState } from "react"
import { fetchLatestResults } from "../lib/api"

export default function DomainResultsTable() {
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestResults()
      .then((result) => {
        console.log("Fetched latest results:", result)
        setData(result)
      })
      .catch((e) => {
        console.error("Error fetching results:", e)
        setErr(e?.message || "error")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4">Loading…</div>
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>
  if (!data) return <div className="p-4">No data</div>

  console.log("Rendering table with data:", {
    hasMatrix: !!data.matrix,
    matrixLength: data.matrix?.length,
    hasDomainKeys: !!data.domainKeys,
    domainKeysLength: data.domainKeys?.length,
    paramCount: data.paramCount
  })

  const { matrix, domainKeys, paramCount } = data

  if (!matrix || !Array.isArray(matrix)) {
    return <div className="p-4 text-red-600">Invalid data: matrix is missing or not an array</div>
  }

  if (!domainKeys || !Array.isArray(domainKeys)) {
    return <div className="p-4 text-red-600">Invalid data: domainKeys is missing or not an array</div>
  }

  if (!paramCount || paramCount <= 0) {
    return <div className="p-4 text-red-600">Invalid data: paramCount is missing or invalid</div>
  }

  // matrix[paramIndex][domainIndex] = value
  // matrix[0][0] = parameter 1, domain 1
  // matrix[0][1] = parameter 1, domain 2
  // matrix[1][0] = parameter 2, domain 1

  return (
    <div className="p-4 overflow-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="px-3 py-2 border-b text-left">Parameter</th>
            {domainKeys.map((dk: number | string) => (
              <th key={dk} className="px-3 py-2 border-b text-left">Domain {dk}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: paramCount }, (_, paramIndex) => (
            <tr key={paramIndex} className="odd:bg-gray-50">
              <td className="px-3 py-2 border-b font-medium">Parameter {paramIndex + 1}</td>
              {domainKeys.map((_, domainIndex) => {
                const val = matrix?.[paramIndex]?.[domainIndex]
                return (
                  <td key={domainIndex} className="px-3 py-2 border-b">
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

