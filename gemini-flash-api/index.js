import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import fs from "node:fs";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
app.use(express.json());
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Gemini API server is running at http://localhost:${PORT}`);
});

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await model.generateContent(prompt);
    const { response } = result;

    res.json({ output: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const imageToGenerativePart = (filePath, mimeType) => ({
  inlineData: {
    data: fs.readFileSync(filePath).toString("base64"),
    mimeType: "image/jpg",
  },
});

app.post(
  "/generate-from-image",
  upload.single("image"),
  async (req, res) => {
    const { prompt } = req.body;
    const { path: filepath, mimetype } = req.file;

    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    const image = imageToGenerativePart(filepath, mimetype);

    try {
      const result = await model.generateContent([prompt, image]);
      const { response } = result;

      res.status(200).json({ output: response.text() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const { path: filepath, mimetype } = req.file;
    const buffer = fs.readFileSync(filepath);
    const base64Data = buffer.toString("base64");

    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    try {
      const documentPart = {
        inlineData: {
          data: base64Data,
          mimeType: mimetype,
        },
      };

      const result = await model.generateContent([
        "Analyze this document",
        documentPart,
      ]);
      const { response } = result;

      res.status(200).json({ output: response.text() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      fs.unlinkSync(filepath);
    }
  },
);

app.post(
  "/generate-from-audio",
  upload.single("audio"),
  async (req, res) => {
    const { path: filepath, mimetype } = req.file;
    const buffer = fs.readFileSync(filepath);
    const base64Audio = buffer.toString("base64");

    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    try {
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType: mimetype,
        },
      };

      const result = await model.generateContent([
        "Transcribe or analyze the following audio:",
        audioPart,
      ]);
      const { response } = result;

      res.status(200).json({ output: response.text() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      fs.unlinkSync(filepath);
    }
  },
);
