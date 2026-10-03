import sys
import os
import json
sys.stdout.reconfigure(encoding='utf-8')

print("Loading authoritative_tasks_by_position.json...")
with open('data/authoritative_tasks_by_position.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

dirs = [
    'data/tasks',
    'client/public/tasks',
    'client/tasks',
    'tasks'
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

print(f"Exporting {len(data)} positions to individual JSON files in {dirs}...")

for pos_id, pos_data in data.items():
    json_bytes = json.dumps(pos_data, ensure_ascii=False, indent=2).encode('utf-8')
    for d in dirs:
        target = os.path.join(d, f"{pos_id}.json")
        with open(target, 'wb') as f:
            f.write(json_bytes)

print("Export completed successfully!")

# Also generate a lightweight index/lookup map: posId -> { id, title, fullTitle, roleLevel, department, subBranch, team }
lookup_index = {}
for pos_id, pos_data in data.items():
    lookup_index[pos_id] = {
        'id': pos_data['id'],
        'title': pos_data['title'],
        'fullTitle': pos_data['fullTitle'],
        'roleLevel': pos_data['roleLevel'],
        'department': pos_data['department'],
        'deptNumber': pos_data.get('deptNumber', 0),
        'branch': pos_data.get('branch', ''),
        'subBranch': pos_data.get('subBranch', ''),
        'team': pos_data.get('team', ''),
        'taskCount': len(pos_data.get('tasks', []))
    }

index_bytes = json.dumps(lookup_index, ensure_ascii=False, indent=2).encode('utf-8')
with open('data/tasks_index.json', 'wb') as f:
    f.write(index_bytes)
with open('client/public/tasks_index.json', 'wb') as f:
    f.write(index_bytes)

print(f"Lookup index saved: {len(lookup_index)} positions, {len(index_bytes)} bytes.")
