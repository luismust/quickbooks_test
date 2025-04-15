import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner"
import { LocalStorageProvider } from '@/components/local-storage-provider';

export const metadata: Metadata = {
  title: 'Tests System',
  description: 'Create tests for new employee candidates',
  icons: {
    icon: '/logo1.png',
  },
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
