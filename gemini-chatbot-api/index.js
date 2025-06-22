import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

app.listen(PORT, () => {
  console.log(`Gemini Chatbot running on http://localhost:${PORT}`);
});

app.post("/api/chat", async (req, res) => {
  const { message: userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ reply: "Message is required" });
  }

  try {
    const result = await model.generateContent(userMessage);
    const { response } = result;

    res.json({ output: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});