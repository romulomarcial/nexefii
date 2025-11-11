/**
 * PWA Installer & Service Worker Registration
 * Handles installation prompt and service worker lifecycle
 * 
 * Features:
 * - Service Worker registration and updates
 * - Install prompt management
 * - Offline detection
 * - Update notifications
 * 
 * @version 1.0.1
 * @date 2025-11-09
 * 
 * STATUS: SERVICE WORKER DISABLED FOR STABILITY
 * Will be re-enabled after full system validation
 */

(function() {
  'use strict';

  // Keep a lightweight, safe declaration so pages that import this file
  // can use deferredPrompt without throwing ReferenceError when SW code
  // is disabled during development.
  let deferredPrompt = null;
  let swRegistration = null;

  console.log('✅ PWA Installer loaded (Service Worker DISABLED for stability)');

  // SERVICE WORKER REGISTRATION DISABLED TEMPORARILY
  // This prevents caching issues during development and stabilization
  // To re-enable: uncomment the block below and reload
  
  /*
  let deferredPrompt;
  let swRegistration;

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          swRegistration = registration;

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Service Worker update found');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
        // Optionally reload the page
        // window.location.reload();
      });
    });
  } else {
    console.warn('⚠️ Service Workers not supported in this browser');
  }
  */
  // Capture install prompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install button/banner
    showInstallPromotion();
  });

  // Handle app installed event
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;
    hideInstallPromotion();
    
    // Track installation (analytics)
    if (window.gtag) {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation'
      });
    }
  });

  // Show install promotion UI
  function showInstallPromotion() {
    // Create install banner if it doesn't exist
    if (document.getElementById('pwa-install-banner')) {
      return; // Already showing
    }

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #0066cc, #00ccff);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0, 102, 204, 0.4);
        z-index: 10000;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          <div style="font-size: 32px;">📱</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 8px;">Install NEXEFII</div>
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">
              Install this app on your device for offline access and better performance.
            </div>
            <div style="display: flex; gap: 10px;">
              <button id="pwa-install-button" style="
                background: white;
                color: #0066cc;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
              ">Install</button>
              <button id="pwa-dismiss-button" style="
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
              ">Not Now</button>
            </div>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(banner);

    // Install button handler
    document.getElementById('pwa-install-button').addEventListener('click', async () => {
      if (!deferredPrompt) {
        return;
      }

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);

      // Clear the deferred prompt
      deferredPrompt = null;
      hideInstallPromotion();
    });

    // Dismiss button handler
    document.getElementById('pwa-dismiss-button').addEventListener('click', () => {
      hideInstallPromotion();
      
      // Don't show again for 7 days
      localStorage.setItem('pwa-install-dismissed', Date.now());
    });
  }

  // Hide install promotion
  function hideInstallPromotion() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => banner.remove(), 300);
    }
  }

  // Show update notification
  function showUpdateNotification() {
    // Check if already showing
    if (document.getElementById('pwa-update-notification')) {
      return;
    }

    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2d2d2d;
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 10000;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          <div style="font-size: 32px;">🔄</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 8px;">Update Available</div>
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">
              A new version of NEXEFII is available. Refresh to update.
            </div>
            <div style="display: flex; gap: 10px;">
              <button id="pwa-update-button" style="
                background: linear-gradient(135deg, #0066cc, #00ccff);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
              ">Update Now</button>
              <button id="pwa-update-dismiss-button" style="
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
              ">Later</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Update button handler
    document.getElementById('pwa-update-button').addEventListener('click', () => {
      if (swRegistration && swRegistration.waiting) {
        // Tell the waiting service worker to activate
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });

    // Dismiss button handler
    document.getElementById('pwa-update-dismiss-button').addEventListener('click', () => {
      notification.remove();
    });
  }

  // Check if dismissed recently (within 7 days)
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      console.log('Install prompt dismissed recently, not showing');
      return;
    }
  }

  // Detect if running as installed PWA
  function isRunningAsApp() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  if (isRunningAsApp()) {
    console.log('✅ Running as installed PWA');
    document.body.classList.add('pwa-installed');
  }

  // Monitor online/offline status
  window.addEventListener('online', () => {
    console.log('🌐 Back online');
    showConnectionNotification('Online', 'You are back online', '#00cc66');
  });

  window.addEventListener('offline', () => {
    console.log('📡 Offline');
    showConnectionNotification('Offline', 'You are offline. Some features may be limited.', '#ff9900');
  });

  // Connection notification helper
  function showConnectionNotification(title, message, color) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${color};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
      font-weight: 600;
    `;
    notification.innerHTML = `
      <div>${title}</div>
      <div style="font-size: 12px; font-weight: 400; margin-top: 4px; opacity: 0.9;">${message}</div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Export utility functions
  window.PWAInstaller = {
    showInstallPrompt: () => {
      if (deferredPrompt) {
        showInstallPromotion();
      } else {
        console.warn('Install prompt not available');
      }
    },
    isInstalled: isRunningAsApp,
    getRegistration: () => swRegistration
  };

  console.log('✅ PWA Installer loaded');
})();
