import {useEffect,useRef,useState,type RefObject} from 'react';
import envelopes from './federica-envelope.json';
const portrait='/los-archivos-f/images/federica-presentadora-v1.png';

// Deform a continuous mesh instead of cutting the hand or replacing the face.
// The original transparent portrait remains the fallback on unsupported devices.
const vertex=`
attribute vec2 aPosition;
varying vec2 vUv;
uniform float uMouth;
uniform float uGesture;
void main(){
 vec2 p=aPosition*vec2(1086.,1448.);
 vUv=aPosition;
 float mouth=exp(-pow((p.x-584.)/43.,4.)-pow((p.y-530.)/26.,4.));
 p.y+=uMouth*7.*clamp((p.y-527.)/5.,-1.,1.)*mouth;
 float hand=smoothstep(730.,850.,p.x)*smoothstep(730.,825.,p.y)*(1.-smoothstep(1100.,1200.,p.y));
 vec2 pivot=vec2(792.,1100.);
 vec2 d=p-pivot;
 float angle=uGesture*hand;
 p=pivot+vec2(cos(angle)*d.x-sin(angle)*d.y,sin(angle)*d.x+cos(angle)*d.y);
 gl_Position=vec4(p.x/1086.*2.-1.,1.-p.y/1448.*2.,0.,1.);
}`;
const fragment=`precision mediump float; varying vec2 vUv; uniform sampler2D uImage;
void main(){gl_FragColor=texture2D(uImage,vUv);}`;

export default function FedericaPortrait({audioRef,kind}:{audioRef:RefObject<HTMLAudioElement|null>;kind:'intro'|'success'}) {
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const canvas=canvasRef.current, audio=audioRef.current;
  if(!canvas||!audio)return;
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true});
  if(!gl)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,disposed=false,loaded=false,amplitude=0,lastTime=0,startedAt=0;
  const shaders:WebGLShader[]=[];
  function compile(type:number,source:string){
   const shader=gl!.createShader(type);if(!shader)return null;
   shaders.push(shader);gl!.shaderSource(shader,source);gl!.compileShader(shader);
   return gl!.getShaderParameter(shader,gl!.COMPILE_STATUS)?shader:null;
  }
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  const program=gl.createProgram();
  if(!vs||!fs||!program){shaders.forEach(s=>gl.deleteShader(s));return;}
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);return;}
  gl.useProgram(program);
  const points:number[]=[];
  const columns=144,rows=192;
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
   const l=x/columns,r=(x+1)/columns,t=y/rows,b=(y+1)/rows;
   points.push(l,t,r,t,l,b,l,b,r,t,r,b);
  }
  const buffer=gl.createBuffer(),texture=gl.createTexture();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const mouth=gl.getUniformLocation(program,'uMouth'),gesture=gl.getUniformLocation(program,'uGesture');
  const envelope=envelopes[kind];
  function draw(m:number,g:number){
   if(!loaded||disposed)return;
   gl!.viewport(0,0,canvas!.width,canvas!.height);gl!.clearColor(0,0,0,0);gl!.clear(gl!.COLOR_BUFFER_BIT);
   gl!.uniform1f(mouth,m);gl!.uniform1f(gesture,g);gl!.drawArrays(gl!.TRIANGLES,0,points.length/2);
   canvas!.dataset.mouth=m.toFixed(3);canvas!.dataset.gesture=g.toFixed(4);
  }
  function tick(now:number){
   if(disposed||!loaded||motion.matches||audio!.paused||audio!.ended)return;
   const dt=Math.min(.1,(now-lastTime)/1000||.016);lastTime=now;
   const target=envelope.values[Math.floor(audio!.currentTime*envelope.fps)]||0;
   amplitude+=(target-amplitude)*(1-Math.exp(-dt*25));
   const fade=Math.min(1,(now-startedAt)/400);
   const g=fade*(Math.sin(audio!.currentTime*1.5)*.024+Math.sin(audio!.currentTime*.7)*.012);
   draw(amplitude,g);frame=requestAnimationFrame(tick);
  }
  function stop(){cancelAnimationFrame(frame);amplitude=0;draw(0,0);}
  function start(){stop();if(loaded&&!motion.matches&&!audio!.paused&&!audio!.ended){lastTime=performance.now();startedAt=lastTime;frame=requestAnimationFrame(tick);}}
  function changeMotion(){if(motion.matches)stop();else start();}
  const img=new Image();img.onload=()=>{
   if(disposed)return;
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
   loaded=true;draw(0,0);setReady(true);start();
  };img.src=portrait;
  const pauseEvents=['pause','ended','waiting','emptied','seeking','error'];
  pauseEvents.forEach(event=>audio.addEventListener(event,stop));
  audio.addEventListener('playing',start);audio.addEventListener('seeked',start);
  motion.addEventListener('change',changeMotion);
  const lost=(event:Event)=>{event.preventDefault();stop();setReady(false);};
  canvas.addEventListener('webglcontextlost',lost);
  return ()=>{
   disposed=true;cancelAnimationFrame(frame);img.onload=null;
   pauseEvents.forEach(event=>audio.removeEventListener(event,stop));
   audio.removeEventListener('playing',start);audio.removeEventListener('seeked',start);
   motion.removeEventListener('change',changeMotion);canvas.removeEventListener('webglcontextlost',lost);
   gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));
  };
 },[audioRef,kind]);
 return <figure className="federica-animated-portrait" role="img" aria-label="Federica presenta la investigación y acompaña su mensaje con un gesto de la mano">
  <img src={portrait} alt="" style={{visibility:ready?'hidden':'visible'}}/>
  <canvas ref={canvasRef} width={720} height={960} aria-hidden="true" style={{visibility:ready?'visible':'hidden'}}/>
 </figure>;
}
