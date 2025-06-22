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
                const response = await fetch('/submit-contact-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    formStatus.textContent = result.message;
                    formStatus.style.color = 'green';
                    contactForm.reset(); // Clear the form on success
                } else {
                    formStatus.textContent = result.error || 'An unexpected error occurred.';
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