/**
 * deviceLayout.js — Ajustes de layout por tipo de dispositivo.
 * Detecta mobile/tablet/desktop e aplica data-attributes no <html>.
 */

const applyDeviceLayout = () => {
  const w = window.innerWidth;
  const html = document.documentElement;

  if (w < 640) {
    html.setAttribute('data-device', 'mobile');
  } else if (w < 1024) {
    html.setAttribute('data-device', 'tablet');
  } else {
    html.setAttribute('data-device', 'desktop');
  }
};

applyDeviceLayout();
window.addEventListener('resize', applyDeviceLayout);
