import { listPoliciesFromHedera } from './services/policy/chainReader.js';

async function test() {
  try {
    console.log('Testing listPoliciesFromHedera...');
    const result = await listPoliciesFromHedera(0, 50);
    console.log('Success! Got', result.policies.length, 'policies');
    console.log('Total:', result.total);
    console.log('First policy:', result.policies[0]);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full error:', error);
  }
}

test();
