const fs = require('fs');

const files = ['client/index.html', 'index.html', 'client/public/index.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  let removeIndex = -1;
  for (let i = 4000; i < lines.length; i++) {
    if (lines[i].includes('// Render HR Task Inventory Table with 1-Click Remove') || 
       (lines[i].includes('function renderHRTaskInventory()') && i > 3500)) {
      removeIndex = i;
      break;
    }
  }

  if (removeIndex !== -1) {
    let endIndex = -1;
    for (let j = removeIndex; j < lines.length; j++) {
      if (lines[j].includes('function applyTaskPreset')) {
        endIndex = j;
        break;
      }
    }

    if (endIndex !== -1) {
      console.log(`${file}: removing lines ${removeIndex + 1} to ${endIndex}`);
      lines.splice(removeIndex, endIndex - removeIndex);
      fs.writeFileSync(file, lines.join('\n'), 'utf8');
      console.log(`${file}: updated successfully.`);
    }
  }
});
