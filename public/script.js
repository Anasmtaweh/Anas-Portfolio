document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            formStatus.textContent = 'Sending message...';
            formStatus.style.color = '#007bff'; // Blue for sending

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                // IMPORTANT: Replace with your actual Formspree endpoint URL
                // Go to formspree.io, find your form, and copy the endpoint URL.
                // It will look like: https://formspree.io/f/xxxxxxxx
                const formspreeEndpoint = 'PASTE_YOUR_REAL_FORMSPREE_URL_HERE';

                const response = await fetch(formspreeEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' // Required by Formspree for AJAX
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    formStatus.textContent = "Message sent successfully! Thank you.";
                    formStatus.style.color = 'green';
                    contactForm.reset(); // Clear the form on success
                } else {
                    formStatus.textContent = (result.errors && result.errors.map(e => e.message).join(', ')) || 'An unexpected error occurred.';
                    formStatus.style.color = 'red';
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                formStatus.textContent = 'Failed to send message. Please check your connection.';
                formStatus.style.color = 'red';
            }
        });
    }
});