const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('Testing Gemini API key...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found' : 'Not found');
    
    // Try a simple generation with gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    console.log('\n✅ API Key is valid!');
    console.log('Model: gemini-pro');
    console.log('Response:', response.text());
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nThis might be an invalid API key or restricted model access.');
    console.error('Get a new key from: https://aistudio.google.com/app/apikey');
  }
}

listModels();
