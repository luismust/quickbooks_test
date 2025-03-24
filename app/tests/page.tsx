"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TestViewer } from "@/components/test-viewer"
import { ChevronLeft, Plus, Trash2 } from "lucide-react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { useRouter } from "next/navigation"
import type { Test } from "@/lib/test-storage"
import { toast } from "@/components/ui/use-toast"

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [tests, setTests] = useLocalStorage<Test[]>('saved-tests', [])
  const router = useRouter()

  const handleDelete = (e: React.MouseEvent, testId: string) => {
    e.stopPropagation() // Esto es clave para evitar que se abra el test
    if (confirm("¿Estás seguro de que deseas eliminar este test?")) {
      setTests(tests.filter(test => test.id !== testId))
      toast({
        title: "Test eliminado",
        description: "El test se ha eliminado correctamente",
      })
    }
  }

  // Si hay un test seleccionado, mostrar el TestViewer
  if (selectedTest) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="outline"
          onClick={() => setSelectedTest(null)}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
        <TestViewer 
          test={selectedTest}
          onFinish={() => setSelectedTest(null)}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Button>
        <h1 className="text-3xl font-bold">Tests Disponibles</h1>
        <div className="w-[100px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => (
          <Card 
            key={test.id}
            className="relative group cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTest(test)}
          >
            <CardHeader>
              <CardTitle>{test.name || "Test sin nombre"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {test.description || "Sin descripción"}
              </p>
              <div className="text-sm text-muted-foreground mt-2">
                {test.questions.length} preguntas
              </div>
            </CardHeader>
            
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDelete(e, test.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}

        <Card 
          className="cursor-pointer border-dashed hover:shadow-md transition-shadow"
          onClick={() => router.push("/tests/new")}
        >
          <CardHeader className="flex items-center justify-center">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <CardTitle className="mt-2">Crear nuevo test</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
} 