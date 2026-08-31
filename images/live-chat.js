(function () {
    const TAWKTO_EMBED_URL = 'https://embed.tawk.to/6a3e969c6ac34c1d43e2bb93/1js27okp1';
    const TAWKTO_DIRECT_CHAT = 'https://tawk.to/chat/6a3e969c6ac34c1d43e2bb93/1js27okp1';
    const FALLBACK_SMS = 'sms:+16782429309?&body=Customer%20ON!';
    const FALLBACK_EMAIL = 'mailto:admin@comcare.store?cc=accentGV%40gmail.com&subject=Comfort%20Care%20Live%20Chat%20Request&body=Hello%20Comfort%20Care%2C%0A%0AI%20need%20help%20with%20a%20rental.';
    let tawkLoaded = false;
    let fallbackShown = false;

    function hasTawkFrame() {
        return Array.from(document.querySelectorAll('iframe')).some(function (frame) {
            const src = frame.getAttribute('src') || '';
            const title = frame.getAttribute('title') || '';
            return src.indexOf('tawk.to') !== -1 || title.toLowerCase().indexOf('tawk') !== -1;
        });
    }

    function loadTawkWidget(url) {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();
        window.Tawk_API.onLoad = function () {
            tawkLoaded = true;

            const fallback = document.getElementById('comfortCareLiveChat');
            if (fallback) {
                fallback.remove();
            }

            if (typeof window.Tawk_API.showWidget === 'function') {
                window.Tawk_API.showWidget();
            }
        };

        const script = document.createElement('script');
        script.async = true;
        script.src = url;
        script.charset = 'UTF-8';
        script.onerror = function () {
            buildFallbackChat(false);
        };
        document.head.appendChild(script);

        window.setTimeout(function () {
            if (!tawkLoaded && !hasTawkFrame()) {
                buildFallbackChat(false);
            }
        }, 9000);
    }

    function buildFallbackChat(openPanel) {
        if (document.getElementById('comfortCareLiveChat')) {
            return;
        }
        fallbackShown = true;

        const wrapper = document.createElement('div');
        wrapper.id = 'comfortCareLiveChat';
        wrapper.className = 'live-chat-fallback';
        wrapper.innerHTML = `
            <button type="button" class="live-chat-toggle" aria-expanded="false" aria-controls="liveChatPanel">
                <span aria-hidden="true">?</span>
                <strong>Chat</strong>
            </button>
            <div id="liveChatPanel" class="live-chat-panel" hidden>
                <div class="live-chat-panel-header">
                    <strong>Comfort Care</strong>
                    <button type="button" class="live-chat-close" aria-label="Close live chat">x</button>
                </div>
                <p>Need help choosing a bed or mobility rental? Start chat or contact us directly.</p>
                <div class="live-chat-actions">
                    <a href="${TAWKTO_DIRECT_CHAT}" target="_blank" rel="noopener">Chat</a>
                    <a href="tel:678-242-9309">Call</a>
                    <a href="${FALLBACK_SMS}">Text</a>
                    <a href="${FALLBACK_EMAIL}">Email</a>
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);

        const toggle = wrapper.querySelector('.live-chat-toggle');
        const close = wrapper.querySelector('.live-chat-close');
        const panel = wrapper.querySelector('.live-chat-panel');

        function setOpen(isOpen) {
            panel.hidden = !isOpen;
            toggle.setAttribute('aria-expanded', String(isOpen));
        }

        toggle.addEventListener('click', function () {
            setOpen(panel.hidden);
        });

        close.addEventListener('click', function () {
            setOpen(false);
        });

        if (openPanel) {
            setOpen(true);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!fallbackShown) {
            loadTawkWidget(TAWKTO_EMBED_URL);
        }
    });
})();
