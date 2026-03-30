import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        const cpus = os.cpus();
        const loadAvg = os.loadavg(); // Returns an array containing the 1, 5, and 15 minute load averages
        
        // Calculate a rough CPU usage percentage based on load average
        // This is an approximation. For exact CPU usage, we'd need to sample over time.
        const cpuUsage = Math.min(100, Math.round((loadAvg[0] / cpus.length) * 100));

        return NextResponse.json({
            cpuUsage,
            memory: {
                total: Math.round(totalMem / (1024 * 1024)), // MB
                used: Math.round(usedMem / (1024 * 1024)), // MB
                free: Math.round(freeMem / (1024 * 1024)), // MB
                usagePercent: Math.round((usedMem / totalMem) * 100)
            },
            uptime: os.uptime(),
            platform: os.platform(),
            arch: os.arch(),
            cpus: cpus.length,
            loadAvg
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
