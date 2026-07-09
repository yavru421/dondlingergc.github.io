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

    // Clear existing content safely
    while (historyList.firstChild) historyList.removeChild(historyList.firstChild);

    if (history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No journey history yet';
      historyList.appendChild(empty);
      return;
    }

    // Build DOM nodes instead of innerHTML to prevent XSS from malicious localStorage data
    history.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.dataset.index = index;

      const h4 = document.createElement('h4');
      h4.className = 'history-title';
      h4.textContent = item.title; // textContent is XSS-safe

      const dateDiv = document.createElement('div');
      dateDiv.className = 'history-date';
      dateDiv.textContent = new Date(item.timestamp).toLocaleString();

      div.appendChild(h4);
      div.appendChild(dateDiv);
      div.addEventListener('click', () => this.loadArticle(history[index]));
      historyList.appendChild(div);
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