'use server'

import {
    getSubjectOverview as dbGetSubjectOverview,
    getSubjectDetail as dbGetSubjectDetail,
} from '@/src/data-access/subjects'

export async function getSubjectOverview() {
    return dbGetSubjectOverview()
}

export async function getSubjectDetail(subject: string) {
    return dbGetSubjectDetail(subject)
}
