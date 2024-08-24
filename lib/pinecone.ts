import { Pinecone } from '@pinecone-database/pinecone';

const pineconeApiKey = process.env.PINECONE_API_KEY;

if (!pineconeApiKey) {
  throw new Error("PINECONE_API_KEY environment variable is not set");
}

const pinecone = new Pinecone({
  apiKey: pineconeApiKey,
});

export { pinecone }

export async function insertProfessorData(professorName: string, embedding: number[], overallQuality: string, difficulty: string, retakePercentage: string, department: string) {
  const index = pinecone.Index('professor-index'); // Replace with your actual index name

  const vectors = [{
    id: professorName,
    values: embedding,
    metadata: {
      name: professorName,
      department: department,
      difficulty: difficulty,          // Store difficulty separately
      overallQuality: overallQuality,  // Store overall quality separately
      retakePercentage: retakePercentage, // Store retake percentage separately
    },
  }];

  await index.upsert(vectors); // Use your Pinecone namespace, if applicable
}
