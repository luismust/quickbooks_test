"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Save, Loader2, Trash2, Plus } from "lucide-react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { toast } from "@/components/ui/use-toast"
import type { Test, Question } from "@/lib/types"
import { FloatingEditorIcons } from "@/components/floating-editor-icons"
import { QuestionEditor } from "@/components/question-editor"
import { QuickbooksTest } from "@/components/quickbooks-test"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { exportTest } from "@/lib/test-storage"

export default function EditTestPage() {
  const router = useRouter()
  const params = useParams()
  const [tests, setTests] = useLocalStorage<Test[]>('saved-tests', [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTest = async () => {
      try {
        if (!params.id) {
          throw new Error("No test ID provided")
        }

        const testData = await exportTest(params.id)
        if (!testData) {
          throw new Error("Test not found")
        }

        setTest(testData)
      } catch (error) {
        console.error("Error loading test:", error)
        toast({
          title: "Error",
          description: "Could not load the test. Please try again.",
          variant: "destructive",
        })
        router.push("/tests")
      } finally {
        setIsLoading(false)
      }
    }

    loadTest()
  }, [params.id, router])

  const handleSave = async () => {
    if (!test) return

    try {
      setSaving(true)
      // Actualizar el test en el array de tests
      const updatedTests = tests.map(t => 
        t.id === test.id ? test : t
      )
      setTests(updatedTests)

      toast({
        title: "Test actualizado",
        description: "Los cambios se han guardado correctamente",
      })

      router.push("/tests")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el test",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleQuestionUpdate = (index: number, updates: Partial<Question>) => {
    if (!test) return

    setTest({
      ...test,
      questions: test.questions.map((q, i) => 
        i === index ? { ...q, ...updates } : q
      )
    })
  }

  const handleAddQuestion = () => {
    if (!test) return

    setTest({
      ...test,
      questions: [
        ...test.questions,
        {
          id: Date.now(),
          type: "multipleChoice",
          title: "Nueva Pregunta",
          description: "",
          question: "",
          options: [],
          scoring: {
            correct: 1,
            incorrect: 0,
            retain: 0
          }
        }
      ]
    })
  }

  const handleDeleteQuestion = (index: number) => {
    if (!test) return

    setTest({
      ...test,
      questions: test.questions.filter((_, i) => i !== index)
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
            Return to tests
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <FloatingEditorIcons />
      <div className="relative z-10">
        <QuickbooksTest 
          initialTest={test} 
          isEditMode={true}
        />
      </div>
    </main>
  )
} 