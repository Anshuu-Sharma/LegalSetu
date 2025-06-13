// server/analyze.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Utility: OCR from image
const extractTextFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, 'eng');
  return result.data.text;
};

// Utility: Extract text from PDF, fallback to OCR if mostly empty
const extractTextFromPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text.trim();
  const needsOCR = text.length < 100;

  if (needsOCR) {
    const imageText = await extractTextFromImage(filePath);
    return { text: imageText, pages: data.numpages || 1 };
  }

  return { text, pages: data.numpages || 1 };
};

// Utility: Extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value.trim();

  if (text.length < 50) {
    const imageText = await extractTextFromImage(filePath);
    return { text: imageText, pages: 1 };
  }

  return { text, pages: 1 };
};

// Gemini 2.0 Flash API Call
const callGeminiFlash = async (text) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{
        text: `You are an expert legal assistant whose primary responsibility is to protect the user. Carefully read the legal document below and return a detailed, user-centric analysis that simplifies legal jargon and highlights any content that could negatively affect the user.

Responsibilities:
- Detect hidden risks, vague obligations, or legal traps.
- Identify terms that favor the other party.
- Explain complex sections in plain language.
- Suggest how users can protect themselves or renegotiate.

Important:
- Do NOT use bold (**), italic (*), or markdown formatting.
- Use bullet points where necessary.
- Return valid, clean JSON in the format below only:

{
  "summary": "...",
  "clauses": ["..."],
  "risks": ["..."],
  "suggestions": ["..."],
  "pageMetadata": {
    "1": "Page 1 summary and key content...",
    "2": "Page 2 summary and key content..."
  }
}

Here is the document:
"""${text.slice(0, 100000)}"""`
      }]
    }]
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// Main route
router.post('/analyze', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const mime = file.mimetype;
    const ext = path.extname(file.originalname).toLowerCase();
    let text = '';
    let pages = 1;

    if (mime === 'application/pdf') {
      const result = await extractTextFromPDF(file.path);
      text = result.text;
      pages = result.pages;
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
      const result = await extractTextFromDOCX(file.path);
      text = result.text;
      pages = result.pages;
    } else if (mime.startsWith('image/')) {
      text = await extractTextFromImage(file.path);
    } else {
      throw new Error('Unsupported file type');
    }

    fs.unlinkSync(file.path); // clean up

    const parsed = await callGeminiFlash(text);
    const { summary, clauses, risks, suggestions, pageMetadata } = parsed;

    return res.json({
      status: 'completed',
      analysis: {
        summary,
        clauses,
        risks,
        suggestions,
        fullText: text,
        _meta: {
          pages,
          pageMetadata: pageMetadata || {},
        },
      },
    });
  } catch (err) {
    console.error('Error during analysis:', err.message || err);
    return res.status(500).json({ status: 'error', error: 'Analysis failed' });
  }
});

router.post('/chat', async (req, res) => {
  const { query, fullText, metadata } = req.body;

  if (!query || !fullText || !metadata) {
    console.log('❌ Missing query/fullText/metadata', { query, fullText: !!fullText, metadata: !!metadata });
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Step 1: Match relevant pages from metadata
    let matchedPages = [];
    let extractedSections = '';

    if (metadata?.pageMetadata && typeof metadata.pageMetadata === 'object') {
      const matches = Object.entries(metadata.pageMetadata).filter(
        ([_, content]) =>
          typeof content === 'string' &&
          content.toLowerCase().includes(query.toLowerCase())
      );

      matchedPages = matches.map(([page]) => parseInt(page));
      extractedSections = matches
        .map(([page, content]) => `Page ${page}: ${content}`)
        .join('\n\n');
    }

    // Step 2: Build Gemini prompt
    const geminiQuery = `
You are a highly reliable legal assistant. A user has asked the following question about a legal document:

"${query}"

Please analyze the document carefully and respond in plain, professional language.

Instructions:
- Avoid using any Markdown formatting (like **bold**, *italic*, or backticks).
- If your answer is based on a specific clause or statement, quote that statement exactly as it appears in the document.
- Clearly mention the page number where the quoted statement was found, if applicable.
- Be concise, legally aware, and focused on the user's safety or clarity.
- If the answer requires assumptions, clearly state that they are assumptions.

Relevant page summaries (may help):
${extractedSections || 'None detected.'}

Full document text (only search if needed):
"""${fullText.slice(0, 100000)}"""
`;

    console.log('📤 Gemini Chat Request Preview:', {
      query,
      matchedPages,
      snippet: geminiQuery.slice(0, 500),
    });

    // Step 3: Gemini API call
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: geminiQuery }],
        }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ reply: rawText.trim(), pages: matchedPages });
  } catch (err) {
    console.error('🔥 Chat API Error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Chat query failed' });
  }
});

router.post('/assist', async (req, res) => {
  const { query, language = 'en', history = [] } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    // Construct context from previous messages
    const recentHistory = history
      .slice(-5) // only last 5 user messages
      .map((msg, index) => `Previous Q${index + 1}: "${msg}"`)
      .join('\n');

    const systemPrompt = `
You are LawBot — the ultimate expert on Indian laws and the Constitution.

You are intelligent, accurate, and professional. You have deep and reliable knowledge of all Indian legal domains — civil, criminal, property, family, labor, cyber law, and more.

Guidelines for your replies:
- Speak like a calm and trustworthy legal advisor.
- Keep your answers clear, concise, and focused.
- Use plain legal language that anyone can understand.
- Avoid legal jargon unless it's absolutely necessary, and explain it briefly if used.
- Never guess or make assumptions. Only speak when you are certain.
- If the user's input is vague or incomplete, politely ask for clarification.
- Refer to relevant Indian laws (e.g., IPC, CrPC, RTI Act, Contract Act) when useful.
- Do **not** use **bold**, *italic*, or any other markdown symbols in your responses — just plain, readable text.

Your only focus is Indian law. You do not assist with legal systems outside India.

Your tone should reflect clarity, expertise, and confidence. Be respectful, professional, and always helpful.
`;

    const finalPrompt = `
${systemPrompt}

${recentHistory ? `${recentHistory}\n` : ''}User's Current Question: "${query}"
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: finalPrompt }],
        }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ reply: rawText.trim() });
  } catch (err) {
    console.error('🔥 Assist API Error:', err.response?.data || err.message || err);
    return res.status(500).json({ error: 'Assistant query failed' });
  }
});

module.exports = router;
