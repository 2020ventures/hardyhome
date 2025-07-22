// Hardy - Main Application JavaScript

// Document Ready Function
document.addEventListener('DOMContentLoaded', function() {
    console.log('Hardy application initialized');
    
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
    
    // Enhanced account button functionality
    const accountBtn = document.getElementById('account-btn');
    if (accountBtn) {
        accountBtn.addEventListener('click', function() {
            // Check if modals exist, create them if not
            let accountModal = document.getElementById('account-modal');
            
            if (!accountModal) {
                // Create modal container
                accountModal = document.createElement('div');
                accountModal.id = 'account-modal';
                accountModal.className = 'modal-container';
                
                // Create modal content
                accountModal.innerHTML = `
                    <div class="modal">
                        <button class="close-modal"><i class="fas fa-times"></i></button>
                        <h2>Sign In to Hardy</h2>
                        <p>Authentication features are coming soon! For now, you can browse all example listings without signing in.</p>
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="btn btn-primary close-btn">OK, Got It</button>
                        </div>
                    </div>
                `;
                
                // Add modal to body
                document.body.appendChild(accountModal);
                
                // Add event listeners for closing
                const closeBtn = accountModal.querySelector('.close-btn');
                const closeX = accountModal.querySelector('.close-modal');
                
                closeBtn.addEventListener('click', function() {
                    accountModal.style.display = 'none';
                });
                
                closeX.addEventListener('click', function() {
                    accountModal.style.display = 'none';
                });
                
                accountModal.addEventListener('click', function(e) {
                    if (e.target === accountModal) {
                        accountModal.style.display = 'none';
                    }
                });
            }
            
            // Show the modal
            accountModal.style.display = 'flex';
        });
    }
    
    // Handle support button click - navigate to support page
    const supportBtn = document.getElementById('support-btn');
    if (supportBtn) {
        supportBtn.addEventListener('click', function() {
            // Get the base URL to handle navigation from any page
            const isHomePage = window.location.pathname.endsWith('index.html') || 
                               window.location.pathname.endsWith('/');
            const supportUrl = isHomePage ? 'pages/support.html' : 'support.html';
            window.location.href = supportUrl;
        });
    }
    
    // Handle Create Listing button clicks for coming soon page
    const createListingBtns = document.querySelectorAll('.create-listing-btn, [href="#create"]');
    createListingBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // Determine the correct path based on current location
            const isHomePage = window.location.pathname.endsWith('index.html') || 
                               window.location.pathname.endsWith('/');
            const comingSoonUrl = isHomePage ? 'pages/coming-soon.html' : 'coming-soon.html';
            window.location.href = comingSoonUrl;
        });
    });
    
    // Handle My Listings button clicks for coming soon page
    const myListingsBtns = document.querySelectorAll('[href="#my-listings"]');
    myListingsBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // Determine the correct path based on current location
            const isHomePage = window.location.pathname.endsWith('index.html') || 
                               window.location.pathname.endsWith('/');
            const comingSoonUrl = isHomePage ? 'pages/coming-soon.html' : 'coming-soon.html';
            window.location.href = comingSoonUrl;
        });
    });
    
    // Handle Messages button clicks for coming soon page
    const messagesBtns = document.querySelectorAll('[href="#messages"]');
    messagesBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // Determine the correct path based on current location
            const isHomePage = window.location.pathname.endsWith('index.html') || 
                               window.location.pathname.endsWith('/');
            const comingSoonUrl = isHomePage ? 'pages/coming-soon.html' : 'coming-soon.html';
            window.location.href = comingSoonUrl;
        });
    });
    
    // Handle login and signup links
    const authLinks = document.querySelectorAll('[href="#login"], [href="#signup"]');
    authLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Trigger the same modal as the account button
            if (accountBtn) {
                accountBtn.click();
            }
        });
    });
    
    // Handle Contact button clicks on listing cards
    const contactBtns = document.querySelectorAll('.listing-card .btn-primary');
    contactBtns.forEach(btn => {
        if (btn.textContent === 'Contact') {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                // Show a coming soon message or redirect to coming soon page
                alert('Messaging features coming soon! This will allow you to contact gardeners directly.');
            });
        }
    });
    
    // Newsletter form handling
    const newsletterForms = document.querySelectorAll('.footer-newsletter form');
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                alert('Thanks for subscribing! We\'ll keep you updated on Hardy\'s development.');
                emailInput.value = '';
            }
        });
    });
});