// ===== 共用倉庫（存檔角色共用，獨立於存檔位的 localStorage 鍵）=====
// 🎮 經典模式與非經典模式角色的倉庫不共通：依 player.classicMode 切換 localStorage 鍵（傭兵走存檔位、與倉庫無關，仍共通）。
const WH_KEY = 'lineage_idle_warehouse';
// 🎮 模式桶鍵後綴（倉庫桶／圖鑑桶／傭兵同模式招募共用·單一真相）：經典→'_classic'、一般→''。
//   ⚠️v3.0.83 傳統模式已取消：t 參數忽略（一般+傳統→一般、經典+傳統→經典）；舊 '_tradonly'/'_trad' 桶由下方 _mergeTradBuckets 一次性併入。
function modeSuffix(c, t){ return c ? '_classic' : ''; }
function whKey(p){ let _p = (p !== undefined) ? p : player; return WH_KEY + modeSuffix(!!(_p && _p.classicMode), !!(_p && _p.traditionalMode)); }   // 🏛️🎮 依模式組合取對應倉庫桶
const WH_MAX = 5000;   // 倉庫格數上限（🔧 100 → 200 → 500 → 5000）
const WH_NO_STORE = ['item_dk_insignia','item_mastery_proof',   // 🚫 v3.2.17 舊項圈 id 已隨項圈系統移除
    'item_pride_pass_11','item_pride_pass_21','item_pride_pass_31','item_pride_pass_41','item_pride_pass_51','item_pride_pass_61','item_pride_pass_71','item_pride_pass_81','item_pride_pass_91',
    'item_dantes_letter','item_elf_whisper','item_ancient_book','item_sealed_intel','item_spy_report','item_chaos_key','item_royal_order','wpn_shaha_arrow',   // 🗑️ v3.5.87 移除 item_card_book/item_equip_book：收集冊本體已無取得管道且 DB 定義移除（ensureCardBook/ensureEquipBook 仍會濾除舊存檔殘留）；🐉 v3.7.56 移除 item_dragon_egg：幼龍蛋開放存倉
    // 🔥 v3.0.78 試煉接取制：所有試煉道具禁止存入倉庫（既有倉庫存量仍可取出）
    'new_item_196','new_item_198','new_item_206','new_item_144','new_item_208','item_nightvision','item_ancientkey',
    'new_item_204','new_item_205','new_item_203','new_item_214','new_item_212','new_item_240',
    'new_item_199','new_item_200','new_item_201','new_item_202','new_item_213','item_blueflute',
    'item_death_oath','item_orc_elder_head','item_yeti_head','item_fallen_key',
    'item_ant_fruit','item_ant_branch','item_ant_bark','item_elmore_heart','item_time_orb','item_wyvern_blood',
    'new_item_207','new_item_226','new_item_225','item_cyclops_blood','new_item_219','new_item_234',
    'item_demon_search','item_demon_spy','item_yeti_heart','item_soulfire_ash',
    'new_item_197','new_item_211','item_lost_soul','mat_flame_sword','mat_flame_eye','mat_flame_claw','mat_flame_heart'];   // 🚫 禁止存入倉庫（現行陣列內容）：死亡騎士之印記、精通之證、傲慢之塔傳送符(11~91F)、各村莊搜索狀/信件等劇情道具、沙哈之箭、🔥50級試煉任務道具＋全部試煉道具。
    //    （🗑️ 已不在此列：四種項圈＝v3.2.17 隨項圈系統移除、🎴卡片/裝備收集冊＝v3.5.87 移除 DB 定義、潘朵拉抽獎卷＝v3.5.49 隨舊抽獎機移除）
// 倉庫分類過濾（武器 / 防具 / 道具）：存入、取出共用同一個下拉清單
let _whFilter = 'weapon';
let _whQtyInput = '';   // 🔧 倉庫存取「數量」共用輸入（取代 prompt()；空字串或 0 ＝整疊全部）。以模組變數保存→面板每次重繪後數值不流失
let _whSearchInput = '';   // 🔎 倉庫搜尋暫態：2 字以上啟用跨分類模糊篩選，不寫入存檔
function _whQtyVal(){ let v = parseInt(_whQtyInput, 10); return (v > 0) ? v : 0; }   // 0 ＝全部
function whSetQty(v){ _whQtyInput = (v == null) ? '' : String(v); }   // 由輸入框 oninput 呼叫（用具名函式而非 inline 指派 lexical let，與 whSetFilter 同模式·穩定）
function _whEscAttr(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function _whStripHtml(s){ return String(s || '').replace(/<[^>]*>/g, ''); }
function _whSearchNorm(s){ return String(s || '').toLowerCase().replace(/[\s\u3000\-\_\/\\'"`~!@#$%^&*()[\]{}|:;,.，。！？、＋+=＝<>《》「」『』【】（）]/g, ''); }
function _whSearchActive(){ return _whSearchNorm(_whSearchInput).length >= 2; }
function _whFuzzyIncludes(hay, needle){
    if(!needle) return true;
    if(hay.indexOf(needle) >= 0) return true;
    let j = 0;
    for(let i = 0; i < hay.length && j < needle.length; i++) if(hay[i] === needle[j]) j++;
    return j >= needle.length;
}
function whMatchSearch(it){
    let q = _whSearchNorm(_whSearchInput);
    if(q.length < 2) return true;
    let d = DB.items[it.id] || {};
    let full = (typeof getItemFullName === 'function') ? _whStripHtml(getItemFullName(it)) : '';
    return _whFuzzyIncludes(_whSearchNorm([it.id, d.n || '', full].join(' ')), q);
}
// 🀄 v3.6.04 注音／中文輸入法（IME）組字保護。
//   問題：whSetSearch 會整塊重繪面板（innerHTML）→ 搜尋輸入框元素被換成新的。
//   Chrome 在 IME 組字期間也會持續發 input 事件，於是每打一個注音符號就把「IME 正在編輯的那個元素」
//   砍掉重建 → 組字階段被強制中斷，注音永遠拼不出完整中文字（英數是逐字直接送出，故看起來正常）。
//   修法：compositionstart~compositionend 之間只更新暫存值、不重繪；組字完成才套用並重繪。
let _whComposing = false;     // IME 組字進行中
let _whSearchDirty = false;   // 組字期間有輸入尚未套用
function whSearchCompStart(){ _whComposing = true; }
function whSearchCompEnd(v, pos){
    _whComposing = false;
    _whSearchInput = (v == null) ? '' : String(v);
    _whSearchDirty = true;
    // ⚠️ compositionend 與其後 input 事件的先後順序跨瀏覽器／輸入法不一致：
    //    input 在後（Chrome 現行）→ 由它渲染並清 dirty，此處的 timeout 就跳過；
    //    compositionend 在後（部分實作）→ input 當時 isComposing 仍為 true 沒渲染，改由此處補一次。
    //    setTimeout(0) 讓兩者都跑完再決定 → 保證「恰好渲染一次」，不重複也不遺漏。
    setTimeout(() => { if(_whSearchDirty) whSetSearch(_whSearchInput, pos); }, 0);
}
function whSetSearch(v, pos, ev){
    _whSearchInput = (v == null) ? '' : String(v);
    if(_whComposing || (ev && ev.isComposing)){ _whSearchDirty = true; return; }   // 組字中：只記錄不重繪（重繪＝砍掉 IME 的編輯目標）
    _whSearchDirty = false;
    renderWarehouseNPC(document.getElementById('interaction-content'));
    let el = document.getElementById('wh-search-input');
    if(el){
        el.focus();
        try { let p = Math.min((pos == null ? el.value.length : pos), el.value.length); el.setSelectionRange(p, p); } catch(e){}
    }
}
function whClearSearch(){ _whComposing = false; _whSearchDirty = false; whSetSearch('', 0); }   // 清除鈕：一併重置組字旗標，避免殘留 true 使後續不重繪
// ⚠️ composition 事件**沒有 inline handler 屬性**：HTML 規格的 GlobalEventHandlers 只涵蓋 oninput/onclick 那一批，
//    `oncompositionstart=""` / `oncompositionend=""` 寫在標籤上瀏覽器會直接忽略（實測 handler 從未執行）→ 只能 addEventListener。
//    又因面板每次重繪都會換掉輸入框元素，直接掛在元素上會隨重繪失效 → 改在 document 委派一次（composition 事件會冒泡），永久有效。
document.addEventListener('compositionstart', e => { if (e.target && e.target.id === 'wh-search-input') whSearchCompStart(); });
document.addEventListener('compositionend', e => { if (e.target && e.target.id === 'wh-search-input') whSearchCompEnd(e.target.value, e.target.selectionStart); });
function whCategory(id){
    let d = DB.items[id];
    if(!d) return 'item';
    if(d.type === 'wpn') return 'weapon';                       // 武器
    if(d.type === 'arm' || d.type === 'acc') return 'armor';    // 防具（含飾品）
    return 'item';                                              // 其餘皆道具
}
function whSetFilter(v){ _whFilter = v; _whSubFilter = ''; renderWarehouseNPC(document.getElementById('interaction-content')); }   // 切主分類→重置子分類為「全部」
// 🗄️ 倉庫「子分類」：武器/防具沿用裝備收集冊的圖鑑類型(equipCatKey/EQUIP_CATEGORIES)細分；道具分 卡片/技能/製作/任務/卷軸/其他。空字串 ''＝全部。
let _whSubFilter = '';
function whSetSubFilter(v){ _whSubFilter = v || ''; renderWarehouseNPC(document.getElementById('interaction-content')); }
// 製作材料 id 集合（掃所有配方的 req/mats·排除金幣）：用來把倉庫道具歸入「製作」子分類。延後到首次呼叫才建（確保 js/14 配方已載入）。
let _whCraftMatIds = null;
function _whBuildCraftMatIds(){
    _whCraftMatIds = {};
    let _scan = coll => { if(!coll) return; let groups = Array.isArray(coll) ? [coll] : Object.values(coll);
        for(let g of groups){ if(!Array.isArray(g)) continue; for(let r of g){ let ings = (r && (r.req || r.mats)) || []; for(let m of ings){ if(m && m.id && m.id !== 'gold') _whCraftMatIds[m.id] = true; } } } };
    try { _scan(typeof CRAFT_RECIPES !== 'undefined' && CRAFT_RECIPES); } catch(e){}
    try { _scan(typeof DEMONKING_RECIPES !== 'undefined' && DEMONKING_RECIPES); } catch(e){}
    try { _scan(typeof LUMIEL_RECIPES !== 'undefined' && LUMIEL_RECIPES); } catch(e){}
}
// 道具子分類判定：卡片(eff:'card')／技能書(skillbk)／卷軸(scroll)／任務(type:'quest' 或 quest_ 前綴)／製作(配方原料∪mat_前綴∪type:'etc' 材料)／其他(藥水/misc 消耗品等)
function whItemSubCat(id){
    let d = DB.items[id]; if(!d) return 'other';
    if(d.eff === 'card') return 'card';
    if(d.type === 'skillbk') return 'skill';
    if(d.type === 'scroll' || /^scroll_/.test(id)) return 'scroll';   // 🔧 強化卷軸(對武器/盔甲/飾品施法·scroll_weapon/armor/acc 及祝福/詛咒變體)無 type 欄位 → 以 id 前綴歸「卷軸」而非「其他」（純倉庫分類·不動 type 避免影響強化/useItem 派發）
    if(d.type === 'quest' || /^quest_/.test(id)) return 'quest';
    if(!_whCraftMatIds) _whBuildCraftMatIds();
    if(_whCraftMatIds[id] || /^mat_/.test(id) || d.type === 'etc') return 'craft';   // type:'etc' 幾乎全為製作材料(聖地遺物/黑血痕/黑魔法粉等)
    return 'other';
}
// 子分類下拉選項（依主分類動態給）：武器/防具用圖鑑類型；道具用自訂六類
function whSubCatOptions(){
    if(_whFilter === 'item') return [
        { key:'card', name:'卡片' }, { key:'skill', name:'技能' }, { key:'craft', name:'製作' },
        { key:'quest', name:'任務' }, { key:'scroll', name:'卷軸' }, { key:'other', name:'其他' }
    ];
    let grp = (_whFilter === 'weapon') ? ['武器'] : ['防具','飾品'];   // 防具主分類涵蓋圖鑑的「防具」+「飾品」部位
    let options = (typeof EQUIP_CATEGORIES !== 'undefined' ? EQUIP_CATEGORIES : []).filter(c => grp.indexOf(c.group) >= 0).map(c => ({ key:c.key, name:c.name }));
    if(_whFilter === 'armor' && !options.some(c => c.key === 'tshirt')) options.splice(2, 0, { key:'tshirt', name:'內衣' });   // 🔧 v2.6.77 倉庫防具子分類補「內衣」（EQUIP_CATEGORIES 無此鍵→手動插入·參考用戶 2667 修正版）
    return options;
}
// 倉庫物品是否符合「主分類＋子分類」：子分類空＝只看主分類
function whMatchFilter(id){
    if(whCategory(id) !== _whFilter) return false;
    if(!_whSubFilter) return true;
    if(_whFilter === 'item') return whItemSubCat(id) === _whSubFilter;
    if(_whFilter === 'armor' && _whSubFilter === 'tshirt') { let d = DB.items[id]; return !!(d && d.type === 'arm' && d.slot === 'tshirt'); }   // 🔧 v2.6.77 內衣子分類：依 slot 直接比對
    return (typeof equipCatKey === 'function') ? (equipCatKey(id, DB.items[id]) === _whSubFilter) : true;
}
// 倉庫數量只接受可無損解讀的資料；舊格式缺省 cnt=1，null/NaN 不可猜回原數量。
function _warehouseNumber(value, fallback, integer) {
    if (value === undefined) return fallback;
    if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim()))
        throw new Error('Invalid warehouse number');
    let n = Number(value);
    if (!Number.isFinite(n) || n < 0 || (integer && (!Number.isInteger(n) || n === 0))) throw new Error('Invalid warehouse number');
    return n;
}
function normalizeWarehouseData(w) {
    if (!w || typeof w !== 'object' || Array.isArray(w)) throw new Error('Invalid warehouse');
    let source = w.items === undefined ? [] : w.items;
    if (!Array.isArray(source)) throw new Error('Invalid warehouse items');
    let items = source.map(it => {
        if (!it || typeof it !== 'object' || Array.isArray(it) || typeof it.id !== 'string' || !it.id)
            throw new Error('Invalid warehouse item');
        return { ...it, cnt: _warehouseNumber(it.cnt, 1, true) };
    });
    return { ...w, items: items, gold: _warehouseNumber(w.gold, 0, false) };
}

// 快照綁定讀出的物件，避免其他唯讀呼叫覆蓋全域載入旗標後，對錯一筆交易。
// 寫入前比對解碼後內容，連同一 uid 的數量與金幣更新也不能被舊快照覆蓋。
// 此為衝突偵測與失敗回滾，不是跨分頁鎖；比對到寫入之間及兩個儲存鍵仍非原子操作。
let _whLoadOk = true;
let _whLoadUids = null;
const _whSnapshots = new WeakMap();
let _whLastSnapshot = null;
function _whParseTombs(raw) {
    if (raw == null) return {};
    let o = JSON.parse(raw);
    if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('Invalid warehouse tombstones');
    return o;
}
function _whTombsWrite(t){
    try {
        let ks = Object.keys(t);
        if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(k => delete t[k]);
        return _lzSet(whKey() + '_rm', JSON.stringify(t)) === true;
    } catch(e){ return false; }
}
function loadWarehouse(){
    _whLoadOk = true; _whLoadUids = null;
    let key = whKey();
    try {
        let value = _lzGetStrict(key), tombValue = _lzGetStrict(key + '_rm');
        let w = normalizeWarehouseData(value == null ? { items: [], gold: 0 } : JSON.parse(value));
        let tombs = _whParseTombs(tombValue);
        w.items = w.items.filter(it => !(it.uid != null && tombs[it.uid]));
        _whLoadUids = new Set(w.items.map(it => it.uid).filter(u => u != null));
        _whLastSnapshot = { ok: true, key: key, value: value, tombValue: tombValue, uids: _whLoadUids };
        _whSnapshots.set(w, _whLastSnapshot);
        return w;
    } catch(e){
        _whLoadOk = false;
        let w = { items: [], gold: 0 };
        _whLastSnapshot = { ok: false, key: key };
        _whSnapshots.set(w, _whLastSnapshot);
        return w;
    }
}
function saveWarehouse(w){
    let key = whKey();
    // 潘朵拉失敗回滾使用獨立深複本，並在回寫前重讀倉庫；此時沿用剛讀出的快照。
    let snapshot = (w && _whSnapshots.get(w)) || _whLastSnapshot;
    if(!snapshot || !snapshot.ok || snapshot.key !== key){
        try { let raw = _lsGetStrict(key); if(raw != null && _lsGetStrict(key + '_bak') == null) _lzSetStoredRaw(key + '_bak', raw); } catch(e){}
        if(typeof logSys === 'function') logSys('<span class="text-red-400 font-bold">⚠ 倉庫資料無法安全讀取，已暫停寫入。請先排除儲存問題再操作倉庫。</span>');
        return false;
    }
    try {
        let normalized = normalizeWarehouseData(w);
        let value = _lzGetStrict(key), tombValue = _lzGetStrict(key + '_rm');
        if(value !== snapshot.value || tombValue !== snapshot.tombValue){
            if(typeof logSys === 'function') logSys('<span class="text-amber-300">倉庫已由另一個操作更新，本次操作已取消；請重新操作。</span>');
            return false;
        }
        let beforeRaw = _lsGetStrict(key), beforeTombRaw = _lsGetStrict(key + '_rm');
        let tombs = _whParseTombs(tombValue), tombsChanged = false;
        let items = normalized.items.filter(it => {
            if (!(it.uid != null && tombs[it.uid])) return true;
            if (!snapshot.uids.has(it.uid)) { delete tombs[it.uid]; tombsChanged = true; return true; }
            return false;
        });
        let now = new Set(items.map(it => it.uid).filter(u => u != null));
        snapshot.uids.forEach(u => { if (!now.has(u)) { tombs[u] = 1; tombsChanged = true; } });
        let payload = JSON.stringify({ items: items, gold: normalized.gold });
        if (!_lzSet(key, payload)) return false;
        if (tombsChanged && !_whTombsWrite(tombs)) {
            // 主桶與墓碑是兩個鍵；墓碑失敗不得回報成功，否則存回物品會被舊墓碑隱藏。
            let restoreRaw = (restoreKey, raw) => {
                try {
                    if (raw == null) _lzRemoveStored(restoreKey);
                    else if (!_lzSetStoredRaw(restoreKey, raw)) return false;
                    return _lsGetStrict(restoreKey) === raw;
                } catch(e) { return false; }
            };
            let tombsRestored = restoreRaw(key + '_rm', beforeTombRaw);
            let restored = restoreRaw(key, beforeRaw);
            if ((!restored || !tombsRestored) && typeof logSys === 'function')
                logSys('<span class="text-red-400 font-bold">倉庫寫入及回復失敗，請停止操作並保留目前畫面。</span>');
            return false;
        }
        w.items = items; w.gold = normalized.gold;
        _whLoadOk = true; _whLoadUids = now;
        _whLastSnapshot = { ok: true, key: key, value: payload, tombValue: tombsChanged ? JSON.stringify(tombs) : tombValue, uids: now };
        _whSnapshots.set(w, _whLastSnapshot);
        try { if (typeof _lkInvalidateWhCache === 'function') _lkInvalidateWhCache(); } catch(e){}
        return true;
    } catch(e){ return false; }
}
// ===== 🎴🗡️ 共用收集圖鑑（卡片 cardDex／裝備 equipDex）：同模式角色共用，獨立於存檔位的 localStorage 鍵（概念同共用倉庫）=====
const CARDDEX_KEY = 'lineage_idle_carddex';
const EQUIPDEX_KEY = 'lineage_idle_equipdex';
const MISCDEX_KEY = 'lineage_idle_miscdex';   // 🧰 道具收集冊共用桶（同模式角色共用·布林聯集·見 js/18）
const RELICDEX_KEY = 'lineage_idle_relicdex';   // 🏺 遺物收集冊共用桶（同模式角色共用·布林聯集·見 js/21）
function _dexKey(base, p){ let _p = (p !== undefined) ? p : player; return base + modeSuffix(!!(_p && _p.classicMode), !!(_p && _p.traditionalMode)); }   // 🎮 一般/經典各自獨立桶（同 whKey 規則·見 modeSuffix）
function _readDex(base){ try { let s = _lzGet(_dexKey(base)); if (s) { let o = JSON.parse(s); if (o && typeof o === 'object') return o; } } catch(e){} return {}; }
// 🔄 多開同步：回寫前先讀桶現值並合併（卡片取較高分、_v:2＝積分制；裝備布林聯集），避免用本分頁快照覆蓋其他分頁的進度（lost-update）
function saveCardDex(){
    if (!player || !player.cardDex) return;
    try {
        let cur = _readDex(CARDDEX_KEY);
        let _mig = (typeof cardTierToScore === 'function') ? cardTierToScore : function(v){ return v || 0; };
        let _old = (cur && cur._v !== 2);   // 桶為舊階級制→遷移
        let out = { _v: 2 };
        for (let k in cur) { if (k === '_v') continue; out[k] = _old ? _mig(cur[k]) : (cur[k] || 0); }   // 桶現值（其他分頁可能剛寫入）
        for (let k in player.cardDex) { let v = player.cardDex[k] || 0; if (v > (out[k] || 0)) out[k] = v; }   // 取較高分（只增不減）
        _lzSet(_dexKey(CARDDEX_KEY), JSON.stringify(out));
    } catch(e){}
}
function saveEquipDex(){
    if (!player || !player.equipDex) return;
    try {
        let out = Object.assign({}, _readDex(EQUIPDEX_KEY));   // 桶現值（其他分頁可能剛寫入）
        for (let k in player.equipDex) if (player.equipDex[k]) out[k] = true;   // 布林聯集（只增不減）
        _lzSet(_dexKey(EQUIPDEX_KEY), JSON.stringify(out));
    } catch(e){}
}
function saveMiscDex(){   // 🧰 道具收集冊：布林聯集回寫共用桶（同 saveEquipDex）
    if (!player || !player.miscDex) return;
    try {
        let out = Object.assign({}, _readDex(MISCDEX_KEY));
        for (let k in player.miscDex) if (player.miscDex[k]) out[k] = true;
        _lzSet(_dexKey(MISCDEX_KEY), JSON.stringify(out));
    } catch(e){}
}
function saveRelicDex(){   // 🏺 遺物收集冊：布林聯集回寫共用桶（同 saveEquipDex）
    if (!player || !player.relicDex) return;
    try {
        let out = Object.assign({}, _readDex(RELICDEX_KEY));
        for (let k in player.relicDex) if (player.relicDex[k]) out[k] = true;
        _lzSet(_dexKey(RELICDEX_KEY), JSON.stringify(out));
    } catch(e){}
}
// 🏛️ v3.0.83 傳統模式取消：一次性把舊傳統桶併入對應模式桶（一般+傳統 '_tradonly'→一般 ''、經典+傳統 '_trad'→'_classic'）。
//   倉庫：items 以 uid 去重串接（重跑不重複）＋gold 相加；圖鑑：卡片取較高分、裝備/道具布林聯集（天然冪等）。
//   安全網（比照 saveWarehouse 拒寫政策）：來源桶解不開→原樣保留不刪不覆蓋；目標桶存在卻解不開→跳過該對，來源桶保留待修復後重試；併入寫入成功才移除來源桶。
//   於 DOMContentLoaded 執行（全 js 已載入→cardTierToScore 可用；早於任何讀檔/創角的桶存取）。
function _mergeTradBuckets(){
    let PAIRS = [['_tradonly', ''], ['_trad', '_classic']];
    let _read = key => {   // {miss:true}=不存在、{bad:true}=存在但解不開、{obj}=解碼成功
        let raw; try { raw = _lsGet(key); } catch(e){ return { bad: true }; }
        if (raw == null) return { miss: true };
        try { let s = _lzGet(key); if (s == null || s === '') return { bad: true }; return { obj: JSON.parse(s) }; } catch(e){ return { bad: true }; }
    };
    for (let pair of PAIRS) {
        let src = pair[0], dst = pair[1];
        // ① 倉庫桶：items uid 去重串接＋gold 相加
        let sw = _read(WH_KEY + src);
        if (sw.obj) {
            let dw = _read(WH_KEY + dst);
            if (!dw.bad) {
                let d = dw.obj || { items: [], gold: 0 };
                let items = d.items || [];
                let have = new Set(items.map(it => it && it.uid).filter(u => u != null));
                (sw.obj.items || []).forEach(it => { if (it && !(it.uid != null && have.has(it.uid))) items.push(it); });
                if (_lzSet(WH_KEY + dst, JSON.stringify({ items: items, gold: (d.gold || 0) + (sw.obj.gold || 0) }))) _lsRemove(WH_KEY + src);
            }
        }
        // ② 圖鑑桶：卡片取較高分（含 _v:2 積分制遷移）、裝備/道具布林聯集
        for (let base of [CARDDEX_KEY, EQUIPDEX_KEY, MISCDEX_KEY, RELICDEX_KEY]) {
            let sd = _read(base + src);
            if (!sd.obj) continue;
            let dd = _read(base + dst);
            if (dd.bad) continue;
            let out = dd.obj || {};
            if (base === CARDDEX_KEY) {
                let _mig = (typeof cardTierToScore === 'function') ? cardTierToScore : function(v){ return v || 0; };
                let sOld = (sd.obj._v !== 2), dOld = (out._v !== 2);
                let merged = { _v: 2 };
                for (let k in out) { if (k === '_v') continue; merged[k] = dOld ? _mig(out[k]) : (out[k] || 0); }
                for (let k in sd.obj) { if (k === '_v') continue; let v = sOld ? _mig(sd.obj[k]) : (sd.obj[k] || 0); if (v > (merged[k] || 0)) merged[k] = v; }
                out = merged;
            } else {
                out = Object.assign({}, out);
                for (let k in sd.obj) if (sd.obj[k]) out[k] = true;
            }
            if (_lzSet(base + dst, JSON.stringify(out))) _lsRemove(base + src);
        }
    }
}
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('DOMContentLoaded', function(){ try { _mergeTradBuckets(); } catch(e){} });
// 讀檔／創角時呼叫：把共用桶併進 player.cardDex/equipDex（卡片取較高分·裝備取聯集·只增不減），並回寫共用桶（種子化＋遷移舊存檔 per-character 資料·不丟失）
function loadSharedCollections(){
    if (!player) return;
    let shRaw = _readDex(CARDDEX_KEY), shEquip = _readDex(EQUIPDEX_KEY), shMisc = _readDex(MISCDEX_KEY), shRelic = _readDex(RELICDEX_KEY);
    // 🎴 卡片積分制遷移（一次性）：舊階級(1/2/3)→積分(1/10/100)。共用桶以 _v 標記、玩家存檔以 cardDexV 標記。
    let _mig = (typeof cardTierToScore === 'function') ? cardTierToScore : function(v){ return v || 0; };
    let _bucketOld = (shRaw && shRaw._v !== 2);
    let shCard = {};
    for (let k in shRaw) { if (k === '_v') continue; shCard[k] = _bucketOld ? _mig(shRaw[k]) : shRaw[k]; }
    if (player.cardDex && player.cardDexV !== 2) { for (let k in player.cardDex) player.cardDex[k] = _mig(player.cardDex[k]); player.cardDexV = 2; }
    let mC = Object.assign({}, shCard), pc = player.cardDex || {};
    for (let k in pc) if ((pc[k] || 0) > (mC[k] || 0)) mC[k] = pc[k];   // 🎴 卡片：取較高分（只增不減）
    player.cardDex = mC;
    player.equipDex = Object.assign({}, shEquip, player.equipDex || {});   // 🗡️ 裝備：布林聯集
    player.miscDex = Object.assign({}, shMisc, player.miscDex || {});      // 🧰 道具：布林聯集
    player.relicDex = Object.assign({}, shRelic, player.relicDex || {});   // 🏺 遺物：布林聯集
    saveCardDex(); saveEquipDex(); saveMiscDex(); saveRelicDex();
}
// 🔄 多開同步：把「同模式」共用桶併回本分頁 player.cardDex/equipDex（只增不減）；回傳是否有變更。不回寫桶（避免分頁間 ping-pong）。which: 'card'|'equip'|undefined(兩者)
function mergeSharedIntoPlayer(which){
    if (!player) return false;
    let changed = false;
    if (which !== 'equip' && which !== 'misc' && which !== 'relic') {
        if (!player.cardDex) player.cardDex = {};
        let cur = _readDex(CARDDEX_KEY), _old = (cur && cur._v !== 2);
        let _mig = (typeof cardTierToScore === 'function') ? cardTierToScore : function(v){ return v || 0; };
        for (let k in cur) { if (k === '_v') continue; let v = _old ? _mig(cur[k]) : (cur[k] || 0); if (v > (player.cardDex[k] || 0)) { player.cardDex[k] = v; changed = true; } }
    }
    if (which !== 'card' && which !== 'misc' && which !== 'relic') {
        if (!player.equipDex) player.equipDex = {};
        let cur = _readDex(EQUIPDEX_KEY);
        for (let k in cur) if (cur[k] && !player.equipDex[k]) { player.equipDex[k] = true; changed = true; }
    }
    if (which !== 'card' && which !== 'equip' && which !== 'relic') {   // 🧰 道具：'misc' 或 undefined(全併) 時併入
        if (!player.miscDex) player.miscDex = {};
        let cur = _readDex(MISCDEX_KEY);
        for (let k in cur) if (cur[k] && !player.miscDex[k]) { player.miscDex[k] = true; changed = true; }
    }
    if (which !== 'card' && which !== 'equip' && which !== 'misc') {   // 🏺 遺物：'relic' 或 undefined(全併) 時併入
        if (!player.relicDex) player.relicDex = {};
        let cur = _readDex(RELICDEX_KEY);
        for (let k in cur) if (cur[k] && !player.relicDex[k]) { player.relicDex[k] = true; changed = true; }
    }
    return changed;
}
function _refreshAfterDexSync(){
    if (typeof calcStats === 'function') calcStats();   // 重算地區完成加成並刷新角色面板（calcStats=recompute+updateUI）
    // ⚠️ 不呼叫 renderTabs：dex 不在 renderTabs._sig 簽章內、分頁內容不因 dex 改變；且 renderTabs(true) 會繞過 _tabPointerDown 延後保護→外部 storage 事件若落在玩家按住分頁鈕時會把按鈕重繪掉而吃掉點擊
    if (typeof _cardBookOpen !== 'undefined' && _cardBookOpen && typeof renderCardBook === 'function') renderCardBook();
    if (typeof _equipBookOpen !== 'undefined' && _equipBookOpen && typeof renderEquipBook === 'function') renderEquipBook();
    if (typeof _miscBookOpen !== 'undefined' && _miscBookOpen && typeof renderMiscBook === 'function') renderMiscBook();   // 🧰 道具收集冊開啟中→同步重繪
    if (typeof _relicBookOpen !== 'undefined' && _relicBookOpen && typeof renderRelicBook === 'function') renderRelicBook();   // 🏺 遺物收集冊開啟中→同步重繪
}
// storage 事件：其他分頁更新了「同模式」桶 → 立即併回並刷新（一般/經典_classic 各自獨立，互不同步）。
//  ⚠️ file:// 跨分頁不保證觸發 storage 事件→另在 openCardBook/openEquipBook 開頭 re-merge 作兜底。
function _syncSharedFromStorage(ev){
    if (!ev || !player || !player.cls) return;   // player 在標題/載入畫面是 cls:null 的 stub（js/01 createBase 前）→尚未開始遊戲，不對空 player 跑 merge/recompute/render
    let ck = _dexKey(CARDDEX_KEY), ek = _dexKey(EQUIPDEX_KEY), mk = _dexKey(MISCDEX_KEY), rk = _dexKey(RELICDEX_KEY);
    if (ev.key !== ck && ev.key !== ek && ev.key !== mk && ev.key !== rk) return;
    if (mergeSharedIntoPlayer(ev.key === ck ? 'card' : (ev.key === ek ? 'equip' : (ev.key === rk ? 'relic' : 'misc')))) _refreshAfterDexSync();
}
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('storage', _syncSharedFromStorage);
// 🔧 架構#3：統一簽章比對。
// 🔒 v3.6.92 改為「可併入鎖定堆疊」（與背包端 gainItem 同口徑·用戶拍板「再次獲得直接合併同一格」）：
//    同簽章永遠只有一格，任一方鎖定→合併後整疊鎖定（旗標傳遞統一走 _whStackAbsorb）。
// ⚠️ 巨靈願望戒指(gw)每只的三個願望各自獨立，而 itemSig 不含 gw → 必須顯式排除，
//    否則存入/取出會把兩只不同願望的戒指併成一疊、其中一份願望資料就此消失。
function _whStackFind(arr, it){ return (!it.gw) ? arr.find(x => !x.gw && sameItemSig(x, it)) : null; }
function _whStackAbsorb(stack, src, n){
    let amount = _warehouseNumber(n === undefined && src ? src.cnt : n, 1, true);
    let total = _warehouseNumber(stack.cnt, 1, true) + amount;
    if (!Number.isFinite(total) || !Number.isInteger(total)) throw new Error('Invalid warehouse stack total');
    stack.cnt = total;
    if(src && src.lock){ stack.lock = true; stack.junk = false; }
}   // 缺省數量與數字字串皆先正規化；合併時保護狀態只會擴散。
// 🗑️ 自動販賣暫態旗標不屬於倉庫（那是每次背包工作階段的狀態）。存入與取出都清掉，否則
//    帶著早已過期 junkSince 的物品一回到背包就會被下一次 10 秒掃描直接賣掉＝零寬限期。
//    取出時一併清，可順便治好既有存檔中已經帶著舊旗標躺在倉庫裡的物品。
function _whClearJunkState(it){ if(it){ delete it.junk; delete it.junkSince; delete it._autoSellQty; delete it._ruleJunk; } return it; }
// 物品完整簽章：名字(id)+強化值(en)+詞綴(祝福/遠古/屬性)；一鍵存入用來比對「完全相同」
function whSig(it){ return itemSig(it); }   // 🔧 架構#3：委派給單一事實來源 itemSig
// 倉庫與角色是兩個獨立儲存桶。每次轉移先保存角色，再保存倉庫；任一步失敗就還原記憶體中的背包/金幣，
// 避免角色存檔失敗但倉庫成功寫入後，重新整理造成物品複製。
function whTxnSnapshot(){ return { inv: JSON.parse(JSON.stringify(player.inv || [])), gold: player.gold || 0 }; }
function whTxnRestore(s){ if(!s) return; player.inv = s.inv; player.gold = s.gold; }
function whTxnCommit(w, snap){
    if(typeof saveGame !== 'function' || !saveGame()) {
        whTxnRestore(snap);
        // ⚠️ v3.5.92 saveGame() 回 false ≠「什麼都沒寫」：js/13 saveGame 是「角色存檔先 _lzSet 落地 → 再寫寵物名冊」，
        //    petRosterSave 失敗（寵物上限回滾／配額寫不進 _bak／桶毀損）會讓整個 saveGame 回 false，
        //    但此時磁碟上的角色存檔已經是「存入物品已扣除」的狀態，而倉庫（下方 saveWarehouse）根本還沒跑。
        //    只還原記憶體不補存 → 玩家在下次自動存檔前重新整理，那件物品背包與倉庫兩邊都不在＝真實遺失。
        //    比照下方 saveWarehouse 失敗分支：還原後補存一次，把磁碟拉回交易前狀態。
        let restored = (typeof saveGame === 'function') && saveGame();
        if(typeof logSys === 'function') logSys('<span class="text-red-400 font-bold">倉庫操作取消：角色進度無法安全儲存，物品與金幣已' + (restored ? '還原' : '在記憶體中還原，請勿繼續操作並重新整理') + '。</span>');
        return false;
    }
    if(!saveWarehouse(w)) {
        whTxnRestore(snap);
        let restored = (typeof saveGame === 'function') && saveGame();
        if(typeof logSys === 'function') logSys('<span class="text-red-400 font-bold">倉庫操作失敗：倉庫無法寫入，角色物品已' + (restored ? '還原' : '在記憶體中還原，請勿繼續操作並重新整理') + '。</span>');
        return false;
    }
    return true;
}
// 一鍵存入：背包中「與倉庫現有物品 詞綴+名字+強化值 完全相同」者自動存入（鎖定物品保護、不可存物品略過）
function whOneClickDeposit(){
    // 🏦 縱深守衛：倉庫只能在安全區使用（浮動視窗曾可被帶進狩獵區；closeNpcInteraction 已補關閉，這裡再擋一層）
    if (typeof mapState === 'undefined' || !mapState.current || !String(mapState.current).startsWith('town_')) { if (typeof logSys === 'function') logSys('<span class="text-red-400">離開安全區後無法使用倉庫。</span>'); return; }
    let w = loadWarehouse();
    let _txn = whTxnSnapshot();
    let whSigs = new Set(w.items.map(whSig));   // 倉庫現有物品簽章集合
    let deposited = 0, full = false;
    for(let it of player.inv.slice()){          // 用副本走訪，過程會改動 player.inv
        if(WH_NO_STORE.includes(it.id)) continue;   // 不可存入
        if(it.lock) continue;                        // 鎖定物品保護，不自動存入
        if(!whSigs.has(whSig(it))) continue;         // 倉庫沒有完全相同的 → 跳過
        let idx = player.inv.findIndex(i => i.uid === it.uid);
        if(idx < 0) continue;
        let cur = player.inv[idx];
        let stack = _whStackFind(w.items, cur);
        if(!stack && w.items.length >= WH_MAX){ full = true; break; }
        if(stack){ _whStackAbsorb(stack, cur, cur.cnt); } else { w.items.push(_whClearJunkState(cur)); whSigs.add(whSig(cur)); }
        player.inv.splice(idx, 1);
        deposited++;
    }
    if(!whTxnCommit(w, _txn)){ renderTabs(true); updateUI(); renderWarehouseNPC(document.getElementById('interaction-content')); return; }
    renderTabs(true); updateUI();
    renderWarehouseNPC(document.getElementById('interaction-content'));
    if(deposited > 0) logSys(`<span class="text-cyan-300 font-bold">一鍵存入：已存入 ${deposited} 項與倉庫現有物品相同的物品${full ? '（倉庫已滿，部分未存入）' : ''}。</span>`);
    else logSys(full ? `<span class="text-red-400">倉庫已滿，無法存入。</span>` : `背包中沒有與倉庫現有物品完全相同的可存入物品。`);
}
// 🔧 倉庫一鍵排列：規則與背包「一鍵排列」完全相同（共用 invSortCmp）
function sortWarehouse(){
    let w = loadWarehouse();
    if(!w.items.length){ logSys('<span class="text-slate-400">倉庫沒有物品可排列。</span>'); return; }
    w.items.sort(invSortCmp);
    if(!saveWarehouse(w)) return;
    logSys('<span class="text-cyan-300 font-bold">倉庫已重新排列。</span>');
    let el = document.getElementById('interaction-content'); if(el) renderWarehouseNPC(el);
}
function whDeposit(uidv, qty){
    // 🏦 縱深守衛：倉庫只能在安全區使用（浮動視窗曾可被帶進狩獵區；closeNpcInteraction 已補關閉，這裡再擋一層）
    if (typeof mapState === 'undefined' || !mapState.current || !String(mapState.current).startsWith('town_')) { if (typeof logSys === 'function') logSys('<span class="text-red-400">離開安全區後無法使用倉庫。</span>'); return; }
    let w = loadWarehouse();
    let _txn = whTxnSnapshot();
    let idx = player.inv.findIndex(i => i.uid === uidv);
    if(idx < 0) return;
    let it = player.inv[idx];
    if(WH_NO_STORE.includes(it.id)){ logSys(`<span class="text-red-400">此物品無法存入倉庫。</span>`); return; }
    if(it.lock){ logSys(`<span class="text-red-400">鎖定物品需先解鎖才能存入倉庫。</span>`); return; }
    // 🔧 複數物品可選數量：改讀面板「數量」輸入框（取代 prompt）；輸入空或 0 ＝整疊全部
    let total = it.cnt || 1;
    if(qty === undefined){ let _q = _whQtyVal(); qty = (_q > 0) ? _q : total; }
    qty = Math.max(1, Math.min(total, qty || total));
    // 可堆疊(en0未鎖)合併進既有倉庫堆疊不佔新格；否則需有空格
    let stack = _whStackFind(w.items, it);
    if(!stack && w.items.length >= WH_MAX){ logSys(`<span class="text-red-400">倉庫已滿（上限 ${WH_MAX} 格）。</span>`); return; }
    if(qty >= total){          // 全部存入
        if(stack) _whStackAbsorb(stack, it, total); else w.items.push(_whClearJunkState(it));
        player.inv.splice(idx, 1);
    } else {                   // 部分存入：背包留下剩餘
        if(stack) _whStackAbsorb(stack, it, qty); else w.items.push(_whClearJunkState({ ...it, uid: uid(), cnt: qty }));
        it.cnt = total - qty;
    }
    if(!whTxnCommit(w, _txn)){ renderTabs(true); updateUI(); renderWarehouseNPC(document.getElementById('interaction-content')); return; }
    renderTabs(true); updateUI();
    renderWarehouseNPC(document.getElementById('interaction-content'));
}
function whWithdraw(uidv, qty){
    // 🏦 縱深守衛：倉庫只能在安全區使用（浮動視窗曾可被帶進狩獵區；closeNpcInteraction 已補關閉，這裡再擋一層）
    if (typeof mapState === 'undefined' || !mapState.current || !String(mapState.current).startsWith('town_')) { if (typeof logSys === 'function') logSys('<span class="text-red-400">離開安全區後無法使用倉庫。</span>'); return; }
    let w = loadWarehouse();
    let _txn = whTxnSnapshot();
    let idx = w.items.findIndex(i => i.uid === uidv);
    if(idx < 0) return;
    let it = w.items[idx];
    // 🔧 複數物品可選數量：改讀面板「數量」輸入框（取代 prompt·避免手機/GitHub Pages/重複操作時跳出框失效→變成只能一個一個領）；輸入空或 0 ＝整疊全部
    let total = it.cnt || 1;
    if(qty === undefined){ let _q = _whQtyVal(); qty = (_q > 0) ? _q : total; }
    qty = Math.max(1, Math.min(total, qty || total));
    if(qty >= total){          // 全部取出
        w.items.splice(idx, 1);
        if(!it.uid || player.inv.some(x => x.uid === it.uid)) it.uid = uid();
        _whClearJunkState(it);
        let stack = _whStackFind(player.inv, it);
        if(stack) _whStackAbsorb(stack, it, total); else player.inv.push(it);
    } else {                   // 部分取出：倉庫留下剩餘
        it.cnt = total - qty;
        let moved = _whClearJunkState({ ...it, uid: uid(), cnt: qty });
        let stack = _whStackFind(player.inv, moved);
        if(stack) _whStackAbsorb(stack, moved, qty); else player.inv.push(moved);
    }
    if(!whTxnCommit(w, _txn)){ renderTabs(true); updateUI(); renderWarehouseNPC(document.getElementById('interaction-content')); return; }
    // 🗡️🧰 收集冊：只有角色與倉庫都成功寫入後才登錄，避免失敗交易留下未實際取得的圖鑑進度。
    if (typeof registerEquipObtained === 'function') registerEquipObtained(it.id);
    if (typeof registerMiscObtained === 'function') registerMiscObtained(it.id);
    if (typeof registerRelicObtained === 'function') registerRelicObtained(it.id);
    renderTabs(true); updateUI();
    renderWarehouseNPC(document.getElementById('interaction-content'));
}
function whGold(dir){
    // 🏦 縱深守衛：倉庫只能在安全區使用（浮動視窗曾可被帶進狩獵區；closeNpcInteraction 已補關閉，這裡再擋一層）
    if (typeof mapState === 'undefined' || !mapState.current || !String(mapState.current).startsWith('town_')) { if (typeof logSys === 'function') logSys('<span class="text-red-400">離開安全區後無法使用倉庫。</span>'); return; }
    let amt = parseInt(document.getElementById('wh-gold-amt').value) || 0;
    if(amt <= 0) return;
    let w = loadWarehouse();
    let _txn = whTxnSnapshot();
    if(dir === 'in'){ amt = Math.min(amt, player.gold); player.gold -= amt; w.gold = (w.gold||0) + amt; }
    else { amt = Math.min(amt, w.gold||0); w.gold -= amt; player.gold += amt; }
    if(!whTxnCommit(w, _txn)){ updateUI(); renderWarehouseNPC(document.getElementById('interaction-content')); return; }
    updateUI();
    renderWarehouseNPC(document.getElementById('interaction-content'));
}
function renderWarehouseNPC(div){
    if (typeof warehouseWindowIsOpen === 'function' && warehouseWindowIsOpen()) { let floating = document.getElementById('warehouse-window-content'); if (floating) div = floating; }
    if (!div) return;
    _activePanel = null;   // 倉庫不需自動刷新
    let w = loadWarehouse();
    let mkBtn = (it, act) => `<button onclick="${act}('${it.uid}')" data-tip-uid="${it.uid}" data-tip-src="${act === 'whWithdraw' ? 'wh' : 'inv'}" class="tip-host btn w-full text-left py-1.5 px-2 text-sm bg-slate-800 hover:bg-slate-700 border-slate-600">${getItemFullName(it)}</button>`;
    let _searching = _whSearchActive();
    let _invItems = player.inv.filter(it => !it.lock && (_searching ? whMatchSearch(it) : whMatchFilter(it.id)));   // 🔒 鎖定物品不顯示於倉庫存放清單（用戶要求：鎖定物品存放時不顯示）
    let _whItems  = w.items.filter(it => _searching ? whMatchSearch(it) : whMatchFilter(it.id));
    let invHtml = _invItems.length ? _invItems.map(it => WH_NO_STORE.includes(it.id)
        ? `<div data-tip-uid="${it.uid}" data-tip-src="inv" class="tip-host w-full text-left py-1.5 px-2 text-sm bg-slate-900/60 border border-slate-700 rounded opacity-50 cursor-not-allowed">${getItemFullName(it)} <span class="text-xs text-red-400">（不可存）</span></div>`
        : mkBtn(it, 'whDeposit')).join('') : `<div class="text-slate-500 text-sm text-center py-4">${_searching ? '背包沒有符合搜尋的物品' : '此分類背包沒有物品'}</div>`;
    let whHtml  = _whItems.length ? _whItems.map(it => mkBtn(it, 'whWithdraw')).join('') : `<div class="text-slate-500 text-sm text-center py-4">${_searching ? '倉庫沒有符合搜尋的物品' : '此分類倉庫是空的'}</div>`;
    let _oi = document.getElementById('wh-inv-list'), _os = document.getElementById('wh-store-list');
    let _whInvScroll = _oi ? _oi.scrollTop : 0, _whStoreScroll = _os ? _os.scrollTop : 0, _divScroll = div.scrollTop;
    div.innerHTML = `
    <div class="flex flex-col gap-3 p-1">
        <div class="text-slate-300 text-sm leading-relaxed">將物品或金幣存入倉庫，<b class="text-amber-300">四個存檔角色共用</b>。點背包物品＝存入；點倉庫物品＝取出（依下方<b class="text-amber-300">數量</b>欄取出／存入；留空＝整疊全部）。已裝備或鎖定中的物品無法存入（需先解鎖）。</div>
        <div class="flex items-center gap-2 bg-slate-800/60 border border-slate-600 rounded p-3 text-sm flex-wrap">
            <span>金幣　背包：<span class="text-yellow-400 font-bold">${player.gold}</span>　倉庫：<span class="text-yellow-400 font-bold">${w.gold||0}</span></span>
            <input id="wh-gold-amt" type="number" min="1" value="1000" class="w-24 bg-slate-900 border border-slate-600 text-center text-white rounded h-8 ms-auto">
            <button onclick="whGold('in')" class="btn px-4 text-sm font-bold h-8 inline-flex items-center justify-center" style="background: linear-gradient(135deg, #0c4a5e 0%, #0e7490 28%, #0a3d4d 52%, #11657e 76%, #093440 100%); color: #a5f3fc; border-color: #0891b2;">存入 ▶</button>
            <button onclick="whGold('out')" class="btn px-4 text-sm font-bold h-8 inline-flex items-center justify-center" style="background: linear-gradient(135deg, #6b2a10 0%, #b3490e 28%, #5a230e 52%, #9a3e0c 76%, #4a1d0c 100%); color: #fed7aa; border-color: #c2410c;">◀ 取出</button>
        </div>
        <div class="flex items-center gap-2 text-sm flex-wrap">
            <span class="text-slate-300 font-bold">物品分類：</span>
            <select onchange="whSetFilter(this.value)" class="bg-slate-900 border border-slate-600 text-white rounded py-1 px-2 text-sm">
                <option value="weapon" ${_whFilter==='weapon'?'selected':''}>武器</option>
                <option value="armor" ${_whFilter==='armor'?'selected':''}>防具</option>
                <option value="item" ${_whFilter==='item'?'selected':''}>道具</option>
            </select>
            <select onchange="whSetSubFilter(this.value)" class="bg-slate-900 border border-slate-600 text-white rounded py-1 px-2 text-sm" title="細分類：武器/防具依圖鑑類型，道具分卡片/技能/製作/任務/卷軸/其他">
                <option value="">全部</option>
                ${whSubCatOptions().map(o => `<option value="${o.key}" ${_whSubFilter===o.key?'selected':''}>${o.name}</option>`).join('')}
            </select>
            <span class="text-slate-500 text-xs">（存入／取出共用此分類）</span>
            <span class="text-slate-300 font-bold ms-2">搜尋：</span>
            <input id="wh-search-input" type="search" placeholder="輸入 2 字以上" value="${_whEscAttr(_whSearchInput)}" oninput="whSetSearch(this.value, this.selectionStart, event)" title="輸入 2 字以上時，跨分類模糊搜尋背包與倉庫物品（支援注音等中文輸入法）" class="w-44 bg-slate-900 border border-slate-600 text-white rounded h-8 px-2">
            ${_whSearchInput ? '<button onclick="whClearSearch()" class="btn px-3 text-xs font-bold h-8 inline-flex items-center justify-center" title="清除搜尋">清除</button>' : ''}
            <span class="text-slate-300 font-bold ms-2">數量：</span>
            <input id="wh-qty-amt" type="number" min="1" placeholder="全部" value="${_whQtyInput}" oninput="whSetQty(this.value)" title="存入／取出的數量；留空或 0 ＝整疊全部（不再使用跳出式輸入框）" class="w-20 bg-slate-900 border border-slate-600 text-center text-white rounded h-8">
            <button onclick="whOneClickDeposit()" class="btn px-4 text-sm font-bold h-8 inline-flex items-center justify-center ms-auto" style="background: linear-gradient(135deg, #0c4a5e 0%, #0e7490 28%, #0a3d4d 52%, #11657e 76%, #093440 100%); color: #a5f3fc; border-color: #0891b2;" title="把背包中與倉庫現有物品（詞綴+名字+強化值完全相同）的物品自動存入；鎖定物品不動">一鍵存入</button>
            <button onclick="sortWarehouse()" class="btn px-4 text-sm font-bold h-8 inline-flex items-center justify-center" style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 28%, #16294a 52%, #1d4ed8 76%, #101f38 100%); color: #bfdbfe; border-color: #3b82f6;" title="依背包一鍵排列的相同規則整理倉庫物品">一鍵排列</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col min-h-0">
                <div class="font-bold text-cyan-300 mb-1 text-sm">背包（點擊存入 ▶）</div>
                <div class="flex flex-col gap-1 overflow-y-auto pr-1" id="wh-inv-list" style="max-height:340px">${invHtml}</div>
            </div>
            <div class="flex flex-col min-h-0">
                <div class="font-bold text-amber-300 mb-1 text-sm flex justify-between">倉庫（點擊取出 ◀）<span class="text-slate-400 font-normal">${w.items.length}/${WH_MAX}</span></div>
                <div class="flex flex-col gap-1 overflow-y-auto pr-1" id="wh-store-list" style="max-height:340px">${whHtml}</div>
            </div>
        </div>
    </div>`;
    div.scrollTop = _divScroll;
    let _ni = document.getElementById('wh-inv-list'); if(_ni) _ni.scrollTop = _whInvScroll;
    let _ns = document.getElementById('wh-store-list'); if(_ns) _ns.scrollTop = _whStoreScroll;
}
// 🚫 v3.2.17 舊「包武項圈保管」(PET_STORAGE_MAX=8/petStoreDeposit/petStoreWithdraw/renderPetStorageNPC) 已隨項圈系統移除——
// 新寵物保管（上限＝PET_STORAGE_MAX·同模式共通·出戰/鎖定/放生/進化）＝js/22-pets.js 的 renderPetStorageNPC（同名接手·js/11 路由不變）。
// ===== 血盟 NPC：由玩家創立的盟主提供攻城入口 =====
function renderPledgeNPC(div, faction) {
    _activePanel = null;
    let info = (typeof clanGetModeInfo === 'function') ? clanGetModeInfo(player) : null;
    if (!info || info.faction !== faction || (typeof clanCanSiege === 'function' && !clanCanSiege(player))) {
        div.innerHTML = '<div class="p-4 text-amber-200 font-bold">你尚未加入血盟，或此模式沒有創立血盟的王族。</div>';
        return;
    }
    if (typeof openSiegeSelect === 'function') openSiegeSelect(faction, div);
}

// ===== 試煉兌換鈕（全寬單鈕）=====
// 🗑️ v3.5.94 「席琳兌換」管線正式退役：sherineCall 第三參數移除。
//    v3.1.68 起套裝詞綴不再附加於裝備（改由 8 格席琳遺骸欄承載·NPC 伊奧兌換／菈克希絲拆分），
//    綠鈕早已不產生、trialRun 的 sherine 分支也同批刪除，留著參數只會讓維護者誤以為管線還活著。
//    席琳結晶仍有用途：可於本檔向 NPC 伊奧兌換席琳遺骸。
//    （函式名沿用 sherineExBtns 以免動到各兌換介面的既有呼叫點；語意＝單顆全寬兌換鈕。）
function sherineExBtns(label, normalCall) {
    return `<div class="flex gap-2 w-full">
        <button class="btn flex-1 bg-blue-800 py-3 text-base font-bold" onclick="${normalCall}">兌換：${label}</button>
    </div>`;
}
// 🗑️ v3.5.83 移除 sherineExCheck()／sherineExGain()：兩者零呼叫點（同上，v3.1.68 席琳兌換管線已廢）。

// ===== 🔧 試煉兌換數量：可一次兌換多個（共用 UI＋核心）=====
//  trialQtyBar()：數量選擇器（−/＋/全部，id=trial-qty），各試煉的兌換按鈕前放一次。
//  trialRun(reqs, rewardId)：扣材料×qty、發獎勵×qty；qty 取「輸入值」與「可負擔上限」較小者。回傳實際次數。
function trialQtyBar() {
    return `<div class="flex items-center justify-center gap-2 mb-3">
        <span class="text-slate-400 text-sm">兌換數量</span>
        <button class="btn px-3 py-1 text-base font-bold bg-slate-700 border-slate-500" onclick="trialQtyAdj(-1)">−</button>
        <input id="trial-qty" type="number" min="1" value="1" class="w-16 bg-slate-900 border border-slate-600 text-white text-center rounded py-1" oninput="if((parseInt(this.value)||0)<1)this.value=1">
        <button class="btn px-3 py-1 text-base font-bold bg-slate-700 border-slate-500" onclick="trialQtyAdj(1)">＋</button>
        <button class="btn px-3 py-1 text-sm font-bold bg-amber-800 border-amber-600 text-amber-100" onclick="document.getElementById('trial-qty').value=999" title="設為最大；兌換時自動以可負擔上限為準">全部</button>
    </div>`;
}
function trialQtyAdj(d) { let el = document.getElementById('trial-qty'); if (!el) return; el.value = Math.max(1, (parseInt(el.value) || 1) + d); }
function trialQtyVal() { let el = document.getElementById('trial-qty'); let v = el ? parseInt(el.value) : 1; return (!v || v < 1) ? 1 : v; }
// 🗑️ v3.5.94 第三參數 sherine 移除：原本函式一進來就 sherine=false，扣結晶＋_forceSherineSet 兩個分支永遠跑不到
//    （席琳詞綴 v3.1.68 起改由遺骸系統承載·gainItem 也已不讀 _forceSherineSet）→ 整段連同參數一併刪除，
//    避免維護者照著這段死碼推論「席琳兌換還在運作」。既有呼叫點多傳的引數 JS 會自動忽略，無相容性問題。
function trialRun(reqs, rewardId) {
    let norm = reqs.map(r => Array.isArray(r) ? r : [r, 1]);
    let maxN = Math.min.apply(null, norm.map(p => Math.floor(questCountId(p[0]) / (p[1] || 1))));
    if (!isFinite(maxN)) maxN = 0;
    let qty = Math.min(trialQtyVal(), Math.max(0, maxN));
    if (qty < 1) { logSys('<span class="text-red-400 font-bold">材料不足，無法兌換。</span>'); return 0; }
    norm.forEach(p => questConsumeId(p[0], (p[1] || 1) * qty));   // 🔧 背包優先扣除，不足扣共用倉庫
    let _savedTrad = _tradLootCtx; _tradLootCtx = true;   // 🏛️ 傳統模式：試煉／任務「兌換」物品比照製作／掉落，裝備隨機自帶強化值（2026-06 用戶更正：原誤設 +0；非傳統模式由 gainItem 的 traditionalActive() 閘恆 +0）
    try {
        for (let i = 0; i < qty; i++) {
            gainItem(rewardId, 1, false, false);   // forceNormal=false：詞綴機率同一般兌換
        }
    } finally { _tradLootCtx = _savedTrad; }
    return qty;
}
function trialExName(n, rewardId) { return `${DB.items[rewardId].n}${n > 1 ? ` ×${n}` : ''}`; }

// ===== 🦴 v3.1.68 席琳遺骸 NPC（席琳神殿）=====
// 伊奧：席琳結晶 1 顆 → 兌換指定部位遺骸（8 選 1·必附隨機一種席琳詞綴·committed lootRng 防 SL 重抽）
// 版型比照「製作」(renderUniversalCraft js/14)：左＝遺骸圖示＋名稱＋兌換材料(craftReqHtml)，右＝數量輸入＋兌換鈕。
function renderIoExchange(div) {
    let html = `<div class="text-slate-300 text-sm mb-1 px-1">伊奧：「席琳的力量凝於遺骸之中。獻上結晶，選擇你要的部位吧——至於它承載哪一種祝福，由席琳決定。」</div>
        <div class="text-slate-400 text-xs mb-3 px-1">每件消耗 <span class="c-sherine font-bold">席琳結晶 ×1</span>（背包優先，不足扣共用倉庫）。兌換出的遺骸必附<span class="c-sherine">隨機一種席琳套裝詞綴</span>；集齊相同套裝名的遺骸（裝備欄底部 8 格）即可發動套裝效果。</div>`;
    SHERINE_REMAINS.forEach(r => {
        let d = DB.items[r.id];
        let reqHtml = craftReqHtml([{ id: 'sherine_crystal', cnt: 1 }]);   // 🔧 共用製作的需求列（顏色/數量/含倉庫存量判定一致）
        html += `
        <div class="list-item bg-slate-800 rounded mb-2 border border-slate-700 p-3 hover:bg-slate-700 transition-colors" style="display:flex !important; justify-content:space-between !important; align-items:center !important; width:100% !important; box-sizing:border-box !important;">
            <div class="flex items-center gap-4 min-w-0 flex-1">
                <div class="w-12 h-12 bg-slate-900 rounded border border-slate-600 flex items-center justify-center shrink-0">
                    <img src="${getIconUrl(d)}" onerror="this.style.display='none';" class="w-10 h-10 object-contain pointer-events-none">
                </div>
                <div class="flex flex-col items-start gap-1.5">
                    <span class="c-sherine font-bold text-lg leading-none truncate">${d.n}</span>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-slate-400 text-sm">兌換材料：</span>${reqHtml}
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <input type="number" min="1" value="1" id="io-qty-${r.id}" onclick="event.stopPropagation()" class="w-14 px-1 py-2 bg-slate-900 border border-slate-600 rounded text-center text-white font-bold">
                <button class="btn bg-green-900 hover:bg-green-800 border-green-600 py-2 px-6 font-bold shadow" onclick="doIoExchange('${r.id}')"><span class="c-sherine">兌換</span></button>
            </div>
        </div>`;
    });
    div.innerHTML = `<div class="p-2">${html}</div>`;
}
function doIoExchange(remId) {
    if (!SHERINE_REMAINS.some(r => r.id === remId)) return;
    let qtyInput = document.getElementById(`io-qty-${remId}`);
    let qty = Math.max(1, parseInt(qtyInput && qtyInput.value) || 1);
    let have = questCountId('sherine_crystal');   // 🔧 含共用倉庫
    if (have < 1) { logSys('<span class="text-red-400 font-bold">材料不足，無法兌換。</span><span class="text-red-300">（尚缺：席琳結晶 1）</span>'); return; }
    let n = Math.min(qty, have);   // 結晶不足時自動以持有量為上限（比照製作 makeCount）
    let tally = {};
    for (let i = 0; i < n; i++) {
        questConsumeId('sherine_crystal', 1);   // 🔧 背包優先，不足扣共用倉庫
        let _g = SHERINE_EFFECTS[Math.floor(lootRng('ioaff') * SHERINE_EFFECTS.length)];   // 🎲 committed RNG：兌換當下逐件擲定詞綴（防存讀檔重抽）
        gainSherineRemains(remId, _g, true);   // silent：改由下方彙總一行
        tally[_g] = (tally[_g] || 0) + 1;
    }
    let parts = Object.keys(tally).map(g => `<span class="c-sherine font-bold">${g}${DB.items[remId].n}</span>${tally[g] > 1 ? ` ×${tally[g]}` : ''}`);
    logSys(`<span class="c-sherine font-bold">✦ 伊奧的兌換</span>：${parts.join('、')}（消耗 席琳結晶 ×${n}）`);
    saveGame();
    let _c = document.getElementById('interaction-content'); if (_c) renderIoExchange(_c);   // 就地重渲染（更新結晶持有數，可連續兌換）
}
// 菈克希絲：把「身上穿著、帶席琳詞綴」的裝備拆分＝裝備保留其他詞綴/強化值（僅席琳詞綴消失）＋獲得同詞綴的對應部位遺骸。
//   部位映射＝SHERINE_REMAINS.eqSlot（武器→之爪…盔甲→之鱗）；⚔️ 戰士副手武器欄(offwpn)視同武器→之爪。
function renderLachesisSplit(div) {
    let html = `<div class="p-4">
        <div class="text-slate-300 text-sm mb-1">菈克希絲：「命運的絲線纏在你的裝備上……讓我為你解開。裝備還是那件裝備，席琳的祝福則化為遺骸歸你。」</div>
        <div class="text-slate-400 text-xs mb-3">拆分「身上穿著」帶<span class="c-sherine">席琳套裝詞綴</span>的裝備：裝備保留強化值與其他詞綴（僅席琳詞綴消失），並獲得<span class="c-sherine">相同詞綴</span>的對應部位遺骸（如 +12 魔女 祝福的 闊劍 → +12 祝福的闊劍＋魔女之爪）。</div>`;
    let _rows = '';
    let _slots = SHERINE_REMAINS.map(r => ({ slot: r.eqSlot, remId: r.id, remN: r.n })).concat([{ slot: 'offwpn', remId: 'rem_claw', remN: '之爪' }]);
    _slots.forEach(m => {
        let e = player.eq && player.eq[m.slot];
        if (!e || !e.seteff) return;
        let _g = e.seteff.slice(0, 2);
        _rows += `<div class="flex items-center gap-2 mb-2">
            <span class="flex-1 ${getItemColor(e)} font-bold text-sm">${getItemFullName(e)}</span>
            <button class="btn bg-purple-900 hover:bg-purple-800 border-purple-600 py-2 px-4 text-sm font-bold" onclick="doLachesisSplit('${m.slot}')">拆分 → <span class="c-sherine">${_g}${m.remN}</span></button>
        </div>`;
    });
    html += _rows || `<div class="text-slate-500 text-sm py-6 text-center">你身上沒有穿著帶席琳套裝詞綴的裝備。</div>`;
    html += `</div>`;
    div.innerHTML = html;
}
function doLachesisSplit(slotKey) {
    let e = player.eq && player.eq[slotKey];
    if (!e || !e.seteff) return;
    let _map = (slotKey === 'offwpn') ? SHERINE_REMAINS.find(r => r.eqSlot === 'wpn') : SHERINE_REMAINS.find(r => r.eqSlot === slotKey);
    if (!_map) return;   // 非映射部位（理論上不會發生：清單只列映射欄位）
    let _g = e.seteff.slice(0, 2);
    e.seteff = false;   // 僅席琳詞綴消失：強化值(en)/祝福(bless)/古代(anc)/屬性(attr) 全保留·裝備維持穿著
    gainSherineRemains(_map.id, _g, true);
    logSys(`<span class="c-sherine font-bold">✦ 菈克希絲拆下了裝備上的席琳詞綴：獲得 ${_g}${_map.n}！</span>`);
    calcStats(); renderTabs(true); saveGame();
    let _c = document.getElementById('interaction-content'); if (_c) renderLachesisSplit(_c);   // 就地重渲染（清單更新，可連續拆分）
}

// ===== 🔥 v3.0.78 試煉接取制（15/30/45 級）：須達等級向 NPC 接取 → 試煉道具才開始掉落（100%·達需求即停·禁倉庫）→ 一次性完成領「全部」獎勵 =====
//   狀態：player.trialQ[key] = 0/undefined 未接取、1 進行中、2 已完成（完成後無法再接取、道具不再掉落）。
//   掉落閘＝js/01 trialDropBlocked → trialItemActive；100% 掉落＝js/05 掉落迴圈 trialForced100。
const TRIAL_Q = {
    knight15:   { cls:'knight',   lv:15, npc:'瑞奇',         reqs:[['new_item_196',1],['new_item_198',1],['new_item_206',1]], rewards:['arm_53'] },
    knight30:   { cls:'knight',   lv:30, npc:'甘特',         reqs:[['new_item_144',1],['new_item_208',1]], rewards:['wpn_redknight','shd_redknight'] },
    knight45:   { cls:'knight',   lv:45, npc:'馬沙',         reqs:[['item_nightvision',1],['item_ancientkey',1]], rewards:['acc_134'] },
    mage15:     { cls:'mage',     lv:15, npc:'詹姆',         reqs:[['new_item_204',1],['new_item_205',1],['new_item_203',1]], rewards:['arm_115'] },
    mage30:     { cls:'mage',     lv:30, npc:'塔拉斯',       reqs:[['new_item_214',1],['new_item_212',1]], rewards:['wpn_crystalwand'] },
    mage45:     { cls:'mage',     lv:45, npc:'塔拉斯',       reqs:[['new_item_240',1]], rewards:['wpn_manawand','arm_89'] },
    elf15:      { cls:'elf',      lv:15, npc:'歐斯',         reqs:[['new_item_199',1],['new_item_200',1],['new_item_201',1],['new_item_202',1]], rewards:['arm_50','arm_51'] },
    elf30:      { cls:'elf',      lv:30, npc:'迷幻森林之母', reqs:[['new_item_213',1]], rewards:['bk_elf_summon','arm_85'] },
    elf45:      { cls:'elf',      lv:45, npc:'馬沙',         reqs:[['item_blueflute',1],['item_ancientkey',1]], rewards:['arm_102','bk_elf_summon2'] },   // 🔧 v3.1.23 修：原 acc_guardian/bk_elf_wisdom 從未定義→整個馬沙介面崩潰。還原參考版正確獎勵＝保護者手套(arm_102)＋精靈水晶(召喚強力屬性精靈)(bk_elf_summon2)
    dark15:     { cls:'dark',     lv:30, npc:'倫得',         reqs:[['item_death_oath',1]], rewards:['arm_shadowglove'] },   // 🔁 v3.1.39 需求等級與 dark30 交換（15→30·NPC倫得/獎勵暗影手套/需求死亡誓約不變）
    dark30:     { cls:'dark',     lv:15, npc:'康',           reqs:[['item_orc_elder_head',1]], rewards:['arm_shadowmask'] },   // 🔁 v3.1.39 需求等級與 dark15 交換（30→15·NPC康/獎勵暗影面具/需求妖魔長老之首不變）
    dark45:     { cls:'dark',     lv:45, npc:'布魯迪卡',     reqs:[['item_yeti_head',1]], rewards:['arm_shadowboots'] },
    illusion15: { cls:'illusion', lv:15, npc:'希蓮恩',       reqs:[['item_ant_fruit',1],['item_ant_branch',1],['item_ant_bark',1]], rewards:['wpn_illu_wand','mem_cube_burn'] },
    illusion30: { cls:'illusion', lv:30, npc:'希蓮恩',       reqs:[['item_elmore_heart',1]], rewards:['shd_illu_book','mem_cube_shock'] },
    illusion45: { cls:'illusion', lv:45, npc:'希蓮恩',       reqs:[['item_time_orb',1]], rewards:['clk_illu'] },
    warrior15:  { cls:'warrior',  lv:15, npc:'多文',         reqs:[['new_item_207',1]], rewards:['wpn_warrior_trial_axe','bk_warrior_dualaxe'] },
    warrior30:  { cls:'warrior',  lv:30, npc:'多文',         reqs:[['new_item_226',1],['new_item_225',1]], rewards:['clk_warrior_corps','bk_warrior_roar'] },
    warrior45:  { cls:'warrior',  lv:45, npc:'多文',         reqs:[['item_cyclops_blood',1]], rewards:['hlm_warrior_corps'] },
    dragon15:   { cls:'dragon',   lv:15, npc:'普洛凱爾',     reqs:[['item_demon_search',3]], rewards:['wpn_dragon_2h','bk_dragon_armor'] },
    dragon30:   { cls:'dragon',   lv:30, npc:'普洛凱爾',     reqs:[['item_demon_spy',1]], rewards:['armguard_dragonscale','bk_dragon_bloodlust'] },
    dragon45:   { cls:'dragon',   lv:45, npc:'普洛凱爾',     reqs:[['item_yeti_heart',10]], rewards:['clk_dragon'] },
    royal15:    { cls:'royal',    lv:15, npc:'甘特',         reqs:[['new_item_197',1]], rewards:['clk_royal_red','bk_royal_precise'] },
    royal30:    { cls:'royal',    lv:30, npc:'甘特',         reqs:[['new_item_211',1]], rewards:['clk_royal_majesty','bk_royal_callally'] },
    royal45:    { cls:'royal',    lv:45, npc:'馬沙',         reqs:[['item_lost_soul',1]], rewards:['acc_royal_guard'] },
};
const TRIAL_ITEM_Q = {};   // 試煉道具 id → 所屬試煉 key 陣列（古代鑰匙＝knight45+elf45 共用）
Object.keys(TRIAL_Q).forEach(k => TRIAL_Q[k].reqs.forEach(p => { (TRIAL_ITEM_Q[p[0]] = TRIAL_ITEM_Q[p[0]] || []).push(k); }));
// 50級試煉道具狀態閘（stage=指定收集階段道具／ex=最終兌換材料·need 預設 1）；時空裂痕碎片為通用素材不管制
const TRIAL50_ITEM = {
    new_item_219:      { cls:'warrior',  stage:1, need:5 },
    new_item_234:      { cls:'warrior',  ex:1 },
    item_soulfire_ash: { cls:'dragon',   ex:1 },
    item_wyvern_blood: { cls:'illusion', ex:1, need:5 },
    mat_flame_sword:   { cls:'knight',   ex:1 },
    mat_flame_claw:    { cls:'elf',      ex:1 },
    mat_flame_eye:     { cls:'mage',     ex:1 },
    mat_flame_heart:   { cls:'royal',    ex:1 },
    item_fallen_key:   { cls:'dark',     ex:1 }
};
function trialQState(key) { return (player && player.trialQ && player.trialQ[key]) || 0; }
function trialQStateFor(owner, key) { return (owner && owner.trialQ && owner.trialQ[key]) || 0; }
// 隊員快照也需要用同一套試煉判定；assignedOnly=true 時只認隊長存檔內分配給該隊員的進度帳。
function questCountForOwner(owner, id, pending, assignedOnly) {
    if (!owner) return 0;
    if (assignedOnly) return Math.max(0, Math.floor(Number(pending) || 0));
    let inv = (owner.inv || []).filter(i => i && i.id === id && !i.lock).reduce((s, i) => s + (i.cnt || 0), 0);
    let wh = 0;
    try {
        if (typeof whCountId === 'function' && typeof player !== 'undefined' && player
            && !!owner.classicMode === !!player.classicMode && !!owner.traditionalMode === !!player.traditionalMode) wh = whCountId(id);
    } catch (e) {}
    return inv + wh + Math.max(0, Math.floor(Number(pending) || 0));
}
// 主玩家沿用「背包實際持有」口徑；隊員則只看隊長端分配進度，避免來源角色背包阻擋掉落。
function trialStageItemHeldActiveFor(owner, id, pending, assignedOnly) {
    if (!owner) return false;
    let cfg = (typeof TRIAL_50_CFG !== 'undefined') && TRIAL_50_CFG[owner.cls];
    let st = Math.floor(Number(owner.trialStage) || 0);
    let stage = cfg && st >= 1 && st <= cfg.stages.length ? cfg.stages[st - 1] : null;
    if (!stage || stage.id !== id) return false;
    let held = assignedOnly ? 0 : (owner.inv || []).filter(i => i && i.id === id).reduce((s, i) => s + (i.cnt || 0), 0);
    return held + Math.max(0, Math.floor(Number(pending) || 0)) < (stage.cnt || 1);
}
// 試煉道具目前是否「可取得」：主玩家看持有量；隊員看隊長端分配進度。
function trialItemActiveFor(owner, id, pending, assignedOnly) {
    if (!owner) return false;
    let ks = TRIAL_ITEM_Q[id];
    if (ks) return ks.some(k => {
        let c = TRIAL_Q[k];
        if (owner.cls !== c.cls || trialQStateFor(owner, k) !== 1) return false;
        let r = c.reqs.find(p => p[0] === id);
        return questCountForOwner(owner, id, pending, assignedOnly) < r[1];
    });
    let t = TRIAL50_ITEM[id];
    if (t) {
        if (owner.cls !== t.cls) return false;
        let cfg = (typeof TRIAL_50_CFG !== 'undefined') && TRIAL_50_CFG[owner.cls]; if (!cfg) return false;
        let st = owner.trialStage || 0, n = t.need || 1;
        if (t.ex) return st === cfg.stages.length + 1 && questCountForOwner(owner, id, pending, assignedOnly) < n;   // 最終兌換階段（未完成·未達量）
        return st === t.stage && questCountForOwner(owner, id, pending, assignedOnly) < n;                             // 指定收集階段
    }
    return true;   // 非管制道具
}
function trialItemActive(id) { return trialItemActiveFor(player, id, 0); }
function trialForced100(id) { return !!(TRIAL_ITEM_Q[id] || TRIAL50_ITEM[id]); }   // 管制試煉道具通過閘門後 100% 掉落
function _trialRerender(rr) { let _c = document.getElementById('interaction-content'); let f = rr && window[rr]; if (_c && typeof f === 'function') f(_c); else closeNpcInteraction(); }
// 產生單一試煉區塊 HTML（rr＝重繪函式名）
function trialQHTML(key, rr) {
    let c = TRIAL_Q[key]; if (!c || player.cls !== c.cls) return '';
    let st = trialQState(key);
    let h = `<div class="mb-2 p-3 bg-slate-800/60 rounded border border-slate-700"><div class="text-amber-300 font-bold text-sm">⚔️ ${c.lv} 級試煉</div>`;
    if (st === 2) return h + `<div class="text-emerald-400 text-sm mt-1">✅ 已完成（每個角色僅能完成一次）。</div></div>`;
    if ((player.lv || 1) < c.lv) return h + `<div class="text-red-400 text-sm mt-1">需要等級 ${c.lv} 以上才能接取此試煉。</div></div>`;
    if (st === 0) {
        h += `<div class="text-xs text-slate-400 mt-1 mb-2">接取後才會開始掉落：${c.reqs.map(p => `<b class="text-amber-200">${DB.items[p[0]].n}</b>×${p[1]}`).join('、')}（擊殺指定怪物 100% 掉落·無法存入倉庫·達需求數量即停止掉落）</div>`;
        h += `<div class="text-xs text-slate-400 mb-2">完成獎勵（全數獲得）：${c.rewards.map(id => `<b class="text-sky-300">${DB.items[id].n}</b>`).join('＋')}</div>`;
        return h + `<button class="btn bg-amber-800 hover:bg-amber-700 py-2 px-4 font-bold" onclick="trialQAccept('${key}','${rr}')">接取試煉任務</button></div>`;
    }
    let ok = c.reqs.every(p => questCountId(p[0]) >= p[1]);
    h += `<div class="text-xs text-slate-400 mt-1 mb-2">收集進度：${c.reqs.map(p => { let hv = questCountId(p[0]), _lk = lockedCountId(p[0]); return `<b class="${hv >= p[1] ? 'text-emerald-300' : 'text-amber-200'}">${DB.items[p[0]].n}</b> ${Math.min(hv, p[1])}/${p[1]}${(hv < p[1] && _lk > 0) ? `<span class="text-slate-500">（另 ${_lk} 個已上鎖不計）</span>` : ''}`; }).join('、')}</div>`;   // 🔒 v3.5.87 鎖定件不列入交付口徑·但要明講差額原因（防「鎖住任務道具→試煉看似卡死」）
    h += `<div class="text-xs text-slate-400 mb-2">完成獎勵（全數獲得）：${c.rewards.map(id => `<b class="text-sky-300">${DB.items[id].n}</b>`).join('＋')}</div>`;
    if (!ok) return h + `<div class="text-red-400 text-xs">尚未備齊。${c.reqs.some(p => questCountId(p[0]) < p[1] && lockedCountId(p[0]) > 0) ? '<span class="text-slate-400">（有道具已上鎖·解鎖後才會列入計數）</span>' : ''}</div></div>`;
    h += `<div class="flex flex-wrap gap-2"><button class="btn bg-emerald-800 hover:bg-emerald-700 py-2 px-4 font-bold" onclick="trialQComplete('${key}','${rr}')">完成試煉（獲得全部獎勵）</button>`;
    // 🚫 v3.2.16 用戶明令移除：試煉「席琳完成」選項（耗結晶必附套裝詞綴）——結晶用途回歸伊奧兌換/席琳製作等非試煉管道
    return h + `</div></div>`;
}
function trialQAccept(key, rr) {
    let c = TRIAL_Q[key];
    if (!c || player.cls !== c.cls || (player.lv || 1) < c.lv || trialQState(key) !== 0) return;
    if (typeof currentRoleIsMercenary === 'function' && currentRoleIsMercenary()) { logSys('<span class="text-amber-300">此角色正在擔任傭兵，請由隊長在傭兵公會接取試煉。</span>'); return; }
    if (!player.trialQ || typeof player.trialQ !== 'object') player.trialQ = {};
    player.trialQ[key] = 1;
    logSys(`<span class="text-amber-300 font-bold">${c.npc}：試煉開始！</span>去收集 ${c.reqs.map(p => DB.items[p[0]].n + '×' + p[1]).join('、')}（擊殺指定怪物必定掉落）。`);
    saveGame(); _trialRerender(rr);
}
function trialQComplete(key, rr) {   // 🚫 v3.2.16 移除席琳完成：原第 3 參 sherine（耗結晶必附套裝詞綴）廢止
    let c = TRIAL_Q[key];
    if (!c || player.cls !== c.cls || trialQState(key) !== 1) return;
    if (typeof currentRoleIsMercenary === 'function' && currentRoleIsMercenary()) { logSys('<span class="text-amber-300">此角色正在擔任傭兵，請由隊長在傭兵公會交付試煉道具並領取獎勵。</span>'); return; }
    if (!c.reqs.every(p => questCountId(p[0]) >= p[1])) { logSys('試煉道具尚未備齊。' + (typeof lockHintHtml === 'function' ? lockHintHtml(c.reqs.map(p => p[0])) : '')); return; }   // 🔒 v3.5.87 差額若在鎖定件·明講
    c.reqs.forEach(p => questConsumeId(p[0], p[1]));
    let _sv = _tradLootCtx; _tradLootCtx = true;   // 🏛️ 傳統模式：試煉獎勵裝備隨機自帶強化值
    try {
        c.rewards.forEach(id => { gainItem(id, 1, false, false); });
    } finally { _tradLootCtx = _sv; }
    player.trialQ[key] = 2;
    logSys(`<span class="c-legend font-bold">${c.npc}：試煉通過！</span><span class="text-amber-200">你獲得了 ${c.rewards.map(id => DB.items[id].n).join('、')}。（此試煉已完成，無法再次接取）</span>`);
    saveGame(); renderTabs(); _trialRerender(rr);
}

function renderRickyQuest(div) {
    if (player.cls !== 'knight') { div.innerHTML = `<div class="p-6 text-red-400">瑞奇：這是專屬於騎士的榮耀試煉，請回吧。</div>`; return; }
    div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🛡️ 瑞奇的試煉</div>` + trialQHTML('knight15', 'renderRickyQuest') + `</div>`;
}
function renderJamesQuest(div) {
    if (player.cls !== 'mage') { div.innerHTML = `<div class="p-6 text-red-400">詹姆：這是不死族的黑暗試煉，只有法師能夠參與。</div>`; return; }
    div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🔮 詹姆的試煉</div>` + trialQHTML('mage15', 'renderJamesQuest') + `</div>`;
}

// ===== 🛡️ 尤麗婭（說話之島）：以歐林的日記本兌換臂甲（三選一，每件消耗 1 本）=====
const YURIA_REWARDS = [
    { id: 'armguard_con',      nm: '體力臂甲' },
    { id: 'armguard_guardian', nm: '守護者臂甲' },
    { id: 'armguard_mage',     nm: '法師臂甲' }
];
// 👹 尤麗婭第二兌換：以 黑暗哈汀的日記本 六選一兌換 隱藏的魔族武器（每件消耗 1 本）
const YURIA_HATIN_REWARDS = [
    { id: 'wpn_demon_sword_hidden', nm: '隱藏的魔族之劍' },
    { id: 'wpn_demon_bow_hidden',   nm: '隱藏的魔族弓箭' },
    { id: 'wpn_demon_wand_hidden',  nm: '隱藏的魔族魔杖' },
    { id: 'wpn_demon_claw_hidden',  nm: '隱藏的魔族鋼爪' },
    { id: 'wpn_demon_chain_hidden', nm: '隱藏的魔族鎖鏈劍' },
    { id: 'wpn_demon_qigu_hidden',  nm: '隱藏的魔族奇古獸' }
];
function renderYuriaQuest(div) {
    let have = questCountId('item_olin_diary');
    let html = `<div class="p-4 text-slate-300 leading-relaxed">尤麗婭：帶來<b class="text-amber-300">歐林的日記本</b>，我便為你打造一件臂甲（裝於<b class="text-amber-300">副手</b>，可與雙手武器並用）。<br>持有歐林的日記本：<b class="${have >= 1 ? 'text-green-400' : 'text-red-400'}">${have}</b><br><span class="text-slate-400 text-sm">每件消耗 1 本，三選一。</span></div>`;   // 🗑️ v3.5.87 移除「席琳兌換」宣傳字串：v3.1.68 起裝備不再附席琳詞綴·sherineExBtns 也早已不產生該按鈕（假承諾）
    if (have >= 1 || questCountId('item_hatin_diary') >= 1) html += `<div class="px-4 pt-2 pb-0">${trialQtyBar()}</div>`;   // 🔧 共用兌換數量列（歐林臂甲＋哈汀魔族武器兩兌換共用 trial-qty）
    if (have >= 1) {
        html += `<div class="grid grid-cols-1 gap-3 p-4">`;
        YURIA_REWARDS.forEach(r => { html += sherineExBtns(`${r.nm}（需 歐林的日記本 ×1）`, `doYuriaExchange('${r.id}')`); });   // 🗑️ v3.5.94 席琳兌換鈕與參數已退役（套裝效果改由席琳遺骸承載）
        html += `</div>`;
    } else {
        html += `<div class="px-4 pb-4 text-red-400 text-sm">你沒有歐林的日記本。</div>`;
    }
    // 👹 第二兌換：黑暗哈汀的日記本 → 隱藏的魔族武器（六選一）
    let have2 = questCountId('item_hatin_diary');
    html += `<div class="p-4 pt-2 text-slate-300 leading-relaxed border-t border-slate-700/60">尤麗婭：你身上那本<b class="text-purple-300">黑暗哈汀的日記本</b>……裡頭的禁咒，我能據以打造一件<b class="text-purple-300">隱藏的魔族武器</b>。<br>持有黑暗哈汀的日記本：<b class="${have2 >= 1 ? 'text-green-400' : 'text-red-400'}">${have2}</b><br><span class="text-slate-400 text-sm">每件消耗 1 本，六選一。</span></div>`;   // 🗑️ v3.5.87 移除「席琳兌換」宣傳字串（同上·功能已不存在）
    if (have2 >= 1) {
        html += `<div class="grid grid-cols-1 gap-3 p-4 pt-0">`;
        YURIA_HATIN_REWARDS.forEach(r => { html += sherineExBtns(r.nm, `doYuriaHatinExchange('${r.id}')`); });   // 🗑️ v3.5.94 席琳兌換鈕與參數已退役（同上）
        html += `</div>`;
    } else {
        html += `<div class="px-4 pb-4 text-red-400 text-sm">你沒有黑暗哈汀的日記本（可由 惡靈／魔物封印室 的 哈汀之影 取得）。</div>`;
    }
    div.innerHTML = html;
}
function doYuriaExchange(rewardId) {   // 🗑️ v3.5.94 原第 2 參 sherine 移除（席琳兌換管線 v3.1.68 已廢·套裝效果改由席琳遺骸承載）
    if (!YURIA_REWARDS.some(r => r.id === rewardId)) return;
    let n = trialRun(['item_olin_diary'], rewardId);   // 🔧 可選數量批量兌換
    if (!n) return;
    saveGame();
    logSys(`<span class="text-amber-200">尤麗婭：拿去吧，這是你的 <b>${trialExName(n, rewardId)}</b>。</span>`);
    renderTabs();
    let _c = document.getElementById('interaction-content'); if (_c) renderYuriaQuest(_c);   // 🔮 就地重渲染（更新日記本持有數，可連續兌換）
}

// 🏴‍☠️ 希米哲（海賊島村莊）：兒子的信＋兒子的遺骸＋兒子的肖像畫 各 1 → 藍海賊裝備五選一（無兌換次數限制·可用 trialQtyBar 批量兌換）
//  ⚠️ 本兌換無「席琳兌換」分支：套裝效果自 v3.1.68 起改由席琳遺骸承載，兌換一律產出一般裝備；
//     sherineExGain 已於 v3.5.83 刪除、shimizheEx／sherineExBtns 的 sherine 參數已於 v3.5.94 移除；
//     傳統模式亦已取消（traditionalActive() 恆 false），故無自帶強化值一說。
const SHIMIZHE_COST = [['item_son_letter', 1], ['item_son_remains', 1], ['item_son_portrait', 1]];
const SHIMIZHE_REWARDS = ['arm_bluepirate_helm', 'arm_bluepirate_boots', 'arm_bluepirate_gloves', 'arm_bluepirate_armor', 'arm_bluepirate_cloak'];
function _shimizheCostHtml() {
    return SHIMIZHE_COST.map(([id, cnt]) => `${DB.items[id].n}×${cnt}（持有 ${questCountId(id)}）`).join('、');
}
function _shimizheEnough() { return SHIMIZHE_COST.every(([id, cnt]) => questCountId(id) >= cnt); }
function renderShimizheExchange(div) {
    let ok = _shimizheEnough();
    let h = `<div class="p-4 text-slate-300 leading-relaxed">希米哲：若你尋回我兒子的遺物，我便將他生前的藍海賊裝備擇一贈予你，聊表謝意。<br><span class="text-slate-400 text-sm">每次兌換消耗 ${_shimizheCostHtml()}（五選一・無次數限制）</span>`;
    h += `</div>`;   // 🗑️ v3.5.87 移除「席琳兌換」宣傳字串（功能已不存在·結晶用途＝向伊奧兌換席琳遺骸）
    if (ok) {
        h += `<div class="px-4 pt-0 pb-1">${trialQtyBar()}</div>`;   // 🔧 共用兌換數量列
        h += `<div class="grid grid-cols-1 gap-3 p-4 pt-0">`;
        SHIMIZHE_REWARDS.forEach(id => { h += sherineExBtns(DB.items[id].n, `shimizheEx('${id}')`); });   // 🗑️ v3.5.94 席琳兌換鈕與參數已退役
        h += `</div>`;
    } else {
        h += `<div class="px-4 pb-4 text-red-400 text-sm">尚未備齊三件遺物（兒子的信、兒子的遺骸、兒子的肖像畫）。</div>`;
    }
    div.innerHTML = h;
}
function shimizheEx(rewardId) {   // 🗑️ v3.5.94 原第 2 參 sherine 移除（席琳兌換管線已廢）
    if (SHIMIZHE_REWARDS.indexOf(rewardId) === -1) return;
    let n = trialRun(SHIMIZHE_COST, rewardId);   // 🔧 可選數量批量兌換
    if (!n) return;
    logSys(`<span class="text-amber-200">希米哲：謝謝你……這是 ${trialExName(n, rewardId)}，就交給你了。</span>`);
    saveGame(); renderTabs();
    let _c = document.getElementById('interaction-content'); if (_c) renderShimizheExchange(_c);
}

function doYuriaHatinExchange(rewardId) {   // 🗑️ v3.5.94 原第 2 參 sherine 移除（席琳兌換管線已廢）
    if (!YURIA_HATIN_REWARDS.some(r => r.id === rewardId)) return;
    let n = trialRun(['item_hatin_diary'], rewardId);   // 🔧 可選數量批量兌換
    if (!n) return;
    saveGame();
    logSys(`<span class="text-fuchsia-200">尤麗婭：成了……這是你的 <b>${trialExName(n, rewardId)}</b>，小心別讓它反噬了你。</span>`);
    renderTabs();
    let _c = document.getElementById('interaction-content'); if (_c) renderYuriaQuest(_c);   // 🔮 就地重渲染（更新日記本持有數，可連續兌換）
}

// ===== 雷德的復仇（全職業）：集齊魔法寶石×100＋五枚部下證明戒指，兌換召喚控制戒指 =====
const RED_QUEST_REQS = [
    ['new_item_150', 100],
    ['quest_ring_darkdweller', 1],
    ['quest_ring_beasttamer', 1],
    ['quest_ring_elfcaller', 1],
    ['quest_ring_summoner', 1],
    ['quest_ring_darkmage', 1]
];
function renderRedQuest(div) {
    let hasAll = RED_QUEST_REQS.every(([id, n]) => questCountId(id) >= n);
    let listHtml = RED_QUEST_REQS.map(([id, n]) => {
        let have = questCountId(id);
        let ok = have >= n;
        return `<div class="flex justify-between gap-3"><span class="text-slate-300">${DB.items[id].n}</span><span class="${ok ? 'text-green-400' : 'text-red-400'} font-bold">${have}/${n}</span></div>`;
    }).join('');
    let html = `<div class="p-4 text-slate-300 leading-relaxed">
        雷德：為了向<b class="text-red-300">蕾雅</b>復仇，我需要她那些部下的證明物。帶齊下列材料，我便將<b class="text-amber-300">召喚控制戒指</b>交給你。<br><br>
        <div class="bg-slate-900/60 border border-slate-700 rounded p-3 text-sm space-y-1">${listHtml}</div>
    </div>`;
    if (hasAll) {
        html += `<div class="p-4">${trialQtyBar()}<button class="btn w-full bg-blue-800 hover:bg-blue-700 border-blue-500 py-3 text-lg font-bold" onclick="doRedExchange()">兌換：召喚控制戒指</button></div>`;
    } else {
        html += `<div class="px-4 pb-4 text-red-400 text-sm">材料不足。</div>`;
    }
    div.innerHTML = html;
}
function doRedExchange() {
    let n = trialRun(RED_QUEST_REQS, 'acc_summon_ctrl');   // 🔧 可選數量批量兌換（魔法寶石×100/件＋五戒指各 1/件；trialRun 自動算可負擔上限）·🗑️ v3.5.94 退役的第 3 參 sherine 已移除
    if (!n) return;
    saveGame();
    logSys(`雷德：這是你應得的——${trialExName(n, 'acc_summon_ctrl')}。願它助你向蕾雅討回公道。`);
    renderTabs();
    let _c = document.getElementById('interaction-content'); if (_c) renderRedQuest(_c);   // 就地重渲染（可連續兌換、更新材料數）
}

// 🔧 黑暗妖精限定試煉（v3.0.78 接取制）：倫得=30級/康=15級（v3.1.39 交換·key 名 dark15/dark30 未動故與 lv 不對應屬正常）/布魯迪卡=45級＋50級試煉
const DARK_TRIAL_NPC = { npc_runde: { npc: '倫得', key: 'dark15' }, npc_kang: { npc: '康', key: 'dark30' }, npc_brudica: { npc: '布魯迪卡', key: 'dark45' } };
let _darkTrialNpc = 'npc_runde';   // 供重繪用（renderDarkTrial 需第二參數）
function renderDarkTrialR(div) { renderDarkTrial(div, _darkTrialNpc); }
function renderDarkTrial(div, npcId) {
    let cfg = DARK_TRIAL_NPC[npcId];
    if (!cfg) return;
    _darkTrialNpc = npcId;
    if (player.cls !== 'dark') {
        div.innerHTML = `<div class="p-6 text-red-400">${cfg.npc}：這是黑暗妖精的試煉，外人不得參與。</div>`;
        return;
    }
    let html = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🗡️ ${cfg.npc}的試煉</div>` + trialQHTML(cfg.key, 'renderDarkTrialR');
    if (npcId === 'npc_brudica') html += `<div class="mt-3">` + build50TrialHTML('布魯迪卡') + `</div>`;   // 🔥 布魯迪卡：追加黑暗妖精 50 級試煉（等級檢查由 build50TrialHTML 處理）
    div.innerHTML = html + `</div>`;
}
// ===== 🔥 各職業 50 級試煉系統（迪嘉勒廷＝騎士/妖精/法師；布魯迪卡＝黑暗妖精）=====
const TRIAL_50_CFG = {
    knight: { npc: '迪嘉勒廷',
        stages: [ {id:'item_dantes_letter', nm:'丹特斯的召書', cnt:1, hint:'擊殺黑暗妖精將軍'},
                  {id:'item_elf_whisper', nm:'精靈的私語', cnt:10, hint:'擊殺精靈墓穴的怪物'} ],
        exMat:'mat_flame_sword', exMatNm:'炎魔之劍', rewards:[{id:'wpn_blackflame_sword',nm:'黑燄之劍'},{id:'bot_courage',nm:'勇氣長靴'}] },
    elf: { npc: '迪嘉勒廷',
        stages: [ {id:'item_ancient_book', nm:'古代黑妖之秘笈', cnt:1, hint:'擊殺巨大兵蟻'},
                  {id:'item_sealed_intel', nm:'密封的情報書', cnt:1, hint:'於大洞穴隱遁者村莊地區擊殺魔族暗殺團'} ],
        exMat:'mat_flame_claw', exMatNm:'炎魔之爪', rewards:[{id:'wpn_redflame_bow',nm:'赤焰之弓'},{id:'wpn_redflame_sword',nm:'赤焰之劍'},{id:'bot_sephia',nm:'賽菲亞長靴'}] },
    mage: { npc: '迪嘉勒廷',
        stages: [ {id:'item_spy_report', nm:'間諜報告書', cnt:1, hint:'於大洞穴隱遁者村莊地區擊殺魔族暗殺團'} ],
        exMat:'mat_flame_eye', exMatNm:'炎魔之眼', rewards:[{id:'wpn_mana_orb',nm:'瑪那水晶球'},{id:'bot_mana',nm:'瑪那長靴'}] },
    royal: { npc: '迪嘉勒廷',
        stages: [ {id:'item_royal_order', nm:'調職命令書', cnt:1, hint:'擊殺小惡魔'} ],
        exMat:'mat_flame_heart', exMatNm:'炎魔之心', rewards:[{id:'wpn_golden_scepter',nm:'黃金權杖'},{id:'bot_divine_will',nm:'神意長靴'}] },
    dark: { npc: '布魯迪卡',
        stages: [ {id:'item_chaos_key', nm:'混沌鑰匙', cnt:1, hint:'擊殺黑暗棲林者'} ],
        exMat:'item_fallen_key', exMatNm:'墮落鑰匙', rewards:[{id:'wpn_death_finger',nm:'死亡之指'}] },
    // 🔥 v3.0.78 統一：幻術士/戰士/龍騎士 50 級試煉併入本表（原自訂流程移除；trialStage 2=最終兌換階段·loadGame 已遷移舊 demonTempleOpen 存檔）
    illusion: { npc: '希蓮恩',
        stages: [ {id:'mat_rift_shard', nm:'時空裂痕碎片', cnt:100, hint:'底比斯地區怪物掉落'} ],
        exMat:'item_wyvern_blood', exMatNm:'翼龍之血', exMatCnt:5, rewards:[{id:'wpn_qigu_sapphire',nm:'藍寶石奇古獸'}] },
    warrior: { npc: '多文',
        stages: [ {id:'new_item_219', nm:'神秘魔杖', cnt:5, hint:'接取後擊殺指定怪物必定掉落'} ],
        exMat:'new_item_234', exMatNm:'神秘慎重藥水', rewards:[{id:'wpn_master_axe',nm:'大匠的斧頭'}] },
    dragon: { npc: '普洛凱爾',
        stages: [ {id:'mat_rift_shard', nm:'時空裂痕碎片', cnt:100, hint:'底比斯地區怪物掉落'} ],
        exMat:'item_soulfire_ash', exMatNm:'靈魂之火灰燼', rewards:[{id:'wpn_chain_annihilator',nm:'消滅者鎖鏈劍'}] }
};
function build50TrialHTML(npcName) {
    let cfg = TRIAL_50_CFG[player.cls];
    if (!cfg || cfg.npc !== npcName) return `<div class="p-4 text-slate-400">${npcName}：這場試煉與你的職業無關。</div>`;
    if ((player.lv||1) < 50) return `<div class="p-4 text-red-400">${npcName}：等級達到 50 才能參加此試煉。</div>`;
    let st = player.trialStage || 0, nStages = cfg.stages.length;
    let h = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-2">⚔️ ${npcName}的 50 級試煉</div>`;
    if (st === 0) {
        h += `${npcName}：你已是 50 級的強者，願意接受我的試煉嗎？</div><div class="p-4"><button class="btn bg-amber-800 py-2 px-4 font-bold" onclick="trial50Accept()">接取試煉任務</button></div>`;
        return h;
    }
    if (st >= 1 && st <= nStages) {
        let stage = cfg.stages[st-1], have = questCountId(stage.id), enough = have >= stage.cnt, _lk50 = lockedCountId(stage.id);
        h += `目前任務：交付 <b class="text-amber-300">${stage.nm}</b> × ${stage.cnt}（持有 ${have}/${stage.cnt}${(!enough && _lk50 > 0) ? `<span class="text-slate-500">·另 ${_lk50} 個已上鎖不計</span>` : ''}）<br><span class="text-slate-400 text-sm">取得方式：${stage.hint}</span></div>`;   // 🔒 v3.5.87 鎖定件不列入·但明講差額原因
        h += enough ? `<div class="p-4"><button class="btn bg-emerald-800 py-2 px-4 font-bold" onclick="trial50TurnIn()">交付 ${stage.nm}</button></div>` : `<div class="p-4 text-red-400">尚未備齊。${_lk50 > 0 ? '<span class="text-slate-400 text-xs">（有道具已上鎖·解鎖後才會列入計數）</span>' : ''}</div>`;
        return h;
    }
    // 🔥 v3.0.78：最終兌換改「一次性·全拿」（trialStage = 階段數+2 ＝已完成；魔族神殿維持開放）
    if (st >= nStages + 2) return h + `<span class="text-emerald-400">✅ 50 級試煉已全數完成（每個角色僅能完成一次）。魔族神殿永久對你開放。</span></div>`;
    let need = cfg.exMatCnt || 1, have = questCountId(cfg.exMat);
    h += `魔族神殿已對你開放。<br>最終試煉：交付 <b class="text-red-300">${cfg.exMatNm}</b> × ${need}（持有 ${Math.min(have, need)}/${need}·接取階段中擊殺指定怪物必定掉落·達需求即停）<br>一次性換取全部獎勵：${cfg.rewards.map(r => `<b class="text-sky-300">${r.nm}</b>`).join('＋')}`;
    h += `</div>`;
    if (have < need) { let _lkEx = lockedCountId(cfg.exMat); return h + `<div class="px-4 pb-4 text-red-400 text-sm">需要 ${need} 個 ${cfg.exMatNm} 才能完成試煉。${_lkEx > 0 ? `<span class="text-slate-400">（另有 ${_lkEx} 個已上鎖不計）</span>` : ''}</div>`; }   // 🔒 v3.5.87　⚡ v3.5.89 收成區域變數（原本同行呼叫兩次）
    h += `<div class="p-4"><div class="flex flex-wrap gap-2">`;
    h += `<button class="btn bg-emerald-800 hover:bg-emerald-700 py-3 px-4 font-bold" onclick="trial50Complete()">完成試煉（獲得全部獎勵）</button>`;
    // 🚫 v3.2.16 用戶明令移除：50 級試煉「席琳完成」選項與說明列
    return h + `</div></div>`;
}
function renderDigallatin(div) {
    let cfg = TRIAL_50_CFG[player.cls];
    if (!cfg || cfg.npc !== '迪嘉勒廷') { div.innerHTML = `<div class="p-6 text-red-400">迪嘉勒廷：這場試煉只屬於騎士、妖精、法師與王族。</div>`; return; }
    div.innerHTML = build50TrialHTML('迪嘉勒廷');
}
function trial50Accept() {
    let cfg = TRIAL_50_CFG[player.cls];
    if (!cfg) return;
    if (typeof currentRoleIsMercenary === 'function' && currentRoleIsMercenary()) { logSys('<span class="text-amber-300">此角色正在擔任傭兵，請由隊長在傭兵公會接取試煉。</span>'); return; }
    if ((player.lv||1) < 50) { logSys('等級不足 50，無法接取試煉。'); return; }
    if ((player.trialStage||0) !== 0) return;
    player.trialStage = 1; saveGame();
    logSys(`<span class="text-amber-300 font-bold">${cfg.npc}：試煉開始！去取得 ${cfg.stages[0].nm} 吧。</span>`);
    closeNpcInteraction();
}
// 🔥 精靈的私語：騎士「交付精靈的私語」階段完成後（trialStage>2，即已通過第二階段交付）
//   自動清除身上剩餘的精靈的私語（含載入舊存檔的補救、以及曾超收的情況）。回傳清除數量。
function purgeCompletedElfWhisper() {
    if (!player || player.cls !== 'knight' || (player.trialStage || 0) <= 2) return 0;
    let n = (player.inv || []).reduce((s, i) => s + (i.id === 'item_elf_whisper' ? (i.cnt || 0) : 0), 0);
    if (n > 0) player.inv = player.inv.filter(i => i.id !== 'item_elf_whisper');
    return n;
}
function trial50TurnIn() {
    let cfg = TRIAL_50_CFG[player.cls];
    if (!cfg) return;
    if (typeof currentRoleIsMercenary === 'function' && currentRoleIsMercenary()) { logSys('<span class="text-amber-300">此角色正在擔任傭兵，請由隊長在傭兵公會交付試煉道具。</span>'); return; }
    let st = player.trialStage || 0, nStages = cfg.stages.length;
    if (st < 1 || st > nStages) return;
    let stage = cfg.stages[st-1];
    if (questCountId(stage.id) < stage.cnt) { logSys('數量不足，無法交付。' + (typeof lockHintHtml === 'function' ? lockHintHtml(stage.id) : '')); return; }   // 🔒 v3.5.87
    questConsumeId(stage.id, stage.cnt);
    if (st < nStages) { player.trialStage = st + 1; logSys(`<span class="text-emerald-300 font-bold">${cfg.npc}：很好。接著去取得 ${cfg.stages[st].nm}。</span>`); }
    else { player.trialStage = nStages + 1; player.demonTempleOpen = true; logSys(`<span class="c-legend font-bold">${cfg.npc}：你通過了試煉！魔族神殿的大門已對你開啟。</span>`); }
    purgeCompletedElfWhisper();   // 🔥 交付精靈的私語階段完成 → 自動清除剩餘的精靈的私語
    saveGame(); closeNpcInteraction();
}
function trial50Complete() {   // 🔥 v3.0.78 最終兌換一次性·全拿；🚫 v3.2.16 移除席琳完成（原參數 sherine 廢止）
    let cfg = TRIAL_50_CFG[player.cls];
    if (!cfg) return;
    if (typeof currentRoleIsMercenary === 'function' && currentRoleIsMercenary()) { logSys('<span class="text-amber-300">此角色正在擔任傭兵，請由隊長在傭兵公會完成試煉並領取獎勵。</span>'); return; }
    let nStages = cfg.stages.length, st = player.trialStage || 0;
    if (st !== nStages + 1) return;   // 只有「魔族神殿已開·尚未完成最終兌換」可完成
    let need = cfg.exMatCnt || 1;
    if (questCountId(cfg.exMat) < need) { logSys(`${cfg.exMatNm} 不足 ${need}。` + (typeof lockHintHtml === 'function' ? lockHintHtml(cfg.exMat) : '')); return; }   // 🔒 v3.5.87
    questConsumeId(cfg.exMat, need);
    let _sv = _tradLootCtx; _tradLootCtx = true;   // 🏛️ 傳統模式：獎勵裝備隨機自帶強化值
    try {
        cfg.rewards.forEach(r => { gainItem(r.id, 1, false, false); });
    } finally { _tradLootCtx = _sv; }
    player.trialStage = nStages + 2;   // ✅ 全數完成（demonTempleOpen 維持 true）
    saveGame();
    logSys(`<span class="c-legend font-bold">${cfg.npc}：你完成了 50 級試煉的全部考驗！</span><span class="text-amber-200">獲得 ${cfg.rewards.map(r => r.nm).join('、')}。（此試煉已完成，無法再次兌換）</span>`);
    closeNpcInteraction(); renderTabs();
}
// 🔮 希蓮恩（希培利亞村莊）：幻術士的試煉道具兌換 + 50 級試煉（時空裂痕碎片→魔族神殿、翼龍之血→藍寶石奇古獸）
// 🔮 希蓮恩（希培利亞村莊）：幻術士 15/30/45 級試煉（接取制）＋ 50 級試煉（統一走 TRIAL_50_CFG）
function renderShenien(div) {
    if (player.cls !== 'illusion') { div.innerHTML = `<div class="p-6 text-red-400">希蓮恩：這場試煉只屬於幻術士。</div>`; return; }
    let h = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🔮 希蓮恩的試煉</div>`;
    h += trialQHTML('illusion15', 'renderShenien') + trialQHTML('illusion30', 'renderShenien') + trialQHTML('illusion45', 'renderShenien');
    h += `<div class="mt-3">` + build50TrialHTML('希蓮恩') + `</div></div>`;
    div.innerHTML = h;
}
// ⚔️ 多文（海音）：戰士 15/30/45 級試煉（接取制）＋ 50 級試煉（統一走 TRIAL_50_CFG）
function renderDuwen(div) {
    if (player.cls !== 'warrior') { div.innerHTML = `<div class="p-6 text-red-400">多文：這場試煉只屬於戰士。</div>`; return; }
    let h = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">⚔️ 多文的試煉</div>`;
    h += trialQHTML('warrior15', 'renderDuwen') + trialQHTML('warrior30', 'renderDuwen') + trialQHTML('warrior45', 'renderDuwen');
    h += `<div class="mt-3">` + build50TrialHTML('多文') + `</div></div>`;
    div.innerHTML = h;
}
// 🐉 普洛凱爾（貝希摩斯）：龍騎士 15/30/45 級試煉（接取制）＋ 50 級試煉（統一走 TRIAL_50_CFG）
function renderProcel(div) {
    if (player.cls !== 'dragon') { div.innerHTML = `<div class="p-6 text-red-400">普洛凱爾：這場試煉只屬於龍騎士。</div>`; return; }
    let h = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🐉 普洛凱爾的試煉</div>`;
    h += trialQHTML('dragon15', 'renderProcel') + trialQHTML('dragon30', 'renderProcel') + trialQHTML('dragon45', 'renderProcel');
    h += `<div class="mt-3">` + build50TrialHTML('普洛凱爾') + `</div></div>`;
    div.innerHTML = h;
}
// 🏹 歐斯：妖精 15 級試煉（接取制）
function renderOsQuest(div) {
    if (player.cls !== 'elf') { div.innerHTML = `<div class="p-6 text-red-400">歐斯：我有點事想找妖精幫忙，不相關者請離開。</div>`; return; }
    div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🏹 歐斯的試煉</div>` + trialQHTML('elf15', 'renderOsQuest') + `</div>`;
}
// 🔮 塔拉斯（象牙塔）：法師 30/45 級試煉（接取制）
function renderTarasQuest(div) {
    if (player.cls !== 'mage') { div.innerHTML = `<div class="p-6 text-red-400">塔拉斯：亡者的學識只向法師敞開。</div>`; return; }
    div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🔮 塔拉斯的試煉</div>`
        + trialQHTML('mage30', 'renderTarasQuest') + trialQHTML('mage45', 'renderTarasQuest') + `</div>`;
}
// 🛡️👑 甘特：騎士 30 級試煉／王族 15、30 級試煉（接取制）
function renderGunterQuest(div) {
    if (player.cls === 'knight') {
        div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🛡️ 甘特的試煉</div>` + trialQHTML('knight30', 'renderGunterQuest') + `</div>`;
    } else if (player.cls === 'royal') {
        div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">👑 甘特的試煉</div>`
            + trialQHTML('royal15', 'renderGunterQuest') + trialQHTML('royal30', 'renderGunterQuest') + `</div>`;
    } else {
        div.innerHTML = `<div class="p-6 text-red-400">甘特：這是騎士與王族的試煉，請回吧。</div>`;
    }
}
// 🏹 迷幻森林之母：妖精 30 級試煉（接取制）
function renderMotherQuest(div) {
    if (player.cls !== 'elf') { div.innerHTML = `<div class="p-6 text-red-400">迷幻森林之母：只有妖精聽得見森林的低語。</div>`; return; }
    div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">🏹 迷幻森林之母的試煉</div>` + trialQHTML('elf30', 'renderMotherQuest') + `</div>`;
}
// 🛡️🏹👑 馬沙（威頓村）：騎士 45／妖精 45／王族 45 級試煉（接取制）
function renderMashaQuest(div) {
    let key = player.cls === 'knight' ? 'knight45' : player.cls === 'elf' ? 'elf45' : player.cls === 'royal' ? 'royal45' : null;
    if (!key) { div.innerHTML = `<div class="p-6 text-red-400">馬沙：這是騎士、妖精與王族的試煉。</div>`; return; }
    div.innerHTML = `<div class="p-4 text-slate-300 leading-relaxed"><div class="text-amber-300 font-bold mb-3">⚔️ 馬沙的試煉</div>` + trialQHTML(key, 'renderMashaQuest') + `</div>`;
}
