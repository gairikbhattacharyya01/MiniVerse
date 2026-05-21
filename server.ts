import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini SDK with telemetry User-Agent header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Orion AI Chat Proxy Endpoint
  app.post('/api/orion', async (req, res) => {
    try {
      const { message, history } = req.body;
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

      res.json({ text: responseText });
    } catch (error: any) {
      console.error('Error in Orion AI generation:', error);
      res.status(500).json({ error: error.message || 'Failed to generate answer' });
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
