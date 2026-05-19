import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        
        const adminUsername = process.env.ADMIN_USERNAME || process.env.NEXT_PUBLIC_ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
        const apiSecret = process.env.API_SECRET || 'fallback-secret-change-me';

        if (!adminUsername || !adminPassword) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (username === adminUsername && password === adminPassword) {
            return NextResponse.json({ success: true, token: apiSecret });
        }
        
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
