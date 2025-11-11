const fs = require('fs');
try {
  const raw = fs.readFileSync('i18n.json','utf8');
  JSON.parse(raw);
  console.log('JSON OK');
} catch (e) {
  console.error('JSON ERROR:', e.message);
  process.exit(1);
}
