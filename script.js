(function () {
    var GRUPOS = {
        recjp:  { nome: 'Recife & João Pessoa', url: 'https://chat.whatsapp.com/E8IaWyrQtkeJks55UQvmTr?mode=gi_t' },
        forsal: { nome: 'Fortaleza & Salvador', url: 'https://chat.whatsapp.com/CEX3t7DDpuGIw30QyJNn1O?mode=gi_t' }
    };

    function escolherCidade(cidade) {
        var g = GRUPOS[cidade];
        if (!g) return;
        document.querySelectorAll('.picker button').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.dataset.city === cidade));
        });
        document.querySelectorAll('.grupo-cta').forEach(function (a) {
            a.setAttribute('href', g.url);
            a.dataset.ctaName = 'Grupo de ofertas ' + g.nome;
            var s = a.querySelector('small');
            if (s) s.textContent = g.nome + (a.id === 'mcta' ? ' · gratuito' : ' · entrada gratuita');
        });
    }

    document.querySelectorAll('.picker button').forEach(function (b) {
        b.addEventListener('click', function () { escolherCidade(b.dataset.city); });
    });
    escolherCidade('recjp');

    // a barra fixa só entra quando o botão do topo sai de vista
    var barra = document.querySelector('.mbar');
    var ancora = document.getElementById('cta');
    if (barra && ancora && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            barra.classList.toggle('show', !entries[0].isIntersecting);
        }, { threshold: 0 }).observe(ancora);
    } else if (barra) {
        barra.classList.add('show');
    }

    // entrada dos blocos ao rolar
    var blocos = document.querySelectorAll('.rv');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        blocos.forEach(function (el) { el.classList.add('on'); });
    } else {
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        blocos.forEach(function (el) { io.observe(el); });
    }

    // Lead no Meta Pixel
    document.querySelectorAll('[data-cta-location]').forEach(function (cta) {
        cta.addEventListener('click', function () {
            if (typeof window.fbq === 'function') {
                window.fbq('track', 'Lead', {
                    content_name: cta.dataset.ctaName || 'Contato',
                    content_category: cta.dataset.ctaLocation
                });
            }
        });
    });
})();
