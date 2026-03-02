import type { LanguageSet } from './types'

export const enA1: LanguageSet = {
    id: 'en-a1',
    title: 'Englisch A1 Grundwortschatz',
    subject: 'Englisch',
    description: 'Grundlegende englische Vokabeln für Anfänger — Alltagswörter, Verben mit Konjugation und Beispielsätzen. Orientiert am Cambridge CEFR A1 (Pre-A1 Starters / Key).',
    level: 'A1',
    categories: [
        // ── 1. Begrüßung & Höflichkeit ──
        {
            name: 'Begrüßung & Höflichkeit',
            learningOutcomes: [
                'Jemanden auf Englisch begrüßen und verabschieden',
                'Höflich nach etwas fragen und danken',
                'Small Talk beginnen',
            ],
            grammarTip: {
                title: 'How are you? — Begrüßungsformeln',
                explanation: '„How are you?" ist eine Standardbegrüßung. Antwort: „I\'m fine, thanks." oder „I\'m good, and you?" — Man erwartet keine ausführliche Antwort.',
                examples: ['How are you? — I\'m fine, thanks.', 'Nice to meet you! — Nice to meet you too!'],
            },
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
            learningOutcomes: [
                'Familienmitglieder benennen',
                'Sagen, wie viele Geschwister du hast',
                'Eine Person kurz vorstellen',
            ],
            grammarTip: {
                title: 'Possessive — my, your, his, her',
                explanation: 'Besitzanzeigende Wörter: my (mein), your (dein), his (sein), her (ihr). Sie ändern sich nicht je nach Nomen: „my mother", „my father".',
                examples: ['This is my sister.', 'Her name is Anna.', 'His brother is tall.'],
            },
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
            learningOutcomes: [
                'Auf Englisch bis 100 zählen',
                'Preise verstehen und nennen',
                'Telefonnummern angeben',
            ],
            grammarTip: {
                title: 'There is / There are — Es gibt',
                explanation: '„There is" für Einzahl, „There are" für Mehrzahl. Frage: „Is there...?" / „Are there...?"',
                examples: ['There is one apple.', 'There are three books.', 'Are there any chairs?'],
            },
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
            learningOutcomes: [
                'Farben auf Englisch benennen',
                'Gegenstände mit Farben beschreiben',
                'Lieblingsfarbe nennen',
            ],
            grammarTip: {
                title: 'Adjektive stehen VOR dem Nomen',
                explanation: 'Im Englischen steht das Adjektiv immer vor dem Nomen: „a red car" (ein rotes Auto), nicht „a car red".',
                examples: ['I have a blue bag.', 'She wears a white dress.', 'The green apple is delicious.'],
            },
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
            learningOutcomes: [
                'Im Restaurant bestellen',
                'Sagen, was du gerne isst und trinkst',
                'Nach der Rechnung fragen',
            ],
            grammarTip: {
                title: 'Would like — Ich hätte gerne',
                explanation: '„I would like" (oder kurz „I\'d like") ist die höfliche Form zum Bestellen. Informell: „I want" — aber „I\'d like" klingt freundlicher.',
                examples: ['I\'d like a coffee, please.', 'Would you like some water?', 'I\'d like the bill, please.'],
            },
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
            learningOutcomes: [
                'Kleidungsstücke benennen',
                'Sagen, was du trägst',
                'Im Geschäft nach Größen fragen',
            ],
            grammarTip: {
                title: 'Present Continuous — I am wearing',
                explanation: 'Was du gerade trägst: „I am wearing..." (Verb + -ing). Auch „She is wearing...", „They are wearing...".',
                examples: ['I\'m wearing a blue shirt.', 'She\'s wearing jeans.', 'What are you wearing today?'],
            },
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
            learningOutcomes: [
                'Zimmer und Möbel benennen',
                'Beschreiben, wo etwas ist',
                'Deine Wohnung kurz vorstellen',
            ],
            grammarTip: {
                title: 'Prepositions of place — in, on, under',
                explanation: '„In" = drinnen, „on" = auf, „under" = unter, „next to" = neben, „between" = zwischen.',
                examples: ['The book is on the table.', 'The cat is under the bed.', 'The lamp is next to the sofa.'],
            },
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
            learningOutcomes: [
                'Nach dem Weg fragen',
                'Verkehrsmittel benennen',
                'Deinen Tagesablauf beschreiben',
            ],
            grammarTip: {
                title: 'Simple Present — Gewohnheiten',
                explanation: 'Für Gewohnheiten: „I go", „you go", aber „he/she goes" (mit -s!). Verneinung: „I don\'t go", „He doesn\'t go".',
                examples: ['I take the bus every day.', 'She goes to work by car.', 'We don\'t walk to school.'],
            },
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
            learningOutcomes: [
                'Über das Wetter sprechen',
                'Naturelemente benennen',
                'Das aktuelle Wetter beschreiben',
            ],
            grammarTip: {
                title: 'It is / It\'s — Wetter beschreiben',
                explanation: 'Wetter wird mit „It\'s" + Adjektiv beschrieben: „It\'s sunny", „It\'s cold". Oder „It\'s" + Verb-ing: „It\'s raining".',
                examples: ['It\'s sunny today.', 'It\'s raining.', 'What\'s the weather like?'],
            },
            items: [
                { front: 'sun', back: 'Sonne', partOfSpeech: 'Nomen', exampleSentence: 'The sun is shining today.' },
                { front: 'rain', back: 'Regen', partOfSpeech: 'Nomen', exampleSentence: 'I don\'t like rain.' },
                { front: 'wind', back: 'Wind', partOfSpeech: 'Nomen', exampleSentence: 'The wind is very strong today.' },
            ],
        },

        // ── 10. Zeit & Tage ──
        {
            name: 'Zeit & Tage',
            learningOutcomes: [
                'Wochentage und Monate nennen',
                'Nach der Uhrzeit fragen und antworten',
                'Termine und Verabredungen machen',
            ],
            grammarTip: {
                title: 'Prepositions of time — at, on, in',
                explanation: '„At" für Uhrzeiten: „at 3 o\'clock". „On" für Tage: „on Monday". „In" für Monate/Jahre: „in January", „in 2024".',
                examples: ['The meeting is at 10 o\'clock.', 'I play football on Saturdays.', 'My birthday is in March.'],
            },
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
            learningOutcomes: [
                'Personen und Dinge beschreiben',
                'Gegensatzpaare verwenden (big/small, good/bad)',
                'Einfache Vergleiche machen',
            ],
            grammarTip: {
                title: 'Be — am, is, are',
                explanation: '„I am" (I\'m), „You are" (You\'re), „He/She is" (He\'s). Für Beschreibungen: „She is tall", „They are happy".',
                examples: ['I\'m tired today.', 'The book is interesting.', 'They\'re very friendly.'],
            },
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
            learningOutcomes: [
                'Die wichtigsten Alltagsverben verwenden',
                'Einfache Sätze im Präsens bilden',
                'Fragen mit do/does stellen',
            ],
            grammarTip: {
                title: 'Do / Does — Fragen & Verneinung',
                explanation: 'Fragen: „Do you like...?", „Does she want...?" Verneinung: „I don\'t like...", „She doesn\'t want...".',
                examples: ['Do you speak English?', 'She doesn\'t eat meat.', 'Does he live here?'],
            },
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

        // ── 13. Körper & Gesundheit ──
        {
            name: 'Körper & Gesundheit',
            learningOutcomes: [
                'Körperteile benennen',
                'Sagen, was dir wehtut',
                'Beim Arzt grundlegende Beschwerden schildern',
            ],
            grammarTip: {
                title: 'My ... hurts — Mir tut ... weh',
                explanation: '„My head hurts." (Mir tut der Kopf weh.) Oder: „I have a headache." Frage: „What\'s wrong?" / „Does it hurt?"',
                examples: ['My head hurts.', 'I have a stomachache.', 'Does your arm hurt?'],
            },
            items: [
                { front: 'head', back: 'Kopf', partOfSpeech: 'Nomen', exampleSentence: 'My head hurts.' },
                { front: 'eye', back: 'Auge', partOfSpeech: 'Nomen', exampleSentence: 'She has blue eyes.' },
                { front: 'nose', back: 'Nase', partOfSpeech: 'Nomen', exampleSentence: 'My nose is cold.' },
                { front: 'mouth', back: 'Mund', partOfSpeech: 'Nomen', exampleSentence: 'Open your mouth, please.' },
                { front: 'ear', back: 'Ohr', partOfSpeech: 'Nomen', exampleSentence: 'My ears are cold.' },
                { front: 'arm', back: 'Arm', partOfSpeech: 'Nomen', exampleSentence: 'I broke my arm.' },
                { front: 'hand', back: 'Hand', partOfSpeech: 'Nomen', exampleSentence: 'Wash your hands before eating.' },
                { front: 'leg', back: 'Bein', partOfSpeech: 'Nomen', exampleSentence: 'My right leg hurts.' },
                { front: 'foot', back: 'Fuß', partOfSpeech: 'Nomen', exampleSentence: 'My feet are tired.' },
                { front: 'stomach', back: 'Magen / Bauch', partOfSpeech: 'Nomen', exampleSentence: 'I have a stomachache.' },
                { front: 'tooth', back: 'Zahn', partOfSpeech: 'Nomen', exampleSentence: 'I have a toothache.' },
                { front: 'heart', back: 'Herz', partOfSpeech: 'Nomen', exampleSentence: 'My heart is beating fast.' },
                { front: 'sick', back: 'krank', partOfSpeech: 'Adjektiv', exampleSentence: 'I\'m sick today.' },
                { front: 'healthy', back: 'gesund', partOfSpeech: 'Adjektiv', exampleSentence: 'Eating fruit is healthy.' },
                { front: 'doctor', back: 'Arzt', partOfSpeech: 'Nomen', exampleSentence: 'I need to see a doctor.' },
                { front: 'pharmacy', back: 'Apotheke', partOfSpeech: 'Nomen', exampleSentence: 'Is there a pharmacy nearby?' },
            ],
        },

        // ── 14. Berufe & Arbeit ──
        {
            name: 'Berufe & Arbeit',
            learningOutcomes: [
                'Deinen Beruf nennen',
                'Nach dem Beruf anderer fragen',
                'Über Arbeit und Studium sprechen',
            ],
            grammarTip: {
                title: 'I am a ... — Beruf nennen',
                explanation: 'Im Englischen braucht man den Artikel „a/an": „I am a teacher." „She is an engineer." Frage: „What do you do?"',
                examples: ['I\'m a student.', 'What do you do? — I\'m a doctor.', 'She\'s an engineer.'],
            },
            items: [
                { front: 'teacher', back: 'Lehrer/in', partOfSpeech: 'Nomen', exampleSentence: 'My mother is a teacher.' },
                { front: 'student', back: 'Student/in', partOfSpeech: 'Nomen', exampleSentence: 'I\'m a student.' },
                { front: 'doctor', back: 'Arzt/Ärztin', partOfSpeech: 'Nomen', exampleSentence: 'My brother is a doctor.' },
                { front: 'waiter', back: 'Kellner/in', partOfSpeech: 'Nomen', exampleSentence: 'The waiter brings the food.' },
                { front: 'police officer', back: 'Polizist/in', partOfSpeech: 'Nomen', exampleSentence: 'The police officer helps people.' },
                { front: 'cook', back: 'Koch/Köchin', partOfSpeech: 'Nomen', exampleSentence: 'My grandmother is a good cook.' },
                { front: 'engineer', back: 'Ingenieur/in', partOfSpeech: 'Nomen', exampleSentence: 'I\'m a software engineer.' },
                { front: 'lawyer', back: 'Anwalt/Anwältin', partOfSpeech: 'Nomen', exampleSentence: 'I need a lawyer.' },
                { front: 'office', back: 'Büro', partOfSpeech: 'Nomen', exampleSentence: 'I work in an office.' },
                { front: 'company', back: 'Firma / Unternehmen', partOfSpeech: 'Nomen', exampleSentence: 'My company is very big.' },
                { front: 'boss', back: 'Chef/in', partOfSpeech: 'Nomen', exampleSentence: 'My boss is very friendly.' },
                { front: 'salary', back: 'Gehalt', partOfSpeech: 'Nomen', exampleSentence: 'The salary is good.' },
            ],
        },

        // ── 15. Freizeit & Hobbys ──
        {
            name: 'Freizeit & Hobbys',
            learningOutcomes: [
                'Über deine Hobbys sprechen',
                'Sagen, was du gerne machst',
                'Andere nach ihren Interessen fragen',
            ],
            grammarTip: {
                title: 'I like + Verb-ing — Ich mag',
                explanation: '„I like" + Verb-ing: „I like swimming." Nicht: „I like swim." Frage: „Do you like ...ing?"',
                examples: ['I like reading books.', 'Do you like cooking?', 'She likes playing football.'],
            },
            items: [
                { front: 'sport', back: 'Sport', partOfSpeech: 'Nomen', exampleSentence: 'I like doing sport.' },
                { front: 'football', back: 'Fußball', partOfSpeech: 'Nomen', exampleSentence: 'I play football on Saturdays.' },
                { front: 'music', back: 'Musik', partOfSpeech: 'Nomen', exampleSentence: 'I like listening to music.' },
                { front: 'film', back: 'Film', partOfSpeech: 'Nomen', exampleSentence: 'Let\'s watch a film.' },
                { front: 'book', back: 'Buch', partOfSpeech: 'Nomen', exampleSentence: 'I read a book every month.' },
                { front: 'beach', back: 'Strand', partOfSpeech: 'Nomen', exampleSentence: 'I go to the beach in summer.' },
                { front: 'mountain', back: 'Berg', partOfSpeech: 'Nomen', exampleSentence: 'I like hiking in the mountains.' },
                { front: 'trip', back: 'Reise / Ausflug', partOfSpeech: 'Nomen', exampleSentence: 'I want to take a trip to London.' },
                { front: 'party', back: 'Party / Fest', partOfSpeech: 'Nomen', exampleSentence: 'There\'s a party on Saturday.' },
                { front: 'photo', back: 'Foto', partOfSpeech: 'Nomen', exampleSentence: 'Can I take a photo?' },
                { front: 'to swim', back: 'schwimmen', partOfSpeech: 'Verb', exampleSentence: 'I like swimming in the sea.' },
                { front: 'to dance', back: 'tanzen', partOfSpeech: 'Verb', exampleSentence: 'Do you like dancing?' },
                { front: 'to cook', back: 'kochen', partOfSpeech: 'Verb', exampleSentence: 'I like cooking Italian food.' },
                { front: 'to sing', back: 'singen', partOfSpeech: 'Verb', exampleSentence: 'She sings very well.' },
                { front: 'to draw', back: 'zeichnen', partOfSpeech: 'Verb', exampleSentence: 'My son draws animals.' },
            ],
        },

        // ── 16. Einkaufen & Geld ──
        {
            name: 'Einkaufen & Geld',
            learningOutcomes: [
                'Im Geschäft nach Preisen fragen',
                'Einkaufen und bezahlen',
                'Mengen und Größen angeben',
            ],
            grammarTip: {
                title: 'How much ...? — Wie viel?',
                explanation: '„How much is this?" (Wie viel kostet das?) „How much are these?" (Mehrzahl). Antwort: „It\'s five pounds." / „They\'re ten euros."',
                examples: ['How much is this?', 'It\'s three pounds.', 'How much are these shoes?'],
            },
            items: [
                { front: 'supermarket', back: 'Supermarkt', partOfSpeech: 'Nomen', exampleSentence: 'I go to the supermarket on Mondays.' },
                { front: 'price', back: 'Preis', partOfSpeech: 'Nomen', exampleSentence: 'What\'s the price?' },
                { front: 'cheap', back: 'günstig / billig', partOfSpeech: 'Adjektiv', exampleSentence: 'This shirt is very cheap.' },
                { front: 'expensive', back: 'teuer', partOfSpeech: 'Adjektiv', exampleSentence: 'The restaurant is very expensive.' },
                { front: 'card', back: 'Karte (Kreditkarte)', partOfSpeech: 'Nomen', exampleSentence: 'Can I pay by card?' },
                { front: 'cash', back: 'Bargeld', partOfSpeech: 'Nomen', exampleSentence: 'I only have cash.' },
                { front: 'bill', back: 'Rechnung', partOfSpeech: 'Nomen', exampleSentence: 'The bill, please.' },
                { front: 'to pay', back: 'bezahlen', partOfSpeech: 'Verb', exampleSentence: 'Where can I pay?' },
                { front: 'to buy', back: 'kaufen', partOfSpeech: 'Verb', exampleSentence: 'I want to buy some bread.' },
                { front: 'to sell', back: 'verkaufen', partOfSpeech: 'Verb', exampleSentence: 'They sell fresh fruit.' },
                { front: 'market', back: 'Markt', partOfSpeech: 'Nomen', exampleSentence: 'The market opens on Sundays.' },
                { front: 'size', back: 'Größe', partOfSpeech: 'Nomen', exampleSentence: 'Do you have this in size M?' },
            ],
        },

        // ── 17. Orte & Stadt ──
        {
            name: 'Orte & Stadt',
            learningOutcomes: [
                'Orte in der Stadt benennen',
                'Nach dem Weg fragen und Wegbeschreibungen verstehen',
                'Sagen, wo etwas ist',
            ],
            grammarTip: {
                title: 'Where is ...? — Wo ist ...?',
                explanation: '„Where is the bank?" Antwort: „It\'s on the right / on the left / straight ahead / next to the park."',
                examples: ['Where is the station?', 'It\'s on the left.', 'Go straight ahead.'],
            },
            items: [
                { front: 'city', back: 'Stadt', partOfSpeech: 'Nomen', exampleSentence: 'I live in a big city.' },
                { front: 'street', back: 'Straße', partOfSpeech: 'Nomen', exampleSentence: 'What street do you live on?' },
                { front: 'square', back: 'Platz', partOfSpeech: 'Nomen', exampleSentence: 'Let\'s meet at the square.' },
                { front: 'bank', back: 'Bank', partOfSpeech: 'Nomen', exampleSentence: 'The bank opens at nine.' },
                { front: 'hospital', back: 'Krankenhaus', partOfSpeech: 'Nomen', exampleSentence: 'The hospital is nearby.' },
                { front: 'church', back: 'Kirche', partOfSpeech: 'Nomen', exampleSentence: 'The church is very old.' },
                { front: 'park', back: 'Park', partOfSpeech: 'Nomen', exampleSentence: 'The children play in the park.' },
                { front: 'station', back: 'Bahnhof', partOfSpeech: 'Nomen', exampleSentence: 'Where is the train station?' },
                { front: 'airport', back: 'Flughafen', partOfSpeech: 'Nomen', exampleSentence: 'The airport is far away.' },
                { front: 'library', back: 'Bibliothek', partOfSpeech: 'Nomen', exampleSentence: 'I study at the library.' },
                { front: 'museum', back: 'Museum', partOfSpeech: 'Nomen', exampleSentence: 'The museum opens on Tuesdays.' },
                { front: 'right', back: 'rechts', partOfSpeech: 'Adverb', exampleSentence: 'Turn right at the corner.' },
                { front: 'left', back: 'links', partOfSpeech: 'Adverb', exampleSentence: 'The bank is on the left.' },
                { front: 'near', back: 'nah / in der Nähe', partOfSpeech: 'Adverb', exampleSentence: 'The pharmacy is near here.' },
                { front: 'far', back: 'weit / fern', partOfSpeech: 'Adverb', exampleSentence: 'The airport is far from the centre.' },
            ],
        },

        // ── 18. Kommunikation & Gefühle ──
        {
            name: 'Kommunikation & Gefühle',
            learningOutcomes: [
                'Deine Gefühle ausdrücken',
                'Nach dem Befinden fragen',
                'Meinungen und Wünsche äußern',
            ],
            grammarTip: {
                title: 'I feel ... — Wie ich mich fühle',
                explanation: '„I feel" + Adjektiv: „I feel happy." „I feel tired." Frage: „How do you feel?" / „How are you feeling?"',
                examples: ['I feel happy today.', 'How are you feeling? — I\'m tired.', 'She feels nervous.'],
            },
            items: [
                { front: 'happy', back: 'glücklich / froh', partOfSpeech: 'Adjektiv', exampleSentence: 'I\'m very happy today.' },
                { front: 'sad', back: 'traurig', partOfSpeech: 'Adjektiv', exampleSentence: 'She feels sad.' },
                { front: 'tired', back: 'müde', partOfSpeech: 'Adjektiv', exampleSentence: 'I\'m very tired.' },
                { front: 'worried', back: 'besorgt', partOfSpeech: 'Adjektiv', exampleSentence: 'I\'m worried about the exam.' },
                { front: 'nervous', back: 'nervös', partOfSpeech: 'Adjektiv', exampleSentence: 'I\'m nervous before the test.' },
                { front: 'bored', back: 'gelangweilt', partOfSpeech: 'Adjektiv', exampleSentence: 'The film is boring.' },
                { front: 'surprised', back: 'überrascht', partOfSpeech: 'Adjektiv', exampleSentence: 'I\'m surprised by the news.' },
                { front: 'angry', back: 'wütend / verärgert', partOfSpeech: 'Adjektiv', exampleSentence: 'My dad is angry.' },
                { front: 'to think', back: 'denken', partOfSpeech: 'Verb', exampleSentence: 'I think you\'re right.' },
                { front: 'to understand', back: 'verstehen', partOfSpeech: 'Verb', exampleSentence: 'I don\'t understand the question.' },
                { front: 'to know', back: 'wissen / kennen', partOfSpeech: 'Verb', exampleSentence: 'Do you know where the bank is?' },
                { front: 'can', back: 'können', partOfSpeech: 'Verb', exampleSentence: 'Can you help me?' },
                { front: 'to need', back: 'brauchen', partOfSpeech: 'Verb', exampleSentence: 'I need your help.' },
                { front: 'to believe', back: 'glauben', partOfSpeech: 'Verb', exampleSentence: 'I believe you.' },
            ],
        },
    ],
}
