"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Play } from "lucide-react"
import { motion } from "framer-motion"
import FloatingIcons from "@/components/floating-icons"
import { Navbar } from "@/components/ui/navbar"
import { Chatbot } from "@/components/ui/chatbot"

export default function Home() {
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
    <>
    <Navbar />
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
        className="grid gap-6 md:grid-cols-2 max-w-3xl w-full"
      >
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
      <Chatbot />
    </motion.main>
    </>
  )
}

