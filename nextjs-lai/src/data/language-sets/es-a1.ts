import type { LanguageSet } from './types'

export const esA1: LanguageSet = {
    id: 'es-a1',
    title: 'Spanisch A1 Grundwortschatz',
    subject: 'Spanisch',
    description: 'Grundlegende spanische Vokabeln für Anfänger — Alltagswörter, Verben mit Konjugation und Beispielsätzen. Orientiert am Plan Curricular del Instituto Cervantes (PCIC) A1.',
    level: 'A1',
    categories: [
        // ── 1. Begrüßung & Höflichkeit ──
        {
            name: 'Begrüßung & Höflichkeit',
            learningOutcomes: [
                'Jemanden auf Spanisch begrüßen und verabschieden',
                'Höflich nach etwas fragen und danken',
                'Tageszeit-abhängige Grüße verwenden',
            ],
            grammarTip: {
                title: 'Tú vs. Usted — Du vs. Sie',
                explanation: 'Im Spanischen unterscheidet man zwischen der informellen Anrede „tú" (du) und der formellen „usted" (Sie). Bei Fremden und älteren Personen verwendet man „usted".',
                examples: ['¿Cómo estás? (informell, tú)', '¿Cómo está usted? (formell)'],
            },
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
            learningOutcomes: [
                'Familienmitglieder benennen',
                'Sagen, wie viele Geschwister du hast',
                'Eine Person kurz beschreiben',
            ],
            grammarTip: {
                title: 'Ser — Ich bin / Er ist',
                explanation: '„Ser" beschreibt, WER oder WAS jemand ist (Name, Beruf, Herkunft). Es ist unregelmäßig: yo soy, tú eres, él/ella es.',
                examples: ['Yo soy estudiante.', 'Ella es mi madre.', 'Él es de España.'],
            },
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
            learningOutcomes: [
                'Auf Spanisch bis 100 zählen',
                'Preise verstehen und nennen',
                'Nach der Uhrzeit fragen',
            ],
            grammarTip: {
                title: 'Uno vs. Un — Zahlwort vor Nomen',
                explanation: 'Vor männlichen Nomen wird „uno" zu „un" gekürzt: „un libro" (ein Buch), aber „una mesa" (ein Tisch, weiblich). Zahlen ab 2 ändern sich nicht.',
                examples: ['Tengo un hermano.', 'Hay una escuela aquí.', 'Necesito dos libros.'],
            },
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
            learningOutcomes: [
                'Farben auf Spanisch benennen',
                'Gegenstände mit Farben beschreiben',
                'Geschlechtsanpassung bei Farbadjektiven verstehen',
            ],
            grammarTip: {
                title: 'Adjektive — Geschlechtsanpassung',
                explanation: 'Farbadjektive auf -o ändern sich: rojo → roja (weiblich). Farben auf -e oder Konsonant bleiben gleich: verde, azul, gris.',
                examples: ['El coche es rojo.', 'La casa es roja.', 'El cielo es azul. / La mesa es azul.'],
            },
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
            learningOutcomes: [
                'Im Restaurant bestellen',
                'Sagen, was du gerne isst und trinkst',
                'Nach der Rechnung fragen',
            ],
            grammarTip: {
                title: 'Querer — Ich möchte',
                explanation: '„Querer" (wollen/möchten) ist ein Stammvokalwechsel-Verb: e → ie. Yo quiero, tú quieres, él quiere. Verwende es zum Bestellen.',
                examples: ['Quiero un café, por favor.', '¿Qué quieres beber?', 'Queremos la cuenta.'],
            },
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
            learningOutcomes: [
                'Kleidungsstücke benennen',
                'Sagen, was du trägst',
                'Im Geschäft nach Größen fragen',
            ],
            grammarTip: {
                title: 'Llevar — Tragen/Anhaben',
                explanation: '„Llevar" ist ein regelmäßiges -ar-Verb und bedeutet „tragen/anhaben". Konjugation: yo llevo, tú llevas, él lleva.',
                examples: ['Llevo una camiseta azul.', '¿Qué llevas hoy?', 'Ella lleva un vestido bonito.'],
            },
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
            learningOutcomes: [
                'Zimmer und Möbel benennen',
                'Beschreiben, wo etwas ist',
                'Deine Wohnung kurz vorstellen',
            ],
            grammarTip: {
                title: 'Hay vs. Está — Es gibt vs. Es ist',
                explanation: '„Hay" = es gibt (unbestimmt): „Hay un sofá." „Está" = es befindet sich (bestimmt): „El sofá está en la sala."',
                examples: ['Hay tres habitaciones.', 'La cocina está aquí.', '¿Hay un baño?'],
            },
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
            learningOutcomes: [
                'Nach dem Weg fragen',
                'Verkehrsmittel benennen',
                'Deinen Tagesablauf beschreiben',
            ],
            grammarTip: {
                title: 'Ir a — Ich gehe nach / zu',
                explanation: '„Ir" (gehen) ist unregelmäßig: yo voy, tú vas, él va. Mit „a" drückt es Richtung oder Zukunft aus: „Voy a la escuela." / „Voy a comer."',
                examples: ['Voy al supermercado.', '¿Adónde vas?', 'Vamos a la playa.'],
            },
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
            learningOutcomes: [
                'Über das Wetter sprechen',
                'Naturelemente benennen',
                'Das aktuelle Wetter beschreiben',
            ],
            grammarTip: {
                title: 'Hacer — Wetter-Ausdrücke',
                explanation: 'Im Spanischen verwendet man „hacer" für Wetter: „Hace calor" (es ist heiß), „Hace frío" (es ist kalt). Regen/Schnee: „Llueve" / „Nieva".',
                examples: ['¿Qué tiempo hace?', 'Hace sol.', 'Hace mucho frío hoy.'],
            },
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
            learningOutcomes: [
                'Wochentage und Monate nennen',
                'Nach der Uhrzeit fragen und antworten',
                'Termine und Verabredungen machen',
            ],
            grammarTip: {
                title: 'Artikel bei Wochentagen',
                explanation: 'Wochentage haben den Artikel „el/los": „El lunes voy al gimnasio." (Am Montag gehe ich ins Fitnessstudio.) Für Gewohnheiten: „Los lunes" (montags).',
                examples: ['Hoy es lunes.', 'El viernes tengo clase.', 'Los sábados descanso.'],
            },
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
            learningOutcomes: [
                'Personen und Dinge beschreiben',
                'Gegensatzpaare verwenden (groß/klein, gut/schlecht)',
                'Adjektive richtig platzieren',
            ],
            grammarTip: {
                title: 'Ser vs. Estar — Sein (dauerhaft vs. vorübergehend)',
                explanation: '„Ser" für dauerhafte Eigenschaften: „Soy alto." (Ich bin groß.) „Estar" für vorübergehende Zustände: „Estoy cansado." (Ich bin müde.)',
                examples: ['Ella es inteligente. (dauerhaft)', 'Él está enfermo. (vorübergehend)', 'La casa es grande. (Eigenschaft)'],
            },
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
            learningOutcomes: [
                'Die wichtigsten Alltagsverben konjugieren',
                'Einfache Sätze im Präsens bilden',
                'Die drei Verb-Endungen (-ar, -er, -ir) unterscheiden',
            ],
            grammarTip: {
                title: 'Regelmäßige Verben — ar / er / ir',
                explanation: 'Spanische Verben enden auf -ar, -er oder -ir. Für „yo" wird die Endung zu -o: hablar → hablo, comer → como, vivir → vivo.',
                examples: ['Yo hablo español. (-ar)', 'Tú comes pizza. (-er)', 'Él vive en Madrid. (-ir)'],
            },
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

        // ── 13. Körper & Gesundheit ──
        {
            name: 'Körper & Gesundheit',
            learningOutcomes: [
                'Körperteile benennen',
                'Sagen, was dir wehtut',
                'Beim Arzt grundlegende Beschwerden schildern',
            ],
            grammarTip: {
                title: 'Me duele — Mir tut ... weh',
                explanation: '„Me duele" (Einzahl) oder „Me duelen" (Mehrzahl): „Me duele la cabeza." (Mir tut der Kopf weh.) „Me duelen los pies." (Mir tun die Füße weh.)',
                examples: ['Me duele la cabeza.', 'Me duelen las piernas.', '¿Te duele algo?'],
            },
            items: [
                { front: 'la cabeza', back: 'Kopf', partOfSpeech: 'Nomen', exampleSentence: 'Me duele la cabeza.' },
                { front: 'el ojo', back: 'Auge', partOfSpeech: 'Nomen', exampleSentence: 'Ella tiene los ojos azules.' },
                { front: 'la nariz', back: 'Nase', partOfSpeech: 'Nomen', exampleSentence: 'Mi nariz está roja por el frío.' },
                { front: 'la boca', back: 'Mund', partOfSpeech: 'Nomen', exampleSentence: 'Abre la boca, por favor.' },
                { front: 'la oreja', back: 'Ohr', partOfSpeech: 'Nomen', exampleSentence: 'Me duelen las orejas.' },
                { front: 'el brazo', back: 'Arm', partOfSpeech: 'Nomen', exampleSentence: 'Me rompí el brazo jugando.' },
                { front: 'la mano', back: 'Hand', partOfSpeech: 'Nomen', exampleSentence: 'Lávate las manos antes de comer.' },
                { front: 'la pierna', back: 'Bein', partOfSpeech: 'Nomen', exampleSentence: 'Me duele la pierna derecha.' },
                { front: 'el pie', back: 'Fuß', partOfSpeech: 'Nomen', exampleSentence: 'Tengo los pies fríos.' },
                { front: 'el estómago', back: 'Magen / Bauch', partOfSpeech: 'Nomen', exampleSentence: 'Me duele el estómago.' },
                { front: 'el diente', back: 'Zahn', partOfSpeech: 'Nomen', exampleSentence: 'Me duele un diente.' },
                { front: 'el corazón', back: 'Herz', partOfSpeech: 'Nomen', exampleSentence: 'El corazón late rápido.' },
                { front: 'enfermo', back: 'krank', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy enfermo hoy.' },
                { front: 'sano', back: 'gesund', partOfSpeech: 'Adjektiv', exampleSentence: 'Comer fruta es sano.' },
                { front: 'el médico', back: 'Arzt', partOfSpeech: 'Nomen', exampleSentence: 'Necesito ir al médico.' },
                { front: 'la farmacia', back: 'Apotheke', partOfSpeech: 'Nomen', exampleSentence: '¿Hay una farmacia cerca?' },
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
                title: 'Soy + Beruf (ohne Artikel!)',
                explanation: 'Im Spanischen verwendet man keinen Artikel beim Beruf: „Soy profesor." (nicht „Soy un profesor."). Mit Adjektiv: „Soy un buen profesor."',
                examples: ['Soy estudiante.', '¿A qué te dedicas?', 'Ella es médica.'],
            },
            items: [
                { front: 'el profesor / la profesora', back: 'Lehrer/in', partOfSpeech: 'Nomen', exampleSentence: 'Mi madre es profesora de español.' },
                { front: 'el estudiante / la estudiante', back: 'Student/in', partOfSpeech: 'Nomen', exampleSentence: 'Soy estudiante de medicina.' },
                { front: 'el médico / la médica', back: 'Arzt/Ärztin', partOfSpeech: 'Nomen', exampleSentence: 'Mi hermano es médico.' },
                { front: 'el camarero / la camarera', back: 'Kellner/in', partOfSpeech: 'Nomen', exampleSentence: 'El camarero trae la comida.' },
                { front: 'el policía / la policía', back: 'Polizist/in', partOfSpeech: 'Nomen', exampleSentence: 'El policía ayuda a la gente.' },
                { front: 'el cocinero / la cocinera', back: 'Koch/Köchin', partOfSpeech: 'Nomen', exampleSentence: 'Mi abuela es una buena cocinera.' },
                { front: 'el ingeniero / la ingeniera', back: 'Ingenieur/in', partOfSpeech: 'Nomen', exampleSentence: 'Soy ingeniero informático.' },
                { front: 'el abogado / la abogada', back: 'Anwalt/Anwältin', partOfSpeech: 'Nomen', exampleSentence: 'Necesito un abogado.' },
                { front: 'la oficina', back: 'Büro', partOfSpeech: 'Nomen', exampleSentence: 'Trabajo en una oficina.' },
                { front: 'la empresa', back: 'Firma / Unternehmen', partOfSpeech: 'Nomen', exampleSentence: 'Mi empresa es muy grande.' },
                { front: 'el jefe / la jefa', back: 'Chef/in', partOfSpeech: 'Nomen', exampleSentence: 'Mi jefa es muy amable.' },
                { front: 'el sueldo', back: 'Gehalt', partOfSpeech: 'Nomen', exampleSentence: 'El sueldo es bueno.' },
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
                title: 'Me gusta — Mir gefällt / Ich mag',
                explanation: '„Me gusta" + Nomen (Einzahl) oder Infinitiv: „Me gusta el fútbol." „Me gustan" + Nomen (Mehrzahl): „Me gustan los libros."',
                examples: ['Me gusta bailar.', '¿Te gusta la música?', 'No me gustan los deportes.'],
            },
            items: [
                { front: 'el deporte', back: 'Sport', partOfSpeech: 'Nomen', exampleSentence: 'Me gusta hacer deporte.' },
                { front: 'el fútbol', back: 'Fußball', partOfSpeech: 'Nomen', exampleSentence: 'Juego al fútbol los sábados.' },
                { front: 'la música', back: 'Musik', partOfSpeech: 'Nomen', exampleSentence: 'Me gusta escuchar música.' },
                { front: 'la película', back: 'Film', partOfSpeech: 'Nomen', exampleSentence: 'Vamos a ver una película.' },
                { front: 'el libro', back: 'Buch', partOfSpeech: 'Nomen', exampleSentence: 'Leo un libro cada mes.' },
                { front: 'la playa', back: 'Strand', partOfSpeech: 'Nomen', exampleSentence: 'En verano voy a la playa.' },
                { front: 'la montaña', back: 'Berg', partOfSpeech: 'Nomen', exampleSentence: 'Me gusta caminar en la montaña.' },
                { front: 'el viaje', back: 'Reise', partOfSpeech: 'Nomen', exampleSentence: 'Quiero hacer un viaje a España.' },
                { front: 'la fiesta', back: 'Party / Fest', partOfSpeech: 'Nomen', exampleSentence: 'Hay una fiesta el sábado.' },
                { front: 'la foto', back: 'Foto', partOfSpeech: 'Nomen', exampleSentence: '¿Puedo hacer una foto?' },
                { front: 'nadar', back: 'schwimmen', partOfSpeech: 'Verb', exampleSentence: 'Me gusta nadar en el mar.' },
                { front: 'bailar', back: 'tanzen', partOfSpeech: 'Verb', exampleSentence: '¿Te gusta bailar salsa?' },
                { front: 'cocinar', back: 'kochen', partOfSpeech: 'Verb', exampleSentence: 'Me gusta cocinar paella.' },
                { front: 'cantar', back: 'singen', partOfSpeech: 'Verb', exampleSentence: 'Ella canta muy bien.' },
                { front: 'dibujar', back: 'zeichnen', partOfSpeech: 'Verb', exampleSentence: 'Mi hijo dibuja animales.' },
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
                title: '¿Cuánto cuesta? — Wie viel kostet es?',
                explanation: '„¿Cuánto cuesta?" (Einzahl) oder „¿Cuánto cuestan?" (Mehrzahl). Antwort: „Cuesta dos euros." / „Cuestan cinco euros."',
                examples: ['¿Cuánto cuesta este libro?', 'Cuesta tres euros.', '¿Cuánto cuestan los zapatos?'],
            },
            items: [
                { front: 'el supermercado', back: 'Supermarkt', partOfSpeech: 'Nomen', exampleSentence: 'Voy al supermercado los lunes.' },
                { front: 'el precio', back: 'Preis', partOfSpeech: 'Nomen', exampleSentence: '¿Cuál es el precio?' },
                { front: 'barato', back: 'günstig / billig', partOfSpeech: 'Adjektiv', exampleSentence: 'Esta camiseta es muy barata.' },
                { front: 'caro', back: 'teuer', partOfSpeech: 'Adjektiv', exampleSentence: 'El restaurante es muy caro.' },
                { front: 'la tarjeta', back: 'Karte (Kreditkarte)', partOfSpeech: 'Nomen', exampleSentence: '¿Puedo pagar con tarjeta?' },
                { front: 'el euro', back: 'Euro', partOfSpeech: 'Nomen', exampleSentence: 'Cuesta cinco euros.' },
                { front: 'la cuenta', back: 'Rechnung', partOfSpeech: 'Nomen', exampleSentence: 'La cuenta, por favor.' },
                { front: 'pagar', back: 'bezahlen', partOfSpeech: 'Verb', exampleSentence: '¿Dónde puedo pagar?' },
                { front: 'comprar', back: 'kaufen', partOfSpeech: 'Verb', exampleSentence: 'Quiero comprar pan.' },
                { front: 'vender', back: 'verkaufen', partOfSpeech: 'Verb', exampleSentence: 'Ellos venden fruta fresca.' },
                { front: 'el mercado', back: 'Markt', partOfSpeech: 'Nomen', exampleSentence: 'El mercado abre los domingos.' },
                { front: 'la talla', back: 'Größe (Kleidung)', partOfSpeech: 'Nomen', exampleSentence: '¿Tiene esta camiseta en talla M?' },
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
                title: 'Estar + Ort — Wo sich etwas befindet',
                explanation: 'Für Ortsangaben: „estar" (nicht „ser"): „El banco está en la calle principal." Richtungsangaben: a la derecha, a la izquierda, todo recto.',
                examples: ['¿Dónde está el banco?', 'Está a la derecha.', 'El hospital está lejos.'],
            },
            items: [
                { front: 'la ciudad', back: 'Stadt', partOfSpeech: 'Nomen', exampleSentence: 'Vivo en una ciudad grande.' },
                { front: 'la calle', back: 'Straße', partOfSpeech: 'Nomen', exampleSentence: '¿En qué calle vives?' },
                { front: 'la plaza', back: 'Platz', partOfSpeech: 'Nomen', exampleSentence: 'Nos vemos en la plaza.' },
                { front: 'el banco', back: 'Bank', partOfSpeech: 'Nomen', exampleSentence: 'El banco abre a las nueve.' },
                { front: 'el hospital', back: 'Krankenhaus', partOfSpeech: 'Nomen', exampleSentence: 'El hospital está cerca.' },
                { front: 'la iglesia', back: 'Kirche', partOfSpeech: 'Nomen', exampleSentence: 'La iglesia es muy antigua.' },
                { front: 'el parque', back: 'Park', partOfSpeech: 'Nomen', exampleSentence: 'Los niños juegan en el parque.' },
                { front: 'la estación', back: 'Bahnhof', partOfSpeech: 'Nomen', exampleSentence: '¿Dónde está la estación de tren?' },
                { front: 'el aeropuerto', back: 'Flughafen', partOfSpeech: 'Nomen', exampleSentence: 'El aeropuerto está lejos.' },
                { front: 'la biblioteca', back: 'Bibliothek', partOfSpeech: 'Nomen', exampleSentence: 'Estudio en la biblioteca.' },
                { front: 'el museo', back: 'Museum', partOfSpeech: 'Nomen', exampleSentence: 'El museo abre los martes.' },
                { front: 'la derecha', back: 'rechts', partOfSpeech: 'Nomen', exampleSentence: 'Gira a la derecha.' },
                { front: 'la izquierda', back: 'links', partOfSpeech: 'Nomen', exampleSentence: 'El banco está a la izquierda.' },
                { front: 'cerca', back: 'nah / in der Nähe', partOfSpeech: 'Adverb', exampleSentence: 'La farmacia está cerca.' },
                { front: 'lejos', back: 'weit / fern', partOfSpeech: 'Adverb', exampleSentence: 'El aeropuerto está lejos del centro.' },
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
                title: 'Estar + Gefühl — Wie es mir geht',
                explanation: 'Gefühle/Zustände mit „estar": „Estoy contento." (Ich bin zufrieden.) „Estoy cansado." (Ich bin müde.) Frage: „¿Cómo estás?"',
                examples: ['Estoy muy contento.', '¿Cómo estás? — Estoy bien.', 'Ella está triste hoy.'],
            },
            items: [
                { front: 'contento', back: 'zufrieden / froh', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy muy contento.' },
                { front: 'triste', back: 'traurig', partOfSpeech: 'Adjektiv', exampleSentence: 'Ella está triste.' },
                { front: 'cansado', back: 'müde', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy muy cansado.' },
                { front: 'preocupado', back: 'besorgt', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy preocupado por el examen.' },
                { front: 'nervioso', back: 'nervös', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy nervioso antes del examen.' },
                { front: 'aburrido', back: 'gelangweilt', partOfSpeech: 'Adjektiv', exampleSentence: 'La película es aburrida.' },
                { front: 'sorprendido', back: 'überrascht', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy sorprendido por la noticia.' },
                { front: 'enfadado', back: 'wütend / verärgert', partOfSpeech: 'Adjektiv', exampleSentence: 'Mi padre está enfadado.' },
                { front: 'creer', back: 'glauben / denken', partOfSpeech: 'Verb', exampleSentence: 'Creo que tienes razón.' },
                { front: 'pensar', back: 'denken / nachdenken', partOfSpeech: 'Verb', exampleSentence: '¿Qué piensas de esto?' },
                { front: 'entender', back: 'verstehen', partOfSpeech: 'Verb', exampleSentence: 'No entiendo la pregunta.' },
                { front: 'saber', back: 'wissen', partOfSpeech: 'Verb', exampleSentence: '¿Sabes dónde está el banco?' },
                { front: 'poder', back: 'können', partOfSpeech: 'Verb', exampleSentence: '¿Puedes ayudarme?' },
                { front: 'necesitar', back: 'brauchen', partOfSpeech: 'Verb', exampleSentence: 'Necesito tu ayuda.' },
            ],
        },
    ],
}
