"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TestViewer } from "@/components/test-viewer"
import { motion } from "framer-motion"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { ChevronLeft, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Test } from "@/lib/test-storage"

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [tests, setTests] = useLocalStorage<Test[]>('saved-tests', [])
  const router = useRouter()

  // Si hay un test seleccionado, mostrar el TestViewer
  if (selectedTest) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setSelectedTest(null)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a la lista
          </Button>
        </div>
        <TestViewer 
          test={selectedTest}
          onFinish={() => setSelectedTest(null)}
        />
      </div>
    )
  }

  // Si no hay test seleccionado, mostrar la lista de tests
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </motion.div>
        <motion.h1 
          className="text-3xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Tests Disponibles
        </motion.h1>
        <div className="w-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {tests.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <p className="text-muted-foreground mb-4">No hay tests guardados.</p>
              <Button 
                onClick={() => router.push("/tests/new")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear nuevo test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <motion.div
                key={test.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer" 
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
                </Card>
              </motion.div>
            ))}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer border-dashed"
                onClick={() => router.push("/tests/new")}
              >
                <CardHeader className="flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <CardTitle className="mt-2">Crear nuevo test</CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
} 