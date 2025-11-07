import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

export async function POST(request: Request) {
  try {
    const { siteName, program, address, borough } = await request.json();

    if (!siteName || !program) {
      return NextResponse.json(
        { error: 'Site name and program are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Configure OpenAI client with custom fetch if proxy is needed
    const clientConfig: any = {
      apiKey: apiKey,
    };

    // If HTTP_PROXY or HTTPS_PROXY environment variables are set, use them
    // This helps with corporate proxies
    const httpsProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    
    if (httpsProxy) {
      // Use proxy agent for requests
      const agent = new HttpsProxyAgent(httpsProxy);
      
      clientConfig.httpAgent = agent;
      clientConfig.httpsAgent = agent;
    } else if (process.env.NODE_ENV === 'development') {
      // In development, if behind corporate proxy, you might need to bypass SSL
      // WARNING: This is NOT secure for production!
      // Only use this if your corporate network requires it
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // Bypass SSL certificate validation (DEV ONLY)
      });
      clientConfig.httpsAgent = httpsAgent;
    }

    // Initialize OpenAI client
    const openai = new OpenAI(clientConfig);

    // Build a structured, effective prompt
    let locationInfo = '';
    if (address) {
      locationInfo = ` located at ${address}`;
      if (borough) {
        locationInfo += `, ${borough}`;
      }
    }
    
    const prompt = `Write a professional, informative description for this District 79 NY (New York City Department of Education) program and school site.

Program: ${program}
Site Name: ${siteName}${locationInfo}

Instructions:
- Write a clear, professional description (3-5 sentences, approximately 100-150 words)
- Identify this as a District 79 NY program within the NYC Department of Education
- Explain what type of program this is (YABC, Adult Education, Youth Programs, etc.) and its primary purpose
- Describe the target student population (who this program serves)
- Include relevant location or neighborhood context if it adds value
- Highlight key features, benefits, or what makes this program valuable
- Use a professional, welcoming, and informative tone
- Make it helpful for someone who needs to understand or recommend this program

Write the description now:`;

    // Call OpenAI API using the SDK
    // Use GPT-5 (latest model, released August 2025) - uses responses.create() API
    let model = 'gpt-5';
    let description: string | null = null;
    
    // System message for consistent behavior - emphasizing warm, engaging tone
    const systemMessage = 'You are a professional writer specializing in creating clear, informative, and engaging descriptions for educational programs and school sites in New York City District 79. Your descriptions help students, parents, and educators understand program offerings and make informed decisions. Write in a warm, welcoming, and approachable tone while maintaining professionalism.';
    
    // Try GPT-5 first using responses.create() API
    try {
      // Check if responses API is available
      if ((openai as any).responses && typeof (openai as any).responses.create === 'function') {
        const response = await (openai as any).responses.create({
          model: 'gpt-5',
          input: prompt,
          instructions: systemMessage,
          max_output_tokens: 300,
          temperature: 0.7,
        });
        description = response.output_text?.trim() || null;
        console.log(`Generated description using model: gpt-5 (via responses.create())`);
      } else {
        throw new Error('responses.create() API not available');
      }
    } catch (modelError: any) {
      // If GPT-5 responses API fails, fallback to GPT-4o using chat.completions
      console.log('GPT-5 responses API not available, using GPT-4.1 instead');
      model = 'gpt-4.1';
      try {
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: systemMessage,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        });
        description = completion.choices[0]?.message?.content?.trim() || null;
        console.log(`Generated description using model: ${model}`);
      } catch (gpt4oError: any) {
        // Final fallback to gpt-4-turbo-preview
        console.log('GPT-4o not available, trying gpt-4-turbo-preview');
        model = 'gpt-4-turbo-preview';
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: systemMessage,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        });
        description = completion.choices[0]?.message?.content?.trim() || null;
        console.log(`Generated description using model: ${model}`);
      }
    }

    if (!description) {
      return NextResponse.json(
        { error: 'No description generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      description,
      model: model // Return the model used for verification
    });
  } catch (error: any) {
    console.error('Error generating description:', error);
    
    // Check for SSL/certificate errors
    const isSSLError = 
      error?.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
      error?.cause?.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
      error?.message?.includes('certificate') ||
      error?.message?.includes('SSL');
    
    if (isSSLError) {
      return NextResponse.json(
        { 
          error: 'Network connection error. This appears to be a corporate network/firewall issue. ' +
                 'Your company network may be blocking OpenAI API access or intercepting SSL connections. ' +
                 'Solutions: 1) Contact IT to allowlist OpenAI domains, 2) Use a different network (mobile hotspot), ' +
                 '3) Set HTTPS_PROXY environment variable if behind a corporate proxy, ' +
                 '4) For development only, the code will attempt to bypass SSL verification (not recommended for production).'
        },
        { status: 500 }
      );
    }
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Check if it's a connection error (likely blocked)
    if (error?.message?.includes('Connection error') || error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to OpenAI API. Your company network may be blocking access. ' +
                 'Try: 1) Using a different network, 2) Contacting IT to allowlist api.openai.com, ' +
                 '3) Checking if you\'re behind a corporate proxy that requires configuration.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to generate description' },
      { status: 500 }
    );
  }
}
