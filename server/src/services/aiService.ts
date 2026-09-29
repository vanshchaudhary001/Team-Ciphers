import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';
import { BlockerAnalysis, diagnoseBlocker } from './dependencyEngine.js';

export interface AIUnstickResponse {
  answer: string;
  matchedTaskId?: string;
  matchedTaskTitle?: string;
  diagnosis?: BlockerAnalysis;
  citedSources: Array<{
    id: string;
    title: string;
    sourceUrl?: string | null;
    excerpt: string;
  }>;
  suggestedAction: string;
  requiresHumanHandoff: boolean;
  handoffTarget?: string;
  isAiGrounded: boolean;
}

export class AIService {
  /**
   * Process natural-language UNSTICK query for an employee
   */
  async processUnstickQuery(
    employeeUserId: string,
    query: string,
    specificTaskId?: string
  ): Promise<AIUnstickResponse> {
    const user = await prisma.user.findUnique({
      where: { id: employeeUserId },
      include: {
        employeeProfile: {
          include: {
            journeys: {
              include: {
                tasks: {
                  include: { ownerGroup: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.employeeProfile) {
      throw new Error('Employee profile not found');
    }

    const companyId = user.companyId;
    const activeJourney = user.employeeProfile.journeys[0];
    if (!activeJourney) {
      throw new Error('Active onboarding journey not found');
    }

    const tasks = activeJourney.tasks;
    const lowerQuery = query.toLowerCase();

    // 1. Identify target task either from parameter or semantic keyword matching
    let targetTask = specificTaskId ? tasks.find((t) => t.id === specificTaskId) : undefined;

    if (!targetTask) {
      // Find best match in tasks
      for (const t of tasks) {
        const titleLower = t.title.toLowerCase();
        const keywords = titleLower.split(/\s+/);
        if (
          lowerQuery.includes(titleLower) ||
          keywords.some((kw) => kw.length > 3 && lowerQuery.includes(kw))
        ) {
          targetTask = t;
          break;
        }
      }
    }

    // Default to the first locked or waiting task if none matched directly
    if (!targetTask) {
      targetTask = tasks.find((t) => t.state === 'LOCKED' || t.state === 'WAITING') || tasks[0];
    }

    // 2. Fetch approved company knowledge sources
    const knowledgeSources = await prisma.knowledgeSource.findMany({
      where: {
        companyId,
        status: 'APPROVED',
      },
    });

    // Match relevant sources
    const matchingSources = knowledgeSources.filter((ks) => {
      const text = `${ks.title} ${ks.excerpt} ${ks.content}`.toLowerCase();
      const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
      return queryWords.some((w) => text.includes(w)) || (targetTask && text.includes(targetTask.title.toLowerCase()));
    });

    // 3. Diagnose the blocker deterministically using Dependency Engine
    let diagnosis: BlockerAnalysis | undefined;
    if (targetTask) {
      diagnosis = await diagnoseBlocker(targetTask.id, query);
    }

    // 4. Formulate the response
    let answer = '';
    let requiresHumanHandoff = false;
    let handoffTarget: string | undefined;

    const isSensitive =
      lowerQuery.includes('salary') ||
      lowerQuery.includes('harassment') ||
      lowerQuery.includes('medical') ||
      lowerQuery.includes('grievance') ||
      lowerQuery.includes('personal') ||
      lowerQuery.includes('offer');

    if (isSensitive) {
      requiresHumanHandoff = true;
      handoffTarget = 'HR_ADMIN';
      answer =
        'This request involves sensitive personal or company policy matters. For your privacy and security, I am routing this directly to HR Administration for confidential human assistance.';
    } else if (diagnosis && diagnosis.rootBlockerId !== diagnosis.affectedTaskId) {
      // Upstream blocker detected!
      answer = `You are currently blocked on "${diagnosis.affectedTaskTitle}" because its prerequisite "${diagnosis.rootBlockerTitle}" is waiting on ${diagnosis.responsibleOwnerGroupName}. ${diagnosis.downstreamImpactCount} downstream tasks are currently affected. While waiting, you can complete available SideQuests like ${diagnosis.availableSideQuests.map((s) => s.title).join(', ') || 'Security Training'}.`;
    } else if (matchingSources.length > 0) {
      const topSource = matchingSources[0];
      answer = `According to verified documentation "${topSource.title}": ${topSource.excerpt}`;
    } else {
      // No verified source found - record knowledge gap
      await this.recordKnowledgeGap(companyId, query, targetTask?.id);
      requiresHumanHandoff = true;
      handoffTarget = 'MANAGER';
      answer =
        "I couldn't find an approved company resource that answers this question. I have logged this knowledge gap for HR, and you can connect with your Buddy or Manager for direct help.";
    }

    const citedSources = matchingSources.slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title,
      sourceUrl: s.sourceUrl,
      excerpt: s.excerpt,
    }));

    return {
      answer,
      matchedTaskId: targetTask?.id,
      matchedTaskTitle: targetTask?.title,
      diagnosis,
      citedSources,
      suggestedAction: diagnosis?.suggestedAction || 'Review knowledge guides or request buddy assistance.',
      requiresHumanHandoff,
      handoffTarget,
      isAiGrounded: matchingSources.length > 0 || !!diagnosis,
    };
  }

  /**
   * Records or increments repeated questions in KnowledgeGap
   */
  async recordKnowledgeGap(companyId: string, question: string, taskId?: string) {
    try {
      const normalized = question.trim().toLowerCase().slice(0, 120);
      const existing = await prisma.knowledgeGap.findFirst({
        where: { companyId, normalizedQuestion: normalized },
      });

      if (existing) {
        await prisma.knowledgeGap.update({
          where: { id: existing.id },
          data: { occurrenceCount: { increment: 1 } },
        });
      } else {
        await prisma.knowledgeGap.create({
          data: {
            companyId,
            normalizedQuestion: normalized,
            relevantTaskId: taskId,
            category: 'ACCESS',
            status: 'OPEN',
            suggestedOwner: 'HR / IT Documentation Team',
          },
        });
      }
    } catch (err) {
      logger.error('Error logging knowledge gap:', err);
    }
  }
}

export const aiService = new AIService();
