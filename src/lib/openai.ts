import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatFlow {
  id: string;
  name: string;
  triggers: string[];
  response: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are a friendly business chatbot. Always check predefined flows first. If no match, answer with short, polite, and helpful replies. Keep responses concise and professional.`;

// Generate AI response using OpenAI
export const generateAIResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  flows: ChatFlow[] = []
): Promise<string> => {
  try {
    // First, check if user message matches any predefined flows
    const matchedFlow = flows.find(flow => 
      flow.isActive && 
      flow.triggers.some(trigger => 
        userMessage.toLowerCase().includes(trigger.toLowerCase())
      )
    );

    if (matchedFlow) {
      return matchedFlow.response;
    }

    // If no flow matches, use OpenAI for intelligent response
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I cannot process your request at the moment.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'I apologize, but I\'m experiencing technical difficulties. Please try again later.';
  }
};

// Generate flow suggestions based on common customer queries
export const generateFlowSuggestions = async (businessType: string): Promise<ChatFlow[]> => {
  try {
    const prompt = `Generate 5 common customer service flows for a ${businessType} business. Each flow should have:
    1. A descriptive name
    2. 3-5 trigger keywords/phrases
    3. A helpful response message
    
    Format as JSON array with: name, triggers (array), response, isActive (true)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a customer service expert. Generate practical chatbot flows.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      try {
        const suggestions = JSON.parse(response);
        return suggestions.map((suggestion: any, index: number) => ({
          id: `suggestion-${index}`,
          name: suggestion.name,
          triggers: suggestion.triggers,
          response: suggestion.response,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      } catch (parseError) {
        console.error('Error parsing flow suggestions:', parseError);
      }
    }

    return [];
  } catch (error) {
    console.error('Error generating flow suggestions:', error);
    return [];
  }
};

export default openai;
