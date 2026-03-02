// ── Static reading comprehension texts ─────────────────────────────────

export interface VocabularyItem {
    word: string
    translation: string    // German
    partOfSpeech: string
}

export interface ReadingQuestion {
    id: string
    type: 'multipleChoice' | 'trueFalse' | 'freeText'
    question: string       // in target language
    questionDe: string     // German translation
    options?: string[]     // for MC / TF
    correctIndex?: number  // for MC
    correctAnswer?: boolean // for TF
    sampleAnswer?: string  // for freeText
    explanation: string    // German explanation
}

export interface ReadingText {
    id: string
    title: string          // in target language
    titleDe: string        // German translation of title
    level: string          // "A1" | "A2" | "B1"
    language: string       // "en" | "es"
    topic: string          // "Alltag" | "Reisen" | "Kultur"
    icon: string           // emoji
    readingTimeMinutes: number
    text: string           // the actual reading text (paragraphs separated by \n\n)
    vocabulary: VocabularyItem[]
    questions: ReadingQuestion[]
}

export const readingTexts: ReadingText[] = [
    // ── English A1 ─────────────────────────────────────────────────────
    {
        id: 'en-a1-my-day',
        title: 'My Day',
        titleDe: 'Mein Tag',
        level: 'A1',
        language: 'en',
        topic: 'Alltag',
        icon: '\u2600\uFE0F',
        readingTimeMinutes: 2,
        text: `My name is Anna. I am 14 years old. Every morning I wake up at seven o'clock. I eat breakfast with my family. I have bread with butter and a glass of milk.

After breakfast I walk to school. School starts at eight o'clock. My favourite subject is English. I also like music and art.

After school I go home. I eat lunch and then I do my homework. In the afternoon I play with my friends in the park. We like to play football.

In the evening I watch TV with my parents. I go to bed at nine o'clock. I like my day.`,
        vocabulary: [
            { word: 'wake up', translation: 'aufwachen', partOfSpeech: 'Verb' },
            { word: 'breakfast', translation: 'Frühstück', partOfSpeech: 'Nomen' },
            { word: 'favourite', translation: 'Lieblings-', partOfSpeech: 'Adjektiv' },
            { word: 'subject', translation: 'Schulfach', partOfSpeech: 'Nomen' },
            { word: 'homework', translation: 'Hausaufgaben', partOfSpeech: 'Nomen' },
            { word: 'afternoon', translation: 'Nachmittag', partOfSpeech: 'Nomen' },
        ],
        questions: [
            {
                id: 'en-a1-my-day-q1',
                type: 'multipleChoice',
                question: 'What time does Anna wake up?',
                questionDe: 'Um wie viel Uhr wacht Anna auf?',
                options: ['At six o\'clock', 'At seven o\'clock', 'At eight o\'clock', 'At nine o\'clock'],
                correctIndex: 1,
                explanation: 'Anna sagt: "Every morning I wake up at seven o\'clock."',
            },
            {
                id: 'en-a1-my-day-q2',
                type: 'trueFalse',
                question: 'Anna\'s favourite subject is music.',
                questionDe: 'Annas Lieblingsfach ist Musik.',
                options: ['Richtig', 'Falsch'],
                correctAnswer: false,
                explanation: 'Annas Lieblingsfach ist Englisch, nicht Musik. Sie sagt: "My favourite subject is English."',
            },
            {
                id: 'en-a1-my-day-q3',
                type: 'multipleChoice',
                question: 'What does Anna eat for breakfast?',
                questionDe: 'Was isst Anna zum Frühstück?',
                options: ['Cereal and juice', 'Bread with butter and milk', 'Toast and tea', 'Eggs and coffee'],
                correctIndex: 1,
                explanation: 'Anna sagt: "I have bread with butter and a glass of milk."',
            },
            {
                id: 'en-a1-my-day-q4',
                type: 'freeText',
                question: 'What does Anna do in the afternoon?',
                questionDe: 'Was macht Anna am Nachmittag?',
                sampleAnswer: 'She plays with her friends in the park. They play football.',
                explanation: 'Anna spielt am Nachmittag mit ihren Freunden im Park Fußball.',
            },
        ],
    },
    {
        id: 'en-a1-my-family',
        title: 'My Family',
        titleDe: 'Meine Familie',
        level: 'A1',
        language: 'en',
        topic: 'Alltag',
        icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66',
        readingTimeMinutes: 2,
        text: `I have a big family. There are six people in my family: my mother, my father, my two brothers, my sister and me.

My mother is a teacher. She works at a primary school. She is very kind and she cooks very well. My father is a doctor. He works at the hospital. He helps sick people every day.

My older brother Tom is 17 years old. He likes computers and video games. My younger brother Leo is only 5 years old. He is very funny. My sister Emma is 12 years old. She loves reading books.

We have a dog called Max. Max is brown and white. He is very friendly. On Sundays we all go to the park together. I love my family very much.`,
        vocabulary: [
            { word: 'family', translation: 'Familie', partOfSpeech: 'Nomen' },
            { word: 'teacher', translation: 'Lehrerin', partOfSpeech: 'Nomen' },
            { word: 'doctor', translation: 'Arzt', partOfSpeech: 'Nomen' },
            { word: 'hospital', translation: 'Krankenhaus', partOfSpeech: 'Nomen' },
            { word: 'friendly', translation: 'freundlich', partOfSpeech: 'Adjektiv' },
            { word: 'together', translation: 'zusammen', partOfSpeech: 'Adverb' },
        ],
        questions: [
            {
                id: 'en-a1-family-q1',
                type: 'multipleChoice',
                question: 'How many people are in the family?',
                questionDe: 'Wie viele Personen sind in der Familie?',
                options: ['Four', 'Five', 'Six', 'Seven'],
                correctIndex: 2,
                explanation: 'Es sind sechs Personen in der Familie: Mutter, Vater, zwei Brüder, eine Schwester und der Erzähler.',
            },
            {
                id: 'en-a1-family-q2',
                type: 'trueFalse',
                question: 'The father works at a school.',
                questionDe: 'Der Vater arbeitet in einer Schule.',
                options: ['Richtig', 'Falsch'],
                correctAnswer: false,
                explanation: 'Der Vater ist Arzt und arbeitet im Krankenhaus, nicht in einer Schule.',
            },
            {
                id: 'en-a1-family-q3',
                type: 'multipleChoice',
                question: 'What does the sister Emma love?',
                questionDe: 'Was liebt Schwester Emma?',
                options: ['Video games', 'Cooking', 'Reading books', 'Playing football'],
                correctIndex: 2,
                explanation: 'Im Text steht: "My sister Emma is 12 years old. She loves reading books."',
            },
            {
                id: 'en-a1-family-q4',
                type: 'freeText',
                question: 'Describe the family dog.',
                questionDe: 'Beschreibe den Familienhund.',
                sampleAnswer: 'The dog is called Max. He is brown and white and very friendly.',
                explanation: 'Der Hund heißt Max, ist braun-weiß und sehr freundlich.',
            },
        ],
    },

    // ── English A2 ─────────────────────────────────────────────────────
    {
        id: 'en-a2-trip-london',
        title: 'A Trip to London',
        titleDe: 'Eine Reise nach London',
        level: 'A2',
        language: 'en',
        topic: 'Reisen',
        icon: '\uD83C\uDDEC\uD83C\uDDE7',
        readingTimeMinutes: 3,
        text: `Last summer my family and I went to London for a week. It was my first time in England and I was very excited. We flew from Frankfurt to London Heathrow. The flight took about two hours.

We stayed in a small hotel near the River Thames. From our window we could see the famous London Eye. On the first day we visited the Tower of London. It was built almost a thousand years ago. We saw the Crown Jewels there. They were amazing!

The next day we went to the British Museum. It is one of the biggest museums in the world and it is free. We spent three hours there but we could not see everything. After the museum we walked through Hyde Park. It was sunny and many people were having picnics.

On Wednesday we took the Underground to Camden Market. There were lots of interesting shops and food stalls from all over the world. I bought a T-shirt and tried some Indian food. It was delicious but a bit spicy for me.

The best part of the trip was the musical we saw in the West End. The actors and the music were incredible. I want to go back to London soon!`,
        vocabulary: [
            { word: 'excited', translation: 'aufgeregt', partOfSpeech: 'Adjektiv' },
            { word: 'flight', translation: 'Flug', partOfSpeech: 'Nomen' },
            { word: 'famous', translation: 'berühmt', partOfSpeech: 'Adjektiv' },
            { word: 'Crown Jewels', translation: 'Kronjuwelen', partOfSpeech: 'Nomen' },
            { word: 'amazing', translation: 'erstaunlich', partOfSpeech: 'Adjektiv' },
            { word: 'Underground', translation: 'U-Bahn', partOfSpeech: 'Nomen' },
            { word: 'spicy', translation: 'scharf/würzig', partOfSpeech: 'Adjektiv' },
            { word: 'incredible', translation: 'unglaublich', partOfSpeech: 'Adjektiv' },
        ],
        questions: [
            {
                id: 'en-a2-london-q1',
                type: 'multipleChoice',
                question: 'How long did the family stay in London?',
                questionDe: 'Wie lange blieb die Familie in London?',
                options: ['Three days', 'Five days', 'One week', 'Two weeks'],
                correctIndex: 2,
                explanation: 'Die Familie war eine Woche in London: "We went to London for a week."',
            },
            {
                id: 'en-a2-london-q2',
                type: 'trueFalse',
                question: 'The British Museum costs money to enter.',
                questionDe: 'Der Eintritt ins British Museum kostet Geld.',
                options: ['Richtig', 'Falsch'],
                correctAnswer: false,
                explanation: 'Das British Museum ist kostenlos: "It is one of the biggest museums in the world and it is free."',
            },
            {
                id: 'en-a2-london-q3',
                type: 'multipleChoice',
                question: 'What did the narrator buy at Camden Market?',
                questionDe: 'Was hat der Erzähler auf dem Camden Market gekauft?',
                options: ['A book', 'A hat', 'A T-shirt', 'A bag'],
                correctIndex: 2,
                explanation: 'Der Erzähler kaufte ein T-Shirt: "I bought a T-shirt and tried some Indian food."',
            },
            {
                id: 'en-a2-london-q4',
                type: 'trueFalse',
                question: 'The family could see everything in the British Museum.',
                questionDe: 'Die Familie konnte alles im British Museum sehen.',
                options: ['Richtig', 'Falsch'],
                correctAnswer: false,
                explanation: 'Sie konnten nicht alles sehen: "We spent three hours there but we could not see everything."',
            },
            {
                id: 'en-a2-london-q5',
                type: 'freeText',
                question: 'What was the best part of the trip for the narrator?',
                questionDe: 'Was war der beste Teil der Reise für den Erzähler?',
                sampleAnswer: 'The best part was the musical they saw in the West End.',
                explanation: 'Der beste Teil war das Musical im West End: "The best part of the trip was the musical we saw in the West End."',
            },
        ],
    },
    {
        id: 'en-a2-my-hobbies',
        title: 'My Hobbies',
        titleDe: 'Meine Hobbys',
        level: 'A2',
        language: 'en',
        topic: 'Alltag',
        icon: '\uD83C\uDFA8',
        readingTimeMinutes: 3,
        text: `Everyone has hobbies that make them happy. I have several hobbies that I enjoy in my free time.

My favourite hobby is drawing. I have been drawing since I was six years old. I usually draw animals and nature. Last year I won a prize in a school art competition. My art teacher says I have talent, but I still need to practise a lot. I want to become a graphic designer when I grow up.

I also enjoy playing basketball. I am in the school team and we train twice a week. Our coach is very strict but fair. Last month we played in a tournament and came second. I was disappointed at first, but then I realised that second place is still really good.

Reading is another hobby of mine. I love fantasy novels, especially stories about magic and adventure. My favourite book is about a young wizard who saves his kingdom. I try to read at least thirty minutes every evening before bed.

On rainy days I like to bake with my grandmother. She has taught me how to make apple cake and chocolate biscuits. Baking is fun because you can be creative and eat the results afterwards!`,
        vocabulary: [
            { word: 'hobby', translation: 'Hobby', partOfSpeech: 'Nomen' },
            { word: 'competition', translation: 'Wettbewerb', partOfSpeech: 'Nomen' },
            { word: 'talent', translation: 'Talent', partOfSpeech: 'Nomen' },
            { word: 'graphic designer', translation: 'Grafikdesigner', partOfSpeech: 'Nomen' },
            { word: 'strict', translation: 'streng', partOfSpeech: 'Adjektiv' },
            { word: 'tournament', translation: 'Turnier', partOfSpeech: 'Nomen' },
            { word: 'disappointed', translation: 'enttäuscht', partOfSpeech: 'Adjektiv' },
            { word: 'wizard', translation: 'Zauberer', partOfSpeech: 'Nomen' },
        ],
        questions: [
            {
                id: 'en-a2-hobbies-q1',
                type: 'multipleChoice',
                question: 'What does the narrator usually draw?',
                questionDe: 'Was zeichnet der Erzähler normalerweise?',
                options: ['People and buildings', 'Animals and nature', 'Cars and planes', 'Comics and cartoons'],
                correctIndex: 1,
                explanation: 'Der Erzähler zeichnet Tiere und Natur: "I usually draw animals and nature."',
            },
            {
                id: 'en-a2-hobbies-q2',
                type: 'trueFalse',
                question: 'The basketball team won the tournament.',
                questionDe: 'Die Basketballmannschaft hat das Turnier gewonnen.',
                options: ['Richtig', 'Falsch'],
                correctAnswer: false,
                explanation: 'Sie wurden Zweite, nicht Erste: "We played in a tournament and came second."',
            },
            {
                id: 'en-a2-hobbies-q3',
                type: 'multipleChoice',
                question: 'What kind of books does the narrator like?',
                questionDe: 'Was für Bücher mag der Erzähler?',
                options: ['Science books', 'History novels', 'Fantasy novels', 'Crime stories'],
                correctIndex: 2,
                explanation: 'Der Erzähler liebt Fantasy-Romane: "I love fantasy novels, especially stories about magic and adventure."',
            },
            {
                id: 'en-a2-hobbies-q4',
                type: 'freeText',
                question: 'What does the narrator do on rainy days?',
                questionDe: 'Was macht der Erzähler an Regentagen?',
                sampleAnswer: 'On rainy days the narrator likes to bake with his/her grandmother. They make apple cake and chocolate biscuits.',
                explanation: 'An Regentagen backt der Erzähler mit seiner Großmutter Apfelkuchen und Schokoladenkekse.',
            },
        ],
    },

    // ── English B1 ─────────────────────────────────────────────────────
    {
        id: 'en-b1-climate-change',
        title: 'Climate Change and Our Future',
        titleDe: 'Klimawandel und unsere Zukunft',
        level: 'B1',
        language: 'en',
        topic: 'Kultur',
        icon: '\uD83C\uDF0D',
        readingTimeMinutes: 4,
        text: `Climate change is one of the most important issues of our time. Scientists have been studying the Earth's climate for decades, and the evidence is clear: our planet is getting warmer because of human activities.

The main cause of climate change is the burning of fossil fuels such as coal, oil and natural gas. When we burn these fuels for energy, they release carbon dioxide and other greenhouse gases into the atmosphere. These gases trap heat from the sun, causing the Earth's temperature to rise. This process is known as the greenhouse effect.

The consequences of climate change are already visible around the world. Glaciers are melting, sea levels are rising, and extreme weather events such as hurricanes, droughts and floods are becoming more frequent and severe. Many animal and plant species are struggling to adapt to the changing conditions. Coral reefs, for example, are dying because the oceans are becoming too warm and acidic.

However, there is still hope. Renewable energy sources like solar and wind power are becoming cheaper and more efficient every year. Many countries have signed international agreements to reduce their greenhouse gas emissions. Young people around the world are also raising their voices and demanding action from their governments.

What can we do as individuals? We can reduce our carbon footprint by using public transport, eating less meat, saving energy at home and recycling more. Every small action counts. If we all work together, we can still make a difference and protect our planet for future generations.`,
        vocabulary: [
            { word: 'climate change', translation: 'Klimawandel', partOfSpeech: 'Nomen' },
            { word: 'fossil fuels', translation: 'fossile Brennstoffe', partOfSpeech: 'Nomen' },
            { word: 'greenhouse gases', translation: 'Treibhausgase', partOfSpeech: 'Nomen' },
            { word: 'atmosphere', translation: 'Atmosphäre', partOfSpeech: 'Nomen' },
            { word: 'consequences', translation: 'Folgen/Konsequenzen', partOfSpeech: 'Nomen' },
            { word: 'glacier', translation: 'Gletscher', partOfSpeech: 'Nomen' },
            { word: 'renewable energy', translation: 'erneuerbare Energie', partOfSpeech: 'Nomen' },
            { word: 'carbon footprint', translation: 'CO\u2082-Fußabdruck', partOfSpeech: 'Nomen' },
            { word: 'emissions', translation: 'Emissionen', partOfSpeech: 'Nomen' },
            { word: 'severe', translation: 'schwer/heftig', partOfSpeech: 'Adjektiv' },
        ],
        questions: [
            {
                id: 'en-b1-climate-q1',
                type: 'multipleChoice',
                question: 'What is the main cause of climate change according to the text?',
                questionDe: 'Was ist laut dem Text die Hauptursache des Klimawandels?',
                options: [
                    'Volcanic eruptions',
                    'Burning of fossil fuels',
                    'Changes in the sun',
                    'Deforestation only',
                ],
                correctIndex: 1,
                explanation: 'Die Hauptursache ist die Verbrennung fossiler Brennstoffe: "The main cause of climate change is the burning of fossil fuels."',
            },
            {
                id: 'en-b1-climate-q2',
                type: 'trueFalse',
                question: 'Renewable energy sources are getting more expensive every year.',
                questionDe: 'Erneuerbare Energiequellen werden jedes Jahr teurer.',
                options: ['Richtig', 'Falsch'],
                correctAnswer: false,
                explanation: 'Das Gegenteil ist der Fall: "Renewable energy sources like solar and wind power are becoming cheaper and more efficient every year."',
            },
            {
                id: 'en-b1-climate-q3',
                type: 'multipleChoice',
                question: 'Why are coral reefs dying?',
                questionDe: 'Warum sterben Korallenriffe?',
                options: [
                    'Because of overfishing',
                    'Because the oceans are too warm and acidic',
                    'Because of plastic pollution',
                    'Because of underwater volcanoes',
                ],
                correctIndex: 1,
                explanation: 'Die Korallenriffe sterben, weil die Ozeane zu warm und zu sauer werden.',
            },
            {
                id: 'en-b1-climate-q4',
                type: 'multipleChoice',
                question: 'Which of the following is NOT mentioned as a way to reduce your carbon footprint?',
                questionDe: 'Welche der folgenden Maßnahmen wird NICHT als Möglichkeit erwähnt, den CO\u2082-Fußabdruck zu reduzieren?',
                options: [
                    'Using public transport',
                    'Eating less meat',
                    'Planting trees',
                    'Recycling more',
                ],
                correctIndex: 2,
                explanation: 'Bäume pflanzen wird im Text nicht als Maßnahme genannt. Genannt werden: öffentliche Verkehrsmittel nutzen, weniger Fleisch essen, Energie sparen und mehr recyceln.',
            },
            {
                id: 'en-b1-climate-q5',
                type: 'freeText',
                question: 'What consequences of climate change does the text describe?',
                questionDe: 'Welche Folgen des Klimawandels beschreibt der Text?',
                sampleAnswer: 'The text describes melting glaciers, rising sea levels, more frequent and severe extreme weather events like hurricanes, droughts and floods, and coral reefs dying.',
                explanation: 'Der Text nennt schmelzende Gletscher, steigende Meeresspiegel, häufigere Extremwetterereignisse (Hurrikane, Dürren, Überschwemmungen) und das Sterben von Korallenriffen.',
            },
        ],
    },
]
