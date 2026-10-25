"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Color, PMREMGenerator, Vector2, type PerspectiveCamera } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { construirMuestra, crearTexturasHilo, type ParamsMuestra } from "@/lib/hilo3d";

export interface OpcionesVista {
  colorA: string;
  colorB: string;
  bicolor: boolean;
  relieve: boolean;
  intensidadRelieve: number;
  alambre: boolean;
  girar: boolean;
}

interface Props {
  muestra: ParamsMuestra;
  vista: OpcionesVista;
}

/** Iluminación basada en imagen: un cuarto de estudio generado por código (sin descargas). */
function Entorno() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.38;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Aleja la cámara hasta que la muestra entre completa. */
function Encuadre({ ancho, alto }: { ancho: number; alto: number }) {
  const { camera, size, controls } = useThree();
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    const aspecto = size.width / size.height;
    const t = Math.tan((cam.fov * Math.PI) / 360);
    const d = Math.max((alto / 2 + 0.6) / t, (ancho / 2 + 0.6) / (t * aspecto)) * 1.08;
    cam.position.set(d * 0.07, d * 0.2, d);
    cam.lookAt(0, 0, 0);
    const c = controls as unknown as { target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
    if (c) {
      c.target.set(0, 0, 0);
      c.update();
    }
  }, [camera, size, controls, ancho, alto]);
  return null;
}

function Hilo({ muestra, vista }: Props) {
  const m = useMemo(() => construirMuestra(muestra), [muestra]);
  useEffect(
    () => () => {
      m.a.dispose();
      m.b.dispose();
    },
    [m],
  );

  const colorB = vista.bicolor ? vista.colorB : vista.colorA;
  const texA = useMemo(() => crearTexturasHilo(vista.colorA), [vista.colorA]);
  const texB = useMemo(() => crearTexturasHilo(colorB), [colorB]);
  const escala = useMemo(() => new Vector2(vista.intensidadRelieve, vista.intensidadRelieve), [vista.intensidadRelieve]);

  const material = (tex: typeof texA, color: string) => (
    <meshPhysicalMaterial
      map={tex.map}
      normalMap={vista.relieve ? tex.normalMap : null}
      normalScale={escala}
      roughnessMap={tex.roughnessMap}
      roughness={1}
      metalness={0}
      sheen={0.6}
      sheenRoughness={0.6}
      sheenColor={new Color(color).lerp(new Color("#ffffff"), 0.3)}
      envMapIntensity={1}
      wireframe={vista.alambre}
    />
  );

  return (
    <group position={[-m.ancho / 2, 0.3, 0]}>
      <mesh geometry={m.a} castShadow receiveShadow>
        {material(texA, vista.colorA)}
      </mesh>
      <mesh geometry={m.b} castShadow receiveShadow>
        {material(texB, colorB)}
      </mesh>
    </group>
  );
}

export default function Puntadas3D(props: Props) {
  const m = props.muestra;
  const alto = m.tipo === "cadena" ? 1.2 : m.filas * 1.1 + 0.8;
  const ancho = m.tipo === "cadena" ? m.columnas * 1.24 : m.columnas * 1.0 + 0.8;
  return (
    <Canvas shadows camera={{ fov: 34, near: 0.05, far: 80, position: [0.4, 1.6, 6.2] }} dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
      <color attach="background" args={["#f6f1f7"]} />
      <Entorno />
      <Encuadre ancho={ancho} alto={alto} />
      <hemisphereLight args={["#ffffff", "#e5d9f0", 0.25]} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />
      <spotLight position={[-5, 3, -4]} intensity={14} angle={0.6} penumbra={0.8} color="#ffe3ef" />
      <group position={[0, -alto / 2 + 0.7, 0]}>
        <Hilo {...props} />
      </group>
      <ContactShadows position={[0, -alto / 2 - 0.4, 0]} opacity={0.3} scale={16} blur={2.6} far={5} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1.2} maxDistance={16} autoRotate={props.vista.girar} autoRotateSpeed={1.2} target={[0, 0, 0]} />
    </Canvas>
  );
}
