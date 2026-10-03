import json
import re

def analyze_tree():
    with open('scripts/parsed_docx_lines.txt', 'r', encoding='utf-8') as f:
        raw_lines = [l.rstrip('\r\n') for l in f]

    dept_regex = re.compile(r'^\s*(\d+)\.\s+(.+)$')
    pos_regex = re.compile(r'^(.*?)(Associate|Lead|Manager)\s*[-–—]\s*(.+)$')

    # We want to trace stack of structural nodes based on indentation / prefix depth
    departments = []
    current_dept = None
    
    # We will build structured hierarchy
    for line_idx, line in enumerate(raw_lines):
        if not line.strip():
            continue
            
        m_dept = dept_regex.match(line.strip())
        if m_dept:
            dept_num = int(m_dept.group(1))
            dept_name = m_dept.group(2).strip()
            current_dept = {
                'id': f"DEP-{dept_num:02d}",
                'code': f"DEP_{dept_num:02d}",
                'dept_num': dept_num,
                'name': dept_name,
                'branches': [],
                '_stack': [] # stack of (depth, node_obj)
            }
            departments.append(current_dept)
            continue
            
        if not current_dept:
            continue
            
        # Determine depth in tree
        # Count leading tree components: each column is either "│   " or "    " or "├── " or "└── "
        # Let's count characters before the node label
        match_tree = re.match(r'^([│\s├└─]+)(.*)$', line)
        if not match_tree:
            continue
            
        prefix = match_tree.group(1)
        content = match_tree.group(2).strip()
        if not content:
            continue
            
        # Depth can be calculated from prefix length or by counting segments (usually 4 chars per level)
        # e.g.:
        # "├── Branch" -> prefix length ~ 4 -> depth 1
        # "│   ├── SubBranch" -> prefix length ~ 8 -> depth 2
        # "│   │   ├── Team / Position" -> prefix length ~ 12 -> depth 3
        # "│   │   │   ├── Position" -> prefix length ~ 16 -> depth 4
        
        # Let's approximate depth:
        # Standard unicode tree branch is 4 chars per level
        depth = (len(prefix) + 2) // 4
        
        # Check if content is a position
        m_pos = re.match(r'^(Associate|Lead|Manager)\s*[-–—]\s*(.+)$', content)
        if m_pos:
            role_level = m_pos.group(1).strip()
            title = m_pos.group(2).strip()
            full_title = f"{role_level} - {title}"
            
            # Position belongs to the deepest structural node in the stack
            active_struct = current_dept['_stack'][-1][1] if current_dept['_stack'] else None
            
            # Extract path from stack
            path_names = [s[1]['name'] for s in current_dept['_stack']]
            branch_name = path_names[0] if len(path_names) > 0 else 'General'
            sub_branch_name = path_names[1] if len(path_names) > 1 else branch_name
            team_name = path_names[2] if len(path_names) > 2 else sub_branch_name
            
            pos_item = {
                'id': f"POS-{len(positions_all)+1:04d}",
                'departmentId': current_dept['id'],
                'departmentName': current_dept['name'],
                'branch': branch_name,
                'subBranch': sub_branch_name,
                'team': team_name,
                'roleLevel': role_level, # Associate | Lead | Manager
                'title': title,
                'fullTitle': full_title,
                'hierarchyPath': f"{current_dept['name']} > {branch_name} > {sub_branch_name} > {team_name} > {role_level} > {title}",
                'depth': depth
            }
            positions_all.append(pos_item)
            if active_struct:
                active_struct['positions'].append(pos_item)
        else:
            # It is a structural container (Branch / SubBranch / Team)
            node_item = {
                'name': content,
                'depth': depth,
                'children': [],
                'positions': []
            }
            
            # Pop stack to find parent
            while current_dept['_stack'] and current_dept['_stack'][-1][0] >= depth:
                current_dept['_stack'].pop()
                
            if current_dept['_stack']:
                current_dept['_stack'][-1][1]['children'].append(node_item)
            else:
                current_dept['branches'].append(node_item)
                
            current_dept['_stack'].append((depth, node_item))

    # Clean up _stack before exporting
    for d in departments:
        del d['_stack']
        
    return departments, positions_all

positions_all = []
departments, positions = analyze_tree()

print(f"Successfully processed {len(departments)} departments and {len(positions)} positions.")

# Check counts per department
for d in departments:
    dept_pos = [p for p in positions if p['departmentId'] == d['id']]
    assoc_pos = [p for p in dept_pos if p['roleLevel'] == 'Associate']
    lead_pos = [p for p in dept_pos if p['roleLevel'] == 'Lead']
    mgr_pos = [p for p in dept_pos if p['roleLevel'] == 'Manager']
    print(f"{d['id']}: {d['name']} -> Total: {len(dept_pos)} (Assoc: {len(assoc_pos)}, Lead: {len(lead_pos)}, Mgr: {len(mgr_pos)})")

with open('data/org_structure.json', 'w', encoding='utf-8') as f:
    json.dump({
        'departments': departments,
        'positions': positions,
        'summary': {
            'totalDepartments': len(departments),
            'totalPositions': len(positions),
            'associateCount': len([p for p in positions if p['roleLevel'] == 'Associate']),
            'leadCount': len([p for p in positions if p['roleLevel'] == 'Lead']),
            'managerCount': len([p for p in positions if p['roleLevel'] == 'Manager'])
        }
    }, f, indent=2, ensure_ascii=False)

print("Saved to data/org_structure.json")
