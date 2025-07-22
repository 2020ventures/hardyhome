const SUPABASE_URL = 'https://asfinbvecejglhfojclp.supabase.co'; // 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmluYnZlY2VqZ2xoZm9qY2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDYyODcsImV4cCI6MjA2NDU4MjI4N30.5NBfuWhO55DgFJvu4BXygrdJlRm5KkC8lwr3C7t8JGA'; // 

// Email configuration (Resend)
const RESEND_API_KEY = 're_eq5Wx4ZK_ACmt9g7GvKBmZ4KzHvJoSGKd';
const FROM_EMAIL = 'Hardy Home and Garden <notifications@hardyhome.us>';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
window.hardySupabase = supabase;

// Valid ZIP codes for Kenosha & Racine Counties
const KENOSHA_RACINE_ZIPS = [
  // Kenosha County
  '53102', '53104', '53105', '53109', '53114', '53119', '53125',
  '53128', '53140', '53141', '53142', '53143', '53144', '53152',
  '53158', '53168', '53170', '53171', '53179', '53181', '53182',
  '53192', '53194', '53195',
  // Racine County
  '53108', '53126', '53139', '53154', '53167', '53177', '53178',
  '53183', '53185', '53401', '53402', '53403', '53404', '53405',
  '53406', '53408'
];

// Remove duplicates (some ZIPs serve both counties)
const VALID_ZIPS = [...new Set(KENOSHA_RACINE_ZIPS)];

// Helper function to check if user can create listings
async function canUserCreateListings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('zip_code')
    .eq('id', user.id)
    .single();
    
  return profile && VALID_ZIPS.includes(profile.zip_code);
}

// Helper to get ZIP display name
function getZipDisplayName(zip) {
  const zipNames = {
    // Kenosha County
    '53142': 'Kenosha',
    '53143': 'Kenosha',
    '53144': 'Kenosha',
    '53158': 'Pleasant Prairie',
    '53104': 'Bristol',
    '53168': 'Somers',
    // Racine County
    '53402': 'Racine',
    '53403': 'Racine',
    '53404': 'Racine',
    '53405': 'Racine',
    '53406': 'Racine',
    '53126': 'Franksville',
    '53177': 'Sturtevant',
    '53185': 'Waterford',
    // Multi-county
    '53105': 'Burlington',
    '53182': 'Union Grove'
  };
  return zipNames[zip] || zip;
}

// Email function using Netlify Function (not Edge Function)
async function sendEmail(to, subject, htmlContent) {
    try {
        const response = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: to,
                subject: subject,
                html: htmlContent,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Email sending failed');
        }

        return result;
        
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

// Email template functions
function createWelcomeEmail(userName) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4CAF50; color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0;">Welcome to Hardy! 🌱</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
                <p>Hi ${userName},</p>
                <p>Welcome to Hardy, the community gardening platform connecting neighbors in Kenosha and Racine Counties!</p>
                <p>You can now:</p>
                <ul>
                    <li>🥕 Share your surplus harvest with neighbors</li>
                    <li>🌿 Find fresh, local produce from fellow gardeners</li>
                    <li>💬 Connect with your local gardening community</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://hardyhome.us/dashboard.html" 
                       style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Visit Your Dashboard
                    </a>
                </div>
                <p>Happy gardening!</p>
                <p>The Hardy Team</p>
            </div>
        </div>
    `;
}

function createMessageNotificationEmail(recipientName, senderName, listingTitle, messageContent, conversationId) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">New Message on Hardy 💬</h2>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
                <p>Hi ${recipientName},</p>
                <p>You have a new message from <strong>${senderName}</strong> about your listing:</p>
                <div style="background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #4CAF50;">${listingTitle}</h3>
                    <p style="margin: 0; color: #666;">"${messageContent}"</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://hardyhome.us/dashboard.html#messages" 
                       style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reply to Message
                    </a>
                </div>
                <p>Happy gardening!</p>
                <p>The Hardy Team</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #666;">
                    To stop receiving message notifications, visit your 
                    <a href="https://hardyhome.us/dashboard.html#settings">account settings</a>.
                </p>
            </div>
        </div>
    `;
}

// Helper function to send welcome email
async function sendWelcomeEmail(userEmail, userName) {
    try {
        await sendEmail(
            userEmail,
            'Welcome to Hardy! 🌱',
            createWelcomeEmail(userName)
        );
        console.log('Welcome email sent successfully');
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }
}

// Helper function to send message notification
async function sendMessageNotification(recipientEmail, recipientName, senderName, listingTitle, messageContent, conversationId) {
    try {
        await sendEmail(
            recipientEmail,
            `New message from ${senderName} on Hardy`,
            createMessageNotificationEmail(recipientName, senderName, listingTitle, messageContent, conversationId)
        );
        console.log('Message notification sent successfully');
    } catch (error) {
        console.error('Failed to send message notification:', error);
    }
}