import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { stopBot } from '@/lib/botManager';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(id);
        if (!bot) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(bot);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        stopBot(id); // Stop if running
        db.prepare('DELETE FROM bots WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
