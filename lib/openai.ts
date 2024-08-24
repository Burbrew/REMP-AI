import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return embedding.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embeddings:', error.message);
    throw error;
  }
}

export { openai };
