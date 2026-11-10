// ===== 🎯 DPS 統計（本圖效率統計用）=====
// 以「HP-delta 歸因」量測各來源每秒輸出：在 tick 各攻擊階段前後快照在場怪 curHp，差值歸給該階段來源。
// 來源：player（玩家·含自動施法/持續增益/中毒出血 DoT）、summon（玩家召喚/迷魅/幻術立方）、pet（寵物）、
//       per-ally（每個傭兵獨立·key=存檔槽 _slot）。累積傷害÷觀測秒數＝DPS。換地圖/重置歸零（auditReset→_dpsReset），非存檔。
let _dps = { player: 0, summon: 0, pet: 0, allies: {} };
let _dpsAllyTurn = false;   // alliesTick 逐傭兵量測期間為 true：令 _allyDamageMob 不重複計入（回合內輸出已被該傭兵 HP-delta 涵蓋），僅「反擊/居合」等回合外輸出才由 _allyDamageMob 直接歸因
// 原版方向的魔法係數：1－屬性防禦＋3×max(1, INT提供SP＋道具SP)÷32。
// Fable 的 INT 可超過原版上限，因此 INT 提供的 SP 封頂 33（等同原版 INT 45 → INT-12）。
// extraMp 仍是畫面上的「總額外魔法點數」；扣除 INT 原始提供量後才是道具／套裝／增益 SP，避免重複計算。
function magicIntSp(dStats) {
    if (!dStats) return 0;
    if (dStats.intSp != null) return Math.max(0, Math.min(33, Number(dStats.intSp) || 0));
    let raw = (typeof getIntExtraMp === 'function') ? getIntExtraMp(Number(dStats.int) || 0) : 0;
    return Math.max(0, Math.min(33, Number(raw) || 0));
}
function magicItemSp(dStats) {
    if (!dStats) return 0;
    if (dStats.itemSp != null) return Math.max(0, Number(dStats.itemSp) || 0);
    let rawIntSp = (typeof getIntExtraMp === 'function') ? getIntExtraMp(Number(dStats.int) || 0) : 0;
    return Math.max(0, (Number(dStats.extraMp) || 0) - (Number(rawIntSp) || 0));
}
function magicAttrDefense(target, ele) {
    if (!target) return 0;
    let d = target.d || target;
    let key = ele === 'fire' ? 'resFire' : ele === 'water' ? 'resWater' : ele === 'wind' ? 'resWind' : ele === 'earth' ? 'resEarth' : 'resNone';
    let raw = Number(d[key]) || 0;
    let effective = (typeof effResistPct === 'function') ? effResistPct(raw) : raw;
    return Math.max(0, Math.min(1, effective / 100));
}
function magicTierMult(tier) {
    return 1 + Math.max(0, Number(tier) || 0) / 10;
}
function magicDamageCoef(dStats, attrDefense, spellTier) {
    let sp = Math.max(1, magicIntSp(dStats) + magicItemSp(dStats));
    let attr = Math.max(0, Math.min(1, Number(attrDefense) || 0));
    let base = Math.max(0, 1 - attr + 3 * sp / 32);
    return base * (spellTier == null ? 1 : magicTierMult(spellTier));
}
// 魔法傷害 stat 視為骰值以外的固定魔法傷害，每次施法只加入一次。
function magicBaseDamage(rolled, dStats, flatBase, includeStat) {
    let stat = includeStat === false ? 0 : Math.max(0, Number(dStats && dStats.magicDmg) || 0);
    return Math.max(0, Number(rolled) || 0) + Math.max(0, Number(flatBase) || 0) + stat;
}
// 舊版方向治癒：INT 25 前沿用原始魔力加成級距；之後每 5 INT +1，INT 80 封頂。
// 治癒不吃魔法傷害、道具 SP、法術階級、魔法爆擊；×2 為 classicHeal 基礎倍率（與正義值無關）。
// ⚖️ 正義值加成另由 justiceHeal 旗標在 rollHealingSpell 內以 pvpJusticeHealMultValue 乘算（滿正義 +20%·紅名不加成）。
function classicHealMagicBonus(dStats) {
    let int = Math.max(0, Math.floor(Number(dStats && dStats.int) || 0));
    if (int <= 9) return -1;
    if (int <= 11) return 0;
    if (int <= 14) return 1;
    if (int <= 17) return 2;
    if (int === 18) return 3;
    if (int <= 25) return int - 15;   // INT19~25：4~10
    return Math.min(21, 10 + Math.floor((int - 25) / 5));   // INT60=17、INT80+=21
}
function healingSpellTargetHp(target) {
    if (!target) return 0;
    if (typeof _supHp === 'function') return Math.max(0, Number(_supHp(target)) || 0);
    return Math.max(0, Number(target === player ? target.hp : (target.curHp != null ? target.curHp : target.hp)) || 0);
}
function healingSpellTargetMhp(target) {
    if (!target) return 1;
    if (typeof _supMhp === 'function') return Math.max(1, Number(_supMhp(target)) || 1);
    return Math.max(1, Number(target.mhp) || 1);
}
function healingSpellCasterMult(sk, caster) {
    if (!sk || !sk.groupHeal || !caster || !caster.eq || !caster.eq.wpn || typeof DB === 'undefined') return 1;
    let w = DB.items[caster.eq.wpn.id];
    return Math.max(0, Number(w && w.groupHealMult) || 1);
}
// 🌊 v3.6.20 汙濁之水（玩家NPC二模板·妖精）：目標受到的治癒（藥水與技能）效果減半。
//   技能治癒統一在 rollHealingSpell 收口；藥水另有三掛點（玩家 js/08／傭兵 js/06／寵物 js/22 各自讀自己的狀態）。
//   target 可能是 player（statuses）/傭兵（statuses）/寵物（_statuses），三型通吃。
function foulWaterHealMult(target) {
    if (!target) return 1;
    let st = (typeof player !== 'undefined' && target === player) ? player.statuses : (target.statuses || target._statuses);
    return (st && (st.foulWater || 0) > 0) ? 0.5 : 1;
}
function rollHealingSpell(sk, dStats, caster, target) {
    if (!sk) return 0;
    let _fw = foulWaterHealMult(target);
    if (sk.fullRestore) return Math.max(0, Math.floor((healingSpellTargetMhp(target) - healingSpellTargetHp(target)) * _fw));
    // 💙 v3.5.75 正義治癒加成：justiceHeal 旗標技能→依「施法者」正義值提升最終恢復量（滿正義+20%·中立/邪惡不變·不看被治療者）。
    //   v3.5.76 傭兵適用：caster=傭兵時改用其招募時記錄的來源存檔性向值（ally.alignmentValue）。
    let _jm = 1;
    if (sk.justiceHeal && typeof pvpJusticeHealMultValue === 'function') {
        if (typeof player !== 'undefined' && caster === player) _jm = pvpJusticeHealMult();
        else if (caster && (typeof player === 'undefined' || caster !== player) && caster.alignmentValue != null) _jm = pvpJusticeHealMultValue(caster.alignmentValue);
    }
    if (sk.classicHeal) {
        let c = sk.classicHeal;
        let count = Math.max(1, Math.floor(Number(c.baseDice) || 0) + classicHealMagicBonus(dStats));
        let sides = Math.max(1, Math.floor(Number(c.sides) || 1));
        let rolled = 0;
        for (let i = 0; i < count; i++) rolled += roll(1, sides);
        let mult = 2 * Math.max(0, Number(c.mult) || 1) * healingSpellCasterMult(sk, caster);
        return Math.max(1, Math.floor(rolled * mult * _jm * _fw));
    }
    // 尚未轉換的治癒來源保留舊資料相容性。
    if (sk.healDice) return Math.max(1, Math.floor((rollDice(sk.healDice[0], sk.healDice[1]) + (sk.healBase || 0)) * (1 + 3 * (Number(dStats && dStats.magicDmg) || 0) / 32) * _jm * _fw));
    if (sk.valDice) return Math.max(1, Math.floor(((sk.valBase || 0) + roll(sk.valDice[0], sk.valDice[1]) + (Number(dStats && dStats.magicDmg) || 0)) * _jm * _fw));
    return 0;
}
// 魔法型武器特效／奇古獸普攻依潘朵拉權重換算法術階級；傳說與遺物固定視為 5 階。
function weaponMagicTier(wpn) {
    if (!wpn) return 0;
    let w = Number(wpn.gachaWeight) || 0;
    if (wpn.legend || wpn.relic || w === 1) return 5;
    if (w >= 2 && w <= 20) return 4;
    if (w <= 40 && w >= 21) return 3;
    if (w <= 60 && w >= 41) return 2;
    if (w <= 80 && w >= 61) return 1;
    return 0;
}
function weaponMagicDamageCoef(dStats, wpn, target, ele) {
    return magicDamageCoef(dStats, magicAttrDefense(target, ele), weaponMagicTier(wpn));
}
function _dpsReset() { _dps = { player: 0, summon: 0, pet: 0, allies: {} }; _dpsReactAllyAccum = 0; }
function _dpsSnap() {   // 快照在場（未死）怪物 curHp（依索引；tick 內怪物陣列不位移→索引穩定）
    if (typeof mapState === 'undefined' || !mapState || !mapState.mobs) return null;
    return mapState.mobs.map(m => (m && !m._dead) ? (m.curHp || 0) : null);
}
function _dpsDealt(snap) {   // 與快照比對：加總掉血量（補血/再生→負值忽略；新生怪 snap=null 忽略；溢殺以 0 計）
    if (!snap || typeof mapState === 'undefined' || !mapState || !mapState.mobs) return 0;
    let mobs = mapState.mobs, d = 0;
    for (let i = 0; i < snap.length; i++) {
        if (snap[i] == null) continue;
        let m = mobs[i];
        let after = (m && !m._dead) ? Math.max(0, m.curHp || 0) : 0;
        let lost = snap[i] - after;
        if (lost > 0) d += lost;
    }
    return d;
}
function _dpsAddAlly(ally, amt) {   // 累加某傭兵輸出（key=存檔槽·名稱隨時更新）
    if (!(amt > 0) || !ally) return;
    let k = ally._slot != null ? String(ally._slot) : (ally._allyName || 'ally');
    if (!_dps.allies[k]) _dps.allies[k] = { name: ally._allyName || (typeof allyName === 'function' ? allyName(ally) : '傭兵'), dmg: 0 };
    else if (ally._allyName) _dps.allies[k].name = ally._allyName;
    _dps.allies[k].dmg += amt;
}
// 🎯 反應/DoT 歸因擴充：把「怪物行動迴圈」內的玩家受擊反應（反擊/居合/反射/荊棘/爆彈/受傷施法）補計入玩家，
//    並讓 DoT（中毒/出血/猛爆/灼燒）依「施加者」歸因（玩家/傭兵/寵物/召喚），而非一律算玩家。
let _dpsReactAllyAccum = 0;   // 反應視窗內·傭兵反應傷害（反擊/居合/反射/荊棘/爆彈）已由 _allyDamageMob/_dpsAllyReact 歸因的量；從玩家反應 delta 扣除避免重複
function _dpsReactWrap(fn) {   // 包住怪物一次攻擊/施法：期間對怪掉血＝玩家受擊反應（扣掉同 window 內已歸傭兵的部分）→歸玩家
    if (typeof mapState === 'undefined' || !mapState || !mapState.mobs) { fn(); return; }
    let _s = _dpsSnap(), _a0 = _dpsReactAllyAccum;
    fn();
    let _d = _dpsDealt(_s) - (_dpsReactAllyAccum - _a0);
    if (_d > 0) _dps.player += _d;
}
function _dpsAllySrc(ally) {   // 由傭兵物件產生 DoT 施加者標記（與 _dpsAddAlly 同鍵：存檔槽 _slot）
    if (!ally) return 'player';
    return { slot: (ally._slot != null ? String(ally._slot) : (ally._allyName || 'ally')), name: ally._allyName || '傭兵' };
}
function _dpsAllyReact(ally, preHp, dmg) {   // 傭兵受擊反應(反射/荊棘)直接歸該傭兵＋累加至反應視窗扣除量（不經 _allyDamageMob→不重複套 royalAllyMult）
    let amt = Math.max(0, Math.min(dmg, preHp));
    if (amt > 0) { _dpsAddAlly(ally, amt); _dpsReactAllyAccum += amt; }
}
function _dpsAllyReactWrap(ally, fn) {   // 傭兵受擊 AoE 反應(爆彈花/受擊強制連射)：量測對怪掉血→歸該傭兵；扣掉 fn 內已由 _allyDamageMob 歸因的部分(如月光爆裂)避免重複，並累加供外層玩家反應視窗扣除
    if (typeof mapState === 'undefined' || !mapState || !mapState.mobs) { fn(); return; }
    let _s = _dpsSnap(), _a0 = _dpsReactAllyAccum;
    fn();
    let _net = _dpsDealt(_s) - (_dpsReactAllyAccum - _a0);
    if (_net > 0) { _dpsAddAlly(ally, _net); _dpsReactAllyAccum += _net; }
}
function _dpsCreditDot(src, amt) {   // DoT 依施加者標記歸因：'player'/'pet'/'summon'/{slot,name}=傭兵；未標記(undefined)→玩家（相容舊 DoT）
    if (!(amt > 0)) return;
    if (src === 'pet') { _dps.pet += amt; return; }
    if (src === 'summon') { _dps.summon += amt; return; }
    if (src && typeof src === 'object' && src.slot != null) {
        let k = String(src.slot);
        if (!_dps.allies[k]) _dps.allies[k] = { name: src.name || '傭兵', dmg: 0 };
        else if (src.name) _dps.allies[k].name = src.name;
        _dps.allies[k].dmg += amt;
        return;
    }
    _dps.player += amt;
}

function gameLoop() {
    if (_ffResumeTimer !== null && _tickDebt >= TICK_MS) return;   // 快速續跑已排程時，忽略一般 100ms 計時器插隊
    // 🛡️ 反盜用：非官方網域時橫幅若被移除則自動重掛（官方/本機為快取布林值判定，成本可忽略）
    if (typeof _origEnforce === 'function') _origEnforce();
    let now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (_loopLast == null) {
        _loopLast = now;
        _tickDebt = 0;
        return;
    }
    let elapsed = now - _loopLast;
    _loopLast = now;
    let _hidden = typeof document !== 'undefined' && document.hidden;

    // 🔀 背景分頁能跑多少先跑多少：Chrome 即使降低 setInterval 頻率，每次喚醒仍逐 tick 償還已經過的時間。
    //    瀏覽器完全凍結的尾段由 visibilitychange 只補「距離最後一次 gameLoop」的差額，不會重複入帳。
    if (!state.running || player.dead) {
        _ffCancelScheduledLoop();
        _tickDebt = 0;
        if (_ffAcc && !_hidden) _ffFinishCatchup();
        else {
            _ffAcc = null;
            if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();
            if (typeof discardCatchupAutoSort === 'function') discardCatchupAutoSort();
            _ffProgressHide();
        }
        _ffErrorStreak = 0;
        state.ff = false;
        state.ffSmall = false;
        state.inTick = false;
        if (typeof takeCatchupSaveRequest === 'function') takeCatchupSaveRequest();
        return;
    }

    if (!Number.isFinite(elapsed) || elapsed < 0) elapsed = 0;
    _tickDebt += _hidden ? elapsed : Math.min(elapsed, FF_MAX_ELAPSED_MS);   // 背景凍結可能超過 5 分鐘：全額保留在債務中，不能因單次上限遺失收益
    if (_tickDebt < TICK_MS) {
        if (!_hidden && _ffAcc) _ffFinishCatchup();
        return;
    }

    let owed = Math.floor(_tickDebt / TICK_MS);
    if (owed <= 1 && !_hidden && !_ffAcc) {   // 即時路徑：背景／既有補跑摘要一律走下方靜音路徑
        _tickDebt -= TICK_MS;
        state.inTick = true;
        try { tick(); } finally { state.inTick = false; settleDeadMobs(); }
        flushTickRender();
        return;
    }

    // ⏩ 補跑路徑（v3.6.95 重建 v3.2.78 時間預算榨乾制）：每次呼叫最多吃 FF_BUDGET_MS 計算時間就讓步，
    //    未還完的債留待下次呼叫（每 tick 檢查時間·FF_HARD_CAP 保底防單次過量）。
    //    state.ff＝全域補跑閘（VFX/動畫/音效/日誌/逐次重繪與存檔全部受抑制）；ffSmall 保留相容但固定 false。
    if (!_ffAcc) {
        if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();
        _ffAcc = { t0: Date.now(), ticks: 0, gold: (player.gold || 0), invStart: _ffInventoryCounts() };   // ⏩ 整段補跑只在起點與終點各掃一次背包
        try { if (typeof _vfxClearAll === 'function') _vfxClearAll(); } catch (e) {}   // 補跑只保留最終收益，立即釋放尚未播完的戰鬥特效
    }
    // 長補跑先讓瀏覽器畫出進度提示再開始重運算；只做一次，不增加每批額外等待。
    if (!_hidden && !_ffAcc.progressPrimed && (_ffAcc.ticks * TICK_MS + _tickDebt) >= FF_PROGRESS_MIN_MS) {
        _ffAcc.progressPrimed = true;
        _ffProgressUpdate(_ffAcc, _tickDebt);
        _ffScheduleNext();
        return;
    }
    // 真實補跑固定每次只抵 1 tick，不抽樣放大任何收益。
    if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();   // 每批重建，隔離 8ms 讓步期間可能發生的背包操作
    state.ff = true;
    state.ffSmall = false;   // 真實補跑一律略過動畫；小補跑也只保留最終畫面與收益
    let ran = 0, budget0 = now;
    let _burstMax = owed;
    try {
        while (ran < _burstMax && ran < FF_HARD_CAP) {
            let tickError = null;
            state.inTick = true;
            try {
                tick();
            } catch (e) {
                tickError = e;
            } finally {
                state.inTick = false;
                try { settleDeadMobs(); } catch (e) { if (!tickError) tickError = e; }
                ran++;   // 無論 tick／死亡結算是否丟例外，這一個時間單位都已嘗試過，必須扣帳
            }
            if (tickError) {
                _ffErrorStreak++;
                _ffAcc.failed = true;
                try { console.error('[catchup] tick failed', tickError); } catch (e) {}
                break;
            }
            if (player.dead) break;   // 真實補跑戰敗即停止；死亡後的背景時間不得繼續產生收益
            _ffErrorStreak = 0;
            let t = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            if (t - budget0 >= FF_BUDGET_MS) break;
        }
    } finally {
        _tickDebt = Math.max(0, _tickDebt - ran * TICK_MS);
        _ffAcc.ticks += ran;
        if (_ffErrorStreak >= FF_ERROR_STREAK_MAX) {
            _tickDebt = 0;
            _ffAcc.aborted = true;
        }
        state.ff = false;
        state.ffSmall = false;
    }
    if (player.dead) _tickDebt = 0;   // 進入下方統一收尾與最終重繪，不留下死亡後的補跑債務
    if (!_hidden) _ffProgressUpdate(_ffAcc, _tickDebt);
    if (_tickDebt < TICK_MS) {   // 補跑完畢
        if (!_hidden) _ffFinishCatchup();   // 背景已追平也先保留摘要；回到前景後才重繪、存檔與顯示一次
    } else {
        _ffScheduleNext();   // 尚未還清：讓出短暫時間後立即續跑，不等待下一次 100ms 主迴圈
    }
}

function _ffFinishCatchup() {
    let _acc = _ffAcc;
    if (!_acc) { flushTickRender(); return; }
    let _longCatchup = _acc.ticks >= 30;
    let _deferredSave = typeof takeCatchupSaveRequest === 'function' && takeCatchupSaveRequest();
    try { if (typeof flushCatchupAutoSort === 'function') flushCatchupAutoSort(); } catch (e) {}
    if (_longCatchup) {   // ≥3 秒的補跑（回前景補幀）：統一刷新＋存檔＋摘要
        try { renderMobs(); updateUI(); renderTabs(true); } catch (e) {}
    } else {
        flushTickRender();
    }
    let _needsSave = _longCatchup || _deferredSave || _acc.failed;
    if (_needsSave) {
        try { saveGame(); } catch (e) {}
    }
    if (_longCatchup) {
        try {
            let _gd = (player.gold || 0) - _acc.gold;
            let _sec = Math.round(_acc.ticks / 10);
            let _dur = _sec >= 60 ? Math.floor(_sec / 60) + ' 分 ' + (_sec % 60) + ' 秒' : _sec + ' 秒';
            logSys('<span class="text-cyan-300 font-bold">⏩ 掛機補跑完成：</span>已補上 ' + _dur + ' 的進度' + (_gd > 0 ? ('，金幣 +' + _gd.toLocaleString()) : '') + '。');
            // 🎁 v3.6.86 前舊格式（用戶指示恢復）：補跑期間獲得物品彙整輸出（物品名依稀有度上色·頓號串接·只列淨正值）
            let _gains = [];
            let _invAfter = _ffInventoryCounts();
            new Set([...Object.keys(_acc.invStart || {}), ...Object.keys(_invAfter)]).forEach(id => {
                let n = (_invAfter[id] || 0) - ((_acc.invStart || {})[id] || 0);
                if (n > 0 && DB.items[id]) _gains.push({ id: id, n: n });
            });
            if (_gains.length) {
                logSys(`<span class="sys-item-gain">掛機期間獲得：` + _gains
                    .map(g => `<span class="${getItemColor({ id: g.id, en: 0 })} font-bold">${DB.items[g.id].n} ×${g.n}</span>`)
                    .join('、') + `</span>`);
            }
        } catch (e) {}
    }
    if (_acc.aborted && typeof logSys === 'function') {
        logSys('<span class="text-red-400 font-bold">補跑連續發生錯誤，已停止剩餘補跑，避免進度卡在重複補跑；請重新整理後確認。</span>');
    }
    _ffAcc = null;
    if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();
    _ffErrorStreak = 0;
    _ffProgressHide();
}
// ⏩ 每 tick 後檢查 12ms 預算，讓出 8ms 供輸入與畫面更新；收益仍逐 tick 真實結算。
const FF_BUDGET_MS = 12;
const FF_YIELD_MS = 8;
const FF_HARD_CAP = 6000;
const FF_MAX_ELAPSED_MS = 300000;
const FF_ERROR_STREAK_MAX = 3;
const FF_PROGRESS_MIN_MS = 3000;
let _ffAcc = null;   // 補跑摘要累計（跨多次 gameLoop 呼叫·還清時歸零）
let _ffErrorStreak = 0;
let _ffResumeTimer = null;
let _ffProgressEl = null;

function _ffProgressEnsure() {
    if (typeof document === 'undefined' || !document.body) return null;
    if (_ffProgressEl && _ffProgressEl.isConnected) return _ffProgressEl;
    if (!document.getElementById('ff-progress-style')) {
        let style = document.createElement('style');
        style.id = 'ff-progress-style';
        style.textContent = `
            @keyframes ffProgressSpin { to { transform: rotate(360deg); } }
            #ff-progress-indicator { position:fixed; left:50%; bottom:max(18px, env(safe-area-inset-bottom)); z-index:90; width:min(360px, calc(100vw - 28px)); transform:translate(-50%, 12px); opacity:0; pointer-events:none; transition:opacity .16s ease, transform .16s ease; padding:10px 12px; border:1px solid rgba(180,140,62,.72); border-radius:6px; color:#f5e7bd; background:rgba(20,18,24,.94); box-shadow:0 6px 22px rgba(0,0,0,.5); font-size:14px; }
            #ff-progress-indicator.is-visible { opacity:1; transform:translate(-50%, 0); }
            #ff-progress-indicator .ff-progress-head { display:flex; align-items:center; gap:9px; min-width:0; }
            #ff-progress-indicator .ff-progress-spinner { width:16px; height:16px; flex:0 0 16px; border:2px solid rgba(245,231,189,.28); border-top-color:#e5bd63; border-radius:50%; animation:ffProgressSpin .75s linear infinite; }
            #ff-progress-indicator .ff-progress-title { flex:1 1 auto; min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-weight:700; }
            #ff-progress-indicator .ff-progress-percent { flex:0 0 auto; color:#f8d477; font-variant-numeric:tabular-nums; font-weight:700; }
            #ff-progress-indicator .ff-progress-track { height:5px; margin-top:8px; overflow:hidden; border-radius:3px; background:#34303a; }
            #ff-progress-indicator .ff-progress-fill { height:100%; width:0; border-radius:inherit; background:linear-gradient(90deg, #9b6e27, #e4bd62); transition:width .12s linear; }
            @media (prefers-reduced-motion: reduce) { #ff-progress-indicator, #ff-progress-indicator .ff-progress-fill { transition:none; } #ff-progress-indicator .ff-progress-spinner { animation:none; } }
        `;
        document.head.appendChild(style);
    }
    let el = document.createElement('div');
    el.id = 'ff-progress-indicator';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = '<div class="ff-progress-head"><span class="ff-progress-spinner" aria-hidden="true"></span><span class="ff-progress-title">補跑中</span><span class="ff-progress-percent">0%</span></div><div class="ff-progress-track"><div class="ff-progress-fill"></div></div>';
    document.body.appendChild(el);
    _ffProgressEl = el;
    return el;
}

function _ffProgressDuration(ms) {
    let seconds = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
    if (seconds >= 60) return Math.floor(seconds / 60) + ' 分 ' + (seconds % 60) + ' 秒';
    return seconds + ' 秒';
}

function _ffProgressUpdate(acc, remainingMs) {
    if (!acc || typeof document === 'undefined' || document.hidden) return;
    let doneMs = Math.max(0, Number(acc.ticks) || 0) * TICK_MS;
    let remainMs = Math.max(0, Math.floor((Number(remainingMs) || 0) / TICK_MS) * TICK_MS);
    let totalMs = doneMs + remainMs;
    if (totalMs < FF_PROGRESS_MIN_MS) { _ffProgressHide(); return; }
    let el = _ffProgressEnsure();
    if (!el) return;
    let percent = remainMs < TICK_MS ? 100 : Math.max(1, Math.min(99, Math.floor(doneMs * 100 / Math.max(TICK_MS, totalMs))));
    let title = el.querySelector('.ff-progress-title');
    let pct = el.querySelector('.ff-progress-percent');
    let fill = el.querySelector('.ff-progress-fill');
    if (title) title.textContent = remainMs >= TICK_MS ? '補跑中，剩餘 ' + _ffProgressDuration(remainMs) : '補跑完成，正在整理收益';
    if (pct) pct.textContent = percent + '%';
    if (fill) fill.style.width = percent + '%';
    el.classList.add('is-visible');
}

function _ffProgressHide() {
    if (_ffProgressEl) _ffProgressEl.classList.remove('is-visible');
}

function _ffScheduleNext() {
    if (_ffResumeTimer !== null || _tickDebt < TICK_MS || !state || !state.running || !player || player.dead) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    _ffResumeTimer = setTimeout(function () {
        _ffResumeTimer = null;
        if (_tickDebt >= TICK_MS && state && state.running && player && !player.dead) gameLoop();
    }, FF_YIELD_MS);
}
function _ffCancelScheduledLoop() {
    if (_ffResumeTimer !== null) clearTimeout(_ffResumeTimer);
    _ffResumeTimer = null;
}

function resetCatchupForRoleSwitch() {
    _ffCancelScheduledLoop();
    _ffAcc = null;
    _ffErrorStreak = 0;
    if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();
    if (typeof discardCatchupAutoSort === 'function') discardCatchupAutoSort();
    _ffProgressHide();
    if (typeof state !== 'undefined' && state) {
        state.ff = false;
        state.ffSmall = false;
        state.inTick = false;
    }
}
function _ffInventoryCounts() {
    let counts = {};
    try { (player.inv || []).forEach(i => { counts[i.id] = (counts[i.id] || 0) + (Number(i.cnt) || 0); }); } catch (e) {}
    return counts;
}

// 經驗「總累積進度」（exp＋已升等級需求總和）：跨升級仍單調，前後差＝實得經驗（升級瞬間也算得對）
function _ffExpProgress() {
    let lv = Math.max(1, Math.min(100, Math.floor(Number(player.lv) || 1)));
    let total = Math.max(0, Number(player.exp) || 0);
    if (typeof getExpReq !== 'function') return total;
    for (let n = 1; n < lv; n++) { let r = Number(getExpReq(n)); if (Number.isFinite(r) && r > 0) total += r; }
    return total;
}
function _ffAllyProgress(a) {
    let lv = Math.max(1, Math.min(100, Math.floor(Number(a.lv) || 1)));
    let total = Math.max(0, Number(a.exp) || 0);
    if (typeof getExpReq !== 'function') return total;
    for (let n = 1; n < lv; n++) { let r = Number(getExpReq(n)); if (Number.isFinite(r) && r > 0) total += r; }
    return total;
}
function _ffPetProgressSum() {
    if (typeof petsOutList !== 'function' || typeof petExpReq !== 'function') return 0;
    let sum = 0;
    try {
        petsOutList().forEach(p => {
            let t = Math.max(0, Number(p.exp) || 0);
            for (let n = 1; n < (p.lv || 1); n++) { let r = Number(petExpReq(n)); if (Number.isFinite(r) && r > 0) t += r; }
            sum += t;
        });
    } catch (e) {}
    return sum;
}
// 🛡️ 絕對屏障：與世界隔絕——無法攻擊/施法/用道具、不自然恢復、不受任何傷害（持續期間 player.buffs.sk_abs_barrier>0）
function inAbsBarrier() { return !!(player.buffs && player.buffs.sk_abs_barrier > 0); }
// 🚀 重繪合併：tick 進行中(state.inTick)時 updateUI/renderMobs 只標記 dirty，於 tick 結尾 flushTickRender() 統一重繪一次，
//   避免單一 tick 內(玩家＋多傭兵＋持續傷害＋特效＋擊殺)重複重繪十數次；tick 外(點擊/裝備/用道具/開面板)維持立即重繪、體感不變。
let _uiDirty = false, _mobsDirty = false;
function updateUI() {
    if (typeof _deferItemTransactionEffect === 'function' && _deferItemTransactionEffect(updateUI, arguments)) return; if (state.inTick || (typeof catchupActive === 'function' && catchupActive())) { _uiDirty = true; return; } _uiDirty = false; _updateUIImpl(); }
function renderMobs() { if (state.inTick || (typeof catchupActive === 'function' && catchupActive())) { _mobsDirty = true; return; } _mobsDirty = false; _renderMobsImpl(); }
function flushTickRender() { if (typeof catchupActive === 'function' && catchupActive()) return; if (_uiDirty) { _uiDirty = false; _updateUIImpl(); } if (_mobsDirty) { _mobsDirty = false; _renderMobsImpl(); } }
// 🚀 怪物卡互動穩定：① 滑鼠所在怪的 uid 以 JS 追蹤(_hoverMobUid)、每次重繪都重新套用「顯示名字」class→避免重繪(每 tick 換掉 #mob-list 內容)使 :hover 瞬間失效造成名字一直閃；② 按住怪物卡期間(_mobPointerDown)延後重繪→避免 mousedown↔mouseup 之間整列被換掉使點擊切換目標失效。
let _hoverMobUid = null, _mobPointerDown = false, _mobRebuildPending = false;
function _applyHoverName() {   // 依 _hoverMobUid 即時切換各卡名字顯示(不整列重繪)
    let ml = document.getElementById('mob-list'); if (!ml) return;
    ml.querySelectorAll('.mob-target').forEach(c => c.classList.toggle('name-show', !!_hoverMobUid && c.getAttribute('data-uid') === _hoverMobUid));
}
function _initMobListGuard() {   // 在 #mob-list(穩定父節點·只換其 innerHTML)上掛委派事件，跨重繪存活
    let ml = document.getElementById('mob-list'); if (!ml || ml._guardInit) return;
    ml._guardInit = true;
    ml.addEventListener('pointerdown', () => { _mobPointerDown = true; });
    ml.addEventListener('mouseover', e => {   // 只有滑到「怪物圖片區」才顯示名字(圖 pointer-events:none→事件落在 .mob-img-inner)
        let inImg = e.target.closest && e.target.closest('.mob-img-wrap');
        let card = e.target.closest && e.target.closest('.mob-target');
        let uid = (card && inImg) ? card.getAttribute('data-uid') : null;
        if (uid !== _hoverMobUid) { _hoverMobUid = uid; _applyHoverName(); }
    });
    ml.addEventListener('mouseleave', () => { if (_hoverMobUid !== null) { _hoverMobUid = null; _applyHoverName(); } });   // 真正離開整個怪物列才清(不受內部重繪影響)
    ml.addEventListener('click', e => {   // 🖱️ v2.6.46 點擊怪物卡＝手動指定攻擊目標(依 uid 找 index·僅活怪)。setTarget 後 getTarget 只在該目標死亡/消失才自動改鎖→手動鎖定會維持到目標死亡。委派於穩定父節點·跨重繪存活。
        let card = e.target.closest && e.target.closest('.mob-target');
        if (!card) return;
        let uid = card.getAttribute('data-uid');
        if (!uid) return;   // 空格(無 data-uid·pointer-events:none)→略過
        let idx = mapState.mobs.findIndex(m => m && String(m.uid) === String(uid) && !m._dead);
        if (idx >= 0 && idx !== mapState.targetIdx) setTarget(idx);
    });
    let release = () => { if (!_mobPointerDown) return; _mobPointerDown = false; if (_mobRebuildPending) { _mobRebuildPending = false; setTimeout(() => _renderMobsImpl(), 0); } };   // 放開後(讓 click→setTarget 先在存活節點上觸發)再補一次重繪
    document.addEventListener('pointerup', release);
    document.addEventListener('pointercancel', release);
}
// 玩家一般攻擊間隔保留小數 tick，避免 0.19 秒被向下取整成 0.1 秒。
// 0.1 秒主迴圈仍維持每 tick 最多攻擊一次，因此技術上限為 600 次／分鐘。
function playerAttackIntervalTicks(includeTemporarySlow) {
    let aspd = (player && player.d) ? Number(player.d.aspd) : 0.1;
    if (!Number.isFinite(aspd) || aspd <= 0) aspd = 0.1;
    let ticks = Math.max(1, aspd * 10);
    if (includeTemporarySlow !== false && player.statuses && player.statuses.slowAtk > 0) ticks *= 2;
    return ticks;
}
// ⚔️ v3.5.100 副手攻擊間隔（tick）：與主手同公式，只是讀 d.aspdOff（js/02 以「副手/主手 基礎間隔比」推導）。
//   回傳 0＝沒有可用副手 → 呼叫端不跑副手計時器。
function playerOffhandIntervalTicks(includeTemporarySlow) {
    if (!player || !player.eq || !player.eq.offwpn) return 0;
    let aspd = (player.d) ? Number(player.d.aspdOff) : 0;
    if (!Number.isFinite(aspd) || aspd <= 0) return 0;
    let ticks = Math.max(1, aspd * 10);
    if (includeTemporarySlow !== false && player.statuses && player.statuses.slowAtk > 0) ticks *= 2;   // 寒冰吐息等減速：兩手同步吃
    return ticks;
}
// ⚔️ 天堂職業硬直：玩家被「直接命中」（物理/魔法·非 DoT）時，延遲下次一般攻擊 d.hitstun 個 tick。每個攻擊週期最多硬直一次（不無限疊加·避免被群毆時完全鎖死）。
function applyPlayerHitstun() {
    if (!state || state._pStunCycle || player.dead) return;
    let hs = (player.d && player.d.hitstun) || 0;
    if (hs <= 0) return;
    state.pDmgTick = (state.pDmgTick || 0) - hs;   // 攻擊累加器倒退 → 下次攻擊延後 hs tick
    state._pStunCycle = true;
}
function tick() {
    if(!state.running || player.dead) return;
    state.ticks++;
    // 🪄 吉爾塔斯魔杖：擊殺增益到期即重算，避免額外魔法點數停留在衍生能力中。
    // 🏺 v3.7.52 同型到期重算：_golemMrDebuffUntil（高崙印記 MR-100）／_fangFuryUntil（邪惡利牙攻速+30%）／_spellbladeUntil（魔劍士之刀施法增益）
    let _giltasWandExpired = [];
    let _tickExpireFields = ['_giltasWandFuryUntil', '_golemMrDebuffUntil', '_fangFuryUntil', '_spellbladeUntil', '_eyePetrifyUntil'];   // 🐉 v3.7.57 +地龍之魔眼增益到期
    _tickExpireFields.forEach(f => {
        if (player[f] && state.ticks >= player[f]) { player[f] = 0; if (!_giltasWandExpired.includes(player)) _giltasWandExpired.push(player); }
        if (player.allies && player.allies.length) player.allies.forEach(a => { if (a && a[f] && state.ticks >= a[f]) { a[f] = 0; if (!_giltasWandExpired.includes(a)) _giltasWandExpired.push(a); } });
    });
    if (_giltasWandExpired.length) {
        if (_giltasWandExpired.includes(player)) calcStats();
        _giltasWandExpired.forEach(a => { if (a !== player && typeof _allyLevelRecompute === 'function') _allyLevelRecompute(a); });
    }
    _combatSrc = null;   // ⚔️ 戰鬥日誌來源：每 tick 起始重置（玩家攻擊/施法/DoT 等預設依顏色type推定；友方派發點會各自設定）
    _dpsAllyTurn = false; let _dpsPlayerSnap = _dpsSnap();   // 🎯 DPS：玩家階段起點快照（至怪物行動前的所有掉血＝玩家輸出·含自動施法/持續增益）
    for(let k in player.manualCd) if(player.manualCd[k] > 0) player.manualCd[k]--;
    
    let canAct = true;
    for(let k in player.statuses) {
        if (player.statuses[k] > 0 && k !== 'poisonDmg' && k !== 'poisonTick' && k !== 'burnDmg' && k !== 'burnTick' && k !== 'scaldDmg' && k !== 'scaldTick' && k !== 'bleedDmg' && k !== 'bleedTick' && k !== 'armorBreakPct') {   // 😤 v3.6.20 armorBreakPct＝伴隨值（%數）非時長，不遞減
            player.statuses[k]--;
            if(k === 'cleave' && player.statuses.cleave === 0) calcStats();   // 🔧 切割到期：重算攻速
            if(k === 'evilAura' && player.statuses.evilAura === 0) calcStats();   // 🔧 邪靈之氣到期：還原 AC/ER
            if(k === 'stun' || k === 'freeze' || k === 'stone' || k === 'paralyze' || k === 'sleep') canAct = false;
        }
    }
    if (inAbsBarrier()) canAct = false;   // 🛡️ 絕對屏障：無法攻擊/施法/自動行動

    if (!inAbsBarrier()) {   // 🛡️ 絕對屏障：不自然恢復 HP/MP
        let _hpIv = Math.max(30, 160 - 10 * ((player.d && player.d.hpRegenFaster) || 0));   // 🏺 巨魔的再生戒指：HP 自然恢復間隔縮短（每 1 秒=10 tick·下限 3 秒）
        if (player.buffs && (player.buffs.sk_heal_energy_storm || 0) > 0) _hpIv = Math.min(_hpIv, (DB.skills.sk_heal_energy_storm && DB.skills.sk_heal_energy_storm.hpRegenIv) || 30);   // 🌀 治癒能量風暴：維持中 HP 自然恢復間隔固定 3 秒（取更快者·MP 不受影響）
        let _mpIv = wisMpRegenIntervalTicks((player.d && player.d.wis) || 0);
        let _hpDue = (state.ticks % _hpIv === 0), _mpDue = (state.ticks % _mpIv === 0);
        if (_hpDue) _regenHP();
        if (_mpDue) _regenMP();
        if ((_hpDue || _mpDue) && typeof updateUI === 'function') updateUI();
    }
    if (state.ticks % 50 === 0 && player._hardSkinPool != null && player._hardSkinPool < 20) player._hardSkinPool++;   // 🏺 v3.6.44 守護獸的難題：硬皮池每 5 秒恢復 1（上限 20·初始 30 可超過上限不再回）
    if (player._crushFuryUntil && state.ticks >= player._crushFuryUntil) { player._crushFuryUntil = 0; calcStats(); }   // 🔨 v3.6.47 粉碎鎚即死攻速buff到期：清除並重算攻速（比照切割到期）
    if (state.ticks % 10 === 0) {
        siegeTick();   // 攻城戰：每秒檢查時限
        pvpPostKillWhisperTick();   // PVP：擊敗玩家後的一小時限時密語
    }
    if (state.ticks % 100 === 0) { try { refreshPandoraMarket(false); } catch (e) {} }   // 🔧 潘朵拉黑市：每 10 秒檢查是否到 10 分鐘換商品（含稀有公告）
    if (state._junkSellAt == null) state._junkSellAt = state.ticks + JUNK_AUTOSELL_TICKS;   // 🗑️ 自動賣廢品倒數：預設 10 秒（JUNK_AUTOSELL_TICKS）
    if (state.ticks >= state._junkSellAt) { try { if (typeof autoSellJunk === 'function' && (!player || player.autoSellOn !== false)) autoSellJunk(); } catch (e) {} state._junkSellAt = state.ticks + JUNK_AUTOSELL_TICKS; }   // 🗑️ 倒數到→若「自動賣出」開啟(player.autoSellOn!==false·預設開)則賣出標示為廢品的物品並重新排程 10 秒；停止賣出時只重排程不賣。玩家手動標示廢品會把此時間往後推 10 秒（_bumpJunkSellTimer）。⚠️自動路徑 autoSellJunk() 不 saveGame（效能·靠其他存檔點落地）
    
    if(player.statuses.poison > 0 && state.ticks % player.statuses.poisonTick === 0 && !inAbsBarrier()) {
        let _pdmg = player.statuses.poisonDmg;
        if (player.buffs && player.buffs.sk_dark_poisonres > 0) _pdmg = Math.max(1, Math.floor(_pdmg / 2));   // 🔧 毒性抵抗：中毒傷害減半
        if (player.d && player.d.poisonHealMult > 0) {
            // 🏺 遺物 毒液化身：受到毒性 DoT 時恢復所受傷害×倍率的 HP（先受傷再治癒·淨效果為回血·倍率>1 不可能致死）
            let _pheal = Math.max(1, Math.floor(_pdmg * player.d.poisonHealMult));
            player.hp = Math.min(player.mhp, player.hp - _pdmg + _pheal);
            logCombat(`毒液化身汲取毒素：受到劇毒傷害 ${_pdmg} 點，恢復 ${_pheal} 點HP。`, 'player');
            updateUI();
        } else {
            player.hp -= _pdmg;
            if (typeof dotMpRefundTo === 'function') dotMpRefundTo(player, _pdmg);   // 🏺 v3.7.52 受困幽魂的淚滴：DoT 損血回 MP
            logCombat(`你受到劇毒傷害 ${_pdmg} 點。`, 'enemy');
            if(player.hp <= 0) { killPlayer(); return; }
            updateUI();
        }
    }
    if(player.statuses.burn > 0 && state.ticks % player.statuses.burnTick === 0 && !inAbsBarrier()) {
        player.hp -= player.statuses.burnDmg;
        if (typeof dotMpRefundTo === 'function') dotMpRefundTo(player, player.statuses.burnDmg);   // 🏺 v3.7.52 淚滴
        logCombat(`你受到灼燒傷害 ${player.statuses.burnDmg} 點。`, 'enemy');
        if(player.hp <= 0) { killPlayer(); return; }
        updateUI();
    }
    if(player.statuses.scald > 0 && state.ticks % player.statuses.scaldTick === 0 && !inAbsBarrier()) {
        player.hp -= player.statuses.scaldDmg;
        if (typeof dotMpRefundTo === 'function') dotMpRefundTo(player, player.statuses.scaldDmg);   // 🏺 v3.7.52 淚滴
        logCombat(`你受到燙傷傷害 ${player.statuses.scaldDmg} 點。`, 'enemy');
        if(player.hp <= 0) { killPlayer(); return; }
        updateUI();
    }
    if(player.statuses.bleed > 0 && state.ticks % player.statuses.bleedTick === 0 && !inAbsBarrier()) {
        player.hp -= player.statuses.bleedDmg;
        if (typeof dotMpRefundTo === 'function') dotMpRefundTo(player, player.statuses.bleedDmg);   // 🏺 v3.7.52 淚滴
        logCombat(`你受到出血傷害 ${player.statuses.bleedDmg} 點。`, 'enemy');
        if(player.hp <= 0) { killPlayer(); return; }
        updateUI();
    }

    // 🌨️🔥 持續傷害型增益（冰雪颶風/火牢…）：各自間隔（stormInterval ticks）到時對全體敵人造成傷害
    if (player.buffs) for (let _ssid of STORM_BUFF_SKILLS) { let _ssk = DB.skills[_ssid]; if (player.buffs[_ssid] > 0 && _ssk && state.ticks % (_ssk.stormInterval || 40) === 0) stormBuffTick(_ssk); }

    let alerts = [];
    if(player.statuses.stun > 0) alerts.push("暈眩中");
    if(player.statuses.freeze > 0) alerts.push("冰凍中");
    if(player.statuses.stone > 0) alerts.push("石化中");
    if(player.statuses.paralyze > 0) alerts.push("麻痺中");
    if(player.statuses.bind > 0) alerts.push(isRangedArmed(player) ? "束縛中（遠距離不受影響）" : "束縛中（無法一般攻擊）");   // 🕸️ v3.7.75 束縛
    if(player.statuses.silence > 0) alerts.push("沉默中");
    if(player.statuses.magicseal > 0) alerts.push("魔法封印中");
    if(player.statuses.poison > 0) alerts.push("中毒");
    if(player.statuses.burn > 0) alerts.push("灼燒");
    if(player.statuses.scald > 0) alerts.push("燙傷");
    if(player.statuses.bleed > 0) alerts.push("出血");
    if(player.statuses.sleep > 0) alerts.push("沉睡中");
    if(player.statuses.weaken > 0) alerts.push("弱化");
    if(player.statuses.disease > 0) alerts.push("疾病");
    if(player.statuses.blind > 0) alerts.push("目盲");
    if(player.statuses.potionFrost > 0) alerts.push("藥水霜化");
    if(player.statuses.foulWater > 0) alerts.push("汙濁之水");   // 🌊 v3.6.20 玩家NPC二模板（妖精）：受到治癒效果減半
    if(!state.ff) {
        document.getElementById('status-alerts').innerText = alerts.length > 0 ? "[" + alerts.join(", ") + "]" : "";
        document.getElementById('status-alerts').className = alerts.length > 0 ? "text-red-400 text-sm font-bold anim-flash" : "text-sm font-normal";
        renderStatusEffects(); // 每個 tick 即時刷新「狀態」欄的增益/減益顯示
    }
    
    // 法術自動施放冷卻：以 tick(0.1秒) 遞減；間隔統一由職業／變身 cast 決定，不讀攻擊速度
    if(player.cds.atkSk > 0) player.cds.atkSk--;
    if(player.cds.healSk > 0) player.cds.healSk--;
    if(player.cds.healSkillCds) for (let _hk in player.cds.healSkillCds) { if (player.cds.healSkillCds[_hk] > 0) player.cds.healSkillCds[_hk]--; }
    if((player.cds.purifySk || 0) > 0) player.cds.purifySk--;   // 🔧 淨化技獨立冷卻
    if((player.cds.convertSk || 0) > 0) player.cds.convertSk--;   // 🔄 轉換技獨立冷卻（與攻擊／治癒共用相同施法速度公式）
    if((player.cds.castLock || 0) > 0) player.cds.castLock--;   // 🔮 天堂職業施法冷卻下限（法師快·王族/黑妖慢）·autoCastSpells 依此節流攻擊魔法
    if(canAct) autoCastSpells();   // 每 tick 嘗試自動施法，實際間隔由上方冷卻控制

    if(state.ticks % 10 === 0) {
        if(player.cds.pot > 0) player.cds.pot--;   // 藥水冷卻維持每秒遞減
        if(player.reviveScrollCd > 0) player.reviveScrollCd--;   // 復活卷軸冷卻：僅存活時倒數（此區塊死亡時不執行）
        if(player.magicShieldCd > 0) player.magicShieldCd--;     // 魔法屏障抵擋後冷卻：僅存活時倒數
        // 🔧 架構統一：所有 buff（以秒計）的「唯一」遞減點，每秒扣 1。
        // 原於 regenTick 每 160 tick 批次扣 16，到期誤差可達 0~16 秒（如 16 秒的魔法屏障可能瞬間過期）；
        // taming 原本另有專屬遞減，一併整合於此。
        let _buffEnded = false;
        for(let k in player.buffs) {
            if(player.buffs[k] > 0) {
                player.buffs[k]--;
                if(player.buffs[k] <= 0) {
                    player.buffs[k] = 0;
                    _buffEnded = true;
                    let buffName = DB.skills[k] ? DB.skills[k].n
                        : ((typeof PET_LURES !== 'undefined' && PET_LURES[k]) ? PET_LURES[k].n : (BUFF_NAMES[k] || k));
                    logSys(`狀態 [${buffName}] 結束了。`);
                }
            }
        }
        if(player._waterVitalCd > 0) player._waterVitalCd--;   // 🔧 水之元氣：觸發後 7 秒冷卻（每秒遞減）
        if(_buffEnded) calcStats();   // 到期重算（變身還原、技能加成移除等）
        if(canAct) autoActions();   // 🆕 v2.6.28 硬控中(石化/冰凍/暈眩/麻痺/沉睡)不再自救淨化；改由自由隊員(玩家/傭兵)幫全隊解除（team dispel）
    }

    // === 出怪判定：以邏輯 tick (state.ticks) 為準，與主迴圈時間補跑同步 ===
    // mapState.spawnAt[i] = 該格子預定出怪的 tick 值；為 null 代表該格目前有怪、無需排程。
    {
        let isPureBossMap = PURE_BOSS_MAPS.includes(mapState.current) && !KING_ROOMS[mapState.current];   // 🔧 軍王之室仍屬純BOSS房(免自動瞬移/追蹤)，但四軍王房改用五格
        if(!mapState.spawnAt) mapState.spawnAt = [null, null, null, null, null];
        let nowT = state.ticks;
        if(KING_ROOMS[mapState.current] && state._kbRespawnAt != null) {
            // 🔧 軍王之室復活等待中：5 秒內不刷任何怪；時間到則消耗 1 把鑰匙、從頭重生軍王與兩側小怪（背景/離線補跑期間也照常復活）
            if(nowT >= state._kbRespawnAt) { state._kbRespawnAt = null; kbRoomRespawn(); }
        } else if(KING_ROOMS[mapState.current] && KING_ROOMS[mapState.current].dual) {
            // 🏛️ 雙BOSS祭壇：不逐格自動補怪（初次生成於 changeMap；單隻陣亡不補）。防呆：兩隻皆亡卻未標記全滅 → 補標，交由 settleDeadMobs 啟動 5 秒同時復活
            if(state._kbVictory !== true && !mapState.mobs.some(m => m && m.boss)) state._kbVictory = true;
        } else {
            let slotCount = backSlotsActive() ? 5 : 3;                          // 🆕 一般狩獵／攻城／時空裂痕／四軍王房開放後排兩格(3,4)→最多 5 隻
            for(let i=0; i<slotCount; i++) {
                if(mapState.mobs[i]) { mapState.spawnAt[i] = null; continue; } // 有怪：清除排程
                if(isPureBossMap && i !== 1) continue;                          // 純 BOSS 房只生中央
                let delay;
                if(isPureBossMap) {
                    delay = 50;                                                 // 🔧 純BOSS房(三龍窟)：BOSS死亡後固定 5 秒(50 tick)才刷新，不受日光術/席琳的世界加速影響（2026-06 用戶調整 3 分鐘→5 秒）
                } else if(KING_ROOMS[mapState.current]) {
                    delay = 50;                                                 // 🔧 軍王之室：固定 5 秒復活，不受日光術/席琳的世界加速影響
                } else if(mapState.current === 'antharas_lair') {
                    delay = 50;                                                 // 🐉 v3.7.57 侵蝕的安塔瑞斯棲息地（BOSS房）：固定 5 秒重生
                } else {
                    // 🐾 重生延遲＝基準 50 tick(5秒) × 玩家有效移動延遲倍率。
                    // 變身(wlk·16=100%)、加速、勇敢／餅乾、行走加速、裝備移速與資訊面板共用 playerMoveDelayMultiplier()。
                    // ⚡ v3.4.26 日光術／席琳的世界由「固定 −1 秒(−10 tick)」改為【乘算 ×0.8】（用戶要求）：
                    //    基準 5 秒下 ×0.8＝4 秒（與舊制 −1 秒等值·手感不變）；但在已被加速到很快時只按比例縮短，
                    //    不再像減法那樣把結果打成負數 → 舊制可觸底 0.1 秒(1 tick)＝怪一死立刻補位，已修正。
                    //    全項目相乘故所有加速一律「按比例」疊加；下限 5 tick＝0.5 秒（全加成極限約 6 tick／0.6 秒，此 clamp 為安全底線）。
                    let _mv = playerMoveDelayMultiplier();
                    if (player.buffs.sk_sunlight > 0) _mv *= 0.8;                     // ☀️ v3.4.26 日光術：重生延遲 ×0.8（原「固定 −1 秒」→乘算）
                    if (sherineWorldActive() && !isSiegeArea(mapState.current)) _mv *= 0.8;   // 🔮 v3.4.26 席琳的世界：重生延遲 ×0.8（與日光術相乘疊加）
                    delay = Math.max(5, Math.round(50 * _mv));                       // 🚧 下限 5 tick＝0.5 秒
                    if (isSiegeArea(mapState.current) && typeof npcClanSiegeRespawnMultiplier === 'function') {
                        delay = Math.max(1, Math.round(delay * npcClanSiegeRespawnMultiplier()));
                    }
                }
                if(mapState.spawnAt[i] == null) mapState.spawnAt[i] = nowT + delay; // 空格剛出現：排程 delay 後（一般／純BOSS房／軍王之室皆 5 秒）
                if(nowT >= mapState.spawnAt[i]) {
                    // 🌑 v3.4.18 聖地/崩壞廳 BOSS 復活收費：首次生成免費（入場費已付），之後每次復活扣 1 入場道具；沒道具→傳送出去、停止本輪出怪
                    if(isPureBossMap && i === 1 && typeof SANCT_RESPAWN_COST !== 'undefined' && SANCT_RESPAWN_COST[mapState.current]) {
                        if(mapState._sanctBossSpawned) { if(!sanctBossRespawnCharge()) { mapState.spawnAt[i] = null; break; } }   // 復活：扣道具/無道具傳送出去
                        else mapState._sanctBossSpawned = true;                                                                   // 首次生成免費
                    }
                    spawnMob(i); mapState.spawnAt[i] = null;
                }
            }
        }
    }
    
    // 🔧 slowAtk / cleave 的遞減已由上方 statuses 通用迴圈處理（先前此處第二次遞減導致持續時間減半：寒冰吐息 8 秒變 4 秒、切割 2 秒變 1 秒）
    if(canAct) {
        let aspdTicks = playerAttackIntervalTicks(true);
        let attackProgress = Number(state.pDmgTick);
        if (!Number.isFinite(attackProgress)) attackProgress = 0;
        let previousInterval = Number(state._pAtkIntervalTicks);
        // 攻速在週期中變更時保留已完成的比例；受擊硬直造成的負進度仍維持固定 tick 延遲。
        if (attackProgress > 0 && Number.isFinite(previousInterval) && previousInterval > 0 && previousInterval !== aspdTicks) {
            attackProgress = Math.min(1, attackProgress / previousInterval) * aspdTicks;
        }
        state._pAtkIntervalTicks = aspdTicks;
        state.pDmgTick = attackProgress + 1;
        if(state.pDmgTick >= aspdTicks) {
            if (!bindSelfBlocked(player)) playerAttack();   // 🕸️ v3.7.75 束縛：非遠距離武器時打不出一般攻擊（攻擊節奏照跑·施法/技能不受影響）
            state.pDmgTick = Math.max(0, state.pDmgTick - aspdTicks);   // 保留小數餘額，長期平均攻速才正確
            state._pStunCycle = false;   // ⚔️ 硬直：每次攻擊後重置「本週期已硬直」旗標（下週期被擊可再延遲一次）
        }

        // ⚔️ v3.5.100 迅猛雙斧副手：獨立計時器（不再掛在主手攻擊後面·js/04 的 piggyback 已移除）。
        //   與主手同一套「保留已完成比例＋小數餘額」寫法，兩手因此各自跑自己的節奏、可不同步。
        let offTicks = playerOffhandIntervalTicks(true);
        if (offTicks > 0) {
            let offProgress = Number(state.pOffDmgTick);
            if (!Number.isFinite(offProgress)) offProgress = 0;
            let prevOff = Number(state._pOffAtkIntervalTicks);
            if (offProgress > 0 && Number.isFinite(prevOff) && prevOff > 0 && prevOff !== offTicks) {
                offProgress = Math.min(1, offProgress / prevOff) * offTicks;   // 換武器/加速變動時保留進度比例
            }
            state._pOffAtkIntervalTicks = offTicks;
            state.pOffDmgTick = offProgress + 1;
            if (state.pOffDmgTick >= offTicks) {
                let _ot = getTarget();   // 副手自行取目標（不依賴主手這一拍有沒有攻擊）
                if (_ot && !bindSelfBlocked(player)) dualWieldOffhandAttack(_ot);   // 🕸️ v3.7.75 束縛：副手必為近戰→被束縛時同樣打不出去
                state.pOffDmgTick = Math.max(0, state.pOffDmgTick - offTicks);
            }
        } else { state.pOffDmgTick = 0; state._pOffAtkIntervalTicks = 0; }   // 卸下副手：歸零，避免下次裝上時瞬間觸發
    }
    
    { let _pd = _dpsDealt(_dpsPlayerSnap); if (_pd > 0) _dps.player += _pd; }   // 🎯 DPS：結算玩家階段輸出（攻擊／自動施法／持續增益）；怪物中毒/出血 DoT 於 processMobStatusTick 另計入玩家
    if (typeof threatCommitDiff === 'function') threatCommitDiff(_dpsPlayerSnap, player);   // 🎯 v3.7.97 仇恨制：玩家階段整段掉血→記給玩家（threatMult＝職業×武器·同快照差分）
    for(let i=0; i<mapState.mobs.length; i++) {   // 🆕 含後排(3,4)：所有在場怪皆會行動攻擊
        let m = mapState.mobs[i];
        if(!m) continue;
        if(m._hasteTicks > 0) { m._hasteTicks--; if(m._hasteTicks <= 0 && m._baseAtkSpd !== undefined) { m.atkSpd = m._baseAtkSpd; m._baseAtkSpd = undefined; } }  // 自我加速到期恢復

        // --- 新增：被動怪物滿血時不主動攻擊 ---
        if (m.beh === '被動' && m.curHp === m.hp) continue;

        // --- 新增：處理被動怪物的 3 秒延遲 (30 ticks) ---
        if (m._delayTicks > 0) {
            m._delayTicks--;
            continue; // 延遲期間不扣減冷卻，跳過此回合行動
        }

        // 🌅 三段變身頭目（玉藻→九尾→殺生石）：HP 低於門檻即強制變身、原槽位換下一階滿血（被一擊打到 0 的情況由 killMob 頂端攔截·js/05 doMobTransform）
        if (m.transformTo && m.curHp > 0 && !m._dead && m.curHp < m.hp * (m.transformHpPct || 0.5)) { doMobTransform(i); continue; }

        // --- 異常狀態處理（倒數、中毒 DoT），死亡則跳過 ---
        if (processMobStatusTick(m, i)) continue;
        // 👑 戰鬥頭目：每 5 秒恢復 HP；近 5 秒曾被物理命中回 0.5%，否則回 2.5%。
        if (m.boss && !m.siegeEnemy && m.race !== '建築' && state.ticks % 50 === 0 && m.curHp > 0 && m.curHp < m.hp) {
            let recentPhysicalHit = m._lastPhysicalHitTick != null && state.ticks - m._lastPhysicalHitTick <= 50;
            let regenPct = recentPhysicalHit ? 0.005 : 0.025;
            if (m.st && (m.st.muddywater || 0) > 0) regenPct *= 0.5;   // 🌊 污濁之水：狀態維持中頭目 HP 自然恢復量減半
            m.curHp = Math.min(m.hp, m.curHp + Math.max(1, Math.floor(m.hp * regenPct)));
            if (!state.ff) renderMobs();
        }
        // 常駐被動：HP 未滿 100% 時回復（依等級 15 / 40），不受異常狀態影響；間隔由 regenEvery 決定(預設10 ticks=每1秒)
        if (m.regenHp && state.ticks % (m.regenEvery || 10) === 0 && m.curHp > 0 && m.curHp < m.hp) {
            m.curHp = Math.min(m.hp, m.curHp + m.regenHp);
            if (!state.ff) renderMobs();
        }
        // 🔧 硬皮再生：每 10 秒(100 ticks)恢復 3% 最大硬皮值
        if (m.hardSkinMax > 0 && state.ticks % 100 === 0 && m.hardSkin < m.hardSkinMax) {
            m.hardSkin = Math.min(m.hardSkinMax, m.hardSkin + Math.max(1, Math.ceil(m.hardSkinMax * 0.03)));
        }
        // --- 冰凍 / 暈眩 / 石化 / 沉睡：無法行動 ---
        if (mobActDisabled(m)) continue;
        
        // --- 隱身術 / 隱身斗篷：非BOSS且滿血的怪物停止行動 (一旦受傷就會反擊) ---
        if(!m.boss && isInvisible() && m.curHp === m.hp) continue;
        
        // 👇 新增這行：無所遁形術限定「史巴托」滿血時停止行動 ---
        if(m.n === "史巴托" && (player.buffs.sk_reveal > 0 || player.buffs.sk_helm_str2 > 0) && m.curHp === m.hp) continue;

        // 野外＋血盟：傳送術（HP<20% 時，戰鬥中每 3 秒判定一次，10% 機率直接脫離戰鬥消失；不視為擊殺，玩家無經驗/金錢/掉落）
        if (m.wild && m.race === '血盟' && m.curHp > 0) {
            if (m.curHp < m.hp * 0.2) {
                if (m._tpCd === undefined) m._tpCd = 30;
                if (--m._tpCd <= 0) {
                    m._tpCd = 30;
                    if (Math.random() < 0.1) {
                        logCombat(`<span class="${getMobColor(m.lv)}">${m.n}</span> 施放 傳送術，脫離了戰鬥（未被擊殺，你沒有獲得經驗值、金錢與掉落物）。`, 'enemy');
                        mapState.mobs[i] = null;
                        if (mapState.spawnAt) mapState.spawnAt[i] = null;   // 該格交由出怪排程重生
                        if (mapState.targetIdx === i) mapState.targetIdx = -1;
                        if (!state.ff) renderMobs();
                        continue;
                    }
                }
            } else {
                m._tpCd = 30;   // HP 回到 20% 以上：重置判定計時
            }
        }

        // 🏰 v3.1.79 稽核修 noAttack（攻城塔/城門/藏寶箱）：不攻擊也不施法（原欄位無消費點→被打醒後會以 dmg[0,0]→1D1 戳 1 點）；置於狀態/回復處理之後、攻擊排程之前
        if (m.noAttack) continue;
        if(m._atkCd === undefined) m._atkCd = Math.max(1, Math.floor(m.atkSpd * 10));
        m._atkCd--;
        // ... (下方保留原有的怪物攻擊與魔法邏輯)

        let slowAdd = (m.st && m.st.slow > 0) ? 10 : 0; // 緩速：攻擊間隔 +1 秒
        if(m._atkCd <= 0) {
            _dpsReactWrap(() => enemyAttackChooseVictim(m, i));   // 🤝 Phase 3：一般物理攻擊可能改打非倒地傭兵（加權隨機）；魔法/狀態仍只打玩家；🎯 DPS：受擊反應(反擊/居合/反射/荊棘/爆彈/受傷施法)歸玩家，傭兵反應由 _allyDamageMob/_dpsAllyReact 扣除
            m._atkCd = Math.max(1, Math.floor(m.atkSpd * 10)) + slowAdd;
            m._bluntDelayed = false;   // 攻擊後重置鈍擊延遲標記，下一週期可再被延遲一次
        }

        if(player.dead) break;
        if(m.curHp <= 0) continue;   // 反擊使該怪在自己回合內死亡 → 跳過後續魔法施放
        if(m.st && (m.st.vacuum > 0 || m.st.magicseal > 0)) continue; // 真空 / 魔法封印：無法施放技能
        if(!m._magCd) m._magCd = {};
        // 🔮 v3.7.16 決鬥法師對手：先問 js/28「本 tick 已就緒的法術中傷害最高的是哪一招」→ 那一招必放且先放。
        //   ⚠️ 只有 `_pvpDuelFoe` 且職業為法師會拿到非 null，其餘怪物 _magBest 恆 null＝完全照舊。
        let _magBest = (m._pvpDuelFoe && typeof pvpDuelBestSpellKey === 'function') ? pvpDuelBestSpellKey(m) : null;
        let _magKeys = ['mag','mag2','mag3','mag4','mag5'];
        if (_magBest) _magKeys = [_magBest].concat(_magKeys.filter(k => k !== _magBest));   // 最高傷害排最前（玩家若被這招打死，後面的就不用放了）
        _dpsReactWrap(() => _magKeys.forEach(mk => {   // 🌑 v3.3.33 mag4：吉爾塔斯第四技（血壁空間）；😤 v3.6.20 mag5：二模板法師第五技（究極光裂術）；🎯 DPS：怪物施法引發的玩家受擊反應（鏡反射等）歸玩家
            if(!m[mk]) return;
            if(m[mk].reqAlign != null && pvpClampAlignment(m._pvpAlignment || 0) < m[mk].reqAlign) return;   // ⚖️ v3.6.20 性向門檻技（究極光裂術≥500）：未達＝視同沒有此技（不進冷卻）
            // 檢查發動機率
            if(m[mk].chance !== undefined) {
                 if(m._magCd[mk] === undefined) m._magCd[mk] = m[mk].cd;
                 m._magCd[mk]--;
                 if(m._magCd[mk] <= 0) {
                     m._magCd[mk] = m[mk].cd;
                     if(mk === _magBest || Math.random() <= m[mk].chance) {   // 🔮 v3.7.16 決鬥法師的「本輪最高傷害法術」跳過發動機率＝必放（其餘技能照原機率）
                         if(!player.dead) castMobMagic(m, m[mk]);   // 🤝 Phase4：攻擊型魔法可依全體名單/仇恨權重打玩家或傭兵
                     }
                 }
            } else {
                 if(m._magCd[mk] === undefined) m._magCd[mk] = m[mk].cd;
                 m._magCd[mk]--;
                 if(m._magCd[mk] <= 0) {
                     m._magCd[mk] = m[mk].cd;
                     if(!player.dead) castMobMagic(m, m[mk]);   // 🤝 Phase4：攻擊型魔法可依全體名單/仇恨權重打玩家或傭兵
                 }
            }
        }));
        if(player.dead) break;
    }

    if(!player.dead) { let _auraSnap = _dpsSnap(); try { relicAuraTick(); } catch(e){} let _auraDealt = _dpsDealt(_auraSnap); if(_auraDealt > 0) _dps.player += _auraDealt; }   // 🏺 蠅災的詛咒等 auraDmg：玩家階段週期全體固定魔傷（自帶快照→正確計入玩家 DPS·修 code-review#1）
    if(!player.dead) { _combatSrc = 'summon'; let _dpsSumSnap = _dpsSnap(); summonTick(player.summon, () => { player.summon = null; }); summonTick(player.charmed, () => { player.charmed = null; }); if (typeof summonV2Tick === 'function') { try { summonV2Tick(); } catch (e) {} }   /* 🧙 v3.2.19 召喚術 v2（多實體·js/23） */ if (typeof castleGuardTick === 'function') { try { castleGuardTick(); } catch (e) {} }   /* 🏰 城堡護衛 v2（可招募協同角色·js/31）：與召喚同階段·輸出計入 summon 桶 */ if(player.cls === 'illusion') { cubeTick(); illuSummonTick(); } { let _sd = _dpsDealt(_dpsSumSnap); if (_sd > 0) _dps.summon += _sd; }   /* 🎯 DPS：召喚（玩家召喚/迷魅/幻術立方/城堡護衛）輸出 */ _combatSrc = 'mercenary'; alliesTick(); _combatSrc = null; }   // ⚔️ 召喚(含迷魅)/傭兵 戰鬥訊息來源情境；🔮 幻術士立方週期效果＋幻術精通幻象
    if(!player.dead) pledgeBlessTick();   // 生命的祝福：場上血盟怪物持續治療
    // HoT 持續回復（體力回復術 / 生命的祝福）
// 💤 【休眠機制】團隊 HoT（持續回復）：整條鏈路目前不可達——DB.skills 內已無任何技能宣告 hot/autoBuff
//    （sk_regen 體力回復術／sk_elf_lifebless 生命的祝福 已改為 classicHeal+groupHeal 的「瞬間全隊治癒」）。
//    機制本身完整且正確，刻意保留以便日後新增持續回復技能：只要在 js/00-data.js 該技能加回
//    `hot: { interval: <每跳 tick 數>, ticks: <總跳數> }` 與 `autoBuff: true`，整條鏈路即自動復活。
//    相關落點：js/03 tick 回復迴圈、js/07 applyTeamHot＋施放分支、js/06 傭兵施放、js/08 狀態圖示、js/10 取消打勾結束。
    if(player.hots && !player.dead) {   // 🍃 團隊 HoT（體力回復術/生命的祝福）：多技能並存·每 interval 對玩家＋全體非倒地傭兵各回復一次
        let _hotAllies = (player.allies || []).filter(a => a && !a._downed && (a.curHp || 0) > 0);
        for(let _hsk in player.hots) {
            let _h = player.hots[_hsk];
            if(--_h.cd <= 0) {
                _h.cd = _h.interval;
                let heal = _h.healDice
                    ? Math.max(1, Math.floor((rollDice(_h.healDice[0], _h.healDice[1]) + (_h.healBase || 0)) * _h.spCoef * (_h.healMult || 1)))
                    : Math.max(1, Math.floor((roll(_h.valDice[0], _h.valDice[1]) + (_h.magicDmg || 0)) * (_h.healMult || 1)));   // 🏺 v3.1.80 治癒者的恢復魔棒：施放者持有 groupHealMult 武器→每跳回復 ×2（施放時快照在 HoT 實例；v3.5.94 欄位更名同步）
                player.hp = Math.min(player.mhp, player.hp + heal);   // 🔧 水之元氣不套用於持續回復(HoT)
                _hotAllies.forEach(a => { a.curHp = Math.min(a.mhp || 1, (a.curHp || 0) + heal); });   // 🍃 全體傭兵同步回復
                try { if (typeof petsOutList === 'function') petsOutList().forEach(p => { if (p && !p._downed && (p.hp || 0) > 0) p.hp = Math.min(p.mhp || 1, (p.hp || 0) + heal); }); } catch (e) {}   // 🩹 v3.2.67 團隊 HoT 也回復出戰寵物
                try { if (typeof summonV2List === 'function') summonV2List().forEach(s => { if (s && !s._downed && (s.hp || 0) > 0) s.hp = Math.min(s.mhp || 1, (s.hp || 0) + heal); }); } catch (e) {}   // 🩹 v3.2.67 團隊 HoT 也回復召喚物
                try { if (typeof mercSummonList === 'function') mercSummonList().forEach(s => { if (s && !s._downed && (s.hp || 0) > 0) s.hp = Math.min(s.mhp || 1, (s.hp || 0) + heal); }); } catch (e) {}   // 🩹 v3.4.71 團隊 HoT 也回復傭兵召喚物
                try { if (typeof guardAliveList === 'function') guardAliveList().forEach(g => { if (g && !g._downed && (g.hp || 0) > 0) g.hp = Math.min(g.mhp || 1, (g.hp || 0) + heal); }); } catch (e) {}   // 🛡️ v3.8.4 團隊 HoT 也回復城堡護衛
                _h.ticksLeft--;
                logCombat(`${_h.skName} 為全隊回復了 ${heal} 點 HP。${_h.msg || ''}`, 'heal');
                if(_h.ticksLeft <= 0) { delete player.hots[_hsk]; logCombat(`${_h.skName} 的持續回復效果結束。`, 'heal'); }
                else updateUI();
            }
        }
    }
    // 🔧 誘捕倒數已併入 tick() 每秒區塊的統一 buff 遞減點

    // 🐾 v3.2.17 夥伴系統 v2：出戰寵物獨立行動（攻速/施法/喝水/復活皆在 petsTick 內·攻擊不再消耗肉）
    if (typeof petsTick === 'function') { _combatSrc = 'pet'; try { petsTick(); } catch (e) {} _combatSrc = null; }
}

// 體能激發/能量激發：負重狀態下仍可自然恢復 HP、MP（身上任一 loadFreeRegen 增益生效即放行）
function hasLoadFreeRegen() {
    if(!player.buffs) return false;
    for(let _sid in player.buffs) {
        if(player.buffs[_sid] > 0 && DB.skills[_sid] && DB.skills[_sid].loadFreeRegen) return true;
    }
    return false;
}

// 🏺 v3.4.x 拆分為 HP／MP 兩段，供 gameLoop 排程用不同節奏（巨魔的再生戒指只加速 HP·MP 維持 16 秒）。合併版 regenTick 已於 v3.5.83 移除（零呼叫點）。
function _regenHP() {
    if(!state.running || player.dead) return;
    let _loadFreeRegen = hasLoadFreeRegen();
    if(player.hp < player.mhp && !(player.buffs.sk_berserk > 0) && (_loadFreeRegen || (player.d.loadTier||0) < 1)) {
        let baseHpRegen = player.d.hpRegenMax > 0 ? roll(1, player.d.hpRegenMax) : 0;
        // 使用 Number() 強制轉換為數字，避免 10 + '1' = 101 的字串相加 Bug
        let totalHpRegen = Number(baseHpRegen) + Number(player.d.hpR || 0);
        if (totalHpRegen > 0) {
            player.hp = Math.min(player.mhp, player.hp + totalHpRegen);
        }
    }
}
function _regenMP() {
    if(!state.running || player.dead) return;
    let _loadFreeRegen = hasLoadFreeRegen();
    if(player.mp < player.mmp && (_loadFreeRegen || (player.d.loadTier||0) < 1)) {
        // 同樣加上 Number() 保護
        let totalMpRegen = Number(player.d.mpR || 0);
        if (player.d.lowMpRegenBonus && player.mp < player.mmp * 0.15) totalMpRegen += player.d.lowMpRegenBonus;   // 🐍 蛇神的凝視：MP<15% 時 MP自然恢復量額外 +N
        if (totalMpRegen > 0) {
            player.mp = Math.min(player.mmp, player.mp + totalMpRegen);
        }
    }
}
// 🗑️ v3.5.83 移除 regenTick()：零呼叫點。HP/MP 恢復由 tick() 內的 _hpIv/_mpIv 排程直接呼叫 _regenHP()/_regenMP()。

// 純BOSS房（不會出現一般怪）
// 🔧 軍王之室（五格控制型BOSS房）：中央固定BOSS、其餘四格固定指定小怪；需軍王的鑰匙入場、無傳送/日光、小怪不掉落、擊敗BOSS傳送回村
const KING_ROOMS = {
    king_baranka_room:  { boss: 'de_king_baranka', minion: 'de_train_hellhound', name: '魔獸軍王之室' },
    law_king_room:      { boss: 'de_king_laia',    minion: 'de_lab_mage',        name: '法令軍王之室' },
    necro_king_room:    { boss: 'de_king_heruby',  minion: 'de_necro_warlock',   name: '冥法軍王之室' },
    assassin_king_room: { boss: 'de_king_slayer',  minion: 'de_gate_soldier',    name: '暗殺軍王之室' },
    // 🏛️ 底比斯歐西里斯祭壇：雙BOSS（賀洛斯＋阿努比斯），兩隻皆亡後 5 秒同時復活；入場與再臨各消耗 1 把祭壇鑰匙
    thebes_temple:      { dual: true, bosses: ['thebes_horus', 'thebes_anubis'], key: 'item_thebes_altar_key', name: '底比斯歐西里斯祭壇' },
    // 🐍 提卡爾 庫庫爾坎祭壇：雙BOSS（杰弗雷庫雄＋雌），入場與再臨各消耗 1 把提卡爾庫庫爾坎祭壇鑰匙
    tikal_altar:        { dual: true, bosses: ['tikal_boss_m', 'tikal_boss_f'], key: 'item_tikal_altar_key', name: '提卡爾 庫庫爾坎祭壇' }
};
const PURE_BOSS_MAPS = ['antaras_lair', 'fafurion_lair', 'valakas_lair', 'king_baranka_room', 'law_king_room', 'necro_king_room', 'assassin_king_room', 'thebes_temple', 'tikal_altar', 'cursed_dark_elf_sanctuary', 'collapsed_elder_council_hall'];   // 🌑 v3.3.33 受詛咒的黑暗妖精聖地(吉爾塔斯)／崩壞的長老會議廳(冥皇丹特斯)＝龍窟式單BOSS房（只生中央·死後5秒重生·由長老會議廳NPC進入）
// 🌑 v3.4.18 聖地/崩壞廳 BOSS「復活收費」：擊敗頭目後每次復活扣 1 入場道具（首次生成免費·入場費已付於 sanctuaryEnter）；沒道具→傳送出去。map→入場道具 id。
const SANCT_RESPAWN_COST = { cursed_dark_elf_sanctuary: 'item_dk_book', collapsed_elder_council_hall: 'item_giltas_seal' };
//   回傳 true=已扣道具可生成、false=沒道具已強制傳送出去(呼叫端勿再 spawn)。首次生成免費由呼叫端 mapState._sanctBossSpawned 旗標把關(sanctuaryEnter 進場時重置為 false·此旗標隨 mapState 入存檔→save/load 不可刷)。
function sanctBossRespawnCharge() {
    let cost = SANCT_RESPAWN_COST[mapState.current];
    if(!cost) return true;
    let d0 = DB.items[cost];
    let bossName = (mapState.current === 'collapsed_elder_council_hall') ? '冥皇丹特斯' : '吉爾塔斯';
    let ci = player.inv.findIndex(x => x && x.id === cost && (x.cnt || 1) >= 1);
    if(ci < 0) {   // 沒道具→強制傳送出去（回上一個安全區＝長老會議廳入口·force 繞過受控限制）
        logSys(`<span class="text-amber-300">你身上已沒有 ${d0 ? d0.n : cost} 可再獻祭——${bossName} 的封印之力將你逐出了此地。</span>`);
        if(typeof setMapSelectors === 'function' && typeof getLastTown === 'function') setMapSelectors(getLastTown());
        if(typeof changeMap === 'function') changeMap(true);
        return false;
    }
    let it = player.inv[ci];
    if((it.cnt || 1) > 1) it.cnt -= 1; else player.inv.splice(ci, 1);
    logSys(`<span class="text-cyan-300">你獻祭了 1 個 ${d0 ? d0.n : cost}，${bossName} 再度降臨……</span>`);
    try { renderTabs(true); saveGame(); } catch(e){}
    return true;
}
const BOSS_BIG_MAPS = ['antaras_lair', 'fafurion_lair', 'valakas_lair'];   // 👑 方案B放大版面只套用這3個龍窟(不含底比斯祭壇等其餘純BOSS房)

// 🆕 後排雙格：一般狩獵、攻城、時空裂痕與四個軍王之室追加兩格「後排」→場上最多同時 5 隻。
//    單體純BOSS房與雙BOSS祭壇維持三格；攻城建築出現時也不會壓縮為三格。
function backSlotsActive() {
    let kingRoom = KING_ROOMS[mapState.current];
    return mapState.current === 'rift_battle'
        || !!(kingRoom && !kingRoom.dual)
        || !PURE_BOSS_MAPS.includes(mapState.current);
}

// 血盟敵人：等級與能力隨玩家等級縮放，於生成當下依各自的 scale 參數計算
function applySiegeEnemyScaling(mob) {
    let L = Math.max(1, player.lv);
    let s = mob.siege || {};
    if (s.fixed) {                                  // 攻城塔/城門：HP 固定值或依玩家等級（hpPerLv），其餘屬性不成長
        mob.lv = 1;
        mob.hp = s.hpPerLv ? s.hpPerLv * L : s.hp; mob.curHp = mob.hp;   // 🔧 守護塔 500×等級、城門 300×等級
        mob.ac = s.ac; mob.mr = s.mr;
        mob.exp = 0; mob.goldMin = 0; mob.goldMax = 0;
        if (s.dr) mob.dr = s.dr;
        return;
    }
    mob.lv = L;
    mob.hp = (s.hpC || 10) * L; mob.curHp = mob.hp;
    mob.ac = (s.acBase !== undefined ? s.acBase : -10) - Math.floor(L / (s.acDiv || 4));
    mob.mr = (s.mrBase || 0) + Math.floor(L / (s.mrDiv || 5));
    mob.exp = 30 * L;                               // 攻城怪經驗：30×玩家等級
    mob.goldMin = 0; mob.goldMax = 0;               // 攻城怪不掉金幣
    mob.dmg = [1, s.dmgSides || 10];
    mob.db = s.dbHalf ? Math.floor(L / 2) : L;      // 傷害加成：+(玩家等級)；dbHalf 為 +(玩家等級/2)
    mob.hit = (s.hitBase || 0) + Math.floor(L / 2); // 額外命中：基底 +(玩家等級/2)
    mob.atkSpd = s.atkSpd || 0.67;
    // 常駐被動回復(每2秒)：1~49 → 40HP；50~100 → 60HP
    mob.regenHp = (L >= 50) ? 60 : 40;
    mob.regenEvery = 20;
    if (s.er) mob.er = s.er;
}


// 😤 v3.5.59 白目玩家：叫賣NPC 頭像→白目怪 id；等級=玩家+5(上限100)·常駐回血 40/60 每2秒(王族 regenFix 60)·經驗/金幣 0
const TROLL_CLASS_BY_AVATAR = { "王子": "troll_royal", "公主": "troll_royal", "男騎士": "troll_knight", "女騎士": "troll_knight", "男妖精": "troll_elf", "女妖精": "troll_elf", "男法師": "troll_mage", "女法師": "troll_mage", "男黑暗妖精": "troll_dark", "女黑暗妖精": "troll_dark", "男幻術士": "troll_illusion", "女幻術士": "troll_illusion", "男龍騎士": "troll_dragon", "女龍騎士": "troll_dragon", "男戰士": "troll_warrior", "女戰士": "troll_warrior" };
// 😤 v3.6.20 第二能力模板：決定玩家 NPC 能力時 70% 抽原模板、30% 抽第二模板（troll2_*·js/00）。三個生成點（攻城/PVP野遇/記仇）統一走 trollPickClassMob。
const TROLL_TEMPLATE2_CHANCE = 0.3;
const TROLL_CLASS_TEMPLATE2 = { troll_royal: "troll2_royal", troll_knight: "troll2_knight", troll_elf: "troll2_elf", troll_mage: "troll2_mage", troll_dark: "troll2_dark", troll_dragon: "troll2_dragon", troll_illusion: "troll2_illusion", troll_warrior: "troll2_warrior" };
function trollPickClassMob(avatar) {
    let base = TROLL_CLASS_BY_AVATAR[avatar] || "troll_warrior";
    return (Math.random() < TROLL_TEMPLATE2_CHANCE && TROLL_CLASS_TEMPLATE2[base] && DB.mobs[TROLL_CLASS_TEMPLATE2[base]]) ? TROLL_CLASS_TEMPLATE2[base] : base;
}
const PVP_ALIGN_MIN = -32767;
const PVP_ALIGN_MAX = 32767;
const PVP_ALIGN_EVIL = -1000;
const PVP_ALIGN_JUSTICE = 1000;
const PVP_REVENGE_COST = 100000;
const PVP_REVENGE_MAX = 20;
const PVP_WILD_CHANCE = 0.01;
const PVP_KILL_WHISPER_LIFE_MS = 60 * 60 * 1000;
const PVP_KILL_WHISPER_INTERVAL_MS = 10 * 60 * 1000;
const PVP_KILL_WHISPER_CHANCE = 0.20;
const PVP_KILL_WHISPER_REVENGE_CHANCE = 0.50;
const PVP_KILL_WHISPER_REVENGE_MAX = 3;
const PVP_KILL_WHISPER_RECORD_MAX = 20;
const PVP_AVATARS = Object.keys(TROLL_CLASS_BY_AVATAR);
const PVP_NAME_HEAD = ['煞氣ㄟ', '最愛', '闇の', '破滅', '終焉', '霸氣', '覺醒', '無敵', '爆裂', '狂氣', '孤高', '夜月', '紅名', '藍名', '天堂', '亞丁', '奇岩', '海音', '肯特', '風木', '沉默', '法書', '祝武', '祝防', '掛網', '回卷', '勇水', '白水'];
const PVP_NAME_CORE = ['刀神', '法皇', '妖弓', '黑妖', '龍騎', '戰王', '王子', '公主', '盟主', '騎士', '補師', '歐洲人', '倉庫王', '紅水仔', '打寶哥', '奇岩王', '海音霸主', '肯特劍魂', '風木狂人', '傲塔住民', '古魯丁路霸', '說島老手'];
const PVP_NAME_TAIL = ['前輩', '之夢', '公主', '王子', '大人', 'さま', '先輩', '總長', '煞星', '魔王', '本尊', '分身', '不回卷', '專殺掛機', '只打紅人', '單挑啦', '包場中', '撿骨人', '補刀王', '掉寶王', '盟倉守護者', '安定值零'];
const PVP_NAME_SHORT = PVP_NAME_HEAD.concat(PVP_NAME_TAIL).filter((name, index, list) => name.length === 2 && list.indexOf(name) === index);
const PVP_NAME_WRAPPERS = [
    ['Oo', 'oO'], ['oO', 'Oo'], ['O0', '0O'], ['Xx', 'xX'], ['xX', 'Xx'], ['Xxx', 'xxX'],
    ['卍', '卍'], ['乂', '乂'], ['一', '一'], ['丨', '丨'], ['灬', '灬'], ['丶', '丶'],
    ['メ', 'メ'], ['ミ', 'ミ'], ['彡', '彡'], ['艸', '艸'], ['ㄨ', 'ㄨ'], ['★', '★'],
    ['☆', '☆'], ['◆', '◆'], ['◇', '◇'], ['煞氣a', 'a煞氣'], ['可愛a', 'a可愛'],
    ['霸氣a', 'a霸氣'], ['最愛a', 'a最愛'], ['闇夜a', 'a闇夜'], ['神之', '之神'],
    ['惡魔a', 'a惡魔'], ['天使a', 'a天使'], ['戀愛a', 'a戀愛']
];
function pvpClampAlignment(v) {
    v = Math.round(Number(v) || 0);
    return Math.max(PVP_ALIGN_MIN, Math.min(PVP_ALIGN_MAX, v));
}
function _pvpNormalizeKillWhisperRecord(raw) {
    if (!raw || !raw.n) return null;
    let whisperSeq = Math.max(0, Math.floor(Number(raw.whisperSeq) || 0));
    let revengeCount = Math.max(0, Math.min(PVP_KILL_WHISPER_REVENGE_MAX, Math.floor(Number(raw.revengeCount) || 0)));
    return {
        n: String(raw.n).slice(0, 24),
        avatar: TROLL_CLASS_BY_AVATAR[raw.avatar] ? raw.avatar : '男戰士',
        alignmentValue: pvpClampAlignment(raw.alignmentValue),
        levelOffset: Number.isFinite(Number(raw.levelOffset)) ? Math.max(-10, Math.min(10, Math.round(Number(raw.levelOffset)))) : undefined,
        clanId: raw.clanId == null ? null : String(raw.clanId).slice(0, 64),
        revengeCount: revengeCount,
        awaitingRevenge: revengeCount < PVP_KILL_WHISPER_REVENGE_MAX && !!raw.awaitingRevenge,
        expiresAt: Math.max(0, Math.floor(Number(raw.expiresAt) || 0)),
        nextCheckAt: Math.max(0, Math.floor(Number(raw.nextCheckAt) || 0)),
        whisperSeq: whisperSeq,
        repliedSeq: Math.max(0, Math.min(whisperSeq, Math.floor(Number(raw.repliedSeq) || 0))),
        updatedAt: Math.max(0, Math.floor(Number(raw.updatedAt) || 0))
    };
}
// 🔒 同名 NPC 的性向值在世界頻道、追殺、復仇與有效密語期間共用同一份鎖。
//   進入戰鬥不解鎖；只有相關追蹤全部結束後才允許釋放。NPC 擊殺非邪惡玩家而轉紅時，
//   會透過 pvpSetNpcAlignment 同步所有紀錄，不屬於隨機重抽。
const PVP_ALIGN_LOCK_MAX = 200;   // 世界頻道會不斷產生新名字 → 上限保護；淘汰最舊且未凍結者
function pvpAlignLockAll() {
    if (!player.pvpAlignLock || typeof player.pvpAlignLock !== 'object' || Array.isArray(player.pvpAlignLock)) player.pvpAlignLock = {};
    return player.pvpAlignLock;
}
// 宣戰凍結：鎖上記的血盟目前「與玩家」交戰中。
// ⚠️ 必須走 npcClanWarIds（有 2 秒快取）而非 npcClanGetById——後者每次都 _clanReadState() 重讀＋解壓 localStorage，
//    淘汰迴圈逐筆呼叫會變成 O(n²) 次儲存讀取，實測 230 筆就把分頁卡死。
function pvpAlignLockFrozen(rec) {
    if (!rec || !rec.c) return false;
    try {
        if (typeof npcClanWarIds !== 'function') return false;
        return npcClanWarIds(player).indexOf(rec.c) >= 0;
    } catch (e) { return false; }
}
function pvpAlignmentInUse(name) {
    if (!player || !player.cls || !name) return false;
    let key = String(name).slice(0, 24);
    let same = rec => rec && String(rec.n || '').slice(0, 24) === key;
    if (Array.isArray(player.trollPlayers) && player.trollPlayers.some(same)) return true;
    if (Array.isArray(player.pvpRevengeList) && player.pvpRevengeList.some(same)) return true;
    if (Array.isArray(player.socialNpcContacts) && player.socialNpcContacts.some(same)) return true;
    let now = Date.now();
    return Array.isArray(player.pvpKillWhispers) && player.pvpKillWhispers.some(rec =>
        same(rec) && (!!rec.awaitingRevenge || Math.max(0, Number(rec.expiresAt) || 0) > now)
    );
}
function pvpLockAlignment(name, align, clanId) {
    if (!player || !player.cls || !name) return pvpClampAlignment(align);
    let all = pvpAlignLockAll(), key = String(name).slice(0, 24);
    if (all[key]) {
        if (clanId) all[key].c = String(clanId).slice(0, 64);
        all[key].t = Date.now();
        return pvpClampAlignment(all[key].v);
    }
    let keys = Object.keys(all);
    if (keys.length >= PVP_ALIGN_LOCK_MAX) {
        keys.sort((a, b) => (Number(all[a] && all[a].t) || 0) - (Number(all[b] && all[b].t) || 0));
        for (let i = 0; i < keys.length && Object.keys(all).length >= PVP_ALIGN_LOCK_MAX; i++) {
            if (!pvpAlignLockFrozen(all[keys[i]]) && !pvpAlignmentInUse(keys[i])) delete all[keys[i]];
        }
    }
    all[key] = { v: pvpClampAlignment(align), t: Date.now(), c: clanId ? String(clanId).slice(0, 64) : null };
    return all[key].v;
}
function pvpSetNpcAlignment(name, align, clanId) {
    if (!player || !player.cls || !name) return pvpClampAlignment(align);
    let key = String(name).slice(0, 24);
    let value = pvpClampAlignment(align);
    let all = pvpAlignLockAll();
    let old = all[key];
    let resolvedClanId = clanId ? String(clanId).slice(0, 64) : (old && old.c ? old.c : null);
    all[key] = { v:value, t:Date.now(), c:resolvedClanId };
    let sync = rec => {
        if (!rec || String(rec.n || '').slice(0, 24) !== key) return;
        rec.alignmentValue = value;
        if (resolvedClanId && !rec.clanId) rec.clanId = resolvedClanId;
    };
    if (Array.isArray(player.trollPlayers)) player.trollPlayers.forEach(sync);
    if (Array.isArray(player.pvpRevengeList)) player.pvpRevengeList.forEach(sync);
    if (Array.isArray(player.socialNpcContacts)) player.socialNpcContacts.forEach(sync);
    if (Array.isArray(player.pvpKillWhispers)) player.pvpKillWhispers.forEach(sync);
    try {
        if (typeof mapState !== 'undefined' && mapState && Array.isArray(mapState.mobs)) {
            mapState.mobs.forEach(mob => {
                if (mob && mob.trollPlayer && String(mob.n || '').slice(0, 24) === key) mob._pvpAlignment = value;
            });
        }
    } catch (e) {}
    try {
        if (typeof _wcNpcs !== 'undefined' && _wcNpcs) {
            Object.keys(_wcNpcs).forEach(id => {
                let npc = _wcNpcs[id];
                if (npc && String(npc.name || '').slice(0, 24) === key) npc.alignmentValue = value;
            });
        }
    } catch (e) {}
    try { if (typeof npcClanUpdateMemberAlignment === 'function') npcClanUpdateMemberAlignment(key, value, player); } catch (e) {}
    try { if (typeof pandoraUpdateWandererAlignment === 'function') pandoraUpdateWandererAlignment(key, value); } catch (e) {}
    return value;
}
function pvpLockedAlignment(name, fallback) {
    if (!player || !player.cls || !name) return pvpClampAlignment(fallback);
    let rec = pvpAlignLockAll()[String(name).slice(0, 24)];
    return rec ? pvpClampAlignment(rec.v) : pvpClampAlignment(fallback);
}
function pvpIsAlignLocked(name) {
    if (!player || !player.cls || !name) return false;
    return !!pvpAlignLockAll()[String(name).slice(0, 24)];
}
function pvpReleaseAlignLock(name) {
    if (!player || !player.cls || !name) return false;
    let all = pvpAlignLockAll(), key = String(name).slice(0, 24), rec = all[key];
    if (!rec || pvpAlignLockFrozen(rec) || pvpAlignmentInUse(key)) return false;
    delete all[key];
    return true;
}
function pvpEnsureState() {
    if (!player || !player.cls) return;
    player.alignmentValue = pvpClampAlignment(player.alignmentValue);
    {   // 🔒 v3.6.81 性向值鎖正規化（舊存檔無此欄位／型別異常一律重建）
        let all = pvpAlignLockAll();
        for (let k in all) {
            let r = all[k];
            if (!r || typeof r !== 'object' || !Number.isFinite(Number(r.v))) { delete all[k]; continue; }
            r.v = pvpClampAlignment(r.v);
            r.t = Number(r.t) || Date.now();
            r.c = r.c == null ? null : String(r.c).slice(0, 64);
        }
    }
    if (player.pvpOn === undefined) player.pvpOn = false;
    if (typeof npcClanWarActive === 'function' && npcClanWarActive(player)) player.pvpOn = true;
    if (!Array.isArray(player.pvpRevengeList)) player.pvpRevengeList = [];
    player.pvpRevengeList = player.pvpRevengeList.filter(r => r && r.n).slice(0, PVP_REVENGE_MAX).map(r => ({
        n: String(r.n).slice(0, 24),
        avatar: TROLL_CLASS_BY_AVATAR[r.avatar] ? r.avatar : '男戰士',
        alignmentValue: pvpClampAlignment(r.alignmentValue),
        levelOffset: Number.isFinite(Number(r.levelOffset)) ? Math.max(-10, Math.min(10, Math.round(Number(r.levelOffset)))) : undefined,
        clanId: r.clanId == null ? null : String(r.clanId).slice(0, 64),
        deaths: Math.max(1, Number(r.deaths) || 1),
        t: Number(r.t) || Date.now()
    }));
    player.pvpRevengeList.forEach(rec => {
        rec.alignmentValue = pvpLockAlignment(rec.n, rec.alignmentValue, rec.clanId);
    });
    if (Array.isArray(player.trollPlayers)) player.trollPlayers.forEach(rec => {
        if (rec && rec.n) rec.alignmentValue = pvpLockAlignment(rec.n, rec.alignmentValue, rec.clanId);
    });
    let socialByName = Object.create(null);
    (Array.isArray(player.socialNpcContacts) ? player.socialNpcContacts : []).forEach(raw => {
        if (!raw || !raw.n) return;
        let name = String(raw.n).trim().slice(0, 24);
        if (!name) return;
        let messages = (Array.isArray(raw.privateMessages) ? raw.privateMessages : []).slice(-12).map(entry => ({
            role:entry && entry.role === 'player' ? 'player' : (entry && entry.role === 'system' ? 'system' : 'npc'),
            text:String(entry && entry.text || '').trim().slice(0, 240),
            at:Math.max(0, Math.floor(Number(entry && entry.at) || 0))
        })).filter(entry => entry.text);
        let rec = {
            n:name,
            persona:['helpful', 'veteran', 'sarcastic', 'newbie', 'trader'].includes(raw.persona) ? raw.persona : 'helpful',
            cls:(typeof CLAN_CLASS_NAMES === 'object' && CLAN_CLASS_NAMES[raw.cls]) ? raw.cls : 'knight',
            avatar:TROLL_CLASS_BY_AVATAR[raw.avatar] ? raw.avatar : '男戰士',
            alignmentValue:pvpClampAlignment(raw.alignmentValue),
            levelOffset:Number.isFinite(Number(raw.levelOffset)) ? pvpClampLevelOffset(raw.levelOffset) : 0,
            clanId:raw.clanId == null ? null : String(raw.clanId).slice(0, 64),
            clanName:String(raw.clanName || '').trim().slice(0, 20),
            clanLeader:!!raw.clanLeader,
            blocked:!!raw.blocked,
            privateHatred:Math.max(0, Math.min(100, Math.round(Number(raw.privateHatred) || 0))),
            privateMessages:messages,
            privateImpactTexts:(Array.isArray(raw.privateImpactTexts) ? raw.privateImpactTexts : []).map(s => String(s || '').slice(0, 120)).filter(Boolean).slice(-12),
            privateImpactTimes:(Array.isArray(raw.privateImpactTimes) ? raw.privateImpactTimes : []).map(Number).filter(Number.isFinite).slice(-6),
            lastChatAt:Math.max(0, Math.floor(Number(raw.lastChatAt) || 0))
        };
        if (!socialByName[name] || rec.lastChatAt >= socialByName[name].lastChatAt) socialByName[name] = rec;
    });
    player.socialNpcContacts = Object.keys(socialByName)
        .map(name => socialByName[name])
        .sort((a, b) => b.lastChatAt - a.lastChatAt)
        .slice(0, 20);
    player.socialNpcContacts.forEach(rec => {
        rec.alignmentValue = pvpLockAlignment(rec.n, rec.alignmentValue, rec.clanId);
    });
    let whisperByName = Object.create(null);
    (Array.isArray(player.pvpKillWhispers) ? player.pvpKillWhispers : []).forEach(raw => {
        let rec = _pvpNormalizeKillWhisperRecord(raw);
        if (!rec) return;
        if (!whisperByName[rec.n] || rec.updatedAt >= whisperByName[rec.n].updatedAt) whisperByName[rec.n] = rec;
    });
    player.pvpKillWhispers = Object.keys(whisperByName)
        .map(n => whisperByName[n])
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, PVP_KILL_WHISPER_RECORD_MAX);
    player.pvpKillWhispers.forEach(rec => {
        rec.alignmentValue = pvpLockAlignment(rec.n, rec.alignmentValue, rec.clanId);
    });
}
function pvpAlignmentKind(v) {
    v = pvpClampAlignment(v);
    if (v >= PVP_ALIGN_JUSTICE) return 'justice';
    if (v <= PVP_ALIGN_EVIL) return 'evil';
    return 'neutral';
}
function pvpAlignmentLabel(v) {
    let k = pvpAlignmentKind(v);
    return k === 'justice' ? '正義' : (k === 'evil' ? '邪惡' : '中立');
}
function _pvpMix(a, b, t) {
    let ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
    let ar = (ah >> 16) & 255, ag = (ah >> 8) & 255, ab = ah & 255;
    let br = (bh >> 16) & 255, bg = (bh >> 8) & 255, bb = bh & 255;
    let rr = Math.round(ar + (br - ar) * t), rg = Math.round(ag + (bg - ag) * t), rb = Math.round(ab + (bb - ab) * t);
    return '#' + [rr, rg, rb].map(x => x.toString(16).padStart(2, '0')).join('');
}
function pvpAlignmentColor(v) {
    v = pvpClampAlignment(v);
    if (v >= PVP_ALIGN_JUSTICE) return _pvpMix('#ffffff', '#3b82f6', (v - PVP_ALIGN_JUSTICE) / (PVP_ALIGN_MAX - PVP_ALIGN_JUSTICE));
    if (v <= PVP_ALIGN_EVIL) return _pvpMix('#ffffff', '#ff4d4d', (Math.abs(v) - Math.abs(PVP_ALIGN_EVIL)) / (PVP_ALIGN_MAX - Math.abs(PVP_ALIGN_EVIL)));
    return '#ffffff';
}
function pvpNameStyleByValue(v) {
    let c = pvpAlignmentColor(v);
    return `color:${c}!important;text-shadow:1px 1px 0 #000,-1px 1px 0 #000,1px -1px 0 #000,-1px -1px 0 #000,0 0 5px ${c}!important;`;
}
function pvpNameStyle(m) {
    if (!m || !m.trollPlayer) return '';
    return ` style="${pvpNameStyleByValue(m._pvpAlignment || 0)}"`;
}
function pvpNameHtml(name, align, cls) {
    return `<span class="${cls || 'font-bold'}" style="${pvpNameStyleByValue(align)}">${_trollEncounterEsc(name)}</span>`;
}
function pvpEvilBonus(max) {
    if (!player) return 0;
    return Math.floor((max || 0) * Math.max(0, -pvpClampAlignment(player.alignmentValue)) / Math.abs(PVP_ALIGN_MIN));
}
// 💙 v3.5.75 正義性向法術：主玩家是否為正義（性向值 ≥ 1000）——究極光裂術施放門檻用
function pvpIsJustice() {
    if (typeof player === 'undefined' || !player) return false;
    return pvpClampAlignment(player.alignmentValue) >= PVP_ALIGN_JUSTICE;
}
// 💙 v3.5.75 正義治癒加成倍率：正義門檻(1000)起隨性向值線性提升最終恢復量·滿正義(32767)＝+20%·中立/邪惡＝1（無提升）。
//   適用＝justiceHeal 旗標技能（初/中/高級治癒術·體力回復術·全部治癒術·生命的祝福·治癒魔法頭盔兩式）·rollHealingSpell 接線。
//   💙 v3.5.76 傭兵亦適用：判定「施法者自己」的性向值——主玩家=player.alignmentValue·傭兵=招募時記錄的來源存檔性向值(ally.alignmentValue·buildAlly 快照+載入掃描同步)。
function pvpJusticeHealMultValue(a) {
    a = pvpClampAlignment(a);
    if (a < PVP_ALIGN_JUSTICE) return 1;
    return 1 + 0.2 * (a - PVP_ALIGN_JUSTICE) / (PVP_ALIGN_MAX - PVP_ALIGN_JUSTICE);
}
function pvpJusticeHealMult() {
    if (typeof player === 'undefined' || !player || !player.cls) return 1;
    return pvpJusticeHealMultValue(player.alignmentValue);
}
function pvpChangeAlignment(delta) {
    pvpEnsureState();
    if (!player || !player.cls || !delta) return 0;
    let before = pvpClampAlignment(player.alignmentValue);
    player.alignmentValue = pvpClampAlignment(before + delta);
    if (typeof alliesChangeAlignment === 'function') alliesChangeAlignment(delta);
    return player.alignmentValue - before;
}
function _pvpNameRand(rand) {
    let n = (typeof rand === 'function') ? Number(rand()) : Math.random();
    if (!Number.isFinite(n)) n = Math.random();
    return Math.max(0, Math.min(0.999999999, n));
}
function _pvpNamePick(list, rand) {
    if (!list || !list.length) return '';
    return list[Math.floor(_pvpNameRand(rand) * list.length)];
}
function pvpRandomNameWith(rand) {
    rand = (typeof rand === 'function') ? rand : Math.random;
    let name;
    if (_pvpNameRand(rand) < 0.45) {
        name = _pvpNamePick(PVP_NAME_SHORT, rand);
    } else {
        let h = _pvpNamePick(PVP_NAME_HEAD, rand);
        let c = _pvpNamePick(PVP_NAME_CORE, rand);
        let t = _pvpNamePick(PVP_NAME_TAIL, rand);
        let style = Math.floor(_pvpNameRand(rand) * 4);
        name = style === 0 ? `${h}${c}`
            : style === 1 ? `${c}${t}`
            : style === 2 ? `${h}${c}${t}`
            : `${c}oO${h}`;
    }
    if (_pvpNameRand(rand) < 0.15) {
        let wrapper = _pvpNamePick(PVP_NAME_WRAPPERS, rand);
        name = wrapper[0] + name + wrapper[1];
    }
    return name;
}
function pvpRandomName() {
    return pvpRandomNameWith(Math.random);
}
function pvpRandomAlignment() {
    return pvpClampAlignment(Math.floor(PVP_ALIGN_MIN + Math.random() * (PVP_ALIGN_MAX - PVP_ALIGN_MIN + 1)));
}
function pvpRandomLevelOffset() {
    return Math.floor(Math.random() * 21) - 10;
}
function pvpClampLevelOffset(offset) {
    return Math.max(-10, Math.min(10, Math.round(offset)));
}
function pvpResolveLevelOffset(entry) {
    let offset = Number(entry && entry.levelOffset);
    if (!Number.isFinite(offset)) offset = pvpRandomLevelOffset();
    offset = pvpClampLevelOffset(offset);
    if (entry) entry.levelOffset = offset;
    return offset;
}
function pvpCreateRandomOpponent(onFieldNames, clanOptions) {
    let tries = 0, n = '';
    do { n = pvpRandomName(); tries++; } while (onFieldNames && onFieldNames.includes(n) && tries < 8);
    let entry = {
        n: n,
        avatar: PVP_AVATARS[Math.floor(Math.random() * PVP_AVATARS.length)] || '男戰士',
        alignmentValue: pvpRandomAlignment(),
        levelOffset: pvpRandomLevelOffset(),
        pvpRandom: true
    };
    if (!(clanOptions && clanOptions.skipClanAssign) && typeof npcClanAssignOpponent === 'function') {
        let opts = Object.assign({}, clanOptions || {}, { onFieldNames:onFieldNames || [] });
        entry = npcClanAssignOpponent(entry, opts) || entry;
    }
    if (!(clanOptions && clanOptions.skipClanAssign)) {
        entry.alignmentValue = pvpLockAlignment(entry.n, entry.alignmentValue, entry.clanId);
    }
    return entry;
}
function pvpMarkForChase(entry) {
    if (!entry || !entry.n) return;
    pvpEnsureState();
    if (!Array.isArray(player.trollPlayers)) player.trollPlayers = [];
    let old = player.trollPlayers.find(t => t && t.n === entry.n);
    if (!Number.isFinite(Number(entry.levelOffset)) && old && Number.isFinite(Number(old.levelOffset))) {
        entry.levelOffset = old.levelOffset;
    }
    let clanId = entry.clanId || (old && old.clanId) || null;
    let alignmentValue = pvpLockAlignment(entry.n, entry.alignmentValue, clanId);
    let rec = {
        n: String(entry.n).slice(0, 24),
        avatar: TROLL_CLASS_BY_AVATAR[entry.avatar] ? entry.avatar : '男戰士',
        alignmentValue: alignmentValue,
        levelOffset: pvpResolveLevelOffset(entry),
        clanId: clanId,
        revengeCount: Math.max(0, Math.min(PVP_KILL_WHISPER_REVENGE_MAX, Math.floor(Number(entry.revengeCount) || 0))),
        pvpRevenge: true,
        noExpire: true,
        until: Date.now() + 3650 * 24 * 60 * 60 * 1000
    };
    player.trollPlayers = player.trollPlayers.filter(t => t && t.n !== rec.n);
    player.trollPlayers.push(rec);
}
function pvpOpponentLevel(siegeConfigured, siegeLevel, playerLevel, levelOffset, revengeCount, revengeMax, clanAtWar, groupBattle) {
    let normalizedPlayerLevel = Math.max(1, Math.round(Number(playerLevel) || 1));
    let normalizedRevengeCount = Math.max(0, Math.min(revengeMax, Math.floor(Number(revengeCount) || 0)));
    let baseLevel = siegeConfigured
        ? siegeLevel
        : normalizedPlayerLevel + levelOffset + normalizedRevengeCount * 3;
    return Math.max(1, baseLevel + (clanAtWar ? 5 : 0) + (groupBattle ? 3 : 0));
}
function pvpTrollLevelOverride(entry) {
    let siegeLevel = Number(entry && entry.siegeLevel);
    let siegeConfigured = Number.isFinite(siegeLevel);
    let levelOffset = siegeConfigured ? 0 : pvpResolveLevelOffset(entry);
    return pvpOpponentLevel(
        siegeConfigured,
        siegeLevel,
        Number(player.lv),
        levelOffset,
        Number(entry && entry.revengeCount),
        PVP_KILL_WHISPER_REVENGE_MAX,
        !!(entry && entry.clanAtWar),
        !!(entry && entry._npcClanBattle)
    );
}
function pvpRegisterKillWhisper(mob) {
    if (!mob || !mob.trollPlayer || mob._siegePlayer || !mob.n || !player || !player.cls) return;
    pvpEnsureState();
    let now = Date.now();
    let list = player.pvpKillWhispers || [];
    let rec = list.find(entry => entry && entry.n === mob.n);
    if (!rec) {
        rec = {
            n: String(mob.n).slice(0, 24),
            avatar: '男戰士',
            alignmentValue: 0,
            levelOffset: pvpRandomLevelOffset(),
            revengeCount: 0,
            awaitingRevenge: false,
            expiresAt: 0,
            nextCheckAt: 0,
            whisperSeq: 0,
            repliedSeq: 0,
            updatedAt: now
        };
    }
    rec.avatar = TROLL_CLASS_BY_AVATAR[mob._pvpAvatar] ? mob._pvpAvatar : '男戰士';
    rec.clanId = mob._npcClanId || rec.clanId || null;
    rec.alignmentValue = pvpLockAlignment(mob.n, mob._pvpAlignment || 0, rec.clanId);
    mob._pvpAlignment = rec.alignmentValue;
    if (Number.isFinite(Number(mob._pvpLevelOffset))) rec.levelOffset = pvpResolveLevelOffset({ levelOffset: mob._pvpLevelOffset });
    rec.awaitingRevenge = false;
    rec.repliedSeq = rec.whisperSeq;
    rec.updatedAt = now;
    if (rec.revengeCount >= PVP_KILL_WHISPER_REVENGE_MAX) {
        rec.expiresAt = now;
        rec.nextCheckAt = 0;
    } else {
        rec.expiresAt = now + PVP_KILL_WHISPER_LIFE_MS;
        rec.nextCheckAt = now + PVP_KILL_WHISPER_INTERVAL_MS;
    }
    player.pvpKillWhispers = [rec].concat(list.filter(entry => entry && entry.n !== rec.n)).slice(0, PVP_KILL_WHISPER_RECORD_MAX);
}
function pvpAddRevengeFromMob(mob) {
    if (!mob || !mob.trollPlayer || !mob.n) return;
    pvpEnsureState();
    let clanId = mob._npcClanId || null;
    let align = pvpLockAlignment(mob.n, mob._pvpAlignment || 0, clanId);
    if (pvpClampAlignment(player.alignmentValue) > PVP_ALIGN_EVIL) {
        let evilAlignment = Math.min(align, -12000);
        if (evilAlignment !== align) align = pvpSetNpcAlignment(mob.n, evilAlignment, clanId);
    }
    mob._pvpAlignment = align;
    let avatar = mob._pvpAvatar || '男戰士';
    let list = player.pvpRevengeList || [];
    let old = list.find(r => r && r.n === mob.n);
    if (old) {
        old.avatar = avatar;
        old.alignmentValue = align;
        if (Number.isFinite(Number(mob._pvpLevelOffset))) old.levelOffset = pvpResolveLevelOffset({ levelOffset: mob._pvpLevelOffset });
        old.clanId = clanId || old.clanId || null;
        old.deaths = (old.deaths || 1) + 1;
        old.t = Date.now();
    } else {
        list.unshift({
            n: mob.n,
            avatar: avatar,
            alignmentValue: align,
            levelOffset: Number.isFinite(Number(mob._pvpLevelOffset)) ? pvpResolveLevelOffset({ levelOffset: mob._pvpLevelOffset }) : pvpRandomLevelOffset(),
            clanId: clanId,
            deaths: 1,
            t: Date.now()
        });
    }
    player.pvpRevengeList = list.slice(0, PVP_REVENGE_MAX);
}
function pvpOnPlayerDeath(killers) {
    if (!Array.isArray(killers) || !killers.length) return;
    if (typeof npcClanOnPlayerKilledBy === 'function') npcClanOnPlayerKilledBy(killers);
    killers.forEach(m => pvpAddRevengeFromMob(m));
    try { if (typeof renderPvpTab === 'function') renderPvpTab(); } catch (e) {}
}
function pvpOnKillMob(mob) {
    if (!mob || !player || !player.cls) return;
    pvpEnsureState();
    if (mob.trollPlayer && mob._wcMassTauntBattle && typeof wcMassTauntGroupBattleOnKill === 'function') wcMassTauntGroupBattleOnKill(mob);
    if (mob.trollPlayer && mob._npcClanId && typeof npcClanOnNpcKilled === 'function') npcClanOnNpcKilled(mob);
    if (mob.pledgeEnemy || mob.siegeEnemy || mob.race === '血盟' || (typeof isSiegeArea === 'function' && typeof mapState !== 'undefined' && mapState && isSiegeArea(mapState.current))) return;
    if (mob.trollPlayer) {
        if (typeof npcClanKillIgnoresAlignment === 'function' && npcClanKillIgnoresAlignment(mob)) return;
        let a = pvpClampAlignment(mob._pvpAlignment || 0);
        if (a >= PVP_ALIGN_JUSTICE) pvpChangeAlignment(-10000);
        else if (a > PVP_ALIGN_EVIL) pvpChangeAlignment(-5000);
        pvpRegisterKillWhisper(mob);
        if (player.pvpRevengeList && player.pvpRevengeList.length) {
            let _n0 = player.pvpRevengeList.length;
            player.pvpRevengeList = player.pvpRevengeList.filter(r => r && r.n !== mob.n);
            if (player.pvpRevengeList.length !== _n0) { try { if (typeof renderPvpTab === 'function') renderPvpTab(); } catch (e) {} }   // 🐛 v3.5.74 稽核修#2：名單移除即重繪分頁（防開著分頁時列位移點錯目標）
        }
        return;
    }
    pvpChangeAlignment(1);
    if (typeof npcClanMaybeStartGroupBattle === 'function') npcClanMaybeStartGroupBattle(mob);
}
const TROLL_ENCOUNTER_PLAYER_TAUNTS = [
    '剛剛不是很會喊？出來講啊', '別躲安全區，現在換我找你', '你不是要 PK？我到門口了', '座標不用報，我自己來了', '剛剛嘴很快，手有跟上嗎', '少裝路過，看到你了',
    '你的廣播比掉寶還煩', '不是很嗆？紅水帶夠沒', '你先別飛，打完再說', '來，讓我看看你幾等', '剛剛那句再講一次', '安全區外還這麼大聲嗎',
    '你買裝很派，打架會不會', '別光會洗頻，動手啊', '我傳卷都撕了，你別跑', '今天不清你不回村', '你那張嘴比武器還亮', '補機在嗎？等等別哭',
    '你剛喊價喊很秋嘛', '來單挑，別叫盟友', '你那名字我記住了', '先把祝順拿出來吧', '別急著回卷，先躺一下', '天堂不是只有市場啦',
    '你是不是只會在村裡大聲', '我看你比怪還欠打', '打完再讓你廣播', '來啊，奇岩外面那套拿出來'
];
const TROLL_ENCOUNTER_NPC_TAUNTS = [
    '來啊，補紅水別哭', '你算哪根蔥，也敢找我', '笑死，剛出村就想當英雄', '先看清楚我幾等再嘴', '你這裝備也敢出來巡田水', '不服就貼上來',
    '少廢話，按攻擊啦', '我站著讓你砍三刀啦', '你盟徽看起來很會躺', '打輸不要密我道歉', '有種別按回卷', '你剛剛不是很派？',
    '紅水帶夠沒，等等噴到沒重量', '別叫補機，我怕你丟臉', '我收購只是副業，清人是興趣', '你這命中打得到嗎', '別只會嘴，刀拿穩',
    '來 PK 啊，誰飛誰孬', '你先想好墓碑要寫什麼', '你的勇水喝到膽子上了？', '這區我包了，你旁邊蹲', '笑你不敢貼身', '你那傷害像沒點蠟燭',
    '別演強者了，大家都在看', '我在這等你掉經驗', '你回村路線我都幫你排好了', '打我之前先買保險', '你這套話術我昨天殺過'
];
const PVP_KILL_WHISPER_LINES = [
    '剛剛那場只是你運氣好，有種再遇一次。',
    '撿到一次尾刀就以為自己很強？',
    '我剛才網路延遲，再碰到你就知道。',
    '先別急著得意，我補完紅水就回去。',
    '剛才我沒開變身，重來你就躺。',
    '裝備先別收，我等等親自拿回來。',
    '你那最後一下我記住了。',
    '剛才是我按錯回卷，不然躺的是你。',
    '敢不敢離開安全區再打一場？',
    '你最好祈禱下次先看到我。',
    '剛才旁邊怪太多，別把那場當實力。',
    '笑得很大聲嘛，等等別先飛。',
    '我已經記住你的練功路線了。',
    '贏一場就在頻道裝高手喔？',
    '剛才只是讓你，下次不會了。',
    '紅水買滿了嗎？我可不想你又找理由。',
    '你的名字我先記著，這件事還沒完。',
    '別急著下線，我很快就會找到你。',
    '那一下很痛是不是？等等換你試試。',
    '你以為回村就結束了？想太多。'
];
const PVP_KILL_WHISPER_PLAYER_REPLIES = [
    '躺在地上的人話還這麼多？',
    '先把噴掉的自尊撿回來再密。',
    '要來就來，別只會躲在密語裡。',
    '剛才地板舒服嗎？還想再躺一次？',
    '理由很多，勝負畫面只有一個。',
    '你補多少紅水都補不回那場面子。',
    '別急，我原地等你回來送。',
    '網路延遲會讓你嘴巴變快喔？',
    '下次記得先買回卷，至少跑得掉。',
    '我還以為你下線了，原來在打字。',
    '再來一次也只是多一個趣味結局。',
    '你不是來尋仇，是來補我的擊殺數。',
    '裝備修好了再來，嘴巴不用修。',
    '位置報給你了，敢不敢真的出現？',
    '先練等吧，你現在只適合練嘴。',
    '剛才那場不夠清楚，要不要再示範？',
    '你慢慢找理由，我先繼續打怪。',
    '輸家密語這麼勤，戰鬥倒是挺快結束。'
];
const PVP_KILL_WHISPER_REVENGE_REPLIES = [
    '很好，這句我記住了，你等著。',
    '有種別換圖，我現在就去找你。',
    '嘴硬是吧？等我抓到你就知道。',
    '座標不用報，我自己查得到。',
    '行，紅水帶滿，我馬上回來。',
    '你成功惹到我了，這次別想飛。',
    '先別下線，我的回卷已經撕了。',
    '很好笑嗎？等等換我看你躺。',
    '我最喜歡嘴硬的，等著收密語。',
    '這句算你下的戰帖，我接了。'
];
const PVP_KILL_WHISPER_DISMISS_REPLIES = [
    '算了，跟你浪費時間。',
    '你慢慢得意，我懶得理你。',
    '嘴成這樣也沒比較強，先這樣。',
    '今天先放你一馬，別想太多。',
    '我還有事，沒空陪你打字。',
    '你就繼續在頻道自我安慰吧。',
    '算你會嘴，下次再說。',
    '我去練等了，你慢慢回味。',
    '懶得跟你爭，當你贏兩次。',
    '先不找你，不代表這場算了。'
];
let _pvpKillWhisperMenu = null;
let _pvpKillWhisperMenuHandler = null;
let _pvpKillWhisperChoiceState = null;
function _trollEncounterPick(list) {
    return list[Math.floor(Math.random() * list.length)] || '';
}
function _trollEncounterEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}
function logTrollEncounterTrashTalk(entry) {
    let name = entry && entry.n ? entry.n : entry;
    if (typeof logWorld !== 'function' || !name) return;
    let align = entry && entry.alignmentValue != null ? pvpClampAlignment(entry.alignmentValue) : 0;
    let nameHtml = pvpNameHtml(name, align, 'font-bold');
    logWorld(`<span class="wander-chat-out"><span class="wander-chat-arrow">-&gt;</span> <span class="wander-chat-target">[${nameHtml}]</span> ${_trollEncounterEsc(_trollEncounterPick(TROLL_ENCOUNTER_PLAYER_TAUNTS))}</span>`);
    logWorld(`<span class="wander-chat-in"><span class="wander-chat-speaker">[${nameHtml}]</span> ${_trollEncounterEsc(_trollEncounterPick(TROLL_ENCOUNTER_NPC_TAUNTS))}</span>`);
}
function logPvpRevengeTrashTalk(entry) {
    if (typeof logWorld !== 'function') return;
    let name = entry && entry.n ? entry.n : entry;
    if (!name) return;
    let align = entry && entry.alignmentValue != null ? pvpClampAlignment(entry.alignmentValue) : 0;
    let nameHtml = pvpNameHtml(name, align, 'font-bold');
    logWorld(`<span class="wander-chat-out"><span class="wander-chat-arrow">-&gt;</span> <span class="wander-chat-target">[${nameHtml}]</span> ${_trollEncounterEsc(_trollEncounterPick(PVP_KILL_WHISPER_PLAYER_REPLIES))}</span>`);
    logWorld(`<span class="wander-chat-in"><span class="wander-chat-speaker">[${nameHtml}]</span> ${_trollEncounterEsc(_trollEncounterPick(PVP_KILL_WHISPER_REVENGE_REPLIES))}</span>`);
}
function _pvpKillWhisperRecord(name) {
    pvpEnsureState();
    return (player.pvpKillWhispers || []).find(rec => rec && rec.n === name) || null;
}
function _pvpKillWhisperArg(name) {
    return encodeURIComponent(String(name || '')).replace(/'/g, '%27');
}
function _pvpKillWhisperTestBuild() {
    return !!(typeof window !== 'undefined' && window.__FB5_TEST_BUILD);
}
function _pvpKillWhisperPickThree() {
    let pool = PVP_KILL_WHISPER_PLAYER_REPLIES.slice();
    for (let i = pool.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, 3);
}
function _pvpKillWhisperLog(rec) {
    if (!rec || typeof logWorld !== 'function') return;
    let arg = _pvpKillWhisperArg(rec.n);
    let name = pvpNameHtml(rec.n, rec.alignmentValue, 'font-bold');
    let line = _trollEncounterPick(PVP_KILL_WHISPER_LINES);
    logWorld(
        `<span class="wander-chat-in"><button type="button" class="pvp-kill-whisper-name" ` +
        `onclick="openPvpKillWhisperMenu(decodeURIComponent('${arg}'),${rec.whisperSeq},event)">[${name}]</button> ` +
        `${_trollEncounterEsc(line)}</span>`
    );
}
function pvpPostKillWhisperTick() {
    if (!player || !player.cls) return;
    pvpEnsureState();
    let now = Date.now();
    let changed = false;
    let list = player.pvpKillWhispers || [];
    let kept = [];
    let expiredNames = [];
    list.forEach(rec => {
        if (!rec) { changed = true; return; }
        if (!rec.awaitingRevenge && rec.expiresAt && now >= rec.expiresAt) {
            expiredNames.push(rec.n);
            changed = true;
            return;
        }
        kept.push(rec);
        if (rec.revengeCount >= PVP_KILL_WHISPER_REVENGE_MAX || rec.awaitingRevenge) return;
        if (!rec.nextCheckAt || now < rec.nextCheckAt || now >= rec.expiresAt) return;
        let dueCount = 1 + Math.floor((now - rec.nextCheckAt) / PVP_KILL_WHISPER_INTERVAL_MS);
        let remainingChecks = Math.max(0, Math.ceil((rec.expiresAt - rec.nextCheckAt) / PVP_KILL_WHISPER_INTERVAL_MS));
        dueCount = Math.min(dueCount, remainingChecks);
        if (dueCount <= 0) return;
        rec.nextCheckAt += dueCount * PVP_KILL_WHISPER_INTERVAL_MS;
        rec.updatedAt = now;
        changed = true;
        let combinedChance = 1 - Math.pow(1 - PVP_KILL_WHISPER_CHANCE, dueCount);
        if (_pvpKillWhisperTestBuild() || Math.random() < combinedChance) {
            rec.whisperSeq += 1;
            _pvpKillWhisperLog(rec);
        }
    });
    if (kept.length !== list.length) {
        player.pvpKillWhispers = kept;
        expiredNames.forEach(name => pvpReleaseAlignLock(name));
    }
    if (changed) {
        try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
    }
}
function _closePvpKillWhisperMenu() {
    if (_pvpKillWhisperMenu && _pvpKillWhisperMenu.parentNode) _pvpKillWhisperMenu.parentNode.removeChild(_pvpKillWhisperMenu);
    _pvpKillWhisperMenu = null;
    _pvpKillWhisperChoiceState = null;
    if (_pvpKillWhisperMenuHandler) {
        try { document.removeEventListener('click', _pvpKillWhisperMenuHandler); } catch (e) {}
        _pvpKillWhisperMenuHandler = null;
    }
}
function _mountPvpKillWhisperMenu(menu, ev) {
    document.body.appendChild(menu);
    let x = ev && Number.isFinite(ev.clientX) ? ev.clientX : Math.round(window.innerWidth / 2);
    let y = ev && Number.isFinite(ev.clientY) ? ev.clientY : Math.round(window.innerHeight / 2);
    let rect = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y + 8, window.innerHeight - rect.height - 8)) + 'px';
    _pvpKillWhisperMenu = menu;
    setTimeout(() => {
        if (_pvpKillWhisperMenu !== menu) return;
        _pvpKillWhisperMenuHandler = e => {
            if (!_pvpKillWhisperMenu || !_pvpKillWhisperMenu.contains(e.target)) _closePvpKillWhisperMenu();
        };
        document.addEventListener('click', _pvpKillWhisperMenuHandler);
    }, 0);
}
function openPvpKillWhisperMenu(name, whisperSeq, ev) {
    if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }
    _closePvpKillWhisperMenu();
    let rec = _pvpKillWhisperRecord(name);
    let now = Date.now();
    whisperSeq = Math.max(0, Math.floor(Number(whisperSeq) || 0));
    if (!rec || rec.revengeCount >= PVP_KILL_WHISPER_REVENGE_MAX || rec.awaitingRevenge ||
        now >= rec.expiresAt || rec.whisperSeq !== whisperSeq || rec.repliedSeq >= whisperSeq) {
        if (typeof logSys === 'function') logSys('<span class="text-slate-400">這則密語已無法回覆。</span>');
        return;
    }
    let choices = _pvpKillWhisperPickThree();
    _pvpKillWhisperChoiceState = { name: rec.n, whisperSeq: whisperSeq, choices: choices, createdAt: now };
    let arg = _pvpKillWhisperArg(rec.n);
    let menu = document.createElement('div');
    menu.id = 'pvp-kill-whisper-menu';
    menu.className = 'pvp-kill-whisper-menu';
    menu.innerHTML =
        `<div class="pvp-kill-whisper-heading">選一句回 ${pvpNameHtml(rec.n, rec.alignmentValue, 'font-bold')}</div>` +
        choices.map((line, index) =>
            `<button type="button" onclick="pvpReplyToKillWhisper(decodeURIComponent('${arg}'),${whisperSeq},${index})">${_trollEncounterEsc(line)}</button>`
        ).join('');
    _mountPvpKillWhisperMenu(menu, ev);
}
function pvpReplyToKillWhisper(name, whisperSeq, choiceIndex) {
    let active = _pvpKillWhisperChoiceState;
    let line = active && active.name === name && active.whisperSeq === whisperSeq && Date.now() - active.createdAt < 5 * 60 * 1000
        ? active.choices[Math.max(0, Math.floor(Number(choiceIndex) || 0))]
        : '';
    _closePvpKillWhisperMenu();
    let rec = _pvpKillWhisperRecord(name);
    let now = Date.now();
    if (!line || !rec || rec.revengeCount >= PVP_KILL_WHISPER_REVENGE_MAX || rec.awaitingRevenge ||
        now >= rec.expiresAt || rec.whisperSeq !== whisperSeq || rec.repliedSeq >= whisperSeq) {
        if (typeof logSys === 'function') logSys('<span class="text-slate-400">這則密語已無法回覆。</span>');
        return;
    }
    rec.repliedSeq = whisperSeq;
    rec.updatedAt = now;
    let nameHtml = pvpNameHtml(rec.n, rec.alignmentValue, 'font-bold');
    if (typeof logSys === 'function') {
        logWorld(`<span class="wander-chat-out"><span class="wander-chat-arrow">-&gt;</span> <span class="wander-chat-target">[${nameHtml}]</span> ${_trollEncounterEsc(line)}</span>`);
    }
    let seeksRevenge = _pvpKillWhisperTestBuild() || Math.random() < PVP_KILL_WHISPER_REVENGE_CHANCE;
    if (seeksRevenge) {
        rec.revengeCount = Math.min(PVP_KILL_WHISPER_REVENGE_MAX, rec.revengeCount + 1);
        rec.awaitingRevenge = true;
        rec.expiresAt = now;
        rec.nextCheckAt = 0;
        pvpMarkForChase(rec);
        if (typeof logSys === 'function') {
            logWorld(`<span class="wander-chat-in"><span class="wander-chat-speaker">[${nameHtml}]</span> ${_trollEncounterEsc(_trollEncounterPick(PVP_KILL_WHISPER_REVENGE_REPLIES))}</span>`);
            let last = rec.revengeCount >= PVP_KILL_WHISPER_REVENGE_MAX;
            logSys(`<span class="text-rose-400 font-bold">${last ? '這是對方第 3 次也是最後一次尋仇；之後不再密語。' : '對方再次開始追殺你。'}</span>`);
        }
    } else if (typeof logSys === 'function') {
        logWorld(`<span class="wander-chat-in"><span class="wander-chat-speaker">[${nameHtml}]</span> ${_trollEncounterEsc(_trollEncounterPick(PVP_KILL_WHISPER_DISMISS_REPLIES))}</span>`);
    }
    try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
}
// 🎲 v3.6.22 玩家NPC普攻傷害＝「同等級怪物」傷害骰模型（用戶拍板·v3.6.23 起兩個模板 troll_*/troll2_* 全數適用）：移植 tools/mob-designer.js designMob 的非頭目路徑——
//   單一真相在工具（改曲線先改工具再同步這裡）；等級動態（玩家±10）→ 只能生成時計算。
//   只取 dmg/db：命中維持模板規則（hitBase + L/2·規格另有王族+5 等命中設定）；王族/戰士的常駐「額外傷害」(dbPlus) 疊在曲線 db 之上。
//   工具的「單擊帽壓 DPS→拉高命中補償」只動 hit 不動骰，此處不取 hit 故不移植該迴圈。
const _TROLL_CURVE_AC_PTS = [[1, -4], [20, -13], [40, -42], [60, -68], [65, -83], [75, -95], [90, -110]];
function _trollCurveGearedAC(L) {
    if (L <= 1) return -4;
    for (let i = 1; i < _TROLL_CURVE_AC_PTS.length; i++) {
        let x1 = _TROLL_CURVE_AC_PTS[i - 1][0], y1 = _TROLL_CURVE_AC_PTS[i - 1][1], x2 = _TROLL_CURVE_AC_PTS[i][0], y2 = _TROLL_CURVE_AC_PTS[i][1];
        if (L <= x2) return y1 + (L - x1) * (y2 - y1) / (x2 - x1);
    }
    return -110;
}
function _trollCurveStretchHv(raw) { if (raw >= 8) return Math.min(20, raw); let e = Math.min(30, 8 - raw), f = e / 30, h = 2 * f - f * f; return 8 - 7 * h; }
// 第三參 mult（😤 v3.6.24 用戶拍板）：曲線解出的每擊傷害 B「套完單擊帽後」整體倍率——一模板 2.0／二模板 2.5（v3.6.26·首設1.5/2.0）／法師兩模板皆 1（不掛 dmgMult）。
// 倍率放帽後＝刻意允許超出標準怪單擊上限；骰/db 比例與取整沿用同一套推導。
function _trollCurveDmgRaw(lv, atkSpd, mult) {
    lv = Math.max(1, Math.round(lv)); atkSpd = +atkSpd || 0.67;
    mult = (Number(mult) > 0) ? Number(mult) : 1;
    let fast = atkSpd < 2, sd = fast ? 5 / 6 : 2 / 3, n = fast ? 1 : 2;
    let S = lv < 25 ? 15 : lv < 50 ? 40 : 60.5;
    let A, dpsPerMob;
    if (lv <= 10)      { A = 8 - Math.floor(lv / 7); dpsPerMob = 0.80 * 15 / 5; }
    else if (lv <= 20) { A = 8 - Math.floor(lv / 7); dpsPerMob = 1.00 * 15 / 5; }
    else if (lv <= 25) { let t = (lv - 20) / 6; A = 6 + t * (-21.7 - 6); dpsPerMob = (1.0 + t * 0.25) * (15 + t * 25) / 5; }
    else               { A = _trollCurveGearedAC(lv); dpsPerMob = 1.25 * S / 5; }
    let hit = Math.max(0, Math.round((fast ? 8 : 0.56) - A));   // 命中錨（僅供解 B·不輸出）
    let blk = lv < 30 ? 0 : lv < 55 ? 60 : 100, bN = 1 - 0.5 * (blk * 0.3 / 100), bH = 1 - 0.5 * (blk / 100);
    let acGap = Math.max(0, 10 - A), rMax = Math.floor(acGap / 5), rMin = Math.floor(rMax / 3), M = (rMin + rMax) / 2;
    let shv = Math.max(1, Math.min(20, _trollCurveStretchHv(hit + A)));
    let pN0 = (1 + Math.max(0, Math.min(shv, 19) - 1)) / 20 - 0.05;
    let B = (dpsPerMob * atkSpd + (pN0 * bN + 0.05 * bH) * M + 0.05 * bH * n) / (pN0 * bN + 0.05 * bH * (1 + sd));
    let mhp = 14 + (lv - 1) * 11.5 + (lv >= 55 ? 100 : 0);
    let capFrac = lv <= 20 ? (fast ? 0.12 : 0.25) : lv <= 25 ? (fast ? (0.12 + (lv - 20) / 6 * 0.03) : (0.25 + (lv - 20) / 6 * 0.05)) : (fast ? 0.15 : 0.30);
    let Bcap = (capFrac * mhp + n + rMin) / (1 + sd);
    if (B > Bcap) B = Bcap;
    B *= mult;   // 😤 v3.6.24 模板倍率（帽後）
    let db = Math.max(0, Math.round((1 - sd) * B));
    let eRoll = sd * B;
    let sides = Math.max(2, Math.round(2 * eRoll / n - 1));
    while (sides > 99) { n++; sides = Math.max(2, Math.round(2 * eRoll / n - 1)); }
    return { dmg: [n, sides], db: db };
}
function trollCurveDmgJson(lv, atkSpd, mult) {
    return JSON.stringify(_trollCurveDmgRaw(lv, atkSpd, mult));
}
function trollCurveDmg(lv, atkSpd, mult) {
    try {
        let parsed = JSON.parse(trollCurveDmgJson(lv, atkSpd, mult));
        if (parsed && Array.isArray(parsed.dmg) && parsed.dmg.length === 2
            && parsed.dmg.every(Number.isFinite) && Number.isFinite(parsed.db)) return parsed;
    } catch (e) {}
    return _trollCurveDmgRaw(lv, atkSpd, mult);
}
function scaledEnemyHp(level, coefficient) {
    return coefficient * level;
}
function scaledEnemyArmorClass(level, baseArmorClass, divisor) {
    return baseArmorClass - Math.floor(level / divisor);
}
function scaledEnemyMagicResistance(level, baseResistance, divisor) {
    return baseResistance + Math.floor(level / divisor);
}
function scaledEnemyDamageBonus(level, halfLevel, extra) {
    return (halfLevel ? Math.floor(level / 2) : level) + extra;
}
function scaledEnemyHit(level, baseHit) {
    return baseHit + Math.floor(level / 2);
}
function scaledEnemyThresholdValue(level, threshold, lowValue, highValue) {
    return level >= threshold ? highValue : lowValue;
}
function applyTrollScaling(mob, levelOverride) {
    let requested = Number(levelOverride);
    let L = Number.isFinite(requested) ? Math.round(requested) : Math.round(Number(player.lv) || 1) + pvpRandomLevelOffset();
    L = Math.max(1, L);
    let s = mob.scale || {};
    mob.lv = L;
    mob.hp = scaledEnemyHp(L, s.hpC || 12); mob.curHp = mob.hp;
    mob.ac = scaledEnemyArmorClass(L, s.acBase !== undefined ? s.acBase : -10, s.acDiv || 4);
    mob.mr = scaledEnemyMagicResistance(L, s.mrBase || 0, s.mrDiv || 5);
    mob.exp = 0; mob.goldMin = 0; mob.goldMax = 0;
    mob.atkSpd = s.atkSpd || 0.67;
    if (s.curveDmg) {   // 🎲 v3.6.22 玩家NPC：普攻骰＝同等級怪物曲線（依本模板攻速）×模板倍率(dmgMult·v3.6.24)＋常駐額外傷害(dbPlus)
        let _cv = trollCurveDmg(L, mob.atkSpd, s.dmgMult);
        mob.dmg = _cv.dmg;
        mob.db = _cv.db + (s.dbPlus || 0);
    } else {
        mob.dmg = [1, s.dmgSides || 10];
        mob.db = scaledEnemyDamageBonus(L, !!s.dbHalf, s.dbPlus || 0);
    }
    mob.hit = scaledEnemyHit(L, s.hitBase || 0);
    mob.regenHp = mob.regenFix || scaledEnemyThresholdValue(L, 50, 40, 60);
    mob.regenEvery = 20;
    if (s.er) mob.er = s.er;
}

function applyPledgeEnemyScaling(mob) {
    let L = Math.max(1, player.lv);
    let s = mob.scale || {};
    mob.lv = L;
    mob.hp = scaledEnemyHp(L, s.hpC || 20);
    mob.curHp = mob.hp;
    mob.ac = scaledEnemyArmorClass(L, s.acBase !== undefined ? s.acBase : -10, s.acDiv || 2);
    mob.mr = scaledEnemyMagicResistance(L, s.mrBase || 0, s.mrDiv || 10);
    mob.exp = 0;        // 🔧 血盟敵人：經驗值設為 0
    mob.goldMin = 0;    // 🔧 血盟敵人：金錢設為 0
    mob.goldMax = 0;
    mob.dmg = [1, s.dmgSides || 10];
    mob.db = scaledEnemyDamageBonus(L, !!s.dbHalf, 0);   // 一般攻擊傷害加成：+(玩家等級)；喬/賽尼斯(dbHalf) 為 +(玩家等級/2)
    mob.hit = scaledEnemyHit(L, s.hitBase || 0);      // 額外命中：基底 +(玩家等級/2)
    mob.atkSpd = s.atkSpd || 0.67;
    mob.regenHp = scaledEnemyThresholdValue(L, 50, 15, 40);            // 常駐被動：HP 未滿時的回復量
    mob.regenEvery = scaledEnemyThresholdValue(L, 50, 10, 20);        // 50~100：每2秒回40；50以下：每1秒回15
}

// 生命的祝福：每 tick 推進；達到間隔時為場上所有血盟怪物（HP 未滿）回復，持續期滿自動結束
function pledgeBlessTick() {
    let pb = mapState.pledgeBless;
    if(!pb) return;
    pb.left--;
    pb.nextIn--;
    if(pb.nextIn <= 0) {
        pb.nextIn = pb.interval;
        let healed = false;
        mapState.mobs.forEach(m => {
            if(m && m.race === '血盟' && m.curHp > 0 && m.curHp < m.hp) {
                m.curHp = Math.min(m.hp, m.curHp + roll(pb.dice[0], pb.dice[1]) + pb.bonus);
                healed = true;
            }
        });
        if(healed && !state.ff) renderMobs();
    }
    if(pb.left <= 0) mapState.pledgeBless = null;
}

function spawnMob(idx) {
    if (mapState.current === 'rift_battle') { spawnRiftMob(idx); return; }   // 🌀 時空裂痕：自訂動態出怪（不靠 DB.maps）
    let pool = DB.maps[mapState.current];
    if(!pool) return;
    // 🐉 v3.7.57 侵蝕的安塔瑞斯巢穴：棲息地=中央「被侵蝕的安塔瑞斯」+其餘「大地荒龍」；入口/通道/深處=中央固定區域頭目（場上無王時）、其餘格走 DB.maps 池
    //    ⚠️ 刻意不掛 KING_ROOMS/PURE_BOSS_MAPS：前者會觸發 _kbVictory 傳送與非頭目掉落封鎖、後者只生中央格，皆與副本規格衝突。
    let _antharasDungeon = typeof ANTHARAS_AREA_BOSS !== 'undefined' && !!ANTHARAS_AREA_BOSS[mapState.current];
    if (_antharasDungeon) {
        let _aid = null;
        if (mapState.current === 'antharas_lair') _aid = (idx === 1) ? ANTHARAS_AREA_BOSS.antharas_lair : 'ant_earth_wild_dragon';
        else if (idx === 1 && !mapState.mobs.some(m => m && m.boss && !m._dead)) _aid = ANTHARAS_AREA_BOSS[mapState.current];
        if (_aid) {
            let _ab = DB.mobs[_aid]; if (!_ab) return;
            mapState.mobs[idx] = { ..._ab, curHp: _ab.hp, uid: uid(), _born: ++_mobBornSeq, _bornMs: Date.now(), _magCd: {}, justHit: false, st: newMobStatus() };
            applySherineBuff(idx);   // 🐉 v3.7.61 初始區域頭目也套用席琳世界，與後續變身階段一致
            if (_ab.hard) initHardSkin(mapState.mobs[idx]);
            if (_ab.boss && typeof vfxBossEntrance === 'function') vfxBossEntrance(mapState.mobs[idx]);
            renderMobs(); return;
        }
        // 其餘格落到下方一般出怪（喀瑪/荒龍池）
    }
    // 🔧 軍王之室：中央(1)固定 BOSS、其餘四格固定指定小怪（不走一般出怪/席琳強化/追蹤邏輯）
    if(KING_ROOMS[mapState.current]) {
        let _kr = KING_ROOMS[mapState.current];
        let _id;
        if(_kr.dual) { _id = _kr.bosses[idx]; if(!_id) { mapState.mobs[idx] = null; return; } }   // 🏛️ 雙BOSS祭壇：0,1 兩格各一隻BOSS（第三格留空）
        else _id = (idx === 1) ? _kr.boss : _kr.minion;
        let _b = DB.mobs[_id]; if(!_b) return;
        mapState.mobs[idx] = { ..._b, curHp: _b.hp, uid: uid(), _born: ++_mobBornSeq, _bornMs: Date.now(), _magCd: {}, justHit: false, st: newMobStatus() };
        applySherineBuff(idx);   // 🔮 軍王之室／底比斯歐西里斯祭壇也吃「席琳的世界」強化＋_sherine（與一般出怪一致；不含恩賜 grace；須在 initHardSkin 之前）
        if(mapState.mobs[idx].hard) initHardSkin(mapState.mobs[idx]);
        if (_b.boss && typeof vfxBossEntrance === 'function') { try { vfxBossEntrance(mapState.mobs[idx]); } catch (e) {} }   // 🐉 v3.4.95 軍王之室／祭壇頭目也播出場特效
        return;
    }
    // 🆕 2026-06：後排格(3,4)現在也會 roll 頭目——原本後排不出王，但死亡輸送帶把存活怪往前壓實、空格往後堆→補位幾乎都落在後排、跳過頭目判定而稀釋出王率；故 wantBoss/卡瑞/林德拜爾改成全 5 格皆判定（idx>=3 不再排除頭目）
    let bossInBattle = mapState.mobs.some(m => m && m.boss);
    let bossPool = pool.filter(id => DB.mobs[id] && DB.mobs[id].boss);
    let normalPool = pool.filter(id => DB.mobs[id] && !DB.mobs[id].boss);
    let mobId;
    let siegeArea = isSiegeArea(mapState.current);
    let npcClanBattle = !_antharasDungeon && typeof npcClanGroupBattleActive === 'function' && npcClanGroupBattleActive();
    let wcMassTauntBattle = !_antharasDungeon && typeof wcMassTauntGroupBattleActive === 'function' && wcMassTauntGroupBattleActive();
    let allowMultiBoss = backSlotsActive() && !siegeArea;   // 🆕 一般5格地圖可同時出現多隻頭目；攻城雖改為5格，仍維持單一城門／守護塔
    // 🏛️ 長老之室 BOSS 節流：場上最多同時 2 隻長老 BOSS；已有 1 隻時須該 BOSS 存活滿 3 分鐘才可能出現第 2 隻
    let _elderRoom = mapState.current === 'elder_room';
    let _elderBossOk = true;
    if (_elderRoom) {
        let _ab = mapState.mobs.filter(m => m && m.boss && m.curHp > 0 && !m._dead);
        if (_ab.length >= 2) _elderBossOk = false;
        else if (_ab.length === 1) _elderBossOk = (Date.now() - (_ab[0]._bornMs || Date.now())) >= 180000;
    }
    let _normalBossChance = Math.max(0.01, Math.min(1, (((player && player.d && player.d.bossEncounterPct) || 1) / 100)));
    let wantBoss = !npcClanBattle && !wcMassTauntBattle && (allowMultiBoss || !bossInBattle) && bossPool.length > 0 && (!_elderRoom || _elderBossOk) && (mapState.forceBoss || (siegeArea ? (!mapState.suppressSiegeBoss && Math.random() < 0.10) : (_elderRoom ? Math.random() < 0.05 : Math.random() < _normalBossChance)));
    if(mapState.forceBoss) mapState.forceBoss = false;   // 強制旗標只作用於下一次生怪
    if(wantBoss) {
        // 🔧 同名BOSS限制：場上已有同名BOSS時不再抽到該名→需地圖池有 2 種以上「不同名」BOSS 才可能同時出現多隻；若無不同名可出則退回一般怪
        let _onFieldBoss = mapState.mobs.filter(m => m && m.boss).map(m => m.n);
        let _bossPick = bossPool.filter(id => !_onFieldBoss.includes(DB.mobs[id].n));
        if (_bossPick.length > 0) mobId = _bossPick[Math.floor(Math.random() * _bossPick.length)];
        else wantBoss = false;
    }
    if(!wantBoss) {
        let safePool = normalPool.length > 0 ? normalPool : pool;
        if (siegeArea) {   // 攻城區：避免場上同時出現兩名以上同名敵人
            let onFieldNames = mapState.mobs.filter(m => m).map(m => m.n);
            let uniquePool = safePool.filter(id => DB.mobs[id] && !onFieldNames.includes(DB.mobs[id].n));
            if (uniquePool.length > 0) safePool = uniquePool;
        }
        mobId = safePool[Math.floor(Math.random() * safePool.length)];
        if (siegeArea) {
            let _onF = mapState.mobs.filter(m => m).map(m => m.n);
            let _defClanId = typeof npcClanSiegeDefenderId === 'function' ? npcClanSiegeDefenderId() : null;
            let _siegePvp = pvpCreateRandomOpponent(_onF, _defClanId ? {
                defenderClanId:_defClanId,
                defenderChance:0.5
            } : null);
            _siegePvp.siegePlayer = true;
            _siegePvp.siegeLevel = Math.max(1, player.lv + Math.floor(Math.random() * 21) - 10);
            mobId = trollPickClassMob(_siegePvp.avatar);   // 😤 v3.6.20 70%/30% 模板抽選
            mapState._trollSpawn = _siegePvp;
        }
        // PVP／NPC 血盟宣戰：依宣戰方向決定野外遭遇率與敵盟占比。
        if (typeof pvpEnsureState === 'function') pvpEnsureState();
        let _clanEncounter = typeof npcClanEncounterProfile === 'function'
            ? npcClanEncounterProfile(player)
            : null;
        let _wildPvpChance = _clanEncounter && _clanEncounter.active
            ? _clanEncounter.chance
            : PVP_WILD_CHANCE;
        let _wildPvpAllowed = !!player.pvpOn || !!(_clanEncounter && _clanEncounter.npcInitiated);
        if (_wildPvpAllowed && typeof MAP_CATEGORIES !== 'undefined' && MAP_CATEGORIES.wild
            && MAP_CATEGORIES.wild.some(m => m.v === mapState.current)
            && !PURE_BOSS_MAPS.includes(mapState.current) && !isSiegeArea(mapState.current)
            && Math.random() < _wildPvpChance) {
            let _onF = mapState.mobs.filter(m => m).map(m => m.n);
            let _clanOpts = _clanEncounter && _clanEncounter.active ? {
                warEncounter:true,
                encounterClanIds:_clanEncounter.clanIds,
                enemyClanChance:_clanEncounter.enemyClanChance
            } : null;
            let _pvp = pvpCreateRandomOpponent(_onF, _clanOpts);
            if (_pvp && !_onF.includes(_pvp.n)) {
                mobId = trollPickClassMob(_pvp.avatar);   // 😤 v3.6.20 70%/30% 模板抽選
                mapState._trollSpawn = _pvp;
            }
        }
        // 😤 v3.5.59 白目玩家：被記仇(player.trollPlayers·js/24 嗆聲觸發)→野外(非BOSS房/非攻城)重生 5% 機率遭遇；同名不同時出現；逾期(2小時)自動移除
        if (!_antharasDungeon && player.trollPlayers && player.trollPlayers.length) {
            let _now = Date.now();
            let _tl = player.trollPlayers.filter(t => t && (t.noExpire || t.pvpRevenge || t.until > _now));
            if (_tl.length !== player.trollPlayers.length) {
                let _keep = new Set(_tl.map(t => t && t.n));
                let _expiredNames = player.trollPlayers.filter(t => t && t.n && !_keep.has(t.n)).map(t => t.n);
                player.trollPlayers = _tl;
                _expiredNames.forEach(n => { if (typeof pvpReleaseAlignLock === 'function') pvpReleaseAlignLock(n); });
            }
            if (_tl.length && !PURE_BOSS_MAPS.includes(mapState.current) && !isSiegeArea(mapState.current) && Math.random() < ((typeof window !== 'undefined' && window.__FB5_TEST_BUILD) ? 1 : 0.05)) {   // 🧪 TEST版：野外重生必定遭遇（正式版 5%）
                let _onF = mapState.mobs.filter(m => m).map(m => m.n);
                let _cand = _tl.filter(t => !_onF.includes(t.n));
                if (_cand.length) {
                    let _t = _cand[Math.floor(Math.random() * _cand.length)]; mobId = trollPickClassMob(_t.avatar); mapState._trollSpawn = _t;   // 😤 v3.6.20 70%/30% 模板抽選
                    if (typeof pvpLockAlignment === 'function') _t.alignmentValue = pvpLockAlignment(_t.n, _t.alignmentValue, _t.clanId);
                }
            }
        }
    }
    
    // 魔物追蹤：在追蹤地圖且追蹤有效期間，每次出怪 50% 固定機率改為被追蹤的怪物（🏺 v3.2.17 裝備 小獵犬的追蹤鼻 → 70%）
    if(player.tracking && player.tracking.until > Date.now() && player.tracking.map === mapState.current
       && DB.maps[mapState.current] && DB.maps[mapState.current].includes(player.tracking.mob)
       && DB.mobs[player.tracking.mob] && !DB.mobs[player.tracking.mob].boss) {
        let _trkRate = 0.5;
        try { for (let _k in player.eq) { let _e = player.eq[_k]; if (_e && DB.items[_e.id] && DB.items[_e.id].trackBoost) { _trkRate = 0.7; break; } } } catch (e) {}
        if (Math.random() < _trkRate) mobId = player.tracking.mob;
    }
    // 🔧 卡瑞（BOSS）：身上「同時」攜帶 飛龍的爪子/蜥蜴的角/水晶球/妖魔戰士護身符 時，
    //    於龍之谷地監6樓 1% 機率出現（場上無其他 BOSS 時才出現，且同時最多一隻）
    if (mapState.current === 'zone_31'
        && !bossInBattle
        && !mapState.mobs.some(m => m && m.n === '卡瑞')
        && ['item_dragon_claw', 'item_lizard_horn', 'item_crystal_ball', 'item_orc_amulet'].every(q => player.inv.some(i => i.id === q && i.cnt > 0))
        && Math.random() < 0.01) {
        mobId = 'kari';
    }
    // 🔥 50級試煉：大洞穴隱遁者村莊地區 1% 出現「魔族暗殺團」（妖精 stage2 收集密封情報書／法師 stage1 收集間諜報告書）
    if (mapState.current === 'hidden_cave' && !mapState.mobs.some(m => m && m.n === '魔族暗殺團')
        && ((player.cls === 'elf' && player.trialStage === 2 && !player.inv.some(i => i.id === 'item_sealed_intel'))
            || (player.cls === 'mage' && player.trialStage === 1 && !player.inv.some(i => i.id === 'item_spy_report')))
        && Math.random() < 0.01) {
        mobId = 'demon_assassin';
    }
    // 🐉 林德拜爾（BOSS）：身上持有任意「幼龍蛋」（頑皮／淘氣）於任一野外地圖時，1% 機率改為刷出林德拜爾
    //    （場上無其他 BOSS 時才出現、同時最多一隻；蛋全數賣出或存入倉庫即不再遭遇）
    if (!bossInBattle
        && MAP_CATEGORIES.wild.some(m => m.v === mapState.current)
        && !mapState.mobs.some(m => m && m.n === '林德拜爾')
        && player.inv.some(i => (i.id === 'item_dragon_egg' || i.id === 'item_dragon_egg2') && i.cnt > 0)
        && Math.random() < 0.01) {
        mobId = 'lindvior';
    }
    let _actualPlayerEncounter = mapState._trollSpawn && DB.mobs[mobId] && DB.mobs[mobId].trollPlayer;
    if (!npcClanBattle && !wcMassTauntBattle && _actualPlayerEncounter && typeof wcMassTauntMaybeStartGroupBattle === 'function' &&
        wcMassTauntMaybeStartGroupBattle(mapState._trollSpawn)) wcMassTauntBattle = true;
    if (wcMassTauntBattle && typeof wcMassTauntGroupBattleNextOpponent === 'function') {
        let _massPvp = wcMassTauntGroupBattleNextOpponent();
        if (!_massPvp) { delete mapState._trollSpawn; mapState.mobs[idx] = null; return; }
        mobId = trollPickClassMob(_massPvp.avatar);
        mapState._trollSpawn = _massPvp;
    } else if (npcClanBattle && typeof npcClanCreateGroupBattleOpponent === 'function') {
        let _battle = mapState.npcClanBattle;
        let _groupPvp = npcClanCreateGroupBattleOpponent(_battle && _battle.clanId);
        if (_groupPvp) {
            mobId = trollPickClassMob(_groupPvp.avatar);
            mapState._trollSpawn = _groupPvp;
        }
    }
    if (mapState._trollSpawn && (!DB.mobs[mobId] || !DB.mobs[mobId].trollPlayer)) delete mapState._trollSpawn;
    let base = DB.mobs[mobId];
    if(!base) return;
    mapState.mobs[idx] = { ...base, curHp: base.hp, uid: uid(), _born: ++_mobBornSeq, _magCd: {}, justHit: false, st: newMobStatus(), _bornMs: Date.now() };   // 🏛️ _bornMs：生成時間（長老之室 BOSS 3 分鐘節流用）；_born：出生序（鎖定最早出生用）
    // 弓：場上原本沒有任何敵人時，第一個出現的敵人不論主動/被動，都強制視為被動（搭配弓攻擊3秒延遲，可先手放風箏）
    if(!base.boss && player.eq.wpn && DB.items[player.eq.wpn.id] && DB.items[player.eq.wpn.id].isBow && !mapState.mobs.some((m, j) => m && j !== idx)) {
        mapState.mobs[idx].beh = '被動';   // 頭目除外，維持主動
    }
    if(base.pledgeEnemy) applyPledgeEnemyScaling(mapState.mobs[idx]);   // 血盟敵人：依玩家等級縮放
    if(base.trollPlayer) {   // 😤 白目玩家：等級縮放＋名稱=叫賣NPC本人＋戰鬥動態=玩家職業動畫（v3.5.64·assets/anim/玩家<avatar>·從職業動畫產出·idle/attack/hurt/death/skill＋_s 影子全套·動態註冊 MOB_ANIM_ALIAS 真共用）
        let _t = mapState._trollSpawn;
        if (_t && !_t._npcClanAssigned && typeof npcClanAssignOpponent === 'function') {
            _t = npcClanAssignOpponent(_t) || _t;
            mapState._trollSpawn = _t;
        }
        if (_t && typeof pvpLockAlignment === 'function') {
            _t.alignmentValue = pvpLockAlignment(_t.n, _t.alignmentValue, _t.clanId);
        }
        applyTrollScaling(mapState.mobs[idx], pvpTrollLevelOverride(_t));
        if (_t) {
            mapState.mobs[idx].n = _t.n;
            mapState.mobs[idx]._pvpAlignment = pvpClampAlignment(_t.alignmentValue);
            mapState.mobs[idx]._pvpAvatar = TROLL_CLASS_BY_AVATAR[_t.avatar] ? _t.avatar : "男戰士";
            mapState.mobs[idx]._pvpLevelOffset = pvpResolveLevelOffset(_t);
            mapState.mobs[idx]._pvpRandom = !!_t.pvpRandom;
            mapState.mobs[idx]._pvpRevenge = !!_t.pvpRevenge;
            mapState.mobs[idx]._npcClanId = _t.clanId || null;
            mapState.mobs[idx]._npcClanName = _t.clanName || '';
            mapState.mobs[idx]._npcClanLeader = !!_t.clanLeader;
            mapState.mobs[idx]._npcClanAtWar = !!_t.clanAtWar;
            mapState.mobs[idx]._npcClanConflict = !!_t.clanConflict;
            mapState.mobs[idx]._npcClanHasCastle = !!_t.clanHasCastle;
            mapState.mobs[idx]._npcClanBattle = !!_t._npcClanBattle;
            mapState.mobs[idx]._wcMassTauntBattle = !!_t._wcMassTauntBattle;
            mapState.mobs[idx]._wcMassTauntBattleKey = _t._wcMassTauntBattleKey || '';
            if (_t.siegePlayer) {
                mapState.mobs[idx].siegeEnemy = true;
                mapState.mobs[idx]._siegePlayer = true;
                mapState.mobs[idx].race = '玩家';
                mapState.mobs[idx].exp = 30 * mapState.mobs[idx].lv;
                mapState.mobs[idx].goldMin = 0;
                mapState.mobs[idx].goldMax = 0;
            }
            mapState.mobs[idx].img = "assets/classanim/" + (mapState.mobs[idx]._pvpAvatar || "男戰士") + "F/unarmed_idle_0.png";   // 動畫缺檔時的靜態後備
            if (typeof MOB_ANIM_NAMES !== "undefined" && typeof MOB_ANIM_ALIAS !== "undefined") {
                let _dir = "玩家" + (mapState.mobs[idx]._pvpAvatar || "男戰士");
                if (MOB_ANIM_ALIAS[_t.n] !== _dir) {   // 首次註冊或同名 NPC 換頭像→更新 alias 並清舊幀快取（cache keyed by 名）
                    MOB_ANIM_ALIAS[_t.n] = _dir;
                    if (typeof _mobAnimCache !== "undefined") delete _mobAnimCache[_t.n];
                }
                MOB_ANIM_NAMES.add(_t.n);
                if (typeof MOB_ANIM_SPRITE_SHADOW !== "undefined") MOB_ANIM_SPRITE_SHADOW.add(_t.n);   // 16 職業資料夾皆含 _s 影子層
            }
            if (!_t._wcMassTauntBattle) logTrollEncounterTrashTalk(_t);
        }
        delete mapState._trollSpawn;
    }
    if(base.siegeEnemy) applySiegeEnemyScaling(mapState.mobs[idx]);   // 攻城敵人：依玩家等級縮放
    applySherineBuff(idx);   // 🔮 席琳的世界強化＋_sherine（與時空裂痕共用 applySherineBuff）
    if(mapState.mobs[idx].hard) initHardSkin(mapState.mobs[idx]);   // 🔧 硬皮：依等級/頭目/席琳世界初始化硬皮值（須在席琳 _sherine 標記之後）
    // 🔧 攻城城門/守護塔 HP 跨地圖保留（兩座城共用 gateHp/towerHp，依當前攻城城池的城門/塔名稱判定）
    if(base.siegeEnemy && player.siege) {
        let _sc = siegeCityCfg();
        if(base.n === _sc.gate && player.siege.gateHp > 0) mapState.mobs[idx].curHp = Math.min(mapState.mobs[idx].hp, player.siege.gateHp);
        if(base.n === _sc.tower && player.siege.towerHp > 0) mapState.mobs[idx].curHp = Math.min(mapState.mobs[idx].hp, player.siege.towerHp);
    }
    // 🌑 v3.3.33 吉爾塔斯 HP 保留（黑暗妖精聖地.md）：戰敗時持完整的召喚球→js/05 revive 消耗 1 顆並記錄 player.giltasKeep；
    //    下次進入受詛咒聖地首次生成時還原 HP（一次性·還原即清除→之後離開再進＝全新吉爾塔斯）
    if(mobId === 'sanct_giltas' && player.giltasKeep && player.giltasKeep.hp > 0) {
        mapState.mobs[idx].curHp = Math.min(mapState.mobs[idx].hp, player.giltasKeep.hp);
        player.giltasKeep = null;
        logSys('<span class="text-red-300">完整的召喚球之力仍束縛著吉爾塔斯——牠的傷勢沒有癒合！</span>');
    }

    applySherineGrace(idx);   // 🔮 席琳的恩賜：1% 機率場上一隻一般怪變恩賜怪（與時空裂痕共用 applySherineGrace）
    if (base.boss && typeof vfxBossEntrance === 'function') { try { vfxBossEntrance(mapState.mobs[idx]); } catch (e) {} }   // 🐉 頭目出場特效＋螢幕震動（cosmetic·v3.4.95 起全頭目通用：名單有專屬配色/稱號·未註冊者依屬性配色·吃 __vfxOff/補跑）
    if (mapState.mobs[idx]._wcMassTauntBattle && typeof wcMassTauntGroupBattleFill === 'function') wcMassTauntGroupBattleFill();
    if (!state.ff && !mapState._wcMassTauntBattleFilling) renderMobs();
}

function getMobColor(mobLv) {
    return "mc-mobname";   // 🔧 戰鬥日誌怪名＝淡金色（2026-06）：怪卡名已統一白色(getMobNameClass 直接回白)，日誌怪名改金色以與其他白色訊息區隔；getMobColor 主要供 logCombat 怪名 span 使用
}

// 怪物名稱顯示用 class：一律白。白鎖規則＝css/style.css 的 `#battle-view .mob-name, #battle-view .mob-name span { color:#fff!important }`
//   （⚠️改用選擇器指路·行號會漂移；同區塊另有 `#battle-view .mob-name { opacity:0 }` 的名字淡入規則，勿混）；
//   頭目(含血盟頭目)固定鮮紅由其下一條 `#battle-view .mob-name span.mob-name-boss` 高優先規則設定
// 🗑️ v3.5.87 修正過時註解：舊「血盟固定鮮紅+特效／頭目保留等差」描述已與實作相反（等差色與 pledgeNameGlow 皆已移除）
function getMobNameClass(m) {
    // 👑 頭目(含血盟頭目)名稱固定鮮紅(mob-name-boss·紅色由 CSS 設定)；其餘(含血盟一般怪)維持白色
    if (m && m.boss) return 'mc-white font-bold mob-name-boss';
    return 'mc-white font-bold';
}

function getTarget() {
    let t = mapState.mobs[mapState.targetIdx];
    if (t && t._dead) t = null;   // 🔧 架構#2：已死亡待清算的怪不可作為目標
    // 🎯 v3.0.11 當前目標不存在（如剛開局或剛擊殺）時，自動鎖定「最早出生」的活怪（_born 最小＝在場上存活最久）。
    //    _born＝全域單調出生序（spawnMob/spawnRiftMob/軍王之室 三處生成時戳記）；缺 _born 的怪（理論上不會有）以 Infinity 墊底、再以格位序 tiebreak。
    //    手動點擊鎖定（setTarget）不受影響：鎖定目標存活期間不會被此邏輯改鎖。
    if(!t) {
        let best = -1, bestBorn = Infinity;
        for(let i = 0; i < mapState.mobs.length; i++) {
            let m = mapState.mobs[i];
            if(!m || m._dead) continue;
            let b = (m._born != null) ? m._born : Infinity;
            if(b < bestBorn) { bestBorn = b; best = i; }
        }
        if(best >= 0) {
            setTarget(best);
            return mapState.mobs[best];
        }
    }
    return t;
}

function setTarget(idx) {
    mapState.targetIdx = idx;
    renderMobs();
}

// ===== 物理傷害與命中核心計算（遠近距離拆分）=====
// 近距離武器：依 力量(近距離傷害/命中/爆擊)；遠距離武器：依 敏捷(遠距離傷害/命中/爆擊)
// 命中判定值重塑：rawHitValue >= 8(約 40% 命中)以上維持原樣；低於此不再急墜到地板，
// 而是把「剩下到地板(hitValue=1)的命中差」用遞減方式分配到接下來 30 點 AC，逐步逼近地板，
// 保留 5% 必中(nat20)＋5% 擦傷(nat19，僅玩家打怪)的命中地板。小數判定值以隨機進位實現期望值。
function stretchedHitExpectedValue(raw) {
    let hv;
    if (raw >= 8) hv = Math.min(20, raw);
    else {
        let e = Math.min(30, 8 - raw);      // 超出「40% 命中點」的 AC 量 (0~30)
        let frac = e / 30;                  // 0~1
        let h = 2 * frac - frac * frac;     // 凹函數：前段增量大、後段小 → 遞減分配
        hv = 8 - 7 * h;                     // 由 8 遞減到 1（可為小數）
    }
    return hv;
}
function stretchHitValue(raw) {
    let hv = stretchedHitExpectedValue(raw);
    let lo = Math.floor(hv);
    let hvInt = lo + ((Math.random() < (hv - lo)) ? 1 : 0);
    return Math.max(1, Math.min(20, hvInt));
}

// 高難度目標的物理命中軟下限：近戰與遠距離共用，依角色的總物理命中逐階提升。
// 一般怪物不套用；席琳世界、頭目與困難怪才啟用，最高只保證判定值 5，仍會逐擊擲骰。
function physicalHitSoftFloor(hitBonus, target) {
    if (!target || !(target.boss || target.hard || target._sherine)) return 1;
    return Math.max(1, Math.min(5,
        1 + Math.floor(Math.max(0, Number(hitBonus) || 0) / 20)
    ));
}
// 🏺 遺物 魔力塑造的海洋水晶球：潮濕（_wetUntil）目標受到的下一次「風屬性」傷害 ×2 並立即解除潮濕。回傳傷害乘數（1 或 2）。掛在各風屬性傷害結算點（物理 getPhysicalDmg／魔法 castSkillInner／procFreeMagicSkill）。
function consumeWetMult(target, ele) {
    if (target && ele === 'wind' && (target._wetUntil || 0) > state.ticks) { target._wetUntil = 0; return 2; }
    return 1;
}
function getPhysicalDmg(diceStr, target, wpn, arrowData, forceHeavy, forceHit, forceLand, forceCrit, wpnInst, forceGraze, probe) {
    let isRanged = !!(wpn && wpn.ranged);
    let hitBonus = (isRanged ? player.d.rangedHit : player.d.meleeHit) + player.d.extraHit + (player._skillHitBonus || 0);   // 🗼 范德之劍：施展衝擊之暈時本次技能近距離命中+1
    let dmgBonus = (isRanged ? player.d.rangedDmg : player.d.meleeDmg);
    // 🌅 日出之國異常（玩家承受）：弱化＝傷害−5/命中−2；疾病＝命中−4（AC+8 在敵方命中端）；目盲＝命中−6
    if (player.statuses) {
        if (player.statuses.weaken > 0) { dmgBonus -= 5; hitBonus -= 2; }
        if (player.statuses.disease > 0) hitBonus -= 4;
        if (player.statuses.blind > 0) hitBonus -= 6;
    }
    if (player.buffs && player.buffs.haste > 0 && wpn && wpn.hasteStrike) { hitBonus += 30; dmgBonus += 30; }   // 🏺 遺物 殺人蜂的尾刺：加速狀態時額外傷害/命中 +30（命中後於 playerAttack 清除加速）
    let critRate = isRanged ? player.d.rangedCrit : player.d.meleeCrit;
    let critDmg  = isRanged ? player.d.rangedCritDmg : player.d.meleeCritDmg;
    if (!isRanged && player.d.critDmgLowHp && player.hp < player.d.critDmgLowHp.hp) critDmg += (player.d.critDmgLowHp.add || 0);   // 🏺 鬥士的決戰服裝：剩餘 HP 低於門檻時近距離爆擊傷害 +add%

    // 命中判定 = 投擲一顆20面骰，骰到1必定未命中，骰到20為重擊，2~19 則 命中值 >= 判定即命中
    let rawHitValue = player.lv + hitBonus - target.lv + mobEffAC(target);
    let hitValue = stretchHitValue(rawHitValue);
    hitValue = Math.max(hitValue, physicalHitSoftFloor(hitBonus, target));
    if (player.buffs && player.buffs.sk_warrior_outlaw > 0) hitValue = Math.max(hitValue, 10);   // ⚔️ 亡命之徒：一般攻擊最低命中率 50%

    // 🔧 重擊特效武器（雙手鈍器）：骰 19 一律觸發重擊（粉碎），不論本應為擦傷/命中/未命中 → 重擊率 5%→10%
    // ⚔️ v3.5.97 改用「本次揮擊的武器」而非硬編主手：迅猛雙斧副手揮擊會傳入 wpnInst=player.eq.offwpn，
    //   原本 _cw 恆取主手 → 副手自己的 crush／heavyRatePct／ignHardSkin／cleave 全部失效，反而借用主手的（名實不符）。
    //   與同函式 _swingId(下方) 及 wpnEnFinalMult(wpnInst||主手) 同源，也與傭兵側 allyStrikeRoll 的 opts.wpnInst 對齊。
    let _cw = (wpnInst && DB.items[wpnInst.id]) || (player.eq.wpn && DB.items[player.eq.wpn.id]);
    let isCrush = !!(_cw && _cw.eff === 'crush');
    let rollHit = roll(1, 20);
    let hit = false, heavy = false, graze = false, crush = false;
    if (forceGraze) { hit = true; graze = true; }   // 🏺 水精靈王的撫摸：原本未命中時依機率改判為 50% 擦傷
    else if (forceHeavy) { hit = true; heavy = true; }   // 魔擊：必定命中且必定重擊
    else if (forceHit) { hit = true; }   // 反擊：必定命中、必定非重擊
    else if (forceLand) { hit = true; if (rollHit === 20) heavy = true; }   // 居合：必定命中，rollHit20 仍自然重擊；不擦傷
    else if (rollHit === 20) { hit = true; heavy = true; }
    else if (isCrush && rollHit >= 19 - Math.round(((_cw && _cw.heavyRatePct) || 0) / 5) && (!player.classicMode || (_cw && _cw.classicOk) || rollHit !== 19)) { hit = true; heavy = true; crush = true; }   // 重擊武器：骰19必定重擊（粉碎）；🏺 v3.1.80 方尖碑 heavyRatePct:10 → 骰17~19 亦重擊（每 5%＝1 面）；🎮 v3.2.44 用戶拍板：經典模式只停「骰19」一般重擊特效——heavyRatePct 擴充段（如方尖碑 17~18）照樣重擊·classicOk 全放行
    else if (player.buffs && player.buffs.sk_elf_preciseshot > 0 && rollHit === 1) hit = true;   // 🏹 精準射擊：擲骰1由必定未命中→必定命中（最高命中率可達100%）
    else if (rollHit !== 1 && hitValue >= rollHit) hit = true;
    else if (rollHit === 19) { hit = true; graze = true; }   // 一般武器：擲到19本應未命中時 → 擦傷（傷害剩50%）
    if(!hit) return { dmg: 0, hit: false, heavy: false, crit: false, graze: false, crush: false, ranged: isRanged };

    // ⚔️ 武器種類內建特性（2026-07 用戶要求·僅自然骰路徑=一般攻擊/雙擊·🎮 經典模式停用）：
    //    鋼爪＝命中(非擦傷)後「額外 5%」機率升級為重擊（沿用重擊完整效果：取最大擲骰/VFX金字/訊息）；雙刀＝命中(非擦傷) 5% 機率最終傷害×2（見下方 _outDmg·訊息標記「雙刃×2」）
    let _natRoll = !forceHeavy && !forceHit && !forceLand;
    let _swingId = (wpnInst && wpnInst.id) || (player.eq.wpn && player.eq.wpn.id) || '';
    if (_natRoll && !heavy && !graze && !player.classicMode && getWeaponTags(_swingId).includes('鋼爪') && Math.random() < 0.05) heavy = true;

    // 爆擊判定（依遠/近距離爆擊率；🔧 迴避精通：forceCrit 必定爆擊）
    let isCrit = !!forceCrit || (Math.random() * 100 < critRate);
    if (graze) isCrit = false;   // 擦傷不會爆擊
    if (target && !probe) { if (isCrit) target._vfxBig = 'crit'; else if (heavy) target._vfxBig = 'heavy'; }   // ✨ VFX：玩家物理命中→爆擊大紅／重擊大金（唯一樞紐 getPhysicalDmg·🔎 探測不標特效——波及目標實吃主目標平砍傷害·標爆擊會名實不符）
    let critMult = isCrit ? (1 + critDmg / 100) : 1;  // 爆擊係數 = 1 + 爆擊傷害%

    // 武器傷害（重擊必定取最大值；🔧 烈焰之魂：持續內近距離一般攻擊武器擲骰必定最大值）
    let _flameSoulMax = (!isRanged && player.buffs && player.buffs.sk_elf_flamesoul > 0);
    let weaponRoll = (heavy || _flameSoulMax) ? diceStr : roll(1, diceStr);

    // [（遠/近距離傷害 x 爆擊係數） + 額外傷害 - 敵人傷害減免]，計算過程最低為1
    let nearFar = weaponRoll + dmgBonus;
    let _ignHard = !!(_cw && _cw.ignHardSkin);   // 🗡️ 貫穿（暗黑十字弓）：攻擊無視硬皮額外減傷（主攻擊與連射皆走本函式 → 一併涵蓋）
    let inner = Math.floor(nearFar * critMult) + player.d.extraDmg - ((target.dr || 0) + (_ignHard ? 0 : mobHardSkin(target)) + ((target._siegeDrEnd > state.ticks) ? (target._siegeDrVal || 0) : 0));   // 堅固防護：怪物傷害減免；🔧 硬皮：額外物理減傷（貫穿時不扣）
    inner = Math.max(1, inner);
    if (target._trauma && target._trauma.until > state.ticks) inner += (target._trauma.dmg || 5) * (target._trauma.s || 1);   // 🏺 v3.7.20 創傷（戰士的漆黑之劍）：目標受到的所有物理傷害 +5×層數（玩家物理樞紐·傭兵側 allyStrikeRoll 另掛）

    // 固定傷害（屬性/特效，於最低1之後加上）
    let fixed = 0;

    // 0. 屬性詞綴（v3.0.77 五階制）：額外傷害/魔法點數已改走 recompute（d.extraDmg/d.extraMp·見 js/02），此處只取屬性供剋制倍率（下方 _outDmg ×1.4/×0.6）
    let _attrInst = (wpnInst && wpnInst.attr) ? wpnInst : player.eq.wpn;   // ⚔️ 指定揮擊武器（副手＝offwpn）自身有屬性詞綴則用其屬性，否則沿用主武器（純加成、不減損既有行為）
    let _wAff = getAttrAffix(_attrInst && _attrInst.attr);


    // 先判定武器/箭矢本身是否帶「對不死/狼人」加成 (unBonus)
    let hasUnBonus = false;
    // 檢查箭矢 (例如銀箭、米索莉箭)
    if (arrowData && arrowData.unBonus) hasUnBonus = true;   // 🗑️ v3.5.87 刪恆假死運算元 unDice（DB.items 全表零定義）
    // 檢查近戰武器 (例如銀斧、精靈短劍)
    if (wpn && !arrowData && wpn.unBonus) hasUnBonus = true;   // 🗑️ v3.5.87 同上：unDice / sp==='elf' 恆假（sp 只在變身型態物件上且為數字）

    // 1. 武器本身的 unBonus 優先：對「不死」或「狼人」+1D20
    if (hasUnBonus && (target.un || target.isWolf)) {
        fixed += roll(1, 20);
    }
    // 2. 神聖武器(魔法)：僅在武器本身「沒有」unBonus 時才生效，且只對「不死」+1D20（狼人無效）。
    //    與武器 unBonus 互斥，不會疊加。
    else if (player.buffs.sk_holy_wpn > 0 && target.un) {
        fixed += roll(1, 20);
    }
    // 🏺 v3.1.80 傑克的彈弓：對「巨人」種族加成 +1D20（與 unBonus 同模型·獨立於不死/狼人加成·裝箭矢時亦生效）
    if (wpn && wpn.giantBonus && target.race === '巨人') fixed += roll(1, 20);
    // 🗡️ 吉爾塔斯之劍：擊殺後 10 秒內，依主玩家邪惡值比例提高額外傷害（滿邪惡 +10）。
    if (player._giltasFuryUntil > state.ticks && _swingId === 'wpn_giltas_sword') fixed += (typeof pvpEvilBonus === 'function' ? pvpEvilBonus(10) : 0);

    let _outDmg = inner + fixed;
    if (graze) _outDmg = Math.max(1, Math.floor(_outDmg * (((_cw && _cw.grazeDmgPct) || 50) / 100)));   // 擦傷：最終傷害剩 50%；🏺 v3.7.20 迷宮惡魔的瞥視 grazeDmgPct:30 → 挫傷剩 30%
    _outDmg = Math.max(1, Math.floor(_outDmg * fragileMult(target)));   // 🔮 脆弱（白鳥5）：受所有來源傷害 +10%
    _outDmg = Math.max(1, Math.floor(_outDmg * wpnEnFinalMult(wpnInst || player.eq.wpn)));   // 🔧 武器強化最終傷害倍率；🛡️ v2.6.69 審計#14：有傳 wpnInst（如迅猛雙斧副手揮擊傳 offwpn）就用「該武器自身」的強化與分級，不再硬吃主手倍率
    _outDmg = Math.max(1, Math.floor(_outDmg * rlFuryMult()));   // 🔮 紅獅5/5(×1.1)＋😡狂怒5/5：最終傷害（普攻及所有走本函式的物理攻擊：反擊/居合/看破/連擊/連射/穿透/魔擊/物理技能）
    { let _ecm = elementCounterMult(_wAff ? _wAff.ele : getWpnEle(null, DB.items[_swingId]), target.e);
      if (wpn && wpn.counterAllEle && target.e && target.e !== 'none') _ecm = Math.max(_ecm, 1.4);   // 🏺 不定形的變幻劍：一般攻擊剋制地/水/火/風一切屬性之敵（強制 ≥×1.4）
      if (wpn && wpn.counterEles && target.e && wpn.counterEles.includes(target.e)) _ecm = Math.max(_ecm, 1.4);   // 🌑 v3.4.67 冥皇執行劍：一般攻擊對指定屬性(地/風)敵人 ×1.4（與屬性剋制取大）
      _outDmg = Math.max(1, Math.floor(_outDmg * _ecm)); }   // ⚔️ 屬性剋制：屬性詞綴優先，否則取揮擊武器基底 ele（「一般攻擊轉為X屬性」遺物·與傭兵路徑 js/06 getWpnEle 對齊·v3.1.33 稽核修）剋怪 ×1.4、被剋 ×0.6（無屬性→×1）
    _outDmg = Math.max(1, Math.floor(_outDmg * (probe ? 1 : consumeWetMult(target, _wAff ? _wAff.ele : getWpnEle(null, DB.items[_swingId])))));   // 🏺 海洋水晶球：潮濕目標受風屬性物理傷害 ×2 並解除（🔎 探測不白耗潮濕狀態）
    if (target && target._fireVulnUntil > state.ticks && (_wAff ? _wAff.ele : getWpnEle(null, DB.items[_swingId])) === 'fire') _outDmg = Math.max(1, Math.floor(_outDmg * 1.3));   // 🏺 遺物 灼熱蜥蜴長舌：目標帶火屬性弱點時受火屬性攻擊 +30%
    if (_natRoll && player.d.eleWpnMult && (_wAff ? _wAff.ele : getWpnEle(null, DB.items[_swingId])) === player.d.eleWpnMult.ele) _outDmg = Math.max(1, Math.floor(_outDmg * player.d.eleWpnMult.mult));   // 🏺 v3.1.80 四之牙臂甲：裝備對應屬性武器時一般攻擊傷害 ×1.2（僅自然骰＝一般攻擊/雙擊/連射/穿透·屬性詞綴優先於基底 ele）
    if (heavy && player.mastery === 'k_cleave' && _cw && _cw.eff === 'cleave') _outDmg = Math.max(1, Math.floor(_outDmg * 1.5));   // 🏅 切割精通：觸發重擊時傷害 ×1.5
    if (heavy && _cw && _cw.heavyMult) _outDmg = Math.max(1, Math.floor(_outDmg * _cw.heavyMult));   // 🏺 遺物 鎧甲守衛的笨重巨劍：觸發重擊時傷害 ×heavyMult（1.5）
    if (heavy && _cw && _cw.heavyBonusDmg) _outDmg += _cw.heavyBonusDmg;   // 🌅 遺物 牛鬼的斷角：觸發重擊時額外傷害 +N（固定值·倍率後加算）
    if (player.statuses && player.statuses.broken > 0) _outDmg = Math.max(1, Math.floor(_outDmg * 0.8));   // 🐍 壞物術（特產易碎泥偶自傷）：期間玩家一般攻擊物理傷害 -20%
    let _dualX2 = false;   // ⚔️ 雙刀內建特性：一般攻擊命中(非擦傷) 5% 機率最終傷害×2（🎮 經典模式停用）
    if (_natRoll && !graze && !player.classicMode && getWeaponTags(_swingId).includes('雙刀') && Math.random() < 0.05) { _dualX2 = true; _outDmg = Math.max(1, _outDmg * 2); }
    if (_natRoll && !graze && _cw && _cw.dblStrikeRate && Math.random() * 100 < _cw.dblStrikeRate) { _dualX2 = true; _outDmg = Math.max(1, _outDmg * 2); }   // 🏺 v3.7.20 艾爾摩古戰場巨劍：一般攻擊 3% 機率 2 倍傷害（沿用 dualx2 標記顯示「×2」·非一般限定=經典亦觸發）
    markBossPhysicalHit(target);
    return { dmg: _outDmg, hit: true, heavy: heavy, crit: isCrit, graze: graze, crush: crush, dualx2: _dualX2, ranged: isRanged };
}

// 最近一次「物理攻擊命中」時間；屬性武器仍屬物理，法術／奇古獸／DoT 不呼叫此函式。
function markBossPhysicalHit(m) {
    if (m && m.boss && typeof state !== 'undefined') m._lastPhysicalHitTick = state.ticks;
}

function consumeArrow() {
    if (!player.eq.arrow || player.eq.arrow.cnt <= 0) {
        // 1. 嘗試從背包尋找任何箭矢自動裝上
        let invArrow = player.inv.find(i => DB.items[i.id] && DB.items[i.id].isArrow);
        if (invArrow) {
            equipItem(invArrow);
            logSys(`自動裝備了 ${DB.items[invArrow.id].n}。`);
        } else {
            // 2. 背包也沒箭，檢查是否開啟自動購買
            let autoBuyCheckbox = document.getElementById('set-auto-buy-arrow');
            if (autoBuyCheckbox && autoBuyCheckbox.checked) {
                let cost = shopPrice(200); // 1000 銀箭，5 銀箭 = 1 金幣 → 200 金幣（攻城獲勝 8 折亦適用）
                if (player.gold >= cost) {
                    player.gold -= cost;
                    gainItem('wpn_22', 1000, true, true);
                    logSys(`自動花費 ${cost} 金幣購買了 1000 銀箭。`);
                    let freshArrow = player.inv.find(i => i.id === 'wpn_22');
                    if (freshArrow) equipItem(freshArrow);
                } else {
                    logCombat(`沒有箭矢，且金幣不足無法自動購買！`, 'miss');
                    return null;
                }
            } else {
                logCombat(`沒有箭矢，無法進行攻擊！`, 'miss');
                return null;
            }
        }
    }
    
    // 扣除 1 根箭，並回傳箭矢資料提供傷害判定
    let arrowId = player.eq.arrow.id;
    if (arrowId !== 'wpn_shaha_arrow' && !(DB.items[arrowId] && DB.items[arrowId].noConsume)) {   // 🏝️ 沙哈之箭：彈藥無限，不扣減；🏺 遺物 改造便利箭筒(noConsume)：視同箭矢但不消耗
        player.eq.arrow.cnt--;
        if (player.eq.arrow.cnt <= 0) {
            player.eq.arrow = null; // 耗盡時清空欄位
        }
    }
    renderTabs(); // 👈 移到 if 判斷式外面，每次攻擊扣箭後都會即時刷新畫面！
    return DB.items[arrowId];
}

// ===== 法杖共鳴：裝備指定魔法杖時，一般攻擊(不論命中與否)有 智力/60 機率免費施展光箭 =====
const WAND_LIGHTARROW_IDS = ['wpn_oakwand', 'wpn_38', 'wpn_witchwand', 'wpn_manawand', 'wpn_crystalwand', 'wpn_baless', 'wpn_wand_rasta', 'wpn_red_crystalwand', 'wpn_laia_wand', 'wpn_icequeen_wand', 'wpn_demon_scythe', 'wpn_darkmage_wand', 'wpn_baphomet_wand', 'wpn_illu_wand', 'wpn_demon_wand_hidden', 'wpn_dark_crystalball', 'wpn_steel_manawand_blue', 'relic_amp_staff', 'relic_elder_thunder', 'relic_cerberus_wand', 'relic_evillizard_eye', 'relic_lightbeam_wand', 'relic_warlock_grimoire', 'relic_windking_roar', 'relic_rockmage_secret', 'wpn_onmyoji_fan', 'relic_sr_kyuubi_wand', 'relic_water_orb', 'relic_unsealed_baphomet_wand', 'wpn_angel_wand'];   // 😇 v3.7.74 天使魔杖亦共鳴   // 🏺 v3.7.20 解除封印的巴風特魔杖亦共鳴   // 🏺 v3.5.27 水靈的魔力珠亦共鳴（一般限定＝wandLightArrowProc 開頭 classicMode 早退）   // 🌅 日出之國：陰陽師的扇子（傳說）＋九尾妖狐的怒火（遺物）亦共鳴   // 🏺 遺物 安普長老的拐杖／長老的雷電能量／三頭犬魔杖／邪惡蜥蜴的眼瞳／光束強化魔杖／風精靈王的狂嘯／破岩法師的秘術亦共鳴 // 🔮 幻術士魔杖：共鳴（👹 隱藏的魔族魔杖亦共鳴；🏴‍☠️ 漆黑水晶球亦共鳴）   // 🏅 共鳴：含蕾雅魔杖／冰之女王魔杖／惡魔鐮刀／黑法師之杖／🔧巴風特魔杖（👑惡魔王魔杖已改為魔爆 eff:magicburst）
// 固定遺物變體沿用原型的共鳴資格，讓玩家、傭兵與資訊欄共用同一份 ID 清單。
(function inheritRelicWandResonance() {
    let original = new Set(WAND_LIGHTARROW_IDS);
    for (let id in DB.items) {
        let d = DB.items[id], baseId = d && d.relicBaseId;
        let base = typeof baseId === 'string' && DB.items[baseId];
        if (base && !base.relic && base.relicBaseId === undefined && base.type === 'wpn'
            && original.has(baseId) && !original.has(id)) WAND_LIGHTARROW_IDS.push(id);
    }
})();
function wandLightArrowProc(target) {
    if (player.classicMode) return;   // 🎮 經典模式：停用共鳴
    let wpn = player.eq.wpn;
    if (!wpn || !WAND_LIGHTARROW_IDS.includes(wpn.id)) return;
    let _ms = hasMastery('m_strike');   // 🏅 v2.6.70 魔擊精通：持共鳴武器時共鳴改發魔擊；v2.6.71 觸發機率比照原生魔擊＝力量/60（不再吃智力）
    if (Math.random() >= (((_ms ? player.d.str : player.d.int) || 0) / 60)) return;   // 觸發機率 = 智力/60（共鳴）；魔擊精通改 力量/60
    // 選定光箭目標：主目標仍存活則優先；若主目標已被普攻擊殺，改打場上隨機一隻存活的怪；全部清空則作罷
    let t = (target && target.curHp > 0) ? target : null;
    if (!t) {
        let alive = mapState.mobs.filter(m => m && m.curHp > 0);
        if (alive.length === 0) return;
        t = alive[Math.floor(Math.random() * alive.length)];
    }
    if (_ms) { procMagicStrike(t); return; }   // 🏅 改為發動魔擊（含擴散·不再施放光箭/回魔）
    procLightArrow(t);
}
// 光箭傷害：武器共鳴觸發，不耗魔力、不吃冷卻；階級依觸發武器的潘朵拉權重／傳說標記。
function procLightArrow(t) {
    let sk = DB.skills['sk_lightarrow'];
    if (!sk || !t || t.curHp <= 0) return;
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let mrFactor = hasMastery('m_resonance') ? 1 : mrMult(effMr);   // 🏅 共鳴精通：光箭無視魔抗
    let isCrit = Math.random() * 100 < player.d.magicCrit;
    let _procWpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let spCoef = weaponMagicDamageCoef(player.d, _procWpn, t, sk.ele || 'none');
    let mageDmgMult = 1.0;
    let magicCritMult = isCrit ? (1 + player.d.magicCritDmg / 100) : 1.0;
    let baseMagicDmg = roll(sk.dmgDice[0], sk.dmgDice[1]);
    let core = magicBaseDamage(baseMagicDmg, player.d, sk.dmgBase || 0, true) * spCoef * magicCritMult;
    let d = Math.floor(core * mrFactor);
    d = Math.max(1, d);   // 光箭無屬性，無剋制固定加值
    d = Math.floor(d * mageDmgMult);
    d = Math.max(1, Math.floor(d * wpnEnFinalMult(player.eq.wpn)));   // 🔧 武器強化 +11~+20：最終傷害倍率（共鳴光箭比照奇古獸/物理武器；與 tooltip 顯示一致）
    d = Math.max(1, Math.floor(d * fragileMult(t)));   // 🔮 脆弱（白鳥5）
    if (hasMastery('m_resonance')) d = Math.max(1, d + 5);   // 🏅 共鳴精通：光箭傷害 +5
    if (typeof equipSkillDmgMult === 'function') d = Math.max(1, Math.floor(d * equipSkillDmgMult(sk, 'sk_lightarrow')));   // 🏺 v3.2.42 稽核修：共鳴光箭也吃技能傷害倍率遺物（光束強化魔杖 skillDmgMult 自身 proc 原本不生效）
    d = Math.max(1, Math.floor(d * rlFuryMult()));   // 🔮 紅獅5/5＋😡狂怒5/5：最終傷害
    d = illusionMagicDmg(d, false);   // 🔮 共鳴本身已有回魔，不觸發幻覺2/5與5/5
    t.curHp -= d;
    if (typeof terrorVisageOnDamage === 'function') terrorVisageOnDamage(t, d, 'magic');   // 🌅 巨大骷髏：共鳴光箭視為魔法
    t.justHit = 'magic';
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    mobWake(t);
    player.mp = Math.min(player.mmp, player.mp + Math.max(1, Math.floor(d / (hasMastery('m_resonance') ? 5 : 10))));   // 共鳴：恢復 傷害/10（🏅 共鳴精通：傷害/5）
    updateUI();
    logCombat(`<span class="text-cyan-300 font-bold">【共鳴】</span>光箭對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 <span class="${isCrit ? 'text-yellow-500 font-bold' : 'text-cyan-300'}">${d}</span> 點傷害。${isCrit ? ' (爆擊!)' : ''}`, 'magic');
    if (t.curHp <= 0) {
        let realIdx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
        if (realIdx !== -1) killMob(realIdx);
    } else {
        renderMobs();
    }
    // 🔮 魔女 5/5：累計共鳴次數，每 5 次免費發動一次冰雪暴（sk_blizzard·4×2D10 水屬性全體·免學·不吃法師階級加成）
    if (player._setWitch5) {
        player._witchResCnt = (player._witchResCnt || 0) + 1;
        if (player._witchResCnt >= 5) { player._witchResCnt = 0; if (typeof stormBuffTick === 'function' && DB.skills['sk_blizzard']) stormBuffTick(DB.skills['sk_blizzard'], true); }
    }
}
// ===== 月光爆裂：對指定目標造成 1D30 + 2×強化等級 的風屬性魔法傷害（🔮 v3.4.91 改「受魔法傷害公式影響」：固定魔傷＋SP 係數＋武器特效階級＋屬性防禦＋MR·統一 proc 公式比照紅惡靈逆襲/冰矛圍籬）=====
function procMoonburst(t) {
    if (!t || t.curHp <= 0) return;
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let en = capWpnEn((player.eq.wpn && player.eq.wpn.en) || 0);
    let _cm = elementCounterMult('wind', t.e);   // ⚔️ 風剋水 ×1.4、被地剋 ×0.6
    let counterTxt = (_cm > 1) ? ' <span class="text-emerald-300 font-bold">(剋屬性!)</span>' : (_cm < 1 ? ' <span class="text-rose-300 font-bold">(被剋!)</span>' : '');
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;   // 破魔減半（比照其他魔法 proc）
    let core = magicBaseDamage(roll(1, 30) + 2 * en, player.d, 0, true) * weaponMagicDamageCoef(player.d, wpn, t, 'wind');   // 🔮 統一魔法公式：＋固定魔傷(magicDmg)·×SP 係數·×武器特效階級·×(1−目標風屬性防禦)
    let mbDmg = Math.max(1, Math.floor(core * mrMult(effMr)));   // 受 MR
    mbDmg = Math.max(1, Math.floor(mbDmg * fragileMult(t) * _cm));   // 🔮 脆弱（白鳥5）＋⚔️屬性剋制 ×1.4/×0.6
    mbDmg = Math.max(1, Math.floor(mbDmg * enhanceWpnFinalMult(en, wpn)));   // 🔧 武器強化 +11~+20：最終傷害倍率
    mbDmg = Math.max(1, Math.floor(mbDmg * rlFuryMult()));   // 🔮 紅獅5/5＋😡狂怒5/5：最終傷害
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;   // 消耗破魔（比照冰矛圍籬/紅惡靈）
    t.curHp -= mbDmg;
    if (typeof terrorVisageOnDamage === 'function') terrorVisageOnDamage(t, mbDmg, 'magic');   // 🌅 巨大骷髏：月光爆裂視為魔法
    t.justHit = 'wind';
    logCombat(`<span class="font-bold" style="color:#67e8f9;text-shadow:0 0 6px #06b6d4;">【月光爆裂】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${mbDmg} 點風屬性傷害！${counterTxt}`, 'player-special');
    if (t.curHp <= 0) {
        let realIdx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
        if (realIdx !== -1) killMob(realIdx);
    } else {
        renderMobs();
    }
}
// 月光爆裂 proc 判定：裝備熾炎天使弓時 8% 觸發；主目標已死則轉移到場上隨機存活怪（與共鳴相同）
function moonburstProc(target) {
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    if (!wpn || wpn.eff !== 'moonburst') return;
    if (Math.random() >= 0.08) return;
    let t = (target && target.curHp > 0) ? target : null;
    if (!t) {
        let alive = mapState.mobs.filter(m => m && m.curHp > 0);
        if (alive.length === 0) return;
        t = alive[Math.floor(Math.random() * alive.length)];
    }
    procMoonburst(t);
}
// ===== 魔擊（力量魔法杖）：對指定目標打一次「必定命中且必定重擊」的物理攻擊，沿用一般攻擊完整傷害計算 =====
// 🏅 魔擊精通：觸發魔擊時「必定」額外觸發「擴散魔擊」——對所有敵人各自造成等同 1 次魔擊的傷害（擴散不再連鎖）
function procMagicStrike(t, isSpread) {
    if (!t || t.curHp <= 0) return;
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let dice = wpn ? (t.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
    let res = getPhysicalDmg(dice, t, wpn, null, true);   // forceHeavy=true：必定命中＋重擊
    t.curHp -= res.dmg;
    t.justHit = getWpnEle(player.eq.wpn, wpn);
    mobWake(t);
    // 🗑️ v3.5.87 移除死呼叫 wearHardSkin(t, null, true, false)：魔擊不削減硬皮（「重擊額外削減」機制已於 2026-06 移除·wpnId=null 時 dec 恆 0）
    let mark = res.crit ? '會心一擊' : '重擊';
    logCombat(`<span class="font-bold" style="color:#d8b4fe;text-shadow:0 0 6px #a855f7;">【${isSpread ? '擴散魔擊' : '魔擊'}】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${res.dmg} 點傷害（${mark}!）。`, res.crit ? 'player-crit' : 'player-special');
    if (t.curHp <= 0) {
        let realIdx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
        if (realIdx !== -1) killMob(realIdx);
    } else {
        renderMobs();
    }
    if (!isSpread && hasMastery('m_strike')) {   // 🏅 魔擊精通：必定額外觸發擴散魔擊
        let _all = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
        if (_all.length) {
            logCombat(`<span class="font-bold" style="color:#e9d5ff;text-shadow:0 0 8px #a855f7;">【魔擊精通】</span>魔力向四方擴散！`, 'player-special');
            _all.forEach(m => procMagicStrike(m, true));
        }
    }
}
// 🏺 遺物「蠅災的詛咒」等 auraDmg 裝備：每 interval tick 對場上所有敵人造成固定魔法傷害（無屬性·不吃魔抗/防禦·固定值）。
//    掃玩家全部裝備欄（各件依自身 interval 節流）；於玩家階段呼叫→掉血計入玩家 DPS。安全區無怪自動跳過。經典模式亦生效（非「一般限定」武器特效）。
function relicAuraTick() {
    if (!player || player.dead || !player.eq) return;
    let live = mapState.mobs ? mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead) : [];
    if (!live.length) return;
    // 🩹 v3.1.76 傭兵吃遺物：光環來源＝玩家＋各未倒地傭兵的裝備欄（傭兵光環標示持有者·掉血仍於玩家階段結算）
    let _auraSrcs = [{ eq: player.eq, tag: '' }];
    (player.allies || []).forEach(a => { if (a && !a._downed && (a.curHp || 0) > 0 && a.eq) _auraSrcs.push({ eq: a.eq, tag: `協力·${a._allyName}·` }); });
    for (let _s of _auraSrcs) for (let k in _s.eq) {
        let e = _s.eq[k]; if (!e) continue; let d = DB.items[e.id];
        // 🏺 v3.7.20 俯瞰大地的雷電（auraSkill）：每 interval tick 免費施放一次指定法術（procFreeMagicSkill 走玩家魔傷係數·
        //    target:'all' 技能自動掃全場；傭兵持有亦觸發但傷害仍以玩家衍生值結算、計入玩家 DPS——與 auraDmg 光環同口徑）。
        if (d && d.auraSkill && d.auraSkill.skId && (state.ticks % (d.auraSkill.interval || 100)) === 0) {
            let _fm = mapState.mobs.find(m => m && m.curHp > 0 && !m._dead);
            if (_fm && typeof procFreeMagicSkill === 'function') {
                logCombat(`<span class="font-bold" style="color:#facc15;text-shadow:0 0 6px #ca8a04;">【${_s.tag}${d.n}】</span>雷雲翻湧，${DB.skills[d.auraSkill.skId] ? DB.skills[d.auraSkill.skId].n : ''}傾瀉而下！`, 'player-special');
                procFreeMagicSkill(_fm, d.auraSkill.skId, 0, false, d);
            }
        }
        if (!d || !d.auraDmg) continue;
        let a = d.auraDmg, iv = a.interval || 20, dmg = a.dmg || 0;
        if (dmg <= 0 || (state.ticks % iv) !== 0) continue;
        let names = [];
        mapState.mobs.forEach(m => {
            if (!m || m.curHp <= 0 || m._dead) return;
            m.curHp -= dmg; m.justHit = (a.ele && a.ele !== 'none') ? a.ele : 'magic'; mobWake(m);
            names.push(`<span class="${getMobColor(m.lv)}">${m.n}</span> ${dmg}`);
        });
        if (names.length) logCombat(`<span class="font-bold" style="color:#a3e635;text-shadow:0 0 6px #65a30d;">【${_s.tag}${d.n}】</span>${names.join('、')}`, 'dot');
        // 擊殺結算：uid 快照後逐一 killMob（避免 killMob 改動索引造成位移/漏殺）
        mapState.mobs.filter(m => m && m.curHp <= 0 && !m._dead).map(m => m.uid).forEach(uid => {
            let idx = mapState.mobs.findIndex(m => m && m.uid === uid && m.curHp <= 0 && !m._dead);
            if (idx !== -1) killMob(idx);
        });
    }
    if (!state.ff) renderMobs();
}
// 魔擊 proc 判定：裝備力量魔法杖時，每次攻擊(命中與否) 力量/60 機率；主目標已死則轉移到場上隨機存活怪
function magicStrikeProc(target) {
    if (player.classicMode) return;   // 🎮 經典模式：停用魔擊
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    if (!wpn || wpn.eff !== 'magicstrike') return;
    if (Math.random() >= ((player.d.str || 0) / 60)) return;   // 觸發機率 = 裝備者力量 / 60
    let t = (target && target.curHp > 0) ? target : null;
    if (!t) {
        let alive = mapState.mobs.filter(m => m && m.curHp > 0);
        if (alive.length === 0) return;
        t = alive[Math.floor(Math.random() * alive.length)];
    }
    procMagicStrike(t);
}
// ===== 連射：發動攻擊時依機率追加 1~3 箭；每箭各自接受命中判定(可未命中/重擊/爆擊)，傷害為該箭結算的 30%；每箭也各判定月光爆裂 =====
function rapidfireProc(arrowData, forceProc, classicOk) {
    if (player.classicMode && !classicOk) return;   // 🎮 經典模式：一般連射停用；地精靈王的抗拒受擊連射為指定例外
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    if (!wpn || !wpn.rapidfire) return;
    if (!forceProc && roll(1, 100) > wpn.rapidfire) return;
    let _rfMax = hasMastery('e_rapid') ? 5 : 3;
    let _rfN = wpn.rapidMax ? _rfMax : roll(1, _rfMax);   // 🏅 連射精通：額外箭數 1~3 → 隨機 1~5；🏺 復仇者的十字弩弓 rapidMax：必定觸發最大箭數
    for (let _r = 0; _r < _rfN; _r++) {
        let _alive = [];
        mapState.mobs.forEach((m, i) => { if (m && m.curHp > 0) _alive.push(i); });
        if (_alive.length === 0) break;
        let _ti = _alive[Math.floor(Math.random() * _alive.length)];
        let _t = mapState.mobs[_ti];
        if (typeof playArrowFx === 'function') playArrowFx(player, _t, _r * 45);   // 🏹 v3.2.8 連射每箭一支投射物（錯開 45ms·免整束重疊成一支）
        // 每箭各自接受命中判定（可能未命中，也可能重擊/爆擊）
        let _dice = _t.s === 'L' ? wpn.dmgL : wpn.dmgS;
        if (arrowData) _dice = _t.s === 'L' ? (wpn.dmgL + arrowData.dmgL) : (wpn.dmgS + arrowData.dmgS);
        let _res = getPhysicalDmg(_dice, _t, wpn, arrowData);
        if (!_res.hit) {
            if (typeof vfxMiss === 'function') vfxMiss(_t);
            logCombat(`【連射】箭矢射向 <span class="${getMobColor(_t.lv)}">${_t.n}</span> 但未命中。`, 'miss');
            continue;
        }
        let _rfMult = player._setGale5 ? (hasMastery('e_rapid') ? 1.00 : 0.80) : (hasMastery('e_rapid') ? 0.50 : 0.30);   // 30%；🏅連射精通50%；🔮疾風5/5 80%；兩者兼具100%
        let _rfDmg = Math.max(1, Math.floor(_res.dmg * _rfMult));
        _t.curHp -= _rfDmg;
        if (typeof terrorVisageOnDamage === 'function') terrorVisageOnDamage(_t, _rfDmg, 'ranged');   // 🌅 巨大骷髏：連射視為遠距離
        if (wpn.bonespike && _t.curHp > 0) _t._bonespike = Math.min(10, (_t._bonespike || 0) + 1);   // 🏺 骸骨意志之弓：連射額外箭矢命中→累積 1 層骨刺（上限 10·普攻引爆）
        _t.justHit = getWpnEle(player.eq.wpn, wpn);
        mobWake(_t);
        // 🗑️ v3.5.87 移除死呼叫 wearHardSkin(_t, null, true, false)：連射箭不削減硬皮（同魔擊·wpnId=null 時 dec 恆 0）
        let _mark = (_res.heavy && _res.crit) ? '會心一擊' : (_res.crit ? '爆擊' : (_res.heavy ? '重擊' : ''));
        logCombat(`【連射】箭矢命中 <span class="${getMobColor(_t.lv)}">${_t.n}</span>，造成 ${_rfDmg} 點傷害${_mark ? '（' + _mark + '!）' : ''}。`, _res.crit ? 'player-crit' : (_res.heavy ? 'player-heavy' : 'player'));
        if (_t.curHp <= 0) killMob(_ti);
        moonburstProc(_t);   // 熾炎天使弓：每支連射箭矢也有機會觸發月光爆裂（主目標死亡自動轉移）
    }
    renderMobs();
}
// 🏺 地精靈王的抗拒：裝備者受到傷害時必定額外發動一次連射；這個受擊觸發在經典模式仍有效。
function hurtRapidfireProc() {
    if (!player || player.dead || player.hp <= 0 || !player.eq || !player.eq.wpn) return;
    let wpn = DB.items[player.eq.wpn.id];
    if (!wpn || !wpn.hurtRapidfire || !wpn.isBow) return;
    let arrowData = consumeArrow();
    if (!arrowData) return;
    logCombat(`<span class="font-bold" style="color:#fcd34d;text-shadow:0 0 6px #a16207;">【${wpn.n}】</span>承受衝擊後立刻反射連射！`, 'player-special');
    rapidfireProc(arrowData, true, true);
}
// 🛡️ 臂甲判定：臂甲裝在副手(slot:shield)但帶 armguard 旗標；反擊/居合用它區分「真盾牌 vs 臂甲」
function _isArmguard(shRef) { return !!(shRef && DB.items[shRef.id] && DB.items[shRef.id].armguard); }
// ===== 反擊（單手劍）：對攻擊者打一次「必定命中、必定非重擊、傷害 50%」的一般攻擊；只打攻擊者，不轉移 =====
function procCounter(t) {
    if (player.classicMode) return;   // 🎮 經典模式：停用反擊
    if (!t || t.curHp <= 0) return;
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let dice = wpn ? (t.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
    let res = getPhysicalDmg(dice, t, wpn, null, false, true, false, hasMastery('k_counter'));   // forceHeavy=false, forceHit=true；🏅 反擊精通：必定爆擊
    let dmg = Math.max(1, Math.floor(res.dmg * (hasMastery('k_counter') ? 0.65 : 0.50)));   // 傷害 50%（🏅 反擊精通：+30% → 65%）
    if (player.buffs.sk_counter_barrier > 0 && player.eq.wpn && getWeaponTags(player.eq.wpn.id).includes('單手劍')) dmg = Math.max(1, Math.floor(dmg * 2));   // 🔧 反擊屏障：原生反擊(單手劍)武器最終傷害×2
    if (player.buffs.sk_counter_barrier > 0 && wpn && wpn.counterBarrierX2) dmg = Math.max(1, Math.floor(dmg * 2));   // 🏺 資深殘兵的重型劍：反擊屏障觸發的反擊傷害×2（雙手劍靠此旗標·非單手劍原生）
    t.curHp -= dmg;
    t.justHit = getWpnEle(player.eq.wpn, wpn);
    mobWake(t);
    if (t.curHp > 0 && hasMastery('k_counter')) wearHardSkin(t, null, false, false, true);   // 🏅 反擊精通：反擊命中削減 1 硬皮值
    let mark = res.crit ? '（爆擊!）' : '';
    logCombat(`<span class="font-bold" style="color:#fbbf24;text-shadow:0 0 6px #f59e0b;">【反擊】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點傷害${mark}。`, 'player');
    let idx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (idx !== -1) killMob(idx); }
    else renderMobs();
}
// ===== 居合（武士刀）：對攻擊者打一次「必定命中、可自然重擊/爆擊」的一般攻擊；只打攻擊者 =====
function procIai(t) {
    if (player.classicMode) return;   // 🎮 經典模式：停用居合
    if (!t || t.curHp <= 0) return;
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let dice = wpn ? (t.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
    let res = getPhysicalDmg(dice, t, wpn, null, false, false, true, hasMastery('k_counter') || !!(wpn && wpn.iaiCrit));   // forceLand=true：必定命中、可重擊；🏅 反擊精通／🌅 遺物 鐮鼬的尾刃 iaiCrit：必定爆擊
    if (hasMastery('k_counter')) res.dmg = Math.max(1, Math.floor(res.dmg * 1.3));   // 🏅 反擊精通：居合傷害 +30%
    if (player.buffs.sk_counter_barrier > 0 && player.eq.wpn && getWeaponTags(player.eq.wpn.id).includes('武士刀')) res.dmg = Math.max(1, Math.floor(res.dmg * 2));   // 🔧 反擊屏障：原生居合(武士刀)武器最終傷害×2
    t.curHp -= res.dmg;
    t.justHit = getWpnEle(player.eq.wpn, wpn);
    mobWake(t);
    wearHardSkin(t, null, res.heavy, false, hasMastery('k_counter'));   // 🔧 居合重擊 -2；🏅 反擊精通：居合命中再削減 1 硬皮值（與重擊 -2 疊加）
    let mark = (res.heavy && res.crit) ? '會心一擊' : (res.crit ? '爆擊' : (res.heavy ? '重擊' : ''));
    logCombat(`<span class="font-bold" style="color:#a5f3fc;text-shadow:0 0 6px #06b6d4;">【居合】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${res.dmg} 點傷害${mark ? '（' + mark + '!）' : ''}。`, 'player');
    let idx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (idx !== -1) killMob(idx); }
    else renderMobs();
}
// 雙擊（鋼爪/雙刀）：暗影 3/5 裝備鋼爪／雙刀時，於武器基礎機率額外 +20%。
function comboTriggerChance(owner, wpn, wpnRef) {
    if (!wpn || wpn.eff !== 'combo') return 0;
    let chance = Math.max(0, Number(wpn.comboRate) || 0);
    let ref = wpnRef || (owner && owner.eq && owner.eq.wpn);
    let tags = ref && typeof getWeaponTags === 'function' ? getWeaponTags(ref.id) : [];
    if (owner && owner._setShadow3 && (tags.includes('鋼爪') || tags.includes('雙刀'))) chance += 20;
    return Math.min(100, chance);
}
// 雙擊（鋼爪/雙刀）：依武器雙擊機率追加一次「額外一般攻擊」，獨立判定命中、傷害＝完整一般攻擊（暗影5/5→額外攻擊傷害加倍）；本身不再觸發雙擊/穿透等（不遞迴）。fullDmg=false（爆擊精通沿用）保留舊倍率×0.5（暗影5/5×1.0）
// ===== 🐉 弱點曝光（weakExpose）：鎖鏈劍一般攻擊命中時依機率對目標附加堆疊（最多3層，鎖刃精通5層）；屠宰者命中時消耗並轉為額外傷害（見 castSkill 屠宰者）=====
function weakExposeMaxLayers() { return hasMastery('k_chainblade') ? 5 : 3; }   // 🏅 鎖刃精通：上限 5 層
function playerCanWeakExpose() {
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    if (!wpn || wpn.isBow || wpn.ranged) return false;   // 近距離武器專用
    return !!wpn.weakExpose || hasMastery('k_weakness');   // 鎖鏈劍 或 🏅 弱點精通（任意近戰武器）
}
function applyPlayerWeakExpose(target) {
    if (!target || target.curHp <= 0) return;
    if (!playerCanWeakExpose()) return;
    let always = hasMastery('k_chainblade') || hasMastery('k_weakness');   // 鎖刃／弱點精通：必定附加；否則 12%
    if (!always && Math.random() >= 0.12) return;
    let before = target.weakExpose || 0;
    target.weakExpose = Math.min(weakExposeMaxLayers(), before + 1);
}
// 🏅 鎖刃精通：目標每有 1 層弱點曝光，對其最終傷害 +10%（最高 5 層 +50%）
function weakExposeDmgMult(m) { return (hasMastery('k_chainblade') && m && m.weakExpose > 0) ? (1 + 0.1 * Math.min(5, m.weakExpose)) : 1; }
// 🐉 龍血精通：所有技能 HP 消耗減半
function effHpCost(sk) {
    if (sk && sk.hpCost && player && player._setDragonblood3 && player.buffs) player.buffs.sk_set_dragonscion = 100;   // 🐉 龍血3/5：施放HP消耗技→獲得「龍裔」10秒（受傷-15%·由減傷乘算鏈讀此 buff）
    return Math.ceil((sk.hpCost || 0) * (hasMastery('k_dragonblood') ? 0.5 : 1));
}
// 🐉 龍鱗臂甲 額外攻擊：每攻擊週期追加 d.equipExtraAtk 次全傷害一般近戰攻擊（各自命中判定；不遞迴再觸發額外攻擊）
function dragonExtraAttackProc(target) {
    let n = (player.d && player.d.equipExtraAtk) || 0;
    if (n <= 0) return;
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    if (!wpn || wpn.isBow || wpn.ranged) return;   // 近戰專用（弓另有連射）
    for (let i = 0; i < n; i++) {
        let t = (target && target.curHp > 0 && !target._dead) ? target : getTarget();
        if (!t || t.curHp <= 0) return;
        let dice = t.s === 'L' ? wpn.dmgL : wpn.dmgS;
        let res = getPhysicalDmg(dice, t, wpn, null, false, false, false);
        if (!res.hit) { if (typeof vfxMiss === 'function') vfxMiss(t); logCombat(`<span class="font-bold" style="color:#fbbf24;">【額外攻擊】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 未命中。`, 'miss'); continue; }
        // 🏅 鎖刃精通：「每層弱點曝光最終傷害+10%」僅屠宰者生效，額外攻擊不套用
        t.curHp -= res.dmg; t.justHit = getWpnEle(player.eq.wpn, wpn); mobWake(t);
        if (t.curHp > 0) { wearHardSkin(t, player.eq.wpn ? player.eq.wpn.id : null, res.heavy, false, true, player.classicMode); applyPlayerWeakExpose(t); }
        if (wpn.vampPct && res.dmg > 0) player.hp = Math.min(player.mhp, player.hp + Math.floor(res.dmg * wpn.vampPct));
        let mark = (res.heavy && res.crit) ? '會心一擊' : (res.crit ? '爆擊' : (res.heavy ? '重擊' : ''));
        logCombat(`<span class="font-bold" style="color:#fbbf24;text-shadow:0 0 6px #d97706;">【額外攻擊】</span>追擊 <span class="${getMobColor(t.lv)}">${t.n}</span>，造成 ${res.dmg} 點傷害${mark ? '（' + mark + '!）' : ''}。`, 'player');
        let idx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
        if (t.curHp <= 0) { if (idx !== -1) killMob(idx); }
        else renderMobs();
    }
}
function procCombo(t, fullDmg) {
    if (!t || t.curHp <= 0 || t._dead) return;
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let dice = wpn ? (t.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
    let res = getPhysicalDmg(dice, t, wpn, null, false, false, false, fullDmg && !!(wpn && wpn.comboForceCrit));   // 獨立命中判定（可未命中）；🏺 v3.7.52 邪惡利牙：雙擊追加攻擊必定爆擊（forceCrit·爆擊精通額外攻擊(!fullDmg)不套）
    if (!res.hit) { if (typeof vfxMiss === 'function') vfxMiss(t); logCombat(`<span class="font-bold" style="color:#c4b5fd;">【雙擊】</span>追擊 <span class="${getMobColor(t.lv)}">${t.n}</span> 未命中。`, 'miss'); return; }
    if (res.crit && typeof grantCritFuryHaste === 'function') grantCritFuryHaste(player, wpn);   // 🏺 v3.7.52 邪惡利牙：雙擊爆擊亦觸發攻速 buff
    // 🔧 黑暗妖精：連擊亦獨立觸發燃燒鬥志(30%×1.5)、雙重破壞(雙刀/鋼爪 45級起10%×2，每5級+1%)，兩者可疊加；先套用於本擊傷害，再依連擊倍率（暗影5/5→100%，否則50%）結算
    let _cdmg = res.dmg;
    if (player.buffs && player.buffs.sk_dark_burn > 0 && Math.random() < 0.30) _cdmg = Math.floor(_cdmg * 1.5);
    if (player.buffs && player.buffs.sk_dark_double > 0) {
        let _ct = getWeaponTags(player.eq.wpn ? player.eq.wpn.id : '');
        if (_ct.includes('雙刀') || _ct.includes('鋼爪')) {
            let _cch = 10 + (player.lv >= 45 ? Math.floor((player.lv - 45) / 5) : 0);
            if (Math.random() * 100 < _cch) _cdmg *= 2;
        }
    }
    let dmg = Math.max(1, Math.floor(_cdmg * (fullDmg ? (player._setShadow5 ? 2.0 : 1.0) : (player._setShadow5 ? 1.0 : 0.5))));   // 🔧 雙擊(fullDmg)：完整一般攻擊·暗影5/5傷害加倍(×2)；爆擊精通額外攻擊(legacy)：×0.5·暗影5/5×1.0
    t.curHp -= dmg;
    if (typeof terrorVisageOnDamage === 'function') terrorVisageOnDamage(t, dmg, 'melee');   // 🌅 巨大骷髏：雙擊視為近距離
    t.justHit = getWpnEle(player.eq.wpn, wpn);
    mobWake(t);
    if (t.curHp > 0) wearHardSkin(t, player.eq.wpn ? player.eq.wpn.id : null, res.heavy, false, true, player.classicMode);   // 連擊亦為一般攻擊：依武器消磨硬皮
    if (fullDmg && wpn && wpn.mpOnComboHit && player.d) player.mp = Math.min(player.d.mmp || player.mmp || player.mp, player.mp + wpn.mpOnComboHit);   // 🏺 v3.6.44 嗜血騎士的雙刀：雙擊追擊命中恢復 MP
    let mark = (res.heavy && res.crit) ? '會心一擊' : (res.crit ? '爆擊' : (res.heavy ? '重擊' : ''));
    logCombat(`<span class="font-bold" style="color:#c4b5fd;text-shadow:0 0 6px #8b5cf6;">【雙擊】</span>追擊 <span class="${getMobColor(t.lv)}">${t.n}</span>，造成 ${dmg} 點傷害${mark?'（'+mark+'!）':''}。`, 'player');
    let idx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (idx !== -1) killMob(idx); }
    else renderMobs();
}
// ⚔️ 戰士可作雙持的武器：單手鈍器；🏅 巨斧精通(k_giantaxe)時雙手鈍器亦可（雙手鈍器單手化）
function warriorDualWieldWpnOk(id) {
    if (!id) return false;
    let tags = getWeaponTags(id);
    if (tags.includes('單手鈍器')) return true;
    return player.cls === 'warrior' && hasMastery('k_giantaxe') && tags.includes('雙手鈍器');
}
// ⚔️ 🏅 巨斧精通：戰士的雙手鈍器視為單手（可與盾牌／副手並用）；其餘走通用雙手判定
function effTwoHanded(d, id) {
    if (player.cls === 'warrior' && hasMastery('k_giantaxe') && d && d.type === 'wpn' && getWeaponTags(id).includes('雙手鈍器')) return false;
    return isTwoHandedWpn(d);
}
// ⚔️ 反彈精通：忍耐(泰坦)系觸發閾值（k_rebound→HP 80% 以下，否則 40%）
function titanThreshold() { return (player.cls === 'warrior' && hasMastery('k_rebound')) ? 0.8 : 0.4; }
// ⚔️ 迅猛雙斧：為戰士、已學迅猛雙斧、且主手可雙持(單手鈍器／巨斧精通的雙手鈍器)時，可於 offwpn 欄再持一把
function dualWieldOffhandOk() {
    return player.cls === 'warrior' && player.skills.includes('sk_warrior_dualaxe')
        && player.eq.wpn && warriorDualWieldWpnOk(player.eq.wpn.id);
}
// ⚔️ 迅猛雙斧：副手單手鈍器追加一次完整一般攻擊（第二攻擊來源·獨立命中·吃狂暴；副手不重複觸發出血/弱點等主手特效）
function dualWieldOffhandAttack(t) {
    if (!t || t.curHp <= 0 || t._dead) return;
    if (!dualWieldOffhandOk() || !player.eq.offwpn) return;
    let owpn = DB.items[player.eq.offwpn.id];
    let dice = owpn ? (t.s === 'L' ? owpn.dmgL : owpn.dmgS) : 2;
    let res = getPhysicalDmg(dice, t, owpn, null, false, false, false, false, player.eq.offwpn);   // 副手獨立命中判定（可未命中）；傳入副手實例→屬性詞綴用副手自身（祝福/遠古已於 recompute 計入 global d）
    if (!res.hit) {
        if (typeof vfxMiss === 'function') vfxMiss(t);
        logCombat(`<span class="font-bold" style="color:#fbbf24;">【迅猛雙斧】</span>副手追擊 <span class="${getMobColor(t.lv)}">${t.n}</span> 未命中。`, 'miss');
        // 新遺物的攻擊觸發不要求命中；指定副手避免重複判定娃娃，舊武器維持原頻率。
        if (owpn && owpn.relicBaseId && typeof weaponSpellProc === 'function') weaponSpellProc(t, false, player.eq.offwpn);
        return;
    }
    // ⚔️ v3.5.97 副手武器自身的即死 proc（比照主手 js/04 命中後先判即死→成功則不再跑一般扣血）
    if (typeof offhandInstakillProc === 'function' && offhandInstakillProc(player.eq.offwpn, owpn, t)) return;
    let dmg = res.dmg;
    if (player.skills.includes('sk_warrior_berserk') && Math.random() < 0.05) dmg *= 2;   // ⚔️ 狂暴：副手亦為一般攻擊
    if (typeof offhandDmgMods === 'function') dmg = offhandDmgMods(owpn, t, dmg);   // ⚔️ v3.5.97 副手扣血前的傷害修飾（selfBreakProc／eleBonusDmg）
    dmg = Math.max(1, dmg);
    t.curHp -= dmg; if (typeof terrorVisageOnDamage === 'function') terrorVisageOnDamage(t, dmg, 'melee'); t.justHit = getWpnEle(player.eq.offwpn, owpn); mobWake(t);   // 🌅 巨大骷髏：副手視為近距離
    if (t.curHp > 0) wearHardSkin(t, player.eq.offwpn.id, res.heavy, false, true, player.classicMode);
    if (typeof offhandAfterHit === 'function') offhandAfterHit(player.eq.offwpn, owpn, t, dmg);   // ⚔️ v3.5.97 副手扣血後的 proc（procHealFlat／procBurn／onHitEleDmg）
    let mark = (res.heavy && res.crit) ? '會心一擊' : (res.crit ? '爆擊' : (res.heavy ? '重擊' : ''));
    logCombat(`<span class="font-bold" style="color:#fbbf24;text-shadow:0 0 6px #d97706;">【迅猛雙斧】</span>副手 ${owpn.n} 追擊 <span class="${getMobColor(t.lv)}">${t.n}</span>，造成 ${dmg} 點傷害${mark?'（'+mark+'!）':''}。`, 'player');
    let idx = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (idx !== -1) killMob(idx); }
    else renderMobs();
    // ⚔️ v3.5.97 副手武器的附魔施放（procSkill／spellProc／procStatusSkill／procFireSkillRate 家族）。
    //   ⚠️ 擺在擊殺結算「之後」＝比照主手（playerAttack 先 killMob 再呼叫 weaponSpellProc），該函式內部自帶目標死亡處理與轉移。
    if (typeof weaponSpellProc === 'function') weaponSpellProc(t, true, player.eq.offwpn);
}
// ⚔️ 迅猛雙斧：副手武器有效性同步——主手不再可雙持／失去迅猛雙斧／副手武器不合格時，退回背包
function syncDualWield() {
    if (player.eq.offwpn && (!dualWieldOffhandOk() || !warriorDualWieldWpnOk(player.eq.offwpn.id))) {
        let e = player.eq.offwpn;
        if (!invMergeBack(e)) player.inv.push(e);   // 🔒 v3.6.92 單一真相 invMergeBack（js/01）
        player.eq.offwpn = null;
        logSys('副手武器已卸下（不符迅猛雙斧雙持條件）。');
    }
}
// ⚔️ 反彈精通：觸發忍耐被動時，額外對攻擊者發動一次普通攻擊（副手有雙持武器則主副手各一次）
function reboundExtraAttack(mob) {
    if (!mob || mob.curHp <= 0 || mob._dead) return;
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    if (wpn && !wpn.isBow && !wpn.ranged) {
        let dice = mob.s === 'L' ? wpn.dmgL : wpn.dmgS;
        let res = getPhysicalDmg(dice, mob, wpn, null, false, false, false);
        if (res.hit) {
            let dmg = res.dmg;
            if (player.skills.includes('sk_warrior_berserk') && Math.random() < 0.05) dmg *= 2;
            dmg = Math.max(1, dmg);
            mob.curHp -= dmg; mob.justHit = getWpnEle(player.eq.wpn, wpn); mobWake(mob);
            if (mob.curHp > 0) wearHardSkin(mob, player.eq.wpn.id, res.heavy, false, true, player.classicMode);
            logCombat(`<span class="font-bold" style="color:#d6d3d1;text-shadow:0 0 6px #78716c;">【反彈】</span>反擊追打 <span class="${getMobColor(mob.lv)}">${mob.n}</span>，造成 ${dmg} 點傷害。`, 'player');
        } else { if (typeof vfxMiss === 'function') vfxMiss(mob); logCombat(`<span class="font-bold" style="color:#d6d3d1;">【反彈】</span>反擊追打未命中。`, 'miss'); }
    }
    // ⚔️ v3.5.100 刻意保留的例外（不是漏改）：副手雖已改為獨立計時器、不再跟「主手一般攻擊」走，
    //   但【反彈】是另一個獨立的反擊事件（不是主手揮擊），維持雙持者反擊時兩手都打，避免無聲 nerf 反擊精通。
    if (mob.curHp > 0 && player.eq.offwpn && warriorDualWieldWpnOk(player.eq.offwpn.id)) dualWieldOffhandAttack(mob);   // 副手：再一次
    let idx = mapState.mobs.findIndex(m => m && m.uid === mob.uid);
    if (mob.curHp <= 0 && idx !== -1) killMob(idx);
}

// 🔮 冰矛圍籬（鑽石高崙武器 10% proc·js/07 c.iceLance→本函式）：免費單體水魔法（不耗 MP、不需學會；公式同 castSkill 單體魔法）。⚠️魔女5/5 已改走 stormBuffTick(sk_blizzard)＝冰雪暴，不再用本函式。
function witchIceLance() {
    let sk = DB.skills['sk_ice_lance'];
    if (!sk) return;
    let t = getTarget();
    if (!t || t.curHp <= 0 || t._dead) {
        let alive = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
        if (!alive.length) return;
        t = alive[Math.floor(Math.random() * alive.length)];
    }
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let mrFactor = mrMult(effMr);
    let isCrit = Math.random()*100 < player.d.magicCrit;
    let _procWpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let spCoef = weaponMagicDamageCoef(player.d, _procWpn, t, 'water');
    let mageMult = 1.0;   // 武器特效階級已由 weaponMagicDamageCoef 統一套用。
    let critMult = isCrit ? (1 + player.d.magicCritDmg/100) : 1;
    let core = magicBaseDamage(roll(sk.dmgDice[0], sk.dmgDice[1]), player.d, sk.dmgBase || 0, true) * spCoef * critMult;
    let dmg = Math.max(1, Math.floor(core * mrFactor));
    dmg = Math.max(1, Math.floor(dmg * elementCounterMult('water', t.e)));   // ⚔️ 水剋火 ×1.4、被風剋 ×0.6（取代舊 +6）
    dmg = Math.floor(dmg * mageMult);
    dmg = Math.max(1, Math.floor(dmg * rlFuryMult()));   // 🔮 紅獅5/5＋😡狂怒5/5（攻擊技能）
    dmg = Math.max(1, Math.floor(dmg * fragileMult(t)));
    dmg = Math.max(1, Math.floor(dmg * wpnEnFinalMult(player.eq.wpn)));   // 🔧 武器強化 +11~+20 最終倍率：補上（與共鳴光箭/傭兵魔女冰矛一致·統一武器特效公式）
    t.curHp -= dmg;
    t.justHit = 'water';
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    mobWake(t);
    if (sk.freeze) applyMobStatus(t, { kind:'freeze', pbase:sk.freeze, dur:6 }, sk.n);
    logCombat(`<span class="font-bold" style="color:#7dd3fc;text-shadow:0 0 6px #0ea5e9;">【冰矛圍籬】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點傷害。${isCrit ? ' (爆擊!)' : ''}`, 'magic');
    if (t.curHp <= 0) { let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (ri !== -1) killMob(ri); }
    else renderMobs();
}
// 🔧 水之元氣（sk_elf_watervital）：buff 期間內，下次受到「治癒術」（瞬間治癒·不含 HoT）治癒時恢復量加倍，觸發後 7 秒冷卻。
// 🤝 v3.4.45 改單體：只有「被治癒者本身」持有水之元氣才加倍（per-entity 冷卻 _waterVitalCd·玩家在 js/03:325 遞減、傭兵在 allyMaintainBuffs 遞減）。
function waterVitalHeal(heal, target) {
    let t = target || (typeof player !== 'undefined' ? player : null);   // 省略 target→玩家（相容舊呼叫）
    if (heal > 0 && t && t.buffs && (t.buffs.sk_elf_watervital || 0) > 0 && (t._waterVitalCd || 0) <= 0) {   // 寵物/召喚無 buffs→不加倍（單體語意）
        t._waterVitalCd = 7;   // 該實體 7 秒冷卻
        try { logCombat('💧 水之元氣發動：治療恢復量加倍！', 'heal'); } catch (e) {}
        return heal * 2;
    }
    return heal;
}

// 🔮 幻術士 魔力精通：消耗 MP 時，所有有 MP 的傭兵恢復消耗量 10% 的 MP
function manaMasteryRefund(spent) {
    if (!spent || spent <= 0) return;
    let give = Math.max(1, Math.floor(spent * 0.10));
    if (player.allies) player.allies.forEach(a => { if (a && (a.mmp || 0) > 0) a.mp = Math.min(a.mmp, (a.mp || 0) + give); });
}
// 🔮 是否為魔杖/法杖類武器（沿用 js/10 同一套名稱判定，排除黃金權杖＝王族單手劍）：
//    魔劍精通(i_magicsword)只把「非奇古獸的近戰武器」轉成奇古獸必中魔法路徑，魔杖本即施法武器、不應再轉（必中/攻速+30% 皆排除）。
function isWandWeapon(d) {
    if (d && d.relicBaseId !== undefined) {
        let base = typeof d.relicBaseId === 'string' && DB.items[d.relicBaseId];
        if (!base || base.relic || base.relicBaseId !== undefined) return false;
        d = base;
    }
    return !!(d && d.type === 'wpn' && (d.isWand || /魔杖|法杖/.test(d.n || '') || (/杖/.test(d.n || '') && !/權杖/.test(d.n || ''))));
}   // 🔮 d.isWand：名稱非「杖」但實為單手魔杖者（惡魔鐮刀）顯式標記
// 💧 一般攻擊命中回 MP 的恢復量（單一真相·玩家/傭兵/tooltip 共用）：mpOnHitAmt 固定量最優先（邪惡蜥蜴的眼瞳 +6）；
//    否則 = mpOnHitBase（預設 1·鋼鐵瑪那魔杖 2）＋ 突破安定值 6 之後每 +1 再多恢復 1。en 需先過 capWpnEn。
function mpOnHitAmount(wpn, en) {
    if (!wpn) return 0;
    if (wpn.mpOnHitAmt != null) return wpn.mpOnHitAmt;
    return (wpn.mpOnHitBase || 1) + Math.max(0, (en || 0) - 6);
}
// 🔮 幻術士 奇古獸一般攻擊：（奇古獸骰＋魔法傷害＋額外傷害）× 原版方向 SP／屬性防禦係數，100%命中、受目標MR減免（奇古獸精通無視MR）。
//    觸發路徑：裝備奇古獸(wpn.qigu)恆走此式；或 魔劍精通 + 任意非弓「且非魔杖」武器亦套用此式。屬性詞綴→對應屬性(剋屬性+6)。
// 🔮 幻術士專屬加成：所有傷害(奇古獸普攻/特效/傷害技能/立方/幻覺召喚物)最終 ×(1+等級/50)；非幻術士回 1（玩家傳 player、傭兵傳 ally）
function illuLvMult(a){ return 1; }   // 🔧 幻術士等級加成 (1+等級/50) 已移除(2026-07 用戶要求)
function qiguPlayerAttack(target, wpn) {
    let d = player.d;
    if (target.curHp === target.hp && target.beh === '被動') target._delayTicks = 30;   // 命中滿血被動怪：3秒延遲（同魔法攻擊）
    if (wpn && wpn.procInstakill) { let _pk = wpn.procInstakill; let _thp = target.hp || 1; if ((!_pk.maxLv || target.lv <= _pk.maxLv) && tryInstakill(target, { p: _pk.p, tag: _pk.tag || null }, wpn.n, mapState.targetIdx)) { if (_pk.healPct) { player.hp = Math.min(player.mhp, player.hp + Math.max(1, Math.floor(_thp * _pk.healPct))); updateUI(); } return; } }   // 🏺 遺物 曼陀羅之靈：奇古獸即死 proc（playerAttack 的 procInstakill 早退在 qigu 分支前→此處補上·傭兵版走 allyWeaponProcs 已含）；🐍 阿茲特獻祭亡靈 healPct：即死恢復被消滅敵人 HP%
    if (player.d.instakillFull && target.curHp === target.hp && tryInstakill(target, { p: player.d.instakillFull, tag: null }, '隱蔽的死亡草葉', mapState.targetIdx)) return;   // 🏺 遺物 隱蔽的死亡草葉：奇古獸普攻命中滿血怪即死（斗篷 req:all·幻術士亦可穿）
    let dice = (target.s === 'L') ? wpn.dmgL : wpn.dmgS;
    let ele = 'none';
    { let _qa = player.eq.wpn && getAttrAffix(player.eq.wpn.attr); if (_qa) ele = _qa.ele; }   // 🔥 getAttrAffix：相容舊12代碼
    let raw = magicBaseDamage(roll(1, dice), d, d.extraDmg || 0, true) * weaponMagicDamageCoef(d, wpn, target, ele);
    let effMr = (target.st && target.st.mrhalf > 0) ? (target.mr / 2) : target.mr;
    if (target.st && (target.st.confuse > 0 || target.st.panic > 0)) effMr = Math.max(0, effMr - 10);   // 🔮 混亂/恐慌：MR-10（下限0，與其他魔法路徑 mrMult(Math.max(0,...)) 一致）
    let ignoreMr = (player.mastery === 'i_qigu' && wpn.qigu);   // 🔮 奇古獸精通：裝備奇古獸時無視魔抗
    let dmg = Math.max(1, Math.floor(raw * (ignoreMr ? 1 : mrMult(effMr))));
    dmg = Math.max(1, Math.floor(dmg * elementCounterMult(ele, target.e)));   // ⚔️ 屬性剋制 ×1.4(剋)/×0.6(被剋)（取代舊 +6）
    dmg = Math.max(1, Math.floor(dmg * wpnEnFinalMult(player.eq.wpn)));   // 武器強化 +11~+20 最終倍率
    dmg = Math.max(1, Math.floor(dmg * rlFuryMult()));   // 🔮 紅獅5/5＋😡狂怒5/5
    dmg = Math.max(1, Math.floor(dmg * fragileMult(target) * illuLvMult(player)));   // 🔮 脆弱/破甲；🔮 幻術士等級加成 ×(1+等級/50)
    target.curHp -= dmg;
    target.justHit = (ele !== 'none') ? ele : 'magic';
    if (typeof moonShatterOnDamage === 'function') moonShatterOnDamage(player, target, dmg);
    if (target.st && target.st.mrhalf > 0) target.st.mrhalf = 0;
    mobWake(target);
    if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(target, dmg, 'magic', null);   // 🌑 v3.4.14 血壁空間：奇古獸普攻主擊＝魔法反射（玩家傭兵一致）
    if (player.dead) return;   // ☠️ v3.5.87 反射可反殺施放者：死後中止收尾（不結算擊殺/特效 proc·比照 js/04 playerAttack）
    if (target.curHp > 0 && player._setIron5 && typeof ironGuardTaunt === 'function' && ironGuardTaunt(target, player)) logCombat(`<span class="font-bold" style="color:#93c5fd;text-shadow:0 0 6px #3b82f6;">【鐵衛 5/5】</span>嘲諷 <span class="${getMobColor(target.lv)}">${target.n}</span>！（3 秒）`, 'player-special');
    logCombat(`<span class="font-bold" style="color:#c4b5fd;text-shadow:0 0 6px #8b5cf6;">【幻術士】</span>奇古獸對 <span class="${getMobColor(target.lv)}">${target.n}</span> 造成 ${dmg} 點魔法傷害。`, 'magic');
    if (target.curHp <= 0) killMob(mapState.targetIdx); else renderMobs();   // 主擊先結算（避免與下方特效各自 killMob 重複擊殺）
    qiguWeaponProc(target, wpn);        // 奇古獸特效（幻影衝擊/心靈破壞；主擊已擊殺則內部 guard 跳過、自行處理擊殺）
    wandLightArrowProc(target);         // 🔮 共鳴（幻術士魔杖在 WAND_LIGHTARROW_IDS；非共鳴武器內部 no-op，主目標已死自動轉移）
    // 🔮 魔劍精通可裝備一般武器：補齊一般武器命中特效（與傭兵 allyQiguAttack/allyWeaponProcs 一致；各函式/分支自帶武器判定，非對應武器即 no-op）
    if (wpn.eff === 'mp_drain' || wpn.mpOnHit) {   // 命中恢復 MP（瑪那魔杖等）→ 單一真相 mpOnHitAmount
        let _en = capWpnEn((player.eq.wpn && player.eq.wpn.en) || 0);
        player.mp = Math.min(player.mmp, player.mp + mpOnHitAmount(wpn, _en)); updateUI();
    }
    magicStrikeProc(target);            // 魔擊（力量魔法杖）
    weaponSpellProc(target);            // 附魔施放：spellProc/procSkill/procPoison/procStatusSkill（巴風特魔杖/冰之女王魔杖/死亡之指等）
}
// 奇古獸武器特效（隨強化提升機率）：共鳴=幻影衝擊(80~160無屬性固定)、寒冰=心靈破壞(玩家最大MP5%、不耗MP)
function qiguWeaponProc(target, wpn) {
    if (!wpn || !wpn.qiguProc || !target || target.curHp <= 0) return;
    let en = capWpnEn((player.eq.wpn && player.eq.wpn.en) || 0);
    if (Math.random() >= (1 + en) / 100) return;   // 1% + 每強化 +1%
    let ignoreMr = (player.mastery === 'i_qigu' && wpn.qigu);   // 🔮 奇古獸精通：裝備奇古獸時其觸發特效亦無視魔抗（與主擊一致，避免非奇古獸武器誤觸）
    let dmg = 0, label = '', cls = 'magic';
    if (wpn.qiguProc === 'phantom') {
        dmg = magicBaseDamage(79 + roll(1, 81), player.d, 0, true) * weaponMagicDamageCoef(player.d, wpn, target, 'none');   // 幻影衝擊：原版方向 SP 係數，無屬性且不受MR
        label = '幻影衝擊'; cls = 'player-special';
    } else if (wpn.qiguProc === 'mindbreak') {
        let effMr = (target.st && target.st.mrhalf > 0) ? (target.mr / 2) : target.mr;
        dmg = Math.max(1, Math.floor(magicBaseDamage((player.mmp || 0) * 0.05, player.d, 0, true) * weaponMagicDamageCoef(player.d, wpn, target, 'none') * (ignoreMr ? 1 : mrMult(effMr))));   // 玩家最大MP 5% ×原版方向 SP 係數（不消耗MP）
        label = '心靈破壞';
    } else return;
    dmg = Math.max(1, Math.floor(dmg * fragileMult(target) * illuLvMult(player) * enhanceWpnFinalMult(en, wpn)));   // 🔮 幻術士等級加成 ×(1+等級/50)；🔧 武器強化 +11~+20 最終倍率
    target.curHp -= dmg; if (typeof terrorVisageOnDamage === 'function') terrorVisageOnDamage(target, dmg, 'magic'); target.justHit = 'magic'; mobWake(target);   // 🌅 巨大骷髏：奇古獸觸發法術視為魔法
    logCombat(`<span class="font-bold" style="color:#a78bfa;text-shadow:0 0 6px #7c3aed;">【${label}】</span>對 <span class="${getMobColor(target.lv)}">${target.n}</span> 造成 ${dmg} 點傷害！`, cls);
    if (target.curHp <= 0) killMob(mapState.targetIdx); else renderMobs();
}
