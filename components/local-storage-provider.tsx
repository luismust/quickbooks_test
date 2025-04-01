"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Test } from '@/lib/test-storage'

// Contexto para el almacenamiento local
interface LocalStorageContextType {
  localTests: Test[]
  saveLocalTest: (test: Test) => void
  getLocalTest: (id: string) => Test | undefined
  deleteLocalTest: (id: string) => void
  isStaticMode: boolean
}

const LocalStorageContext = createContext<LocalStorageContextType>({
  localTests: [],
  saveLocalTest: () => {},
  getLocalTest: () => undefined,
  deleteLocalTest: () => {},
  isStaticMode: false
})

// Hook para usar el contexto
export const useLocalStorage = () => useContext(LocalStorageContext)

// Provider
export function LocalStorageProvider({ children }: { children: ReactNode }) {
  const [localTests, setLocalTests] = useState<Test[]>([])
  const [isStaticMode, setIsStaticMode] = useState(false)
  
  // Verificar si estamos en modo estático
  useEffect(() => {
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV
    const useLocalStorage = process.env.NEXT_PUBLIC_USE_LOCAL_STORAGE === 'true'
    
    console.log('App environment:', appEnv)
    console.log('Use local storage:', useLocalStorage)
    
    // Si estamos en modo estático o explícitamente se habilita localStorage
    setIsStaticMode(appEnv === 'static' || useLocalStorage)
    
    // Cargar tests guardados en localStorage
    const saved = localStorage.getItem('quickbook_tests')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        console.log('Loaded from localStorage:', parsed.length, 'tests')
        setLocalTests(parsed)
      } catch (e) {
        console.error('Error parsing localStorage data:', e)
      }
    }
  }, [])
  
  // Función para guardar un test localmente
  const saveLocalTest = (test: Test) => {
    setLocalTests(prev => {
      // Verificar si el test ya existe, actualizarlo si es así
      const exists = prev.findIndex(t => t.id === test.id)
      
      let updated
      if (exists >= 0) {
        updated = [...prev]
        updated[exists] = test
      } else {
        updated = [...prev, test]
      }
      
      // Guardar en localStorage
      localStorage.setItem('quickbook_tests', JSON.stringify(updated))
      return updated
    })
  }
  
  // Función para obtener un test por ID
  const getLocalTest = (id: string) => {
    return localTests.find(t => t.id === id)
  }
  
  // Función para eliminar un test
  const deleteLocalTest = (id: string) => {
    setLocalTests(prev => {
      const updated = prev.filter(t => t.id !== id)
      localStorage.setItem('quickbook_tests', JSON.stringify(updated))
      return updated
    })
  }
  
  return (
    <LocalStorageContext.Provider value={{
      localTests,
      saveLocalTest,
      getLocalTest,
      deleteLocalTest,
      isStaticMode
    }}>
      {children}
    </LocalStorageContext.Provider>
  )
} 