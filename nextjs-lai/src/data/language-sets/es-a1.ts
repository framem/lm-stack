import type { LanguageSet } from './types'

export const esA1: LanguageSet = {
    id: 'es-a1',
    title: 'Spanisch A1 Grundwortschatz',
    subject: 'Spanisch',
    description: 'Grundlegende spanische Vokabeln für Anfänger — Alltagswörter, Verben mit Konjugation und Beispielsätzen. Validiert gegen die Goethe-Zertifikat A1 Wortliste.',
    level: 'A1',
    categories: [
        // ── 1. Begrüßung & Höflichkeit ──
        {
            name: 'Begrüßung & Höflichkeit',
            items: [
                { front: 'hola', back: 'hallo', partOfSpeech: 'Phrase', exampleSentence: 'Hola, ¿cómo estás?' },
                { front: 'adiós', back: 'auf Wiedersehen', partOfSpeech: 'Phrase', exampleSentence: 'Adiós, ¡hasta mañana!' },
                { front: 'buenos días', back: 'guten Morgen', partOfSpeech: 'Phrase', exampleSentence: 'Buenos días, ¿cómo está usted?' },
                { front: 'buenas tardes', back: 'guten Tag / guten Nachmittag', partOfSpeech: 'Phrase', exampleSentence: 'Buenas tardes, bienvenido al restaurante.' },
                { front: 'buenas noches', back: 'gute Nacht', partOfSpeech: 'Phrase', exampleSentence: 'Buenas noches, ¡que duermas bien!' },
                { front: 'por favor', back: 'bitte', partOfSpeech: 'Phrase', exampleSentence: '¿Me puede dar agua, por favor?' },
                { front: 'gracias', back: 'danke', partOfSpeech: 'Phrase', exampleSentence: 'Gracias por tu ayuda.' },
                { front: 'sí', back: 'ja', partOfSpeech: 'Adverb', exampleSentence: 'Sí, entiendo.' },
                { front: 'no', back: 'nein', partOfSpeech: 'Adverb', exampleSentence: 'No, gracias.' },
                { front: 'perdón', back: 'Entschuldigung', partOfSpeech: 'Phrase', exampleSentence: 'Perdón, llego tarde.' },
                { front: 'disculpe', back: 'Entschuldigen Sie', partOfSpeech: 'Phrase', exampleSentence: 'Disculpe, ¿dónde está la parada de autobús?' },
                { front: 'bienvenido', back: 'willkommen', partOfSpeech: 'Phrase', exampleSentence: '¡Bienvenido a nuestra escuela!' },
            ],
        },

        // ── 2. Familie & Personen ──
        {
            name: 'Familie & Personen',
            items: [
                { front: 'la madre', back: 'Mutter', partOfSpeech: 'Nomen', exampleSentence: 'Mi madre es profesora.' },
                { front: 'el padre', back: 'Vater', partOfSpeech: 'Nomen', exampleSentence: 'Mi padre trabaja en una oficina.' },
                { front: 'la hermana', back: 'Schwester', partOfSpeech: 'Nomen', exampleSentence: 'Tengo una hermana.' },
                { front: 'el hermano', back: 'Bruder', partOfSpeech: 'Nomen', exampleSentence: 'Mi hermano tiene diez años.' },
                { front: 'la hija', back: 'Tochter', partOfSpeech: 'Nomen', exampleSentence: 'Su hija va a la escuela.' },
                { front: 'el hijo', back: 'Sohn', partOfSpeech: 'Nomen', exampleSentence: 'Su hijo juega al fútbol.' },
                { front: 'la abuela', back: 'Großmutter', partOfSpeech: 'Nomen', exampleSentence: 'Mi abuela vive en el campo.' },
                { front: 'el abuelo', back: 'Großvater', partOfSpeech: 'Nomen', exampleSentence: 'Mi abuelo tiene ochenta años.' },
                { front: 'el bebé', back: 'Baby', partOfSpeech: 'Nomen', exampleSentence: 'El bebé está durmiendo.' },
                { front: 'el amigo / la amiga', back: 'Freund / Freundin', partOfSpeech: 'Nomen', exampleSentence: 'Ella es mi mejor amiga.' },
            ],
        },

        // ── 3. Zahlen ──
        {
            name: 'Zahlen',
            items: [
                { front: 'uno', back: 'eins', partOfSpeech: 'Zahl', exampleSentence: 'Tengo un gato.' },
                { front: 'dos', back: 'zwei', partOfSpeech: 'Zahl', exampleSentence: 'Hay dos libros en la mesa.' },
                { front: 'tres', back: 'drei', partOfSpeech: 'Zahl', exampleSentence: 'Ella tiene tres hijos.' },
                { front: 'cuatro', back: 'vier', partOfSpeech: 'Zahl', exampleSentence: 'La habitación tiene cuatro ventanas.' },
                { front: 'cinco', back: 'fünf', partOfSpeech: 'Zahl', exampleSentence: 'Necesito cinco minutos.' },
                { front: 'seis', back: 'sechs', partOfSpeech: 'Zahl', exampleSentence: 'Hay seis huevos en la caja.' },
                { front: 'siete', back: 'sieben', partOfSpeech: 'Zahl', exampleSentence: 'Una semana tiene siete días.' },
                { front: 'ocho', back: 'acht', partOfSpeech: 'Zahl', exampleSentence: 'La escuela empieza a las ocho.' },
                { front: 'nueve', back: 'neun', partOfSpeech: 'Zahl', exampleSentence: 'Tengo nueve lápices.' },
                { front: 'diez', back: 'zehn', partOfSpeech: 'Zahl', exampleSentence: 'Ella cuenta hasta diez.' },
                { front: 'veinte', back: 'zwanzig', partOfSpeech: 'Zahl', exampleSentence: 'Hay veinte estudiantes en la clase.' },
                { front: 'cien', back: 'hundert', partOfSpeech: 'Zahl', exampleSentence: 'Este libro tiene cien páginas.' },
            ],
        },

        // ── 4. Farben ──
        {
            name: 'Farben',
            items: [
                { front: 'rojo', back: 'rot', partOfSpeech: 'Adjektiv', exampleSentence: 'La manzana es roja.' },
                { front: 'azul', back: 'blau', partOfSpeech: 'Adjektiv', exampleSentence: 'El cielo es azul.' },
                { front: 'verde', back: 'grün', partOfSpeech: 'Adjektiv', exampleSentence: 'La hierba es verde.' },
                { front: 'amarillo', back: 'gelb', partOfSpeech: 'Adjektiv', exampleSentence: 'El sol es amarillo.' },
                { front: 'negro', back: 'schwarz', partOfSpeech: 'Adjektiv', exampleSentence: 'Mis zapatos son negros.' },
                { front: 'blanco', back: 'weiß', partOfSpeech: 'Adjektiv', exampleSentence: 'La nieve es blanca.' },
                { front: 'marrón', back: 'braun', partOfSpeech: 'Adjektiv', exampleSentence: 'El perro es marrón.' },
                { front: 'rosa', back: 'rosa', partOfSpeech: 'Adjektiv', exampleSentence: 'Ella lleva un vestido rosa.' },
                { front: 'gris', back: 'grau', partOfSpeech: 'Adjektiv', exampleSentence: 'El gato es gris.' },
                { front: 'morado', back: 'lila', partOfSpeech: 'Adjektiv', exampleSentence: 'Tengo una bolsa morada.' },
            ],
        },

        // ── 5. Essen & Trinken ──
        {
            name: 'Essen & Trinken',
            items: [
                { front: 'el pan', back: 'Brot', partOfSpeech: 'Nomen', exampleSentence: 'Como pan en el desayuno.' },
                { front: 'el agua', back: 'Wasser', partOfSpeech: 'Nomen', exampleSentence: '¿Me puede dar un vaso de agua?' },
                { front: 'la leche', back: 'Milch', partOfSpeech: 'Nomen', exampleSentence: 'Los niños beben leche.' },
                { front: 'la manzana', back: 'Apfel', partOfSpeech: 'Nomen', exampleSentence: 'Esta manzana es muy dulce.' },
                { front: 'el arroz', back: 'Reis', partOfSpeech: 'Nomen', exampleSentence: 'Comemos arroz con pollo.' },
                { front: 'el pollo', back: 'Hähnchen', partOfSpeech: 'Nomen', exampleSentence: 'El pollo está delicioso.' },
                { front: 'el pescado', back: 'Fisch', partOfSpeech: 'Nomen', exampleSentence: 'Como pescado los viernes.' },
                { front: 'el huevo', back: 'Ei', partOfSpeech: 'Nomen', exampleSentence: 'Desayuno un huevo cada mañana.' },
                { front: 'el café', back: 'Kaffee', partOfSpeech: 'Nomen', exampleSentence: 'Bebo café todas las mañanas.' },
                { front: 'el té', back: 'Tee', partOfSpeech: 'Nomen', exampleSentence: '¿Te gustaría un poco de té?' },
                { front: 'la tarta', back: 'Kuchen', partOfSpeech: 'Nomen', exampleSentence: 'Mi abuela hace la mejor tarta.' },
            ],
        },

        // ── 6. Kleidung ──
        {
            name: 'Kleidung',
            items: [
                { front: 'el zapato', back: 'Schuh', partOfSpeech: 'Nomen', exampleSentence: 'Necesito zapatos nuevos.' },
                { front: 'la chaqueta', back: 'Jacke', partOfSpeech: 'Nomen', exampleSentence: 'Lleva tu chaqueta, hace frío.' },
                { front: 'los calcetines', back: 'Socken', partOfSpeech: 'Nomen', exampleSentence: 'Necesito calcetines limpios.' },
                { front: 'la bufanda', back: 'Schal', partOfSpeech: 'Nomen', exampleSentence: 'Ella lleva una bufanda roja.' },
            ],
        },

        // ── 7. Haus & Wohnung ──
        {
            name: 'Haus & Wohnung',
            items: [
                { front: 'la casa', back: 'Haus', partOfSpeech: 'Nomen', exampleSentence: 'Vivimos en una casa pequeña.' },
                { front: 'la habitación', back: 'Zimmer', partOfSpeech: 'Nomen', exampleSentence: 'Mi habitación es muy grande.' },
                { front: 'la cocina', back: 'Küche', partOfSpeech: 'Nomen', exampleSentence: 'Cocinamos en la cocina.' },
                { front: 'el baño', back: 'Badezimmer', partOfSpeech: 'Nomen', exampleSentence: 'El baño está arriba.' },
                { front: 'la mesa', back: 'Tisch', partOfSpeech: 'Nomen', exampleSentence: 'El libro está en la mesa.' },
                { front: 'la cama', back: 'Bett', partOfSpeech: 'Nomen', exampleSentence: 'Los niños están en la cama.' },
                { front: 'el jardín', back: 'Garten', partOfSpeech: 'Nomen', exampleSentence: 'Tenemos un jardín bonito.' },
            ],
        },

        // ── 8. Alltag & Unterwegs ──
        {
            name: 'Alltag & Unterwegs',
            items: [
                { front: 'la escuela', back: 'Schule', partOfSpeech: 'Nomen', exampleSentence: 'Voy a la escuela todos los días.' },
                { front: 'el trabajo', back: 'Arbeit', partOfSpeech: 'Nomen', exampleSentence: 'Él va al trabajo en autobús.' },
                { front: 'el libro', back: 'Buch', partOfSpeech: 'Nomen', exampleSentence: 'Leo un libro cada semana.' },
                { front: 'el bolígrafo', back: 'Kugelschreiber', partOfSpeech: 'Nomen', exampleSentence: '¿Me prestas tu bolígrafo?' },
                { front: 'el autobús', back: 'Bus', partOfSpeech: 'Nomen', exampleSentence: 'El autobús llega a las ocho.' },
                { front: 'el coche', back: 'Auto', partOfSpeech: 'Nomen', exampleSentence: 'Mi padre tiene un coche azul.' },
                { front: 'el tren', back: 'Zug', partOfSpeech: 'Nomen', exampleSentence: 'Tomamos el tren a Madrid.' },
                { front: 'el teléfono', back: 'Telefon / Handy', partOfSpeech: 'Nomen', exampleSentence: '¿Dónde está mi teléfono?' },
                { front: 'el dinero', back: 'Geld', partOfSpeech: 'Nomen', exampleSentence: 'No tengo suficiente dinero.' },
                { front: 'la bolsa', back: 'Tasche', partOfSpeech: 'Nomen', exampleSentence: 'Mi bolsa es muy pesada.' },
                { front: 'la llave', back: 'Schlüssel', partOfSpeech: 'Nomen', exampleSentence: 'No encuentro mi llave.' },
                { front: 'la tienda', back: 'Geschäft / Laden', partOfSpeech: 'Nomen', exampleSentence: 'La tienda cierra a las seis.' },
            ],
        },

        // ── 9. Wetter & Natur ──
        {
            name: 'Wetter & Natur',
            items: [
                { front: 'el sol', back: 'Sonne', partOfSpeech: 'Nomen', exampleSentence: 'El sol brilla hoy.' },
                { front: 'la lluvia', back: 'Regen', partOfSpeech: 'Nomen', exampleSentence: 'No me gusta la lluvia.' },
                { front: 'el viento', back: 'Wind', partOfSpeech: 'Nomen', exampleSentence: 'El viento es muy fuerte hoy.' },
                { front: 'el tiempo', back: 'Wetter / Zeit', partOfSpeech: 'Nomen', exampleSentence: '¿Qué tiempo hace hoy?' },
            ],
        },

        // ── 10. Zeit & Tage ──
        {
            name: 'Zeit & Tage',
            items: [
                { front: 'hoy', back: 'heute', partOfSpeech: 'Adverb', exampleSentence: 'Hoy es lunes.' },
                { front: 'mañana', back: 'morgen', partOfSpeech: 'Adverb', exampleSentence: 'Te veré mañana.' },
                { front: 'ayer', back: 'gestern', partOfSpeech: 'Adverb', exampleSentence: 'Ayer fue domingo.' },
                { front: 'la mañana', back: 'Morgen', partOfSpeech: 'Nomen', exampleSentence: 'Corro por la mañana.' },
                { front: 'la tarde', back: 'Nachmittag / Abend', partOfSpeech: 'Nomen', exampleSentence: 'Cenamos por la tarde.' },
                { front: 'la semana', back: 'Woche', partOfSpeech: 'Nomen', exampleSentence: 'Una semana tiene siete días.' },
                { front: 'el mes', back: 'Monat', partOfSpeech: 'Nomen', exampleSentence: 'Enero es el primer mes.' },
                { front: 'el año', back: 'Jahr', partOfSpeech: 'Nomen', exampleSentence: 'Un año tiene doce meses.' },
                { front: 'la hora', back: 'Stunde', partOfSpeech: 'Nomen', exampleSentence: 'La clase dura una hora.' },
                { front: 'siempre', back: 'immer', partOfSpeech: 'Adverb', exampleSentence: 'Siempre desayuno.' },
                { front: 'nunca', back: 'nie', partOfSpeech: 'Adverb', exampleSentence: 'Nunca bebo café por la noche.' },
            ],
        },

        // ── 11. Adjektive ──
        {
            name: 'Adjektive',
            items: [
                { front: 'grande', back: 'groß', partOfSpeech: 'Adjektiv', exampleSentence: 'La casa es muy grande.' },
                { front: 'pequeño', back: 'klein', partOfSpeech: 'Adjektiv', exampleSentence: 'El gato es muy pequeño.' },
                { front: 'bueno', back: 'gut', partOfSpeech: 'Adjektiv', exampleSentence: 'Esta tarta está muy buena.' },
                { front: 'malo', back: 'schlecht', partOfSpeech: 'Adjektiv', exampleSentence: 'El tiempo es malo hoy.' },
                { front: 'nuevo', back: 'neu', partOfSpeech: 'Adjektiv', exampleSentence: 'Tengo un teléfono nuevo.' },
                { front: 'viejo', back: 'alt', partOfSpeech: 'Adjektiv', exampleSentence: 'Este edificio es muy viejo.' },
                { front: 'bonito', back: 'schön', partOfSpeech: 'Adjektiv', exampleSentence: 'El jardín es bonito.' },
                { front: 'rápido', back: 'schnell', partOfSpeech: 'Adjektiv', exampleSentence: 'El tren es muy rápido.' },
                { front: 'lento', back: 'langsam', partOfSpeech: 'Adjektiv', exampleSentence: 'El autobús es demasiado lento.' },
                { front: 'feliz', back: 'glücklich', partOfSpeech: 'Adjektiv', exampleSentence: 'Los niños están felices.' },
                { front: 'fácil', back: 'einfach / leicht', partOfSpeech: 'Adjektiv', exampleSentence: 'Este ejercicio es fácil.' },
                { front: 'importante', back: 'wichtig', partOfSpeech: 'Adjektiv', exampleSentence: 'Esto es muy importante.' },
            ],
        },

        // ── 12. Verben ──
        {
            name: 'Verben',
            items: [
                {
                    front: 'ser',
                    back: 'sein',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Yo soy estudiante.',
                    conjugation: {
                        present: { yo: 'soy', tú: 'eres', 'él/ella': 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son' },
                        past: { yo: 'fui', tú: 'fuiste', 'él/ella': 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', ellos: 'fueron' },
                    },
                },
                {
                    front: 'tener',
                    back: 'haben',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Yo tengo dos hermanas.',
                    conjugation: {
                        present: { yo: 'tengo', tú: 'tienes', 'él/ella': 'tiene', nosotros: 'tenemos', vosotros: 'tenéis', ellos: 'tienen' },
                        past: { yo: 'tuve', tú: 'tuviste', 'él/ella': 'tuvo', nosotros: 'tuvimos', vosotros: 'tuvisteis', ellos: 'tuvieron' },
                    },
                },
                {
                    front: 'ir',
                    back: 'gehen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Yo voy a la escuela todos los días.',
                    conjugation: {
                        present: { yo: 'voy', tú: 'vas', 'él/ella': 'va', nosotros: 'vamos', vosotros: 'vais', ellos: 'van' },
                        past: { yo: 'fui', tú: 'fuiste', 'él/ella': 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', ellos: 'fueron' },
                    },
                },
                {
                    front: 'venir',
                    back: 'kommen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Por favor, ven a mi casa.',
                    conjugation: {
                        present: { yo: 'vengo', tú: 'vienes', 'él/ella': 'viene', nosotros: 'venimos', vosotros: 'venís', ellos: 'vienen' },
                        past: { yo: 'vine', tú: 'viniste', 'él/ella': 'vino', nosotros: 'vinimos', vosotros: 'vinisteis', ellos: 'vinieron' },
                    },
                },
                {
                    front: 'comer',
                    back: 'essen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Nosotros comemos a las doce.',
                    conjugation: {
                        present: { yo: 'como', tú: 'comes', 'él/ella': 'come', nosotros: 'comemos', vosotros: 'coméis', ellos: 'comen' },
                        past: { yo: 'comí', tú: 'comiste', 'él/ella': 'comió', nosotros: 'comimos', vosotros: 'comisteis', ellos: 'comieron' },
                    },
                },
                {
                    front: 'beber',
                    back: 'trinken',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Yo bebo agua todos los días.',
                    conjugation: {
                        present: { yo: 'bebo', tú: 'bebes', 'él/ella': 'bebe', nosotros: 'bebemos', vosotros: 'bebéis', ellos: 'beben' },
                        past: { yo: 'bebí', tú: 'bebiste', 'él/ella': 'bebió', nosotros: 'bebimos', vosotros: 'bebisteis', ellos: 'bebieron' },
                    },
                },
                {
                    front: 'dormir',
                    back: 'schlafen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Yo duermo ocho horas cada noche.',
                    conjugation: {
                        present: { yo: 'duermo', tú: 'duermes', 'él/ella': 'duerme', nosotros: 'dormimos', vosotros: 'dormís', ellos: 'duermen' },
                        past: { yo: 'dormí', tú: 'dormiste', 'él/ella': 'durmió', nosotros: 'dormimos', vosotros: 'dormisteis', ellos: 'durmieron' },
                    },
                },
                {
                    front: 'trabajar',
                    back: 'arbeiten',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Mi madre trabaja en un hospital.',
                    conjugation: {
                        present: { yo: 'trabajo', tú: 'trabajas', 'él/ella': 'trabaja', nosotros: 'trabajamos', vosotros: 'trabajáis', ellos: 'trabajan' },
                        past: { yo: 'trabajé', tú: 'trabajaste', 'él/ella': 'trabajó', nosotros: 'trabajamos', vosotros: 'trabajasteis', ellos: 'trabajaron' },
                    },
                },
                {
                    front: 'aprender',
                    back: 'lernen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Yo aprendo español en la escuela.',
                    conjugation: {
                        present: { yo: 'aprendo', tú: 'aprendes', 'él/ella': 'aprende', nosotros: 'aprendemos', vosotros: 'aprendéis', ellos: 'aprenden' },
                        past: { yo: 'aprendí', tú: 'aprendiste', 'él/ella': 'aprendió', nosotros: 'aprendimos', vosotros: 'aprendisteis', ellos: 'aprendieron' },
                    },
                },
                {
                    front: 'hablar',
                    back: 'sprechen',
                    partOfSpeech: 'Verb',
                    exampleSentence: '¿Tú hablas español?',
                    conjugation: {
                        present: { yo: 'hablo', tú: 'hablas', 'él/ella': 'habla', nosotros: 'hablamos', vosotros: 'habláis', ellos: 'hablan' },
                        past: { yo: 'hablé', tú: 'hablaste', 'él/ella': 'habló', nosotros: 'hablamos', vosotros: 'hablasteis', ellos: 'hablaron' },
                    },
                },
                {
                    front: 'vivir',
                    back: 'leben / wohnen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Yo vivo en una ciudad grande.',
                    conjugation: {
                        present: { yo: 'vivo', tú: 'vives', 'él/ella': 'vive', nosotros: 'vivimos', vosotros: 'vivís', ellos: 'viven' },
                        past: { yo: 'viví', tú: 'viviste', 'él/ella': 'vivió', nosotros: 'vivimos', vosotros: 'vivisteis', ellos: 'vivieron' },
                    },
                },
                {
                    front: 'comprar',
                    back: 'kaufen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Quiero comprar un libro nuevo.',
                    conjugation: {
                        present: { yo: 'compro', tú: 'compras', 'él/ella': 'compra', nosotros: 'compramos', vosotros: 'compráis', ellos: 'compran' },
                        past: { yo: 'compré', tú: 'compraste', 'él/ella': 'compró', nosotros: 'compramos', vosotros: 'comprasteis', ellos: 'compraron' },
                    },
                },
            ],
        },
    ],
}
