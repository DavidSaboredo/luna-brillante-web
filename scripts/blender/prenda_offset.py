# Prenda "a medida del cuerpo": se recorta la malla del propio maniquí (torso + brazos en una sola superficie),
# se infla hacia afuera según la holgura y se suaviza. No hay hombros abiertos ni cuellos en escalera
# porque cuerpo, hombro y manga son una superficie continua.
# Uso:  blender -b --python prenda_offset.py -- <spec.json> <carpeta salida>
# Cada zona sale como una malla "zona|Nombre|idx" con UV en metros (= cm/100), igual que simular_prenda.py.
import bpy, bmesh, json, math, sys, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ARGS = sys.argv[sys.argv.index("--") + 1:]
SPEC = json.load(open(ARGS[0]))
SALIDA = ARGS[1]
AQUI = os.path.dirname(os.path.abspath(__file__))
PERFIL = json.load(open(os.path.join(AQUI, "..", "..", "src", "data", "maniqui-perfil.json")))
TAU = 2 * math.pi
Y_HOMBRO = 1.38
Y_TOPE = 1.415 if SPEC["prenda"] == "musculosa" else 1.43 if SPEC["prenda"] == "sueter" else (1.43 if SPEC["prenda"] in ("cardigan", "chaleco") else 1.415)  # el cuello alto termina acá; la blusa lleva escote bajo

lerp = lambda a, b, t: a + (b - a) * t
clamp = lambda v, a, b: max(a, min(b, v))


def sm(a, b, x):
    t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def gl_a_bl(p):
    return Vector((p[0], -p[2], p[1]))


# ---------------------------------------------------------------- maniquí ----
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.wm.obj_import(filepath=os.path.join(AQUI, "maniquis", f"maniqui_{SPEC['talle']}.obj"), forward_axis="NEGATIVE_Z", up_axis="Y")
objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
if len(objs) > 1:
    bpy.ops.object.join()
cuerpo = bpy.context.view_layer.objects.active
me_c = cuerpo.data
me_c.transform(cuerpo.matrix_world)
_b = bmesh.new()
_b.from_mesh(me_c)
bmesh.ops.remove_doubles(_b, verts=_b.verts, dist=0.0005)  # el maniquí viene partido por la línea del medio
_b.to_mesh(me_c)
_b.free()
me_c.calc_loop_triangles()
V = [v.co.copy() for v in me_c.vertices]
T = [tuple(t.vertices) for t in me_c.loop_triangles]
arbol = BVHTree.FromPolygons(V, T)

# ---------------------------------------------------------------- brazos ----
# el perfil se midió con el maniquí base: los brazos se corren hacia afuera lo que creció el torso
fila_ref = PERFIL["cuerpo"]
M = SPEC["medidas"]
HOLG = SPEC.get("holgura", 8) / TAU / 100  # holgura de busto como radio
LARGO = SPEC.get("largo", 60) / 100
MANGA = SPEC.get("manga", 43) / 100
prenda = SPEC["prenda"]
y_hem = max(Y_HOMBRO - LARGO, 0.93 if SPEC["prenda"] == "musculosa" else 0.88)  # musculosa: no baja a la ingle, la malla se abriría en arco
if prenda == "short":
    y_hem = max(1.06 - LARGO, 0.4)  # por debajo de la entrepierna la malla se partiría en dos piernas


def eje_brazo(lado):
    b = PERFIL["brazos"]["L" if lado == 1 else "R"]
    pts = [gl_a_bl(b["hombro"]), gl_a_bl(b["codo"]), gl_a_bl(b["muneca"])]
    return pts, b["radio_sup"], b["radio_inf"]


def ajustar_brazo(lado):
    """Pega el eje del brazo a la malla real: recorre el eje y lo centra con la superficie cercana."""
    pts, rs, ri = eje_brazo(lado)
    out = []
    for p in pts:
        # centro de la sección: promedio de puntos de la malla a menos de 6 cm, en el mismo plano horizontal
        cerca = [v for v in V if abs(v.z - p.z) < 0.02 and (Vector((v.x, v.y, 0)) - Vector((p.x, p.y, 0))).length < 0.07 and v.x * lado > 0.08]
        if len(cerca) > 6:
            c = sum(cerca, Vector()) / len(cerca)
            out.append(Vector((c.x, c.y, p.z)))
        else:
            out.append(p)
    return out, rs, ri


BRAZOS = {1: ajustar_brazo(1), -1: ajustar_brazo(-1)}


def cercano_brazo(p, lado):
    """(distancia al eje, s = largo recorrido desde el hombro, punto del eje, tangente)"""
    pts = BRAZOS[lado][0]
    mejor = None
    acum = 0.0
    for a, b in zip(pts[:-1], pts[1:]):
        seg = b - a
        l = seg.length
        t = clamp((p - a).dot(seg) / (l * l), 0, 1)
        c = a + seg * t
        d = (p - c).length
        if mejor is None or d < mejor[0]:
            mejor = (d, acum + l * t, c, seg.normalized())
        acum += l
    return mejor


def info_brazo(p):
    lado = 1 if p.x >= 0 else -1
    d, s, c, tan = cercano_brazo(p, lado)
    return lado, d, s, c, tan


# ---------------------------------------------------------------- recorte con borde liso ----
cx_cuello = PERFIL["cuerpo"][min(len(PERFIL["cuerpo"]) - 1, round((1.44 - PERFIL["cuerpo"][0]["y"]) / 0.01))]
EJE_X, EJE_Y = cx_cuello["cx"], -cx_cuello["cz"]


def apice(lado):
    """Punta del busto: el punto más adelantado del pecho de ese lado."""
    c = [v for v in V if 0.03 < v.x * lado < 0.12 and 1.14 < v.z < 1.30]
    return min(c, key=lambda v: v.y)


def camino(a, b, n=40):
    return [arbol.find_nearest(a.lerp(b, i / n))[0] for i in range(n + 1)]


if prenda == "bikini":
    APICE = {1: apice(1), -1: apice(-1)}
    TIRAS = []
    for lado_t in (1, -1):
        ap = APICE[lado_t]
        arriba = Vector((ap.x * 0.9, ap.y - 0.01, ap.z + 0.075))
        cuello = Vector((EJE_X + lado_t * 0.05, EJE_Y - 0.04, 1.40))
        nuca = Vector((EJE_X + lado_t * 0.02, EJE_Y + 0.07, 1.425))
        TIRAS += camino(arriba, cuello) + camino(cuello, nuca)


def campo_extra(p):
    """Campo de las prendas que no son suéter/cárdigan/chaleco (positivo = se queda)."""
    dx = abs(p.x - EJE_X)
    lado, d, s, c, tan = info_brazo(p)
    rs = BRAZOS[lado][1]
    en_brazo = d < rs - 0.005 and s > 0.12
    if prenda == "musculosa":
        f = min(p.z - y_hem, Y_TOPE - p.z, 0.14 + 0.15 * (1 - sm(1.0, 1.15, p.z)) - dx, (d - (rs + 0.01)) if s > 0.12 else 1.0)
        h = BRAZOS[lado][0][0]
        az = M["sisa"] / 200
        q = p - Vector((h.x + lado * 0.045, h.y, 1.385 - az))
        ay = (0.062 + 0.012 * sm(-az, az, q.z)) * (1.4 if q.y < 0 else 1.0)
        f = min(f, (math.sqrt((q.x / 0.075) ** 2 + (q.y / ay) ** 2 + (q.z / az) ** 2) - 1.0) * 0.06)
        # escote en U: hondo adelante, más cerrado atrás
        base = 1.265 if p.y < EJE_Y else 1.34
        qn = (p.z - Y_TOPE) / (Y_TOPE - base)
        return min(f, (math.sqrt((dx / 0.072) ** 2 + qn * qn) - 1.0) * 0.06)
    if prenda == "short":
        return min(p.z - y_hem, 1.10 - p.z, (d - rs - 0.025) if s > 0.12 else 1.0)
    # bikini: tazas, banda bajo el busto, tiras y bombacha (se unen con max)
    mejor = -1.0
    if p.y < EJE_Y:
        for ap in APICE.values():
            q = Vector((p.x - ap.x * 0.97, (p.y - ap.y) * 0.8, (p.z - ap.z - 0.012) * 0.95))
            mejor = max(mejor, 0.062 - q.length)
    if not en_brazo:
        mejor = max(mejor, min(p.z - 1.125, 1.165 - p.z, 0.17 - dx))
    mejor = max(mejor, 0.016 - min((p - t).length for t in TIRAS))
    if p.z < 1.02:
        zbajo = 0.865 + 0.62 * max(0.0, dx - 0.035)
        mejor = max(mejor, min(p.z - zbajo, 0.985 - p.z))
    return mejor


def campo(p):
    if prenda in ("musculosa", "short", "bikini"):
        return campo_extra(p)
    f = min(p.z - y_hem, Y_TOPE - p.z)
    if prenda in ("cardigan", "chaleco"):
        # abierto adelante: se saca una franja al medio del frente y el escote baja en V
        frente = clamp((EJE_Y - p.y) / 0.03, 0, 1)
        f = min(f, (abs(p.x - EJE_X) - 0.004) + (1 - frente) * 1.0)
        f = min(f, (Y_TOPE - p.z) - 0.07 * frente * (1 - sm(0.0, 0.1, abs(p.x - EJE_X))))
    lado, d, s, c, tan = info_brazo(p)
    rs, ri = BRAZOS[lado][1], BRAZOS[lado][2]
    if prenda == "chaleco":
        # sin mangas: se saca el brazo y se abre la sisa debajo del hombro
        f = min(f, (d - (rs - 0.005)) if s > 0.12 else 1.0)
        f = min(f, 0.158 + 0.04 * (1 - sm(1.28, 1.38, p.z)) - abs(p.x - EJE_X))
        # sisa ovalada (más alta que ancha, curva más cerrada abajo): la profundidad sale de la medida "sisa" del patrón
        h = BRAZOS[lado][0][0]
        prof = SPEC.get("medidas", {}).get("sisa", 20) / 100
        az = prof / 2
        q = p - Vector((h.x + lado * 0.045, h.y, 1.385 - az))
        ay = (0.062 + 0.012 * sm(-az, az, q.z)) * (1.4 if (q.y * -1) > 0 else 1.0)  # el frente es la dirección -Y; # más ancha arriba, más cerrada en la axila
        f = min(f, (math.sqrt((q.x / 0.075) ** 2 + (q.y / ay) ** 2 + (q.z / az) ** 2) - 1.0) * 0.06)
        return f
    if d < lerp(rs, ri, clamp(s / 0.5, 0, 1)) + 0.07 and s > 0.1:
        f = min(f, MANGA - s)
    return f


F = [campo(v) for v in V]


def corte(a, b, cache, nuevos):
    clave = (a, b) if a < b else (b, a)
    if clave not in cache:
        fa, fb = F[a], F[b]
        t = fa / (fa - fb)
        nuevos.append(V[a].lerp(V[b], t))
        cache[clave] = len(V) + len(nuevos) - 1
    return cache[clave]


nuevos = []
cache = {}
tris = []
for t in T:
    dentro = [F[i] >= 0 for i in t]
    n = sum(dentro)
    if n == 3:
        tris.append(t)
    elif n == 0:
        continue
    else:
        # rotar para que el primer vértice sea "el distinto"
        for k in range(3):
            a, b, c = t[k], t[(k + 1) % 3], t[(k + 2) % 3]
            ia, ib, ic = F[a] >= 0, F[b] >= 0, F[c] >= 0
            if n == 1 and ia and not ib and not ic:
                tris.append((a, corte(a, b, cache, nuevos), corte(a, c, cache, nuevos)))
                break
            if n == 2 and not ia and ib and ic:
                ab, ac = corte(a, b, cache, nuevos), corte(a, c, cache, nuevos)
                tris.append((ab, b, c))
                tris.append((ab, c, ac))
                break
VT = V + nuevos

# quedarse con la componente más grande (saca dedos, restos de la cabeza, etc.)
padre = list(range(len(VT)))
def raiz(x):
    while padre[x] != x:
        padre[x] = padre[padre[x]]
        x = padre[x]
    return x
for t in tris:
    padre[raiz(t[0])] = raiz(t[1])
    padre[raiz(t[1])] = raiz(t[2])
cuenta = {}
for t in tris:
    cuenta[raiz(t[0])] = cuenta.get(raiz(t[0]), 0) + 1
principal = max(cuenta, key=cuenta.get)
grandes = {r for r, n in cuenta.items() if n >= (0.08 if prenda == 'bikini' else 1.0) * cuenta[principal]}
tris = [t for t in tris if raiz(t[0]) in grandes]

bm = bmesh.new()
mapa = {}
for t in tris:
    for i in t:
        if i not in mapa:
            mapa[i] = bm.verts.new(VT[i])
for t in tris:
    try:
        bm.faces.new([mapa[i] for i in t])
    except ValueError:
        pass
bm.verts.index_update()
bm.verts.ensure_lookup_table()
bm.normal_update()

# ---------------------------------------------------------------- inflado ----
def holgura_en(p):
    """Cuánto se separa la tela del cuerpo (m): ajustada arriba y más suelta hacia el dobladillo."""
    lado, d, s, c, tan = info_brazo(p)
    base = 0.004 if prenda == "bikini" else 0.005 + HOLG * 0.4
    caida = 0.006 * sm(1.22, y_hem + 0.05, p.z)
    d_torso = base + caida
    rs, ri = BRAZOS[lado][1], BRAZOS[lado][2]
    w = 1 - sm(0.0, 0.06, d - lerp(rs, ri, clamp(s / 0.5, 0, 1)))
    w *= sm(0.05, 0.16, s)
    d_manga = 0.010 + HOLG * 0.6 + 0.006 * sm(0.1, 0.4, s)
    return lerp(d_torso, d_manga, w)


# silueta suelta: bajo el busto la tela cae recta (se acerca a la envolvente de la zona) y no copia cada curva del cuerpo
NA = 36
def es_torso(p):
    lado, d, s_, c, tan = info_brazo(p)
    return not (d < lerp(BRAZOS[lado][1], BRAZOS[lado][2], clamp(s_ / 0.5, 0, 1)) + 0.08 and s_ > 0.1)

def pol(p):
    return math.atan2(p.x - EJE_X, -(p.y - EJE_Y)), math.hypot(p.x - EJE_X, p.y - EJE_Y)

casco = {}
for v in bm.verts:
    if prenda not in ("short", "bikini") and v.co.z < 1.3 and es_torso(v.co):
        a, r = pol(v.co)
        k = (int((a + math.pi) / TAU * NA) % NA, int(v.co.z / 0.02))
        casco[k] = max(casco.get(k, 0), r)

def radio_casco(a, z):
    kz = int(z / 0.02)
    best = 0
    for dz in range(-3, 4):
        for da in (-1, 0, 1):
            ka = (int((a + math.pi) / TAU * NA) + da) % NA
            best = max(best, casco.get((ka, kz + dz), 0))
    return best

for v in bm.verts:
    if prenda not in ("short", "bikini") and v.co.z < 1.28 and es_torso(v.co):
        a, r = pol(v.co)
        rh = radio_casco(a, v.co.z)
        w = 0.35 * sm(1.26, 1.10, v.co.z)
        if rh > r:
            f_ = (r + (rh - r) * w) / r
            v.co.x = EJE_X + (v.co.x - EJE_X) * f_
            v.co.y = EJE_Y + (v.co.y - EJE_Y) * f_
bm.normal_update()

orig = {v.index: v.co.copy() for v in bm.verts}
nor = {v.index: v.normal.copy() for v in bm.verts}
disp = {v.index: holgura_en(v.co) for v in bm.verts}

# suavizar el desplazamiento (no la posición) para que no aparezcan escalones
for _ in range(10):
    nuevo = {}
    for v in bm.verts:
        vec = [e.other_vert(v).index for e in v.link_edges]
        nuevo[v.index] = lerp(disp[v.index], sum(disp[i] for i in vec) / len(vec), 0.5)
    disp = nuevo

for v in bm.verts:
    v.co = orig[v.index] + nor[v.index] * disp[v.index]

# suavizado de posición, con el borde recorte fijo para que no se achique
borde = {v.index for v in bm.verts if any(len(e.link_faces) < 2 for e in v.link_edges)}
for _ in range(6):
    bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if v.index not in borde], factor=0.4, use_axis_x=True, use_axis_y=True, use_axis_z=True)
# el borde también se alisa, pero solo a lo largo de sí mismo
for _ in range(6):
    mov = {}
    for v in bm.verts:
        if v.index in borde:
            vec = [e.other_vert(v) for e in v.link_edges if e.other_vert(v).index in borde and len(e.link_faces) < 2]
            if vec:
                mov[v.index] = sum((w.co for w in vec), Vector()) / len(vec)
    for i, p in mov.items():
        bm.verts[i].co = bm.verts[i].co.lerp(p, 0.5)

# nunca dentro del cuerpo
MIN = 0.006
for v in bm.verts:
    hit = arbol.find_nearest(v.co)
    if hit[0] is None:
        continue
    sgn = (v.co - hit[0]).dot(hit[1])
    if sgn < MIN:
        v.co = hit[0] + hit[1] * MIN
bm.normal_update()
bm.verts.index_update()
bm.faces.ensure_lookup_table()

# ---------------------------------------------------------------- zonas ----
def zona_de(f):
    c = sum((v.co for v in f.verts), Vector()) / 3
    if prenda == "short":
        if c.z > 1.10 - 0.04:
            return ("pretina", "Pretina", 0)
        if c.z < y_hem + 0.04:
            return ("puños", "Puño", 0 if c.x >= EJE_X else 1)
        return ("piernas", "Pierna", 0)
    if prenda == "bikini":
        if c.z < 1.02:
            return ("bombacha", "Bombacha", 0)
        if c.z < 1.17 and abs(c.x - EJE_X) < 0.17 and c.y > EJE_Y - 0.05 or (c.z < 1.14):
            return ("tiras", "Tira", 0)
        return ("tazas", "Taza", 0) if c.y < EJE_Y - 0.03 and c.z < 1.34 else ("tiras", "Tira", 0)
    if prenda == "musculosa":
        if c.z > 1.30 and abs(c.x - EJE_X) < 0.14 and c.z > (1.24 if c.y < EJE_Y else 1.30) + 0.0 and abs(c.x - EJE_X) > 0.045:
            return ("breteles", "Bretel", 0 if c.x >= EJE_X else 1)
        if c.z < y_hem + 0.035:
            return ("borde", "Borde", 0)
        return ("cuerpo", "Delantero" if c.y < EJE_Y else "Espalda", 0)
    lado, d, s, cp, tan = info_brazo(c)
    rs, ri = BRAZOS[lado][1], BRAZOS[lado][2]
    en_brazo = prenda != "chaleco" and d < lerp(rs, ri, clamp(s / 0.5, 0, 1)) + 0.05 and s > 0.14
    if en_brazo:
        if s > MANGA - 0.06 and prenda == "sueter":
            return ("puños", "Puño", 0 if lado == 1 else 1)
        return ("mangas", "Manga", 0 if lado == 1 else 1)
    if prenda in ("cardigan", "chaleco"):
        if c.y < EJE_Y - 0.01 and abs(c.x - EJE_X) < 0.05:
            return ("ribete", "Ribete", 0)
        return ("delanteros", "Delantero", 0) if c.y < EJE_Y else ("espalda", "Espalda", 0)
    if prenda == "blusa":
        if c.z > 1.30 and math.hypot(c.x - EJE_X, c.y - EJE_Y) < 0.2:
            return ("canesu", "Canesú", 0)
    elif c.z > 1.395 and math.hypot(c.x - EJE_X, c.y - EJE_Y) < 0.085:
        return ("cuello", "Cuello", 0)
    if c.z < y_hem + 0.07:
        return ("borde", "Borde", 0)
    return ("cuerpo", "Cuerpo", 0)


def uv_de(p, zona, lado):
    if zona in ("mangas", "puños"):
        l, d, s, c, tan = info_brazo(p)
        ref = Vector((-lado, 0, 0))
        n = (ref - tan * ref.dot(tan)).normalized()
        bb = tan.cross(n).normalized()
        r = p - c
        ang = math.atan2(r.dot(bb), -r.dot(n))
        return ang * 0.05, s
    if prenda == "short" and zona != "pretina":
        cx = EJE_X + (0.09 if p.x >= EJE_X else -0.09)
        return math.atan2(p.x - cx, -(p.y - EJE_Y)) * 0.08, 1.0 - p.z
    ang = math.atan2(p.x - EJE_X, -(p.y - EJE_Y))
    return ang * 0.16, 1.0 - p.z


grupos = {}
for f in bm.faces:
    grupos.setdefault(zona_de(f), []).append(f)

os.makedirs(SALIDA, exist_ok=True)
salida_objs = []
mat = bpy.data.materials.new("tela")
for (zona, nombre, idx), caras in grupos.items():
    bmp = bmesh.new()
    uvl = bmp.loops.layers.uv.new("UVMap")
    vm = {}
    for f in caras:
        for v in f.verts:
            if v.index not in vm:
                vm[v.index] = bmp.verts.new(v.co)
    bmp.verts.index_update()
    lado = 1 if idx == 0 else -1
    for f in caras:
        nf = bmp.faces.new([vm[v.index] for v in f.verts])
        uvs = [uv_de(v.co, zona, lado) for v in f.verts]
        us = [u for u, _ in uvs]
        per = 0.05 * TAU if zona in ("mangas", "puños") else 0.16 * TAU
        if max(us) - min(us) > per / 2:
            uvs = [(u + per if u < (max(us) + min(us)) / 2 else u, w) for u, w in uvs]
        for l, (u, w) in zip(nf.loops, uvs):
            l[uvl].uv = (u, w)
    mp = bpy.data.meshes.new(f"{zona}|{nombre}|{idx}")
    bmp.verts.ensure_lookup_table()
    normales = [None] * len(vm)
    for i_b, v_b in vm.items():
        normales[v_b.index] = tuple(bm.verts[i_b].normal)
    bmp.to_mesh(mp)
    bmp.free()
    op = bpy.data.objects.new(f"{zona}|{nombre}|{idx}", mp)
    bpy.context.scene.collection.objects.link(op)
    for poly in mp.polygons:
        poly.use_smooth = True
    mp.normals_split_custom_set_from_vertices(normales)
    mp.materials.append(mat)
    salida_objs.append(op)
bm.free()
bpy.data.objects.remove(cuerpo, do_unlink=True)
bpy.ops.object.select_all(action="DESELECT")
for o in salida_objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = salida_objs[0]
bpy.ops.export_scene.gltf(filepath=os.path.join(SALIDA, f"{prenda}_{SPEC['talle']}.glb"), export_format="GLB", use_selection=True, export_apply=False, export_yup=True, export_materials="EXPORT", export_image_format="NONE")
print("LISTO", prenda, SPEC["talle"], {k[0] + str(k[2]): len(v) for k, v in grupos.items()})
