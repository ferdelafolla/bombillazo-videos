// page/px.js
var VERT = typeof window !== "undefined" && window.RPG_VERT !== void 0 ? !!window.RPG_VERT : typeof location !== "undefined" && new URLSearchParams(location.search).has("v");
var W = VERT ? 180 : 320;
var H = VERT ? 320 : 180;
var SCALE = 6;
var T = 255;
var HEX = [
  "#be4a2f",
  "#d77643",
  "#ead4aa",
  "#e4a672",
  "#b86f50",
  "#733e39",
  "#3e2731",
  "#a22633",
  "#e43b44",
  "#f77622",
  "#feae34",
  "#fee761",
  "#63c74d",
  "#3e8948",
  "#265c42",
  "#193c3e",
  "#124e89",
  "#0099db",
  "#2ce8f5",
  "#ffffff",
  "#c0cbdc",
  "#8b9bb4",
  "#5a6988",
  "#3a4466",
  "#262b44",
  "#181425",
  "#ff0044",
  "#68386c",
  "#b55088",
  "#f6757a",
  "#e8b796",
  "#c28569",
  // 32 围巾红 33 围巾暗 34 围巾高光   35 水晶青 36 水晶蓝 37 水晶白 38 水晶深
  "#e43b44",
  "#a22633",
  "#f6757a",
  "#2ce8f5",
  "#0099db",
  "#ffffff",
  "#124e89"
];
var C = {
  rust: 0,
  clay: 1,
  sand: 2,
  tan: 3,
  brown: 4,
  dbrown: 5,
  umber: 6,
  crimson: 7,
  red: 8,
  orange: 9,
  amber: 10,
  yellow: 11,
  lime: 12,
  green: 13,
  dgreen: 14,
  teal: 15,
  navy: 16,
  blue: 17,
  cyan: 18,
  white: 19,
  silver: 20,
  steel: 21,
  slate: 22,
  dslate: 23,
  night: 24,
  ink: 25,
  hot: 26,
  plum: 27,
  rose: 28,
  pink: 29,
  skin: 30,
  skinS: 31,
  scarf: 32,
  scarfD: 33,
  scarfL: 34,
  xc: 35,
  xb: 36,
  xw: 37,
  xd: 38
};
var NPAL = HEX.length;
var PROTECT = /* @__PURE__ */ new Set([32, 33, 34, 35, 36, 37, 38]);
var rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
var RGB = HEX.map(rgb);
var lum = ([r2, g, b]) => 0.299 * r2 + 0.587 * g + 0.114 * b;
var pack = ([r2, g, b]) => 255 << 24 | b << 16 | g << 8 | r2;
function lutFrom(fn) {
  const L2 = new Uint32Array(256);
  for (let i = 0; i < NPAL; i++) L2[i] = pack(fn(i));
  return L2;
}
function nearest(c2, set) {
  let best = set[0], bd = 1e9;
  for (const s of set) {
    const d = (c2[0] - s[0]) ** 2 * 0.3 + (c2[1] - s[1]) ** 2 * 0.59 + (c2[2] - s[2]) ** 2 * 0.11;
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}
function rampMap(ramp, keep) {
  const Ls = RGB.map(lum), sorted = [...Ls].sort((a, b) => a - b);
  return lutFrom((i) => {
    if (keep && PROTECT.has(i)) return RGB[i];
    const q2 = sorted.indexOf(Ls[i]) / (sorted.length - 1);
    return rgb(ramp[Math.min(ramp.length - 1, Math.floor(q2 * ramp.length))]);
  });
}
var LUT = {};
LUT.full = lutFrom((i) => RGB[i]);
var FADED_RAMP = ["#0e0d17", "#1d2031", "#2d3349", "#434c66", "#646e8a", "#8f99b0", "#c3c9d6"];
var fadedIdx = (i) => Math.min(6, Math.floor(Math.pow(lum(RGB[i]) / 255, 0.8) * 7.2));
LUT.faded = lutFrom((i) => PROTECT.has(i) ? RGB[i] : rgb(FADED_RAMP[fadedIdx(i)]));
var GB4 = ["#1f2a1c", "#4b5e3a", "#93a263", "#d6dba6"];
LUT.gb4 = lutFrom((i) => {
  const l = lum(RGB[i]);
  return rgb(GB4[l < 60 ? 0 : l < 115 ? 1 : l < 175 ? 2 : 3]);
});
var GBI = [25, 22, 21, 19];
var NES = ["#000000", "#fcfcfc", "#a4a4b8", "#58587c", "#1c2c8c", "#3c7cfc", "#94e0fc", "#b8141c", "#fc7454", "#fcb81c", "#8c4c1c", "#2c9c2c", "#fcd8a8", "#0c4c18", "#4c2410"];
var NESr = NES.map(rgb);
LUT.nes = lutFrom((i) => nearest(RGB[i], NESr));
LUT.nesKeep = lutFrom((i) => PROTECT.has(i) ? RGB[i] : nearest(RGB[i], NESr));
var SUB16 = [25, 24, 23, 22, 21, 19, 16, 17, 7, 8, 9, 10, 11, 27, 28, 5].map((i) => RGB[i]);
var SUB8 = [25, 23, 21, 19, 7, 9, 11, 27].map((i) => RGB[i]);
LUT.c16 = lutFrom((i) => PROTECT.has(i) ? RGB[i] : nearest(RGB[i], SUB16));
LUT.c8 = lutFrom((i) => PROTECT.has(i) ? RGB[i] : nearest(RGB[i], SUB8));
LUT.c4 = rampMap(["#16152a", "#3a3f60", "#7c86a8", "#c9cfe4"], true);
LUT.c2 = rampMap(["#1b1d2c", "#565f77"], true);
function darken(L2, f) {
  const q2 = Math.round(f * 4) / 4, O = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const v = L2[i];
    if (!v) continue;
    const r2 = v & 255, g = v >> 8 & 255, b = v >> 16 & 255;
    O[i] = pack([r2 * (1 - q2) | 0, g * (1 - q2) | 0, b * (1 - q2) | 0]);
  }
  return O;
}
var B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var bayer = (x, y) => (B4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
var B8 = (() => {
  const m = new Float32Array(64);
  const base = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  for (let i = 0; i < 64; i++) m[i] = (base[i] + 0.5) / 64;
  return m;
})();
var bayer8 = (x, y) => B8[(y & 7) * 8 + (x & 7)];
function hash(x, y = 0, z = 0) {
  let h = x * 374761393 + y * 668265263 + z * 2147483647 | 0;
  h = (h ^ h >>> 13) * 1274126177;
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
var clamp = (v, a, b) => v < a ? a : v > b ? b : v;
var eo = (t) => 1 - (1 - t) * (1 - t);
var eio = (t) => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
var FB = class {
  constructor(w = W, h = H) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h);
    this.clip = [0, 0, w, h];
  }
  clear(c2 = 0) {
    this.d.fill(c2);
  }
  px(x, y, c2) {
    x |= 0;
    y |= 0;
    const [cx, cy, cw, ch] = this.clip;
    if (x < cx || y < cy || x >= cw || y >= ch || c2 === T) return;
    this.d[y * this.w + x] = c2;
  }
  get(x, y) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T;
    return this.d[y * this.w + x];
  }
  rect(x, y, w, h, c2) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c2);
  }
  hline(x0, x1, y, c2) {
    for (let x = Math.round(x0); x <= Math.round(x1); x++) this.px(x, y, c2);
  }
  vline(x, y0, y1, c2) {
    for (let y = Math.round(y0); y <= Math.round(y1); y++) this.px(x, y, c2);
  }
  line(x0, y0, x1, y1, c2) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (; ; ) {
      this.px(x0, y0, c2);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) {
        e += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        e += dx;
        y0 += sy;
      }
    }
  }
  disc(cx, cy, r2, c2) {
    for (let y = Math.floor(-r2); y <= r2; y++) for (let x = Math.floor(-r2); x <= r2; x++) if (x * x + y * y <= r2 * r2 + r2 * 0.8) this.px(cx + x, cy + y, c2);
  }
  // 抖动填充：f(x,y) 返回 0..1，按 Bayer 在 a/b 两色之间取
  dither(x0, y0, w, h, f, a, b) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x0 + x, Y = y0 + y;
      this.px(X, Y, bayer(X, Y) < f(X, Y) ? b : a);
    }
  }
  // 竖向多色抖动渐变
  gradV(x0, y0, w, h, cols) {
    const n = cols.length - 1;
    for (let y = 0; y < h; y++) {
      const v = y / Math.max(1, h - 1) * n, b = Math.min(n - 1, Math.floor(v)), f = v - b;
      for (let x = 0; x < w; x++) this.px(x0 + x, y0 + y, cols[bayer(x0 + x, y0 + y) < f ? b + 1 : b]);
    }
  }
  blit(src, dx, dy, flip = false, map = null) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      let c2 = src.d[y * src.w + (flip ? src.w - 1 - x : x)];
      if (c2 === T) continue;
      if (map) {
        c2 = map[c2];
        if (c2 === void 0 || c2 === T) continue;
      }
      this.px(dx + x, dy + y, c2);
    }
  }
  copy(src, sx, sy, sw, sh, dx, dy) {
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const c2 = src.get(sx + x, sy + y);
      if (c2 !== T) this.px(dx + x, dy + y, c2);
    }
  }
};
function sprFromRows(rows, map) {
  const h = rows.length, w = Math.max(...rows.map((r2) => r2.length)), d = new Uint8Array(w * h).fill(T);
  rows.forEach((r2, y) => {
    for (let x = 0; x < r2.length; x++) {
      const ch = r2[x];
      if (ch === "." || ch === " ") continue;
      const c2 = map[ch];
      if (c2 === void 0) throw new Error("sprite char " + ch);
      d[y * w + x] = c2;
    }
  });
  return { w, h, d };
}
function makeOut(canvas) {
  const lo = document.createElement("canvas");
  lo.width = W;
  lo.height = H;
  const g = lo.getContext("2d");
  const img = g.createImageData(W, H);
  const u32 = new Uint32Array(img.data.buffer);
  const o = canvas.getContext("2d");
  o.imageSmoothingEnabled = false;
  return {
    lo,
    u32,
    present(fb2, lut, lutB = null, pick = null) {
      const d = fb2.d;
      if (!lutB) for (let i = 0; i < d.length; i++) u32[i] = lut[d[i]];
      else for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) u32[i] = (pick(x, y) ? lutB : lut)[d[i]];
      g.putImageData(img, 0, 0);
    },
    post(fn) {
      fn(u32);
      g.putImageData(img, 0, 0);
    },
    // RGB 级后处理（马赛克、旋涡）
    show() {
      o.drawImage(lo, 0, 0, W * SCALE, H * SCALE);
    }
  };
}
function mosaic(u32, n) {
  if (n <= 1) return;
  const src = u32.slice();
  const ox = W / 2 % n, oy = H / 2 % n;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bx = Math.max(0, Math.floor((x - ox) / n) * n + ox), by = Math.max(0, Math.floor((y - oy) / n) * n + oy);
    u32[y * W + x] = src[Math.min(H - 1, by) * W + Math.min(W - 1, bx)];
  }
}

// page/font.js
var G = {};
var def = (ch, ...rows) => {
  G[ch] = rows;
};
def("A", ".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#");
def("B", "####.", "#...#", "#...#", "####.", "#...#", "#...#", "####.");
def("C", ".###.", "#...#", "#....", "#....", "#....", "#...#", ".###.");
def("D", "####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####.");
def("E", "#####", "#....", "#....", "####.", "#....", "#....", "#####");
def("F", "#####", "#....", "#....", "####.", "#....", "#....", "#....");
def("G", ".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####");
def("H", "#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#");
def("I", "###", ".#.", ".#.", ".#.", ".#.", ".#.", "###");
def("J", "..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##..");
def("K", "#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#");
def("L", "#....", "#....", "#....", "#....", "#....", "#....", "#####");
def("M", "#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#");
def("N", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#");
def("O", ".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###.");
def("P", "####.", "#...#", "#...#", "####.", "#....", "#....", "#....");
def("Q", ".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#");
def("R", "####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#");
def("S", ".####", "#....", "#....", ".###.", "....#", "....#", "####.");
def("T", "#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#..");
def("U", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###.");
def("V", "#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#..");
def("W", "#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#");
def("X", "#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#");
def("Y", "#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#..");
def("Z", "#####", "....#", "...#.", "..#..", ".#...", "#....", "#####");
def("a", "....", "....", ".##.", "...#", ".###", "#..#", ".###");
def("b", "#...", "#...", "###.", "#..#", "#..#", "#..#", "###.");
def("c", "...", "...", ".##", "#..", "#..", "#..", ".##");
def("d", "...#", "...#", ".###", "#..#", "#..#", "#..#", ".###");
def("e", "....", "....", ".##.", "#..#", "####", "#...", ".###");
def("f", "..#", ".#.", "###", ".#.", ".#.", ".#.", ".#.");
def("g", "....", "....", ".###", "#..#", "#..#", "#..#", ".###", "...#", ".##.");
def("h", "#...", "#...", "###.", "#..#", "#..#", "#..#", "#..#");
def("i", "#", ".", "#", "#", "#", "#", "#");
def("j", "..#", "...", "..#", "..#", "..#", "..#", "..#", "#.#", ".#.");
def("k", "#...", "#...", "#..#", "#.#.", "##..", "#.#.", "#..#");
def("l", "#.", "#.", "#.", "#.", "#.", "#.", ".#");
def("m", ".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#");
def("n", "....", "....", "###.", "#..#", "#..#", "#..#", "#..#");
def("o", "....", "....", ".##.", "#..#", "#..#", "#..#", ".##.");
def("p", "....", "....", "###.", "#..#", "#..#", "#..#", "###.", "#...", "#...");
def("q", "....", "....", ".###", "#..#", "#..#", "#..#", ".###", "...#", "...#");
def("r", "...", "...", "#.#", "##.", "#..", "#..", "#..");
def("s", "...", "...", ".##", "#..", ".#.", "..#", "##.");
def("t", ".#.", ".#.", "###", ".#.", ".#.", ".#.", "..#");
def("u", "....", "....", "#..#", "#..#", "#..#", "#..#", ".###");
def("v", ".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#..");
def("w", ".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#.");
def("x", "....", "....", "#..#", "#..#", ".##.", "#..#", "#..#");
def("y", "....", "....", "#..#", "#..#", "#..#", "#..#", ".###", "...#", ".##.");
def("z", "....", "....", "####", "...#", ".##.", "#...", "####");
def("0", ".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###.");
def("1", ".#.", "##.", ".#.", ".#.", ".#.", ".#.", "###");
def("2", ".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####");
def("3", "####.", "....#", "....#", ".###.", "....#", "....#", "####.");
def("4", "...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#.");
def("5", "#####", "#....", "####.", "....#", "....#", "#...#", ".###.");
def("6", ".###.", "#....", "#....", "####.", "#...#", "#...#", ".###.");
def("7", "#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#...");
def("8", ".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###.");
def("9", ".###.", "#...#", "#...#", ".####", "....#", "....#", ".###.");
def(".", ".", ".", ".", ".", ".", ".", "#");
def(",", "..", "..", "..", "..", "..", ".#", ".#", "#.");
def("!", "#", "#", "#", "#", "#", ".", "#");
def("?", ".###.", "#...#", "....#", "..##.", "..#..", ".....", "..#..");
def("'", "#", "#", ".", ".", ".", ".", ".");
def("-", "...", "...", "...", "###", "...", "...", "...");
def(":", ".", ".", "#", ".", ".", ".", "#");
def("/", "....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#....");
def("\xD7", ".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#");
def("\xB7", ".", ".", ".", "#", ".", ".", ".");
def("(", ".#", "#.", "#.", "#.", "#.", "#.", ".#");
def(")", "#.", ".#", ".#", ".#", ".#", ".#", "#.");
def("=", "....", "....", "####", "....", "####", "....", "....");
def("+", "...", "...", ".#.", "###", ".#.", "...", "...");
def("%", "##..#", "##.#.", "...#.", "..#..", ".#...", ".#.##", "#..##");
def("\u2665", ".....", "##.##", "#####", "#####", ".###.", "..#..", ".....");
def("\u25B6", "#...", "##..", "###.", "####", "###.", "##..", "#...");
def("\u25BC", ".....", ".....", "#####", ".###.", "..#..", ".....", ".....");
def(" ", "..", "..", "..", "..", "..", "..", "..");
def("\xE1", "..#.", ".#..", ".##.", "...#", ".###", "#..#", ".###");
def("\xE9", "..#.", ".#..", ".##.", "#..#", "####", "#...", ".###");
def("\xED", ".#", "#.", "#.", "#.", "#.", "#.", "#.");
def("\xF3", "..#.", ".#..", ".##.", "#..#", "#..#", "#..#", ".##.");
def("\xFA", "..#.", ".#..", "#..#", "#..#", "#..#", "#..#", ".###");
def("\xE8", ".#..", "..#.", ".##.", "#..#", "####", "#...", ".###");
def("\xE0", ".#..", "..#.", ".##.", "...#", ".###", "#..#", ".###");
def("\xE7", "...", "...", ".##", "#..", "#..", ".##", ".#.", "##.");
def("\xFC", "#..#", "....", "#..#", "#..#", "#..#", "#..#", ".###");
def("\xF1", ".#.#", "#.#.", "###.", "#..#", "#..#", "#..#", "#..#");
def("\xC1", ".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#");
def("\xC9", "#####", "#....", "#....", "####.", "#....", "#....", "#####");
def("\xCD", "###", ".#.", ".#.", ".#.", ".#.", ".#.", "###");
def("\xD3", ".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###.");
def("\xDA", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###.");
def("\xD1", "#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#");
def("\xBF", "..#..", ".....", "..#..", ".##..", "#....", "#...#", ".###.");
def("\xA1", "#", ".", "#", "#", "#", "#", "#");
def('"', "#.#", "#.#", "...", "...", "...", "...", "...");
def("\u2026", ".....", ".....", ".....", ".....", ".....", ".....", "#.#.#");
def("\u2192", ".....", "..#..", "...#.", "#####", "...#.", "..#..", ".....");
def("$", "..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#..");
def("\u2713", ".....", "....#", "...#.", "#.#..", ".#...", ".....", ".....");
def("\u2013", "...", "...", "...", "###", "...", "...", "...");
G["\u2212"] = G["-"];
G["\xAB"] = G['"'];
G["\xBB"] = G['"'];
G["\u201C"] = G['"'];
G["\u201D"] = G['"'];
G["\u2019"] = G["'"];
var ACC = { "\xC1": ["..#.", ".#.."], "\xC9": ["..#.", ".#.."], "\xCD": [".#", "#."], "\xD3": ["..#.", ".#.."], "\xDA": ["..#.", ".#.."], "\xD1": [".#.#", "#.#."] };
var glyphW = (ch) => (G[ch] || G["?"])[0].length;
function textW(s, sc = 1) {
  let w = 0;
  for (const ch of s) w += (glyphW(ch) + 1) * sc;
  return Math.max(0, w - sc);
}
function text(fb2, s, x0, y0, col, shadow = null, sc = 1) {
  let x = x0;
  for (const ch of s) {
    const g = G[ch] || G["?"];
    for (let y = 0; y < g.length; y++) for (let b = 0; b < g[y].length; b++) if (g[y][b] === "#") {
      if (shadow !== null) fb2.rect(x + b * sc + 1, y0 + y * sc + 1, sc, sc, shadow);
    }
    for (let y = 0; y < g.length; y++) for (let b = 0; b < g[y].length; b++) if (g[y][b] === "#") fb2.rect(x + b * sc, y0 + y * sc, sc, sc, typeof col === "function" ? col(y, b) : col);
    const a = ACC[ch];
    if (a) {
      const off = Math.floor((g[0].length - a[0].length) / 2) + 1;
      for (let y = 0; y < a.length; y++) for (let b = 0; b < a[y].length; b++) if (a[y][b] === "#") {
        if (shadow !== null) fb2.rect(x + (b + off) * sc + 1, y0 + (y - 3) * sc + 1, sc, sc, shadow);
        fb2.rect(x + (b + off) * sc, y0 + (y - 3) * sc, sc, sc, typeof col === "function" ? col(0, b) : col);
      }
    }
    x += (g[0].length + 1) * sc;
  }
  return x;
}
function textOutlined(fb2, s, x0, y0, col, outline, sc = 2) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2], [1, 2], [-1, 2]]) text(fb2, s, x0 + dx, y0 + dy, outline, null, sc);
  return text(fb2, s, x0, y0, col, null, sc);
}
function wrap(s, maxW) {
  const words = s.split(" "), lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (textW(t) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// page/ui.js
function win(fb2, x, y, w, h, skin = "snes") {
  if (skin === "gb") {
    const [K2, D2, Lg, Wt] = GBI;
    fb2.rect(x + 1, y, w - 2, h, K2);
    fb2.rect(x, y + 1, w, h - 2, K2);
    fb2.rect(x + 1, y + 1, w - 2, h - 2, D2);
    fb2.rect(x + 2, y + 2, w - 4, h - 4, Wt);
    return;
  }
  if (skin === "nes") {
    fb2.rect(x + 1, y, w - 2, h, C.ink);
    fb2.rect(x, y + 1, w, h - 2, C.ink);
    fb2.rect(x + 2, y + 2, w - 4, h - 4, C.white);
    fb2.rect(x + 4, y + 4, w - 8, h - 8, C.ink);
    fb2.px(x + 2, y + 2, C.ink);
    fb2.px(x + w - 3, y + 2, C.ink);
    fb2.px(x + 2, y + h - 3, C.ink);
    fb2.px(x + w - 3, y + h - 3, C.ink);
    return;
  }
  fb2.rect(x + 2, y, w - 4, h, C.ink);
  fb2.rect(x, y + 2, w, h - 4, C.ink);
  fb2.rect(x + 1, y + 1, w - 2, h - 2, C.ink);
  fb2.rect(x + 2, y + 1, w - 4, h - 2, C.white);
  fb2.rect(x + 1, y + 2, w - 2, h - 4, C.white);
  fb2.rect(x + 2, y + 2, w - 4, h - 4, C.silver);
  fb2.gradV(x + 3, y + 3, w - 6, h - 6, [C.blue, C.navy, C.navy, C.night]);
  fb2.hline(x + 3, x + w - 4, y + 3, C.blue);
}
var HAND = sprFromRows([
  ".kk......",
  "kwwk.....",
  "kwwwkkkk.",
  "kwwwwwwwk",
  "kwwwwkkk.",
  "kwwwwk...",
  ".kkkk...."
], { k: C.ink, w: C.white });
function hand(fb2, x, y, t, bob = true) {
  fb2.blit(HAND, x + (bob && Math.floor(t * 4) % 2 ? 1 : 0), y);
}
var HEADA = sprFromRows(["..kkk..", ".khhhk.", "khhhhhk", "khfffhk", "kfefefk", ".kfffk.", "..kkk.."], { k: C.ink, h: C.dbrown, f: C.skin, e: C.ink });
var HEADW = sprFromRows(["..kkk..", ".khhhk.", "khhhhhk", "khfffhk", "hfefefh", "hkfffkh", "h.kkk.h"], { k: C.ink, h: C.rust, f: C.skin, e: C.ink });

// page/chispa.js
function head(fb2, cx, cy, r2, { talk = 0, blink = false, surprise = 0 } = {}) {
  fb2.disc(cx, cy, r2 + 1, C.ink);
  fb2.disc(cx, cy, r2, C.yellow);
  for (let y = -r2; y <= r2; y++) for (let x = -r2; x <= r2; x++) {
    if (x * x + y * y > r2 * r2) continue;
    const k = (x + y) / (r2 * 1.4);
    if (k > 0.78) fb2.px(cx + x, cy + y, C.amber);
    else if (k > 0.5 && bayer(cx + x, cy + y) < (k - 0.5) / 0.3) fb2.px(cx + x, cy + y, C.amber);
  }
  const s = r2 / 10, z = Math.max(1, Math.round(s)), P = (x, y, c2) => fb2.rect(Math.round(cx + x * s), Math.round(cy + y * s), z, z, c2);
  P(-6, -6, C.white);
  P(-5, -6, C.white);
  P(-6, -5, C.white);
  for (const ex of [-4, 3]) {
    if (blink) {
      for (let i = 0; i < 3; i++) P(ex + i, -1, C.ink);
    } else if (surprise) {
      P(ex + 1, -2, C.ink);
      P(ex + 1, -1, C.ink);
    } else {
      P(ex, -2, C.ink);
      P(ex + 1, -1, C.ink);
      P(ex + 2, -2, C.ink);
    }
  }
  P(1, 0, C.ink);
  P(0, 1, C.ink);
  P(1, 2, C.ink);
  if (talk > 0.15) {
    const h = talk > 0.55 ? 3 : 2;
    for (let y = 0; y < h; y++) for (let x = -3; x <= 3; x++) if (!(y === h - 1 && Math.abs(x) === 3)) P(x, 4 + y, y === 0 ? C.red : C.crimson);
  } else {
    P(-4, 4, C.red);
    for (let x = -3; x <= 3; x++) P(x, 5, C.red);
    P(4, 4, C.red);
  }
}
function chispa(fb2, x, floor, o = {}) {
  const t = o.t || 0, s = o.s || 1;
  const bob = o.bob !== void 0 ? o.bob : Math.floor(t * 2.4) % 2 === 0 ? 0 : 1;
  const hop = Math.round((o.hop || 0) * 6);
  const y0 = floor - hop * s;
  const R = (dx, dy, w2, h, c2) => fb2.rect(x + dx * s, y0 + dy * s, w2 * s, h * s, c2);
  for (let i = -6; i <= 6; i++) if (Math.abs(i) < 6 - hop) fb2.px(x + i * s, floor + 1, C.ink);
  R(-6, -9, 12, 9, C.ink);
  R(-5, -8, 10, 7, C.amber);
  for (const yy of [-7, -5, -3]) R(-5, yy, 10, 1, C.dbrown);
  R(-4, -1, 8, 1, C.ink);
  const w = o.wave || 0, ang = w ? Math.sin(t * 12) * 0.5 - 0.9 : -0.35;
  const ax = x + 9 * s, ay = y0 - (16 + bob) * s;
  for (let i = 0; i <= 7 * s; i++) {
    const px = Math.round(ax + Math.cos(ang) * i), py = Math.round(ay + Math.sin(ang) * i);
    fb2.rect(px - s, py - s, 3 * s, 3 * s, C.ink);
  }
  for (let i = 1; i <= 6 * s; i++) {
    const px = Math.round(ax + Math.cos(ang) * i), py = Math.round(ay + Math.sin(ang) * i);
    fb2.rect(px, py, s, s, C.yellow);
  }
  const blink = t % 3.3 < 0.12;
  head(fb2, x, y0 - (19 + bob) * s, 10 * s, { talk: o.talk || 0, blink, surprise: o.surprise || 0 });
}
function portrait(fb2, x, y, o = {}) {
  fb2.gradV(x, y, 32, 32, [C.navy, C.night]);
  head(fb2, x + 16, y + 17, 13, { talk: o.talk || 0, blink: (o.t || 0) % 3.3 < 0.12 });
}

// page/iconos_data.js
var c = (cx, cy, r2) => `M${cx - r2},${cy} a${r2},${r2} 0 1,0 ${2 * r2},0 a${r2},${r2} 0 1,0 ${-2 * r2},0`;
var r = (x, y, w, h, k = 16) => `M${x + k},${y} H${x + w - k} Q${x + w},${y} ${x + w},${y + k} V${y + h - k} Q${x + w},${y + h} ${x + w - k},${y + h} H${x + k} Q${x},${y + h} ${x},${y + h - k} V${y + k} Q${x},${y} ${x + k},${y} Z`;
var ICONOS = {
  burbuja: [
    { d: c(0, 10, 150), f: "LB" },
    { d: "M-100,-30 A110,110 0 0 1 -40,-95", w: 12, s: "W" },
    { d: c(150, -140, 30), f: "LB" },
    { d: c(185, -80, 14), f: "PU" },
    { d: c(70, 70, 18), f: "PU" }
  ],
  banco: [
    { d: "M-175,-55 L0,-170 L175,-55 Z", f: "Y" },
    { d: c(0, -95, 20), f: "R" },
    { d: "M-160,-40 H160" },
    { d: "M-145,-30 H-95 V120 H-145 Z M-65,-30 H-15 V120 H-65 Z M15,-30 H65 V120 H15 Z M95,-30 H145 V120 H95 Z", f: "GR", w: 8 },
    { d: "M-175,135 H175 M-195,165 H195" }
  ],
  personas: [-125, 0, 125].flatMap((x, i) => [
    { d: `M${x - 70},150 Q${x - 70},15 ${x},15 Q${x + 70},15 ${x + 70},150 Z`, f: ["B", "R", "G"][i] },
    { d: c(x, -55, i === 1 ? 46 : 38), f: "S" }
  ]),
  balanza: [
    { d: "M0,-150 V150 M-95,155 H95", s: "M" },
    { d: c(0, -160, 16), f: "Y" },
    { d: "M-165,-105 H165" },
    { d: "M-165,-105 L-215,20 M-165,-105 L-115,20 M165,-105 L115,20 M165,-105 L215,20", w: 6 },
    { d: "M-222,20 Q-165,75 -108,20 Z", f: "R" },
    { d: "M108,20 Q165,75 222,20 Z", f: "B" }
  ],
  ciclo: [
    { d: "M-131.6,-47.9 A140,140 0 0 1 131.6,-47.9", w: 14, s: "B" },
    { d: "M142.5,-99.8 L131.6,-47.9 L89.9,-80.6", w: 14, s: "B" },
    { d: "M131.6,47.9 A140,140 0 0 1 -131.6,47.9", w: 14, s: "R" },
    { d: "M-89.9,80.6 L-131.6,47.9 L-142.5,99.8", w: 14, s: "R" },
    { d: c(0, 0, 46), f: "Y" },
    { d: "M14,-18 Q0,-26 -12,-18 Q-22,-8 -6,-2 L8,4 Q22,12 12,22 Q0,28 -16,18 M0,-32 V32", w: 7 }
  ],
  barco: [
    { d: "M-180,60 L180,60 L130,140 L-130,140 Z", f: "M" },
    { d: "M0,60 V-175", s: "M" },
    { d: "M12,-160 L150,30 L12,30 Z", f: "R" },
    { d: "M-12,-130 L-125,30 L-12,30 Z", f: "W" },
    { d: "M0,-175 L55,-160 L0,-145", f: "Y" },
    { d: "M-210,180 q26,-20 52,0 t52,0 t52,0 t52,0 t52,0 t52,0 t52,0 t52,0", w: 9, s: "B" }
  ],
  manzana: [
    { d: "M0,-80 C-60,-130 -170,-100 -165,10 C-160,110 -80,170 -40,160 C-20,155 -10,148 0,148 C10,148 20,155 40,160 C80,170 160,110 165,10 C170,-100 60,-130 0,-80 Z", f: "R" },
    { d: "M0,-80 Q5,-130 30,-165", w: 12, s: "M" },
    { d: "M14,-118 Q62,-172 112,-140 Q62,-100 14,-118 Z", f: "G" },
    { d: "M-110,-20 Q-115,30 -90,70", w: 9, s: "W" }
  ],
  dinero: [
    { d: r(-185, -105, 370, 210, 22), f: "LG" },
    { d: r(-160, -80, 320, 160, 14), w: 5, s: "G" },
    { d: c(0, 0, 62), f: "W" },
    { d: "M28,-32 Q0,-52 -24,-38 Q-44,-18 -14,-4 L14,6 Q44,20 24,40 Q0,54 -30,34 M0,-62 V62", w: 10, s: "G" },
    { d: c(165, 115, 50), f: "Y" }
  ],
  chip: [
    { d: r(-115, -115, 230, 230, 20), f: "G" },
    { d: r(-60, -60, 120, 120, 10), f: "Y" },
    { d: [-75, -25, 25, 75].map((x) => `M${x},-115 V-170 M${x},115 V170 M-115,${x} H-170 M115,${x} H170`).join(" "), s: "O" }
  ],
  servidor: [
    ...[-165, -50, 65].flatMap((y, i) => [
      { d: r(-155, y, 310, 95, 16), f: "GR" },
      { d: `M-115,${y + 47} H25`, w: 8 },
      { d: c(108, y + 47, 13), f: ["G", "Y", "R"][i] }
    ]),
    { d: "M-120,160 V190 M120,160 V190 M-150,190 H150" }
  ],
  rayo: [{ d: "M35,-195 L-115,20 L-5,20 L-45,195 L125,-45 L15,-45 L65,-195 Z", f: "Y" }, { d: "M-160,-120 l30,10 M160,90 l-30,-10 M-150,120 l25,-15", w: 9, s: "O" }],
  lupa: [
    { d: c(-30, -30, 125), f: "LB" },
    { d: "M-105,-45 A80,80 0 0 1 -50,-105", w: 10, s: "W" },
    { d: "M60,60 L175,175", w: 30, s: "M" }
  ],
  ordenador: [
    { d: r(-185, -155, 370, 250, 18), f: "GR" },
    { d: r(-155, -125, 310, 190, 8), w: 5, f: "LB" },
    { d: "M-115,30 L-55,-35 L-5,5 L55,-70 L115,-25", w: 12, s: "R" },
    { d: "M-30,95 L-45,155 M30,95 L45,155 M-105,160 H105" }
  ],
  mundo: [
    { d: c(0, 0, 165), f: "B" },
    { d: "M-90,-60 Q-40,-90 0,-50 Q-20,0 -70,10 Q-110,-20 -90,-60 Z", f: "G" },
    { d: "M40,30 Q90,10 110,60 Q80,110 40,90 Z", f: "G" },
    { d: "M0,-165 C-95,-100 -95,100 0,165 C95,100 95,-100 0,-165", w: 6, s: "W" },
    { d: "M-165,0 H165", w: 6, s: "W" }
  ],
  bombilla: [
    { d: "M-90,40 C-150,-20 -130,-170 0,-170 C130,-170 150,-20 90,40 C70,60 60,80 60,100 L-60,100 C-60,80 -70,60 -90,40 Z", f: "Y" },
    { d: "M-35,100 L-35,20 L-15,-20 L0,10 L15,-20 L35,20 L35,100", w: 8, s: "O" },
    { d: "M-58,128 H58 M-50,155 H50 M-28,180 H28", w: 12, s: "GR" },
    { d: "M0,-205 V-245 M-140,-140 L-168,-168 M140,-140 L168,-168 M-185,-40 H-225 M185,-40 H225", w: 12, s: "O" }
  ],
  grafica_baja: [
    { d: "M-175,-170 V160 H185" },
    { d: r(-140, -60, 50, 220, 6), f: "B" },
    { d: r(-70, 0, 50, 160, 6), f: "G" },
    { d: r(0, 50, 50, 110, 6), f: "O" },
    { d: r(70, 110, 50, 50, 6), f: "R" },
    { d: "M-150,-140 L-60,-80 L0,-100 L160,95", w: 14, s: "R" },
    { d: "M110,92 L160,95 L152,45", w: 14, s: "R" }
  ],
  ola: [
    { d: "M-200,40 Q-150,-130 -20,-120 Q90,-110 70,-20 Q40,-70 -10,-40 Q-40,-10 0,40 Z", f: "B" },
    { d: "M-200,40 Q-120,10 -60,40 Q0,70 60,40 Q120,10 200,40 V170 H-200 Z", f: "LB" },
    { d: "M-150,-60 Q-90,-110 -20,-100", w: 10, s: "W" },
    { d: "M-160,100 Q-110,80 -60,100 M20,120 Q70,100 120,120", w: 8, s: "W" }
  ],
  sal: [
    { d: "M-80,-90 L80,-90 L100,150 Q0,175 -100,150 Z", f: "W" },
    { d: "M-80,-90 Q-80,-190 0,-190 Q80,-190 80,-90 Z", f: "GR" },
    { d: c(-30, -150, 9) + " " + c(0, -165, 9) + " " + c(30, -150, 9) + " " + c(0, -130, 9), f: "K" },
    { d: r(-60, -10, 120, 90, 14), f: "LB" },
    { d: "M-30,35 H30", w: 10, s: "B" },
    { d: "M-150,170 L-140,160 M150,170 L140,160 M-170,120 L-160,112 M175,115 L163,110", w: 10, s: "GR" }
  ],
  vaso: [
    { d: "M-110,-150 L110,-150 L85,170 L-85,170 Z", f: "W" },
    { d: "M-100,-60 L100,-60 L85,165 L-85,165 Z", f: "LB" },
    { d: "M-60,-230 Q60,-260 95,-200 L60,-180 Q30,-215 -40,-200 Z", f: "GR" },
    { d: "M-30,-120 L-20,-130 M10,-150 L20,-160 M40,-110 L48,-122", w: 12, s: "GR" },
    { d: "M-60,-30 V120", w: 10, s: "W" }
  ],
  montana: [
    { d: "M-210,160 L-60,-150 L40,30 L110,-70 L220,160 Z", f: "G" },
    { d: "M-60,-150 L-105,-55 L-75,-70 L-50,-40 L-25,-80 Z", f: "W" },
    { d: "M110,-70 L80,-15 L105,-25 L130,-10 Z", f: "W" },
    { d: "M-40,160 Q-10,90 30,100 Q70,110 60,160 Z", f: "LB" },
    { d: "M-150,120 L-120,120 M150,130 L180,130", w: 8, s: "M" }
  ],
  nube: [
    { d: "M-160,40 Q-200,-40 -120,-60 Q-110,-150 -10,-140 Q50,-200 110,-120 Q200,-120 180,-30 Q220,40 140,50 Z", f: "GR" },
    { d: "M-120,90 L-140,140 M-50,90 L-70,140 M20,90 L0,140 M90,90 L70,140 M-90,160 L-105,200 M50,160 L35,200", w: 14, s: "B" },
    { d: "M-110,-20 Q-80,-60 -40,-50", w: 10, s: "W" }
  ],
  gota: [
    { d: "M0,-190 Q-150,0 -130,70 Q-110,180 0,180 Q110,180 130,70 Q150,0 0,-190 Z", f: "LB" },
    { d: "M-70,60 Q-75,120 -20,140", w: 14, s: "W" }
  ],
  sol: [
    { d: c(0, 0, 95), f: "Y" },
    { d: "M0,-130 V-200 M0,130 V200 M-130,0 H-200 M130,0 H200 M-92,-92 L-142,-142 M92,92 L142,142 M-92,92 L-142,142 M92,-92 L142,-142", w: 18, s: "O" },
    { d: "M-45,-40 Q-20,-70 15,-60", w: 10, s: "W" }
  ],
  pez: [
    { d: "M-150,0 Q-60,-110 70,-40 L170,-110 L150,0 L170,110 L70,40 Q-60,110 -150,0 Z", f: "O" },
    { d: "M-40,-60 Q0,0 -40,60", w: 8, s: "R" },
    { d: c(-95, -15, 14), f: "K" },
    { d: "M-60,-150 Q-40,-170 -20,-150 M20,-180 Q35,-195 50,-180", w: 8, s: "LB" }
  ],
  edificio: [
    { d: r(-90, -200, 180, 380, 6), f: "GR" },
    { d: "M-90,180 H90", w: 12 },
    ...[-160, -110, -60, -10, 40, 90].flatMap((y) => [-55, -10, 35].map((x) => ({ d: r(x, y, 26, 30, 3), f: "Y" }))),
    { d: "M-200,180 H200", w: 10, s: "M" },
    { d: "M-185,180 L-185,-30 L-115,-30 L-115,180", f: "B" }
  ],
  capsula: [
    { d: "M-190,40 Q-150,-60 0,-80 Q150,-60 190,40 Z", f: "GR" },
    { d: "M-200,40 H200 Q190,90 0,100 Q-190,90 -200,40 Z", f: "K" },
    { d: "M-120,-20 Q0,-60 120,-20", w: 10, s: "W" },
    { d: c(0, -30, 18), f: "LB" },
    { d: "M-180,70 Q0,85 180,70", w: 8, s: "O" }
  ],
  cohete: [
    { d: "M0,-200 Q70,-120 60,80 L-60,80 Q-70,-120 0,-200 Z", f: "W" },
    { d: c(0, -60, 28), f: "LB" },
    { d: "M-60,20 L-120,110 L-60,90 Z M60,20 L120,110 L60,90 Z", f: "R" },
    { d: "M-40,90 Q0,220 40,90 Z", f: "O" },
    { d: "M-20,95 Q0,170 20,95 Z", f: "Y" }
  ],
  fuego: [
    { d: "M0,-200 Q120,-60 110,60 Q100,170 0,180 Q-100,170 -110,60 Q-120,-40 -40,-110 Q-30,-40 0,-30 Q-10,-120 0,-200 Z", f: "R" },
    { d: "M0,-60 Q70,20 60,90 Q50,150 0,155 Q-50,150 -60,90 Q-65,30 -10,0 Z", f: "O" },
    { d: "M0,40 Q35,80 30,120 Q20,150 0,150 Q-20,150 -30,120 Q-30,90 0,40 Z", f: "Y" }
  ],
  caja: [
    { d: "M-150,-60 L0,-130 L150,-60 L0,10 Z", f: "O" },
    { d: "M-150,-60 L0,10 L0,170 L-150,100 Z", f: "M" },
    { d: "M150,-60 L0,10 L0,170 L150,100 Z", f: "O" },
    { d: "M-75,-95 L75,-25", w: 14, s: "Y" }
  ],
  bomba: [
    { d: r(-45, -120, 90, 280, 20), f: "R" },
    { d: "M0,-120 V-190 M-80,-195 H80", w: 22 },
    { d: r(-110, 160, 220, 30, 10), f: "GR" },
    { d: "M45,100 Q140,90 150,-20 Q155,-80 120,-110", w: 12, s: "K" },
    { d: "M-90,-60 L-120,-80 M-95,0 L-135,0 M-90,60 L-120,80", w: 10, s: "O" }
  ],
  escudo: [
    { d: "M-200,-40 Q0,-110 200,-40 L180,20 Q0,-40 -180,20 Z", f: "GR" },
    { d: "M-180,20 Q0,-40 180,20 Q170,120 0,150 Q-170,120 -180,20 Z", f: "K" },
    { d: "M-150,60 Q0,10 150,60", w: 10, s: "O" },
    { d: "M-110,190 L-80,150 M0,215 V170 M110,190 L80,150", w: 14, s: "O" }
  ],
  estrella: [
    { d: "M200,-200 L-60,60", w: 34, s: "LB" },
    { d: "M150,-170 L-60,60", w: 18, s: "W" },
    { d: "M-60,-10 L-35,40 L20,48 L-20,85 L-10,140 L-60,112 L-110,140 L-100,85 L-140,48 L-85,40 Z", f: "Y" }
  ],
  paracaidas: [
    { d: "M-190,-40 Q0,-260 190,-40 Q130,-75 95,-40 Q50,-80 0,-40 Q-50,-80 -95,-40 Q-130,-75 -190,-40 Z", f: "O" },
    { d: "M-95,-40 Q0,-210 95,-40", w: 10, s: "W" },
    { d: "M-190,-40 L-40,120 M-95,-40 L-20,120 M0,-40 V120 M95,-40 L20,120 M190,-40 L40,120", w: 5 },
    { d: "M-70,120 Q0,90 70,120 L60,160 L-60,160 Z", f: "GR" }
  ]
};

// page/raster.js
var FILL = { R: C.red, K: C.ink, W: C.white, Y: C.yellow, B: C.blue, LB: C.cyan, G: C.green, LG: C.lime, O: C.orange, PU: C.rose, T: C.cyan, S: C.skin, M: C.brown, GR: C.silver };
var cache = /* @__PURE__ */ new Map();
function iconSprite(name, size, p = 1) {
  const key = name + size + ":" + Math.round(p * 12);
  if (cache.has(key)) return cache.get(key);
  const els = ICONOS[name] || ICONOS.bombilla, n = els.length, S = size;
  const cv2 = new OffscreenCanvas(S, S), g = cv2.getContext("2d", { willReadFrequently: true });
  const d = new Uint8Array(S * S).fill(T);
  const k = S / 440;
  els.forEach((e, i) => {
    const a = i / n * 0.6, q2 = Math.max(0, Math.min(1, (p - a) / (0.4 + 0.4 / n)));
    if (q2 <= 0) return;
    const path = new Path2D(e.d);
    if (e.f && q2 > 0.7) {
      g.clearRect(0, 0, S, S);
      g.save();
      g.translate(S / 2, S / 2);
      g.scale(k, k);
      g.fillStyle = "#fff";
      g.fill(path);
      g.restore();
      const px2 = g.getImageData(0, 0, S, S).data;
      for (let j = 0; j < S * S; j++) if (px2[j * 4 + 3] > 140) d[j] = FILL[e.f];
    }
    g.clearRect(0, 0, S, S);
    g.save();
    g.translate(S / 2, S / 2);
    g.scale(k, k);
    g.lineWidth = Math.max((e.w || 10) * 1, 2.2 / k);
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = "#fff";
    if (q2 < 1) {
      g.setLineDash([2e3 * q2, 4e3]);
    }
    g.stroke(path);
    g.restore();
    const px = g.getImageData(0, 0, S, S).data;
    const col = e.s ? FILL[e.s] : C.ink;
    for (let j = 0; j < S * S; j++) if (px[j * 4 + 3] > 120) d[j] = col;
  });
  const o = d.slice();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (d[y * S + x] !== T) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= S || Y >= S) continue;
      const c2 = d[Y * S + X];
      if (c2 !== T && c2 !== C.ink) {
        o[y * S + x] = C.ink;
        break;
      }
    }
  }
  const spr = { w: S, h: S, d: o };
  cache.set(key, spr);
  return spr;
}
var fotos = {};
async function loadPhotos(names) {
  await Promise.all(names.map(async (n) => {
    const img = new Image();
    img.src = `./fotos/${n}.jpg`;
    await img.decode();
    fotos[n] = img;
  }));
}
var usable = [...Array(NPAL).keys()].filter((i) => !PROTECT.has(i));
function nearestIdx(r2, g, b) {
  let best = 0, bd = 1e9;
  for (const i of usable) {
    const c2 = RGB[i];
    const dd = (r2 - c2[0]) ** 2 * 0.3 + (g - c2[1]) ** 2 * 0.59 + (b - c2[2]) ** 2 * 0.11;
    if (dd < bd) {
      bd = dd;
      best = i;
    }
  }
  return best;
}
function photoSprite(name, w, h, pos = 0.5, zoom = 1) {
  const key = `${name}:${w}x${h}:${pos}:${zoom.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key);
  const img = fotos[name];
  const cv2 = new OffscreenCanvas(w, h), g = cv2.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingQuality = "high";
  const sc = Math.max(w / img.width, h / img.height) * zoom, sw = w / sc, sh = h / sc;
  const sx = (img.width - sw) / 2, sy = (img.height - sh) * pos;
  g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data, d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = (y * w + x) * 4, e = (bayer(x, y) - 0.5) * 34;
    d[y * w + x] = nearestIdx(px[j] + e, px[j + 1] + e, px[j + 2] + e);
  }
  const spr = { w, h, d };
  cache.set(key, spr);
  return spr;
}

// page/lugares.js
var VERT2 = H > W;
var FLOOR = VERT2 ? 205 : 128;
var sky = (fb2, cols, h = FLOOR) => fb2.gradV(0, 0, W, h, cols);
var layer = (cam, f) => Math.round(cam * f);
function slots(cam, f, slot, fn) {
  const o = layer(cam, f), i0 = Math.floor(o / slot) - 1, i1 = Math.ceil((o + W) / slot) + 1;
  for (let i = i0; i <= i1; i++) fn(i, i * slot - o);
}
function stars(fb2, t, n = 40, hmax = FLOOR - 40) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i, 3) * W), y = Math.floor(hash(i, 7) * hmax);
    if (hash(i, Math.floor(t * 2 + i)) > 0.15) fb2.px(x, y, hash(i, 9) > 0.7 ? C.yellow : C.white);
  }
}
function ground(fb2, cam, top, bot, line, f = 1, tile = 16) {
  fb2.rect(0, top, W, H - top, top === FLOOR ? bot : bot);
  fb2.hline(0, W - 1, top, line);
  const o = layer(cam, f);
  for (let x = -(o % tile + tile) % tile; x < W; x += tile) fb2.vline(x, top + 1, Math.min(H - 1, top + 6), line);
}
function hoy(fb2, cam, t) {
  sky(fb2, [C.night, C.navy, C.plum, C.rose, C.orange]);
  stars(fb2, t, 30, FLOOR * 0.45);
  fb2.disc(Math.round(W * 0.72 - layer(cam, 0.05)), FLOOR - 26, 13, C.amber);
  fb2.disc(Math.round(W * 0.72 - layer(cam, 0.05)), FLOOR - 26, 10, C.yellow);
  slots(cam, 0.25, 22, (i, x) => {
    const h = 24 + Math.floor(hash(i, 1) * 46), w = 14 + Math.floor(hash(i, 2) * 8);
    fb2.rect(x, FLOOR - 8 - h, w, h + 8, C.dslate);
    for (let wy = FLOOR - 4 - h; wy < FLOOR - 10; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (hash(i * 31 + wx, wy) > 0.55) fb2.px(wx, wy, C.amber);
  });
  slots(cam, 0.55, 70, (i, x) => {
    if (hash(i, 5) > 0.5) {
      fb2.rect(x, FLOOR - 34, 54, 34, C.slate);
      fb2.rect(x, FLOOR - 36, 54, 2, C.ink);
      for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 9; c2++) fb2.px(x + 4 + c2 * 6, FLOOR - 30 + r2 * 7, hash(i * 9 + c2, r2 + Math.floor(t * 3)) > 0.4 ? C.cyan : C.teal);
      fb2.vline(x + 44, FLOOR - 52, FLOOR - 36, C.ink);
      fb2.px(x + 44, FLOOR - 53, Math.floor(t * 2) % 2 ? C.red : C.crimson);
    } else {
      const h = 40 + Math.floor(hash(i, 6) * 30);
      fb2.rect(x + 8, FLOOR - h, 26, h, C.dslate);
      fb2.rect(x + 8, FLOOR - h, 26, 2, C.ink);
      for (let wy = FLOOR - h + 5; wy < FLOOR - 4; wy += 6) for (let wx = x + 11; wx < x + 32; wx += 5) fb2.rect(wx, wy, 2, 3, hash(wx, wy) > 0.5 ? C.yellow : C.night);
    }
  });
  ground(fb2, cam, FLOOR, C.slate, C.ink, 1);
  fb2.rect(0, FLOOR + 6, W, H, C.dslate);
}
function mercado(fb2, cam, t) {
  sky(fb2, [C.blue, C.blue, C.cyan]);
  slots(cam, 0.1, 90, (i, x) => {
    const y = 14 + Math.floor(hash(i, 2) * 30);
    for (const [dx, r2] of [[0, 7], [9, 9], [19, 6]]) fb2.disc(x + dx + Math.round(t * 2) % 90, y, r2, C.white);
  });
  slots(cam, 0.4, 44, (i, x) => {
    const h = 34 + Math.floor(hash(i, 3) * 20);
    fb2.rect(x + 2, FLOOR - h, 38, h, hash(i, 4) > 0.5 ? C.sand : C.tan);
    fb2.rect(x + 2, FLOOR - h, 38, 1, C.ink);
    for (let k = 0; k < 12; k++) fb2.hline(x + 2 + k, x + 39 - k, FLOOR - h - k, k < 1 ? C.ink : C.crimson);
    fb2.rect(x + 16, FLOOR - 14, 9, 14, C.dbrown);
    fb2.rect(x + 6, FLOOR - h + 8, 6, 6, C.navy);
    fb2.rect(x + 29, FLOOR - h + 8, 6, 6, C.navy);
  });
  slots(cam, 0.8, 64, (i, x) => {
    if (hash(i, 8) < 0.45) return;
    for (let s = 0; s < 6; s++) fb2.rect(x + s * 6, FLOOR - 26, 6, 7, s % 2 ? C.white : hash(i, 9) > 0.5 ? C.red : C.green);
    fb2.rect(x, FLOOR - 19, 36, 2, C.ink);
    fb2.vline(x + 1, FLOOR - 19, FLOOR, C.dbrown);
    fb2.vline(x + 34, FLOOR - 19, FLOOR, C.dbrown);
    fb2.rect(x + 3, FLOOR - 10, 30, 10, C.brown);
    for (let k = 0; k < 5; k++) fb2.disc(x + 7 + k * 6, FLOOR - 12, 2, [C.red, C.orange, C.lime, C.yellow, C.red][k]);
  });
  ground(fb2, cam, FLOOR, C.tan, C.brown, 1, 10);
  fb2.dither(0, FLOOR + 7, W, H - FLOOR - 7, (x, y) => 0.35, C.tan, C.clay);
}
function londres(fb2, cam, t) {
  sky(fb2, [C.silver, C.white, C.white], FLOOR - 26);
  slots(cam, 0.2, 40, (i, x) => {
    const h = 26 + Math.floor(hash(i, 3) * 22);
    fb2.rect(x + 4, FLOOR - 26 - h, 30, h, C.steel);
    for (let k = 0; k < 15; k++) fb2.hline(x + 4 + k, x + 33 - k, FLOOR - 26 - h - k, C.slate);
    for (let wy = FLOOR - 22 - h; wy < FLOOR - 30; wy += 7) {
      fb2.rect(x + 9, wy, 4, 4, C.dslate);
      fb2.rect(x + 24, wy, 4, 4, C.dslate);
    }
  });
  const bx = Math.round(W * 0.62 - layer(cam, 0.2));
  fb2.rect(bx, FLOOR - 70, 60, 44, C.white);
  for (let k = 0; k < 14; k++) fb2.hline(bx - 2 + k * 2, bx + 61 - k * 2, FLOOR - 70 - k, C.steel);
  for (let c2 = 0; c2 < 6; c2++) fb2.rect(bx + 4 + c2 * 10, FLOOR - 64, 4, 36, C.silver);
  fb2.rect(0, FLOOR - 26, W, 26, C.slate);
  for (let y = FLOOR - 26; y < FLOOR; y += 3) for (let x = 0; x < W; x++) if ((x + y * 3 + Math.floor(t * 6)) % 14 < 3) fb2.px(x, y, C.silver);
  slots(cam, 0.6, 110, (i, x) => {
    const bob = Math.round(Math.sin(t * 2 + i) * 1);
    fb2.rect(x + 10, FLOOR - 16 + bob, 46, 8, C.dbrown);
    for (let k = 0; k < 6; k++) fb2.hline(x + 10 + k, x + 55 - k, FLOOR - 8 + k + bob, C.dbrown);
    fb2.vline(x + 33, FLOOR - 60 + bob, FLOOR - 16 + bob, C.ink);
    for (let k = 0; k < 30; k++) fb2.hline(x + 34, x + 34 + Math.round(k * 0.6), FLOOR - 58 + k + bob, C.white);
    for (let k = 0; k < 22; k++) fb2.hline(x + 32 - Math.round(k * 0.7), x + 32, FLOOR - 50 + k + bob, C.white);
    fb2.rect(x + 33, FLOOR - 62 + bob, 6, 3, C.red);
  });
  fb2.rect(0, FLOOR, W, H - FLOOR, C.brown);
  const o = layer(cam, 1);
  for (let x = -(o % 12 + 12) % 12; x < W; x += 12) fb2.vline(x, FLOOR, H, C.dbrown);
  fb2.hline(0, W - 1, FLOOR, C.ink);
}
function datos(fb2, cam, t) {
  fb2.rect(0, 0, W, H, C.night);
  for (let x = 10; x < W; x += 40) fb2.rect(x - layer(cam, 0.1) % 40, 6, 22, 2, C.silver);
  slots(cam, 0.35, 30, (i, x) => {
    fb2.rect(x + 2, FLOOR - 70, 24, 64, C.ink);
    fb2.rect(x + 4, FLOOR - 68, 20, 60, C.dslate);
    for (let r2 = 0; r2 < 12; r2++) {
      fb2.hline(x + 5, x + 22, FLOOR - 66 + r2 * 5, C.night);
      fb2.px(x + 20, FLOOR - 65 + r2 * 5, hash(i * 13 + r2, Math.floor(t * 4 + hash(i, r2) * 7)) > 0.45 ? C.lime : C.green);
      fb2.px(x + 7, FLOOR - 65 + r2 * 5, hash(i, r2) > 0.7 ? C.cyan : C.teal);
    }
  });
  slots(cam, 0.8, 56, (i, x) => {
    fb2.rect(x, FLOOR - 92, 30, 92, C.ink);
    fb2.rect(x + 2, FLOOR - 90, 26, 88, C.slate);
    for (let r2 = 0; r2 < 16; r2++) {
      fb2.hline(x + 3, x + 26, FLOOR - 87 + r2 * 5, C.dslate);
      for (let c2 = 0; c2 < 3; c2++) fb2.px(x + 18 + c2 * 3, FLOOR - 86 + r2 * 5, hash(i * 7 + c2, r2 + Math.floor(t * 6)) > 0.5 ? [C.lime, C.cyan, C.amber][c2] : C.dslate);
    }
  });
  fb2.rect(0, FLOOR, W, H - FLOOR, C.dslate);
  fb2.hline(0, W - 1, FLOOR, C.ink);
  const o = layer(cam, 1);
  for (let x = -(o % 20 + 20) % 20; x < W; x += 20) fb2.line(x, FLOOR + 1, x - 14, H, C.slate);
}
function nasdaq(fb2, cam, t) {
  sky(fb2, [C.ink, C.night, C.navy]);
  stars(fb2, t, 24, FLOOR * 0.4);
  slots(cam, 0.2, 26, (i, x) => {
    const h = 40 + Math.floor(hash(i, 2) * 50);
    fb2.rect(x, FLOOR - h, 22, h, C.night);
    for (let wy = FLOOR - h + 4; wy < FLOOR - 4; wy += 5) for (let wx = x + 3; wx < x + 20; wx += 4) if (hash(wx * 3, wy) > 0.6) fb2.px(wx, wy, C.yellow);
  });
  const tx = Math.round(W * 0.55 - layer(cam, 0.5));
  fb2.rect(tx, FLOOR - 100, 70, 100, C.dslate);
  fb2.rect(tx + 4, FLOOR - 92, 62, 46, C.ink);
  for (let y = 0; y < 44; y++) for (let x = 0; x < 60; x++) if (bayer(x, y) < 0.35) fb2.px(tx + 5 + x, FLOOR - 91 + y, C.navy);
  const tick = " NDX +3.1%  TECH +0.8%  WEB +12%  DOT +6.4% ";
  fb2.clip = [tx + 4, 0, tx + 66, H];
  text(fb2, tick + tick, tx + 4 - Math.floor(t * 20) % 260, FLOOR - 40, C.lime);
  text(fb2, "5048", tx + 20, FLOOR - 80, C.amber, null, 2);
  fb2.clip = [0, 0, W, H];
  slots(cam, 0.9, 48, (i, x) => {
    if (hash(i, 4) > 0.5) {
      fb2.rect(x, FLOOR - 30, 34, 30, C.ink);
      fb2.rect(x + 3, FLOOR - 26, 28, 6, hash(i, Math.floor(t * 2)) > 0.5 ? C.hot : C.rose);
    }
  });
  ground(fb2, cam, FLOOR, C.night, C.dslate, 1, 24);
}
function cruce(fb2, cam, t) {
  sky(fb2, [C.blue, C.cyan, C.white]);
  slots(cam, 0.2, 120, (i, x) => {
    for (let k = 0; k < 40; k++) fb2.hline(x + k, x + 120 - k, FLOOR - 10 - k, C.green);
  });
  slots(cam, 0.5, 90, (i, x) => {
    for (let k = 0; k < 24; k++) fb2.hline(x + k, x + 80 - k, FLOOR - k, C.lime);
    fb2.rect(x + 60, FLOOR - 40, 3, 20, C.dbrown);
    fb2.disc(x + 61, FLOOR - 44, 8, C.dgreen);
  });
  fb2.rect(0, FLOOR, W, H - FLOOR, C.tan);
  fb2.hline(0, W - 1, FLOOR, C.brown);
  fb2.dither(0, FLOOR + 1, W, H - FLOOR, () => 0.2, C.tan, C.sand);
}
function mirador(fb2, cam, t) {
  sky(fb2, [C.ink, C.night, C.navy, C.dslate]);
  stars(fb2, t, 60, FLOOR - 20);
  slots(cam, 0.3, 160, (i, x) => {
    for (let k = 0; k < 30; k++) fb2.hline(x + k * 2, x + 160 - k * 2, FLOOR - k, C.dgreen);
  });
  const ox = Math.round(W * 0.7 - layer(cam, 0.6));
  fb2.rect(ox, FLOOR - 30, 30, 30, C.slate);
  fb2.disc(ox + 15, FLOOR - 30, 15, C.steel);
  fb2.rect(ox - 2, FLOOR - 31, 34, 1, C.ink);
  fb2.line(ox + 15, FLOOR - 40, ox + 34, FLOOR - 58, C.ink);
  fb2.line(ox + 16, FLOOR - 40, ox + 35, FLOOR - 58, C.silver);
  fb2.rect(0, FLOOR, W, H - FLOOR, C.dgreen);
  fb2.hline(0, W - 1, FLOOR, C.ink);
}
function puerta(fb2, cam, t) {
  fb2.rect(0, 0, W, H, C.ink);
  for (let y = 0; y < FLOOR; y += 10) for (let x = y / 10 % 2 ? 0 : 10; x < W; x += 20) fb2.rect(x - layer(cam, 0.3) % 20, y, 19, 9, C.night);
  const dx = Math.round(W / 2 - 46 - layer(cam, 0.7) + 30), dw = 92, dh = Math.min(118, FLOOR - 6);
  fb2.rect(dx - 6, FLOOR - dh - 6, dw + 12, dh + 6, C.dslate);
  fb2.rect(dx, FLOOR - dh, dw, dh, C.dbrown);
  fb2.rect(dx + dw / 2 - 1, FLOOR - dh, 2, dh, C.ink);
  for (const px of [dx + 6, dx + dw / 2 + 5]) for (const py of [FLOOR - dh + 8, FLOOR - dh / 2 + 4]) {
    fb2.rect(px, py, dw / 2 - 11, dh / 2 - 14, C.brown);
    fb2.hline(px, px + dw / 2 - 12, py, C.tan);
  }
  text(fb2, "?", dx + dw / 2 - 5, FLOOR - dh + 14, C.red, C.ink, 2);
  for (const tx of [dx - 22, dx + dw + 18]) {
    fb2.rect(tx, FLOOR - 70, 4, 10, C.dbrown);
    const f = Math.floor(t * 12) % 3;
    fb2.disc(tx + 2, FLOOR - 74 - f, 3, C.orange);
    fb2.px(tx + 2, FLOOR - 76 - f, C.yellow);
  }
  fb2.rect(0, FLOOR, W, H - FLOOR, C.dslate);
  fb2.hline(0, W - 1, FLOOR, C.slate);
}
function playa(fb2, cam, t) {
  sky(fb2, [C.blue, C.blue, C.cyan, C.white], FLOOR - 40);
  slots(cam, 0.08, 110, (i, x) => {
    const y = 12 + Math.floor(hash(i, 2) * 26);
    for (const [dx, r2] of [[0, 6], [8, 8], [17, 5]]) fb2.disc(x + dx + Math.round(t * 2) % 110, y, r2, C.white);
  });
  fb2.disc(Math.round(W * 0.82 - layer(cam, 0.03)), 26, 11, C.yellow);
  const hz = FLOOR - 40;
  fb2.rect(0, hz, W, 40, C.blue);
  fb2.dither(0, hz, W, 12, (x, y) => 0.5, C.blue, C.navy);
  for (let y = hz + 4; y < FLOOR - 4; y += 5) {
    const o = Math.round(Math.sin(t * 2 + y) * 6 + layer(cam, 0.3 + (y - hz) / 60));
    for (let x = -(o % 22 + 22) % 22; x < W; x += 22) fb2.hline(x, x + 6, y, y > FLOOR - 16 ? C.white : C.cyan);
  }
  const sh = Math.round(Math.sin(t * 1.6) * 3);
  fb2.rect(0, FLOOR - 4 + sh, W, 4 - sh + 1, C.white);
  fb2.rect(0, FLOOR, W, H - FLOOR, C.sand);
  fb2.hline(0, W - 1, FLOOR, C.tan);
  fb2.dither(0, FLOOR + 1, W, H - FLOOR, () => 0.18, C.sand, C.tan);
  slots(cam, 1, 150, (i, x) => {
    if (hash(i, 4) > 0.55) {
      fb2.vline(x + 20, FLOOR - 30, FLOOR, C.ink);
      for (let k = 0; k < 14; k++) fb2.hline(x + 6 + k, x + 34 - k, FLOOR - 30 - (13 - k), Math.floor(k / 3) % 2 ? C.white : C.red);
    }
    if (hash(i, 7) > 0.4) {
      fb2.disc(x + 70, FLOOR + 8, 2, C.pink);
      fb2.px(x + 70, FLOOR + 6, C.white);
    }
  });
}
function montana(fb2, cam, t) {
  sky(fb2, [C.steel, C.silver, C.cyan]);
  slots(cam, 0.1, 100, (i, x) => {
    const y = 10 + Math.floor(hash(i, 2) * 14);
    for (const [dx, r2] of [[0, 9], [12, 12], [25, 8]]) fb2.disc(x + dx + Math.round(t * 3) % 100, y, r2, C.silver);
  });
  slots(cam, 0.2, 120, (i, x) => {
    const h = 70 + Math.floor(hash(i, 1) * 30);
    for (let k = 0; k < h; k++) fb2.hline(x + 60 - Math.round(k * 0.9), x + 60 + Math.round(k * 0.9), FLOOR - 20 - h + k, k < 14 ? C.white : C.slate);
  });
  slots(cam, 0.5, 90, (i, x) => {
    for (let k = 0; k < 46; k++) fb2.hline(x + 45 - k, x + 45 + k, FLOOR - 46 + k, k < 6 ? C.white : C.dgreen);
  });
  for (let i = 0; i < 70; i++) {
    const x0 = Math.floor(hash(i, 3) * (W + 40)), y = Math.floor((hash(i, 5) * FLOOR + t * 160) % FLOOR);
    const x = (x0 - Math.floor(y * 0.3)) % W;
    fb2.px(x, y, C.cyan);
    fb2.px(x - 1, y - 2, C.cyan);
  }
  fb2.rect(0, FLOOR, W, H - FLOOR, C.green);
  fb2.hline(0, W - 1, FLOOR, C.dgreen);
  for (let y = FLOOR + 2; y < H; y++) {
    const cx = Math.round(W * 0.62 + Math.sin(y * 0.12) * 12 - layer(cam, 0.9) % 40);
    fb2.hline(cx - 6 - (y - FLOOR) / 8, cx + 6 + (y - FLOOR) / 8, y, C.blue);
    if ((y + Math.floor(t * 12)) % 5 === 0) fb2.px(cx, y, C.white);
  }
}
function fondo(fb2, cam, t) {
  fb2.gradV(0, 0, W, FLOOR, [C.teal, C.navy, C.night, C.ink]);
  for (let k = 0; k < 5; k++) {
    const x = Math.round((k * 70 + t * 6) % (W + 40) - 20);
    for (let y = 0; y < FLOOR * 0.6; y++) if (bayer(x + y, y) < 0.12) fb2.px(x + Math.round(y * 0.3), y, C.cyan);
  }
  slots(cam, 0.5, 110, (i, x) => {
    const h = 30 + Math.floor(hash(i, 2) * 30);
    fb2.rect(x + 20, FLOOR - h, 12, h, C.umber);
    fb2.rect(x + 18, FLOOR - h, 16, 3, C.rust);
    fb2.px(x + 26, FLOOR - h - 1, C.orange);
    for (let j = 0; j < 14; j++) {
      const ph = (t * 0.8 + j / 14) % 1, r2 = 2 + Math.round(ph * 6);
      fb2.disc(x + 26 + Math.round(Math.sin(t * 2 + j) * ph * 8), FLOOR - h - Math.round(ph * 60), r2, ph < 0.3 ? C.dslate : C.night);
    }
  });
  for (let i = 0; i < 16; i++) {
    const x = Math.round(hash(i, 4) * W + Math.sin(t * 3 + i) * 2), y = Math.round(FLOOR - (t * 30 + hash(i, 8) * FLOOR) % FLOOR);
    fb2.px(x, y, C.cyan);
    if (i % 3 === 0) {
      fb2.px(x + 1, y, C.cyan);
      fb2.px(x, y - 1, C.white);
    }
  }
  fb2.rect(0, FLOOR, W, H - FLOOR, C.dslate);
  fb2.hline(0, W - 1, FLOOR, C.ink);
  fb2.dither(0, FLOOR + 1, W, H - FLOOR, () => 0.3, C.dslate, C.night);
}
function desierto(fb2, cam, t) {
  sky(fb2, [C.cyan, C.white, C.sand], FLOOR - 34);
  fb2.disc(Math.round(W * 0.2 - layer(cam, 0.03)), 24, 12, C.yellow);
  slots(cam, 0.2, 140, (i, x) => {
    for (let k = 0; k < 36; k++) fb2.hline(x + k * 2, x + 140 - k * 2, FLOOR - 34 - k, k < 2 ? C.clay : C.tan);
  });
  const hz = FLOOR - 34;
  fb2.rect(0, hz, W, 34, C.teal);
  fb2.dither(0, hz, W, 34, (x, y) => (y - hz) / 50, C.cyan, C.teal);
  for (let y = hz + 5; y < FLOOR - 6; y += 7) {
    const o = Math.round(t * 4 + y * 3 + layer(cam, 0.5));
    for (let x = -(o % 30); x < W; x += 30) fb2.hline(x, x + 4, y, C.white);
  }
  slots(cam, 0.7, 80, (i, x) => {
    if (hash(i, 3) > 0.4) for (let k = 0; k < 5; k++) fb2.hline(x + k, x + 22 - k, FLOOR - 6 - k, C.white);
  });
  fb2.rect(0, FLOOR - 2, W, 3, C.white);
  fb2.rect(0, FLOOR, W, H - FLOOR, C.sand);
  fb2.hline(0, W - 1, FLOOR, C.white);
  fb2.dither(0, FLOOR + 1, W, H - FLOOR, () => 0.25, C.sand, C.white);
}
function lanzamiento(fb2, cam, t) {
  sky(fb2, [C.navy, C.plum, C.rose, C.orange, C.amber]);
  stars(fb2, t, 18, FLOOR * 0.3);
  slots(cam, 0.15, 130, (i, x) => {
    for (let k = 0; k < 10; k++) fb2.hline(x + k * 3, x + 130 - k * 3, FLOOR - 8 - k, C.dslate);
  });
  const rx = Math.round(W * 0.66 - layer(cam, 0.5)), top = FLOOR - 92;
  fb2.rect(rx + 14, top - 6, 6, 98, C.slate);
  for (let y = top; y < FLOOR; y += 6) fb2.line(rx + 14, y, rx + 19, y + 6, C.steel);
  fb2.rect(rx, top + 4, 10, 84, C.white);
  fb2.vline(rx, top + 4, FLOOR - 4, C.silver);
  fb2.rect(rx, top + 20, 10, 3, C.ink);
  for (let k = 0; k < 8; k++) fb2.hline(rx + Math.round(k * 0.6), rx + 9 - Math.round(k * 0.6), top - 4 + k, C.white);
  fb2.rect(rx - 2, FLOOR - 8, 14, 4, C.ink);
  for (let i = 0; i < 8; i++) {
    const ph = (t * 0.25 + i / 8) % 1;
    fb2.disc(rx + 5 + Math.round((i - 4) * 5 * ph), FLOOR - 4 - Math.round(ph * 8), 3 + Math.round(ph * 5), C.silver);
  }
  fb2.rect(0, FLOOR, W, H - FLOOR, C.dslate);
  fb2.hline(0, W - 1, FLOOR, C.ink);
  fb2.dither(0, FLOOR + 1, W, H - FLOOR, () => 0.2, C.dslate, C.slate);
}
function espacio(fb2, cam, t) {
  fb2.rect(0, 0, W, H, C.ink);
  stars(fb2, t, 70, H);
  const R = W * 1.6, cx = W / 2 - layer(cam, 0.05) % 40, cy = FLOOR + R - 40;
  for (let y = Math.max(0, Math.floor(cy - R - 8)); y < H; y++) {
    const dy = y - cy, w = Math.sqrt(Math.max(0, (R + 6) * (R + 6) - dy * dy)), w2 = Math.sqrt(Math.max(0, R * R - dy * dy));
    if (w > 0) fb2.hline(Math.round(cx - w), Math.round(cx + w), y, C.cyan);
    if (w2 > 0) {
      fb2.hline(Math.round(cx - w2), Math.round(cx + w2), y, C.blue);
      for (let x = Math.round(cx - w2); x < cx + w2; x += 1) {
        const hv = hash(Math.floor((x + t * 3) / 7), Math.floor(y / 3));
        if (hv > 0.9) fb2.px(x, y, C.white);
        else if (hv < 0.12) fb2.px(x, y, C.green);
      }
    }
  }
  const kx = Math.round(W * 0.7 + Math.sin(t * 0.4) * 6 - layer(cam, 0.3) % 30), ky = Math.round(FLOOR * 0.35 + Math.cos(t * 0.5) * 3);
  for (let k = 0; k < 6; k++) fb2.hline(kx - 10 + k, kx + 10 - k, ky - k, C.silver);
  fb2.hline(kx - 11, kx + 11, ky + 1, C.dslate);
  fb2.hline(kx - 10, kx + 10, ky + 2, C.ink);
  if (Math.floor(t * 2) % 4 === 0) {
    fb2.px(kx + 12, ky - 2, C.white);
    fb2.px(kx + 14, ky - 2, C.silver);
  }
  fb2.rect(0, FLOOR + 8, W, H, C.ink);
}
function cielo(fb2, cam, t) {
  sky(fb2, [C.ink, C.night, C.navy, C.blue, C.cyan], FLOOR + 10);
  stars(fb2, t, 30, FLOOR * 0.35);
  slots(cam, 0.1, 120, (i, x) => {
    const y = FLOOR - 20 - Math.floor(hash(i, 2) * 26);
    for (const [dx, r2] of [[0, 8], [10, 11], [22, 7]]) fb2.disc(x + dx, y, r2, C.white);
  });
  const ph = t / 6 % 1, fx = Math.round(W * (1.1 - ph * 1.3)), fy = Math.round(H * (0.08 + ph * 0.45));
  for (let k = 0; k < 40; k++) {
    const x = fx + k * 3, y = fy - k;
    fb2.px(x, y, k < 6 ? C.white : k < 16 ? C.yellow : k < 28 ? C.orange : C.rose);
    if (k < 20) fb2.px(x, y + 1, k < 10 ? C.yellow : C.orange);
  }
  fb2.disc(fx, fy, 4, C.orange);
  fb2.disc(fx, fy, 2, C.white);
  fb2.rect(0, FLOOR + 10, W, H, C.dslate);
}
var fr = (t, k) => (t * k % 1 + 1) % 1;
function pajaro(fb2, x, y, t, col) {
  const a = Math.floor(t * 6) % 2;
  fb2.px(x, y, col);
  fb2.px(x - 1, y - a, col);
  fb2.px(x - 2, y - 1 + a, col);
  fb2.px(x + 1, y - a, col);
  fb2.px(x + 2, y - 1 + a, col);
}
var AMB = {
  mirador(fb2, t) {
    for (let j = 0; j < 2; j++) {
      const p = (t + j * 2.7) / 4 % 1;
      if (p < 0.3) {
        const u = p / 0.3, x = Math.round(W * (0.85 - 0.55 * u) + j * 30), y = Math.round(FLOOR * (0.06 + 0.25 * u) + j * 10);
        for (let i = 0; i < 10; i++) fb2.px(x + i, y - Math.round(i * 0.45), i < 2 ? C.white : i < 5 ? C.yellow : C.cyan);
      }
    }
  },
  playa(fb2, t) {
    for (let i = 0; i < 3; i++) pajaro(fb2, Math.round(fr(t + i * 2.3, 1 / 10) * (W + 20)) - 10, Math.round(FLOOR * (0.12 + 0.07 * i) + Math.sin(t * 1.5 + i) * 4), t + i * 0.4, C.ink);
    const bx = Math.round(fr(t, 1 / 18) * (W + 60)) - 30, by = FLOOR - 30 + Math.round(Math.sin(t * 2) * 1.5);
    fb2.rect(bx, by, 16, 4, C.red);
    fb2.vline(bx + 7, by - 12, by, C.ink);
    for (let k = 0; k < 10; k++) fb2.hline(bx + 8, bx + 8 + Math.round(k * 0.7), by - 12 + k, C.white);
  },
  montana(fb2, t) {
    if (Math.floor(t * 2.3) % 9 === 0 && fr(t * 2.3, 1) < 0.25) {
      fb2.rect(0, 0, W, 2, C.white);
    }
  },
  fondo(fb2, t) {
    for (let i = 0; i < 3; i++) {
      const x = Math.round(fr(t + i * 4.1, i % 2 ? 0.06 : -0.05) * (W + 40)) - 20, y = Math.round(FLOOR * (0.3 + 0.15 * i) + Math.sin(t * 2 + i) * 4), c2 = [C.orange, C.yellow, C.pink][i], d = i % 2 ? 1 : -1;
      fb2.rect(x - 4, y - 2, 9, 5, c2);
      fb2.px(x - 5 * d, y, c2);
      fb2.px(x - 6 * d, y - 1, c2);
      fb2.px(x - 6 * d, y + 1, c2);
      fb2.px(x + 3 * d, y - 1, C.ink);
    }
  },
  desierto(fb2, t) {
    const x = Math.round(W * 0.55 + Math.sin(t * 0.8) * 4), y = FLOOR - 20 + Math.round(Math.sin(t * 2) * 1.5);
    fb2.rect(x, y, 14, 3, C.skin);
    fb2.disc(x + 16, y, 3, C.skin);
    fb2.rect(x + 2, y - 1, 6, 2, C.red);
    fb2.hline(x - 4, x + 22, y + 3, C.white);
  },
  hoy(fb2, t) {
    const x = Math.round(fr(t, 1 / 14) * (W + 40)) - 20, y = Math.round(FLOOR * 0.2);
    fb2.hline(x - 4, x + 4, y, C.silver);
    fb2.px(x - 4, y - 1, C.silver);
    if (Math.floor(t * 3) % 2) fb2.px(x + 4, y, C.red);
    for (let i = 0; i < 3; i++) {
      const cx = Math.round(fr(t + i * 3.1, i % 2 ? 0.09 : -0.12) * (W + 30)) - 15, cy = FLOOR + 6 + i % 2 * 6;
      fb2.rect(cx, cy, 12, 4, [C.red, C.cyan, C.yellow][i]);
      fb2.rect(cx + 3, cy - 2, 6, 2, C.ink);
      fb2.px(i % 2 ? cx + 11 : cx, cy + 1, C.yellow);
    }
  },
  mercado(fb2, t) {
    for (let i = 0; i < 4; i++) pajaro(fb2, Math.round(fr(t + i * 1.7, 1 / 11) * (W + 20)) - 10, Math.round(FLOOR * (0.15 + 0.07 * i) + Math.sin(t * 2 + i) * 3), t + i * 0.3, C.ink);
  },
  londres(fb2, t) {
    for (let i = 0; i < 3; i++) pajaro(fb2, W + 10 - Math.round(fr(t + i * 2.3, 1 / 9) * (W + 20)), Math.round(FLOOR * (0.12 + 0.08 * i) + Math.sin(t * 1.5 + i) * 4), t + i * 0.4, C.ink);
  },
  datos(fb2, t) {
    for (let i = 0; i < 18; i++) {
      const x = Math.round(hashA(i) * W), y = Math.round(FLOOR - fr(t + i * 0.7, 0.08 + hashA(i + 9) * 0.06) * FLOOR);
      if (Math.floor(t * 4 + i) % 3) fb2.px(x + Math.round(Math.sin(t + i) * 3), y, C.cyan);
    }
  },
  nasdaq(fb2, t) {
    for (let k = 0; k < 2; k++) {
      const bx = Math.round(W * (0.2 + 0.6 * k)), a = -Math.PI / 2 + Math.sin(t * 0.7 + k * 2) * 0.5;
      for (let r2 = 0; r2 < FLOOR; r2 += 2) for (let w = -1; w <= 1; w++) {
        const x = Math.round(bx + Math.cos(a) * r2 + w * r2 * 0.05), y = Math.round(FLOOR - Math.sin(-a) * r2);
        if ((x + y) % 3 === 0) fb2.px(x, y, C.silver);
      }
    }
  },
  cruce(fb2, t) {
    for (let i = 0; i < 5; i++) {
      const x = Math.round(fr(t + i * 2.1, 0.05) * W + Math.sin(t * 2 + i) * 8), y = Math.round(FLOOR - 8 - Math.abs(Math.sin(t * 1.3 + i)) * 30), a = Math.floor(t * 10 + i) % 2, c2 = [C.pink, C.yellow, C.orange, C.white, C.lime][i];
      fb2.px(x, y, c2);
      fb2.px(x - 1, y - a, c2);
      fb2.px(x + 1, y - a, c2);
    }
  },
  puerta(fb2, t) {
    for (let i = 0; i < 14; i++) {
      const x = Math.round(W * hashA(i) + Math.sin(t * 2 + i) * 4), y = Math.round(FLOOR - fr(t + i * 0.9, 0.12 + hashA(i + 3) * 0.1) * FLOOR * 0.8);
      if (Math.floor(t * 6 + i) % 4) fb2.px(x, y, i % 3 ? C.orange : C.yellow);
    }
  }
};
function hashA(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
var BASE = { hoy, mercado, londres, datos, nasdaq, cruce, mirador, puerta, playa, montana, fondo, desierto, lanzamiento, espacio, cielo };
var LUGARES = Object.fromEntries(Object.entries(BASE).map(([k, f]) => [k, (fb2, cam, t) => {
  f(fb2, cam, t);
  AMB[k] && AMB[k](fb2, t);
}]));
var NOMBRE = { hoy: "HOY", mercado: "EL MERCADO", londres: "LONDRES \xB7 1720", datos: "CENTRO DE DATOS", nasdaq: "NUEVA YORK \xB7 2000", cruce: "EL CRUCE", mirador: "EL MIRADOR", puerta: "LA \xDALTIMA PUERTA", playa: "LA PLAYA", montana: "LA MONTA\xD1A", fondo: "EL FONDO DEL MAR", desierto: "EL MAR MUERTO", lanzamiento: "CABO CA\xD1AVERAL", espacio: "EN \xD3RBITA", cielo: "LA REENTRADA" };

// page/micro.js
var A = 0.06;
var VERT3 = H > W;
var CX = W / 2;
var CY = H / 2;
var GRANOS = [[0, 0, 60], [-120, -45, 38], [105, 35, 48], [-70, 75, 30], [150, -70, 34], [35, -95, 24], [-165, 40, 26], [70, 100, 22]];
function rectC(fb2, x, y, w, h, c2) {
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, Math.ceil(x + w)), y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) fb2.px(xx, yy, c2);
}
function grano(fb2, gx, gy, sz, s, t, i) {
  const w = sz * s, x = CX + (gx - sz / 2) * s, y = CY + (gy - sz / 2) * s, d = Math.min(w * 0.22, 40);
  if (x > W || y + w < -d || x + w + d < 0 || y > H) return;
  for (let k = 0; k < d; k++) {
    const yy = Math.round(y - k);
    if (yy < 0 || yy >= H) continue;
    fb2.hline(Math.max(0, Math.round(x + k)), Math.min(W - 1, Math.round(x + w + k)), yy, C.white);
  }
  for (let k = 0; k < d; k++) {
    const xx = Math.round(x + w + k);
    if (xx < 0 || xx >= W) continue;
    for (let yy = Math.max(0, Math.round(y - k)); yy < Math.min(H, Math.round(y + w - k)); yy++) fb2.px(xx, yy, bayer(xx, yy) < 0.5 ? C.silver : C.steel);
  }
  rectC(fb2, x, y, w, w, C.white);
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, x + w), y1 = Math.min(H, y + w);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
    const u = (xx - x + (yy - y)) / (2 * w);
    if (bayer(xx, yy) < 0.25 + 0.5 * u) fb2.px(xx, yy, C.cyan);
  }
  if (w > 6) {
    fb2.hline(Math.round(x + 2), Math.round(x + Math.min(w * 0.4, 30)), Math.round(y + 2), C.white);
  }
  if (Math.floor(t * 4 + i) % 5 === 0 && w > 4) {
    const sx = Math.round(x + w * 0.25), sy = Math.round(y + w * 0.2);
    fb2.px(sx, sy - 2, C.white);
    fb2.px(sx, sy + 2, C.white);
    fb2.px(sx - 2, sy, C.white);
    fb2.px(sx + 2, sy, C.white);
  }
}
function ion(fb2, x, y, r2, na, glow) {
  const R = Math.max(1, Math.round(r2));
  if (R <= 1) {
    fb2.px(x, y, na ? C.pink : C.lime);
    return;
  }
  fb2.disc(x, y, R + 1, C.ink);
  fb2.disc(x, y, R, na ? C.rose : C.green);
  fb2.disc(x - Math.round(R * 0.2), y - Math.round(R * 0.2), Math.max(1, Math.round(R * 0.7)), na ? C.pink : C.lime);
  if (R > 3) fb2.disc(x - Math.round(R * 0.4), y - Math.round(R * 0.4), Math.max(1, Math.round(R * 0.22)), C.white);
  if (glow && R > 6) text(fb2, na ? "+" : "-", x - 2, y - 3, C.ink);
}
function agua(fb2, x, y, r2, ang) {
  const R = Math.max(1, Math.round(r2));
  for (const da of [-0.91, 0.91]) {
    const hx = Math.round(x + Math.cos(ang + da) * R * 1.2), hy = Math.round(y + Math.sin(ang + da) * R * 1.2);
    fb2.disc(hx, hy, Math.max(1, Math.round(R * 0.55)) + 1, C.ink);
    fb2.disc(hx, hy, Math.max(1, Math.round(R * 0.55)), C.white);
  }
  fb2.disc(x, y, R + 1, C.ink);
  fb2.disc(x, y, R, C.red);
  if (R > 2) fb2.px(x - 1, y - 1, C.orange);
}
function fmtMag(m) {
  const p = Math.pow(10, Math.floor(Math.log10(m)) - 1), v = Math.round(m / p) * p;
  return "\xD7" + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function micro(fb2, s, t, conAgua = false, dlgY = H) {
  CY = VERT3 ? 122 : Math.round(dlgY / 2);
  const sp = A * s;
  const f = clamp((sp - 3) / 14, 0, 1);
  if (!conAgua) {
    fb2.rect(0, 0, W, H, C.night);
    fb2.dither(0, 0, W, H, (x, y) => 0.12, C.night, C.navy);
    for (let i = GRANOS.length - 1; i >= 0; i--) grano(fb2, ...GRANOS[i], s, t, i);
    if (f > 0) {
      const c2 = GRANOS[0], x = CX + (c2[0] - c2[2] / 2) * s, y = CY + (c2[1] - c2[2] / 2) * s;
      const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, x + c2[2] * s), y1 = Math.min(H, y + c2[2] * s);
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) if (bayer(xx, yy) < f) fb2.px(xx, yy, bayer(xx + 1, yy) < 0.3 ? C.navy : C.night);
      const ox = CX - (c2[0] - c2[2] / 2) * 0, i0 = Math.floor((0 - CX) / sp) - 1, i1 = Math.ceil((W - CX) / sp) + 1, j0 = Math.floor((0 - CY) / sp) - 1, j1 = Math.ceil((H - CY) / sp) + 1;
      if (sp > 10) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const X = Math.round(ox + i * sp), Y = Math.round(CY + j * sp);
        if (bayer(X, Y) < f) {
          fb2.hline(X, Math.round(X + sp), Y, C.steel);
          fb2.vline(X, Y, Math.round(Y + sp), C.steel);
        }
      }
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const na = (i + j & 1) === 0, v = Math.sin(t * 9 + i * 1.3 + j * 0.7) * 0.05 * sp;
        const X = Math.round(ox + i * sp + v), Y = Math.round(CY + j * sp + Math.cos(t * 8 + i * 0.9 + j * 1.7) * 0.05 * sp);
        if (hash(i, j, 7) > f * 1.05) continue;
        ion(fb2, X, Y, (na ? 0.24 : 0.36) * sp * (0.6 + 0.4 * f), na, f > 0.9);
      }
    }
  } else {
    fb2.rect(0, 0, W, H, C.navy);
    fb2.dither(0, 0, W, H, (x, y) => 0.25 + 0.1 * Math.sin((x + y) * 0.05 + t), C.navy, C.blue);
    if (f < 1) for (let i = 0; i < 480; i++) {
      const sc = Math.pow(5, -(i % 4)), wx = (hash(i, 1) - 0.5) * 400 * sc, wy = (hash(i, 2) - 0.5) * 260 * sc, X = Math.round(CX + wx * s + Math.sin(t * 2 + i) * 2), Y = Math.round(CY + wy * s + Math.cos(t * 2 + i) * 2);
      if (X >= 0 && Y >= 0 && X < W && Y < H && bayer(X, Y) >= f) fb2.px(X, Y, hash(i, 3) < 0.2 ? C.lime : hash(i, 3) < 0.35 ? C.pink : C.cyan);
    }
    if (f > 0) {
      const g = sp * 1.6, i0 = Math.floor(-CX / g) - 1, i1 = Math.ceil((W - CX) / g) + 1, j0 = Math.floor(-CY / g) - 1, j1 = Math.ceil((H - CY) / g) + 1;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        if (hash(i, j, 9) > f * 1.05) continue;
        const k = hash(i, j, 3), X = Math.round(CX + (i + (hash(i, j, 4) - 0.5) * 0.6) * g + Math.sin(t * 2.3 + i * 1.7 + j) * 0.18 * g), Y = Math.round(CY + (j + (hash(i, j, 5) - 0.5) * 0.6) * g + Math.cos(t * 2.1 + j * 1.3 + i) * 0.18 * g);
        if (k < 0.17) ion(fb2, X, Y, 0.26 * sp, true, f > 0.9);
        else if (k < 0.34) ion(fb2, X, Y, 0.36 * sp, false, f > 0.9);
        else agua(fb2, X, Y, 0.22 * sp, t * 1.5 + k * 20);
      }
    }
  }
  const R = VERT3 ? 80 : Math.round(Math.min(W, dlgY) * 0.46), R2 = R * R;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - CX + 0.5, dy = y - CY + 0.5, d2 = dx * dx + dy * dy;
    if (d2 > R2) fb2.px(x, y, d2 < (R + 2) * (R + 2) ? C.steel : C.ink);
    else if (d2 > (R - 6) * (R - 6) && bayer(x, y) < (Math.sqrt(d2) - R + 6) / 7) fb2.px(x, y, C.ink);
  }
  for (let k = -R + 8; k < R - 8; k += 3) {
    fb2.px(Math.round(CX + k), Math.round(CY), C.cyan);
    fb2.px(Math.round(CX), Math.round(CY + k), C.cyan);
  }
  const mag = fmtMag(100 * Math.pow(1e5, Math.log(Math.max(1, s)) / Math.log(400)));
  const lab = "MICROSCOPIO", vert = H > W;
  text(fb2, lab, vert ? Math.round(CX - textW(lab) / 2) : 6, vert ? CY - R + 8 : 6, C.cyan, C.ink);
  textOutlined(fb2, mag, vert ? Math.round(CX - textW(mag, 2) / 2) : W - 8 - textW(mag, 2), vert ? CY + R - 22 : 6, C.yellow, C.ink, 2);
  if (f > 0.85) {
    const L2 = conAgua ? [["NA+ SODIO", "na"], ["CL- CLORO", "cl"], ["H2O AGUA", "h2o"]] : [["NA+ SODIO", "na"], ["CL- CLORO", "cl"]];
    const lx = vert ? 16 : 6, ly = vert ? CY - R + 22 : dlgY - 6 - L2.length * 11;
    L2.forEach(([s2, k], n) => {
      const y = ly + n * 11;
      if (k === "h2o") {
        fb2.disc(lx + 3, y + 3, 3, C.red);
        fb2.px(lx, y + 6, C.white);
        fb2.px(lx + 6, y + 6, C.white);
      } else {
        fb2.disc(lx + 3, y + 3, 3, C.ink);
        fb2.disc(lx + 3, y + 3, 2, k === "na" ? C.pink : C.lime);
      }
      text(fb2, s2.replace("NA", "Na").replace("CL", "Cl"), lx + 10, y, C.white, C.ink);
    });
  }
}
var ETAPA = { aire: 0, choque: 1, aprieta: 2, plasma: 3 };
var ease = (x) => x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
var cl01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
var RX = 80;
var RY = 80;
function marco(fb2, R, mag, etiqueta, dlgY) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - CX + 0.5) / RX, dy = (y - CY + 0.5) / RY, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 1) fb2.px(x, y, d < 1 + 2 / RY ? C.steel : C.ink);
    else if (d > 1 - 6 / RY && bayer(x, y) < (d - 1 + 6 / RY) * RY / 7) fb2.px(x, y, C.ink);
  }
  const vert = H > W;
  text(fb2, "MICROSCOPIO", vert ? Math.round(CX - textW("MICROSCOPIO") / 2) : 4, vert ? CY - R + 8 : 3, C.cyan, C.ink);
  textOutlined(fb2, mag, vert ? Math.round(CX - textW(mag, 2) / 2) : W - 4 - textW(mag, 2), vert ? CY + R - 22 : 2, C.yellow, C.ink, 2);
  if (etiqueta) {
    const sc = !vert && textW(etiqueta, 2) < W - 24 ? 2 : 1, w = textW(etiqueta, sc);
    textOutlined(fb2, etiqueta, Math.round(CX - w / 2), vert ? CY + R - 36 : dlgY - 8 - sc * 8, C.white, C.ink, sc);
  }
}
function leyenda(fb2, items, dlgY, R) {
  const vert = H > W, lx = vert ? 16 : CX - RX + 26, ly = vert ? CY - R + 22 : CY - RY + 14;
  items.forEach(([s2, col], n) => {
    const y = ly + n * 11;
    fb2.disc(lx + 2, y + 3, 2, col);
    fb2.disc(lx + 6, y + 3, 2, col);
    text(fb2, s2, lx + 12, y, C.white, C.ink);
  });
}
var CAL = [C.orange, C.amber, C.yellow, C.white];
function calCol(base, h) {
  if (h < 0.2) return base;
  return CAL[Math.min(3, Math.floor((h - 0.2) / 0.8 * 4))];
}
function atomo(fb2, x, y, r2, c2) {
  fb2.disc(x, y, r2 + 1, C.ink);
  fb2.disc(x, y, r2, c2);
  if (r2 > 2) fb2.px(x - 1, y - 1, C.white);
}
function molecula(fb2, x, y, ang, r2, c2, sep) {
  const d = r2 * (1.1 + sep), dx = Math.cos(ang) * d, dy = Math.sin(ang) * d;
  if (sep < 0.3) fb2.line(Math.round(x - dx), Math.round(y - dy), Math.round(x + dx), Math.round(y + dy), C.ink);
  atomo(fb2, Math.round(x - dx), Math.round(y - dy), r2, c2);
  atomo(fb2, Math.round(x + dx), Math.round(y + dy), r2, c2);
}
function secAire(fb2, g, t, R, dlgY) {
  const heat = cl01((g - 2) / 1.6), plasma = cl01(g - 3);
  fb2.rect(0, 0, W, H, C.night);
  fb2.dither(0, 0, W, H, (x, y) => 0.1 + 0.5 * heat * cl01(1 - (x - CX + RX) / (2 * RX)), C.night, plasma > 0.3 ? C.rose : C.plum);
  if (plasma > 0) fb2.dither(0, 0, W, H, (x, y) => plasma * 0.45 * cl01(1 - (x - CX + RX * 0.6) / (1.4 * RX)), T, C.orange);
  const xw0 = CX - RX * 0.62;
  const xw = g < 1 ? CX - RX * 1.6 + (xw0 - (CX - RX * 1.6)) * ease(cl01(g * 1.4 - 0.4)) : xw0;
  if (xw > CX - RX - 2) {
    for (let y = Math.round(CY - RY); y < CY + RY; y++) for (let x = Math.round(CX - RX); x < xw; x++) fb2.px(x, y, ((x >> 2) + (y >> 2)) % 2 ? C.dslate : C.slate);
    fb2.vline(Math.round(xw), Math.round(CY - RY), Math.round(CY + RY), heat > 0.3 ? CAL[Math.min(3, Math.floor(heat * 3))] : C.steel);
  }
  const N = 34, rows = 9, cols = 4, comp = 1 - 0.35 * cl01(g - 2);
  for (let i = 0; i < N; i++) {
    const hy = hash(i, 11), hx = hash(i, 12), N2 = hash(i, 13) < 0.78;
    const base = N2 ? C.blue : C.red, r2 = VERT3 ? 2 : 3;
    let x, y, ang = t * (1 + hash(i, 14)) + i;
    const slot = i < rows * cols ? i : -1, sc = slot >= 0 ? Math.floor(slot / rows) : 0, sr = slot >= 0 ? slot % rows : 0;
    const slotX = xw + 7 + sc * (VERT3 ? 9 : 12) * comp, slotY = CY - RY * 0.78 + (sr + sc % 2 * 0.5) * (RY * 1.56 / rows);
    const arr = 1 + (sc * rows + sr) / (rows * cols) * 0.85;
    const vel = g < 1 ? 7 : 7 + 55 * cl01(g - 1);
    const xFree = CX + RX - (hx * 2 * RX + t * vel) % (2 * RX), yFree = CY + (hy - 0.5) * 1.7 * RY;
    if (slot < 0 || g < arr - 0.12) {
      x = xFree;
      y = yFree;
      if (slot >= 0 && g > 1) {
        const k = cl01((g - (arr - 0.12)) / 0.12);
        x = xFree;
      }
    } else {
      const k = ease(cl01((g - (arr - 0.12)) / 0.12));
      x = slotX + (CX + RX - slotX) * (1 - k);
      y = slotY;
    }
    if (slot >= 0 && g >= arr) {
      x = slotX;
      y = slotY;
    }
    const jit = slot >= 0 && g >= arr ? 0.6 + 2.8 * heat : 0.4;
    x += Math.sin(t * 13 + i * 2.1) * jit;
    y += Math.cos(t * 11 + i * 1.7) * jit;
    const h = slot >= 0 && g >= arr ? heat * (1 - sc * 0.15) : heat * 0.3;
    const sep = plasma > 0 && slot >= 0 ? cl01((plasma - hash(i, 15) * 0.5) / 0.4) * 2.2 : 0;
    if (g >= 1 && g < 2 && (slot < 0 || g < arr)) for (let k = 1; k < 6; k++) fb2.px(Math.round(x + k * 2), Math.round(y), C.steel);
    molecula(fb2, Math.round(x), Math.round(y), sep > 0 ? ang * 0.2 + i : ang, r2, calCol(base, h), sep);
    if (sep > 1 && Math.floor(t * 10 + i) % 3 === 0) fb2.px(Math.round(x), Math.round(y - 4), C.white);
  }
  if (g > 1.8) {
    const hx = CX + RX - (VERT3 ? 22 : 44), top = CY - RY * 0.6, hh = RY * 1.2, lvl = cl01((g - 1.8) / 1.8);
    fb2.rect(hx - 1, top - 1, 6, hh + 2, C.ink);
    fb2.rect(hx, top + hh * (1 - lvl), 4, hh * lvl, lvl > 0.7 ? C.white : lvl > 0.4 ? C.yellow : C.orange);
    fb2.disc(hx + 2, top + hh + 4, 4, C.red);
    text(fb2, "CALOR", hx - 26, top - 2, C.yellow, C.ink);
  }
  const et = g < 1 ? "CASI NO HAY AIRE" : g < 2 ? "NO LES DA TIEMPO A APARTARSE" : g < 3 ? "SE APRIETAN Y SE CALIENTAN" : "\xA1SE ROMPEN Y BRILLAN!";
  marco(fb2, R, "\xD710.000.000", et, dlgY);
  if (g < 1.2) leyenda(fb2, [["N2 NITR\xD3GENO", C.blue], ["O2 OX\xCDGENO", C.red]], dlgY, R);
  else if (xw > CX - RX) text(fb2, "ESCUDO", Math.round(Math.max(CX - RX + 10, xw - 34)), Math.round(CY - RY * 0.2), C.silver, C.ink);
}
function secEscudo(fb2, g, t, R, dlgY) {
  fb2.rect(0, 0, W, H, C.night);
  fb2.dither(0, 0, W, H, (x, y) => 0.55 * cl01((x - CX + RX * 0.2) / (RX * 1.2)), C.night, C.orange);
  const sp = 8, cols = 9, rows = Math.ceil(2 * RY / sp) + 1, x0 = CX - RX * 0.55, y0 = CY - RY;
  const quita = g * 3.2;
  for (let c2 = 0; c2 < cols; c2++) for (let r2 = 0; r2 < rows; r2++) {
    const bx = x0 + c2 * sp, by = y0 + r2 * sp + c2 % 2 * sp / 2, front = cols - 1 - c2;
    const tsuelta = (front + hash(c2, r2, 3) * 0.9) / 3.2;
    const hot = cl01(1 - front / 3), frio = front > 4;
    if (g < tsuelta) {
      atomo(fb2, Math.round(bx + Math.sin(t * 12 + r2 + c2) * hot), Math.round(by), 3, frio ? C.steel : calCol(C.slate, 0.2 + hot * 0.9));
    } else {
      const d = (g - tsuelta) * 3.2, x = bx + d * 70, y = by - d * 26 + Math.sin(t * 6 + r2) * 3;
      if (x < CX + RX + 6) {
        for (let k = 1; k < 5; k++) fb2.px(Math.round(x - k * 3), Math.round(y + k), k < 3 ? C.yellow : C.orange);
        atomo(fb2, Math.round(x), Math.round(y), 3, C.amber);
      }
    }
  }
  for (let i = 0; i < 26; i++) {
    const x = CX + RX - (hash(i, 21) * RX * 1.2 + t * 60) % (RX * 1.2), y = CY + (hash(i, 22) - 0.5) * 1.8 * RY;
    atomo(fb2, Math.round(x), Math.round(y), 2, Math.floor(t * 8 + i) % 2 ? C.white : C.yellow);
  }
  const tx = CX - RX * 0.55 - 14, top = CY - RY * 0.5, hh = RY;
  fb2.rect(tx - 1, top - 1, 6, hh + 2, C.ink);
  fb2.rect(tx, top + hh * 0.8, 4, hh * 0.2, C.cyan);
  fb2.disc(tx + 2, top + hh + 4, 4, C.blue);
  text(fb2, "DENTRO", tx - 6, top - 12, C.cyan, C.ink);
  marco(fb2, R, "\xD710.000.000", g < 0.5 ? "EL ESCUDO SE DESHACE" : "CADA TROCITO SE LLEVA EL CALOR", dlgY);
}
function microEscena(fb2, modo, u, t, dlgY = H) {
  CY = VERT3 ? 122 : Math.round(dlgY / 2);
  const R = VERT3 ? 80 : Math.round(Math.min(W, dlgY) * 0.46);
  RX = VERT3 ? 80 : Math.round(W * 0.47);
  RY = VERT3 ? 80 : Math.round(dlgY * 0.47);
  if (modo in ETAPA) secAire(fb2, ETAPA[modo] + u, t, R, dlgY);
  else if (modo === "ablacion" || modo === "ablacion2") secEscudo(fb2, (modo === "ablacion" ? 0 : 0.5) + u * 0.5, t, R, dlgY);
  else micro(fb2, 400, t, false, dlgY);
}

// page/main.js
var q = new URLSearchParams(location.search);
var ID = q.get("id") || "Largo";
var DIR = q.get("d") ? `./data/${q.get("d")}` : "./data";
var D = window.RPG_DATA ? window.RPG_DATA.comp : await (await fetch(`${DIR}/${ID}.json`)).json();
var AMP = window.RPG_DATA ? window.RPG_DATA.amp : await (await fetch(`${DIR}/amp.json`)).json();
var RPG = D.rpg || null;
await loadPhotos(RPG ? RPG.fotos : ["servidores", "nasdaq", "newton", "tierra_noche"]);
var fb = new FB();
var fbO = new FB();
var out = makeOut(document.getElementById("c"));
var bufA = new Uint32Array(W * H);
var bufB = new Uint32Array(W * H);
var BW = W * 6;
var BH = H * 6;
var cv = document.getElementById("c");
cv.width = BW;
cv.height = BH;
var g2 = cv.getContext("2d");
g2.imageSmoothingEnabled = false;
var loO = document.createElement("canvas");
loO.width = W;
loO.height = H;
var gO = loO.getContext("2d");
var imgO = gO.createImageData(W, H);
var u32O = new Uint32Array(imgO.data.buffer);
function show(z = 1, fx = W / 2, fy = H / 2, overlay = false, lutO = null) {
  const sw = W / z, sh = H / z, sx = clamp(fx - sw / 2, 0, W - sw), sy = clamp(fy - sh / 2, 0, H - sh);
  g2.imageSmoothingEnabled = false;
  g2.drawImage(out.lo, sx, sy, sw, sh, 0, 0, BW, BH);
  if (overlay) {
    const d = fbO.d;
    for (let i = 0; i < d.length; i++) u32O[i] = d[i] === T ? 0 : lutO[d[i]];
    gO.putImageData(imgO, 0, 0);
    g2.drawImage(loO, 0, 0, BW, BH);
  }
}
var CHF = VERT2 ? 197 : FLOOR;
var BPM = 88;
var BEAT = 60 / BPM;
var HB = BEAT / 2;
var qa = (s, at) => Math.max(0.04, Math.round((s.start + at) / HB) * HB - s.start);
var beatP = (t) => {
  const ph = (t % BEAT + BEAT) % BEAT / BEAT;
  return Math.max(0, 1 - ph * 3.5);
};
var LUGAR = RPG ? { ...RPG.lugar, gancho_short: RPG.gancho_lugar } : { gancho: "hoy", gancho_short: "hoy", que_es: "mercado", curiosidad: "londres", gasto: "datos", quien: "datos", si_burbuja: "hoy", no_burbuja: "hoy", puntocom: "nasdaq", escenarios: "cruce", senales: "mirador", cierre: "puerta" };
var ERA = RPG ? RPG.era : { curiosidad: "gb", puntocom: "nes" };
var segs = D.segs;
var capReal = (s) => s.cap === "gancho_short" ? (segs.find((x) => x.cap && x.cap !== "gancho_short") || {}).cap : s.cap;
var eraOf = (s) => s.kind !== "escena" || s.cap === "gancho_short" ? "snes" : ERA[capReal(s)] || "snes";
var lugarOf = (s) => s.kind !== "escena" ? "puerta" : LUGAR[s.cap] || "hoy";
var LUTOF = { snes: LUT.full, nes: LUT.nes, gb: LUT.gb4 };
var TEMA = {
  snes: { skin: "snes", txt: C.white, sh: C.night, hi: C.yellow, dim: C.steel },
  nes: { skin: "nes", txt: C.white, sh: null, hi: C.amber, dim: C.steel },
  gb: { skin: "gb", txt: GBI[0], sh: null, hi: GBI[0], dim: GBI[1] }
};
var L = VERT2 ? { area: { x: 8, y: 66, w: 164, h: 122 }, chx: 152, hud: 44, dlg: { x: 6, y: 202, w: 168, h: 40 }, maxc: 22 } : { area: { x: 102, y: 22, w: 212, h: 106 }, chx: 54, hud: 4, dlg: { x: 4, y: 134, w: 312, h: 42 }, maxc: 46 };
var TR0 = 0.9;
var TRD = 1.8;
var DENTRO = ["slide", "minimo", "walk", "iris", "maximo", "walk"];
var ENTRE = ["maximo", "walk", "minimo", "iris", "zoomout", "slide"];
var DIVE = /* @__PURE__ */ new Set(["minimo", "maximo"]);
var TRk = (k) => trans[k] === "corte" ? 0.08 : DIVE.has(trans[k]) ? TRD : TR0;
var MICRO = /* @__PURE__ */ new Set(["micro", "micro_agua"]);
var MPRE = 0.5;
var MPOST = 2.3;
var PRE = (k) => MICRO.has(trans[k]) ? MPRE : TRk(k) / 2;
var POST = (k) => MICRO.has(trans[k]) ? MPOST : TRk(k) / 2;
var trans = [];
{
  let a = 0, b = 0, last = "";
  for (let k = 1; k < segs.length; k++) {
    const A2 = segs[k - 1], B = segs[k];
    let ty;
    if (eraOf(A2) !== eraOf(B)) ty = "era";
    else if (A2.kind !== "escena" || B.kind !== "escena") ty = "thumb";
    else if (A2.cap === B.cap) ty = DENTRO[a++ % DENTRO.length];
    else ty = ENTRE[b++ % ENTRE.length];
    if (ty === last && ty !== "era") ty = ty === "slide" ? "iris" : "slide";
    if (B.escena && B.escena.transicion) ty = B.escena.transicion;
    const esMicro = (x) => x.escena && x.escena.tipo === "microscopio";
    if (ty === "corte" && !(esMicro(A2) && esMicro(B))) ty = "minimo";
    if (esMicro(A2) && !esMicro(B) && ty !== "maximo") ty = "maximo";
    trans[k] = ty;
    last = ty;
  }
}
var camOf = (k) => k * 140;
var CUES = [];
function cues(k) {
  if (CUES[k]) return CUES[k];
  const s = segs[k], c2 = { acc: [] };
  if (s.kind === "sub") {
    c2.win = qa(s, 0.3);
    c2.tap = qa(s, s.dur * 0.62);
    c2.acc = [c2.tap];
  } else if (s.kind === "final") {
    c2.win = qa(s, 0.1);
    c2.big = qa(s, 0.45);
    c2.tap = qa(s, s.dur - 0.7);
    c2.acc = [c2.big, c2.tap];
  } else {
    const e = s.escena;
    switch (e.tipo) {
      case "titulo":
        c2.icon = qa(s, 0.05);
        c2.land = c2.icon + BEAT;
        c2.title = qa(s, 0.6);
        c2.acc = [c2.title];
        break;
      case "tarjetas": {
        c2.win = qa(s, 0.1);
        c2.items = [];
        let t0 = qa(s, 0.45);
        (e.items || []).forEach(() => {
          c2.items.push(t0);
          t0 += Math.max(BEAT, Math.round(0.75 / HB) * HB);
        });
        c2.acc = c2.items.slice(-1);
        break;
      }
      case "cifra":
        c2.icon = qa(s, 0.05);
        c2.win = qa(s, 0.3);
        c2.val = qa(s, 0.45);
        c2.settle = c2.val + 0.07 * (e.valor || "").length + 0.2;
        c2.lab = qa(s, 1.05);
        c2.acc = [c2.settle];
        break;
      case "grafica":
        c2.win = qa(s, 0.05);
        c2.draw = qa(s, 0.35);
        c2.lab = c2.draw + 1.4;
        c2.acc = [c2.lab];
        break;
      case "comparar":
        c2.msg = qa(s, 0.05);
        c2.L = qa(s, 0.3);
        c2.R = c2.L + BEAT;
        c2.h1 = c2.R + BEAT * 1.5;
        c2.h2 = c2.h1 + BEAT * 1.5;
        c2.acc = [c2.h1, c2.h2];
        break;
      case "foto":
        c2.win = qa(s, 0.05);
        c2.lab = qa(s, 0.5);
        c2.acc = [c2.win + 0.2];
        break;
      case "microscopio":
        c2.acc = [];
        break;
      case "suscribete":
        c2.win = qa(s, 0.3);
        c2.tap = qa(s, s.vozDur * 0.55);
        c2.acc = [c2.tap];
        break;
      default:
        c2.icon = qa(s, 0.05);
        c2.land = c2.icon + 0.45;
        c2.acc = [c2.land];
    }
  }
  return CUES[k] = c2;
}
function camZoom(k, lt) {
  const s = segs[k], c2 = cues(k), u = clamp(lt / Math.max(1, s.dur), 0, 1), dir = k % 2 ? -1 : 1;
  const za = VERT2 ? 0.04 : 0.07;
  let z = dir > 0 ? 1 + za * eio(u) : 1 + za - za * eio(u);
  for (const a of c2.acc) {
    const d = lt - a;
    if (d > -0.3 && d < 2) z += (VERT2 ? 0.03 : 0.05) * (d < 0 ? 1 + d / 0.3 : Math.exp(-d * 2.5));
  }
  const A2 = L.area, fx = VERT2 ? W / 2 : W / 2 * 0.4 + (A2.x + A2.w / 2) * 0.6, fy = VERT2 ? 150 : H / 2 * 0.45 + (A2.y + A2.h / 2) * 0.55;
  return { z, fx, fy };
}
function hopAt(k, lt) {
  let h = 0;
  for (const a of cues(k).acc) {
    const d = lt - a + 0.05;
    if (d > 0 && d < 0.32) h = Math.max(h, Math.sin(Math.PI * d / 0.32));
  }
  return h;
}
var norm = (w) => w.toLowerCase().replace(/[¿?¡!,.:;…"]/g, "");
var limpiar = (s) => s.replace(/[¿?¡!,.:;…]/g, "").toUpperCase();
var silabas = (w) => Math.max(1, (w.match(/[aeiouáéíóúü]+/gi) || []).length);
function ampAt(s, lt) {
  const a = AMP[s.voz] || [];
  if (lt < 0 || lt > s.vozDur) return 0;
  return a[Math.floor((lt + s.vozDesde) * 24)] || 0;
}
function centerText(s, y, col, sh, sc = 1, x0 = 0, w = W) {
  text(fb, s, x0 + Math.round((w - textW(s, sc)) / 2), y, col, sh, sc);
}
var titleCol = (th) => th.skin === "gb" ? GBI[3] : ((y) => y < 2 ? C.white : y < 4 ? C.yellow : y < 6 ? C.amber : C.orange);
function lineas(words, maxc) {
  const out2 = [[]];
  let len = 0;
  words.forEach((w, i) => {
    const cur = out2[out2.length - 1];
    if (cur.length && len + 1 + w.length > maxc) {
      out2.push([i]);
      len = w.length;
    } else {
      cur.push(i);
      len += (cur.length > 1 ? 1 : 0) + w.length;
    }
  });
  return out2;
}
function dialogo(s, lt, th, fb2) {
  const e = s.escena;
  if (!e) return;
  const { x, y, w, h } = L.dlg;
  win(fb2, x, y, w, h, th.skin);
  const amp = ampAt(s, lt);
  portrait(fb2, x + 5, y + 4, { talk: amp > 0.25 ? amp : 0, t: s.start + lt });
  const words = e.texto.split(/\s+/), syl = words.map(silabas), tot = syl.reduce((a, b) => a + b, 0), habla = s.vozDur * 0.92;
  const at = [];
  let acc = 0;
  syl.forEach((v) => {
    at.push(0.05 + acc / tot * habla);
    acc += v;
  });
  const ls = lineas(words, L.maxc), hl = new Set((e.destacar || []).map(norm));
  let k = 0;
  for (let i = 0; i < ls.length; i++) if (i === 0 || lt >= at[ls[i][0]] - 0.05) k = i;
  let tx = x + 44;
  const ty = y + Math.round(h / 2) - 4;
  for (const i of ls[k]) {
    if (lt < at[i]) break;
    const wd = words[i], n = Math.min(wd.length, Math.floor((lt - at[i]) * 40) + 1);
    const vis = wd.slice(0, n), on = hl.has(norm(wd));
    if (on && th.skin !== "gb") fb2.rect(tx - 1, ty - 1, textW(vis) + 2, 9, C.yellow);
    text(fb2, vis, tx, ty, on ? th.skin === "gb" ? GBI[0] : C.ink : th.txt, on ? null : th.sh);
    if (on && th.skin === "gb") fb2.hline(tx, tx + textW(vis), ty + 8, GBI[1]);
    tx += textW(wd + " ");
  }
  if (lt > s.vozDur && Math.floor(lt * 3) % 2 === 0) text(fb2, "\u25BC", x + w - 12, y + h - 12, th.txt);
}
function hud(s, th, fb2) {
  const lug = NOMBRE[lugarOf(s)], a = "CHISPAZO", w = textW(a) + textW(lug) + 22;
  win(fb2, 4, L.hud, w, 15, th.skin);
  text(fb2, a, 10, L.hud + 4, th.skin === "gb" ? GBI[0] : C.yellow, th.sh);
  text(fb2, lug, 16 + textW(a), L.hud + 4, th.skin === "gb" ? GBI[1] : C.silver, th.sh);
}
function winA(x, y, w, h, skin, lt, at) {
  const p = clamp((lt - at) / 0.34, 0, 1);
  if (p <= 0) return false;
  const e = Math.min(1.04, backOut(p, 1.1)), ww = Math.max(8, Math.round(w * e)), hh = Math.max(6, Math.round(h * (p < 1 ? Math.min(1, e) : 1)));
  win(fb, Math.round(x + (w - ww) / 2), Math.round(y + (h - hh) / 2), ww, hh, skin);
  return p >= 0.85;
}
function backOut(t, k = 1.7) {
  t = clamp(t, 0, 1);
  const c3 = k + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
}
function burst(cx, cy, dt, col, n = 10, sp = 70) {
  if (dt <= 0 || dt > 0.45) return;
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283 + 0.3, r2 = 5 + dt * sp, x = Math.round(cx + Math.cos(a) * r2 * 1.3), y = Math.round(cy + Math.sin(a) * r2 * 0.8);
    fb.px(x, y, col);
    if (dt < 0.25) {
      fb.px(x - 1, y, col);
      fb.px(x + 1, y, col);
      fb.px(x, y - 1, col);
      fb.px(x, y + 1, col);
    }
  }
}
function dmg(x, y, dt, s2, col) {
  if (dt <= 0 || dt > 0.9 || dt > 0.6 && Math.floor(dt * 16) % 2) return;
  textOutlined(fb, s2, Math.round(x - textW(s2) / 2), Math.round(y - dt * 22), col, C.ink, 1);
}
function dropTitle(s, cx, y, maxW, col, lt, at) {
  let sc = 2, lines = wrap(s, maxW / 2);
  if (lines.length > 2 || lines.some((l) => textW(l, 2) > maxW)) {
    sc = 1;
    lines = wrap(s, maxW);
  }
  let n = 0;
  lines.forEach((ln, li) => {
    let x = Math.round(cx - textW(ln, sc) / 2);
    for (const ch of ln) {
      const p = clamp((lt - at - n * 0.055) / 0.4, 0, 1);
      n++;
      if (p > 0) textOutlined(fb, ch, x, y + li * sc * 10 - Math.round((1 - backOut(p, 1.3)) * 9), col, C.ink, sc);
      x += textW(ch + " ", sc) - textW(" ", sc) + sc;
    }
  });
  return lines.length * sc * 10;
}
var PUNTOS = {
  sube: [[0, 0.9], [0.2, 0.84], [0.4, 0.7], [0.55, 0.52], [0.75, 0.3], [1, 0.06]],
  cae: [[0, 0.55], [0.2, 0.38], [0.42, 0.16], [0.55, 0.12], [0.66, 0.35], [0.78, 0.82], [1, 0.9]],
  pico: [[0, 0.9], [0.3, 0.86], [0.42, 0.66], [0.52, 0.08], [0.62, 0.55], [0.74, 0.9], [1, 0.92]],
  suave: [[0, 0.62], [0.25, 0.34], [0.48, 0.24], [0.7, 0.3], [1, 0.5]]
};
var TARJ = [C.yellow, C.cyan, C.lime, C.orange, C.pink, C.red];
function contenido(k, s, lt, th) {
  const e = s.escena, A2 = L.area, cx = A2.x + A2.w / 2, c2 = cues(k), bp = beatP(s.start + lt);
  switch (e.tipo) {
    case "titulo": {
      const tt0 = e.texto_grande || limpiar((e.destacar || [""])[0]), dos = wrap(tt0, (A2.w - 16) / 2).length > 1;
      const sz = VERT2 ? 60 : dos ? 38 : 52, p = clamp((lt - c2.icon) / 0.45, 0, 1);
      const ic = iconSprite(e.icono || "bombilla", sz, clamp((lt - 0.1) / 1, 0, 1));
      const iy = A2.y + 4 + Math.round((1 - backOut(p, 1.8)) * 30) - Math.round(bp * 2);
      if (p > 0) fb.blit(ic, Math.round(cx - ic.w / 2), iy);
      burst(cx, A2.y + 4 + sz / 2, lt - c2.land, th.skin === "gb" ? GBI[3] : C.yellow, 12);
      const tt = e.texto_grande || limpiar((e.destacar || [""])[0]);
      const two = wrap(tt, (A2.w - 16) / 2).length > 1, w = two ? A2.w : Math.min(A2.w, textW(tt, 2) + 20);
      if (winA(Math.round(cx - w / 2), A2.y + sz + 10, w, two ? 50 : 30, th.skin, lt, c2.title - 0.1)) dropTitle(tt, cx, A2.y + sz + 18, A2.w - 16, titleCol(th), lt, c2.title);
      break;
    }
    case "tarjetas": {
      const it = e.items || [], rowH = 15, h = 14 + it.length * rowH;
      const w = Math.min(A2.w, Math.max(...it.map((x2) => textW(x2))) + 40);
      const x = Math.round(cx - w / 2), y = A2.y + Math.round((A2.h - h) / 2);
      if (!winA(x, y, w, h, th.skin, lt, c2.win)) break;
      let cur = -1, prev = 0;
      it.forEach((s2, i) => {
        const at = c2.items[i];
        if (lt < at) return;
        cur = i;
        const p = clamp((lt - at) / 0.22, 0, 1), off = Math.round((1 - eo(p)) * 40);
        if (lt - at < 0.15 && th.skin !== "gb") fb.rect(x + 16, y + 7 + i * rowH, w - 22, 11, C.blue);
        fb.clip = [x + 4, y, x + w - 4, y + h];
        text(fb, s2, x + 20 + off, y + 9 + i * rowH, th.skin === "snes" ? TARJ[i % TARJ.length] : th.txt, th.sh);
        fb.clip = [0, 0, W, H];
      });
      if (cur >= 0) {
        const at = c2.items[cur], from = cur > 0 ? cur - 1 : cur, f = eo(clamp((lt - at) / 0.12, 0, 1));
        hand(fb, x + 5, Math.round(y + 9 + (from + (cur - from) * f) * rowH), lt, true);
      }
      if (e.icono) {
        const ic = iconSprite(e.icono, 26, clamp(lt / 0.8, 0, 1));
        fb.blit(ic, x + w - 14, y - 14 - Math.round(bp * 2));
      }
      break;
    }
    case "cifra": {
      const val = e.valor || "", sc = textW(val, 3) < A2.w - 20 ? 3 : textW(val, 2) < A2.w - 20 ? 2 : 1;
      const ic = e.icono ? iconSprite(e.icono, 30, clamp(lt / 0.8, 0, 1)) : null;
      const w = Math.min(A2.w, Math.max(textW(val, sc), textW(e.etiqueta || "")) + 24), h = 22 + sc * 8 + (e.etiqueta ? 14 : 0);
      const x = Math.round(cx - w / 2), y = A2.y + (ic ? 30 : 16);
      if (ic) {
        const p = clamp((lt - c2.icon) / 0.4, 0, 1);
        if (p > 0) fb.blit(ic, Math.round(cx - 15), y - 32 + Math.round((1 - backOut(p)) * 20) - Math.round(bp * 2));
      }
      const shake = lt - c2.settle > 0 && lt - c2.settle < 0.2 ? [2, -2, 1, -1, 0][Math.floor((lt - c2.settle) * 24)] || 0 : 0;
      if (!winA(x + shake, y, w, h, th.skin, lt, c2.win)) break;
      if (lt > c2.val) {
        let shown = "";
        [...val].forEach((ch, i) => {
          const st = c2.val + i * 0.07;
          if (lt < st) return;
          shown += /\d/.test(ch) && lt < st + 0.2 ? String(Math.floor(hash(i, Math.floor(lt * 30)) * 10)) : ch;
        });
        textOutlined(fb, shown, Math.round(cx - textW(val, sc) / 2) + shake, y + 8, titleCol(th), C.ink, sc);
      }
      burst(cx, y + 8 + sc * 4, lt - c2.settle, th.skin === "gb" ? GBI[3] : C.yellow, 14, 90);
      if (e.etiqueta && lt > c2.lab) {
        const p = backOut(clamp((lt - c2.lab) / 0.2, 0, 1), 2);
        centerText(e.etiqueta, y + 12 + sc * 8 + Math.round((1 - p) * 6), th.skin === "snes" ? C.cyan : th.txt, th.sh, 1, x, w);
      }
      break;
    }
    case "grafica": {
      const x = A2.x + 6, y = A2.y + 6, w = A2.w - 12, h = A2.h - 12;
      if (!winA(x, y, w, h, th.skin, lt, c2.win)) break;
      const gx = x + 10, gy = y + 8, gw = w - 20, gh = h - 18;
      fb.vline(gx, gy, gy + gh, th.txt);
      fb.hline(gx, gx + gw, gy + gh, th.txt);
      for (let i = 1; i < 6; i++) fb.px(gx + Math.round(gw * i / 6), gy + gh + 1, th.txt);
      const P = PUNTOS[e.forma || "sube"], pr = clamp((lt - c2.draw) / 1.4, 0, 1);
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        if (u > pr) break;
        let j = 0;
        while (j < P.length - 2 && P[j + 1][0] < u) j++;
        const [a0, b0] = P[j], [a1, b1] = P[j + 1];
        const f = (u - a0) / (a1 - a0);
        const v = b0 + (b1 - b0) * eio(clamp(f, 0, 1));
        pts.push([gx + 1 + u * (gw - 2), gy + v * gh]);
      }
      for (const [px, py] of pts) for (let yy = Math.round(py) + 2; yy < gy + gh; yy++) if (bayer(Math.round(px), yy) < 0.4) fb.px(Math.round(px), yy, th.skin === "snes" ? C.blue : th.dim);
      const lc = th.skin === "gb" ? GBI[0] : C.red;
      for (let i = 1; i < pts.length; i++) {
        fb.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], lc);
        fb.line(pts[i - 1][0], pts[i - 1][1] + 1, pts[i][0], pts[i][1] + 1, lc);
      }
      const et = e.etiquetas || [];
      if (et[1]) {
        for (let xx = gx; xx < gx + gw; xx += 4) fb.hline(xx, xx + 1, gy + gh * 0.45, th.skin === "snes" ? C.cyan : th.txt);
        text(fb, et[1], gx + 4, gy + gh * 0.45 + 3, th.skin === "snes" ? C.cyan : th.txt, th.sh);
      }
      if (pts.length) {
        const [px, py] = pts[pts.length - 1], hx = Math.round(px), hy = Math.round(py), sc2 = pr < 1 ? 1 : 1 + Math.round(bp);
        fb.disc(hx, hy, 1 + sc2, th.skin === "gb" ? GBI[0] : C.yellow);
        if (pr < 1 && Math.floor(lt * 12) % 2) {
          fb.px(hx, hy - 4, C.white);
          fb.px(hx, hy + 4, C.white);
          fb.px(hx - 4, hy, C.white);
          fb.px(hx + 4, hy, C.white);
        }
        burst(hx, hy, lt - c2.lab, th.skin === "gb" ? GBI[0] : C.yellow, 8, 50);
      }
      if (et[0] && lt > c2.lab) {
        const [px, py] = pts[pts.length - 1];
        const s2 = et[0], tw = textW(s2) + 8;
        const bx = clamp(Math.round(px - tw - 2), gx + 2, gx + gw - tw), by = clamp(Math.round(py - 16), gy, gy + gh - 12);
        if (winA(bx, by, tw, 13, th.skin, lt, c2.lab)) text(fb, s2, bx + 4, by + 3, th.hi, th.sh);
      }
      break;
    }
    case "comparar": {
      const bw = Math.round((A2.w - 30) / 2), bh = 44, y = A2.y + 26;
      const msg = "\xA1COMBATE!", mw = textW(msg) + 20;
      if (winA(Math.round(cx - mw / 2), A2.y + 2, mw, 16, th.skin, lt, c2.msg)) text(fb, msg.slice(0, Math.floor((lt - c2.msg) * 30)), Math.round(cx - textW(msg) / 2), A2.y + 6, th.txt, th.sh);
      const sides = [[e.izq, A2.x + 4, c2.L, -1, c2.h1, c2.h2], [e.der, A2.x + A2.w - 4 - bw, c2.R, 1, c2.h2, c2.h1]];
      sides.forEach(([nm, x0, at, dir, atk, hurt], i) => {
        if (lt < at) return;
        const pin = eo(clamp((lt - at) / 0.25, 0, 1));
        let x = Math.round(x0 + dir * (1 - pin) * 90);
        const da = lt - atk;
        if (da > 0 && da < 0.2) x += Math.round(-dir * Math.sin(da / 0.2 * Math.PI) * 10);
        const dh = lt - hurt;
        const flash = dh > 0 && dh < 0.16 && Math.floor(dh * 24) % 2 === 0;
        if (dh > 0 && dh < 0.25) x += [3, -3, 2, -2, 1, 0][Math.floor(dh * 24)] || 0;
        win(fb, x, y, bw, bh, th.skin);
        if (flash && th.skin !== "gb") fb.rect(x + 3, y + 3, bw - 6, bh - 6, C.white);
        const s2 = nm || "", sc = textW(s2, 2) < bw - 10 ? 2 : 1;
        textOutlined(fb, s2, Math.round(x + (bw - textW(s2, sc)) / 2), y + 8, th.skin === "snes" ? (() => i ? C.pink : C.cyan) : th.txt, C.ink, sc);
        const hp = 1 - (i ? 0.45 : 0.3) * eo(clamp((lt - hurt) / 0.5, 0, 1));
        text(fb, "HP", x + 8, y + bh - 22, th.dim, null);
        fb.rect(x + 8, y + bh - 12, bw - 16, 5, C.ink);
        fb.rect(x + 9, y + bh - 11, Math.round((bw - 18) * hp), 3, th.skin === "snes" ? hp > 0.6 ? C.lime : C.amber : th.txt);
        dmg(x + bw / 2, y - 2, dh, i ? "-45" : "-30", th.skin === "snes" ? C.red : th.txt);
      });
      if (lt > c2.R) {
        const v = "VS", sc = 2 + (beatP(s.start + lt) > 0.7 ? 1 : 0);
        textOutlined(fb, v, Math.round(cx - textW(v, sc) / 2), y + 22 - sc * 4, th.skin === "snes" ? C.yellow : th.txt, C.ink, sc);
      }
      break;
    }
    case "foto": {
      const fw = VERT2 ? A2.w : A2.w - 6, fh = VERT2 ? 96 : A2.h - 26, x = Math.round(cx - fw / 2), y = A2.y + 14;
      if (!winA(x - 4, y - 4, fw + 8, fh + 22, th.skin, lt, c2.win)) break;
      const pos = e.encuadre ? parseFloat(e.encuadre.split(" ")[1]) / 100 : 0.5, u = clamp(lt / Math.max(1, s.dur), 0, 1);
      fb.blit(photoSprite(e.foto, fw, fh, pos, k % 2 ? 1.16 - 0.14 * u : 1 + 0.14 * u), x, y);
      if (lt - c2.win < 0.12) fb.rect(x, y, fw, fh, C.white);
      const cred = (e.credito || "").replace(/^(Foto|Retrato|Imagen): /, "").replace(", v\xEDa Wikimedia Commons", "").replace("dominio p\xFAblico", "dom. p\xFAblico").replace(" (Black Marble)", "");
      text(fb, cred, x + 2, y + fh + 5, th.dim, null);
      if (e.etiqueta && lt > c2.lab) {
        const tw = textW(e.etiqueta) + 14;
        if (winA(Math.round(cx - tw / 2), y - 16, tw, 15, th.skin, lt, c2.lab)) text(fb, e.etiqueta, Math.round(cx - textW(e.etiqueta) / 2), y - 12, th.hi, th.sh);
      }
      break;
    }
    case "suscribete": {
      menuSub(lt, c2.tap, th, "\xBFGUARDAR PARTIDA?", c2.win);
      break;
    }
    default: {
      if (s.cap === "cierre") {
        guardado(lt, th);
        break;
      }
      const sz = VERT2 ? 76 : 70, ic = iconSprite(e.icono || "bombilla", sz, clamp((lt - 0.1) / 1, 0, 1));
      const p = clamp((lt - c2.icon) / 0.45, 0, 1);
      if (p <= 0) break;
      const y = A2.y + 2 + Math.round((1 - backOut(p, 1.8)) * 40) - Math.round(bp * 2);
      fb.rect(Math.round(cx - 24), A2.y + A2.h - 10, 48, 6, th.skin === "gb" ? GBI[1] : C.slate);
      fb.hline(Math.round(cx - 24), Math.round(cx + 23), A2.y + A2.h - 10, th.skin === "gb" ? GBI[0] : C.ink);
      fb.blit(ic, Math.round(cx - sz / 2), y);
      burst(cx, y + sz / 2, lt - c2.land, th.skin === "gb" ? GBI[3] : C.yellow, 12, 80);
      for (let i = 0; i < 4; i++) {
        const ph = ((s.start + lt) / BEAT + i * 0.25) % 1;
        if (ph < 0.35) {
          const sx = Math.round(cx + (hash(i, Math.floor((s.start + lt) / BEAT)) - 0.5) * sz * 1.2), sy = Math.round(y + hash(i, 2) * sz);
          fb.px(sx, sy - 1, C.white);
          fb.px(sx - 1, sy, C.white);
          fb.px(sx + 1, sy, C.white);
          fb.px(sx, sy + 1, C.white);
        }
      }
    }
  }
}
function menuSub(lt, tap, th, titulo, at = 0) {
  const A2 = L.area, w = Math.min(A2.w, 150), x = Math.round(A2.x + A2.w / 2 - w / 2), y = A2.y + 8;
  if (!winA(x, y, w, 52, th.skin, lt, at)) return;
  text(fb, titulo, x + Math.round((w - textW(titulo)) / 2), y + 8, th.txt, th.sh);
  const done = lt >= tap;
  const op = done ? "SUSCRITO \u2713" : "SUSCR\xCDBETE";
  text(fb, op, x + 26, y + 24, done ? C.lime : C.yellow, th.sh);
  text(fb, "SEGUIR JUGANDO", x + 26, y + 37, th.dim, th.sh);
  hand(fb, x + 10, y + 24, lt, !done);
  burst(x + 50, y + 27, lt - tap, C.yellow, 12, 90);
}
var toIdx = {};
function eraMap(era) {
  if (toIdx[era]) return toIdx[era];
  const Lx = LUTOF[era], m = new Uint8Array(256);
  for (let i = 0; i < NPAL; i++) {
    const v = Lx[i], r2 = v & 255, g = v >> 8 & 255, b = v >> 16 & 255;
    let best = 0, bd = 1e9;
    for (let j = 0; j < NPAL; j++) {
      const c2 = RGB[j], d = (r2 - c2[0]) ** 2 + (g - c2[1]) ** 2 + (b - c2[2]) ** 2;
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    m[i] = best;
  }
  return toIdx[era] = m;
}
var thumbs = {};
function thumb(lugar, era, w, h) {
  const key = lugar + era + w;
  if (thumbs[key]) return thumbs[key];
  const big = new FB();
  LUGARES[lugar](big, 200, 3);
  const m = eraMap(era), d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = m[big.d[Math.floor(y / h * H) * W + Math.floor(x / w * W)]];
  return thumbs[key] = { w, h, d };
}
var PARTIDAS = RPG ? RPG.partidas : [
  { lugar: "londres", era: "gb", nombre: "LONDRES \xB7 1720", nota: "MARES DEL SUR" },
  { lugar: "nasdaq", era: "nes", nombre: "NUEVA YORK \xB7 2000", nota: "NASDAQ -78 %" },
  { lugar: "hoy", era: "snes", nombre: "HOY", nota: "\xBFLA IA ES UNA BURBUJA?" }
];
function guardado(lt, th) {
  const A2 = L.area, rowH = VERT2 ? 34 : 30, w = A2.w, x = A2.x, y = A2.y;
  win(fb, x, y, w, 16 + PARTIDAS.length * rowH, th.skin);
  text(fb, "PARTIDAS GUARDADAS", x + 8, y + 5, C.yellow, th.sh);
  const cur = Math.min(PARTIDAS.length - 1, Math.floor(lt / 1.1));
  PARTIDAS.forEach((p, i) => {
    if (lt < i * 0.35) return;
    const ry = y + 16 + i * rowH, tw = VERT2 ? 44 : 44, thh = Math.round(tw * 9 / 16);
    fb.rect(x + 18, ry, tw + 2, thh + 2, i === cur ? C.yellow : C.ink);
    fb.blit(thumb(p.lugar, p.era, tw, thh), x + 19, ry + 1);
    text(fb, `PARTIDA ${i + 1}`, x + 26 + tw, ry + 1, i === cur ? C.white : C.steel, th.sh);
    text(fb, p.nombre, x + 26 + tw, ry + 10, i === cur ? C.cyan : C.steel, th.sh);
    if (!VERT2) text(fb, p.nota, x + 26 + tw, ry + 19, i === cur ? C.yellow : C.slate, th.sh);
  });
  hand(fb, x + 5, y + 20 + cur * rowH, lt, true);
}
function renderSeg(k, t, sep = false) {
  const s = segs[k], lt = t - s.start, th = TEMA[eraOf(s)], c2 = cues(k);
  const bob = Math.floor(t / (BEAT * 2)) % 2, hop = hopAt(k, lt) * 0.6;
  const top = sep ? fbO : fb;
  if (sep) fbO.clear(T);
  if (s.kind === "sub") {
    LUGARES.puerta(fb, camOf(k), t);
    chispa(fb, VERT2 ? 90 : 56, CHF, { t, s: 2, wave: 1, talk: ampAt(s, lt), bob, hop });
    menuSub(lt, c2.tap, th, "\xBFQUIERES SABER M\xC1S?", c2.win);
    return LUT.full;
  }
  if (s.kind === "final") {
    LUGARES.puerta(fb, camOf(k), t);
    const A2 = L.area, rem = s.remate || "\xBFQUIERES VER M\xC1S?", w = A2.w;
    if (winA(A2.x, A2.y, w, 30, th.skin, lt, c2.win)) {
      const ls = wrap(rem, w - 12);
      ls.slice(0, 2).forEach((ln, i) => centerText(ln, A2.y + 6 + i * 10, C.pink, th.sh, 1, A2.x, w));
    }
    const t2 = "V\xCDDEO COMPLETO", t3 = "EN EL CANAL";
    const nl = wrap(t2, (w - 10) / 2).length, hh = nl * 20 + 22;
    if (winA(A2.x, A2.y + 36, w, hh, th.skin, lt, c2.big - 0.1)) {
      dropTitle(t2, A2.x + w / 2, A2.y + 43, w - 10, titleCol(th), lt, c2.big);
      if (lt > c2.big + 0.5) centerText(t3, A2.y + 36 + hh - 14, C.cyan, th.sh, 1, A2.x, w);
    }
    if (lt > c2.big + 0.7) {
      const op = lt > c2.tap ? "SUSCRITO \u2713" : "\u25B6 CONTINUAR";
      centerText(op, A2.y + 44 + hh - (beatP(t) > 0.6 && lt < c2.tap ? 1 : 0), C.yellow, th.sh, 1, A2.x, w);
    }
    burst(A2.x + w / 2, A2.y + 50 + hh, lt - c2.tap, C.yellow, 12, 90);
    chispa(fb, VERT2 ? 148 : L.chx, CHF, { t, wave: 1, talk: ampAt(s, lt), bob, hop });
    return LUT.full;
  }
  const e = s.escena, sub = e.tipo === "suscribete";
  if (e.tipo === "microscopio") {
    microEscena(fb, e.modo, clamp(lt / s.dur, 0, 1), t, L.dlg.y);
    dialogo(s, lt, th, top);
    return LUT.full;
  }
  LUGARES[lugarOf(s)](fb, camOf(k) + Math.round(lt * 6), t);
  let lunge = 0;
  if (e.tipo === "comparar") for (const a of [c2.h1, c2.h2]) {
    const d = lt - a;
    if (d > 0 && d < 0.2) lunge = Math.round(Math.sin(d / 0.2 * Math.PI) * 6);
  }
  chispa(fb, (sub ? VERT2 ? 90 : 56 : L.chx) + lunge, CHF, { t, s: sub ? 2 : 1, talk: ampAt(s, lt), wave: sub || e.tipo === "tarjetas" && c2.items && c2.items.some((a) => lt - a > 0 && lt - a < 0.3) ? 1 : 0, bob, hop, surprise: e.tipo === "cifra" && lt > c2.settle && lt < c2.settle + 0.8 ? 1 : 0 });
  contenido(k, s, lt, th);
  dialogo(s, lt, th, top);
  hud(s, th, top);
  return LUTOF[eraOf(s)];
}
function shiftCopy(dst, src, dx) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = x - dx;
    if (sx >= 0 && sx < W) dst[y * W + x] = src[y * W + sx];
  }
}
function compose(ty, p, k) {
  const u = out.u32;
  switch (ty) {
    case "mosaic": {
      u.set(p < 0.5 ? bufA : bufB);
      mosaic(u, Math.round(1 + 14 * (1 - Math.abs(p - 0.5) * 2)));
      break;
    }
    case "walk":
    case "whip": {
      const sp = ty === "whip" ? eio(p) : eo(p) * 0.5 + p * 0.5, off = Math.round(sp * W);
      u.fill(0);
      shiftCopy(u, bufA, -off);
      shiftCopy(u, bufB, W - off);
      break;
    }
    case "slide": {
      const off = Math.round(eio(p) * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const sy = y + off;
        u[y * W + x] = sy < H ? bufA[sy * W + x] : bufB[(sy - H) * W + x];
      }
      break;
    }
    case "iris": {
      const cx = L.chx, cy = FLOOR - 20, R = eio(p) * Math.hypot(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d = Math.hypot(x - cx, y - cy) - bayer8(x, y) * 10;
        u[y * W + x] = d < R ? bufB[y * W + x] : bufA[y * W + x];
      }
      break;
    }
    case "thumb": {
      const f = eo(clamp(p * 1.4 - 0.2, 0, 1));
      u.set(bufA);
      const rw = Math.max(2, Math.round(W * (0.15 + 0.85 * f))), rh = Math.max(2, Math.round(H * (0.15 + 0.85 * f))), rx = Math.round((W - rw) / 2), ry = Math.round((H - rh) / 2), n = Math.max(1, Math.round(10 * (1 - f)));
      if (p > 0.1) for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
        let sx = Math.floor((x - rx) / rw * W), sy = Math.floor((y - ry) / rh * H);
        sx = Math.floor(sx / n) * n;
        sy = Math.floor(sy / n) * n;
        u[y * W + x] = bufB[sy * W + sx];
      }
      if (p > 0.1 && f < 1) for (let x = rx - 1; x <= rx + rw; x++) {
        if (x >= 0 && x < W) {
          if (ry > 0) u[(ry - 1) * W + x] = 4294967295;
          if (ry + rh < H) u[(ry + rh) * W + x] = 4294967295;
        }
      }
      break;
    }
    case "door": {
      const c2 = p < 0.5 ? eo(p * 2) : 1 - eo((p - 0.5) * 2), half = Math.round(c2 * W / 2), src = p < 0.5 ? bufA : bufB;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        u[i] = x < half || x >= W - half ? x === half - 1 || x === W - half ? 4282661414 : 4280620056 : src[i];
      }
      break;
    }
    case "swirl": {
      const src = p < 0.55 ? bufA : bufB, s2 = p < 0.55 ? Math.pow(p / 0.55, 1.6) : Math.pow(1 - (p - 0.55) / 0.45, 1.6), n = 1 + Math.round(6 * s2);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = x - W / 2, dy = y - H / 2, r2 = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + s2 * 7 * (1.2 - r2 / 190);
        let sx = Math.round(W / 2 + Math.cos(a) * r2 * (1 - s2 * 0.35)), sy = Math.round(H / 2 + Math.sin(a) * r2 * (1 - s2 * 0.35));
        sx = clamp(Math.floor(sx / n) * n, 0, W - 1);
        sy = clamp(Math.floor(sy / n) * n, 0, H - 1);
        u[y * W + x] = src[sy * W + sx];
      }
      if (Math.abs(p - 0.55) < 0.08) {
        for (let i = 0; i < u.length; i++) if (bayer(i % W, i / W | 0) < 0.6) u[i] = 4294967295;
      }
      break;
    }
    default:
      u.set(p < 0.5 ? bufA : bufB);
  }
}
function frame(t) {
  let k = 0;
  for (let i = 0; i < segs.length; i++) if (segs[i].start <= t) k = i;
  let a = -1, b = -1, p = 0;
  if (k > 0 && t < segs[k].start + POST(k)) {
    a = k - 1;
    b = k;
    p = (t - (segs[k].start - PRE(k))) / (PRE(k) + POST(k));
  } else if (k + 1 < segs.length && t > segs[k + 1].start - PRE(k + 1)) {
    a = k;
    b = k + 1;
    p = (t - (segs[k + 1].start - PRE(k + 1))) / (PRE(k + 1) + POST(k + 1));
  }
  if (a < 0) {
    fb.clear(C.ink);
    const lut = renderSeg(k, t, true);
    let Lx = lut;
    if (t < 0.3) Lx = darken(lut, 1 - t / 0.3);
    if (t > D.dur - 0.4) Lx = darken(lut, (t - (D.dur - 0.4)) / 0.4);
    out.present(fb, Lx);
    const cz = segs[k].kind === "escena" && segs[k].escena.tipo === "microscopio" ? { z: 1, fx: W / 2, fy: H / 2 } : segs[k].kind === "escena" ? camZoom(k, t - segs[k].start) : { z: 1 + 0.06 * Math.sin((t - segs[k].start) * 1.5) ** 2, fx: W / 2, fy: H / 2 };
    show(cz.z, cz.fx, cz.fy, true, Lx);
    return;
  }
  const ty = trans[b];
  p = clamp(p, 0, 1);
  if (ty === "era") {
    const src = p < 0.5 ? a : b;
    fb.clear(C.ink);
    const lut = renderSeg(src, t);
    out.present(fb, darken(lut, p < 0.5 ? p * 2 : (1 - p) * 2));
    show(1 + 0.5 * Math.sin(p * Math.PI), L.chx, FLOOR - 20);
    return;
  }
  if (ty === "corte") {
    fb.clear(C.ink);
    const lut = renderSeg(p < 0.5 ? a : b, t, true);
    out.present(fb, lut);
    show(1, W / 2, H / 2, true, lut);
    return;
  }
  if (DIVE.has(ty)) {
    dive(ty, a, b, p, t);
    return;
  }
  if (MICRO.has(ty)) {
    microT(ty === "micro_agua", a, b, p, t);
    return;
  }
  if (ty === "zoomin" || ty === "zoomout") {
    const src = p < 0.5 ? a : b;
    fb.clear(C.ink);
    const lut = renderSeg(src, t);
    out.present(fb, lut);
    const m = p < 0.5 ? eio(p * 2) : 1 - eo((p - 0.5) * 2);
    if (ty === "zoomin") {
      out.post((u) => mosaic(u, Math.round(1 + 4 * m * m)));
      show(1 + 2.6 * m, L.chx, FLOOR - 20);
    } else {
      const z = p < 0.5 ? 1 + 0.9 * eio(p * 2) : 1.9 - 0.9 * eo((p - 0.5) * 2);
      show(z, W / 2, H / 2);
    }
    return;
  }
  fb.clear(C.ink);
  out.present(fb, renderSeg(a, t));
  bufA.set(out.u32);
  fb.clear(C.ink);
  out.present(fb, renderSeg(b, t));
  bufB.set(out.u32);
  out.post(() => compose(ty, p, b));
  show();
}
var cA = document.createElement("canvas");
var cB = document.createElement("canvas");
for (const c2 of [cA, cB]) {
  c2.width = W;
  c2.height = H;
}
var gA = cA.getContext("2d");
var gB = cB.getContext("2d");
var imA = gA.createImageData(W, H);
var imB = gB.createImageData(W, H);
var K = 56;
function detalle(k, i) {
  const ops = [[L.chx - 4, CHF - 24], [L.area.x + L.area.w * 0.5, L.area.y + L.area.h * 0.35], [W * (0.15 + 0.7 * hash(k, 3)), H * (0.08 + 0.1 * hash(k, 5))]];
  return ops[(k + i) % ops.length];
}
function drawDive(big, small, d, Z) {
  const S6 = 6, px = d[0] * S6, py = d[1] * S6;
  const Px = clamp(BW / 2, BW - (W - d[0]) * Z * S6, d[0] * Z * S6), Py = clamp(BH / 2, BH - (H - d[1]) * Z * S6, d[1] * Z * S6);
  g2.imageSmoothingEnabled = false;
  g2.drawImage(big, Px - d[0] * Z * S6, Py - d[1] * Z * S6, W * Z * S6, H * Z * S6);
  const z2 = Z / K, w2 = W * z2 * S6, h2 = H * z2 * S6;
  if (w2 > 3) {
    const bd = Math.max(2, Math.min(6, z2 * 6));
    g2.fillStyle = "#16161d";
    g2.fillRect(Px - w2 / 2 - bd, Py - h2 / 2 - bd, w2 + 2 * bd, h2 + 2 * bd);
    g2.drawImage(small, Px - w2 / 2, Py - h2 / 2, w2, h2);
  }
}
function dive(ty, a, b, p, t) {
  const conTexto = p < 0.5 ? a : b, sin = p < 0.5 ? b : a;
  fb.clear(C.ink);
  out.present(fb, renderSeg(sin, t, true));
  (sin === a ? imA : imB).data.set(new Uint8Array(out.u32.buffer));
  fb.clear(C.ink);
  const lut = renderSeg(conTexto, t, true);
  out.present(fb, lut);
  (conTexto === a ? imA : imB).data.set(new Uint8Array(out.u32.buffer));
  gA.putImageData(imA, 0, 0);
  gB.putImageData(imB, 0, 0);
  const e = eio(p), Z = ty === "minimo" ? Math.pow(K, e) : Math.pow(K, 1 - e);
  if (ty === "minimo") drawDive(cA, cB, detalle(b, 0), Z);
  else drawDive(cB, cA, detalle(b, 1), Z);
  if (p < 0.12 || p > 0.88) {
    const d = fbO.d;
    for (let i = 0; i < d.length; i++) u32O[i] = d[i] === T ? 0 : lut[d[i]];
    gO.putImageData(imgO, 0, 0);
    g2.drawImage(loO, 0, 0, BW, BH);
  }
}
var cM = document.createElement("canvas");
cM.width = W;
cM.height = H;
var gM = cM.getContext("2d");
var imM = gM.createImageData(W, H);
var P1 = 0.26;
var P2 = 0.72;
var SMAX = 420;
var CENTRO = [L.area.x + L.area.w / 2, L.area.y + L.area.h * 0.4];
function microT(conAgua, a, b, p, t) {
  const sM = p < P1 ? 1 : p > P2 ? SMAX : Math.pow(SMAX, eio((p - P1) / (P2 - P1)));
  fb.clear(C.ink);
  micro(fb, sM, t, conAgua, L.dlg.y);
  out.present(fb, LUT.full);
  imM.data.set(new Uint8Array(out.u32.buffer));
  gM.putImageData(imM, 0, 0);
  const seg = t < segs[b].start ? a : b;
  if (p < P1) {
    const q2 = p / P1;
    fb.clear(C.ink);
    out.present(fb, renderSeg(a, t));
    imA.data.set(new Uint8Array(out.u32.buffer));
    gA.putImageData(imA, 0, 0);
    drawDive(cA, cM, CENTRO, Math.pow(K, eio(q2)));
  } else if (p > P2) {
    const q2 = (p - P2) / (1 - P2);
    fb.clear(C.ink);
    out.present(fb, renderSeg(b, t));
    imB.data.set(new Uint8Array(out.u32.buffer));
    gB.putImageData(imB, 0, 0);
    drawDive(cB, cM, CENTRO, Math.pow(K, 1 - eio(q2)));
  } else {
    g2.imageSmoothingEnabled = false;
    g2.drawImage(cM, 0, 0, BW, BH);
  }
  fb.clear(C.ink);
  const lut = renderSeg(seg, t, true);
  if (p > 0.05 && p < 0.97) {
    const L0 = L.dlg;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!(y >= L0.y && y < L0.y + L0.h && x >= L0.x && x < L0.x + L0.w)) fbO.d[i] = T;
    }
  }
  const d = fbO.d;
  for (let i = 0; i < d.length; i++) u32O[i] = d[i] === T ? 0 : lut[d[i]];
  gO.putImageData(imgO, 0, 0);
  g2.drawImage(loO, 0, 0, BW, BH);
}
var EV = [];
var ev = (t, type, o = {}) => {
  if (t >= 0 && t <= D.dur) EV.push({ t: +t.toFixed(3), type, ...o });
};
segs.forEach((s, k) => {
  if (k > 0) {
    const ty = trans[k], t0 = s.start - PRE(k);
    ev(t0, "tr_" + ty);
    if (ty === "walk") for (let i = 0; i < 4; i++) ev(t0 + i * 0.15, "step");
  }
  const st = s.start, c2 = cues(k);
  if (s.kind === "sub") {
    ev(st + c2.win, "open");
    ev(st + c2.win + 0.3, "cursor");
    ev(st + c2.tap, "select");
    ev(st + c2.tap + 0.05, "save");
    return;
  }
  if (s.kind === "final") {
    ev(st + c2.win, "open");
    ev(st + c2.big, "fanfare");
    ev(st + c2.tap, "select");
    return;
  }
  const e = s.escena;
  switch (e.tipo) {
    case "titulo":
      ev(st + c2.icon, "rise");
      ev(st + c2.land, "sparkle");
      ev(st + c2.title - 0.1, "open");
      ev(st + c2.title, "letters", { n: Math.min(14, (e.texto_grande || (e.destacar || [""])[0]).length) });
      break;
    case "tarjetas":
      ev(st + c2.win, "open");
      c2.items.forEach((a) => ev(st + a, "cursor"));
      break;
    case "cifra":
      ev(st + c2.win, "open");
      ev(st + c2.val, "slots", { d: c2.settle - c2.val });
      ev(st + c2.settle, "fanfare");
      break;
    case "grafica":
      ev(st + c2.win, "open");
      ev(st + c2.draw, "draw", { d: 1.4 });
      ev(st + c2.lab, "sparkle");
      break;
    case "comparar":
      ev(st + c2.msg, "battle");
      ev(st + c2.L, "whoosh");
      ev(st + c2.R, "whoosh");
      ev(st + c2.h1, "hit");
      ev(st + c2.h2, "hit");
      break;
    case "foto":
      ev(st + c2.win, "flash");
      ev(st + c2.lab, "cursor");
      break;
    case "microscopio":
      if (e.modo === "plasma") ev(st + 0.6, "sparkle");
      break;
    case "suscribete":
      ev(st + c2.win, "open");
      ev(st + c2.tap, "select");
      ev(st + c2.tap + 0.05, "save");
      break;
    default:
      if (s.cap === "cierre") {
        ev(st, "open");
        [0, 1.1, 2.2].forEach((d) => ev(st + d, "cursor"));
        ev(st + 2.4, "save");
        break;
      }
      ev(st + c2.icon, "rise");
      ev(st + c2.land, "sparkle");
  }
});
var ERAS = segs.map((s) => ({ t0: s.start, t1: s.start + s.dur, era: eraOf(s) }));
window.render = frame;
window.grabLo = (t) => {
  frame(t);
  const b = new Uint8Array(out.u32.buffer);
  let s = "";
  for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768));
  return btoa(s);
};
window.grab = (t) => {
  frame(t);
  return cv.toDataURL("image/jpeg", 0.94).slice(23);
};
window.BIG = [BW, BH];
window.DUR = D.dur;
window.EV = EV;
window.ERAS = ERAS;
window.SIZE = [W, H];
window.RPG_FRAME = frame;
window.READY = true;
