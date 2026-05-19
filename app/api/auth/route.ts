import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        
        const adminUser = process.env.AUTH_USERNAME;
        const adminPass = process.env.AUTH_PASSWORD;

        if (!adminUser || !adminPass) {
            return NextResponse.json({ success: false, message: 'Server authentication not configured' }, { status: 500 });
        }

        if (username === adminUser && password === adminPass) {
            const token = await signToken({ username });
            return NextResponse.json({ success: true, token });
        }
        
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
