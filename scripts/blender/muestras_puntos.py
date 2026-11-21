# Muestras tejidas de los puntos básicos (estilo "foto de lana gruesa"): cada puntada se arma con hilo retorcido
# formando V enlazadas, como un tejido real, y se renderiza con fondo transparente.
# Uso:  blender -b --python muestras_basicas.py -- <carpeta salida> <id1,id2,...|todos> [muestras] [ancho]
# Variables: COLOR_MUESTRA (hex), RADIO (grosor del hilo), PIEZAS no se usa.
import bpy, bmesh, json, math, os, re, sys, time
import numpy as np
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:]
SALIDA = ARGS[0]
IDS = ARGS[1]
MUESTRAS = int(ARGS[2]) if len(ARGS) > 2 else 40
ANCHO_IMG = int(ARGS[3]) if len(ARGS) > 3 else 960
ALTO_IMG = int(ANCHO_IMG * 0.75)
TAU = math.pi * 2
R = float(os.environ.get("RADIO", "0.2"))
FIBRAS = int(os.environ.get("FIBRAS", "9"))
_C = os.environ.get("COLOR_MUESTRA", "#e87fa0")
COLORES = {0: "#e87fa0", 1: "#f1e3cf", 2: "#b79ad9", 3: "#8fc9a7", 4: "#e0b04a", 5: "#cf7a5a", 6: "#8fb8de"}
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

    def hilo(self, pts, color=0, cerrado=False, r=R, torsion_ofs=None, fibra=False):
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
        marcos = []
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
            marcos.append((nrm, bnr))
            anillo = []
            rr = r if fibra else r * (1 + 0.09 * math.sin(largos[i] * 4.3 + fase * 9) + 0.04 * math.sin(largos[i] * 11 + fase * 3))
            for k in range(seg):
                a = TAU * k / seg
                p = s[i] + (nrm * math.cos(a) + bnr * math.sin(a)) * rr
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
        if not fibra and r > 0.05:
            NF = FIBRAS
            for f in range(NF):
                ph = self.rnd.rand() * TAU
                amp = r * (0.95 + self.rnd.rand() * 0.35)
                tw = 5.0 + self.rnd.rand() * 3.0
                pts_f = []
                for i in range(0, n, 3):
                    th = ph + tw * largos[i]
                    sal = 1.0
                    if self.rnd.rand() < 0.0:
                        sal = 1.9 + self.rnd.rand() * 1.6   # fibra suelta que se despega
                    nrm, bnr = marcos[i]
                    pts_f.append(s[i] + (nrm * math.cos(th) + bnr * math.sin(th)) * amp * sal)
                if len(pts_f) >= 3:
                    self.hilo(pts_f, color, cerrado=cerrado, r=R * 0.045, torsion_ofs=0.0, fibra=True)



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
    fondo.inputs["Strength"].default_value = 1.1
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
        suelo.is_shadow_catcher = False; suelo.hide_render = True
    else:
        sm_ = bpy.data.materials.new("suelo")
        sm_.use_nodes = True
        b_ = sm_.node_tree.nodes["Principled BSDF"]
        b_.inputs["Base Color"].default_value = hex_a_lineal("#fbf7f4")
        b_.inputs["Roughness"].default_value = 1.0
        suelo.data.materials.append(sm_)
    # cámara: de frente para tejidos en filas, desde arriba para motivos planos (flores, discos, granny)
    plano = prof > alto * 1.2
    elev = math.radians(78 if plano else 12)
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


# --------------------------------------------------------------------------- puntadas como V enlazadas
AVANCE = {"sc": 0.78, "slst": 0.8, "hdc": 0.88, "dc": 0.97, "tr": 0.98, "dtr": 0.98}
ALTOS = {"sc": 0.8, "hdc": 1.1, "dc": 1.45, "tr": 1.9, "dtr": 2.35, "slst": 0.5}


COL = [0]


def espejo(pts):
    return [(-x, y, z) for x, y, z in pts]


def mover(pts, dx, dy, M=None):
    out = [(x + dx, y + dy, z) for x, y, z in pts]
    return [M(*p) for p in out] if M else out


def puntada(E, tipo, x, y0, M=None):
    """Una puntada vista de frente: V de dos patas con cabeza; en las altas, palo + barras de hebra.
    Devuelve la altura que sube la fila."""
    h = ALTOS[tipo]
    if tipo in ("sc", "slst"):
        izq = [(-0.40, h + 0.02, 0.02), (-0.24, h * 0.62, 0.13), (-0.07, h * 0.2, 0.12), (0.0, -0.02, 0.0)]
        E.hilo(mover(izq, x, y0, M), COL[0])
        E.hilo(mover(espejo(izq), x, y0, M), COL[0])
        return h
    # puntadas altas: dos hebras casi verticales (palo) + V en la cabeza + hebras envueltas
    n_env = {"hdc": 1, "dc": 1, "tr": 2, "dtr": 3}[tipo]
    cuerpo = h - 0.3
    pal = [(-0.2, -0.02, 0.0), (-0.22, cuerpo * 0.35, 0.14), (-0.2, cuerpo * 0.7, 0.14), (-0.26, cuerpo + 0.04, 0.05)]
    E.hilo(mover(pal, x, y0, M), COL[0])
    E.hilo(mover(espejo(pal), x, y0, M), COL[0])
    cab = [(-0.42, h + 0.0, 0.02), (-0.2, h - 0.2, 0.12), (0.0, cuerpo + 0.08, 0.1)]
    E.hilo(mover(cab, x, y0, M), COL[0])
    E.hilo(mover(espejo(cab), x, y0, M), COL[0])
    for k in range(n_env):
        yy = cuerpo * (0.22 + 0.62 * (k + 0.5) / n_env) if n_env > 1 else cuerpo * 0.5
        sg = 1 if k % 2 == 0 else -1
        barra = [(-0.42, yy - 0.13 * sg, 0.1), (-0.15, yy - 0.05 * sg, 0.26), (0.15, yy + 0.05 * sg, 0.26), (0.42, yy + 0.13 * sg, 0.1)]
        E.hilo(mover(barra, x, y0, M), COL[0], r=R * 0.8)
    return h


def cadena_base(E, n, y=0.0, M=None):
    for i in range(n + 1):
        a = i - 0.5 + 0.5
        pts = []
        giro = 0.0 if i % 2 else math.pi / 2
        for k in range(14):
            t = TAU * k / 14
            pts.append((a + math.cos(t) * 0.5, y + math.sin(t) * 0.2 * math.cos(giro), math.sin(t) * 0.2 * math.sin(giro) + 0.0))
        E.hilo([M(*p) if M else p for p in pts], 0, cerrado=True)


def tejido_filas(E, tipo, columnas, filas):
    cadena_base(E, columnas + 1)
    y = 0.0
    for _ in range(filas):
        for i in range(columnas):
            h = puntada(E, tipo, i + 1.0, y)
        y += h * AVANCE[tipo]


def hilera_cadenas(E, n):
    """Cadena: una hilera de eslabones enlazados, un poco curva."""
    for i in range(n):
        pts = []
        giro = 0.0 if i % 2 else math.pi / 2
        for k in range(16):
            t = TAU * k / 16
            pts.append((i * 0.78 + math.cos(t) * 0.62, math.sin(t) * 0.32 * math.cos(giro), math.sin(t) * 0.32 * math.sin(giro)))
        E.hilo(pts, 0, cerrado=True)


def disco(E, rondas=4):
    """Círculo plano de punto bajo visto desde arriba (anillo mágico + rondas con aumentos)."""
    pts = [(math.cos(TAU * k / 14) * 0.38, 0.0, math.sin(TAU * k / 14) * 0.38) for k in range(14)]
    E.hilo(pts, 0, cerrado=True)
    for k in range(1, rondas + 1):
        n = 6 * k
        rho = 0.2 + 0.78 * (k - 1)
        for i in range(n):
            th = TAU * i / n + (k % 2) * 0.1

            def M(u, v, w, th=th):
                return (v * math.cos(th) - u * math.sin(th), w, v * math.sin(th) + u * math.cos(th))
            puntada(E, "sc", 0.0, rho, M)


def anillo_plano(E, cx, cz, r, col=0):
    E.hilo([(cx + math.cos(TAU * k / 12) * r, 0.0, cz + math.sin(TAU * k / 12) * r) for k in range(12)], col, cerrado=True)


def granny(E, rondas=3):
    cols = [0, 1, 2]
    disco_centro = [(math.cos(TAU * k / 14) * 0.4, 0.0, math.sin(TAU * k / 14) * 0.4) for k in range(14)]
    E.hilo(disco_centro, cols[0], cerrado=True)
    for k in range(1, rondas + 1):
        COL[0] = cols[(k - 1) % 3]
        r = 1.2 + 1.8 * k
        interior = [(j + 1) * (2 * (r - 1.4)) / k - (r - 1.4) for j in range(k - 1)]
        pos = [-(r - 1.4), (r - 1.4)] + interior
        for lado in range(4):
            ang = lado * math.pi / 2
            dx, dz = math.cos(ang), math.sin(ang)
            tx, tz = -dz, dx
            for a in pos:
                for u in (-0.85, 0.0, 0.85):
                    bx, bz = dx * (r - 0.3) + tx * a, dz * (r - 0.3) + tz * a

                    def M(uu, vv, w, bx=bx, bz=bz, dx=dx, dz=dz, tx=tx, tz=tz):
                        return (bx + dx * vv + tx * uu, w, bz + dz * vv + tz * uu)
                    puntada(E, "dc", u, 0.0, M)
            # cadena de la esquina
            cx, cz = dx * r + tx * r, dz * r + tz * r
            anillo_plano(E, cx * 1.0 + dx * 0.3 + tx * 0.3, cz * 1.0 + dz * 0.3 + tz * 0.3, 0.42, COL[0])
    COL[0] = 0



# --------------------------------------------------------------------------- intérprete de filas (tokens del diagrama)
ESTRIPS = ("fp", "bp", "blo", "flo", "spike", "long", "herr", "third", "waist", "thermal", "mid", "link", "c2", "c3")
BASES = {"sc": "sc", "hdc": "hdc", "dc": "dc", "tr": "tr", "dtr": "dtr", "slst": "slst", "trtr": "dtr", "trin": "tr",
         "xsc": "hdc", "tks": "sc", "tss": "hdc", "tps": "hdc", "tfs": "hdc", "scdc": "sc", "rsc": "sc", "sol": "dc",
         "solR": "dc", "solL": "dc", "lean": "dc", "crazy": "dc", "wattle": "dc", "sedge": "sc"}


def rot_M(bx, by, ang, dz=0.0):
    ca, sa = math.cos(ang), math.sin(ang)

    def M(u, v, w):
        return (bx + u * ca - v * sa, by + u * sa + v * ca, w + dz)
    return M


def eslabon(E, cx, cy, ang, giro, largo=0.62, ancho=0.3, z=0.0):
    pts = []
    ca, sa = math.cos(ang), math.sin(ang)
    for k in range(14):
        t = TAU * k / 14
        a, b = math.cos(t) * largo, math.sin(t) * ancho
        pts.append((cx + a * ca - b * math.cos(giro) * sa, cy + a * sa + b * math.cos(giro) * ca, z + b * math.sin(giro)))
    E.hilo(pts, COL[0], cerrado=True)


def cadenas(E, x, y, n):
    for i in range(n):
        eslabon(E, x + 0.31 + i * 0.62, y, 0.0, 0.0 if i % 2 else math.pi / 2, 0.36, 0.17)
    return n * 0.62


def arco(E, x, y, n, y_base_h=0.0):
    w = max(1.6, 0.52 * n)
    hh = 0.55 + 0.1 * n
    m = max(3, n)
    for i in range(m):
        t = (i + 0.5) / m
        px, py = x + t * w, y + 4 * hh * t * (1 - t) * 0.6 + 0.25
        tang = math.atan2(4 * hh * 0.6 * (1 - 2 * t), w)
        eslabon(E, px, py, tang, 0.0 if i % 2 else math.pi / 2, 0.36, 0.17)
    return w


def abanico(E, tipo, n, x, y, apertura=None):
    ap = apertura if apertura is not None else min(1.15, 0.13 * n + 0.25)
    anchura = 0.45 * n + 0.6
    cx = x + anchura / 2
    for k in range(n):
        a = lerp(-ap, ap, k / max(1, n - 1)) if n > 1 else 0.0
        puntada(E, tipo, 0.0, 0.0, rot_M(cx + a * 0.25, y, -a))
    return anchura, ALTOS[tipo] * 0.95


def grupo(E, tipo, n, x, y):
    anchura = 0.42 * n + 0.6
    cx = x + anchura / 2
    for k in range(n):
        o = (k - (n - 1) / 2) * 0.42
        puntada(E, tipo, 0.0, 0.0, rot_M(cx + o, y, -o * 0.22, 0.02 * k))
    return anchura, ALTOS[tipo]


def bulto(E, x, y, n=3):
    cx = x + 0.55
    for k in range(n):
        o = (k - (n - 1) / 2) * 0.3
        pts = []
        for j in range(12):
            t = TAU * j / 12
            pts.append((cx + o + math.cos(t) * 0.26, y + 0.65 + math.sin(t) * 0.62, 0.12 * math.cos(k * 1.7) + math.sin(t) * 0.05))
        E.hilo(pts, COL[0], cerrado=True)
    puntada(E, "sc", 0.0, 0.0, rot_M(cx, y, 0.0))
    return 1.1, 1.3


def picot(E, x, y):
    pts = [(x + 0.35 + math.cos(TAU * j / 10) * 0.28, y + 0.45 + math.sin(TAU * j / 10) * 0.3, 0.05) for j in range(10)]
    E.hilo(pts, COL[0], cerrado=True)
    return 0.8, 0.8


def item(E, tok, x, y):
    """Dibuja un token en (x, y). Devuelve (ancho, alto)."""
    m = re.match(r"^(.*?)(?:\*(\d+))?$", tok)
    nombre, rep = m.group(1), int(m.group(2) or 1)
    partes = nombre.split(":")
    mods = [p for p in partes if p in ESTRIPS or p in ("fp", "bp")]
    dz = 0.28 if "fp" in partes else (-0.12 if "bp" in partes else 0.0)
    nucleo = [p for p in partes if p not in ESTRIPS]
    cab = nucleo[0] if nucleo else "dc"
    resto = nucleo[1] if len(nucleo) > 1 else None
    base = re.sub(r"\d+$", "", cab)
    num = re.search(r"(\d+)$", cab)
    n = int(num.group(1)) if num else None
    if base == "sk":
        return 0.45 * (n or rep), 0.0
    if base == "ch":
        return cadenas(E, x, y + 0.45, n or rep), 0.5
    if base == "arc":
        return arco(E, x, y, n or 3), 1.3
    if base in ("pic", "picot"):
        return picot(E, x, y)
    if base in ("puff", "bob", "pop", "bean", "Vpuff", "bobN", "popN"):
        return bulto(E, x, y, 3)
    if base == "shell" or base == "fan" or base == "clfan":
        tipo = BASES.get(resto, "dc") if resto else "dc"
        return abanico(E, tipo, n or 5, x, y)
    if base in ("cl", "dec", "inc") or (base == "c" and n):
        tipo = BASES.get(resto, "dc") if resto else "dc"
        if base == "inc":
            return abanico(E, tipo, n or 2, x, y)
        return grupo(E, tipo, n or 3, x, y)
    if base == "V":
        tipo = BASES.get(resto, "dc") if resto else "dc"
        puntada(E, tipo, 0.0, 0.0, rot_M(x + 0.45, y, -0.3))
        puntada(E, tipo, 0.0, 0.0, rot_M(x + 1.35, y, 0.3))
        return 1.8, ALTOS[tipo]
    if base == "X":
        tipo = BASES.get(resto, "dc") if resto else "dc"
        puntada(E, tipo, 0.0, 0.0, rot_M(x + 0.5, y, -0.38))
        puntada(E, tipo, 0.0, 0.0, rot_M(x + 0.5, y, 0.38, 0.1))
        return 1.0, ALTOS[tipo]
    tipo = BASES.get(base)
    if tipo is None:
        tipo = BASES.get(resto or "dc", "dc")
    ang = {"solR": -0.28, "solL": 0.28, "lean": 0.25}.get(base, 0.0)
    ancho = 0.0
    for r in range(rep):
        puntada(E, tipo, 0.0, 0.0, rot_M(x + ancho + 0.5, y, ang, dz))
        ancho += 1.0
    return ancho, ALTOS[tipo]


def tejer_filas(E, filas, col=0):
    COL[0] = col
    anchos = []
    plan = []
    for fila in filas:
        toks = fila.split()
        w = 0.0
        for t in toks:
            # medir sin dibujar: ancho estimado
            m = re.match(r"^(.*?)(?:\*(\d+))?$", t)
            nom, rep = m.group(1), int(m.group(2) or 1)
            cab = nom.split(":")[-1] if nom.split(":")[0] in ESTRIPS else nom.split(":")[0]
            base = re.sub(r"\d+$", "", cab)
            nn = re.search(r"(\d+)$", cab)
            nn = int(nn.group(1)) if nn else None
            if base == "sk": w += 0.45 * (nn or rep)
            elif base == "ch": w += 0.62 * (nn or rep)
            elif base == "arc": w += max(1.6, 0.52 * (nn or 3))
            elif base in ("shell", "fan", "clfan"): w += 0.45 * (nn or 5) + 0.6
            elif base in ("cl", "dec", "inc"): w += 0.42 * (nn or 3) + 0.6
            elif base == "V": w += 1.8
            elif base in ("pic", "picot"): w += 0.8
            elif base in ("puff", "bob", "pop", "bean", "Vpuff"): w += 1.1
            else: w += 1.0 * rep
        anchos.append(w)
    maxw = max(anchos)
    # cadena base
    cadenas(E, -0.3, -0.05, int(maxw / 0.62) + 2)
    y = 0.25
    for fila, w in zip(filas, anchos):
        x = (maxw - w) / 2
        alto = 0.9
        for t in fila.split():
            ww, hh = item(E, t, x, y)
            x += ww
            alto = max(alto, hh)
        y += alto * 0.86
    COL[0] = 0


def flor(E, petalos, col=0, capas=1, puntas=False):
    COL[0] = col
    E.hilo([(math.cos(TAU * k / 14) * 0.45, 0.04, math.sin(TAU * k / 14) * 0.45) for k in range(14)], (col + 1) % 7, cerrado=True)
    for c in range(capas):
        n = petalos
        r0 = 0.5 + c * 0.2
        largo = 2.0 - c * 0.5
        for i in range(n):
            th = TAU * i / n + c * (math.pi / n)
            dx, dz = math.cos(th), math.sin(th)
            tx, tz = -dz, dx
            pts = []
            for j in range(16):
                t = TAU * j / 16
                u = r0 + largo * (0.5 - 0.5 * math.cos(t)) if not puntas else r0 + largo * (0.5 - 0.5 * math.cos(t)) ** 1.0
                ancho = 0.62 * math.sin(t / 2) * (1.0 if not puntas else 0.6)
                s = 1 if t < math.pi else -1
                pts.append((dx * u + tx * ancho * s * abs(math.sin(t)) , 0.06 * (c + 1) + 0.05 * math.sin(t), dz * u + tz * ancho * s * abs(math.sin(t))))
            E.hilo(pts, col, cerrado=True, r=R * 1.15)
    COL[0] = 0


ESPECIALES = {
    "foundation_single_crochet": (["sc*9", "sc*9"], 0),
    "foundation_double_crochet": (["dc*9", "dc*9"], 0),
    "tapestry_crochet": (["sc*9", "sc*9", "sc*9", "sc*9"], 0),
    "crocodile_stitch": (["dc*3 shell5:dc dc*3", "shell5:dc dc shell5:dc"], 0),
    "solomon_knot": (["sc arc5 sc arc5 sc arc5 sc", "arc5 sc arc5 sc arc5 sc arc5", "sc arc5 sc arc5 sc arc5 sc"], 0),
    "broomstick_lace": (["sc arc5 sc arc5 sc arc5 sc", "sc arc5 sc arc5 sc arc5 sc"], 0),
    "corner_to_corner": (["dc*3 ch dc*3", "dc*3 ch dc*3 ch dc*3", "dc*3 ch dc*3"], 0),
    "triangle_edging": (["sc*8", "sc arc3 sc arc3 sc arc3 sc"], 0),
    "bullion_stitch": (["sc bob sc bob sc bob sc", "sc sc sc sc sc sc sc"], 0),
    "loop_stitch": (["sc bob sc bob sc bob sc", "sc sc sc sc sc sc sc"], 0),
}


def main():
    cfg = json.load(open(os.environ["CFG_PUNTOS"], encoding="utf8"))
    ids = list(cfg) if IDS == "todos" else IDS.split(",")
    os.makedirs(SALIDA, exist_ok=True)
    sc, cam = preparar_escena()
    tex = crear_texturas()
    materiales = {k: material_hilo(f"hilo{k}", v, tex) for k, v in COLORES.items()}
    for id_ in ids:
        t0 = time.time()
        E = Escena3D()
        try:
            c = cfg[id_]
            col = c.get("col", 0)
            if id_ in ESPECIALES:
                tejer_filas(E, ESPECIALES[id_][0], col)
            elif c.get("rows"):
                tejer_filas(E, c["rows"], col)
            elif "flower" in id_ and "square" not in id_:
                flor(E, {"four": 4, "five": 5, "six": 6, "eight": 8, "star": 7, "puff": 6, "layered": 6}.get(id_.split("_")[0], 6), col, capas=2 if "layered" in id_ else 1)
            elif "granny" in id_ or "square" in id_:
                COL[0] = col
                granny(E, 3)
            elif id_ in ("spiral_rounds",):
                COL[0] = col
                disco(E, 4)
            elif id_ == "crochet_cord":
                COL[0] = col
                hilera_cadenas(E, 14)
            else:
                tejer_filas(E, ["dc*8", "dc*8", "dc*8"], col)
            renderizar(E, id_, sc, cam, materiales)
            print("PUNTO_OK", id_, round(time.time() - t0, 1))
        except Exception as e:
            import traceback
            traceback.print_exc()
            print("PUNTO_ERROR", id_, e)


main()
