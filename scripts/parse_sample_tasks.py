import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

def inspect_associate_samples():
    print("==================== ASSOCIATE TASK SAMPLE ====================")
    with open('data/tasks_by_role/ASSOCIATE_TASKS.csv', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read(15000)
    
    # Print the first position and its first 2 tasks
    lines = [l.strip().strip('"') for l in content.split('\n') if l.strip().strip('"')]
    for l in lines[:45]:
        print(l)

def inspect_lead_samples():
    print("\n==================== LEAD TASK SAMPLE ====================")
    with open('data/tasks_by_role/LEAD_TASKS.csv', 'r', encoding='utf-8', errors='ignore') as f:
        # skip lines until first task
        for i in range(140):
            f.readline()
        lines = []
        for i in range(50):
            l = f.readline()
            if not l: break
            s = l.strip().strip('"')
            if s:
                lines.append(s)
    for l in lines[:45]:
        print(l)

def inspect_manager_samples():
    print("\n==================== MANAGER TASK SAMPLE ====================")
    with open('data/tasks_by_role/MANAGER_TASKS.csv', 'r', encoding='utf-8', errors='ignore') as f:
        lines = []
        for i in range(60):
            l = f.readline()
            if not l: break
            s = l.strip().strip('"')
            if s:
                lines.append(s)
    for l in lines[:45]:
        print(l)

if __name__ == '__main__':
    inspect_associate_samples()
    inspect_lead_samples()
    inspect_manager_samples()
