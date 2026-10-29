# Accesorios que no son "un corte del maniquí": bolso (tote con asas curvas) y bufanda (cinta gruesa que da la vuelta al cuello).
# Uso:  blender -b --python accesorio.py -- <spec.json> <carpeta salida>
# Misma convención que prenda_offset.py: mallas "zona|Nombre|idx", UV en metros, Z arriba, frente = -Y.
import bpy, bmesh, json, math, sys, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ARGS = sys.argv[sys.argv.index("--") + 1:]
SPEC = json.load(open(ARGS[0]))
SALIDA = ARGS[1]
AQUI = os.path.dirname(os.path.abspath(__file__))
PERFIL = json.load(open(os.path.join(AQUI, "..", "..", "src", "data", "maniqui-perfil.json")))
TAU = 2 * math.pi
prenda = SPEC["prenda"]

lerp = lambda a, b, t: a + (b - a) * t
clamp = lambda v, a, b: max(a, min(b, v))


def sm(a, b, x):
    t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

bm = bmesh.new()
zona_de_cara = {}  # cara -> (zona, nombre)
uv_de_cara = {}  # cara -> lista de (u, v) por vértice


def malla_parametrica(pos, ni, nj, uv, zona, nombre, cerrada_j=False, cerrada_i=False):
    """Superficie ni x nj. pos(i, j) -> Vector; uv(i, j) -> (u, v) en metros. Si es cerrada, el último índice se pega con el primero."""
    vs = {}

    def vert(i, j):
        ki, kj = (i % ni if cerrada_i else i), (j % nj if cerrada_j else j)
        if (ki, kj) not in vs:
            vs[(ki, kj)] = bm.verts.new(pos(ki, kj))
        return vs[(ki, kj)]

    caras = []
    for i in range(ni - (0 if cerrada_i else 1)):
        for j in range(nj - (0 if cerrada_j else 1)):
            idx = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            try:
                f = bm.faces.new([vert(a, b) for a, b in idx])
            except ValueError:
                continue
            zona_de_cara[f] = (zona, nombre) if not callable(zona) else zona(idx)
            uv_de_cara[f] = [uv(a, b) for a, b in idx]
            caras.append(f)
    return caras


def tapa(centro, anillo, zona, nombre, uvf):
    """Abanico que cierra un anillo de vértices (lista de Vector)."""
    c = bm.verts.new(centro)
    vs = [bm.verts.new(p) for p in anillo]
    for k in range(len(vs)):
        try:
            f = bm.faces.new([c, vs[k], vs[(k + 1) % len(vs)]])
        except ValueError:
            continue
        zona_de_cara[f] = (zona, nombre)
        uv_de_cara[f] = [uvf(centro), uvf(anillo[k]), uvf(anillo[(k + 1) % len(vs)])]


def superelipse(a, b, ang, n=4.0):
    c, s = math.cos(ang), math.sin(ang)
    return a * math.copysign(abs(c) ** (2 / n), c), b * math.copysign(abs(s) ** (2 / n), s)


def tubo(camino, base_ancho, base_grueso, lados, zona, nombre, ancho_en=None, vec_ancho=None, n_super=4.0, zona_cara=None):
    """Tubo de sección superelíptica a lo largo de una lista de puntos. vec_ancho(k, T) -> dirección del ancho."""
    n = len(camino)
    largo = [0.0]
    for a, b in zip(camino[:-1], camino[1:]):
        largo.append(largo[-1] + (b - a).length)
    sec = []
    for k, p in enumerate(camino):
        T = (camino[min(k + 1, n - 1)] - camino[max(k - 1, 0)]).normalized()
        w = vec_ancho(k, T) if vec_ancho else Vector((1, 0, 0))
        w = (w - T * w.dot(T)).normalized()
        g = T.cross(w).normalized()
        sec.append((p, w, g))
    perim = 2 * (base_ancho + base_grueso)

    def pos(k, j):
        p, w, g = sec[k]
        x, y = superelipse(base_ancho / 2, base_grueso / 2, TAU * j / lados, n_super)
        return p + w * x + g * y

    zc = zona_cara or (lambda idx: (zona, nombre))

    caras = malla_parametrica(pos, n, lados, lambda k, j: (perim * (j % lados) / lados if j < lados else perim, largo[k]), zc, nombre, cerrada_j=True)
    return sec, caras


# ---------------------------------------------------------------- bolso ----
def bolso():
    W, H, D = 0.32, 0.24, 0.12
    NJ, NI = 56, 14
    # tote con la boca apenas más ancha que el fondo y la panza llena
    def radio(i):
        t = i / (NI - 1)
        a = lerp(0.128, 0.165, t) * (1 + 0.07 * math.sin(math.pi * min(1.0, t * 1.15)))
        b = lerp(0.062, 0.055, t) * (1 + 0.45 * math.sin(math.pi * t) ** 0.8)
        return a, b

    def pos(i, j):
        t = i / (NI - 1)
        a, b = radio(i)
        x, y = superelipse(a, b, TAU * j / NJ, 3.2)
        # el borde de arriba cae un poco hacia los costados
        return Vector((x, y, t * H - 0.012 * (abs(x) / a) ** 3 * t))

    perim = 2 * (W + D)

    def zona_cuerpo(idx):
        t = (idx[0][0] + idx[1][0]) / 2 / (NI - 1)
        if t < 0.1:
            return ("base", "Base")
        if t > 0.9:
            return ("solapa", "Borde")
        return ("cuerpo", "Frente o espalda")

    malla_parametrica(pos, NI, NJ, lambda i, j: (perim * j / NJ, H * i / (NI - 1)), zona_cuerpo, None, cerrada_j=True)
    # fondo cerrado
    a0, b0 = radio(0)
    anillo = [Vector((superelipse(a0, b0, TAU * j / NJ, 3.2)[0], superelipse(a0, b0, TAU * j / NJ, 3.2)[1], 0.0)) for j in range(NJ)]
    tapa(Vector((0, 0, -0.002)), anillo, "base", "Base", lambda p: (p.x + 0.16, p.y + 0.06))
    # borde de arriba: aro grueso (el ribete tejido)
    ar = []
    for j in range(NJ):
        a, b = radio(NI - 1)
        x, y = superelipse(a, b, TAU * j / NJ, 3.2)
        ar.append(Vector((x, y, H - 0.012 * (abs(x) / a) ** 3)))
    # asas: una por cara, arco ancho que sale de adentro del borde
    for signo in (1, -1):
        a, b = radio(NI - 1)
        yb = signo * (b * 0.93)
        pts = []
        N = 40
        for k in range(N + 1):
            th = math.pi * k / N
            x = 0.085 * math.cos(th)
            z = H - 0.025 + 0.19 * math.sin(th) ** 0.85
            pts.append(Vector((x, yb * (1 - 0.18 * math.sin(th)), z)))
        tubo(pts, 0.032, 0.012, 14, "asa", "Asa", vec_ancho=lambda k, T: Vector((0, 1, 0)).cross(T) if abs(T.y) < 0.9 else Vector((1, 0, 0)), n_super=3.0)


# ---------------------------------------------------------------- bufanda ----
def bufanda():
    objs = []
    bpy.ops.wm.obj_import(filepath=os.path.join(AQUI, "maniquis", f"maniqui_{SPEC['talle']}.obj"), forward_axis="NEGATIVE_Z", up_axis="Y")
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    cu = bpy.context.view_layer.objects.active
    me = cu.data
    me.transform(cu.matrix_world)
    b0 = bmesh.new()
    b0.from_mesh(me)
    bmesh.ops.remove_doubles(b0, verts=b0.verts, dist=0.0005)
    b0.verts.ensure_lookup_table()
    arbol = BVHTree.FromBMesh(b0)
    cx = PERFIL["cuerpo"][min(len(PERFIL["cuerpo"]) - 1, round((1.44 - PERFIL["cuerpo"][0]["y"]) / 0.01))]
    EX, EY = cx["cx"], -cx["cz"]

    def frente(x, z):
        """y de la superficie del frente del maniquí en (x, z)."""
        hit = arbol.ray_cast(Vector((x, EY - 0.5, z)), Vector((0, 1, 0)))
        return hit[0].y if hit[0] is not None else EY - 0.08

    GR = 0.032  # grosor del tejido
    ANCHO = 0.1
    HUECO = 0.014  # separación con el cuerpo
    # cola izquierda: sube pegada al pecho hasta el cuello
    def cola(xc, z_fin):
        pts = []
        for z in [z_fin + (1.30 - z_fin) * k / 14 for k in range(15)]:
            pts.append(Vector((xc, frente(xc, z) - GR / 2 - HUECO, z)))
        return pts

    RX, RY, ZC = 0.092, 0.1, 1.435

    def anillo(phi):
        # ángulo 0 = frente; sube un poco atrás y baja adelante, como cae una bufanda
        z = ZC + 0.028 * (1 - math.cos(phi)) / 2 - 0.018
        return Vector((EX + RX * math.sin(phi), EY - RY * math.cos(phi), z))

    A = cola(0.07, 0.86)  # termina abajo, del lado +x
    B = cola(-0.065, 0.97)
    PHI0 = 0.85
    N = 36
    vuelta = [anillo(PHI0 + (TAU - 2 * PHI0) * k / N) for k in range(N + 1)]
    # nudo del pecho: sale de la cola, entra tangente al aro
    puente_a = [Vector((0.07, frente(0.07, 1.33) - GR / 2 - HUECO - 0.004, 1.355)), Vector((0.08, EY - 0.108, 1.405))]
    puente_b = [Vector((-0.07, EY - 0.104, 1.405)), Vector((-0.066, frente(-0.065, 1.33) - GR / 2 - HUECO - 0.004, 1.355))]
    camino = A + puente_a + vuelta + puente_b + list(reversed(B))
    # suavizado: promedio móvil (dos pasadas) conservando los extremos
    for _ in range(3):
        nuevo = [camino[0]] + [(camino[k - 1] + camino[k] * 2 + camino[k + 1]) / 4 for k in range(1, len(camino) - 1)] + [camino[-1]]
        camino = nuevo
    # puntos extra para que el tubo sea parejo
    densos = []
    for a, b in zip(camino[:-1], camino[1:]):
        m = max(1, int((b - a).length / 0.012))
        densos += [a.lerp(b, i / m) for i in range(m)]
    densos.append(camino[-1])
    camino = densos
    total = len(camino)
    # el ancho va horizontal en las colas y vertical en el aro
    largo = [0.0]
    for a, b in zip(camino[:-1], camino[1:]):
        largo.append(largo[-1] + (b - a).length)
    zs = [p.z for p in camino]

    def vec_ancho(k, T):
        s = sm(1.28, 1.39, zs[k])  # 0 = cola, 1 = aro
        return Vector((1, 0, 0)).lerp(Vector((0, 0, 1)), s)

    LADOS = 24

    def zona_cara(idx):
        j = idx[0][1]
        ang = TAU * ((j + 0.5) % LADOS) / LADOS
        return ("borde", "Borde") if idx[0][1] % (LADOS // 2) in (0, LADOS // 2 - 1) else ("cuerpo", "Bufanda")

    sec, _ = tubo(camino, ANCHO, GR, LADOS, "cuerpo", "Bufanda", vec_ancho=vec_ancho, n_super=5.0, zona_cara=zona_cara)
    # tapas de las puntas
    for k in (0, total - 1):
        p, w, g = sec[k]
        ar = [p + w * superelipse(ANCHO / 2, GR / 2, TAU * j / LADOS, 5.0)[0] + g * superelipse(ANCHO / 2, GR / 2, TAU * j / LADOS, 5.0)[1] for j in range(LADOS)]
        tapa(p, ar, "cuerpo", "Bufanda", lambda q: (q.x, q.y))
    # franja de borde: faldón tejido en la punta de cada cola
    for k_fin, signo in ((0, 1), (total - 1, -1)):
        p, w, g = sec[k_fin]
        for i in range(15):
            x = (i - 7) / 7 * (ANCHO / 2 - 0.004)
            for t in range(2):
                pass
        for i in range(15):
            x = (i - 7) / 7 * (ANCHO / 2 - 0.006)
            base = p + w * x + g * (GR / 2) * 0.0
            largo_f = 0.085 + (0.012 if i % 2 else 0.0)
            hebra = [base - Vector((0, 0, 1)) * (largo_f * q / 6) + g * 0.002 * math.sin(q * 0.9 + i) for q in range(7)]
            tubo(hebra, 0.007, 0.007, 6, "flecos", "Flecos", vec_ancho=lambda kk, T: Vector((1, 0, 0)), n_super=2.0)
    bpy.data.objects.remove(cu, do_unlink=True)
    b0.free()


if prenda == "bolso":
    bolso()
elif prenda == "bufanda":
    bufanda()
else:
    raise SystemExit("accesorio.py solo hace bolso y bufanda")

bm.verts.index_update()
bm.verts.ensure_lookup_table()
bm.normal_update()
grupos = {}
for f in bm.faces:
    zona, nombre = zona_de_cara[f]
    grupos.setdefault((zona, nombre), []).append(f)

os.makedirs(SALIDA, exist_ok=True)
mat = bpy.data.materials.new("tela")
salida = []
for (zona, nombre), caras in grupos.items():
    bmp = bmesh.new()
    uvl = bmp.loops.layers.uv.new("UVMap")
    vm = {}
    for f in caras:
        for v in f.verts:
            if v.index not in vm:
                vm[v.index] = bmp.verts.new(v.co)
    bmp.verts.index_update()
    for f in caras:
        try:
            nf = bmp.faces.new([vm[v.index] for v in f.verts])
        except ValueError:
            continue
        for l, uv in zip(nf.loops, uv_de_cara[f]):
            l[uvl].uv = uv
    mp = bpy.data.meshes.new(f"{zona}|{nombre}|0")
    normales = [None] * len(vm)
    for i_b, v_b in vm.items():
        normales[v_b.index] = tuple(bm.verts[i_b].normal)
    bmp.to_mesh(mp)
    bmp.free()
    op = bpy.data.objects.new(f"{zona}|{nombre}|0", mp)
    bpy.context.scene.collection.objects.link(op)
    for poly in mp.polygons:
        poly.use_smooth = True
    mp.normals_split_custom_set_from_vertices(normales)
    mp.materials.append(mat)
    salida.append(op)
bm.free()
bpy.ops.object.select_all(action="DESELECT")
for o in salida:
    o.select_set(True)
bpy.context.view_layer.objects.active = salida[0]
bpy.ops.export_scene.gltf(filepath=os.path.join(SALIDA, f"{prenda}_{SPEC['talle']}.glb"), export_format="GLB", use_selection=True, export_apply=False, export_yup=True, export_materials="EXPORT", export_image_format="NONE")
print("LISTO", prenda, SPEC["talle"], {k[0]: len(v) for k, v in grupos.items()})
