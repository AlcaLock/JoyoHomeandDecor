const fs = require('fs');
const path = require('path');

const envFilePath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
const apiUrl = process.env.PUBLIC_API_URL || 'https://your-production-api-url.com';

const content = fs.readFileSync(envFilePath, 'utf8');
const updated = content.replace(/apiURL:\s*'[^']*'/, `apiURL: '${apiUrl}'`);

if (content === updated) {
  console.warn('No se encontró apiURL para reemplazar en environment.ts');
} else {
  fs.writeFileSync(envFilePath, updated, 'utf8');
  console.log(`PUBLIC_API_URL configurada en environment.ts: ${apiUrl}`);
}
