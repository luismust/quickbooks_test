import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner"
import { LocalStorageProvider } from '@/components/local-storage-provider';

export const metadata: Metadata = {
  title: 'QuickBook Test System',
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
        <LocalStorageProvider>
          {children}
        </LocalStorageProvider>
        <Toaster />
        <SonnerToaster position="top-center" />
      </body>
    </html>
  )
}
