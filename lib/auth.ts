const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

function base64url(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export async function signToken(payload: any): Promise<string> {
    const encoder = new TextEncoder();
    const header = base64url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const body = base64url(encoder.encode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) })));

    const data = encoder.encode(`${header}.${body}`);
    const keyData = encoder.encode(JWT_SECRET);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const signatureBase64 = base64url(new Uint8Array(signature));

    return `${header}.${body}.${signatureBase64}`;
}

export async function verifyToken(token: string): Promise<any | null> {
    try {
        const [header, body, signature] = token.split('.');
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const data = encoder.encode(`${header}.${body}`);
        const keyData = encoder.encode(JWT_SECRET);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const sigData = base64urlDecode(signature);
        // Cast to any to avoid strict Uint8Array/SharedArrayBuffer mismatch in some TS environments
        const isValid = await crypto.subtle.verify('HMAC', cryptoKey, sigData as any, data as any);

        if (!isValid) return null;

        const payload = JSON.parse(decoder.decode(base64urlDecode(body)));

        // Check expiration
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            return null;
        }

        return payload;
    } catch (e) {
        return null;
    }
}
