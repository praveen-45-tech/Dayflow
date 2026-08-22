function toast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'error' ? '⚠' : type === 'warn' ? '●' : '✓';
  el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(()=>el.remove(), 350); }, 3200);
}
