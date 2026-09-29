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
    }
  ): Promise<{
    answer: string;
    model: string;
    poweredBy: string;
    suggestedAction?: string;
  }> {
    const role = context?.role || 'Core Tech Head';
    const company = context?.company || 'Google (Alphabet Inc.)';
    const branch = context?.branch || 'Bangalore Global Tech Center';
    const buddyName = context?.buddyName || 'Devon Vance';
    const hrName = context?.hrName || 'Sarah Jenkins';

    const systemPrompt = `You are Start Smart AI Onboarding Copilot, an enterprise-grade onboarding intelligence assistant powered by NVIDIA NIM inference.
Current employee profile:
- Role / Field: ${role}
- Organization: ${company}
- Office Branch: ${branch}
- Assigned Onboarding Buddy: ${buddyName} (Senior Technical Mentor)
- Assigned HR People Partner: ${hrName}
${context?.currentBlocker ? `- Active Blocker: ${context.currentBlocker}` : ''}
${context?.pendingTasks ? `- Pending Day-1 Tasks: ${context.pendingTasks.join(', ')}` : ''}

Instructions:
1. Provide actionable, concise, empathetic, and professional onboarding guidance tailored to their role and day-one readiness.
2. If blocked by a technical access barrier (such as VPN or repo access), emphasize what high-value work (like SideQuests or documentation review) they can do right now, and instruct them to notify their buddy or HR partner.
3. Keep responses structured, helpful, and under 150 words.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    const aiResponse = await this.generateCompletion(messages, 250, 0.4);

    if (aiResponse) {
      return {
        answer: aiResponse,
        model: this.defaultModel,
        poweredBy: 'NVIDIA NIM (Microservice Inference)',
      };
    }

    // Heuristic fallback if API is unreachable
    return {
      answer: `As a ${role} at ${company} (${branch}), your first priority is completing identity setup, reviewing architectural standards, and syncing with your assigned buddy ${buddyName} at today's 2:00 PM session. If you encounter any access blockers, HR Partner ${hrName} guarantees resolution within 30 minutes.`,
      model: `${this.defaultModel} (Heuristic Fallback)`,
      poweredBy: 'Start Smart Dependency Engine + NVIDIA Rulebook',
      suggestedAction: `Connect with buddy ${buddyName} or check today's Day-1 checklist.`,
    };
  }
}

export const nvidiaClient = new NvidiaClient();
