/* =========================
   CURSOR GLOW FOLLOW
========================= */
const cursor = document.querySelector('.cursor-glow');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

/* =========================
   REVEAL ANIMATIONS (IntersectionObserver + Stagger)
   - Uses prefers-reduced-motion to disable animations when requested
========================= */
const reveals = document.querySelectorAll('.reveal');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
    // Respect reduced motion: reveal everything without animation
    reveals.forEach(el => el.classList.add('in-view'));
} else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('in-view');

                // If this element contains a stagger container, animate its children
                const staggerContainer = el.querySelector('[data-stagger="true"]');
                if (staggerContainer) {
                    const children = staggerContainer.children;
                    Array.from(children).forEach((child, i) => {
                        // apply a CSS variable for delay and add in-view
                        child.style.setProperty('--stagger-delay', `${i * 80}ms`);
                        child.classList.add('in-view');
                    });
                }

                // Unobserve once revealed for better performance
                obs.unobserve(el);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(el => revealObserver.observe(el));
}

/* =========================
   SKILLS - ANIMATE PROGRESS & CHIP INTERACTIONS
========================= */
(function(){
    const skillsSection = document.getElementById('skills');

    if (!skillsSection) return;

    let progressed = false;

    // animate progress bars once when section appears
    const skillsObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !progressed) {
                progressed = true;
                const fills = skillsSection.querySelectorAll('.progress-fill');
                fills.forEach(fill => {
                    const percent = Number(fill.parentElement.getAttribute('data-percent') || 0);
                    // small timeout to allow CSS stagger to set in
                    setTimeout(() => {
                        fill.style.width = percent + '%';
                        fill.parentElement.setAttribute('aria-valuenow', String(percent));
                    }, 150);
                });
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    skillsObserver.observe(skillsSection);

    // chip click / keyboard support
    skillsSection.addEventListener('click', (e) => {
        const chip = e.target.closest('.skill-card');
        if (!chip) return;
        const cluster = chip.closest('.skill-cluster');
        const detail = cluster && cluster.querySelector('.skill-detail');
        if (!detail) return;

        const name = chip.getAttribute('data-name') || chip.textContent.trim();
        const desc = chip.getAttribute('data-desc') || '';
        // toggle selection
        const wasActive = chip.classList.toggle('skill-card--active');
        // remove active from siblings
        cluster.querySelectorAll('.skill-card').forEach(c => { if (c !== chip) c.classList.remove('skill-card--active'); });

        detail.textContent = wasActive ? desc : '';
    });

    // keyboard activation (Enter / Space)
    skillsSection.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const chip = e.target.closest('.skill-card');
            if (chip) {
                e.preventDefault();
                chip.click();
            }
        }
    });
})();

/* =========================
   NAVBAR ACTIVE LINK
========================= */
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
});

/* =========================
   SHOW ONLY TARGET SECTION (SINGLE SECTION VIEW - SMALL SCREENS ONLY)
========================= */
const SMALL_SCREEN_MAX = 900;
function isSmallScreen() {
    return window.innerWidth <= SMALL_SCREEN_MAX;
}

function showAllSections() {
    sections.forEach(s => {
        s.classList.remove('section-hidden');
        s.removeAttribute('aria-hidden');
    });
    document.querySelectorAll('.divider').forEach(d => d.style.display = '');
}

function showOnlySection(id) {
    const target = document.getElementById(id);
    if (!target) return;

    // Special case: when navigating to About always show all sections (user requested)
    if (id === 'about') {
        showAllSections();
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth' });
            const heading = target.querySelector('.section-title');
            if (heading) {
                heading.setAttribute('tabindex','-1');
                heading.focus({preventScroll:true});
                const vs = document.getElementById('view-status');
                if (vs) vs.textContent = `Showing ${heading.textContent}`;
            }
        }, 50);
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
        return;
    }

    // On large screens or when single-view is not active, simply show all sections and smooth-scroll to target
    if (!isSingleViewActive()) {
        showAllSections();
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth' });
            const heading = target.querySelector('.section-title');
            if (heading) {
                heading.setAttribute('tabindex','-1');
                heading.focus({preventScroll:true});
                const vs = document.getElementById('view-status');
                if (vs) vs.textContent = `Showing ${heading.textContent}`;
            }
        }, 50);
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
        return;
    }

    // Small screen behaviour: hide others and only show target
    sections.forEach(s => {
        if (s === target) {
            s.classList.remove('section-hidden');
            s.removeAttribute('aria-hidden');
        } else {
            s.classList.add('section-hidden');
            s.setAttribute('aria-hidden', 'true');
        }
    });

    // hide all dividers then show adjacent ones for context
    document.querySelectorAll('.divider').forEach(d => d.style.display = 'none');
    const prev = target.previousElementSibling;
    if (prev && prev.classList.contains('divider')) prev.style.display = '';
    const next = target.nextElementSibling;
    if (next && next.classList.contains('divider')) next.style.display = '';

    // update active nav link
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));

    // scroll target into view (keeps behaviour natural), then focus heading and announce
    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
        const heading = target.querySelector('.section-title');
        if (heading) {
            heading.setAttribute('tabindex','-1');
            heading.focus({preventScroll:true});
            const vs = document.getElementById('view-status');
            if (vs) vs.textContent = `Showing ${heading.textContent}`;
        }
    }, 50);
}

// intercept nav clicks: on small screens use single-section behaviour; on large screens show all and scroll
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const id = href.slice(1);
            history.pushState(null, '', href);
            if (isSingleViewActive()) {
                showOnlySection(id);
            } else {
                showAllSections();
                const target = document.getElementById(id);
                if (target) setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth' });
                    const heading = target.querySelector('.section-title');
                    if (heading) {
                        heading.setAttribute('tabindex','-1');
                        heading.focus({preventScroll:true});
                        const vs = document.getElementById('view-status');
                        if (vs) vs.textContent = `Showing ${heading.textContent}`;
                    }
                }, 50);
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
            }
        }
    });
});

// handle back/forward & direct hash navigation
function handleHashChange() {
    const id = location.hash ? location.hash.slice(1) : null;
    if (!id) { showAllSections(); return; }
    if (isSingleViewActive()) showOnlySection(id);
    else {
        showAllSections();
        const target = document.getElementById(id);
        if (target) setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth' });
            const heading = target.querySelector('.section-title');
            if (heading) {
                heading.setAttribute('tabindex','-1');
                heading.focus({preventScroll:true});
                const vs = document.getElementById('view-status');
                if (vs) vs.textContent = `Showing ${heading.textContent}`;
            }
        }, 50);
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    }
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('load', () => {
    handleHashChange();
});

// Toggle UI, persistence, and resize handling
const viewToggle = document.getElementById('view-toggle');
const viewStatus = document.getElementById('view-status');
let singleViewOverride = null; // null = auto, true = single, false = all

function isSingleViewActive() {
    if (singleViewOverride !== null) return singleViewOverride;
    return isSmallScreen();
}

function applyToggleUI() {
    if (!viewToggle) return;

    if (singleViewOverride === null) {
        viewToggle.setAttribute('aria-pressed', 'false');
        viewToggle.textContent = isSmallScreen() ? 'View: Auto (on)' : 'View: Auto (off)';
    } else {
        viewToggle.setAttribute('aria-pressed', String(singleViewOverride));
        viewToggle.textContent = singleViewOverride ? 'View: Single' : 'View: All';
    }
}

if (viewToggle) {
    const stored = localStorage.getItem('singleViewOverride');
    if (stored === 'true') singleViewOverride = true;
    else if (stored === 'false') singleViewOverride = false;
    applyToggleUI();

    viewToggle.addEventListener('click', () => {
        // cycle: null -> true -> false -> null
        if (singleViewOverride === null) singleViewOverride = true;
        else if (singleViewOverride === true) singleViewOverride = false;
        else singleViewOverride = null;

        if (singleViewOverride === null) localStorage.removeItem('singleViewOverride');
        else localStorage.setItem('singleViewOverride', String(singleViewOverride));

        applyToggleUI();
        const modeText = singleViewOverride === null ? 'Automatic view mode' : (singleViewOverride ? 'Single section view enabled' : 'All sections view enabled');
        if (viewStatus) viewStatus.textContent = modeText;

        // re-apply current location behaviour immediately
        handleHashChange();
    });
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // re-evaluate current behaviour and apply appropriate visibility
        handleHashChange();
        applyToggleUI();
    }, 150);
});

/* =========================
   CONTACT - ACCORDION & FORM
========================= */
const accordionToggle = document.querySelector('.accordion-toggle');
const accordionPanel = document.querySelector('.accordion-panel');
if (accordionToggle && accordionPanel) {
    accordionToggle.addEventListener('click', () => {
        const expanded = accordionToggle.getAttribute('aria-expanded') === 'true';
        accordionToggle.setAttribute('aria-expanded', String(!expanded));
        accordionPanel.hidden = expanded; // toggle hidden
    });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = contactForm.name.value.trim();
        const email = contactForm.email.value.trim();
        const message = contactForm.message.value.trim();

        // simple validation and visual feedback
        let valid = true;
        [contactForm.name, contactForm.email, contactForm.message].forEach(field => {
            field.classList.remove('invalid');
            if (!field.checkValidity()) {
                field.classList.add('invalid');
                valid = false;
            }
        });

        if (!valid) return;

        const subject = `Contact from Portfolio: ${name}`;
        const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const mailto = `mailto:omesha.kasthuriarachchi@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // open mail client
        window.location.href = mailto;

        const success = document.getElementById('form-success');
        if (success) success.hidden = false;
        contactForm.reset();
        setTimeout(() => { if (success) success.hidden = true; }, 6500);

        // close accordion
        if (accordionToggle && accordionPanel) {
            accordionToggle.setAttribute('aria-expanded', 'false');
            accordionPanel.hidden = true;
        }
    });

    // remove invalid state on input
    ['input','textarea'].forEach(type => {
        contactForm.addEventListener('input', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('invalid')) {
                if (e.target.checkValidity()) e.target.classList.remove('invalid');
            }
        });
    });
}

/* PROJECTS CAROUSEL / NAVIGATION */
(function(){
    const projectList = document.getElementById('projects-list');
    const prev = document.getElementById('projects-prev');
    const next = document.getElementById('projects-next');
    const indicator = document.getElementById('projects-indicator');
    const viewAll = document.getElementById('projects-viewall');
    if (!projectList || !prev || !next || !indicator || !viewAll) return;

    const cards = Array.from(projectList.querySelectorAll('.project-card'));
    let index = 0;

    function showIndex(i) {
        index = (i + cards.length) % cards.length;
        cards.forEach((card, idx) => {
            if (idx === index) {
                card.classList.remove('project-hidden');
                card.classList.add('in-view');
            } else {
                card.classList.add('project-hidden');
                card.classList.remove('in-view');
            }
        });
        indicator.textContent = `${index + 1} / ${cards.length}`;
    }

    // init - show first
    showIndex(0);

    next.addEventListener('click', () => { showIndex(index + 1); });
    prev.addEventListener('click', () => { showIndex(index - 1); });

    // keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') showIndex(index + 1);
        if (e.key === 'ArrowLeft') showIndex(index - 1);
    });

    // view all toggles between carousel (single) and grid (all)
    viewAll.addEventListener('click', () => {
        const pressed = viewAll.getAttribute('aria-pressed') === 'true';
        viewAll.setAttribute('aria-pressed', String(!pressed));
        if (!pressed) {
            // now in 'all' mode
            cards.forEach(c => c.classList.remove('project-hidden'));
            indicator.style.display = 'none';
            prev.setAttribute('disabled', ''); next.setAttribute('disabled', '');
            viewAll.textContent = 'Show single';
        } else {
            // back to single
            showIndex(index);
            indicator.style.display = '';
            prev.removeAttribute('disabled'); next.removeAttribute('disabled');
            viewAll.textContent = 'View all';
            // bring carousel into view
            document.getElementById('projects').scrollIntoView({behavior:'smooth'});
        }
    });

    // If there are <=1 projects, hide nav
    if (cards.length <= 1) {
        prev.style.display = 'none'; next.style.display = 'none'; indicator.style.display = 'none'; viewAll.style.display = 'none';
    }
})();

/* =========================
   TEACHING CAROUSEL - overlay arrows, single-step navigation
========================= */
(function(){
    const carousel = document.querySelector('.teaching-carousel');
    if (!carousel) return;

    const viewport = carousel.querySelector('.teaching-viewport');
    const track = carousel.querySelector('.teaching-track');
    const prev = document.getElementById('teaching-prev');
    const next = document.getElementById('teaching-next');
    const indicator = document.getElementById('teaching-indicator');
    const cards = Array.from(track.querySelectorAll('.teaching-card'));
    if (!viewport || !track || cards.length === 0) return;

    let perView = window.innerWidth < 720 ? 1 : 2;
    let index = 0;

    function updateControls() {
        prev.disabled = index === 0;
        next.disabled = index >= Math.max(0, cards.length - perView);
        indicator.textContent = `${index + 1} - ${Math.min(index + perView, cards.length)} / ${cards.length}`;
    }

    function showIndex(i) {
        perView = window.innerWidth < 720 ? 1 : 2;
        index = Math.min(Math.max(0, i), Math.max(0, cards.length - perView));
        const target = cards[index];
        if (target) {
            viewport.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: 'smooth' });
        }
        updateControls();
    }

    prev.addEventListener('click', () => { showIndex(index - 1); });
    next.addEventListener('click', () => { showIndex(index + 1); });

    // keyboard support bound to carousel
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') next.click();
        if (e.key === 'ArrowLeft') prev.click();
    });

    window.addEventListener('resize', () => {
        perView = window.innerWidth < 720 ? 1 : 2;
        index = Math.min(index, Math.max(0, cards.length - perView));
        // hide controls if not needed
        if (cards.length <= perView) {
            prev.style.display = 'none'; next.style.display = 'none'; indicator.style.display = 'none';
        } else {
            prev.style.display = ''; next.style.display = ''; indicator.style.display = '';
        }
        showIndex(index);
    });

    // initialize
    if (cards.length <= perView) {
        prev.style.display = 'none'; next.style.display = 'none'; indicator.style.display = 'none';
    }

    showIndex(0);
})();
