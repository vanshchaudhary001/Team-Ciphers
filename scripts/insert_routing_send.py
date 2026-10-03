with open('client/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

target = "const lower = query.toLowerCase();"
idx = c.find(target)
if idx != -1:
    routing_code = '''
      // Comprehensive role-aware natural language query routing
      if (lower.includes('salary') || lower.includes('compensation') || lower.includes('peer review') || lower.includes('confidential performance')) {
        return runCopilotResponseWithThinking(query, getRbacRestrictedResponseHtml);
      }

      if (lower.includes('manager') || lower.includes('reporting manager') || lower.includes('who is my manager') || lower.includes('my manager')) {
        return runCopilotResponseWithThinking(query, getReportingManagerResponseHtml);
      }

      if (lower.includes('lead') || lower.includes('reporting lead') || lower.includes('who is my lead') || lower.includes('my lead')) {
        return runCopilotResponseWithThinking(query, getReportingLeadResponseHtml);
      }

      if (lower.includes('progress') || lower.includes('how much') || lower.includes('completed') || lower.includes('completion rate')) {
        return runCopilotResponseWithThinking(query, getOnboardingProgressResponseHtml);
      }

      if (lower.includes('week') || lower.includes('this week') || lower.includes('5 day') || lower.includes('remaining tasks') || lower.includes('all tasks')) {
        return runCopilotResponseWithThinking(query, getWeeklyPlanResponseHtml);
      }

      if (lower.includes('resource') || lower.includes('department resource') || lower.includes('wiki') || lower.includes('docs') || lower.includes('repo')) {
        return runCopilotResponseWithThinking(query, getDepartmentResourcesResponseHtml);
      }

      if (lower.includes('highest') || lower.includes('priority') || lower.includes('critical task') || lower.includes('urgent')) {
        return runCopilotResponseWithThinking(query, getHighestPriorityTaskResponseHtml);
      }

      if (lower.includes('associates progressing') || lower.includes('associate tasks') || lower.includes('my associates')) {
        return runCopilotResponseWithThinking(query, getLeadAssociateProgressResponseHtml);
      }

      if (lower.includes('team progressing') || lower.includes('associates behind') || lower.includes('leads working')) {
        return runCopilotResponseWithThinking(query, getManagerTeamProgressResponseHtml);
      }
'''
    c = c[:idx + len(target)] + '\n' + routing_code + c[idx + len(target):]
    print("[OK] Inserted query routing right after const lower = query.toLowerCase();")

with open('client/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
with open('client/public/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("[OK] Saved all index.html files")
