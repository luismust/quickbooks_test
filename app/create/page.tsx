"use client"

import { QuickbooksTest } from "@/components/quickbooks-test"
import { FloatingEditorIcons } from "@/components/floating-editor-icons"

export default function CreatePage() {
  return (
    <main className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <FloatingEditorIcons />
      <div className="relative z-10">
        <QuickbooksTest isEditMode={true} />
      </div>
    </main>
  )
} 