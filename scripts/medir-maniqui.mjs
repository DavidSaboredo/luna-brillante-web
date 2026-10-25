// Lee public/modelos/maniqui.glb y calcula el perfil del torso (ancho y fondo por altura) para ajustar las prendas.
import fs from "node:fs";
const buf = fs.readFileSync(process.argv[2] ?? "public/modelos/maniqui.glb");
const jl = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jl).toString());
const binStart = 20 + jl + 8;
const prim = json.meshes[0].primitives[0];
const acc = json.accessors[prim.attributes.POSITION];
const bv = json.bufferViews[acc.bufferView];
const off = binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
const n = acc.count, P = new Float32Array(n * 3);
for (let i = 0; i < n * 3; i++) P[i] = buf.readFloatLE(off + i * 4);
let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], P[i * 3 + k]); max[k] = Math.max(max[k], P[i * 3 + k]); }
console.log("vertices", n, "min", min.map((v) => +v.toFixed(3)), "max", max.map((v) => +v.toFixed(3)));
const H = max[1] - min[1];
console.log("altura", H.toFixed(3));
for (let y = min[1] + 0.02; y < max[1]; y += H / 40) {
  const sel = [];
  for (let i = 0; i < n; i++) if (Math.abs(P[i * 3 + 1] - y) < 0.006) sel.push([P[i * 3], P[i * 3 + 2]]);
  const xs = sel.map((s) => s[0]).sort((a, b) => a - b);
  // intervalo central contiguo
  let l = 0, r = xs.length - 1;
  const mid = xs.findIndex((x) => x >= 0);
  let li = mid, ri = mid;
  while (li > 0 && xs[li] - xs[li - 1] < 0.025) li--;
  while (ri < xs.length - 1 && xs[ri + 1] - xs[ri] < 0.025) ri++;
  const zs = sel.filter((s) => s[0] >= xs[li] && s[0] <= xs[ri]).map((s) => s[1]);
  console.log(((y - min[1]) / H * 1.66).toFixed(2), "x", xs[li]?.toFixed(3), xs[ri]?.toFixed(3), "ancho", (xs[ri] - xs[li]).toFixed(3), "z", Math.min(...zs).toFixed(3), Math.max(...zs).toFixed(3), "total x", xs[0].toFixed(2), xs.at(-1).toFixed(2));
}
