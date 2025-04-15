"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Test',
  description: 'Edit your test questions and settings'
}

// Función para generar páginas estáticas en build time
export function generateStaticParams() {
  return [
    { id: 'sample-test' }
  ]
}

// Definir el tipo para los props
type EditTestPageProps = {
  params: { id: string }
}

// Componente que redirecciona a la ruta correcta
export default function EditTestPage({ params }: EditTestPageProps) {
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    // Redirigir a la ruta correcta
    router.replace(`/tests/${id}`)
  }, [router, id])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Taking you to the correct page</p>
      </div>
    </div>
  )
} 