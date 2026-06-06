const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle?.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('active')));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.destination-card');
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filter = btn.dataset.filter;
  cards.forEach(card => card.classList.toggle('hide-card', filter !== 'all' && !card.dataset.category.includes(filter)));
}));

const serviceSelect = document.getElementById('serviceSelect');
const destinationSelect = document.getElementById('destinationSelect');
const messageBox = document.getElementById('messageBox');
function fillInquiry(type){
  const options = [...destinationSelect.options].map(o => o.text);
  if (options.includes(type)) destinationSelect.value = type;
  if (type.includes('Student')) serviceSelect.value = 'South India Student Trip';
  else if (type.includes('Visa')) serviceSelect.value = 'Visa Services';
  else if (type.includes('Consultation')) serviceSelect.value = 'Travel Consultation';
  else serviceSelect.value = 'Europe Tour Package';
  messageBox.value = `I would like to know more about ${type}. Please share package details, approximate budget, and available dates.`;
  document.querySelector('#inquiry').scrollIntoView({behavior:'smooth'});
}
document.querySelectorAll('[data-trip]').forEach(card => card.addEventListener('click', () => fillInquiry(card.dataset.trip)));
document.querySelectorAll('[data-pick]').forEach(btn => btn.addEventListener('click', () => fillInquiry(btn.dataset.pick)));

const topBtn = document.querySelector('.top-btn');
window.addEventListener('scroll', () => topBtn.classList.toggle('show', window.scrollY > 500));
topBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (e) => {
  if (!glow) return;
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
});

// Inquiry form -> Google Apps Script backend
const inquiryForm = document.getElementById('inquiryForm');
const formStatus = document.getElementById('formStatus');

// 1) Deploy google-apps-script.js as a Web App.
// 2) Paste the Web App URL below.
const INQUIRY_WEB_APP_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

inquiryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!INQUIRY_WEB_APP_URL || INQUIRY_WEB_APP_URL.includes('PASTE_YOUR')) {
    formStatus.textContent = 'Form is not connected yet. Please add the Google Apps Script Web App URL.';
    formStatus.classList.add('error');
    return;
  }

  const submitButton = inquiryForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';
  formStatus.textContent = '';
  formStatus.classList.remove('error');

  const formData = Object.fromEntries(new FormData(inquiryForm).entries());
  formData.submittedFrom = window.location.href;
  formData.submittedAt = new Date().toISOString();

  try {
    const response = await fetch(INQUIRY_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Submission failed');

    formStatus.textContent = 'Thank you. Your inquiry has been saved and our team has been notified.';
    inquiryForm.reset();
  } catch (error) {
    formStatus.textContent = 'Sorry, something went wrong. Please try again or contact us on WhatsApp.';
    formStatus.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Inquiry';
  }
});
