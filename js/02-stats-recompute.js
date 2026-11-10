let _recomputingAlly = false;   // 🌟 v3.0.100 recompute 對象是否為傭兵（buildAlly/_allyLevelRecompute 設 true）：true→跳過「傭兵來源幻覺攻擊光環注入玩家」段（傭兵走 alliesTick 逐回合注入·勿於此重複）
function mainPlayerHasEquippedEffect(flag) {
    if (!flag || typeof player === 'undefined' || !player || player._allyName || _recomputingAlly || !player.eq) return false;
    for (let slot in player.eq) {
        let item = player.eq[slot], def = item && DB.items[item.id];
        if (def && def[flag]) return true;
    }
    return false;
}
function critFurySpeedMultiplier(active, percent) {
    return active ? (1 / (1 + ((percent || 30) / 100))) : 1;
}
function golemMarkMrPenalty(active, equipped) {
    return active && equipped ? -100 : 0;
}
function spellbladeMeleeBonus(tier) {
    let bonuses = { 1:1, 2:2, 3:3, 4:6, 5:9, 6:12, 7:15, 8:18, 9:21, 10:25 };
    return bonuses[Math.max(1, Math.min(10, tier || 1))] || 1;
}
function spellbladeDurationTicks() {
    return 100;
}
function golemMarkDurationTicks() {
    return 30;
}
function spellbladeSkillElement(element) {
    return element && element !== 'none' ? element : '';
}
function statArrayBonus(value) {
    return Math.floor((value || 0) / 5);
}
function relicDrPerErBonus(er, divisor) {
    return Math.floor(Math.max(0, er) / divisor);
}
function antHelperPrecisionBonus(level) {
    return Math.min(20, Math.floor((level || 0) * 0.05));
}
function antHelperDestroyBonus(value) {
    return Math.min(20, Math.floor((value || 0) * 0.05));
}
function antHelperEarthResistanceBonus(value) {
    return Math.min(30, Math.floor(value || 0));
}
function antHelperGuardReductionPercent(magicResistance) {
    return Math.min(20, Math.floor((magicResistance || 0) * 0.10));
}
function recomputeStats() {
    let p = player, d = p.d, b = p.base, a = p.alloc;
    if (typeof p.lv === 'number') p.lv = Math.max(1, Math.min(100, Math.floor(p.lv) || 1));   // 🛡️ 等級硬夾 [1,100]：即時中和「改 player.lv」的外掛，避免職業成長值被放大

    // 先把「上一輪由裝備授予的技能」從技能欄移除（卸下裝備時生效）；sk_helm_* 玩家無法學習，不會誤刪已學技能
    if (player.grantedSkills && player.grantedSkills.length) {
        player.skills = player.skills.filter(s => !player.grantedSkills.includes(s));
    }
    player.grantedSkills = [];
    // ===== Phase 0：基礎屬性 + 衍生欄位歸零（依基本設定，起始值0；AC起始10）=====
    let pn = player.panacea || {};
    d.str = b.str + a.str + (pn.str||0); d.dex = b.dex + a.dex + (pn.dex||0); d.con = b.con + a.con + (pn.con||0); d.int = b.int + a.int + (pn.int||0); d.wis = b.wis + a.wis + (pn.wis||0);
    d.cha = (b.cha || 0) + (a.cha || 0) + (pn.cha||0);   // 魅力：第六屬性（配點＋萬能藥本就≤60；裝備／buff 可突破 60）

    d.ac = 10; d.er = 0; d.dr = 0;
    d.meleeDmg = 0; d.meleeHit = 0; d.meleeCrit = 0;
    d.crushDr = 0; d.meleeHaste = 0; d.atkSpdPct = 0;   // 🏺 遺物 第二批：受重擊減傷% / 裝近戰武器攻速% / 通用攻速%
    d.hpRegenFaster = 0; d.noEvade = false;   // 🏺 遺物 第十六批：巨魔的再生戒指（HP恢復間隔縮短秒數）／笨重的鋼鐵石盾（無法迴避）
    d.critDmgLowHp = null;   // 🏺 遺物 第十七批：鬥士的決戰服裝（HP<N 時近爆傷+add）
    d.thornsDmg = 0; d.instakillFull = 0; d.onDmgHeal = null; d.onDmgHealCd = 0; d.onDmgHealName = '';   // 🏺 遺物 第三批：受擊反傷固定值 / 命中滿血怪即死率 / 受擊自癒技能id（onDmgHealCd=冷卻秒數、onDmgHealName=來源名稱）
    d.hurtExplode = 0;   // 🏺 遺物 第四批 爆彈花蕊：受擊時對自己與全體敵人的火魔傷固定值
    d.fireNullify = false;   // 🏺 遺物 火熱愛意：免疫受到的火屬性傷害（每10秒最多1次·js/04 火魔傷攔截·player._fireNullCd 節流）
    d.wearerEle = '';        // 🏺 遺物 火焰/寒冷化身：裝備者化為某屬性→受剋屬性傷害增加、剋制屬性傷害減少（js/04 受擊路徑 elementCounterMult(mob.e, wearerEle)）
    d.physDrGated = 0;       // 🐍 遺物 祭祀儀式陶罐：受一般攻擊傷害減少%（每3秒最多1次·js/04 enemyPhysicalAttack·player._physDrCd 節流）
    d.lowMpRegenBonus = 0;   // 🐍 遺物 蛇神的凝視：MP<15% 時 MP自然恢復量額外+N（js/03 _regenMP）
    d.moveSpeedPct = 0;  // 🏺 遺物 寄居蟹背殼：移動速度%（負=變慢→怪物重生變慢·js/03 重生延遲讀取·與加速buff相乘）
    d.bossEncounterPct = 0; d.corrosiveJellySkin = false; d.charmOnHit = false;   // 🏺 v3.8.26 山羊惡魔雙足／腐蝕果凍外皮／斯克巴女皇之吻
    d.poisonHealMult = 0;   // 🏺 遺物 毒液化身：受到毒性 DoT 時恢復所受傷害×此倍率的 HP（js/03 中毒 tick 讀取·0=無）
    d.dotCrit = false;       // 🏺 遺物 永不終止的夢魘：我方持續傷害(中毒/出血/猛爆劇毒)可爆擊（js/06 processMobStatusTick _teamDotCrit 讀取）
    d.dmgReflect = 0;        // 🏺 遺物 魅魔女皇的誘惑：受一般攻擊 N% 機率反射相同傷害且免疫該次（js/04 受擊路徑）
    d.statusHealHp = 0; d.dotMpRefund = 0;   // 受異常回血加總／DoT 回魔取最高；隨裝備重算，避免每次受擊重掃全身。
    d.fullHpMpHalf = false;  // 🏺 遺物 巫師的黑暗魔導書：滿血時技能 MP 減半（v3.2.39 稽核修：補歸零——原本卸下後永久殘留）
    d.eleWpnMult = null;     // 🏺 遺物 四之牙臂甲：裝備對應屬性武器時一般攻擊傷害 ×mult（{ele,mult}·js/03 getPhysicalDmg＋js/06 傭兵攻擊）
    d.rangedDmg = 0; d.rangedHit = 0; d.rangedCrit = 0;
    d.extraDmg = 0; d.extraHit = 0; d.equipExtraAtk = 0;   // 🐉 d.equipExtraAtk：裝備授予的額外一般攻擊次數（龍鱗臂甲）
    d.magicDmg = 0; d.magicHit = 0; d.magicCrit = 0; d.extraMp = 0; d.mpReduce = 0;
    let _baseCritDmg = (p.cls === 'dark') ? 100 : 50;   // 🔧 黑暗妖精基礎爆擊傷害 100%（其餘職業 50%）；裝備/精通等加成於其上疊加
    d.meleeCritDmg = _baseCritDmg; d.rangedCritDmg = _baseCritDmg; d.magicCritDmg = _baseCritDmg;
    d.resFire = 0; d.resWater = 0; d.resEarth = 0; d.resWind = 0;
    d.immStone = false;      // 免疫石化（紅騎士盾牌）
    d.immPoison = false;     // 免疫中毒/猛毒/麻痺（潔尼斯戒指）
    d.immSilence = false;    // 🏺 v3.5.27 免疫沉默（被敲爛的半邊頭盔·js/04 怪物沉默魔法攔截）
    d.resNone = 0;           // 🛡️ v3.3.29 無屬性抗性（取代舊「無屬性魔法傷害減少%」magicDrNonEle）：只作用於魔法傷害·減免公式同屬性抗性(effResistPct)

    // ===== Phase 1：先把所有「屬性(STR/DEX/INT/CON/WIS)」來源加總完畢 =====
    // 【修正】裝備與增益提供的屬性，必須在換算戰鬥數值「之前」全部計入，
    //         否則屬性數字會變，但近/遠/魔法傷害·命中·爆擊·AC·ER·HP·MP 不會跟著變。
    if (p.eq.wpn) { let w = DB.items[p.eq.wpn.id]; if (w.str) d.str += w.str; if (w.dex) d.dex += w.dex; if (w.int) d.int += w.int; if (w.con) d.con += w.con; if (w.wis) d.wis += w.wis; if (w.cha) d.cha += w.cha; }   // 🔧 與防具迴圈一致讀取六項屬性（含魅力 cha）
    for (let k in p.eq) {
        let e = p.eq[k];
        if (!e) continue;
        let ed = DB.items[e.id];
        if (!ed) continue;
        if (ed.statusHealHp) d.statusHealHp += ed.statusHealHp;
        if (ed.dotMpRefund) d.dotMpRefund = Math.max(d.dotMpRefund, ed.dotMpRefund);
        if (k === 'wpn') continue;
        if (ed.str) d.str += ed.str;
        if (ed.dex) d.dex += ed.dex;
        if (ed.int) d.int += ed.int;
        if (ed.con) d.con += ed.con;
        if (ed.wis) d.wis += ed.wis;
        if (ed.cha) d.cha += ed.cha;   // 🔧 裝備魅力(cha)：可突破 60 上限
        if (ed.swordStr && p.eq.wpn) { let _st = getWeaponTags(p.eq.wpn.id); if (_st.includes('單手劍') || _st.includes('雙手劍')) d.str += ed.swordStr; }   // 🏺 將軍愛用的握劍護腕：持單手劍／雙手劍時力量 +N（提前計入衍生能力）
    }
    // 👑 同名 buff 去重（頭盔版「力盔/敏盔」優先，蓋掉法師魔法版／王族魔法精通版，避免同效果疊加）：頭盔版生效時把對應法師版 buff 歸零
    if (p.buffs.sk_helm_str1 > 0) p.buffs.sk_ench_wpn = 0;   // 擬似魔法武器（extraDmg）
    if (p.buffs.sk_helm_dex1 > 0) p.buffs.sk_dex_up = 0;     // 通暢氣脈術（dex）
    if (p.buffs.sk_helm_str2 > 0) p.buffs.sk_reveal = 0;     // 無所遁形術
    for (let k in p.buffs) {
        if (p.buffs[k] > 0 && DB.skills[k] && DB.skills[k].d) {
            let bd = DB.skills[k].d;
            if (bd.str) d.str += bd.str;   // 體魄強健術
            if (bd.dex) d.dex += bd.dex;   // 通暢氣脈術
            if (bd.int) d.int += bd.int;
            if (bd.con) d.con += bd.con;
            if (bd.wis) d.wis += bd.wis;   // 淨化精神
            if (bd.cha) d.cha += bd.cha;   // 🔧 魅力增益(cha)
        }
    }

    // ❄️ 套裝「屬性」加成提前套用：力量/體質須在 Phase 2 換算近傷/HP 之前計入，才會實際吃進戰鬥與 HP；其餘 flat 加成（AC/HP+100/恢復/抗性）仍於 Phase 3 套裝段套用。
    { let _setEarly = {}, _ssEarly = {};
      for (let _k in p.eq) { let _e = p.eq[_k]; if (!_e || _k === 'wpn' || _k === 'offwpn') continue; let _ed = DB.items[_e.id]; if (_ed && _ed.set && !_ssEarly[_e.id]) { _ssEarly[_e.id] = true; _setEarly[_ed.set] = (_setEarly[_ed.set] || 0) + 1; } }
      if (_setEarly['icequeen_charm'] >= 3) { d.str += 2; d.cha += 2; }   // 冰之女王魅力：力量+2/魅力+2（提前→力量實際吃近距傷害/命中/爆擊）
      if (_setEarly['frost'] >= 3) { d.con += 3; }                         // 寒冰：體質+3（提前→實際吃 HP 與 HP 自然恢復上限）
      if (_setEarly['orin'] >= 2) { d.str += 1; d.dex += 1; d.con += 1; d.int += 1; d.wis += 1; d.cha += 1; }   // 🔱 歐林西瑪：全六屬性+1（提前→實際吃進 AC/MR/HP/MP/近遠傷害/命中/爆擊等衍生值，否則只改顯示數字不入戰鬥）
      if (_setEarly['darkelf'] >= 3) { d.str -= 2; d.dex += 2; }   // 🏝️ 黑暗妖精：力量-2/敏捷+2（提前→敏捷實際吃 AC/迴避/遠距傷害命中、力量實際吃近距傷害命中，否則只改顯示數字不入戰鬥）
      if (_setEarly['bluepirate'] >= 4) { d.int += 1; }   // 🏴‍☠️ 藍海賊套裝：智力+1（提前→吃進 MP/魔法；AC-1/HP+10 flat 於 Phase 3 套裝段）
    }
    // 🦻 詛咒耳環套裝：淨化之耳環 + 對應色詛咒耳環 同時裝備 → 屬性提前套用（吃進近/遠/魔/HP/MP 等衍生值）
    { let _eqHas = id => Object.values(p.eq).some(e => e && e.id === id);
      if (_eqHas('acc_purify_earring')) {
          if (_eqHas('acc_curse_red'))   { d.str += 2; d.con -= 2; }
          if (_eqHas('acc_curse_blue'))  { d.int += 2; d.wis -= 2; }
          if (_eqHas('acc_curse_green')) { d.dex += 2; d.cha -= 2; }
      }
    }
    // 🪆 魔法娃娃全收集：裝備收集冊 doll 部位全收集(50 隻) → 六維各 +1（提前套用→吃進 AC/HP/MP/近遠魔傷害/命中/爆擊等衍生值；受下方 100 上限夾擠）。
    //    收集判定走 player.equipDex(共用桶)；傭兵經 buildAlly/_allyLevelRecompute 換身（player 暫指向傭兵）時借用隊長共用桶，同樣吃到此加成。label 由 js/16 EQUIP_CAT_BONUS.doll 顯示。
    if (typeof equipCatComplete === 'function' && equipCatComplete('doll')) { d.str += 1; d.dex += 1; d.con += 1; d.int += 1; d.wis += 1; d.cha += 1; }

    // 🏺 v3.6.44 巨靈的三個願望（六維類願望）：掃裝備實體 gw 的 str1/dex1/int1/wis1/con1/cha1（非六維願望於防具迴圈套用·置於上限夾擠前）
    if (p.eq) { for (let _gk in p.eq) { let _ge = p.eq[_gk]; if (_ge && _ge.gw && Array.isArray(_ge.gw)) _ge.gw.forEach(w => { if (w === 'str1') d.str += 1; else if (w === 'dex1') d.dex += 1; else if (w === 'int1') d.int += 1; else if (w === 'wis1') d.wis += 1; else if (w === 'con1') d.con += 1; else if (w === 'cha1') d.cha += 1; }); } }

    // 🏺 遺物「百變的透明內衣」(highestAttrPlus)：目前最高的六維屬性 +1（並列最高皆 +1）。置於六維加總完、上限夾擠前→吃進衍生值(HP/近傷/命中等)。掃 p.eq(玩家或換身傭兵)。
    { let _hap = false; if (p.eq) { for (let _k in p.eq) { let _e = p.eq[_k]; if (_e) { let _hd = DB.items[_e.id]; if (_hd && _hd.highestAttrPlus) { _hap = true; break; } } } }
      if (_hap) { let _mx = Math.max(d.str, d.dex, d.con, d.int, d.wis, d.cha);
        if (d.str === _mx) d.str += 1; if (d.dex === _mx) d.dex += 1; if (d.con === _mx) d.con += 1;
        if (d.int === _mx) d.int += 1; if (d.wis === _mx) d.wis += 1; if (d.cha === _mx) d.cha += 1; } }

    // 🏺 v3.7.20 百變化身（手套 polyAllStats/polyAtkSpdPct）：變身時全屬性+N＋攻速+N%。
    //    置於 Phase 1 段（上限夾擠前）→ 屬性實際吃進衍生值（HP/近傷/命中）；變身判定＝套裝變身或藥水變身進行中（與下方 _polyForm 同式）。
    { let _mag = (p.eq && p.eq.gloves) ? DB.items[p.eq.gloves.id] : null;
      if (_mag && _mag.polyAllStats && (p._setPoly || ((p.buffs && p.buffs.poly > 0) && p.poly))) {
          let _mn = _mag.polyAllStats;
          d.str += _mn; d.dex += _mn; d.con += _mn; d.int += _mn; d.wis += _mn; d.cha += _mn;
          d.atkSpdPct += (_mag.polyAtkSpdPct || 0);
      } }

    // 🎯 六維屬性效果上限 100（v3.1.51 由 80 拓展）：效果表(getStr/Dex/Int/Con/Wis... 系列·js/01)已依 60→80 段曲線鏡射設定到 100，超過 100 無對應能力。
    //    故在此(Phase 1 加總完、Phase 2 換算前)把最終屬性夾擠至 ≤100：
    //    ① 讓 HP/MP 線性成長(getConGrowth/getWisGrowth·原本無上限)亦止於 100；② 資訊欄(讀 d.str)顯示不超過 100，避免玩家誤會配更高有加成。
    //    註：只夾「衍生最終值 d.*」，不動 player.base/alloc/panacea(原始配點保留、可回憶蠟燭退還)；各效果自身更低的內部上限(ER封60/MpReduce封45/MR封60·項圈計數封60)刻意不隨拓展、維持原值。
    { let _ATTR_CAP = 100;
      d.str = Math.min(_ATTR_CAP, d.str); d.dex = Math.min(_ATTR_CAP, d.dex); d.int = Math.min(_ATTR_CAP, d.int);
      d.con = Math.min(_ATTR_CAP, d.con); d.wis = Math.min(_ATTR_CAP, d.wis); d.cha = Math.min(_ATTR_CAP, d.cha); }

    // ===== Phase 2：依「最終屬性」一次性換算所有衍生戰鬥數值 =====
    // 職業基礎 MR 與 等級成長
    if (p.cls === 'knight') {
        d.mr = 0;
        d.ac -= Math.floor(p.lv / 6);          // 每提升6 AC-1
        d.mr += Math.floor(p.lv / 12);         // 每提升12 MR+1
        d.meleeDmg += Math.floor(p.lv / 4);    // 每提升4 近距離傷害+1
        d.rangedDmg += Math.floor(p.lv / 10);  // 每提升10 遠距離傷害+1
        d.extraHit += Math.floor(p.lv / 3);    // 每提升3 額外命中+1
        d.er += Math.floor(p.lv / 4);          // 每提升4 ER+1
    } else if (p.cls === 'elf') {
        d.mr = 25;
        d.ac -= Math.floor(p.lv / 7);          // 每提升7 AC-1
        d.mr += Math.floor(p.lv / 3);          // 每提升3 MR+1
        d.rangedDmg += Math.floor(p.lv / 4);   // 每提升4 遠距離傷害+1
        d.meleeDmg += Math.floor(p.lv / 7);    // 每提升7 近距離傷害+1
        d.extraHit += Math.floor(p.lv / 5);    // 每提升5 額外命中+1
        d.er += Math.floor(p.lv / 6);          // 每提升6 ER+1
    } else if (p.cls === 'dark') {             // 黑暗妖精
        d.mr = 10;                             // 基本 MR = 10
        d.ac -= Math.floor(p.lv / 6);          // 每提升6 AC-1
        d.mr += Math.floor(p.lv / 2);          // 每提升2 MR+1
        d.er += Math.floor(p.lv / 4);          // 每提升4 ER+1
        d.meleeDmg += Math.floor(p.lv / 5);    // 每提升5 近距離傷害+1
        d.rangedDmg += Math.floor(p.lv / 8);   // 每提升8 遠距離傷害+1
        d.extraHit += Math.floor(p.lv / 3);    // 每提升3 額外命中+1（額外命中＝近+遠命中，對近/遠攻擊皆生效）
    } else if (p.cls === 'illusion') {         // 幻術士
        d.mr = 20;                             // 基本 MR = 20
        d.ac -= Math.floor(p.lv / 7);          // 每提升7 AC-1
        d.mr += Math.floor(p.lv / 2);          // 每提升2 MR+1
        d.er += Math.floor(p.lv / 4);          // 每提升4 ER+1
        d.extraDmg += Math.floor(p.lv / 5);    // 每提升5 額外傷害+1
        d.extraHit += Math.floor(p.lv / 5);    // 每提升5 額外命中+1
    } else if (p.cls === 'dragon') {           // 龍騎士
        d.mr = 18;                             // 基本 MR = 18
        d.ac -= Math.floor(p.lv / 7);          // 每提升7 AC-1
        d.mr += Math.floor(p.lv / 2);          // 每提升2 MR+1
        d.er += Math.floor(p.lv / 4);          // 每提升4 ER+1
        d.extraDmg += Math.floor(p.lv / 3);    // 每提升3 額外傷害+1
        d.extraHit += Math.floor(p.lv / 3);    // 每提升3 額外命中+1
    } else if (p.cls === 'warrior') {          // ⚔️ 戰士
        d.mr = 0;                              // 基本 MR = 0
        d.ac -= Math.floor(p.lv / 8);          // 每提升8 AC-1
        d.mr += Math.floor(p.lv / 10);         // 每提升10 MR+1
        d.er += Math.floor(p.lv / 4);          // 每提升4 ER+1
        d.extraDmg += Math.floor(p.lv / 4);    // 每提升4 額外傷害+1
        d.extraHit += Math.floor(p.lv / 3);    // 每提升3 額外命中+1
    } else if (p.cls === 'royal') {            // 👑 王族
        d.mr = 10;                             // 基本 MR = 10
        d.ac -= Math.floor(p.lv / 7);          // 每提升7 AC-1
        d.mr += Math.floor(p.lv / 2);          // 每提升2 MR+1
        d.er += Math.floor(p.lv / 8);          // 每提升8 ER+1
        d.extraDmg += Math.floor(p.lv / 5);    // 每提升5 額外傷害+1
        d.extraHit += Math.floor(p.lv / 4);    // 每提升4 額外命中+1
    } else { // mage
        d.mr = 15;
        d.ac -= Math.floor(p.lv / 8);          // 每提升8 AC-1
        d.mr += Math.floor(p.lv / 8);          // 每提升8 MR+1
        d.er += Math.floor(p.lv / 10);         // 每提升10 ER+1
    }

    // 力量（近距離）
    d.meleeDmg  += getStrMeleeDmg(d.str);
    d.meleeHit  += getStrMeleeHit(d.str);
    d.meleeCrit += getStrMeleeCrit(d.str);
    // 敏捷（遠距離 / AC / ER）
    d.rangedDmg  += getDexRangedDmg(d.dex);
    d.rangedHit  += getDexRangedHit(d.dex);
    d.rangedCrit += getDexRangedCrit(d.dex);
    d.ac += getDexAC(d.dex);
    d.er += getDexER(d.dex);
    if (player.cls === 'dark') { d.meleeCrit += 3; d.rangedCrit += 3; }   // 🔧 黑暗妖精職業天賦：Lv1 起基礎近/遠爆擊率各 +3%
    if (hasMastery('d_crit')) { d.meleeCrit += 3; d.rangedCrit += 3; }   // 🔧 黑暗妖精爆擊精通：近/遠爆擊率各 +3%
    if (hasMastery('d_evade')) d.er += (p._darkEvadeStack || 0);   // 🔧 迴避精通：受擊累積的 ER（觸發迴避時清空）
    // 智力（魔法）
    d.magicDmg  += getIntMagicDmg(d.int);
    d.magicHit  += getIntMagicHit(d.int);
    d.magicCrit += getIntMagicCrit(d.int);
    d.extraMp   += getIntExtraMp(d.int);
    d.mpReduce  += getIntMpReduce(d.int);
    // 精神（MR / MP恢復）
    d.mr  += getWisMR(d.wis);
    if (p.eq) { for (let _k in p.eq) { let _e = p.eq[_k], _ed = _e && DB.items[_e.id]; if (_ed && _ed.mrPerWis) d.mr += d.wis * _ed.mrPerWis; } }   // 🏺 魔力阻抗襯衫：每 1 點最終精神增加 MR
    if (p.skills && p.skills.includes('sk_royal_kingguard')) d.mr += 10;   // 👑 王者加護（被動）：MR+10
    d.mpR  = getWisMpRegen(d.wis);
    d.hpR  = 0;   // HP自然恢復量(裝備/精靈斗篷加成)：每次重算先歸零，避免持續疊加且卸下不還原
    // 體質（HP自然恢復量上限）
    d.hpRegenMax = getConHpRegenMax(d.con);

    // MP消耗（技能實際消耗 = ceil(原始 x (1 - MP消耗減少)) ）
    d.getMpCost = function(baseMp, tier) {
        let c = Math.max(1, Math.ceil(baseMp * (1 - d.mpReduce / 100)));
        if (p._setApprentice5 && p.mp < p.mmp * 0.3) c = Math.max(1, Math.ceil(c / 2));   // 🔮 學徒 5/5：MP 低於最大值 30% 時，所有技能耗魔減半
        if (d.fullHpMpHalf) { let _hpNow = (p.curHp != null) ? p.curHp : p.hp; if (_hpNow >= (p.mhp || 1)) c = Math.max(1, Math.ceil(c / 2)); }   // 🏺 v3.1.80 巫師的黑暗魔導書：滿血時技能消耗 MP 減半（玩家 p.hp／傭兵 p.curHp·recompute 共用）
        if (p.mastery === 'i_mana') c *= 2;   // 🔮 魔力精通：所有技能MP消耗加倍（與 MP 上限加倍配套）
        return c;
    };

    // HP / MP（職業等級1基礎 + (等級-1) x (職業加成 + 屬性加成)，依最終 CON / WIS）
    let hpBase   = p.cls === 'knight' ? 16 : (p.cls === 'elf' ? 15 : (p.cls === 'dark' ? 12 : (p.cls === 'illusion' ? 14 : (p.cls === 'dragon' ? 16 : (p.cls === 'warrior' ? 16 : (p.cls === 'royal' ? 14 : 12))))));
    let hpClsInc = p.cls === 'knight' ? 8.5 : (p.cls === 'elf' ? 7.3 : (p.cls === 'dark' ? 10.5 : (p.cls === 'illusion' ? 7.5 : (p.cls === 'dragon' ? 4.5 : (p.cls === 'warrior' ? 9 : (p.cls === 'royal' ? 10 : 4.3))))));
    let conInc   = getConGrowth(d.con, p.cls);
    p.mhp = hpBase + (p.lv - 1) * (hpClsInc + conInc);   // 小數隱藏不捨去（顯示時取floor）

    let mpBase   = p.cls === 'knight' ? 1 : (p.cls === 'elf' ? 5 : (p.cls === 'dark' ? 3 : (p.cls === 'illusion' ? 5 : (p.cls === 'dragon' ? 2 : (p.cls === 'warrior' ? 1 : (p.cls === 'royal' ? 2 : 6))))));
    let mpClsInc = p.cls === 'knight' ? 1 : (p.cls === 'elf' ? 2.83 : (p.cls === 'dark' ? 3 : (p.cls === 'illusion' ? 3.2 : (p.cls === 'dragon' ? 0.7 : (p.cls === 'warrior' ? 0.5 : (p.cls === 'royal' ? 1.5 : 4.5))))));
    let wisInc   = getWisGrowth(d.wis);
    p.mmp = mpBase + (p.lv - 1) * (mpClsInc + wisInc);

    d.aspd = 1.0;
    d.hitstun = hitstunTicks(p);   // ⚔️ 天堂職業硬直（被直接命中→延遲下次攻擊的 tick·職業定·不隨武器）
    d.hitstunReduce = 0;           // 🏺 不動的鋼鐵堅壁：裝備硬直減免累加器（於變身速度覆蓋「之後」統一扣除·見下方變身區塊後）
    d.castLock = castLockTicks(p); // 🔮 天堂職業施法間隔（攻擊／治癒／淨化／轉換／手動共用速度公式·法師最快）
    d.supportCastLock = d.castLock;

    // ===== Phase 3：非屬性加成（武器傷害 / 裝備防禦 / 套裝 / 增益 / 變身） =====
    // 武器：依遠近距離分別計入（w.str 已於 Phase 1 計入屬性）
    if (p.eq.wpn) {
        let w = DB.items[p.eq.wpn.id];
        let isRanged = !!w.ranged;
        let _enW = enhanceWpnBonus(p.eq.wpn.en);   // 🔧 武器強化固定加成（傷害每階+1延伸到+20、命中+1~+10後依表續加）
        // 武器自身固定傷害/命中：只加武器本身的攻擊類型（近戰武器→近距離、遠程武器→遠距離）
        if (isRanged) { d.rangedDmg += (w.dmgBonus||0); d.rangedHit += (w.hit||0); }
        else { d.meleeDmg += (w.dmgBonus||0); d.meleeHit += (w.hit||0); }
        // 🏺 v3.2.17 猴子的金箍棒：近距離傷害/命中 +(等級/lvDmgDiv·lvHitDiv)（隨等級成長的武器加成）
        if (w.lvDmgDiv) { let _lb = Math.floor((p.lv || 1) / w.lvDmgDiv); if (isRanged) d.rangedDmg += _lb; else d.meleeDmg += _lb; }
        if (w.lvHitDiv) { let _lh = Math.floor((p.lv || 1) / w.lvHitDiv); if (isRanged) d.rangedHit += _lh; else d.meleeHit += _lh; }
        // 🔧 武器「強化」固定加成：近距離與遠距離 傷害＋命中 同時各加（傷害每+1各+1至+20；命中+1~+10各+1、+11起依 WPN_EN_HIT_OVER10 表續加）。強化的傷害成長僅此固定加成（最終傷害倍率機制已移除·enhanceWpnFinalMult 恆 1）
        d.meleeDmg += _enW.dmg; d.rangedDmg += _enW.dmg;
        d.meleeHit += _enW.hit; d.rangedHit += _enW.hit;
        d.aspd = atkSpdBaseItv(p);   // ⚔️ 攻速改由「職業性別×武器種類」查表（ATK_APM·js/01）·武器 def 的 spd 欄位停用（玩家＋傭兵 buildAlly 共用本函式）
        if(w.mdmg) d.magicDmg += w.mdmg;
        if(w.mpR) d.mpR += w.mpR;
        if(w.hpR) d.hpR += w.hpR;   // 🗡️ 武器 HP 自然恢復量加成/扣減（血紅慾望短劍 HP自然恢復 -3）
        if(w.mhp) p.mhp += w.mhp;   // 🏛️ 武器 HP 上限加成（古代黑暗妖精之劍 HP+50；同步修正深紅長矛既有 HP+50 失效）
        if(w.mmp) p.mmp += w.mmp;   // 🏛️ 武器 MP 上限加成（聖晶魔杖 MP+50；防具/飾品 mmp 走另一迴圈·武器需此處）
        if(w.extraMp) d.extraMp += w.extraMp;   // 🏺 武器固定額外魔法點數（遺物 殭屍的小腿骨 +7；防具/飾品 extraMp 走另一迴圈·武器需此處）
        if(p.eq.wpn.id === 'wpn_giltas_wand' && p._giltasWandFuryUntil > state.ticks) d.extraMp += (typeof pvpEvilBonus === 'function' ? pvpEvilBonus(20) : 0);   // 🪄 吉爾塔斯魔杖：任意擊殺後 10 秒內依主玩家邪惡值提高額外魔法點數（滿邪惡 +20）
        if(w.dr) d.dr += w.dr;   // 🏺 武器固定傷害減免（遺物 有彈性的肋骨 +2；防具/飾品 dr 走另一迴圈·武器需此處）
        if(w.extraDmg) d.extraDmg += w.extraDmg;   // 🏺 武器固定傷害（遺物 鼠人的烤肉叉/水靈的琴弦 固定傷害+N；防具/飾品 extraDmg 走另一迴圈·武器需此處）
        if(w.mcrit) d.meleeCrit += w.mcrit;   // 🏺 武器近距離爆擊率加成（遺物 蟹人的巨鉗 +5%）
        if(w.mcritDmg) d.meleeCritDmg += w.mcritDmg;   // 🏺 武器近距離爆擊傷害% 加成（遺物 歐姆裝甲兵的超重鎚 +10%）
        if(w.rcrit) d.rangedCrit += w.rcrit;   // 🏺 武器遠距離爆擊率% 加成（遺物 神射手的重弦弓 +3%）
        if(w.atkSpdPct) d.atkSpdPct += w.atkSpdPct;   // 🏺 武器攻速%（遺物 阿魯巴的加速棍棒 +20／牛頭怪的殘暴巨斧 +25；防具/飾品 atkSpdPct 走另一迴圈·武器需此處·v3.1.33 稽核修）
        if(w.mr) d.mr += w.mr;   // 🐍 武器 MR（提卡爾庫庫爾坎之矛/蛇神的倒勾獠牙 MR+5；防具/飾品 mr 走另一迴圈·武器需此處·v3.1.76 稽核高#2）
        if(w.fullHpMpHalf) d.fullHpMpHalf = true;   // 🏺 v3.1.80 巫師的黑暗魔導書：滿血時技能消耗 MP 減半（getMpCost 讀取）
        let _wEn = capWpnEn(p.eq.wpn.en);   // 🔧 超過 +20 一律以 +20 計算所有隨強化提升的能力
        if(w.mpROverSafe && _wEn > (w.safe || 0)) d.mpR += (_wEn - (w.safe || 0)) * w.mpROverSafe;   // 突破安定值：每超過1階，MP自然恢復量 +mpROverSafe
        if(w.extraMpPerEn)  d.extraMp  += _wEn * w.extraMpPerEn;    // 每強化+1 → 額外魔法點數
        if(w.meleeHitPerEn) d.meleeHit += _wEn * w.meleeHitPerEn;   // 每強化+1 → 近距離命中
        if(w.mpRPerEn)      d.mpR      += _wEn * w.mpRPerEn;        // 🔮 每強化+1 → MP自然恢復量（冥想奇古獸）
        if(w.mdmgEnFrom7Max3) d.magicDmg += Math.min(3, Math.max(0, _wEn - 6));   // 🔧 巴風特魔杖：強化+7 魔法傷害+1，之後每+1再+1，最高+3
        // 武器祝福/遠古：依規格計入（同時影響遠近距離）
        // 祝福的武器：額外傷害+1、額外魔法點數+2、額外命中+1
        applyBlessStats(d, p.eq.wpn.bless, 'wpn');   // 祝福的/詛咒的
        // 遠古武器：額外傷害+2、魔法傷害+1
        applyAncStats(d, p.eq.wpn.anc, 'wpn');   // 遠古系變體能力
        // 🔥 屬性詞綴（v3.0.77 五階制）：額外傷害+N、額外魔法點數+N（N=1/3/5/7/9·ATTR_AFFIX js/08）；一般攻擊轉屬性走 getWpnEle/elementCounterMult
        let _wAtt = getAttrAffix(p.eq.wpn.attr);
        if (_wAtt) { d.extraDmg += _wAtt.dmg; d.extraMp += _wAtt.mp; }

    }

    // ⚔️ 迅猛雙斧副手武器：祝福/遠古/屬性比照主武器計入 global d（與其他裝備一致疊加；玩家＋傭兵 buildAlly 換身共用本函式）。剋制屬性仍走 getPhysicalDmg 副手揮擊（用 offwpn 自身屬性）
    if (p.eq.offwpn) {
        applyBlessStats(d, p.eq.offwpn.bless, 'wpn'); applyAncStats(d, p.eq.offwpn.anc, 'wpn');
        let _oAtt = getAttrAffix(p.eq.offwpn.attr);
        if (_oAtt) { d.extraDmg += _oAtt.dmg; d.extraMp += _oAtt.mp; }   // 🔥 副手屬性詞綴：額外傷害/魔法點數
    }

    let setCheck = {}, _setSeen = {};
    p._equipHaste = false;   // 裝備常駐加速（如伊娃之盾）：每次重算先清除，卸下即消失（同 _setPoly 模式）
    if (p.eq.wpn) { let _hw = DB.items[p.eq.wpn.id]; if (_hw && (_hw.eff === 'haste' || _hw.equipHaste)) p._equipHaste = true; }   // 🔧 武器常駐加速（惡魔之劍 eff:haste／惡魔雙刀·鋼爪·十字弓 equipHaste）
    for (let k in p.eq) {
        let e = p.eq[k];
        if (!e || k === 'wpn' || k === 'offwpn') continue;   // ⚔️ offwpn=副手武器：不走防具/飾品加成（只作第二攻擊來源，stats 不重複計）
        let ed = DB.items[e.id];
        d.ac -= (ed.ac||0);   // 基礎 AC（防具/飾品皆套用）
        if (ed.type === 'arm' && !ed.armguard) d.ac -= enhanceArmAc(e.en);   // 🔧 防具強化AC（+11~+15分段；🛡️ 臂甲不吃此AC，強化改為加 HP）
        else if (ed.type === 'acc') {   // 🔧 飾品強化（上限+5）：戒指 每+1 AC-1；項鍊 每+1 MR+3；腰帶 每+1 負重上限+20（於負重系統計算）
            let _ae = Math.min(e.en || 0, 5);
            if (ed.slot === 'ring') d.ac -= _ae;
            else if (ed.slot === 'amulet') d.mr += _ae * 3;
            else if (ed.slot === 'ear') d.mr += _ae * 2;   // 🦻 耳環：每強化 +1 → MR +2（上限 +5）
        }
        // 計算防具的基礎 MR 與強化的額外 MR 加成
let baseMr = ed.mr || 0;
let bonusMr = (ed.mrPerEn || 0) * capEn(e.en, ed);   // 🔧 超過上限以上限計算（防具+15/飾品+5）
d.mr += (baseMr + bonusMr);
        if(ed.mdmgEnFrom4) d.magicDmg += Math.min(6, Math.max(0, capEn(e.en, ed) - 3));   // 🧙 巫妖斗篷：強化+4 魔法傷害+1，之後每+1再+1，最高 +9（魔法傷害 +6）；+10 以上不再增加
        if(ed.mdmgEnFrom7Max3) d.magicDmg += Math.min(3, Math.max(0, capEn(e.en, ed) - 6));   // 🔧 巴風特魔杖：強化+7 魔法傷害+1，之後每+1再+1，最高+3
        if(ed.mdmg) d.magicDmg += ed.mdmg;   // 🔧 飾品/防具的固定魔法傷害（如底比斯賀洛斯戒指 mdmg:2）；武器的 mdmg 走武器區塊(4143)，此迴圈已 skip wpn 故不重複
        // ed.str/dex/int/con/wis 已於 Phase 1 計入屬性
        if(ed.mhp) p.mhp += ed.mhp;
        if(ed.mmp) p.mmp += ed.mmp;
        if(ed.mpR) d.mpR += ed.mpR;
		if(ed.hpR) d.hpR += ed.hpR;
        if(ed.resFire)  d.resFire  += ed.resFire;
        if(ed.resWater) d.resWater += ed.resWater;
        if(ed.resEarth) d.resEarth += ed.resEarth;
        if(ed.resWind)  d.resWind  += ed.resWind;
        // 防具/飾品的命中與傷害加成（如腕甲 rangedHit）
        if(ed.meleeHit)  d.meleeHit  += ed.meleeHit;
        if(ed.rangedHit) d.rangedHit += ed.rangedHit;
        if(ed.meleeDmg)  d.meleeDmg  += ed.meleeDmg;
        if(ed.rangedDmg) d.rangedDmg += ed.rangedDmg;
        if(ed.extraHit)  d.extraHit  += ed.extraHit;          // 🐉 裝備額外命中（龍鱗臂甲 +2）
        if(ed.extraDmg)  d.extraDmg  += ed.extraDmg;          // 🐉 裝備額外傷害
        if(ed.magicHit)  d.magicHit  += ed.magicHit;          // 🪆 裝備固定魔法命中（魔法娃娃：墮落/巴風特）
        if(ed.er)        d.er         += ed.er;                // 🪆 裝備固定 ER（魔法娃娃：飛龍/吸血鬼/林德拜爾）
        if(ed.extraMp)   d.extraMp    += ed.extraMp;          // 🪆 裝備固定額外魔法點數（魔法娃娃：思克巴女皇）
        if(ed.extraAtk)  d.equipExtraAtk += ed.extraAtk;      // 🐉 裝備額外一般攻擊次數（龍鱗臂甲 +1）
        if(ed.immStone) d.immStone = true;                    // 紅騎士盾牌：免疫石化
        if(ed.immPoison) d.immPoison = true;                  // 潔尼斯戒指：免疫中毒/猛毒/麻痺
        if(ed.immSilence) d.immSilence = true;                // 🏺 v3.5.27 被敲爛的半邊頭盔：免疫沉默
        if(ed.resNone) d.resNone += ed.resNone;               // 🛡️ v3.3.29 無屬性抗性（紅騎士盾牌/反射之盾/阿茲特的反光石·只對魔法）
        if(ed.dr) d.dr += ed.dr;   // 🛡️ 防具/飾品固定傷害減免（信念之盾 +2、巴風特盔甲 +2）
        if(ed.drEnFrom7Max3) d.dr += Math.min(3, Math.max(0, capEn(e.en, ed) - 6));   // 🐉 v3.7.69 安塔瑞斯四防具：強化+7 傷害減免+1，之後每+1再+1，最高+3（與基礎 dr:3 合計上限 +6）·公式同巴風特魔杖 mdmgEnFrom7Max3
        if(ed.hitstunReduce) d.hitstunReduce += ed.hitstunReduce;   // 🏺 不動的鋼鐵堅壁：受傷硬直 -0.5 秒（-5 tick）→先累加·於變身速度覆蓋後統一扣（v3.1.30 審查修：原本直接扣會被 POLY_TIERS 的 d.hitstun=pf.stun 蓋掉）
        if(ed.crushDr) d.crushDr += ed.crushDr;        // 🏺 遺物 妖魔的兜襠布：受到重擊時傷害減少 crushDr%（於 js/04 受擊路徑套用）
        if(ed.meleeHaste) d.meleeHaste += ed.meleeHaste;  // 🏺 遺物 狂野的鬃毛外套：裝備近距離武器時攻速 +meleeHaste%
        if(ed.atkSpdPct) d.atkSpdPct += ed.atkSpdPct;  // 🏺 遺物 綠色妖鬼的指甲：攻速 +atkSpdPct%（無條件）
        if(ed.thorns) d.thornsDmg += ed.thorns;        // 🏺 遺物 犰狳尖刺頭盔：受擊反傷固定值（js/04 受擊路徑套用）
        if(ed.instakillFull) d.instakillFull += ed.instakillFull;  // 🏺 遺物 隱蔽的死亡草葉：一般攻擊命中滿血怪即死率
        if(ed.onDmgHeal) { d.onDmgHeal = ed.onDmgHeal; d.onDmgHealCd = ed.onDmgHealCd || 5; d.onDmgHealName = ed.n; }   // 🏺 遺物 白螞蟻蛋殼(初級/5秒) / 孵育螞蟻精華(中級/8秒)：受擊自癒技能 id＋冷卻秒數＋來源名稱（cd 由 _shellHealCd 節流·僅單一副手槽→無疊加）
        if(ed.hurtExplode) d.hurtExplode += ed.hurtExplode;   // 🏺 遺物 爆彈花蕊：受擊爆裂火魔傷固定值
        if(ed.fireNullify) d.fireNullify = true;              // 🏺 遺物 火熱愛意：免疫火屬性傷害（10秒節流·js/04 攔截）
        if(ed.wearerEle) d.wearerEle = ed.wearerEle;          // 🏺 遺物 火焰/寒冷化身：裝備者化為某屬性（受擊屬性剋制·js/04）
        if(ed.physDrGated) d.physDrGated += ed.physDrGated;   // 🐍 遺物 祭祀儀式陶罐：受一般攻擊傷害減少%（3秒節流·js/04）
        if(ed.lowMpRegenBonus) d.lowMpRegenBonus += ed.lowMpRegenBonus;   // 🐍 遺物 蛇神的凝視：MP<15% 時 MP自然恢復額外+N（js/03 _regenMP）
        if(!_recomputingAlly && !p._allyName && ed.moveSpeedPct) d.moveSpeedPct += ed.moveSpeedPct;   // 移速裝備只計主操作玩家；傭兵裝備不影響全隊接敵／補怪速度
        if(!_recomputingAlly && !p._allyName && ed.bossEncounterPct) d.bossEncounterPct = Math.max(d.bossEncounterPct, ed.bossEncounterPct);   // 頭目遭遇率只計主操作玩家裝備
        if(ed.corrosiveJellySkin) d.corrosiveJellySkin = true;
        if(ed.charmOnHit) d.charmOnHit = true;
        if(e.gw && Array.isArray(e.gw)) e.gw.forEach(w => {   // 🏺 v3.6.44 巨靈的三個願望（非六維願望·六維於 Phase 1 區塊套用）
            if (w === 'hp60') p.mhp += 60; else if (w === 'mp30') p.mmp += 30;
            else if (w === 'md3') d.meleeDmg += 3; else if (w === 'rd3') d.rangedDmg += 3;
            else if (w === 'mdmg2') d.magicDmg += 2; else if (w === 'sp6') d.extraMp += 6;
            else if (w === 'hpr10') d.hpR += 10; else if (w === 'mpr5') d.mpR += 5;
            else if (w === 'dr3') d.dr += 3; else if (w === 'ac3') d.ac -= 3; else if (w === 'mr6') d.mr += 6;
        });
        if(ed.poisonHealMult) d.poisonHealMult = Math.max(d.poisonHealMult, ed.poisonHealMult);   // 🏺 遺物 毒液化身：毒性 DoT 轉治癒倍率（取最高·不疊加）
        if(ed.dotCrit) d.dotCrit = true;                       // 🏺 v3.1.80 永不終止的夢魘：持續傷害可爆擊（js/06 _teamDotCrit）
        if(ed.dmgReflect) d.dmgReflect = Math.max(d.dmgReflect, ed.dmgReflect);   // 🏺 v3.1.80 魅魔女皇的誘惑：受一般攻擊 N% 反射＋免疫（取最高·不疊加）
        if(ed.eleWpnMult) d.eleWpnMult = ed.eleWpnMult;        // 🏺 v3.1.80 四之牙臂甲：裝對應屬性武器時一般攻擊 ×mult（僅副手單槽·無疊加疑慮）
        if(ed.hpRegenFaster) d.hpRegenFaster += ed.hpRegenFaster;   // 🏺 遺物 巨魔的再生戒指：HP 自然恢復間隔縮短 N 秒（js/03 tick() 的 _hpIv 排程·呼叫 _regenHP）
        if(ed.noEvade) d.noEvade = true;                       // 🏺 遺物 笨重的鋼鐵石盾：無法迴避攻擊（js/04 受擊迴避閘）
        if(ed.critDmgLowHp) d.critDmgLowHp = ed.critDmgLowHp;   // 🏺 遺物 鬥士的決戰服裝：HP<N 時近爆傷+add（js/03 getPhysicalDmg／js/06 allyAttackOnce）
        // 🛡️ 臂甲（副手）：每強化+1 → HP+10；門檻特效（達 +5/+7/+9 套用對應階、取最高階、非累加）
        if(ed.armguard) {
            let _agEn = capEn(e.en, ed);
            p.mhp += _agEn * 10;
            let _ag = ed.armguard;
            let _agV = (_ag.base || 0) + (_agEn >= 9 ? _ag.th[2] : _agEn >= 7 ? _ag.th[1] : _agEn >= 5 ? _ag.th[0] : 0);
            if(_agV) { if(_ag.stat === 'dr') d.dr += _agV; else if(_ag.stat === 'magicDmg') d.magicDmg += _agV; else if(_ag.stat === 'mhp') p.mhp += _agV; else if(_ag.stat === 'rangedDmg') d.rangedDmg += _agV; else if(_ag.stat === 'meleeDmg') d.meleeDmg += _agV; }
        }
        if((ed.eff && ed.eff === 'haste') || ed.equipHaste) p._equipHaste = true;   // 不再借用 buffs.haste 計時通道，避免卸裝後永久加速殘留；🔧 equipHaste：eff 已被 combo/連射等佔用時仍可賦予加速
        
        // 祝福的：防具→AC-1、傷害減免+1；飾品→AC-1、MR+1
        applyBlessStats(d, e.bless, (ed.slot==='ring'||ed.slot==='amulet'||ed.slot==='belt'||ed.slot==='ear') ? 'acc' : 'arm');   // 祝福的/詛咒的
        applyAncStats(d, e.anc, (ed.slot==='ring'||ed.slot==='amulet'||ed.slot==='belt'||ed.slot==='ear') ? 'acc' : 'arm');   // 遠古系變體能力
        // 🔥 v3.0.77 屬性詞綴改版：只能存在於武器（額外傷害/魔法點數，於上方武器區塊計入）；舊防具/飾品屬性詞綴（元素抗性+MR）已廢除並由 loadGame 清除
        if(ed.set && !_setSeen[e.id]) { _setSeen[e.id] = true; setCheck[ed.set] = (setCheck[ed.set]||0) + 1; }   // 🔧 以「不重複物品」計件：兩枚同款戒指只算 1 件，杜絕灌水湊套裝
        
        // 🔧 架構#4：移除 ed.skAdd 死碼 —— 全資料庫無任何物品使用此欄位，且其語意（永久寫入 player.skills、
        // 卸裝不回收）與 grantSkills（每次重算先回收、卸裝即消失）矛盾，留著只會誘發未來的 bug。授予技能一律走 grantSkills。
        if (ed.grantSkills) {
            ed.grantSkills.forEach(sk => {
                if (!player.grantedSkills.includes(sk)) player.grantedSkills.push(sk);
                if (!player.skills.includes(sk)) player.skills.push(sk);
            });
        }
    
        // ===== 妖精專屬裝備隱藏效果 =====
        if (player.cls === 'elf') {
            if (e.id === 'shd_elf') {
                d.mr += 5; // 精靈盾牌：妖精裝備時額外 MR+5
            }
            if (e.id === 'clk_elf') {
                d.hpR = (d.hpR || 0) + 1; 
            }
        }
    }
    
    // 騎士／王族／戰士：背包中持有的魔法頭盔也授予技能（擁有即可、不需裝備；背包與裝備都沒有對應頭盔時技能才會消失）
    if (p.cls === 'knight' || p.cls === 'royal' || p.cls === 'warrior') {
        (p.inv || []).forEach(it => {
            let _gd = DB.items[it.id];
            if (_gd && _gd.grantSkills && !_gd.grantSkillsEquipOnly) {
                _gd.grantSkills.forEach(sk => {
                    if (!player.grantedSkills.includes(sk)) player.grantedSkills.push(sk);
                    if (!player.skills.includes(sk)) player.skills.push(sk);
                });
            }
        });
    }
    // ⚠️ 套裝效果唯一真相在此；DB.sets(js/00) 僅供 initSetTags 反向標記、不承載數值
    p._setPoly = null;   // 套裝變身僅在穿著時生效；每次重算先清除，卸下套裝即消失
    if(setCheck['leather'] >= 4) { d.ac -= 3; }   // 皮套裝（原作未實作，依 DB.sets 補上）
    if(setCheck['bone'] >= 3) { d.ac -= 2; p.mhp += 10; }
    if(setCheck['dk'] >= 4) { d.ac -= 4; p._setPoly = Object.assign({}, SET_POLY_FORMS.dk); }   // 🔧 死亡騎士套裝：變身升級為 真‧死亡騎士
    if(setCheck['silver'] >= 4) { d.ac -= 3; }
    if(setCheck['oasis'] >= 4) { d.ac -= 3; }
    if(setCheck['gnome'] >= 3) { d.ac -= 1; p.mhp += 5; }
    if(setCheck['mage'] >= 2) { p.mmp += 50; d.mpR += 1; }   // 🧙 法師套裝：MP+50、MP自然恢復+1
    if(setCheck['kurt'] >= 4) { d.ac -= 4; p._setPoly = Object.assign({}, SET_POLY_FORMS.kurt); }   // 🔧 克特套裝：變身升級為 真‧克特
    if(setCheck['steel'] >= 5) { d.ac -= 2; d.dr += 2; }
    if(setCheck['mr'] >= 3) { d.mr += 5; }
    if(setCheck['guard'] >= 3) { d.ac -= 1; }
    if(setCheck['kinglord'] >= 4) { p.mhp += 30; p.mmp += 30; d.hpR += 10; d.mpR += 10; d.cha += 3; }   // 🔧 四大軍王套裝：HP/MP+30、HP/MP自然恢復+10、魅力+3
    if(setCheck['demon'] >= 4) { d.ac -= 2; d.hpR += 5; p._setPoly = Object.assign({}, SET_POLY_FORMS.demon); }   // 🗼 惡魔套裝：AC-2、HP自然恢復+5、變身惡魔（額外傷害/命中/魔法傷害/MP/攻速由變身提供）
    if(setCheck['darkelf'] >= 3) { d.ac -= 3; d.hpR -= 2; d.mpR -= 7; p._setPoly = Object.assign({}, SET_POLY_FORMS.darkelf); }   // 🏝️ 黑暗妖精套裝：AC-3、HP自然恢復-2、MP自然恢復-7、變身高等黑暗精靈（遠距離傷害/命中+5、攻速+30%）（力量-2/敏捷+2 已於 Phase 1 前 _setEarly 提前套用→吃進近/遠戰鬥值）
    if(setCheck['orin'] >= 2) { d.ac -= 5; p.mhp += 50; }   // 🔱 歐林西瑪套裝：AC-5、HP+50（全六屬性+1 已於 Phase 1 前 _setEarly 提前套用→吃進 AC/MR/HP/MP/傷害等衍生值）
    if(setCheck['icequeen_charm'] >= 3) { d.ac -= 5; p.mhp += 100; d.mpR += 4; d.resWater += 20; }   // ❄️👸 冰之女王魅力套裝（公主限定）：AC-5、HP+100、MP自然恢復+4、水屬性抗性+20（力量+2/魅力+2 已於 Phase 1 前提前套用）
    if(setCheck['frost'] >= 3) { d.ac -= 5; p.mhp += 100; d.hpR += 8; d.mpR += 4; d.mr += 15; d.resWater += 20; }   // ❄️ 寒冰套裝（王族／龍騎士）：AC-5、HP+100、HP自然恢復+8、MP自然恢復+4、MR+15、水屬性抗性+20（體質+3 已於 Phase 1 前提前套用）
    if(setCheck['bluepirate'] >= 4) { d.ac -= 1; p.mhp += 10; }   // 🏴‍☠️ 藍海賊套裝（頭巾＋皮盔甲＋手套＋長靴）：AC-1、HP+10（智力+1 已於 Phase 1 前提前套用）
    if(setCheck['emperor'] >= 5) { d.ac -= 20; p.mhp += 100; p.mmp += 20; d.hpR += 10; d.atkSpdPct += 30; d.meleeDmg += 5; d.rangedDmg += 5; }   // 🌑 v3.3.33 真‧冥皇套裝（披風/鎧甲/面甲/護手/鋼靴 5 件·黑暗妖精聖地.md）：防禦-20、HP+100、MP+20、HP自然恢復+10、攻速額外+30%（atkSpdPct 管線·與加速/勇敢藥水乘算堆疊）、額外傷害+5（近/遠皆加）
    if(setCheck['priest'] >= 5) { d.ac -= 50; d.mr += 50; p.mhp += 300; d.mpR += 30; d.meleeCrit += 5; d.rangedCrit += 5; d.magicCrit += 5; d.meleeCritDmg += 50; d.rangedCritDmg += 50; d.magicCritDmg += 50; }   // 🏺 v3.7.52 司祭苦行套裝（5 件遺物·純 flat 免 _setEarly）：AC-50、MR+50、HP+300、MP自然恢復+30、近/遠/魔法爆擊率+5%、近/遠/魔法爆擊傷害+50%
    // 🌑 v3.4.0 受詛咒的真．冥皇執行劍：裝備時變身 死亡騎士（走 _setPoly 管線＝卸下即消失·速度覆蓋沿 POLY_TIERS 死亡騎士；套裝變身優先於本劍故加 !p._setPoly 守衛）
    if(!p._setPoly && p.eq && p.eq.wpn && p.eq.wpn.id === 'wpn_cursed_emperor_blade') { let _ceb = findPolyForm('死亡騎士'); if(_ceb) p._setPoly = makePolyState(_ceb.form, _ceb.color); }
    // 🌑 v3.4.67 解除詛咒的真死亡騎士．冥皇執行劍：裝備時變身 真死亡騎士 冥皇丹特斯（equip-only·per-weapon APM 攻速·套裝變身優先故加 !p._setPoly 守衛）
    if(!p._setPoly && p.eq && p.eq.wpn && p.eq.wpn.id === 'wpn_uncursed_emperor_blade') { p._setPoly = Object.assign({}, DANTES_POLY_FORM); }
    // 🔥 v3.7.52 烈焰的死亡騎士之劍（flameDkMorph）：裝備時變身 烈焰的死亡騎士（形態既存於變身表·含 per-weapon APM/動態/音效；套裝變身優先故加 !p._setPoly 守衛）
    if(!p._setPoly && p.eq && p.eq.wpn) { let _fdw = DB.items[p.eq.wpn.id]; if (_fdw && _fdw.flameDkMorph) { let _fdk = findPolyForm('烈焰的死亡騎士'); if (_fdk) p._setPoly = makePolyState(_fdk.form, _fdk.color); } }

    // ===== 🔮 席琳套裝效果：⚠️v3.1.68 改「席琳遺骸」計件——只掃 8 格遺骸欄（SHERINE_REMAINS·欄位鍵=物品id）=====
    // 每格遺骸必附一種席琳詞綴(seteff)，相同組名的遺骸格數達 2/3/5 → 發動效果（門檻/效果不變）。
    // 裝備上的舊詞綴(p.eq 其他欄的 seteff)保留顯示但「不再計入」；可由菈克希絲拆分成遺骸。
    // 同步寫入傭兵快照：buildAlly 換身重算時 p=ally，旗標自然存於傭兵物件上（傭兵存檔角色的遺骸欄同樣生效）
    let _shSets = {};
    if (typeof SHERINE_REMAINS !== 'undefined') for (let _r of SHERINE_REMAINS) {
        let e = p.eq && p.eq[_r.id];
        if (e && e.seteff) { let g = e.seteff.slice(0, 2); _shSets[g] = (_shSets[g] || 0) + 1; }   // 計件＝帶該套裝名的「遺骸部位數」（8 格各算一件·部位天然不重複）
    }
    let _shN = (g) => (_shSets[g] || 0);
    p._sherineSetCnt = {};   // 🔮 各組件數（部位數）：供狀態面板（n/5 徽章）與裝備欄底色判定使用
    for (let g in _shSets) p._sherineSetCnt[g] = _shSets[g];
    if (_shN('紅獅') >= 2) { d.extraDmg += 5; d.extraMp += 3; }
    if (_shN('紅獅') >= 3) { d.dr += 10; }
    p._setRedLion5 = _shN('紅獅') >= 5;          // 最終傷害 +10%（普攻於 getPhysicalDmg、技能於 castSkill、各 proc 套用）
    if (_shN('白鳥') >= 2) { d.extraHit += 5; }
    if (_shN('白鳥') >= 3) { d.cha += 10; }   // 白鳥3件：魅力+10（可突破 60 上限）
    p._setWhiteBird5 = _shN('白鳥') >= 5;        // 一般攻擊命中附加「脆弱」3 秒
    if (_shN('鐵衛') >= 2) { d.ac -= 3; d.dr += 5; }
    p._setIron3 = _shN('鐵衛') >= 3;             // 受到傷害 −20%（受擊時·乘算）
    p._setIron5 = _shN('鐵衛') >= 5;             // 🔧 一般攻擊命中附加嘲諷 3 秒（怪物單體攻擊優先鎖定自身，且一般攻擊傷害 -10%）
    if (_shN('麗人') >= 2) { d.meleeDmg += 3; d.meleeHit += 3; }
    if (_shN('麗人') >= 3) { d.meleeCrit += 3; }
    p._setBeauty5 = _shN('麗人') >= 5;           // 裝備近距離武器時攻擊速度 +20%
    delete p._beautyMissStack;                    // 清除舊版麗人 5/5 的未命中堆疊 runtime
    if (_shN('疾風') >= 2) { d.rangedDmg += 3; d.rangedHit += 3; }
    if (_shN('疾風') >= 3) { d.rangedCrit += 3; }
    p._setGale5 = _shN('疾風') >= 5;             // 連射傷害 30%→80%
    if (_shN('月光') >= 2) { d.extraDmg += 2; d.extraHit += 3; }
    if (_shN('月光') >= 3) { d.er += 5; d.mr += 10; }
    p._setMoon5 = _shN('月光') >= 5;             // 普攻／技能傷害附加碎裂 3 秒（AC-10）
    if (_shN('學徒') >= 2) { d.mpR += 5; d.extraMp += 6; }
    if (_shN('學徒') >= 3) { d.magicCrit += 3; }
    p._setApprentice5 = _shN('學徒') >= 5;       // MP<30% 時技能耗魔減半（getMpCost 套用）
    if (_shN('魔女') >= 2) { d.magicDmg += 3; }
    if (_shN('魔女') >= 3) { d.resWater += 10; d.extraMp += 5; }
    p._setWitch5 = _shN('魔女') >= 5;            // 🔧 每 5 次共鳴 → 免費冰雪暴（sk_blizzard·4×2D10 水全體·不受法師階級加成）
    if (!p._setWitch5) p._witchResCnt = 0;       // 卸下套裝即重置共鳴計數
    if (_shN('暗影') >= 2) { d.extraDmg += 7; }   // 🔧 暗影 2/5：額外傷害+7
    p._setShadow3 = _shN('暗影') >= 3;            // 🔧 暗影 3/5：裝備鋼爪／雙刀時，雙擊觸發機率 +20%
    p._setShadow5 = _shN('暗影') >= 5;            // 🔧 暗影 5/5：雙擊額外攻擊傷害加倍（×2·procCombo/allyComboAttack 套用）
    // 🔮 幻覺：立方、冰雪颶風/火牢 DoT、魔爆、spellProc/procSkill 等免費觸發魔法有效；2件每次法術事件僅回一次MP（AOE不逐目標回）；一般傷害法術、共鳴、反射無效；玩家與傭兵規則相同
    p._setIllusion2 = _shN('幻覺') >= 2;
    p._setIllusion3 = _shN('幻覺') >= 3;
    p._setIllusion5 = _shN('幻覺') >= 5;
    // 🐉 龍血：2件 造物理傷害吸血1%(自身HP<50%→5%)；3件 放HP消耗技得「龍裔」10秒受傷-15%；5件 HP消耗技傷害+20%
    p._setDragonblood2 = _shN('龍血') >= 2;
    p._setDragonblood3 = _shN('龍血') >= 3;
    p._setDragonblood5 = _shN('龍血') >= 5;
    // 😡 狂怒：2件 負重+500（負重段）、3件 最大HP+20%（HP段）皆於下方以 _shN('狂怒') 套用；5件 血量每少10%造傷+3%/受傷-3%(最多±15%)
    p._setFury5 = _shN('狂怒') >= 5;

    // 🎴 卡片收集：各地區「完成」加成（HP/MP/抗性/負重等；只取該區最高已達階；weight 累積到 d._cardWeightBonus 供下方負重段）
    if (typeof cardCollectionBonus === 'function') cardCollectionBonus(p, d);
    // 🗡️ 裝備收集冊：各部位「全收集」加成（HP/MP/傷害減免/MR/恢復/ER/AC/負重/夥伴命中；weight→d._equipWeightBonus 供下方負重段、petHit→p._equipPetHit 供 petGearBonus）
    if (typeof equipCollectionBonus === 'function') equipCollectionBonus(p, d);
    // 🧰 道具收集冊：各類「全收集」加成（藥水/卷軸→負重、技能書→MP恢復、材料/其他→藥水恢復%；weight→d._miscWeightBonus 供負重段、potion→p._miscPotionBonus 供 js/08）
    if (typeof miscCollectionBonus === 'function') miscCollectionBonus(p, d);

    // 🏅 生存精通：MR+15（藥水恢復 +25% 於 useItem 套用）
    if (p.mastery === 'k_survive') d.mr += 15;
    if (player.skills.includes('sk_warrior_crush')) d.meleeDmg += 2 + Math.max(0, p.lv - 44);   // ⚔️ 粉碎：近距離傷害+2；玩家等級45起每升一級+1
    
    let spdMult = 1.0;
    let _mercPots = !!p._mercPermanentPotions;   // 🤝 傭兵預設常駐職業藥水效果（不消耗道具、不寫入一般 buff 計時）
    if(p.buffs.haste > 0 || p._equipHaste || _mercPots) spdMult *= (1/1.33);   // 加速術／加速藥水／裝備加速：攻速+33%（🔧 v3.5.37 名實相符：1/1.33＝速度×1.33，取代舊 0.67＝實際+49%）；傭兵全職常駐
    if(p.buffs.brave > 0 || (_mercPots && ['knight','dragon','warrior','royal'].includes(p.cls))) spdMult *= (1/1.33);   // 勇敢藥水：攻速+33%（🔧 v3.5.37 1/1.33）；可用職業傭兵常駐
    if(p.buffs.elfcookie > 0 || (_mercPots && p.cls === 'elf')) spdMult *= (1/1.15); // 精靈餅乾：攻速+15%（🔧 v3.5.37 1/1.15·取代舊 0.85＝實際+17.6%）；妖精傭兵常駐
    if(p.buffs.sk_dark_walkhaste > 0) spdMult *= (1/1.15); // 🔧 行走加速：攻速+15%（v3.5.37 1/1.15）（與加速術等相乘疊加）
    { let _clvW = p.eq.wpn ? DB.items[p.eq.wpn.id] : null; let _clvOn = !p.classicMode && ((p.statuses && p.statuses.cleave > 0) || (p.mastery === 'k_cleave' && _clvW && _clvW.eff === 'cleave')); if(_clvOn) spdMult *= (p.mastery === 'k_cleave' ? (1/1.5) : (1/1.2)); }   // 切割：攻速+20%（🏅 切割精通：+50%・持切割武器常駐），與其他加速相乘疊加；🎮 經典模式停用
    if (typeof player !== 'undefined' && p === player && !p._allyName && (p._crushFuryUntil || 0) > state.ticks) spdMult *= (1/1.2);   // 🔨 v3.6.47 重裝戰士的粉碎鎚：即死觸發攻速+20%（8秒·js/04 授予·js/03 到期重算·經典亦生效比照即死本體；傭兵版走 _crushFuryTicks 於 js/06 攻擊間隔）
    { let _ffOn = typeof player !== 'undefined' && p === player && !p._allyName && (p._fangFuryUntil || 0) > state.ticks; let _ffw = p.eq.wpn && DB.items[p.eq.wpn.id]; spdMult *= critFurySpeedMultiplier(_ffOn, _ffw && _ffw.critFuryHaste && _ffw.critFuryHaste.pct); }   // 🏺 v3.7.52 邪惡利牙：爆擊觸發攻速+30%（5秒·js/04 授予·js/03 到期重算；傭兵版走 _fangFuryTicks 於 js/06 攻擊間隔）
    { let _swMelee = p.eq.wpn ? DB.items[p.eq.wpn.id] : null; if(p.mastery === 'e_sword' && _swMelee && !_swMelee.w2h && !_swMelee.isBow && !_swMelee.ranged) spdMult *= (1/1.5); }   // 🏅 劍術精通：持單手近戰武器攻速+50%（與加速/勇敢/餅乾/變身相乘疊加）
    { let _aw = p.eq.wpn ? getWeaponTags(p.eq.wpn.id) : []; let _ow = p.eq.offwpn ? getWeaponTags(p.eq.offwpn.id) : []; if(p.mastery === 'k_giantaxe' && (_aw.includes('雙手鈍器') || _ow.includes('雙手鈍器'))) spdMult *= (1/1.3); else if(p.mastery === 'k_dualaxe' && _aw.includes('單手鈍器') && p.eq.offwpn && _ow.includes('單手鈍器')) spdMult *= (1/1.3); }   // ⚔️ 巨斧精通(主手或副手任一持雙手鈍器·符合「持雙手鈍器+30%」描述·含混裝)／雙斧精通(主副手皆單手鈍器)：攻速+30%
    { let _rw = p.eq.wpn ? getWeaponTags(p.eq.wpn.id) : []; if(p.mastery === 'k_royal_sword' && (_rw.includes('單手劍') || _rw.includes('雙手劍'))) spdMult *= (1/1.5); }   // 👑 劍術精通：裝單手劍／雙手劍攻速+50%
    { let _iw = p.eq.wpn ? DB.items[p.eq.wpn.id] : null; if(p.cls === 'illusion' && _iw && !_iw.isBow && ((p.mastery === 'i_qigu' && _iw.qigu) || (p.mastery === 'i_magicsword' && !_iw.qigu && !isWandWeapon(_iw)))) spdMult *= (1/1.3); }   // 🔮 奇古獸精通(裝奇古獸)／魔劍精通(裝非奇古獸·排除魔杖)：攻速+30%
    // 🏺 v3.6.44 魔力凝聚的法陣（長靴·statArray）：每 5 體質→攻速 +1%、每 5 敏捷→近傷 +1、每 5 力量→遠傷 +1（用最終六維·置於攻速%消費前）
    if (p.eq.boots && (DB.items[p.eq.boots.id] || {}).statArray) { d.atkSpdPct += statArrayBonus(d.con); d.meleeDmg += statArrayBonus(d.dex); d.rangedDmg += statArrayBonus(d.str); }
    // 🏺 v3.6.44 守護獸的難題（斗篷·playerHardSkin）：裝備→硬皮池初始化 30；卸下→清除（僅主玩家·傭兵換身 _allyName 不吃·runtime 欄位不入檔）
    if (typeof player !== 'undefined' && p === player && !p._allyName) { let _ghs = p.eq.cloak && (DB.items[p.eq.cloak.id] || {}).playerHardSkin; if (_ghs) { if (p._hardSkinPool == null) p._hardSkinPool = 30; } else if (p._hardSkinPool != null) delete p._hardSkinPool; }
    if(d.atkSpdPct !== 0) spdMult *= (1 / (1 + d.atkSpdPct / 100));   // 🏺 遺物 綠色妖鬼的指甲 +20%／🏺 鎧甲守衛的笨重巨劍 -50%（負值＝攻速變慢·間隔加倍·v3.1.52 由 >0 改 !==0 使負值生效）
    // ⚠️ 必須連 buffs.poly 一起檢查（與 542 行的 _polyForm 同口徑）：p.poly 只是「上次變成什麼」的紀錄，
    //    全專案沒有任何路徑會在 buffs.poly 歸零時把它清成 null，只看物件存在＝變身期滿後攻速加成永久殘留。
    { let _polySpd = 0; if (p._setPoly || (p.buffs.poly > 0 && p.poly)) { try { for (let _k in p.eq) { let _e = p.eq[_k]; if (_e && DB.items[_e.id] && DB.items[_e.id].polyAtkSpdPct) _polySpd += DB.items[_e.id].polyAtkSpdPct; } } catch (e) {} } if (_polySpd > 0) spdMult *= (1 / (1 + _polySpd / 100)); }   // 🏺 v3.2.17 浣熊的變身葉：變身狀態時攻擊速度 +20%（需裝備·限變身期間）
    { let _mhw = p.eq.wpn ? DB.items[p.eq.wpn.id] : null; if(d.meleeHaste > 0 && _mhw && !_mhw.isBow && !_mhw.ranged) spdMult *= (1 / (1 + d.meleeHaste / 100)); }   // 🏺 遺物 狂野的鬃毛外套：裝備近距離武器時攻速 +meleeHaste%
    if(p.buffs.blue > 0) d.mpR += getWisBlueBonus(d.wis);          // 藍色藥水：依精神提升MP恢復
    if(p.buffs.cautious > 0 || (_mercPots && p.cls === 'mage')) { d.magicDmg += 2; d.mpR += 2; }      // 慎重藥水；法師傭兵常駐
    if(p.buffs.sk_reduction_armor > 0) d.dr += Math.floor(p.lv/10);   // 增幅防禦：等同傷害減免 floor(等級/10)，併入 DR 顯示與計算
    if(p.statuses && p.statuses.evilAura > 0) { d.ac += 10; d.er -= 10; }   // 🔧 邪靈之氣減益：AC+10、ER−10（持續6秒，由黑暗精靈使施放）
    
    // 技能buff（非屬性部分；STR/DEX/INT/CON/WIS 已於 Phase 1 計入）
    // meleeDmg/meleeHit -> 近距離；rangedDmg/rangedHit -> 遠距離（彼此獨立，依武器種類生效）
    for(let k in p.buffs) {
        if(p.buffs[k] > 0 && DB.skills[k] && DB.skills[k].d) {
            let bd = DB.skills[k].d;
            if(bd.meleeDmg) d.meleeDmg += bd.meleeDmg;
            if(bd.meleeHit) d.meleeHit += bd.meleeHit;
            if(bd.rangedDmg) d.rangedDmg += bd.rangedDmg;
            if(bd.rangedHit) d.rangedHit += bd.rangedHit;
            if(bd.extraDmg) d.extraDmg += bd.extraDmg;
            if(bd.extraHit) d.extraHit += bd.extraHit;
            if(bd.magicDmg) d.magicDmg += bd.magicDmg;
            if(bd.ac) d.ac -= bd.ac;
            if(bd.er) d.er += bd.er;
            if(bd.mpR) d.mpR += bd.mpR;
            if(bd.dr) d.dr += bd.dr;
            if(bd.mr) d.mr += bd.mr;
            if(bd.resFire)  d.resFire  += bd.resFire;
            if(bd.resWater) d.resWater += bd.resWater;
            if(bd.resEarth) d.resEarth += bd.resEarth;
            if(bd.resWind)  d.resWind  += bd.resWind;
        }
    }

    // 單屬性防禦：所選屬性抗性 +50
    if(p.buffs.sk_elf_singleres > 0 && p.elfEle) {
        if(p.elfEle === 'fire')  d.resFire  += 50;
        if(p.elfEle === 'water') d.resWater += 50;
        if(p.elfEle === 'earth') d.resEarth += 50;
        if(p.elfEle === 'wind')  d.resWind  += 50;
    }

    // 🏺 v3.5.27 黑騎士的精銳長槍＋鎧衛隊的漆黑塔盾 同時裝備：近距離傷害 +15（格檔100%／經典模式亦可格檔＝js/04 受擊路徑）
    if (p.eq && p.eq.wpn && p.eq.wpn.id === 'relic_bk_lance' && p.eq.shield && p.eq.shield.id === 'relic_guard_towershield') d.meleeDmg += 15;
    // 🏺 v3.7.20 盔甲內襯鎖鏈衣（T恤 liningChain）：裝備「防禦 6 以下」盔甲（def ac 0~6·ac 欄正值=AC−X）→ 額外 AC-10、MR+10（p 參數化→傭兵換身自動鏡像）
    if (p.eq && p.eq.tshirt && p.eq.armor) {
        let _lct = DB.items[p.eq.tshirt.id], _lca = DB.items[p.eq.armor.id];
        if (_lct && _lct.liningChain && _lca && (_lca.ac || 0) >= 0 && (_lca.ac || 0) <= 6) { d.ac -= 10; d.mr += 10; }
    }

    // 變形卷軸變身依目前武器分流：遠距離武器只能使用遠距離變身，其餘（含空手）只能使用近距離變身。
    // 換武器時 calcStats 會立即重抽相符類型；套裝／武器強制變身 _setPoly 仍保留原本專屬形態。
    // 此正規化對玩家與傭兵換身重算皆執行（player 為可換身全域·buildAlly/_allyLevelRecompute 期間指向傭兵）。
    if(p.poly && p.buffs.poly > 0 && !polyFormMatchesEquippedWeapon(p.poly)) p.poly = getPolyState();
    // 變身：套裝變身（_setPoly，僅穿著套裝時生效、卸下立即消失）優先於藥水變身（buffs.poly 計時）
    let _polyForm = p._setPoly || ((p.buffs.poly > 0 && p.poly) ? p.poly : null);
    if(_polyForm) {
        let pf = _polyForm;
        // 🆕 v3.0.28 速度覆蓋（凡有 atk 者皆套用）：POLY_TIERS 速度型變身、及套裝變身 SET_POLY_FORMS（現在也帶 atk/wlk/cast/stun）。
        //   攻擊間隔＝動畫幀換算秒（APM=1440/幀），之後仍照常 ×spdMult（加速/勇敢/精通疊加）；移動速度 pf.wlk 於出怪排程（js/03）影響重生。
        if(pf.atkApm != null) {   // 指定每分鐘攻擊次數：避免 85／88／90 等速度換算成百分秒後產生累積誤差
            d.aspd = 60 / Math.max(1, pf.atkApm);
            if(pf.castApm != null) d.castLock = d.supportCastLock = 600 / Math.max(1, pf.castApm);
            else if(pf.cast != null) d.castLock = d.supportCastLock = pf.cast;
            if(pf.stun != null) d.hitstun = pf.stun;
        } else if((pf.shanna || pf.trueShanna) && typeof shannaSpeedForActor === 'function') {
            let _ss = pf.trueShanna ? trueShannaSpeedForActor(p) : shannaSpeedForActor(p);   // 🧝 v3.5.21 真夏納：逐武器 APM 查表（值不同·可用家族形狀同夏納）
            if(_ss.apm != null) d.aspd = 60 / Math.max(1, _ss.apm);
            if(_ss.hitstun != null) d.hitstun = _ss.hitstun;
            d.castLock = 600 / (pf.castApm || 80);              // 攻擊／自動施法（夏納80·真夏納85 次/分）
            d.supportCastLock = 600 / (pf.supportCastApm || 72);   // 輔助施法（夏納72·真夏納75 次/分）
        } else if(pf.apm != null) {   // 🌑 v3.4.67 逐武器種類 APM 攻速（冥皇執行劍/烈焰死騎變身）：依當前武器種類查表→6000/APM/100=秒（同 atkSpdBaseItv）；空手/缺項退單手劍
            let _fam = (p.eq && p.eq.wpn && typeof atkSpdFamily === 'function') ? atkSpdFamily(p.eq.wpn.id) : null;
            let _apm = (_fam && pf.apm[_fam]) || pf.apm['單手劍'] || 60;
            d.aspd = Math.round(6000 / Math.max(1, _apm)) / 100;
            if(pf.cast != null) d.castLock = d.supportCastLock = pf.cast;
            if(pf.stun != null) d.hitstun  = pf.stun;
        } else if(pf.atk != null) {
            d.aspd = Math.round(pf.atk * 6000 / 1440) / 100;         // 攻擊間隔（秒）
            if(pf.cast != null) d.castLock = d.supportCastLock = pf.cast; // 施法冷卻下限（tick）
            if(pf.stun != null) d.hitstun  = pf.stun;               // 被擊硬直（tick）
        }
        // 屬性加成（純速度型 POLY_TIERS 無此欄＝+0；套裝變身保留傷害/命中/魔法等加成，與上方速度並存）
        d.meleeDmg  += (pf.md  || 0); d.meleeHit  += (pf.mh || 0);   // 近距離傷害 / 命中
        d.rangedDmg += (pf.rd  || 0); d.rangedHit += (pf.rh || 0);   // 遠距離傷害 / 命中
        d.extraDmg  += (pf.ed  || 0); d.extraHit  += (pf.eh || 0);   // 額外傷害 / 命中
        d.magicDmg  += (pf.mgd || 0);                                // 魔法傷害
        d.extraMp   += (pf.sp  || 0);                                // 額外魔法點數
        d.mpR       += (pf.mpr || 0);                                // MP 自然恢復量
        d.ac        += (pf.ac  || 0);                                // AC（規格 AC-1 以 ac:-1 表示）
        d.er        += (pf.er  || 0);                                // ER
        d.mr        += (pf.mr  || 0);                                // MR
        if(pf.spd) spdMult *= (1 / (1 + pf.spd/100));                // 攻速加快%（舊相容欄位）：速度×(1+spd%)，新設定已改速度覆蓋不帶 spd
    }
    if (d.hitstunReduce > 0) d.hitstun = Math.max(0, (d.hitstun || 0) - d.hitstunReduce);   // 🏺 不動的鋼鐵堅壁：硬直減免統一套用點（置於變身速度覆蓋後→變身形態的 pf.stun 也吃減免·夾下限 0）

    if(p.buffs.sk_soul_up > 0) { p.mhp = Math.floor(p.mhp * 1.2); p.mmp = Math.floor(p.mmp * 1.2); }
    if (player.skills.includes('sk_warrior_armorbody')) d.dr += Math.floor((10 - d.ac) / (hasMastery('k_tough') ? 5 : 10));   // ⚔️ 護甲身軀：傷害減免 +[(10-AC)/10]；🏅 堅韌精通改 /5
    if (p.buffs.sk_warrior_endurance > 0) p.mhp = Math.floor(p.mhp * (1 + (p.lv / 2) / 100));   // ⚔️ 體能強化：HP上限 +(等級/2)%
    if (_shN('狂怒') >= 3) p.mhp = Math.floor(p.mhp * 1.2);   // 😡 狂怒 3/5：最大HP +20%（於各 flat HP 加成後套用）
    if(p.mastery === 'i_mana') p.mmp = Math.floor(p.mmp * 2);   // 🔮 魔力精通：MP 上限加倍（耗魔亦加倍，見 getMpCost）
    // 血盟 Buff：由角色自行開啟，每小時消耗貢獻；能力依全模式共用血盟等級決定。
    if (typeof getClanBuffStats === 'function') {
        let _cb = getClanBuffStats(p);
        if (_cb) {
            p.mhp += _cb.hp || 0;
            p.mmp += _cb.mp || 0;
            d.extraDmg += _cb.extraDmg || 0;
            d.extraHit += _cb.extraHit || 0;
            d.mr += _cb.mr || 0;
            d.magicDmg += _cb.magicDmg || 0;
            d.hpR += _cb.hpR || 0;
            d.mpR += _cb.mpR || 0;
            d.ac += _cb.ac || 0;
        }
    }

    // 🐉 龍騎士 覺醒（安塔瑞斯/法利昂/巴拉卡斯）：d:{} 內的 AC/抗性/屬性/額外命中已由上方 buff 迴圈套用；此處補非標準效果與攻速
    {
        let _awakenOn = false;
        if(p.buffs.sk_dragon_awaken_antares > 0) { _awakenOn = true; d.immPoison = true; p.mhp += 2 * p.lv; }   // 安塔瑞斯：免疫中毒與麻痺、HP+(2×等級)
        if(p.buffs.sk_dragon_awaken_falion > 0)  { _awakenOn = true; d.mr = Math.floor(d.mr * 1.15); }          // 法利昂：MR+15%
        if(p.buffs.sk_dragon_awaken_baraka > 0)  { _awakenOn = true; }                                          // 巴拉卡斯：屬性/額外命中已由 buff 迴圈套用
        if(_awakenOn) spdMult *= (p.mastery === 'k_awaken' ? (1/1.5) : (1/1.2));   // 覺醒攻速：🏅覺醒精通+50%、否則+20%（不疊加；多覺醒只算一次）
    }
    if(p.buffs.sk_dragon_bloodlust > 0) spdMult *= (1/1.15);   // 🐉 血之渴望：攻速+15%（速度×1.15；與加速/覺醒/變身相乘疊加）
    // 🌟 v3.0.100 玩家攻擊也吃「傭兵提供的幻覺攻擊光環」(化身+10/歐吉+4傷+4命/巫妖+2魔傷)：玩家自身幻覺已由上方 buff 迴圈套入 d·此處只補「傭兵來源」(teamIlluAura(p) 已排除玩家自身避免雙算)·限玩家(_recomputingAlly=false·傭兵走 alliesTick 注入)。傭兵化身狀態變動時由 allyMaintainBuffs 觸發 calcStats 刷新此段。
    if (!_recomputingAlly && typeof teamIlluAura === 'function') { let _mia = teamIlluAura(p); if (_mia) { d.extraDmg += _mia.ed; d.extraHit += _mia.eh; d.magicDmg += _mia.md; d.meleeDmg += (_mia.mel || 0); } }   // 🔥 v3.8.3 mel＝舞躍之火團隊光環（近距離傷害·自身持有時已由上方 buff 迴圈算入·此處只補其他隊員來源）
    // 🏺 人面獅身的漆黑羽翼（drPerEr）：傷害減免 +（完整 ER ÷ N）。ER 的迴避效益遞減由 effResistPct 處理，此處不設上限。
    if (p.eq) { for (let _dk in p.eq) { let _de = p.eq[_dk]; if (!_de) continue; let _dd = DB.items[_de.id];
        if (_dd && _dd.drPerEr) d.dr += relicDrPerErBonus(d.er, _dd.drPerEr); } }
    // 🏺 v3.7.52 高崙的生命印記（golemMarkDebuff）：受重擊後 3 秒 MR-100（js/04 授予·js/03 到期重算；置於所有 MR 來源之後·可為負值＝魔法傷害被放大）
    d.mr += golemMarkMrPenalty(
        (p._golemMrDebuffUntil || 0) > state.ticks,
        !!(p.eq && p.eq.helm && (DB.items[p.eq.helm.id] || {}).golemMarkDebuff));
    // 🏺 v3.7.54 專精劍術的魔劍士之刀（spellbladeBuff）：消耗MP施放傷害法術後 10 秒·依法術階級提升近傷/近命（1:+1 2:+2 3:+3 4:+6 5:+9 6:+12 7:+15 8:+18 9:+21 10:+25）
    if ((p._spellbladeUntil || 0) > state.ticks && p.eq && p.eq.wpn && (DB.items[p.eq.wpn.id] || {}).spellbladeBuff) {
        let _sbB = spellbladeMeleeBonus(p._spellbladeTier);
        d.meleeDmg += _sbB; d.meleeHit += _sbB;
    }
    // 🐉 v3.7.57 安塔瑞斯副本助戰者（僅主玩家·快照制 player.antharasHelpers）：精準=等級5%額外命中(≤20)·破壞=近/遠/魔傷/SP各5%(各≤20)·
    //    抵抗=地抗100%(≤+30)·護衛=MR10%傷害減免(≤20%·存 p._antHelperDr·js/04 受擊點消費——⚠️獨立函式不動被 C# 包裝的 teamDmgReduceMult)
    p._antHelperDr = 0;
    if (!_recomputingAlly && p.antharasHelpers) {
        let _ah = p.antharasHelpers;
        if (_ah.precision) d.extraHit += antHelperPrecisionBonus(_ah.precision.lv);
        if (_ah.destroy) {
            d.meleeDmg  += antHelperDestroyBonus(_ah.destroy.meleeDmg);
            d.rangedDmg += antHelperDestroyBonus(_ah.destroy.rangedDmg);
            d.magicDmg  += antHelperDestroyBonus(_ah.destroy.magicDmg);
            d.extraMp   += antHelperDestroyBonus(_ah.destroy.sp);
        }
        if (_ah.resist) d.resEarth = (d.resEarth || 0) + antHelperEarthResistanceBonus(_ah.resist.resEarth);
        if (_ah.guard) p._antHelperDr = antHelperGuardReductionPercent(_ah.guard.mr);
    }
    // 🐉 v3.7.57 地龍之魔眼觸發增益（10 分鐘）：額外傷害/額外命中/ER 各 +5（js/04 石化觸發·js/03 _tickExpireFields 到期重算）
    if ((p._eyePetrifyUntil || 0) > state.ticks) { d.extraDmg += 5; d.extraHit += 5; d.er += 5; }

    // 原版方向魔法公式拆分：INT 提供 SP 封頂 33；其餘 extraMp 才列為道具／套裝／增益 SP。
    // 用未封頂的 INT 原始提供量扣除，避免 INT 100 多出的 2 點被誤判成道具 SP。
    let _rawIntSp = Math.max(0, getIntExtraMp(d.int));
    d.intSp = Math.min(33, _rawIntSp);
    d.itemSp = Math.max(0, (d.extraMp || 0) - _rawIntSp);
    if (p._setBeauty5 && p.eq && p.eq.wpn) {
        let _beautyWpn = DB.items[p.eq.wpn.id];
        if (_beautyWpn && !_beautyWpn.isBow && !_beautyWpn.ranged) spdMult *= (1 / 1.2);   // 麗人 5/5：近距離武器攻速 +20%
    }
    d.aspd = d.aspd * spdMult;   // 攻速倍率（加速/勇敢/餅乾/精通/裝備等）套入攻擊間隔；施法改由 castIntervalTicks 只讀職業／變身 cast

    // 🐾 馴獸師的飼料袋（allLures）：裝備時視為持有全部誘捕狀態；petCaptureOnKill 讀 player._allLures（不消耗、卸下即失效）
    p._allLures = false;
    for (let _lk in p.eq) { let _li = p.eq[_lk]; if (_li) { let _ld = DB.items[_li.id]; if (_ld && _ld.allLures) { p._allLures = true; break; } } }

    // ===== 🔧 負重系統：上限=(floor((3力+2體)/5)+1)×50；腰帶/負重強化提供額外上限；依%套用攻速懲罰 =====
    {
        let _wbase = (Math.floor((3 * d.str + 2 * d.con) / 5) + 1) * 50;
        let _cap = 0, _cur = 0;
        for (let _k of WEIGHT_COUNT_SLOTS) {
            let _it = p.eq && p.eq[_k]; if (!_it) continue;
            let _ed = DB.items[_it.id]; if (!_ed) continue;
            _cur += (ITEM_WEIGHTS[_ed.n] || 0);
            if (_ed.weightCap) _cap += _ed.weightCap;
            if (_ed.slot === 'belt') _cap += Math.min(_it.en || 0, 5) * 20;   // 🔧 腰帶強化：每+1 負重上限+20
        }
        if (p.buffs && p.buffs.sk_load_up > 0) _cap += 50;   // 負重強化增益：負重上限 +50
        if (d._cardWeightBonus) _cap += d._cardWeightBonus;   // 🎴 卡片收集：風木/奇岩完成 → 負重上限加成
        if (d._equipWeightBonus) _cap += d._equipWeightBonus;   // 🗡️ 裝備收集冊：單手/雙手鈍器/臂甲/腰帶部位全收集 → 負重上限加成
        if (d._miscWeightBonus) _cap += d._miscWeightBonus;   // 🧰 道具收集冊：藥水/卷軸類全收集 → 負重上限加成
        if (_shN('狂怒') >= 2) _cap += 500;   // 😡 狂怒 2/5：負重上限 +500
        let _limit = _wbase + _cap;
        let _pct = _limit > 0 ? Math.floor(_cur / _limit * 100) : 999;
        let _tier = _pct <= 49 ? 0 : (_pct <= 81 ? 1 : (_pct <= 99 ? 2 : 3));
        d.weightPct = _pct; d.loadTier = _tier;
        if (_tier === 2) d.aspd = d.aspd * 2;        // 82~99%：攻擊速度 -100%（間隔×2）
        else if (_tier === 3) d.aspd = d.aspd * 3;   // 100%+：攻擊速度 -200%（間隔×3）
    }

    // ⚔️ v3.5.100 副手獨立攻速：以「副手/主手 基礎間隔比」× 已完成全部修正的 d.aspd 推導（0＝沒副手）。
    //   ⭐ 刻意用比例而不是重算一次：d.aspd 上面經過 spdMult（加速術/勇敢藥水/精靈餅乾/行走加速/切割/劍術/巨斧/
    //      雙斧/王族劍術/奇古獸/魔劍精通、遺物 atkSpdPct、變身 polyAtkSpdPct、meleeHaste）與負重階懲罰（×2/×3），
    //      而且還可能被變身 profile 整段覆蓋。若副手重算一次，就得把那十幾條逐一複製——漏一條兩手就會不同步。
    //      用比例則全部自動繼承，只保留「兩把武器種類不同」這唯一該有的差異。
    //   ⚠️ 間隔與 APM 成反比 → 比例是 主手APM/副手APM（不是反過來）。
    d.aspdOff = 0;
    if (p.eq && p.eq.offwpn && typeof atkSpdApm === 'function') {
        let _mApm = atkSpdApm(p), _oApm = atkSpdApm(p, p.eq.offwpn.id);
        if (_mApm > 0 && _oApm > 0) d.aspdOff = d.aspd * (_mApm / _oApm);
    }
    p.hp = Math.min(p.hp, p.mhp);
    p.mp = Math.min(p.mp, p.mmp);
}

function calcStats() {   // 🔧 架構#4：對外介面不變（重算 + UI 刷新）
    recomputeStats();
    applyElfBorder();
    updateUI();
    applyDollCursor();   // 🪆 魔法娃娃：依 eq.doll 更新滑鼠游標（裝/卸/載入都會經過 calcStats）
}
// 🪆 娃娃游標點擊熱點光點：在滑鼠座標(＝cursor hotspot 4,4，點擊實際發生處)顯示淡淡圓點光；顏色＝娃娃名稱顏色。
let _dollGlow = null, _dollGlowColorCache = {};
function _dollNameColor(cls) {   // Tailwind 文字色 class → 實際 rgb（快取；供 currentColor 用）
    cls = cls || 'text-slate-200';
    if (_dollGlowColorCache[cls]) return _dollGlowColorCache[cls];
    let e = document.createElement('span'); e.className = cls; e.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
    document.body.appendChild(e); let c = getComputedStyle(e).color || 'rgb(226,232,240)'; document.body.removeChild(e);
    _dollGlowColorCache[cls] = c; return c;
}
function _ensureDollGlow() {   // 單例：建立光點 div＋掛 mousemove/mouseleave（只掛一次）
    if (_dollGlow || typeof document === 'undefined' || !document.body) return _dollGlow;
    _dollGlow = document.createElement('div'); _dollGlow.id = 'doll-cursor-glow'; _dollGlow.classList.add('offscreen');   // 起始隱藏，待首次移動才現身（不在 0,0 閃一下）
    document.body.appendChild(_dollGlow);
    document.addEventListener('mousemove', function (ev) {
        if (!_dollGlow.classList.contains('active')) return;   // 未裝娃娃：零成本略過
        _dollGlow.style.left = ev.clientX + 'px'; _dollGlow.style.top = ev.clientY + 'px';
        if (_dollGlow.classList.contains('offscreen')) _dollGlow.classList.remove('offscreen');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { if (_dollGlow) _dollGlow.classList.add('offscreen'); }, { passive: true });   // 滑鼠離開視窗：隱藏，避免光點卡在邊緣
    return _dollGlow;
}
// 🪆 魔法娃娃：裝備 slot:doll 時把滑鼠游標換成 assets/doll/<物品名稱>.png（可用 d.dollImg 自訂圖名）；未裝則回預設。游標圖需 ≤32×32 否則瀏覽器忽略→fallback auto
function applyDollCursor() {
    if (typeof document === 'undefined' || !document.body) return;
    let e = player && player.eq && player.eq.doll;
    let ed = e ? DB.items[e.id] : null;
    if (ed) {
        let img = ed.dollImg || ed.n;
        document.body.style.cursor = "url('assets/doll/" + img + ".png') 4 4, auto";
        document.body.classList.add('has-doll-cursor');     // 🪆 連可點擊處也套娃娃游標（見 css：body.has-doll-cursor *）
        let glow = _ensureDollGlow();                        // 🪆 點擊熱點光點：顏色＝娃娃名稱顏色（currentColor）
        if (glow) { glow.style.color = _dollNameColor(ed.c); glow.classList.add('active'); }
    } else {
        document.body.style.cursor = '';   // 未裝魔法娃娃 → 回預設游標
        document.body.classList.remove('has-doll-cursor');  // 卸下娃娃：必須移除 class，否則全頁強制 inherit 'auto' 會失去手指提示
        if (_dollGlow) _dollGlow.classList.remove('active');   // 🪆 卸下娃娃：關閉光點
    }
}

// ===== 變形卷軸：變身資料（依規格文件） =====
// 欄位：md/mh=近距離傷害/命中, rd/rh=遠距離傷害/命中, ed/eh=額外傷害/命中,
//       mgd=魔法傷害, sp=額外魔法點數, mpr=MP自然恢復量, ac=AC(負值代表AC-x),
//       er=ER, mr=MR, spd=攻擊速度加快(%)
// 顏色：Lv49以下白色、Lv50~51淡黃色、Lv52以上金色
const POLY_TIERS = [
    { min:0, max:9, color:"text-white", forms:[
        { n:"哥布林", lv:2, atk:23, wlk:19, cast:10, stun:5 },
        { n:"妖魔", lv:2, atk:33, wlk:20, cast:15, stun:5 },
        { n:"地靈", lv:3, atk:27, wlk:32, cast:11, stun:6 },
        { n:"妖魔弓箭手", lv:3, atk:47, wlk:20, cast:15, stun:6 },
        { n:"侏儒", lv:5, atk:37, wlk:15, cast:15, stun:5 },
        { n:"人形殭屍", lv:6, atk:26, wlk:50, cast:17, stun:2 },
        { n:"妖魔鬥士", lv:8, atk:23, wlk:16, cast:15, stun:4 },
        { n:"狼人", lv:9, atk:21, wlk:16, cast:18, stun:5 },
    ]},
    { min:10, max:19, color:"text-white", forms:[
        { n:"骷髏", lv:10, atk:23, wlk:16, cast:15, stun:4 },
        { n:"甘地妖魔", lv:10, atk:26, wlk:16, cast:11, stun:5 },
        { n:"骷髏弓箭手", lv:12, atk:28, wlk:18, cast:19, stun:5 },
        { n:"果凍怪", lv:12, atk:32, wlk:36, cast:13, stun:6 },
        { n:"骷髏槍兵", lv:13, atk:22, wlk:17, cast:18, stun:5 },
        { n:"骷髏斧手", lv:13, atk:25, wlk:15, cast:18, stun:6 },
        { n:"羅孚妖魔", lv:13, atk:26, wlk:16, cast:11, stun:5 },
        { n:"石頭高崙", lv:13, atk:66, wlk:32, cast:28, stun:1 },
        { n:"妖魔巡守", lv:14, atk:24, wlk:16, cast:10, stun:6 },
        { n:"阿吐巴妖魔", lv:15, atk:26, wlk:16, cast:11, stun:5 },
        { n:"都達瑪拉妖魔", lv:15, atk:29, wlk:16, cast:12, stun:5 },
        { n:"史巴托", lv:16, atk:21, wlk:18, cast:15, stun:4 },
        { n:"食屍鬼", lv:16, atk:26, wlk:50, cast:17, stun:2 },
        { n:"黑騎士", lv:16, atk:28, wlk:12, cast:8, stun:5 },
        { n:"萊肯", lv:17, atk:22, wlk:16, cast:15, stun:5 },
        { n:"那魯加妖魔", lv:17, atk:29, wlk:16, cast:12, stun:5 },
    ]},
    { min:20, max:29, color:"text-white", forms:[
        { n:"暴走兔", lv:20, atk:26, wlk:20, cast:14, stun:6 },
        { n:"長老", lv:21, atk:45, wlk:20, cast:8, stun:7 },
        { n:"食人妖精", lv:22, atk:21, wlk:16, cast:17, stun:5 },
        { n:"歐姆民兵", lv:26, atk:38, wlk:32, cast:21, stun:6 },
        { n:"歐吉", lv:28, atk:30, wlk:24, cast:15, stun:3 },
        { n:"多羅", lv:28, atk:30, wlk:24, cast:16, stun:3 },
        { n:"黑暗妖精運送員", lv:28, atk:38, wlk:24, cast:21, stun:6 },
        { n:"紙人", lv:28, atk:40, wlk:24, cast:22, stun:6 },
    ]},
    { min:30, max:39, color:"text-white", forms:[
        { n:"食人妖精王", lv:30, atk:18, wlk:16, cast:13, stun:4 },
        { n:"黑暗精靈", lv:30, atk:19, wlk:16, cast:10, stun:5 },
        { n:"巨人", lv:30, atk:20, wlk:22, cast:11, stun:3 },
        { n:"格利芬", lv:31, atk:24, wlk:14, cast:13, stun:7 },
        { n:"卡司特王", lv:33, atk:16, wlk:25, cast:8, stun:3 },
        { n:"黑暗妖精刺客", lv:33, atk:17, wlk:18, cast:9, stun:5 },
        { n:"雪怪", lv:33, atk:24, wlk:19, cast:13, stun:3 },
        { n:"亞力安", lv:34, atk:24, wlk:13, cast:15, stun:5 },
        { n:"巨大牛人", lv:35, atk:21, wlk:17, cast:12, stun:6 },
        { n:"阿魯巴", lv:35, atk:24, wlk:16, cast:13, stun:4 },
        { n:"思克巴", lv:37, atk:20, wlk:16, cast:10, stun:6 },
    ]},
    { min:40, max:49, color:"text-white", forms:[
        { n:"獨眼巨人", lv:40, atk:22, wlk:20, cast:12, stun:4 },
        { n:"思克巴女皇", lv:41, atk:16, wlk:16, cast:9, stun:5 },
        { n:"西瑪", lv:42, atk:37, wlk:16, cast:20, stun:6 },
        { n:"巴土瑟", lv:43, atk:37, wlk:16, cast:20, stun:6 },
        { n:"小惡魔", lv:44, atk:18, wlk:18, cast:10, stun:4 },
        { n:"卡士柏", lv:44, atk:37, wlk:16, cast:20, stun:6 },
        { n:"馬庫爾", lv:45, atk:22, wlk:16, cast:8, stun:6 },
        { n:"重裝歐姆", lv:48, atk:45, wlk:40, cast:25, stun:6 },
    ]},
    { min:50, max:59, color:"text-yellow-200", forms:[
        { n:"巴風特", lv:50, atk:1440/85, atkApm:85, wlk:12, cast:10, stun:5 },
        { n:"賽尼斯", lv:50, atk:16, atkApm:90, wlk:18, cast:600/84, castApm:84, stun:6 },
        { n:"黑長者", lv:50, atk:18, atkApm:80, wlk:16, cast:8, stun:6 },
        { n:"克特", lv:51, atk:16, wlk:16, cast:9, stun:5 },
        { n:"死亡騎士", lv:52, atk:15, wlk:16, cast:10, stun:5 },
        { n:"巴列斯", lv:53, atk:1440/88, atkApm:88, wlk:12, cast:10, stun:5 },
        { n:"艾莉絲", lv:55, atk:16, wlk:16, cast:9, stun:5 },
        { n:"炎魔", lv:56, atk:17, wlk:18, cast:9, stun:3 },
        { n:"吸血鬼", lv:56, atk:16, atkApm:90, wlk:24, cast:10, stun:6 },
        { n:"黑暗巡守", lv:57, atk:19, wlk:16, cast:12, stun:5 },
        { n:"黑暗騎士", lv:58, atk:14, wlk:16, cast:15, stun:5 },
        { n:"黑暗法師", lv:58, atk:17, wlk:16, cast:9, stun:6 },
        { n:"銀光巡守", lv:59, atk:19, wlk:16, cast:11, stun:5 },
    ]},
    { min:60, max:69, color:"text-yellow-400", forms:[
        { n:"銀光騎士", lv:60, atk:14, wlk:16, cast:15, stun:5 },
        { n:"騎士范德", lv:60, atk:16, wlk:16, cast:9, stun:5 },
        { n:"銀光法師", lv:60, atk:17, wlk:16, cast:9, stun:6 },
        { n:"惡魔", lv:61, atk:18, wlk:16, cast:9, stun:4 },
        { n:"黃金巡守", lv:61, apm:{ '弓':80, '十字弓':80, '單手劍':80 }, wlk:16, cast:11, stun:5 },   // 🏹 v3.5.9 用戶指定弓箭間隔 0.75s（APM 80·原 atk:19=0.79）
        { n:"黃金騎士", lv:62, atk:14, wlk:16, cast:15, stun:4 },
        { n:"黃金法師", lv:62, atk:17, wlk:16, cast:9, stun:6 },
        { n:"白金巡守", lv:63, apm:{ '弓':82, '十字弓':82, '單手劍':82 }, wlk:16, cast:10, stun:5 },   // 🏹 v3.5.9 用戶指定弓箭間隔 0.73s（APM 82·原 atk:19=0.79）
        { n:"白金騎士", lv:64, atk:14, wlk:16, cast:15, stun:4 },
        { n:"白金法師", lv:64, atk:17, wlk:16, cast:9, stun:5 },
    ]},
    { min:70, max:9999, color:"text-yellow-400", forms:[
        { n:"死亡", lv:70, atk:18, wlk:24, cast:10, stun:7 },
        { n:"反王肯恩", lv:75, atk:14.4, atkApm:100, wlk:18, cast:11, stun:6 },
        { n:"烈焰的死亡騎士", lv:80, apm:{ '單手劍':120,'單手鈍器':103,'雙手鈍器':103,'弓':90,'十字弓':90,'單手矛':111,'雙手矛':111,'魔杖':120,'匕首':131,'雙手劍':103,'雙刀':120,'鋼爪':120,'奇古獸':120,'鎖鏈劍':111,'雙斧':120 }, wlk:16, cast:7, stun:2 },   // 🌑 v3.4.67 逐武器種類 APM 攻速（用戶「變身速度」CSV·6000/APM/100=秒）
        { n:"莉絲安", lv:80, apm:{ '弓':90, '十字弓':90, '單手劍':90 }, wlk:16, cast:7, stun:2 },   // 🏹 v3.5.7 Lv80 遠距離變身（用戶指定·持弓攻速90→0.67s／攻擊施法85→cast7／硬直0.21s→stun2／走90→wlk16 同烈焰死騎慣例；遠距閘只吃弓/十字弓·單手劍僅 apm fallback 鍵）
    ]},
];

// Lv52 夏納：僅由變形控制戒指指定，不進入 POLY_TIERS，因此普通卷軸的隨機池永遠不會抽到。
// 外觀保留職業動態，只依 CSV 覆蓋當前職業性別＋武器的攻擊／硬直及兩種施法速度。
const SHANNA_FORM = {
    n: "夏納", lv: 52, shanna: true, controlOnly: true, keepClassAppearance: true,
    wlk: 16, castApm: 80, supportCastApm: 72, c: "text-yellow-400"
};
// 🧝 v3.5.21 Lv85 真夏納：僅由變形控制戒指指定（同夏納），但有 16 職業性別「專屬變身動態」（assets/classanim/真夏納<avatar>·js/09 classMorph 走職業式管線·逐武器動作變體）。
// 速度依用戶 CSV：攻擊 APM 逐武器查表（TRUE_SHANNA_APM·可用武器家族形狀與夏納 profile 一致）、自動施法 85／輔助施法 75 次/分、
// 硬直 0.21 秒（匕首長硬直職業＝夏納同名單→0.26 秒）、走速 單手劍 96/分→wlk15·其餘 90/分→wlk16（動態·見 playerMoveDelayMultiplier）。
const TRUE_SHANNA_FORM = {
    n: "真夏納", lv: 85, trueShanna: true, controlOnly: true, classMorph: true,
    wlk: 16, castApm: 85, supportCastApm: 75, c: "text-yellow-400"
};
const CONTROL_ONLY_POLY_FORMS = [SHANNA_FORM, TRUE_SHANNA_FORM];
const SHANNA_APM_PROFILES = {
    full:   { '單手劍':96, '單手鈍器':84, '雙手鈍器':84, '弓':75, '十字弓':75, '單手矛':90, '雙手矛':90, '魔杖':96, '匕首':102, '雙手劍':84 },
    six:    { '單手劍':96, '單手鈍器':84, '雙手鈍器':84, '弓':75, '十字弓':75, '單手矛':90, '雙手矛':90, '魔杖':96, '匕首':102 },
    dark:   { '單手劍':96, '單手鈍器':84, '雙手鈍器':84, '弓':75, '十字弓':75, '匕首':102, '雙刀':96, '鋼爪':96 },
    dragon: { '單手劍':96, '單手鈍器':84, '雙手鈍器':84, '單手矛':90, '雙手矛':90, '雙手劍':84, '鎖鏈劍':87 },
    illu:   { '單手鈍器':84, '雙手鈍器':84, '弓':75, '十字弓':75, '魔杖':96, '奇古獸':96 },
    warrior:{ '單手鈍器':84, '雙手鈍器':84, '單手矛':90, '雙手矛':90, '雙手劍':84, '雙斧':96 }
};
const SHANNA_PROFILE_BY_AVATAR = {
    '王子':'full', '公主':'full', '男騎士':'full', '女騎士':'full',
    '男妖精':'six', '女妖精':'six', '男法師':'six', '女法師':'six',
    '男黑暗妖精':'dark', '女黑暗妖精':'dark',
    '男龍騎士':'dragon', '女龍騎士':'dragon',
    '男幻術士':'illu', '女幻術士':'illu',
    '男戰士':'warrior', '女戰士':'warrior'
};
const SHANNA_DAGGER_LONG_HITSTUN = new Set(['王子', '女騎士', '女妖精', '男法師', '男黑暗妖精', '女黑暗妖精']);
function shannaSpeedForActor(p) {
    let av = (p && p.avatar) || ATK_AV_BY_CLS[(p && p.cls) || ''] || '王子';
    let profile = SHANNA_APM_PROFILES[SHANNA_PROFILE_BY_AVATAR[av]] || SHANNA_APM_PROFILES.full;
    let wid = p && p.eq && p.eq.wpn ? p.eq.wpn.id : null;
    let fam = wid && typeof atkSpdFamily === 'function' ? atkSpdFamily(wid) : null;
    if (p && p.eq && p.eq.offwpn) fam = '雙斧';
    let apm = fam ? profile[fam] : null;
    let hitstun = apm == null ? null : ((fam === '匕首' && SHANNA_DAGGER_LONG_HITSTUN.has(av)) ? 4.2 : 3.3);
    return { avatar: av, family: fam, apm, hitstun };
}
// 🧝 v3.5.21 真夏納逐武器 APM（用戶 CSV·全職業共用值·可用與否沿夏納 profile 形狀）
const TRUE_SHANNA_APM = { '單手劍':124, '單手鈍器':107, '雙手鈍器':107, '弓':93, '十字弓':93, '單手矛':115, '雙手矛':115, '魔杖':124, '匕首':135, '雙手劍':107, '雙刀':124, '鋼爪':124, '奇古獸':124, '鎖鏈劍':111, '雙斧':124 };
function trueShannaSpeedForActor(p) {
    let av = (p && p.avatar) || ATK_AV_BY_CLS[(p && p.cls) || ''] || '王子';
    let allow = SHANNA_APM_PROFILES[SHANNA_PROFILE_BY_AVATAR[av]] || SHANNA_APM_PROFILES.full;   // 可用武器家族＝夏納同形狀（CSV 0 值欄位一致）·清單外（含武士刀/空手）不覆蓋→維持職業速度
    let wid = p && p.eq && p.eq.wpn ? p.eq.wpn.id : null;
    let fam = wid && typeof atkSpdFamily === 'function' ? atkSpdFamily(wid) : null;
    if (p && p.eq && p.eq.offwpn) fam = '雙斧';
    let apm = (fam && allow[fam] != null) ? (TRUE_SHANNA_APM[fam] || null) : null;
    let hitstun = apm == null ? null : ((fam === '匕首' && SHANNA_DAGGER_LONG_HITSTUN.has(av)) ? 2.6 : 2.1);   // CSV 硬 0.21s·匕首長硬直職業 0.26s
    let wlk = (apm != null && fam === '單手劍') ? 15 : 16;   // CSV 走：單手劍 96/分→wlk15·其餘 90/分＝基準 16
    return { avatar: av, family: fam, apm, hitstun, wlk };
}

// 遠距離變身白名單；POLY_TIERS 內其餘形態一律視為近距離變身。
const RANGED_POLY_FORMS = new Set([
    "妖魔弓箭手", "妖魔巡守", "骷髏弓箭手", "黑暗精靈",
    "黑暗巡守", "銀光巡守", "黃金巡守", "白金巡守",
    "莉絲安"   // 🏹 v3.5.7 Lv80 遠距離變身
]);
function hasRangedPolyWeapon() {
    let w = player.eq && player.eq.wpn ? DB.items[player.eq.wpn.id] : null;
    return !!(w && (w.ranged || w.isBow));
}
function polyFormMatchesEquippedWeapon(form) {
    if (form && (form.keepClassAppearance || form.classMorph)) return true;   // 🧝 真夏納：職業式變身含遠近全武器動態→不受遠/近距類型閘限制

    return !!(form && RANGED_POLY_FORMS.has(form.n)) === hasRangedPolyWeapon();
}
function polyRandomCandidates() {
    let lv = player.lv || 1;
    // 🎲 v3.5.6 隨機變身（無戒指）：抽「自身等級（含）以下·全部相符類型形態」（同變形控制戒指可選範圍·不再限當前等級帶或斷層只取最高等）。
    let pool = [];
    for (const t of POLY_TIERS) for (const f of t.forms) {
        if (f.lv <= lv && polyFormMatchesEquippedWeapon(f)) pool.push(f);
    }
    if (pool.length) return pool;

    // Lv1 尚無正式解鎖形態時，取相符類型的最低需求形態，確保卷軸仍可使用。
    let matching = [];
    for (const t of POLY_TIERS) for (const f of t.forms) if (polyFormMatchesEquippedWeapon(f)) matching.push(f);
    let firstLv = Math.min(...matching.map(f => f.lv));
    return matching.filter(f => f.lv === firstLv);
}

// 玩家有效移動速度：未變身 wlk=16（90/分鐘）＝100%；回傳相對於基準 5 秒接敵／補怪時間的倍率。
// 移動速度只依據主玩家；變身、加速、職業藥水、行走加速、移速技能與裝備移速共用此換算，供生成排程與資訊面板使用。
function playerMoveDelayMultiplier() {
    let p = player || {};
    let buffs = p.buffs || {};
    let pfW = (p._setPoly && p._setPoly.wlk) ? p._setPoly.wlk
            : ((buffs.poly > 0 && p.poly && p.poly.wlk) ? p.poly.wlk : 16);
    let _pfT = p._setPoly || ((buffs.poly > 0 && p.poly) ? p.poly : null);   // 🧝 v3.5.21 真夏納：走速依當前武器（單手劍96/分→wlk15·其餘90/分→wlk16）
    if (_pfT && _pfT.trueShanna && typeof trueShannaSpeedForActor === 'function') pfW = trueShannaSpeedForActor(p).wlk;
    let mult = pfW / 16;
    if (buffs.haste > 0 || p._equipHaste) mult *= (1/1.33);   // 加速術／加速藥水／裝備加速：移速+33%（🔧 v3.5.37 名實相符 1/1.33＝速度×1.33·取代舊 0.67＝實際+49%→兩瓶疊加 223%→177%）
    if (buffs.brave > 0) mult *= (1/1.33);                     // 勇敢藥水：移速+33%（🔧 v3.5.37 1/1.33）
    let windDashOn = (buffs.sk_elf_winddash || 0) > 0;
    let dashSid = windDashOn ? 'sk_elf_winddash' : (((buffs.sk_holy_dash || 0) > 0) ? 'sk_holy_dash' : null);
    if (dashSid) mult *= 1 / ((DB.skills[dashSid] && DB.skills[dashSid].moveSpeedMult) || 1.33);   // 神聖疾走／風之疾走：移速+33%（速度×1.33）；若舊存檔同時殘留，風之疾走優先且不疊加
    if (buffs.elfcookie > 0 && !windDashOn) mult *= (1/1.15);  // 精靈餅乾：移速+15%；風之疾走存在時只保留餅乾攻速，不疊加移速
    if (buffs.sk_dark_walkhaste > 0) mult *= (1/1.15);         // 行走加速：移速+15%（🔧 v3.5.37 1/1.15）
    let equipPct = !p._allyName && !_recomputingAlly && p.d && p.d.moveSpeedPct ? Math.max(-95, p.d.moveSpeedPct) : 0;
    if (equipPct) mult *= 1 / (1 + equipPct / 100);            // 裝備移動速度
    return Math.max(0.001, mult);
}
function playerEffectiveMoveSpeedPct() {
    return Math.round(100 / playerMoveDelayMultiplier());
}

function getPolyTier(lv) {
    for (const t of POLY_TIERS) if (lv >= t.min && lv <= t.max) return t;
    return POLY_TIERS[POLY_TIERS.length - 1];
}
function findPolyForm(name) {
    for (const t of POLY_TIERS) for (const f of t.forms) if (f.n === name) return { form: f, color: t.color };
    for (const f of CONTROL_ONLY_POLY_FORMS) if (f.n === name) return { form: f, color: f.c || "text-yellow-400" };
    return null;
}
function makePolyState(form, color) { return Object.assign({ c: color }, form); }
// 🗼 套裝專屬變身（不進入隨機變形池）：死亡騎士套裝→真‧死亡騎士、克特套裝→真‧克特、惡魔套裝→惡魔
// 🗼 v3.0.28 套裝變身改「速度覆蓋＋保留傷害加成」：套用對應速度型變身的速度（atk/wlk/cast/stun），並保留原本傷害/命中提升（ed/eh/rd/rh/mgd 等）。舊 spd% 由速度覆蓋取代故移除。
const SET_POLY_FORMS = {
    dk:      { n: "真‧死亡騎士", ed: 6, eh: 6,                     atk: 15, wlk: 16, cast: 10, stun: 5, c: "text-yellow-400" },   // 速度＝死亡騎士（施法/硬直真值）
    kurt:    { n: "真‧克特",     ed: 4, eh: 8,                     atk: 16, wlk: 16, cast: 9,  stun: 5, c: "text-yellow-400" },   // 速度＝克特（＝騎士范德·硬直真值/施法估）
    demon:   { n: "惡魔", ed: 4, eh: 4, mgd: 3, sp: 3, mpr: 3,     atk: 18, wlk: 16, cast: 9, stun: 4, c: "text-red-400" },      // 速度＝惡魔
    darkelf: { n: "高等黑暗精靈", rd: 5, rh: 5,                    atk: 19, wlk: 16, cast: 10, stun: 5, c: "text-violet-300" }     // 速度＝黑暗精靈
};
// 🌑 v3.4.67 解除詛咒的真死亡騎士．冥皇執行劍 裝備變身（equip-only·不進隨機變形池；per-weapon APM 攻速·來源 CSV）
const DANTES_POLY_FORM = { n: "真死亡騎士 冥皇丹特斯", lv: 99, apm: { '單手劍':124,'單手鈍器':103,'雙手鈍器':103,'弓':90,'十字弓':90,'單手矛':111,'雙手矛':111,'魔杖':120,'匕首':131,'雙手劍':103,'雙刀':120,'鋼爪':120,'奇古獸':120,'鎖鏈劍':111,'雙斧':120 }, wlk: 16, cast: 7, stun: 2, c: "text-yellow-300" };

// 是否持有「變形控制戒指」(acc_117)
// 🔧 改為「背包攜帶即可觸發」：裝備中或背包內任一處有戒指都算持有，不需佔用戒指欄位
function hasPolyRing() {
    // 🐾 v3.2.17 浣熊的變身葉（relic_raccoon_leaf·頭盔遺物）：「需裝備」才可選擇變身（不同於戒指的攜帶即可）
    let _leaf = false; try { for (let k in player.eq) { let e = player.eq[k]; if (e && e.id === 'relic_raccoon_leaf') { _leaf = true; break; } } } catch (e) {}
    return _leaf
        || [player.eq.ring1, player.eq.ring2, player.eq.ring3, player.eq.ring4].some(e => e && e.id === 'acc_117')
        || (player.inv && player.inv.some(i => i && i.id === 'acc_117' && (i.cnt || 0) > 0));
}
// 是否持有傳送控制戒指 (acc_116)
// 🔧 改為「背包攜帶即可觸發」：裝備中或背包內任一處有戒指都算持有，不需佔用戒指欄位
function hasTeleportRing() {
    return [player.eq.ring1, player.eq.ring2, player.eq.ring3, player.eq.ring4].some(e => e && e.id === 'acc_116')
        || (player.inv && player.inv.some(i => i && i.id === 'acc_116' && (i.cnt || 0) > 0));
}
// 傳送：清空當前怪物並重置生怪排程；forceBoss=true 時讓下一次生怪必定為 BOSS
function doTeleport(forceBoss) {
    if (typeof npcClanOnLeaveBattleArea === 'function') npcClanOnLeaveBattleArea();
    if (typeof giltasKeepOnLeave === 'function') giltasKeepOnLeave();   // 🌑 v3.4.16 受詛咒聖地內瞬移＝清空重生怪物（吉爾塔斯消失重生）→ 視同離開戰鬥·先做 HP 保留判定（消耗完整的召喚球＋提示·helper 自帶地圖 gate）
    if (typeof playTeleportFx === 'function') { try { playTeleportFx(); } catch (e) {} }   // 🌀 v3.0.102 傳送術特效＋玩家 sprite 暫隱（傳送術技能/手動+自動瞬移卷軸皆經此）
    saveSiegeBossHp();   // 傳送前保存攻城塔/門血量
    mapState.mobs = [null, null, null, null, null];
    mapState.spawnAt = [null, null, null, null, null];
    if(forceBoss) mapState.forceBoss = true;
    mapState.suppressSiegeBoss = !forceBoss;   // 無戒指傳送：必不出現城門/守護塔；持戒指：forceBoss 必定出現
    renderMobs();
}

// ===== 🏛️ 隱藏狩獵區域系統（由對應地圖手動傳送/瞬移卷軸進入；不列於地圖選單、魔物追蹤無法指定；區域規則同地監狩獵地圖） =====
const HIDDEN_AREA_PARENT = { zone_37: 'hidden_lab_nolife', zone_38: 'hidden_lab_darkmagic', zone_39: 'hidden_seal_spirit', zone_40: 'hidden_seal_monster', zone_41: 'hidden_seal_demon', zone_33: 'hidden_antqueen' };
const HIDDEN_AREA_NAMES = { hidden_lab_nolife: '無生物研究室', hidden_lab_darkmagic: '黑魔法研究室', hidden_seal_spirit: '惡靈封印室', hidden_seal_monster: '魔物封印室', hidden_seal_demon: '惡魔封印室', hidden_antqueen: '巨蟻女皇棲息地' };
const HIDDEN_AREA_BG = { hidden_lab_nolife: '象牙塔4樓', hidden_lab_darkmagic: '象牙塔5樓', hidden_seal_spirit: '象牙塔6樓', hidden_seal_monster: '象牙塔7樓', hidden_seal_demon: '象牙塔8樓', hidden_antqueen: '螞蟻洞穴2樓' };   // 🏛️ 隱藏區域背景＝對應母地圖樓層同名圖；⚠️ v3.5.90 平面 assets/area/<樓層>.jpg 探測已移除（該目錄只剩 1920x1080 子夾）→ 現行走 AREA_1920 同名判定，這 6 個樓層名皆在表內；新增樓層背景須一併加進 AREA_1920 否則退回 SPECIAL_AREA_BG
function isHiddenArea(m) { return !!(m && HIDDEN_AREA_NAMES[m]); }
function enterHiddenArea(hiddenId) {
    if (typeof playTeleportFx === 'function') { try { playTeleportFx(); } catch (e) {} }   // 🌀 v3.0.102 隱藏區域傳送亦播傳送術特效＋玩家 sprite 暫隱
    let sel = document.getElementById('map-select');
    if (sel && !Array.from(sel.options).some(o => o.value === hiddenId)) {   // 隱藏地圖不在選單→臨時補一個 option 供 changeMap 讀值
        let o = document.createElement('option'); o.value = hiddenId; o.textContent = HIDDEN_AREA_NAMES[hiddenId] || hiddenId; sel.appendChild(o);
    }
    if (sel) sel.value = hiddenId;
    changeMap(true);   // force：繞過權限/鑰匙/受控限制；changeMap 讀 #map-select.value=hiddenId 進入並記入 lastBattleMap（供村莊「出發」一鍵返回）
    logCombat(`<span class="font-bold" style="color:#e879f9;text-shadow:0 0 8px #c026d3;">空間的裂隙在你眼前展開，你踏入了 ${HIDDEN_AREA_NAMES[hiddenId] || '隱藏狩獵區域'}。</span>`, 'magic');
}
// 🌀 順移按鈕：v3.4.21 改為優先消耗 瞬間移動卷軸；沒有卷軸才判定手動施放傳送術（MP 足夠時）；皆無則提示
function playerTeleport() {
    let _it = player.inv.find(i => i.id === 'scroll_teleport' && (i.cnt || 1) >= 1);
    if (_it) { state._manualTpUntil = (state.ticks || 0) + 50; useItem(_it.uid, false); return; }   // 🕒 手動瞬移後 5 秒內抑制自動瞬移/自動購買
    if (player.skills && player.skills.includes('sk_teleport')) {
        let _sk = DB.skills.sk_teleport;
        if (player.mp >= player.d.getMpCost(_sk.mp, _sk.tier)) { state._manualTpUntil = (state.ticks || 0) + 50; manualCast('sk_teleport'); return; }   // 🕒 手動瞬移後 5 秒內抑制自動瞬移/自動購買
    }
    logSys('<span class="text-slate-400">你尚未學會傳送術，也沒有瞬間移動卷軸。</span>');
}

// 隨機變身（套裝強制變身沿用同一函式：isDKSet→死亡騎士、isKurtSet→克特）
function getPolyState(isDKSet=false, isKurtSet=false) {
    if (isDKSet)   { let r = findPolyForm("死亡騎士"); return makePolyState(r.form, r.color); }
    if (isKurtSet) { let r = findPolyForm("克特");     return makePolyState(r.form, r.color); }
    let pool = polyRandomCandidates();
    let form = pool[Math.floor(Math.random() * pool.length)];
    let found = findPolyForm(form.n);
    return makePolyState(form, found ? found.color : getPolyTier(player.lv).color);
}

// 依名稱取得指定變身（變形控制戒指鎖定用）
function getPolyStateByName(name) {
    let r = findPolyForm(name);
    if (!r) return getPolyState();
    return makePolyState(r.form, r.color);
}

function applyPolyForce(stateObj) {
    player.poly = stateObj;
    player.buffs.poly = 1800;
}

// 將變身能力整理成統一格式（給選單顯示）：
// 攻擊間隔／施法速度（取攻擊施法間隔）／受擊硬直／移動速度；wlk=16 視為基準 100%。
function polyFormDesc(f) {
    let p = [];
    const fmtSec = v => Math.max(0, Number(v) || 0).toFixed(2);
    const movePct = (f.wlk != null && f.wlk > 0) ? Math.round(100 * 16 / f.wlk) : null;
    if (f.atkApm != null) {
        p.push(`攻擊間隔 ${fmtSec(60 / Math.max(1, f.atkApm))}秒`);
        if (f.castApm != null) p.push(`施法速度 ${fmtSec(60 / Math.max(1, f.castApm))}秒`);
        else if (f.cast != null) p.push(`施法速度 ${fmtSec(f.cast / 10)}秒`);
        if (f.stun != null) p.push(`受擊硬直 ${fmtSec(f.stun / 10)}秒`);
    } else if (f.shanna || f.trueShanna) {
        let s = f.trueShanna ? trueShannaSpeedForActor(player) : shannaSpeedForActor(player);   // 🧝 v3.5.21 真夏納：逐武器 APM 表不同·顯示邏輯共用
        if (s.apm != null) p.push(`攻擊間隔 ${fmtSec(60 / Math.max(1, s.apm))}秒`);
        p.push(`施法速度 ${fmtSec(60 / Math.max(1, f.castApm))}秒`);
        if (s.hitstun != null) p.push(`受擊硬直 ${fmtSec(s.hitstun / 10)}秒`);
        if (f.trueShanna && s.wlk) p.push(`移動速度 ${Math.round(100 * 16 / s.wlk)}%`);   // 走速依當前武器（單手劍 106%·其餘 100%）
    } else if (f.apm != null) {   // 🌑 v3.4.67 逐武器 APM 變身：顯示單手劍代表值（實際依當前武器·v3.5.9 用戶要求不顯示「依武器」字樣）
        p.push(`攻擊間隔 ${fmtSec(60 / Math.max(1, f.apm['單手劍'] || 60))}秒`);
        if (f.cast != null) p.push(`施法速度 ${fmtSec(f.cast / 10)}秒`);
        if (f.stun != null) p.push(`受擊硬直 ${fmtSec(f.stun / 10)}秒`);
    } else if (f.atk != null) {   // 🆕 v3.0.26 速度型變身：統一顯示攻擊／施法間隔、受擊硬直與移動速度（套裝變身另接傷害加成於後）
        p.push(`攻擊間隔 ${fmtSec(Math.round(f.atk * 6000 / 1440) / 100)}秒`);
        if (f.cast != null) p.push(`施法速度 ${fmtSec(f.cast / 10)}秒`);
        if (f.stun != null) p.push(`受擊硬直 ${fmtSec(f.stun / 10)}秒`);
    }
    if (movePct != null && !f.trueShanna) p.push(`移動速度 ${movePct}%`);   // 真夏納已於上方依當前武器顯示動態值
    if (f.shanna) p.push('保留原職業外觀');
    if (f.md)  p.push(`近距離傷害+${f.md}`);
    if (f.mh)  p.push(`近距離命中+${f.mh}`);
    if (f.rd)  p.push(`遠距離傷害+${f.rd}`);
    if (f.rh)  p.push(`遠距離命中+${f.rh}`);
    if (f.ed)  p.push(`額外傷害+${f.ed}`);
    if (f.eh)  p.push(`額外命中+${f.eh}`);
    if (f.mgd) p.push(`魔法傷害+${f.mgd}`);
    if (f.sp)  p.push(`額外魔法點數+${f.sp}`);
    if (f.mpr) p.push(`MP恢復+${f.mpr}`);
    if (f.ac)  p.push(`AC${f.ac}`);
    if (f.er)  p.push(`ER+${f.er}`);
    if (f.mr)  p.push(`MR+${f.mr}`);
    if (f.spd) p.push(`攻速+${f.spd}%`);
    return p.join('・');
}

// 變形控制戒指：手動使用時開啟「指定變身」選單
function openPolySelect(uid) {
    let modal = document.getElementById('poly-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'poly-modal';
        modal.className = 'hidden fixed inset-0 z-[60] flex items-center justify-center';
        modal.innerHTML =
            '<div class="absolute inset-0 bg-black/60" onclick="closePolyModal()"></div>' +
            '<div class="panel border-slate-500 p-5 relative w-[440px] max-h-[80vh] flex flex-col">' +
              '<div class="panel-header rounded-md mb-3">變形控制戒指 — 選擇變身</div>' +
              '<div id="poly-modal-list" class="flex flex-col gap-2 overflow-y-auto pr-1"></div>' +
              '<button class="btn mt-4" onclick="closePolyModal()">取消</button>' +
            '</div>';
        document.body.appendChild(modal);
    }
    let listEl = modal.querySelector('#poly-modal-list');
    // 🆕 v3.0.31 變形控制戒指：可選「自己等級（含）以下」全部變身（不再限於當前等級帶）；高等在前、同等依攻擊快慢
    let avail = [];
    for (const t of POLY_TIERS) for (const f of t.forms) {
        if (player.lv >= f.lv && polyFormMatchesEquippedWeapon(f)) avail.push({ f, color: t.color });
    }
    if (hasPolyRing()) for (const f of CONTROL_ONLY_POLY_FORMS) {
        if (player.lv >= f.lv && polyFormMatchesEquippedWeapon(f)) avail.push({ f, color: f.c || "text-yellow-400" });
    }
    avail.sort((a, b) => (b.f.lv - a.f.lv) || ((a.f.atk || 0) - (b.f.atk || 0)) || a.f.n.localeCompare(b.f.n, 'zh-Hant'));
    listEl.innerHTML = avail.map(({ f, color }) =>
        '<button class="btn text-left !py-2 !px-3" onclick="confirmPolySelect(\'' + uid + '\',\'' + f.n + '\')">' +
            '<span class="' + color + ' font-bold"><span class="text-slate-400 text-xs mr-1">Lv' + f.lv + '</span>' + f.n + '</span>' +
            '<span class="text-slate-400 text-xs block mt-0.5">' + polyFormDesc(f) + '</span>' +
        '</button>'
    ).join('');
    modal.classList.remove('hidden');
}
function closePolyModal() {
    let m = document.getElementById('poly-modal');
    if (m) m.classList.add('hidden');
}
// 玩家在選單中選定變身：套用、鎖定、消耗卷軸
function confirmPolySelect(uid, name) {
    let item = player.inv.find(i => i.uid === uid);
    if (!item) { closePolyModal(); return; }
    let found = findPolyForm(name);
    if (!found || player.lv < found.form.lv || (found.form.controlOnly && !hasPolyRing()) || !polyFormMatchesEquippedWeapon(found.form)) {
        logSys(`<span class="text-red-300">目前裝備的武器無法使用此變身。</span>`);
        closePolyModal();
        return;
    }
    let st = getPolyStateByName(name);
    player.poly = st;                             // 設為當前變身；之後自動使用會維持此狀態
    player.buffs.poly = DB.items[item.id].dur;
    logSys(`使用變形卷軸（指定），變身為 <span class="${st.c}">${st.n}</span>。`);
    consume(item);
    calcStats();
    closePolyModal();
    if (document.getElementById('item-modal').classList.contains('hidden') === false) closeModal();
    updateUI();
}

// ===== 🏛️ 底比斯·上鎖的歐西里斯寶箱：開啟（選擇數量，每個消耗 1 顆 龜裂之核，依機率獲得寶物；機率合計 100%＝每開 1 個必得 1 件） =====
const OSIRIS_BOX_BASIC = [
    ['wpn_thebes_2hsword', 0.25], ['wpn_thebes_dual', 0.25], ['wpn_thebes_bow', 0.25], ['wpn_thebes_wand', 0.25],
    ['scroll_weapon', 3], ['scroll_armor', 4],
    ['new_item_151', 15], ['new_item_154', 15], ['new_item_160', 15], ['new_item_157', 15],
    ['new_item_152', 8], ['new_item_155', 8], ['new_item_158', 8], ['new_item_161', 8]
];
const OSIRIS_BOX_HIGH = [
    ['wpn_thebes_2hsword', 0.75], ['wpn_thebes_dual', 0.75], ['wpn_thebes_bow', 0.75], ['wpn_thebes_wand', 0.75],
    ['scroll_weapon', 4], ['scroll_armor', 5],
    ['new_item_151', 14], ['new_item_154', 14], ['new_item_160', 14], ['new_item_157', 14],
    ['new_item_152', 8], ['new_item_155', 8], ['new_item_158', 8], ['new_item_161', 8]
];
// 🐍 提卡爾 庫庫爾坎寶箱：4 傳說裝(初級 0.25%/高級 0.75%)＋卷軸＋寶石（結構同歐西里斯寶箱）
const KUKULKAN_BOX_BASIC = [
    ['wpn_kukulkan_spear', 0.25], ['wpn_kukulkan_gauntlet', 0.25], ['shd_kukulkan', 0.25], ['hlm_kukulkan', 0.25],
    ['scroll_weapon', 3], ['scroll_armor', 4],
    ['new_item_151', 15], ['new_item_154', 15], ['new_item_160', 15], ['new_item_157', 15],
    ['new_item_152', 8], ['new_item_155', 8], ['new_item_158', 8], ['new_item_161', 8]
];
const KUKULKAN_BOX_HIGH = [
    ['wpn_kukulkan_spear', 0.75], ['wpn_kukulkan_gauntlet', 0.75], ['shd_kukulkan', 0.75], ['hlm_kukulkan', 0.75],
    ['scroll_weapon', 4], ['scroll_armor', 5],
    ['new_item_151', 14], ['new_item_154', 14], ['new_item_160', 14], ['new_item_157', 14],
    ['new_item_152', 8], ['new_item_155', 8], ['new_item_158', 8], ['new_item_161', 8]
];
const BOX_LOOT_BY_ID = { item_osiris_box_basic: OSIRIS_BOX_BASIC, item_osiris_box_high: OSIRIS_BOX_HIGH, item_kukulkan_box_basic: KUKULKAN_BOX_BASIC, item_kukulkan_box_high: KUKULKAN_BOX_HIGH };
function osirisBoxRoll(table) {
    let total = 0; for (let e of table) total += e[1];   // 總權重（一般情況=100）
    let r = lootRng('osiris') * total, acc = 0;   // 🎲 committed RNG（防 SL 重抽歐西里斯寶箱開到哪件）
    for (let e of table) { acc += e[1]; if (r < acc) return e[0]; }
    return table[table.length - 1][0];
}
function playerCoreCount() { return player.inv.filter(i => i.id === 'mat_crack_core').reduce((s, i) => s + (i.cnt || 0), 0); }
function openOsirisBox(uid) {
    let item = player.inv.find(i => i.uid === uid);
    if (!item) return;
    let d = DB.items[item.id]; if (!d) return;
    let coreCnt = playerCoreCount();
    if (coreCnt < 1) { logSys('<span class="text-red-400">缺少 龜裂之核：開啟歐西里斯寶箱每個需消耗 1 顆 龜裂之核（希培利亞・巴特爾可用時空裂痕碎片×100 製作）。</span>'); return; }
    let maxN = Math.min(item.cnt || 1, coreCnt);
    let modal = document.getElementById('osiris-box-modal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'osiris-box-modal'; modal.className = 'hidden fixed inset-0 z-[60] flex items-center justify-center'; document.body.appendChild(modal); }
    modal.innerHTML =
        '<div class="absolute inset-0 bg-black/60" onclick="closeOsirisBoxModal()"></div>' +
        '<div class="panel border-amber-500 p-5 relative w-[420px] flex flex-col">' +
          `<div class="panel-header rounded-md mb-3">${d.n} — 選擇開啟數量</div>` +
          `<div class="text-sm text-slate-300 mb-3">每開啟 1 個消耗 <span class="text-amber-300">1 顆 龜裂之核</span>。<br>持有寶箱 <span class="text-amber-300">${item.cnt || 1}</span> 個、龜裂之核 <span class="text-amber-300">${coreCnt}</span> 顆，最多可開啟 <span class="text-amber-300">${maxN}</span> 個。</div>` +
          `<input id="osiris-box-qty" type="number" min="1" max="${maxN}" value="${maxN}" class="w-full mb-3 px-2 py-1 rounded bg-slate-800 border border-slate-600 text-center text-lg">` +
          `<div class="flex gap-2"><button class="btn flex-1 bg-amber-800 hover:bg-amber-700 font-bold" onclick="confirmOsirisBox('${uid}')">開啟</button><button class="btn flex-1" onclick="closeOsirisBoxModal()">取消</button></div>` +
        '</div>';
    modal.classList.remove('hidden');
    if (!document.getElementById('item-modal').classList.contains('hidden')) closeModal();
}
function confirmOsirisBox(uid) {
    let inp = document.getElementById('osiris-box-qty');
    let n = Math.max(1, parseInt(inp && inp.value) || 1);
    doOpenOsirisBox(uid, n);
}
function closeOsirisBoxModal() { let m = document.getElementById('osiris-box-modal'); if (m) m.classList.add('hidden'); }
function doOpenOsirisBox(uid, n) {
    let item = player.inv.find(i => i.uid === uid);
    if (!item) { closeOsirisBoxModal(); return; }
    let d = DB.items[item.id];
    let table = BOX_LOOT_BY_ID[item.id] || ((d.boxTier === 'high') ? OSIRIS_BOX_HIGH : OSIRIS_BOX_BASIC);   // 🐍 依寶箱 id 選 loot 表（歐西里斯/庫庫爾坎），未列則回退 boxTier
    n = Math.max(1, Math.floor(n));
    let opened = 0, gained = {};
    let _svTrad = _tradLootCtx; _tradLootCtx = true;   // 🏛️ 傳統模式：寶箱開出的底比斯裝備比照掉落/製作，自帶隨機強化值（gainItem 內 traditionalActive() 閘·非傳統恆 +0；強化值走 committed lootRng 防 SL）
    try {
        for (let k = 0; k < n; k++) {
            if ((item.cnt || 0) < 1) break;
            let core = player.inv.find(i => i.id === 'mat_crack_core' && (i.cnt || 0) > 0);
            if (!core) break;   // 龜裂之核 用罄
            core.cnt--; if (core.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== core.uid);
            item.cnt--;          // 消耗 1 寶箱（迴圈結束後統一清除空堆疊）
            let rw = osirisBoxRoll(table);
            gainItem(rw, 1);
            gained[rw] = (gained[rw] || 0) + 1;
            opened++;
        }
    } finally { _tradLootCtx = _svTrad; }   // try/finally：例外也必還原，杜絕上下文殘留洩漏
    if ((item.cnt || 0) <= 0) player.inv = player.inv.filter(i => i.uid !== item.uid);
    if (opened > 0) {
        let parts = Object.keys(gained).map(id => `${DB.items[id] ? DB.items[id].n : id}×${gained[id]}`);
        logSys(`<span class="text-amber-300 font-bold">開啟了 ${opened} 個 ${d.n}：</span>${parts.join('、')}`);
    } else {
        logSys('<span class="text-red-400">沒有足夠的 龜裂之核 或寶箱，未能開啟。</span>');
    }
    renderTabs(true); updateUI(); saveGame();
    closeOsirisBoxModal();
}

// 主迴圈：依「真實經過的時間」補跑對應數量的邏輯 tick。
// 這樣即使分頁切到背景被瀏覽器降速、或機器卡頓導致 setInterval 延遲，
// 遊戲時間仍會以正確速率前進（回到分頁時自動快轉補上落後的進度）。
