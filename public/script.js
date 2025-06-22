document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            formStatus.textContent = 'Sending...';
            formStatus.className = ''; // Reset classes

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/submit-contact-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    formStatus.textContent = result.message || 'Message sent successfully!';
                    formStatus.classList.add('success');
                    this.reset(); // Clear the form
                } else {
                    formStatus.textContent = result.error || 'Failed to send message. Please try again.';
                    formStatus.classList.add('error');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                formStatus.textContent = 'An error occurred. Please try again later.';
                formStatus.classList.add('error');
            }
        });
    }

    // Set current year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
});