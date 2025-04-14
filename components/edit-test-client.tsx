"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { QuickbooksTest } from "@/components/quickbooks-test"
import { loadTests } from "@/lib/test-storage"
import { useLocalStorage } from "@/components/local-storage-provider"
import type { Test } from "@/lib/test-storage"

interface EditTestClientProps {
  id: string
}

export function EditTestClient({ id }: EditTestClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { localTests, isStaticMode, getLocalTest } = useLocalStorage()

  useEffect(() => {
    // Función para cargar el test
    const loadTest = async () => {
      try {
        setIsLoading(true)
        
        if (isStaticMode) {
          // En modo estático, buscar en localStorage
          const localTest = getLocalTest(id)
          if (localTest) {
            setTest(localTest)
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
          } else {
            throw new Error("Test not found in local storage")
          }
        } else {
          // En modo normal, cargar desde API
          const tests = await loadTests()
          const foundTest = tests.find((t: Test) => t.id === id)
          if (!foundTest) {
            throw new Error("Test not found")
          }
          setTest(foundTest)
        }
      } catch (error) {
        console.error("Error loading test:", error)
        toast.error("Could not load the test. Please try again.")
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    loadTest()
  }, [id, router, isStaticMode, getLocalTest])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test not found</h1>
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 hover:underline"
          >
            Return to home
          </button>
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