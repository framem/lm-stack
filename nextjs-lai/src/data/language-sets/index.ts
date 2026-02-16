import { enA1 } from './en-a1'
import { esA1 } from './es-a1'
import type { LanguageSet } from './types'

export type { LanguageSet, VocabItem, VocabCategory } from './types'

export const languageSets: LanguageSet[] = [enA1, esA1]

export function getLanguageSet(id: string): LanguageSet | undefined {
    return languageSets.find(set => set.id === id)
}
