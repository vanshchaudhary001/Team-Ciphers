import sys
import json
sys.stdout.reconfigure(encoding='utf-8')

with open('data/authoritative_tasks_by_position.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total positions in dataset: {len(data)}")

missing_tasks = 0
total_tasks = 0
empty_desc = 0
empty_brief = 0
empty_exec = 0

for pos_id, pos in data.items():
    tasks = pos.get('tasks', [])
    if len(tasks) != 30:
        missing_tasks += 1
        print(f"Warning: {pos_id} has {len(tasks)} tasks (expected 30)")
    for t in tasks:
        total_tasks += 1
        if not t.get('title') or not t.get('desc'):
            empty_desc += 1
        if not t.get('chatbotBrief'):
            empty_brief += 1
        if not t.get('chatbotExecution') or len(t.get('chatbotExecution')) == 0:
            empty_exec += 1

print(f"Total tasks verified: {total_tasks}")
print(f"Positions with != 30 tasks: {missing_tasks}")
print(f"Tasks missing title or desc: {empty_desc}")
print(f"Tasks missing chatbotBrief: {empty_brief}")
print(f"Tasks missing chatbotExecution: {empty_exec}")

# Check sample from Associate, Lead, Manager
print("\n--- SAMPLE ASSOCIATE TASK 1 ---")
p1 = data['POS-0001']
print(f"Position: {p1['fullTitle']} ({p1['department']} > {p1['subBranch']})")
t1 = p1['tasks'][0]
print(f"Title: {t1['title']}")
print(f"Desc: {t1['desc'][:120]}...")
print(f"Brief length: {len(t1['chatbotBrief'])}")

print("\n--- SAMPLE LEAD TASK 1 ---")
p2 = data['POS-0018'] # Lead - Senior BI Analyst
print(f"Position: {p2['fullTitle']} ({p2['department']} > {p2['subBranch']})")
t1_lead = p2['tasks'][0]
print(f"Title: {t1_lead['title']}")
print(f"Desc: {t1_lead['desc'][:120]}...")
print(f"Brief length: {len(t1_lead['chatbotBrief'])}")

print("\n--- SAMPLE MANAGER TASK 1 ---")
p3 = data['POS-0003'] # Manager - Executive Business Partner
print(f"Position: {p3['fullTitle']} ({p3['department']} > {p3['subBranch']})")
t1_mgr = p3['tasks'][0]
print(f"Title: {t1_mgr['title']}")
print(f"Desc: {t1_mgr['desc'][:120]}...")
print(f"Brief length: {len(t1_mgr['chatbotBrief'])}")
