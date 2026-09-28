// Dondlinger Digital Database & Fleet Hub Engine v6.0.0
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('app-search');
  const filterChips = document.querySelectorAll('.filter-chip');
  const appCards = document.querySelectorAll('.feature-box');
  const nodeCountBadge = document.getElementById('node-count-badge');

  let currentFilter = 'all';
  let searchQuery = '';

  function filterCards() {
    let visibleCount = 0;
    const query = searchQuery.toLowerCase().trim();

    appCards.forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const searchData = (card.getAttribute('data-search') || '') + ' ' + card.innerText;
      const matchesFilter = (currentFilter === 'all') || (category === currentFilter);
      const matchesSearch = !query || searchData.toLowerCase().includes(query);

      if (matchesFilter && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (nodeCountBadge) {
      nodeCountBadge.textContent = `${visibleCount} Fleet Nodes Online`;
    }
  }

  // Filter chips click handler
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter') || 'all';
      filterCards();
    });
  });

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      filterCards();
    });

    // Escape clears search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        filterCards();
      }
    });
  }

  // Initialize
  filterCards();
});
