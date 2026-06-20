import ai from "../config/gemini.config.js";
export const generateChatResponse = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
    });
    return res.status(200).json({
      success: true,
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate response",
    });
  }
};
