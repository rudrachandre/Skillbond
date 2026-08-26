const { getAIClient, model } = require('../utils/aiClient');

const parseSuggestions = (content) => {
  let cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // If the model added extra text before/after the JSON, extract just the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);
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
  const prompt = `You are a practical learning advisor. Based on this user's skills, suggest 3 to 5 related skills they might want to learn next. Return only valid JSON in exactly this shape: {"suggestions":[{"skill":"...","reason":"..."}]}. Keep each reason to one concise sentence.\nSkills they offer: ${skillsOffered}\nSkills they want to learn: ${skillsWanted}`;

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
