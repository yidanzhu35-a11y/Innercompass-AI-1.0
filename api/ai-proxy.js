// Vercel API route to proxy AI requests
import OpenAI from 'openai';

export const config = {
  runtime: 'edge', // Using edge runtime for better performance
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt, model = 'moonshot-v1-8k' } = await request.json();

    const client = new OpenAI({
      apiKey: process.env.API_KEY, // Using environment variable from Vercel
      baseURL: 'https://api.moonshot.cn/v1',
    });

    const response = await client.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return new Response(
      JSON.stringify({ content: response.choices[0]?.message?.content }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('AI API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}