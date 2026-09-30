const fs = require('fs');
const c = fs.readFileSync('client/index.html', 'utf8');
const start = c.indexOf('<section id="step-hr-portal"');
const end = c.indexOf('</main>');
const html = c.substring(start, end);

const stack = [];
const regex = /<(\/)?([a-zA-Z0-9\-]+)([^>]*)>/g;
let match;
let lastIdx = 0;
while ((match = regex.exec(html)) !== null) {
  const isClose = match[1] === '/';
  const tag = match[2].toLowerCase();
  if (['input', 'img', 'br', 'hr', 'meta', 'link', 'circle', 'path', 'stop', 'defs', 'rect', 'svg'].includes(tag)) continue;
  if (!isClose) {
    stack.push({ tag, full: match[0].substring(0, 40), index: match.index });
  } else {
    const last = stack.pop();
    if (last && last.tag === 'section') {
      console.log('POP SECTION at pos', match.index, 'by', match[0]);
      console.log('Surrounding text:\n' + html.substring(match.index - 100, match.index + 50));
    }
    if (!last || last.tag !== tag) {
      console.log('Mismatch at', match[0], 'at pos', match.index, 'expected', last ? last.tag : 'none');
      console.log('--- Context ---:\n' + html.substring(match.index - 500, match.index + 200));
      break;
    }
  }
}
console.log('Remaining in stack:', stack.length, stack.map(s => s.tag));
