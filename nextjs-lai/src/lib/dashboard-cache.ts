import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { getDocuments } from '@/src/data-access/documents'
import { getSessions } from '@/src/data-access/chat'
import { getDocumentProgress, getDueReviewCount, getQuizzes } from '@/src/data-access/quiz'
import { getDueFlashcardCount, getFlashcardCount, getFlashcardDocumentProgress, getDueVocabularyCountByLanguage, getDueDocumentFlashcardCount } from '@/src/data-access/flashcards'
import { getOrCreateUserStats } from '@/src/data-access/user-stats'
import { getCefrProgress } from '@/src/data-access/learning-goal'
import { getTodayTasks } from '@/src/data-access/study-plan'

// React.cache() deduplicates identical calls within the same request.
// This prevents the dashboard from making the same DB query multiple times
// in a single render pass (e.g. if multiple components need the same data).
export const getCachedDocuments = cache(() => getDocuments())
export const getCachedSessions = cache(() => getSessions())
export const getCachedQuizzes = cache(() => getQuizzes())
export const getCachedDocumentProgress = cache(() => getDocumentProgress())
export const getCachedFlashcardDocumentProgress = cache(() => getFlashcardDocumentProgress())
export const getCachedDueReviewCount = cache(() => getDueReviewCount())
export const getCachedDueFlashcardCount = cache(() => getDueFlashcardCount())
export const getCachedFlashcardCount = cache(() => getFlashcardCount())
export const getCachedUserStats = cache(() => getOrCreateUserStats())
export const getCachedCefrProgress = cache(() => getCefrProgress())
export const getCachedTodayTasks = cache(() => getTodayTasks())
export const getCachedDueVocabByLanguage = cache(() => getDueVocabularyCountByLanguage())
export const getCachedDueDocumentFlashcardCount = cache(() => getDueDocumentFlashcardCount())

// Revalidation helpers — call after mutations to refresh dashboard
export function revalidateDocuments() { revalidatePath('/learn') }
export function revalidateQuizzes() { revalidatePath('/learn') }
export function revalidateFlashcards() { revalidatePath('/learn') }
export function revalidateSessions() { revalidatePath('/learn') }
export function revalidateUserStats() { revalidatePath('/learn') }
export function revalidateDashboard() { revalidatePath('/learn') }
