import { logger } from '../utils/logger.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class NvidiaClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey =
      process.env.NVIDIA_API_KEY ||
      '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';
    this.baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    this.defaultModel = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
  }

  /**
   * Generates a chat completion using NVIDIA NIM API
   */
  async generateCompletion(
    messages: ChatMessage[],
    maxTokens: number = 350,
    temperature: number = 0.5
  ): Promise<string | null> {
    try {
      logger.info(`[NVIDIA AI] Querying model ${this.defaultModel} via ${this.baseUrl}`);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages,
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[NVIDIA AI] Error HTTP ${response.status}: ${errorText}`);
        return null;
      }

      const data = (await response.json()) as any;
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        return content ? content.trim() : null;
      }

      return null;
    } catch (err: any) {
      logger.error(`[NVIDIA AI] Network exception calling NVIDIA NIM: ${err.message}`);
      return null;
    }
  }

  /**
   * Context-aware Onboarding Copilot
   */
  async askOnboardingCopilot(
    query: string,
    context?: {
      role?: string;
      company?: string;
      branch?: string;
      currentBlocker?: string;
      pendingTasks?: string[];
      buddyName?: string;
      hrName?: string;
      datasetContext?: string;
      employeeData?: any;
    }
  ): Promise<{
    answer: string;
    model: string;
    poweredBy: string;
    suggestedAction?: string;
  }> {
    const role = context?.role || context?.employeeData?.role || 'Software Engineer';
    const company = context?.company || 'StartSmart Enterprise';
    const branch = context?.branch || context?.employeeData?.location || 'Bengaluru';
    const buddyName = context?.buddyName || context?.employeeData?.buddy?.name || 'Dhruv Agarwal';
    const hrName = context?.hrName || 'Priya Nair';

    let systemPrompt = `You are Start Smart AI Onboarding Copilot, an enterprise-grade onboarding intelligence assistant prepared for Microsoft Copilot Studio & NVIDIA NIM inference.
Always use the exact provided application dataset context to give factual, accurate answers. Do not make up fake names, contacts, or resources.`;

    if (context?.datasetContext) {
      systemPrompt += `\n\n${context.datasetContext}\n\nInstructions:
1. Answer the employee's question directly using the information above.
2. If asked about today's tasks or pending tasks, list them accurately.
3. If asked about buddies, managers, or contacts, reference their exact names, roles, emails, and phone numbers from the dataset.
4. If asked about resources or guides, provide the resource name, description, and link.
5. Keep responses concise, structured, and helpful.`;
    } else {
      systemPrompt += `\nCurrent employee profile:
- Role: ${role}
- Organization: ${company}
- Location: ${branch}
- Assigned Onboarding Buddy: ${buddyName}
- Assigned HR Partner: ${hrName}
${context?.currentBlocker ? `- Active Blocker: ${context.currentBlocker}` : ''}
${context?.pendingTasks ? `- Pending Tasks: ${context.pendingTasks.join(', ')}` : ''}`;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    const aiResponse = await this.generateCompletion(messages, 300, 0.3);

    if (aiResponse) {
      return {
        answer: aiResponse,
        model: this.defaultModel,
        poweredBy: 'NVIDIA NIM (Microservice Inference)',
      };
    }

    // High-fidelity data-grounded fallback if LLM endpoint is offline
    const emp = context?.employeeData;
    const qLower = query.toLowerCase();

    if (qLower.includes('today') || qLower.includes('complete today')) {
      const todayList = emp?.todayTasks || [];
      if (todayList.length > 0) {
        const items = todayList.map((t: any) => `• ${t.taskName} (${t.priority} priority - ${t.progress?.status || 'Pending'})`).join('\n');
        return {
          answer: `Here are your assigned tasks for today:\n${items}\n\nLet me know if you need help starting any of these!`,
          model: 'Data-Grounded Copilot Engine',
          poweredBy: 'StartSmart Onboarding Data Layer',
        };
      }
    }

    if (qLower.includes('pending') || qLower.includes('still pending')) {
      const pendingList = (emp?.tasks || []).filter((t: any) => t.progress?.status !== 'Completed');
      if (pendingList.length > 0) {
        const items = pendingList.map((t: any) => `• [${t.day}] ${t.taskName} (${t.priority} priority)`).join('\n');
        return {
          answer: `You currently have ${pendingList.length} pending onboarding tasks:\n${items}`,
          model: 'Data-Grounded Copilot Engine',
          poweredBy: 'StartSmart Onboarding Data Layer',
        };
      }
    }

    if (qLower.includes('buddy')) {
      const b = emp?.buddy;
      return {
        answer: b
          ? `Your assigned Onboarding Buddy is ${b.name} (${b.role}, ${b.team}). You can reach them via email at ${b.email} or call directly at ${b.phone}.`
          : `Your onboarding buddy is assigned through the Employee Support team (${buddyName}).`,
        model: 'Data-Grounded Copilot Engine',
        poweredBy: 'StartSmart Onboarding Data Layer',
      };
    }

    if (qLower.includes('laptop') || qLower.includes('it') || qLower.includes('access')) {
      return {
        answer: `For laptop and IT access issues, please contact IT Helpdesk (Rahul Mehta) at it@demo-company.com or phone +91 80 6789 89910. Escalation contact is IT Manager Vikram Shah.`,
        model: 'Data-Grounded Copilot Engine',
        poweredBy: 'StartSmart Onboarding Data Layer',
      };
    }

    if (qLower.includes('github')) {
      return {
        answer: `The GitHub Access Guide is available under resources at /resources/github-access. Please review the steps to request access and activate your organization credentials.`,
        model: 'Data-Grounded Copilot Engine',
        poweredBy: 'StartSmart Onboarding Data Layer',
      };
    }

    return {
      answer: `Welcome, ${emp?.name || 'Team Member'}! As a ${role} in ${branch}, your onboarding track is actively loaded. You have ${emp?.metrics?.pendingTasks ?? 'several'} pending tasks on your checklist. Feel free to ask what to complete today, check your contacts, or ask about specific setup guides!`,
      model: `${this.defaultModel} (Dataset Grounded)`,
      poweredBy: 'Start Smart Dependency Engine + NVIDIA Rulebook',
      suggestedAction: `Check today's Day-1 checklist or connect with buddy ${buddyName}.`,
    };
  }
}

export const nvidiaClient = new NvidiaClient();
