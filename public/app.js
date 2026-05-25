const form = document.querySelector('#rsvp-form');
const statusMessage = document.querySelector('#form-status');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusMessage.textContent = 'Saving your RSVP...';
  statusMessage.className = 'form-status';

  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    adults: Number(formData.get('adults')),
    kids: Number(formData.get('kids')),
    notes: formData.get('notes'),
  };

  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to save your RSVP.');
    }

    statusMessage.textContent = data.message;
    statusMessage.classList.add('success');
    form.reset();
    form.elements.adults.value = 1;
    form.elements.kids.value = 0;
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add('error');
  }
});
