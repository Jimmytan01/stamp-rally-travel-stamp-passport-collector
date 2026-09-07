export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatPassportDate(dateStr) {
  if (!dateStr) return '';
  const p = dateStr.split('-');
  if (p.length !== 3) return dateStr;
  const m = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${p[2]} ${m[parseInt(p[1],10)-1] || p[1]} ${p[0]}`;
}

export function renderSummary(stats, summaryEl) {
  if (!summaryEl) return;
  const t = summaryEl.querySelector('#stat-total'), v = summaryEl.querySelector('#stat-visited'), d = summaryEl.querySelector('#stat-dream');
  if (t) t.textContent = String(stats.total);
  if (v) v.textContent = String(stats.visited);
  if (d) d.textContent = String(stats.dream);
}

export function renderSkeleton(container, count = 3) {
  if (!container) return;
  container.innerHTML = '';
  container.setAttribute('aria-busy', 'true');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'passport-card skeleton-card';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="skeleton-header"><div class="skeleton-line" style="width:30%"></div><div class="skeleton-line" style="width:20%"></div></div><div class="skeleton-stamp"></div><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div>';
    frag.appendChild(c);
  }
  container.appendChild(frag);
}

export function renderEmptyState(container, onAddSample) {
  if (!container) return;
  container.innerHTML = `<div class="empty-state-card"><div class="seal-ring" aria-hidden="true"><span class="seal-icon">✈</span></div><h3 class="empty-state-title">Your Passport is Pristine</h3><p class="empty-state-desc">Every journey begins with a single stamp. Record a visited place or pin a future dream spot above!</p><div class="empty-state-actions"><button type="button" class="btn btn-secondary btn-sm" id="btn-load-sample">✦ Fill Sample Stamps</button><a href="#input-place" class="btn btn-primary btn-sm">+ Stamp First Place</a></div></div>`;
  const btn = container.querySelector('#btn-load-sample');
  if (btn && typeof onAddSample === 'function') btn.addEventListener('click', onAddSample);
}

export function createStampCard(stamp, index, { onToggle, onDelete }) {
  const card = document.createElement('article');
  card.className = `passport-card ${stamp.isDream ? 'card-dream' : 'card-stamped'} color-${stamp.color || 'blue'}`;
  card.id = `card-${stamp.id}`;
  card.style.setProperty('--stamp-tilt', stamp.tilt || '0deg');

  const fDate = stamp.date ? formatPassportDate(stamp.date) : (stamp.isDream ? 'SOMEDAY' : 'RECORDED');
  const lbl = stamp.date ? (stamp.isDream ? `🎯 Target: ${formatPassportDate(stamp.date)}` : `📅 Visited: ${formatPassportDate(stamp.date)}`) : '🎯 Target: Someday';

  card.innerHTML = `<div class="card-header"><span class="card-page-num">PAGE ${String(index + 1).padStart(2, '0')}</span><span class="card-status-badge ${stamp.isDream ? 'badge-dream' : 'badge-stamped'}">${stamp.isDream ? 'DREAM DESTINATION' : 'ENTRY VERIFIED'}</span><span class="card-code">${escapeHtml(stamp.code || 'PAS-ENTRY')}</span></div><div class="rubber-stamp" role="img"><div class="stamp-outer-ring"><div class="stamp-inner-ring"><div class="stamp-arc-top">${stamp.isDream ? '★ DREAM DESTINATION ★' : '★ PASSPORT ENTRY ★'}</div><div class="stamp-initials"></div><div class="stamp-arc-bottom">${escapeHtml(fDate)}</div></div></div></div><div class="card-body"><h3 class="card-place-title"></h3><div class="card-meta"><span class="card-date-badge">${escapeHtml(lbl)}</span></div>${stamp.memory ? '<blockquote class="card-memory"></blockquote>' : ''}</div><div class="card-actions"><button type="button" class="btn-action btn-toggle ${stamp.isDream ? 'btn-make-visited' : 'btn-make-dream'}">${stamp.isDream ? '✓ Mark Visited' : '✦ Move to Dream'}</button><button type="button" class="btn-action btn-delete">✕ Delete</button></div>`;

  card.querySelector('.stamp-initials').textContent = stamp.initials || 'SR';
  card.querySelector('.card-place-title').textContent = stamp.place;
  card.querySelector('.rubber-stamp').setAttribute('aria-label', `Stamp: ${stamp.place}`);
  if (stamp.memory) card.querySelector('.card-memory').textContent = `“${stamp.memory}”`;

  card.querySelector('.btn-toggle').addEventListener('click', () => onToggle(stamp.id));
  card.querySelector('.btn-delete').addEventListener('click', () => onDelete(stamp));
  return card;
}

export function renderStampsGrid(stamps, container, callbacks) {
  if (!container) return;
  container.removeAttribute('aria-busy');
  if (!stamps || stamps.length === 0) {
    renderEmptyState(container, callbacks.onAddSample);
    return;
  }
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  stamps.forEach((stamp, index) => frag.appendChild(createStampCard(stamp, index, callbacks)));
  container.appendChild(frag);
}

export function openDeleteConfirmModal(stamp, onConfirm) {
  const dialog = document.getElementById('delete-modal');
  if (!dialog) {
    if (window.confirm(`Revoke stamp for "${stamp.place}"?`)) onConfirm(stamp.id);
    return;
  }
  const nameTarget = dialog.querySelector('#delete-stamp-name');
  if (nameTarget) nameTarget.textContent = stamp.place;

  const confirmBtn = dialog.querySelector('#modal-btn-confirm');
  const cancelBtn = dialog.querySelector('#modal-btn-cancel');

  const cleanup = () => {
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    dialog.removeEventListener('cancel', handleCancel);
  };
  const handleConfirm = () => { cleanup(); dialog.close(); onConfirm(stamp.id); };
  const handleCancel = () => { cleanup(); dialog.close(); };

  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
  dialog.addEventListener('cancel', handleCancel);

  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    cancelBtn.focus();
  } else {
    dialog.setAttribute('open', '');
  }
}

export function showToast(message, type = 'info', durationMs = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  // Cap visible toasts at 2 to prevent stacking overlap on narrow screens
  while (container.children.length >= 2) {
    container.removeChild(container.firstChild);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 280);
  }, durationMs);
}
