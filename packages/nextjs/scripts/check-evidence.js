const db = require('better-sqlite3')('.data/edgraph.sqlite');

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

// Check evidence structure - get full JSON from one row
const evidenceRow = db.prepare('SELECT evidence_id, claim_id, evidence_json FROM evidence LIMIT 1').get();
if (evidenceRow) {
  console.log('\nEvidence sample:');
  console.log('ID:', evidenceRow.evidence_id);
  console.log('Claim:', evidenceRow.claim_id);
  console.log('JSON preview:', evidenceRow.evidence_json.substring(0, 300) + '...');

  const parsed = JSON.parse(evidenceRow.evidence_json);
  console.log('\nParsed structure:');
  console.log('- depegVerified:', parsed.depegVerified);
  console.log('- durationMinutes:', parsed.durationMinutes);
  console.log('- provenance:', parsed.provenance);
  console.log('- observations count:', parsed.observations?.length);
}

db.close();
