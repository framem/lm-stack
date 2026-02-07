import { generateText } from 'ai';
import { getModel } from '@/src/lib/llm';

export async function GET() {
  const { text } = await generateText({
    model: getModel(),
    temperature: 0,
    seed: 123,
    prompt: 'Erkläre in einem Satz, was Docker ist.',
  });

  console.log(text);

  return Response.json({ text });
}
