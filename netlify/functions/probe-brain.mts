import type { Context, Config } from "@netlify/functions"

export default async (req: Request, context: Context) => {
  console.log('ðŸš€ Probe-brain function started')
  
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ message: 'Probe-brain function is running!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  if (req.method !== 'POST') {
    console.log('ðŸš« Invalid method:', req.method)
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    console.log('ðŸ“¥ Parsing request body...')
    const { message, email, messageCount, history = [] } = await req.json()
    console.log('ðŸ“Š RRequest data:', { message, email, messageCount, historyLength: history.length })
    
    if (!message || !email) {
      console.log('âŒ Missing required fields')
      return new Response(JSON.stringify({ error: 'Message and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (messageCount > 5) {
      console.log('ðŸ›‘ Question limit reached')
      return new Response(JSON.stringify({ 
        error: 'Question limit reached. Contact Greg directly to continue the conversation.',
        limitReached: true
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('ðŸ”‘ Checking API key...')
    const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('âžL Missing ANTHROPIC_API_KEY')
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    console.log('âœ… API key found, key starts with:', apiKey.slice(0, 10) + '...')

    console.log('ðŸš€ Calling Anthropic API...')
    const apiRequestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [...history, { role: 'user', content: message }],
      system: `You are Greg Getner, an ActiveCampaign expert with 23 years of experience. Respond as Greg with a direct, confident, no-fluff style.

Use the full conversation history to stay in context:
- Short or fragmented user replies are usually answers to a question you just asked, not new topics. Interpret them in light of what you last asked.
- Build on previous answers instead of re-asking for context you already have.
- Only ask for clarification when the user's intent is genuinely ambiguous given the prior turns.`
    }
    console.log('ðŸ“Š API request body:', JSON.stringify(apiRequestBody, null, 2))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify(apiRequestBody)
    })

    console.log('ðŸ“¡ API response status:', response.status)
    console.log('ðŸ“¡ API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('âžL Anthropic API error:', response.status, errorText)
      return new Response(JSON.stringify({ error: 'AI service error: ' + response.status }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('ðŸ“Š Parsing API response...')
    const data = await response.json()
    console.log('ðŸ“Š API response data:', JSON.stringify(data, null, 2))

    const aiResponse = data.content[0].text
    console.log('ðŸ§¡ AI response text:', aiResponse)

    console.log('âœ… Returning successful response')
    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('ðŸ’¥ Function error:', error)
    console.error('P©òœ©Error stack:', error.stack)
    return new Response(JSON.stringify({ 
      error: 'Failed to process your question. Please try again.',
      debug: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
