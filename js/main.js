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
    if (/iPhone|iPod/i.test(ua)) {
      r.type = 'Mobile';
      r.os = 'iOS';
    } else if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      r.type = 'Tablet';
      r.os = 'iOS';
    } else if (/Android/i.test(ua)) {
      r.type = /Mobile/i.test(ua) ? 'Mobile' : 'Mobile';
      r.os = 'Android';
    } else if (/Windows/i.test(ua)) {
      r.type = 'Desktop';
      r.os = 'Windows';
    } else if (/Mac OS/i.test(ua)) {
      r.type = 'Desktop';
      r.os = 'MacOS';
    } else if (/Linux/i.test(ua)) {
      r.type = 'Desktop';
      r.os = 'Linux';
    }
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
    var key = 'zaya_behavior';
    try {
      var d = JSON.parse(localStorage.getItem(key)) || {};
      d.pages_viewed = (d.pages_viewed || 0) + 1;
      localStorage.setItem(key, JSON.stringify(d));
    } catch(e) {}
  }

  function getTimeOnPage() {
    return Math.round((Date.now() - pageLoadTime) / 1000);
  }

  function showOverlay(success) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center';
    var box = document.createElement('div');
    box.style.cssText = 'background:#141414;border:1px solid #00ff88;border-radius:16px;padding:40px;text-align:center;color:#fff;max-width:360px;margin:20px';
    var check = document.createElement('div');
    check.style.cssText = 'font-size:2.5rem;margin-bottom:16px';
    check.textContent = '✓';
    var title = document.createElement('div');
    title.style.cssText = 'font-size:1.2rem;font-weight:700;margin-bottom:8px';
    title.textContent = 'Заявка отправлена!';
    var sub = document.createElement('div');
    sub.style.cssText = 'font-size:0.9rem;color:#a0a0a0;margin-bottom:20px';
    sub.textContent = 'Мы свяжемся с вами в ближайшее время';
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:12px 32px;border-radius:10px;background:#00ff88;color:#0a0a0a;border:none;font-weight:700;cursor:pointer;font-size:0.95rem';
    btn.textContent = 'Отлично';
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

    // Phone auto-format
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
      phoneInput.addEventListener('paste', function(e) {
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
    window.addEventListener('scroll', function() { header.classList.toggle('scrolled', window.scrollY > 50); });

    var menuBtn = document.querySelector('.mobile-menu-btn');
    var mobileNav = document.querySelector('.mobile-nav');
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', function() {
        menuBtn.classList.toggle('active');
        mobileNav.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
      });
      mobileNav.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', function() {
          menuBtn.classList.remove('active');
          mobileNav.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }

    var obs = new IntersectionObserver(function(es) {
      es.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });

    document.querySelectorAll('.faq-q').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var item = btn.closest('.faq-item');
        var was = item.classList.contains('active');
        document.querySelectorAll('.faq-item.active').forEach(function(i) { i.classList.remove('active'); });
        if (!was) item.classList.add('active');
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var t = document.querySelector(a.getAttribute('href'));
        if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
      });
    });

    var curLang = 'ru';
    var T = {
      en:{
        'nav.product':'Product','nav.ecosystem':'Ecosystem','nav.app':'App','nav.pricing':'Buy','nav.faq':'FAQ','nav.contact':'Contact',
        'hero.badge':'Pre-order Open','hero.title':'Smart property in one app','hero.subtitle':'Irrigation, pumps, tanks, lighting and automation in one app. Works locally even without internet.',
        'hero.cta1':'Order ZAYA','hero.cta2':'Get Consultation','hero.price.label':'4-zone controller','hero.delivery':'First deliveries coming soon',
        'why.label':'Advantages','why.title':'Why property owners choose ZAYA',
        'why.1.title':'Everything in one app','why.1.desc':'No need for separate apps. One interface for the entire property.',
        'why.2.title':'Works without internet','why.2.desc':'If internet goes down, the system continues all scenarios and schedules.',
        'why.3.title':'Grows with your property','why.3.desc':'Start with irrigation, then connect lighting, gates, cameras and more.',
        'product.label':'Product','product.subtitle':'The first model of the ZAYA ecosystem',
        'bundle.label':'Bundle','bundle.title':'What\'s included',
        'bundle.1':'ZAYA Controller 4','bundle.2':'iOS App','bundle.3':'Android App','bundle.4':'Pump control','bundle.5':'Tank monitoring','bundle.6':'Sensor support','bundle.7':'Automation','bundle.8':'Free updates',
        'eco.label':'Ecosystem','eco.title':'The operating system for your property','eco.desc':'ZAYA is a platform that unifies all devices on your property.',
        'app.label':'App','app.title':'Full control from any device','app.subtitle':'Monitor and manage your property from anywhere',
        'app.f1':'Dashboard','app.f2':'Irrigation','app.f3':'Tanks','app.f4':'Sensors','app.f5':'Lighting','app.f6':'Automation',
        'how.label':'How to Start','how.title':'How to start using ZAYA',
        'how.1':'Submit request','how.1d':'Fill out the form or contact us','how.2':'Get consultation','how.2d':'Our specialist will help','how.3':'Place pre-order','how.3d':'Reserve at early access price','how.4':'Receive system','how.4d':'Delivery and installation','how.5':'Manage property','how.5d':'Everything in the app',
        'alice.label':'Integration','alice.title':'Works with Alice','alice.desc':'Control your property with voice through Yandex Alice',
        'trust.label':'Trust','trust.title':'Why you can trust ZAYA',
        'trust.1':'Works offline','trust.1d':'All scenarios run locally','trust.2':'No required subscription','trust.2d':'All core features included forever','trust.3':'Data stays with owner','trust.3d':'Local control and data protection','trust.4':'Ecosystem evolves','trust.4d':'New modules added regularly','trust.5':'Made for Russian conditions','trust.5d':'Works from -40°C to +60°C',
        'uc.label':'Use Cases','uc.title':'Application scenarios',
        'uc.1':'Private house','uc.1d':'Automatic lawn irrigation, courtyard lighting, flower beds. All on schedule.','uc.2':'Greenhouse','uc.2d':'Precise irrigation by sensors, temperature control, automatic ventilation.','uc.3':'Recreation center','uc.3d':'Managing large areas, pump and tank monitoring, zone lighting.','uc.4':'Landscaping company','uc.4d':'Remote irrigation management for all clients from one app.',
        'price.label':'Buy','price.sub':'All core features included forever',
        'price.main':'Main Product','price.main.sub':'Controller for 4 irrigation zones','price.main.note':'Pre-order','price.main.btn':'Place Pre-order','price.forever':'Basic functionality forever without subscription',
        'price.prem.tag':'Premium','price.prem.sub':'Advanced cloud services','price.prem.price':'On request','price.prem.note':'Optional subscription','price.prem.btn':'Learn More',
        'comp.label':'Comparison','comp.title':'Why ZAYA?',
        'dealer.label':'Partners','dealer.title':'Become a ZAYA partner','dealer.text':'We seek dealers, installers and partners across Russia.',
        'deal.1':'Special pricing','deal.2':'Technical support','deal.3':'Training','deal.4':'Priority deliveries','dealer.form':'Partnership application',
        'f.name':'Name','f.company':'Company','f.phone':'Phone','f.city':'City','f.msg':'Message','f.topic':'Subject','f.submit':'Submit',
        'faq.label':'FAQ','faq.title':'Frequently asked questions',
        'cta.badge':'Submit a request for early access','cta.title':'Ready to automate your property?','cta.sub':'Join owners who already chose ZAYA','cta.b1':'Order ZAYA','cta.b2':'Get Consultation',
        'contact.label':'Contacts','contact.title':'Contact us','contact.info':'Contact information',
        'footer.desc':'The next-generation property management operating system.'
      },
      ru:{
        'nav.product':'Продукт','nav.ecosystem':'Экосистема','nav.app':'Приложение','nav.pricing':'Купить','nav.faq':'Вопросы','nav.contact':'Контакты',
        'hero.badge':'Предзаказ открыт','hero.title':'Умный участок в одном приложении','hero.subtitle':'Полив, насосы, резервуары, освещение и автоматизация в одном приложении. Работает локально даже без интернета.',
        'hero.cta1':'Заказать ZAYA','hero.cta2':'Получить консультацию','hero.price.label':'Контроллер на 4 зоны','hero.delivery':'Первые поставки скоро',
        'why.label':'Преимущества','why.title':'Почему владельцы участков выбирают ZAYA',
        'why.1.title':'Всё в одном приложении','why.1.desc':'Не нужно использовать отдельные приложения. Единый интерфейс для всего участка.',
        'why.2.title':'Работает даже без интернета','why.2.desc':'Если интернет пропадёт, система продолжит выполнять все сценарии и расписания.',
        'why.3.title':'Растёт вместе с участком','why.3.desc':'Начните с полива, а затем подключайте освещение, ворота, камеры и другие модули.',
        'product.label':'Продукт','product.subtitle':'Первая модель экосистемы ZAYA',
        'bundle.label':'Комплект','bundle.title':'Что входит в комплект',
        'bundle.1':'Контроллер ZAYA Controller 4','bundle.2':'Приложение iOS','bundle.3':'Приложение Android','bundle.4':'Управление насосом','bundle.5':'Контроль резервуаров','bundle.6':'Поддержка датчиков','bundle.7':'Автоматизация','bundle.8':'Бесплатные обновления',
        'eco.label':'Экосистема','eco.title':'Операционная система для участка','eco.desc':'ZAYA — это платформа, которая объединяет все устройства вашего участка.',
        'app.label':'Приложение','app.title':'Полный контроль с любого устройства','app.subtitle':'Наблюдайте и управляйте участком из любой точки мира',
        'app.f1':'Dashboard','app.f2':'Полив','app.f3':'Баки','app.f4':'Датчики','app.f5':'Освещение','app.f6':'Автоматизация',
        'how.label':'Как начать','how.title':'Как начать пользоваться ZAYA',
        'how.1':'Оставляете заявку','how.1d':'Заполните форму или свяжитесь с нами','how.2':'Получаете консультацию','how.2d':'Наш специалист подберёт решение','how.3':'Оформляете предзаказ','how.3d':'Бронируете систему по ранней цене','how.4':'Получаете систему','how.4d':'Доставка и установка','how.5':'Управляете участком','how.5d':'Всё под контролем из приложения',
        'alice.label':'Интеграция','alice.title':'Работает с Алисой','alice.desc':'Управляйте участком голосом через Яндекс Алису',
        'trust.label':'Доверие','trust.title':'Почему можно доверять ZAYA',
        'trust.1':'Работает без интернета','trust.1d':'Все сценарии выполняются локально','trust.2':'Без обязательной подписки','trust.2d':'Все основные функции включены навсегда','trust.3':'Данные остаются у владельца','trust.3d':'Локальное управление и защита данных','trust.4':'Экосистема развивается','trust.4d':'Постоянно добавляются новые модули','trust.5':'Сделано для российских условий','trust.5d':'Работает при температурах от -40°C до +60°C',
        'uc.label':'Сценарии','uc.title':'Сценарии применения',
        'uc.1':'Частный дом','uc.1d':'Автоматический полив газона, освещение двора, клумбы. Всё по расписанию.','uc.2':'Теплица','uc.2d':'Точный полив по датчикам, контроль температуры, проветривание.','uc.3':'База отдыха','uc.3d':'Управление большими территориями, контроль насосов и резервуаров.','uc.4':'Ландшафтная компания','uc.4d':'Удалённое управление поливом у всех клиентов из одного приложения.',
        'price.label':'Купить','price.sub':'Все основные функции включены навсегда',
        'price.main':'Основной продукт','price.main.sub':'Контроллер для 4 зон полива','price.main.note':'Предзаказ','price.main.btn':'Оформить предзаказ','price.forever':'Базовая функциональность навсегда без подписки',
        'price.prem.tag':'Premium','price.prem.sub':'Продвинутые облачные сервисы','price.prem.price':'По запросу','price.prem.note':'Опциональная подписка','price.prem.btn':'Узнать больше',
        'comp.label':'Сравнение','comp.title':'Почему ZAYA?',
        'dealer.label':'Партнёрам','dealer.title':'Станьте партнёром ZAYA','dealer.text':'Мы ищем дилеров, монтажников и партнёров для развития сети по всей России.',
        'deal.1':'Специальные цены','deal.2':'Техническая поддержка','deal.3':'Обучение','deal.4':'Приоритетные поставки','dealer.form':'Заявка на партнёрство',
        'f.name':'Имя','f.company':'Компания','f.phone':'Телефон','f.city':'Город','f.msg':'Сообщение','f.topic':'Тема','f.submit':'Отправить',
        'faq.label':'Вопросы','faq.title':'Часто задаваемые вопросы',
        'cta.badge':'Оставьте заявку на ранний доступ','cta.title':'Готовы автоматизировать свой участок?','cta.sub':'Присоединяйтесь к владельцам участков, которые уже выбрали ZAYA','cta.b1':'Заказать ZAYA','cta.b2':'Получить консультацию',
        'contact.label':'Контакты','contact.title':'Свяжитесь с нами','contact.info':'Контактная информация',
        'footer.desc':'Операционная система для управления участком нового поколения.'
      }
    };
    function setLang(lang) {
      curLang = lang;
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var k = el.getAttribute('data-i18n');
        if (T[lang] && T[lang][k]) el.textContent = T[lang][k];
      });
      document.querySelectorAll('.lang-switch span,.lang-switch-mobile span').forEach(function(s) { s.classList.toggle('active', s.dataset.lang === lang); });
      document.documentElement.lang = lang;
    }
    document.querySelectorAll('.lang-switch span,.lang-switch-mobile span').forEach(function(s) { s.addEventListener('click', function() { setLang(s.dataset.lang); }); });

    var ecoNodes = document.querySelectorAll('.eco-node');
    if (ecoNodes.length) {
      var eo = new IntersectionObserver(function(es) {
        es.forEach(function(e) {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'rotate(var(--a)) translateY(-190px) rotate(calc(-1 * var(--a)))';
          }
        });
      }, { threshold: 0.2 });
      ecoNodes.forEach(function(n, i) {
        n.style.opacity = '0';
        n.style.transition = 'opacity .6s ease-out ' + (i * 0.08) + 's, transform .6s ease-out ' + (i * 0.08) + 's, border-color .35s, color .35s';
        eo.observe(n);
      });
    }

    var form = document.getElementById('leadForm');
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        var origText = btn.textContent;
        btn.textContent = curLang === 'ru' ? 'Отправка...' : 'Sending...';
        btn.disabled = true;

        var fd = new FormData(form);
        var bNow = getBehavior();

        var data = {
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email'),
          topic: fd.get('topic'),
          message: fd.get('message'),
          source: fd.get('source') || 'zaya-website',
          website: fd.get('website') || '',
          form_ts: fd.get('form_ts') || Date.now(),
          device_type: device.type,
          os: device.os,
          browser: device.browser,
          user_agent: device.user_agent,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          utm_content: utm.utm_content,
          utm_term: utm.utm_term,
          referer: document.referrer || '',
          current_url: window.location.href,
          visit_count: bNow.visit_count,
          time_on_page: getTimeOnPage(),
          pages_viewed: bNow.pages_viewed,
          first_visit_date: bNow.first_visit_date,
          last_visit_date: bNow.last_visit_date,
          viewed_controller4: controller4Viewed,
          browser_tz: (Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions) ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''
        };

        try {
          var response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
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
