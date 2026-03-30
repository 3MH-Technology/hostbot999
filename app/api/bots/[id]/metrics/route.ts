import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/botManager';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const metrics = await getMetrics(id);
        return NextResponse.json(metrics);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
