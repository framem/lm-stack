/**
 * Lernziele:
 * - Langfuse initialisieren und mit Credentials verbinden
 * - Einen einfachen LLM-Call als Trace + Generation loggen
 * - Input, Output, Modell und Token-Usage in Langfuse sichtbar machen
 *
 * Voraussetzungen: .env mit LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
 *                  LM Studio läuft auf http://localhost:1234/v1 mit Qwen3
 */

import Langfuse from "langfuse";
import OpenAI from "openai";
import "dotenv/config";

// Create Langfuse client (reads from env automatically)
function createLangfuseClient(): Langfuse {
  return new Langfuse();
}

// Create OpenAI client pointing to LM Studio
function createLmStudioClient(): OpenAI {
  const baseURL = process.env.LM_STUDIO_BASE_URL ?? "http://localhost:1234/v1";
  return new OpenAI({ baseURL, apiKey: "lm-studio" });
}

async function main(): Promise<void> {
  const langfuse = createLangfuseClient();
  const client = createLmStudioClient();
  const model = process.env.LM_STUDIO_MODEL ?? "qwen3";

  const question = "Was ist maschinelles Lernen? Erkläre es in 2-3 Sätzen.";
  console.log(`Frage: ${question}\n`);

  // -- Step 1: Start a trace --
  const trace = langfuse.trace({
    name: "simple-question",
    input: { question },
  });

  // -- Step 2: Start a generation inside the trace --
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: question },
  ];

  const generation = trace.generation({
    name: "qwen3-response",
    model,
    input: messages,
    modelParameters: { temperature: 0.7, max_tokens: 256 },
  });

  // -- Step 3: Call LM Studio --
  let response: OpenAI.Chat.ChatCompletion;
  try {
    response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 256,
    });
  } catch (e) {
    generation.end({ output: `Fehler: ${e}` });
    await langfuse.flushAsync();
    console.error(
      `Fehler bei der Verbindung zu LM Studio: ${e}\n` +
        "Stelle sicher, dass LM Studio läuft und ein Modell geladen ist."
    );
    process.exit(1);
  }

  const answer = response.choices[0].message.content!;
  const usage = response.usage;

  // -- Step 4: Update generation with output and usage --
  const usageDetails: Record<string, number> = {};
  if (usage) {
    usageDetails.input = usage.prompt_tokens;
    usageDetails.output = usage.completion_tokens;
    usageDetails.total = usage.total_tokens;
  }

  generation.end({ output: answer, usageDetails });

  // -- Step 5: Update trace and flush --
  trace.update({ output: { answer } });
  await langfuse.flushAsync();

  // -- Step 6: Print results --
  console.log(`Antwort: ${answer}\n`);
  if (Object.keys(usageDetails).length > 0) {
    console.log(
      `Token-Verbrauch: ${usageDetails.input ?? "?"} input, ` +
        `${usageDetails.output ?? "?"} output, ` +
        `${usageDetails.total ?? "?"} total`
    );
  }

  const traceUrl = trace.getTraceUrl();
  console.log(`\nTrace in Langfuse: ${traceUrl}`);

  await langfuse.shutdownAsync();
}

main();
