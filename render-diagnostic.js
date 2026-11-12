// Diagnostics run only on request; the results stay on the device.
(() => {
  if (new URLSearchParams(location.search).get('diagnostic') !== '1') return;
  const lines = ['Verificare randare 3D', 'Așteaptă până se termină încărcarea site-ului.'];
  let output;
  function record(message) {
    if (!lines.includes(message)) lines.push(message);
    if (output) output.textContent = lines.join('\n\n');
  }
  const originalError = console.error;
  console.error = function (...args) {
    originalError.apply(console, args);
    const message = args.map(arg => arg instanceof Error ? arg.message : String(arg)).join(' ');
    if (/webgl|shader|program|context|out of memory/i.test(message)) {
      const relevant = message.split('\n').filter(line => /error|failed|limit|exceed|too many|material|log:|validate|memory|context/i.test(line)).slice(0, 12).join('\n');
      record('Eroare 3D: ' + (relevant || message).slice(0, 1800));
    }
  };
  window.addEventListener('error', event => record('Eroare: ' + (event.message || 'necunoscută')));
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const result = getContext.call(this, type, ...args);
    if (this.id === 'world' && /^webgl2?$/i.test(type)) {
      if (!result) record('Contextul ' + type + ' nu a putut fi creat.');
      else {
        record('Context: ' + type + ' · limite: texturi ' + result.getParameter(result.MAX_TEXTURE_SIZE) + ', unități textură ' + result.getParameter(result.MAX_TEXTURE_IMAGE_UNITS) + ', uniforme fragment ' + result.getParameter(result.MAX_FRAGMENT_UNIFORM_VECTORS));
        this.addEventListener('webglcontextlost', () => record('Contextul grafic a fost pierdut.'));
      }
    }
    return result;
  };
  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.createElement('section');
    panel.setAttribute('aria-label', 'Verificare randare 3D');
    panel.style.cssText = 'position:fixed;inset:10px;z-index:2147483647;overflow:auto;background:#10231f;color:#f2f4e9;padding:18px;border:1px solid #7bb7a1;font:14px/1.5 system-ui;';
    const heading = document.createElement('h2'); heading.textContent = 'Verificare randare 3D';
    const instructions = document.createElement('p'); instructions.textContent = 'Așteaptă 30 de secunde, apoi trimite-mi o captură cu acest mesaj.';
    output = document.createElement('pre'); output.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.45 monospace;';
    output.textContent = lines.join('\n\n');
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Închide verificarea';
    close.style.cssText = 'padding:12px;background:#68dfc2;color:#10231f;border:0;';
    close.addEventListener('click', () => panel.remove());
    panel.append(heading, instructions, output, close); document.body.appendChild(panel);
  });
})();
