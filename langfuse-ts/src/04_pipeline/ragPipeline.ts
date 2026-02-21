/**
 * Lernziele:
 * - Eine einfache RAG-Pipeline (Retrieval-Augmented Generation) aufbauen
 * - Keyword-basiertes Retrieval ohne Vektor-Datenbank implementieren
 * - Jeden Pipeline-Schritt einzeln in Langfuse tracen (Retrieval, Augmentation, Generation)
 * - Nested Spans für mehrstufige Pipelines nutzen
 *
 * Voraussetzungen: .env mit LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
 *                  LM Studio läuft auf http://localhost:1234/v1 mit Qwen3
 */

import Langfuse from "langfuse";
import OpenAI from "openai";
import "dotenv/config";

// Knowledge base: short text collection about AI
const DOCUMENTS: string[] = [
  "Künstliche Intelligenz (KI) ist ein Teilgebiet der Informatik, das sich mit der " +
    "Automatisierung intelligenten Verhaltens befasst.",
  "Machine Learning ist eine Methode der KI, bei der Algorithmen aus Daten lernen, " +
    "anstatt explizit programmiert zu werden.",
  "Deep Learning nutzt künstliche neuronale Netze mit vielen Schichten, um komplexe " +
    "Muster in großen Datenmengen zu erkennen.",
  "Natural Language Processing (NLP) ermöglicht es Computern, menschliche Sprache " +
    "zu verstehen, zu interpretieren und zu generieren.",
  "Reinforcement Learning ist ein Lernparadigma, bei dem ein Agent durch Versuch " +
    "und Irrtum in einer Umgebung optimale Strategien erlernt.",
];

function createLangfuseClient(): Langfuse {
  return new Langfuse();
}

function createLmStudioClient(): OpenAI {
  const baseURL = process.env.LM_STUDIO_BASE_URL ?? "http://localhost:1234/v1";
  return new OpenAI({ baseURL, apiKey: "lm-studio" });
}

// Simple keyword-based retrieval: score documents by keyword overlap
function retrieve(
  query: string,
  documents: string[],
  topK: number = 2
): string[] {
  const queryWords = new Set(query.toLowerCase().split(/\s+/));

  const scored: [number, string][] = documents.map((doc) => {
    const docWords = new Set(doc.toLowerCase().split(/\s+/));
    let overlap = 0;
    for (const word of queryWords) {
      if (docWords.has(word)) overlap++;
    }
    return [overlap, doc];
  });

  scored.sort((a, b) => b[0] - a[0]);
  return scored
    .filter(([score]) => score > 0)
    .slice(0, topK)
    .map(([, doc]) => doc);
}

// Build an augmented prompt from the query and retrieved chunks
function augmentPrompt(query: string, chunks: string[]): string {
  const context = chunks.map((chunk) => `- ${chunk}`).join("\n\n");
  return (
    "Beantworte die folgende Frage basierend auf dem gegebenen Kontext.\n" +
    "Nutze nur Informationen aus dem Kontext. " +
    "Wenn der Kontext die Frage nicht beantwortet, sage das ehrlich.\n\n" +
    `Kontext:\n${context}\n\n` +
    `Frage: ${query}`
  );
}

async function main(): Promise<void> {
  const langfuse = createLangfuseClient();
  const client = createLmStudioClient();
  const model = process.env.LM_STUDIO_MODEL ?? "qwen3";

  const query =
    "Was ist Machine Learning und wie unterscheidet es sich von Deep Learning?";
  console.log(`Frage: ${query}\n`);

  // -- Root trace for the RAG pipeline --
  const trace = langfuse.trace({
    name: "rag-pipeline",
    input: { query, num_documents: DOCUMENTS.length },
  });

  // -- Step 1: Retrieval --
  const retrievalSpan = trace.span({
    name: "retrieval",
    input: { query, top_k: 2 },
  });

  const chunks = retrieve(query, DOCUMENTS, 2);

  retrievalSpan.end({
    output: { chunks, num_found: chunks.length },
  });

  console.log(`Gefundene Chunks (${chunks.length}):`);
  chunks.forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.substring(0, 80)}...`);
  });
  console.log();

  // -- Step 2: Augmentation --
  const augmentationSpan = trace.span({
    name: "augmentation",
    input: { query, chunks },
  });

  const augmentedPrompt = augmentPrompt(query, chunks);

  augmentationSpan.end({ output: { augmented_prompt: augmentedPrompt } });

  console.log(`Augmentierter Prompt:\n${augmentedPrompt}\n`);

  // -- Step 3: Generation --
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: augmentedPrompt },
  ];

  const generation = trace.generation({
    name: "llm-call",
    model,
    input: messages,
    modelParameters: { temperature: 0.3, max_tokens: 512 },
  });

  let response: OpenAI.Chat.ChatCompletion;
  try {
    response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 512,
    });
  } catch (e) {
    generation.end({ output: `Fehler: ${e}` });
    await langfuse.flushAsync();
    console.error(
      `Fehler bei der Verbindung zu LM Studio: ${e}\n` +
        "Stelle sicher, dass LM Studio läuft."
    );
    process.exit(1);
  }

  const answer = response.choices[0].message.content!;
  const usage = response.usage;

  const usageDetails: Record<string, number> = {};
  if (usage) {
    usageDetails.input = usage.prompt_tokens;
    usageDetails.output = usage.completion_tokens;
    usageDetails.total = usage.total_tokens;
  }

  generation.end({ output: answer, usageDetails });

  // -- End trace --
  trace.update({
    output: {
      answer,
      chunks_used: chunks.length,
    },
  });
  await langfuse.flushAsync();

  console.log(`Antwort:\n${answer}\n`);

  if (Object.keys(usageDetails).length > 0) {
    console.log(
      `Token-Verbrauch: ${usageDetails.input ?? "?"} input, ` +
        `${usageDetails.output ?? "?"} output`
    );
  }

  const traceUrl = trace.getTraceUrl();
  console.log(`\nTrace in Langfuse: ${traceUrl}`);

  await langfuse.shutdownAsync();
}

main();
