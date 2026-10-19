import { useState, useCallback } from 'react'

/**
 * Custom hook for API calls with loading state and error handling
 * @param {Function} apiFunction - The API function to call
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export function useApi(apiFunction) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiFunction(...args)
      
      if (result.success) {
        setData(result.data)
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorResult = {
        message: 'An unexpected error occurred',
        type: 'unknown'
      }
      setError(errorResult)
      return { success: false, error: errorResult }
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

/**
 * Hook for paginated API calls
 * @param {Function} apiFunction - The API function to call
 * @param {number} initialPage - Initial page number
 * @param {number} pageSize - Items per page
 * @returns {Object} - Paginated data and controls
 */
export function usePaginatedApi(apiFunction, initialPage = 1, pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [allData, setAllData] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const {
    data: pageData,
    loading,
    error,
    execute
  } = useApi(apiFunction)

  const loadPage = useCallback(async (page = currentPage, append = false) => {
    const result = await execute(page, pageSize)
    
    if (result.success) {
      const responseData = result.data
      
      if (append) {
        setAllData(prev => [...prev, ...responseData.results])
      } else {
        setAllData(responseData.results)
      }
      
      setTotalCount(responseData.count)
      setHasMore(!!responseData.next)
      setCurrentPage(page)
    }
    
    return result
  }, [execute, currentPage, pageSize])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      return loadPage(currentPage + 1, true)
    }
  }, [loadPage, currentPage, hasMore, loading])

  const refresh = useCallback(() => {
    setAllData([])
    return loadPage(1, false)
  }, [loadPage])

  const goToPage = useCallback((page) => {
    return loadPage(page, false)
  }, [loadPage])

  return {
    data: allData,
    pageData,
    loading,
    error,
    currentPage,
    hasMore,
    totalCount,
    loadPage,
    loadMore,
    refresh,
    goToPage
  }
}

/**
 * Hook for form submissions with API calls
 * @param {Function} submitFunction - The API function for form submission
 * @returns {Object} - Form state and submit function
 */
export function useFormSubmit(submitFunction) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const submit = useCallback(async (formData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      
      const result = await submitFunction(formData)
      
      if (result.success) {
        setSuccess(true)
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorResult = {
        message: 'Form submission failed',
        type: 'unknown'
      }
      setError(errorResult)
      return { success: false, error: errorResult }
    } finally {
      setLoading(false)
    }
  }, [submitFunction])

  const reset = useCallback(() => {
    setError(null)
    setSuccess(false)
    setLoading(false)
  }, [])

  return {
    loading,
    error,
    success,
    submit,
    reset
  }
}

export default useApi 