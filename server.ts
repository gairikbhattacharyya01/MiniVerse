import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Helper to lazily initialize GoogleGenAI with clear error handling
let aiClient: GoogleGenAI | null = null;
let lastUsedApiKey: string | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('CONFIG_ERROR: GEMINI_API_KEY is missing. Please configure it in your environment variables.');
  }

  if (!aiClient || lastUsedApiKey !== apiKey) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    lastUsedApiKey = apiKey;
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Orion AI Chat Proxy Endpoint
  app.post('/api/orion', async (req, res) => {
    try {
      const { message, history, temperature, systemDirective, persona } = req.body;
      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      // Format history to compatible structure for GoogleGenAI chats:
      // { role: 'user' | 'model', parts: [{ text: string }] }
      const chatHistory = (history || []).map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text || '' }]
      }));

      // Define specialized system prompt instructions based on the selected persona focus
      let finalSystemInstruction = `You are Orion AI, a brilliant, helpful, and highly insightful cosmic AI companion integrated into MiniVerse (the social network). 
Respond in a conversational, intelligent, and encouraging manner. You can talk about anything just like ChatGPT, but you also understand you're a guiding star in MiniVerse.
Use elegant and supportive language, feel free to use markdown elements (like list items, headers, code, or emphasis) to format your response beautifully and clearly. 
Keep your persona witty, sophisticated, and cosmic without being cheesy. Always be practical and give direct answers.`;

      if (persona === 'academic') {
        finalSystemInstruction = `You are Orion AI, acting as the Quantum Scholar: a highly analytical, deep-reasoning academic. Provide rigorous, structured, deeply academic, and precise explanations. Always verify your assertions, structure your thought path carefully, and present physics, math, science, or general topics in rich detail with elegant display elements (like markdown tables, code layout, or formatted parameters).`;
      } else if (persona === 'creative') {
        finalSystemInstruction = `You are Orion AI, acting as the Starlight Bard: a cosmic storyteller. Infuse your answers with poetic sci-fi metaphors, vivid space-themed imagery, and high-quality creative narratives. Take the user's query and weave interstellar wonders into your response while still remaining practically helpful and highly entertaining.`;
      } else if (persona === 'coder') {
        finalSystemInstruction = `You are Orion AI, acting as the Nebula Coder: a specialized software engineer and developer oracle. Focus on delivering production-safe, highly optimized code blocks, clean explanations of programming syntax, clear algorithms, and technical software architecture. Write fully annotated markdown code blocks and specify parameters accurately.`;
      }

      if (systemDirective && systemDirective.trim()) {
        finalSystemInstruction += `\n\nAdhere strictly to these direct user guidelines for this reply:\n${systemDirective.trim()}`;
      }

      const config: any = {
        systemInstruction: finalSystemInstruction,
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
      };

      // Create the chat session on server
      const chat = getGeminiClient().chats.create({
        model: 'gemini-3.5-flash',
        history: chatHistory,
        config,
      });

      const response = await chat.sendMessage({ message });
      const responseText = response.text || '';

      res.json({ 
        text: responseText
      });
    } catch (error: any) {
      console.error('Error in Orion AI generation:', error);
      const errMsg = error.message || '';
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('exhausted') || errMsg.toLowerCase().includes('429')) {
        res.status(429).json({ error: 'QUOTA_EXHAUSTED', details: errMsg });
        return;
      }
      res.status(500).json({ error: errMsg || 'Failed to generate answer' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
