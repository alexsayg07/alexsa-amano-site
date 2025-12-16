// Form submission handler
document.querySelector('.contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Get form values
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const interest = document.getElementById('interest').value;
  const message = document.getElementById('message').value;

  // TODO: Validate inputs here if necessary
  // Here you would typically send to a backend/form service
  // For now, just show success message
  alert('Thank you for your message! I will get back to you soon.');
  
  // Reset form
  e.target.reset();
});