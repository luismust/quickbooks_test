"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Edit, Play } from "lucide-react"
import { saveTest, validateTest, downloadExampleTemplate } from "@/lib/test-storage"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function Home() {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/json") {
      toast.error("Por favor, sube un archivo JSON")
      return
    }

    try {
      const content = await file.text()
      const testData = JSON.parse(content)
      
      if (!validateTest(testData)) {
        toast.error("El archivo no tiene el formato correcto de test")
        return
      }

      saveTest(testData)
      toast.success("Test cargado exitosamente")
    } catch (error) {
      toast.error("Error al cargar el archivo. Asegúrate de que sea un JSON válido")
      console.error("Error loading test:", error)
    }
  }

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold mb-8 text-center"
      >
        Sistema de Tests
      </motion.h1>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 max-w-4xl w-full"
      >
        <motion.div variants={item} className="col-span-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Subir Plantilla de Test</CardTitle>
              <CardDescription>
                Arrastra y suelta tu archivo JSON o haz clic para seleccionarlo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/10" : "border-gray-300"
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
              >
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-12 w-12 mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    {isDragging ? "Suelta el archivo aquí" : "Arrastra tu archivo JSON aquí o haz clic para seleccionar"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Solo archivos JSON
                  </p>
                </label>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => downloadExampleTemplate()}
                  className="text-sm"
                >
                  Descargar plantilla de ejemplo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Modo Edición
              </CardTitle>
              <CardDescription>
                Crea y modifica tests interactivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/create">
                <Button className="w-full">
                  Ir a Modo Edición
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Modo Prueba
              </CardTitle>
              <CardDescription>
                Toma los tests guardados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tests">
                <Button className="w-full" variant="secondary">
                  Ir a Modo Prueba
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.main>
  )
}

