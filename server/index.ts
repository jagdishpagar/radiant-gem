import express, { Request, Response } from 'express';
import { createClient } from 'redis';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env if present, or local .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Redis Client Setup
const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    database: parseInt(process.env.REDIS_DB || '0')
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
    console.log('Connected to Redis');
})();

// Types
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatSession {
    id: string;
    title: string;
    timestamp: string;
}

// Routes

// Get all chats (metadata only)
app.get('/api/chats', async (req: Request, res: Response) => {
    try {
        const keys = await redisClient.keys('chat:*:metadata');
        const chats: ChatSession[] = [];

        for (const key of keys) {
            const data = await redisClient.get(key);
            if (data) {
                chats.push(JSON.parse(data));
            }
        }

        // Sort by timestamp desc
        chats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get chat history
app.get('/api/history/:chatId', async (req: Request, res: Response) => {
    const { chatId } = req.params;
    try {
        // Get metadata to ensure chat exists
        const metadata = await redisClient.get(`chat:${chatId}:metadata`);
        if (!metadata) {
            res.status(404).json({ error: 'Chat not found' });
            return;
        }

        // Get messages list
        // LRANGE 0 -1 gets all messages. We can slice specifically if needed.
        // User asked for "last 10 messages or conversation".
        // Let's return all for the frontend to render, but we can limit if performance allows.
        // For AI context, we might only want last 10.
        const messagesData = await redisClient.lRange(`chat:${chatId}:messages`, 0, -1);
        const messages = messagesData.map((msg) => JSON.parse(msg));

        res.json({
            ...JSON.parse(metadata),
            messages
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Save message to chat
app.post('/api/history/:chatId', async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { message, title } = req.body; // Expect single message object

    if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }

    try {
        const chatKey = `chat:${chatId}:messages`;
        const metadataKey = `chat:${chatId}:metadata`;

        // Check if chat exists
        const exists = await redisClient.exists(metadataKey);

        if (!exists) {
            // Create new chat metadata
            const newChat: ChatSession = {
                id: chatId,
                title: title || 'New Chat',
                timestamp: new Date().toISOString()
            };
            await redisClient.set(metadataKey, JSON.stringify(newChat));
        } else if (title) {
            // Update title if provided (e.g. first message)
            const data = await redisClient.get(metadataKey);
            if (data) {
                const chat = JSON.parse(data);
                chat.title = title;
                await redisClient.set(metadataKey, JSON.stringify(chat));
            }
        }

        // Update timestamp
        const data = await redisClient.get(metadataKey);
        if (data) {
            const chat = JSON.parse(data);
            chat.timestamp = new Date().toISOString();
            await redisClient.set(metadataKey, JSON.stringify(chat));
        }

        // Push message to list
        if (typeof message.timestamp !== 'string') {
            message.timestamp = new Date().toISOString();
        }
        await redisClient.rPush(chatKey, JSON.stringify(message));

        // Trim to keep only relative history if needed, but for "conversation" we usually keep all.
        // If we strictly want ONLY last 10 stored:
        // await redisClient.lTrim(chatKey, -10, -1); 
        // But user said "store last 10 messages OR conversation". Usually conversation implies full history unless it gets too long.
        // I'll keep full history for now as it's better for UX (scrolling back).

        res.json({ success: true });

    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// Delete chat
app.delete('/api/history/:chatId', async (req: Request, res: Response) => {
    const { chatId } = req.params;
    try {
        await redisClient.del(`chat:${chatId}:metadata`);
        await redisClient.del(`chat:${chatId}:messages`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Clear all chats
app.delete('/api/history', async (req: Request, res: Response) => {
    try {
        const keys = await redisClient.keys('chat:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
