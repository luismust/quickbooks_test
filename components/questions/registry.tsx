import { MultipleChoiceEditor } from "./editors/multiple-choice-editor"
import { DragAndDropEditor } from "./editors/drag-and-drop-editor"
import { SequenceEditor } from "./editors/sequence-editor"
import { ImageSequenceEditor } from "./editors/image_sequence_editor"

import { MultipleChoice } from "./viewers/multiple-choice"
import { DragAndDrop } from "./viewers/drag_and_drop"
import { Sequence } from "./viewers/sequence"
import { ImageSequence } from "./viewers/image-sequence"
// ... más importaciones

export const questionEditors = {
  multipleChoice: MultipleChoiceEditor,
  dragAndDrop: DragAndDropEditor,
  sequence: SequenceEditor,
  imageSequence: ImageSequenceEditor,
  // ... más editores
}

export const questionViewers = {
  multipleChoice: MultipleChoice,
  dragAndDrop: DragAndDrop,
  sequence: Sequence,
  imageSequence: ImageSequence,
  // ... más visores
} 