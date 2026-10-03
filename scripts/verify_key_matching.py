import sys
import json
sys.stdout.reconfigure(encoding='utf-8')

with open('data/org_structure.json', 'r', encoding='utf-8') as f:
    org = json.load(f)

with open('data/authoritative_tasks_by_position.json', 'r', encoding='utf-8') as f:
    auth_tasks = json.load(f)

print(f"Total departments in org_structure.json: {len(org['departments'])}")
total_org_pos = 0
matched_keys = 0

for d in org['departments']:
    for b in d.get('branches', []):
        for sb in b.get('subBranches', []):
            for t in sb.get('teams', []):
                for p in t.get('positions', []):
                    total_org_pos += 1
                    p_id = p.get('id')
                    if p_id in auth_tasks:
                        matched_keys += 1
                    else:
                        print(f"Missing in auth_tasks: {p_id} {p.get('fullTitle')}")

print(f"Total org positions: {total_org_pos}")
print(f"Matched in auth_tasks: {matched_keys} / {total_org_pos}")
