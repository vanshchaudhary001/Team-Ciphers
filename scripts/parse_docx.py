import zipfile
import xml.etree.ElementTree as ET
import json

docx_path = r'data/new_datasets/data_department_role_level_labels_final (2).docx'
with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)
namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

paragraphs = root.findall('.//w:p', namespaces)
lines = []
for p in paragraphs:
    texts = [t.text for t in p.findall('.//w:t', namespaces) if t.text]
    line = ''.join(texts).strip()
    if line:
        lines.append(line)

with open('scripts/parsed_docx_lines.txt', 'w', encoding='utf-8') as f:
    for l in lines:
        f.write(l + '\n')

print(f"Extracted {len(lines)} non-empty lines from docx.")
