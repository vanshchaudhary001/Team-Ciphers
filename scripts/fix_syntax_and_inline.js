const fs = require('fs');
const path = require('path');

const orgData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/org_structure.json'), 'utf8'));
const orgDataJson = JSON.stringify(orgData);

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Ensure window.AUTHORITATIVE_ORG_STRUCTURE is synchronously inlined at the top of the script
  if (!content.includes('window.AUTHORITATIVE_ORG_STRUCTURE =')) {
    content = content.replace(
      '<script>',
      '<script>\n    window.AUTHORITATIVE_ORG_STRUCTURE = ' + orgDataJson + ';\n'
    );
  } else {
    // If it's already there or in an external script, replace the getAuthoritativeOrgData fallback
    content = content.replace(
      'return { departments: [] };',
      'return window.AUTHORITATIVE_ORG_STRUCTURE || ' + orgDataJson + ';'
    );
  }

  // Fix 2: Remove duplicate 'let currentSelectedCompany'
  content = content.replace(
    'let currentSelectedCompany = \'microsoft\';\n    let currentSelectedDept = null;',
    'currentSelectedCompany = \'microsoft\';\n    let currentSelectedDept = null;'
  );
  // Also handle CRLF if present
  content = content.replace(
    'let currentSelectedCompany = \'microsoft\';\r\n    let currentSelectedDept = null;',
    'currentSelectedCompany = \'microsoft\';\r\n    let currentSelectedDept = null;'
  );

  // Fix 3: Ensure goToStep('step-gateway') runs on load AND immediately inline so initial render never gets stuck
  if (!content.includes('// Immediate initial step set')) {
    content = content.replace(
      'goToStep(\'step-gateway\');\n      resetCorporateSlideTimer();',
      '// Immediate initial step set\n      goToStep(\'step-gateway\');\n      resetCorporateSlideTimer();'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');

  // Validate script syntax
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  let blockIndex = 0;
  let allValid = true;
  while ((m = scriptRegex.exec(content)) !== null) {
    blockIndex++;
    const code = m[1];
    if (!code.trim()) continue;
    try {
      new Function(code);
      console.log(`[${path.basename(filePath)}] Script block ${blockIndex}: VALID SYNTAX (${code.length} chars)`);
    } catch (e) {
      console.error(`[${path.basename(filePath)}] SYNTAX ERROR in script block ${blockIndex}:`, e.message);
      allValid = false;
    }
  }

  return allValid;
}

const rootValid = updateFile(path.join(__dirname, '../index.html'));
const clientValid = updateFile(path.join(__dirname, '../client/index.html'));
const publicValid = updateFile(path.join(__dirname, '../client/public/index.html'));

console.log('Results: root =', rootValid, ', client =', clientValid, ', public =', publicValid);
