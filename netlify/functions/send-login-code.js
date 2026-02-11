exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Email is required' })
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not configured');
    }
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable not set');
    }

    // Generate the magic link + OTP via Supabase Admin API (no email sent by Supabase)
    const generateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: email,
        redirect_to: 'https://hardyhome.us/pages/auth-callback.html'
      })
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Supabase generate_link error:', generateResponse.status, errorText);
      throw new Error(`Supabase error (${generateResponse.status}): ${errorText}`);
    }

    const generateData = await generateResponse.json();
    console.log('generate_link response keys:', Object.keys(generateData));
    const otp = generateData.email_otp || generateData.properties?.email_otp;

    if (!otp) {
      console.error('No OTP returned from generate_link. Full response:', JSON.stringify(generateData));
      throw new Error('No OTP in response. Keys: ' + Object.keys(generateData).join(', '));
    }

    // Send the email via Resend (code only — no clickable links that corporate email scanners can consume)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background-color: #4CAF50; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Sign in to Hardy</h2>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
          <p>Hi there,</p>
          <p>Enter this code on the sign-in page:</p>
          <div style="background-color: #ffffff; padding: 20px; text-align: center; margin: 24px 0; border-radius: 8px; border: 2px solid #4CAF50;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #212121;">${otp}</span>
          </div>
          <p style="color: #757575; font-size: 14px;">This code expires in 1 hour.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Hardy Home and Garden <notifications@hardyhome.us>',
        to: email,
        subject: 'Your Hardy sign-in code',
        html: emailHtml
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend error:', emailResponse.status, errorText);
      throw new Error('Failed to send sign-in email');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Send login code failed:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to send sign-in code'
      })
    };
  }
};
