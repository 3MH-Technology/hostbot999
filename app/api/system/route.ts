import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        
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
            loadAvg,
            nodeVersion: process.version
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
