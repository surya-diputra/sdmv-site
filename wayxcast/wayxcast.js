// Same theme toggle and screenshot switcher as the SDMV home page (/index.html).

// ---------- Theme ----------
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const currentTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');

function syncThemeToggle() {
    const isDark = currentTheme() === 'dark';
    themeToggle.innerHTML = `<i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i>`;
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

themeToggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    const apply = () => {
        root.dataset.theme = next;
        syncThemeToggle();
    };
    try { localStorage.setItem('sdmv-theme', next); } catch (e) {}

    if (document.startViewTransition && !reduceMotion.matches) {
        document.startViewTransition(apply);
    } else {
        apply();
    }
});

darkQuery.addEventListener('change', syncThemeToggle);
syncThemeToggle();

// ---------- Screenshot switchers (one per phone) ----------
document.querySelectorAll('.showcase').forEach((showcase) => {
    const tabs = [...showcase.querySelectorAll('[role="tab"]')];

    function show(index) {
        tabs.forEach((tab, i) => {
            const active = i === index;
            tab.setAttribute('aria-selected', active);
            tab.tabIndex = active ? 0 : -1;
            document.getElementById(tab.getAttribute('aria-controls')).classList.toggle('is-active', active);
        });
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => show(i));
        tab.addEventListener('keydown', (e) => {
            const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (!step) return;
            const next = (i + step + tabs.length) % tabs.length;
            show(next);
            tabs[next].focus();
        });
    });
});
