import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const COLORS: Record<ToastType, string> = {
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#4f8ef7',
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'rgba(74,222,128,0.25)',
  error: 'rgba(248,113,113,0.25)',
  warning: 'rgba(251,191,36,0.25)',
  info: 'rgba(79,142,247,0.25)',
};

/** Injects the toast container once and returns a `showToast` function. */
function ensureContainer(): HTMLElement {
  let wrap = document.getElementById('af-toast-wrap');
  if (!wrap) {
    // Inject base styles once
    if (!document.getElementById('af-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'af-toast-styles';
      style.textContent = `
        #af-toast-wrap{position:fixed;top:90px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;width:340px;max-width:calc(100vw - 40px)}
        .af-toast{display:flex;align-items:flex-start;gap:11px;padding:13px 14px 17px;border-radius:10px;border:1px solid rgba(255,255,255,.09);background:#111827;box-shadow:0 8px 32px rgba(0,0,0,.45);color:#f8fafc;font-family:'Inter',sans-serif;font-size:13.5px;font-weight:500;line-height:1.45;pointer-events:all;position:relative;overflow:hidden;opacity:0;transform:translateX(16px);transition:opacity .22s,transform .22s}
        .af-toast.af-show{opacity:1;transform:translateX(0)}
        .af-toast.af-hide{opacity:0;transform:translateX(16px)}
        .af-toast-icon{font-size:15px;flex-shrink:0;margin-top:1px}
        .af-toast-msg{flex:1}
        .af-toast-close{background:none;border:none;color:#475569;cursor:pointer;font-size:17px;line-height:1;padding:0;flex-shrink:0;margin-top:-1px;transition:color .15s;font-family:inherit}
        .af-toast-close:hover{color:#94a3b8}
        .af-toast-bar{position:absolute;bottom:0;left:0;height:3px;width:100%;background:rgba(255,255,255,.1);border-radius:0 0 10px 10px}
        .af-toast-bar-fill{height:100%;width:100%;border-radius:0 0 10px 10px;transition:width linear}
        @media(max-width:480px){#af-toast-wrap{top:auto;bottom:20px;right:12px;left:12px;width:auto}}
      `;
      document.head.appendChild(style);
    }
    wrap = document.createElement('div');
    wrap.id = 'af-toast-wrap';
    document.body.appendChild(wrap);
  }
  return wrap;
}

function dismiss(toast: HTMLElement) {
  toast.classList.remove('af-show');
  toast.classList.add('af-hide');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

function fireToast(message: string, type: ToastType = 'info', duration = 4000) {
  const wrap = ensureContainer();
  const toast = document.createElement('div');
  toast.className = 'af-toast';
  toast.style.borderColor = BORDER_COLORS[type];

  toast.innerHTML = `
    <span class="af-toast-icon" style="color:${COLORS[type]}">${ICONS[type]}</span>
    <span class="af-toast-msg">${message}</span>
    <button class="af-toast-close" aria-label="Close">&times;</button>
    <div class="af-toast-bar"><div class="af-toast-bar-fill" style="background:${COLORS[type]}"></div></div>
  `;

  wrap.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('af-show')));

  const fill = toast.querySelector<HTMLElement>('.af-toast-bar-fill')!;
  fill.style.transitionDuration = `${duration}ms`;
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = '0%'; }));

  const timer = setTimeout(() => dismiss(toast), duration);
  toast.querySelector('.af-toast-close')!.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss(toast);
  });
}

/** React hook that returns a stable `toast` object with .success/.error/.warning/.info helpers. */
export function useToast() {
  const show = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) =>
      fireToast(message, type, duration),
    [],
  );

  return {
    show,
    success: (msg: string, dur?: number) => fireToast(msg, 'success', dur),
    error: (msg: string, dur?: number) => fireToast(msg, 'error', dur),
    warning: (msg: string, dur?: number) => fireToast(msg, 'warning', dur),
    info: (msg: string, dur?: number) => fireToast(msg, 'info', dur),
  };
}
