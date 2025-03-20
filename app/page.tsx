import { QuickbooksTest } from "@/components/quickbooks-test"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">QuickBooks Knowledge Test</h1>
      <QuickbooksTest />
    </main>
  )
}

