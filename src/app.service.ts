import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHello(): Promise<string> {
    const userCount = await this.prisma.user.count();
    return `Hello World! ${userCount}`;
  }

  async triggerNotFound() {
    return this.prisma.user.update({
      where: { id: '000000000000000000000000' }, // valid ObjectId format, doesn't exist
      data: { firstName: 'test' },
    });
  }

  getWelcomeHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fluentia Server — AI-Powered English Learning API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #08090d;
      --bg-card: rgba(18, 20, 29, 0.7);
      --bg-card-hover: rgba(28, 31, 46, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(99, 102, 241, 0.35);
      --primary: #6366f1;
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      --cyan-gradient: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      --emerald: #10b981;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      user-select: none;
    }

    /* Interactive Background Canvas */
    #particles-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }

    /* Ambient Glow Spots */
    .glow-orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.28;
      z-index: 0;
      pointer-events: none;
      animation: floatOrb 12s ease-in-out infinite alternate;
    }

    .orb-1 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #6366f1, #8b5cf6);
      top: -10%;
      left: -10%;
    }

    .orb-2 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #06b6d4, #3b82f6);
      bottom: -10%;
      right: -10%;
      animation-delay: -6s;
    }

    .orb-3 {
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, #ec4899, #a855f7);
      top: 40%;
      left: 60%;
      animation-delay: -3s;
    }

    @keyframes floatOrb {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(40px, 30px) scale(1.1); }
      100% { transform: translate(-30px, 50px) scale(0.95); }
    }

    /* Main Container */
    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
    }

    /* Header & Badge */
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #34d399;
      box-shadow: 0 0 24px rgba(16, 185, 129, 0.15);
      animation: pulseBadge 3s infinite;
      backdrop-filter: blur(8px);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: blinkDot 1.6s ease-in-out infinite alternate;
    }

    @keyframes blinkDot {
      from { opacity: 0.4; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1.2); }
    }

    @keyframes pulseBadge {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.15); }
      50% { transform: scale(1.02); box-shadow: 0 0 30px rgba(16, 185, 129, 0.3); }
    }

    /* Hero Section */
    .hero {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(2.4rem, 5.5vw, 4.2rem);
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.03em;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 40px rgba(99, 102, 241, 0.25);
      position: relative;
    }

    .hero-desc {
      max-width: 640px;
      font-size: clamp(1rem, 2vw, 1.15rem);
      line-height: 1.6;
      color: var(--text-muted);
      font-weight: 400;
    }

    /* Action Buttons */
    .actions-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      margin-top: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .btn-primary {
      background: var(--primary-gradient);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 30px -8px rgba(99, 102, 241, 0.5);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 36px -6px rgba(168, 85, 247, 0.6);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-main);
      border: 1px solid var(--border-subtle);
      backdrop-filter: blur(12px);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--border-glow);
      transform: translateY(-2px);
    }

    .btn-copy {
      background: rgba(14, 165, 233, 0.1);
      color: #38bdf8;
      border: 1px solid rgba(14, 165, 233, 0.25);
    }

    .btn-copy:hover {
      background: rgba(14, 165, 233, 0.2);
      border-color: rgba(14, 165, 233, 0.5);
      transform: translateY(-2px);
    }

    /* Live Status Bar Card */
    .status-panel {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      backdrop-filter: blur(20px);
      border-radius: 18px;
      padding: 22px 28px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      transition: border-color 0.3s ease;
    }

    .status-panel:hover {
      border-color: var(--border-glow);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .stat-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-dim);
      font-weight: 600;
    }

    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-value code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.92rem;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
    }

    /* Grid of Feature Modules */
    .modules-grid {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .module-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .module-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--primary-gradient);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .module-card:hover {
      transform: translateY(-4px);
      background: var(--bg-card-hover);
      border-color: var(--border-glow);
      box-shadow: 0 16px 32px -10px rgba(99, 102, 241, 0.2);
    }

    .module-card:hover::before {
      opacity: 1;
    }

    .card-icon {
      font-size: 1.8rem;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .card-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .endpoint-tag {
      margin-top: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.76rem;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Interactive Live Ping Playground */
    .interactive-box {
      width: 100%;
      background: linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 18px;
      padding: 24px 28px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      backdrop-filter: blur(16px);
    }

    .interactive-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .interactive-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .interactive-sub {
      font-size: 0.86rem;
      color: var(--text-muted);
    }

    .ping-btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }

    .ping-btn:hover {
      background: #4338ca;
      transform: translateY(-2px);
    }

    .ping-btn:active {
      transform: translateY(0);
    }

    .ping-result {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.84rem;
      padding: 6px 14px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #34d399;
      display: none;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 30px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #10b981;
      color: #f8fafc;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 999;
      pointer-events: none;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* Footer */
    footer {
      text-align: center;
      color: var(--text-dim);
      font-size: 0.85rem;
      margin-top: 10px;
    }

    /* Sparkle Particle on Click */
    .spark {
      position: fixed;
      pointer-events: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #a855f7;
      box-shadow: 0 0 10px #c084fc;
      animation: sparkFade 0.8s ease-out forwards;
      z-index: 1000;
    }

    @keyframes sparkFade {
      0% { transform: scale(1) translate(0, 0); opacity: 1; }
      100% { transform: scale(0) translate(var(--tx), var(--ty)); opacity: 0; }
    }
  </style>
</head>
<body>
  <canvas id="particles-canvas"></canvas>

  <div class="glow-orb orb-1"></div>
  <div class="glow-orb orb-2"></div>
  <div class="glow-orb orb-3"></div>

  <div class="container">
    <!-- Status Badge -->
    <div class="badge-pill">
      <div class="status-dot"></div>
      Fluentia Engine Online
    </div>

    <!-- Hero Header -->
    <header class="hero">
      <h1 class="hero-title">Welcome to Fluentia Server</h1>
      <p class="hero-desc">
        AI-Powered English Learning Platform Backend. Providing intelligent grammar diagnosis, adaptive CEFR skill mastery, spaced repetition, and real-time interactive pedagogy.
      </p>

      <!-- Action Buttons -->
      <div class="actions-row">
        <a href="/api/docs" class="btn btn-primary" target="_blank" id="btn-docs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          Explore Swagger API Docs
        </a>
        <button class="btn btn-copy" onclick="copyBaseUrl()" id="btn-copy">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy Base URL
        </button>
        <a href="/api/v1/health" class="btn btn-secondary" target="_blank" id="btn-health">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Health Check
        </a>
      </div>
    </header>

    <!-- Status Stats Bar -->
    <div class="status-panel">
      <div class="stat-item">
        <span class="stat-label">Environment</span>
        <div class="stat-value"><code>Node.js + NestJS 11</code></div>
      </div>
      <div class="stat-item">
        <span class="stat-label">API Version</span>
        <div class="stat-value"><code>v1 (/api/v1)</code></div>
      </div>
      <div class="stat-item">
        <span class="stat-label">Database</span>
        <div class="stat-value"><span style="color: #34d399">●</span> MongoDB Atlas</div>
      </div>
      <div class="stat-item">
        <span class="stat-label">AI Engine</span>
        <div class="stat-value"><span style="color: #c084fc">●</span> OpenAI GPT-4o</div>
      </div>
    </div>

    <!-- Live Interactive Ping Box -->
    <div class="interactive-box">
      <div class="interactive-info">
        <div class="interactive-title">
          <span>⚡ Live Server Ping & Diagnostics</span>
        </div>
        <div class="interactive-sub">
          Test real-time connection latency to the server cluster. Click anywhere on the screen for interactive sparks!
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="ping-btn" onclick="pingServer()" id="ping-btn">
          <span>Ping Cluster</span>
        </button>
        <div class="ping-result" id="ping-result">Latency: -- ms</div>
      </div>
    </div>

    <!-- Core Modules Grid -->
    <div class="modules-grid">
      <div class="module-card">
        <div class="card-icon">🔐</div>
        <h3 class="card-title">Auth & Security</h3>
        <p class="card-desc">JWT access/refresh tokens, Google OAuth2, and password reset OTP verification.</p>
        <div class="endpoint-tag">
          <span>POST</span>
          <span>/api/v1/auth/*</span>
        </div>
      </div>

      <div class="module-card">
        <div class="card-icon">👤</div>
        <h3 class="card-title">User Profiles</h3>
        <p class="card-desc">Personal details, AWS S3 avatars, CEFR targets, and custom learning preferences.</p>
        <div class="endpoint-tag">
          <span>PATCH</span>
          <span>/api/v1/users/my-profile</span>
        </div>
      </div>

      <div class="module-card">
        <div class="card-icon">🧠</div>
        <h3 class="card-title">AI Grammar Engine</h3>
        <p class="card-desc">Real-time structured pedagogical lesson generation with strict schema validation.</p>
        <div class="endpoint-tag">
          <span>POST</span>
          <span>/api/v1/grammar/teach</span>
        </div>
      </div>

      <div class="module-card">
        <div class="card-icon">📚</div>
        <h3 class="card-title">Skills & Mastery</h3>
        <p class="card-desc">CEFR structured skill tree, mastery scoring, and Spaced Repetition (SRS) scheduling.</p>
        <div class="endpoint-tag">
          <span>GET</span>
          <span>/api/v1/skills</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer>
      Fluentia Server &bull; Engineered with NestJS, Prisma & OpenAI &bull; <span id="server-clock"></span>
    </footer>
  </div>

  <!-- Toast Notification -->
  <div class="toast" id="toast">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
    <span id="toast-msg">Base URL copied to clipboard!</span>
  </div>

  <!-- Interactive Canvas & Script -->
  <script>
    // Live Server Clock
    function updateClock() {
      const now = new Date();
      document.getElementById('server-clock').innerText = now.toUTCString();
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Copy Base URL Function
    function copyBaseUrl() {
      const url = window.location.origin + '/api/v1';
      navigator.clipboard.writeText(url).then(() => {
        showToast('Copied ' + url + ' to clipboard!');
      }).catch(() => {
        showToast('Base URL: ' + url);
      });
    }

    // Toast Function
    function showToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-msg').innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // Ping Server Function
    async function pingServer() {
      const btn = document.getElementById('ping-btn');
      const res = document.getElementById('ping-result');
      btn.innerText = 'Pinging...';
      const start = performance.now();
      try {
        const response = await fetch('/api/v1/health');
        const duration = Math.round(performance.now() - start);
        res.style.display = 'block';
        if (response.ok) {
          res.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          res.style.color = '#34d399';
          res.innerText = '⚡ Online: ' + duration + 'ms';
        } else {
          res.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          res.style.color = '#f87171';
          res.innerText = 'Status ' + response.status + ' (' + duration + 'ms)';
        }
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        res.style.display = 'block';
        res.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        res.style.color = '#f87171';
        res.innerText = 'Offline (' + duration + 'ms)';
      }
      btn.innerText = 'Ping Cluster';
    }

    // Interactive Spark Particles on Click
    document.addEventListener('click', (e) => {
      // Don't spawn on button clicks to prevent interference
      for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = e.clientX + 'px';
        spark.style.top = e.clientY + 'px';
        const angle = (Math.PI * 2 / 8) * i;
        const dist = 30 + Math.random() * 40;
        spark.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        spark.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        const colors = ['#818cf8', '#c084fc', '#38bdf8', '#34d399', '#f472b6'];
        spark.style.background = colors[Math.floor(Math.random() * colors.length)];
        spark.style.boxShadow = '0 0 8px ' + spark.style.background;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 800);
      }
    });

    // Particle Canvas Animation
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const mouse = { x: null, y: null, radius: 140 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2 + 1;
        this.baseColor = Math.random() > 0.5 ? 'rgba(99, 102, 241,' : 'rgba(6, 182, 212,';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x && mouse.y) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 3;
            this.y -= (dy / dist) * force * 3;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor + ' 0.6)';
        ctx.fill();
      }
    }

    const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14000), 75);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const opacity = (1 - dist / 110) * 0.22;
            ctx.strokeStyle = 'rgba(147, 197, 253, ' + opacity + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`;
  }
}
