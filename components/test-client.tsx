"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QuickbooksTest } from "@/components/quickbooks-test"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useLocalStorage } from "@/components/local-storage-provider"
import { loadTest } from "@/lib/test-storage"
import type { Test } from "@/lib/test-storage"

interface TestClientProps {
  id: string
}

export function TestClient({ id }: TestClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isStaticMode } = useLocalStorage()

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setIsLoading(true)
        
        if (id === 'new') {
          // Crear un nuevo test vacío
          setTest({
            id: Date.now().toString(),
            name: "New Test",
            description: "Test description",
            questions: [],
            passingMessage: "Congratulations! You have passed the test.",
            failingMessage: "You need to improve to pass the test.",
            minScore: 60,
            maxScore: 100
          })
          return
        }
        
        // Usar la función centralizada de carga de tests
        const loadedTest = await loadTest(id)
        
        if (loadedTest) {
          console.log(`Test ${id} loaded successfully`)
          setTest(loadedTest)
        } else if (isStaticMode && id === 'sample-test') {
          // Si estamos en modo estático y es el test de ejemplo
          console.log('Using sample test in static mode')
          setTest({
            id: 'sample-test',
            name: 'Sample Test',
            description: 'This is a sample test for editing.',
            questions: [],
            maxScore: 100,
            minScore: 60,
            passingMessage: 'Congratulations!',
            failingMessage: 'Try again'
          })
        } else {
          console.error(`Test ${id} not found`)
          setTest(null)
        }
      } catch (error) {
        console.error('Error loading test:', error)
        setTest(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTest()
  }, [id, isStaticMode])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-lg animate-pulse bg-muted" />
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test not found</h1>
          <button
            onClick={() => router.push("/tests")}
            className="text-blue-500 hover:underline"
          >
            Return to test list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/tests")}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </Button>
      </div>
      
      <QuickbooksTest 
        initialTest={test}
        isEditMode={true}
      />
    </div>
  )
} 