const OpenAI = require('openai');

 const model = 'mistralai/mistral-7b-instruct-v0.3';

const getAIClient = () => {
  if (!process.env.NVIDIA_API_KEY) return null;

  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
};

module.exports = { getAIClient, model };
