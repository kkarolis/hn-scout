import * as fs from 'fs';
import * as path from 'path';

const sizes = [16, 48, 128];

function generateIconSVG(size: number): string {
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#4CAF50"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#FFF"/>
    </svg>
  `;
}

// Add this to package.json scripts
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = generateIconSVG(size);
  fs.writeFileSync(path.join(distDir, `icon${size}.png`), Buffer.from(svg));
}); 