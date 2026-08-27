const { getAIClient, model } = require('../utils/aiClient');

const parseSuggestions = (content) => {
  let cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && Array.isArray(parsed.suggestions)) {
      return {
        suggestions: parsed.suggestions
          .filter(({ reason, skill }) => typeof skill === 'string' && typeof reason === 'string')
          .slice(0, 5),
      };
    }
  } catch {
    // fall through to extraction below
  }

  // Extract the first balanced { ... } block that contains "suggestions"
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in AI response');

  let depth = 0;
  let end = -1;
  for (let i = start; i < cleaned.length; i += 1) {
    if (cleaned[i] === '{') depth += 1;
    if (cleaned[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error('Could not find a complete JSON object in AI response');

  const jsonSlice = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(jsonSlice);
  if (!parsed || !Array.isArray(parsed.suggestions)) throw new Error('Invalid suggestions format');

  return {
    suggestions: parsed.suggestions
      .filter(({ reason, skill }) => typeof skill === 'string' && typeof reason === 'string')
      .slice(0, 5),
  };
};

const getSkillSuggestions = async (req, res) => {
  const client = getAIClient();
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'AI suggestions are not configured. Add NVIDIA_API_KEY to the server environment.',
    });
  }

  const skillsOffered = req.user.skillsOffered.map(({ skill, level }) => `${skill} (${level})`).join(', ') || 'None yet';
  const skillsWanted = req.user.skillsWanted.map(({ skill, level }) => `${skill} (${level})`).join(', ') || 'None yet';
  const prompt = `You are a practical learning advisor. Based on the user's current skills below, think of 3 to 5 specific real-world skills that would genuinely complement what they already know. Each suggestion must be a different, specific skill name relevant to their profile (not a generic example, not "Docker" or "SQL" unless it is truly the best fit for THIS user). Each reason must be a unique, specific sentence explaining why that particular skill helps THIS user based on what they offer and want to learn.\n\nRespond with ONLY valid JSON and nothing else, in this exact structure: {"suggestions":[{"skill":"<real skill name>","reason":"<specific one-sentence reason>"}]}\n\nUser's current skills they can teach: ${skillsOffered}\nUser's current skills they want to learn: ${skillsWanted}`;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You provide concise, actionable skill recommendations as JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });
    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI returned an empty response');

    return res.json({
      success: true,
      message: 'Skill suggestions generated',
      data: parseSuggestions(content),
    });
  } catch (error) {
    console.error(`AI suggestions error: ${error.message}`);
    return res.status(502).json({
      success: false,
      message: 'We could not generate suggestions right now. Please try again later.',
    });
  }
};

module.exports = { getSkillSuggestions };
