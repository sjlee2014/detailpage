/**
 * UI 유틸리티 모듈
 * - Toast 알림
 * - 확인 모달
 * - 로딩 오버레이
 */

// Toast 컨테이너 생성
let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.innerHTML = `
      <style>
        #toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        
        .toast {
          background: #333;
          color: white;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Noto Sans KR', sans-serif;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          animation: toastSlideIn 0.3s ease;
          pointer-events: auto;
          max-width: 350px;
        }
        
        .toast.success { background: linear-gradient(135deg, #10b981, #059669); }
        .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .toast.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .toast.info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        
        .toast-icon { font-size: 18px; }
        .toast-message { flex: 1; line-height: 1.4; }
        
        .toast-close {
          background: none;
          border: none;
          color: white;
          opacity: 0.7;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
        }
        
        .toast-close:hover { opacity: 1; }
        
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100px); }
        }
        
        /* 확인 모달 */
        .confirm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        
        .confirm-modal {
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideUp 0.3s ease;
          font-family: 'Noto Sans KR', sans-serif;
        }
        
        .confirm-modal-icon {
          font-size: 48px;
          text-align: center;
          margin-bottom: 16px;
        }
        
        .confirm-modal-title {
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 12px;
          color: #333;
        }
        
        .confirm-modal-message {
          font-size: 14px;
          color: #666;
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        
        .confirm-modal-buttons {
          display: flex;
          gap: 12px;
        }
        
        .confirm-modal-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-family: inherit;
        }
        
        .confirm-modal-btn.cancel {
          background: #f3f4f6;
          color: #666;
        }
        
        .confirm-modal-btn.cancel:hover {
          background: #e5e7eb;
        }
        
        .confirm-modal-btn.confirm {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }
        
        .confirm-modal-btn.confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        
        .confirm-modal-btn.confirm.primary {
          background: linear-gradient(135deg, #6B5CE7, #FF6B9D);
        }
        
        .confirm-modal-btn.confirm.primary:hover {
          box-shadow: 0 4px 12px rgba(107, 92, 231, 0.4);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        /* 로딩 오버레이 */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          z-index: 10002;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          animation: fadeIn 0.2s ease;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e8e8e8;
          border-top-color: #6B5CE7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .loading-text {
          font-size: 16px;
          color: #333;
          font-weight: 500;
          font-family: 'Noto Sans KR', sans-serif;
        }
        
        .loading-progress {
          width: 200px;
          height: 6px;
          background: #e8e8e8;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .loading-progress-bar {
          height: 100%;
          background: linear-gradient(135deg, #6B5CE7, #FF6B9D);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * Toast 알림 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 타입: 'success', 'error', 'warning', 'info'
 * @param {number} duration - 표시 시간 (ms)
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close">✕</button>
  `;

    container.appendChild(toast);

    const closeToast = () => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').onclick = closeToast;

    if (duration > 0) {
        setTimeout(closeToast, duration);
    }

    return toast;
}

/**
 * 확인 모달 표시
 * @param {Object} options - 옵션
 * @param {string} options.title - 제목
 * @param {string} options.message - 메시지
 * @param {string} options.confirmText - 확인 버튼 텍스트
 * @param {string} options.cancelText - 취소 버튼 텍스트
 * @param {string} options.icon - 아이콘 이모지
 * @param {string} options.type - 'danger' | 'primary'
 * @returns {Promise<boolean>}
 */
export function showConfirm(options = {}) {
    return new Promise((resolve) => {
        const {
            title = '확인',
            message = '정말 진행하시겠습니까?',
            confirmText = '확인',
            cancelText = '취소',
            icon = '⚠️',
            type = 'danger'
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-modal-icon">${icon}</div>
        <div class="confirm-modal-title">${title}</div>
        <div class="confirm-modal-message">${message}</div>
        <div class="confirm-modal-buttons">
          <button class="confirm-modal-btn cancel">${cancelText}</button>
          <button class="confirm-modal-btn confirm ${type === 'primary' ? 'primary' : ''}">${confirmText}</button>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);

        const close = (result) => {
            overlay.style.animation = 'fadeIn 0.2s ease reverse forwards';
            setTimeout(() => overlay.remove(), 200);
            resolve(result);
        };

        overlay.querySelector('.cancel').onclick = () => close(false);
        overlay.querySelector('.confirm').onclick = () => close(true);
        overlay.onclick = (e) => {
            if (e.target === overlay) close(false);
        };

        // ESC 키로 닫기
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                close(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

/**
 * 로딩 오버레이 표시
 * @param {string} message - 로딩 메시지
 * @param {boolean} showProgress - 프로그래스 바 표시 여부
 * @returns {Object} - { update, close }
 */
export function showLoading(message = '처리 중...', showProgress = false) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">${message}</div>
    ${showProgress ? `
      <div class="loading-progress">
        <div class="loading-progress-bar" style="width: 0%"></div>
      </div>
    ` : ''}
  `;

    document.body.appendChild(overlay);

    return {
        update: (newMessage, progress) => {
            const textEl = overlay.querySelector('.loading-text');
            const progressBar = overlay.querySelector('.loading-progress-bar');

            if (textEl && newMessage) {
                textEl.textContent = newMessage;
            }

            if (progressBar && typeof progress === 'number') {
                progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
        },
        close: () => {
            overlay.style.animation = 'fadeIn 0.2s ease reverse forwards';
            setTimeout(() => overlay.remove(), 200);
        }
    };
}

/**
 * 기존 로딩 오버레이 닫기
 */
export function closeLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeIn 0.2s ease reverse forwards';
        setTimeout(() => overlay.remove(), 200);
    }
}
