const OpenAI = require('openai');

  const model = 'nvidia/nemotron-3.5-lightning-30b-a3b';

const getAIClient = () => {
  if (!process.env.NVIDIA_API_KEY) return null;

  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
};

module.exports = { getAIClient, model };
