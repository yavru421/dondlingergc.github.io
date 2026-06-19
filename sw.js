

self.addEventListener('push', event => {
    event.waitUntil(
        (async () => {
            let payload = { title: 'Wazeecha Telemetry', body: 'New weather/river level alert!', data: {} };
            
            try {
                if (event.data) {
                    payload = event.data.json();
                } else {
                    const res = await fetch('/latest-notification');
                    if (res.ok) {
                        const data = await res.json();
                        payload.title = data.title || payload.title;
                        payload.body = data.message || payload.body;
                    }
                }
            } catch (e) {
                if (event.data) {
                    payload.body = event.data.text();
                } else {
                    console.error('Error fetching latest notification', e);
                }
            }

            const options = {
                body: payload.body,
                icon: 'dondlinger_logo.png',
                badge: 'dondlinger_logo.png',
                vibrate: [200, 100, 200],
                data: payload.data || {}
            };

            await self.registration.showNotification(payload.title, options);
        })()
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
