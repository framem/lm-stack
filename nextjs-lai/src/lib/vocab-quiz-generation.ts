import { distributeQuestions, type QuestionToSave } from './quiz-generation'

// ── Types ──

export interface VocabFlashcard {
    id: string
    front: string
    back: string
    context: string | null       // category name
    exampleSentence: string | null
    partOfSpeech: string | null
    conjugation: Record<string, Record<string, string>> | null
}

// ── Helpers ──

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

/** Pick n random items from array (without replacement) */
function sample<T>(arr: T[], n: number): T[] {
    return shuffle(arr).slice(0, n)
}

/** Group flashcards by their context (category name) */
function groupByCategory(cards: VocabFlashcard[]): Map<string, VocabFlashcard[]> {
    const map = new Map<string, VocabFlashcard[]>()
    for (const c of cards) {
        const key = c.context ?? '_uncategorized'
        const group = map.get(key) ?? []
        group.push(c)
        map.set(key, group)
    }
    return map
}

/**
 * Pick distractor flashcards for a target item.
 * Prefers same-category items, falls back to other categories.
 */
function pickDistractors(
    target: VocabFlashcard,
    allCards: VocabFlashcard[],
    count: number,
): VocabFlashcard[] {
    // Same category, excluding the target
    const sameCategory = allCards.filter(
        (c) => c.id !== target.id && c.context === target.context && c.back !== target.back
    )
    const otherCategory = allCards.filter(
        (c) => c.id !== target.id && c.context !== target.context && c.back !== target.back
    )

    const distractors: VocabFlashcard[] = []
    const sameSampled = sample(sameCategory, count)
    distractors.push(...sameSampled)

    if (distractors.length < count) {
        const remaining = count - distractors.length
        const usedIds = new Set(distractors.map((d) => d.id))
        const candidates = otherCategory.filter((c) => !usedIds.has(c.id))
        distractors.push(...sample(candidates, remaining))
    }

    return distractors.slice(0, count)
}

/**
 * Try to find the vocab word (or a conjugated/inflected form) in the example sentence
 * and replace it with {{blank}}.
 * Returns [sentenceWithBlank, removedWord] or null if not found.
 */
function blankOutWord(
    card: VocabFlashcard,
): { blanked: string; answer: string } | null {
    const sentence = card.exampleSentence
    if (!sentence) return null

    const front = card.front

    // 1. Direct match (case-insensitive)
    const directIdx = sentence.toLowerCase().indexOf(front.toLowerCase())
    if (directIdx !== -1) {
        const original = sentence.slice(directIdx, directIdx + front.length)
        return {
            blanked: sentence.slice(0, directIdx) + '{{blank}}' + sentence.slice(directIdx + front.length),
            answer: original,
        }
    }

    // 2. Strip article for nouns ("el pan" → "pan", "la madre" → "madre")
    const articleMatch = front.match(/^(?:el|la|los|las|the|a|an)\s+(.+)$/i)
    if (articleMatch) {
        const bare = articleMatch[1]
        const bareIdx = sentence.toLowerCase().indexOf(bare.toLowerCase())
        if (bareIdx !== -1) {
            const original = sentence.slice(bareIdx, bareIdx + bare.length)
            return {
                blanked: sentence.slice(0, bareIdx) + '{{blank}}' + sentence.slice(bareIdx + bare.length),
                answer: original,
            }
        }
    }

    // 3. Check conjugation forms (for verbs)
    if (card.conjugation) {
        for (const tense of Object.values(card.conjugation)) {
            for (const form of Object.values(tense)) {
                const formIdx = sentence.toLowerCase().indexOf(form.toLowerCase())
                if (formIdx !== -1) {
                    const original = sentence.slice(formIdx, formIdx + form.length)
                    return {
                        blanked: sentence.slice(0, formIdx) + '{{blank}}' + sentence.slice(formIdx + form.length),
                        answer: original,
                    }
                }
            }
        }
    }

    // 4. Stem match for adjectives (rojo→roja, pequeño→pequeña)
    if (front.length >= 3) {
        const stem = front.slice(0, -1) // strip last char
        const regex = new RegExp(`\\b(${stem}\\w{0,2})\\b`, 'i')
        const stemMatch = sentence.match(regex)
        if (stemMatch && stemMatch.index !== undefined) {
            return {
                blanked: sentence.slice(0, stemMatch.index) + '{{blank}}' + sentence.slice(stemMatch.index + stemMatch[0].length),
                answer: stemMatch[0],
            }
        }
    }

    return null
}

// ── Question Generators ──

/**
 * Type 1: singleChoice — translation L2→L1
 * "Was bedeutet «hola»?" → pick German translation
 */
function generateTranslationL2ToL1(
    cards: VocabFlashcard[],
    allCards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    const selected = sample(cards, count)
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        const distractors = pickDistractors(card, allCards, 3)
        if (distractors.length < 3) continue

        const options = shuffle([
            card.back,
            ...distractors.map((d) => d.back),
        ])
        const correctIndex = options.indexOf(card.back)

        const explanation = card.exampleSentence
            ? `«${card.front}» bedeutet «${card.back}». Beispiel: ${card.exampleSentence}`
            : `«${card.front}» bedeutet «${card.back}».`

        questions.push({
            questionText: `Was bedeutet «${card.front}»?`,
            options,
            correctIndex,
            explanation,
            sourceSnippet: `${card.front} — ${card.back}`,
            questionType: 'singleChoice',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 2: singleChoice — translation L1→L2
 * "Wie sagt man «Mutter» auf Spanisch?" → pick foreign word
 */
function generateTranslationL1ToL2(
    cards: VocabFlashcard[],
    allCards: VocabFlashcard[],
    count: number,
    language: string,
): QuestionToSave[] {
    const selected = sample(cards, count)
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        const distractors = pickDistractors(card, allCards, 3)
        if (distractors.length < 3) continue

        const options = shuffle([
            card.front,
            ...distractors.map((d) => d.front),
        ])
        const correctIndex = options.indexOf(card.front)

        const explanation = card.exampleSentence
            ? `«${card.back}» heißt auf ${language} «${card.front}». Beispiel: ${card.exampleSentence}`
            : `«${card.back}» heißt auf ${language} «${card.front}».`

        questions.push({
            questionText: `Wie sagt man «${card.back}» auf ${language}?`,
            options,
            correctIndex,
            explanation,
            sourceSnippet: `${card.front} — ${card.back}`,
            questionType: 'singleChoice',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 3: truefalse — translation check
 * "«el hermano» bedeutet «Vater»." → falsch
 */
function generateTranslationCheck(
    cards: VocabFlashcard[],
    allCards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    const selected = sample(cards, count)
    const questions: QuestionToSave[] = []

    for (let i = 0; i < selected.length; i++) {
        const card = selected[i]
        const isTrue = i % 2 === 0 // alternate true/false

        if (isTrue) {
            questions.push({
                questionText: `«${card.front}» bedeutet «${card.back}».`,
                options: ['Wahr', 'Falsch'],
                correctIndex: 0,
                correctAnswer: 'wahr',
                explanation: card.exampleSentence
                    ? `Richtig! «${card.front}» bedeutet «${card.back}». Beispiel: ${card.exampleSentence}`
                    : `Richtig! «${card.front}» bedeutet «${card.back}».`,
                sourceSnippet: `${card.front} — ${card.back}`,
                questionType: 'truefalse',
            })
        } else {
            // Pick a wrong translation from same category
            const distractors = pickDistractors(card, allCards, 1)
            const wrongBack = distractors.length > 0 ? distractors[0].back : 'Unbekannt'
            const wrongFront = distractors.length > 0 ? distractors[0].front : ''

            questions.push({
                questionText: `«${card.front}» bedeutet «${wrongBack}».`,
                options: ['Wahr', 'Falsch'],
                correctIndex: 1,
                correctAnswer: 'falsch',
                explanation: `«${card.front}» bedeutet nicht «${wrongBack}», sondern «${card.back}».${wrongFront ? ` «${wrongBack}» heißt «${wrongFront}».` : ''}`,
                sourceSnippet: `${card.front} — ${card.back}`,
                questionType: 'truefalse',
            })
        }
    }

    return questions.slice(0, count)
}

/**
 * Type 4: cloze — sentence vocabulary
 * "Setze das fehlende Wort ein: Yo {{blank}} estudiante. (Deutsch: sein)"
 */
function generateSentenceCloze(
    cards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    // Only cards with example sentences
    const eligible = cards.filter((c) => c.exampleSentence)
    const selected = sample(eligible, count * 2) // oversample to account for failures
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        if (questions.length >= count) break

        const result = blankOutWord(card)
        if (!result) continue

        questions.push({
            questionText: `Setze das fehlende Wort ein: ${result.blanked} (Deutsch: ${card.back})`,
            options: null,
            correctIndex: null,
            correctAnswer: result.answer,
            explanation: `Der vollständige Satz lautet: «${card.exampleSentence}». «${card.front}» bedeutet «${card.back}».`,
            sourceSnippet: `${card.front} — ${card.back}`,
            questionType: 'cloze',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 5: singleChoice — conjugation pick (verbs only)
 * "Welche Form von «tener» (= haben) passt zu «yo» im Präsens?"
 */
function generateConjugationPick(
    cards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    const verbs = cards.filter(
        (c) => c.partOfSpeech === 'Verb' && c.conjugation?.present
    )
    if (verbs.length === 0) return []

    const persons = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos']
    const selected = sample(verbs, count * 2) // oversample
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        if (questions.length >= count) break
        const present = card.conjugation!.present!
        const person = persons[Math.floor(Math.random() * persons.length)]
        const correctForm = present[person]
        if (!correctForm) continue

        // Get 3 other forms from the same verb as distractors
        const otherForms = Object.entries(present)
            .filter(([p, f]) => p !== person && f !== correctForm)
            .map(([, f]) => f)

        if (otherForms.length < 3) continue
        const distractorForms = sample(otherForms, 3)

        const options = shuffle([correctForm, ...distractorForms])
        const correctIndex = options.indexOf(correctForm)

        questions.push({
            questionText: `Welche Form von «${card.front}» (= ${card.back}) passt zu «${person}» im Präsens?`,
            options,
            correctIndex,
            explanation: `Die korrekte Präsens-Form von «${card.front}» für «${person}» ist «${correctForm}».`,
            sourceSnippet: `${card.front}: ${person} → ${correctForm}`,
            questionType: 'singleChoice',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 6: freetext — translation produce
 * "Übersetze ins Spanische: «Mutter»"
 */
function generateTranslationProduce(
    cards: VocabFlashcard[],
    count: number,
    language: string,
): QuestionToSave[] {
    const selected = sample(cards, count)
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        const explanation = card.exampleSentence
            ? `«${card.back}» heißt auf ${language} «${card.front}». Beispiel: ${card.exampleSentence}`
            : `«${card.back}» heißt auf ${language} «${card.front}».`

        questions.push({
            questionText: `Übersetze ins ${language}e: «${card.back}»`,
            options: null,
            correctIndex: null,
            correctAnswer: card.front,
            explanation,
            sourceSnippet: `${card.front} — ${card.back}`,
            questionType: 'freetext',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 7: multipleChoice — category members
 * "Welche der folgenden Wörter gehören zur Kategorie «Farben»?"
 */
function generateCategoryMembers(
    cards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    const groups = groupByCategory(cards)
    const categories = [...groups.entries()].filter(([, items]) => items.length >= 3)

    if (categories.length < 2) return []

    const selectedCategories = sample(categories, count)
    const questions: QuestionToSave[] = []

    for (const [catName, catItems] of selectedCategories) {
        // Pick 2-3 correct items from this category
        const correctCount = Math.min(catItems.length, Math.random() < 0.5 ? 2 : 3)
        const correctItems = sample(catItems, correctCount)

        // Pick 2 distractors from other categories
        const otherItems = cards.filter((c) => c.context !== catName)
        const distractorItems = sample(otherItems, 2)

        if (distractorItems.length < 2) continue

        const allOptions = shuffle([...correctItems, ...distractorItems])
        const options = allOptions.map((c) => `${c.front} (${c.back})`)
        const correctIds = new Set(correctItems.map((c) => c.id))
        const correctIndices = allOptions
            .map((c, i) => (correctIds.has(c.id) ? i : -1))
            .filter((i) => i !== -1)

        const correctLabels = correctItems.map((c) => c.front).join(', ')
        const distractorExplanations = distractorItems
            .map((c) => `«${c.front}» gehört zu «${c.context}»`)
            .join(' und ')

        questions.push({
            questionText: `Welche der folgenden Wörter gehören zur Kategorie «${catName}»?`,
            options,
            correctIndex: null,
            correctIndices,
            explanation: `Zur Kategorie «${catName}» gehören: ${correctLabels}. ${distractorExplanations}.`,
            sourceSnippet: `Kategorie: ${catName}`,
            questionType: 'multipleChoice',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 8: fillInBlanks — blank out 2 words from example sentence
 */
function generateVocabFillInBlanks(
    cards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    // Need cards with example sentences long enough for 2 blanks
    const eligible = cards.filter((c) => {
        if (!c.exampleSentence) return false
        const words = c.exampleSentence.split(/\s+/)
        return words.length >= 5
    })
    const selected = sample(eligible, count * 2)
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        if (questions.length >= count) break
        const sentence = card.exampleSentence!
        const words = sentence.split(/\s+/)

        // Pick 2 non-trivial words to blank (skip articles, short words)
        const trivial = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'de', 'en', 'a', 'y', 'o', 'the', 'a', 'an', 'is', 'of', 'to', 'and', 'or'])
        const candidates = words
            .map((w, i) => ({ word: w, index: i }))
            .filter(({ word }) => word.length >= 3 && !trivial.has(word.toLowerCase()))

        if (candidates.length < 2) continue
        const blanked = sample(candidates, 2).sort((a, b) => a.index - b.index)

        const blankIndices = new Set(blanked.map((b) => b.index))
        const blankedSentence = words
            .map((w, i) => blankIndices.has(i) ? '{{blank}}' : w)
            .join(' ')
        const correctAnswers = blanked.map((b) => b.word)

        questions.push({
            questionText: `Ergänze die Lücken: ${blankedSentence} (Deutsch: ${card.back})`,
            options: null,
            correctIndex: null,
            correctAnswer: JSON.stringify(correctAnswers),
            explanation: `Der vollständige Satz lautet: «${sentence}». «${card.front}» bedeutet «${card.back}».`,
            sourceSnippet: `${card.front} — ${card.back}`,
            questionType: 'fillInBlanks',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 9: conjugation — fill in conjugation table from flashcard data
 */
function generateVocabConjugation(
    cards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    const verbs = cards.filter(
        (c) => c.partOfSpeech === 'Verb' && c.conjugation?.present
    )
    if (verbs.length === 0) return []

    const selected = sample(verbs, count)
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        const present = card.conjugation!.present!
        const persons = Object.keys(present)
        const forms = persons.map((p) => present[p])

        questions.push({
            questionText: `Konjugiere «${card.front}» (= ${card.back}) im Präsens`,
            options: persons,
            correctIndex: null,
            correctAnswer: JSON.stringify(forms),
            explanation: `Die Präsens-Konjugation von «${card.front}»: ${persons.map((p, i) => `${p} → ${forms[i]}`).join(', ')}.`,
            sourceSnippet: `${card.front} — ${card.back}`,
            questionType: 'conjugation',
        })
    }

    return questions.slice(0, count)
}

/**
 * Type 10: sentenceOrder — shuffle words of example sentence
 */
function generateVocabSentenceOrder(
    cards: VocabFlashcard[],
    count: number,
): QuestionToSave[] {
    const eligible = cards.filter((c) => {
        if (!c.exampleSentence) return false
        const words = c.exampleSentence.split(/\s+/)
        return words.length >= 4 && words.length <= 12
    })
    const selected = sample(eligible, count)
    const questions: QuestionToSave[] = []

    for (const card of selected) {
        const sentence = card.exampleSentence!
        const words = sentence.split(/\s+/)

        questions.push({
            questionText: 'Bringe die Wörter in die richtige Reihenfolge:',
            options: shuffle(words),
            correctIndex: null,
            correctAnswer: sentence,
            explanation: `Der korrekte Satz lautet: «${sentence}». «${card.front}» bedeutet «${card.back}».`,
            sourceSnippet: `${card.front} — ${card.back}`,
            questionType: 'sentenceOrder',
        })
    }

    return questions.slice(0, count)
}

// ── Main Entry Point ──

/**
 * Generate vocabulary quiz questions deterministically from flashcard data.
 * No LLM calls needed — instant generation.
 *
 * Uses a pedagogically designed mix of question variants:
 * - singleChoice: translation L2→L1, L1→L2, conjugation pick
 * - multipleChoice: category members
 * - freetext: translation produce
 * - truefalse: translation check
 * - cloze: sentence vocabulary fill-in
 */
export function generateVocabQuizQuestions(
    flashcards: VocabFlashcard[],
    count: number,
    types: string[],
    language: string = 'Spanisch',
): QuestionToSave[] {
    if (flashcards.length < 4) return []

    const distribution = distributeQuestions(count, types)
    const allQuestions: QuestionToSave[] = []

    // singleChoice: split between L2→L1, L1→L2, and conjugation-pick
    if (distribution['singleChoice']) {
        const scCount = distribution['singleChoice']
        const hasVerbs = flashcards.some(
            (c) => c.partOfSpeech === 'Verb' && c.conjugation?.present
        )

        if (hasVerbs && scCount >= 3) {
            // Split: ~40% L2→L1, ~30% L1→L2, ~30% conjugation
            const l2l1Count = Math.ceil(scCount * 0.4)
            const l1l2Count = Math.floor(scCount * 0.3)
            const conjCount = scCount - l2l1Count - l1l2Count

            allQuestions.push(...generateTranslationL2ToL1(flashcards, flashcards, l2l1Count))
            allQuestions.push(...generateTranslationL1ToL2(flashcards, flashcards, l1l2Count, language))
            allQuestions.push(...generateConjugationPick(flashcards, conjCount))
        } else {
            // No verbs: split 50/50 between L2→L1 and L1→L2
            const l2l1Count = Math.ceil(scCount / 2)
            const l1l2Count = scCount - l2l1Count
            allQuestions.push(...generateTranslationL2ToL1(flashcards, flashcards, l2l1Count))
            allQuestions.push(...generateTranslationL1ToL2(flashcards, flashcards, l1l2Count, language))
        }
    }

    if (distribution['multipleChoice']) {
        allQuestions.push(...generateCategoryMembers(flashcards, distribution['multipleChoice']))
    }

    if (distribution['freetext']) {
        allQuestions.push(...generateTranslationProduce(flashcards, distribution['freetext'], language))
    }

    if (distribution['truefalse']) {
        allQuestions.push(...generateTranslationCheck(flashcards, flashcards, distribution['truefalse']))
    }

    if (distribution['cloze']) {
        allQuestions.push(...generateSentenceCloze(flashcards, distribution['cloze']))
    }

    if (distribution['fillInBlanks']) {
        allQuestions.push(...generateVocabFillInBlanks(flashcards, distribution['fillInBlanks']))
    }

    if (distribution['conjugation']) {
        allQuestions.push(...generateVocabConjugation(flashcards, distribution['conjugation']))
    }

    if (distribution['sentenceOrder']) {
        allQuestions.push(...generateVocabSentenceOrder(flashcards, distribution['sentenceOrder']))
    }

    return shuffle(allQuestions).slice(0, count)
}
