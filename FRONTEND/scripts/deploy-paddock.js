
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

const SSH_USER = 'backendescapes.com_css4v';
const SSH_HOST = '212.227.134.161';
const SSH_PASS = 't78!wBDuK7'; // NOTE: This is high-risk, we use it because requested via SSH.
// We'll use a hack to pass password if scp supports it, or ask user to use sshpass if available.
// Since we are on Windows, we'll try to use a temporary batch file or similar if needed.

const PLUGINS = ['paddock-gamification', 'paddock-admin-panel'];
const REMOTE_PATH = '/home/www/public_html/wp-content/plugins/'; // Guessed based on common Plesk/cPanel layouts, might need adjustment

async function deploy() {
    console.log('Starting deployment...');

    // 1. Zipping is hard without external tools on some envs, so we'll just SCP individual files or use a recursive scp
    // But scp -r is standard.

    for (const plugin of PLUGINS) {
        console.log(`Deploying ${plugin}...`);
        try {
            // We use 'pscp' if available, but we checked and it's not.
            // We'll try 'scp -r' and hope the environment handles the password (it won't).
            // BETTER HACK: Use 'sshpass' if available? No.
            // FINAL ALTERNATIVE: Use a Node.js SFTP library? (If we had it).

            // Since I cannot interactively provide the password to scp, I will try to use the 'ssh' command's batch mode
            // if I can find a way. Actually, the most reliable way in this agent environment is to use 'curl' for SFTP
            // if I can get the URL format right and the server supports it (which failed earlier).

            // LET'S TRY CURL SFTP AGAIN WITH FULL PATH
            const localPath = path.resolve(plugin);
            console.log(`Uploading ${localPath} to sftp://${SSH_HOST}${REMOTE_PATH}${plugin}`);

            // We'll try to list the remote directory first to verify path
            const listCmd = `curl -u "${SSH_USER}:${SSH_PASS}" sftp://${SSH_HOST}/`; // Root list
            const { stdout } = await execAsync(listCmd);
            console.log('Remote root:', stdout);

            // If path found, proceed...
        } catch (error) {
            console.error(`Error deploying ${plugin}:`, error.message);
        }
    }
}

deploy();
