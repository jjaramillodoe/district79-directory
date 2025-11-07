import { NextResponse } from 'next/server';
import mongodb from '@/lib/mongodb';
import OpenAI from 'openai';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { count, siteIds } = await request.json();

    // If siteIds provided, use those; otherwise use count
    if (siteIds && Array.isArray(siteIds)) {
      if (siteIds.length < 1 || siteIds.length > 100) {
        return NextResponse.json(
          { error: 'Number of selected sites must be between 1 and 100' },
          { status: 400 }
        );
      }
    } else {
      if (!count || count < 1 || count > 100) {
        return NextResponse.json(
          { error: 'Count must be between 1 and 100' },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get MongoDB connection
    const client = await mongodb;
    const db = client.db('district79');

    // Find sites - either by specific IDs or without descriptions
    let sitesWithoutDescriptions;
    if (siteIds && Array.isArray(siteIds) && siteIds.length > 0) {
      // Convert string IDs to ObjectId, filter out invalid ones
      const objectIds: ObjectId[] = siteIds
        .map((id: string) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is ObjectId => id !== null);

      if (objectIds.length === 0) {
        return NextResponse.json(
          { error: 'No valid site IDs provided' },
          { status: 400 }
        );
      }

      sitesWithoutDescriptions = await db
        .collection('sites')
        .find({
          _id: { $in: objectIds },
          siteName: { $exists: true, $nin: [null, ''] },
          program: { $exists: true, $nin: [null, ''] }
        })
        .toArray();
    } else {
      // Find sites without descriptions, limit to requested count
      sitesWithoutDescriptions = await db
        .collection('sites')
        .find({
          $or: [
            { description: { $exists: false } },
            { description: null },
            { description: '' }
          ],
          siteName: { $exists: true, $nin: [null, ''] },
          program: { $exists: true, $nin: [null, ''] }
        })
        .limit(count)
        .toArray();
    }

    if (sitesWithoutDescriptions.length === 0) {
      return NextResponse.json({
        message: 'No sites found without descriptions',
        generated: 0,
        sites: []
      });
    }

    // Configure OpenAI client
    const clientConfig: any = {
      apiKey: apiKey,
    };

    const httpsProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    
    if (httpsProxy) {
      const agent = new HttpsProxyAgent(httpsProxy);
      clientConfig.httpAgent = agent;
      clientConfig.httpsAgent = agent;
    } else if (process.env.NODE_ENV === 'development') {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
      clientConfig.httpsAgent = httpsAgent;
    }

    const openai = new OpenAI(clientConfig);

    const systemMessage = 'You are a professional writer specializing in creating clear, informative, and engaging descriptions for educational programs and school sites in New York City District 79. Your descriptions help students, parents, and educators understand program offerings and make informed decisions. Write in a warm, welcoming, and approachable tone while maintaining professionalism.';

    const results = [];
    let successCount = 0;

    // Generate descriptions for each site
    for (const site of sitesWithoutDescriptions) {
      try {
        // Build prompt
        let locationInfo = '';
        if (site.buildingAddress) {
          locationInfo = ` located at ${site.buildingAddress}`;
          if (site.borough) {
            locationInfo += `, ${site.borough}`;
          }
        }
        
        const prompt = `Write a professional, informative description for this District 79 NY (New York City Department of Education) program and school site.

Program: ${site.program}
Site Name: ${site.siteName}${locationInfo}

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

        // Use GPT-5 (latest model, released August 2025) - uses responses.create() API
        let description: string | null = null;
        let modelUsed = 'unknown';

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
            modelUsed = 'gpt-5';
          } else {
            throw new Error('responses.create() API not available');
          }
        } catch (modelError: any) {
          // If GPT-5 responses API fails, fallback to GPT-4o using chat.completions
          try {
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o',
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
            modelUsed = 'gpt-4o';
          } catch (gpt4oError: any) {
            // Final fallback to gpt-4-turbo-preview
            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
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
              modelUsed = 'gpt-4-turbo-preview';
            } catch (turboError: any) {
              console.error(`Failed to generate description with any model for ${site.siteName}:`, turboError);
              throw turboError;
            }
          }
        }

        if (description) {
          // Update site in database
          await db.collection('sites').updateOne(
            { _id: site._id },
            { $set: { description: description } }
          );

          successCount++;
          results.push({
            siteId: site._id.toString(),
            siteName: site.siteName,
            success: true,
            description: description.substring(0, 100) + '...',
            model: modelUsed
          });
        } else {
          results.push({
            siteId: site._id.toString(),
            siteName: site.siteName,
            success: false,
            error: 'No description generated'
          });
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Error generating description for site ${site._id}:`, error);
        results.push({
          siteId: site._id.toString(),
          siteName: site.siteName,
          success: false,
          error: error.message || 'Failed to generate description'
        });
      }
    }

    return NextResponse.json({
      message: `Generated ${successCount} out of ${sitesWithoutDescriptions.length} descriptions`,
      generated: successCount,
      total: sitesWithoutDescriptions.length,
      results: results
    });
  } catch (error: any) {
    console.error('Error in bulk description generation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate descriptions' },
      { status: 500 }
    );
  }
}

