// Archivo de servidor para proporcionar los parámetros estáticos
// Necesarios para la exportación estática

import { EditTestClient } from '@/components/edit-test-client'
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

// Componente de servidor que renderiza el componente cliente
export default function EditTestPage({ params }: EditTestPageProps) {
  return <EditTestClient id={params.id} />
} 