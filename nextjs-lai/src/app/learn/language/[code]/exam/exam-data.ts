// ── Exam template data for the exam simulation module ──────────────────

export interface ExamQuestion {
    id: string
    type: 'multipleChoice' | 'cloze' | 'freeText' | 'trueFalse'
    prompt: string
    passage?: string
    options?: string[]
    correctIndex?: number
    correctAnswer?: string
    points: number
}

export interface ExamSection {
    id: string
    title: string
    type: 'reading' | 'listening' | 'writing' | 'grammar'
    timeMinutes: number
    questions: ExamQuestion[]
}

export interface ExamTemplate {
    id: string
    name: string
    level: string
    language: string        // ISO 639-1 code or 'any' for generic
    totalTimeMinutes: number
    passingPercentage: number
    sections: ExamSection[]
}

// ── Cambridge A2 Key (English) ─────────────────────────────────────────

const cambridgeA2Key: ExamTemplate = {
    id: 'cambridge-a2-key',
    name: 'Cambridge A2 Key',
    level: 'A2',
    language: 'en',
    totalTimeMinutes: 60,
    passingPercentage: 60,
    sections: [
        {
            id: 'cam-a2-reading',
            title: 'Leseverstehen',
            type: 'reading',
            timeMinutes: 20,
            questions: [
                {
                    id: 'cam-a2-r1',
                    type: 'multipleChoice',
                    prompt: 'Read the notice and answer the question.',
                    passage: 'LIBRARY NOTICE\nAll books must be returned by Friday 15th March. Late returns will be charged £1 per day. Students can renew books online at www.library.edu or at the front desk.',
                    options: [
                        'You can only renew books at the front desk.',
                        'You will pay a fine if you return books late.',
                        'The library is closing on 15th March.',
                        'Students cannot borrow books in March.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-a2-r2',
                    type: 'multipleChoice',
                    prompt: 'Read the email and choose the correct answer.',
                    passage: 'Hi Tom,\nI\'m having a birthday party next Saturday at my house. It starts at 7pm. Can you bring some music? Emma is bringing food and Jake is making a cake.\nSee you there!\nLucy',
                    options: [
                        'Tom is asked to bring food to the party.',
                        'The party is on Friday evening.',
                        'Lucy wants Tom to bring music.',
                        'Jake is bringing drinks.',
                    ],
                    correctIndex: 2,
                    points: 1,
                },
                {
                    id: 'cam-a2-r3',
                    type: 'trueFalse',
                    prompt: 'The cafe serves breakfast until 11:30.',
                    passage: 'SUNNY CAFE\nOpen Monday–Saturday 8am–6pm\nBreakfast served 8am–11:30am\nLunch specials from 12pm\nFree Wi-Fi available\nDogs welcome in the garden area',
                    options: ['True', 'False'],
                    correctIndex: 0,
                    points: 1,
                },
            ],
        },
        {
            id: 'cam-a2-listening',
            title: 'Hörverstehen',
            type: 'listening',
            timeMinutes: 15,
            questions: [
                {
                    id: 'cam-a2-l1',
                    type: 'multipleChoice',
                    prompt: 'A woman is talking about her holiday. Where did she go?',
                    options: ['Spain', 'Italy', 'Greece'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-a2-l2',
                    type: 'multipleChoice',
                    prompt: 'What time does the train leave?',
                    options: ['9:15', '9:45', '10:15'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-a2-l3',
                    type: 'trueFalse',
                    prompt: 'The man says the restaurant is expensive.',
                    options: ['True', 'False'],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
        {
            id: 'cam-a2-writing',
            title: 'Schriftlicher Ausdruck',
            type: 'writing',
            timeMinutes: 15,
            questions: [
                {
                    id: 'cam-a2-w1',
                    type: 'freeText',
                    prompt: 'Your English friend Sam is coming to visit your town next week. Write an email to Sam. In your email:\n- suggest what you can do together\n- tell Sam what the weather will be like\n- ask Sam what time the train arrives\n\nWrite 25–35 words.',
                    points: 5,
                },
            ],
        },
        {
            id: 'cam-a2-grammar',
            title: 'Grammatik & Wortschatz',
            type: 'grammar',
            timeMinutes: 10,
            questions: [
                {
                    id: 'cam-a2-g1',
                    type: 'cloze',
                    prompt: 'Complete the sentence with the correct word.',
                    passage: 'She ___ to the cinema every weekend.',
                    options: ['go', 'goes', 'going', 'gone'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-a2-g2',
                    type: 'multipleChoice',
                    prompt: 'Choose the correct sentence.',
                    options: [
                        'I have went to London last year.',
                        'I went to London last year.',
                        'I was go to London last year.',
                        'I going to London last year.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-a2-g3',
                    type: 'cloze',
                    prompt: 'Choose the correct word to complete the sentence.',
                    passage: 'There aren\'t ___ apples in the fridge.',
                    options: ['some', 'any', 'much', 'a'],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
    ],
}

// ── Cambridge B1 Preliminary (English) ─────────────────────────────────

const cambridgeB1Preliminary: ExamTemplate = {
    id: 'cambridge-b1-preliminary',
    name: 'Cambridge B1 Preliminary',
    level: 'B1',
    language: 'en',
    totalTimeMinutes: 75,
    passingPercentage: 60,
    sections: [
        {
            id: 'cam-b1-reading',
            title: 'Leseverstehen',
            type: 'reading',
            timeMinutes: 25,
            questions: [
                {
                    id: 'cam-b1-r1',
                    type: 'multipleChoice',
                    prompt: 'Read the article and answer the question: What is the main purpose of the new city park?',
                    passage: 'The city council has announced plans for a new park in the centre of town. The Green Heart project will transform an old car park into a green space with walking paths, a children\'s playground, and a small lake. The council hopes it will encourage more people to spend time outdoors and reduce stress levels. Construction begins in April and the park is expected to open by September.',
                    options: [
                        'To provide parking for visitors to the town centre.',
                        'To help people relax and enjoy being outside.',
                        'To create a new area for building houses.',
                        'To attract tourists from other countries.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-b1-r2',
                    type: 'trueFalse',
                    prompt: 'According to the text, the park will include a swimming pool.',
                    passage: 'The city council has announced plans for a new park in the centre of town. The Green Heart project will transform an old car park into a green space with walking paths, a children\'s playground, and a small lake.',
                    options: ['True', 'False'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-b1-r3',
                    type: 'multipleChoice',
                    prompt: 'Read the review. What does the writer think about the film?',
                    passage: 'I went to see "The Last Journey" at the cinema last night. Although the special effects were impressive and the acting was excellent, I found the story rather predictable. By the middle of the film, I had already guessed the ending. However, the soundtrack was beautiful and I would still recommend it to anyone who enjoys science fiction.',
                    options: [
                        'It was perfect in every way.',
                        'It was good but the story was not surprising.',
                        'The acting was disappointing.',
                        'The soundtrack ruined the film.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
        {
            id: 'cam-b1-listening',
            title: 'Hörverstehen',
            type: 'listening',
            timeMinutes: 20,
            questions: [
                {
                    id: 'cam-b1-l1',
                    type: 'multipleChoice',
                    prompt: 'You hear a woman talking about her job. What does she like most about it?',
                    options: [
                        'The salary is very good.',
                        'She can work from home sometimes.',
                        'She meets interesting people every day.',
                    ],
                    correctIndex: 2,
                    points: 1,
                },
                {
                    id: 'cam-b1-l2',
                    type: 'multipleChoice',
                    prompt: 'You hear a conversation between two students. What are they planning to do?',
                    options: [
                        'Study together at the library.',
                        'Go to a concert this evening.',
                        'Have dinner at a new restaurant.',
                    ],
                    correctIndex: 0,
                    points: 1,
                },
            ],
        },
        {
            id: 'cam-b1-writing',
            title: 'Schriftlicher Ausdruck',
            type: 'writing',
            timeMinutes: 15,
            questions: [
                {
                    id: 'cam-b1-w1',
                    type: 'freeText',
                    prompt: 'You recently saw this announcement on an English-language website:\n\nArticles wanted!\nMy favourite hobby\nTell us about your favourite hobby. Why do you enjoy it? How often do you do it? Would you recommend it to other people?\n\nWrite your article in about 100 words.',
                    points: 10,
                },
            ],
        },
        {
            id: 'cam-b1-grammar',
            title: 'Grammatik & Wortschatz',
            type: 'grammar',
            timeMinutes: 15,
            questions: [
                {
                    id: 'cam-b1-g1',
                    type: 'cloze',
                    prompt: 'Complete the sentence with the correct form.',
                    passage: 'If I ___ more time, I would learn to play the guitar.',
                    options: ['have', 'had', 'would have', 'having'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-b1-g2',
                    type: 'multipleChoice',
                    prompt: 'Which sentence is grammatically correct?',
                    options: [
                        'She suggested me to go to the doctor.',
                        'She suggested that I go to the doctor.',
                        'She suggested I to go to the doctor.',
                        'She suggested for me going to the doctor.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'cam-b1-g3',
                    type: 'cloze',
                    prompt: 'Complete the sentence.',
                    passage: 'He has been living in London ___ 2019.',
                    options: ['for', 'since', 'from', 'during'],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
    ],
}

// ── Generic Sprachprüfung A1 ───────────────────────────────────────────

const genericA1: ExamTemplate = {
    id: 'generic-a1',
    name: 'Sprachprüfung A1',
    level: 'A1',
    language: 'any',
    totalTimeMinutes: 45,
    passingPercentage: 60,
    sections: [
        {
            id: 'gen-a1-reading',
            title: 'Leseverstehen',
            type: 'reading',
            timeMinutes: 15,
            questions: [
                {
                    id: 'gen-a1-r1',
                    type: 'multipleChoice',
                    prompt: 'Read the sign and choose what it means.',
                    passage: 'CLOSED ON SUNDAYS',
                    options: [
                        'The shop is open every day.',
                        'The shop does not open on Sundays.',
                        'The shop opens only on Sundays.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'gen-a1-r2',
                    type: 'trueFalse',
                    prompt: 'Maria likes coffee.',
                    passage: 'My name is Maria. I am 25 years old. I live in Berlin. I like tea but I don\'t like coffee. I have a cat named Luna.',
                    options: ['True', 'False'],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
        {
            id: 'gen-a1-listening',
            title: 'Hörverstehen',
            type: 'listening',
            timeMinutes: 10,
            questions: [
                {
                    id: 'gen-a1-l1',
                    type: 'multipleChoice',
                    prompt: 'You hear someone introducing themselves. What is their job?',
                    options: ['Teacher', 'Doctor', 'Student'],
                    correctIndex: 2,
                    points: 1,
                },
                {
                    id: 'gen-a1-l2',
                    type: 'trueFalse',
                    prompt: 'The person says they have two children.',
                    options: ['True', 'False'],
                    correctIndex: 0,
                    points: 1,
                },
            ],
        },
        {
            id: 'gen-a1-writing',
            title: 'Schriftlicher Ausdruck',
            type: 'writing',
            timeMinutes: 10,
            questions: [
                {
                    id: 'gen-a1-w1',
                    type: 'freeText',
                    prompt: 'Write a short text about yourself (20–30 words). Include:\n- Your name\n- Where you live\n- What you like to do',
                    points: 5,
                },
            ],
        },
        {
            id: 'gen-a1-grammar',
            title: 'Grammatik & Wortschatz',
            type: 'grammar',
            timeMinutes: 10,
            questions: [
                {
                    id: 'gen-a1-g1',
                    type: 'multipleChoice',
                    prompt: 'Choose the correct word: "I ___ a student."',
                    options: ['am', 'is', 'are', 'be'],
                    correctIndex: 0,
                    points: 1,
                },
                {
                    id: 'gen-a1-g2',
                    type: 'multipleChoice',
                    prompt: 'What is the plural of "child"?',
                    options: ['childs', 'childen', 'children', 'childes'],
                    correctIndex: 2,
                    points: 1,
                },
            ],
        },
    ],
}

// ── Generic Sprachprüfung A2 ───────────────────────────────────────────

const genericA2: ExamTemplate = {
    id: 'generic-a2',
    name: 'Sprachprüfung A2',
    level: 'A2',
    language: 'any',
    totalTimeMinutes: 55,
    passingPercentage: 60,
    sections: [
        {
            id: 'gen-a2-reading',
            title: 'Leseverstehen',
            type: 'reading',
            timeMinutes: 18,
            questions: [
                {
                    id: 'gen-a2-r1',
                    type: 'multipleChoice',
                    prompt: 'Read the text and answer the question: Why does Paul take the bus to work?',
                    passage: 'Paul lives in a small town near Munich. He works in an office in the city centre. Every morning he takes the bus because parking in the city is very expensive. The bus takes about 30 minutes.',
                    options: [
                        'He does not have a car.',
                        'Parking in the city costs too much.',
                        'His office is near the bus stop.',
                        'He enjoys riding the bus.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'gen-a2-r2',
                    type: 'trueFalse',
                    prompt: 'The restaurant is open for lunch on Sundays.',
                    passage: 'BELLA ITALIA RESTAURANT\nOpen: Tue–Sat 12:00–22:00\nSunday: 17:00–21:00 (dinner only)\nMonday: Closed\nReservations: 089-12345',
                    options: ['True', 'False'],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
        {
            id: 'gen-a2-listening',
            title: 'Hörverstehen',
            type: 'listening',
            timeMinutes: 12,
            questions: [
                {
                    id: 'gen-a2-l1',
                    type: 'multipleChoice',
                    prompt: 'You hear an announcement at a train station. Which platform does the train leave from?',
                    options: ['Platform 3', 'Platform 7', 'Platform 12'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'gen-a2-l2',
                    type: 'multipleChoice',
                    prompt: 'You hear two people talking in a shop. What does the woman want to buy?',
                    options: ['A blue jacket', 'A red dress', 'Black shoes'],
                    correctIndex: 0,
                    points: 1,
                },
            ],
        },
        {
            id: 'gen-a2-writing',
            title: 'Schriftlicher Ausdruck',
            type: 'writing',
            timeMinutes: 12,
            questions: [
                {
                    id: 'gen-a2-w1',
                    type: 'freeText',
                    prompt: 'Your friend has invited you to a party. Write a short reply (30–40 words):\n- Thank your friend for the invitation\n- Say whether you can come\n- Ask what you should bring',
                    points: 5,
                },
            ],
        },
        {
            id: 'gen-a2-grammar',
            title: 'Grammatik & Wortschatz',
            type: 'grammar',
            timeMinutes: 13,
            questions: [
                {
                    id: 'gen-a2-g1',
                    type: 'cloze',
                    prompt: 'Complete the sentence.',
                    passage: 'We ___ to the beach yesterday.',
                    options: ['go', 'went', 'gone', 'going'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'gen-a2-g2',
                    type: 'multipleChoice',
                    prompt: 'Choose the correct preposition: "I am interested ___ learning new languages."',
                    options: ['on', 'at', 'in', 'for'],
                    correctIndex: 2,
                    points: 1,
                },
                {
                    id: 'gen-a2-g3',
                    type: 'cloze',
                    prompt: 'Choose the right word.',
                    passage: 'She ___ never been to Paris.',
                    options: ['have', 'has', 'is', 'was'],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
    ],
}

// ── Generic Sprachprüfung B1 ───────────────────────────────────────────

const genericB1: ExamTemplate = {
    id: 'generic-b1',
    name: 'Sprachprüfung B1',
    level: 'B1',
    language: 'any',
    totalTimeMinutes: 65,
    passingPercentage: 60,
    sections: [
        {
            id: 'gen-b1-reading',
            title: 'Leseverstehen',
            type: 'reading',
            timeMinutes: 20,
            questions: [
                {
                    id: 'gen-b1-r1',
                    type: 'multipleChoice',
                    prompt: 'What is the author\'s main argument in the text?',
                    passage: 'Working from home has become increasingly popular since 2020. While many employees enjoy the flexibility and the lack of a daily commute, some research suggests that remote workers may feel more isolated and find it harder to separate work from personal life. Companies are now experimenting with hybrid models that offer the best of both worlds.',
                    options: [
                        'Working from home is always better than going to an office.',
                        'Remote work has advantages and disadvantages.',
                        'Companies should not allow working from home.',
                        'All employees prefer to work in an office.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'gen-b1-r2',
                    type: 'trueFalse',
                    prompt: 'According to the text, hybrid work models combine office and remote work.',
                    passage: 'Companies are now experimenting with hybrid models that offer the best of both worlds — some days in the office for collaboration and some days at home for focused work.',
                    options: ['True', 'False'],
                    correctIndex: 0,
                    points: 1,
                },
                {
                    id: 'gen-b1-r3',
                    type: 'multipleChoice',
                    prompt: 'Read the text. What problem does the writer describe?',
                    passage: 'Social media has changed the way we communicate, but not always for the better. Many young people spend hours scrolling through their feeds instead of talking to friends and family face to face. Studies have shown that excessive social media use can lead to feelings of anxiety and loneliness.',
                    options: [
                        'Social media is too expensive for young people.',
                        'Too much social media can negatively affect mental health.',
                        'Young people do not know how to use social media.',
                        'Social media companies need better technology.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
        {
            id: 'gen-b1-listening',
            title: 'Hörverstehen',
            type: 'listening',
            timeMinutes: 15,
            questions: [
                {
                    id: 'gen-b1-l1',
                    type: 'multipleChoice',
                    prompt: 'You hear a radio report about a new museum. When will it open?',
                    options: ['Next month', 'Next spring', 'Next year'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'gen-b1-l2',
                    type: 'multipleChoice',
                    prompt: 'You hear two colleagues discussing a project. What do they agree to do?',
                    options: [
                        'Postpone the deadline by one week.',
                        'Ask for help from another team.',
                        'Work overtime this weekend.',
                    ],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
        {
            id: 'gen-b1-writing',
            title: 'Schriftlicher Ausdruck',
            type: 'writing',
            timeMinutes: 15,
            questions: [
                {
                    id: 'gen-b1-w1',
                    type: 'freeText',
                    prompt: 'Write a short essay (80–100 words) about the following topic:\n\n"Should schools start teaching computer programming from primary school?"\n\nGive your opinion and provide at least two reasons to support it.',
                    points: 10,
                },
            ],
        },
        {
            id: 'gen-b1-grammar',
            title: 'Grammatik & Wortschatz',
            type: 'grammar',
            timeMinutes: 15,
            questions: [
                {
                    id: 'gen-b1-g1',
                    type: 'cloze',
                    prompt: 'Complete the sentence.',
                    passage: 'By the time we arrived, the concert ___ already started.',
                    options: ['has', 'had', 'have', 'was'],
                    correctIndex: 1,
                    points: 1,
                },
                {
                    id: 'gen-b1-g2',
                    type: 'multipleChoice',
                    prompt: 'Which word best completes the sentence: "Despite the rain, we decided to ___ with the picnic."',
                    options: ['carry on', 'carry out', 'carry off', 'carry away'],
                    correctIndex: 0,
                    points: 1,
                },
                {
                    id: 'gen-b1-g3',
                    type: 'cloze',
                    prompt: 'Choose the correct form.',
                    passage: 'I wish I ___ speak French fluently.',
                    options: ['can', 'could', 'would', 'should'],
                    correctIndex: 1,
                    points: 1,
                },
            ],
        },
    ],
}

// ── Exam registry ──────────────────────────────────────────────────────

export const ALL_EXAMS: ExamTemplate[] = [
    cambridgeA2Key,
    cambridgeB1Preliminary,
    genericA1,
    genericA2,
    genericB1,
]

// Get exams applicable for a given language code
export function getExamsForLanguage(languageCode: string): ExamTemplate[] {
    return ALL_EXAMS.filter(
        (exam) => exam.language === languageCode || exam.language === 'any'
    )
}

// Get a single exam by id
export function getExamById(examId: string): ExamTemplate | undefined {
    return ALL_EXAMS.find((exam) => exam.id === examId)
}
