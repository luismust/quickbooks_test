export const questionTemplates = [
  {
    id: "blank",
    name: "Test en blanco",
    questions: [
      {
        id: 1,
        title: "Nueva Pregunta",
        description: "Agrega una descripción para la pregunta",
        image: "",
        question: "¿Qué acción debe realizar el usuario?",
        areas: []
      }
    ]
  },
  {
    id: "quickbooks",
    name: "QuickBooks Tutorial",
    questions: [
      {
        id: 1,
        title: "Nueva Pregunta",
        description: "Agrega una descripción para la pregunta",
        image: "",
        question: "¿Qué acción debe realizar el usuario?",
        areas: []
      }
    ]
  },
  {
    id: "excel",
    name: "Microsoft Excel",
    questions: [
      // ... preguntas de Excel
    ]
  },
  // ... más plantillas
]

export const exampleTemplate = {
  id: "example-test",
  name: "Test de Ejemplo",
  description: "Este es un ejemplo de la estructura que debe tener el archivo JSON",
  questions: [
    {
      id: 1,
      title: "Primera Pregunta",
      description: "Descripción detallada de la tarea",
      question: "¿Dónde harías clic para...?",
      image: "URL_DE_LA_IMAGEN",
      areas: [
        {
          id: "area1",
          shape: "rect",
          coords: [100, 100, 200, 200],
          isCorrect: true
        }
      ]
    }
  ]
}

// Función para descargar la plantilla de ejemplo
export const downloadExampleTemplate = () => {
  const jsonString = JSON.stringify(exampleTemplate, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla-test.json'
  a.click()
  URL.revokeObjectURL(url)
}

export const defaultQuestion = {
  id: Date.now(),
  title: "Nueva Pregunta",
  description: "Agrega una descripción para la pregunta",
  image: "",
  question: "¿Qué acción debe realizar el usuario?",
  areas: []
} 