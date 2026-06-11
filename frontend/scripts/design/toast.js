(function () {
  const CSS = `
    #af-toast-wrap {
      position: fixed;
      top: 90px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      width: 340px;
      max-width: calc(100vw - 40px);
    }

    .af-toast {
      display: flex;
      align-items: flex-start;
      gap: 11px;
      padding: 13px 14px 17px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.09);
      background: #111827;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.45;
      pointer-events: all;
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: translateX(16px);
      transition: opacity 0.22s ease, transform 0.22s ease;
    }

    .af-toast.af-show {
      opacity: 1;
      transform: translateX(0);
    }

    .af-toast.af-hide {
      opacity: 0;
      transform: translateX(16px);
    }

    .af-toast-success { border-color: rgba(74,222,128,0.25); }
    .af-toast-error   { border-color: rgba(248,113,113,0.25); }
    .af-toast-warning { border-color: rgba(251,191,36,0.25); }
    .af-toast-info    { border-color: rgba(79,142,247,0.25); }

    .af-toast-icon {
      font-size: 15px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .af-toast-success .af-toast-icon { color: #4ade80; }
    .af-toast-error   .af-toast-icon { color: #f87171; }
    .af-toast-warning .af-toast-icon { color: #fbbf24; }
    .af-toast-info    .af-toast-icon { color: #4f8ef7; }

    .af-toast-msg { flex: 1; }

    .af-toast-close {
      background: none;
      border: none;
      color: #475569;
      cursor: pointer;
      font-size: 17px;
      line-height: 1;
      padding: 0;
      flex-shrink: 0;
      margin-top: -1px;
      transition: color 0.15s;
      font-family: inherit;
    }

    .af-toast-close:hover { color: #94a3b8; }

    .af-toast-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      background: rgba(255,255,255,0.1);
      border-radius: 0 0 10px 10px;
    }

    .af-toast-bar-fill {
      height: 100%;
      width: 100%;
      border-radius: 0 0 10px 10px;
      transition: width linear;
    }

    .af-toast-success .af-toast-bar-fill { background: #4ade80; }
    .af-toast-error   .af-toast-bar-fill { background: #f87171; }
    .af-toast-warning .af-toast-bar-fill { background: #fbbf24; }
    .af-toast-info    .af-toast-bar-fill { background: #4f8ef7; }

    @media (max-width: 480px) {
      #af-toast-wrap {
        top: auto;
        bottom: 20px;
        right: 12px;
        left: 12px;
        width: auto;
      }
    }
  `;

  function injectStyles() {
    if (document.getElementById('af-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'af-toast-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function getContainer() {
    let wrap = document.getElementById('af-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'af-toast-wrap';
      document.body.appendChild(wrap);
    }
    return wrap;
  }

  const ICONS = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  function dismiss(toast) {
    toast.classList.remove('af-show');
    toast.classList.add('af-hide');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }

  window.showToast = function (message, type, duration) {
    type     = type     || 'info';
    duration = duration !== undefined ? duration : 4000;

    injectStyles();
    const wrap  = getContainer();
    const toast = document.createElement('div');
    toast.className = `af-toast af-toast-${type}`;

    toast.innerHTML =
      '<span class="af-toast-icon">' + (ICONS[type] || ICONS.info) + '</span>' +
      '<span class="af-toast-msg">' + message + '</span>' +
      '<button class="af-toast-close" aria-label="Close">&times;</button>' +
      '<div class="af-toast-bar"><div class="af-toast-bar-fill"></div></div>';

    wrap.appendChild(toast);

    // Animate in on next frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add('af-show');
      });
    });

    // Progress bar
    var fill = toast.querySelector('.af-toast-bar-fill');
    fill.style.transitionDuration = duration + 'ms';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fill.style.width = '0%';
      });
    });

    var timer = setTimeout(function () { dismiss(toast); }, duration);

    toast.querySelector('.af-toast-close').addEventListener('click', function () {
      clearTimeout(timer);
      dismiss(toast);
    });
  };

  // Convenience aliases
  window.showToast.success = function (msg, dur) { window.showToast(msg, 'success', dur); };
  window.showToast.error   = function (msg, dur) { window.showToast(msg, 'error',   dur); };
  window.showToast.warning = function (msg, dur) { window.showToast(msg, 'warning', dur); };
  window.showToast.info    = function (msg, dur) { window.showToast(msg, 'info',    dur); };
})();
