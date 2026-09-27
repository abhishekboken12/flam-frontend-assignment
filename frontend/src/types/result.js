/**
 * The exact shape we ask the model for, and the only shape that is
 * ever allowed to reach the UI. Sketched before writing a single
 * prompt, per the assignment's step 1.
 *
 * Raw model output looks like:
 * {
 *   "topic": "The Krebs cycle",
 *   "cards": [
 *     { "question": "Where does the Krebs cycle take place?", "answer": "The mitochondrial matrix." }
 *   ]
 * }
 *
 * @typedef {Object} RawCard
 * @property {string} question
 * @property {string} answer
 * @property {'card'|'cloze'|'truefalse'|'multiple'} [type]
 * @property {'easy'|'medium'|'hard'} [difficulty]
 * @property {string[]} [options] only meaningful when type is 'multiple'
 *
 * @typedef {Object} RawResult
 * @property {string} [topic]
 * @property {RawCard[]} cards
 */

/**
 * After validateResult.js has checked and cleaned the raw shape,
 * every card is guaranteed to have a stable id and non-empty
 * trimmed strings. This is the only shape components ever see.
 *
 * @typedef {Object} Flashcard
 * @property {string} id
 * @property {string} question
 * @property {string} answer
 * @property {'card'|'cloze'|'truefalse'|'multiple'} type
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {string[]} [options] present only when type is 'multiple'
 *
 * @typedef {Object} StudySet
 * @property {string} topic
 * @property {Flashcard[]} cards
 */

export {};
