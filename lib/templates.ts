export const questionTemplates = [
  {
    id: "blank",
    name: "Blank Test",
    questions: [
      {
        id: 1,
        title: "New Question",
        description: "Add a description for the question",
        image: "",
        question: "What action should the user perform?",
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
        description: "Add a description for the question",
        image: "",
        question: "What action should the user perform?",
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
  name: "Example Test",
  description: "This is an example of the structure that the JSON file must have",
  questions: [
    {
      id: 1,
      title: "First Question",
      description: "Detailed task description",
      question: "Where would you click to...?",
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
  title: "New Question",
  description: "Add a description for the question",
  image: "",
  question: "What action should the user perform?",
  areas: []
} 