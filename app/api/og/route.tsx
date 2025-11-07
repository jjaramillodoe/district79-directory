import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Generates Open Graph image dynamically
 * Usage: /api/og?title=Your+Title
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get title from query params or use default
    const title = searchParams.get('title') || 'District 79 Directory';
    const subtitle = searchParams.get('subtitle') || 'Adult Education & Youth Programs';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#003F87',
            backgroundImage: 'linear-gradient(135deg, #003F87 0%, #0078D4 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Main Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
            }}
          >
            {/* District 79 Logo Text */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '120px',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '-2px',
                  display: 'flex',
                }}
              >
                District 79
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: '20px',
                maxWidth: '1000px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: '42px',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                maxWidth: '900px',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>

            {/* Bottom Text */}
            <div
              style={{
                position: 'absolute',
                bottom: '60px',
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
              }}
            >
              NYC Department of Education
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

