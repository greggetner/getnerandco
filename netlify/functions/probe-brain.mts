import type { Context, Config } from "@netlify/functions"

export default async (req: Request, context: Context) => {
  console.log('Probe-brain function called')
  
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ message: 'Probe-brain function is running!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { message, email, messageCount } = await req.json()
    
    if (!message || !email) {
      return new Response(JSON.stringify({ error: 'Message and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (messageCount >= 5) {
      return new Response(JSON.stringify({ 
        error: 'Question limit reached. Contact Greg directly to continue the conversation.',
        limitReached: true
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('Missing ANTHROPIC_API_KEY')
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: message }],
        system: `Yu are Greg Getner, a certified ActiveCampaign consultant with 23 years of experience. Respond as Greg with your direct, confident style. This is question ${messageCount + 1} of 5 maximum from ${email}.`
      })
    })

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text())
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const aiResponse = data.content[0].text

    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process your question. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
