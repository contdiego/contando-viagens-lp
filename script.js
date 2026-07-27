document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.reveal');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach((element) => element.classList.add('is-visible'));
    } else {
        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    currentObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealElements.forEach((element) => observer.observe(element));
    }

    document.querySelectorAll('[data-cta-location]').forEach((cta) => {
        cta.addEventListener('click', () => {
            if (typeof window.fbq === 'function') {
                window.fbq('track', 'Lead', {
                    content_name: cta.dataset.ctaName || 'Grupo de ofertas',
                    content_category: cta.dataset.ctaLocation
                });
            }
        });
    });
});
