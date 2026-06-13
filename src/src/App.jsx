import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE CLIENT ───────────────────────────────────────────
const SUPABASE_URL = "https://qoldanexmrpkqmxnyugs.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbGRhbmV4bXJwa3FteG55dWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjg2MTYsImV4cCI6MjA5Njk0NDYxNn0.knNo9kLHWn7iXJiT57T1CxWI-_RCQFtil5HoDErWmAk";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const T = {
  navy:"#003087",navyDark:"#001F5C",red:"#CF142B",gold:"#FFD700",goldDark:"#C8A800",
  parchment:"#F5EBC8",brown:"#3B2F2F",brownMid:"#5C4A4A",brownLight:"#8B7355",
  white:"#FFFFFF",offWhite:"#FAF7F0",muted:"#9B8E7A",border:"#D4C9A8",
  success:"#2E7D32",successL:"#C8E6C9",danger:"#B71C1C",dangerL:"#FFCDD2",
  amber:"#F59E0B",amberL:"#FEF3C7",teal:"#0097A7",tealL:"#E0F7FA",
  purple:"#7C3AED",purpleL:"#EDE9FE",
};
const GOAL_CATS={Training:{dark:"#1565C0",light:"#BBDEFB"},Nutrition:{dark:"#2E7D32",light:"#C8E6C9"},Sleep:{dark:"#4A148C",light:"#E1BEE7"},Activity:{dark:"#E65100",light:"#FFE0B2"},Lifestyle:{dark:"#37474F",light:"#ECEFF1"}};
// Local storage fallback (used until Supabase loads)
const S={
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
};

// Supabase data helpers — save & load per user
const DB = {
  async save(userId, table, data) {
    try {
      const { error } = await supabase.from(table).upsert(
        { user_id: userId, data: JSON.stringify(data), updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (error) console.warn("Supabase save error:", error.message);
    } catch(e) { console.warn("Supabase save failed:", e); }
  },
  async load(userId, table, fallback) {
    try {
      const { data, error } = await supabase.from(table).select("data").eq("user_id", userId).single();
      if (error || !data) return fallback;
      return JSON.parse(data.data);
    } catch(e) { return fallback; }
  },
  async saveProfile(userId, profile) {
    try {
      const { error } = await supabase.from("profiles").upsert(
        { user_id: userId, ...profile, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (error) console.warn("Profile save error:", error.message);
    } catch(e) { console.warn("Profile save failed:", e); }
  },
  async loadProfile(userId) {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      if (error || !data) return null;
      return data;
    } catch(e) { return null; }
  }
};
const DEFAULT_HABITS=[{id:1,name:"Sleep 7+ hours",emoji:"😴"},{id:2,name:"Water (2L+)",emoji:"💧"},{id:3,name:"Protein hit",emoji:"🥩"},{id:4,name:"No alcohol",emoji:"🚫"},{id:5,name:"10k steps",emoji:"👟"},{id:6,name:"Stretching",emoji:"🧘"}];
const UPPER_EX=["Single Arm Pulldown","Flat Barbell Bench Press","Smith Machine Shoulder Press","Wide Grip T-Bar Row","Wide Grip Flat Pulldown","Incline Tricep Extension","Incline Dumbbell Curl","Pec Fly Machine","Lateral Raise Machine","Exercise 1"];
const LOWER_EX=["Leg Press Calf Raise","Hack Squat","Romanian Deadlift","Leg Extension","Lying Leg Curl","Seated Adduction Machine","Exercise 2"];
const MEASUREMENTS=["Chest","Waist","Hips","Left Arm","Right Arm","Left Thigh","Right Thigh","Neck","Shoulders","Calves"];
const CARDIO_TYPES=["Running","Cycling","Walking","Swimming","Rowing","HIIT","CrossFit","Boxing","Football","Tennis","Basketball","Yoga","Pilates","Hiking","Jump Rope","Elliptical","Stair Climber","Other"];
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',sans-serif;background:#F5EBC8;color:#3B2F2F;-webkit-font-smoothing:antialiased;}
.app{display:flex;flex-direction:column;min-height:100vh;max-width:480px;margin:0 auto;background:#FAF7F0;}
.nav{background:#003087;padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:56px;position:sticky;top:0;z-index:100;border-bottom:3px solid #FFD700;}
.nav-brand{display:flex;align-items:center;gap:10px;}
.nav-title{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:#FFF;letter-spacing:.05em;line-height:1;}
.nav-sub{font-size:10px;color:#FFD700;letter-spacing:.08em;text-transform:uppercase;}
.nav-av{width:34px;height:34px;border-radius:50%;background:#FFD700;color:#003087;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid #FFF;}
.tbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#003087;border-top:3px solid #FFD700;display:flex;height:64px;z-index:100;}
.ti{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;background:none;border:none;padding:6px 0;}
.ti-icon{font-size:20px;line-height:1;}
.ti-label{font-size:9px;font-weight:500;letter-spacing:.04em;color:rgba(255,255,255,.4);text-transform:uppercase;}
.ti.active .ti-label{color:#FFD700;}
.content{flex:1;padding:16px 16px 80px;overflow-y:auto;}
.shdr{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#9B8E7A;margin:20px 0 10px;display:flex;align-items:center;gap:8px;}
.shdr::after{content:'';flex:1;height:1px;background:#D4C9A8;}
.card{background:#FFF;border-radius:12px;border:1px solid #D4C9A8;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(59,47,47,.06);}
.ct{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:600;color:#3B2F2F;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
.stat2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
.stat3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;}
.sc{background:#003087;border-radius:10px;padding:12px 10px;text-align:center;}
.sv{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:700;color:#FFD700;line-height:1;}
.sl{font-size:9px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.06em;margin-top:3px;}
.pbw{background:#F5EBC8;border-radius:99px;height:8px;overflow:hidden;}
.pbf{height:100%;border-radius:99px;transition:width .4s ease;}
.btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 20px;border-radius:10px;border:none;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .15s;width:100%;}
.bp{background:#003087;color:#FFF;}
.bg{background:#FFD700;color:#003087;}
.bo{background:transparent;color:#003087;border:2px solid #003087;}
.br{background:#CF142B;color:#FFF;}
.bsm{padding:8px 14px;font-size:13px;width:auto;border-radius:8px;}
.iw{margin-bottom:14px;}
.il{font-size:11px;font-weight:600;color:#9B8E7A;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px;display:block;}
.inp{width:100%;background:#F5EBC8;border:1.5px solid #D4C9A8;border-radius:10px;padding:12px 14px;font-size:15px;color:#3B2F2F;outline:none;transition:border-color .15s;font-family:'Inter',sans-serif;}
.inp:focus{border-color:#003087;background:#FFF;}
.setg{display:grid;grid-template-columns:28px 1fr 1fr 1fr 36px;gap:6px;align-items:center;margin-bottom:6px;}
.snum{width:28px;height:28px;border-radius:50%;background:#003087;color:#FFF;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.slbl{font-size:11px;font-weight:600;color:#9B8E7A;text-align:center;}
.sinp{background:#F5EBC8;border:1.5px solid #D4C9A8;border-radius:8px;padding:8px 4px;text-align:center;font-size:16px;font-weight:600;color:#3B2F2F;width:100%;outline:none;}
.sinp:focus{border-color:#003087;background:#FFF;}
.stk{width:32px;height:32px;border-radius:8px;border:2px solid #D4C9A8;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;}
.stk.done{background:#C8E6C9;border-color:#2E7D32;}
.hr{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #D4C9A8;}
.hr:last-child{border-bottom:none;}
.htk{width:36px;height:36px;border-radius:50%;border:2px solid #D4C9A8;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;background:none;flex-shrink:0;}
.htk.done{background:#C8E6C9;border-color:#2E7D32;}
.htk.miss{background:#FFCDD2;border-color:#B71C1C;}
.ws{display:flex;gap:5px;margin-bottom:12px;}
.wd{flex:1;background:#FFF;border:1.5px solid #D4C9A8;border-radius:8px;padding:7px 3px;text-align:center;cursor:pointer;transition:all .15s;}
.wd.active{background:#003087;border-color:#003087;}
.wdn{font-size:8px;font-weight:600;color:#9B8E7A;text-transform:uppercase;}
.wdnum{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:700;color:#3B2F2F;line-height:1;margin-top:1px;}
.wd.active .wdn{color:#FFD700;}
.wd.active .wdnum{color:#FFF;}
.wd.dot::after{content:'';display:block;width:4px;height:4px;border-radius:50%;background:#FFD700;margin:2px auto 0;}
.tp{display:flex;gap:6px;margin-bottom:16px;overflow-x:auto;padding-bottom:2px;}
.tpill{padding:7px 14px;border-radius:99px;border:1.5px solid #D4C9A8;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer;background:#FFF;color:#5C4A4A;flex-shrink:0;}
.tpill.active{background:#003087;border-color:#003087;color:#FFF;}
.toast{position:fixed;bottom:76px;left:50%;transform:translateX(-50%);background:#003087;color:#FFF;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:500;border-top:2px solid #FFD700;white-space:nowrap;animation:su .2s ease;z-index:200;}
@keyframes su{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
.cb{background:linear-gradient(135deg,#003087,#001F5C);border-radius:12px;padding:16px;margin-bottom:12px;border-left:4px solid #FFD700;}
.cbt{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:600;color:#FFD700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;}
.cbtx{font-size:13px;color:rgba(255,255,255,.8);line-height:1.5;}
.ehdr{background:linear-gradient(135deg,#003087,#001F5C);border-radius:12px;padding:16px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
.en{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;color:#FFF;letter-spacing:.04em;}
.ebg{background:#FFD700;color:#003087;font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;text-transform:uppercase;}
.bpos{background:#C8E6C9;color:#2E7D32;font-size:12px;font-weight:600;padding:2px 8px;border-radius:99px;}
.bneg{background:#FFCDD2;color:#B71C1C;font-size:12px;font-weight:600;padding:2px 8px;border-radius:99px;}
.bneu{background:#F5EBC8;color:#9B8E7A;font-size:12px;font-weight:600;padding:2px 8px;border-radius:99px;}
.mg{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
.dc{aspect-ratio:1;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;cursor:pointer;background:#F5EBC8;color:#5C4A4A;}
.dc.today{border:2px solid #003087;}
.dc.full{background:#C8E6C9;color:#2E7D32;font-weight:700;}
.dc.part{background:#FEF3C7;color:#F59E0B;font-weight:700;}
.dc.emp{background:transparent;color:transparent;cursor:default;}
.dh{font-size:9px;font-weight:600;color:#9B8E7A;text-align:center;padding:3px 0;}
.div{height:1px;background:#D4C9A8;margin:14px 0;}
.fb{display:flex;align-items:center;gap:8px;}
.fbt{display:flex;align-items:center;justify-content:space-between;}
.tm{font-size:12px;color:#9B8E7A;}
.lw{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#003087;padding:24px;}
.lt{font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:700;color:#FFF;letter-spacing:.08em;text-align:center;margin-bottom:4px;}
.ls{font-size:13px;color:#FFD700;letter-spacing:.1em;text-transform:uppercase;text-align:center;margin-bottom:32px;}
.lc{background:#FAF7F0;border-radius:16px;padding:24px;width:100%;max-width:360px;}
.mo{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:300;display:flex;align-items:flex-end;justify-content:center;}
.md{background:#FFF;border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;}
.mh{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;color:#3B2F2F;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;}
.week-overview{background:#FFF;border-radius:12px;border:1px solid #D4C9A8;overflow:hidden;margin-bottom:12px;}
.wo-header{background:#003087;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;}
.wo-title{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:#FFD700;letter-spacing:.06em;text-transform:uppercase;}
.wo-week{font-size:11px;color:rgba(255,255,255,.7);}
.wo-days{display:grid;grid-template-columns:repeat(7,1fr);}
.wo-day{padding:10px 4px;text-align:center;border-right:1px solid #F0EBD8;}
.wo-day:last-child{border-right:none;}
.wo-day.today{background:#FFF9E6;}
.wo-day-name{font-size:9px;font-weight:600;color:#9B8E7A;text-transform:uppercase;}
.wo-day-num{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:#3B2F2F;line-height:1;margin:2px 0;}
.wo-day.today .wo-day-num{color:#003087;}
.wo-dot{width:6px;height:6px;border-radius:50%;margin:0 auto;}
.wo-stats{padding:12px 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-top:1px solid #F0EBD8;}
.wo-stat{text-align:center;}
.wo-stat-val{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:#003087;}
.wo-stat-lbl{font-size:9px;color:#9B8E7A;text-transform:uppercase;letter-spacing:.05em;}
.form-steps{display:flex;gap:4px;margin-bottom:20px;}
.form-step{flex:1;height:3px;border-radius:99px;background:#D4C9A8;}
.form-step.done{background:#003087;}
.form-step.active{background:#FFD700;}
.sync-link{display:flex;align-items:center;gap:12px;padding:14px;border-radius:10px;background:#F5EBC8;border:1.5px solid #D4C9A8;margin-bottom:10px;cursor:pointer;text-decoration:none;}
.sync-link-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.sync-link-title{font-weight:600;font-size:14px;color:#3B2F2F;}
.sync-link-sub{font-size:12px;color:#9B8E7A;margin-top:1px;}
.sync-link-arrow{margin-left:auto;color:#9B8E7A;font-size:18px;}
.compliance-row{margin-bottom:12px;}
.compliance-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
.compliance-name{font-size:13px;font-weight:500;color:#3B2F2F;}
.compliance-pct{font-size:13px;font-weight:700;}
`;

function Roundel({size=36}){
  const r=size/2;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><circle cx={r} cy={r} r={r} fill="#FFD700"/><circle cx={r} cy={r} r={r*.82} fill="#CF142B"/><circle cx={r} cy={r} r={r*.58} fill="#FFF"/><circle cx={r} cy={r} r={r*.35} fill="#003087"/></svg>;
}

function ScoreRing({pct,size=88}){
  const r=38,circ=2*Math.PI*r,dash=(pct/100)*circ;
  const col=pct>=80?T.success:pct>=50?T.amber:T.red;
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{transform:"rotate(-90deg)"}}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#F5EBC8" strokeWidth="10"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:700,color:T.navy,lineHeight:1}}>{pct}%</span>
        <span style={{fontSize:9,color:T.muted}}>score</span>
      </div>
    </div>
  );
}

function useToast(){
  const[msg,setMsg]=useState("");
  const show=(m)=>{setMsg(m);setTimeout(()=>setMsg(""),2200);};
  return[msg,show];
}

// Get current week dates (Mon-Sun)
function getWeekDates(offset=0){
  const now=new Date();
  const day=now.getDay();
  const mon=new Date(now);
  mon.setDate(now.getDate()-(day===0?6:day-1)+(offset*7));
  return Array.from({length:7},(_,i)=>{
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    return{date:d.toISOString().split("T")[0],num:d.getDate(),month:d.getMonth(),name:DAYS[i],isToday:d.toISOString().split("T")[0]===new Date().toISOString().split("T")[0]};
  });
}

function formatWeekRange(dates){
  const f=(d)=>new Date(d.date+"T12:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"});
  return `${f(dates[0])} — ${f(dates[6])}`;
}

// ── WEEK OVERVIEW CARD ────────────────────────────────────────
function WeekOverview({habitData,exerciseLogs,weightLog,cardioLogs,weekOffset,onChangeWeek}){
  const dates=getWeekDates(weekOffset);
  const weekStr=formatWeekRange(dates);

  // Stats for this week
  const weekDates=dates.map(d=>d.date);

  // Habit compliance this week
  const habitDays=weekDates.filter(d=>habitData[d]&&Object.keys(habitData[d]).length>0);
  const totalTicks=habitDays.reduce((s,d)=>s+Object.values(habitData[d]||{}).filter(v=>v==="✓").length,0);
  const maxTicks=weekDates.length*6;
  const habitPct=maxTicks>0?Math.round(totalTicks/maxTicks*100):0;

  // Training sessions this week
  const trainSessions=[...new Set(Object.keys(exerciseLogs).filter(k=>{const d=k.split("::")[1];return weekDates.includes(d);}).map(k=>k.split("::")[1]))].length;

  // Avg weight this week
  const weekWeights=weightLog.filter(l=>weekDates.includes(l.date)).map(l=>parseFloat(l.weight)||0).filter(w=>w>0);
  const avgWeight=weekWeights.length>0?(weekWeights.reduce((s,w)=>s+w,0)/weekWeights.length).toFixed(1):null;

  // Activity (cardio) this week
  const actSessions=(cardioLogs||[]).filter(l=>weekDates.includes(l.date)).length;

  // Dot colours per day
  const getDotColor=(date)=>{
    const h=habitData[date]||{};
    const done=Object.values(h).filter(v=>v==="✓").length;
    const hasTrain=Object.keys(exerciseLogs).some(k=>k.includes(`::${date}`));
    const hasCardio=(cardioLogs||[]).some(l=>l.date===date);
    if(done>=5||hasTrain||hasCardio)return T.success;
    if(done>0)return T.amber;
    const d=new Date(date+"T12:00");
    if(d<=new Date())return T.danger;
    return T.border;
  };

  return(
    <div className="week-overview">
      <div className="wo-header">
        <div>
          <div className="wo-title">Weekly Overview</div>
          <div className="wo-week">{weekStr}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>onChangeWeek(weekOffset-1)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#FFF",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:14}}>‹</button>
          {weekOffset!==0&&<button onClick={()=>onChangeWeek(0)} style={{background:"rgba(255,215,0,.2)",border:"none",color:"#FFD700",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:600}}>Now</button>}
          <button onClick={()=>onChangeWeek(weekOffset+1)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#FFF",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:14}}>›</button>
        </div>
      </div>

      <div className="wo-days">
        {dates.map(({date,num,name,isToday})=>(
          <div key={date} className={`wo-day${isToday?" today":""}`}>
            <div className="wo-day-name">{name}</div>
            <div className="wo-day-num">{num}</div>
            <div className="wo-dot" style={{background:getDotColor(date)}}/>
          </div>
        ))}
      </div>

      <div className="wo-stats">
        <div className="wo-stat">
          <div className="wo-stat-val" style={{color:habitPct>=70?T.success:habitPct>=40?T.amber:T.red}}>{habitPct}%</div>
          <div className="wo-stat-lbl">Habits</div>
        </div>
        <div className="wo-stat">
          <div className="wo-stat-val">{trainSessions}</div>
          <div className="wo-stat-lbl">Sessions</div>
        </div>
        <div className="wo-stat">
          <div className="wo-stat-val">{actSessions}</div>
          <div className="wo-stat-lbl">Cardio</div>
        </div>
        <div className="wo-stat">
          <div className="wo-stat-val" style={{fontSize:avgWeight?16:18}}>{avgWeight?avgWeight+"kg":"—"}</div>
          <div className="wo-stat-lbl">Avg Weight</div>
        </div>
      </div>
    </div>
  );
}

function MonthCal({habitData}){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  const first=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),today=now.getDate();
  const off=first===0?6:first-1;
  const cells=[];for(let i=0;i<off;i++)cells.push(null);for(let i=1;i<=dim;i++)cells.push(i);
  return(
    <>
      <div className="mg" style={{marginBottom:4}}>{["M","T","W","T","F","S","S"].map((d,i)=><div key={i} className="dh">{d}</div>)}</div>
      <div className="mg">{cells.map((d,i)=>{
        if(!d)return<div key={i} className="dc emp"/>;
        const k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const h=habitData[k]||{};const done=Object.values(h).filter(v=>v==="✓").length;
        let cls="dc";if(d<=today&&done>0)cls+=done>=6?" full":" part";if(d===today)cls+=" today";
        return<div key={i} className={cls}>{d}</div>;
      })}</div>
    </>
  );
}

// ── LOGIN ────────────────────────────────────────────────────
function Login({onLogin}){
  const[mode,setMode]=useState("login");
  const[form,setForm]=useState({name:"",email:"",role:"client",password:""});
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(false);

  const go=async()=>{
    if(!form.email||!form.password){setErr("Fill in all fields");return;}
    if(mode==="register"&&!form.name){setErr("Enter your name");return;}
    setLoading(true);setErr("");
    try{
      if(mode==="login"){
        const{data,error}=await supabase.auth.signInWithPassword({email:form.email,password:form.password});
        if(error){setErr(error.message);setLoading(false);return;}
        const{data:profile}=await supabase.from("profiles").select("role,name").eq("user_id",data.user.id).single();
        const u={id:data.user.id,email:data.user.email,name:profile?.name||data.user.email,role:profile?.role||"client"};
        S.set("raf_current",u);onLogin(u);
      }else{
        const{data,error}=await supabase.auth.signUp({email:form.email,password:form.password});
        if(error){setErr(error.message);setLoading(false);return;}
        if(data.user){
          await supabase.from("profiles").upsert({user_id:data.user.id,name:form.name,role:form.role,email:form.email,updated_at:new Date().toISOString()},{onConflict:"user_id"});
          const u={id:data.user.id,email:form.email,name:form.name,role:form.role};
          S.set("raf_current",u);onLogin(u);
        }else{
          setErr("Check your email to confirm your account, then sign in.");
        }
      }
    }catch(e){setErr("Something went wrong. Please try again.");}
    setLoading(false);
  };

  return(
    <div className="lw">
      <Roundel size={80}/>
      <div style={{marginTop:16}} className="lt">SPITFIRE FIT</div>
      <div className="ls">Coaching Platform</div>
      <div className="lc">
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["login","register"].map(m=><button key={m} className={`btn bsm ${mode===m?"bp":"bo"}`} style={{flex:1}} onClick={()=>{setMode(m);setErr("");}}>{m==="login"?"Sign In":"Register"}</button>)}
        </div>
        {mode==="register"&&<div className="iw"><label className="il">Full Name</label><input className="inp" placeholder="Your name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>}
        <div className="iw"><label className="il">Email</label><input className="inp" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div className="iw"><label className="il">Password</label><input className="inp" type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
        {mode==="register"&&<div className="iw"><label className="il">I am a...</label><select className="inp" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="client">Client</option><option value="coach">Coach</option></select></div>}
        {err&&<p style={{color:T.red,fontSize:13,marginBottom:12,lineHeight:1.4}}>{err}</p>}
        <button className="btn bg" onClick={go} disabled={loading} style={{opacity:loading?0.7:1}}>
          {loading?"Please wait...":(mode==="login"?"Sign In":"Create Account")}
        </button>
        <p style={{textAlign:"center",marginTop:10,fontSize:11,color:T.muted}}>
          {mode==="register"?"You may need to confirm your email before signing in.":"New here? Switch to Register above."}
        </p>
      </div>
    </div>
  );
}


function Dashboard({user,habitData,exerciseLogs,weightLog,goals,cardioLogs}){
  const[weekOffset,setWeekOffset]=useState(0);
  const today=new Date().toISOString().split("T")[0];
  const done=Object.values(habitData[today]||{}).filter(v=>v==="✓").length;
  const pct=Math.round(done/6*100);
  const streak=(()=>{let s=0,d=new Date();while(s<365){const k=d.toISOString().split("T")[0];const c=Object.values(habitData[k]||{}).filter(v=>v==="✓").length;if(c===0&&s>0)break;if(c>0)s++;d.setDate(d.getDate()-1);}return s;})();
  const greet=new Date().getHours()<12?"Morning":new Date().getHours()<17?"Afternoon":"Evening";

  // Category compliance
  const now=new Date(),mk=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const mdays=Object.keys(habitData).filter(k=>k.startsWith(mk));
  const habitComp=mdays.length>0?Math.round(mdays.reduce((s,d)=>s+Object.values(habitData[d]||{}).filter(v=>v==="✓").length,0)/(mdays.length*6)*100):0;
  const trainSessions=Object.keys(exerciseLogs).length;
  const cardioCount=(cardioLogs||[]).length;
  const activeGoals=goals.filter(g=>g.status&&g.status!=="Achieved").length;

  const categories=[
    {name:"Habits",val:`${habitComp}%`,color:habitComp>=70?T.success:habitComp>=40?T.amber:T.red,icon:"✅"},
    {name:"Training",val:trainSessions,color:T.navy,icon:"🏋️"},
    {name:"Activity",val:cardioCount,color:T.teal,icon:"🏃"},
    {name:"Goals",val:activeGoals,color:T.amber,icon:"🎯"},
  ];

  return(
    <div>
      <div className="cb"><div className="cbt">Good {greet}, {user.name.split(" ")[0]}</div><div className="cbtx">{pct>=80?"Outstanding performance today.":pct>=50?"Good progress — push for those final habits.":"Let's get those habits in. Every tick counts."}</div></div>

      <WeekOverview habitData={habitData} exerciseLogs={exerciseLogs} weightLog={weightLog} cardioLogs={cardioLogs} weekOffset={weekOffset} onChangeWeek={setWeekOffset}/>

      <div className="stat3" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
        <div className="sc"><div className="sv">{done}/6</div><div className="sl">Habits Today</div></div>
        <div className="sc"><div className="sv">{streak}</div><div className="sl">Day Streak</div></div>
        <div className="sc"><div className="sv">{trainSessions}</div><div className="sl">Sessions</div></div>
      </div>

      <div className="card" style={{padding:"16px"}}>
        <div className="fbt" style={{marginBottom:12}}>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:600,color:T.brown}}>Today's Score</span>
          <ScoreRing pct={pct}/>
        </div>
        <div className="pbw"><div className="pbf" style={{width:`${pct}%`,background:pct>=80?T.success:pct>=50?T.amber:T.red}}/></div>
        <p className="tm" style={{marginTop:6}}>{done} of 6 habits completed today</p>
      </div>

      <div className="shdr">Monthly Overview</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {categories.map(cat=>(
          <div key={cat.name} className="card" style={{padding:"12px 14px",marginBottom:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:18}}>{cat.icon}</span>
              <span style={{fontSize:12,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{cat.name}</span>
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:700,color:cat.color}}>{cat.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="ct">This Month <span>📅</span></div>
        <MonthCal habitData={habitData}/>
      </div>
    </div>
  );
}

// ── HABITS ────────────────────────────────────────────────────
function Habits({habitData,setHabitData}){
  const[sel,setSel]=useState(new Date().toISOString().split("T")[0]);
  const[habits,setHabits]=useState(()=>S.get("raf_habits",DEFAULT_HABITS));
  const[toast,show]=useToast();
  const dates=getWeekDates(0);
  const td=habitData[sel]||{};
  const done=Object.values(td).filter(v=>v==="✓").length;
  const pct=Math.round(done/habits.length*100);
  const toggle=(id)=>{const cur=td[id];const next=cur==="✓"?"✗":cur==="✗"?null:"✓";const u={...habitData,[sel]:{...td,[id]:next}};if(next===null)delete u[sel][id];setHabitData(u);S.set("raf_habit_data",u);if(next==="✓")show("Habit ticked ✓");};
  const now=new Date(),mk=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const mdays=Object.keys(habitData).filter(k=>k.startsWith(mk));

  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      {/* Week strip using actual current week dates */}
      <div className="ws">
        {dates.map(({date,num,name,isToday})=>{
          const h=habitData[date]||{};
          const hasDot=Object.values(h).some(v=>v==="✓");
          return(
            <div key={date} className={`wd${date===sel?" active":""}${hasDot&&date!==sel?" dot":""}`} onClick={()=>setSel(date)}>
              <div className="wdn">{name}</div>
              <div className="wdnum">{num}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="fbt ct">
          <span>{new Date(sel+"T12:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span>
          <span style={{fontSize:14}}>{done}/{habits.length}</span>
        </div>
        <div className="pbw" style={{marginBottom:16}}><div className="pbf" style={{width:`${pct}%`,background:pct>=80?T.success:pct>=50?T.amber:T.red}}/></div>
        {habits.map(h=>{const val=td[h.id];return(
          <div key={h.id} className="hr">
            <span style={{fontSize:20,width:32,textAlign:"center",flexShrink:0}}>{h.emoji}</span>
            <span style={{flex:1,fontSize:14,fontWeight:500}}>{h.name}</span>
            <button className={`htk${val==="✓"?" done":val==="✗"?" miss":""}`} onClick={()=>toggle(h.id)}>{val==="✓"?"✓":val==="✗"?"✗":""}</button>
          </div>
        );})}
      </div>

      <div className="shdr">Monthly Compliance</div>
      <div className="card">
        {habits.map(h=>{
          const ticked=mdays.filter(d=>habitData[d]?.[h.id]==="✓").length;
          // Only show bar colour if there is actual data
          const hasData=mdays.some(d=>habitData[d]?.[h.id]);
          const p=hasData&&mdays.length>0?Math.round(ticked/mdays.length*100):0;
          const bc=!hasData?"#D4C9A8":p>=80?T.success:p>=50?T.amber:T.red;
          return(
            <div key={h.id} className="compliance-row">
              <div className="compliance-label">
                <span className="compliance-name">{h.emoji} {h.name}</span>
                <span className="compliance-pct" style={{color:hasData?bc:T.muted}}>{hasData?`${p}%`:"—"}</span>
              </div>
              <div className="pbw"><div className="pbf" style={{width:hasData?`${p}%`:"0%",background:bc}}/></div>
              <span className="tm">{hasData?`${ticked} of ${mdays.length} days`:"No data yet"}</span>
            </div>
          );
        })}
      </div>

      <div className="shdr">Customise Habits</div>
      <div className="card">
        {habits.map((h,i)=>(<div key={h.id} className="hr"><span style={{fontSize:20}}>{h.emoji}</span><input className="inp" style={{padding:"6px 10px",fontSize:13}} value={h.name} onChange={e=>{const u=habits.map((x,j)=>j===i?{...x,name:e.target.value}:x);setHabits(u);S.set("raf_habits",u);}}/></div>))}
      </div>

      {/* Habit Archive chart */}
      <div className="shdr">Long-term Trend</div>
      <div className="card" style={{padding:"12px 4px"}}>
        {mdays.length>3?(
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={mdays.slice(-30).map(d=>{const h=habitData[d]||{};const done=Object.values(h).filter(v=>v==="✓").length;return{date:d.slice(8),score:Math.round(done/6*100)};})} margin={{left:-20,right:8}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="date" tick={{fontSize:9}}/>
              <YAxis domain={[0,100]} tick={{fontSize:9}}/>
              <Tooltip formatter={v=>`${v}%`}/>
              <Line type="monotone" dataKey="score" stroke={T.navy} strokeWidth={2} dot={false} name="Daily Score"/>
            </LineChart>
          </ResponsiveContainer>
        ):<p className="tm" style={{textAlign:"center",padding:"20px 0"}}>Start tracking habits to see your trend</p>}
      </div>
    </div>
  );
}

// ── TRAINING ─────────────────────────────────────────────────
function Training({exerciseLogs,setExerciseLogs}){
  const[grp,setGrp]=useState("upper");
  const[ex,setEx]=useState(UPPER_EX[0]);
  const[toast,show]=useToast();
  const exList=grp==="upper"?UPPER_EX:LOWER_EX;
  const today=new Date().toISOString().split("T")[0];
  const lk=`${ex}::${today}`;
  const log=exerciseLogs[lk]||{sets:[{load:"",reps:"",rir:"",done:false},{load:"",reps:"",rir:"",done:false},{load:"",reps:"",rir:"",done:false}],notes:"",techVideo:""};
  const upd=(si,f,v)=>{const u={...log,sets:log.sets.map((s,i)=>i===si?{...s,[f]:v}:s)};const nl={...exerciseLogs,[lk]:u};setExerciseLogs(nl);S.set("raf_exercise_logs",nl);};
  const updF=(f,v)=>{const u={...log,[f]:v};const nl={...exerciseLogs,[lk]:u};setExerciseLogs(nl);S.set("raf_exercise_logs",nl);};
  const cv=l=>l?l.sets.reduce((s,x)=>(parseFloat(x.load)||0)*(parseInt(x.reps)||0)+s,0):0;
  const curV=cv(log);
  const prev=Object.entries(exerciseLogs).filter(([k])=>k.startsWith(`${ex}::`)&&k!==lk).sort(([a],[b])=>b.localeCompare(a))[0];
  const prevV=prev?cv(prev[1]):0;
  const vp=prevV>0?((curV-prevV)/prevV*100).toFixed(1):null;
  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      <div className="tp">{["upper","lower"].map(g=><button key={g} className={`tpill${grp===g?" active":""}`} onClick={()=>{setGrp(g);setEx(g==="upper"?UPPER_EX[0]:LOWER_EX[0]);}}>{g==="upper"?"Upper Body":"Lower Body"}</button>)}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
        {exList.map(e=><button key={e} onClick={()=>setEx(e)} style={{padding:"5px 9px",borderRadius:7,border:`1.5px solid ${e===ex?T.navy:T.border}`,background:e===ex?T.navy:T.white,color:e===ex?T.white:T.brownMid,fontSize:11,fontWeight:500,cursor:"pointer"}}>{e}</button>)}
      </div>
      <div className="ehdr">
        <div><div className="en">{ex}</div><div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:3}}>{today}</div></div>
        <div><div className="ebg">{grp==="upper"?"Upper":"Lower"}</div>{vp!==null&&<div style={{marginTop:6}}><span className={parseFloat(vp)>=0?"bpos":"bneg"}>{parseFloat(vp)>=0?"+":""}{vp}% vol</span></div>}</div>
      </div>
      <div className="card">
        <div className="setg" style={{marginBottom:8}}><div/><div className="slbl">LOAD</div><div className="slbl">REPS</div><div className="slbl">RIR</div><div className="slbl">✓</div></div>
        {log.sets.map((s,i)=>(<div key={i} className="setg"><div className="snum">{i+1}</div><input className="sinp" type="number" placeholder="0" value={s.load} onChange={e=>upd(i,"load",e.target.value)}/><input className="sinp" type="number" placeholder="0" value={s.reps} onChange={e=>upd(i,"reps",e.target.value)}/><input className="sinp" type="number" placeholder="0" value={s.rir} onChange={e=>upd(i,"rir",e.target.value)}/><button className={`stk${s.done?" done":""}`} onClick={()=>upd(i,"done",!s.done)}>{s.done?"✓":""}</button></div>))}
        {curV>0&&<div style={{marginTop:12,padding:"10px 12px",background:T.parchment,borderRadius:8}}><div className="fbt"><span style={{fontSize:13,color:T.brownMid}}>Volume</span><span style={{fontSize:16,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",color:T.navy}}>{curV.toFixed(0)} kg</span></div>{prevV>0&&<div className="fbt" style={{marginTop:6}}><span className="tm">vs last ({prevV.toFixed(0)} kg)</span><span className={parseFloat(vp)>=0?"bpos":"bneg"}>{parseFloat(vp)>=0?"↑":"↓"}{Math.abs(parseFloat(vp))}%</span></div>}</div>}
        <div className="div"/>
        <div className="iw"><label className="il">Technique Video URL</label><input className="inp" placeholder="YouTube / Google Drive link..." value={log.techVideo||""} onChange={e=>updF("techVideo",e.target.value)}/></div>
        <div className="iw"><label className="il">Session Notes</label><textarea className="inp" rows={3} placeholder="How did this feel?" style={{resize:"none"}} value={log.notes||""} onChange={e=>updF("notes",e.target.value)}/></div>
        <button className="btn bp" onClick={()=>show("Session saved ✓")}>Save Session</button>
      </div>
      {prev&&(<><div className="shdr">Previous — {prev[0].split("::")[1]}</div><div className="card"><div className="setg" style={{marginBottom:8}}><div/><div className="slbl">LOAD</div><div className="slbl">REPS</div><div className="slbl">RIR</div><div/></div>{prev[1].sets.map((s,i)=>(<div key={i} className="setg"><div className="snum" style={{opacity:.5}}>{i+1}</div><div style={{textAlign:"center",fontSize:15,fontWeight:600,color:T.brownMid}}>{s.load||"—"}</div><div style={{textAlign:"center",fontSize:15,fontWeight:600,color:T.brownMid}}>{s.reps||"—"}</div><div style={{textAlign:"center",fontSize:15,fontWeight:600,color:T.brownMid}}>{s.rir||"—"}</div><div/></div>))}</div></>)}
    </div>
  );
}

// ── WEIGHT ────────────────────────────────────────────────────
function Weight({weightLog,setWeightLog}){
  const[form,setForm]=useState({date:new Date().toISOString().split("T")[0],weight:"",notes:""});
  const[toast,show]=useToast();
  const save=()=>{if(!form.weight)return;const u=[...weightLog.filter(l=>l.date!==form.date),{...form}].sort((a,b)=>a.date.localeCompare(b.date));setWeightLog(u);S.set("raf_weight_log",u);show("Saved ✓");setForm({date:new Date().toISOString().split("T")[0],weight:"",notes:""});};
  const cd=weightLog.slice(-20).map((l,i,a)=>{const sl=a.slice(Math.max(0,i-6),i+1);const avg=(sl.reduce((s,x)=>s+(parseFloat(x.weight)||0),0)/sl.length).toFixed(1);return{date:l.date.slice(5),weight:parseFloat(l.weight),avg:parseFloat(avg)};});
  const l7=weightLog.slice(-7);const c7=l7.length>=2?(parseFloat(l7[l7.length-1].weight)-parseFloat(l7[0].weight)).toFixed(1):null;
  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      {weightLog.length>0&&<div className="card" style={{background:T.navy,border:"none"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{[["Current",weightLog[weightLog.length-1].weight+"kg"],["Lowest",Math.min(...weightLog.map(l=>parseFloat(l.weight)||999)).toFixed(1)+"kg"],["7-Day",c7!==null?(parseFloat(c7)>0?"+":"")+c7+"kg":"—"]].map(([l,v])=>(<div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:700,color:T.gold}}>{v}</div><div style={{fontSize:9,color:"rgba(255,255,255,.6)",textTransform:"uppercase"}}>{l}</div></div>))}</div></div>}
      <div className="card">
        <div className="ct">Log Weight ⚖️</div>
        <div className="iw"><label className="il">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <div className="iw"><label className="il">Weight (kg)</label><input className="inp" type="number" step="0.1" placeholder="82.5" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})}/></div>
        <div className="iw"><label className="il">Notes</label><input className="inp" placeholder="How are you feeling?" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <button className="btn bp" onClick={save}>Save</button>
      </div>
      {cd.length>1&&<><div className="shdr">Weight Trend</div><div className="card" style={{padding:"12px 4px"}}><ResponsiveContainer width="100%" height={180}><LineChart data={cd} margin={{left:-20,right:8}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={["auto","auto"]} tick={{fontSize:10}}/><Tooltip/><Line type="monotone" dataKey="weight" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Weight"/><Line type="monotone" dataKey="avg" stroke={T.gold} strokeWidth={2} strokeDasharray="4 2" dot={false} name="7-day avg"/></LineChart></ResponsiveContainer></div></>}
      {weightLog.length>0&&<><div className="shdr">History</div><div className="card">{weightLog.slice(-8).reverse().map((l,i,a)=>{const prev=a[i+1];const diff=prev?(parseFloat(l.weight)-parseFloat(prev.weight)).toFixed(1):null;return(<div key={l.date} className="fbt" style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:13}}>{l.date}</span><div className="fb"><span style={{fontWeight:700,fontSize:15,fontFamily:"'Barlow Condensed',sans-serif",color:T.navy}}>{l.weight} kg</span>{diff!==null&&<span className={parseFloat(diff)<=0?"bpos":parseFloat(diff)>0?"bneg":"bneu"}>{parseFloat(diff)>0?"+":""}{diff}</span>}</div></div>);})}</div></>}
    </div>
  );
}

// ── WEEKLY CHECK-IN — proper multi-step form ──────────────────
function CheckIn(){
  const[cis,setCis]=useState(()=>S.get("raf_checkins",[]));
  const[step,setStep]=useState(0);
  const[toast,show]=useToast();
  const wk=`Week of ${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`;
  const EMPTY={week:wk,training:"",sessions:"",energy:"",stress:"",sleep:"",nutrition:"",body:"",motivation:"",weight:"",win:"",challenge:"",question:""};
  const[form,setForm]=useState(EMPTY);

  const steps=[
    {title:"Training",icon:"🏋️",fields:[
      {label:"How did training feel overall?",key:"training",opts:["😤 Terrible","😕 Below par","😐 Average","🙂 Good","💪 Excellent"]},
      {label:"Sessions completed this week?",key:"sessions",opts:["✓ All done","⚡ 1 missed","⚠ 2 missed","✗ 3+ missed"]},
    ]},
    {title:"Recovery",icon:"😴",fields:[
      {label:"Sleep quality?",key:"sleep",opts:["😴 Poor","😐 Fair","🙂 Good","💤 Great","⭐ Excellent"]},
      {label:"Energy levels?",key:"energy",opts:["1 — Exhausted","2 — Low","3 — Average","4 — Good","5 — High"]},
      {label:"Stress levels?",key:"stress",opts:["1 — Very stressed","2 — Stressed","3 — Moderate","4 — Low","5 — Relaxed"]},
    ]},
    {title:"Nutrition",icon:"🥗",fields:[
      {label:"Hit nutrition targets most days?",key:"nutrition",opts:["✓ Yes","~ Mostly","✗ No"]},
      {label:"Current body weight?",key:"weight",type:"text"},
    ]},
    {title:"Mindset",icon:"🧠",fields:[
      {label:"How do you feel in your body?",key:"body",opts:["Leaner","Same","Slightly heavier","Stronger","More defined"]},
      {label:"Overall motivation?",key:"motivation",opts:["🔥 On fire","💪 Motivated","😐 Neutral","😕 Low","😔 Struggling"]},
    ]},
    {title:"Coach",icon:"📋",fields:[
      {label:"Biggest win this week?",key:"win",type:"text"},
      {label:"Biggest challenge?",key:"challenge",type:"text"},
      {label:"Questions for your coach?",key:"question",type:"textarea"},
    ]},
  ];

  const cur=steps[step];
  const isLast=step===steps.length-1;

  const next=()=>{
    if(isLast){
      const u=[...cis.filter(c=>c.week!==form.week),{...form}];
      setCis(u);S.set("raf_checkins",u);show("Check-in submitted ✓");setStep(0);setForm(EMPTY);
    }else setStep(s=>s+1);
  };

  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}

      {/* Step progress */}
      <div style={{marginBottom:16}}>
        <div className="form-steps">
          {steps.map((_,i)=><div key={i} className={`form-step${i<step?" done":i===step?" active":""}`}/>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:T.navy}}>{cur.icon} {cur.title}</div>
          <span className="tm">Step {step+1} of {steps.length}</span>
        </div>
      </div>

      <div className="card">
        {cur.fields.map(field=>(
          <div key={field.key} className="iw">
            <label className="il">{field.label}</label>
            {field.type==="textarea"?(
              <textarea className="inp" rows={3} style={{resize:"none"}} value={form[field.key]} onChange={e=>setForm({...form,[field.key]:e.target.value})}/>
            ):field.type==="text"?(
              <input className="inp" value={form[field.key]} onChange={e=>setForm({...form,[field.key]:e.target.value})}/>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {field.opts.map(o=>(
                  <button key={o} onClick={()=>setForm({...form,[field.key]:o})}
                    style={{padding:"10px 14px",borderRadius:9,border:`1.5px solid ${form[field.key]===o?T.navy:T.border}`,background:form[field.key]===o?T.navy:T.white,color:form[field.key]===o?T.white:T.brown,fontSize:14,textAlign:"left",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={{display:"flex",gap:8,marginTop:8}}>
          {step>0&&<button className="btn bo bsm" style={{flex:1}} onClick={()=>setStep(s=>s-1)}>Back</button>}
          <button className="btn bp" style={{flex:2}} onClick={next}>{isLast?"Submit Check-in ✓":"Next →"}</button>
        </div>
      </div>

      {cis.length>0&&<><div className="shdr">Previous Check-ins</div><div className="card">{cis.slice(-4).reverse().map(c=>(<div key={c.week} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><div style={{fontWeight:600,fontSize:13}}>{c.week}</div><div style={{fontSize:12,color:T.muted,marginTop:3}}>Training: {c.training||"—"} · Motivation: {c.motivation||"—"}</div></div>))}</div></>}
    </div>
  );
}

// ── GOALS ──────────────────────────────────────────────────────
function Goals({goals,setGoals}){
  const[showForm,setShowForm]=useState(false);
  const[toast,showT]=useToast();
  const E={goal:"",category:"Training",target:"",current:"",deadline:"",status:"Not started",type:"short"};
  const[form,setForm]=useState(E);
  const save=()=>{if(!form.goal)return;const u=form.id?goals.map(g=>g.id===form.id?form:g):[...goals,{...form,id:Date.now()}];setGoals(u);S.set("raf_goals",u);setShowForm(false);showT("Saved ✓");};
  const del=(id)=>{setGoals(goals.filter(g=>g.id!==id));S.set("raf_goals",goals.filter(g=>g.id!==id));setShowForm(false);};
  const SC={Achieved:[T.successL,T.success],"On track":["#D4EDDA",T.success],"In progress":[T.amberL,T.amber],"Needs attention":[T.dangerL,T.danger],"Not started":[T.parchment,T.muted]};
  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      {showForm&&<div className="mo" onClick={e=>{if(e.target.className==="mo")setShowForm(false);}}><div className="md"><div className="mh"><span>{form.id?"Edit":"New Goal"}</span><button style={{background:"none",border:"none",fontSize:24,cursor:"pointer"}} onClick={()=>setShowForm(false)}>×</button></div><div className="iw"><label className="il">Goal</label><input className="inp" placeholder="e.g. Bench 100kg" value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})}/></div><div className="iw"><label className="il">Category</label><select className="inp" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{Object.keys(GOAL_CATS).map(c=><option key={c}>{c}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div className="iw" style={{marginBottom:8}}><label className="il">Target</label><input className="inp" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/></div><div className="iw" style={{marginBottom:8}}><label className="il">Current</label><input className="inp" value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></div></div><div className="iw"><label className="il">Deadline</label><input className="inp" type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/></div><div className="iw"><label className="il">Status</label><select className="inp" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{Object.keys(SC).map(s=><option key={s}>{s}</option>)}</select></div><div className="iw"><label className="il">Type</label><select className="inp" value={form.type||"short"} onChange={e=>setForm({...form,type:e.target.value})}><option value="short">Short-term</option><option value="long">Long-term</option></select></div><div style={{display:"flex",gap:8}}><button className="btn bp" onClick={save}>Save</button>{form.id&&<button className="btn br bsm" style={{width:"auto"}} onClick={()=>del(form.id)}>Delete</button>}</div></div></div>}
      <button className="btn bg" style={{marginBottom:16}} onClick={()=>{setForm(E);setShowForm(true);}}>+ Add Goal</button>
      {[["Short-term",goals.filter(g=>g.type!=="long")],["Long-term",goals.filter(g=>g.type==="long")]].map(([t,list])=>list.length>0&&(
        <div key={t}><div className="shdr">{t} Goals</div>{list.map(g=>{const[sb,sf]=SC[g.status]||[T.parchment,T.muted];const{dark,light}=GOAL_CATS[g.category]||{dark:T.navy,light:"#EEF"};const p=g.target&&g.current?Math.min(Math.round(parseFloat(g.current)/parseFloat(g.target)*100),100):null;return(<div key={g.id} className="card" style={{borderLeft:`4px solid ${dark}`,cursor:"pointer"}} onClick={()=>{setForm(g);setShowForm(true);}}><div className="fbt" style={{marginBottom:8}}><span style={{fontWeight:600,fontSize:15}}>{g.goal}</span><span style={{background:sb,color:sf,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99}}>{g.status}</span></div><span style={{background:light,color:dark,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99}}>{g.category}</span>{p!==null&&<><div className="pbw" style={{marginTop:10}}><div className="pbf" style={{width:`${p}%`,background:p>=100?T.success:p>=50?T.amber:T.red}}/></div><div className="fbt" style={{marginTop:4}}><span className="tm">{g.current} / {g.target}</span><span style={{fontSize:12,fontWeight:600,color:p>=100?T.success:T.navy}}>{p}%</span></div></>}{g.deadline&&<div className="tm" style={{marginTop:6}}>Deadline: {g.deadline}</div>}</div>);})}</div>
      ))}
      {goals.length===0&&<div style={{textAlign:"center",padding:40,color:T.muted}}><div style={{fontSize:48,marginBottom:12}}>🎯</div><div>No goals yet — tap + Add Goal</div></div>}
    </div>
  );
}

// ── MEASUREMENTS ──────────────────────────────────────────────
function Measurements(){
  const[logs,setLogs]=useState(()=>S.get("raf_meas_logs",[]));
  const[form,setForm]=useState(()=>{const f={date:new Date().toISOString().split("T")[0]};MEASUREMENTS.forEach(m=>f[m]="");return f;});
  const[toast,show]=useToast();
  const save=()=>{const u=[...logs.filter(l=>l.date!==form.date),{...form}].sort((a,b)=>a.date.localeCompare(b.date));setLogs(u);S.set("raf_meas_logs",u);show("Saved ✓");};
  const first=logs[0],last=logs[logs.length-1];
  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      {logs.length>=2&&<><div className="shdr">Progress</div><div className="card">{MEASUREMENTS.map(m=>{const fi=parseFloat(first?.[m]),la=parseFloat(last?.[m]);if(!fi||!la)return null;const diff=(la-fi).toFixed(1);const pos=["Waist","Hips","Left Thigh","Right Thigh","Left Arm","Right Arm"].includes(m)?parseFloat(diff)<0:parseFloat(diff)>0;return(<div key={m} className="fbt" style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:13,fontWeight:500}}>{m}</span><div className="fb"><span style={{fontSize:14,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",color:T.navy}}>{la} cm</span><span className={pos?"bpos":"bneg"}>{parseFloat(diff)>0?"+":""}{diff}</span></div></div>);}).filter(Boolean)}</div></>}
      <div className="shdr">Log Measurements</div>
      <div className="card">
        <div className="iw"><label className="il">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {MEASUREMENTS.map(m=>(<div key={m} className="iw" style={{marginBottom:8}}><label className="il">{m} (cm)</label><input className="inp" type="number" step="0.1" placeholder="0.0" value={form[m]||""} onChange={e=>setForm({...form,[m]:e.target.value})}/></div>))}
        </div>
        <button className="btn bp" onClick={save}>Save Measurements</button>
      </div>
    </div>
  );
}

// ── CARDIO ──────────────────────────────────────────────────────
function Cardio({cardioLogs,setCardioLogs}){
  const[form,setForm]=useState({date:new Date().toISOString().split("T")[0],type:"Running",duration:"",distance:"",steps:"",calories:"",notes:""});
  const[toast,show]=useToast();
  const save=()=>{const u=[...cardioLogs,{...form,id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date));setCardioLogs(u);S.set("raf_cardio_logs",u);show("Logged ✓");setForm({date:new Date().toISOString().split("T")[0],type:"Running",duration:"",distance:"",steps:"",calories:"",notes:""});};
  const cd=cardioLogs.slice(-14).map(l=>({date:l.date.slice(5),steps:parseInt(l.steps)||0}));
  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      <div className="card">
        <div className="ct">Log Activity 🏃</div>
        <div className="iw"><label className="il">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <div className="iw"><label className="il">Activity</label><select className="inp" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{CARDIO_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["duration","Duration (min)"],["distance","Distance (km)"],["steps","Steps"],["calories","Cals Burned"]].map(([k,l])=>(<div key={k} className="iw" style={{marginBottom:8}}><label className="il">{l}</label><input className="inp" type="number" placeholder="0" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>))}
        </div>
        <div className="iw"><label className="il">Notes</label><input className="inp" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <button className="btn bp" onClick={save}>Log Activity</button>
      </div>
      {cd.length>1&&<><div className="shdr">Steps Trend</div><div className="card" style={{padding:"12px 4px"}}><ResponsiveContainer width="100%" height={140}><BarChart data={cd} margin={{left:-20,right:8}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><ReferenceLine y={10000} stroke={T.gold} strokeDasharray="4 2"/><Bar dataKey="steps" fill={T.teal} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></>}
      {cardioLogs.length>0&&<><div className="shdr">Recent</div><div className="card">{cardioLogs.slice(-6).reverse().map(l=>(<div key={l.id} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><div className="fbt"><div><span style={{fontWeight:600,fontSize:14}}>{l.type}</span><span style={{fontSize:11,color:T.muted,marginLeft:8}}>{l.date}</span></div>{parseInt(l.steps)>0&&<span className={parseInt(l.steps)>=10000?"bpos":"bneu"}>{parseInt(l.steps).toLocaleString()} steps</span>}</div></div>))}</div></>}
    </div>
  );
}

// ── COACH NOTES ────────────────────────────────────────────────
function CoachNotes(){
  const[notes,setNotes]=useState(()=>S.get("raf_coach_notes",[]));
  const[form,setForm]=useState({date:new Date().toISOString().split("T")[0],session:"",compliance:"✓ Full",observations:"",adjustment:""});
  const[toast,show]=useToast();
  const save=()=>{const u=[...notes,{...form,id:Date.now()}].sort((a,b)=>b.date.localeCompare(a.date));setNotes(u);S.set("raf_coach_notes",u);show("Saved ✓");setForm({date:new Date().toISOString().split("T")[0],session:"",compliance:"✓ Full",observations:"",adjustment:""});};
  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      <div className="cb"><div className="cbt">🔒 Coach Only</div><div className="cbtx">Private notes — never visible to clients.</div></div>
      <div className="card">
        <div className="iw"><label className="il">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <div className="iw"><label className="il">Session</label><input className="inp" placeholder="e.g. Upper Body" value={form.session} onChange={e=>setForm({...form,session:e.target.value})}/></div>
        <div className="iw"><label className="il">Compliance</label><select className="inp" value={form.compliance} onChange={e=>setForm({...form,compliance:e.target.value})}>{["✓ Full","~ Partial","✗ Missed","🤒 Injury","🏖 Holiday"].map(o=><option key={o}>{o}</option>)}</select></div>
        <div className="iw"><label className="il">Observations</label><textarea className="inp" rows={3} style={{resize:"none"}} value={form.observations} onChange={e=>setForm({...form,observations:e.target.value})}/></div>
        <div className="iw"><label className="il">Programme Adjustments</label><textarea className="inp" rows={2} style={{resize:"none"}} value={form.adjustment} onChange={e=>setForm({...form,adjustment:e.target.value})}/></div>
        <button className="btn bp" onClick={save}>Save Note</button>
      </div>
      {notes.length>0&&<><div className="shdr">Log</div><div className="card">{notes.map(n=>(<div key={n.id} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><div className="fbt"><span style={{fontWeight:600,fontSize:13}}>{n.date}</span><span style={{background:n.compliance.includes("✓")?T.successL:T.dangerL,color:n.compliance.includes("✓")?T.success:T.danger,fontSize:11,padding:"2px 6px",borderRadius:99}}>{n.compliance}</span></div><div style={{fontSize:12,color:T.muted}}>{n.session}</div>{n.observations&&<div style={{fontSize:13,marginTop:3}}>{n.observations}</div>}</div>))}</div></>}
    </div>
  );
}

// ── NUTRITION ────────────────────────────────────────────────────
function Nutrition({profile}){
  const[logs,setLogs]=useState(()=>S.get("raf_nutrition_logs",[]));
  const[form,setForm]=useState({date:new Date().toISOString().split("T")[0],calories:"",protein:"",carbs:"",fats:"",fibre:"",water:"",notes:""});
  const[toast,show]=useToast();

  // TDEE calc from profile
  const w=parseFloat(profile?.weight)||80;
  const ht=parseFloat(profile?.height)||175;
  const age=parseInt(profile?.age)||30;
  const sex=profile?.sex==="Female"?"F":"M";
  const actMult={Sedentary:1.2,"Lightly active":1.375,"Moderately active":1.55,"Very active":1.725,Athlete:1.9}[profile?.activity]||1.55;
  const bmr=sex==="M"?10*w+6.25*ht-5*age+5:10*w+6.25*ht-5*age-161;
  const tdee=Math.round(bmr*actMult);
  const goal=profile?.goal||"";
  const tc=goal.includes("fat")?tdee-500:goal.includes("muscle")?tdee+300:tdee;
  const tp=Math.round(w*2),tf=Math.round(tc*.25/9),tca=Math.round((tc-tp*4-tf*9)/4),tfi=Math.round(tc/1000*15);

  const save=()=>{if(!form.date)return;const u=[...logs.filter(l=>l.date!==form.date),{...form}].sort((a,b)=>a.date.localeCompare(b.date));setLogs(u);S.set("raf_nutrition_logs",u);show("Saved ✓");};
  const cd=logs.slice(-14).map(l=>({date:l.date.slice(5),calories:parseInt(l.calories)||0}));

  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}

      {/* TDEE card — profile must be filled first */}
      {!profile?.weight?(
        <div className="cb"><div className="cbt">Complete your profile first</div><div className="cbtx">Go to Profile → Body Stats and enter your weight, height, age, sex, and activity level. Your macro targets will auto-calculate here.</div></div>
      ):(
        <div className="card" style={{background:T.navy,border:"none"}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",marginBottom:10}}>Your Macro Targets</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Target Calories",tc+" kcal"],["Protein",tp+"g"],["Carbs",tca+"g"],["Fats",tf+"g"]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,.1)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:T.gold,textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,color:T.white}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:8,fontSize:11,color:"rgba(255,255,255,.55)"}}>Fibre: {tfi}g/day · Based on {w}kg body weight · {profile?.activity||"Moderately active"}</div>
        </div>
      )}

      <div className="shdr">Log Today</div>
      <div className="card">
        <div className="iw"><label className="il">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["calories","Calories"],["protein","Protein (g)"],["carbs","Carbs (g)"],["fats","Fats (g)"],["fibre","Fibre (g)"],["water","Water (L)"]].map(([k,l])=>(<div key={k} className="iw" style={{marginBottom:8}}><label className="il">{l}</label><input className="inp" type="number" placeholder={k==="calories"?String(tc):k==="protein"?String(tp):"0"} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>))}
        </div>
        <div className="iw"><label className="il">Meals / Notes</label><textarea className="inp" rows={2} style={{resize:"none"}} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <button className="btn bp" onClick={save}>Save Entry</button>
      </div>
      {cd.length>1&&<><div className="shdr">Calories Trend</div><div className="card" style={{padding:"12px 4px"}}><ResponsiveContainer width="100%" height={150}><BarChart data={cd} margin={{left:-20,right:8}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><ReferenceLine y={tc} stroke={T.gold} strokeDasharray="4 2"/><Bar dataKey="calories" fill={T.navy} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></>}
    </div>
  );
}

// ── PROFILE ─────────────────────────────────────────────────────
function Profile({user,profile,setProfile,onLogout}){
  const[form,setForm]=useState(profile||{weight:"",height:"",age:"",sex:"Male",activity:"Moderately active",goal:"Build muscle",units:"Metric",trainerName:"",trainerEmail:""});
  const[toast,show]=useToast();
  const save=()=>{setProfile(form);S.set(`raf_profile_${user.id}`,form);show("Saved ✓");};

  // Device sync links
  const syncLinks=[
    {name:"Apple Health via Health Auto Export",sub:"iOS app → auto-sync steps, workouts & weight",icon:"🍎",url:"https://apps.apple.com/app/health-auto-export-json-csv/id1115567069",color:"#1C1C1E"},
    {name:"Garmin Connect",sub:"Connect your Garmin device to sync activity data",icon:"⌚",url:"https://connect.garmin.com",color:"#0A7CC1"},
    {name:"Fitbit",sub:"Link your Fitbit account to import daily stats",icon:"📱",url:"https://www.fitbit.com/global/uk/home",color:"#00B0B9"},
    {name:"MyFitnessPal",sub:"Connect MFP to sync nutrition diary",icon:"🥗",url:"https://www.myfitnesspal.com",color:"#4CAF50"},
    {name:"Zapier (automate syncing)",sub:"Set up automatic data flows — free tier available",icon:"⚡",url:"https://zapier.com/apps/google-sheets",color:"#FF4F00"},
  ];

  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      <div className="card" style={{background:T.navy,border:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:T.gold,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:700,color:T.navy,border:"3px solid #FFF"}}>{user.name.charAt(0)}</div>
          <div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:"#FFF"}}>{user.name}</div><div style={{fontSize:12,color:T.gold,textTransform:"uppercase"}}>{user.role}</div><div style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>{user.email}</div></div>
        </div>
      </div>

      <div className="shdr">Body Stats</div>
      <div className="card">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["weight","Weight (kg)","number"],["height","Height (cm)","number"],["age","Age","number"]].map(([k,l,t])=>(<div key={k} className="iw" style={{marginBottom:8}}><label className="il">{l}</label><input className="inp" type={t} value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>))}
          <div className="iw" style={{marginBottom:8}}><label className="il">Sex</label><select className="inp" value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}><option>Male</option><option>Female</option></select></div>
        </div>
        <div className="iw"><label className="il">Activity Level</label><select className="inp" value={form.activity} onChange={e=>setForm({...form,activity:e.target.value})}>{["Sedentary","Lightly active","Moderately active","Very active","Athlete"].map(o=><option key={o}>{o}</option>)}</select></div>
        <div className="iw"><label className="il">Goal</label><select className="inp" value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})}>{["Lose fat","Build muscle","Recomposition","Improve performance","Improve health"].map(o=><option key={o}>{o}</option>)}</select></div>
        <div className="iw"><label className="il">Trainer Name</label><input className="inp" value={form.trainerName||""} onChange={e=>setForm({...form,trainerName:e.target.value})}/></div>
        <button className="btn bp" onClick={save}>Save Profile</button>
      </div>

      <div className="shdr">Connect Your Devices</div>
      <p style={{fontSize:13,color:T.muted,marginBottom:12,lineHeight:1.5}}>Tap any link below to connect your device or app. Once connected, data will sync automatically.</p>
      {syncLinks.map(link=>(
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="sync-link">
          <div className="sync-link-icon" style={{background:link.color+"22",border:`1.5px solid ${link.color}44`}}>
            <span style={{fontSize:22}}>{link.icon}</span>
          </div>
          <div>
            <div className="sync-link-title">{link.name}</div>
            <div className="sync-link-sub">{link.sub}</div>
          </div>
          <span className="sync-link-arrow">→</span>
        </a>
      ))}

      <div className="shdr">Account</div>
      <div className="card"><button className="btn bo" onClick={onLogout}>Sign Out</button></div>
    </div>
  );
}

// ── MORE ───────────────────────────────────────────────────────

// ── PROGRAMME CARD ────────────────────────────────────────────
function ProgrammeCard(){
  const EXERCISES=[
    "Single Arm Pulldown","Flat Barbell Bench Press","Smith Machine Shoulder Press",
    "Wide Grip T-Bar Row","Wide Grip Flat Pulldown","Incline Tricep Extension",
    "Incline Dumbbell Curl","Pec Fly Machine","Lateral Raise Machine",
    "Leg Press Calf Raise","Hack Squat","Romanian Deadlift",
    "Leg Extension","Lying Leg Curl","Seated Adduction Machine",
  ];
  const[prog,setProg]=useState(()=>S.get("raf_programme",{
    model:"Linear (+kg/week)",increment:2.5,weeks:8,usePercent:false,
    exercises:EXERCISES.map(e=>({name:e,sets:3,reps:"8-12",w1:"",custom1RM:""}))
  }));
  const[tab,setTab]=useState("plan");
  const[toast,show]=useToast();

  const save=()=>{S.set("raf_programme",prog);show("Programme saved ✓");};
  const upd=(field,val)=>setProg(p=>({...p,[field]:val}));
  const updEx=(i,field,val)=>setProg(p=>({...p,exercises:p.exercises.map((e,j)=>j===i?{...e,[field]:val}:e)}));

  // Epley 1RM formula
  const epley=(load,reps)=>reps===1?load:Math.round(load*(1+reps/30));
  // Calculate week target based on model
  const weekTarget=(ex,week)=>{
    const w1=parseFloat(ex.w1)||0;
    if(!w1)return"—";
    if(prog.model==="Linear (+kg/week)")return(w1+(week-1)*prog.increment).toFixed(1);
    if(prog.model==="% of 1RM"){
      const orm=parseFloat(ex.custom1RM)||epley(w1,parseInt(ex.reps)||8);
      const pcts=[0.65,0.67,0.70,0.72,0.75,0.77,0.80,0.82];
      return Math.round(orm*(pcts[week-1]||0.70));
    }
    if(prog.model==="Double Progression"){
      // Add weight every 2 weeks
      return(w1+Math.floor((week-1)/2)*prog.increment).toFixed(1);
    }
    return w1;
  };

  return(
    <div>
      <div className="tp">
        {["plan","1rm"].map(t=><button key={t} className={`tpill${tab===t?" active":""}`} onClick={()=>setTab(t)}>
          {t==="plan"?"Programme":"1RM Reference"}
        </button>)}
      </div>

      {tab==="plan"&&<>
        <div className="card">
          <div className="ct">Progression Settings ⚙️</div>
          <div className="iw"><label className="il">Progression Model</label>
            <select className="inp" value={prog.model} onChange={e=>upd("model",e.target.value)}>
              {["Linear (+kg/week)","Double Progression","% of 1RM","RIR-based"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div className="iw" style={{marginBottom:0}}>
              <label className="il">Increment (kg)</label>
              <input className="inp" type="number" step="0.5" value={prog.increment} onChange={e=>upd("increment",parseFloat(e.target.value)||2.5)}/>
            </div>
            <div className="iw" style={{marginBottom:0}}>
              <label className="il">Phase (weeks)</label>
              <input className="inp" type="number" value={prog.weeks} onChange={e=>upd("weeks",parseInt(e.target.value)||8)}/>
            </div>
          </div>
        </div>

        <div className="shdr">Exercise Targets</div>
        {prog.exercises.map((ex,i)=>(
          <div key={ex.name} className="card" style={{padding:"12px 14px"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:T.navy,marginBottom:10}}>{ex.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              <div><label className="il">Sets</label>
                <input className="inp" type="number" value={ex.sets} onChange={e=>updEx(i,"sets",parseInt(e.target.value)||3)} style={{padding:"8px 10px",fontSize:14}}/>
              </div>
              <div><label className="il">Reps</label>
                <input className="inp" value={ex.reps} onChange={e=>updEx(i,"reps",e.target.value)} style={{padding:"8px 10px",fontSize:14}}/>
              </div>
              <div><label className="il">Week 1 (kg)</label>
                <input className="inp" type="number" value={ex.w1} onChange={e=>updEx(i,"w1",e.target.value)} style={{padding:"8px 10px",fontSize:14}}/>
              </div>
            </div>
            {ex.w1&&<div style={{overflowX:"auto"}}>
              <div style={{display:"flex",gap:4,paddingBottom:4}}>
                {Array.from({length:Math.min(prog.weeks,8)},(_,w)=>(
                  <div key={w} style={{textAlign:"center",minWidth:36}}>
                    <div style={{fontSize:9,color:T.muted,textTransform:"uppercase",marginBottom:3}}>W{w+1}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,
                      color:w===0?T.navy:T.amber,background:w===0?T.accentL||"#E8EEFF":T.amberL,
                      borderRadius:6,padding:"4px 2px"}}>{weekTarget(ex,w+1)}</div>
                  </div>
                ))}
              </div>
            </div>}
          </div>
        ))}
        <button className="btn bp" onClick={save}>Save Programme</button>
      </>}

      {tab==="1rm"&&<>
        <div className="card" style={{marginBottom:12}}>
          <div className="ct">1RM Calculator 💪</div>
          <p className="tm" style={{marginBottom:12}}>Enter your best load and reps — estimated 1RM and percentages auto-calculate.</p>
        </div>
        {prog.exercises.map((ex,i)=>{
          const load=parseFloat(ex.w1)||0;
          const reps=parseInt(ex.reps?.split("-")[1]||ex.reps)||8;
          const orm=load>0?epley(load,reps):null;
          return(
            <div key={ex.name} className="card" style={{padding:"12px 14px",marginBottom:10}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>{ex.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><label className="il">Best Load (kg)</label>
                  <input className="inp" type="number" value={ex.w1} onChange={e=>updEx(i,"w1",e.target.value)} style={{padding:"8px 10px",fontSize:14}}/>
                </div>
                <div><label className="il">Custom 1RM (opt)</label>
                  <input className="inp" type="number" placeholder={orm?String(orm):"auto"} value={ex.custom1RM||""} onChange={e=>updEx(i,"custom1RM",e.target.value)} style={{padding:"8px 10px",fontSize:14}}/>
                </div>
              </div>
              {orm&&<>
                <div style={{background:T.navy,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,color:T.gold}}>Est. 1RM: {parseFloat(ex.custom1RM)||orm} kg</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                  {[60,65,70,75,80,85,90,95].map(pct=>(
                    <div key={pct} style={{background:T.parchment,borderRadius:6,padding:"6px 4px",textAlign:"center"}}>
                      <div style={{fontSize:9,color:T.muted,textTransform:"uppercase"}}>{pct}%</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:T.brown}}>{Math.round((parseFloat(ex.custom1RM)||orm)*pct/100)}</div>
                    </div>
                  ))}
                </div>
              </>}
            </div>
          );
        })}
      </>}
    </div>
  );
}

// ── TRAINING TEMPLATES ────────────────────────────────────────
function Templates(){
  const DEFAULT_TEMPLATES={
    split:"Upper / Lower",
    upper:[
      {varA:"Single Arm Pulldown",varB:"Wide Grip Flat Pulldown",exercise:"Single Arm Pulldown",sets:3,reps:"8-12",cue:"Control the negative"},
      {varA:"Flat Barbell Bench Press",varB:"Dumbbell Bench Press",exercise:"Flat Barbell Bench Press",sets:3,reps:"5-8",cue:"Arch, retract scapula"},
      {varA:"Smith Machine Shoulder Press",varB:"Dumbbell Shoulder Press",exercise:"Smith Machine Shoulder Press",sets:3,reps:"8-12",cue:"Neutral grip"},
      {varA:"Wide Grip T-Bar Row",varB:"Cable Row",exercise:"Wide Grip T-Bar Row",sets:3,reps:"8-12",cue:"Drive elbows back"},
      {varA:"Wide Grip Flat Pulldown",varB:"Pull Up",exercise:"Wide Grip Flat Pulldown",sets:3,reps:"10-12",cue:"Full ROM"},
      {varA:"Incline Tricep Extension",varB:"Cable Pushdown",exercise:"Incline Tricep Extension",sets:3,reps:"10-15",cue:"Lock elbows in"},
      {varA:"Incline Dumbbell Curl",varB:"Preacher Curl",exercise:"Incline Dumbbell Curl",sets:3,reps:"10-12",cue:"Supinate at top"},
      {varA:"Pec Fly Machine",varB:"Cable Fly",exercise:"Pec Fly Machine",sets:3,reps:"12-15",cue:"Slight bend in elbows"},
      {varA:"Lateral Raise Machine",varB:"Dumbbell Lateral Raise",exercise:"Lateral Raise Machine",sets:3,reps:"12-15",cue:"Lead with elbows"},
    ],
    lower:[
      {varA:"Leg Press Calf Raise",varB:"Standing Calf Raise",exercise:"Leg Press Calf Raise",sets:4,reps:"12-15",cue:"Full stretch at bottom"},
      {varA:"Hack Squat",varB:"Barbell Squat",exercise:"Hack Squat",sets:3,reps:"8-12",cue:"Knees track toes"},
      {varA:"Romanian Deadlift",varB:"Lying Leg Curl",exercise:"Romanian Deadlift",sets:3,reps:"8-10",cue:"Hip hinge, soft knees"},
      {varA:"Leg Extension",varB:"Bulgarian Split Squat",exercise:"Leg Extension",sets:3,reps:"12-15",cue:"Controlled negative"},
      {varA:"Lying Leg Curl",varB:"Seated Leg Curl",exercise:"Lying Leg Curl",sets:3,reps:"10-12",cue:"Full ROM"},
      {varA:"Seated Adduction Machine",varB:"Cable Adduction",exercise:"Seated Adduction Machine",sets:3,reps:"12-15",cue:"Squeeze at close"},
    ]
  };
  const[tmpl,setTmpl]=useState(()=>S.get("raf_templates",DEFAULT_TEMPLATES));
  const[tab,setTab]=useState("upper");
  const[toast,show]=useToast();
  const save=()=>{S.set("raf_templates",tmpl);show("Templates saved ✓");};
  const updEx=(group,i,field,val)=>setTmpl(t=>({...t,[group]:t[group].map((e,j)=>j===i?{...e,[field]:val}:e)}));
  const exercises=tmpl[tab]||[];

  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      <div className="card" style={{marginBottom:12}}>
        <div className="ct">Split Type</div>
        <select className="inp" value={tmpl.split} onChange={e=>setTmpl(t=>({...t,split:e.target.value}))}>
          {["Upper / Lower","Push / Pull / Legs","Full Body","Custom"].map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
      <div className="tp">
        {["upper","lower"].map(g=><button key={g} className={`tpill${tab===g?" active":""}`} onClick={()=>setTab(g)}>{g==="upper"?"Upper Body":"Lower Body"}</button>)}
      </div>
      {exercises.map((ex,i)=>(
        <div key={i} className="card" style={{padding:"12px 14px",marginBottom:10}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:T.navy,marginBottom:10}}>Exercise {i+1}</div>
          <div className="iw" style={{marginBottom:8}}>
            <label className="il">Variation A (primary)</label>
            <input className="inp" value={ex.varA} onChange={e=>updEx(tab,i,"varA",e.target.value)} style={{padding:"8px 10px",fontSize:13}}/>
          </div>
          <div className="iw" style={{marginBottom:8}}>
            <label className="il">Variation B (if unavailable)</label>
            <input className="inp" value={ex.varB} onChange={e=>updEx(tab,i,"varB",e.target.value)} style={{padding:"8px 10px",fontSize:13,color:T.muted}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><label className="il">Sets</label>
              <input className="inp" type="number" value={ex.sets} onChange={e=>updEx(tab,i,"sets",parseInt(e.target.value)||3)} style={{padding:"8px 10px"}}/>
            </div>
            <div><label className="il">Reps</label>
              <input className="inp" value={ex.reps} onChange={e=>updEx(tab,i,"reps",e.target.value)} style={{padding:"8px 10px"}}/>
            </div>
          </div>
          <div className="iw" style={{marginBottom:0}}>
            <label className="il">Coaching Cue</label>
            <input className="inp" value={ex.cue||""} onChange={e=>updEx(tab,i,"cue",e.target.value)} placeholder="e.g. Control the negative" style={{padding:"8px 10px",fontSize:13}}/>
          </div>
        </div>
      ))}
      <button className="btn bp" onClick={save}>Save Templates</button>
    </div>
  );
}

// ── TRANSFORMATION ────────────────────────────────────────────
function Transformation(){
  const[entries,setEntries]=useState(()=>S.get("raf_transformation",[]));
  const[form,setForm]=useState({date:new Date().toISOString().split("T")[0],frontUrl:"",sideUrl:"",backUrl:"",weight:"",notes:""});
  const[videoUrl,setVideoUrl]=useState(()=>S.get("raf_transform_video",""));
  const[toast,show]=useToast();
  const save=()=>{
    const upd=[...entries.filter(e=>e.date!==form.date),{...form,id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date));
    setEntries(upd);S.set("raf_transformation",upd);show("Saved ✓");
    setForm({date:new Date().toISOString().split("T")[0],frontUrl:"",sideUrl:"",backUrl:"",weight:"",notes:""});
  };

  return(
    <div>
      {toast&&<div className="toast">{toast}</div>}
      <div className="cb">
        <div className="cbt">📸 Progress Photos</div>
        <div className="cbtx">Take photos in the same spot, same lighting, same time of day. Front, side and back. Track your transformation week by week.</div>
      </div>

      <div className="card">
        <div className="ct">Coach Video Guide 🎬</div>
        <div className="iw">
          <label className="il">Paste your photo guide video URL</label>
          <input className="inp" placeholder="YouTube / Vimeo / Google Drive link..." value={videoUrl}
            onChange={e=>{setVideoUrl(e.target.value);S.set("raf_transform_video",e.target.value);}}/>
        </div>
        {videoUrl&&<a href={videoUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:T.accentL||"#E8EEFF",borderRadius:8,textDecoration:"none",marginTop:4}}>
          <span style={{fontSize:20}}>▶️</span>
          <span style={{fontSize:13,fontWeight:600,color:T.navy}}>Watch photo guide</span>
          <span style={{marginLeft:"auto",color:T.muted}}>→</span>
        </a>}
      </div>

      <div className="card">
        <div className="ct">Log Entry 📅</div>
        <div className="iw"><label className="il">Date</label>
          <input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <div className="iw"><label className="il">Front Photo (Google Drive / Dropbox link)</label>
          <input className="inp" placeholder="Paste share link..." value={form.frontUrl} onChange={e=>setForm({...form,frontUrl:e.target.value})}/>
        </div>
        <div className="iw"><label className="il">Side Photo (link)</label>
          <input className="inp" placeholder="Paste share link..." value={form.sideUrl} onChange={e=>setForm({...form,sideUrl:e.target.value})}/>
        </div>
        <div className="iw"><label className="il">Back Photo (link)</label>
          <input className="inp" placeholder="Paste share link..." value={form.backUrl} onChange={e=>setForm({...form,backUrl:e.target.value})}/>
        </div>
        <div className="iw"><label className="il">Weight at this date (kg)</label>
          <input className="inp" type="number" step="0.1" placeholder="82.5" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})}/>
        </div>
        <div className="iw"><label className="il">Notes</label>
          <textarea className="inp" rows={2} style={{resize:"none"}} placeholder="How are you feeling? Any changes noticed?" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        </div>
        <button className="btn bp" onClick={save}>Save Entry</button>
      </div>

      {entries.length>0&&<>
        <div className="shdr">History ({entries.length} entries)</div>
        {entries.slice().reverse().map(e=>(
          <div key={e.id||e.date} className="card" style={{padding:"12px 14px"}}>
            <div className="fbt" style={{marginBottom:8}}>
              <span style={{fontWeight:600,fontSize:14}}>{e.date}</span>
              {e.weight&&<span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:T.navy}}>{e.weight} kg</span>}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[["Front",e.frontUrl],["Side",e.sideUrl],["Back",e.backUrl]].filter(([,u])=>u).map(([label,url])=>(
                <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                  style={{padding:"6px 12px",background:T.parchment,borderRadius:6,fontSize:12,fontWeight:600,color:T.navy,textDecoration:"none"}}>
                  📷 {label}
                </a>
              ))}
            </div>
            {e.notes&&<p style={{fontSize:13,color:T.muted,marginTop:8}}>{e.notes}</p>}
          </div>
        ))}
      </>}
    </div>
  );
}

// ── COMPLIANCE OVERVIEW ───────────────────────────────────────
function Compliance({habitData,exerciseLogs,weightLog,cardioLogs,goals}){
  const[filter,setFilter]=useState("month");
  const now=new Date();

  const getFilteredDates=(days)=>{
    const dates=[];
    for(let i=days-1;i>=0;i--){
      const d=new Date(now);d.setDate(d.getDate()-i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const filterDays={week:7,month:30,"3month":90,year:365};
  const dates=getFilteredDates(filterDays[filter]||30);

  // Habit compliance
  const habitDays=dates.filter(d=>Object.keys(habitData[d]||{}).length>0);
  const habitTicks=habitDays.reduce((s,d)=>s+Object.values(habitData[d]||{}).filter(v=>v==="✓").length,0);
  const habitMax=dates.length*6;
  const habitPct=habitMax>0?Math.round(habitTicks/habitMax*100):0;

  // Training compliance (unique session days)
  const trainDays=[...new Set(Object.keys(exerciseLogs).map(k=>k.split("::")[1]).filter(d=>dates.includes(d)))].length;
  const trainTarget=Math.round(dates.length/7*2);
  const trainPct=trainTarget>0?Math.min(Math.round(trainDays/trainTarget*100),100):0;

  // Cardio compliance
  const cardioDays=(cardioLogs||[]).filter(l=>dates.includes(l.date)).length;
  const cardioTarget=Math.round(dates.length/7*3);
  const cardioPct=cardioTarget>0?Math.min(Math.round(cardioDays/cardioTarget*100),100):0;

  // Weight logging compliance
  const weightDays=weightLog.filter(l=>dates.includes(l.date)).length;
  const weightTarget=Math.round(dates.length/7);
  const weightPct=weightTarget>0?Math.min(Math.round(weightDays/weightTarget*100),100):0;

  // Goals achieved
  const achieved=goals.filter(g=>g.status==="Achieved").length;
  const totalGoals=goals.length;

  const categories=[
    {name:"Habits",pct:habitPct,detail:`${habitTicks} ticks from ${habitDays.length} days`,color:habitPct>=70?T.success:habitPct>=40?T.amber:T.red},
    {name:"Training",pct:trainPct,detail:`${trainDays} sessions (target: ${trainTarget})`,color:trainPct>=80?T.success:trainPct>=50?T.amber:T.red},
    {name:"Cardio",pct:cardioPct,detail:`${cardioDays} sessions (target: ${cardioTarget})`,color:cardioPct>=80?T.success:cardioPct>=50?T.amber:T.red},
    {name:"Weight Log",pct:weightPct,detail:`${weightDays} entries (target: ${weightTarget})`,color:weightPct>=80?T.success:weightPct>=50?T.amber:T.red},
  ];

  // Weekly chart data
  const weeklyData=Array.from({length:Math.min(8,Math.round(dates.length/7))},(_,wi)=>{
    const wDates=dates.slice(wi*7,(wi+1)*7);
    const hTicks=wDates.reduce((s,d)=>s+Object.values(habitData[d]||{}).filter(v=>v==="✓").length,0);
    const hMax=wDates.length*6;
    return{week:`W${wi+1}`,habits:hMax>0?Math.round(hTicks/hMax*100):0,training:[...new Set(Object.keys(exerciseLogs).map(k=>k.split("::")[1]).filter(d=>wDates.includes(d)))].length*50};
  });

  const overall=Math.round((habitPct+trainPct+cardioPct+weightPct)/4);

  return(
    <div>
      <div className="tp">
        {[["week","7 days"],["month","30 days"],["3month","3 months"],["year","1 year"]].map(([k,l])=>(
          <button key={k} className={`tpill${filter===k?" active":""}`} onClick={()=>setFilter(k)}>{l}</button>
        ))}
      </div>

      {/* Overall score */}
      <div className="card" style={{background:T.navy,border:"none",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,color:T.gold,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>Overall Compliance</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:48,fontWeight:700,color:overall>=70?T.successL:overall>=40?T.amberL:T.dangerL,lineHeight:1}}>{overall}%</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:4}}>Last {filterDays[filter]} days</div>
          </div>
          <div style={{textAlign:"right"}}>
            {totalGoals>0&&<><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:700,color:T.gold}}>{achieved}/{totalGoals}</div><div style={{fontSize:11,color:"rgba(255,255,255,.6)",textTransform:"uppercase"}}>Goals achieved</div></>}
          </div>
        </div>
      </div>

      {/* Category bars */}
      <div className="card">
        {categories.map(cat=>(
          <div key={cat.name} style={{marginBottom:16}}>
            <div className="fbt" style={{marginBottom:5}}>
              <span style={{fontSize:14,fontWeight:600}}>{cat.name}</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:cat.color}}>{cat.pct}%</span>
            </div>
            <div className="pbw" style={{height:10,marginBottom:4}}>
              <div className="pbf" style={{width:`${cat.pct}%`,background:cat.color,height:"100%"}}/>
            </div>
            <span className="tm">{cat.detail}</span>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {weeklyData.length>1&&<>
        <div className="shdr">Weekly Trend</div>
        <div className="card" style={{padding:"12px 4px"}}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{left:-20,right:8}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="week" tick={{fontSize:10}}/>
              <YAxis domain={[0,100]} tick={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="habits" name="Habits %" fill={T.navy} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>}
    </div>
  );
}

function More({user,goals,setGoals,cardioLogs,setCardioLogs,profile,habitData,exerciseLogs,weightLog}){
  const[tab,setTab]=useState("goals");
  const tabs=[["goals","🎯 Goals"],["checkin","📋 Check-in"],["meas","📏 Meas"],["cardio","🏃 Cardio"],["nutrition","🥗 Nutrition"],["templates","📋 Templates"],["programme","📈 Programme"],["transform","📸 Photos"],["compliance","📊 Compliance"],...(user.role==="coach"?[["coach","🔒 Coach"]]:[])]
  return(
    <div>
      <div className="tp">{tabs.map(([id,l])=><button key={id} className={`tpill${tab===id?" active":""}`} onClick={()=>setTab(id)}>{l}</button>)}</div>
      {tab==="goals"&&<Goals goals={goals} setGoals={setGoals}/>}
      {tab==="checkin"&&<CheckIn/>}
      {tab==="meas"&&<Measurements/>}
      {tab==="cardio"&&<Cardio cardioLogs={cardioLogs} setCardioLogs={setCardioLogs}/>}
      {tab==="nutrition"&&<Nutrition profile={profile}/>}
      {tab==="templates"&&<Templates/>}
      {tab==="programme"&&<ProgrammeCard/>}
      {tab==="transform"&&<Transformation/>}
      {tab==="compliance"&&<Compliance habitData={habitData} exerciseLogs={exerciseLogs} weightLog={weightLog} cardioLogs={cardioLogs} goals={goals}/>}
      {tab==="coach"&&<CoachNotes/>}
    </div>
  );
}

// ── MAIN ────────────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(()=>S.get("raf_current",null));
  const[tab,setTab]=useState("home");
  const[loading,setLoading]=useState(true);
  const[habitData,setHabitDataRaw]=useState({});
  const[exerciseLogs,setExerciseLogsRaw]=useState({});
  const[weightLog,setWeightLogRaw]=useState([]);
  const[goals,setGoalsRaw]=useState([]);
  const[cardioLogs,setCardioLogsRaw]=useState([]);
  const[profile,setProfileRaw]=useState(null);

  // Wrap setters to also save to Supabase
  const uid=user?.id;
  const setHabitData=async(v)=>{setHabitDataRaw(v);S.set("raf_habit_data",v);if(uid)await DB.save(uid,"habit_data",v);};
  const setExerciseLogs=async(v)=>{setExerciseLogsRaw(v);S.set("raf_exercise_logs",v);if(uid)await DB.save(uid,"exercise_logs",v);};
  const setWeightLog=async(v)=>{setWeightLogRaw(v);S.set("raf_weight_log",v);if(uid)await DB.save(uid,"weight_log",v);};
  const setGoals=async(v)=>{setGoalsRaw(v);S.set("raf_goals",v);if(uid)await DB.save(uid,"goals",v);};
  const setCardioLogs=async(v)=>{setCardioLogsRaw(v);S.set("raf_cardio_logs",v);if(uid)await DB.save(uid,"cardio_logs",v);};
  const setProfile=async(v)=>{setProfileRaw(v);if(uid){S.set(`raf_profile_${uid}`,v);await DB.saveProfile(uid,v);}};

  // Load all data from Supabase when user logs in
  useEffect(()=>{
    const loadData=async(u)=>{
      if(!u?.id){setLoading(false);return;}
      setLoading(true);
      const[hd,el,wl,gl,cl,pf]=await Promise.all([
        DB.load(u.id,"habit_data",S.get("raf_habit_data",{})),
        DB.load(u.id,"exercise_logs",S.get("raf_exercise_logs",{})),
        DB.load(u.id,"weight_log",S.get("raf_weight_log",[])),
        DB.load(u.id,"goals",S.get("raf_goals",[])),
        DB.load(u.id,"cardio_logs",S.get("raf_cardio_logs",[])),
        DB.loadProfile(u.id),
      ]);
      setHabitDataRaw(hd);setExerciseLogsRaw(el);setWeightLogRaw(wl);
      setGoalsRaw(gl);setCardioLogsRaw(cl);setProfileRaw(pf);
      setLoading(false);
    };

    // Check existing Supabase session on load
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){
        const cached=S.get("raf_current",null);
        const u=cached||{id:session.user.id,email:session.user.email,name:session.user.email,role:"client"};
        setUser(u);loadData(u);
      }else{setLoading(false);}
    });

    // Listen for auth state changes
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      if(!session){setUser(null);S.set("raf_current",null);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{if(user)loadUserData(user);},[user?.id]);

  const loadUserData=async(u)=>{
    if(!u?.id)return;
    const[hd,el,wl,gl,cl,pf]=await Promise.all([
      DB.load(u.id,"habit_data",S.get("raf_habit_data",{})),
      DB.load(u.id,"exercise_logs",S.get("raf_exercise_logs",{})),
      DB.load(u.id,"weight_log",S.get("raf_weight_log",[])),
      DB.load(u.id,"goals",S.get("raf_goals",[])),
      DB.load(u.id,"cardio_logs",S.get("raf_cardio_logs",[])),
      DB.loadProfile(u.id),
    ]);
    setHabitDataRaw(hd);setExerciseLogsRaw(el);setWeightLogRaw(wl);
    setGoalsRaw(gl);setCardioLogsRaw(cl);setProfileRaw(pf);
  };

  if(loading)return(
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:T.navy,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
        <Roundel size={60}/>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:T.white,letterSpacing:".1em"}}>LOADING...</div>
      </div>
    </>
  );

  if(!user)return<><style>{CSS}</style><Login onLogin={async u=>{setUser(u);S.set("raf_current",u);}}/></>;

  const tabs=[{id:"home",icon:"🏠",label:"Home"},{id:"habits",icon:"✅",label:"Habits"},{id:"training",icon:"🏋️",label:"Train"},{id:"weight",icon:"⚖️",label:"Weight"},{id:"more",icon:"☰",label:"More"}];
  
  const logout=async()=>{
    await supabase.auth.signOut();
    S.set("raf_current",null);
    setUser(null);
    setHabitDataRaw({});setExerciseLogsRaw({});setWeightLogRaw([]);
    setGoalsRaw([]);setCardioLogsRaw([]);setProfileRaw(null);
  };
  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <nav className="nav"><div className="nav-brand"><Roundel size={34}/><div><div className="nav-title">SPITFIRE FIT</div><div className="nav-sub">Coaching Platform</div></div></div><div className="nav-av" onClick={()=>setTab("profile")}>{user.name.charAt(0)}</div></nav>
        <main className="content">
          {tab==="home"&&<Dashboard user={user} habitData={habitData} exerciseLogs={exerciseLogs} weightLog={weightLog} goals={goals} cardioLogs={cardioLogs}/>}
          {tab==="habits"&&<Habits habitData={habitData} setHabitData={setHabitData}/>}
          {tab==="training"&&<Training exerciseLogs={exerciseLogs} setExerciseLogs={setExerciseLogs}/>}
          {tab==="weight"&&<Weight weightLog={weightLog} setWeightLog={setWeightLog}/>}
          {tab==="more"&&<More user={user} goals={goals} setGoals={setGoals} cardioLogs={cardioLogs} setCardioLogs={setCardioLogs} profile={profile} habitData={habitData} exerciseLogs={exerciseLogs} weightLog={weightLog}/>}
          {tab==="profile"&&<Profile user={user} profile={profile} setProfile={setProfile} onLogout={logout}/>}
        </main>
        <nav className="tbar">{tabs.map(t=><button key={t.id} className={`ti${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}><span className="ti-icon">{t.icon}</span><span className="ti-label">{t.label}</span></button>)}</nav>
      </div>
    </>
  );
}
