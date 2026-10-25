"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { BufferAttribute, DoubleSide, Mesh, Vector2, type BufferGeometry, type Texture } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { construirModelo, type Parte } from "@/lib/modelo3d";
import { crearCuerpo, deformarManiqui } from "@/lib/cuerpo3d";
import { medidasTalle } from "@/lib/medidas";
import { crearTextura } from "@/lib/texturas3d";
import { infoMaterial, type EleccionZona, type Opciones, type Prenda } from "@/lib/taller";

export type VistaCamara = "frente" | "espalda" | "lado" | "tres_cuartos";

interface Props {
  prenda: Prenda;
  opciones: Opciones;
  zonas: Record<string, EleccionZona>;
  zonaActiva?: string;
  onElegirZona?: (id: string) => void;
  conManiqui: boolean;
  /** Archivo de la tela simulada en Blender; si no hay, se usa la forma aproximada */
  rutaSimulada?: string | null;
  girar: boolean;
  vista: VistaCamara;
}

const NORMAL_SCALE = new Vector2(2, 2);

const ANGULOS: Record<VistaCamara, number> = { frente: 0, tres_cuartos: Math.PI / 4, lado: Math.PI / 2, espalda: Math.PI };

function Camara({ objetivo, distancia, vista }: { objetivo: [number, number, number]; distancia: number; vista: VistaCamara }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    const a = ANGULOS[vista];
    camera.position.set(Math.sin(a) * distancia, objetivo[1] + distancia * 0.12, Math.cos(a) * distancia);
    camera.lookAt(...objetivo);
    const c = controls as unknown as OrbitControlsImpl | null;
    if (c) {
      c.target.set(...objetivo);
      c.update();
    }
  }, [camera, controls, objetivo, distancia, vista]);
  return null;
}

useGLTF.preload("/modelos/maniqui.glb");

/** Zonas que se dibujan con la forma aproximada aun cuando el resto de la prenda es simulada. */
const ZONAS_APROXIMADAS = new Set(["cuello", "lazo", "tirantes", "breteles"]);

/** El maniquí generado con Blender (MPFB), llevado al talle elegido. */
function Maniqui({ talle }: { talle: number }) {
  const { scene } = useGLTF("/modelos/maniqui.glb");
  const mallas = useMemo(() => {
    const cu = crearCuerpo(medidasTalle(talle));
    const out: { geo: BufferGeometry; nombre: string }[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const geo = m.geometry.clone();
      const p = geo.attributes.position;
      const arr = new Float32Array(p.array);
      deformarManiqui(arr, cu);
      geo.setAttribute("position", new BufferAttribute(arr, 3));
      geo.computeVertexNormals();
      out.push({ geo, nombre: m.name });
    });
    return out;
  }, [scene, talle]);
  useEffect(() => () => mallas.forEach((m) => m.geo.dispose()), [mallas]);
  return (
    <>
      {mallas.map((m, i) => (
        <mesh key={i} geometry={m.geo} castShadow receiveShadow>
          <meshStandardMaterial color={/body/i.test(m.nombre) ? "#f1ecf3" : "#e2d6e0"} roughness={0.62} metalness={0} />
        </mesh>
      ))}
    </>
  );
}

/** Zonas que no necesitan doble capa (hilos, borlas, asas…). */
const SIN_GROSOR = new Set(["flecos", "pompon", "asa", "lazo", "tiras"]);

/** Le da grosor a una malla de una sola capa: agrega una cara interior, apenas hundida, con las normales invertidas. */
function conGrosor(geo: BufferGeometry, grosor = 0.0035): BufferGeometry {
  const g = geo.clone();
  if (!g.attributes.normal) g.computeVertexNormals();
  const interior = g.clone();
  const p = interior.attributes.position;
  const n = interior.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, p.getX(i) - n.getX(i) * grosor, p.getY(i) - n.getY(i) * grosor, p.getZ(i) - n.getZ(i) * grosor);
    n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  }
  const idx = interior.index;
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, a);
    }
  }
  const unido = mergeGeometries([g, interior], false);
  g.dispose();
  interior.dispose();
  return unido ?? geo;
}

const COLOR_BASE = "#a894dc"; // violeta lana: lo que se ve mientras una zona no tiene punto elegido

function Pieza({
  parte,
  eleccion,
  activa,
  onElegir,
}: {
  parte: Parte;
  eleccion?: EleccionZona;
  activa: boolean;
  onElegir?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const info = eleccion ? infoMaterial(eleccion.material) : undefined;
  const textura = eleccion && info ? info.textura : "bajo";
  const color = eleccion && info ? eleccion.color : COLOR_BASE;

  const texturas = useMemo(() => {
    const t = crearTextura(textura, color);
    const clonar = (tx: Texture) => {
      const c = tx.clone();
      c.repeat.set(Math.max(0.5, parte.rep[0] / t.tamCm), Math.max(0.5, parte.rep[1] / t.tamCm));
      c.needsUpdate = true;
      return c;
    };
    return { map: clonar(t.map), normal: clonar(t.normal) };
  }, [textura, color, parte.rep]);

  const geo = useMemo(() => (parte.zona && SIN_GROSOR.has(parte.zona) ? parte.geo : conGrosor(parte.geo)), [parte.geo, parte.zona]);
  useEffect(
    () => () => {
      if (geo !== parte.geo) geo.dispose();
    },
    [geo, parte.geo],
  );
  useEffect(
    () => () => {
      texturas.map.dispose();
      texturas.normal.dispose();
    },
    [texturas],
  );

  const resaltado = activa ? 0.22 : hover && onElegir ? 0.1 : 0;
  return (
    <mesh
      geometry={geo}
      position={parte.pos}
      rotation={parte.rot}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onElegir?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        if (onElegir) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      {/* Lana: opaca, mate y con relieve real de puntadas */}
      <meshStandardMaterial
        map={texturas.map}
        normalMap={texturas.normal}
        normalScale={NORMAL_SCALE}
        roughness={0.95}
        metalness={0}
        side={DoubleSide}
        transparent={false}
        opacity={1}
        emissive="#8e7cc3"
        emissiveIntensity={resaltado}
      />
    </mesh>
  );
}

/** La prenda simulada en Blender: cada pieza del patrón es una malla con UV en cm. */
function GrupoSimulado({ ruta, zonas, zonaActiva, onElegirZona }: { ruta: string; zonas: Record<string, EleccionZona>; zonaActiva?: string; onElegirZona?: (id: string) => void }) {
  const { scene } = useGLTF(ruta);
  const partes = useMemo(() => {
    scene.updateMatrixWorld(true);
    const out: (Parte & { clave: string })[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh || !m.name.includes("|")) return;
      const geo = m.geometry.clone();
      geo.applyMatrix4(m.matrixWorld);
      // 1 unidad de UV = 100 cm del patrón
      out.push({ zona: m.name.split("|")[0], geo, rep: [100, 100], clave: m.name });
    });
    return out;
  }, [scene]);
  useEffect(() => () => partes.forEach((p) => p.geo.dispose()), [partes]);
  return (
    <>
      {partes.map((p) => (
        <Pieza key={p.clave} parte={p} eleccion={zonas[p.zona!]} activa={p.zona === zonaActiva} onElegir={onElegirZona ? () => onElegirZona(p.zona!) : undefined} />
      ))}
    </>
  );
}

function Escena({ prenda, opciones, zonas, zonaActiva, onElegirZona, conManiqui, girar, vista, rutaSimulada }: Props) {
  const modelo = useMemo(() => construirModelo(prenda, opciones), [prenda, opciones]);
  const controles = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    // libera la memoria de las geometrías anteriores
    return () => {
      for (const p of modelo.partes) p.geo.dispose();
    };
  }, [modelo]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#d8cdea", 0.35]} />
      {/* luz principal con sombras: la prenda las proyecta sobre sí misma y sobre el cuerpo */}
      <directionalLight
        position={[2.2, 3.6, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-1.3}
        shadow-camera-right={1.3}
        shadow-camera-top={2.1}
        shadow-camera-bottom={-0.2}
        shadow-bias={-0.0003}
        shadow-normalBias={0.012}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#ffe9f1" />
      <Camara objetivo={modelo.camara.objetivo} distancia={modelo.camara.distancia} vista={vista} />
      <group>
        {conManiqui && modelo.conManiqui && <Maniqui talle={opciones.talle} />}
        {rutaSimulada ? (
          <>
            <GrupoSimulado ruta={rutaSimulada} zonas={zonas} zonaActiva={zonaActiva} onElegirZona={onElegirZona} />
            {/* accesorios que no se simulan (cuello, lazo, breteles) */}
            {modelo.partes
              .filter((p) => p.zona && ZONAS_APROXIMADAS.has(p.zona))
              .map((p, i) => (
                <Pieza key={`aprox-${i}`} parte={p} eleccion={zonas[p.zona!]} activa={p.zona === zonaActiva} onElegir={onElegirZona ? () => onElegirZona(p.zona!) : undefined} />
              ))}
          </>
        ) : (
          modelo.partes.map((p, i) => (
          <Pieza
            key={`${prenda.id}-${i}`}
            parte={p}
            eleccion={p.zona ? zonas[p.zona] : undefined}
            activa={p.zona === zonaActiva}
            onElegir={p.zona && onElegirZona ? () => onElegirZona(p.zona!) : undefined}
          />
        ))
        )}
      </group>
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={4} blur={2.4} far={2.5} />
      <OrbitControls
        ref={controles}
        makeDefault
        enablePan={false}
        minDistance={0.5}
        maxDistance={5}
        autoRotate={girar}
        autoRotateSpeed={1.6}
        target={modelo.camara.objetivo}
      />
    </>
  );
}

export default function Prenda3D(props: Props) {
  return (
    <Canvas shadows="percentage" camera={{ fov: 32, near: 0.05, far: 30, position: [0, 1.2, 2.7] }} dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
      <color attach="background" args={["#fbf7f4"]} />
      <Suspense fallback={null}>
        <Escena {...props} />
      </Suspense>
    </Canvas>
  );
}
