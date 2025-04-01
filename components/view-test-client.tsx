"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TestViewer } from "@/components/test-viewer"
import { getTests } from "@/lib/test-storage"
import { toast } from "sonner"
import { Loader2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/components/local-storage-provider"
import type { Test } from "@/lib/test-storage"

interface ViewTestClientProps {
  id: string
}

export function ViewTestClient({ id }: ViewTestClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { localTests, isStaticMode, getLocalTest } = useLocalStorage()

  useEffect(() => {
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
              description: 'This is a sample test for preview.',
              questions: [
                {
                  id: 'q1',
                  type: 'trueOrFalse',
                  title: 'Sample Question',
                  description: 'This is a sample true/false question',
                  question: 'Static export allows you to deploy without a Node.js server',
                  correctAnswer: true,
                  options: [
                    { id: 'opt1', text: 'True', isCorrect: true },
                    { id: 'opt2', text: 'False', isCorrect: false }
                  ],
                  scoring: {
                    correct: 100,
                    incorrect: 0,
                    retain: 0
                  }
                }
              ],
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
          const tests = await getTests()
          const foundTest = tests.find(t => t.id === id)
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
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Button>
      </div>
      
      <TestViewer test={test} />
    </div>
  )
} 