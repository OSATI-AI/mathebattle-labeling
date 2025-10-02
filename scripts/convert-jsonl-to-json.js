const fs = require('fs');
const path = require('path');

// Read JSONL file
const jsonlPath = path.join(__dirname, '../data/standards/standards_de.jsonl');
const jsonlContent = fs.readFileSync(jsonlPath, 'utf8');

// Parse JSONL to array of objects
const lines = jsonlContent.trim().split('\n');
const data = lines.map(line => JSON.parse(line));

// Write as JSON
const outputPath = path.join(__dirname, '../data/standards_de.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`Converted ${lines.length} records from JSONL to JSON`);
console.log(`Output saved to: ${outputPath}`);