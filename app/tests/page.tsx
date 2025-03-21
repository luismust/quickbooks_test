"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TestViewer } from "@/components/test-viewer"
import { motion } from "framer-motion"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { Trash2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import type { Test } from "@/lib/test-storage"

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [tests, setTests, isLoading] = useLocalStorage('saved-tests', [])

  const handleDeleteTest = (testId: string) => {
    if (confirm('Are you sure you want to delete this test?')) {
      setTests(tests.filter(t => t.id !== testId))
      if (selectedTest?.id === testId) {
        setSelectedTest(null)
      }
      toast.success('Test deleted successfully')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <p>Loading tests...</p>
      </div>
    )
  }

  if (selectedTest) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedTest(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Button>
        </div>
        <TestViewer 
          test={selectedTest}
          onFinish={() => setSelectedTest(null)}
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold mb-8"
      >
        Available Tests
      </motion.h1>

      {tests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">There are no saved tests.</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.href = '/create'}
          >
            Create new test
          </Button>
        </div>
      ) : (
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {tests.map((test) => (
            <motion.div
              key={test.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTest(test.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {test.questions.length} questions
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => setSelectedTest(test)}
                  >
                    Start Test
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
} 