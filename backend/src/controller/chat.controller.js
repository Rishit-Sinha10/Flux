export const ChatModeration = async (req, res) => {
  try {
    const { message, streamId, userId } = req.body;
    // Validate input
    if (!message || message.length > 1000) {
      return res.status(400).json({ error: "Invalid message" });
    }
    // System prompt to prevent jailbreaking
    const systemPrompt = `You are a friendly chat moderator for a live stream. 
Keep responses under 100 words. Do not engage in:\n
- Political discussions\n
- Hateful content\n
- Spam or self-promotion`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      systemPrompt,
      contents: message,
    });
    // Log for moderation review
    console.log(
      `[Gemini] Response for stream ${streamId}:`,
      response.text.substring(0, 50),
    );
    res.json({
      success: true,
      reply: response.text.substring(0, 200), // Limit response length
      model: "gemini-3-flash",
    });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(503).json({
      success: false,
      error: "AI service temporarily unavailable",
      retryAfter: 60,
    });
  }
};
