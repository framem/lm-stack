import type { LanguageSet } from './types'

export const enA2: LanguageSet = {
    id: 'en-a2',
    title: 'Englisch A2 Aufbauwortschatz',
    subject: 'Englisch',
    description: 'Englische Vokabeln für Fortgeschrittene Anfänger — Kleidung, Wohnung, Wetter und mehr. Validiert gegen die Goethe-Zertifikat A2 Wortliste.',
    level: 'A2',
    categories: [
        // ── 1. Familie & Zeit ──
        {
            name: 'Familie & Zeit',
            items: [
                { front: 'aunt', back: 'Tante', partOfSpeech: 'Nomen', exampleSentence: 'My aunt visits us every Sunday.' },
                { front: 'uncle', back: 'Onkel', partOfSpeech: 'Nomen', exampleSentence: 'My uncle has a big car.' },
                { front: 'night', back: 'Nacht', partOfSpeech: 'Nomen', exampleSentence: 'The night is dark and quiet.' },
            ],
        },

        // ── 2. Essen & Küche ──
        {
            name: 'Essen & Küche',
            items: [
                { front: 'cheese', back: 'Käse', partOfSpeech: 'Nomen', exampleSentence: 'This cheese is from France.' },
                { front: 'sugar', back: 'Zucker', partOfSpeech: 'Nomen', exampleSentence: 'I take sugar in my coffee.' },
                { front: 'soup', back: 'Suppe', partOfSpeech: 'Nomen', exampleSentence: 'The soup is hot.' },
                { front: 'orange', back: 'orange', partOfSpeech: 'Adjektiv', exampleSentence: 'I like orange juice.' },
            ],
        },

        // ── 3. Kleidung ──
        {
            name: 'Kleidung',
            items: [
                { front: 'shirt', back: 'Hemd', partOfSpeech: 'Nomen', exampleSentence: 'He wears a white shirt.' },
                { front: 'trousers', back: 'Hose', partOfSpeech: 'Nomen', exampleSentence: 'These trousers are too long.' },
                { front: 'dress', back: 'Kleid', partOfSpeech: 'Nomen', exampleSentence: 'She wears a beautiful dress.' },
                { front: 'hat', back: 'Hut / Mütze', partOfSpeech: 'Nomen', exampleSentence: 'He wears a hat in winter.' },
                { front: 'skirt', back: 'Rock', partOfSpeech: 'Nomen', exampleSentence: 'The skirt is blue.' },
                { front: 'coat', back: 'Mantel', partOfSpeech: 'Nomen', exampleSentence: 'It is cold, put on your coat.' },
                { front: 'sweater', back: 'Pullover', partOfSpeech: 'Nomen', exampleSentence: 'This sweater is very warm.' },
            ],
        },

        // ── 4. Haus & Wohnung ──
        {
            name: 'Haus & Wohnung',
            items: [
                { front: 'bedroom', back: 'Schlafzimmer', partOfSpeech: 'Nomen', exampleSentence: 'The bedroom has a large window.' },
                { front: 'door', back: 'Tür', partOfSpeech: 'Nomen', exampleSentence: 'Please close the door.' },
                { front: 'window', back: 'Fenster', partOfSpeech: 'Nomen', exampleSentence: 'Open the window, please.' },
                { front: 'chair', back: 'Stuhl', partOfSpeech: 'Nomen', exampleSentence: 'Please sit on the chair.' },
                { front: 'lamp', back: 'Lampe', partOfSpeech: 'Nomen', exampleSentence: 'Turn on the lamp, please.' },
                { front: 'floor', back: 'Boden / Stockwerk', partOfSpeech: 'Nomen', exampleSentence: 'The floor is clean.' },
            ],
        },

        // ── 5. Wetter & Natur ──
        {
            name: 'Wetter & Natur',
            items: [
                { front: 'snow', back: 'Schnee', partOfSpeech: 'Nomen', exampleSentence: 'Children love snow.' },
                { front: 'cloud', back: 'Wolke', partOfSpeech: 'Nomen', exampleSentence: 'There are many clouds in the sky.' },
                { front: 'warm', back: 'warm', partOfSpeech: 'Adjektiv', exampleSentence: 'It is warm in summer.' },
                { front: 'cold', back: 'kalt', partOfSpeech: 'Adjektiv', exampleSentence: 'It is very cold outside.' },
                { front: 'hot', back: 'heiß', partOfSpeech: 'Adjektiv', exampleSentence: 'The coffee is too hot.' },
                { front: 'storm', back: 'Sturm', partOfSpeech: 'Nomen', exampleSentence: 'There was a big storm last night.' },
                { front: 'sky', back: 'Himmel', partOfSpeech: 'Nomen', exampleSentence: 'The sky is blue and clear.' },
            ],
        },
    ],
}
