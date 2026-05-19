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
    const ext = bot.language === 'python' ? 'py' : 'js';
    const filePath = path.join(botDir, `bot.${ext}`);
    fs.writeFileSync(filePath, bot.code);

    // Determine command based on language
    const cmd = bot.language === 'python' ? 'python3' : 'node';
    
    // Spawn the bot process with restricted environment (Basic mitigation)
    const proc = spawn(cmd, [filePath], {
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
