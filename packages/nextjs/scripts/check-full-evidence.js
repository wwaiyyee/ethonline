const db = require('better-sqlite3')('.data/edgraph.sqlite');

const evidenceRow = db.prepare('SELECT evidence_json FROM evidence LIMIT 1').get();
const parsed = JSON.parse(evidenceRow.evidence_json);

console.log(JSON.stringify(parsed, null, 2));

db.close();
