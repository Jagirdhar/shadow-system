(() => {
  "use strict";
  const KEY = "shadowSystemSave_v1";
  const $ = (id) => document.getElementById(id);
  const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const weekKey = (d = new Date()) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return localDate(x);
  };
  const dateLabel = (s) => new Date(`${s}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
  const today = localDate();
  const defaultQuests = [
    {id:"walk",title:"Move your body",desc:"Complete a comfortable walk. Start from your current ability; short walks count.",xp:20,category:"MOVEMENT"},
    {id:"strength",title:"Strength training or recovery",desc:"Follow a comfortable beginner session OR choose a deliberate recovery day. Never train through pain.",xp:25,category:"TRAINING"},
    {id:"water",title:"Hydration check",desc:"Drink water regularly through the day; adjust for heat, activity, and medical advice.",xp:10,category:"HEALTH"},
    {id:"meal",title:"Balanced meal choice",desc:"Include protein and vegetables or fruit in a balanced meal. No crash dieting.",xp:15,category:"NUTRITION"},
    {id:"sleep",title:"Protect recovery",desc:"Make a realistic plan for adequate sleep and wind-down time.",xp:10,category:"RECOVERY"}
  ];
  const prayerTasks = [
    {id:"fajr",label:"Fajr"},
    {id:"dhuhr",label:"Dhuhr"},
    {id:"asr",label:"Asr"},
    {id:"maghrib",label:"Maghrib"},
    {id:"isha",label:"Isha"},
    {id:"quran",label:"Qur'an / beneficial learning"}
  ];
  const blank = () => ({
    version:1, xp:0, totalCompleted:0, completed:{}, xpEvents:[], activities:[], weights:[],
    prayer:{}, learningDays:{}, bossRewards:[], createdAt:new Date().toISOString(), lastOpened:today
  });
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw);
      return {...blank(),...parsed,completed:parsed.completed||{},xpEvents:parsed.xpEvents||[],activities:parsed.activities||[],weights:parsed.weights||[],prayer:parsed.prayer||{},learningDays:parsed.learningDays||{},bossRewards:parsed.bossRewards||[]};
    } catch (e) { return blank(); }
  }
  let state = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); $("saveStatus").textContent = "saved"; }
    catch(e) { $("saveStatus").textContent = "save error"; toast("Could not save. Your browser storage may be full."); }
  }
  function xpForLevel(level) { return 100 * level; }
  function levelFromXP(xp) {
    let level=1, remaining=xp;
    while (remaining >= xpForLevel(level)) { remaining -= xpForLevel(level); level++; if(level>999) break; }
    return {level,into:remaining,needed:xpForLevel(level)};
  }
  function rank(level) {
    if(level>=50)return "S-RANK HUNTER";
    if(level>=35)return "A-RANK HUNTER";
    if(level>=22)return "B-RANK HUNTER";
    if(level>=12)return "C-RANK HUNTER";
    if(level>=5)return "D-RANK HUNTER";
    return "E-RANK HUNTER";
  }
  function toast(message) {
    const el=$("toast"); el.textContent=message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2800);
  }
  function gainXP(amount,reason) {
    state.xp += amount;
    state.xpEvents.unshift({date:today,amount,reason});
    state.xpEvents=state.xpEvents.slice(0,300);
    const info=levelFromXP(state.xp);
    save(); toast(`+${amount} XP • ${reason}`);
    if(info.into < amount) setTimeout(()=>toast(`LEVEL UP! You reached Level ${info.level}. Keep building safely.`),900);
    render();
  }
  function isDone(id,date=today) { return Boolean(state.completed[date]?.[id]); }
  function eligibleDailyCount(date=today) {
    const daily=state.completed[date]||{};
    return Object.values(daily).some(Boolean);
  }
  function completeQuest(id) {
    const q=defaultQuests.find(x=>x.id===id);
    if(!q)return;
    state.completed[today]=state.completed[today]||{};
    if(state.completed[today][id]) { toast("Quest already cleared. No duplicate XP."); return; }
    // Validation: only quests defined by the app can be completed, once per local day.
    state.completed[today][id]=true;
    state.totalCompleted++;
    state.xp+=q.xp;
    state.xpEvents.unshift({date:today,amount:q.xp,reason:q.title});
    state.xpEvents=state.xpEvents.slice(0,300);
    save();
    toast(`Quest cleared: +${q.xp} XP`);
    checkBossReward();
    render();
  }
  function checkBossReward() {
    const wk=weekKey();
    const days=Object.keys(state.completed).filter(d=>d>=wk && d<=today && Object.values(state.completed[d]||{}).some(Boolean));
    if(days.length>=5 && !state.bossRewards.includes(wk)) {
      state.bossRewards.push(wk); state.xp+=150;
      state.xpEvents.unshift({date:today,amount:150,reason:"Weekly Boss defeated"});
      state.xpEvents=state.xpEvents.slice(0,300);
      save(); setTimeout(()=>toast("WEEKLY BOSS DEFEATED! +150 XP"),500);
    }
  }
  function currentStreak() {
    let count=0, d=new Date();
    // Count backwards from today; if today is not complete, start yesterday.
    if(!eligibleDailyCount(localDate(d))) d.setDate(d.getDate()-1);
    while(count<366) {
      const k=localDate(d);
      if(!eligibleDailyCount(k)) break;
      count++; d.setDate(d.getDate()-1);
    }
    return count;
  }
  function renderQuest(q) {
    const done=isDone(q.id);
    return `<article class="quest-card ${done?"done":""}"><button class="quest-check" aria-label="${done?"Completed":"Complete"} ${escapeHTML(q.title)}" ${done?"disabled":""} data-complete="${q.id}">${done?"✓":"✓"}</button><div class="quest-body"><div class="quest-title">${escapeHTML(q.title)}</div><div class="quest-desc">${escapeHTML(q.desc)}</div><div class="quest-meta"><span class="tag">${escapeHTML(q.category)}</span><span class="muted small">${done?"CLEARED TODAY":"DAILY OBJECTIVE"}</span></div></div><span class="xp-tag">+${q.xp} XP</span><button class="quest-action" data-complete="${q.id}" ${done?"disabled":""}>${done?"CLEARED":"Complete"}</button></article>`;
  }
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function renderQuests() {
    const html=defaultQuests.map(renderQuest).join("");
    $("dashboardQuests").innerHTML=html;
    $("allQuests").innerHTML=html;
    document.querySelectorAll("[data-complete]").forEach(btn=>btn.addEventListener("click",()=>completeQuest(btn.dataset.complete)));
    $("navQuestCount").textContent=defaultQuests.filter(q=>!isDone(q.id)).length;
  }
  function renderPrayer() {
    const todays=state.prayer[today]||{};
    $("prayerQuests").innerHTML=prayerTasks.map(t=>`<label class="prayer-item ${todays[t.id]?"checked":""}"><input type="checkbox" data-prayer="${t.id}" ${todays[t.id]?"checked":""}><span>${escapeHTML(t.label)}</span></label>`).join("");
    document.querySelectorAll("[data-prayer]").forEach(el=>el.addEventListener("change",()=>{
      state.prayer[today]=state.prayer[today]||{};
      const id=el.dataset.prayer;
      const was=Boolean(state.prayer[today][id]);
      if(el.checked && !was) {
        state.prayer[today][id]=true;
        // Prayer checkboxes are a personal tracker; XP is not assigned to Salah itself.
        save(); renderPrayer(); toast("Checklist updated. Worship is not measured by XP.");
      } else if(!el.checked && was) {
        state.prayer[today][id]=false; save(); renderPrayer();
      }
    }));
  }
  function renderBoss() {
    const wk=weekKey();
    const days=Object.keys(state.completed).filter(d=>d>=wk && d<=today && Object.values(state.completed[d]||{}).some(Boolean));
    const count=Math.min(days.length,5), pct=count/5*100;
    $("bossBar").style.width=pct+"%"; $("dashBossBar").style.width=pct+"%";
    $("bossProgress").textContent=`${count}/5`; $("dashBossCount").textContent=`${count}/5`;
    $("bossTitle").textContent=count>=5?"The Consistency Gate — DEFEATED":"The Consistency Gate";
    $("dashBossName").textContent=count>=5?"Boss defeated":"The Consistency Gate";
    $("bossText").textContent=count>=5?"You completed five qualifying days this week. Return next week for a new trial.":`Clear at least one daily quest on ${5-count} more day${5-count===1?"":"s"} this week.`;
    $("dashBossDesc").textContent=`${count}/5 qualifying days this week. Safe movement and recovery both count.`;
  }
  function renderActivityHistory() {
    const entries=state.activities.slice(0,8);
    $("activityHistory").innerHTML=entries.length?entries.map(a=>`<div class="record-row"><div><strong>${escapeHTML(a.type)} • ${a.steps.toLocaleString()} steps</strong><span>${dateLabel(a.date)} · ${a.minutes} min · ${escapeHTML(a.effort)}</span></div><span>${a.effort==="Pain"?"Review symptoms":"Logged"}</span></div>`).join(""):`<div class="record-row"><span>No activity logs yet.</span></div>`;
  }
  function renderHistory() {
    $("historyXP").textContent=state.xp.toLocaleString(); $("historyDone").textContent=state.totalCompleted.toLocaleString();
    $("historyWeights").textContent=state.weights.length; $("historyActivities").textContent=state.activities.length;
    $("xpHistory").innerHTML=state.xpEvents.length?state.xpEvents.slice(0,8).map(e=>`<div class="record-row"><div><strong>${escapeHTML(e.reason)}</strong><span>${dateLabel(e.date)}</span></div><b class="xp-tag">+${e.amount}</b></div>`).join(""):`<div class="empty">Complete your first quest to start your XP record.</div>`;
    $("weightHistory").innerHTML=state.weights.length?state.weights.slice(0,8).map(w=>`<div class="record-row"><div><strong>${w.kg.toFixed(1)} kg</strong><span>${dateLabel(w.date)}${w.note?" · "+escapeHTML(w.note):""}</span></div></div>`).join(""):`<div class="empty">Your weight entries will appear here.</div>`;
  }
  function render() {
    const l=levelFromXP(state.xp), r=rank(l.level), pct=l.into/l.needed*100;
    $("levelSide").textContent=l.level; $("xpSide").textContent=`${state.xp.toLocaleString()} XP`;
    $("xpBarSide").style.width=pct+"%"; $("xpToNext").textContent=`${l.needed-l.into} XP to next level`;
    $("rankLabel").textContent=r; $("levelMain").textContent=l.level; $("rankMain").textContent=r; $("xpMain").textContent=state.xp.toLocaleString();
    $("completedMain").textContent=state.totalCompleted.toLocaleString(); $("streakMain").textContent=currentStreak();
    $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
    $("heroDate").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
    const lastW=state.weights[0]; $("dashWeight").textContent=lastW?`${lastW.kg.toFixed(1)} kg`:"Not logged"; $("latestWeight").textContent=lastW?`${lastW.kg.toFixed(1)} kg · ${dateLabel(lastW.date)}`:"No weight recorded";
    const todayAct=state.activities.find(a=>a.date===today);
    $("dashSteps").textContent=todayAct?todayAct.steps.toLocaleString():"0"; $("dashWorkouts").textContent=state.activities.filter(a=>a.type==="Strength").length;
    renderQuests(); renderPrayer(); renderBoss(); renderActivityHistory(); renderHistory();
  }
  function setView(name) {
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
    document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    window.scrollTo({top:0,behavior:"smooth"});
  }
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.goto)));
  $("activityForm").addEventListener("submit",e=>{
    e.preventDefault();
    const steps=Number($("stepsInput").value), minutes=Number($("minutesInput").value||0), type=$("workoutType").value, effort=$("effortInput").value;
    if(!Number.isFinite(steps)||steps<0||steps>100000||!Number.isFinite(minutes)||minutes<0||minutes>240){toast("Check your steps and minutes.");return;}
    state.activities.unshift({date:today,steps,minutes,type,effort});
    state.activities=state.activities.slice(0,500); save();
    if(effort==="Pain") toast("Log saved. Stop aggravating activity and seek clinical advice for radiating or persistent pain.");
    else toast("Activity log saved.");
    $("stepsInput").value=""; $("minutesInput").value=""; render();
  });
  $("weightForm").addEventListener("submit",e=>{
    e.preventDefault(); const kg=Number($("weightInput").value);
    if(!Number.isFinite(kg)||kg<20||kg>350){toast("Enter a valid weight in kilograms.");return;}
    state.weights.unshift({date:today,kg,note:$("weightNote").value.trim()}); state.weights=state.weights.slice(0,500); save();
    $("weightInput").value=""; $("weightNote").value=""; render(); toast("Weight recorded. Focus on long-term trends, not daily fluctuations.");
  });
  $("learningDone").addEventListener("click",()=>{
    if(state.learningDays[today]){toast("Learning quest already recorded today.");return;}
    state.learningDays[today]=true; state.xp+=15; state.xpEvents.unshift({date:today,amount:15,reason:"Beneficial learning"}); state.xpEvents=state.xpEvents.slice(0,300); save(); render(); toast("Learning quest complete: +15 XP");
  });
  $("resetPrayer").addEventListener("click",()=>{
    if(!confirm("Reset today's Salah and learning checklist? This does not change XP."))return;
    delete state.prayer[today]; save(); renderPrayer(); toast("Today's checklist reset.");
  });
  $("exportBtn").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`shadow-system-backup-${today}.json`; a.click(); URL.revokeObjectURL(url); toast("Backup exported.");
  });
  $("importFile").addEventListener("change",async e=>{
    const f=e.target.files[0]; if(!f)return;
    try {
      const parsed=JSON.parse(await f.text());
      if(typeof parsed.xp!=="number"||!parsed.completed||!Array.isArray(parsed.xpEvents))throw new Error("invalid");
      if(!confirm("Import this save and replace the current progress? Export a backup first if needed."))return;
      state={...blank(),...parsed}; save(); render(); toast("Backup imported.");
    } catch(err){toast("That file doesn't look like a valid Shadow System backup.");}
    e.target.value="";
  });
  $("resetAllBtn").addEventListener("click",()=>{
    if(!confirm("Reset ALL Shadow System progress on this device? This cannot be undone unless you exported a backup."))return;
    state=blank(); save(); render(); toast("System reset. Your new journey starts now.");
  });
  $("notifyBtn").addEventListener("click",async()=>{
    if(!("Notification" in window)){toast("This browser doesn't support notifications. Use a daily phone alarm instead.");return;}
    if(Notification.permission==="granted"){toast("Notifications are enabled where the browser permits them. Use your phone's app settings for notification controls.");return;}
    const p=await Notification.requestPermission();
    if(p==="granted"){toast("Notifications permission granted. This PWA does not run a background scheduler; set a phone alarm for a reliable daily reminder.");}
    else toast("Notifications not enabled. You can still use your phone's alarm.");
  });
  let installPrompt=null;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").classList.remove("hidden");});
  $("installBtn").addEventListener("click",async()=>{
    if(!installPrompt){toast("To install: open browser menu and choose Add to Home screen.");return;}
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; $("installBtn").classList.add("hidden");
  });
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")) {
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  }
  // When a new day begins, completed quest history remains but today's checklist starts empty.
  if(state.lastOpened!==today){state.lastOpened=today;save();}
  render();
})();