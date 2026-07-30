import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import Lenis from 'lenis'
import { ArrowDown, ArrowUpRight, Menu, Pause, Play, X } from 'lucide-react'
import * as THREE from 'three'
import './styles.css'

const photos = [
  { src: './assets/photos/DSCN9924.JPG', title: 'Sub-Zero Light', place: 'Northern Ridge', meta: '1/640s · f/8 · 85mm', story: 'The final cold front opens a narrow seam of light across the upper ridge.' },
  { src: './assets/photos/DSCN9855.JPG', title: 'Granite Weather', place: 'The Wall', meta: '1/320s · f/7.1 · 105mm', story: 'Wind presses cloud against the face until rock and weather become one surface.' },
  { src: './assets/photos/IMG_8811.JPG', title: 'After the Treeline', place: '4,620 M', meta: '1/800s · f/5.6 · 70mm', story: 'Above the last trees, scale dissolves. Only light, stone and distance remain.' },
  { src: './assets/photos/DSCN9693.JPG', title: 'Blue Traverse', place: 'East Valley', meta: '1/500s · f/6.3 · 50mm', story: 'A quiet line through the valley before the mountain disappears into blue hour.' },
  { src: './assets/photos/IMG_8853.JPG', title: 'Summit Signal', place: '8,848 M', meta: '1/1000s · f/9 · 120mm', story: 'The atmosphere thins and the horizon arrives without edges.' }
]

function PhotoPlane({ photo, index, onSelect, active }) {
  const texture = useTexture(photo.src)
  const mesh = useRef()
  const positions = [[-5,1,-75],[4,-1,-145],[-3.6,-.4,-215],[4.8,1,-292],[-2.5,.2,-390]]
  const [hovered, setHovered] = useState(false)
  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, hovered ? 0 : (index % 2 ? -.12 : .12), .05)
    mesh.current.position.y += Math.sin(state.clock.elapsedTime * .45 + index) * .0008
  })
  const ratio = texture.image ? texture.image.width / texture.image.height : 1.5
  return (
    <group position={positions[index]}>
      <mesh ref={mesh} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={() => onSelect(photo)}>
        <planeGeometry args={[Math.min(9, 6.4 * ratio), 6.4]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent opacity={active && active !== photo ? .16 : 1} />
      </mesh>
      <mesh position={[0,-3.5,.05]}>
        <planeGeometry args={[2.2,.03]} />
        <meshBasicMaterial color={hovered ? '#f1a94e' : '#d7e3e7'} />
      </mesh>
    </group>
  )
}

function Scene({ progress, onSelect, active }) {
  const fogParticles = useMemo(() => {
    const pts = []
    for (let i=0;i<150;i++) pts.push((Math.random()-.5)*24,(Math.random()-.5)*14,-Math.random()*500)
    return new Float32Array(pts)
  }, [])
  useFrame(({ camera }) => {
    const target = -progress.current * 470
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, target, .075)
    camera.position.x = Math.sin(progress.current * Math.PI * 3) * .9
    camera.lookAt(0,0,camera.position.z - 30)
  })
  return (
    <>
      <fog attach="fog" args={['#071014', 12, 75]} />
      <ambientLight intensity={1.4} />
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[fogParticles,3]} /></bufferGeometry>
        <pointsMaterial color="#d9e7e8" size={.065} transparent opacity={.36} sizeAttenuation />
      </points>
      {photos.map((photo, index) => <PhotoPlane key={photo.src} photo={photo} index={index} onSelect={onSelect} active={active} />)}
      {[-250,-315,-365].map((z,i) => (
        <mesh key={z} position={[i%2 ? -8 : 8,0,z]} rotation={[0,i%2 ? .8 : -.8,0]}>
          <boxGeometry args={[6,18,1]} />
          <meshStandardMaterial color={i===1 ? '#1d292b' : '#111a1d'} roughness={1} />
        </mesh>
      ))}
    </>
  )
}

function App() {
  const progressRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState(null)
  const [audio, setAudio] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.35, smoothWheel: true, touchMultiplier: 1.15 })
    const tick = (time) => lenis.raf(time)
    let frame
    const raf = (t) => { tick(t); frame = requestAnimationFrame(raf) }
    frame = requestAnimationFrame(raf)
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      const p = max ? scrollY / max : 0
      progressRef.current = p
      setProgress(p)
    }
    addEventListener('scroll', update, { passive: true }); update()
    if (selected) lenis.stop(); else lenis.start()
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update); lenis.destroy() }
  }, [selected])

  const elevation = Math.round(progress * 8848)
  const phase = progress < .2 ? 'Approach' : progress < .52 ? 'Valley' : progress < .82 ? 'Wall' : 'Summit'
  const jump = (p) => { setMenu(false); window.scrollTo({ top: (document.documentElement.scrollHeight-innerHeight)*p, behavior:'smooth' }) }

  return (
    <main>
      <div className="canvas-wrap" aria-hidden="true">
        <Canvas camera={{ position:[0,0,8], fov:58 }} dpr={[1,1.7]}>
          <Suspense fallback={null}><Scene progress={progressRef} onSelect={setSelected} active={selected} /></Suspense>
        </Canvas>
      </div>
      <div className="grain" />
      <header className="hud top">
        <button className="wordmark" onClick={() => jump(0)}>MT. KURADE <span>°27.98 N</span></button>
        <div className="controls">
          <button onClick={() => setAudio(!audio)} aria-label="Toggle ambient audio">{audio ? <Pause/> : <Play/>}<span>{audio ? 'AMBIENCE ON' : 'AMBIENCE OFF'}</span></button>
          <button onClick={() => setMenu(!menu)} aria-label="Open navigation"><Menu/><span>INDEX</span></button>
        </div>
      </header>
      <div className="hud bottom">
        <div className="elevation"><span>ELEVATION</span><strong>{elevation.toLocaleString()}<small>M</small></strong></div>
        <div className="depth"><span>{phase} / {String(Math.min(4,Math.floor(progress*4)+1)).padStart(2,'0')}</span><div><i style={{height:`${Math.max(2,progress*100)}%`}} /></div><b>{Math.round(progress*100)}%</b></div>
      </div>

      <section className="hero">
        <p className="kicker">A PHOTOGRAPHIC ASCENT<br/>THROUGH THE HIMALAYAN QUIET</p>
        <div className="hero-title"><span>MT.</span><h1>KURADE</h1></div>
        <p className="instruction"><ArrowDown/> SCROLL TO ASCEND</p>
      </section>
      <section className="stage valley">
        <div className="chapter"><span>CHAPTER 02</span><h2>The valley<br/><em>holds light.</em></h2><p>Selected mountain studies, suspended between weather and memory. Select a frame to enter it.</p></div>
        <button className="pin pin-one" onClick={() => setSelected(photos[0])}><b>01</b><span>SUB-ZERO LIGHT<br/><small>NORTHERN RIDGE</small></span></button>
        <button className="pin pin-two" onClick={() => setSelected(photos[1])}><b>02</b><span>GRANITE WEATHER<br/><small>THE WALL</small></span></button>
      </section>
      <section className="stage wall">
        <div className="telemetry left-data"><span>LAT</span><b>27° 59′ 17″ N</b><span>WIND</span><b>W / 31 KMH</b></div>
        <div className="chapter right"><span>CHAPTER 03</span><h2>The wall<br/><em>rises.</em></h2><p>Close studies of altitude: compression, grain and the architecture of stone.</p></div>
        <div className="telemetry right-data"><span>PRESSURE</span><b>541 HPA</b><span>FOCAL</span><b>105 MM</b></div>
      </section>
      <section className="stage summit">
        <div className="summit-inner"><span>CHAPTER 04 · 8,848 M</span><h2>Above,<br/><em>only horizon.</em></h2><p>Fine-art prints, commissions and stories from the next ascent.</p>
          <a href="mailto:hello@mtkurade.photo">BEGIN AN INQUIRY <ArrowUpRight/></a>
          <div className="social"><a href="#">INSTAGRAM</a><a href="#">PRINT ARCHIVE</a><a href="mailto:hello@mtkurade.photo">EMAIL</a></div>
        </div>
      </section>

      {selected && <div className="lightbox" role="dialog" aria-modal="true">
        <button className="close" onClick={() => setSelected(null)} aria-label="Close photograph"><X/></button>
        <img src={selected.src} alt={selected.title} />
        <article><span>{selected.place}</span><h3>{selected.title}</h3><p>{selected.story}</p><footer><b>{selected.meta}</b><a href={selected.src} target="_blank">FULL RESOLUTION <ArrowUpRight/></a></footer></article>
      </div>}
      {menu && <nav className="menu">
        <button onClick={() => setMenu(false)}><X/></button>
        {[['01','Approach',0],['02','Valley',.26],['03','Wall',.58],['04','Summit',1]].map(([n,label,p])=><a key={n} onClick={()=>jump(p)}><span>{n}</span>{label}</a>)}
      </nav>}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
