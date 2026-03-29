
import { app } from '../src/application/container';
import fs from 'fs';
import path from 'path';

async function backup() {
    console.log('Starting backup of landing_content...');
    const result = await app.cmsService.getLandingContent();
    if (result.success) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        const filePath = path.join(backupDir, `landing_content_backup_${timestamp}.json`);
        fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2));
        console.log(`Backup successful: ${filePath}`);
    } else {
        console.error('Backup failed:', result.error);
        process.exit(1);
    }
}

backup();
