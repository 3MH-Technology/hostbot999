import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import db from './db';
import pidusage from 'pidusage';

// Global store to keep track of running processes and logs across API calls
const globalAny: any = global;
globalAny.botProcesses = globalAny.botProcesses || new Map<string, ChildProcess>();
globalAny.botLogs = globalAny.botLogs || new Map<string, string[]>();

export function startBot(id: string) {
    const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(id) as any;
    if (!bot) throw new Error('Bot not found');

    if (globalAny.botProcesses.has(id)) return; // Already running

    // Create bot directory
    const botDir = path.join(process.cwd(), 'data', 'bots', id);
    if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true });

    // Write the bot code to a file
    let ext = 'js';
    if (bot.language === 'python') ext = 'py';
    if (bot.language === 'go') ext = 'go';

    const filePath = path.join(botDir, `bot.${ext}`);
    fs.writeFileSync(filePath, bot.code);

    // Determine command based on language
    let cmd = 'node';
    let args = [filePath];

    if (bot.language === 'python') {
        cmd = 'python3';
    } else if (bot.language === 'go') {
        // For Go, we attempt to run the file using 'go run'
        cmd = 'go';
        args = ['run', filePath];
    }
    
    // Spawn the bot process with restricted environment (Basic mitigation)
    const proc = spawn(cmd, args, {
        cwd: botDir,
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: ['ignore', 'pipe', 'pipe'] // Disable stdin for security
    });

    globalAny.botProcesses.set(id, proc);
    globalAny.botLogs.set(id, [`[${new Date().toISOString()}] System: Bot started successfully`]);

    // Update status in DB
    db.prepare('UPDATE bots SET status = ? WHERE id = ?').run('running', id);

    // Capture stdout
    proc.stdout?.on('data', (data) => {
        const logs = globalAny.botLogs.get(id) || [];
        logs.push(`[${new Date().toISOString()}] OUT: ${data.toString().trim()}`);
        if (logs.length > 200) logs.shift(); // Keep last 200 lines
        globalAny.botLogs.set(id, logs);
    });

    // Capture stderr
    proc.stderr?.on('data', (data) => {
        const logs = globalAny.botLogs.get(id) || [];
        logs.push(`[${new Date().toISOString()}] ERR: ${data.toString().trim()}`);
        if (logs.length > 200) logs.shift();
        globalAny.botLogs.set(id, logs);
    });

    // Resource Monitoring Loop
    const monitorInterval = setInterval(async () => {
        if (!proc.pid || !globalAny.botProcesses.has(id)) {
            clearInterval(monitorInterval);
            return;
        }
        try {
            const stats = await pidusage(proc.pid);
            // Limit: 50% CPU or 256MB RAM per bot
            if (stats.cpu > 80 || stats.memory > 256 * 1024 * 1024) {
                const logs = globalAny.botLogs.get(id) || [];
                logs.push(`[${new Date().toISOString()}] System: Bot killed due to resource limit violation (${Math.round(stats.cpu)}% CPU, ${Math.round(stats.memory/1024/1024)}MB RAM)`);
                globalAny.botLogs.set(id, logs);
                proc.kill('SIGKILL');
                clearInterval(monitorInterval);
            }
        } catch (e) {
            clearInterval(monitorInterval);
        }
    }, 5000);

    // Handle process exit
    proc.on('close', (code) => {
        const logs = globalAny.botLogs.get(id) || [];
        logs.push(`[${new Date().toISOString()}] System: Bot exited with code ${code}`);
        globalAny.botProcesses.delete(id);
        db.prepare('UPDATE bots SET status = ? WHERE id = ?').run(code === 0 ? 'stopped' : 'error', id);
    });
}

export function stopBot(id: string) {
    const proc = globalAny.botProcesses.get(id);
    if (proc) {
        proc.kill(); // Kill the process
        globalAny.botProcesses.delete(id);
        db.prepare('UPDATE bots SET status = ? WHERE id = ?').run('stopped', id);
        const logs = globalAny.botLogs.get(id) || [];
        logs.push(`[${new Date().toISOString()}] System: Bot stopped by user`);
    }
}

export function cleanupBot(id: string) {
    stopBot(id);
    globalAny.botLogs.delete(id);
    const botDir = path.join(process.cwd(), 'data', 'bots', id);
    if (fs.existsSync(botDir)) {
        fs.rmSync(botDir, { recursive: true, force: true });
    }
}

export function getLogs(id: string) {
    return globalAny.botLogs.get(id) || [];
}

export async function getMetrics(id: string) {
    const proc = globalAny.botProcesses.get(id);
    if (!proc || !proc.pid) return { cpu: 0, memory: 0 };
    
    try {
        const stats = await pidusage(proc.pid);
        return { 
            cpu: Math.round(stats.cpu * 10) / 10, 
            memory: Math.round(stats.memory / 1024 / 1024) // Convert to MB
        };
    } catch (e) {
        return { cpu: 0, memory: 0 };
    }
}
