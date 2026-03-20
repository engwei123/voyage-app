import { useState, useEffect, useCallback, useRef } from "react";

// ─── CREDIT CARD DATA ─────────────────────────────────────────────────────────
const CREDIT_CARDS = {
  uob_krisflyer: {
    id:"uob_krisflyer", name:"UOB KrisFlyer Visa", bank:"UOB", shortName:"KrisFlyer",
    color:"#1a3f7a", accent:"#4a90e2", emoji:"💎",
    mpd:{ sq:3.0, tr:3.0, default:1.2 },
    perks:["3 mpd on SIA & Scoot","10% off SIA base fares","Priority check-in vouchers","Complimentary travel insurance"],
    sqDiscount:0.10, trDiscount:0.05, applicableAirlines:["SQ","TR"],
    promoCode:"UOBKF10", promoDesc:"10% off SIA base fares",
  },
  dbs_womens: {
    id:"dbs_womens", name:"DBS Woman's World Card", bank:"DBS", shortName:"Women's World",
    color:"#8b1a5a", accent:"#e84393", emoji:"✦",
    mpd:{ online:4.0, default:1.5 },
    perks:["4 mpd online travel (cap SGD 2k/mo)","1.5 mpd all spend","Lounge access 2x/year","Travel insurance up to SGD 1M"],
    sqDiscount:0, trDiscount:0, applicableAirlines:["SQ","TR","EK","QR","CX","D7","JL","KE","LH","BA"],
    promoCode:"DBSWW4X", promoDesc:"4 mpd on online bookings", onlineMpdBonus:true, cashbackCap:2000,
  },
  uob_privimiles: {
    id:"uob_privimiles", name:"UOB PRVI Miles Card", bank:"UOB", shortName:"PRVI Miles",
    color:"#1a2a1a", accent:"#00b050", emoji:"◈",
    mpd:{ airtickets:2.4, overseas:2.4, default:1.4 },
    perks:["2.4 mpd on air tickets","15,000 bonus miles on first spend","2 airport transfers/year","SGD 100 off annual travel","Priority Pass unlimited"],
    sqDiscount:0, trDiscount:0, applicableAirlines:["SQ","TR","EK","QR","CX","D7","JL","KE","LH","BA","TG","MH"],
    promoCode:"PRVIM100", promoDesc:"SGD 100 off annual bookings", annualDiscount:100,
  },
};

// ─── SALE PERIODS ─────────────────────────────────────────────────────────────
const SALE_DATA = {
  SQ:[
    { name:"Great Singapore Sale", start:"2026-05-28", end:"2026-06-26", discount:"Up to 40% off", routes:["SIN→NRT","SIN→SYD","SIN→LHR","SIN→LAX"], status:"upcoming", code:"SQGSS40" },
    { name:"KrisFlyer Spontaneous Escapes", start:"2026-04-01", end:"2026-04-07", discount:"30% off selected dates", routes:["SIN→BKK","SIN→HKG","SIN→NRT"], status:"upcoming", code:"SQESC30" },
    { name:"SIA Cyber Monday", start:"2025-11-25", end:"2025-12-02", discount:"35% off Economy & Business", routes:["All routes"], status:"past", code:null },
  ],
  TR:[
    { name:"Scoot-ing Away Sale", start:"2026-04-10", end:"2026-04-17", discount:"Up to 50% off all fares", routes:["SIN→NRT","SIN→SYD","SIN→BER","SIN→ATH"], status:"upcoming", code:"SCOOTAWAY50" },
    { name:"Scoot Flash Sale", start:"2026-03-21", end:"2026-03-23", discount:"SGD 39 fares from SIN", routes:["SIN→BKK","SIN→KUL","SIN→HAN"], status:"active", code:"SCFLASH39" },
    { name:"Scoot Year-End Blowout", start:"2025-12-01", end:"2025-12-14", discount:"40% off all fares", routes:["All routes"], status:"past", code:null },
  ],
};

const PROMO_CODES = {
  SQ:[
    { code:"SQGSS40", discount:"40% off selected routes (GSS)", expires:"2026-06-26", verified:true, type:"Percentage", value:0.40 },
    { code:"SQESC30", discount:"30% off Economy Flex", expires:"2026-04-07", verified:true, type:"Percentage", value:0.30 },
    { code:"KRISFLY10", discount:"10% off Economy Flex", expires:"2026-05-31", verified:true, type:"Percentage", value:0.10 },
  ],
  TR:[
    { code:"SCOOTAWAY50", discount:"50% off all Scoot fares", expires:"2026-04-17", verified:true, type:"Percentage", value:0.50 },
    { code:"SCFLASH39", discount:"SGD 39 base fares", expires:"2026-03-23", verified:true, type:"Fixed", value:39 },
  ],
  EK:[{ code:"EKUAE15", discount:"15% off all fares", expires:"2026-04-15", verified:true, type:"Percentage", value:0.15 }],
  QR:[
    { code:"QRSAVE50", discount:"SGD 50 off booking", expires:"2026-05-01", verified:true, type:"Fixed", value:50 },
    { code:"QREARLY12", discount:"Early bird 12% off", expires:"2026-07-31", verified:true, type:"Percentage", value:0.12 },
  ],
  CX:[{ code:"CXASIA20", discount:"20% off Economy", expires:"2026-04-20", verified:true, type:"Percentage", value:0.20 }],
  D7:[{ code:"AASIA30", discount:"30% off all fares", expires:"2026-04-01", verified:true, type:"Percentage", value:0.30 }],
};

const AIRLINES = [
  {name:"Singapore Airlines",code:"SQ",emoji:"🦅"},
  {name:"Scoot",code:"TR",emoji:"🟡"},
  {name:"Emirates",code:"EK",emoji:"🌟"},
  {name:"Qatar Airways",code:"QR",emoji:"🇶🇦"},
  {name:"Cathay Pacific",code:"CX",emoji:"🟣"},
  {name:"AirAsia X",code:"D7",emoji:"🔴"},
  {name:"Thai Airways",code:"TG",emoji:"🪷"},
  {name:"Japan Airlines",code:"JL",emoji:"🇯🇵"},
  {name:"Korean Air",code:"KE",emoji:"🇰🇷"},
  {name:"Lufthansa",code:"LH",emoji:"🦅"},
  {name:"British Airways",code:"BA",emoji:"🇬🇧"},
  {name:"Malaysia Airlines",code:"MH",emoji:"🇲🇾"},
];

const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── BOOKING SITES CONFIG ─────────────────────────────────────────────────────
const BOOKING_SITES = [
  {
    id:"sia", name:"Singapore Airlines", shortName:"SIA", emoji:"🦅",
    color:"#00205b", accent:"#4a90e2",
    airlineCodes:["SQ"],
    note:"Official site — best for KrisFlyer miles accrual",
    promoField:"Promotional code field at payment step",
    buildUrl:(f, dest, pax, tripType, promos) => {
      const base = "https://www.singaporeair.com/en_UK/sg/book-a-flight/";
      const params = new URLSearchParams({
        tripType: tripType === "return" ? "R" : "O",
        adults: pax,
        origin: "SIN",
        destination: dest.code,
      });
      return { url: `${base}?${params}`, codes: promos };
    },
  },
  {
    id:"scoot", name:"Scoot", shortName:"Scoot", emoji:"🟡",
    color:"#2a2200", accent:"#ffcc00",
    airlineCodes:["TR"],
    note:"Official Scoot site — best flash sale fares",
    promoField:"Enter promo code in 'Promo code' box during booking",
    buildUrl:(f, dest, pax, tripType, promos) => {
      const base = "https://www.flyscoot.com/en/book/book-a-flight";
      const params = new URLSearchParams({
        departing: "SIN",
        arriving: dest.code,
        triptype: tripType === "return" ? "R" : "O",
        adults: pax,
      });
      return { url: `${base}?${params}`, codes: promos };
    },
  },
  {
    id:"expedia", name:"Expedia", shortName:"Expedia", emoji:"🟦",
    color:"#003580", accent:"#ffd700",
    airlineCodes:null, // all airlines
    note:"Compare multiple airlines — earn Expedia rewards",
    promoField:"Apply coupon code at checkout summary page",
    buildUrl:(f, dest, pax, tripType, promos) => {
      const today = new Date();
      const dep = new Date(today); dep.setDate(today.getDate() + 30);
      const ret = new Date(dep); ret.setDate(dep.getDate() + 7);
      const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const base = "https://www.expedia.com.sg/Flights-Search";
      const params = new URLSearchParams({
        trip: tripType === "return" ? "roundtrip" : "oneway",
        leg1: `from:SIN,to:${dest.code},departure:${fmt(dep)}TANYT`,
        ...(tripType === "return" ? { leg2: `from:${dest.code},to:SIN,departure:${fmt(ret)}TANYT` } : {}),
        passengers: `adults:${pax}`,
        options: "cabinclass:economy",
        mode: "search",
      });
      return { url: `${base}?${params}`, codes: promos };
    },
  },
  {
    id:"tripcom", name:"Trip.com", shortName:"Trip.com", emoji:"🔵",
    color:"#007aff", accent:"#34aadc",
    airlineCodes:null,
    note:"Often cheapest for Asia-Pacific routes",
    promoField:"Enter coupon code in order summary before payment",
    buildUrl:(f, dest, pax, tripType, promos) => {
      const base = "https://sg.trip.com/flights/";
      const seg = tripType === "return"
        ? `sin-to-${dest.code.toLowerCase()}/`
        : `sin-to-${dest.code.toLowerCase()}/`;
      const params = new URLSearchParams({ adult: pax, type: tripType === "return" ? "RT" : "OW" });
      return { url: `${base}${seg}?${params}`, codes: promos };
    },
  },
  {
    id:"kayak", name:"Kayak", shortName:"Kayak", emoji:"🛶",
    color:"#ff690f", accent:"#ff8c3a",
    airlineCodes:null,
    note:"Price comparison — tracks fares over time",
    promoField:"Codes applied on the airline's own checkout after redirect",
    buildUrl:(f, dest, pax, tripType, promos) => {
      const today = new Date();
      const dep = new Date(today); dep.setDate(today.getDate() + 30);
      const ret = new Date(dep); ret.setDate(dep.getDate() + 7);
      const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const base = "https://www.kayak.com.sg/flights";
      const route = tripType === "return"
        ? `SIN-${dest.code}/${fmt(dep)}/${dest.code}-SIN/${fmt(ret)}`
        : `SIN-${dest.code}/${fmt(dep)}`;
      return { url: `${base}/${route}/${pax}adults`, codes: promos };
    },
  },
  {
    id:"google", name:"Google Flights", shortName:"Google", emoji:"🔍",
    color:"#1a1a2e", accent:"#4285f4",
    airlineCodes:null,
    note:"Best for price calendar & fare alerts",
    promoField:"Redirects to airline site — apply codes there",
    buildUrl:(f, dest, pax, tripType, promos) => {
      const base = "https://www.google.com/travel/flights";
      const params = new URLSearchParams({
        q: `Flights from Singapore to ${dest.name}`,
        curr: "SGD",
      });
      return { url: `${base}?${params}`, codes: promos };
    },
  },
];

// Build booking options for a flight — returns sites with relevance ordering
function getBookingSites(alCode, dest, pax, tripType, appliedCodes) {
  const codes = appliedCodes.map(a => a.label).filter(l => /^[A-Z0-9]+$/.test(l));
  return BOOKING_SITES
    .filter(s => !s.airlineCodes || s.airlineCodes.includes(alCode))
    .concat(BOOKING_SITES.filter(s => s.airlineCodes && !s.airlineCodes.includes(alCode) && !BOOKING_SITES.filter(s2=>!s2.airlineCodes).find(s3=>s3.id===s.id)))
    .filter((s,i,arr)=>arr.findIndex(x=>x.id===s.id)===i) // dedupe
    .map(s => ({ ...s, ...s.buildUrl(null, dest, pax, tripType, codes) }))
    .sort((a,b)=> {
      if(a.airlineCodes?.includes(alCode)) return -1;
      if(b.airlineCodes?.includes(alCode)) return 1;
      return 0;
    });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const rnd = (a,b) => Math.round(a + Math.random()*(b-a));
const fmt2 = n => String(n).padStart(2,"0");
const fmtT = (h,m) => `${fmt2(h)}:${fmt2(m)}`;
const fmtDur = m => `${Math.floor(m/60)}h ${m%60}m`;
const addM = (h,m,a) => { const t=h*60+m+a; return {h:Math.floor(t/60)%24,m:t%60}; };
const isExp = d => new Date(d) < new Date();
const expSoon = d => { const df=(new Date(d)-new Date())/864e5; return df>=0&&df<14; };
const daysUntil = d => Math.ceil((new Date(d)-new Date())/864e5);
const pctChg = (cur,prev) => prev ? (((cur-prev)/prev)*100).toFixed(1) : "0.0";

function gen14Day(base) {
  const trend = (Math.random()-0.52)*0.003;
  return Array.from({length:14},(_,i) => Math.round(base*(1+trend*(i-7)+(Math.random()-0.5)*0.06)));
}

function getBestPromo(code, perPax) {
  const valid = (PROMO_CODES[code]||[]).filter(c=>!isExp(c.expires));
  if(!valid.length) return null;
  return valid.reduce((best,c) => {
    const s = c.type==="Percentage" ? perPax*c.value : c.value;
    const bs = best ? (best.type==="Percentage" ? perPax*best.value : best.value) : 0;
    return s>bs ? c : best;
  }, null);
}

function getBestCard(airlineCode, total) {
  return Object.values(CREDIT_CARDS).map(card => {
    let discount = 0, mpdRate = card.mpd.default;
    if(airlineCode==="SQ") { discount=total*(card.sqDiscount||0); mpdRate=card.mpd.sq||card.mpd.airtickets||card.mpd.online||card.mpd.default; }
    else if(airlineCode==="TR") { discount=total*(card.trDiscount||0); mpdRate=card.mpd.tr||card.mpd.airtickets||card.mpd.online||card.mpd.default; }
    else { mpdRate=card.mpd.airtickets||card.mpd.online||card.mpd.default; if(card.annualDiscount) discount=Math.min(card.annualDiscount,total*0.05); }
    const milesEarned = Math.round(total*mpdRate);
    return {...card, discount, milesEarned, mpdRate, effectivePrice:Math.max(0,total-discount)};
  }).sort((a,b)=>b.milesEarned-a.milesEarned);
}

function applyAll(basePrice, promo, ccCard, pax) {
  let price=basePrice, savings=0, applied=[];
  if(promo) { const s=promo.type==="Percentage"?price*promo.value:Math.min(promo.value*pax,price*0.5); price-=s; savings+=s; applied.push({label:promo.code,saving:s,type:"promo"}); }
  if(ccCard&&ccCard.discount>0) { price-=ccCard.discount; savings+=ccCard.discount; applied.push({label:ccCard.shortName,saving:ccCard.discount,type:"card"}); }
  return {finalPrice:Math.max(price,basePrice*0.4), savings, applied};
}

function genFlight(dest, pax, src="sim") {
  const al = AIRLINES[rnd(0,AIRLINES.length-1)];
  const dur=rnd(120,900), dh=rnd(8,20), dm=[0,10,15,20,30,45,55][rnd(0,6)];
  const arr=addM(dh,dm,dur), rdh=rnd(7,19), rdm=[0,10,15,20,30,45,55][rnd(0,6)], rarr=addM(rdh,rdm,dur+rnd(-20,50));
  const stops=dur>600?rnd(0,1):dur>300?rnd(0,2):0;
  const base=rnd(250,1200), price=Math.round(base*(1+(Math.random()-0.5)*0.25))*pax;
  return { id:`${al.code}${rnd(100,999)}`, al, price, perPax:Math.round(price/pax), pax,
    dep:fmtT(dh,dm), arr:fmtT(arr.h,arr.m), retDep:fmtT(rdh,rdm), retArr:fmtT(rarr.h,rarr.m),
    dur:fmtDur(dur), stops, src, dest:dest.code, destN:dest.name };
}

function genMonths(dest, pax) {
  const now=new Date(), base=rnd(300,1100)*pax;
  const ms = Array.from({length:12},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()+i,1); return {month:MON[d.getMonth()],year:d.getFullYear(),idx:i}; });
  const withP = ms.map(m=>{ const p=Math.round(base*(0.78+Math.random()*0.62)); return {...m,price:p,weeks:Array.from({length:4},(_,w)=>({week:w+1,price:Math.round(p*(0.88+Math.random()*0.26))}))}; });
  const minP = Math.min(...withP.map(x=>x.price));
  return withP.map(m=>({...m,isLowest:m.price===minP}));
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{height:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{height:100%;background:#07090f;color:#d8dff0;font-family:'IBM Plex Sans',sans-serif;-webkit-font-smoothing:antialiased;overscroll-behavior:none}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#1c2a42;border-radius:2px}
input,select,button{-webkit-appearance:none;appearance:none}
button{cursor:pointer;touch-action:manipulation}
:root{
  --n0:#07090f;--n1:#0b0f1c;--n2:#101828;--n3:#172038;
  --b1:#1c2a42;--b2:#243350;--b3:#2e4066;
  --am:#e8a000;--am2:#ffbe40;--amD:rgba(232,160,0,.13);--amB:rgba(232,160,0,.06);
  --te:#00c4ac;--teD:rgba(0,196,172,.11);--teB:rgba(0,196,172,.05);
  --re:#f04060;--reD:rgba(240,64,96,.11);
  --sk:#3db4ff;--skD:rgba(61,180,255,.1);
  --t1:#d8dff0;--t2:#7a8baa;--t3:#3d4f6a;--t4:#1e2d44;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bot: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --header-h: 56px;
  --bottom-nav-h: 60px;
  --radius: 12px;
}

/* ── APP SHELL ── */
.app{
  display:flex;flex-direction:column;
  height:100dvh; /* dynamic viewport height for mobile browsers */
  height:100vh;
  background:var(--n0);position:relative;overflow:hidden;
}
.grain{position:fixed;inset:0;opacity:.02;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");pointer-events:none;z-index:0}
.glow1{position:fixed;top:-20%;left:0;width:60%;height:50%;background:radial-gradient(ellipse,rgba(232,160,0,.04) 0%,transparent 65%);pointer-events:none;z-index:0}
.glow2{position:fixed;bottom:-15%;right:0;width:50%;height:45%;background:radial-gradient(ellipse,rgba(0,196,172,.03) 0%,transparent 70%);pointer-events:none;z-index:0}

/* ── HEADER ── */
.hdr{
  position:relative;z-index:30;flex-shrink:0;
  display:flex;align-items:center;padding:0 16px;gap:8px;
  height:calc(var(--header-h) + var(--safe-top));
  padding-top:var(--safe-top);
  border-bottom:1px solid var(--b1);
  background:rgba(7,9,15,.95);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
}
.logo{display:flex;align-items:center;gap:8px}
.lm{width:30px;height:30px;background:linear-gradient(140deg,var(--am),#b87000);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.ln{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--t1)}
.lt{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);letter-spacing:.15em;text-transform:uppercase}
.hdr-right{display:flex;align-items:center;gap:6px;margin-left:auto}
.op-pill{display:flex;align-items:center;gap:4px;padding:4px 10px;background:var(--amD);border:1px solid rgba(232,160,0,.2);border-radius:16px;font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--am);letter-spacing:.05em;white-space:nowrap}
.pctl{display:flex;align-items:center;gap:4px;padding:4px 9px;background:var(--n2);border:1px solid var(--b1);border-radius:16px}
.pb{background:none;border:none;color:var(--am);font-size:16px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:background .15s}
.pb:active{background:var(--amD)}
.pn{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--t1);min-width:14px;text-align:center}
.pct-label{font-size:10px;color:var(--t3)}
.hbtn{
  width:40px;height:40px;border:1px solid var(--b1);border-radius:8px;
  background:var(--n2);display:flex;align-items:center;justify-content:center;
  font-size:16px;transition:all .2s;position:relative;flex-shrink:0;
  -webkit-tap-highlight-color:transparent;
}
.hbtn:active{background:var(--amD);border-color:var(--am)}
.ndot{position:absolute;top:6px;right:6px;width:7px;height:7px;background:var(--am);border-radius:50%;border:2px solid var(--n0);animation:pulse 2s infinite}

/* ── BODY LAYOUT — DESKTOP ── */
.body{display:flex;flex:1;overflow:hidden;position:relative;z-index:10}

/* ── SIDEBAR — DESKTOP ── */
.sidebar{
  width:300px;flex-shrink:0;border-right:1px solid var(--b1);
  overflow-y:auto;display:flex;flex-direction:column;
  background:rgba(10,14,23,.7);
  transition:transform .3s cubic-bezier(.4,0,.2,1);
}

/* ── MAIN PANEL ── */
.panel{flex:1;display:flex;flex-direction:column;overflow:hidden}
.phdr{padding:14px 20px 0;flex-shrink:0}
.pht{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:10px}
.ptit{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;line-height:1.1}
.psub{font-size:10px;color:var(--t3);margin-top:3px;font-family:'IBM Plex Mono',monospace;letter-spacing:.03em;line-height:1.5}
.pacts{display:flex;gap:6px;align-items:center;flex-shrink:0}
.tabs{display:flex;gap:0;border-bottom:1px solid var(--b1);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-shrink:0}
.tabs::-webkit-scrollbar{display:none}
.tab{
  padding:10px 14px;background:none;border:none;font-family:'IBM Plex Sans',sans-serif;
  font-size:12px;border-bottom:2px solid transparent;margin-bottom:-1px;
  color:var(--t3);display:flex;align-items:center;gap:4px;white-space:nowrap;flex-shrink:0;
  min-height:44px;-webkit-tap-highlight-color:transparent;transition:color .2s;
}
.tab.on{color:var(--am);border-bottom-color:var(--am)}
.tab:active{color:var(--t1)}
.tbdg{background:var(--amD);color:var(--am);font-family:'IBM Plex Mono',monospace;font-size:8px;padding:1px 4px;border-radius:2px}
.tbdg.green{background:var(--teD);color:var(--te)}
.pc{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 16px;padding-bottom:calc(14px + var(--safe-bot))}
@media(min-width:768px){.pc{padding:16px 20px}}

/* ── BOTTOM NAV (mobile only) ── */
.bottom-nav{
  display:none;flex-shrink:0;
  background:rgba(7,9,15,.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-top:1px solid var(--b1);
  padding-bottom:var(--safe-bot);
  z-index:30;
}
.bn-items{display:flex;align-items:stretch}
.bn-item{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:3px;padding:8px 4px;min-height:var(--bottom-nav-h);
  background:none;border:none;color:var(--t3);font-family:'IBM Plex Sans',sans-serif;
  font-size:9px;transition:color .15s;-webkit-tap-highlight-color:transparent;
  position:relative;
}
.bn-item.on{color:var(--am)}
.bn-item:active{color:var(--t1)}
.bn-icon{font-size:20px;line-height:1}
.bn-badge{position:absolute;top:6px;right:calc(50% - 14px);background:var(--re);color:white;font-family:'IBM Plex Mono',monospace;font-size:8px;padding:1px 4px;border-radius:6px;min-width:14px;text-align:center}
.bn-badge.green{background:var(--te);color:var(--n0)}

/* ── SLIDE-OUT DRAWER (mobile sidebar) ── */
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40;opacity:0;pointer-events:none;transition:opacity .3s;-webkit-tap-highlight-color:transparent}
.drawer-overlay.open{opacity:1;pointer-events:all}
.drawer{
  position:fixed;left:0;top:0;bottom:0;width:min(320px,90vw);z-index:50;
  background:var(--n1);border-right:1px solid var(--b2);
  display:flex;flex-direction:column;
  transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);
  overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding-top:var(--safe-top);padding-left:var(--safe-left);
  padding-bottom:var(--safe-bot);
}
.drawer.open{transform:translateX(0)}
.drawer-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--b1)}
.drawer-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700}
.drawer-close{width:36px;height:36px;border:1px solid var(--b1);border-radius:8px;background:var(--n2);display:flex;align-items:center;justify-content:center;font-size:16px;-webkit-tap-highlight-color:transparent}
.drawer-close:active{background:var(--b2)}

/* ── COMMON SIDEBAR SECTION STYLES ── */
.ss{padding:13px 14px;border-bottom:1px solid var(--b1)}
.ssl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.ssa{font-size:9px;color:var(--t3);padding:4px 8px;border-radius:4px;min-height:32px;display:flex;align-items:center;-webkit-tap-highlight-color:transparent}
.ssa:active{color:var(--am)}
.addf{display:flex;flex-direction:column;gap:7px}
.ttog{display:flex;gap:4px}
.ttb{
  flex:1;padding:8px;border-radius:7px;font-size:11px;font-family:'IBM Plex Sans',sans-serif;
  border:1px solid var(--b1);background:transparent;color:var(--t3);
  min-height:40px;-webkit-tap-highlight-color:transparent;transition:all .15s;
}
.ttb.on{background:var(--amD);border-color:rgba(232,160,0,.32);color:var(--am)}
.ir{display:flex;gap:5px}
.fi{
  flex:1;background:var(--n1);border:1px solid var(--b1);border-radius:8px;
  color:var(--t1);font-family:'IBM Plex Sans',sans-serif;font-size:14px;
  padding:10px 12px;outline:none;transition:border-color .2s;
  min-height:44px;
}
.fi:focus{border-color:var(--am)}
.fi::placeholder{color:var(--t4)}
.fi.sm{padding:8px 10px;font-size:13px;min-height:40px}
.tc{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.fl{font-size:10px;color:var(--t3);margin-bottom:3px;font-family:'IBM Plex Mono',monospace;letter-spacing:.06em}
.addbtn{
  padding:10px 14px;background:linear-gradient(135deg,var(--am),#b87000);
  border:none;border-radius:8px;color:#07090f;font-weight:600;
  font-family:'IBM Plex Sans',sans-serif;font-size:13px;
  min-height:44px;display:flex;align-items:center;justify-content:center;gap:4px;
  white-space:nowrap;-webkit-tap-highlight-color:transparent;transition:all .15s;
}
.addbtn:active{opacity:.85}
.addbtn:disabled{opacity:.4;cursor:not-allowed}

/* Dest cards */
.dlist{display:flex;flex-direction:column;gap:7px;padding:10px 12px}
.dc{background:var(--n1);border:1px solid var(--b1);border-radius:10px;padding:12px 13px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent}
.dc::before{content:'';position:absolute;left:0;top:0;width:2px;height:100%;background:linear-gradient(180deg,var(--am),transparent);opacity:0;transition:opacity .2s}
.dc.act{border-color:rgba(232,160,0,.3);background:rgba(232,160,0,.04)}
.dc.act::before{opacity:1}
.dc:active{transform:scale(.99)}
.dct{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.dcn{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;line-height:1}
.dcm{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3);margin-top:2px}
.dcas{display:flex;gap:3px}
.dcb{width:36px;height:36px;border-radius:7px;border:none;background:transparent;font-size:14px;color:var(--t3);display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}
.dcb:active{background:var(--reD);color:var(--re)}
.dcb.ref:active{background:var(--teD) !important;color:var(--te) !important}
.dcpr{display:flex;align-items:flex-end;gap:5px;margin-bottom:5px}
.dcpv{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--am)}
.dcpc{font-size:9px;color:var(--t3);margin-bottom:2px}
.pchg{display:flex;align-items:center;gap:2px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;padding:2px 6px;border-radius:3px;margin-bottom:2px}
.pdn{background:var(--teD);color:var(--te)}
.pup{background:var(--reD);color:var(--re)}
.pfl{background:rgba(61,78,106,.2);color:var(--t2)}
.spark14{display:flex;align-items:flex-end;gap:1.5px;height:20px;margin-bottom:4px}
.sb{flex:1;border-radius:1px 1px 0 0;min-width:2px}
.trend14{font-family:'IBM Plex Mono',monospace;font-size:8px;margin-bottom:5px}
.dcfoot{display:flex;align-items:center;justify-content:space-between}
.dcts{display:flex;gap:3px}
.dct2{font-family:'IBM Plex Mono',monospace;font-size:8px;padding:2px 6px;border-radius:3px;border:1px solid var(--b1);color:var(--t3)}
.trow{display:flex;align-items:center;gap:5px}
.tog{position:relative;width:36px;height:20px;border-radius:10px;background:var(--n3);border:none;flex-shrink:0;-webkit-tap-highlight-color:transparent}
.tog.on{background:var(--te)}
.togk{position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:white;transition:left .2s;pointer-events:none}
.tog .togk{left:3px}
.tog.on .togk{left:19px}
.togl{font-size:9px;color:var(--t3)}
.scanbar{padding:8px 14px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:8px}
.pw{flex:1;height:3px;background:var(--b1);border-radius:2px;overflow:hidden}
.pf{height:100%;background:linear-gradient(90deg,var(--am),var(--am2));transition:width .5s ease}
.liveind{display:flex;align-items:center;gap:5px;font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);padding:8px 13px;border-top:1px solid var(--b1);margin-top:auto}
.ldot{width:5px;height:5px;border-radius:50%;background:var(--te);animation:pulse 2s infinite}

/* ── BUTTONS ── */
.pbtn{
  padding:10px 16px;background:linear-gradient(135deg,var(--am),#b87000);border:none;
  border-radius:8px;color:#07090f;font-weight:600;font-family:'IBM Plex Sans',sans-serif;
  font-size:12px;min-height:44px;display:flex;align-items:center;gap:6px;
  -webkit-tap-highlight-color:transparent;transition:opacity .15s;
}
.pbtn:active{opacity:.85}
.pbtn:disabled{opacity:.4}
.gbtn{
  padding:10px 14px;background:transparent;border:1px solid var(--b1);border-radius:8px;
  color:var(--t2);font-family:'IBM Plex Sans',sans-serif;font-size:12px;
  min-height:44px;display:flex;align-items:center;gap:5px;
  -webkit-tap-highlight-color:transparent;transition:all .15s;
}
.gbtn:active{border-color:var(--b2);color:var(--t1)}

/* ── FLIGHT CARDS ── */
.srcbar{display:flex;gap:5px;margin-bottom:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;flex-wrap:nowrap}
.srcbar::-webkit-scrollbar{display:none}
.schip{display:flex;align-items:center;gap:3px;padding:7px 10px;border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;border:1px solid var(--b1);color:var(--t3);white-space:nowrap;flex-shrink:0;min-height:36px;-webkit-tap-highlight-color:transparent}
.schip.on{border-color:rgba(61,180,255,.38);color:var(--sk);background:var(--skD)}
.schip:active{border-color:var(--b2)}
.fc{background:var(--n1);border:1px solid var(--b1);border-radius:12px;padding:14px 15px;margin-bottom:10px;position:relative;overflow:hidden;animation:fup .3s ease both}
@keyframes fup{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.fc:active{border-color:var(--b2)}
.fc.best{border-color:rgba(232,160,0,.3);background:rgba(232,160,0,.025)}
.bestb{position:absolute;top:0;right:14px;background:linear-gradient(135deg,var(--am),#b87000);color:#07090f;font-family:'IBM Plex Mono',monospace;font-size:8px;padding:2px 8px 3px;border-radius:0 0 6px 6px;letter-spacing:.07em}
.fct{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;gap:8px}
.alrow{display:flex;align-items:center;gap:9px}
.allo{width:32px;height:32px;border-radius:7px;background:var(--n2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.aln{font-size:13px;font-weight:500}
.alnum{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)}
.fcr{display:flex;flex-direction:column;align-items:flex-end;gap:1px}
.orig-price{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--t3);text-decoration:line-through}
.final-price{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--am);line-height:1}
.price-saved{font-size:9px;color:var(--te);font-family:'IBM Plex Mono',monospace;background:var(--teD);border:1px solid rgba(0,196,172,.22);padding:1px 5px;border-radius:3px;margin-top:1px}
.fcpax{font-size:9px;color:var(--t3);font-family:'IBM Plex Mono',monospace}
.fcsrc{font-family:'IBM Plex Mono',monospace;font-size:8px;padding:1px 5px;border-radius:3px;margin-top:1px}
.fcsrc.sky{background:var(--skD);color:var(--sk);border:1px solid rgba(61,180,255,.18)}
.fcsrc.google{background:var(--reD);color:#f06040;border:1px solid rgba(240,96,64,.18)}
.fcsrc.sim{background:rgba(100,120,160,.07);color:var(--t3);border:1px solid var(--b1)}
.rblk{display:grid;grid-template-columns:1fr 64px 1fr;align-items:center;gap:6px;background:rgba(7,9,15,.5);border-radius:8px;padding:10px 12px;margin-bottom:9px}
.rbt{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:500}
.rbi{font-size:9px;color:var(--t3);margin-top:1px}
.rbm{display:flex;flex-direction:column;align-items:center;gap:2px}
.rbl{width:100%;height:1px;background:linear-gradient(90deg,var(--b1),var(--am),var(--b1));position:relative}
.rbpl{position:absolute;top:-6px;left:50%;transform:translateX(-50%);font-size:10px;background:var(--n1);padding:0 2px}
.rbd{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)}
.rbst{font-size:8px;color:var(--t4)}
.rbr{text-align:right}
.retblk{opacity:.6;margin-top:-5px}
.auto-applied{display:flex;align-items:flex-start;gap:7px;padding:9px 11px;background:rgba(0,196,172,.07);border:1px solid rgba(0,196,172,.2);border-radius:8px;margin-bottom:9px}
.aa-icon{font-size:13px;flex-shrink:0;margin-top:1px}
.aa-content{flex:1}
.aa-title{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--te);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.aa-codes{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:3px}
.aa-code{font-family:'IBM Plex Mono',monospace;font-size:11px;padding:4px 9px;background:var(--amD);border:1px solid rgba(232,160,0,.3);border-radius:5px;color:var(--am);min-height:32px;display:flex;align-items:center;gap:3px;-webkit-tap-highlight-color:transparent}
.aa-code:active{background:rgba(232,160,0,.22)}
.aa-saving{font-size:10px;color:var(--te);font-weight:500}
.cc-strip{display:flex;gap:5px;margin-bottom:9px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
.cc-strip::-webkit-scrollbar{display:none}
.cc-mini{min-width:100px;padding:8px 10px;border-radius:8px;border:1px solid;flex-shrink:0;position:relative;-webkit-tap-highlight-color:transparent}
.cc-mini:active{transform:scale(.98)}
.cc-mini.best-cc{box-shadow:0 0 0 1px var(--am)}
.cc-mini-name{font-size:9px;font-weight:600;margin-bottom:1px}
.cc-mini-miles{font-family:'IBM Plex Mono',monospace;font-size:9px}
.cc-mini-disc{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--te)}
.cc-best-badge{position:absolute;top:-5px;right:6px;background:var(--am);color:#07090f;font-family:'IBM Plex Mono',monospace;font-size:7px;padding:1px 4px;border-radius:2px}
.fcbot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px}
.ftags{display:flex;gap:3px;flex-wrap:wrap}
.ftag{font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 7px;border-radius:3px;border:1px solid var(--b1);color:var(--t3)}
.ftag.g{border-color:rgba(0,196,172,.28);color:var(--te);background:var(--teD)}
.ftag.a{border-color:rgba(232,160,0,.28);color:var(--am);background:var(--amD)}
.ftag.r{border-color:rgba(240,64,96,.25);color:var(--re);background:var(--reD)}
.trkbtn{
  padding:8px 14px;border:1px solid var(--b1);border-radius:7px;background:transparent;
  color:var(--t3);font-family:'IBM Plex Sans',sans-serif;font-size:12px;
  min-height:40px;-webkit-tap-highlight-color:transparent;transition:all .15s;
}
.trkbtn:active{border-color:var(--am);color:var(--am)}
.trkbtn.on{border-color:rgba(0,196,172,.35);color:var(--te);background:var(--teD)}

/* ── SALE ALERTS ── */
.sale-hero{display:flex;gap:10px;margin-bottom:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
.sale-hero::-webkit-scrollbar{display:none}
.asc{min-width:220px;flex:1;border-radius:12px;padding:14px;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent}
.asc:active{transform:scale(.99)}
.asc.sq{background:linear-gradient(135deg,rgba(0,48,135,.4),rgba(0,48,135,.2));border:1px solid rgba(74,144,226,.3)}
.asc.tr{background:linear-gradient(135deg,rgba(40,35,0,.5),rgba(80,70,0,.2));border:1px solid rgba(255,204,0,.25)}
.asc-bg{position:absolute;right:-8px;top:-8px;font-size:52px;opacity:.08;pointer-events:none}
.asc-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;font-family:'IBM Plex Mono',monospace;font-size:9px;margin-bottom:8px}
.asc-badge.active{background:rgba(0,196,172,.15);border:1px solid rgba(0,196,172,.3);color:var(--te)}
.asc-badge.upcoming{background:var(--amD);border:1px solid rgba(232,160,0,.25);color:var(--am)}
.asc-badge.none{background:rgba(61,78,106,.15);border:1px solid var(--b1);color:var(--t3)}
.asc-name{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin-bottom:2px}
.asc-status{font-size:11px;color:var(--t2);margin-bottom:8px;line-height:1.4}
.asc-disc{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--am)}
.asc-next{font-size:10px;color:var(--t3);margin-top:3px;font-family:'IBM Plex Mono',monospace}
.sale-list{display:flex;flex-direction:column;gap:8px}
.si{background:var(--n1);border:1px solid var(--b1);border-radius:11px;padding:13px}
.si.active-s{border-color:rgba(0,196,172,.35);background:var(--teB)}
.si.upcoming-s{border-color:rgba(232,160,0,.28)}
.si.past-s{opacity:.5}
.si-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;gap:8px}
.si-al{display:flex;align-items:center;gap:7px}
.si-aln{font-size:12px;font-weight:600}
.si-name{font-family:'Playfair Display',serif;font-size:15px;color:var(--t1);margin-bottom:2px}
.si-right{text-align:right;flex-shrink:0}
.si-disc{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--am);font-weight:500}
.si-dates{font-size:9px;color:var(--t3);margin-top:2px;font-family:'IBM Plex Mono',monospace}
.si-meta{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}
.si-chip{font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 8px;border-radius:3px;border:1px solid var(--b1);color:var(--t3);min-height:28px;display:flex;align-items:center}
.si-chip.act{border-color:rgba(0,196,172,.3);color:var(--te);background:var(--teD)}
.si-chip.com{border-color:rgba(232,160,0,.28);color:var(--am);background:var(--amD)}
.si-chip.cod{border-color:rgba(232,160,0,.28);color:var(--am);background:var(--amB);-webkit-tap-highlight-color:transparent}
.si-chip.cod:active{background:var(--amD)}
.si-routes{font-size:11px;color:var(--t2);line-height:1.5}
.si-foot{display:flex;align-items:center;justify-content:space-between;margin-top:9px;flex-wrap:wrap;gap:6px}
.si-alert-row{display:flex;align-items:center;gap:7px;font-size:10px;color:var(--t3)}
.countdown{font-family:'IBM Plex Mono',monospace;font-size:10px}
.cd-a{color:var(--te)}
.cd-s{color:var(--am)}

/* ── CC CARDS ── */
.cc-cards-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:16px}
@media(min-width:480px){.cc-cards-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.cc-cards-grid{grid-template-columns:repeat(3,1fr)}}
.cc-card{border-radius:13px;padding:15px;position:relative;overflow:hidden;border:1px solid;transition:all .2s;-webkit-tap-highlight-color:transparent}
.cc-card:active{transform:scale(.98)}
.cc-card-bg{position:absolute;right:-8px;bottom:-8px;font-size:50px;opacity:.07;pointer-events:none}
.cc-bank{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.15em;margin-bottom:4px;opacity:.7}
.cc-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;margin-bottom:8px;line-height:1.2}
.cc-mpd-row{display:flex;align-items:flex-end;gap:2px;margin-bottom:3px}
.cc-mpd-val{font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:500}
.cc-mpd-lbl{font-size:9px;opacity:.7;margin-bottom:3px}
.cc-perks{display:flex;flex-direction:column;gap:3px;margin-top:7px}
.cc-perk{font-size:10px;opacity:.8;display:flex;align-items:flex-start;gap:3px;line-height:1.4}
.cc-perk::before{content:'·';opacity:.5;flex-shrink:0}
.cc-disc-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:3px;font-family:'IBM Plex Mono',monospace;font-size:9px;margin-top:6px}
.bcs-title{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3);letter-spacing:.15em;margin-bottom:9px}
.card-comp{display:flex;flex-direction:column;gap:6px}
.ccr{display:flex;align-items:center;gap:9px;padding:11px 13px;background:var(--n1);border:1px solid var(--b1);border-radius:9px;-webkit-tap-highlight-color:transparent}
.ccr:active{border-color:var(--b2)}
.ccr.win{border-color:rgba(232,160,0,.3);background:var(--amB)}
.ccr-rank{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--t3);width:18px;flex-shrink:0}
.ccr-info{flex:1;min-width:0}
.ccr-n{font-size:13px;font-weight:500}
.ccr-mpd{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)}
.ccr-miles{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--am);white-space:nowrap}
.ccr-disc{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--te);white-space:nowrap}
.cc-intro{font-size:11px;color:var(--t3);line-height:1.6;margin-bottom:14px;padding:10px 12px;background:var(--amD);border:1px solid rgba(232,160,0,.15);border-radius:8px}

/* ── MONTHS ── */
.mgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:14px}
@media(min-width:600px){.mgrid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:900px){.mgrid{grid-template-columns:repeat(4,1fr)}}
.mcard{background:var(--n1);border:1px solid var(--b1);border-radius:10px;padding:12px;-webkit-tap-highlight-color:transparent}
.mcard:active{border-color:var(--b2)}
.mcard.cheap{border-color:rgba(0,196,172,.35);background:var(--teB)}
.mcard.cur{border-color:rgba(232,160,0,.25)}
.mcmo{font-family:'Playfair Display',serif;font-size:14px;font-weight:600}
.mcyr{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3)}
.mcp{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;margin:6px 0 2px;color:var(--am)}
.mcard.cheap .mcp{color:var(--te)}
.mctag{font-family:'IBM Plex Mono',monospace;font-size:8px;padding:1px 6px;border-radius:3px;display:inline-block}
.mctag.best{background:var(--teD);color:var(--te);border:1px solid rgba(0,196,172,.25)}
.mctag.now{background:var(--amD);color:var(--am);border:1px solid rgba(232,160,0,.25)}
.mcbar{height:2px;border-radius:1px;margin-top:7px;background:var(--b1)}
.mcbf{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--am),var(--am2));transition:width .6s ease}
.mcard.cheap .mcbf{background:linear-gradient(90deg,var(--te),#00ffe9)}
.wkgrid{background:var(--n1);border:1px solid var(--b1);border-radius:10px;padding:13px}
.wgtit{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);letter-spacing:.15em;margin-bottom:9px}
.wrow{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}
@media(min-width:480px){.wrow{grid-template-columns:repeat(4,1fr)}}
.wcell{background:var(--n2);border:1px solid var(--b1);border-radius:7px;padding:9px;text-align:center;-webkit-tap-highlight-color:transparent}
.wcell:active{border-color:var(--b2)}
.wcell.wb{border-color:rgba(0,196,172,.3);background:var(--teD)}
.wcd{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);margin-bottom:3px}
.wcp{font-family:'Playfair Display',serif;font-size:16px;color:var(--am)}
.wcell.wb .wcp{color:var(--te)}
.wcs{font-size:8px;color:var(--t4);font-family:'IBM Plex Mono',monospace}

/* ── PROMOS ── */
.cgrid{display:flex;flex-direction:column;gap:8px}
.ccard{background:var(--n1);border:1px solid var(--b1);border-radius:10px;padding:13px}
.ccard:active{border-color:var(--b2)}
.cctop{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px}
.ccal{display:flex;align-items:center;gap:7px}
.ccan{font-size:13px;font-weight:500}
.ccar{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3);margin-top:1px}
.codeval{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:500;letter-spacing:.07em;padding:8px 12px;background:var(--amD);border:1px dashed rgba(232,160,0,.35);border-radius:7px;color:var(--am);min-height:44px;display:flex;align-items:center;position:relative;-webkit-tap-highlight-color:transparent}
.codeval:active{background:rgba(232,160,0,.2)}
.ccopied{position:absolute;top:-20px;left:50%;transform:translateX(-50%);background:var(--te);color:#07090f;font-size:9px;padding:2px 6px;border-radius:3px;white-space:nowrap;animation:fup .2s ease}
.cmeta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:5px}
.cchip{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3);display:flex;align-items:center;gap:2px}
.cchip.ok{color:var(--te)}
.cchip.warn{color:var(--am)}
.cchip.exp{color:var(--re)}
.cdesc{font-size:11px;color:var(--t2);line-height:1.4}

/* ── HISTORY ── */
.hchart{background:var(--n1);border:1px solid var(--b1);border-radius:11px;padding:13px;margin-bottom:12px}
.hctit{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);letter-spacing:.15em;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px}
.trend-stat{display:flex;align-items:center;gap:3px;font-family:'IBM Plex Mono',monospace;font-size:10px}
.bchart{display:flex;align-items:flex-end;gap:2px;height:56px}
.bcc{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px}
.bcp{font-family:'IBM Plex Mono',monospace;font-size:7px;color:var(--t3)}
.bcb{width:100%;border-radius:1px 1px 0 0;min-height:3px}
.bcd{font-family:'IBM Plex Mono',monospace;font-size:7px;color:var(--t4)}
.htable{background:var(--n1);border:1px solid var(--b1);border-radius:11px;overflow:hidden;overflow-x:auto;-webkit-overflow-scrolling:touch}
.htable-inner{min-width:460px}
.hthead{display:grid;grid-template-columns:64px 1fr 76px 80px 82px;gap:0;border-bottom:1px solid var(--b1);padding:8px 12px}
.htth{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t4);letter-spacing:.1em;text-transform:uppercase}
.htrow{display:grid;grid-template-columns:64px 1fr 76px 80px 82px;gap:0;padding:9px 12px;border-bottom:1px solid rgba(28,42,66,.35)}
.htrow:last-child{border-bottom:none}
.httd{font-size:11px;color:var(--t2);display:flex;align-items:center}
.httd.mo{font-family:'IBM Plex Mono',monospace;font-size:9px}
.httd.pr{font-family:'Playfair Display',serif;font-size:15px;color:var(--am)}

/* ── MODAL (bottom-sheet on mobile) ── */
.mover{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:100;display:flex;align-items:flex-end;-webkit-tap-highlight-color:transparent}
@media(min-width:600px){.mover{align-items:center;justify-content:center}}
.modal{
  background:var(--n1);border:1px solid var(--b2);
  width:100%;border-radius:16px 16px 0 0;
  padding:20px 18px calc(20px + var(--safe-bot));
  box-shadow:0 -12px 60px rgba(0,0,0,.7);
  max-height:90dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  animation:slideUp .3s ease;
}
@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
@media(min-width:600px){
  .modal{border-radius:14px;width:440px;max-width:93vw;max-height:90vh;animation:fup .25s ease;padding-bottom:20px}
}
.modal-handle{width:36px;height:4px;background:var(--b2);border-radius:2px;margin:0 auto 16px;display:block}
@media(min-width:600px){.modal-handle{display:none}}
.mtit{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;margin-bottom:3px}
.msub{font-size:11px;color:var(--t3);margin-bottom:16px;line-height:1.5}
.mst{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3);letter-spacing:.15em;margin-bottom:6px}
.msec{margin-bottom:14px}
.akrow{display:flex;gap:5px;margin-bottom:5px}
.akfi{flex:1;background:var(--n2);border:1px solid var(--b1);border-radius:8px;color:var(--t1);font-family:'IBM Plex Mono',monospace;font-size:13px;padding:10px 11px;outline:none;transition:border-color .2s;min-height:44px}
.akfi:focus{border-color:var(--am)}
.savebtn{padding:10px 14px;background:var(--am);border:none;border-radius:8px;color:#07090f;font-weight:600;font-size:12px;min-height:44px}
.savebtn:active{opacity:.85}
.mcbtn{width:100%;padding:10px;background:var(--n2);border:1px solid var(--b1);border-radius:8px;color:var(--t2);font-family:'IBM Plex Sans',sans-serif;font-size:13px;margin-top:6px;min-height:44px}
.mcbtn:active{border-color:var(--b2);color:var(--t1)}
.astr{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t3);margin-top:5px}
.astd{width:6px;height:6px;border-radius:50%}
.astd.ok{background:var(--te)}
.astd.no{background:var(--t4)}
.khint{font-size:10px;color:var(--t4);margin-top:2px;line-height:1.5}

/* ── CC QUICK SELECTOR (below header on mobile) ── */
.cc-selector{display:flex;gap:5px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:8px 16px;border-bottom:1px solid var(--b1);background:rgba(7,9,15,.9);flex-shrink:0}
.cc-selector::-webkit-scrollbar{display:none}
.ccs-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;border:1px solid;font-family:'IBM Plex Mono',monospace;font-size:10px;white-space:nowrap;flex-shrink:0;min-height:36px;-webkit-tap-highlight-color:transparent;transition:all .15s}
.ccs-btn:active{transform:scale(.97)}

/* ── BOOKING MODAL ── */
.bk-over{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:110;display:flex;align-items:flex-end;-webkit-tap-highlight-color:transparent}
@media(min-width:600px){.bk-over{align-items:center;justify-content:center}}
.bk-sheet{
  background:var(--n1);border:1px solid var(--b2);
  width:100%;border-radius:18px 18px 0 0;
  max-height:92dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding:0 0 calc(16px + var(--safe-bot));
  box-shadow:0 -16px 60px rgba(0,0,0,.7);
  animation:slideUp .3s cubic-bezier(.4,0,.2,1);
}
@media(min-width:600px){
  .bk-sheet{border-radius:16px;width:520px;max-width:95vw;max-height:88vh;padding-bottom:0;animation:fup .25s ease}
}
.bk-handle{width:36px;height:4px;background:var(--b2);border-radius:2px;margin:12px auto 0;display:block}
@media(min-width:600px){.bk-handle{display:none}}
.bk-hdr{padding:14px 18px 12px;border-bottom:1px solid var(--b1);position:sticky;top:0;background:var(--n1);z-index:2}
.bk-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:2px}
.bk-sub{font-size:11px;color:var(--t3);font-family:'IBM Plex Mono',monospace;letter-spacing:.03em}
.bk-close{position:absolute;top:14px;right:16px;width:34px;height:34px;border:1px solid var(--b1);border-radius:8px;background:var(--n2);display:flex;align-items:center;justify-content:center;font-size:15px;-webkit-tap-highlight-color:transparent}
.bk-close:active{background:var(--b2)}
/* Flight summary bar */
.bk-flight-sum{display:flex;align-items:center;gap:10px;padding:12px 18px;background:var(--amB);border-bottom:1px solid rgba(232,160,0,.15)}
.bk-al-logo{width:32px;height:32px;border-radius:7px;background:var(--n2);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.bk-route{flex:1;min-width:0}
.bk-route-line{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--t2)}
.bk-price-sum{text-align:right;flex-shrink:0}
.bk-orig{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--t3);text-decoration:line-through}
.bk-final{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--am);line-height:1}
.bk-pax{font-size:9px;color:var(--t3);font-family:'IBM Plex Mono',monospace;margin-top:1px}
/* Applied codes section */
.bk-codes{padding:12px 18px;border-bottom:1px solid var(--b1)}
.bk-sec-lbl{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
.bk-code-pills{display:flex;gap:6px;flex-wrap:wrap}
.bk-pill{display:flex;align-items:center;gap:6px;padding:8px 12px;background:var(--amD);border:1px solid rgba(232,160,0,.3);border-radius:8px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--am);min-height:40px;-webkit-tap-highlight-color:transparent;position:relative;cursor:pointer}
.bk-pill:active{background:rgba(232,160,0,.22)}
.bk-pill-type{font-size:9px;color:var(--t3);background:var(--n2);padding:1px 5px;border-radius:3px}
.bk-pill-copied{position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:var(--te);color:var(--n0);font-size:8px;padding:2px 6px;border-radius:3px;white-space:nowrap;animation:fup .2s ease;pointer-events:none}
.bk-copy-hint{font-size:10px;color:var(--t3);margin-top:7px;display:flex;align-items:center;gap:4px}
/* Sites list */
.bk-sites{padding:12px 18px;display:flex;flex-direction:column;gap:8px}
.bk-site{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:11px;border:1px solid var(--b1);text-decoration:none;-webkit-tap-highlight-color:transparent;transition:all .2s;position:relative;overflow:hidden}
.bk-site:active{transform:scale(.99)}
.bk-site.primary{border-color:rgba(232,160,0,.3);background:rgba(232,160,0,.04)}
.bk-site-logo{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:1px solid rgba(255,255,255,.08)}
.bk-site-info{flex:1;min-width:0}
.bk-site-name{font-size:13px;font-weight:600;color:var(--t1);margin-bottom:1px}
.bk-site-note{font-size:10px;color:var(--t3);line-height:1.4}
.bk-site-code{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--am);margin-top:3px;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.bk-site-arrow{font-size:16px;color:var(--t3);flex-shrink:0}
.bk-site.primary .bk-site-arrow{color:var(--am)}
.bk-official-badge{position:absolute;top:0;right:10px;background:linear-gradient(135deg,var(--am),#b87000);color:var(--n0);font-family:'IBM Plex Mono',monospace;font-size:8px;padding:2px 7px 3px;border-radius:0 0 6px 6px;letter-spacing:.07em}
.bk-site-tip{padding:10px 18px 14px;font-size:10px;color:var(--t3);line-height:1.6;border-top:1px solid var(--b1);margin-top:4px}
/* Book now button on flight card */
.book-btn{
  padding:9px 16px;background:linear-gradient(135deg,var(--am),#b87000);
  border:none;border-radius:8px;color:var(--n0);font-weight:700;
  font-family:'IBM Plex Sans',sans-serif;font-size:12px;
  min-height:40px;display:flex;align-items:center;gap:5px;
  -webkit-tap-highlight-color:transparent;transition:opacity .15s;white-space:nowrap;
}
.book-btn:active{opacity:.85}

.spin{width:13px;height:13px;border:2px solid rgba(232,160,0,.2);border-top-color:var(--am);border-radius:50%;animation:spin .75s linear infinite;display:inline-block;vertical-align:middle;flex-shrink:0}
.spin.lg{width:36px;height:36px;border-width:3px}
.spin.dk{border-color:rgba(7,9,15,.25);border-top-color:#07090f}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.ldblk{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;gap:12px}
.ldt{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--t3);text-align:center}
.lds{font-size:11px;color:var(--t4);text-align:center}
.eblk{text-align:center;padding:48px 24px;color:var(--t4)}
.welc{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;opacity:.45;padding:24px}
.wi{font-size:48px}
.wt{font-family:'Playfair Display',serif;font-size:24px;text-align:center}
.ws{font-size:13px;color:var(--t3);text-align:center;max-width:280px;line-height:1.7}
.twrap{position:fixed;top:calc(var(--safe-top) + 14px);right:14px;z-index:200;display:flex;flex-direction:column;gap:6px;pointer-events:none;max-width:calc(100vw - 28px)}
.toast{background:var(--n2);border:1px solid var(--b2);border-radius:10px;padding:11px 14px;width:min(330px,calc(100vw - 28px));display:flex;gap:8px;animation:tin .26s ease;box-shadow:0 8px 40px rgba(0,0,0,.6);pointer-events:all}
@keyframes tin{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
.toast.ok{border-color:rgba(0,196,172,.3)}
.toast.al{border-color:rgba(232,160,0,.3)}
.toast.inf{border-color:rgba(61,180,255,.22)}
.toast.sale{border-color:rgba(232,160,0,.4);background:rgba(232,160,0,.05)}
.tic{font-size:15px;flex-shrink:0;margin-top:1px}
.ttt{font-size:12px;font-weight:600;margin-bottom:1px}
.tmg{font-size:11px;color:var(--t3);line-height:1.4}
.section-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:4px}
.section-sub{font-size:11px;color:var(--t3);margin-bottom:14px}
.empty-dest{display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;color:var(--t3);font-size:12px;text-align:center}
.ssel{background:var(--n2);border:1px solid var(--b1);border-radius:7px;color:var(--t2);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:6px 10px;outline:none;min-height:36px}

/* ── MOBILE OVERRIDES ── */
@media(max-width:767px){
  .sidebar{display:none}
  .bottom-nav{display:flex;flex-direction:column}
  .phdr{padding:12px 14px 0}
  .ptit{font-size:18px}
  .pacts .gbtn{display:none}
  .op-pill{display:none}
  .tabs{display:none} /* replaced by bottom nav on mobile */
  .hdr-cc-selector{display:none}
}
@media(min-width:768px){
  .sidebar{display:flex}
  .drawer,.drawer-overlay{display:none !important}
  .bottom-nav{display:none !important}
  .cc-selector-mobile{display:none}
  .tabs{display:flex}
}
/* Dest button in header (mobile only) */
.dest-hdr-btn{display:none}
@media(max-width:767px){.dest-hdr-btn{display:flex}}
@media(min-width:768px){.dest-hdr-btn{display:none}}
`;

// ─── useToasts ─────────────────────────────────────────────────────────────────
// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
function BookingModal({ flight, dest, pax, tripType, onClose }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const sites = getBookingSites(flight.alCode, dest, pax, tripType, flight.applied || []);
  const allCodes = [
    ...(flight.applied || []).map(a => ({ code: a.label, desc: a.type === "promo" ? "Promo code" : "CC promo", saving: a.saving })),
  ].filter(c => /^[A-Z0-9]{4,}$/.test(c.code));

  function copy(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function openSite(url, codes) {
    // Copy best code to clipboard automatically before opening
    if (codes.length > 0) {
      navigator.clipboard?.writeText(codes[0]).catch(() => {});
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="bk-over" onClick={onClose}>
      <div className="bk-sheet" onClick={e => e.stopPropagation()}>
        <div className="bk-handle" />
        <div className="bk-hdr">
          <div className="bk-title">Book This Flight</div>
          <div className="bk-sub">SIN → {dest.name} · {pax} adult{pax > 1 ? "s" : ""} · {tripType}</div>
          <button className="bk-close" onClick={onClose}>✕</button>
        </div>

        {/* Flight summary */}
        <div className="bk-flight-sum">
          <div className="bk-al-logo">{flight.al.emoji}</div>
          <div className="bk-route">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{flight.al.name} · {flight.id}</div>
            <div className="bk-route-line">
              {flight.dep} SIN → {flight.arr} {flight.dest}
              {tripType === "return" ? ` · Return ${flight.retDep}–${flight.retArr}` : ""}
              &nbsp;·&nbsp;{flight.dur}
              {flight.stops === 0 ? " · Direct" : ` · ${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
            </div>
          </div>
          <div className="bk-price-sum">
            {flight.savings > 0 && <div className="bk-orig">SGD {flight.price.toLocaleString()}</div>}
            <div className="bk-final">SGD {flight.finalPrice.toLocaleString()}</div>
            <div className="bk-pax">{pax} adult{pax > 1 ? "s" : ""} · {Math.round(flight.finalPrice / pax).toLocaleString()}/pax</div>
          </div>
        </div>

        {/* Auto-applied codes */}
        {allCodes.length > 0 && (
          <div className="bk-codes">
            <div className="bk-sec-lbl">Codes auto-applied — tap to copy</div>
            <div className="bk-code-pills">
              {allCodes.map((c, i) => (
                <div key={i} className="bk-pill" onClick={() => copy(c.code)}>
                  {copiedCode === c.code && <div className="bk-pill-copied">Copied!</div>}
                  <span>🏷</span>
                  <span style={{ fontWeight: 600 }}>{c.code}</span>
                  <span className="bk-pill-type">{c.desc}</span>
                  <span style={{ fontSize: 10, color: "var(--te)", marginLeft: 2 }}>−SGD {Math.round(c.saving).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bk-copy-hint">
              <span>💡</span>
              Codes are copied automatically when you open a booking site below. Paste at checkout.
            </div>
          </div>
        )}

        {/* Booking sites */}
        <div className="bk-sites">
          <div className="bk-sec-lbl">Choose booking site</div>
          {sites.map((s, i) => {
            const isOfficial = s.airlineCodes?.includes(flight.alCode);
            return (
              <a key={s.id} className={`bk-site ${isOfficial ? "primary" : ""}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (allCodes.length > 0) navigator.clipboard?.writeText(allCodes[0].code).catch(() => {});
                }}>
                {isOfficial && <div className="bk-official-badge">★ Official</div>}
                <div className="bk-site-logo" style={{ background: s.color + "60", borderColor: s.accent + "40" }}>
                  {s.emoji}
                </div>
                <div className="bk-site-info">
                  <div className="bk-site-name" style={{ color: isOfficial ? "var(--am)" : "var(--t1)" }}>{s.name}</div>
                  <div className="bk-site-note">{s.note}</div>
                  {allCodes.length > 0 && (
                    <div className="bk-site-code">
                      <span>🏷 Apply:</span>
                      {allCodes.map(c => <span key={c.code} style={{ background: "var(--amD)", padding: "0 4px", borderRadius: 3 }}>{c.code}</span>)}
                    </div>
                  )}
                </div>
                <div className="bk-site-arrow">↗</div>
              </a>
            );
          })}
        </div>

        <div className="bk-site-tip">
          ℹ Prices shown are estimates. Final fare confirmed at checkout. Promo codes are copied to your clipboard automatically when you tap a booking site — paste them at the payment step.
          {allCodes.length === 0 && " No promo codes available for this flight, but credit card miles still apply."}
        </div>
      </div>
    </div>
  );
}


  const [ts, setTs] = useState([]);
  const add = useCallback(t => {
    const id = Date.now() + Math.random();
    setTs(p => [...p, { ...t, id }]);
    setTimeout(() => setTs(p => p.filter(x => x.id !== id)), 5000);
  }, []);
  return { ts, add };
}

// ─── SIDEBAR CONTENT (shared between desktop sidebar and mobile drawer) ───────
function SidebarContent({ dests, setDests, aid, setAid, pax, ndest, setNdest, nbudget, setNbudget, ntrip, setNtrip, adding, onAdd, onScanAll, scanPct, onClose }) {
  return (
    <>
      {onClose && (
        <div className="drawer-hdr">
          <div className="drawer-title">Destinations</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
      )}
      <div className="ss">
        <div className="ssl">Add Destination</div>
        <div className="addf">
          <div className="ttog">
            {["one-way", "return"].map(t => (
              <button key={t} className={`ttb ${ntrip === t ? "on" : ""}`} onClick={() => setNtrip(t)}>
                {t === "one-way" ? "One Way" : "↩ Return"}
              </button>
            ))}
          </div>
          <div className="ir">
            <input className="fi" placeholder="City or airport…" value={ndest}
              onChange={e => setNdest(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !adding && onAdd()} />
            <button className="addbtn" onClick={onAdd} disabled={adding || !ndest.trim()}>
              {adding ? <span className="spin dk" /> : "+ Add"}
            </button>
          </div>
          <div className="tc">
            <div><div className="fl">Budget / pax (SGD)</div><input className="fi sm" type="number" placeholder="e.g. 1200" value={nbudget} onChange={e => setNbudget(e.target.value)} /></div>
            <div><div className="fl">Earliest dep.</div><input className="fi sm" type="time" defaultValue="07:30" /></div>
          </div>
        </div>
      </div>
      {scanPct !== null && (
        <div className="scanbar"><div className="pw"><div className="pf" style={{ width: `${scanPct}%` }} /></div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: "var(--t3)" }}>Scanning {scanPct}%</div></div>
      )}
      <div className="ss" style={{ flex: 1, borderBottom: "none" }}>
        <div className="ssl">
          Watching ({dests.length})
          <span className="ssa" onClick={onScanAll}>⟳ Scan all</span>
        </div>
        {dests.length === 0 && (
          <div className="empty-dest"><span style={{ fontSize: 28 }}>✈</span>Add a destination above to start tracking</div>
        )}
        <div className="dlist">
          {dests.map(d => {
            const chg = d.price - d.prevPrice;
            const pct = pctChg(d.price, d.prevPrice);
            const maxP = Math.max(...d.priceHistory), minP = Math.min(...d.priceHistory);
            const trend14 = pctChg(d.priceHistory[d.priceHistory.length - 1], d.priceHistory[0]);
            return (
              <div key={d.id} className={`dc ${d.id === aid ? "act" : ""}`} onClick={() => { setAid(d.id); onClose?.(); }}>
                <div className="dct">
                  <div><div className="dcn">{d.name}</div><div className="dcm">{d.code} · {d.country}</div></div>
                  <div className="dcas">
                    <button className="dcb ref" onClick={e => { e.stopPropagation(); }}>⟳</button>
                    <button className="dcb" onClick={e => {
                      e.stopPropagation();
                      setDests(p => p.filter(x => x.id !== d.id));
                      if (aid === d.id) { const r = dests.filter(x => x.id !== d.id); setAid(r[0]?.id || null); }
                    }}>×</button>
                  </div>
                </div>
                <div className="dcpr">
                  <div className="dcpv">{d.price.toLocaleString()}</div>
                  <div className="dcpc">SGD</div>
                  <div className={`pchg ${chg < 0 ? "pdn" : chg > 0 ? "pup" : "pfl"}`}>
                    {chg < 0 ? "▼" : chg > 0 ? "▲" : "─"}{Math.abs(parseFloat(pct)).toFixed(1)}%
                  </div>
                </div>
                <div className="spark14">
                  {d.priceHistory.map((p, i) => {
                    const range = maxP - minP || 1;
                    const h = Math.max(2, Math.round(((p - minP) / range) * 14) + 3);
                    const isCur = i === d.priceHistory.length - 1, isMin = p === minP;
                    return <div key={i} className="sb" style={{ height: h, background: isCur ? "var(--am)" : isMin ? "var(--te)" : "var(--b2)" }} />;
                  })}
                </div>
                <div className="trend14" style={{ color: parseFloat(trend14) < 0 ? "var(--te)" : parseFloat(trend14) > 0 ? "var(--re)" : "var(--t3)" }}>
                  14d: {parseFloat(trend14) > 0 ? "▲" : parseFloat(trend14) < 0 ? "▼" : "─"}{Math.abs(parseFloat(trend14))}%
                </div>
                <div className="dcfoot">
                  <div className="dcts">
                    <span className="dct2">✦ {pax}p</span>
                    {d.budget && <span className="dct2">{Math.round(d.budget / pax).toLocaleString()}/p</span>}
                    <span className="dct2">{d.tripType === "return" ? "↩" : "→"}</span>
                  </div>
                  <div className="trow">
                    <button className={`tog ${d.alertOn ? "on" : ""}`}
                      onClick={e => { e.stopPropagation(); setDests(p => p.map(x => x.id === d.id ? { ...x, alertOn: !x.alertOn } : x)); }}>
                      <div className="togk" />
                    </button>
                    <span className="togl" style={{ color: d.alertOn ? "var(--te)" : "var(--t4)" }}>{d.alertOn ? "ALERT" : "OFF"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="liveind"><div className="ldot" />Auto-scan · {pax} pax · SIN→World</div>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function TravelAssistant() {
  const [dests, setDests] = useState([
    { id: 1, name: "Tokyo", code: "NRT", country: "Japan", alertOn: true, budget: 2400, tripType: "return", price: 2310, prevPrice: 2480, priceHistory: gen14Day(2400) },
    { id: 2, name: "London", code: "LHR", country: "UK", alertOn: true, budget: 4200, tripType: "return", price: 3980, prevPrice: 3980, priceHistory: gen14Day(3980) },
  ]);
  const [aid, setAid] = useState(1);
  const [pax, setPax] = useState(2);
  const [tab, setTab] = useState("flights");
  const [ndest, setNdest] = useState("");
  const [nbudget, setNbudget] = useState("");
  const [ntrip, setNtrip] = useState("return");
  const [adding, setAdding] = useState(false);
  const [flights, setFlights] = useState([]);
  const [fload, setFload] = useState(false);
  const [asrc, setAsrc] = useState("all");
  const [tracked, setTracked] = useState({});
  const [months, setMonths] = useState([]);
  const [mload, setMload] = useState(false);
  const [promos, setPromos] = useState([]);
  const [pload, setPload] = useState(false);
  const [copied, setCopied] = useState(null);
  const [scanPct, setScanPct] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState({ sky: "", serp: "" });
  const [keyInp, setKeyInp] = useState({ sky: "", serp: "" });
  const [saleAlerts, setSaleAlerts] = useState({ SQ: true, TR: true });
  const [activeCCId, setActiveCCId] = useState("uob_krisflyer");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const { ts, add: toast } = useToasts();
  const scanRef = useRef(null);

  const activeDest = dests.find(d => d.id === aid);
  const skyLive = apiKeys.sky.length > 8;
  const googleLive = apiKeys.serp.length > 8;
  const activeSales = [...SALE_DATA.SQ, ...SALE_DATA.TR].filter(s => s.status === "active");
  const upcomingSales = [...SALE_DATA.SQ, ...SALE_DATA.TR].filter(s => s.status === "upcoming" && daysUntil(s.start) <= 30);
  const totalSaleCount = activeSales.length + upcomingSales.length;

  useEffect(() => {
    if (activeDest) {
      if (tab === "flights") loadFlights(activeDest);
      if (tab === "months") loadMonths(activeDest);
      if (tab === "promos") loadPromos();
    }
  }, [aid, pax]);

  useEffect(() => {
    if (!activeDest) return;
    if (tab === "flights") loadFlights(activeDest);
    else if (tab === "months") loadMonths(activeDest);
    else if (tab === "promos") loadPromos();
  }, [tab]);

  useEffect(() => {
    scanRef.current = setInterval(() => runScan(), 300000);
    return () => clearInterval(scanRef.current);
  }, [dests]);

  useEffect(() => {
    activeSales.forEach(s => setTimeout(() => toast({ type: "sale", title: `🔥 SALE LIVE — ${s.name}`, msg: `${s.discount}${s.code ? " · Code: " + s.code : ""}` }), 1500));
    upcomingSales.slice(0, 1).forEach(s => setTimeout(() => toast({ type: "al", title: `📅 Upcoming — ${s.name}`, msg: `Starts ${s.start} · ${s.discount}` }), 2800));
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  async function loadFlights(dest) {
    setFload(true); setFlights([]);
    await new Promise(r => setTimeout(r, rnd(600, 1300)));
    const srcs = ["sim", "sim", "sim"];
    if (skyLive) srcs.push("skyscanner");
    if (googleLive) srcs.push("google");
    const res = srcs.flatMap(s => Array.from({ length: rnd(2, 4) }, () => genFlight(dest, pax, s)));
    res.push({ ...genFlight(dest, pax, "sim"), id: `SQ${rnd(100, 999)}`, al: AIRLINES.find(a => a.code === "SQ"), al_override: "SQ" });
    res.push({ ...genFlight(dest, pax, "sim"), id: `TR${rnd(100, 999)}`, al: AIRLINES.find(a => a.code === "TR"), al_override: "TR" });
    setFlights(res.sort((a, b) => a.price - b.price));
    setFload(false);
  }

  async function loadMonths(dest) {
    setMload(true); setMonths([]);
    await new Promise(r => setTimeout(r, rnd(500, 900)));
    setMonths(genMonths(dest, pax)); setMload(false);
  }

  async function loadPromos() {
    setPload(true); setPromos([]);
    await new Promise(r => setTimeout(r, rnd(400, 800)));
    const all = Object.entries(PROMO_CODES).flatMap(([code, list]) => {
      const al = AIRLINES.find(a => a.code === code);
      return list.map(p => ({ ...p, airlineCode: code, airlineName: al?.name || code, airlineEmoji: al?.emoji || "✈" }));
    });
    setPromos(all); setPload(false);
  }

  async function refreshPromosAI() {
    setPload(true); setPromos([]);
    toast({ type: "inf", title: "Scanning promo codes", msg: "Checking airlines via AI…" });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: "List current promo codes for SIA (SQ), Scoot (TR), Emirates (EK), Qatar (QR), Cathay (CX), AirAsia X (D7) departing Singapore 2026. Return ONLY JSON array. Each: airlineCode,airlineName,airlineEmoji,code,discount,routes,expires(YYYY-MM-DD),verified(bool),type(Percentage/Fixed),value(number). Max 10." }] })
      });
      const text = (await res.json()).content[0].text.replace(/```json|```/g, "").trim();
      setPromos(JSON.parse(text));
      toast({ type: "ok", title: "Promo codes refreshed", msg: "Latest codes loaded via AI" });
    } catch { await loadPromos(); }
    setPload(false);
  }

  async function addDest() {
    if (!ndest.trim()) return;
    setAdding(true);
    let info = { name: ndest, code: ndest.toUpperCase().slice(0, 3), country: "" };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 100, messages: [{ role: "user", content: `For "${ndest}" return ONLY JSON: {"name":"city","code":"IATA","country":"country"}` }] }) });
      info = JSON.parse((await res.json()).content[0].text.replace(/```json|```/g, "").trim());
    } catch {}
    const base = rnd(350, 1600) * pax;
    const nd = { id: Date.now(), name: info.name || ndest, code: info.code || ndest.toUpperCase().slice(0, 3), country: info.country || "", alertOn: true, budget: nbudget ? parseInt(nbudget) * pax : Math.round(base * 1.3), tripType: ntrip, price: base, prevPrice: base, priceHistory: gen14Day(base) };
    setDests(p => [...p, nd]); setAid(nd.id);
    setNdest(""); setNbudget(""); setAdding(false);
    toast({ type: "ok", title: "Destination added", msg: `Tracking ${nd.name} · ${pax} adults` });
  }

  async function runScan() {
    setScanPct(0);
    for (let i = 0; i < dests.length; i++) {
      const d = dests[i];
      setScanPct(Math.round(((i + 0.5) / dests.length) * 100));
      await new Promise(r => setTimeout(r, rnd(250, 550)));
      const np = Math.round(d.price * (1 + (Math.random() - 0.46) * 0.09));
      setDests(p => p.map(x => x.id === d.id ? { ...x, prevPrice: x.price, price: np, priceHistory: [...x.priceHistory.slice(-13), np] } : x));
      if (np < d.price && d.alertOn && np <= d.budget)
        toast({ type: "al", title: `🎯 Price drop — ${d.name}`, msg: `SGD ${np.toLocaleString()} · ${pax} adults · Within budget` });
    }
    setScanPct(null);
  }

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code); setTimeout(() => setCopied(null), 2000);
    toast({ type: "ok", title: "Code copied!", msg: `${code} — paste at checkout` });
  }

  function saveKeys() {
    setApiKeys({ sky: keyInp.sky, serp: keyInp.serp });
    setShowSettings(false);
    toast({ type: "ok", title: "API keys saved", msg: "Live data activated" });
  }

  const sortedFlights = [...flights]
    .filter(f => asrc === "all" || f.src === asrc)
    .map(f => {
      const code = f.al_override || f.al.code;
      const promo = getBestPromo(code, f.perPax);
      const ccRankings = getBestCard(code, f.price);
      const myCC = ccRankings.find(c => c.id === activeCCId);
      const { finalPrice, savings, applied } = applyAll(f.price, promo, myCC, pax);
      return { ...f, alCode: code, promo, ccRankings, finalPrice, savings, applied };
    })
    .sort((a, b) => a.finalPrice - b.finalPrice);

  const promoCount = promos.filter(p => !isExp(p.expires)).length;
  const activeCC = CREDIT_CARDS[activeCCId];

  // Bottom nav tabs definition
  const bottomTabs = [
    { id: "flights", icon: "✈️", label: "Flights" },
    { id: "sales", icon: "🔥", label: "Sales", badge: activeSales.length || null, badgeClass: "green" },
    { id: "cards", icon: "💳", label: "Cards" },
    { id: "months", icon: "📅", label: "Months" },
    { id: "promos", icon: "🏷", label: "Promos", badge: promoCount || null },
    { id: "history", icon: "📊", label: "History" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="grain" /><div className="glow1" /><div className="glow2" />

        {/* Toasts */}
        <div className="twrap">
          {ts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span className="tic">{t.type === "al" || t.type === "sale" ? "🔔" : t.type === "inf" ? "ℹ️" : "✅"}</span>
              <div><div className="ttt">{t.title}</div><div className="tmg">{t.msg}</div></div>
            </div>
          ))}
        </div>

        {/* Mobile drawer */}
        <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
        <div className={`drawer ${drawerOpen ? "open" : ""}`}>
          <SidebarContent {...{ dests, setDests, aid, setAid, pax, ndest, setNdest, nbudget, setNbudget, ntrip, setNtrip, adding, onAdd: addDest, onScanAll: runScan, scanPct, onClose: () => setDrawerOpen(false) }} />
        </div>

        {/* Booking Modal */}
        {selectedFlight && activeDest && (
          <BookingModal
            flight={selectedFlight}
            dest={activeDest}
            pax={pax}
            tripType={activeDest.tripType}
            onClose={() => setSelectedFlight(null)}
          />
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="mover" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="mtit">⚙ API Connections</div>
              <div className="msub">Connect live flight APIs. Without keys the app uses high-fidelity simulated data. Keys are stored in-session only.</div>
              <div className="msec">
                <div className="mst">Skyscanner — RapidAPI</div>
                <div className="akrow"><input className="akfi" placeholder="RapidAPI key for Skyscanner…" type="password" inputMode="text" value={keyInp.sky} onChange={e => setKeyInp(p => ({ ...p, sky: e.target.value }))} /></div>
                <div className="khint">→ rapidapi.com/skyscanner — requires backend proxy for CORS</div>
                <div className="astr"><div className={`astd ${skyLive ? "ok" : "no"}`} />{skyLive ? "Key saved — live data enabled" : "Not connected"}</div>
              </div>
              <div className="msec">
                <div className="mst">Google Flights — SerpAPI</div>
                <div className="akrow"><input className="akfi" placeholder="SerpAPI key…" type="password" inputMode="text" value={keyInp.serp} onChange={e => setKeyInp(p => ({ ...p, serp: e.target.value }))} /></div>
                <div className="khint">→ serpapi.com · Free tier: 100 searches/month</div>
                <div className="astr"><div className={`astd ${googleLive ? "ok" : "no"}`} />{googleLive ? "Key saved" : "Not connected"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="savebtn" style={{ flex: 1 }} onClick={saveKeys}>Save & Connect</button>
                <button className="mcbtn" style={{ flex: 1 }} onClick={() => setShowSettings(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="hdr">
          <div className="logo">
            <div className="lm">✈</div>
            <div><div className="ln">Voyage</div><div className="lt">Flight Intel</div></div>
          </div>
          <div className="hdr-right">
            {/* Desktop: origin pill */}
            <div className="op-pill">✦ SIN · Dep ≥ 07:30 · Ret ≤ 20:00</div>
            {/* Pax control */}
            <div className="pctl">
              <button className="pb" onClick={() => setPax(p => Math.max(1, p - 1))}>−</button>
              <span className="pn">{pax}</span>
              <button className="pb" onClick={() => setPax(p => Math.min(9, p + 1))}>+</button>
              <span className="pct-label" style={{ fontSize: 10, color: "var(--t3)" }}>👤</span>
            </div>
            {/* Mobile: destinations button */}
            <button className="hbtn dest-hdr-btn" onClick={() => setDrawerOpen(true)} style={{ position: "relative" }}>
              🗺
              {dests.length > 0 && <div style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, background: "var(--am)", borderRadius: "50%", border: "2px solid var(--n0)" }} />}
            </button>
            {/* API status */}
            <button className="hbtn" onClick={() => setShowSettings(true)} title="API Settings">⚙</button>
            <button className="hbtn" onClick={() => {
              "Notification" in window && Notification.requestPermission().then(p => p === "granted" && toast({ type: "ok", title: "Alerts enabled", msg: "Price drop & sale alerts active" }));
            }}><span>🔔</span><div className="ndot" /></button>
          </div>
        </header>

        {/* CC Selector bar (visible on both mobile + desktop, below header) */}
        <div className="cc-selector">
          {Object.values(CREDIT_CARDS).map(cc => (
            <button key={cc.id} className="ccs-btn"
              style={{ background: activeCCId === cc.id ? cc.color + "50" : "transparent", borderColor: activeCCId === cc.id ? cc.accent : "var(--b1)", color: activeCCId === cc.id ? "white" : "var(--t3)" }}
              onClick={() => setActiveCCId(cc.id)}>
              {cc.emoji} {cc.shortName}
            </button>
          ))}
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--t3)", padding: "6px 8px", whiteSpace: "nowrap", alignSelf: "center" }}>
            {skyLive ? "✓ Sky" : "○ Sky Demo"} · {googleLive ? "✓ GF" : "○ GF Demo"}
          </span>
        </div>

        {/* BODY */}
        <div className="body">
          {/* Desktop sidebar */}
          <aside className="sidebar">
            <SidebarContent {...{ dests, setDests, aid, setAid, pax, ndest, setNdest, nbudget, setNbudget, ntrip, setNtrip, adding, onAdd: addDest, onScanAll: runScan, scanPct }} />
          </aside>

          {/* Main panel */}
          <main className="panel">
            {!activeDest ? (
              <div className="welc">
                <div className="wi">🌏</div>
                <div className="wt">Where to next?</div>
                <div className="ws">Tap the 🗺 button above (mobile) or use the left panel to add a destination.</div>
              </div>
            ) : (
              <>
                <div className="phdr">
                  <div className="pht">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ptit">SIN → {activeDest.name}{activeDest.tripType === "return" ? " ↩" : ""}</div>
                      <div className="psub">{activeDest.code} · {pax} adult{pax > 1 ? "s" : ""} · {activeCC.shortName} · SGD {activeDest.budget ? Math.round(activeDest.budget / pax).toLocaleString() : "—"}/pax</div>
                    </div>
                    <div className="pacts">
                      <button className="gbtn" onClick={() => setShowSettings(true)}>⚙</button>
                      <button className="pbtn" disabled={fload || mload || pload}
                        onClick={() => { if (tab === "flights") loadFlights(activeDest); else if (tab === "months") loadMonths(activeDest); else if (tab === "promos") refreshPromosAI(); }}>
                        {(fload || mload || pload) ? <><span className="spin dk" />…</> : <>🔍</>}
                      </button>
                    </div>
                  </div>
                  {/* Desktop tabs (hidden on mobile, replaced by bottom nav) */}
                  <div className="tabs">
                    {[
                      { id: "flights", label: "✈ Flights" },
                      { id: "sales", label: "🔥 Sales", badge: totalSaleCount || null, badgeClass: activeSales.length ? "green" : "" },
                      { id: "cards", label: "💳 Cards" },
                      { id: "months", label: "📅 Months" },
                      { id: "promos", label: "🏷 Promos", badge: promoCount || null },
                      { id: "history", label: "📊 History (14d)" },
                    ].map(t => (
                      <button key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
                        {t.label}{t.badge && <span className={`tbdg ${t.badgeClass || ""}`}>{t.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="pc">

                  {/* ── FLIGHTS ── */}
                  {tab === "flights" && (
                    <>
                      <div className="srcbar">
                        {[{ id: "all", l: "All" }, { id: "sim", l: "Aggregated" }, { id: "skyscanner", l: "✈ Skyscanner" }, { id: "google", l: "🔍 Google" }].map(s => (
                          <div key={s.id} className={`schip ${asrc === s.id ? "on" : ""}`} onClick={() => setAsrc(s.id)}>{s.l}</div>
                        ))}
                        <select className="ssel" style={{ marginLeft: "auto", flexShrink: 0 }}>
                          <option>Cheapest first</option>
                        </select>
                      </div>
                      {fload ? (
                        <div className="ldblk"><div className="spin lg" /><div className="ldt">Scanning fares for {pax} adults…</div><div className="lds">Applying {activeCC.shortName} discounts</div></div>
                      ) : sortedFlights.length === 0 ? (
                        <div className="eblk"><div style={{ fontSize: 32, marginBottom: 8 }}>🔎</div>No flights found. Try "All".</div>
                      ) : (
                        sortedFlights.map((f, idx) => (
                          <div key={f.id + idx} className={`fc ${idx === 0 ? "best" : ""}`} style={{ animationDelay: `${idx * 40}ms` }}>
                            {idx === 0 && <div className="bestb">★ Best Deal</div>}
                            <div className="fct">
                              <div className="alrow">
                                <div className="allo">{f.al.emoji}</div>
                                <div><div className="aln">{f.al.name}</div><div className="alnum">{f.id}</div></div>
                              </div>
                              <div className="fcr">
                                <div>
                                  {f.savings > 0 && <div className="orig-price">SGD {f.price.toLocaleString()}</div>}
                                  <div className="final-price">SGD {f.finalPrice.toLocaleString()}</div>
                                  {f.savings > 0 && <div className="price-saved">Saved SGD {Math.round(f.savings).toLocaleString()}</div>}
                                </div>
                                <div className="fcpax">{pax} adult{pax > 1 ? "s" : ""} · {Math.round(f.finalPrice / pax).toLocaleString()}/pax</div>
                                <div className={`fcsrc ${f.src}`}>{f.src === "skyscanner" ? "✈ Sky" : f.src === "google" ? "🔍 Google" : "◈ Agg"}</div>
                              </div>
                            </div>
                            {f.applied.length > 0 && (
                              <div className="auto-applied">
                                <span className="aa-icon">✓</span>
                                <div className="aa-content">
                                  <div className="aa-title">Auto-applied discounts</div>
                                  <div className="aa-codes">
                                    {f.applied.map((a, i) => (
                                      <span key={i} className="aa-code" onClick={() => copyCode(a.label)}>
                                        {a.type === "promo" ? "🏷" : "💳"} {a.label} <span style={{ color: "var(--te)" }}>−{Math.round(a.saving).toLocaleString()}</span>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="aa-saving">Total saved: SGD {Math.round(f.savings).toLocaleString()}</div>
                                </div>
                              </div>
                            )}
                            <div className="cc-strip">
                              {f.ccRankings.map((cc, i) => (
                                <div key={cc.id} className={`cc-mini ${activeCCId === cc.id ? "best-cc" : ""}`}
                                  style={{ borderColor: activeCCId === cc.id ? cc.accent : "var(--b1)", background: activeCCId === cc.id ? cc.color + "30" : "var(--n2)" }}
                                  onClick={() => setActiveCCId(cc.id)}>
                                  {i === 0 && <div className="cc-best-badge">Best</div>}
                                  <div className="cc-mini-name" style={{ color: activeCCId === cc.id ? "white" : "var(--t2)" }}>{cc.emoji} {cc.shortName}</div>
                                  <div className="cc-mini-miles" style={{ color: cc.accent }}>{cc.milesEarned.toLocaleString()} mi</div>
                                  {cc.discount > 0 && <div className="cc-mini-disc">−SGD {Math.round(cc.discount)}</div>}
                                </div>
                              ))}
                            </div>
                            <div className="rblk">
                              <div><div className="rbt">{f.dep}</div><div className="rbi">SIN</div></div>
                              <div className="rbm"><div className="rbl"><span className="rbpl">✈</span></div><div className="rbd">{f.dur}</div><div className="rbst">{f.stops === 0 ? "Direct" : `${f.stops}stop`}</div></div>
                              <div className="rbr"><div className="rbt">{f.arr}</div><div className="rbi">{f.dest}</div></div>
                            </div>
                            {activeDest.tripType === "return" && (
                              <div className="rblk retblk">
                                <div><div className="rbt">{f.retDep}</div><div className="rbi">{f.dest}</div></div>
                                <div className="rbm"><div className="rbl"><span className="rbpl">↩</span></div><div className="rbd">{f.dur}</div></div>
                                <div className="rbr"><div className="rbt">{f.retArr}</div><div className="rbi">SIN</div></div>
                              </div>
                            )}
                            <div className="fcbot">
                              <div className="ftags">
                                {f.stops === 0 && <span className="ftag g">Direct</span>}
                                {f.promo && <span className="ftag a">🏷 {f.promo.code}</span>}
                                {f.finalPrice <= (activeDest.budget || Infinity) && <span className="ftag g">✓ Budget</span>}
                              </div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <button className={`trkbtn ${tracked[f.id] ? "on" : ""}`}
                                  onClick={() => { setTracked(p => ({ ...p, [f.id]: !p[f.id] })); if (!tracked[f.id]) toast({ type: "ok", title: "Fare tracked", msg: "Alerts if price changes" }); }}>
                                  {tracked[f.id] ? "✓" : "♡"}
                                </button>
                                <button className="book-btn" onClick={() => setSelectedFlight(f)}>
                                  Book Now ↗
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* ── SALES ── */}
                  {tab === "sales" && (
                    <>
                      <div className="sale-hero">
                        {[{ code: "SQ", name: "Singapore Airlines", emoji: "🦅", data: SALE_DATA.SQ, cls: "sq" },
                          { code: "TR", name: "Scoot", emoji: "🟡", data: SALE_DATA.TR, cls: "tr" }].map(al => {
                          const cur = al.data.find(s => s.status === "active");
                          const next = al.data.find(s => s.status === "upcoming");
                          return (
                            <div key={al.code} className={`asc ${al.cls}`}>
                              <div className="asc-bg">{al.emoji}</div>
                              <div className={`asc-badge ${cur ? "active" : next ? "upcoming" : "none"}`}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: cur ? "var(--te)" : next ? "var(--am)" : "var(--t3)", display: "inline-block" }} />
                                {cur ? "LIVE NOW" : next ? "UPCOMING" : "MONITORING"}
                              </div>
                              <div className="asc-name">{al.name}</div>
                              <div className="asc-status">{cur ? cur.name : next ? next.name : "No active sale"}</div>
                              {(cur || next) && <div className="asc-disc">{(cur || next).discount}</div>}
                              {next && !cur && <div className="asc-next">In {daysUntil(next.start)} days · {next.start}</div>}
                              {cur && <div className="asc-next" style={{ color: "var(--te)" }}>{daysUntil(cur.end)} days left · ends {cur.end}</div>}
                              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10 }}>
                                <button className={`tog ${saleAlerts[al.code] ? "on" : ""}`} onClick={() => setSaleAlerts(p => ({ ...p, [al.code]: !p[al.code] }))}><div className="togk" /></button>
                                <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: saleAlerts[al.code] ? "var(--te)" : "var(--t3)" }}>Alerts {saleAlerts[al.code] ? "ON" : "OFF"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: "var(--t3)", letterSpacing: ".18em", marginBottom: 10 }}>ALL SALE PERIODS</div>
                      <div className="sale-list">
                        {[...SALE_DATA.SQ.map(s => ({ ...s, alCode: "SQ", alName: "Singapore Airlines", alEmoji: "🦅" })),
                          ...SALE_DATA.TR.map(s => ({ ...s, alCode: "TR", alName: "Scoot", alEmoji: "🟡" }))]
                          .sort((a, b) => ({ active: 0, upcoming: 1, past: 2 }[a.status] - { active: 0, upcoming: 1, past: 2 }[b.status]))
                          .map((s, i) => {
                            const dStart = daysUntil(s.start), dEnd = daysUntil(s.end);
                            return (
                              <div key={i} className={`si ${s.status === "active" ? "active-s" : s.status === "upcoming" ? "upcoming-s" : "past-s"}`}>
                                <div className="si-top">
                                  <div style={{ flex: 1 }}>
                                    <div className="si-al"><span style={{ fontSize: 15 }}>{s.alEmoji}</span><span className="si-aln">{s.alName}</span>
                                      <span className={`si-chip ${s.status === "active" ? "act" : s.status === "upcoming" ? "com" : ""}`}>{s.status === "active" ? "● LIVE" : s.status === "upcoming" ? "SOON" : "PAST"}</span>
                                    </div>
                                    <div className="si-name">{s.name}</div>
                                  </div>
                                  <div className="si-right"><div className="si-disc">{s.discount}</div><div className="si-dates">{s.start} → {s.end}</div></div>
                                </div>
                                <div className="si-meta">
                                  {s.status === "active" && <span className="si-chip act">{dEnd > 0 ? `${dEnd}d left` : "Today"}</span>}
                                  {s.status === "upcoming" && <span className="si-chip com">in {dStart}d</span>}
                                  {s.code && <span className="si-chip cod" onClick={() => copyCode(s.code)}>🏷 {s.code} {copied === s.code ? "✓" : ""}</span>}
                                </div>
                                <div className="si-routes">{Array.isArray(s.routes) ? s.routes.join(" · ") : s.routes}</div>
                                <div className="si-foot">
                                  <div className="si-alert-row"><button className="tog on"><div className="togk" /></button><span>Notify me</span></div>
                                  {s.status !== "past" && <div className={`countdown ${s.status === "active" ? "cd-a" : "cd-s"}`}>{s.status === "active" ? `⏱ ${dEnd}d remaining` : `⏳ ${dStart}d to start`}</div>}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  )}

                  {/* ── CARDS ── */}
                  {tab === "cards" && (
                    <>
                      <div className="cc-intro">Select a card to auto-apply its discounts and miles calculation across all flight results. Miles earned shown for current destination price.</div>
                      <div className="cc-cards-grid">
                        {Object.values(CREDIT_CARDS).map(cc => {
                          const calc = getBestCard("SQ", activeDest.price).find(c => c.id === cc.id);
                          return (
                            <div key={cc.id} className="cc-card"
                              style={{ background: `linear-gradient(135deg,${cc.color}55,${cc.color}22)`, borderColor: activeCCId === cc.id ? cc.accent : "var(--b1)", boxShadow: activeCCId === cc.id ? `0 0 0 1.5px ${cc.accent}` : "none" }}
                              onClick={() => setActiveCCId(cc.id)}>
                              <div className="cc-card-bg">{cc.emoji}</div>
                              <div className="cc-bank" style={{ color: cc.accent }}>{cc.bank}</div>
                              <div className="cc-name">{cc.name}</div>
                              <div className="cc-mpd-row"><div className="cc-mpd-val" style={{ color: cc.accent }}>{Math.max(...Object.values(cc.mpd))}</div><div className="cc-mpd-lbl"> mpd max</div></div>
                              {activeCCId === cc.id && calc && (
                                <div className="cc-disc-badge" style={{ background: `${cc.accent}20`, border: `1px solid ${cc.accent}40`, color: cc.accent }}>
                                  ✓ Active · {calc.milesEarned.toLocaleString()} mi
                                </div>
                              )}
                              <div className="cc-perks">{cc.perks.map((p, i) => <div key={i} className="cc-perk" style={{ color: `${cc.accent}cc` }}>{p}</div>)}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bcs-title">CARD COMPARISON · SGD {activeDest.price.toLocaleString()} · {pax} ADULTS</div>
                      <div className="card-comp">
                        {getBestCard("SQ", activeDest.price).map((cc, i) => (
                          <div key={cc.id} className={`ccr ${i === 0 ? "win" : ""}`} onClick={() => setActiveCCId(cc.id)}>
                            <div className="ccr-rank" style={{ color: i === 0 ? "var(--am)" : "var(--t3)" }}>{i === 0 ? "★" : `#${i + 1}`}</div>
                            <div className="ccr-info"><div className="ccr-n">{cc.emoji} {cc.name}</div><div className="ccr-mpd">{cc.mpdRate} mpd</div></div>
                            <div className="ccr-miles">{cc.milesEarned.toLocaleString()} mi</div>
                            {cc.discount > 0 ? <div className="ccr-disc">−SGD {Math.round(cc.discount)}</div> : <div style={{ fontSize: 9, color: "var(--t3)", fontFamily: "'IBM Plex Mono',monospace" }}>No direct disc.</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── MONTHS ── */}
                  {tab === "months" && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div><div className="section-title">Best 12 Months</div><div className="section-sub">{pax} adult{pax > 1 ? "s" : ""} · {activeDest.tripType} from SIN</div></div>
                        <div style={{ display: "flex", gap: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--t3)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--te)", display: "inline-block" }} />Cheapest</span>
                        </div>
                      </div>
                      {mload ? <div className="ldblk"><div className="spin lg" /><div className="ldt">Scanning 12-month calendar…</div></div> : (
                        <>
                          <div className="mgrid">
                            {months.map((m, i) => {
                              const maxP = Math.max(...months.map(x => x.price)), minP = Math.min(...months.map(x => x.price));
                              const pct = maxP === minP ? 50 : Math.round(((m.price - minP) / (maxP - minP)) * 100);
                              return (
                                <div key={i} className={`mcard ${m.isLowest ? "cheap" : ""} ${i === 0 ? "cur" : ""}`}>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div><div className="mcmo">{m.month}</div><div className="mcyr">{m.year}</div></div>
                                    {m.isLowest && <span className="mctag best">★</span>}
                                    {i === 0 && !m.isLowest && <span className="mctag now">NOW</span>}
                                  </div>
                                  <div className="mcp">SGD {m.price.toLocaleString()}</div>
                                  <div style={{ fontSize: 9, color: "var(--t3)", fontFamily: "'IBM Plex Mono',monospace", marginBottom: 4 }}>
                                    {Math.round(m.price / pax).toLocaleString()}/pax{m.price <= (activeDest.budget || Infinity) ? <span style={{ color: "var(--te)", marginLeft: 4 }}>✓</span> : ""}
                                  </div>
                                  <div className="mcbar"><div className="mcbf" style={{ width: `${100 - pct}%` }} /></div>
                                </div>
                              );
                            })}
                          </div>
                          {months.length > 0 && (() => {
                            const best = months.find(m => m.isLowest) || months[0];
                            const minW = Math.min(...best.weeks.map(w => w.price));
                            return (
                              <div className="wkgrid">
                                <div className="wgtit">WEEKLY · {best.month.toUpperCase()} {best.year} · {pax} ADULTS</div>
                                <div className="wrow">
                                  {best.weeks.map((w, i) => {
                                    const s = i * 7 + 1;
                                    return (
                                      <div key={i} className={`wcell ${w.price === minW ? "wb" : ""}`}>
                                        <div className="wcd">{best.month} {s}–{s + 6}</div>
                                        <div className="wcp">{w.price.toLocaleString()}</div>
                                        <div className="wcs">{w.price === minW ? "★ Best" : "SGD"}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </>
                  )}

                  {/* ── PROMOS ── */}
                  {tab === "promos" && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div><div className="section-title">Promo Codes</div><div className="section-sub">Tap code to copy · Auto-applied on flights</div></div>
                        <button className="pbtn" onClick={refreshPromosAI} disabled={pload}>{pload ? <><span className="spin dk" />…</> : <>⟳ AI Refresh</>}</button>
                      </div>
                      {pload ? <div className="ldblk"><div className="spin lg" /><div className="ldt">Fetching latest codes…</div></div>
                        : promos.length === 0 ? <div className="eblk">Tap AI Refresh above to load codes</div>
                          : <div className="cgrid">
                            {promos.map((p, i) => {
                              const exp = isExp(p.expires), soon = expSoon(p.expires);
                              return (
                                <div key={i} className="ccard" style={{ opacity: exp ? 0.55 : 1 }}>
                                  <div className="cctop">
                                    <div className="ccal">
                                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--n2)", border: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{p.airlineEmoji}</div>
                                      <div><div className="ccan">{p.airlineName}</div><div className="ccar">{p.routes}</div></div>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                      {copied === p.code && <div className="ccopied">Copied!</div>}
                                      <div className="codeval" onClick={() => copyCode(p.code)}>{p.code}</div>
                                    </div>
                                  </div>
                                  <div className="cmeta">
                                    <div className={`cchip ${exp ? "exp" : soon ? "warn" : "ok"}`}>{exp ? "✗ Expired" : soon ? "⚠ Soon" : "✓ Valid"} · {p.expires}</div>
                                    <div className={`cchip ${p.verified ? "ok" : "warn"}`}>{p.verified ? "✓ Verified" : "⚠ Unverified"}</div>
                                  </div>
                                  <div className="cdesc">{p.discount}</div>
                                </div>
                              );
                            })}
                          </div>
                      }
                    </>
                  )}

                  {/* ── HISTORY 14d ── */}
                  {tab === "history" && (() => {
                    const h = activeDest.priceHistory;
                    const maxP = Math.max(...h), minP = Math.min(...h);
                    const trend = pctChg(h[h.length - 1], h[0]);
                    const days14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" }); });
                    const srcs = ["Agg", "Sky", "GF", "Sky", "Agg", "GF", "Agg", "Sky", "GF", "Sky", "Agg", "GF", "Sky", "Agg"];
                    return (
                      <>
                        <div className="hchart">
                          <div className="hctit">
                            14-DAY TREND · {activeDest.name.toUpperCase()} · {pax} PAX
                            <div className="trend-stat" style={{ color: parseFloat(trend) < 0 ? "var(--te)" : "var(--re)" }}>
                              {parseFloat(trend) < 0 ? "▼" : "▲"}{Math.abs(parseFloat(trend))}% / 14d
                            </div>
                          </div>
                          <div className="bchart">
                            {h.map((p, i) => {
                              const range = maxP - minP || 1;
                              const ht = Math.max(3, Math.round(((p - minP) / range) * 44) + 3);
                              const isCur = i === h.length - 1, isMin = p === minP;
                              return (
                                <div key={i} className="bcc" title={`${days14[i]}: SGD ${p.toLocaleString()}`}>
                                  <div className="bcp">{(p / 1000).toFixed(1)}k</div>
                                  <div className="bcb" style={{ height: ht, background: isCur ? "var(--am)" : isMin ? "var(--te)" : "var(--b2)" }} />
                                  <div className="bcd">{i % 2 === 0 ? days14[i]?.split(" ")[0] : ""}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="htable">
                          <div className="htable-inner">
                            <div className="hthead"><div className="htth">Date</div><div className="htth">Source</div><div className="htth">SGD</div><div className="htth">Change</div><div className="htth">vs Budget</div></div>
                            {h.map((p, i) => {
                              const prev = h[i - 1], chg = prev ? p - prev : 0;
                              const chgPct = prev ? pctChg(p, prev) : null;
                              const vs = activeDest.budget ? p - activeDest.budget : null;
                              return (
                                <div key={i} className="htrow">
                                  <div className="httd mo">{days14[i]}</div>
                                  <div className="httd" style={{ fontSize: 10, color: "var(--t3)" }}>{srcs[i]}</div>
                                  <div className="httd pr">{p.toLocaleString()}</div>
                                  <div className="httd">{chg !== 0 ? <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: chg < 0 ? "var(--te)" : "var(--re)" }}>{chg < 0 ? "▼" : "▲"}{Math.abs(chg)} ({Math.abs(parseFloat(chgPct))}%)</span> : <span style={{ color: "var(--t4)" }}>—</span>}</div>
                                  <div className="httd">{vs !== null ? <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: vs <= 0 ? "var(--te)" : "var(--re)" }}>{vs <= 0 ? `✓ ${Math.abs(vs).toLocaleString()} under` : `+${vs.toLocaleString()} over`}</span> : "—"}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            {/* ── BOTTOM NAV (mobile only) ── */}
            <nav className="bottom-nav">
              <div className="bn-items">
                {bottomTabs.map(t => (
                  <button key={t.id} className={`bn-item ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
                    {t.badge != null && <div className={`bn-badge ${t.badgeClass || ""}`}>{t.badge}</div>}
                    <span className="bn-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </main>
        </div>
      </div>
    </>
  );
}
