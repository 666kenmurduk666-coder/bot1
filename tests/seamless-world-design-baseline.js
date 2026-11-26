const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const architecture = read('SEAMLESS-MEGA-WORLD-ARCHITECTURE.md');
const master = read('MASTER-ARCHITECTURE.md');
const roadmap = read('IMPLEMENTATION-ROADMAP.md');
const checks = [
  ['official seamless decision', /selected (?:world )?layout is \*\*SEAMLESS\*\*/i.test(architecture)],
  ['company campus district', /Company Campus/.test(architecture)],
  ['central plaza district', /Central Plaza/.test(architecture)],
  ['connected adventure regions', /Adventure Regions/.test(architecture)],
  ['background asset streaming', /background.*streaming|asset streaming/i.test(architecture)],
  ['server handoff', /server handoff/i.test(architecture)],
  ['modular implementation', /modules remain isolated|implementation is still modular|separately testable/i.test(architecture)],
  ['v8 protection', /Phase D v8/.test(architecture) && /immutable rollback baseline/.test(architecture)],
  ['design-only limitation', /no seamless-world runtime is implemented/i.test(architecture)],
  ['roadmap reflects seamless', /SEAMLESS/.test(roadmap)],
  ['master reflects seamless', /SEAMLESS/.test(master)],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
console.log(`${checks.length - failed}/${checks.length} seamless-world design checks passed`);
process.exitCode = failed ? 1 : 0;
