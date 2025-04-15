"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"
import { QuickbooksTest } from "@/components/quickbooks-test"
import { loadTest, loadTests } from "@/lib/test-storage"
import { useLocalStorage } from "@/components/local-storage-provider"
import type { Test } from "@/lib/test-storage"
import { Button } from "@/components/ui/button"

interface EditTestClientProps {
  id: string
}

export function EditTestClient({ id }: EditTestClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { localTests, isStaticMode, getLocalTest } = useLocalStorage()

  useEffect(() => {
    // Función para cargar el test
    const fetchTest = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Intentar obtener el test directamente primero
        try {
          if (isStaticMode) {
            // En modo estático, buscar en localStorage
            const localTest = getLocalTest(id)
            if (localTest) {
              setTest(localTest)
              return
            } else if (id === 'sample-test') {
              // Si es la página de muestra y no hay test, crear uno de ejemplo
              setTest({
                id: 'sample-test',
                name: 'Sample Test',
                description: 'This is a sample test created in static mode.',
                questions: [],
                maxScore: 100,
                minScore: 60,
                passingMessage: 'Congratulations!',
                failingMessage: 'Try again'
              })
              return
            }
          } else {
            // En modo normal, intentar cargar desde función loadTest primero
            try {
              const foundTest = await loadTest(id)
              if (foundTest) {
                setTest(foundTest)
                return
              }
            } catch (loadTestError) {
              console.error("Error in loadTest, trying loadTests as fallback:", loadTestError)
            }
            
            // Si loadTest falla, intentar con loadTests
            const tests = await loadTests()
            const foundTest = tests.find((t: Test) => t.id === id)
            if (foundTest) {
              setTest(foundTest)
              return
            }
          }
          
          // Si llegamos aquí, no encontramos el test
          throw new Error("Test not found")
        } catch (fetchError) {
          // Intentar buscar en localStorage como fallback
          if (!isStaticMode) {
            const localTests = JSON.parse(localStorage.getItem('saved-tests') || '[]')
            const localTest = localTests.find((t: Test) => t.id === id)
            if (localTest) {
              setTest(localTest)
              toast.info("Using locally saved version of the test")
              return
            }
          }
          throw fetchError // Re-lanzar el error si no encontramos el test en ningún lado
        }
      } catch (error: any) {
        console.error("Error loading test:", error)
        setError(error.message || "Could not load the test")
        toast.error("Error loading test. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTest()
  }, [id, router, isStaticMode, getLocalTest])

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    // Re-intentar la carga del test
    setTimeout(() => {
      const fetchTest = async () => {
        try {
          if (isStaticMode) {
            const localTest = getLocalTest(id)
            if (localTest) {
              setTest(localTest)
            } else {
              throw new Error("Test not found in local storage")
            }
          } else {
            const tests = await loadTests()
            const foundTest = tests.find((t: Test) => t.id === id)
            if (foundTest) {
              setTest(foundTest)
            } else {
              throw new Error("Test not found")
            }
          }
          setError(null)
        } catch (error: any) {
          console.error("Error retrying test load:", error)
          setError(error.message || "Could not load the test")
          toast.error("Error loading test. Please try again.")
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchTest()
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">
            {error || "Test not found"}
          </h1>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="mr-2"
            >
              Retry
            </Button>
            <Button
              onClick={() => router.push("/")}
            >
              Return to home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <QuickbooksTest 
        initialTest={test}
        isEditMode={true}
      />
    </main>
  )
} 