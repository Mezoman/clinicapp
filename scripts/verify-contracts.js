import fs from 'fs';
import { execSync } from 'child_process';

const filesToVerify = [
    'src/database.types.ts',
    'src/infrastructure/contracts/generated.schemas.ts'
];

function getContent() {
    return filesToVerify.map(file => {
        try {
            return fs.readFileSync(file, 'utf8');
        } catch {
            return null;
        }
    });
}

const before = getContent();

console.log('🔄 Synchronizing contracts...');
try {
    // Use npx to avoid issues if someone hasn't installed dependencies yet
    execSync('npm run contracts:sync', { stdio: 'inherit' });
} catch (err) {
    console.error('❌ Sync failed. Ensure SUPABASE_ACCESS_TOKEN is set in CI.');
    process.exit(1);
}

const after = getContent();

let changed = false;
for (let i = 0; i < filesToVerify.length; i++) {
    if (before[i] !== after[i]) {
        console.error(`⚠️  File changed: ${filesToVerify[i]}`);
        changed = true;
    }
}

if (changed) {
    console.error('❌ Deterministic Lock Violation: Generated contracts are out of sync with committed versions.');
    console.error('Run "npm run contracts:sync" locally and commit the changes.');
    process.exit(1);
}

console.log('✅ Contracts are in sync.');
