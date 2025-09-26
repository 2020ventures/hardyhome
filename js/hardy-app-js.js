// Hardy v2 - Main Application JavaScript

// Document Ready Function
document.addEventListener('DOMContentLoaded', function() {
    console.log('Hardy v2 application initialized');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            if (mainNav.style.display === 'block') {
                mainNav.style.display = 'none';
            } else {
                mainNav.style.display = 'block';
            }
        });
    }
    
    // Enhanced account button functionality for v2 magic link
    const accountBtn = document.getElementById('account-btn');
    if (accountBtn) {
        accountBtn.addEventListener('click', function() {
            // Check if user is logged in (simplified check)
            const isLoggedIn = localStorage.getItem('hardy_user_token');
            
            if (isLoggedIn) {
                // If logged in, go to dashboard
                const isDashboardPage = window.location.pathname.includes('dashboard.html');
                if (!isDashboardPage) {
                    const isHomePage = window.location.pathname.endsWith('index.html') || 
                                     window.location.pathname.endsWith('/');
                    const dashboardUrl = isHomePage ? 'pages/dashboard.html' : 'dashboard.html';
                    window.location.href = dashboardUrl;
                }
            } else {
                // If not logged in, go to auth page
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname.endsWith('/');
                const authUrl = isHomePage ? 'pages/auth.html' : 'auth.html';
                window.location.href = authUrl;
            }
        });
    }
    
    // Handle support button click - navigate to support page
    const supportBtn = document.getElementById('support-btn');
    if (supportBtn) {
        supportBtn.addEventListener('click', function() {
            const isHomePage = window.location.pathname.endsWith('index.html') || 
                             window.location.pathname.endsWith('/');
            const supportUrl = isHomePage ? 'pages/support.html' : 'support.html';
            window.location.href = supportUrl;
        });
    }
    
    // Handle Create Listing button clicks
    const createListingBtns = document.querySelectorAll('.create-listing-btn, [href="#create"], [href="/create.html"]');
    createListingBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const isLoggedIn = localStorage.getItem('hardy_user_token');
            
            if (isLoggedIn) {
                // Go to create page
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname.endsWith('/');
                const createUrl = isHomePage ? 'pages/create.html' : 'create.html';
                window.location.href = createUrl;
            } else {
                // Redirect to auth page
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname.endsWith('/');
                const authUrl = isHomePage ? 'pages/auth.html' : 'auth.html';
                window.location.href = authUrl;
            }
        });
    });
    
    // Handle My Listings button clicks
    const myListingsBtns = document.querySelectorAll('[href="#my-listings"]');
    myListingsBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const isLoggedIn = localStorage.getItem('hardy_user_token');
            
            if (isLoggedIn) {
                // Go to dashboard listings tab
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname.endsWith('/');
                const dashboardUrl = isHomePage ? 'pages/dashboard.html#listings' : 'dashboard.html#listings';
                window.location.href = dashboardUrl;
            } else {
                // Redirect to auth page
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname.endsWith('/');
                const authUrl = isHomePage ? 'pages/auth.html' : 'auth.html';
                window.location.href = authUrl;
            }
        });
    });
    
    // Handle Messages button clicks - v2 simplified
    const messagesBtns = document.querySelectorAll('[href="#messages"]');
    messagesBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const isLoggedIn = localStorage.getItem('hardy_user_token');
            
            if (isLoggedIn) {
                // Go to dashboard messages tab (simplified in v2)
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname.endsWith('/');
                const dashboardUrl = isHomePage ? 'pages/dashboard.html#messages' : 'dashboard.html#messages';
                window.location.href = dashboardUrl;
            } else {
                // Redirect to auth page
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                 window.location.pathname.endsWith('/');
                const authUrl = isHomePage ? 'pages/auth.html' : 'auth.html';
                window.location.href = authUrl;
            }
        });
    });
    
    // Handle login and signup links - both go to magic link auth
    const authLinks = document.querySelectorAll('[href="#login"], [href="#signup"]');
    authLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const isHomePage = window.location.pathname.endsWith('index.html') || 
                             window.location.pathname.endsWith('/');
            const authUrl = isHomePage ? 'pages/auth.html' : 'auth.html';
            window.location.href = authUrl;
        });
    });
    
    // Handle Contact button clicks on listing cards - simplified for v2
    const contactBtns = document.querySelectorAll('.listing-card .btn-primary');
    contactBtns.forEach(btn => {
        if (btn.textContent === 'Contact' || btn.textContent.includes('Contact')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const isLoggedIn = localStorage.getItem('hardy_user_token');
                
                if (isLoggedIn) {
                    // In v2, this will open a simple message modal or redirect to messages
                    const listingId = btn.closest('.listing-card')?.dataset?.listingId;
                    if (listingId) {
                        // Store listing ID for message context
                        localStorage.setItem('hardy_message_listing', listingId);
                        const isHomePage = window.location.pathname.endsWith('index.html') || 
                                         window.location.pathname.endsWith('/');
                        const dashboardUrl = isHomePage ? 'pages/dashboard.html#messages' : 'dashboard.html#messages';
                        window.location.href = dashboardUrl;
                    }
                } else {
                    // Redirect to auth page
                    const isHomePage = window.location.pathname.endsWith('index.html') || 
                                     window.location.pathname.endsWith('/');
                    const authUrl = isHomePage ? 'pages/auth.html' : 'auth.html';
                    window.location.href = authUrl;
                }
            });
        }
    });
    
    // Newsletter form handling - can integrate with waitlist
    const newsletterForms = document.querySelectorAll('.footer-newsletter form');
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                // In production, this would add to waitlist
                alert('Thanks for subscribing! We\'ll keep you updated on Hardy\'s growth.');
                emailInput.value = '';
            }
        });
    });
    
    // Auto-logout check (for "Remember Me" feature)
    function checkAuthExpiry() {
        const rememberToken = localStorage.getItem('hardy_remember_token');
        const tokenExpiry = localStorage.getItem('hardy_token_expiry');
        
        if (rememberToken && tokenExpiry) {
            const now = new Date().getTime();
            const expiry = new Date(tokenExpiry).getTime();
            
            if (now > expiry) {
                // Token expired, clear auth
                localStorage.removeItem('hardy_user_token');
                localStorage.removeItem('hardy_remember_token');
                localStorage.removeItem('hardy_token_expiry');
                
                // Redirect to auth if on protected page
                const protectedPages = ['dashboard', 'create', 'edit-profile'];
                const currentPage = window.location.pathname;
                if (protectedPages.some(page => currentPage.includes(page))) {
                    window.location.href = '/pages/auth.html';
                }
            }
        }
    }
    
    // Check auth expiry on page load
    checkAuthExpiry();
    
    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#login' && href !== '#signup' && 
                href !== '#create' && href !== '#my-listings' && href !== '#messages') {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});