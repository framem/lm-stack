import { ollama } from 'ai-sdk-ollama';
import { generateText } from 'ai';

export async function GET() {
  const { text } = await generateText({
    model: ollama('qwen3:8b', {
      options: {
        num_ctx: 2048,
      },
    }),
    temperature: 0,
    seed: 123,
    prompt: 'Erkläre in einem Satz, was Docker ist.',
  });

  console.log(text);

  return Response.json({ text });
}
