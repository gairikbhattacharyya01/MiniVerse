import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const handler: Handler = async (event, context) => {
  // Handle CORS Preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { message, history } = JSON.parse(event.body || '{}');
    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Format history for GoogleGenAI chats:
    // { role: 'user' | 'model', parts: [{ text: string }] }
    const chatHistory = (history || []).map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text || '' }]
    }));

    // Create the chat session on server
    const chat = ai.chats.create({
      model: 'gemini-3.5-flash',
      history: chatHistory,
      config: {
        systemInstruction: `You are Orion AI, a brilliant, helpful, and highly insightful cosmic AI companion integrated into MiniVerse (the social network). 
Respond in a conversational, intelligent, and encouraging manner. You can talk about anything just like ChatGPT, but you also understand you're a guiding star in MiniVerse.
Use elegant and supportive language, feel free to use markdown elements (like list items, headers, code, or emphasis) to format your response beautifully and clearly. 
Keep your persona witty, sophisticated, and cosmic without being cheesy. Always be practical and give direct answers.`,
      }
    });

    const response = await chat.sendMessage({ message });
    const responseText = response.text || '';

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: responseText })
    };
  } catch (error: any) {
    console.error('Error in Netlify Orion AI generation:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message || 'Failed to generate answer' })
    };
  }
};
