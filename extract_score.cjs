const fs = require('fs');
const file = 'lighthouse-report.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const performanceScore = data.categories.performance.score * 100;
console.log(`Performance Score: ${performanceScore}`);
if (performanceScore >= 87) {
  console.log('Target score 87+ met!');
} else {
  console.log('Target score 87+ NOT met.');
}
