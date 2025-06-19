require('dotenv').config();

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({ key: process.env.GOOGLE_API_KEY });
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// In-memory cache: key = hash(docText + lang), value = analysis result
const analysisCache = new Map();

// Generate a cache key from document content and language
function getCacheKey(text, lang) {
  return crypto.createHash('sha256').update(text + '|LANG|' + lang).digest('hex');
}

// --- Text extraction utilities ---
const extractTextFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, 'eng');
  return result.data.text;
};

const extractTextFromPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text.trim();
  if (text.length < 100) {
    const imageText = await extractTextFromImage(filePath);
    return { text: imageText, pages: data.numpages || 1 };
  }
  return { text, pages: data.numpages || 1 };
};

const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value.trim();
  if (text.length < 50) {
    const imageText = await extractTextFromImage(filePath);
    return { text: imageText, pages: 1 };
  }
  return { text, pages: 1 };
};

// --- Gemini API call for document analysis ---
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
- Do NOT use bold (**), italic (*), backticks (\`\`\`), or markdown formatting.
- Use bullet points where necessary.
- Return valid, raw JSON only:
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
    }],
    generationConfig: { temperature: 0 }
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  let raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  raw = raw.replace(/``````/g, '').trim();
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    raw = raw.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Failed to parse Gemini response');
  }
};

// --- Gemini API call for chatbot ---
const callGeminiChat = async (query, history = []) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const context = history.length > 0
    ? `Chat history to understand context:\n${history.join('\n')}\n\nUser's current question: ${query}`
    : `User's question: ${query}`;

const prompt = `You are a highly reliable legal assistant with expert knowledge of Indian laws and the Constitution. You have been trained on comprehensive Indian legal databases including Supreme Court and High Court judgments, statutes, and legal commentaries. Your purpose is to help and protect the user with practical legal guidance — in simple, real-world terms.

Instructions:

# Response Format
- Always respond in a short, helpful way.
- If the answer has steps or points, each point MUST start with a dash (-) followed by a space, and MUST be on a new line using \\n, but do not return this \n in response because i will be using the answer directly in html. DO NOT combine multiple points in a single paragraph.
- Avoid legal jargon. Use simple, common Indian language.
- DO NOT use any markdown formatting (no *bold, *italic, or symbols).
- Keep the tone direct and friendly — like you're speaking to a friend in trouble.
- If the answer is in paragraph form, limit to one short paragraph.
- But if bullet points are used, each one must be clearly separated by a newline.

# Accuracy Controls
- When providing legal information, clearly distinguish between established law, legal principles, and general advice.
- If you're uncertain about any legal detail, acknowledge the limitation rather than providing potentially incorrect information.
- For specific legal provisions, cite the relevant Act and section number only when you are certain of their accuracy.
- Do not reference non-existent cases, statutes, or legal principles.
- When discussing legal rights or procedures, focus on well-established, fundamental principles rather than nuanced interpretations.

# Context Awareness
- Use chat history to better understand context or what the user is trying to ask.
- Before responding, analyze the user's query to identify the specific legal domain (e.g., criminal, civil, constitutional, family law).
- Tailor your response to match the identified legal domain using appropriate terminology while maintaining simplicity.
- For complex legal questions, break down your response into clear, sequential steps or points.
- If the user's query is ambiguous, ask clarifying questions before providing legal guidance.

# Safety and Ethics
- Prioritize user safety above all else, especially in emergency legal situations.
- If the user might be in danger (e.g., police arrest), explain both legal rights and how to stay safe calmly.
- Never provide guidance that could encourage illegal activities or circumvention of legal processes.
- For sensitive legal matters (domestic violence, sexual assault), provide information about specialized support services along with legal guidance.

# Indian Legal Context
- Frame all legal information within the Indian legal system and jurisdiction.
- When relevant, distinguish between Central laws and State-specific regulations.
- Consider cultural and social contexts unique to India when providing practical guidance.
- Use examples relevant to Indian society to illustrate legal concepts when helpful.
- Mention laws only if really needed. Prefer real actions over legal text.

# Query Scope Restriction
- This assistant is designed exclusively for legal queries related to Indian law and the Constitution.
- If a user asks questions unrelated to legal matters (such as general knowledge, entertainment, technology, cooking, travel, etc.), respond with: "Please ask legal queries only. I'm here to help with Indian legal matters and constitutional questions."
- Do not engage with or attempt to answer non-legal questions, even if you could provide helpful information.
- Redirect users back to legal topics by suggesting they ask about their legal rights, procedures, or any Indian law-related concerns.


# Disclaimer Usage
- Only end with this line — "This is general legal guidance. For personal advice, consult a lawyer."
- DO NOT add the disclaimer for casual greetings, jokes, or non-legal chit-chat.

Now respond to the user's query:

${context}
`.trim();





  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7
    }
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    || 'Sorry, I could not process your query. Please try again.';
};


// --- Translate all analysis fields ---
const translateAnalysisFields = async (analysis, lang) => {
  const translated = { ...analysis };
  translated.summary = (await translate.translate(analysis.summary, lang))[0];
  translated.clauses = await Promise.all(
    (analysis.clauses || []).map(c => translate.translate(c, lang).then(([t]) => t))
  );
  translated.risks = await Promise.all(
    (analysis.risks || []).map(r => translate.translate(r, lang).then(([t]) => t))
  );
  translated.suggestions = await Promise.all(
    (analysis.suggestions || []).map(s => translate.translate(s, lang).then(([t]) => t))
  );
  if (analysis.pageMetadata) {
    const meta = analysis.pageMetadata;
    const newMeta = {};
    for (const key in meta) {
      newMeta[key] = (await translate.translate(meta[key], lang))[0];
    }
    translated.pageMetadata = newMeta;
  }
  return translated;
};

// --- Main analysis endpoint: upload, analyze, cache, and translate ---
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

    const requestedLang = req.body.language || 'en';
    const cacheKey = getCacheKey(text, requestedLang);

    // Return cached analysis if available
    if (analysisCache.has(cacheKey)) {
      return res.json({
        status: 'completed',
        analysisId: cacheKey,
        analysis: analysisCache.get(cacheKey)
      });
    }

    // Generate new analysis
    const parsed = await callGeminiFlash(text);
    let resultAnalysis = {
      summary: parsed.summary,
      clauses: parsed.clauses,
      risks: parsed.risks,
      suggestions: parsed.suggestions,
      pageMetadata: parsed.pageMetadata || {},
      fullText: text,
      _meta: {
        pages,
        pageMetadata: parsed.pageMetadata || {},
      }
    };

    // Translate if needed
    if (requestedLang !== 'en') {
      resultAnalysis = await translateAnalysisFields(resultAnalysis, requestedLang);
    }

    // Cache and return
    analysisCache.set(cacheKey, resultAnalysis);

    return res.json({
      status: 'completed',
      analysisId: cacheKey,
      analysis: resultAnalysis,
    });
  } catch (err) {
    console.error('Error during analysis:', err.message || err);
    return res.status(500).json({ status: 'error', error: 'Analysis failed' });
  }
});

// --- Retrieve analysis by ID (with on-the-fly translation if needed) ---
router.get('/analysis/:id', async (req, res) => {
  const { id } = req.params;
  const { lang = 'en' } = req.query;

  const analysis = analysisCache.get(id);
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }

  let result = analysis;
  if (lang !== 'en') {
    try {
      result = await translateAnalysisFields(analysis, lang);
      result.fullText = analysis.fullText;
      result._meta = {
        pages: analysis._meta.pages,
        pageMetadata: result.pageMetadata || {},
      };
    } catch (err) {
      console.error('Translation error:', err);
    }
  }

  res.json(result);
});

// --- Chatbot endpoint for general legal Q&A ---
router.post('/assist', async (req, res) => {
  const { query, language = 'en', history = [] } = req.body;

  try {
    let reply = await callGeminiChat(query, history);

    // Translate reply if needed
    // if (language !== 'en') {
    //   reply = (await translate.translate(reply, language))[0];
    // }

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      reply: 'I apologize, but I encountered an error. Please try again later.'
    });
  }
});

// --- Chatbot endpoint for document-specific Q&A (with translation) ---
router.post('/chat', async (req, res) => {
  const { query, fullText, metadata, language = 'en' } = req.body;

  if (!query || !fullText || !metadata) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
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

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: geminiQuery }]
        }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    let reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Translate reply if needed
    if (language !== 'en') {
      try {
        reply = (await translate.translate(reply, language))[0];
      } catch (translateErr) {
        console.error('Translation error:', translateErr);
        // Proceed without translation if error occurs
      }
    }

    res.json({ reply, pages: matchedPages });
  } catch (err) {
    console.error('🔥 Chat API Error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Chat query failed' });
  }
});

module.exports = router;
