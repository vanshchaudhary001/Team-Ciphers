import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('data/org_structure.json', 'r', encoding='utf-8') as f:
    org_data = json.load(f)

# Extract all positions from org_structure.json
org_positions = []
for d in org_data['departments']:
    d_name = d['name']
    d_num = d.get('deptNumber', 0)
    for b in d.get('branches', []):
        b_name = b['name']
        for sb in b.get('subBranches', []):
            sb_name = sb['name']
            for t in sb.get('teams', []):
                t_name = t['name']
                for p in t.get('positions', []):
                    org_positions.append({
                        'dept': d_name,
                        'deptNumber': d_num,
                        'branch': b_name,
                        'subBranch': sb_name,
                        'team': t_name,
                        'posId': p['id'],
                        'title': p['title'],
                        'fullTitle': p.get('fullTitle', ''),
                        'roleLevel': p.get('roleLevel', '')
                    })

print(f"Total positions in org_structure.json: {len(org_positions)}")

# Let's count by roleLevel
by_level = {'Associate': [], 'Lead': [], 'Manager': []}
for p in org_positions:
    rl = p['roleLevel']
    if rl in by_level:
        by_level[rl].append(p)

print(f"Associates in org: {len(by_level['Associate'])}")
print(f"Leads in org: {len(by_level['Lead'])}")
print(f"Managers in org: {len(by_level['Manager'])}")

# Check first 5 of each
print("\nFirst 5 Associates:")
for p in by_level['Associate'][:5]:
    print(f"  {p['posId']} | {p['dept']} | {p['subBranch']} | {p['fullTitle']}")

print("\nFirst 5 Leads:")
for p in by_level['Lead'][:5]:
    print(f"  {p['posId']} | {p['dept']} | {p['subBranch']} | {p['fullTitle']}")

print("\nFirst 5 Managers:")
for p in by_level['Manager'][:5]:
    print(f"  {p['posId']} | {p['dept']} | {p['subBranch']} | {p['fullTitle']}")
