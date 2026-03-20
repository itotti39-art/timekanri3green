import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = ['src/components', 'src/types', 'src/store', 'src/lib', 'src'];
let files = [];

dirs.forEach(dir => {
  const fullDir = path.join(__dirname, dir);
  if (!fs.existsSync(fullDir)) return;
  const list = fs.readdirSync(fullDir);
  list.forEach(file => {
    const fullPath = path.join(fullDir, file);
    if (fs.statSync(fullPath).isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  });
});

files.forEach(fullPath => {
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;
  content = content.replace(/\bhourlyRate\b/g, 'hourly_rate');
  content = content.replace(/\buserId\b/g, 'user_id');
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${fullPath}`);
  }
});
