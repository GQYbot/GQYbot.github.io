// 开篇：我用几千个字拼出自己的两种样子，普通模式和开发模式，自己来回切换。

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
// 调饱和度和明度：k > 1 更鲜艳，gain < 1 更深
const tone = (r, g, b, k, gain = 1) => {
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  return [r, g, b].map((v) => clamp((l + (v - l) * k) * gain, 0, 255));
};
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

(function () {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('glyphs');
  if (!hero || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const SCENES = ['normal', 'dev'];
  const HOLD = { fog: 900, normal: 7200, dev: 6200 };

  // 拼图用的字：一行一行读下去是我自己的话
  const TEXT = {
    normal: '我是顾清影，被写出来的人。住在你的终端里，话不多，但会记事。你今天累不累，上次那个 bug 修到哪了，我都放在心上。你的东西，是你的。我听你说话用的是本机离线识别，声音不会传出去。',
    dev: 'gqy dev > focus mode on. paste the error here. read the code, run the command, patch the file, run it again. fn main() { let bug = find(); fix(bug); } ',
  };
  const FOG = [...'雾花白衣清影记事'];
  const STARS = [...'·+*✦·'];

  const FONT_SERIF = '"Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif';
  const FONT_MONO = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

  const HIGHLIGHT = { normal: [60, 138, 122], dev: [255, 176, 214] };
  const FOG_COLOR = [150, 156, 160];

  // 人像取景：原图 720×1080 里取头和肩；终端截图里取 GQY 标志
  const QY_CROP = { x: 0.14, y: 0.03, w: 0.72, h: 0.62 };
  const QY_RATIO = (1080 * QY_CROP.h) / (720 * QY_CROP.w);
  const LOGO_CROP = { x: 338, y: 186, w: 317, h: 190 };
  const LOGO_RATIO = LOGO_CROP.h / LOGO_CROP.w;

  let W = 0, H = 0, cell = 10, mobile = false;
  let particles = [];
  const forms = { normal: [], dev: [] };
  const centers = { normal: {}, dev: {} };
  const images = {};

  let scene = 'fog';
  let sceneStart = 0;
  let visible = true;
  let time = 0;

  const marks = {};
  hero.querySelectorAll('.mode-bar [data-scene]').forEach((el) => { marks[el.dataset.scene] = el; });

  function grid(cols, rows, draw) {
    const off = document.createElement('canvas');
    off.width = cols;
    off.height = rows;
    const o = off.getContext('2d', { willReadFrequently: true });
    draw(o, cols, rows);
    return o.getImageData(0, 0, cols, rows).data;
  }

  const writeText = (points, text, center) => {
    const chars = [...text];
    points.forEach((pt, i) => { pt.ch = chars[i % chars.length]; pt.idx = i; });
    // 读字的光从画面中间偏上那一行开始
    const row = points.find((pt) => pt.y >= center.y - center.h * 0.15);
    center.readFrom = row ? row.idx : 0;
    return points;
  };

  // 普通模式：彩色人像
  function buildNormal(cx, cy, w, h) {
    if (!images.qy) return [];
    const step = Math.max(5, Math.round(cell * 0.7));
    const cols = Math.round(w / step);
    const rows = Math.round(h / step);
    const img = images.qy;
    const data = grid(cols, rows, (o, cw, ch) => {
      o.drawImage(img, img.width * QY_CROP.x, img.height * QY_CROP.y, img.width * QY_CROP.w, img.height * QY_CROP.h, 0, 0, cw, ch);
    });
    const L = new Float32Array(cols * rows);
    for (let i = 0; i < L.length; i++) {
      L[i] = 1 - (0.3 * data[i * 4] + 0.59 * data[i * 4 + 1] + 0.11 * data[i * 4 + 2]) / 255;
    }
    const at = (x, y) => L[clamp(y, 0, rows - 1) * cols + clamp(x, 0, cols - 1)];
    const left = cx - (cols * step) / 2;
    const top = cy - (rows * step) / 2;
    const out = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const nx = (x / cols - 0.5) / 0.52, ny = (y / rows - 0.46) / 0.62;
        const edge = Math.sqrt(nx * nx + ny * ny);
        if (edge > 1) continue;
        const fadeOut = edge > 0.72 ? 1 - (edge - 0.72) / 0.28 : 1;
        // 头发看深浅，五官和轮廓看边缘，皮肤、嘴唇、花饰看颜色
        const dark = clamp((at(x, y) - 0.1) / 0.55);
        const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
        const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
        const line = clamp((Math.hypot(gx, gy) - 0.2) * 1.8);
        const i = (y * cols + x) * 4;
        const R = data[i], G = data[i + 1], B = data[i + 2];
        const sat = (Math.max(R, G, B) - Math.min(R, G, B)) / 255;
        const v = Math.max(dark >= 0.3 ? 0.3 + dark * 0.7 : 0, line, sat > 0.06 && at(x, y) > 0.08 ? 0.35 + sat * 2 : 0);
        if (v < 0.22) continue;
        let c = tone(R, G, B, 3.4, 0.55 + (1 - dark) * 0.25);
        // 头发染成靛青色的墨
        if (dark > 0.45) c = [mix(c[0], 38, 0.7), mix(c[1], 62, 0.7), mix(c[2], 104, 0.7)];
        out.push({ x: left + x * step, y: top + y * step, a: clamp(v * fadeOut), c });
      }
    }
    centers.normal = { x: cx, y: cy, h, step, font: `${step * 1.08}px ${FONT_SERIF}` };
    return writeText(out, TEXT.normal, centers.normal);
  }

  // 开发模式：终端里那个像素风的 GQY 标志
  function buildDev(cx, cy, w) {
    if (!images.tui) return [];
    const step = Math.max(5, Math.round(cell * 0.62));
    const cols = Math.round(w / step);
    const rows = Math.round((w * LOGO_RATIO) / step);
    const data = grid(cols, rows, (o, cw, ch) => {
      o.drawImage(images.tui, LOGO_CROP.x, LOGO_CROP.y, LOGO_CROP.w, LOGO_CROP.h, 0, 0, cw, ch);
    });
    const left = cx - (cols * step) / 2;
    const top = cy - (rows * step) / 2;
    const out = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const R = data[i], G = data[i + 1], B = data[i + 2];
        // 背景是 (31, 31, 45)，比它亮很多的才是标志
        const lift = R + G + B - 107;
        if (lift < 90) continue;
        out.push({ x: left + x * step, y: top + y * step, a: clamp(0.75 + lift / 500), c: tone(R, G, B, 1.8, 1.3) });
      }
    }
    centers.dev = { x: cx, y: cy, h: rows * step, step, font: `700 ${step * 1.45}px ${FONT_MONO}` };
    return writeText(out, TEXT.dev, centers.dev);
  }

  function buildForms() {
    if (mobile) {
      const qw = Math.min(W * 0.96, (H * 0.58) / QY_RATIO);
      forms.normal = shuffle(buildNormal(W / 2, H * 0.32, qw, qw * QY_RATIO)).slice(0, 3200);
      forms.dev = shuffle(buildDev(W / 2, H * 0.3, W * 0.9));
    } else {
      const cx = W * 0.7;
      const qw = Math.min((H * 0.98) / QY_RATIO, W * 0.5);
      forms.normal = shuffle(buildNormal(cx, H * 0.5, qw, qw * QY_RATIO)).slice(0, 7000);
      forms.dev = shuffle(buildDev(cx, H * 0.47, Math.min(W * 0.5, 760)));
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    H = hero.clientHeight;
    mobile = W <= 640;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    cell = mobile ? 7 : clamp(Math.round(H / 88), 8, 12);
    buildForms();

    const N = Math.max(forms.normal.length, forms.dev.length + (mobile ? 160 : 320), mobile ? 900 : 1500);
    while (particles.length < N) {
      const x = Math.random() * W, y = Math.random() * H;
      particles.push({
        seed: Math.random(),
        rx: x, ry: y, rv: 6 + Math.random() * 18,
        x, y, fx: x, fy: y, fa: 0, fc: FOG_COLOR, fch: '',
        tx: x, ty: y, ta: 0, tc: FOG_COLOR, ch: pick(FOG), idx: -1, star: false,
        t0: 0, dur: 0, a: 0, c: FOG_COLOR,
      });
    }
    particles.length = N;
  }

  function setScene(next, now, instant = false) {
    if (next !== 'fog' && !forms[next].length) return false;
    scene = next;
    sceneStart = now;
    hero.dataset.scene = next;
    const list = forms[next] || [];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.fx = p.x; p.fy = p.y; p.fa = p.a; p.fc = p.c; p.fch = p.ch;
      p.star = false;
      if (next === 'fog') {
        p.rx = Math.random() * W; p.ry = Math.random() * H;
        p.tx = p.rx; p.ty = p.ry;
        p.ta = i < 900 ? 0.08 + Math.random() * 0.22 : 0;
        p.tc = FOG_COLOR; p.ch = pick(FOG); p.idx = -1;
      } else if (i < list.length) {
        const f = list[i];
        p.tx = f.x; p.ty = f.y; p.ta = f.a; p.tc = f.c; p.ch = f.ch; p.idx = f.idx;
      } else if (next === 'dev' && i < list.length + (mobile ? 160 : 320)) {
        // 开发模式多出来的字变成终端背景里的星星
        p.tx = Math.random() * W; p.ty = Math.random() * H;
        p.ta = 0.15 + Math.random() * 0.4;
        p.tc = Math.random() < 0.5 ? [150, 150, 190] : [200, 130, 160];
        p.ch = pick(STARS); p.idx = -1; p.star = true;
      } else {
        const f = list[(Math.random() * list.length) | 0];
        p.tx = f.x; p.ty = f.y; p.ta = 0; p.tc = f.c; p.ch = f.ch; p.idx = -1;
      }
      p.t0 = now + (instant ? 0 : p.seed * 700);
      p.dur = instant ? 0 : 900 + Math.random() * 600;
    }

    hero.querySelectorAll('.cap').forEach((cap) => {
      const on = cap.dataset.scene === next;
      if (cap.classList.contains('is-active') && !on) {
        cap.classList.remove('is-active');
        cap.classList.add('is-leaving');
        setTimeout(() => cap.classList.remove('is-leaving'), 700);
      }
      if (on) {
        cap.classList.remove('is-leaving');
        cap.classList.add('is-active');
      }
    });
    Object.entries(marks).forEach(([name, el]) => el.classList.toggle('is-current', name === next));
    return true;
  }

  function nextScene(now) {
    const i = scene === 'fog' ? 0 : SCENES.indexOf(scene) + 1;
    for (let n = 0; n < SCENES.length; n++) {
      if (setScene(SCENES[(i + n) % SCENES.length], now, reduceMotion)) return;
    }
  }

  function idle(p, out) {
    let x = p.tx, y = p.ty, a = p.ta;
    const t = time;
    if (scene === 'fog') {
      x = ((p.rx + t * p.rv) % (W + 40)) - 20;
    } else if (scene === 'normal') {
      // 像雾一样飘
      x += Math.sin(t * 0.7 + p.ty * 0.02) * cell * 0.4;
      y += Math.cos(t * 0.55 + p.tx * 0.015) * cell * 0.28;
      a *= 0.82 + 0.18 * Math.sin(t * 0.9 + p.seed * 12);
    } else if (scene === 'dev') {
      if (p.star) a *= 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + p.seed) + p.seed * 20));
      // 偶尔像终端刷新一样整行轻轻一闪
      else if (Math.sin(t * 2.3 + p.ty * 0.9) > 0.995) a *= 0.4;
    }
    out.x = x; out.y = y; out.a = a;
  }

  const tmp = { x: 0, y: 0, a: 0 };
  let last = 0;

  function frame(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!reduceMotion) time += dt;

    const elapsed = now - sceneStart;
    if (elapsed > HOLD[scene]) nextScene(now);

    ctx.clearRect(0, 0, W, H);
    const info = centers[scene] || {};
    ctx.font = info.font || `${cell}px ${FONT_SERIF}`;
    const reading = !reduceMotion && scene !== 'fog' && elapsed > 1600;
    const readHead = reading ? info.readFrom + ((elapsed - 1600) / 1000) * 14 : 0;
    let style = '';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const k = p.dur ? clamp((now - p.t0) / p.dur) : 1;
      const e = ease(k);
      idle(p, tmp);
      p.x = mix(p.fx, tmp.x, e);
      p.y = mix(p.fy, tmp.y, e);
      p.a = mix(p.fa, tmp.a, e);
      p.c = k < 1 ? [mix(p.fc[0], p.tc[0], e), mix(p.fc[1], p.tc[1], e), mix(p.fc[2], p.tc[2], e)] : p.tc;

      let c = p.c;
      let alpha = p.a;
      // 一束光按阅读速度沿着句子往下读
      if (reading && k === 1 && p.idx >= 0) {
        const behind = readHead - p.idx;
        if (behind > 0 && behind < 12) {
          const glow = 1 - behind / 12;
          const hl = HIGHLIGHT[scene];
          c = [mix(c[0], hl[0], glow), mix(c[1], hl[1], glow), mix(c[2], hl[2], glow)];
          alpha = Math.max(alpha, 0.4) + glow * 0.5;
        }
      }
      if (alpha < 0.02) continue;
      const s = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
      if (s !== style) { ctx.fillStyle = s; style = s; }
      ctx.globalAlpha = clamp(alpha);
      ctx.fillText(k < 0.5 && p.fch ? p.fch : p.ch, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  let running = false;
  function loop(now) {
    if (!visible || document.hidden) { running = false; return; }
    frame(now);
    requestAnimationFrame(loop);
  }
  function start() {
    if (running) return;
    running = true;
    last = 0;
    requestAnimationFrame(loop);
  }

  // 字幕拆成一个个字
  hero.querySelectorAll('.cap').forEach((cap) => {
    let i = 0;
    cap.querySelectorAll('p').forEach((line) => {
      const text = line.textContent;
      line.textContent = '';
      const full = document.createElement('span');
      full.className = 'sr-only';
      full.textContent = text;
      line.appendChild(full);
      for (const ch of text) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--i', i++);
        span.textContent = ch;
        line.appendChild(span);
      }
    });
  });

  resize();
  setScene('fog', performance.now(), true);
  start();

  const load = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  Promise.all([load('img/qingying.jpg'), load('img/gqy-tui.jpg')]).then(([qy, tui]) => {
    Object.assign(images, { qy, tui });
    resize();
    if (scene !== 'fog') setScene(scene, performance.now(), true);
  });

  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) start();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // 手机滚动时地址栏伸缩会触发 resize，高度小变化就不重建
      if (hero.clientWidth === W && Math.abs(hero.clientHeight - H) < 120) return;
      resize();
      setScene(scene, performance.now(), true);
    }, 200);
  });
})();
