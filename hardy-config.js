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

// Email function using Netlify Function (updated to accept object format)
async function sendEmail(emailData) {
    try {
        // Handle both old format (3 params) and new format (object)
        let to, subject, html;
        
        if (typeof emailData === 'object' && emailData.to) {
            // New format: { to, subject, html }
            to = emailData.to;
            subject = emailData.subject;
            html = emailData.html;
        } else if (typeof emailData === 'string') {
            // Old format: sendEmail(to, subject, html)
            to = arguments[0];
            subject = arguments[1];
            html = arguments[2];
        } else {
            throw new Error('Invalid email data format');
        }
        
        const response = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: to,
                subject: subject,
                html: html,
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

// Email template functions (updated to return object with subject and html)
function createWelcomeEmail(userName) {
    return {
        subject: 'Welcome to Hardy! 🌱',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0;">Welcome to Hardy! 🌱</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <p>Hi ${userName},</p>
                    <p>Welcome to Hardy, the Community Garden in Your Pocket!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>🥕 Share your surplus harvest with neighbors</li>
                        <li>🌿 Find fresh, local produce from fellow gardeners</li>
                        <li>💬 Connect with your local gardening community</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://hardyhome.us/pages/dashboard.html" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Visit Your Dashboard
                        </a>
                    </div>
                    <p>Happy gardening!</p>
                    <p>The Hardy Team</p>
                </div>
            </div>
        `
    };
}

function createMessageNotificationEmail(recipientName, senderName, listingTitle, messageContent, conversationId) {
    return {
        subject: `New message from ${senderName} on Hardy`,
        html: `
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
                        <a href="https://hardyhome.us/pages/dashboard.html#messages" 
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
                        <a href="https://hardyhome.us/pages/dashboard.html#settings">account settings</a>.
                    </p>
                </div>
            </div>
        `
    };
}

// NEW: Listing confirmation email template
function createListingConfirmationEmail(userName, listingTitle, listingId) {
    return {
        subject: 'Your Hardy listing is live!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0;">Your listing is live! 🎉</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <p>Hi ${userName},</p>
                    <p>Great news! Your listing is now live on Hardy and visible to your neighbors.</p>
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 10px 0; color: #4CAF50;">${listingTitle}</h3>
                        <p style="margin: 0; color: #666;">Your neighbors can now see your listing and contact you about it.</p>
                    </div>
                    <p><strong>What happens next?</strong></p>
                    <ul style="margin: 15px 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">🏡 Neighbors in your area can view your listing</li>
                        <li style="margin-bottom: 8px;">💬 You'll receive email notifications when someone messages you</li>
                        <li style="margin-bottom: 8px;">✏️ You can edit or remove your listing anytime from your dashboard</li>
                        <li style="margin-bottom: 8px;">⏰ Your listing will remain active for the duration you selected</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://hardyhome.us/pages/dashboard.html" 
                           style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Your Listing
                        </a>
                    </div>
                    <p style="margin-top: 30px;">Happy sharing!</p>
                    <p>The Hardy Team</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        Hardy Home and Garden · Kenosha & Racine Counties, WI<br>
                        <a href="https://hardyhome.us/pages/dashboard.html#settings" style="color: #666;">Manage email preferences</a>
                    </p>
                </div>
            </div>
        `
    };
}

// NEW: Newsletter welcome email template
function createNewsletterWelcomeEmail() {
    return {
        subject: 'Welcome to Hardy Updates! 🌱',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0;">Welcome to Hardy Updates! 🌱</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #388E3C; margin-top: 0;">Thanks for joining our community!</h2>
                    <p>You're now signed up to receive updates about Hardy, including:</p>
                    <ul style="margin: 20px 0; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">🚀 Launch announcements for your area</li>
                        <li style="margin-bottom: 10px;">🌿 Gardening tips and seasonal reminders</li>
                        <li style="margin-bottom: 10px;">🏆 Community success stories</li>
                        <li style="margin-bottom: 10px;">✨ New feature updates</li>
                    </ul>
                    <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Coming in 2025:</strong> Hardy is launching in Kenosha and Racine Counties, Wisconsin. If you're in our pilot area, you'll be the first to know when we go live and/or about new features!</p>
                    </div>
                    <p>We're excited to help you connect with fellow gardeners in your neighborhood and make the most of your garden's bounty.</p>
                    <p style="margin-top: 30px;">Happy gardening! 🌻</p>
                    <p>The Hardy Team</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        Hardy Home and Garden · The Community Garden in Your Pocket<br>
                        You're receiving this because you signed up for Hardy updates.<br>
                        <a href="#" style="color: #4CAF50;">Unsubscribe</a> at any time.
                    </p>
                </div>
            </div>
        `
    };
}

// Helper function to send welcome email (updated to use new format)
async function sendWelcomeEmail(userEmail, userName) {
    try {
        const emailData = createWelcomeEmail(userName);
        await sendEmail({
            to: userEmail,
            subject: emailData.subject,
            html: emailData.html
        });
        console.log('Welcome email sent successfully');
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        throw error; // Re-throw so the calling function knows it failed
    }
}

// Helper function to send message notification (updated to use new format)
async function sendMessageNotification(recipientEmail, recipientName, senderName, listingTitle, messageContent, conversationId) {
    try {
        const emailData = createMessageNotificationEmail(recipientName, senderName, listingTitle, messageContent, conversationId);
        await sendEmail({
            to: recipientEmail,
            subject: emailData.subject,
            html: emailData.html
        });
        console.log('Message notification sent successfully');
    } catch (error) {
        console.error('Failed to send message notification:', error);
        throw error; // Re-throw so the calling function knows it failed
    }
}

// NEW: Helper function to send listing confirmation email
async function sendListingConfirmationEmail(userEmail, userName, listingTitle, listingId) {
    try {
        const emailData = createListingConfirmationEmail(userName, listingTitle, listingId);
        await sendEmail({
            to: userEmail,
            subject: emailData.subject,
            html: emailData.html
        });
        console.log('Listing confirmation email sent successfully');
    } catch (error) {
        console.error('Failed to send listing confirmation email:', error);
        // Don't re-throw here - we don't want email failure to block listing creation
    }
}

// NEW: Helper function to send newsletter welcome email
async function sendNewsletterWelcomeEmail(userEmail) {
    try {
        const emailData = createNewsletterWelcomeEmail();
        await sendEmail({
            to: userEmail,
            subject: emailData.subject,
            html: emailData.html
        });
        console.log('Newsletter welcome email sent successfully');
    } catch (error) {
        console.error('Failed to send newsletter welcome email:', error);
        // Don't re-throw here - we don't want email failure to block newsletter signup
    }
}

// NEW: Newsletter signup functionality
document.addEventListener('DOMContentLoaded', function() {
    // Handle all newsletter forms on the page
    const newsletterForms = document.querySelectorAll('.footer-newsletter form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const submitButton = form.querySelector('button[type="submit"]');
            
            if (!emailInput || !emailInput.value) return;
            
            const email = emailInput.value;
            const originalButtonText = submitButton.textContent;
            
            // Disable form while submitting
            emailInput.disabled = true;
            submitButton.disabled = true;
            submitButton.textContent = 'Subscribing...';
            
            try {
                // Store email in waitlist table with 'newsletter' feature
                const { error } = await window.hardySupabase
                    .from('waitlist')
                    .insert({
                        email: email,
                        feature: 'newsletter',
                        created_at: new Date().toISOString()
                    });
                
                if (error) {
                    // Check if it's a duplicate error
                    if (error.code === '23505') { // Postgres unique violation
                        // Email already exists - still show success
                        console.log('Email already subscribed');
                    } else {
                        throw error;
                    }
                }
                
                // Send welcome email
                try {
                    await sendNewsletterWelcomeEmail(email);
                } catch (emailError) {
                    console.error('Newsletter welcome email failed:', emailError);
                    // Don't block the signup if email fails
                }
                
                // Replace form with success message
                form.innerHTML = `
                    <div style="color: #4CAF50; padding: 10px; text-align: center;">
                        <i class="fas fa-check-circle" style="font-size: 1.5rem; margin-bottom: 5px;"></i>
                        <p style="margin: 0; font-weight: 600;">Thanks for subscribing! 🌱</p>
                        <small style="display: block; margin-top: 5px; opacity: 0.8;">Check your email for confirmation.</small>
                    </div>
                `;
                
                // Track the signup with Google Analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'newsletter_signup', { 
                        'event_category': 'engagement',
                        'event_label': 'footer'
                    });
                }
                
            } catch (error) {
                console.error('Newsletter signup error:', error);
                
                // Re-enable form
                emailInput.disabled = false;
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                
                // Show error message
                let errorMessage = 'Sorry, there was an error. Please try again.';
                
                // Check for specific error types
                if (error.message && error.message.includes('network')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                }
                
                // Create error element if it doesn't exist
                let errorElement = form.querySelector('.newsletter-error');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'newsletter-error';
                    errorElement.style.cssText = 'color: #d32f2f; font-size: 0.875rem; margin-top: 5px;';
                    form.appendChild(errorElement);
                }
                
                errorElement.textContent = errorMessage;
                
                // Remove error after 5 seconds
                setTimeout(() => {
                    if (errorElement) {
                        errorElement.remove();
                    }
                }, 5000);
            }
        });
    });
});