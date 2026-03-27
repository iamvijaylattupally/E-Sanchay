import ApiResponse from "../utils/ApiResponse.js";
import AsyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chat = AsyncHandler(async (req, res) => {
    const { input,language } = req.body;
    console.log("chatbot running...")
    if (!input) {
        throw new ApiError(400, "Input is required");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };

    try {
        
        const chatSession = model.startChat({ generationConfig });
        const result = await chatSession.sendMessage(input+` answer in ${language}`);

        if (!result || !result.response) {
            throw new ApiError(500, "Failed to generate response");
        }

        res.status(200).json(new ApiResponse(200, {
            message: result.response.text(),
        }, "Response generated successfully"));
    } catch (error) {
        throw new ApiError(500, "Error generating response");
    }
});

export { chat };
