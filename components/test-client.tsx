"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QuickbooksTest } from "@/components/quickbooks-test"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useLocalStorage } from "@/components/local-storage-provider"
import type { Test } from "@/lib/test-storage"

interface TestClientProps {
  id: string
}

export function TestClient({ id }: TestClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { localTests, isStaticMode, getLocalTest } = useLocalStorage()

  useEffect(() => {
    const loadTest = async () => {
      try {
        setIsLoading(true)
        
        if (id === 'new') {
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
              description: 'This is a sample test for editing.',
              questions: [],
              maxScore: 100,
              minScore: 60,
              passingMessage: 'Congratulations!',
              failingMessage: 'Try again'
            })
          } else {
            router.push('/tests')
          }
        } else {
          // En modo normal, buscar en localStorage
          const test = localTests.find(t => t.id === id)
          if (test) {
            setTest(test)
          } else {
            router.push('/tests')
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTest()
  }, [id, router, isStaticMode, getLocalTest, localTests])

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