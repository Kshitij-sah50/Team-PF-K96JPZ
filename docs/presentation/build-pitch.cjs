const fs = require('node:fs');
const path = require('node:path');
const PptxGenJS = require(process.env.PPTXGENJS_PATH || 'pptxgenjs');
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = 'Tsukuyomi Watch — Project Explanation & Pitch';
pptx.author = 'Team PF-K96JPZ';
pptx.subject = 'PS-002 · eight-slide project submission';
pptx.company = 'PECathon 2026';
pptx.lang = 'en-IN';
pptx.theme = { headFontFace:'Georgia', bodyFontFace:'Aptos', lang:'en-IN' };
const C={bg:'0C1024',panel:'161D36',edge:'2D3651',text:'F5EEE5',muted:'B5BED5',gold:'EFBD73',red:'C94B55',green:'81CAB0'};
let page=0;
function text(s,t,x,y,w,h,size=18,color=C.text,extra={}){s.addText(t,{x,y,w,h,fontFace:'Aptos',fontSize:size,color,margin:0,valign:'mid',...extra});}
function box(s,x,y,w,h,color=C.panel){s.addShape(pptx.ShapeType.rect,{x,y,w,h,fill:{color},line:{color,width:0}});}
function line(s,x,y,w,h,color=C.gold,width=1,extra={}){s.addShape(pptx.ShapeType.line,{x,y,w,h,line:{color,width,...extra}});}
function slide(label,title,sub){const s=pptx.addSlide();page++;s.background={color:C.bg};box(s,0,0,.13,7.5,C.red);text(s,label.toUpperCase(),.6,.35,12,.25,10,C.gold,{charSpacing:2});text(s,title,.6,.92,12.1,.7,31,C.text,{fontFace:'Georgia'});if(sub)text(s,sub,.62,1.77,12,.5,15,C.muted);line(s,.55,6.98,12.23,0,C.edge);text(s,'TEAM PF-K96JPZ  /  PS-002  /  PECATHON 2026',.6,7.13,11,.15,9,C.muted,{charSpacing:1});text(s,`${page} / 8`,12,7.09,.75,.24,10,C.gold,{align:'right'});return s;}
function image(s,file,x,y,w,h){const p=path.join(__dirname,'assets',file),b=fs.readFileSync(p),iw=b.readUInt32BE(16),ih=b.readUInt32BE(20),k=Math.min(w/iw,h/ih);s.addImage({path:p,x:x+(w-iw*k)/2,y:y+(h-ih*k)/2,w:iw*k,h:ih*k});}
function card(s,x,y,w,h,tag,title,body){box(s,x,y,w,h);box(s,x,y,.045,h,C.gold);text(s,tag,x+.2,y+.22,w-.4,.28,11,C.gold,{charSpacing:1});text(s,title,x+.2,y+.76,w-.4,.78,24,C.text,{fontFace:'Georgia'});text(s,body,x+.2,y+1.75,w-.4,h-1.95,18,C.muted,{valign:'top'});}
function bullets(s,items,x,y,w,size=19,gap=.83){items.forEach((t,i)=>{text(s,'•',x,y+i*gap,.18,.4,size,C.gold);text(s,t,x+.28,y+i*gap,w-.28,.66,size,C.text,{valign:'top'});});}

// 1 — positioning
{
 const s=slide('The Samurai’s Celestial Guide','Tsukuyomi Watch','A Japanese-inspired guide from observing plans to astronomical image inspection.');
 text(s,'Choose your place.\nFind your moment.\nExplore the faint light.',.68,2.5,8,2.1,36,C.text,{fontFace:'Georgia'});
 text(s,'Nighttime weather • cosmic events • local AI restoration',.7,5.08,8.4,.58,20,C.muted);
 s.addShape(pptx.ShapeType.ellipse,{x:9.77,y:2.55,w:2.1,h:2.1,fill:{color:C.gold},line:{color:C.gold}});
 s.addShape(pptx.ShapeType.ellipse,{x:10.23,y:2.3,w:2.1,h:2.1,fill:{color:C.bg},line:{color:C.bg}});
 line(s,9.14,5.2,3.2,0,C.red,5);line(s,9.38,5.48,2.72,0,C.gold,2);line(s,9.67,5.2,0,.95,C.red,5);line(s,11.81,5.2,0,.95,C.red,5);
 text(s,'LIVE  tsukuyomi-watch.vercel.app',.7,6.25,8,.35,18,C.gold,{hyperlink:{url:'https://tsukuyomi-watch.vercel.app'}});
 s.addNotes('20 seconds. We built Tsukuyomi Watch for PS-002. Our goal is to connect the decisions an observer makes: where to go, when to look and how to inspect a noisy image. The Japanese-inspired theme gives the journey a coherent identity. Team PF-K96JPZ. Live app: https://tsukuyomi-watch.vercel.app. Repository: https://github.com/PECathon-2026/Team-PF-K96JPZ. This is a working prototype, with explicit scientific and operational limits.');
}
// 2 — pain and audience
{
 const s=slide('The problem','A sky full of possibilities. A fragmented workflow.','Students and hobby observers must combine several tools before they can begin.');
 card(s,.65,2.5,3.86,3.75,'WHERE TO GO','Conditions change','Cloud cover, humidity and visibility vary across places and observing hours.');
 card(s,4.73,2.5,3.86,3.75,'WHEN TO LOOK','Events are scattered','Moon phases, eclipses, meteor windows, launches and ISS predictions need different sources.');
 card(s,8.81,2.5,3.86,3.75,'WHAT TO TRUST','Images need inspection','Noise and blur obscure faint sources. Cleanup needs conservative edits and a clear comparison.');
 text(s,'Designed for astronomy clubs, curious students and hobby astrophotographers.',.7,6.46,12,.28,16,C.gold);
 s.addNotes('30 seconds. Explain the shared user problem rather than reciting APIs. A student planning an observing night has to assemble location, weather and event information, then understand the resulting images. Our intended users are clubs, students and hobbyists; we are not claiming measured adoption or completed user research. PS-002 asks for four core modules, and we join them into a single workflow.');
}
// 3 — observing plan
{
 const s=slide('The solution • plan the night','The Watchtower + The Celestial Scroll','Choose a place and a moment through a scroll-style map and lunar calendar.');
 image(s,'watchtower.png',.65,2.42,7,4.18);
 bullets(s,['Search worldwide cities; explore nearby curated observing spots.','Compare nighttime cloud cover, humidity, visibility and a weather score.','Browse lunar phases, launches, eclipses and meteor windows.','Open event details, view ISS predictions and prepare reminders.'],7.98,2.53,4.65,18,.9);
 s.addNotes('40 seconds. Watchtower is the location finder. Worldwide city suggestions are separate from the current six Indian observing destinations. A selected city becomes a search origin; not every city has a curated spot nearby. Weather is the next future nighttime forecast, not a live sensor. Night Honor Score uses cloud/humidity/visibility only, excluding light pollution and moonlight. Celestial Scroll uses a Japanese Kyureki month view with leap months and Gregorian labels. Eclipses are global maxima, meteors are approximate windows, launches can change, and ISS predictions require fresh elements. Reminders include local toasts, calendar export and persistent browser-push infrastructure, with scheduler and permission prerequisites. Screenshot is actual production UI captured 30 October 2026 IST.');
}
// 4 — restoration and visualization
{
 const s=slide('The solution • inspect the light','Spirit Lens + Dojo visualization','Local AI cleanup, a before/after slider, zoom and object-candidate overlays.');
 image(s,'lens.png',.65,2.42,7.35,4.2);
 bullets(s,['Pretrained DnCNN runs in a browser worker.','Gentle bounded edits; optional conventional deblur.','Inspect source size, brightness and tentative morphology.','Download the restored preview and analysis report.'],8.28,2.55,4.35,18,.87);
 s.addNotes('40 seconds. Users can upload PNG/JPEG/WebP. A bounded RGB preview of at most 768px is processed locally with hash-verified DnCNN ONNX WASM. Detected source regions and conservative blend limits reduce change. Optional Richardson–Lucy deblur is conventional and assumes a Gaussian PSF. The Dojo visualization is inside Spirit Lens: slider, zoom/pan, overlays and exports. The displayed screenshot uses an explicitly synthetic fixture, not a real telescope photograph or independent scientific benchmark. Galaxy labels are tentative; brightness is uncalibrated pixel data. SSIM/PSNR compare output with noisy input, not clean truth. We do not claim guaranteed faint-feature preservation, full-resolution FITS/RAW or 16-bit science processing.');
}
// 5 — architecture
{
 const s=slide('How it works','A typed backend. A private local image pipeline.','Next.js / React • Express / tRPC • Zod • Drizzle / PostgreSQL • ONNX WASM');
 const node=(x,y,w,h,title,body,color=C.gold)=>{box(s,x,y,w,h);text(s,title,x+.2,y+.18,w-.4,.48,21,color,{bold:true});text(s,body,x+.2,y+.85,w-.4,h-1,17,C.muted,{valign:'top'});};
 node(.65,2.5,3.67,1.75,'Web interface','Map, calendar, feature pages\nTyped requests + React Query');
 node(4.82,2.5,3.67,1.75,'API + domain services','Validated requests, provider\nadapters, caches and alert jobs');
 node(8.99,2.5,3.67,1.75,'PostgreSQL / Neon','Destinations, forecasts,\nevents, feeds and push jobs');
 line(s,4.32,3.36,.43,0,C.gold,1.6,{endArrowType:'triangle'});line(s,8.49,3.36,.43,0,C.gold,1.6,{endArrowType:'triangle'});
 node(.65,4.85,5.88,1.62,'Local image worker','Validate → DnCNN → bounded blend → inspect',C.green);
 node(6.76,4.85,5.9,1.62,'Independent data sources','Open-Meteo, USNO, CelesTrak, NASA, launches',C.green);
 s.addNotes('40 seconds. Trace the boundary, not just framework names. UI calls the typed tRPC API through the same web origin. Zod validates incoming values; services own provider calls and business rules; Drizzle accesses Neon. Vercel hosts the frontend and fixed-host city/SkyView routes; Render hosts Express. City suggestions do not depend on the destination database. Local user-selected image pixels stay in the browser worker. Model assets are verified before inference; credentials remain server-side. Alerts use persisted anonymous-device jobs and a separate periodic scheduler. Some account/Honor schema is foundation work; current Honor journal remains device-local.');
}
// 6 — distinction
{
 const s=slide('Why this project stands out','An observing journey with its own identity','The innovation is the connected experience and inspectable processing.');
 card(s,.65,2.5,3.86,3.75,'MORE WAYS TO EXPLORE','Archive + signals','Import NASA archival survey images. Screen light-curve and spectral CSVs for follow-up candidates.');
 card(s,4.73,2.5,3.86,3.75,'PRACTICE AND RETURN','Honor journal','Log observations, earn 25 points per event and unlock badges. Keep an exportable device-local record.');
 card(s,8.81,2.5,3.86,3.75,'JAPANESE-INSPIRED','Four visual motifs','Ink Wash, Torii, Sakura and Katana. Light/dark modes, moon cues, translated labels and navigation notes.');
 text(s,'Established scientific methods, combined with transparent sources and a distinctive interface.',.7,6.46,12,.28,16,C.gold);
 s.addNotes('35 seconds. NASA SkyView is on-demand archival retrieval, not a live telescope stream. CSV signals use robust median/MAD screening, not confirmed discoveries. Honor is self-reported and local, not a verified leaderboard. Themes are four motif palettes with independent light/dark mode, Japanese meanings, hover/focus navigation explanations and motion controls. Our contribution is integration, privacy-conscious local inspection and the cultural interaction design; we did not invent DnCNN, SGP4 or the astronomy algorithms.');
}
// 7 — evidence and feasibility
{
 const s=slide('Evidence and feasibility','Built, deployed and tested against edge cases','A live prototype with repeatable checks and a practical club-pilot path.');
 const stats=[['31 / 31','Automated cases passing'],['9','Test files'],['2','Production builds passing']];
 stats.forEach((v,i)=>{const x=.65+i*4.08;box(s,x,2.5,3.86,1.37);text(s,v[0],x+.22,2.69,3.42,.58,32,C.gold,{fontFace:'Georgia'});text(s,v[1],x+.22,3.35,3.42,.28,15,C.muted);});
 bullets(s,['Boundary cases: missing forecasts, lunar leap months, invalid orbital data and unsafe push endpoints.','Image safeguards, malformed CSVs, duplicate observations and global city-query behavior are tested.','Live on Vercel + Render + Neon; local inference avoids a separate GPU inference server.'],.82,4.33,11.7,19,.66);
 text(s,'Next validation: broader E2E, physical push receipt, astronomy benchmarks and real user outcomes.',.8,6.49,11.8,.28,15,C.gold);
 s.addNotes('35 seconds. Updated suite: 31 test cases across nine files, zero failures. Three city-geocoding cases were added to the historical 28-case baseline. See test-results-current.txt; this count is not a measured coverage percentage. Frontend Next.js and backend tsup builds pass. The live app has demonstrated map/calendar and synthetic AI flows. Existing database ownership integration is separate historical evidence and not included in 31. Missing evidence includes CI, broader E2E, physical closed-app push receipt, load/accessibility review and labelled astronomy benchmarks. No measured adoption or accuracy benefits are claimed. Free hosting can sleep and providers can be unavailable.');
}
// 8 — pitch / close
{
 const s=slide('The opportunity','Make the first observing night easier to plan.','A connected guide for curiosity, observation and careful image exploration.');
 text(s,'Start with a club.\nValidate with real nights.\nGrow the observing map.',.7,2.55,7.5,2.22,35,C.text,{fontFace:'Georgia'});
 box(s,8.58,2.55,4.08,3.35);text(s,'NEXT MILESTONES',8.82,2.82,3.6,.3,12,C.gold,{charSpacing:1});bullets(s,['More curated destinations','Validated source preservation','Reliable scheduled alerts','Authenticated cross-device sync'],8.83,3.47,3.5,16,.48);
 text(s,'Try the working demo',.72,5.38,7.5,.43,22,C.gold,{bold:true});text(s,'tsukuyomi-watch.vercel.app',.72,5.99,8,.4,22,C.text,{hyperlink:{url:'https://tsukuyomi-watch.vercel.app'}});
 text(s,'github.com/PECathon-2026/Team-PF-K96JPZ',.72,6.57,10,.22,12,C.muted,{hyperlink:{url:'https://github.com/PECathon-2026/Team-PF-K96JPZ'}});
 s.addNotes('20 seconds. Close on the user outcome. We want to help clubs and students plan a first observing night and inspect the light they capture. The next step is a club pilot: measure planning effort, observing success and trust in image inspection, then expand destinations. We need astronomy benchmarks and dependable scheduling before stronger claims. Invite the panel to try the live app. Do not imply that future authentication/sync, a paid scheduler or a larger catalogue already exists. Total talk track is about 4 minutes 20 seconds; allow the remaining time for a short live interaction or questions.');
}
pptx.writeFile({fileName:path.join(__dirname,'Tsukuyomi-Watch-8-Slide-Pitch.pptx')});
