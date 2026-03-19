import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/components/Home.tsx',
  'src/components/Monthly.tsx',
  'src/components/Calendar.tsx',
  'src/components/Dashboard.tsx'
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Safe replacements
  content = content.replace(/session\.clockIn/g, 'session.clock_in');
  content = content.replace(/session\.clockOut/g, 'session.clock_out');
  content = content.replace(/s\.clockIn/g, 's.clock_in');
  content = content.replace(/s\.clockOut/g, 's.clock_out');
  
  content = content.replace(/r\.start\b/g, 'r.start_time');
  content = content.replace(/r\.end\b/g, 'r.end_time');
  content = content.replace(/rest\.start\b/g, 'rest.start_time');
  content = content.replace(/rest\.end\b/g, 'rest.end_time');
  
  content = content.replace(/\bclockIn:/g, 'clock_in:');
  content = content.replace(/\bclockOut:/g, 'clock_out:');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${filePath}`);
});
