const fs = require('fs');
const file = 'lighthouse-final-prod.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const [key, category] of Object.entries(data.categories)) {
  console.log(`${category.title}: ${Math.round(category.score * 100)}`);
}
