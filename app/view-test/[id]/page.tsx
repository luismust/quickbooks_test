import { ViewTestClient } from '@/components/view-test-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'View Test',
  description: 'Take a test and see your results'
}

// Función para generar parámetros estáticos en build time
export function generateStaticParams() {
  // Para exportación estática, generamos solo una página de muestra
  // En tiempo de ejecución, manejaremos cualquier ID dinámicamente
  return [
    { id: 'sample-test' }
  ]
}

// Definir el tipo para los props
type ViewTestPageProps = {
  params: { id: string }
}

// Componente de servidor que renderiza el componente cliente
export default function ViewTestPage({ params }: ViewTestPageProps) {
  return <ViewTestClient id={params.id} />
} 