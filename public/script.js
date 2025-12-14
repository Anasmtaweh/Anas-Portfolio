document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
    }

    // Close mobile menu when a link is clicked
    const mobileLinks = mobileNav?.querySelectorAll('a');
    mobileLinks?.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.add('hidden');
        });
    });

    // Scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.animate-fade-in-up, .animate-slide-in').forEach(el => {
        observer.observe(el);
    });

    // Contact form
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            formStatus.textContent = 'Sending message...';
            formStatus.style.color = '#0ea5e9';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const formspreeEndpoint = 'https://formspree.io/f/mldnpdew';

                const response = await fetch(formspreeEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    formStatus.textContent = "Message sent successfully! Thank you.";
                    formStatus.style.color = '#10b981';
                    contactForm.reset();
                } else {
                    formStatus.textContent = (result.errors && result.errors.map(e => e.message).join(', ')) || 'An unexpected error occurred.';
                    formStatus.style.color = '#ef4444';
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                formStatus.textContent = 'Failed to send message. Please check your connection.';
                formStatus.style.color = '#ef4444';
            }
        });
    }
});