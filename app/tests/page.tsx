"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TestViewer } from "@/components/test-viewer"
import { 
  ChevronLeft, 
  ChevronRight,
  Plus, 
  Trash2, 
  Loader2, 
  Edit, 
  Download, 
  Search 
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { Test } from "@/lib/test-storage"
import { toast } from "sonner"
import { useLocalStorage } from "@/components/local-storage-provider"

// Función auxiliar para formatear la fecha
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { localTests, isStaticMode, deleteLocalTest } = useLocalStorage()

  // Filtrar tests basado en la búsqueda
  const filteredTests = tests.filter(test => 
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Cargar tests desde Airtable o localStorage
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true)
        
        if (isStaticMode) {
          // En modo estático, cargar desde localStorage
          console.log('Static mode: Loading tests from localStorage')
          setTests(localTests)
        } else {
          // En modo normal, cargar desde API
          console.log('Normal mode: Loading tests from API directly')
          
          // Usar directamente la URL del backend en lugar del endpoint relativo
          const apiUrl = 'https://quickbooks-backend.vercel.app/api/tests';
          console.log('Fetching from absolute URL:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Evitar problemas de CORS
              'Accept': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`)
          }
          
          const data = await response.json();
          console.log('Tests loaded successfully:', data.tests.length);
          setTests(data.tests)
        }
      } catch (error) {
        console.error('Error fetching tests:', error)
        toast.error("Failed to load tests")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTests()
  }, [isStaticMode, localTests])

  const handleDelete = async (e: React.MouseEvent, testId: string) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this test?")) {
      try {
        if (isStaticMode) {
          // En modo estático, eliminar de localStorage
          deleteLocalTest(testId)
          setTests(tests.filter(test => test.id !== testId))
          toast.success("Test deleted successfully")
        } else {
          // En modo normal, eliminar con API usando la nueva implementación
          const apiUrl = 'https://quickbooks-backend.vercel.app/api/delete-test';
          console.log('Deleting test using endpoint:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'https://quickbooks-test-black.vercel.app'
            },
            body: JSON.stringify({
              id: testId // Enviar el ID en el cuerpo
            })
          })
          
          if (!response.ok) {
            throw new Error(`Failed to delete test: ${response.status} ${response.statusText}`)
          }

          setTests(tests.filter(test => test.id !== testId))
          toast.success("Test deleted successfully")
        }
      } catch (error) {
        console.error('Error deleting test:', error)
        toast.error("Failed to delete test")
      }
    }
  }

  const handleEditTest = (e: React.MouseEvent, test: Test) => {
    e.stopPropagation()
    router.push(`/edit-test/${test.id}`)
  }

  const handleDownloadTest = (e: React.MouseEvent, test: Test) => {
    e.stopPropagation()
    
    // Crear un blob y descargarlo
    const blob = new Blob([JSON.stringify(test, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test_${test.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success("Test downloaded successfully")
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
          Back to list
        </Button>
        <TestViewer 
          test={selectedTest}
          onFinish={() => setSelectedTest(null)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Barra de navegación */}
      <nav className="sticky top-0 z-40 border-b bg-white">
        <div className="container flex h-14 items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => router.push("/")}
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Home
            </Button>
            <h1 className="text-xl">My Tests</h1>
          </div>

          {/* Barra de búsqueda más a la derecha */}
          <div className="relative w-[280px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full bg-gray-50"
            />
          </div>
        </div>
      </nav>

      {/* Contenido principal con más padding */}
      <div className="container py-8 px-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">
              {tests.length === 0 ? "No tests available" : "No tests found"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTests.map((test) => (
              <Card 
                key={test.id}
                className="group relative hover:shadow transition-shadow cursor-pointer"
                onClick={() => setSelectedTest(test)}
              >
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-medium">
                      {test.name || "Untitled Test"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {test.description || "No description"}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pb-6 px-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">📝</div>
                      <div>
                        <div className="font-medium">{test.questions.length}</div>
                        <div className="text-xs text-muted-foreground">Questions</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-lg">✨</div>
                      <div>
                        <div className="font-medium">{test.maxScore}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-lg">🎯</div>
                      <div>
                        <div className="font-medium">{test.minScore}</div>
                        <div className="text-xs text-muted-foreground">To Pass</div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleEditTest(e, test)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleDownloadTest(e, test)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={(e) => handleDelete(e, test.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="px-6 py-3 border-t text-sm text-center text-muted-foreground">
                  Click to start test
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 