const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function analyzeImage(imageUrl) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Analyze the image at ${imageUrl} and determine if it shows signs of disaster or emergency situation. Provide a confidence score (0-1) and identify any potential manipulation or inconsistencies in the image.`;

    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{
          parts: [{
            text: prompt,
            inlineData: {
              mimeType: 'text/plain',
              data: imageUrl
            }
          }]
        }],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`
        }
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
    
    // Parse the response to extract confidence score and analysis
    const analysis = {
      text: result,
      score: parseFloat(result.match(/confidence score: (\d+(?:\.\d+)?)/)?.[1] || 0),
      manipulated: result.toLowerCase().includes('manipulation') || result.toLowerCase().includes('inconsistency')
    };

    return analysis;
  } catch (error) {
    console.error('Gemini image analysis error:', error);
    throw error;
  }
}

async function verifyDisasterReport(reportText) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Analyze the following disaster report and verify its credibility:
    Report: ${reportText}
    
    Provide:
    1. Confidence score (0-1) that this is a genuine disaster report
    2. Any potential inconsistencies or red flags
    3. Estimated severity level (low, medium, high, critical)`;

    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`
        }
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
    
    // Parse the response
    const analysis = {
      text: result,
      score: parseFloat(result.match(/confidence score: (\d+(?:\.\d+)?)/)?.[1] || 0),
      severity: result.match(/severity level: (\w+)/)?.[1] || 'unknown',
      flags: result.toLowerCase().includes('red flags') || result.toLowerCase().includes('inconsistencies')
    };

    return analysis;
  } catch (error) {
    console.error('Gemini report verification error:', error);
    throw error;
  }
}

module.exports = {
  analyzeImage,
  verifyDisasterReport
};
