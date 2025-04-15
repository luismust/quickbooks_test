import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Redirecting...',
  description: 'Redirecting to the correct page'
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

// Componente de servidor que redirige a la ruta correcta
export default function EditTestPage({ params }: EditTestPageProps) {
  const { id } = params
  
  // Redirigir a la ruta correcta
  redirect(`/tests/${id}`)
} 