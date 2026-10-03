import json
import re

def parse_org():
    with open('scripts/parsed_docx_lines.txt', 'r', encoding='utf-8') as f:
        raw_lines = [l.rstrip('\r\n') for l in f]

    departments = []
    current_dept = None
    
    # We want to trace the hierarchy:
    # Department (e.g. "1. ADMINISTRATION")
    # Branch
    # Sub-Branch / Team
    # Position (Associate - ..., Lead - ..., Manager - ...)
    
    # Let's inspect all lines
    parsed_items = []
    
    # Let's examine line patterns
    dept_regex = re.compile(r'^\s*(\d+)\.\s+(.+)$')
    # Positions start with (Associate|Lead|Manager)\s*-\s*
    pos_regex = re.compile(r'(Associate|Lead|Manager)\s*[-–—]\s*(.+)$')
    
    # Let's see all lines and how tree characters (├──, └──, │) indicate depth
    for line_num, line in enumerate(raw_lines, 1):
        clean_text = line.replace('├──', '').replace('└──', '').replace('│', '').strip()
        if not clean_text:
            continue
            
        m_dept = dept_regex.match(clean_text)
        if m_dept:
            dept_id = int(m_dept.group(1))
            dept_name = m_dept.group(2).strip()
            parsed_items.append({
                'type': 'DEPARTMENT',
                'dept_num': dept_id,
                'name': dept_name,
                'raw': line,
                'line_num': line_num
            })
            continue
            
        m_pos = pos_regex.search(clean_text)
        if m_pos:
            level = m_pos.group(1).strip()
            title = m_pos.group(2).strip()
            parsed_items.append({
                'type': 'POSITION',
                'level': level,
                'title': title,
                'fullName': f"{level} - {title}",
                'raw': line,
                'line_num': line_num
            })
            continue
            
        # If it's header text before the first department:
        if not parsed_items:
            continue
            
        # Otherwise it is an intermediate structural node (Branch, Sub-Branch, or Team)
        parsed_items.append({
            'type': 'STRUCTURAL_NODE',
            'name': clean_text,
            'raw': line,
            'line_num': line_num
        })

    with open('scripts/parsed_raw_tokens.json', 'w', encoding='utf-8') as f:
        json.dump(parsed_items, f, indent=2, ensure_ascii=False)
        
    print(f"Total parsed items: {len(parsed_items)}")
    depts = [p for p in parsed_items if p['type'] == 'DEPARTMENT']
    positions = [p for p in parsed_items if p['type'] == 'POSITION']
    structs = [p for p in parsed_items if p['type'] == 'STRUCTURAL_NODE']
    print(f"Departments: {len(depts)}, Structural Nodes: {len(structs)}, Positions: {len(positions)}")

if __name__ == '__main__':
    parse_org()
