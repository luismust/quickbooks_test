"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { QuickbooksTest } from "@/components/quickbooks-test"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import type { Test } from "@/lib/test-storage"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const [tests] = useLocalStorage<Test[]>('saved-tests', [])
  const [currentTest, setCurrentTest] = useState<Test | null>(null)

  useEffect(() => {
    if (params.testId === 'new') {
      setCurrentTest({
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

    const test = tests.find(t => t.id === params.testId)
    if (test) {
      setCurrentTest(test)
    } else {
      router.push('/tests')
    }
  }, [params.testId, tests, router])

  if (!currentTest) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-lg animate-pulse bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => router.push('/tests')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a la lista
        </Button>
      </div>
      
      <QuickbooksTest 
        initialTest={currentTest}
        isEditMode={true}
      />
    </div>
  )
} 