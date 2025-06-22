import { GoogleGenerativeAI } from "@google/generative-ai";
import express, { type Request, type Response } from "express";
import cors from "cors";
import fs from "node:fs";
import multer from "multer";

interface MulterRequest extends Request {
  // @ts-expect-error
  file?: multer.File;
}

const genAI = new GoogleGenerativeAI(Bun.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const PORT = Bun.env.PORT ?? 3000;

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

app.listen(PORT, () => {
  console.log(`Gemini Chatbot running on http://localhost:${PORT}`);
});

// @ts-expect-error
app.post("/api/chat", async (req: Request, res: Response) => {
  const { message: userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ reply: "Message is required" });
  }

  try {
    const result = await model.generateContent(userMessage);
    const { response } = result;

    res.json({ output: response.text() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const imageToGenerativePart = (filePath: string, mimeType: string) => ({
  inlineData: {
    data: fs.readFileSync(filePath).toString("base64"),
    mimeType: "image/jpg",
  },
});

app.post(
  "/generate-from-image",
  upload.single("image"),
  async (req: MulterRequest, res: Response) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req: MulterRequest, res: Response) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    } finally {
      fs.unlinkSync(filepath);
    }
  },
);

app.post(
  "/generate-from-audio",
  upload.single("audio"),
  async (req: MulterRequest, res: Response) => {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    } finally {
      fs.unlinkSync(filepath);
    }
  },
);
