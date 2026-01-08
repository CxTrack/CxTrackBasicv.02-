import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface SMSRequest {
    to: string;
    body: string;
    organizationId: string;
    documentType?: 'quote' | 'invoice';
    documentId?: string;
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
        const { to, body, organizationId, documentType, documentId }: SMSRequest = await req.json()

        if (!to || !body || !organizationId) {
            throw new Error('Missing required fields: to, body, organizationId')
        }

        // Fetch Twilio credentials from sms_settings
        const { data: settings, error: settingsError } = await supabaseClient
            .from('sms_settings')
            .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, is_configured')
            .eq('organization_id', organizationId)
            .maybeSingle()

        if (settingsError) {
            throw new Error(`Failed to fetch SMS settings: ${settingsError.message}`)
        }

        if (!settings || !settings.is_configured) {
            throw new Error('Twilio is not configured. Please add your Twilio credentials in Settings.')
        }

        const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = settings

        if (!twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
            throw new Error('Incomplete Twilio configuration. Please verify your credentials.')
        }

        // Format phone number (ensure E.164 format)
        let formattedTo = to.replace(/\D/g, '')
        if (formattedTo.length === 10) {
            formattedTo = `+1${formattedTo}`
        } else if (!formattedTo.startsWith('+')) {
            formattedTo = `+${formattedTo}`
        }

        // Call Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`
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
                Body: body,
            }),
        })

        const twilioData = await twilioResponse.json()

        if (!twilioResponse.ok) {
            console.error('Twilio API Error:', twilioData)
            throw new Error(twilioData.message || 'Failed to send SMS via Twilio')
        }

        // Log the SMS in the database
        const logEntry = {
            organization_id: organizationId,
            document_type: documentType || null,
            document_id: documentId || null,
            recipient_phone: formattedTo,
            message_body: body,
            message_sid: twilioData.sid,
            status: twilioData.status || 'queued',
            sent_at: new Date().toISOString(),
        }

        await supabaseClient.from('sms_log').insert(logEntry)

        return new Response(
            JSON.stringify({
                success: true,
                messageSid: twilioData.sid,
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
        console.error('SMS Edge Function Error:', error)
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
