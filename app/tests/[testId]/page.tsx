import { TestClient } from '@/components/test-client'

// Función para generar parámetros estáticos en build time
export function generateStaticParams() {
  return [
    { testId: 'sample-test' }
  ]
}

// Componente de servidor que renderiza el componente cliente
export default function TestPage({ params }: { params: { testId: string } }) {
  return <TestClient id={params.testId} />
} 