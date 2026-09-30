const fs = require('fs');
const html = fs.readFileSync('client/index.html', 'utf8');

const regex = /id=["']([^"']+)["']/g;
let match;
const ids = [];
while ((match = regex.exec(html)) !== null) {
  if (match[1].startsWith('step-')) {
    ids.push(match[1]);
  }
}
console.log('Found step IDs:', ids);

const goToRegex = /goToStep\(["']([^"']+)["']\)/g;
const gotoCalls = [];
while ((match = goToRegex.exec(html)) !== null) {
  gotoCalls.push(match[1]);
}
console.log('Found goToStep targets:', [...new Set(gotoCalls)]);

for (const target of new Set(gotoCalls)) {
  console.log(`Target: "${target}" exists in DOM?`, ids.includes(target));
}
