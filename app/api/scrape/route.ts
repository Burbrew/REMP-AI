import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';
import { insertProfessorData } from '../../../lib/pinecone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { link } = await request.json();

  if (!link) {
    return NextResponse.json({ error: 'No link provided' }, { status: 400 });
  }

  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link, { waitUntil: 'domcontentloaded' });

    // Extract the professor's data using Puppeteer
    const data = await page.evaluate(() => {
      const professorNameElement = document.querySelector('div.NameTitle__Name-dowf0z-0')?.textContent?.trim();
      const overallQualityElement = document.querySelector('div.RatingValue__Numerator-qw8sqy-2')?.textContent?.trim();
      const wouldTakeAgainElement = document.querySelectorAll('div.FeedbackItem__FeedbackNumber-uof32n-1')[1]?.textContent?.trim(); 
      const difficultyElement = document.querySelectorAll('div.FeedbackItem__FeedbackNumber-uof32n-1')[0]?.textContent?.trim();
      const departmentElement = document.querySelector('a.TeacherDepartment__StyledDepartmentLink-fl79e8-0 b')?.textContent?.trim();

      const professorName = professorNameElement || 'Unknown';
      const overallQuality = overallQualityElement || 'N/A';
      const retakePercentage = wouldTakeAgainElement || 'N/A';
      const difficulty = difficultyElement || 'N/A';
      const department = departmentElement || 'Unknown department';

      return { professorName, overallQuality, difficulty, retakePercentage, department };
    });

    console.log('Extracted Data:', data);

    await browser.close();

    // Validate extracted data
    const { professorName, overallQuality, difficulty, retakePercentage, department } = data;

    if (!professorName || !overallQuality || !difficulty || !retakePercentage || !department) {
      console.error('Failed to extract all necessary professor data');
      return NextResponse.json({ error: 'Could not extract professor data' }, { status: 500 });
    }

    // Combine the extracted data into a single string to generate an embedding
    const combinedDetails = `Professor: ${professorName}\nOverall Quality: ${overallQuality}\nWould Take Again: ${retakePercentage}\nDifficulty: ${difficulty}\nDepartment: ${department}`;

    // Generate an embedding for the combined details
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: combinedDetails,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Insert data into Pinecone with separate metadata fields
    await insertProfessorData(professorName, embedding, overallQuality, difficulty, retakePercentage, department);

    return NextResponse.json({ message: 'Professor data successfully inserted' });
  } catch (error) {
    console.error('Error scraping professor data:', error);
    return NextResponse.json({ error: 'Failed to scrape data' }, { status: 500 });
  }
}
