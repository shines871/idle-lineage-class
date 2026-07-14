function newMobStatus() {
    return { freeze:0, stun:0, stone:0, sleep:0, poison:0, poisonTick:30, poisonDmg:0, poisonStacks:0, poisonUnit:0,
             blind:0, blindVal:0, weaken:0, disease:0, vacuum:0, broken:0, slow:0, mrhalf:0, magicseal:0, armorbreak:0, confuse:0, panic:0, guardbreak:0, terror:0, doom:0, strawCurse:0 };
}
function mobEffAC(m, actor) { let _weakOk = (m.weakExpose > 0) && ((actor && actor !== player) ? allyHasMastery(actor, 'k_weakness') : hasMastery('k_weakness')); return (m.ac || 0) + ((m.st && m.st.disease > 0) ? 8 : 0) + ((m.st && (m.st.confuse > 0 || m.st.panic > 0)) ? 5 : 0) + ((m.st && m.st.guardbreak > 0) ? 10 : 0) + (_weakOk ? 3 * Math.min(5, m.weakExpose) : 0) - ((m._acGuardEnd > state.ticks) ? (m._acGuardVal || 0) : 0); }   // 🔮 混亂/恐慌：AC+5；🐉 護衛毀滅：AC+10；🐉 弱點精通：每層弱點曝光 AC+3（更易被命中·讀「攻擊者」精通：傭兵傳 actor→吃傭兵自身精通、玩家/召喚無 actor→吃玩家精通）   // 🗼 鋼鐵防護：暫時降低 AC
function mobActDisabled(m) {
    let s = m.st; if(!s) return false;
    return s.freeze > 0 || s.stun > 0 || s.stone > 0 || s.sleep > 0;
}
// 怪物受到任何傷害時觸發（解除沉睡）
function mobWake(m) {
    if(m.st && m.st.sleep > 0) { m.st.sleep = 0; logCombat(`<span class="${getMobColor(m.lv)}">${m.n}</span> 從沉睡中醒來。`, 'magic'); }
}
const STATUS_NAME = { freeze:'冰凍', stun:'暈眩', stone:'石化', sleep:'沉睡', poison:'中毒',
    blind:'目盲', weaken:'弱化', disease:'疾病', vacuum:'真空', broken:'損壞', slow:'緩速', mrhalf:'魔抗減半', magicseal:'魔法封印', armorbreak:'破甲', fragile:'脆弱', confuse:'混亂', panic:'恐慌', guardbreak:'護衛毀滅', terror:'恐懼', doom:'死神' };   // 🔮 脆弱（白鳥5）：受所有傷害+20%；🐉 護衛毀滅/恐懼/死神
// 特定狀態的專屬套用訊息（接於怪物名稱後）
const STATUS_MSG = { magicseal:'的魔法遭到封印了。' };
// 對 BOSS 無效的行動限制類狀態
const BOSS_IMMUNE = ['freeze','stun','stone','sleep'];
// 異常魔法命中判定（玩家對怪物，共用）：命中值 = 玩家等級 + 魔法命中 − (怪等級−10) − 怪MR/10，
// clamp[0,20]，擲 1d20（與一般攻擊相同：擲20必中、擲1必失、其餘 命中值≥骰值 即命中），命中率 5%~95%。
// 異常魔法命中（玩家對怪物）：d20 機制，命中值 hv 上限預設 20（最高 95%）。
// 🔧 傳入 maxHv 可降低成功率上限：maxHv=12 → 最高 60%（起死回生術、迷魅術用）。自然20必中、自然1必失。
function abnormalMagicHit(m, maxHv, hitOff) {
    let hv = player.lv + (player.d.magicHit || 0) + (hitOff || 0) - ((m.lv || 0) - 10) - ((m.mr || 0) / 10);
    hv = Math.max(0, Math.min(maxHv || 20, hv));
    let r = roll(1, 20);
    return (r === 20) || (r !== 1 && hv >= r);
}
function applyMobStatus(m, st, skillName, damageCoef) {
    if(!m.st) m.st = newMobStatus();
    if(BOSS_IMMUNE.includes(st.kind) && m.boss) return;
    // 異常狀態魔法命中（玩家對怪物）：見 abnormalMagicHit；st.hitOff＝命中加值（🏛️ 真．冥皇執行劍 衝擊之暈 +4≈命中率+20%）
    // ⚡ st.force：跳過魔抗命中判定，由呼叫端自行擲固定機率（雷神之鎚電光衝擊／伊娃的責罵水之矛的 5% 固定附加）；BOSS 免疫仍上方先擋
    if(!st.force && !abnormalMagicHit(m, undefined, st.hitOff)) {
        logCombat(`<span class="${getMobColor(m.lv)}">${m.n}</span> 抵抗了${skillName || '異常狀態'}。`, 'miss');
        return;
    }
    // 持續時間：支援固定 dur(秒) 或隨機 durRand:[最小,最大]（秒）
    let durSec = st.durRand ? roll(st.durRand[0], st.durRand[1]) : (st.dur || 6);
    let dur = durSec * 10;
    let k = st.kind;
    if(k === 'poison') {
        m.st.poison = dur; m.st.poisonTick = (st.tick || 3) * 10;
        m.st.poisonDmg = Math.max(1, Math.floor(roll(st.dmg[0], st.dmg[1]) * (damageCoef || 1) * wpnEnFinalMult(player && player.eq && player.eq.wpn)));   // 傷害魔法毒咒吃統一係數；通用武器毒傷未傳係數，維持原樣
        m.st.poisonStacks = 1; m.st.poisonUnit = m.st.poisonDmg;   // 技能類中毒：單層（不疊加），仍顯示層數符號
    } else if(k === 'blind') {
        m.st.blind = dur; m.st.blindVal = st.hit || 4;
    } else if(k in m.st) {
        m.st[k] = dur;
    }
    
    // 👇 統一將狀態改變改寫為「施展 XXX，對 OOO 造成 XX 狀態」（🔧 中毒不輸出「敵人中毒」套用訊息，只保留每秒中毒傷害日誌）
    if(k !== 'poison') {
        let prefix = skillName ? `施展 ${skillName}，` : ``;
        if(STATUS_MSG[k]) {
            logCombat(`${prefix}<span class="${getMobColor(m.lv)}">${m.n}</span> ${STATUS_MSG[k]}`, 'magic');
        } else {
            logCombat(`${prefix}對 <span class="${getMobColor(m.lv)}">${m.n}</span> 造成 ${STATUS_NAME[k]||k} 狀態。`, 'magic');
        }
    }
}
function mobHasTag(m, tag) {
    if(tag === 'undead') return !!m.un;
    // 元素生物標籤：在怪物定義中加入「elem: true」即視為元素生物，
    //   會被「釋放元素(sk_elf_release)」依機率即死。範例見 salamander(火蜥蜴)。
    if(tag === 'element') return !!m.elem;
    if(tag === '硬皮') return !!m.hard;   // 🔧 硬皮：額外物理減傷（魔法不減），會被攻擊消磨、每10秒再生
    return false;
}

// ===== 🔧 硬皮系統 =====
// 硬皮值＝額外的「物理」傷害減免（魔法傷害不減）。最大值：一般怪 等級÷2、頭目 等級×1、四大龍(法利昂/安塔瑞斯/巴拉卡斯/林德拜爾) 等級×2、
// 城門 = 玩家等級、守護塔 = 玩家等級÷2；席琳的世界 ×1（不再加成）。
// 消磨：玩家/傭兵一般攻擊命中固定 -1（與下列各項疊加）；單手鈍器鈍擊 -1、單手鈍器重擊 -5、
//       雙手鈍器/屠龍劍重擊 -20、其餘一般攻擊重擊 -2、粉碎武器未重擊命中 -1；
//       傭兵以外的召喚物重擊不消磨。每 10 秒恢復 3% 最大值。
function initHardSkin(m) {
    if (!m || !m.hard) return;
    let mx;
    if (m.n === '肯特城門' || m.n === '風木城門') mx = Math.max(1, player.lv);              // 🔧 城門：硬皮 = 玩家等級
    else if (m.n === '肯特守護塔' || m.n === '風木守護塔') mx = Math.max(1, Math.floor(player.lv / 2));   // 🔧 守護塔：硬皮 = 玩家等級÷2
    else {
        let per = ['安塔瑞斯', '法利昂', '巴拉卡斯', '林德拜爾'].includes(m.n) ? 2 : (m.boss ? 1 : 0.5);   // 四大龍×2、其餘頭目×1、一般怪×0.5
        mx = Math.max(1, Math.floor((m.lv || 1) * per));   // 席琳的世界 ×1（不再加成；攻城區不觸發 _sherine，城門/守護塔不受影響）
    }
    m.hardSkinMax = mx;
    m.hardSkin = mx;
}
function mobHardSkin(m) { return (m && m.hardSkin > 0) ? m.hardSkin : 0; }   // 物理減傷量（供傷害公式扣減）
// 依武器特效與重擊/鈍擊消磨硬皮值；wpnId 為攻擊者（玩家或傭兵）的武器 id
function wearHardSkin(target, wpnId, heavy, bluntProc, basic, suppressEff) {
    if (!target || !(target.hardSkin > 0)) return;
    let dec = 0;
    let _wd = wpnId ? DB.items[wpnId] : null;
    let _isCrush = !suppressEff && !!(_wd && _wd.eff === 'crush');   // 🎮 經典模式：停用重擊(粉碎)
    // 🔧 2026-06 取消「重擊(heavy)額外削減硬皮值」(原 -20粉碎/屠龍、-5單手鈍器、-2通用 全移除)；魔擊以 heavy 呼叫→隨之不再削減→魔法與共鳴皆不削減硬皮值
    if (_isCrush) dec += 1;   // 🔧 粉碎武器：一般攻擊命中磨 1 硬皮值（保留·非重擊額外）
    if (bluntProc) dec += 1;   // 單手鈍器鈍擊
    if (basic) dec += 1;   // 🔧 玩家/傭兵一般攻擊命中：固定再磨 1 硬皮值（與上述重擊/粉碎/鈍擊削減疊加）
    if (_wd && _wd.hardWear) dec += _wd.hardWear;   // 🔧 大馬士革鋼爪/雙刀：一般攻擊命中額外削減硬皮值
    if (dec > 0) target.hardSkin = Math.max(0, target.hardSkin - dec);
}
function tryInstakill(m, ik, skillName, idx, deferKill) {
    if(m.boss) return false;

    // 👇 加上 ik.tag 的存在判定：只有在規定了特定 tag 時，才去檢查怪物有沒有該 tag
    if(ik.tag && !mobHasTag(m, ik.tag)) return false;

    // 固定機率即死（骰子匕首 ik.p=0.01 → 1%）；技能型即死(無 ik.p)才用異常魔法命中公式
    // 🔧 ik.cap 限制成功率上限（起死回生術 cap=12 → 最高 60%）；未設定則維持 5%~95%
    if(typeof ik.p === 'number') { if(Math.random() >= ik.p) return false; }
    else if(!abnormalMagicHit(m, ik.cap)) return false;

    logCombat(`${skillName} 使 <span class="${getMobColor(m.lv)}">${m.n}</span> 立即死亡！`, 'player-special');
    m.curHp = 0;
    // 🔧 deferKill：傭兵即死技在「player 暫時換身成傭兵」的視窗內呼叫；此時不可結算 killMob
    //    （否則經驗/金幣/掉落會加到傭兵身上隨即遺失、且 killMob 結尾的 updateUI 會閃現傭兵資料）。
    //    改由呼叫端在「還原 player 之後」再對該怪 killMob，確保結算與 UI 都歸真實玩家。
    if(!deferKill) killMob(idx);
    return true;
}
// 出血：對怪物施加一層出血（每秒造成 hitDmg 的 20%，持續 8 秒）。預設最多 5 層；🔧 出血精通：匕首/矛/雙刀可達 10 層、每秒總傷害 ×(1+0.1×層數)；已滿時新層取代最舊層。
function applyBleed(m, hitDmg, maxLayers, masteryBoost) {
    if(!m.bleeds) m.bleeds = [];
    let cap = Math.max(maxLayers || 5, m._bleedCap || 0);   // 🔧 多來源共用同一出血層陣列：取「本段出血曾出現過的最高上限」，避免低上限來源(如玩家匕首5層)把高上限來源(黑妖傭兵出血精通10層)的層數砍掉
    m._bleedCap = cap;
    let dps = Math.max(1, Math.floor(hitDmg * 0.20));
    while(m.bleeds.length >= cap) m.bleeds.shift();      // 超過上限：移除最舊的，由新層取代
    m.bleeds.push({ dmg: dps, ticksLeft: 80 });          // 8 秒 = 80 ticks
    if(masteryBoost) m._bleedMastery = true;             // 🔧 出血精通：此怪出血每秒總傷害 ×(1+0.1×層數)（10 層 = +100%）
    // 🔧 不再輸出「敵人陷入出血」套用訊息（依需求只保留每秒出血傷害日誌）
}
// 🏺 v3.1.80 永不終止的夢魘（dotCrit）：隊伍（玩家優先，其次非倒地傭兵）任一人裝備 → 我方施加的持續傷害（中毒/出血/猛爆劇毒）可觸發爆擊。
//    機率＝5% + 裝備者近距離爆擊率；傷害 ×(1+裝備者近距離爆擊傷害%)（基礎 50%→×1.5、黑妖 100%→×2）。回傳 {dmg, crit}。
function _teamDotCrit(base) {
    let w = null;
    if (typeof player !== 'undefined' && player && !player.dead && player.d && player.d.dotCrit) w = player;
    else { let _as = (typeof player !== 'undefined' && player && player.allies) || []; for (let _i = 0; _i < _as.length; _i++) { let a = _as[_i]; if (a && !a._downed && a.d && a.d.dotCrit) { w = a; break; } } }
    if (!w || base <= 0) return { dmg: base, crit: false };
    if (Math.random() * 100 >= (5 + ((w.d.meleeCrit) || 0))) return { dmg: base, crit: false };
    return { dmg: Math.max(1, Math.floor(base * (1 + ((w.d.meleeCritDmg) || 50) / 100))), crit: true };
}
// 每 tick 處理怪物身上的狀態（倒數、中毒 DoT）。回傳 true 代表該怪物已死亡。
function processMobStatusTick(m, i) {
    if(!m.st) { m.st = newMobStatus(); return false; }
    let s = m.st;
    ['freeze','stun','stone','sleep','blind','weaken','disease','vacuum','broken','slow','mrhalf','magicseal','fragile','armorbreak','confuse','panic','guardbreak','terror','doom'].forEach(k => {   // 🔮 含脆弱、🔧 含破壞盔甲、🔮 含混亂/恐慌、🐉 含護衛毀滅/恐懼/死神
        if(s[k] > 0) s[k]--;
    });
    if(s.blind <= 0) s.blindVal = 0;
    if(s.poison > 0) {
        s.poison--;
        if(state.ticks % (s.poisonTick || 30) === 0) {
            let _pdc = _teamDotCrit(s.poisonDmg);   // 🏺 v3.1.80 永不終止的夢魘：中毒 DoT 可爆擊
            m.curHp -= _pdc.dmg; m.justHit = 'magic'; mobWake(m); _dps.player += _pdc.dmg;   // 🎯 DPS：中毒 DoT 歸玩家（一般情況毒/血由玩家附加；傭兵附加之 DoT 亦計入玩家為已知簡化）
            logCombat(`<span class="${getMobColor(m.lv)}">${m.n}</span> 受到中毒傷害 ${_pdc.dmg} 點。${_pdc.crit ? ' <span class="text-yellow-500 font-bold">(爆擊!)</span>' : ''}`, 'dot');   // 🟢 中毒 DoT→綠色持續傷害分類
            if(m.curHp <= 0) { killMob(i); return true; }
        }
        if(s.poison <= 0) { s.poisonStacks = 0; s.poisonUnit = 0; s.poisonDmg = 0; }   // 中毒結束：清空層數
    }
    // 出血 DoT：可疊 5 層，每層各自獨立計時，每秒(10 ticks)造成一次傷害；同 tick 觸發的多層合併為一次顯示
    if(m.bleeds && m.bleeds.length) {
        let bleedTotal = 0;
        for(let bi = m.bleeds.length - 1; bi >= 0; bi--) {
            let b = m.bleeds[bi];
            b.ticksLeft--;
            if(b.ticksLeft % 10 === 0) bleedTotal += b.dmg;
            if(b.ticksLeft <= 0) m.bleeds.splice(bi, 1);
        }
        if(bleedTotal > 0) {
            // 🔧 出血精通：每秒出血總傷害 ×(1 + 0.1×層數)（每層 +10%、10 層 = +100%）
            if(m._bleedMastery) bleedTotal = Math.floor(bleedTotal * (1 + 0.10 * m.bleeds.length));
            let _bdc = _teamDotCrit(bleedTotal);   // 🏺 v3.1.80 永不終止的夢魘：出血 DoT 可爆擊
            m.curHp -= _bdc.dmg; m.justHit = 'magic'; mobWake(m); _dps.player += _bdc.dmg;   // 🎯 DPS：出血 DoT 歸玩家（同中毒，已知簡化）
            logCombat(`<span class="${getMobColor(m.lv)}">${m.n}</span> 受到出血傷害 ${_bdc.dmg} 點（${m.bleeds.length} 層）。${_bdc.crit ? ' <span class="text-yellow-500 font-bold">(爆擊!)</span>' : ''}`, 'dot');   // 🟢 出血 DoT→綠色持續傷害分類(原 'player' 藍色一般攻擊)
            if(m.curHp <= 0) { killMob(i); return true; }
            if(!state.ff) renderMobs();
        }
        if(m.bleeds.length === 0) { m._bleedMastery = false; m._bleedCap = 0; }   // 出血結束：清除精通旗標與層數上限
    }
    // 💥 猛爆劇毒 DoT：每秒(10 ticks)固定 100 真傷（無視硬皮/魔抗），持續 5 秒(50 ticks)、最多 1 層；獨立於一般中毒/出血
    if(m._burstPoison && m._burstPoison.left > 0) {
        m._burstPoison.left--;
        if(m._burstPoison.left % 10 === 0) {
            let _udc = _teamDotCrit(m._burstPoison.dmg);   // 🏺 v3.1.80 永不終止的夢魘：猛爆劇毒 DoT 可爆擊
            m.curHp -= _udc.dmg; m.justHit = 'magic'; mobWake(m); _dps.player += _udc.dmg;   // 🎯 DPS：猛爆劇毒 DoT 歸玩家（同中毒，已知簡化）
            logCombat(`<span class="${getMobColor(m.lv)}">${m.n}</span> 受到猛爆劇毒傷害 ${_udc.dmg} 點。${_udc.crit ? ' <span class="text-yellow-500 font-bold">(爆擊!)</span>' : ''}`, 'dot');   // 🟢 猛爆劇毒 DoT→綠色持續傷害分類(原 'player' 藍色一般攻擊)
            if(m.curHp <= 0) { m._burstPoison = null; killMob(i); return true; }
            if(!state.ff) renderMobs();
        }
        if(m._burstPoison.left <= 0) m._burstPoison = null;
    }
    // 🔥 灼燒 DoT（熔岩灼燒的雙拳·procBurn）：每 tick 造成 dmg 火傷，持續 left ticks；獨立於中毒/出血/猛爆劇毒
    if(m._burnDot && m._burnDot.left > 0) {
        m._burnDot.left--;
        if(m._burnDot.left % (m._burnDot.tick || 10) === 0) {
            let _fdc = _teamDotCrit(m._burnDot.dmg);   // 🏺 灼燒 DoT 可爆擊（與中毒/出血一致）
            m.curHp -= _fdc.dmg; m.justHit = 'fire'; mobWake(m); _dps.player += _fdc.dmg;   // 🎯 DPS：灼燒 DoT 歸玩家（同中毒·已知簡化）
            logCombat(`<span class="${getMobColor(m.lv)}">${m.n}</span> 受到灼燒傷害 ${_fdc.dmg} 點。${_fdc.crit ? ' <span class="text-yellow-500 font-bold">(爆擊!)</span>' : ''}`, 'dot');   // 🟢 灼燒 DoT→綠色持續傷害分類
            if(m.curHp <= 0) { m._burnDot = null; killMob(i); return true; }
            if(!state.ff) renderMobs();
        }
        if(m._burnDot.left <= 0) m._burnDot = null;
    }
    return m.curHp <= 0;
}

// ---------- 召喚物 ----------
function summonTierByLevel(lv) {
    // dmgMult：階級最終傷害倍率；hardSkinPen：忽略硬皮比例；高階觸發技改為固定間隔，避免長時間不發動或魅力多段造成爆量傷害。
    if(lv >= 72) return { n:'召喚：黑豹', dmgDice:[2,14], dmgDiv:6, dmgLvDiv:10, dmgMult:1.28, hardSkinPen:0.75, interval:10, kind:'melee', hitLvOff:20, proc:{ p:1, cd:80, dmgDice:[6,10], ele:'none', name:'撕咬' } };
    if(lv >= 64) return { n:'召喚：地獄束縛犬', dmgDice:[3,15], dmgDiv:4, dmgLvDiv:15, dmgMult:1.22, hardSkinPen:0.50, interval:20, kind:'melee', hitLvOff:15, proc:{ p:1, cd:100, dmgDice:[4,12], ele:'fire', name:'噴火' } };
    if(lv >= 60) return { n:'召喚：地獄奴隸', dmgDice:[3,12], dmgDiv:4, dmgLvDiv:20, dmgMult:1.18, hardSkinPen:0.50, interval:20, kind:'melee', hitLvOff:12, proc:{ p:1, cd:120, dmgDice:[1,32], ele:'earth', name:'地獄之牙' } };
    if(lv >= 52) return { n:'召喚：魔狼', dmgDice:[1,15], dmgDiv:5, dmgLvDiv:25, dmgMult:1.12, hardSkinPen:0.25, interval:10, kind:'melee', hitLvOff:10 };
    if(lv >= 40) return { n:'召喚：食人妖精', dmgDice:[2,11], dmgDiv:4, dmgLvDiv:30, dmgMult:1.08, interval:20, kind:'melee', hitLvOff:7 };
    if(lv >= 32) return { n:'召喚：甘地妖魔', dmgDice:[2,8], dmgDiv:5, dmgLvDiv:35, dmgMult:1.00, interval:20, kind:'melee', hitLvOff:3 };
    return { n:'召喚：哈柏哥布林', dmgDice:[1,15], dmgDiv:5, dmgLvDiv:40, dmgMult:0.90, interval:20, kind:'melee', hitLvOff:0 };
}
function buildSummon(skId, def, durSec, owner) {
    owner = owner || player;   // 🩸 v2.6.25 owner 參數化：分階依 owner.lv、屬性精靈依 owner.elfEle（傭兵召喚共用）
    // 🧙 v3.3.23 傭兵召喚術改用玩家 v2 傷害模型（抽象輸出·不上場）：依傭兵等級＋召喚控制戒指選怪（SUMMON_TIERS）·每攻擊週期打 count 隻份 v2 傷害。玩家 sk_summon 走 js/23 v2 實體制不經此；此分支只作用於傭兵(owner!==player)。無法召喚(等級/魅力不足)則落回下方舊分階模型。
    if (skId === 'sk_summon' && owner !== player && typeof mercSummonV2Plan === 'function') {
        let _plan = mercSummonV2Plan(owner);
        if (_plan) {
            let _d0 = _sumDerive({ form: _plan.form, n: _plan.form }, owner);
            return { skId: skId, n: _plan.form + ' ×' + _plan.count, _v2form: _plan.form, _v2count: _plan.count, _v2lv: _plan.lv,
                interval: _d0.aspd || 20, cd: _d0.aspd || 20, kind: 'v2', ele: 'none', dmgDice: [1, 1], dmgDiv: 5, dmgLvDiv: 0, elemScale: 20, dmgMult: 1, hardSkinPen: 0, mrPenBase: 0, hitLvOff: 0, proc: null,
                endTick: state.ticks + (durSec || 3600) * 10 };
        }
    }
    // 🧟 v3.3.24 傭兵造屍術改用玩家 v2 傷害模型（抽象輸出·不上場）：殭屍階級依傭兵等級（_zmbTierForPlayer）·單隻·每週期 1 刀 v2 傷害（_zmbDerive）。等級不足回 null 則落回下方舊模型。
    if (skId === 'sk_zombie' && owner !== player && typeof _zmbTierForPlayer === 'function') {
        let _zt = _zmbTierForPlayer(owner);
        if (_zt) {
            let _zd = _zmbDerive({ lv: _zt.lv, skId: 'sk_zombie' }, owner);
            return { skId: skId, n: '人形殭屍 Lv.' + _zt.lv, _v2form: '人形殭屍', _v2zmb: true, _v2count: 1, _v2lv: _zt.lv,
                interval: _zd.aspd || 12, cd: _zd.aspd || 12, kind: 'v2', ele: 'none', dmgDice: [1, 1], dmgDiv: 5, dmgLvDiv: 0, elemScale: 20, dmgMult: 1, hardSkinPen: 0, mrPenBase: 0, hitLvOff: 0, proc: null,
                endTick: state.ticks + (durSec || 3600) * 10 };
        }
    }
    let base = def.tiered ? summonTierByLevel(owner.lv) : def;
    let ele = base.ele || 'none';
    if(def.eleFromPlayer) ele = owner.elfEle || 'none';
    let nm = base.n;
    if(def.eleFromPlayer) {
        let eleZh = { fire:'火', water:'水', wind:'風', earth:'地', none:'無' }[ele] || '';
        nm = base.n.replace('{ele}', eleZh);
    }
    let _sm = {
        skId: skId, n: nm, dmgDice: base.dmgDice, interval: base.interval || 20,
        ele: ele, kind: base.kind || 'melee', hitLvOff: base.hitLvOff || 0,
        dmgDiv: base.dmgDiv || 5, dmgLvDiv: base.dmgLvDiv || 0, elemScale: base.elemScale || 20,
        dmgMult: base.dmgMult || 1, hardSkinPen: base.hardSkinPen || 0, mrPenBase: base.mrPenBase || 0,
        proc: base.proc ? { ...base.proc, cdCur: base.proc.cd } : null,
        cd: base.interval || 20, endTick: state.ticks + (durSec || 3600) * 10
    };
    if (typeof _elfSpiritKingOverride === 'function') _elfSpiritKingOverride(_sm, owner);   // 👑 v3.2.25 精靈精通→精靈王（傭兵鏡像）
    return _sm;
}
function refreshSummonBalance(sm, owner) {
    owner = owner || player;
    if (sm && sm._v2zmb) {   // 🧟 v3.3.24 傭兵造屍術 v2：讀檔後依當前等級重算殭屍階級與攻速（抽象輸出·無 dmgDice）
        let _zt = (typeof _zmbTierForPlayer === 'function') ? _zmbTierForPlayer(owner) : null;
        if (_zt) { let _zd = _zmbDerive({ lv: _zt.lv, skId: 'sk_zombie' }, owner); sm._v2lv = _zt.lv; sm.interval = _zd.aspd || 12; sm.n = '人形殭屍 Lv.' + _zt.lv; }
        return sm;
    }
    if (sm && sm._v2form) {   // 🧙 v3.3.23 傭兵召喚術 v2：讀檔後依當前等級/魅力/戒指重算選怪與攻速（抽象輸出·無 dmgDice·避免被下方舊分階模型洗回）
        let _plan = (typeof mercSummonV2Plan === 'function') ? mercSummonV2Plan(owner) : null;
        if (_plan) { let _d0 = _sumDerive({ form: _plan.form, n: _plan.form }, owner); sm._v2form = _plan.form; sm._v2count = _plan.count; sm._v2lv = _plan.lv; sm.interval = _d0.aspd || 20; sm.n = _plan.form + ' ×' + _plan.count; }
        return sm;
    }
    if(!sm || !sm.skId || !DB.skills[sm.skId] || !DB.skills[sm.skId].summon) return sm;
    let def = DB.skills[sm.skId].summon;
    let base = def.tiered ? summonTierByLevel(owner.lv) : def;
    sm.dmgDice = base.dmgDice;
    sm.interval = base.interval || 20;
    sm.hitLvOff = base.hitLvOff || 0;
    sm.dmgDiv = base.dmgDiv || 5;
    sm.dmgLvDiv = base.dmgLvDiv || 0;
    sm.elemScale = base.elemScale || 20;
    sm.dmgMult = base.dmgMult || 1;
    sm.hardSkinPen = base.hardSkinPen || 0;
    sm.mrPenBase = base.mrPenBase || 0;
    if(base.proc) {
        let oldCd = sm.proc && sm.proc.cdCur;
        sm.proc = { ...base.proc, cdCur: Math.min(oldCd > 0 ? oldCd : base.proc.cd, base.proc.cd) };
    } else sm.proc = null;
    if (typeof _elfSpiritKingOverride === 'function') _elfSpiritKingOverride(sm, owner);   // 👑 v3.2.25 讀檔重算後補套精靈王覆寫（否則被 def 原值洗回）
    return sm;
}
function setupSummon(skId, sk, owner) {
    owner = owner || player;   // 🩸 v2.6.25 owner 參數化：owner=player（玩家）或 ally（傭兵）；召喚物存於 owner.summon
    if(!owner.buffs) owner.buffs = {};
    // 同時只能有一個召喚物：清除其他召喚 buff
    (owner.skills || []).forEach(s => { let d = DB.skills[s]; if(d && d.summon) owner.buffs[s] = 0; });
    if(skId !== 'sk_charm') owner.buffs[skId] = sk.dur || 3600;
    owner.summon = buildSummon(skId, sk.summon, sk.dur || 3600, owner);
    if(sk.eleFromPlayer) owner.summon.ele = owner.elfEle || 'none';
    if(owner === player) logCombat(`你召喚了 <span class="text-purple-300">${owner.summon.n}</span>。`, 'magic', 'summon');
    else logCombat(`<span class="text-emerald-300 font-bold">【協力·${owner._allyName}】</span>召喚了 <span class="text-purple-300">${owner.summon.n}</span>。`, 'magic', 'summon');
}
function summonElementDamage(dice, ele, t, flatBonus, mult, mrPen) {
    let mrBase = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    mrBase = Math.max(0, mrBase - (mrPen || 0));
    let mrFactor = mrMult(mrBase);
    let base = (roll(dice[0], dice[1]) + (flatBonus || 0)) * (mult || 1);
    return Math.max(1, Math.floor(Math.max(1, Math.floor(base * mrFactor)) * fragileMult(t) * elementCounterMult(ele, t.e)));   // 🔮 魔法不受物理 DR；脆弱＋屬性剋制仍保留
}
// ===== 協力角色：讀取其他存檔位(非當前)的角色，以其真實戰力(等級/能力/裝備)一起作戰 =====
function allySlotList() { return ['1','2','3','4','5','6','7','8'].filter(n => n !== String(currentSlot)); }   // 🔧 8 格存檔：可招募自身以外 7 格（但同時上場上限仍為 3，見 toggleAlly / ALLY_ACTIVE_MAX）
const ALLY_ACTIVE_MAX = 3;   // 🔧 協力傭兵同時上場上限（不論存檔格數多少，最多 3 名）
function allyActiveCap() { return ALLY_ACTIVE_MAX; }   // 全職業同時上場上限 3。
// 王族魅力加成只作用於傭兵：傷害/HP/MP ×(1+魅力/100)。寵物使用 js/22 的獨立固定加值公式。
function royalAllyMult() { return (player && player.cls === 'royal') ? (1 + (((player.d && player.d.cha) || 0)) / 100) : 1; }
function isAllyActive(slotN) { return !!(player.allies && player.allies.some(a => a && a._slot === String(slotN))); }
// 由存檔位建立協力角色：載入該存檔 player → 暫時切換全域 player 跑 calcStats 取得真實衍生戰力 → 還原
// 協力顯示名稱：有取名→角色名；否則用職業中文（騎士/法師/妖精）
function allyName(a) {
    if (!a) return '';
    if (a.name) return a.name;
    return ({ knight: '騎士', mage: '法師', elf: '妖精', dark: '黑暗妖精', illusion: '幻術士', dragon: '龍騎士', warrior: '戰士', royal: '王族' })[a.cls] || a.cls || ('存檔' + (a._slot || ''));
}
// ===== 🤝 v3.4.23 傭兵設定記憶（喝水＋技能）＋來源存檔換角自動解散 =====
// 讀某存檔位「當前角色」的 enSeed（唯一角色識別）：無存檔/無 enSeed（極舊檔）→ ''
function _slotCharEnSeed(slotN) {
    try {
        let raw = _saveUnwrap(_lzGet('lineage_idle_save_' + String(slotN))).payload;
        if (!raw) return '';
        let p = JSON.parse(raw).p;
        return (p && p.enSeed) || '';
    } catch (e) { return ''; }
}
// 傭兵可記憶的「喝水＋技能設定」欄位（跨解散/重新招募沿用；戰力快照仍每次重建，只有這些偏好還原）
const MERC_PREF_FIELDS = ['_atkSkill', '_healSkill', '_convertSkill', '_healHpPct', '_potHpPct', '_hpSkillPct', '_castMpPct', '_hpSafePct'];
// 解散/重新招募前呼叫：把該傭兵當前設定存入 player.mercPrefs（鍵＝enSeed·同一角色再次招募即還原）
function snapshotMercPrefs(ally) {
    try {
        if (!ally || !ally.enSeed) return;   // 無 enSeed（極舊快照）→ 無法可靠識別同一角色·不記憶
        if (!player.mercPrefs || typeof player.mercPrefs !== 'object') player.mercPrefs = {};
        let pref = {};
        MERC_PREF_FIELDS.forEach(f => { if (ally[f] !== undefined && ally[f] !== null) pref[f] = ally[f]; });
        pref._autoBuff = (ally._autoBuff && typeof ally._autoBuff === 'object') ? JSON.parse(JSON.stringify(ally._autoBuff)) : {};   // 逐兵「自動維持」勾選
        player.mercPrefs[ally.enSeed] = pref;
    } catch (e) {}
}
// buildAlly 尾呼叫：若有同一角色（enSeed）的記憶設定→套回（喝水門檻＋攻擊/治癒/轉換下拉＋各門檻＋自動維持勾選）
function applyMercPrefs(ally) {
    try {
        if (!ally || !ally.enSeed || !player.mercPrefs) return;
        let pref = player.mercPrefs[ally.enSeed];
        if (!pref || typeof pref !== 'object') return;
        MERC_PREF_FIELDS.forEach(f => { if (pref[f] !== undefined) ally[f] = pref[f]; });
        if (pref._autoBuff && typeof pref._autoBuff === 'object') ally._autoBuff = JSON.parse(JSON.stringify(pref._autoBuff));
    } catch (e) {}
}
// 掃描出戰傭兵：來源存檔位已換成「不同 enSeed 的新角色」→ 自動解散（記憶舊設定·結算待領經驗）。
//   規則：傭兵與該存檔位當前角色 enSeed 皆存在且不同 → 換角 → 解散；任一無 enSeed 則無法判定·保留（避免舊存檔誤判）。
function purgeReplacedAllies() {
    try {
        if (!player.allies || !player.allies.length) return;
        let removed = [];
        player.allies = player.allies.filter(a => {
            if (!a) return false;
            if (!a.enSeed) return true;                       // 傭兵快照無 enSeed → 不判定
            let curSeed = _slotCharEnSeed(a._slot);
            if (!curSeed) return true;                        // 存檔位空/角色無 enSeed → 交由既有「來源不存在」流程處理
            if (curSeed === a.enSeed) return true;            // 同一角色 → 保留
            snapshotMercPrefs(a);                             // 換成新角色 → 記憶舊角色設定後解散
            _settleAllyExp(a, 'dismiss');
            removed.push(a._allyName || ('存檔 ' + a._slot));
            return false;
        });
        if (removed.length) {
            logSys(`<span class="text-amber-300">協力傭兵 ${removed.join('、')} 的來源存檔已建立新角色，已自動解散（累積經驗記入待領帳本）。</span>`);
            try { saveGame(); } catch (e) {}
        }
    } catch (e) {}
}
function buildAlly(slotN) {
    slotN = String(slotN);
    let raw = _saveUnwrap(_lzGet('lineage_idle_save_' + slotN)).payload;   // 🛡️ 先解存檔簽章（招募傭兵讀別的存檔位；不驗章、僅取 payload）
    if (!raw) return null;
    let p; try { p = JSON.parse(raw).p; } catch(e) { return null; }
    if (!p || !p.cls) return null;
    let ally = JSON.parse(JSON.stringify(p));   // 深拷貝，不動原存檔
    ally._mercPermanentPotions = true;   // 🤝 全職常駐加速；勇敢/餅乾/慎重依職業於 recomputeStats 套用
    // 安全防護：補齊 calcStats 會取用的欄位，並清掉協力者自身的召喚/夥伴/變身
    ally.buffs = ally.buffs || {}; ally.statuses = ally.statuses || {}; ally.eq = ally.eq || {}; ally.skills = ally.skills || [];
    ally.blessings = (ally.blessings && typeof ally.blessings === 'object') ? ally.blessings : {};
    ally.alloc = ally.alloc || { str:0,dex:0,con:0,int:0,wis:0,cha:0 };
    ally.panacea = ally.panacea || { str:0,dex:0,con:0,int:0,wis:0,cha:0 };
    ally.poly = null; ally.summon = null; ally.charmed = null; ally.partners = []; ally.allies = [];
    delete ally.summonsV2; delete ally._summonV2On; delete ally._summonV2Sk; delete ally._summonV2RecastCd;   // 🧙 v3.2.40 稽核修：來源存檔的 v2 召喚欄位不隨傭兵快照入檔（無人讀取·純存檔肥大）
    let _save = player;
    // 🆕 v3.0.93 收集冊加成（卡片/裝備/道具/娃娃全收集）：招募快照改讀「招募者(隊長)即時共用桶」而非傭兵來源存檔的舊快照
    //   → 娃娃全收集六維+1、裝備/道具/卡片收集冊全收集加成 於招募當下即計入傭兵衍生值（比照 _allyLevelRecompute 升級重算路徑；先前只有升級才吃、招募未套用）
    let _oc = ally.cardDex, _oe = ally.equipDex, _om = ally.miscDex;
    if (_save) { ally.cardDex = _save.cardDex; ally.equipDex = _save.equipDex; ally.miscDex = _save.miscDex; }
    player = ally; let ok = true;
    _recomputingAlly = true;   // 🌟 v3.0.100 標記傭兵重算→跳過「傭兵化身光環注入玩家」段（傭兵走 alliesTick 注入）
    try { recomputeStats(); } catch(e) { ok = false; }   // 🔧 架構#4：換身重算改用純計算版，不觸發 UI 副作用
    _recomputingAlly = false;
    ally.cardDex = _oc; ally.equipDex = _oe; ally.miscDex = _om;   // 還原傭兵自身欄位（避免存檔快照被隊長共用桶引用污染）
    player = _save; calcStats();   // 還原真實玩家的衍生值並刷新 UI
    if (!ok) return null;
    _applyMercCubeRes(ally);   // 🔮 v2.7.96 幻術士傭兵立方屬性抗性 rider（招募快照·比照玩家立方 buff 給 +30 抗性）
    { let _rm = royalAllyMult(); if (_rm !== 1) { ally.mhp = Math.max(1, Math.floor((ally.mhp || 1) * _rm)); ally.mmp = Math.floor((ally.mmp || 0) * _rm); } }   // 👑 王族魅力加成：傭兵 HP/MP ×(1+魅力/100)（招募當下快照·主玩家 player 已於上行還原）
    ally._slot = slotN; ally._allyName = allyName(ally); ally._atkCd = 0; ally.curHp = ally.mhp;
    ally._downed = false;   // 🤝 Phase 3：倒地旗標（curHp 歸零→true·停止行動/不被選為目標·須隊伍面板手動復活）
    ally._reviveCd = 0;   // 🤝 Phase 3：倒地後復活冷卻（ticks 倒數；倒地時設 150＝15秒·每 tick 於 alliesTick 遞減·存檔安全相對值）
    ally.statuses = {};   // 🤝 Phase4：招募即清空異常狀態（避免繼承來源存檔殘留的中毒/冰凍等）
    ally.exp = 0;   // 🤝 當前等級的經驗進度（升級時歸零再累積）
    ally._expGained = 0;   // 🤝 受雇期間「賺到的經驗總量」（含已被即時升級消耗的）→ 解雇時 delta-merge 加回該存檔角色（多開安全）
    ally._atkSkill = (ally.config && ally.config.selAtkSkill) || '';   // 攻擊技能選擇（快照；法師施法 / 妖精三重矢）
    ally._healSkill = '';   // 🤝 v2.6.53 用戶選A：招募「不自動繼承治癒技」→傭兵預設攻擊優先（不再因來源角色有設治癒魔法就一直自動補血、把攻擊技/攻擊魔法回合吃光）。想要傭兵補血→於隊伍面板「治癒魔法」下拉手動指定(setAllyHealSkill·即時生效)。⚠️只影響「新招募」：已在隊傭兵的 _healSkill 早存於存檔·buildAlly 只在招募跑·不受影響（原：(ally.config&&ally.config.selHealSkill)||''）
    ally._convertSkill = (ally.config && ally.config.selConvertSkill) || '';   // 🔄 v2.6.4 轉換技能選擇（快照·可於隊伍面板改）：type:'convert' 或 立方和諧
    ally._healHpPct = 70;   // 🤝 治癒施放 HP% 門檻預設（可於隊伍面板改）
    ally.mp = ally.mmp;   // 召喚時滿魔
    { let _w = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null; ally._rapidfire = (_w && _w.isBow && _w.rapidfire) ? _w.rapidfire : 0; }   // 妖精弓：記錄連射發動機率
    applyMercPrefs(ally);   // 🤝 v3.4.23 同一角色（enSeed）先前的喝水＋技能設定記憶→套回（首次招募無記憶則沿用來源快照預設）
    return ally;
}
// 協力角色攻擊一次（自包含，直接用 ally 的真實衍生值；法師走魔法、其餘走物理）
// 🔧 對不死/狼人加成（傭兵版，比照玩家 getPhysicalDmg）：武器帶 unBonus/unDice/精靈套裝、且目標為不死(un)或狼人(isWolf) → 額外 +1D20 固定傷害
function allyUnbonusBonus(ally, t) {
    let w = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
    let v = 0;
    if (w && (w.unBonus || w.unDice || w.sp === 'elf') && t && (t.un || t.isWolf)) v += roll(1, 20);
    else if (ally.buffs && ally.buffs.sk_holy_wpn > 0 && t && t.un) v += roll(1, 20);   // ✨ v3.1.77 神聖武器（傭兵）：僅對不死 +1D20·與武器 unBonus 互斥不疊加（鏡像玩家 js/03:889-893·原傭兵維持只拿到 d:{extraDmg/extraHit}）
    if (w && w.giantBonus && t && t.race === '巨人') v += roll(1, 20);   // 🏺 v3.1.80 傑克的彈弓（傭兵）：對巨人加成 +1D20（鏡像玩家 js/03·獨立於不死/狼人加成）
    return v;
}
// 🔮 幻術士傭兵 奇古獸攻擊：公式同玩家 qiguPlayerAttack，改用傭兵自身衍生值；奇古獸精通無視MR
function allyQiguAttack(ally, t, wpn) {
    let d = ally.d || {};
    if (wpn.procInstakill && t.curHp > 0 && !t._dead) {   // 🏺 遺物 曼陀羅之靈（傭兵奇古獸）：即死 proc（魔法路徑不經 allyOnHitEffects·比照玩家 qiguPlayerAttack 於此補上）
        let _pk = wpn.procInstakill;
        let _thp = t.hp || 1;   // 🐍 v3.1.76 獻祭 healPct：先取被消滅敵人最大HP（鏡像玩家 js/04）
        if ((!_pk.maxLv || t.lv <= _pk.maxLv) && (!_pk.hpBelow || t.curHp <= Math.max(1, Math.floor((t.hp || 1) * _pk.hpBelow)))) { let _ri = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (_ri !== -1 && tryInstakill(t, { p: _pk.p, tag: _pk.tag || null }, `【協力·${ally._allyName}】${wpn.n}`, _ri)) { if (_pk.healPct) ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + Math.max(1, Math.floor(_thp * _pk.healPct))); return; } }   // 🏺 v3.1.80 hpBelow：僅對 HP 低於 N% 目標觸發（鏡像玩家）
    }
    let dice = (t.s === 'L') ? wpn.dmgL : wpn.dmgS;
    let ele = 'none';
    { let _qa = ally.eq.wpn && getAttrAffix(ally.eq.wpn.attr); if (_qa) ele = _qa.ele; }   // 🔥 getAttrAffix：相容舊12代碼
    let raw = magicBaseDamage(roll(1, dice), d, d.extraDmg || 0, true) * weaponMagicDamageCoef(d, wpn, t, ele);
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let ignoreMr = (ally.mastery === 'i_qigu' && wpn.qigu);
    let dmg = Math.max(1, Math.floor(raw * (ignoreMr ? 1 : mrMult(effMr))));
    dmg = Math.max(1, Math.floor(dmg * wpnEnFinalMult(ally.eq.wpn)));
    dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（奇古獸·原僅紅獅字面）
    dmg = Math.max(1, Math.floor(dmg * fragileMult(t) * illuLvMult(ally)));   // 🔮 幻術士(傭兵)等級加成 ×(1+等級/50)
    dmg = Math.max(1, Math.floor(dmg * elementCounterMult(ele, t.e)));   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
    dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
    t.curHp -= dmg; t.justHit = (ele !== 'none') ? ele : 'magic';
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    mobWake(t);
    if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, dmg, 'magic', ally);   // 🌑 v3.4.14 血壁空間：奇古獸普攻主擊＝魔法反射（鏡像玩家 qiguPlayerAttack）
    if (ally._setWhiteBird5 && t.curHp > 0 && !t._dead) { if (!t.st) t.st = newMobStatus(); t.st.fragile = 30; }   // 🔮 白鳥 5/5（傭兵奇古獸）：命中附加脆弱（魔法路徑不經 allyOnHitEffects，故此處補上）
    logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>奇古獸對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點魔法傷害。`, 'magic');
    // 奇古獸特效（幻影衝擊/心靈破壞，用傭兵最大MP）
    if (wpn.qiguProc) {
        let en = capWpnEn((ally.eq.wpn && ally.eq.wpn.en) || 0);
        if (t.curHp > 0 && Math.random() < (1 + en) / 100) {
            let pd = 0, lb = '';
            if (wpn.qiguProc === 'phantom') { pd = magicBaseDamage(79 + roll(1, 81), ally.d, 0, true) * weaponMagicDamageCoef(ally.d, wpn, t, 'none'); lb = '幻影衝擊'; }
            else if (wpn.qiguProc === 'mindbreak') { let _m = (t.st && t.st.mrhalf > 0) ? t.mr/2 : t.mr; pd = Math.max(1, Math.floor(magicBaseDamage((ally.mmp||0) * 0.05, ally.d, 0, true) * weaponMagicDamageCoef(ally.d, wpn, t, 'none') * ((ally.mastery==='i_qigu' && wpn.qigu)?1:mrMult(_m)))); lb = '心靈破壞'; }
            if (pd > 0) { pd = Math.max(1, Math.floor(pd * fragileMult(t) * illuLvMult(ally) * enhanceWpnFinalMult(en, wpn))); pd = Math.max(1, Math.floor(pd * royalAllyMult()));   /* 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100) */ t.curHp -= pd; t.justHit = 'magic'; mobWake(t); logCombat(`<span class="font-bold" style="color:#a78bfa;">【協力·${lb}】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${pd} 點傷害！`, 'magic'); }
        }
    }
    let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (ri !== -1) killMob(ri); } else renderMobs();
    allyWeaponProcs(ally, t, { hit: true, dmg: dmg });   // 🔮 共鳴等（幻術士魔杖；非共鳴武器內部 no-op，主目標已死自動轉移）
}
function allyAttackOnce(ally, _arrowDelay) {   // 🏹 v3.2.14 _arrowDelay(選用·ms)：三重矢連發時逐箭錯開（未傳＝0 立即發射）
    if (!ally || !ally.d) return;
    let t = getTarget(); if (!t || t.curHp <= 0) return;
    ally._faceTgtUid = t.uid;   // 🧭 只記錄可序列化 UID，避免傭兵與怪物互相引用造成存檔循環
    delete ally._faceTgt;
    if (typeof _allySpriteTrigger === 'function') _allySpriteTrigger(ally, 'attack');   // 🤝 v3.0.70 隊員戰場 sprite：攻擊動作
    if (typeof playArrowFx === 'function') playArrowFx(ally, t, _arrowDelay);   // 🏹 v3.2.8 弓箭投射物（非弓武器內部 no-op）
    let d = ally.d;
    // 🔮 幻術士傭兵 奇古獸攻擊（公式同玩家，用傭兵自身衍生值；裝奇古獸或魔劍精通）
    if (ally.cls === 'illusion') {
        let _qw = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
        if (_qw && !_qw.isBow && (_qw.qigu || (ally.mastery === 'i_magicsword' && !isWandWeapon(_qw)))) { allyQiguAttack(ally, t, _qw); return; }   // 🔮 魔劍精通：排除魔杖
    }
    if (ally.cls === 'mage') {
        let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
        let mrFactor = mrMult(effMr);
        let isCrit = Math.random()*100 < (d.magicCrit || 0);
        let _light = DB.skills['sk_lightarrow'] || { dmgDice:[1,10], dmgBase:8, ele:'none' };
        let spCoef = magicDamageCoef(d, magicAttrDefense(t, _light.ele || 'none'), _light.tier);
        let critMult = isCrit ? (1 + (d.magicCritDmg||0)/100) : 1;
        let base = magicBaseDamage(roll(_light.dmgDice[0], _light.dmgDice[1]), d, _light.dmgBase || 0, true) * spCoef * critMult;
        let dmg = Math.max(1, Math.floor(base * mrFactor));
        dmg = Math.max(1, Math.floor(dmg * fragileMult(t)));   // 🔮 脆弱（白鳥5）
        dmg = Math.max(1, Math.floor(dmg * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔧 武器強化 +11~+20：最終傷害倍率（傭兵法師光箭普攻·與玩家普攻一致）
        dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（法師光箭普攻·原全無·鏡像玩家 procLightArrow）
        dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
        t.curHp -= dmg; t.justHit = 'magic'; mobWake(t);
        if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, dmg, 'magic', ally);   // 🌑 v3.4.14 血壁空間：法師光箭普攻主擊＝魔法反射（普攻主擊反射·玩家傭兵一致）
        logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>魔法攻擊 <span class="${getMobColor(t.lv)}">${t.n}</span>，造成 <span class="${isCrit?'text-yellow-500 font-bold':'text-emerald-200'}">${dmg}</span> 點傷害。`, 'magic');
        allyWeaponProcs(ally, t, { hit: true, dmg: dmg });   // 🔧 法師普攻（光箭）也觸發武器特效：共鳴/魔擊/瑪那回魔
        if (ally._setWhiteBird5 && t.curHp > 0 && !t._dead) { if (!t.st) t.st = newMobStatus(); t.st.fragile = 30; }   // 🔮 白鳥 5/5（傭兵法師光箭）：一般攻擊命中附加脆弱（物理分支於 allyOnHitEffects 套用、魔法分支不經該函式，故此處補上）
    } else {
        let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
        let isLarge = t.s === 'L';
        let dice = wpn ? (isLarge ? wpn.dmgL : wpn.dmgS) : 2;
        let isRanged = !!(wpn && wpn.ranged);
        let hitB = (isRanged ? (d.rangedHit||0) : (d.meleeHit||0)) + (d.extraHit||0) + (ally._setBeauty5 ? (ally._beautyMissStack || 0) : 0);   // 🔮 v2.6.21 麗人5/5：未命中堆疊命中（鏡像玩家 js/03:763·取代舊「重擊→必中」）
        let dmgB = isRanged ? (d.rangedDmg||0) : (d.meleeDmg||0);
        if (wpn && wpn.hasteStrike && ally.buffs && ally.buffs.haste > 0) { hitB += 30; dmgB += 30; }   // 🏺 v3.1.76 殺人蜂的尾刺（傭兵）：加速狀態時額外傷害/命中 +30（命中後於下方清除加速·鏡像玩家 js/03:823）
        let critR = isRanged ? (d.rangedCrit||0) : (d.meleeCrit||0);
        let critD = isRanged ? (d.rangedCritDmg||0) : (d.meleeCritDmg||0);
        let _evSure = !!ally._darkEvadeSure, _evCrit = !!ally._darkEvadeCrit;   // 🆕 v2.6.13 #5b 迴避精通：迴避後下一次一般攻擊必中(_evSure)且必爆(_evCrit)
        if (_evSure || _evCrit) { ally._darkEvadeSure = false; ally._darkEvadeCrit = false; }
        // 🌀 v3.1.78 怪物迴避率（傭兵·鏡像玩家 js/04:14）：原傭兵攻擊不受 target.er 判定＝傭兵優於玩家的不對稱；被迴避仍判定普攻特效/連擊/副手（與未命中分支一致）
        if (!_evSure && t.er && roll(1, 100) <= t.er) {
            logCombat(`<span class="${getMobColor(t.lv)}">${t.n}</span> 成功迴避 <span class="text-sky-300 font-bold">協力·${ally._allyName}</span> 的攻擊。`, 'evade');
            allyWeaponProcs(ally, t, { hit: false, dmg: 0 });
            if (wpn && wpn.eff === 'combo' && Math.random() * 100 < (wpn.comboRate || 0)) allyComboAttack(ally, t, true);
            if (ally.eq && ally.eq.offwpn) allyDualWieldOffhandAttack(ally, t);
            return;
        }
        let hv = stretchHitValue((ally.lv||1) + hitB - t.lv + mobEffAC(t, ally));   // 🩹 v3.1.76 稽核高#1：改走與玩家/怪打玩家/怪打傭兵相同的軟地板曲線（原線性 clamp 對高AC怪命中系統性偏低·v3.1.40 怪物AC以此曲線為錨）
        if (ally.buffs && ally.buffs.sk_warrior_outlaw > 0) hv = Math.max(hv, 10);   // ⚔️ v3.1.77 亡命之徒（傭兵）：一般攻擊最低命中率 50%（鏡像玩家 js/03:830·原傭兵維持此 buff 白扣 MP）
        let _cwA = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;   // 🥊 v2.6.20 重擊特效武器(粉碎·雙手鈍器)
        let _isCrushA = !!(_cwA && _cwA.eff === 'crush');
        let r = roll(1,20);
        let _grazeA = false, _crushA = false;
        let _normA = _evSure || (r === 20) || (r !== 1 && hv >= r) || (r === 1 && ally.buffs && ally.buffs.sk_elf_preciseshot > 0);
        if (_isCrushA && r !== 20 && r >= 19 - Math.round(((_cwA && _cwA.heavyRatePct) || 0) / 5) && (!ally.classicMode || (_cwA && _cwA.classicOk) || r !== 19)) { _crushA = true; _normA = true; }   // 🏺 v3.2.40 稽核修：粉碎升級優先於普通命中（對齊玩家 js/03:787）；🎮 v3.2.44 用戶拍板：經典模式只停「骰19」一般重擊特效——heavyRatePct 擴充段（方尖碑 17~18）照樣重擊·classicOk 全放行（鏡像玩家）
        if (!_normA) {   // 🥊 v2.6.20 骰19：擦傷(50%·不爆)；其餘未命中（鏡像玩家 getPhysicalDmg 782/785）
            if (r === 19) _grazeA = true;
            else if (wpn && wpn.missGrazeRate && Math.random() * 100 < wpn.missGrazeRate) _grazeA = true;   // 🏺 水精靈王的撫摸（傭兵）：未命中時 30% 改判擦傷
            else { if (ally._setBeauty5) ally._beautyMissStack = (ally._beautyMissStack || 0) + 10;   /* 🔮 v2.6.21 麗人5/5：未命中→命中堆疊+10（鏡像玩家 786） */ logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>的攻擊未命中。`, 'miss'); allyWeaponProcs(ally, t, { hit: false, dmg: 0 }); if (wpn && wpn.eff === 'combo' && Math.random() * 100 < (wpn.comboRate || 0)) allyComboAttack(ally, t, true); if (ally.eq && ally.eq.offwpn) allyDualWieldOffhandAttack(ally, t); return; }   // 🔧 未命中也判定共鳴/魔擊/月光爆裂/連擊/迅猛雙斧（與玩家一致）
        }
        if (ally._setBeauty5 && ally._beautyMissStack) ally._beautyMissStack = 0;   // 🔮 v2.6.21 麗人5/5：命中（含擦傷/粉碎）→堆疊歸零（鏡像玩家 787）
        let heavy = (r === 20) || _crushA;   // 🥊 v2.6.20 粉碎：骰19重擊
        if (!heavy && !_grazeA && !ally.classicMode && ally.eq && ally.eq.wpn && getWeaponTags(ally.eq.wpn.id).includes('鋼爪') && Math.random() < 0.05) heavy = true;   // ⚔️ 鋼爪內建特性（傭兵·鏡像玩家 getPhysicalDmg）：一般攻擊命中(非擦傷)額外 5% 重擊·經典停用
        let isCrit = !_grazeA && (_evCrit || (Math.random()*100 < critR));   // 🆕 v2.6.13 #5b 迴避精通：迴避後下一擊必爆；🥊 v2.6.20 擦傷不爆
        let critMult = isCrit ? (1 + critD/100) : 1;
        let wpnRoll = (heavy || (!isRanged && ally.buffs && ally.buffs.sk_elf_flamesoul > 0)) ? dice : roll(1, dice);   // 🔥 v3.1.77 烈焰之魂（傭兵）：近距離一般攻擊武器擲骰必定最大值（鏡像玩家 js/03:861·原傭兵維持此 buff 白扣 MP）
        let _hsT = mobHardSkin(t);   // 🔧 穿透精通用：被硬皮扣減前的量
        let _hsSub = (wpn && wpn.ignHardSkin) ? 0 : _hsT;   // 🗡️ 貫穿（暗黑十字弓）：傭兵攻擊無視硬皮額外減傷（_hsT 仍保留供穿透精通加回）
        let dmg = Math.max(1, Math.floor((wpnRoll + dmgB) * critMult) + (d.extraDmg||0) - (t.dr||0) - _hsSub);   // 🔧 硬皮：額外物理減傷（貫穿時不扣）
        { let _unb = allyUnbonusBonus(ally, t); if (_unb) dmg += _unb; }   // 🔧 對不死/狼人加成 +1D20（與玩家一致；在看破/殺戮倍率前加入）
        if (ally._giltasFuryUntil > state.ticks && ally.eq && ally.eq.wpn && ally.eq.wpn.id === 'wpn_giltas_sword') dmg += 10;   // 🗡️ v3.4.0 吉爾塔斯之劍（傭兵）：擊殺後 10 秒內額外傷害 +10（killMob 寫入·鏡像玩家 js/03）
        // 騎士被動（依協力者等級，僅近戰）：看破 Lv1起5%/每10等+1%上限15%→×2；殺戮 Lv20起1%/每20等+1%上限5%→×3；兩者同時=屠殺→×6
        let kp = '';
        let _meleePassive = (ally.cls === 'knight') || allyHasMastery(ally, 'e_sword');   // 🔧 劍術精通：妖精傭兵近戰也可看破
        if (_meleePassive && !isRanged && !ally.classicMode) {   // 🎮 經典模式：傭兵騎士無看破/殺戮被動
            let lv = ally.lv || 1;
            let insightRate = Math.min(15, 5 + Math.floor(lv / 10));
            let slayRate = (ally.cls === 'knight' && lv >= 20) ? Math.min(5, 1 + Math.floor((lv - 20) / 20)) : 0;   // 殺戮/屠殺僅騎士
            let insight = Math.random() * 100 < insightRate;
            let slay = slayRate > 0 && (Math.random() * 100 < slayRate);
            if (insight && slay) { dmg *= 6; kp = '<span class="font-bold" style="color:#f0abfc;text-shadow:0 0 6px #d946ef;">【屠殺】</span>'; }
            else if (insight) { dmg *= 2; kp = '<span class="text-cyan-300 font-bold">【看破】</span>'; }
            else if (slay) { dmg *= 3; kp = '<span class="text-orange-400 font-bold">【殺戮】</span>'; }
        }
        if (heavy && allyHasMastery(ally, 'k_cleave') && wpn && wpn.eff === 'cleave') dmg = Math.max(1, Math.floor(dmg * 1.5));   // 🏅 切割精通（傭兵）：觸發重擊時傷害 ×1.5
        if (heavy && wpn && wpn.heavyMult) dmg = Math.max(1, Math.floor(dmg * wpn.heavyMult));   // 🏺 v3.1.76 鎧甲守衛的笨重巨劍（傭兵）：重擊傷害 ×heavyMult（鏡像玩家 js/03:903）
        if (ally.statuses && ally.statuses.broken > 0) dmg = Math.max(1, Math.floor(dmg * 0.8));   // 🐍 v3.1.76 壞物術（易碎泥偶自傷·傭兵）：期間物理傷害 -20%（鏡像玩家 js/03:904）
        if (_grazeA) dmg = Math.max(1, Math.floor(dmg * 0.5));   // 🥊 v2.6.20 擦傷：最終傷害剩 50%（鏡像玩家 833·置於脆弱前）
        dmg = Math.max(1, Math.floor(dmg * fragileMult(t)));   // 🔮 脆弱（白鳥5）
        dmg = _allyAtkBuffProcs(ally, dmg, isRanged);   // 🆕 v2.6.9 #1b：攻擊 buff proc（燃燒鬥志/屬性之火/雙重破壞/狂暴/勇猛意志/燃燒擊砍）·狂暴已併入此
        dmg = Math.max(1, Math.floor(dmg * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔧 武器強化 +11~+20：最終傷害倍率（傭兵物理普攻·與玩家普攻 getPhysicalDmg 一致）
        {   // ⚔️ 武器屬性剋制倍率（物理普攻）；不定形的變幻劍對四大屬性一律視為剋制
            let _ecmA = elementCounterMult(getWpnEle(ally.eq ? ally.eq.wpn : null, wpn), t.e);
            if (wpn && wpn.counterAllEle && t.e && t.e !== 'none') _ecmA = Math.max(_ecmA, 1.4);
            dmg = Math.max(1, Math.floor(dmg * _ecmA));
        }
        if (t._fireVulnUntil > state.ticks && getWpnEle(ally.eq ? ally.eq.wpn : null, wpn) === 'fire') dmg = Math.max(1, Math.floor(dmg * 1.3));   // 🏺 v3.1.76 灼熱蜥蜴長舌（傭兵受益端）：目標帶火屬性弱點時受火屬性攻擊 +30%（鏡像玩家 js/03:901）
        if (d.eleWpnMult && getWpnEle(ally.eq ? ally.eq.wpn : null, wpn) === d.eleWpnMult.ele) dmg = Math.max(1, Math.floor(dmg * d.eleWpnMult.mult));   // 🏺 v3.1.80 四之牙臂甲（傭兵主攻）：裝備對應屬性武器時一般攻擊傷害 ×1.2（鏡像玩家 getPhysicalDmg）
        dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（物理普攻·原全無·鏡像玩家 getPhysicalDmg）
        dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
        let _dualX2A = false;   // ⚔️ 雙刀內建特性（傭兵·鏡像玩家）：一般攻擊命中(非擦傷) 5% 機率最終傷害×2·經典停用
        if (!_grazeA && !ally.classicMode && ally.eq && ally.eq.wpn && getWeaponTags(ally.eq.wpn.id).includes('雙刀') && Math.random() < 0.05) { _dualX2A = true; dmg = Math.max(1, dmg * 2); }
        if (wpn && wpn.hardSkinMult && _hsT > 0) dmg = Math.max(1, Math.floor(dmg * wpn.hardSkinMult));   // 🦀 目標有硬皮→一般攻擊傷害×1.5（傭兵鏡像玩家）
        if (wpn && wpn.softMult && _hsT <= 0) dmg = Math.max(1, Math.floor(dmg * wpn.softMult));   // 🏺 不死將軍的珍愛巨劍：對「無硬皮」敵人傷害×1.3（傭兵鏡像玩家）
        { let _fhmA = wpn && (_allyInTriple ? (!_allyTripleFhmUsed ? wpn.fullHpMultTriple : null) : wpn.fullHpMult); if (_fhmA && t.curHp === t.hp) { dmg = Math.max(1, Math.floor(dmg * _fhmA)); if (_allyInTriple) _allyTripleFhmUsed = true; } }   // 🏺 遺忘者的狙擊弓：三重矢對滿血×2（每次施放最多 1 箭·對齊玩家「僅第一箭」·防第1箭擊殺滿血怪後轉目標再吃×2）／一般攻擊對滿血×3（傭兵鏡像玩家·_allyInTriple 區分兩者）
        if (wpn && wpn.silencedBonusDmg && t.st && t.st.magicseal > 0) dmg += wpn.silencedBonusDmg;   // 🏺 沉默的毒液：對沉默(magicseal)敵人額外固定傷害 +20（傭兵鏡像玩家）
        if (wpn && wpn.poisonedBonusDmg && t.st && t.st.poison > 0) dmg += wpn.poisonedBonusDmg;   // 🐍 艾庫卡伊拉的毒牙：對中毒敵人額外固定傷害 +15（傭兵鏡像玩家）
        if (wpn && wpn.slowedBonusDmg && t.st && t.st.slow > 0) dmg += wpn.slowedBonusDmg;   // 🐍 艾庫艾托的鞭笞藤：對緩速敵人額外固定傷害 +10（傭兵鏡像玩家）
        if (wpn && wpn.raceBonus && t.race === wpn.raceBonus.race) dmg = Math.max(1, Math.floor(dmg * (wpn.raceBonus.mult || 1)));   // 🕷️ 刺針：對特定種族（蜘蛛）傷害×N（傭兵鏡像玩家）
        if (wpn && wpn.raceFlat && t.race === wpn.raceFlat.race) dmg = dmg + (wpn.raceFlat.add || 0);   // 🏺 遺物 上古蜘蛛之爪：對特定種族（動物）額外固定傷害 +N（傭兵鏡像玩家）
        if (wpn && wpn.eleBonusDmg && t.e === wpn.eleBonusDmg.ele) dmg += (wpn.eleBonusDmg.add || 0);   // 🏺 兇殘惡鬼的毒牙：對特定屬性敵人額外固定傷害 +N（傭兵鏡像玩家）
        if (wpn && wpn.immParalyzeBonusDmg && (t.boss || t.immParalyze || t.immStun)) dmg += wpn.immParalyzeBonusDmg;   // 🏺 屍毒之針：對免疫麻痺目標額外固定傷害 +N（傭兵鏡像玩家）
        if (wpn && wpn.selfBreakProc && Math.random() < 0.03) { dmg = Math.max(1, Math.floor(dmg * 1.5)); if (!ally.statuses) ally.statuses = {}; ally.statuses.broken = (wpn.selfBreakProc.dur || 5) * 10; }   // 🐍 v3.1.76 特產易碎泥偶（傭兵）：3% 傷害×1.5＋自身壞物術（期間傷害-20%·鏡像玩家 js/04:122）
        if (ally.d && ally.d.instakillFull && t.curHp === t.hp) { let _rif = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (_rif !== -1 && tryInstakill(t, { p: ally.d.instakillFull, tag: null }, `【協力·${ally._allyName}】隱蔽的死亡草葉`, _rif)) return; }   // 🏺 v3.1.76 隱蔽的死亡草葉（傭兵）：命中滿血非BOSS怪機率即死（鏡像玩家 js/04:72）
        markBossPhysicalHit(t);
        t.curHp -= dmg; t.justHit = getWpnEle(ally.eq ? ally.eq.wpn : null, wpn); mobWake(t);
        if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, dmg, isRanged ? 'ranged' : 'melee', ally);   // 🌑 v3.4.14 血壁空間：傭兵物理普攻主擊反射（鏡像玩家 js/04:132）
        if (t.curHp > 0 && wpn && wpn.hitEchoMagic && Math.random() * 100 < (wpn.hitEchoMagic.rate || 0)) { t.curHp -= dmg; t.justHit = wpn.hitEchoMagic.ele || 'magic'; t._spellHurt = true; mobWake(t); logCombat(`<span class="font-bold" style="color:#fb923c;text-shadow:0 0 6px #dc2626;">【協力·${ally._allyName}·爆破】</span>烈焰爆開，額外造成 ${dmg} 點火屬性魔法傷害。`, 'player-special'); }   // 🏺 火精靈王的爆焰（傭兵）：命中 10% 追加等同本擊的火魔傷
        if (t.curHp > 0) consumeStrawCurse(t);   // 🐍 詛咒稻草人：傭兵主攻擊亦消耗並額外扣 80 水魔傷（鏡像玩家）
        if (wpn && wpn.strawCurse && t.curHp > 0 && Math.random() * 100 < wpn.strawCurse.rate) { if (!t.st) t.st = newMobStatus(); t.st.strawCurse = Math.max(t.st.strawCurse || 0, wpn.strawCurse.stacks || 3); }   // 🐍 傭兵種下詛咒稻草人（鏡像玩家）
        if (wpn && wpn.onHitEleVuln === 'fire' && t.curHp > 0) t._fireVulnUntil = state.ticks + 30;   // 🏺 v3.1.76 灼熱蜥蜴長舌（傭兵施加端）：命中使目標獲得火屬性弱點 3 秒（鏡像玩家 js/04:147·玩家與傭兵共用 _fireVulnUntil 標記）
        if (wpn && wpn.procBurn && t.curHp > 0 && (!wpn.procBurn.rate || Math.random() * 100 < wpn.procBurn.rate)) t._burnDot = { left: (wpn.procBurn.dur || 6) * 10, dmg: wpn.procBurn.dmg || 10, tick: (wpn.procBurn.tick || 1) * 10 };   // 🏺 熔岩灼燒的雙拳（傭兵鏡像玩家）：命中附加灼燒 DoT
        if (wpn && wpn.hasteStrike && ally.buffs && ally.buffs.haste > 0) { ally.buffs.haste = 0; try { _allyLevelRecompute(ally); } catch (e) {} }   // 🏺 v3.1.76 殺人蜂的尾刺（傭兵）：一般攻擊命中時失去加速狀態（鏡像玩家 js/04:148）
        if (ally._setDragonblood2 && dmg > 0) ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + Math.max(1, Math.floor(dmg * ((ally.curHp < (ally.mhp || 1) * 0.5) ? 0.05 : 0.01))));   // 🐉 v2.6.9 #1b 龍血2/5（傭兵）：造成物理傷害吸血1%（自身HP<50%→5%）·回復戰鬥HP(curHp)
        // 🔧 黑暗妖精傭兵：預設攻擊自動維持附加劇毒（學過 sk_dark_poison 即視為常駐增益）；命中 50%／劇毒精通 100% 使目標中毒（與玩家同規則）
        if (ally.cls === 'dark' && ally.skills && ally.skills.includes('sk_dark_poison') && t.curHp > 0 && Math.random() < (allyHasMastery(ally, 'd_poison') ? 1 : 0.5)) {
            if (!t.st) t.st = newMobStatus();
            let _pPct = allyHasMastery(ally, 'd_poison') ? 2.0 : 0.6;   // 🔧 劇毒精通：每秒 200%；否則 60%
            let _pUnit = Math.max(1, Math.floor(dmg * _pPct * ((wpn && wpn.poisonMult) || 1)));   // 🏺 暗黑蠍的雙鉗：poisonMult 放大附加劇毒（傭兵鏡像玩家）
            // 🔧 新規則（與玩家一致）：未中毒、或新傷害高於現有時才上毒（取代並刷新5秒）；否則不更新，須等舊毒跑完
            if ((t.st.poison || 0) <= 0 || _pUnit > (t.st.poisonUnit || 0)) {
                t.st.poison = 50; t.st.poisonTick = 10;                      // 持續 5 秒、1 層
                t.st.poisonStacks = 1;
                t.st.poisonUnit = _pUnit;
                t.st.poisonDmg = _pUnit;
            }
        }
        let mark = (heavy && isCrit) ? '會心一擊' : (isCrit ? '爆擊' : (heavy ? '重擊' : (_grazeA ? '擦傷' : '')));
        if (_dualX2A) mark += (mark ? '·' : '') + '雙刃×2';   // ⚔️ 雙刀內建特性標記
        logCombat(`${kp}<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>攻擊 <span class="${getMobColor(t.lv)}">${t.n}</span>，造成 ${dmg} 點傷害${mark?'（'+mark+'!）':''}。`, 'player');
        // 🔧 硬皮消磨：傭兵一般攻擊命中固定再磨 1（basic，與玩家同規則）；單手鈍器鈍擊另由 allyOnHitEffects 觸發
        if (t.curHp > 0) wearHardSkin(t, ally.eq && ally.eq.wpn ? ally.eq.wpn.id : null, heavy, false, true, ally.classicMode);
        allyOnHitEffects(ally, t, { dmg: dmg, heavy: heavy, hardSkin: _hsT });        // 🔧 命中後特效：穿透/即死/出血/鈍擊/切割（hardSkin 供穿透精通無視判定）
        if (wpn && wpn.vampPct && dmg > 0) ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + Math.floor(dmg * wpn.vampPct));   // 🐉 嗜血者鎖鏈劍（傭兵）·v2.6.9 修：回復戰鬥HP(curHp) 非快照 hp
        if (wpn && wpn.procHealFlat && dmg > 0 && Math.random() * 100 < wpn.procHealFlat.rate) { ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + wpn.procHealFlat.hp); logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}·${wpn.n}】</span>恢復了 ${wpn.procHealFlat.hp} 點 HP。`, 'heal', 'mercenary'); }   // 🏺 v3.1.80 處刑人的護身斧（傭兵）：一般攻擊命中 3% 恢復 10 HP（鏡像玩家 js/04）
        if (t.curHp > 0 && !isRanged && wpn && (wpn.weakExpose || allyHasMastery(ally, 'k_weakness'))) {   // 🐉 弱點曝光（傭兵）：鎖鏈劍/弱點精通
            let _always = allyHasMastery(ally, 'k_chainblade') || allyHasMastery(ally, 'k_weakness');
            if (_always || Math.random() < 0.12) { let _max = allyHasMastery(ally, 'k_chainblade') ? 5 : 3; t.weakExpose = Math.min(_max, (t.weakExpose || 0) + 1); }
        }
        allyWeaponProcs(ally, t, { hit: true, dmg: dmg });            // 🔧 普攻判定特效：瑪那回魔/共鳴/魔擊/月光爆裂
        if (wpn && wpn.eff === 'combo' && Math.random() * 100 < (wpn.comboRate || 0)) allyComboAttack(ally, t, true);     // 雙擊：命中後依 comboRate% 追加一次完整一般攻擊
        if (isCrit && allyHasMastery(ally, 'd_crit')) allyComboAttack(ally, t);   // 🔧 黑暗妖精爆擊精通：傭兵爆擊時追加一次連擊
        if (ally.eq && ally.eq.offwpn) allyDualWieldOffhandAttack(ally, t);   // ⚔️ 迅猛雙斧（傭兵）：副手第二攻擊來源
        // 🏺 遺物 命中附加固定屬性傷害＋弱點洞察（傭兵鏡像玩家·置於各 proc 後、擊殺判定前，避免對死怪重複觸發）
        if (t.curHp > 0 && wpn && wpn.onHitEleDmg && (!wpn.onHitEleDmg.rate || Math.random() * 100 < wpn.onHitEleDmg.rate)) { let _oh = wpn.onHitEleDmg; t.curHp -= _oh.dmg; t.justHit = _oh.ele; mobWake(t); logCombat(`<span class="font-bold" style="color:${RELIC_ELE_COLOR[_oh.ele] || '#e2e8f0'};">【協力·${ally._allyName}】附加 ${_oh.dmg} 點${RELIC_ELE_LABEL[_oh.ele] || ''}屬性傷害。</span>`, 'player'); }   // 🏺 rate：火焰長劍 3%（傭兵鏡像玩家）
        if (t.curHp > 0) { let _whb = _relicWeakHitBonus(ally); if (_whb > 0) { let _we = getWpnEle(ally.eq ? ally.eq.wpn : null, wpn); if (_we && _we !== 'none' && elementCounterMult(_we, t.e) > 1) { t.curHp -= _whb; t.justHit = _we; mobWake(t); logCombat(`<span class="font-bold text-amber-300">【協力·${ally._allyName}·弱點洞察】</span>額外造成 ${_whb} 點傷害。`, 'player'); } } }
    }
    let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (ri !== -1) killMob(ri); } else renderMobs();
    // 👑 v2.7.94 王族魔法精通（傭兵）：一般攻擊命中(到此=已命中·未命中提早 return)10% 免MP額外施放選定攻擊魔法。gate cls==='royal'(法師分支非王族不觸發)＋精通＋非免費施放中(防連擊/副手子攻擊重複 roll·免費施放本身不再遞迴)
    if (ally.cls === 'royal' && !_allyRoyalFreeCast && allyHasMastery(ally, 'k_royal_magic') && Math.random() < 0.1) allyRoyalFreeCast(ally);
    return;
}
// 傭兵雙擊（鋼爪/雙刀）：依武器 comboRate% 追加一次完整一般攻擊，獨立判定命中（🔮 暗影5/5→額外攻擊×1.5）；fullDmg=false（爆擊精通沿用）保留舊倍率×0.5；不遞迴
function allyComboAttack(ally, t, fullDmg) {
    if (!t || t.curHp <= 0 || t._dead) return;
    let r = allyStrikeRoll(ally, t, {});   // 獨立命中判定
    if (!r.hit) { logCombat(`<span class="font-bold" style="color:#c4b5fd;">【協力·${ally._allyName}·雙擊】</span>追擊 <span class="${getMobColor(t.lv)}">${t.n}</span> 未命中。`, 'miss'); return; }
    let dmg = Math.max(1, Math.floor(r.dmg * (fullDmg ? (ally._setShadow5 ? 2.0 : 1.0) : (ally._setShadow5 ? 1.0 : 0.5))));   // 🔧 雙擊(fullDmg)：完整一般攻擊·暗影5/5傷害加倍(×2)；爆擊精通(legacy)×0.5
    dmg = Math.max(1, Math.floor(dmg * elementCounterMult(getWpnEle(ally.eq.wpn, DB.items[ally.eq.wpn.id]), t.e)));   // ⚔️ 武器屬性剋制倍率（雙擊）
    if (t.curHp > 0) wearHardSkin(t, ally.eq && ally.eq.wpn ? ally.eq.wpn.id : null, r.heavy, false, true, ally.classicMode);
    logCombat(`<span class="font-bold" style="color:#c4b5fd;text-shadow:0 0 6px #8b5cf6;">【協力·${ally._allyName}·雙擊】</span>追擊 <span class="${getMobColor(t.lv)}">${t.n}</span>，造成 ${dmg} 點傷害。`, 'player');
    _allyDamageMob(ally, t, dmg, getWpnEle(ally.eq.wpn, DB.items[ally.eq.wpn.id]));
}
// ⚔️ 迅猛雙斧（傭兵）：主手是否可雙持（單手鈍器／巨斧精通的雙手鈍器）
function allyWarriorDualWieldWpnOk(ally, id) {
    if (!id) return false;
    let tags = getWeaponTags(id);
    if (tags.includes('單手鈍器')) return true;
    return !!(ally && ally.cls === 'warrior' && allyHasMastery(ally, 'k_giantaxe') && tags.includes('雙手鈍器'));
}
function allyDualWieldOffhandOk(ally) {
    return !!(ally && ally.cls === 'warrior' && ally.skills && ally.skills.includes('sk_warrior_dualaxe')
        && ally.eq && ally.eq.wpn && allyWarriorDualWieldWpnOk(ally, ally.eq.wpn.id));
}
// ⚔️ 迅猛雙斧（傭兵）：副手單手鈍器追加一次完整一般攻擊（第二攻擊來源·獨立命中·吃狂暴·磨硬皮；不另計強化、不重複觸發主手特效，與玩家版一致）
function allyDualWieldOffhandAttack(ally, t) {
    if (!t || t.curHp <= 0 || t._dead) return;
    if (!allyDualWieldOffhandOk(ally) || !ally.eq.offwpn || !allyWarriorDualWieldWpnOk(ally, ally.eq.offwpn.id)) return;
    let owpn = DB.items[ally.eq.offwpn.id];
    let r = allyStrikeRoll(ally, t, { wpnInst: ally.eq.offwpn });   // 副手獨立命中（基礎骰＋近戰加成）；🛡️ v2.6.69 審計#5：改吃「副手自身」強化最終倍率（與玩家副手揮擊改用 wpnInst 對齊·原 noEnhance 恆×1 與玩家不一致）
    if (!r.hit) { logCombat(`<span class="font-bold" style="color:#fbbf24;">【協力·${ally._allyName}·迅猛雙斧】</span>副手追擊 <span class="${getMobColor(t.lv)}">${t.n}</span> 未命中。`, 'miss'); return; }
    let dmg = r.dmg;
    if (ally.skills.includes('sk_warrior_berserk') && Math.random() < 0.05) dmg = Math.max(1, dmg * 2);   // ⚔️ 狂暴：副手亦為一般攻擊
    dmg = Math.max(1, Math.floor(dmg * elementCounterMult(getWpnEle(ally.eq.offwpn, owpn), t.e)));   // ⚔️ 副手武器屬性剋制倍率
    if (t.curHp > 0) wearHardSkin(t, ally.eq.offwpn.id, r.heavy, false, true, ally.classicMode);
    let mark = (r.heavy && r.crit) ? '會心一擊' : (r.crit ? '爆擊' : (r.heavy ? '重擊' : ''));
    logCombat(`<span class="font-bold" style="color:#fbbf24;text-shadow:0 0 6px #d97706;">【協力·${ally._allyName}·迅猛雙斧】</span>副手 ${owpn.n} 追擊 <span class="${getMobColor(t.lv)}">${t.n}</span>，造成 ${dmg} 點傷害${mark?'（'+mark+'!）':''}。`, 'player');
    _allyDamageMob(ally, t, dmg, getWpnEle(ally.eq.offwpn, owpn));
}
// 法師協力：依其選定攻擊魔法施放（手動重現 castSkill 魔法傷害公式：單體/全體、魔攻係數、法師倍率、魔暴、MR減免、剋屬性固定加值）
function allyCastMagic(ally, sk) {
    if (typeof _allySpriteTrigger === 'function') _allySpriteTrigger(ally, 'skill', sk && sk.n);   // 🤝 v3.0.70 隊員戰場 sprite：施法動作
    let d = ally.d || {};
    let targets = (sk.target === 'all') ? mapState.mobs.filter(m => m && m.curHp > 0) : [getTarget()].filter(m => m && m.curHp > 0);
    if (!targets.length) return;
    let mageMult = 1.0;
    let texts = [], _burstDmg = 0;   // 🔧 神官魔杖·魔爆：累計本次魔法總傷害
    targets.forEach(t => {
        let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
        let mrFactor = mrMult(effMr);
        let isCrit = Math.random()*100 < (d.magicCrit||0);
        let critMult = isCrit ? (1 + (d.magicCritDmg||0)/100) : 1;
        let dmgArray = sk.multiDmg || (sk.dmgDice ? [[sk.dmgDice[0], sk.dmgDice[1]]] : []);
        let totalDmg = 0;
        dmgArray.forEach((dc, idx) => {
            let baseMagic = roll(dc[0], dc[1]);
            let isLastHit = idx === dmgArray.length - 1;
            let spCoef = magicDamageCoef(d, magicAttrDefense(t, sk.ele || 'none'), sk.tier);
            let core = magicBaseDamage(baseMagic, d, isLastHit ? (sk.dmgBase || 0) : 0, isLastHit) * spCoef * critMult;
            let dd = Math.max(1, Math.floor(core * mrFactor));
            dd = Math.floor(dd * mageMult);
            dd = Math.max(1, Math.floor(dd * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（傷害魔法逐骰·原僅紅獅字面）
            // 🔧 傭兵魔導精通同屬性傷害×2 已移除(2026-07 用戶要求)
            dd = Math.max(1, Math.floor(dd * fragileMult(t) * illuLvMult(ally)));   // 🔮 脆弱（白鳥5）；🔮 幻術士(傭兵)等級加成 ×(1+等級/50)
            dd = Math.max(1, Math.floor(dd * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔧 武器強化 +11~+20：最終傷害倍率（也影響傭兵施放的傷害魔法；物理技走 allyStrikeRoll 已含）
            dd = Math.max(1, Math.floor(dd * elementCounterMult(sk.ele, t.e)));   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
            totalDmg += dd;
        });
        totalDmg = Math.max(1, Math.floor(totalDmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
        { let _sidA = sk._sidCache || (sk._sidCache = Object.keys(DB.skills).find(k => DB.skills[k] === sk) || '');   // allyCastMagic 未帶 skId → 反查一次並快取在技能def上（skillDmgMult 以技能id為key）
          totalDmg = Math.max(1, Math.floor(totalDmg * equipSkillDmgMult(sk, _sidA, ally))); }   // 🏺 v3.1.76 遺物 特定技能傷害倍率（傭兵·掃 ally.eq·鏡像玩家 js/07:640）
        // 🔮 攻擊技能下拉選單可選的一般傷害法術，不觸發幻覺2/5與5/5（鏡像玩家 castSkill）
        if (sk.hpCost && ally._setDragonblood5) totalDmg = Math.max(1, Math.floor(totalDmg * 1.2));   // 🐉 v3.1.78 龍血5/5（傭兵）：HP消耗技傷害+20%（傷害魔法·鏡像玩家 js/07:642·傭兵確有付HP見 allyDragonAct）
        t.curHp -= totalDmg;
        _burstDmg += totalDmg;   // 🔧 魔爆累計
        t.justHit = (sk.ele && sk.ele !== 'none') ? sk.ele : 'magic';
        t._spellHurt = true;   // 🎬 v3.0.14 傭兵法術傷害→hurt(含頭目)
        if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
        mobWake(t);
        if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, totalDmg, 'magic', ally);   // 🌑 v3.4.14 血壁空間：傭兵傷害魔法技能（單體/全體）＝魔法反射（鏡像玩家 js/07 傷害魔法分支）
        if (sk.lifesteal && totalDmg > 0) { let h = Math.min(totalDmg, (ally.mhp || 0) - (ally.curHp || 0)); if (h > 0) { ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + h); logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>吸取了 ${h} 點生命。`, 'heal', 'mercenary'); } }   // 🩸 v2.6.18 #中：吸血魔法（寒冷戰慄/吸血鬼之吻 lifesteal）回復戰鬥HP(curHp)，比照玩家 castSkill 624；上限本次傷害或缺血較小者
        // 🔮 白鳥 5/5：傭兵「施放傷害魔法技能」不觸發脆弱（2026-06 用戶要求：只有一般攻擊/基礎普攻才觸發）；基礎普攻(法師光箭/幻術士奇古獸/物理 on-hit)仍於各自路徑套用脆弱
        texts.push(`<span class="${getMobColor(t.lv)}">${t.n}</span> ${totalDmg}${isCrit?'(爆)':''}`);
    });
    // 傷害魔法附帶狀態（幻想=沉睡／混亂／冰矛圍籬=凍結／奪命之雷=暈眩）；毒咒等 DoT 同步吃本技能係數
    // ⚠️ 係數須逐目標重算：原本直接引用 spCoef，但它宣告在上方 dmgArray.forEach 回呼內（作用域外）→ ReferenceError，傭兵一施放就整個 tick 拋例外
    if (sk.status || sk.freeze) {
        let _svS = player; player = ally;
        try {
            targets.forEach(t => {
                if (!t || t.curHp <= 0) return;
                if (sk.status) applyMobStatus(t, sk.status, sk.n, magicDamageCoef(d, magicAttrDefense(t, sk.ele || 'none'), sk.tier));
                if (sk.freeze) applyMobStatus(t, { kind: 'freeze', pbase: sk.freeze, dur: 6 }, sk.n);
            });
        } finally { player = _svS; }
    }
    logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n} → ${texts.join('、')}`, 'magic');
    targets.forEach(t => { if (t.curHp <= 0) { let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (ri !== -1) killMob(ri); } });
    // 🏺 風精靈王的狂嘯（傭兵）：施展風屬性傷害魔法時 15% 免費追加龍捲風。
    { let _ww = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
      if (_ww && _ww.windSpellProcRate && sk.ele === 'wind' && _burstDmg > 0 && Math.random() * 100 < _ww.windSpellProcRate) { let _wt = _allyProcTarget(null); if (_wt) { logCombat(`<span class="font-bold" style="color:#86efac;text-shadow:0 0 6px #16a34a;">【協力·${ally._allyName}·${_ww.n}】</span>狂風共振，額外觸發龍捲風！`, 'player-special'); allyProcFreeMagicSkill(ally, _wt, 'sk_tornado', capWpnEn((ally.eq.wpn && ally.eq.wpn.en) || 0), false, _ww); } } }
    // 🔧 神官魔杖·魔爆（傭兵版）：施放傷害魔法時依機率(單體 智力/100、全體 智力/60)引爆本次傷害30%的無屬性傷害，均分給場上所有敵人
    {
        let _bw = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
        if (_bw && _bw.eff === 'magicburst' && _burstDmg > 0 && !ally.classicMode) {   // 🎮 經典模式：傭兵停用魔爆
            let _aoe = (sk.target === 'all') || (targets.length > 1);
            let _amkB = allyHasMastery(ally, 'm_strike');   // 🏅 v2.6.71：改發魔擊時觸發率＝力量/60（鏡像玩家）
            if (Math.random() < (_amkB ? ((d.str || 0) / 60) : ((d.int || 0) / (_aoe ? 60 : 100)))) {
                if (_amkB) {   // 🏅 v2.6.70 魔擊精通（傭兵）：魔爆觸發改為發動魔擊（對施放目標·含擴散·鏡像玩家）
                    let _mt = (targets && targets.find(x => x && x.curHp > 0)) || mapState.mobs.find(m => m && m.curHp > 0 && !m._dead);
                    if (_mt) _allyMagicStrikeHit(ally, _mt, ally.eq && ally.eq.wpn, _bw);
                } else {
                let _live = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
                if (_live.length) {
                    let _ex = Math.max(1, Math.floor(_burstDmg * 0.3 / _live.length));   // 🔧 v2.6.63：總量30%均分給場上敵人（原每隻各吃30%）
                    logCombat(`<span class="font-bold" style="color:#f0abfc;text-shadow:0 0 6px #c026d3;">【協力·${ally._allyName}·魔爆】</span>魔力過載爆炸，波及全場！`, 'player-special');
                    _live.forEach((m, i) => {
                        let _d = Math.max(1, Math.floor(_ex * fragileMult(m)));
                        // 👑 v2.6.69 審計#13：王族魅力加成已含於 _burstDmg（各目標傷害於 496 行乘過），此處不再重複乘（原本平方＝魅力80時魔爆虛高80%）
                        _d = _allyIllusionMagicDmg(ally, _d, i === 0);   // 🔮 魔爆每次發動只回一次MP，5件仍逐目標生效
                        m.curHp -= _d; m.justHit = 'magic'; mobWake(m);
                        logCombat(`魔爆波及 <span class="${getMobColor(m.lv)}">${m.n}</span>，造成 ${_d} 點無屬性傷害。`, 'magic');
                        if (m.curHp <= 0) { let ri = mapState.mobs.findIndex(x => x && x.uid === m.uid); if (ri !== -1) killMob(ri); }
                    });
                }
                }
            }
        }
    }
    // 🆕 v2.6.52 修「複製法師／回魔武器傭兵 藍量永遠見底」：傭兵每回合只做「一個」動作(施法 or 普攻)，一直施法就從不觸發武器 on-hit 回魔(玩家是普攻＋施法並行·普攻每擊持續回魔→本體一放招就回滿)。故施法後補「回魔類武器特效」：瑪那魔杖(mp_drain)/惡魔王魔杖(mpOnHit) 命中回 MP、共鳴法器(int/60 免費光箭回魔)。只補回魔·不套其餘傷害 proc(魔擊/月光/娃娃免費魔法·避免遞迴與失衡)。迴響(echo)為免費再施放·不重複觸發。
    if (!ally._echoing) {
        let _wi = ally.eq && ally.eq.wpn, _w = _wi ? DB.items[_wi.id] : null;
        if (_w) {
            if (_w.eff === 'mp_drain' || _w.mpOnHit) { ally.mp = Math.min(ally.mmp || 0, (ally.mp || 0) + mpOnHitAmount(_w, capWpnEn(_wi.en))); }   // 命中回 MP（同 allyWeaponProcs·單一真相 mpOnHitAmount）
            if (typeof WAND_LIGHTARROW_IDS !== 'undefined' && WAND_LIGHTARROW_IDS.includes(_wi.id) && !ally.classicMode && !allyHasMastery(ally, 'm_strike') && Math.random() < ((d.int || 0) / 60)) { let _rt = _allyProcTarget(getTarget()); if (_rt) allyProcLightArrow(ally, _rt); }   // 共鳴：int/60 免費光箭回魔（同 allyWeaponProcs）；🏅 v2.6.70 魔擊精通傭兵共鳴已改發魔擊→本補償塊(只補回魔·不套傷害proc)不再施放光箭
        }
    }
    renderMobs();
    // 🔧 傭兵迴響精通：(11-階級)×10% 機率不消耗MP立刻再施放一次（迴響觸發的不再連鎖）
    let _aEchoRate = (11 - (sk.tier || 1)) / 10;
    if (sk.target !== 'all') _aEchoRate *= 2;   // 🏅 迴響精通（傭兵）：單體傷害魔法觸發機率加倍（全體沿用原機率）
    if (allyHasMastery(ally, 'm_echo') && !ally._echoing && Math.random() < _aEchoRate) {
        ally._echoing = true;
        logCombat(`<span class="font-bold" style="color:#93c5fd;text-shadow:0 0 6px #3b82f6;">【協力·${ally._allyName}·迴響】</span>${sk.n} 的魔力迴盪不息，再次轟出！`, 'magic');
        try { allyCastMagic(ally, sk); } finally { ally._echoing = false; }
    }
}
// 🔧 傭兵施放「非傷害」攻擊技能：純異常狀態（緩速/弱化/疾病/魔法消除/封印禁地/沉睡之霧/木乃伊詛咒/毒咒/壞物/闇盲/黑闇之影/破壞盔甲…）
//    與即死類（起死回生術=不死、釋放元素=元素）。比照玩家 castSkill 的非傷害分支，以傭兵自身魔法命中(abnormalMagicHit)判定（player=ally 換身）。
//    回傳 true=已施放並扣 MP；false=不適用（無目標 / 目標皆已具該狀態 / 無可即死目標 / MP 不足）→ 由呼叫端退回一般攻擊。
function allyCastNonDamage(ally, sk) {
    if (!sk || sk.type !== 'atk' || sk.dmgDice || sk.multiDmg || sk.dmgType === 'physical') return false;   // 僅處理「無傷害骰的魔法狀態/即死技」
    if (!sk.status && !sk.instakill) return false;
    if (typeof _allySpriteTrigger === 'function') _allySpriteTrigger(ally, 'skill', sk.n);   // 🤝 v3.0.70 隊員戰場 sprite：施法動作
    let d = ally.d || {};
    let targets = (sk.target === 'all') ? mapState.mobs.filter(m => m && m.curHp > 0) : [getTarget()].filter(m => m && m.curHp > 0);
    if (!targets.length) return false;
    // 即死技：需有「非BOSS且具對應tag」的目標，否則退回一般攻擊（避免對無效目標空放浪費 MP，與玩家 autoCastSpells 一致）
    if (sk.instakill) {
        let tag = sk.instakill.tag;
        if (!targets.some(m => !m.boss && (!tag || mobHasTag(m, tag)))) return false;
    }
    // 純異常狀態：所有存活目標皆已具該狀態 → 退回一般攻擊（不重複施放、不浪費 MP，與玩家 castSkill 8235 一致）
    if (sk.status && targets.every(m => m.st && m.st[sk.status.kind] > 0)) return false;
    let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
    if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
    if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半（與魔導精通疊加）
    if (allyHasMastery(ally, 'e_magic') && sk.ele && sk.ele !== 'none' && sk.ele === ally.elfEle) cost = Math.max(1, Math.ceil(cost * 0.5));   // 🏅 魔導精通（傭兵）：同屬性 MP -50%(2026-07 30%→50%)
    if (_allyRoyalFreeCast) cost = 0;   // 👑 v2.7.94 王族魔法精通：免MP額外施放（allyRoyalFreeCast·鏡像玩家 js/07:302 _royalFreeCast）
    if ((ally.mp || 0) < cost) return false;
    ally.mp -= cost; allyManaMasteryRefund(ally, cost);
    let _sv = player; player = ally;   // 以傭兵自身魔法命中判定（applyMobStatus/tryInstakill 內部讀 player）
    let _ikKills = [];                  // 🔧 即死成功的目標 uid：延後到還原 player 後再 killMob（結算與 UI 歸真實玩家）
    try {
        logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}。`, 'magic');
        targets.forEach(t => {
            if (!t || t.curHp <= 0) return;
            if (sk.status) applyMobStatus(t, sk.status, sk.n, magicDamageCoef(d, 0));
            if (sk.instakill && t.curHp > 0) { let idx = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (idx !== -1 && tryInstakill(t, sk.instakill, sk.n, idx, true)) _ikKills.push(t.uid); }
        });
    } finally { player = _sv; }
    // 🔧 還原 player 後才結算擊殺：經驗/金幣/掉落歸玩家、killMob 結尾的 updateUI 顯示玩家資料（修正換身期間 killMob 造成的左上面板閃爍與獎勵遺失）
    _ikKills.forEach(uid => { let i = mapState.mobs.findIndex(m => m && m.uid === uid); if (i !== -1) killMob(i); });
    renderMobs();
    return true;
}
// 🔧 傭兵施放「物理」攻擊技能（騎士衝擊之暈等：以武器揮擊造成物理傷害，命中後附加暈眩/異常/即死）。
//    比照玩家 castSkill 物理分支(8161~8227)，用 allyStrikeRoll 計傷（含硬皮減傷/脆弱/武器最終倍率）、player=ally 換身判定異常命中。
//    回傳 true=已施放並扣 MP；false=不適用（無目標 / 武器需求不符 / MP 不足）→ 由呼叫端退回一般攻擊。
function allyCastPhysicalSkill(ally, sk) {
    if (!sk || sk.type !== 'atk' || sk.dmgType !== 'physical') return false;
    let t = getTarget(); if (!t || t.curHp <= 0) return false;
    if (typeof _allySpriteTrigger === 'function') _allySpriteTrigger(ally, 'skill', sk.n);   // 🤝 v3.0.70 隊員戰場 sprite：施法動作
    let d = ally.d || {};
    let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
    if (sk.reqWpn === 'w2h'    && !(wpn && wpn.w2h && !wpn.isBow)) return false;   // 需雙手武器（🛡️ v2.6.69 審計#4：且非弓·與玩家路徑一致）
    if (sk.reqWpn === 'bow'    && !(wpn && wpn.isBow))  return false;   // 需弓（🧹 v3.1.79 大掃除：移除 'nonbow' 死閘·全技能無此值）
    let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
    if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
    if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
    if ((ally.mp || 0) < cost) return false;
    ally.mp -= cost; allyManaMasteryRefund(ally, cost);
    let hits = sk.hits || 1, totalDmg = 0, landed = 0, logHits = [];
    let _royalMult = royalAllyMult();   // 👑 換身前先取王族魅力加成（換身期間 player=ally 會讀到傭兵自身職業，故先快照主玩家的倍率）
    let _sv = player; player = ally;   // 異常命中(applyMobStatus/tryInstakill)以傭兵自身判定
    try {
        for (let h = 0; h < hits; h++) {
            if (t.curHp <= 0) break;
            let res = allyStrikeRoll(ally, t, {});   // 一般命中判定（可重擊/爆擊）
            if (!res.hit) { logHits.push('Miss'); continue; }
            landed++;
            res.dmg = Math.floor(res.dmg * illuLvMult(ally));   // 🔮 幻術士(傭兵)骷髏毀壞：等級加成 ×(1+等級/50)（非幻術士回 1，不影響騎士/龍騎物理技）
            res.dmg = Math.max(1, Math.floor(res.dmg * _royalMult));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)（換身前已快照）
            if (sk.skillAddDmg) res.dmg = Math.max(1, res.dmg + sk.skillAddDmg);   // ⚔️ v2.6.69 審計#12：衝擊之暈 +10 固定加值（鏡像玩家 js/07:512·不吃倍率）
            t.curHp -= res.dmg; t.justHit = getWpnEle(ally.eq ? ally.eq.wpn : null, wpn); mobWake(t);
            if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, res.dmg, (wpn && (wpn.isBow || wpn.ranged)) ? 'ranged' : 'melee', ally);   // 🌑 v3.4.14 血壁空間：傭兵物理技能每擊反射（衝擊之暈/三重矢·鏡像玩家 js/07 物理分支）
            totalDmg += res.dmg;
            let mark = (res.heavy && res.crit) ? '會心' : (res.crit ? '爆' : (res.heavy ? '重' : ''));
            logHits.push(res.dmg + (mark ? '(' + mark + ')' : ''));
            if (sk.stun && (sk.stunChance == null || Math.random() < sk.stunChance)) applyMobStatus(t, { kind: 'stun', pbase: sk.stun, dur: 6, hitOff: (wpn && wpn.stunHitBonus) ? Math.round(wpn.stunHitBonus / 5) : 0 }, sk.n);   // 🏛️ 傭兵持真．冥皇執行劍：衝擊之暈暈眩命中率 +20%；🛡️ v2.6.69 審計#3：補鏡像 stunChance(10%) 前置骰（原漏→傭兵每擊必判暈＝玩家10倍）
            if (sk.status) applyMobStatus(t, sk.status, sk.n);
            if (t.curHp > 0 && sk.instakill) { let idx = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (idx !== -1) tryInstakill(t, sk.instakill, sk.n, idx, true); }   // 🔧 deferKill：換身期間不結算，由下方還原 player 後的 killMob 處理
        }
    } finally { player = _sv; }
    if (landed > 0) {
        let detail = hits > 1 ? `[${logHits.join(', ')}] 共 ${totalDmg}` : `${totalDmg}`;
        let tag = logHits.some(x => x.includes('爆') || x.includes('會心')) ? 'player-crit' : 'player';
        logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}，對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${detail} 點物理傷害。`, tag);
    } else {
        logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n} 未命中 <span class="${getMobColor(t.lv)}">${t.n}</span>。`, 'miss');
    }
    let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (ri !== -1) killMob(ri); } else renderMobs();
    return true;
}
// 法師協力的一次行動：有選攻擊魔法且 MP 足夠→施放並扣 MP；否則退回免費基礎光箭
function allyMageAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) return;
    let sk = DB.skills[ally._atkSkill];
    let d = ally.d || {};
    if (sk && sk.type === 'atk' && sk.dmgType !== 'physical' && (sk.dmgDice || sk.multiDmg)) {
        let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
        if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
        if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
        if ((ally.mp || 0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyCastMagic(ally, sk); return; }
    } else if (sk && sk.type === 'atk' && (sk.status || sk.instakill)) {
        if (allyCastNonDamage(ally, sk)) return;   // 🔧 非傷害攻擊技能（緩速/弱化/疾病/即死…）；不適用則退回基礎光箭
    }
    allyAttackOnce(ally);   // 沒選攻擊魔法 / MP 不足 → 免費基礎光箭
    allyRapidfire(ally);   // 🏹 v3.1.77 稽核中#4：連射（法師傭兵持遺物連射弓·非弓 no-op）
}
// 妖精協力：連射（弓）— 依記錄的發動機率追加 1~3 箭，每箭約 30% 傷害，隨機命中場上敵人
function allyRapidfire(ally, forceProc, classicOk) {
    if (ally.classicMode && !classicOk) return;   // 🎮 經典模式：一般連射停用；地精靈王的抗拒受擊連射例外
    let d = ally.d || {};
    let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
    let rate = (wpn && wpn.isBow && wpn.rapidfire) ? wpn.rapidfire : (ally._rapidfire || 0);   // 直接讀當前弓的連射機率（相容舊協力快照，確保普攻與三重矢都能連射）
    if (!rate || (forceProc && (!wpn || !wpn.hurtRapidfire)) || (!forceProc && roll(1, 100) > rate)) return;
    let _allyRapid = allyHasMastery(ally, 'e_rapid');   // 🔧 傭兵連射精通：箭數隨機 1~5、傷害 50%（疊疾風5/5 → 100%）
    let n = roll(1, _allyRapid ? 5 : 3);
    let _rfMult = ally._setGale5 ? (_allyRapid ? 1.00 : 0.80) : (_allyRapid ? 0.50 : 0.30);
    for (let i = 0; i < n; i++) {
        let alive = []; mapState.mobs.forEach((m, idx) => { if (m && m.curHp > 0) alive.push(idx); });
        if (!alive.length) break;
        let ti = alive[Math.floor(Math.random() * alive.length)];
        let mt = mapState.mobs[ti];
        if (typeof playArrowFx === 'function') playArrowFx(ally, mt, i * 45);   // 🏹 v3.2.8 傭兵連射每箭一支投射物（鏡像玩家 rapidfireProc）
        let dice = wpn ? (mt.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
        let _hsSub = (wpn && wpn.ignHardSkin) ? 0 : mobHardSkin(mt);   // 🗡️ 貫穿（暗黑十字弓）：傭兵連射亦無視硬皮額外減傷
        let dmg = Math.max(1, Math.floor((roll(1, dice) + (d.rangedDmg||0) + (d.extraDmg||0) - (mt.dr||0) - _hsSub + allyUnbonusBonus(ally, mt)) * _rfMult * fragileMult(mt) * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔧 硬皮：額外物理減傷（貫穿時不扣）；對不死/狼人 +1D20；連射倍率（疾風5/5/連射精通）；脆弱；武器強化 +11~+20 最終倍率（與玩家連射一致·古老武器×2 機制已於 v3.1.26 移除）
        dmg = Math.max(1, Math.floor(dmg * elementCounterMult(getWpnEle(ally.eq ? ally.eq.wpn : null, wpn), mt.e)));   // ⚔️ 武器屬性剋制倍率（連射）
        dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（連射每箭·原全無·鏡像玩家連射 getPhysicalDmg）
        dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
        mt.curHp -= dmg; mt.justHit = getWpnEle(ally.eq ? ally.eq.wpn : null, wpn); mobWake(mt);
        logCombat(`<span class="text-amber-300 font-bold">【協力·${ally._allyName}·連射】</span>箭矢命中 <span class="${getMobColor(mt.lv)}">${mt.n}</span>，造成 ${dmg} 點傷害。`, 'player');
        if (mt.curHp <= 0) killMob(ti);
        if (wpn && wpn.eff === 'moonburst' && Math.random() < 0.08) { let _mb = _allyProcTarget(mt); if (_mb) allyProcMoonburst(ally, _mb); }   // 🔧 熾炎天使弓：每支連射箭也可觸發月光爆裂（與玩家一致）
    }
    renderMobs();
}

// ===== 🔧 傭兵武器特效系統 =====
// 傭兵普通攻擊會觸發「存檔當下裝備武器」的特效（規則同玩家、數值用傭兵自身衍生值）：
// 共鳴(免費光箭，回魔給傭兵)、魔擊、月光爆裂、瑪那魔杖回魔(mp_drain→傭兵MP)、穿透、骰子匕首即死、
// 匕首/矛出血、單手鈍器鈍擊、雙手劍切割(自身攻速+20%/2秒)、弓連射(原有)。
// 受擊觸發類改為判定「主操控玩家」：反擊＝傭兵持單手劍，玩家被命中50%（玩家格檔則必發）；
// 居合＝傭兵持武士刀且未裝盾，玩家迴避或敵人未命中時50%。由 enemyPhysicalAttack 呼叫。

// 特效目標選擇：主目標存活優先，否則隨機轉移到場上存活怪（同玩家 proc 規則）
function _allyProcTarget(target) {
    let t = (target && target.curHp > 0 && !target._dead) ? target : null;
    if (!t) {
        let alive = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
        if (!alive.length) return null;
        t = alive[Math.floor(Math.random() * alive.length)];
    }
    return t;
}
// 對怪物套用傭兵特效傷害並處理擊殺
function _allyDamageMob(ally, t, dmg, ele) {
    dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)（非王族＝×1·涵蓋所有走本函式的傭兵輸出：連擊/雙持/各 proc/魔擊/穿透/龍擊/反擊/居合等）
    let _dpsBf = t.curHp;   // 🎯 DPS：扣血前 HP（量測實際輸出·溢殺以剩餘 HP 計）
    t.curHp -= dmg;
    t.justHit = ele;
    mobWake(t);
    // 🌑 v3.4.14 血壁空間：中央匯流點「不再」反射——走本函式的皆為 proc/雙擊/副手/魔擊/擴散/穿透波及/反擊/居合/受擊荊棘等衍生輸出，
    //    玩家側對應路徑一律不反射（js/03/04 各 proc 無掛點）→傭兵比照，達成玩家/傭兵完全一致。
    //    直擊反射改掛「普攻主擊＋技能直擊」各路徑（allyAttackOnce/allyQiguAttack/allyCastMagic/allyCastPhysicalSkill/咆哮/粉碎/屠宰/心破/會心）。
    if (!_dpsAllyTurn) _dpsAddAlly(ally, Math.max(0, Math.min(dmg, _dpsBf)));   // 🎯 回合外傭兵輸出（反擊/居合）直接歸該傭兵；回合內由 alliesTick HP-delta 涵蓋，避免重複
    let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (ri !== -1) killMob(ri); } else renderMobs();
}
// 🆕 v2.6.9 [傭兵能力補完 #1b]：傭兵攻擊當下 buff/被動傷害 proc（比照玩家 getPhysicalDmg js/04:90-102；讀 ally.buffs·由 #1a 自動維持）。
//   燃燒鬥志/屬性之火 各 30%×1.5；雙重破壞(雙刀/鋼爪·45級起10%＋每5級1%)×2；狂暴(近戰5%×2·skills-based)；勇猛意志(10%·劍術精通20%)×1.5；燃燒擊砍(近戰+7·一次性消耗·傭兵版不轉火屬性)。回傳新 dmg。
function _allyAtkBuffProcs(ally, dmg, isRanged) {
    let b = ally.buffs || {};
    if (b.sk_dark_burn > 0 && Math.random() < 0.30) dmg = Math.floor(dmg * 1.5);            // 🔥 燃燒鬥志
    if (b.sk_elf_attrfire > 0 && Math.random() < 0.30) dmg = Math.floor(dmg * 1.5);          // 🔥 屬性之火
    if (b.sk_dark_double > 0) {                                                              // ⚔️ 雙重破壞（雙刀/鋼爪）
        let _t = getWeaponTags((ally.eq && ally.eq.wpn) ? ally.eq.wpn.id : '');
        if (_t.includes('雙刀') || _t.includes('鋼爪')) { let _c = 10 + ((ally.lv || 1) >= 45 ? Math.floor(((ally.lv || 1) - 45) / 5) : 0); if (Math.random() * 100 < _c) dmg *= 2; }
    }
    if (!isRanged && ally.skills && ally.skills.includes('sk_warrior_berserk') && Math.random() < 0.05) dmg *= 2;   // ⚔️ 狂暴（近戰5%×2）
    if (b.sk_royal_bravewill > 0 && Math.random() < (allyHasMastery(ally, 'k_royal_sword') ? 0.2 : 0.1)) dmg = Math.floor(dmg * 1.5);   // 👑 勇猛意志
    if (b.sk_dragon_flameslash > 0 && !isRanged) { dmg += 7; ally.buffs.sk_dragon_flameslash = 0; }   // 🐉 燃燒擊砍：一次性 +7
    return Math.max(1, Math.floor(dmg));
}
// 傭兵的一次物理打擊計算（沿用 allyAttackOnce 的簡化公式）
// opts: forceHit=必中(可自然重擊) / forceHeavy=必中+必重擊 / noHeavy=不重擊 / mult=傷害倍率
function allyStrikeRoll(ally, t, opts) {
    opts = opts || {};
    let d = ally.d || {};
    let wpnInst = opts.wpnInst || (ally.eq && ally.eq.wpn) || null;   // ⚔️ 可指定武器實例（迅猛雙斧副手＝offwpn）
    let wpn = wpnInst ? DB.items[wpnInst.id] : null;
    let dice = wpn ? (t.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
    let isRanged = !!(wpn && wpn.ranged);
    let hitB = (isRanged ? (d.rangedHit||0) : (d.meleeHit||0)) + (d.extraHit||0) + (ally._setBeauty5 ? (ally._beautyMissStack || 0) : 0);   // 🔮 v2.6.21 麗人5/5：未命中堆疊命中（鏡像玩家 js/03:763）
    let dmgB = isRanged ? (d.rangedDmg||0) : (d.meleeDmg||0);
    if (wpn && wpn.hasteStrike && ally.buffs && ally.buffs.haste > 0) { hitB += 30; dmgB += 30; }   // 🏺 v3.1.76 殺人蜂的尾刺（傭兵·連擊/反擊/居合/副手共用）：加速時 +30/+30（鏡像玩家 js/03:823·加速清除只在主攻擊命中）
    let critR = isRanged ? (d.rangedCrit||0) : (d.meleeCrit||0);
    let critD = isRanged ? (d.rangedCritDmg||0) : (d.meleeCritDmg||0);
    let hit = true, heavy = false, graze = false;
    if (opts.forceHeavy) { heavy = true; }
    else if (opts.forceHit) { heavy = !opts.noHeavy && (roll(1, 20) === 20); }
    else {
        let hv = stretchHitValue((ally.lv||1) + hitB - t.lv + mobEffAC(t, ally));   // 🩹 v3.1.76 稽核高#1：改走與玩家/怪打玩家/怪打傭兵相同的軟地板曲線（原線性 clamp 對高AC怪命中系統性偏低·v3.1.40 怪物AC以此曲線為錨）
        if (ally.buffs && ally.buffs.sk_warrior_outlaw > 0) hv = Math.max(hv, 10);   // ⚔️ v3.1.77 亡命之徒（傭兵）：一般攻擊最低命中率 50%（鏡像玩家 js/03:830·原傭兵維持此 buff 白扣 MP）
        let _isCrushS = !!(wpn && wpn.eff === 'crush');   // 🥊 v2.6.20 重擊特效武器(粉碎·雙手鈍器)
        let r = roll(1, 20);
        let _norm = ((r === 20) || (r !== 1 && hv >= r) || (r === 1 && ally.buffs && ally.buffs.sk_elf_preciseshot > 0));   // 🏹 精準射擊（妖精傭兵·存檔時持有此buff）：擲骰1由必定未命中→必定命中
        if (_isCrushS && r !== 20 && r >= 19 - Math.round(((wpn && wpn.heavyRatePct) || 0) / 5) && (!ally.classicMode || (wpn && wpn.classicOk) || r !== 19)) { hit = true; heavy = !opts.noHeavy; }   // 🥊 粉碎：骰19重擊命中；🏺 方尖碑 heavyRatePct → 骰17~19 亦重擊（v3.2.40 升級優先於普通命中·對齊玩家 js/03:787）；🎮 v3.2.44 用戶拍板：經典模式只停「骰19」一般重擊特效——heavyRatePct 擴充段照樣重擊·classicOk 全放行
        else if (_norm) { hit = true; heavy = !opts.noHeavy && (r === 20); }
        else if (r === 19) { hit = true; graze = true; }   // 🥊 v2.6.20 擦傷：骰19本應未命中→命中但50%不爆（鏡像玩家 785）
        else hit = false;
    }
    if (!hit) { if (ally._setBeauty5) ally._beautyMissStack = (ally._beautyMissStack || 0) + 10; return { hit: false, dmg: 0, heavy: false, crit: false }; }   // 🔮 v2.6.21 麗人5/5：未命中→命中堆疊+10（鏡像玩家 786）
    if (ally._setBeauty5 && ally._beautyMissStack) ally._beautyMissStack = 0;   // 🔮 v2.6.21 麗人5/5：命中（含forceHit/擦傷/粉碎）→堆疊歸零（鏡像玩家 787）
    let isCrit = !graze && (opts.forceCrit || (Math.random()*100 < critR));   // 🏅 反擊精通（傭兵）：反擊/居合必定爆擊；🥊 v2.6.20 擦傷不爆
    let critMult = isCrit ? (1 + critD/100) : 1;
    let wpnRoll = (heavy || (!isRanged && ally.buffs && ally.buffs.sk_elf_flamesoul > 0)) ? dice : roll(1, dice);   // 🔥 v3.1.77 烈焰之魂（傭兵·連擊/反擊/居合/副手共用·鏡像玩家 js/03:861）
    let dmg = Math.max(1, Math.floor((wpnRoll + dmgB) * critMult) + (d.extraDmg||0) - (t.dr||0) - mobHardSkin(t));   // 🔧 硬皮：額外物理減傷
    { let _unb = allyUnbonusBonus(ally, t); if (_unb) dmg += _unb; }   // 🔧 對不死/狼人加成 +1D20（與玩家一致；連擊/魔擊共用此計算）
    if (opts.mult) dmg = Math.max(1, Math.floor(dmg * opts.mult));
    if (graze) dmg = Math.max(1, Math.floor(dmg * 0.5));   // 🥊 v2.6.20 擦傷 50%（鏡像玩家 833）
    dmg = Math.max(1, Math.floor(dmg * fragileMult(t)));   // 🔮 脆弱（白鳥5）
    dmg = _allyAtkBuffProcs(ally, dmg, isRanged);   // 🆕 v2.6.9 #1b：攻擊 buff proc（連擊/魔擊/反擊/居合/雙持共用此計算）
    dmg = Math.max(1, Math.floor(dmg * (opts.noEnhance ? 1 : wpnEnFinalMult(wpnInst))));   // 🔧 武器強化 +11~+20：最終傷害倍率（noEnhance＝副手不另計強化）
    dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷：物理攻擊樞紐（普攻技/連擊/魔擊/反擊/居合/穿透/雙持/鐵衛/物理技/屠宰者皆經此·鏡像玩家 getPhysicalDmg rlFuryMult；原物理傭兵全無紅獅5）
    if (t._fireVulnUntil > state.ticks && getWpnEle(wpnInst, wpn) === 'fire') dmg = Math.max(1, Math.floor(dmg * 1.3));   // 🏺 v3.1.76 灼熱蜥蜴長舌（傭兵受益端·連擊/反擊/居合/副手共用·鏡像玩家 js/03:901）
    if (!opts.forceHit && !opts.forceLand && !opts.forceHeavy && d.eleWpnMult && getWpnEle(wpnInst, wpn) === d.eleWpnMult.ele) dmg = Math.max(1, Math.floor(dmg * d.eleWpnMult.mult));   // 🏺 v3.1.80 四之牙臂甲（傭兵·連擊/副手）：對應屬性武器一般攻擊 ×1.2（v3.2.42 稽核修：排除反擊/居合/魔擊·對齊玩家 js/03 _natRoll 閘＝「一般攻擊」字面）
    if (heavy && wpn && wpn.heavyMult) dmg = Math.max(1, Math.floor(dmg * wpn.heavyMult));   // 🏺 v3.1.76 鎧甲守衛的笨重巨劍（傭兵·鏡像玩家 js/03:903）
    if (ally.statuses && ally.statuses.broken > 0) dmg = Math.max(1, Math.floor(dmg * 0.8));   // 🐍 v3.1.76 壞物術（傭兵·鏡像玩家 js/03:904）
    markBossPhysicalHit(t);
    return { hit: true, dmg: dmg, heavy: heavy, crit: isCrit };
}
// 共鳴光箭（傭兵版）：公式同玩家 procLightArrow；回魔（傷害/10、至少1）恢復到傭兵自身 MP
function allyProcLightArrow(ally, t) {
    if (ally.classicMode) return;   // 🎮 經典模式：傭兵停用共鳴
    let sk = DB.skills['sk_lightarrow'];
    if (!sk || !t || t.curHp <= 0) return;
    let d = ally.d || {};
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let mrFactor = allyHasMastery(ally, 'm_resonance') ? 1 : mrMult(effMr);   // 🏅 共鳴精通（傭兵）：光箭無視魔抗
    let isCrit = Math.random()*100 < (d.magicCrit||0);
    let _resoWpn = ally.eq && ally.eq.wpn && DB.items[ally.eq.wpn.id];
    let spCoef = weaponMagicDamageCoef(d, _resoWpn, t, sk.ele || 'none');
    let mageMult = 1.0;   // 武器特效階級已由 weaponMagicDamageCoef 統一套用。
    let critMult = isCrit ? (1 + (d.magicCritDmg||0)/100) : 1;
    let core = magicBaseDamage(roll(sk.dmgDice[0], sk.dmgDice[1]), d, sk.dmgBase || 0, true) * spCoef * critMult;
    let dmg = Math.max(1, Math.floor(core * mrFactor));
    dmg = Math.floor(dmg * mageMult);
    dmg = Math.max(1, Math.floor(dmg * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔧 武器強化 +11~+20：最終傷害倍率（共鳴光箭·鏡像玩家 procLightArrow）
    let _allyReso = allyHasMastery(ally, 'm_resonance');   // 🔧 傭兵共鳴精通：光箭+5、回魔/5
    if (_allyReso) dmg = Math.max(1, dmg + 5);
    dmg = Math.max(1, Math.floor(dmg * equipSkillDmgMult(sk, 'sk_lightarrow', ally)));   // 🏺 v3.2.42 稽核修：傭兵共鳴光箭也吃技能傷害倍率遺物（鏡像玩家 procLightArrow）
    dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（共鳴光箭·原全無·鏡像玩家 procLightArrow rlFuryMult）
    // 🔮 共鳴本身已有回魔，不觸發幻覺2/5與5/5（鏡像玩家 procLightArrow）
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    ally.mp = Math.min(ally.mmp||0, (ally.mp||0) + Math.max(1, Math.floor(dmg/(_allyReso ? 5 : 10))));   // 共鳴回魔 → 傭兵自身
    logCombat(`<span class="text-cyan-300 font-bold">【協力·${ally._allyName}·共鳴】</span>光箭對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點傷害。${isCrit?' (爆擊!)':''}`, 'magic');
    _allyDamageMob(ally, t, dmg, 'magic');
    // 🔮 魔女 5/5（傭兵）：每 5 次共鳴 → 免費施放冰雪暴（sk_blizzard）
    if (ally._setWitch5) { ally._witchResCnt = (ally._witchResCnt || 0) + 1; if (ally._witchResCnt >= 5) { ally._witchResCnt = 0; if (typeof allyStormTick === 'function' && DB.skills['sk_blizzard']) allyStormTick(ally, DB.skills['sk_blizzard'], true); } }   // 🔮 魔女5/5(傭兵)：每5共鳴→免費冰雪暴(sk_blizzard·4×2D10水全體·不吃法師階級加成)
}
// 🔮 冰矛圍籬（傭兵版·鑽石高崙武器 proc→js/07 allyWitchIceLance）：免費單體水魔法（公式同 witchIceLance，但用傭兵 d / 旗標）。⚠️魔女5/5(傭兵)已改走 allyStormTick(sk_blizzard)＝冰雪暴。
function allyWitchIceLance(ally) {
    let sk = DB.skills['sk_ice_lance']; if (!sk) return;
    let t = getTarget();
    if (!t || t.curHp <= 0 || t._dead) { let alive = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead); if (!alive.length) return; t = alive[Math.floor(Math.random() * alive.length)]; }
    let d = ally.d || {};
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let mrFactor = mrMult(effMr);
    let isCrit = Math.random() * 100 < (d.magicCrit || 0);
    let _procWpn = ally.eq && ally.eq.wpn && DB.items[ally.eq.wpn.id];
    let spCoef = weaponMagicDamageCoef(d, _procWpn, t, 'water');
    let mageMult = 1.0;   // 武器特效階級已由 weaponMagicDamageCoef 統一套用。
    let critMult = isCrit ? (1 + (d.magicCritDmg || 0) / 100) : 1;
    let core = magicBaseDamage(roll(sk.dmgDice[0], sk.dmgDice[1]), d, sk.dmgBase || 0, true) * spCoef * critMult;
    let dmg = Math.max(1, Math.floor(core * mrFactor));
    dmg = Math.floor(dmg * mageMult);
    dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（魔女5冰矛圍籬·原僅紅獅字面）
    dmg = Math.max(1, Math.floor(dmg * fragileMult(t)));
    dmg = Math.max(1, Math.floor(dmg * elementCounterMult('water', t.e)));   // ⚔️ 屬性剋制倍率（取代舊 水剋火 +6 固定加值）
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    if (sk.freeze && t.curHp > 0) applyMobStatus(t, { kind: 'freeze', pbase: sk.freeze, dur: 6 }, sk.n);
    logCombat(`<span class="font-bold" style="color:#7dd3fc;text-shadow:0 0 6px #0ea5e9;">【協力·${ally._allyName}·冰矛圍籬】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點傷害。${isCrit ? ' (爆擊!)' : ''}`, 'magic');
    _allyDamageMob(ally, t, dmg, 'water');
}
// 月光爆裂（傭兵版）：1D30 + 2×武器強化 風屬性固定傷害（剋水 +6）
function allyProcMoonburst(ally, t) {
    if (!t || t.curHp <= 0) return;
    let en = capWpnEn((ally.eq && ally.eq.wpn && ally.eq.wpn.en) || 0);
    let dmg = roll(1, 30) + 2 * en;
    let _cm = elementCounterMult('wind', t.e);   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
    let counterTxt = (_cm > 1) ? ' <span class="text-emerald-300 font-bold">(剋屬性!)</span>' : (_cm < 1 ? ' <span class="text-rose-400 font-bold">(被剋!)</span>' : '');
    dmg = Math.max(1, Math.floor(dmg * enhanceWpnFinalMult(en, ally.eq && ally.eq.wpn && DB.items[ally.eq.wpn.id])));   // 🔧 武器強化 +11~+20：最終傷害倍率
    dmg = Math.max(1, Math.floor(dmg * _cm));
    dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（月光爆裂·原全無·鏡像玩家 procMoonburst rlFuryMult）
    logCombat(`<span class="font-bold" style="color:#67e8f9;text-shadow:0 0 6px #06b6d4;">【協力·${ally._allyName}·月光爆裂】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點風屬性傷害！${counterTxt}`, 'player-special');
    _allyDamageMob(ally, t, dmg, 'wind');
}
// 🔧 武器附魔施放（spellProc，傭兵版）：死亡騎士的烈炎之劍・烈炎術／克特之劍・極道落雷（必中、受傭兵魔法傷害影響、屬性剋制+6、魔導精通同屬性×2）
function _allyProcWeaponSpellHit(ally, t, sp, en, illusionRecoverMp) {
    if (!t || t.curHp <= 0) return;
    let d = ally.d || {};
    let _procWpn = ally.eq && ally.eq.wpn && DB.items[ally.eq.wpn.id];
    let core = magicBaseDamage(roll(sp.dice[0], sp.dice[1]), d, sp.flat || 0, true) * weaponMagicDamageCoef(d, _procWpn, t, sp.ele);
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let mrFactor = mrMult(effMr);
    let _cm = elementCounterMult(sp.ele, t.e);   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
    let dd = Math.floor(core * mrFactor);
    // 🔧 傭兵魔導精通同屬性傷害×2 已移除(2026-07 用戶要求)
    dd = Math.max(1, Math.floor(Math.max(1, dd) * fragileMult(t)));
    dd = Math.max(1, Math.floor(dd * enhanceWpnFinalMult(en, ally.eq && ally.eq.wpn && DB.items[ally.eq.wpn.id])));   // 🔧 武器強化 +11~+20：最終傷害倍率（取代舊 (1+強化/20)）
    dd = Math.max(1, Math.floor(dd * _cm));
    dd = Math.max(1, Math.floor(dd * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（死騎/克特武器附魔·原全無·鏡像玩家 _procWeaponSpellHit rlFuryMult）
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    dd = _allyIllusionMagicDmg(ally, dd, illusionRecoverMp !== false);   // 🔮 全體 spellProc 只在第一個目標回MP
    let glow = (sp.ele === 'fire') ? '#fca5a5;text-shadow:0 0 6px #dc2626'
             : (sp.ele === 'wind') ? '#67e8f9;text-shadow:0 0 6px #06b6d4'
             : (sp.ele === 'water') ? '#93c5fd;text-shadow:0 0 6px #2563eb'
             : (sp.ele === 'earth') ? '#fcd34d;text-shadow:0 0 6px #b45309'
             : '#d8b4fe;text-shadow:0 0 6px #a855f7';
    let counterTxt = (_cm > 1) ? ' <span class="text-emerald-300 font-bold">(剋屬性!)</span>' : (_cm < 1 ? ' <span class="text-rose-400 font-bold">(被剋!)</span>' : '');
    logCombat(`<span class="font-bold" style="color:${glow};">【協力·${ally._allyName}·${sp.skn}】</span>武器之力爆發，對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dd} 點${ELE_CN[sp.ele] || ''}屬性魔法傷害！${counterTxt}`, 'player-special');
    _allyDamageMob(ally, t, dd, (sp.ele && sp.ele !== 'none') ? sp.ele : 'magic');
    // ⚡ 固定機率附加異常狀態（與玩家版一致；force 繞過魔抗命中判定，BOSS 免疫仍生效）
    if (t.curHp > 0 && sp.status && Math.random() * 100 < sp.status.pct) applyMobStatus(t, { kind: sp.status.kind, dur: sp.status.dur || 4, force: true }, sp.skn);
}
function allyProcWeaponSpell(ally, t, sp, en) {
    if (sp.aoe) {
        // 🔧 地獄火（傭兵版）：對敵方全體各自施放，uid 快照避免擊殺改動索引
        let uids = mapState.mobs.filter(m => m && m.curHp > 0).map(m => m.uid);
        uids.forEach((uid, i) => { let mob = mapState.mobs.find(m => m && m.uid === uid && m.curHp > 0); if (mob) _allyProcWeaponSpellHit(ally, mob, sp, en, i === 0); });
        return;
    }
    _allyProcWeaponSpellHit(ally, t, sp, en);
}
// 🔧 免費施放傷害魔法（procSkill，傭兵版）：武器觸發取武器權重階級，其餘來源取技能本身階級。
function allyProcFreeMagicSkill(ally, t, skId, en, areaHit, sourceItem, illusionRecoverMp) {
    let sk = DB.skills[skId];
    if (!sk || !t || t.curHp <= 0) return;
    if (sk.target === 'all' && !areaHit) {
        let uids = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead).map(m => m.uid);
        uids.forEach((uid, i) => {
            let mob = mapState.mobs.find(m => m && m.uid === uid && m.curHp > 0 && !m._dead);
            if (mob) allyProcFreeMagicSkill(ally, mob, skId, en, true, sourceItem, i === 0);
        });
        return;
    }
    let d = ally.d || {};
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let mrFactor = mrMult(effMr);
    let isCrit = Math.random() * 100 < (d.magicCrit || 0);
    let spCoef = (sourceItem && sourceItem.type === 'wpn')
        ? weaponMagicDamageCoef(d, sourceItem, t, sk.ele || 'none')
        : magicDamageCoef(d, magicAttrDefense(t, sk.ele || 'none'), sk.tier);
    let mageDmgMult = 1.0;
    let critMult = isCrit ? (1 + (d.magicCritDmg || 0) / 100) : 1.0;
    let dmgArray = sk.multiDmg || (sk.dmgDice ? [[sk.dmgDice[0], sk.dmgDice[1]]] : []);
    let total = 0;
    dmgArray.forEach((dc, idx) => {
        let isLastHit = idx === dmgArray.length - 1;
        let core = magicBaseDamage(roll(dc[0], dc[1]), d, isLastHit ? (sk.dmgBase || 0) : 0, isLastHit) * spCoef * critMult;   // 🔧 強化改吃 +11 最終倍率（見迴圈後）
        let dd = Math.floor(core * mrFactor);
        dd = Math.max(1, dd);
        dd = Math.floor(dd * mageDmgMult);
        dd = Math.max(1, Math.floor(dd * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（免費武器魔法逐骰·原僅紅獅字面）
        // 🔧 傭兵魔導精通同屬性傷害×2 已移除(2026-07 用戶要求)
        total += Math.max(1, Math.floor(dd * fragileMult(t)));
    });
    total = Math.floor(total * enhanceWpnFinalMult(en, ally.eq && ally.eq.wpn && DB.items[ally.eq.wpn.id]));   // 🔧 武器強化 +11~+20：最終傷害倍率（取代舊 (1+強化/20)）
    total = Math.max(1, Math.floor(total * elementCounterMult(sk.ele, t.e)));   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
    total = Math.max(1, Math.floor(total * equipSkillDmgMult(sk, skId, ally)));   // 🥕 v3.2.40 稽核修：傭兵武器免費施法也吃技能傷害倍率遺物（冰之女王魔杖冰錐×暴走兔胡蘿蔔1.5 等·鏡像玩家 js/04:500）
    total = _allyIllusionMagicDmg(ally, total, illusionRecoverMp !== false);   // 🔮 全體免費施法只在第一個目標回MP
    if (total > 0) {
        if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
        logCombat(`<span class="font-bold" style="color:#93c5fd;text-shadow:0 0 6px #2563eb;">【協力·${ally._allyName}·${sk.n}】</span>額外施放，對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 <span class="${isCrit ? 'text-yellow-500 font-bold' : 'text-cyan-300'}">${total}</span> 點傷害${isCrit ? '（爆擊!）' : ''}。`, 'player-special');
        if (sk.lifesteal) { let _h = Math.min(total, (ally.mhp || 0) - (ally.curHp || 0)); if (_h > 0) { ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + _h); logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>吸取了 ${_h} 點生命。`, 'heal', 'mercenary'); } }   // 🩸 v3.2.43 稽核修：吸血法術 proc 觸發也回血（鏡像玩家 procFreeMagicSkill·比照 js/06:610 allyCastMagic）
        _allyDamageMob(ally, t, total, (sk.ele && sk.ele !== 'none') ? sk.ele : 'magic');
    }
    if (t.curHp > 0 && sk.freeze) applyMobStatus(t, { kind: 'freeze', pbase: sk.freeze, dur: 6 }, sk.n);
    if (t.curHp > 0 && sk.status) applyMobStatus(t, sk.status, sk.n, spCoef);
}
// 🔧 蕾雅魔杖（meleeHitSpell，傭兵版）：命中時觸發冰裂術（必中、受傭兵魔法傷害影響；對冰凍目標碎冰額外傷害，否則機率冰凍）
function allyLaiaWandHitProc(ally, t) {
    let inst = ally.eq && ally.eq.wpn; let w = inst ? DB.items[inst.id] : null;
    if (!w || !w.meleeHitSpell || !t || t.curHp <= 0) return;
    let d = ally.d || {};
    let sp = w.meleeHitSpell; let en = capWpnEn(inst.en);
    let core = magicBaseDamage(roll(sp.dice[0], sp.dice[1]), d, sp.flat || 0, true) * weaponMagicDamageCoef(d, w, t, sp.ele);
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    let mrFactor = mrMult(effMr);
    let wasFrozen = !!(t.st && t.st.freeze > 0);
    let dd = Math.floor(core * mrFactor);
    dd = Math.max(1, dd);   // 武器 proc 的 ×(1+階級/10) 已由 weaponMagicDamageCoef 統一套用。
    if (wasFrozen) { dd += (sp.shatter || 0); t.st.freeze = 0; }
    dd = Math.max(1, Math.floor(Math.max(1, dd) * fragileMult(t)));
    dd = Math.max(1, Math.floor(dd * enhanceWpnFinalMult(en, w)));   // 🔧 武器強化 +11~+20：最終傷害倍率（取代舊 (1+強化/10)）
    dd = Math.max(1, Math.floor(dd * elementCounterMult(sp.ele, t.e)));   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    logCombat(`<span class="font-bold" style="color:#93c5fd;text-shadow:0 0 6px #2563eb;">【協力·${ally._allyName}·${sp.skn || '冰裂術'}】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dd} 點水屬性魔法傷害${wasFrozen ? '（冰碎!）' : ''}。`, 'player-special');
    _allyDamageMob(ally, t, dd, sp.ele);
    if (t.curHp > 0) applyMobStatus(t, { kind: 'freeze', pbase: sp.freezePbase, dur: 6 }, sp.skn || '冰裂術');   // 機率冰凍
}
// 普攻後判定（命中與否皆判定，與玩家一致）：瑪那回魔(僅命中) / 共鳴 / 魔擊 / 月光爆裂
// 🆕 v2.6.10 [傭兵能力補完 #3] 傭兵魔法娃娃攻擊 proc（比照玩家 weaponSpellProc js/04:343-360·讀 ally.eq.doll）：額外傷害/毒咒/免費施法。無武器也生效。
function allyDollAttackProcs(ally, target) {
    let dl = (ally.eq && ally.eq.doll) ? DB.items[ally.eq.doll.id] : null;
    if (!dl) return;
    if (dl.procBonusDmg && target && target.curHp > 0 && Math.random() * 100 < dl.procBonusDmg.rate) {   // 額外固定傷害
        let _add = dl.procBonusDmg.dmg;
        target.curHp -= _add; target.justHit = target.justHit || 'phys'; mobWake(target);
        logCombat(`<span class="font-bold text-amber-300">【協力·${ally._allyName}·${dl.n}】</span>額外造成 ${_add} 點傷害。`, 'player-special');
        let _ri = mapState.mobs.findIndex(m => m && m.uid === target.uid);
        if (target.curHp <= 0) { if (_ri !== -1) killMob(_ri); } else renderMobs();
    }
    if (dl.procPoisonRate) applyWeaponProcPoison(target, { rate: dl.procPoisonRate, dmg: [2, 5], dur: 10, tick: 3 }, wpnEnFinalMult(ally.eq && ally.eq.wpn));   // 機率中毒
    if (dl.procSkill && Math.random() * 100 < (dl.procRateBase || 1)) {   // 機率免費施法（走傭兵版 allyProcFreeMagicSkill）
        let _t2 = (target && target.curHp > 0) ? target : null;
        if (!_t2) { let _al = mapState.mobs.filter(m => m && m.curHp > 0); if (_al.length) _t2 = _al[Math.floor(Math.random() * _al.length)]; }
        if (_t2) allyProcFreeMagicSkill(ally, _t2, dl.procSkill, 0, false, dl);
    }
}
// 🔮 傭兵魔擊本體（必中重擊＋魔擊精通擴散）：eff:'magicstrike' proc 與 🏅 v2.6.70「共鳴/魔爆改發魔擊」共用（鏡像玩家 procMagicStrike）
function _allyMagicStrikeHit(ally, t, wpnInst, wpn) {
    if (!t || t.curHp <= 0) return;
    let res = allyStrikeRoll(ally, t, { forceHeavy: true });
    logCombat(`<span class="font-bold" style="color:#d8b4fe;text-shadow:0 0 6px #a855f7;">【協力·${ally._allyName}·魔擊】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${res.dmg} 點傷害（${res.crit?'會心一擊':'重擊'}!）。`, res.crit ? 'player-crit' : 'player-special');
    wearHardSkin(t, null, true, false);   // 🔧 硬皮消磨：傭兵魔擊重擊 -2
    _allyDamageMob(ally, t, res.dmg, getWpnEle(wpnInst, wpn));
    // 🔧 傭兵魔擊精通：必定額外擴散魔擊（對全體各打一次，不再連鎖）
    if (allyHasMastery(ally, 'm_strike')) {
        let _all = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
        if (_all.length) {
            logCombat(`<span class="font-bold" style="color:#e9d5ff;text-shadow:0 0 8px #a855f7;">【協力·${ally._allyName}·魔擊精通】</span>魔力向四方擴散！`, 'player-special');
            _all.forEach(m => { let r2 = allyStrikeRoll(ally, m, { forceHeavy: true }); logCombat(`擴散魔擊命中 <span class="${getMobColor(m.lv)}">${m.n}</span>，造成 ${r2.dmg} 點傷害。`, 'player-special'); _allyDamageMob(ally, m, r2.dmg, getWpnEle(wpnInst, wpn)); });
        }
    }
}
function allyWeaponProcs(ally, target, hitInfo) {
    allyDollAttackProcs(ally, target);   // 🆕 v2.6.10 #3：魔法娃娃攻擊 proc（置於武器判定前→無武器也生效，比照玩家）
    let wpnInst = ally.eq && ally.eq.wpn;
    if (!wpnInst) return;
    let wpn = DB.items[wpnInst.id];
    if (!wpn) return;
    if (wpn.procPoison) applyWeaponProcPoison(target, wpn.procPoison, wpnEnFinalMult(wpnInst));   // 🔧 死亡之指：傭兵攻擊時毒咒（與玩家一致·吃武器強化最終倍率）
    if (wpn.procBurstPoison) applyWeaponBurstPoison(target, wpn.procBurstPoison, capWpnEn(wpnInst.en), wpnEnFinalMult(wpnInst));   // 💥 破壞雙刀/鋼爪：傭兵攻擊時猛爆劇毒（與玩家一致·吃武器強化最終倍率）
    if (wpn.procStatusSkill) { let _sv = player; player = ally; try { applyWeaponProcStatusSkill(target, wpn.procStatusSkill); } finally { player = _sv; } }   // 🌑 惡魔王武器：傭兵攻擊時施放疾病術（以傭兵自身魔法命中判定）
    // 🏺 v3.1.80 思克巴女皇的熱情魔杖（傭兵）：攻擊時 10% 機率隨機觸發一個火屬性傷害法術（鏡像玩家 weaponSpellProc）
    if (wpn.procFireSkillRate && Math.random() * 100 < wpn.procFireSkillRate) {
        let _ft = _allyProcTarget(target);
        let _fp = _fireProcPool();
        if (_ft && _fp.length) allyProcFreeMagicSkill(ally, _ft, _fp[Math.floor(Math.random() * _fp.length)], capWpnEn(wpnInst.en || 0), false, wpn);
    }
    let d = ally.d || {};
    // 👹 隱藏的魔族武器（傭兵）：紅惡靈逆襲(4D10水魔傷·吸10%HP) / 藍惡靈奪魔(回3D6 MP)，4% + 每強化 +1%（與玩家一致；經典模式亦可觸發）
    if (wpn.redSpecter || wpn.blueSpecter) {
        let _en = capWpnEn(wpnInst.en);
        if (wpn.redSpecter && Math.random() * 100 < (4 + _en)) {
            let t = _allyProcTarget(target);
            if (t) {
                let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
                let core = magicBaseDamage(roll(4, 10), d, 0, true) * weaponMagicDamageCoef(d, wpn, t, 'water') * enhanceWpnFinalMult(_en, wpn);
                let dmg = Math.floor(core * mrMult(effMr));
                dmg = Math.max(1, Math.floor(Math.max(1, dmg) * fragileMult(t)));
                dmg = Math.max(1, Math.floor(dmg * elementCounterMult('water', t.e)));   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
                if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
                dmg = _allyIllusionMagicDmg(ally, dmg);   // 🔮 與玩家紅惡靈逆襲一致
                let _hl = Math.floor(dmg * 0.10);
                ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + _hl);   // 🐉 紅惡靈逆襲（傭兵）·v2.6.9 修：回復戰鬥HP(curHp) 非快照 hp
                logCombat(`<span class="font-bold" style="color:#f87171;text-shadow:0 0 6px #dc2626;">【協力·${ally._allyName}·紅惡靈逆襲】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點水屬性魔法傷害，恢復 ${_hl} 點 HP。`, 'player-special');
                _allyDamageMob(ally, t, dmg, 'water');
            }
        }
        if (wpn.blueSpecter && Math.random() * 100 < (4 + _en)) {
            let _mp = rollDice(3, 6);
            ally.mp = Math.min(ally.mmp || 0, (ally.mp || 0) + _mp);
            logCombat(`<span class="font-bold" style="color:#60a5fa;text-shadow:0 0 6px #2563eb;">【協力·${ally._allyName}·藍惡靈奪魔】</span>奪取魔力，恢復 ${_mp} 點 MP。`, 'player-special');
        }
    }
    if (hitInfo && hitInfo.hit && (wpn.eff === 'mp_drain' || wpn.mpOnHit)) {   // 瑪那魔杖/惡魔王魔杖(mpOnHit)：命中恢復MP → 傭兵自身（恢復量同玩家）
        ally.mp = Math.min(ally.mmp||0, (ally.mp||0) + mpOnHitAmount(wpn, capWpnEn(wpnInst.en)));   // 💧 單一真相 mpOnHitAmount（js/03）：傭兵鏡像玩家
    }
    {
        let _amk = allyHasMastery(ally, 'm_strike') && !ally.classicMode;   // 🏅 v2.6.70 魔擊精通（傭兵）：共鳴改發魔擊；v2.6.71 觸發率比照原生魔擊＝力量/60（鏡像玩家·經典模式維持光箭吃智力）
        if (typeof WAND_LIGHTARROW_IDS !== 'undefined' && WAND_LIGHTARROW_IDS.includes(wpnInst.id) && Math.random() < (((_amk ? d.str : d.int) || 0) / 60)) {
            let t = _allyProcTarget(target);
            if (t) { if (_amk) _allyMagicStrikeHit(ally, t, wpnInst, wpn); else allyProcLightArrow(ally, t); }
        }
    }
    if (wpn.eff === 'magicstrike' && !ally.classicMode && Math.random() < ((d.str||0)/60)) {   // 🎮 經典模式：傭兵停用魔擊
        let t = _allyProcTarget(target);
        if (t) _allyMagicStrikeHit(ally, t, wpnInst, wpn);
    }
    if (wpn.eff === 'moonburst' && Math.random() < 0.08) {
        let t = _allyProcTarget(target); if (t) allyProcMoonburst(ally, t);
    }
    if (wpn.dragonStrike && Math.random() * 100 < wpn.dragonStrike) {   // 🔧 龍的一擊（傭兵版）：用傭兵力量
        let _ts = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
        if (_ts.length) {
            logCombat(`<span class="font-bold" style="color:#fca5a5;text-shadow:0 0 6px #dc2626;">【協力·${ally._allyName}·龍的一擊】</span>劍中的龍魂咆哮！`, 'player-special');
            _ts.forEach(m => {
                if (!m || m.curHp <= 0 || m._dead) return;
                let dmg = roll(1, Math.max(1, Math.floor(d.str || 1))) + 25;
                dmg = Math.max(1, Math.floor(dmg * fragileMult(m)));   // 🔮 v3.1.78 脆弱（白鳥5/破甲·傭兵龍的一擊·鏡像玩家 js/04:276 原漏乘）
                dmg = Math.max(1, Math.floor(dmg * wpnEnFinalMult(wpnInst)));   // 🔧 武器強化 +11~+20：最終傷害倍率
                dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（龍的一擊·原全無·鏡像玩家 dragonStrike rlFuryMult）
                logCombat(`龍之衝擊命中 <span class="${getMobColor(m.lv)}">${m.n}</span>，造成 ${dmg} 點固定傷害。`, 'player');
                _allyDamageMob(ally, m, dmg, true);
            });
        }
    }
    // 🔧 武器附魔施放（spellProc/procSkill，與玩家一致）：一般武器命中與否皆判定；procOnHit 武器僅命中時判定
    if ((wpn.spellProc || wpn.procSkill) && (!wpn.procOnHit || (hitInfo && hitInfo.hit))) {
        let _en = capWpnEn(wpnInst.en);
        if (Math.random() * 100 < ((wpn.procRateBase || 1) + (wpn.procRatePerEn != null ? wpn.procRatePerEn : 1) * _en)) {
            let st = _allyProcTarget(target);
            if (st) { if (wpn.spellProc) allyProcWeaponSpell(ally, st, wpn.spellProc, _en); else allyProcFreeMagicSkill(ally, st, wpn.procSkill, _en, false, wpn); }
        }
    }
    // 🔧 蕾雅魔杖（meleeHitSpell）：命中時觸發冰裂術（與玩家一致；作用於命中的目標）
    if (hitInfo && hitInfo.hit && wpn.meleeHitSpell && target && target.curHp > 0) allyLaiaWandHitProc(ally, target);
}
// 命中後物理特效：穿透 / 骰子匕首即死 / 匕首·矛出血 / 單手鈍器鈍擊 / 雙手劍切割
function allyOnHitEffects(ally, t, res) {
    let wpnInst = ally.eq && ally.eq.wpn;
    if (!wpnInst) return;
    let wpn = DB.items[wpnInst.id];
    if (!wpn) return;
    let d = ally.d || {};
    if ((wpn.eff === 'pierce' || wpn.alsoPierce) && (!ally.classicMode || wpn.classicOk)) {   // 穿透：場上有其他敵人時，依機率額外攻擊另一名敵人（各自獨立判定命中）；🎮 經典模式：傭兵停用穿透（⚔️ v3.2.38 classicOk 特例鏡像）；🌑 v3.3.33 alsoPierce 附帶貫穿（吉爾塔斯之劍/腐壞的長弓）
        let pc = (wpn.pierceChance !== undefined) ? wpn.pierceChance : 100;
        let others = [];
        mapState.mobs.forEach((m, i) => { if (m && m.curHp > 0 && !m._dead && m.uid !== t.uid) others.push(i); });
        if (others.length > 0 && roll(1, 100) <= pc) {
            // 🔧 傭兵穿透精通：穿透變全體攻擊；該傷害 100% 無視硬皮值（加回主目標硬皮量）
            let _allyPierce = allyHasMastery(ally, 'k_pierce');
            let _pT = _allyPierce ? others : [others[Math.floor(Math.random() * others.length)]];
            let _pd = res.dmg;
            if (_allyPierce && (res.hardSkin || 0) > 0) _pd += res.hardSkin;
            _pT.forEach(_ix => {
                let exT = mapState.mobs[_ix];
                if (!exT || exT.curHp <= 0 || exT._dead) return;
                // 🔧 穿透：每個波及目標各自獨立判定是否命中（依該怪 AC/等級），未命中則不造成傷害
                if (!allyStrikeRoll(ally, exT, {}).hit) {
                    logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}·穿透】</span>對 <span class="${getMobColor(exT.lv)}">${exT.n}</span> 的攻擊未命中。`, 'miss');
                    return;
                }
                logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}·穿透】</span>順勢命中 <span class="${getMobColor(exT.lv)}">${exT.n}</span>，造成 ${_pd} 點傷害。`, 'player');
                _allyDamageMob(ally, exT, _pd, getWpnEle(wpnInst, wpn));
            });
        }
    }
    if (wpn.eff === 'dice_death' && t.curHp > 0 && !t._dead) {   // 骰子匕首：1% 即死（非 BOSS）
        let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
        if (ri !== -1) tryInstakill(t, { p: 0.01, tag: null }, `【協力·${ally._allyName}】骰子匕首`, ri);
    }
    if (wpn.procInstakill && t.curHp > 0 && !t._dead) {   // 🏺 遺物武器即死 proc（強韌的大腿骨：傭兵版·比照玩家）
        let _pk = wpn.procInstakill;
        let _thpA = t.hp || 1;   // 🐍 v3.1.76 獻祭 healPct：先取被消滅敵人最大HP（鏡像玩家 js/04）
        if ((!_pk.maxLv || t.lv <= _pk.maxLv) && (!_pk.hpBelow || (t.curHp + ((res && res.dmg) || 0)) <= Math.max(1, Math.floor((t.hp || 1) * _pk.hpBelow)))) { let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (ri !== -1 && tryInstakill(t, { p: _pk.p, tag: _pk.tag || null }, `【協力·${ally._allyName}】${wpn.n}`, ri) && _pk.healPct) ally.curHp = Math.min(ally.mhp || 1, (ally.curHp || 0) + Math.max(1, Math.floor(_thpA * _pk.healPct))); }   // 🏺 v3.1.80 hpBelow：僅對 HP 低於 N% 目標觸發（來自陰影的刺劍·鏡像玩家）；🩹 v3.2.43 稽核修：用「扣血前」HP 判定（+res.dmg 還原）——對齊玩家 js/04:69 的判定時點
    }
    if (wpn.stoneInstakill && t.curHp > 0 && !t._dead && t.st && t.st.stone > 0) {   // 🏺 蛇妖的無慈悲尾刺：命中石化敵人必定即死（傭兵鏡像玩家）
        let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (ri !== -1) tryInstakill(t, { p: 1, tag: null }, `【協力·${ally._allyName}】蛇妖的無慈悲尾刺`, ri);
    }
    // 匕首/矛：力量/60 機率出血；🔧 出血精通：雙刀也比照匕首觸發（力量/60）；匕首/矛/雙刀皆可疊 10 層、每秒總傷害 ×(1+0.1×層)
    let _allyCanBleed = weaponHasBleed(wpnInst.id) || (allyHasMastery(ally, 'd_bleed') && getWeaponTags(wpnInst.id).includes('雙刀'));
    let _bleedChance = _allyCanBleed ? ((d.str||0)/60) : 0;
    if (_bleedChance > 0 && t.curHp > 0 && !t._dead && !ally.classicMode && Math.random() < _bleedChance) {   // 🎮 經典模式：傭兵停用出血
        applyBleed(t, res.dmg, allyHasMastery(ally, 'd_bleed') ? 10 : 5, allyHasMastery(ally, 'd_bleed'));   // 🔧 出血精通：上限 10 層 + 每層 +10%
    }
    // ⚔️ v3.1.74 戰斧投擲（傭兵鏡像玩家 js/04）：持續期間內近戰一般攻擊皆附加出血。
    //    傭兵原本能自我維持此 buff（js/06 _isMercSelfBuff 區塊·reqWpnBlunt 已把關）卻沒有任何攻擊端掛點＝白扣 MP，此處補上。
    //    鈍器必為近戰，故無需另判 ranged；🏅 雙斧精通：每層 +10%。
    if ((ally.buffs && ally.buffs.sk_warrior_throwaxe > 0) && t.curHp > 0 && !t._dead) {
        applyBleed(t, res.dmg, 5, allyHasMastery(ally, 'k_dualaxe'));
    }
    if (getWeaponTags(wpnInst.id).includes('單手鈍器') && t.curHp > 0 && !t._dead && !ally.classicMode) {   // 鈍擊：延遲目標攻擊 1 秒；🎮 經典模式：傭兵停用鈍擊
        t._bluntShow = state.ticks + 30;
        if (!t._bluntDelayed) {
            if (t._atkCd === undefined) t._atkCd = Math.max(1, Math.floor((t.atkSpd || 2) * 10));
            t._atkCd += 10;
            t._bluntDelayed = true;
        }
        wearHardSkin(t, wpnInst.id, false, true);   // 🔧 硬皮消磨：傭兵單手鈍器鈍擊 -1
    }
    if (res.heavy && wpn.eff === 'cleave' && !ally.classicMode) {   // 切割：重擊時自身攻速 +20%；🎮 經典模式：傭兵停用切割
        if (!(ally._cleaveTicks > 0)) logCombat(`<span class="text-teal-300 font-bold">【協力·${ally._allyName}】流暢的手感，攻速提升！</span>`, 'player');
        ally._cleaveTicks = allyHasMastery(ally, 'k_cleave') ? 40 : 20;   // 🔧 傭兵切割精通：持續4秒
    }
    if (ally._setWhiteBird5 && t.curHp > 0 && !t._dead) { if (!t.st) t.st = newMobStatus(); t.st.fragile = 30; }   // 🔮 白鳥 5/5（傭兵快照）：命中附加脆弱
    // 🏺 v3.1.80 奪魂者雙刃劍（傭兵）：一般攻擊命中觸發寒冷戰慄（每 cdSec 秒最多 1 次·每傭兵獨立節流·鏡像玩家 js/04）
    if (wpn.onHitCastSkill && t.curHp > 0 && !t._dead && state.ticks >= (ally._onHitCastCd || 0)) { ally._onHitCastCd = state.ticks + ((wpn.onHitCastSkill.cdSec || 5) * 10); allyProcFreeMagicSkill(ally, t, wpn.onHitCastSkill.skId, capWpnEn(wpnInst.en || 0), false, wpn); }
}
// 🔧 受擊觸發（判定「主操控玩家」受擊/迴避，傭兵代為反制攻擊者）
// 反擊：傭兵持單手劍 → 玩家被命中 50%（玩家觸發格檔則必定）；必中、不重擊、傷害 50%
// 🔮 鐵衛 5/5（傭兵）：觸發反擊/居合時，額外對全體敵人各做一次一般攻擊（各自正常命中判定）
// 🆕 v2.6.14 [傭兵能力補完 #5c] 傭兵受擊反射（比照玩家 enemyPhysicalAttack/applyMobMagic 反射層）：dmgTaken=本次實際承受傷害·物理/魔法共用·反射走 _allyDamageMob(歸該傭兵·處理擊殺)。
//   疼痛的歡愉(100%)·致命身軀(23%)·泰坦岩石(物理)/泰坦魔法(魔法·HP<門檻100%)＝承受量×fragileMult(mob)；鏡反射(魔法·機率=wis%)＝承受量原樣(唯一不乘脆弱)。
function allyReflectOnHit(ally, mob, dmgTaken, isMagic) {
    if (!ally || !mob || mob.curHp <= 0 || (dmgTaken || 0) <= 0) return;
    let b = ally.buffs || {};
    let _fm = fragileMult(mob);
    if (b.sk_illu_pain > 0 && mob.curHp > 0) {   // 疼痛的歡愉：100%
        let _rf = Math.max(1, Math.floor(dmgTaken * _fm));
        logCombat(`<span class="font-bold" style="color:#f472b6;">【協力·${ally._allyName}·疼痛的歡愉】</span>痛楚化為反擊，對 <span class="${getMobColor(mob.lv)}">${mob.n}</span> 造成 ${_rf} 點傷害。`, 'magic');
        _allyDamageMob(ally, mob, _rf, 'magic');
    }
    if (b.sk_dragon_deadlybody > 0 && mob.curHp > 0 && Math.random() < 0.23) {   // 致命身軀：23%
        let _rf = Math.max(1, Math.floor(dmgTaken * _fm));
        logCombat(`<span class="font-bold" style="color:#fca5a5;">【協力·${ally._allyName}·致命身軀】</span>反震 <span class="${getMobColor(mob.lv)}">${mob.n}</span> ${_rf} 點傷害。`, 'magic');
        _allyDamageMob(ally, mob, _rf, 'magic');
    }
    { let _titanSk = isMagic ? 'sk_warrior_titan_magic' : 'sk_warrior_titan_rock';   // 泰坦：岩石(物理)/魔法(魔法)·HP<40%(反彈精通80%)·100%
      if (ally.skills && ally.skills.includes(_titanSk) && mob.curHp > 0 && (ally.curHp || 0) < (ally.mhp || 1) * ((ally.cls === 'warrior' && allyHasMastery(ally, 'k_rebound')) ? 0.8 : 0.4)) {
        let _tr = Math.max(1, Math.floor(dmgTaken * _fm));
        logCombat(`<span class="font-bold" style="color:#d6d3d1;">【協力·${ally._allyName}·泰坦】</span>反彈 <span class="${getMobColor(mob.lv)}">${mob.n}</span> ${_tr} 點傷害。`, 'magic');
        _allyDamageMob(ally, mob, _tr, 'magic');
      } }
    if (isMagic && b.sk_elf_mirror > 0 && mob.curHp > 0 && Math.random() * 100 < ((ally.d && ally.d.wis) || 0)) {   // 鏡反射：等量·不乘脆弱·機率=wis%
        let _mrr = Math.max(1, Math.floor(dmgTaken));
        logCombat(`<span class="font-bold" style="color:#a5f3fc;">【協力·${ally._allyName}·鏡反射】</span>將 ${_mrr} 點魔法傷害反射回 <span class="${getMobColor(mob.lv)}">${mob.n}</span>。`, 'magic');
        _allyDamageMob(ally, mob, _mrr, 'magic');
    }
}
function allyIronGuardSweep(ally, triggerName) {
    if (!ally || !ally._setIron5) return;
    let targets = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
    if (!targets.length) return;
    logCombat(`<span class="font-bold" style="color:#93c5fd;text-shadow:0 0 6px #3b82f6;">【協力·${ally._allyName}·鐵衛5/5】</span>${triggerName}引動鋼鐵之勢，橫掃全體敵人！`, 'player');
    targets.forEach(m => {
        if (!m || m.curHp <= 0 || m._dead) return;
        let r = allyStrikeRoll(ally, m, {});
        if (!r.hit) { logCombat(`橫掃 <span class="${getMobColor(m.lv)}">${m.n}</span> 未命中。`, 'miss'); return; }
        logCombat(`橫掃命中 <span class="${getMobColor(m.lv)}">${m.n}</span>，造成 ${r.dmg} 點傷害。`, 'player');
        _allyDamageMob(ally, m, r.dmg, getWpnEle(ally.eq.wpn, DB.items[ally.eq.wpn.id]));
    });
}
// 🔮 v2.6.7：傭兵「回合外」攻擊（反擊/居合·於怪物回合觸發·不在 alliesTick 注入窗內）也套隊長幻覺攻擊光環。
//   allyStrikeRoll 為純計算（升級重算在其後的 _allyDamageMob 才發生），故在其呼叫前後即時注入/還原即可·無需 nonce 守衛。
function _allyStrikeWithIllu(ally, mob, opts) {
    let a = teamIlluAura(ally);   // 🌟 v3.0.99 排除本傭兵自身(其自身幻覺攻擊光環已在 ally.d)·只注入其他隊員提供的
    if (!a) return allyStrikeRoll(ally, mob, opts);
    let b = { ed: ally.d.extraDmg || 0, eh: ally.d.extraHit || 0, md: ally.d.magicDmg || 0 };
    ally.d.extraDmg = b.ed + a.ed; ally.d.extraHit = b.eh + a.eh; ally.d.magicDmg = b.md + a.md;
    try { return allyStrikeRoll(ally, mob, opts); }
    finally { ally.d.extraDmg = b.ed; ally.d.extraHit = b.eh; ally.d.magicDmg = b.md; }
}
function allyReactCounter(mob, blocked) {
    if (!player.allies || !player.allies.length) return;
    player.allies.forEach(ally => {
        if (!ally || !ally.eq || !ally.eq.wpn) return;
        if (ally.classicMode) return;   // 🎮 經典模式：傭兵停用反擊
        if (!mob || mob._dead || mob.curHp <= 0) return;   // 攻擊者已被前一位傭兵反殺則停止
        if (!(getWeaponTags(ally.eq.wpn.id).includes('單手劍') || (ally.buffs && ally.buffs.sk_counter_barrier > 0 && DB.items[ally.eq.wpn.id] && DB.items[ally.eq.wpn.id].w2h))) return;   // 🛡️ v2.6.22 反擊屏障：雙手武器亦可發動反擊（鏡像玩家 js/04:796）
        if (getWeaponTags(ally.eq.wpn.id).includes('武士刀') && !(ally.eq.shield && !_isArmguard(ally.eq.shield))) return;   // 🛡️ 反擊/居合雙標籤武器「無真盾牌(空手或臂甲)」時→走居合、不發動反擊（唯獨裝真盾牌才反擊）
        let _ctr = allyHasMastery(ally, 'k_counter');   // 🔧 傭兵反擊精通：必定發動、傷害+30%
        if (!_ctr && Math.random() >= (blocked ? 1 : 0.50)) return;
        let res = _allyStrikeWithIllu(ally, mob, { forceHit: true, noHeavy: true, mult: _ctr ? 0.65 : 0.50, forceCrit: _ctr });   // 🔮 v2.6.7：反擊也吃幻覺全隊光環
        if (ally.buffs && ally.buffs.sk_counter_barrier > 0 && getWeaponTags(ally.eq.wpn.id).includes('單手劍')) res.dmg = Math.max(1, Math.floor(res.dmg * 2));   // 🛡️ v2.6.22 反擊屏障：原生反擊(單手劍)武器最終傷害×2（鏡像玩家 js/03:1059）
        if (ally.buffs && ally.buffs.sk_counter_barrier > 0 && DB.items[ally.eq.wpn.id] && DB.items[ally.eq.wpn.id].counterBarrierX2) res.dmg = Math.max(1, Math.floor(res.dmg * 2));   // 🏺 資深殘兵的重型劍：反擊屏障觸發的反擊傷害×2（傭兵鏡像玩家 js/03）
        logCombat(`<span class="font-bold" style="color:#fbbf24;text-shadow:0 0 6px #f59e0b;">【協力·${ally._allyName}·反擊】</span>對 <span class="${getMobColor(mob.lv)}">${mob.n}</span> 造成 ${res.dmg} 點傷害${res.crit?'（爆擊!）':''}。`, 'player');
        if (_ctr) wearHardSkin(mob, null, false, false, true);   // 🏅 傭兵反擊精通：反擊命中削減 1 硬皮值
        _allyDamageMob(ally, mob, res.dmg, getWpnEle(ally.eq.wpn, DB.items[ally.eq.wpn.id]));
        allyIronGuardSweep(ally, '反擊');   // 🔮 鐵衛 5/5（傭兵）
    });
}
// 居合：傭兵持武士刀且未裝「真盾牌」（臂甲可發動） → 玩家迴避或敵人未命中時 50%；必中、可自然重擊/爆擊
function allyReactIai(mob) {
    if (!player.allies || !player.allies.length) return;
    player.allies.forEach(ally => {
        if (!ally || !ally.eq || !ally.eq.wpn || (ally.eq.shield && !_isArmguard(ally.eq.shield))) return;
        if (ally.classicMode) return;   // 🎮 經典模式：傭兵停用居合
        if (!mob || mob._dead || mob.curHp <= 0) return;
        if (!getWeaponTags(ally.eq.wpn.id).includes('武士刀')) return;
        let _iai = allyHasMastery(ally, 'k_counter');   // 🔧 傭兵反擊精通：居合必定發動、傷害+30%
        if (!_iai && Math.random() >= 0.50) return;
        let res = _allyStrikeWithIllu(ally, mob, { forceHit: true, forceCrit: _iai });   // 🔮 v2.6.7：居合也吃幻覺全隊光環
        if (_iai) res.dmg = Math.max(1, Math.floor(res.dmg * 1.3));
        if (ally.buffs && ally.buffs.sk_counter_barrier > 0 && getWeaponTags(ally.eq.wpn.id).includes('武士刀')) res.dmg = Math.max(1, Math.floor(res.dmg * 2));   // 🛡️ v2.6.22 反擊屏障：原生居合(武士刀)武器最終傷害×2（鏡像玩家 js/03:1079）
        let mark = (res.heavy && res.crit) ? '會心一擊' : (res.crit ? '爆擊' : (res.heavy ? '重擊' : ''));
        logCombat(`<span class="font-bold" style="color:#a5f3fc;text-shadow:0 0 6px #06b6d4;">【協力·${ally._allyName}·居合】</span>對 <span class="${getMobColor(mob.lv)}">${mob.n}</span> 造成 ${res.dmg} 點傷害${mark?'（'+mark+'!）':''}。`, 'player');
        wearHardSkin(mob, null, res.heavy, false, _iai);   // 🔧 傭兵居合重擊 -2；🏅 反擊精通：居合命中再削減 1 硬皮值（疊加）
        _allyDamageMob(ally, mob, res.dmg, getWpnEle(ally.eq.wpn, DB.items[ally.eq.wpn.id]));
        allyIronGuardSweep(ally, '居合');   // 🔮 鐵衛 5/5（傭兵）
    });
}

// 妖精協力：三重矢（3 次物理攻擊）後整體判定一次連射
let _allyInTriple = false;   // 🏺 遺忘者的狙擊弓：三重矢期間旗標（allyAttackOnce 讀取以區分 fullHpMult×3／fullHpMultTriple×2）
let _allyTripleFhmUsed = false;   // 🏺 v3.1.30 三重矢滿血×2 每次施放只吃一箭（審查修：第1箭擊殺滿血怪→重選目標又是滿血→原本第2箭再吃×2·玩家鎖定單一目標天然只有一箭）
function allyTripleShot(ally) {
    logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>施放 三重矢！`, 'player');
    _allyInTriple = true;
    _allyTripleFhmUsed = false;
    try {
        for (let h = 0; h < 3; h++) {
            let t = getTarget(); if (!t || t.curHp <= 0) break;
            allyAttackOnce(ally, h * 90);   // 🏹 v3.2.14 三箭錯開 90ms（原三支同時發射疊成一支）
        }
    } finally { _allyInTriple = false; }
    allyRapidfire(ally);
}
// 妖精協力一次行動：選定三重矢且裝弓且 MP 足夠→優先施放三重矢；否則一般攻擊；攻擊後判定連射
function allyElfAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) return;
    let d = ally.d || {};
    let sk = DB.skills[ally._atkSkill];
    if (ally._atkSkill === 'sk_elf_triple' && sk) {
        // 三重矢優先：裝弓且 MP 足夠
        let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
        let hasBow = !!(wpn && wpn.isBow);
        let cost = Math.max(1, Math.ceil((sk.mp||0) * (1 - (d.mpReduce||0)/100)));
        if (ally._setApprentice5 && (ally.mp||0) < (ally.mmp||0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
        if (hasBow && (ally.mp||0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyTripleShot(ally); return; }
    } else if (sk && sk.type === 'atk' && sk.dmgType !== 'physical' && (sk.dmgDice || sk.multiDmg)) {
        // 傷害魔法：比照法師，MP 足夠則優先施放（妖精魔法不享有法師倍率，由 allyCastMagic 依職業處理）
        let cost = Math.max(1, Math.ceil((sk.mp||0) * (1 - (d.mpReduce||0)/100)));
        if (ally._setApprentice5 && (ally.mp||0) < (ally.mmp||0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半（與魔導精通疊加）
        if (allyHasMastery(ally, 'e_magic') && sk.ele && sk.ele !== 'none' && sk.ele === ally.elfEle) cost = Math.max(1, Math.ceil(cost * 0.5));   // 🏅 魔導精通（傭兵）：同屬性魔法消耗MP -50%(2026-07 30%→50%)
        if ((ally.mp||0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyCastMagic(ally, sk); return; }
    } else if (sk && sk.type === 'atk' && (sk.status || sk.instakill)) {
        if (allyCastNonDamage(ally, sk)) return;   // 🔧 非傷害攻擊技能（地面障礙/魔法消除/封印禁地/釋放元素…）；不適用則退回物理攻擊+連射
    }
    // 退回一般物理攻擊 + 連射（三重矢/魔法 MP 不足、或未選攻擊技能時）
    allyAttackOnce(ally);
    allyRapidfire(ally);
}
// 黑暗妖精協力一次行動：依設定攻擊技能施放破壞盔甲(目標無此狀態且MP足夠)/會心一擊(MP滿)/傷害魔法(v2.7.92·Lv12/24 可學一二階·走 allyCastMagic)/非傷害狀態技；皆不適用則一般攻擊（含連擊與精通）
function allyDarkAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) return;
    if (ally._atkSkill === 'sk_dark_armorbreak') {
        let sk = DB.skills['sk_dark_armorbreak']; let d = ally.d || {};
        let cost = Math.max(1, Math.ceil(((sk && sk.mp) || 0) * (1 - (d.mpReduce || 0) / 100)));
        if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
        if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
        if (sk && sk.status && !(t.st && t.st[sk.status.kind] > 0) && (ally.mp || 0) >= cost) {
            ally.mp -= cost; allyManaMasteryRefund(ally, cost);
            logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}，撕裂 <span class="${getMobColor(t.lv)}">${t.n}</span> 的防護！（受傷提高，持續 ${sk.status.dur||8} 秒）`, 'magic');
            let _sv = player; player = ally; try { applyMobStatus(t, sk.status, sk.n); } finally { player = _sv; }   // 以傭兵自身魔法命中判定
            return;
        }
    } else if (ally._atkSkill === 'sk_dark_crit') {
        // 🔧 會心一擊（傭兵版）：只有 MP 滿才施放，且只消耗 MP（不扣 HP）
        if ((ally.mmp || 0) > 0 && (ally.mp || 0) >= (ally.mmp || 0)) { allyDarkCrit(ally, t); return; }
    } else {
        let _sk = DB.skills[ally._atkSkill]; let d = ally.d || {};
        if (_sk && _sk.type === 'atk' && _sk.dmgType !== 'physical' && (_sk.dmgDice || _sk.multiDmg)) {
            // 🖤 v2.7.92 傷害魔法（光箭/冰箭/風刃/火箭/地獄之牙·黑妖 Lv12/24 可學）：比照騎士，MP 足夠優先施放（無法師倍率，由 allyCastMagic 依職業處理）。修稽核C類：原本只認 status/instakill→純傷害魔法默默退普攻
            let cost = Math.max(1, Math.ceil((_sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
            if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
            if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
            if ((ally.mp || 0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyCastMagic(ally, _sk); return; }
        } else if (_sk && _sk.type === 'atk' && (_sk.status || _sk.instakill) && allyCastNonDamage(ally, _sk)) return;   // 🔧 其他非傷害攻擊技能（純異常狀態/即死）：通用施放；不適用則退回一般攻擊
    }
    allyAttackOnce(ally);
    allyRapidfire(ally);   // 🏹 v3.1.77 稽核中#4：連射（黑妖傭兵持幽暗/黑暗/暗黑十字弓等·非弓 no-op）
}
// 騎士協力一次行動：依設定攻擊技能施放——物理技(衝擊之暈)、傷害魔法(光箭/冰箭/風刃)、或非傷害狀態/即死技；皆不適用(無目標/武器不符/MP不足)則退回一般攻擊(含看破/殺戮被動)
function allyKnightAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) { allyAttackOnce(ally); allyRapidfire(ally); return; }   // 🏹 v3.1.77 稽核中#4：普攻後判定連射（allyRapidfire 自帶 isBow+rapidfire 武器閘·非弓=no-op·原僅妖精路徑觸發）
    let sk = DB.skills[ally._atkSkill];
    let d = ally.d || {};
    if (sk && sk.type === 'atk') {
        if (sk.dmgType === 'physical') {
            if (allyCastPhysicalSkill(ally, sk)) return;                                   // 衝擊之暈等物理技
        } else if (sk.dmgDice || sk.multiDmg) {
            let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));   // 騎士可學的傷害魔法（光箭/冰箭/風刃；無法師倍率，由 allyCastMagic 依職業處理）
            if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
            if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
            if ((ally.mp || 0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyCastMagic(ally, sk); return; }
        } else if (sk.status || sk.instakill) {
            if (allyCastNonDamage(ally, sk)) return;                                       // 非傷害狀態/即死技（騎士目前學不到，保留通用分支）
        }
    }
    allyAttackOnce(ally);
    allyRapidfire(ally);   // 🏹 v3.1.77 稽核中#4：連射（騎士傭兵持十字弓 50% 等·非弓 no-op）
}
// ⚔️ 戰士協力一次行動：依設定攻擊技能施放——咆哮（roarFixed・對全體造成 50+(等級-30) 固定無屬性傷害，不計 MR/DR/元素）；無此技／MP不足／無敵人則退回一般攻擊（含迅猛雙斧/狂暴等普攻特效）
function allyWarriorAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) { allyAttackOnce(ally); allyRapidfire(ally); return; }   // 🏹 v3.1.77 稽核中#4：普攻後判定連射（allyRapidfire 自帶 isBow+rapidfire 武器閘·非弓=no-op·原僅妖精路徑觸發）
    let sk = DB.skills[ally._atkSkill];
    let d = ally.d || {};
    if (sk && sk.type === 'atk' && sk.roarFixed) {                                          // ⚔️ 咆哮：全體固定傷害（戰士唯一主動攻擊技）
        let targets = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
        if (targets.length) {
            let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
            if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
            if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
            if ((ally.mp || 0) >= cost) {
                ally.mp -= cost; allyManaMasteryRefund(ally, cost);
                let base = 50 + Math.max(0, (ally.lv || 1) - 30);
                targets.forEach(m => { if (!m || m.curHp <= 0 || m._dead) return; let dmg = Math.max(1, Math.floor(base * fragileMult(m))); dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   /* 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100) */ m.curHp -= dmg; m.justHit = 'magic'; mobWake(m); if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(m, dmg, 'magic', ally); });   // 🌑 v3.4.14 血壁空間：傭兵咆哮＝魔法反射（鏡像玩家 js/07:509）
                logCombat(`<span class="font-bold" style="color:#fca5a5;text-shadow:0 0 6px #dc2626;">【協力·${ally._allyName}·咆哮】</span>咆哮震懾全場，對所有敵人造成約 ${base} 點固定傷害。`, 'player-special');   // _combatSrc='mercenary' 期間→自動歸傭兵來源
                targets.forEach(m => { if (m && m.curHp <= 0 && !m._dead) { let i = mapState.mobs.findIndex(x => x && x.uid === m.uid); if (i !== -1) killMob(i); } });
                renderMobs();
                return;
            }
        }
    } else if (sk && sk.type === 'atk' && sk.dmgType !== 'physical' && (sk.dmgDice || sk.multiDmg)) {
        // ⚔️ v2.7.92 傷害魔法（光箭/冰箭/風刃·戰士 Lv15 可學）：比照騎士，MP 足夠優先施放（無法師倍率，由 allyCastMagic 依職業處理）。修稽核C類：原本只認 roarFixed→三箭默默退普攻
        let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
        if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
        if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
        if ((ally.mp || 0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyCastMagic(ally, sk); return; }
    } else if (sk && sk.type === 'atk' && (sk.status || sk.instakill)) {
        if (allyCastNonDamage(ally, sk)) return;   // 非傷害狀態/即死技（通用分支·比照騎士）
    }
    allyAttackOnce(ally);
    allyRapidfire(ally);   // 🏹 v3.1.77 稽核中#4：連射（戰士傭兵持遺物連射弓·非弓 no-op）
}
// 👑 v2.7.94 王族魔法精通（傭兵）：一般攻擊命中 10% 免MP額外施放「選定的攻擊魔法」（鏡像玩家 royalMagicFreeCast·js/04:211/js/07:248）。
//    只放魔法類（傷害 dmgDice/multiDmg→allyCastMagic 本就不扣MP＝免費；狀態/即死→allyCastNonDamage 由 _allyRoyalFreeCast 旗標令 cost=0）；呼喚盟友(callAllies)/物理技不走此免費加放。
let _allyRoyalFreeCast = false;
function allyRoyalFreeCast(ally) {
    let sk = DB.skills[ally && ally._atkSkill];
    if (!sk || sk.type !== 'atk') return;
    _allyRoyalFreeCast = true;
    try {
        if (sk.dmgType !== 'physical' && (sk.dmgDice || sk.multiDmg)) allyCastMagic(ally, sk);   // 傷害魔法（allyCastMagic 不扣 MP＝免費）
        else if (sk.status || sk.instakill) allyCastNonDamage(ally, sk);                          // 狀態/即死（_allyRoyalFreeCast→cost=0）
    } finally { _allyRoyalFreeCast = false; }
}
// 👑 王族協力一次行動：依設定攻擊技能施放——呼喚盟友（callAllies・所有上場傭兵立即各發動一次額外一般攻擊）、傷害魔法（v2.7.92·王族 Lv10/20 可學一二階＋魔法精通三~五階·比照騎士走 allyCastMagic）、非傷害狀態/即死技（allyCastNonDamage）；皆不適用則退回一般攻擊（王者加護被動由 recomputeStats 已套）
function allyRoyalAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) { allyAttackOnce(ally); allyRapidfire(ally); return; }   // 🏹 v3.1.77 稽核中#4：普攻後判定連射（allyRapidfire 自帶 isBow+rapidfire 武器閘·非弓=no-op·原僅妖精路徑觸發）
    let sk = DB.skills[ally._atkSkill];
    let d = ally.d || {};
    if (sk && sk.type === 'atk' && sk.callAllies) {                                          // 👑 呼喚盟友：號召所有傭兵各補一刀
        let allies = (player.allies || []).filter(a => a && a.curHp > 0);
        let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
        if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
        if (allyHasMastery(ally, 'k_royal_pledge')) cost = Math.ceil(cost / 2);              // 🏅 血盟精通（傭兵）：呼喚盟友消耗 MP 減半
        if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
        if (allies.length && (ally.mp || 0) >= cost) {
            ally.mp -= cost; allyManaMasteryRefund(ally, cost);
            logCombat(`<span class="text-amber-300 font-bold">【協力·${ally._allyName}·呼喚盟友】</span>號召盟友一同出擊！`, 'player-special');   // _combatSrc='mercenary' 期間→自動歸傭兵來源
            allies.forEach(a => { try { allyAttackOnce(a); } catch(e){} });                 // 含自己在內各補一次普攻；allyAttackOnce 為純普攻不會再觸發技能→無遞迴
            return;
        }
    } else if (sk && sk.type === 'atk' && sk.dmgType !== 'physical' && (sk.dmgDice || sk.multiDmg)) {
        // 👑 v2.7.92 傷害魔法（一二階＋魔法精通三~五階：光箭~冰錐/極道落雷/燃燒的火球…）：比照騎士，MP 足夠優先施放（無法師倍率，由 allyCastMagic 依職業處理）。修稽核C類：原本只認 callAllies→17 個可學法師魔法全默默退普攻
        let cost = Math.max(1, Math.ceil((sk.mp || 0) * (1 - (d.mpReduce || 0) / 100)));
        if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
        if (ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
        if ((ally.mp || 0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyCastMagic(ally, sk); return; }
    } else if (sk && sk.type === 'atk' && (sk.status || sk.instakill)) {
        if (allyCastNonDamage(ally, sk)) return;   // 👑 v2.7.92 非傷害狀態/即死技（毒咒/闇盲咒術/壞物術/緩速術/木乃伊的詛咒/黑闇之影/起死回生術…）：通用施放；不適用則退回一般攻擊
    }
    allyAttackOnce(ally);
    allyRapidfire(ally);   // 🏹 v3.1.77 稽核中#4：連射（王族傭兵持彈簧弓/巨蟻觸角等遺物連射弓·非弓 no-op）
}
// 🐉 龍騎士協力一次行動：依設定攻擊技能施放——傷害魔法(岩漿噴吐/岩漿之箭/奪命之雷)、屠宰者(物理多段)、控制(護衛毀滅/恐懼無助/驚悚死神)；皆不適用則退回一般攻擊(含鎖鏈劍特效/弱點曝光/吸血)
// ⚠️ 傭兵不付技能 HP 消耗：傭兵無 HP 再生且不被攻擊(ally.hp 僅吸血會增)，若扣 HP 則龍騎士 mp:0 的技能只能放數次後永久停擺；故僅付 MP（MP 有再生），效果等同玩家被再生支撐的連續施放。
function allyDragonAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) { allyAttackOnce(ally); allyRapidfire(ally); return; }   // 🏹 v3.1.77 稽核中#4：普攻後判定連射（allyRapidfire 自帶 isBow+rapidfire 武器閘·非弓=no-op·原僅妖精路徑觸發）
    let sk = DB.skills[ally._atkSkill];
    if (sk && sk.type === 'atk') {
        // 🐉 龍騎士傭兵改吃 HP（資源＝HP，顯示也以 HP 為準）：HP 不足以負擔技能消耗 → 退回普攻；施放成功才扣 HP，且絕不會把傭兵打死（下限 1，傭兵不陣亡）。其餘 ally 子函式對 sk.mp=0 只扣 0 MP，故不重複扣。
        let _hpCost = sk.hpCost || 0;
        // 🛡️ 停耗HP技門檻（隊伍面板·v2.6.4 獨立設定·回退舊 _hpSafePct）：HP% 低於此→暫停施放「消耗 HP 的技能」(退回普攻·不再自殘)；=0＝關閉
        let _safe = allyHpSkillPct(ally);
        let _aboveSafe = (_safe <= 0) || ((ally.curHp || 0) > (ally.mhp || 1) * _safe / 100);
        if (_aboveSafe && (ally.curHp || 0) > _hpCost) {
            let _cast = false;
            if (sk.dmgDice || sk.multiDmg) { allyCastMagic(ally, sk); _cast = true; }   // 岩漿噴吐/岩漿之箭/奪命之雷（傷害魔法；奪命之雷的暈由 allyCastMagic 套狀態）
            else if (sk.slaughter) { _cast = allyCastSlaughter(ally, sk); }              // 屠宰者
            else if (sk.fixedStatus) { _cast = allyCastFixedStatus(ally, sk); }          // 護衛毀滅/恐懼無助/驚悚死神
            else if (sk.dmgType === 'physical') { _cast = allyCastPhysicalSkill(ally, sk); }
            else if (sk.status || sk.instakill) { _cast = allyCastNonDamage(ally, sk); }
            if (_cast) { ally.curHp = Math.max(1, (ally.curHp || 0) - _hpCost); if (ally._setDragonblood3 && _hpCost > 0) { if (!ally.buffs) ally.buffs = {}; ally.buffs.sk_set_dragonscion = 100; }   /* 🐉 v2.6.12 #5a 龍血3/5（傭兵）：施放HP消耗技→獲得「龍裔」10秒（受傷-15%·由 allyBuffDmgReduceMult 讀取） */ return; }
        }
    }
    allyAttackOnce(ally);
    allyRapidfire(ally);   // 🏹 v3.1.77 稽核中#4：連射（龍騎士傭兵持遺物連射弓·非弓 no-op）
}
// 🔮 幻術士協力一次行動：依設定攻擊技能施放——心靈破壞(消耗MP=傷害)、粉碎能量/骷髏毀壞(物理)、混亂/幻想(傷害魔法+附帶混亂/沉睡)、恐慌(純狀態)；皆不適用則退回奇古獸/一般攻擊
function allyIllusionAct(ally) {
    let t = getTarget(); if (!t || t.curHp <= 0) { allyAttackOnce(ally); allyRapidfire(ally); return; }   // 🏹 v3.1.77 稽核中#4：普攻後判定連射（allyRapidfire 自帶 isBow+rapidfire 武器閘·非弓=no-op·原僅妖精路徑觸發）
    let sk = DB.skills[ally._atkSkill]; let d = ally.d || {};
    if (sk && sk.type === 'atk') {
        if (sk.tagReq && !mobHasTag(t, sk.tagReq)) { allyAttackOnce(ally); return; }   // 骷髏毀壞：只對不死，否則退回奇古獸普攻（與玩家 9196 一致）
        if (sk.mpDmgPct) {                                          // 心靈破壞
            if (allyCastMpDmg(ally, sk)) return;
        } else if (sk.magScale) {                                   // 粉碎能量：武器傷害＋近/遠傷害＋強化值，整體乘魔法傷害加成
            if (allyCastCrush(ally, sk)) return;
        } else if (sk.weaponDmg || sk.dmgType === 'physical') {     // 骷髏毀壞（物理武器傷害）
            if (allyCastPhysicalSkill(ally, sk)) return;
        } else if (sk.dmgDice || sk.multiDmg) {                     // 混亂/幻想（傷害魔法 + 附帶 混亂/沉睡，由 allyCastMagic 套狀態）
            let cost = (sk.mp || 0) > 0 ? Math.max(1, Math.ceil(sk.mp * (1 - (d.mpReduce || 0) / 100))) : 0;
            if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
            if (cost > 0 && ally._setApprentice5 && (ally.mp || 0) < (ally.mmp || 0) * 0.3) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 學徒 5/5（傭兵）：MP<30% 耗魔減半
            if ((ally.mp || 0) >= cost) { ally.mp -= cost; allyManaMasteryRefund(ally, cost); allyCastMagic(ally, sk); return; }
        } else if (sk.status || sk.instakill) {                     // 恐慌（純狀態）
            if (allyCastNonDamage(ally, sk)) return;
        }
    }
    allyAttackOnce(ally);
    allyRapidfire(ally);   // 🏹 v3.1.77 稽核中#4：連射（幻術士傭兵持遺物連射弓·非弓/奇古獸 no-op）
}
// 🔮 幻術士傭兵 立方（常駐光環）：已學會的立方即視為常駐展開（傭兵無手動開關），每 cube.iv ticks 觸發一次。效果同玩家 cubeTick（dmg=全體傷害/slow=全體緩速/mrdown=目標魔抗減半/mp=自身回MP），但改用傭兵自身等級/MP；
//   狀態命中換身用傭兵衍生值（abnormalMagicHit 讀 player.*），傷害換算 summonElementDamage 為純函式（不需換身），擊殺仍由 killMob 歸玩家（經驗/金錢）。安全區(村莊)不展開。
// 🔮 v3.1.78 魔力精通（傭兵）：傭兵消耗 MP 時，隊友（玩家＋其他傭兵）恢復消耗量 10% 的 MP（鏡像玩家 manaMasteryRefund js/03:1398·排除施法者自身·非 i_mana 傭兵 no-op·所有 ally.mp -= 消費點統一掛）
// 🏺 v3.1.80 巫師的黑暗魔導書（傭兵攻擊技 inline cost 路徑）：滿血時技能消耗 MP 減半（buff 維持等走 ally.d.getMpCost 已於 js/02 內建·此 helper 只補 14 個 inline 攻擊技站點）
function _allyWpnFullHpMpHalf(ally, cost) {
    let w = (ally && ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
    if (w && w.fullHpMpHalf && (ally.curHp || 0) >= (ally.mhp || 1)) return Math.max(1, Math.ceil(cost / 2));
    return cost;
}
function allyManaMasteryRefund(ally, spent) {
    if (!spent || spent <= 0 || !allyHasMastery(ally, 'i_mana')) return;
    let give = Math.max(1, Math.floor(spent * 0.10));
    if (player && (player.mmp || 0) > 0 && !player.dead) player.mp = Math.min(player.mmp, (player.mp || 0) + give);
    (player.allies || []).forEach(a => { if (a && a !== ally && !a._downed && (a.mmp || 0) > 0) a.mp = Math.min(a.mmp, (a.mp || 0) + give); });
}
// 🔮 幻覺套裝（傭兵）魔傷掛鉤：與玩家完全相同；立方、冰雪颶風/火牢、魔爆、spellProc、procSkill 等免費觸發魔法有效，一般傷害法術、共鳴與反射無效。
function _allyIllusionMagicDmg(ally, dmg, recoverMp) {
    if (!ally || dmg <= 0) return dmg;
    if (ally._setIllusion2 && recoverMp !== false) { let r = Math.floor((ally.lv || 1) / 10); if (r > 0) ally.mp = Math.min(ally.mmp || 0, (ally.mp || 0) + r); }
    if (ally._setIllusion5) dmg = dmg * 2;
    return dmg;
}
function allyCubeTick(ally) {
    if (!ally || ally.dead || !state.running || ally.cls !== 'illusion' || !ally.skills) return;
    if (mapState.current && mapState.current.startsWith('town_')) return;   // 🔮 安全區(村莊)不展開（同玩家 cubeTick gate）
    ally._cubeCd = ally._cubeCd || {};
    ally.skills.forEach(sid => {
        let sk = DB.skills[sid];
        if (!sk || !sk.cube) return;   // 🔮 立方＝常駐光環
        if (sid !== 'sk_illu_cube_harmony' && !_mercAutoOn(ally, sid)) return;   // 🔮 v2.7.96 燃燒/地裂/衝擊立方吃「來源有勾自動施放」閘（比照玩家 autoActions js/07:806·免 MP 但沒開→不展開；和諧另由轉換技能欄控制）
        if (sid === 'sk_illu_cube_harmony') {   // 🔮 v2.6.4：立方和諧改由「轉換技能」欄位選取才展開＋受「停耗HP技」門檻影響（有 hpCost）
            if (ally._convertSkill !== 'sk_illu_cube_harmony') return;   // 未在轉換技能欄選取→不展開
            let _hs = allyHpSkillPct(ally); if (_hs > 0 && (ally.curHp || 0) <= (ally.mhp || 1) * _hs / 100) return;   // HP 低於停耗HP技門檻→暫停
        }
        if ((ally._cubeCd[sid] = (ally._cubeCd[sid] || sk.cube.iv) - 1) > 0) return;
        ally._cubeCd[sid] = sk.cube.iv;
        let c = sk.cube;
        if (c.kind === 'mp') { ally.mp = Math.min(ally.mmp || 0, (ally.mp || 0) + (c.val || 5)); return; }   // 純回MP立方（保留·目前無技能使用）
        if (c.kind === 'dmgmp') {   // 🔮 立方：和諧（傭兵）→ 對「當前目標」單體屬性傷害 ＋ 回全隊MP
            teamRecoverMp(c.val || 5);   // 🔮 v2.6.4：回全隊 MP（玩家＋全體非倒地傭兵）
            let t = getTarget();
            if (t && t.curHp > 0 && !t._dead) {
                let dd = Math.max(1, Math.floor(summonElementDamage(c.dice, c.ele || 'none', t, ally.d.magicDmg || 0, magicDamageCoef(ally.d, magicAttrDefense(t, c.ele || 'none'), sk.tier)) * illuLvMult(ally) * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔮 傭兵立方：SP／屬性防禦公式 ×(1+專屬法術階級/10)
                dd = Math.max(1, Math.floor(dd * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
                dd = _allyIllusionMagicDmg(ally, dd);   // 🔮 v3.1.77 幻覺2/5回MP＋5/5加倍（傭兵立方·鏡像玩家 js/07:98）
                t.curHp -= dd; t.justHit = (c.ele && c.ele !== 'none') ? c.ele : 'magic'; mobWake(t);
                logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>的【${sk.n}】對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dd} 點傷害。`, 'dot', 'mercenary');   // 🟢 立方傷害＝DoT(綠)、傭兵來源
                if (t.curHp <= 0) { let i = mapState.mobs.findIndex(x => x && x.uid === t.uid); if (i !== -1) killMob(i); }   // 擊殺歸玩家（killMob 不換身）
                renderMobs();
            }
            return;
        }
        let live = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
        if (!live.length) return;
        if (c.kind === 'dmg') {
            let txt = [];
            live.forEach((m, i) => { let dd = Math.max(1, Math.floor(summonElementDamage(c.dice, c.ele || 'none', m, ally.d.magicDmg || 0, magicDamageCoef(ally.d, magicAttrDefense(m, c.ele || 'none'), sk.tier)) * illuLvMult(ally) * wpnEnFinalMult(ally.eq && ally.eq.wpn))); dd = Math.max(1, Math.floor(dd * royalAllyMult()));   /* 👑 王族魅力加成 */ dd = _allyIllusionMagicDmg(ally, dd, i === 0); m.curHp -= dd; m.justHit = (c.ele && c.ele !== 'none') ? c.ele : 'magic'; mobWake(m); txt.push(dd); });   // 🔮 全體立方每次發動只回一次MP，5件仍逐目標生效
            logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>的【${sk.n}】對全體造成 ${txt.join('、')} 點傷害。`, 'dot', 'mercenary');   // 🟢 立方傷害＝DoT(綠)、傭兵來源
            live.forEach(m => { if (m.curHp <= 0) { let i = mapState.mobs.findIndex(x => x && x.uid === m.uid); if (i !== -1) killMob(i); } });   // 擊殺歸玩家（killMob 不換身）
            renderMobs();
        } else {   // slow / mrdown：狀態命中換身用傭兵 lv/magicHit（abnormalMagicHit 讀 player.*）
            let _sv = player; player = ally;
            try {
                if (c.kind === 'slow') live.forEach(m => applyMobStatus(m, { kind: 'slow', pbase: 150, dur: 4 }, sk.n));
                else if (c.kind === 'mrdown') { let t = getTarget(); if (t && t.curHp > 0) applyMobStatus(t, { kind: 'mrhalf', pbase: 200, dur: c.dur || 4 }, sk.n); }
            } finally { player = _sv; }
        }
    });
}
// 🌨️🔥 傭兵 持續傷害型增益（冰雪颶風/火牢）：已學會即視為常駐展開（傭兵無手動開關），每 stormInterval ticks 對全體造成該屬性魔法傷害。
//   公式鏡像玩家 stormBuffTick（js/04），改用傭兵自身 magicDmg/cls/magicCrit/武器最終倍率；冰凍命中換身用傭兵 lv/magicHit；擊殺仍歸玩家（killMob 不換身）。
function allyStormTick(ally, sk, noMageBonus) {
    if (!ally || ally.dead || !sk || !state.running) return;
    let targets = mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead);
    if (!targets.length) return;
    let d = ally.d || {};
    let mageDmgMult = 1.0;
    let dice = sk.dmgDice || [1, 10];
    let canFreeze = (sk.freezeHitOff !== undefined);
    let glow = STORM_ELE_GLOW[sk.ele] || STORM_ELE_GLOW.none;
    let wpnMult = wpnEnFinalMult(ally.eq && ally.eq.wpn);   // 🔧 武器強化 +11~+20 最終倍率
    let dmgLog = [], frozeLog = [];
    targets.forEach((t, _illusionIdx) => {
        if (t.curHp <= 0) return;
        let isCrit = Math.random() * 100 < (d.magicCrit || 0);
        let critMult = isCrit ? (1 + (d.magicCritDmg || 0) / 100) : 1.0;
        let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
        let mrFactor = mrMult(effMr);
        let baseRoll = sk.multiDmg ? sk.multiDmg.reduce((s, seg) => s + roll(seg[0], seg[1]), 0) : roll(dice[0], dice[1]);   // 🔧 支援多段 multiDmg(如冰雪暴 4×2D10)·單段 dmgDice(冰雪颶風)照舊
        let spCoef = magicDamageCoef(d, magicAttrDefense(t, sk.ele || 'none'), sk.tier);
        let core = magicBaseDamage(baseRoll, d, sk.dmgBase || 0, true) * spCoef * critMult;
        let dmg = Math.floor(core * mrFactor);
        dmg = Math.max(1, dmg);
        dmg = Math.floor(dmg * mageDmgMult);
        dmg = Math.max(1, Math.floor(dmg * allyRlFuryMult(ally)));   // 🔴😡 v2.6.18 紅獅5×狂怒5造傷（冰雪颶風tick·原僅紅獅字面）
        dmg = Math.max(1, Math.floor(dmg * fragileMult(t) * wpnMult));   // 🔮 脆弱（白鳥5）；🔧 武器最終倍率
        dmg = Math.max(1, Math.floor(dmg * elementCounterMult(sk.ele, t.e)));   // ⚔️ 屬性剋制倍率（取代舊 +6 固定加值）
        dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
        dmg = _allyIllusionMagicDmg(ally, dmg, _illusionIdx === 0);   // 🔮 每次持續法術跳傷只回一次MP，5件仍逐目標生效
        t.curHp -= dmg; t.justHit = (sk.ele && sk.ele !== 'none') ? sk.ele : 'magic'; mobWake(t);
        dmgLog.push(`<span class="${getMobColor(t.lv)}">${t.n}</span> ${dmg}${isCrit ? '(爆)' : ''}`);
        if (t.curHp <= 0) {
            let ri = mapState.mobs.findIndex(x => x && x.uid === t.uid); if (ri !== -1) killMob(ri);   // 擊殺歸玩家
        } else if (canFreeze && !(t.boss && BOSS_IMMUNE.includes('freeze'))) {
            let _sv = player; player = ally; let _hit = false;   // 冰凍命中換身用傭兵 lv/magicHit
            try { _hit = abnormalMagicHit(t, 20, sk.freezeHitOff); } finally { player = _sv; }
            if (_hit) { if (!t.st) t.st = newMobStatus(); t.st.freeze = 60; frozeLog.push(`<span class="${getMobColor(t.lv)}">${t.n}</span>`); }
        }
    });
    if (dmgLog.length) logCombat(`<span class="font-bold" style="color:${glow};">【協力·${ally._allyName}】${sk.n}</span> ${dmgLog.join('、')}`, 'dot', 'mercenary');
    if (frozeLog.length) logCombat(`<span class="text-sky-300 font-bold">${ally._allyName} 的 ${sk.n}</span> 冰凍了 ${frozeLog.join('、')}！`, 'magic', 'mercenary');
    if (!state.ff) renderMobs();
}
// 🔮 傭兵粉碎能量：基礎＝武器傷害(目標大小)＋近/遠距離傷害(依武器)＋強化值，套用統一魔法傷害與幻術士專屬階級倍率，不計武器特效；🔮 魔法技能→必定命中、不扣 DR/硬皮。回傳 true=已施放；false=MP不足→退回普攻
function allyCastCrush(ally, sk) {
    let t = getTarget(); if (!t || t.curHp <= 0) return false;
    let d = ally.d || {};
    let cost = (sk.mp || 0) > 0 ? Math.max(1, Math.ceil(sk.mp * (1 - (d.mpReduce || 0) / 100))) : 0;
    if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
    if ((ally.mp || 0) < cost) return false;
    ally.mp -= cost; allyManaMasteryRefund(ally, cost);
    // 🦴 骷髏毀壞（傭兵）：先即死判定（起死回生式·vs不死非BOSS·以傭兵魔法命中換身判定）；成功則擊殺、不造成傷害（粉碎能量無 instakill→跳過）
    if (sk.instakill) {
        let _sv = player; player = ally; let _ok = false;
        try { let _idx = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (_idx !== -1 && tryInstakill(t, sk.instakill, sk.n, _idx, true)) _ok = true; } finally { player = _sv; }
        if (_ok) { let _i = mapState.mobs.findIndex(m => m && m.uid === t.uid); if (_i !== -1) killMob(_i); renderMobs(); return true; }
    }
    let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
    let dice = wpn ? (t.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
    let enB = (wpn && ally.eq.wpn) ? enhanceWpnBonus(ally.eq.wpn.en).dmg : 0;   // 強化值加成
    let _rng = !!(wpn && (wpn.isBow || wpn.ranged));
    let _dmgB = _rng ? (d.rangedDmg || 0) : (d.meleeDmg || 0);
    let _base = roll(1, dice) + _dmgB + enB + (sk.weaponFlat || 0);
    let dmg = Math.max(1, Math.floor(magicBaseDamage(_base, d, 0, true) * magicDamageCoef(d, magicAttrDefense(t, getWpnEle(ally.eq ? ally.eq.wpn : null, wpn)), sk.tier))) + (sk.flatBonus || 0);   // 🔮 統一魔法公式 ×(1+幻術專屬階級/10)；骷髏毀壞另加固定20
    dmg = Math.max(1, Math.floor(dmg * fragileMult(t) * illuLvMult(ally) * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔮 幻術士(傭兵)等級加成 ×(1+等級/50)；🔧 武器強化 +11~+20 最終倍率
    dmg = Math.max(1, Math.floor(dmg * elementCounterMult(getWpnEle(ally.eq ? ally.eq.wpn : null, wpn), t.e)));   // ⚔️ 武器屬性剋制倍率（粉碎能量）
    dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
    t.curHp -= dmg; t.justHit = getWpnEle(ally.eq ? ally.eq.wpn : null, wpn); mobWake(t);
    if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, dmg, _rng ? 'ranged' : 'melee', ally);   // 🌑 v3.4.14 血壁空間：傭兵粉碎能量/骷髏毀壞＝技能直擊反射（鏡像玩家 js/07:572 weaponDmg）
    logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}，對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點傷害。`, 'magic');
    let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (ri !== -1) killMob(ri); } else renderMobs();
    return true;
}
// 🐉 傭兵控制系異常技（護衛毀滅/恐懼無助/驚悚死神）：固定機率施加自訂異常狀態（比照玩家 castSkillInner 9178；傭兵不付 HP，僅付 MP）。回傳 true=已施放；false=已有狀態/MP不足→退回普攻
function allyCastFixedStatus(ally, sk) {
    let t = getTarget(); if (!t || t.curHp <= 0) return false;
    let fs = sk.fixedStatus; if (!fs) return false;
    if (sk.noRecastStatus && t.st && t.st[sk.noRecastStatus] > 0) return false;   // 已有狀態：不重複（不耗 MP）
    let d = ally.d || {};
    let cost = (sk.mp || 0) > 0 ? Math.max(1, Math.ceil(sk.mp * (1 - (d.mpReduce || 0) / 100))) : 0;
    if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
    if ((ally.mp || 0) < cost) return false;
    ally.mp -= cost; allyManaMasteryRefund(ally, cost);
    if (Math.random() < fs.chance) {
        if (!t.st) t.st = newMobStatus();
        t.st[fs.kind] = (fs.dur || 16) * 10;
        logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}，<span class="${getMobColor(t.lv)}">${t.n}</span> 陷入了「${STATUS_NAME[fs.kind] || sk.n}」。`, 'magic');
        if (!state.ff) renderMobs();
    } else {
        logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}，但未能影響 <span class="${getMobColor(t.lv)}">${t.n}</span>。`, 'miss');
    }
    return true;
}
// 🐉 傭兵屠宰者：立即 3 次近距離打擊，命中吃弱點曝光(每層+10、三刀每擊皆生效)，鎖刃精通每層最終傷害+10%、弱點精通不消耗（比照玩家 9151；傭兵不付 HP）。回傳 true=已施放；false=無近戰武器/MP不足→退回普攻
function allyCastSlaughter(ally, sk) {
    let t = getTarget(); if (!t || t.curHp <= 0) return false;
    let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
    if (!wpn || wpn.isBow || wpn.ranged) return false;   // 需近距離武器
    let d = ally.d || {};
    let cost = (sk.mp || 0) > 0 ? Math.max(1, Math.ceil(sk.mp * (1 - (d.mpReduce || 0) / 100))) : 0;
    if (allyHasMastery(ally, 'i_mana')) cost *= 2;   // 🔮 v3.1.78 魔力精通（傭兵）：攻擊技 MP 消耗加倍（與 MP 上限加倍配套·原 inline 公式漏掉·buff 維持走 getMpCost 已含）
        cost = _allyWpnFullHpMpHalf(ally, cost);   // 🏺 v3.1.80 巫師的黑暗魔導書（傭兵）：滿血時攻擊技 MP 減半
    if ((ally.mp || 0) < cost) return false;
    ally.mp -= cost; allyManaMasteryRefund(ally, cost);
    let layers = t.weakExpose || 0, bonus = layers > 0 ? 10 * layers : 0;
    let consume = layers > 0 && !allyHasMastery(ally, 'k_weakness');   // 🏅 弱點精通（傭兵）：屠宰者不消耗弱點曝光
    let _chain = allyHasMastery(ally, 'k_chainblade');
    let times = sk.hits || 3, total = 0, log = [], applied = false;
    for (let h = 0; h < times; h++) {
        if (t.curHp <= 0) break;
        let res = allyStrikeRoll(ally, t, {});
        if (!res.hit) { log.push('Miss'); continue; }
        let dmg = res.dmg;
        if (bonus > 0) { dmg += bonus; applied = true; }   // 🐉 弱點曝光（傭兵）：成功觸發後，三刀每一擊命中都吃 +10/層（不再僅首擊）
        if (_chain && t.weakExpose > 0) dmg = Math.floor(dmg * (1 + 0.1 * Math.min(5, t.weakExpose)));   // 🏅 鎖刃精通（傭兵）：每層弱點曝光最終傷害 +10%
        if (sk.hpCost && ally._setDragonblood5) dmg = Math.max(1, Math.floor(dmg * 1.2));   // 🐉 v3.1.78 龍血5/5（傭兵）：HP消耗技傷害+20%（屠宰者·鏡像玩家 js/07:419·傭兵確有付HP見 allyDragonAct）
        dmg = Math.max(1, Math.floor(dmg * elementCounterMult(getWpnEle(ally.eq ? ally.eq.wpn : null, wpn), t.e)));   // ⚔️ 武器屬性剋制倍率（屠宰者每擊）
        dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
        t.curHp -= dmg; t.justHit = getWpnEle(ally.eq ? ally.eq.wpn : null, wpn); total += dmg; mobWake(t);
        if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, dmg, 'melee', ally);   // 🌑 v3.4.14 血壁空間：傭兵屠宰者每擊＝近距離技能直擊反射（鏡像玩家 js/07 屠宰者）
        log.push(dmg + (res.heavy ? '(重)' : ''));
        if (t.curHp > 0) wearHardSkin(t, ally.eq && ally.eq.wpn ? ally.eq.wpn.id : null, res.heavy, false, true, ally.classicMode);
    }
    if (consume && applied) t.weakExpose = 0;
    if (total > 0) logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}，連續斬擊 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 [${log.join(', ')}] 共 ${total} 點傷害${bonus > 0 ? `（弱點曝光 每擊+${bonus}）` : ''}。`, 'player');
    else logCombat(`<span class="text-sky-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n} 未命中 <span class="${getMobColor(t.lv)}">${t.n}</span>。`, 'miss');
    let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (ri !== -1) killMob(ri); } else renderMobs();
    return true;
}
// 🔮 傭兵心靈破壞：傷害＝消耗 MP 量(最大MP5%)，無屬性受 MR（混亂/恐慌再 -10）。比照玩家 9198。回傳 true=已施放；false=MP不足→退回普攻
function allyCastMpDmg(ally, sk) {
    let t = getTarget(); if (!t || t.curHp <= 0) return false;
    let spend = Math.max(1, Math.floor((ally.mmp || 0) * sk.mpDmgPct));
    if ((ally.mp || 0) < spend) return false;
    ally.mp -= spend; allyManaMasteryRefund(ally, spend);
    let dmg = spend;
    let effMr = (t.st && t.st.mrhalf > 0) ? (t.mr / 2) : t.mr;
    if (t.st && (t.st.confuse > 0 || t.st.panic > 0)) effMr -= 10;   // 🔮 混亂/恐慌：MR -10（與玩家心靈破壞一致）
    dmg = Math.max(1, Math.floor(magicBaseDamage(dmg, ally.d, 0, true) * magicDamageCoef(ally.d, magicAttrDefense(t, 'none'), sk.tier) * mrMult(Math.max(0, effMr))));   // 🔮 基礎=消耗MP量，套統一公式與幻術專屬階級
    dmg = Math.max(1, Math.floor(dmg * fragileMult(t) * illuLvMult(ally) * wpnEnFinalMult(ally.eq && ally.eq.wpn)));   // 🔮 幻術士(傭兵)等級加成 ×(1+等級/50)；🔧 武器強化 +11~+20 最終倍率
    dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
    t.curHp -= dmg; t.justHit = 'magic'; mobWake(t);
    if (t.st && t.st.mrhalf > 0) t.st.mrhalf = 0;
    if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, dmg, 'magic', ally);   // 🌑 v3.4.14 血壁空間：傭兵心靈破壞＝魔法反射（鏡像玩家 js/07:572 mpDmgPct）
    logCombat(`<span class="text-emerald-300 font-bold">【協力·${ally._allyName}】</span>施放 ${sk.n}，撕裂 <span class="${getMobColor(t.lv)}">${t.n}</span> 的心靈，造成 ${dmg} 點傷害。`, 'magic');
    let ri = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (ri !== -1) killMob(ri); } else renderMobs();
    return true;
}
// 🔧 會心一擊（傭兵版）：必定命中、套用物理傷害公式、固定 ×10（需 MP 滿）；只消耗全部 MP，不扣 HP
function allyDarkCrit(ally, t) {
    let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
    let dice = wpn ? (t.s === 'L' ? wpn.dmgL : wpn.dmgS) : 2;
    ally.buffs = ally.buffs || {}; ally.statuses = ally.statuses || {}; ally.eq = ally.eq || {};   // 安全：getPhysicalDmg 會取用 player.buffs/statuses/eq
    let _sv = player; player = ally; let base;
    try { base = getPhysicalDmg(dice, t, wpn, null, true, false); } finally { player = _sv; }   // forceHeavy：必中必重，套用傭兵自身物理公式
    let raw = (base.dmg || 1) + mobHardSkin(t);                                                  // 無視硬皮：加回硬皮扣減量
    let dmg = Math.max(1, Math.floor(raw * (1 + ((ally.d && ally.d.meleeCritDmg) || 0) / 100) * 10));   // 必定爆擊 ×10
    if (t.race === '血盟') dmg *= 2;                                                              // 對血盟敵人 x2
    // ⚔️ 屬性剋制已由 getPhysicalDmg(line 1389) 套用過、此處不再重複乘（與玩家會心一擊 js/07 一致）
    ally.mp = 0;   // 只消耗 MP（全部），不扣 HP
    dmg = Math.max(1, Math.floor(dmg * royalAllyMult()));   // 👑 王族魅力加成：傭兵造成傷害 ×(1+魅力/100)
    t.curHp -= dmg; t.justHit = getWpnEle(ally.eq ? ally.eq.wpn : null, wpn); mobWake(t);
    if (typeof reflectWallOnDamage === 'function') reflectWallOnDamage(t, dmg, (wpn && (wpn.isBow || wpn.ranged)) ? 'ranged' : 'melee', ally);   // 🌑 v3.4.14 血壁空間：傭兵會心一擊＝技能直擊反射（鏡像玩家 js/07 darkCrit）
    logCombat(`<span class="font-bold" style="color:#f0abfc;text-shadow:0 0 8px #d946ef;">【協力·${ally._allyName}·會心一擊】</span>對 <span class="${getMobColor(t.lv)}">${t.n}</span> 造成 ${dmg} 點致命傷害！`, 'player-crit');
    let i = mapState.mobs.findIndex(m => m && m.uid === t.uid);
    if (t.curHp <= 0) { if (i !== -1) killMob(i); } else renderMobs();
}
// 🤝 Phase4：傭兵異常狀態結算（比照玩家 tick：遞減時長＋持續傷害扣 curHp，可致倒地）。回傳 true＝本 tick 因 DoT 倒地（呼叫端跳過行動）。CC/施法限制由 alliesTick 讀 ally.statuses 判定。
function processAllyStatusTick(ally) {
    if (!ally || ally._downed) return false;
    let st = ally.statuses; if (!st) { ally.statuses = {}; return false; }
    for (let k in st) {
        if (st[k] > 0 && k !== 'poisonDmg' && k !== 'poisonTick' && k !== 'burnDmg' && k !== 'burnTick' && k !== 'scaldDmg' && k !== 'scaldTick' && k !== 'bleedDmg' && k !== 'bleedTick') st[k]--;
    }
    let nm = '協力·' + ally._allyName;
    if (st.poison > 0 && st.poisonTick > 0 && state.ticks % st.poisonTick === 0) { ally.curHp -= st.poisonDmg; logCombat(`${nm} 受到劇毒傷害 ${st.poisonDmg} 點。`, 'enemy'); }
    if (ally.curHp > 0 && st.burn > 0 && st.burnTick > 0 && state.ticks % st.burnTick === 0) { ally.curHp -= st.burnDmg; logCombat(`${nm} 受到灼燒傷害 ${st.burnDmg} 點。`, 'enemy'); }
    if (ally.curHp > 0 && st.scald > 0 && st.scaldTick > 0 && state.ticks % st.scaldTick === 0) { ally.curHp -= st.scaldDmg; logCombat(`${nm} 受到燙傷傷害 ${st.scaldDmg} 點。`, 'enemy'); }
    if (ally.curHp > 0 && st.bleed > 0 && st.bleedTick > 0 && state.ticks % st.bleedTick === 0) { ally.curHp -= st.bleedDmg; logCombat(`${nm} 受到出血傷害 ${st.bleedDmg} 點。`, 'enemy'); }
    if (ally.curHp <= 0) {
        ally.curHp = 0; ally._downed = true; ally._reviveCd = 150;
        logCombat(`<span class="text-amber-400 font-bold">協力傭兵 ${ally._allyName} 因持續傷害倒下了！（15 秒後自動使用復活卷軸，或用返生術立即復活，或回村免費復活）</span>`, 'enemy');
        try { renderSquadPanel(); } catch (e) {}
        return true;
    }
    return false;
}
// 每 tick 處理協力角色攻擊（間隔依武器攻速，最快 8 ticks）
// ⏳ v2.6.3：傭兵攻擊技能改「週期施放」（等同玩家）——平時普攻，攻擊技能每 ~2 秒才放一次。
// 施放間隔＝比照玩家 getAutoCastInterval（20×自身 spdMult ticks·攻速越快間隔越短）。
function allyAtkSkillInterval(ally) { return Math.max(1, Math.round(20 * ((ally.d && ally.d.spdMult) || 1))); }
// 以「攻擊技能冷卻(_atkSkillCd)」閘門包住職業 act：冷卻好且有攻擊技→本回合施放該技並重設冷卻；否則暫時清空 _atkSkill 讓職業 act 走各自「普攻」路徑(保留妖精連射/黑妖連擊/法師光箭/幻術奇古獸等)。
function allyActWithSkillGate(ally, actFn) {
    let _sk = ally._atkSkill ? DB.skills[ally._atkSkill] : null;
    let _mpPct = allyCastMpPct(ally);   // 🆕 v2.6.27 施法MP門檻：MP% 高於此值才施放攻擊技（0=不限）；未達→退回普攻·且不重設冷卻(MP 回滿即施放)
    let _mpOk = (_mpPct <= 0) || ((ally.mp || 0) >= (ally.mmp || 0) * _mpPct / 100);
    if ((ally._atkSkillCd || 0) <= 0 && _sk && _sk.type === 'atk' && _mpOk) {   // 技能回合（且 MP 達門檻）
        ally._atkSkillCd = allyAtkSkillInterval(ally);                 // 設冷卻(即使因 MP/HP 不足未放成功也等下個間隔再試·比照「每~2秒一次」)
        actFn(ally);
    } else {                                                            // 普攻回合(或 MP 未達門檻)：暫清 _atkSkill→職業 act 內部退回普攻(同步·try/finally 還原)
        let _save = ally._atkSkill; ally._atkSkill = '';
        try { actFn(ally); } finally { ally._atkSkill = _save; }
    }
}
// 🔮 v2.6.4 立方：和諧＝回「全隊」MP（玩家＋全體非倒地傭兵各回 amount·夾各自上限）。玩家 cubeTick(js/07)與傭兵 allyCubeTick 共用。
function teamRecoverMp(amount) {
    if (player) player.mp = Math.min(player.mmp || 0, (player.mp || 0) + amount);
    (player && player.allies || []).forEach(a => { if (a && !a._downed) a.mp = Math.min(a.mmp || 0, (a.mp || 0) + amount); });
    try { if (typeof petsOutList === 'function') petsOutList().forEach(p => { if (p && !p._downed && p.mmp != null) p.mp = Math.min(p.mmp || 0, (p.mp || 0) + amount); }); } catch (e) {}   // 🩹 v3.2.67 回魔也惠及出戰寵物（召喚物無 MP 池·略過）
}
// 🩹 v3.2.67 治癒/輔助受益者擴充（單一真相）：把「出戰未倒地寵物＋未倒地召喚物」也納入「玩家/傭兵以外可受益對象」。
//   欄位異質：玩家 hp/mhp·statuses；傭兵 curHp/mhp·statuses；寵物 hp/mhp·_statuses（有 outSlot/無 curHp/無 skId）；召喚物 hp/mhp（無 mp/無狀態·有 skId）。
//   下列統一存取器供 瞬間治癒(玩家 castSkillInner/傭兵 allyTryHeal)、團隊 HoT(js/03)、選人 共用；淨化/回魔各自於本檔擴充。
function healBeneficiaries() {   // 全部「能被治癒/HoT 惠及」的存活隊伍成員
    let arr = [];
    if (typeof player !== 'undefined' && player && !player.dead) arr.push(player);
    (typeof player !== 'undefined' && player && player.allies || []).forEach(a => { if (a && !a._downed && (a.curHp || 0) > 0) arr.push(a); });
    try { if (typeof petsOutList === 'function') petsOutList().forEach(p => { if (p && !p._downed && (p.hp || 0) > 0) arr.push(p); }); } catch (e) {}
    try { if (typeof summonV2List === 'function') summonV2List().forEach(s => { if (s && !s._downed && (s.hp || 0) > 0) arr.push(s); }); } catch (e) {}
    return arr;
}
function _supHp(m) { return (m === player) ? (m.hp || 0) : (m && m.curHp != null ? (m.curHp || 0) : (m ? (m.hp || 0) : 0)); }   // 傭兵=curHp·其餘=hp
function _supMhp(m) { return (m && m.mhp) || 1; }
function _supHeal(m, amt) { let mx = _supMhp(m), v = Math.min(mx, _supHp(m) + amt); if (m === player) m.hp = v; else if (m.curHp != null) m.curHp = v; else m.hp = v; }
function _supName(m) { if (m === player) return (player && player.name) || '你'; if (m && m.curHp != null) return '協力·' + (m._allyName || '傭兵'); if (m && m.skId) return '召喚·' + (m.form || '召喚物'); return '寵物·' + ((m && m.form) || '夥伴'); }
function _supStatuses(m) { return (m && m.statuses) ? m.statuses : ((m && m._statuses) ? m._statuses : null); }   // 玩家/傭兵=statuses·寵物=_statuses
// 🍶🛡️ v2.6.4：把「喝藥水門檻」與「停耗HP技門檻」拆成兩個獨立設定；皆回退舊 _hpSafePct(相容既有存檔)、再回退 0。
function allyPotHpPct(ally) { return (ally && ally._potHpPct != null) ? ally._potHpPct : ((ally && ally._hpSafePct != null) ? ally._hpSafePct : 0); }
function allyHpSkillPct(ally) { return (ally && ally._hpSkillPct != null) ? ally._hpSkillPct : ((ally && ally._hpSafePct != null) ? ally._hpSafePct : 0); }
function allyCastMpPct(ally) { return (ally && ally._castMpPct != null) ? ally._castMpPct : 0; }   // 🆕 v2.6.27 施法MP門檻（MP% 高於此值才施放攻擊技·0=不限；玩家於傭兵技能設定調整）
// 🔄 傭兵轉換技能(type:'convert')施放：比照玩家 castSkill convert 分支，改用 ally.curHp/ally.mp。魔力奪取(drain)需目標＋換身判定異常命中吸MP；心靈/魂體轉換直接扣HP換MP。
function allyCastConvert(ally, sk) {
    // 傭兵轉換技能的施法動作與 VFX。
    // X 軸沿用 _partyMemberRect(ally) 的水平中心；Y 軸則以實際 pm-body 頂端為基準，
    // 避免不同職業 sprite 寬高不同，導致 overHead 定位忽高忽低。
    let _playConvertVfx = () => {
        if (typeof _allySpriteTrigger === 'function') _allySpriteTrigger(ally, 'skill', sk.n);
        if (typeof playSelfFx === 'function') { try {
            let anchor = (typeof _partyMemberRect === 'function') ? _partyMemberRect(ally) : null;
            let st = (typeof _allySpriteStates !== 'undefined') ? _allySpriteStates[String(ally._slot)] : null;
            let bd = st && st.imgs && st.imgs.bd;
            let bodyRect = (bd && bd.isConnected) ? bd.getBoundingClientRect() : null;

            // 與 playSelfFx 相同：VFX 高度以 mob-list 高度為基準；
            // mob-list 無法取得時，才回退使用 battle-view 高度。
            let bv = document.getElementById('battle-view');
            let battleRect = bv && bv.getBoundingClientRect();
            let ml = document.getElementById('mob-list');
            let mobRect = ml && ml.getBoundingClientRect();
            let refH = (mobRect && mobRect.height > 0) ? mobRect.height : ((battleRect && battleRect.height) || 0);
            let cfg = (typeof SELF_FX !== 'undefined') ? SELF_FX[sk.n] : null;
            let fxH = refH * ((cfg && cfg.h) || 0.5);

            // 轉換技能目前皆為 overHead:true。
            // playSelfFx 最終會再執行：VFX top = anchor.top - fxH × 0.55。
            // 此處傳入 bodyRect.top + fxH × 0.35，最終結果為：
            // VFX top = bodyRect.top - fxH × 0.20
            // 亦即 VFX 有 20% 高度超過 pm-body 上緣。
            if (anchor && bodyRect && fxH > 0) {
                anchor = {
                    left: anchor.left,
                    width: anchor.width,
                    top: bodyRect.top + fxH * 0.35
                };
            }

            playSelfFx(sk.n, anchor);
        } catch (e) {} }
    };

    if (sk.drain) {
        let t = getTarget(); if (!t || t.curHp <= 0) return;   // 魔力奪取：無目標不施放、不耗 HP
        _playConvertVfx();   // 魔力奪取具備有效目標後才播放，避免無目標時空播
        ally.curHp = Math.max(1, (ally.curHp || 0) - (sk.hpCost || 0));
        let _sv = player; player = ally; let _hit = false;
        try { _hit = abnormalMagicHit(t); } finally { player = _sv; }
        if (_hit) { let gain = roll(1, Math.max(1, Math.floor((t.lv || 1) / 2))); ally.mp = Math.min(ally.mmp || 0, (ally.mp || 0) + gain); logCombat(`<span class="text-emerald-300 font-bold">協力·${ally._allyName}</span> 施放 ${sk.n}，從 <span class="${getMobColor(t.lv)}">${t.n}</span> 吸取了 ${gain} 點魔力。`, 'heal', 'mercenary'); }
        else logCombat(`<span class="text-emerald-300 font-bold">協力·${ally._allyName}</span> 的 ${sk.n} 未能命中。`, 'miss', 'mercenary');
        return;
    }
    _playConvertVfx();   // 心靈轉換／魂體轉換播放施法動作與 VFX
    ally.curHp = Math.max(1, (ally.curHp || 0) - (sk.hpCost || 0));
    ally.mp = Math.min(ally.mmp || 0, (ally.mp || 0) + (sk.mpGain || 0));
    logCombat(`<span class="text-emerald-300 font-bold">協力·${ally._allyName}</span> 施放 ${sk.n}，消耗 ${sk.hpCost} HP，恢復了 ${sk.mpGain} 點 MP。`, 'heal', 'mercenary');
}
// 🆕 v2.6.8 [傭兵能力補完 #1a]：傭兵自我增益 buff 自動維持（比照玩家 autoActions；傭兵無勾選框→維持所有已學「自我增益」·只付 MP 不付 HP·比照既有傭兵設計）。
//   透過重算 ally.d 讓 buff 的衍生值(extraDmg/extraHit/ac/str/攻速/覺醒 HP·MR·免疫/屬性抗性…)生效。排除：召喚(#2未做)/淨化(#6)/立方·颶風·團隊HoT(各自 ally 常駐路徑)/幻覺·大地祝福·鋼鐵防護(隊長團隊增益·避免與 team aura 疊加或浪費 MP)/暗隱術(受擊迴避層#5另處理)。
// 👑 v2.7.95 傭兵自動施放「開啟閘」：只有「來源角色有勾選自動施放(auto-sk-<id>)」的技能才自動施放（快照存於 config.autoBuffSkills·buildAlly 深拷貝帶入·js/13:713）。
//   用於所有「會耗 MP 的自動維持行為」：自我 buff(1680)／召喚／團隊 HoT／團隊淨化——比照玩家 autoActions 勾選框(js/07:810-824)，玩家沒開＝傭兵不耗 MP。攻擊/治癒/轉換由隊伍面板下拉單選(＝玩家已指定)故不受此閘。
function _mercAutoOn(ally, sid) {
    if (ally && ally._autoBuff && Object.prototype.hasOwnProperty.call(ally._autoBuff, sid)) return !!ally._autoBuff[sid];   // 🆕 v3.0.97 隊伍面板「逐兵自動維持」覆寫優先（setAllyAutoBuff·存 ally._autoBuff·隨存檔）
    return !!(ally && ally.config && ally.config.autoBuffSkills && ally.config.autoBuffSkills[sid]);   // 否則沿用來源角色存檔的自動施放勾選快照
}
// 🔮 v2.7.96 幻術士傭兵立方屬性抗性 rider（補 parity）：玩家立方 buff 給 d:{resFire/resEarth/resWind:+30}(recompute 讀 player.buffs)；傭兵立方走 allyCubeTick 不寫 ally.buffs→抗性原本拿不到。改在重算後(buildAlly/_allyLevelRecompute)直接補「已學會＋來源有勾自動施放」的立方抗性到 ally.d（與 allyCubeTick 傷害的勾選閘一致；受屬性攻擊時 js/04:891-894/1007-1010 讀 ally.d.res*）。
function _applyMercCubeRes(ally) {
    if (!ally || ally.cls !== 'illusion' || !ally.d || !ally.skills) return;
    ['sk_illu_cube_burn', 'sk_illu_cube_quake', 'sk_illu_cube_shock'].forEach(function(sid) {
        if (!ally.skills.includes(sid) || !_mercAutoOn(ally, sid)) return;
        let cd = DB.skills[sid] && DB.skills[sid].d; if (!cd) return;
        if (cd.resFire)  ally.d.resFire  = (ally.d.resFire  || 0) + cd.resFire;
        if (cd.resEarth) ally.d.resEarth = (ally.d.resEarth || 0) + cd.resEarth;
        if (cd.resWind)  ally.d.resWind  = (ally.d.resWind  || 0) + cd.resWind;
    });
}
function _isMercSelfBuff(sk, sid) {
    if (!sk || sk.type !== 'buff') return false;
    // 🔮 v3.2.2 用戶要求：幻覺（歐吉/巫妖/鑽石高崙·illuSummon）改為可自動維持→開放給幻術士傭兵的隊伍面板勾選（原 `|| sk.illuSummon` 直接排除→傭兵永不施放）。
    //    刻意「不」放進 TEAM_AURA_SKILLS：那條路徑有「隊上任一人已維持→不重複施放」去重，會讓玩家開歐吉時傭兵不開自己的歐吉 buff，而 illuSummonTick 需要「自身 buff」才召幻象 → 傭兵幻象會消失。
    //    幻覺屬性加成走 recompute 通用 buff 迴圈套進自身 ally.d；全隊光環由 teamIlluAura/teamAcBonus 讀 _teamAuraHas（排除受益者自身·無雙算）。
    if (sk.summon || sk.cube || sk.hot) return false;   // 🖤 v2.7.92 darkStealth 解除排除：稽核證實原「受擊迴避層#5另處理」註解不實（js/04 傭兵受擊路徑無 stealth 檢查）→改為正常維持（吃來源打勾快照閘）＋enemyAttackAlly 消費（100%迴避一次·5秒冷卻·鏡像玩家）
    if (typeof STORM_BUFF_SKILLS !== 'undefined' && STORM_BUFF_SKILLS.includes && STORM_BUFF_SKILLS.includes(sid)) return false;
    if (sid === 'sk_antidote' || sid === 'sk_holy_light' || sid === 'sk_cancel') return false;
    // 🌟 v3.0.99 隊長團隊光環（大地祝福/鋼鐵防護/水之元氣/化身＝TEAM_AURA_SKILLS）改「開放傭兵維持·全隊生效」→不再於此排除（原 v2.6.17 排除以免傭兵白耗MP·現由隊伍面板勾選＋_teamAuraHas 冗餘守衛控制）。
    if (sid === 'sk_abs_barrier' || sid === 'sk_elf_earthshield' || sid === 'sk_magic_shield') return false;   // 🚫 v2.6.13 #5b：完全免疫類（絕對屏障/大地屏障/魔法屏障）不給傭兵（自動維持會近乎無敵·用戶決定）→不自動維持免白耗MP
    return true;
}
// 🆕 v3.0.97 傭兵「自動維持」可切換技能清單：列出受 _mercAutoOn 閘控制、可於隊伍面板逐兵開關的已學技能
//   （自我增益 buff／召喚術／團隊 HoT／淨化／火牢·冰雪颶風／立方）。回傳 [{sid,n,cat}]（cat 供分組/tooltip）。
//   ⚠️不含：完全免疫類（被 _isMercSelfBuff 排除·刻意不給傭兵）、立方和諧（由轉換技能欄控制）。
//   🔮 v3.2.2：幻覺（歐吉/巫妖/鑽石高崙）已納入（cat '幻覺'）——勾選＝傭兵自動維持該 buff＝提供全隊光環＋（有 i_illusion 精通時）召出對應幻象攻擊。
function allyAutoCastableSkills(ally) {
    if (!ally || !ally.skills) return [];
    let seen = {}, out = [];
    for (let i = 0; i < ally.skills.length; i++) {
        let sid = ally.skills[i]; if (seen[sid]) continue;
        let sk = DB.skills[sid]; if (!sk) continue;
        let cat = null;
        if (sid === 'sk_antidote' || sid === 'sk_holy_light' || sid === 'sk_cancel') cat = '淨化';
        else if (sk.type === 'heal' && sk.hot && sk.autoBuff) cat = '團隊回復';
        else if (typeof STORM_BUFF_SKILLS !== 'undefined' && STORM_BUFF_SKILLS.includes && STORM_BUFF_SKILLS.includes(sid)) cat = '持續傷害';
        else if (sk.cube && sid !== 'sk_illu_cube_harmony') cat = '立方';
        else if (sk.type === 'buff' && sk.summon) cat = '召喚';
        else if (typeof TEAM_AURA_SKILLS !== 'undefined' && TEAM_AURA_SKILLS.includes(sid)) cat = '團隊光環';   // 🌟 v3.0.99 隊長團隊光環（大地祝福/鋼鐵防護/水之元氣/化身）
        else if (sk.illuSummon && _isMercSelfBuff(sk, sid)) cat = '幻覺';   // 🔮 v3.2.2 幻覺（歐吉/巫妖/鑽石高崙）：勾選＝維持 buff→全隊光環＋幻象召喚（需 i_illusion 精通）
        else if (_isMercSelfBuff(sk, sid)) cat = '自我增益';
        if (!cat) continue;
        seen[sid] = true; out.push({ sid: sid, n: sk.n, cat: cat });
    }
    return out;
}
const _MERC_AWAKENS = ['sk_dragon_awaken_antares', 'sk_dragon_awaken_falion', 'sk_dragon_awaken_baraka'];
// 🔮 v3.2.2 攻擊型幻覺光環（會被 recompute 注入玩家 d）：傭兵取得/失去任一 → 需 calcStats 讓玩家即時吃到/退掉。鑽石高崙只給 AC（teamAcBonus 受擊時即時讀）故不在此列。
const _MERC_ILLU_ATK_AURA = ['sk_illu_avatar', 'sk_illu_ogre', 'sk_illu_lich'];
function allyMaintainBuffs(ally) {
    if (!ally || ally._downed) return;
    if (state.ticks % 10 !== 0) return;                 // 每秒一次（比照玩家 buff 遞減節奏；限制重算頻率）
    if (!ally.buffs) ally.buffs = {};
    let _auraBefore = _MERC_ILLU_ATK_AURA.map(s => ((ally.buffs[s] || 0) > 0) ? '1' : '0').join('');   // 🌟 v3.0.100→🔮 v3.2.2 攻擊型幻覺光環(化身+10／歐吉+4傷+4命／巫妖+2魔傷)前狀態：本傭兵取得/失去任一→末尾 calcStats 刷新玩家 d（玩家攻擊即時吃/退·recompute 末段重注入 teamIlluAura(player)）。高崙 AC 走 teamAcBonus 受擊時即時讀取·不需刷新
    let changed = false;
    for (let k in ally.buffs) { if (ally.buffs[k] > 0) { ally.buffs[k]--; if (ally.buffs[k] <= 0) { ally.buffs[k] = 0; changed = true; } } }   // 遞減；到期→需重算移除衍生值
    let _ast = ally.statuses || {};
    let _block = mapState.current.startsWith('town_') || _ast.silence > 0 || _ast.magicseal > 0 || _ast.stun > 0 || _ast.freeze > 0 || _ast.stone > 0 || _ast.paralyze > 0 || _ast.sleep > 0;   // 安全區／沉默／硬控時不施放（仍遞減）
    if (!_block && ally.skills && ally.skills.length) {
        for (let sid of ally.skills) {
            let sk = DB.skills[sid];
            if (!_isMercSelfBuff(sk, sid)) continue;
            // 🆕 v2.7.29 傭兵自我增益改「比照玩家 opt-in」：玩家的 buff 是勾選框控制（auto-sk-<id>·預設未勾＝不施放），
            //    存於 config.autoBuffSkills（buildAlly 深拷貝已帶入傭兵快照）。傭兵原本無條件維持「所有已學 buff」→會維持玩家根本沒開的 buff 白扣 MP（王族/龍騎士尤其明顯：MP 只出不進）。
            //    改為：只維持「來源角色有勾選自動施放」的 buff（沒有 config 或未勾＝不維持·與該角色親自遊玩時完全一致）。⚠️summon/HoT 走各自區塊·此閘只管 _isMercSelfBuff 自我增益。
            if (!_mercAutoOn(ally, sid)) continue;
            if (typeof TEAM_AURA_SKILLS !== 'undefined' && TEAM_AURA_SKILLS.includes(sid) && _teamAuraHas(sid, ally)) continue;   // 🌟 v3.0.99 團隊光環：隊上其他隊員已維持中→不重複施放（全隊只需一個來源·免白耗MP）
            // 🩹 v3.0.107 移除「以主要玩家 buff 為判斷依據」閘（原 v2.6.50）：_isMercSelfBuff 全是「自我增益」——靈魂昇華(自身 mHP/mMP×1.2)、力量/敏捷/防禦/武器附魔/加速…都只加持「施法者本人」，主玩家身上有不代表傭兵有。原閘害「主角(法師)也放同一 buff 時，傭兵法師永遠不自我增益」（用戶回報：傭兵法師點亮靈魂昇華卻不施放）。MP 浪費已由 opt-in 開關(_mercAutoOn)把關；團隊光環(TEAM_AURA)另由上方 _teamAuraHas 閘控制·不受此改動影響。
            if ((ally.buffs[sid] || 0) > 0) continue;   // 已生效（含 noRefresh 語意）；保留「自身」守衛避免同一秒重複施放/MP 空轉
            if (sk.darkStealth && (ally._darkStealthCd || 0) > state.ticks) continue;   // 🖤 v2.7.92 暗隱術（傭兵）：迴避消費後 5 秒冷卻內不再施放（鏡像玩家 js/07 autocast 閘）
            let w = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
            if (sk.reqWpn === 'w2h' && (!w || !w.w2h)) continue;
            if (sk.reqWpnMelee && (!w || w.isBow || w.ranged)) continue;
            if (sk.reqWpnBlunt && (!ally.eq.wpn || !(getWeaponTags(ally.eq.wpn.id).includes('單手鈍器') || getWeaponTags(ally.eq.wpn.id).includes('雙手鈍器')))) continue;
            if (sk.reqShield && !ally.eq.shield && !(ally.eq.wpn && getWeaponTags(ally.eq.wpn.id).includes('武士刀'))) continue;
            if (sk.awaken && ally.mastery !== 'k_awaken' && _MERC_AWAKENS.some(a => (ally.buffs[a] || 0) > 0)) continue;   // 覺醒互斥（覺醒精通可同時三種）
            if (sk.haste && ((ally.buffs.haste || 0) > 0 || ally._equipHaste)) continue;
            let cost = (ally.d && typeof ally.d.getMpCost === 'function') ? ally.d.getMpCost(sk.mp, sk.tier) : (sk.mp || 0);
            if (ally._setIllusion3 && isSupportSkill(sk)) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 v3.1.77 幻覺3/5（傭兵）：輔助技能 MP 消耗 -50%（鏡像玩家 js/07:178/311）
            if ((ally.mp || 0) < cost) continue;        // 只付 MP（傭兵不付 HP·比照既有設計）
            ally.mp -= cost; allyManaMasteryRefund(ally, cost);
            ally.buffs[sid] = sk.dur;
            if (sk.awaken && ally.mastery !== 'k_awaken') _MERC_AWAKENS.forEach(_ak => { if (_ak !== sid) ally.buffs[_ak] = 0; });
            if (sk.haste) ally.buffs.haste = Math.max(ally.buffs.haste || 0, sk.dur);
            changed = true;
        }
    }
    // 🩸 v2.6.25 傭兵召喚維持（造屍術/召喚術/精靈召喚·單一召喚·比照玩家 setupSummon·owner=ally）：安全區/硬控(_block)不召；已有存活召喚則不重召；否則扣MP召喚（優先分階召喚術 sk_summon）。buff 由上方遞減·到期(歸0)自動重召。召喚物 tick 於 alliesTick 驅動（輸出歸 _dps.summon·擊殺歸真隊長）。
    if (!_block && ally.skills && ally.skills.length) {
        let _live = ally.summon && ally.summon.skId && ((ally.buffs[ally.summon.skId] || 0) > 0) && state.ticks < ally.summon.endTick;
        if (!_live) {
            // 👑 v2.7.95 召喚也吃「開啟閘」：只召「來源角色有勾選自動施放」的召喚術（比照玩家 autoActions·玩家沒開→傭兵不耗 MP 召喚）；優先強力版 sk_summon>sk_elf_summon2>其他，但每個候選都須通過 _mercAutoOn
            let _sumSid = (ally.skills.includes('sk_summon') && _mercAutoOn(ally, 'sk_summon')) ? 'sk_summon'
                : (ally.skills.includes('sk_elf_summon2') && _mercAutoOn(ally, 'sk_elf_summon2')) ? 'sk_elf_summon2'   // 🩸 妖精傭兵優先「召喚強力屬性精靈」(上級精靈)：先學的一般版 sk_elf_summon 排在前面，.find 會先抓到它 → 傭兵永遠只召弱版；顯式優先強力版修正
                : ally.skills.find(s => { let d = DB.skills[s]; return d && d.type === 'buff' && d.summon && _mercAutoOn(ally, s); });
            if (_sumSid) {
                let _ssk = DB.skills[_sumSid];
                let _scost = (ally.d && typeof ally.d.getMpCost === 'function') ? ally.d.getMpCost(_ssk.mp, _ssk.tier) : (_ssk.mp || 0);
                if (ally._setIllusion3 && isSupportSkill(_ssk)) _scost = Math.max(1, Math.ceil(_scost / 2));   // 🔮 v3.1.77 幻覺3/5（傭兵）：輔助技能 MP -50%
                if ((ally.mp || 0) >= _scost) { ally.mp -= _scost; allyManaMasteryRefund(ally, _scost); setupSummon(_sumSid, _ssk, ally); }
            }
        }
    }
    if (changed) { try { _allyLevelRecompute(ally); } catch (e) {} }   // 重算 ally.d 反映 buff 衍生值（含 ally._recompN++·供幻覺 nonce 守衛）
    if (_MERC_ILLU_ATK_AURA.map(s => ((ally.buffs[s] || 0) > 0) ? '1' : '0').join('') !== _auraBefore) { try { if (typeof calcStats === 'function') calcStats(); } catch (e) {} }   // 🌟 v3.0.100→🔮 v3.2.2 本傭兵攻擊型幻覺光環變動→刷新玩家 d（recompute 末段重注入 teamIlluAura(player)）
}
// 🆕 v2.6.28 淨化共用（魔法相消術/聖潔之光/解毒術·玩家與傭兵共用）：施法者(自己)受硬控(石化/冰凍/暈眩/麻痺/沉睡)或沉默/魔封→無法施放；否則幫隊員解可解狀態。
//    v2.6.29 改「一次只解一人·優先主要玩家」：teamCleanseOne 依 _dispelTeamMembers 順序(玩家排首→傭兵)找第一個有可解狀態者，只清除該一人的該類狀態並回傳被解者。
function _dispelTeamMembers() { let arr = []; if (typeof player !== 'undefined' && player) { arr.push(player); (player.allies || []).forEach(a => { if (a && !a._downed) arr.push(a); }); } try { if (typeof petsOutList === 'function') petsOutList().forEach(p => { if (p && !p._downed) arr.push(p); }); } catch (e) {} return arr; }   // 🩹 v3.2.67 淨化也惠及出戰寵物（讀 _statuses·召喚物無狀態→不列入）
function teamHasCurableStatus(kinds) { return _dispelTeamMembers().some(m => { let st = _supStatuses(m); return st && kinds.some(k => (st[k] || 0) > 0); }); }
function teamCleanseOne(kinds) { let members = _dispelTeamMembers(); for (let i = 0; i < members.length; i++) { let m = members[i]; let st = _supStatuses(m); if (st && kinds.some(k => (st[k] || 0) > 0)) { kinds.forEach(k => { if (st[k]) st[k] = 0; }); return m; } } return null; }   // 一次只解一人·優先主要玩家（player 已排首）·回傳被解者供 log
function _dispelTargetName(m) { if (typeof player !== 'undefined' && m === player) return '自己'; if (m && m.curHp != null) return '協力·' + (m._allyName || '傭兵'); if (m && m.form) return '寵物·' + m.form; return '傭兵'; }
function dispelCasterBlocked(st) { return !!(st && (st.stun > 0 || st.freeze > 0 || st.stone > 0 || st.paralyze > 0 || st.sleep > 0 || st.silence > 0 || st.magicseal > 0)); }
// 🆕 v2.6.28 傭兵淨化改「幫隊員解狀態」（原 v2.6.15 #6 自我硬控自救→取消）：自己非硬控(石化/冰凍/暈眩/麻痺/沉睡)且非沉默/魔封才施放。優先相消>聖潔>解毒。
//    v2.6.29 改「一次只解一人·優先主要玩家」：teamCleanseOne 只解隊列首位有可解狀態者（player 排首）。
function allyTryDispel(ally) {
    if (!ally || ally._downed || !ally.skills || !ally.skills.length) return false;
    let st = ally.statuses; if (!st) return false;
    if (dispelCasterBlocked(st)) return false;   // 🆕 v2.6.28 施法者硬控(石化/冰凍/暈眩/麻痺/沉睡)或沉默/魔封→無法施放（不再自救）
    let has = (sid) => ally.skills.includes(sid) && _mercAutoOn(ally, sid);   // 👑 v2.7.95 淨化(相消/聖潔/解毒)也吃「開啟閘」：來源角色沒勾自動施放→傭兵不耗 MP 淨化（比照玩家 autoActions js/07:818-824）
    let sk = null, kinds = null;
    if (has('sk_cancel') && teamHasCurableStatus(['freeze', 'stone', 'poison', 'paralyze', 'burn', 'scald'])) { sk = 'sk_cancel'; kinds = ['freeze', 'stone', 'poison', 'paralyze', 'burn', 'scald']; }   // 相消術涵蓋最廣·優先
    else if (has('sk_holy_light') && teamHasCurableStatus(['stone', 'paralyze'])) { sk = 'sk_holy_light'; kinds = ['stone', 'paralyze']; }
    else if (has('sk_antidote') && teamHasCurableStatus(['poison'])) { sk = 'sk_antidote'; kinds = ['poison']; }
    if (!sk) return false;
    let skd = DB.skills[sk]; if (!skd) return false;
    let cost = (ally.d && typeof ally.d.getMpCost === 'function') ? ally.d.getMpCost(skd.mp, skd.tier) : (skd.mp || 0);
    if (ally._setIllusion3 && isSupportSkill(skd)) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 v3.1.77 幻覺3/5（傭兵）：輔助技能 MP -50%
    if ((ally.mp || 0) < cost) return false;
    let _tgt = teamCleanseOne(kinds);   // 🆕 v2.6.29 一次只解一人·優先主要玩家
    if (!_tgt) return false;            // 保險（teamHasCurableStatus 已檢查·理論上非 null）
    ally.mp -= cost; allyManaMasteryRefund(ally, cost);
    logCombat(`<span class="text-emerald-300 font-bold">協力·${ally._allyName}</span> 施放 ${skd.n}，解除了 ${_dispelTargetName(_tgt)} 的負面狀態。`, 'heal', 'mercenary');
    return true;
}
// 傭兵一般行動間隔：使用完整 ally.d.aspd（職業/性別/武器＋常駐藥水＋變身/精通/負重），暫態切割與緩速在此補入。
function allyAttackIntervalTicks(ally, st) {
    let itv = Math.max(1, Math.round(((ally.d && ally.d.aspd) ? ally.d.aspd : atkSpdBaseItv(ally)) * 10));
    if (!ally.classicMode && ally._cleaveTicks > 0 && !allyHasMastery(ally, 'k_cleave')) itv = Math.max(1, Math.round(itv * 0.8));
    if (st && st.slowAtk > 0) itv *= 2;
    return itv;
}
function alliesTick() {
    if (!player.allies || !player.allies.length) return;
    player.allies.forEach(ally => {
        if (!ally) return;
        if (!ally._mercPermanentPotions) { ally._mercPermanentPotions = true; try { _allyLevelRecompute(ally); } catch (e) {} }   // 舊存檔既有傭兵首次 tick 即補上常駐職業藥水效果
        if (ally._downed) { if ((ally._reviveCd || 0) > 0) ally._reviveCd--; if ((ally._reviveCd || 0) <= 0) tryAutoReviveMercScroll(ally); return; }   // 🤝 Phase 3：倒地傭兵完全停止行動（不立方/不颶風/不回魔/不攻擊），僅倒數復活冷卻（含背景補跑）；🎫 v2.6.6：15 秒冷卻結束→身上有復活卷軸自動使用
        if (processAllyStatusTick(ally)) return;   // 🤝 Phase4：異常狀態 DoT 結算（中毒/灼燒/燙傷/出血→可致倒地）；倒地則本回合不行動
        if ((ally._potCd || 0) > 0) ally._potCd--;   // 🍶 傭兵自動喝藥水冷卻（每 tick 遞減·~1 秒）
        allyTryPotion(ally);   // 🍶 HP% 低於安全線→消耗隊長設定的藥水回血（獨立於行動·硬控中仍可喝·安全線=0 則略過）
        allyMaintainBuffs(ally);   // 🆕 v2.6.8 #1a：每秒自動維持傭兵自我增益 buff（覺醒/加速/狂暴術/神聖武器/屬性buff…）·重算 ally.d 使其生效（須在幻覺 _iRn 擷取前）
        allyTryBluePotion(ally);   // 🔵 隊長勾選自動藍水時，每名傭兵各自消耗隊長庫存並維持藍水
        if ((ally._atkSkillCd || 0) > 0) ally._atkSkillCd--;   // ⏳ 攻擊技能施放間隔（每 tick 遞減·比照玩家 cds.atkSk）
        allyTryDispel(ally);   // 🆕 v2.6.15 #6→v2.6.28 團隊淨化：自己非硬控/沉默時幫全隊解可解狀態（自己硬控中則不施放·由其他自由隊員代解）
        // 🩸 v2.6.25 傭兵召喚物 tick（造屍術/召喚術/精靈召喚·owner=ally）＋🩸 v2.6.26 幻術士幻象召喚（歐吉/巫妖/鑽石高崙·i_illusion 精通·學過該技即召·stat aura 由隊長 teamIlluAura 提供避免雙套）：owner=ally·輸出獨立歸 _dps.summon（不計入本傭兵回合 _dpsAllyTurn·硬控中召喚物仍行動·擊殺獎勵歸真隊長·不換身）。倒地傭兵已於上方 return 不驅動。
        if (ally.summon || (ally.cls === 'illusion' && ally.mastery === 'i_illusion')) { let _svSrc = _combatSrc; _combatSrc = 'summon'; let _sSnap = _dpsSnap(); try { if (ally.summon) summonTick(ally.summon, () => { ally.summon = null; }, ally); if (ally.cls === 'illusion' && ally.mastery === 'i_illusion') illuSummonTick(ally); } finally { _combatSrc = _svSrc; let _sd = _dpsDealt(_sSnap); if (_sd > 0) _dps.summon += _sd; } }
        let _ast = ally.statuses || {};
        let _ccBlock = (_ast.stun > 0 || _ast.freeze > 0 || _ast.stone > 0 || _ast.paralyze > 0 || _ast.sleep > 0);   // 🤝 Phase4：硬控（暈眩/冰凍/石化/麻痺/睡眠）→完全無法行動
        let _castBlock = (_ast.silence > 0 || _ast.magicseal > 0);   // 🤝 Phase4：沉默/魔法封印→不可施放技能/治癒，僅能基本攻擊
        let _dpsASnap = _dpsSnap(); _dpsAllyTurn = true;   // 🎯 DPS：逐傭兵量測本回合輸出（攻擊/立方/持續增益），_dpsAllyTurn 期間 _allyDamageMob 不重複計入
        let _iAura = teamIlluAura(ally), _iRn = ally._recompN || 0, _iBase = null;   // 🔮 v2.6.7 幻覺全隊攻擊光環：擷取隊長 illusion buff（在任何換身前讀）·🌟 v3.0.99 排除本傭兵自身(其自身已在 ally.d)·任一隊員提供皆吃·_iRn＝升級重算計數（還原守衛）
        try {
        if (_iAura) { _iBase = { ed: ally.d.extraDmg || 0, eh: ally.d.extraHit || 0, md: ally.d.magicDmg || 0 }; ally.d.extraDmg = _iBase.ed + _iAura.ed; ally.d.extraHit = _iBase.eh + _iAura.eh; ally.d.magicDmg = _iBase.md + _iAura.md; }   // 注入本傭兵：額外傷害(歐吉4+化身10)/額外命中(歐吉4)/魔法傷害(巫妖2)
        if (!_ccBlock && ally.cls === 'illusion') allyCubeTick(ally);   // 🔮 幻術士傭兵：立方常駐光環（硬控中不展開）
        if (!_ccBlock && ally.skills && ally.skills.length) for (let _ssid of STORM_BUFF_SKILLS) { let _ssk = DB.skills[_ssid]; if (ally.skills.includes(_ssid) && _mercAutoOn(ally, _ssid) && _ssk && !mapState.current.startsWith('town_') && state.ticks % (_ssk.stormInterval || 40) === 0) allyStormTick(ally, _ssk); }   // 🌨️🔥 傭兵 冰雪颶風/火牢：v2.7.96 加「來源有勾自動施放」閘（比照玩家 autoActions js/07:807·免 MP 但沒開→不展開）；安全區不展開
        // 🍃 傭兵維持團隊 HoT（生命的祝福/體力回復術）：已學會的 hot+autoBuff 技能·該技能團隊 HoT 未在持續中→施放(全隊回復·消耗傭兵MP)·安全區不施放·硬控/沉默/魔封中不施放
        if (!_ccBlock && !_castBlock && ally.skills && ally.skills.length && !mapState.current.startsWith('town_')) for (let _hid of ally.skills) {   // 🛡️ v2.6.69 審計#19：補 !_castBlock——沉默中不能補血卻能放 HoT 自相矛盾（玩家路徑走 castSkillInner 有沉默閘）
            let _hsk = DB.skills[_hid]; if (!_hsk || !_hsk.hot || !_hsk.autoBuff) continue;
            if (!_mercAutoOn(ally, _hid)) continue;   // 👑 v2.7.95 團隊 HoT(生命的祝福/體力回復術)也吃「開啟閘」：來源角色沒勾自動施放→傭兵不耗 MP 放（比照玩家 autoActions js/07:814-817）
            if (player.hots && player.hots[_hid] && player.hots[_hid].ticksLeft > 0) continue;   // 已在持續→不重複(單一團隊實例·後放取代先放)
            let _hcost = (ally.d && typeof ally.d.getMpCost === 'function') ? ally.d.getMpCost(_hsk.mp || 0, _hsk.tier) : (_hsk.mp || 0);   // 🛡️ v2.6.69 審計#20：套 mpReduce/學徒折扣（比照傭兵攻擊技/淨化）
            if (ally._setIllusion3 && isSupportSkill(_hsk)) _hcost = Math.max(1, Math.ceil(_hcost / 2));   // 🔮 v3.1.77 幻覺3/5（傭兵）：輔助技能 MP -50%
            if ((ally.mp || 0) < _hcost) continue;
            ally.mp -= _hcost; allyManaMasteryRefund(ally, _hcost); applyTeamHot(_hid, _hsk, ally.d, ally);   // 🏺 v3.1.80 治癒者的恢復魔棒：傳施放者供 hotHealMult 快照
            logCombat(`<span class="text-emerald-300 font-bold">協力·${ally._allyName}</span> 施放 ${_hsk.n}，全隊開始持續回復 HP。`, 'heal', 'mercenary');
        }
        // 🔄 傭兵轉換技能(轉換技能欄選 type:'convert' 者)：比照玩家轉換魔法·每 30tick·安全區/硬控/沉默不施放·MP<90%·HP 高於「停耗HP技」門檻才施放(消耗HP換MP)。立方和諧不走這裡(由 allyCubeTick 處理)。
        if (!_ccBlock && !_castBlock && ally._convertSkill && !mapState.current.startsWith('town_') && state.ticks % 30 === 0) {
            let _cvsk = DB.skills[ally._convertSkill];
            if (_cvsk && _cvsk.type === 'convert' && ally.skills && ally.skills.includes(ally._convertSkill)) {
                let _hs = allyHpSkillPct(ally);
                let _hpOk = (_hs <= 0) || ((ally.curHp || 0) > (ally.mhp || 1) * _hs / 100);   // 🛡️ 低於停耗HP技門檻→暫停(轉換技耗HP)
                if (_hpOk && (ally.mp || 0) < (ally.mmp || 0) * 0.9) allyCastConvert(ally, _cvsk);
            }
        }
        // 回魔：比照玩家每 160 ticks(16秒) +mpR（法師施法 / 妖精三重矢皆需 MP）
        if (state.ticks % 160 === 0 && (ally.mp||0) < (ally.mmp||0) && ((ally.d && ally.d.mpR) || 0) > 0) {   // 🔧 mpR 可能因套裝懲罰（黑暗妖精套裝 -7）為負 → 與玩家回魔一致，只在 >0 時回魔，避免扣傭兵MP
            ally.mp = Math.min(ally.mmp, (ally.mp||0) + ((ally.d && ally.d.mpR) || 0));
        }
        // 🩸 HP 自然再生（v2.6.16 用戶要求：全職傭兵通用·比照玩家 regenTick）：每 160 ticks，HP<上限且「HP自然恢復為正」(hpRegenMax>0 或 hpR>0)→ +roll(1,hpRegenMax)+hpR（龍騎傭兵改吃HP尤需；移除舊龍騎專屬 5% 保底，改純自然恢復）
        if (state.ticks % 160 === 0 && (ally.curHp||0) < (ally.mhp||0)) {
            let _hrMax = (ally.d && ally.d.hpRegenMax) || 0, _hrFlat = (ally.d && ally.d.hpR) || 0;
            if (_hrMax > 0 || _hrFlat > 0) { let _hr = (_hrMax > 0 ? roll(1, _hrMax) : 0) + _hrFlat; if (_hr > 0) ally.curHp = Math.min(ally.mhp, (ally.curHp||0) + _hr); }
        }
        if (ally._cleaveTicks > 0) ally._cleaveTicks--;   // 🔧 切割（雙手劍重擊觸發）：攻速+20% 持續倒數
        if (!_ccBlock && (ally._atkCd = (ally._atkCd || 0) - 1) <= 0) {
            ally._stunCycle = false;   // ⚔️ 硬直：攻擊週期結束→重置旗標（下週期被擊可再延遲一次）
            if (_castBlock) {   // 🤝 Phase4：沉默/魔法封印→只能基本攻擊（不施放 _atkSkill 與治癒）
                ally._atkCd = allyAttackIntervalTicks(ally, _ast); allyAttackOnce(ally);
            } else if (ally._healSkill && allyTryHeal(ally)) {   // 🤝 Phase 3：隊伍有人低於門檻→改施放治癒（消耗本回合行動）
                ally._atkCd = 20;
            } else if (ally.cls === 'mage') {
                ally._atkCd = allyAttackIntervalTicks(ally, _ast);   // 法師使用真正職業/武器攻速與常駐加速（不再固定 2 秒）
                allyActWithSkillGate(ally, allyMageAct);   // ⏳ 法師：攻擊魔法週期施放·平時基礎光箭普攻
            } else {
                let wpn = (ally.eq && ally.eq.wpn) ? DB.items[ally.eq.wpn.id] : null;
                // ⚔️ v3.0.98 傭兵攻速改用 recompute 後的完整 ally.d.aspd（＝base×spdMult：加速術/強力加速/行走加速/勇敢/餅乾/切割·劍術·巨斧·雙斧·王族劍術·奇古·魔劍精通/覺醒/血之渴望/變身/負重 全含·比照玩家 player.d.aspd）。
                //   原本只用 atkSpdBaseItv(base)＋手動 cleave/劍術/奇古 且 floor 8＝0.8s → 漏掉加速術等、且把已算的精通夾在 0.8s（傭兵過慢主因）。buff 變動由 allyMaintainBuffs→_allyLevelRecompute 即時重算 ally.d.aspd；floor 改 1 比照玩家(js/03:290)使加速確實生效。
                ally._atkCd = allyAttackIntervalTicks(ally, _ast);
                let _actFn = (ally.cls === 'elf') ? allyElfAct : (ally.cls === 'dark') ? allyDarkAct : (ally.cls === 'knight') ? allyKnightAct : (ally.cls === 'dragon') ? allyDragonAct : (ally.cls === 'illusion') ? allyIllusionAct : (ally.cls === 'warrior') ? allyWarriorAct : (ally.cls === 'royal') ? allyRoyalAct : null;
                if (_actFn) allyActWithSkillGate(ally, _actFn); else allyAttackOnce(ally);   // ⏳ 攻擊技能週期施放(每~2秒)·平時走職業各自普攻
            }
        }
        } finally { if (_iAura && _iBase && (ally._recompN || 0) === _iRn) { ally.d.extraDmg = _iBase.ed; ally.d.extraHit = _iBase.eh; ally.d.magicDmg = _iBase.md; }   // 🔮 還原幻覺光環（若本回合發生升級重算→ally.d 已就地重建·跳過還原·避免把光環當基底扣掉）
                   _dpsAllyTurn = false; let _ad = _dpsDealt(_dpsASnap); if (_ad > 0) _dpsAddAlly(ally, _ad); }   // 🎯 DPS：結算該傭兵本回合輸出
    });
}
// 🤝 Phase 3：傭兵自動治癒——若已設定治癒魔法且隊伍(玩家＋自己＋其他非倒地傭兵)中有人 HP% 低於該傭兵門檻，對最低者施放（消耗 MP）。回傳是否施放（true→佔用本回合行動）。
// 治癒量比照玩家 castSkillInner：(XdY healDice + healBase)×(1+3×magicDmg/32)，或 valBase+valDice+magicDmg；🆕 v2.6.17 水之元氣改全隊生效→套 waterVitalHeal(讀隊長 buff·全隊共用 7 秒冷卻)。HoT/淨化(autoBuff)不在此；🩸 v2.6.69 吸血(healSlot)改在本函式開頭支援（走 allyCastMagic·只看自身HP門檻）。
function allyTryHeal(ally) {
    let sid = ally._healSkill; if (!sid) return false;
    let sk = DB.skills[sid]; if (!sk) return false;
    // 🩸 v2.6.69 審計#9：治癒欄支援吸血魔法（寒冷戰慄/吸血鬼之吻·type:'atk'+healSlot）——UI 可選但原讀取端只收 type:'heal'，選了永不施放。
    //    吸血只回復施放者本人 → 只看「自身」HP 門檻；有存活目標且 MP 足夠→走 allyCastMagic（其 lifesteal 分支回復 ally.curHp）
    if (sk.type === 'atk' && sk.healSlot) {
        let cost0 = (ally.d && typeof ally.d.getMpCost === 'function') ? ally.d.getMpCost(sk.mp || 0, sk.tier) : (sk.mp || 0);
        if (ally._setIllusion3 && isSupportSkill(sk)) cost0 = Math.max(1, Math.ceil(cost0 / 2));   // 🔮 v3.1.77 幻覺3/5（傭兵）：輔助技能 MP -50%
        if ((ally.mp || 0) < cost0) return false;
        let thr0 = ((ally._healHpPct != null ? ally._healHpPct : 70) / 100);
        if (((ally.curHp || 0) / (ally.mhp || 1)) >= thr0) return false;
        let t0 = getTarget(); if (!t0 || t0.curHp <= 0) return false;
        ally.mp -= cost0; allyManaMasteryRefund(ally, cost0);
        allyCastMagic(ally, sk);
        return true;
    }
    let isHeal = (sk.type === 'heal' && !sk.autoBuff && !sk.hot && !['sk_antidote', 'sk_holy_light', 'sk_cancel'].includes(sid));
    if (!isHeal) return false;
    let cost = (ally.d && typeof ally.d.getMpCost === 'function') ? ally.d.getMpCost(sk.mp || 0, sk.tier) : (sk.mp || 0);   // 🛡️ v2.6.69 審計#20：治癒也吃 mpReduce/學徒折扣（原收原價·與攻擊技/淨化收費標準不一）
    if (ally._setIllusion3 && isSupportSkill(sk)) cost = Math.max(1, Math.ceil(cost / 2));   // 🔮 v3.1.77 幻覺3/5（傭兵）：輔助技能 MP -50%
    if ((ally.mp || 0) < cost) return false;
    let thr = ((ally._healHpPct != null ? ally._healHpPct : 70) / 100);
    let cand = (typeof healBeneficiaries === 'function') ? healBeneficiaries() : (!player.dead ? [player, ally] : [ally]);   // 🩹 v3.2.67 含玩家/全體傭兵(含自己)/出戰寵物/召喚物
    let lowest = null, lowestPct = thr;   // 只考慮低於門檻者
    for (let c of cand) {
        let pct = (typeof _supHp === 'function' ? _supHp(c) : ((c === player) ? (c.hp || 0) : (c.curHp || 0))) / (typeof _supMhp === 'function' ? _supMhp(c) : (c.mhp || 1));
        if (pct < lowestPct) { lowestPct = pct; lowest = c; }
    }
    if (!lowest) return false;   // 無人需要治癒
    ally.mp -= cost; allyManaMasteryRefund(ally, cost);
    let d = ally.d || {};
    let _coef = 1 + (3 * (d.magicDmg || 0) / 32);
    let heal = sk.healDice
        ? Math.max(1, Math.floor((rollDice(sk.healDice[0], sk.healDice[1]) + (sk.healBase || 0)) * _coef))
        : Math.max(1, (sk.valBase || 0) + roll(sk.valDice[0], sk.valDice[1]) + (d.magicDmg || 0));
    heal = waterVitalHeal(heal);   // 🆕 v2.6.17 水之元氣改全隊生效：傭兵治癒也吃隊長「水之元氣」加倍（waterVitalHeal 讀真隊長 player.buffs＋共用 7 秒冷卻·此處 player 為真隊長非換身）
    if (typeof _supHeal === 'function') _supHeal(lowest, heal); else if (lowest === player) { player.hp = Math.min(player.mhp, player.hp + heal); } else { lowest.curHp = Math.min(lowest.mhp, (lowest.curHp || 0) + heal); }   // 🩹 v3.2.67 可能是寵物/召喚物
    // 🎬 v3.0.95 傭兵治癒視覺回饋（用戶反映「沒動作也沒效果」·數值其實有補但零視覺）：①施放者播施法動作（原本傭兵治癒完全無動畫）②治癒特效疊在被治癒者 sprite 身上（無 sprite→戰鬥區預設錨點；未註冊技能名靜默略過）
    if (typeof _allySpriteTrigger === 'function') _allySpriteTrigger(ally, 'skill', sk.n);
    if (typeof playSelfFx === 'function') { try { playSelfFx(sk.n, (typeof _partyMemberRect === 'function') ? _partyMemberRect(lowest) : null); } catch (e) {} }
    let _who = (typeof _supName === 'function') ? _supName(lowest) : ((lowest === player) ? (player.name || '你') : ('協力·' + lowest._allyName));
    logCombat(`<span class="text-emerald-300 font-bold">協力·${ally._allyName}</span> 施放 ${sk.n}，為 ${_who} 恢復 ${heal} 點 HP。`, 'heal', 'mercenary');
    return true;
}
// 🍶 傭兵自動喝藥水：當傭兵 HP% 低於「HP 安全線」(_hpSafePct·隊伍面板設定)，消耗「隊長設定的藥水」(自動化設定的 set-pot·紅/橙/白藥水)回血。
//   ・藥水從隊長(玩家)道具欄扣 1 瓶；恢復量＝藥水 val ×(1+傭兵自身 CON 藥水加成%)（夾到傭兵上限）。每 ~1 秒冷卻 1 次（_potCd），獨立於攻擊行動、硬控中仍可喝。
//   ・安全線=0／無設定＝關閉；隊長無該藥水：若勾「自動購買藥水」→ 傭兵喝藥水也會觸發自動補貨（v2.6.43·補到 100 瓶）、否則略過。只認 val 型治癒藥水（紅/橙/白），加速/勇敢等無 val 藥水不喝。
function allyTryPotion(ally) {
    if (!ally || ally._downed) return;
    let thr = allyPotHpPct(ally);   // 🍶 v2.6.4：喝藥水門檻(獨立·回退舊 _hpSafePct)
    if (thr <= 0) return;                                   // 門檻=0＝關閉
    if ((ally._potCd || 0) > 0) return;                     // 冷卻中
    let mhp = ally.mhp || 1, cur = ally.curHp || 0;
    if (cur <= 0) return;                                   // 倒地（理論上已被上面 return 擋掉）
    if (cur > mhp * thr / 100) return;                      // HP 仍在安全線之上→不喝
    let potSel = (typeof document !== 'undefined') ? document.getElementById('set-pot') : null;
    let potId = potSel ? potSel.value : 'potion_heal';      // 隊長設定的藥水
    let pdef = DB.items[potId];
    if (!pdef || pdef.val == null) return;                  // 只認固定 val 的治癒藥水（紅/橙/白）
    let stack = player.inv && player.inv.find(i => i.id === potId && (i.cnt || 0) > 0);
    if (!stack) {
        // 🍶 v2.6.43 用戶要求：隊長沒有這瓶藥水時，若勾選「自動購買藥水」→ 傭兵喝藥水也能觸發自動補貨（比照玩家 autoActions：補到 100 瓶），讓傭兵有藥水可喝。
        //   受 _potCd(~1 秒冷卻·上方已擋) 節流→不會每 tick 狂買；同 tick 多傭兵時第一位補滿 100 瓶、其餘直接用新庫存（不重複購買）。
        let _buyChk = (typeof document !== 'undefined') ? document.getElementById('set-auto-buy-pot') : null;
        if (!_buyChk || !_buyChk.checked) return;           // 未勾選自動購買 → 維持原行為（略過、不喝）
        let _unit = (typeof shopPrice === 'function') ? shopPrice(pdef.p || 0) : (pdef.p || 0);   // 攻城獲勝 8 折亦適用
        let _need = 100;                                     // 補到 100 瓶（隊長身上目前 0 瓶）
        if ((player.gold || 0) < _need * _unit) return;     // 金幣不足 → 買不了、也喝不了
        player.gold -= _need * _unit;
        gainItem(potId, _need, true, true);
        logSys(`自動消耗 ${_need * _unit} 金幣購買了 ${_need} 瓶${pdef.n}（供協力傭兵飲用）。`);
        stack = player.inv.find(i => i.id === potId && (i.cnt || 0) > 0);
        if (!stack) return;                                 // 保險：理論上已購入
    }
    stack.cnt--; if (stack.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== stack.uid);   // 消耗隊長 1 瓶（v3.2.42 稽核修：只移除喝空的那疊·原全背包 filter 會誤刪 cnt 為 undefined 的舊物品）
    let _conPct = (typeof getConPotionPct === 'function') ? getConPotionPct((ally.d && ally.d.con) || 0) : 0;   // 比照玩家：CON 提升藥水恢復%
    let _dollPot = (ally.eq && ally.eq.doll && DB.items[ally.eq.doll.id]) ? (DB.items[ally.eq.doll.id].potionBonus || 0) : 0;   // 🆕 v2.6.10 #3：魔法娃娃 potionBonus%（吸血鬼娃娃）
    let h = Math.max(1, Math.floor(potionHealBase(pdef) * (1 + (_conPct + _dollPot) / 100)));   // 🍶 藥水基準改隨機區間 valMin~valMax（傭兵比照玩家）
    ally.curHp = Math.min(mhp, cur + h);
    ally._potCd = 10;                                       // ~1 秒冷卻（10 ticks·比照玩家 cds.pot=1 秒）
    logCombat(`<span class="text-emerald-300 font-bold">協力·${ally._allyName}</span> 飲用 ${pdef.n}，恢復 ${h} 點 HP。`, 'heal', 'mercenary');
}
// 🔵 傭兵藍色藥水：跟隨隊長「藍色藥水」勾選；每名傭兵各消耗 1 瓶隊長庫存，缺貨且勾自動購買時比照治癒藥水補到 100 瓶。
function allyTryBluePotion(ally) {
    if (!ally || ally._downed || state.ticks % 10 !== 0 || typeof document === 'undefined') return;
    let useChk = document.getElementById('set-blue');
    if (!useChk || !useChk.checked) {
        if (ally.buffs && (ally.buffs.blue || 0) > 0) { ally.buffs.blue = 0; try { _allyLevelRecompute(ally); } catch (e) {} }
        return;
    }
    if (!ally.buffs) ally.buffs = {};
    if ((ally.buffs.blue || 0) > 0) return;
    let def = DB.items.potion_blue;
    let stack = player.inv && player.inv.find(i => i.id === 'potion_blue' && (i.cnt || 0) > 0);
    if (!stack) {
        // 🧪 v3.3.15 自動使用＝自動購買合併：已通過上方「藍色藥水」勾選閘 → 缺貨即自動購買（不再需要獨立的「自動購買」勾選）
        let unit = (typeof shopPrice === 'function') ? shopPrice(def.p || 0) : (def.p || 0);
        let need = 100;
        if ((player.gold || 0) < need * unit) return;
        player.gold -= need * unit;
        gainItem('potion_blue', need, true, true);
        logSys(`自動消耗 ${need * unit} 金幣購買了 ${need} 瓶${def.n}（供協力傭兵飲用）。`);
        stack = player.inv.find(i => i.id === 'potion_blue' && (i.cnt || 0) > 0);
        if (!stack) return;
    }
    if ((stack.cnt || 1) > 1) stack.cnt--; else player.inv = player.inv.filter(i => i !== stack);
    ally.buffs.blue = def.dur || 600;
    try { _allyLevelRecompute(ally); } catch (e) {}
}
// 🤝 Phase 3：原地復活倒地傭兵（隊伍面板按鈕）。限定使用「復活卷軸」(scroll_revive·與玩家原地復活同物品)；倒地後 15 秒冷卻內不可用；無卷軸只能回村免費復活。復活至 HP 50%、滿魔。
// 傭兵原地復活：玩家可選「返生術」(消耗 MP·無冷卻·死亡後立即可用) 或「復活卷軸」(消耗1張·須死亡 15 秒後 _reviveCd 歸零才能用)。
// method='rez' → 返生術；'scroll'(或省略) → 復活卷軸。效果相同：HP 50%、MP 滿、清異常、留原地。
function reviveMercenary(slotN, method) {
    slotN = String(slotN);
    let ally = (player.allies || []).find(a => a && String(a._slot) === slotN);
    if (!ally) return;
    if (!ally._downed) { logSys(`<span class="text-slate-400">${ally._allyName} 並未倒地。</span>`); return; }
    if (method === 'rez') {
        // 🪄 返生術：消耗玩家 MP、無冷卻、死亡後可馬上使用
        if (player.dead) { logSys(`<span class="text-red-400">你已死亡，無法施放 返生術。</span>`); return; }
        if (!player.skills || !player.skills.includes('sk_resurrection')) { logSys(`<span class="text-red-400">尚未學會 返生術，無法立即復活（可改用復活卷軸·死亡 15 秒後）。</span>`); return; }
        let rk = DB.skills.sk_resurrection;
        let cost = rk ? player.d.getMpCost(rk.mp, rk.tier) : Infinity;
        if ((player.mp || 0) < cost) { logSys(`<span class="text-red-400">MP 不足以施放 返生術（需 ${cost}）。</span>`); return; }
        player.mp -= cost;
        _reviveAllyDone(ally, '返生術');
        return;
    }
    // 🎫 復活卷軸：須死亡 15 秒後（_reviveCd 歸零）
    if ((ally._reviveCd || 0) > 0) { logSys(`<span class="text-slate-400">復活卷軸須死亡 15 秒後才能使用，${ally._allyName} 還需 ${Math.ceil(ally._reviveCd / 10)} 秒（或用返生術立即復活）。</span>`); return; }
    let sc = player.inv && player.inv.find(i => i.id === 'scroll_revive');
    if (!sc || (sc.cnt || 0) <= 0) { logSys(`<span class="text-red-400">需要「復活卷軸」才能於原地復活 ${ally._allyName}（或用返生術、或回村免費復活全體倒地傭兵）。</span>`); return; }
    sc.cnt--; player.inv = player.inv.filter(i => i.cnt > 0);   // 消耗 1 張復活卷軸
    _reviveAllyDone(ally, '復活卷軸');
}
// 🎫 v2.6.6：倒地傭兵 15 秒冷卻結束後，若「玩家(隊長)身上有復活卷軸」→ 自動消耗 1 張原地復活（返生術仍須手動）。
//   ・冷卻未結束：不動作（等冷卻）。玩家無卷軸：不動作（不自動購買；之後補到卷軸會於下一 tick 自動復活）。
//   ・在 alliesTick 每 tick 對倒地傭兵呼叫；含背景補跑。玩家死亡仍可觸發（卷軸不需玩家存活，與 reviveMercenary 'scroll' 路徑一致）。
function tryAutoReviveMercScroll(ally) {
    if (!ally || !ally._downed) return false;
    if ((ally._reviveCd || 0) > 0) return false;                                            // 15 秒冷卻未結束
    let sc = player.inv && player.inv.find(i => i.id === 'scroll_revive' && (i.cnt || 0) > 0);
    if (!sc) return false;                                                                    // 身上沒有復活卷軸→等待
    sc.cnt--; if (sc.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== sc.uid);          // 消耗 1 張復活卷軸（v3.2.42 稽核修：只移除用空的那疊）
    _reviveAllyDone(ally, '復活卷軸（自動）');
    return true;
}
function _reviveAllyDone(ally, via) {
    ally._downed = false;
    ally.curHp = Math.max(1, Math.floor((ally.mhp || 1) * 0.5));
    ally.mp = ally.mmp || 0;
    ally._reviveCd = 0;
    ally.statuses = {};   // 🤝 Phase4：復活清空所有異常狀態
    logSys(`<span class="text-emerald-300 font-bold">使用 ${via}，協力傭兵 ${ally._allyName} 原地復活（HP 50%）！</span>`);
    saveGame(); updateUI();
    try { renderSquadPanel(); } catch (e) {}
    if (typeof playSelfFx === 'function') { try { setTimeout(function () { playSelfFx('返生術', (typeof _partyMemberRect === 'function') ? _partyMemberRect(ally) : null); }, 30); } catch (e) {} }   // 🪦 v3.0.102 返生術/復活卷軸→於復活的傭兵身上播返生術特效（延一拍待 sprite 復現後錨定）
}
// 🤝 Phase 3：回村/回城（進入 town_ 安全區）免費復活全體倒地傭兵至滿血滿魔（由 changeMap 村莊分支呼叫）
function reviveDownedMercsAtTown() {
    if (!player || !player.allies) return;
    let n = 0;
    player.allies.forEach(a => { if (a) { let _wd = a._downed; a._downed = false; a.curHp = a.mhp; a.mp = a.mmp; a._reviveCd = 0; a.statuses = {}; if (_wd) n++; } });   // 🤝 Phase4：回村→全體傭兵回滿 HP/MP 並清除異常狀態（倒地者亦復活，計入訊息）
    if (n) { try { logSys(`<span class="text-emerald-300">回到安全區，${n} 名倒地的協力傭兵已恢復。</span>`); } catch (e) {} try { renderSquadPanel(); } catch (e) {} }
}
// 🤝 傭兵升級重算戰力：暫時把全域 player 換成該傭兵跑 recomputeStats（純計算·比照 buildAlly），取得新等級的衍生戰力後還原；保留當前 HP/MP（夾到新上限·不滿血）。
function _allyLevelRecompute(ally) {
    let _keepHp = ally.curHp, _keepMp = ally.mp;
    let _save = player;
    // 🆕 v2.6.23 [傭兵能力補完·中影響] 收集冊加成（卡片/裝備/道具/娃娃）改讀「隊長即時共用桶」而非傭兵招募時 buildAlly 深拷貝的舊快照。
    //   cardDex/equipDex/miscDex 是同模式帳號共用桶（隨收集增長）；傭兵舊快照凍結在招募當下→暫指向隊長 live 桶重算，結束後還原傭兵欄位（避免存檔快照被隊長桶引用污染）。
    let _oc = ally.cardDex, _oe = ally.equipDex, _om = ally.miscDex;
    if (_save) { ally.cardDex = _save.cardDex; ally.equipDex = _save.equipDex; ally.miscDex = _save.miscDex; }
    player = ally; let ok = true;
    _recomputingAlly = true;   // 🌟 v3.0.100 標記傭兵重算（同 buildAlly）
    try { recomputeStats(); } catch (e) { ok = false; }
    _recomputingAlly = false;
    ally.cardDex = _oc; ally.equipDex = _oe; ally.miscDex = _om;   // 還原傭兵自身欄位
    player = _save; calcStats();   // 還原真實玩家的衍生值並刷新 UI（同 buildAlly）
    ally._recompN = (ally._recompN || 0) + 1;   // 🔮 v2.6.7：ally.d 已就地重建→遞增計數，讓 alliesTick 幻覺光環還原守衛偵測到本回合重算（避免把光環當基底扣掉）
    if (ok) { _applyMercCubeRes(ally); let _rm = royalAllyMult(); if (_rm !== 1) { ally.mhp = Math.max(1, Math.floor((ally.mhp || 1) * _rm)); ally.mmp = Math.floor((ally.mmp || 0) * _rm); } ally.curHp = Math.max(1, Math.min(_keepHp != null ? _keepHp : ally.mhp, ally.mhp || 1)); ally.mp = Math.min(_keepMp != null ? _keepMp : ally.mmp, ally.mmp || 0); }   // 🔮 v2.7.96 立方抗性 rider；👑 王族魅力加成：升級重算後重新套用 HP/MP ×(1+魅力/100)
}
// 城鎮 NPC：召喚/解除協力角色
function allyCost(slotN) { let sum = slotSummary(slotN); return sum ? (sum.lv || 1) * 10000 : 0; }   // 招募費用 = 角色等級 × 10000
// 🤝 v2.6.72 重新招募費率曲線（用戶指定錨點）：Lv1＝原價 1/10、Lv50＝1/5、Lv100＝1/2，中間等級分段幾何級數插值
//    1~50：0.1 × 2^((lv−1)/49)（0.1→0.2）；50~100：0.2 × 2.5^((lv−50)/50)（0.2→0.5）——三錨點精確、中間平滑遞增
function mercRehireMult(lv) {
    lv = Math.max(1, Math.min(100, Math.floor(lv || 1)));
    return (lv <= 50) ? 0.1 * Math.pow(2, (lv - 1) / 49) : 0.2 * Math.pow(2.5, (lv - 50) / 50);
}
function mercRehireCost(lv) { return Math.floor((lv || 1) * 10000 * mercRehireMult(lv)); }   // 重新招募費用 = 原價(lv×10000) × 曲線費率
// 🤝 v2.6.72 重新招募：一鍵「結算累積經驗（記入待領帳本）＋以來源存檔最新狀態重建戰力快照」。個別解散另由 dismissAlly 處理。
function rehireAlly(slotN) {
    slotN = String(slotN);
    let cur = (player.allies || []).find(a => a && a._slot === slotN);
    if (!cur) return;
    snapshotMercPrefs(cur);   // 🤝 v3.4.23 重新招募前記住現有喝水＋技能設定（同一角色重建後由 buildAlly 還原）
    // 🤝 v3.4.23 來源存檔位已換成新角色（enSeed 不同）→ 不重建、直接解散（不收費·設定已記憶·結算待領經驗）
    { let _curSeed = _slotCharEnSeed(slotN);
      if (cur.enSeed && _curSeed && _curSeed !== cur.enSeed) {
        let m0 = _settleAllyExp(cur, 'dismiss');
        player.allies = player.allies.filter(a => a && a._slot !== slotN);
        logSys(`<span class="text-amber-300">存檔 ${slotN} 已建立新角色，原傭兵 ${cur._allyName} 已解散（未收費）。</span>${m0 ? ' ' + m0 : ''}`);
        saveGame(); updateUI();
        let _c0 = document.getElementById('interaction-content'); if (_c0) renderAllyNPC(_c0);
        return;
      } }
    let sum = slotSummary(slotN);
    if (!sum) {   // 來源存檔已不存在 → 無法重建，結算後解散（不收費）
        let m0 = _settleAllyExp(cur, 'dismiss');
        player.allies = player.allies.filter(a => a && a._slot !== slotN);
        logSys(`<span class="text-amber-300">存檔 ${slotN} 已無可用角色，傭兵已解散。</span>${m0 ? ' ' + m0 : ''}`);
    } else {
        let cost = mercRehireCost(sum.lv || 1);
        if ((player.gold || 0) < cost) { logSys(`<span class="text-red-400">重新招募 ${sum.name || ''}（Lv.${sum.lv}）需要 ${cost.toLocaleString()} 金幣，你的金幣不足。</span>`); return; }
        let m = _settleAllyExp(cur, 'rehire');   // 🤝 結算：累積經驗記入待領帳本（該角色下次載入/回村領取）
        let fresh = buildAlly(slotN);
        if (!fresh) {   // 重建失敗（角色不可用）→ 已結算，直接解散、不收費
            player.allies = player.allies.filter(a => a && a._slot !== slotN);
            logSys(`<span class="text-amber-300">存檔 ${slotN} 無法重新招募（角色不可用），傭兵已解散（未收費）。</span>${m ? ' ' + m : ''}`);
        } else {
            player.gold -= cost;
            let idx = player.allies.findIndex(a => a && a._slot === slotN);
            if (idx !== -1) player.allies[idx] = fresh; else player.allies.push(fresh);
            logSys(`<span class="text-emerald-300 font-bold">花費 ${cost.toLocaleString()} 金幣重新招募 ${fresh._allyName}（存檔 ${slotN}，Lv.${sum.lv}），戰力快照已更新。</span>${m ? ' ' + m : ''}`);
        }
    }
    saveGame(); updateUI();
    let _c = document.getElementById('interaction-content'); if (_c) renderAllyNPC(_c);
}
// ===== 🤝 v2.6.68 傭兵經驗「待領帳本」（取代 解雇直接改寫來源存檔＋v2.6.42 storage 訊號廣播）=====
// 設計：解散傭兵或「隊長回村」時，只把累積經驗寫成一筆獨立待領紀錄（唯一編號/來源隊伍/傭兵存檔身分/經驗/時間），
//       絕不直接改寫來源角色存檔；該角色下次「載入遊戲或回村」時自動一次領取所有未領紀錄並標記已結算（同一筆只領一次）。
//       寫入與領取皆走跨分頁鎖（localStorage token 鎖·5 秒逾時防死鎖）→ 同一時間只有一個分頁能改帳本；
//       開十個分頁最多產生十筆待領紀錄，不會十個分頁一起改寫同一份角色存檔。戰力快照與經驗結算完全分離（快照維持招募當下）。
const MERC_LEDGER_KEY = 'fb5_merc_exp_ledger';
const MERC_LEDGER_LOCK_KEY = 'fb5_merc_exp_ledger_lock';
const MERC_LEDGER_LOCK_TTL = 5000;                         // 鎖逾時：持鎖分頁當機/被關 → 5 秒後他人可搶（正常操作持鎖僅數毫秒）
const MERC_LEDGER_KEEP_CLAIMED = 7 * 24 * 3600 * 1000;     // 已領紀錄保留 7 天供查帳後清除
const MERC_LEDGER_KEEP_UNCLAIMED = 90 * 24 * 3600 * 1000;  // 未領紀錄保留 90 天（角色被刪除/改名則永遠領不到→到期清除）
let _mercLockToken = null;   // 🛡️ v2.6.69 審計#18：臨界區期間的持鎖 token（寫入前再驗一次·縮小 TOCTOU 窗口＋TTL 被奪鎖時中止續寫）
function _mercLedgerLocked(fn) {   // 跨分頁鎖：搶到→執行 fn 回 true；搶不到→回 false（呼叫端排程重試）。set 後回讀驗 token＝雙寫競態後寫者勝、自己沒搶到就讓出。
    let token = 'T' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e9).toString(36);
    try {
        let cur = localStorage.getItem(MERC_LEDGER_LOCK_KEY);
        if (cur) { let ts = parseInt(cur.split('|')[1] || '0', 10); if (Date.now() - ts < MERC_LEDGER_LOCK_TTL) return false; }   // 他分頁持鎖未逾時
        localStorage.setItem(MERC_LEDGER_LOCK_KEY, token + '|' + Date.now());
        let chk = localStorage.getItem(MERC_LEDGER_LOCK_KEY);
        if (!chk || chk.indexOf(token) !== 0) return false;
    } catch (e) { return false; }
    _mercLockToken = token;
    try { fn(); } finally { _mercLockToken = null; try { let c2 = localStorage.getItem(MERC_LEDGER_LOCK_KEY); if (c2 && c2.indexOf(token) === 0) localStorage.removeItem(MERC_LEDGER_LOCK_KEY); } catch (e) {} }
    return true;
}
function _mercLedgerHoldingLock() {   // 🛡️ 寫入前最終驗證：鎖仍是自己的（防 set/verify 交錯競態與 TTL 被奪後續寫）
    try { let c = localStorage.getItem(MERC_LEDGER_LOCK_KEY); return !!(c && _mercLockToken && c.indexOf(_mercLockToken) === 0); } catch (e) { return false; }
}
function _mercLedgerRead() { try { let raw = _lzGet(MERC_LEDGER_KEY); let a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function _mercLedgerWrite(list) {   // 寫回＋清理（呼叫端須在 _mercLedgerLocked 內）；回 true=寫入成功、false=鎖已失守/儲存失敗（呼叫端須視為失敗重試）
    if (!_mercLedgerHoldingLock()) return false;   // 🛡️ 審計#18：鎖被奪→放棄本次寫入（不覆蓋他人資料）
    let now = Date.now();
    list = (list || []).filter(r => r && (r.claimed ? (now - (r.claimedAt || 0)) < MERC_LEDGER_KEEP_CLAIMED : (now - (r.ts || now)) < MERC_LEDGER_KEEP_UNCLAIMED));
    try { _lzSet(MERC_LEDGER_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
}
let _mercLedgerOutbox = [];   // 搶鎖失敗的待寫紀錄（記憶體暫存＋鏡像進 player 隨 saveGame 入檔·重載補寫·uid 冪等）
function _mercSyncPlayerOutbox() {   // 🛡️ 審計#8：outbox 鏡像到 player.mercLedgerOutbox → saveGame 帶入存檔，關分頁不遺失、重載後 loadGame 補 flush
    try { if (player && player.cls) player.mercLedgerOutbox = _mercLedgerOutbox.slice(); } catch (e) {}
}
function _mercLedgerFlush() {
    if (!_mercLedgerOutbox.length) { _mercSyncPlayerOutbox(); return; }
    let batch = _mercLedgerOutbox;
    let wrote = false;
    let ok = _mercLedgerLocked(() => {
        let led = _mercLedgerRead();
        let have = new Set(led.map(r => r && r.uid));
        batch.forEach(r => { if (r && r.uid && !have.has(r.uid)) { led.push(r); have.add(r.uid); } });   // 🛡️ uid 去重：重送/重載補寫皆冪等
        wrote = _mercLedgerWrite(led);
        if (wrote) {   // 🛡️ 審計#18 寫後驗證：批次 uid 全數存在才算成功（同刻被他分頁覆蓋→重試自癒）
            let have2 = new Set(_mercLedgerRead().map(r => r && r.uid));
            if (!batch.every(r => !r || have2.has(r.uid))) wrote = false;
        }
    });
    if (ok && wrote) { _mercLedgerOutbox = []; _mercSyncPlayerOutbox(); }
    else setTimeout(_mercLedgerFlush, 1500 + Math.floor(Math.random() * 1000));   // 隨機退避重試
}
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pagehide', () => { try { _mercLedgerFlush(); } catch (e) {} });   // 🛡️ 審計#8：關分頁前最後一次 flush（失敗仍有 player 鏡像兜底）
// 🩹 v3.0.108 新角色覆蓋某存檔位→清除該存檔位的所有待領傭兵經驗（屬前一個角色·新角色不繼承）。掛點＝js/13 startGame（創角完成寫檔前）。
function mercLedgerPurgeSlot(slotN) {
    try {
        slotN = String(slotN);
        _mercLedgerOutbox = _mercLedgerOutbox.filter(r => !r || String(r.slot) !== slotN);   // 先清尚未 flush 的待寫紀錄
        _mercSyncPlayerOutbox();
        _mercLedgerLocked(() => {                                                             // 再清 localStorage 帳本（跨分頁鎖內）
            let led = _mercLedgerRead();
            let kept = led.filter(r => !r || String(r.slot) !== slotN);
            if (kept.length !== led.length) _mercLedgerWrite(kept);
        });
    } catch (e) {}
}
// 🤝 結算＝建立一筆待領紀錄（解散 reason='dismiss'／隊長回村 reason='town'）。只歸零 _expGained 計數，不動來源存檔、不動戰力快照；
//    回村結算後傭兵留在隊上繼續累積下一筆。回傳 logSys 訊息片段（無累積經驗→''）。
function _settleAllyExp(ally, reason) {
    try {
        if (!ally) return '';
        let banked = Math.floor(ally._expGained || 0);
        if (banked <= 0) return '';
        let rec = {
            uid: 'MX' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e9).toString(36),                            // 唯一編號
            party: (player && player.name ? player.name : '?') + '@' + (typeof currentSlot !== 'undefined' ? currentSlot : '?'),   // 來源隊伍（隊長名@存檔位）
            slot: String(ally._slot), cls: ally.cls, name: ally.name || '', enSeed: ally.enSeed || '',                     // 傭兵存檔身分（領取時比對；enSeed＝唯一角色識別·防同存檔位重新創角誤領）
            exp: banked, ts: Date.now(), reason: reason || 'dismiss', claimed: false
        };
        ally._expGained = 0;
        _mercLedgerOutbox.push(rec); _mercSyncPlayerOutbox(); _mercLedgerFlush();   // 🛡️ 審計#8：先鏡像進 player 再 flush（flush 失敗時 saveGame 會把待寫紀錄帶進存檔）
        return `<span class="text-emerald-300">${ally._allyName} 累積的 ${banked.toLocaleString()} 經驗已記入待領帳本（該角色下次載入或回村時領取）。</span>`;
    } catch (e) { return ''; }
}
// 🤝 隊長回村：所有上場傭兵各記一筆待領經驗（不解散·不改來源存檔·戰力快照不動）
function mercBankAlliesAtTown() {
    try {
        let _n = 0;
        ((player && player.allies) || []).forEach(a => { let m = _settleAllyExp(a, 'town'); if (m) { logSys(m); _n++; } });
        if (_n > 0) { try { saveGame(); } catch (e) {} }   // 🛡️ v2.6.69 修（審計#2）：立即固化 _expGained=0；否則「進村→關分頁→重載」會把同一筆經驗重複記帳＝無限刷
    } catch (e) {}
}
// 🤝 領取：本分頁目前角色（currentSlot＋同職業＋同名三重守衛）的所有未領紀錄→鎖內標記已結算→套用升級曲線→存檔。
//    掛點：回村/回城（changeMap 村莊分支·loadGame 一律回家鄉村莊故載入亦觸發）。鎖被占→隨機退避重試（最多 5 次）。
function mercExpClaimPending(_retry) {
    try {
        if (!player || !player.cls || typeof currentSlot === 'undefined' || currentSlot == null) return;
        let total = 0, _writeFail = false;
        let ok = _mercLedgerLocked(() => {
            let led = _mercLedgerRead(), hit = false;
            led.forEach(r => {
                if (!r || r.claimed) return;
                if (String(r.slot) !== String(currentSlot) || r.cls !== player.cls || (r.name || '') !== (player.name || '')) return;   // 🛡️ 三重守衛：防換角/刪角誤領
                if (r.enSeed && player.enSeed && r.enSeed !== player.enSeed) return;   // 🩹 v3.0.108 enSeed 唯一角色識別：同存檔位+同名+同職業但實為「重新創角的不同角色」→enSeed 不同→不誤領（舊紀錄無 enSeed 則沿用三重守衛）
                total += Math.max(0, Math.floor(r.exp || 0));
                r.claimed = true; r.claimedAt = Date.now(); hit = true;   // 標記已結算：同一筆只能領一次（跨分頁由鎖保證）
            });
            if (hit && !_mercLedgerWrite(led)) { total = 0; _writeFail = true; }   // 🛡️ 審計#18：寫入失敗（鎖失守）→ 不套用經驗、走重試（帳本未標記＝下次可重領）
        });
        if (!ok || _writeFail) { if ((_retry || 0) < 5) setTimeout(() => mercExpClaimPending((_retry || 0) + 1), 1200 + Math.floor(Math.random() * 800)); return; }
        if (total <= 0) return;
        let before = player.lv || 1;
        player.exp = (player.exp || 0) + total;
        while ((player.lv || 1) < 100 && player.exp >= getExpReq(player.lv)) { player.exp -= getExpReq(player.lv); player.lv++; if (player.lv >= 50) player.bonus = (player.bonus || 0) + 1; }   // 比照 checkLvUp 升級曲線
        if ((player.lv || 1) >= 100) player.exp = 0;   // 滿等不留溢出經驗
        let gained = (player.lv || 1) - before;
        if (gained > 0) { try { calcStats(); } catch (e) {} }
        try { saveGame(); } catch (e) {}   // 領取後立即存檔：本檔快照已含此經驗
        try { updateUI(); } catch (e) {}
        logSys(`<span class="text-emerald-300 font-bold">傭兵出征經驗 +${total.toLocaleString()}</span>${gained > 0 ? `<span class="text-emerald-300">，升 ${gained} 級至 Lv.${player.lv}！</span>` : ''}`);
    } catch (e) {}
}
function toggleAlly(slotN) {
    slotN = String(slotN);
    if (!player.allies) player.allies = [];
    if (isAllyActive(slotN)) {
        let _dis = player.allies.find(a => a && a._slot === slotN);
        if (_dis) snapshotMercPrefs(_dis);   // 🤝 v3.4.23 解散前記住喝水＋技能設定，供同一角色再次招募時還原
        let _expMsg = _dis ? _settleAllyExp(_dis, 'dismiss') : '';   // 🤝 v2.6.68 解雇＝記一筆待領經驗（帳本制·不直接改寫來源存檔）
        player.allies = player.allies.filter(a => a && a._slot !== slotN);
        logSys(`協力傭兵（存檔 ${slotN}）已解散（招募費用不退還）。${_expMsg}`);
    } else {
        let _allyCap = allyActiveCap();
        if ((player.allies.length || 0) >= _allyCap) {   // 🔧 同時上場上限：全職業 3 名（王族原 3＋魅力/15 封頂 7 已取消，改吃 royalAllyMult 魅力加成）
            logSys(`<span class="text-red-400">協力傭兵最多同時上場 ${_allyCap} 名，請先解除一名再招募。</span>`);
            saveGame(); updateUI();
            let _c2 = document.getElementById('interaction-content'); if(_c2) renderAllyNPC(_c2);
            return;
        }
        let sum = slotSummary(slotN);
        if (!sum) { logSys(`<span class="text-red-400">存檔 ${slotN} 沒有可用的角色。</span>`); }
        else if (!!sum.classic !== !!player.classicMode) {   // 🎮 一般／經典 不可跨模式招募（🏛️v3.0.83 傳統已取消·舊傳統存檔依 classicMode 歸類）
            logSys(`<span class="text-red-400">只能招募與本角色「相同模式（一般／經典）」的存檔傭兵。</span>`);
        }
        else {
            let cost = (sum.lv || 1) * 10000;
            if ((player.gold || 0) < cost) { logSys(`<span class="text-red-400">招募 ${sum.name}（Lv.${sum.lv}）需要 ${cost.toLocaleString()} 金幣，你的金幣不足。</span>`); }
            else {
                let a = buildAlly(slotN);
                if (!a) { logSys(`<span class="text-red-400">存檔 ${slotN} 沒有可用的角色。</span>`); }
                else { player.gold -= cost; player.allies.push(a); logSys(`<span class="text-emerald-300 font-bold">花費 ${cost.toLocaleString()} 金幣招募 ${a._allyName}（存檔 ${slotN}，Lv.${sum.lv}）加入作戰！</span>`); }
            }
        }
    }
    saveGame(); updateUI();
    let _c = document.getElementById('interaction-content'); if(_c) renderAllyNPC(_c);
}
// 🤝 個別解散：保留重新招募按鈕，僅解除指定傭兵；實際經驗結算、存檔與畫面更新沿用 toggleAlly 的既有流程。
function dismissAlly(slotN) {
    slotN = String(slotN);
    let ally = (player.allies || []).find(a => a && String(a._slot) === slotN);
    if (!ally) {
        logSys(`<span class="text-slate-400">存檔 ${slotN} 的協力傭兵目前不在隊伍中。</span>`);
        let _c0 = document.getElementById('interaction-content'); if (_c0) renderAllyNPC(_c0);
        return;
    }
    let name = ally._allyName || `存檔 ${slotN}`;
    if (!confirm(`確定要解散協力傭兵「${name}」嗎？\n（招募費用不退還，累積經驗會記入待領帳本，該角色下次載入或回村時領取）`)) return;
    toggleAlly(slotN);
}
function renderAllyNPC(div) {
    let rows = allySlotList().map(n => {
        let sum = slotSummary(n);
        let active = isAllyActive(n);
        if (!sum) return `<div class="w-full text-left py-2 px-3 text-sm bg-slate-900/60 border border-slate-700 rounded opacity-60">存檔 ${n}：<span class="text-slate-500">（空）</span></div>`;
        let _classic = !!sum.classic;                                  // 🎮 經典模式存檔
        let _modeMatch = (_classic === !!player.classicMode);          // 🎮 只能招募與自己同模式（一般/經典）的存檔（🏛️v3.0.83 傳統已取消）
        let _tag = _classic ? '<span style="color:#fbbf24;font-weight:bold;">⚔經典</span> ' : '';
        let _nameStyle = _classic ? 'style="color:#fbbf24;"' : 'class="text-amber-300"';
        let _btn = active
            ? `<div class="flex flex-wrap justify-end gap-1.5 shrink-0">
                    <button onclick="rehireAlly('${n}')" class="btn py-1 px-3 text-sm font-bold bg-sky-900 border-sky-700 text-sky-200" title="結算累積經驗（記入待領帳本，該角色下次載入或回村時領取）並以最新存檔重建戰力快照">重新招募　${mercRehireCost(sum.lv || 1).toLocaleString()}金</button>
                    <button onclick="dismissAlly('${n}')" class="btn py-1 px-3 text-sm font-bold bg-red-950 border-red-700 text-red-200" title="只解散這名協力傭兵（招募費用不退還，累積經驗會記入待領帳本）">解散</button>
               </div>`
            : (_modeMatch
                ? `<button onclick="toggleAlly('${n}')" class="btn py-1 px-4 text-sm font-bold bg-emerald-900 border-emerald-700 text-emerald-200">召喚　${((sum.lv||1)*10000).toLocaleString()}金</button>`
                : `<span class="text-xs text-slate-500 px-2 text-right">非同模式存檔<br>不可招募</span>`);
        // 🔋 出戰中傭兵剩餘資源：騎士/戰士(純物理)不顯示；龍騎士以 HP 為資源(技能吃HP)；其餘職業顯示 MP
        let _res = '';
        if (active) {
            let _la = (player.allies || []).find(a => a && String(a._slot) === String(n));
            if (_la) {
                if (_la.cls === 'dragon') _res = `　<span class="text-rose-300 font-bold">HP ${Math.max(0, Math.floor(_la.curHp||0))}/${Math.floor(_la.mhp||0)}</span>`;
                else if (_la.cls !== 'knight' && _la.cls !== 'warrior') _res = `　<span class="text-sky-300 font-bold">MP ${Math.max(0, Math.floor(_la.mp||0))}/${Math.floor(_la.mmp||0)}</span>`;
            }
        }
        return `<div class="flex items-center justify-between gap-2 bg-slate-800/60 border ${_classic ? 'border-amber-600/70' : 'border-slate-600'} rounded p-3 text-sm">
            <span>${_tag}存檔 ${n}：<b ${_nameStyle}>${sum.cls} Lv.${sum.lv}</b>　${sum.name}${_res}</span>
            ${_btn}
        </div>`;
    }).join('');
    div.innerHTML = `<div class="flex flex-col gap-3 p-1">
        <div class="text-slate-300 text-sm leading-relaxed">招募其他存檔位的角色一起作戰，<b class="text-amber-300">費用＝該角色等級 × 10000 金幣</b>。協力傭兵戰鬥中不會陣亡，<b class="text-emerald-300">你死亡並回城／原地復活後仍會留在身邊，可使用各傭兵旁的「解散」或「⚠ 全員退出」（費用不退還）</b>；存讀檔不會使其消失。法師以魔法、妖精以弓/三重矢、騎士以物理（含看破/殺戮）出手。<br><span class="text-slate-400">提示：點「重新招募」可隨時結算傭兵累積經驗（記入待領帳本）並以最新存檔更新戰力快照；點「解散」只會解除該名傭兵並結算其累積經驗。重新招募費用依等級為原價的 1/10（Lv1）~ 1/5（Lv50）~ 1/2（Lv100）曲線遞增。</span></div>
        <div class="flex items-center justify-between gap-2">
            <div class="text-sm">你的金幣：<span class="text-yellow-400 font-bold">${(player.gold||0).toLocaleString()}</span></div>
            ${(player.allies||[]).length ? `<button onclick="dismissAllAllies()" class="btn py-1 px-3 text-xs font-bold bg-red-950 border-red-700 text-red-200" title="解除目前全部協力傭兵（含異常卡住、找不到對應存檔的傭兵）">⚠ 全員退出（${(player.allies||[]).length}）</button>` : ''}
        </div>
        ${rows}
    </div>`;
}
// 🔧 全員退出：無條件清空 player.allies（含 _slot 對不到任何存檔列、卡在場上無法解除的傭兵）。player.allies 是傭兵唯一真相（isAllyActive/alliesTick 皆讀它），清空即完全脫困。
function dismissAllAllies() {
    let n = (player.allies || []).length;
    if (!n) { logSys('<span class="text-slate-400">目前沒有上場的協力傭兵。</span>'); return; }
    if (!confirm(`確定要解除全部 ${n} 名協力傭兵嗎？\n（招募費用不退還，累積經驗會記入待領帳本，各角色下次載入或回村時領取）`)) return;
    (player.allies || []).forEach(a => { snapshotMercPrefs(a); let m = _settleAllyExp(a, 'dismiss'); if (m) logSys(m); });   // 🤝 v3.4.23 先記住各傭兵設定 + v2.6.68 各自記一筆待領經驗（帳本制·不直接改寫來源存檔）
    player.allies = [];
    logSys(`<span class="text-amber-300">已解除全部協力傭兵（共 ${n} 名）。</span>`);
    saveGame(); updateUI();
    let _c = document.getElementById('interaction-content'); if (_c) renderAllyNPC(_c);
}
// 🔧 召喚控制戒指（acc_summon_ctrl）：裝備於任一戒指欄即生效——v3.2.19 起改為開啟召喚術選怪選單＋部分階級數量上限提高（骰19命中加成已移除·v3.2.42 修正過期註解）
function hasSummonCtrlRing(owner) {
    owner = owner || player;   // 🩸 v2.6.25 owner 參數化：讀 owner.eq（傭兵召喚控制戒指亦生效）
    let eq = owner.eq || {};
    let r1 = eq.ring1, r2 = eq.ring2, r3 = eq.ring3, r4 = eq.ring4;
    return !!((r1 && r1.id === 'acc_summon_ctrl') || (r2 && r2.id === 'acc_summon_ctrl') || (r3 && r3.id === 'acc_summon_ctrl') || (r4 && r4.id === 'acc_summon_ctrl'));
}
