document.documentElement.classList.add('js');

(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');

  if (!toggle || !nav) return;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const opening = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu({ restoreFocus: true });
    }
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });

  // Matches the header breakpoint in site.css (max-width: 1200px).
  const desktop = window.matchMedia('(min-width: 1201px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });
})();

(() => {
  const controls = document.querySelector('[data-archive-controls]');
  if (!controls) return;

  const search = controls.querySelector('[data-archive-search]');
  const clear = controls.querySelector('[data-archive-clear]');
  const topics = [...controls.querySelectorAll('[data-archive-topic]')];
  const yearJump = controls.querySelector('[data-archive-year]');
  const status = controls.querySelector('[data-archive-status]');
  const groups = [...document.querySelectorAll('[data-year-group]')];
  const empty = document.querySelector('[data-archive-empty]');
  let activeTopic = '';

  const normalize = (value) => (value || '').toLocaleLowerCase().trim();

  groups.forEach((group) => {
    const count = group.querySelector('[data-year-count]');
    if (count) count.dataset.defaultCount = count.textContent.trim();
  });

  const setTopic = (value) => {
    activeTopic = normalize(value);
    topics.forEach((button) => {
      const selected = normalize(button.dataset.archiveTopic) === activeTopic;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  const applyFilters = () => {
    const query = normalize(search.value);
    let visibleTotal = 0;

    groups.forEach((group) => {
      let visibleInGroup = 0;
      const items = [...group.querySelectorAll('[data-archive-item]')];

      items.forEach((item) => {
        const haystack = normalize(item.dataset.search);
        const itemTopics = normalize(item.dataset.topics).split('||').filter(Boolean);
        const matchesQuery = !query || haystack.includes(query);
        const matchesTopic = !activeTopic || itemTopics.includes(activeTopic);
        const visible = matchesQuery && matchesTopic;
        item.hidden = !visible;
        if (visible) visibleInGroup += 1;
      });

      group.hidden = visibleInGroup === 0;
      visibleTotal += visibleInGroup;

      const count = group.querySelector('[data-year-count]');
      if (count) {
        count.textContent = query || activeTopic
          ? `${visibleInGroup} shown`
          : count.dataset.defaultCount;
      }
    });

    const filtering = Boolean(query || activeTopic);
    clear.hidden = !filtering;
    empty.hidden = visibleTotal !== 0;
    status.textContent = filtering && visibleTotal
      ? `Showing ${visibleTotal} matching ${visibleTotal === 1 ? 'item' : 'items'}.`
      : '';
  };

  search.addEventListener('input', applyFilters);

  topics.forEach((button) => {
    button.addEventListener('click', () => {
      setTopic(button.dataset.archiveTopic);
      applyFilters();
    });
  });

  clear.addEventListener('click', () => {
    search.value = '';
    setTopic('');
    applyFilters();
    search.focus();
  });

  yearJump.addEventListener('change', () => {
    if (!yearJump.value) return;
    const target = document.querySelector(`#archive-year-${CSS.escape(yearJump.value)}`);
    if (target) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
    yearJump.value = '';
  });
})();
