# Modelado 3D de puntos de crochet en Blender: cada símbolo del diagrama (dc, sc, shell5, V, puff…) se convierte en hilo retorcido
# (tubos sobre curvas Catmull-Rom con normal map de hilo de 3 cabos) y se renderiza con Cycles.
# Uso:  blender -b --python punto3d.py -- <puntos.json> <carpeta salida> <id1,id2,...|todos> [muestras] [ancho]
import bpy, bmesh, json, math, os, re, sys, time
import numpy as np
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:]
RUTA_PUNTOS, SALIDA = ARGS[0], ARGS[1]
IDS = ARGS[2]
MUESTRAS = int(ARGS[3]) if len(ARGS) > 3 else 40
ANCHO_IMG = int(ARGS[4]) if len(ARGS) > 4 else 960
ALTO_IMG = int(ANCHO_IMG * 0.75)
TAU = math.pi * 2

R = 0.15  # radio del hilo (ancho de una puntada = 1)
COLORES = {0: "#7a68b5", 1: "#efe6d6", 2: "#d98a9c"}
ALTOS = {"ch": 0.0, "slst": 0.4, "sc": 0.82, "hdc": 1.15, "dc": 1.5, "tr": 1.95, "dtr": 2.4, "trtr": 2.85}
VUELTAS = {"hdc": 1, "dc": 1, "tr": 2, "dtr": 3, "trtr": 4}
lerp = lambda a, b, t: a + (b - a) * t


# --------------------------------------------------------------------------- geometría de hilo
def catmull(pts, cerrado=False, por_seg=7):
    P = [Vector(p) for p in pts]
    n = len(P)
    out = []
    rng = range(n) if cerrado else range(n - 1)
    for i in rng:
        p0 = P[(i - 1) % n] if (cerrado or i > 0) else P[0] * 2 - P[1]
        p1, p2 = P[i], P[(i + 1) % n]
        p3 = P[(i + 2) % n] if (cerrado or i + 2 < n) else P[-1] * 2 - P[-2]
        for k in range(por_seg):
            t = k / por_seg
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not cerrado:
        out.append(P[-1].copy())
    return out


class Escena3D:
    def __init__(self):
        self.mallas = {}  # color -> bmesh
        self.minb = Vector((1e9, 1e9, 1e9))
        self.maxb = Vector((-1e9, -1e9, -1e9))
        self.rnd = np.random.RandomState(7)

    def bm(self, color):
        if color not in self.mallas:
            b = bmesh.new()
            b.loops.layers.uv.new("UVMap")
            self.mallas[color] = b
        return self.mallas[color]

    def hilo(self, pts, color=0, cerrado=False, r=R, torsion_ofs=None):
        """pts en coordenadas 'three' (x, y arriba, z al frente); se pasan a Blender (x, -z, y)."""
        if len(pts) < 2:
            return
        s = catmull(pts, cerrado)
        if len(s) < 3:
            return
        b = self.bm(color)
        uvl = b.loops.layers.uv.active
        seg = 10
        anillos = []
        ref = Vector((0, 0, 1))
        largo = 0.0
        largos = [0.0]
        for i in range(1, len(s)):
            largo += (s[i] - s[i - 1]).length
            largos.append(largo)
        paso_torsion = TAU * R * 1.25  # una vuelta de torsión cada ~0,8 puntadas de hilo
        fase = (self.rnd.rand() if torsion_ofs is None else torsion_ofs)
        n = len(s)
        for i in range(n):
            if cerrado:
                tan = (s[(i + 1) % n] - s[i - 1]).normalized()
            else:
                tan = (s[min(i + 1, n - 1)] - s[max(i - 1, 0)]).normalized()
            if abs(tan.dot(ref)) > 0.95:
                ref = Vector((1, 0, 0))
            nrm = tan.cross(ref).normalized()
            bnr = tan.cross(nrm).normalized()
            ref = nrm
            anillo = []
            for k in range(seg):
                a = TAU * k / seg
                p = s[i] + (nrm * math.cos(a) + bnr * math.sin(a)) * r
                anillo.append(b.verts.new(Vector((p.x, -p.z, p.y))))
                for c in range(3):
                    self.minb[c] = min(self.minb[c], (p.x, -p.z, p.y)[c])
                    self.maxb[c] = max(self.maxb[c], (p.x, -p.z, p.y)[c])
            anillos.append(anillo)
        total_anillos = n if cerrado else n - 1
        for i in range(total_anillos):
            a, c = anillos[i], anillos[(i + 1) % n]
            v0, v1 = largos[i] / paso_torsion + fase, (largos[i + 1] if i + 1 < n else largo + (s[0] - s[-1]).length) / paso_torsion + fase
            for k in range(seg):
                k2 = (k + 1) % seg
                f = b.faces.new((a[k], a[k2], c[k2], c[k]))
                us = (k / seg, (k + 1) / seg)
                for l, (u, v) in zip(f.loops, ((us[0], v0), (us[1], v0), (us[1], v1), (us[0], v1))):
                    l[uvl].uv = (u, v)
        if not cerrado:
            for anillo in (anillos[0], anillos[-1]):
                try:
                    b.faces.new(anillo)
                except ValueError:
                    pass


# --------------------------------------------------------------------------- piezas de punto
def anillo_cabeza(E, cx, cy, color, rx=0.5, rz=0.3, inclina=0.35, fase=None, cz=0.0):
    n = 14
    pts = []
    f = E.rnd.rand() * TAU if fase is None else fase
    for i in range(n):
        a = f + TAU * i / n
        x, z0 = math.cos(a) * rx, math.sin(a) * rz
        pts.append((cx + x, cy - z0 * math.sin(inclina), cz + z0 * math.cos(inclina)))
    E.hilo(pts, color, cerrado=True)


def poste(E, x, y0, h, color, lean=0.1, vueltas=0, z=0.0, sentido=1, x_tope=None, cabeza=True):
    xt = x + lean if x_tope is None else x_tope
    dip = min(0.42, h * 0.5)
    pts = [
        (x - lean * 0.5, y0 - dip, z - 0.12 * sentido),
        (x, y0, z),
        ((x + xt) / 2, y0 + h * 0.45, z + 0.11),
        (xt, y0 + h * 0.85, z + 0.08),
        (xt, y0 + h - 0.05, z + 0.03),
    ]
    E.hilo(pts, color)
    for v in range(vueltas):
        f = 0.38 + v * 0.22 if vueltas > 1 else 0.55
        yy = y0 + h * f
        xx = lerp(x, xt, f)
        a0 = E.rnd.rand() * TAU
        arco = [(xx + math.cos(a0 + TAU * 1.05 * i / 10) * (R * 1.5 + 0.1), yy + (i / 10 - 0.5) * 0.1, z + math.sin(a0 + TAU * 1.05 * i / 10) * (R * 1.5 + 0.08)) for i in range(11)]
        E.hilo(arco, color)
    if cabeza and h > 0:
        anillo_cabeza(E, xt, y0 + h, color, cz=z)
    return (xt, y0 + h)


def eslabon(E, cx, cy, color, giro=0.0, largo=0.45, ancho=0.2, cz=0.0):
    n = 16
    pts = []
    for i in range(n):
        a = TAU * i / n
        x = math.cos(a) * largo
        t = math.sin(a) * ancho
        pts.append((cx + x, cy + t * math.cos(giro), cz + t * math.sin(giro)))
    E.hilo(pts, color, cerrado=True)


def parse(tok):
    tok = re.sub(r"\*\d+$", "", tok)
    tok = re.sub(r"^@\d+", "", tok)
    partes = tok.split(":")
    mods = set()
    cuerpo = []
    for p in partes:
        if p in ("c2", "fp", "bp", "blo", "flo", "long", "third", "waist", "thermal", "mid", "link", "herr", "spike"):
            mods.add(p)
        else:
            cuerpo.append(p)
    head = cuerpo[0] if cuerpo else "sc"
    sub = cuerpo[1] if len(cuerpo) > 1 else None
    extra = cuerpo[2] if len(cuerpo) > 2 else None
    return mods, head, sub, extra


def tipo_poste(nombre, defecto="dc"):
    return nombre if nombre in ALTOS and ALTOS[nombre] > 0 else defecto


def ancho_token(head):
    m = re.match(r"^(arc|shell|cl)(\d+)$", head)
    if m:
        n = int(m.group(2))
        return max(2, round(n * 0.6)) if m.group(1) == "arc" else max(2, round(n * 0.55) + 1) if m.group(1) == "shell" else max(2, round(n * 0.5) + 1)
    if head in ("V", "X", "solL", "solR", "fan"):
        return 2
    if head == "sol":
        return 3
    m = re.match(r"^(ch|sk)(\d+)$", head)
    if m:
        return int(m.group(2))
    return 1


def dibujar_token(E, tok, x0, y0, color):
    """Dibuja un símbolo con su centro en x0 sobre la altura y0. Devuelve (ancho, alto)."""
    mods, head, sub, extra = parse(tok)
    if "c2" in mods:
        color = 2
    w = ancho_token(head)
    cx = x0 + (w - 1) / 2
    z = 0.0
    if "fp" in mods:
        z = 0.2
    if "bp" in mods:
        z = -0.2
    lean = 0.1
    m = re.match(r"^(ch|sk)(\d+)?$", head)
    if m:
        n = int(m.group(2) or 1)
        if m.group(1) == "ch":
            for i in range(n):
                eslabon(E, x0 + i, y0 + 0.08, color, giro=0 if i % 2 else math.pi / 2, largo=0.42, ancho=0.18)
        return (n, 0.1)
    if head == "slst":
        eslabon(E, x0, y0 + 0.1, color, giro=0.2, largo=0.4, ancho=0.2)
        return (1, 0.4)
    if head in ALTOS:
        h = ALTOS[head] * (1.7 if "long" in mods else 1.0)
        base = y0 - (0.5 if "long" in mods else 0.0)
        poste(E, x0, base, h + (0.5 if "long" in mods else 0), color, lean, VUELTAS.get(head, 0), z)
        return (1, h)
    tip = tipo_poste(sub or "dc")
    h = ALTOS[tip]
    if head == "V":
        poste(E, cx - 0.5, y0, h, color, -0.2, VUELTAS.get(tip, 0), z, x_tope=cx - 0.55)
        poste(E, cx + 0.5, y0, h, color, 0.2, VUELTAS.get(tip, 0), z, x_tope=cx + 0.55)
        eslabon(E, cx, y0 + h + 0.05, color, giro=0.3, largo=0.28, ancho=0.14)
        return (2, h)
    if head == "X":
        tp = tipo_poste(sub if sub in ALTOS else "dc")
        hh = ALTOS[tp]
        poste(E, cx - 0.5, y0, hh, color, 0, VUELTAS.get(tp, 0), z + 0.06, x_tope=cx + 0.5)
        poste(E, cx + 0.5, y0, hh, color, 0, VUELTAS.get(tp, 0), z - 0.06, sentido=-1, x_tope=cx - 0.5)
        return (2, hh)
    m = re.match(r"^shell(\d+)$", head)
    if m or head == "fan" or head == "clfan":
        n = int(m.group(1)) if m else 5
        tp = tipo_poste(sub if sub in ALTOS else "dc")
        hh = ALTOS[tp]
        sp = (w - 0.3) / max(1, n - 1)
        for i in range(n):
            xt = cx + (i - (n - 1) / 2) * sp
            poste(E, cx, y0, hh * (0.9 if abs(i - (n - 1) / 2) > 0.1 else 1.0), color, 0, VUELTAS.get(tp, 0), z + (i % 2) * 0.03, x_tope=xt, cabeza=False)
        anillo_cabeza(E, cx, y0 + hh, color, rx=w * 0.4)
        return (w, hh)
    m = re.match(r"^cl(\d+)$", head)
    if m:
        n = int(m.group(1))
        tp = tipo_poste(sub if sub in ALTOS else "dc")
        hh = ALTOS[tp]
        sp = (w - 0.3) / max(1, n - 1)
        for i in range(n):
            xb = cx + (i - (n - 1) / 2) * sp
            poste(E, xb, y0, hh, color, 0, VUELTAS.get(tp, 0), z, x_tope=cx, cabeza=False)
        anillo_cabeza(E, cx, y0 + hh, color)
        return (w, hh)
    m = re.match(r"^(inc|dec)(\d+)$", head)
    if m:
        n = int(m.group(2))
        tp = tipo_poste(sub if sub in ALTOS else "sc", "sc")
        hh = ALTOS[tp]
        sp = 0.5
        for i in range(n):
            o = (i - (n - 1) / 2) * sp
            if m.group(1) == "inc":
                poste(E, x0, y0, hh, color, 0, VUELTAS.get(tp, 0), z, x_tope=x0 + o * 1.3, cabeza=False)
            else:
                poste(E, x0 + o * 1.3, y0, hh, color, 0, VUELTAS.get(tp, 0), z, x_tope=x0, cabeza=False)
        anillo_cabeza(E, x0, y0 + hh, color)
        return (1, hh)
    m = re.match(r"^(puff|bob|pop|bean)(\d*)$", head)
    if m or head == "Vpuff":
        n = int(m.group(2)) if m and m.group(2) else 4
        n = min(max(n, 3), 5)
        hh = 1.15
        for i in range(n):
            a = math.pi * i / n
            pts = []
            for k in range(14):
                t = TAU * k / 14
                rx = 0.36 + 0.06 * (i % 2)
                px = x0 + math.cos(t) * rx * math.cos(a) * 0.9
                py = y0 + hh / 2 + math.sin(t) * (hh / 2 + 0.05)
                pz = z + math.cos(t) * rx * math.sin(a) * 0.9
                pts.append((px, py, pz))
            E.hilo(pts, color, cerrado=True)
        poste(E, x0, y0, 0.3, color, 0, 0, z, cabeza=False)
        anillo_cabeza(E, x0, y0 + hh + 0.12, color, rx=0.38, rz=0.2)
        return (1, hh + 0.12)
    m = re.match(r"^arc(\d+)$", head)
    if m:
        n = int(m.group(1))
        a = h_arc = 0.5 + n * 0.18
        for i in range(n):
            t = (i + 0.5) / n
            px = x0 + (t - 0.5) * (w - 0.2)
            py = y0 + 0.1 + math.sin(t * math.pi) * h_arc
            giro = math.atan2(math.cos(t * math.pi) * h_arc * math.pi, (w - 0.2)) if w else 0
            eslabon(E, px, py, color, giro=0.3 + (i % 2) * math.pi / 2, largo=0.34, ancho=0.16)
        return (w, h_arc + 0.2)
    if head in ("pic", "picot", "picot3"):
        for i in range(3):
            a = -math.pi / 2 + (i - 1) * 1.15
            eslabon(E, x0 + math.cos(a) * 0.25, y0 + 0.3 + math.sin(a) * 0.25 + 0.15, color, giro=0.5, largo=0.2, ancho=0.12)
        return (1, 0.5)
    if head in ("sol", "solL", "solR"):
        ang = 0 if head == "sol" else (math.radians(58) if head == "solR" else -math.radians(58))
        largo = 1.35 if head == "sol" else 1.05
        pts = []
        for k in range(16):
            t = TAU * k / 16
            lx, ly = math.cos(t) * largo, math.sin(t) * 0.2
            pts.append((cx + lx * math.cos(ang) - ly * math.sin(ang), y0 + 0.35 + lx * math.sin(ang) + ly * math.cos(ang), math.sin(t) * 0.1))
        E.hilo(pts, color, cerrado=True)
        return (w, 0.8)
    if head in ("tss", "tps", "tks", "tfs"):
        poste(E, x0, y0, 1.0, color, 0.0, 0, z, cabeza=False)
        eslabon(E, x0, y0 + 1.05, color, giro=0.2, largo=0.34, ancho=0.14)
        if head == "tps":
            eslabon(E, x0, y0 + 0.55, color, giro=1.2, largo=0.2, ancho=0.12, cz=0.1)
        if head in ("tks", "tfs"):
            poste(E, x0 + 0.3, y0, 1.0, color, -0.2, 0, z + 0.08, cabeza=False)
        return (1, 1.1)
    # genéricos: punto bajo o alto según el nombre
    base = {"lean": "dc", "crazy": "dc", "sedge": "dc", "wattle": "dc", "trin": "sc", "star": "hdc", "xsc": "sc", "rsc": "sc", "scdc": "dc", "cable": "tr"}.get(head, "sc")
    h = ALTOS[base] * (1.15 if head == "xsc" else 1.0)
    poste(E, x0, y0, h, color, 0.25 if head == "lean" else lean, VUELTAS.get(base, 0), z)
    return (1, h)


def construir_filas(E, filas):
    """filas: lista de textos 'dc sc ch' de abajo hacia arriba. Devuelve nada; llena E."""
    toks_f = []
    for f in filas:
        toks = []
        for t in f.split():
            m = re.match(r"^(.*)\*(\d+)$", t)
            toks += [m.group(1)] * int(m.group(2)) if m else [t]
        toks_f.append(toks)
    anchos = [sum(ancho_token(parse(t)[1]) for t in toks) for toks in toks_f]
    cols = max(anchos) if anchos else 1
    # cadena base
    for i in range(cols + 1):
        eslabon(E, i - 0.5 + 0.5, 0.0, 1 if len(filas) % 2 == 0 else 0, giro=0 if i % 2 else math.pi / 2, largo=0.5, ancho=0.2)
    y = 0.08
    for ri, toks in enumerate(toks_f):
        color = ri % 2
        ancho = anchos[ri]
        x = (cols - ancho) / 2 + 0.0
        alto_fila = 0.4
        for t in toks:
            w, h = dibujar_token(E, t, x, y, color)
            x += ancho_token(parse(t)[1])
            alto_fila = max(alto_fila, h)
        y += alto_fila * 0.8 + 0.02
    return cols, y


# --------------------------------------------------------------------------- motivos sin filas (técnicas, flores…)
def disco(E, anillos, color_fn=lambda r: r % 2, alto=0.0):
    """Disco plano en espiral (anillo mágico / amigurumi): anillos de 6, 12, 18… puntadas vistas desde arriba."""
    eslabon(E, 0, 0.05, 0, giro=math.pi / 2, largo=0.3, ancho=0.14)
    for r in range(1, anillos + 1):
        n = 6 * r
        rad = r * 0.78
        for i in range(n):
            a = TAU * i / n
            cx, cz = math.cos(a) * rad, math.sin(a) * rad
            pts = []
            for k in range(10):
                t = TAU * k / 10
                lx, lz = math.cos(t) * 0.32, math.sin(t) * 0.17
                # el eje largo del eslabón sigue la tangente del anillo
                tx, tz = -math.sin(a), math.cos(a)
                pts.append((cx + lx * tx - lz * math.cos(a), 0.05 + math.sin(t) * 0.1, -(cz + lx * tz + lz * math.sin(a))))
            E.hilo(pts, color_fn(r), cerrado=True)


def flor(E, petalos, capas=1, color_centro=1):
    eslabon(E, 0, 0.05, color_centro, giro=math.pi / 2, largo=0.28, ancho=0.16)
    for c in range(capas):
        r0 = 0.5 + c * 0.35
        for p in range(petalos):
            a = TAU * p / petalos + c * (math.pi / petalos)
            for k in range(2):
                pts = []
                largo = (1.35 + 0.5 * c) - k * 0.25
                anch = 0.42 - k * 0.1
                for i in range(18):
                    t = TAU * i / 18
                    lx = r0 + (1 + math.cos(t - math.pi)) * largo / 2 * 1.0
                    ly = math.sin(t) * anch * (0.5 + 0.5 * math.sin((t) / 2))
                    pts.append((math.cos(a) * lx - math.sin(a) * ly, 0.08 + c * 0.12 + k * 0.03, -(math.sin(a) * lx + math.cos(a) * ly)))
                E.hilo(pts, c % 2 if capas > 1 else 0, cerrado=True)


def racimo_plano(E, cx, cz, ang, color, n=3):
    """Racimo de n varetas visto desde arriba: n lazadas alargadas en la dirección 'ang' (hacia afuera), una al lado de otra."""
    dx, dz = math.cos(ang), math.sin(ang)
    tx, tz = -dz, dx
    for k in range(n):
        o = (k - (n - 1) / 2) * 0.46
        bx, bz = cx + tx * o, cz + tz * o
        pts = []
        for i in range(14):
            t = TAU * i / 14
            lx, lt = math.cos(t) * 0.62, math.sin(t) * 0.17
            pts.append((bx + dx * lx + tx * lt, 0.12 + math.sin(t) * 0.1, -(bz + dz * lx + tz * lt)))
        E.hilo(pts, color, cerrado=True)


def granny(E, rondas=3, colores=(1, 0, 2)):
    eslabon(E, 0, 0.05, 1, giro=math.pi / 2, largo=0.32, ancho=0.18)
    for r in range(1, rondas + 1):
        a = 0.95 + (r - 1) * 1.75
        color = colores[(r - 1) % len(colores)]
        # posiciones sobre el perímetro del cuadrado, de a dos racimos en cada esquina y racimos sueltos en los lados
        pos = []
        sueltos = r - 1
        for lado in range(4):
            ang = lado * math.pi / 2  # dirección de avance del lado
            ux, uz = math.cos(ang), math.sin(ang)       # a lo largo del lado
            nx, nz = -uz * -1, ux * -1                  # hacia afuera
            nx, nz = uz, -ux
            # esquina inicial del lado
            cx0, cz0 = -a * (nx * 0 + 1) if False else 0, 0
        # construcción directa por esquinas
        esquinas = [(-a, -a), (a, -a), (a, a), (-a, a)]
        for i in range(4):
            (x0, z0), (x1, z1) = esquinas[i], esquinas[(i + 1) % 4]
            lx, lz = x1 - x0, z1 - z0
            L = math.hypot(lx, lz)
            ux, uz = lx / L, lz / L
            fx, fz = uz, -ux  # normal hacia afuera
            if (fx * (x0 + x1) / 2 + fz * (z0 + z1) / 2) < 0:
                fx, fz = -fx, -fz
            ang_afuera = math.atan2(fz, fx)
            n = sueltos + 2
            for k in range(n):
                t = (k + 0.5) / n
                pos.append((x0 + lx * (0.1 + 0.8 * t), z0 + lz * (0.1 + 0.8 * t), ang_afuera))
        for (px, pz, ang) in pos:
            racimo_plano(E, px, pz, ang, color, 3)
        # cadenetas entre racimos
        for i, (px, pz, ang) in enumerate(pos):
            qx, qz, _ = pos[(i + 1) % len(pos)]
            mx, mz = (px + qx) / 2, (pz + qz) / 2
            if math.hypot(qx - px, qz - pz) < 2.8:
                eslabon_plano(E, mx, mz, math.atan2(qz - pz, qx - px), color)


def eslabon_plano(E, cx, cz, ang, color):
    pts = []
    for i in range(12):
        t = TAU * i / 12
        lx, lt = math.cos(t) * 0.36, math.sin(t) * 0.15
        pts.append((cx + math.cos(ang) * lx - math.sin(ang) * lt, 0.1 + math.sin(t) * 0.05, -(cz + math.sin(ang) * lx + math.cos(ang) * lt)))
    E.hilo(pts, color, cerrado=True)


def cordon(E):
    pts = []
    for i in range(80):
        t = i / 79
        a = t * TAU * 5
        pts.append((t * 8 - 4, 0.3 + math.sin(a) * 0.28, math.cos(a) * 0.28))
    E.hilo(pts, 0, r=0.16)
    pts2 = [(x, y * 1.0, -z) for x, y, z in pts]
    E.hilo([(p[0], 0.3 + math.sin(i / 79 * TAU * 5 + math.pi) * 0.28, math.cos(i / 79 * TAU * 5 + math.pi) * 0.28) for i, p in enumerate(pts)], 1, r=0.16)


def nudo_corredizo(E):
    n = 40
    lazo = [(math.cos(TAU * i / n) * 1.0, 0.8 + math.sin(TAU * i / n) * 0.8, 0.1 * math.sin(TAU * i / n * 2)) for i in range(n)]
    E.hilo(lazo, 0, cerrado=True, r=0.12)
    E.hilo([(-0.6, 0.0, 0.14), (-0.2, 0.15, 0.1), (0.2, 0.15, -0.1), (0.6, 0.0, -0.14), (1.4, -0.5, 0.05), (2.2, -0.9, 0.2)], 0, r=0.12)
    E.hilo([(0.6, 0.0, 0.0), (0.2, 0.35, 0.15), (-0.2, 0.35, -0.1), (-0.6, 0.1, 0.0), (-1.4, -0.4, 0.0), (-2.0, -1.0, 0.1)], 1, r=0.12)


def bullion(E):
    # tres columnas de vueltas enroscadas
    for i, x in enumerate((-1.6, 0, 1.6)):
        pts = []
        for k in range(120):
            t = k / 119
            a = t * TAU * 8
            pts.append((x + math.cos(a) * 0.38, 0.2 + t * 3.2 + math.sin(a) * 0.1, math.sin(a) * 0.38))
        E.hilo(pts, i % 2, r=0.09)


def rizo(E):
    construir_filas(E, ["sc*7", "sc*7"])
    for i in range(7):
        pts = [(i + 0.0, 1.0, 0.15)]
        pts = [(i - 0.35, 1.0, 0.1), (i - 0.45, 0.4, 0.5), (i - 0.2, -0.3, 0.85), (i + 0.1, -0.9, 0.7), (i + 0.35, -0.3, 0.4), (i + 0.3, 0.5, 0.2)]
        E.hilo(pts, 1)


def escalas(E):
    construir_filas(E, ["dc*8", "shell5:dc shell5:dc shell5:dc", "shell5:dc shell5:dc shell5:dc", "shell5:dc shell5:dc shell5:dc"])


def lazos_escoba(E):
    construir_filas(E, ["sc*10"])
    for g in range(2):
        for i in range(5):
            x = g * 5 + i
            pts = []
            for k in range(14):
                t = TAU * k / 14
                pts.append((x + 0.0 + math.sin(t) * 0.18 + (i - 2) * 0.0, 2.45 + math.cos(t) * 1.4, (i - 2) * 0.12 + 0.25 * math.sin(t) * 0.2))
            E.hilo(pts, 1, cerrado=True)


def triangulos(E):
    construir_filas(E, ["sc*12"])
    for i in range(4):
        x = i * 3 + 1.5
        for j, ang in enumerate((-0.3, 0, 0.3)):
            E.hilo([(x - 0.8, 0.9, 0), (x, 2.3, 0.1), (x + 0.8, 0.9, 0)], 0 if j == 0 else 2)


ESPECIALES = {
    "slip_knot": nudo_corredizo,
    "chain": lambda E: construir_filas(E, ["ch*10"]),
    "foundation_single_crochet": lambda E: construir_filas(E, ["sc*10"]),
    "foundation_double_crochet": lambda E: construir_filas(E, ["dc*10"]),
    "magic_ring": lambda E: disco(E, 3),
    "spiral_rounds": lambda E: disco(E, 4, lambda r: 0),
    "crochet_cord": cordon,
    "tapestry_crochet": lambda E: construir_filas(E, ["sc c2:sc sc c2:sc sc c2:sc sc c2:sc", "c2:sc sc c2:sc sc c2:sc sc c2:sc sc", "sc c2:sc sc c2:sc sc c2:sc sc c2:sc", "c2:sc sc c2:sc sc c2:sc sc c2:sc sc"]),
    "crocodile_stitch": escalas,
    "solomon_knot": lambda E: construir_filas(E, ["sol sol sol sol", "sc sol sol sol sc", "sol sol sol sol"]),
    "broomstick_lace": lazos_escoba,
    "granny_square": lambda E: granny(E, 3),
    "corner_to_corner": lambda E: granny(E, 2),
    "triangle_edging": triangulos,
    "bullion_stitch": bullion,
    "loop_stitch": rizo,
    "openwork_flower_square": lambda E: granny(E, 3),
    "puff_flower_square": lambda E: granny(E, 3),
    "puff_arch_square": lambda E: granny(E, 3),
    "leaf_corner_square": lambda E: granny(E, 3),
    "multicolor_granny_square": lambda E: granny(E, 4),
    "puff_petal_flower": lambda E: flor(E, 6),
    "six_petal_lace_flower": lambda E: flor(E, 6, 2),
    "star_petal_flower": lambda E: flor(E, 8),
    "five_petal_flower": lambda E: flor(E, 5),
    "eight_petal_flower": lambda E: flor(E, 8),
    "four_petal_flower": lambda E: flor(E, 4),
    "layered_flower": lambda E: flor(E, 6, 3),
}


# --------------------------------------------------------------------------- texturas de hilo (normal map de 3 cabos)
def crear_texturas():
    N = 256
    u = (np.arange(N) / N)[None, :].repeat(N, 0)   # alrededor
    v = (np.arange(N) / N)[:, None].repeat(N, 1)   # a lo largo
    rs = np.random.RandomState(3)

    def ruido(celdas):
        g = rs.rand(celdas, celdas)
        ys, xs = np.mgrid[0:N, 0:N]
        fx, fy = xs / N * celdas, ys / N * celdas
        x0, y0 = fx.astype(int) % celdas, fy.astype(int) % celdas
        x1, y1 = (x0 + 1) % celdas, (y0 + 1) % celdas
        tx, ty = fx - np.floor(fx), fy - np.floor(fy)
        tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        return (g[y0, x0] * (1 - tx) + g[y0, x1] * tx) * (1 - ty) + (g[y1, x0] * (1 - tx) + g[y1, x1] * tx) * ty

    fase = 3 * u + 2 * v
    f = fase - np.floor(fase)
    cabo = np.sin(np.pi * f) ** 0.75
    fibra = ruido(48) * 0.5 + ruido(24) * 0.5
    h = cabo * 0.82 + fibra * 0.14 + ruido(16) * 0.04
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nx, ny, nz = -gx * 7.0 * N / 64, -gy * 7.0 * N / 64, np.ones_like(h)
    L = np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack([nx / L * 0.5 + 0.5, ny / L * 0.5 + 0.5, nz / L * 0.5 + 0.5, np.ones_like(h)], -1)
    sombra = 0.62 + 0.55 * h
    color = np.stack([sombra, sombra, sombra, np.ones_like(h)], -1)
    rugo = np.stack([0.98 - 0.22 * h] * 3 + [np.ones_like(h)], -1)

    def img(nombre, datos, colorspace):
        im = bpy.data.images.new(nombre, N, N, alpha=False, float_buffer=True)
        im.colorspace_settings.name = colorspace
        im.pixels.foreach_set(np.ascontiguousarray(np.flipud(datos), dtype=np.float32).ravel())
        im.update()
        return im

    return img("hilo_normal", normal, "Non-Color"), img("hilo_sombra", color, "Non-Color"), img("hilo_rugosidad", rugo, "Non-Color")


def hex_a_lineal(hexa):
    n = int(hexa[1:], 16)
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    lin = lambda s: ((s / 255 + 0.055) / 1.055) ** 2.4 if s / 255 > 0.04045 else s / 255 / 12.92
    return tuple(lin(x) for x in c) + (1.0,)


def material_hilo(nombre, hexa, tex):
    normal, sombra, rugo = tex
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapa = nt.nodes.new("ShaderNodeMapping")
    nt.links.new(coord.outputs["UV"], mapa.inputs["Vector"])
    tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = normal
    ts = nt.nodes.new("ShaderNodeTexImage"); ts.image = sombra
    tr = nt.nodes.new("ShaderNodeTexImage"); tr.image = rugo
    for t in (tn, ts, tr):
        nt.links.new(mapa.outputs["Vector"], t.inputs["Vector"])
        t.interpolation = "Cubic"
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 1.0
    mix.inputs[6].default_value = hex_a_lineal(hexa)
    nt.links.new(ts.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 1.4
    nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    nt.links.new(tr.outputs["Color"], bsdf.inputs["Roughness"])
    bsdf.inputs["Sheen Weight"].default_value = 0.6
    bsdf.inputs["Sheen Roughness"].default_value = 0.5
    return m


# --------------------------------------------------------------------------- escena y render
def preparar_escena():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene
    MOTOR = os.environ.get("MOTOR", "CYCLES")
    sc.render.engine = "CYCLES" if MOTOR == "CYCLES" else "BLENDER_EEVEE_NEXT"
    if MOTOR != "CYCLES":
        sc.eevee.taa_render_samples = MUESTRAS
        sc.eevee.use_shadows = True
        sc.eevee.use_raytracing = True
        sc.eevee.ray_tracing_method = "SCREEN"
        sc.eevee.use_gtao = True
    sc.cycles.device = "CPU"
    sc.cycles.samples = MUESTRAS
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    sc.render.resolution_x, sc.render.resolution_y = ANCHO_IMG, ALTO_IMG
    sc.render.film_transparent = MOTOR == "CYCLES"
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.cycles.max_bounces = 4
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 2
    mundo = bpy.data.worlds.new("mundo")
    sc.world = mundo
    mundo.use_nodes = True
    fondo = mundo.node_tree.nodes["Background"]
    fondo.inputs["Color"].default_value = (0.93, 0.9, 0.96, 1)
    fondo.inputs["Strength"].default_value = 0.9
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 50
    sol = bpy.data.objects.new("sol", bpy.data.lights.new("sol", "SUN"))
    sol.data.energy = 3.2
    sol.data.angle = 0.15
    sol.rotation_euler = (math.radians(50), math.radians(8), math.radians(-25))
    sc.collection.objects.link(sol)
    relleno = bpy.data.objects.new("relleno", bpy.data.lights.new("relleno", "AREA"))
    relleno.data.energy = 140
    relleno.data.size = 6
    relleno.location = (-5, -5, 3)
    relleno.rotation_euler = (math.radians(70), 0, math.radians(-40))
    sc.collection.objects.link(relleno)
    return sc, cam


def renderizar(E, id_, sc, cam, materiales):
    objs = []
    for color, b in E.mallas.items():
        me = bpy.data.meshes.new(f"{id_}_{color}")
        b.to_mesh(me)
        b.free()
        for p in me.polygons:
            p.use_smooth = True
        ob = bpy.data.objects.new(f"{id_}_{color}", me)
        sc.collection.objects.link(ob)
        me.materials.append(materiales[color])
        objs.append(ob)
    mn, mx = E.minb, E.maxb
    centro = (mn + mx) / 2
    ancho, alto, prof = mx.x - mn.x, mx.z - mn.z, mx.y - mn.y
    # suelo que recibe la sombra
    bpy.ops.mesh.primitive_plane_add(size=60, location=(centro.x, centro.y, mn.z - 0.02))
    suelo = bpy.context.active_object
    if os.environ.get("MOTOR", "CYCLES") == "CYCLES":
        suelo.is_shadow_catcher = True
    else:
        sm_ = bpy.data.materials.new("suelo")
        sm_.use_nodes = True
        b_ = sm_.node_tree.nodes["Principled BSDF"]
        b_.inputs["Base Color"].default_value = hex_a_lineal("#fbf7f4")
        b_.inputs["Roughness"].default_value = 1.0
        suelo.data.materials.append(sm_)
    # cámara: de frente para tejidos en filas, desde arriba para motivos planos (flores, discos, granny)
    plano = prof > alto * 1.2
    elev = math.radians(62 if plano else 14)
    alto_vis = prof * math.sin(elev) + alto * math.cos(elev) if plano else alto
    ancho_vis = ancho
    asp = ANCHO_IMG / ALTO_IMG
    fov_v = 2 * math.atan(36 / 2 / cam.data.lens * (ALTO_IMG / ANCHO_IMG))
    d = max(alto_vis / 2 / math.tan(fov_v / 2), ancho_vis / 2 / (math.tan(fov_v / 2) * asp)) * (1.4 if plano else 1.14) + (prof * 0.5 if not plano else 0)
    cam.location = (centro.x + d * 0.08, centro.y - d * math.cos(elev), centro.z + d * math.sin(elev))
    dirv = centro - cam.location
    cam.rotation_euler = dirv.to_track_quat("-Z", "Y").to_euler()
    ruta = os.path.join(SALIDA, f"{id_}.png")
    sc.render.filepath = ruta
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(suelo, do_unlink=True)
    for ob in objs:
        me = ob.data
        bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.meshes.remove(me)
    return ruta


def main():
    datos = json.load(open(RUTA_PUNTOS, encoding="utf-8"))["stitches"]
    por_id = {s["id"]: s for s in datos}
    ids = list(por_id) if IDS == "todos" else IDS.split(",")
    os.makedirs(SALIDA, exist_ok=True)
    sc, cam = preparar_escena()
    tex = crear_texturas()
    materiales = {k: material_hilo(f"hilo{k}", v, tex) for k, v in COLORES.items()}
    for id_ in ids:
        if os.path.exists(os.path.join(SALIDA, f"{id_}.png")):
            continue
        t0 = time.time()
        s = por_id[id_]
        E = Escena3D()
        try:
            if id_ in ESPECIALES:
                ESPECIALES[id_](E)
            else:
                filas = s["diagram"].get("rows_bottom_to_top") or ["sc*8"]
                motivo = filas[1:] if len(filas) > 1 else filas
                filas = list(filas)
                i = 0
                while len(filas) < 5:
                    filas.append(motivo[i % len(motivo)])
                    i += 1
                construir_filas(E, filas[:7])
            renderizar(E, id_, sc, cam, materiales)
            print("PUNTO_OK", id_, round(time.time() - t0, 1))
        except Exception as e:
            import traceback
            traceback.print_exc()
            print("PUNTO_ERROR", id_, e)


main()
