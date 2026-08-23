import { handleAIChat } from '../services/geminiService.js';

export const chatWithAI = async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required and must be a string' });
    }

    // Input length limit for protection
    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message is too long. Please keep it under 500 characters.' });
    }

    // Format history structure: array of { role: 'user'|'model', text: '...' }
    const formattedHistory = Array.isArray(history) 
      ? history.filter(h => h && h.role && h.text).slice(-10) // keep last 10 messages for context efficiency
      : [];

    const user = req.user || null;

    const response = await handleAIChat(message, formattedHistory, user, context);

    if (response.error === 'RATE_LIMIT') {
      return res.status(429).json({
        success: false,
        message: response.text
      });
    }

    return res.json({
      success: true,
      message: response.text,
      products: response.products || []
    });
  } catch (error) {
    console.error('AI Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while communicating with our assistant. Please try again.'
    });
  }
};
