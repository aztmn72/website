(function(){
  var API_URL = 'https://zaya-qo0z.onrender.com/api/lead';
  var pageLoadTime = Date.now();
  var viewedSections = {};
  var controller4Viewed = false;

  function getUTMParams() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content: p.get('utm_content') || '',
      utm_term: p.get('utm_term') || ''
    };
  }

  function detectDevice() {
    var ua = navigator.userAgent || '';
    var r = { type: 'Desktop', os: 'Unknown', browser: 'Unknown', user_agent: ua };
    if (/iPhone|iPod/i.test(ua)) { r.type = 'Mobile'; r.os = 'iOS'; }
    else if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) { r.type = 'Tablet'; r.os = 'iOS'; }
    else if (/Android/i.test(ua)) { r.type = 'Mobile'; r.os = 'Android'; }
    else if (/Windows/i.test(ua)) { r.os = 'Windows'; }
    else if (/Mac OS/i.test(ua)) { r.os = 'MacOS'; }
    else if (/Linux/i.test(ua)) { r.os = 'Linux'; }
    if (/YaBrowser/i.test(ua)) r.browser = 'Yandex Browser';
    else if (/OPR|Opera/i.test(ua)) r.browser = 'Opera';
    else if (/Edg/i.test(ua)) r.browser = 'Edge';
    else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) r.browser = 'Chrome';
    else if (/Firefox/i.test(ua)) r.browser = 'Firefox';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) r.browser = 'Safari';
    return r;
  }

  function getBehavior() {
    var key = 'zaya_behavior';
    var d;
    try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch(e) { d = {}; }
    var now = new Date().toISOString();
    d.visit_count = (d.visit_count || 0) + 1;
    if (!d.first_visit_date) d.first_visit_date = now;
    d.last_visit_date = now;
    d.pages_viewed = d.pages_viewed || 0;
    try { localStorage.setItem(key, JSON.stringify(d)); } catch(e) {}
    return d;
  }

  function trackSection(id) {
    try {
      var d = JSON.parse(localStorage.getItem('zaya_behavior')) || {};
      d.pages_viewed = (d.pages_viewed || 0) + 1;
      localStorage.setItem('zaya_behavior', JSON.stringify(d));
    } catch(e) {}
  }

  function getTimeOnPage() {
    return Math.round((Date.now() - pageLoadTime) / 1000);
  }

  function showOverlay(success) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;animation:fadeInUp .3s ease-out';
    var box = document.createElement('div');
    box.style.cssText = 'background:#141414;border:1px solid #00ff88;border-radius:12px;padding:40px;text-align:center;color:#fff;max-width:360px;margin:20px';
    var check = document.createElement('div');
    check.style.cssText = 'font-size:2.5rem;margin-bottom:16px';
    check.textContent = '\u2713';
    var title = document.createElement('div');
    title.style.cssText = 'font-size:1.2rem;font-weight:700;margin-bottom:8px';
    title.textContent = '\u0417\u0430\u044f\u0432\u043a\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430!';
    var sub = document.createElement('div');
    sub.style.cssText = 'font-size:0.9rem;color:#a0a0a0;margin-bottom:20px';
    sub.textContent = '\u041c\u044b \u0441\u0432\u044f\u0436\u0435\u043c\u0441\u044f \u0441 \u0432\u0430\u043c\u0438 \u0432 \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f';
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:12px 32px;border-radius:12px;background:#00ff88;color:#0a0a0a;border:none;font-weight:700;cursor:pointer;font-size:0.95rem';
    btn.textContent = '\u041e\u0442\u043b\u0438\u0447\u043d\u043e';
    btn.addEventListener('click', function() { overlay.remove(); });
    box.appendChild(check);
    box.appendChild(title);
    box.appendChild(sub);
    box.appendChild(btn);
    overlay.appendChild(box);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    var formEl = document.getElementById('leadForm');
    if (formEl) formEl.reset();
    var tsField = document.getElementById('formTs');
    if (tsField) tsField.value = Date.now();
    btn.focus();
  }

  document.addEventListener('DOMContentLoaded', function() {
    var device = detectDevice();
    var utm = getUTMParams();
    var behavior = getBehavior();

    var tsField = document.getElementById('formTs');
    if (tsField) tsField.value = Date.now();

    var phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) {
      function formatPhone(val) {
        var d = val.replace(/\D/g, '');
        if (d.startsWith('8') && d.length <= 11) d = '7' + d.slice(1);
        if (d.length > 0 && d[0] !== '7') d = '7' + d;
        d = d.slice(0, 11);
        if (d.length === 0) return '';
        var fmt = '+7';
        if (d.length > 1) fmt += ' ' + d.slice(1, 4);
        if (d.length > 4) fmt += ' ' + d.slice(4, 7);
        if (d.length > 7) fmt += '-' + d.slice(7, 9);
        if (d.length > 9) fmt += '-' + d.slice(9, 11);
        return fmt;
      }
      phoneInput.addEventListener('input', function() {
        var pos = this.selectionStart;
        var oldLen = this.value.length;
        this.value = formatPhone(this.value);
        var newLen = this.value.length;
        this.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen));
      });
      phoneInput.addEventListener('paste', function() {
        var self = this;
        setTimeout(function() { self.value = formatPhone(self.value); }, 0);
      });
      phoneInput.addEventListener('focus', function() {
        if (!this.value || this.value === '+7') this.value = '+7 ';
      });
    }

    var sectionObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !viewedSections[entry.target.id]) {
          viewedSections[entry.target.id] = true;
          trackSection(entry.target.id);
          if (entry.target.id === 'product') controller4Viewed = true;
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('section[id]').forEach(function(s) { sectionObs.observe(s); });

    var header = document.querySelector('.header');
    window.addEventListener('scroll', function() { header.classList.toggle('scrolled', window.scrollY > 50); }, { passive: true });

    var menuBtn = document.querySelector('.mobile-menu-btn');
    var mobileNav = document.querySelector('.mobile-nav');
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', function() {
        menuBtn.classList.toggle('active');
        mobileNav.classList.toggle('active');
        menuBtn.setAttribute('aria-expanded', mobileNav.classList.contains('active'));
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
      });
      mobileNav.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', function() {
          menuBtn.classList.remove('active');
          mobileNav.classList.remove('active');
          menuBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }

    var obs = new IntersectionObserver(function(es) {
      es.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });

    document.querySelectorAll('.faq-q').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var item = btn.closest('.faq-item');
        var was = item.classList.contains('active');
        document.querySelectorAll('.faq-item.active').forEach(function(i) { i.classList.remove('active'); });
        if (!was) item.classList.add('active');
        btn.setAttribute('aria-expanded', !was);
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var t = document.querySelector(a.getAttribute('href'));
        if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
      });
    });

    var form = document.getElementById('leadForm');
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        var origText = btn.textContent;
        btn.textContent = '\u041e\u0442\u043f\u0440\u0430\u0432\u043a\u0430...';
        btn.disabled = true;

        var fd = new FormData(form);
        var bNow = getBehavior();
        var data = {
          name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'),
          topic: fd.get('topic'), message: fd.get('message'),
          source: fd.get('source') || 'zaya-website',
          website: fd.get('website') || '', form_ts: fd.get('form_ts') || Date.now(),
          device_type: device.type, os: device.os, browser: device.browser,
          user_agent: device.user_agent,
          utm_source: utm.utm_source, utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign, utm_content: utm.utm_content, utm_term: utm.utm_term,
          referer: document.referrer || '', current_url: window.location.href,
          visit_count: bNow.visit_count, time_on_page: getTimeOnPage(),
          pages_viewed: bNow.pages_viewed,
          first_visit_date: bNow.first_visit_date, last_visit_date: bNow.last_visit_date,
          viewed_controller4: controller4Viewed,
          browser_tz: (Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions) ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''
        };

        try {
          var response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          var result = await response.json();
          showOverlay(result.success);
        } catch (err) {
          console.error('API error:', err);
          showOverlay(false);
        }
        btn.textContent = origText;
        btn.disabled = false;
      });
    }
  });
})();
