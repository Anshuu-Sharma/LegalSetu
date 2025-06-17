// server/src/services/aiVisionService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const { convertPdfToImage } = require('../utils/pdfToImage');
const fs = require('fs');

class AIVisionService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async detectFormFields(filePath, targetLanguage = 'en') {
    try {
      // Convert PDF to PNG image and get dimensions
      const { outputPath, height: imageHeight, width: imageWidth } = await convertPdfToImage(filePath);
      const imageBuffer = fs.readFileSync(outputPath);
      const imageData = this.fileToGenerativePart(imageBuffer, "image/png");


      const prompt = `
        Analyze this form image and identify all form fields (text fields, checkboxes, etc.).
        For each field, extract:
        1. The field label or description
        2. The field type (text, checkbox, radio, etc.)
        3. The precise coordinates of the field as [x, y, x2, y2] where:
           - x, y is the top-left corner (image coordinate system, y increases downward)
           - x2, y2 is the bottom-right corner
           - All values should be in pixels
        Return the results as a JSON array in this exact format:
        [
          {
            "id": "field_1",
            "label": "Full Name",
            "type": "text",
            "rect": [x, y, x2, y2]
          }
        ]
        Be very precise with the coordinates. Use the image dimensions to calculate accurate positions.
      `;

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      const formFields = this.extractJsonFromResponse(text);

      if (targetLanguage !== 'en') {
      const translatedFields = await this.translateFieldLabels(formFields, targetLanguage);
      return { formFields: translatedFields, imageHeight, imageWidth };
    }
    
    return { formFields, imageHeight, imageWidth };
  } catch (error) {
    console.error('AI Vision form field detection error:', error);
    return { formFields: this.getFallbackFields(), imageHeight: 1000, imageWidth: 800 };
  }
}


  fileToGenerativePart(buffer, mimeType) {
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  }

  extractJsonFromResponse(text) {
    try {
      const cleanText = text.replace(/``````/g, '');
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse JSON from AI response:', error);
      return this.getFallbackFields();
    }
  }

  getFallbackFields() {
    return [
      { id: 'field_1', label: 'Name__', type: 'text', rect: [100, 100, 400, 130] },
      { id: 'field_2', label: 'Age', type: 'number', rect: [450, 100, 500, 130] },
      { id: 'field_3', label: 'College', type: 'text', rect: [100, 150, 400, 180] }
    ];
  }


  async translateFieldLabels(formFields, targetLanguage) {
    try {
      const translatedFields = [];
      
      for (const field of formFields) {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: field.label,
              targetLang: targetLanguage,
              sourceLang: 'en'
            })
          });
          
          const data = await response.json();
          const translatedLabel = data.translation || field.label;
          
          translatedFields.push({
            ...field,
            originalLabel: field.label,
            label: translatedLabel
          });
        } catch (error) {
          console.warn('Translation failed for field:', field.label);
          translatedFields.push(field);
        }
      }
      
      return translatedFields;
    } catch (error) {
      console.error('Field translation error:', error);
      return formFields;
    }
  }
}

module.exports = new AIVisionService();
