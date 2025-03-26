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
import FloatingIcons from "@/components/floating-icons"

export default function Home() {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/json") {
      toast.error("Please upload a JSON file")
      return
    }

    try {
      const content = await file.text()
      const testData = JSON.parse(content)
      
      if (!validateTest(testData)) {
        toast.error("The file does not have the correct test format")
        return
      }

      saveTest(testData)
      toast.success("Test successfully loaded")
    } catch (error) {
      toast.error("Error loading test: Ensure the file is a valid JSON")
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
      <FloatingIcons />
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold mb-8 text-center"
      >
        Test System
      </motion.h1>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 max-w-4xl w-full"
      >
        <motion.div variants={item} className="col-span-2">
          <Card className="col-span-2 relative z-10">
            <CardHeader>
              <CardTitle>Upload Test Template</CardTitle>
              <CardDescription>
                Drag and drop your JSON file or click to select it
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
                    {isDragging ? "Drop the file here" : "Drag your JSON file here or click to select"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Only JSON files
                  </p>
                </label>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => downloadExampleTemplate()}
                  className="text-sm"
                >
                  Download example template
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative z-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Mode
              </CardTitle>
              <CardDescription>
                Create and modify interactive tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/create">
                <Button className="w-full">
                  Go to Edit Mode
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative z-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test Mode
              </CardTitle>
              <CardDescription>
                Take the saved tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tests">
                <Button className="w-full" variant="secondary">
                  Go to Test Mode
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.main>
  )
}

