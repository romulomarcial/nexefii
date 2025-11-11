// Clear Service Worker - Run this in browser console
(async function clearServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
      console.log('Service Worker unregistered:', reg.scope);
    }
    console.log('✓ All Service Workers cleared');
    
    // Clear all caches
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
      console.log('Cache cleared:', name);
    }
    console.log('✓ All caches cleared');
    console.log('Reloading page in 1 second...');
    setTimeout(() => location.reload(), 1000);
  }
})();
