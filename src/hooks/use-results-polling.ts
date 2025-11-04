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
  const foundResultsRef = useRef(false) // Track if we found results to prevent re-polling

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
      foundResultsRef.current = false
      return
    }

    // If we already found results, don't poll again
    if (foundResultsRef.current) {
      return
    }

    setIsPolling(true)
    toastShownRef.current = false

    const checkResults = async () => {
      // If we already found results, stop checking
      if (foundResultsRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        return
      }

      try {
        const data = await fetchLatestResults()
        
        if (data && data.matrix && Array.isArray(data.matrix) && data.matrix.length > 0) {
          // Check if we have actual data (not just nulls)
          const hasData = data.matrix.some(row => 
            Array.isArray(row) && row.some(val => val !== null && val !== undefined)
          )

          if (hasData) {
            // Mark that we found results - stop all future polling
            foundResultsRef.current = true
            setHasResults(true)
            setIsPolling(false)
            
            // Stop polling immediately after finding results
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }

            // Don't show toast - user will access results table manually via "Results" button

            if (onResultsReceived) {
              onResultsReceived(data)
            }

            lastDataRef.current = data
            return // Exit early - found results, stop polling
          }
        }
      } catch (error: any) {
        // Silently handle all errors - don't log or show anything
        // Continue polling silently
        return
      }
    }

    // Check immediately
    checkResults()

    // Start interval for polling
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

