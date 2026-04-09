const Anthropic = require('@anthropic-ai/sdk');

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('⚠️ Missing ANTHROPIC_API_KEY in .env file!');
}

const anthropic = new Anthropic({
  apiKey: apiKey || 'dummy_key',
  // Route traffic to ModelsLab DeepSeek instead of Anthropic servers
  baseURL: 'https://modelslab.com/api/v7/llm',
});

module.exports = anthropic;
