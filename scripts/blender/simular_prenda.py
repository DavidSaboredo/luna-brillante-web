# Simulación de tela en Blender: piezas planas del patrón -> colocadas alrededor del maniquí -> cosidas -> caída con gravedad y colisión.
# Uso:  blender -b --python simular_prenda.py -- <spec.json> <carpeta salida> [cuadros]
# Cada pieza sale como una malla con UV en centímetros del patrón (para texturizar con el punto elegido).
import bpy, bmesh, json, math, sys, os, time
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:]
SPEC = json.load(open(ARGS[0]))
SALIDA = ARGS[1]
CUADROS = int(ARGS[2]) if len(ARGS) > 2 else 90
AQUI = os.path.dirname(os.path.abspath(__file__))
PERFIL = json.load(open(os.path.join(AQUI, "..", "..", "src", "data", "maniqui-perfil.json")))
TAU = 2 * math.pi
M = SPEC["medidas"]
NT = PERFIL["ntheta"]
FILAS = PERFIL["cuerpo"]
Y0 = FILAS[0]["y"]
Y1 = FILAS[-1]["y"]
Y_CADERA, Y_CINTURA, Y_BUSTO, Y_HOMBRO = 0.9, 1.06, 1.21, 1.38

lerp = lambda a, b, t: a + (b - a) * t
clamp = lambda v, a, b: max(a, min(b, v))


def sm(a, b, x):
    t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- cuerpo (igual que cuerpo3d.ts) ----
def fila(y):
    return FILAS[clamp(round((y - Y0) / 0.01), 0, len(FILAS) - 1)]


def rms(f):
    return math.sqrt(sum(v * v for v in f["r"]) / len(f["r"]))


def factor(y):
    cint = round(M["busto"] * 0.78)
    kB = M["busto"] / TAU / 100 / rms(fila(Y_BUSTO))
    kC = cint / TAU / 100 / rms(fila(Y_CINTURA))
    kH = M["cadera"] / TAU / 100 / rms(fila(Y_CADERA))
    if y <= 0.74: return 1
    if y < Y_CADERA: return lerp(1, kH, (y - 0.74) / (Y_CADERA - 0.74))
    if y < Y_CINTURA: return lerp(kH, kC, (y - Y_CADERA) / (Y_CINTURA - Y_CADERA))
    if y < Y_BUSTO: return lerp(kC, kB, (y - Y_CINTURA) / (Y_BUSTO - Y_CINTURA))
    hom = 1 + (kB - 1) * 0.6
    if y < 1.34: return lerp(kB, hom, (y - Y_BUSTO) / (1.34 - Y_BUSTO))
    if y < 1.44: return lerp(hom, 1, (y - 1.34) / 0.1)
    return 1


def r_bruto(y, th):
    yy = clamp(y, Y0, Y1)
    t = (yy - Y0) / 0.01
    i = int(math.floor(t)); f = t - i
    a = FILAS[min(i, len(FILAS) - 1)]; b = FILAS[min(i + 1, len(FILAS) - 1)]
    u = (((th / TAU) % 1) + 1) % 1 * NT
    j = int(math.floor(u)); g = u - j
    j0, j1 = j % NT, (j + 1) % NT
    return lerp(lerp(a["r"][j0], a["r"][j1], g), lerp(b["r"][j0], b["r"][j1], g), f)


def r_cuerpo(y, th):
    return r_bruto(y, th) * factor(y)


def centro(y):
    yy = clamp(y, Y0, Y1)
    t = (yy - Y0) / 0.01
    i = int(math.floor(t)); f = t - i
    a = FILAS[min(i, len(FILAS) - 1)]; b = FILAS[min(i + 1, len(FILAS) - 1)]
    return lerp(a["cx"], b["cx"], f), lerp(a["cz"], b["cz"], f)


def perimetro(y, n=48):
    pts = []
    for i in range(n):
        th = TAU * i / n
        r = r_cuerpo(y, th)
        pts.append((r * math.sin(th), r * math.cos(th)))
    return sum(math.dist(pts[i], pts[(i + 1) % n]) for i in range(n))


def gl_a_bl(p):
    return Vector((p[0], -p[2], p[1]))


# ---------------------------------------------------------------- formas planas: (s, t) en [0,1]^2 -> (x, y) en cm ----
def forma_rect(w, h):
    return lambda s, t: (s * w, t * h)


def forma_trapecio(w, h, wt):
    def q(s, t):
        ancho = lerp(wt, w, t)
        return ((w - ancho) / 2 + s * ancho, t * h)
    return q


def forma_torso(w, h, nombre, sisa_max):
    d0 = min(w * 0.14, 7.0)
    sisa = min(h * 0.55, sisa_max)
    n = min(w * 0.17, 9.0)
    prof = 2.5 if nombre == "Espalda" else 7.0

    def q(s, t):
        y = t * h
        arm = d0 * (1 - sm(0, sisa, y)) if sisa > 0 else 0
        x = arm + s * (w - 2 * arm)
        dx = abs(x - w / 2)
        ytop = prof * (1 - sm(0, n, dx)) if dx < n else 0
        return (x, ytop + t * (h - ytop))
    return q


def forma_manga(w, h, puno):
    wb = max(puno + 3, 12)
    cap = min(10.0, h * 0.3)

    def q(s, t):
        ancho = lerp(w, wb, t)
        ytop = cap * (1 - math.sin(math.pi * s))
        return (s * ancho + (w - ancho) / 2, ytop + t * (h - ytop))
    return q


# ---------------------------------------------------------------- colocación en 3D (coordenadas glTF: y arriba, +z al frente) ----
OFF = 0.010


def sobre_torso(phi, y, k):
    cx, cz = centro(y)
    r = r_cuerpo(y, phi) * k + OFF
    return (cx + r * math.sin(phi), y, cz + r * math.cos(phi))


def sobre_falda(phi, yy, semi_cm):
    """Punto de una falda: sigue la cadera y, hacia abajo, se redondea hasta tener el perímetro del patrón."""
    ye = max(yy, Y0)
    cx, cz = centro(ye)
    objetivo = 2 * semi_cm / 100
    k = max(1.0, objetivo / perimetro(ye))
    r_el = r_cuerpo(ye, phi) * k + OFF
    rc = objetivo / TAU + OFF
    wc = sm(Y_CADERA, Y_CADERA - 0.22, yy)
    r = max(lerp(r_el, rc, wc), r_cuerpo(ye, phi) + OFF)
    return (cx + r * math.sin(phi), yy, cz + r * math.cos(phi))


def k_para(y, ancho_cm_mitad):
    """Cuánto hay que agrandar la sección del cuerpo para que su perímetro iguale al de la prenda (ancho_cm_mitad = medio perímetro)."""
    return max(1.0, (2 * ancho_cm_mitad / 100) / perimetro(y))


class Panel:
    def __init__(self, zona, nombre, idx, ns, nt, q, colocar, w, h):
        self.zona, self.nombre, self.idx, self.ns, self.nt = zona, nombre, idx, ns, nt
        self.q, self.colocar, self.w, self.h = q, colocar, w, h
        self.fijar = False  # el borde superior queda sujeto (hombros)
        self.v = []   # índices globales de vértices, fila por fila
        self.uv = []  # (x, y) en cm por vértice


def construir_panel(bm, p, off_vert):
    """Agrega la malla del panel al bmesh; devuelve la matriz de índices [t][s]."""
    idx = []
    for j in range(p.nt + 1):
        fila_idx = []
        for i in range(p.ns + 1):
            s, t = i / p.ns, j / p.nt
            x, y = p.q(s, t)
            pos = p.colocar(x, y, s, t)
            v = bm.verts.new(gl_a_bl(pos))
            p.uv.append((x, y))
            fila_idx.append(v)
        idx.append(fila_idx)
    bm.verts.ensure_lookup_table()
    for j in range(p.nt):
        for i in range(p.ns):
            a, b, c, d = idx[j][i], idx[j][i + 1], idx[j + 1][i + 1], idx[j + 1][i]
            bm.faces.new((a, b, c, d))
    return idx


# ---------------------------------------------------------------- definición de las prendas ----
def piezas_por_nombre():
    d = {}
    for p in SPEC["piezas"]:
        d.setdefault((p["zona"], p["nombre"]), p)
    return d


def armar_blusa_sueter(paneles, costuras, tipo):
    P = piezas_por_nombre()
    NS = 18
    medio = lambda x_cm, w: (x_cm / w)
    esp, dele = P[("cuerpo", "Espalda")], P[("cuerpo", "Delantero")]
    w, h = esp["ancho"], esp["alto"]
    banda_h = P[("borde", "Borde")]["alto"] if ("borde", "Borde") in P else 5
    y_top = Y_HOMBRO - (P[("canesu", "Canesú")]["alto"] / 100 if tipo == "blusa" else 0)
    return w, h, y_top


# ---------------------------------------------------------------- construir ----
def main():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    # maniquí (colisión)
    bpy.ops.wm.obj_import(filepath=os.path.join(AQUI, "maniquis", f"maniqui_{SPEC['talle']}.obj"), forward_axis="NEGATIVE_Z", up_axis="Y")
    cuerpo_objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for o in cuerpo_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = cuerpo_objs[0]
    if len(cuerpo_objs) > 1:
        bpy.ops.object.join()
    cuerpo = bpy.context.view_layer.objects.active
    cuerpo.name = "maniqui"
    bpy.ops.object.modifier_add(type="COLLISION")
    cuerpo.collision.thickness_outer = 0.004
    cuerpo.collision.thickness_inner = 0.01
    cuerpo.collision.cloth_friction = 12.0

    bm = bmesh.new()
    cap_panel = bm.verts.layers.int.new("panel")
    cap_u = bm.verts.layers.float.new("uv_x")
    cap_v = bm.verts.layers.float.new("uv_y")
    paneles = []
    costuras = []  # pares de vértices bmesh

    prenda = SPEC["prenda"]
    P = piezas_por_nombre()
    sisa_max = M["sisa"]
    puno = M["puno"]

    def torso_panel(zona, nombre, idx, lado, y_top, ns, w, h, forma, ancho_t=None, falda=False):
        nt = max(6, int(round(h / 1.6)))
        q = forma

        def colocar(x, y, s, t):
            yy = y_top - y / 100
            a = ancho_t(t) if ancho_t else w
            phi = (math.pi * (x - w / 2) / a) if lado == 1 else (math.pi - math.pi * (x - w / 2) / a)
            if falda:
                return sobre_falda(phi, yy, a)
            return sobre_torso(phi, yy, k_para(yy, a))
        p = Panel(zona, nombre, idx, ns, nt, q, colocar, w, h)
        paneles.append(p)
        return p

    def anillo_panel(zona, nombre, idx, y_top, ns2, w, h, semi_t=None, falda=False):
        nt = max(3, int(round(h / 1.6)))
        q = forma_rect(w, h)

        def colocar(x, y, s, t):
            yy = y_top - y / 100
            semi = semi_t(t) if semi_t else w / 2
            phi = -math.pi / 2 + TAU * (x / w)
            if falda:
                return sobre_falda(phi, yy, semi)
            return sobre_torso(phi, yy, k_para(yy, semi))
        p = Panel(zona, nombre, idx, ns2, nt, q, colocar, w, h)
        paneles.append(p)
        return p

    def manga_panel(zona, nombre, lado, y_ini, w, h):
        b = PERFIL["brazos"]["L" if lado == 1 else "R"]
        pts = [Vector(b["hombro"]), Vector(b["codo"]), Vector(b["muneca"])]
        f = factor(pts[0].y)
        # los brazos no se escalan, se corren hacia afuera lo que creció el torso
        pts = [Vector((p.x + lado * (factor(p.y) - 1) * (r_bruto(p.y, lado * math.pi / 2)), p.y, p.z)) for p in pts]
        eje0 = (pts[1] - pts[0]).normalized()
        inicio = pts[0] + eje0 * 0.03
        pts2 = [inicio, pts[1], pts[2]]
        # curva de 2 tramos
        def camino(L):
            d1 = (pts2[1] - pts2[0]).length
            if L <= d1:
                return pts2[0].lerp(pts2[1], L / d1), (pts2[1] - pts2[0]).normalized()
            d2 = (pts2[2] - pts2[1]).length
            tt = min(1.0, (L - d1) / d2)
            return pts2[1].lerp(pts2[2], tt), (pts2[2] - pts2[1]).normalized() if tt < 1 else (pts2[2] - pts2[1]).normalized()
        ns = 24
        nt = max(8, int(round(h / 1.6)))
        q = forma_manga(w, h, puno)
        rad_sup, rad_inf = b["radio_sup"], b["radio_inf"]

        def colocar(x, y, s, t):
            c, tan = camino(y / 100)
            ref = Vector((-lado, 0, 0))
            n = (ref - tan * ref.dot(tan)).normalized()
            bb = tan.cross(n).normalized()
            ancho = lerp(w, max(puno + 3, 12), clamp(y / h, 0, 1))
            rho = max(ancho / 100 / TAU, lerp(rad_sup, rad_inf, clamp(y / h, 0, 1)) * 1.05 + 0.006)
            a = TAU * s
            pos = c + (n * (-math.cos(a)) + bb * math.sin(a)) * rho
            return (pos.x, pos.y, pos.z)
        p = Panel(zona, nombre, 0 if lado == 1 else 1, ns, nt, q, colocar, w, h)
        paneles.append(p)
        return p

    # ---------- prendas
    pares = []  # (panelA, i, j, panelB, i2, j2) para costuras por filas/columnas

    if prenda in ("blusa", "sueter"):
        esp, dele = P[("cuerpo", "Espalda")], P[("cuerpo", "Delantero")]
        w = esp["ancho"]
        NS = 18
        if prenda == "blusa":
            can = P[("canesu", "Canesú")]
            y1 = Y_HOMBRO
            cf = torso_panel("canesu", "Canesú", 0, 1, y1, NS, w, can["alto"], forma_rect(w, can["alto"]))
            cb = torso_panel("canesu", "Canesú", 1, -1, y1, NS, w, can["alto"], forma_rect(w, can["alto"]))
            y2 = y1 - can["alto"] / 100
            ff = torso_panel("cuerpo", "Delantero", 0, 1, y2, NS, w, dele["alto"], forma_rect(w, dele["alto"]))
            fb = torso_panel("cuerpo", "Espalda", 1, -1, y2, NS, w, esp["alto"], forma_rect(w, esp["alto"]))
            pares += [("filas", cf, ff), ("filas", cb, fb), ("lados", cf, cb), ("lados", ff, fb)]
            y3 = y2 - dele["alto"] / 100
            ancho_borde = P[("borde", "Borde")]
            br = anillo_panel("borde", "Borde", 0, y3, NS * 2, ancho_borde["ancho"], ancho_borde["alto"])
            pares += [("anillo_baja", ff, fb, br)]
        else:
            ff = torso_panel("cuerpo", "Delantero", 0, 1, Y_HOMBRO, NS, w, dele["alto"], forma_rect(w, dele["alto"]))
            fb = torso_panel("cuerpo", "Espalda", 1, -1, Y_HOMBRO, NS, w, esp["alto"], forma_rect(w, esp["alto"]))
            pares += [("lados", ff, fb)]
            y3 = Y_HOMBRO - dele["alto"] / 100
            ancho_borde = P[("borde", "Borde")]
            br = anillo_panel("borde", "Borde", 0, y3, NS * 2, ancho_borde["ancho"], ancho_borde["alto"])
            pares += [("anillo_baja", ff, fb, br)]
        if ("mangas", "Manga") in P:
            mg = P[("mangas", "Manga")]
            for lado in (1, -1):
                manga_panel("mangas", "Manga", lado, 0, mg["ancho"], mg["alto"])
    elif prenda in ("falda", "pollera"):
        NS = 18
        pre, pan, vol = P[("pretina", "Pretina")], P[("cuerpo", "Panel")], P[("volado", "Volado")]
        w, h = pan["ancho"], pan["alto"]
        cint = round(M["busto"] * 0.78)
        wt = max(cint / 2 + 3, w * 0.62)
        ancho_t = lambda t: lerp(wt, w, t)
        y0 = Y_CINTURA + 0.03
        rp = anillo_panel("pretina", "Pretina", 0, y0, NS * 2, pre["ancho"], pre["alto"], falda=True)
        y1 = y0 - pre["alto"] / 100
        pf = torso_panel("cuerpo", "Panel", 0, 1, y1, NS, w, h, forma_trapecio(w, h, wt), ancho_t, True)
        pb = torso_panel("cuerpo", "Panel", 1, -1, y1, NS, w, h, forma_trapecio(w, h, wt), ancho_t, True)
        y2 = y1 - h / 100
        semi_vol = lambda t: lerp(w, vol["ancho"] / 2, t)
        rv = anillo_panel("volado", "Volado", 0, y2, NS * 2, vol["ancho"], vol["alto"], semi_vol, True)
        pares += [("lados", pf, pb), ("anillo_sube", rp, pf, pb), ("anillo_baja", pf, pb, rv)]
        rp.fijar = True
    elif prenda == "vestido":
        NS = 18
        cor, fal, cin, rue = P[("corpino", "Corpiño")], P[("falda", "Falda")], P[("cintura", "Cintura")], P[("ruedo", "Ruedo")]
        y0 = 1.26
        wc = cor["ancho"]
        cf = torso_panel("corpino", "Corpiño", 0, 1, y0, NS, wc, cor["alto"], forma_rect(wc, cor["alto"]))
        cb = torso_panel("corpino", "Corpiño", 1, -1, y0, NS, wc, cor["alto"], forma_rect(wc, cor["alto"]))
        cf.fijar = cb.fijar = True
        y1 = y0 - cor["alto"] / 100
        wn = cin["ancho"]
        nf = torso_panel("cintura", "Cintura", 0, 1, y1, NS, wn, cin["alto"], forma_rect(wn, cin["alto"]))
        nb = torso_panel("cintura", "Cintura", 1, -1, y1, NS, wn, cin["alto"], forma_rect(wn, cin["alto"]))
        y2 = y1 - cin["alto"] / 100
        w, h = fal["ancho"], fal["alto"]
        wt = max(M["busto"] * 0.78 / 2 + 3, w * 0.62)
        ancho_t = lambda t: lerp(wt, w, t)
        ff = torso_panel("falda", "Falda", 0, 1, y2, NS, w, h, forma_trapecio(w, h, wt), ancho_t, True)
        fb = torso_panel("falda", "Falda", 1, -1, y2, NS, w, h, forma_trapecio(w, h, wt), ancho_t, True)
        y3 = y2 - h / 100
        semi_r = lambda t: lerp(w, rue["ancho"] / 2, t)
        rr = anillo_panel("ruedo", "Ruedo", 0, y3, NS * 2, rue["ancho"], rue["alto"], semi_r, True)
        pares += [("lados", cf, cb), ("lados", nf, nb), ("lados", ff, fb), ("filas", cf, nf), ("filas", cb, nb), ("filas", nf, ff), ("filas", nb, fb), ("anillo_baja", ff, fb, rr)]
    elif prenda == "musculosa":
        NS = 18
        esp, dele = P[("cuerpo", "Espalda")], P[("cuerpo", "Delantero")]
        w = esp["ancho"]
        y0 = 1.26
        ff = torso_panel("cuerpo", "Delantero", 0, 1, y0, NS, w, dele["alto"], forma_rect(w, dele["alto"]))
        fb = torso_panel("cuerpo", "Espalda", 1, -1, y0, NS, w, esp["alto"], forma_rect(w, esp["alto"]))
        ff.fijar = fb.fijar = True
        y3 = y0 - dele["alto"] / 100
        bo = P[("borde", "Borde")]
        br = anillo_panel("borde", "Borde", 0, y3, NS * 2, bo["ancho"], bo["alto"])
        pares += [("lados", ff, fb), ("anillo_baja", ff, fb, br)]
    else:
        raise SystemExit("Prenda sin definición de simulación: " + prenda)

    # ---------- hombros: el borde superior de los paneles que apoyan en el hombro queda fijo
    for p in paneles:
        if p.nombre in ("Canesú", "Manga") or (prenda == "sueter" and p.nombre in ("Delantero", "Espalda")):
            p.fijar = True

    # ---------- mallas
    indices = {}
    for p in paneles:
        indices[id(p)] = construir_panel(bm, p, 0)

    def v_de(p, j, i):
        return indices[id(p)][j][i]

    aristas = []
    for par in pares:
        tipo = par[0]
        if tipo == "lados":
            a, b = par[1], par[2]
            for j in range(a.nt + 1):
                jb = round(j * b.nt / a.nt)
                aristas.append((v_de(a, j, 0), v_de(b, jb, 0)))
                aristas.append((v_de(a, j, a.ns), v_de(b, jb, b.ns)))
        elif tipo == "filas":
            a, b = par[1], par[2]  # a abajo = b arriba
            for i in range(a.ns + 1):
                aristas.append((v_de(a, a.nt, i), v_de(b, 0, i)))
        elif tipo == "anillo_sube":
            ring, f, esp = par[1], par[2], par[3]
            ns = f.ns
            for i in range(ns + 1):
                aristas.append((v_de(ring, ring.nt, i), v_de(f, 0, i)))
            for jj in range(ns + 1):
                aristas.append((v_de(ring, ring.nt, min(ns + jj, ring.ns)), v_de(esp, 0, ns - jj)))
            for j in range(ring.nt + 1):
                aristas.append((v_de(ring, j, 0), v_de(ring, j, ring.ns)))
        elif tipo == "anillo_baja":
            f, esp, ring = par[1], par[2], par[3]
            ns = f.ns
            for i in range(ns + 1):
                aristas.append((v_de(f, f.nt, i), v_de(ring, 0, i)))
            for jj in range(ns + 1):
                aristas.append((v_de(esp, esp.nt, ns - jj), v_de(ring, 0, ns + jj if ns + jj <= ring.ns else ring.ns)))
            for j in range(ring.nt + 1):
                aristas.append((v_de(ring, j, 0), v_de(ring, j, ring.ns)))
    # costura de las mangas (el borde de la manga se cierra)
    for p in paneles:
        if p.nombre == "Manga":
            for j in range(p.nt + 1):
                aristas.append((v_de(p, j, 0), v_de(p, j, p.ns)))
    # costura de la manga al cuerpo (la sisa): cada punto del borde de la copa se cose al vértice más cercano del torso
    torso = [p for p in paneles if p.nombre in ("Delantero", "Espalda", "Canesú")]
    for p in paneles:
        if p.nombre != "Manga":
            continue
        for i in range(p.ns + 1):
            vm = v_de(p, 0, i)
            mejor, dmin = None, 0.22
            for t in torso:
                for fila_v in indices[id(t)]:
                    for vt in fila_v:
                        d = (vt.co - vm.co).length
                        if d < dmin:
                            mejor, dmin = vt, d
            if mejor is not None:
                aristas.append((vm, mejor))
    for a, b in aristas:
        try:
            bm.edges.new((a, b))
        except ValueError:
            pass

    me = bpy.data.meshes.new("prenda")
    for pi, p in enumerate(paneles):
        for j in range(p.nt + 1):
            for i in range(p.ns + 1):
                v = indices[id(p)][j][i]
                v[cap_panel] = pi
                x, y = p.uv[j * (p.ns + 1) + i]
                v[cap_u] = x
                v[cap_v] = y
    bm.verts.index_update()
    costuras_idx = [(a.index, b.index) for a, b in aristas]
    fijos = []
    for p in paneles:
        if p.fijar:
            for i in range(p.ns + 1):
                if p.nombre == "Manga":
                    # solo la parte alta de la copa de la manga
                    if 0.2 < i / p.ns < 0.8:
                        fijos.append(indices[id(p)][0][i].index)
                else:
                    fijos.append(indices[id(p)][0][i].index)
                    if p.nombre == "Pretina":
                        fijos.append(indices[id(p)][p.nt][i].index)
    # el borde superior fijo se apoya sobre la superficie del cuerpo: así sigue la caída del hombro
    # en vez de quedar recto y flotando en las puntas
    from mathutils.bvhtree import BVHTree
    cdg = bpy.context.evaluated_depsgraph_get()
    cuerpo_ev = cuerpo.evaluated_get(cdg)
    me_c = cuerpo_ev.to_mesh()
    me_c.transform(cuerpo.matrix_world)
    me_c.calc_loop_triangles()
    arbol = BVHTree.FromPolygons([v.co.copy() for v in me_c.vertices], [t.vertices[:] for t in me_c.loop_triangles])
    bm.verts.ensure_lookup_table()
    pf = next((p for p in paneles if p.fijar and p.nombre == "Delantero"), None)
    pe = next((p for p in paneles if p.fijar and p.nombre == "Espalda"), None)
    if pf and pe:
        # delantero y espalda se unen en una costura de hombro sobre la cresta del hombro (sin hueco entre ambos)
        sup_e = [indices[id(pe)][0][i] for i in range(pe.ns + 1)]
        for i in range(pf.ns + 1):
            vf = indices[id(pf)][0][i]
            ve = min(sup_e, key=lambda w: abs(w.co.x - vf.co.x))
            x = (vf.co.x + ve.co.x) / 2
            z0 = max(vf.co.z, ve.co.z) + 0.05
            mejor = None
            for k in range(33):
                y = -0.16 + 0.32 * k / 32
                h = arbol.ray_cast(Vector((x, y, z0)), Vector((0, 0, -1)), 0.5)
                if h[0] is not None and (mejor is None or h[0].z > mejor[0].z):
                    mejor = h
            if mejor is not None:
                vf.co = ve.co = mejor[0] + mejor[1] * 0.008
    else:
        for p in paneles:
            if p.fijar and p.nombre in ("Delantero", "Espalda", "Canesú"):
                for i in range(p.ns + 1):
                    v = indices[id(p)][0][i]
                    hit = arbol.find_nearest(v.co)
                    if hit[0] is not None and hit[3] < 0.12:
                        v.co = hit[0] + hit[1] * 0.008
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new("prenda", me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ---------- tela
    vg = obj.vertex_groups.new(name="fijo")
    vg.add(fijos, 1.0, "REPLACE")
    cm = obj.modifiers.new("Cloth", "CLOTH")
    s = cm.settings
    s.vertex_group_mass = "fijo"
    s.pin_stiffness = 1.0
    s.quality = 8
    s.mass = 0.25
    s.tension_stiffness = 18
    s.compression_stiffness = 18
    s.shear_stiffness = 10
    s.bending_stiffness = 0.6
    s.tension_damping = 8
    s.compression_damping = 8
    s.shear_damping = 8
    s.bending_damping = 0.5
    s.air_damping = 2.0
    s.use_sewing_springs = True
    s.sewing_force_max = 0.0
    c = cm.collision_settings
    c.use_collision = True
    c.distance_min = 0.004
    c.collision_quality = 3
    c.use_self_collision = True
    c.self_distance_min = 0.004
    c.self_friction = 5.0
    c.impulse_clamp = 0.0
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = CUADROS
    sc.render.fps = 24
    t0 = time.time()
    cm.point_cache.frame_end = CUADROS
    for f in range(1, CUADROS + 1):
        sc.frame_set(f)
    print("SIM_SEGUNDOS", round(time.time() - t0, 1))

    dep = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dep)
    mesh_ev = ev.to_mesh()

    # ---------- exportar cada panel como malla propia
    os.makedirs(SALIDA, exist_ok=True)
    for o in list(bpy.data.objects):
        if o.name not in ("prenda",):
            bpy.data.objects.remove(o, do_unlink=True)
    bm2 = bmesh.new()
    bm2.from_mesh(mesh_ev)
    bm2.verts.ensure_lookup_table()
    # suavizado leve (saca los dientes del hombro) y soldadura de las costuras: las piezas se exportan
    # como mallas sueltas, así que los vértices cosidos tienen que quedar en el mismo punto
    fijos_set = set(fijos)
    for _ in range(4):
        bmesh.ops.smooth_vert(bm2, verts=[v for v in bm2.verts if v.index not in fijos_set], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    padre = list(range(len(bm2.verts)))
    def raiz(x):
        while padre[x] != x:
            padre[x] = padre[padre[x]]
            x = padre[x]
        return x
    for a, b in costuras_idx:
        padre[raiz(a)] = raiz(b)
    grupos = {}
    for v in bm2.verts:
        grupos.setdefault(raiz(v.index), []).append(v)
    for g in grupos.values():
        if len(g) > 1:
            centro_g = sum((v.co for v in g), Vector()) / len(g)
            for v in g:
                v.co = centro_g
    cp = bm2.verts.layers.int.get("panel")
    cu_ = bm2.verts.layers.float.get("uv_x")
    cv_ = bm2.verts.layers.float.get("uv_y")
    # Para separar por panel, se arma una malla por panel con sus caras
    salida_objs = []
    for pi, p in enumerate(paneles):
        bmp = bmesh.new()
        mapa = {}
        uvl = bmp.loops.layers.uv.new("UVMap")
        for v in bm2.verts:
            if v[cp] == pi:
                mapa[v.index] = bmp.verts.new(v.co)
        for f in bm2.faces:
            if all(v[cp] == pi for v in f.verts):
                nf = bmp.faces.new([mapa[v.index] for v in f.verts])
                for l, v in zip(nf.loops, f.verts):
                    # UV en cm / 100 (para que 1 unidad = 100 cm); la web la reescala según el tamaño del motivo
                    l[uvl].uv = (v[cu_] / 100.0, 1.0 - v[cv_] / 100.0)
        mp = bpy.data.meshes.new(f"{p.zona}|{p.nombre}|{p.idx}")
        bmp.to_mesh(mp)
        bmp.free()
        op = bpy.data.objects.new(f"{p.zona}|{p.nombre}|{p.idx}", mp)
        bpy.context.scene.collection.objects.link(op)
        for poly in mp.polygons:
            poly.use_smooth = True
        mat = bpy.data.materials.get("tela") or bpy.data.materials.new("tela")
        mp.materials.append(mat)
        salida_objs.append(op)
    bm2.free()
    ev.to_mesh_clear()
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in salida_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = salida_objs[0]
    # a coordenadas de glTF (y arriba): el exportador convierte desde Z-up de Blender
    bpy.ops.export_scene.gltf(filepath=os.path.join(SALIDA, f"{prenda}_{SPEC['talle']}.glb"), export_format="GLB", use_selection=True, export_apply=False, export_yup=True, export_materials="EXPORT", export_image_format="NONE")
    print("LISTO", prenda, SPEC["talle"])


main()
