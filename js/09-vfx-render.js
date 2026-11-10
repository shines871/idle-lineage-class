// ===== ✨ 戰鬥特效層 VFX（cosmetic-only：傷害數字／擊殺粒子／受擊震動。不改任何遊戲數值，全程 try/catch，壞掉也不影響遊戲。__vfxOff=true 可關閉） =====
let _vfxPending = [];
// 清場必須同步停止瞬時特效，不能等背景分頁被節流的 timer 自行結束。
const _vfxCleanups = new Set();
const _vfxCssEffects = new WeakMap();
function _vfxTrackCleanup(dispose) {
    let active = true;
    let cleanup = () => {
        if (!active) return;
        active = false;
        _vfxCleanups.delete(cleanup);
        dispose();
    };
    _vfxCleanups.add(cleanup);
    return cleanup;
}
function _vfxTimeout(fn, delay) {
    let timer = null;
    let cancel = _vfxTrackCleanup(() => clearTimeout(timer));
    timer = setTimeout(() => {
        if (!_vfxCleanups.has(cancel)) return;
        cancel();
        fn();
    }, delay);
    return cancel;
}
function _vfxRestartCss(el, className, animationName) {
    if (!el) return;
    let effects = _vfxCssEffects.get(el);
    if (!effects) { effects = Object.create(null); _vfxCssEffects.set(el, effects); }
    if (effects[className]) effects[className]();
    let onEnd = event => { if (event.target === el && event.animationName === animationName) cleanup(); };
    let cleanup = _vfxTrackCleanup(() => {
        el.removeEventListener('animationend', onEnd);
        el.classList.remove(className);
        if (effects[className] === cleanup) delete effects[className];
    });
    effects[className] = cleanup;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    el.addEventListener('animationend', onEnd);
}
let _vfxLastKillRect = null;   // 最近一次擊殺的怪物格螢幕位置（供稀有掉落閃光定位）
let _mobRenderCache = null;    // 🚀 怪物列差異更新快取：{ ml節點, structKey, slots:[每格html字串] }→只重建有變動的格子，免每幀整列 innerHTML 重建
const _VFX_ELE_COLOR = { fire:'#ff7a45', water:'#4fc3f7', wind:'#9ccc65', earth:'#d8a657', magic:'#ce93d8', normal:'#f1f5f9' };
// ✨ 適合投射動畫的「非屬性」攻擊技能（屬性魔法已自動涵蓋）：技能id→投射外觀(屬性色 or 'axe'=旋轉金屬斧)
const _VFX_PROJECTILE_SKILLS = { sk_illu_mindbreak:'magic' };   // 戰斧投擲是「下一擊」增益→改在攻擊觸發處射斧，不走 cast 樞紐；🏹 v3.2.14 三重矢移除：改在 js/07 命中迴圈射 3 支箭矢序列幀投射物(playArrowFx·快速連發)·不再播 CSS 風彈；✨ v3.2.15 究極光裂移除（用戶明令無 CSS）：本就被下方 SPELL_FX 閘擋住(有三層動態特效)＝死碼·顯式移除防日後 key 改名時 CSS 光彈偷跑回來；✨ v3.5.87 光箭移除：同究極光裂被 SPELL_FX 閘無條件擋住＝死碼
function _vfxLayer() {
    // 🎚️ v3.0.73 vfx 圖層改掛進 #app-stage（與 item-modal/收集冊/浮動裝備視窗/浮動倉庫 同一 stacking context）→ 其 z-index(35) 才排得進這些 UI(z45~72)之下；先前掛 document.body(root context)時 z-index:45 正值恆蓋在 #app-stage(position:fixed→自成 context·z-auto)之上，使死亡殘影蓋掉所有 UID。#app-stage 為 position:fixed 且無 transform/filter→其 position:fixed 子層仍以「視窗」為容器塊(getBoundingClientRect 螢幕座標定位不變)。
    let host = document.getElementById('app-stage') || document.body;
    let l = document.getElementById('vfx-layer');
    if (!l) { l = document.createElement('div'); l.id = 'vfx-layer'; host.appendChild(l); }
    else if (l.parentElement !== host) host.appendChild(l);   // 舊狀態若曾掛 body→搬進 app-stage
    return l;
}
function _vfxClearAll() {   // 🎚️ v3.0.73 換地圖/回城即清空狩獵區殘留特效（死亡殘影 vfx-ghost／法術 vfx-spell／冰凍／怪技能特效）→上一張地圖尚在播放的死亡動畫不會殘留、蓋到村莊或新地圖介面。冰凍/怪技能追蹤 dict 一併清鍵避免孤兒元素。
    for (let cleanup of Array.from(_vfxCleanups)) { try { cleanup(); } catch (e) {} }
    _vfxPending = [];
    _vfxLastKillRect = null;
    try {
        let l = document.getElementById('vfx-layer');
        if (l) {
            if (l.getAnimations) for (let animation of l.getAnimations({ subtree: true })) animation.cancel();
            while (l.firstChild) l.removeChild(l.firstChild);
        }
    } catch (e) {}
    try { if (typeof _freezeFx !== 'undefined' && _freezeFx) for (let k in _freezeFx) delete _freezeFx[k]; } catch (e) {}
    try { if (typeof _mobSkillFx !== 'undefined' && _mobSkillFx) for (let k in _mobSkillFx) delete _mobSkillFx[k]; } catch (e) {}
}
// ===== ⚡ 法術特效疊加層（v2.7.15）：技能命中時於目標怪身上疊播天堂原版法術特效序列幀（一次性·加亮混合 screen·純視覺不影響任何數值·吃 __vfxOff 開關）=====
//   幀來源：assets/fx/<dir>/<prefix>_0.png..N.png（spr2png 單檔轉·gfx 對照 list.spr·10-0.spr=lightning gfx10）。
//   SPELL_FX：技能顯示名(sk.n) → { dir 資料夾, prefix 檔名前綴, n 幀數, fps, blend, h=特效高度為目標圖高的倍數, ax/ay=特效「打擊錨點」在特效圖內的比例(閃電 origin≈底部中央) }。
//   ⚠️ 新增特效：轉檔丟 assets/fx/<名>/ + 這裡加一行；掛點在 js/07 castSkillInner 逐目標迴圈(通用·只有註冊者會播)。
//   SPELL_FX 欄位：{ dir, prefix, n幀, fps, blend(選·如 screen 加亮), ax/ay=特效內「打擊錨點」比例,
//     尺寸/行為三選一：proj=飛行投射物型(冰箭/火箭/光箭/風刃/冰錐/冰矛圍籬)→(a)尺寸=「原生像素 × 怪物顯示縮放」(對等大小·nw/nh=原生像素·首播未解碼後備)＋(b)v3.0.5 由施法者(戰鬥區底部中央)飛向目標命中點·途中循環幀·抵達消失／h=特效高度為目標圖高倍數(範圍型如落雷·原地疊播)／w=特效寬度為目標圖寬倍數(地面型如地裂術·寬≈怪寬·原地)，h/w 另一維依原始比例推導；
//     targetVc(選·覆寫目標垂直錨點·地面型特效設近腳底如0.92), shadowPrefix(選·特效自身影子層檔名前綴·疊在特效下·同畫布同步) }。
// 🎯 v3.0.21 法術特效固定尺寸（用戶：不管怪物大小都維持固定大小·相當於現在對「妖魔鬥士」施放）：
//   唯一基準＝固定戰鬥框「影像帶高」r.height（實測全怪恆 112px @1080p·隨舞台等比縮放·與怪身高/寬完全無關）。
//   移除原「proj 讀目標怪 body 顯示縮放 / w驅動讀目標怪內框寬」的隨怪變動 → 改由帶高推導。
//   基準值@妖魔鬥士（帶高112）：proj 顯示縮放 mScale=1.095；w驅動 內框寬=105。h驅動本就用帶高＝早已固定不變。
const SPELL_FX_REF_MSCALE_K = 1.095 / 112;   // proj: mScale = refH × 此（帶高112→1.095·與妖魔鬥士當前一致）
const SPELL_FX_REF_W_K = 105 / 112;          // w驅動: 基準寬 = refH × 此（帶高112→105）
// 📏 v3.3.13 帶高基準正規化：v3.2.80 站立帶鎖 242 時「舊 242＝battle-view 含 p-4→內容 210」→新純帶 242 使 .mob-img-inner 由調校基準 112 默默長到 144(@舞台1:1)
//    → 凡以「內框高 r.height」推導尺寸的特效(SPELL_FX 三模式/FREEZE_FX/怪技能非錨定)全被放大 1.286×。
//    正規化＝由 #mob-list 帶高(area-fit 恆 242 css×舞台縮放)推回 112 基準＝真正「與怪無關、只隨舞台等比」(v3.0.21 拍板)·順帶消除靜態 boss-zoom rect(×1.78) 對特效的誤放大；帶不可量→退傳入 rect 高(非 area-fit 舊版面維持原行為)。
function _fxBandRefH(fallbackH) {
    try { let ml = document.getElementById('mob-list'); let h = ml ? ml.getBoundingClientRect().height : 0; if (h > 0) return h * (112 / 242); } catch (e) {}
    return fallbackH;
}
const SPELL_FX = {
    '光箭': { dir:'光箭', dirPrefix:'167-', dirs:4, n:4, fps:12, blend:'screen', proj:true, nw:32, nh:40, ax:0.50, ay:0.50 },
    '冰矛圍籬': { dir:'冰矛圍籬', dirPrefix:'756-', dirs:8, n:4, fps:12, blend:'screen', proj:true, nw:49, nh:44, ax:0.50, ay:0.50 },
    '冰箭': { dir:'冰箭', dirPrefix:'1797-', dirs:8, n:4, fps:12, blend:'screen', proj:true, nw:15, nh:21, ax:0.50, ay:0.50 },
    '冰錐': { dir:'冰錐', dirPrefix:'1809-', dirs:8, n:3, fps:12, blend:'screen', proj:true, nw:35, nh:59, ax:0.50, ay:0.50 },
    // ❄️ v3.7.43 冰裂術（蕾雅魔杖 meleeHitSpell 命中觸發）：gfx3685 主體＋gfx3686 影子·各 8 方向（依施法者→目標角度選向·主體與影子同向）。
    //    ⚠️冰塊＝不透明實體型：轉檔不加 --luma-alpha、不套 screen（比照 地裂術／冰凍狀態；套了會讓碎冰半透明褪色）。
    //    ax/ay＝spr 世界原點在畫布內的比例（106×96 原點 27,71）→碎冰正確落在打擊點。
    '冰裂術': { dir:'冰裂術', dirPrefix:'3685-', shadowDirPrefix:'3686-', dirs:8, n:13, fps:16, w:0.85, ax:0.255, ay:0.740, targetVc:0.90 },
    '冰雪暴': { dir:'冰雪暴', prefix:'757-0', n:23, fps:16, blend:'screen', h:1.35, ax:0.50, ay:0.55 },
    '吸血鬼之吻': { dir:'吸血鬼之吻', dirPrefix:'236-', dirs:8, n:6, fps:12, blend:'screen', proj:true, nw:63, nh:96, ax:0.50, ay:0.50 },
    '呼喚盟友': { dir:'呼喚盟友', prefix:'2281-0', n:7, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '地獄之牙': { dir:'地獄之牙', prefix:'1801-0', n:9, fps:14, blend:'screen', h:0.7, ax:0.50, ay:0.55 },
    // 🔥 v3.7.46 地獄火（死亡騎士的烈炎之劍 spellProc 3%+強化1%·AoE）：用戶指定套「死亡騎士技能特效」→ 直接複用
    //    大地崩裂已部署的同一組幀（assets/fx/大地崩裂/dk_0..8＝死亡騎士 skill_effect_start8+end1），dir 指同資料夾不另存圖檔
    //    （比照 光箭→冰箭、爆裂的火球→燃燒的火球 的複用先例）。
    '地獄火': { dir:'大地崩裂', prefix:'dk', n:9, fps:14, w:0.95, ax:0.50, ay:0.68, targetVc:0.85, blend:'screen' },
    '地裂術': { dir:'地裂術', prefix:'129-1', n:10, fps:14, w:0.85, ax:0.50, ay:0.82, targetVc:0.92 },
    '污濁之水': { dir:'污濁之水', prefix:'mw', n:10, fps:12, h:1.1, ax:0.50, ay:0.55 },
    '復仇尖石': { dir:'地裂術', prefix:'129-1', n:10, fps:14, w:0.85, ax:0.50, ay:0.82, targetVc:0.92 },   // 🗡️ v3.4.34 倫得雙刀 5% proc（sk_revenge_spike）：沿用地裂術素材（同 dir·不需新增圖檔）
    '大地崩裂': { dir:'大地崩裂', prefix:'dk', n:9, fps:14, w:0.95, ax:0.50, ay:0.68, targetVc:0.85, blend:'screen' },   // 🌑 v3.4.68 冥皇執行劍(解咒) 15% proc（sk_earth_collapse·8D12地全體）：套死亡騎士技能特效（skill_effect_start8+end1·複製至 assets/fx/大地崩裂/dk_0..8·screen 加亮）
    '煉獄火': { dir:'大地崩裂', prefix:'dk', n:9, fps:14, w:0.95, ax:0.50, ay:0.68, targetVc:0.85, blend:'screen' },   // 🔥 v3.7.52 烈焰的死亡騎士之劍 25% proc：套死亡騎士技能特效（同 地獄火/大地崩裂 借用 dk 幀）
    '地面障礙': { dir:'地面障礙', prefix:'2250-0', n:13, fps:14, blend:'screen', w:0.9, ax:0.50, ay:0.82, targetVc:0.9 },
    '壞物術': { dir:'壞物術', prefix:'172-0', n:15, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '寒冰氣息': { dir:'寒冰氣息', prefix:'1804-0', n:21, fps:16, blend:'screen', h:1.2, ax:0.50, ay:0.55 },
    // 🧊 v3.7.43 寒冰尖刺（遺物 古代法師的隨手小抄 grantSkills·sk_frost_spike）：gfx3687 冰刺＋gfx3688 地面影子（單向·無方向組）。同為實體型→不 luma、不 screen。
    '寒冰尖刺': { dir:'寒冰尖刺', prefix:'3687-0', shadowPrefix:'3688-0', n:12, fps:14, w:0.95, ax:0.366, ay:0.651, targetVc:0.90 },
    '寒冷戰慄': { dir:'寒冷戰慄', dirPrefix:'252-', dirs:8, n:6, fps:12, blend:'screen', proj:true, nw:63, nh:96, ax:0.50, ay:0.50 },
    '封印禁地': { dir:'封印禁地', prefix:'2241-0', n:13, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '岩牢': { dir:'岩牢', prefix:'1805-0', n:17, fps:14, blend:'screen', h:1.2, ax:0.50, ay:0.55 },
    '弱化術': { dir:'弱化術', prefix:'2228-0', n:9, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '會心一擊': { dir:'會心一擊', prefix:'2952-0', n:16, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '木乃伊的詛咒': { dir:'木乃伊的詛咒', prefix:'746-0', n:8, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '極光雷電': { dir:'極光雷電', dirPrefix:'170-', dirs:8, n:6, fps:12, blend:'screen', proj:true, nw:122, nh:255, projScale:0.5, ax:0.50, ay:0.50 },
    '極道落雷': { dir:'極道落雷', prefix:'10-0', n:6, fps:14, blend:'screen', h:2, ax:0.50, ay:0.98 },
    // ⚡ v3.7.52 審判落雷（遺物 克特之盾＋克特之劍·極道落雷升級版）：gfx7004 12幀單向·雷擊發光型→screen；錨點=spr 世界原點(135,198)=落雷著地點
    '審判落雷': { dir:'審判落雷', prefix:'jl', n:12, fps:14, blend:'screen', h:2, ax:0.413, ay:0.762 },
    // ⚡ v3.7.92 致命落雷（sk_holy_lightning·聖晶魔杖 procSkill）：沿用審判落雷的同一組幀，dir 指同資料夾不另存圖檔。
    //   走 procFreeMagicSkill → playSpellFx(sk.n, t)，查表鍵＝技能顯示名，故此處鍵名必須與 DB.skills.sk_holy_lightning.n 完全一致。
    '致命落雷': { dir:'審判落雷', prefix:'jl', n:12, fps:14, blend:'screen', h:2, ax:0.413, ay:0.762 },
    '毒咒': { dir:'毒咒', prefix:'745-0', n:8, fps:14, blend:'screen', h:0.8, ax:0.50, ay:0.55 },
    '沉睡之霧': { dir:'沉睡之霧', prefix:'760-0', n:21, fps:16, blend:'screen', h:0.9, ax:0.50, ay:0.55 },
    '流星雨': { dir:'流星雨', prefix:'762-0', n:20, fps:16, blend:'screen', h:1.9, ax:0.50, ay:0.88 },
    '火箭': { dir:'火箭', dirPrefix:'1583-', dirs:4, n:4, fps:12, blend:'screen', proj:true, nw:31, nh:40, ax:0.50, ay:0.50 },
    '火風暴': { dir:'火風暴', prefix:'1819-0', n:14, fps:14, blend:'screen', h:1.3, ax:0.50, ay:0.55 },
    '烈炎術': { dir:'烈炎術', prefix:'1811-0', n:19, fps:16, blend:'screen', h:1.2, ax:0.50, ay:0.55 },
    // 🔥 v3.7.44 熾焰地裂術（遺物 解除封印的巴風特魔杖 procDualSkill 25%）：gfx1783 八方向·發光型→luma＋screen。
    //    ⚠️此素材原生是「以施法者為原點、往目標方向一格外噴發」（實測 8 向內容偏移隨方向旋轉 ±66px），
    //    照 spr 世界原點錨定會讓火焰落在怪旁邊 → 改「每方向獨立轉檔＋tools/fx-crop.js 裁到有效內容」，
    //    再以內容中心(ax/ay 0.5/0.8)錨定，火焰恆落在目標身上、方向只影響外觀傾向。
    '熾焰地裂術': { dir:'熾焰地裂術', dirPrefix:'1783-', dirs:8, n:9, fps:14, blend:'screen', w:1.0, ax:0.50, ay:0.80, targetVc:0.88 },
    '燃燒的火球': { dir:'燃燒的火球', dirPrefix:'171-', dirs:8, n:5, fps:12, blend:'screen', proj:true, nw:43, nh:49, ax:0.50, ay:0.50 },
    '爆裂的火球': { dir:'燃燒的火球', dirPrefix:'171-', dirs:8, n:5, fps:12, blend:'screen', proj:true, nw:43, nh:49, ax:0.50, ay:0.50 },   // 🏺 遺物 爆裂的火球：沿用燃燒的火球 VFX（同 sprite 目錄）
    '疾病術': { dir:'疾病術', prefix:'2230-0', n:11, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '究極光裂術': { dir:'究極光裂術', prefix:'1815-0', layers:['1816-0', '1817-0'], n:21, fps:16, blend:'screen', h:1.9, ax:0.50, ay:0.85 },
    '緩速術': { dir:'緩速術', prefix:'752-0', n:8, fps:14, blend:'screen', h:0.85, ax:0.50, ay:0.55 },
    '衝擊之暈': { dir:'衝擊之暈', prefix:'4434-0', n:6, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '起死回生術': { dir:'起死回生術', prefix:'754-0', n:21, fps:16, blend:'screen', h:1.3, ax:0.50, ay:0.55 },
    '迷魅術': { dir:'迷魅術', prefix:'228-0', n:7, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '闇盲咒術': { dir:'闇盲咒術', prefix:'746-0', n:8, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '雷霆風暴': { dir:'雷霆風暴', prefix:'3924-0', n:13, fps:14, blend:'screen', h:1.3, ax:0.50, ay:0.55 },
    '震裂術': { dir:'震裂術', prefix:'1812-0', n:16, fps:14, blend:'screen', h:1.25, ax:0.50, ay:0.6 },
    '風刃': { dir:'風刃', prefix:'1799-0', n:5, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '魔法封印': { dir:'魔法封印', prefix:'2177-0', n:17, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '魔法消除': { dir:'魔法消除', prefix:'2181-0', n:19, fps:16, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '黑闇之影': { dir:'黑闇之影', prefix:'2175-0', n:8, fps:14, blend:'screen', h:1, ax:0.50, ay:0.55 },
    '龍捲風': { dir:'龍捲風', prefix:'758-0', n:20, fps:16, h:1.5, ax:0.50, ay:0.82, targetVc:0.9 },   // 🌪️ v3.4.1 補回註冊（v2.7.39 曾註冊·v3.0.101 全量重生時漏列＝施放無動畫）·幾何沿 v2.7.39 拍板「自腳底」·幀重轉原色 20 幀（原部署 luma 淡化版已替換）·塵土實體不加 screen（比照地裂術）
    // 🔮 保留：能量感測(byEle 屬性變體·手動 sense 掛點)
    '能量感測':   { dir: '能量感測',   n: 8, fps: 12, blend: 'screen', h: 0.85, ax: 0.50, ay: 0.55,
                    byEle: { fire: { prefix: '火' }, water: { prefix: '水' }, earth: { prefix: '地' }, wind: { prefix: '風' } } },
};
let _spellFxCache = {};    // dir/prefix → [Image]（預載·避免首播閃爍）
let _spellFxActive = {};   // fxKey(技能名|目標uid|施法者) → cleanup：同目標同特效同時只保留一個
function _preloadFxFrames(dir, prefix, n) {
    let key = dir + '/' + prefix;
    if (_spellFxCache[key]) return _spellFxCache[key];
    let arr = [];
    for (let i = 0; i < n; i++) { let im = new Image(); im.src = 'assets/fx/' + encodeURIComponent(dir) + '/' + prefix + '_' + i + '.png'; arr.push(im); }
    _spellFxCache[key] = arr;
    return arr;
}
// 🎯 方向型投射物選向：天堂 spr 方向索引（順時針·1=N 2=NE 3=E 4=SE 5=S 6=SW 7=W 0=NW）。
//   base＝依「施法者→目標」角度算出的 45°分格（0=正上·順時針）。回 { idx=要用的 spr 方向索引, flip=水平鏡射 }。
//   8向：全原生（idx=(base+1)%8）。4向：僅存 N/NE/E（idx 1/2/3）·左側(NW/W)用鏡射；投射物恆朝上→下半球(SE/S/SW)不會發生。
function _pickFxDir(dirs, base) {
    if (dirs >= 8) return { idx: (base + 1) % 8, flip: false };
    let T = { 0: { idx: 1, flip: false }, 1: { idx: 2, flip: false }, 2: { idx: 3, flip: false }, 3: { idx: 3, flip: false }, 4: { idx: 1, flip: false }, 5: { idx: 3, flip: true }, 6: { idx: 3, flip: true }, 7: { idx: 2, flip: true } };
    return T[base] || { idx: 1, flip: false };
}
// 🧊 v2.7.46 死亡特效(death_effect) registry＋預載：怪名→{n幀, ew/eh 特效畫布尺寸, anchored:{ox,oy,bw,bh}}。frames 在 assets/anim/<怪名>/death_effect_N.png(隨本體部署·非 fx 夾)。死亡時(vfxKill)獨立時間軸疊播(可比 body death 長)。
const MOB_ANIM_DEATH_FX = {
    '冰之女王侍女': { n: 25, ew: 158, eh: 115, anchored: { ox: -26, oy: 10, bw: 101, bh: 114 } },
};   // v3.0.13 冰之女王新版動畫無 death_effect→移除(死亡改由 21 幀 death_ 序列本身表現)
let _deathFxCache = {};
// 🎬 v3.4.43 死亡序列殘影「專屬節流計數」：同時存在的死亡殘影數。與傷害數字/粒子洪水解耦——
//   原本用 layer.childElementCount<150 判斷會被跳字/法術粒子洪水誤擋，AoE 連殺時死亡幀「有時不播」。
//   改看此獨立計數（上限 12≈前後排 5 格 × 2 波重疊 + 餘裕），正常必定播完，只有病態重疊才擋。
let _deathGhostCount = 0;
function _preloadDeathFx(name, n) {
    if (_deathFxCache[name]) return _deathFxCache[name];
    let arr = [];
    for (let i = 0; i < n; i++) { let im = new Image(); im.src = 'assets/anim/' + encodeURIComponent(name) + '/death_effect_' + i + '.png'; arr.push(im); }
    _deathFxCache[name] = arr;
    return arr;
}
// ⚡ 在目標怪身上疊播一輪法術特效。skn=技能顯示名（須在 SPELL_FX 註冊·未註冊者靜默略過）；caster 可傳傭兵以決定方向與投射物起點。
//    v2.7.16：立即渲染（不再等 first.load）＋ _spellFxActive[技能名|uid] 去重（修「一次顯示兩個／忽多忽少」）。
//    v2.7.18：支援 shadowPrefix→特效自身影子層（疊在特效下·同畫布同步·如地裂術地面裂痕）；targetVc→地面型錨點下移。
// 🚀 v3.2.65 一次性戰鬥特效總閘：關特效(__vfxOff) 或 背景補跑期間(state.ff) 皆略過生成——避免切分頁/縮小回來時，
//   累積的 tick 在回到前景瞬間「爆量播放」戰鬥動畫（箭矢/法術特效/擊殺粒子等一次性 VFX 是同步/延遲排程於 tick 內觸發，故須在入口擋）。
// 🌙 v3.6.03 掛網記憶體：分頁隱藏(document.hidden)也視同靜音——背景分頁 CSS 動畫不推進(animationend 不觸發)、
//    WAAPI onfinish 暫停、保險 setTimeout 被 Chrome 節流到每分鐘 1 次 → 特效元素「只進不出」越積越多。
//    隱藏時本來就看不見，跳過生成對特效表現零影響；配合檔尾 visibilitychange→_vfxClearAll() 立即釋放已存在的。
function _vfxMute() { return !!(window.__vfxOff || (typeof document !== 'undefined' && document.hidden) || (typeof state !== 'undefined' && state.ff)); }
function playSpellFx(skn, mob, caster) {
    let cleanup = null;
    try {
        if (_vfxMute() || !mob) return;
        let cfg = SPELL_FX[skn]; if (!cfg) return;
        // 🔮 v2.7.44 屬性變體(cfg.byEle)：依「目標怪屬性 mob.e」選對應幀組(如能量感測 火/水/地/風)·目標無對應屬性(none等)→靜默不播
        if (cfg.byEle) { let _v = cfg.byEle[mob.e]; if (!_v) return; cfg = Object.assign({}, cfg, _v); }
        let _casterKey = caster && caster !== player ? ('ally:' + String(caster._slot || caster.enSeed || 'unknown')) : 'player';
        let fxKey = skn + '|' + mob.uid + '|' + _casterKey;
        if (_spellFxActive[fxKey]) return;   // 🔒 該目標的此特效還在播 → 不疊第二個
        let ml = document.getElementById('mob-list');
        let slot = ml && ml.querySelector('.mob-target[data-uid="' + mob.uid + '"]');
        if (!slot) return;
        let box = slot.querySelector('.mob-img-inner') || slot.querySelector('.mob-img-wrap') || slot;
        let r = box.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return;
        let layer = _vfxLayer();
        if (layer.childElementCount > 220) return;   // 洗版保護
        let nodes = [], timer = null, frame = null;
        cleanup = _vfxTrackCleanup(() => {
            if (timer !== null) clearInterval(timer);
            if (frame !== null) cancelAnimationFrame(frame);
            nodes.forEach(el => el.remove());
            if (_spellFxActive[fxKey] === cleanup) delete _spellFxActive[fxKey];
        });
        _spellFxActive[fxKey] = cleanup;
        let _mobImg = box.querySelector('img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)');
        let _anc = _mobImgAnchor(_mobImg);
        let _vc = (cfg.targetVc != null) ? cfg.targetVc : _anc.vc;   // 🌋 地面型特效可指定較低錨點(近腳底)
        let ax = r.left + r.width * _anc.hc, ay = r.top + r.height * _vc;   // 打擊點螢幕座標
        // 🎯 方向型特效：依「施法者(玩家 sprite 胸口／戰鬥區底部中央)→目標打擊點」角度選對應方向 spr（8向原生·4向左側鏡射）
        //    v3.7.43 起不再限定投射物(proj)——疊在目標身上的方向型特效(如冰裂術 3685-0..7)同樣依角度選向；
        //    影子層有 shadowDirPrefix 時一併跟著同一方向索引（主體與影子必須同向，否則碎冰與影子會分家）。
        let _effPrefix = cfg.prefix, _flipX = false, _shadowPrefix = cfg.shadowPrefix;
        if (cfg.dirs && cfg.dirPrefix) {
            let _bv0 = document.getElementById('battle-view'); let _br0 = _bv0 && _bv0.getBoundingClientRect();
            let _pr0 = (caster && typeof _partyMemberRect === 'function') ? _partyMemberRect(caster) : ((typeof _pmCasterRect === 'function') ? _pmCasterRect() : null);
            let _ox0 = _pr0 ? (_pr0.left + _pr0.width * 0.5) : (_br0 ? (_br0.left + _br0.width * 0.5) : ax);
            let _oy0 = _pr0 ? (_pr0.top + _pr0.height * 0.35) : (_br0 ? (_br0.top + _br0.height * 0.98) : (ay + 120));
            let _deg = (Math.atan2(ax - _ox0, -(ay - _oy0)) * 180 / Math.PI + 360) % 360;   // 0=正上·順時針
            let _sel = _pickFxDir(cfg.dirs, Math.round(_deg / 45) % 8);
            _effPrefix = cfg.dirPrefix + _sel.idx; _flipX = _sel.flip;
            if (cfg.shadowDirPrefix) _shadowPrefix = cfg.shadowDirPrefix + _sel.idx;
        }
        let frames = _preloadFxFrames(cfg.dir, _effPrefix, cfg.n);
        let shadowFrames = _shadowPrefix ? _preloadFxFrames(cfg.dir, _shadowPrefix, cfg.n) : null;
        let first = frames[0];
        let _arFallback = !(first.naturalWidth && first.naturalHeight);   // 🩹 v2.7.41 首播未解碼→ar 退 0.93→解碼後 interval 重算一次(修高瘦特效如究極光裂術 395×568 首播被 0.93 撐寬)
        let ar = _arFallback ? 0.93 : (first.naturalWidth / first.naturalHeight);
        let fxW, fxH, left, top;
        let _computeGeom = () => {
            let _refH = _fxBandRefH(r.height);   // 📏 v3.3.13 尺寸一律用「112 調校基準」帶高(由 #mob-list 正規化·消 v3.2.80 帶長高 112→144 的 1.286× 誤放大)；位置錨定仍用 r(追蹤目標框)
            if (cfg.proj) {                                                     // 🎯 v3.0.21 投射物型固定尺寸：原生像素 × 帶高基準縮放(不再讀目標怪 body·對所有怪同大小·相當於妖魔鬥士)
                let mScale = _refH * SPELL_FX_REF_MSCALE_K;                      // 基準帶高(112 等值)×係數＝1.095·隨舞台等比·與怪身高無關
                let baseW = first.naturalWidth || cfg.nw || 40, baseH = first.naturalHeight || cfg.nh || 40;
                fxW = baseW * mScale; fxH = baseH * mScale;
                if (cfg.projScale) { fxW *= cfg.projScale; fxH *= cfg.projScale; }   // 🔧 v3.0.20 大尺寸投射物(極光雷電 122×255 原生太大)額外縮放
            }
            else if (cfg.w != null) { fxW = (_refH * SPELL_FX_REF_W_K) * cfg.w; fxH = fxW / ar; }  // 🌋 寬度驅動(地面型)v3.0.21 改帶高基準寬(固定·不隨怪寬)
            else { fxH = _refH * (cfg.h || 1.8); fxW = fxH * ar; }               // ⚡ 高度驅動(範圍型·如落雷)：基準帶高＝固定不隨怪
            left = (ax - fxW * (cfg.ax != null ? cfg.ax : 0.5)) + 'px';
            top = (ay - fxH * (cfg.ay != null ? cfg.ay : 0.9)) + 'px';
        };
        _computeGeom();
        let mkImg = (src, extraCls, blend) => {
            let el = document.createElement('img');
            el.className = 'vfx-spell' + (extraCls ? ' ' + extraCls : '');
            el.dataset.fxkey = fxKey;
            el.src = src;
            el.style.width = fxW + 'px'; el.style.height = fxH + 'px'; el.style.left = left; el.style.top = top;
            if (blend) el.style.mixBlendMode = blend;
            layer.appendChild(el);
            nodes.push(el);
            return el;
        };
        let _applyGeom = (elm) => { if (elm) { elm.style.width = fxW + 'px'; elm.style.height = fxH + 'px'; elm.style.left = left; elm.style.top = top; } };
        // 🎯 v3.0.5 投射物「飛行」：proj 型特效由施法者飛向目標命中點(ax,ay)·途中循環播放幀·抵達即消失(取代原地疊播·符合「取代丟出去的投射物」)。
        //    施法者優先用傳入的隊伍成員 sprite；未傳時才以玩家變身 sprite／戰鬥區底部中央為起點。
        if (cfg.proj) {
            let bv = document.getElementById('battle-view');
            let br = bv && bv.getBoundingClientRect();
            let pr = (caster && typeof _partyMemberRect === 'function') ? _partyMemberRect(caster) : ((typeof _pmCasterRect === 'function') ? _pmCasterRect() : null);
            let ox = pr ? (pr.left + pr.width * 0.5) : (br ? (br.left + br.width * 0.5) : ax);                       // 施法者水平＝變身 sprite 中央·退回戰鬥區中央
            let oy = pr ? (pr.top + pr.height * 0.35) : (br ? (br.top + br.height * 0.98) : (ay + (fxH || 40) * 3));  // 施法者垂直＝sprite 胸口·退回戰鬥區底部(玩家視角)
            let axf = (cfg.ax != null ? cfg.ax : 0.5), ayf = (cfg.ay != null ? cfg.ay : 0.5);   // 投射物錨點(哪一點沿路徑走)
            let el = mkImg(first.src, null, cfg.blend);
            if (_flipX) el.style.transform = 'scaleX(-1)';   // 🎯 4向左側：水平鏡射（NW←NE鏡射·W←E鏡射）
            el.style.left = (ox - fxW * axf) + 'px'; el.style.top = (oy - fxH * ayf) + 'px';   // 立即置於起點(避免首幀閃在終點)
            let dist = Math.hypot(ax - ox, ay - oy);
            let dur = Math.max(140, Math.min(380, dist / 1600 * 1000));         // 飛行時間依距離(近140ms~遠380ms)
            let frameDur = 1000 / (cfg.fps || 12);
            let _now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            let t0 = _now();
            let raf = () => {
                if (!_vfxCleanups.has(cleanup)) return;
                try {
                    let elapsed = _now() - t0, t = Math.min(1, elapsed / dur);
                    if (_arFallback && first.naturalWidth && first.naturalHeight) { _arFallback = false; _computeGeom(); }   // 🩹 解碼後校正尺寸(採真原生像素)
                    let px = ox + (ax - ox) * t, py = oy + (ay - oy) * t;
                    el.style.width = fxW + 'px'; el.style.height = fxH + 'px';
                    el.style.left = (px - fxW * axf) + 'px'; el.style.top = (py - fxH * ayf) + 'px';
                    let fi = Math.floor(elapsed / frameDur) % cfg.n; if (frames[fi]) el.src = frames[fi].src;   // 途中循環幀
                    if (t < 1) frame = requestAnimationFrame(raf);
                    else cleanup();
                } catch (e) { cleanup(); }
            };
            frame = requestAnimationFrame(raf);
            return;
        }
        let sEl = shadowFrames ? mkImg(shadowFrames[0].src, 'vfx-spell-shadow', null) : null;   // 🌑 影子層先加(在後·DOM 順序→特效層疊其上)
        let el = mkImg(first.src, null, cfg.blend);   // 特效層
        if (_flipX) { el.style.transform = 'scaleX(-1)'; if (sEl) sEl.style.transform = 'scaleX(-1)'; }   // 🎯 v3.7.43 非投射的方向型也支援 4 向左側鏡射（8 向恆 flip=false→此行不作用）
        // 🎇 v2.7.41 多層同步(cfg.layers=額外前綴陣列·同畫布同幾何同幀·如究極光裂術/震裂術 3 spr 同時播)：每層一個 img·全部同 fxW/fxH/left/top/blend·interval 同步推進
        let extraLayers = [];
        if (cfg.layers) for (let lp of cfg.layers) { let lf = _preloadFxFrames(cfg.dir, lp, cfg.n); extraLayers.push({ el: mkImg(lf[0].src, null, cfg.blend), frames: lf }); }
        let i = 0;
        timer = setInterval(() => {
            if (!_vfxCleanups.has(cleanup)) return;
            i++;
            if (i >= cfg.n || !el.isConnected) { cleanup(); return; }
            if (_arFallback && first.naturalWidth && first.naturalHeight) { _arFallback = false; ar = first.naturalWidth / first.naturalHeight; _computeGeom(); _applyGeom(el); if (sEl) _applyGeom(sEl); extraLayers.forEach(L => _applyGeom(L.el)); }   // 🩹 解碼後重算幾何一次(僅首播命中)
            el.src = frames[i].src;
            if (sEl && shadowFrames[i]) sEl.src = shadowFrames[i].src;
            extraLayers.forEach(L => { if (L.frames[i]) L.el.src = L.frames[i].src; });
        }, Math.round(1000 / (cfg.fps || 14)));
    } catch (e) { if (cleanup) cleanup(); }
}
// 🙏 v2.7.48 自我增益特效（SELF_FX）：治癒/武器附魔/防禦/屏障等 type buff/heal 技能施放時，於 #battle-view 中央疊播（v3.0.49：玩家變身 sprite 顯示中→改錨定 sprite 身上·否則以戰鬥區為「施法者」錨點）。
//   掛點＝js/07 castSkill 施放成功且 isSupportSkill(sk)→playSelfFx(sk.n)（未註冊者靜默略過）。cfg：{dir,prefix,n,fps,blend,h=高為戰鬥區高倍數,cx/cy=戰鬥區內錨點比例(預設 0.5/0.62 略偏下=玩家視角)}。
const SELF_FX = {
    '中級治癒術': { dir:'中級治癒術', prefix:'744-0', n:21, fps:16, blend:'screen', h:0.5 },
    '保護罩': { dir:'保護罩', prefix:'221-0', n:5, fps:14, blend:'screen', h:0.50, overHead:true },
    '全部治癒術': { dir:'全部治癒術', prefix:'744-0', n:21, fps:16, blend:'screen', h:0.62 },
    '冥想術': { dir:'冥想術', prefix:'2173-0', n:17, fps:14, blend:'screen', h:0.50, overHead:true },
    '冰雪颶風': { dir:'冰雪颶風', prefix:'3933-0', n:31, fps:14, blend:'screen', h:0.50, overHead:true },
    '初級治癒術': { dir:'初級治癒術', prefix:'744-0', n:21, fps:16, blend:'screen', h:0.42 },
    '力量提升': { dir:'力量提升', prefix:'3909-0', n:18, fps:14, blend:'screen', h:0.50, overHead:true },
    '加速術': { dir:'加速術', prefix:'755-0', n:6, fps:14, blend:'screen', h:0.50, overHead:true },
    '反擊屏障': { dir:'反擊屏障', prefix:'5832-0', n:17, fps:14, blend:'screen', h:0.50, overHead:true },
    '單屬性防禦': { dir:'單屬性防禦', prefix:'2285-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '堅固防護': { dir:'堅固防護', prefix:'5831-0', n:14, fps:14, blend:'screen', h:0.50, overHead:true },
    '增幅防禦': { dir:'增幅防禦', prefix:'4824-0', n:19, fps:14, blend:'screen', h:0.50, overHead:true },
    '大地屏障': { dir:'大地屏障', prefix:'2251-0', n:21, fps:14, blend:'screen', h:0.50, overHead:true },
    '大地的祝福': { dir:'大地的祝福', prefix:'2287-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '大地防護': { dir:'大地防護', prefix:'2249-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '尖刺盔甲': { dir:'尖刺盔甲', prefix:'4648-0', n:22, fps:14, blend:'screen', h:0.50, overHead:true },
    '屬性之火': { dir:'屬性之火', prefix:'4402-0', n:17, fps:14, blend:'screen', h:0.50, overHead:true },
    '屬性防禦': { dir:'屬性防禦', prefix:'2184-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '強力加速術': { dir:'強力加速術', prefix:'3104-0', n:6, fps:14, blend:'screen', h:0.50, overHead:true },
    '影之防護': { dir:'影之防護', prefix:'2943-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '心靈轉換': { dir:'心靈轉換', prefix:'2179-0', n:19, fps:14, blend:'screen', h:0.50, overHead:true },
    '擬似魔法武器': { dir:'擬似魔法武器', prefix:'747-0', n:19, fps:14, blend:'screen', h:0.50, overHead:true },
    '敏捷提升': { dir:'敏捷提升', prefix:'3910-0', n:18, fps:14, blend:'screen', h:0.50, overHead:true },
    '暗影之牙': { dir:'暗影之牙', prefix:'2951-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '暗影閃避': { dir:'暗影閃避', prefix:'2950-0', n:15, fps:14, blend:'screen', h:0.50, overHead:true },
    '暗隱術': { dir:'暗隱術', prefix:'2944-0', n:9, fps:14, blend:'screen', h:0.50, overHead:true },
    '暴風之眼': { dir:'暴風之眼', prefix:'2288-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '暴風神射': { dir:'暴風神射', prefix:'2248-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '毒性抵抗': { dir:'毒性抵抗', prefix:'2948-0', n:11, fps:14, blend:'screen', h:0.50, overHead:true },
    '水之元氣': { dir:'水之元氣', prefix:'4401-0', n:21, fps:14, blend:'screen', h:0.50, overHead:true },
    '治癒能量風暴': { dir:'治癒能量風暴', prefix:'hs', n:19, fps:14, blend:'screen', h:0.60, overHead:true },
    '淨化精神': { dir:'淨化精神', prefix:'2180-0', n:11, fps:14, blend:'screen', h:0.50, overHead:true },
    '火焰武器': { dir:'火焰武器', prefix:'2182-0', n:11, fps:14, blend:'screen', h:0.50, overHead:true },
    '火牢': { dir:'火牢', prefix:'168-0', n:11, fps:14, blend:'screen', h:0.50, overHead:true },
    '烈炎武器': { dir:'烈炎武器', prefix:'2242-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '烈焰之魂': { dir:'烈焰之魂', prefix:'5833-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '無所遁形術': { dir:'無所遁形術', prefix:'749-0', n:23, fps:14, blend:'screen', h:0.50, overHead:true },
    '燃燒鬥志': { dir:'燃燒鬥志', prefix:'2946-0', n:9, fps:14, blend:'screen', h:0.50, overHead:true },
    '狂暴術': { dir:'狂暴術', prefix:'3943-0', n:27, fps:14, blend:'screen', h:0.50, overHead:true },
    '生命之泉': { dir:'生命之泉', prefix:'2243-0', n:16, fps:16, blend:'screen', h:0.5 },
    '生命的祝福': { dir:'生命的祝福', prefix:'2244-0', n:16, fps:16, blend:'screen', h:0.5 },
    '祝福魔法武器': { dir:'祝福魔法武器', prefix:'2176-0', n:17, fps:14, blend:'screen', h:0.50, overHead:true },
    '神聖武器': { dir:'神聖武器', prefix:'2165-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '神聖疾走': { dir:'神聖疾走', prefix:'3936-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '精準射擊': { dir:'精準射擊', prefix:'5826-0', n:12, fps:14, blend:'screen', h:0.50, overHead:true },
    '精準目標': { dir:'精準目標', prefix:'1765-0', n:31, fps:14, blend:'screen', h:0.50, overHead:true },
    '絕對屏障': { dir:'絕對屏障', prefix:'2234-0', n:31, fps:14, blend:'screen', h:0.50, overHead:true },
    '聖潔之光': { dir:'聖潔之光', prefix:'227-0', n:7, fps:16, blend:'screen', h:0.5 },
    '聖結界': { dir:'聖結界', prefix:'228-0', n:7, fps:14, blend:'screen', h:0.50, overHead:true },
    '能量激發': { dir:'能量激發', prefix:'5825-0', n:16, fps:14, blend:'screen', h:0.50, overHead:true },
    '行走加速': { dir:'行走加速', prefix:'2945-0', n:6, fps:14, blend:'screen', h:0.50, overHead:true },
    '負重強化': { dir:'負重強化', prefix:'2170-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '返生術': { dir:'返生術', prefix:'3944-0', n:24, fps:14, blend:'screen', h:0.55 },
    '通暢氣脈術': { dir:'通暢氣脈術', prefix:'750-0', n:11, fps:14, blend:'screen', h:0.50, overHead:true },
    '造屍術': { dir:'造屍術', prefix:'226-0', n:7, fps:14, blend:'screen', h:0.50, overHead:true },
    '鋼鐵防護': { dir:'鋼鐵防護', prefix:'2252-0', n:15, fps:14, blend:'screen', h:0.50, overHead:true },
    '鎧甲護持': { dir:'鎧甲護持', prefix:'748-0', n:20, fps:14, blend:'screen', h:0.50, overHead:true },
    '鏡反射': { dir:'鏡反射', prefix:'4395-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '附加劇毒': { dir:'附加劇毒', prefix:'2942-0', n:9, fps:14, blend:'screen', h:0.50, overHead:true },
    '雙重破壞': { dir:'雙重破壞', prefix:'2949-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '靈魂昇華': { dir:'靈魂昇華', prefix:'3935-0', n:19, fps:14, blend:'screen', h:0.50, overHead:true },
    '風之疾走': { dir:'風之疾走', prefix:'2247-0', n:14, fps:14, blend:'screen', h:0.50, overHead:true },
    '風之神射': { dir:'風之神射', prefix:'2246-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    '體力回復術': { dir:'體力回復術', prefix:'759-0', n:10, fps:16, blend:'screen', h:0.5 },
    '體能激發': { dir:'體能激發', prefix:'4400-0', n:16, fps:14, blend:'screen', h:0.50, overHead:true },
    '體魄強健術': { dir:'體魄強健術', prefix:'751-0', n:11, fps:14, blend:'screen', h:0.50, overHead:true },
    '高級治癒術': { dir:'高級治癒術', prefix:'744-0', n:21, fps:16, blend:'screen', h:0.58 },
    '魂體轉換': { dir:'魂體轉換', prefix:'2178-0', n:19, fps:14, blend:'screen', h:0.50, overHead:true },
    '魔力奪取': { dir:'魔力奪取', prefix:'2171-0', n:9, fps:14, blend:'screen', h:0.50, overHead:true },
    '魔法屏障': { dir:'魔法屏障', prefix:'2174-0', n:15, fps:14, blend:'screen', h:0.50, overHead:true },
    '魔法相消術': { dir:'魔法相消術', prefix:'870-0', n:1, fps:16, blend:'screen', h:0.5 },
    '魔法防禦': { dir:'魔法防禦', prefix:'2186-0', n:13, fps:14, blend:'screen', h:0.50, overHead:true },
    // 🌀 保留：傳送術(手動 teleport 掛點·高瘦光柱)
    '傳送術':       { dir: '傳送術',     prefix: '169-0', n: 7,  fps: 14, blend: 'screen', h: 0.85, cy: 0.55 },
};
let _selfFxActive = {};   // 「技能名|錨點識別」 → cleanup：同技能同錨點同時只保留一個
function playSelfFx(skn, anchorRect) {   // 🩹 v3.0.95 第2參 anchorRect（選用）：顯式錨點 rect（傭兵治癒疊在被治癒者 sprite 身上）·未傳→原邏輯（玩家 sprite→戰鬥區中央）
    let cleanup = null;
    try {
        if (_vfxMute()) return;
        let cfg = SELF_FX[skn]; if (!cfg) return;
        // ✨ v3.5.87 去重鍵含錨點：同名技能對不同目標可同時播（修：玩家治癒 vs 傭兵治癒、多傭兵各自治癒在動畫視窗內互吞·只播第一個呼叫者）
        let _fxKey = skn + '|' + (anchorRect ? (Math.round(anchorRect.left) + ',' + Math.round(anchorRect.top)) : 'self');
        if (_selfFxActive[_fxKey]) return;
        let bv = document.getElementById('battle-view');
        if (!bv) return;
        let r = bv.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return;
        // 📐 v3.3.12 尺寸基準改「怪物站立帶」#mob-list（area-fit 恆鎖 242px×舞台縮放＝舊條狀框高＝cfg.h 當初調校基準）：
        //    v3.2.80 戰鬥框改 16:9(450) 後原以 battle-view 高算尺寸→自身 buff/治癒/傳送特效被放大 ~1.86×；帶高恆定不受框形影響。r 仍供無 sprite 錨點時的「定位」fallback（置中要相對整個框）。
        let _ml0 = document.getElementById('mob-list');
        let _mr0 = _ml0 && _ml0.getBoundingClientRect();
        let refH = (_mr0 && _mr0.height > 0) ? _mr0.height : r.height;
        let layer = _vfxLayer();
        if (layer.childElementCount > 220) return;
        let frames = _preloadFxFrames(cfg.dir, cfg.prefix, cfg.n);
        let first = frames[0];
        let _arFallback = !(first.naturalWidth && first.naturalHeight);   // 🩹 首播未解碼→退 1·解碼後重算一次
        let ar = _arFallback ? 1 : (first.naturalWidth / first.naturalHeight);
        let fxH, fxW, left, top;
        let _geom = () => {
            fxH = refH * (cfg.h || 0.5); fxW = fxH * ar;
            let pr = anchorRect || ((typeof _pmCasterRect === 'function') ? _pmCasterRect() : null);   // 🧝 v3.0.49 玩家變身 sprite 顯示中→特效錨定 sprite 身上（水平置中）；v3.0.95 顯式錨點優先
            if (pr) {
                left = (pr.left + pr.width / 2 - fxW / 2) + 'px';
                top = (cfg.overHead ? (pr.top - fxH * 0.55) : (pr.bottom - fxH)) + 'px';   // 🙏 輔助 buff→疊在 sprite 頭頂上方；治癒→疊在身體(自腳底往上)
            }
            else {
                left = (r.left + r.width * (cfg.cx != null ? cfg.cx : 0.5) - fxW / 2) + 'px';
                top = (r.top + r.height * (cfg.cy != null ? cfg.cy : (cfg.overHead ? 0.42 : 0.62)) - fxH / 2) + 'px';   // 無 sprite→輔助偏上、治癒略偏下
            }
        };
        _geom();
        let el = document.createElement('img');
        el.className = 'vfx-spell vfx-selffx';
        el.src = first.src;
        el.style.width = fxW + 'px'; el.style.height = fxH + 'px'; el.style.left = left; el.style.top = top;
        if (cfg.blend) el.style.mixBlendMode = cfg.blend;
        layer.appendChild(el);
        let i = 0, iv = null;
        cleanup = _vfxTrackCleanup(() => {
            if (iv !== null) clearInterval(iv);
            el.remove();
            if (_selfFxActive[_fxKey] === cleanup) delete _selfFxActive[_fxKey];
        });
        _selfFxActive[_fxKey] = cleanup;
        iv = setInterval(() => {
            if (!_vfxCleanups.has(cleanup)) return;
            i++;
            if (i >= cfg.n || !el.isConnected) { cleanup(); return; }
            if (_arFallback && first.naturalWidth && first.naturalHeight) { _arFallback = false; ar = first.naturalWidth / first.naturalHeight; _geom(); el.style.width = fxW + 'px'; el.style.height = fxH + 'px'; el.style.left = left; el.style.top = top; }
            el.src = frames[i].src;
        }, Math.round(1000 / (cfg.fps || 14)));
    } catch (e) { if (cleanup) cleanup(); }
}
// 🌀 v3.0.102 傳送術特效：於玩家 sprite 身上播 傳送術 光柱，並在特效期間暫時隱藏玩家 sprite（時間到自動恢復）。掛點＝doTeleport / enterHiddenArea（涵蓋 傳送術技能 + 手動/自動 瞬間移動卷軸）。
let _teleportFxUntil = 0;   // Date.now() 毫秒·此刻之前 _playerMorphApply 隱藏玩家 sprite
function playTeleportFx() {
    try {
        let cfg = SELF_FX['傳送術'];
        let durMs = cfg ? (cfg.n / (cfg.fps || 14) * 1000) : 500;
        _teleportFxUntil = Date.now() + durMs + 80;   // +80ms 緩衝：特效播畢後 sprite 才復現
        if (typeof playSelfFx === 'function') playSelfFx('傳送術');   // 無 anchorRect→錨定玩家 sprite（_pmCasterRect）·此刻 sprite 尚未隱藏→rect 有效
    } catch (e) {}
}
// 🩹 v3.0.95 隊伍成員「戰場 sprite」錨點：回傳該成員(玩家/傭兵) sprite 的 rect，供 playSelfFx 把治癒特效疊在被治癒者身上；無 sprite/不可見→null（playSelfFx 落回預設錨點）
function _partyMemberRect(who) {
    try {
        if (!who) return null;
        if (who === player) return (typeof _pmCasterRect === 'function') ? _pmCasterRect() : null;
        let st = _allySpriteStates[String(who._slot)];
        if (st && st.el && st.el.isConnected) { let r = st.el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return r; }
    } catch (e) {}
    return null;
}
// ===== ❄️ 冰凍「狀態」疊加動畫（v2.7.20）：怪物 st.freeze>0 時於身上循環播冰封 state 幀·解凍(freeze歸0/怪陣亡)時播一次 end 碎裂幀 =====
//   來源 assets/fx/冰凍狀態/state_0..7.png(持續中·全域時鐘循環)＋end_0..3.png(結束碎裂·一次性)。逐怪一個疊層(vfx-layer·每幀重錨定跟隨怪·適用所有怪不限動畫怪)。
//   由 8fps ticker 呼叫(見檔尾 setInterval)。開關吃 window.__vfxOff。與 SPELL_FX(施法瞬間)不同：這是「狀態持續期間」的疊層。
const FREEZE_FX = { dir: '冰凍狀態', stateN: 8, endN: 4, fps: 8, h: 0.38, ax: 0.5, ay: 0.5 };   // h=冰封高度為怪圖高倍數(v2.7.21 用戶要冰塊縮小·寬度=原1/3→h 1.15→0.38 等比縮)·ax/ay=冰封錨點(置中蓋身)
let _freezeFx = {};   // uid → { el, mode:'state'|'end', t0 }
function _freezePosition(el, r) {
    let f0 = _preloadFxFrames(FREEZE_FX.dir, 'state', FREEZE_FX.stateN)[0];
    let ar = (f0.naturalWidth && f0.naturalHeight) ? (f0.naturalWidth / f0.naturalHeight) : 1.1;
    let fxH = _fxBandRefH(r.height) * FREEZE_FX.h, fxW = fxH * ar;   // 📏 v3.3.13 尺寸用 112 調校基準(消帶長高誤放大)·位置仍蓋目標框中心
    let cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.5;   // 幾何中心蓋住身體
    el.style.width = fxW + 'px'; el.style.height = fxH + 'px';
    el.style.left = (cx - fxW * FREEZE_FX.ax) + 'px';
    el.style.top = (cy - fxH * FREEZE_FX.ay) + 'px';
}
function _updateFreezeFx() {
    try {
        if (window.__vfxOff) { for (let u in _freezeFx) { _freezeFx[u].el.remove(); delete _freezeFx[u]; } return; }
        let ml = document.getElementById('mob-list'); if (!ml) return;
        let byUid = {};
        if (typeof mapState !== 'undefined' && mapState.mobs) for (let m of mapState.mobs) if (m) byUid[m.uid] = m;
        let layer = _vfxLayer();
        // (1) 掃場上卡片：凍結中→建/更新 state 疊層並重錨定
        ml.querySelectorAll('.mob-target[data-uid]').forEach(card => {
            let uid = card.getAttribute('data-uid');
            let m = byUid[uid];
            let frozen = !!(m && m.curHp > 0 && m.st && m.st.freeze > 0);
            let fx = _freezeFx[uid];
            if (frozen) {
                let box = card.querySelector('.mob-img-inner') || card.querySelector('.mob-img-wrap') || card;
                let r = box.getBoundingClientRect(); if (r.width === 0) return;
                if (!fx || fx.mode === 'end') { let el = document.createElement('img'); el.className = 'vfx-spell vfx-freeze'; layer.appendChild(el); fx = _freezeFx[uid] = { el: el, mode: 'state', t0: Date.now() }; }
                _freezePosition(fx.el, r);
                let frames = _preloadFxFrames(FREEZE_FX.dir, 'state', FREEZE_FX.stateN);
                let f = Math.floor(Date.now() / (1000 / FREEZE_FX.fps)) % FREEZE_FX.stateN;
                if (frames[f]) fx.el.src = frames[f].src;
            } else if (fx && fx.mode === 'state') {
                fx.mode = 'end'; fx.t0 = Date.now();   // 解凍/陣亡→切碎裂動畫(位置定格在最後一次錨定·怪離場也能播完)
            }
        });
        // (2) 推進 end 動畫 + 清理殘留
        for (let uid in _freezeFx) {
            let fx = _freezeFx[uid];
            if (fx.mode === 'end') {
                let frames = _preloadFxFrames(FREEZE_FX.dir, 'end', FREEZE_FX.endN);
                let f = Math.floor((Date.now() - fx.t0) / (1000 / FREEZE_FX.fps));
                if (f >= FREEZE_FX.endN) { fx.el.remove(); delete _freezeFx[uid]; }
                else if (frames[f]) fx.el.src = frames[f].src;
            } else if (!byUid[uid]) { fx.el.remove(); delete _freezeFx[uid]; }   // state 中但怪突然消失(未經解凍)→清
        }
    } catch (e) {}
}
// ===== 🔥 怪物技能特效（v2.7.22·skill_effect_start→end）：由 _mobAnimTrigger 於怪施放技能時登記 _mobSkillFx[uid]={t0}·此處(8fps ticker)逐幀推進 =====
//   時間軸：start_0..N-1 播畢接 end_0..M-1(一次性)·置中蓋怪·screen 加亮·大畫布(獨立於本體·assets/anim/<怪名>/skill_effect_start/end_N.png)·播畢或怪離場即移除。
let _mobSkillFx = {};   // uid → { el, t0 }
function _updateMobSkillFx() {
    try {
        if (window.__vfxOff) { for (let u in _mobSkillFx) { if (_mobSkillFx[u].el) _mobSkillFx[u].el.remove(); if (_mobSkillFx[u].el2) _mobSkillFx[u].el2.remove(); delete _mobSkillFx[u]; } return; }
        let ids = Object.keys(_mobSkillFx); if (!ids.length) return;
        let ml = document.getElementById('mob-list');
        let byUid = {};
        if (typeof mapState !== 'undefined' && mapState.mobs) for (let m of mapState.mobs) if (m) byUid[m.uid] = m;
        let layer = _vfxLayer();
        for (let uid of ids) {
            let s = _mobSkillFx[uid];
            let m = byUid[uid];
            let a = m && _mobAnimCache[m.n];
            if (!m || !a || a === 'probing' || !a.skillFx || !a.skillFx.start) { if (s.el) s.el.remove(); if (s.el2) s.el2.remove(); if (s.el3) s.el3.remove(); delete _mobSkillFx[uid]; continue; }
            let startN = a.skillFx.start.length, endN = a.skillFx.end ? a.skillFx.end.length : 0;
            let cfg = MOB_ANIM_SKILL_FX[m.n] || {};
            let total = startN + endN + (cfg.endHoldF || 0);   // ⏸ v2.7.34 endHoldF＝最後一幀額外定格幀數（吐息尾雲消散·讓特效跨過本體動畫尾端）
            let f = Math.floor((Date.now() - s.t0) / (1000 / MOB_ANIM_FPS)) - (cfg.delayF || 0);   // ⏳ v2.7.32 delayF＝延遲起噴幀數（安塔瑞斯張嘴幀才開始）
            let card = ml && ml.querySelector('.mob-target[data-uid="' + uid + '"]');
            if (f >= total || !card) { if (s.el) s.el.remove(); if (s.el2) s.el2.remove(); if (s.el3) s.el3.remove(); delete _mobSkillFx[uid]; continue; }
            if (f < 0) continue;   // ⏳ 尚未到起噴幀（張嘴前不顯示·el 尚未建立）
            let box = card.querySelector('.mob-img-inner') || card.querySelector('.mob-img-wrap') || card;
            let r = box.getBoundingClientRect(); if (r.width === 0) continue;
            if (!s.el) { s.el = document.createElement('img'); s.el.className = 'vfx-spell vfx-mobskill'; layer.appendChild(s.el); }
            if (cfg.startPfx2 && a.skillFx.start2 && !s.el2) { s.el2 = document.createElement('img'); s.el2.className = 'vfx-spell vfx-mobskill'; layer.appendChild(s.el2); }   // 🔥 v2.7.41 第二特效層(不死鳥)
            if (cfg.startPfx3 && a.skillFx.start3 && !s.el3) { s.el3 = document.createElement('img'); s.el3.className = 'vfx-spell vfx-mobskill'; layer.appendChild(s.el3); }   // 🔥 v3.0.13 第三特效層(底比斯阿努比斯 skill_effect1/2/3 三層同時)
            let seq, fi;
            if (f < startN) { seq = a.skillFx.start; fi = f; }
            else if (f < startN + endN) { seq = a.skillFx.end; fi = f - startN; }
            else { seq = endN ? a.skillFx.end : a.skillFx.start; fi = (endN || startN) - 1; }   // ⏸ endHoldF 期間：定格最後一幀（尾雲消散）
            let f0 = a.skillFx.start[0];
            if (cfg.anchored) {   // 🌍 世界格線錨定（v2.7.31·像素級）：特效與本體共用世界格線·單獨轉檔→用 meta latticeOrigin 差算出的固定偏移(ox,oy)貼在本體 img 上（縮放由 rect/畫布尺寸自動吸收）
                let _bimg = box.querySelector('img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)');
                if (_bimg) {
                    let _br = _bimg.getBoundingClientRect();
                    if (_br.width > 0) {
                        let _sx = _br.width / cfg.anchored.bw, _sy = _br.height / cfg.anchored.bh;
                        s.el.style.width = ((f0.naturalWidth || 1) * _sx) + 'px'; s.el.style.height = ((f0.naturalHeight || 1) * _sy) + 'px';
                        s.el.style.left = (_br.left + cfg.anchored.ox * _sx) + 'px'; s.el.style.top = (_br.top + cfg.anchored.oy * _sy) + 'px';
                        if (seq[fi]) s.el.src = seq[fi].src;
                        if (s.el2 && a.skillFx.start2) {   // 🔥 v2.7.41 第二特效層(不死鳥 skill_effect2)：與 start 同畫布(--multi)→同幾何同錨定·同步幀
                            s.el2.style.width = s.el.style.width; s.el2.style.height = s.el.style.height;
                            s.el2.style.left = s.el.style.left; s.el2.style.top = s.el.style.top;
                            let _fi2 = fi < a.skillFx.start2.length ? fi : a.skillFx.start2.length - 1;
                            if (a.skillFx.start2[_fi2]) s.el2.src = a.skillFx.start2[_fi2].src;
                        }
                        if (s.el3 && a.skillFx.start3) {   // 🔥 v3.0.13 第三特效層：同幾何·同步幀(超長定格尾幀)
                            s.el3.style.width = s.el.style.width; s.el3.style.height = s.el.style.height;
                            s.el3.style.left = s.el.style.left; s.el3.style.top = s.el.style.top;
                            let _fi3 = fi < a.skillFx.start3.length ? fi : a.skillFx.start3.length - 1;
                            if (a.skillFx.start3[_fi3]) s.el3.src = a.skillFx.start3[_fi3].src;
                        }
                    }
                }
                continue;
            }
            let ar = (f0.naturalWidth && f0.naturalHeight) ? (f0.naturalWidth / f0.naturalHeight) : 1.5;
            let fxH = _fxBandRefH(r.height) * (cfg.h || 1.6), fxW = fxH * ar;   // 📏 v3.3.13 尺寸用 112 調校基準(消帶長高誤放大)·cfg.h 全在 112 基準下逐怪調校
            let cx = r.left + r.width * 0.5, cy;
            if (cfg.feet) {   // 🔥 地面型(敵人施法火環)：錨在本體圖「不透明區底部」＝真實腳底(bc 逐怪逐幀動態偵測·統一畫布 idle 腳底非畫布底也精準)·v2.7.26
                let _bimg = box.querySelector('img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)');
                if (_bimg) { let _br = _bimg.getBoundingClientRect(); cy = _br.top + _br.height * (_mobImgAnchor(_bimg).bc - (cfg.lift || 0)); }   // 🔼 v3.0.37 cfg.lift＝再往上抬「本體高度×lift」（用戶：火環太低·上抬 1/5）
                else cy = r.top + r.height * (0.78 - (cfg.lift || 0));
            } else cy = r.top + r.height * 0.5;   // 身體中心(DK/卡瑞 火焰爆發)
            let ay = (cfg.ay != null) ? cfg.ay : 0.55;
            s.el.style.width = fxW + 'px'; s.el.style.height = fxH + 'px';
            s.el.style.left = (cx - fxW * 0.5) + 'px'; s.el.style.top = (cy - fxH * ay) + 'px';
            if (seq[fi]) s.el.src = seq[fi].src;
        }
    } catch (e) {}
}
// 由 _renderMobsImpl 迴圈呼叫（讀 m.justHit 前）：用 HP 差捕捉本幀傷害，免改 50+ 個傷害落點
function _vfxQueueDmg(m) {
    if ((window.__vfxOff && window.__vfxNumOff) || !m) { if (m) m._vfxBig = false; return; }   // 🔢 v3.0.9 傷害數字獨立於特效：只有「特效關且數字也關」才完全略過→數字開時即使關特效仍捕捉 HP 差生成數字
    let prev = (m._vfxHp == null) ? m.curHp : m._vfxHp;
    let d = prev - m.curHp;
    m._vfxHp = m.curHp;
    let big = m._vfxBig; m._vfxBig = false;   // 'crit' | 'heavy' | undefined（只有爆擊/重擊才放大上色，不再用傷害量門檻）
    if (d > 0 && m.curHp > 0 && !document.hidden) {   // 致命一擊交給 vfxKill 的粒子，這裡只顯示非致命傷害數字；🌙 v3.6.03 分頁隱藏不入佇列（_vfxHp 已於上方消化差值→回前景不會補噴巨量舊傷害）
        let ele = (m.justHit && m.justHit !== true) ? m.justHit : 'normal';
        _vfxPending.push({ uid: m.uid, dmg: d, ele: ele, big: big });
    }
}
// innerHTML 重建後呼叫：此時格子已布局，可取螢幕座標生成飄字
function _vfxFlush() {
    if (document.hidden) { _vfxPending = []; return; }   // 🌙 v3.6.03 分頁隱藏：丟棄佇列不生成（看不見·且背景中移除管線停擺會堆積）
    if (window.__vfxOff && window.__vfxNumOff) { _vfxPending = []; return; }   // 🔢 v3.0.9 特效關但數字開→仍走 flush 顯示數字（粒子/impact 於下方另由 __vfxOff 個別關）
    if (!_vfxPending.length) return;
    let layer = _vfxLayer();
    let ml = document.getElementById('mob-list');
    if (ml) {
        // 🚀 先一次讀完所有格子座標(批次量測)、再一次產生所有特效→消除「讀-寫-讀」反覆強制重排(layout thrashing)
        let reads = [];
        for (const p of _vfxPending) {
            let slot = ml.querySelector('.mob-target[data-uid="' + p.uid + '"]');
            if (!slot) continue;
            let box = slot.querySelector('.mob-img-inner') || slot.querySelector('.mob-img-wrap') || slot;   // 🎯 v2.6.41 VFX 錨定「圖層 .mob-img-inner」(帶 translateY/scale·getBoundingClientRect 反映實際位置) 而非「容器 .mob-img-wrap」→修 v2.6.39 單排景深(後排上移30px/前排放大1.55)後 死亡殘影/擊殺特效/傷害數字 錯位
            let r = box.getBoundingClientRect();
            if (r.width === 0) continue;
            reads.push({ p: p, cx: r.left + r.width / 2, top: r.top, h: r.height });
        }
        for (const it of reads) {
            let cx = it.cx, cy = it.top + it.h * 0.45;
            // 🩸 傷害數字＝玩家最在意的資訊、單一輕量文字節點→放寬上限至 200，使快速/多段攻擊(龍騎士、AoE、傭兵/召喚同時打)也穩定顯示，不再整批被略過
            if (layer.childElementCount < 200) _vfxNumber(cx + (Math.random() * 26 - 13), it.top + it.h * 0.40, it.p.dmg, it.p.ele, it.p.big);
            // ⛔ v3.0.104 取消「白光打擊特效」（命中衝擊環 _vfxImpact + 火花）：改由命中濺血當唯一命中回饋（舊 _vfxImpact 衝擊環死碼已於 v3.5.48 清除·如需恢復可從 GitHub 版本庫找回）
            if (!window.__vfxOff && layer.childElementCount < 150) _vfxBlood(cx, cy, it.p.big);   // 🩸 v3.0.103 命中濺血（小顆·無殘留）：純特效·輕量小 div 故上限放寬至 150
        }
    }
    _vfxPending = [];
}
// 未命中沒有 HP 差值，無法走 _vfxQueueDmg；直接依目標目前的畫面位置顯示淡灰提示。
function vfxMiss(mob) {
    if (window.__vfxNumOff || !mob || document.hidden || (typeof state !== 'undefined' && state.ff)) return;   // 🌙 v3.6.03 分頁隱藏不生成
    let ml = document.getElementById('mob-list');
    let slot = ml && ml.querySelector('.mob-target[data-uid="' + mob.uid + '"]');
    if (!slot) return;
    let box = slot.querySelector('.mob-img-inner') || slot.querySelector('.mob-img-wrap') || slot;
    let r = box.getBoundingClientRect();
    if (r.width === 0) return;
    let layer = _vfxLayer();
    if (layer.childElementCount >= 200) return;
    _vfxNumber(r.left + r.width / 2 + (Math.random() * 18 - 9), r.top + r.height * 0.40, '未命中', 'miss');
}
function _vfxNumber(x, y, dmg, ele, big) {
    if (window.__vfxNumOff) return;   // 🔢 v3.0.2 「只關傷害數字」獨立開關：關掉所有飄動傷害數字(致命/非致命皆走此唯一渲染點)·其餘特效不受影響
    let el = document.createElement('div');
    let isMiss = ele === 'miss';
    el.className = 'vfx-dmg' + (big ? ' vfx-crit' : '') + (big === 'crit' ? ' vfx-critical' : (big === 'heavy' ? ' vfx-heavy' : '')) + (isMiss ? ' vfx-miss' : '');
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.color = isMiss ? 'rgba(203,213,225,.78)' : (big === 'crit' ? '#ff3b30' : (big === 'heavy' ? '#ffd54f' : (_VFX_ELE_COLOR[ele] || '#f1f5f9')));   // 未命中淡灰／爆擊大紅／重擊大金／其餘依屬性
    el.style.fontSize = (isMiss ? 14 : (big ? 32 : 20)) + 'px';   // 未命中刻意較小；傷害飄字保留強弱差異
    const dmgText = dmg >= 10000 ? (dmg / 1000).toFixed(1) + 'k' : ('' + dmg);
    if (big === 'crit' || big === 'heavy') {
        const tag = document.createElement('span');
        tag.className = 'vfx-dmg-tag';
        tag.textContent = big === 'crit' ? '爆擊' : '重擊';
        const value = document.createElement('span');
        value.className = 'vfx-dmg-value';
        value.textContent = dmgText;
        el.append(tag, value);
    } else {
        el.textContent = dmgText;
    }
    _vfxLayer().appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    _vfxTimeout(() => { if (el.parentNode) el.remove(); }, 1400);
}
// 🩸 v3.0.103 命中濺血：命中點噴數顆小紅血滴（帶重力弧線→淡出·無殘留貼花·怪物不變色）。爆擊/重擊噴更多。純裝飾·吃 window.__vfxOff。顆粒小、不上 box-shadow 保持不搶眼。
const _VFX_BLOOD_COLORS = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444'];
function _vfxBlood(cx, cy, big) {
    let layer = _vfxLayer();
    let n = big ? (8 + (Math.random() * 5 | 0)) : (4 + (Math.random() * 3 | 0));   // 爆擊/重擊 8~12·一般 4~6（不用太多）
    for (let i = 0; i < n; i++) {
        let sp = document.createElement('div'); sp.className = 'vfx-blood';
        let sz = 1.3 + Math.random() * (big ? 2.1 : 1.4);   // 小顆粒：一般 1.3~2.7·爆擊 1.3~3.4
        sp.style.width = sz + 'px'; sp.style.height = sz + 'px';
        sp.style.left = cx + 'px'; sp.style.top = cy + 'px';
        sp.style.background = _VFX_BLOOD_COLORS[(Math.random() * _VFX_BLOOD_COLORS.length) | 0];
        layer.appendChild(sp);
        let ang = Math.PI * 2 * Math.random();
        let dist = (big ? 22 : 14) + Math.random() * (big ? 22 : 15);
        let dx = Math.cos(ang) * dist;
        let up = Math.sin(ang) * dist * 0.55 - (5 + Math.random() * 9);       // 初期向外略偏上
        let fall = 16 + Math.random() * (big ? 30 : 20);                       // 末段重力下墜
        sp.animate(
            [ { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.9 },
              { transform: 'translate(calc(-50% + ' + (dx * 0.7).toFixed(1) + 'px), calc(-50% + ' + up.toFixed(1) + 'px)) scale(1)', opacity: 0.85, offset: 0.4 },
              { transform: 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + (up + fall).toFixed(1) + 'px)) scale(.45)', opacity: 0 } ],
            { duration: 360 + Math.random() * 240, easing: 'cubic-bezier(.3,.5,.5,1)' }
        ).onfinish = () => sp.remove();
        _vfxTimeout(() => { if (sp.parentNode) sp.remove(); }, 680);
    }
}
// 🎯 v2.6.45 怪物圖「視覺中心」偵測：怪物 PNG 多為方形畫布、實體繪於下方(腳貼底·上方透明)→死亡爆裂/傷害數字若錨在方框幾何中心(0.45~0.5)會浮在怪物「上方」。
//   改抓「不透明像素邊界框」的中心＝真正的怪物身體中心(實測多在 0.68~0.81 縱向)。縮到 96px 掃 alpha(便宜)＋依 src 快取(同種怪只算一次)。
//   ⚠️file:// 下 canvas.getImageData 會 taint(SecurityError)→退回常數 {vc:0.66,hc:0.5}(仍遠優於 0.45)並快取避免每次重試；GitHub/https 同源可正常逐圖精算。
let _mobAnchorCache = {};
function _mobImgAnchor(imgEl) {
    let fallback = { vc: 0.66, hc: 0.5, bc: 0.95 };   // bc=不透明區「底部」比例(最低不透明像素下緣·地面型特效錨腳底用)
    try {
        if (!imgEl) return fallback;
        let key = imgEl.currentSrc || imgEl.src;
        if (!key) return fallback;
        if (_mobAnchorCache[key]) return _mobAnchorCache[key];
        if (!imgEl.complete || !imgEl.naturalWidth) return fallback;   // 尚未載入→先用 fallback、不快取(下次重試)
        let cw = Math.min(imgEl.naturalWidth, 96), ch = Math.min(imgEl.naturalHeight, 96);
        let cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
        let ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(imgEl, 0, 0, cw, ch);
        let d;
        try { d = ctx.getImageData(0, 0, cw, ch).data; }
        catch (e) { _mobAnchorCache[key] = fallback; return fallback; }   // file:// taint→快取 fallback 停止重試
        let minX = cw, maxX = -1, minY = ch, maxY = -1;
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
            if (d[(y * cw + x) * 4 + 3] > 16) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        }
        if (maxY < 0) { _mobAnchorCache[key] = fallback; return fallback; }   // 全透明→fallback
        let res = { vc: (minY + maxY) / 2 / ch, hc: (minX + maxX) / 2 / cw, bc: (maxY + 1) / ch };
        _mobAnchorCache[key] = res;
        return res;
    } catch (e) { return fallback; }
}

// 擊殺粒子爆裂：在 killMob 標記死亡後、重繪前呼叫（此時格子 DOM 仍在）
function vfxKill(mob) {
    try {
        if (!mob) return;
        if (document.hidden) return;   // 🌙 v3.6.03 分頁隱藏：死亡殘影/粒子/致命數字全跳過（掛網擊殺最頻繁·殘影幀步進 interval 在背景被節流到 1/分鐘＝每隻殘影卡場數分鐘）
        if (typeof state !== 'undefined' && state.ff && !state.ffSmall) return;   // 🚀 v3.2.65 背景補跑不播擊殺特效 → 🩹 v3.4.49 小補跑(≤2秒·前景微卡頓 GC/存檔造成)放行：死亡殘影仍受 _deathGhostCount<12 節流·長補跑維持靜音免回前景爆量
        // 🎚️ v3.0.1 關閉特效時「保留死亡動畫」：不再整個 return，改為只擋「傷害數字/頭目閃光」等純裝飾（見下），死亡序列殘影(death_*.png)＋死亡特效層(death_effect)照播＝怪物死亡畫面不消失
        let ml = document.getElementById('mob-list');
        let slot = ml && ml.querySelector('.mob-target[data-uid="' + mob.uid + '"]');
        if (!slot) return;
        let box = slot.querySelector('.mob-img-inner') || slot.querySelector('.mob-img-wrap') || slot;   // 🎯 v2.6.41 VFX 錨定「圖層 .mob-img-inner」(帶 translateY/scale·getBoundingClientRect 反映實際位置) 而非「容器 .mob-img-wrap」→修 v2.6.39 單排景深(後排上移30px/前排放大1.55)後 死亡殘影/擊殺特效/傷害數字 錯位
        let r = box.getBoundingClientRect();
        if (r.width === 0) return;
        let _anc = _mobImgAnchor(box.querySelector('img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)'));   // 🎯 v2.6.45 錨到怪物實體視覺中心(非方框中心)→爆裂/數字落在怪身上
        let bcx = r.left + r.width / 2, bcy = r.top + r.height / 2;   // 方框幾何中心(殘影全圖覆蓋用)
        let cx = r.left + r.width * _anc.hc, cy = r.top + r.height * _anc.vc;   // 怪物身體中心(爆裂環/核心/粒子用)
        _vfxLastKillRect = { left: r.left, top: r.top, width: r.width, height: r.height };   // 供稀有掉落閃光定位
        let layer = _vfxLayer();
        // 🩸 致命一擊的傷害數字：死怪在下一幀渲染前已被 settleDeadMobs 移除→渲染側 HP-delta 抓不到，故在此(格子 DOM 仍在)補顯示，使龍騎士等「一/二擊秒殺」也看得到傷害
        if (!window.__vfxNumOff) { let _prev = (mob._vfxHp != null) ? mob._vfxHp : (mob.hp || 0);   // 🔢 v3.0.9 致命傷害數字改由「傷害數字開關」控制（獨立於特效）：數字開→即使關特效仍顯示致命傷害數字（死亡動畫本就照播）
          let _kdmg = Math.floor(_prev - mob.curHp);   // 自上次渲染以來累積傷害(含致命擊；curHp 可能為負＝溢殺，顯示實際打出的數值)
          let _kbig = mob._vfxBig; mob._vfxBig = false;   // 'crit'|'heavy'：致命擊的爆擊/重擊旗標仍在(渲染未重設)
          if (_kdmg > 0 && layer.childElementCount < 200) {
              let _kele = (mob.justHit && mob.justHit !== true) ? mob.justHit : 'normal';
              _vfxNumber(cx + (Math.random() * 26 - 13), r.top + r.height * Math.max(0.12, _anc.vc - 0.30), _kdmg, _kele, _kbig);   // 🎯 v2.6.45 數字浮於怪身上方(相對身體中心·非固定 0.40 方框位)
          }
        }
        let color = mob.boss ? '#ffd54f' : '#ff8a5c';
        // 🎞️ v2.6.93 有死亡序列(death_*.png)→殘影改播死亡動畫，並略過白光殘影/衝擊波環/核心爆閃/爆裂粒子（死亡幀本身已表達「被擊殺」，白光重疊反而髒）。無死亡動畫則維持原白閃表現。
        let _da = (typeof MOB_ANIM_8DIR !== 'undefined' && MOB_ANIM_8DIR.has(mob.n))
            ? (typeof _mob8Cache !== 'undefined' ? _mob8Cache[mob.n + '#' + (mob._face8Loaded != null ? mob._face8Loaded : 6)] : null)   // 🧭 v3.2.11 八方向怪：取當前面向的方向 cache（死亡殘影播該向 death 幀；無 weapon 層→下方 _da[_wk] 為 undefined 安全）
            : ((typeof _mobAnimCache !== 'undefined') ? _mobAnimCache[mob.n] : null);
        let _deathSeq = (_da && _da !== 'probing' && _da.death) ? _da.death : null;
        // ✨ 強化死亡表現（讓「怪物被消滅」更明顯）。🎬 v3.4.43 節流改看「死亡殘影專屬計數」_deathGhostCount<12（原 layer.childElementCount<150 會被跳字/法術粒子洪水誤擋→AoE 連殺時死亡幀有時不播）；上限 12≈前後排 5 格 × 2 波重疊 + 餘裕。
        if (_deathGhostCount < 12) {
            // 1) 死亡殘影：複製怪物圖像 → 白化＋放大＋淡出（強烈的「被抹除」感）
            try {
                let _img = box.querySelector('img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)');
                if (_deathSeq && _img && _img.src && _img.naturalWidth !== 0) {   // 🚫 v2.7.49 只在有死亡序列幀(anim)時播殘影；移除靜態怪的 CSS 白閃殘影
                    let gh = document.createElement('img');
                    gh.className = 'vfx-ghost'; gh.src = _img.src;
                    // 🎯 v3.1.67 殘影尺寸/位置錨到「本體 img 實際 rect」而非 .mob-img-inner 方框：max-height 讓動畫怪 img 溢出方框(如哈維 185px img vs 112px 帶高)時，用方框尺寸會把死亡殘影 object-fit:contain 縮回帶高＝死亡瞬間變小。改用 img rect→殘影與生前本體同尺寸同位。方框為 0/未載入時退回原方框值。
                    let _ir = _img.getBoundingClientRect();
                    let _grx = _ir.width > 0 ? (_ir.left + _ir.width / 2) : bcx, _gry = _ir.width > 0 ? (_ir.top + _ir.height / 2) : bcy;
                    let _grw = _ir.width > 0 ? _ir.width : r.width, _grh = _ir.width > 0 ? _ir.height : r.height;
                    gh.style.left = _grx + 'px'; gh.style.top = _gry + 'px';   // 殘影＝整張圖複製→定位本體 img 中心以完整覆蓋原圖(對齊)
                    gh.style.width = _grw + 'px'; gh.style.height = _grh + 'px';
                    gh.style.transformOrigin = (_anc.hc * 100).toFixed(1) + '% ' + (_anc.vc * 100).toFixed(1) + '%';   // 🎯 v2.6.45 放大自「怪物身體中心」擴散(非方框中心)→白閃由怪身發散
                    layer.appendChild(gh);
                    if (_deathSeq) {   // 🎞️ v2.6.86 死亡序列（death_*.png）：殘影原位逐幀播一輪→短淡出（取代白閃；怪卡本體照常移除）
                        _deathGhostCount++;   // 🎬 v3.4.43 專屬節流：生殘影 +1；淡出結束/保險回收擇一 _release() 保證只減一次
                        let _fint = null, _fallback = null, _fades = [], _ghW = [];
                        let _release = _vfxTrackCleanup(() => {
                            clearInterval(_fint);
                            if (_fallback) _fallback();
                            _fades.forEach(a => a.cancel());
                            gh.remove();
                            _ghW.forEach(W => W.el.remove());
                            _deathGhostCount = Math.max(0, _deathGhostCount - 1);
                        });
                        gh.src = _deathSeq[0].src;
                        // ⚔️ v2.7.44 死亡殘影武器層(death_w/death_w2·screen 疊上)：與 body death 同鐘逐幀(--multi 共畫布同幾何)·如爆彈花爆炸(僅 death_w)/龍死亡火焰。嚴格 1:1(本幀無 _w 幀→不換 src)。
                        for (let _wk of ['weapon', 'weapon2']) {
                            let _wd = _da[_wk] && _da[_wk].death;
                            if (_wd && _wd.length && _wd[0]) {
                                let g2 = document.createElement('img');
                                g2.className = 'vfx-ghost'; g2.src = _wd[0].src;
                                g2.style.left = gh.style.left; g2.style.top = gh.style.top;
                                g2.style.width = gh.style.width; g2.style.height = gh.style.height;
                                g2.style.transformOrigin = gh.style.transformOrigin;
                                g2.style.mixBlendMode = 'screen';
                                layer.appendChild(g2);
                                _ghW.push({ el: g2, seq: _wd });
                            }
                        }
                        let _fi = 0;
                        _fint = setInterval(() => {
                            if (!_vfxCleanups.has(_release)) return;
                            _fi++;
                            if (_fi < _deathSeq.length) { gh.src = _deathSeq[_fi].src; _ghW.forEach(W => { if (W.seq[_fi]) W.el.src = W.seq[_fi].src; }); }
                            else {
                                clearInterval(_fint);
                                try {
                                    for (let el of [gh, ..._ghW.map(W => W.el)]) _fades.push(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out' }));
                                    _fades[0].onfinish = _release;
                                } catch (e) { _release(); }
                            }
                        }, 1000 / MOB_ANIM_FPS);
                        _fallback = _vfxTimeout(_release, _deathSeq.length * (1000 / MOB_ANIM_FPS) + 2000);
                    }   // 🚫 v2.7.49 移除無死亡序列時的 CSS 白閃殘影 else 分支
                } else if (_img && _img.src && _img.naturalWidth !== 0 && typeof MOB_ANIM_NAMES !== 'undefined' && MOB_ANIM_NAMES.has(mob.n)) {
                    // 🩹 v3.4.49 死亡幀「應有而未就緒」的退場保底：動畫怪的 death 快取還在探測中(換圖後首殺)／八方向怪當前面向尚未載入 → 原本無殘影＝瞬消。
                    //   改用「最後一格可見幀淡出」(~0.4s·無白閃·不違反 v2.7.49 移除靜態白閃的決策——非名單靜態怪照舊)。計入 _deathGhostCount 同一節流。
                    _deathGhostCount++;
                    let gh2 = document.createElement('img'); gh2.className = 'vfx-ghost'; gh2.src = _img.src;
                    let _fgFade = null, _fgTimer = null;
                    let _fgRelease = _vfxTrackCleanup(() => {
                        if (_fgTimer) _fgTimer();
                        if (_fgFade) _fgFade.cancel();
                        gh2.remove();
                        _deathGhostCount = Math.max(0, _deathGhostCount - 1);
                    });
                    let _ir2 = _img.getBoundingClientRect();
                    gh2.style.left = (_ir2.width > 0 ? (_ir2.left + _ir2.width / 2) : bcx) + 'px'; gh2.style.top = (_ir2.width > 0 ? (_ir2.top + _ir2.height / 2) : bcy) + 'px';
                    gh2.style.width = (_ir2.width > 0 ? _ir2.width : r.width) + 'px'; gh2.style.height = (_ir2.width > 0 ? _ir2.height : r.height) + 'px';
                    layer.appendChild(gh2);
                    _fgTimer = _vfxTimeout(_fgRelease, 900);
                    try { _fgFade = gh2.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-out' }); _fgFade.onfinish = _fgRelease; } catch (e) { _fgRelease(); }
                }
            } catch (e) {}
            // 🧊 v2.7.46 死亡多重特效：death_effect anchored 疊層(獨立時間軸·可比 body death 長·如冰之女王碎裂 body5幀/effect25幀)。錨定同 skill_effect：殘影錨在 box rect·offset×scale·screen 加亮。
            try {
                let _dfCfg = (typeof MOB_ANIM_DEATH_FX !== 'undefined') ? MOB_ANIM_DEATH_FX[mob.n] : null;
                if (_dfCfg) {
                    let _dfF = _preloadDeathFx(mob.n, _dfCfg.n);
                    let _dsx = r.width / _dfCfg.anchored.bw, _dsy = r.height / _dfCfg.anchored.bh;
                    let de = document.createElement('img'); de.className = 'vfx-spell'; de.style.mixBlendMode = 'screen';
                    de.src = _dfF[0].src;
                    de.style.width = (_dfCfg.ew * _dsx) + 'px'; de.style.height = (_dfCfg.eh * _dsy) + 'px';
                    de.style.left = (r.left + _dfCfg.anchored.ox * _dsx) + 'px'; de.style.top = (r.top + _dfCfg.anchored.oy * _dsy) + 'px';
                    layer.appendChild(de);
                    let _dfi = 0, _dfint = null, _dfTimer = null, _dfFade = null;
                    let _dfRelease = _vfxTrackCleanup(() => {
                        clearInterval(_dfint);
                        if (_dfTimer) _dfTimer();
                        if (_dfFade) _dfFade.cancel();
                        de.remove();
                    });
                    _dfint = setInterval(() => {
                        if (!_vfxCleanups.has(_dfRelease)) return;
                        _dfi++;
                        if (_dfi < _dfCfg.n) { if (_dfF[_dfi]) de.src = _dfF[_dfi].src; }
                        else { clearInterval(_dfint); try { _dfFade = de.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-out' }); _dfFade.onfinish = _dfRelease; } catch (e) { _dfRelease(); } }
                    }, 1000 / MOB_ANIM_FPS);
                    _dfTimer = _vfxTimeout(_dfRelease, _dfCfg.n * (1000 / MOB_ANIM_FPS) + 2000);
                }
            } catch (e) {}
            // 🚫 v2.7.49 此死亡路徑不再畫衝擊波環(vfx-killring)/核心爆閃(vfx-particle)——只保留死亡序列幀 anim
            // 📝 v3.5.94 澄清：被刪掉的只有 .vfx-killring 樣式(v3.5.83)；.vfx-particle 樣式仍存活且被 _vfxProjectile 等使用，勿當死 CSS 清掉
        }
        // 🚫 v2.7.49 此死亡路徑不再畫爆裂粒子(vfx-particle)——只保留死亡序列幀 anim（.vfx-particle 樣式本身仍在使用，見上方 v3.5.94 註）
        if (!window.__vfxOff && mob.boss) {   // 👑 頭目擊殺：戰場金白閃光（🎚️ v3.0.1 純裝飾→關閉特效時不閃）
            let bv = document.getElementById('battle-view'); let br = bv && bv.getBoundingClientRect();
            if (br && br.width > 0) {
                let fl = document.createElement('div'); fl.className = 'vfx-areaflash';
                fl.style.left = br.left + 'px'; fl.style.top = br.top + 'px'; fl.style.width = br.width + 'px'; fl.style.height = br.height + 'px';
                fl.style.background = 'radial-gradient(circle, rgba(255,255,255,.6), rgba(255,213,79,.25) 45%, rgba(255,213,79,0) 75%)';
                fl.style.animation = 'vfxBossFlash .7s ease-out forwards';
                layer.appendChild(fl); fl.addEventListener('animationend', () => fl.remove(), { once: true }); _vfxTimeout(() => { if (fl.parentNode) fl.remove(); }, 1200);
            }
        }
    } catch (e) {}
}
// 升級慶祝：金色擴散圓環 + 上升文字 + 戰場金光 + 金色火花
function vfxLevelUp() {
    try {
        if (_vfxMute()) return;
        let bv = document.getElementById('battle-view');
        let r = bv ? bv.getBoundingClientRect() : null;
        if (!r || r.width === 0) { let hb = document.getElementById('bar-hp'); r = hb ? hb.getBoundingClientRect() : null; }
        if (!r || r.width === 0) return;
        let cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
        let layer = _vfxLayer();
        if (bv && bv.getBoundingClientRect().width > 0) {
            let br = bv.getBoundingClientRect();
            let fl = document.createElement('div'); fl.className = 'vfx-areaflash';
            fl.style.left = br.left + 'px'; fl.style.top = br.top + 'px'; fl.style.width = br.width + 'px'; fl.style.height = br.height + 'px';
            fl.style.background = 'radial-gradient(circle, rgba(255,213,79,.42), rgba(255,213,79,0) 70%)';
            fl.style.animation = 'vfxLvFlash .9s ease-out forwards';
            layer.appendChild(fl); fl.addEventListener('animationend', () => fl.remove(), { once: true }); _vfxTimeout(() => { if (fl.parentNode) fl.remove(); }, 1500);
        }
        for (let i = 0; i < 2; i++) {
            let ring = document.createElement('div'); ring.className = 'vfx-lvring';
            let sz = 90 + i * 44;
            ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; ring.style.width = sz + 'px'; ring.style.height = sz + 'px';
            ring.style.animation = 'vfxLvRing ' + (0.7 + i * 0.15) + 's ease-out forwards';
            layer.appendChild(ring); ring.addEventListener('animationend', () => ring.remove(), { once: true }); _vfxTimeout(() => { if (ring.parentNode) ring.remove(); }, 1500);
        }
        let t = document.createElement('div'); t.className = 'vfx-lvtext';
        t.style.left = cx + 'px'; t.style.top = cy + 'px'; t.style.fontSize = '26px';
        t.textContent = 'LEVEL UP!  Lv.' + player.lv;
        t.style.animation = 'vfxLvText 1.5s ease-out forwards';
        layer.appendChild(t); t.addEventListener('animationend', () => t.remove(), { once: true }); _vfxTimeout(() => { if (t.parentNode) t.remove(); }, 2200);
        let n = 18;
        for (let i = 0; i < n; i++) {
            let sp = document.createElement('div'); sp.className = 'vfx-particle';
            let sz = 4 + Math.random() * 4; sp.style.width = sz + 'px'; sp.style.height = sz + 'px';
            sp.style.left = cx + 'px'; sp.style.top = cy + 'px'; sp.style.background = '#ffd54f'; sp.style.boxShadow = '0 0 7px #ffca28';
            layer.appendChild(sp);
            let ang = Math.PI * 2 * (i / n) + Math.random() * 0.4; let dist = 60 + Math.random() * 70;
            let dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
            sp.animate(
                [ { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                  { transform: 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px)) scale(.2)', opacity: 0 } ],
                { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.15,.7,.3,1)' }
            ).onfinish = () => sp.remove();
        }
    } catch (e) {}
}
// 取得某怪物格的螢幕矩形（不存在/未布局回 null）
function _vfxSlotRect(uid) {
    let ml = document.getElementById('mob-list');
    let slot = ml && ml.querySelector('.mob-target[data-uid="' + uid + '"]');
    if (!slot) return null;
    let box = slot.querySelector('.mob-img-inner') || slot.querySelector('.mob-img-wrap') || slot;   // 🎯 v2.6.41 VFX 錨定「圖層 .mob-img-inner」(帶 translateY/scale·getBoundingClientRect 反映實際位置) 而非「容器 .mob-img-wrap」→修 v2.6.39 單排景深(後排上移30px/前排放大1.55)後 死亡殘影/擊殺特效/傷害數字 錯位
    let r = box.getBoundingClientRect();
    return (r.width > 0) ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
}
// 魔法拋射物：從施法者飛向目標（v3.0.49：玩家變身 sprite 顯示中→sprite 胸口·否則戰場底部中央）→ 抵達時小火花為止。
// 📝 v3.5.94 修正說謊註解：原句寫「衝擊環/數字由渲染側負責」，但命中衝擊環自 v3.0.104 取消(_vfxImpact 死碼 v3.5.48 清除、.vfx-ring CSS v3.5.83 清除)已無任何環可畫；
//    現況只有傷害數字由渲染側負責——`_vfxQueueDmg` 收集 HP 差入佇列、`_vfxFlush` 在格子重建後生成飄字——本函式刻意不畫數字以免與其重疊。
//    要新增命中環請自己實作，別以為有現成 class 可接。（🔧 v3.5.95 更正：v3.5.94 這句原本寫「_vfxFlushDmg」，該符號全專案不存在。）
function _vfxProjectile(rect, ele) {
    try {
        if (window.__vfxOff || !rect) return;
        let bv = document.getElementById('battle-view'); let br = bv && bv.getBoundingClientRect();
        if (!br || br.width === 0) return;
        let layer = _vfxLayer();
        if (layer.childElementCount > 120) return;
        let sx = br.left + br.width / 2, sy = br.bottom - 10;
        let _pcr = (typeof _pmCasterRect === 'function') ? _pmCasterRect() : null;   // 🧝 v3.0.49 玩家變身 sprite 顯示中→由 sprite 胸口發射
        if (_pcr) { sx = _pcr.left + _pcr.width / 2; sy = _pcr.top + _pcr.height * 0.35; }
        let tx = rect.left + rect.width / 2, ty = rect.top + rect.height * 0.45;
        let isAxe = (ele === 'axe');
        let col = isAxe ? '#cbd5e1' : (_VFX_ELE_COLOR[ele] || '#ce93d8');
        let orb = document.createElement('div'); orb.className = 'vfx-particle';
        let osz = isAxe ? 18 : 15; orb.style.width = osz + 'px'; orb.style.height = osz + 'px';
        orb.style.left = sx + 'px'; orb.style.top = sy + 'px';
        orb.style.background = isAxe ? 'radial-gradient(circle, #f8fafc 25%, #94a3b8 78%, rgba(0,0,0,0) 100%)' : 'radial-gradient(circle, #fff 10%, ' + col + ' 55%, rgba(0,0,0,0) 100%)';
        orb.style.boxShadow = isAxe ? '0 0 8px #cbd5e1' : ('0 0 14px ' + col + ', 0 0 26px ' + col);
        layer.appendChild(orb);
        let dx = tx - sx, dy = ty - sy;
        let _endTf = 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px)) scale(1.05)' + (isAxe ? ' rotate(720deg)' : '');
        let anim = orb.animate(
            [ { transform: 'translate(-50%,-50%) scale(.7)' + (isAxe ? ' rotate(0deg)' : ''), opacity: .85 },
              { transform: _endTf, opacity: 1 } ],
            { duration: 180, easing: 'cubic-bezier(.45,.05,.7,1)' }
        );
        anim.onfinish = () => {
            orb.remove();
            for (let i = 0; i < 4; i++) {
                let sp = document.createElement('div'); sp.className = 'vfx-particle';
                let sz = 3 + Math.random() * 3; sp.style.width = sz + 'px'; sp.style.height = sz + 'px';
                sp.style.left = tx + 'px'; sp.style.top = ty + 'px'; sp.style.background = col; sp.style.boxShadow = '0 0 5px ' + col;
                layer.appendChild(sp);
                let ang = Math.PI * 2 * Math.random(), dist = 16 + Math.random() * 20;
                let ex = Math.cos(ang) * dist, ey = Math.sin(ang) * dist;
                sp.animate([ { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + ex.toFixed(1) + 'px), calc(-50% + ' + ey.toFixed(1) + 'px)) scale(.2)', opacity: 0 } ], { duration: 260 + Math.random() * 160, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => sp.remove();
            }
        };
    } catch (e) {}
}
// castSkill 包裝用：對本次施法「掉了血」的怪各射一發拋射物（before=施法前 HP/位置快照）
function _vfxCastProjectiles(before, ele) {
    if (window.__vfxOff || !before) return;
    let e = (ele && ele !== 'none') ? ele : 'magic';
    for (const b of before) {
        if (!b) continue;
        let m = mapState.mobs.find(x => x && x.uid === b.uid);
        let alive = m && !m._dead;
        let hp = alive ? m.curHp : 0;
        if (hp < b.hp) {   // 這隻吃到傷害
            let rect = alive ? _vfxSlotRect(b.uid) : b.rect;   // 活著→現位置；被殺→施法前位置
            if (rect) _vfxProjectile(rect, e);
        }
    }
}
// ===== 🏹 弓箭投射物（v3.2.8 建立·v3.2.12 改 8 方向朝目標）：一般攻擊持弓者→目標，飛出一支箭矢 sprite =====
//   素材＝天堂 66-0..7.spr 的箭本體（frame0·已剝除原圖烙印的地面影子·見 tools 說明）→ assets/fx/箭矢/arrow_d0..7.png。
//   8 方向羅盤同 _vec2dir（0=NW 1=N 2=NE 3=E 4=SE 5=S 6=SW 7=W）·箭圖本身即指向該方位（不旋轉·飛行方向=箭頭朝向）。
//   ⚠️ v3.2.12 用戶：改「依射手 sprite→目標格的螢幕向量選最近的 8 方向」——取代 v3.2.8「依射手身份選朝左上/右上兩張」。
//      （原 v3.2.8 註記「別修正成依目標方位」已由用戶明令反轉：現在就是要箭真正朝敵人位置飛。）
const ARROW_FX_MS = 200;      // 飛行時間（略長於法術拋射物 180ms→箭矢看得出軌跡）
let _arrowFxCache = {};       // dir(0-7) → Image（預載·避免首發閃爍）
(function _preloadArrowFx() { for (let d = 0; d < 8; d++) { let im = new Image(); im.src = 'assets/fx/箭矢/arrow_d' + d + '.png'; _arrowFxCache[d] = im; } })();
// 持弓的一般攻擊呼叫（js/04 playerAttack／js/03 rapidfireProc／js/06 allyAttackOnce／allyRapidfire）
//   delayMs：連射每箭錯開發射，免得整束箭疊在同一條線上
function playArrowFx(who, target, delayMs) {
    try {
        if (_vfxMute() || !who || !target) return;   // 🚀 v3.2.65 補跑期間不生成箭矢（避免回前景爆量）
        if (who !== player) return;   // 🏹 v3.2.65 傭兵/隊員 sprite 位置動態難可靠對位（發射點常錯位）→僅玩家射出可見箭矢，傭兵不播（傷害判定不受影響）
        let wpn = (who.eq && who.eq.wpn) ? DB.items[who.eq.wpn.id] : null;
        if (!wpn || !wpn.isBow) return;   // 非弓（含空手/近戰）→ 不射箭
        let fire = () => {
            let rect = _vfxSlotRect(target.uid); if (!rect) return;
            let layer = _vfxLayer(); if (layer.childElementCount > 120) return;
            // 發射點：射手 sprite 的上半身；無 sprite（舊檔無 avatar／職業動畫未載入）→ 戰鬥區底部中央
            let sx, sy, sr = _partyMemberRect(who);
            if (sr) { sx = sr.left + sr.width / 2; sy = sr.top + sr.height * 0.35; }
            else {
                let bv = document.getElementById('battle-view'), br = bv && bv.getBoundingClientRect();
                if (!br || br.width === 0) return;
                sx = br.left + br.width / 2; sy = br.bottom - 10;
            }
            let tx = rect.left + rect.width / 2, ty = rect.top + rect.height * 0.45;
            // 🏹 v3.2.12 依射手→目標螢幕向量選 8 方向箭圖（箭頭即朝目標）
            let _dir = (typeof _vec2dir === 'function') ? _vec2dir(tx - sx, ty - sy) : 0;
            let img = _arrowFxCache[_dir]; if (!img) return;
            let el = document.createElement('img');
            el.className = 'vfx-arrow'; el.src = img.src; el.alt = ''; el.draggable = false;
            el.style.left = sx + 'px'; el.style.top = sy + 'px';
            layer.appendChild(el);
            let dx = tx - sx, dy = ty - sy;
            el.animate(
                [ { transform: 'translate(-50%,-50%)', opacity: .95 },
                  { transform: 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px))', opacity: 1 } ],
                { duration: ARROW_FX_MS, easing: 'cubic-bezier(.35,.05,.6,1)' }
            ).onfinish = () => el.remove();
        };
        if (delayMs > 0) _vfxTimeout(fire, delayMs); else fire();
    } catch (e) {}
}
// 稀有掉落（潘朵拉權重=1）：金色名稱上升 + 金色星芒火花，定位於剛擊殺的怪物格
function vfxRareDrop(name) {
    try {
        if (_vfxMute()) return;
        let rect = _vfxLastKillRect;
        if (!rect || rect.width === 0) { let bv = document.getElementById('battle-view'); let br = bv && bv.getBoundingClientRect(); if (br && br.width > 0) rect = { left: br.left, top: br.top, width: br.width, height: br.height }; }
        if (!rect) return;
        let cx = rect.left + rect.width / 2, cy = rect.top + rect.height * 0.4;
        let layer = _vfxLayer();
        let t = document.createElement('div'); t.className = 'vfx-lvtext';
        t.style.left = cx + 'px'; t.style.top = cy + 'px'; t.style.fontSize = '20px'; t.style.color = '#ffe08a';
        t.textContent = '✦ ' + (name || '稀有掉落') + ' ✦';
        t.style.animation = 'vfxLvText 1.6s ease-out forwards';
        layer.appendChild(t); t.addEventListener('animationend', () => t.remove(), { once: true }); _vfxTimeout(() => { if (t.parentNode) t.remove(); }, 2300);
        let n = 16;
        for (let i = 0; i < n; i++) {
            let sp = document.createElement('div'); sp.className = 'vfx-particle';
            let sz = 4 + Math.random() * 4; sp.style.width = sz + 'px'; sp.style.height = sz + 'px';
            sp.style.left = cx + 'px'; sp.style.top = cy + 'px'; sp.style.background = '#ffe082'; sp.style.boxShadow = '0 0 8px #ffca28, 0 0 14px #ffb300';
            layer.appendChild(sp);
            let ang = Math.PI * 2 * (i / n) + Math.random() * 0.4, dist = 40 + Math.random() * 55;
            let dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 8;
            sp.animate([ { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px)) scale(.2)', opacity: 0 } ], { duration: 600 + Math.random() * 350, easing: 'cubic-bezier(.15,.7,.3,1)' }).onfinish = () => sp.remove();
        }
    } catch (e) {}
}
// 玩家受到較大一擊：戰場輕微震動 + HP 條紅閃
function vfxPlayerHit(dmg) {
    try {
        if (_vfxMute()) return;
        let frac = (player && player.mhp) ? dmg / player.mhp : 0;
        if (frac < 0.10) return;   // 只在 ≥10% 最大HP 的一擊才震，避免每下都晃
        let bv = document.getElementById('battle-view');
        _vfxRestartCss(bv, 'vfx-shake', 'vfxShake');
        let bar = document.getElementById('bar-hp'); bar = bar && bar.parentElement;
        _vfxRestartCss(bar, 'vfx-hurt', 'vfxHurt');
    } catch (e) {}
}
// 🗡️ 怪物施法震動（死亡騎士施法時整個戰場輕微震動·cosmetic-only·吃 __vfxOff·重用 vfx-shake 動畫）
function vfxCastShake() {
    try {
        if (_vfxMute()) return;
        let bv = document.getElementById('battle-view');
        _vfxRestartCss(bv, 'vfx-shake', 'vfxShake');
    } catch (e) {}
}

// 🐉 v3.4.6 頭目降臨特效（四大龍＋吉爾塔斯／冥皇丹特斯出場）：全屏屬性染色閃光＋衝擊波環×3＋暗角脈衝＋名條＋強力震動。
//   cosmetic-only（不改任何數值·全程 try/catch·吃 __vfxOff 與補跑 state.ff）；掛點＝js/03 spawnMob 生成頭目後、renderMobs 前。
//   overlay 皆錨定 #battle-view rect（不依賴怪卡 DOM·先讀 rect 再震動→閃光/名條停在靜止位、戰場內容在其下震動）。每名 2 秒去重防同 tick 重觸。
const BOSS_ENTRANCE_FX = {
    '安塔瑞斯':                 { a: '#e6c15a', b: '#7c4a1e', label: '大地之龍　安塔瑞斯' },
    '法利昂':                   { a: '#38bdf8', b: '#075985', label: '深淵之龍　法利昂' },
    '巴拉卡斯':                 { a: '#ff6a2a', b: '#9a1616', label: '炎之龍王　巴拉卡斯' },
    '林德拜爾':                 { a: '#6ff0d6', b: '#0f766e', label: '暴風之龍　林德拜爾' },
    // 🐉 v3.7.57 侵蝕的安塔瑞斯巢穴：三形態遞進配色（大地→血怒→瘋狂）＋三王
    '被侵蝕的安塔瑞斯':         { a: '#fcd34d', b: '#92400e', label: '侵蝕之龍　被侵蝕的安塔瑞斯' },
    '被侵蝕的狂怒安塔瑞斯':     { a: '#fb923c', b: '#9a3412', label: '狂怒之龍　被侵蝕的狂怒安塔瑞斯' },
    '被侵蝕的瘋狂安塔瑞斯':     { a: '#f87171', b: '#7f1d1d', label: '瘋狂之龍　被侵蝕的瘋狂安塔瑞斯' },
    '喀瑪焰王':                 { a: '#93c5fd', b: '#1e3a8a', label: '喀瑪焰王' },
    '喀瑪南王':                 { a: '#fca5a5', b: '#7f1d1d', label: '喀瑪南王' },
    '喀瑪王':                   { a: '#e7e5e4', b: '#44403c', label: '喀瑪王' },
    '吉爾塔斯':                 { a: '#2dd4f0', b: '#7c3aed', label: '異界霸主　吉爾塔斯' },
    '真‧死亡騎士 冥皇丹特斯':   { a: '#c98bff', b: '#4c1d95', label: '冥皇　丹特斯' },
    // 🌅 日出之國頭目（變身鏈各階段皆播·doMobTransform 亦呼叫）
    '白面金毛九尾狐・玉藻':     { a: '#c084fc', b: '#701a75', label: '白面金毛九尾狐　玉藻' },
    '白面金毛九尾狐・九尾':     { a: '#fbbf24', b: '#b45309', label: '白面金毛九尾狐　九尾' },
    '白面金毛九尾狐・殺生石':   { a: '#a8a29e', b: '#44403c', label: '白面金毛九尾狐　殺生石' },
    '牛鬼':                     { a: '#a3e635', b: '#3f6212', label: '大妖　牛鬼' },
    '巨大骷髏':                 { a: '#7dd3fc', b: '#1e3a8a', label: '巨大骷髏　餓者髑髏' },
};
// 🐉 v3.4.95 出場特效全頭目通用：BOSS_ENTRANCE_FX 未註冊的 boss:true 走屬性配色後備（名條=怪名）·名單保留給有專屬稱號/配色者
const _BOSS_ENTRANCE_ELE = {
    fire:  { a: '#ff6a2a', b: '#9a1616' },
    water: { a: '#38bdf8', b: '#075985' },
    wind:  { a: '#6ff0d6', b: '#0f766e' },
    earth: { a: '#e6c15a', b: '#7c4a1e' },
};
let _bossEntranceLast = {};
function vfxBossEntrance(mob, opts) {
    try {
        if (!mob || window.__vfxOff || document.hidden) return;   // 🌙 v3.6.03 分頁隱藏不播出場特效（閃光/暗角/名條多元素·背景中無法回收）
        if (typeof state !== 'undefined' && state.ff && !state.ffSmall) return;   // 🩹 v3.4.97 比照 vfxKill(v3.4.49)：前景微卡頓的小補跑(≤2秒)放行——變身/出怪常落在補跑批次·原 _vfxMute 一律靜音＝「變身名條有時不出現」主因；長背景補跑維持靜音（2 秒同名去重防爆量）
        let cfg = BOSS_ENTRANCE_FX[mob.n];
        if (!cfg) {
            if (!mob.boss) return;
            cfg = _BOSS_ENTRANCE_ELE[mob.e] || { a: '#f87171', b: '#7f1d1d' };   // 無屬性頭目＝深紅
        }
        let now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (_bossEntranceLast[mob.n] && now - _bossEntranceLast[mob.n] < 2000) return;   // 同名 2 秒去重（防同 tick 重觸；正常重生>5秒不受影響）
        _bossEntranceLast[mob.n] = now;
        let bv = document.getElementById('battle-view');
        if (!bv || bv.classList.contains('hidden')) return;
        let r = bv.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;   // 戰鬥區不可見（村莊）→不播
        let layer = _vfxLayer();
        let cx = r.left + r.width / 2, cy = r.top + r.height * 0.55;
        let boxCss = 'position:absolute;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;pointer-events:none;border-radius:6px;';

        // 1) 強力螢幕震動（#battle-view·rect 已於震動前讀取→overlay 停靜止位）
        _vfxRestartCss(bv, 'vfx-bossshake', 'vfxBossShake');

        // 2) 全屏屬性染色閃光（screen 加亮·自中心爆閃淡出）
        let flash = document.createElement('div');
        flash.style.cssText = boxCss + 'mix-blend-mode:screen;background:radial-gradient(circle at 50% 55%, ' + cfg.a + ' 0%, ' + cfg.b + '66 34%, transparent 70%);';
        layer.appendChild(flash);
        flash.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.12 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => flash.remove();

        // 3) 暗角脈衝（聚焦感）
        let vig = document.createElement('div');
        vig.style.cssText = boxCss + 'background:radial-gradient(circle at 50% 55%, transparent 28%, rgba(0,0,0,.74) 100%);';
        layer.appendChild(vig);
        vig.animate([{ opacity: 0 }, { opacity: 1, offset: 0.22 }, { opacity: 0 }], { duration: 1000, easing: 'ease-out' }).onfinish = () => vig.remove();

        // 4) 屬性色衝擊波環 ×3（自中心擴散）
        for (let i = 0; i < 3; i++) {
            let ring = document.createElement('div');
            ring.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:44px;height:44px;border-radius:50%;transform:translate(-50%,-50%);border:5px solid ' + cfg.a + ';box-shadow:0 0 24px ' + cfg.a + ',inset 0 0 14px ' + cfg.a + ';pointer-events:none;';
            layer.appendChild(ring);
            let scale = 8 + i * 4;
            ring.animate([
                { transform: 'translate(-50%,-50%) scale(0.3)', opacity: 0.9 },
                { transform: 'translate(-50%,-50%) scale(' + scale + ')', opacity: 0 }
            ], { duration: 820 + i * 150, delay: i * 110, easing: 'cubic-bezier(.15,.6,.3,1)' }).onfinish = () => ring.remove();
        }

        // 5) BOSS 名條（大字·縮放飛入→定格→淡出）
        let banner = document.createElement('div');
        banner.className = 'vfx-boss-banner';
        banner.style.left = cx + 'px';
        banner.style.top = (r.top + r.height * 0.30) + 'px';
        banner.style.color = cfg.a;
        banner.style.textShadow = '0 0 10px ' + cfg.a + ', 0 0 24px ' + cfg.b + ', 0 2px 5px #000';
        banner.innerHTML = '<div class="vfx-boss-sub">' + ((opts && opts.sub) || '◈　頭 目 降 臨　◈') + '</div><div class="vfx-boss-name">' + ((opts && opts.name) || ((cfg.label || mob.n) + '　現身！')) + '</div>';   // 🌅 v3.4.95 opts 覆寫名條（變身自訂文字用）
        layer.appendChild(banner);
        banner.animate([
            { opacity: 0, transform: 'translate(-50%,-50%) scale(1.65)' },
            { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.2 },
            { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.76 },
            { opacity: 0, transform: 'translate(-50%,-50%) scale(1.08)' }
        ], { duration: 1750, easing: 'ease-out' }).onfinish = () => banner.remove();
    } catch (e) {}
}

// 🔥 v3.4.15 頭目狂暴爆發：沿用「頭目降臨」的戰場名條語言，改成猩紅閃光、衝擊環與火星。
//   此函式只負責一次性視覺；持續氣焰由 .mob-raging CSS 控制，提示／進出狂暴狀態由 renderMobs 的轉場偵測負責。
let _bossRageLast = new WeakMap();   // 怪物離場後不保留每次重生的 uid。
function vfxBossRage(mob) {
    try {
        if (!mob || window.__vfxOff) return;
        if (typeof state !== 'undefined' && state.ff && !state.ffSmall) return;   // 🩹 v3.4.97 同 vfxBossEntrance：狂暴也是傷害觸發·小補跑放行
        let cfg = BOSS_ENTRANCE_FX[mob.n];
        if (!cfg || !(Number(mob.rageHpPct) > 0)) return;
        let now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (_bossRageLast.has(mob) && now - _bossRageLast.get(mob) < 1200) return;
        _bossRageLast.set(mob, now);
        let bv = document.getElementById('battle-view');
        if (!bv || bv.classList.contains('hidden')) return;
        let r = bv.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        let layer = _vfxLayer();
        let cx = r.left + r.width / 2, cy = r.top + r.height * 0.55;
        let boxCss = 'position:absolute;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;pointer-events:none;border-radius:6px;';
        let a = '#fb3b45', b = '#7f1018';

        _vfxRestartCss(bv, 'vfx-bossshake', 'vfxBossShake');

        let flash = document.createElement('div');
        flash.style.cssText = boxCss + 'mix-blend-mode:screen;background:radial-gradient(circle at 50% 55%, #fff1a8 0%, ' + a + 'cc 15%, ' + b + '99 42%, transparent 73%);';
        layer.appendChild(flash);
        flash.animate([{ opacity: 0 }, { opacity: 1, offset: .10 }, { opacity: .35, offset: .34 }, { opacity: 0 }], { duration: 1050, easing: 'ease-out' }).onfinish = () => flash.remove();

        let vig = document.createElement('div');
        vig.style.cssText = boxCss + 'background:radial-gradient(circle at 50% 55%, transparent 23%, rgba(70,0,8,.38) 54%, rgba(0,0,0,.88) 100%);';
        layer.appendChild(vig);
        vig.animate([{ opacity: 0 }, { opacity: 1, offset: .18 }, { opacity: 0 }], { duration: 1250, easing: 'ease-out' }).onfinish = () => vig.remove();

        for (let i = 0; i < 4; i++) {
            let ring = document.createElement('div');
            ring.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:40px;height:40px;border-radius:50%;transform:translate(-50%,-50%);border:' + (5 - Math.min(i, 2)) + 'px solid ' + (i % 2 ? '#ffb347' : a) + ';box-shadow:0 0 26px ' + a + ',inset 0 0 16px ' + b + ';pointer-events:none;';
            layer.appendChild(ring);
            ring.animate([
                { transform: 'translate(-50%,-50%) scale(.2)', opacity: .98 },
                { transform: 'translate(-50%,-50%) scale(' + (8 + i * 3.4) + ')', opacity: 0 }
            ], { duration: 780 + i * 145, delay: i * 95, easing: 'cubic-bezier(.12,.65,.24,1)' }).onfinish = () => ring.remove();
        }

        for (let i = 0; i < 18; i++) {
            let spark = document.createElement('i');
            let ang = (Math.PI * 2 * i / 18) + Math.random() * .28;
            let dist = 75 + Math.random() * Math.min(210, r.width * .28);
            let size = 3 + Math.random() * 5;
            spark.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + (i % 3 ? a : '#ffd166') + ';box-shadow:0 0 10px ' + a + ';pointer-events:none;';
            layer.appendChild(spark);
            spark.animate([
                { transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1 },
                { transform: 'translate(calc(-50% + ' + Math.cos(ang) * dist + 'px),calc(-50% + ' + Math.sin(ang) * dist + 'px)) scale(.15)', opacity: 0 }
            ], { duration: 620 + Math.random() * 520, delay: 90 + Math.random() * 180, easing: 'cubic-bezier(.14,.66,.28,1)' }).onfinish = () => spark.remove();
        }

        let banner = document.createElement('div');
        banner.className = 'vfx-boss-banner vfx-rage-banner';
        banner.style.left = cx + 'px';
        banner.style.top = (r.top + r.height * .30) + 'px';
        banner.style.color = '#ffb4b9';
        banner.style.textShadow = '0 0 8px #fff1a8, 0 0 18px ' + a + ', 0 0 34px ' + b + ', 0 2px 5px #000';
        banner.innerHTML = '<div class="vfx-boss-sub">◆　頭 目 狂 暴　◆</div><div class="vfx-boss-name">' + (cfg.label || mob.n) + '　陷入狂暴！</div>';
        layer.appendChild(banner);
        banner.animate([
            { opacity: 0, transform: 'translate(-50%,-50%) scale(1.8)' },
            { opacity: 1, transform: 'translate(-50%,-50%) scale(.96)', offset: .17 },
            { opacity: 1, transform: 'translate(-50%,-50%) scale(1.04)', offset: .72 },
            { opacity: 0, transform: 'translate(-50%,-50%) scale(1.14)' }
        ], { duration: 1900, easing: 'ease-out' }).onfinish = () => banner.remove();
    } catch (e) {}
}

// 🎚️ 戰鬥特效開關（僅標題畫面提供；遊戲中不再出現）：玩家選擇持久化於 localStorage，載入時套用到 window.__vfxOff
const _VFX_PREF_KEY = 'lineage_vfx_off';
const _VFX_NUM_PREF_KEY = 'lineage_vfx_num_off';   // 🔢 v3.0.2 「只關傷害數字」獨立偏好
function _applyVfxPref() {
    let off = false;
    try { off = localStorage.getItem(_VFX_PREF_KEY) === '1'; } catch (e) {}
    window.__vfxOff = off;
    let b = document.getElementById('btn-vfx-toggle');
    if (b) {
        b.textContent = off ? '✨ 戰鬥特效：關閉' : '✨ 戰鬥特效：開啟';
        b.className = 'btn text-base w-72 py-2.5 ' + (off
            ? 'bg-rose-900 hover:bg-rose-800 border-rose-700'
            : 'bg-emerald-800 hover:bg-emerald-700 border-emerald-600');
    }
    // 🔢 v3.0.2 傷害數字獨立開關（與「戰鬥特效」互不影響：可全開只關數字）
    let numOff = false;
    try { numOff = localStorage.getItem(_VFX_NUM_PREF_KEY) === '1'; } catch (e) {}
    window.__vfxNumOff = numOff;
    let bn = document.getElementById('btn-vfxnum-toggle');
    if (bn) {
        bn.textContent = numOff ? '🔢 傷害數字：關閉' : '🔢 傷害數字：開啟';
        bn.className = 'btn text-base w-72 py-2.5 ' + (numOff
            ? 'bg-rose-900 hover:bg-rose-800 border-rose-700'
            : 'bg-emerald-800 hover:bg-emerald-700 border-emerald-600');
    }
}
function toggleVfxPref() {
    let off = !window.__vfxOff;
    try { localStorage.setItem(_VFX_PREF_KEY, off ? '1' : '0'); } catch (e) {}
    _applyVfxPref();
}
function toggleVfxNumPref() {   // 🔢 v3.0.2 切換「只關傷害數字」
    let off = !window.__vfxNumOff;
    try { localStorage.setItem(_VFX_NUM_PREF_KEY, off ? '1' : '0'); } catch (e) {}
    _applyVfxPref();
}

// ✨ VFX：包裝 castSkill → 對本次「攻擊魔法」施法中掉血的目標各射一發拋射物（用 HP 差比對，與內部實作無關；僅有屬性、非武器/投擲類技能觸發）
if (typeof castSkill === 'function' && !castSkill._vfxWrapped) {
    let _vfxOrigCastSkill = castSkill;
    castSkill = function (skId) {
        let sk = DB.skills[skId];
        let _pele = (sk && sk.ele && sk.ele !== 'none' && !sk.weaponDmg) ? sk.ele : (sk ? _VFX_PROJECTILE_SKILLS[skId] : null);   // 屬性攻擊魔法 ＋ 白名單投射技能(心靈破壞)；🧹 v3.5.87 刪 !sk.throwAxe 守衛：唯一 throwAxe 技能無 ele·永遠短路＝死碼
        if (_pele && sk && typeof SPELL_FX !== 'undefined' && SPELL_FX[sk.n]) _pele = null;   // 🎯 v3.1.29 有「動態圖投射物」(proj·光箭/冰箭/火箭)→免 CSS 投射；v3.1.31 放寬（用戶：究極光裂術有動態動畫也不用）＝技能只要有註冊任何 SPELL_FX 動態特效（含目標身上型 h/w）就不播 CSS 投射·只有「完全沒有動態特效」的技能保留 CSS 投射視覺
        let proj = !_vfxMute() && !!_pele;   // 🚀 v3.2.65 補跑期間(state.ff)不生成 CSS 投射物（避免回前景爆量）
        let before = null;
        if (proj) { before = mapState.mobs.map(m => (m && !m._dead) ? { uid: m.uid, hp: m.curHp, rect: _vfxSlotRect(m.uid) } : null); }
        let r = _vfxOrigCastSkill(skId);
        if (r) { try { if (typeof _playerMorphTrigger === 'function') _playerMorphTrigger('skill', skId); } catch (e) {} }   // 🧝 v3.0.105 施法動作只在「實際施放成功(r)」才播（修：自動恢復/維持技即使沒真的施放·仍每 tick 觸發施法動畫→sprite 卡在施法姿勢）
        if (proj) { try { _vfxCastProjectiles(before, _pele); } catch (e) {} }
        return r;
    };
    castSkill._vfxWrapped = true;
}

function _renderMobsImpl() {
    if(state.ff) return; // 補跑期間不刷新畫面
    _initMobListGuard();
    if(_mobPointerDown) { _mobRebuildPending = true; return; }   // 🚀 按住怪物卡期間延後重繪→點擊切換目標不被中斷
    let _slotHtmls = [], _rageTransitions = [];   // 🚀 改差異更新：先各格產生 html 字串，最後只重建有變動的格；狂暴只記錄「未啟用→啟用」轉場（🧹 v3.5.87 刪 _forceHit/hitClass 死碼：hitClass 自 v2.7.49 起恆空字串·受擊表現全由 _mobAnimTrigger('hurt') 序列幀負責·justHit 仍驅動 hurt 觸發與傷害數字）
    let _showMobEleFlag = (typeof _relicShowMobEle === 'function') && _relicShowMobEle();   // 🏺 巨大螞蟻的複眼：狀態直接顯示敵人屬性（一次計算·全格共用）

    let _back = backSlotsActive();                                   // 🆕 五格模式：原三格(前排)＋後排兩格
    let _order = _back ? [0, 1, 2, 3, 4] : [0, 1, 2];                // 🆕 v2.7.47 前排(0,1,2)由左而右→再後排(3,4)由左而右；視覺左右序＝目標鎖定序一致(不再交錯)
    for(let _k = 0; _k < _order.length; _k++) {
        let i = _order[_k];
        let m = mapState.mobs[i];
        let _rowCls = (i >= 3) ? ' mob-back' : (_back ? ' mob-front' : '');   // 後排/前排版位 class（三格模式不加→沿用原版面）
        if (m) {
            let act = (i === mapState.targetIdx) ? 'active' : '';
            let _mi = mobStillImg(m.n, m.img, true);   // 🎬 戰鬥初始幀：有動畫→優先 spawn_0（無 spawn 退 idle_0·再退舊靜態）；無動畫→舊靜態
            // 🎬 v2.6.94 受擊序列幀（hurt_*.png）：被擊中且該怪有 hurt 動畫→優先播一輪（非鎖定·可蓋掉攻擊/待機·不打斷登場/技能鎖定）。gate 在「確有 hurt 序列」避免無 hurt 的怪被誤清掉進行中的攻擊動作。
            // 🎯 v2.7.30 頭目受擊門檻（用戶要求）：頭目「只有被 重擊(_vfxBig='heavy') 或 爆擊(_vfxBig='crit')」才播 hurt——一般命中不打斷頭目的待機/攻擊/技能動作，維持頭目氣勢；非頭目維持「任何命中都播」。⚠️ _vfxBig 由本幀攻擊設(js/03:818 getPhysicalDmg 樞紐)·須在下一行 _vfxQueueDmg 重設它「之前」判斷。
            if (m.justHit && MOB_ANIM_NAMES.has(m.n) && (!m.boss || m._vfxBig === 'crit' || m._vfxBig === 'heavy' || m._spellHurt)) {
                if (typeof MOB_ANIM_8DIR !== 'undefined' && MOB_ANIM_8DIR.has(m.n)) { if (typeof _mobAnimTrigger === 'function') _mobAnimTrigger(m, 'hurt'); }   // 🧭 v3.2.11 八方向怪：cache 分方向存(通用 cache 為空)→逕觸發受擊(該怪必有 hurt·_mob8Apply 從方向 cache 取幀)
                else { let _ha = _mobAnimCache[m.n]; if (_ha && _ha !== 'probing' && _ha.hurt && typeof _mobAnimTrigger === 'function') _mobAnimTrigger(m, 'hurt'); }
            }   // 🎬 v3.0.14 _spellHurt：法術傷害也讓「頭目」播 hurt（一般怪本就任何命中都播·物理維持 v2.7.30 爆擊/重擊門檻·DoT/反射不標記→頭目不因持續傷害狂顫）
            try { _vfxQueueDmg(m); } catch(e){}   // ✨ VFX：用 HP 差捕捉本幀傷害（須在重設 justHit 前）
            m.justHit = false;
            m._spellHurt = false;

            // 🔥 頭目狂暴轉場：嚴格低於門檻且仍存活才啟用。丹特斯吸血回到門檻以上會解除，之後再次跌破可重新提示。
            let _rageNow = m.curHp > 0 && typeof mobRageActive === 'function' && mobRageActive(m);
            if (_rageNow && !m._rageFxActive) { m._rageFxActive = true; _rageTransitions.push(m); }
            else if (!_rageNow && m._rageFxActive) m._rageFxActive = false;

            let _badgeTags = '';
            let _eleBadge = (_showMobEleFlag && m.e && m.e !== 'none')
                ? `<span class="px-1 rounded text-[10px] font-bold border" style="color:${(typeof RELIC_ELE_COLOR !== 'undefined' && RELIC_ELE_COLOR[m.e]) || '#cbd5e1'};background:rgba(15,23,42,.72);border-color:${(typeof RELIC_ELE_COLOR !== 'undefined' && RELIC_ELE_COLOR[m.e]) || '#cbd5e1'};" title="敵人屬性（巨大螞蟻的複眼）">${(typeof RELIC_ELE_LABEL !== 'undefined' && RELIC_ELE_LABEL[m.e]) || ''}屬性</span>`
                : '';
            if(_showMobStatus && m.st) {   // 🩹 狀態開關關閉時不顯示異常狀態徽章
                let order = ['freeze','stun','stone','sleep','paralyze','bind','blind','weaken','disease','vacuum','broken','slow','mrhalf','magicseal','fragile','shatter','armorbreak','confuse','panic','guardbreak','terror','doom','muddywater'];   // 🕸️ v3.7.75 束縛（排在硬控類之後）   // 🔮 含脆弱、碎裂、🔧 破甲(黑妖破壞盔甲)、🔮 混亂/恐慌、🐉 護衛毀滅/恐懼/死神、🌊 污濁、⚡ 麻痺；中毒不顯示、出血改用 🩸 emoji（見下方圖片下方列）
                _badgeTags = order.filter(k => m.st[k] > 0).map(k =>
                    `<span class="px-1 rounded bg-purple-900/70 text-purple-200 text-[10px]">${STATUS_NAME[k]}</span>`).join(' ');
            }
            // 🐉 弱點曝光：以堆疊層數顯示（非 m.st，獨立 m.weakExpose）；🩹 狀態開關關閉時不顯示
            if(_showMobStatus && m.weakExpose > 0) _badgeTags = (_badgeTags ? _badgeTags + ' ' : '') + `<span class="px-1 rounded bg-amber-900/70 text-amber-200 text-[10px] font-bold">弱點${m.weakExpose}</span>`;
            // 🔮 席琳恩賜：名字下方常駐標誌（置於異常狀態列最前，不會被狀態列覆蓋）；🩹 狀態開關關閉時亦隱藏
            if(_showMobStatus && m._grace) _badgeTags = `<span class="px-1 rounded bg-red-950/80 grace-badge text-[10px] font-bold">席琳恩賜</span>` + (_badgeTags ? ' ' + _badgeTags : '');
            if(_showMobStatus && m._reflectWall && state.ticks <= m._reflectWall.until) { let _rwK = { melee: '近距離', ranged: '遠距離', magic: '魔法' }[m._reflectWall.kind] || ''; _badgeTags = `<span class="px-1 rounded ${m._reflectWall.block ? 'bg-violet-950/80 text-violet-300' : 'bg-red-950/80 text-red-300'} text-[10px] font-bold">${m._reflectWall.block ? '免疫' : '反射'}${_rwK}</span>` + (_badgeTags ? ' ' + _badgeTags : ''); }   // 🌅 恐怖的面貌（免疫·紫）／血壁空間（反射·紅）自增益徽章
            // 🔧 頭目標籤：BOSS 名字下方常駐金色「頭目」標籤（置於最前）；🩹 狀態開關關閉時亦隱藏
            if(_showMobStatus && m.boss) _badgeTags = `<span class="px-1 rounded bg-amber-900/80 text-amber-200 text-[10px] font-bold border border-amber-500/60">頭目</span>` + (_badgeTags ? ' ' + _badgeTags : '');
            if(_showMobStatus && _rageNow) _badgeTags = `<span class="px-1 rounded text-[10px] font-bold border" style="color:#fecdd3;background:rgba(127,29,29,.88);border-color:#fb7185;text-shadow:0 0 5px #ef4444;">狂暴</span>` + (_badgeTags ? ' ' + _badgeTags : '');
            if(_eleBadge) _badgeTags = _badgeTags ? (_badgeTags + ' ' + _eleBadge) : _eleBadge;
            // 徽章列固定常駐，狀態多時以完整徽章換行，避免「頭目」被壓成「頭」。
            let badges = `<div class="mob-badge-row">${_badgeTags}</div>`;
            // 🩹 狀態列（出血/猛爆毒/鈍擊/硬皮）：狀態開關關閉時清空內容（保留固定高度列避免版面跳動）
            let _statRow = !_showMobStatus ? '' : `${(m.bleeds && m.bleeds.length) ? `<span class="text-[11px] font-bold" style="display:inline-flex;align-items:center;line-height:1;" title="出血層數">🩸×${m.bleeds.length}</span>` : ''}${(m._burstPoison && m._burstPoison.left > 0) ? `<span class="text-[11px] font-bold" style="display:inline-flex;align-items:center;line-height:1;color:#a3e635;" title="猛爆劇毒：每秒100固定傷害（5秒）">💥毒</span>` : ''}${(m._bluntShow && state.ticks < m._bluntShow) ? `<span class="text-[11px] font-bold text-amber-300" style="display:inline-flex;align-items:center;line-height:1;" title="鈍擊：攻擊延遲中">🔨鈍</span>` : ''}${(m.hardSkin > 0) ? `<span class="text-[11px] font-bold text-stone-300" style="display:inline-flex;align-items:center;line-height:1;" title="硬皮值：額外物理減傷（魔法不減），可用鈍器/重擊消磨">🛡${m.hardSkin}</span>` : ''}`;

            let _hpBar = !_showMobHp ? '' : `<div class="mob-hp-bar flex justify-center mb-1" style="height:6px;"><div style="width:50px;height:5px;background:#475569;border-radius:3px;overflow:hidden;"><div style="height:100%;background:#ef4444;width:${Math.max(0, Math.min(100, Math.round((m.curHp / (m.hp || 1)) * 100)))}%;"></div></div></div>`;
            let _isBossUnit = BOSS_BIG_MAPS.includes(mapState.current) || m.boss;   // 🎲 頭目不散佈(維持置中大圖)
            let _scat = '';   // ⚠️v2.6.39 取消「水平隨機位移＋隨機大小」(_mobScatter 死碼已於 v3.5.48 清除)。v3.3.2：16:9 高框上半留白→改為僅「垂直往上」隨機分佈(整格 translateY·怪物連影子一起上移＝站在較高/較遠地面·穩定存 m._yScat 每次生成重擲·不逐幀跳動；頭目/龍窟維持釘底置中)
            let _yLift = (typeof MOB_YLIFT !== 'undefined' && MOB_YLIFT[m.n]) || 0;   // 🐉 v3.3.4 逐怪固定上移(法利昂等 spr 本體在畫布偏下→出現位置太低)：頭目/一般都套·疊在隨機散佈之上
            if (!_isBossUnit && m._yScat == null) m._yScat = Math.floor(Math.random() * 40);   // 0~39px 往上：稍微散佈到框中上，非全部貼底
            let _yTot = (_isBossUnit ? 0 : (m._yScat || 0)) + _yLift;
            if (_yTot) _scat = ` style="transform:translateY(-${_yTot}px);"`;
            // 🏰 v3.3.8 攻城建築(城門/守護塔)固定站位：脫離站立帶 flex 流→絕對定位於整個 800×450 背景框(#battle-view 已 position:relative)。城門對齊背景城門處、守護塔置中；位置固定不隨隨機散佈。
            let _sfCls = '';
            if (m.siegeEnemy && m.race === '建築' && typeof SIEGE_BUILD_POS !== 'undefined' && SIEGE_BUILD_POS[m.n]) {
                let _bp = SIEGE_BUILD_POS[m.n];
                _scat = ` style="left:${_bp.left}%;top:${_bp.top}%;"`;   // 覆蓋散佈：改用固定 left/top(卡片中心錨點·siege-fixed 提供 position:absolute + translate(-50%,-50%))
                _sfCls = ' siege-fixed';
            } else if (m._pvpDuelFoe && typeof PVP_DUEL_FOE_POS !== 'undefined') {
                _scat = ` style="left:${PVP_DUEL_FOE_POS.left}%;top:${PVP_DUEL_FOE_POS.top}%;"`;   // ⚔️ v3.7.14 決鬥對手：同一套絕對定位(duel-fixed)，覆蓋隨機散佈→每場站位完全一致
                _sfCls = ' duel-fixed';
            }
            // 🏰 v3.7.82 用戶指定復原：v3.7.79 曾在此加第三分支 `m.siegeEnemy && m.race!=='建築' → _sfCls=' siege-mob'`（攻城敵人整體縮 0.8×·css 同步移除），現已全數撤掉＝攻城敵人回到與其他怪物相同的原生尺寸渲染。要再縮回去＝本處補回分支＋css 補回 .siege-mob 規則（配方見記憶 siege-building-fixed-position）。
            // 🌑 v2.7.17 真實影子 sprite 圖層：本體圖層下疊一層同步影子 img（idle_s_0 為初始貼圖·_mobAnimApply 逐幀同步）；同時隱藏 CSS 橢圓（比照烙印影子）
            let _spriteShadow = MOB_ANIM_NAMES.has(m.n) && (typeof MOB_ANIM_SPRITE_SHADOW !== 'undefined') && MOB_ANIM_SPRITE_SHADOW.has(m.n);
            let _innerAnimCls = MOB_ANIM_NAMES.has(m.n) ? (' mob-anim' + ((MOB_ANIM_BAKED_SHADOW.has(m.n) || _spriteShadow) ? ' mob-anim-shadowed' : '')) : '';
            if (typeof MOB_SHADOW_TINT !== 'undefined' && MOB_SHADOW_TINT.has(m.n)) _innerAnimCls += ' mob-shadow-tint';   // 🌑 灰白剪影怪→半透明黑影
            if (typeof MOB_ANIM_BIG !== 'undefined' && MOB_ANIM_BIG.has(m.n)) _innerAnimCls += ' mob-anim-big';   // 🐉 大畫布非頭目怪→頭目級 185px 高度上限（v3.0.37）
            if (typeof MOB_ANIM_SMALL !== 'undefined' && MOB_ANIM_SMALL.has(m.n)) _innerAnimCls += ' mob-anim-small';   // 🔻 v3.1.65 過大/攻擊死亡溢框怪→整體等比縮小（max-height 降至 85%·本體+_s+_w+技能特效同縮同步）
            let _shadowLayer = _spriteShadow ? `<img class="mob-anim-shadow w-24 h-24 p-1 object-contain pointer-events-none" src="assets/anim/${_animDir(m.n)}/idle_s_0.png" alt="" aria-hidden="true" onload="this.style.display='';this.style.visibility=''" onerror="this.style.visibility='hidden'">` : '';
            // ⚔️ v2.7.22 武器揮動特效層(疊本體「前」·screen)：同影子機制·排在本體 img 之後
            let _weaponFx = MOB_ANIM_NAMES.has(m.n) && (typeof MOB_ANIM_WEAPON_FX !== 'undefined') && MOB_ANIM_WEAPON_FX.has(m.n);
            let _weaponLayer = _weaponFx ? `<img class="mob-anim-weapon w-24 h-24 p-1 object-contain pointer-events-none" src="assets/anim/${_animDir(m.n)}/idle_w_0.png" alt="" aria-hidden="true" onload="this.style.display='';this.style.visibility=''" onerror="this.style.visibility='hidden'">` : '';
            // ⚔️ v2.7.40 第二武器層(_w2·如伊弗利特雙武器/雙火焰)：與 _w 同機制·再疊一層 .mob-anim-weapon2
            let _weaponFx2 = MOB_ANIM_NAMES.has(m.n) && (typeof MOB_ANIM_WEAPON_FX2 !== 'undefined') && MOB_ANIM_WEAPON_FX2.has(m.n);
            let _weaponLayer2 = _weaponFx2 ? `<img class="mob-anim-weapon2 w-24 h-24 p-1 object-contain pointer-events-none" src="assets/anim/${_animDir(m.n)}/idle_w2_0.png" alt="" aria-hidden="true" onload="this.style.display='';this.style.visibility=''" onerror="this.style.visibility='hidden'">` : '';
            let _npcClanCrown = '';
            if (m._npcClanLeader && m._npcClanConflict && m._npcClanHasCastle && !m._dead && m.curHp > 0) {
                let _crownAvatar = m._pvpAvatar === '公主' ? '公主' : '王子';
                let _crownAnchor = _crownAvatar === '公主' ? [33, 82] : [58, 87];
                _npcClanCrown = `<img class="npc-clan-castle-crown" src="assets/ui/castle-crown.gif?v=v3.6.22" alt="" aria-hidden="true" draggable="false" style="left:${_crownAnchor[0]}px;bottom:${_crownAnchor[1]}px;">`;
            }
            let _npcClanNameTag = m._npcClanName
                ? `<span class="text-[10px] font-bold text-cyan-200 whitespace-nowrap">［${m._npcClanLeader ? '盟主・' : ''}${m._npcClanName}］</span>`
                : '';
            _slotHtmls[_k] = `<div class="mob-target ${act}${_rageNow ? ' mob-raging' : ''}${_rowCls}${BOSS_BIG_MAPS.includes(mapState.current) ? ' boss-slot' : (m.boss ? ' boss-zoom' : '')}${_sfCls}" data-uid="${m.uid}"${_scat}>
                        <div class="flex flex-wrap justify-center items-center gap-1 text-sm mb-1 mob-name">
                            <span class="${getMobNameClass(m)}" title="${m.n}${m._npcClanName ? '・' + m._npcClanName : ''}"${(typeof pvpNameStyle === 'function') ? pvpNameStyle(m) : ''}>${m.n}</span>${_npcClanNameTag}
                        </div>
                        ${badges}
                        <div class="flex justify-center mb-1 mob-img-wrap">
                            <span class="mob-img-inner${_innerAnimCls}">${_shadowLayer}<img src="${_mi.src}" data-fb="${_mi.fb.concat(['https://placehold.co/100x100/1e293b/ffffff?text=?']).join('|')}" alt="${m.n}" onerror="_mobImgErr(this)" class="w-24 h-24 p-1 object-contain pointer-events-none${m._grace ? ' grace-glow' : ''}">${_weaponLayer}${_weaponLayer2}${_npcClanCrown}</span>
                        </div>
                        <div class="flex justify-center items-center gap-2 mb-1" style="height:16px;display:flex;align-items:center;justify-content:center;gap:8px;">${_statRow}</div>
                        ${_hpBar}
                     </div>`;
        } else {
            // 👇 修改這裡：純 BOSS 房除了中央（i === 1）以外，其餘兩格渲染為透明隱形區塊
            // 🔧 怪物尚未出現的空格：不顯示「搜尋中...」與虛線框，渲染為透明隱形區塊（保留版位、不擾亂背景）
            _slotHtmls[_k] = `<div class="mob-target${_rowCls} !border-transparent !bg-transparent cursor-default pointer-events-none"></div>`;
        }
    }
    // 🚀 差異更新提交：結構(格數/地圖/頭目大圖模式)不變時，只重建「字串有變」的格子；
    //    單體戰鬥下 5 格只重建 1 格（其餘 4 格 DOM/圖片不動）→ 大幅降低 layout/paint 與卡頓。
    let _ml = document.getElementById('mob-list');
    if (_ml) {
        let _structKey = _order.join(',') + '|' + mapState.current + '|' + (BOSS_BIG_MAPS.includes(mapState.current) ? 'B' : '');
        let _c = _mobRenderCache;
        let _wrote = false;
        if (!_c || _c.ml !== _ml || _c.structKey !== _structKey || _c.slots.length !== _slotHtmls.length || _ml.children.length !== _slotHtmls.length) {
            _ml.innerHTML = _slotHtmls.join('');   // 首次/結構改變/節點被換→整列重建
            _mobRenderCache = { ml: _ml, structKey: _structKey, slots: _slotHtmls };   // _slotHtmls 是每幀新建的暫存陣列→直接存、免 slice 複製
            _wrote = true;
        } else {
            let _changed = [];
            for (let k = 0; k < _slotHtmls.length; k++) if (_slotHtmls[k] !== _c.slots[k]) _changed.push(k);
            if (_changed.length) {
                if (_changed.length * 2 > _slotHtmls.length) {
                    _ml.innerHTML = _slotHtmls.join('');                              // 多數格變動→單次整列重建(不比現況差)
                } else {
                    for (const k of _changed) _ml.children[k].outerHTML = _slotHtmls[k];   // 少數格變動→只換該格
                }
                _c.slots = _slotHtmls;
                _wrote = true;
            }
        }
        // 🖱️ name-show（hover 顯名）不再進 diff 字串、改由 _applyHoverName 單一管理→hover 不再觸發整格重建；
        //    但被重建過的格會丟失 hover class，故只在「有寫入 DOM」時重新套用一次（無重建的幀維持原樣、零成本）。
        if (_wrote) _applyHoverName();
        if (_wrote) { try { _mobAnimApply(); } catch(e){} }   // 🎞️ 重建過的格子立即補上當前動畫幀（同一同步工作內→不閃回靜態圖）
    }
    // 🔥 訊息與一次性爆發只在轉場發生時觸發；持續光暈由上方 mob-raging class 維持。
    for (let m of _rageTransitions) {
        try {
            let hitUp = Math.max(0, Math.round(((Number(m.rageHitMult) || 1) - 1) * 100));
            let dmgUp = Math.max(0, Math.round(((Number(m.rageDmgMult) || 1) - 1) * 100));
            if (typeof logCombat === 'function') logCombat(`<span class="font-bold" style="color:#fecdd3;text-shadow:0 0 7px #ef4444;">【頭目狂暴】</span><span class="${getMobColor(m.lv)}">${m.n}</span> 的力量失控！命中提升 ${hitUp}%、傷害提升 ${dmgUp}%！`, 'enemy', 'enemy');
        } catch(e) {}
        try { vfxBossRage(m); } catch(e) {}
    }
    try { _vfxFlush(); } catch(e){}   // ✨ VFX：格子重建後生成飄動傷害數字
}

// ===== 🎞️ 怪物 PNG 序列幀動畫引擎（v2.6.85·v2.6.86 分動作·v2.6.88 登場＋鎖定播放）=====
// 幀檔約定（assets/anim/<怪物名>/·連續編號·缺號即止·各動作至少 2 幀才啟用·各自獨立可缺）：
//   待機 idle：`0.png、1.png…` 或 `idle_0.png…`（優先 idle_ 前綴·裸編號為相容舊約定）→ 循環播放
//   登場 spawn：`spawn_0.png…` → 怪物首次出現在場上時播一輪（🔒 鎖定），播畢回待機
//   攻擊 attack：`attack_0.png…` → 怪物發動一般攻擊(打玩家或傭兵·含連擊技)時播一輪，播畢回待機
//   技能 skill：`skill_0.png…` → 怪物施放技能(castMobMagic)時播一輪（🔒 鎖定），播畢回待機
//   死亡 death：`death_0.png…` → 死亡時在 VFX 殘影上原位播一輪後淡出（取代白閃殘影·怪卡本體照常移除·殘影獨立層必定播完）
// 🔒 鎖定規則（用戶要求）：登場/技能一旦開播「強制放完」——播放期間的新觸發一律忽略（不打斷·也不排隊重播·
//    避免視覺與實際傷害脫節），播畢回待機再接之後的觸發；攻擊為非鎖定（可被新攻擊重播、可被技能即時蓋掉）。
// 原理：待機幀序由「全域時鐘」決定（renderMobs 隨時整格重建也不重置相位）；單次動作 m._animAct={k,t,lock}
//       存在怪物物件上·跨重建存活·播畢自動清除回待機。ticker 只改 img.src（已預載快取·不進 diff 字串
//       →不觸發格子重建、不重播受擊動畫）。
// 效能：8fps interval 掃描場上 ≤5 張卡；分頁背景(document.hidden)自動暫停；探測每怪一次（結果快取）。
const MOB_ANIM_FPS = 8;            // 全域幀率（動作/秒）
const MOB_ANIM_MAX_FRAMES = 60;    // 每動作幀數探測上限（v2.7.10 30→60：林德拜爾 death 35 幀被 30 截斷·探測逐號載到 404 即止→調高對短動畫零額外成本）
// 🐉 v3.3.4 逐怪固定「往上」位移（px·整格 .mob-target translateY·連帶名稱/血條/影子/特效命中一起上移不脫節）：某些怪 spr 本體在畫布偏下→貼底渲染時出現位置太低，此表微調。頭目/一般皆套（疊在 v3.2 隨機散佈之上）。新增只加一行。
const MOB_YLIFT = { '法利昂': 30 };   // 法利昂（水龍·本體在 375×247 畫布偏下）出現位置往上 30px
// 🏰 v3.3.8 攻城建築固定站位（用戶：城門依背景圖放在城門處·守護塔置中·兩者位置固定）。
//    座標＝卡片中心點 %（相對整個 800×450 背景框·siege-fixed 以 translate(-50%,-50%) 置中錨定；#battle-view 已 position:relative）。
//    城門逐城依 *_outer 背景圖 gate 位置（肯特外門區/風木外門區/海音外門區.jpg 內城門偏左上）；守護塔一律區域正中央。⚠️微調＝改此表數字（left 越小越靠左·top 越小越靠上）。
// ⚔️ v3.7.14 決鬥對手固定站位（用戶：釘在中央、玩家稍微右上方，兩人剛好面對面）。
//   座標＝卡片中心錨點的 left/top 百分比（同 SIEGE_BUILD_POS 機制·CSS .duel-fixed 提供絕對定位）。
//   ⚠️ 面對面是「位置決定」的：對手 sprite 走 assets/anim/玩家* 恆左向，玩家 sprite 由 _classFacing8
//      依目標卡片 rect 判左右——只要對手釘在玩家右邊，玩家就會自動轉成 R，兩邊自然對看。
const PVP_DUEL_FOE_POS = { left: 58, top: 70 };
const SIEGE_BUILD_POS = {
    '肯特城門': { left: 40, top: 33 }, '風木城門': { left: 41, top: 23 }, '海音城門': { left: 39, top: 23 },
    '肯特守護塔': { left: 50, top: 48 }, '風木守護塔': { left: 50, top: 48 }, '海音守護塔': { left: 50, top: 48 }
};
let _mobAnimCache = {};            // 怪名 → {idle,spawn,attack,skill,death:各[Image]|null} ｜ 'probing' ｜ null（全無）
let _mobAnimTrimAt = 0;
function _trimMobAnimCaches(now) {
    if (now < _mobAnimTrimAt) return;
    _mobAnimTrimAt = now + 10000;
    let keep = new Set(((typeof mapState !== 'undefined' && mapState.mobs) || []).filter(Boolean).map(m => m.n));
    let trim = (cache, limit, nameOf) => {
        let keys = Object.keys(cache); if (keys.length <= limit) return;
        let remaining = keys.length;
        for (let key of keys) {
            if (remaining <= limit) break;
            if (cache[key] === 'probing' || keep.has(nameOf(key))) continue;
            delete cache[key]; remaining--;
        }
    };
    trim(_mobAnimCache, 48, k => k);
    if (typeof _mob8Cache !== 'undefined') trim(_mob8Cache, 96, k => k.slice(0, k.lastIndexOf('#')));
}
// 🎬 有序列幀動畫的怪物名單（單一真相·同步判斷用）：戰鬥/圖鑑靜態顯示點與探測皆據此，避免對 1000+ 無動畫怪發 404。
//    ⚠️ 新增動畫怪：把幀丟進 assets/anim/<怪名>/（跑 spr2png.js）後，把 <怪名> 加進此 Set（一行）。播放幀數由 _mobAnimProbe 自動偵測。
const MOB_ANIM_NAMES = new Set([/* 🐍 v3.1.59 提卡爾18怪 */ '提卡爾杰弗雷庫(雄)', '提卡爾杰弗雷庫(雌)', '提卡爾艾庫卡伊拉(藍)', '提卡爾艾庫卡伊拉(黃)', '提卡爾艾庫尤卡(白)', '提卡爾艾庫尤卡(藍)', '提卡爾艾庫巴拉', '提卡爾艾庫巴拉(紅)', '提卡爾艾庫艾托', '提卡爾艾庫艾托(枯竭)', '提卡爾艾庫阿茲特', '提卡爾艾庫阿茲特(黃)', '提卡爾薩德司卡(紅)', '提卡爾薩德司卡(紫)', '提卡爾薩德提歐(藍)', '提卡爾薩德提歐(黃)', '提卡爾薩德泥偶', '提卡爾薩德泥偶(黑)', '海音守護塔','肯特守護塔', '風木守護塔', '長老．巴塔斯', '長老．艾迪爾', '長老．安迪斯', '長老．拉曼斯', '長老．泰瑪斯', '狂暴的歐姆裝甲兵', '重裝歐姆戰士', '血色術士', '長老隨從', '魂騎士', '闇黑君王', '地獄束縛犬', '地元素守護者', '火元素守護者', '血騎士', '拉斯塔巴德近衛隊隊長', '歐姆民兵', '混沌', '死亡', '混沌的司祭(野獸)', '冥法軍王海露拜', '暗殺軍王史雷佛', '混沌的司祭(飛翼)', '墳墓守護者法師', '海賊骷髏首領', '德雷克', '巨大墳墓守護者', '水元素守護者', '風元素守護者', '狂野毒牙', '狂野之毒', '狂野之魔', '高等蜥蜴人', '海賊骷髏士兵', '海賊骷髏刀手', '海賊骷髏', '曼波兔', '重裝蜥蜴人', '狂暴蜥蜴人', '奇異鸚鵡', '藍尾蜥蜴', '墮落', '楊果里恩', '變種楊果里恩', '遺忘之島楊果里恩', '墳墓守護者騎士', '深淵之主', '火焰之魔法師', '污染的地精靈', '墮落的司祭(三階)', '墮落的司祭(四階)', '墮落的司祭(五階)', '魔族暗殺團', '黑暗棲林者', '法令軍王蕾雅', '黑法師', '喚獸師', '魔獸軍王巴蘭卡', '黑暗復仇者', '金屬蜈蚣', '犰狳', '歐姆', '歐姆裝甲兵', '深淵弓箭手', '黑虎', '藏寶箱', '受詛咒的馴獸師', '拉斯塔巴德馴獸師', '馴獸師', '象牙塔惡靈', '遺忘之島多羅', '拉斯塔巴德守門人', '拉斯塔巴德近衛隊', '黑暗妖精警衛(矛)', '黑暗妖精殘兵(十字弓)', '黑暗妖精盜賊', '黑暗妖精警衛(十字弓)', '黑暗妖精殘兵(雙手劍)', '黑暗妖精殘兵(弓)', '黑暗妖精法師', '黑暗妖精士兵', '恐怖的地獄犬', '喬', '闇之精靈', '黑暗精靈使', '魔熊', '冷酷的艾莉絲', '艾莉絲', '邪惡的鐮刀死神', '不死的木乃伊王', '木乃伊王', '闇黑的騎士范德', '騎士范德', '黑暗妖精將軍', '地獄的黑豹', '黑暗妖精巡守', '黑暗妖精殘兵(法師)', '黑暗妖精魔法學徒', '黑暗妖精殘兵(劍)', '殘暴的食屍鬼', '深淵食屍鬼', '食屍鬼', '象牙塔密密', '邪惡密密', '傲慢的潔尼斯女王', '扭曲的潔尼斯女王', '夢幻之島殺人蜂', '闇影格立特', '闇精靈王', '不幸的幻象眼魔', '小幻象眼魔', '夢幻之島鎧甲守衛', '象牙塔炎魔的奴隸', '夢幻之島蘑菇', '恐怖的吸血鬼', '馬昆斯吸血鬼', '獨角獸', '夢幻之島大鬼火', '地靈之主', '深淵地靈', '深淵火靈', '火靈之主', '深淵風靈', '風靈之主', '水靈之主', '深淵水靈', '夢幻之島暴走兔', '夢幻之島鬼火', '夢幻之島閃電球', '象牙塔閃電球', '象牙塔果凍怪', '炎魔的分身', '象牙塔炎魔之影', '梅杜莎', '小惡魔', '炎魔的小惡魔', '象牙塔小惡魔', '死亡之劍', '象牙塔死亡之劍', '不滅的巫妖', '強盜', '古代巨人', '強盜頭目', '骨龍', '奇美拉', '象牙塔奇美拉', '遺忘之島巨大牛人', '殘暴的史巴托', '變形怪首領', '遺忘之島變形怪', '魔狼', '幼龍', '夢魘', '恐怖夢魘', '象牙塔翼魔', '火精靈王', '水精靈王', '土精靈王', '風精靈王', '夢幻之島火精靈王', '夢幻之島水精靈王', '夢幻之島地精靈王', '夢幻之島風精靈王', '火之牙', '風之牙', '水之牙', '地之牙', '冰人', '夢幻之島冰人', '艾爾摩士兵', '受詛咒的艾爾摩士兵', '艾爾摩將軍', '受詛咒的艾爾摩將軍', '鋼鐵高崙', '恐怖的鋼鐵高崙', '象牙塔鋼鐵高崙', '雪怪', '冰之女王', '冰之女王侍女', '冰原老虎', '冷酷冰原老虎', '夢幻之島火炎蛋', '恐怖的火炎蛋', '暗黑火焰弓箭手', '火炎蛋', '火焰弓箭手', '火焰阿西塔基奧', '爆彈花', '阿西塔基奧', '雪人', '龍蠅', '不死鳥', '伊弗利特', '恐怖的伊弗利特', '火焰烈炎獸', '烈炎獸', '暗黑火焰戰士', '火焰戰士', '夢幻之島火蜥蜴', '海星', '火蜥蜴', '熔岩高崙', '鯊魚', '龍龜', '人魚', '伊萊克頓', '奎斯坦修', '希爾黛斯', '活鎧甲', '穴居人', '蛇女', '蟹人', '變種蛇女', '象牙塔活鎧甲', '象牙塔蛇女', '遺忘之島蛇女', '鼠人', '亞力安', '人形殭屍', '侏儒', '侏儒戰士', '依詩蒂', '依詩蒂公主', '克特', '冰原狼人', '冰石高崙', '卡司特', '卡司特王', '卡士柏', '卡瑞', '受詛咒的妖魔殭屍', '史巴托', '哈士奇', '哈柏哥布林', '哈維', '哥布林', '地獄犬', '地靈', '夏洛伯', '多眼怪', '多羅', '夢幻之島冰石高崙', '妖魔', '妖魔巡守', '妖魔弓箭手', '妖魔殭屍', '妖魔法師', '妖魔鬥士', '安塔瑞斯', '安普長老', '密密', '巨人', '巨人戰士', '巨人長老', '巨大兵蟻', '巨大突擊螞蟻', '巨大鱷魚', '巨蟻', '巨蟻女皇', '巫師', '巴列斯', '巴土瑟', '巴拉卡斯', '巴風特', '強化巨蟻', '思克巴', '思克巴女皇', '怪手', '恐怖的殭屍王', '惡魔', '暗黑思克巴女皇', '暗黑萊肯', '暗黑黑騎士', '月之精靈歐薇', '月光朱利安', '朱利安', '杜賓狗', '林德拜爾', '格利芬', '歐吉', '歐熊', '歐薇', '死亡的司祭(巴風特)', '死亡的司祭(思克巴)', '死亡的殭屍王', '死亡騎士', '死神', '殘暴的骷髏斧兵', '殘暴的骷髏槍兵', '殘暴的骷髏神射手', '殘暴的骷髏鬥士', '毒蠍', '污染的安特', '污染的潘', '法利昂', '漂浮之眼', '火焰之影親衛隊(巴風特)', '火焰之靈魂(紅)', '火焰之靈魂(藍)', '炎魔的巴列斯', '炎魔的巴風特', '炎魔的思克巴', '炎魔的思克巴女皇', '炎魔的惡魔', '熊', '牧羊犬', '特羅斯王子', '狼', '狼人', '獨眼巨人', '甘地妖魔', '石頭高崙', '紅鬼魂', '紙人', '羅孚妖魔', '莫妮亞', '萊肯', '蘑菇', '蜥蜴人', '蟑螂人', '西斯', '西瑪', '變形怪', '象牙塔巴列斯之影', '象牙塔巴風特之影', '象牙塔惡魔之影', '象牙塔死神', '象牙塔石頭高崙', '象牙塔紙人', '象牙塔長者', '象牙塔黑長者', '象牙塔黑魔法師', '卡魯塔', '地獄奴隸', '巨大守護螞蟻', '白螞蟻群', '強化白螞蟻群', '巨大白螞蟻', '巨大強化白螞蟻', '冰魔', '底比斯 尖碑石奴', '底比斯 尖碑石奴(黑)', '底比斯 賀洛斯', '底比斯 凱比斯(紅)', '底比斯 凱比斯(黑)', '底比斯 聖甲蟲', '底比斯 聖甲蟲(藍)', '底比斯 巴斯', '底比斯 巴斯(紅)', '底比斯 曼陀羅草', '底比斯 曼陀羅草(白)', '底比斯 阿努比斯', '底比斯 斯芬克斯', '底比斯 斯芬克斯(黑)', '底比斯 阿努斯', '底比斯 阿努斯(黑)', '底比斯 尼荷斯', '底比斯 尼荷斯(藍)', '影魔', '象牙塔影魔', '墮落的司祭(一階)', '墮落的司祭(二階)', '艾爾摩法師', '受詛咒的艾爾摩法師', '狂暴的歐姆', '歐姆戰士', '魔蝙蝠', '墳墓守護者', '哈汀之影', '長老．琪娜', '長老．巴洛斯', '長老．巴陸德', '賽尼斯', '遺忘之島亞力安', '遺忘之島卡司特', '遺忘之島卡司特王', '遺忘之島哈維', '遺忘之島夏洛伯', '遺忘之島巨大鱷魚', '遺忘之島巨斧牛人', '遺忘之島格利芬', '遺忘之島歐熊', '遺忘之島狼人', '遺忘之島獨眼巨人', '遺忘之島萊肯', '遺忘之島蜥蜴人', '遺忘之島邪惡蜥蜴', '遺忘之島鏈鎚牛人', '遺忘之島阿魯巴', '遺忘之島飛龍', '遺忘之島食人妖精', '遺忘之島食人妖精王', '遺忘之島鱷魚', '遺忘之島黑暗精靈', '那魯加妖魔', '邪惡多眼怪', '邪惡蜥蜴', '都達瑪拉妖魔', '鋼鐵阿頓', '長老', '阿吐巴妖魔', '阿頓', '阿魯巴', '飛龍', '食人妖精', '食人妖精王', '馬庫爾', '骷髏', '骷髏弓箭手', '骷髏斧手', '骷髏槍兵', '骷髏神射手', '骷髏警衛', '骷髏鬥士', '鬼魂', '魔女賽尼斯', '魔法師喬', '鱷魚', '黑暗精靈', '黑長者', '黑騎士', '黑騎士搜索隊', /* 🐾 v3.2.17 夥伴更新12怪 */ '老虎', '貓', '熊貓', '高麗幼犬', '浣熊', '聖伯納犬', '狐狸', '暴走兔', '小獵犬', '柯利', '袋鼠', '猴子', /* 🏰 v3.3.3 攻城城門（2 狀態·idle_0 靜態存活·死亡播 death 崩塌·無 8 方向/攻擊/影子 spr） */ '肯特城門', '風木城門', '海音城門', /* 🌑 v3.3.33 黑暗妖精聖地 8 新怪（地獄奴隸已在表內·特效層已烙入本體） */ '受詛咒的黑暗妖精鬥士', '受詛咒的黑暗妖精法師', '受詛咒的黑暗妖精騎士', '食腐獸', '特提斯', '翼龍', '吉爾塔斯', '真‧死亡騎士 冥皇丹特斯', /* 🌅 日出之國 18 怪（dir6 單方向·殺生石/巨大骷髏含 spawn·巨大骷髏=sc發光本體(luma)+mu多重層(_s)） */ '嗚釜', '憤怒的嗚釜', '鎌鼬', '鎌鼬長兄', '轆轤首', '唐傘小僧', '牛鬼之子', '河童', '赤鬼', '青鬼', '鵺', '天狗', '阿修羅像', '牛鬼', '白面金毛九尾狐・玉藻', '白面金毛九尾狐・九尾', '白面金毛九尾狐・殺生石', '巨大骷髏', /* 🐉 v3.7.57 安塔瑞斯副本 7 怪（dir6·安塔瑞斯含 spawn=entry 登場·death=escape 鑽地·狂怒/瘋狂走 ALIAS 共用本體） */ '喀瑪南', '喀瑪焰', '喀瑪南王', '喀瑪焰王', '喀瑪王', '大地荒龍', '被侵蝕的安塔瑞斯', '被侵蝕的狂怒安塔瑞斯', '被侵蝕的瘋狂安塔瑞斯']);   // 🐉 v3.7.66 兩個變身形態補進名單（原本只設了 MOB_ANIM_ALIAS 共用資料夾，但 MOB_ANIM_NAMES 才是動畫總閘→漏設等於整段沒動態，退靜態圖）
// 🌑 v2.7.11 影子分流（天堂的影子是「獨立 spr」·抽怪物 spr 多半不含影子）：
//    本 Set＝spr「自帶烙印影子」的動畫怪→維持隱藏遊戲橢圓陰影(免雙重)；不在此 Set 的動畫怪→恢復顯示橢圓接觸陰影(等同天堂客戶端另畫影子)。
//    🏆 v2.7.12 依 list.spr 官方定義修正：條目「沒有 101.shadow() 屬性」＝影子烙印在本體(最老世代低編號精靈 29~57)＝本 Set；有 101.shadow(id)＝影子獨立→不加。
//    像素複驗吻合(烙印組底輪廓近黑36~59%·乾淨組0~14%)。⚠️ 新增動畫怪：查 list.spr 該 gfx 有無 101.shadow()——沒有→加進來；有→不加(自動有橢圓)。
const MOB_ANIM_BAKED_SHADOW = new Set(['食屍鬼', '殘暴的食屍鬼', '深淵食屍鬼', '妖魔', '妖魔弓箭手', '漂浮之眼', '人形殭屍', '長老', '象牙塔長者', '卡魯塔', /* 🏰 v3.3.5 攻城城門＝建築·無影子→隱藏 CSS 橢圓(用戶：城門不需要影子) */ '肯特城門', '風木城門', '海音城門']);   // v2.7.35 狼人/遺忘之島狼人·v2.7.51 變形怪(現有 _s 真影子)→移入 SPRITE_SHADOW·v2.7.64 食屍鬼×3(spr 無 _s·腳下烙印黑影→隱藏橢圓免雙重)
// 🌑 v3.0.24 灰白剪影怪→半透明黑影：天堂 silhouette(gfx1571) spr 本身是「淺灰白煙形」→套 CSS filter:brightness(0)+opacity 轉半透明黑色煙影(掛 .mob-img-inner 父層→受擊亮度閃回被父層 brightness(0) 歸零·不會閃回灰·晃動仍在)。⚠️新增其他灰白剪影怪：把名字加進此 Set 即可(一行)。
const MOB_SHADOW_TINT = new Set(['影魔', '象牙塔影魔']);
// 🐉 v3.0.37 大畫布「非頭目」動畫怪尺寸例外：吃 v3.0.20 帶高上限(max-height:100%)會被縮得比一般怪還小（遺忘之島飛龍＝飛龍同 370×307 大畫布·但非 boss 無 .boss-zoom 的 185px 上限）→ 給 .mob-anim-big class 套與頭目相同的 185px 上限。⚠️新增同類「大畫布非頭目怪」加名字即可。
const MOB_ANIM_BIG = new Set(['遺忘之島飛龍', '哈維', '遺忘之島哈維', '希爾黛斯']);   // 🌊 希爾黛斯：399×300 全畫布(水舞龍捲·本體僅佔中央~1/3)→吃帶高上限會過小·給 185px 上限放大本體(全畫布不裁·大水花完整)   // 🦅 v3.1.66 哈維(harpy·144×226 高畫布飛行怪·本體僅佔上半·下半為飛行高度+地面影子)→吃帶高上限(112)本體只剩~27px 過小·給 185px 上限放大~1.6×(本體+_s+_w 同步·影子留地面·飛行高度感保留)
// 🔻 額外縮小名單：希爾黛斯已於 v3.2.x 重作為原生全畫布 399×300(不再裁切)，本體放大改走 MOB_ANIM_BIG(185px 上限)，不在此 Set。
//    後續若有無法重匯、只能暫時縮小避開戰鬥框的怪物，可加入此 Set。
const MOB_ANIM_SMALL = new Set([]);
// 🌑 v2.7.17 真實影子 sprite（天堂「獨立影子 spr」·用戶另外抽出 <動作>_s.spr）：本 Set 的動畫怪在本體圖層下再疊一層「同步影子 img」(assets/anim/<怪名>/<動作>_s_N.png)。
//    ⚠️ 影子 spr 必須與本體 spr「一起 spr2png --multi 轉」共用世界錨定畫布→影子 PNG 與本體 PNG 同尺寸、疊放即像素級對齊(連跳躍幀影子留地面都正確)。單獨轉影子會錯位。
//    這些怪同時隱藏遊戲 CSS 橢圓影子(比照 MOB_ANIM_BAKED_SHADOW→加 .mob-anim-shadowed)免雙重。⚠️新增：本體+影子一起重轉部署+加此 Set+(若新怪)加 MOB_ANIM_NAMES。
const MOB_ANIM_SPRITE_SHADOW = new Set([/* 🐾 v3.2.17 */ '老虎', '貓', '熊貓', '高麗幼犬', '浣熊', '聖伯納犬', '狐狸', '暴走兔', '小獵犬', '柯利', '袋鼠', '猴子', /* 🐍 v3.1.59 提卡爾18怪皆帶_s */ '提卡爾杰弗雷庫(雄)', '提卡爾杰弗雷庫(雌)', '提卡爾艾庫卡伊拉(藍)', '提卡爾艾庫卡伊拉(黃)', '提卡爾艾庫尤卡(白)', '提卡爾艾庫尤卡(藍)', '提卡爾艾庫巴拉', '提卡爾艾庫巴拉(紅)', '提卡爾艾庫艾托', '提卡爾艾庫艾托(枯竭)', '提卡爾艾庫阿茲特', '提卡爾艾庫阿茲特(黃)', '提卡爾薩德司卡(紅)', '提卡爾薩德司卡(紫)', '提卡爾薩德提歐(藍)', '提卡爾薩德提歐(黃)', '提卡爾薩德泥偶', '提卡爾薩德泥偶(黑)', '長老．巴塔斯','長老．艾迪爾', '長老．安迪斯', '長老．拉曼斯', '長老．泰瑪斯', '狂暴的歐姆裝甲兵', '重裝歐姆戰士', '血色術士', '長老隨從', '魂騎士', '闇黑君王', '地獄束縛犬', '地元素守護者', '火元素守護者', '血騎士', '拉斯塔巴德近衛隊隊長', '歐姆民兵', '混沌', '死亡', '混沌的司祭(野獸)', '冥法軍王海露拜', '暗殺軍王史雷佛', '混沌的司祭(飛翼)', '墳墓守護者法師', '海賊骷髏首領', '德雷克', '巨大墳墓守護者', '水元素守護者', '風元素守護者', '狂野毒牙', '狂野之毒', '狂野之魔', '高等蜥蜴人', '海賊骷髏士兵', '海賊骷髏刀手', '海賊骷髏', '曼波兔', '重裝蜥蜴人', '狂暴蜥蜴人', '奇異鸚鵡', '藍尾蜥蜴', '墮落', '墳墓守護者騎士', '火焰之魔法師', '墮落的司祭(三階)', '墮落的司祭(四階)', '墮落的司祭(五階)', '魔族暗殺團', '黑暗棲林者', '法令軍王蕾雅', '黑法師', '喚獸師', '魔獸軍王巴蘭卡', '黑暗復仇者', '金屬蜈蚣', '犰狳', '歐姆', '歐姆裝甲兵', '深淵弓箭手', '石頭高崙', '象牙塔石頭高崙', '黑虎', '藏寶箱', '受詛咒的馴獸師', '拉斯塔巴德馴獸師', '馴獸師', '遺忘之島多羅', '月之精靈歐薇', '歐薇', '拉斯塔巴德守門人', '拉斯塔巴德近衛隊', '黑暗妖精警衛(矛)', '黑暗妖精殘兵(十字弓)', '黑暗妖精盜賊', '黑暗妖精警衛(十字弓)', '黑暗妖精殘兵(雙手劍)', '黑暗妖精殘兵(弓)', '黑暗妖精法師', '黑暗妖精士兵', '恐怖的地獄犬', '喬', '黑暗精靈使', '魔熊', '特羅斯王子', '依詩蒂公主', '依詩蒂', '冷酷的艾莉絲', '艾莉絲', '阿頓', '鋼鐵阿頓', '邪惡的鐮刀死神', '不死的木乃伊王', '木乃伊王', '闇黑的騎士范德', '騎士范德', '黑暗妖精將軍', '地獄的黑豹', '黑暗妖精巡守', '黑暗妖精殘兵(法師)', '黑暗妖精魔法學徒', '黑暗妖精殘兵(劍)', '象牙塔密密', '邪惡密密', '傲慢的潔尼斯女王', '扭曲的潔尼斯女王', '夢幻之島殺人蜂', '闇影格立特', '不幸的幻象眼魔', '小幻象眼魔', '夢幻之島鎧甲守衛', '象牙塔炎魔的奴隸', '夢幻之島蘑菇', '恐怖的殭屍王', '死亡的殭屍王', '恐怖的吸血鬼', '馬昆斯吸血鬼', '獨角獸', '夢幻之島暴走兔', '象牙塔果凍怪', '林德拜爾', '炎魔的分身', '象牙塔炎魔之影', '梅杜莎', '小惡魔', '炎魔的小惡魔', '象牙塔小惡魔', '死亡之劍', '象牙塔死亡之劍', '不滅的巫妖', '強盜', '古代巨人', '強盜頭目', '骨龍', '奇美拉', '象牙塔奇美拉', '遺忘之島巨大牛人', '變形怪', '哈士奇', '變形怪首領', '遺忘之島變形怪', '魔狼', '幼龍', '夢魘', '恐怖夢魘', '象牙塔翼魔', '冰人', '夢幻之島冰人', '艾爾摩士兵', '受詛咒的艾爾摩士兵', '艾爾摩將軍', '受詛咒的艾爾摩將軍', '鋼鐵高崙', '恐怖的鋼鐵高崙', '象牙塔鋼鐵高崙', '雪怪', '冰之女王', '冰之女王侍女', '冰原老虎', '冷酷冰原老虎', '夢幻之島火炎蛋', '恐怖的火炎蛋', '暗黑火焰弓箭手', '火炎蛋', '火焰弓箭手', '火焰阿西塔基奧', '爆彈花', '阿西塔基奧', '雪人', '龍蠅', '巴拉卡斯', '不死鳥', '伊弗利特', '恐怖的伊弗利特', '火焰烈炎獸', '烈炎獸', '暗黑火焰戰士', '火焰戰士', '夢幻之島火蜥蜴', '海星', '火蜥蜴', '熔岩高崙', '鯊魚', '龍龜', '熊', '人魚', '伊萊克頓', '奎斯坦修', '希爾黛斯', '活鎧甲', '穴居人', '蛇女', '蟹人', '變種蛇女', '象牙塔活鎧甲', '象牙塔蛇女', '遺忘之島蛇女', '鼠人', '法利昂', '蟑螂人', '亞力安', '侏儒戰士', '克特', '冰原狼人', '冰石高崙', '卡司特', '卡司特王', '卡士柏', '卡瑞', '受詛咒的妖魔殭屍', '史巴托', '殘暴的史巴托', '哈柏哥布林', '哈維', '哥布林', '地獄犬', '地靈', '多眼怪', '多羅', '夢幻之島冰石高崙', '妖魔巡守', '妖魔殭屍', '妖魔法師', '安塔瑞斯', '安普長老', '密密', '巨人', '巨人戰士', '巨人長老', '巨大兵蟻', '巨大突擊螞蟻', '巨大鱷魚', '巨蟻', '巨蟻女皇', '巫師', '巴列斯', '巴土瑟', '巴風特', '強化巨蟻', '思克巴', '思克巴女皇', '怪手', '惡魔', '暗黑思克巴女皇', '暗黑萊肯', '暗黑黑騎士', '月光朱利安', '朱利安', '杜賓狗', '格利芬', '歐吉', '歐熊', '死亡的司祭(巴風特)', '死亡的司祭(思克巴)', '死亡騎士', '死神', '殘暴的骷髏斧兵', '殘暴的骷髏槍兵', '殘暴的骷髏神射手', '殘暴的骷髏鬥士', '毒蠍', '污染的安特', '污染的潘', '火焰之影親衛隊(巴風特)', '火焰之靈魂(紅)', '火焰之靈魂(藍)', '炎魔的巴列斯', '炎魔的巴風特', '炎魔的思克巴', '炎魔的思克巴女皇', '炎魔的惡魔', '牧羊犬', '狼', '狼人', '獨眼巨人', '甘地妖魔', '紅鬼魂', '紙人', '羅孚妖魔', '莫妮亞', '萊肯', '蘑菇', '蜥蜴人', '西斯', '西瑪', '象牙塔巴列斯之影', '象牙塔巴風特之影', '象牙塔惡魔之影', '象牙塔死神', '象牙塔紙人', '象牙塔黑長者', '象牙塔黑魔法師', '地獄奴隸', '巨大守護螞蟻', '白螞蟻群', '強化白螞蟻群', '巨大白螞蟻', '巨大強化白螞蟻', '冰魔', '底比斯 尖碑石奴', '底比斯 尖碑石奴(黑)', '底比斯 賀洛斯', '底比斯 凱比斯(紅)', '底比斯 凱比斯(黑)', '底比斯 聖甲蟲', '底比斯 聖甲蟲(藍)', '底比斯 巴斯', '底比斯 巴斯(紅)', '底比斯 曼陀羅草', '底比斯 曼陀羅草(白)', '底比斯 阿努比斯', '底比斯 斯芬克斯', '底比斯 斯芬克斯(黑)', '底比斯 阿努斯', '底比斯 阿努斯(黑)', '底比斯 尼荷斯', '底比斯 尼荷斯(藍)', '墮落的司祭(一階)', '墮落的司祭(二階)', '艾爾摩法師', '受詛咒的艾爾摩法師', '狂暴的歐姆', '歐姆戰士', '魔蝙蝠', '墳墓守護者', '哈汀之影', '長老．琪娜', '長老．巴洛斯', '長老．巴陸德', '賽尼斯', '遺忘之島亞力安', '遺忘之島卡司特', '遺忘之島卡司特王', '遺忘之島哈維', '遺忘之島巨大鱷魚', '遺忘之島巨斧牛人', '遺忘之島格利芬', '遺忘之島歐熊', '遺忘之島狼人', '遺忘之島獨眼巨人', '遺忘之島萊肯', '遺忘之島蜥蜴人', '遺忘之島邪惡蜥蜴', '遺忘之島鏈鎚牛人', '遺忘之島阿魯巴', '遺忘之島飛龍', '遺忘之島食人妖精', '遺忘之島食人妖精王', '遺忘之島鱷魚', '遺忘之島黑暗精靈', '那魯加妖魔', '邪惡多眼怪', '邪惡蜥蜴', '都達瑪拉妖魔', '阿吐巴妖魔', '阿魯巴', '飛龍', '食人妖精', '食人妖精王', '馬庫爾', '骷髏', '骷髏弓箭手', '骷髏斧手', '骷髏槍兵', '骷髏神射手', '骷髏警衛', '骷髏鬥士', '鬼魂', '魔女賽尼斯', '魔法師喬', '鱷魚', '黑暗精靈', '黑長者', '黑騎士', '黑騎士搜索隊', /* 🌑 v3.3.33 黑暗妖精聖地 8 新怪皆帶 _s 真實影子 */ '受詛咒的黑暗妖精鬥士', '受詛咒的黑暗妖精法師', '受詛咒的黑暗妖精騎士', '食腐獸', '特提斯', '翼龍', '吉爾塔斯', '真‧死亡騎士 冥皇丹特斯', /* 🌅 日出之國 18 怪皆帶 _s（巨大骷髏的 _s＝官方 mu 多重層·multiply 正好符合原生混合語義） */ '嗚釜', '憤怒的嗚釜', '鎌鼬', '鎌鼬長兄', '轆轤首', '唐傘小僧', '牛鬼之子', '河童', '赤鬼', '青鬼', '鵺', '天狗', '阿修羅像', '牛鬼', '白面金毛九尾狐・玉藻', '白面金毛九尾狐・九尾', '白面金毛九尾狐・殺生石', '巨大骷髏', /* 🐉 v3.7.57 安塔瑞斯副本 7 怪皆帶 _s 真實影子（獨立影子 gfx 共畫布轉檔） */ '喀瑪南', '喀瑪焰', '喀瑪南王', '喀瑪焰王', '喀瑪王', '大地荒龍', '被侵蝕的安塔瑞斯', '被侵蝕的狂怒安塔瑞斯', '被侵蝕的瘋狂安塔瑞斯']);   // 🐉 v3.7.66 兩個變身形態補進名單（原本只設了 MOB_ANIM_ALIAS 共用資料夾，但 MOB_ANIM_NAMES 才是動畫總閘→漏設等於整段沒動態，退靜態圖）
// ⚔️ v2.7.22 武器揮動特效層（<動作>_w.spr·與本體同 --multi 共畫布→逐幀同步·疊在本體「前」）：本 Set 的動畫怪多疊一層 .mob-anim-weapon(screen 加亮·如死亡騎士金色刀光弧·揮動只在特定幀出現·空幀透明)。⚠️新增：本體+_s+_w 一起 --multi 轉。
const MOB_ANIM_WEAPON_FX = new Set([/* 🐍 v3.1.59 提卡爾8怪帶_w */ '提卡爾艾庫巴拉', '提卡爾艾庫巴拉(紅)', '提卡爾艾庫阿茲特', '提卡爾艾庫阿茲特(黃)', '提卡爾薩德司卡(紅)', '提卡爾薩德司卡(紫)', '提卡爾薩德提歐(藍)', '提卡爾薩德提歐(黃)', '長老．艾迪爾','長老．拉曼斯', '血色術士', '長老隨從', '魂騎士', '闇黑君王', '地獄束縛犬', '地元素守護者', '火元素守護者', '血騎士', '混沌', '死亡', '暗殺軍王史雷佛', '德雷克', '巨大墳墓守護者', '風元素守護者', '墳墓守護者騎士', '深淵之主', '深淵風靈', '火靈之主', '水靈之主', '墮落的司祭(四階)', '墮落的司祭(五階)', '魔族暗殺團', '黑暗棲林者', '法令軍王蕾雅', '黑法師', '喚獸師', '魔獸軍王巴蘭卡', '黑虎', '魔熊', '邪惡的鐮刀死神', '不死的木乃伊王', '闇黑的騎士范德', '夢幻之島殺人蜂', '恐怖的吸血鬼', '馬昆斯吸血鬼', '炎魔的分身', '象牙塔炎魔之影', '死亡之劍', '象牙塔死亡之劍', '遺忘之島巨大牛人', '變形怪首領', '夢魘', '恐怖夢魘', '象牙塔翼魔', '鋼鐵高崙', '恐怖的鋼鐵高崙', '象牙塔鋼鐵高崙', '死亡騎士', '卡瑞', '巨蟻女皇', '伊萊克頓', '希爾黛斯', '法利昂', '夢幻之島火蜥蜴', '火蜥蜴', '熔岩高崙', '伊弗利特', '恐怖的伊弗利特', '火焰烈炎獸', '烈炎獸', '暗黑火焰戰士', '火焰戰士', '不死鳥', '暗黑火焰弓箭手', '火焰弓箭手', '火焰阿西塔基奧', '阿西塔基奧', '爆彈花', '龍蠅', '巴拉卡斯', '冰之女王侍女', '底比斯 尖碑石奴', '底比斯 尖碑石奴(黑)', '底比斯 賀洛斯', '底比斯 阿努比斯', '底比斯 阿努斯', '底比斯 阿努斯(黑)', '墳墓守護者', '哈汀之影', '長老．琪娜', '長老．巴洛斯', '墮落的司祭(二階)', '惡魔', '炎魔的惡魔', '象牙塔惡魔之影', '象牙塔果凍怪', /* 🌅 日出之國：官方 sc 特效層（screen）逐動作逐幀對照 */ '鎌鼬', '鎌鼬長兄', '白面金毛九尾狐・九尾']);   // v3.0.13 冰之女王新版無 _w→移除；底比斯4怪有 _w；v3.0.56 象牙塔果凍怪 _w 光澤層(已去灰白霧·飽和/亮度加權alpha)
// ⚔️ v2.7.40 第二武器層 _w2(於 _w 之上再疊一層·如伊弗利特雙武器)：本 Set 的怪多探 <動作>_w2_N.png·render 加 .mob-anim-weapon2(同 screen)·須同時在 MOB_ANIM_WEAPON_FX(才有 _w)。⚠️新增：本體+_s+_w+_w2 一起 --multi 轉共畫布。
const MOB_ANIM_WEAPON_FX2 = new Set(['德雷克', '夢幻之島殺人蜂', '伊弗利特', '恐怖的伊弗利特', '龍蠅', '冰之女王侍女']);   // ⚠️冰之女王侍女只有 death_w2(死亡爆發第二武器層)·live 恆隱藏·僅死亡殘影用；夢幻之島殺人蜂 idle_w2/attack_w2 live 顯示(第二翅膀層)；v3.0.13 冰之女王新版動畫無 _w2→移除
// 🔥 v2.7.22 技能特效層（怪施放技能(_mobAnimTrigger skill)時觸發·一次性·screen 加亮·_updateMobSkillFx 推進）：改設定物件(怪名→cfg)。
//   cfg 欄位：{ startPfx:必·主序列前綴, endPfx:選·尾序列前綴(有=start播畢接end), h:特效高為怪高倍數, ay:特效內錨點, feet:true=錨在腳底(地面型·如敵人施法火環)否則錨身體中心 }。
//   來源：DK/卡瑞→assets/anim/<怪名>/skill_effect_start/end_N(中心火焰爆發·226×155)；v2.7.23 敵人施法(7怪)→<怪名>/cast_N(腳底火焰環擴散·單序列·189×105 寬扁)。
const MOB_ANIM_SKILL_FX = {
    // 🐉 v3.7.57 被侵蝕的安塔瑞斯（三形態共用·ALIAS 前名字各自查 cfg）：劇毒噴吐綠霧錨定層（7574 dir6·luma·世界錨定 ox 可為負=特效向玩家側延伸）
    '被侵蝕的安塔瑞斯':       { startPfx: 'skill_effect', anchored: { ox: -50, oy: 162, bw: 371, bh: 332 } },
    '被侵蝕的狂怒安塔瑞斯':   { startPfx: 'skill_effect', anchored: { ox: -50, oy: 162, bw: 371, bh: 332 } },
    '被侵蝕的瘋狂安塔瑞斯':   { startPfx: 'skill_effect', anchored: { ox: -50, oy: 162, bw: 371, bh: 332 } },
    '死亡騎士':     { startPfx: 'skill_effect_start', endPfx: 'skill_effect_end', h: 1.6, ay: 0.55 },
    '真‧死亡騎士 冥皇丹特斯': { startPfx: 'skill_effect_start', endPfx: 'skill_effect_end', h: 1.6, ay: 0.55 },   // 🌑 v3.4.8 施放技能時疊播死亡騎士技能特效(245 起手8幀+244 尾爆·frames 共用死亡騎士素材)
    '卡瑞':         { startPfx: 'skill_effect_start', endPfx: 'skill_effect_end', h: 1.6, ay: 0.55 },
    '卡士柏':       { startPfx: 'cast', h: 0.45, ay: 0.5, feet: true, lift: 0.2 },   // 🔥 敵人施法：腳底火焰環·單序列（v3.0.37 用戶：太低→上抬本體高 1/5）
    '巴土瑟':       { startPfx: 'cast', h: 0.45, ay: 0.5, feet: true, lift: 0.2 },
    '馬庫爾':       { startPfx: 'cast', h: 0.45, ay: 0.5, feet: true, lift: 0.2 },
    '黑長者':       { startPfx: 'cast', h: 0.45, ay: 0.5, feet: true, lift: 0.2 },
    '巫師':         { startPfx: 'cast', h: 0.45, ay: 0.5, feet: true, lift: 0.2 },
    '西瑪':         { startPfx: 'cast', h: 0.45, ay: 0.5, feet: true, lift: 0.2 },
    '象牙塔黑長者':  { startPfx: 'cast', h: 0.45, ay: 0.5, feet: true, lift: 0.2 },
    '地獄犬':       { startPfx: 'skill_effect', anchored: { ox: -37, oy: 28, bw: 69, bh: 65 } },   // 🔥 v3.0.63 噴火改 anchored 對嘴（原 h:1.0 中心比例＝以怪卡高縮放→過大且蓋全身）：本體 origin(18,47)−特效 origin(55,19)＝(−37,28)·與恐怖的地獄犬同 spr 同參數
    // 🌍 v2.7.31 anchored＝「世界格線錨定」模式（像素級精準·零手調）：特效 spr 與本體共用世界格線但「單獨轉檔」（一起 --multi 會把本體畫布撐大→龍上浮），
    //    由兩份 meta 的 latticeOrigin 換算特效畫布在本體畫布內的精確偏移 (ox,oy)＝(本體ox−特效ox, 本體oy−特效oy)；bw/bh＝本體畫布尺寸（算縮放用）。
    //    渲染：特效疊在本體 img rect + 偏移×縮放（.mob-anim 原生尺寸縮放=1·boss-zoom 等 transform 由 rect/bw 自動吸收）·幀與 skill 動作同鐘同步。
    '安塔瑞斯':     { startPfx: 'skill_effect', anchored: { ox: 161, oy: 135, bw: 425, bh: 307 }, delayF: 8, endHoldF: 2 },   // 🐉 火焰吐息：276×221·本體畫布425×307 origin(188,221)·特效origin(27,86)→偏移(161,135)·delayF8＝張嘴幀(f8 頭壓低)即起噴(v2.7.34 用戶「晚了點」10→8)·endHoldF2＝尾幀定格2幀→吐息跨幀8~18·本體17幀(f16)結束後尾雲再延續2幀
    '吉爾塔斯':     { startPfx: 'skill_effect', anchored: { ox: 111, oy: 67, bw: 463, bh: 377 } },   // 🌑 v3.4.1 施法閃電護罩(5627-0·12幀 338×272)：本體畫布463×377 origin(254,262)−特效 origin(143,195)＝偏移(111,67)·本體 skill 13幀同 8fps ticker 幾乎同步收尾
    // 🌍 v2.7.35 批次 anchored 技能特效(18隻·spr彙整 skill_effect 與本體共世界格線·offset 由 meta latticeOrigin 差自動算·delayF 未調＝與 skill 動作同起播·日後可個別加 delayF/endHoldF 微調時序)：
    '亞力安':       { startPfx: 'skill_effect', anchored: { ox: 44, oy: 31, bw: 134, bh: 114 } },
    '遺忘之島亞力安': { startPfx: 'skill_effect', anchored: { ox: 44, oy: 31, bw: 134, bh: 114 } },
    '安普長老':     { startPfx: 'skill_effect', anchored: { ox: -13, oy: 25, bw: 66, bh: 46 } },
    '思克巴':       { startPfx: 'skill_effect', anchored: { ox: -42, oy: -51, bw: 89, bh: 98 } },
    '思克巴女皇':    { startPfx: 'skill_effect', anchored: { ox: -42, oy: -51, bw: 89, bh: 98 } },
    '暗黑思克巴女皇':  { startPfx: 'skill_effect', anchored: { ox: -42, oy: -51, bw: 89, bh: 98 } },
    '死亡的司祭(思克巴)': { startPfx: 'skill_effect', anchored: { ox: -42, oy: -51, bw: 89, bh: 98 } },
    '炎魔的思克巴':   { startPfx: 'skill_effect', anchored: { ox: -42, oy: -51, bw: 89, bh: 98 } },
    '炎魔的思克巴女皇': { startPfx: 'skill_effect', anchored: { ox: -42, oy: -51, bw: 89, bh: 98 } },
    '惡魔':         { startPfx: 'skill_effect', anchored: { ox: -106, oy: -99, bw: 157, bh: 149 } },
    '炎魔的惡魔':     { startPfx: 'skill_effect', anchored: { ox: -106, oy: -99, bw: 157, bh: 149 } },
    '象牙塔惡魔之影':  { startPfx: 'skill_effect', anchored: { ox: -106, oy: -99, bw: 157, bh: 149 } },
    '邪惡蜥蜴':     { startPfx: 'skill_effect', anchored: { ox: 68, oy: -40, bw: 186, bh: 123 } },
    '遺忘之島邪惡蜥蜴': { startPfx: 'skill_effect', anchored: { ox: 68, oy: -40, bw: 186, bh: 123 } },
    '飛龍':         { startPfx: 'skill_effect', anchored: { ox: -179, oy: -2, bw: 370, bh: 307 } },
    '遺忘之島飛龍':   { startPfx: 'skill_effect', anchored: { ox: -179, oy: -2, bw: 370, bh: 307 } },
    '黑暗精靈':     { startPfx: 'skill_effect', anchored: { ox: -45, oy: 30, bw: 56, bh: 85 } },
    '遺忘之島黑暗精靈': { startPfx: 'skill_effect', anchored: { ox: -45, oy: 30, bw: 56, bh: 85 } },
    '黑法師':       { startPfx: 'skill_effect', anchored: { ox: 39, oy: 50, bw: 97, bh: 130 } },   // v2.7.77 黑法師施法特效(3幀·offset 由 meta latticeOrigin 差自動算·本體畫布97×130)
    // 🌍 v2.7.38 新增 anchored 技能特效(offset 由 spr彙整 meta latticeOrigin 差自動算)：
    '伊萊克頓':     { startPfx: 'skill_effect', anchored: { ox: 27, oy: -13, bw: 217, bh: 150 } },
    '希爾黛斯':     { startPfx: 'skill_effect', anchored: { ox: 184, oy: 159, bw: 399, bh: 300 } },   // 🌊 v3.2.x 重作：本體/影子/武器改回原生全畫布 399×300(dir4 正面·idle12/attack8/skill8/hurt2/death13·body1603+_s1604+_w1605)→不再裁邊(死亡爆炸/漩渦外圍粒子完整)；anchored 還原裁切前 ox184/oy159/bw399/bh300；本體放大靠 MOB_ANIM_BIG(185px 上限)不靠裁切
    '法利昂':       { startPfx: 'skill_effect', anchored: { ox: 39, oy: 129, bw: 375, bh: 249 } },
    // 🔥 v2.7.40 火焰系新怪 anchored 技能特效：
    '伊弗利特':     { startPfx: 'skill_effect', anchored: { ox: 19, oy: 77, bw: 135, bh: 203 } },
    '恐怖的伊弗利特': { startPfx: 'skill_effect', anchored: { ox: 19, oy: 77, bw: 135, bh: 203 } },
    '火焰烈炎獸':   { startPfx: 'skill_effect', anchored: { ox: 59, oy: 31, bw: 133, bh: 124 } },
    '烈炎獸':       { startPfx: 'skill_effect', anchored: { ox: 59, oy: 31, bw: 133, bh: 124 } },
    // 🔥 v2.7.41 不死鳥雙特效層(skill_effect + skill_effect2 同畫布 --multi·同一 anchored 偏移·兩層同步播)：
    '不死鳥':       { startPfx: 'skill_effect', startPfx2: 'skill_effect2', anchored: { ox: 252, oy: 8, bw: 640, bh: 477 } },
    // 🐉 v2.7.44 巴拉卡斯(v2.7.10 部署時只有 body·用戶補全套影子/武器/技能特效)：
    '巴拉卡斯':     { startPfx: 'skill_effect', anchored: { ox: 286, oy: 189, bw: 578, bh: 407 } },
    // 🐍 v2.7.57 梅杜莎/小惡魔三兄弟/不滅的巫妖 anchored 技能特效：
    '梅杜莎':       { startPfx: 'skill_effect', anchored: { ox: 18, oy: -10, bw: 101, bh: 71 } },
    '小惡魔':       { startPfx: 'skill_effect', anchored: { ox: 7, oy: -5, bw: 81, bh: 114 } },
    '炎魔的小惡魔':   { startPfx: 'skill_effect', anchored: { ox: 7, oy: -5, bw: 81, bh: 114 } },
    '象牙塔小惡魔':   { startPfx: 'skill_effect', anchored: { ox: 7, oy: -5, bw: 81, bh: 114 } },
    '不滅的巫妖':     { startPfx: 'skill_effect', anchored: { ox: 1, oy: -9, bw: 173, bh: 212 } },
    // ⚡ v2.7.58 林德拜爾 電擊蓄能(3幀 44×66·frame0-2 低頭收攏時吻部光球→抬頭嘶吼=放電·視覺比對確認 delayF:0 正確·勿加 delay 否則錯位到胸口)：
    '林德拜爾':     { startPfx: 'skill_effect', anchored: { ox: 226, oy: 338, bw: 441, bh: 497 } },
    // 💧 v2.7.59 水靈之主/深淵水靈 anchored 技能特效（body 亦 luma-alpha 發光型）：
    '水靈之主':     { startPfx: 'skill_effect', anchored: { ox: 184, oy: 159, bw: 399, bh: 256 } },   // v2.7.78 重匯 spr 更新畫布(163×156→399×256)＋重算 offset
    '深淵水靈':     { startPfx: 'skill_effect', anchored: { ox: 43, oy: 76, bw: 163, bh: 156 } },
    '深淵之主':     { startPfx: 'skill_effect', anchored: { ox: -120, oy: -98, bw: 142, bh: 149 } },   // v2.7.78 新怪·深淵 boss 施法特效(19幀·luma-alpha·本體畫布142×149)
    '高等蜥蜴人':   { startPfx: 'skill_effect', anchored: { ox: 21, oy: 3, bw: 87, bh: 101 } },   // v2.7.80 新怪(12幀)
    '曼波兔':       { startPfx: 'skill_effect', anchored: { ox: -93, oy: 20, bw: 74, bh: 134 } },   // v2.7.80 新怪(9幀)
    '墮落':         { startPfx: 'skill_effect', anchored: { ox: 50, oy: -30, bw: 221, bh: 283 } },   // v2.7.80 新怪(12幀)
    '德雷克':       { startPfx: 'skill_effect', anchored: { ox: 25, oy: 23, bw: 167, bh: 158 } },   // v2.7.81 新怪(28幀·另有 attack_w2 第二武器層)
    '血色術士':     { startPfx: 'skill_effect', anchored: { ox: 70, oy: 108, bw: 163, bh: 214 } },   // v2.7.84 新怪(5幀)
    '長老．艾迪爾':  { startPfx: 'skill_effect', anchored: { ox: 71, oy: 34, bw: 135, bh: 131 } },   // v2.7.85 新怪(3幀)
    '闇黑君王':     { startPfx: 'skill_effect', anchored: { ox: -19, oy: 19, bw: 156, bh: 203 } },   // v2.7.84 新怪(8幀)
    '死亡':         { startPfx: 'skill_effect', anchored: { ox: 3, oy: -36, bw: 153, bh: 122 } },   // v2.7.82 新怪(4幀·attack_w only)
    '冥法軍王海露拜': { startPfx: 'skill_effect', anchored: { ox: -17, oy: 3, bw: 115, bh: 117 } },   // v2.7.82 新怪(6幀)
    // 🧛 v2.7.60 恐怖的吸血鬼/馬昆斯吸血鬼 anchored 技能特效（另有 skill_w 揮動層·live idle_w 404 隱藏·僅 skill 動作出現）：
    '恐怖的吸血鬼': { startPfx: 'skill_effect', anchored: { ox: -40, oy: -39, bw: 74, bh: 92 } },
    '馬昆斯吸血鬼': { startPfx: 'skill_effect', anchored: { ox: -40, oy: -39, bw: 74, bh: 92 } },
    // 👁 v2.7.61 幻象眼魔 boss/小幻象眼魔 幻象光線 anchored(skill_effect 11幀·與 skill 動作同步)：
    '不幸的幻象眼魔': { startPfx: 'skill_effect', anchored: { ox: -24, oy: -31, bw: 172, bh: 246 } },
    '小幻象眼魔':   { startPfx: 'skill_effect', anchored: { ox: -24, oy: -31, bw: 172, bh: 246 } },
    // 🕷 v2.7.62 傲慢的潔尼斯女王/扭曲的潔尼斯女王(boss) 劇毒 anchored(skill_effect 3幀·同底圖蜘蛛惡魔·源 spr huet→hurt 修正)：
    '傲慢的潔尼斯女王': { startPfx: 'skill_effect', anchored: { ox: -58, oy: -30, bw: 128, bh: 116 } },   // v2.7.65 用戶更新 skill/skill_effect/skill_s(effect 3→12幀·重算錨點)
    '扭曲的潔尼斯女王': { startPfx: 'skill_effect', anchored: { ox: 45, oy: 36, bw: 128, bh: 118 } },
    // 🧝 v2.7.70 黑暗精靈使 anchored(skill_effect 10幀·body 54×83)：
    '黑暗精靈使': { startPfx: 'skill_effect', anchored: { ox: 11, oy: -28, bw: 54, bh: 83 } },
    // 🧝🐕 v2.7.72 黑暗妖精法師/恐怖的地獄犬 anchored skill_effect：
    '黑暗妖精法師': { startPfx: 'skill_effect', anchored: { ox: 22, oy: -22, bw: 78, bh: 133 } },
    '恐怖的地獄犬': { startPfx: 'skill_effect', anchored: { ox: -37, oy: 28, bw: 69, bh: 65 } },
    // 🧙 v2.7.88 新怪 anchored skill_effect（offset 由 spr彙整 body/effect meta latticeOrigin 差自動算）：
    '哈汀之影':     { startPfx: 'skill_effect', anchored: { ox: 21, oy: 75, bw: 100, bh: 183 } },   // 象牙塔 Lv60 施法(黑魔法力場·effect 3幀)
    '長老．琪娜':   { startPfx: 'skill_effect', anchored: { ox: 71, oy: -4, bw: 186, bh: 185 } },   // 長老 boss Lv78(effect 5幀)
    '長老．巴洛斯': { startPfx: 'skill_effect', anchored: { ox: -19, oy: -14, bw: 178, bh: 141 } }, // 長老 boss Lv88(effect 7幀·僅 skill_w 武器層)
    '長老．巴陸德': { startPfx: 'skill_effect', anchored: { ox: 26, oy: 87, bw: 130, bh: 220 } },   // 長老 boss Lv96(effect 5幀·無 _w)
    // 🧊 v3.0.13 新版真彩 spr 三隻特效怪（effects 與本體分開轉·--luma-alpha·anchored=兩 meta latticeOrigin 差）：
    '冰之女王':       { startPfx: 'skill_effect', endPfx: 'skill_effect2', anchored: { ox: -48, oy: 50, bw: 165, bh: 162 } },   // 冰雪暴施法：8幀起手→21幀冰暴(序列·共29幀)·eff 238x145
    '底比斯 賀洛斯':   { startPfx: 'skill_effect', anchored: { ox: 16, oy: -41, bw: 221, bh: 174 } },   // 火焰放射：16幀火焰爆發·eff 251x244
    '底比斯 阿努比斯': { startPfx: 'skill_effect1', startPfx2: 'skill_effect2', startPfx3: 'skill_effect3', anchored: { ox: -67, oy: -152, bw: 97, bh: 189 } },   // 震裂踏擊：12/11/11幀三層同時(v3.0.13 引擎新增第三層)·eff 207x368
    // 🌈 v3.0.17 新增二隻斯芬克斯（彩虹波動·effect 與本體分開轉·--luma-alpha·anchored=兩 meta latticeOrigin 差）：
    '底比斯 斯芬克斯':     { startPfx: 'skill_effect', anchored: { ox: 52, oy: 0, bw: 128, bh: 139 } },   // 彩虹波動：10幀彩虹光環·eff 68x45
    '底比斯 斯芬克斯(黑)': { startPfx: 'skill_effect', anchored: { ox: 23, oy: 48, bw: 133, bh: 117 } },  // 彩虹波動(黑)：7幀藍色爆發(前5幀原始即空幀·尾段才顯)·eff 55x52
};
// 怪物「靜態顯示圖」候選：有動畫→戰鬥優先 spawn_0、圖鑑優先 idle_0，退回舊靜態 PNG；無動畫→直接舊靜態。回傳 {src, fb:[後備...]}（fb 走 onerror 逐張退·各呼叫點自行在末端補佔位符）。
function mobStillImg(name, staticUrl, preferSpawn) {
    let base = staticUrl || `assets/icons/monsters/${name}.png`;
    if (!MOB_ANIM_NAMES.has(name)) return { src: base, fb: [] };
    let dir = _animDir(name);   // 🔗 v3.0.7 共用怪→幀 URL 走目標資料夾
    // 🧭 v3.2.64 八方向怪：idle 幀在 d<N> 子資料夾（根目錄無 idle_0）→圖鑑/靜態縮圖取「面對玩家」的方向（d6=SW·同戰場預設向/寵物縮圖）；退 d5(S 正面)→base
    if (typeof MOB_ANIM_8DIR !== 'undefined' && MOB_ANIM_8DIR.has(name)) {
        return { src: `assets/anim/${dir}/d6/idle_0.png`, fb: [`assets/anim/${dir}/d5/idle_0.png`, base] };
    }
    let list = [];
    if (preferSpawn) {
        let _c = (typeof _mobAnimCache !== 'undefined') ? _mobAnimCache[name] : undefined;
        // 🎬 v2.6.93 已探測且確定「無登場動畫」(如哥布林只有 idle/attack/death)→不放 spawn_0，免每次渲染固定 404；未探測/探測中仍嘗試(首見一次無害)。
        if (!(_c && _c !== 'probing' && (!_c.spawn || !_c.spawn.length))) list.push(`assets/anim/${dir}/spawn_0.png`);
    }
    list.push(`assets/anim/${dir}/idle_0.png`, base);
    return { src: list[0], fb: list.slice(1) };
}
// 通用 img onerror：依 data-fb（|分隔清單）逐張退回，用盡則停。
function _mobImgErr(img) {
    try {
        let fb = (img.getAttribute('data-fb') || '').split('|').filter(Boolean);
        if (fb.length) { img.setAttribute('data-fb', fb.slice(1).join('|')); img.src = fb[0]; }
        else { img.onerror = null; }
    } catch (e) { img.onerror = null; }
}
// 🔗 v3.0.7 動畫資料夾共用(alias)：自身無可用 spr 的怪→借用另一隻已部署怪的 assets/anim/<目標>/ 幀(URL 層 redirect·_mobAnimCache 仍以自身名為 key)。
//   ⚠️ 目標怪須已部署且在 MOB_ANIM_NAMES；共用怪自身也要加進 MOB_ANIM_NAMES(+SPRITE_SHADOW 若目標有 _s)。目標更新→共用怪自動跟著(真共用非複製)。
const MOB_ANIM_ALIAS = { '老虎': '虎男',   // 🔗 動畫資料夾共用 alias(名→目標名)·🐾 v3.2.17 老虎共用虎男素材（真共用非複製）
    '被侵蝕的狂怒安塔瑞斯': '被侵蝕的安塔瑞斯', '被侵蝕的瘋狂安塔瑞斯': '被侵蝕的安塔瑞斯',   // 🐉 v3.7.57 三段變身共用本體（elite antharas one·變身時新物件重播 spawn=entry 破土登場·擊敗瘋狂形態播 death=escape 鑽地遁走）
    // 👥 v3.5.64 血盟敵人戰鬥動態改「玩家職業動畫」：assets/anim/玩家<avatar>（由 assets/classanim/<avatar>2 左前向依各職業代表武器產出·部署器 scratchpad/deploy_player_anim.js）。
    //   14 名皆原本就在 MOB_ANIM_NAMES＋SPRITE_SHADOW（新資料夾含 _s 影子）·不在 WEAPON_FX/8DIR→只需 alias；白目玩家（js/03）動態註冊共用同一批資料夾。
    '阿頓': '玩家男騎士', '鋼鐵阿頓': '玩家男騎士', '依詩蒂': '玩家女騎士',
    '特羅斯王子': '玩家王子', '依詩蒂公主': '玩家公主',
    '朱利安': '玩家男妖精', '月光朱利安': '玩家男妖精', '歐薇': '玩家女妖精', '月之精靈歐薇': '玩家女妖精',
    '喬': '玩家男法師', '魔法師喬': '玩家男法師', '賽尼斯': '玩家女法師', '魔女賽尼斯': '玩家女法師',
    '闇影格立特': '玩家男黑暗妖精' };
function _animDir(name) { return (typeof MOB_ANIM_ALIAS !== 'undefined' && MOB_ANIM_ALIAS[name]) ? MOB_ANIM_ALIAS[name] : name; }
// 🚀 v3.4.37 幀探測平行化（滑動窗口）：取代「載完第 N 張才載第 N+1 張」的串行鏈——一次最多 6 張在途，
//   高延遲環境（GitHub Pages RTT ~100ms）首次動畫就緒時間 ≈ 原本 1/6（法利昂 death 27 幀：27 次往返→5 次）。
//   語意不變：幀必須從 0 連續、遇缺號即止；缺號當下已在途的最多多載 5 個 404（無害·不進結果）。
//   urlFor(i)→第 i 幀 URL；done(frames|null, n)=連續幀陣列（<minF 給 null）＋連續幀數。共用於 _mobAnimProbe/_mob8Probe/_battleSpriteProbe/js22 寵物八方向。
// 📇 v3.4.40 幀數 manifest 查表（js/anim-manifest.js·工具 tools/gen-anim-manifest.js）：由 urlFor(0) 反解「資料夾＋前綴」→ 已知幀數。
//   回傳 number＝確定幀數（0＝確定沒有此序列·連一個請求都不用發）；null＝manifest 未涵蓋 → 呼叫端退回原本的 404 探測（安全網）。
//   ⚠️ 三棵資產樹的 URL 編碼不一致（_mobAnimProbe 用裸中文名·_mob8Probe/js22/classanim 用 encodeURIComponent）→ 一律 decodeURIComponent 正規化後再查。
function _manifestCount(url0) {
    if (typeof ANIM_MANIFEST === 'undefined' || !ANIM_MANIFEST) return null;
    let p; try { p = decodeURIComponent(url0); } catch (e) { return null; }   // 壞的 % 序列→退探測
    if (p.slice(-5) !== '0.png') return null;
    let parts = p.slice(0, -5).split('/');                                    // 去掉結尾的 "0.png"（urlFor(0) 的索引恆為單字元 0）
    if (parts.length < 4) return null;
    let ent = ANIM_MANIFEST[parts.slice(0, 3).join('/')];                     // assets/<tree>/<資料夾>
    if (!ent) return null;                                                    // 整個資料夾不在表內→退探測（不敢斷言 0）
    let n = ent[parts.slice(3).join('/')];                                    // 前綴（八方向含 "d6/" 前置）
    return (typeof n === 'number') ? n : 0;                                   // 資料夾在表內但無此前綴＝確定 0 幀
}
function _probeFramesWin(urlFor, maxF, minF, done) {
    // 🚀 v3.4.40 快路徑：幀數已知→直接平行載精確張數（零 404·零探測往返·離線同樣受益）。
    //    仍逐幀檢查載入結果並只取「從 0 起的連續段」→ manifest 過期(少載/多載)也不會壞，語意與探測完全一致。
    let known = _manifestCount(urlFor(0));
    if (known !== null) {
        if (known === 0) { done(null, 0); return; }                           // 確定沒有此序列→零請求
        let got = [], left = known;
        let step = () => {
            if (--left > 0) return;
            let n = 0;
            while (n < known && got[n]) n++;                                  // 連續段（與探測同語意）
            done(n >= (minF || 2) ? got.slice(0, n) : null, n);
        };
        for (let i = 0; i < known; i++) {
            let im = new Image();
            im.onload = () => { got[i] = im; step(); };
            im.onerror = () => { got[i] = false; step(); };                   // manifest 過期→該幀當缺號·截斷至連續段
            im.src = urlFor(i);
        }
        return;
    }
    const WIN = 6;
    let results = [], next = 0, inFlight = 0, stopAt = maxF, finished = false;
    function settle() {
        if (finished) return;
        let n = 0;
        while (n < stopAt && results[n]) n++;                      // 從 0 起算的連續已載幀數
        if (n >= stopAt || results[n] === false) {                 // 連續段已確定（其後在途的載完也不影響結果）
            finished = true;
            done(n >= minF ? results.slice(0, n) : null, n);
            return;
        }
        pump();
    }
    function pump() {
        while (!finished && inFlight < WIN && next < stopAt) {
            let i = next++; inFlight++;
            let im = new Image();
            im.onload = () => { inFlight--; results[i] = im; settle(); };
            im.onerror = () => { inFlight--; results[i] = false; if (i < stopAt) stopAt = i; settle(); };
            im.src = urlFor(i);
        }
    }
    pump();
}
function _mobAnimProbe(name) {
    if (_mobAnimCache[name] !== undefined) return;
    _mobAnimCache[name] = 'probing';
    let animName = _animDir(name);   // 🔗 共用怪：本體/影子/武器幀 URL 走目標資料夾(cache 仍 keyed by name)
    let hasShadow = (typeof MOB_ANIM_SPRITE_SHADOW !== 'undefined') && MOB_ANIM_SPRITE_SHADOW.has(name);   // 🌑 真實影子 sprite→額外探測 <動作>_s_N.png
    let hasWeapon = (typeof MOB_ANIM_WEAPON_FX !== 'undefined') && MOB_ANIM_WEAPON_FX.has(name);           // ⚔️ 武器揮動特效→額外探測 <動作>_w_N.png
    let hasWeapon2 = (typeof MOB_ANIM_WEAPON_FX2 !== 'undefined') && MOB_ANIM_WEAPON_FX2.has(name);        // ⚔️ v2.7.40 第二武器層→額外探測 <動作>_w2_N.png
    let skfCfg = (typeof MOB_ANIM_SKILL_FX !== 'undefined') ? MOB_ANIM_SKILL_FX[name] : null;               // 🔥 技能特效 cfg(怪名→{startPfx,endPfx?,h,ay,feet?})
    let hasSkillFx = !!skfCfg;
    let out = { idle: null, spawn: null, attack: null, skill: null, hurt: null, death: null };
    if (hasShadow) out.shadow = { idle: null, spawn: null, attack: null, skill: null, hurt: null, death: null };
    if (hasWeapon) out.weapon = { idle: null, spawn: null, attack: null, skill: null, hurt: null, death: null };
    if (hasWeapon2) out.weapon2 = { idle: null, spawn: null, attack: null, skill: null, hurt: null, death: null };
    if (hasSkillFx) out.skillFx = { start: null, end: null };
    let pending = 6 + (hasShadow ? 6 : 0) + (hasWeapon ? 6 : 0) + (hasWeapon2 ? 6 : 0) + (hasSkillFx ? (1 + (skfCfg.endPfx ? 1 : 0) + (skfCfg.startPfx2 ? 1 : 0) + (skfCfg.startPfx3 ? 1 : 0)) : 0);
    let finish = () => { if (--pending > 0) return; _mobAnimCache[name] = (out.idle || out.spawn || out.attack || out.skill || out.hurt || out.death) ? out : null; };
    let probeSeq = (target, key, prefixes, minF) => {   // 依前綴平行探測(滑動窗口)到缺號為止；idle 先試 idle_ 再退裸編號。minF=最少幀數(受擊 hurt 允許 1 幀)
        let pi = 0;
        let attempt = () => _probeFramesWin(i => `assets/anim/${animName}/${prefixes[pi]}${i}.png`, MOB_ANIM_MAX_FRAMES, minF || 2, (frames, n) => {
            if (!frames && n === 0 && pi + 1 < prefixes.length) { pi++; attempt(); return; }   // 第 0 幀即缺→換下一個前綴重試（同舊制：僅首幀缺才換前綴）
            target[key] = frames; finish();
        });
        attempt();
    };
    probeSeq(out, 'idle', ['idle_', '']);
    probeSeq(out, 'spawn', ['spawn_']);
    probeSeq(out, 'attack', ['attack_']);
    probeSeq(out, 'skill', ['skill_']);
    probeSeq(out, 'hurt', ['hurt_'], 1);   // 🎬 v2.6.94 受擊動畫（通常 1~2 幀→允許單幀；被擊中優先播放一輪回待機）
    probeSeq(out, 'death', ['death_']);
    if (hasShadow) {   // 🌑 影子層各動作序列（幀數與本體對應動作相同→_mobAnimApply 用同一幀索引同步）
        probeSeq(out.shadow, 'idle', ['idle_s_']);
        probeSeq(out.shadow, 'spawn', ['spawn_s_']);
        probeSeq(out.shadow, 'attack', ['attack_s_']);
        probeSeq(out.shadow, 'skill', ['skill_s_']);
        probeSeq(out.shadow, 'hurt', ['hurt_s_'], 1);
        probeSeq(out.shadow, 'death', ['death_s_']);
    }
    if (hasWeapon) {   // ⚔️ 武器揮動特效層各動作序列（同幀索引·允許單幀·揮動空幀本就透明）
        probeSeq(out.weapon, 'idle', ['idle_w_'], 1);
        probeSeq(out.weapon, 'spawn', ['spawn_w_'], 1);
        probeSeq(out.weapon, 'attack', ['attack_w_'], 1);
        probeSeq(out.weapon, 'skill', ['skill_w_'], 1);
        probeSeq(out.weapon, 'hurt', ['hurt_w_'], 1);
        probeSeq(out.weapon, 'death', ['death_w_'], 1);
    }
    if (hasWeapon2) {   // ⚔️ v2.7.40 第二武器層各動作序列(同 _w 機制·前綴 _w2_)
        probeSeq(out.weapon2, 'idle', ['idle_w2_'], 1);
        probeSeq(out.weapon2, 'spawn', ['spawn_w2_'], 1);
        probeSeq(out.weapon2, 'attack', ['attack_w2_'], 1);
        probeSeq(out.weapon2, 'skill', ['skill_w2_'], 1);
        probeSeq(out.weapon2, 'hurt', ['hurt_w2_'], 1);
        probeSeq(out.weapon2, 'death', ['death_w2_'], 1);
    }
    if (hasSkillFx) {   // 🔥 技能特效：主序列 startPfx(允許單幀·敵人施法 cast)＋選配 endPfx(DK/卡瑞 skill_effect_end 單幀)
        probeSeq(out.skillFx, 'start', [skfCfg.startPfx + '_'], 1);
        if (skfCfg.endPfx) probeSeq(out.skillFx, 'end', [skfCfg.endPfx + '_'], 1);
        if (skfCfg.startPfx2) probeSeq(out.skillFx, 'start2', [skfCfg.startPfx2 + '_'], 1);   // 🔥 v2.7.41 第二特效層(不死鳥 skill_effect2·與 start 同畫布同錨定·同步播)
        if (skfCfg.startPfx3) probeSeq(out.skillFx, 'start3', [skfCfg.startPfx3 + '_'], 1);   // 🔥 v3.0.13 第三特效層(阿努比斯 skill_effect3)
    }
}
// 🎬 觸發單次動作（js/04 攻擊/技能掛點呼叫）：鎖定動作（登場/技能）播放中→忽略新觸發（強制放完）
function _mobAnimTrigger(m, k) {
    if (!m) return;
    if (typeof state !== 'undefined' && state.ff) return;   // 🎬 v3.2.72 背景補跑期間不觸發怪物動作動畫/技能特效登記→切分頁回來不會全場怪物同步爆播攻擊/技能（比照 v3.2.65 _vfxMute 對特效的處理·此為 sprite 幀動畫路徑）
    let cur = m._animAct;
    if (cur && cur.lock) {   // 鎖定動作播放中？（以快取序列長度判斷是否還沒播完）
        let a = _mobAnimCache[m.n];
        let seq = (a && a !== 'probing') ? a[cur.k] : null;
        if (seq && (Date.now() - cur.t) < seq.length * (1000 / MOB_ANIM_FPS)) return;   // 還在播→不打斷、不排隊
    }
    m._animAct = { k: k, t: Date.now(), lock: (k === 'spawn' || k === 'skill') };
    if (k === 'skill' && (typeof MOB_ANIM_SKILL_FX !== 'undefined') && MOB_ANIM_SKILL_FX[m.n]) {   // 🔥 技能觸發同時登記技能特效(start→end·_updateMobSkillFx 推進)
        if (_mobSkillFx[m.uid] && _mobSkillFx[m.uid].el) _mobSkillFx[m.uid].el.remove();
        if (_mobSkillFx[m.uid] && _mobSkillFx[m.uid].el2) _mobSkillFx[m.uid].el2.remove();   // 🔥 v2.7.41 重觸發也移除第二特效層(不死鳥)·防 DOM 洩漏(審查發現的第4個 cleanup 點)
        _mobSkillFx[m.uid] = { t0: Date.now(), el: null };
    }
}
// ===== 🧭 v3.2.11 八方向怪物：依攻擊目標選面向 =====
//   名單內的怪：assets/anim/<名>/d0..d7/ 各一組動作(idle/attack/hurt/death)+影子(_s)；d0..d7 全部共畫布(--multi)→換方向不跳大小/位置。
//   方向羅盤：dir 從左上 NW 順時針每 45°（0=NW 1=N 2=NE 3=E 4=SE 5=S 6=SW 7=W）·對應 spr 檔號 動作×8+方向。
//   面向＝怪 sprite 中心 → 目標 sprite 中心 的螢幕向量選最近方向；目標由 js/04 寫 m._facePartyKey(P/A:slot)，未定→退玩家 sprite→退預設 dir6。
//   惰性載入：只載實際用到的方向(固定側視戰場僅下半球數個方向會被選到)；未載好先退上次成功方向/預設 d6。
const MOB_ANIM_8DIR = new Set(['杜賓狗', /* 🐾 v3.2.17 夥伴更新12怪（素材＝寵物八方向共用） */ /* 🔁 v3.2.20 同名怪去重：改讀八方向共用圖·舊根圖已刪（冰人保留spawn·火系等7隻保留特效層不切） */ '哈柏哥布林', '甘地妖魔', '都達瑪拉妖魔', '妖魔巡守', '狂野毒牙', '狂野之毒', '狂野之魔', '食人妖精', '食人妖精王', '狂暴蜥蜴人', '重裝蜥蜴人', '魔狼', '魔蝙蝠', '巨大守護螞蟻', '強化白螞蟻群', '巨大強化白螞蟻', '地獄奴隸', '闇精靈王', '狼', '熊', '哈士奇', '牧羊犬',  '老虎', '貓', '熊貓', '高麗幼犬', '浣熊', '聖伯納犬', '狐狸', '暴走兔', '小獵犬', '柯利', '袋鼠', '猴子']);   // 🐕 v3.2.11 杜賓狗試點 → v3.2.17 擴 12 捕捉動物
let _mob8Cache = {};   // '<名>#<dir>' → {idle,attack,hurt,death, shadow:{...}} | 'probing' | null
function _vec2dir(dx, dy) {   // 螢幕向量(x右·y下)→ dir 0-7（NW 順時針）
    let oct = Math.round(Math.atan2(dy, dx) * 4 / Math.PI);   // -4..4：0=E 1=SE 2=S 3=SW ±4=W -3=NW -2=N -1=NE
    let map = { '0': 3, '1': 4, '2': 5, '3': 6, '4': 7, '-4': 7, '-3': 0, '-2': 1, '-1': 2 };
    let r = map[String(oct)];
    return (r == null) ? 6 : r;
}
function _mob8Probe(name, dir) {
    let key = name + '#' + dir;
    if (_mob8Cache[key] !== undefined) return;
    _mob8Cache[key] = 'probing';
    let folder = 'assets/anim/' + encodeURIComponent(_animDir(name)) + '/d' + dir + '/';   // 🔗 v3.2.17 八方向亦吃共用 alias（老虎→虎男）
    let out = { shadow: {} };
    let acts = ['idle', 'attack', 'hurt', 'death'];
    let pending = acts.length * 2;
    let finish = () => { if (--pending > 0) return; _mob8Cache[key] = out.idle ? out : null; };
    let probeSeq = (target, k, pfx, minF) => {   // 🚀 平行探測（滑動窗口·見 _probeFramesWin）
        _probeFramesWin(i => folder + pfx + i + '.png', MOB_ANIM_MAX_FRAMES, minF || 2, frames => { target[k] = frames; finish(); });
    };
    acts.forEach(a => { probeSeq(out, a, a + '_', a === 'hurt' ? 1 : 2); probeSeq(out.shadow, a, a + '_s_', 1); });
}
function _mob8TargetRect(m) {
    let key = m && m._facePartyKey;
    let who = key === 'P' ? player : null;
    if(!who && typeof key === 'string' && key.indexOf('A:') === 0) {
        let slot = key.slice(2);
        who = (player.allies || []).find(a => a && String(a._slot || '') === slot) || null;
    }
    if (who && typeof _partyMemberRect === 'function') { let r = _partyMemberRect(who); if (r) return r; }   // 攻擊掛點記錄的目標(player/ally)
    if (typeof _pmCasterRect === 'function') { let r = _pmCasterRect(); if (r) return r; }                    // 退：主玩家 sprite
    return null;
}
function _mob8FaceDir(m, box) {
    try {
        let tr = _mob8TargetRect(m); if (!tr) return (m._face8 != null) ? m._face8 : 6;
        let mr = box.getBoundingClientRect(); if (!mr.width) return (m._face8 != null) ? m._face8 : 6;
        let dx = (tr.left + tr.width / 2) - (mr.left + mr.width / 2);
        let dy = (tr.top + tr.height * 0.5) - (mr.top + mr.height * 0.5);
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return (m._face8 != null) ? m._face8 : 6;
        let d = _vec2dir(dx, dy); m._face8 = d; return d;
    } catch (e) { return (m._face8 != null) ? m._face8 : 6; }
}
function _mob8Apply(c, m, uid, now) {
    now = now || Date.now();
    let box = c.querySelector('.mob-img-inner') || c.querySelector('.mob-img-wrap') || c;
    let dir = _mob8FaceDir(m, box);
    let a = _mob8Cache[m.n + '#' + dir];
    if (a === undefined) { _mob8Probe(m.n, dir); }
    if (!a || a === 'probing') {   // 該方向未載好→退上次成功方向／預設 d6
        let fb = (m._face8Loaded != null) ? m._face8Loaded : 6;
        a = _mob8Cache[m.n + '#' + fb];
        if (a === undefined) { _mob8Probe(m.n, fb); }
        if (!a || a === 'probing') return;   // 連退路都還沒好→本幀維持靜態圖
    } else { m._face8Loaded = dir; }
    m._animSpawned = true;   // 8 方向怪無 spawn 動作·標記免走 spawn 觸發
    let img = c.querySelector('.mob-img-wrap .mob-img-inner img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)') || c.querySelector('.mob-img-wrap img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)');
    if (!img) return;
    let _act = null, _f = 0;
    if (m._animAct) {   // 單次動作（攻擊/受擊/死亡）：自觸發時刻逐幀播一輪
        let _ak = m._animAct.k, seq = a[_ak];
        if (!seq && (_ak === 'skill' || _ak === 'spawn') && a.attack) { _ak = 'attack'; seq = a.attack; }
        if (seq) { let ff = Math.floor((now - m._animAct.t) / (1000 / MOB_ANIM_FPS)); if (ff < seq.length) { _act = _ak; _f = ff; } else m._animAct = null; }
        else m._animAct = null;
    }
    if (_act === null && a.idle) { let _ofs = 0; { let s = String(uid); for (let j = 0; j < s.length; j++) _ofs += s.charCodeAt(j); } _act = 'idle'; _f = (Math.floor(now / (1000 / MOB_ANIM_FPS)) + _ofs) % a.idle.length; }
    if (_act === null) return;
    let _bseq = a[_act];
    if (_bseq && _bseq[_f] && img.src !== _bseq[_f].src) img.src = _bseq[_f].src;
    let _simg = c.querySelector('.mob-anim-shadow');
    if (_simg && a.shadow) {
        let _sseq = a.shadow[_act];
        if (_sseq && _sseq.length) { if (_simg.style.visibility === 'hidden') _simg.style.visibility = ''; let _sf = _f < _sseq.length ? _f : (_f % _sseq.length); if (_simg.src !== _sseq[_sf].src) _simg.src = _sseq[_sf].src; }
        else if (_simg.style.visibility !== 'hidden') _simg.style.visibility = 'hidden';
    }
}
function _mobAnimApply() {
    let ml = document.getElementById('mob-list'); if (!ml) return;
    if (typeof mapState === 'undefined' || !mapState.mobs) return;
    let now = Date.now();
    _trimMobAnimCaches(now);
    let mobByUid = new Map();
    for (let mob of mapState.mobs) if (mob) mobByUid.set(String(mob.uid), mob);
    let cards = ml.querySelectorAll('.mob-target[data-uid]');
    for (let c of cards) {
        let uid = c.getAttribute('data-uid');
        let m = mobByUid.get(String(uid));
        if (!m) continue;
        if (!MOB_ANIM_NAMES.has(m.n)) continue;   // 🎬 非動畫名單→維持靜態圖·不探測（免對 1000+ 無動畫怪發 404）
        if (MOB_ANIM_8DIR.has(m.n)) { _mob8Apply(c, m, uid, now); continue; }   // 🧭 v3.2.11 八方向怪：依攻擊目標選向（不走通用單方向路徑）
        let a = _mobAnimCache[m.n];
        if (a === undefined) { _mobAnimProbe(m.n); continue; }   // 首次遇到→背景探測幀檔（探測完成前維持靜態圖）
        if (!a || a === 'probing') continue;
        if (!m._animSpawned) { m._animSpawned = true; if (a.spawn) _mobAnimTrigger(m, 'spawn'); }   // 🎬 登場：該怪物物件首次被動畫系統看到→播登場一輪（每隻一次）
        let img = c.querySelector('.mob-img-wrap .mob-img-inner img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)') || c.querySelector('.mob-img-wrap img:not(.mob-anim-shadow):not(.mob-anim-weapon):not(.mob-anim-weapon2)'); if (!img) continue;
        let _act = null, _f = 0;   // 🌑 先決定「動作＋幀索引」，本體與影子共用→逐幀同步
        if (m._animAct) {   // 🎬 單次動作（登場/攻擊/技能/受擊）：自觸發時刻起逐幀播一輪，播畢清除回待機
            let _ak = m._animAct.k;
            let seq = a[_ak];
            if (!seq && _ak === 'skill' && a.attack) { _ak = 'attack'; seq = a.attack; }   // 🎞️ v2.7.50 怪施放技能但無 skill_*.png 幀→改播 attack_*.png（_act 一併改 attack→影子/武器層同步；skill_effect 疊層仍由 _mobAnimTrigger 以原技能意圖登記，不受影響）
            if (seq) {
                let ff = Math.floor((now - m._animAct.t) / (1000 / MOB_ANIM_FPS));
                if (ff < seq.length) { _act = _ak; _f = ff; } else m._animAct = null;
            } else m._animAct = null;   // 該動作無序列（且無 attack 後備）→直接清（維持待機）
        }
        if (_act === null && a.idle) {
            let _ofs = 0; { let s = String(uid); for (let j = 0; j < s.length; j++) _ofs += s.charCodeAt(j); }   // 同名多隻→依 uid 錯開相位
            _act = 'idle'; _f = (Math.floor(now / (1000 / MOB_ANIM_FPS)) + _ofs) % a.idle.length;
        }
        if (_act !== null) {
            let _bseq = a[_act];
            if (_bseq && _bseq[_f] && img.src !== _bseq[_f].src) img.src = _bseq[_f].src;
            if (a.shadow) {   // 🌑 真實影子層：同動作同幀（缺該動作退 idle·幀數不足取模）→與本體像素級同步
                let _simg = c.querySelector('.mob-anim-shadow');
                if (_simg) { let _sseq = a.shadow[_act];   // 🌑 v2.7.41 該動作無影子→隱藏(不再退 idle)：不死鳥 death 無 death_s→死亡無影子(用戶要求·全 164 影子怪僅此一例不對稱)
                    if (_sseq && _sseq.length) { if (_simg.style.display === 'none') _simg.style.display = ''; if (_simg.style.visibility === 'hidden') _simg.style.visibility = ''; let _sf = _f < _sseq.length ? _f : (_f % _sseq.length); if (_simg.src !== _sseq[_sf].src) _simg.src = _sseq[_sf].src; }
                    else if (_simg.style.visibility !== 'hidden') _simg.style.visibility = 'hidden'; }
            }
            if (a.weapon) {   // ⚔️ 武器揮動特效層：v2.7.36 嚴格「直接對照本動作本幀」(_w 與本體動作 1:1 逐幀對照·不退 idle·不取模)；本動作或本幀無 _w→隱藏(不殘留上一動作的舊武器幀)
                let _wimg = c.querySelector('.mob-anim-weapon');
                if (_wimg) {
                    let _wseq = a.weapon[_act];
                    if (_wseq && _wseq[_f]) { if (_wimg.style.display === 'none') _wimg.style.display = ''; if (_wimg.style.visibility === 'hidden') _wimg.style.visibility = ''; if (_wimg.src !== _wseq[_f].src) _wimg.src = _wseq[_f].src; }
                    else if (_wimg.style.visibility !== 'hidden') _wimg.style.visibility = 'hidden';
                }
            }
            if (a.weapon2) {   // ⚔️ v2.7.40 第二武器層：同 _w 嚴格 1:1 逐幀對照
                let _w2img = c.querySelector('.mob-anim-weapon2');
                if (_w2img) {
                    let _w2seq = a.weapon2[_act];
                    if (_w2seq && _w2seq[_f]) { if (_w2img.style.display === 'none') _w2img.style.display = ''; if (_w2img.style.visibility === 'hidden') _w2img.style.visibility = ''; if (_w2img.src !== _w2seq[_f].src) _w2img.src = _w2seq[_f].src; }
                    else if (_w2img.style.visibility !== 'hidden') _w2img.style.visibility = 'hidden';
                }
            }
        }
    }
}
// ===== 🧝 v3.0.46 玩家戰鬥 sprite（變身 Phase 2＋🗡️ v3.0.67 職業動態 ARPG Tier1）=====
//   形態優先序：變身（assets/morphanim/<名>/）＞ 職業動態（assets/classanim/<avatar>/·依手上武器選變體）＞ 無（不顯示）。
//   顯示位置＝狩獵區(#battle-view.area-fit)最下方「中間偏左」。
//   動作：idle=停止攻擊循環／attack=攻擊觸發(js/04 playerAttack)／skill=施法觸發(castSkill/manualCast 包裝)／hurt=受擊觸發(HP-delta 偵測·免掛 50+ 傷害點)／death=死亡觸發·播畢凍結最後一幀直到復活(HP>0 自動解除)。
//   三層：<動作>_s(影子·multiply·墊底)＋本體＋<動作>_w(武器特效·screen·最上)——與本體 --multi 共畫布→同 rect 疊放即像素級對齊·嚴格逐幀(_w 本幀無→隱藏·比照 v2.7.36)。
//   ⚠️容器不用 transform 置中（transform 會建立隔離群組使 _w 的 mix-blend:screen 失效＝火系黑邊病根·v3.0.19）→ 改 left:calc(44% - 寬/2)。
const MORPH_BATTLE_ANIM = new Set(['克特', '卡司特王', '思克巴女皇', '死亡騎士', '炎魔', '白金法師', '白金騎士', '艾莉絲', '銀光法師', '銀光騎士', '騎士范德', '黃金法師', '黃金騎士', '黑暗法師', '黑暗騎士',
    '亞力安', '人形殭屍', '侏儒', '哥布林', '地靈', '多羅', '妖魔', '妖魔弓箭手', '小惡魔', '巴列斯', '巴風特', '思克巴', '惡魔', '歐吉', '死亡', '狼人', '萊肯', '食人妖精王', '食屍鬼', '骷髏弓箭手', '骷髏斧手', '骷髏槍兵', '黑暗妖精刺客',   // 🧝 v3.0.50 +23 變身（惡魔＝象牙塔惡魔套裝 SET_POLY_FORMS.demon 直接同名命中）
    '反王肯恩', '吸血鬼', '巨人', '白金巡守', '賽尼斯', '銀光巡守', '阿魯巴', '黃金巡守', '黑暗巡守', '黑暗精靈',   // 🧝 v3.0.52 +10 變身（黑暗精靈＝黑暗妖精套裝 高等黑暗精靈 經別名映射）
    '卡士柏', '史巴托', '妖魔巡守', '妖魔鬥士', '巨大牛人', '巴土瑟', '暴走兔', '果凍怪', '格利芬', '歐姆民兵', '獨眼巨人', '甘地妖魔', '石頭高崙', '紙人', '羅孚妖魔', '西瑪', '那魯加妖魔', '都達瑪拉妖魔', '重裝歐姆', '長老', '阿吐巴妖魔', '雪怪', '食人妖精', '馬庫爾', '骷髏', '黑暗妖精運送員', '黑長者', '黑騎士',   // 🧝 v3.0.57 +28 變身（合計 76＝POLY_TIERS 全形態·變身動畫全數到位）
    '真死亡騎士 冥皇丹特斯', '烈焰的死亡騎士', '莉絲安']);   // 🌑 v3.4.67 冥皇執行劍變身＋烈焰死騎（scroll/裝備變身·assets/morphanim 同名資料夾）；🏹 v3.5.7 莉絲安（Lv80 遠距離變身·2層body+shadow無特效層）
const MORPH_BATTLE_ALIAS = { '真‧死亡騎士': '死亡騎士', '真‧克特': '克特', '高等黑暗精靈': '黑暗精靈' };   // 套裝變身→同源動畫（v3.0.52 黑暗妖精套裝→黑暗精靈·與 js/19 立繪別名一致）
// 🧭 v3.5.10 三方向變身（比照職業動態 CLASS_ANIM_3DIR）：依攻擊目標選 右前=<名>(dir2 NE)／前方=<名>F(dir1 N)／左前=<名>2(dir0 NW)。
//   ⚠️ 名單內變身的三個資料夾必須共畫布（deploy_morph_all_3dir.js 依 morph_recover.json 逐形態一次 convert 三方向）→ 換向只換幀不重建 DOM。
//   🧭 v3.5.11 全變身三方向大批次（64 形態＝原 3 ＋ 61 舊批次自動回復動作區塊 exact-match 部署）。v3.5.12 +骷髏·史巴托(影子源＝gfx112·用戶指認·body 於本體 gfx 動作索引取用)。v3.5.13 +5 妖魔變體(死亡動作借用甘地妖魔·body784/sh785 A3·用戶指定)＝71 形態。
//   ⚠️ 未納入(維持單方向·源資料不足)：亞力安(源 spr 損毀)／妖魔弓箭手(回復索引不符)／狼人·巨大牛人·重裝歐姆·食人妖精王·黑暗妖精刺客·黑暗妖精運送員(源資料夾無對應 body)。
const MORPH_ANIM_3DIR = new Set(['烈焰的死亡騎士', '真死亡騎士 冥皇丹特斯', '莉絲安',
    '人形殭屍', '侏儒', '克特', '卡司特王', '卡士柏', '反王肯恩', '吸血鬼', '哥布林', '地靈', '多羅', '妖魔', '妖魔鬥士', '小惡魔', '巨人', '巴列斯', '巴土瑟', '巴風特', '思克巴', '思克巴女皇', '惡魔', '暴走兔', '果凍怪', '格利芬', '歐吉', '歐姆民兵', '死亡', '死亡騎士', '炎魔', '獨眼巨人', '甘地妖魔', '白金巡守', '白金法師', '白金騎士', '石頭高崙', '紙人', '艾莉絲', '萊肯', '西瑪', '賽尼斯', '銀光巡守', '銀光法師', '銀光騎士', '長老', '阿魯巴', '雪怪', '食人妖精', '食屍鬼', '馬庫爾', '騎士范德', '骷髏弓箭手', '骷髏斧手', '骷髏槍兵', '黃金巡守', '黃金法師', '黃金騎士', '黑暗巡守', '黑暗法師', '黑暗精靈', '黑暗騎士', '黑長者', '黑騎士',
    '骷髏', '史巴托',   // 🦴 v3.5.12 影子＝gfx112.spr（用戶指認）
    '妖魔巡守', '羅孚妖魔', '那魯加妖魔', '都達瑪拉妖魔', '阿吐巴妖魔',   // 👹 v3.5.13 死亡動作借用甘地妖魔（用戶指定）
    '狼人', '巨大牛人', '重裝歐姆', '食人妖精王', '黑暗妖精刺客', '黑暗妖精運送員',   // 🐺 v3.5.14 新式完整八方向資料夾替換（用戶提供更新動畫·deploy_new6 專屬部署）
    '妖魔弓箭手',   // 🏹 v3.5.15 新式資料夾替換（單 gfx57 無影子層·用戶指定直接套用）
    '亞力安']);   // 🦎 v3.5.17 移除損毀的 1052-9.spr 後重生（idle N 方向缺→退 NE·其餘全轉·79/79 全變身三方向完成）
// ===== 🗡️ v3.0.67 職業戰鬥動態（ARPG Tier1·用戶確認：未變身＝職業 sprite 常駐場上·有變身＝變身形態取代）=====
//   assets/classanim/<avatar>/：檔名＝<武器key>_<idle|attack|hurt>_N.png（+_s 影子）＋全武器共用 skill_N/death_N（+_s）·無 _w 層。
//   武器 key 由 atkSpdFamily(手上武器) 映射；清單外武器一律 sword1（用戶 CSV 規則「裝備列表沒有的武器就用單手劍顯示」）·空手/箭矢=unarmed。
//   ⚠️新職業：部署 assets/classanim/<avatar>/（46 spr 一次 --multi 共畫布·管線見記憶 class-battle-anim-project）後把 avatar 名加進 Set（一行）。
const CLASS_BATTLE_ANIM = new Set(['男騎士', '女騎士', '男妖精', '女妖精', '王子', '公主', '男法師', '女法師', '男黑暗妖精', '女黑暗妖精', '男龍騎士', '女龍騎士', '男幻術士', '女幻術士', '男戰士', '女戰士']);   // 🗡️ v3.0.70 全 16 avatar（職業動態 CSV 全部轉檔完成）
const CLASS_ANIM_WPN_KEY = { '匕首': 'dagger', '單手劍': 'sword1', '雙手劍': 'sword2', '單手鈍器': 'blunt', '雙手鈍器': 'blunt', '弓': 'bow', '十字弓': 'bow', '單手矛': 'spear', '雙手矛': 'spear', '魔杖': 'wand', '雙刀': 'dual', '鋼爪': 'claw', '鎖鏈劍': 'chainsword', '奇古獸': 'qigu' };   // 🏹 v3.0.89 十字弓沿用弓動畫（有弓動畫的職業裝十字弓即播弓·龍騎士/戰士無弓動畫仍走各自 fallback）
// 🗡️ v3.0.70 per-avatar 可用武器變體＋fallback（CSV 規則：裝備列表沒有的武器→各職 fallback 顯示·法師/幻術士=魔杖·黑暗妖精=匕首·戰士=雙手劍·其餘=單手劍）
const CLASS_ANIM_SETS = {
    '男騎士':     { w: ['unarmed','sword2','dagger','sword1','blunt','bow','spear'], fb: 'sword1' },
    '女騎士':     { w: ['unarmed','sword2','dagger','sword1','blunt','bow','spear'], fb: 'sword1' },
    '男妖精':     { w: ['unarmed','bow','dagger','sword1','blunt','spear'], fb: 'sword1' },
    '女妖精':     { w: ['unarmed','bow','dagger','sword1','blunt','spear'], fb: 'sword1' },
    '王子':       { w: ['unarmed','sword1','dagger','spear','bow','blunt','sword2'], fb: 'sword1' },
    '公主':       { w: ['unarmed','sword1','blunt','dagger','spear','sword2','bow'], fb: 'sword1' },
    '男法師':     { w: ['unarmed','dagger','sword1','wand','bow','spear','blunt'], fb: 'wand' },
    '女法師':     { w: ['unarmed','wand','dagger','sword1','spear','bow','blunt'], fb: 'wand' },
    '男黑暗妖精': { w: ['unarmed','dagger','sword1','bow','dual','claw','gauntlet'], fb: 'dagger' },
    '女黑暗妖精': { w: ['unarmed','dagger','sword1','bow','dual','claw','gauntlet'], fb: 'dagger' },
    '男龍騎士':   { w: ['unarmed','sword1','sword2','blunt','chainsword','gauntlet'], fb: 'sword1' },
    '女龍騎士':   { w: ['unarmed','sword2','sword1','blunt','chainsword','gauntlet'], fb: 'sword1' },
    '男幻術士':   { w: ['unarmed','blunt','wand','bow','qigu'], fb: 'wand' },
    '女幻術士':   { w: ['unarmed','blunt','wand','bow','qigu'], fb: 'wand' },
    '男戰士':     { w: ['unarmed','dblunt','blunt','spear','sword2'], fb: 'sword2' },
    '女戰士':     { w: ['unarmed','blunt','dblunt','spear','sword2'], fb: 'sword2' }
};
// 🧝 v3.5.21 真夏納（Lv85 變形控制戒指·js/02 classMorph）：職業式變身——資料夾 assets/classanim/真夏納<avatar>{,F,2}，
//   檔名/武器變體規則與職業動態完全相同（<wpn>_idle|attack|hurt_＋共用 skill/death·三方向共畫布·雙特效層已烙入 body 故無 _w）。
//   變體集依來源 spr 實際動作（戰士無雙手劍動作→退斧；龍騎士有矛動作；黑暗妖精弓=十字弓動作）。部署器＝scratchpad/deploy_true_shanna.js。
const TRUE_SHANNA_ANIM_SETS = {
    '王子':       { w: ['unarmed','sword1','dagger','spear','bow','blunt','sword2'], fb: 'sword1' },
    '公主':       { w: ['unarmed','sword1','dagger','spear','bow','blunt','sword2'], fb: 'sword1' },
    '男騎士':     { w: ['unarmed','sword1','dagger','spear','bow','blunt','sword2'], fb: 'sword1' },
    '女騎士':     { w: ['unarmed','sword1','dagger','spear','bow','blunt','sword2'], fb: 'sword1' },
    '男妖精':     { w: ['unarmed','bow','dagger','sword1','blunt','spear'], fb: 'sword1' },
    '女妖精':     { w: ['unarmed','bow','dagger','sword1','blunt','spear'], fb: 'sword1' },
    '男法師':     { w: ['unarmed','dagger','sword1','wand','bow','spear','blunt'], fb: 'wand' },
    '女法師':     { w: ['unarmed','dagger','sword1','wand','bow','spear','blunt'], fb: 'wand' },
    '男黑暗妖精': { w: ['unarmed','dagger','sword1','bow','dual','claw','blunt'], fb: 'dagger' },
    '女黑暗妖精': { w: ['unarmed','dagger','sword1','bow','dual','claw','blunt'], fb: 'dagger' },
    '男龍騎士':   { w: ['unarmed','sword1','sword2','blunt','chainsword','spear'], fb: 'sword1' },
    '女龍騎士':   { w: ['unarmed','sword1','sword2','blunt','chainsword','spear'], fb: 'sword1' },
    '男幻術士':   { w: ['unarmed','blunt','wand','bow','qigu'], fb: 'wand' },
    '女幻術士':   { w: ['unarmed','blunt','wand','bow','qigu'], fb: 'wand' },
    '男戰士':     { w: ['unarmed','blunt','spear','dblunt'], fb: 'blunt' },
    '女戰士':     { w: ['unarmed','blunt','spear','dblunt'], fb: 'blunt' }
};
// 🧭 v3.7.65 職業動畫「八方向」（用戶：人物沒有八方向與行走動態·取代 v3.2.12 的三方向 L/F/R）
//   資料夾後綴 ANIM_DIR_SFX8＝dir 0..7 →（NW 順時針·與怪物/寵物同羅盤 _vec2dir）：
//     0 NW='<av>2'  1 N='<av>F'  2 NE='<av>'(基準夾)  3 E='<av>d3'  4 SE='d4'  5 S='d5'  6 SW='d6'  7 W='d7'
//   ⚠️ 八個資料夾必須共畫布（scratchpad/deploy_class8.js：先 measure 全八方向聯集 box，再逐方向以同 box emit）→ 換向只換幀不重建 DOM、尺寸/left 不跳。
//   ⚠️ 變身（morphanim）目前仍是三方向資產 → ANIM_DIR_SFX3 把八方向折回 NW/N/NE 三夾（右半球→NE·左半球→NW）。
const CLASS_ANIM_8DIR = new Set(['男騎士', '女騎士', '男妖精', '女妖精', '王子', '公主', '男法師', '女法師', '男黑暗妖精', '女黑暗妖精', '男龍騎士', '女龍騎士', '男幻術士', '女幻術士', '男戰士', '女戰士']);   // 🏹 v3.7.65 全 16 職業（八方向共畫布部署完成·含 <武器>_walk 行走幀）
const ANIM_DIR_SFX8 = ['2', 'F', '', 'd3', 'd4', 'd5', 'd6', 'd7'];
const ANIM_DIR_SFX3 = ['2', 'F', '', '', '', '', '2', '2'];
function _animDirSfx(dir, eight) { let t = eight ? ANIM_DIR_SFX8 : ANIM_DIR_SFX3; let d = t[((dir | 0) % 8 + 8) % 8]; return d == null ? '' : d; }
// 依 who 目前攻擊目標 UID（who._faceTgtUid·js/04/js/06 寫入）相對於 who sprite el 的螢幕向量，回傳 dir 0-7（寫入 who._faceD）。
//   無目標／目標已離場→維持上次朝向（移動中的朝向改由 _playerMoveStep 依移動向量寫入）。
function _classFacing8(who, el) {
    let cur = (who && who._faceD != null) ? who._faceD : 2;
    try {
        let tgtUid = who && who._faceTgtUid;
        if (tgtUid == null) return cur;
        let tr = (typeof _vfxSlotRect === 'function') ? _vfxSlotRect(tgtUid) : null;   // 目標怪格 rect（怪已死/離場→null）
        if (!tr || !tr.width) return cur;
        let er = (el && el.getBoundingClientRect) ? el.getBoundingClientRect() : null;
        if (!er || !er.width) return cur;
        let dx = (tr.left + tr.width / 2) - (er.left + er.width / 2);
        let dy = (tr.top + tr.height / 2) - (er.top + er.height / 2);
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return cur;
        let d = _vec2dir(dx, dy);
        who._faceD = d; return d;
    } catch (e) { return cur; }
}
function _classAnimWpnKey(p, set) {   // p=玩家或傭兵（讀 p.eq.wpn/offwpn）
    let w = p && p.eq && p.eq.wpn;
    if (!w || !w.id) return 'unarmed';
    if (p.cls === 'warrior' && p.eq.offwpn && set.w.indexOf('dblunt') >= 0) return 'dblunt';   // ⚔️ 戰士雙持（副手武器欄有東西）→ 雙持鈍器動作
    let _di = (typeof DB !== 'undefined' && DB.items) ? DB.items[w.id] : null;
    if (_di && _di.animFam && set.w.indexOf(_di.animFam) >= 0) return _di.animFam;   // 🥊 動畫專屬武器種類（鐵手甲＝atkSpdFamily 歸弓·但動畫另有一套 gauntlet_*）
    let fam = (typeof atkSpdFamily === 'function') ? atkSpdFamily(w.id) : null;
    if (!fam) return 'unarmed';   // 箭矢等非揮擊武器
    let k = CLASS_ANIM_WPN_KEY[fam] || null;
    return (k && set.w.indexOf(k) >= 0) ? k : set.fb;   // 該職無此變體（含十字弓等未列武器）→ fallback
}
function _classForm(p, allyGrp, morphPfx) {   // 職業形態解析：p=玩家或傭兵·allyGrp=true→隊員2/3 用 <avatar>2 資料夾（另一組朝向）·morphPfx=真夏納職業式變身（資料夾 <morphPfx><avatar>·變體集 TRUE_SHANNA_ANIM_SETS）
    let av = p ? p.avatar : null;
    if (!av || (!morphPfx && !CLASS_BATTLE_ANIM.has(av))) return null;
    let set = morphPfx ? TRUE_SHANNA_ANIM_SETS[av] : CLASS_ANIM_SETS[av]; if (!set) return null;
    let wk = _classAnimWpnKey(p, set);
    let fname = (morphPfx || '') + av;
    // 🧭 v3.7.65 八方向 avatar：資料夾依 p._faceD（0..7·ANIM_DIR_SFX8）·domKey 不含朝向→換向不重建 DOM（八方向共畫布·只換幀）
    //    職業動畫與真夏納（morphPfx）皆已八方向部署（含 <武器>_walk 行走幀）。
    if (morphPfx || CLASS_ANIM_8DIR.has(av)) {
        let folder = fname + _animDirSfx((p && p._faceD != null) ? p._faceD : 2, true);
        return { key: 'class:' + folder + ':' + wk, domKey: 'class:' + fname + ':' + wk, base: 'assets/classanim/' + encodeURIComponent(folder) + '/', wpn: wk };
    }
    let folder = allyGrp ? fname + '2' : fname;
    return { key: 'class:' + folder + ':' + wk, domKey: 'class:' + folder + ':' + wk, base: 'assets/classanim/' + encodeURIComponent(folder) + '/', wpn: wk };
}
function _actorBattleForm(actor, allyGrp) {   // 玩家／傭兵戰場形態：變身優先 → 職業動態 → null
    // 🧝 v3.5.21 真夏納（classMorph）：職業式變身→走 _classForm 管線但用專屬資料夾 <形態名><avatar>（速度資料仍由 js/02 套用）
    let _pf = actor && (actor._setPoly || ((actor.buffs && actor.buffs.poly > 0 && actor.poly) ? actor.poly : null));
    if (_pf && _pf.classMorph && actor.avatar && TRUE_SHANNA_ANIM_SETS[actor.avatar]) {
        let cf = _classForm(actor, !!allyGrp, _pf.n);
        if (cf) return cf;
    }
    let m = _actorMorphName(actor);
    if (m) {
        if (MORPH_ANIM_3DIR.has(m)) {   // 🧭 v3.5.10 三方向變身：key 含朝向資料夾·domKey 不含 → 換向只換幀（同 _classForm 機制）·v3.7.65 八方向朝向折回三夾
            let folder = m + _animDirSfx((actor && actor._faceD != null) ? actor._faceD : 2, false);
            return { key: 'morph:' + folder, domKey: 'morph:' + m, base: 'assets/morphanim/' + encodeURIComponent(folder) + '/', wpn: null };
        }
        return { key: 'morph:' + m, domKey: 'morph:' + m, base: 'assets/morphanim/' + encodeURIComponent(m) + '/', wpn: null };
    }
    return _classForm(actor, !!allyGrp);
}
function _playerBattleForm() {
    return _actorBattleForm((typeof player !== 'undefined') ? player : null, false);
}
let _morphBattleCache = {};   // 形態 key（morph:<名>｜class:<avatar>:<武器key>）→ { idle/attack/skill/hurt/death:[Image]|null, shadow:{...}, weapon:{...} } | 'probing'
function _battleSpriteProbe(form) {
    _morphBattleCache[form.key] = 'probing';
    let out = { shadow: {}, weapon: {} };
    let pending = form.wpn ? 20 : 18;   // 🗡️ v3.0.70 職業形態多探 2 項：武器專屬 skill（<wpn>_skill_·黑暗妖精雙刀/鋼爪·龍騎士雙手劍/鎖鏈劍·戰士各武器）；🚶 v3.7.65 動作多一組 walk（body/shadow/weapon 共 3）
    let finish = () => { if (--pending <= 0) {
        // 🏹 弓/十字弓無專屬技能動畫(bow_skill_)：施放技能(如妖精三重矢)時原退回「通用 skill_」空手施法姿勢→改借用弓攻擊(bow_attack)姿勢，持弓者施放技能不再變空手（玩家＋傭兵共用此快取·同套用影子層）
        if (form.wpn === 'bow' && !out.wskill && out.attack) { out.wskill = out.attack; if (out.shadow && !out.shadow.wskill && out.shadow.attack) out.shadow.wskill = out.shadow.attack; }
        _morphBattleCache[form.key] = out;
    } };
    let probeSeq = (target, key, pfx, minF) => {   // 🚀 平行探測（滑動窗口·見 _probeFramesWin）
        _probeFramesWin(i => form.base + pfx + i + '.png', MOB_ANIM_MAX_FRAMES, minF || 2, frames => { target[key] = frames; finish(); });
    };
    let pfxOf = (a) => (form.wpn && a !== 'skill' && a !== 'death') ? form.wpn + '_' + a + '_' : a + '_';   // 職業形態：idle/attack/hurt 帶武器前綴·skill/death 共用
    ['idle', 'walk', 'attack', 'skill', 'hurt', 'death'].forEach(a => {   // 🚶 v3.7.65 walk＝行走幀（移動中播放·無此檔→null→退 idle）
        let p = pfxOf(a);
        probeSeq(out, a, p, a === 'hurt' ? 1 : 2);
        probeSeq(out.shadow, a, p.slice(0, -1) + '_s_', 1);
        if (form.wpn) { out.weapon[a] = null; finish(); }   // 職業動態無 _w 層→免探測（省 404）
        else probeSeq(out.weapon, a, p.slice(0, -1) + '_w_', 1);
    });
    if (form.wpn) {   // 🗡️ 武器專屬 skill（無此檔＝null→播放層退通用 skill）
        probeSeq(out, 'wskill', form.wpn + '_skill_', 2);
        probeSeq(out.shadow, 'wskill', form.wpn + '_skill_s_', 1);
    }
}
function _actorMorphName(actor) {   // 玩家／傭兵目前變身名（含套裝別名映射）·沒有動畫資源則退回職業外觀
    if (!actor) return null;
    let f = actor._setPoly || ((actor.buffs && actor.buffs.poly > 0 && actor.poly) ? actor.poly : null);
    if (!f || !f.n) return null;
    if (f.keepClassAppearance) return null;   // 夏納：維持原職業戰鬥動態，只套用速度資料。
    let n = MORPH_BATTLE_ALIAS[f.n] || f.n;
    return MORPH_BATTLE_ANIM.has(n) ? n : null;
}
function _playerMorphName() {
    return _actorMorphName((typeof player !== 'undefined') ? player : null);
}
let _pmState = { act: null, t: 0, prevHp: null, name: null, el: null, imgs: null };
// 🧝 v3.0.49 施法者錨點：玩家變身戰鬥 sprite 顯示中→回傳本體圖的螢幕矩形（投射法術發射點/自我特效錨點共用）·未變身/未顯示→null（呼叫端退回原「戰鬥區底部中央」）
function _pmCasterRect() {
    try {
        let I = _pmState && _pmState.imgs;
        if (!I || !I.bd || !_pmState.el || !_pmState.el.isConnected) return null;
        let r = I.bd.getBoundingClientRect();
        return (r.width > 0 && r.height > 0) ? r : null;
    } catch (e) { return null; }
}
// 🎬 v3.0.106 動作播放權重（用戶指定）：death > hurt > skill > attack > idle。高權重可打斷低權重·低權重不打斷高權重(attack 被蓋→排隊到當前播完再補)。
const _PM_PRIO = { death: 5, hurt: 4, skill: 3, attack: 2, idle: 1 };
function _pmCurActivePrio() {   // 目前「仍在播放中」動作的權重（已播完/待機→0）
    let st = _pmState;
    if (!st.act || st.act === 'idle') return 0;
    if (st.act === 'death') return _PM_PRIO.death;   // 死亡鎖定
    let form = _playerBattleForm(); let a = form && _morphBattleCache[form.key];
    if (!a || a === 'probing') return 0;
    let seq = (st.act === 'skill' && !st.skGen && a.wskill) ? a.wskill : a[st.act];
    if (!seq || !seq.length) return 0;
    let fms = (st.act === 'attack') ? _atkFrameMs((player.d && player.d.aspd) || 0, seq.length)
        : (st.act === 'skill') ? _skillFrameMs(seq.length) : (1000 / MOB_ANIM_FPS);
    return ((Date.now() - st.t) < seq.length * fms) ? (_PM_PRIO[st.act] || 0) : 0;   // 仍在播→其權重·已播完→0(idle)
}
function _playerMorphTrigger(k, skId) {   // js/04 attack／castSkill·manualCast 包裝 skill／HP-delta hurt 呼叫（🗡️ v3.0.67 職業形態亦適用·呼叫端零改動）
    let form = _playerBattleForm(); if (!form) return;
    let st = _pmState;
    if (st.act === 'death') return;   // 死亡鎖定：復活前不接受任何動作（最高權重）
    let newP = _PM_PRIO[k] || 0, curP = _pmCurActivePrio();   // 🎬 v3.0.106 依權重決定是否打斷（hurt>skill>attack）
    if (newP < curP) { if (k === 'attack') st.pendAtk = true; return; }   // 權重較低→不打斷（attack 排隊·hurt/skill 直接略過）
    if (k === 'skill') st.skGen = (skId === 'sk_warrior_roar');   // 🗡️ v3.0.70 戰士咆哮用「通用」skill 動作（CSV 規則）·其餘技能優先武器專屬 wskill
    st.act = k; st.t = Date.now(); st.pendAtk = false;   // 🔮 新動作生效→清掉排隊中的攻擊（已被取代）
}
function _playerMorphRemove() {
    if (_pmState.el) { try { _pmState.el.remove(); } catch (e) {} }
    _pmState.el = null; _pmState.imgs = null; _pmState.act = null; _pmState.name = null; _pmState.prevHp = null; _pmState.pendAtk = false;
}
function _playerCastleCrownOn() {
    try {
        if (typeof siegeVictoryActive !== 'function' || !siegeVictoryActive()) return false;
        return !!(player && (player.cls === 'royal' || player.avatar === '王子' || player.avatar === '公主'));
    } catch (e) { return false; }
}
// 👑 v3.6.33 城主王冠錨點表（tools/crown-anchor-gen.js 離線掃 idle 幀產出·勿手改）。
//    file:// 下本地圖污染 canvas → 執行期 getImageData 必失敗，只能離線預算。
//    key＝職業式 <朝向資料夾>:<武器鍵>｜變身 <morphanim資料夾>·值=[頭頂質心x, 畫布底至頭頂px+2]。
//    v3.6.34 擴到全部 237 個變身資料夾（用戶拍板：所有變身王冠都壓正頭頂）；重部署動畫後重跑產生器。
const PM_CROWN_ANCHOR = {
    '王子2:blunt':[92,92],'王子2:bow':[90,92],'王子2:dagger':[90,92],'王子2:spear':[89,91],'王子2:sword1':[92,92],'王子2:sword2':[94,94],'王子2:unarmed':[91,95],
    '王子F:blunt':[88,92],'王子F:bow':[85,93],'王子F:dagger':[84,93],'王子F:spear':[85,93],'王子F:sword1':[89,93],'王子F:sword2':[93,92],'王子F:unarmed':[89,95],
    '王子:blunt':[85,94],'王子:bow':[84,95],'王子:dagger':[83,95],'王子:spear':[86,95],'王子:sword1':[86,94],'王子:sword2':[82,94],'王子:unarmed':[90,95],
    '王子d3:blunt':[88,95],'王子d3:bow':[87,97],'王子d3:dagger':[87,97],'王子d3:spear':[87,97],'王子d3:sword1':[88,95],'王子d3:sword2':[81,101],'王子d3:unarmed':[90,96],
    '王子d4:blunt':[91,96],'王子d4:bow':[92,98],'王子d4:dagger':[93,98],'王子d4:spear':[91,98],'王子d4:sword1':[91,96],'王子d4:sword2':[90,97],'王子d4:unarmed':[91,95],
    '王子d5:blunt':[93,96],'王子d5:bow':[95,96],'王子d5:dagger':[96,96],'王子d5:spear':[95,96],'王子d5:sword1':[92,95],'王子d5:sword2':[96,100],'王子d5:unarmed':[91,95],
    '王子d6:blunt':[94,95],'王子d6:bow':[97,94],'王子d6:dagger':[97,94],'王子d6:spear':[98,94],'王子d6:sword1':[94,94],'王子d6:sword2':[94,95],'王子d6:unarmed':[90,96],
    '王子d7:blunt':[94,94],'王子d7:bow':[96,92],'王子d7:dagger':[96,92],'王子d7:spear':[96,92],'王子d7:sword1':[94,93],'王子d7:sword2':[94,95],'王子d7:unarmed':[90,95],
    '公主2:blunt':[80,94],'公主2:bow':[80,94],'公主2:dagger':[80,94],'公主2:spear':[80,94],'公主2:sword1':[80,94],'公主2:sword2':[80,94],'公主2:unarmed':[79,94],
    '公主F:blunt':[80,90],'公主F:bow':[81,91],'公主F:dagger':[80,90],'公主F:spear':[80,90],'公主F:sword1':[80,90],'公主F:sword2':[80,90],'公主F:unarmed':[79,92],
    '公主:blunt':[79,92],'公主:bow':[80,92],'公主:dagger':[79,92],'公主:spear':[76,92],'公主:sword1':[79,92],'公主:sword2':[79,92],'公主:unarmed':[78,93],
    '公主d3:blunt':[77,91],'公主d3:bow':[77,91],'公主d3:dagger':[77,91],'公主d3:spear':[74,91],'公主d3:sword1':[77,91],'公主d3:sword2':[78,91],'公主d3:unarmed':[78,92],
    '公主d4:blunt':[75,91],'公主d4:bow':[74,91],'公主d4:dagger':[75,91],'公主d4:spear':[75,91],'公主d4:sword1':[75,91],'公主d4:sword2':[75,91],'公主d4:unarmed':[76,92],
    '公主d5:blunt':[75,90],'公主d5:bow':[73,90],'公主d5:dagger':[75,90],'公主d5:spear':[78,92],'公主d5:sword1':[75,90],'公主d5:sword2':[75,90],'公主d5:unarmed':[76,91],
    '公主d6:blunt':[75,93],'公主d6:bow':[76,93],'公主d6:dagger':[75,93],'公主d6:spear':[76,93],'公主d6:sword1':[75,93],'公主d6:sword2':[75,93],'公主d6:unarmed':[76,93],
    '公主d7:blunt':[77,94],'公主d7:bow':[78,94],'公主d7:dagger':[77,94],'公主d7:spear':[77,94],'公主d7:sword1':[77,94],'公主d7:sword2':[77,94],'公主d7:unarmed':[77,94],
    '真夏納王子2:blunt':[122,118],'真夏納王子2:bow':[121,117],'真夏納王子2:dagger':[121,117],'真夏納王子2:spear':[120,116],'真夏納王子2:sword1':[122,118],'真夏納王子2:sword2':[124,121],'真夏納王子2:unarmed':[122,118],
    '真夏納王子F:blunt':[123,118],'真夏納王子F:bow':[119,118],'真夏納王子F:dagger':[119,119],'真夏納王子F:spear':[119,117],'真夏納王子F:sword1':[123,118],'真夏納王子F:sword2':[123,119],'真夏納王子F:unarmed':[123,118],
    '真夏納王子:blunt':[121,119],'真夏納王子:bow':[119,120],'真夏納王子:dagger':[118,120],'真夏納王子:spear':[120,119],'真夏納王子:sword1':[122,119],'真夏納王子:sword2':[111,121],'真夏納王子:unarmed':[122,119],
    '真夏納王子d3:blunt':[123,118],'真夏納王子d3:bow':[124,120],'真夏納王子d3:dagger':[123,120],'真夏納王子d3:spear':[122,121],'真夏納王子d3:sword1':[123,118],'真夏納王子d3:sword2':[107,131],'真夏納王子d3:unarmed':[123,118],
    '真夏納王子d4:blunt':[125,117],'真夏納王子d4:bow':[127,119],'真夏納王子d4:dagger':[128,119],'真夏納王子d4:spear':[127,120],'真夏納王子d4:sword1':[124,117],'真夏納王子d4:sword2':[123,134],'真夏納王子d4:unarmed':[124,117],
    '真夏納王子d5:blunt':[126,116],'真夏納王子d5:bow':[129,117],'真夏納王子d5:dagger':[130,117],'真夏納王子d5:spear':[130,117],'真夏納王子d5:sword1':[126,116],'真夏納王子d5:sword2':[135,128],'真夏納王子d5:unarmed':[126,116],
    '真夏納王子d6:blunt':[125,116],'真夏納王子d6:bow':[126,116],'真夏納王子d6:dagger':[127,116],'真夏納王子d6:spear':[128,116],'真夏納王子d6:sword1':[125,116],'真夏納王子d6:sword2':[126,119],'真夏納王子d6:unarmed':[125,116],
    '真夏納王子d7:blunt':[123,118],'真夏納王子d7:bow':[123,116],'真夏納王子d7:dagger':[122,116],'真夏納王子d7:spear':[125,115],'真夏納王子d7:sword1':[122,117],'真夏納王子d7:sword2':[123,122],'真夏納王子d7:unarmed':[122,117],
    '真夏納公主2:blunt':[88,92],'真夏納公主2:bow':[88,92],'真夏納公主2:dagger':[88,92],'真夏納公主2:spear':[83,92],'真夏納公主2:sword1':[88,92],'真夏納公主2:sword2':[87,92],'真夏納公主2:unarmed':[88,92],
    '真夏納公主F:blunt':[85,91],'真夏納公主F:bow':[84,90],'真夏納公主F:dagger':[85,91],'真夏納公主F:spear':[86,91],'真夏納公主F:sword1':[85,91],'真夏納公主F:sword2':[86,91],'真夏納公主F:unarmed':[85,91],
    '真夏納公主:blunt':[83,92],'真夏納公主:bow':[82,91],'真夏納公主:dagger':[83,92],'真夏納公主:spear':[88,92],'真夏納公主:sword1':[83,92],'真夏納公主:sword2':[84,92],'真夏納公主:unarmed':[83,92],
    '真夏納公主d3:blunt':[84,93],'真夏納公主d3:bow':[83,93],'真夏納公主d3:dagger':[84,93],'真夏納公主d3:spear':[83,93],'真夏納公主d3:sword1':[84,93],'真夏納公主d3:sword2':[83,93],'真夏納公主d3:unarmed':[84,93],
    '真夏納公主d4:blunt':[84,93],'真夏納公主d4:bow':[84,93],'真夏納公主d4:dagger':[84,93],'真夏納公主d4:spear':[84,93],'真夏納公主d4:sword1':[84,93],'真夏納公主d4:sword2':[84,93],'真夏納公主d4:unarmed':[84,93],
    '真夏納公主d5:blunt':[85,93],'真夏納公主d5:bow':[85,93],'真夏納公主d5:dagger':[86,93],'真夏納公主d5:spear':[86,92],'真夏納公主d5:sword1':[85,93],'真夏納公主d5:sword2':[86,92],'真夏納公主d5:unarmed':[85,93],
    '真夏納公主d6:blunt':[87,92],'真夏納公主d6:bow':[89,93],'真夏納公主d6:dagger':[87,92],'真夏納公主d6:spear':[87,93],'真夏納公主d6:sword1':[87,92],'真夏納公主d6:sword2':[87,93],'真夏納公主d6:unarmed':[87,92],
    '真夏納公主d7:blunt':[87,93],'真夏納公主d7:bow':[88,93],'真夏納公主d7:dagger':[87,93],'真夏納公主d7:spear':[89,92],'真夏納公主d7:sword1':[87,93],'真夏納公主d7:sword2':[89,92],'真夏納公主d7:unarmed':[87,93],
    '亞力安':[94,94],'亞力安2':[45,96],'亞力安F':[94,94],'人形殭屍':[72,91],'人形殭屍2':[65,87],'人形殭屍F':[69,90],'侏儒':[57,73],'侏儒2':[52,76],
    '侏儒F':[55,73],'克特':[95,91],'克特2':[95,88],'克特F':[93,92],'卡司特王':[82,47],'卡司特王2':[69,46],'卡司特王F':[75,49],'卡士柏':[93,92],
    '卡士柏2':[55,97],'卡士柏F':[75,95],'反王肯恩':[68,84],'反王肯恩2':[72,84],'反王肯恩F':[68,83],'史巴托':[98,83],'史巴托2':[92,84],'史巴托F':[92,77],
    '吸血鬼':[40,76],'吸血鬼2':[43,76],'吸血鬼F':[43,76],'哥布林':[57,63],'哥布林2':[51,63],'哥布林F':[52,66],'地靈':[49,63],'地靈2':[44,63],
    '地靈F':[47,63],'多羅':[98,86],'多羅2':[95,88],'多羅F':[97,87],'妖魔':[63,80],'妖魔2':[56,82],'妖魔F':[58,82],'妖魔巡守':[62,98],
    '妖魔巡守2':[53,98],'妖魔巡守F':[56,99],'妖魔弓箭手':[69,82],'妖魔弓箭手2':[68,79],'妖魔弓箭手F':[67,80],'妖魔鬥士':[56,72],'妖魔鬥士2':[54,71],'妖魔鬥士F':[53,67],
    '小惡魔':[64,79],'小惡魔2':[79,80],'小惡魔F':[72,78],'巨人':[80,110],'巨人2':[88,110],'巨人F':[87,111],'巨大牛人':[100,147],'巨大牛人2':[104,156],
    '巨大牛人F':[113,153],'巴列斯':[79,121],'巴列斯2':[76,120],'巴列斯F':[79,119],'巴土瑟':[93,92],'巴土瑟2':[55,97],'巴土瑟F':[75,95],'巴風特':[107,141],
    '巴風特2':[105,141],'巴風特F':[106,139],'思克巴':[73,114],'思克巴2':[96,112],'思克巴F':[80,110],'思克巴女皇':[73,115],'思克巴女皇2':[96,113],'思克巴女皇F':[80,111],
    '惡魔':[78,109],'惡魔2':[109,108],'惡魔F':[94,104],'暴走兔':[41,29],'暴走兔2':[40,29],'暴走兔F':[41,29],'果凍怪':[67,80],'果凍怪2':[67,81],
    '果凍怪F':[67,78],'格利芬':[82,72],'格利芬2':[76,72],'格利芬F':[79,72],'歐吉':[94,140],'歐吉2':[99,140],'歐吉F':[96,141],'歐姆民兵':[70,53],
    '歐姆民兵2':[65,53],'歐姆民兵F':[67,54],'死亡':[80,133],'死亡2':[64,123],'死亡F':[77,129],'死亡騎士':[100,113],'死亡騎士2':[90,115],'死亡騎士F':[96,115],
    '炎魔':[102,138],'炎魔2':[156,139],'炎魔F':[129,136],'烈焰的死亡騎士':[101,112],'烈焰的死亡騎士2':[90,114],'烈焰的死亡騎士F':[95,115],'狼人':[95,112],'狼人2':[96,111],
    '狼人F':[96,112],'獨眼巨人':[101,109],'獨眼巨人2':[111,109],'獨眼巨人F':[107,108],'甘地妖魔':[59,98],'甘地妖魔2':[59,98],'甘地妖魔F':[59,98],'白金巡守':[65,109],
    '白金巡守2':[69,110],'白金巡守F':[66,110],'白金法師':[63,100],'白金法師2':[69,98],'白金法師F':[63,98],'白金騎士':[91,114],'白金騎士2':[85,113],'白金騎士F':[87,115],
    '真死亡騎士 冥皇丹特斯':[101,112],'真死亡騎士 冥皇丹特斯2':[90,114],'真死亡騎士 冥皇丹特斯F':[95,115],'石頭高崙':[77,93],'石頭高崙2':[74,93],'石頭高崙F':[76,89],'紙人':[58,72],'紙人2':[54,73],
    '紙人F':[56,77],'羅孚妖魔':[60,98],'羅孚妖魔2':[50,98],'羅孚妖魔F':[56,99],'艾莉絲':[92,114],'艾莉絲2':[92,115],'艾莉絲F':[92,114],'莉絲安':[97,108],
    '莉絲安2':[101,108],'莉絲安F':[98,106],'萊肯':[95,112],'萊肯2':[96,111],'萊肯F':[96,112],'西瑪':[93,92],'西瑪2':[55,97],'西瑪F':[75,95],
    '賽尼斯':[73,114],'賽尼斯2':[77,114],'賽尼斯F':[75,113],'那魯加妖魔':[94,105],'那魯加妖魔2':[78,118],'那魯加妖魔F':[96,114],'都達瑪拉妖魔':[94,105],'都達瑪拉妖魔2':[78,118],
    '都達瑪拉妖魔F':[96,114],'重裝歐姆':[117,122],'重裝歐姆2':[109,125],'重裝歐姆F':[114,125],'銀光巡守':[62,103],'銀光巡守2':[66,104],'銀光巡守F':[63,104],'銀光法師':[64,97],
    '銀光法師2':[69,95],'銀光法師F':[65,94],'銀光騎士':[68,96],'銀光騎士2':[66,96],'銀光騎士F':[67,95],'長老':[78,88],'長老2':[45,87],'長老F':[69,68],
    '阿吐巴妖魔':[60,98],'阿吐巴妖魔2':[50,98],'阿吐巴妖魔F':[56,99],'阿魯巴':[88,122],'阿魯巴2':[84,125],'阿魯巴F':[87,124],'雪怪':[67,81],'雪怪2':[67,81],
    '雪怪F':[67,82],'食人妖精':[93,118],'食人妖精2':[90,118],'食人妖精F':[92,119],'食人妖精王':[93,112],'食人妖精王2':[90,112],'食人妖精王F':[92,111],'食屍鬼':[72,91],
    '食屍鬼2':[65,87],'食屍鬼F':[69,90],'馬庫爾':[93,92],'馬庫爾2':[55,97],'馬庫爾F':[75,95],'騎士范德':[117,109],'騎士范德2':[114,111],'騎士范德F':[116,111],
    '骷髏':[98,83],'骷髏2':[92,84],'骷髏F':[92,77],'骷髏弓箭手':[57,76],'骷髏弓箭手2':[40,80],'骷髏弓箭手F':[50,79],'骷髏斧手':[54,76],'骷髏斧手2':[40,78],
    '骷髏斧手F':[48,77],'骷髏槍兵':[68,81],'骷髏槍兵2':[67,82],'骷髏槍兵F':[64,82],'黃金巡守':[66,104],'黃金巡守2':[70,105],'黃金巡守F':[67,105],'黃金法師':[64,97],
    '黃金法師2':[69,95],'黃金法師F':[65,94],'黃金騎士':[90,113],'黃金騎士2':[86,113],'黃金騎士F':[88,112],'黑暗妖精刺客':[64,103],'黑暗妖精刺客2':[66,103],'黑暗妖精刺客F':[65,101],
    '黑暗妖精運送員':[70,73],'黑暗妖精運送員2':[67,71],'黑暗妖精運送員F':[68,73],'黑暗巡守':[62,103],'黑暗巡守2':[66,104],'黑暗巡守F':[63,104],'黑暗法師':[59,97],'黑暗法師2':[65,95],
    '黑暗法師F':[61,94],'黑暗精靈':[94,115],'黑暗精靈2':[94,114],'黑暗精靈F':[93,115],'黑暗騎士':[62,93],'黑暗騎士2':[59,93],'黑暗騎士F':[61,92],'黑長者':[93,92],
    '黑長者2':[55,97],'黑長者F':[75,95],'黑騎士':[113,129],'黑騎士2':[104,127],'黑騎士F':[107,129],
};
function _playerBattleCrownApply(crown, form, act) {
    if (!crown) return;
    if (!_playerCastleCrownOn()) { crown.style.visibility = 'hidden'; return; }
    let k = (form && form.key) || '', mk = /^class:([^:]+):([^:]+)$/.exec(k), mm = mk ? null : /^morph:(.+)$/.exec(k);
    let a = mk ? PM_CROWN_ANCHOR[mk[1] + ':' + mk[2]] : (mm && PM_CROWN_ANCHOR[mm[1]]);
    if (!a || act === 'death') { crown.style.visibility = 'hidden'; return; }   // 表外形態隱藏（安全網）·倒地屍體上不懸浮王冠
    if (crown.style.visibility === 'hidden') crown.style.visibility = '';
    crown.style.left = a[0] + 'px';
    crown.style.bottom = a[1] + 'px';
}
function _playerMorphYOffset(form) {
    let k = (form && form.key) || '';
    return /^morph:萊肯(?:F|2)?$/.test(k) ? 18 : 0;
}
// ⚔️ v3.0.91 攻擊動畫播放速度隨攻速：攻擊動作每幀時長＝攻擊間隔(秒)÷幀數→整段動畫恰在一次攻擊間隔內播完（「播完對上攻速」）。
//   只加速不放慢：慢攻取 min(base,…)＝維持預設 8fps（早播完後待機·不拖成慢動作）；下限 45ms/幀(≈22fps)防過快閃爍。
//   intervalSec 來源＝各消費者實際攻擊排程用值：玩家＝player.d.aspd(js/03:290·已含加速/勇敢/精通/切割/變身所有倍率)、傭兵＝atkSpdBaseItv(ally)(js/06:1833)。僅套用於 attack 動作·idle/skill/hurt/death 維持 8fps。
function _atkFrameMs(intervalSec, seqLen) {
    let base = 1000 / MOB_ANIM_FPS;   // 預設 125ms/幀（8fps）
    if (!(intervalSec > 0) || !(seqLen > 0)) return base;
    return Math.max(45, Math.min(base, intervalSec * 1000 / seqLen));
}
// 🔮 v3.0.94 技能動畫播放速度隨施法速度：比照 _atkFrameMs·間隔＝castLock(tick·職業施法冷卻下限·js/07 施法鎖同源)÷10 秒·只加速不放慢（慢施法維持 8fps 早播完待機）
//    v3.0.96 第2參 lockTicks（選用）：傭兵傳自身 ally.d.castLock；未傳＝主玩家 player.d.castLock（fallback 12）
function _skillFrameMs(seqLen, lockTicks) { return _atkFrameMs((lockTicks != null ? lockTicks : ((player && player.d && player.d.castLock) || 12)) / 10, seqLen); }
// 🧍 v3.7.81 用戶指定改回原本的固定站位（不移動）＝回到 v3.6.89 行為：玩家恆站前排中央、朝向永遠對攻擊目標、待機幀不播行走。
//   走位實作（_playerMoveStep）原樣保留，只由此開關關閉；要改回走位把此值改 true 即可（行走幀仍照常預載）。
const PLAYER_BATTLE_WALK = false;
// 🚶 v3.7.64 主角戰鬥走位（用戶：仿寵物/召喚行動概念——有怪走向目標、保持距離攻擊，無怪隨機閒晃；純視覺，攻擊/命中排程完全不變）
//   步進比照 js/22 _petWanderStep（8fps）：x=正規化 0..1（battle-view 寬）·bottom=2~28px（隊伍層 zIndex=30-bottom 必須為正·後排帶≈26）。
//   目標＝player._faceTgtUid（js/04 攻擊時寫入）·無則取最早槽位存活者；停在目標約一格寬外（「不用真的碰到」）。
//   死亡由 act==='death' 凍結原地；傳送特效期間上游已 return 不會步進；決鬥/攻城目標同為 mob 槽照走。
function _playerMoveStep(bv) {
    let st = _pmState;
    if (st.mx == null) { let p0 = _partySpritePos().P; st.mx = parseFloat(p0.x) / 100; st.mb = p0.b; st.wx = null; st.wb = null; st.wt = 0; st.moving = false; }
    if (st.act === 'death') { st.moving = false; return; }
    let hr = bv.getBoundingClientRect(); if (!hr.width) return;
    let alive = (typeof mapState !== 'undefined' && mapState.mobs) ? mapState.mobs.filter(m => m && m.curHp > 0 && !m._dead) : [];
    if (alive.length) {
        let tgt = alive.find(m => m.uid === player._faceTgtUid) || alive[0];
        let r = (typeof _vfxSlotRect === 'function') ? _vfxSlotRect(tgt.uid) : null;
        if (r && r.width) {
            let txPx = r.left + r.width / 2 - hr.left;
            let tb = Math.max(2, Math.min(28, (hr.top + hr.height) - (r.top + r.height) + 6));   // 目標腳邊高度→壓進隊伍層安全帶
            let px = st.mx * hr.width;
            let dx = txPx - px;
            let stopPx = Math.max(50, r.width * 0.35);   // 停止距離≈半格：走到怪物身旁停下輸出（不重疊、不用碰到）
            if (Math.abs(dx) > stopPx) {
                let step = Math.min(Math.abs(dx) - stopPx, hr.width * 0.012);   // ≈77px/秒·不過衝
                st.mx = (px + Math.sign(dx) * step) / hr.width;
                st.moving = true;
                player._faceD = _vec2dir(dx, -(tb - st.mb));   // 🧭 v3.7.65 移動中朝向＝移動向量（bottom 增加＝螢幕往上→取負）·停下後才由 _classFacing8 轉向目標
            } else st.moving = false;
            st.mb += Math.max(-1.5, Math.min(1.5, tb - st.mb));   // bottom 緩慢貼齊目標排（前排↔後排景深）
        } else st.moving = false;
        st.wx = null; st.wt = 0;   // 交戰中清閒晃目標
    } else {
        // 閒晃：隨機遊走＋原地停留（比照寵物）
        st.wt = (st.wt || 0) - 1;
        if (st.wt <= 0) {
            if (st.wx == null || Math.random() < 0.5) { st.wx = 0.08 + Math.random() * 0.84; st.wb = 2 + Math.random() * 26; st.wt = 30 + Math.floor(Math.random() * 50); }
            else { st.wx = null; st.wt = 15 + Math.floor(Math.random() * 40); }
        }
        if (st.wx != null) {
            let px = st.mx * hr.width, dx = st.wx * hr.width - px;
            if (Math.abs(dx) > 8 || Math.abs((st.wb || 2) - st.mb) > 2) {
                let step = Math.min(Math.abs(dx), hr.width * 0.0075);   // 閒晃≈48px/秒（比追擊慢）
                let db = (st.wb || 2) - st.mb;
                st.mx = (px + Math.sign(dx) * step) / hr.width;
                st.mb += Math.max(-1, Math.min(1, db));
                st.moving = true;
                player._faceD = _vec2dir(dx, -db);   // 🧭 無交戰目標時 _classFacing8 不會改朝向→由移動向量決定（純上下移動也會朝 N/S）
            } else { st.wx = null; st.moving = false; player._faceD = 5; }   // 走到定點休息→面向鏡頭（S）
        } else { st.moving = false; if (player._faceD !== 5 && Math.random() < 0.1) player._faceD = 5; }
    }
    st.mx = Math.max(0.05, Math.min(0.95, st.mx));
    st.mb = Math.max(2, Math.min(28, st.mb));
}
function _playerMorphApply() {   // 8fps ticker 驅動（🗡️ v3.0.67 形態＝變身優先→職業動態·key 含武器變體→換武器自動重建）
    let form = _playerBattleForm();
    let bv = document.getElementById('battle-view');
    let inBattle = bv && !bv.classList.contains('hidden') && bv.classList.contains('area-fit');
    if (!form || !inBattle) { if (_pmState.el) _playerMorphRemove(); return; }
    // 🌀 v3.0.102 傳送術特效期間：暫時隱藏玩家 sprite（特效結束自動恢復·期間跳過渲染）
    if (_teleportFxUntil > Date.now()) { if (_pmState.el) _pmState.el.style.visibility = 'hidden'; return; }
    if (_pmState.el && _pmState.el.style.visibility === 'hidden') _pmState.el.style.visibility = '';
    let a = _morphBattleCache[form.key];
    if (a === undefined) { _battleSpriteProbe(form); return; }
    if (!a || a === 'probing') return;
    if (_pmState.name !== form.domKey) { _playerMorphRemove(); _pmState.name = form.domKey; }   // 🧭 v3.2.12 只在武器/變身(domKey)變時重建·換朝向(form.key 變·domKey 不變)只換幀
    // 受擊：HP-delta 偵測（涵蓋物理/魔法/DoT 所有傷害落點）
    let hp = player.hp;
    if (_pmState.prevHp != null && hp < _pmState.prevHp && hp > 0) _playerMorphTrigger('hurt');
    _pmState.prevHp = hp;
    // 死亡/復活：以遊戲的 player.dead 旗標為準（手動改 hp 不觸發·regen 亦不誤判）；復活(revive 清旗標)→解除凍結回待機
    let _dead = !!player.dead || hp <= 0;
    if (_dead) { if (_pmState.act !== 'death') { _pmState.act = 'death'; _pmState.t = Date.now(); _pmState.pendAtk = false; try { if (typeof playMorphDeathSfx === 'function') playMorphDeathSfx(); } catch (e) {} } }   // 🧝 v3.0.47 變身死亡音（該怪物死亡音·一次）
    else if (_pmState.act === 'death') _pmState.act = null;
    // 建立 DOM（懶建·battle-view 直屬子節點·renderMobs 只重建 #mob-list 不動此層）
    if (!_pmState.el) {
        let el = document.createElement('div');
        el.id = 'player-morph-sprite';
        let sh = document.createElement('img'); sh.className = 'pm-shadow';
        let bd = document.createElement('img'); bd.className = 'pm-body';
        let wp = document.createElement('img'); wp.className = 'pm-weapon';
        let cr = document.createElement('img'); cr.className = 'pm-castle-crown'; cr.src = 'assets/ui/castle-crown.gif?v=v3.6.22'; cr.style.visibility = 'hidden';
        [sh, bd, wp, cr].forEach(i => { i.alt = ''; i.draggable = false; });
        el.append(sh, bd, wp, cr);
        bv.appendChild(el);
        _pmState.el = el; _pmState.imgs = { sh: sh, bd: bd, wp: wp, cr: cr };
        let w = (a.idle && a.idle[0]) ? a.idle[0].naturalWidth : 100;
        el.style.width = w + 'px';
    } else if (_pmState.el.parentElement !== bv) bv.appendChild(_pmState.el);
    // 🗡️ v3.0.71 每輪更新：站怪物格縫隙(依 5格/3格版面動態)·免 transform；🤝 v3.6.89 固定站位＝玩家恆前排中央（bottom/zIndex 一併固定）
    // 🚶 v3.7.64 主角走位（取代 v3.6.89 玩家固定站位·僅主玩家；傭兵仍固定站位）：_playerMoveStep 每輪步進·CSS 補間平滑（同寵物 .14s linear）
    {
        let _pw = (a.idle && a.idle[0]) ? a.idle[0].naturalWidth : 100;
        if (PLAYER_BATTLE_WALK) {
            _playerMoveStep(bv);
            if (!_pmState.el._moveTrans) { _pmState.el.style.transition = 'left .14s linear, bottom .14s linear'; _pmState.el._moveTrans = true; }
            _pmState.el.style.left = 'calc(' + (_pmState.mx * 100).toFixed(2) + '% - ' + Math.round(_pw / 2) + 'px)';
            _pmState.el.style.bottom = (Math.round(_pmState.mb) - _playerMorphYOffset(form)) + 'px';
            _pmState.el.style.zIndex = String(Math.max(1, 30 - Math.round(_pmState.mb)));
        } else {   // 🧍 v3.7.81 固定站位（v3.6.89 原制·同傭兵那行）：不步進、不補間、moving 恆 false→朝向恆對目標且待機播 idle
            let _pp = _partySpritePos().P;
            if (_pmState.el._moveTrans) { _pmState.el.style.transition = ''; _pmState.el._moveTrans = false; }
            _pmState.moving = false; _pmState.mx = null;   // mx 清空＝開關切回 true 時重新以固定站位起步
            _pmState.el.style.left = 'calc(' + _pp.x + ' - ' + Math.round(_pw / 2) + 'px)';
            _pmState.el.style.bottom = (_pp.b - _playerMorphYOffset(form)) + 'px';
            _pmState.el.style.zIndex = String(30 - _pp.b);
        }
    }
    // 🧭 v3.7.65 朝向：移動中已由 _playerMoveStep 依移動向量寫入 player._faceD（走路面向前進方向）→ 只有停下時才轉向攻擊目標
    //    🧍 v3.7.81 固定站位下 moving 恆 false → 這行每輪都跑＝朝向永遠對著攻擊目標（同傭兵）
    if (!_pmState.moving && (CLASS_ANIM_8DIR.has(player.avatar) || MORPH_ANIM_3DIR.has(_playerMorphName() || ''))) _classFacing8(player, _pmState.el);
    // 動作＋幀（比照 _mobAnimApply：單次動作播一輪回待機·death 凍結最後一幀）
    let act = null, f = 0, _useW = false;
    if (_pmState.act) {
        let seq = a[_pmState.act];
        if (_pmState.act === 'skill' && !_pmState.skGen && a.wskill) { seq = a.wskill; _useW = true; }   // 🗡️ v3.0.70 武器專屬 skill 優先（戰士咆哮 skGen→通用）
        if (seq) {
            let _fms = (_pmState.act === 'attack') ? _atkFrameMs((player.d && player.d.aspd) || 0, seq.length)   // ⚔️ v3.0.91 攻擊動畫隨攻速加速
                : (_pmState.act === 'skill') ? _skillFrameMs(seq.length)   // 🔮 v3.0.94 技能動畫隨施法速度加速（castLock 內播完）
                : (1000 / MOB_ANIM_FPS);
            let ff = Math.floor((Date.now() - _pmState.t) / _fms);
            if (_pmState.act === 'death') { act = 'death'; f = Math.min(ff, seq.length - 1); }
            else if (ff < seq.length) { act = _pmState.act; f = ff; }
            else {
                _pmState.act = null;
                if (_pmState.pendAtk && a.attack) { _pmState.pendAtk = false; _pmState.act = 'attack'; _pmState.t = Date.now(); act = 'attack'; f = 0; _useW = false; }   // 🎬 v3.0.106 skill／hurt 播完→接播排隊中的攻擊動畫
                else _pmState.pendAtk = false;
            }
        } else if (_pmState.act !== 'death') _pmState.act = null;   // 該動作無序列→回待機（death 無序列則維持 idle）
        else act = null;
    }
    // 🚶 v3.7.65 待機層：移動中且有行走幀→播 walk（8fps 循環）·否則 idle
    if (act === null) {
        let mv = _pmState.moving && a.walk && a.walk.length;
        let base = mv ? a.walk : a.idle;
        if (base) { act = mv ? 'walk' : 'idle'; f = Math.floor(Date.now() / (1000 / MOB_ANIM_FPS)) % base.length; _useW = false; }
    }
    if (act === null) return;
    let seq = (act === 'skill' && _useW) ? a.wskill : a[act]; if (!seq || !seq[f]) return;
    let I = _pmState.imgs;
    if (!I.cr && _pmState.el) {
        let cr = document.createElement('img'); cr.className = 'pm-castle-crown'; cr.src = 'assets/ui/castle-crown.gif?v=v3.6.22'; cr.alt = ''; cr.draggable = false; cr.style.visibility = 'hidden';
        _pmState.el.appendChild(cr); I.cr = cr;
    }
    if (I.bd.src !== seq[f].src) I.bd.src = seq[f].src;
    _playerBattleCrownApply(I.cr, form, act);
    let ss = (act === 'skill' && _useW) ? a.shadow.wskill : a.shadow[act];   // 影子：寬容（幀數不足取模·缺動作隱藏）
    if (ss && ss.length) { let sf = f < ss.length ? f : (f % ss.length); if (I.sh.style.visibility === 'hidden') I.sh.style.visibility = ''; if (I.sh.src !== ss[sf].src) I.sh.src = ss[sf].src; }
    else if (I.sh.style.visibility !== 'hidden') I.sh.style.visibility = 'hidden';
    let ws = a.weapon[act];   // 武器：嚴格 1:1（本動作本幀無 _w→隱藏·v2.7.36 規則）
    if (ws && ws[f]) { if (I.wp.style.visibility === 'hidden') I.wp.style.visibility = ''; if (I.wp.src !== ws[f].src) I.wp.src = ws[f].src; }
    else if (I.wp.style.visibility !== 'hidden') I.wp.style.visibility = 'hidden';
}
// 🧝 施法觸發：包裝 manualCast（castSkill 已於上方 VFX 包裝內加掛）
if (typeof manualCast === 'function' && !manualCast._pmWrapped) {
    let _pmOrigManualCast = manualCast;
    manualCast = function (skId) { try { if (typeof _playerMorphTrigger === 'function') _playerMorphTrigger('skill', skId); } catch (e) {} return _pmOrigManualCast.apply(this, arguments); };
    manualCast._pmWrapped = true;
}
// ===== 🤝 v3.0.70 隊員戰場 sprite（隊員1=主玩家組動畫·主玩家左側；隊員2/3=<avatar>2 組·中間偏右/更右；一律職業動畫·變身限定主玩家）=====
// 🗡️ v3.0.71 隊伍站「怪物格縫隙中點」避免與怪物完全重疊：5格模式怪物中心≈12/34.5/57/76/91%·3格版面≈17.3/50/82.7%，所有站位皆錯開。
// 🤝 v3.6.89 取消權重站位（用戶拍板）：舊制依 aggro 權重每輪重排前後（bottom 2+rank*9·zIndex=30-bottom），權重一變全隊位置就跳動；
//    且 8 名成員時第 5 順位起 bottom≥38 → zIndex 轉負 → 沉到 #mob-list（in-flow）之下被怪物卡蓋住＝王族第 4~7 名傭兵在狩獵區看不見。
//    改為「玩家＋傭兵依招募順序站固定位置」：玩家＋傭兵1~3 前排（bottom 2·z 28）·傭兵4~7 後排（bottom 26·z 4=站後面有景深）·永不跳位、zIndex 恆為正。
function _partySpritePos() {
    let five = true; try { five = (typeof backSlotsActive !== 'function') || backSlotsActive(); } catch (e) {}
    return five ? { P: { x: '45.5%', b: 2 }, A: [{ x: '23%', b: 2 }, { x: '66%', b: 2 }, { x: '83.5%', b: 2 }, { x: '28%', b: 26 }, { x: '51%', b: 26 }, { x: '70.5%', b: 26 }, { x: '7%', b: 26 }] }
                : { P: { x: '39%', b: 2 },   A: [{ x: '28%', b: 2 }, { x: '62%', b: 2 }, { x: '72%', b: 2 }, { x: '33.5%', b: 26 }, { x: '57%', b: 26 }, { x: '77.5%', b: 26 }, { x: '23%', b: 26 }] };
}
let _allySpriteStates = {};   // slot → { act, t, prevHp, el, imgs, key, skGen }
function _allySpriteTrigger(ally, k, skId) {   // js/06 掛點：allyAttackOnce→'attack'·三施法函式→'skill'
    try {
        if (!ally || ally._slot == null) return;
        let st = _allySpriteStates[String(ally._slot)];
        if (!st || st.act === 'death') return;
        if (st.act === 'skill' && k === 'attack') {   // 🔮 v3.0.96 鏡像玩家(v3.0.94)：技能動畫優先——攻擊排隊(pendAtk)到技能播完才播（傭兵受擊走 HP-delta 本就不打斷施法）
            let a = _morphBattleCache[st.key];
            let seq = (a && a !== 'probing') ? ((!st.skGen && a.wskill) ? a.wskill : a.skill) : null;
            if (seq && (Date.now() - st.t) < seq.length * _skillFrameMs(seq.length, (ally.d && ally.d.castLock) || 12)) { st.pendAtk = true; return; }
        }
        if (k === 'skill') st.skGen = (skId === 'sk_warrior_roar' || skId === '咆哮');   // 傭兵端傳技能名·玩家端傳技能 id
        st.act = k; st.t = Date.now(); st.pendAtk = false;   // 新動作生效→清掉排隊中的攻擊（已被取代）
    } catch (e) {}
}
function _allySpritesApply() {   // 8fps ticker 驅動
    let bv = document.getElementById('battle-view');
    let inBattle = bv && !bv.classList.contains('hidden') && bv.classList.contains('area-fit');
    let allies = (typeof player !== 'undefined' && player && player.allies) || [];
    for (let slot in _allySpriteStates) {   // 清理：離場/不在戰鬥→移除
        if (!inBattle || !allies.some(a => a && String(a._slot) === slot)) {
            let st = _allySpriteStates[slot];
            if (st && st.el) { try { st.el.remove(); } catch (e) {} }
            delete _allySpriteStates[slot];
        }
    }
    if (!inBattle) return;
    allies.forEach((ally, i) => {
        if (!ally) return;
        let form = _actorBattleForm(ally, i > 0);   // 傭兵變身優先；未變身才使用原職業動畫
        if (!form) return;
        let a = _morphBattleCache[form.key];
        if (a === undefined) { _battleSpriteProbe(form); return; }
        if (!a || a === 'probing') return;
        let slot = String(ally._slot);
        let st = _allySpriteStates[slot] || (_allySpriteStates[slot] = { act: null, t: 0, prevHp: null, el: null, imgs: null, key: null, dkey: null, skGen: false, pendAtk: false });
        st.key = form.key;   // 🧭 v3.2.12 快取查找鍵含朝向（供 _allySpriteTrigger 讀）·每輪更新
        if (st.dkey !== form.domKey) { if (st.el) { try { st.el.remove(); } catch (e) {} } st.el = null; st.imgs = null; st.act = null; st.dkey = form.domKey; st.pendAtk = false; }   // 🔮 v3.0.96 換形態→清排隊攻擊；🧭 v3.2.12 只在武器/形態(domKey)變時重建·換朝向(form.key 變·domKey 不變)只換幀
        // 受擊：curHp-delta（涵蓋所有傷害落點）🎬 v3.0.106 播放權重 hurt>skill：受擊可打斷施法（只有死亡不被打斷·鏡像玩家）
        let hp = ally.curHp || 0;
        if (st.prevHp != null && hp < st.prevHp && hp > 0 && st.act !== 'death') { st.act = 'hurt'; st.t = Date.now(); st.pendAtk = false; }
        st.prevHp = hp;
        // 倒地/復活
        if (ally._downed || hp <= 0) { if (st.act !== 'death') { st.act = 'death'; st.t = Date.now(); st.pendAtk = false; } }   // 🔮 v3.0.96 倒地→清排隊攻擊
        else if (st.act === 'death') st.act = null;
        // DOM 懶建
        if (!st.el) {
            let el = document.createElement('div');
            el.className = 'party-sprite';
            let sh = document.createElement('img'); sh.className = 'pm-shadow';
            let bd = document.createElement('img'); bd.className = 'pm-body';
            let wp = document.createElement('img'); wp.className = 'pm-weapon';   // 🧝 v3.5.23 傭兵變身特效層（_w·screen 混合）＝鏡像玩家三層結構
            [sh, bd, wp].forEach(im => { im.alt = ''; im.draggable = false; });
            el.append(sh, bd, wp);
            bv.appendChild(el);
            st.el = el; st.imgs = { sh: sh, bd: bd, wp: wp };
        } else if (st.el.parentElement !== bv) bv.appendChild(st.el);
        let w = (a.idle && a.idle[0]) ? a.idle[0].naturalWidth : 100;
        st.el.style.width = w + 'px';
        { let _ps = _partySpritePos().A, _pp = _ps[Math.min(i, _ps.length - 1)]; st.el.style.left = 'calc(' + _pp.x + ' - ' + Math.round(w / 2) + 'px)'; st.el.style.bottom = _pp.b + 'px'; st.el.style.zIndex = String(30 - _pp.b); }   // 每輪更新（隊員順位/地圖版面 5格↔3格 可能變）；🤝 v3.6.89 固定站位＝依招募順序（前排 0~2·後排 3~6）
        if (CLASS_ANIM_8DIR.has(ally.avatar) || MORPH_ANIM_3DIR.has(_actorMorphName(ally) || '')) _classFacing8(ally, st.el);   // 🧭 職業／變身皆依攻擊目標更新朝向（傭兵固定站位不走位→恆為目標朝向）
        // 動作＋幀（同主玩家邏輯·wskill 武器專屬 skill 優先·咆哮通用）
        let act = null, f = 0, _useW = false;
        if (st.act) {
            let seq = a[st.act];
            if (st.act === 'skill' && !st.skGen && a.wskill) { seq = a.wskill; _useW = true; }
            if (seq) {
                let _fms = (st.act === 'attack') ? _atkFrameMs(((ally.d && ally.d.aspd) ? ally.d.aspd : (typeof atkSpdBaseItv === 'function' ? atkSpdBaseItv(ally) : 0)), seq.length)   // ⚔️ v3.0.98 傭兵攻擊動畫用實際排程間隔 ally.d.aspd（含加速等·與 js/06 攻速一致；原用 base 會動畫比攻擊慢）
                    : (st.act === 'skill') ? _skillFrameMs(seq.length, (ally.d && ally.d.castLock) || 12)   // 🔮 v3.0.96 傭兵技能動畫隨自身施法速度（鏡像玩家 v3.0.94）
                    : (1000 / MOB_ANIM_FPS);
                let ff = Math.floor((Date.now() - st.t) / _fms);
                if (st.act === 'death') { act = 'death'; f = Math.min(ff, seq.length - 1); }
                else if (ff < seq.length) { act = st.act; f = ff; }
                else {
                    let _wasSkill = (st.act === 'skill');
                    st.act = null;
                    if (_wasSkill && st.pendAtk && a.attack) { st.pendAtk = false; st.act = 'attack'; st.t = Date.now(); act = 'attack'; f = 0; _useW = false; }   // 🔮 v3.0.96 技能播完→接播排隊中的攻擊動畫
                    else st.pendAtk = false;
                }
            } else if (st.act !== 'death') st.act = null;
            else act = null;
        }
        if (act === null && a.idle) { act = 'idle'; f = (Math.floor(Date.now() / (1000 / MOB_ANIM_FPS)) + i * 3) % a.idle.length; _useW = false; }   // 隊員間錯相（+i*3）
        if (act === null) return;
        let seq = (act === 'skill' && _useW) ? a.wskill : a[act]; if (!seq || !seq[f]) return;
        if (st.imgs.bd.src !== seq[f].src) st.imgs.bd.src = seq[f].src;
        let ss = (act === 'skill' && _useW) ? a.shadow.wskill : a.shadow[act];
        if (ss && ss.length) { let sf = f < ss.length ? f : (f % ss.length); if (st.imgs.sh.style.visibility === 'hidden') st.imgs.sh.style.visibility = ''; if (st.imgs.sh.src !== ss[sf].src) st.imgs.sh.src = ss[sf].src; }
        else if (st.imgs.sh.style.visibility !== 'hidden') st.imgs.sh.style.visibility = 'hidden';
        if (st.imgs.wp) {   // 🧝 v3.5.23 特效層：嚴格 1:1（本動作本幀無 _w→隱藏·同玩家 v2.7.36 規則）
            let ws = a.weapon && a.weapon[act];
            if (ws && ws[f]) { if (st.imgs.wp.style.visibility === 'hidden') st.imgs.wp.style.visibility = ''; if (st.imgs.wp.src !== ws[f].src) st.imgs.wp.src = ws[f].src; }
            else if (st.imgs.wp.style.visibility !== 'hidden') st.imgs.wp.style.visibility = 'hidden';
        }
    });
}
setInterval(() => { if (!document.hidden && !(typeof catchupActive === 'function' && catchupActive())) { try { _mobAnimApply(); } catch (e) {} try { _updateFreezeFx(); } catch (e) {} try { _updateMobSkillFx(); } catch (e) {} try { _allySpritesApply(); } catch (e) {} try { _playerMorphApply(); } catch (e) {} } }, Math.floor(1000 / MOB_ANIM_FPS));

// 🌙 v3.6.03 掛網記憶體釋放：切到背景的瞬間清空 #vfx-layer 全部特效元素＋冰凍/怪技能追蹤 dict。
//    背景分頁的移除管線全數停擺（animationend 不觸發·WAAPI onfinish 暫停·setTimeout 節流至 1/分鐘），
//    放著只會讓 Chrome 抱著幾百個動畫節點；隱藏時本來就看不見→立即釋放對特效表現零影響。
//    幀步進 interval、延遲箭矢、保險回收 timer 與震動監聽器同步取消，去重鍵也立即釋放。
//    回前景不需特殊處理：_vfxMute() 已含 document.hidden，新特效自然恢復生成。
document.addEventListener('visibilitychange', () => { if (document.hidden) { try { _vfxClearAll(); } catch (e) {} try { _vfxPending = []; } catch (e) {} } });

// 🚀 效能：分頁面板重繪保護＋節流。狩獵時扣箭/耗肉/掉寶會每 tick 觸發 renderTabs 重建整個面板，
//    重建會洗掉按鈕→在 mousedown↔mouseup 間重建使「賣出/強化」點擊失效並造成卡頓。
