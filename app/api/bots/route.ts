import { NextResponse } from 'next/server';
import db from '@/lib/db';

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

        if (!name || !language || !code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = Math.random().toString(36).substring(2, 10); // Generate simple ID
        
        db.prepare('INSERT INTO bots (id, name, language, code) VALUES (?, ?, ?, ?)').run(id, name, language, code);
        
        return NextResponse.json({ id, name, language, status: 'stopped' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
