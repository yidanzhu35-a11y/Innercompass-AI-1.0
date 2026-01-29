import { OpenAI } from "openai";
import { Message, Topic } from "../types";

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing!");
    // In a real app, handle this gracefully. For this template, we assume environment setup is correct.
    throw new Error("Missing API Key");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.moonshot.cn/v1",
    // Add timeout for network requests
    timeout: 30000, // 30 seconds
  });
};

// Model selection for Moonshot AI API
const MODEL_NAME = 'moonshot-v1-8k'; // Using moonshot's standard model for compatibility

export const generateCoachResponse = async (
  topic: Topic,
  history: Message[],
  userContext: string
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    // Convert history to string format for context
    const conversationStr = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const prompt = `
    You are an empathetic, insightful, and professional Life Coach. 
    The user is currently working on a self-discovery module.
    
    Current Topic: "${topic.title}"
    Main Question: "${topic.mainPrompt}"
    
    The user has been provided with a list of reflecting questions to guide their thinking.
    
    User Context/Background: ${userContext}
    
    Recent Conversation History:
    ${conversationStr}
    
    YOUR GOAL:
    1. Acknowledge the user's latest input with empathy.
    2. Identify key patterns, emotions, or strengths in what they said.
    3. Ask ONE or TWO powerful, probing follow-up questions to help them dig deeper into the current topic. 
    4. Do NOT simply repeat their answer. Synthesize it.
    5. Keep the tone warm, encouraging, but professional.

    FORMATTING REQUIREMENTS:
    - **Structure is key.** Use clear paragraphs.
    - **Use Number Emojis (1️⃣, 2️⃣, 3️⃣)** when listing distinct points or insights.
    - **Use Bullet Points (•)** for sub-details to make it easy to scan.
    - **Use Bold Text** to highlight key keywords or emotional shifts.
    - Avoid long walls of text.
    
    Reply in Chinese (Simplified).
    `;

    const response = await ai.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || "抱歉，我暂时无法连接到思维网络，请稍后再试。";
  } catch (error) {
    console.error("Error generating coach response:", error);
    return "AI 教练正在思考中，请稍后...";
  }
};

export const generateTopicSummary = async (
  topic: Topic,
  messages: Message[],
  userSummary: string
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    const conversationStr = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const prompt = `
    You are an expert Life Coach. The user has completed a reflection session on the topic: "${topic.title}".
    
    Session Transcript:
    ${conversationStr}
    
    User's Own Summary:
    "${userSummary}"
    
    TASK:
    Write a concise but profound summary (in Chinese) of the user's insights for this topic.
    1. Highlight the core discovery they made.
    2. Point out a "blind spot" or a "hidden potential" they might have missed based on their answers.
    3. Connect this insight to their broader self-discovery journey (Values/Talents/Passions).
    
    FORMATTING REQUIREMENTS:
    - Use **Number Emojis (1️⃣, 2️⃣, 3️⃣)** to clearly separate the main insight points.
    - Use **Bullet Points** for details.
    - Use **Bold** for emphasis.
    - Make it look like a professional, structured insight report.
    `;

    const response = await ai.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || "无法生成总结。";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "生成总结失败。";
  }
};

export const generateHolisticReport = async (
  allData: Record<string, { userSummary: string, aiSummary: string, topicTitle: string, moduleTitle: string }>
): Promise<string> => {
    try {
        const ai = getAIClient();
        const dataStr = JSON.stringify(allData, null, 2);

        const prompt = `
        You are a master architect of human potential. The user has completed several self-discovery modules.
        
        Here is the data from their completed sessions (Values, Talents, Passions):
        ${dataStr}
        
        TASK:
        Generate a comprehensive "Self-Discovery Report" in Chinese.
        
        Structure:
        1. **核心价值观 (Core Values)**: Synthesize their value drivers.
        2. **天赋原力 (Native Superpowers)**: Identify their natural talents and flow states.
        3. **热情罗盘 (Passion Compass)**: Summarize what gives them energy.
        4. **整合建议 (Integration)**: How can they combine their Values, Talents, and Passions to live a more fulfilling life? Provide actionable advice.
        
        FORMATTING REQUIREMENTS:
        - Use **Number Emojis (1️⃣, 2️⃣, 3️⃣)** for main sections or list items.
        - Use **Bullet Points** for lists.
        - Use **Bold** for emphasis.
        - Ensure high readability with clear spacing.
        `;

        const response = await ai.chat.completions.create({
            model: MODEL_NAME,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        });

        return response.choices[0]?.message?.content || "报告生成中...";
    } catch (error) {
        console.error(error);
        return "无法生成整体报告。";
    }
}