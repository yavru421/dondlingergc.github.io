

self.addEventListener('push', event => {
    let payload = { title: 'Wazeecha Telemetry', body: 'New weather/river level alert!' };
    try {
        if (event.data) {
            payload = event.data.json();
        }
    } catch (e) {
        if (event.data) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: 'dondlinger_logo.png',
        badge: 'dondlinger_logo.png',
        vibrate: [200, 100, 200],
        data: payload.data || {}
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/#wazeecha-telemetry';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                const clientUrl = new URL(client.url, self.location.origin);
                if (clientUrl.pathname === '/' || clientUrl.pathname === '/index.html') {
                    if ('focus' in client) {
                        client.focus();
                        if ('navigate' in client) {
                            return client.navigate(targetUrl);
                        }
                    }
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
