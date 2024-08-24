import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { pinecone } from '../../../lib/pinecone';

type RecordMetadata = {
  name?: string;
  department?: string;
  overallQuality?: string;
  difficulty?: string;
  retakePercentage?: string;
};

type ScoredPineconeRecord<T = RecordMetadata> = {
  id: string;
  score?: number;  // score is now optional
  metadata?: T;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
  }

  try {
    // Query Pinecone to find relevant data
    const index = pinecone.Index('professor-index');
    
    const queryResponse = await index.query({
      topK: 10,  // Get the top 10 results for now, you can increase this if needed
      vector: await getEmbedding(prompt),  // Get embedding for the user prompt
      includeMetadata: true,
    });

    const pineconeData = queryResponse.matches.map((match: ScoredPineconeRecord<RecordMetadata>) => match.metadata || {});

    // Incorporate Pinecone data into the prompt
    let context = 'Here is some information on the professors:\n\n';
    pineconeData.forEach((data, idx) => {
      if (data && Object.keys(data).length > 0) {  // Ensure data is defined and not empty
        context += `Professor ${idx + 1}:\n`;
        context += `Name: ${data.name}\n`;
        context += `Department: ${data.department}\n`;
        context += `Overall Quality: ${data.overallQuality}\n`;
        context += `Difficulty: ${data.difficulty}\n`;
        context += `Retake Percentage: ${data.retakePercentage}\n\n`;
      }
    });

    // Generate the response using OpenAI, including the context from Pinecone
    const response = await openai.chat.completions.create({
      model: 'gpt-4',  // Use the correct model for chat completions
      messages: [
        { role: 'system', content: 'You are an AI assistant that helps students choose professors based on reviews.' },
        { role: 'user', content: `${context}\n${prompt}` }
      ],
      max_tokens: 500,
    });

    const messageContent = response.choices[0]?.message?.content?.trim();

    if (!messageContent) {
      throw new Error('Failed to generate a valid response from OpenAI.');
    }

    return NextResponse.json({ message: messageContent });
  } catch (error) {
    console.error('Error generating response:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

// Function to get the embedding for the user's prompt
async function getEmbedding(text: string): Promise<number[]> {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });

  return embeddingResponse.data[0].embedding;
}
