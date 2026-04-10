// ============================================================
// FILE: api/demo-call.js
// LOCATION: Put this in your project root under /api/demo-call.js
// Vercel automatically turns files in /api/ into serverless functions
// ============================================================
//
// WHAT THIS DOES:
// 1. Receives form data (name, phone, business_type) from your website
// 2. Formats the phone number to +44 international format
// 3. Calls Retell AI API to trigger an outbound demo call
// 4. Returns success/error to the frontend
//
// SETUP:
// 1. Create a file called api/demo-call.js in your project
// 2. Paste this code
// 3. In Vercel dashboard → Settings → Environment Variables, add:
//    - RETELL_API_KEY = your Retell AI API key
//    - RETELL_AGENT_ID = your Retell agent ID  
//    - RETELL_FROM_NUMBER = your Twilio number in +44xxx format
//    - NOTIFICATION_EMAIL = jiyoosh@insatai.com (optional)
// 4. Push to GitHub → Vercel auto-deploys
// 5. Your endpoint will be live at: https://www.insatai.com/api/demo-call
// ============================================================

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers (needed for form submission from same domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { name, phone, business_type } = req.body;

    // ---- VALIDATE ----
    if (!name || !phone || !business_type) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, business_type' });
    }

    // ---- FORMAT PHONE NUMBER ----
    // Converts UK numbers to E.164 format
    // "07123 456789" → "+447123456789"
    // "447123456789" → "+447123456789"
    // "+447123456789" → "+447123456789"
    let formattedPhone = phone.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, brackets
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+44' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('44')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+44' + formattedPhone;
    }

    // Basic validation - UK mobile numbers are +44 followed by 10 digits
    if (!/^\+44\d{10}$/.test(formattedPhone)) {
      return res.status(400).json({ error: 'Please enter a valid UK phone number' });
    }

    console.log(`[INSAT] Demo call requested: ${name} (${formattedPhone}) - ${business_type}`);

    // ---- TRIGGER RETELL AI CALL ----
    const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_number: process.env.RETELL_FROM_NUMBER,
        to_number: formattedPhone,
        agent_id: process.env.RETELL_AGENT_ID,
        retell_llm_dynamic_variables: {
          name: name,
          business_type: business_type,
        },
        metadata: {
          source: 'insatai.com',
          lead_name: name,
          lead_phone: formattedPhone,
          lead_business: business_type,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!retellResponse.ok) {
      const errorData = await retellResponse.text();
      console.error('[INSAT] Retell API error:', errorData);
      return res.status(500).json({ error: 'Failed to initiate call. Please try again.' });
    }

    const callData = await retellResponse.json();
    console.log(`[INSAT] Call created: ${callData.call_id}`);

    // ---- SEND NOTIFICATION TO JIYOOSH (via simple webhook) ----
    // This is optional — sends you an email notification via Make.com
    // If you set up a Make.com webhook for notifications, paste the URL below
    if (process.env.MAKE_NOTIFICATION_WEBHOOK) {
      try {
        await fetch(process.env.MAKE_NOTIFICATION_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone: formattedPhone,
            business_type,
            call_id: callData.call_id,
            timestamp: new Date().toISOString(),
            source: 'insatai.com demo form',
          }),
        });
      } catch (notifError) {
        // Don't fail the main request if notification fails
        console.error('[INSAT] Notification webhook failed:', notifError.message);
      }
    }

    // ---- SUCCESS ----
    return res.status(200).json({
      success: true,
      message: 'Demo call initiated',
      call_id: callData.call_id,
    });

  } catch (error) {
    console.error('[INSAT] Server error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
