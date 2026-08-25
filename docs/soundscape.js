(() => {
  const P='sleep-intelligence:experience:';
  const K={sound:P+'soundscape:v1',volume:P+'sound-volume:v1'};
  const PROFILE={prefix:'sleep-intelligence:',current:'sleep-intelligence:persona:current:v1',list:'sleep-intelligence:persona:list:v1',dataPrefix:'sleep-intelligence:persona-data:'};
  const $=(s,r=document)=>r.querySelector(s);
  let a={ctx:null,source:null,gain:null,filter:null,lfo:null,playing:false};

  function addStyles(){const s=document.createElement('style');s.textContent=`
    .sound-control select{border:0;background:transparent;color:var(--text);font-size:10px;max-width:92px}.sound-control select option{background:#0b1424;color:#fff}.sound-control .sound-toggle{border:1px solid var(--line)!important;padding:5px 8px!important}.sound-control .sound-toggle.on{background:rgba(92,225,167,.14)!important;color:#70e8b7!important}.sound-control input[type=range]{width:64px!important;accent-color:var(--experience-accent,#6f7cff)}
    .persona-option-safe{width:100%;display:flex;align-items:center;gap:9px;border:0;background:transparent;color:var(--text);padding:8px;border-radius:9px;cursor:pointer;text-align:left}.persona-option-safe:hover,.persona-option-safe.active{background:rgba(111,124,255,.12)}.persona-option-safe .persona-dot{flex:0 0 auto}
    @media(max-width:700px){.sound-control{width:100%;justify-content:flex-start!important}.sound-control input[type=range]{flex:1!important}.sound-control select{max-width:110px}}
  `;document.head.appendChild(s)}

  function safeParse(v,f){try{return JSON.parse(v)??f}catch{return f}}
  function profileDataKeys(){return Object.keys(localStorage).filter(k=>k.startsWith(PROFILE.prefix)&&k!==PROFILE.current&&k!==PROFILE.list&&!k.startsWith(PROFILE.dataPrefix)&&!k.startsWith('sleep-intelligence:experience:'))}
  function profileSlug(name){return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'profile'}
  function snapshotProfile(name){if(!name)return;const data={};profileDataKeys().forEach(k=>data[k]=localStorage.getItem(k));localStorage.setItem(`${PROFILE.dataPrefix}${profileSlug(name)}:v1`,JSON.stringify(data))}
  function restoreProfile(name){profileDataKeys().forEach(k=>localStorage.removeItem(k));const data=safeParse(localStorage.getItem(`${PROFILE.dataPrefix}${profileSlug(name)}:v1`),{});Object.entries(data).forEach(([k,v])=>{if(k.startsWith(PROFILE.prefix)&&v!==null)localStorage.setItem(k,v)})}
  function switchProfile(name){const current=localStorage.getItem(PROFILE.current)||'Sanaya';if(name===current)return;snapshotProfile(current);const list=safeParse(localStorage.getItem(PROFILE.list),[]).filter(n=>String(n).trim()!=='Eo');if(!list.includes(name))list.push(name);localStorage.setItem(PROFILE.list,JSON.stringify(list));localStorage.setItem(PROFILE.current,name);restoreProfile(name);location.reload()}
  function repairProfiles(){
    document.querySelectorAll('[data-persona="Eo"]').forEach(el=>el.remove());
    const menu=$('.persona-menu');if(!menu||menu.querySelector('[data-persona="Neo"]'))return;
    const add=menu.querySelector('.persona-add');const button=document.createElement('button');button.type='button';button.className='persona-option-safe';button.dataset.persona='Neo';button.innerHTML='<span class="persona-dot">N</span><span>Neo</span>';button.addEventListener('click',()=>switchProfile('Neo'));menu.insertBefore(button,add||null);
  }
  function syncDuration(){const d=$('#duration');if(!d)return;d.min='3';d.max='12';const labels=d.closest('.control-card')?.querySelectorAll('.range-labels span');if(labels?.[0])labels[0].textContent='3h';if(labels?.[1])labels[1].textContent='12h'}

  function noise(ctx,type){const n=ctx.sampleRate*2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;if(type==='brown'){last=(last+.02*w)/1.02;d[i]=last*3.5}else d[i]=w}return b}

  function stop(){try{a.source?.stop();a.lfo?.stop();a.ctx?.close()}catch{}a={ctx:null,source:null,gain:null,filter:null,lfo:null,playing:false};const b=$('#sound-toggle');if(b){b.textContent='Off';b.classList.remove('on')}}

  function start(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const type=$('#soundscape-select')?.value||'brown',vol=Number($('#sound-volume')?.value||35),ctx=new AC(),source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=noise(ctx,type==='rain'?'white':'brown');source.loop=true;if(type==='rain'){filter.type='highpass';filter.frequency.value=900;gain.gain.value=(vol/100)*.10}else if(type==='ocean'){filter.type='lowpass';filter.frequency.value=650;gain.gain.value=(vol/100)*.14}else{filter.type='lowpass';filter.frequency.value=900;gain.gain.value=(vol/100)*.16}source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);let lfo=null;if(type==='ocean'){lfo=ctx.createOscillator();const lg=ctx.createGain();lfo.frequency.value=.12;lg.gain.value=(vol/100)*.045;lfo.connect(lg);lg.connect(gain.gain);lfo.start()}source.start();a={ctx,source,gain,filter,lfo,playing:true};const b=$('#sound-toggle');if(b){b.textContent='On';b.classList.add('on')}}

  function render(){const c=$('.experience-controls');if(!c||$('.sound-control',c))return;const type=localStorage.getItem(K.sound)||'brown',v=Number(localStorage.getItem(K.volume)||35);c.insertAdjacentHTML('beforeend',`<div class="experience-control sound-control"><label>Soundscape</label><select id="soundscape-select"><option value="brown">Brown noise</option><option value="rain">Rain</option><option value="ocean">Ocean</option></select><button id="sound-toggle" class="sound-toggle" type="button">Off</button><input id="sound-volume" type="range" min="0" max="100" value="${v}" aria-label="Soundscape volume"></div>`);$('#soundscape-select').value=type;$('#sound-toggle').onclick=()=>a.playing?stop():start();$('#soundscape-select').onchange=()=>{localStorage.setItem(K.sound,$('#soundscape-select').value);if(a.playing){stop();start()}};$('#sound-volume').oninput=()=>{const x=Number($('#sound-volume').value);localStorage.setItem(K.volume,String(x));if(a.gain&&a.ctx)a.gain.gain.setTargetAtTime((x/100)*.16,a.ctx.currentTime,.05)}}

  function init(){addStyles();render();repairProfiles();syncDuration();new MutationObserver(()=>{render();repairProfiles();syncDuration()}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
