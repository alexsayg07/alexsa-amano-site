/* Mesh grid with swirl distortions — mouse-reactive */
(function () {
  'use strict';

  const canvas = document.getElementById('topo-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let t = 0;

  /* Grid resolution — cols × rows nodes */
  const COLS = 22;
  const ROWS = 15;

  /*
   * Animated swirl centres in normalised [0..1] space.
   * bx/by = base position, str = twist strength (rad), sp = drift speed
   * Negative strength = counter-clockwise swirl.
   */
  const SWIRLS = [
    { bx: 0.18, by: 0.28, str:  1.15, sp: 0.00042 },
    { bx: 0.80, by: 0.52, str: -1.00, sp: 0.00031 },
    { bx: 0.50, by: 0.85, str:  0.85, sp: 0.00058 },
    { bx: 0.88, by: 0.18, str: -0.72, sp: 0.00047 },
    { bx: 0.30, by: 0.70, str:  0.65, sp: 0.00035 },
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.tx = e.clientX / W;
    mouse.ty = e.clientY / H;
  }, { passive: true });

  /*
   * Rotate point (x, y) around centre (cx, cy) by `strength` radians,
   * where the rotation fades exponentially with distance.
   * Returns new [x, y] in the same normalised space.
   */
  function applySwirl(x, y, cx, cy, strength) {
    const dx   = x - cx;
    const dy   = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1e-5) return [x, y];
    const base  = Math.atan2(dy, dx);
    const twist = strength * Math.exp(-dist * 4.2);
    const angle = base + twist;
    return [
      cx + Math.cos(angle) * dist,
      cy + Math.sin(angle) * dist,
    ];
  }

  /*
   * Compute every grid node position for the current frame.
   * Each node starts on a regular grid, then gets:
   *   1. A gentle ripple wave (background motion)
   *   2. Distortion from each animated swirl centre
   *   3. A proximity-weighted swirl from the mouse cursor
   */
  function buildGrid() {
    /* Drift each swirl centre slowly in a Lissajous-like path */
    const sw = SWIRLS.map((s) => ({
      cx:  s.bx + Math.sin(t * s.sp * 1100 + s.bx * 5.8) * 0.10,
      cy:  s.by + Math.cos(t * s.sp * 850  + s.by * 5.8) * 0.10,
      str: s.str,
    }));

    const grid = [];
    for (let r = 0; r <= ROWS; r++) {
      const row = [];
      for (let c = 0; c <= COLS; c++) {
        let x = c / COLS;
        let y = r / ROWS;

        /* 1 — soft background ripple so the grid breathes */
        x += Math.sin(y * Math.PI * 3.3 + t * 0.85) * 0.013
           + Math.sin(y * Math.PI * 7.2 - t * 0.52) * 0.005;
        y += Math.cos(x * Math.PI * 3.6 + t * 0.70) * 0.013
           + Math.cos(x * Math.PI * 7.0 + t * 0.42) * 0.005;

        /* 2 — animated swirl centres */
        for (const s of sw) {
          [x, y] = applySwirl(x, y, s.cx, s.cy, s.str);
        }

        /* 3 — mouse swirl: strength falls off quickly with distance */
        const mdx  = x - mouse.x;
        const mdy  = y - mouse.y;
        const md   = Math.sqrt(mdx * mdx + mdy * mdy);
        const mStr = 0.42 * Math.exp(-md * 5.5);
        [x, y] = applySwirl(x, y, mouse.x, mouse.y, mStr);

        row.push([x * W, y * H]);
      }
      grid.push(row);
    }
    return grid;
  }

  function draw() {
    /* Smooth mouse towards target */
    mouse.x += (mouse.tx - mouse.x) * 0.055;
    mouse.y += (mouse.ty - mouse.y) * 0.055;

    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 0.72;

    const grid = buildGrid();

    /* Horizontal lines — quadratic curves for smooth flow */
    for (let r = 0; r <= ROWS; r++) {
      const a = (0.10 + 0.06 * Math.sin(r * 0.85 + t * 0.4)).toFixed(3);
      ctx.strokeStyle = `rgba(60, 60, 58, ${a})`;
      ctx.beginPath();
      ctx.moveTo(grid[r][0][0], grid[r][0][1]);
      for (let c = 1; c < COLS; c++) {
        const [x0, y0] = grid[r][c];
        const [x1, y1] = grid[r][c + 1] || grid[r][c];
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        ctx.quadraticCurveTo(x0, y0, mx, my);
      }
      const last = grid[r][COLS];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    }

    /* Vertical lines — quadratic curves for smooth flow */
    for (let c = 0; c <= COLS; c++) {
      const a = (0.10 + 0.06 * Math.sin(c * 0.85 - t * 0.35)).toFixed(3);
      ctx.strokeStyle = `rgba(60, 60, 58, ${a})`;
      ctx.beginPath();
      ctx.moveTo(grid[0][c][0], grid[0][c][1]);
      for (let r = 1; r < ROWS; r++) {
        const [x0, y0] = grid[r][c];
        const [x1, y1] = grid[r + 1] ? grid[r + 1][c] : grid[r][c];
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        ctx.quadraticCurveTo(x0, y0, mx, my);
      }
      const last = grid[ROWS][c];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    }

    t += 0.003;
    requestAnimationFrame(draw);
  }

  draw();
})();
