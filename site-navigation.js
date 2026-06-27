(function() {
    const ORDER_TABS = [
        { label: 'Home', href: 'home.html', key: 'home' },
        { label: 'Rentals', href: 'services.html', key: 'rentals', type: 'rentals' },
        { label: 'Order', href: 'order.html', key: 'order' },
        { label: 'Cart', href: 'pricing.html', key: 'cart' },
        { label: 'Register', key: 'register', type: 'register' }
    ];

    const RENTAL_MENU_ITEMS = [
        { label: 'Bed Offer', href: 'index.html' },
        { label: 'All Rentals', href: 'services.html' },
        { label: 'Hospital Beds', href: 'medical-equipment-rental-atlanta.html' },
        { label: 'Wheelchairs', href: 'wheelchair-rental-atlanta.html' },
        { label: 'Walkers', href: 'walker-rental-atlanta.html' },
        { label: 'Knee Scooters', href: 'knee-scooter-rental-atlanta.html' }
    ];

    const GUIDE_ITEMS = [
        {
            title: 'Choose Need',
            href: 'care-guide.html#choose-path',
            detail: "Start with the visitor's situation and send them to the right action."
        },
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

    const REGISTER_ITEMS = [
        { label: 'Provider', href: 'join-professionals.html' },
        { label: 'Nurse / Technician', href: 'join-professionals.html?role=nurse-technician#professionalForm' }
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
        return file || 'index.html';
    }

    function getActiveKey(file) {
        if (file === 'home.html' || file === 'care-guide.html') {
            return 'home';
        }

        if (file === 'order.html') {
            return 'order';
        }

        if (file === 'cart.html' || file === 'mylist.html' || file === 'pricing.html') {
            return 'cart';
        }

        if (['payment.html', 'payment-button.html', 'checkout.html', 'success.html', 'thank-you.html'].includes(file)) {
            return 'cart';
        }

        if (file === 'join-professionals.html') {
            return 'register';
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
            return 'rentals';
        }

        return '';
    }

    function createDropdownItems(prefix, items) {
        return items.map(item => `
            <a href="${prefix}${item.href}" class="nav-menu-dropdown-option" role="menuitem">${item.label}</a>
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

        if (tab.type === 'register') {
            return `
                <li class="nav-menu-dropdown nav-register-menu${activeClass ? ' is-active' : ''}">
                    <button type="button" class="nav-menu-button nav-menu-dropdown-toggle nav-register-nav-toggle${activeClass}" aria-expanded="false" aria-haspopup="true">
                        ${tab.label}
                    </button>
                    <div class="nav-menu-dropdown-panel" role="menu" aria-label="Register options">
                        ${createDropdownItems(prefix, REGISTER_ITEMS)}
                    </div>
                </li>
            `;
        }

        return `<li><a href="${prefix}${tab.href}"${activeClass ? ' class="active"' : ''}>${tab.label}</a></li>`;
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

    function createSideNav(prefix) {
        const nav = document.createElement('nav');
        nav.className = 'care-guide-side-nav';
        nav.id = 'site-guide-nav';
        nav.setAttribute('aria-label', 'Care guide sections');
        nav.setAttribute('tabindex', '0');

        const items = GUIDE_ITEMS.map(item => `
            <a href="${prefix}${item.href}" class="care-guide-side-item">
                <span class="care-guide-side-title">${item.title}</span>
                <span class="care-guide-side-detail">${item.detail}</span>
            </a>
        `).join('');

        nav.innerHTML = `<p class="care-guide-side-heading">Guide Sections</p>${items}`;
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

    function initSiteNavigation() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            return;
        }

        const prefix = getPathPrefix();
        const currentFile = getCurrentFile();
        document.body.classList.add('site-guide-nav-page');

        ensureEquipmentCollage(prefix);
        normalizeOrderMenu(prefix, currentFile);
        ensureSideNav(prefix);
        updateSideNavOffset();

        document.addEventListener('click', function(event) {
            closeNavDropdowns(event.target.closest('.nav-menu-dropdown'));
        });

        window.addEventListener('resize', updateSideNavOffset);
        window.addEventListener('load', updateSideNavOffset);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteNavigation);
    } else {
        initSiteNavigation();
    }
})();
