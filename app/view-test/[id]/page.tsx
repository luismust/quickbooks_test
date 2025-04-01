import { ViewTestClient } from '@/components/view-test-client'

// Función para generar páginas estáticas en build time
export function generateStaticParams() {
  // Para exportación estática, generamos solo una página de muestra
  // En tiempo de ejecución, manejaremos cualquier ID dinámicamente
  return [
    { id: 'sample-test' }
  ]
}

// Componente de servidor que renderiza el componente cliente
export default function ViewTestPage({ params }: { params: { id: string } }) {
  return <ViewTestClient id={params.id} />
} 