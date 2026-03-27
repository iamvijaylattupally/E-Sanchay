import ApiResponse from "../utils/ApiResponse.js";
import AsyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const invest = AsyncHandler(async (req, res) => {
    const { income, riskLevel, language } = req.body;
    console.log("investment running... " + income + " " + riskLevel + " " + language);
    if (!income || isNaN(income) || income <= 0) {
        throw new ApiError(400, "Please enter a valid monthly income");
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
        let prompt = `I have a monthly income of ₹${income} and I am looking for investment advice. 
I am willing to take a ${riskLevel} risk. 

Please divide my income using the 60-20-20 rule:
- 60% for needs (necessities)
- 20% for wants (discretionary expenses)
- 20% for savings and investments

Allocate the savings portion appropriately based on my risk level:
- Provide suitable investment strategies considering my risk preference.

Respond concisely in ${language}, using Indian Rupee (₹) as the currency format. Do not include any preamble.`;

        const chatSession = model.startChat({ generationConfig });
        const result = await chatSession.sendMessage(prompt);

        if (!result || !result.response) {
            throw new ApiError(500, "Failed to generate response");
        }

        res.status(200).json(new ApiResponse(200, {
            message: result.response.text(),
        }, "Response generated successfully"));
    } catch (error) {
        throw new ApiError(500, "Error generating response " + error);
    }
});

export {
    invest
}