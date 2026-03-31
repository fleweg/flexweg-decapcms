// Main JavaScript file

// Theme switcher
const getStoredTheme = () => localStorage.getItem('theme');
const setStoredTheme = theme => localStorage.setItem('theme', theme);

const getPreferredTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const setTheme = theme => {
  if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
};

setTheme(getPreferredTheme());

const showActiveTheme = (theme, focus = false) => {
  const themeSwitcher = document.querySelector('#bd-theme');
  const activeThemeIcon = document.querySelector('.theme-icon-active use');

  // Update all theme buttons (desktop dropdown + offcanvas)
  document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
    element.classList.remove('active');
    element.setAttribute('aria-pressed', 'false');
    const checkIcon = element.querySelector('.bi.ms-auto');
    if (checkIcon) {
      checkIcon.classList.add('d-none');
    }
  });

  // Activate all buttons with the selected theme
  document.querySelectorAll(`[data-bs-theme-value="${theme}"]`).forEach(element => {
    element.classList.add('active');
    element.setAttribute('aria-pressed', 'true');
    const checkIcon = element.querySelector('.bi.ms-auto');
    if (checkIcon) {
      checkIcon.classList.remove('d-none');
    }
  });

  // Update desktop theme icon
  if (themeSwitcher && activeThemeIcon) {
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);
    if (btnToActive) {
      const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href');
      activeThemeIcon.setAttribute('href', svgOfActiveBtn);
      themeSwitcher.setAttribute('aria-label', `Toggle theme (${theme})`);

      if (focus) {
        themeSwitcher.focus();
      }
    }
  }
};

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const storedTheme = getStoredTheme();
  if (storedTheme !== 'light' && storedTheme !== 'dark') {
    setTheme(getPreferredTheme());
  }
});

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
  showActiveTheme(getPreferredTheme());

  document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const theme = toggle.getAttribute('data-bs-theme-value');
      setStoredTheme(theme);
      setTheme(theme);
      showActiveTheme(theme, true);
    });
  });
  // Add smooth scrolling to all links with hash
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      if (href !== '#' && href.length > 1) {
        const target = document.querySelector(href);

        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Header scroll effect with hide/show
  const header = document.querySelector('.site-header');

  if (header) {
    let lastScroll = 0;
    const scrollThreshold = 100; // Start hiding after scrolling 100px

    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;

      // Add shadow when scrolled
      if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
      } else {
        header.style.boxShadow = 'none';
      }

      // Hide/show header based on scroll direction
      if (currentScroll > scrollThreshold) {
        if (currentScroll > lastScroll && !header.classList.contains('header-hidden')) {
          // Scrolling down - hide header
          header.classList.add('header-hidden');
        } else if (currentScroll < lastScroll && header.classList.contains('header-hidden')) {
          // Scrolling up - show header
          header.classList.remove('header-hidden');
        }
      } else {
        // At top of page - always show header
        header.classList.remove('header-hidden');
      }

      lastScroll = currentScroll;
    });
  }
});
