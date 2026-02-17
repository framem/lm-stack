import type { LanguageSet } from './types'

export const enA1: LanguageSet = {
    id: 'en-a1',
    title: 'Englisch A1 Grundwortschatz',
    subject: 'Englisch',
    description: 'Grundlegende englische Vokabeln für Anfänger — Alltagswörter, Verben mit Konjugation und Beispielsätzen. Validiert gegen die Goethe-Zertifikat A1 Wortliste.',
    level: 'A1',
    categories: [
        // ── 1. Begrüßung & Höflichkeit ──
        {
            name: 'Begrüßung & Höflichkeit',
            items: [
                { front: 'hello', back: 'hallo', partOfSpeech: 'Phrase', exampleSentence: 'Hello, how are you?' },
                { front: 'goodbye', back: 'auf Wiedersehen', partOfSpeech: 'Phrase', exampleSentence: 'Goodbye, see you tomorrow!' },
                { front: 'good morning', back: 'guten Morgen', partOfSpeech: 'Phrase', exampleSentence: 'Good morning, class!' },
                { front: 'good evening', back: 'guten Abend', partOfSpeech: 'Phrase', exampleSentence: 'Good evening, welcome to the restaurant.' },
                { front: 'good night', back: 'gute Nacht', partOfSpeech: 'Phrase', exampleSentence: 'Good night, sleep well!' },
                { front: 'please', back: 'bitte', partOfSpeech: 'Adverb', exampleSentence: 'Can I have some water, please?' },
                { front: 'thank you', back: 'danke', partOfSpeech: 'Phrase', exampleSentence: 'Thank you for your help.' },
                { front: 'yes', back: 'ja', partOfSpeech: 'Adverb', exampleSentence: 'Yes, I understand.' },
                { front: 'no', back: 'nein', partOfSpeech: 'Adverb', exampleSentence: 'No, thank you.' },
                { front: 'sorry', back: 'Entschuldigung', partOfSpeech: 'Phrase', exampleSentence: 'Sorry, I am late.' },
                { front: 'excuse me', back: 'Entschuldigen Sie', partOfSpeech: 'Phrase', exampleSentence: 'Excuse me, where is the bus stop?' },
                { front: 'welcome', back: 'willkommen', partOfSpeech: 'Phrase', exampleSentence: 'Welcome to our school!' },
            ],
        },

        // ── 2. Familie & Personen ──
        {
            name: 'Familie & Personen',
            items: [
                { front: 'mother', back: 'Mutter', partOfSpeech: 'Nomen', exampleSentence: 'My mother is a teacher.' },
                { front: 'father', back: 'Vater', partOfSpeech: 'Nomen', exampleSentence: 'My father works in an office.' },
                { front: 'sister', back: 'Schwester', partOfSpeech: 'Nomen', exampleSentence: 'I have one sister.' },
                { front: 'brother', back: 'Bruder', partOfSpeech: 'Nomen', exampleSentence: 'My brother is ten years old.' },
                { front: 'daughter', back: 'Tochter', partOfSpeech: 'Nomen', exampleSentence: 'Their daughter goes to school.' },
                { front: 'son', back: 'Sohn', partOfSpeech: 'Nomen', exampleSentence: 'His son likes football.' },
                { front: 'grandmother', back: 'Großmutter', partOfSpeech: 'Nomen', exampleSentence: 'My grandmother lives in the country.' },
                { front: 'grandfather', back: 'Großvater', partOfSpeech: 'Nomen', exampleSentence: 'My grandfather is 80 years old.' },
                { front: 'baby', back: 'Baby', partOfSpeech: 'Nomen', exampleSentence: 'The baby is sleeping.' },
                { front: 'friend', back: 'Freund / Freundin', partOfSpeech: 'Nomen', exampleSentence: 'She is my best friend.' },
            ],
        },

        // ── 3. Zahlen ──
        {
            name: 'Zahlen',
            items: [
                { front: 'one', back: 'eins', partOfSpeech: 'Zahl', exampleSentence: 'I have one cat.' },
                { front: 'two', back: 'zwei', partOfSpeech: 'Zahl', exampleSentence: 'There are two books on the table.' },
                { front: 'three', back: 'drei', partOfSpeech: 'Zahl', exampleSentence: 'She has three children.' },
                { front: 'four', back: 'vier', partOfSpeech: 'Zahl', exampleSentence: 'The room has four windows.' },
                { front: 'five', back: 'fünf', partOfSpeech: 'Zahl', exampleSentence: 'I need five minutes.' },
                { front: 'six', back: 'sechs', partOfSpeech: 'Zahl', exampleSentence: 'There are six eggs in the box.' },
                { front: 'seven', back: 'sieben', partOfSpeech: 'Zahl', exampleSentence: 'A week has seven days.' },
                { front: 'eight', back: 'acht', partOfSpeech: 'Zahl', exampleSentence: 'School starts at eight o\'clock.' },
                { front: 'nine', back: 'neun', partOfSpeech: 'Zahl', exampleSentence: 'I have nine pencils.' },
                { front: 'ten', back: 'zehn', partOfSpeech: 'Zahl', exampleSentence: 'She counts to ten.' },
                { front: 'twenty', back: 'zwanzig', partOfSpeech: 'Zahl', exampleSentence: 'There are twenty students in the class.' },
                { front: 'hundred', back: 'hundert', partOfSpeech: 'Zahl', exampleSentence: 'This book has one hundred pages.' },
            ],
        },

        // ── 4. Farben ──
        {
            name: 'Farben',
            items: [
                { front: 'red', back: 'rot', partOfSpeech: 'Adjektiv', exampleSentence: 'The apple is red.' },
                { front: 'blue', back: 'blau', partOfSpeech: 'Adjektiv', exampleSentence: 'The sky is blue.' },
                { front: 'green', back: 'grün', partOfSpeech: 'Adjektiv', exampleSentence: 'The grass is green.' },
                { front: 'yellow', back: 'gelb', partOfSpeech: 'Adjektiv', exampleSentence: 'The sun is yellow.' },
                { front: 'black', back: 'schwarz', partOfSpeech: 'Adjektiv', exampleSentence: 'My shoes are black.' },
                { front: 'white', back: 'weiß', partOfSpeech: 'Adjektiv', exampleSentence: 'Snow is white.' },
                { front: 'brown', back: 'braun', partOfSpeech: 'Adjektiv', exampleSentence: 'The dog is brown.' },
                { front: 'pink', back: 'rosa', partOfSpeech: 'Adjektiv', exampleSentence: 'She wears a pink dress.' },
                { front: 'grey', back: 'grau', partOfSpeech: 'Adjektiv', exampleSentence: 'The cat is grey.' },
                { front: 'purple', back: 'lila', partOfSpeech: 'Adjektiv', exampleSentence: 'I have a purple bag.' },
            ],
        },

        // ── 5. Essen & Trinken ──
        {
            name: 'Essen & Trinken',
            items: [
                { front: 'bread', back: 'Brot', partOfSpeech: 'Nomen', exampleSentence: 'I eat bread for breakfast.' },
                { front: 'water', back: 'Wasser', partOfSpeech: 'Nomen', exampleSentence: 'Can I have a glass of water?' },
                { front: 'milk', back: 'Milch', partOfSpeech: 'Nomen', exampleSentence: 'Children drink milk.' },
                { front: 'apple', back: 'Apfel', partOfSpeech: 'Nomen', exampleSentence: 'This apple is very sweet.' },
                { front: 'rice', back: 'Reis', partOfSpeech: 'Nomen', exampleSentence: 'We eat rice with chicken.' },
                { front: 'chicken', back: 'Hähnchen', partOfSpeech: 'Nomen', exampleSentence: 'The chicken is delicious.' },
                { front: 'fish', back: 'Fisch', partOfSpeech: 'Nomen', exampleSentence: 'I eat fish on Fridays.' },
                { front: 'egg', back: 'Ei', partOfSpeech: 'Nomen', exampleSentence: 'I have an egg for breakfast.' },
                { front: 'coffee', back: 'Kaffee', partOfSpeech: 'Nomen', exampleSentence: 'I drink coffee every morning.' },
                { front: 'tea', back: 'Tee', partOfSpeech: 'Nomen', exampleSentence: 'Would you like some tea?' },
                { front: 'cake', back: 'Kuchen', partOfSpeech: 'Nomen', exampleSentence: 'My grandmother makes the best cake.' },
            ],
        },

        // ── 6. Kleidung ──
        {
            name: 'Kleidung',
            items: [
                { front: 'shoe', back: 'Schuh', partOfSpeech: 'Nomen', exampleSentence: 'I need new shoes.' },
                { front: 'jacket', back: 'Jacke', partOfSpeech: 'Nomen', exampleSentence: 'Take your jacket, it is cold.' },
                { front: 'socks', back: 'Socken', partOfSpeech: 'Nomen', exampleSentence: 'I need clean socks.' },
                { front: 'scarf', back: 'Schal', partOfSpeech: 'Nomen', exampleSentence: 'She wears a red scarf.' },
            ],
        },

        // ── 7. Haus & Wohnung ──
        {
            name: 'Haus & Wohnung',
            items: [
                { front: 'house', back: 'Haus', partOfSpeech: 'Nomen', exampleSentence: 'We live in a small house.' },
                { front: 'room', back: 'Zimmer', partOfSpeech: 'Nomen', exampleSentence: 'My room is very big.' },
                { front: 'kitchen', back: 'Küche', partOfSpeech: 'Nomen', exampleSentence: 'We cook in the kitchen.' },
                { front: 'bathroom', back: 'Badezimmer', partOfSpeech: 'Nomen', exampleSentence: 'The bathroom is upstairs.' },
                { front: 'table', back: 'Tisch', partOfSpeech: 'Nomen', exampleSentence: 'The book is on the table.' },
                { front: 'bed', back: 'Bett', partOfSpeech: 'Nomen', exampleSentence: 'The children are in bed.' },
                { front: 'garden', back: 'Garten', partOfSpeech: 'Nomen', exampleSentence: 'We have a beautiful garden.' },
            ],
        },

        // ── 8. Alltag & Unterwegs ──
        {
            name: 'Alltag & Unterwegs',
            items: [
                { front: 'school', back: 'Schule', partOfSpeech: 'Nomen', exampleSentence: 'I go to school every day.' },
                { front: 'work', back: 'Arbeit', partOfSpeech: 'Nomen', exampleSentence: 'He goes to work by bus.' },
                { front: 'book', back: 'Buch', partOfSpeech: 'Nomen', exampleSentence: 'I read a book every week.' },
                { front: 'pen', back: 'Stift / Kugelschreiber', partOfSpeech: 'Nomen', exampleSentence: 'Can I borrow your pen?' },
                { front: 'bus', back: 'Bus', partOfSpeech: 'Nomen', exampleSentence: 'The bus comes at eight o\'clock.' },
                { front: 'car', back: 'Auto', partOfSpeech: 'Nomen', exampleSentence: 'My father has a blue car.' },
                { front: 'train', back: 'Zug', partOfSpeech: 'Nomen', exampleSentence: 'We take the train to Berlin.' },
                { front: 'phone', back: 'Telefon / Handy', partOfSpeech: 'Nomen', exampleSentence: 'Where is my phone?' },
                { front: 'money', back: 'Geld', partOfSpeech: 'Nomen', exampleSentence: 'I don\'t have enough money.' },
                { front: 'bag', back: 'Tasche', partOfSpeech: 'Nomen', exampleSentence: 'My bag is very heavy.' },
                { front: 'key', back: 'Schlüssel', partOfSpeech: 'Nomen', exampleSentence: 'I cannot find my key.' },
                { front: 'shop', back: 'Geschäft / Laden', partOfSpeech: 'Nomen', exampleSentence: 'The shop closes at six.' },
            ],
        },

        // ── 9. Wetter & Natur ──
        {
            name: 'Wetter & Natur',
            items: [
                { front: 'sun', back: 'Sonne', partOfSpeech: 'Nomen', exampleSentence: 'The sun is shining today.' },
                { front: 'rain', back: 'Regen', partOfSpeech: 'Nomen', exampleSentence: 'I don\'t like rain.' },
                { front: 'wind', back: 'Wind', partOfSpeech: 'Nomen', exampleSentence: 'The wind is very strong today.' },
            ],
        },

        // ── 10. Zeit & Tage ──
        {
            name: 'Zeit & Tage',
            items: [
                { front: 'today', back: 'heute', partOfSpeech: 'Adverb', exampleSentence: 'Today is Monday.' },
                { front: 'tomorrow', back: 'morgen', partOfSpeech: 'Adverb', exampleSentence: 'I will see you tomorrow.' },
                { front: 'yesterday', back: 'gestern', partOfSpeech: 'Adverb', exampleSentence: 'Yesterday was Sunday.' },
                { front: 'morning', back: 'Morgen', partOfSpeech: 'Nomen', exampleSentence: 'I go jogging in the morning.' },
                { front: 'evening', back: 'Abend', partOfSpeech: 'Nomen', exampleSentence: 'We eat dinner in the evening.' },
                { front: 'week', back: 'Woche', partOfSpeech: 'Nomen', exampleSentence: 'There are seven days in a week.' },
                { front: 'month', back: 'Monat', partOfSpeech: 'Nomen', exampleSentence: 'January is the first month.' },
                { front: 'year', back: 'Jahr', partOfSpeech: 'Nomen', exampleSentence: 'A year has twelve months.' },
                { front: 'hour', back: 'Stunde', partOfSpeech: 'Nomen', exampleSentence: 'The lesson is one hour long.' },
                { front: 'always', back: 'immer', partOfSpeech: 'Adverb', exampleSentence: 'I always eat breakfast.' },
                { front: 'never', back: 'nie', partOfSpeech: 'Adverb', exampleSentence: 'I never drink coffee at night.' },
            ],
        },

        // ── 11. Adjektive ──
        {
            name: 'Adjektive',
            items: [
                { front: 'big', back: 'groß', partOfSpeech: 'Adjektiv', exampleSentence: 'The house is very big.' },
                { front: 'small', back: 'klein', partOfSpeech: 'Adjektiv', exampleSentence: 'The cat is very small.' },
                { front: 'good', back: 'gut', partOfSpeech: 'Adjektiv', exampleSentence: 'This cake is very good.' },
                { front: 'bad', back: 'schlecht', partOfSpeech: 'Adjektiv', exampleSentence: 'The weather is bad today.' },
                { front: 'new', back: 'neu', partOfSpeech: 'Adjektiv', exampleSentence: 'I have a new phone.' },
                { front: 'old', back: 'alt', partOfSpeech: 'Adjektiv', exampleSentence: 'This building is very old.' },
                { front: 'beautiful', back: 'schön', partOfSpeech: 'Adjektiv', exampleSentence: 'The garden is beautiful.' },
                { front: 'fast', back: 'schnell', partOfSpeech: 'Adjektiv', exampleSentence: 'The train is very fast.' },
                { front: 'slow', back: 'langsam', partOfSpeech: 'Adjektiv', exampleSentence: 'The bus is too slow.' },
                { front: 'happy', back: 'glücklich', partOfSpeech: 'Adjektiv', exampleSentence: 'The children are happy.' },
                { front: 'easy', back: 'einfach / leicht', partOfSpeech: 'Adjektiv', exampleSentence: 'This exercise is easy.' },
                { front: 'important', back: 'wichtig', partOfSpeech: 'Adjektiv', exampleSentence: 'This is very important.' },
            ],
        },

        // ── 12. Verben ──
        {
            name: 'Verben',
            items: [
                {
                    front: 'to be',
                    back: 'sein',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I am a student.',
                    conjugation: {
                        present: { 'I': 'am', 'you': 'are', 'he/she': 'is', 'we': 'are', 'they': 'are' },
                        past: { 'I': 'was', 'you': 'were', 'he/she': 'was', 'we': 'were', 'they': 'were' },
                    },
                },
                {
                    front: 'to have',
                    back: 'haben',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I have two sisters.',
                    conjugation: {
                        present: { 'I': 'have', 'you': 'have', 'he/she': 'has', 'we': 'have', 'they': 'have' },
                        past: { 'I': 'had', 'you': 'had', 'he/she': 'had', 'we': 'had', 'they': 'had' },
                    },
                },
                {
                    front: 'to go',
                    back: 'gehen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I go to school every day.',
                    conjugation: {
                        present: { 'I': 'go', 'you': 'go', 'he/she': 'goes', 'we': 'go', 'they': 'go' },
                        past: { 'I': 'went', 'you': 'went', 'he/she': 'went', 'we': 'went', 'they': 'went' },
                    },
                },
                {
                    front: 'to come',
                    back: 'kommen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Please come to my house.',
                    conjugation: {
                        present: { 'I': 'come', 'you': 'come', 'he/she': 'comes', 'we': 'come', 'they': 'come' },
                        past: { 'I': 'came', 'you': 'came', 'he/she': 'came', 'we': 'came', 'they': 'came' },
                    },
                },
                {
                    front: 'to eat',
                    back: 'essen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'We eat lunch at twelve.',
                    conjugation: {
                        present: { 'I': 'eat', 'you': 'eat', 'he/she': 'eats', 'we': 'eat', 'they': 'eat' },
                        past: { 'I': 'ate', 'you': 'ate', 'he/she': 'ate', 'we': 'ate', 'they': 'ate' },
                    },
                },
                {
                    front: 'to drink',
                    back: 'trinken',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I drink water every day.',
                    conjugation: {
                        present: { 'I': 'drink', 'you': 'drink', 'he/she': 'drinks', 'we': 'drink', 'they': 'drink' },
                        past: { 'I': 'drank', 'you': 'drank', 'he/she': 'drank', 'we': 'drank', 'they': 'drank' },
                    },
                },
                {
                    front: 'to sleep',
                    back: 'schlafen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I sleep eight hours every night.',
                    conjugation: {
                        present: { 'I': 'sleep', 'you': 'sleep', 'he/she': 'sleeps', 'we': 'sleep', 'they': 'sleep' },
                        past: { 'I': 'slept', 'you': 'slept', 'he/she': 'slept', 'we': 'slept', 'they': 'slept' },
                    },
                },
                {
                    front: 'to work',
                    back: 'arbeiten',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'My mother works in a hospital.',
                    conjugation: {
                        present: { 'I': 'work', 'you': 'work', 'he/she': 'works', 'we': 'work', 'they': 'work' },
                        past: { 'I': 'worked', 'you': 'worked', 'he/she': 'worked', 'we': 'worked', 'they': 'worked' },
                    },
                },
                {
                    front: 'to learn',
                    back: 'lernen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I learn English at school.',
                    conjugation: {
                        present: { 'I': 'learn', 'you': 'learn', 'he/she': 'learns', 'we': 'learn', 'they': 'learn' },
                        past: { 'I': 'learned', 'you': 'learned', 'he/she': 'learned', 'we': 'learned', 'they': 'learned' },
                    },
                },
                {
                    front: 'to speak',
                    back: 'sprechen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Do you speak English?',
                    conjugation: {
                        present: { 'I': 'speak', 'you': 'speak', 'he/she': 'speaks', 'we': 'speak', 'they': 'speak' },
                        past: { 'I': 'spoke', 'you': 'spoke', 'he/she': 'spoke', 'we': 'spoke', 'they': 'spoke' },
                    },
                },
                {
                    front: 'to live',
                    back: 'leben / wohnen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I live in a big city.',
                    conjugation: {
                        present: { 'I': 'live', 'you': 'live', 'he/she': 'lives', 'we': 'live', 'they': 'live' },
                        past: { 'I': 'lived', 'you': 'lived', 'he/she': 'lived', 'we': 'lived', 'they': 'lived' },
                    },
                },
                {
                    front: 'to buy',
                    back: 'kaufen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'I want to buy a new book.',
                    conjugation: {
                        present: { 'I': 'buy', 'you': 'buy', 'he/she': 'buys', 'we': 'buy', 'they': 'buy' },
                        past: { 'I': 'bought', 'you': 'bought', 'he/she': 'bought', 'we': 'bought', 'they': 'bought' },
                    },
                },
            ],
        },
    ],
}
