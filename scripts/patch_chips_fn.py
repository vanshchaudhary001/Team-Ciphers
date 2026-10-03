import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('client/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

idx = c.find('function updateLiveCopilotChips(tasks) {')
if idx != -1:
    idx_end = c.find('\n    }', idx)
    old_fn = c[idx:idx_end+6]
    new_fn = '''function updateLiveCopilotChips(tasks) {
      const emp = currentLiveDashboard?.employee || currentAuthenticatedUser;
      renderSuggestedFaqQuestions(emp);
    }'''
    c = c[:idx] + new_fn + c[idx_end+6:]
    print("Replaced updateLiveCopilotChips with renderSuggestedFaqQuestions call")

with open('client/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
with open('client/public/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("[OK] Saved files")
