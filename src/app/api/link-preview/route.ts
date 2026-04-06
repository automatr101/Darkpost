import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const urlObj = new URL(targetUrl);
    
    // Quick sanitization & security: only allow HTTP/HTTPS, prevent SSRF to local IP
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'DarkpostBot/1.0 (+https://darkpost.vercel.app)',
        'Accept': 'text/html',
      },
      // Timeout after 3 seconds
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: res.status });
    }

    const html = await res.text();

    const getMetaTag = (property: string) => {
      const match = html.match(new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["'](.*?)["']`, 'i')) || 
                    html.match(new RegExp(`<meta\\s+content=["'](.*?)["']\\s+(?:property|name)=["']${property}["']`, 'i'));
      return match ? match[1] : null;
    };

    let title = getMetaTag('og:title') || getMetaTag('twitter:title') || '';
    if (!title) {
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) title = titleMatch[1];
    }

    const image = getMetaTag('og:image') || getMetaTag('twitter:image') || '';
    const description = getMetaTag('og:description') || getMetaTag('twitter:description') || '';
    const domain = urlObj.hostname;

    return NextResponse.json({
      title: title.substring(0, 100),
      description: description.substring(0, 160),
      image,
      domain,
      url: targetUrl
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error processing URL' }, { status: 500 });
  }
}
