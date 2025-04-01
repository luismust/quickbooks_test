import { useState, useEffect } from 'react'

export const useImageCache = () => {
  const [cache, setCache] = useState<Map<string, string>>(new Map())

  const addToCache = (url: string, blobUrl: string) => {
    setCache(prev => new Map(prev).set(url, blobUrl))
  }

  const getFromCache = (url: string) => {
    return cache.get(url)
  }

  const clearCache = () => {
    cache.forEach(blobUrl => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    })
    setCache(new Map())
  }

  useEffect(() => {
    return () => {
      clearCache()
    }
  }, [])

  return { addToCache, getFromCache, clearCache }
} 