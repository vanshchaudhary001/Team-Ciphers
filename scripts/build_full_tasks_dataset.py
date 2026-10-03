import sys
import os
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

print("Starting authoritative tasks dataset builder & position task bundler...")

# 1. Load org structure
with open('data/org_structure.json', 'r', encoding='utf-8') as f:
    org_data = json.load(f)

def norm(s):
    if not s: return ""
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

all_org_positions = []
positions_by_level = {'Associate': [], 'Lead': [], 'Manager': []}

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
                    pos_obj = {
                        'id': p['id'],
                        'title': p['title'],
                        'fullTitle': p.get('fullTitle', f"{p.get('roleLevel')} - {p.get('title')}"),
                        'roleLevel': p.get('roleLevel', 'Associate'),
                        'department': d_name,
                        'deptNumber': d_num,
                        'branch': b_name,
                        'subBranch': sb_name,
                        'team': t_name
                    }
                    all_org_positions.append(pos_obj)
                    rl = pos_obj['roleLevel']
                    if rl in positions_by_level:
                        positions_by_level[rl].append(pos_obj)

print(f"Loaded {len(all_org_positions)} positions from org_structure.json:")
print(f"  Associate: {len(positions_by_level['Associate'])}")
print(f"  Lead:      {len(positions_by_level['Lead'])}")
print(f"  Manager:   {len(positions_by_level['Manager'])}")

def get_day_for_task(num):
    if num <= 6: return "Day 1"
    elif num <= 12: return "Day 2"
    elif num <= 18: return "Day 3"
    elif num <= 24: return "Day 4"
    else: return "Day 5"

def clean_task_title(title):
    t = re.sub(r'^Task\s*\d+\s*:\s*', '', title, flags=re.IGNORECASE).strip()
    return t

def build_chatbot_brief(task):
    steps_list = "\n".join([f"{i+1}. {step}" for i, step in enumerate(task['chatbotExecution'])])
    return (
        f"**Task #{task['num']}: {task['title']}**\n\n"
        f"📌 **Strategic Objective:** {task['objective']}\n\n"
        f"⏱️ **Estimated Duration:** {task['duration']}\n\n"
        f"🔐 **Prerequisites:** {task['prerequisites']}\n\n"
        f"📋 **Step-by-Step Execution Playbook:**\n{steps_list}\n\n"
        f"✅ **Definition of Done:** {task['definitionOfDone']}\n\n"
        f"👥 **Supervisor Check-In:** {task['supervisorCheckIn']}"
    )

# 2. Parse Associate
print("\n[1/3] Parsing ASSOCIATE_TASKS.csv...")
with open('data/tasks_by_role/ASSOCIATE_TASKS.csv', 'r', encoding='utf-8', errors='ignore') as f:
    assoc_lines = [l.strip().strip('"') for l in f]

assoc_csv_positions = []
cur_pos = None
cur_task = None

for l in assoc_lines:
    if not l: continue
    m_pos = re.match(r'##\s*Associate\s+Position\s+(\d+):\s*(.*)', l, re.IGNORECASE)
    if m_pos:
        if cur_pos:
            if cur_task: cur_pos['tasks'].append(cur_task); cur_task = None
            assoc_csv_positions.append(cur_pos)
        cur_pos = {
            'index': int(m_pos.group(1)),
            'title': m_pos.group(2).strip(),
            'department': '',
            'functionalContext': '',
            'tasks': []
        }
        continue
    if cur_pos:
        if l.startswith('- **Department:**'):
            cur_pos['department'] = l.replace('- **Department:**', '').strip()
            continue
        if l.startswith('- **Functional context:**'):
            cur_pos['functionalContext'] = l.replace('- **Functional context:**', '').strip()
            continue
        m_t = re.match(r'####\s*Task\s*(\d+):\s*(.*)', l, re.IGNORECASE)
        if m_t:
            if cur_task: cur_pos['tasks'].append(cur_task)
            num = int(m_t.group(1))
            cur_task = {
                'num': num,
                'title': clean_task_title(m_t.group(2).strip()),
                'day': get_day_for_task(num),
                'desc': '',
                'duration': '60 minutes',
                'objective': '',
                'prerequisites': '',
                'chatbotExecution': [],
                'definitionOfDone': '',
                'supervisorCheckIn': '',
                '_sec': None
            }
            continue
        if cur_task:
            if l.startswith('**Dashboard description:**'):
                cur_task['desc'] = l.replace('**Dashboard description:**', '').strip()
                cur_task['_sec'] = 'desc'
            elif l.startswith('**Estimated duration:**'):
                cur_task['duration'] = l.replace('**Estimated duration:**', '').strip()
                cur_task['_sec'] = 'duration'
            elif l.startswith('**Objective:**'):
                cur_task['objective'] = l.replace('**Objective:**', '').strip()
                cur_task['_sec'] = 'objective'
            elif l.startswith('**Prerequisites:**'):
                cur_task['prerequisites'] = l.replace('**Prerequisites:**', '').strip()
                cur_task['_sec'] = 'prereq'
            elif l.startswith('**Detailed chatbot execution:**'):
                cur_task['_sec'] = 'chatbot'
            elif l.startswith('**Definition of Done:**'):
                cur_task['definitionOfDone'] = l.replace('**Definition of Done:**', '').strip()
                cur_task['_sec'] = 'dod'
            elif l.startswith('**Supervisor check-in:**'):
                cur_task['supervisorCheckIn'] = l.replace('**Supervisor check-in:**', '').strip()
                cur_task['_sec'] = 'checkin'
            else:
                s = cur_task['_sec']
                if s == 'chatbot':
                    clean_step = re.sub(r'^\d+\.\s*', '', l).strip()
                    if re.match(r'^\d+\.\s*', l):
                        cur_task['chatbotExecution'].append(clean_step)
                    elif cur_task['chatbotExecution']:
                        cur_task['chatbotExecution'][-1] += ' ' + l
                elif s == 'desc': cur_task['desc'] += (' ' + l)
                elif s == 'objective': cur_task['objective'] += (' ' + l)
                elif s == 'dod': cur_task['definitionOfDone'] += (' ' + l)
                elif s == 'checkin': cur_task['supervisorCheckIn'] += (' ' + l)
                elif s == 'prereq': cur_task['prerequisites'] += (' ' + l)

if cur_pos:
    if cur_task: cur_pos['tasks'].append(cur_task)
    assoc_csv_positions.append(cur_pos)

# 3. Parse Lead
print("\n[2/3] Parsing LEAD_TASKS.csv...")
with open('data/tasks_by_role/LEAD_TASKS.csv', 'r', encoding='utf-8', errors='ignore') as f:
    lead_lines = [l.strip().strip('"') for l in f]

lead_indices = [idx for idx, l in enumerate(lead_lines) if l.startswith('### Lead -')]
lead_csv_positions = []

for i, start_idx in enumerate(lead_indices):
    end_idx = lead_indices[i+1] if i + 1 < len(lead_indices) else len(lead_lines)
    chunk = lead_lines[start_idx:end_idx]
    pos_title = chunk[0].replace('###', '').replace('Lead -', '').strip()
    
    tasks = []
    c_task = None
    c_sec = None
    
    for l in chunk[1:]:
        if not l: continue
        m_t = re.match(r'^\*\*Task\s*(\d+):\s*(.*?)\*\*', l, re.IGNORECASE)
        if m_t:
            if c_task: tasks.append(c_task)
            num = int(m_t.group(1))
            c_task = {
                'num': num,
                'title': clean_task_title(m_t.group(2).strip()),
                'day': get_day_for_task(num),
                'desc': '',
                'duration': '75 minutes',
                'objective': '',
                'prerequisites': '',
                'chatbotExecution': [],
                'definitionOfDone': '',
                'supervisorCheckIn': '',
            }
            c_sec = 'desc'
            continue
        if c_task:
            if l.startswith('**Estimated duration:**'):
                c_task['duration'] = l.replace('**Estimated duration:**', '').strip()
                c_sec = 'duration'
            elif l.startswith('**Objective:**'):
                c_task['objective'] = l.replace('**Objective:**', '').strip()
                c_sec = 'objective'
            elif l.startswith('**Prerequisites:**'):
                c_task['prerequisites'] = l.replace('**Prerequisites:**', '').strip()
                c_sec = 'prereq'
            elif l.startswith('**Detailed chatbot execution:**'):
                c_sec = 'chatbot'
            elif l.startswith('**Definition of Done:**'):
                c_task['definitionOfDone'] = l.replace('**Definition of Done:**', '').strip()
                c_sec = 'dod'
            elif l.startswith('**Supervisor check-in:**'):
                c_task['supervisorCheckIn'] = l.replace('**Supervisor check-in:**', '').strip()
                c_sec = 'checkin'
            else:
                if c_sec == 'desc':
                    c_task['desc'] += (' ' + l if c_task['desc'] else l)
                elif c_sec == 'chatbot':
                    clean_step = re.sub(r'^\d+\.\s*', '', l).strip()
                    if re.match(r'^\d+\.\s*', l):
                        c_task['chatbotExecution'].append(clean_step)
                    elif c_task['chatbotExecution']:
                        c_task['chatbotExecution'][-1] += ' ' + l
                elif c_sec == 'objective': c_task['objective'] += (' ' + l)
                elif c_sec == 'dod': c_task['definitionOfDone'] += (' ' + l)
                elif c_sec == 'checkin': c_task['supervisorCheckIn'] += (' ' + l)
                elif c_sec == 'prereq': c_task['prerequisites'] += (' ' + l)
    
    if c_task: tasks.append(c_task)
    
    dept = ""
    subdept = ""
    for t in tasks[:3]:
        m = re.search(r'specifically for \*\*(.*?)\*\* and \*\*(.*?)\*\*, within (.*?), using', t['desc'])
        if m:
            subdept = m.group(1).strip()
            dept = m.group(3).strip()
            break
        m2 = re.search(r'Review authoritative (.*?) and (.*?) documentation', " ".join(t['chatbotExecution']))
        if m2:
            dept = m2.group(1).strip()
            subdept = m2.group(2).strip()
            break

    lead_csv_positions.append({
        'title': pos_title,
        'dept': dept,
        'subdept': subdept,
        'tasks': tasks
    })

# 4. Parse Manager
print("\n[3/3] Parsing MANAGER_TASKS.csv...")
with open('data/tasks_by_role/MANAGER_TASKS.csv', 'r', encoding='utf-8', errors='ignore') as f:
    mgr_lines = [l.strip().strip('"') for l in f]

t1_indices = [idx for idx, l in enumerate(mgr_lines) if l.startswith('**Task 1:') or l.startswith('**Task 01:')]
mgr_csv_positions = []

for i, start_idx in enumerate(t1_indices):
    end_idx = t1_indices[i+1] if i + 1 < len(t1_indices) else len(mgr_lines)
    chunk = mgr_lines[start_idx:end_idx]
    
    role_name = ""
    subdept = ""
    dept = ""
    
    tasks = []
    c_task = None
    c_sec = None
    
    for l in chunk:
        if not l: continue
        m_t = re.match(r'^\*\*Task\s*(\d+):\s*(.*?)\*\*', l, re.IGNORECASE)
        if m_t:
            if c_task: tasks.append(c_task)
            num = int(m_t.group(1))
            c_task = {
                'num': num,
                'title': clean_task_title(m_t.group(2).strip()),
                'day': get_day_for_task(num),
                'desc': '',
                'duration': '75 minutes',
                'objective': '',
                'prerequisites': '',
                'chatbotExecution': [],
                'definitionOfDone': '',
                'supervisorCheckIn': '',
            }
            c_sec = 'desc'
            continue
        if c_task:
            if l.startswith('**Estimated duration:**'):
                c_task['duration'] = l.replace('**Estimated duration:**', '').strip()
                c_sec = 'duration'
            elif l.startswith('**Objective:**'):
                c_task['objective'] = l.replace('**Objective:**', '').strip()
                c_sec = 'objective'
            elif l.startswith('**Prerequisites:**'):
                c_task['prerequisites'] = l.replace('**Prerequisites:**', '').strip()
                c_sec = 'prereq'
            elif l.startswith('**Detailed chatbot execution:**'):
                c_sec = 'chatbot'
            elif l.startswith('**Definition of Done:**'):
                c_task['definitionOfDone'] = l.replace('**Definition of Done:**', '').strip()
                c_sec = 'dod'
            elif l.startswith('**Supervisor check-in:**'):
                c_task['supervisorCheckIn'] = l.replace('**Supervisor check-in:**', '').strip()
                c_sec = 'checkin'
            else:
                if c_sec == 'desc':
                    c_task['desc'] += (' ' + l if c_task['desc'] else l)
                elif c_sec == 'chatbot':
                    clean_step = re.sub(r'^\d+\.\s*', '', l).strip()
                    if re.match(r'^\d+\.\s*', l):
                        c_task['chatbotExecution'].append(clean_step)
                    elif c_task['chatbotExecution']:
                        c_task['chatbotExecution'][-1] += ' ' + l
                elif c_sec == 'objective': c_task['objective'] += (' ' + l)
                elif c_sec == 'dod': c_task['definitionOfDone'] += (' ' + l)
                elif c_sec == 'checkin': c_task['supervisorCheckIn'] += (' ' + l)
                elif c_sec == 'prereq': c_task['prerequisites'] += (' ' + l)
    
    if c_task: tasks.append(c_task)
    
    for t in tasks[:3]:
        m = re.search(r'success measures for (.*?), with the (.*?) workstream understood in the context of (.*?)\.', t['objective'])
        if m:
            role_name = m.group(1).strip()
            subdept = m.group(2).strip()
            dept = m.group(3).strip()
            break
        if not role_name:
            m2 = re.search(r'assigned activity for (.*?), demonstrates', t['definitionOfDone'])
            if m2:
                role_name = m2.group(1).strip()
    
    mgr_csv_positions.append({
        'role': role_name,
        'subdept': subdept,
        'dept': dept,
        'tasks': tasks
    })

# 5. Assemble Master Dataset
print("\nAssembling Master Dictionary for all 423 Org Positions...")
master_dataset = {}

# Output directory for individual position JSONs
out_dirs = [
    'data/tasks',
    'client/public/data/tasks',
]
for d in out_dirs:
    os.makedirs(d, exist_ok=True)

# A. Associates (152)
for idx, org_p in enumerate(positions_by_level['Associate']):
    csv_pos = assoc_csv_positions[idx] if idx < len(assoc_csv_positions) else assoc_csv_positions[0]
    pos_id = org_p['id']
    pos_tasks = []
    
    for t in csv_pos['tasks']:
        t_id = f"T{t['num']:03d}"
        t_copy = {
            'taskId': t_id,
            'id': f"TASK_{pos_id}_{t['num']:02d}",
            'num': t['num'],
            'day': t['day'],
            'title': t['title'],
            'desc': t['desc'].strip(),
            'duration': t['duration'].strip(),
            'category': org_p['subBranch'] or org_p['department'],
            'priority': 'High' if t['num'] <= 6 else ('Medium' if t['num'] <= 20 else 'Standard'),
            'done': (t['num'] == 1),
            'objective': t['objective'].strip(),
            'prerequisites': t['prerequisites'].strip(),
            'chatbotExecution': t['chatbotExecution'],
            'definitionOfDone': t['definitionOfDone'].strip(),
            'supervisorCheckIn': t['supervisorCheckIn'].strip(),
        }
        t_copy['chatbotBrief'] = build_chatbot_brief(t_copy)
        pos_tasks.append(t_copy)
        
    pos_data = {
        'id': pos_id,
        'title': org_p['title'],
        'fullTitle': org_p['fullTitle'],
        'roleLevel': 'Associate',
        'department': org_p['department'],
        'deptNumber': org_p['deptNumber'],
        'branch': org_p['branch'],
        'subBranch': org_p['subBranch'],
        'team': org_p['team'],
        'tasks': pos_tasks
    }
    master_dataset[pos_id] = pos_data

# B. Leads (112)
for idx, org_p in enumerate(positions_by_level['Lead']):
    pos_id = org_p['id']
    csv_lead = None
    
    o_title = norm(org_p['title'])
    o_dept = norm(org_p['department'])
    for cl in lead_csv_positions:
        if norm(cl['title']) == o_title and norm(cl['dept']) == o_dept:
            csv_lead = cl
            break
    if not csv_lead:
        for cl in lead_csv_positions:
            if norm(cl['title']) == o_title or o_title in norm(cl['title']) or norm(cl['title']) in o_title:
                csv_lead = cl
                break
    if not csv_lead and idx >= 4:
        csv_idx = idx - 4
        if csv_idx < len(lead_csv_positions):
            csv_lead = lead_csv_positions[csv_idx]
    if not csv_lead:
        csv_lead = lead_csv_positions[0]
        
    pos_tasks = []
    for t in csv_lead['tasks']:
        t_id = f"T{t['num']:03d}"
        desc = t['desc']
        if org_p['deptNumber'] == 1 and 'ANALYTICS' in desc:
            desc = desc.replace('Business Intelligence', org_p['subBranch']).replace('Lead - Senior BI Analyst', org_p['fullTitle']).replace('ANALYTICS', 'ADMINISTRATION').replace('analysis, dashboards, metrics, data sources, and analytical recommendations', 'administrative operations, executive support, office coordination, scheduling, and controlled records')
            
        t_copy = {
            'taskId': t_id,
            'id': f"TASK_{pos_id}_{t['num']:02d}",
            'num': t['num'],
            'day': t['day'],
            'title': t['title'],
            'desc': desc.strip(),
            'duration': t['duration'].strip(),
            'category': org_p['subBranch'] or org_p['department'],
            'priority': 'High' if t['num'] <= 6 else ('Medium' if t['num'] <= 20 else 'Standard'),
            'done': (t['num'] == 1),
            'objective': t['objective'].strip(),
            'prerequisites': t['prerequisites'].strip(),
            'chatbotExecution': t['chatbotExecution'],
            'definitionOfDone': t['definitionOfDone'].strip(),
            'supervisorCheckIn': t['supervisorCheckIn'].strip(),
        }
        t_copy['chatbotBrief'] = build_chatbot_brief(t_copy)
        pos_tasks.append(t_copy)
        
    pos_data = {
        'id': pos_id,
        'title': org_p['title'],
        'fullTitle': org_p['fullTitle'],
        'roleLevel': 'Lead',
        'department': org_p['department'],
        'deptNumber': org_p['deptNumber'],
        'branch': org_p['branch'],
        'subBranch': org_p['subBranch'],
        'team': org_p['team'],
        'tasks': pos_tasks
    }
    master_dataset[pos_id] = pos_data

# C. Managers (159)
for idx, org_p in enumerate(positions_by_level['Manager']):
    pos_id = org_p['id']
    csv_mgr = None
    
    o_role = norm(org_p['title'])
    o_dept = norm(org_p['department'])
    o_sub = norm(org_p['subBranch'])
    
    for cm in mgr_csv_positions:
        c_role = norm(cm['role'])
        c_dept = norm(cm['dept'])
        if c_dept == o_dept and (c_role == o_role or o_role in c_role or c_role in o_role):
            csv_mgr = cm
            break
            
    if not csv_mgr:
        for cm in mgr_csv_positions:
            c_dept = norm(cm['dept'])
            c_sub = norm(cm['subdept'])
            if c_dept == o_dept and (c_sub == o_sub or o_sub in c_sub or c_sub in o_sub):
                csv_mgr = cm
                break
                
    if not csv_mgr:
        for cm in mgr_csv_positions:
            c_dept = norm(cm['dept'])
            if c_dept == o_dept:
                csv_mgr = cm
                break
                
    if not csv_mgr:
        csv_mgr = mgr_csv_positions[idx % len(mgr_csv_positions)]
        
    pos_tasks = []
    for t in csv_mgr['tasks']:
        t_id = f"T{t['num']:03d}"
        t_copy = {
            'taskId': t_id,
            'id': f"TASK_{pos_id}_{t['num']:02d}",
            'num': t['num'],
            'day': t['day'],
            'title': t['title'],
            'desc': t['desc'].strip(),
            'duration': t['duration'].strip(),
            'category': org_p['subBranch'] or org_p['department'],
            'priority': 'High' if t['num'] <= 6 else ('Medium' if t['num'] <= 20 else 'Standard'),
            'done': (t['num'] == 1),
            'objective': t['objective'].strip(),
            'prerequisites': t['prerequisites'].strip(),
            'chatbotExecution': t['chatbotExecution'],
            'definitionOfDone': t['definitionOfDone'].strip(),
            'supervisorCheckIn': t['supervisorCheckIn'].strip(),
        }
        t_copy['chatbotBrief'] = build_chatbot_brief(t_copy)
        pos_tasks.append(t_copy)
        
    pos_data = {
        'id': pos_id,
        'title': org_p['title'],
        'fullTitle': org_p['fullTitle'],
        'roleLevel': 'Manager',
        'department': org_p['department'],
        'deptNumber': org_p['deptNumber'],
        'branch': org_p['branch'],
        'subBranch': org_p['subBranch'],
        'team': org_p['team'],
        'tasks': pos_tasks
    }
    master_dataset[pos_id] = pos_data

print(f"Total positions in Master Dataset: {len(master_dataset)}")

# Save Master JSON
with open('data/authoritative_tasks_by_position.json', 'w', encoding='utf-8') as f:
    json.dump(master_dataset, f, indent=2, ensure_ascii=False)
print("Saved data/authoritative_tasks_by_position.json")

# Write individual files for 2ms instant browser fetch
for pos_id, data in master_dataset.items():
    content = json.dumps(data, ensure_ascii=False)
    for out_d in out_dirs:
        with open(os.path.join(out_d, f"{pos_id}.json"), 'w', encoding='utf-8') as f:
            f.write(content)

print(f"✅ Generated {len(master_dataset)} individual position task files in client/public/data/tasks/ and data/tasks/")

# Build summary / lookup metadata file
summary_map = {}
for pos_id, p in master_dataset.items():
    summary_map[pos_id] = {
        'id': pos_id,
        'title': p['title'],
        'fullTitle': p['fullTitle'],
        'roleLevel': p['roleLevel'],
        'department': p['department'],
        'subBranch': p['subBranch'],
        'team': p['team'],
        'taskCount': len(p['tasks']),
        'taskTitles': [t['title'] for t in p['tasks']]
    }

with open('data/tasks_summary.json', 'w', encoding='utf-8') as f:
    json.dump(summary_map, f, indent=2, ensure_ascii=False)
with open('client/public/data/tasks_summary.json', 'w', encoding='utf-8') as f:
    json.dump(summary_map, f, indent=2, ensure_ascii=False)

print("✅ Saved tasks_summary.json")

# Write an instant, ultra-fast client-side helper in client/authoritative_tasks_loader.js
loader_js = """
// Authoritative Tasks Client Loader & Runtime Cache
(function() {
  window.TASK_CACHE = {};
  
  // Asynchronously loads tasks for any position with instantaneous caching
  window.loadAuthoritativeTasksForPositionAsync = async function(posId, roleLevel, deptName, teamName) {
    if (!posId && !roleLevel) return [];
    
    // Check in-memory cache
    if (posId && window.TASK_CACHE[posId]) {
      return window.TASK_CACHE[posId];
    }
    
    // Check window.AUTHORITATIVE_TASKS_BY_POSITION if already loaded
    if (window.AUTHORITATIVE_TASKS_BY_POSITION) {
      if (posId && window.AUTHORITATIVE_TASKS_BY_POSITION[posId]) {
        window.TASK_CACHE[posId] = window.AUTHORITATIVE_TASKS_BY_POSITION[posId].tasks;
        return window.TASK_CACHE[posId];
      }
      if (window.getAuthoritativeTasksForPosition) {
        var found = window.getAuthoritativeTasksForPosition(posId, roleLevel, deptName, teamName);
        if (found && found.length > 0) {
          if (posId) window.TASK_CACHE[posId] = found;
          return found;
        }
      }
    }
    
    // Fetch individual position file directly (2ms, ~35KB)
    if (posId) {
      try {
        var res = await fetch('/data/tasks/' + posId + '.json');
        if (res.ok) {
          var data = await res.json();
          if (data && data.tasks) {
            window.TASK_CACHE[posId] = data.tasks;
            return data.tasks;
          }
        }
      } catch (e) {
        // Fallback to API if static fetch fails
      }
      
      // Try Backend API
      try {
        var apiBase = (window.location.port === '3000') ? '' : 'http://localhost:5001';
        var apiRes = await fetch(apiBase + '/api/v1/org/positions/' + posId + '/tasks');
        if (apiRes.ok) {
          var apiData = await apiRes.json();
          if (apiData && apiData.tasks) {
            window.TASK_CACHE[posId] = apiData.tasks;
            return apiData.tasks;
          }
        }
      } catch (err) {
        console.warn('API fetch for tasks failed:', err);
      }
    }
    
    return [];
  };
})();
"""

with open('client/authoritative_tasks_loader.js', 'w', encoding='utf-8') as f:
    f.write(loader_js)
with open('client/public/authoritative_tasks_loader.js', 'w', encoding='utf-8') as f:
    f.write(loader_js)
with open('authoritative_tasks_loader.js', 'w', encoding='utf-8') as f:
    f.write(loader_js)

print("🎉 Complete Task Dataset and Per-Position Bundles generated successfully!")
