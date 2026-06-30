(function(){
  var API_URL = (typeof ZAYA_CONFIG !== 'undefined' ? ZAYA_CONFIG.API_BASE_URL : 'https://zaya-qo0z.onrender.com') + '/api/lead';
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
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)';
    var box = document.createElement('div');
    box.style.cssText = 'background:#141414;border:1px solid ' + (success ? '#00ff88' : '#ff6b6b') + ';border-radius:16px;padding:48px 40px;text-align:center;color:#fff;max-width:420px;margin:20px;animation:fadeInUp .3s ease-out';
    if (success) {
      box.innerHTML = '<div style="font-size:3rem;margin-bottom:20px">&#10003;</div>' +
        '<div style="font-size:1.3rem;font-weight:700;margin-bottom:12px">Спасибо!</div>' +
        '<div style="font-size:0.95rem;color:#a0a0a0;line-height:1.6;margin-bottom:8px">Мы получили вашу заявку.</div>' +
        '<div style="font-size:0.95rem;color:#a0a0a0;line-height:1.6;margin-bottom:8px">В ближайшее время специалист ZAYA свяжется с вами.</div>' +
        '<div style="font-size:0.9rem;color:#00ff88;line-height:1.6;margin-bottom:20px">Вы попали в список первых клиентов и сможете приобрести контроллер по специальной цене — 30 000 ₽ вместо 40 000 ₽.</div>' +
        '<div style="font-size:0.85rem;color:#555;margin-bottom:24px">Спасибо за доверие!<br>Команда ZAYA.</div>' +
        '<button id="overlay-close" style="padding:14px 40px;border-radius:12px;background:#00ff88;color:#0a0a0a;border:none;font-weight:700;cursor:pointer;font-size:0.95rem">Закрыть</button>';
    } else {
      box.innerHTML = '<div style="font-size:3rem;margin-bottom:20px">&#9888;</div>' +
        '<div style="font-size:1.2rem;font-weight:700;margin-bottom:12px">Не удалось отправить заявку</div>' +
        '<div style="font-size:0.95rem;color:#a0a0a0;line-height:1.6;margin-bottom:20px">Попробуйте ещё раз через несколько секунд.<br>Если проблема повторится — свяжитесь с нами:</div>' +
        '<div style="font-size:1rem;color:#00ff88;font-weight:600;margin-bottom:24px"><a href="tel:+73452922777" style="color:#00ff88;text-decoration:none">+7 (3452) 922-777</a></div>' +
        '<button id="overlay-close" style="padding:14px 40px;border-radius:12px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.1);font-weight:600;cursor:pointer;font-size:0.95rem">Закрыть</button>';
    }
    overlay.appendChild(box);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    var closeBtn = document.getElementById('overlay-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() { overlay.remove(); });
      closeBtn.focus();
    }
    var formEl = document.getElementById('leadForm');
    if (formEl && success) formEl.reset();
    var tsField = document.getElementById('formTs');
    if (tsField) tsField.value = Date.now();
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
    var formSubmitting = false;
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (formSubmitting) return;
        formSubmitting = true;

        var btn = form.querySelector('button[type="submit"]');
        var origText = btn.textContent;
        btn.innerHTML = '<span class="btn-spinner"></span> Отправляем...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

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
          console.log('[ZAYA] POST', API_URL, '→', response.status, result);
          showOverlay(result.success);
        } catch (err) {
          console.error('[ZAYA] fetch error:', err.message, err);
          showOverlay(false);
        }

        btn.textContent = origText;
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
        formSubmitting = false;
      });
    }
  });
})();
