"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { UserCircle, Briefcase, Mail } from "lucide-react"

interface TestApplicantFormProps {
  testName: string
  onSubmit: (applicantData: ApplicantData) => void
}

export interface ApplicantData {
  fullName: string
  email: string
  position: string
  experience: string
}

export function TestApplicantForm({ testName, onSubmit }: TestApplicantFormProps) {
  const [formData, setFormData] = useState<ApplicantData>({
    fullName: "",
    email: "",
    position: "",
    experience: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">Welcome to {testName}</CardTitle>
          <p className="text-muted-foreground">
            Please fill in your information before starting the test
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position Applied For</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="position"
                    placeholder="Enter the position you're applying for"
                    className="pl-10"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience for {formData.position || "this position"}</Label>
                <Textarea
                  id="experience"
                  placeholder={`Tell us about your experience related to ${formData.position || "this position"}...`}
                  className="min-h-[100px] resize-none"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleSubmit}
          >
            Start Test
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
} 