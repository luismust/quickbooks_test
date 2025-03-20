"use client"

import { useState, useEffect } from "react"
import type { Test } from "../test-storage"

export function useLocalStorage(key: string, initialValue: Test[]) {
  // Usar una función de inicialización para useState
  const [storedValue, setStoredValue] = useState<Test[]>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const setValue = (value: Test[] | ((val: Test[]) => Test[])) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue, isLoading] as const
} 