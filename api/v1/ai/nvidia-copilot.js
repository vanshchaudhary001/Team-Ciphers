const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 900) }));
}

function hasTaskSteps(taskContext) {
  return !!(taskContext && typeof taskContext === 'object' && Array.isArray(taskContext.steps) && taskContext.steps.length);
}

function buildTaskPrompt(taskContext, mode, focusStep) {
  const t = taskContext || {};
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  const steps = (Array.isArray(t.steps) ? t.steps : []).slice(0, 15).map((s, i) => `${i + 1}. ${str(s, 500)}`).join('\n');
  let p = `\n\nThe employee is working on this onboarding task and may ask follow-up questions about it:
Task: ${str(t.title, 200)}${t.taskId ? ` (${str(t.taskId, 20)}` : ''}${t.day ? `, ${str(t.day, 20)}` : ''}${t.duration ? `, ${str(t.duration, 30)}` : ''}${t.taskId ? ')' : ''}
${t.description ? `Description: ${str(t.description, 600)}\n` : ''}${t.objective ? `Why it matters: ${str(t.objective, 600)}\n` : ''}${t.prerequisites ? `Before you start: ${str(t.prerequisites, 500)}\n` : ''}Steps:
${steps}
${t.verification ? `How to know it is done: ${str(t.verification, 400)}\n` : ''}${t.supervisor ? `Check-in with the lead: ${str(t.supervisor, 300)}\n` : ''}${Array.isArray(t.troubleshooting) && t.troubleshooting.length ? `If something goes wrong: ${t.troubleshooting.slice(0, 3).map((x) => str(x, 300)).join(' | ')}\n` : ''}
Teaching rules:
1. Questions about this task are in scope. "Step 3", "the third step", "3rd point", "next step", "it" or "this step" refer to the numbered Steps above and to the earlier conversation.
2. When asked about a step, explain THAT step only. Give: what it means in plain, simple English; how to do it as 3-5 short, concrete actions (numbered); why it matters for this task; how they will know it is done. Add one common mistake to avoid if useful.
3. If the employee says they did not understand, do not repeat the step text. Use simpler words, shorter sentences and one small everyday example.
4. Use only the details in this task, the company information and the contacts given. Do not invent URLs, tool names, people, phone numbers or policies. If a specific detail is not given, say they should confirm it with their buddy or lead.
5. Be warm and direct. Start with the answer (no "Sure!" or "Great question"). Keep it under about 180 words.`;
  const n = parseInt(String(focusStep ?? ''), 10);
  if (n && Array.isArray(t.steps) && t.steps[n - 1]) {
    p += `\n\nThe employee is asking about Step ${n} of ${t.steps.length}: "${str(t.steps[n - 1], 500)}"`;
    if (mode === 'explain_step_simpler') p += '\nThey found it hard to understand, so explain it in the simplest possible way.';
  } else if (mode === 'explain_task_simple') {
    p += '\n\nThe employee did not understand the task. Explain the whole task again in very simple words: one sentence on the goal, then one short plain line per step (numbered the same way), then ask which step they want explained in more detail.';
  }
  return p;
}

function classifyQueryScope(query, context) {
  const q = (query || '').trim();
  const lower = q.toLowerCase();

  if (q.length < 2) {
    return {
      classification: 'AMBIGUOUS',
      response: 'Could you please clarify your question? I can assist with your onboarding tasks, checklist progress, team contacts (HR, Buddy, IT, Manager), and company resources.',
    };
  }

  const isGreeting =
    /^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings|howdy)[,\s!.]*$/i.test(q) ||
    /(what\s+can\s+you\s+do|how\s+(can|do)\s+you\s+help|who\s+are\s+you|what\s+is\s+your\s+purpose|help\s+me\s+with\s+onboarding)/i.test(q);
  if (isGreeting) {
    return { classification: 'IN_SCOPE', response: '' };
  }

  const isCodingRequest =
    (/(write|create|generate|give\s+me|code)\s+(a|an|some|the)?\s*(python|javascript|typescript|c\+\+|java|rust|go|php|ruby|html|css|sql|bash|shell)?\s*(program|code|script|function|class|algorithm|regex|app|component)/i.test(lower) ||
      /^(how\s+to\s+code|debug\s+this|fix\s+my\s+code|invert\s+a\s+binary\s+tree|write\s+(python|c\+\+|java|javascript))/i.test(lower)) &&
    !/(handbook|guideline|portal|onboarding|task|github\s+access|repo\s+access)/i.test(lower);

  const isGeneralTrivia =
    /(capital\s+of|population\s+of|president\s+of|prime\s+minister\s+of|currency\s+of|tallest\s+building|highest\s+mountain|distance\s+to|speed\s+of\s+light|history\s+of\s+(rome|france|world|america|india|china|war)|when\s+was\s+.+\s+(born|founded|built)|who\s+won\s+the|olympics|world\s+cup|super\s+bowl|nobel\s+prize)/i.test(lower) ||
    /(what\s+is\s+the\s+capital|what's\s+the\s+capital|where\s+is\s+(paris|france|tokyo|london|germany|canada|australia|africa|antarctica|new\s+york|berlin))/i.test(lower);

  const isWeatherOrAstronomy =
    /(weather|temperature|forecast|is\s+it\s+raining|will\s+it\s+rain|humidity|degrees\s+outside|climate\s+change|distance\s+between\s+earth\s+and\s+moon|solar\s+system|black\s+hole|planets\s+in\s+space)/i.test(lower);

  const isEntertainment =
    /(tell\s+me\s+a\s+joke|make\s+me\s+laugh|say\s+something\s+funny|tell\s+me\s+a\s+riddle|write\s+a\s+(poem|story|song|rap)|sing\s+a\s+song|recommend\s+a\s+(movie|song|film|show|series|anime|book|game))/i.test(lower);

  const isCelebrityOrExternalFigure =
    /(who\s+is|tell\s+me\s+about)\s+(elon\s+musk|bill\s+gates|steve\s+jobs|mark\s+zuckerberg|jeff\s+bezos|taylor\s+swift|cristiano\s+ronaldo|messi|barack\s+obama|donald\s+trump|einstein|newton|shakespeare)/i.test(lower);

  const isScienceOrMath =
    /(explain\s+(quantum\s+physics|theory\s+of\s+relativity|string\s+theory|photosynthesis|dna|evolution|thermodynamics|schrodinger|gravity|black\s+hole)|calculate\s+\d+|what\s+is\s+\d+\s*[\+\-\*\/x]\s*\d+|solve\s+(this\s+math|equation|integral|derivative))/i.test(lower);

  const isLifestyleOrFood =
    /(what\s+should\s+i\s+eat|what\s+to\s+eat|dinner|lunch|breakfast|recipe\s+for|how\s+to\s+cook|diet\s+plan|workout\s+routine|symptoms\s+of|medical\s+advice|diagnose\s+my|cure\s+for)/i.test(lower) &&
    !/(cafeteria|office\s+lunch|meal\s+voucher|food\s+card|campus\s+canteen)/i.test(lower);

  const isGeneralPhilosophy =
    /(meaning\s+of\s+life|are\s+you\s+(sentient|conscious|human|alive)|do\s+you\s+have\s+feelings|what\s+is\s+love|who\s+created\s+the\s+universe|should\s+i\s+buy\s+(bitcoin|crypto|stocks?|shares?))/i.test(lower);

  if (
    isCodingRequest ||
    isGeneralTrivia ||
    isWeatherOrAstronomy ||
    isEntertainment ||
    isCelebrityOrExternalFigure ||
    isScienceOrMath ||
    isLifestyleOrFood ||
    isGeneralPhilosophy
  ) {
    return {
      classification: 'OUT_OF_SCOPE',
      response: 'Sorry, I can only help with onboarding-related questions.',
    };
  }

  if (hasTaskSteps(context?.taskContext)) {
    return { classification: 'IN_SCOPE', response: '' };
  }

  const hasTask = /(task|step|checklist|roadmap|todo|to-do|complete|completed|pending|cleared|assign|priority|critical|urgent|day\s*[1-5]|today|tomorrow|this\s+week|first\s+week|first-week|milestone|module|training|compliance|security|handbook|sso|mfa|laptop|equipment|vpn|docker|github|ide|workspace|unstick|blocker|blocked|stuck)/i.test(lower);
  const hasPeople = /(manager|reporting|lead|mentor|buddy|hr|people\s+partner|helpdesk|it\s+support|it\s+help|escalat|contact|phone|email|call|directory|who\s+(is\s+my|to\s+contact|to\s+reach|to\s+call)|role|designation|title|position|associate|employee|department|team|squad|division|campus|office|location|bengaluru|hyderabad|redmond|emp\s*id|id\s*card|badge)/i.test(lower);
  const hasProgress = /(progress|percentage|percent|%|how\s+much\s+done|how\s+many\s+tasks|completion|stats|metrics|status\s+of\s+(my\s+)?(onboarding|tasks?|checklist)|where\s+do\s+i\s+stand)/i.test(lower);
  const hasResource = /(resource|guide|doc|documentation|wiki|handbook|repo|repository|link|tools?|access|setup|configuration|install|sandbox|credentials?|password)/i.test(lower);
  const hasCompany = /(microsoft|google|amazon|stripe|salesforce|technova|finwise|medcore|startsmart|start\s*smart|aarav|rohan|priya|dhruv|rahul|diya|ananya|meera|vikram)/i.test(lower);

  if (hasTask || hasPeople || hasProgress || hasResource || hasCompany) {
    return { classification: 'IN_SCOPE', response: '' };
  }

  const words = q.split(/\s+/).filter(Boolean);
  if (words.length <= 4 || /^(what|how|why|where|when|can\s+you|explain|details|more|status|help|info|tell\s+me)[?!.]*$/i.test(q)) {
    return {
      classification: 'AMBIGUOUS',
      response: 'Could you please clarify your question? I can assist with your onboarding tasks, checklist progress, team contacts (HR, Buddy, IT, Manager), and company resources.',
    };
  }

  return {
    classification: 'OUT_OF_SCOPE',
    response: 'Sorry, I can only help with onboarding-related questions.',
  };
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { query, role, company, branch, buddyName, hrName, currentBlocker, pendingTasks, intent, retrieved, contacts, history, taskContext, mode, focusStep } = body;

    if (!query || String(query).trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A query is required' });
    }

    const scopeCheck = classifyQueryScope(query, body);
    if (scopeCheck.classification === 'OUT_OF_SCOPE') {
      return res.json({
        success: true,
        data: {
          answer: 'Sorry, I can only help with onboarding-related questions.',
          model: 'Onboarding Scope Guard',
          poweredBy: 'First-Week Maze Onboarding Policy',
          suggestedAction: 'Please ask about your first-week checklist, team contacts, or company resources.',
        },
      });
    }

    if (scopeCheck.classification === 'AMBIGUOUS') {
      return res.json({
        success: true,
        data: {
          answer: 'Could you please clarify your question? I can assist with your onboarding tasks, checklist progress, team contacts (HR, Buddy, IT, Manager), and company resources.',
          model: 'Onboarding Scope Guard',
          poweredBy: 'First-Week Maze Onboarding Policy',
        },
      });
    }

    let systemPrompt = `You are the First-Week Maze Employee Onboarding Copilot for StartSmart.
Your SOLE purpose is to assist employees with their first-week onboarding journey, daily tasks, progress, company contacts (Buddy, HR, IT Helpdesk, Manager), and department resources.

STRICT SCOPE POLICY:
1. You MUST ONLY answer questions directly pertaining to the employee's onboarding tasks, daily checklist, progress, company contacts (Buddy, HR, IT Helpdesk, Manager), and department resources.
2. If the user asks ANY question outside this onboarding scope, you MUST decline politely with exactly: "Sorry, I can only help with onboarding-related questions."
3. Keep responses concise, professional, and strictly grounded in the provided onboarding database.`;

    systemPrompt += `\nCurrent employee profile:
- Role: ${role || 'Software Engineer'}
- Organization: ${company || 'StartSmart Enterprise'}
- Location: ${branch || 'Bengaluru'}
- Assigned Onboarding Buddy: ${buddyName || 'Dhruv Agarwal'}
- Assigned HR Partner: ${hrName || 'Priya Nair'}
${currentBlocker ? `- Active Blocker: ${currentBlocker}` : ''}
${pendingTasks && pendingTasks.length ? `- Pending Tasks: ${pendingTasks.join(', ')}` : ''}`;

    if (retrieved && retrieved.length) {
      const snippets = retrieved.slice(0, 6)
        .map((r, i) => `[${i + 1}] (${r.source || 'resource'}) ${r.title || ''}: ${String(r.text || '').slice(0, 600)}`).join('\n');
      systemPrompt += `\n\nCompany information retrieved for this question:\n${snippets}`;
    }

    if (contacts && contacts.length) {
      const contactList = contacts.map(c => `- ${c.team}${c.person ? ` (${c.person})` : ''}${c.phone ? `, ${c.phone}` : ''}${c.email ? `, ${c.email}` : ''}${c.covers ? `: ${c.covers}` : ''}`).join('\n');
      systemPrompt += `\n\nSupport contacts:\n${contactList}`;
    }

    const hasTask = hasTaskSteps(taskContext);
    if (hasTask) {
      systemPrompt += buildTaskPrompt(taskContext, mode, focusStep);
    }
    const teaching = hasTask && /^explain_/.test(String(mode || ''));

    // Call NVIDIA NIM API
    let answer = null;
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...cleanHistory(history),
        { role: 'user', content: String(query).slice(0, 1000) },
      ];

      const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages,
          max_tokens: teaching ? 700 : 450,
          temperature: 0.3,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          answer = data.choices[0].message.content ? data.choices[0].message.content.trim() : null;
        }
      }
    } catch (apiErr) {
      console.warn('[Vercel Serverless] NVIDIA NIM fetch error:', apiErr.message);
    }

    if (!answer && hasTask) {
      return res.status(200).json({
        success: true,
        data: {
          answer: '',
          fallback: true,
          model: 'unavailable',
          poweredBy: 'AI Onboarding Copilot',
        },
      });
    }

    if (!answer) {
      // Fallback response grounded in context
      answer = `I'm here to support your onboarding at ${company || 'your organization'}. You can reach out to your HR Partner (${hrName || 'Priya Nair'}) or Onboarding Buddy (${buddyName || 'Dhruv Agarwal'}) for immediate assistance with your first-week checklist.`;
    }

    return res.status(200).json({
      success: true,
      data: {
        answer,
        model: NVIDIA_MODEL,
        poweredBy: 'AI Onboarding Copilot (NVIDIA NIM)',
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
};
