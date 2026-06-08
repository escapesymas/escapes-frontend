const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { regex: /racing-orange/g, replace: 'tech-yellow' },
  { regex: /text-white/g, replace: 'text-tech-text' },
  { regex: /bg-black/g, replace: 'bg-tech-carbon' },
  { regex: /bg-zinc-950/g, replace: 'bg-tech-card' },
  { regex: /bg-zinc-900/g, replace: 'bg-[#1a1b1e]' },
  { regex: /bg-zinc-800/g, replace: 'bg-tech-border' },
  { regex: /border-zinc-800/g, replace: 'border-tech-border' },
  { regex: /text-zinc-500/g, replace: 'text-tech-muted' },
  { regex: /text-zinc-400/g, replace: 'text-[#cbd5e1]' },
  { regex: /shadow-orange-500\/10/g, replace: 'shadow-yellow-500/10' },
  { regex: /hover:bg-orange-600/g, replace: 'hover:bg-yellow-500' },
  { regex: /shadow-orange-950\/20/g, replace: 'shadow-yellow-950/20' }
];

walk('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (let r of replacements) {
      content = content.replace(r.regex, r.replace);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
