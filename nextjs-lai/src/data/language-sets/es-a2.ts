import type { LanguageSet } from './types'

export const esA2: LanguageSet = {
    id: 'es-a2',
    title: 'Spanisch A2 Aufbauwortschatz',
    subject: 'Spanisch',
    description: 'Spanische Vokabeln für fortgeschrittene Anfänger — Alltag, Gesundheit, Freizeit und mehr. Orientiert am Plan Curricular del Instituto Cervantes (PCIC) A2.',
    level: 'A2',
    categories: [
        // ── 1. Familie & Zeit ──
        {
            name: 'Familie & Zeit',
            items: [
                { front: 'la tía', back: 'Tante', partOfSpeech: 'Nomen', exampleSentence: 'Mi tía nos visita cada domingo.' },
                { front: 'el tío', back: 'Onkel', partOfSpeech: 'Nomen', exampleSentence: 'Mi tío tiene un coche grande.' },
                { front: 'el primo / la prima', back: 'Cousin / Cousine', partOfSpeech: 'Nomen', exampleSentence: 'Mi prima vive en Madrid.' },
                { front: 'el marido', back: 'Ehemann', partOfSpeech: 'Nomen', exampleSentence: 'Su marido trabaja en un banco.' },
                { front: 'la mujer', back: 'Ehefrau / Frau', partOfSpeech: 'Nomen', exampleSentence: 'Su mujer es médica.' },
                { front: 'el cumpleaños', back: 'Geburtstag', partOfSpeech: 'Nomen', exampleSentence: 'Mañana es mi cumpleaños.' },
                { front: 'la noche', back: 'Nacht', partOfSpeech: 'Nomen', exampleSentence: 'La noche es oscura y tranquila.' },
                { front: 'el fin de semana', back: 'Wochenende', partOfSpeech: 'Nomen', exampleSentence: 'El fin de semana voy al campo.' },
                { front: 'antes', back: 'vorher / früher', partOfSpeech: 'Adverb', exampleSentence: 'Antes vivía en el campo.' },
                { front: 'después', back: 'danach / später', partOfSpeech: 'Adverb', exampleSentence: 'Después del trabajo, voy al gimnasio.' },
            ],
        },

        // ── 2. Essen & Küche ──
        {
            name: 'Essen & Küche',
            items: [
                { front: 'el queso', back: 'Käse', partOfSpeech: 'Nomen', exampleSentence: 'Este queso es de España.' },
                { front: 'el azúcar', back: 'Zucker', partOfSpeech: 'Nomen', exampleSentence: 'Pongo azúcar en el café.' },
                { front: 'la sopa', back: 'Suppe', partOfSpeech: 'Nomen', exampleSentence: 'La sopa está caliente.' },
                { front: 'la ensalada', back: 'Salat', partOfSpeech: 'Nomen', exampleSentence: 'Como una ensalada al mediodía.' },
                { front: 'la fruta', back: 'Obst', partOfSpeech: 'Nomen', exampleSentence: 'Como fruta todos los días.' },
                { front: 'la verdura', back: 'Gemüse', partOfSpeech: 'Nomen', exampleSentence: 'Las verduras son muy sanas.' },
                { front: 'la carne', back: 'Fleisch', partOfSpeech: 'Nomen', exampleSentence: 'No como mucha carne.' },
                { front: 'el desayuno', back: 'Frühstück', partOfSpeech: 'Nomen', exampleSentence: 'Desayuno a las siete.' },
                { front: 'el almuerzo', back: 'Mittagessen', partOfSpeech: 'Nomen', exampleSentence: 'El almuerzo es a las dos.' },
                { front: 'la cena', back: 'Abendessen', partOfSpeech: 'Nomen', exampleSentence: 'Cenamos juntos en familia.' },
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
                { front: 'la camiseta', back: 'T-Shirt', partOfSpeech: 'Nomen', exampleSentence: 'Llevo una camiseta azul.' },
            ],
        },

        // ── 4. Haus & Wohnung ──
        {
            name: 'Haus & Wohnung',
            items: [
                { front: 'el dormitorio', back: 'Schlafzimmer', partOfSpeech: 'Nomen', exampleSentence: 'El dormitorio tiene una ventana grande.' },
                { front: 'el salón', back: 'Wohnzimmer', partOfSpeech: 'Nomen', exampleSentence: 'Vemos la tele en el salón.' },
                { front: 'la puerta', back: 'Tür', partOfSpeech: 'Nomen', exampleSentence: 'Por favor, cierra la puerta.' },
                { front: 'la ventana', back: 'Fenster', partOfSpeech: 'Nomen', exampleSentence: 'Abre la ventana, por favor.' },
                { front: 'la silla', back: 'Stuhl', partOfSpeech: 'Nomen', exampleSentence: 'Por favor, siéntate en la silla.' },
                { front: 'la lámpara', back: 'Lampe', partOfSpeech: 'Nomen', exampleSentence: 'Enciende la lámpara, por favor.' },
                { front: 'el armario', back: 'Schrank', partOfSpeech: 'Nomen', exampleSentence: 'La ropa está en el armario.' },
                { front: 'el frigorífico', back: 'Kühlschrank', partOfSpeech: 'Nomen', exampleSentence: 'Pon la leche en el frigorífico.' },
                { front: 'el suelo', back: 'Boden / Stockwerk', partOfSpeech: 'Nomen', exampleSentence: 'El suelo está limpio.' },
            ],
        },

        // ── 5. Wetter & Natur ──
        {
            name: 'Wetter & Natur',
            items: [
                { front: 'la nieve', back: 'Schnee', partOfSpeech: 'Nomen', exampleSentence: 'A los niños les gusta la nieve.' },
                { front: 'la nube', back: 'Wolke', partOfSpeech: 'Nomen', exampleSentence: 'Hay muchas nubes en el cielo.' },
                { front: 'la tormenta', back: 'Sturm', partOfSpeech: 'Nomen', exampleSentence: 'Hubo una gran tormenta anoche.' },
                { front: 'el cielo', back: 'Himmel', partOfSpeech: 'Nomen', exampleSentence: 'El cielo está azul y despejado.' },
                { front: 'el mar', back: 'Meer', partOfSpeech: 'Nomen', exampleSentence: 'Me gusta nadar en el mar.' },
                { front: 'la montaña', back: 'Berg', partOfSpeech: 'Nomen', exampleSentence: 'La montaña está cubierta de nieve.' },
                { front: 'el río', back: 'Fluss', partOfSpeech: 'Nomen', exampleSentence: 'El río pasa por la ciudad.' },
                { front: 'caliente', back: 'warm / heiß', partOfSpeech: 'Adjektiv', exampleSentence: 'Hace calor en verano.' },
                { front: 'frío', back: 'kalt', partOfSpeech: 'Adjektiv', exampleSentence: 'Hace mucho frío fuera.' },
            ],
        },

        // ── 6. Körper & Gesundheit ──
        {
            name: 'Körper & Gesundheit',
            items: [
                { front: 'la cabeza', back: 'Kopf', partOfSpeech: 'Nomen', exampleSentence: 'Me duele la cabeza.' },
                { front: 'el brazo', back: 'Arm', partOfSpeech: 'Nomen', exampleSentence: 'Me rompí el brazo.' },
                { front: 'la pierna', back: 'Bein', partOfSpeech: 'Nomen', exampleSentence: 'Me duele la pierna derecha.' },
                { front: 'el ojo', back: 'Auge', partOfSpeech: 'Nomen', exampleSentence: 'Tiene los ojos azules.' },
                { front: 'el hospital', back: 'Krankenhaus', partOfSpeech: 'Nomen', exampleSentence: 'El hospital está cerca del centro.' },
                { front: 'la medicina', back: 'Medikament', partOfSpeech: 'Nomen', exampleSentence: 'Tomo esta medicina dos veces al día.' },
                { front: 'enfermo', back: 'krank', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy enfermo y no puedo trabajar.' },
                { front: 'sano', back: 'gesund', partOfSpeech: 'Adjektiv', exampleSentence: 'Como bien para estar sano.' },
                { front: 'el dolor', back: 'Schmerz', partOfSpeech: 'Nomen', exampleSentence: 'Tengo dolor de estómago.' },
            ],
        },

        // ── 7. Hobbys & Freizeit ──
        {
            name: 'Hobbys & Freizeit',
            items: [
                { front: 'el deporte', back: 'Sport', partOfSpeech: 'Nomen', exampleSentence: 'Hago deporte tres veces a la semana.' },
                { front: 'el fútbol', back: 'Fußball', partOfSpeech: 'Nomen', exampleSentence: 'Juego al fútbol los sábados.' },
                { front: 'la música', back: 'Musik', partOfSpeech: 'Nomen', exampleSentence: 'Me gusta mucho la música.' },
                { front: 'el cine', back: 'Kino', partOfSpeech: 'Nomen', exampleSentence: 'Vamos al cine los viernes.' },
                { front: 'el teatro', back: 'Theater', partOfSpeech: 'Nomen', exampleSentence: 'Fui al teatro el sábado.' },
                { front: 'la playa', back: 'Strand', partOfSpeech: 'Nomen', exampleSentence: 'En verano vamos a la playa.' },
                { front: 'el viaje', back: 'Reise', partOfSpeech: 'Nomen', exampleSentence: 'El viaje a París fue increíble.' },
                { front: 'la foto', back: 'Foto', partOfSpeech: 'Nomen', exampleSentence: 'Saco muchas fotos en vacaciones.' },
            ],
        },

        // ── 8. Berufe & Arbeit ──
        {
            name: 'Berufe & Arbeit',
            items: [
                { front: 'el profesor / la profesora', back: 'Lehrer / Lehrerin', partOfSpeech: 'Nomen', exampleSentence: 'Mi profesora de español es muy simpática.' },
                { front: 'el médico / la médica', back: 'Arzt / Ärztin', partOfSpeech: 'Nomen', exampleSentence: 'El médico me recetó antibióticos.' },
                { front: 'el enfermero / la enfermera', back: 'Krankenpfleger/-schwester', partOfSpeech: 'Nomen', exampleSentence: 'La enfermera es muy amable.' },
                { front: 'el cocinero / la cocinera', back: 'Koch / Köchin', partOfSpeech: 'Nomen', exampleSentence: 'El cocinero prepara platos deliciosos.' },
                { front: 'el policía', back: 'Polizist', partOfSpeech: 'Nomen', exampleSentence: 'El policía nos ayudó a encontrar el camino.' },
                { front: 'la oficina', back: 'Büro', partOfSpeech: 'Nomen', exampleSentence: 'Trabajo en una oficina en el centro.' },
                { front: 'la reunión', back: 'Besprechung / Treffen', partOfSpeech: 'Nomen', exampleSentence: 'Tengo una reunión a las diez.' },
            ],
        },

        // ── 9. Transport & Reise ──
        {
            name: 'Transport & Reise',
            items: [
                { front: 'el aeropuerto', back: 'Flughafen', partOfSpeech: 'Nomen', exampleSentence: 'El aeropuerto está a veinte kilómetros.' },
                { front: 'el avión', back: 'Flugzeug', partOfSpeech: 'Nomen', exampleSentence: 'Viajamos en avión a México.' },
                { front: 'el billete', back: 'Fahrkarte / Ticket', partOfSpeech: 'Nomen', exampleSentence: 'Compré el billete de tren en internet.' },
                { front: 'la maleta', back: 'Koffer', partOfSpeech: 'Nomen', exampleSentence: 'Mi maleta es muy pesada.' },
                { front: 'el hotel', back: 'Hotel', partOfSpeech: 'Nomen', exampleSentence: 'El hotel está cerca de la playa.' },
                { front: 'la calle', back: 'Straße', partOfSpeech: 'Nomen', exampleSentence: 'La calle está muy tranquila.' },
                { front: 'el mapa', back: 'Karte / Plan', partOfSpeech: 'Nomen', exampleSentence: 'Necesito un mapa de la ciudad.' },
            ],
        },

        // ── 10. Gefühle & Eigenschaften ──
        {
            name: 'Gefühle & Eigenschaften',
            items: [
                { front: 'contento', back: 'zufrieden / froh', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy muy contento con mi trabajo.' },
                { front: 'triste', back: 'traurig', partOfSpeech: 'Adjektiv', exampleSentence: 'Estaba triste cuando se fue.' },
                { front: 'cansado', back: 'müde', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy muy cansado después del trabajo.' },
                { front: 'nervioso', back: 'nervös', partOfSpeech: 'Adjektiv', exampleSentence: 'Estoy nervioso antes del examen.' },
                { front: 'simpático', back: 'sympathisch / nett', partOfSpeech: 'Adjektiv', exampleSentence: 'Mi vecino es muy simpático.' },
                { front: 'inteligente', back: 'intelligent / klug', partOfSpeech: 'Adjektiv', exampleSentence: 'Es una estudiante muy inteligente.' },
                { front: 'tranquilo', back: 'ruhig / entspannt', partOfSpeech: 'Adjektiv', exampleSentence: 'Hay que estar tranquilo en el examen.' },
                { front: 'amable', back: 'freundlich / liebenswürdig', partOfSpeech: 'Adjektiv', exampleSentence: 'La recepcionista es muy amable.' },
            ],
        },

        // ── 11. Adjektive & Adverbien ──
        {
            name: 'Adjektive & Adverbien',
            items: [
                { front: 'mucho', back: 'viel', partOfSpeech: 'Adverb', exampleSentence: 'Hay mucho trabajo hoy.' },
                { front: 'poco', back: 'wenig', partOfSpeech: 'Adverb', exampleSentence: 'Hablo poco español.' },
                { front: 'bastante', back: 'ziemlich / genug', partOfSpeech: 'Adverb', exampleSentence: 'El hotel es bastante cómodo.' },
                { front: 'demasiado', back: 'zu viel / zu sehr', partOfSpeech: 'Adverb', exampleSentence: 'Este abrigo es demasiado caro.' },
                { front: 'todavía', back: 'noch / immer noch', partOfSpeech: 'Adverb', exampleSentence: 'Todavía estudio español.' },
                { front: 'ya', back: 'schon / bereits', partOfSpeech: 'Adverb', exampleSentence: '¿Ya has comido?' },
                { front: 'cerca', back: 'nah / in der Nähe', partOfSpeech: 'Adverb', exampleSentence: 'La tienda está cerca de aquí.' },
                { front: 'lejos', back: 'weit / entfernt', partOfSpeech: 'Adverb', exampleSentence: 'El aeropuerto está lejos del centro.' },
            ],
        },

        // ── 12. Verben ──
        {
            name: 'Verben',
            items: [
                {
                    front: 'poder',
                    back: 'können / dürfen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'No puedo venir mañana.',
                    conjugation: {
                        present: { yo: 'puedo', tú: 'puedes', 'él/ella': 'puede', nosotros: 'podemos', vosotros: 'podéis', ellos: 'pueden' },
                        past: { yo: 'pude', tú: 'pudiste', 'él/ella': 'pudo', nosotros: 'pudimos', vosotros: 'pudisteis', ellos: 'pudieron' },
                    },
                },
                {
                    front: 'querer',
                    back: 'wollen / mögen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Quiero aprender más español.',
                    conjugation: {
                        present: { yo: 'quiero', tú: 'quieres', 'él/ella': 'quiere', nosotros: 'queremos', vosotros: 'queréis', ellos: 'quieren' },
                        past: { yo: 'quise', tú: 'quisiste', 'él/ella': 'quiso', nosotros: 'quisimos', vosotros: 'quisisteis', ellos: 'quisieron' },
                    },
                },
                {
                    front: 'hacer',
                    back: 'machen / tun',
                    partOfSpeech: 'Verb',
                    exampleSentence: '¿Qué haces los fines de semana?',
                    conjugation: {
                        present: { yo: 'hago', tú: 'haces', 'él/ella': 'hace', nosotros: 'hacemos', vosotros: 'hacéis', ellos: 'hacen' },
                        past: { yo: 'hice', tú: 'hiciste', 'él/ella': 'hizo', nosotros: 'hicimos', vosotros: 'hicisteis', ellos: 'hicieron' },
                    },
                },
                {
                    front: 'saber',
                    back: 'wissen / können',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'No sé dónde está mi llave.',
                    conjugation: {
                        present: { yo: 'sé', tú: 'sabes', 'él/ella': 'sabe', nosotros: 'sabemos', vosotros: 'sabéis', ellos: 'saben' },
                        past: { yo: 'supe', tú: 'supiste', 'él/ella': 'supo', nosotros: 'supimos', vosotros: 'supisteis', ellos: 'supieron' },
                    },
                },
                {
                    front: 'salir',
                    back: 'ausgehen / abfahren',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Salgo del trabajo a las seis.',
                    conjugation: {
                        present: { yo: 'salgo', tú: 'sales', 'él/ella': 'sale', nosotros: 'salimos', vosotros: 'salís', ellos: 'salen' },
                        past: { yo: 'salí', tú: 'saliste', 'él/ella': 'salió', nosotros: 'salimos', vosotros: 'salisteis', ellos: 'salieron' },
                    },
                },
                {
                    front: 'llegar',
                    back: 'ankommen / eintreffen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'El tren llega a las ocho.',
                    conjugation: {
                        present: { yo: 'llego', tú: 'llegas', 'él/ella': 'llega', nosotros: 'llegamos', vosotros: 'llegáis', ellos: 'llegan' },
                        past: { yo: 'llegué', tú: 'llegaste', 'él/ella': 'llegó', nosotros: 'llegamos', vosotros: 'llegasteis', ellos: 'llegaron' },
                    },
                },
                {
                    front: 'escribir',
                    back: 'schreiben',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Escribo un correo a mi profesor.',
                    conjugation: {
                        present: { yo: 'escribo', tú: 'escribes', 'él/ella': 'escribe', nosotros: 'escribimos', vosotros: 'escribís', ellos: 'escriben' },
                        past: { yo: 'escribí', tú: 'escribiste', 'él/ella': 'escribió', nosotros: 'escribimos', vosotros: 'escribisteis', ellos: 'escribieron' },
                    },
                },
                {
                    front: 'leer',
                    back: 'lesen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Leo el periódico cada mañana.',
                    conjugation: {
                        present: { yo: 'leo', tú: 'lees', 'él/ella': 'lee', nosotros: 'leemos', vosotros: 'leéis', ellos: 'leen' },
                        past: { yo: 'leí', tú: 'leíste', 'él/ella': 'leyó', nosotros: 'leímos', vosotros: 'leísteis', ellos: 'leyeron' },
                    },
                },
                {
                    front: 'escuchar',
                    back: 'zuhören / hören',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Escucho música cuando cocino.',
                    conjugation: {
                        present: { yo: 'escucho', tú: 'escuchas', 'él/ella': 'escucha', nosotros: 'escuchamos', vosotros: 'escucháis', ellos: 'escuchan' },
                        past: { yo: 'escuché', tú: 'escuchaste', 'él/ella': 'escuchó', nosotros: 'escuchamos', vosotros: 'escuchasteis', ellos: 'escucharon' },
                    },
                },
                {
                    front: 'ver',
                    back: 'sehen / schauen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Veo una película esta noche.',
                    conjugation: {
                        present: { yo: 'veo', tú: 'ves', 'él/ella': 've', nosotros: 'vemos', vosotros: 'veis', ellos: 'ven' },
                        past: { yo: 'vi', tú: 'viste', 'él/ella': 'vio', nosotros: 'vimos', vosotros: 'visteis', ellos: 'vieron' },
                    },
                },
                {
                    front: 'poner',
                    back: 'stellen / legen / setzen',
                    partOfSpeech: 'Verb',
                    exampleSentence: 'Pon la mesa, por favor.',
                    conjugation: {
                        present: { yo: 'pongo', tú: 'pones', 'él/ella': 'pone', nosotros: 'ponemos', vosotros: 'ponéis', ellos: 'ponen' },
                        past: { yo: 'puse', tú: 'pusiste', 'él/ella': 'puso', nosotros: 'pusimos', vosotros: 'pusisteis', ellos: 'pusieron' },
                    },
                },
                {
                    front: 'decir',
                    back: 'sagen / sprechen',
                    partOfSpeech: 'Verb',
                    exampleSentence: '¿Qué dices? No te entiendo.',
                    conjugation: {
                        present: { yo: 'digo', tú: 'dices', 'él/ella': 'dice', nosotros: 'decimos', vosotros: 'decís', ellos: 'dicen' },
                        past: { yo: 'dije', tú: 'dijiste', 'él/ella': 'dijo', nosotros: 'dijimos', vosotros: 'dijisteis', ellos: 'dijeron' },
                    },
                },
            ],
        },
    ],
}
