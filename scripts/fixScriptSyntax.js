const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove require('fs') and require('path')
  content = content.replace("const fs = require('fs');\nconst path = require('path');\n", "");
  content = content.replace("const fs = require('fs');\r\nconst path = require('path');\r\n", "");
  content = content.replace("const fs = require('fs');\n", "");
  content = content.replace("const path = require('path');\n", "");

  // Remove duplicate let currentTaskFilter = 'all'; at line 2268
  const dupFilter1 = "let dailyTasksState = loadTasksState();\n    let currentTaskFilter = 'all';";
  const repFilter1 = "let dailyTasksState = loadTasksState();";
  if (content.includes(dupFilter1)) {
    content = content.replace(dupFilter1, repFilter1);
  }
  const dupFilter1Crlf = "let dailyTasksState = loadTasksState();\r\n    let currentTaskFilter = 'all';";
  if (content.includes(dupFilter1Crlf)) {
    content = content.replace(dupFilter1Crlf, repFilter1);
  }

  // Remove duplicate declaration of currentTaskFilter if any other remains
  const filterDeclMatches = content.match(/let currentTaskFilter = 'all';/g) || [];
  if (filterDeclMatches.length > 1) {
    let count = 0;
    content = content.replace(/let currentTaskFilter = 'all';/g, (match) => {
      count++;
      return count === 1 ? match : "";
    });
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned syntax in: ${filePath}`);
}

['client/index.html', 'index.html', 'client/public/index.html'].forEach(f => {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    fixFile(p);
  }
});
