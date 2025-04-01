import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Test System',
  description: 'Create tests for new employee candidates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
