import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface CallRequest {
    to: string;
    twimlUrl?: string;
    organizationId: string;
    customerId?: string;
    callType?: 'outbound' | 'ai_agent';
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify authorization
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Parse request body
        const { to, twimlUrl, organizationId, customerId, callType = 'outbound' }: CallRequest = await req.json()

        if (!to || !organizationId) {
            throw new Error('Missing required fields: to, organizationId')
        }

        // Fetch Twilio credentials from sms_settings (we reuse the same table for voice)
        const { data: settings, error: settingsError } = await supabaseClient
            .from('sms_settings')
            .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, is_configured')
            .eq('organization_id', organizationId)
            .maybeSingle()

        if (settingsError) {
            throw new Error(`Failed to fetch Twilio settings: ${settingsError.message}`)
        }

        if (!settings || !settings.is_configured) {
            throw new Error('Twilio is not configured. Please add your Twilio credentials in Settings.')
        }

        const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = settings

        if (!twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
            throw new Error('Incomplete Twilio configuration. Please verify your credentials.')
        }

        // Format phone number
        let formattedTo = to.replace(/\D/g, '')
        if (formattedTo.length === 10) {
            formattedTo = `+1${formattedTo}`
        } else if (!formattedTo.startsWith('+')) {
            formattedTo = `+${formattedTo}`
        }

        // Default TwiML URL for simple voice message or use provided one
        const defaultTwimlUrl = 'http://demo.twilio.com/docs/voice.xml'
        const callTwimlUrl = twimlUrl || defaultTwimlUrl

        // Call Twilio API to initiate call
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Calls.json`
        const twilioAuth = btoa(`${twilio_account_sid}:${twilio_auth_token}`)

        const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${twilioAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: formattedTo,
                From: twilio_phone_number,
                Url: callTwimlUrl,
            }),
        })

        const twilioData = await twilioResponse.json()

        if (!twilioResponse.ok) {
            console.error('Twilio Voice API Error:', twilioData)
            throw new Error(twilioData.message || 'Failed to initiate call via Twilio')
        }

        // Log the call in the database
        const callEntry = {
            organization_id: organizationId,
            customer_id: customerId || null,
            phone_number: formattedTo,
            direction: 'outbound',
            call_type: callType,
            status: twilioData.status || 'queued',
            twilio_call_sid: twilioData.sid,
            created_at: new Date().toISOString(),
        }

        await supabaseClient.from('calls').insert(callEntry)

        return new Response(
            JSON.stringify({
                success: true,
                callSid: twilioData.sid,
                status: twilioData.status,
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('Make Call Edge Function Error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            }
        )
    }
})
