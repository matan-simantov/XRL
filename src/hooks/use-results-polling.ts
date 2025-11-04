import { useEffect, useRef, useState } from "react"
import { fetchLatestResults } from "@/lib/api"
import { toast } from "sonner"

interface UseResultsPollingOptions {
  enabled?: boolean
  interval?: number
  onResultsReceived?: (data: any) => void
  onOpenResults?: () => void
}

export function useResultsPolling({
  enabled = false,
  interval = 5000, // 5 seconds
  onResultsReceived,
  onOpenResults
}: UseResultsPollingOptions) {
  const [hasResults, setHasResults] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<any>(null)
  const toastShownRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
      return
    }

    setIsPolling(true)
    toastShownRef.current = false

    const checkResults = async () => {
      try {
        const data = await fetchLatestResults()
        
        if (data && data.matrix && Array.isArray(data.matrix) && data.matrix.length > 0) {
          // Check if we have actual data (not just nulls)
          const hasData = data.matrix.some(row => 
            Array.isArray(row) && row.some(val => val !== null && val !== undefined)
          )

          if (hasData) {
            setHasResults(true)
            setIsPolling(false)
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }

            // Show toast only once
            if (!toastShownRef.current && onOpenResults) {
              toastShownRef.current = true
              toast.success("Results are ready!", {
                description: "The data from n8n has been processed and is now available.",
                duration: 10000,
                action: {
                  label: "View Results",
                  onClick: () => {
                    onOpenResults()
                  }
                }
              })
            }

            if (onResultsReceived) {
              onResultsReceived(data)
            }

            lastDataRef.current = data
          }
        }
      } catch (error: any) {
        // Silently handle 404 - no results yet
        if (error?.message?.includes("404") || error?.message?.includes("no_data")) {
          // Results not ready yet, continue polling
          return
        }
        console.error("Error polling for results:", error)
      }
    }

    // Check immediately
    checkResults()

    // Then check periodically
    intervalRef.current = setInterval(checkResults, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
    }
  }, [enabled, interval, onResultsReceived, onOpenResults])

  const manualRefresh = async () => {
    try {
      const data = await fetchLatestResults()
      if (data && data.matrix && Array.isArray(data.matrix) && data.matrix.length > 0) {
        const hasData = data.matrix.some(row => 
          Array.isArray(row) && row.some(val => val !== null && val !== undefined)
        )
        if (hasData) {
          setHasResults(true)
          setIsPolling(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          if (onResultsReceived) {
            onResultsReceived(data)
          }
          lastDataRef.current = data
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Error refreshing results:", error)
      return false
    }
  }

  return {
    hasResults,
    isPolling,
    lastData: lastDataRef.current,
    manualRefresh
  }
}

