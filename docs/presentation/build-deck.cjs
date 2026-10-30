/* Editable PowerPoint generator. Install pptxgenjs outside the app; see README.md. */
const path = require('node:path');
const fs = require('node:fs');
const PptxGenJS = require(process.env.PPTXGENJS_PATH || 'pptxgenjs');
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Team PF-K96JPZ';
pptx.subject = 'PS-002 hackathon demonstration and evidence-based readiness review';
pptx.title = 'Tsukuyomi Watch — The Samurai’s Celestial Guide';
pptx.company = 'PECathon 2026';
pptx.lang = 'en-IN';
pptx.theme = { headFontFace: 'Georgia', bodyFontFace: 'Aptos', lang: 'en-IN' };
const C = { bg:'0C1024', panel:'161D36', panel2:'212A46', ink:'F5EEE5', mute:'B5BED5', gold:'EFBD73', red:'C94B55', green:'81CAB0' };
const assets = path.join(__dirname,'assets');
const W=13.333333, H=7.5;
let page=0;
function rect(s,x,y,w,h,fill=C.panel,line=fill,r=0) { s.addShape(r?pptx.ShapeType.roundRect:pptx.ShapeType.rect,{x,y,w,h,rectRadius:r,fill:{color:fill},line:{color:line,width:0.6},radius:r}); }
function txt(s,text,x,y,w,h,size=18,color=C.ink,extra={}) { s.addText(text,{x,y,w,h,fontFace:'Aptos',fontSize:size,color,margin:0,breakLine:false,vertAlign:'mid',valign:'mid',...extra}); }
function line(s,x1,y1,x2,y2,color=C.gold,width=1,extra={}) { s.addShape(pptx.ShapeType.line,{x:x1,y:y1,w:x2-x1,h:y2-y1,line:{color,width,...extra}}); }
function base(kicker,title,sub='') { const s=pptx.addSlide();page++;s.background={color:C.bg};
 rect(s,0,0,.13,H,C.red);line(s,.55,6.98,12.78,6.98,C.panel2,1);
 txt(s,'TSUKUYOMI WATCH  /  PS-002',.58,7.12,9,.15,9,C.mute,{charSpacing:1.3});txt(s,String(page).padStart(2,'0'),12.12,7.09,.65,.2,10,C.gold,{align:'right'});
 txt(s,kicker.toUpperCase(),.6,.35,11,.25,10,C.gold,{charSpacing:2.2});
 txt(s,title,.6,.9,12.1,.64,30,C.ink,{fontFace:'Georgia',bold:false});
 if(sub)txt(s,sub,.62,1.66,12,.47,14,C.mute);
 return s;
}
function notes(s,text){ s.addNotes(text); }
function card(s,x,y,w,h,kicker,title,body,color=C.gold){rect(s,x,y,w,h);rect(s,x,y,.045,h,color);txt(s,kicker,x+.2,y+.2,w-.4,.27,11,color,{charSpacing:1.3});txt(s,title,x+.2,y+.65,w-.4,.65,22,C.ink,{fontFace:'Georgia'});txt(s,body,x+.2,y+1.48,w-.4,h-1.65,17,C.mute,{valign:'top',paraSpaceAfterPt:10});}
function bullets(s,items,x,y,w,size=18,gap=.64){items.forEach((v,i)=>{txt(s,'•',x,y+i*gap,.2,.44,size,C.gold);txt(s,v,x+.28,y+i*gap,w-.28,.5,size,C.ink,{valign:'top'});});}
function picture(s,file,x,y,w,h){const p=path.join(assets,file),bytes=fs.readFileSync(p);const iw=bytes.readUInt32BE(16),ih=bytes.readUInt32BE(20),scale=Math.min(w/iw,h/ih);s.addImage({path:p,x:x+(w-iw*scale)/2,y:y+(h-ih*scale)/2,w:iw*scale,h:ih*scale});}
function tag(s,text,x,y,w,color=C.gold){rect(s,x,y,w,.35,C.panel2);txt(s,text,x+.1,y+.04,w-.2,.25,11,color);}
function row(s,cols,y,widths,colors=[],height=.47){let x=.65;cols.forEach((v,i)=>{txt(s,v,x,y,widths[i]-.15,height,14,colors[i]||C.ink,{valign:'top'});x+=widths[i];});}

// 01 — opening
{
 const s=base('PECathon 2026 • Team PF-K96JPZ','Tsukuyomi Watch','The Samurai’s Celestial Guide');
 txt(s,'Plan the night.\nRead the sky.\nInspect the image.',.68,2.35,6.4,2.2,36,C.ink,{fontFace:'Georgia',breakLine:false});
 txt(s,'Weather + cosmic events + conservative local AI\nin one Japanese-inspired observing workflow.',.7,4.95,6.4,.82,19,C.mute);
 s.addShape(pptx.ShapeType.ellipse,{x:9.1,y:2.25,w:2.55,h:2.55,fill:{color:C.gold},line:{color:C.gold}});
 s.addShape(pptx.ShapeType.ellipse,{x:9.65,y:1.98,w:2.55,h:2.55,fill:{color:C.bg},line:{color:C.bg}});
 line(s,8.5,5.24,12.4,5.24,C.red,5);line(s,8.75,5.56,12.15,5.56,C.gold,2);line(s,9.1,5.25,9.1,6.2,C.red,5);line(s,11.8,5.25,11.8,6.2,C.red,5);
 txt(s,'tsukuyomi-watch.vercel.app',.7,6.25,7,.3,17,C.gold,{hyperlink:{url:'https://tsukuyomi-watch.vercel.app'}});
 tag(s,'LIVE DEMO + VERIFIED TEST EVIDENCE',8.35,6.35,4.05);
 notes(s,'Opening, 15 seconds. We built Tsukuyomi Watch for PS-002. A user should be able to choose a place and night, understand what is observable, then inspect a space image without pretending the AI knows missing details. Team PF-K96JPZ. Public URL: https://tsukuyomi-watch.vercel.app. Repo: https://github.com/PECathon-2026/Team-PF-K96JPZ. Readiness audit: 30 October 2026 IST, app source commit 8e07eb7. This deck distinguishes implemented behavior from estimates and deployment prerequisites.');
}
// 02 — problem
{
 const s=base('Problem understanding • 15 marks','A clear night is a decision problem','A beginner must combine fragmented information before an observing trip.');
 card(s,.65,2.35,3.86,3.65,'01 / WHERE','Will the sky be usable?','Clouds, humidity and visibility change by place and time. A map alone cannot rank an observing night.');
 card(s,4.73,2.35,3.86,3.65,'02 / WHEN','What can I observe?','Moon phases, launches, eclipses, meteor windows and visible ISS segments come from different sources.');
 card(s,8.81,2.35,3.86,3.65,'03 / WHAT','Can I trust the image?','Noise and blur hide faint structure. Cleanup must stay inspectable and avoid invented object identities.');
 txt(s,'Primary users: student astronomy clubs, first-time observers and hobby astrophotographers.',.68,6.35,12,.32,16,C.gold);
 notes(s,'20 seconds. Explain the problem as three connected decisions, not just a feature checklist. Users currently assemble weather, event schedules and image tools themselves. The culturally themed interface is the narrative layer; the functional goal is more informed planning and inspectable restoration. Do not claim measured user research or adoption: these are intended user groups. PS-002 also asks for a before/after visualization and bonus analysis, archive retrieval and gamification.');
}
// 03 — product
{
 const s=base('Solution walkthrough','One observing journey, four connected views','The core PS-002 modules are implemented; the interface also includes optional bonus tools.');
 const cells=[['WATCHTOWER','Choose a place','Search the scroll map.\nCompare nighttime forecasts.'],['CELESTIAL SCROLL','Choose a moment','Filter cosmic events.\nRead the lunar calendar.'],['SPIRIT LENS','Restore carefully','Run local AI denoising.\nInspect object candidates.'],['DOJO / VIEWER','Inspect and record','Compare, zoom and export.\nLog an observation.']];
 cells.forEach((v,i)=>{const x=.65+i*3.08;card(s,x,2.45,2.87,3.35,String(i+1).padStart(2,'0')+' / '+v[0],v[1],v[2]);if(i<3)txt(s,'→',x+2.87,3.65,.21,.35,18,C.gold);});
 tag(s,'BONUS: archival SkyView import • CSV signal screening • local Honor Points',.65,6.26,12.02);
 notes(s,'25 seconds. Walk the actual user flow. Watchtower and Scroll live on the main dashboard; event details stay inside the app. Spirit Lens contains the before/after Dojo visualization. /dojo is the separate device-local observation journal, not the name of the AI pipeline. /analysis contains light-curve and spectral CSV screening. The SkyView feature retrieves archival survey images on demand; it is not a live telescope feed.');
}
// 04 — innovation
{
 const s=base('Innovation • 15 marks','The contribution is the observing workflow','We combine established science and AI tools with explicit provenance and a distinctive interface.');
 card(s,.65,2.4,3.86,3.6,'CONNECTED PLANNING','Place → time → image','Weather ranking, lunar navigation, event details, alerts and inspection are available in one application.');
 card(s,4.73,2.4,3.86,3.6,'INSPECTABLE AI','Local and bounded','A browser worker runs DnCNN. Conservative edits, object overlays and downloadable measurements support review.');
 card(s,8.81,2.4,3.86,3.6,'CULTURAL INTERACTION','A celestial scroll','Ink Wash, Torii, Sakura and Katana palettes; light/dark mode; moon cues; English meanings for Japanese labels.');
 txt(s,'Originality claim: integration and experience. DnCNN, SGP4 and astronomical algorithms are established methods.',.68,6.32,12,.4,15,C.gold);
 notes(s,'20 seconds. Be precise about novelty. We did not invent DnCNN, SGP4, a new astronomical catalogue or the Japanese lunar calendar. Our innovation is an integrated observing workflow, local and auditable processing, and a Japanese-inspired interaction system. Four palettes and shared light/dark mode are implemented across feature pages, with translations and reduced-motion styles. Code: apps/web/providers/palette.tsx, components/japanese-text.tsx, shared theme artwork and CSS.');
}
// 05 — architecture
{
 const s=base('System design • 20 marks','Typed boundaries, separated responsibilities','Image pixels stay in the browser; planning data and alert jobs use the backend.');
 const box=(x,y,w,h,title,body,color=C.gold)=>{rect(s,x,y,w,h);txt(s,title,x+.18,y+.15,w-.36,.36,18,color,{bold:true});txt(s,body,x+.18,y+.65,w-.36,h-.72,14,C.mute,{valign:'top'});};
 box(.65,2.4,3.5,1.35,'Next.js / React UI','Map • calendar • event pages\nReact Query + typed tRPC client');
 box(4.72,2.4,3.62,1.35,'Express + tRPC API','Zod validation • domain services\nProvider adapters + bounded caches');
 box(8.92,2.4,3.75,1.35,'Drizzle → Neon PostgreSQL','Places • weather • event feeds\nDevice subscriptions + alert jobs');
 line(s,4.15,3.05,4.65,3.05,C.gold,1.4,{endArrowType:'triangle'});line(s,8.34,3.05,8.84,3.05,C.gold,1.4,{endArrowType:'triangle'});
 box(.65,4.38,3.5,1.65,'Browser worker / ONNX WASM','Validate image → DnCNN → bounded blend\nOptional deblur → metrics → overlays',C.green);
 box(4.72,4.38,3.62,1.65,'External provider adapters','Open-Meteo • USNO • Launch Library\nCelesTrak • NASA SkyView¹',C.green);
 box(8.92,4.38,3.75,1.65,'Push delivery pipeline','Minute scheduler → claimed DB jobs\nWeb Push → browser service worker',C.green);
 line(s,2.4,3.75,2.4,4.3,C.green,1.2,{endArrowType:'triangle'});line(s,6.53,3.75,6.53,4.3,C.green,1.2,{endArrowType:'triangle'});line(s,10.8,3.75,10.8,4.3,C.green,1.2,{endArrowType:'triangle'});
 txt(s,'¹ SkyView uses a fixed-host Next.js server route. Vercel frontend • Render API • Neon database.',.68,6.45,12,.28,13,C.mute);
 notes(s,'45 seconds. Follow one request: React Query calls the typed tRPC client through the web app’s same-origin API proxy, Express routes validate input with Zod, service functions own provider calls and business rules, and Drizzle accesses Neon PostgreSQL. Weather writes weather + score in a transaction; celestial feed membership supports caching and upserts by provider ID. Static type sharing reduces drift; runtime validation still handles untrusted inputs. NASA SkyView is a separate fixed-host server route in Next.js. Images selected from the user device are decoded and processed locally in an isolated worker using ONNX WASM, not sent to the API. Model assets are SHA-256 verified. VAPID private keys and database credentials are server-only. A configured recurring scheduler is necessary for push delivery. Files: apps/api/src/server.ts; packages/trpc/server/routes; packages/services; packages/database/models; apps/web/lib/spirit-lens/spirit-lens.worker.ts.');
}
// 06 — watchtower
{
 const s=base('Watchtower • live application screenshot','A scroll map backed by nighttime forecasts','Search a place or map area, select a marker and compare the next available nighttime conditions.');
 picture(s,'watchtower.png',.65,2.27,7.1,4.32);
 bullets(s,['Open-Meteo cloud cover, humidity and visibility.','Night Honor Score: transparent weather-only ranking.','Shrine, mountain, temple and observatory markers.','Six curated Indian destinations today.'],8.06,2.53,4.55,18,.91);
 notes(s,'25 seconds. This screenshot was captured from production on 30 October 2026 IST, not a design mockup. The catalogue contains six curated Indian destinations. Search and map-area lookup do not mean a global destination discovery database. Nearby selection uses Haversine distance; conditions are ranked by the weather score. The forecast chooses the next future provider-night hour, not a past or daytime estimate. It is forecast data, not a real-time sensor feed. Score normalizes weights 40 cloud, 20 visibility, 15 humidity; visibility caps at 20 km. It currently excludes light pollution and moonlight. Explain these limits before claiming the best possible astronomical site. Code: packages/services/watchtower/weather.ts and index.ts.');
}
// 07 — events
{
 const s=base('Celestial Scroll • live application screenshot','Time-aware events, with uncertainty visible','A Japanese Kyūreki month view includes lunar leap months and Gregorian dates.');
 picture(s,'calendar.png',.65,2.28,6.9,4.25);
 bullets(s,['Moon phases, launches, eclipses and meteor windows.','Visible ISS segments use fresh orbital elements.','Internal event details and calendar export.','Moonrise reminders and optional browser push.'],7.9,2.5,4.75,18,.94);
 notes(s,'25 seconds. Kyureki supports real 29/30-day Japanese lunisolar months and explicit leap months via himekuri; event filtering uses UTC dates. USNO phases retain UTC instants. Launch dates can change. Astronomy Engine eclipse events describe global maxima, not local visibility or contacts. Meteor events are approximate annual windows with ±1 day labels and a noon UTC placeholder, not a precision annual peak. ISS is a separate panel for the selected site: SGP4, fresh CelesTrak TLE, elevation at least 10 degrees, observer Sun below minus 6 degrees, fully sunlit segments, 20-second sampling over three days. Stale or malformed TLE does not generate fake passes. Push is implemented but needs credentials, HTTPS, permissions and a running minute scheduler.');
}
// 08 — restoration
{
 const s=base('Spirit Lens • AI restoration','Conservative cleanup with an audit trail','DnCNN denoises a preview locally; users retain control over every result.');
 const steps=[['VALIDATE','PNG / JPEG / WebP\n12 MB • 24 MP cap'],['NORMALIZE','RGB preview\nLongest edge ≤768px'],['RESTORE','Verified DnCNN\n256px tiled inference'],['CONSTRAIN','Bounded luminance\nProtect source regions'],['INSPECT','Compare + zoom\nPNG / JSON export']];
 steps.forEach((v,i)=>{const x=.65+i*2.44;rect(s,x,2.55,2.24,1.87);txt(s,v[0],x+.15,2.77,1.94,.3,12,C.gold,{charSpacing:1.1});txt(s,v[1],x+.15,3.33,1.94,.76,16,C.ink);if(i<4)txt(s,'→',x+2.24,3.21,.2,.4,16,C.gold);});
 rect(s,.65,4.85,5.87,1.73);txt(s,'OPTIONAL DEBLUR',.86,5.07,5.43,.25,12,C.green,{charSpacing:1.2});
 txt(s,'Six Richardson–Lucy iterations',.86,5.52,5.43,.4,21,C.ink,{fontFace:'Georgia'});
 txt(s,'User-selected Gaussian PSF; wrong settings can cause ringing.',.86,6.09,5.43,.3,13,C.mute);
 rect(s,6.75,4.85,5.9,1.73);txt(s,'SCIENTIFIC LIMIT',6.98,5.07,5.4,.25,12,C.red,{charSpacing:1.2});txt(s,'Bounded edits reduce risk. They cannot guarantee\nthat every faint feature remains unchanged.',6.98,5.63,5.35,.65,17,C.ink);
 notes(s,'35 seconds. The model is pretrained DnCNN sigma25, using luminance in a browser worker. Assets are hash-verified before inference. Tiles are 256 with a 17px halo. Gentle mode blends 25 percent with a max channel change of 6/255; Balanced uses 45 percent and 12/255. Detected source regions and color/alpha relationships are protected, with local extrema constraints. Optional deblur is conventional Richardson–Lucy, six iterations and an assumed Gaussian PSF 0.5–2px. Do not say no hallucination is mathematically guaranteed: the safeguards limit edits but faint source preservation needs a domain benchmark. Sixteen-bit PNG and FITS/RAW are not supported. The app restores bounded RGB previews, not full-resolution scientific data. Files: lib/spirit-lens/model.ts, image.ts, analysis.ts, deblur.ts and spirit-lens.worker.ts.');
}
// 09 — proof
{
 const s=base('Dojo visualization • actual browser result','Compare pixels, not promises','Synthetic demo fixture • 444 × 330 pixels • Gentle mode • one production browser run');
 picture(s,'lens.png',.65,2.28,7.7,4.25);
 const stats=[['15.8 s','This browser run'],['41','Object candidates'],['8.6 → 6.5','Estimated noise'],['6 / 255','Max channel edit']];
 stats.forEach((v,i)=>{const x=8.65+(i%2)*2.02,y=2.6+Math.floor(i/2)*1.48;txt(s,v[0],x,y,1.95,.58,27,C.gold,{fontFace:'Georgia'});txt(s,v[1],x,y+.67,1.95,.5,13,C.mute);});
 txt(s,'SSIM 0.975 compares output with noisy input. It does not prove clean-image accuracy.',8.65,5.85,3.9,.66,14,C.ink);
 notes(s,'25 seconds. Fresh production run captured 2026-10-29T23:39:26Z, which is 30 October IST. This source is explicitly synthetic, not a telescope photograph and not an independent science benchmark. Result: 15.8 seconds on this browser/device, 41 candidates, input similarity SSIM 0.975, PSNR 41.6 dB, estimated noise 8.6 to 6.5, max channel edit 6/255. The time is not a hardware-independent performance claim; SSIM and PSNR compare against the noisy input, not known clean ground truth. The interactive UI supports the slider, zoom, pan and candidate overlays. Objects are detected on the original preview. Galaxy labels are tentative morphology candidates; brightness is uncalibrated pixel data, not astronomical magnitude or catalogue identity. Evidence: assets/live-evidence.json.');
}
// 10 — tests
{
 const s=base('Test cases • 20 marks','28 automated tests pass across 8 files','Fresh audit run: 30 October 2026 IST • 28 passed • 0 failed • no coverage percentage claimed');
 row(s,['AREA','TESTS','EDGE CASE EVIDENCE'],2.42,[3.1,1.05,7.7],[C.gold,C.gold,C.gold]);
 const rows=[['Weather + distance','4','Score bounds; missing night data; date-line crossing'],['Moon + reminders','3','Polar null rise/set; UTC and observer timezone'],['Event providers / export','4','Leap February; source IDs; ICS injection / Unicode'],['Eclipses / lunar / ISS','5','Known eclipse; leap lunar month; invalid orbital data'],['Push security','2','SSRF endpoint rejection; invalid scheduler credentials'],['Lens analysis / deblur','6','RGB/alpha bounds; flat sky; image limits; blur fixture'],['Signals + Honor','4','Zero scatter; bad CSV; duplicate / future observations']];
 rows.forEach((v,i)=>{const y=2.97+i*.43;if(i%2===0)rect(s,.58,y-.035,12.15,.42,C.panel);row(s,v,y,[3.1,1.05,7.7],[],.34);});
 tag(s,'Production builds: Next.js frontend PASS  •  tsup API PASS',.65,6.35,12.02,C.green);
 notes(s,'35 seconds. Tests and architecture carry 40 marks, so show evidence, not just a screenshot of a green check. The transcript is docs/presentation/test-results.txt. Node’s test runner executes 28 tests from eight TypeScript files using tsx. The seven displayed areas combine the five Lens analysis tests and one deblur test. Tests include boundary values, malformed external data, dates and timezones, injection and push credential rejection, scientific fixtures and invalid observations. The fresh frontend optimized build and API tsup build also pass. Existing PostgreSQL device-ownership integration had been run earlier; it is separate and was not rerun in this audit. No measured line coverage or load-test claim. See the appendix and READINESS.md for the exact command and remaining test gaps.');
}
// 11 — feasibility
{
 const s=base('Impact and feasibility • 15 marks','A useful student-scale platform, live today','Deployed on Vercel + Render + Neon, with public APIs and browser-side inference.');
 card(s,.65,2.4,3.86,3.7,'USER VALUE','Fewer disconnected steps','Compare places, plan around events and inspect a restored image without switching between separate tools.');
 card(s,4.73,2.4,3.86,3.7,'PRACTICAL DELIVERY','A working public demo','Local AI avoids an inference server. Provider adapters, caching and bounded inputs keep the prototype feasible.');
 card(s,8.81,2.4,3.86,3.7,'VALIDATE NEXT','Measure real benefit','Pilot with an astronomy club. Measure planning time, successful observing trips and faint-source preservation.');
 txt(s,'No fabricated adoption or accuracy claims. Free hosting can sleep; third-party APIs can be unavailable.',.68,6.36,12,.35,15,C.gold);
 notes(s,'20 seconds. The live platform shows technical feasibility at prototype scale. Intended users are students, clubs and hobbyists. We have not measured improved observing success, scientific accuracy, retention, cost per user or load capacity. The browser model avoids a hosted GPU service, but execution time depends on hardware and image size. Current free demo hosting can sleep and external providers have quotas and outages; commercial production would require reliability and capacity planning. Geography is limited by the six-place catalogue. Validate with a club pilot and a labelled astronomy benchmark before broad claims. No need to quote current vendor pricing in the presentation.');
}
// 12 — rubric readiness
{
 const s=base('Readiness audit • 100-mark rubric','Ready for a controlled hackathon demonstration','The implementation is substantial; a maximum score or production-grade reliability is not established.');
 row(s,['CRITERION','MARKS','ASSESSMENT / PREPARATION'],2.38,[3.55,.95,7.6],[C.gold,C.gold,C.gold]);
 const rows=[['Innovation','15','Strong integration story; distinguish it from new research.'],['System design / code','20','Clear layers and typed contracts; rehearse a request trace.'],['Problem understanding','15','All four core modules; explain estimates and source limits.'],['Test cases','20','28 passing tests; CI, device push and broader E2E remain.'],['Impact / feasibility','15','Live prototype; club pilot and scale evidence remain.'],['Presentation','15','Editable deck, demo script and screenshot fallback ready.']];
 rows.forEach((v,i)=>{const y=2.97+i*.48;if(i%2===0)rect(s,.58,y-.035,12.15,.45,C.panel);row(s,v,y,[3.55,.95,7.6],[],.4);});
 txt(s,'Before judging: warm the API, rehearse the demo, keep local image/CSV inputs and explain push honestly.',.68,6.38,12,.35,15,C.gold);
 notes(s,'25 seconds. This is a candid internal readiness assessment, not a predicted judging score. All rubric categories have a concrete story, but code knowledge is demonstrated by the team answering questions and test marks depend on evidence beyond a count. The app is ready for a controlled demonstration with its known constraints. It is not certified for always-on production, confirmed astronomical classification or full-resolution science processing. The most material missing evidence is automated CI and broad E2E, a physical closed-app push receipt using a running production scheduler, a larger astronomy benchmark, and user impact validation.');
}
// 13 — demo
{
 const s=base('Presentation • 15 marks','A five-minute demo with a reliable fallback','Open the public URL before the pitch and keep the screenshot deck available.');
 const items=[['0:00–0:30','Problem + promise','Choose a place, a moment and a trustworthy image workflow.'],['0:30–1:20','Watchtower + Scroll','Search / select a spot, inspect conditions, open an event.'],['1:20–2:30','Spirit Lens','Use the labelled demo, restore, drag slider, zoom and inspect.'],['2:30–3:10','Bonus tools','Show archive import, a synthetic CSV result and Honor journal.'],['3:10–4:20','Architecture + tests','Trace one request and show the 28-test evidence.'],['4:20–5:00','Impact + limits','Explain the pilot plan, provider uncertainty and push setup.']];
 items.forEach((v,i)=>{const y=2.43+i*.62;txt(s,v[0],.68,y,1.7,.32,16,C.gold);txt(s,v[1],2.49,y,2.5,.35,18,C.ink,{bold:true});txt(s,v[2],5.2,y,7.35,.45,16,C.mute);});
 notes(s,'This slide is a presenter rehearsal plan; skip it during a short live pitch if it breaks the flow. A detailed script is in DEMO_GUIDE.md. Preload the homepage and Spirit Lens so free-tier startup and model downloads happen before judging. Start with a synthetic fixture that is visibly labelled, and keep a permitted local space image ready. Do not rely on NASA availability, device geolocation or a future moonrise happening during the demo. If a provider fails, show the actual error handling and the previously captured screenshot. Never claim a notification has arrived if you only scheduled it. Speaker division: one person handles user flow, one architecture/testing, one impact and Q&A; adapt to actual team size.');
}
// 14 — appendix code map
{
 const s=base('Appendix A • codebase knowledge','Know where every responsibility lives','Use these paths to move from a judge’s question to the implementation.');
 const rows=[['UI + feature pages','apps/web/app; apps/web/components'],['Typed API contracts','packages/trpc/server/routes; apps/api/src/server.ts'],['Weather / ranking / moon','packages/services/watchtower'],['Events / Kyūreki / ISS','packages/services/celestial'],['Persistent data / migrations','packages/database/models; packages/database/drizzle'],['AI / object analysis / deblur','apps/web/lib/spirit-lens'],['Signals + local Honor','apps/web/lib/transient-analysis.ts; honor-journal.ts'],['Push delivery / scheduler','packages/services/alerts; ops/push-cron.mjs']];
 rows.forEach((v,i)=>{const y=2.4+i*.49;if(i%2===0)rect(s,.58,y-.035,12.15,.46,C.panel);txt(s,v[0],.72,y,3.7,.38,16,C.gold);txt(s,v[1],4.64,y,7.8,.38,15,C.ink);});
 notes(s,'Appendix for questions. Request trace example: Watchtower client → packages/trpc/server/routes/watchtower/route.ts → packages/services/watchtower/index.ts → weather.ts provider adapter → packages/database/models/watchtower.ts. Event feed caching is in packages/services/celestial/index.ts; eclipse and meteor generation in calculated.ts; SGP4 passes in iss.ts. Push ownership and delivery are in services/alerts/index.ts and database/models/push.ts. AI worker validates requests, verifies model files, performs tiled inference, then produces metrics and candidates. There are database foundation tables for user accounts and Honor, but current journal behavior is local; do not imply the existence of full authentication or cloud sync.');
}
// 15 — scoring and astronomy
{
 const s=base('Appendix B • defensible calculations','Explain assumptions before giving a score','Night Honor Score is a weather heuristic, not a scientific observability guarantee.');
 rect(s,.65,2.4,12.02,1.14);txt(s,'Score = round{100 × [40(1 − C/100) + 20 min(V/20, 1) + 15(1 − H/100)] / 75}',.91,2.72,11.5,.49,21,C.gold);
 txt(s,'C = cloud cover %     V = visibility in km     H = relative humidity %',.85,3.85,11.5,.4,18,C.mute);
 bullets(s,['Bounds: 0–100; visibility gets full credit at 20 km.','Forecast uses the next future provider-night hour; null values are rejected.','Moon illumination and light pollution are currently excluded.','Meteor windows are approximate; eclipse maxima are global; ISS passes are predictions.'],.8,4.6,11.75,19,.54);
 notes(s,'Worked example: C=50, V=10 km, H=50 yields components 20 + 10 + 7.5 = 37.5. Divide by 75 and multiply by 100: 50. C=0, H=0 and V at least 20 gives 100; C=100, H=100 and V=0 gives 0. Inputs are validated before calculation. This is not a trained model and there is no measured prediction accuracy. Cloud/humidity/visibility do not account for seeing, atmospheric transparency, local obstructions, moonlight or light pollution. A future score should add calibrated darkness and moon effects with validation. Tests: packages/services/watchtower/weather.test.ts.');
}
// 16 — quality evidence
{
 const s=base('Appendix C • test depth and remaining work','What the evidence proves — and what remains','Passing tests establish selected behaviors; they do not establish exhaustive coverage.');
 card(s,.65,2.4,5.87,3.8,'VERIFIED IN THIS AUDIT','Repeatable evidence','28 / 28 automated test cases pass.\nFrontend and API builds pass.\nProduction map and calendar render.\nBrowser AI completes with exported metrics.');
 card(s,6.75,2.4,5.9,3.8,'PRIORITY NEXT','Close the evidence gaps','CI for tests and builds.\nPermission / offline / mobile E2E.\nPhysical closed-app push receipt.\nReal astronomy and load benchmarks.',C.red);
 txt(s,'Earlier PostgreSQL ownership integration is separate evidence; it was not rerun in this audit.',.68,6.4,12,.3,14,C.mute);
 notes(s,'The 28 are test cases; many cases contain several assertions. The suite is mostly pure logic and provider parsing with fixtures, not a full live integration suite. Database ownership integration exists separately and had passed earlier using dummy subscriptions without delivery, but was not rerun here. Current browser proof covers map/calendar rendering and a synthetic AI restoration plus analysis screenshot. There is no measured line/branch coverage and no verified CI workflow. Follow-up E2E should cover provider outage, empty data, disabled geolocation, denied notification permission, offline state, concurrent alert claims, device deletion and download/export behavior. Scientific validation needs clean/noisy pairs and source photometry preservation, not just similarity to noisy input.');
}
// 17 — bonuses and limits
{
 const s=base('Appendix D • bonus challenges and honest scope','Useful extras, with explicit boundaries','These features are implemented as prototype tools, not confirmed scientific discovery services.');
 picture(s,'signals.png',.65,2.45,6.9,2.55);
 txt(s,'Synthetic light-curve screening output',.72,5.15,6.65,.36,14,C.mute);
 bullets(s,['SkyView: on-demand archival survey JPEGs, not live telescope video.','Signals: CSV median / MAD screening, not confirmed transient discovery.','Honor: 25 points per unique observation, stored on this device.','Push: persistent jobs exist; closed-app delivery needs an active scheduler.'],7.83,2.43,4.87,17,.97);
 tag(s,'NEXT: more destinations • calibrated validation • authenticated sync • reliable scheduling',.65,6.36,12.02);
 notes(s,'NASA SkyView accepts a validated target, DSS/2MASS-J/GALEX Near UV survey and bounded field width, retrieves a 512px archival display JPEG through a fixed-host server route, and preserves query provenance. It may return overload errors; the UI reports them. Signal Observatory accepts CSV up to 1 MB and 12–2000 rows. Time-domain median/MAD screening and spectral local-median residuals flag unusual values; uncertainties combine in quadrature. These are heuristic candidates, not formal discovery significance, and a spectrum alone cannot establish time variability. Honor is device-local, user-editable and self-reported, with no synced accounts or public leaderboard. Push uses hashed bearer ownership and endpoint allowlists, leases and up to three attempts, but browser power policy and a missing production scheduler can prevent timely delivery. Safari endpoint support is not enabled. Use calendar export as the demo fallback.');
}
// Native slides remain editable; screenshots are deliberately embedded raster evidence.
pptx.writeFile({fileName:path.join(__dirname,'Tsukuyomi-Watch-Judging-Deck.pptx')});
