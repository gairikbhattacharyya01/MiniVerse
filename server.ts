import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
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

// Caching layer for dynamically generated news
let cachedNews: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000; // Cache for 15 minutes to avoid hitting rate limits

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Explore page News Aggregator Endpoint using Gemini Search Grounding
  app.get('/api/explore/news', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const currentTime = Date.now();

      if (cachedNews && (currentTime - lastCacheTime < CACHE_TTL) && !forceRefresh) {
        res.json(cachedNews);
        return;
      }

      // Check if GEMINI_API_KEY is available
      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({ error: 'GEMINI_API_KEY is not configured on server.' });
        return;
      }

      const client = getGeminiClient();

      const articleSchema = {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique string ID, e.g., 'n_dyn_1', 's_dyn_1', etc." },
          category: { type: Type.STRING, description: "Display category name, e.g. 'Spaceflight • Live', 'Cricket • IPL', 'Bollywood • Launch'" },
          region: { type: Type.STRING, description: "Must be exactly 'indian' or 'international' depending on context." },
          title: { type: Type.STRING, description: "Stunning, high-quality news headline." },
          time: { type: Type.STRING, description: "Relative time from now, e.g., '14 mins ago', '2 hours ago', '1 day ago'." },
          views: { type: Type.STRING, description: "View count string, e.g., '152K', '89K'." },
          author: { type: Type.STRING, description: "Writer name, e.g. 'Jane Watson, Senior Tech Correspondent'." },
          readTime: { type: Type.STRING, description: "Average read time, e.g., '3 min read', '5 min read'." },
          image: { type: Type.STRING, description: "Specific realistic topic-themed Unsplash image URL (e.g. containing keywords for spaceships, technology, cricket stadium, city lights, cinema, etc.)" },
          excerpt: { type: Type.STRING, description: "One-sentence overview of the article." },
          body: { type: Type.STRING, description: "A detailed 2-3 paragraph breakdown of the article. Must look realistic and contain real quotes or rich descriptions." }
        },
        required: ["id", "category", "region", "title", "time", "views", "author", "readTime", "image", "excerpt", "body"]
      };

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          news: {
            type: Type.ARRAY,
            description: "At least 5 high-quality main news articles. Cover both Indian and International news.",
            items: articleSchema
          },
          sports: {
            type: Type.ARRAY,
            description: "At least 4 high-quality sports updates. Cover both Indian and International sports such as Cricket, Football, Tennis, Athletics.",
            items: articleSchema
          },
          entertainment: {
            type: Type.ARRAY,
            description: "At least 4 high-quality entertainment stories. Cover both Indian cinema/music and global show-biz, pop culture, art.",
            items: articleSchema
          }
        },
        required: ["news", "sports", "entertainment"]
      };

      const prompt = `Generate an updated, realistic set of news, sports, and entertainment stories for May 2026. 
Include actual real-world news events happening today in India and globally, including technology milestones, environmental pacts, sports tournaments, movies, and arts.
Make sure there are some stories set in India (region: 'indian') and some set internationally (region: 'international').
Provide rich, high-quality body descriptions for each. For the images, use real, elegant Unsplash queries or keywords in the URL that match the topics (e.g. space, science, technology, soccer, film, concert, india).`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.82
        }
      });

      const responseText = response.text || '';
      if (!responseText) {
        throw new Error('Gemini returned an empty response.');
      }

      const parsedNews = JSON.parse(responseText);
      
      // Update cache
      cachedNews = parsedNews;
      lastCacheTime = currentTime;

      res.json(parsedNews);
    } catch (err: any) {
      console.error('Error in /api/explore/news:', err);
      res.status(500).json({ error: err.message || 'Failed to aggregate updated news' });
    }
  });

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
