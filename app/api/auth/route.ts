import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        
        if (username === 'moh777' && password === 'Mm@123456') {
            return NextResponse.json({ success: true, token: 'white-wolf-auth-token' });
        }
        
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
