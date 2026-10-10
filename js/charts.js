/**
 * F.R.I.D.A.Y. - Clean Telemetry Canvas Renderers
 * Anti-aliased 60fps RF Spectrum & Seismic Oscilloscope
 */

class RFSignalChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.maxPoints = 36;
    this.rssiHistory = [];
    this.snrHistory = [];

    // Seed data
    const baseRSSI = -68.4;
    const baseSNR = 9.2;
    for (let i = 0; i < this.maxPoints; i++) {
      this.rssiHistory.push(baseRSSI + (Math.random() * 3 - 1.5));
      this.snrHistory.push(baseSNR + (Math.random() * 1.5 - 0.75));
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.draw();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
    this.draw();
  }

  addDataPoint(rssi, snr) {
    this.rssiHistory.push(rssi);
    if (this.rssiHistory.length > this.maxPoints) this.rssiHistory.shift();

    this.snrHistory.push(snr);
    if (this.snrHistory.length > this.maxPoints) this.snrHistory.shift();

    this.draw();
  }

  draw() {
    if (!this.ctx || !this.cssWidth) return;
    const ctx = this.ctx;
    const width = this.cssWidth;
    const height = this.cssHeight;

    ctx.clearRect(0, 0, width, height);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let y = 15; y < height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 20; x < width; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const stepX = width / (this.maxPoints - 1);

    // RSSI Map (-110 to -30 dBm)
    const mapRSSItoY = (val) => {
      const norm = (val - (-110)) / ((-30) - (-110));
      return height - (norm * (height - 20) + 10);
    };

    // RSSI Area Fill
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < this.rssiHistory.length; i++) {
      const x = i * stepX;
      const y = mapRSSItoY(this.rssiHistory[i]);
      ctx.lineTo(x, y);
    }
    ctx.lineTo((this.rssiHistory.length - 1) * stepX, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // RSSI Line
    ctx.beginPath();
    for (let i = 0; i < this.rssiHistory.length; i++) {
      const x = i * stepX;
      const y = mapRSSItoY(this.rssiHistory[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    // SNR Line (-10 to 15 dB)
    const mapSNRtoY = (val) => {
      const norm = (val - (-10)) / (15 - (-10));
      return height - (norm * (height - 20) + 10);
    };

    ctx.beginPath();
    for (let i = 0; i < this.snrHistory.length; i++) {
      const x = i * stepX;
      const y = mapSNRtoY(this.snrHistory[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

class SeismicOscilloscope {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.points = [];
    this.maxPoints = 80;
    this.isShaking = false;
    this.shakeIntensity = 0;

    for (let i = 0; i < this.maxPoints; i++) {
      this.points.push(0);
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
  }

  triggerShock(intensity = 1.0) {
    this.isShaking = true;
    this.shakeIntensity = intensity;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    let val = 0;
    if (this.isShaking) {
      val = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= 0.94;
      if (this.shakeIntensity < 0.04) {
        this.isShaking = false;
        this.shakeIntensity = 0;
      }
    } else {
      val = (Math.random() * 2 - 1) * 0.04;
    }

    this.points.push(val);
    if (this.points.length > this.maxPoints) this.points.shift();

    this.draw();
  }

  draw() {
    if (!this.ctx || !this.cssWidth) return;
    const ctx = this.ctx;
    const width = this.cssWidth;
    const height = this.cssHeight;
    const midY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    const stepX = width / (this.maxPoints - 1);
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++) {
      const x = i * stepX;
      const y = midY - (this.points[i] * (midY - 6));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = this.isShaking ? '#ef4444' : '#10b981';
    ctx.lineWidth = this.isShaking ? 2 : 1.5;
    ctx.stroke();
  }
}

window.RFSignalChart = RFSignalChart;
window.SeismicOscilloscope = SeismicOscilloscope;
