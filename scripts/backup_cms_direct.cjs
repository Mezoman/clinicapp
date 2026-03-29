
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backup() {
    console.log('Starting direct backup of landing_content via Supabase (JS)...');
    try {
        const { data, error } = await supabase
            .from('landing_content')
            .select('*')
            .order('section', { ascending: true });

        if (!error) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(process.cwd(), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
            }
            const filePath = path.join(backupDir, `landing_content_backup_${timestamp}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Backup successful: ${filePath}`);
        } else {
            console.error('Backup failed:', error);
            process.exit(1);
        }
    } catch (err) {
        console.error('Unexpected error during backup:', err);
        process.exit(1);
    }
}

backup();
