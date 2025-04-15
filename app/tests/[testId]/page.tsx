import { TestClient } from '@/components/test-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test Details',
  description: 'View and edit test details'
}

// Función para generar parámetros estáticos en build time
// Esto es solo para la muestra, las demás rutas serán manejadas dinámicamente
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
  // Utilizar el ID directamente sin validación previa
  // El componente cliente TestClient se encargará de cargar el test si existe
  // o mostrar un mensaje apropiado si no existe
  return <TestClient id={params.testId} />
} 