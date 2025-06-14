// server/src/services/ttsService.js
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TTSService {
  constructor() {
    this.supportedLanguages = [
      { code: 'en-IN', name: 'English (India)' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ta-IN', name: 'Tamil' },
      { code: 'te-IN', name: 'Telugu' },
      { code: 'kn-IN', name: 'Kannada' },
      { code: 'ml-IN', name: 'Malayalam' },
      { code: 'bn-IN', name: 'Bengali' },
      { code: 'gu-IN', name: 'Gujarati' }
    ];
  }

  async textToSpeech(text, language) {
    try {
      // Map short language codes to BCP-47 format
      const languageMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'or': 'or-IN',
        'pa': 'pa-IN',
        'as': 'as-IN',
        'ne': 'ne-NP',
        'ur': 'ur-IN'
      };
      
      const langCode = languageMap[language] || 'en-IN';
      
      // Using Google Cloud Text-to-Speech API
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`,
        {
          input: { text },
          voice: { languageCode: langCode, ssmlGender: 'NEUTRAL' },
          audioConfig: { audioEncoding: 'MP3' }
        }
      );

      const audioContent = response.data.audioContent;
      const fileName = `tts_${Date.now()}.mp3`;
      const filePath = path.join('uploads', 'audio', fileName);
      
      // Ensure directory exists
      await fs.mkdir(path.join('uploads', 'audio'), { recursive: true });
      
      // Save audio file
      await fs.writeFile(filePath, Buffer.from(audioContent, 'base64'));
      
      return {
        audioUrl: `/api/forms/audio/${fileName}`,
        fileName
      };
    } catch (error) {
      console.error('TTS error:', error);
      throw new Error('Failed to generate speech');
    }
  }
}

module.exports = new TTSService();
