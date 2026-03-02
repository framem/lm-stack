export interface ChallengeTemplate {
    title: string
    description: string
    area: string
    targetValue: number
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
    { title: 'Vokabel-Sprint', description: 'Lerne 30 neue Vokabeln diese Woche', area: 'vocabulary', targetValue: 30 },
    { title: 'Wiederholungs-König', description: 'Wiederhole 50 fällige Vokabeln', area: 'vocabulary', targetValue: 50 },
    { title: 'Quiz-Marathon', description: 'Beantworte 40 Quizfragen richtig', area: 'grammar', targetValue: 40 },
    { title: 'Schreibprofi', description: 'Schreibe 5 Texte und erhalte Feedback', area: 'writing', targetValue: 5 },
    { title: 'Gesprächspartner', description: 'Führe 3 Konversationsübungen durch', area: 'speaking', targetValue: 3 },
    { title: 'Hörversteher', description: 'Absolviere 3 Hörübungen', area: 'listening', targetValue: 3 },
    { title: 'Täglicher Lerner', description: 'Lerne an 5 von 7 Tagen', area: 'general', targetValue: 5 },
    { title: 'XP-Jäger', description: 'Sammle 200 XP in einer Woche', area: 'general', targetValue: 200 },
]
