import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dice5, LogOut, Plus, Send, Pencil, ArrowLeft, Users, Sparkles,
  ChevronDown, ChevronUp, RotateCcw, X, Camera, MessageCircle, Sun,
  Crown, Settings, Swords, UserRound, BookOpen, Trash2
} from "lucide-react";
import { db } from "./firebase";
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, query, orderBy, startAt, endAt, getDocs,
} from "firebase/firestore";

/* ============================== CONFIG ============================== */

const LOGIN_CODES = {
  "0303": { code: "0303", name: "muchuu" },
  "0217": { code: "0217", name: "haru" },
};

const SKILL_LIST = [
  ["회계", 5], ["감정", 5], ["고고학", 1], ["예술/공예", 5], ["매혹", 15],
  ["등반", 20], ["신용", 0], ["위장", 5], ["회피", 30], ["전기 수리", 10],
  ["사격(권총)", 20], ["사격(소총/샷건)", 25], ["응급처치", 30], ["역사", 5],
  ["협박", 15], ["도약", 20], ["모국어", 0], ["외국어", 1], ["법률", 5],
  ["도서관 이용", 20], ["듣기", 20], ["기계 수리", 10], ["의학", 1],
  ["자연", 10], ["항법", 10], ["오컬트", 5], ["심리학", 10], ["승마", 5],
  ["과학", 1], ["은신", 20], ["수영", 20], ["던지기", 20], ["추적", 10],
  ["운전(자동차)", 20], ["설득", 10],
];

const CHAR_KEYS = ["STR", "CON", "SIZ", "DEX", "APP", "INT", "POW", "EDU"];
const CHAR_LABEL = {
  STR: "근력", CON: "체력", SIZ: "체격", DEX: "민첩",
  APP: "외모", INT: "지능", POW: "정신력", EDU: "교육",
};

/* ============================== THEMES ============================== */

const THEMES = {
  sky: {
    label: "하늘",
    emoji: "🩵",
    accent: "#2e9bdb", accentSoft: "#6dbdea", accentDeep: "#1f6fa0",
    bgPanel: "#f3faff", bgGrad1: "#e4f4fd", bgGrad2: "#eef8ff",
    border: "#cfe8f7", borderSoft: "#e2f2fb",
  },
  pink: {
    label: "분홍",
    emoji: "🩷",
    accent: "#d96fa0", accentSoft: "#e89fbf", accentDeep: "#a04878",
    bgPanel: "#fff3f8", bgGrad1: "#fde4ef", bgGrad2: "#fff0f5",
    border: "#f0c8dd", borderSoft: "#f8dcea",
  },
  yellow: {
    label: "노랑",
    emoji: "💛",
    accent: "#c9a020", accentSoft: "#dbb840", accentDeep: "#8a6a10",
    bgPanel: "#fffdf0", bgGrad1: "#fdf5d0", bgGrad2: "#fffae8",
    border: "#e8d890", borderSoft: "#f2ebbb",
  },
  lime: {
    label: "연두",
    emoji: "💚",
    accent: "#6aaa30", accentSoft: "#8abe56", accentDeep: "#3a7a18",
    bgPanel: "#f4fbf0", bgGrad1: "#e0f4d0", bgGrad2: "#edfae5",
    border: "#c0e0a0", borderSoft: "#d8edcc",
  },
  purple: {
    label: "보라",
    emoji: "💜",
    accent: "#8060c0", accentSoft: "#a080d8", accentDeep: "#5040a0",
    bgPanel: "#f6f3ff", bgGrad1: "#eae0fd", bgGrad2: "#f2ecff",
    border: "#ccc0e8", borderSoft: "#ddd6f2",
  },
};

/* ============================== STYLES ============================== */

// 기본 테마(sky) 기준 고정 CSS — 변수 값은 루트 div style로 주입
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
@font-face {
  font-family: 'MaruBuri';
  src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Light.woff2') format('woff2');
  font-weight: 300; font-display: swap;
}
@font-face {
  font-family: 'MaruBuri';
  src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff2') format('woff2');
  font-weight: 400; font-display: swap;
}
@font-face {
  font-family: 'MaruBuri';
  src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-SemiBold.woff2') format('woff2');
  font-weight: 600; font-display: swap;
}
@font-face {
  font-family: 'MaruBuri';
  src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Bold.woff2') format('woff2');
  font-weight: 700; font-display: swap;
}
* { box-sizing: border-box; }
.coc-root {
  --bg: #ffffff;
  --bg-card: #ffffff;
  --text: #223142;
  --text-dim: #647c8c;
  --text-faint: #9db2c0;
  --green: #3a9a6e;
  --purple-c: #7c5cbf;
  --orange: #d07030;
  font-family: 'MaruBuri', sans-serif;
  font-size: 13.5px;
  color: var(--text);
  min-height: 100vh; width: 100%;
}
.coc-display { font-family: 'MaruBuri', serif; letter-spacing: 0.01em; }
.coc-mono { font-family: 'JetBrains Mono', monospace; }
.coc-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
.coc-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.coc-scroll::-webkit-scrollbar-track { background: transparent; }

.coc-btn {
  font-family: 'MaruBuri', sans-serif; font-weight: 600; font-size: 12px;
  padding: 9px 16px; border-radius: 8px; border: 1px solid var(--accent);
  background: var(--accent); color: #fff; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.15s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.coc-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.coc-btn:active { transform: translateY(0); opacity: 1; }
.coc-btn.ghost { background: #fff; border-color: var(--border); color: var(--text-dim); box-shadow: none; }
.coc-btn.ghost:hover { border-color: var(--accent-soft); color: var(--accent-deep); background: var(--bg-panel); }
.coc-btn.small { padding: 5px 10px; font-size: 10.5px; border-radius: 6px; }
.coc-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.coc-seal {
  width: 50px; height: 50px; border-radius: 50%;
  border: 1.5px solid var(--accent);
  display: flex; align-items: center; justify-content: center; color: var(--accent-deep);
  background: radial-gradient(circle, var(--bg-panel) 0%, #fff 100%);
  box-shadow: 0 0 0 5px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.10);
  flex-shrink: 0;
}
.coc-input, .coc-select, .coc-textarea {
  background: #fff; border: 1px solid var(--border); color: var(--text);
  border-radius: 7px; padding: 8px 10px;
  font-family: 'MaruBuri', sans-serif; font-size: 13px; outline: none; width: 100%;
}
.coc-input::placeholder, .coc-textarea::placeholder { color: var(--text-faint); }
.coc-input:focus, .coc-select:focus, .coc-textarea:focus {
  border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,0,0,0.07);
}
.coc-textarea { resize: vertical; font-family: 'MaruBuri', sans-serif; }

.coc-card {
  background: var(--bg-card); border: 1px solid var(--border-soft);
  border-radius: 12px; position: relative; box-shadow: 0 2px 14px rgba(0,0,0,0.05);
}
.coc-folder-tab {
  position: absolute; top: -10px; left: 16px;
  background: #fff; border: 1px solid var(--border);
  padding: 2px 9px 4px; font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.07em; color: var(--accent-deep); border-radius: 999px;
}
.coc-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent);
  margin: 14px 0;
}
.coc-label {
  font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
  letter-spacing: 0.08em; color: var(--accent-deep); text-transform: uppercase; opacity: 0.75;
}
.coc-stat-box {
  background: var(--bg-panel); border: 1px solid var(--border-soft);
  border-radius: 8px; padding: 7px 5px; text-align: center;
}
.coc-avatar { border-radius: 50%; object-fit: cover; border: 1px solid var(--border); background: var(--bg-panel); }
.coc-modal-backdrop {
  position: fixed; inset: 0; background: rgba(30,60,80,0.28);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  z-index: 50; padding: 16px;
}
.coc-modal {
  background: #fff; border: 1px solid var(--border); border-radius: 14px;
  max-width: 600px; width: 100%; max-height: 88vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(46,90,120,0.2);
}
.coc-tabbar { display: flex; gap: 2px; border-bottom: 1px solid var(--border-soft); }
.coc-tab {
  font-family: 'MaruBuri', sans-serif; font-weight: 600; font-size: 12px;
  padding: 10px 15px; color: var(--text-faint); cursor: pointer;
  border-bottom: 2px solid transparent;
}
.coc-tab.active { color: var(--accent-deep); border-bottom-color: var(--accent); }
.msg-actions { opacity: 0; transition: opacity 0.15s; }
.msg-actions:hover { opacity: 1; }
div:hover > div > .msg-actions { opacity: 1; }
.anon-msg:hover .msg-actions { opacity: 1; }
.chat-tab-bar { display:flex; gap:2px; overflow-x:auto; border-bottom:1px solid var(--border-soft); margin-bottom:8px; }
.chat-tab { font-size:11.5px; font-weight:600; padding:7px 13px; cursor:pointer; color:var(--text-faint); border-bottom:2px solid transparent; white-space:nowrap; }
.chat-tab.active { color:var(--accent-deep); border-bottom-color:var(--accent); }
`;

// 테마 CSS 변수를 인라인 style 객체로 반환
function themeVars(t) {
  return {
    "--accent": t.accent,
    "--accent-soft": t.accentSoft,
    "--accent-deep": t.accentDeep,
    "--bg-panel": t.bgPanel,
    "--border": t.border,
    "--border-soft": t.borderSoft,
    background: `radial-gradient(ellipse 700px 380px at 15% -8%, ${t.bgGrad1} 0%, transparent 60%), radial-gradient(ellipse 700px 380px at 105% 0%, ${t.bgGrad2} 0%, transparent 55%), #fff`,
  };
}

/* ============================== HELPERS ============================== */

function newId() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
function d100() { return Math.floor(Math.random() * 100) + 1; }
function rollN(n) { let s = 0; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 6) + 1; return s; }
function rollChar(key) {
  if (key === "SIZ" || key === "INT" || key === "EDU") return (rollN(2) + 6) * 5;
  return rollN(3) * 5;
}
function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
  } catch { return iso; }
}
function fmtTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function emptyCharacteristics() { const o={}; CHAR_KEYS.forEach(k=>o[k]=50); return o; }
function emptySkills() { const o={}; SKILL_LIST.forEach(([n,b])=>o[n]=b); return o; }
function emptyDerived() { return {HP:10,maxHP:10,MP:10,maxMP:10,SAN:50,maxSAN:50,Luck:50}; }
function blankCharSheet(name="") { return {name,avatar:"",characteristics:emptyCharacteristics(),skills:emptySkills(),derived:emptyDerived(),notes:""}; }
function blankProfile(name="") { return {name,avatar:""}; }

/* ============================== STORAGE (Firebase Firestore) ============================== */
// 기존에는 Claude 아티팩트 전용 API인 window.storage를 사용했으나,
// Netlify 등 일반 환경에는 window.storage가 없어 "저장소 없음" 에러가 발생했습니다.
// 아래는 동일한 함수 시그니처(storeGet/storeSet/storeDelete/storeListValues)를 유지한 채
// Firestore의 "kv" 컬렉션에 key-value로 저장하도록 교체한 버전입니다.
// shared 파라미터는 기존 호출부와의 호환을 위해 남겨두었을 뿐 실제로는 사용하지 않습니다
// (원본 코드가 어차피 모든 곳에서 shared:true로만 호출했기 때문에 컬렉션을 하나로 통일했습니다).

const KV_COLLECTION = "kv";

async function storeGet(key, _shared) {
  try {
    const snap = await getDoc(doc(db, KV_COLLECTION, key));
    if (!snap.exists()) return null;
    return snap.data().value;
  } catch { return null; }
}
async function storeSet(key, value, _shared) {
  let lastError = "";
  for (let i = 0; i < 3; i++) {
    try {
      await setDoc(doc(db, KV_COLLECTION, key), { value, updatedAt: Date.now() });
      return { ok: true };
    } catch (err) {
      lastError = err?.message || String(err);
      if (i < 2) await new Promise(r => setTimeout(r, 500));
    }
  }
  return { ok: false, error: lastError };
}
async function storeDelete(key, _shared) {
  try { await deleteDoc(doc(db, KV_COLLECTION, key)); return true; } catch { return false; }
}
async function storeListValues(prefix, _shared) {
  try {
    const col = collection(db, KV_COLLECTION);
    const q = query(col, orderBy("__name__"), startAt(prefix), endAt(prefix + "\uf8ff"));
    const snap = await getDocs(q);
    const out = [];
    snap.forEach(d => out.push({ key: d.id, value: d.data().value }));
    return out;
  } catch { return []; }
}
async function storeListKeys(prefix, _shared) {
  try {
    const col = collection(db, KV_COLLECTION);
    const q = query(col, orderBy("__name__"), startAt(prefix), endAt(prefix + "\uf8ff"));
    const snap = await getDocs(q);
    return { keys: snap.docs.map(d => d.id) };
  } catch { return { keys: [] }; }
}
async function fileToResizedDataURL(file, maxSize=220) {
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        let {width,height}=img;
        if(width>height&&width>maxSize){height=Math.round(height*maxSize/width);width=maxSize;}
        else if(height>maxSize){width=Math.round(width*maxSize/height);height=maxSize;}
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        canvas.getContext("2d").drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL("image/jpeg",0.82));
      };
      img.onerror=reject; img.src=reader.result;
    };
    reader.onerror=reject; reader.readAsDataURL(file);
  });
}

/* ============================== SUBCOMPONENTS ============================== */

function AvatarUpload({value,onChange,size=58}){
  const inputRef=useRef(null);
  return(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",border:"1px solid var(--border)",background:"var(--bg-panel)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {value?<img src={value} alt="avatar" className="coc-avatar" style={{width:"100%",height:"100%"}}/>:<Sparkles size={size*0.38} color="var(--accent-soft)"/>}
      </div>
      <button type="button" className="coc-btn ghost small" onClick={()=>inputRef.current?.click()}><Camera size={12}/> 사진 변경</button>
      <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}}
        onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;onChange(await fileToResizedDataURL(f,220));e.target.value="";}}/>
    </div>
  );
}

function CharacteristicsGrid({characteristics,setCharacteristics,allowRoll}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
      {CHAR_KEYS.map(k=>(
        <div key={k} className="coc-stat-box">
          <div className="coc-label" style={{marginBottom:3}}>{CHAR_LABEL[k]} ({k})</div>
          <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"center"}}>
            <input className="coc-input coc-mono" type="number" value={characteristics[k]}
              onChange={e=>setCharacteristics({...characteristics,[k]:parseInt(e.target.value)||0})}
              style={{textAlign:"center",padding:"5px 3px",fontSize:14,color:"var(--accent-deep)"}}/>
            {allowRoll&&<button type="button" className="coc-btn ghost small" style={{padding:5}} onClick={()=>setCharacteristics({...characteristics,[k]:rollChar(k)})}><Dice5 size={11}/></button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function DerivedStats({characteristics,derived,setDerived,allowRoll}){
  const recompute=()=>{
    const maxHP=Math.floor((characteristics.CON+characteristics.SIZ)/10);
    const maxMP=Math.floor(characteristics.POW/5);
    const maxSAN=Math.min(characteristics.POW,99);
    const Luck=rollN(3)*5;
    setDerived({HP:maxHP,maxHP,MP:maxMP,maxMP,SAN:maxSAN,maxSAN,Luck});
  };
  const field=(key,maxKey,label)=>(
    <div className="coc-stat-box">
      <div className="coc-label" style={{marginBottom:3}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2}}>
        <input className="coc-mono" type="number" value={derived[key]}
          onChange={e=>setDerived({...derived,[key]:parseInt(e.target.value)||0})}
          style={{width:34,background:"transparent",border:"none",color:"var(--accent-deep)",fontSize:15,textAlign:"right",outline:"none"}}/>
        {maxKey&&<><span style={{color:"var(--text-faint)"}}>/</span><span className="coc-mono" style={{fontSize:11,color:"var(--text-dim)"}}>{derived[maxKey]}</span></>}
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
        <div className="coc-label">파생 능력치</div>
        {allowRoll&&<button type="button" className="coc-btn ghost small" onClick={recompute}><RotateCcw size={11}/> 재계산</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
        {field("HP","maxHP","체력(HP)")}{field("MP","maxMP","정신(MP)")}{field("SAN","maxSAN","이성(SAN)")}{field("Luck",null,"행운")}
      </div>
    </div>
  );
}

function SkillsGrid({skills,setSkills}){
  const [open,setOpen]=useState(false);
  return(
    <div>
      <button type="button" onClick={()=>setOpen(!open)}
        style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",color:"var(--accent-deep)",fontFamily:"JetBrains Mono,monospace",fontSize:10,padding:0,fontWeight:600}}>
        {open?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
        기능치 {open?"숨기기":`펼치기 (${SKILL_LIST.length})`}
      </button>
      {open&&(
        <div className="coc-scroll" style={{marginTop:9,maxHeight:280,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5,paddingRight:4}}>
          {SKILL_LIST.map(([name])=>(
            <div key={name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg-panel)",border:"1px solid var(--border-soft)",borderRadius:6,padding:"4px 7px"}}>
              <span style={{fontSize:12,color:"var(--text-dim)"}}>{name}</span>
              <input className="coc-mono" type="number" value={skills[name]??0}
                onChange={e=>setSkills({...skills,[name]:parseInt(e.target.value)||0})}
                style={{width:38,background:"transparent",border:"none",color:"var(--text)",textAlign:"right",outline:"none",fontSize:12}}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SheetEditor({sheet,setSheet,allowRoll=true,readOnly=false}){
  if(readOnly) return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <div style={{width:52,height:52,borderRadius:"50%",overflow:"hidden",border:"1px solid var(--border)",flexShrink:0,background:"var(--bg-panel)"}}>
          {sheet.avatar?<img src={sheet.avatar} className="coc-avatar" style={{width:"100%",height:"100%"}}/>:<Sparkles size={22} color="var(--accent-soft)" style={{margin:15}}/>}
        </div>
        <div className="coc-display" style={{fontSize:17,color:"var(--accent-deep)"}}>{sheet.name||"이름 없음"}</div>
      </div>
      <CharacteristicsGrid characteristics={sheet.characteristics} setCharacteristics={()=>{}} allowRoll={false}/>
      <div className="coc-divider"/>
      <DerivedStats characteristics={sheet.characteristics} derived={sheet.derived} setDerived={()=>{}} allowRoll={false}/>
      <div className="coc-divider"/>
      <SkillsGrid skills={sheet.skills} setSkills={()=>{}}/>
      {sheet.notes&&<><div className="coc-divider"/><div className="coc-label" style={{marginBottom:5}}>메모</div><div style={{fontSize:12.5,color:"var(--text-dim)",whiteSpace:"pre-wrap"}}>{sheet.notes}</div></>}
    </div>
  );
  return(
    <div>
      <div style={{marginBottom:14}}><div className="coc-label" style={{marginBottom:5}}>이름</div><input className="coc-input" value={sheet.name} onChange={e=>setSheet({...sheet,name:e.target.value})} placeholder="탐사자 이름"/></div>
      <div style={{marginBottom:16}}><div className="coc-label" style={{marginBottom:5}}>사진</div><AvatarUpload value={sheet.avatar} onChange={v=>setSheet({...sheet,avatar:v})}/></div>
      <div className="coc-divider"/>
      <div className="coc-label" style={{marginBottom:7}}>능력치</div>
      <CharacteristicsGrid characteristics={sheet.characteristics} setCharacteristics={c=>setSheet({...sheet,characteristics:c})} allowRoll={allowRoll}/>
      <div className="coc-divider"/>
      <DerivedStats characteristics={sheet.characteristics} derived={sheet.derived} setDerived={d=>setSheet({...sheet,derived:d})} allowRoll={allowRoll}/>
      <div className="coc-divider"/>
      <SkillsGrid skills={sheet.skills} setSkills={s=>setSheet({...sheet,skills:s})}/>
      <div className="coc-divider"/>
      <div className="coc-label" style={{marginBottom:5}}>메모 / 배경</div>
      <textarea className="coc-textarea" rows={3} value={sheet.notes} onChange={e=>setSheet({...sheet,notes:e.target.value})} placeholder="직업, 배경, 소지품 등 자유롭게 기록하세요"/>
    </div>
  );
}

/* ============================== LOGIN ============================== */

function LoginScreen({onLogin}){
  const [code,setCode]=useState("");
  const [error,setError]=useState("");
  const submit=()=>{
    const t=code.trim();
    if(LOGIN_CODES[t]) onLogin(LOGIN_CODES[t]);
    else setError(`등록되지 않은 열쇠입니다. (입력값: "${t}")`);
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{textAlign:"center",maxWidth:320,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:18}}><div className="coc-seal"><Sun size={20}/></div></div>
        <div className="coc-display" style={{fontSize:20,color:"var(--accent-deep)",marginBottom:5}}>무츄의 하루</div>
        <div style={{fontSize:12,color:"var(--text-faint)",marginBottom:24}}>입장하려면 열쇠(코드)를 입력하세요</div>
        <input type="text" inputMode="numeric" pattern="[0-9]*" className="coc-input coc-mono"
          style={{textAlign:"center",fontSize:19,letterSpacing:"0.3em",marginBottom:12}}
          value={code} onChange={e=>{setCode(e.target.value.replace(/[^0-9]/g,"").slice(0,4));setError("");}}
          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();submit();}}}
          placeholder="0000" maxLength={4} autoComplete="off" autoFocus/>
        {error&&<div style={{color:"var(--accent)",fontSize:11.5,marginBottom:10}}>{error}</div>}
        <button type="button" className="coc-btn" style={{width:"100%",justifyContent:"center",padding:"11px"}} onClick={submit}>
          <Sun size={13}/> 입장하기
        </button>
      </div>
    </div>
  );
}

/* ============================== SETTINGS TAB ============================== */

function SettingsTab({currentTheme, setCurrentTheme}){
  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <div className="coc-card" style={{padding:"22px 20px"}}>
        <div className="coc-folder-tab">SETTINGS</div>
        <div className="coc-display" style={{fontSize:15.5,color:"var(--accent-deep)",marginBottom:18}}>설정</div>

        <div className="coc-label" style={{marginBottom:12}}>테마 색상</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
          {Object.entries(THEMES).map(([key,t])=>(
            <button key={key} type="button" onClick={()=>setCurrentTheme(key)}
              style={{
                display:"flex",alignItems:"center",gap:9,padding:"10px 16px",
                borderRadius:10,border:"2px solid "+(currentTheme===key?"var(--accent)":"var(--border)"),
                background:currentTheme===key?"var(--bg-panel)":"#fff",
                cursor:"pointer",transition:"all 0.15s",
              }}>
              <div style={{width:20,height:20,borderRadius:"50%",background:t.accent,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/>
              <span style={{fontSize:13,fontWeight:currentTheme===key?700:400,color:currentTheme===key?"var(--accent-deep)":"var(--text-dim)"}}>{t.label}</span>
              {currentTheme===key&&<span style={{fontSize:10,color:"var(--accent)"}}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== MY PAGE ============================== */

function MyPage({userCode,profile,setProfile}){
  const [local,setLocal]=useState(profile);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [myChars,setMyChars]=useState([]);
  const [loadingChars,setLoadingChars]=useState(true);
  const [viewing,setViewing]=useState(null);

  useEffect(()=>setLocal(profile),[profile]);

  const refreshChars=useCallback(async()=>{
    const [charEntries,roomEntries]=await Promise.all([storeListValues("char:",true),storeListValues("room:",true)]);
    const roomMap={};
    roomEntries.forEach(r=>roomMap[r.value.id]=r.value);
    const mine=charEntries.map(x=>x.value).filter(c=>c.ownerCode===userCode)
      .map(c=>({...c,__room:roomMap[c.roomId]})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    setMyChars(mine);setLoadingChars(false);
  },[userCode]);

  useEffect(()=>{refreshChars();const t=setInterval(refreshChars,6000);return()=>clearInterval(t);},[refreshChars]);

  const save=async()=>{
    setSaving(true);
    const res=await storeSet(`profile:${userCode}`,local,true);
    setSaving(false);
    if(res.ok){setProfile(local);setSaved(true);setTimeout(()=>setSaved(false),1600);}
    else alert(`프로필 저장 실패: ${res.error}`);
  };

  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <div className="coc-card" style={{padding:"20px",marginBottom:20}}>
        <div className="coc-folder-tab">PROFILE · {userCode}</div>
        <div className="coc-display" style={{fontSize:15.5,color:"var(--accent-deep)",marginBottom:14}}>마이페이지</div>
        <div className="coc-label" style={{marginBottom:5}}>표시 이름</div>
        <input className="coc-input" value={local.name} onChange={e=>setLocal({...local,name:e.target.value})} style={{marginBottom:14,maxWidth:260}}/>
        <div className="coc-label" style={{marginBottom:5}}>사진</div>
        <AvatarUpload value={local.avatar} onChange={v=>setLocal({...local,avatar:v})}/>
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10,marginTop:16}}>
          {saved&&<span style={{color:"var(--accent)",fontSize:11.5}}>저장됨</span>}
          <button className="coc-btn" onClick={save} disabled={saving}>{saving?"저장 중...":"저장"}</button>
        </div>
      </div>
      <div className="coc-label" style={{marginBottom:10}}>내 캐릭터 모음</div>
      {loadingChars?(
        <div style={{color:"var(--text-faint)",fontSize:12.5,padding:20,textAlign:"center"}}>불러오는 중...</div>
      ):myChars.length===0?(
        <div className="coc-card" style={{padding:32,textAlign:"center"}}>
          <div style={{color:"var(--text-faint)",fontSize:12.5}}>아직 만든 캐릭터가 없어요. 세션방에 들어가서 첫 탐사자를 만들어보세요!</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:10}}>
          {myChars.map(c=>(
            <div key={c.id} className="coc-card" style={{padding:14,cursor:"pointer",textAlign:"center"}} onClick={()=>setViewing(c)}>
              <div style={{width:50,height:50,borderRadius:"50%",overflow:"hidden",background:"var(--bg-panel)",margin:"0 auto 8px",border:"1px solid var(--border)"}}>
                {c.avatar?<img src={c.avatar} style={{width:"100%",height:"100%"}} className="coc-avatar"/>:<Sparkles size={20} color="var(--accent-soft)" style={{margin:15}}/>}
              </div>
              <div style={{fontSize:13,fontWeight:600}}>{c.name}</div>
              <div className="coc-mono" style={{fontSize:9.5,color:"var(--text-faint)",marginTop:3}}>{c.__room?.title||"알 수 없는 세션"}</div>
            </div>
          ))}
        </div>
      )}
      {viewing&&(
        <div className="coc-modal-backdrop" onClick={()=>setViewing(null)}>
          <div className="coc-modal" onClick={e=>e.stopPropagation()}>
            <div style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
                <button className="coc-btn ghost small" onClick={()=>setViewing(null)} style={{padding:6}}><X size={13}/></button>
              </div>
              <SheetEditor sheet={viewing} setSheet={()=>{}} readOnly/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== ROOMS ============================== */

function RoomsTab({userCode,onEnterRoom}){
  const [rooms,setRooms]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showCreate,setShowCreate]=useState(false);
  const [editing,setEditing]=useState(null);

  const refresh=useCallback(async()=>{
    const list=await storeListValues("room:",true);
    list.sort((a,b)=>(b.value.createdAt||0)-(a.value.createdAt||0));
    setRooms(list.map(x=>x.value));setLoading(false);
  },[]);

  useEffect(()=>{refresh();const t=setInterval(refresh,5000);return()=>clearInterval(t);},[refresh]);

  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div className="coc-display" style={{fontSize:15.5,color:"var(--accent-deep)"}}>세션 목록</div>
        <button className="coc-btn" onClick={()=>setShowCreate(true)}><Plus size={13}/> 새 세션</button>
      </div>
      {loading?(
        <div style={{color:"var(--text-faint)",fontSize:12.5,padding:22,textAlign:"center"}}>불러오는 중...</div>
      ):rooms.length===0?(
        <div className="coc-card" style={{padding:36,textAlign:"center"}}>
          <div style={{color:"var(--text-dim)",fontSize:13,marginBottom:5}}>아직 개설된 세션이 없습니다.</div>
          <div style={{color:"var(--text-faint)",fontSize:11.5}}>'새 세션'을 눌러 첫 세션을 열어보세요.</div>
        </div>
      ):(
        <div style={{display:"grid",gap:10}}>
          {rooms.map((r,i)=>{
            const isMyRoom=r.creatorCode===userCode;
            return(
              <div key={r.id} className="coc-card" style={{padding:"16px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                onClick={()=>onEnterRoom(r)}>
                <div className="coc-folder-tab">No.{String(rooms.length-i).padStart(3,"0")}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div>
                    <div className="coc-display" style={{fontSize:14.5,color:"var(--text)"}}>{r.title}</div>
                    <div className="coc-mono" style={{fontSize:10.5,color:"var(--text-faint)",marginTop:4}}>{fmtDate(r.date)}</div>
                  </div>
                  {isMyRoom&&<span style={{fontSize:10,fontWeight:700,color:"var(--accent-deep)",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.05em"}}>GM</span>}
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {isMyRoom&&(
                    <button className="coc-btn ghost small" onClick={e=>{e.stopPropagation();setEditing(r);}}><Settings size={11}/></button>
                  )}
                  <ArrowLeft size={14} color="var(--text-faint)" style={{transform:"rotate(180deg)"}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showCreate&&<RoomModal onClose={()=>setShowCreate(false)} onSaved={async()=>{setShowCreate(false);await refresh();}} userCode={userCode}/>}
      {editing&&<RoomModal room={editing} onClose={()=>setEditing(null)}
        onSaved={async(updated)=>{setEditing(null);setRooms(r=>r.map(x=>x.id===updated.id?updated:x));}}
        onDeleted={async(id)=>{setEditing(null);setRooms(r=>r.filter(x=>x.id!==id));}}
        userCode={userCode}/>}
    </div>
  );
}

function RoomModal({room,onClose,onSaved,onDeleted,userCode}){
  const isEdit=!!room;
  const [title,setTitle]=useState(room?.title||"");
  const [date,setDate]=useState(room?.date||new Date().toISOString().slice(0,10));
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [error,setError]=useState("");

  const submit=async()=>{
    const t=title.trim();if(!t)return;
    setSaving(true);setError("");
    const data=isEdit?{...room,title:t,date}:{id:newId(),title:t,date,createdAt:Date.now(),creatorCode:userCode};
    const res=await storeSet(`room:${data.id}`,data,true);
    setSaving(false);
    if(res.ok) onSaved(data);
    else setError(`저장에 실패했습니다.\n오류: ${res.error}`);
  };

  const handleDelete=async()=>{
    if(!confirmDelete){setConfirmDelete(true);return;}
    setDeleting(true);
    await storeDelete(`room:${room.id}`,true);
    const chatKeys=await storeListKeys(`chat:${room.id}:`,true).catch(()=>({keys:[]}));
    const charKeys=await storeListKeys(`char:${room.id}:`,true).catch(()=>({keys:[]}));
    for(const k of(chatKeys.keys||[])) await storeDelete(k,true);
    for(const k of(charKeys.keys||[])) await storeDelete(k,true);
    setDeleting(false);
    onDeleted?.(room.id);
  };

  return(
    <div className="coc-modal-backdrop" onClick={onClose}>
      <div className="coc-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div className="coc-display" style={{fontSize:15,color:"var(--accent-deep)"}}>{isEdit?"세션 설정":"새 세션 만들기"}</div>
            <button className="coc-btn ghost small" onClick={onClose} style={{padding:6}}><X size={13}/></button>
          </div>
          <div className="coc-label" style={{marginBottom:5}}>세션 제목</div>
          <input className="coc-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="시나리오 이름을 입력해 주세요" style={{marginBottom:14}} autoFocus/>
          <div className="coc-label" style={{marginBottom:5}}>날짜</div>
          <input type="date" className="coc-input coc-mono" value={date} onChange={e=>setDate(e.target.value)} style={{marginBottom:18}}/>
          {error&&<div style={{color:"var(--accent)",fontSize:11.5,marginBottom:12,whiteSpace:"pre-wrap"}}>{error}</div>}
          <button className="coc-btn" style={{width:"100%",justifyContent:"center",padding:11,marginBottom:isEdit?10:0}} disabled={!title.trim()||saving} onClick={submit}>
            {saving?"저장 중...":<><Plus size={13}/>{isEdit?"수정 완료":"세션 만들기"}</>}
          </button>

          {isEdit&&(
            <>
              <div style={{height:1,background:"var(--border-soft)",margin:"4px 0 10px"}}/>
              {confirmDelete?(
                <div style={{background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:12.5,color:"var(--accent-deep)",marginBottom:10,fontWeight:600}}>
                    정말 삭제하시겠습니까?<br/>
                    <span style={{fontWeight:400,fontSize:11.5,color:"var(--text-dim)"}}>채팅과 캐릭터 데이터도 모두 삭제됩니다.</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="coc-btn ghost small" style={{flex:1,justifyContent:"center"}} onClick={()=>setConfirmDelete(false)} disabled={deleting}>취소</button>
                    <button className="coc-btn small" style={{flex:1,justifyContent:"center"}} onClick={handleDelete} disabled={deleting}>
                      {deleting?"삭제 중...":"삭제 확인"}
                    </button>
                  </div>
                </div>
              ):(
                <button className="coc-btn ghost small" style={{width:"100%",justifyContent:"center",color:"var(--text-dim)"}} onClick={handleDelete}>
                  이 세션 삭제
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== CHAR SELECT ============================== */

function CharacterEditModal({initial,roomId,userCode,onClose,onSaved}){
  const [sheet,setSheet]=useState(initial.sheet);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const save=async()=>{
    if(!sheet.name.trim())return;
    setSaving(true);setError("");
    const char={id:initial.id,roomId,ownerCode:userCode,...sheet,createdAt:initial.createdAt||Date.now()};
    const res=await storeSet(`char:${roomId}:${initial.id}`,char,true);
    setSaving(false);
    if(res.ok) onSaved(char);
    else setError(`저장에 실패했습니다.\n오류: ${res.error}`);
  };
  return(
    <div className="coc-modal-backdrop" onClick={onClose}>
      <div className="coc-modal" onClick={e=>e.stopPropagation()}>
        <div style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div className="coc-display" style={{fontSize:15,color:"var(--accent-deep)"}}>탐사자 시트</div>
            <button className="coc-btn ghost small" onClick={onClose} style={{padding:6}}><X size={13}/></button>
          </div>
          <SheetEditor sheet={sheet} setSheet={setSheet} allowRoll={true}/>
          <div className="coc-divider"/>
          {error&&<div style={{color:"var(--accent)",fontSize:11.5,marginBottom:10,whiteSpace:"pre-wrap"}}>{error}</div>}
          <button className="coc-btn" style={{width:"100%",justifyContent:"center",padding:11}} disabled={!sheet.name.trim()||saving} onClick={save}>
            {saving?"저장 중...":"캐릭터 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CharacterSelectScreen({room,userCode,onSelect,onBack}){
  const [myChars,setMyChars]=useState([]);
  const [allChars,setAllChars]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);
  const [viewing,setViewing]=useState(null);

  const refresh=useCallback(async()=>{
    const list=await storeListValues(`char:${room.id}:`,true);
    const chars=list.map(x=>x.value);
    setAllChars(chars);setMyChars(chars.filter(c=>c.ownerCode===userCode));setLoading(false);
  },[room.id,userCode]);

  useEffect(()=>{refresh();const t=setInterval(refresh,4000);return()=>clearInterval(t);},[refresh]);

  const othersChars=allChars.filter(c=>c.ownerCode!==userCode);

  return(
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <button className="coc-btn ghost small" onClick={onBack} style={{marginBottom:14}}><ArrowLeft size={12}/> 세션 목록</button>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
        <div className="coc-display" style={{fontSize:16.5,color:"var(--accent-deep)"}}>{room.title}</div>
        {room.creatorCode===userCode&&<span style={{fontSize:10,fontWeight:700,color:"var(--accent-deep)",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.05em"}}>GM</span>}
      </div>
      <div className="coc-mono" style={{fontSize:10.5,color:"var(--text-faint)",marginBottom:20}}>{fmtDate(room.date)}</div>
      <div className="coc-label" style={{marginBottom:9}}>이 세션에서 플레이할 캐릭터를 선택하세요</div>
      {loading?<div style={{color:"var(--text-faint)",fontSize:12,padding:18}}>불러오는 중...</div>:(
        <div style={{display:"grid",gap:9,marginBottom:22}}>
          {myChars.map(c=>(
            <div key={c.id} className="coc-card" style={{padding:13,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:44,height:44,borderRadius:"50%",overflow:"hidden",background:"var(--bg-panel)",flexShrink:0,border:"1px solid var(--border)"}}>
                {c.avatar?<img src={c.avatar} style={{width:"100%",height:"100%"}} className="coc-avatar"/>:<Sparkles size={18} color="var(--accent-soft)" style={{margin:13}}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{c.name}</div>
                <div className="coc-mono" style={{fontSize:9.5,color:"var(--text-faint)"}}>HP {c.derived?.HP}/{c.derived?.maxHP} · SAN {c.derived?.SAN}/{c.derived?.maxSAN}</div>
              </div>
              <button className="coc-btn ghost small" onClick={()=>setEditing({id:c.id,sheet:c,createdAt:c.createdAt})}><Pencil size={11}/> 수정</button>
              <button className="coc-btn small" onClick={()=>onSelect(c)}>선택</button>
            </div>
          ))}
          <button className="coc-btn ghost" style={{justifyContent:"center",padding:13,borderStyle:"dashed"}}
            onClick={()=>setEditing({id:newId(),sheet:blankCharSheet(),createdAt:Date.now()})}>
            <Plus size={13}/> 새 캐릭터 만들기
          </button>
        </div>
      )}
      {othersChars.length>0&&(
        <>
          <div className="coc-label" style={{marginBottom:9}}>다른 참가자의 탐사자</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:9}}>
            {othersChars.map(c=>(
              <div key={c.id} onClick={()=>setViewing(c)}
                style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",background:"var(--bg-panel)",border:"1px solid var(--border-soft)",borderRadius:20,padding:"5px 13px 5px 5px"}}>
                <div style={{width:27,height:27,borderRadius:"50%",overflow:"hidden",background:"#fff"}}>
                  {c.avatar?<img src={c.avatar} style={{width:"100%",height:"100%"}} className="coc-avatar"/>:<Sparkles size={12} color="var(--accent-soft)" style={{margin:7}}/>}
                </div>
                <span style={{fontSize:12}}>{c.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {editing&&<CharacterEditModal initial={editing} roomId={room.id} userCode={userCode} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);refresh();}}/>}
      {viewing&&(
        <div className="coc-modal-backdrop" onClick={()=>setViewing(null)}>
          <div className="coc-modal" onClick={e=>e.stopPropagation()}>
            <div style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}><button className="coc-btn ghost small" onClick={()=>setViewing(null)} style={{padding:6}}><X size={13}/></button></div>
              <SheetEditor sheet={viewing} setSheet={()=>{}} readOnly/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== CHAT ============================== */

const GM_TABS=[
  {key:"narrate",label:"서술",Icon:BookOpen,placeholder:"스토리를 서술하세요..."},
  {key:"judge",label:"기능치 판정",Icon:Swords,placeholder:"어떤 기능치를 판정합니까?"},
  {key:"npc",label:"대사 (NPC)",Icon:UserRound,placeholder:"NPC의 대사를 입력하세요..."},
];

function calcDiceResult(roll,value){
  const fumble=value>=50?roll>=96:roll===100;
  const success=roll<=value;
  const extreme=roll<=Math.floor(value/5);
  const hard=roll<=Math.floor(value/2);
  if(fumble)   return{label:"대실패",    color:"#b02020",bg:"#fff0f0"};
  if(!success) return{label:"실패",      color:"#888",   bg:"#f6f6f6"};
  if(extreme)  return{label:"극한 성공", color:"#1a7a3a",bg:"#edfaf3"};
  if(hard)     return{label:"어려운 성공",color:"#1f6fa0",bg:"#eaf4ff"};
  return        {label:"보통 성공",       color:"#4a7a1a",bg:"#f4faec"};
}

function DiceCard({line}){
  let data=null;
  try{data=JSON.parse(line);}catch{return <div style={{fontSize:12,color:"var(--text-dim)"}}>{line}</div>;}
  const{skillName,value,roll,label,color,bg}=data;
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:10,border:"1.5px solid "+color,borderRadius:8,background:bg,padding:"7px 12px",marginTop:3}}>
      <div style={{width:44,height:44,borderRadius:6,background:color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span className="coc-mono" style={{fontSize:20,fontWeight:700,color:"#fff"}}>{roll}</span>
      </div>
      <div>
        <div style={{fontSize:11.5,fontWeight:600,color:"var(--text-dim)",marginBottom:2}}>
          {skillName} <span className="coc-mono" style={{fontSize:10,color:"var(--text-faint)"}}>/ {value}</span>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:color}}>{label}</div>
      </div>
    </div>
  );
}

// 1분 이내 + 같은 화자 → 같은 블록
function groupMessages(msgs){
  const groups=[];
  for(const m of msgs){
    const last=groups[groups.length-1];
    const sameBlock=last&&last.speaker===m.speaker&&last.userCode===m.userCode&&last.characterName===m.characterName&&m.timestamp-last.lastTimestamp<60000;
    if(sameBlock){last.lines.push(m.text);last.items.push(m);last.lastTimestamp=m.timestamp;}
    else groups.push({id:m.id,speaker:m.speaker,userCode:m.userCode,characterName:m.characterName,avatar:m.avatar,timestamp:m.timestamp,lastTimestamp:m.timestamp,lines:[m.text],items:[m]});
  }
  return groups;
}

function msgTextColor(){ return "inherit"; }

// 마크다운 서식 파서: **굵게** *기울기* ~~취소선~~ __밑줄__
function parseFormat(text){
  const parts=[];
  const re=/\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|__(.+?)__/g;
  let last=0,m;
  while((m=re.exec(text))!==null){
    if(m.index>last) parts.push({t:"text",v:text.slice(last,m.index)});
    if(m[1]!==undefined) parts.push({t:"bold",v:m[1]});
    else if(m[2]!==undefined) parts.push({t:"italic",v:m[2]});
    else if(m[3]!==undefined) parts.push({t:"strike",v:m[3]});
    else if(m[4]!==undefined) parts.push({t:"under",v:m[4]});
    last=m.index+m[0].length;
  }
  if(last<text.length) parts.push({t:"text",v:text.slice(last)});
  return parts;
}
function FormattedText({text,style={}}){
  const parts=parseFormat(text);
  return(
    <span style={style}>
      {parts.map((p,i)=>{
        if(p.t==="bold") return <strong key={i}>{p.v}</strong>;
        if(p.t==="italic") return <em key={i}>{p.v}</em>;
        if(p.t==="strike") return <s key={i}>{p.v}</s>;
        if(p.t==="under") return <u key={i}>{p.v}</u>;
        return <span key={i}>{p.v}</span>;
      })}
    </span>
  );
}

function MessageBlock({group,myUserCode,isGM,onEdit,onDelete}){
  const{speaker,characterName,avatar,timestamp,lines,items}=group;
  const isAnon=speaker==="narrate"||speaker==="judge";
  const isDice=speaker==="dice";
  const isImg=speaker==="image";
  const isMine=group.userCode===myUserCode;

  // 서술/판정: 헤더 없이 중앙 정렬, 일반 색, 이탤릭 없음 / 수정·삭제는 GM 전용, 마우스를 올렸을 때만 표시
  if(isAnon){
    return(
      <div className="anon-msg" style={{textAlign:"center",padding:"8px 4px"}}>
        {isGM&&isMine&&<span className="msg-actions" style={{display:"inline-flex",gap:3,verticalAlign:"middle",marginRight:4}}>
          {items.length===1&&<button type="button" onClick={()=>onEdit(items[0])} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-faint)",padding:0}}><Pencil size={9}/></button>}
          <button type="button" onClick={()=>onDelete(items[0])} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-faint)",padding:0}}><Trash2 size={9}/></button>
        </span>}
        {lines.map((line,i)=>(
          <div key={i} style={{fontSize:13.5,color:"var(--text)",display:"inline"}}>
            <FormattedText text={line}/>
            {i<lines.length-1&&<br/>}
          </div>
        ))}
      </div>
    );
  }

  return(
    <div style={{display:"flex",gap:9,padding:"5px 0"}}>
      <div style={{width:28,height:28,borderRadius:"50%",overflow:"hidden",background:"var(--bg-panel)",flexShrink:0,border:"1px solid var(--border)",marginTop:1}}>
        {avatar?<img src={avatar} style={{width:"100%",height:"100%"}} className="coc-avatar"/>:<Sparkles size={11} color="var(--accent-soft)" style={{margin:8}}/>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3}}>
          {/* NPC도 일반 캐릭터와 동일하게 */}
          {(speaker==="ic"||speaker==="npc")&&<span style={{color:"var(--accent-deep)",fontWeight:600,fontSize:11}}>{characterName}</span>}
          {isDice&&<span style={{color:"var(--text-dim)",fontSize:11}}>{characterName}</span>}
          {isImg&&<span style={{color:"var(--text-dim)",fontSize:11}}>{characterName}</span>}
          {speaker==="ooc"&&<span style={{color:"var(--text-dim)",fontSize:11}}>{characterName} <span className="coc-mono" style={{fontSize:8}}>OOC</span></span>}
          <span className="coc-mono" style={{fontSize:8.5,color:"var(--text-faint)"}}>{fmtTime(timestamp)}</span>
          {isMine&&!isDice&&!isImg&&(
            <span className="msg-actions" style={{display:"flex",gap:2,marginLeft:1}}>
              {items.length===1&&<button type="button" onClick={()=>onEdit(items[0])} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-faint)",padding:"0 2px",display:"flex"}} title="수정"><Pencil size={9}/></button>}
              <button type="button" onClick={()=>onDelete(items[0])} style={{background:"none",border:"none",cursor:"pointer",color:"#c05050",padding:"0 2px",display:"flex"}} title="삭제"><Trash2 size={9}/></button>
            </span>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {lines.map((line,i)=>{
            if(isDice) return <DiceCard key={i} line={line}/>;
            if(isImg) return <img key={i} src={line} alt="전송된 이미지" style={{maxWidth:260,maxHeight:200,borderRadius:8,border:"1px solid var(--border)",cursor:"pointer",objectFit:"contain"}} onClick={()=>window.open(line,"_blank")}/>;
            return <div key={i} style={{fontSize:13,whiteSpace:"pre-wrap",wordBreak:"break-word"}}><FormattedText text={line}/></div>;
          })}
        </div>
      </div>
    </div>
  );
}

function DicePanel({char,onRollToChat}){
  const [open,setOpen]=useState(false);
  const panelRef=useRef(null);

  useEffect(()=>{
    if(!open)return;
    const handler=e=>{if(panelRef.current&&!panelRef.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[open]);

  const roll=(skillName,value)=>{
    const r=d100();
    const{label,color,bg}=calcDiceResult(r,value);
    onRollToChat(JSON.stringify({skillName,value,roll:r,label,color,bg}));
    setOpen(false);
  };

  return(
    <div ref={panelRef} style={{position:"relative",marginLeft:"auto"}}>
      <button type="button" className="coc-btn ghost small" onClick={()=>setOpen(v=>!v)} style={{gap:5,whiteSpace:"nowrap"}}>
        <Dice5 size={12}/> 다이스
      </button>
      {open&&(
        <div className="coc-scroll" style={{position:"absolute",bottom:"calc(100% + 8px)",right:0,width:300,maxHeight:380,overflowY:"auto",background:"#fff",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",padding:"14px 14px 12px",zIndex:20}}>
          <div className="coc-label" style={{marginBottom:8}}>능력치 판정</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:12}}>
            {CHAR_KEYS.map(k=>{
              const val=char?.characteristics?.[k]||0;
              return(
                <button key={k} type="button" onClick={()=>roll(CHAR_LABEL[k]+" ("+k+")",val)}
                  style={{background:"var(--bg-panel)",border:"1px solid var(--border-soft)",borderRadius:7,padding:"6px 4px",cursor:"pointer",textAlign:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border-soft)"}>
                  <div className="coc-mono" style={{fontSize:8,color:"var(--text-faint)"}}>{CHAR_LABEL[k]}</div>
                  <div className="coc-mono" style={{fontSize:13,color:"var(--accent-deep)",fontWeight:700}}>{val}</div>
                </button>
              );
            })}
          </div>
          <div className="coc-label" style={{marginBottom:7}}>기능치 판정</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:4}}>
            {SKILL_LIST.map(([name])=>{
              const val=char?.skills?.[name]??0;
              return(
                <button key={name} type="button" onClick={()=>roll(name,val)}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"var(--bg-panel)",border:"1px solid var(--border-soft)",borderRadius:6,padding:"4px 7px",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-panel)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--bg-panel)"}>
                  <span style={{fontSize:11,color:"var(--text-dim)"}}>{name}</span>
                  <span className="coc-mono" style={{fontSize:10.5,color:"var(--accent-deep)",fontWeight:700}}>{val}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


function ChatScreen({room,userCode,profile,character,onChangeCharacter,onBack}){
  const [tabs,setTabs]=useState([{id:"main",label:"메인"}]);
  const [activeTab,setActiveTab]=useState("main");
  const [newTabName,setNewTabName]=useState("");
  const [showAddTab,setShowAddTab]=useState(false);
  const [tabMsgMaps,setTabMsgMaps]=useState({"main":new Map()});
  const [text,setText]=useState("");
  const [speaker,setSpeaker]=useState("ic");
  const [gmTab,setGmTab]=useState("narrate");
  const [npcName,setNpcName]=useState("");
  const [char,setChar]=useState(character);
  const [editingChar,setEditingChar]=useState(false);
  const [editingMsg,setEditingMsg]=useState(null);
  const [editText,setEditText]=useState("");
  const [bgmUrl,setBgmUrl]=useState("");
  const [bgmInput,setBgmInput]=useState("");
  const [showBgm,setShowBgm]=useState(false);
  const iframeRef=useRef(null);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const imgInputRef=useRef(null);
  const firstLoad=useRef({});
  const isGM=userCode===room.creatorCode;

  function ytEmbedUrl(url){
    if(!url)return null;
    try{
      const u=new URL(url);let v="";
      if(u.hostname.includes("youtu.be"))v=u.pathname.slice(1);
      else if(u.searchParams.get("v"))v=u.searchParams.get("v");
      if(!v)return null;
      return`https://www.youtube.com/embed/${v}?autoplay=1&loop=1&playlist=${v}&controls=1&modestbranding=1`;
    }catch{return null;}
  }

  const refreshTabs=useCallback(async()=>{
    const data=await storeGet(`tabs:${room.id}`,true);
    if(data&&Array.isArray(data)){
      setTabs(data);
      setTabMsgMaps(prev=>{
        const next={...prev};
        data.forEach(t=>{if(!next[t.id])next[t.id]=new Map();});
        return next;
      });
    }
  },[room.id]);

  const refreshTab=useCallback(async(tabId)=>{
    const prefix=tabId==="main"?`chat:${room.id}:`:`chat:${room.id}:${tabId}:`;
    const list=await storeListValues(prefix,true);
    const filtered=tabId==="main"
      ?list.filter(x=>!x.value.tabId||x.value.tabId==="main")
      :list;
    setTabMsgMaps(prev=>{
      const next=new Map(prev[tabId]||new Map());
      for(const{value:m}of filtered)next.set(m.id,m);
      return{...prev,[tabId]:next};
    });
    if(!firstLoad.current[tabId]){
      firstLoad.current[tabId]=true;
      setTimeout(()=>bottomRef.current?.scrollIntoView({block:"end"}),50);
    }
  },[room.id]);

  const refreshBgm=useCallback(async()=>{
    const d=await storeGet(`bgm:${room.id}`,true);
    if(d)setBgmUrl(d.url||"");
  },[room.id]);

  useEffect(()=>{refreshTabs();const t=setInterval(refreshTabs,5000);return()=>clearInterval(t);},[refreshTabs]);
  useEffect(()=>{refreshTab(activeTab);const t=setInterval(()=>refreshTab(activeTab),3000);return()=>clearInterval(t);},[activeTab,refreshTab]);
  useEffect(()=>{refreshBgm();const t=setInterval(refreshBgm,4000);return()=>clearInterval(t);},[refreshBgm]);
  useEffect(()=>{setChar(character);},[character]);

  const handleSetBgm=async()=>{const url=bgmInput.trim();setBgmUrl(url);await storeSet(`bgm:${room.id}`,{url},true);setBgmInput("");};
  const handleStopBgm=async()=>{setBgmUrl("");await storeSet(`bgm:${room.id}`,{url:""},true);};

  const addTab=async()=>{
    const label=newTabName.trim();if(!label)return;
    const newTab={id:newId(),label};
    const next=[...tabs,newTab];
    setTabs(next);
    setTabMsgMaps(prev=>({...prev,[newTab.id]:new Map()}));
    await storeSet(`tabs:${room.id}`,next,true);
    setActiveTab(newTab.id);
    setNewTabName("");setShowAddTab(false);
  };
  const removeTab=async(tabId)=>{
    if(tabId==="main")return;
    const next=tabs.filter(t=>t.id!==tabId);
    setTabs(next);
    await storeSet(`tabs:${room.id}`,next,true);
    if(activeTab===tabId)setActiveTab("main");
  };

  const doSend=useCallback(async(sp,msgText,charName,av,tabId)=>{
    const t=msgText.trim();if(!t)return false;
    const tid=tabId||activeTab;
    const msgId=newId();
    const key=tid==="main"?`chat:${room.id}:${msgId}`:`chat:${room.id}:${tid}:${msgId}`;
    const msg={id:msgId,roomId:room.id,userCode,tabId:tid,speaker:sp,characterName:charName,avatar:av||"",text:t,timestamp:Date.now()};
    setTabMsgMaps(prev=>({...prev,[tid]:new Map(prev[tid]||new Map()).set(msg.id,msg)}));
    setTimeout(()=>bottomRef.current?.scrollIntoView({block:"end",behavior:"smooth"}),20);
    storeSet(key,msg,true).then(r=>{if(!r.ok)console.error("저장 실패:",r.error);});
    return true;
  },[room.id,userCode,activeTab]);

  const send=async()=>{
    const t=text.trim();if(!t)return;
    let ok=false;
    if(isGM&&speaker==="gm"){
      const name=gmTab==="npc"?(npcName.trim()||"NPC"):(profile.name||userCode);
      ok=await doSend(gmTab,t,name,profile.avatar);
    }else if(speaker==="ooc"){ok=await doSend("ooc",t,profile.name||userCode,profile.avatar);}
    else{ok=await doSend("ic",t,char.name,char.avatar);}
    if(ok){setText("");setTimeout(()=>inputRef.current?.focus(),10);}
  };

  const sendImage=async(file)=>{
    const dataUrl=await fileToResizedDataURL(file,480);
    const tid=activeTab;
    const msgId=newId();
    const key=tid==="main"?`chat:${room.id}:${msgId}`:`chat:${room.id}:${tid}:${msgId}`;
    const msg={id:msgId,roomId:room.id,userCode,tabId:tid,speaker:"image",characterName:char.name||profile.name||userCode,avatar:char.avatar||"",text:dataUrl,timestamp:Date.now()};
    setTabMsgMaps(prev=>({...prev,[tid]:new Map(prev[tid]||new Map()).set(msg.id,msg)}));
    setTimeout(()=>bottomRef.current?.scrollIntoView({block:"end",behavior:"smooth"}),20);
    storeSet(key,msg,true);
  };

  const sendDice=r=>doSend("dice",r,char.name,char.avatar);
  const handleKeyDown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
  const placeholder=()=>{
    if(speaker==="ooc")return"OOC 발언...";
    if(isGM&&speaker==="gm")return GM_TABS.find(x=>x.key===gmTab)?.placeholder||"";
    return`${char?.name||"캐릭터"}의 대사나 행동을 입력하세요...`;
  };

  const startEdit=msg=>{setEditingMsg(msg);setEditText(msg.text);};
  const submitEdit=async()=>{
    if(!editingMsg||!editText.trim())return;
    const tid=editingMsg.tabId||"main";
    const updated={...editingMsg,text:editText.trim()};
    setTabMsgMaps(prev=>({...prev,[tid]:new Map(prev[tid]||new Map()).set(updated.id,updated)}));
    const key=tid==="main"?`chat:${room.id}:${updated.id}`:`chat:${room.id}:${tid}:${updated.id}`;
    storeSet(key,updated,true);
    setEditingMsg(null);setEditText("");
  };
  const deleteMsg=async msg=>{
    if(!window.confirm("이 메시지를 삭제하시겠습니까?"))return;
    const tid=msg.tabId||"main";
    setTabMsgMaps(prev=>{const m=new Map(prev[tid]||new Map());m.delete(msg.id);return{...prev,[tid]:m};});
    const key=tid==="main"?`chat:${room.id}:${msg.id}`:`chat:${room.id}:${tid}:${msg.id}`;
    storeDelete(key,true);
  };

  const insertFormat=(open,close)=>{
    const el=inputRef.current;if(!el)return;
    const s=el.selectionStart,e=el.selectionEnd;
    const sel=text.slice(s,e);
    const next=text.slice(0,s)+open+sel+close+text.slice(e);
    setText(next);
    setTimeout(()=>{el.focus();el.setSelectionRange(s+open.length,s+open.length+sel.length);},0);
  };

  const currentMsgs=Array.from((tabMsgMaps[activeTab]||new Map()).values()).sort((a,b)=>a.timestamp-b.timestamp);
  const groups=groupMessages(currentMsgs);
  const embedUrl=ytEmbedUrl(bgmUrl);
  const speakerBtnStyle=active=>({
    background:active?"var(--accent)":"#fff",
    border:"1px solid "+(active?"var(--accent)":"var(--border)"),
    color:active?"#fff":"var(--text-dim)",
    boxShadow:active?"0 2px 8px rgba(0,0,0,0.12)":"none",
  });

  return(
    <div style={{maxWidth:740,margin:"0 auto",display:"flex",flexDirection:"column",height:"calc(100vh - 140px)"}}>
      {embedUrl&&<iframe ref={iframeRef} src={embedUrl} title="BGM" style={{position:"fixed",top:-9999,left:-9999,width:1,height:1,opacity:0,pointerEvents:"none"}} allow="autoplay; encrypted-media"/>}

      {/* 헤더 */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}}>
        <div>
          <button className="coc-btn ghost small" onClick={onBack} style={{marginBottom:7}}><ArrowLeft size={12}/> 세션 목록</button>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div className="coc-display" style={{fontSize:15.5,color:"var(--accent-deep)"}}>{room.title}</div>
            {isGM&&<span style={{fontSize:10.5,fontWeight:700,color:"var(--accent-deep)",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.05em"}}>GM</span>}
          </div>
          <div className="coc-mono" style={{fontSize:10,color:"var(--text-faint)"}}>{fmtDate(room.date)}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <button type="button" className="coc-btn ghost small" onClick={()=>setShowBgm(v=>!v)} style={{color:bgmUrl?"var(--accent-deep)":"var(--text-faint)"}}>
            BGM {bgmUrl?"재생 중":"없음"}
          </button>
          <div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",border:"1px solid var(--accent-soft)",background:"var(--bg-panel)"}}>
            {char?.avatar?<img src={char.avatar} style={{width:"100%",height:"100%"}} className="coc-avatar"/>:<Sparkles size={13} color="var(--accent-soft)" style={{margin:9}}/>}
          </div>
          <div>
            <div style={{fontSize:12.5,fontWeight:600}}>{char?.name}</div>
            <div className="coc-mono" style={{fontSize:8.5,color:"var(--text-faint)"}}>HP {char?.derived?.HP}/{char?.derived?.maxHP} SAN {char?.derived?.SAN}/{char?.derived?.maxSAN}</div>
          </div>
          <button className="coc-btn ghost small" onClick={()=>setEditingChar(true)}><Pencil size={11}/></button>
          <button className="coc-btn ghost small" onClick={onChangeCharacter}><Users size={11}/></button>
        </div>
      </div>

      {/* BGM 패널 */}
      {showBgm&&(
        <div style={{background:"var(--bg-panel)",border:"1px solid var(--border-soft)",borderRadius:10,padding:"11px 13px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
            <div className="coc-label">BGM</div>
            <button type="button" onClick={()=>setShowBgm(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-faint)",padding:2}}><X size={13}/></button>
          </div>
          {bgmUrl&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{flex:1,fontSize:11.5,color:"var(--text-dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bgmUrl}</div>
            <button type="button" className="coc-btn ghost small" onClick={handleStopBgm}>정지</button>
          </div>}
          {isGM&&<div style={{display:"flex",gap:7}}>
            <input className="coc-input" value={bgmInput} onChange={e=>setBgmInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();handleSetBgm();}}} placeholder="YouTube 링크를 붙여넣으세요" style={{flex:1,fontSize:12}}/>
            <button type="button" className="coc-btn small" onClick={handleSetBgm} disabled={!bgmInput.trim()}>설정</button>
          </div>}
          {!isGM&&!bgmUrl&&<div style={{fontSize:12,color:"var(--text-faint)"}}>GM이 BGM을 설정하면 자동으로 재생됩니다.</div>}
        </div>
      )}

      {/* 채팅 탭바 */}
      <div className="chat-tab-bar">
        {tabs.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center"}}>
            <div className={"chat-tab"+(activeTab===t.id?" active":"")} onClick={()=>setActiveTab(t.id)}>{t.label}</div>
            {isGM&&t.id!=="main"&&(
              <button type="button" onClick={()=>removeTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-faint)",padding:"0 4px",fontSize:14,lineHeight:1,opacity:0.5}}>×</button>
            )}
          </div>
        ))}
        {isGM&&(
          showAddTab?(
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 6px"}}>
              <input value={newTabName} onChange={e=>setNewTabName(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addTab();}if(e.key==="Escape")setShowAddTab(false);}}
                placeholder="탭 이름" autoFocus
                style={{width:90,fontSize:11.5,padding:"3px 7px",border:"1px solid var(--border)",borderRadius:5,outline:"none",color:"var(--text)",background:"#fff"}}/>
              <button type="button" className="coc-btn small" style={{padding:"3px 8px",fontSize:10.5}} onClick={addTab} disabled={!newTabName.trim()}>추가</button>
              <button type="button" className="coc-btn ghost small" style={{padding:"3px 6px"}} onClick={()=>setShowAddTab(false)}><X size={10}/></button>
            </div>
          ):(
            <div className="chat-tab" onClick={()=>setShowAddTab(true)} style={{opacity:0.5,cursor:"pointer",display:"flex",alignItems:"center",gap:2}}><Plus size={10}/> 탭 추가</div>
          )
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="coc-card coc-scroll" style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:1}}>
        {groups.length===0&&(
          <div style={{margin:"auto",color:"var(--text-faint)",fontSize:12,textAlign:"center"}}>
            <MessageCircle size={20} style={{marginBottom:7,opacity:0.5}}/><br/>아직 기록이 없습니다. 첫 문장을 남겨보세요.
          </div>
        )}
        {groups.map(g=><MessageBlock key={g.id} group={g} myUserCode={userCode} isGM={isGM} onEdit={startEdit} onDelete={deleteMsg}/>)}
        <div ref={bottomRef}/>
      </div>

      {/* 메시지 수정 모달 */}
      {editingMsg&&(
        <div className="coc-modal-backdrop" onClick={()=>setEditingMsg(null)}>
          <div className="coc-modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div className="coc-display" style={{fontSize:14,color:"var(--accent-deep)"}}>메시지 수정</div>
                <button className="coc-btn ghost small" onClick={()=>setEditingMsg(null)} style={{padding:5}}><X size={12}/></button>
              </div>
              <textarea className="coc-input" rows={4} value={editText} onChange={e=>setEditText(e.target.value)} autoFocus style={{marginBottom:12}}/>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button className="coc-btn ghost small" onClick={()=>setEditingMsg(null)}>취소</button>
                <button className="coc-btn small" onClick={submitEdit} disabled={!editText.trim()}>수정 완료</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 입력창 */}
      <div style={{marginTop:8}}>
        <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap"}}>
          <button type="button" className="coc-btn small" style={speakerBtnStyle(speaker==="ic")} onClick={()=>setSpeaker("ic")}><Sparkles size={11}/> {char?.name||"캐릭터"}</button>
          <button type="button" className="coc-btn small" style={speakerBtnStyle(speaker==="ooc")} onClick={()=>setSpeaker("ooc")}>💬 OOC</button>
          {isGM&&<button type="button" className="coc-btn small" style={speakerBtnStyle(speaker==="gm")} onClick={()=>setSpeaker("gm")}><Crown size={11}/> GM</button>}
          <DicePanel char={char} onRollToChat={sendDice}/>
        </div>
        {isGM&&speaker==="gm"&&(
          <div style={{display:"flex",gap:5,marginBottom:6,flexWrap:"wrap"}}>
            {GM_TABS.map(({key,label,Icon})=>(
              <button key={key} type="button" className="coc-btn small" style={speakerBtnStyle(gmTab===key)} onClick={()=>setGmTab(key)}><Icon size={11}/> {label}</button>
            ))}
          </div>
        )}
        {isGM&&speaker==="gm"&&gmTab==="npc"&&(
          <input className="coc-input" value={npcName} onChange={e=>setNpcName(e.target.value)} placeholder="NPC 이름 (미입력 시 'NPC')" style={{marginBottom:6}}/>
        )}
        {/* 서식 툴바 */}
        <div style={{display:"flex",gap:3,marginBottom:5,alignItems:"center"}}>
          {[
            {label:"B",style:{fontWeight:700},o:"**",c:"**",title:"굵게"},
            {label:"I",style:{fontStyle:"italic"},o:"*",c:"*",title:"기울기"},
            {label:"U",style:{textDecoration:"underline"},o:"__",c:"__",title:"밑줄"},
            {label:"S",style:{textDecoration:"line-through"},o:"~~",c:"~~",title:"취소선"},
          ].map((f,i)=>(
            <button key={i} type="button" title={f.title} onClick={()=>insertFormat(f.o,f.c)}
              style={{background:"none",border:"1px solid var(--border)",borderRadius:5,padding:"2px 8px",cursor:"pointer",color:"var(--text-dim)",fontSize:11,...f.style,minWidth:26,textAlign:"center"}}>
              {f.label}
            </button>
          ))}
          <div style={{width:1,height:16,background:"var(--border)",margin:"0 2px"}}/>
          {/* 이미지 전송 */}
          <button type="button" title="이미지 전송" onClick={()=>imgInputRef.current?.click()}
            style={{background:"none",border:"1px solid var(--border)",borderRadius:5,padding:"2px 8px",cursor:"pointer",color:"var(--text-dim)",fontSize:11}}>
            🖼
          </button>
          <input ref={imgInputRef} type="file" accept="image/*" style={{display:"none"}}
            onChange={async e=>{const f=e.target.files?.[0];if(!f)return;await sendImage(f);e.target.value="";}}/>
        </div>
        <div style={{display:"flex",gap:7}}>
          <textarea ref={inputRef} className="coc-input" rows={2} value={text}
            onChange={e=>setText(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={placeholder()} style={{flex:1,resize:"none"}}/>
          <button type="button" className="coc-btn" style={{flexShrink:0,alignSelf:"flex-end",padding:"10px 14px"}} onClick={send}><Send size={13}/></button>
        </div>
        <div style={{fontSize:10,color:"var(--text-faint)",marginTop:4}}>Enter: 전송 · Shift+Enter: 줄바꿈</div>
      </div>

      {editingChar&&<CharacterEditModal initial={{id:char.id,sheet:char,createdAt:char.createdAt}} roomId={room.id} userCode={userCode} onClose={()=>setEditingChar(false)} onSaved={c=>{setChar(c);setEditingChar(false);}}/>}
    </div>
  );
}

/* ============================== ERROR BOUNDARY ============================== */
// 렌더링 중 에러가 나면 하얀 화면 대신 실제 에러 내용을 화면에 보여줍니다.
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null, info: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ this.setState({ info }); console.error("[TRPG APP CRASH]", error, info); }
  render(){
    if (this.state.error) {
      return (
        <div style={{minHeight:"100vh",padding:20,fontFamily:"monospace",background:"#fff5f5",color:"#7a1a1a"}}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:10}}>⚠️ 화면에 에러가 발생했습니다</div>
          <div style={{marginBottom:14}}>
            <button
              onClick={()=>this.setState({error:null,info:null})}
              style={{padding:"6px 12px",marginRight:8,cursor:"pointer"}}>
              다시 시도
            </button>
          </div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{String(this.state.error && this.state.error.message)}</div>
          <pre style={{whiteSpace:"pre-wrap",fontSize:11,background:"#fff",border:"1px solid #eab",borderRadius:6,padding:12,overflowX:"auto"}}>
{String(this.state.error && this.state.error.stack)}
          </pre>
          {this.state.info && (
            <details style={{marginTop:10}}>
              <summary style={{cursor:"pointer",fontSize:12}}>컴포넌트 스택 보기</summary>
              <pre style={{whiteSpace:"pre-wrap",fontSize:11,background:"#fff",border:"1px solid #eab",borderRadius:6,padding:12,overflowX:"auto"}}>
{this.state.info.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================== APP ============================== */

function AppInner(){
  const [user,setUser]=useState(null);
  const [tab,setTab]=useState("rooms");
  const [profile,setProfile]=useState(blankProfile());
  const [profileLoaded,setProfileLoaded]=useState(false);
  const [activeRoom,setActiveRoom]=useState(null);
  const [activeChar,setActiveChar]=useState(null);
  const [themeKey,setThemeKey]=useState("sky");

  useEffect(()=>{
    if(!user)return;
    (async()=>{
      const p=await storeGet(`profile:${user.code}`,true);
      setProfile(p||blankProfile(user.name));
      setProfileLoaded(true);
      // 저장된 테마 불러오기 (shared:true, 코드별 키)
      const t=await storeGet(`theme:${user.code}`,true);
      if(t&&THEMES[t]) setThemeKey(t);
      else setThemeKey("sky"); // 기본값 강제
    })();
  },[user]);

  const handleTheme=k=>{
    setThemeKey(k);
    if(user) storeSet(`theme:${user.code}`,k,true);
  };

  const theme=THEMES[themeKey];

  if(!user) return(
    <div className="coc-root" style={themeVars(theme)}>
      <style>{CSS}</style>
      <LoginScreen onLogin={setUser}/>
    </div>
  );

  const logout=()=>{setUser(null);setActiveRoom(null);setActiveChar(null);setTab("rooms");};

  let body;
  if(activeRoom&&!activeChar){
    body=<CharacterSelectScreen room={activeRoom} userCode={user.code} onSelect={c=>setActiveChar(c)} onBack={()=>setActiveRoom(null)}/>;
  }else if(activeRoom&&activeChar){
    body=<ChatScreen room={activeRoom} userCode={user.code} profile={profile} character={activeChar} onChangeCharacter={()=>setActiveChar(null)} onBack={()=>{setActiveRoom(null);setActiveChar(null);}}/>;
  }else if(tab==="settings"){
    body=<SettingsTab currentTheme={themeKey} setCurrentTheme={handleTheme}/>;
  }else if(tab==="profile"){
    body=profileLoaded&&<MyPage userCode={user.code} profile={profile} setProfile={setProfile}/>;
  }else{
    body=<RoomsTab userCode={user.code} onEnterRoom={r=>setActiveRoom(r)}/>;
  }

  return(
    <div className="coc-root" style={themeVars(theme)}>
      <style>{CSS}</style>
      <div style={{position:"relative",zIndex:1,padding:"20px 16px 56px"}}>
        {!activeRoom&&(
          <div style={{maxWidth:680,margin:"0 auto 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Sun size={16} color="var(--accent)"/>
              <span className="coc-display" style={{fontSize:13,color:"var(--accent-deep)"}}>무츄의 하루</span>
              <span style={{fontSize:11,color:"var(--text-faint)",marginLeft:6}}>· {profile.name||user.name}님</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div className="coc-tabbar">
                <div className={"coc-tab"+(tab==="rooms"?" active":"")} onClick={()=>setTab("rooms")}>세션</div>
                <div className={"coc-tab"+(tab==="profile"?" active":"")} onClick={()=>setTab("profile")}>마이페이지</div>
                <div className={"coc-tab"+(tab==="settings"?" active":"")} onClick={()=>setTab("settings")}>설정</div>
              </div>
              <button className="coc-btn ghost small" onClick={logout}><LogOut size={11}/> 로그아웃</button>
            </div>
          </div>
        )}
        {body}
      </div>
    </div>
  );
}

export default function App(){
  return (
    <ErrorBoundary>
      <AppInner/>
    </ErrorBoundary>
  );
}
