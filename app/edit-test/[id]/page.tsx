// Archivo de servidor para proporcionar los parámetros estáticos
// Necesarios para la exportación estática

import { EditTestClient } from '@/components/edit-test-client'

// Función para generar páginas estáticas en build time
export function generateStaticParams() {
  return [
    { id: 'sample-test' }
  ]
}

// Componente de servidor que renderiza el componente cliente
export default function EditTestPage({ params }: { params: { id: string } }) {
  return <EditTestClient id={params.id} />
} 