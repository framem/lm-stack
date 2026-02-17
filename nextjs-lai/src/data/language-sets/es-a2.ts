import type { LanguageSet } from './types'

export const esA2: LanguageSet = {
    id: 'es-a2',
    title: 'Spanisch A2 Aufbauwortschatz',
    subject: 'Spanisch',
    description: 'Spanische Vokabeln für Fortgeschrittene Anfänger — Kleidung, Wohnung, Wetter und mehr. Validiert gegen die Goethe-Zertifikat A2 Wortliste.',
    level: 'A2',
    categories: [
        // ── 1. Familie & Zeit ──
        {
            name: 'Familie & Zeit',
            items: [
                { front: 'la tía', back: 'Tante', partOfSpeech: 'Nomen', exampleSentence: 'Mi tía nos visita cada domingo.' },
                { front: 'el tío', back: 'Onkel', partOfSpeech: 'Nomen', exampleSentence: 'Mi tío tiene un coche grande.' },
                { front: 'la noche', back: 'Nacht', partOfSpeech: 'Nomen', exampleSentence: 'La noche es oscura y tranquila.' },
            ],
        },

        // ── 2. Essen & Küche ──
        {
            name: 'Essen & Küche',
            items: [
                { front: 'el queso', back: 'Käse', partOfSpeech: 'Nomen', exampleSentence: 'Este queso es de España.' },
                { front: 'el azúcar', back: 'Zucker', partOfSpeech: 'Nomen', exampleSentence: 'Pongo azúcar en el café.' },
                { front: 'la sopa', back: 'Suppe', partOfSpeech: 'Nomen', exampleSentence: 'La sopa está caliente.' },
                { front: 'naranja', back: 'orange', partOfSpeech: 'Adjektiv', exampleSentence: 'Me gusta el zumo de naranja.' },
            ],
        },

        // ── 3. Kleidung ──
        {
            name: 'Kleidung',
            items: [
                { front: 'la camisa', back: 'Hemd', partOfSpeech: 'Nomen', exampleSentence: 'Él lleva una camisa blanca.' },
                { front: 'los pantalones', back: 'Hose', partOfSpeech: 'Nomen', exampleSentence: 'Estos pantalones son demasiado largos.' },
                { front: 'el vestido', back: 'Kleid', partOfSpeech: 'Nomen', exampleSentence: 'Ella lleva un vestido bonito.' },
                { front: 'el sombrero', back: 'Hut / Mütze', partOfSpeech: 'Nomen', exampleSentence: 'Él lleva un sombrero en invierno.' },
                { front: 'la falda', back: 'Rock', partOfSpeech: 'Nomen', exampleSentence: 'La falda es azul.' },
                { front: 'el abrigo', back: 'Mantel', partOfSpeech: 'Nomen', exampleSentence: 'Hace frío, ponte el abrigo.' },
                { front: 'el jersey', back: 'Pullover', partOfSpeech: 'Nomen', exampleSentence: 'Este jersey es muy cálido.' },
            ],
        },

        // ── 4. Haus & Wohnung ──
        {
            name: 'Haus & Wohnung',
            items: [
                { front: 'el dormitorio', back: 'Schlafzimmer', partOfSpeech: 'Nomen', exampleSentence: 'El dormitorio tiene una ventana grande.' },
                { front: 'la puerta', back: 'Tür', partOfSpeech: 'Nomen', exampleSentence: 'Por favor, cierra la puerta.' },
                { front: 'la ventana', back: 'Fenster', partOfSpeech: 'Nomen', exampleSentence: 'Abre la ventana, por favor.' },
                { front: 'la silla', back: 'Stuhl', partOfSpeech: 'Nomen', exampleSentence: 'Por favor, siéntate en la silla.' },
                { front: 'la lámpara', back: 'Lampe', partOfSpeech: 'Nomen', exampleSentence: 'Enciende la lámpara, por favor.' },
                { front: 'el suelo', back: 'Boden / Stockwerk', partOfSpeech: 'Nomen', exampleSentence: 'El suelo está limpio.' },
            ],
        },

        // ── 5. Wetter & Natur ──
        {
            name: 'Wetter & Natur',
            items: [
                { front: 'la nieve', back: 'Schnee', partOfSpeech: 'Nomen', exampleSentence: 'A los niños les gusta la nieve.' },
                { front: 'la nube', back: 'Wolke', partOfSpeech: 'Nomen', exampleSentence: 'Hay muchas nubes en el cielo.' },
                { front: 'caliente', back: 'warm / heiß', partOfSpeech: 'Adjektiv', exampleSentence: 'Hace calor en verano.' },
                { front: 'frío', back: 'kalt', partOfSpeech: 'Adjektiv', exampleSentence: 'Hace mucho frío fuera.' },
                { front: 'la tormenta', back: 'Sturm', partOfSpeech: 'Nomen', exampleSentence: 'Hubo una gran tormenta anoche.' },
                { front: 'el cielo', back: 'Himmel', partOfSpeech: 'Nomen', exampleSentence: 'El cielo está azul y despejado.' },
            ],
        },
    ],
}
