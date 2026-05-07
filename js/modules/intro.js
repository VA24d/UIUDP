/**
 * Intro module — renders the opening context screen.
 * See design.md "Stage-specific designs — Intro_Screen" and requirements Req 3.
 */

export const RESEARCH_GOAL =
    'Understanding how users will interact with autonomous cars and what makes them more likely to adopt them — with the goal of increasing trust in the system.';

export function makeIntroStep({ controller }) {
    const HERO_ALT = 'AeroDrive hero illustration — three-quarter view';

    function renderTablet(host) {
        host.innerHTML = `
            <div class="tablet-step intro-root">
                <div class="intro-hero" data-alt="${HERO_ALT}">
                    <img
                        src="assets/hero-aerodrive.svg"
                        alt="${HERO_ALT}"
                        data-role="hero-img"
                    />
                </div>
                <div class="intro-body">
                    <p class="t-caption step-meta">AeroDrive · Delivered today</p>
                    <h1 class="t-display">Welcome to your AeroDrive.</h1>
                    <p class="t-subhead">${RESEARCH_GOAL}</p>
                    <div class="step-actions">
                        <button type="button" role="button" class="btn btn-primary" data-cta="begin-onboarding">
                            Begin onboarding
                        </button>
                        <span class="trust-moment">Transparency from minute one</span>
                    </div>
                </div>
            </div>
        `;

        const heroBox = host.querySelector('.intro-hero');
        const heroImg = host.querySelector('[data-role="hero-img"]');
        if (heroImg) {
            heroImg.addEventListener('error', () => {
                heroBox.classList.add('hero--missing');
                // Remove the broken image so the ::after alt text is legible.
                heroImg.remove();
            }, { once: true });
        }
        host.querySelector('[data-cta="begin-onboarding"]').addEventListener('click', () =>
            controller.advance('intro-cta')
        );
    }

    function renderCluster(host) {
        host.innerHTML = `
            <div class="cluster-title">
                <span class="t-caption cluster-context">AeroDrive · Ready</span>
                <span class="cluster-autonomy">STATIONARY</span>
            </div>
            <div class="cluster-speed" aria-label="Vehicle speed zero">0</div>
            <p class="t-caption cluster-context">Parked · waiting for driver</p>
        `;
    }

    return {
        id: 'intro.welcome',
        stage: 'intro',
        slug: 'welcome',
        label: 'Welcome',
        title: 'Welcome to your AeroDrive',
        trustMoments: [
            { id: 'intro.welcome.transparency', text: 'Transparency from minute one' },
        ],
        renderCluster,
        renderTablet,
    };
}
