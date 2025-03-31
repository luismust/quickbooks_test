import { MultipleChoiceEditor } from "./editors/multiple-choice-editor"
import { DragAndDropEditor } from "./editors/drag-and-drop-editor"
import { SequenceEditor } from "./editors/sequence-editor"
// ... más importaciones

export const questionEditors = {
  multipleChoice: MultipleChoiceEditor,
  dragAndDrop: DragAndDropEditor,
  sequence: SequenceEditor,
  // ... más editores
}

export const questionViewers = {
  multipleChoice: MultipleChoice,
  dragAndDrop: DragAndDrop,
  sequence: Sequence,
  // ... más visores
} 