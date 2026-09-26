// lukas, no peeking :)
// honor system. answers are sha-256 hashed, everything else is right here. be cool.

const plain = s => s.toLowerCase().replace(/\s+/g, '');
const mac = s => plain(s).replace(/[:.\-]/g, '');
const url = s => plain(s).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');

const CIPHER = `U2FsdGVkX19KuL5PHMpUc7y/pHfoOSsfsQqdVUtS5PAUTzE284TLK0znawCXOJyc
5ilz2PswNxi8sNJ5qGRvA6XbD43++bqdzYiWznOgb1M=`;

// stage N = what's on screen while solving puzzle N+1; `gain` is the letters its answer reveals
const STAGES = [
  { title: '404 not found', norm: plain, gain: 'o',
    hash: '3ba20bd4aba972d1a91a737baad47c7bddf0db23cf294b4926443fa482b6074a',
    html: '<p class="big">404</p><p>you at least got here.</p><p class="dim">kachna.lol</p>' },
  { title: 'kachna', norm: plain, gain: 'pe',
    hash: 'd1489efea1d3f03282ab4d03176a2e8304bac989bd409ab7fe8012aa3843cadd' },
  { title: 'kachna', norm: mac, gain: 'nr',
    hash: 'ee8f6e7b21e3960fb749b1e97c88ff4773542b1be17ae1c6850b02f6d9008530',
    html: '<p><a href="https://matymechuraduck.quickconnect.to" target="_blank" rel="noopener">matymechuraduck.quickconnect.to</a></p>' },
  { title: 'think in dns', norm: plain, gain: 'ou',
    hash: '92b1b6acc46760e1fae29fb6f826bf492c3929e7604dd2e7c81994b7fb407fcc' },
  { title: 'password1234', norm: url, gain: 'te',
    hash: 'b5d56b87a192a38ee81cacb3a615e98d5203ff7347fd3c405dbeec1fa60942fa',
    html: '<p>Nov 30, 2022</p>' },
  { title: 'kachna', norm: plain, gain: 'r',
    hash: '6c1220eaf486c5bb85b6693f85be2ae170986e8cebe65a571f68683762fdbb15',
    html: `<pre>${CIPHER}</pre>`,
    hints: ['salted, not hashed', 'openssl enc -d, you know the rest', 'the tab told you the password a while ago', 'aes-256-cbc with pbkdf2'] },
];

const $ = id => document.getElementById(id);
const get = k => { try { return localStorage.getItem('kachna.' + k); } catch {} };
const set = (k, v) => { try { localStorage.setItem('kachna.' + k, v); } catch {} };
const wrong = () => +get('wrong.' + stage) || 0;

async function sha(s) {
  if (!crypto.subtle) return sha256(s); // crypto.subtle only exists on https
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function sha256(s) {
  const rotr = (x, n) => (x >>> n) | (x << (32 - n)), K = [], H = [];
  for (let c = 2, n = 0; n < 64; c++) {
    let prime = true;
    for (let d = 2; d * d <= c; d++) if (c % d === 0) { prime = false; break; }
    if (!prime) continue;
    if (n < 8) H[n] = (c ** (1 / 2) * 2 ** 32) | 0;
    K[n++] = (c ** (1 / 3) * 2 ** 32) | 0;
  }
  const m = [...new TextEncoder().encode(s)], bits = m.length * 8;
  m.push(0x80);
  while (m.length % 64 !== 56) m.push(0);
  for (let i = 7; i >= 0; i--) m.push(i >= 4 ? 0 : (bits >>> (i * 8)) & 255);
  for (let i = 0; i < m.length; i += 64) {
    const w = [];
    for (let j = 0; j < 64; j++) {
      if (j < 16) { w[j] = (m[i + 4 * j] << 24) | (m[i + 4 * j + 1] << 16) | (m[i + 4 * j + 2] << 8) | m[i + 4 * j + 3]; continue; }
      const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let j = 0; j < 64; j++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((x, k) => H[k] = (H[k] + x) | 0);
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

let stage = Math.min(+get('stage') || 0, STAGES.length);

function hints() {
  $('hints').innerHTML = (STAGES[stage]?.hints || []).slice(0, Math.floor(wrong() / 3)).map(h => `<p>› ${h}</p>`).join('');
}

function render() {
  if (stage >= 3 && location.pathname !== '/cheekyboy') history.replaceState(null, '', '/cheekyboy');
  const s = STAGES[stage], got = STAGES.slice(0, stage).map(x => x.gain), a = $('a');
  const h1 = $('letters');
  h1.hidden = !stage;
  h1.className = s ? '' : 'done';
  h1.style.setProperty('--n', got.join('').length);
  h1.innerHTML = got.slice(0, -1).join('') + (stage ? `<b>${got.at(-1)}</b>` : '');
  $('release-notes').hidden = stage !== 1;
  $('stage').innerHTML = s ? s.html || '' : '<p>open a pull request on utilix. you know the title.</p>';
  document.title = s ? s.title : 'openrouter';
  $('f').hidden = !s;
  $('f').className = stage ? '' : 's0';
  $('msg').textContent = '';
  a.value = '';
  stage ? a.removeAttribute('maxlength') : a.maxLength = 15;
  hints();
  if (s) a.focus();
}

$('f').onsubmit = async e => {
  e.preventDefault();
  const a = $('a'), s = STAGES[stage];
  if (!a.value.trim()) return;
  if (await sha(s.norm(a.value)) === s.hash) {
    set('stage', ++stage);
    return render();
  }
  set('wrong.' + stage, wrong() + 1);
  $('msg').textContent = 'nope.';
  a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake');
  a.select();
  hints();
};

render();
