import { enA1 } from './en-a1'
import { enA2 } from './en-a2'
import { esA1 } from './es-a1'
import { esA2 } from './es-a2'
import type { LanguageSet } from './types'

export type { LanguageSet, VocabItem, VocabCategory } from './types'

export const languageSets: LanguageSet[] = [enA1, enA2, esA1, esA2]

export function getLanguageSet(id: string): LanguageSet | undefined {
    return languageSets.find(set => set.id === id)
}
