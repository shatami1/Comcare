(function() {
    const ORDER_TABS = [
        { label: 'One Touch Solution', href: 'one-touch-solution.html', key: 'one-touch' },
        { label: 'Order', href: 'order.html', key: 'order', type: 'order' },
        { label: 'Resources', key: 'resources', type: 'resources' }
    ];

    const ORDER_MENU_ITEMS = [
        { label: 'Place Equipment Order', href: 'order.html' },
        { label: 'Hospital Beds', href: 'order.html#hospital-beds' },
        { label: 'Wheelchairs & Mobility Chairs', href: 'order.html#mobility-equipment' },
        { label: 'Walkers & Rollators', href: 'order.html#walkers-rollators' },
        { label: 'Room & Bathroom Support', href: 'order.html#room-bathroom-support' },
        { label: 'One Touch Request', href: 'one-touch-solution.html' },
        { label: 'Recovery Packages', href: 'recovery-support.html#recovery-packages' },
        { label: 'Essential Recovery - $49/mo', href: 'recovery-support.html#essential-recovery' },
        { label: 'Comfort Recovery - $149/mo', href: 'recovery-support.html#comfort-recovery' },
        { label: 'Comfort Extend - $249/mo', href: 'recovery-support.html#comfort-extend' },
        { label: 'Comfort Plus - $399/mo', href: 'recovery-support.html#comfort-plus' }
    ];

    const RENTAL_MENU_ITEMS = [
        { label: 'Hospital Beds', href: 'order.html#hospital-beds' },
        { label: 'Wheelchairs & Mobility Chairs', href: 'order.html#mobility-equipment' },
        { label: 'Walkers & Rollators', href: 'order.html#walkers-rollators' },
        { label: 'Room & Bathroom Support', href: 'order.html#room-bathroom-support' }
    ];

    const GUIDE_ITEMS = [
        {
            title: 'Rentals',
            href: 'services.html',
            detail: 'Hospital beds, wheelchairs, walkers, scooters, rollators, and canes.'
        },
        {
            title: 'Home Rehab',
            href: 'care-guide.html#home-rehab',
            detail: 'Room setup, bed path, mobility path, bathroom safety, and recovery planning.'
        },
        {
            title: 'Delivery',
            href: 'care-guide.html#delivery-installation',
            detail: 'Delivery, installation, apartment setup, pickup, and placement support.'
        },
        {
            title: 'Recovery Network',
            href: 'recovery-professionals.html',
            detail: 'Connect patients and families with local recovery support paths.'
        },
        {
            title: 'Join Network',
            href: 'join-professionals.html#professionalForm',
            detail: 'Nurses, rehab techs, caregivers, and providers can register for referrals.'
        },
        {
            title: 'Contact',
            href: 'contact.html',
            detail: 'Call, email, or ask Comfort Care which path is best.'
        }
    ];

    const RESOURCE_MENU_ITEMS = [
        { label: 'Open Recovery Hub', href: 'https://hub.comcare.store/' },
        { label: 'Create Hub Client Profile', href: 'https://hub.comcare.store/client-profile' },
        { label: 'One Touch Planning Guide', href: 'one-touch-planning.html' },
        { label: 'ComCare Caregiver Suggestions', href: 'home.html#caregiver-suggestions' },
        { label: 'Healthcare Resources', href: 'atlanta-sandy-springs-healthcare-resources.html' },
        { label: 'Care Guide', href: 'care-guide.html' },
        { label: 'Home Rehab Setup', href: 'care-guide.html#home-rehab' },
        { label: 'Delivery & Installation', href: 'care-guide.html#delivery-installation' },
        { label: 'Recovery Support', href: 'recovery-support.html' },
        { label: 'Recovery Network', href: 'recovery-professionals.html' },
        { label: 'Register Provider', href: 'join-professionals.html' },
        { label: 'Register Nurse / Caregiver', href: 'join-professionals.html?role=nurse-caregiver#professionalForm' },
        { label: 'Contact ComCare', href: 'contact.html' }
    ];

    const EQUIPMENT_COLLAGE_ITEMS = [
        'images/bed-picture-full.jpg',
        'images/bed-picture-semi.jpg',
        'images/Picture14.png',
        'images/Picture17.png',
        'images/Picture18.png',
        'images/Picture19.png'
    ];

    function getPathPrefix() {
        const path = window.location.pathname.replace(/\\/g, '/');
        return /\/Order\//i.test(path) ? '../' : '';
    }

    function getCurrentFile() {
        const path = window.location.pathname.replace(/\\/g, '/');
        const file = decodeURIComponent(path.split('/').pop() || 'index.html');
        if (!file) {
            return 'index.html';
        }
        return file.includes('.') ? file : `${file}.html`;
    }

    function navHref(prefix, href) {
        if (/^(https?:|mailto:|tel:|#)/i.test(href || '')) {
            return href;
        }
        return `${prefix}${href}`;
    }

    function getActiveKey(file) {
        if (file === 'home.html') {
            return 'home';
        }

        if (
            file === 'care-guide.html'
            || file === 'atlanta-sandy-springs-healthcare-resources.html'
            || file === 'recovery-professionals.html'
            || file === 'one-touch-planning.html'
            || file === 'order-dashboard.html'
            || file === 'contact.html'
        ) {
            return 'resources';
        }

        if (file === 'order.html') {
            return 'order';
        }

        if (file === 'recovery-support.html') {
            return 'order';
        }

        if (file === 'one-touch-solution.html') {
            return 'one-touch';
        }

        if (file === 'cart.html' || file === 'mylist.html' || file === 'pricing.html') {
            return 'order';
        }

        if (['payment.html', 'payment-button.html', 'checkout.html', 'success.html', 'thank-you.html'].includes(file)) {
            return 'order';
        }

        if (file === 'join-professionals.html') {
            return 'resources';
        }

        if (file === 'rehab-tech-intake.html') {
            return 'order';
        }

        if (
            file === 'index.html'
            || file === 'hospital-bed-special-offer.html'
            || file === 'services.html'
            || file === 'products.html'
            || file === 'future-products.html'
            || file.includes('rental')
        ) {
            return 'order';
        }

        return '';
    }

    function createDropdownItems(prefix, items) {
        return items.map(item => `
            <a href="${navHref(prefix, item.href)}" class="nav-menu-dropdown-option" role="menuitem">${item.label}</a>
        `).join('');
    }

    function buildMenuTab(tab, prefix, activeKey) {
        const activeClass = tab.key === activeKey ? ' active' : '';

        if (tab.type === 'rentals') {
            return `
                <li class="nav-menu-dropdown nav-rentals-menu${activeClass ? ' is-active' : ''}">
                    <button type="button" class="nav-menu-button nav-menu-dropdown-toggle${activeClass}" aria-expanded="false" aria-haspopup="true">
                        ${tab.label}
                    </button>
                    <div class="nav-menu-dropdown-panel" role="menu" aria-label="Rental options">
                        ${createDropdownItems(prefix, RENTAL_MENU_ITEMS)}
                    </div>
                </li>
            `;
        }

        if (tab.type === 'order') {
            return `
                <li class="nav-menu-dropdown nav-order-menu${activeClass ? ' is-active' : ''}">
                    <button type="button" class="nav-menu-button nav-menu-dropdown-toggle${activeClass}" aria-expanded="false" aria-haspopup="true">
                        ${tab.label}
                    </button>
                    <div class="nav-menu-dropdown-panel" role="menu" aria-label="Order options">
                        ${createDropdownItems(prefix, ORDER_MENU_ITEMS)}
                    </div>
                </li>
            `;
        }

        if (tab.type === 'resources') {
            return `
                <li class="nav-menu-dropdown nav-resources-menu${activeClass ? ' is-active' : ''}">
                    <button type="button" class="nav-menu-button nav-menu-dropdown-toggle${activeClass}" aria-expanded="false" aria-haspopup="true">
                        ${tab.label}
                    </button>
                    <div class="nav-menu-dropdown-panel" role="menu" aria-label="Resource options">
                        ${createDropdownItems(prefix, RESOURCE_MENU_ITEMS)}
                    </div>
                </li>
            `;
        }

        return `<li data-nav-key="${tab.key}"><a href="${navHref(prefix, tab.href)}"${activeClass ? ' class="active"' : ''}>${tab.label}</a></li>`;
    }

    function closeNavDropdowns(exceptMenu) {
        document.querySelectorAll('.nav-menu-dropdown.is-open').forEach(function(menu) {
            if (menu !== exceptMenu) {
                menu.classList.remove('is-open');
                const toggle = menu.querySelector('.nav-menu-dropdown-toggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    function attachNavDropdowns(navMenu) {
        navMenu.querySelectorAll('.nav-menu-dropdown-toggle').forEach(function(toggle) {
            toggle.addEventListener('click', function(event) {
                event.stopPropagation();
                const menu = toggle.closest('.nav-menu-dropdown');
                if (!menu) {
                    return;
                }

                const isOpen = menu.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                closeNavDropdowns(menu);
            });
        });

        navMenu.querySelectorAll('.nav-menu-dropdown').forEach(function(menu) {
            menu.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    menu.classList.remove('is-open');
                    const toggle = menu.querySelector('.nav-menu-dropdown-toggle');
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.focus();
                    }
                }
            });
        });
    }

    function normalizeOrderMenu(prefix, currentFile) {
        const navMenu = document.querySelector('.navbar .nav-menu');
        if (!navMenu) {
            return;
        }

        const activeKey = getActiveKey(currentFile);
        navMenu.classList.add('care-guide-order-menu');
        navMenu.innerHTML = ORDER_TABS.map(tab => buildMenuTab(tab, prefix, activeKey)).join('');
        attachNavDropdowns(navMenu);
    }

    function normalizeHeaderLayout(prefix, currentFile) {
        const navbar = document.querySelector('.navbar');
        const navbarContainer = document.querySelector('.navbar .container');
        if (!navbar || !navbarContainer) {
            return;
        }

        navbar.classList.remove('economy-simple-nav');
        navbarContainer.querySelectorAll(':scope > .economy-nav-pay').forEach(function(button) {
            button.remove();
        });

        let navMiddle = navbarContainer.querySelector(':scope > .nav-middle');
        if (!navMiddle) {
            navMiddle = document.createElement('div');
            navMiddle.className = 'nav-middle';
            navbarContainer.insertAdjacentElement('afterbegin', navMiddle);
        }

        let navIdentity = navMiddle.querySelector('.nav-identity');
        if (!navIdentity) {
            navIdentity = document.createElement('div');
            navIdentity.className = 'nav-identity';
            navMiddle.insertAdjacentElement('afterbegin', navIdentity);
        }

        const existingBrand = navbarContainer.querySelector('.nav-brand');
        if (existingBrand && !navIdentity.contains(existingBrand)) {
            navIdentity.insertAdjacentElement('afterbegin', existingBrand);
        }

        let navBrand = navIdentity.querySelector('.nav-brand');
        if (!navBrand) {
            navBrand = document.createElement('div');
            navBrand.className = 'nav-brand';
            navIdentity.insertAdjacentElement('afterbegin', navBrand);
        }
        navBrand.innerHTML = `<img src="${prefix}logo.svg" alt="Comfort Care Logo" class="logo-image">`;

        let navTitle = navIdentity.querySelector('.nav-title');
        if (!navTitle) {
            navTitle = document.createElement('div');
            navTitle.className = 'nav-title';
            navIdentity.appendChild(navTitle);
        }
        navTitle.textContent = 'Comfort Care';

        let navMenu = navbarContainer.querySelector('.nav-menu');
        if (!navMenu) {
            navMenu = document.createElement('ul');
            navMenu.className = 'nav-menu';
        }
        if (!navMiddle.contains(navMenu)) {
            navMiddle.appendChild(navMenu);
        }

        let navCart = navbarContainer.querySelector(':scope > .nav-cart');
        const isOrderPage = currentFile === 'order.html';
        if (!isOrderPage) {
            if (navCart) {
                navCart.remove();
            }
            return;
        }

        if (!navCart) {
            navCart = document.createElement('div');
            navCart.className = 'nav-cart';
            navbarContainer.appendChild(navCart);
        }
        navCart.innerHTML = `
            <div class="cart-box" aria-live="polite">
                <span class="cart-box-title">Cart</span>
                <span class="cart-box-detail">
                    <span id="headerCartCount">0 items</span>
                    <span class="cart-box-sep">|</span>
                    <span id="headerCartTotal">$0.00</span>
                </span>
            </div>
            <div class="nav-cart-main">
                <a href="${prefix}pricing.html" class="btn btn-secondary btn-compact edit-cart-link">Edit Cart</a>
                <a href="${prefix}payment.html" class="btn btn-primary btn-compact">Pay</a>
                <a href="mailto:admin@comcare.store?cc=accentGV%40gmail.com" class="btn btn-discount btn-mini" id="cartEmailLink">Email Cart</a>
            </div>
        `;

        if (typeof window.updateHeaderCart === 'function') {
            window.updateHeaderCart();
        }
        if (typeof window.updateCartEmailLink === 'function') {
            window.updateCartEmailLink();
        }
    }

    function createEquipmentCollage(prefix) {
        const box = document.createElement('div');
        box.className = 'site-equipment-collage';

        const stamps = EQUIPMENT_COLLAGE_ITEMS.map(src => `
            <img src="${prefix}${src}" alt="" aria-hidden="true" loading="eager">
        `).join('');

        box.innerHTML = `
            <a href="${prefix}services.html" class="site-equipment-collage-link" aria-label="Browse Comfort Care medical equipment rentals">
                ${stamps}
            </a>
        `;

        return box;
    }

    function ensureEquipmentCollage(prefix) {
        const navbarContainer = document.querySelector('.navbar .container');
        if (!navbarContainer || navbarContainer.querySelector('.site-equipment-collage')) {
            return;
        }

        navbarContainer.insertAdjacentElement('afterbegin', createEquipmentCollage(prefix));
    }

    function ensureUniversalHomeButton(prefix, currentFile) {
        if (document.querySelector('.universal-home-return')) {
            return;
        }

        const returnMenu = document.createElement('div');
        returnMenu.className = 'universal-home-return';
        returnMenu.innerHTML = `
            <button type="button" class="universal-home-toggle" aria-expanded="false">
                Return Menu
            </button>
            <div class="universal-home-panel" role="menu" aria-label="Return options">
                <button type="button" class="universal-previous-page" role="menuitem">Previous Page</button>
                <a href="${prefix}home.html" role="menuitem">Comfort Care Home Page</a>
                <a href="https://hub.comcare.store/" role="menuitem">Hub Home</a>
            </div>
        `;

        const toggle = returnMenu.querySelector('.universal-home-toggle');
        const previousPage = returnMenu.querySelector('.universal-previous-page');
        toggle.addEventListener('click', function(event) {
            event.stopPropagation();
            const isOpen = returnMenu.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        previousPage.addEventListener('click', function() {
            if (window.history.length > 1) {
                window.history.back();
                return;
            }

            window.location.href = `${prefix}home.html`;
        });

        returnMenu.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                returnMenu.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.focus();
            }
        });

        document.addEventListener('click', function(event) {
            if (!returnMenu.contains(event.target)) {
                returnMenu.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        const navMenu = document.querySelector('.navbar .nav-menu');
        const navbarContainer = document.querySelector('.navbar .container');
        if (navMenu) {
            navMenu.insertAdjacentElement('beforeend', returnMenu);
        } else if (navbarContainer) {
            navbarContainer.insertAdjacentElement('beforeend', returnMenu);
        } else if (document.querySelector('.navbar')) {
            document.querySelector('.navbar').insertAdjacentElement('beforeend', returnMenu);
        } else {
            document.body.insertAdjacentElement('afterbegin', returnMenu);
        }
        document.body.classList.add('has-universal-home-button');
    }

    function isVisibleElement(element) {
        if (!element) {
            return false;
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none'
            && style.visibility !== 'hidden'
            && style.opacity !== '0'
            && rect.width > 0
            && rect.height > 0;
    }

    function updateReturnMenuForCartOverlay() {
        const cartOverlay = document.querySelector('#floatingCart, .floating-cart');
        const isOpen = isVisibleElement(cartOverlay);
        document.body.classList.toggle('cart-overlay-open', isOpen);
    }

    function watchCartOverlay() {
        updateReturnMenuForCartOverlay();

        const cartOverlay = document.querySelector('#floatingCart, .floating-cart');
        if (cartOverlay) {
            const observer = new MutationObserver(updateReturnMenuForCartOverlay);
            observer.observe(cartOverlay, {
                attributes: true,
                attributeFilter: ['class', 'style', 'hidden']
            });
        }

        const bodyObserver = new MutationObserver(updateReturnMenuForCartOverlay);
        bodyObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });

        document.addEventListener('click', function() {
            window.setTimeout(updateReturnMenuForCartOverlay, 60);
        });
        window.addEventListener('resize', updateReturnMenuForCartOverlay);
    }

    function createSideNav(prefix) {
        const nav = document.createElement('nav');
        nav.className = 'care-guide-side-nav';
        nav.id = 'site-guide-nav';
        nav.setAttribute('aria-label', 'Recovery resources');
        nav.setAttribute('tabindex', '0');

        const items = GUIDE_ITEMS.map(item => `
            <a href="${prefix}${item.href}" class="care-guide-side-item">
                <span class="care-guide-side-title">${item.title}</span>
                <span class="care-guide-side-detail">${item.detail}</span>
            </a>
        `).join('');

        nav.innerHTML = `<p class="care-guide-side-heading">Resources</p>${items}`;
        return nav;
    }

    function ensureSideNav(prefix) {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            return null;
        }

        const existing = document.querySelector('.care-guide-side-nav');
        if (existing) {
            return existing;
        }

        const sideNav = createSideNav(prefix);
        navbar.insertAdjacentElement('afterend', sideNav);
        return sideNav;
    }

    function updateSideNavOffset() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            return;
        }

        const offset = Math.max(96, Math.round(navbar.getBoundingClientRect().bottom + 12));
        document.documentElement.style.setProperty('--site-guide-offset', `${offset}px`);
    }

    function getSafeHubReturn(rawReturn) {
        if (!rawReturn) {
            return 'https://hub.comcare.store/';
        }

        try {
            const url = new URL(rawReturn, window.location.href);
            if (url.hostname === 'hub.comcare.store') {
                return url.href;
            }
        } catch (error) {
            return 'https://hub.comcare.store/';
        }

        return 'https://hub.comcare.store/';
    }

    function initRecoveryHubBridge() {
        const params = new URLSearchParams(window.location.search);
        const cameFromHub = params.get('from') === 'hub';
        const requestedReturn = getSafeHubReturn(params.get('hubReturn'));
        const storageKey = 'comcareHubReturnUrl';

        if (cameFromHub || params.has('hubReturn')) {
            try {
                window.sessionStorage.setItem(storageKey, requestedReturn);
            } catch (error) {
                // Session storage is optional; the visible link still works on this page.
            }
        }

        let hubReturnUrl = requestedReturn;
        try {
            hubReturnUrl = window.sessionStorage.getItem(storageKey) || hubReturnUrl;
        } catch (error) {
            hubReturnUrl = requestedReturn;
        }

        if (!cameFromHub && !params.has('hubReturn')) {
            try {
                if (!window.sessionStorage.getItem(storageKey)) {
                    return;
                }
            } catch (error) {
                return;
            }
        }

        if (document.querySelector('.hub-return-bridge')) {
            return;
        }

        const bridge = document.createElement('aside');
        bridge.className = 'hub-return-bridge';
        bridge.setAttribute('aria-label', 'ComCare Recovery Hub return');
        bridge.innerHTML = `
            <div>
                <strong>ComCare Recovery Hub</strong>
                <span>Continue shopping, then return to your care circle.</span>
            </div>
            <a href="${hubReturnUrl}">Back to Hub</a>
            <button type="button" aria-label="Hide Recovery Hub return">×</button>
        `;

        const closeButton = bridge.querySelector('button');
        closeButton.addEventListener('click', function() {
            bridge.remove();
        });

        document.body.appendChild(bridge);
        document.body.classList.add('has-hub-return-bridge');
    }

    function getSectionScrollOffset() {
        const navbar = document.querySelector('.navbar');
        const height = navbar ? navbar.getBoundingClientRect().height : 0;
        return Math.ceil(height + 28);
    }

    function scrollToSectionWithOffset(target) {
        if (!target) {
            return;
        }

        const top = target.getBoundingClientRect().top + window.scrollY - getSectionScrollOffset();
        window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth'
        });
    }

    function initSectionAnchorOffset() {
        document.querySelectorAll('a[href^="#"]').forEach(function(link) {
            const rawHash = link.getAttribute('href');
            if (!rawHash || rawHash === '#') {
                return;
            }

            link.addEventListener('click', function(event) {
                const targetId = decodeURIComponent(rawHash.slice(1));
                const target = document.getElementById(targetId);
                if (!target) {
                    return;
                }

                event.preventDefault();
                closeNavDropdowns();
                history.pushState(null, '', rawHash);
                scrollToSectionWithOffset(target);
            });
        });

        if (window.location.hash) {
            window.setTimeout(function() {
                const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
                scrollToSectionWithOffset(target);
            }, 100);
        }
    }

    function initMobileAutoHideHeader() {
        const navbar = document.querySelector('.navbar');
        if (!navbar || navbar.dataset.mobileAutoHideBound === 'true') {
            return;
        }

        navbar.dataset.mobileAutoHideBound = 'true';
        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateHeaderVisibility() {
            const isMobile = window.matchMedia('(max-width: 1180px)').matches;
            const currentScrollY = window.scrollY;

            if (!isMobile) {
                navbar.classList.remove('mobile-header-hidden');
                document.body.classList.remove('mobile-header-is-hidden');
                lastScrollY = currentScrollY;
                ticking = false;
                return;
            }

            const scrollingDown = currentScrollY > lastScrollY + 8;
            const scrollingUp = currentScrollY < lastScrollY - 8;
            const nearTop = currentScrollY < 80;
            const menuOpen = Boolean(navbar.querySelector('.nav-menu-dropdown.is-open, .universal-home-return.is-open'));

            if (!nearTop && scrollingDown && !menuOpen) {
                navbar.classList.add('mobile-header-hidden');
                document.body.classList.add('mobile-header-is-hidden');
            } else if (scrollingUp || nearTop || menuOpen) {
                navbar.classList.remove('mobile-header-hidden');
                document.body.classList.remove('mobile-header-is-hidden');
            }

            lastScrollY = currentScrollY;
            ticking = false;
        }

        function requestHeaderUpdate() {
            if (!ticking) {
                window.requestAnimationFrame(updateHeaderVisibility);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
        window.addEventListener('resize', requestHeaderUpdate);
        document.addEventListener('click', function() {
            window.setTimeout(requestHeaderUpdate, 80);
        });
        requestHeaderUpdate();
    }

    function initSiteNavigation() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            return;
        }

        const prefix = getPathPrefix();
        const currentFile = getCurrentFile();
        document.body.classList.add('site-guide-nav-page');

        normalizeHeaderLayout(prefix, currentFile);
        ensureEquipmentCollage(prefix);
        normalizeOrderMenu(prefix, currentFile);
        ensureUniversalHomeButton(prefix, currentFile);
        watchCartOverlay();
        initSectionAnchorOffset();
        initMobileAutoHideHeader();

        document.addEventListener('click', function(event) {
            closeNavDropdowns(event.target.closest('.nav-menu-dropdown'));
        });

        initRecoveryHubBridge();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteNavigation);
    } else {
        initSiteNavigation();
    }
})();
