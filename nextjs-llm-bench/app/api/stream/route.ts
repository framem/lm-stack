// Direct proxy to any OpenAI-compatible endpoint.
// No AI SDK middleware — every token (including <think> blocks) passes through immediately.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { prompt, model, baseURL, apiKey, systemPrompt, temperature, maxTokens } = await req.json();

  const endpoint = (baseURL || process.env.LLM_PROVIDER_URL || "http://localhost:1234/v1")
    .replace(/\/$/, "");
  const resolvedModel = model || process.env.LLM_MODEL || "qwen/qwen3-8b";

  let upstream: Response;
  try {
    upstream = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey || "lm-studio"}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        stream: true,
        max_tokens: maxTokens ?? 2048,
        temperature: temperature ?? 0.7,
      }),
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 });
  }

  if (!upstream.ok) {
    const body = await upstream.text();
    return Response.json({ error: `Upstream ${upstream.status}: ${body.slice(0, 200)}` }, { status: upstream.status });
  }

  // Pipe tokens through as plain text — the client appends each chunk directly
  const encoder = new TextEncoder();
  const upstreamReader = upstream.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await upstreamReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const raw = trimmed.slice(5).trim();
            if (raw === "[DONE]") continue;

            try {
              const chunk = JSON.parse(raw);
              const content: string | undefined = chunk.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch { /* skip malformed lines */ }
          }
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      upstreamReader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
