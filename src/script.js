(() => {
  'use strict';

  // ---------- AJUSTES (puedes cambiarlos) ----------
  const BOLSA = 3; // número de la bolsa que lleva el regalo bueno
  // Códigos guardados como huella SHA-256 (no aparecen en texto claro).
  // Por defecto: taza315 · cuentas · banii · pizarra
  const CODIGOS = {
    '01cd7998e04d2437a0d94ea88559f4e95624053457c1a2dde963170288e66368': 'pista1',
    '79630ad0ca911aaf8f716b20f1492615dbff764236cc50cae048ff48b9f8858e': 'pista2',
    '7edd4615f7cb38b028df8bf77c089c9bf1b252fe4670a0ee541ad3e6d8266dc1': 'pista3',
    '0b9011f3e7f7be164eaa73880973b3cd12d22f9d8eb1a3efae06e42090090b6e': 'pista4',
  };
  const NOMBRES = { pista1: 'Prueba 1: informe del forense', pista2: 'Prueba 2: coartadas', pista3: 'Prueba 3: libro de cuentas', pista4: 'Prueba 4: las tizas' };
  // Respuesta correcta: huella de "c:tizon" (culpable) y "m:chantaje" (móvil)
  const CULPABLE = '355ece28145223be7cf08c11771de9c290977502ffcdb533dfc9b37ddc96d23d';
  const MOVIL = 'c53107f6a37beab23a644b3dc3041272c650d5ea2c57a1ba4835cd5a1c780f60';
  // -------------------------------------------------

  const $ = (id) => document.getElementById(id);
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9|:]/g, '');
  const hash = async (s) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(norm(s)));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  // Para crear códigos nuevos: abre la consola del navegador y escribe  h('micodigo')
  window.h = async (s) => console.log(await hash(s));

  // Guardado con control de errores
  const KEY = 'comisaria-abiertas';
  let memoria = [];
  const leer = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return memoria; } };
  const guardar = (v) => { memoria = v; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

  function progreso() {
    const n = leer().length;
    $('progreso').textContent = `Pruebas reunidas: ${n}/4`;
    const lista = $('abiertas');
    lista.innerHTML = '';
    leer().sort().forEach((id) => {
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = NOMBRES[id];
      lista.appendChild(a);
    });
  }

  function mostrar() {
    let id = location.hash.slice(1) || 'inicio';
    const vista = $(id);
    if (!vista || !vista.classList.contains('vista')) id = 'inicio';
    if (id.startsWith('pista') && !leer().includes(id)) id = 'archivo';
    document.querySelectorAll('.vista').forEach((v) => v.classList.toggle('activa', v.id === id));
    window.scrollTo(0, 0);
    progreso();
  }

  function mensaje(el, texto, ok) {
    el.textContent = texto;
    el.classList.toggle('ok', !!ok);
  }

  if (!window.crypto || !crypto.subtle) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="aviso">Abre esta web desde su dirección https para que funcionen los códigos.</p>');
  }

  $('form-codigo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('msg-codigo');
    const pista = CODIGOS[await hash($('codigo').value)];
    if (!pista) return mensaje(msg, 'Código denegado. La comisaría no se anda con bromas.');
    const abiertas = leer();
    if (!abiertas.includes(pista)) guardar([...abiertas, pista]);
    $('codigo').value = '';
    mensaje(msg, '', true);
    location.hash = pista;
  });

  $('form-acusacion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('msg-acusacion');
    const okC = (await hash('c:' + $('culpable').value)) === CULPABLE;
    const okM = (await hash('m:' + $('movil').value)) === MOVIL;
    $('exito').hidden = !(okC && okM);
    if (okC && okM) {
      $('bolsa').textContent = `bolsa nº ${BOLSA}`;
      return mensaje(msg, '', true);
    }
    if (okC || okM) return mensaje(msg, 'Una de las dos cosas no cuadra. Repasa las pruebas.');
    mensaje(msg, 'Esa acusación no se sostiene. Revisa las coartadas y vuelve a intentarlo.');
  });

  $('reiniciar').addEventListener('click', () => {
    if (!confirm('¿Reiniciar el caso? Se borrarán las pruebas abiertas.')) return;
    guardar([]);
    $('exito').hidden = true;
    mensaje($('msg-acusacion'), '');
    location.hash = 'inicio';
    mostrar();
  });

  window.addEventListener('hashchange', mostrar);
  mostrar();
})();
