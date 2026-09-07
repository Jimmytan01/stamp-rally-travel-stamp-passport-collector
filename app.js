import { loadStamps, saveStamps, isStorageAvailable } from './storage.js';
import { initStamps, addStamp, deleteStamp, toggleStampStatus, subscribe, setStorageError, setFilter } from './state.js';
import { renderSummary, renderStampsGrid, renderSkeleton, openDeleteConfirmModal, showToast } from './render.js';

const SAMPLES = [
  { place: 'Kyoto, Japan', date: '2023-11-14', color: 'gold', memory: 'Tranquil torii gates in autumn drizzle.', isDream: false },
  { place: 'Reykjavik, Iceland', date: '2025-02-18', color: 'blue', memory: 'Emerald aurora borealis in arctic skies.', isDream: true },
  { place: 'Rome, Italy', date: '2022-06-03', color: 'red', memory: 'Sun-drenched cobblestones beside the Pantheon.', isDream: false }
];

function initApp() {
  const form = document.getElementById('stamp-form');
  const placeInput = document.getElementById('input-place');
  const dateInput = document.getElementById('input-date');
  const memoryInput = document.getElementById('input-memory');
  const memoryCharCount = document.getElementById('char-count');
  const dreamCheckbox = document.getElementById('input-dream');
  const submitBtn = document.getElementById('btn-submit-stamp');
  const gridContainer = document.getElementById('stamps-grid');
  const summaryEl = document.getElementById('passport-summary');
  const filterButtons = document.querySelectorAll('[data-filter]');

  const todayIso = new Date().toISOString().split('T')[0];
  if (dateInput && !dateInput.value) dateInput.value = todayIso;

  renderSkeleton(gridContainer, 3);

  if (!isStorageAvailable()) {
    const msg = 'Private browsing or storage restricted. Session only.';
    setStorageError(msg);
    showToast(msg, 'error', 5000);
  }

  const loaded = loadStamps();
  if (!loaded.success && loaded.error) {
    setStorageError(loaded.error);
    showToast(loaded.error, 'error');
  }

  setTimeout(() => initStamps(loaded.data), 200);

  subscribe((curr) => {
    const res = saveStamps(curr.stamps);
    if (!res.success) showToast(res.error || 'Failed to save', 'error');
    renderSummary(curr.stats, summaryEl);

    let list = curr.stamps;
    if (curr.filter === 'visited') list = curr.stamps.filter((s) => !s.isDream);
    else if (curr.filter === 'dream') list = curr.stamps.filter((s) => s.isDream);

    renderStampsGrid(list, gridContainer, {
      onToggle: (id) => {
        const u = toggleStampStatus(id);
        if (u) showToast(u.isDream ? `"${u.place}" marked Dream.` : `"${u.place}" marked Visited!`, 'success');
      },
      onDelete: (stamp) => {
        openDeleteConfirmModal(stamp, (id) => {
          deleteStamp(id);
          showToast(`Stamp for "${stamp.place}" removed.`, 'info');
        });
      },
      onAddSample: () => {
        SAMPLES.forEach((s) => addStamp(s));
        showToast('Sample stamps added to passport!', 'success');
      }
    });
  });

  if (memoryInput && memoryCharCount) {
    memoryInput.addEventListener('input', () => {
      const len = memoryInput.value.length;
      memoryCharCount.textContent = `${len}/180`;
      memoryCharCount.classList.toggle('char-warn', len >= 170);
    });
  }

  if (dreamCheckbox && dateInput) {
    const dateLabel = document.querySelector('label[for="input-date"] .label-sub');
    dreamCheckbox.addEventListener('change', () => {
      if (dateLabel) dateLabel.textContent = dreamCheckbox.checked ? '(Target date)' : '(Date of visit)';
      if (!dreamCheckbox.checked && !dateInput.value) dateInput.value = todayIso;
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      setFilter(btn.getAttribute('data-filter') || 'all');
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const place = placeInput ? placeInput.value.trim() : '';
      if (!place) {
        placeInput.classList.add('input-error');
        placeInput.focus();
        showToast('Please enter a place name.', 'error');
        return;
      }
      placeInput.classList.remove('input-error');

      const col = form.querySelector('input[name="stamp-color"]:checked');
      const isDream = Boolean(dreamCheckbox && dreamCheckbox.checked);
      let dateVal = dateInput ? dateInput.value.trim() : '';
      if (!isDream && !dateVal) dateVal = todayIso;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-pending');
        submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Stamping...';
      }

      setTimeout(() => {
        addStamp({
          place,
          date: dateVal,
          color: col ? col.value : 'blue',
          memory: memoryInput ? memoryInput.value.slice(0, 180) : '',
          isDream
        });
        form.reset();
        if (dateInput) dateInput.value = todayIso;
        if (memoryCharCount) memoryCharCount.textContent = '0/180';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-pending');
          submitBtn.innerHTML = '<span aria-hidden="true">✍</span> Stamp Passport Page';
        }
        showToast(isDream ? `"${place}" pinned to Dreams!` : `"${place}" stamped!`, 'success');
        if (placeInput) placeInput.focus();
      }, 160);
    });

    if (placeInput) {
      placeInput.addEventListener('input', () => {
        if (placeInput.value.trim()) placeInput.classList.remove('input-error');
      });
    }
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();
