import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import type { Contest } from '@/types/contest';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PLATFORMS = ['algoforge','codeforces','leetcode','codechef','atcoder','hackerrank'] as const;
type Platform = typeof PLATFORMS[number];
type CalContest = Contest & { source: Platform; cfId?: number; lcSlug?: string; ccCode?: string; atId?: string; hrSlug?: string };
type View = 'month' | 'week' | 'day';

// Maps platform to short CSS code used as modifier class
function pCode(source: Platform): string {
  const m: Record<Platform,string> = { algoforge:'', codeforces:'cf', leetcode:'lc', codechef:'cc', atcoder:'at', hackerrank:'hr' };
  return m[source] || '';
}
function platformLabel(p: Platform) { return p==='algoforge'?'AlgoForge':p.charAt(0).toUpperCase()+p.slice(1); }
function getStatus(c: CalContest) {
  const now=Date.now(), s=new Date(c.startsAt).getTime(), e=new Date(c.endsAt).getTime();
  return now>=s&&now<e?'active':now>=e?'ended':'upcoming';
}
function fmtTime(d: string) { return new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:'numeric'}); }
function isToday(y:number,m:number,d:number) { const t=new Date(); return t.getFullYear()===y&&t.getMonth()===m&&t.getDate()===d; }
function contestsOnDay(all:CalContest[], vis:Set<Platform>, y:number, m:number, d:number) {
  return all.filter(c => vis.has(c.source) && (() => { const s=new Date(c.startsAt); return s.getFullYear()===y&&s.getMonth()===m&&s.getDate()===d; })())
    .sort((a,b) => new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime());
}
function buildGcalUrl(c: CalContest) {
  function g(iso:string){return iso.replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z').slice(0,15)+'Z';}
  let url='', details='';
  if(c.source==='codeforces'){url=`https://codeforces.com/contest/${c.cfId}`;details=`Codeforces contest\n${url}`;}
  else if(c.source==='leetcode'){url=`https://leetcode.com/contest/${c.lcSlug}`;details=`LeetCode contest\n${url}`;}
  else if(c.source==='codechef'){url=`https://www.codechef.com/${c.ccCode}`;details=`CodeChef contest\n${url}`;}
  else if(c.source==='atcoder'){url=`https://atcoder.jp/contests/${c.atId}`;details=`AtCoder contest\n${url}`;}
  else if(c.source==='hackerrank'){url=`https://www.hackerrank.com/contests/${c.hrSlug}`;details=`HackerRank contest\n${url}`;}
  else{url='https://algoforge-1-mbk5.onrender.com/contests';details=`AlgoForge · Code: ${c.code}\n${url}`;}
  const p=new URLSearchParams({action:'TEMPLATE',text:c.title,dates:`${g(c.startsAt)}/${g(c.endsAt)}`,details,location:url});
  return `https://calendar.google.com/calendar/render?${p}`;
}

const LOGO_URLS: Partial<Record<Platform,string>> = {
  codeforces: 'https://codeforces.com/favicon-32x32.png',
  leetcode: 'https://leetcode.com/favicon-192x192.png',
  codechef: 'https://www.codechef.com/favicon.ico',
  atcoder: 'https://img.atcoder.jp/assets/favicon.png',
  hackerrank: 'https://www.hackerrank.com/favicon.ico',
};
function PlatformLogo({ source }: { source: Platform }) {
  const src = LOGO_URLS[source]; if (!src) return null;
  return <img src={src} className="cf-logo-icon" alt={source} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />;
}

// Layout engine for day view events
function layoutDayEvents(contests: CalContest[]) {
  const items = contests.map(c=>{
    const start=new Date(c.startsAt), end=new Date(c.endsAt);
    const startMins=start.getHours()*60+start.getMinutes();
    const durMins=Math.max(45,(end.getTime()-start.getTime())/60000);
    return {c,startMins,endMins:startMins+durMins,col:0,numCols:1};
  }).sort((a,b)=>a.startMins-b.startMins||a.endMins-b.endMins);
  const colEnds: number[]=[];
  items.forEach(ev=>{
    let placed=false;
    for(let i=0;i<colEnds.length;i++){if(colEnds[i]<=ev.startMins){ev.col=i;colEnds[i]=ev.endMins;placed=true;break;}}
    if(!placed){ev.col=colEnds.length;colEnds.push(ev.endMins);}
  });
  items.forEach(ev=>{ev.numCols=items.filter(o=>o.startMins<ev.endMins&&o.endMins>ev.startMins).length;});
  return items.map(ev=>{
    const top=(ev.startMins/60)*60, height=Math.max(52,((ev.endMins-ev.startMins)/60)*60);
    const colW=98/ev.numCols, leftPct=ev.col*(colW+1);
    return {contest:ev.c,top,height,leftPct,widthPct:colW-1};
  });
}

// Time column used in week & day views
function TimeColumn({ cls='week-time-col' }: { cls?: string }) {
  return (
    <div className={cls}>
      {Array.from({length:24},(_,h)=>(
        <div key={h} className="week-time-slot">
          <span className="week-time-label">
            {h===0?'':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`}
          </span>
        </div>
      ))}
    </div>
  );
}

// Sliding event detail panel
function EventPanel({ contest, onClose }: { contest: CalContest|null; onClose:()=>void }) {
  const [copied, setCopied] = useState(false);
  const status = contest ? getStatus(contest) : 'upcoming';
  const isOpen = !!contest;
  const isExternal = contest ? ['codeforces','leetcode','codechef','atcoder','hackerrank'].includes(contest.source) : false;

  if (!contest) {
    return (
      <>
        <div className="event-panel-backdrop" />
        <div className="event-panel" />
      </>
    );
  }

  const start=new Date(contest.startsAt), end=new Date(contest.endsAt);
  const durMins=Math.round((end.getTime()-start.getTime())/60000);
  const durStr=durMins>=60?`${Math.floor(durMins/60)}h${durMins%60?' '+(durMins%60)+'m':''}`:`${durMins}m`;

  const epBtnCls = (() => {
    const src = contest.source;
    if(src==='codeforces') return 'ep-btn ep-btn-cf';
    if(src==='leetcode')   return 'ep-btn ep-btn-lc';
    if(src==='codechef')   return 'ep-btn ep-btn-cc';
    if(src==='atcoder')    return 'ep-btn ep-btn-at';
    if(src==='hackerrank') return 'ep-btn ep-btn-hr';
    return status==='active'?'ep-btn ep-btn-primary':'ep-btn ep-btn-secondary';
  })();

  const platformBadgeCls = (() => {
    const src = contest.source;
    if(src==='codeforces') return 'ep-cf-badge';
    if(src==='leetcode')   return 'ep-lc-badge';
    if(src==='codechef')   return 'ep-cc-badge';
    if(src==='atcoder')    return 'ep-at-badge';
    if(src==='hackerrank') return 'ep-hr-badge';
    return '';
  })();

  function ActionBtn() {
    if (contest!.source==='codeforces') {
      const url=contest!.cfId?`https://codeforces.com/contest/${contest!.cfId}`:'https://codeforces.com/contests';
      return <a className={epBtnCls} href={url} target="_blank" rel="noopener noreferrer"><PlatformLogo source="codeforces" /> Open on Codeforces ↗</a>;
    }
    if (contest!.source==='leetcode') return <a className={epBtnCls} href={`https://leetcode.com/contest/${contest!.lcSlug}`} target="_blank" rel="noopener noreferrer"><PlatformLogo source="leetcode" /> Open on LeetCode ↗</a>;
    if (contest!.source==='codechef') return <a className={epBtnCls} href={`https://www.codechef.com/${contest!.ccCode}`} target="_blank" rel="noopener noreferrer"><PlatformLogo source="codechef" /> Open on CodeChef ↗</a>;
    if (contest!.source==='atcoder') return <a className={epBtnCls} href={`https://atcoder.jp/contests/${contest!.atId}`} target="_blank" rel="noopener noreferrer"><PlatformLogo source="atcoder" /> Open on AtCoder ↗</a>;
    if (contest!.source==='hackerrank') return <a className={epBtnCls} href={`https://www.hackerrank.com/contests/${contest!.hrSlug}`} target="_blank" rel="noopener noreferrer"><PlatformLogo source="hackerrank" /> Open on HackerRank ↗</a>;
    if (status==='active') return <Link to={`/contest-editor/${contest!.code}`} className={epBtnCls}>Enter Contest →</Link>;
    if (status==='upcoming') return <Link to="/contests" className={epBtnCls}>View in Contests</Link>;
    return <Link to={`/contest-results/${contest!.code}`} className={epBtnCls}>View Results</Link>;
  }

  return (
    <>
      <div className={`event-panel-backdrop${isOpen?' open':''}`} onClick={onClose} />
      <div className={`event-panel${isOpen?' open':''}`}>
        <button className="event-panel-close" onClick={onClose}>×</button>
        <div className="event-panel-inner">
          <div className="ep-top-row">
            <span className={`ep-status-bar ${status}`}>
              <span className="ep-status-dot" />
              {status.charAt(0).toUpperCase()+status.slice(1)}
            </span>
            {isExternal && platformBadgeCls && (
              <span className={platformBadgeCls}>
                <PlatformLogo source={contest.source} />
                {platformLabel(contest.source)}
              </span>
            )}
          </div>
          <div className="ep-title">{contest.title}</div>
          {contest.description && <p className="ep-desc">{contest.description}</p>}
          <div className="ep-meta-grid">
            <div className="ep-meta-row">
              <div className="ep-meta-icon">📅</div>
              <div>
                <div className="ep-meta-label">Date</div>
                <div className="ep-meta-value">{fmtDate(contest.startsAt)}</div>
              </div>
            </div>
            <div className="ep-meta-row">
              <div className="ep-meta-icon">⏰</div>
              <div>
                <div className="ep-meta-label">Time</div>
                <div className="ep-meta-value">{fmtTime(contest.startsAt)} – {fmtTime(contest.endsAt)} ({durStr})</div>
              </div>
            </div>
            {!isExternal && <>
              <div className="ep-meta-row">
                <div className="ep-meta-icon">🔑</div>
                <div>
                  <div className="ep-meta-label">Code</div>
                  <div className="ep-meta-value"><span className="ep-code-badge">{contest.code}</span></div>
                </div>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-icon">📝</div>
                <div>
                  <div className="ep-meta-label">Problems</div>
                  <div className="ep-meta-value">{contest.problemCount} problems</div>
                </div>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-icon">👥</div>
                <div>
                  <div className="ep-meta-label">Participants</div>
                  <div className="ep-meta-value">{contest.participantCount} joined</div>
                </div>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-icon">👤</div>
                <div>
                  <div className="ep-meta-label">Created by</div>
                  <div className="ep-meta-value">{contest.createdByName || 'Unknown'}</div>
                </div>
              </div>
            </>}
          </div>
          <div className="ep-divider" />
          <div className="ep-actions">
            <ActionBtn />
            {!isExternal && (
              <button className="ep-btn ep-btn-secondary" onClick={() => {
                navigator.clipboard.writeText(contest.code).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
              }}>
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            )}
            <a href={buildGcalUrl(contest)} target="_blank" rel="noopener noreferrer" className="ep-btn ep-btn-gcal">
              <img src="https://calendar.google.com/googlecalendar/images/favicon_v2014_1.ico" className="gcal-logo" alt="gcal" />
              Add to Google Calendar
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Calendar Component ──────────────────────────────────────────────────
export default function Calendar() {
  const { getHeaders } = useAuth();
  const [contests, setContests] = useState<CalContest[]>([]);
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => { const d=new Date(); d.setDate(1); return d; });
  const [miniCursor, setMiniCursor] = useState(() => { const d=new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(new Set(PLATFORMS));
  const [selectedContest, setSelectedContest] = useState<CalContest|null>(null);
  const weekBodyRef = useRef<HTMLDivElement>(null);

  // calendar.css sets body { overflow: hidden } but globals.css overrides it to auto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const addContests = useCallback((incoming: CalContest[]) => {
    setContests(prev => {
      const seen=new Set(prev.map(c=>c.code));
      const fresh=incoming.filter(c=>!seen.has(c.code));
      return fresh.length?[...prev,...fresh]:prev;
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const h=getHeaders() as Record<string,string>;
        const [r1,r2]=await Promise.all([fetch(`${API_BASE_URL}/api/contests/available`,{headers:h}),fetch(`${API_BASE_URL}/api/contests`,{headers:h})]);
        const [d1,d2]=await Promise.all([r1.json(),r2.json()]);
        const merged:CalContest[]=[],seen=new Set<string>();
        for(const c of [...(d1.contests||[]),(d2.contests||[])]) { if(!seen.has(c.code)){seen.add(c.code);merged.push({...c,source:'algoforge'});} }
        addContests(merged);
      } catch {}
      const exLoaders=[
        async()=>{const res=await fetch(`${API_BASE_URL}/api/codeforces-contests`);const data=await res.json();addContests((data.contests||[]).map((c:any)=>({source:'codeforces'as Platform,code:`cf-${c.id}`,cfId:c.id,title:c.name,description:`${c.type}·${Math.round(c.durationSeconds/60)}min`,startsAt:new Date(c.startTimeSeconds*1000).toISOString(),endsAt:new Date((c.startTimeSeconds+c.durationSeconds)*1000).toISOString(),problemCount:0,participantCount:0,createdByName:'Codeforces'})));},
        async()=>{const res=await fetch(`${API_BASE_URL}/api/leetcode-contests`);const data=await res.json();addContests((data.contests||[]).map((c:any)=>({source:'leetcode'as Platform,code:`lc-${c.titleSlug}`,lcSlug:c.titleSlug,title:c.title,description:`${Math.round(c.duration/60)}min·LeetCode`,startsAt:new Date(c.startTime*1000).toISOString(),endsAt:new Date((c.startTime+c.duration)*1000).toISOString(),problemCount:4,participantCount:0,createdByName:'LeetCode'})));},
        async()=>{const res=await fetch(`${API_BASE_URL}/api/codechef-contests`);const data=await res.json();addContests((data.contests||[]).map((c:any)=>({source:'codechef'as Platform,code:`cc-${c.code}`,ccCode:c.code,title:c.name,description:`${c.durationMins}min·CodeChef`,startsAt:new Date(c.startTime).toISOString(),endsAt:new Date(c.endTime).toISOString(),problemCount:0,participantCount:0,createdByName:'CodeChef'})));},
        async()=>{const res=await fetch(`${API_BASE_URL}/api/atcoder-contests`);const data=await res.json();addContests((data.contests||[]).map((c:any)=>({source:'atcoder'as Platform,code:`at-${c.id}`,atId:c.id,title:c.title,description:`${c.durationMins}min${c.rateChange?'·Rated '+c.rateChange:''}`,startsAt:new Date(c.startTime).toISOString(),endsAt:new Date(c.endTime).toISOString(),problemCount:0,participantCount:0,createdByName:'AtCoder'})));},
        async()=>{const res=await fetch(`${API_BASE_URL}/api/hackerrank-contests`);const data=await res.json();addContests((data.contests||[]).map((c:any)=>({source:'hackerrank'as Platform,code:`hr-${c.slug}`,hrSlug:c.slug,title:c.title,description:`${c.durationMins}min·HackerRank`,startsAt:new Date(c.startTime).toISOString(),endsAt:new Date(c.endTime).toISOString(),problemCount:0,participantCount:0,createdByName:'HackerRank'})));},
      ];
      await Promise.allSettled(exLoaders.map(fn=>fn()));
    }
    load();
    const iv=setInterval(load,60000);
    return () => clearInterval(iv);
  }, [addContests, getHeaders]);

  // Scroll week view to first upcoming contest
  useEffect(() => {
    if (view!=='week'||!weekBodyRef.current) return;
    setTimeout(() => {
      const body=weekBodyRef.current!;
      const start=new Date(cursor); start.setDate(cursor.getDate()-cursor.getDay());
      const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
      const now=Date.now();
      const upcoming=days.flatMap(d=>contestsOnDay(contests,activePlatforms,d.getFullYear(),d.getMonth(),d.getDate()).filter(c=>new Date(c.endsAt).getTime()>now)).sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime());
      if(upcoming.length){const f=new Date(upcoming[0].startsAt);body.scrollTop=Math.max(0,(f.getHours()*60+f.getMinutes())/60*60-120);}
      else body.scrollTop=Math.max(0,(new Date().getHours()*60+new Date().getMinutes())/60*60-120);
    },50);
  },[view,cursor,contests,activePlatforms]);

  function goToday() {
    const now=new Date(); setSelectedDate(new Date(now));
    if(view==='month') setCursor(new Date(now.getFullYear(),now.getMonth(),1));
    else if(view==='week'){const d=new Date(now);d.setDate(now.getDate()-now.getDay());setCursor(d);}
    else setCursor(new Date(now));
    setMiniCursor(new Date(now.getFullYear(),now.getMonth(),1));
  }
  function goPrev() {
    setCursor(c=>{const n=new Date(c);if(view==='month')return new Date(c.getFullYear(),c.getMonth()-1,1);if(view==='week'){n.setDate(n.getDate()-7);return n;}n.setDate(n.getDate()-1);setSelectedDate(new Date(n));return n;});
    setMiniCursor(c=>new Date(c.getFullYear(),c.getMonth()-1,1));
  }
  function goNext() {
    setCursor(c=>{const n=new Date(c);if(view==='month')return new Date(c.getFullYear(),c.getMonth()+1,1);if(view==='week'){n.setDate(n.getDate()+7);return n;}n.setDate(n.getDate()+1);setSelectedDate(new Date(n));return n;});
    setMiniCursor(c=>new Date(c.getFullYear(),c.getMonth()+1,1));
  }
  function switchToDay(y:number,m:number,d:number) { const date=new Date(y,m,d);setSelectedDate(date);setCursor(date);setMiniCursor(new Date(y,m,1));setView('day'); }
  function switchView(v:View) { setView(v);setCursor(c=>{if(v==='month')return new Date(c.getFullYear(),c.getMonth(),1);if(v==='week'){const n=new Date(c);n.setDate(n.getDate()-n.getDay());return n;}return selectedDate?new Date(selectedDate):new Date();}); }
  function togglePlatform(p:Platform) { setActivePlatforms(prev=>{if(prev.has(p)&&prev.size===1)return prev;const n=new Set(prev);n.has(p)?n.delete(p):n.add(p);return n;}); }

  function calTitle() {
    if(view==='month')return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if(view==='day')return cursor.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    const start=new Date(cursor);start.setDate(cursor.getDate()-cursor.getDay());const end=new Date(start);end.setDate(start.getDate()+6);
    return start.getMonth()===end.getMonth()?`${MONTHS[start.getMonth()]} ${start.getFullYear()}`:`${MONTHS[start.getMonth()].slice(0,3)} – ${MONTHS[end.getMonth()].slice(0,3)} ${end.getFullYear()}`;
  }

  // ── Mini calendar ─────────────────────────────────────────────────────────
  function renderMiniCal() {
    const y=miniCursor.getFullYear(),mo=miniCursor.getMonth();
    const firstDay=new Date(y,mo,1).getDay(),daysInMonth=new Date(y,mo+1,0).getDate(),prevDays=new Date(y,mo,0).getDate();
    const cells:JSX.Element[]=[];
    for(let i=firstDay-1;i>=0;i--)
      cells.push(<span key={`p${i}`} className="mini-cell other-month">{prevDays-i}</span>);
    for(let d=1;d<=daysInMonth;d++){
      const hasCon=contestsOnDay(contests,activePlatforms,y,mo,d).length>0;
      const tod=isToday(y,mo,d), sel=selectedDate?.getFullYear()===y&&selectedDate?.getMonth()===mo&&selectedDate?.getDate()===d;
      const cls=['mini-cell', tod?'today':'', sel?'selected':'', hasCon&&!tod?'has-event':''].filter(Boolean).join(' ');
      cells.push(<span key={d} className={cls} onClick={()=>switchToDay(y,mo,d)}>{d}</span>);
    }
    const tail=(firstDay+daysInMonth)%7===0?0:7-(firstDay+daysInMonth)%7;
    for(let d=1;d<=tail;d++)
      cells.push(<span key={`n${d}`} className="mini-cell other-month">{d}</span>);
    return cells;
  }

  // ── Month view ────────────────────────────────────────────────────────────
  function renderMonthView() {
    const y=cursor.getFullYear(),mo=cursor.getMonth();
    const firstDay=new Date(y,mo,1).getDay(),daysInMonth=new Date(y,mo+1,0).getDate(),prevDays=new Date(y,mo,0).getDate();
    const cells:JSX.Element[]=[];
    for(let i=firstDay-1;i>=0;i--)
      cells.push(<div key={`p${i}`} className="month-cell other-month"><span className="month-day-num">{prevDays-i}</span></div>);
    for(let d=1;d<=daysInMonth;d++){
      const dc=contestsOnDay(contests,activePlatforms,y,mo,d);
      const vis=dc.slice(0,3),ov=dc.length-3;
      const tod=isToday(y,mo,d), sel=selectedDate?.getFullYear()===y&&selectedDate?.getMonth()===mo&&selectedDate?.getDate()===d;
      const cls=['month-cell', tod?'today':'', sel&&!tod?'selected':''].filter(Boolean).join(' ');
      cells.push(
        <div key={d} className={cls} onClick={e=>{if(!(e.target as HTMLElement).closest('[data-chip]'))switchToDay(y,mo,d);}}>
          <span className="month-day-num">{d}</span>
          {vis.map(c=>{
            const st=getStatus(c), pc=pCode(c.source);
            const chipCls=['event-chip', pc, st==='active'?'active':st==='ended'?'ended':''].filter(Boolean).join(' ');
            return (
              <div key={c.code} data-chip="1" className={chipCls} onClick={e=>{e.stopPropagation();setSelectedContest(c);}}>
                <span className="event-chip-dot" />
                <span className="event-chip-time">{fmtTime(c.startsAt)}</span>
                <span className="event-chip-label">{c.title}</span>
              </div>
            );
          })}
          {ov>0&&<div className="more-events" onClick={e=>{e.stopPropagation();switchToDay(y,mo,d);}}>+{ov} more</div>}
        </div>
      );
    }
    const tail=(firstDay+daysInMonth)%7===0?0:7-(firstDay+daysInMonth)%7;
    for(let d=1;d<=tail;d++)
      cells.push(<div key={`n${d}`} className="month-cell other-month"><span className="month-day-num">{d}</span></div>);
    return (
      <div className="cal-month-view">
        <div className="month-weekday-header">
          {DAYS.map(d=><span key={d}>{d}</span>)}
        </div>
        <div className="month-grid">{cells}</div>
      </div>
    );
  }

  // ── Week view ─────────────────────────────────────────────────────────────
  function renderWeekView() {
    const start=new Date(cursor);start.setDate(cursor.getDate()-cursor.getDay());
    const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
    const nowMins=new Date().getHours()*60+new Date().getMinutes();
    return (
      <div className="cal-week-view">
        <div className="week-header" style={{gridTemplateColumns:'repeat(7,1fr)'}}>
          {days.map(d=>{
            const tod=isToday(d.getFullYear(),d.getMonth(),d.getDate());
            return (
              <div key={d.toISOString()} className={`week-header-cell${tod?' today':''}`}
                onClick={()=>switchToDay(d.getFullYear(),d.getMonth(),d.getDate())}
                style={{cursor:'pointer'}}>
                <div className="week-header-dow">{DAYS[d.getDay()]}</div>
                <div className="week-header-date">{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="week-body" ref={weekBodyRef}>
          <TimeColumn />
          <div className="week-cols" style={{gridTemplateColumns:'repeat(7,1fr)'}}>
            {days.map(d=>{
              const tod=isToday(d.getFullYear(),d.getMonth(),d.getDate());
              const dc=contestsOnDay(contests,activePlatforms,d.getFullYear(),d.getMonth(),d.getDate());
              return (
                <div key={d.toISOString()} className={`week-col${tod?' today':''}`}>
                  {Array.from({length:24},(_,h)=><div key={h} className="week-hour-line" />)}
                  {dc.map(c=>{
                    const s=new Date(c.startsAt),e=new Date(c.endsAt);
                    const sm=s.getHours()*60+s.getMinutes(), dm=Math.max(30,(e.getTime()-s.getTime())/60000);
                    const st=getStatus(c), pc=pCode(c.source);
                    const evCls=['week-event', pc, st==='active'?'active':st==='ended'?'ended':''].filter(Boolean).join(' ');
                    return (
                      <div key={c.code} className={evCls}
                        style={{top:(sm/60)*60, height:Math.max(28,(dm/60)*60)}}
                        onClick={()=>setSelectedContest(c)}>
                        <div className="week-event-title">{c.title}</div>
                        <div className="week-event-time">{fmtTime(c.startsAt)}</div>
                      </div>
                    );
                  })}
                  {tod&&<div className="week-now-line" style={{top:(nowMins/60)*60}} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Day view ──────────────────────────────────────────────────────────────
  function renderDayView() {
    const y=cursor.getFullYear(),mo=cursor.getMonth(),d=cursor.getDate();
    const dc=contestsOnDay(contests,activePlatforms,y,mo,d);
    const laid=layoutDayEvents(dc);
    const nowMins=new Date().getHours()*60+new Date().getMinutes();
    const tod=isToday(y,mo,d);
    return (
      <div className="cal-day-view">
        <div className="day-body">
          <TimeColumn cls="day-time-col" />
          <div className={`day-col-wrap${tod?' today':''}`}>
            <div className="day-col">
              {Array.from({length:24},(_,h)=><div key={h} className="week-hour-line" />)}
              {laid.map(({contest:c,top,height,leftPct,widthPct})=>{
                const st=getStatus(c), pc=pCode(c.source);
                const evCls=['day-event', pc, st==='active'?'active':st==='ended'?'ended':''].filter(Boolean).join(' ');
                return (
                  <div key={c.code} className={evCls}
                    style={{top, height, left:`${leftPct}%`, width:`${widthPct}%`}}
                    onClick={()=>setSelectedContest(c)}>
                    <div className="day-event-header">
                      <PlatformLogo source={c.source} />
                      <div className="day-event-title">{c.title}</div>
                      <div className={`day-event-status-dot ${st}`} />
                    </div>
                    <div className="day-event-time">{fmtTime(c.startsAt)} – {fmtTime(c.endsAt)}</div>
                    {c.description&&<div className="day-event-desc">{c.description}</div>}
                  </div>
                );
              })}
              {!dc.length&&<div className="day-empty">No contests scheduled.</div>}
              {tod&&<div className="week-now-line" style={{top:(nowMins/60)*60}} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const upcoming = contests
    .filter(c => activePlatforms.has(c.source) && new Date(c.endsAt).getTime()>Date.now())
    .sort((a,b) => new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime())
    .slice(0,12);

  return (
    <div className="cal-layout">
      {/* Sidebar */}
      <aside className="cal-sidebar">
        {/* Mini calendar */}
        <div className="mini-cal">
          <div className="mini-cal-header">
            <button className="mini-nav-btn" onClick={()=>setMiniCursor(c=>new Date(c.getFullYear(),c.getMonth()-1,1))}>‹</button>
            <span className="mini-month-label">{MONTHS[miniCursor.getMonth()].slice(0,3)} {miniCursor.getFullYear()}</span>
            <button className="mini-nav-btn" onClick={()=>setMiniCursor(c=>new Date(c.getFullYear(),c.getMonth()+1,1))}>›</button>
          </div>
          <div className="mini-weekdays">
            {DAYS.map(d=><span key={d}>{d[0]}</span>)}
          </div>
          <div className="mini-grid">{renderMiniCal()}</div>
        </div>

        {/* Platform filters */}
        <div>
          <div className="sidebar-section-title">Platforms</div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {PLATFORMS.map(p => {
              const pc=pCode(p);
              const cls=['pf-btn', pc, activePlatforms.has(p)?'active':''].filter(Boolean).join(' ');
              return (
                <button key={p} className={cls} onClick={()=>togglePlatform(p)} style={{justifyContent:'flex-start',borderRadius:8}}>
                  <PlatformLogo source={p} />
                  <span>{platformLabel(p)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming contests */}
        <div style={{flex:1,overflowY:'auto',minHeight:0}}>
          <div className="sidebar-section-title">Upcoming</div>
          {!upcoming.length
            ? <p className="sidebar-empty">No upcoming contests.</p>
            : upcoming.map(c => {
                const st=getStatus(c), pc=pCode(c.source);
                const barCls=['sui-bar', pc, st==='active'?'active':st==='ended'?'ended':''].filter(Boolean).join(' ');
                return (
                  <div key={c.code} className="sidebar-upcoming-item" onClick={()=>setSelectedContest(c)}>
                    <div className={barCls} />
                    <div style={{minWidth:0}}>
                      <div className="sui-title"><PlatformLogo source={c.source} /> {c.title}</div>
                      <div className="sui-meta">{new Date(c.startsAt).toLocaleDateString([],{month:'short',day:'numeric'})} · {fmtTime(c.startsAt)}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </aside>

      {/* Main */}
      <main className="cal-main">
        {/* Toolbar */}
        <div className="cal-toolbar">
          <div className="cal-toolbar-left">
            <button className="cal-today-btn" onClick={goToday}>Today</button>
            <button className="cal-nav-btn" onClick={goPrev}>‹</button>
            <button className="cal-nav-btn" onClick={goNext}>›</button>
            <span className="cal-title">{calTitle()}</span>
          </div>
          <div className="view-switcher">
            {(['month','week','day'] as View[]).map(v=>(
              <button key={v} className={`view-btn${view===v?' active':''}`} onClick={()=>switchView(v)}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Views */}
        {view==='month' && renderMonthView()}
        {view==='week' && renderWeekView()}
        {view==='day' && renderDayView()}
      </main>

      {/* Event detail panel */}
      <EventPanel contest={selectedContest} onClose={()=>setSelectedContest(null)} />
    </div>
  );
}
