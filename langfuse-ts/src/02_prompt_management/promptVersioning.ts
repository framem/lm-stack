/**
 * Lernziele:
 * - Prompts in Langfuse erstellen und versionieren
 * - Prompts mit Labels (z.B. "production") abrufen
 * - Prompt-Variablen mit compile() einsetzen
 * - Versionierte Prompts für LLM-Calls verwenden
 *
 * Voraussetzungen: .env mit LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
 *                  LM Studio läuft auf http://localhost:1234/v1 mit Qwen3
 */

import Langfuse from "langfuse";
import OpenAI from "openai";
import "dotenv/config";

function createLangfuseClient(): Langfuse {
  return new Langfuse();
}

function createLmStudioClient(): OpenAI {
  const baseURL = process.env.LM_STUDIO_BASE_URL ?? "http://localhost:1234/v1";
  return new OpenAI({ baseURL, apiKey: "lm-studio" });
}

async function main(): Promise<void> {
  const langfuse = createLangfuseClient();
  const client = createLmStudioClient();
  const model = process.env.LM_STUDIO_MODEL ?? "qwen3";

  // -- Step 1: Create a prompt template in Langfuse --
  const promptName = "erklaer-konzept";
  const promptTemplate =
    "Erkläre das Konzept '{{concept}}' für eine Zielgruppe: {{audience}}. " +
    "Halte die Erklärung auf {{length}} Sätze begrenzt.";

  console.log("Erstelle Prompt-Template in Langfuse...");
  await langfuse.createPrompt({
    name: promptName,
    prompt: promptTemplate,
    labels: ["production"],
    config: { temperature: 0.7, max_tokens: 256 },
  });
  console.log(`  Name: ${promptName}`);
  console.log(`  Template: ${promptTemplate}`);
  console.log("  Labels: ['production']");

  // -- Step 2: Fetch the prompt from Langfuse by label --
  console.log("\nRufe Prompt von Langfuse ab (Label: 'production')...");
  const fetchedPrompt = await langfuse.getPrompt(promptName, undefined, {
    label: "production",
  });
  console.log(`  Abgerufener Prompt: ${fetchedPrompt.prompt}`);

  // -- Step 3: Compile the prompt with variables --
  const compiled = fetchedPrompt.compile({
    concept: "Neuronale Netze",
    audience: "Programmier-Anfänger",
    length: "3",
  });
  console.log(`\nKompilierter Prompt:\n  ${compiled}\n`);

  // -- Step 4: Use compiled prompt for LLM call with tracing --
  const trace = langfuse.trace({
    name: "prompt-versioning-demo",
    input: { prompt_name: promptName, compiled_prompt: compiled },
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: compiled as string },
  ];

  const generation = trace.generation({
    name: "qwen3-response",
    model,
    input: messages,
    prompt: fetchedPrompt, // Links generation to the Langfuse prompt version
    modelParameters: { temperature: 0.7, max_tokens: 256 },
  });

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
  trace.update({ output: { answer } });
  await langfuse.flushAsync();

  console.log(`Antwort:\n  ${answer}\n`);

  const traceUrl = trace.getTraceUrl();
  console.log(`Trace in Langfuse: ${traceUrl}`);

  await langfuse.shutdownAsync();
}

main();
