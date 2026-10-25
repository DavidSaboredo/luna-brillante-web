# Genera el maniquí de Luna Brillante con MPFB (MakeHuman, licencia CC0) dentro de Blender.
# Uso:  blender -b --python crear_maniqui.py -- <carpeta de salida>
# Salida: maniqui.glb (1,66 m, brazos caídos) y perfil.json (silueta del torso, piernas y ejes de los brazos).
import bpy, sys, os, math, json
from mathutils import Vector
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

SALIDA = sys.argv[-1]
ALTO = 1.66
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

macro = TargetService.get_default_macro_info_dict()
macro.update({"gender": 0.0, "age": 0.5, "muscle": 0.4, "weight": 0.42, "height": 0.5, "proportions": 0.55, "cupsize": 0.5, "firmness": 0.55})
base = HumanService.create_human(mask_helpers=True, detailed_helpers=False, extra_vertex_groups=False, feet_on_ground=True, scale=0.1, macro_detail_dict=macro)


def activar(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o


activar(base)
if base.data.shape_keys:
    bpy.ops.object.shape_key_remove(all=True, apply_mix=True)

# El rig se usa solo para crear los grupos de vértices por hueso (pesos) y ubicar las articulaciones.
rig = HumanService.add_builtin_rig(base, "default_no_toes", import_weights=True)
bpy.ops.object.mode_set(mode="OBJECT")
grupos = {g.index: g.name for g in base.vertex_groups}
ARM = ("upperarm", "lowerarm", "wrist", "finger", "metacarpal")


def centro_grupo(nombre, umbral=0.5):
    idx = [i for i, n in grupos.items() if n == nombre]
    pts = [v.co for v in base.data.vertices if any(g.group in idx and g.weight > umbral for g in v.groups)]
    c = Vector((0, 0, 0))
    for p in pts:
        c += p
    return c / max(1, len(pts))


# --- bajar los brazos: rotación rígida alrededor del hombro, mezclada con el peso del brazo ---
ANG_SEPARACION = 12  # grados que queda separado del cuerpo
for lado in ("L", "R"):
    # las posiciones de los huesos no están en el mismo espacio que la malla: se usan los centros de los grupos
    S = centro_grupo(f"upperarm01.{lado}")
    W = centro_grupo(f"lowerarm02.{lado}")
    sx = 1.0 if (W.x - S.x) >= 0 else -1.0
    u0, v0 = (W.x - S.x) * sx, W.z - S.z
    fi_rest = math.atan2(v0, u0)
    fi_obj = math.atan2(-math.cos(math.radians(ANG_SEPARACION)), math.sin(math.radians(ANG_SEPARACION)))
    d = fi_obj - fi_rest
    c, s = math.cos(d), math.sin(d)
    idx = [i for i, n in grupos.items() if n.endswith("." + lado) and n.startswith(ARM)]
    for v in base.data.vertices:
        w = sum(g.weight for g in v.groups if g.group in idx)
        if w <= 0.001:
            continue
        w = min(1.0, w)
        u, vv = (v.co.x - S.x) * sx, v.co.z - S.z
        u2, v2 = c * u - s * vv, s * u + c * vv
        nx, nz = S.x + sx * u2, S.z + v2
        v.co.x += (nx - v.co.x) * w
        v.co.z += (nz - v.co.z) * w
    print("BRAZO", lado, "rest", round(math.degrees(fi_rest), 1), "giro", round(math.degrees(d), 1))
base.data.update()

# --- hornear: aplicar la máscara que oculta los helpers y quitar el rig ---
activar(base)
for m in list(base.modifiers):
    if m.type == "MASK":
        bpy.ops.object.modifier_apply(modifier=m.name)
bpy.data.objects.remove(rig, do_unlink=True)
print("VERTICES", len(base.data.vertices))

k = ALTO / base.dimensions.z
base.scale = (k, k, k)
activar(base)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

for _ in range(len(base.data.materials)):
    base.data.materials.pop(index=0)
mat = bpy.data.materials.new("maniqui")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.9, 0.86, 0.89, 1.0)
bsdf.inputs["Roughness"].default_value = 0.6
base.data.materials.append(mat)
bpy.ops.object.shade_smooth()

# --- perfil del cuerpo (coordenadas de glTF: y arriba, frente en +z) ---
IGNORAR = ("body", "HelperGeometry", "JointCubes", "Mid", "Left", "Right")


def dominante(v):
    gs = [x for x in v.groups if grupos.get(x.group, "") not in IGNORAR]
    return grupos.get(max(gs, key=lambda x: x.weight).group, "") if gs else ""


gl = lambda co: (co.x, co.z, -co.y)
info = [(gl(v.co), dominante(v)) for v in base.data.vertices]
TORSO = ("spine", "breast", "pelvis", "clavicle", "neck", "root", "levator")


def perfil(filtro, paso=0.01, y0=0.0, y1=1.7):
    out, y = [], y0
    while y <= y1:
        pts = [p for p, g in info if abs(p[1] - y) < paso * 0.75 and filtro(g)]
        if len(pts) >= 4:
            xs = [p[0] for p in pts]
            zs = [p[2] for p in pts]
            out.append({"y": round(y, 3), "x0": round(min(xs), 4), "x1": round(max(xs), 4), "z0": round(min(zs), 4), "z1": round(max(zs), 4)})
        y += paso
    return out


torso = perfil(lambda g: g.startswith(TORSO), y0=0.7, y1=1.6)
pierna = perfil(lambda g: g.endswith(".L") and g.startswith(("upperleg", "lowerleg", "foot")), y0=0.0, y1=0.95)


def cen(pts):
    n = len(pts)
    return tuple(sum(p[i] for p in pts) / n for i in range(3))


brazos = {}
for lado in ("L", "R"):
    sup = [p for p, g in info if g.startswith("upperarm") and g.endswith("." + lado)]
    inf = [p for p, g in info if g.startswith(("lowerarm", "wrist")) and g.endswith("." + lado)]
    c1, c2 = cen(sup), cen(inf)
    d = tuple(c2[i] - c1[i] for i in range(3))
    L = math.sqrt(sum(x * x for x in d))
    d = tuple(x / L for x in d)
    proj = lambda p, c: sum((p[i] - c[i]) * d[i] for i in range(3))
    dist = lambda p, c: math.sqrt(max(0, sum((p[i] - c[i]) ** 2 for i in range(3)) - proj(p, c) ** 2))
    t_ini, t_fin = min(proj(p, c1) for p in sup), max(proj(p, c2) for p in inf)
    pt = lambda c, t: [round(c[i] + d[i] * t, 4) for i in range(3)]
    brazos[lado] = {
        "hombro": pt(c1, t_ini), "codo": [round(x, 4) for x in c2], "muneca": pt(c2, t_fin), "dir": [round(x, 4) for x in d],
        "radio_sup": round(sum(dist(p, c1) for p in sup) / len(sup), 4), "radio_inf": round(sum(dist(p, c2) for p in inf) / len(inf), 4),
    }
# --- secciones reales del cuerpo: rayos desde el eje hacia afuera (los brazos quedan más lejos, no interfieren) ---
N_THETA = 48
mw = base.matrix_world


def radios(cx_gl, y_gl, cz_gl, n=N_THETA):
    """Distancia desde (cx, y, cz) hasta la piel en n direcciones (theta=0 al frente, crece hacia +x)."""
    o = Vector((cx_gl, -cz_gl, y_gl))  # a coordenadas de Blender
    out = []
    for i in range(n):
        th = 2 * math.pi * i / n
        d = Vector((math.sin(th), -math.cos(th), 0.0))
        hit, loc, nor, idx = base.ray_cast(o, d, distance=0.6)
        out.append(None if not hit else (loc - o).length)
    return out


def seccion(y_gl, c0):
    cx, cz = c0
    for _ in range(3):
        r = radios(cx, y_gl, cz, 16)
        pts = []
        for i, ri in enumerate(r):
            if ri is None:
                continue
            th = 2 * math.pi * i / 16
            pts.append((cx + ri * math.sin(th), cz + ri * math.cos(th)))
        if len(pts) < 12:
            return None
        cx = sum(p[0] for p in pts) / len(pts)
        cz = sum(p[1] for p in pts) / len(pts)
    r = radios(cx, y_gl, cz)
    if any(v is None for v in r):
        return None
    return (cx, cz, r)


cuerpo_filas = []
centro = (0.0, 0.03)
y = 0.86
while y <= 1.50:
    sec = seccion(y, centro)
    if sec:
        centro = (sec[0], sec[1])
        cuerpo_filas.append({"y": round(y, 3), "cx": round(sec[0], 4), "cz": round(sec[1], 4), "r": [round(v, 4) for v in sec[2]]})
    y += 0.01
print("FILAS_CUERPO", len(cuerpo_filas))

pierna_filas = []
for y in [0.30 + 0.02 * i for i in range(0, 28)]:
    # el centro de la pierna izquierda: promedio de los vértices del grupo en esa altura
    pts = [p for p, g in info if g.endswith(".L") and g.startswith(("upperleg", "lowerleg")) and abs(p[1] - y) < 0.015]
    if len(pts) < 4:
        continue
    c0 = (sum(p[0] for p in pts) / len(pts), sum(p[2] for p in pts) / len(pts))
    sec = seccion(y, c0)
    if sec:
        pierna_filas.append({"y": round(y, 3), "cx": round(sec[0], 4), "cz": round(sec[1], 4), "r": [round(v, 4) for v in sec[2]]})
print("FILAS_PIERNA", len(pierna_filas))

json.dump({"alto": ALTO, "ntheta": N_THETA, "cuerpo": cuerpo_filas, "pierna": pierna_filas, "brazos": brazos}, open(os.path.join(SALIDA, "perfil.json"), "w"))
print("PERFIL", len(torso), len(pierna), brazos)

# --- body liso ajustado (cubre desde las caderas hasta sobre el busto) ---
import bmesh
bm = bmesh.new()
bm.from_mesh(base.data)
dom = {v.index: dominante(base.data.vertices[v.index]) for v in bm.verts}
CUB = ("spine", "breast", "pelvis", "root", "upperleg")
def en_zona(v):
    return 0.80 <= v.co.z <= 1.30 and dom[v.index].startswith(CUB)
borrar = [f for f in bm.faces if not all(en_zona(v) for v in f.verts)]
bmesh.ops.delete(bm, geom=borrar, context="FACES")
for v in bm.verts:
    v.co += v.normal * 0.0035
body = bpy.data.meshes.new("body_base")
bm.to_mesh(body)
bm.free()
obj_body = bpy.data.objects.new("body_base", body)
bpy.context.scene.collection.objects.link(obj_body)
mb = bpy.data.materials.new("body_base")
mb.use_nodes = True
bb = mb.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.93, 0.9, 0.93, 1.0)
bb.inputs["Roughness"].default_value = 0.7
body.materials.append(mb)
for p in body.polygons:
    p.use_smooth = True
bpy.ops.object.select_all(action="DESELECT")
base.select_set(True)
obj_body.select_set(True)
bpy.context.view_layer.objects.active = base
bpy.ops.export_scene.gltf(filepath=os.path.join(SALIDA, "maniqui.glb"), export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT", export_image_format="NONE")
print("LISTO")
