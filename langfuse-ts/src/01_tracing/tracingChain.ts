/**
 * Lernziele:
 * - Eine mehrstufige Verarbeitungskette (Chain) mit Langfuse tracen
 * - Nested Spans (Parent-Child-Beziehungen) verstehen und anwenden
 * - Input/Output jedes Verarbeitungsschritts separat loggen
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

// Normalize input: strip whitespace and lowercase
function preprocess(text: string): string {
  return text.trim().toLowerCase();
}

// Extract the first line of the LLM response
function postprocess(text: string): string {
  return text.trim().split("\n")[0];
}

async function main(): Promise<void> {
  const langfuse = createLangfuseClient();
  const client = createLmStudioClient();
  const model = process.env.LM_STUDIO_MODEL ?? "qwen3";

  const rawInput = "  Was sind die DREI wichtigsten Programmiersprachen?  ";
  console.log(`Rohe Eingabe: '${rawInput}'\n`);

  // -- Root trace for the entire chain --
  const trace = langfuse.trace({
    name: "processing-chain",
    input: { raw_input: rawInput },
    metadata: { steps: ["input-processing", "llm-call", "output-processing"] },
  });

  // -- Step 1: Input processing (child span) --
  const inputSpan = trace.span({
    name: "input-processing",
    input: { raw: rawInput },
  });
  const processedInput = preprocess(rawInput);
  inputSpan.end({ output: { processed: processedInput } });
  console.log(`Nach Vorverarbeitung: '${processedInput}'`);

  // -- Step 2: LLM call (generation inside trace) --
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: processedInput },
  ];

  const generation = trace.generation({
    name: "llm-call",
    model,
    input: messages,
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

  const llmOutput = response.choices[0].message.content!;
  const usage = response.usage;

  const usageDetails: Record<string, number> = {};
  if (usage) {
    usageDetails.input = usage.prompt_tokens;
    usageDetails.output = usage.completion_tokens;
    usageDetails.total = usage.total_tokens;
  }

  generation.end({ output: llmOutput, usageDetails });
  console.log(`\nLLM-Antwort (vollständig):\n${llmOutput}\n`);

  // -- Step 3: Output processing (child span) --
  const outputSpan = trace.span({
    name: "output-processing",
    input: { full_response: llmOutput },
  });
  const finalOutput = postprocess(llmOutput);
  outputSpan.end({ output: { first_line: finalOutput } });

  // -- End trace --
  trace.update({ output: { final_output: finalOutput } });
  await langfuse.flushAsync();

  console.log(`Ergebnis (erste Zeile): '${finalOutput}'`);

  const traceUrl = trace.getTraceUrl();
  console.log(`\nTrace in Langfuse: ${traceUrl}`);

  await langfuse.shutdownAsync();
}

main();
