// ==========================================
// HARDY CONFIGURATION - v2
// ==========================================

var SUPABASE_URL = 'https://asfinbvecejglhfojclp.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmluYnZlY2VqZ2xoZm9qY2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDYyODcsImV4cCI6MjA2NDU4MjI4N30.5NBfuWhO55DgFJvu4BXygrdJlRm5KkC8lwr3C7t8JGA';

// Email configuration (Resend) - API key stored securely in Netlify environment variables
var FROM_EMAIL = 'Hardy Home and Garden <notifications@hardyhome.us>';

// Initialize Supabase client (safe for multiple loads)
if (!window.hardySupabase) {
    window.hardySupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
var supabase = window.hardySupabase;

// Valid ZIP codes for Kenosha & Racine Counties
var KENOSHA_RACINE_ZIPS = [
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
var VALID_ZIPS = [...new Set(KENOSHA_RACINE_ZIPS)];

// V2 SIMPLIFIED CATEGORIES (reduced from 10 to 8)
var LISTING_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Herbs',
  'Seeds & Seedlings',
  'Plants & Cuttings',
  'Eggs',
  'Honey',
  'Other'
];

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

// ==========================================
// V2 AUTHENTICATION - MAGIC LINK
// ==========================================

// Send magic link
async function sendMagicLink(email, rememberMe = true) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/pages/auth-callback.html`,
        shouldCreateUser: true,
        data: {
          remember_me: rememberMe
        }
      }
    });
    
    if (error) throw error;
    
    // Store remember preference locally
    if (rememberMe) {
      localStorage.setItem('hardy_remember_preference', 'true');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Magic link error:', error);
    return { success: false, error: error.message };
  }
}

// Verify OTP code (for corporate email users who can't click magic links)
async function verifyLoginCode(email, code) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email'
    });

    if (error) throw error;
    if (!data.session) throw new Error('No session returned');

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    // Set remember token if requested
    const rememberMe = localStorage.getItem('hardy_remember_preference') === 'true';
    if (rememberMe) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const expiry = new Date(Date.now() + thirtyDays);
      localStorage.setItem('hardy_remember_token', data.session.access_token);
      localStorage.setItem('hardy_token_expiry', expiry.toISOString());
      localStorage.setItem('hardy_user_token', data.session.access_token);
    } else {
      localStorage.setItem('hardy_user_token', data.session.access_token);
    }

    if (!profile || !profile.nickname) {
      return { success: true, needsProfile: true, userId: data.session.user.id, email: data.session.user.email };
    }

    return { success: true, hasProfile: true };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: error.message };
  }
}

// Handle magic link callback
async function handleMagicLinkCallback() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (!session) throw new Error('No session found');
    
    // Check if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    // Set remember token if requested
    const rememberMe = localStorage.getItem('hardy_remember_preference') === 'true';
    if (rememberMe) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const expiry = new Date(Date.now() + thirtyDays);
      localStorage.setItem('hardy_remember_token', session.access_token);
      localStorage.setItem('hardy_token_expiry', expiry.toISOString());
      localStorage.setItem('hardy_user_token', session.access_token);
    } else {
      // Session only
      localStorage.setItem('hardy_user_token', session.access_token);
    }
    
    // If no profile, redirect to profile completion
    if (!profile || !profile.nickname) {
      return { needsProfile: true, userId: session.user.id };
    }
    
    return { success: true, hasProfile: true };
  } catch (error) {
    console.error('Magic link callback error:', error);
    return { success: false, error: error.message };
  }
}

// Check current auth status
async function checkAuth() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Check remember token
      const rememberToken = localStorage.getItem('hardy_remember_token');
      const tokenExpiry = localStorage.getItem('hardy_token_expiry');
      
      if (rememberToken && tokenExpiry) {
        const now = new Date().getTime();
        const expiry = new Date(tokenExpiry).getTime();
        
        if (now < expiry) {
          // Token still valid, restore session
          const { data: { user: restoredUser }, error } = await supabase.auth.setSession({
            access_token: rememberToken,
            refresh_token: rememberToken
          });
          
          if (!error && restoredUser) {
            return { isAuthenticated: true, user: restoredUser };
          }
        }
      }
      
      // No valid session
      return { isAuthenticated: false, user: null };
    }
    
    return { isAuthenticated: true, user };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, user: null };
  }
}

// Sign out
async function signOut() {
  try {
    await supabase.auth.signOut();
    // Clear all local storage
    localStorage.removeItem('hardy_user_token');
    localStorage.removeItem('hardy_remember_token');
    localStorage.removeItem('hardy_token_expiry');
    localStorage.removeItem('hardy_remember_preference');
    localStorage.removeItem('hardy_message_listing');
    
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// ==========================================
// V2 MESSAGING - SIMPLIFIED SINGLE TABLE
// ==========================================

// Send a message (v2 simplified)
async function sendMessage(listingId, recipientId, content) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Insert message into simplified table
    const { data: message, error } = await supabase
      .from('messages_v2')
      .insert({
        listing_id: listingId,
        sender_id: user.id,
        recipient_id: recipientId,
        content: content
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Get recipient info for email notification
    const { data: recipient } = await supabase
      .from('profiles')
      .select('email, full_name, nickname')
      .eq('id', recipientId)
      .single();
    
    // Get sender info
    const { data: sender } = await supabase
      .from('profiles')
      .select('nickname, full_name')
      .eq('id', user.id)
      .single();
    
    // Get listing info
    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', listingId)
      .single();
    
    // Send email notification (don't await - fire and forget)
    if (recipient?.email) {
      sendMessageNotification(
        recipient.email,
        recipient.nickname || recipient.full_name || 'Hardy User',
        sender?.nickname || sender?.full_name || 'A Hardy neighbor',
        listing?.title || 'a listing',
        content.substring(0, 100)
      ).catch(err => console.error('Email notification failed:', err));
    }
    
    return { success: true, message };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error.message };
  }
}

// Get messages for current user (grouped by listing)
async function getMyMessages() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Get all messages where user is sender or recipient
    const { data: messages, error } = await supabase
      .from('messages_v2')
      .select(`
        *,
        listing:listings(id, title, user_id),
        sender:profiles!messages_v2_sender_id_fkey(id, nickname, full_name),
        recipient:profiles!messages_v2_recipient_id_fkey(id, nickname, full_name)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Group messages by listing
    const grouped = {};
    messages.forEach(msg => {
      const listingId = msg.listing_id;
      if (!grouped[listingId]) {
        grouped[listingId] = {
          listing: msg.listing,
          messages: [],
          otherUser: msg.sender_id === user.id ? msg.recipient : msg.sender,
          unreadCount: 0
        };
      }
      grouped[listingId].messages.push(msg);
      if (msg.recipient_id === user.id && !msg.is_read) {
        grouped[listingId].unreadCount++;
      }
    });
    
    return { success: true, conversations: Object.values(grouped), userId: user.id };
  } catch (error) {
    console.error('Get messages error:', error);
    return { success: false, error: error.message };
  }
}

// Mark messages as read
async function markMessagesRead(listingId, otherUserId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('messages_v2')
      .update({ is_read: true })
      .eq('listing_id', listingId)
      .eq('sender_id', otherUserId)
      .eq('recipient_id', user.id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Mark read error:', error);
    return { success: false, error: error.message };
  }
}

// Get unread message count
async function getUnreadCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, count: 0 };
    
    const { count, error } = await supabase
      .from('messages_v2')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
    
    if (error) throw error;
    
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Unread count error:', error);
    return { success: false, count: 0 };
  }
}

// ==========================================
// LISTINGS
// ==========================================

// Get active listings with auto-expire filtering
async function getActiveListings(filters = {}) {
  try {
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles (
          id,
          nickname,
          full_name,
          neighborhood,
          zip_code
        )
      `)
      .eq('is_active', true)
      .in('zip_code', VALID_ZIPS);
    
    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.listing_type) {
      query = query.eq('listing_type', filters.listing_type);
    }
    if (filters.exchange_type) {
      if (filters.exchange_type === 'free') {
        query = query.or('exchange_type.eq.free,exchange_type.eq.free\\,trade');
      } else if (filters.exchange_type === 'trade') {
        query = query.or('exchange_type.eq.trade,exchange_type.eq.free\\,trade');
      }
    }
    
    const { data: listings, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Filter out expired listings (auto-expire logic)
    const now = new Date();
    const activeListings = listings.filter(listing => {
      if (!listing.expires_at) return true; // No expiry set
      const expiryDate = new Date(listing.expires_at);
      return expiryDate > now;
    });
    
    return { success: true, listings: activeListings };
  } catch (error) {
    console.error('Get listings error:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// EMAIL FUNCTIONS (Updated for v2)
// ==========================================

// Email function using Netlify Function
async function sendEmail(emailData) {
    try {
        let to, subject, html;
        
        if (typeof emailData === 'object' && emailData.to) {
            to = emailData.to;
            subject = emailData.subject;
            html = emailData.html;
        } else {
            // Legacy support
            to = arguments[0];
            subject = arguments[1];
            html = arguments[2];
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

// Email templates (keeping existing ones)
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

function createMessageNotificationEmail(recipientName, senderName, listingTitle, messagePreview) {
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
                        <p style="margin: 0; color: #666;">"${messagePreview}"</p>
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
                </div>
            </div>
        `
    };
}

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
                    <p>Great news! Your listing "${listingTitle}" is now live on Hardy.</p>
                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>🏡 Neighbors in your area can view your listing</li>
                        <li>💬 You'll receive email notifications for messages</li>
                        <li>✏️ Edit or remove your listing anytime from your dashboard</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://hardyhome.us/pages/dashboard.html" 
                           style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Your Dashboard
                        </a>
                    </div>
                    <p>Happy sharing!</p>
                    <p>The Hardy Team</p>
                </div>
            </div>
        `
    };
}

// Helper email functions
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
        // Don't throw - email failure shouldn't block signup
    }
}

async function sendMessageNotification(recipientEmail, recipientName, senderName, listingTitle, messagePreview) {
    try {
        const emailData = createMessageNotificationEmail(recipientName, senderName, listingTitle, messagePreview);
        await sendEmail({
            to: recipientEmail,
            subject: emailData.subject,
            html: emailData.html
        });
        console.log('Message notification sent successfully');
    } catch (error) {
        console.error('Failed to send message notification:', error);
        // Don't throw - email failure shouldn't block messaging
    }
}

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
        // Don't throw - email failure shouldn't block listing creation
    }
}
