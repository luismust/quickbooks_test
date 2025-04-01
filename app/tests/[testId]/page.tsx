import { TestClient } from '@/components/test-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test Details',
  description: 'View and edit test details'
}

// Función para generar parámetros estáticos en build time
export function generateStaticParams() {
  return [
    { testId: 'sample-test' }
  ]
}

// Definir el tipo para los props
type TestPageProps = {
  params: { testId: string }
}

// Componente de servidor que renderiza el componente cliente
export default function TestPage({ params }: TestPageProps) {
  return <TestClient id={params.testId} />
} 