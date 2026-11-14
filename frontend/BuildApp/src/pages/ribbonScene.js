import * as THREE from 'three';
import { gsap } from 'gsap';

// One folded strip with raised ridges. The crease geometry catches the light.
function makeRibbon() {
  const positions = [], indices = [];
  const segments = 432;
  for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2;
    const crease = i % 2 === 0 ? 0.022 : -0.022;
    for (const side of [-0.42, 0.42]) {
      const r = 1 + side * Math.cos(1.5 * angle) - crease * Math.sin(1.5 * angle);
      positions.push(r*Math.cos(angle), r*Math.sin(angle), side*Math.sin(1.5*angle) + crease*Math.cos(1.5*angle));
    }
    if (i < segments) {
      const n = 2*i;
      indices.push(n,n+1,n+2,n+1,n+3,n+2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function mountRibbon(host) {
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,0.1,20);
  camera.position.z = 5.4;
  const material = new THREE.MeshStandardMaterial({ side:THREE.DoubleSide,metalness:0.22,roughness:0.47,flatShading:true });
  const ribbon = new THREE.Mesh(makeRibbon(), material);
  scene.add(ribbon,new THREE.HemisphereLight(0xfff9db,0x344c47,1.8));
  const key = new THREE.DirectionalLight(0xfff4d2,3);
  key.position.set(-2,3,4);
  scene.add(key);
  const render = () => renderer.render(scene,camera);
  function recolor(){
    const theme = document.documentElement.dataset.theme;
    material.color.set(theme === 'Clay' ? '#f1b579' : theme === 'Night' ? '#9ddddd' : '#b7d777');
    render();
  }
  function resize(){
    const {clientWidth:w,clientHeight:h} = host;
    if (!w || !h) return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    render();
  }
  ribbon.rotation.set(-0.68,-0.4,-0.32);
  resize(); recolor();
  host.append(renderer.domElement);
  host.dataset.ready='true';
  const moveTo = (x,y) => gsap.to(ribbon.rotation,{x,y,duration:0.65,overwrite:'auto',ease:'power2.out',onUpdate:render});
  const bounds = host.closest('figure');
  function move(e){
    if(e.pointerType !== 'mouse') return;
    const rect=bounds.getBoundingClientRect();
    moveTo(-0.68+(e.clientY-rect.top-rect.height/2)/rect.height*.55,-0.4+(e.clientX-rect.left-rect.width/2)/rect.width*.9);
  }
  function reset(){moveTo(-0.68,-0.4)}
  gsap.fromTo(ribbon.rotation,{z:-0.85},{z:-0.32,duration:1.1,ease:'power3.out',onUpdate:render});
  bounds.addEventListener('pointermove',move);
  bounds.addEventListener('pointerleave',reset);
  const resizer=new ResizeObserver(resize);
  resizer.observe(host);
  const observer=new MutationObserver(recolor);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  function contextLost(){delete host.dataset.ready}
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return ()=>{
    delete host.dataset.ready;
    bounds.removeEventListener('pointermove',move);
    bounds.removeEventListener('pointerleave',reset);
    renderer.domElement.removeEventListener('webglcontextlost',contextLost);
    gsap.killTweensOf(ribbon.rotation);
    resizer.disconnect();observer.disconnect();
    ribbon.geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();
  };
}
