import { MultipleChoiceEditor } from "./editors/multiple-choice-editor"
import { DragAndDropEditor } from "./editors/drag-and-drop-editor"
import { SequenceEditor } from "./editors/sequence-editor"
import { OpenQuestionEditor } from "./editors/open-question-editor"
import { PhraseCompleteEditor } from "./editors/phrase-complete-editor"

import { MultipleChoice } from "./viewers/multiple-choice"
import { DragAndDrop } from "./viewers/drag_and_drop"
import { Sequence } from "./viewers/sequence"
import { OpenQuestion } from "./viewers/open_question"
import { PhraseComplete } from "./viewers/phrase_complete"
// ... más importaciones

export const questionEditors = {
  multipleChoice: MultipleChoiceEditor,
  dragAndDrop: DragAndDropEditor,
  sequence: SequenceEditor,
  openQuestion: OpenQuestionEditor,
  phraseComplete: PhraseCompleteEditor,
  // ... más editores
}

export const questionViewers = {
  multipleChoice: MultipleChoice,
  dragAndDrop: DragAndDrop,
  sequence: Sequence,
  openQuestion: OpenQuestion,
  phraseComplete: PhraseComplete,
  // ... más visores
} 