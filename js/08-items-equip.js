// 🥚 遺物蛋 → 孵出的寵物（單一真相·useItem 的分派表）：eff 欄位對應 js/00 的 relic_*_egg 定義，pet 必須是 js/22 PET_BOOK 既有型態名。
//    aura＝碎裂訊息中的氣息名（「蛋殼在○○的氣息中碎裂……」）。新增蛋＝這裡加一列即可，分派邏輯不必動。
const RELIC_EGG_PETS = {
    cursedegg:   { pet: '詛咒蜥蜴', aura: '詛咒' },
    doomegg:     { pet: '厄運蜥蜴', aura: '厄運' },
    doomsdayegg: { pet: '破滅蜥蜴', aura: '破滅' },
    calamityegg: { pet: '災厄蜥蜴', aura: '災厄' }
};

// 戰鬥掉落的 gainItem 熱路徑：同一背包以完整 itemSig 建一次索引。
// 補跑與一般戰鬥共用；_lockMergeOff 製作流程仍走原本線性搜尋。未命中一律回退掃描，避免中途改裝造成漏合併。
let _catchupGainItemIndex = null;
let _catchupAutoSortPending = false;
function resetCatchupGainItemIndex() { _catchupGainItemIndex = null; }
function deferCatchupAutoSort() { _catchupAutoSortPending = true; }
function flushCatchupAutoSort() {
    if (!_catchupAutoSortPending) return;
    _catchupAutoSortPending = false;
    try { if (typeof autoSortInventory === 'function') autoSortInventory(); } catch (e) {}
}
function discardCatchupAutoSort() { _catchupAutoSortPending = false; }
function _catchupGainItemIndexActive() {
    return !_lockMergeOff && typeof state !== 'undefined' && !!state.running;
}
function _buildCatchupGainItemIndex() {
    let inv = player && Array.isArray(player.inv) ? player.inv : [];
    let bySig = new Map();
    for (let index = 0; index < inv.length; index++) {
        let item = inv[index];
        if (!item || item.gw) continue;
        let sig = itemSig(item);
        if (!bySig.has(sig)) bySig.set(sig, { item: item, index: index });
    }
    _catchupGainItemIndex = {
        inv: inv,
        length: inv.length,
        first: inv.length ? inv[0] : null,
        last: inv.length ? inv[inv.length - 1] : null,
        bySig: bySig
    };
    return _catchupGainItemIndex;
}
function _findCatchupGainItemStack(probe) {
    let inv = player.inv;
    let cache = _catchupGainItemIndex;
    let first = inv.length ? inv[0] : null;
    let last = inv.length ? inv[inv.length - 1] : null;
    if (!cache || cache.inv !== inv || cache.length !== inv.length || cache.first !== first || cache.last !== last) {
        cache = _buildCatchupGainItemIndex();
    }

    let sig = itemSig(probe);
    let entry = cache.bySig.get(sig);
    if (entry && inv[entry.index] === entry.item && !entry.item.gw && sameItemSig(entry.item, probe)) return entry.item;
    if (entry) cache = _buildCatchupGainItemIndex();
    entry = cache.bySig.get(sig);
    if (entry && inv[entry.index] === entry.item && !entry.item.gw && sameItemSig(entry.item, probe)) return entry.item;

    // 索引未命中仍保留舊路徑，涵蓋補跑讓步期間玩家修改物品簽章的極端情況。
    for (let index = 0; index < inv.length; index++) {
        let item = inv[index];
        if (item && !item.gw && sameItemSig(item, probe)) {
            cache.bySig.set(sig, { item: item, index: index });
            return item;
        }
    }
    return null;
}
function _rememberCatchupGainItemStack(item) {
    let cache = _catchupGainItemIndex;
    let inv = player.inv;
    if (!cache || cache.inv !== inv || cache.length + 1 !== inv.length || inv[inv.length - 1] !== item) {
        resetCatchupGainItemIndex();
        return;
    }
    let index = inv.length - 1;
    let sig = itemSig(item);
    if (!cache.bySig.has(sig)) cache.bySig.set(sig, { item: item, index: index });
    cache.length = inv.length;
    cache.first = inv.length ? inv[0] : null;
    cache.last = item;
}
function gainItem(id, cnt=1, silent=false, forceNormal=false, affixOld=false, deferUi=false, fixedAffixes=null, blessRate=null) {   // ⚠️ 第 7 參供既定詞綴來源；第 8 參供製作等來源指定祝福率
    let _deferCatchupUi = !deferUi && typeof state !== 'undefined' && !!state.ff;
    // 卷軸變祝福／詛咒機率：各 1%（互斥）
    if (!forceNormal && (id === 'scroll_weapon' || id === 'scroll_armor')) {
        let _r = lootRng('scrollvar');   // 🎲 committed RNG（防 SL 重抽卷軸祝福/詛咒變體）
        if (_r < 0.01) id = id + '_b';        // 1% 變成祝福的
        else if (_r < 0.02) id = id + '_c';   // 1% 變成詛咒的
    }

    let d = DB.items[id];
    
    // 安全防護：若資料庫還沒設定 _b 祝福／_c 詛咒卷軸，退回給普通版
    if (!d) {
        id = id.replace('_b', '').replace('_c', '');
        d = DB.items[id];
    }

    if (typeof _itemTransaction !== 'undefined' && _itemTransaction) {
        if (!d || !Number.isSafeInteger(cnt) || cnt <= 0) _itemTransactionAbort('無效的製作或兌換獎勵');
    }

    // 🗡️ 裝備收集冊：獲得任何武器/防具/飾品(非箭矢)即登錄圖鑑（永久·只增不減）
    if (typeof registerEquipObtained === 'function') registerEquipObtained(id);
    // 🧰 道具收集冊：獲得任何可分類道具即登錄（藥水/卷軸/技能書/材料/其他）
    if (typeof registerMiscObtained === 'function') registerMiscObtained(id);
    // 🏺 遺物收集冊：獲得任何遺物即登錄（獨立圖鑑）
    if (typeof registerRelicObtained === 'function') registerRelicObtained(id);

    // 🔧 持有上限 maxHold（如精靈的私語=10）：裁切本次獲得量使總持有不超過上限；已達上限則不獲得
    if (d && d.maxHold) {
        let _inTxn = typeof _itemTransaction !== 'undefined' && _itemTransaction;
        let _held = player.inv.reduce((s, i) => s + (i.id === id ? (_inTxn ? _itemTransactionCount(i.cnt) : (i.cnt || 0)) : 0), 0);
        if (_inTxn && _held + cnt > d.maxHold) _itemTransactionAbort('獎勵超過持有上限');
        if (_held >= d.maxHold) return null;
        if (_held + cnt > d.maxHold) cnt = d.maxHold - _held;
    }

    let bless = false;
    let anc = false;
    let attr = false;   
    
    if (!forceNormal && !_noAffixCtx && d && !isRelic(d) && ((d.type === 'wpn' && !d.isArrow) || d.type === 'arm' || d.type === 'acc')) {   // 🦴 _noAffixCtx：白板（寵物裝備製作）→ 不附詞綴；🏺 遺物永不附詞綴（不會祝福/賦予）
        // 詞綴：一般頭目與製作 10%；席琳頭目 20%、瘋狂席琳頭目 30%；其他來源基礎 1%。箭矢/遺物/白板不附加。
        //   🗑️ v3.5.87 舊制 rollAffixesOld 已刪（與新制 byte-identical·affixOld 參數棄用不再分派）
        let _af = (fixedAffixes && typeof fixedAffixes === 'object')
            ? { attr: !!fixedAffixes.attr, bless: fixedAffixes.bless === 'cursed' ? 'cursed' : !!fixedAffixes.bless, anc: !!fixedAffixes.anc }
            : rollAffixesNew(Number.isFinite(blessRate) ? blessRate : ((_lootMobInfo && _lootMobInfo.boss) ? 0.10 : 0.01));
        attr = _af.attr; bless = _af.bless; anc = _af.anc;
        if (_forceBless) bless = true;   // 🔧 v3.1.27 製作材料含祝福裝備→成品必定祝福（僅在此裝備詞綴分支·寵物白板 _noAffixCtx 已於上方擋掉）
    }

    // 🔮 席琳套裝詞綴：⚠️v3.1.68 起「不再出現於裝備上」——原掉落擲骰(0.1%/0.5%/5%)與席琳製作(_forceSherineSet)附加皆停用。
    //   套裝效果改由「席琳遺骸」承載（gainSherineRemains·killMob 掉落／NPC 伊奧兌換／菈克希絲拆分）；
    //   既有裝備上的舊詞綴保留顯示（名稱前綴/資訊欄）但不再計入套裝件數（recomputeStats 只掃遺骸欄）。
    let seteff = false;

    let _tEn = 0;   // 🏛️ v3.0.83 傳統模式已取消：掉落自帶強化值停用（任何來源恆 +0·手動強化照常）
    let _probe = { id: id, en: _tEn, bless: bless, anc: anc, attr: attr, seteff: seteff };
    // 🔒 v3.6.92 改為「併入鎖定堆疊」（用戶拍板·取代 v3.5.84 的分裂制）：鎖定的物品再次獲得→直接併同一格，
    //    整疊都受鎖定保護（＝要用就得先手動解鎖整疊）。同簽章永遠只有一格是本作現行不變量，
    //    倉庫(js/12 _whStackFind)、載入合併(js/13 consolidateInventory)、上鎖/解鎖(js/10 toggleLock) 皆同口徑。
    //    ⚠️ 唯一例外＝`_lockMergeOff`（js/14 ensureMaterial 製作遞迴補製中間物）：中間物若併進鎖定疊，
    //       invCountId/buildPool 看不到它 → 父層扣不到 → 重演 v3.5.85 的「底層材料被吃掉、中間物卻沒扣」。
    // 🏺 v3.6.44 巨靈的三個願望：獲得瞬間以 committed RNG 從 16 種能力抽 3 個（不重複）存於實體 gw（永不與其他堆疊合併——每只戒指願望各自獨立·calcStats 消費·tooltip 顯示）
    let _gw = null;
    if (id === 'relic_genie_wishes' && d && d.wishRing) {
        let _pool = ['hp60','mp30','md3','rd3','mdmg2','sp6','hpr10','mpr5','dr3','ac3','mr6','str1','dex1','int1','wis1','con1','cha1'];   // 用戶規格 17 項能力
        _gw = [];
        for (let _k = 0; _k < 3; _k++) { let _ri = Math.floor(lootRng('geniewish') * _pool.length); _gw.push(_pool.splice(_ri, 1)[0]); }
    }
    let _fastGainIndex = !_gw && _catchupGainItemIndexActive();
    if (!_fastGainIndex && _catchupGainItemIndex && !(typeof catchupActive === 'function' && catchupActive())) resetCatchupGainItemIndex();
    let ex = _gw ? null : (_fastGainIndex
        ? _findCatchupGainItemStack(_probe)
        : player.inv.find(i => !i.gw && (!_lockMergeOff || !i.lock) && sameItemSig(i, _probe)));   // 🔧 架構#3：統一簽章比對（itemSig 已含 en→+0 只併 +0、+3 只併 +3，永不誤併不同強化值）；⚠️ 巨靈願望戒指(gw)每只獨立·簽章不含 gw 故顯式排除
    if(ex) ex.cnt = (typeof _itemTransaction !== 'undefined' && _itemTransaction)
        ? _itemTransactionCount(_itemTransactionCount(ex.cnt) + cnt) : ex.cnt + cnt;   // 舊存檔缺 cnt 視為 1；交易不得合併出 NaN、字串或溢位
    else { let _push = { id: id, uid: uid(), cnt: cnt, en: _tEn, bless: bless, anc: anc, attr: attr, seteff: seteff, lock: false, junk: !!(player.junkPrefs && player.junkPrefs[itemSig(_probe)]) && !(d && d.noJunk) }; if (_gw) _push.gw = _gw; player.inv.push(_push); if (_fastGainIndex) _rememberCatchupGainItemStack(_push); }   // 🔧 廢品記憶改以完整簽章比對：詞綴物品也可自動標記，但僅限「完全相同詞綴」者；🎴 noJunk(收集冊)永不自動標記

    // 紀錄這次產生的物品屬性
    let itemInfo = { id: id, cnt: cnt, en: _tEn, bless: bless, anc: anc, attr: attr, seteff: seteff };
    
    if (!silent && d) {
        // ✦ v3.6.69 物品日誌亮點：只有「傳說」與「遺物」才加亮點提示（傳說＝琥珀橘 c-legend／遺物＝海藍 c-relic）。
        //   ⚠️ 一般掉落刻意維持 sys-item-gain 的統一米色（css 有 `#sys-log .sys-item-gain *` 的 !important 全域壓色），
        //      因此稀有名稱必須另掛 sys-drop-rare 才不被壓成同色 —— 加 class 後務必實機量 computed 色。
        let _rare = d.relic ? 'relic' : (d.legend ? 'legend' : '');
        let _nameHtml = _rare
            ? `<span class="sys-drop-rare sys-drop-${_rare}">✦ ${getItemFullName(itemInfo)}</span>`
            : `<span class="font-bold">${getItemFullName(itemInfo)}</span>`;
        // 🐾 擊殺掉落來源怪物存在時→「怪名 給你 物品名 。」；其餘來源(商店/製作/NPC 兌換)維持「獲得物品:」
        if (_lootMobInfo) {
            let _mc = (typeof getMobColor === 'function') ? getMobColor(_lootMobInfo.lv) : '';
            logSys(`<span class="sys-item-gain"><span class="${_mc}">${_lootMobInfo.n}</span> 給你 ${_nameHtml} 。</span>`, _rare);
        } else {
            logSys(`<span class="sys-item-gain">獲得物品: ${_nameHtml}</span>`, _rare);
        }
    }
    if (!deferUi && !_deferCatchupUi) renderTabs();
    if(DB.items[id] && DB.items[id].grantSkills) { calcStats(); renderSkillSelects(); }   // 取得授予技能的頭盔：立即生效
    
    if(typeof auditTrackGain === 'function') auditTrackGain(itemInfo);   // 統計：掉落計數
    try { if (_vfxLootCtx && d && d.gachaWeight === 1 && typeof vfxRareDrop === 'function') vfxRareDrop(d.n); } catch(e){}   // ✨ VFX：潘朵拉權重=1 的稀有掉落金色閃光
    try {
        if (_deferCatchupUi) deferCatchupAutoSort();
        else if (!deferUi && typeof autoSortInventory === 'function') autoSortInventory();
    } catch (e) {}   // 🔧 v2.6.73 獲得物品時自動排列背包（每 10 秒最多 1 次·節流在函式內）；補跑掉落則統一延到結束後只排一次
    return itemInfo; // 👈 讓拉霸機可以讀取最終產生的物品
}

// 🦴 v3.1.68 取得席琳遺骸（唯一入口：killMob 掉落／NPC 伊奧兌換／菈克希絲拆分）：
//   remId＝SHERINE_REMAINS 的物品 id（rem_claw…rem_scale）、group＝席琳詞綴組名（SHERINE_EFFECTS 之一）。
//   比照 gainItem 的簽章疊加：同部位同詞綴自動疊 cnt（itemSig 已含 seteff→魔女之爪與紅獅之爪分開堆）。
function gainSherineRemains(remId, group, silent) {
    let d = DB.items[remId];
    if (!d || !group) return null;
    let _probe = { id: remId, en: 0, bless: false, anc: false, attr: false, seteff: group };
    let ex = player.inv.find(i => sameItemSig(i, _probe));   // 🔒 v3.6.92 同上：併入鎖定堆疊（遺骸不是製作中間物·無 _lockMergeOff 需求）
    if (ex) ex.cnt += 1;
    else player.inv.push({ id: remId, uid: uid(), cnt: 1, en: 0, bless: false, anc: false, attr: false, seteff: group, lock: false, junk: false });
    let itemInfo = { id: remId, cnt: 1, en: 0, bless: false, anc: false, attr: false, seteff: group };
    if (!silent) logSys(`<span class="c-sherine font-bold">✦ 獲得席琳遺骸：${getItemFullName(itemInfo)}！</span>`);
    renderTabs();
    if (typeof auditTrackGain === 'function') auditTrackGain(itemInfo);
    return itemInfo;
}

// ===== 🔥 屬性詞綴定義（v3.0.77 屬性強化系統改版：4 屬性 × 5 階，只能存在於武器） =====
// dmg = 額外傷害+N；mp = 額外魔法點數+N（N＝1/3/5/7/9，走 recompute d.extraDmg/d.extraMp·玩家＋傭兵 buildAlly 共用）
// ele = 一般攻擊轉變的屬性（剋制走 elementCounterMult ×1.4/×0.6）；tier = 階級（第4階需武器+10、第5階需+11，見 doBianAttr）
// 取得途徑＝屬性強化卷軸（四元素·怪物掉落）於象牙塔『碧恩』賦予，每次 7% 獨立事件，失敗僅消耗卷軸
const ATTR_AFFIX = {
    fr1: { n: '火之',     ele: 'fire',  tier: 1, dmg: 1, mp: 1 },
    fr2: { n: '爆炎',     ele: 'fire',  tier: 2, dmg: 3, mp: 3 },
    fr3: { n: '火靈',     ele: 'fire',  tier: 3, dmg: 5, mp: 5 },
    fr4: { n: '赤炎',     ele: 'fire',  tier: 4, dmg: 7, mp: 7 },
    fr5: { n: '帕格里奧', ele: 'fire',  tier: 5, dmg: 9, mp: 9 },
    wa1: { n: '水之',     ele: 'water', tier: 1, dmg: 1, mp: 1 },
    wa2: { n: '海嘯',     ele: 'water', tier: 2, dmg: 3, mp: 3 },
    wa3: { n: '水靈',     ele: 'water', tier: 3, dmg: 5, mp: 5 },
    wa4: { n: '霜凍',     ele: 'water', tier: 4, dmg: 7, mp: 7 },
    wa5: { n: '伊娃',     ele: 'water', tier: 5, dmg: 9, mp: 9 },
    wi1: { n: '風之',     ele: 'wind',  tier: 1, dmg: 1, mp: 1 },
    wi2: { n: '暴風',     ele: 'wind',  tier: 2, dmg: 3, mp: 3 },
    wi3: { n: '風靈',     ele: 'wind',  tier: 3, dmg: 5, mp: 5 },
    wi4: { n: '蒼蘭',     ele: 'wind',  tier: 4, dmg: 7, mp: 7 },
    wi5: { n: '沙哈',     ele: 'wind',  tier: 5, dmg: 9, mp: 9 },
    ea1: { n: '地之',     ele: 'earth', tier: 1, dmg: 1, mp: 1 },
    ea2: { n: '崩裂',     ele: 'earth', tier: 2, dmg: 3, mp: 3 },
    ea3: { n: '地靈',     ele: 'earth', tier: 3, dmg: 5, mp: 5 },
    ea4: { n: '輝岩',     ele: 'earth', tier: 4, dmg: 7, mp: 7 },
    ea5: { n: '馬普勒',   ele: 'earth', tier: 5, dmg: 9, mp: 9 },
};
const ATTR_ELE_PREFIX = { fire: 'fr', water: 'wa', wind: 'wi', earth: 'ea' };   // 元素 → 代碼字首（碧恩賦予/升階用）

// 第5階屬性武器可由同屬性卷軸附加／重抽魔法；同技能升星使觸發率×星數，最高3星，不同技能回到1星。
const ATTR_MAGIC_SKILLS = {
    fire: [
        { skId: 'sk_meteor', rate: 1 }, { skId: 'sk_fire_storm', rate: 2 },
        { skId: 'sk_blaze', rate: 5 }, { skId: 'sk_fireball', rate: 5 },
        { skId: 'sk_firearrow', rate: 10 },
    ],
    water: [
        { skId: 'sk_blizzard', rate: 2 }, { skId: 'sk_ice_lance', rate: 5 },
        { skId: 'sk_chill', rate: 6 }, { skId: 'sk_icearrow', rate: 10 },
        { skId: 'sk_poison_curse', rate: 10 },
    ],
    wind: [
        { skId: 'sk_thunder_storm', rate: 2 }, { skId: 'sk_tornado', rate: 3 },
        { skId: 'sk_thunder', rate: 6 }, { skId: 'sk_windblade', rate: 10 },
        { skId: 'sk_holy_dash', rate: 10 },
    ],
    earth: [
        { skId: 'sk_quake', rate: 2 }, { skId: 'sk_earthquake', rate: 5 },
        { skId: 'sk_rock_prison', rate: 6 }, { skId: 'sk_hell_fang', rate: 10 },
        { skId: 'sk_slow', rate: 10 },
    ],
};
const ATTR_MAGIC_BY_SKILL = (() => {
    let out = {};
    Object.entries(ATTR_MAGIC_SKILLS).forEach(([ele, pool]) => {
        pool.forEach(proc => { out[proc.skId] = { ele, skId: proc.skId, rate: proc.rate }; });
    });
    return out;
})();
function getAttrMagicProc(item) {
    if (!item || typeof item.attrMagic !== 'string') return null;
    let proc = ATTR_MAGIC_BY_SKILL[item.attrMagic] || null;
    let aff = getAttrAffix(item.attr);
    if (!proc || !aff || aff.tier !== 5 || aff.ele !== proc.ele) return null;
    let star = Math.max(1, Math.min(3, Math.floor(Number(item.attrMagicStar) || 1)));
    return { ele: proc.ele, skId: proc.skId, baseRate: proc.rate, star: star, rate: proc.rate * star };
}

// 原生「攻擊／命中時機率觸發」武器不可再附加屬性魔法；卷軸附加的 attrMagic 不列入，才能重抽。
const BASE_TRIGGERED_SKILL_FIELDS = [
    'spellProc', 'procSkill', 'procSkill2', 'procStatusSkill', 'procFireSkillRate',
    'meleeHitSpell', 'onHitCastSkill', 'dragonStrike', 'hitEchoMagic',
    'procPoison', 'procPoisonPct', 'procBurstPoison', 'procBurn', 'procHealFlat',
    'onHitEleDmg', 'windbladeProc', 'qiguProc', 'redSpecter',
    'selfBreakProc', 'procInstakill', 'strawCurse',
];
// 純回魔（mpOnHit／blueSpecter）不屬於觸發技能；指定魔擊／魔爆武器依個別規則放行。
const ATTR_MAGIC_ELIGIBLE_WEAPON_IDS = new Set([
    'wpn_giltas_sword', 'wpn_giltas_wand', 'wpn_strwand', 'wpn_steel_manawand_red', 'wpn_priest_wand',
]);
function weaponHasBaseTriggeredSkill(d, itemId) {
    if (!d) return false;
    if (BASE_TRIGGERED_SKILL_FIELDS.some(key => d[key] != null && d[key] !== false && d[key] !== 0)) return true;
    if (ATTR_MAGIC_ELIGIBLE_WEAPON_IDS.has(itemId)) return false;
    return d.eff === 'moonburst' || d.eff === 'magicstrike' || d.eff === 'magicburst' || d.eff === 'dice_death';
}
// 舊12代碼 → 新代碼（名稱身分不變：火之→fr1、爆炎→fr2、火靈→fr3…）。讀取路徑自動解析（含倉庫舊資料，零寫入）；
// 玩家側（背包/裝備/傭兵）另由 loadGame 一次性實體改寫為新代碼（見 js/13）。
const ATTR_LEGACY = {
    fire1: 'fr1', fire3: 'fr2', fire5: 'fr3', water1: 'wa1', water3: 'wa2', water5: 'wa3',
    wind1: 'wi1', wind3: 'wi2', wind5: 'wi3', earth1: 'ea1', earth3: 'ea2', earth5: 'ea3',
};
// 正規化屬性代碼（舊碼→新碼；非法值→null）
function attrCanon(attr) {
    if (typeof attr !== 'string') return null;
    let c = ATTR_LEGACY[attr] || attr;
    return ATTR_AFFIX[c] ? c : null;
}
// 取得詞綴定義（相容舊存檔：舊12代碼自動映射；attr 為非法值/true 時回傳 null）
function getAttrAffix(attr) {
    let c = attrCanon(attr);
    return c ? ATTR_AFFIX[c] : null;
}
function resolveWeaponElement(affixPresent, affixElement, spellbladeActive, spellbladeElement, baseElement) {
    if (affixPresent) return affixElement;
    if (spellbladeActive && spellbladeElement) return spellbladeElement;
    return baseElement || 'normal';
}
// 武器實際屬性（屬性詞綴優先，否則用基底物品 ele）；owner 供傭兵使用，省略時沿用主玩家。
function getWpnEle(wpnInst, wpnBase, owner) {
    let a = wpnInst && getAttrAffix(wpnInst.attr);
    // 🏺 v3.7.54 專精劍術的魔劍士之刀：施法後 10 秒，一般攻擊變成裝備者最後施放法術的屬性。
    let wielder = owner || ((typeof player !== 'undefined') ? player : null);
    let spellbladeActive = !!(wpnBase && wpnBase.spellbladeBuff && wielder && wielder.eq && wielder.eq.wpn === wpnInst
        && (wielder._spellbladeUntil || 0) > ((typeof state !== 'undefined' && state.ticks) || 0));
    return resolveWeaponElement(!!a, a && a.ele, spellbladeActive, wielder && wielder._spellbladeEle, wpnBase && wpnBase.ele);
}
// 屬性剋制判定（攻擊屬性 e 是否剋制怪物屬性 te），加成量由各詞綴的 counter 決定
// 🔧 統一：抗魔係數（MR 折減倍率，邊際效益遞減）。回傳「魔法傷害通過率」(=1-減傷%)。
//   0–100：每+1 MR +0.5% 減傷（→50%）｜100–200：+0.1%（→60%）｜200–400：+0.075%（→75%）｜
//   400–600：+0.06%（→87%）｜600–800：+0.04%（→95%）｜800–1000：+0.02%（→99%）｜MR≥1000：上限 99% 減傷（係數 0.01，無完全免疫）。
//   供 castSkill／各 proc／傭兵魔法／玩家受魔法傷害共用。
function mrMult(mr) {
    if (mr <= 100)  return (100 - mr / 2) / 100;          // 1.00 → 0.50（0→50% 減傷）
    if (mr <= 200)  return 0.50 - (mr - 100) / 1000;       // 0.50 → 0.40（50→60%）
    if (mr <= 400)  return 0.40 - (mr - 200) * 0.00075;    // 0.40 → 0.25（60→75%）
    if (mr <= 600)  return 0.25 - (mr - 400) * 0.0006;     // 0.25 → 0.13（75→87%）
    if (mr <= 800)  return 0.13 - (mr - 600) * 0.0004;     // 0.13 → 0.05（87→95%）
    if (mr <= 1000) return 0.05 - (mr - 800) * 0.0002;     // 0.05 → 0.01（95→99%）
    return 0.01;                                           // 上限 99% 減傷（係數 0.01）
}
function isElementCounter(e, te) {
    return (e === 'fire'  && te === 'earth') ||
           (e === 'earth' && te === 'wind')  ||
           (e === 'wind'  && te === 'water') ||
           (e === 'water' && te === 'fire');
}
// ⚔️ 屬性剋制傷害倍率（物理＋魔法通用·取代舊的 +6/+9/+12 固定加值）：
//   攻方屬性剋制守方  → ×1.4（火打地/地打風/風打水/水打火）
//   攻方被守方剋制    → ×0.6（火打水/水打風/風打地/地打火）
//   無屬性(none/normal/light/holy/magic/空) 或非剋制關係 → ×1.0
//   atkEle＝攻擊方元素、defEle＝目標(怪物) t.e。供所有傷害site呼叫（單一真相）。
const ELEM_COUNTER_UP = 1.4, ELEM_COUNTER_DOWN = 0.6;
function elementCounterMult(atkEle, defEle) {
    if (!atkEle || atkEle === 'none' || atkEle === 'normal' || atkEle === 'light' || atkEle === 'holy' || atkEle === 'magic') return 1;
    if (!defEle || defEle === 'none' || defEle === 'normal') return 1;
    if (isElementCounter(atkEle, defEle)) return ELEM_COUNTER_UP;   // 攻方剋守方
    if (isElementCounter(defEle, atkEle)) return ELEM_COUNTER_DOWN;  // 攻方被守方剋
    return 1;
}

function getItemColor(item) {
    let d = DB.items[item.id];
    // 🏺 遺物：海藍色名稱（遺物永無詞綴/套裝，優先判定）
    if (d && d.relic) return 'c-relic';
    // 🏅 傳說武器：琥珀金，優先於套裝與所有詞綴（即使帶套裝效果，名稱仍為琥珀金）
    if (d && d.legend) return 'c-legend';
    // 🔮 席琳套裝效果：鮮綠＋呼吸綠光，優先於所有詞綴顏色
    if (item.seteff) return 'c-sherine';
    // 名字顏色 = 套裝 > 祝福(金)/詛咒(紅) > 基底色
    // 🔧 屬性詞綴與遠古系詞綴（遠古/永恆/不朽/太初）不再影響裝備名稱顏色，
    //    詞綴字本身仍保留各自專屬色（見 getItemFullName）
    if (item.bless) return blessColorClass(item.bless);
    if (d && d.isB) return 'c-blessed';
    if (d && d.isC) return 'c-cursed';   // 詛咒的卷軸：名稱紅色
    return d.c || 'text-white';
}

// 圖示光芒：依詞綴組合決定顏色與顯眼度（與文字顏色獨立）。
//   單祝福→金光、單遠古→紫光（原樣）；屬性+遠古→紫光(加強)、屬性+祝福→金光(加強)，顯眼度比照雙詞綴；
//   遠古+祝福→紫金交替(顯眼)；三詞綴→變色循環，顯眼度最高。
function getGlowClass(item, d) {
    // 🔮 席琳結晶：圖示帶與套裝文字同款的呼吸綠光
    if ((item && item.id === 'sherine_crystal') || (d && d.n === '席琳結晶')) return 'sherine-glow-icon';
    // 🔮 席琳套裝效果裝備：套裝光芒優先於傳說圖示光（名稱仍由 getItemColor 決定為琥珀金）
    if (item && item.seteff) return 'sherine-glow-icon';
    if ((item && item.id === 'wpn_manadagger') || (d && d.n === '魔力短劍')) return 'mana-glow';   // 🔧 魔力短劍：專屬藍色圖示光芒（凌駕傳說琥珀金光）
    if (d && d.relic) return 'relic-glow';   // 🏺 遺物：海藍色圖示光芒
    if (d && d.legend) return 'legend-glow';   // 🏅 傳說武器：琥珀金圖示光芒
    let bless = (item && item.bless) || (d && d.isB);
    let cursed = !!(item && item.bless === 'cursed') || !!(d && d.isC);   // 詛咒裝備或詛咒卷軸：紅光
    let anc = (item && item.anc) || (d && d.isAnc);
    let attr = !!(item && getAttrAffix(item.attr));
    if (cursed) return 'curse-glow';   // 含詛咒：一律單詛咒紅光（即使二/三詞綴）
    if (attr && anc && bless) return 'tri-glow';           // 三詞綴：高亮變色循環（顯眼度最高）
    if (anc && bless) return 'anc-bless-glow';             // 遠古+祝福：紫金交替（顯眼）
    if (attr && anc) return 'ancient-glow-strong';         // 屬性+遠古：紫光（顯眼度＝雙詞綴）
    if (attr && bless) return 'bless-glow-strong';         // 屬性+祝福：金光（顯眼度＝雙詞綴）
    if (anc) return 'ancient-glow';                        // 單遠古：紫光（原樣）
    if (bless) return 'bless-glow';   // 單祝福（詛咒已於上方優先處理）                        // 單祝福：金光（原樣）
    if (attr) return 'attr-glow-' + attrCanon(item.attr);  // 🔥 單屬性：武器圖示帶該屬性同色系光芒（階級越高越亮，第5階呼吸光）
    return '';
}

// 物品全名（HTML：各詞綴分段各自上色；順序 屬性→遠古→祝福的→[+N]名字；名字顏色＝最靠近的詞綴）
// 遠古系詞綴變體：遠古(基礎,anc=true) / 永恆(eternal) / 不朽(immortal) / 太初(primordial)
function ancName(anc) {
    if (!anc) return '';
    return ({ eternal: '永恆', immortal: '不朽', primordial: '太初' })[anc] || '遠古';
}
function ancColorClass(anc) {   // 遠古=紫、永恆=紅、不朽=綠、太初=藍
    return ({ eternal: 'c-eternal', immortal: 'c-immortal', primordial: 'c-primordial' })[anc] || 'c-ancient';
}
// 祝福系：祝福的(bless=true) / 詛咒的(bless='cursed')
function blessName(bless) { return !bless ? '' : (bless === 'cursed' ? '詛咒的' : '祝福的'); }
function blessColorClass(bless) { return (bless === 'cursed') ? 'c-cursed' : 'c-blessed'; }
function applyBlessStats(d, bless, slot) {   // slot: 'wpn' | 'arm' | 'acc'；詛咒的＝祝福的負鏡像
    if (!bless) return;
    let sg = (bless === 'cursed') ? -1 : 1;
    if (slot === 'wpn') { d.extraDmg += sg*1; d.extraHit += sg*1; d.extraMp += sg*2; }   // 武器：傷害/命中/額外魔法點數
    else if (slot === 'arm') { d.ac -= sg*1; d.dr += sg*1; }                              // 防具：AC(祝-1/詛+1)、傷害減免
    else { d.ac -= sg*1; d.mr += sg*1; }                                                  // 飾品：AC、MR
}
function applyAncStats(d, anc, slot) {   // slot: 'wpn' | 'arm' | 'acc'
    if (!anc) return;
    let v = (anc === true) ? 'ancient' : anc;
    if (slot === 'wpn') {
        if (v === 'ancient') { d.extraDmg += 2; d.magicDmg += 1; }
        else if (v === 'eternal') d.extraDmg += 4;
        else if (v === 'immortal') d.extraHit += 4;
        else if (v === 'primordial') d.magicDmg += 2;
    } else if (slot === 'arm') {
        if (v === 'ancient') d.dr += 2;
        else if (v === 'eternal') d.ac -= 2;
        else if (v === 'immortal') d.er += 2;
        else if (v === 'primordial') d.mr += 4;
    } else {
        if (v === 'ancient') { d.dr += 1; d.mr += 1; }
        else if (v === 'eternal') { d.extraDmg += 1; d.ac -= 1; }
        else if (v === 'immortal') { d.extraDmg += 1; d.extraHit += 1; }
        else if (v === 'primordial') { d.mr += 2; d.extraMp += 2; }
    }
}
function getItemFullName(item) {
    let d = DB.items[item.id];
    if(!d) return "未知的物品";
    let _attrMagic = getAttrMagicProc(item);
    let segs = _attrMagic ? `<span class="text-yellow-300 font-bold">${'★'.repeat(_attrMagic.star)}</span> ` : '';
    let aff = getAttrAffix(item.attr);
    if (aff) {
        let acls = 'c-attr-' + attrCanon(item.attr) + (aff.tier === 5 ? ' c-attr-glow' : '');
        segs += `<span class="${acls}">${aff.n} </span>`;   // 🔥 屬性詞綴：4 屬性 × 5 階漸變同色系（第5階加光暈）
    }
    if (item.anc)   segs += `<span class="${ancColorClass(item.anc)}">${ancName(item.anc)} </span>`;   // 遠古系：遠古紫/永恆紅/不朽綠/太初藍
    if (item.bless) segs += `<span class="${blessColorClass(item.bless)}">${blessName(item.bless)} </span>`;   // 祝福的金/詛咒的紅
    let en = (item.en > 0) ? (`+${capEn(item.en, d)} `) : ((Number(item.en) || 0) < 0 ? `${item.en} ` : "");   // 🔧 一律顯示 +N（夾擠至上限：武器/防具+15、飾品+5）；🏰 詛咒降階的負值(如 -1)原樣顯示
    let cnt = item.cnt > 1 ? ` (${item.cnt})` : "";
    let setPrefix = item.seteff ? item.seteff.slice(0, 2) : "";   // 🔮 席琳套裝：套裝名冠在裝備名稱前（如「紅獅環甲」）；顏色沿用 getItemColor（規則同前）
    return `${segs}<span class="${getItemColor(item)}">${en}${setPrefix}${d.n}${cnt}</span>`;
}

// 🌅 遺物 鐮鼬的藥壺 potionBonus：掃玩家全裝備欄加總「治癒藥水恢復量 +%」（魔法娃娃的 potionBonus 另走 dollFieldVal·此處掃一般裝備/遺物）
function playerEquipPotionBonusPct() {
    let sum = 0;
    try { for (let _k in player.eq) { let _e = player.eq[_k]; if (!_e || !_e.id || _k === 'doll') continue; let _d = DB.items[_e.id]; if (_d && _d.potionBonus) sum += _d.potionBonus; } } catch (e) {}
    return sum;
}
// 🌅 批量使用（batchUse:true 的可使用道具·現用於 巨大骷髏的妖魂 eff:'expsoul'）：prompt 數量（預設全部）→一次結算經驗＋扣數量
function batchUseItem(u) {
    let item = player.inv.find(i => i.uid === u);
    if (!item) return;
    let d = DB.items[item.id];
    if (!d || !d.batchUse) return;
    if (player.dead) { logSys(`死亡狀態無法使用道具，請先復活。`); return; }
    // 💊 v3.5.50 萬能藥批量使用：一次輸入數量，自動夾限「持有數／60 瓶總額度／該屬性距上限 60」三者取小
    if (d.eff === 'panacea') {
        const STAT_CN = { str:'力量', dex:'敏捷', con:'體質', int:'智力', wis:'精神', cha:'魅力' };
        let st = d.pstat, cap = 60;
        let remainQuota = 60 - (player.panaceaUsed || 0);
        let remainStat = cap - naturalStat(st);
        if (remainQuota <= 0) { logSys(`萬能藥最多只能使用 60 瓶，使用回憶蠟燭後可重新使用。`); return; }
        if (remainStat <= 0) { logSys(`${STAT_CN[st]}已達上限（${cap}），無法再使用 ${d.n}。`); return; }
        let maxN = Math.min(item.cnt, remainQuota, remainStat);
        let rawP = prompt(`要使用幾瓶 ${d.n}？（持有 ${item.cnt} 瓶·${STAT_CN[st]}距上限 ${remainStat}·萬能藥剩餘額度 ${remainQuota} 瓶·本次最多 ${maxN} 瓶）`, maxN);
        if (rawP === null) return;
        let nP = Math.floor(Number(rawP));
        if (!nP || nP <= 0) { logSys('已取消批量使用。'); return; }
        nP = Math.min(nP, maxN);
        if (!player.panacea) player.panacea = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
        player.panacea[st] = (player.panacea[st] || 0) + nP;
        player.panaceaUsed = (player.panaceaUsed || 0) + nP;
        item.cnt -= nP;
        if (item.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== item.uid);
        calcStats();
        logSys(`使用了 <span class="${d.c || 'text-pink-300'} font-bold">${d.n}</span> ×${nP}，${STAT_CN[st]} 永久 +${nP}！（萬能藥已使用 ${player.panaceaUsed}/60）`);
        renderTabs(); updateUI(); saveGame();
        if (!document.getElementById('item-modal').classList.contains('hidden')) closeModal();
        return;
    }
    if (d.eff !== 'expsoul') return;
    let raw = prompt(`要使用幾個 ${d.n}？（持有 ${item.cnt} 個·每個 +${(d.expGain || 1000000).toLocaleString()} 經驗）`, item.cnt);
    if (raw === null) return;
    let n = Math.floor(Number(raw));
    if (!n || n <= 0) { logSys('已取消批量使用。'); return; }
    n = Math.min(n, item.cnt);
    let _xp = (d.expGain || 1000000) * n;
    player.exp += _xp;
    checkLvUp();
    item.cnt -= n;
    if (item.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== item.uid);
    logSys(`使用了 <span class="${d.c || 'text-sky-300'} font-bold">${d.n}</span> ×${n}，獲得 <span class="text-yellow-300 font-bold">${_xp.toLocaleString()}</span> 點經驗值！`);
    renderTabs(); updateUI(); saveGame();
    if (!document.getElementById('item-modal').classList.contains('hidden')) closeModal();
}
function useItem(u, silent = false) {
    let item = player.inv.find(i => i.uid === u);
    if (!item) return;
    if (player.dead) { if (!silent) logSys(`死亡狀態無法使用道具，請先復活。`); return; }   // 死亡(未復活前)鎖住手動使用
    if (inAbsBarrier()) { if(!silent) logSys('絕對屏障期間與世界隔絕，無法使用藥水與道具。'); return; }   // 🛡️ 絕對屏障：禁止使用任何道具（自動使用 silent 亦略過）
    if (item.id === 'scroll_revive') { if(!silent) logSys(`復活卷軸無法從道具欄使用，死亡時可於畫面下方點選『原地復活』。`); return; }
    let d = DB.items[item.id];
    if (d.noUse) { if(!silent) logSys(`此物品無法直接使用。`); return; }

    // 🌅 巨大骷髏的妖魂（eff:'expsoul'·expGain）：使用後獲得經驗值（批量走 batchUseItem）
    if (d.eff === 'expsoul') {
        if (silent) return;   // 不參與任何自動使用
        let _xp = d.expGain || 1000000;
        player.exp += _xp;
        checkLvUp();
        consume(item);
        logSys(`使用了 <span class="${d.c || 'text-sky-300'} font-bold">${d.n}</span>，獲得 <span class="text-yellow-300 font-bold">${_xp.toLocaleString()}</span> 點經驗值！`);
        updateUI(); saveGame();
        if (!document.getElementById('item-modal').classList.contains('hidden')) closeModal();
        return;
    }
    // 🎴 卡片：登錄圖鑑（已收錄則改賣出）
    //   🗑️ v3.5.87 移除 cardbook/equipbook 分派：兩本收集冊實體已無取得管道且 DB 定義移除（ensureCardBook/ensureEquipBook 讀檔即濾除·purgeOrphanItems 兜底），分派永不可達；收集冊由「收藏」面板開啟
    if (d.eff === 'card') { if (silent) return; if (typeof useCardItem === 'function') useCardItem(item); return; }
    if (d.eff === 'doll_bag') { if (silent) return; if (typeof openDollBag === 'function') openDollBag(item, false); return; }   // 🪆 開啟魔法娃娃的袋子
    if (d.eff === 'doll_box_high') { if (silent) return; if (typeof openDollBox === 'function') openDollBox(item, false); return; }   // 🎁 開啟高級魔法娃娃的盒子

    // 🗼 封印的傲慢之塔傳送符：使用後解封，獲得對應的 傲慢之塔傳送符（消耗 1 個）
    if (d.eff === 'pride_unseal') {
        if (silent) return;
        let _passId = 'item_pride_pass_' + (d.prideTier || 11);
        if (!DB.items[_passId]) { logSys('<span class="text-red-400">解封失敗：找不到對應的傳送符。</span>'); return; }
        item.cnt--; if (item.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== item.uid);
        gainItem(_passId, 1);
        logSys(`<span class="text-amber-300 font-bold">封印解除！</span>你獲得了 <span class="text-amber-300 font-bold">${DB.items[_passId].n}</span>，攜帶在身上即可進入對應樓層。`);
        renderTabs(); updateUI(); saveGame();
        if (!document.getElementById('item-modal').classList.contains('hidden')) closeModal();
        return;
    }

    // 🥚 v3.7.56 幼龍蛋（頑皮／淘氣共用 eff:'dragonegg'）：攜帶觸發林德拜爾＋可使用——寵物保管未滿時消耗，依蛋種 eggPet 定向孵化
    //   （🚫 舊「進化果實 eff:'evolve' 項圈進化」已隨項圈系統移除；新進化改於包武寵物保管介面進行）
    if (d.eff === 'dragonegg') {
        if (silent) return;
        if (typeof petUseDragonEgg === 'function') petUseDragonEgg(item);
        return;
    }

    // 🥚 遺物蛋（v3.6.44 詛咒→v3.6.47 厄運→v3.6.62 破滅／災厄）：使用後獲得對應蜥蜴——保管已滿則不消耗（js/22 petUseCursedEgg 內把關）。
    //    ⚠️ 新增蛋只要在 RELIC_EGG_PETS 加一列＋js/00 定義對應 eff 即可，不要再複製一段 if 分派。
    let _eggPet = RELIC_EGG_PETS[d.eff];
    if (_eggPet) {
        if (silent) return;
        if (typeof petUseCursedEgg === 'function') petUseCursedEgg(item, _eggPet.pet, `<span class="text-purple-300 font-bold">蛋殼在${_eggPet.aura}的氣息中碎裂……</span>`);
        return;
    }

    // 🏛️ 上鎖的歐西里斯寶箱：開啟選擇數量，每開 1 個消耗 1 顆 龜裂之核，依機率獲得底比斯寶物
    if (d.eff === 'osiris_box') {
        if (silent) return;
        openOsirisBox(item.uid);
        return;
    }

    // 🔧 靈魂之球：身上有「失去魔力的巴列斯魔杖」→ 兩者各消耗 1 個，獲得「巴列斯魔杖」；否則只顯示訊息、不消耗
    //   ・優先消耗「帶席琳套裝效果」的失去魔力魔杖；兌換出的巴列斯魔杖繼承相同套裝效果
    if (d.eff === 'soulorb') {
        if (silent) return;
        // 🔧 靈魂之球：可恢復「失去魔力的巴列斯魔杖→巴列斯魔杖」或「失去魔力的巴風特魔杖→巴風特魔杖」；兩者皆有則出現選項。
        let _restore = (powerlessId, resultId, resultName, powerlessName) => {
            let _wands = player.inv.filter(i => i.id === powerlessId && i.cnt > 0);
            if (!_wands.length) return false;
            let _wand = _wands.find(i => i.seteff) || _wands[0];   // 優先選有套裝效果者
            let _seteff = _wand.seteff || false;
            item.cnt--; if (item.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== item.uid);   // 消耗靈魂之球 ×1
            _wand.cnt--; if (_wand.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== _wand.uid);   // 消耗失去魔力魔杖 ×1
            let _tEn = 0;   // 🏛️ v3.0.83 傳統模式已取消：重獲魔力的魔杖恆 +0（沿用手動強化）
            invAddOrStack({ id:resultId, uid:uid(), cnt:1, en:_tEn, bless:false, anc:false, attr:false, seteff:_seteff, lock:false, junk:false });
            logSys(`<span class="c-legend font-bold">靈魂之球與${powerlessName}發出強烈的銀色光芒！</span><span class="text-amber-200">你獲得了 ${_tEn>0?('+'+_tEn+' '):''}${resultName}${_seteff ? `（<span class="c-sherine font-bold">${_seteff}</span>）` : ''}！</span>`);
            renderTabs(); updateUI(); saveGame();
            if (!document.getElementById('item-modal').classList.contains('hidden')) closeModal();
            return true;
        };
        let hasBaless = player.inv.some(i => i.id === 'wpn_powerless_baless' && i.cnt > 0);
        let hasBaph = player.inv.some(i => i.id === 'wpn_powerless_baphomet' && i.cnt > 0);
        if (!hasBaless && !hasBaph) { logSys('<span class="text-slate-300">靈魂之球發出微弱的光芒，什麼事都沒發生。</span>'); return; }
        if (hasBaless && hasBaph) {
            let pickBaless = confirm('靈魂之球同時感應到兩把失去魔力的魔杖，只能喚回一把。\n\n【確定】＝巴列斯魔杖\n【取消】＝巴風特魔杖');
            if (pickBaless) _restore('wpn_powerless_baless', 'wpn_baless', '巴列斯魔杖', '失去魔力的巴列斯魔杖');
            else _restore('wpn_powerless_baphomet', 'wpn_baphomet_wand', '巴風特魔杖', '失去魔力的巴風特魔杖');
            return;
        }
        if (hasBaless) _restore('wpn_powerless_baless', 'wpn_baless', '巴列斯魔杖', '失去魔力的巴列斯魔杖');
        else _restore('wpn_powerless_baphomet', 'wpn_baphomet_wand', '巴風特魔杖', '失去魔力的巴風特魔杖');
        return;
    }

    if (d.type === 'pot' || d.eff === 'poly' || d.eff === 'reset' || d.eff === 'magicbarrier' || d.eff === 'teleport_scroll' || d.eff === 'panacea') {   // 變形卷軸(eff:poly)、回憶蠟燭(eff:reset)、魔法卷軸(eff:magicbarrier)、瞬間移動卷軸(eff:teleport_scroll)亦走此消耗品分支
        // 職業限定檢查（如慎重藥水=法師、勇敢藥水=騎士、精靈餅乾=妖精）
        if (!reqAllowsClass(d, player.cls)) {
            if (!silent) logSys(`無法使用 ${d.n}，職業不符。`);
            return;
        }
        // 🚫 v3.7.17 決鬥禁治癒藥水（用戶：PK 雙方都不使用）：擋在「HP 恢復類消耗品」的入口＝自動喝與手動點同一道閘。
        //    ⚠️ 安特的水果(new_item_141) 一併納入——它是同一個 player.cds.pot 冷卻的補血消耗品，只擋三瓶藥水等於留一個明顯漏洞。
        if ((item.id.includes('potion_heal') || item.id === 'potion_strong' || item.id === 'potion_ult' || item.id === 'new_item_141')
            && typeof pvpArenaPotionBlocked === 'function' && pvpArenaPotionBlocked()) {
            if (!silent) logSys('<span class="text-slate-300">⚔️ 決鬥中雙方都不能使用治癒藥水。</span>');
            return;
        }
        if (item.id.includes('potion_heal') || item.id === 'potion_strong' || item.id === 'potion_ult') {
            if (player.cds.pot > 0) return;
            let h = Math.floor(potionHealBase(d) * (1 + (getConPotionPct(player.d.con) + dollFieldVal('potionBonus') + playerEquipPotionBonusPct() + (player._miscPotionBonus || 0)) / 100));   // 🍶 藥水基準改隨機區間 valMin~valMax（紅10~20/橙30~50/白60~80）；🪆 魔法娃娃 potionBonus%（吸血鬼）；🧰 道具收集冊 材料/其他全收集：藥水恢復%
            if (hasMastery('k_survive')) h = Math.floor(h * 1.25);   // 🏅 生存精通：治癒藥水恢復 +25%
            if (hasMastery('k_tough') && player.hp < player.mhp * 0.4) h = Math.floor(h * 1.5);   // ⚔️ 堅韌精通：HP<40% 時藥水治癒量 +50%
            if (hasMastery('k_dragonblood')) h = Math.floor(h * 1.15);   // 🐉 龍血精通：治癒藥水恢復 +15%
            if (player.hp < player.mhp * 0.2) { try { for (let _k in player.eq) { let _e = player.eq[_k]; if (_e && DB.items[_e.id] && DB.items[_e.id].lowHpPotionX2) { h = h * 2; break; } } } catch (e) {} }   // 🏺 v3.2.17 聖伯納的急救酒桶：HP<20% 時治癒藥水恢復量 ×2
            if (player.statuses && player.statuses.potionFrost > 0) h = Math.max(1, Math.floor(h * 0.5));   // 🌅 藥水霜化（巨大骷髏·枯竭詛咒）：治癒藥水恢復量 −50%
            if (player.statuses && player.statuses.foulWater > 0) h = Math.max(1, Math.floor(h * 0.5));   // 🌊 v3.6.20 汙濁之水（玩家NPC二模板）：治癒藥水也減半
            player.hp = Math.min(player.mhp, player.hp + h);
            player.cds.pot = 1;
            if(!silent) logSys(`飲用 ${d.n}，恢復 ${h} HP。`);
        } else if (item.id === 'new_item_141') {
            // 安特的水果：只能手動使用，恢復 44~107 HP（自動使用會帶 silent=true，直接略過不消耗）
            if (silent) return;
            if (player.cds.pot > 0) return;
            let h = 44 + Math.floor(Math.random() * (107 - 44 + 1));
            if (hasMastery('k_survive')) h = Math.floor(h * 1.25);   // 🏅 生存精通：安特的水果恢復 +25%
            player.hp = Math.min(player.mhp, player.hp + h);
            player.cds.pot = 1;
            logSys(`食用 ${d.n}，恢復 ${h} HP。`);
        } else if (d.eff === 'poly') {
            let ringOn = hasPolyRing();
            if (!silent && ringOn) {
                // 手動從道具欄使用 + 持有變形控制戒指（裝備或背包攜帶皆可）：開啟選擇選單（變身與消耗在選定後才執行）
                openPolySelect(item.uid);
                return;
            }
            if (silent && ringOn && player.poly && polyFormMatchesEquippedWeapon(player.poly)) {
                // 自動使用 + 持有變形控制戒指：維持上次的變身狀態（不重抽、不跳選單）
                // 保留 player.poly 不變，僅於下方重置持續時間。
            } else {
                // 其餘情況（手動且無戒指／尚無紀錄／換成不同攻擊類型武器）：依等級與武器類型隨機抽取。
                player.poly = getPolyState();
            }
            player.buffs.poly = d.dur;
            if(!silent) logSys(`使用變形卷軸，變身為 <span class="${player.poly.c}">${player.poly.n}</span>。`);
		} else if (d.eff === 'petlure') {
            // 🐾 v3.2.17 誘捕道具（漂浮之眼肉/胡蘿蔔/虎男誘食/袋鼠·熊貓·猴子的飼料/高麗犬誘食）：
            //   使用後獲得對應「誘捕」狀態 600 秒；期間擊殺對應動物 → 寵物保管獲得基本等級寵物並失去該狀態。
            //   （🚫 舊「肉 eff:'meat' 誘捕項圈」與「哨子 eff:'whistle'」已隨項圈系統移除）
            if (silent) return;
            if (typeof petUseLureItem !== 'function' || !petUseLureItem(d, silent)) return;   // 失敗不消耗
            // 落到下方 consume(item)，消耗 1 個
        } else if (d.eff === 'magicbarrier') {
            // 魔法卷軸：與魔法屏障法術共用 player.buffs.sk_magic_shield，不可疊加
            if ((player.magicShieldCd || 0) > 0) {
                // 抵擋技能後冷卻中：無法施放、且不消耗卷軸
                if(!silent) logSys(`魔法屏障冷卻中（剩餘 ${player.magicShieldCd} 秒），無法使用魔法卷軸。`);
                return;
            }
            if (player.buffs.sk_magic_shield > 0) {
                // 已有魔法屏障 → 手動使用取消（不消耗卷軸）
                player.buffs.sk_magic_shield = 0;
                if(!silent) logSys(`取消了魔法屏障狀態。`);
                updateUI();
                return;
            }
            player.buffs.sk_magic_shield = 16;   // 與魔法屏障法術相同：16 秒
            if(!silent) logSys(`使用魔法卷軸，獲得 <span class="text-cyan-300 font-bold">魔法屏障</span> 狀態。`);
            // 落到下方 consume(item)，消耗一張卷軸
        } else if (d.eff === 'teleport_scroll') {
            // 行動限制狀態（石化／麻痺／冰凍／暈眩）無法使用瞬間移動卷軸
            if (player.statuses && (player.statuses.stone > 0 || player.statuses.paralyze > 0 || player.statuses.freeze > 0 || player.statuses.stun > 0 || player.statuses.sleep > 0)) {
                if (!silent) logSys('你目前無法行動（石化／麻痺／冰凍／暈眩），無法使用瞬間移動卷軸。');
                return;
            }
            // 🔧 魔獸軍王之室：瞬間移動卷軸無效（不消耗卷軸）
            if (KING_ROOMS[mapState.current]) { if (!silent) logSys('<span class="text-red-400">軍王之室的封印之力壓制了傳送，瞬間移動卷軸無法生效。</span>'); return; }
            // 🗼 傲慢之塔：排名模式一律禁止；11F+ 樓層需持有對應支配符（不消耗卷軸）
            if (prideTeleportBlocked()) { if (!silent) logSys('<span class="text-red-400">' + (state.riftRun ? '時空裂痕中無法使用瞬間移動卷軸。' : (state.prideRanked ? '排名挑戰中無法使用瞬間移動卷軸。' : '在此樓層需持有對應的傲慢之塔支配符才能使用瞬間移動卷軸。')) + '</span>'); return; }
            // 🏝️ 遺忘之島：途中與本島皆禁用瞬間移動卷軸（不消耗卷軸）
            if (state.oblivion) { if (!silent) logSys('<span class="text-red-400">遺忘之島的迷霧壓制了傳送，瞬間移動卷軸無法生效。</span>'); return; }
            // 🐉 v3.7.57 侵蝕的安塔瑞斯巢穴：禁瞬間移動卷軸（不消耗卷軸）
            if (state.antharas) { if (!silent) logSys('<span class="text-red-400">侵蝕的龍氣壓制了傳送，瞬間移動卷軸無法生效。</span>'); return; }
            // 瞬間移動卷軸：效果同傳送術。手動(非silent)+傳送控制戒指 → 必定遭遇BOSS；自動使用(silent) → 必定無戒指效果。
            if (!silent && HIDDEN_AREA_PARENT[mapState.current]) {   // 🏛️ 對應地圖手動用卷軸→進入隱藏狩獵區域（自動瞬移 silent 不進入、照常逃離頭目）；下方仍 consume 卷軸
                enterHiddenArea(HIDDEN_AREA_PARENT[mapState.current]);
            } else {
                let forceBoss = !silent && hasTeleportRing();
                doTeleport(forceBoss);
                if(!silent) logSys(`使用瞬間移動卷軸，當前的怪物消失了${forceBoss ? '；傳送控制戒指引動了強敵的氣息……' : ''}。`);
            }
            // 落到下方 consume(item)，消耗一張卷軸
        } else if (d.eff === 'panacea') {
            const STAT_CN = { str:'力量', dex:'敏捷', con:'體質', int:'智力', wis:'精神', cha:'魅力' };
            let st = d.pstat, cap = 60;
            // 萬能藥已取消等級限制（不再檢查 plv）
            if ((player.panaceaUsed || 0) >= 60) { if(!silent) logSys(`萬能藥最多只能使用 60 瓶，使用回憶蠟燭後可重新使用。`); return; }   // 🔧 上限 20→30→50→60
            if (naturalStat(st) >= cap) { if(!silent) logSys(`${STAT_CN[st]}已達上限（${cap}），無法再使用 ${d.n}。`); return; }
            if (!player.panacea) player.panacea = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
            player.panacea[st] = (player.panacea[st] || 0) + 1;
            player.panaceaUsed = (player.panaceaUsed || 0) + 1;
            if(!silent) logSys(`使用了 ${d.n}，${STAT_CN[st]} 永久 +1！（萬能藥已使用 ${player.panaceaUsed}/60）`);
            // 落到下方 consume(item) + calcStats()，由 useItem 結尾 updateUI 刷新
        } else if (d.eff === 'reset') {
            startRespec(); return;   // 🕯️ 回憶蠟燭：改為「資訊面板配點重置」流程（確認時才消耗蠟燭，故此處不 consume）
        } else {
            player.buffs[d.eff] = d.dur;
            if(!silent) logSys(`使用了 ${d.n}。`);
        }
        consume(item);
        calcStats();
    } else if (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') {
        equipItem(item);
    // 🗑️ v3.5.83 移除 `d.type === 'scroll' → openEnhanceModal(item)` 分支：全部 type:'scroll' 物品都在本檔更上游
    //    就被攔截處理，而真正的強化卷軸（js/00-data.js）根本沒有 type 欄位 → 此分支不可達。
    //    現行強化唯一入口＝ showEnhanceOptions / doEnhance。
    } else if (d.type === 'skillbk') {
        let sd = DB.skills[d.sk];
        let reqLv = skillReqLv(sd, d.sk);   // 🏅 集中化：含魔導精通特例（妖精可學四項法師法術）
        if(reqLv === undefined) { logSys(`你的職業無法學習「${sd.n}」。`); return; }
        if(player.lv < reqLv) { logSys(`等級不足，需要等級 ${reqLv} 才能學習「${sd.n}」。`); return; }
        
        // 👇 補上這兩行：確保屬性相符才能吃水晶！
        if(sd.reqEle && player.elfEle !== sd.reqEle) { logSys(`屬性不符，無法學習「${sd.n}」。`); return; }
        if(sd.reqEleAny && !player.elfEle) { logSys(`尚未選擇屬性，無法學習「${sd.n}」。`); return; }

        if(!player.skills.includes(d.sk)) {
            player.skills.push(d.sk);
            logSys(`學習了技能: <span class="text-cyan-300">${DB.skills[d.sk].n}</span>`);
            consume(item);
            renderTabs();
            renderSkillSelects();
        } else logSys(`你已經學過這個技能了。`);
    }
    updateUI();
    if(!silent && document.getElementById('item-modal').classList.contains('hidden') === false && (d.type !== 'scroll' || d.eff === 'poly' || d.eff === 'magicbarrier' || d.eff === 'teleport_scroll')) {
        closeModal();
    }
}

// 雙手武器判定：弓(isBow)或雙手武器(w2h)，皆不可與盾牌並存
function isTwoHandedWpn(d) {
    return !!(d && (d.isBow || d.w2h) && !d.oneHand);   // 🏝️ oneHand：單手武器（古老的弩槍＝單手弓）即使是弓也可與盾牌/臂甲並用
}
// 隱身狀態：施放隱身術(buff)期間，或穿著隱身斗篷(arm_88)時皆成立；卸下斗篷即失效
function isInvisible() {
    return player.buffs.sk_invisible > 0 || (player.eq.cloak && DB.items[player.eq.cloak.id] && (DB.items[player.eq.cloak.id].stealth || player.eq.cloak.id === 'arm_88'));   // 🔧 stealth flag：泛用隱身斗篷（炎魔的血光斗篷等）
}
// 將某裝備欄位的裝備退回背包（不關閉視窗，供 equipItem 內部互斥處理用）
function returnEquipToInv(slot) {
    let e = player.eq[slot];
    if (!e) return;
    if (!invMergeBack(e)) player.inv.push(e);   // 🔧 架構#3：統一簽章比對（🔒 v3.6.92 併入鎖定疊·保護狀態擴散·單一真相 invMergeBack）
    player.eq[slot] = null;
}

// 負重強化(sk_load_up)讓法師/妖精能使用的擴充裝備清單（單一來源，裝備判定與商店過濾共用）
const LOAD_UP_EXTRA = {
    mage: ['shd_gnome', 'arm_63', 'arm_64', 'arm_69'],   // 侏儒圓盾, 鏈甲, 歐西斯鏈甲, 抗魔法鏈甲
    elf:  ['arm_108', 'hlm_steel', 'arm_113', 'arm_79']  // 塔盾, 鋼鐵頭盔, 鋼鐵盾牌, 鋼鐵金屬盔甲
};
function loadUpAllows(itemId) {
    return false;   // 🔧 負重改版：負重強化不再開放裝備重甲（改為負重上限增益）
    /* eslint-disable-next-line */
    return player.skills.includes('sk_load_up') && LOAD_UP_EXTRA[player.cls] && LOAD_UP_EXTRA[player.cls].includes(itemId);
}
// ===== 黑暗妖精裝備使用規則 =====
// 負重強化(sk_load_up)解鎖的重甲（依名稱）
const DARK_LOADUP = ['鋼鐵頭盔','鋼鐵金屬盔甲','騎士面甲','青銅盔甲','鋼鐵盾牌'];
// 黑暗妖精無法使用的防具/頭盔/手套/斗篷/盾/T恤/長靴/長袍（依名稱，負重強化清單除外）
const DARK_BLOCK = [
    '藤甲','皮甲','死亡騎士盔甲','金屬盔甲','克特盔甲',
    '死亡騎士長靴','克特長靴','黑長者涼鞋',
    '法師長袍','黑長者長袍',
    '西瑪之帽','馬庫爾之帽','巴土瑟之帽','卡士柏之帽','法師之帽','紅騎士頭巾',
    '力量魔法頭盔','敏捷魔法頭盔','治癒魔法頭盔','精靈體質頭盔','精靈敏捷頭盔','艾爾穆的祝福','死亡騎士頭盔','克特頭盔',
    '保護者手套','死亡騎士手套','克特手套','水晶手套',
    '瑪那斗篷',
    '銀騎士之盾','紅騎士之盾','魔法能量之書','塔盾',
    '精靈T恤',
    '神官頭飾','神官法袍','神官長靴','神官斗篷','神官手套',   // 🔧 神官系列：黑暗妖精禁用（僅法師/妖精）
    '巨蟻女皇的金翅膀'   // 🔧 依文本（騎士/妖精）：黑暗妖精禁用（銀翅膀文本含黑暗妖精則可用）
];
function darkEquipOk(d, id) {
    if (!d) return false;
    if (d.type === 'wpn') {
        if (d.isArrow) return true;
        if (id === 'wpn_siruge') return false;                          // 瑟魯基：禁用
        if (id === 'wpn_demon_sword_hidden') return false;              // 👹 隱藏的魔族之劍：適用王族/騎士/妖精/龍騎士（黑暗妖精改用 隱藏的魔族鋼爪）
        let tags = getWeaponTags(id);
        if (tags.includes('匕首') || tags.includes('單手劍') || tags.includes('鋼爪') || tags.includes('雙刀') || tags.includes('武士刀')) return true;   // 🔧 黑暗妖精亦可使用武士刀
        if (d.isBow) {
            // 🖤 v3.2.4 用戶要求：刪除「十字弓通則」（原 DARK_XBOW_LEGACY 白名單＋更早的名稱含十字弓判斷）——弓具可否使用一律逐把由 req 顯式標示。
            //    req 必須明確列出 dark 才可用（十字弓 wpn_31 已補 dark 保留現狀）；req:'all' 的一般長弓不可用（黑暗妖精不使用長弓·刻意非疏漏）。
            //    ⚠️新增弓/十字弓要給黑暗妖精＝req 加 dark；不給＝req 不列 dark（部分十字弓如 拉斯塔巴德重十字弓/惡魔十字弓/寂靜十字弓 即不開放）。
            return typeof d.req === 'string' && d.req !== 'all' && d.req.split(',').includes('dark');
        }
        return false;                                                   // 單手鈍器/雙手鈍器/魔杖/雙手劍/矛 等：禁用
    }
    let nm = d.n || '';
    if (DARK_LOADUP.includes(nm)) return false;   // 🔧 負重改版：負重強化不再開放重甲
    if (DARK_BLOCK.includes(nm)) return false;
    if (nm === '水晶盔甲') return true;                                 // 可使用水晶盔甲
    return reqAllowsClass(d, 'elf') || reqAllowsClass(d, 'dark');   // 其餘比照妖精可用
}
// 🔮 幻術士裝備規則：全職業裝備(req:all/無req)除「匕首」外皆可用＋下列開放清單(特定職業限定→開放給幻術士)；不可使用任何匕首。
const ILLUSION_WHITELIST = new Set([
    '黑法師項鍊','蕾雅項鍊','法令軍王之鍊','冥法軍王之戒','古老的皮盔甲','鏈甲','抗魔法鏈甲','鱗甲','黑長者涼鞋','黑暗棲林者長靴','神官長靴',
    '神官頭飾','銀光斗篷','巨蟻女皇的銀翅膀','神官斗篷','馬昆斯斗篷','水晶手套','神官手套','腕甲','抗魔法頭盔',
    '精靈皮盔','古老的長袍','巫妖斗篷','黑長者長袍','神官法袍','拉斯塔巴德長袍','喚獸師長袍','黑法師長袍','蕾雅長袍','伊娃之盾',
    '骷髏盾牌','神官魔法書','魔法能量之書','銀釘皮盾','梅杜莎盾牌','幻象眼魔的心眼','皮盾牌','木盾','小盾牌','阿克海盾牌',
    '惡魔斧頭','牛人斧頭','巨斧','狂戰士斧','戰斧','侏儒鐵斧','銀斧','戰錘','流星錘','木棒',
    '弗萊爾','釘錘','亞連','斧','力量魔法杖','神官魔杖','紅水晶魔杖','巴風特魔杖','瑪那魔杖','美基魔法杖',
    '橡木魔法杖','冰之女王魔杖','拉斯塔巴德魔杖','巫術魔法杖','巴列斯魔杖','惡魔鐮刀','黑法師之杖','蕾雅魔杖','暗黑十字弓','十字弓',
    '幽暗十字弓','尤米弓','古老的弩槍','拉斯塔巴德重十字弓','短弓','歐西斯弓','獵人之弓','精靈弓','拉斯塔巴德弓','黑暗十字弓'
]);
function illusionEquipOk(d, id) {
    if (!d) return false;
    if (d.type === 'wpn' && getWeaponTags(id).includes('匕首')) return false;   // 🔮 幻術士無法使用任何匕首（含全職業匕首）
    if (d.type === 'wpn' && ['單手矛', '雙手矛'].includes(atkSpdFamily(id))) return false;   // 🔮 v3.0.90 用戶：幻術士不可使用任何矛（含全職業矛·早退→req:all／開放清單皆擋）
    if (reqAllowsClass(d, 'illusion')) return true;   // 全職業(req:all/無req·匕首已排除)或 req 含 illusion（奇古獸/幻術士專屬裝備）
    if (ILLUSION_WHITELIST.has(d.n || '')) return true;   // 開放清單（特定職業限定→開放給幻術士）
    return false;
}
// 🐉 龍騎士裝備規則：全職業裝備(req:all/無req)除「匕首」外皆可用＋下列開放清單(特定職業限定→開放給龍騎士)；不可使用任何匕首。
const DRAGON_WHITELIST = new Set([
    '古老的鱗甲','金屬蜈蚣皮盔甲','死亡盔甲','鏈甲','抗魔法鏈甲','精靈鏈甲','鱗甲',
    '巴列斯長靴','黑暗棲林者長靴','武官長靴','巨蟻女皇的金翅膀','銀光斗篷','武官斗篷','馬昆斯斗篷',
    '水晶手套','巴蘭卡手套','墮落手套','武官手套','腕甲','抗魔法頭盔','巴蘭卡頭盔','武官頭盔','精靈皮盔',
    '伊娃之盾','骷髏盾牌','武官之盾','銀釘皮盾','侏儒圓盾','拉斯塔巴德圓盾','大盾牌','反射之盾','梅杜莎盾牌','皮盾牌','木盾','小盾牌','阿克海盾牌','死亡之盾',
    '巨斧','狂戰士斧','戰斧','侏儒鐵斧','銀斧','戰錘','流星錘','木棒','弗萊爾','釘錘','亞連','斧',
    '古老的劍','惡魔之劍','黑燄之劍','瑟魯基之劍','克特之劍','黑暗之劍','細劍','大馬士革刀','武士刀','拉斯塔巴德長劍','侵略者之劍','精靈短劍','彎刀','長劍','紅騎士之劍','銀長劍','小侏儒短劍','銀劍','奧里哈魯根的劍身','歐西斯短劍','鎖子甲破壞者','闊劍','長劍的劍身','短劍的劍身',
    '屠龍劍','古老的巨劍','騎士范德之劍','復仇之劍','巨劍','武官雙手劍','雙手劍','血色巨劍'
]);
function dragonEquipOk(d, id) {
    if (!d) return false;
    if (d.type === 'wpn' && getWeaponTags(id).includes('匕首')) return false;   // 🐉 龍騎士無法使用任何匕首（含全職業匕首）
    if (d.type === 'wpn' && ['單手矛', '雙手矛'].includes(atkSpdFamily(id))) return false;   // 🐉 v3.0.90 用戶：龍騎士不可使用任何矛（含全職業矛·早退→req:all／開放清單皆擋）
    if (reqAllowsClass(d, 'dragon')) return true;   // 全職業(req:all/無req·匕首已排除)或 req 含 dragon（龍騎士專屬裝備）
    if (DRAGON_WHITELIST.has(d.n || '')) return true;   // 開放清單（特定職業限定→開放給龍騎士）
    return false;
}
// 🔧 物品職業限制（白名單）單一事實來源：無 req、'all'、或 req（逗號分隔）含該職業即可使用/裝備。
//    全遊戲一律採「白名單」寫法（無「黑名單禁止職業」機制）；各處請呼叫此函式，勿再各自手寫 d.req 比對。
function reqAllowsClass(d, cls) {
    if (!d || !d.req || d.req === 'all') return true;
    return typeof d.req === 'string' && d.req.split(',').includes(cls);
}
// ⚔️ 戰士裝備規則（白名單制）：武器僅限「單手鈍器／雙手鈍器」(或 req 含 warrior 的戰士專屬武器)；
//    防具僅「標註全職業(req:all)的非盾牌防具」＋下列具名開放清單(含臂甲 slot:shield、職業限定防具、勇敢皮帶)；飾品＝全職業(req:all)的戒指／項鍊／腰帶皆可裝＋勇敢皮帶(req:knight 具名)；其餘(劍/弓/匕首/魔杖/盾牌/職業限定飾品)一律不可裝備。
const WARRIOR_WHITELIST = new Set([
    '勇敢皮帶','古老的金屬盔甲','巴風特盔甲','金屬蜈蚣皮盔甲','巴蘭卡盔甲','死亡盔甲','克特盔甲','金屬盔甲','鋼鐵金屬盔甲','死亡騎士盔甲','武官護鎧','皮甲','藤甲','青銅盔甲','精靈金屬盔甲','鏈甲','抗魔法鏈甲','精靈鏈甲','精靈護胸金屬板','鱗甲','歐西斯鏈甲','小藤甲',
    '克特長靴','死亡騎士長靴','巴列斯長靴','黑暗棲林者長靴','武官長靴','巨蟻女皇的金翅膀',
    '水晶手套','巴蘭卡手套','克特手套','死亡騎士手套','武官手套','腕甲','守護者臂甲','體力臂甲',
    '騎士面甲','鋼鐵頭盔','克特頭盔','死亡騎士頭盔','巴蘭卡頭盔','武官頭盔','治癒魔法頭盔','敏捷魔法頭盔','力量魔法頭盔'
]);
// ⚔️ 戰士額外開放使用的具名武器（矛／槍類等非鈍器；使用者指定開放清單，依名稱比對 d.n）
const WARRIOR_WEAPON_WHITELIST = new Set([
    '古代神之槍','深紅長矛','貝卡合金','露西錘','法丘','吉薩','闊矛','拉斯塔巴德矛',
    '覆上奧里哈魯根的角','精靈之矛','帕提森','槍','覆上米索莉的角','三叉戟','歐西斯之矛','潘的角'
]);
function warriorEquipOk(d, id) {
    if (!d) return false;
    if (d.type === 'wpn') {
        if (d.isArrow) return false;                                                   // 戰士不用弓箭
        let tags = getWeaponTags(id);
        if (tags.includes('單手鈍器') || tags.includes('雙手鈍器')) return true;        // 所有單手／雙手鈍器
        if (WARRIOR_WEAPON_WHITELIST.has(d.n || '')) return true;                       // ⚔️ 具名開放武器（矛／槍等）
        return !!(d.req && typeof d.req === 'string' && d.req.split(',').includes('warrior'));   // 戰士專屬武器（保險；古代神之斧等本就具鈍器 tag）
    }
    if (WARRIOR_WHITELIST.has(d.n || '')) return true;                                 // 具名開放清單（職業限定防具／臂甲／勇敢皮帶[req:knight]）
    if (d.type === 'acc' && reqAllowsClass(d, 'warrior')) return true;                 // ⚔️ 標註全職業(req:all)的飾品（戒指／項鍊／腰帶）皆可裝（2026-06 使用者要求）
    if (d.type === 'arm' && d.slot !== 'shield' && reqAllowsClass(d, 'warrior')) return true;   // 標註全職業的非盾牌防具
    if (d.type === 'arm' && d.armguard && reqAllowsClass(d, 'warrior')) return true;   // 🛡️ 全職業臂甲（req:all·副手非真盾）：戰士可用（古代鬥士/神射臂甲等；職業限定臂甲仍由 req 擋）
    return false;
}
// 👑 王族裝備規則：全職業(req:all/無req)武器/飾品/防具＋req 含 royal（黃金權杖等）＋下列具名開放清單（特定職業限定→開放給王族）
const ROYAL_WHITELIST = new Set([
    '冥法軍王之戒',
    '小藤甲','歐西斯鏈甲','鱗甲','精靈護胸金屬板','精靈鏈甲','抗魔法鏈甲','鏈甲','青銅盔甲','藤甲','皮甲','金屬盔甲','死亡盔甲','水晶盔甲','古老的鱗甲',
    '墮落長靴','木乃伊王的王冠','紅騎士頭巾','巨蟻女皇的金翅膀','墮落手套','體力臂甲','守護者臂甲','抗魔法頭盔','治癒魔法頭盔','敏捷魔法頭盔','力量魔法頭盔',
    '死亡之盾','阿克海盾牌','小盾牌','木盾','皮盾牌','梅杜莎盾牌','反射之盾','大盾牌','拉斯塔巴德圓盾','侏儒圓盾','銀釘皮盾','骷髏盾牌','伊娃之盾',
    '斧','亞連','釘錘','弗萊爾','木棒','流星錘','戰錘','銀斧','侏儒鐵斧','戰斧','巨斧','牛人斧頭','惡魔斧頭',
    '骰子匕首','歐西斯匕首','拉斯塔巴德短劍','精靈匕首','匕首','魔力短劍','米索莉短劍','奧里哈魯根短劍','小武士刀','水晶短劍','混沌之刺',
    '橡木魔法杖','短劍的劍身','長劍的劍身','闊劍','鎖子甲破壞者','歐西斯短劍','奧里哈魯根的劍身','短劍','銀劍','小侏儒短劍','銀長劍','紅騎士之劍','長劍','彎刀','精靈短劍','侵略者之劍','武士刀','大馬士革刀','細劍','黑暗之劍','克特之劍','死亡騎士的烈炎之劍','惡魔之劍','古老的劍',
    '雙手劍','巨劍','底比斯歐西里斯雙手劍','古老的巨劍','屠龍劍',
    '拉斯塔巴德弓','獵人之弓','歐西斯弓','短弓'
]);
function royalEquipOk(d, id) {
    if (!d) return false;
    if (reqAllowsClass(d, 'royal')) return true;   // 👑 全職業(req:all/無req) 或 req 含 royal（黃金權杖／王族裝備等）
    if (ROYAL_WHITELIST.has(d.n || '')) return true;   // 具名開放清單（特定職業限定→開放給王族）
    return false;
}
function checkCanEquip(item) {
    let equipId = item.id, d = DB.items[equipId];
    // 固定遺物變體沿原裝備的完整判定（含具名／ID 例外）；舊手工遺物仍維持 req 規則。
    if (d && d.relicBaseId !== undefined) {
        let baseId = d.relicBaseId, base = typeof baseId === 'string' && DB.items[baseId];
        if (!base || base.relic || base.relicBaseId !== undefined || !['wpn', 'arm', 'acc'].includes(base.type)) return false;
        equipId = baseId; d = base;
    }
    if (d && d.reqAvatar && player && ((d.strictAvatar && player.avatar !== d.reqAvatar) || (!d.strictAvatar && player.avatar && player.avatar !== d.reqAvatar))) return false;   // 👸 性別頭像限定；strictAvatar（純潔少女的憐愛）要求必須明確為女妖精，舊檔缺 avatar 亦不放行
    // 🏺 遺物：職業限制純以 req 白名單為準＝略過各職業專屬 *EquipOk 武器/防具清單（否則戰士等會被拒）。
    //    ⚠️ v3.7.83 修：原本這裡是 `return reqAllowsClass(...)` 直接早退，連帶把下方共用尾段的**劍術精通例外**也跳過了
    //    → 妖精選劍術精通後，一般的騎士限定單手武器借得到、同條件的「遺物」卻裝不上（8 件）。改成只跳過 *EquipOk 分派、
    //    仍走同一條尾段，遺物與一般裝備的判定路徑就完全一致。
    if (!isRelic(d)) {
        if (player.cls === 'dark') return darkEquipOk(d, equipId);   // 🔧 黑暗妖精專屬裝備規則
        if (player.cls === 'illusion') return illusionEquipOk(d, equipId);   // 🔮 幻術士專屬裝備規則（除匕首外的全職業裝備＋開放清單）
        if (player.cls === 'dragon') return dragonEquipOk(d, equipId);   // 🐉 龍騎士專屬裝備規則（除匕首外的全職業裝備＋開放清單）
        if (player.cls === 'warrior') return warriorEquipOk(d, equipId);   // ⚔️ 戰士專屬裝備規則（白名單制：鈍器＋全職非盾防具＋開放清單）
        if (player.cls === 'royal') return royalEquipOk(d, equipId);   // 👑 王族專屬裝備規則（全職業裝備＋具名開放清單）
    }
    // 1. 基本職業判定
    let canEquip = reqAllowsClass(d, player.cls);

    // 2. 負重強化的擴充判定
    if (!canEquip && loadUpAllows(equipId)) canEquip = true;
    // 3. 🏅 劍術精通：妖精可裝備騎士限定的單手武器（非雙手、非弓）——⚠️ 遺物同樣適用（v3.7.83 起遺物也會走到這裡）
    if (!canEquip && hasMastery('e_sword') && d.type === 'wpn' && !d.w2h && !d.isBow && d.req && d.req.includes('knight')) canEquip = true;
    return canEquip;
}

// 🏝️ 沙哈之弓：裝備時自動賦予「彈藥無限的沙哈之箭」；卸下/換成其他武器時移除。每次裝備變動後呼叫（冪等）。
function syncShahaArrow() {
    let wpn = player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    let isShahaBow = !!(wpn && wpn.shahaBow);
    let arrowIsShaha = !!(player.eq.arrow && player.eq.arrow.id === 'wpn_shaha_arrow');
    if (isShahaBow && !arrowIsShaha) {
        if (player.eq.arrow) {   // 先把原本的真實箭矢退回背包，再換上虛擬箭
            let e = player.eq.arrow;
            if (!invMergeBack(e)) player.inv.push(e);
        }
        player.eq.arrow = { id: 'wpn_shaha_arrow', cnt: 1, uid: uid() };
    } else if (!isShahaBow && arrowIsShaha) {
        player.eq.arrow = null;   // 卸下沙哈之弓：虛擬箭消失（不退背包）
    }
}
// 🏝️ 風之頭盔：裝備中或背包內任一即可（加速術/強力加速術免MP）
function playerHasWindHelm() {
    return !!((player.eq && player.eq.helm && player.eq.helm.id === 'hlm_wind') || (player.inv && player.inv.some(i => i.id === 'hlm_wind')));
}

function equipItem(item) {
    let d = DB.items[item.id];
    // 🦴 v3.2.37 寵物裝備改個別裝備制：玩家無寵物裝備欄——請至寵物保管為單一寵物裝上（v3.7.7 保管人兩位）
    if (d && (d.slot === 'petwpn' || d.slot === 'petarm')) { logSys('<span class="text-amber-300">寵物裝備請到寵物保管（亞丁 包武／古魯丁 奧斯丁）為指定寵物裝上。</span>'); return; }
    let slot = d.type === 'wpn' ? 'wpn' : d.slot;
    if (d.isArrow) slot = 'arrow'; // 如果是箭矢，強制分配到 arrow 欄位
    // ⚔️ 迅猛雙斧雙持：已學迅猛雙斧且主手已是單手鈍器時，再裝單手鈍器 → 放副手 offwpn 欄
    if (slot === 'wpn' && !d.isArrow && warriorDualWieldWpnOk(item.id) && dualWieldOffhandOk()) slot = 'offwpn';

    // 職業/裝備資格統一走 checkCanEquip（含黑暗妖精規則、負重強化、劍術精通例外），與顯示用判定同一來源
    if (!checkCanEquip(item)) {
        logSys(d.reqAvatar ? `無法裝備，「${d.n}」僅限${d.reqAvatar}。` : `無法裝備，職業不符。`);
        return;
    }

    // 🔧 唯一標記：身上最多只能裝備 1 個同一件唯一物品
    if (d.unique && Object.values(player.eq).some(e => e && e !== item && e.id === item.id)) {
        logSys(`<span class="text-amber-300">「${d.n}」帶有「唯一」標記，身上最多只能裝備 1 個。</span>`);
        return;
    }

    if (slot === 'ring') {
        if(!player.eq.ring1) slot = 'ring1';
        else if(!player.eq.ring2) slot = 'ring2';
        else if(player.lv >= 76 && !player.eq.ring3) slot = 'ring3';   // 第3戒指欄：需 Lv76
        else if(player.lv >= 81 && !player.eq.ring4) slot = 'ring4';   // 第4戒指欄：需 Lv81
        else slot = 'ring1';
    }

    // 🦻 耳環欄位分配：一開始 1 個（ear1），Lv59 開放第 2 個（ear2），最多 2 個
    if (slot === 'ear') {
        if(!player.eq.ear1) slot = 'ear1';
        else if(player.lv >= 59 && !player.eq.ear2) slot = 'ear2';   // 第2耳環欄：需 Lv59
        else slot = 'ear1';
    }
    // 🦻 不能同時裝備兩個名字相同的耳環
    if (slot === 'ear1' || slot === 'ear2') {
        let _other = (slot === 'ear1') ? player.eq.ear2 : player.eq.ear1;
        if (_other && DB.items[_other.id] && DB.items[_other.id].n === d.n) {
            logSys(`<span class="text-amber-300">「${d.n}」無法同時裝備兩個名字相同的耳環。</span>`);
            return;
        }
    }

    // 💍 相同名字戒指最多裝兩顆：目標欄以外的戒指欄已有 2 顆同款（同 id）→ 阻擋裝第 3 顆（換上同款升級/不同強化值不受影響）
    if ((slot === 'ring1' || slot === 'ring2' || slot === 'ring3' || slot === 'ring4')
        && ['ring1','ring2','ring3','ring4'].filter(rs => rs !== slot && player.eq[rs] && player.eq[rs].id === item.id).length >= 2) {
        logSys(`<span class="text-amber-300">「${d.n}」相同的戒指最多只能同時裝備 2 顆。</span>`);
        return;
    }

    // 🔧 詛咒鎖定：欲換裝的欄位若有詛咒裝備，無法替換（等同被迫卸下）
    if (isEquipCursed(slot)) { logSys('<span class="text-red-400 font-bold">原本的裝備被詛咒纏身，無法更換！</span><span class="text-red-300">請先解除詛咒。</span>'); return; }
    // ⚠️ 有效性守衛必須在所有互斥卸下「之前」：modal 內的 item 是 JSON 快照，背包實體可能已被
    //    自動販賣（每 10 秒）賣掉。若先卸盾再發現背包沒這件而 return，就會停在「盾被卸下、新武器沒裝上、
    //    player.d 仍計入盾牌加成」的殘缺狀態（且不呼叫 calcStats/renderTabs/closeModal）。
    let invItem = player.inv.find(i => i.uid === item.uid);
    if (!invItem) { logSys('<span class="text-slate-400">該物品已不在背包中。</span>'); closeModal(); renderTabs(); return; }
    // 雙手武器（弓 / w2h）無法與盾牌並存：裝雙手武器自動卸盾、裝盾自動卸雙手武器
    // 🛡️ 臂甲（armguard）例外：可與雙手武器並用，故不互相卸下（仍與盾牌共用副手欄、自然互斥）
    if (slot === 'wpn' && effTwoHanded(d, item.id) && player.eq.shield && !DB.items[player.eq.shield.id].armguard) {
        if (isEquipCursed('shield')) { logSys('<span class="text-red-400 font-bold">被詛咒的盾牌無法卸下，無法裝備雙手武器！</span>'); return; }
        returnEquipToInv('shield');
        logSys(`雙手武器無法持盾，已卸下盾牌。`);
    } else if (slot === 'shield' && !d.armguard && player.eq.wpn && effTwoHanded(DB.items[player.eq.wpn.id], player.eq.wpn.id)) {
        if (isEquipCursed('wpn')) { logSys('<span class="text-red-400 font-bold">被詛咒的雙手武器無法卸下，無法裝備盾牌！</span>'); return; }
        returnEquipToInv('wpn');
        logSys(`裝備盾牌，已卸下雙手武器。`);
    }
    // ⚔️ v3.4.21 副手位置互斥：戰士副手武器（迅猛雙斧 offwpn）與 盾牌／臂甲 共用副手位置，只能擇一裝備
    if (slot === 'offwpn' && player.eq.shield) {   // 裝副手武器 → 卸下盾牌/臂甲
        if (isEquipCursed('shield')) { logSys('<span class="text-red-400 font-bold">被詛咒的副手裝備無法卸下，無法持用副手武器！</span>'); return; }
        let _sd = DB.items[player.eq.shield.id];
        let _snm = (_sd && _sd.armguard) ? '臂甲' : '盾牌';
        returnEquipToInv('shield');
        logSys(`副手改持武器，已卸下${_snm}。`);
    } else if (slot === 'shield' && player.eq.offwpn) {   // 裝盾牌/臂甲 → 卸下副手武器
        if (isEquipCursed('offwpn')) { logSys('<span class="text-red-400 font-bold">被詛咒的副手武器無法卸下，無法裝備' + (d.armguard ? '臂甲' : '盾牌') + '！</span>'); return; }
        let _on = DB.items[player.eq.offwpn.id];
        returnEquipToInv('offwpn');
        logSys(`副手改裝${d.armguard ? '臂甲' : '盾牌'}，已卸下副手武器${_on ? ' ' + _on.n : ''}。`);
    }

    let isStackable = (slot === 'arrow'); // 箭矢支援整組堆疊裝備

    // 如果該欄位已經有裝備，先退回背包。
    // 必須在快照 singleItem「之前」執行：同種箭矢會併入即將裝備的同一堆疊，
    // 若先快照數量再合併，整疊移除時舊箭會憑空消失（如身上500+背包1000 → 裝備後只剩1000）。
    if (player.eq[slot]) {
        let oldEq = player.eq[slot];
        if (!invMergeBack(oldEq)) player.inv.push(oldEq);   // 🔧 架構#3：統一簽章比對（🔒 v3.6.92 單一真相 invMergeBack）
        player.eq[slot] = null;
    }

    let singleItem = { ...invItem, cnt: isStackable ? invItem.cnt : 1, uid: isStackable ? invItem.uid : uid() };   // 非堆疊裝備：裝上的實例給新 uid，避免與背包剩餘堆疊共用同一 uid 而造成物品消失
    // 🗑️ 清掉自動販賣的暫態旗標：「穿上」＝明確表示要留著。
    //    否則帶著舊 junkSince 的物品在卸下回背包的瞬間就過了寬限期，會被下一次 10 秒掃描直接賣掉。
    //    _userKeep 一併設起來，防 applyAutoSellRules 在卸下後立刻依規則重新標記。
    singleItem.junk = false; delete singleItem.junkSince; delete singleItem._autoSellQty; delete singleItem._ruleJunk; singleItem._userKeep = true;

    // 從背包扣除 (箭矢直接移除整把，其他扣 1 個)
    if (isStackable) {
        player.inv = player.inv.filter(i => i.uid !== invItem.uid);
    } else {
        invItem.cnt--;
        if (invItem.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== invItem.uid);
    }
    
    player.eq[slot] = singleItem;
    syncShahaArrow();   // 🏝️ 沙哈之弓：裝備/換武器後同步無限箭
    syncDualWield();    // ⚔️ 迅猛雙斧：換主手後若副手條件失效則退回背包

    logSys(`裝備了 ${getItemFullName(singleItem)}。`);
    calcStats();
    renderTabs();
    renderSkillSelects();   // 穿戴裝備後即時更新自動化技能選項（如魔法頭盔授予的法術）
    closeModal();
}

// 🔧 詛咒鎖定：裝備出現「詛咒的」時無法卸下，也無法被換裝退回背包；需先用解除詛咒卷軸消除詛咒
function isEquipCursed(slot) { let e = player.eq[slot]; return !!(e && e.bless === 'cursed'); }

function unequipItem(slot) {
    if (isEquipCursed(slot)) { logSys('<span class="text-red-400 font-bold">這件裝備被詛咒纏身，無法卸下！</span><span class="text-red-300">請至象牙塔『碧恩』處使用 解除詛咒的卷軸 消除詛咒。</span>'); return; }
    if (player.eq[slot]) {
        let e = player.eq[slot];
        if (e.id === 'wpn_shaha_arrow') {   // 🏝️ 沙哈之箭＝虛擬無限箭：卸下不回背包（避免外洩→販售/存倉/複製）；仍裝沙哈之弓則由 syncShahaArrow 重新注入
            player.eq[slot] = null;
        } else {
            if (!invMergeBack(e)) player.inv.push(e);   // 🔧 架構#3：統一簽章比對（🔒 v3.6.92 單一真相 invMergeBack）
            player.eq[slot] = null;
        }
        syncShahaArrow();   // 🏝️ 卸下沙哈之弓 → 移除無限箭
        syncDualWield();    // ⚔️ 迅猛雙斧：卸下主手後副手條件失效則退回背包
        calcStats();
        renderTabs();
        renderSkillSelects();   // 卸下裝備後即時更新自動化技能選項
    }
    closeModal();
}

function consume(item) {
    item.cnt--;
    if (item.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== item.uid);
    renderTabs();
}

function buyItem(id, qty) {
    qty = Math.max(1, Math.floor(Number(qty) || 1));   // 數量正規化，至少 1

    // 箭 / 銀箭：一「份」= 1000，單價固定，qty 代表份數（🚫 v3.2.17 肉已隨舊項圈系統移除）
    let bundle = (id === 'wpn_5')        ? { unit: 100, amount: 1000, n: '箭',   suffix: '根' }
               : (id === 'wpn_22')       ? { unit: 200, amount: 1000, n: '銀箭', suffix: '根' }
               : null;
    if (bundle) {
        let cost = shopPrice(bundle.unit) * qty;
        if (player.gold < cost) { logSys(`金幣不足。`); return; }
        player.gold -= cost;
        gainItem(id, bundle.amount * qty, true, true);
        logSys(`購買了 ${bundle.n} (${(bundle.amount * qty).toLocaleString()}${bundle.suffix})。`);
        updateUI();
        return;
    }

    // 一般物品：單價 p × 數量
    let p = shopPrice(DB.items[id].p || 0);
    let cost = p * qty;
    if (player.gold < cost) { logSys(`金幣不足。`); return; }
    player.gold -= cost;
    gainItem(id, qty, true, true);
    logSys(`購買了 ${DB.items[id].n}${qty > 1 ? ` ×${qty}` : ''}。`);
    updateUI();
}

let activeScroll = null;
// 🗑️ v3.5.83 移除 openEnhanceModal()：唯一呼叫端（type==='scroll' 分支）不可達，且其 `scroll.target` 欄位
//    在 DB.items 全表零定義（比較退化成 type === undefined，targets 恆為空）。

function doEnhance(targetUid, isEq = true) {
    if(!activeScroll) return;
    
    let target, slot;
    if (isEq) {
        target = Object.values(player.eq).find(e => e && e.uid === targetUid);
        slot = Object.keys(player.eq).find(k => player.eq[k] === target);
    } else {
        target = player.inv.find(i => i.uid === targetUid);
    }
    
    if(!target) return;

    let d = DB.items[target.id];
    if (isRelic(d) || (d && d.noEnhance)) { logSys(`<span class="c-relic">${getItemFullName(target)} 無法強化。</span>`); activeScroll = null; if (typeof closeModal === 'function') closeModal(); return; }   // 🏺 遺物/古老系列/娃娃：無法強化（防呆·enumeration 已濾除·此為直點路徑保險）
    let _cap = enhanceCap(d);   // 🔧 強化上限：武器+15 / 防具+15 / 飾品+5
    if ((Number(target.en) || 0) >= _cap) {   // 已達上限：不消耗卷軸，提示後返回
        logSys(`<span class="text-amber-300">${getItemFullName(target)} 已達強化上限（+${_cap}），無法再強化。</span>`);
        activeScroll = null; closeModal();
        return;
    }
    let scroll = activeScroll;
    activeScroll = null;
    consume(scroll); // 消耗卷軸
    
    // 👇 核心邏輯：如果強化的是「背包」裡的裝備，且數量 > 1，則拆分出一件來衝，保護其餘裝備不被波及
    if (!isEq && target.cnt > 1) {
        target.cnt--;
        let singleItem = { ...target, cnt: 1, uid: uid() }; 
        player.inv.push(singleItem);
        target = singleItem; 
    }
    
    let success = false, destroy = false, nochange = false;
    // 防呆：強化值正規化為有效數字。若 en 為 undefined/NaN，(undefined < safe) 會是 false 而誤入失敗/爆裝分支，
    //        導致看似 +0 的武器仍可能消失。此處統一視為 0，確保 +0(含未初始化 en)在安定值內必定成功、不會爆裝。
    target.en = Number(target.en) || 0;

    // 🏰 天堂經典衝裝規則（v3.0.76·機率單一真相 enhanceRollOutcome，見 js/01）：
    //   安定值內 100% 成功（祝福卷軸跳級到安定值以上也不套用失敗/爆裝——成功在加值前判定）；
    //   武器超過安定值：+9 前 1/3 過、2/3 爆；+9 起 1/6 過、1/6 無事、4/6 爆
    //   防具(安定值>0)：1/目前強化值；防具(安定值0)/飾品：+0 1/2、+1 以上 1/(強化值×2)；失敗即爆裝
    let _oc = enhanceRollOutcome(d, target.en);
    if (_oc === 'ok') success = true;
    else if (_oc === 'break') destroy = true;
    else nochange = true;   // 武器 +9 起 1/6 無事：卷軸已消耗、強化值不變

    let fn = getItemFullName(target);
    if (success) {
        let add = (DB.items[scroll.id] && DB.items[scroll.id].isB) ? blessEnhanceGain(target.en) : 1;   // 🌟 祝福卷：+2 以下(含負值) +1~+3、+3~+5 +1~+2、+6 起等同一般卷 +1（純機率）
        target.en = Math.min(_cap, target.en + add);   // 🔧 祝福卷軸跳級不超過上限
        let prefix = (target.en > (d.safe||0)) ? "持續" : "";
        let _enTxt = '+' + capEn(target.en, d);   // 🔧 顯示 +N（夾擠至強化上限）
        logSys(`<span class="text-yellow-400 font-bold">${_enTxt} ${d.n} ${prefix}發出銀色的光芒。</span>`);
    } else if (destroy) {
        logSys(`<span class="text-red-500 font-bold">${fn} 強烈的發出銀色的光芒就消失了。</span>`);
        if (isEq) {
            player.eq[slot] = null; // 碎掉身上裝備
            // ⚠️ 爆裝後必須同步副手／沙哈箭：否則主手被炸掉時 offwpn 會殘留在「無主手」的非法狀態，
            //    沙哈之箭被炸掉時 eq.arrow=null 又不會重新注入 → 沙哈之弓在玩家手動重裝前射不出來。
            if (typeof syncShahaArrow === 'function') syncShahaArrow();
            if (typeof syncDualWield === 'function') syncDualWield();
        } else {
            player.inv = player.inv.filter(i => i.uid !== target.uid); // 碎掉背包裝備
        }
    } else {
        logSys(`<span class="text-slate-400">${fn} 一瞬間發出銀色的光芒。</span>`);
    }
    
    calcStats();
    renderTabs();
    closeModal();
    
    // 👇 自動存檔機制：不論成功、失敗或無變化，結算完立刻強制儲存進度！
    saveGame(); 
}

// 玩家身上的「減益(debuff)」狀態對照表（player.statuses 內具持續時間的鍵）
const PLAYER_DEBUFF_NAME = {
    stun: '暈眩', freeze: '冰凍', stone: '石化', paralyze: '麻痺',
    silence: '沉默', magicseal: '魔法封印', poison: '中毒',
    burn: '灼燒', scald: '燙傷', evilAura: '邪靈之氣',
    weaken: '弱化', disease: '疾病', blind: '目盲', potionFrost: '藥水霜化',   // 🌅 日出之國新異常
    foulWater: '汙濁之水'   // 🌊 v3.6.20 玩家NPC二模板（妖精）：受到治癒效果減半
};

// 🌩️ v3.5.94 玩家減益的狀態圖示對照（值＝assets/state-icons/<值>.jpg 的檔名，供 renderStatusIconBar 使用）。
//   為什麼要有這張表：在此之前 debuff 只有 renderStatusEffects 的純文字渲染，全專案沒有任何 debuff 圖示路徑，
//   導致 弱化術/疾病術/闇盲咒術/藥水霜化術 等既有美術恆不使用（v3.5.79 體檢報告的孤兒圖檔來源之一）。
//   為什麼只列一部分：語意能一對一對上的才給圖——寧可留純文字，也不要放語意不符的圖示誤導玩家。
//   freeze/stone/paralyze/burn/scald/evilAura 目前沒有語意相符的美術 → 維持文字顯示（日後補圖再加一行即可）。
const PLAYER_DEBUFF_ICON = {
    stun: '衝擊之暈', silence: '禁言', magicseal: '魔法封印', poison: '毒咒',
    weaken: '弱化術', disease: '疾病術', blind: '闇盲咒術', potionFrost: '藥水霜化術'
};

// 增益顏色設定：
// 1) 想單獨指定某個技能的顏色，直接在 BUFF_COLOR_OVERRIDE 加一行即可（key = 技能ID）
// 2) 未指定者，依技能效果類別自動上色（攻擊/防禦/能力/回復/召喚/加速）
const BUFF_COLOR_OVERRIDE = {
    // 範例： "sk_shield": "text-cyan-300", "sk_berserk": "text-red-400",
};

function getBuffColor(k, def) {
    if(BUFF_COLOR_OVERRIDE[k]) return BUFF_COLOR_OVERRIDE[k];
    if(def.summon) return 'text-pink-400';            // 召喚類 (粉紅)
    if(def.haste)  return 'text-emerald-400';         // 加速類 (翠綠)
    let d = def.d || {};
    if(['meleeDmg','rangedDmg','extraDmg','magicDmg','meleeHit','rangedHit','extraHit','magicHit'].some(s => d[s]))
        return 'text-rose-400';                       // 攻擊增益 (玫瑰紅)
    if(['ac','er','mr','dr','resFire','resWater','resEarth','resWind'].some(s => d[s]))
        return 'text-sky-300';                        // 防禦增益 (天藍)
    if(['str','dex','con','int','wis'].some(s => d[s]))
        return 'text-violet-400';                     // 能力增益 (紫羅蘭)
    if(d.mpR || d.extraMp) return 'text-blue-400';    // 回復/魔力 (深藍)
    return 'text-amber-300';                          // 其他 (琥珀黃)
}

// 戰鬥畫面右上狀態 ICON（原版天堂風格）。本表＝「有圖示的持續增益」白名單；召喚、瞬發與缺圖技能不顯示。
// ⚠️ v3.5.94 修正舊註解的誤導：本表 ≠ assets/state-icons 資料夾內容。圖示 URL 全專案只有下方 renderStatusIconBar
//    一處組裝，來源＝本表 ＋ 函式開頭幾個硬編藥水/誘捕/變身 buff ＋ PLAYER_DEBUFF_ICON ＋ 持續治療兩筆。
//    資料夾裡沒被這幾處引用到的檔案就是孤兒（曾累積到 70 個），請搬進 tools/_archive/state-icons-unused/ 而非直接刪。
const STATUS_ICON_SKILLS = {
    'sk_sunlight':'日光術','sk_shield':'保護罩','sk_holy_wpn':'神聖武器','sk_ench_wpn':'擬似魔法武器','sk_reveal':'無所遁形術','sk_load_up':'負重強化','sk_shield2':'鎧甲護持',
    'sk_dex_up':'通暢氣脈術','sk_magic_shield':'魔法屏障','sk_meditation':'冥想術','sk_haste_spell':'加速術','sk_str_up':'體魄強健術',
    'sk_bless_wpn':'祝福魔法武器','sk_greater_haste':'加速術','sk_berserk':'狂暴術','sk_holy_dash':'神聖疾走','sk_blizzard_storm':'冰雪颶風','sk_fire_prison':'火牢','sk_invisible':'隱身術','sk_heal_energy_storm':'治癒能量風暴',
    'sk_holy_barrier':'聖結界','sk_soul_up':'靈魂昇華','sk_solid_shield':'堅固防護','sk_reduction_armor':'增幅防禦','sk_spike_armor':'尖刺盔甲',
    'sk_counter_barrier':'反擊屏障','sk_elf_mr':'魔法防禦','sk_elf_purify':'淨化精神','sk_elf_eleres':'屬性防禦','sk_elf_singleres':'單屬性防禦',
    'sk_elf_firewpn':'火焰武器','sk_elf_windshot':'風之神射','sk_elf_winddash':'風之疾走','sk_elf_earthguard':'大地防護','sk_elf_watervital':'水之元氣',
    'sk_elf_dancefire':'舞躍之火','sk_elf_stormeye':'暴風之眼','sk_elf_earthshield':'大地屏障','sk_elf_earthbless':'大地的祝福','sk_elf_blazewpn':'烈炎武器',
    'sk_elf_flamesoul':'烈焰之魂','sk_elf_stormshot':'暴風神射','sk_elf_preciseshot':'精準射擊','sk_elf_steelguard':'鋼鐵防護','sk_elf_attrfire':'屬性之火',
    'sk_elf_physboost':'體能激發','sk_elf_energyboost':'能量激發','sk_elf_mirror':'鏡反射','sk_dark_str':'力量提升','sk_dark_mrup':'影之防護',
    'sk_dark_stealth':'暗隱術','sk_dark_poison':'附加劇毒','sk_dark_dex':'敏捷提升','sk_dark_poisonres':'毒性抵抗','sk_dark_burn':'燃燒鬥志',
    'sk_dark_walkhaste':'行走加速','sk_dark_fang':'暗影之牙','sk_dark_dodge':'暗影閃避','sk_dark_erup':'迴避提升','sk_dark_double':'雙重破壞',
    'sk_illu_ogre':'幻覺：歐吉','sk_illu_cube_burn':'立方：燃燒','sk_illu_mirror':'鏡像','sk_illu_focus':'專注','sk_illu_lich':'幻覺：巫妖',
    'sk_illu_cube_quake':'立方：地裂','sk_illu_golem':'幻覺：鑽石高崙','sk_illu_cube_shock':'立方：衝擊','sk_illu_endure':'耐力','sk_illu_avatar':'幻覺：化身',
    'sk_illu_insight':'洞察','sk_illu_cube_harmony':'立方：和諧','sk_illu_pain':'疼痛的歡愉','sk_dragon_armor':'龍之護鎧','sk_dragon_flameslash':'燃燒擊砍','sk_dragon_awaken_antares':'覺醒：安塔瑞斯',
    'sk_dragon_bloodlust':'血之渴望','sk_dragon_awaken_falion':'覺醒：法利昂','sk_dragon_deadlybody':'致命身軀','sk_dragon_awaken_baraka':'覺醒：巴拉卡斯','sk_royal_precise':'精準目標','sk_royal_burnweapon':'灼熱武器','sk_royal_bravewill':'勇猛意志','sk_royal_shield':'閃亮之盾',
    'sk_warrior_throwaxe':'戰斧投擲','sk_warrior_endurance':'體能強化','sk_warrior_outlaw':'亡命之徒',
    // 裝備法術沿用原法術圖示。
    'sk_helm_dex1':'通暢氣脈術','sk_helm_dex2':'加速術','sk_helm_str1':'擬似魔法武器','sk_helm_str2':'無所遁形術','sk_helm_str3':'體魄強健術'
};
function renderStatusIconBar() {
    let bar=document.getElementById('status-icon-bar'); if(!bar||!player||!player.buffs)return;
    let rows=[],seen=new Set();
    // player.buffs 的數值單位就是「秒」，主迴圈每 10 tick（1 秒）扣 1；不可再除以 10。
    let add=(name,seconds,label,icon,ally)=>{if(!name||seen.has(name))return;seen.add(name);let sec=Math.max(0,Math.ceil(Number(seconds)||0));rows.push({name,ticks:Number(seconds)||0,label:label||name,sec,icon:icon||name,ally:!!ally});};   // 🐾 v3.2.17 icon 參數：多狀態共用同一圖示檔（如 7 種誘捕）；🤝 ally 旗標：隊友提供的全隊光環（圖示加藍點區別）
    if((player.buffs.sk_greater_haste||0)>0)add('加速術',player.buffs.sk_greater_haste,'強力加速術');   // 💨 v3.0.94 強力加速術優先：沿用加速術圖示·先登錄→seen 去重蓋掉下行的一般加速
    if(player.buffs.haste>0||player._equipHaste)add('加速術',player.buffs.haste||0,'加速');
    if(player.buffs.brave>0)add('勇敢藥水',player.buffs.brave,'勇敢藥水');
    if(player.buffs.blue>0)add('藍色藥水',player.buffs.blue,'藍色藥水');
    if(player.buffs.cautious>0)add('慎重藥水',player.buffs.cautious,'慎重藥水');
    if(player.buffs.elfcookie>0)add('精靈餅乾',player.buffs.elfcookie,'精靈餅乾');
    // 🐾 v3.2.17 誘捕狀態（7 種·共用「誘捕」圖示·label 區分）：期間擊殺對應動物即捕獲
    if(typeof PET_LURES!=='undefined')Object.keys(PET_LURES).forEach(k=>{if((player.buffs[k]||0)>0)add('誘捕|'+k,player.buffs[k],PET_LURES[k].n,'誘捕');});
    if(player._setPoly||(player.buffs.poly>0&&player.poly))add('變形術',player.buffs.poly||0,'變身');
    Object.keys(STATUS_ICON_SKILLS).forEach(id=>{if((player.buffs[id]||0)>0)add(STATUS_ICON_SKILLS[id],player.buffs[id],DB.skills[id]?DB.skills[id].n:STATUS_ICON_SKILLS[id]);});
    // 🤝 v3.5.36 全隊光環（大地祝福/灼熱武器/閃亮之盾等 TEAM_AURA_SKILLS）：玩家未自持 buff 但隊友維持中→也亮圖示（標「隊友提供」·倒數取隊友最長剩餘）。玩家自持時上方主迴圈已加(seen 去重)→此段只補「純受益」情形。TEAM_SHARE_BUFFS 類會給玩家自己一份 buff·已由主迴圈顯示故不列入。寵物/召喚無此圖示列不涵蓋。
    if(typeof TEAM_AURA_SKILLS!=='undefined'&&typeof _teamAuraHas==='function'){TEAM_AURA_SKILLS.forEach(sid=>{if((player.buffs[sid]||0)>0||!STATUS_ICON_SKILLS[sid]||!_teamAuraHas(sid))return;let remain=0,al=player.allies||[];for(let i=0;i<al.length;i++){let a=al[i];if(a&&!a._downed&&a.buffs&&(a.buffs[sid]||0)>remain)remain=a.buffs[sid];}add(STATUS_ICON_SKILLS[sid],remain,(DB.skills[sid]?DB.skills[sid].n:STATUS_ICON_SKILLS[sid])+'（隊友提供）',STATUS_ICON_SKILLS[sid],true);});}
    // 持續治療不存於 player.buffs，而是以 0.1 秒 tick 記在 player.hots；換算成真正剩餘秒數後顯示。
    [['sk_regen','體力回復術'],['sk_elf_lifebless','生命的祝福']].forEach(([id,name])=>{let h=player.hots&&player.hots[id];if(h&&h.ticksLeft>0){let remainTicks=Math.max(0,(h.ticksLeft-1)*(h.interval||0)+(h.cd||0));add(name,Math.ceil(remainTicks/10),DB.skills[id]?DB.skills[id].n:name);}});
    // 🌩️ v3.5.94 玩家異常狀態（PLAYER_DEBUFF_ICON 有對應美術者）也進圖示列，排在增益之後；沒對應圖的異常仍走 renderStatusEffects 的文字。
    // ⚠️ 單位陷阱：player.buffs 以「秒」計，player.statuses 卻以 tick(0.1秒) 計（js/03 tick() 開頭統一遞減）→ 這裡必須 /10 換算成秒才交給 add()，否則倒數會顯示成 10 倍。
    if(player.statuses)Object.keys(PLAYER_DEBUFF_ICON).forEach(k=>{let t=player.statuses[k]||0;if(t>0)add(PLAYER_DEBUFF_ICON[k],t/10,'異常：'+(PLAYER_DEBUFF_NAME[k]||k));});
    // 🔧 v2.7.5 合併 2683「狀態圖示狂閃修正」：renderStatusEffects 每 tick(0.1秒) 呼叫本函式；原本每次都重建整排 innerHTML→所有 <img> 反覆重新解碼/重繪而狂閃。
    //   改「簽章式重建」：sig 只含 狀態種類/順序，不含秒數→種類/順序不變時不重建 DOM，僅更新 title(圖片保持不動、不閃)。
    // 🔧 v2.7.9 用戶要求：移除圖示上的動態倒數文字(.status-icon-time 不再產生)——剩餘秒數只留 hover title 提示；sig 隨之不需 T/P 位。
    let sig=rows.map(x=>x.name+'|'+x.label).join('||');
    if(bar.dataset.statusSig!==sig){
        bar.dataset.statusSig=sig;
        bar.innerHTML=rows.map((x,i)=>{let title=x.label+(x.ticks>0?'｜剩餘 '+x.sec+' 秒':'');return `<div class="status-icon${x.ally?' status-icon--ally':''}" data-status-index="${i}" title="${title}"><img src="assets/state-icons/${encodeURIComponent(x.icon||x.name)}.jpg" alt="${x.label}"></div>`;}).join('');
    } else {
        rows.forEach((x,i)=>{let icon=bar.querySelector(`[data-status-index="${i}"]`);if(!icon)return;icon.title=x.label+(x.ticks>0?'｜剩餘 '+x.sec+' 秒':'');});
    }
}

// 統一渲染「狀態」欄：魔法/藥水增益(buff) + 受到的減益(debuff)
function renderStatusEffects() {
    if(state.ff) return; // 補跑期間不刷新畫面
    let el = document.getElementById('dt-buffs');
    if(!el) return;
    renderStatusIconBar();

    // ===== 增益 BUFF =====
    // 🔧 v2.7.2 用戶要求「有圖示的狀態不用再於此文字欄重複」：戰鬥右上狀態圖示列(renderStatusIconBar)已顯示的增益，這裡略過文字。
    //   但圖示列在 #battle-view 內→安全區(村莊)戰鬥區帶 .hidden 時圖示不可見，此時仍以文字顯示，避免完全看不到增益。
    //   _skipIconized=true(戰鬥中·圖示可見)：藥水(加速/勇/藍/慎/精靈餅乾)、變身、及 STATUS_ICON_SKILLS 內的技能 皆略過文字（改看圖示）。
    let _bv = document.getElementById('battle-view');
    let _skipIconized = !!(_bv && !_bv.classList.contains('hidden'));
    let buffs = [];
    if((player.buffs.haste>0 || player._equipHaste) && !_skipIconized) buffs.push(`<span class="text-emerald-400 font-bold">加速</span>`);
    if(player.buffs.brave>0 && !_skipIconized) buffs.push(`<span class="text-fuchsia-400 font-bold">勇水</span>`);
    if(player.buffs.blue>0 && !_skipIconized) buffs.push(`<span class="text-blue-400 font-bold">藍水</span>`);
    if(player.buffs.cautious>0 && !_skipIconized) buffs.push(`<span class="text-violet-400 font-bold">慎水</span>`);
    if(player.buffs.elfcookie>0 && !_skipIconized) buffs.push(`<span class="text-yellow-300 font-bold">精靈餅乾</span>`);
    // 變身顯示：套裝變身(_setPoly，僅穿著時生效)優先於藥水變身，與 recomputeStats 的數值優先序一致 → 穿上惡魔/死亡騎士/克特套裝會立即取代卷軸變身的名稱顯示
    { let _polyDisp = player._setPoly || ((player.buffs.poly>0 && player.poly) ? player.poly : null);
      if(_polyDisp && !_skipIconized) buffs.push(`<span class="${_polyDisp.c} font-bold">變身:${_polyDisp.n}</span>`); }

    // 🤝 協力傭兵已改由「協力傭兵隊伍」面板(#squad-panel)顯示 HP/MP/EXP/狀態，移除此處「狀態」欄的重複「協力：XX」條目
    // 🐾 v3.2.17 誘捕狀態（新夥伴系統·7 種）；舊「夥伴：項圈」與 taming 顯示已隨項圈系統移除
    if(typeof PET_LURES!=='undefined')Object.keys(PET_LURES).forEach(k=>{if((player.buffs[k]||0)>0)buffs.push(`<span class="text-pink-300 font-bold">${PET_LURES[k].n}</span>`);});

    // 🔮 席琳套裝：達 2 件以上（觸發套裝能力）的組別顯示於資訊面板（n/5）
    if (player._sherineSetCnt) {
        for (let _g in player._sherineSetCnt) {
            let _n = Math.min(5, player._sherineSetCnt[_g]);
            if (_n >= 2) buffs.push(`<span class="c-sherine font-bold">${_g} ${_n}/5</span>`);
        }
    }

    // 魔法技能增益：凡是 player.buffs 中對應到 DB.skills 的鍵且 >0，皆顯示（僅中文名稱，依類別上色）
    for(let k in player.buffs) {
        if(player.buffs[k] > 0 && DB.skills[k]) {
            // 迷魅術：狀態欄改顯示「迷魅：怪物名稱」，並以實際被迷魅的僕人(player.summon)為準；
            //   僕人不存在（死亡解除 / 被新召喚取代 / 已消失）時就不顯示，避免殘留。
            // 迷魅術 / 各召喚術：狀態欄改顯示召喚物名稱（多段或多隻時附上數量）；
            //   召喚物不存在（死亡解除 / 被新召喚取代 / 已消失）時就不顯示，避免殘留。
            if(k === 'sk_charm' || DB.skills[k].summon) {
                // 🧙 v3.2.42 稽核修：v2 召喚（召喚術/造屍術/屬性精靈）狀態列顯示——讀 summonsV2 實體（原讀 player.summon 在 v2 恆 null→四個召喚技倒數永不顯示）
                if(k !== 'sk_charm' && player._summonV2Sk === k) {
                    continue;   // 🔮 v3.2.60 召喚物已於戰場顯示（浮動血量框／隊伍列）→狀態欄不再重複顯示「召喚物名＋數量」
                }
                let _creature = (k === 'sk_charm') ? player.charmed : player.summon;
                if(_creature && _creature.skId === k) {
                    let cnt = (k === 'sk_charm') ? 0
                        : (typeof summonAttackCount === 'function') ? summonAttackCount(_creature, player) : 1;
                    let suffix = cnt > 1 ? ` ${cnt}` : '';
                    buffs.push(`<span class="${getBuffColor(k, DB.skills[k])} font-bold">${_creature.n}${suffix}</span>`);
                }
                continue;
            }
            if(_skipIconized && STATUS_ICON_SKILLS[k]) continue;   // 🔧 v2.7.2 有圖示的技能增益→戰鬥中略過文字(改看右上狀態圖示)；無圖示技能/村莊仍顯示
            buffs.push(`<span class="${getBuffColor(k, DB.skills[k])} font-bold">${DB.skills[k].n}</span>`);
        }
    }

    // ===== 減益 DEBUFF（玩家受到的異常狀態）=====
    // 為不同減益設定專屬對應顏色
    const DEBUFF_COLORS = {
        stun: 'text-yellow-500',     // 暈眩 (金黃)
        freeze: 'text-cyan-400',     // 冰凍 (青藍)
        stone: 'text-stone-400',     // 石化 (石頭灰)
        paralyze: 'text-indigo-400', // 麻痺 (靛藍)
        silence: 'text-slate-400',   // 沉默 (鐵灰)
        magicseal: 'text-fuchsia-500',// 魔法封印 (紫紅)
        poison: 'text-green-500',    // 中毒 (毒綠)
        burn: 'text-red-500',        // 灼燒 (火紅)
        scald: 'text-orange-500',    // 燙傷 (橘紅)
        evilAura: 'text-purple-400', // 邪靈之氣 (邪紫)
        weaken: 'text-amber-400',    // 🌅 弱化 (琥珀)
        disease: 'text-lime-400',    // 🌅 疾病 (病綠)
        blind: 'text-purple-300',    // 🌅 目盲 (霧紫)
        potionFrost: 'text-sky-300', // 🌅 藥水霜化 (霜藍)
        foulWater: 'text-cyan-300'   // 🌊 汙濁之水 (濁青·v3.6.20)
    };

    let debuffs = [];
    for(let k in PLAYER_DEBUFF_NAME) {
        if(player.statuses[k] > 0) {
            if(_skipIconized && PLAYER_DEBUFF_ICON[k]) continue;   // 🌩️ v3.5.94 有圖示的異常→戰鬥中略過文字(改看右上狀態圖示)，比照上方增益的 _skipIconized 慣例；無圖示的異常/村莊仍顯示文字
            let c = DEBUFF_COLORS[k] || 'text-red-400';
            debuffs.push(`<span class="${c} font-bold">${PLAYER_DEBUFF_NAME[k]}</span>`);
        }
    }

    let html = `狀態: ${buffs.length ? buffs.join(" / ") : "正常"}`;
    if(debuffs.length) html += `<div class="mt-2 font-bold border-t border-slate-700 pt-1">異常: ${debuffs.join(" / ")}</div>`;
    el.innerHTML = html;
}

function _updateUIImpl() {
    if(state.ff) return; // 補跑期間不刷新畫面
    updatePrideFloorIndicator();   // 🗼 攀登中右上角顯示目前樓層（背景補跑後回到前景時同步）
    try { if (typeof updateMercRoleHint === 'function') updateMercRoleHint(); } catch (e) {}   // 🧑‍🤝‍🧑 v3.7.84 「目前擔任隊員中」提示（受僱/解散由其他分頁造成→靠這裡每輪自動同步）
    try { renderPandoraBanner(); } catch (e) {}   // 🔧 潘朵拉黑市稀有商品公告橫幅
    try { if (typeof updatePvpButtonTone === 'function') updatePvpButtonTone(); } catch (e) {}
    try { renderSyslogPandora(); } catch (e) {}   // 🔧 系統日誌標題列右側：黑市拍賣中商品
    document.getElementById('st-lv').innerText = player.lv;
    { let _inTown = mapState.current.startsWith('town_');   // 🔧 村莊→藍色「出發」一鍵回上一張戰鬥地圖；戰鬥地圖→綠色回村/回城
      let _txt = _inTown ? '出發' : (siegeVictoryActive() ? '回城' : '回村');
      let _fn  = _inTown ? departToLastBattle : returnToTown;
      let _riftLock = (state.riftRun && mapState.current === 'rift_battle');   // 🌀 裂痕內：回村/出發 → 紫色「撤離」（主動結算，照樣記時間＋發獎勵；不可一般回村/傳送）
      if (_riftLock) { _txt = '撤離'; _fn = riftEvacuate; }
      let rb = document.getElementById('btn-return-town');
      if (rb) { rb.style.display = ''; rb.textContent = _txt; rb.onclick = _fn; rb.style.background = _riftLock ? '#7c3aed' : (_inTown ? '#1d4ed8' : ''); rb.style.borderColor = _riftLock ? '#c4b5fd' : (_inTown ? '#93c5fd' : ''); }
      // 🌀 順移按鈕：固定顯示（含村莊/野外/狩獵/隱藏區域），不隨敵人或每幀重繪閃爍；僅在「傳送會破壞玩法」的鎖定模式隱藏（裂痕/傲慢之塔封鎖樓/遺忘之島/軍王之室）。
      // ⚠️ 用「狀態改變才寫 DOM」的守衛：避免每個 tick 重複 toggle class / 設 display 造成按鈕閃爍。
      { let tpb = document.getElementById('btn-teleport'); if (tpb) { let _hideTp = !!(KING_ROOMS[mapState.current] || (typeof prideTeleportBlocked === 'function' && prideTeleportBlocked()) || state.oblivion || state.antharas); if (tpb.classList.contains('hidden') !== _hideTp) { tpb.classList.toggle('hidden', _hideTp); tpb.style.display = _hideTp ? 'none' : ''; } } } }   // ⚠️ _hideTp 必須 !! 強轉布林：否則 (undefined||false||undefined)===undefined → 守衛 (boolean!==undefined) 恆真 → toggle('hidden', undefined) 變成「無參數 bare toggle」每幀翻轉 → 按鈕閃爍
    // 👑 v3.6.05 城主稱號；😤 v3.6.31 只有王族顯示「<持有城堡>主」（肯特城主…）·非王族只顯示「<持有城堡>」（肯特城…·用戶拍板·血盟福利不變）。
    //    v3.6.34 徽章王冠改與戰鬥 sprite 同一顆動態 castle-crown.gif（#victory-badge-crown）·僅王族顯示（非王族純文字）。
    //    ⚠️ 每 tick 都會跑到這裡 → 比對後才寫 DOM（比照上方按鈕的「狀態改變才寫」守衛），避免每幀重設 textContent/display。
    { let vb = document.getElementById('victory-badge'); if (vb) { let _va = siegeVictoryActive(); vb.style.display = _va ? 'inline-flex' : 'none';
        if (_va) { let _lordTitle = victoryCityCfg().castleName + (player.cls === 'royal' ? '主' : ''); let _lt = document.getElementById('victory-badge-text');
            if (_lt && _lt.textContent !== _lordTitle) _lt.textContent = _lordTitle;
            let _vc = document.getElementById('victory-badge-crown'), _vd = (player.cls === 'royal') ? '' : 'none';
            if (_vc && _vc.style.display !== _vd) _vc.style.display = _vd;
            vb.title = `${_lordTitle}：血盟持有${victoryCityCfg().castleName}，全商店 8 折、開放城堡`; } } }   // 血盟城堡淡金黃標記（同模式永久共用，換城時同步更新）
    { let cb = document.getElementById('classic-badge'); if (cb) cb.style.display = player.classicMode ? 'inline' : 'none'; }   // 🎮 經典模式標記（🏛️v3.0.83 傳統徽章已移除）
    applyAreaBackground();   // 區域背景：地監/攻城→戰鬥區、城堡→村莊畫面
    
    // 處理顯示文字：只顯示 騎士、法師、妖精、黑暗妖精
    let clsDisplayName = '';
    if (player.cls === 'knight') clsDisplayName = '騎士';
    else if (player.cls === 'mage') clsDisplayName = '法師';
    else if (player.cls === 'elf') clsDisplayName = '妖精';
    else if (player.cls === 'dark') clsDisplayName = '黑暗妖精';   // 🔧 黑暗妖精職業名
    else if (player.cls === 'illusion') clsDisplayName = '幻術士';   // 🔧 幻術士職業名
    else if (player.cls === 'dragon') clsDisplayName = '龍騎士';   // 🐉 龍騎士職業名
    else if (player.cls === 'warrior') clsDisplayName = '戰士';   // ⚔️ 戰士職業名
    else if (player.cls === 'royal') clsDisplayName = '王族';   // 👑 王族職業名
    if(document.getElementById('st-classname')) document.getElementById('st-classname').innerText = clsDisplayName;   // 🏅 精通徽記已移除，僅顯示職業名
    let _nameEl = document.getElementById('st-class');
    if(_nameEl) {
        if(!window._editingName) _nameEl.innerText = (player.name || '');   // 未取名則不顯示任何文字（仍可點擊命名）
        if (typeof pvpAlignmentColor === 'function') {
            _nameEl.style.color = pvpAlignmentColor(player.alignmentValue);
            _nameEl.style.textShadow = '0 0 6px rgba(0,0,0,.75)';
        }
    }

    // 處理背景圖片：全部職業／性別頭像統一使用 assets/character 對應的 PNG。
    let bgImageName = player.avatar || clsDisplayName;
    document.getElementById('status-panel').style.backgroundImage = `url('assets/character/${bgImageName}.png')`;
    document.getElementById('status-panel').classList.add('bg-top'); // 確保圖片從頂部對齊

    document.getElementById('st-ac').innerText = player.d.ac;
    document.getElementById('st-mr').innerText = player.d.mr;
    document.getElementById('st-gold').innerText = player.gold.toLocaleString();
    
    document.getElementById('txt-hp').innerText = `${Math.floor(player.hp)}/${Math.floor(player.mhp)}`;
    document.getElementById('bar-hp').style.width = `${Math.max(0, (player.hp/player.mhp)*100)}%`;
    document.getElementById('txt-mp').innerText = `${Math.floor(player.mp)}/${Math.floor(player.mmp)}`;
    document.getElementById('bar-mp').style.width = `${Math.max(0, (player.mp/player.mmp)*100)}%`;
    // 📱 手機置頂常駐 HP/MP 細條：同步主血條數值（桌機隱藏，更新無副作用）
    { let _mh = document.getElementById('mv-hp-fill'); if (_mh) {
        _mh.style.width = `${Math.max(0, (player.hp/player.mhp)*100)}%`;
        document.getElementById('mv-hp-txt').innerText = `${Math.floor(player.hp)}/${Math.floor(player.mhp)}`;
        document.getElementById('mv-mp-fill').style.width = `${Math.max(0, (player.mp/player.mmp)*100)}%`;
        document.getElementById('mv-mp-txt').innerText = `${Math.floor(player.mp)}/${Math.floor(player.mmp)}`;
    } }
    // 🏰 v3.7.96 城堡護衛 v2：改為隊伍面板實體 HP 卡（renderGuardTeamHTML·js/31）；舊「主狀態欄承擔傷害護衛條」已移除。
    let nxtE = getExpReq(player.lv);
    let pct = player.lv >= 100 ? 100 : (nxtE > 0 && isFinite(nxtE) ? (player.exp / nxtE) * 100 : 0);
    document.getElementById('txt-exp').innerText = `${pct.toFixed(2)}%`;
    document.getElementById('bar-exp').style.width = `${Math.min(100, pct)}%`;
    try { if (typeof renderSquadPanel === 'function') renderSquadPanel(); } catch (e) {}   // 🤝 協力傭兵隊伍面板：每幀同步血/魔/經驗條（名單變動才重建結構）

    if (_respec) {   // 🕯️ 回憶蠟燭配點重置中：六大屬性顯示「Lv1 基礎 + 草稿配點」（確認後才真正套用）
        let _b = createBase[player.cls];
        ['str','dex','con','int','wis','cha'].forEach(s => { let el = document.getElementById('dt-'+s); if (el) el.innerText = _b[s] + _respec.draft[s]; });
    } else {
        document.getElementById('dt-str').innerText = player.d.str;
        document.getElementById('dt-dex').innerText = player.d.dex;
        document.getElementById('dt-con').innerText = player.d.con;
        document.getElementById('dt-int').innerText = player.d.int;
        document.getElementById('dt-wis').innerText = player.d.wis;
        if(document.getElementById('dt-cha')) document.getElementById('dt-cha').innerText = player.d.cha;
    }
    
    const sign = v => (v >= 0 ? '+' : '') + v;
    // 額外傷害/命中：折入近距離與遠距離的顯示（兩者都 +）
    let _ed = player.d.extraDmg || 0, _eh = player.d.extraHit || 0;
    // 近距離
    document.getElementById('dt-mdmg').innerText = sign(player.d.meleeDmg + _ed);
    document.getElementById('dt-mhit').innerText = sign(player.d.meleeHit + _eh);
    document.getElementById('dt-mcrit-p').innerText = `${player.d.meleeCrit}%`;
    { let _el = document.getElementById('dt-mcritdmg'); if (_el) _el.innerText = `${player.d.meleeCritDmg || 0}%`; }
    // 遠距離
    document.getElementById('dt-rdmg').innerText = sign(player.d.rangedDmg + _ed);
    document.getElementById('dt-rhit').innerText = sign(player.d.rangedHit + _eh);
    document.getElementById('dt-rcrit').innerText = `${player.d.rangedCrit}%`;
    { let _el = document.getElementById('dt-rcritdmg'); if (_el) _el.innerText = `${player.d.rangedCritDmg || 0}%`; }
    // 額外（已折入近/遠距離，列固定隱藏）
    document.getElementById('dt-edmg').innerText = sign(_ed);
    document.getElementById('dt-ehit').innerText = sign(_eh);
    // 依目前武器類型切換顯示：弓(遠距離武器)→隱藏近距離列；否則→隱藏遠距離列。箭矢在 arrow 欄，不影響判定。
    let _wpnRanged = !!(player.eq.wpn && DB.items[player.eq.wpn.id] && DB.items[player.eq.wpn.id].ranged === true);
    document.querySelectorAll('[data-grp="melee"]').forEach(e => e.classList.toggle('row-hidden', _wpnRanged));
    document.querySelectorAll('[data-grp="ranged"]').forEach(e => e.classList.toggle('row-hidden', !_wpnRanged));
    document.querySelectorAll('[data-grp="extra"]').forEach(e => e.classList.add('row-hidden'));
    // 魔法
    document.getElementById('dt-mgdmg').innerText = sign(player.d.magicDmg);
    document.getElementById('dt-sp').innerText = sign(player.d.extraMp);
    document.getElementById('dt-mhit-mag').innerText = sign(player.d.magicHit);
    document.getElementById('dt-mcrit').innerText = `${player.d.magicCrit}%`;
    { let _el = document.getElementById('dt-mgcritdmg'); if (_el) _el.innerText = `${player.d.magicCritDmg || 0}%`; }
    document.getElementById('dt-mpreduce').innerText = `${player.d.mpReduce}%`;
	if(document.getElementById('dt-mpr')) document.getElementById('dt-mpr').innerText = formatBonus(player.d.mpR);
	if(document.getElementById('dt-hpr')) document.getElementById('dt-hpr').innerText = formatBonus(player.d.hpR || 0);
    document.getElementById('dt-er').innerText = `${effResistPct(player.d.er)}%`;   // 🔧 顯示有效迴避率（>50 每+5才+1%）
    document.getElementById('dt-dr').innerText = player.d.dr;
    { let _attackSec = (typeof playerAttackIntervalTicks === 'function')
            ? playerAttackIntervalTicks(false) / 10
            : Math.max(0.1, Number(player.d.aspd) || 0.1);
      document.getElementById('dt-spd').innerText = `${_attackSec.toFixed(2)}s`; }
    { let _potionPct = (typeof getConPotionPct === 'function' ? getConPotionPct(player.d.con || 0) : 0);
      try { _potionPct += (typeof dollFieldVal === 'function' ? dollFieldVal('potionBonus') : 0) + (typeof playerEquipPotionBonusPct === 'function' ? playerEquipPotionBonusPct() : 0) + (player._miscPotionBonus || 0); } catch (e) {}
      let _el = document.getElementById('dt-potion'); if (_el) _el.innerText = `${_potionPct}%`;
      _el = document.getElementById('dt-movespeed'); if (_el) _el.innerText = `${typeof playerEffectiveMoveSpeedPct === 'function' ? playerEffectiveMoveSpeedPct() : 100 + (player.d.moveSpeedPct || 0)}%`;
      _el = document.getElementById('dt-mpkill'); if (_el) { let _mpIv = (typeof wisMpRegenIntervalTicks === 'function' ? wisMpRegenIntervalTicks(player.d.wis || 0) : 160); _el.innerText = `${_mpIv / 10}秒`; }
      _el = document.getElementById('dt-mr'); if (_el) _el.innerText = player.d.mr || 0;
      _el = document.getElementById('dt-resnone'); if (_el) _el.innerText = Math.round(player.d.resNone || 0); }
    if(document.getElementById('dt-resfire')) {
        document.getElementById('dt-resfire').innerText  = Math.round(player.d.resFire  || 0);
        document.getElementById('dt-reswater').innerText = Math.round(player.d.resWater || 0);
        document.getElementById('dt-reswind').innerText  = Math.round(player.d.resWind  || 0);
        document.getElementById('dt-researth').innerText = Math.round(player.d.resEarth || 0);
    }
    
    renderStatusEffects();
    
    {   // 🕯️ 配點工具列：回憶蠟燭重置中(可 +/- 並確認/取消) 或 有未分配升級點數(僅 +) 時顯示
        let _respecOn = !!_respec;
        let _editing = _respecOn || (player.bonus || 0) > 0;
        let _ptsLeft = _respecOn ? respecPtsLeft() : (player.bonus || 0);
        document.querySelectorAll('.alloc-plus').forEach(el => el.classList.toggle('hidden', !_editing));
        document.querySelectorAll('.alloc-minus').forEach(el => el.classList.toggle('hidden', !_respecOn));   // 只有蠟燭重置可退點
        let _tabStats = document.getElementById('tab-stats'); if (_tabStats) _tabStats.classList.toggle('is-respec', _respecOn);
        let _bar = document.getElementById('alloc-edit-bar');
        if (_bar) {
            _bar.classList.toggle('hidden', !_respecOn);   // 配點框只在使用回憶蠟燭時顯示；一般升級點僅顯示屬性旁的＋按鈕
            let _lbl = document.getElementById('alloc-bar-label'); if (_lbl) { _lbl.textContent = _ptsLeft; _lbl.title = `剩餘配點：${_ptsLeft}`; }
            let _hint = document.getElementById('alloc-bar-hint'); if (_hint) _hint.classList.toggle('hidden', !_respecOn);
            let _cf = document.getElementById('alloc-confirm-btn'); if (_cf) _cf.classList.toggle('hidden', !_respecOn);
            let _cc = document.getElementById('alloc-cancel-btn'); if (_cc) _cc.classList.toggle('hidden', !_respecOn);
        }
    }
    updateSummonLock();   // 同步召喚類技能互斥鎖定（含迷魅生效時鎖定召喚增益）
}
