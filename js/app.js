// SwipeRight — App Logic (Supabase edition)
const APP = {
  session: null,
  ownedCards: [],
  currentPage: null,
  checkoutStore: null,
  checkoutAmount: 0,
};

function $(id) { return document.getElementById(id); }

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = $(id);
  if (pg) { pg.classList.add('active'); APP.currentPage = id; window.scrollTo(0,0); }
  updateNav();
}

function toast(msg, type='') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast ' + type;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

function setMsg(id, text, type) {
  const el = $(id); if (!el) return;
  el.textContent = text; el.className = 'msg ' + (type||'');
}

function saveCards() {
  localStorage.setItem('sr_cards', JSON.stringify(APP.ownedCards));
  if (APP.session) syncCardsToSupabase();
}

function loadCards() {
  try { APP.ownedCards = JSON.parse(localStorage.getItem('sr_cards')) || []; } catch(e) { APP.ownedCards = []; }
}

async function syncCardsToSupabase() {
  if (!APP.session) return;
  await sb.from('user_cards').upsert({
    user_id: APP.session.id,
    cards: APP.ownedCards,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
}

async function loadCardsFromSupabase() {
  if (!APP.session) return;
  const { data } = await sb.from('user_cards').select('cards').eq('user_id', APP.session.id).single();
  if (data?.cards) {
    APP.ownedCards = data.cards;
    localStorage.setItem('sr_cards', JSON.stringify(APP.ownedCards));
  }
}

function updateNav() {
  const navRight = $('nav-right');
  if (APP.session) {
    const initial = (APP.session.email || 'U')[0].toUpperCase();
    navRight.innerHTML = `
      <button class="nav-link" onclick="showPage('page-checkout')">Optimize</button>
      <button class="nav-link" onclick="showPage('page-setup')">My Cards</button>
      <div class="nav-user">
        <div class="nav-avatar">${initial}</div>
        <button class="nav-link" onclick="signOut()">Sign out</button>
      </div>`;
  } else {
    navRight.innerHTML = `
      <button class="nav-link" onclick="showPage('page-guest')">Try as guest</button>
      <button class="nav-btn" onclick="showPage('page-login')">Sign in</button>`;
  }
}

async function signOut() {
  await sb.auth.signOut();
  APP.session = null;
  toast('Signed out.');
  showPage('page-home');
}

let loginEmail = '';

async function loginStep1() {
  const email = $('login-email').value.trim();
  if (!email || !email.includes('@')) {
    setMsg('login-msg', 'Please enter a valid email.', 'error'); return;
  }
  loginEmail = email;
  const btn = $('login-send-btn');
  btn.disabled = true; btn.textContent = 'Sending…';
  setMsg('login-msg', '', '');

 const { error } = await sb.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: true, data: {} }
});

  btn.disabled = false; btn.textContent = 'Continue →';

  if (error) {
    setMsg('login-msg', error.message, 'error');
  } else {
    $('login-step1').style.display = 'none';
    $('login-step2').style.display = 'block';
    $('login-email-shown').textContent = email;
    clearOTP(); $('otp-0').focus();
  }
}

function clearOTP() {
  for (let i = 0; i < 6; i++) {
    const b = $('otp-' + i); if (!b) continue;
    b.value = ''; b.classList.remove('filled');
  }
  if ($('verify-btn')) $('verify-btn').disabled = true;
  setMsg('otp-msg', '', '');
}

function backToEmail() {
  $('login-step2').style.display = 'none';
  $('login-step1').style.display = 'block';
  clearOTP();
}

async function resendOTP() {
  clearOTP();
  await sb.auth.signInWithOtp({ email: loginEmail, options: { shouldCreateUser: true } });
  toast('New code sent — check your inbox.', 'success');
  $('otp-0').focus();
}

async function verifyOTP() {
  let code = '';
  for (let i = 0; i < 6; i++) code += ($('otp-' + i)?.value || '');
  const btn = $('verify-btn');
  btn.disabled = true; btn.textContent = 'Verifying…';
  setMsg('otp-msg', '', '');

  const { data, error } = await sb.auth.verifyOtp({
    email: loginEmail,
    token: code,
    type: 'email'
  });

  if (error) {
    setMsg('otp-msg', 'Incorrect code. Please try again.', 'error');
    clearOTP(); $('otp-0').focus();
    btn.disabled = false; btn.textContent = 'Sign in';
  } else {
    APP.session = { id: data.user.id, email: data.user.email };
    await loadCardsFromSupabase();
    toast('Signed in!', 'success');
    showPage(APP.ownedCards.length ? 'page-checkout' : 'page-setup');
  }
}

function checkOTPFull() {
  let full = true;
  for (let i = 0; i < 6; i++) { if (!$('otp-' + i)?.value) { full = false; break; } }
  if ($('verify-btn')) $('verify-btn').disabled = !full;
}

function initOTPBoxes() {
  for (let i = 0; i < 6; i++) {
    const box = $('otp-' + i); if (!box) continue;
    box.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[0] : '';
      e.target.classList.toggle('filled', !!val);
      if (val && i < 5) $('otp-' + (i+1)).focus();
      checkOTPFull();
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        const prev = $('otp-' + (i-1));
        prev.value = ''; prev.classList.remove('filled');
        prev.focus(); checkOTPFull();
      }
    });
    box.addEventListener('paste', e => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
      for (let j = 0; j < 6 && j < paste.length; j++) {
        const b = $('otp-' + j); b.value = paste[j]; b.classList.add('filled');
      }
      checkOTPFull();
      $('otp-' + Math.min(paste.length-1, 5)).focus();
    });
  }
}

function initSetupPage() {
  const catMap = {
    travel:   ['amex-platinum','chase-sapphire-reserve','chase-sapphire-preferred','cap1-venture-x'],
    cashback: ['amex-gold','amex-bce','amex-bcp','chase-freedom-unlimited','chase-freedom-flex','citi-double-cash','citi-custom-cash','wells-active-cash','discover-it','boa-customized-cash','boa-travel-rewards','cap1-savor-one'],
    store:    ['amazon-prime-visa','apple-card','costco-visa','target-redcard'],
  };
  Object.entries(catMap).forEach(([cat, ids]) => {
    const container = $('setup-grid-' + cat); if (!container || container.dataset.built) return;
    container.dataset.built = '1';
    ids.forEach(cardId => {
      const card = CARDS_DB.find(c => c.id === cardId); if (!card) return;
      const tile = document.createElement('div');
      tile.className = 'card-tile' + (APP.ownedCards.includes(card.id) ? ' selected' : '');
      tile.id = 'ctile-' + card.id;
      tile.innerHTML = `
        <div class="card-vis" style="background:linear-gradient(135deg,${card.color[0]},${card.color[1]})"><div class="card-chip"></div></div>
        <div class="card-name">${card.name}</div>
        <div class="card-bank">${card.issuer}</div>
        <div class="card-perks">${card.perks.slice(0,2).map(p=>`<span class="perk">${p}</span>`).join('')}</div>`;
      tile.addEventListener('click', () => toggleSetupCard(card.id));
      container.appendChild(tile);
    });
  });
  updateSetupBar();
}

function toggleSetupCard(id) {
  const idx = APP.ownedCards.indexOf(id);
  if (idx >= 0) APP.ownedCards.splice(idx, 1); else APP.ownedCards.push(id);
  $('ctile-' + id)?.classList.toggle('selected', APP.ownedCards.includes(id));
  updateSetupBar();
}

function updateSetupBar() {
  const chips = $('setup-chips'), count = $('setup-count'), btn = $('setup-continue-btn');
  count.textContent = APP.ownedCards.length + (APP.ownedCards.length === 1 ? ' card' : ' cards');
  btn.disabled = APP.ownedCards.length === 0;
  if (!APP.ownedCards.length) {
    chips.innerHTML = '<span style="font-size:12px;color:var(--text-3);font-style:italic;">Tap a card below to add it</span>'; return;
  }
  chips.innerHTML = '';
  APP.ownedCards.forEach(id => {
    const card = CARDS_DB.find(c => c.id === id); if (!card) return;
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = card.name + ' <span style="opacity:.5;font-size:10px;">✕</span>';
    chip.addEventListener('click', () => toggleSetupCard(id));
    chips.appendChild(chip);
  });
}

function saveSetupAndContinue() { saveCards(); showPage('page-checkout'); }

function initGuestPage() {
  const container = $('guest-card-grid'); if (!container || container.dataset.built) return;
  container.dataset.built = '1';
  CARDS_DB.forEach(card => {
    const tile = document.createElement('div');
    tile.className = 'card-tile' + (APP.ownedCards.includes(card.id) ? ' selected' : '');
    tile.id = 'gtile-' + card.id;
    tile.innerHTML = `
      <div class="card-vis" style="background:linear-gradient(135deg,${card.color[0]},${card.color[1]})"><div class="card-chip"></div></div>
      <div class="card-name">${card.name}</div>
      <div class="card-bank">${card.issuer}</div>
      <div class="card-perks">${card.perks.slice(0,2).map(p=>`<span class="perk">${p}</span>`).join('')}</div>`;
    tile.addEventListener('click', () => toggleGuestCard(card.id));
    container.appendChild(tile);
  });
  updateGuestBar();
}

function toggleGuestCard(id) {
  const idx = APP.ownedCards.indexOf(id);
  if (idx >= 0) APP.ownedCards.splice(idx, 1); else APP.ownedCards.push(id);
  $('gtile-' + id)?.classList.toggle('selected', APP.ownedCards.includes(id));
  updateGuestBar();
}

function updateGuestBar() {
  const chips = $('guest-chips'), count = $('guest-count'), btn = $('guest-continue-btn');
  count.textContent = APP.ownedCards.length + (APP.ownedCards.length === 1 ? ' card' : ' cards');
  btn.disabled = APP.ownedCards.length === 0;
  if (!APP.ownedCards.length) {
    chips.innerHTML = '<span style="font-size:12px;color:var(--text-3);font-style:italic;">Select cards from the list below</span>'; return;
  }
  chips.innerHTML = '';
  APP.ownedCards.forEach(id => {
    const card = CARDS_DB.find(c => c.id === id); if (!card) return;
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = card.name + ' <span style="opacity:.5;font-size:10px;">✕</span>';
    chip.addEventListener('click', () => toggleGuestCard(id));
    chips.appendChild(chip);
  });
}

function initCheckoutPage() {
  const grid = $('checkout-store-grid'); if (!grid || grid.dataset.built) return;
  grid.dataset.built = '1';
  STORES.forEach(s => {
    const btn = document.createElement('div');
    btn.className = 'store-btn'; btn.id = 'sbtn-' + s.id;
    btn.innerHTML = `<span class="store-icon">${s.icon}</span><span class="store-label">${s.label}</span>`;
    btn.addEventListener('click', () => selectStore(s));
    grid.appendChild(btn);
  });
}

function selectStore(s) {
  if (APP.checkoutStore) $('sbtn-' + APP.checkoutStore.id)?.classList.remove('active');
  APP.checkoutStore = s;
  $('sbtn-' + s.id).classList.add('active');
  updateWalletPreview(); checkCheckoutReady();
}

function setAmount(val) {
  $('checkout-amount').value = val; APP.checkoutAmount = val; checkCheckoutReady();
}

function updateWalletPreview() {
  const container = $('checkout-wallet-preview'); if (!container || !APP.checkoutStore) return;
  const owned = CARDS_DB.filter(c => APP.ownedCards.includes(c.id));
  if (!owned.length) { container.innerHTML = '<p class="hint" style="padding:12px;">No cards selected yet.</p>'; return; }
  const ranked = owned.map(card => ({ card, rate: getRate(card, APP.checkoutStore.category) })).sort((a,b) => b.rate - a.rate);
  container.innerHTML = '';
  ranked.forEach(({card, rate}) => {
    const rc = rate >= 4 ? 'rate-high' : rate >= 2 ? 'rate-mid' : 'rate-low';
    const row = document.createElement('div');
    row.className = 'wallet-preview';
    row.innerHTML = `
      <div style="width:44px;height:29px;border-radius:6px;background:linear-gradient(135deg,${card.color[0]},${card.color[1]});display:flex;align-items:flex-end;padding:4px 5px;flex-shrink:0;">
        <div style="width:11px;height:8px;background:rgba(255,215,0,0.75);border-radius:2px;"></div>
      </div>
      <div style="flex:1"><div style="font-size:13px;font-weight:600;">${card.name}</div><div style="font-size:11px;color:var(--text-3);">${card.issuer}</div></div>
      <span class="wallet-rate ${rc}">${rate}% back</span>`;
    container.appendChild(row);
  });
}

function checkCheckoutReady() {
  const amt = parseFloat($('checkout-amount')?.value || 0);
  APP.checkoutAmount = amt;
  if ($('checkout-go-btn')) $('checkout-go-btn').disabled = !(APP.checkoutStore && amt > 0);
}

function goToResult() { showPage('page-result'); buildResult(); }

function buildResult() {
  if (!APP.checkoutStore || !APP.checkoutAmount) return;
  const { category, label: storeLabel } = APP.checkoutStore;
  const amount = APP.checkoutAmount;
  const owned = CARDS_DB.filter(c => APP.ownedCards.includes(c.id));
  if (!owned.length) { $('result-content').innerHTML = '<p class="muted" style="padding:20px;">No cards in your wallet.</p>'; return; }

  const ranked = owned.map(card => {
    const rate = getRate(card, category);
    return { card, rate, earned: +(amount * rate / 100).toFixed(2) };
  }).sort((a,b) => b.earned - a.earned);

  const best = ranked[0];
  let html = `
    <div class="result-best fade-up fade-up-1">
      <div class="best-label">Best pick for ${storeLabel}</div>
      <div class="best-card-row">
        <div class="result-card-vis" style="background:linear-gradient(135deg,${best.card.color[0]},${best.card.color[1]})"><div class="result-card-chip"></div></div>
        <div><div class="best-card-name">${best.card.name}</div><div class="best-card-bank">${best.card.issuer}</div></div>
      </div>
      <div class="reward-big">
        <div class="reward-amount">$${best.earned.toFixed(2)}</div>
        <div class="reward-sub">earned on $${amount.toFixed(2)}</div>
      </div>
      <div class="reward-rate">${best.rate}% cash back at ${storeLabel}</div>
      <div style="margin-top:14px;display:flex;gap:5px;flex-wrap:wrap;">${best.card.perks.map(p=>`<span class="perk" style="font-size:10px;">${p}</span>`).join('')}</div>
    </div>`;

  if (ranked.length > 1) {
    html += `<div class="fade-up fade-up-2"><div class="field-label" style="margin-bottom:10px;">All your cards</div><div class="result-list">`;
    ranked.forEach((item, i) => {
      const rc = item.rate >= 4 ? 'rate-high' : item.rate >= 2 ? 'rate-mid' : 'rate-low';
      html += `<div class="result-row">
        <div style="font-weight:700;font-size:12px;min-width:20px;text-align:center;color:${i===0?'var(--purple-light)':'var(--text-3)'};">${i===0?'★':`#${i+1}`}</div>
        <div style="width:40px;height:27px;border-radius:5px;background:linear-gradient(135deg,${item.card.color[0]},${item.card.color[1]});display:flex;align-items:flex-end;padding:4px 5px;flex-shrink:0;"><div style="width:11px;height:8px;background:rgba(255,215,0,0.7);border-radius:2px;"></div></div>
        <div style="flex:1"><div class="result-row-name">${item.card.name}</div><div class="result-row-bank">${item.card.issuer}</div></div>
        <span class="wallet-rate ${rc}">${item.rate}% · $${item.earned.toFixed(2)}</span>
      </div>`;
    });
    html += `</div></div>`;
  }

  if (!APP.session) {
    html += `<div class="guest-banner fade-up fade-up-3">
      <p><strong>Sign in to save your cards</strong><br>Open the app next time and your cards are already there.</p>
      <button class="btn btn-primary" onclick="showPage('page-login')" style="white-space:nowrap;">Sign in free →</button>
    </div>`;
  }

  html += `<div class="fade-up fade-up-4" style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
    <button class="btn btn-ghost" onclick="showPage('page-checkout')" style="flex:1;min-width:140px;">← Change store</button>
    <button class="btn btn-primary" onclick="showPage('page-checkout')" style="flex:1;min-width:140px;">New purchase →</button>
  </div>`;

  $('result-content').innerHTML = html;
  $('result-store-label').textContent = storeLabel;
}

document.addEventListener('DOMContentLoaded', async () => {
  loadCards();
  initOTPBoxes();

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    APP.session = { id: session.user.id, email: session.user.email };
    await loadCardsFromSupabase();
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      APP.session = { id: session.user.id, email: session.user.email };
      await loadCardsFromSupabase();
    }
    if (event === 'SIGNED_OUT') APP.session = null;
  });

  $('login-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') loginStep1(); });
  $('checkout-amount')?.addEventListener('input', checkCheckoutReady);

  const observer = new MutationObserver(() => {
    if ($('page-setup')?.classList.contains('active')) initSetupPage();
    if ($('page-guest')?.classList.contains('active')) initGuestPage();
    if ($('page-checkout')?.classList.contains('active')) { initCheckoutPage(); updateWalletPreview(); }
    if ($('page-login')?.classList.contains('active')) {
      $('login-step1').style.display = 'block';
      $('login-step2').style.display = 'none';
      $('login-email').value = '';
      clearOTP(); setMsg('login-msg','','');
    }
  });
  document.querySelectorAll('.page').forEach(p => observer.observe(p, { attributes: true, attributeFilter: ['class'] }));

  showPage(APP.session ? (APP.ownedCards.length ? 'page-checkout' : 'page-setup') : 'page-home');
});
