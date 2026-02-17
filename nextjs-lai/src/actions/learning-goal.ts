'use server'

import {
    upsertLearningGoal,
    deleteLearningGoal as deleteGoal,
} from '@/src/data-access/learning-goal'
import { revalidatePath } from 'next/cache'

export async function setLearningGoal(data: {
    language: string
    targetLevel: string
    deadline?: string | null
}) {
    const goal = await upsertLearningGoal({
        language: data.language,
        targetLevel: data.targetLevel,
        deadline: data.deadline ? new Date(data.deadline) : null,
    })
    revalidatePath('/learn')
    return goal
}

export async function removeLearningGoal(id: string) {
    await deleteGoal(id)
    revalidatePath('/learn')
}
