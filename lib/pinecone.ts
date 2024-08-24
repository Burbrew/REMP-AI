import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '6aab4eb5-7f2f-4974-bee6-c9b2dce09ce2', // Provide a fallback or handle undefined
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
