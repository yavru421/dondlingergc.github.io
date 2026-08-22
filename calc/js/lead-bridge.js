/**
 * Lead Bridge for Localized Estimator
 * Connects calculation output to instant voice/photo intake
 */

export class LeadBridge {
  constructor(telemetryInstance) {
    this.telemetry = telemetryInstance;
    this.container = document.getElementById('lead-bridge-container');
    this.currentData = null;
  }

  updateEstimateContext(estimateData) {
    this.currentData = estimateData;
    this.render();
  }

  render() {
    if (!this.container || !this.currentData) return;

    const { city, cityName, tradeName, subTypeName, totalRange, yardage, sqft } = this.currentData;

    this.container.innerHTML = `
      <div class="lead-card">
        <div class="lead-badge">⚡ Instant On-Site Verification</div>
        <h3 class="lead-title">Lock in this ${tradeName} Estimate in ${cityName}</h3>
        <p class="lead-subtitle">
          Based on Wisconsin code (${sqft} sq ft${yardage ? ` / ~${yardage} yds concrete` : ''}): 
          <span class="highlight-range">${totalRange}</span>
        </p>

        <div class="lead-actions">
          <button id="btn-voice-intake" class="btn-primary-action">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
            Record 15s Job Audio
          </button>

          <button id="btn-photo-intake" class="btn-secondary-action">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Attach Site Photos
          </button>
        </div>

        <div id="quick-contact-box" class="quick-contact-box">
          <input type="tel" id="lead-phone" placeholder="Your Phone Number (e.g. 715-555-0199)" class="phone-input" />
          <button id="btn-submit-lead" class="btn-submit-quick">Request Site Walk</button>
        </div>
        <div id="lead-status-msg" class="lead-status-msg"></div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const btnVoice = document.getElementById('btn-voice-intake');
    const btnPhoto = document.getElementById('btn-photo-intake');
    const btnSubmit = document.getElementById('btn-submit-lead');
    const phoneInput = document.getElementById('lead-phone');
    const statusMsg = document.getElementById('lead-status-msg');

    if (btnVoice) {
      btnVoice.onclick = () => {
        this.telemetry.recordLeadConversion('voice_intake_click', this.currentData);
        window.location.href = `https://voice-intake-app.dondlingergc.com/?ref=calc&trade=${this.currentData.trade}&city=${this.currentData.city}&val=${encodeURIComponent(this.currentData.totalRange)}`;
      };
    }

    if (btnPhoto) {
      btnPhoto.onclick = () => {
        this.telemetry.recordLeadConversion('photo_intake_click', this.currentData);
        window.location.href = `/intake.html?ref=calc&trade=${this.currentData.trade}&city=${this.currentData.city}`;
      };
    }

    if (btnSubmit) {
      btnSubmit.onclick = async () => {
        const phone = (phoneInput.value || '').trim();
        if (!phone || phone.length < 7) {
          statusMsg.textContent = 'Please enter a valid phone number.';
          statusMsg.style.color = '#ff5555';
          return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Sending...';

        try {
          const resp = await fetch('/api/intake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Web Calc Visitor (${this.currentData.cityName})`,
              phone: phone,
              project_type: `${this.currentData.tradeName} - ${this.currentData.subTypeName}`,
              city: this.currentData.cityName,
              notes: `Calculated Estimate: ${this.currentData.totalRange} (${this.currentData.sqft} sq ft, ${this.currentData.yardage || 0} yards). Estimated via /calc/. Session: ${this.telemetry.sid}`
            })
          });

          if (resp.ok) {
            this.telemetry.recordLeadConversion('phone_submission_success', { phone, ...this.currentData });
            statusMsg.textContent = '✓ Estimate sent to J. Dondlinger! We will call/text shortly.';
            statusMsg.style.color = '#39ff14';
            phoneInput.style.display = 'none';
            btnSubmit.style.display = 'none';
          } else {
            throw new Error('Server returned error');
          }
        } catch (e) {
          console.error(e);
          statusMsg.textContent = 'Unable to send right now. Please call or text (715) directly.';
          statusMsg.style.color = '#ff9800';
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Request Site Walk';
        }
      };
    }
  }
}
