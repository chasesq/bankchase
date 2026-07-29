import { streamText } from 'ai';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY environment variable is not set');
  }

  console.log('Starting AI Gateway text generation example...\n');

  try {
    const result = await streamText({
      model: 'openai/gpt-4o',
      system: 'You are a helpful assistant.',
      prompt: 'What are the key benefits of using AI in software development? Please provide a concise answer.',
      baseURL: 'https://api.vercel.ai/v1',
      apiKey: apiKey,
    });

    console.log('Response:');
    console.log('----------');

    // Stream the text and collect it
    let fullText = '';
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
      fullText += chunk;
    }

    console.log('\n----------\n');

    // Log token usage after streaming is complete
    const finalResult = await result;
    console.log('\nToken Usage:');
    console.log(`- Input tokens: ${finalResult.usage.inputTokens}`);
    console.log(`- Output tokens: ${finalResult.usage.outputTokens}`);
    console.log(`- Total tokens: ${finalResult.usage.inputTokens + finalResult.usage.outputTokens}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

main();
