import ApiResponse from "../utils/ApiResponse.js";
import AsyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Expenses } from "../models/expenses.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";


const updateGoal = AsyncHandler(async (req, res) => {
    res.send("helo")
});




// ✅ Create an expense
const createExpense = AsyncHandler(async (req, res) => {
    const { userId, title, amount, date } = req.body;

    if (!userId || !title || !amount) {
        throw new ApiError(400, "All fields are required");
    }

    const newExpense = await Expenses.create({ userId, title, amount, date });

    res.status(201).json({
        success: true,
        message: "Expense added successfully",
        expense: newExpense,
    });
});

// ✅ Fetch all expenses of a user
const getExpenses = AsyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const expenses = await Expenses.find({ userId }).sort({ date: -1 });

    res.status(200).json({
        success: true,
        expenses,
    });
});

// ✅ Update an expense
const updateExpense = AsyncHandler(async (req, res) => {
    const { expenseId } = req.params;
    const { title, amount, date } = req.body;

    const updatedExpense = await Expenses.findByIdAndUpdate(
        expenseId,
        { title, amount, date },
        { new: true, runValidators: true }
    );

    if (!updatedExpense) {
        throw new ApiError(404, "Expense not found");
    }

    res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense,
    });
});

// ✅ Delete an expense
const deleteExpense = AsyncHandler(async (req, res) => {
    const { expenseId } = req.params;

    const deletedExpense = await Expenses.findByIdAndDelete(expenseId);

    if (!deletedExpense) {
        throw new ApiError(404, "Expense not found");
    }

    res.status(200).json({
        success: true,
        message: "Expense deleted successfully",
    });
});


const summarizeExpenses = AsyncHandler(async (req, res) => {
    const { expenses } = req.body;

    if (!expenses || expenses.length === 0) {
        return res.status(400).json({ summary: "No expenses to summarize." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const formattedExpenses = expenses.map(exp => 
        `- ${exp.title}: ₹${exp.amount} on ${exp.date ? new Date(exp.date).toDateString() : "Unknown Date"}`
    ).join("\n");

    const prompt = `
    Here is a list of the user's recent expenses:\n
    ${formattedExpenses}\n
    Analyze the spending patterns and provide insights on how the user can optimize their expenses and save more money.
    Provide specific suggestions and categorize spending trends if possible.
    give the result in a concise manner.
    `;

    try {
        const chatSession = model.startChat();
        const result = await chatSession.sendMessage(prompt);

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


export {
    updateGoal,
    createExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
    summarizeExpenses
}