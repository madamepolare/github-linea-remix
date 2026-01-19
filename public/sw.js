// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      notificationId: data.notificationId
    },
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  // Analytics or cleanup if needed
  console.log('Notification closed:', event.notification.tag);
});
