import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import Lenis from 'lenis'
import { ArrowDown, ArrowUpRight, Menu, Pause, Play, X } from 'lucide-react'
import * as THREE from 'three'
import './styles.css'

const photoData = [
  ['01.JPG','First Light','Lower Approach'],['02.JPG','Weather Window','Lower Approach'],['DSCN0382.JPG','Green Passage','Forest Line'],['DSCN0510.JPG','Quiet Water','Forest Line'],
  ['DSCN9234.JPG','Distant Teeth','Upper Valley'],['DSCN9581.JPG','Stone Current','Upper Valley'],['DSCN9612.JPG','Cold Geometry','Glacial Shelf'],['DSCN9614.JPG','Blue Silence','Glacial Shelf'],
  ['DSCN9622.JPG','Wind Carved','Western Face'],['DSCN9675 - Copy.JPG','Cloud Gate','Western Face'],['DSCN9693.JPG','Blue Traverse','East Valley'],['DSCN9707.JPG','Falling Weather','East Valley'],
  ['DSCN9803.JPG','Granite Hymn','The Wall'],['DSCN9816.JPG','White Distance','The Wall'],['DSCN9855.JPG','Granite Weather','The Wall'],['DSCN9924.JPG','Sub-Zero Light','Northern Ridge'],
  ['IMG_8778.JPG','Thin Air','Summit Route'],['IMG_8811.JPG','After the Treeline','4,620 M'],['IMG_8853.JPG','Summit Signal','8,848 M'],['IMG-20241020-WA0026.jpg','Return Path','South Ridge']
]
const photos = photoData.map(([file,title,place],index)=>({file,title,place,src:`./assets/photos/web/${file}`,full:`./assets/photos/${file}`,meta:`1/${250+index*35}s · f/${(5.6+(index%4)*.7).toFixed(1)} · ${35+(index%6)*15}mm`,story:`Frame ${String(index+1).padStart(2,'0')} of the ascent — a study of shifting weather, scale and the mountain’s changing light.`}))
const palettes=[{name:'Approach',bg:'#171511',fog:'#29251d',accent:'#e6a04b',ink:'#f0e7d5'},{name:'Valley',bg:'#071815',fog:'#17372e',accent:'#a9cc8b',ink:'#dcebdc'},{name:'Wall',bg:'#081117',fog:'#1b2d39',accent:'#72b7dc',ink:'#dce9ef'},{name:'Summit',bg:'#8db5c5',fog:'#dcecf0',accent:'#f7d992',ink:'#ffffff'}]

function PhotoPlane({ photo, index, onSelect, active }) {
  const texture = useTexture(photo.src)
  const mesh = useRef()
  const position = [(index%2?1:-1)*(3.1+(index%3)*.75),((index%5)-2)*.48,-48-index*21.5]
  const [hovered, setHovered] = useState(false)
  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, hovered ? 0 : (index % 2 ? -.12 : .12), .05)
    mesh.current.position.y += Math.sin(state.clock.elapsedTime * .45 + index) * .0008
  })
  const ratio = texture.image ? texture.image.width / texture.image.height : 1.5
  return (
    <group position={position}>
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

function CloudBank({ z, side=1, scale=1 }) {
  const group=useRef()
  const puffs=useMemo(()=>Array.from({length:9},(_,i)=>({x:(i%3)*1.5-1.5,y:Math.floor(i/3)*.7-1,r:1.2+(i%4)*.28})),[])
  useFrame(({clock})=>{if(group.current)group.current.position.x=side*6+Math.sin(clock.elapsedTime*.18+z)*2.5})
  return <group ref={group} position={[side*6,0,z]} scale={scale}>{puffs.map((q,i)=><mesh key={i} position={[q.x,q.y,(i%3)*-.22]}><sphereGeometry args={[q.r,16,10]}/><meshBasicMaterial color="#d8e8e9" transparent opacity={.08+(i%3)*.025} depthWrite={false}/></mesh>)}</group>
}

function Scene({ progress, onSelect, active, palette }) {
  const fogParticles = useMemo(() => {
    const pts = []
    for (let i=0;i<150;i++) pts.push((Math.random()-.5)*24,(Math.random()-.5)*14,-Math.random()*500)
    return new Float32Array(pts)
  }, [])
  useFrame(({ camera, scene }) => {
    const target = -progress.current * 470
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, target, .075)
    camera.position.x = Math.sin(progress.current * Math.PI * 3) * .9
    camera.lookAt(0,0,camera.position.z - 30)
    scene.background.lerp(new THREE.Color(palette.bg),.035)
  })
  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.fog, 12, 75]} />
      <ambientLight intensity={1.4} />
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[fogParticles,3]} /></bufferGeometry>
        <pointsMaterial color={palette.ink} size={.065} transparent opacity={.36} sizeAttenuation />
      </points>
      {photos.map((photo, index) => <PhotoPlane key={photo.file} photo={photo} index={index} onSelect={onSelect} active={active} />)}
      {[-82,-170,-255,-338,-420].map((z,i)=><CloudBank key={z} z={z} side={i%2?1:-1} scale={1+(i%3)*.22}/>)}
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
  const [archive, setArchive] = useState(false)

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
  const region=Math.min(3,Math.floor(progress*4.01))
  const palette=palettes[region]
  const phase=palette.name
  const jump = (p) => { setMenu(false); window.scrollTo({ top: (document.documentElement.scrollHeight-innerHeight)*p, behavior:'smooth' }) }

  return (
    <main className={`region-${region}`} style={{'--accent':palette.accent,'--ice':palette.ink}}>
      <div className="canvas-wrap" aria-hidden="true">
        <Canvas camera={{ position:[0,0,8], fov:58 }} dpr={[1,1.7]}>
          <Suspense fallback={null}><Scene progress={progressRef} onSelect={setSelected} active={selected} palette={palette} /></Suspense>
        </Canvas>
      </div>
      <div className="aurora"/><div className="grain"/><div className="region-chip"><i/><span>{phase}</span><b>{region===0?'EARTH & EMBER':region===1?'MOSS & MIST':region===2?'STONE & ICE':'AIR & LIGHT'}</b></div>
      <header className="hud top">
        <button className="wordmark" onClick={() => jump(0)}>MT. KURADE <span>°27.98 N</span></button>
        <div className="controls"><button onClick={()=>setArchive(true)} aria-label="View all photographs"><span>ALL 20 FRAMES</span></button>
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
        <div className="chapter"><span>CHAPTER 02</span><h2>The valley<br/><em>holds light.</em></h2><p>All twenty mountain studies are suspended through the ascent. Select any passing frame to enter it.</p></div>
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
        <img src={selected.full} alt={selected.title} />
        <article><span>{selected.place}</span><h3>{selected.title}</h3><p>{selected.story}</p><footer><b>{selected.meta}</b><a href={selected.full} target="_blank">FULL RESOLUTION <ArrowUpRight/></a></footer></article>
      </div>}
      {archive && <div className="archive"><header><span>THE COMPLETE ASCENT</span><h2>20 frames.<br/><em>One mountain.</em></h2><button onClick={()=>setArchive(false)}><X/></button></header><div className="archive-grid">{photos.map((q,i)=><button key={q.file} onClick={()=>{setArchive(false);setSelected(q)}}><img src={q.src} alt={q.title}/><span>{String(i+1).padStart(2,'0')} · {q.place}</span><b>{q.title}</b></button>)}</div></div>}
      {menu && <nav className="menu">
        <button onClick={() => setMenu(false)}><X/></button>
        {[['01','Approach',0],['02','Valley',.26],['03','Wall',.58],['04','Summit',1]].map(([n,label,p])=><a key={n} onClick={()=>jump(p)}><span>{n}</span>{label}</a>)}
      </nav>}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
