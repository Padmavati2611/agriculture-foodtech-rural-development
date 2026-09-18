/* =========================================
   SunChill — Interactions
   Scroll reveals | Counters | Location & weather
   IoT gateway | Demo simulation | Alerts | AI risk | Map
   ========================================= */

(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- NAVBAR scroll state ---------- */
  const navbar = $('#navbar');
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = $('#hamburger');
  const navLinks = $('#navLinks');
  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#navLinks a').forEach(l => l.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Scroll reveal ---------- */
  $$('.section-head, .problem-card, .solution-text, .solution-flow, .flow-step, .feature-card, .arch-block, .impact-card, .impact-num, .tl-item, .callout, .sdg-strip, .hero-stats, .hero-visual, .cta-card, .loc-gate, .dash-card, .farmer-grid, .ai-card, .alert-card, .map-wrap, .how-card')
    .forEach((el, i) => { el.classList.add('reveal', `reveal-delay-${i % 4}`); });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Animated counters ---------- */
  const animateCount = (el) => {
    const target = +el.dataset.target, dur = 1600, start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  $$('.stat-num[data-target], .impact-num.big[data-target]').forEach(el => countIO.observe(el));

  /* =====================================================================
     LIVE DEMO — Location, Weather, IoT, AI
     ===================================================================== */
  const els = {
    locGate:    $('#locGate'),     liveWrap: $('#liveWrap'),
    btnLoc:     $('#btnLoc'),      btnLocRetry: $('#btnLocRetry'),
    locLoading: $('#locLoading'),  locErr: $('#locErr'),
    coords:     $('#fCoords'),     city: $('#wcCity'),
    temp:       $('#wcTemp'), cond: $('#wcCond'), cond2: $('#wcCond2'),
    humid:      $('#wcHumid'), updated: $('#wcUpdated'), icon: $('#wcIcon'),
    btnRefresh: $('#btnRefresh'),  clock: $('#liveClock'),
    locSearch: $('#locSearch'), btnSearch: $('#btnSearch'), locSearch2: $('#locSearch2'),
    btnSearch2: $('#btnSearch2'), locSearchErr: $('#locSearchErr'), locNote: $('#locNote'),
    btnSound: $('#btnSound'),
    calInput: $('#calInput'), btnCal: $('#btnCal'), btnCalReset: $('#btnCalReset'), calNote: $('#calNote'),
    fOutTempV:  $('#fOutTempV'),   fOutHumV: $('#fOutHumV'),
    coldTemp:   $('#coldTemp'),    coldNote: $('#coldNote'),     coldSrcChip: $('#coldSrcChip'),
    coldZoneSt: $('#coldZoneSt'),
    fColdV:     $('#fColdV'),      fColdSt: $('#fColdSt'), fColdCard: $('#fColdCard'),
    fBatteryV:  $('#fBatteryV'),   fBatterySt: $('#fBatterySt'),
    fSolarV:    $('#fSolarV'),
    fDoorV:     $('#fDoorV'),      fDoorSt: $('#fDoorSt'),
    fCoolV:     $('#fCoolV'),      fCoolSt: $('#fCoolSt'),
    fRiskV:     $('#fRiskV'),      fRiskSt: $('#fRiskSt'),
    riskPill:   $('#riskPill'),    riskBar:  $('#riskBar'),      aiNote: $('#aiNote'),
    alerts:     $('#alerts'),
    simToggle:  $('#simToggle'),
    iotBadge:   $('#iotBadge'),    demoBadge: $('#demoBadge'),
    mapFrame:   $('#mapFrame')
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad2 = n => String(n).padStart(2, '0');
  const fmtClock = d => pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  const fmtHMS = d => fmtClock(d) + ' &middot; ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();

  /* ---------- Audible alert system (Web Audio, no files) ---------- */
  let audioCtx = null;
  let soundOn = true;
  const ensureAudio = () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* audio not available */ }
  };
  const beep = (freq, times, gap) => {
    ensureAudio();
    if (!audioCtx || !soundOn) return;
    const t0 = audioCtx.currentTime;
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'square'; o.frequency.value = freq;
      const start = t0 + i * (gap + 0.16);
      g.gain.setValueAtTime(0.12, start);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(start); o.stop(start + 0.2);
    }
  };
  const alertSound = (level) => {
    if (level === 'red') beep(1180, level === 'red' ? 4 : 2, 0.22);
    else if (level === 'yellow') beep(720, 2, 0.18);
  };
  els.btnSound.addEventListener('click', () => {
    soundOn = !soundOn;
    ensureAudio();
    els.btnSound.textContent = '\u{1F50A} Sound: ' + (soundOn ? 'On' : 'Off');
    els.btnSound.classList.toggle('muted', !soundOn);
    beep(880, 1, 0);
  });

  /* ---------- State ---------- */
  const loc = { lat: null, lon: null, acc: null, granted: false, city: '—', region: '—', country: '—' };
  const weather = { temp: null, hum: null, code: null, condition: '—', updated: null, ok: false };
  const cal = { offset: 0, local: null };
  try { cal.offset = parseFloat(localStorage.getItem('sunchill_cal') || '0') || 0; } catch (e) { cal.offset = 0; }
  const getEffTemp = () => (weather.ok && weather.temp != null ? weather.temp + cal.offset : null);
  const sim = {
    on: false,
    coldTemp: 4.6, coldHum: 91,
    battery: 78, solar: 3.2, doorOpen: false, openingAt: null, cooling: 'ON',
    tempHistory: [4.6, 4.8, 4.7, 4.9, 4.5, 4.7, 4.6, 4.8],
    alerts: new Set()
  };

  /* ---------- Weather condition mapping (WMO) ---------- */
  const WMO = {
    0:  ['Clear sky', '\u2600\ufe0f'],  1: ['Mainly clear', '\u26c5'],
    2:  ['Partly cloudy', '\u26c5'],    3: ['Overcast', '\u2601\ufe0f'],
    45: ['Fog', '\U0001f32b\ufe0f'],    48: ['Depositing rime fog', '\U0001f32b\ufe0f'],
    51: ['Light drizzle', '\U0001f326\ufe0f'], 53: ['Drizzle', '\U0001f326\ufe0f'], 55: ['Dense drizzle', '\U0001f326\ufe0f'],
    56: ['Freezing drizzle', '\U0001f327\ufe0f'], 57: ['Freezing drizzle', '\U0001f327\ufe0f'],
    61: ['Light rain', '\U0001f327\ufe0f'], 63: ['Rain', '\U0001f327\ufe0f'], 65: ['Heavy rain', '\U0001f327\ufe0f'],
    66: ['Freezing rain', '\U0001f328\ufe0f'], 67: ['Freezing rain', '\U0001f328\ufe0f'],
    71: ['Light snow', '\U0001f328\ufe0f'], 73: ['Snow', '\U0001f328\ufe0f'], 75: ['Heavy snow', '\U0001f328\ufe0f'],
    77: ['Snow grains', '\U0001f328\ufe0f'],
    80: ['Light showers', '\U0001f326\ufe0f'], 81: ['Showers', '\U0001f326\ufe0f'], 82: ['Heavy showers', '\U0001f327\ufe0f'],
    85: ['Snow showers', '\U0001f328\ufe0f'], 86: ['Snow showers', '\U0001f328\ufe0f'],
    95: ['Thunderstorm', '\u26c8\ufe0f'], 96: ['Thunderstorm + hail', '\u26c8\ufe0f'], 99: ['Thunderstorm + hail', '\u26c8\ufe0f']
  };

  /* ---------- Reverse geocoding (Nominatim / OpenStreetMap) ---------- */
  async function reverseGeocode(lat, lon) {
    const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lon + '&accept-language=en';
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('geocode');
    const j = await res.json();
    const a = j.address || {};
    loc.city = a.city || a.town || a.village || a.municipality || a.county || a.state_district || 'Unknown';
    loc.region = a.state || a.state_district || a.region || '—';
    loc.country = a.country || '—';
  }

  /* ---------- Weather fetch (Open-Meteo, no API key) ---------- */
  async function fetchWeather() {
    if (loc.lat == null) return;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat +
      '&longitude=' + loc.lon + '&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=celsius';
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const j = await res.json();
      weather.temp = j.current.temperature_2m;
      weather.hum = j.current.relative_humidity_2m;
      weather.code = j.current.weather_code;
      weather.condition = (WMO[weather.code] || ['Unknown', '\u2753'])[0];
      weather.icon = 'icon-' + weather.code;
      weather.updated = new Date();
      weather.ok = true;
    } catch (e) {
      weather.ok = false;
    }
    paintWeather();
  }

  /* ---------- Paint live + region data ---------- */
  function paintWeather() {
    els.city.innerHTML = loc.city + (loc.region && loc.region !== '—' && loc.region !== loc.city ? ', ' + loc.region : '') + (loc.country ? ', ' + loc.country : '') +
      (loc.acc != null ? ' <span class="wc-acc">(GPS accuracy \u00b1' + (loc.acc / 1000).toFixed(2) + ' km)</span>' : '');
    els.coords.textContent = loc.lat.toFixed(4) + ', ' + loc.lon.toFixed(4);

    if (weather.ok) {
      const eff = getEffTemp();
      els.temp.textContent = eff.toFixed(1) + '\u00b0C';
      els.humid.textContent = Math.round(weather.hum) + '%';
      els.cond.textContent = weather.condition;
      els.cond2.textContent = weather.condition;
      els.icon.textContent = (WMO[weather.code] || ['', '\u2753'])[1];
      els.updated.textContent = fmtHMS(weather.updated);
      els.fOutTempV.textContent = eff.toFixed(1) + '\u00b0C';
      els.fOutHumV.textContent = Math.round(weather.hum) + '%';
      renderCalNote(eff);
      els.calInput.placeholder = weather.temp.toFixed(1) + ' is the API value \u2014 type your real one';
    } else {
      els.temp.innerHTML = 'unavailable';
      els.humid.textContent = '—';
      els.cond.textContent = 'Could not fetch weather';
      els.cond2.textContent = weather.condition;
      els.updated.textContent = 'not fetched';
      els.fOutTempV.textContent = '—';
      els.fOutHumV.textContent = '—';
      els.icon.textContent = '\u26a0\ufe0f';
    }
  }

  function renderCalNote(eff) {
    if (cal.offset && weather.temp != null) {
      els.calNote.innerHTML =
        'Synced to your thermometer: <b>' + eff.toFixed(1) + '&deg;C</b> shown ' +
        '(API base ' + weather.temp.toFixed(1) + '&deg;C &plus; ' + (cal.offset > 0 ? '+' : '') + cal.offset.toFixed(1) + '&deg;C offset).';
      els.btnCalReset.hidden = false;
    } else {
      els.calNote.innerHTML =
        'API value is model-based for this area and can differ a few degrees from your ground thermometer \u2014 use calibration to match it.';
      els.btnCalReset.hidden = true;
    }
  }

  els.btnCal.addEventListener('click', () => {
    const v = parseFloat(els.calInput.value);
    if (Number.isFinite(v) && weather.temp != null) {
      cal.offset = +(v - weather.temp).toFixed(1);
      cal.local = v;
      try { localStorage.setItem('sunchill_cal', String(cal.offset)); } catch (e) {}
      paintWeather();
    } else {
      els.calNote.innerHTML = 'Enter a number (&deg;C) matching your thermometer after weather loads.';
    }
  });

  els.btnCalReset.addEventListener('click', () => {
    cal.offset = 0; cal.local = null; els.calInput.value = '';
    try { localStorage.removeItem('sunchill_cal'); } catch (e) {}
    paintWeather();
  });

  function rideClock() {
    els.clock.textContent = 'Live clock: ' + fmtClock(new Date());
  }

  /* ---------- Steps 3→4: enable everything after location ---------- */
  function revealLive(lat, lon, acc, name) {
    loc.lat = lat; loc.lon = lon; loc.acc = acc != null && acc !== '' ? acc : null; loc.granted = true;
    els.locGate.style.display = 'none';
    els.liveWrap.hidden = false;
    rideClock();
    setInterval(rideClock, 1000);
    loadMap();
    els.coords.textContent = lat.toFixed(4) + ', ' + lon.toFixed(4);
    if (name) {
      loc.exact = name;
      els.locNote.innerHTML = 'Location source: <b>selected location &mdash; ' + name + '</b>';
    } else {
      loc.exact = null;
      els.locNote.innerHTML = 'Location source: <b>GPS live location</b>';
    }
    reverseGeocode(lat, lon).then(paintWeather).catch(paintWeather);
    fetchWeather();
  }

  /* ---------- Search any location across ASIA (cities → small villages) ---------- */
  const ASIA_CC = new Set([
    'af','am','az','bh','bd','bt','bn','kh','cn','cy','ge','hk','in','id','ir','iq','il',
    'jp','jo','kz','kw','kg','la','lb','ly','my','mv','mn','mm','np','kp','om','pk','ps',
    'ph','qa','mo','sa','sg','kr','lk','sy','tw','tj','th','tl','tr','tm','ae','uz','vn','ye','ru'
  ]);

  async function runSearch(q, errEl, loadingBtn) {
    if (!q) return;
    errEl.hidden = true;
    if (loadingBtn) loadingBtn.disabled = true;
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&addressdetails=1&accept-language=en&q=' + encodeURIComponent(q);
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error('search');
      const arr = await r.json();
      const hit = (arr || []).find(h => {
        const cc = (h.address && h.address.country_code || '').toLowerCase();
        return ASIA_CC.has(cc) || cc === 'a2' || cc === 'ac';
      }) || (arr || []).find(h => (h.address && h.address.country_code || '').toLowerCase() !== '') || null;
      if (!hit) throw new Error('noresult');
      revealLive(parseFloat(hit.lat), parseFloat(hit.lon), hit.accuracy, hit.display_name);
    } catch (e) {
      errEl.hidden = false;
    } finally {
      if (loadingBtn) loadingBtn.disabled = false;
    }
  }

  const doGateSearch = () => {
    const q = els.locSearch.value.trim();
    runSearch(q, els.locSearchErr, els.btnSearch);
  };
  const doDashSearch = () => {
    const q = els.locSearch2.value.trim();
    runSearch(q, els.locSearchErr, els.btnSearch2);
  };
  els.btnSearch.addEventListener('click', doGateSearch);
  els.btnSearch2.addEventListener('click', doDashSearch);
  els.locSearch.addEventListener('keydown', e => { if (e.key === 'Enter') { ensureAudio(); doGateSearch(); } });
  els.locSearch2.addEventListener('keydown', e => { if (e.key === 'Enter') { ensureAudio(); doDashSearch(); } });

  /* ---------- Step 1 & 2: request browser location ---------- */
  function requestLocation() {
    els.btnLoc.hidden = true;
    els.btnLocRetry.hidden = true;
    els.locErr.hidden = true;
    els.locLoading.hidden = false;
    els.locLoading.textContent = ' Requesting location permission\u2026';

    if (!navigator.geolocation) {
      failLocation('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        els.locLoading.hidden = true;
        revealLive(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        els.locLoading.hidden = true;
        if (err.code === err.PERMISSION_DENIED) {
          failLocation('Location access denied. Please enable location permission to view local environmental data.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          failLocation('Position unavailable. Move to an open area and try again.');
        } else if (err.code === err.TIMEOUT) {
          failLocation('Location request timed out. Please try again.');
        } else {
          failLocation('Unable to access location. ' + (err.message || ''));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  const failLocation = (msg) => {
    els.locLoading.hidden = true;
    els.locErr.hidden = false;
    els.locErr.querySelector('.loc-err-msg').textContent = msg;
    els.btnLocRetry.hidden = false;
  };

  els.btnLoc.addEventListener('click', () => { ensureAudio(); requestLocation(); });
  els.btnLocRetry.addEventListener('click', () => { ensureAudio(); requestLocation(); });
  els.btnRefresh.addEventListener('click', () => {
    els.btnRefresh.disabled = true;
    fetchWeather().then(() => { els.btnRefresh.disabled = false; });
  });

  /* ---------- Step 9: location map (OpenStreetMap embed, no key) ---------- */
  function loadMap() {
    const d = 0.02;
    const bbox = [loc.lon - d, loc.lat - d, loc.lon + d, loc.lat + d].join(',');
    els.mapFrame.innerHTML =
      '<iframe title="Detected location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik&marker=' + loc.lat + ',' + loc.lon + '"></iframe>';
  }

  /* =====================================================================
     DEMO IOT SIMULATION + ALERT SYSTEM
     ===================================================================== */
  const SAFE_TEMP_MAX = 9;
  const BAT_CRITICAL = 20;
  const DOOR_OPEN_ALERT = 15000;

  const setChip = (el, cls, txt) => { el.className = 'src-chip ' + cls; el.textContent = txt; };

  const alertTimes = {};
  const pushAlert = (level, icon, title, msg) => {
    const id = title + msg;
    const now = Date.now();
    if (alertTimes[id] && now - alertTimes[id] < 15000) return;
    alertTimes[id] = now;
    const item = document.createElement('div');
    item.className = 'alert-item alert-' + level;
    item.innerHTML = '<span class="alert-ico">' + icon + '</span>' +
      '<div class="alert-txt"><b>' + title + '</b> &mdash; ' + msg +
      '<span class="alert-tag">' + (level === 'red' ? 'CRITICAL' : 'WARNING') + '</span></div>';
    els.alerts.insertBefore(item, els.alerts.firstChild);
    while (els.alerts.children.length > 4) els.alerts.lastChild.remove();
    alertSound(level);
    setTimeout(() => { item.classList.add('fade'); }, 12000);
    setTimeout(() => { item.remove(); }, 16000);
  };

  const statusTemp = (t) => t <= SAFE_TEMP_MAX ? ['green', 'Optimal'] : t <= SAFE_TEMP_MAX + 2 ? ['yellow', 'Above optimal'] : ['red', 'Critical'];

  function paintSensor() {
    const cold = sim.coldTemp;
    const [cl, st] = statusTemp(cold);
    els.coldTemp.textContent = cold.toFixed(1) + '\u00b0C';
    els.coldTemp.className = 'cold-temp st-text-' + cl;
    els.coldTemp.classList.toggle('alarm', cl === 'red');
    els.coldNote.textContent = 'Reading from ' + (sim.on ? 'demo simulation feed (Demo/Simulated Data)' : 'IoT sensor') + '.';
    els.coldZoneSt.className = 'status-chip st-' + cl;
    els.coldZoneSt.textContent = st;

    els.fColdV.textContent = cold.toFixed(1) + '\u00b0C';
    els.fColdSt.className = 'f-status st-' + cl;
    els.fColdSt.textContent = sim.on ? 'Simulated &middot; ' + st : 'IoT Sensor &middot; ' + st;
    els.fColdCard.classList.toggle('card-alarm', cl === 'red');

    if (sim.on) {
      els.fBatteryV.textContent = Math.round(sim.battery) + '%';
      els.fSolarV.textContent = sim.solar.toFixed(1) + ' kW';
      els.fDoorV.textContent = sim.doorOpen ? 'Open' : 'Closed';
      els.fCoolV.textContent = sim.cooling;
    }
    els.batteryColor();
    els.doorColor();
  }

  function paintRisk() {
    if (!sim.on) {
      els.fRiskV.textContent = '—';
      els.riskPill.textContent = 'No sensor data';
      els.riskPill.className = 'risk-pill st-yellow';
      els.riskBar.style.width = '5%';
      els.riskBar.className = 'risk-bar-fill st-yellow';
      els.aiNote.textContent = 'Demo Prediction — real predictions require a connected sensor and historical data.';
      return;
    }
    const hist = sim.tempHistory;
    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
    const max = Math.max.apply(null, hist);
    const hours = 72;
    const score = Math.min(1, Math.max(0,
      ((avg - 2) / 12) * 0.6 +
      ((max - SAFE_TEMP_MAX) / 10) * 0.3 +
      (hours / 240) * 0.1
    ));
    let level, cls, fill;
    if (score < 0.35)      { level = 'Low Risk';        cls = 'st-green';  fill = 22; }
    else if (score < 0.65) { level = 'Medium Risk';     cls = 'st-yellow'; fill = 55; }
    else                   { level = 'High Risk';       cls = 'st-red';    fill = 90; }

    els.fRiskV.textContent = level;
    els.fRiskSt.className = 'f-status st-yellow';
    els.fRiskSt.textContent = 'Demo Prediction';
    els.riskPill.textContent = level;
    els.riskPill.className = 'risk-pill ' + cls;
    els.riskBar.style.width = fill + '%';
    els.riskBar.className = 'risk-bar-fill ' + cls;
    els.aiNote.textContent = 'Demo Prediction — trained on temperature history, humidity, storage duration, crop/produce type and sensor readings.';
  }

  els.batteryColor = () => {
    const b = sim.battery;
    els.fBatterySt.className = 'f-status st-' + (b > 60 ? 'green' : b > BAT_CRITICAL ? 'yellow' : 'red');
    els.fBatterySt.textContent = (sim.on ? 'Simulated &middot; ' : 'Demo &middot; ') + (b > 60 ? 'Healthy' : b > BAT_CRITICAL ? 'Low' : 'Critical');
  };

  els.doorColor = () => {
    els.fDoorSt.className = 'f-status st-' + (sim.doorOpen ? 'red' : 'green');
    els.fDoorSt.textContent = (sim.on ? 'Simulated &middot; ' : 'Demo &middot; ') + (sim.doorOpen ? 'Open' : 'Closed');
    els.fCoolSt.className = 'f-status st-' + (sim.cooling === 'ON' ? 'green' : 'yellow');
  };

  els.simToggle.addEventListener('change', () => {
    sim.on = els.simToggle.checked;
    els.demoBadge.textContent = sim.on
      ? 'DEMO MODE &middot; simulated sensor feed is labelled clearly'
      : 'DEMO MODE &middot; some data shown is simulated';

    if (sim.on) {
      sim.alerts.clear();
      els.alerts.innerHTML = '';
      setChip(els.coldSrcChip, 'demo-chip', 'Demo / Simulated Data');
      els.coldTemp.classList.remove('st-text-red', 'st-text-yellow');
      els.iotBadge.innerHTML = '<span class="dot-badge dot-badge-amber"></span> IoT Sensor: Demo Simulation';
      paintSensor();
      paintRisk();
    } else {
      els.coldTemp.textContent = 'Not connected';
      els.coldTemp.className = 'cold-temp';
      els.coldNote.textContent = 'Connect an IoT temperature sensor to view real-time cold-room temperature.';
      els.coldZoneSt.className = 'status-chip st-green';
      els.coldZoneSt.textContent = 'Optimal';
      els.fColdV.textContent = 'Not connected';
      els.fColdSt.className = 'f-status st-yellow';
      els.fColdSt.textContent = 'No Sensor &middot; Demo';
      els.fBatteryV.textContent = '--';
      els.fBatterySt.className = 'f-status st-yellow';
      els.fBatterySt.textContent = 'Demo &middot; Simulated';
      els.fSolarV.textContent = '--';
      els.fDoorV.textContent = '--';
      els.fDoorSt.className = 'f-status st-yellow';
      els.fDoorSt.textContent = 'Demo &middot; Simulated';
      els.fCoolV.textContent = '--';
      els.fCoolSt.className = 'f-status st-yellow';
      els.fCoolSt.textContent = 'Demo &middot; Simulated';
      els.iotBadge.innerHTML = '<span class="dot-badge"></span> IoT Sensor: Not Connected';
      els.alerts.innerHTML = '<div class="alert-item alert-red"><span class="alert-ico">&#128308;</span>' +
        '<div class="alert-txt"><b>SENSOR ALERT</b> &mdash; Temperature sensor is disconnected or no data has been received.</div></div>';
      paintRisk();
    }
  });

  /* ---------- Demo simulation engine ---------- */
  const EXCURSION_CHANCE = 0.018;
  const DOOR_CHANCE = 0.06;
  const BAT_DIP_CHANCE = 0.012;

  setInterval(() => {
    if (!loc.granted || !sim.on) return;

    const doorJustOpened = !sim.doorOpen && Math.random() < DOOR_CHANCE;
    if (doorJustOpened) { sim.doorOpen = true; sim.openingAt = Date.now(); }
    if (sim.doorOpen && Math.random() < 0.05) { sim.doorOpen = false; sim.openingAt = null; }
    if (sim.doorOpen && sim.openingAt && Date.now() - sim.openingAt > DOOR_OPEN_ALERT) {
      pushAlert('red', '\u{1F534}', 'CRITICAL ALERT', 'Cold-storage door has been left open.');
    }

    const eff = getEffTemp();
    const outdoorHeat = eff != null && eff > 24 ? (eff - 24) * 0.012 : 0;
    let excursion = 0;
    if (Math.random() < EXCURSION_CHANCE) excursion = 2.4;
    sim.coldTemp += (5.2 + outdoorHeat + (sim.doorOpen ? 0.09 : 0) + excursion - sim.coldTemp) * 0.12 + (Math.random() - 0.5) * 0.04;
    sim.coldTemp = Math.min(14, Math.max(2, sim.coldTemp));
    sim.tempHistory.push(sim.coldTemp);
    if (sim.tempHistory.length > 30) sim.tempHistory.shift();

    sim.coldHum = Math.min(97, Math.max(82, sim.coldHum + (89 - sim.coldHum) * 0.03 + (Math.random() - 0.5) * 1.2));

    const hr = new Date().getHours() + new Date().getMinutes() / 60;
    const solarPeak = Math.max(0.15, 4.6 * Math.sin(Math.PI * (hr - 6) / 14));
    sim.solar = Math.round(solarPeak * 10) / 10;
    sim.battery += (sim.solar - 0.95) * 0.06;
    if (Math.random() < BAT_DIP_CHANCE) sim.battery = Math.max(8, sim.battery * 0.22);
    sim.battery = Math.min(100, Math.max(8, sim.battery));

    sim.cooling = sim.coldTemp > SAFE_TEMP_MAX + 0.3 ? 'ON' : sim.coldTemp > 5.5 ? 'BURST' : 'OFF';

    if (sim.coldTemp > SAFE_TEMP_MAX + 1) {
      pushAlert('red', '\u{1F534}', 'CRITICAL ALERT', 'Cold-storage temperature is above the configured safe range.');
    } else if (sim.coldTemp > SAFE_TEMP_MAX) {
      pushAlert('yellow', '\u26A0\ufe0f', 'WARNING', 'Cold-storage temperature is above the optimal range.');
    }
    if (sim.battery < BAT_CRITICAL) {
      pushAlert('red', '\u{1F534}', 'CRITICAL ALERT', 'Battery level is critically low.');
    }

    paintSensor();
    paintRisk();
  }, 1500);

  /* ---------- IoT integration API (real sensor feed) ----------
     Calling SunChill.pushSensorReading({...}) switches the dashboard
     from Demo mode to real connected-sensor mode. */
  window.SunChill = {
    connectSensor(meta) {
      if (meta && meta.id) els.iotBadge.innerHTML = '<span class="dot-badge dot-badge-green"></span> IoT Sensor: Connected (' + meta.id + ')';
      else els.iotBadge.innerHTML = '<span class="dot-badge dot-badge-green"></span> IoT Sensor: Connected';
      els.demoBadge.textContent = 'LIVE SENSOR DATA &middot; real readings from the cold-storage unit';
      setChip(els.coldSrcChip, 'live-chip', 'Live Sensor Data');
      sim.on = true;
      els.simToggle.checked = true;
      els.simToggle.disabled = true;
      els.coldNote.textContent = 'Reading from physical IoT sensor inside the cold room.';
    },
    pushSensorReading(sample, ts) {
      sim.on = true;
      if (sample && sample.temperature != null) { sim.coldTemp = sample.temperature; }
      if (sample && sample.humidity != null)    { sim.coldHum = sample.humidity; }
      if (sample && sample.battery != null)     { sim.battery = sample.battery; }
      if (sample && sample.solar != null)       { sim.solar = sample.solar; }
      if (sample && sample.doorOpen != null)    { sim.doorOpen = !!sample.doorOpen; }
      if (sample && sample.cooling != null)     { sim.cooling = sample.cooling; }
      if (sim.coldTemp > SAFE_TEMP_MAX + 1) pushAlert('red', '\u{1F534}', 'CRITICAL ALERT', 'Cold-storage temperature is above the configured safe range.');
      if (sim.battery < BAT_CRITICAL)         pushAlert('red', '\u{1F534}', 'CRITICAL ALERT', 'Battery level is critically low.');
      if (sim.doorOpen)                       pushAlert('red', '\u{1F534}', 'CRITICAL ALERT', 'Cold-storage door has been left open.');
      paintSensor();
      paintRisk();
    },
    get state() {
      return { location: { lat: loc.lat, lon: loc.lon, granted: loc.granted },
               weather, coldStorage: sim.on ? { temperature: +sim.coldTemp.toFixed(2), humidity: +sim.coldHum.toFixed(1), connected: true } : { connected: false } };
    }
  };

  /* ---------- Initial demo-config paint for the hidden dashboard ---------- */
  $('body').setAttribute('data-ready', '1');
})();