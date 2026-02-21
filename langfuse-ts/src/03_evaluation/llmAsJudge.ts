/**
 * Lernziele:
 * - LLM-Antworten automatisch mit einem zweiten LLM bewerten (LLM-as-Judge)
 * - Scores aus der Judge-Antwort parsen und validieren
 * - Bewertungen als Scores in Langfuse-Traces loggen
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

// Send a chat completion request to LM Studio
async function callLlm(
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 512,
    });
    return response.choices[0].message.content!;
  } catch (e) {
    console.error(
      `Fehler bei der Verbindung zu LM Studio: ${e}\n` +
        "Stelle sicher, dass LM Studio läuft und ein Modell geladen ist."
    );
    process.exit(1);
  }
}

// Extract a numeric score (1-10) from the judge response
function parseScore(judgeResponse: string): number | null {
  const matches = judgeResponse.match(/\b(10|[1-9])\b/g);
  if (matches && matches.length > 0) {
    return parseFloat(matches[0]);
  }
  return null;
}

async function main(): Promise<void> {
  const langfuse = createLangfuseClient();
  const client = createLmStudioClient();
  const model = process.env.LM_STUDIO_MODEL ?? "qwen3";

  const question =
    "Erkläre den Unterschied zwischen Supervised und Unsupervised Learning.";

  console.log(`Frage: ${question}\n`);

  // -- Root trace --
  const trace = langfuse.trace({
    name: "llm-as-judge",
    input: { question },
    metadata: { evaluation_method: "llm-as-judge" },
  });

  // -- Step 1: Generate an answer --
  const genSpan = trace.generation({
    name: "answer-generation",
    model,
    input: [{ role: "user", content: question }],
  });

  const answer = await callLlm(client, model, [
    { role: "user", content: question },
  ]);
  genSpan.end({ output: answer });

  console.log(`Antwort: ${answer}\n`);

  // -- Step 2: Judge the answer with a second LLM call --
  const judgePrompt =
    "Du bist ein strenger Qualitätsprüfer für KI-Antworten.\n\n" +
    `Frage: ${question}\n\n` +
    `Antwort: ${answer}\n\n` +
    "Bewerte die Qualität der Antwort auf einer Skala von 1 bis 10.\n" +
    "Kriterien: Korrektheit, Vollständigkeit, Verständlichkeit.\n" +
    "Antworte NUR mit einer einzigen Zahl zwischen 1 und 10.";

  const judgeGen = trace.generation({
    name: "judge-evaluation",
    model,
    input: [{ role: "user", content: judgePrompt }],
    metadata: { role: "judge" },
  });

  const judgeResponse = await callLlm(client, model, [
    { role: "user", content: judgePrompt },
  ]);
  judgeGen.end({ output: judgeResponse });

  // -- Step 3: Parse and log the score --
  const score = parseScore(judgeResponse);

  if (score !== null) {
    const normalizedScore = score / 10.0;
    langfuse.score({
      traceId: trace.id,
      name: "quality",
      value: normalizedScore,
      comment: `LLM-as-Judge Rohwert: ${score}/10`,
    });
  }

  trace.update({
    output: {
      answer,
      judge_response: judgeResponse,
      score,
    },
  });
  await langfuse.flushAsync();

  // -- Step 4: Display results --
  console.log("\n--- Bewertungsergebnis ---");
  console.log(`Judge-Antwort (roh):    ${judgeResponse.trim()}`);
  console.log(
    `Erkannter Score:        ${score !== null ? `${score}/10` : "Nicht erkannt"}`
  );
  console.log(
    `Normalisierter Score:   ${score !== null ? (score / 10).toFixed(1) : "N/A"}`
  );

  const traceUrl = trace.getTraceUrl();
  console.log(`Langfuse Trace:         ${traceUrl}`);

  await langfuse.shutdownAsync();
}

main();
