import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const root = new URL("./assets/", import.meta.url);
await mkdir(root, {recursive:true});
const profile=await mkdtemp(path.join(tmpdir(),"tsukuyomi-judging-"));
const browser=spawn(process.env.EDGE_PATH||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-debugging-port=9332",`--user-data-dir=${profile}`,"about:blank"],{windowsHide:true,stdio:"ignore"});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));let socket;
try{
 let targets;for(let i=0;i<60;i++){try{targets=await(await fetch("http://localhost:9332/json")).json();if(targets.length)break;}catch{}await pause(200);}
 socket=new WebSocket(targets.find(target=>target.type==="page").webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const callback=pending.get(message.id);pending.delete(message.id);message.error?callback.reject(new Error(JSON.stringify(message.error))):callback.resolve(message.result);}};
 function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});}
 async function evaluate(expression){const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
 async function waitFor(expression,label,count=150){for(let i=0;i<count;i++){if(await evaluate(`Boolean(${expression})`))return;await pause(500);}throw new Error(label+": "+await evaluate("document.body.innerText.slice(-1800)"));}
 async function capture(selector,name){const clip=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const r=el.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);const screenshot=await send("Page.captureScreenshot",{format:"png",clip,captureBeyondViewport:true});await writeFile(new URL(name,root),Buffer.from(screenshot.data,"base64"));console.log("Captured",name);}
 await send("Page.enable");await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:"https://tsukuyomi-watch.vercel.app"});
 await waitFor(`document.querySelectorAll('.leaflet-marker-icon').length===6 && document.querySelector('.watch-theme-toggle:not(:disabled)')`,"Live Watchtower");
 await capture(".watch-hero","hero.png");await capture(".watch-explorer","watchtower.png");
 await waitFor(`document.querySelector('.scroll-month h3')?.textContent.includes('Kyūreki')`,"Lunar calendar");
 await capture(".scroll-calendar","calendar.png");
 await send("Page.navigate",{url:"https://tsukuyomi-watch.vercel.app/spirit-lens"});await waitFor(`!!document.querySelector('.watch-theme-toggle:not(:disabled)')`,"Lens hydration");
 await evaluate(`document.querySelector('.lens-demo').click()`);await waitFor(`!!document.querySelector('.lens-restore:not(:disabled)')`,"Demo input");
 await evaluate(`document.querySelector('.lens-restore').click()`);await waitFor(`!!document.querySelector('.lens-measurements') || !!document.querySelector('.lens-error')`,"Restoration",360);
 if(await evaluate(`!!document.querySelector('.lens-error')`))throw new Error(await evaluate(`document.querySelector('.lens-error').textContent`));
 await capture(".lens-comparison","lens.png");
 const evidence={capturedAt:new Date().toISOString(),url:"https://tsukuyomi-watch.vercel.app",source:"Explicitly synthetic 444×330 demo",status:await evaluate(`document.querySelector('.lens-status').textContent`),metrics:await evaluate(`document.querySelector('.lens-measurements').innerText`)};
 await writeFile(new URL("live-evidence.json",root),JSON.stringify(evidence,null,2));console.log(evidence.status);
 await send("Page.navigate",{url:"https://tsukuyomi-watch.vercel.app/analysis"});await waitFor(`!!document.querySelector('.watch-theme-toggle:not(:disabled)')`,"Analysis hydration");
 await evaluate(`Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Load synthetic')).click()`);await evaluate(`document.querySelector('form').requestSubmit()`);await waitFor(`!!document.querySelector('.signal-chart')`,"Signal chart");
 await capture(".signal-chart","signals.png");
 console.log("Live presentation screenshots and evidence complete.");
}finally{socket?.close();browser.kill();}
