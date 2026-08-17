(()=>{
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const drawer = $('#etikInfoDrawer');
  if (!drawer || $('#etikCreatorCard')) return;

  const cards = [...drawer.querySelectorAll('.etik-menu-card')];
  const contactCard = cards.find(card => card.querySelector('summary')?.textContent.includes('Contacto'));
  if (!contactCard) return;

  const creatorCard = document.createElement('div');
  creatorCard.className = 'etik-menu-card';
  creatorCard.id = 'etikCreatorCard';
  creatorCard.innerHTML = `
    <details>
      <summary>👤 Sobre el creador</summary>
      <div class="etik-menu-card-content">
        <p><strong>@springi790</strong> es el creador y desarrollador principal de Etik.</p>
        <p>Etik nació como un proyecto independiente enfocado en hacer el diseño e impresión de etiquetas más accesible desde navegador y dispositivos móviles.</p>
        <div class="etik-help-note">Core development by @springi790 · UI/UX design assistance by GPT-5.6 Sol · OpenAI.</div>
      </div>
    </details>
  `;
  contactCard.parentNode.insertBefore(creatorCard, contactCard);

  const contactContent = contactCard.querySelector('.etik-menu-card-content');
  if (contactContent && !$('#etikContactEmail')) {
    const email = document.createElement('a');
    email.id = 'etikContactEmail';
    email.className = 'etik-contact-row';
    email.href = 'mailto:elviraangel00@gmail.com?subject=Etik';
    email.innerHTML = `
      <span class="etik-contact-icon">@</span>
      <span><strong>Correo electrónico</strong><small>elviraangel00@gmail.com</small></span>
    `;
    const firstLink = contactContent.querySelector('.etik-contact-row');
    contactContent.insertBefore(email, firstLink || null);
  }
})();
