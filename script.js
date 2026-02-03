
class RabbitHole {
    constructor() {
        this.titleEl = document.getElementById('title');
        this.extractEl = document.getElementById('extract');
        this.metaEl = document.getElementById('meta');
        this.errorEl = document.getElementById('error');
        this.progressBar = document.getElementById('progress-bar');
        this.card = document.getElementById('card');
        this.enterBtn = document.getElementById('enter');
        this.currentTitle = null;
        this.outgoingLinks = [];
        this.started = false;
        this.startX = null;
        this.history = [];
        this.currentIndex = -1;
        this.insights = [];
        this.swipeCount = 0;
        this.analytics = {
totalArticles: 0,
            totalTime: 0,
            categories: {},
            startTime: Date.now()
        };
        this.welcomeSteps = [
            {
                title: "Welcome to DondlingerGC's RabbitHole",
                extract: "Swipe to continue the introduction...",
                meta: "🐇 Enter the Rabbit Hole"
            },
            {
                title: "The Only Truly Random Online Information",
                extract: "Experience the internet's most unpredictable journey through knowledge",
                meta: "🎲 Pure Randomness"
            },
            {
                title: "Swipe Right → Follow Related Articles",
                extract: "Dive deeper into connected topics and discover meaningful connections",
                meta: "🔗 Connected Knowledge"
            },
            {
                title: "Swipe Left ← Jump to Random Articles",
                extract: "Explore completely unexpected topics and broaden your horizons",
                meta: "🌍 Unexpected Discoveries"
            },
            {
                title: "Ready to Explore?",
                extract: "Begin your journey through the infinite knowledge universe",
                meta: "🚀 Start Your Adventure"
            }
        ];
        this.currentStep = 0;
this.init();
    }
    init() {
        this.createParticles();
        this.bindEvents();
        this.startAnalytics();
        this.startWelcomeSequence();
    }
createParticles() {
        const container = document.getElementById('particles');
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = Math.random() * 4 + 1 + 'px';
            particle.style.height = particle.style.width;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
            container.appendChild(particle);
        }
    }
    bindEvents() {
        this.enterBtn.addEventListener('click', () => this.startExperience());
        document.getElementById('arrow-right').addEventListener('click', () => this.handleArrowRight());
        document.getElementById('arrow-left').addEventListener('click', () => this.handleArrowLeft());

        // Enhanced touch handling for welcome sequence
        document.addEventListener('touchstart', e => {
            this.startX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            if (this.startX === null) return;
            const dx = e.changedTouches[0].clientX - this.startX;
            this.startX = null;

            if (!this.started) {
                // Handle welcome sequence swipes
                if (Math.abs(dx) > 60) {
                    this.nextWelcomeStep();
                }
                return;
            }
            
            if (dx < -60) {
                this.swipeCount++;
                this.fetchLinkedArticle();
            }
            if (dx > 60) {
                this.swipeCount++;
                this.fetchRandomArticle();
            }
        });

        // Keyboard navigation for welcome sequence
        document.addEventListener('keydown', e => {
            if (!this.started && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                this.nextWelcomeStep();
                return;
            }
            if (!this.started) return;
            if (e.key === 'ArrowLeft') this.fetchLinkedArticle();
            if (e.key === 'ArrowRight') this.fetchRandomArticle();
        });
    }

    showAuthModal() {
        // Removed auth modal functionality
    }
animateEntrance() {
        setTimeout(() => {
            this.card.classList.add('fade-in');
        }, 100);
    }

    showError(msg) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.add('fade-in');
        setTimeout(() => {
            this.errorEl.classList.remove('fade-in');
        }, 3000);
    }

    clearError() {
        this.errorEl.textContent = '';
    }
    async fetchRandomArticle() {
        try {
            // Check if we should show ad
            if (this.swipeCount > 0 && this.swipeCount % 5 === 0) {
                await this.showAdvertisement();
            }
            
            this.setLoading(true);
            this.clearError();
            // Show rabbit animation every 5 swipes
            if (this.swipeCount % 5 === 0) {
                this.showRabbitAnimation();
            }
const res = await fetch(
                'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=random&grnnamespace=0&prop=extracts|description|info&exintro=1&explaintext=1&inprop=url'
            );
            const data = await res.json();
            const pages = data.query.pages;
            const page = pages[Object.keys(pages)[0]];
            await this.loadArticleFromActionAPI(page);
            this.addToHistory(page);
            setTimeout(() => this.animateContent('slide-in-left'), 100);
        } catch (e) {
            this.showError('Connection unstable. Try again.');
        } finally {
            this.setLoading(false);
        }
    }
    async fetchLinkedArticle() {
        if (!this.outgoingLinks.length) return this.fetchRandomArticle();
        const next = this.outgoingLinks[Math.floor(Math.random() * this.outgoingLinks.length)];
        try {
            // Check if we should show ad
            if (this.swipeCount > 0 && this.swipeCount % 5 === 0) {
                await this.showAdvertisement();
            }
            
            this.setLoading(true);
            this.clearError();
            // Show rabbit animation every 5 swipes
            if (this.swipeCount % 5 === 0) {
                this.showRabbitAnimation();
            }
const res = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(next)}&prop=extracts|description|info&exintro=1&explaintext=1&inprop=url`
            );
            const data = await res.json();
            const pages = data.query.pages;
            const page = pages[Object.keys(pages)[0]];
            await this.loadArticleFromActionAPI(page);
            this.addToHistory(page);
            setTimeout(() => this.animateContent('slide-in-right'), 100);
        } catch (e) {
            this.showError('Failed to follow link. Try again.');
        } finally {
            this.setLoading(false);
        }
    }
async fetchLinks(title) {
        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=links&pllimit=50&titles=${encodeURIComponent(title)}`;
            const res = await fetch(url);
            const data = await res.json();
            const pages = data.query.pages;
            const page = pages[Object.keys(pages)[0]];
            if (!page.links) return [];
            return page.links.map(l => l.title).filter(t => !t.includes(':'));
        } catch {
            return [];
        }
    }
    async loadArticleFromActionAPI(page) {
        this.currentTitle = page.title;
        this.titleEl.textContent = page.title;
        this.extractEl.textContent = page.extract || 'No summary available.';
        
        // Generate AI-powered insights
        await this.generateInsights(page);
        
        // Update meta tags with clean, accurate data
        const linkCount = this.outgoingLinks.length;
        this.metaEl.innerHTML = `
            <span class="meta-tag">📚 ${page.description || 'Wikipedia Article'}</span>
            <span class="meta-tag">🔗 ${linkCount} Connections</span>
            ${this.insights.length > 0 ? `<span class="meta-tag">🧠 ${this.insights.length} Insights</span>` : ''}
        `;
        
        // Set dynamic background based on content
        this.setContentBackground(page);
        
        this.outgoingLinks = await this.fetchLinks(this.currentTitle);
        this.updateProgress();
        this.saveToHistory(page);
        this.trackAnalytics(page);
    }
addToHistory(page) {
        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push(page);
        this.currentIndex = this.history.length - 1;
    }

    saveToHistory(page) {
        const historyItem = {
            title: page.title,
            extract: page.extract?.substring(0, 200) + '...',
            url: page.fullurl,
            timestamp: Date.now(),
            insights: this.insights
        };
        
        let history = JSON.parse(localStorage.getItem('quantum_journey_history') || '[]');
        history.unshift(historyItem);
        history = history.slice(0, 100); // Keep last 100 items
        localStorage.setItem('quantum_journey_history', JSON.stringify(history));
    }
updateProgress() {
        const progress = ((this.currentIndex + 1) / Math.max(this.history.length, 1)) * 100;
        this.progressBar.style.width = progress + '%';
    }

    setLoading(loading) {
        if (loading) {
            this.card.classList.add('loading');
        } else {
            this.card.classList.remove('loading');
        }
    }
    animateContent(animationClass) {
        // Create transition overlay
        let overlay = document.querySelector('.transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'transition-overlay';
            document.body.appendChild(overlay);
        }
        
        // Start transition
        overlay.classList.add('active');
        this.card.classList.add('transitioning');
        
        // Remove previous animations
        this.card.classList.remove('slide-in-left', 'slide-in-right');
        
        // Add new animation after a small delay
        setTimeout(() => {
            this.card.classList.add(animationClass);
            
            // Clean up after animation completes
            setTimeout(() => {
                this.card.classList.remove('transitioning');
                overlay.classList.remove('active');
                this.card.classList.remove('slide-in-left', 'slide-in-right');
            }, 600);
        }, 50);
    }
    startWelcomeSequence() {
        // Hide rabbit animation after GIF duration
        const rabbitAnimation = document.getElementById('rabbit-animation');
        // Set timeout for GIF duration (6 seconds) then reveal the card once
        setTimeout(() => {
            if (rabbitAnimation) rabbitAnimation.style.display = 'none';
            this.card.style.display = 'flex';
            this.showWelcomeStep(0);
        }, 6000);
}
showWelcomeStep(stepIndex) {
        this.currentStep = stepIndex;
        const step = this.welcomeSteps[stepIndex];
        
        this.titleEl.textContent = step.title;
        this.extractEl.textContent = step.extract;
        this.metaEl.innerHTML = `<span class="meta-tag">${step.meta}</span>`;
        
        // Show start button on last step
        if (stepIndex === this.welcomeSteps.length - 1) {
            this.enterBtn.style.display = 'block';
        } else {
            this.enterBtn.style.display = 'none';
        }
        
        this.animateContent('slide-in-left');
    }

    nextWelcomeStep() {
        if (this.currentStep < this.welcomeSteps.length - 1) {
            this.showWelcomeStep(this.currentStep + 1);
        }
    }
    startExperience() {
        if (this.started) return;
        this.started = true;
        this.card.setAttribute('data-state', 'exploring');
        this.fetchRandomArticle();
    }
showRabbitAnimation() {
        const rabbitAnim = document.getElementById('rabbit-animation');
        if (!rabbitAnim) return;

        rabbitAnim.style.display = 'flex';

        // Try to find a video element inside the animation container (if present)
        const video = rabbitAnim.querySelector('video');
        if (video) {
            video.addEventListener('ended', () => {
                rabbitAnim.style.display = 'none';
                try { video.currentTime = 0; } catch (e) {}
            }, { once: true });
        }

        // Hide the animation after GIF/video duration (safe fallback)
        setTimeout(() => {
            rabbitAnim.style.display = 'none';
            if (video) {
                try { video.currentTime = 0; } catch (e) {}
            }
        }, 6000);
}
    handleArrowRight() {
        if (!this.started) this.startExperience();
        else {
            this.swipeCount++;
            this.fetchRandomArticle();
        }
    }

    handleArrowLeft() {
        if (this.started) {
            this.swipeCount++;
            this.fetchLinkedArticle();
        }
    }
shareExperience() {
        if (navigator.share) {
            navigator.share({
                title: 'QuantumRabbitHole Explorer',
                text: `Exploring "${this.currentTitle || 'the quantum universe'}" on QuantumRabbitHole`,
                url: window.location.href
            }).catch(() => {
                this.copyToClipboard();
            });
        } else {
            this.copyToClipboard();
        }
    }
    copyToClipboard() {
        const text = `Exploring "${this.currentTitle || 'the quantum universe'}" on QuantumRabbitHole: ${window.location.href}`;
        navigator.clipboard.writeText(text).then(() => {
            this.showError('Link copied to clipboard!');
        });
    }
    loadUser() {
        // Removed user loading functionality
    }
async generateInsights(page) {
        // Clean, meaningful insights based on actual content
        this.insights = [];
        
        if (page.extract) {
            const text = page.extract.toLowerCase();
            
            if (text.includes('quantum') || text.includes('physics') || text.includes('science')) {
                this.insights.push('🔬 Scientific content - explore related scientific concepts');
            }
            
            if (text.includes('technology') || text.includes('computer') || text.includes('digital')) {
                this.insights.push('💻 Technology focus - discover technological advancements');
            }
            
            if (text.includes('history') || text.includes('historical') || text.includes('ancient')) {
                this.insights.push('📜 Historical context - explore historical timelines');
            }
            
            if (text.includes('art') || text.includes('music') || text.includes('culture')) {
                this.insights.push('🎨 Cultural significance - discover artistic connections');
            }
            
            if (text.includes('nature') || text.includes('environment') || text.includes('earth')) {
                this.insights.push('🌿 Natural world - explore environmental topics');
            }
        }
    }

    async showAdvertisement() {
        return new Promise((resolve) => {
            const adOverlay = document.createElement('div');
            adOverlay.className = 'ad-overlay';
            adOverlay.innerHTML = `
                <div class="ad-content">
                    <div class="ad-header">
                        <span class="ad-badge">Sponsored</span>
                        <button class="ad-close">&times;</button>
                    </div>
                    <div class="ad-body">
                        <img src="https://static.photos/technology/320x240/42" alt="Advertisement" class="ad-image">
                        <h3 class="ad-title">Discover More with Quantum Explorer</h3>
                        <p class="ad-description">Unlock premium features and ad-free experience with our Pro plan!</p>
                        <button class="ad-cta">Learn More</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(adOverlay);
            
            const closeAd = () => {
                adOverlay.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(adOverlay);
                    resolve();
                }, 300);
            };
            
            adOverlay.querySelector('.ad-close').addEventListener('click', closeAd);
            adOverlay.querySelector('.ad-cta').addEventListener('click', () => {
                window.open('https://example.com/pro-plan', '_blank');
                closeAd();
            });
            
            // Auto-close after 5 seconds
            setTimeout(closeAd, 5000);
        });
    }
setContentBackground(page) {
        const text = page.extract?.toLowerCase() || '';
        const card = document.getElementById('card');
        
        // Remove previous background classes
        card.classList.remove('bg-science', 'bg-history', 'bg-art', 'bg-technology', 'bg-nature', 'bg-default');
        
        // Set appropriate background based on content
        if (text.includes('science') || text.includes('physics') || text.includes('chemistry')) {
            card.classList.add('bg-science');
        } else if (text.includes('history') || text.includes('historical') || text.includes('war')) {
            card.classList.add('bg-history');
        } else if (text.includes('art') || text.includes('music') || text.includes('culture')) {
            card.classList.add('bg-art');
        } else if (text.includes('technology') || text.includes('computer') || text.includes('digital')) {
            card.classList.add('bg-technology');
        } else if (text.includes('nature') || text.includes('environment') || text.includes('earth')) {
            card.classList.add('bg-nature');
        } else {
            card.classList.add('bg-default');
        }
    }

    trackAnalytics(page) {
        this.analytics.totalArticles++;
        
        // Track categories based on content
        const text = page.extract?.toLowerCase() || '';
        if (text.includes('science') || text.includes('physics') || text.includes('chemistry')) {
            this.analytics.categories.science = (this.analytics.categories.science || 0) + 1;
        } else if (text.includes('history') || text.includes('historical') || text.includes('war')) {
            this.analytics.categories.history = (this.analytics.categories.history || 0) + 1;
        } else if (text.includes('art') || text.includes('music') || text.includes('culture')) {
            this.analytics.categories.arts = (this.analytics.categories.arts || 0) + 1;
        } else if (text.includes('technology') || text.includes('computer') || text.includes('digital')) {
            this.analytics.categories.technology = (this.analytics.categories.technology || 0) + 1;
        } else if (text.includes('nature') || text.includes('environment') || text.includes('earth')) {
            this.analytics.categories.nature = (this.analytics.categories.nature || 0) + 1;
        } else {
            this.analytics.categories.other = (this.analytics.categories.other || 0) + 1;
        }
        
        localStorage.setItem('quantum_analytics', JSON.stringify(this.analytics));
    }
startAnalytics() {
        this.analytics.startTime = Date.now();
        setInterval(() => {
            this.analytics.totalTime += 1;
        }, 1000);
    }

    getStats() {
        return {
            totalArticles: this.analytics.totalArticles,
            totalTime: this.analytics.totalTime,
            categories: this.analytics.categories,
            averageTimePerArticle: this.analytics.totalArticles > 0 ? 
                Math.round(this.analytics.totalTime / this.analytics.totalArticles) : 0
        };
    }
}
        // Enhanced event handling for new components
document.addEventListener('DOMContentLoaded', () => {
    const quantumApp = new RabbitHole();
    // Handle user profile events
    document.addEventListener('show-history', () => {
        const historyModal = document.createElement('history-modal');
        document.body.appendChild(historyModal);
        historyModal.show();
        historyModal.addEventListener('load-article', (e) => {
            quantumApp.loadArticleFromActionAPI(e.detail);
        });
    });
    
    document.addEventListener('show-stats', () => {
        const stats = quantumApp.getStats();
        quantumApp.showError(`Stats: ${stats.totalArticles} articles, ${Math.round(stats.totalTime/60)} minutes explored`);
    });
});
// Initialize the rabbit hole experience
// (initialization handled above to avoid creating multiple instances)
