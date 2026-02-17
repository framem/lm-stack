import type { LanguageSet } from './types'

export const enA2: LanguageSet = {
    id: 'en-a2',
    title: 'Englisch A2 Aufbauwortschatz',
    subject: 'Englisch',
    description: 'Englische Vokabeln für fortgeschrittene Anfänger — Alltag, Gesundheit, Freizeit und mehr. Orientiert am Cambridge CEFR A2 (Key).',
    level: 'A2',
    categories: [
        // ── 1. Familie & Zeit ──
        {
            name: 'Familie & Zeit',
            items: [
                { front: 'aunt', back: 'Tante', partOfSpeech: 'Nomen', exampleSentence: 'My aunt visits us every Sunday.' },
                { front: 'uncle', back: 'Onkel', partOfSpeech: 'Nomen', exampleSentence: 'My uncle has a big car.' },
                { front: 'cousin', back: 'Cousin / Cousine', partOfSpeech: 'Nomen', exampleSentence: 'My cousin lives in London.' },
                { front: 'husband', back: 'Ehemann', partOfSpeech: 'Nomen', exampleSentence: 'Her husband works at a bank.' },
                { front: 'wife', back: 'Ehefrau', partOfSpeech: 'Nomen', exampleSentence: 'His wife is a doctor.' },
                { front: 'birthday', back: 'Geburtstag', partOfSpeech: 'Nomen', exampleSentence: 'Tomorrow is my birthday.' },
                { front: 'night', back: 'Nacht', partOfSpeech: 'Nomen', exampleSentence: 'The night is dark and quiet.' },
                { front: 'weekend', back: 'Wochenende', partOfSpeech: 'Nomen', exampleSentence: 'I go to the countryside at the weekend.' },
                { front: 'before', back: 'vorher / bevor', partOfSpeech: 'Adverb', exampleSentence: 'I always wash my hands before eating.' },
                { front: 'after', back: 'danach / nach', partOfSpeech: 'Adverb', exampleSentence: 'After work, I go to the gym.' },
            ],
        },

        // ── 2. Essen & Küche ──
        {
            name: 'Essen & Küche',
            items: [
                { front: 'cheese', back: 'Käse', partOfSpeech: 'Nomen', exampleSentence: 'This cheese is from France.' },
                { front: 'sugar', back: 'Zucker', partOfSpeech: 'Nomen', exampleSentence: 'I take sugar in my coffee.' },
                { front: 'soup', back: 'Suppe', partOfSpeech: 'Nomen', exampleSentence: 'The soup is hot.' },
                { front: 'salad', back: 'Salat', partOfSpeech: 'Nomen', exampleSentence: 'I have a salad for lunch.' },
                { front: 'fruit', back: 'Obst', partOfSpeech: 'Nomen', exampleSentence: 'I eat fruit every day.' },
                { front: 'vegetables', back: 'Gemüse', partOfSpeech: 'Nomen', exampleSentence: 'Vegetables are very healthy.' },
                { front: 'meat', back: 'Fleisch', partOfSpeech: 'Nomen', exampleSentence: 'I don\'t eat much meat.' },
                { front: 'breakfast', back: 'Frühstück', partOfSpeech: 'Nomen', exampleSentence: 'I have breakfast at seven.' },
                { front: 'lunch', back: 'Mittagessen', partOfSpeech: 'Nomen', exampleSentence: 'Lunch is at twelve o\'clock.' },
                { front: 'dinner', back: 'Abendessen', partOfSpeech: 'Nomen', exampleSentence: 'We have dinner together as a family.' },
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
                { front: 't-shirt', back: 'T-Shirt', partOfSpeech: 'Nomen', exampleSentence: 'I am wearing a blue t-shirt.' },
            ],
        },

        // ── 4. Haus & Wohnung ──
        {
            name: 'Haus & Wohnung',
            items: [
                { front: 'bedroom', back: 'Schlafzimmer', partOfSpeech: 'Nomen', exampleSentence: 'The bedroom has a large window.' },
                { front: 'living room', back: 'Wohnzimmer', partOfSpeech: 'Nomen', exampleSentence: 'We watch TV in the living room.' },
                { front: 'door', back: 'Tür', partOfSpeech: 'Nomen', exampleSentence: 'Please close the door.' },
                { front: 'window', back: 'Fenster', partOfSpeech: 'Nomen', exampleSentence: 'Open the window, please.' },
                { front: 'chair', back: 'Stuhl', partOfSpeech: 'Nomen', exampleSentence: 'Please sit on the chair.' },
                { front: 'lamp', back: 'Lampe', partOfSpeech: 'Nomen', exampleSentence: 'Turn on the lamp, please.' },
                { front: 'wardrobe', back: 'Schrank', partOfSpeech: 'Nomen', exampleSentence: 'The clothes are in the wardrobe.' },
                { front: 'fridge', back: 'Kühlschrank', partOfSpeech: 'Nomen', exampleSentence: 'Put the milk in the fridge.' },
                { front: 'floor', back: 'Boden / Stockwerk', partOfSpeech: 'Nomen', exampleSentence: 'The floor is clean.' },
            ],
        },

        // ── 5. Wetter & Natur ──
        {
            name: 'Wetter & Natur',
            items: [
                { front: 'snow', back: 'Schnee', partOfSpeech: 'Nomen', exampleSentence: 'Children love snow.' },
                { front: 'cloud', back: 'Wolke', partOfSpeech: 'Nomen', exampleSentence: 'There are many clouds in the sky.' },
                { front: 'storm', back: 'Sturm', partOfSpeech: 'Nomen', exampleSentence: 'There was a big storm last night.' },
                { front: 'sky', back: 'Himmel', partOfSpeech: 'Nomen', exampleSentence: 'The sky is blue and clear.' },
                { front: 'sea', back: 'Meer', partOfSpeech: 'Nomen', exampleSentence: 'I love swimming in the sea.' },
                { front: 'mountain', back: 'Berg', partOfSpeech: 'Nomen', exampleSentence: 'The mountain is covered in snow.' },
                { front: 'river', back: 'Fluss', partOfSpeech: 'Nomen', exampleSentence: 'The river runs through the city.' },
                { front: 'warm', back: 'warm', partOfSpeech: 'Adjektiv', exampleSentence: 'It is warm in summer.' },
                { front: 'cold', back: 'kalt', partOfSpeech: 'Adjektiv', exampleSentence: 'It is very cold outside.' },
            ],
        },

        // ── 6. Körper & Gesundheit ──
        {
            name: 'Körper & Gesundheit',
            items: [
                { front: 'head', back: 'Kopf', partOfSpeech: 'Nomen', exampleSentence: 'I have a headache.' },
                { front: 'arm', back: 'Arm', partOfSpeech: 'Nomen', exampleSentence: 'I broke my arm.' },
                { front: 'leg', back: 'Bein', partOfSpeech: 'Nomen', exampleSentence: 'My right leg hurts.' },
                { front: 'eye', back: 'Auge', partOfSpeech: 'Nomen', exampleSentence: 'She has blue eyes.' },
                { front: 'hospital', back: 'Krankenhaus', partOfSpeech: 'Nomen', exampleSentence: 'The hospital is near the centre.' },
                { front: 'medicine', back: 'Medikament', partOfSpeech: 'Nomen', exampleSentence: 'I take this medicine twice a day.' },
                { front: 'ill', back: 'krank', partOfSpeech: 'Adjektiv', exampleSentence: 'I am ill and cannot work.' },
                { front: 'healthy', back: 'gesund', partOfSpeech: 'Adjektiv', exampleSentence: 'I eat well to stay healthy.' },
                { front: 'pain', back: 'Schmerz', partOfSpeech: 'Nomen', exampleSentence: 'I have a pain in my stomach.' },
            ],
        },

        // ── 7. Hobbys & Freizeit ──
        {
            name: 'Hobbys & Freizeit',
            items: [
                { front: 'sport', back: 'Sport', partOfSpeech: 'Nomen', exampleSentence: 'I do sport three times a week.' },
                { front: 'football', back: 'Fußball', partOfSpeech: 'Nomen', exampleSentence: 'I play football on Saturdays.' },
                { front: 'music', back: 'Musik', partOfSpeech: 'Nomen', exampleSentence: 'I really like music.' },
                { front: 'cinema', back: 'Kino', partOfSpeech: 'Nomen', exampleSentence: 'We go to the cinema on Fridays.' },
                { front: 'theatre', back: 'Theater', partOfSpeech: 'Nomen', exampleSentence: 'I went to the theatre on Saturday.' },
                { front: 'beach', back: 'Strand', partOfSpeech: 'Nomen', exampleSentence: 'In summer we go to the beach.' },
                { front: 'trip', back: 'Reise / Ausflug', partOfSpeech: 'Nomen', exampleSentence: 'The trip to Paris was amazing.' },
                { front: 'photo', back: 'Foto', partOfSpeech: 'Nomen', exampleSentence: 'I take lots of photos on holiday.' },
            ],
        },

        // ── 8. Berufe & Arbeit ──
        {
            name: 'Berufe & Arbeit',
            items: [
                { front: 'teacher', back: 'Lehrer / Lehrerin', partOfSpeech: 'Nomen', exampleSentence: 'My English teacher is very nice.' },
                { front: 'doctor', back: 'Arzt / Ärztin', partOfSpeech: 'Nomen', exampleSentence: 'The doctor gave me antibiotics.' },
                { front: 'nurse', back: 'Krankenpfleger/-schwester', partOfSpeech: 'Nomen', exampleSentence: 'The nurse is very kind.' },
                { front: 'cook', back: 'Koch / Köchin', partOfSpeech: 'Nomen', exampleSentence: 'The cook prepares delicious food.' },
                { front: 'police officer', back: 'Polizist / Polizistin', partOfSpeech: 'Nomen', exampleSentence: 'The police officer helped us find the way.' },
                { front: 'office', back: 'Büro', partOfSpeech: 'Nomen', exampleSentence: 'I work in an office in the centre.' },
                { front: 'meeting', back: 'Besprechung / Treffen', partOfSpeech: 'Nomen', exampleSentence: 'I have a meeting at ten o\'clock.' },
            ],
        },

        // ── 9. Transport & Reise ──
        {
            name: 'Transport & Reise',
            items: [
                { front: 'airport', back: 'Flughafen', partOfSpeech: 'Nomen', exampleSentence: 'The airport is twenty kilometres away.' },
                { front: 'plane', back: 'Flugzeug', partOfSpeech: 'Nomen', exampleSentence: 'We travelled by plane to Mexico.' },
                { front: 'ticket', back: 'Fahrkarte / Ticket', partOfSpeech: 'Nomen', exampleSentence: 'I bought the train ticket online.' },
                { front: 'suitcase', back: 'Koffer', partOfSpeech: 'Nomen', exampleSentence: 'My suitcase is very heavy.' },
                { front: 'hotel', back: 'Hotel', partOfSpeech: 'Nomen', exampleSentence: 'The hotel is near the beach.' },
                { front: 'street', back: 'Straße', partOfSpeech: 'Nomen', exampleSentence: 'The street is very quiet.' },
                { front: 'map', back: 'Karte / Plan', partOfSpeech: 'Nomen', exampleSentence: 'I need a map of the city.' },
            ],
        },

        // ── 10. Gefühle & Eigenschaften ──
        {
            name: 'Gefühle & Eigenschaften',
            items: [
                { front: 'pleased', back: 'zufrieden / erfreut', partOfSpeech: 'Adjektiv', exampleSentence: 'I am very pleased with my work.' },
                { front: 'sad', back: 'traurig', partOfSpeech: 'Adjektiv', exampleSentence: 'She was sad when he left.' },
                { front: 'tired', back: 'müde', partOfSpeech: 'Adjektiv', exampleSentence: 'I am very tired after work.' },
                { front: 'nervous', back: 'nervös', partOfSpeech: 'Adjektiv', exampleSentence: 'I am nervous before the exam.' },
                { front: 'friendly', back: 'freundlich', partOfSpeech: 'Adjektiv', exampleSentence: 'My neighbour is very friendly.' },
                { front: 'clever', back: 'klug / intelligent', partOfSpeech: 'Adjektiv', exampleSentence: 'She is a very clever student.' },
                { front: 'calm', back: 'ruhig / gelassen', partOfSpeech: 'Adjektiv', exampleSentence: 'You need to stay calm in the exam.' },
                { front: 'kind', back: 'nett / liebenswürdig', partOfSpeech: 'Adjektiv', exampleSentence: 'The receptionist is very kind.' },
            ],
        },

        // ── 11. Adjektive & Adverbien ──
        {
            name: 'Adjektive & Adverbien',
            items: [
                { front: 'a lot', back: 'viel', partOfSpeech: 'Adverb', exampleSentence: 'There is a lot of work today.' },
                { front: 'a little', back: 'ein wenig', partOfSpeech: 'Adverb', exampleSentence: 'I speak a little Spanish.' },
                { front: 'quite', back: 'ziemlich', partOfSpeech: 'Adverb', exampleSentence: 'The hotel is quite comfortable.' },
                { front: 'too', back: 'zu / zu sehr', partOfSpeech: 'Adverb', exampleSentence: 'This coat is too expensive.' },
                { front: 'still', back: 'noch / immer noch', partOfSpeech: 'Adverb', exampleSentence: 'I am still studying English.' },
                { front: 'already', back: 'schon / bereits', partOfSpeech: 'Adverb', exampleSentence: 'Have you already eaten?' },
                { front: 'near', back: 'nah / in der Nähe', partOfSpeech: 'Adverb', exampleSentence: 'The shop is near here.' },
                { front: 'far', back: 'weit / entfernt', partOfSpeech: 'Adverb', exampleSentence: 'The airport is far from the centre.' },
            ],
        },

        // ── 12. Verben ──
        {
            name: 'Verben',
            items: [
                {
                    front: 'to want',
                    back: 'wollen / möchten',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I want to learn more English.',
                    conjugation: {
                        present: { I: 'want', you: 'want', 'he/she': 'wants', we: 'want', they: 'want' },
                        past: { I: 'wanted', you: 'wanted', 'he/she': 'wanted', we: 'wanted', they: 'wanted' },
                    },
                },
                {
                    front: 'to make',
                    back: 'machen / herstellen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'What do you make for dinner?',
                    conjugation: {
                        present: { I: 'make', you: 'make', 'he/she': 'makes', we: 'make', they: 'make' },
                        past: { I: 'made', you: 'made', 'he/she': 'made', we: 'made', they: 'made' },
                    },
                },
                {
                    front: 'to know',
                    back: 'wissen / kennen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I don\'t know where my key is.',
                    conjugation: {
                        present: { I: 'know', you: 'know', 'he/she': 'knows', we: 'know', they: 'know' },
                        past: { I: 'knew', you: 'knew', 'he/she': 'knew', we: 'knew', they: 'knew' },
                    },
                },
                {
                    front: 'to say',
                    back: 'sagen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'What did you say? I didn\'t hear you.',
                    conjugation: {
                        present: { I: 'say', you: 'say', 'he/she': 'says', we: 'say', they: 'say' },
                        past: { I: 'said', you: 'said', 'he/she': 'said', we: 'said', they: 'said' },
                    },
                },
                {
                    front: 'to leave',
                    back: 'verlassen / abfahren',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I leave work at six o\'clock.',
                    conjugation: {
                        present: { I: 'leave', you: 'leave', 'he/she': 'leaves', we: 'leave', they: 'leave' },
                        past: { I: 'left', you: 'left', 'he/she': 'left', we: 'left', they: 'left' },
                    },
                },
                {
                    front: 'to arrive',
                    back: 'ankommen / eintreffen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'The train arrives at eight.',
                    conjugation: {
                        present: { I: 'arrive', you: 'arrive', 'he/she': 'arrives', we: 'arrive', they: 'arrive' },
                        past: { I: 'arrived', you: 'arrived', 'he/she': 'arrived', we: 'arrived', they: 'arrived' },
                    },
                },
                {
                    front: 'to write',
                    back: 'schreiben',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I write an email to my teacher.',
                    conjugation: {
                        present: { I: 'write', you: 'write', 'he/she': 'writes', we: 'write', they: 'write' },
                        past: { I: 'wrote', you: 'wrote', 'he/she': 'wrote', we: 'wrote', they: 'wrote' },
                    },
                },
                {
                    front: 'to read',
                    back: 'lesen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I read the newspaper every morning.',
                    conjugation: {
                        present: { I: 'read', you: 'read', 'he/she': 'reads', we: 'read', they: 'read' },
                        past: { I: 'read', you: 'read', 'he/she': 'read', we: 'read', they: 'read' },
                    },
                },
                {
                    front: 'to listen',
                    back: 'zuhören / hören',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I listen to music when I cook.',
                    conjugation: {
                        present: { I: 'listen', you: 'listen', 'he/she': 'listens', we: 'listen', they: 'listen' },
                        past: { I: 'listened', you: 'listened', 'he/she': 'listened', we: 'listened', they: 'listened' },
                    },
                },
                {
                    front: 'to see',
                    back: 'sehen / schauen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I see a film tonight.',
                    conjugation: {
                        present: { I: 'see', you: 'see', 'he/she': 'sees', we: 'see', they: 'see' },
                        past: { I: 'saw', you: 'saw', 'he/she': 'saw', we: 'saw', they: 'saw' },
                    },
                },
                {
                    front: 'to put',
                    back: 'stellen / legen / setzen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Put the book on the table, please.',
                    conjugation: {
                        present: { I: 'put', you: 'put', 'he/she': 'puts', we: 'put', they: 'put' },
                        past: { I: 'put', you: 'put', 'he/she': 'put', we: 'put', they: 'put' },
                    },
                },
                {
                    front: 'to think',
                    back: 'denken / glauben',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I think this is a good idea.',
                    conjugation: {
                        present: { I: 'think', you: 'think', 'he/she': 'thinks', we: 'think', they: 'think' },
                        past: { I: 'thought', you: 'thought', 'he/she': 'thought', we: 'thought', they: 'thought' },
                    },
                },
            ],
        },
    ],
}
