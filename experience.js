(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const canvas = document.getElementById('kinetic-field');
  const list = document.getElementById('list');
  const add = document.getElementById('add');
  if (!canvas || !list) return;

  const context = canvas.getContext('2d', { alpha: true });
  let width = 0;
  let height = 0;
  let ratio = 1;
  let frame = 0;
  let particles = [];

  function resize() {
    ratio = Math.min(devicePixelRatio || 1, 1.6);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function burst(x, y) {
    if (reduced) return;
    const colors = ['#b4f02d', '#ff4f28', '#2925d8', '#171714'];
    for (let index = 0; index < 42; index += 1) {
      const angle = Math.PI * 2 * index / 42 + Math.random() * 0.24;
      const speed = 2.8 + Math.random() * 6.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 1,
        size: 2 + Math.random() * 5,
        color: colors[index % colors.length],
        spin: Math.random() * Math.PI
      });
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function draw() {
    frame = 0;
    context.clearRect(0, 0, width, height);
    particles = particles.filter(particle => particle.life > 0.02);
    particles.forEach(particle => {
      particle.vy += 0.14;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life *= 0.955;
      particle.spin += 0.12;
      context.save();
      context.globalAlpha = particle.life;
      context.translate(particle.x, particle.y);
      context.rotate(particle.spin);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      context.restore();
    });
    if (particles.length && !document.hidden) frame = requestAnimationFrame(draw);
  }

  if (finePointer && !reduced) {
    list.addEventListener('pointermove', event => {
      const row = event.target.closest('.task-row');
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      row.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`);
      row.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
    });
    list.addEventListener('pointerout', event => {
      const row = event.target.closest('.task-row');
      if (!row || row.contains(event.relatedTarget)) return;
      row.style.setProperty('--ry', '0deg');
      row.style.setProperty('--rx', '0deg');
    });
    if (add) {
      add.addEventListener('pointermove', event => {
        const rect = add.getBoundingClientRect();
        add.style.translate = `${(event.clientX - rect.left - rect.width / 2) * 0.1}px ${(event.clientY - rect.top - rect.height / 2) * 0.1}px`;
      });
      add.addEventListener('pointerleave', () => { add.style.translate = ''; });
    }
  }

  list.addEventListener('change', event => {
    if (!event.target.matches('.task-check') || !event.target.checked) return;
    const rect = event.target.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (particles.length && !frame) {
      frame = requestAnimationFrame(draw);
    }
  });
  addEventListener('resize', resize, { passive: true });
  resize();
})();
