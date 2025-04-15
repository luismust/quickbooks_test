import { MultipleChoiceEditor } from "./editors/multiple-choice-editor"
import { DragAndDropEditor } from "./editors/drag-and-drop-editor"
import { SequenceEditor } from "./editors/sequence-editor"
import { MultipleChoice } from "./viewers/multiple-choice"
import { DragAndDrop } from "./viewers/drag_and_drop"
import { Sequence } from "./viewers/sequence"
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