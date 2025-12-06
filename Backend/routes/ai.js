import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCIQ6E3eHINZaxpKjOfwedwwgY_xzZ6PV8');

// Process AI query endpoint
router.post('/query', async (req, res) => {
  try {
    const { prompt, context, fileData } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    console.log('🤖 Processing AI query:', { prompt, hasContext: !!context, hasFile: !!fileData });

    // Use Gemini Flash model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    // Build the content parts
    const parts = [];
    
    // Add context if available (from study room conversation history)
    if (context) {
      parts.push({ text: `Context from previous conversation:\n${context}\n\n` });
    }
    
    // Add the user's prompt
    parts.push({ text: prompt });

    // Add file data if available (image or PDF)
    if (fileData) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data // Base64 encoded data
        }
      });
    }

    // Generate response with system instruction
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      systemInstruction: {
        parts: [{
          text: 'You are an AI assistant in a study room. Help students with their questions, provide explanations, and assist with learning. Be friendly, clear, and educational. When analyzing images or PDFs, provide detailed insights relevant to the question asked.'
        }]
      }
    });

    const response = await result.response;
    const text = response.text();

    console.log('✅ AI response generated successfully');

    res.json({
      success: true,
      data: {
        response: text,
        model: 'gemini-2.0-flash'
      }
    });

  } catch (error) {
    console.error('❌ Error processing AI query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI query',
      error: error.message
    });
  }
});

// Health check for AI service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI service is running',
    model: 'gemini-2.0-flash'
  });
});

export default router;
