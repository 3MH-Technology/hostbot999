import { NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
    try {
        const bots = db.prepare('SELECT id, name, language, status, created_at FROM bots ORDER BY created_at DESC').all();
        return NextResponse.json(bots);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, language, code } = await request.json();
        
        // Input validation
        if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 64) {
            return NextResponse.json({ error: 'Bot name must be between 3 and 64 characters' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        db.prepare('INSERT INTO bots (id, name, language, code) VALUES (?, ?, ?, ?)').run(id, name.trim(), language, code);
        
        return NextResponse.json({ id, name: name.trim(), language, status: 'stopped' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
