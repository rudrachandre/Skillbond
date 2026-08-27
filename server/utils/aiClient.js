// server/utils/aiClient.js
// NVIDIA NIM (build.nvidia.com) client — OpenAI-compatible, with fallback chain.
// Catalog changes frequently — if a model 404s or gets deprecated, this
// transparently retries the next one. Controller code needs NO changes.

const OpenAI = require('openai');

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// Verified "Free Endpoint" models as of Aug 27, 2026 — build.nvidia.com/models
const MODEL_FALLBACK_CHAIN = [
  'deepseek-ai/deepseek-v4-flash-0731', // primary: stable, fresh, agentic/coding tuned
  'minimaxai/minimax-m3',               // fallback 1: high-traffic, coding+reasoning
  'mistralai/mistral-nemotron',         // fallback 2: replaces deprecated mistral-7b-instruct-v0.3
  'deepseek-ai/deepseek-v4-pro-0813',   // fallback 3: heavier, higher quality, slower
];

// Exported for logging/reference — actual calls try the whole chain regardless.
const model = MODEL_FALLBACK_CHAIN[0];

let rawClient = null;

const getRawClient = () => {
  if (!process.env.NVIDIA_API_KEY) return null;
  if (!rawClient) {
    rawClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: NIM_BASE_URL,
    });
  }
  return rawClient;
};

// Returns null if no API key is set (controller already handles this case).
// Otherwise returns an object shaped exactly like the OpenAI SDK client,
// so `client.chat.completions.create({...})` works unchanged in the controller —
// but internally it walks MODEL_FALLBACK_CHAIN until one succeeds.
const getAIClient = () => {
  const raw = getRawClient();
  if (!raw) return null;

  return {
    chat: {
      completions: {
        create: async (params) => {
          let lastError = null;

          for (const fallbackModel of MODEL_FALLBACK_CHAIN) {
            try {
              const completion = await raw.chat.completions.create({
                ...params,
                model: fallbackModel, // overrides whatever `model` the controller passed in
              });

              if (fallbackModel !== MODEL_FALLBACK_CHAIN[0]) {
                console.warn(`[aiClient] Primary model failed earlier — used fallback: ${fallbackModel}`);
              }
              return completion;
            } catch (error) {
              console.warn(`[aiClient] Model "${fallbackModel}" failed: ${error.message}`);
              lastError = error;
            }
          }

          throw new Error(`All NVIDIA NIM fallback models failed. Last error: ${lastError?.message}`);
        },
      },
    },
  };
};

module.exports = { getAIClient, model, MODEL_FALLBACK_CHAIN };