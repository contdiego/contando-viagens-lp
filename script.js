document.addEventListener('DOMContentLoaded', function () {
    var revealElements = document.querySelectorAll('.rv');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach(function (element) { element.classList.add('on'); });
    } else {
        var observer = new IntersectionObserver(function (entries, currentObserver) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('on');
                    currentObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(function (element) { observer.observe(element); });
    }

    document.querySelectorAll('[data-cta-location]').forEach(function (cta) {
        cta.addEventListener('click', function () {
            if (typeof window.fbq === 'function') {
                window.fbq('track', 'Lead', {
                    content_name: cta.dataset.ctaName || 'Grupo de ofertas',
                    content_category: cta.dataset.ctaLocation
                });
            }
        });
    });
});
