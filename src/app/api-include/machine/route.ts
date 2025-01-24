import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cmnd = searchParams.get('cmnd');
    const ip = searchParams.get('ip');

    if (!cmnd || !ip) {
      return NextResponse.json({ error: 'Missing cmnd or ip parameter' }, { status: 400 });
    }

    const encodedCmnd = encodeURIComponent(cmnd);
    const url = `http://${ip}/cm?cmnd=${encodedCmnd}&user=admin&password=@Quantum2022`;
    const req = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!req.ok) {
      return NextResponse.json({ error: 'Failed to fetch from the proxied server' }, { status: req.status });
    }

    const json = await req.json();
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
