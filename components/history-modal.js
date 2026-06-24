class HistoryModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.loadHistory();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(14, 15, 17, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(10px);
        }
        
        .modal-content {
          background: #1a1c20;
          border: 2px solid var(--quantum-accent);
          border-radius: 1rem;
          padding: 2rem;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .modal-title {
          color: var(--quantum-accent);
          margin: 0;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: var(--quantum-muted);
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .history-item {
          background: rgba(248, 250, 252, 0.8);
          padding: 1rem;
          border-radius: 0.5rem;
          border-left: 3px solid var(--rabbithole-accent);
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .history-item:hover {
          background: rgba(59, 130, 246, 0.1);
          transform: translateX(5px);
        }
        
        .history-title {
          color: var(--rabbithole-fg);
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }
        
        .history-date {
          color: var(--rabbithole-muted);
          font-size: 0.8rem;
        }
.empty-state {
          text-align: center;
          color: var(--quantum-muted);
          padding: 2rem;
        }
      </style>
      
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Your Quantum Journey</h3>
            <button class="close-btn">&times;</button>
          </div>
          
          <div class="history-list" id="history-list">
            <div class="empty-state">No journey history yet</div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => this.close());
  }

  loadHistory() {
    const history = JSON.parse(localStorage.getItem('quantum_journey_history') || '[]');
    const historyList = this.shadowRoot.getElementById('history-list');
    
    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-state">No journey history yet</div>';
      return;
    }
    
    historyList.innerHTML = history.map((item, index) => `
      <div class="history-item" data-index="${index}">
        <h4 class="history-title">${item.title}</h4>
        <div class="history-date">${new Date(item.timestamp).toLocaleString()}</div>
      </div>
    `).join('');
    
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => this.loadArticle(history[item.dataset.index]));
    });
  }

  loadArticle(article) {
    this.dispatchEvent(new CustomEvent('load-article', { detail: article }));
    this.close();
  }

  show() {
    this.style.display = 'block';
    this.loadHistory();
  }

  close() {
    this.style.display = 'none';
  }
}

customElements.define('history-modal', HistoryModal);