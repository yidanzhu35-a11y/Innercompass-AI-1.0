// Mock service for testing UI without actual API calls
export const mockGenerateCoachResponse = async (): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockResponses = [
    "这是一个很好的观点！你能详细说说是什么让你有这样的感受吗？",
    "我注意到你提到了一个重要的模式。这与你之前分享的经历有什么联系吗？",
    "这听起来像是一个关键时刻。你觉得它对你现在的想法产生了什么影响？",
    "非常有趣的观察！你认为这反映了你内心什么样的价值观？",
    "你刚才提到的这个经历很吸引人。它揭示了你怎样的天赋或能力？"
  ];
  
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
};

export const mockGenerateTopicSummary = async (): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return `1️⃣ **核心洞察**
• 你展现了深刻的自我反思能力
• 在探索过程中表现出真诚和开放的态度

2️⃣ **关键发现** 
• 识别出了重要的个人价值观
• 展现了独特的思维方式

3️⃣ **行动建议**
• 继续保持这种反思习惯
• 在日常生活中实践今天的发现`;
};