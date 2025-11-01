// js/dialog.js

class Dialog {
    constructor() {
        this.container = this.createDialogContainer();
        this.setupStyles();
    }

    createDialogContainer() {
        const container = document.createElement('div');
        container.className = 'dialog-container';
        container.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-box">
                <div class="dialog-header">
                    <h3 class="dialog-title"></h3>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body"></div>
                <div class="dialog-footer">
                    <button class="dialog-btn dialog-cancel">إلغاء</button>
                    <button class="dialog-btn dialog-confirm">تأكيد</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        return container;
    }

    setupStyles() {
        if (!document.querySelector('#dialog-styles')) {
            const styles = `
                .dialog-container {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .dialog-container.show {
                    display: block;
                }
                
                .dialog-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(2px);
                }
                
                .dialog-box {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--bg-color, #fff);
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    min-width: 400px;
                    max-width: 90vw;
                    border: 1px solid var(--border-color, #e0e0e0);
                    overflow: hidden;
                }
                
                .dialog-header {
                    padding: 20px 20px 10px;
                    border-bottom: 1px solid var(--border-color, #e0e0e0);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .dialog-title {
                    margin: 0;
                    color: var(--text-color, #333);
                    font-size: 1.2rem;
                    font-weight: 600;
                }
                
                .dialog-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-muted, #666);
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                
                .dialog-close:hover {
                    background: var(--hover-color, #f5f5f5);
                    color: var(--danger-color, #e74c3c);
                }
                
                .dialog-body {
                    padding: 20px;
                    color: var(--text-color, #333);
                    line-height: 1.5;
                }
                
                .dialog-footer {
                    padding: 15px 20px;
                    border-top: 1px solid var(--border-color, #e0e0e0);
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    background: var(--bg-secondary, #f8f9fa);
                }
                
                .dialog-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                    min-width: 80px;
                }
                
                .dialog-cancel {
                    background: var(--bg-color, #fff);
                    color: var(--text-color, #333);
                    border: 1px solid var(--border-color, #ddd);
                }
                
                .dialog-cancel:hover {
                    background: var(--hover-color, #f5f5f5);
                }
                
                .dialog-confirm {
                    background: var(--danger-color, #e74c3c);
                    color: white;
                }
                
                .dialog-confirm:hover {
                    background: var(--danger-hover, #c0392b);
                }
                
                /* Dark theme support */
                [data-theme="dark"] .dialog-box {
                    --bg-color: #1e1e1e;
                    --text-color: #fff;
                    --border-color: #444;
                    --bg-secondary: #2d2d2d;
                    --hover-color: #333;
                    --text-muted: #aaa;
                    --danger-color: #e74c3c;
                    --danger-hover: #c0392b;
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.id = 'dialog-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    async confirm(options = {}) {
    return new Promise((resolve) => {
        const {
            title = 'تأكيد',
            message = 'هل أنت متأكد من هذا الإجراء؟',
            confirmText = 'تأكيد',
            cancelText = 'إلغاء',
            type = 'warning', // warning, danger, info, success
            html = false // إضافة هذا الخيار الجديد
        } = options;

        const dialog = this.container;
        const overlay = dialog.querySelector('.dialog-overlay');
        const dialogBox = dialog.querySelector('.dialog-box');
        const titleEl = dialog.querySelector('.dialog-title');
        const bodyEl = dialog.querySelector('.dialog-body');
        const confirmBtn = dialog.querySelector('.dialog-confirm');
        const cancelBtn = dialog.querySelector('.dialog-cancel');
        const closeBtn = dialog.querySelector('.dialog-close');

        // Set content
        titleEl.textContent = title;
        
        // دعم HTML في الـ message
        if (html) {
            bodyEl.innerHTML = message;
        } else {
            bodyEl.textContent = message;
        }
        
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        // Set type-based styling
        this.applyTypeStyling(type, confirmBtn);

        // Show dialog
        dialog.classList.add('show');
        dialogBox.style.animation = 'dialogSlideIn 0.3s ease-out';

        // Event handlers
        const cleanup = () => {
            dialog.classList.remove('show');
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            closeBtn.removeEventListener('click', cancelHandler);
            overlay.removeEventListener('click', cancelHandler);
            document.removeEventListener('keydown', escapeHandler);
        };

        const confirmHandler = () => {
            cleanup();
            resolve(true);
        };

        const cancelHandler = () => {
            cleanup();
            resolve(false);
        };

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                cancelHandler();
            }
        };

        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        closeBtn.addEventListener('click', cancelHandler);
        overlay.addEventListener('click', cancelHandler);
        document.addEventListener('keydown', escapeHandler);
    });
}
    applyTypeStyling(type, confirmBtn) {
        const colors = {
            warning: { bg: '#f39c12', hover: '#e67e22' },
            danger: { bg: '#e74c3c', hover: '#c0392b' },
            info: { bg: '#3498db', hover: '#2980b9' },
            success: { bg: '#27ae60', hover: '#219a52' }
        };

        const color = colors[type] || colors.warning;
        confirmBtn.style.backgroundColor = color.bg;
        confirmBtn.style.setProperty('--danger-color', color.bg);
        confirmBtn.style.setProperty('--danger-hover', color.hover);
        
        confirmBtn.onmouseenter = () => {
            confirmBtn.style.backgroundColor = color.hover;
        };
        confirmBtn.onmouseleave = () => {
            confirmBtn.style.backgroundColor = color.bg;
        };
    }

    // Method untuk alert بسيط
    async alert(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'تنبيه',
                message = '',
                buttonText = 'حسناً'
            } = options;

            const dialog = this.container;
            const dialogBox = dialog.querySelector('.dialog-box');
            const titleEl = dialog.querySelector('.dialog-title');
            const bodyEl = dialog.querySelector('.dialog-body');
            const confirmBtn = dialog.querySelector('.dialog-confirm');
            const cancelBtn = dialog.querySelector('.dialog-cancel');
            const footer = dialog.querySelector('.dialog-footer');

            // إخفاء زر الإلغاء
            cancelBtn.style.display = 'none';
            confirmBtn.textContent = buttonText;

            titleEl.textContent = title;
            bodyEl.textContent = message;

            dialog.classList.add('show');

            const cleanup = () => {
                dialog.classList.remove('show');
                cancelBtn.style.display = ''; // إعادة عرض زر الإلغاء
                confirmBtn.removeEventListener('click', confirmHandler);
            };

            const confirmHandler = () => {
                cleanup();
                resolve(true);
            };

            confirmBtn.addEventListener('click', confirmHandler);
        });
    }
}

// إنشاء instance واحد globally
window.dialog = new Dialog();

// دالة مختصرة للاستخدام السريع
export function showDialog(options) {
    return window.dialog.confirm(options);
}

export function showAlert(options) {
    return window.dialog.alert(options);
}