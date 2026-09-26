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
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
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
