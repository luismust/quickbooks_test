import { QuickbooksTest } from "@/components/quickbooks-test"
import { Chatbot } from "@/components/ui/chatbot"
import { Navbar } from "@/components/ui/navbarE"
export default function CreatePage() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <Navbar />
      <QuickbooksTest isEditMode={true} />
      <Chatbot />
    </main>
  )
} 