// ========== 🗡️ 裝備收集冊（概念同卡片收集冊：獲得即登錄、依部位分類）==========
// 收集冊本體道具已移除：改由「收藏」面板開啟，item_equip_book 無任何取得管道且讀檔時被 ensureEquipBook 濾除
// →不可達定義刪除（ensureEquipBook 內的字串 id 過濾保留·舊存檔遷移仍需要）。

// ---- 部位分類（顯示順序＝武器 → 防具 → 飾品）----
const EQUIP_CATEGORIES = [
    // 武器
    { key: 'dagger',     name: '匕首',     group: '武器' },
    { key: 'sword1',     name: '單手劍',   group: '武器' },
    { key: 'sword2',     name: '雙手劍',   group: '武器' },
    { key: 'katana',     name: '武士刀',   group: '武器' },
    { key: 'blunt1',     name: '單手鈍器', group: '武器' },
    { key: 'blunt2',     name: '雙手鈍器', group: '武器' },
    { key: 'spear',      name: '矛',       group: '武器' },
    { key: 'claw',       name: '鋼爪',     group: '武器' },
    { key: 'dual',       name: '雙刀',     group: '武器' },
    { key: 'chainsword', name: '鎖鏈劍',   group: '武器' },
    { key: 'bow',        name: '弓',       group: '武器' },
    { key: 'xbow',       name: '十字弓',   group: '武器' },
    { key: 'quiver',     name: '箭筒',     group: '武器' },   // 🏺 v3.2.0 遺物箭筒（isArrow+relic·改造便利箭筒/艾庫尤卡的永續箭筒）：一般箭矢仍不收錄；本分類只在「遺物收集冊」出現（裝備收集冊 buildEquipIndex 跳過遺物→陣列空→分頁自動隱藏·EQUIP_CAT_BONUS 無此鍵→無全收集加成）
    { key: 'wand',       name: '魔杖',     group: '武器' },
    { key: 'qigu',       name: '奇古獸',   group: '武器' },
    { key: 'wpn_other',  name: '其他武器', group: '武器' },
    // 防具
    { key: 'helm',     name: '頭盔',   group: '防具' },
    { key: 'armor',    name: '盔甲',   group: '防具' },
    { key: 'shin',     name: '脛甲',   group: '防具' },
    { key: 'tshirt',   name: '內衣',   group: '防具' },
    { key: 'cloak',    name: '斗篷',   group: '防具' },
    { key: 'boots',    name: '長靴',   group: '防具' },
    { key: 'gloves',   name: '手套',   group: '防具' },
    { key: 'shield',   name: '盾牌',   group: '防具' },
    { key: 'armguard', name: '臂甲',   group: '防具' },
    // 飾品
    { key: 'amulet', name: '項鍊',     group: '飾品' },
    { key: 'ring',   name: '戒指',     group: '飾品' },
    { key: 'belt',   name: '腰帶',     group: '飾品' },
    { key: 'ear',    name: '耳環',     group: '飾品' },
    { key: 'pet',    name: '寵物裝備', group: '飾品' },
    { key: 'doll',   name: '魔法娃娃', group: '飾品' }
];

// ---- 各部位「全收集完成」加成（蒐集該部位全部裝備 → 永久加成；mhp/mmp→玩家 p，其餘→衍生值 d；ac 越低越好故 d.ac -= val；weight 延後到負重段；petHit 經 player._equipPetHit 餵給 petGearBonus）----
const EQUIP_CAT_BONUS = {
    // 武器
    dagger:     { stat: 'mmp',    val: 5,  label: 'MP +5' },
    sword1:     { stat: 'dr',     val: 1,  label: '傷害減免 +1' },
    sword2:     { stat: 'mhp',    val: 10, label: 'HP +10' },
    katana:     { stat: 'mhp',    val: 5,  label: 'HP +5' },
    blunt1:     { stat: 'weight', val: 10, label: '負重 +10' },
    blunt2:     { stat: 'weight', val: 10, label: '負重 +10' },
    spear:      { stat: 'mr',     val: 1,  label: 'MR +1' },
    claw:       { stat: 'hpR',    val: 1,  label: 'HP自動恢復 +1' },
    dual:       { stat: 'dr',     val: 1,  label: '傷害減免 +1' },
    chainsword: { stat: 'mhp',    val: 5,  label: 'HP +5' },
    bow:        { stat: 'er',     val: 1,  label: 'ER +1' },
    xbow:       { stat: 'mr',     val: 1,  label: 'MR +1' },
    wand:       { stat: 'mpR',    val: 1,  label: 'MP自動恢復量 +1' },
    qigu:       { stat: 'mmp',    val: 5,  label: 'MP +5' },
    // wpn_other：無加成（其他武器·目前為空）
    // 防具
    helm:     { stat: 'dr',     val: 1,  label: '傷害減免 +1' },
    armor:    { stat: 'ac',     val: 1,  label: 'AC -1' },
    shin:     { stat: 'dr',     val: 1,  label: '傷害減免 +1' },
    cloak:    { stat: 'mr',     val: 1,  label: 'MR +1' },
    boots:    { stat: 'er',     val: 1,  label: 'ER +1' },
    gloves:   { stat: 'dr',     val: 1,  label: '傷害減免 +1' },
    shield:   { stat: 'mhp',    val: 10, label: 'HP +10' },
    armguard: { stat: 'weight', val: 10, label: '負重 +10' },
    // 飾品
    amulet: { stat: 'hpR',     val: 1,  label: 'HP自然恢復量 +1' },
    ring:   { stat: 'mpR',     val: 1,  label: 'MP自然恢復量 +1' },
    belt:   { stat: 'weight',  val: 20, label: '負重 +20' },
    ear:    { stat: 'mpR',     val: 1,  label: 'MP自然恢復量 +1' },
    pet:    { stat: 'petHit',  val: 1,  label: '寵物命中率 +1' },
    doll:   { stat: 'allattr', val: 1,  label: '全屬性 +1' }   // 🪆 魔法娃娃全收集：六維各+1。實際套用在 js/02 Phase1(屬性須在換算衍生值前計入)；此處僅供收集冊顯示 label，equipCollectionBonus 對 allattr 做 no-op 避免 Phase3 重複套用
};

// ---- 將一件裝備分到部位 key（回傳 null＝不收錄，例如箭矢、非裝備）----
function equipCatKey(id, d) {
    if (!d) return null;
    if (d.relicBaseId !== undefined) {
        let baseId = d.relicBaseId, base = typeof baseId === 'string' && DB.items[baseId];
        if (!base || base.relic || base.relicBaseId !== undefined) return null;
        if (base.type === 'wpn' && base.isArrow) return isRelic(d) ? 'quiver' : null;
        return equipCatKey(baseId, base); // 原型名稱參與十字弓、魔杖等分類，不能改看遺物的新名字。
    }
    if (d.type === 'wpn') {
        if (d.isArrow) return (typeof isRelic === 'function' && isRelic(d)) ? 'quiver' : null;   // 🏺 v3.2.0 遺物箭筒歸「箭筒」分類（供遺物收集冊）；一般箭矢＝彈藥，不收錄
        if (d.isBow) return /十字弓|弩/.test(d.n || '') ? 'xbow' : 'bow';
        if (d.qigu) return 'qigu';
        if (d.chainsword) return 'chainsword';
        if (typeof isWandWeapon === 'function' && isWandWeapon(d)) return 'wand';
        if (typeof WAND_LIGHTARROW_IDS !== 'undefined' && WAND_LIGHTARROW_IDS.indexOf(id) >= 0) return 'wand';   // 🔮 共鳴法器（惡魔鐮刀＝單手魔杖／漆黑水晶球等）歸魔杖
        let tags = (typeof getWeaponTags === 'function') ? getWeaponTags(id) : [];
        if (tags.indexOf('武士刀') >= 0) return 'katana';
        if (tags.indexOf('雙刀') >= 0) return 'dual';
        if (tags.indexOf('鋼爪') >= 0) return 'claw';
        if (tags.indexOf('匕首') >= 0) return 'dagger';
        if (tags.indexOf('雙手劍') >= 0) return 'sword2';
        if (tags.indexOf('單手劍') >= 0) return 'sword1';
        if (tags.indexOf('雙手鈍器') >= 0) return 'blunt2';
        if (tags.indexOf('單手鈍器') >= 0) return 'blunt1';
        if (tags.indexOf('矛') >= 0) return 'spear';
        // 無 tag 的武器：用 eff/名稱補分類（矛=穿透、雙手劍=切割、鈍器=重擊、共鳴法球=魔杖）
        if (/水晶球/.test(d.n || '')) return 'wand';
        if (d.eff === 'pierce') return 'spear';
        if (d.eff === 'cleave') return 'sword2';
        if (d.eff === 'crush') return d.w2h ? 'blunt2' : 'blunt1';
        return 'wpn_other';
    }
    if (d.type === 'arm') {
        if (d.armguard) return 'armguard';                           // 臂甲（slot:shield 但 armguard 旗標）
        if (d.slot === 'helm') return 'helm';
        if (d.slot === 'armor') return 'armor';
        if (d.slot === 'shin') return 'shin';   // 🦵 脛甲（盔甲下方·額外防具）
        if (d.slot === 'tshirt') return 'tshirt';   // 🏺 內衣（T恤）：供遺物 T恤 分類（一般 T恤亦一併納入裝備收集冊）
        if (d.slot === 'cloak') return 'cloak';
        if (d.slot === 'boots') return 'boots';
        if (d.slot === 'gloves') return 'gloves';
        if (d.slot === 'shield') return 'shield';
        if (d.slot === 'petarm') return 'pet';   // 🛡️ v3.2.37 寵物防具 → 寵物裝備分類
        return null;
    }
    if (d.type === 'acc') {
        if (d.slot === 'amulet') return 'amulet';
        if (d.slot === 'ring') return 'ring';
        if (d.slot === 'belt') return 'belt';
        if (d.slot === 'ear1' || d.slot === 'ear2' || d.slot === 'ear') return 'ear';
        if (d.slot === 'pet' || d.slot === 'petwpn') return 'pet';   // 🦴 v3.2.37 之牙改 slot:petwpn（寵物個別武器）
        if (d.slot === 'doll') return 'doll';
        return null;
    }
    return null;
}

// ---- 建立索引：部位 → [itemId,...]（依價格排序）、itemId → 部位 ----
const EQUIP_CAT_ITEMS = {};   // catKey -> [itemId,...]
const EQUIP_ITEM_CAT = {};    // itemId -> catKey
(function buildEquipIndex() {
    EQUIP_CATEGORIES.forEach(c => { EQUIP_CAT_ITEMS[c.key] = []; });
    for (let id in DB.items) {
        let d = DB.items[id];
        if (!d || (d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc')) continue;
        if (typeof isRelic === 'function' && isRelic(d)) continue;   // 🏺 遺物不進「裝備收集冊」→ 改進「遺物收集冊」(js/21)
        let ck = equipCatKey(id, d);
        if (!ck || !EQUIP_CAT_ITEMS[ck]) continue;
        EQUIP_CAT_ITEMS[ck].push(id);
        EQUIP_ITEM_CAT[id] = ck;
    }
    for (let k in EQUIP_CAT_ITEMS) {
        EQUIP_CAT_ITEMS[k].sort((a, b) => ((DB.items[a].p || 0) - (DB.items[b].p || 0)) || ((DB.items[a].n || '') < (DB.items[b].n || '') ? -1 : 1));
    }
})();

// ---- dex 助手（player.equipDex: itemId -> true，永久·只增不減）----
function equipDexHas(id) { return !!(player.equipDex && player.equipDex[id]); }
function equipCatCount(ck) { let arr = EQUIP_CAT_ITEMS[ck] || []; return { got: arr.filter(equipDexHas).length, total: arr.length }; }
function equipCatComplete(ck) { let cc = equipCatCount(ck); return cc.total > 0 && cc.got >= cc.total; }   // 該部位全部裝備皆已收集

// ---- recomputeStats 鉤子：各部位「全收集」加成（mhp/mmp→p；dr/mr/hpR/mpR/er→d；ac→d.ac-=val；weight→d._equipWeightBonus 供負重段；petHit→p._equipPetHit 供 petGearBonus）----
function equipCollectionBonus(p, d) {
    if (d) d._equipWeightBonus = 0;
    if (p) p._equipPetHit = 0;
    if (!p || !p.equipDex) return;
    for (let i = 0; i < EQUIP_CATEGORIES.length; i++) {
        let ck = EQUIP_CATEGORIES[i].key;
        let b = EQUIP_CAT_BONUS[ck]; if (!b) continue;
        if (!equipCatComplete(ck)) continue;
        switch (b.stat) {
            case 'mhp':    p.mhp += b.val; break;
            case 'mmp':    p.mmp += b.val; break;
            case 'dr':     d.dr  += b.val; break;
            case 'mr':     d.mr  += b.val; break;
            case 'hpR':    d.hpR += b.val; break;
            case 'mpR':    d.mpR += b.val; break;
            case 'er':     d.er  += b.val; break;
            case 'ac':     d.ac  -= b.val; break;                 // AC 越低越好：AC-1 = d.ac -= 1
            case 'weight': d._equipWeightBonus += b.val; break;   // 延後到 js/02 負重段併入 _cap
            case 'petHit': p._equipPetHit += b.val; break;        // 由 petGearBonus 加到夥伴命中
            case 'allattr': break;                                // 🪆 六維加成改在 js/02 Phase1 套用（屬性須在換算衍生值前計入）；此處 no-op 不重複套用
        }
    }
}
function registerEquipObtained(id) {   // gainItem 呼叫：獲得任何裝備即登錄
    if (!player) return;
    if (!player.equipDex) player.equipDex = {};
    if (EQUIP_ITEM_CAT[id] && !player.equipDex[id]) { player.equipDex[id] = true; if (typeof saveEquipDex === 'function') saveEquipDex(); }   // 🗡️ 僅「首次」登錄才回寫共用桶（避免每次拾取都寫 localStorage）
}

// ---- 創角/讀檔保底：確保有一本收集冊，並把現有(背包+已裝備)裝備補登錄（舊存檔遷移）----
function ensureEquipBook(warehouse) {
    if (!player || !Array.isArray(player.inv)) return;
    let changed = false;
    if (!player.equipDex) { player.equipDex = {}; changed = true; }
    // 🗡️ 裝備收集冊改由「收藏」面板開啟→不再放在道具欄；移除舊存檔殘留的收集冊本體（資料在 player.equipDex·與本體無關）
    if (player.inv.some(i => i.id === 'item_equip_book')) { player.inv = player.inv.filter(i => i.id !== 'item_equip_book'); changed = true; }
    let register = i => { if (i && i.id && EQUIP_ITEM_CAT[i.id] && !player.equipDex[i.id]) { player.equipDex[i.id] = true; changed = true; } };
    player.inv.forEach(register);
    if (player.eq) for (let s in player.eq) register(player.eq[s]);
    // 🏛️ v3.0.61 倉庫庫存也補登錄（唯讀當前模式倉庫桶）：收集冊上線前入倉的裝備從未經 gainItem 登錄→圖鑑全暗（傳統模式裝備自帶強化、常整批入倉最易踩到）；讀檔時一併點亮
    try { let _w = warehouse || (typeof loadWarehouse === 'function' ? loadWarehouse() : null); if (_w && Array.isArray(_w.items)) _w.items.forEach(register); } catch (e) {}
    if (changed && typeof saveEquipDex === 'function') saveEquipDex();   // 🗡️ 僅首次補登錄才回寫共用桶，避免每次載入重複序列化完整圖鑑
}

// ===== 全螢幕書頁 UI =====
let _equipBookOpen = false;
let _equipBookCat = EQUIP_CATEGORIES[0].key;
function openEquipBook() {
    if (!player.equipDex) player.equipDex = {};
    if (typeof mergeSharedIntoPlayer === 'function' && mergeSharedIntoPlayer('equip') && typeof calcStats === 'function') calcStats();   // 🔄 多開兜底：開書前先併入其他分頁的裝備進度。⚠️ 裝備冊「有」加成（EQUIP_CAT_BONUS 28 筆經 equipCollectionBonus 套 HP/MP/dr/mr/AC/負重…），合併後必須重算，否則 UI 立刻顯示「（已啟用）」但衍生值要等下次 calcStats 才生效（比照 js/15 openCardBook）
    if (typeof closeModal === 'function') closeModal();   // 先關物品操作彈窗(z-50)，避免書頁(z-45)開在後方
    _equipBookOpen = true;
    let el = document.getElementById('equip-book'); if (!el) return;
    el.classList.remove('hidden');
    renderEquipBook();
}
function closeEquipBook() { _equipBookOpen = false; let el = document.getElementById('equip-book'); if (el) el.classList.add('hidden'); }
function equipBookTab(key) { _equipBookCat = key; renderEquipBook(); }
function equipBookBackdrop(ev) { if (ev && ev.target && ev.target.id === 'equip-book') closeEquipBook(); }

function renderEquipBook() {
    let host = document.getElementById('equip-book-body'); if (!host) return;
    // 分頁列：只顯示「有可收集裝備」的部位；不同 group 間插入分隔標籤（武器/防具/飾品）
    let tabHost = document.getElementById('equip-book-tabs');
    if (tabHost) {
        let lastGroup = '';
        tabHost.innerHTML = EQUIP_CATEGORIES.filter(c => (EQUIP_CAT_ITEMS[c.key] || []).length > 0).map(c => {
            let cc = equipCatCount(c.key);
            let active = (c.key === _equipBookCat);
            let done = cc.total > 0 && cc.got >= cc.total;
            let sep = (c.group !== lastGroup) ? `<span class="text-slate-500 text-[11px] font-bold px-1 self-center">${c.group}</span>` : '';
            lastGroup = c.group;
            return sep + `<button onclick="equipBookTab('${c.key}')" class="btn px-2.5 py-1 text-xs font-bold whitespace-nowrap ${active ? 'bg-sky-800 border-sky-500 text-sky-100' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}">${c.name}<span class="ml-1 text-[10px] ${done ? 'text-emerald-400' : 'text-slate-400'}">${cc.got}/${cc.total}</span></button>`;
        }).join('');
    }
    let cat = EQUIP_CATEGORIES.find(c => c.key === _equipBookCat) || EQUIP_CATEGORIES[0];
    let ids = EQUIP_CAT_ITEMS[cat.key] || [];
    let cc = equipCatCount(cat.key);
    let _b = EQUIP_CAT_BONUS[cat.key];
    let _done = cc.total > 0 && cc.got >= cc.total;
    let _bonusHtml = _b
        ? `<div class="text-sm font-bold ${_done ? 'text-emerald-300' : 'text-slate-500'}">🏆 全收集加成：${_b.label}<span class="ml-1 text-xs font-normal">${_done ? '（已啟用）' : '（未完成）'}</span></div>`
        : `<div class="text-sm text-slate-600">此部位無全收集加成</div>`;
    let head = `<div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div class="text-xl font-bold text-sky-200">${cat.group}・${cat.name}<span class="text-sm text-slate-400 font-normal ml-2">已收集 ${cc.got} / ${cc.total}</span></div>
        ${_bonusHtml}
    </div>`;
    let cells = ids.map(id => {
        let d = DB.items[id]; let got = equipDexHas(id);
        let imgUrl = (typeof getIconUrl === 'function') ? getIconUrl(d) : (d.img || '');
        let silh = got ? '' : ' card-silhouette';
        let nameHtml = got
            ? `<div class="text-xs font-bold ${d.legend ? 'text-amber-300' : 'text-white'} truncate" title="${d.n}">${d.n}</div>`
            : `<div class="text-xs font-bold text-slate-500">？？？</div>`;
        return `<div class="relative bg-slate-800/70 border ${got ? 'border-slate-600' : 'border-slate-700/60'} rounded-lg p-2 flex flex-col items-center gap-1 w-[112px]${got ? ' tip-host cursor-help' : ''}"${got ? ` data-tip-id="${id}"` : ''}>
            ${got && d.legend ? '<span class="absolute top-1 right-1 text-[9px] px-1 rounded text-amber-300 bg-black/50 font-bold">傳說</span>' : ''}
            <img src="${imgUrl}" alt="${d.n}" class="w-14 h-14 object-contain${silh}" onerror="this.onerror=null;this.src='https://placehold.co/56x56/1e293b/334155?text=%3F';">
            <div class="text-center w-full">${nameHtml}</div>
        </div>`;
    }).join('');
    host.innerHTML = head + `<div class="flex flex-wrap gap-2 justify-center">${cells || '<div class="text-slate-500 p-8">此部位暫無可收集的裝備。</div>'}</div>`;
}
