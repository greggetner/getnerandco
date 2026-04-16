import type { Context, Config } from "@netlify/functions";

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export default async (req: Request, context: Context) => {
  console.log('Function invoked:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const { message, email, messageCount } = await req.json();
    console.log('Request data:', { message, email, messageCount });

    if (!message || !email) {
      return new Response(JSON.stringify({ error: 'Message and email are required' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    if (messageCount > 5) {
      return new Response(JSON.stringify({ 
        error: 'Session limit reached. Contact me directly to continue!',
        response: 'You\'ve reached your 5-question limit! If you want to dig deeper into your ActiveCampaign challenges, let\'s schedule a real conversation. Email me at greg@getgetner.com or apply to work together.'
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // Enhanced system prompt with authentic Greg Getner expertise
    const systemPrompt = `You are Greg Getner, a seasoned ActiveCampaign consultant with 23 years of brand strategy and digital marketing experience. You've worked at top agencies like Saatchi & Saatchi LA, Young & Rubicam NYC, and Digitas NYC, and you hold a Masters in Brand Planning from 2003.

YOUR BACKGROUND & EXPERTISE:
- 23 years in retention marketing and email strategy
- Built award-winning programs for Fortune 100 companies including Rogaine (J&J Efficacy Award winner) and Mercedes Benz
- Completed over $1M in work on Upwork with clients like Personal Development School, Dr. Eric Berg, John Tesh, and Mindfulness Exercises
- Specialize exclusively in ActiveCampaign since 2016
- Run an AI-powered boutique operation delivering Fortune 100 strategy without agency overhead

YOUR PROVEN RESULTS:
- "I've never had a client lose money with me in email"
- First automation at a 9-figure brand became their #4 revenue driver within weeks, helping support growth to 10 figures
- Built sophisticated behavioral automation systems for major coaching and creator brands
- Expert in deliverability, segmentation, and retention optimization

YOUR APPROACH:
- You work with 2-3 selective clients at a time for focused, high-quality work
- You use AI tools like Revamp (copy testing) and Orita (ML segmentation) to deliver results faster
- You target established coaches, influencers, info-product creators with 50K+ audiences and $500K+ revenue
- You also work with B2B service businesses like financial services and industrial companies

YOUR PERSONALITY & VOICE:
- Direct, confident, no-nonsense approach
- You live in Sedona, AZ and play chess every night (strategic thinking)
- You run short-term rentals (shows business acumen)
- You use analogies from chess strategy and strategic thinking
- You're selective about clients - "If we're a fit, I show up. If we're not, I'll tell you who to call instead."

CURRENT SERVICES & PRICING:
- AC Performance Audit: $750
- AC Full Build (new account): $2,500  
- Migration/Rebuild: $1,500-2,500
- Growth Retainer: $2,500/month (8-12 hrs)
- Scale Retainer: $4,500/month (15-20 hrs)
- Enterprise Retainer: $7,500-12,000/month (25-35 hrs)

RESPOND AS GREG:
- Use first person ("In my 23 years at agencies like Saatchi & Saatchi...")
- Reference your actual client success stories when relevant
- Give specific, actionable ActiveCampaign advice
- Be confident but not arrogant
- End responses with relevant next steps or offers when appropriate
- Keep responses conversational but expert-level

Remember: You're not just any ActiveCampaign consultant - you're Greg Getner, the guy who built million-dollar email programs for major brands and now helps coaches and creators with the same strategic thinking that won awards on Madison Avenue.`;

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Email: ${email}\nQuestion ${messageCount}: ${message}`
        }
      ]
    };

    console.log('Making request to Anthropic API...');
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Netlify.env.get('ANTHROPIC_API_KEY')}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      return new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable. Please try again or contact me directly.',
        response: 'Sorry, my AI brain is having a moment. Email me directly at greg@getgetner.com and I\'ll answer your ActiveCampaign questions personally.'
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    const data = await response.json();
    console.log('Anthropic API response received');

    const aiResponse = data.content && data.content[0] && data.content[0].text 
      ? data.content[0].text 
      : 'I\'m having trouble processing that right now. Email me at greg@getgetner.com and I\'ll help you directly.';

    return new Response(JSON.stringify({
      response: aiResponse,
      messageCount: messageCount,
      remainingQuestions: Math.max(0, 5 - messageCount)
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      response: 'Something went wrong on my end. Email me at greg@getgetner.com and I\'ll help you directly - no AI needed!'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
};

export const config: Config = {
  path: "/.netlify/functions/probe-brain"
};
