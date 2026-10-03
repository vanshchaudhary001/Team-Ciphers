import json
import csv
import re
import os

def generate_data():
    docx_lines_file = 'scripts/parsed_docx_lines.txt'
    with open(docx_lines_file, 'r', encoding='utf-8') as f:
        raw_lines = [l.rstrip('\r\n') for l in f]

    dept_regex = re.compile(r'^\s*(\d+)\.\s+(.+)$')
    pos_regex = re.compile(r'^(Associate|Lead|Manager)\s*[-–—]\s*(.+)$')

    departments = []
    positions = []
    
    current_dept = None
    stack = [] # (depth, node_name)
    pos_counter = 1

    for line in raw_lines:
        sline = line.strip()
        if not sline:
            continue
            
        m_dept = dept_regex.match(sline)
        if m_dept:
            dept_num = int(m_dept.group(1))
            dept_name = m_dept.group(2).strip()
            dept_code = f"DEP_{dept_num:02d}"
            current_dept = {
                'id': f"DEP-{dept_num:02d}",
                'deptNumber': dept_num,
                'name': dept_name,
                'code': dept_code,
                'branches': []
            }
            departments.append(current_dept)
            stack = []
            continue
            
        if not current_dept:
            continue
            
        match_tree = re.match(r'^([│\s├└─]+)(.*)$', line)
        if not match_tree:
            continue
            
        prefix = match_tree.group(1)
        content = match_tree.group(2).strip()
        if not content:
            continue
            
        depth = (len(prefix) + 2) // 4
        
        m_pos = pos_regex.match(content)
        if m_pos:
            role_level = m_pos.group(1).strip()
            title = m_pos.group(2).strip()
            full_title = f"{role_level} - {title}"
            
            path_names = [s[1] for s in stack]
            branch_name = path_names[0] if len(path_names) > 0 else 'General'
            sub_branch_name = path_names[1] if len(path_names) > 1 else branch_name
            team_name = path_names[2] if len(path_names) > 2 else sub_branch_name
            
            # Canonical roleLevel mapping
            # Associate -> Entry Level
            # Lead -> Mid Level
            # Manager -> Senior Level
            role_tier = 'ENTRY' if role_level == 'Associate' else ('MID' if role_level == 'Lead' else 'SENIOR')
            
            is_ceo = (title.lower() == 'chief executive officer')
            
            pos_id = f"POS-{pos_counter:04d}"
            pos_counter += 1
            
            pos_obj = {
                'id': pos_id,
                'departmentId': current_dept['id'],
                'departmentCode': current_dept['code'],
                'departmentName': current_dept['name'],
                'branch': branch_name,
                'subBranch': sub_branch_name,
                'team': team_name,
                'roleLevel': role_level, # Associate | Lead | Manager
                'roleTier': role_tier,
                'title': title,
                'fullTitle': full_title,
                'isExecutive': is_ceo or ('Executive' in branch_name or 'Director' in title or 'Vice President' in title),
                'isCeo': is_ceo,
                'hierarchyPath': f"{current_dept['name']} > {branch_name} > {sub_branch_name} > {team_name} > {role_level} > {title}"
            }
            positions.append(pos_obj)
        else:
            # Intermediate structural node
            while stack and stack[-1][0] >= depth:
                stack.pop()
            stack.append((depth, content))

    # Build nested hierarchy tree for each department
    for d in departments:
        dept_positions = [p for p in positions if p['departmentId'] == d['id']]
        branches_dict = {}
        for p in dept_positions:
            b_name = p['branch']
            sb_name = p['subBranch']
            t_name = p['team']
            
            if b_name not in branches_dict:
                branches_dict[b_name] = {}
            if sb_name not in branches_dict[b_name]:
                branches_dict[b_name][sb_name] = {}
            if t_name not in branches_dict[b_name][sb_name]:
                branches_dict[b_name][sb_name][t_name] = []
                
            branches_dict[b_name][sb_name][t_name].append({
                'id': p['id'],
                'roleLevel': p['roleLevel'],
                'roleTier': p['roleTier'],
                'title': p['title'],
                'fullTitle': p['fullTitle'],
                'isCeo': p['isCeo'],
                'hierarchyPath': p['hierarchyPath']
            })
            
        d['branches'] = []
        for b_name, sb_map in branches_dict.items():
            branch_obj = {
                'name': b_name,
                'subBranches': []
            }
            for sb_name, t_map in sb_map.items():
                sb_obj = {
                    'name': sb_name,
                    'teams': []
                }
                for t_name, pos_list in t_map.items():
                    sb_obj['teams'].append({
                        'name': t_name,
                        'positions': pos_list
                    })
                branch_obj['subBranches'].append(sb_obj)
            d['branches'].append(branch_obj)

    print(f"Total Departments: {len(departments)}")
    print(f"Total Positions: {len(positions)}")

    # Write to JSON
    org_payload = {
        'departments': departments,
        'positions': positions,
        'summary': {
            'totalDepartments': len(departments),
            'totalPositions': len(positions),
            'associateCount': len([p for p in positions if p['roleLevel'] == 'Associate']),
            'leadCount': len([p for p in positions if p['roleLevel'] == 'Lead']),
            'managerCount': len([p for p in positions if p['roleLevel'] == 'Manager']),
            'ceoPosition': [p for p in positions if p['isCeo']]
        }
    }

    os.makedirs('data', exist_ok=True)
    with open('data/org_structure.json', 'w', encoding='utf-8') as f:
        json.dump(org_payload, f, indent=2, ensure_ascii=False)
        
    # Also write to client/public/ for static access if needed
    os.makedirs('client/public', exist_ok=True)
    with open('client/public/org_structure.json', 'w', encoding='utf-8') as f:
        json.dump(org_payload, f, indent=2, ensure_ascii=False)

    # Write CSV files
    with open('data/org_departments.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['departmentId', 'deptNumber', 'name', 'code', 'branchCount', 'positionCount'])
        for d in departments:
            dept_pos_count = len([p for p in positions if p['departmentId'] == d['id']])
            writer.writerow([d['id'], d['deptNumber'], d['name'], d['code'], len(d['branches']), dept_pos_count])

    with open('data/org_positions.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'departmentId', 'departmentName', 'branch', 'subBranch', 'team', 'roleLevel', 'roleTier', 'title', 'fullTitle', 'isCeo', 'hierarchyPath'])
        for p in positions:
            writer.writerow([p['id'], p['departmentId'], p['departmentName'], p['branch'], p['subBranch'], p['team'], p['roleLevel'], p['roleTier'], p['title'], p['fullTitle'], p['isCeo'], p['hierarchyPath']])

    print("Successfully generated authoritative org data files:")
    print(" - data/org_structure.json")
    print(" - client/public/org_structure.json")
    print(" - data/org_departments.csv")
    print(" - data/org_positions.csv")

if __name__ == '__main__':
    generate_data()
