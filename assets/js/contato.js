(function () {
  var c = window.SITE_CONFIG || {};
  if (c.whatsapp_e164) {
    document.getElementById('link-whatsapp').href = 'https://wa.me/' + c.whatsapp_e164.replace(/\D/g, '');
    document.getElementById('txt-whatsapp').textContent = c.whatsapp_exibicao || c.whatsapp_e164;
    document.getElementById('canal-whatsapp').hidden = false;
  }
  if (/^https:\/\/([a-z]+\.)?linkedin\.com\//.test(c.linkedin || '')) {
    document.getElementById('link-linkedin').href = c.linkedin;
    document.getElementById('canal-linkedin').hidden = false;
  }
})();
