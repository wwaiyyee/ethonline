// Test legacy Gemini API key with v1 endpoint
const fetch = require('node-fetch');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const body = {
  contents: [{
    parts: [{ text: "Say hello in one word" }]
  }]
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Legacy API key works!');
  console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
