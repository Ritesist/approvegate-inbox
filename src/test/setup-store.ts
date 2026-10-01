import fs from 'fs';
import os from 'os';
import path from 'path';

// Point the store at a per-run temp file so `npm test` never rewrites data/store.json.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'approvegate-test-'));
const target = path.join(dir, 'store.json');
const seed = path.resolve(process.cwd(), 'data', 'store.json');
if (fs.existsSync(seed)) fs.copyFileSync(seed, target);
process.env.APPROVEGATE_STORE_PATH = target;
// Tests must never depend on (or leak) a real TypeSafe key.
delete process.env.TYPESAFE_API_KEY;
