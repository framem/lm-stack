'use server'

import {
    startSession as dbStartSession,
    heartbeatSession as dbHeartbeatSession,
    endSession as dbEndSession,
    type ActivityType,
} from '@/src/data-access/learning-sessions'

export async function startLearningSession(activityType: ActivityType) {
    const session = await dbStartSession(activityType)
    return session.id
}

export async function heartbeatLearningSession(sessionId: string) {
    await dbHeartbeatSession(sessionId)
}

export async function endLearningSession(sessionId: string) {
    await dbEndSession(sessionId)
}
