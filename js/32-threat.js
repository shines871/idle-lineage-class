// ============================================================
// js/32-threat.js — 🎯 仇恨制（即時累積制·取代靜態受擊權重）
//
//   設計定案見記憶 [[aggro-threat-system-design]]。核心公式（雙軸）：
//     選敵權重(mob, 實體) = baseThreat(實體) × THREAT_K + 累積仇恨[mob][實體]
//     累積仇恨 += 造成的傷害 × threatMult(實體)     （BOSS 目標：threatMult 全體 ×0.5）
//     threatMult = classMult(職業) × sourceMult(武器種類)；寵物/召喚/護衛一律 1.0
//   衰減＝惰性計算·半衰期 10 秒（讀取時才補算·補跑乾淨·不做逐 tick 掃表）。
//
//   ⚠️ baseThreat 直接沿用現行 mercAggroWeight/petAggroWeight/summonAggroWeight/guardAggroWeight
//      → 開戰瞬間＝完全等同舊靜態權重（累積恆 0 時 base×K 的相對比例＝舊制）。這是零風險遷移基礎。
//   ⚠️ mob._threat / _threatT 是 runtime 狀態·存檔只從輸出副本剝除（js/13 saveStateJson）。
//
//   歸因採「快照差分」（比照 js/03 DPS 的 _dpsSnap/_dpsDealt·各自獨立函式勿混用）：
//     玩家＝玩家階段整段一個視窗（js/03）；傭兵＝逐傭兵回合視窗（js/06）；
//     寵物/召喚/護衛＝各實體攻擊各包一個視窗（js/22/23/31 threatWrap）。
// ============================================================
'use strict';

let THREAT_ENABLED = true;                 // 總開關（false＝完全回退舊靜態權重）
const THREAT_K = 20;                       // 🔧 base×K 的 K：調大＝base(坦/職業)更持久；調小＝累積(傷害)更快主導。P2 調校鈕。
const THREAT_HALFLIFE_TICKS = 100;         // 半衰期＝100 tick＝10 秒（10 tps）
const THREAT_MIN = 0.5;                    // 衰減後低於此值即刪除該筆（省記憶＋防浮點殘留）

// ---------- 一、係數 ----------
function threatClassMult(ent) {
    let c = ent && ent.cls;
    if (c === 'knight' || c === 'warrior' || c === 'dragon' || c === 'royal') return 2.0;   // 前排：騎士/戰士/龍騎士/王族
    if (c === 'elf' || c === 'dark') return 1.5;                                            // 妖精/黑暗妖精
    if (c === 'mage' || c === 'illusion') return 1.0;                                       // 施法者
    return 1.0;
}
// 武器種類 → sourceMult（識別四機制：WEAPON_TAGS 9 近戰標籤＋isBow/isWand/chainsword/qigu 旗標＋矛/武士刀看 w2h＋戰士雙持看 offwpn）
function weaponSourceMult(ent) {
    let wRef = (ent && ent.eq && ent.eq.wpn) ? ent.eq.wpn : null;
    if (!wRef) return 1.0;                                              // 空手
    let w = DB.items[wRef.id];
    if (!w) return 1.0;
    if (w.isBow || w.ranged) return 0.5;                               // 弓/十字弓/遠程
    if (w.qigu) return 0.8;                                            // 奇古獸（幻術士魔法向）
    if (w.isWand) return 1.0;                                          // 魔杖普攻（法師施法走 0.8 屬另一軸·本作先簡化為 1.0）
    if (w.chainsword) return 1.2;                                      // 鎖鏈劍
    let tags = (typeof getWeaponTags === 'function') ? getWeaponTags(wRef.id) : [];
    if (ent.eq.offwpn && tags.indexOf('單手鈍器') !== -1) return 1.2;  // 戰士雙持單手鈍器
    if (tags.indexOf('武士刀') !== -1) return 1.2;                     // 武士刀（雙標籤·優先於單手劍）
    if (tags.indexOf('雙手劍') !== -1 || tags.indexOf('雙手鈍器') !== -1) return 1.2;
    if (tags.indexOf('矛') !== -1) return w.w2h ? 1.2 : 1.5;           // 雙手矛 1.2／單手矛 1.5
    if (tags.indexOf('單手劍') !== -1 || tags.indexOf('單手鈍器') !== -1) return 1.5;
    if (tags.indexOf('匕首') !== -1 || tags.indexOf('雙刀') !== -1 || tags.indexOf('鋼爪') !== -1) return 1.0;
    return 1.0;                                                        // 未知 tag → 1.0
}
// 實體的最終 threatMult。玩家/傭兵＝classMult×sourceMult；寵物/召喚/護衛（無 cls）＝1.0；隱身斗篷(aggroMin)＝0（不累積仇恨）。
function computeThreatMult(ent) {
    if (!ent) return 1.0;
    if (ent.eq) for (let k in ent.eq) { let e = ent.eq[k]; if (e) { let d = DB.items[e.id]; if (d && d.aggroMin) return 0; } }   // 🫥 隱身斗篷：baseThreat=1(mercAggroWeight)＋threatMult=0
    if (!ent.cls) return 1.0;   // 寵物/召喚/護衛
    return threatClassMult(ent) * weaponSourceMult(ent);
}

// ---------- 二、仇恨鍵（與受害者池的候選身分一致） ----------
function threatKey(ent) {
    if (!ent) return 'P';
    if (typeof player !== 'undefined' && ent === player) return 'P';
    if (ent._slot != null && ent.cls) return 'A:' + ent._slot;   // 傭兵（存檔槽）
    if (ent.uid != null) return 'U:' + ent.uid;                  // 寵物/召喚/護衛（runtime uid）
    return 'P';                                                  // 迷魅等抽象→歸玩家
}

// ---------- 三、累積 + 惰性衰減 ----------
function _threatNow() { return (typeof state !== 'undefined' && state) ? (state.ticks || 0) : 0; }
function _threatDecayMob(m, now) {
    if (!m || !m._threat) return;
    if (now == null) now = _threatNow();
    let last = m._threatT != null ? m._threatT : now;
    let dt = now - last;
    if (dt <= 0) return;
    let f = Math.pow(0.5, dt / THREAT_HALFLIFE_TICKS);
    for (let k in m._threat) { let v = m._threat[k] * f; if (v < THREAT_MIN) delete m._threat[k]; else m._threat[k] = v; }
    m._threatT = now;
}
function _threatAdd(m, key, amt, now) {
    if (!m || !(amt > 0)) return;
    if (now == null) now = _threatNow();
    if (!m._threat) { m._threat = Object.create(null); m._threatT = now; }
    else _threatDecayMob(m, now);
    m._threat[key] = (m._threat[key] || 0) + amt;
}
function threatOf(m, key) {
    if (!THREAT_ENABLED || !m || !m._threat) return 0;
    _threatDecayMob(m);
    return m._threat[key] || 0;
}

// 鐵衛 5/5：一般攻擊命中後，目標鎖定攻擊者 3 秒；到期後回到正常仇恨選敵。
const IRON_GUARD_TAUNT_TICKS = 30;
function _ironGuardTauntState(m) {
    let taunt = m && m._ironGuardTaunt;
    if (!taunt) return null;
    if ((taunt.until || 0) <= _threatNow()) { delete m._ironGuardTaunt; return null; }
    return taunt;
}
function ironGuardTaunt(m, ent) {
    if (!m || m._dead || (m.curHp || 0) <= 0 || !ent) return false;
    let now = _threatNow(), key = threatKey(ent), old = _ironGuardTauntState(m);
    let firstApply = !old || old.key !== key;
    m._ironGuardTaunt = { key:key, until:now + IRON_GUARD_TAUNT_TICKS };
    if (THREAT_ENABLED) {
        if (!m._threat) { m._threat = Object.create(null); m._threatT = now; }
        else _threatDecayMob(m, now);
        let highest = 0;
        for (let k in m._threat) highest = Math.max(highest, Number(m._threat[k]) || 0);
        m._threat[key] = Math.max(Number(m._threat[key]) || 0, highest + THREAT_K);
    }
    return firstApply;
}
function ironGuardTauntTarget(m) {
    let taunt = _ironGuardTauntState(m);
    if (!taunt || typeof player === 'undefined' || !player) return null;
    if (taunt.key === 'P') return !player.dead && (player.hp || 0) > 0 ? player : null;
    return (player.allies || []).find(a => a && !a._downed && (a.curHp || 0) > 0 && threatKey(a) === taunt.key) || null;
}
function ironGuardTauntWeakensAttack(m) { return !!_ironGuardTauntState(m); }

// ---------- 四、歸因（快照差分·per-mob） ----------
// snap＝_dpsSnap() 的同格式陣列（各怪 curHp）。與快照比對·每隻怪的掉血量 × mult 記給 ent。
function threatCommitDiff(snap, ent) {
    if (!THREAT_ENABLED || !snap || !ent) return;
    if (typeof mapState === 'undefined' || !mapState || !mapState.mobs) return;
    let mult, key, now, mobs = mapState.mobs;
    for (let i = 0; i < snap.length; i++) {
        if (snap[i] == null) continue;
        let m = mobs[i];
        if (!m || m._dead) continue;
        let lost = snap[i] - Math.max(0, m.curHp || 0);
        if (lost <= 0) continue;
        if (mult === undefined) {   // 冷卻／空回合不掃裝備；有傷害才計算一次本次歸因的係數。
            mult = computeThreatMult(ent);
            if (!(mult > 0)) return;   // 隱身斗篷等：不累積
            key = threatKey(ent);
            now = _threatNow();
        }
        let amt = lost * mult;
        if (m.boss) amt *= 0.5;   // 🐲 BOSS：threatMult 全體減半（更偏隨機·免一坦鎖死全場）
        _threatAdd(m, key, amt, now);
    }
}
// 包住某實體的一次攻擊（寵物/召喚/護衛）：量測期間對怪掉血→記給該實體。
function threatWrap(ent, fn) {
    if (!THREAT_ENABLED || typeof _dpsSnap !== 'function') { fn(); return; }
    let snap = _dpsSnap();
    fn();
    threatCommitDiff(snap, ent);
}

// ---------- 五、治療仇恨（實際回復量 × 0.5·平均分給場上存活怪·不乘 threatMult） ----------
function threatHeal(caster, actualAmt) {
    if (!THREAT_ENABLED || !(actualAmt > 0)) return;
    if (typeof mapState === 'undefined' || !mapState || !mapState.mobs) return;
    let alive = mapState.mobs.filter(m => m && !m._dead && (m.curHp || 0) > 0);
    if (!alive.length) return;
    let key = threatKey(caster), per = (actualAmt * 0.5) / alive.length, now = _threatNow();
    for (let m of alive) _threatAdd(m, key, per, now);
}

// ---------- 六、選敵權重（受害者池呼叫·單一真相） ----------
// 回傳「怪 m 選擇攻擊 ent 的權重」＝ baseThreat×K + 累積仇恨。base<=0（不在候選）→原樣回傳。
function victimThreatWeight(m, ent, baseWeight) {
    if (!THREAT_ENABLED || !(baseWeight > 0)) return baseWeight;
    let taunt = _ironGuardTauntState(m);
    if (taunt && taunt.key === threatKey(ent)) return 1000000000;   // 其他選敵管線也必定把嘲諷者視為最高仇恨
    return baseWeight * THREAT_K + threatOf(m, threatKey(ent));
}

// ---------- 七、載入舊存檔時清除 runtime 狀態（正常存檔不改動戰鬥中的仇恨） ----------
function stripThreatForSave() {
    if (typeof mapState === 'undefined' || !mapState || !mapState.mobs) return;
    for (let m of mapState.mobs) { if (m) { if (m._threat) delete m._threat; if (m._threatT != null) delete m._threatT; if (m._ironGuardTaunt) delete m._ironGuardTaunt; } }
}
