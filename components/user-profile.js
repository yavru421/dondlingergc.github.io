
class UserProfile extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .profile-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 100;
        }
        .profile-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--rabbithole-accent);
          border: none;
          color: white;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s var(--rabbithole-easing);
        }
        
        .profile-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px var(--rabbithole-glow);
        }
        
        .profile-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 2px solid var(--rabbithole-accent);
          border-radius: 0.75rem;
          padding: 1rem;
          margin-top: 0.5rem;
          min-width: 200px;
          display: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
.profile-menu.show {
          display: block;
          animation: slideDown 0.3s var(--quantum-easing);
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .menu-item {
          display: block;
          width: 100%;
          padding: 0.75rem;
          border: none;
          background: transparent;
          color: var(--rabbithole-fg);
          text-align: left;
          cursor: pointer;
          border-radius: 0.5rem;
          transition: background 0.3s;
        }
        
        .menu-item:hover {
          background: rgba(59, 130, 246, 0.1);
        }
</style>
      
      <div class="profile-container">
        <button class="profile-btn" id="profile-toggle">
          ☰
        </button>
        
        <div class="profile-menu" id="profile-menu">
          <button class="menu-item" id="view-history">Journey History</button>
          <button class="menu-item" id="view-stats">Quantum Stats</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const toggleBtn = this.shadowRoot.getElementById('profile-toggle');
    const menu = this.shadowRoot.getElementById('profile-menu');
    
    toggleBtn.addEventListener('click', () => {
      menu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
        menu.classList.remove('show');
      }
    });

    this.shadowRoot.getElementById('view-history').addEventListener('click', () => this.viewHistory());
    this.shadowRoot.getElementById('view-stats').addEventListener('click', () => this.viewStats());
  }

  viewHistory() {
    this.dispatchEvent(new CustomEvent('show-history'));
  }

  viewStats() {
    this.dispatchEvent(new CustomEvent('show-stats'));
  }
}

customElements.define('user-profile', UserProfile);
