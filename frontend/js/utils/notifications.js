/**
 * Notification System
 * Provides user feedback for success, error, warning, and info messages
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.nextId = 1;
        this.init();
    }

    /**
     * Initialize notification container
     */
    init() {
        // Create container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(container);
            this.container = container;
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (0 = permanent)
     * @returns {number} Notification ID
     */
    show(message, type = 'info', duration = 5000) {
        const id = this.nextId++;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-notification-id', id);
        
        // Get icon and colors based on type
        const config = this.getTypeConfig(type);
        
        notification.style.cssText = `
            background: ${config.background};
            border-left: 4px solid ${config.borderColor};
            color: ${config.textColor};
            padding: 16px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
            min-width: 300px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="flex-shrink: 0; margin-top: 2px;">
                ${config.icon}
            </div>
            <div style="flex: 1; font-size: 14px; line-height: 1.5;">
                ${message}
            </div>
            <button 
                class="notification-close" 
                style="
                    background: none;
                    border: none;
                    color: ${config.textColor};
                    cursor: pointer;
                    padding: 0;
                    font-size: 20px;
                    line-height: 1;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                "
                onmouseover="this.style.opacity='1'"
                onmouseout="this.style.opacity='0.7'"
            >
                ×
            </button>
        `;
        
        // Add close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hide(id));
        
        // Add to container
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    }

    /**
     * Hide notification
     * @param {number} id - Notification ID
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Fade out animation
        notification.style.animation = 'slideOut 0.3s ease-out';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Hide all notifications
     */
    hideAll() {
        this.notifications.forEach((_, id) => this.hide(id));
    }

    /**
     * Get configuration for notification type
     * @param {string} type
     * @returns {Object}
     */
    getTypeConfig(type) {
        const configs = {
            success: {
                background: '#d1f2eb',
                borderColor: '#0f5132',
                textColor: '#0f5132',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`
            },
            error: {
                background: '#f8d7da',
                borderColor: '#842029',
                textColor: '#842029',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`
            },
            warning: {
                background: '#fff3cd',
                borderColor: '#997404',
                textColor: '#997404',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>`
            },
            info: {
                background: '#cfe2ff',
                borderColor: '#084298',
                textColor: '#084298',
                icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>`
            }
        };
        
        return configs[type] || configs.info;
    }

    /**
     * Convenience methods
     */
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Create singleton instance
const notifications = new NotificationSystem();

// Export singleton and convenience functions
export default notifications;

export function showNotification(message, type = 'info', duration = 5000) {
    return notifications.show(message, type, duration);
}

export function showSuccess(message, duration = 5000) {
    return notifications.success(message, duration);
}

export function showError(message, duration = 7000) {
    return notifications.error(message, duration);
}

export function showWarning(message, duration = 6000) {
    return notifications.warning(message, duration);
}

export function showInfo(message, duration = 5000) {
    return notifications.info(message, duration);
}

export function hideNotification(id) {
    notifications.hide(id);
}

export function hideAllNotifications() {
    notifications.hideAll();
}
