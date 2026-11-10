let _tabPointerDown = false, _tabWheelActive = false, _tabWheelTimer = null, _tabRebuildPending = false, _tabThrottleTimer = null;
const TAB_REBUILD_THROTTLE_MS = 250;
const TAB_WHEEL_IDLE_MS = 180;
const CLASSIC_GRID_COLUMNS = 4;
const CLASSIC_GRID_ROWS = 6;
const CLASSIC_PAGE_CELLS = CLASSIC_GRID_COLUMNS * CLASSIC_GRID_ROWS;
// 🗑️ v3.5.83 移除 plainInventoryItemName()：零引用，且與實際使用中的 _autoSellPlainItemName 功能重複。
function _initTabGuard() {
    let panel = document.getElementById('tab-content-panel');
    if (!panel || panel._tabGuardInit) return;
    panel._tabGuardInit = true;
    panel.addEventListener('pointerdown', function(){ _tabPointerDown = true; });
    // 狩獵掉落、箭矢消耗會要求重建背包。滾輪操作期間若直接替換 DOM，
    // 瀏覽器會中斷慣性捲動，物品越多時越容易看起來像整頁卡住。
    panel.addEventListener('wheel', function(){
        _tabWheelActive = true;
        if (_tabWheelTimer) clearTimeout(_tabWheelTimer);
        _tabWheelTimer = setTimeout(function(){
            _tabWheelTimer = null;
            _tabWheelActive = false;
            if (_tabRebuildPending) {
                _tabRebuildPending = false;
                renderTabs();
            }
        }, TAB_WHEEL_IDLE_MS);
    }, { passive:true, capture:true });
    let _release = function(){ if (!_tabPointerDown) return; _tabPointerDown = false; if (_tabRebuildPending) { _tabRebuildPending = false; setTimeout(function(){ renderTabs(); }, 0); } };   // 放開後(讓 click 先觸發)再補一次重建
    document.addEventListener('pointerup', _release);
    document.addEventListener('pointercancel', _release);
}

// ===== 🎨 v3.0.55 1.8 原版風格技能魔法視窗（移植參考版 idle-lineage-class）=====
//   底圖 assets/ui/技能欄位.png（193×282，4 欄 × 6 排）＋左側階級指示 assets/ui/skill-level/539..548.png。
//   模式：一般（reqM 通用魔法·1~10 階 tier strip 導覽）／職業（各職 req 欄位技能）／裝備（頭盔授予）。
//   底部 S.power=玩家魔法傷害(player.d.magicDmg)、M.resist=玩家魔防(player.d.mr) 填入黑框。⚠️格 class 帶 tip-host 讓 Fable5 data-tip-skill tooltip 生效。
let classicSkillBookState = { mode: 'general', tier: 1, page: 0 };
function refreshClassicSkillBookOnly() {
    let div = document.getElementById('tab-skill');
    if (div) renderClassicSkillBook(div);
    if (typeof updateSummonLock === 'function') updateSummonLock();
}
function classicSkillChooseTier(tier) {
    classicSkillBookState.mode = 'general';
    classicSkillBookState.tier = Math.max(1, Math.min(10, parseInt(tier, 10) || 1));
    refreshClassicSkillBookOnly();
    requestAnimationFrame(function(){
        let view = document.querySelector('#tab-skill .classic-skill-grid-scroll');
        let first = document.querySelector('#tab-skill .classic-skill-cell[data-tier="' + classicSkillBookState.tier + '"]');
        if (view && first) view.scrollTop = Math.max(0, first.offsetTop);
    });
}
function classicSkillSelectTier(tier) {
    tier = Math.max(1, Math.min(10, parseInt(tier, 10) || 1));
    classicSkillBookState.tier = tier;
    let strip = document.querySelector('#tab-skill .classic-skill-tier-strip');
    if (strip) strip.style.backgroundImage = "url('assets/ui/skill-level/" + (538 + tier) + ".png')";
    let heading = document.querySelector('#tab-skill .classic-skill-heading');
    if (heading && classicSkillBookState.mode === 'general') heading.textContent = tier + '階一般魔法';
}
function classicSkillSyncTierFromScroll(view) {
    if (!view || classicSkillBookState.mode !== 'general') return;
    let cells = view.querySelectorAll('.classic-skill-cell[data-tier]');
    let line = view.scrollTop + Math.max(4, view.clientHeight * 0.12), tier = classicSkillBookState.tier;
    for (let cell of cells) {
        if (cell.offsetTop <= line) tier = parseInt(cell.dataset.tier, 10) || tier;
        else break;
    }
    if (tier !== classicSkillBookState.tier) classicSkillSelectTier(tier);
}
function classicSkillScrollRows(direction) {
    let view = document.querySelector('#tab-skill .classic-skill-grid-scroll');
    if (!view) return;
    view.scrollBy({ top:(direction < 0 ? -1 : 1) * (view.clientHeight / CLASSIC_GRID_ROWS), behavior:'smooth' });
}
function classicSkillChooseMode(mode) {
    classicSkillBookState.mode = mode;
    classicSkillBookState.page = 0;
    refreshClassicSkillBookOnly();
}
function classicSkillClassLabel() {
    return ({ knight:'騎士技術', mage:'法師魔法', elf:'精靈魔法', dark:'黑妖魔法', illusion:'幻術魔法', dragon:'龍騎魔法', warrior:'戰士技能', royal:'王族魔法' })[player.cls] || '職業技能';
}
function classicSkillIsClassSkill(sk) {
    if (!sk || sk.procOnly) return false;
    if (player.cls === 'knight') return sk.reqK !== undefined && sk.reqM === undefined;
    if (player.cls === 'elf') return sk.reqE !== undefined && sk.reqM === undefined;
    if (player.cls === 'dark') return sk.reqD !== undefined;
    if (player.cls === 'illusion') return sk.reqI !== undefined && sk.reqM === undefined;
    if (player.cls === 'dragon') return sk.reqDk !== undefined && sk.reqM === undefined;
    if (player.cls === 'warrior') return sk.reqW !== undefined;
    if (player.cls === 'royal') return sk.reqRoy !== undefined;
    return false;
}
function renderClassicSkillBook(sDiv) {
    if (!sDiv || typeof player === 'undefined' || !player) return;
    let stateBook = classicSkillBookState;
    let allIds = Object.keys(DB.skills).filter(id => DB.skills[id] && !DB.skills[id].procOnly && id.indexOf('sk_helm_') !== 0);
    let accessibleGeneral = allIds.filter(id => { let sk = DB.skills[id]; return sk.reqM !== undefined && skillReqLv(sk, id) !== undefined; });
    let classSkills = allIds.filter(id => classicSkillIsClassSkill(DB.skills[id]));
    let granted = (player.grantedSkills || []).filter(id => DB.skills[id]);
    let classLabel = classicSkillClassLabel();
    if (stateBook.mode === 'class' && !classSkills.length) stateBook.mode = 'general';
    if (stateBook.mode === 'equipment' && !granted.length) stateBook.mode = 'general';
    if (stateBook.mode === 'general' && !accessibleGeneral.length && classSkills.length) stateBook.mode = 'class';   // 🔧 無一般魔法職業(騎士/戰士)→預設顯示職業技能，不留空白格

    let tierAvailable = new Set(accessibleGeneral.map(id => +DB.skills[id].tier));
    let list = [];
    if (stateBook.mode === 'class') list = classSkills.map(id => ({ id:id, tier:null }));
    else if (stateBook.mode === 'equipment') list = granted.map(id => ({ id:id, tier:null }));
    else {
        Array.from(tierAvailable).sort((a,b) => a-b).forEach(tier => {
            let group = accessibleGeneral.filter(id => +DB.skills[id].tier === tier).map(id => ({ id:id, tier:tier }));
            while (group.length % 4) group.push({ id:null, tier:tier });
            list.push.apply(list, group);
        });
    }
    while (list.length < CLASSIC_PAGE_CELLS) list.push({ id:null, tier:null });
    let cells = list.map(entry => {
        let id = entry.id;
        if (!id) return '<div class="classic-skill-cell classic-skill-empty"></div>';
        let sk = DB.skills[id];
        let learned = (player.skills || []).includes(id);
        let grantedSkill = granted.includes(id);
        let needLv = grantedSkill ? 0 : skillReqLv(sk, id);
        let elementOk = !sk.reqEle || player.elfEle === sk.reqEle;
        let elementChosen = !sk.reqEleAny || !!player.elfEle;
        let usable = learned && elementOk && elementChosen && (grantedSkill || needLv === undefined || player.lv >= needLv);
        let dim = learned ? (usable ? '' : ' classic-skill-unavailable') : ' classic-skill-unlearned';
        let img = '<img src="' + getIconUrl(sk, true) + '" onerror="this.style.display=\'none\';" alt="' + sk.n + '">';
        let tierAttr = entry.tier ? ' data-tier="' + entry.tier + '"' : '';
        let select = entry.tier ? 'classicSkillSelectTier(' + entry.tier + ');' : '';
        if (learned && usable && sk.type === 'manual') return '<button class="classic-skill-cell tip-host' + dim + '"' + tierAttr + ' data-tip-skill="' + id + '" title="' + sk.n + '" onclick="' + select + 'manualCast(\'' + id + '\')">' + img + '</button>';
        return '<div class="classic-skill-cell tip-host' + dim + '"' + tierAttr + ' data-tip-skill="' + id + '" title="' + sk.n + '" onclick="' + select + '">' + img + (!learned ? '<span class="classic-skill-lock">◆</span>' : '') + '</div>';
    }).join('');

    let tierButtons = '';
    for (let t = 1; t <= 10; t++) tierButtons += '<button class="classic-skill-tier-hit tier-' + t + (tierAvailable.has(t) ? '' : ' disabled') + '" ' + (tierAvailable.has(t) ? 'onclick="classicSkillChooseTier(' + t + ')"' : 'disabled') + ' title="' + t + '階一般魔法"></button>';
    let sprite = 538 + stateBook.tier;
    let modeButtons = '<button class="' + (stateBook.mode === 'general' ? 'active' : '') + '" onclick="classicSkillChooseMode(\'general\')">一般</button>'
        + (classSkills.length ? '<button class="' + (stateBook.mode === 'class' ? 'active' : '') + '" onclick="classicSkillChooseMode(\'class\')">' + (player.cls === 'elf' ? '精靈' : '職業') + '</button>' : '')
        + (granted.length ? '<button class="' + (stateBook.mode === 'equipment' ? 'active' : '') + '" onclick="classicSkillChooseMode(\'equipment\')">裝備</button>' : '');
    let heading = stateBook.mode === 'general' ? (stateBook.tier + '階一般魔法') : (stateBook.mode === 'equipment' ? '裝備授予魔法' : classLabel);
    let _spv = (player.d && player.d.magicDmg != null) ? Math.round(player.d.magicDmg) : 0;
    let _mrv = (player.d && player.d.mr != null) ? Math.round(player.d.mr) : 0;
    sDiv.innerHTML = '<div class="classic-skill-window">'
        + '<div class="classic-skill-heading">' + heading + '</div>'
        + '<div class="classic-skill-mode">' + modeButtons + '</div>'
        + '<div class="classic-skill-tier-strip" style="background-image:url(\'assets/ui/skill-level/' + sprite + '.png\')">' + tierButtons + '</div>'
        + '<div class="classic-skill-grid-scroll" onscroll="classicSkillSyncTierFromScroll(this)"><div class="classic-skill-grid">' + cells + '</div></div>'
        + '<button type="button" class="classic-skill-scroll classic-skill-scroll-up" aria-label="技能向上捲動" onclick="classicSkillScrollRows(-1)"></button>'
        + '<button type="button" class="classic-skill-scroll classic-skill-scroll-down" aria-label="技能向下捲動" onclick="classicSkillScrollRows(1)"></button>'
        + '<div class="classic-skill-stat classic-skill-stat-sp">' + _spv + '</div>'
        + '<div class="classic-skill-stat classic-skill-stat-mr">' + _mrv + '</div>'
        + '</div>';
}
function renderTabs(force) {
    if (typeof _deferItemTransactionEffect === 'function' && _deferItemTransactionEffect(renderTabs, arguments)) return;
    if(state.ff || (typeof catchupActive === 'function' && catchupActive())) return; // 補跑全部完成前不刷新畫面
    // 🚀 使用者正按住分頁面板(點擊中)：延後非強制重建到放開後，避免按鈕被重繪掉而點擊失效
    if(!force && (_tabPointerDown || _tabWheelActive)) { _tabRebuildPending = true; return; }
    // 🚀 戰鬥 tick 內的高頻變動(扣箭/耗肉)：合併成一次重建(節流 250ms)，降低狩獵卡頓；使用者操作(非 tick)維持即時回饋
    if(!force && state.inTick) { if(!_tabThrottleTimer) _tabThrottleTimer = setTimeout(function(){ _tabThrottleTimer = null; renderTabs(); }, TAB_REBUILD_THROTTLE_MS); return; }
    if(_tabThrottleTimer) { clearTimeout(_tabThrottleTimer); _tabThrottleTimer = null; }
    // ===== 內容簽章：背包/裝備/技能等實際內容沒變時直接跳過重建 =====
    // 避免戰鬥中(掉寶、射箭扣箭、夥伴耗肉等)頻繁重繪，導致游標所在欄位閃動、捲動跳回頂端、以及 mousedown/mouseup 落在不同元素造成點擊失效。
    let _sig = (function(){
        let inv = player.inv.map(i => itemSig(i) + '.' + (i.cnt||1) + '.' + (i.lock?1:0) + '.' + (i.junk?1:0)).join(';');   // 🔧 架構#3：改用統一簽章（修正先前祝福/詛咒同被壓成 1 的重繪遺漏）
        let eq = Object.keys(player.eq).map(k => { let e = player.eq[k]; return e ? `${k}:${itemSig(e)}.${e.cnt||0}` : k+':'; }).join(',');   // 🔧 補上先前缺漏的 attr / anc
        let dd = player.d;
        // 🩹 v3.5.87 簽章補實際繪出的衍生值·防 buff 到期顯示卡舊：裝備分頁標頭的負重(weightPct/loadTier)與經典技能視窗的魔法傷害/MR(magicDmg/mr)
        //    —— 五維總和不變時（如負重強化 buff、龍族覺醒 mr×1.15 到期）這些畫面值仍會變，須納入簽章才會觸發重繪
        return `${inv}#${eq}#${(player.skills||[]).join(',')}#${(player.grantedSkills||[]).join(',')}#${player.cls}#${player.lv}#${player.elfEle||''}#${player.mastery||''}#${dd.str+dd.dex+dd.con+dd.int+dd.wis}#${dd.weightPct||0}.${dd.loadTier||0}.${Math.round(dd.magicDmg||0)}.${Math.round(dd.mr||0)}`;
    })();
    if(!force && _sig === renderTabs._sig) return;
    renderTabs._sig = _sig;
    // 真的要重建時，先記住各分頁的捲動位置，重建後還原（避免跳回頂端）
    let _scroll = {};
    ['tab-items','tab-weapons','tab-armors','tab-equip','tab-skill'].forEach(id => { let el = document.getElementById(id); if(el) { let sc=el.querySelector('.classic-inventory-viewport,.classic-skill-grid-scroll'); _scroll[id] = sc ? sc.scrollTop : el.scrollTop; } });   // 🎨 v3.0.40 1.8皮膚：捲動位置存在內層 viewport（技能頁為 .classic-skill-grid-scroll）

    let eDiv = document.getElementById('tab-equip'); eDiv.innerHTML = '';
    { let _wd = player.d || {}; let _t = _wd.loadTier || 0; let _hdr = document.createElement('div'); _hdr.className = 'classic-list-toolbar text-center py-0.5 rounded bg-slate-900/60 border border-slate-700 text-sm font-bold leading-tight' + (_t >= 1 ? ' cursor-help' : ''); if (_t >= 1) { _hdr.title = _t === 1 ? '負重50%↑：HP/MP不自然恢復' : (_t === 2 ? '負重82%↑：HP/MP不自然恢復、停自動施法、攻速變慢' : '負重100%↑：HP/MP不自然恢復、停自動施法、攻速大幅變慢'); } _hdr.innerHTML = `<span class="${getLoadColor(_t)}">負重 ${_wd.weightPct||0}%</span>`; eDiv.appendChild(_hdr); }
    const _baseSlots = [{k:'wpn',n:'武器'}, ...((player.cls === 'warrior' && (player.skills.includes('sk_warrior_dualaxe') || player.eq.offwpn)) ? [{k:'offwpn',n:'副手武器'}] : []), {k:'shield',n:'副手'},{k:'helm',n:'頭盔'},{k:'armor',n:'盔甲'},{k:'shin',n:'脛甲'},{k:'tshirt',n:'T恤'},{k:'cloak',n:'斗篷'},{k:'gloves',n:'手套'},{k:'boots',n:'長靴'},{k:'amulet',n:'項鍊'},{k:'ear1',n:'耳環'},{k:'ear2',n:'耳環'},{k:'ring1',n:'戒指'},{k:'ring2',n:'戒指'},{k:'ring3',n:'戒指'},{k:'ring4',n:'戒指'},{k:'belt',n:'腰帶'},{k:'doll',n:'魔法娃娃'},{k:'arrow',n:'箭矢'}];   // 🦴 v3.3.21 移除已停用的 {k:'pet'} 空格（v3.2.37 玩家 eq.pet 拆除→改亞丁包武保管·此欄恆空）   // ⚔️ offwpn：戰士學會迅猛雙斧後顯示副手武器欄
    const _remSlots = (typeof SHERINE_REMAINS !== 'undefined') ? SHERINE_REMAINS.map(r => ({ k: r.id, n: '遺骸' + r.n })) : [];   // 🦴 v3.1.68 席琳遺骸 8 格（欄位鍵=物品id）·⚠️ 同一組 8 格也顯示在 js/19 嵌入式裝備面板的第 2 頁（PAGE_SLOTS[1]，js/19 自 v3.5.87 起已無浮動模式）→ 日後新增遺骸種類兩處都要同步
    // 🦴 新版第一頁為 4 欄 × 6 排＝24 格；一般裝備補滿第一頁後，8 格遺骸固定落在第 25~32 格（第二頁前兩排）。
    const _padCells = Math.max(0, CLASSIC_PAGE_CELLS - _baseSlots.length);
    const slots = [..._baseSlots, ...Array.from({ length: _remSlots.length ? _padCells : 0 }, () => ({ filler: true })), ..._remSlots];
    
    let setCheck = {}, _setSeen = {};
    for (let k in player.eq) {
        let e = player.eq[k];
        if(e) {
            let ed = DB.items[e.id];
            if(ed.set && !_setSeen[e.id]) { _setSeen[e.id] = true; setCheck[ed.set] = (setCheck[ed.set]||0) + 1; }   // 🔧 與 calcStats 一致：同款物品只計 1 件
        }
    }
    let activeSets = [];
    if(setCheck['leather'] >= 4) activeSets.push('leather');   // 皮套裝（補上底色判定）
    if(setCheck['bone'] >= 3) activeSets.push('bone');
    if(setCheck['dk'] >= 4) activeSets.push('dk');
    if(setCheck['silver'] >= 4) activeSets.push('silver');
    if(setCheck['oasis'] >= 4) activeSets.push('oasis');
    if(setCheck['gnome'] >= 3) activeSets.push('gnome');
    if(setCheck['mage'] >= 2) activeSets.push('mage');
    if(setCheck['kurt'] >= 4) activeSets.push('kurt');
    if(setCheck['mr'] >= 2) activeSets.push('mr');   // 抗魔套裝僅 2 件，門檻應為 2
    if(setCheck['guard'] >= 3) activeSets.push('guard');
    if(setCheck['steel'] >= 5) activeSets.push('steel');
    if(setCheck['kinglord'] >= 4) activeSets.push('kinglord');   // 🔧 四大軍王套裝：4 件齊→欄位底色亮起
    if(setCheck['demon'] >= 4) activeSets.push('demon');   // 🗼 惡魔套裝：4 件齊→欄位底色亮起
    if(setCheck['orin'] >= 2) activeSets.push('orin');   // 🔱 歐林西瑪套裝：2 件齊→欄位底色亮起
    if(setCheck['icequeen_charm'] >= 3) activeSets.push('icequeen_charm');   // ❄️👸 冰之女王魅力套裝：3 件齊→欄位底色亮起
    if(setCheck['frost'] >= 3) activeSets.push('frost');   // ❄️ 寒冰套裝：3 件齊→欄位底色亮起
    if(setCheck['bluepirate'] >= 4) activeSets.push('bluepirate');   // 🏴‍☠️ 藍海賊套裝：4 件齊→欄位底色亮起
    if(setCheck['priest'] >= 5) activeSets.push('priest');   // 🏺 v3.7.52 司祭苦行套裝：5 件齊→欄位底色亮起

    slots.forEach(s => {
        if (s.filler) {   // 🦴 v3.1.75 填充格：與 decorateClassicInventoryTab 尾端補的空格同款（無邊框互動·非 .list-item）
            let f = document.createElement('div');
            f.className = 'classic-grid-empty'; f.setAttribute('aria-hidden', 'true');
            eDiv.appendChild(f);
            return;
        }
        let eq = player.eq[s.k];
        let isSetActive = false, _setN = 0;
        if(eq && DB.items[eq.id].set && activeSets.includes(DB.items[eq.id].set)) { isSetActive = true; _setN = setCheck[DB.items[eq.id].set] || 0; }
        // 🔮 席琳套裝：⚠️v3.1.68 綠色反光只給「遺骸欄」（套裝效果改由遺骸承載）；一般裝備欄的舊詞綴不再發光（不計件）
        // 🦴 v3.1.73 遺骸欄三階視覺（實體 CSS class·見 style.css：1.8 皮膚 !important 會蓋掉 Tailwind 的 bg/ring/shadow）
        //    未觸發(<2 件) → rem-slot-dim：把圖示綠光壓弱；已觸發(2/3/5 件) → rem-slot-lit + rem-tier-N：綠框 + 反光遮罩掃光
        let _remGrp = (s.k.startsWith('rem_') && eq && eq.seteff) ? eq.seteff.slice(0, 2) : null;
        let _remN = _remGrp ? ((player._sherineSetCnt && player._sherineSetCnt[_remGrp]) || 0) : 0;
        let isSherineActive = _remN >= 2;
        let _remCls = !_remGrp ? ''
            : (isSherineActive ? ` rem-slot-lit ${_remN >= 5 ? 'rem-tier-5' : (_remN >= 3 ? 'rem-tier-3' : 'rem-tier-2')}` : ' rem-slot-dim');
        // 🛡️ v3.1.74 一般套裝：同樣的框光＋反光遮罩，配色改琥珀金；階數依實際裝備件數（2/3/5）
        let _setCls = isSetActive ? ` set-slot-lit ${_setN >= 5 ? 'set-tier-5' : (_setN >= 3 ? 'set-tier-3' : 'set-tier-2')}` : '';

        let el = document.createElement('div');
        // 🔧 底色優先序：席琳套裝(綠) > 舊套裝(琥珀金，原綠色讓給席琳) > 一般
        el.className = `list-item text-base rounded mb-1 ${isSherineActive
            ? 'bg-green-900 border border-green-400 ring-1 ring-green-400/60 shadow-[0_0_10px_rgba(74,222,128,0.6)]'
            : (isSetActive ? 'bg-amber-900 border border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.55)]' : 'bg-slate-800')}${_remCls}${_setCls}`;
        if(eq) {
            let d = DB.items[eq.id];
            let imgUrl = getIconUrl(d);
            // 👇 判斷如果裝備本身是祝福的，或者物品基底(卷軸)是祝福的，就套用螢光特效
            let glowClass = getGlowClass(eq, d);
            let imgHtml = `<img src="${imgUrl}" onerror="this.style.opacity='0';" class="object-contain pointer-events-none ${glowClass}">`;
            let _showEquipped = (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') && !d.isArrow;
            let _cornerValue = (Number(eq.en) || 0) > 0
                ? `<span class="classic-icon-corner-value is-enhance">+${capEn(eq.en, d)}</span>`
                : ((eq.cnt || 1) > 1 ? `<span class="classic-icon-corner-value is-count">${(eq.cnt || 1).toLocaleString()}</span>` : '');
            let _equippedBadge = _showEquipped ? '<span class="classic-equipped-badge" aria-hidden="true">E</span>' : '';
            el.classList.add('tip-host');
            el.setAttribute('data-tip-uid', eq.uid); el.setAttribute('data-tip-src', 'eq');   // 🖱️ 裝備欄 hover 即時顯示完整資訊 tooltip（同背包/裝備視窗·取代原生 title 慢速）
            if (eq.lock) el.classList.add('classic-item-locked');
            el.innerHTML = `<div class="classic-icon-box">${imgHtml}${_equippedBadge}${_cornerValue}</div><div class="classic-name-box"><span class="classic-slot-name">${s.n}</span><span class="${getItemColor(eq)} font-bold">${getItemFullName(eq)}</span></div>${eq.lock ? '<span class="classic-item-lock-badge" aria-hidden="true">🔒</span>' : ''}`;
            el.onclick = () => openModal(eq, true, s.k);
        } else {
            let _rlv = (s.k === 'ring3') ? 76 : (s.k === 'ring4') ? 81 : (s.k === 'ear2') ? 59 : 0;   // 🔧 第3/4戒指欄、第2耳環欄等級需求
            let _locked = _rlv && player.lv < _rlv;
            el.title = _locked ? `${s.n}（需 Lv${_rlv}）` : `${s.n}（空）`;
            el.innerHTML = `<div class="classic-icon-box"></div><div class="classic-name-box"><span class="classic-slot-name">${s.n}</span><span class="${_locked ? 'text-red-400' : 'text-slate-500'}">${_locked ? '需 Lv' + _rlv : '- 空 -'}</span></div>`;
        }
        eDiv.appendChild(el);
    });
    
    // 👇 清空新的三個面板
    let wDiv = document.getElementById('tab-weapons'); wDiv.innerHTML = '';
    let aDiv = document.getElementById('tab-armors'); aDiv.innerHTML = '';
    let iDiv = document.getElementById('tab-items'); iDiv.innerHTML = '';

    // ⚡🗑️ 快速操作頭部：武器/防具分頁＝[快速強化][快速廢品]；道具分頁＝[快速廢品]
    wDiv.appendChild(buildQuickHeader('wpn'));
    aDiv.appendChild(buildQuickHeader('arm'));
    iDiv.appendChild(buildQuickHeader('item'));

player.inv.forEach(i => {
    if(!DB.items[i.id]) return;
    let d = DB.items[i.id];

    // ===== 視覺狀態判定 =====
    let statusTag = '';
    let itemBg = 'bg-slate-800'; // 預設背景
    let dimIcon = false; // 🔅 無法裝備（職業/負重不符）時，圖示黯淡化

    if (d.type === 'skillbk') {
        let sk = DB.skills[d.sk];
        // 檢查該技能是否屬於該職業可學習範圍
        let isClsPossible = skillReqLv(sk, d.sk) !== undefined;   // 🏅 集中化：含魔導精通特例
        
        if (player.skills.includes(d.sk)) {
            statusTag = '<span class="text-slate-500 text-[10px] font-bold">[已學習]</span>';
            itemBg = 'bg-slate-900 opacity-70'; // 已學習變暗
        } else if (!isClsPossible) {
            statusTag = '<span class="text-red-500 text-[10px] font-bold">[無法學習]</span>';
            itemBg = 'bg-red-950/40'; // 職業不符顯示暗紅色底
        }
    } 
    // 2. 裝備職業穿著判定 (修正版)
    else if (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') {
    // 👇 呼叫我們剛剛定義的共用判定函數，這樣就完美支援「負重強化」了！
    let canEquip = checkCanEquip(i);
    
    if (!canEquip) {
        statusTag = '<span class="text-red-500 text-[10px] font-bold">[無法裝備]</span>';
        itemBg = 'bg-red-950/40'; // 職業/技能不符，顯示暗紅色底
        dimIcon = true; // 🔅 圖示黯淡化
    }
}

    // ===== 渲染物品 =====
    let el = document.createElement('div'); 
    // className 這裡移除了 isDisabled 相關的判定，讓所有項目都可以互動
    el.className = `list-item tip-host text-base ${itemBg} rounded mb-1 ${i.lock ? 'border-red-900 border-2' : ''}`;
    el.setAttribute('data-tip-uid', i.uid); el.setAttribute('data-tip-src', 'inv');   // 🖱️ hover 即時顯示完整物品資訊 tooltip（同技能·取代原生 title 慢速提示）
    if (i.lock) el.classList.add('classic-item-locked');
    else if (i.junk) el.classList.add('classic-item-junk');
    
    // 判斷如果背包裡的物品是祝福的，套用螢光特效
    let imgUrl = getIconUrl(d);
    let glowClass = getGlowClass(i, d);
    let _dimStyle = dimIcon ? ' style="opacity:0.3;filter:grayscale(0.6);"' : '';   // 🔅 無法裝備→圖示黯淡＋去彩度
    let imgHtml = `<img src="${imgUrl}" onerror="this.style.opacity='0';" class="w-6 h-6 object-contain pointer-events-none ${glowClass}"${_dimStyle}>`;
    let _invCornerValue = (Number(i.en) || 0) > 0
        ? `<span class="classic-icon-corner-value is-enhance">+${capEn(i.en, d)}</span>`
        : ((i.cnt || 1) > 1 ? `<span class="classic-icon-corner-value is-count">${(i.cnt || 1).toLocaleString()}</span>` : '');
    
    // 內容組合 (加入了 statusTag)
    let _rowInner = `<div class="classic-item-main"><div class="classic-icon-box">${imgHtml}${_invCornerValue}</div><div class="classic-name-box"><span class="${getItemColor(i)} font-bold">${getItemFullName(i)}</span><span class="classic-item-flags">${statusTag}</span></div>${i.lock ? '<span class="classic-item-lock-badge" aria-hidden="true">🔒</span>' : ''}${(i.junk && !i.lock) ? '<span class="classic-item-junk-label">廢品</span>' : ''}</div>`;   // 方格狀態：上鎖右上角；廢品灰階＋底部紅字

    // ⚡ 快速強化模式：對應分頁啟用且為可強化裝備（未鎖定）時，右側顯示勾選欄，點整列切換勾選
    let _qeType = (d.type === 'wpn' && !d.isArrow) ? 'wpn' : ((d.type === 'arm' || d.type === 'acc') ? 'arm' : null);
    let _qjType = (d.type === 'wpn') ? 'wpn' : ((d.type === 'arm' || d.type === 'acc') ? 'arm' : 'item');   // 🗑️ 快速廢品分頁歸屬（含箭矢→武器分頁、其餘→道具分頁）
    if (_qeType && quickEnh[_qeType].active && _qeCanSelect(d, i, _qeType)) {   // ⚡ v3.5.87 改用與執行端 _qeEligibleItems 同一 predicate：noEnhance 等不合格物品不再顯示可勾（改走下方一般列分支）
        let _checked = !!quickEnh[_qeType].sel[i.uid];
        el.innerHTML = `<div class="flex items-center justify-between gap-2">${_rowInner}<input type="checkbox" class="pointer-events-none w-4 h-4 mr-1 flex-shrink-0" ${_checked ? 'checked' : ''}></div>`;
        if (_checked) el.className += ' ring-2 ring-blue-500/70';
        el.onclick = () => toggleQuickItem(_qeType, i.uid);
    } else if (quickJunk[_qjType].active && _qjCanSelect(d, i, _qjType)) {   // 🗑️ v3.5.87 同上：noJunk 物品不再顯示可勾
        let _checked = !!quickJunk[_qjType].sel[i.uid];
        el.innerHTML = `<div class="flex items-center justify-between gap-2">${_rowInner}<input type="checkbox" class="pointer-events-none w-4 h-4 mr-1 flex-shrink-0" ${_checked ? 'checked' : ''}></div>`;
        if (_checked) el.className += ' ring-2 ring-amber-500/70';
        el.onclick = () => toggleQuickJunkItem(_qjType, i.uid);
    } else {
        el.innerHTML = _rowInner;
        // 🖱️ v3.0.38 雙擊快速操作（用戶要求）：可使用型道具（藥水/卷軸/技能書/有效果的 misc）雙擊直接使用、
        //    裝備（武器/防具/飾品）雙擊直接裝備（equipItem 內建 checkCanEquip 職業判定）。
        //    單擊延遲 230ms 才開 Modal（雙擊時取消·同 js/19 裝備視窗側欄 clickTimer 模式）；回憶蠟燭維持單擊進配點重置（排除雙擊使用）。
        const _dblAct = (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') ? 'equip'
            : ((i.id !== 'candle' && (d.type === 'pot' || d.type === 'skillbk' || d.type === 'scroll' || (d.type === 'misc' && d.eff && !d.noUse))) ? 'use' : null);
        if (_dblAct) {
            el.onclick = () => { clearTimeout(window._invClickTimer); window._invClickTimer = setTimeout(() => openModal(i, false), 230); };
            el.ondblclick = (ev) => {
                clearTimeout(window._invClickTimer);
                ev.preventDefault(); ev.stopPropagation();
                if (_dblAct === 'equip') equipItem(i); else useItem(i.uid);
            };
        } else {
            // 保留點擊開啟 Modal 功能 (所有項目皆可點擊)
            el.onclick = () => openModal(i, false);
        }
    }
    
    // 🎯 物品分流邏輯
    if (d.type === 'wpn') {
        wDiv.appendChild(el); 
    } else if (d.type === 'arm' || d.type === 'acc') {
        aDiv.appendChild(el); 
    } else {
        iDiv.appendChild(el); 
    }
});
    // 🎨 v3.0.40 1.8 物品介面：保留原清單事件與功能，只把內容搬入八格皮膚的可捲動區。
    [eDiv,wDiv,aDiv,iDiv].forEach(decorateClassicInventoryTab);

    // 🎨 技能欄使用新版 4×6 皮膚（技能欄位.png·tier strip 導覽·底部 S.power=魔法傷害/M.resist=MR）。
    //    取代原「依學習來源分組 ICON」排版；仍走 data-tip-skill tooltip、manualCast、updateSummonLock。
    let sDiv = document.getElementById('tab-skill');
    renderClassicSkillBook(sDiv);
    // 還原各分頁捲動位置
    ['tab-items','tab-weapons','tab-armors','tab-equip','tab-skill'].forEach(id => { let el = document.getElementById(id); if(el && _scroll[id] != null) { let sc=el.querySelector('.classic-inventory-viewport,.classic-skill-grid-scroll'); if(sc)sc.scrollTop=_scroll[id]; else el.scrollTop=_scroll[id]; } });   // 🎨 v3.0.40 1.8皮膚：捲動位置還原到內層 viewport（技能頁為 .classic-skill-grid-scroll）
    updateSummonLock();
    if (typeof refreshEquipmentWindow === 'function') refreshEquipmentWindow();
}

// 🎨 v3.0.40 1.8 風格道具欄皮膚（移植自參考版）：把分頁內容搬進「八格框底圖」的可捲動 viewport，
//    工具列（負重/快速強化/快速廢品 sticky 列）保留在 viewport 外恆顯。列事件（點擊/雙擊）掛在 .list-item 上不受影響。
// 🔧 v3.0.92 背包排序選單(↕)開啟狀態持久化：原本 .open class 只掛在每次 renderTabs 重建的 DOM 上→掛機掉物(gainItem→renderTabs)＋自動販賣(每10秒 renderTabs(true))不斷重建此選單、一直把它關掉，導致無法點選分類。改存模組旗標·重建時復原·點選排序或點選單外關閉。
let _invSortMenuOpen = false;
if (typeof document !== 'undefined' && document.addEventListener && !document._invSortOutsideBound) {
    document.addEventListener('click', function(ev){
        if (!_invSortMenuOpen) return;
        if (ev.target && ev.target.closest && ev.target.closest('.classic-sort-wrap')) return;   // 點在 ↕ 鈕或選單本體內→不關
        _invSortMenuOpen = false;
        try { document.querySelectorAll('.classic-sort-menu.open').forEach(function(m){ m.classList.remove('open'); }); } catch(e){}
    });
    document._invSortOutsideBound = true;
}
function decorateClassicInventoryTab(div){
    if(!div)return;
    div.classList.add('classic-inventory-tab');
    let shell=document.createElement('div');
    shell.className='classic-inventory-shell';
    let viewport=document.createElement('div');
    viewport.className='classic-inventory-viewport';
    Array.from(div.children).filter(x=>!x.classList.contains('classic-list-toolbar')&&!x.classList.contains('sticky')).forEach(x=>viewport.appendChild(x));
    // 新版底圖的可視格線為 4 欄 × 6 排＝24 格；更多內容保留在內部捲動區。
    let used=viewport.querySelectorAll('.list-item,.classic-grid-empty').length;   // 🦴 v3.1.75 裝備欄會自行插入 .classic-grid-empty 填充格（把遺骸推到最後兩排）→ 一併計入，否則這裡會重複補格撐出第 9 排
    for(let n=used;n<CLASSIC_PAGE_CELLS;n++){
        let empty=document.createElement('div');
        empty.className='classic-grid-empty';
        empty.setAttribute('aria-hidden','true');
        viewport.appendChild(empty);
    }
    let up=document.createElement('button');
    up.type='button'; up.className='classic-inventory-scroll classic-inventory-scroll-up'; up.setAttribute('aria-label','向上捲動');
    up.onclick=()=>viewport.scrollBy({top:-Math.max(32,viewport.clientHeight/CLASSIC_GRID_ROWS),behavior:'smooth'});
    let down=document.createElement('button');
    down.type='button'; down.className='classic-inventory-scroll classic-inventory-scroll-down'; down.setAttribute('aria-label','向下捲動');
    down.onclick=()=>viewport.scrollBy({top:Math.max(32,viewport.clientHeight/CLASSIC_GRID_ROWS),behavior:'smooth'});
    let sortWrap=document.createElement('div');
    sortWrap.className='classic-sort-wrap';
    let sortBtn=document.createElement('button');
    sortBtn.type='button'; sortBtn.className='classic-sort-button'; sortBtn.title='整理背包'; sortBtn.setAttribute('aria-label','整理背包'); sortBtn.textContent='↕';
    let sortMenu=document.createElement('div');
    sortMenu.className='classic-sort-menu';
    if(_invSortMenuOpen)sortMenu.classList.add('open');   // 🔧 v3.0.92 重繪時依持久旗標復原開啟（掛機掉物/自動販賣不再關閉）
    let mode=inventorySortMode();
    sortMenu.innerHTML=`<button type="button" data-sort="category" class="${mode==='category'?'active':''}">分類整理</button><button type="button" data-sort="quality" class="${mode==='quality'?'active':''}">品質整理</button><button type="button" data-sort="name" class="${mode==='name'?'active':''}">名稱整理</button><label><input type="checkbox" ${player.inventoryAutoSort===false?'':'checked'}> 取得物品時自動整理</label>`;
    sortBtn.onclick=(ev)=>{ev.stopPropagation();_invSortMenuOpen=!_invSortMenuOpen;sortMenu.classList.toggle('open',_invSortMenuOpen);};
    sortMenu.querySelectorAll('[data-sort]').forEach(b=>b.onclick=(ev)=>{ev.stopPropagation();_invSortMenuOpen=false;setInventorySortMode(b.dataset.sort);});
    let auto=sortMenu.querySelector('input');if(auto)auto.onchange=()=>toggleInventoryAutoSort(auto.checked);
    sortWrap.appendChild(sortBtn);sortWrap.appendChild(sortMenu);
    shell.appendChild(viewport); shell.appendChild(up); shell.appendChild(down); shell.appendChild(sortWrap);
    let quick=Array.from(div.children).find(x=>x.classList.contains('sticky'));
    if(quick)quick.classList.add('classic-list-toolbar');
    div.appendChild(shell);
}

// ===== 召喚類技能互斥：迷魅 / 召喚 / 造屍 / 召喚屬性精靈 / 召喚強力屬性精靈 同時只能開啟一個 =====
const SUMMON_BUFF_IDS = ['sk_zombie', 'sk_summon', 'sk_elf_summon', 'sk_elf_summon2'];
function summonBuffChecked() {
    for (let id of SUMMON_BUFF_IDS) { let c = document.getElementById('auto-sk-' + id); if (c && c.checked) return id; }
    return null;
}
function updateSummonLock() {
    let checkedBuff = summonBuffChecked();
    // 4 個召喚增益勾選框：已勾選一個→其餘三個鎖定（迷魅可與召喚並存，不互鎖）
    SUMMON_BUFF_IDS.forEach(id => {
        let c = document.getElementById('auto-sk-' + id);
        if (!c) return;
        let unavail = c.dataset.unavail === '1';
        let lock = checkedBuff ? (checkedBuff !== id) : false;
        c.disabled = unavail || lock;
        let lbl = c.closest('label');
        if (lbl) lbl.classList.toggle('opacity-50', unavail || lock);
    });
    // 迷魅按鈕：不再被召喚鎖定（可並存），僅受自身等級/條件限制
    let charmBtn = document.getElementById('manual-btn-sk_charm');
    if (charmBtn) {
        let unavail = charmBtn.dataset.unavail === '1';
        charmBtn.disabled = unavail;
        charmBtn.classList.toggle('opacity-50', unavail);
        charmBtn.classList.toggle('cursor-not-allowed', unavail);
    }
}
function onSummonToggle(sid) {
    let c = document.getElementById('auto-sk-' + sid);
    if (c && c.checked) {
        // 4 召喚互斥：只能勾一個，取消其他三個（不影響迷魅，可並存）
        SUMMON_BUFF_IDS.forEach(id => { if (id !== sid) { let o = document.getElementById('auto-sk-' + id); if (o) o.checked = false; } });
    } else {
        // 🔧 取消打勾：該召喚狀態馬上結束（不等增益自然倒數 3600 秒）
        player.buffs[sid] = 0;
        if (player.summon && player.summon.skId === sid) {
            logCombat(`<span class="text-purple-300">${player.summon.n}</span> 消失了。`, 'magic', 'summon');
            player.summon = null;
            calcStats();
            renderStatusEffects();
        }
        if (typeof summonV2DismissAll === 'function' && ((player._summonV2Sk || 'sk_summon') === sid)) summonV2DismissAll();   // 🧙 v3.2.21 召喚類 v2（召喚術/造屍術/屬性精靈）：取消勾選當前生效的召喚→全數解散＋關閉自動重施
        if (sid === 'sk_zombie' && typeof necroDismissOwner === 'function') necroDismissOwner(player);
    }
    updateSummonLock();
}
// 🐉 覺醒互斥（無覺醒精通）：勾選一種覺醒 → 自動取消另外兩種，並重繪（重繪會把未勾選的兩種設為 disabled 鎖定）；有覺醒精通(k_awaken)則三種可並存、不鎖
function onAwakenToggle(sid) {
    let c = document.getElementById('auto-sk-' + sid);
    if (c && c.checked && player.mastery !== 'k_awaken') {
        ['sk_dragon_awaken_antares','sk_dragon_awaken_falion','sk_dragon_awaken_baraka'].forEach(id => {
            if (id !== sid) { let o = document.getElementById('auto-sk-' + id); if (o) o.checked = false; }
        });
    } else if (c && !c.checked) {
        endAutoBuffNow(sid);   // 🔧 取消打勾：該覺醒立即結束（不等自然倒數；HP/MP 消耗也隨之停止）
    }
    renderSkillSelects();
}
// 🔧 取消打勾即「立即結束」對應的自動輔助增益（不等自然倒數）。回傳是否真的結束了某效果。供 buff 技能 / HoT 治癒 / 覺醒 共用。
function endAutoBuffNow(sid) {
    let sk = DB.skills[sid]; if (!sk) return false;
    let ended = false;
    if (sk.type === 'heal' && sk.autoBuff) {   // HoT 治癒（體力回復術/生命的祝福）：清掉該技能的團隊持續回復（全隊一併停止該 HoT）
        if (player.hots && player.hots[sid]) { delete player.hots[sid]; ended = true; }
    } else {   // 一般 buff 技能（立方/火牢/冰雪颶風/日光/暗隱/力盔敏盔/覺醒…）：歸零該增益計時
        if ((player.buffs[sid] || 0) > 0) { player.buffs[sid] = 0; ended = true; }
    }
    if (ended) { if (typeof calcStats === 'function') calcStats(); if (typeof renderStatusEffects === 'function') renderStatusEffects(); if (typeof updateUI === 'function') updateUI(); }
    return ended;
}
// 一般 buff/HoT 勾選框（auto-sk-*，非召喚/覺醒/淨化）的 onchange：取消打勾即立即結束
function onAutoBuffToggle(sid) {
    let c = document.getElementById('auto-sk-' + sid);
    if (!c) return;
    if (c.checked && (sid === 'sk_holy_dash' || sid === 'sk_elf_winddash')) {
        let other = sid === 'sk_holy_dash' ? 'sk_elf_winddash' : 'sk_holy_dash';
        let o = document.getElementById('auto-sk-' + other);
        if (o) o.checked = false;
        endAutoBuffNow(other);
    } else if (!c.checked) {
        endAutoBuffNow(sid);
    }
}
// 🔧 藥水/卷軸類維持型增益（靜態勾選框 set-*）：取消打勾即立即結束對應 buff（不等自然倒數）。於 window.onload 掛一次（勾選框是靜態 DOM、持久存在）。
const POTION_BUFF_ENDERS = [['set-haste','haste'],['set-brave','brave'],['set-blue','blue'],['set-cautious','cautious'],['set-elfcookie','elfcookie'],['set-poly','poly'],['set-magicbarrier','sk_magic_shield']];
function wireBuffEnders() {
    POTION_BUFF_ENDERS.forEach(function(pair){
        let el = document.getElementById(pair[0]);
        if (el && !el._buffEnderWired) {
            el._buffEnderWired = true;
            el.addEventListener('change', function(){
                if (!el.checked && player.buffs && (player.buffs[pair[1]] || 0) > 0) {
                    player.buffs[pair[1]] = 0;   // 🔧 取消打勾：加速/勇敢/慎重/精靈餅乾/變身/魔法護盾立即失效（變身會在 calcStats 還原原形）
                    if (typeof calcStats === 'function') calcStats();
                    if (typeof renderStatusEffects === 'function') renderStatusEffects();
                    if (typeof updateUI === 'function') updateUI();
                }
            });
        }
    });
}

function renderSkillSelects() {
    if (typeof _deferItemTransactionEffect === 'function' && _deferItemTransactionEffect(renderSkillSelects, arguments)) return;
    // 先記住目前選擇，重建後還原（避免穿脫裝備/學技能等呼叫時被重設為「無」）
    let prevAtk = document.getElementById('sel-atk-skill') ? document.getElementById('sel-atk-skill').value : '';
    let prevHeal = document.getElementById('sel-heal-skill') ? document.getElementById('sel-heal-skill').value : '';
    let prevConvert = document.getElementById('sel-convert-skill') ? document.getElementById('sel-convert-skill').value : '';
    let aHtml = '<option value="">無</option>', hHtml = '<option value="">無</option>', cHtml = '<option value="">無</option>';
    let buffHtml = '';
    let sortedSkills = [...player.skills].filter(s => DB.skills[s] && !DB.skills[s].procOnly).sort((a,b) => DB.skills[a].tier - DB.skills[b].tier);   // 🏛️ 過濾 procOnly（惡魔之吻等純武器proc：不顯示於施放下拉/勾選）
    
    sortedSkills.forEach(sid => {
        let sk = DB.skills[sid];
        let skillDisplayName = (sid === 'sk_zombie' && player.eq && player.eq.shield && player.eq.shield.id === 'relic_necro_book') ? '骷髏復生' : sk.n;
        let isAvail = true;
        let __granted = player.grantedSkills && player.grantedSkills.includes(sid);
        let needLv = skillReqLv(sk, sid);   // 🏅 集中化：含魔導精通特例
        if(!__granted && (needLv === undefined || player.lv < needLv)) isAvail = false;
        if(!__granted && sk.reqEle && player.elfEle !== sk.reqEle) isAvail = false;
        if(!__granted && sk.reqEleAny && !player.elfEle) isAvail = false;
        
        let dis = isAvail ? '' : 'disabled class="text-slate-500"';
        
        if(sk.type === 'atk' && !sk.healSlot) aHtml += `<option value="${sid}" ${dis}>${skillDisplayName}</option>`;
        if((sk.type === 'heal' && !sk.autoBuff && !['sk_antidote','sk_holy_light','sk_cancel'].includes(sid)) || (sk.type === 'atk' && sk.healSlot)) hHtml += `<option value="${sid}" ${dis}>${skillDisplayName}</option>`;
        let __isPurify = (sid === 'sk_antidote' || sid === 'sk_holy_light' || sid === 'sk_cancel');
        if(sk.type === 'buff' || (sk.type === 'heal' && sk.autoBuff) || __isPurify) {
            let checked = document.getElementById(`auto-sk-${sid}`)?.checked ? 'checked' : '';
            let sumAttr = sk.summon ? ` onchange="onSummonToggle('${sid}')" data-summon="1" data-unavail="${isAvail?'0':'1'}"` : '';
            // 魔法相消術涵蓋解毒術與聖潔之光：勾選相消時鎖定這兩者
            let __cancelOn = player.skills.includes('sk_cancel') && document.getElementById('auto-sk-sk_cancel')?.checked;
            let __locked = (sid === 'sk_antidote' || sid === 'sk_holy_light') && __cancelOn;
            // 🐉 覺醒互斥（無覺醒精通）：已勾選一種覺醒時，鎖定另外兩種「未勾選」的覺醒；已勾選那一個維持可點以便取消
            let __awakenLocked = sk.awaken && player.mastery !== 'k_awaken' && !document.getElementById('auto-sk-'+sid)?.checked && ['sk_dragon_awaken_antares','sk_dragon_awaken_falion','sk_dragon_awaken_baraka'].some(a => document.getElementById('auto-sk-'+a)?.checked);
            let __awakenAttr = sk.awaken ? ` onchange="onAwakenToggle('${sid}')"` : '';
            let __dis = (!isAvail || __locked || __awakenLocked) ? 'disabled' : '';
            let __purAttr = (sid === 'sk_cancel') ? ` onchange="renderSkillSelects()"` : '';
            // 🔧 一般 buff / HoT 治癒（非召喚/覺醒/淨化）：取消打勾即立即結束（召喚/覺醒已各自有 onchange；淨化為反應式無常駐增益）
            let __autoBuffAttr = (!__isPurify && !sk.summon && !sk.awaken && (sk.type === 'buff' || (sk.type === 'heal' && sk.autoBuff))) ? ` onchange="onAutoBuffToggle('${sid}')"` : '';
            let __span = __isPurify ? 'text-teal-300' : 'text-purple-300';
            let __ttl = __locked ? ' title="魔法相消術已涵蓋此效果"' : (__awakenLocked ? ' title="同時只能使用一種覺醒（需「覺醒精通」才能三種並用）"' : '');
            // 🧙 v3.2.19 召喚術 v2：有召喚控制戒指→技能清單可點「選擇」開召喚物選單（無戒指顯示預設怪名）
            let __sumSel = '';
            if (sid === 'sk_summon' && isAvail && typeof summonV2ActiveForm === 'function') {
                let __ring = (typeof hasSummonCtrlRing === 'function') && hasSummonCtrlRing(player);
                let __cur = summonV2ActiveForm() || '—';
                __sumSel = __ring
                    ? ` <button onclick="openSummonSelect()" class="text-cyan-300 underline" style="font-size:11px;" title="召喚控制戒指：挑選召喚物">［${__cur}▾］</button>`
                    : ` <span class="text-slate-500" style="font-size:11px;" title="裝備召喚控制戒指可挑選召喚物">［${__cur}］</span>`;
            }
            buffHtml += `<label class="cursor-pointer flex items-center gap-2 ${(isAvail && !__locked && !__awakenLocked)?'':'opacity-50'}"${__ttl}><input type="checkbox" id="auto-sk-${sid}" ${checked} ${__dis}${sumAttr}${__awakenAttr}${__purAttr}${__autoBuffAttr}> <span class="${__span}">${skillDisplayName}</span>${__sumSel}</label>`;
        }
        if(sk.type === 'convert') {
            if (needLv !== undefined) cHtml += `<option value="${sid}" ${dis}>${sk.n}</option>`;   // 🔧 該職業無法學習的轉換技直接不顯示（如法師的心靈轉換/魂體轉換）；等級未達者仍顯示為灰字
        }
    });
    
    document.getElementById('sel-atk-skill').innerHTML = aHtml;
    document.getElementById('sel-heal-skill').innerHTML = hHtml;
    // 還原先前選擇（該技能選項仍存在才還原；已不可用則自然回到「無」）
    let _atkEl = document.getElementById('sel-atk-skill');
    let _healEl = document.getElementById('sel-heal-skill');
    if(prevAtk && _atkEl.querySelector(`option[value="${prevAtk}"]`)) _atkEl.value = prevAtk;
    if(prevHeal && _healEl.querySelector(`option[value="${prevHeal}"]`)) _healEl.value = prevHeal;
    let _convEl = document.getElementById('sel-convert-skill');
    if(_convEl) {
        _convEl.innerHTML = cHtml;
        if(prevConvert && _convEl.querySelector(`option[value="${prevConvert}"]`)) _convEl.value = prevConvert;
    }
    let _convRow = document.getElementById('ui-convert-row');
    if(_convRow) _convRow.classList.toggle('hidden', player.cls !== 'elf' && player.cls !== 'mage' && !(player.cls === 'royal' && hasMastery('k_royal_magic')));   // 🔧 轉換技能設置開放給法師/妖精；👑 王族（魔法精通）也開放以使用魔力奪取
    document.getElementById('auto-buff-skills').innerHTML = buffHtml;
    updateSummonLock();
    if (typeof wireBuffEnders === 'function') wireBuffEnders();   // 🔧 確保藥水/卷軸維持型增益勾選框已掛「取消打勾即結束」監聽（_buffEnderWired 守衛→重複呼叫零成本）
}

// 1. 定義輔助函數 (請確保它在 openModal 外面或上方)
function formatBonus(val) {
    return val >= 0 ? `+${val}` : `${val}`;
}

// 武器種類標籤（單手劍 / 武士刀 / 匕首）；武士刀與瑟魯基之劍同時具單手劍與武士刀
const WEAPON_TAGS = {
    wpn_katana: ['單手劍','武士刀'], wpn_siruge: ['單手劍','武士刀'], wpn_golden_scepter: ['單手劍','武士刀'],   // 👑 黃金權杖：反擊＋居合（雙標籤·裝真盾→反擊、無盾→居合）
    wpn_dagger2: ['匕首'], wpn_dagger1: ['匕首'], wpn_11: ['匕首'], wpn_33: ['匕首'],
    wpn_longsword: ['單手劍'], wpn_9: ['單手劍'], wpn_scimitar: ['單手劍'], wpn_26: ['單手劍'], wpn_damascus: ['單手劍'],
    wpn_elfsword: ['單手劍'], wpn_27: ['單手劍'], wpn_shortsword: ['單手劍'], wpn_redknight: ['單手劍'],
    wpn_invader: ['單手劍'], wpn_34: ['單手劍'], wpn_35: ['單手劍'],
    wpn_36: ['單手劍'], wpn_rapier: ['單手劍'], wpn_mailbreaker: ['單手劍'], wpn_silversword: ['單手劍'], wpn_37: ['單手劍'],
    wpn_21: ['矛'], wpn_24: ['矛'], wpn_25: ['矛'], wpn_28: ['矛'], wpn_39: ['矛'], wpn_40: ['矛'], wpn_41: ['矛'], wpn_17: ['矛'], wpn_4: ['矛'], wpn_halberd: ['矛'],   // 🔱 法丘：雙手矛（w2h＋穿透80%）
    wpn_6: ['矛'], wpn_7: ['矛'], wpn_12: ['矛'], wpn_15: ['矛'], wpn_18: ['矛'],   // 🔱 v3.5.8 補齊天堂槍類漏標：巴迪須/柴刀/貝卡合金/吉薩原掉「雙手劍」fallback、露西錘被「錘」字誤歸雙手鈍器→動態/攻速/出血全錯（穿透 eff＝矛系標配可佐證）
    wpn_14: ['矛'], wpn_16: ['矛'], wpn_demonking_spear: ['矛'], wpn_ancient_spear: ['矛'],   // 🔱 v3.5.8 闊矛/戟/惡魔王矛/古代神之槍：家族原靠名稱 regex 已對·補 tag 讓 weaponHasBleed 一致取得矛系出血
    relic_bk_lance: ['矛'],   // 🏺 v3.5.27 黑騎士的精銳長槍：單手矛（無 w2h→矛系出血·無穿透·符合 v3.5.20 規則）
    // 🏺 v3.6.44 遺物第十九批武器 tag（鎖鏈劍 relic_cold_blueflame 靠 chainsword 旗標自判免 tag）
    relic_earthshatter_sword: ['單手劍'], relic_gale_fistblade: ['鋼爪'], relic_hellfire_hammer: ['單手鈍器'], relic_blood_ritual_dagger: ['匕首'],
    relic_scorch_greatsword: ['雙手劍'], relic_bloodknight_dual: ['雙刀'], relic_elmo_spear: ['矛'],
    // 🏺 v3.6.47 遺物第二十批（鎖鏈劍 relic_lava_nozzle 靠 chainsword 旗標自判免 tag；雙手鈍器 tag 自帶貫穿）
    relic_crusher_hammer: ['雙手鈍器'],
    // 🏺 v3.7.20 遺物第二十二批武器 tag：瞥視=雙手鈍器；漆黑之劍=反擊＋居合雙標籤（裝真盾→反擊、無盾→居合·黃金權杖先例）；巨劍/鐮刀=雙手劍（切割走 eff:cleave）
    relic_maze_demon_glare: ['雙手鈍器'], relic_warrior_blackblade: ['單手劍', '武士刀'],
    relic_elmore_greatsword: ['雙手劍'], relic_beheading_scythe: ['雙手劍'],
    // 🏺 v3.7.52 遺物第二十三批武器 tag：邪惡利牙=雙刀（雙擊）；魔劍士之刀/死騎劍=反擊＋居合雙標籤（黃金權杖先例）；真‧屠龍劍=雙手劍（切割走 eff:cleave）
    relic_serrated_fangs: ['雙刀'], relic_mageblade_knife: ['單手劍', '武士刀'],
    relic_true_dragonslayer: ['雙手劍'], relic_flame_dk_sword: ['單手劍', '武士刀'],
    wpn_20: ['單手鈍器'], wpn_10: ['單手鈍器'], wpn_13: ['單手鈍器'], wpn_alien: ['單手鈍器'], wpn_1: ['單手鈍器'], wpn_2: ['單手鈍器'], wpn_ancient_axe: ['單手鈍器'], wpn_warrior_trial_axe: ['單手鈍器'], wpn_master_axe: ['單手鈍器'], wpn_demon_axehead: ['單手鈍器'], wpn_iron_axehead: ['單手鈍器'], wpn_giant_axehead: ['單手鈍器'],   // 🔧 古代神之斧／試煉斧頭／大匠的斧頭／魔物的斧頭／鐵斧頭／巨人的斧頭：單手鈍器（鈍擊）
    wpn_2hsword: ['雙手劍'], wpn_dragonslayer: ['雙手劍'], wpn_official_2h: ['雙手劍'],   // 🔧 雙手劍類型標註
    // 🔧 重擊特效武器標註為「雙手鈍器」
    wpn_battleaxe: ['雙手鈍器'], wpn_19: ['雙手鈍器'], wpn_23: ['雙手鈍器'], wpn_giantaxe: ['雙手鈍器'], wpn_berserker: ['雙手鈍器'], wpn_silveraxe: ['雙手鈍器'], wpn_taurus_axe: ['雙手鈍器'],   // 🔧 牛人斧頭：補上漏標的雙手鈍器 tag（eff:crush 但原無 tag）
    // 🔧 黑暗妖精武器：鋼爪 / 雙刀 / 匕首
    wpn_claw_bronze:['鋼爪'], wpn_claw_steel:['鋼爪'], wpn_claw_shadow:['鋼爪'], wpn_claw_silver:['鋼爪'], wpn_claw_dark:['鋼爪'], wpn_claw_gloom:['鋼爪'], wpn_claw_damascus:['鋼爪'], wpn_claw_abyss:['鋼爪'],
    wpn_baranka_claw:['鋼爪'], wpn_baranka_steelclaw:['鋼爪'],   // 🔧 魔獸軍王雙爪（鋼爪類）
    wpn_blood_2hsword:['雙手劍'], wpn_dark_sword:['單手劍'],   // 🔧 冥法軍訓練場：血色巨劍(切割)／黑暗之劍(反擊)
    wpn_dk_flameblade:['單手劍'], wpn_kurt_sword:['單手劍'],   // 🔧 傳說單手劍（反擊）：死亡騎士的烈炎之劍／克特之劍
    wpn_assassin_mark:['雙刀'],   // 🔧 暗殺軍王之痕（雙刀・連擊）
    wpn_dual_bronze:['雙刀'], wpn_dual_steel:['雙刀'], wpn_dual_silver:['雙刀'], wpn_dual_gloom:['雙刀'], wpn_dual_dark:['雙刀'], wpn_dual_shadow:['雙刀'], wpn_dual_damascus:['雙刀'], wpn_dual_abyss:['雙刀'], wpn_thebes_dual:['雙刀'],
    wpn_rond_dual:['雙刀'],   // 🗡️ v3.4.33 倫得雙刀（雙刀・雙擊33/貫穿/5% 復仇尖石）
    wpn_manadagger:['匕首'], wpn_crystal_dagger:['匕首'],
    wpn_chaos_thorn:['匕首'], wpn_demonking_dual:['雙刀'], wpn_demonking_2hsword:['雙手劍'],   // 🌑 暗影神殿：混沌之刺(匕首/出血)、惡魔王雙刀(雙刀/連擊)、惡魔王雙手劍(雙手劍/切割)
    // 🔧 拉斯塔巴德掉落武器：匕首(出血)/單手劍(反擊)/雙刀(連擊)
    wpn_small_katana:['匕首'], wpn_dagger_rasta:['匕首'], wpn_sword_rasta:['單手劍'], wpn_dual_rasta:['雙刀'], wpn_spear_rasta:['矛'],
    wpn_dual_spike:['雙刀'], wpn_official_blade:['單手劍'],   // 🏛️ 長老之室：尖刺雙刀(連擊)／武官之刃(反擊)
    wpn_emperor_blade:['雙手劍'], wpn_windblade_dagger:['匕首'], wpn_redshadow_dual:['雙刀'], wpn_beastking_claw:['鋼爪'],   // 🏛️ 長老之室傳說：真.冥皇執行劍(切割)／風刃短劍(出血)／紅影雙刀(連擊)／獸王鋼爪(連擊)；聖晶魔杖=魔杖(免tag)
    // 🔥 50級試煉擴充武器標註
    wpn_mithril_dagger:['匕首'], wpn_ori_dagger:['匕首'], wpn_crimson_spear:['矛'], wpn_demon_axe:['雙手鈍器'],
    wpn_frost_spear:['矛'], wpn_thunder_sword:['單手劍'],   // 🧊 酷寒之矛（矛→出血）／⚡ 雷雨之劍（單手劍→反擊）
    wpn_vengeance:['雙手劍'], wpn_blackflame_sword:['單手劍','武士刀'], wpn_hate_claw:['鋼爪'], wpn_demon_claw:['鋼爪'], wpn_death_finger:['鋼爪'],
    wpn_demon_sword:['單手劍'], wpn_redflame_sword:['單手劍','武士刀'], wpn_demon_dual:['雙刀'],
    wpn_dual_destroy:['雙刀'], wpn_claw_destroy:['鋼爪'],   // 💥 破壞雙刀／破壞鋼爪（猛爆劇毒）
    wpn_old_sword:['單手劍','武士刀'],   // 🏛️ 古老的劍：反擊(單手劍)＋居合(武士刀)
    wpn_cursed_emperor_blade:['單手劍','武士刀'],   // 🌑 v3.4.0 受詛咒的真．冥皇執行劍：反擊(單手劍)＋居合(武士刀)·貫穿=ignHardSkin·裝備變身死亡騎士(js/02)
    wpn_uncursed_emperor_blade:['單手劍','武士刀'],   // 🌑 v3.4.67 解除詛咒的真死亡騎士．冥皇執行劍：反擊(單手劍)＋居合(武士刀)·貫穿=ignHardSkin·裝備變身真死亡騎士 冥皇丹特斯(js/02)·對地/風敵×1.4·大地崩裂 proc
    wpn_ancient_darkelf_sword:['單手劍'],   // 🏛️ 古代黑暗妖精之劍：反擊(單手劍)
    wpn_demon_sword_hidden:['單手劍'],   // 👹 隱藏的魔族之劍：反擊(單手劍)
    wpn_demon_claw_hidden:['鋼爪'],   // 👹 隱藏的魔族鋼爪：鋼爪標籤(雙擊33預設＋貫穿＋黑暗妖精可裝)
    // 🏴‍☠️ 海賊島武器：血紅慾望短劍(匕首/出血)、榮耀之劍/短刀/海賊彎刀(單手劍/反擊)、深淵雙刀(雙刀/雙擊)
    wpn_pirate_dagger:['匕首'], wpn_glory_sword:['單手劍'], wpn_pirate_shortblade:['單手劍'], wpn_pirate_cutlass:['單手劍'], wpn_abyss_dualblade:['雙刀'],
    // ⚡ 元素施放傳說武器：雷神之鎚／歐西斯衝撞錘(單手鈍器·鈍擊)・馬普勒的懲罰(雙手鈍器·重擊)・帕格里奧之怒／伊娃的責罵(單手劍·反擊)
    wpn_thor_hammer:['單手鈍器'], wpn_osis_hammer:['單手鈍器'], wpn_mapler_punish:['雙手鈍器'], wpn_pagrio_wrath:['單手劍'], wpn_eva_scold:['單手劍'],
    // 🏺 遺物武器：石刃(單手劍)／木棍・骨棒(單手鈍器)／犬齒(匕首)（弓・魔杖遺物免 tag：isBow／isWand 自判）
    relic_goblin_blade:['單手劍'], relic_gremlin_club:['單手鈍器'], relic_husky_bone:['單手鈍器'], relic_doberman_fang:['匕首'],
    relic_gladiator_scimitar:['單手劍'], relic_icefield_pick:['單手鈍器'], relic_werewolf_mace:['單手鈍器'], relic_orc_nail:['匕首'], relic_pan_staff:['矛'], relic_elastic_rib:['雙刀'],
    relic_golem_fist:['雙手鈍器'], relic_orc_cleaver:['單手劍'], relic_strong_femur:['單手鈍器'], relic_forgotten_spear:['矛'], relic_spider_claw:['鋼爪'], relic_hobgoblin_grinder:['單手劍'], relic_orc_butcher:['單手劍'], relic_orc_pole:['矛'], relic_sparta_grudge:['雙刀'], relic_shark_teeth:['匕首'],
    // 🏺 遺物 第二批（v3.1.1）：單手矛/雙手矛(看 w2h)＝矛、鋼爪、雙手劍；鎖鏈劍(chainsword)/奇古獸(qigu)/弓(isBow)/魔杖(isWand) 靠旗標自判免 tag
    relic_guard_spear:['矛'], relic_crab_claw:['鋼爪'], relic_venom_fang:['雙手劍'], relic_ratman_skewer:['矛'], relic_lizardman_cleaver:['矛'],
    // 🏺 遺物 第三批（v3.1.2）：弓/十字弓(isBow)、單手魔杖(isWand) 靠旗標自判免 tag
    relic_ohm_maul:['雙手鈍器'], relic_parrot_beak:['雙手劍'], relic_pirate_scimitar:['單手劍'], relic_scorpion_sting:['匕首'], relic_harvey_claw:['單手劍'], relic_guard_pike:['矛'], relic_ogi_greataxe:['雙手鈍器'],
    // 🏺 遺物 第四批（v3.1.4）：鎖鏈劍(暗精靈鎖鏈劍)靠 chainsword 旗標自判免 tag
    relic_darkthief_claw:['鋼爪'], relic_fighter_axe:['雙手鈍器'],
    // 🏺 遺物 第五批（v3.1.6）：研磨利刃＝單手劍＋武士刀(反擊＋居合)；奇古獸(qigu·夢幻的蘑菇靈魂)靠旗標自判免 tag
    relic_darkelf_grindblade:['單手劍','武士刀'],
    // 🏺 遺物 第六批（v3.1.13）：幽光=單手劍+武士刀(反擊+居合)、喚獸鞭=單手鈍器(鈍擊)、獅鷲爪=鋼爪(雙擊)、鱷魚牙=雙手劍(切割靠 eff)、冰石鎚=雙手鈍器(重擊)；殘冰死亡氣息(魔杖·isWand)靠旗標自判免 tag
    relic_wisp_remnant:['單手劍','武士刀'], relic_summoner_whip:['單手鈍器'], relic_griffin_claw:['鋼爪'], relic_croc_fang:['雙手劍'], relic_icestone_maul:['雙手鈍器'],
    // 🏺 遺物 第七批（v3.1.18）：蛇女鱗片/刺針=匕首(出血)、牙籤/重型劍=雙手劍(切割靠 eff)、拋投石=雙手鈍器(重擊)、備用刀=雙刀(雙擊)；眼魔凝視(魔杖·isWand)＋雞蛇凝視(鎖鏈劍·chainsword)靠旗標自判免 tag
    relic_mutant_lamia_scale:['匕首'], relic_thorn_needle:['匕首'], relic_giant_toothpick:['雙手劍'], relic_veteran_greatsword:['雙手劍'], relic_giant_throwstone:['雙手鈍器'], relic_armor_spareblade:['雙刀'],
    relic_aruba_haste:['單手鈍器'], relic_ashwarrior_flamesword:['單手劍'], relic_deadgeneral_greatsword:['雙手劍'], relic_darkscorpion_pincers:['雙刀'],
    relic_medusa_stinger:['單手鈍器'], relic_silent_venom:['矛'],
    // 🏺 遺物 第十一批（v3.1.33）：牛頭怪的殘暴巨斧＝雙手鈍器（eff:crush 重擊＋tag 自動貫穿）
    relic_axetaurus_brutalaxe:['雙手鈍器'],
    // 🏺 遺物 第五批新增（v3.1.52）：灼熱蜥蜴長舌/殺人蜂尾刺(出血)、上古蜘蛛之爪=單手劍+武士刀(反擊+居合)、鎧甲守衛巨劍=雙手劍(切割靠 eff)；無所畏懼的突擊(chainsword)/幻夢火炎靈魂(qigu)/光束強化魔杖(isWand)/改造便利箭筒(isArrow) 靠旗標自判免 tag
    relic_lizard_tongue:['矛'], relic_killerbee_sting:['匕首'], relic_ancient_spider_claw:['單手劍','武士刀'], relic_guardian_greatsword:['雙手劍'],
    // 🐍 提卡爾：庫庫爾坎之矛/鞭笞藤/倒勾獠牙=矛(雙手矛·出血)、毒牙=匕首(出血)、易碎泥偶=雙手鈍器(重擊靠 eff+tag 自動貫穿)、玩具鎚=單手鈍器(鈍擊+自動貫穿)；鐵手甲/吹箭(isBow)/枯竭魔杖(名稱含杖)/獻祭亡靈(qigu) 靠旗標/名稱自判免 tag
    wpn_kukulkan_spear:['矛'], relic_eto_whip:['矛'], relic_serpent_fang:['矛'], relic_kaira_fang:['匕首'], relic_mud_idol:['雙手鈍器'], relic_teo_hammer:['單手鈍器'],
    // 🏺 遺物 第十三批（v3.1.80）：護身斧/恢復魔棒/流星鎚=單手鈍器(鈍擊＋自動貫穿)、串刺刑具=矛(出血·雙手)、方尖碑=雙手鈍器(重擊靠 eff＋自動貫穿)、刺劍=匕首(出血)、雙刃劍=雙刀(雙擊靠 eff)；
    //    彈弓(isBow)/雙尾鞭(chainsword)/熱情魔杖(名稱含魔杖→自動貫穿)/黑暗魔導書(isWand·名稱無杖字→def 顯式 ignHardSkin) 靠旗標/名稱自判免 tag
    relic_executor_axe:['單手鈍器'], relic_healer_wand:['單手鈍器'], relic_minotaur_flail:['單手鈍器'],
    relic_executor_skewer:['矛'], relic_weathered_obelisk:['雙手鈍器'], relic_shadow_stinger:['匕首'], relic_soulreaper_dual:['雙刀'],
    // 🏺 遺物 第十四批（v3.3.0）：兇殘惡鬼的毒牙/殘暴骸骨的破片=單手劍(反擊)、傳說海賊的迷幻雙刀=雙刀(雙擊)、熔岩灼燒的雙拳=單手鈍器(鈍擊＋自動貫穿)；屍毒之針(isBow)/不定形的變幻劍(chainsword) 靠旗標自判免 tag
    relic_ghoul_fang:['單手劍'], relic_sparto_shard:['單手劍'], relic_pirate_dual:['雙刀'], relic_lava_fists:['單手鈍器'],
    // 🏺 遺物 第十五批：爆焰＝雙手劍（切割）、撫摸＝鋼爪（雙擊）；兩把魔杖與弓由 isWand/isBow 旗標判定。
    relic_fireking_blast:['雙手劍'], relic_waterking_caress:['鋼爪'],
    // 🏺 遺物 第十六批：三頭釵＝鋼爪（雙擊）、金屬棍棒/灰燼之拳＝單手鈍器（鈍擊）、昆蟲巨鉗＝單手劍+武士刀（反擊+居合）、鐮刀破片＝雙手劍（切割靠 eff）；海洋水晶球(isWand)/迷你闇精靈(qigu)/十字弩弓(isBow) 靠旗標自判免 tag。
    relic_cerberus_pin:['鋼爪'], relic_dark_metal_club:['單手鈍器'], relic_ash_fist:['單手鈍器'], relic_ant_pincer:['單手劍','武士刀'], relic_reaper_scythe:['雙手劍'],
    // 🏺 遺物 第十七批：法師的護身短刀＝匕首（出血）；骸骨意志之弓由 isBow 旗標判定免 tag。
    relic_mage_dagger:['匕首'],
    // 🌅 日出之國：巨釜＝雙手鈍器（重擊）、尾刃＝單手劍+武士刀（反擊+居合）、斷角＝矛（noBleed 停出血）；羽扇 isBow／黑尾 chainsword／扇子·怒火 isWand 旗標判定免 tag。
    relic_sr_kettle_maul:['雙手鈍器'], relic_sr_kama_blade:['單手劍','武士刀'], relic_sr_ushioni_horn:['矛']
};
function getWeaponTags(id){
    let d = DB.items[id];
    if (d && d.relicBaseId !== undefined) {
        let baseId = d.relicBaseId, base = typeof baseId === 'string' && DB.items[baseId];
        if (!base || base.relic || base.relicBaseId !== undefined || base.type !== 'wpn') return [];
        id = baseId;
    }
    return WEAPON_TAGS[id] || [];
}
// ⚔️ 雙擊機率 comboRate：未明定者依武器標籤套預設（鋼爪 33% / 雙刀 25%）；個別武器可在 def 寫 comboRate 覆寫（底比斯歐西里斯雙刀30 / 死亡之指20 / 恨之鋼爪50 / 破壞雙刀·破壞鋼爪30）。日後新增 combo 武器自動取得預設機率。
Object.keys(DB.items).forEach(function(id){ let d = DB.items[id]; if (d && d.eff === 'combo' && d.comboRate == null) { let tg = getWeaponTags(id); d.comboRate = tg.includes('鋼爪') ? 33 : (tg.includes('雙刀') ? 25 : 0); } });
// 🗡️ 貫穿（ignHardSkin）批次標記（2026-06·用戶要求）：攻擊無視硬皮的額外物理減傷；一般＋經典皆生效（傷害公式旁路，非經典停用特效）。
// 涵蓋：所有單手/雙手鈍器、所有鋼爪(死亡之指除外)、所有鎖鏈劍、所有魔杖(排除黃金權杖)＋指定 10 雙刀／7 具名劍／5 特定武器。日後新增同類(鈍器/鋼爪/鎖鏈劍/魔杖)自動取得。
(function(){
    Object.keys(DB.items).forEach(function(id){
        let d = DB.items[id]; if (!d || d.type !== 'wpn') return;
        let tg = getWeaponTags(id);
        if (tg.includes('單手鈍器') || tg.includes('雙手鈍器') || tg.includes('鋼爪')) d.ignHardSkin = true;   // 所有鈍器＋鋼爪
        if (d.chainsword) d.ignHardSkin = true;                                                              // 所有鎖鏈劍
        if (/魔杖|法杖/.test(d.n) || (/杖/.test(d.n) && !/權杖/.test(d.n))) d.ignHardSkin = true;            // 所有魔杖（排除黃金權杖＝王族單手劍）
    });
    ['wpn_dual_dark','wpn_assassin_mark','wpn_dual_damascus','wpn_dual_gloom','wpn_dual_rasta','wpn_dual_abyss','wpn_demon_dual','wpn_thebes_dual','wpn_dual_destroy','wpn_demonking_dual',
     'wpn_ori_dagger','wpn_damascus','wpn_blackflame_sword','wpn_kurt_sword','wpn_demon_sword','wpn_vander_sword','wpn_demonking_2hsword',
     'wpn_18','wpn_16','wpn_halberd','wpn_12','wpn_crimson_spear'
    ].forEach(function(id){ if (DB.items[id]) DB.items[id].ignHardSkin = true; });   // 指定雙刀/具名劍/特定武器
    if (DB.items['wpn_death_finger']) delete DB.items['wpn_death_finger'].ignHardSkin;   // 鋼爪例外：死亡之指不加貫穿
    // 原型的指定 ID 與例外已處理完，最後同步固定遺物變體，避免漏掉指定劍／矛或誤加死亡之指。
    for (let id in DB.items) {
        let d = DB.items[id], baseId = d && d.relicBaseId;
        let base = typeof baseId === 'string' && DB.items[baseId];
        if (!base || base.relic || base.relicBaseId !== undefined || base.type !== 'wpn') continue;
        if (base.ignHardSkin) d.ignHardSkin = base.ignHardSkin;
        else delete d.ignHardSkin;
    }
    // 🔮 神官魔杖／惡魔王魔杖：兩版本都保留貫穿(ignHardSkin·無經典閘)＋魔爆(eff:magicburst·經典自動停用)。一般版＝貫穿+魔爆、經典版＝只剩貫穿(魔爆停用)
})();
// 🎮 經典模式：tooltip 不顯示已被停用的武器/盾牌特效字樣（共鳴/魔爆/連射/反擊/出血/穿透/切割/居合/魔擊/鈍擊/重擊/格檔）；連擊/月光爆裂/即死等未停用者照常顯示
const CLASSIC_HIDDEN_EFF_LABELS = ['共鳴','魔爆','連射','反擊','出血','穿透','切割','居合','魔擊','鈍擊','重擊','格檔','雙刃'];   // ⚔️ 雙刃＝雙刀 5% 傷害×2（經典停用）；鋼爪額外重擊以「重擊」開頭已涵蓋
function filterClassicEffLabels(effArr, d){ return (player && player.classicMode && !(d && d.classicOk)) ? effArr.filter(e => !CLASSIC_HIDDEN_EFF_LABELS.some(h => e.startsWith(h))) : effArr; }   // ⚔️ v3.2.38 classicOk 特例（黑虎的雙尾鞭）：經典模式特效照常顯示
function weaponHasBleed(id){ let d = DB.items[id]; if (d && d.noBleed) return false; let t = getWeaponTags(id); return t.includes('匕首') || (t.includes('矛') && !(d && d.w2h)); }   // 🩸 匕首與「單手矛」帶出血；雙手矛只有穿透不出血（用戶規則：雙手矛=穿透無出血／單手矛=出血無穿透）·noBleed 旗標仍可個別停用

// ⚔️ 武器資料欄位補充說明：集中處理「戰鬥中實際生效、但一般特效列沒有對應項目」的機制。
// 背包、裝備欄、圖鑑與潘朵拉市場 tooltip 共用，避免只在物品背景文字中含糊帶過。
function weaponPurposeLabels(d) {
    if (!d || d.type !== 'wpn') return [];
    const out = [];
    if (d.qigu) out.push('奇古獸攻擊（一般攻擊必定命中並視為魔法傷害，受MR減免；奇古獸精通時無視MR）');
    if (d.qiguProc === 'phantom') out.push('幻影衝擊 1%＋每強化1%（造成基礎80～160的無屬性魔法傷害，不受MR減免）');
    if (d.qiguProc === 'mindbreak') out.push('心靈破壞 1%＋每強化1%（以自身最大MP 5%為基礎魔法傷害，不消耗MP；奇古獸精通時無視MR）');
    if (d.mpRPerEn) out.push(`MP自然恢復每強化+${d.mpRPerEn}`);
    if (d.mdmgEnFrom7Max3) out.push('魔法傷害成長（+7起魔法傷害+1，之後每強化+1，最高+3）');
    if (d.equipHaste) out.push('裝備加速（常駐加速，與加速術／自我加速藥水不重疊）');
    if (d.dragonStrike) out.push(`龍的一擊 ${d.dragonStrike}%（每次一般攻擊皆判定且不論命中；對全體造成3D力量+30固定物理傷害）`);
    if (d.procBurstPoison) {
        let p = d.procBurstPoison;
        out.push(`猛爆劇毒 ${p.rateBase == null ? 1 : p.rateBase}%＋每強化${p.ratePerEn == null ? 1 : p.ratePerEn}%（每秒100點真實傷害，持續5秒，最多1層）`);
    }
    if (d.hardWear) out.push(`碎甲（命中時額外削減${d.hardWear}點硬皮）`);
    if (d.strawCurse) out.push(`稻草詛咒 ${d.strawCurse.rate}%（命中時附加${d.strawCurse.stacks || 3}層；後續每次受攻擊消耗1層並追加80點水屬性固定魔法傷害）`);
    if (d.stunHitBonus) out.push(`衝擊之暈強化（暈眩命中率+${d.stunHitBonus}%）`);
    if (d.vanderStunHit) out.push('范德劍術（施放衝擊之暈時，本次近距離命中+1）');
    if (d.shahaBow) out.push('沙哈之箭（裝備時自動提供不會消耗的專用箭矢，卸下弓時消失）');
    if (d.shahaArrow) out.push('無限箭矢（不會消耗；卸下沙哈之弓時消失）');
    return out;
}

// 🏺 遺物用途摘要：補足舊遺物只有背景敘述、玩家看不出實際用途的問題。
// 僅整理「一般特效列尚未涵蓋」的遺物專屬欄位；背包、裝備欄與圖鑑 tooltip 共用。
function relicPurposeLabels(d) {
    if (!d || !d.relic) return [];
    const out = [];
    const eleName = e => ({ fire:'火', water:'水', wind:'風', earth:'地', none:'無' }[e] || e || '指定');
    const skillName = id => (DB.skills[id] && DB.skills[id].n) || '技能';
    const pctText = v => `${Math.round(v * 100)}%`;

    if (d.reqAvatar) out.push(`裝備限制（僅限${d.reqAvatar}；其他角色無法裝備）`);
    if (d.petDmgReduce) out.push(`寵物護甲（裝備的寵物受到傷害-${Math.round(d.petDmgReduce * 100)}%）`);
    if (d.petBleed) out.push('寵物出血（一般攻擊命中疊加8秒出血；每層每秒造成該次傷害20%，最多5層）');
    if (d.armguard) out.push('臂甲（裝於副手，可與雙手武器並用）');
    if (d.resNone) out.push(`無屬性魔法抗性+${d.resNone}%`);
    if (d.mrPerWis) out.push(`精神屏障（每1點最終精神，MR+${d.mrPerWis}）`);
    if (d.type === 'wpn' && d.mr) out.push(`魔防(MR)+${d.mr}`);
    if (d.mcrit) out.push(`近距離爆擊率+${d.mcrit}%`);
    if (d.mcritDmg) out.push(`近距離爆擊傷害+${d.mcritDmg}%`);
    if (d.rcrit) out.push(`遠距離爆擊率+${d.rcrit}%`);
    if (d.abnormalResist) out.push(`異常狀態抵抗+${d.abnormalResist}%`);
    if (d.immStone) out.push('免疫石化');
    if (d.immPoison) out.push('免疫中毒');
    if (d.immParalyze) out.push('免疫麻痺');
    if (d.immBurn) out.push('免疫灼燒');
    if (d.immFreeze) out.push('免疫冰凍');
    if (d.atkSpdPct) out.push(`攻擊速度${d.atkSpdPct > 0 ? '+' : ''}${d.atkSpdPct}%`);
    if (d.hpRegenFaster) out.push(`快速再生（HP自然恢復間隔縮短${d.hpRegenFaster}秒）`);
    if (d.fireballBurst) out.push('爆裂火球（將已學會的「燃燒的火球」升級為威力更強的「爆裂的火球」）');
    if (d.noEvade) out.push('沉重代價（無法進行一般迴避；暗隱術的必定迴避不受影響）');
    if (d.summonCtrl) out.push('召喚控制（可指定召喚物；28～48級召喚上限由5隻提高至6隻）');
    if (d.autoReviveScroll) out.push('巨靈守護（傭兵或寵物死亡時立即消耗1張復活卷軸使其復活）');
    if (d.meleeHaste) out.push(`裝備近戰武器時攻速+${d.meleeHaste}%`);
    if (d.polyAtkSpdPct) out.push(`變身時攻速+${d.polyAtkSpdPct}%`);
    if (d.moveSpeedPct) out.push(`移動速度${d.moveSpeedPct > 0 ? '+' : ''}${d.moveSpeedPct}%`);
    if (d.hitstunReduce) out.push(`受擊硬直縮短${(d.hitstunReduce / 10).toFixed(1)}秒`);
    if (d.aggroHide) out.push('隱匿仇恨（較不容易成為敵人目標）');
    if (d.aggroWeight) out.push(`${d.aggroWeight > 0 ? '提高' : '降低'}仇恨（${d.aggroWeight > 0 ? '更' : '較不'}容易被攻擊）`);
    if (d.aggroMin) out.push('被攻擊權重必定為 1（最低·無視職業與其他仇恨裝備）');   // 🫥 v3.7.88 隱身斗篷

    if (d.auraDmg) out.push(`傷害光環（每${((d.auraDmg.interval || 10) / 10).toFixed(1)}秒對全體敵人造成${d.auraDmg.dmg}點傷害）`);
    if (d.thorns) out.push(`受擊反傷（反彈${d.thorns}點傷害）`);
    if (d.dmgReflect) out.push(`傷害反射 ${d.dmgReflect}%（免疫該次一般攻擊並反射傷害）`);
    if (d.hurtExplode) out.push(`受擊爆裂（自己與全體敵人受到${d.hurtExplode}點火焰魔法傷害）`);
    if (d.hurtRapidfire) out.push('受擊反制（受到傷害時立即觸發一次連射；經典模式亦生效）');
    if (d.counterBarrierX2) out.push('反擊屏障強化（反擊傷害×2）');
    if (d.crushDr) out.push(`重擊防護（受到重擊傷害-${d.crushDr}%）`);
    if (d.physDrGated) out.push(`物理防護（一般攻擊傷害-${d.physDrGated}%，每3秒一次）`);
    if (d.fireNullify) out.push('火焰化解（每10秒可免疫一次火屬性傷害）');
    if (d.wearerEle === 'wind') out.push('風之化身（自身轉為風屬性；受到地屬性傷害增加、受到水屬性傷害減少）');
    else if (d.wearerEle) out.push(`${eleName(d.wearerEle)}之化身（自身轉為${eleName(d.wearerEle)}屬性，承受傷害套用屬性剋制）`);
    if (d.necroBook) out.push('骷髏復生（造屍術改為不消耗MP；敵人被擊敗時自動召喚1隻骷髏，全隊場上最多6隻；已達上限時完全恢復HP最低的骷髏）');
    if (d.killTeamHealPct) out.push(`亡者餽贈（擊殺敵人時，全體玩家、傭兵、召喚物、寵物與護衛恢復${d.killTeamHealPct}%最大HP）`);
    if (d.stealth) out.push('常駐隱身（不主動吸引一般怪物）');

    if (d.fullHpMult) out.push(`滿血狙擊（對滿血敵人一般攻擊傷害×${d.fullHpMult}）`);
    if (d.fullHpMultTriple) out.push(`滿血三重矢（首箭傷害×${d.fullHpMultTriple}）`);
    if (d.fullHpMpHalf) out.push('滿血施法（自身滿血時魔力消耗減半）');
    if (d.lowHpPotionX2) out.push('瀕危急救（低HP時藥水恢復量×2）');
    if (d.lowMpRegenBonus) out.push(`魔力枯竭回復（MP低於15%時，MP自然恢復+${d.lowMpRegenBonus}）`);
    if (d.groupHealMult) out.push(`團體治癒強化（體力回復術、生命的祝福恢復量×${d.groupHealMult}）`);
    if (d.onDmgHeal) out.push(`受擊自癒（每${d.onDmgHealCd || 5}秒自動施放${skillName(d.onDmgHeal)}）`);
    if (d.poisonHealMult) out.push(`毒素轉生（受到毒性持續傷害時，改為恢復其${pctText(d.poisonHealMult)}的HP）`);
    if (d.poisonMult) out.push(`劇毒增幅（附加劇毒傷害×${d.poisonMult}）`);

    if (d.dotCrit) out.push('持續傷害爆擊（我方中毒、出血等持續傷害可爆擊）');
    if (d.eleWpnMult) out.push(`${eleName(d.eleWpnMult.ele)}武器強化（對應屬性一般攻擊傷害×${d.eleWpnMult.mult}）`);
    if (d.hardSkinMult) out.push(`破甲專攻（攻擊有硬皮的敵人傷害×${d.hardSkinMult}）`);
    if (d.softMult) out.push(`柔軟專攻（攻擊無硬皮的敵人傷害×${d.softMult}）`);
    if (d.heavyRatePct) out.push(`重擊率額外+${d.heavyRatePct}%`);
    if (d.heavyMult) out.push(`重擊威力（重擊傷害×${d.heavyMult}）`);
    if (d.heavyBonusDmg) out.push(`重擊時額外傷害+${d.heavyBonusDmg}`);
    if (d.iaiCrit) out.push('居合必定爆擊');
    if (d.procPoisonPct) out.push(`附毒（一般攻擊命中附加每秒該次傷害${d.procPoisonPct.pct || 50}%的中毒，最多1層，持續${d.procPoisonPct.dur || 6}秒）`);
    if (d.statusHealHp) out.push(`受到異常狀態影響時，恢復${d.statusHealHp}HP`);
    if (d.dotMpRefund) out.push(`持續傷害回魔（因中毒、灼燒、燙傷或出血損失HP時，恢復損失量${d.dotMpRefund}%的MP）`);
    if (d.potionBonus && !d.doll) out.push(`治癒藥水恢復量+${d.potionBonus}%`);
    if (d.missGrazeRate) out.push(`擦傷補正（未命中時${d.missGrazeRate}%改判為擦傷，造成${d.grazeDmgPct || 50}%傷害且不會爆擊）`);
    if (d.hitEchoMagic) out.push(`元素爆破 ${d.hitEchoMagic.rate}%（命中後追加等同本次一般攻擊傷害的${eleName(d.hitEchoMagic.ele)}屬性魔法傷害）`);
    if (d.onHitWet) out.push('潮濕（命中後持續10秒；下一次風屬性傷害×2並解除）');
    if (d.onHitCastSkill) out.push(`命中施法（每${d.onHitCastSkill.cdSec || 5}秒觸發${skillName(d.onHitCastSkill.skId)}）`);
    if (d.onHitEleVuln) out.push(`元素弱點（命中使目標受到的${eleName(d.onHitEleVuln)}屬性傷害提高）`);
    if (d.windSpellProcRate) out.push(`風魔法共振 ${d.windSpellProcRate}%（主動施放風屬性傷害魔法時追加龍捲風）`);
    if (d.hasteStrike) out.push('加速突擊（加速時命中與傷害+30；命中後失去加速）');
    if (d.selfBreakProc) out.push(`易碎爆發（3%造成1.5倍傷害，但自身傷害降低${d.selfBreakProc.dur || 5}秒）`);
    if (d.stoneInstakill) out.push('石化斬殺（命中石化中的非首領敵人時即死）');
    if (d.instakillFull) out.push(`滿血斬殺 ${pctText(d.instakillFull)}（命中滿血非首領敵人時即死）`);
    if (d.procFireSkillRate) out.push(`火焰法術 ${d.procFireSkillRate}%（攻擊時隨機施放火屬性傷害魔法）`);
    if (d.procHealFlat) out.push(`命中治癒 ${d.procHealFlat.rate}%（恢復${d.procHealFlat.hp}點HP）`);
    if (d.rapidMax) out.push('最大連射（連射發動時，固定射出目前可用的最大額外箭數）');
    if (d.bonespike) out.push('骨刺爆裂（連射額外箭命中累積骨刺，最多10層；下一次一般攻擊命中引爆，每層20點固定傷害）');
    if (d.critDmgLowHp) out.push(`背水爆擊（HP低於${d.critDmgLowHp.hp}時，近距離爆擊傷害+${d.critDmgLowHp.add}%）`);
    if (d.castOnHurt) out.push(`護身反擊 ${d.castOnHurt.rate}%（玩家受到物理或魔法傷害時，免費施放目前設定的自動攻擊傷害法術）`);

    if (d.lvDmgDiv || d.lvHitDiv) out.push(`等級成長（每${d.lvDmgDiv || d.lvHitDiv}級，傷害與命中提高）`);
    if (d.highestAttrPlus) out.push('主屬性強化（目前最高的六維屬性+1；並列皆增加）');
    if (d.swordStr) out.push(`握劍強化（主手裝備單手劍或雙手劍時，力量+${d.swordStr}）`);
    if (d.raceBonus) out.push(`${d.raceBonus.race}剋星（對${d.raceBonus.race}傷害×${d.raceBonus.mult}）`);
    if (d.raceFlat) out.push(`${d.raceFlat.race}剋星（對${d.raceFlat.race}額外傷害+${d.raceFlat.add}）`);
    if (d.giantBonus) out.push('巨人剋星（攻擊巨人額外造成1D20傷害）');
    if (d.weakHitBonus) out.push(`弱點洞察（屬性剋制時額外傷害+${d.weakHitBonus}）`);

    if (d.petDmgAll) out.push(`寵物傷害+${d.petDmgAll}`);
    if (d.petHitAll) out.push(`寵物命中+${d.petHitAll}`);
    if (d.petSkillDmgMult) out.push(`寵物技能傷害×${d.petSkillDmgMult}`);
    if (d.summonDmg) out.push(`召喚物傷害+${d.summonDmg}`);
    if (d.summonHit) out.push(`召喚物命中+${d.summonHit}`);
    if (d.partnerHit) {
        let names = Object.keys(d.partnerHit).map(n => `${n}命中+${d.partnerHit[n]}`);
        if (names.length) out.push(`夥伴強化（${names.join('、')}）`);
    }
    if (d.trackBoost) out.push('追蹤強化（指定怪物出現率由50%提高至70%）');
    if (d.showMobEle) out.push('元素洞察（顯示敵人的屬性）');
    if (d.relicDropX2) out.push('遺物尋寶（遺物掉落判定次數×2）');

    return out;
}
function tooltipEscRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Legacy item descriptions often contain old stat/effect tags. Keep the lore, but let the
// structured tooltip be the single source for mechanics that are still active.
function tooltipItemDescription(d, itemId) {
    let desc = String((d && d.d) || '');
    if (!desc) return '';

    const statPatterns = [];
    const addValue = (label, value, suffix) => {
        let n = Math.abs(Number(value));
        if (!Number.isFinite(n) || n === 0) return;
        statPatterns.push(`${label}\\s*[+＋\\-－]\\s*${tooltipEscRegExp(n)}${suffix || ''}(?!\\d)`);
    };
    addValue('力量', d.str); addValue('敏捷', d.dex); addValue('體質', d.con);
    addValue('智力', d.int); addValue('精神', d.wis); addValue('魅力', d.cha);
    addValue('HP\\s*(?:上限)?', d.mhp); addValue('MP\\s*(?:上限)?', d.mmp);
    addValue('HP\\s*(?:自然)?(?:恢復|回復)(?:量)?', d.hpR);
    addValue('MP\\s*(?:自然)?(?:恢復|回復)(?:量)?', d.mpR);
    addValue('魔法傷害', d.mdmg); addValue('魔法命中', d.magicHit);
    addValue('額外魔法點數', d.extraMp); addValue('額外傷害', d.extraDmg); addValue('額外命中', d.extraHit);
    addValue('(?:傷害減免|減傷)', d.dr); addValue('(?:迴避|ER)', d.er); addValue('負重(?:上限)?', d.weightCap);
    addValue('(?:近距離|遠距離)命中', d.hit); addValue('(?:近距離|遠距離)傷害', d.dmgBonus);
    addValue('近距離命中', d.meleeHit); addValue('遠距離命中', d.rangedHit);
    addValue('近距離傷害', d.meleeDmg); addValue('遠距離傷害', d.rangedDmg);
    addValue('(?:MR|魔防|魔法防禦)', d.mr); addValue('(?:AC|防禦)', d.ac);
    addValue('火屬性抗性', d.resFire); addValue('水屬性抗性', d.resWater);
    addValue('風屬性抗性', d.resWind); addValue('地屬性抗性', d.resEarth);
    if (d.potionBonus) statPatterns.push(`(?:藥水|治癒藥水).{0,12}(?:恢復|回復).{0,12}[+＋]\\s*${tooltipEscRegExp(d.potionBonus)}\\s*%`);
    for (const pattern of statPatterns) desc = desc.replace(new RegExp(pattern, 'g'), '');

    const tags = typeof getWeaponTags === 'function' ? getWeaponTags(itemId) : [];
    const legacyTags = [];
    const byEff = { pierce:'穿透', moonburst:'月光爆裂', dice_death:'即死', haste:'加速', crush:'重擊', cleave:'切割', combo:'雙擊', magicstrike:'魔擊', magicburst:'魔爆' };
    if (byEff[d.eff]) legacyTags.push(byEff[d.eff]);
    if (d.alsoPierce) legacyTags.push('穿透');
    if (d.ignHardSkin) legacyTags.push('貫穿');
    if (d.rapidfire) legacyTags.push('連射(?:\\d+%?)?');
    if (d.oneHand && d.isBow) legacyTags.push('可單手持握');
    if (tags.includes('單手劍')) legacyTags.push('反擊');
    if (tags.includes('武士刀')) legacyTags.push('居合');
    if (tags.includes('單手鈍器')) legacyTags.push('鉤擊');
    if (tags.includes('雙刀')) legacyTags.push('雙刃');
    if (typeof weaponHasBleed === 'function' && weaponHasBleed(itemId)) legacyTags.push('(?:帶)?出血');
    for (const tag of legacyTags) {
        desc = desc.replace(new RegExp(`(^|[、；;。])\\s*${tag}(?:（[^）]*）)?(?=[、；;。]|$)`, 'g'), '$1');
    }
    if (d.unBonus) desc = desc.replace(/(?:[、；;。]\s*)?對不死\s*[/／]\s*狼人加成(?=[、；;。]|$)/g, '');   // 🧹 v3.5.87 #128：unDice / sp:'elf' 全 DB.items 零定義（恆假死運算元）→ 只留 unBonus
    if (d.relic && d.armguard) desc = desc.replace(/(?:[、；;。]\s*)?臂甲（裝於副手，可與雙手武器並用）[。；;]?/g, '');

    return desc
        .replace(/[、，；;]\s*[、，；;]+/g, '、')
        .replace(/[、，；;]\s*。/g, '。')
        .replace(/。\s*[。；;、，]+/g, '。')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function dedupeGeneratedTooltipEffects(effects, d, options) {
    if (d.procPoisonPct) effects = effects.filter(label => !label.startsWith('附毒（一般攻擊命中附加'));
    if (!options || !options.main) return effects;
    return effects.filter(label => {
        if (d.potionBonus && label.startsWith('治癒藥水恢復量+')) return false;
        if (d.abnormalResist && label.startsWith('異常狀態抵抗+')) return false;
        if (d.immParalyze && label === '免疫麻痺') return false;
        if (d.immBurn && label === '免疫燃燒') return false;
        if (d.immFreeze && label === '免疫冰凍') return false;
        if (d.resNone && (d.type === 'arm' || d.type === 'acc') && label.startsWith('無屬性魔法抗性+')) return false;
        return true;
    });
}

const GENIE_WISH_LABEL = { hp60: 'HP +60', mp30: 'MP +30', md3: '近距離傷害 +3', rd3: '遠距離傷害 +3', mdmg2: '魔法傷害 +2', sp6: '額外魔法點數 +6', hpr10: 'HP 自然恢復量 +10', mpr5: 'MP 自然恢復量 +5', dr3: '傷害減免 +3', ac3: 'AC -3', mr6: 'MR +6', str1: '力量 +1', dex1: '敏捷 +1', int1: '智力 +1', wis1: '精神 +1', con1: '體質 +1', cha1: '魅力 +1' };   // 🏺 v3.6.44 巨靈的三個願望
function buildItemDescHTML(item) {
    let d = DB.items[item.id];
    if(!d) return '';
    let desc = tooltipItemDescription(d, item.id);
    if (item.gw && Array.isArray(item.gw)) desc += `<br><span class="text-amber-300 font-bold">✦ 許下的三個願望：</span><br>` + item.gw.map(w => `<span class="text-amber-200">・${GENIE_WISH_LABEL[w] || w}</span>`).join('<br>');   // 🏺 v3.6.44 巨靈的三個願望：顯示實體抽定的能力
    // 🔮 席琳套裝效果：寫在資訊欄（綠色標題＋淺綠加成說明），不冠在名稱前
    // ⚠️v3.1.68 套裝效果改由「席琳遺骸」承載：遺骸(d.remains)照常列加成；一般裝備上的舊詞綴補註「不再計入」提示（顯示保留·可由菈克希絲拆分）
    if (item.seteff) {
        let _g = item.seteff.slice(0, 2);
        let _lines = (SHERINE_SET_TEXT[_g] || []).map(t => `<span class="text-green-200">・${t}</span>`).join('<br>');
        let _legacy = d.remains ? '' : `<br><span class="text-amber-300 text-sm">（舊詞綴：已不計入套裝效果，可請席琳神殿的菈克希絲拆分為遺骸）</span>`;
        desc = `<span class="c-sherine font-bold">✦ 席琳套裝效果：${_g}</span><br>${_lines}${_legacy}`
             + (desc ? `<br>${desc}` : '');
    }
    if(d.type === 'wpn') {
        desc += `<br><span class="text-orange-300">小型傷害: ${d.dmgS} / 大型傷害: ${d.dmgL}</span>`;
        
        // 🌟 依照你的規則：根據 ranged: true 決定前綴
        let isRanged = (d.ranged === true);
        let hitLabel = isRanged ? "遠距離命中" : "近距離命中";
        let dmgLabel = isRanged ? "遠距離傷害" : "近距離傷害";

        // 顯示命中與傷害
        if(d.hit) desc += ` / ${hitLabel}: ${formatBonus(d.hit)}`;
        if(d.dmgBonus !== undefined) desc += ` / ${dmgLabel}: ${formatBonus(d.dmgBonus)}`; // 加上 !== undefined 避免 0 被漏掉
        
        if(d.mdmg) desc += ` / 魔法傷害: ${formatBonus(d.mdmg)}`;
        // ⚔️ 攻擊速度依「職業性別×武器種類」查表顯示（以目前角色為準；戰士雙持另依雙斧速度）
        if (typeof atkSpdApm === 'function' && typeof player !== 'undefined' && player && player.cls && atkSpdFamily(item.id)) {   // 箭矢等非揮擊武器不顯示
            let _apm = atkSpdApm(player, item.id);
            if (_apm) desc += `<br><span class="text-orange-200">攻擊速度: 每分鐘 ${_apm} 次（${player.avatar || '依職業性別'}）</span>`;
            // 🏛️ 天堂動作速度：硬直依職業；施法速度依目前職業／變身 cast，與此武器及攻速加成無關。
            if (typeof hitstunTicks === 'function' && typeof castIntervalTicks === 'function') {
                let _castTicks = castIntervalTicks(player);
                desc += `<br><span class="text-slate-400 text-xs">硬直 ${(hitstunTicks(player)/10).toFixed(1)}秒 · 施法速度每分鐘 ${(600/_castTicks).toFixed(1)} 次（間隔 ${(_castTicks/10).toFixed(1)}秒）</span>`;
            }
        }

        // 瑪那魔杖等「命中恢復MP」武器：依此物品的強化等級(+N)動態顯示恢復量
        if(d.eff === 'mp_drain' || d.mpOnHit) {
            let en = capEn(item.en, d);
            let mpGain = mpOnHitAmount(d, en);   // 💧 單一真相 mpOnHitAmount（js/03）：固定量(mpOnHitAmt) → 基底(mpOnHitBase)＋突破安定值加成
            let _grow = (d.mpOnHitAmt == null) ? '（+7 起每強化 +1）' : '';   // 🏺 固定恢復量者（邪惡蜥蜴的眼瞳 +6）不隨強化成長→不顯示成長註記
            desc += `<br><span class="text-sky-300">命中時恢復 ${mpGain} 點 MP${_grow}。</span>`;
        }
        if(d.mpROverSafe) {
            let en = capEn(item.en, d);
            let mpRegen = (d.mpR || 0) + Math.max(0, en - (d.safe || 0)) * d.mpROverSafe;
            desc += `<br><span class="text-sky-300">MP自然恢復 ${mpRegen}（+0 為 ${d.mpR || 0}，+${(d.safe || 0) + 1} 起每強化 +${d.mpROverSafe}）。</span>`;
        }
        if(d.extraMpPerEn) {
            let en = capEn(item.en, d);
            desc += `<br><span class="text-sky-300">額外魔法點數 +${en * d.extraMpPerEn}（每強化 +${d.extraMpPerEn}）。</span>`;
        }
        if(d.meleeHitPerEn) {
            let en = capEn(item.en, d);
            desc += `<br><span class="text-sky-300">近距離命中 +${en * d.meleeHitPerEn}（每強化 +${d.meleeHitPerEn}）。</span>`;
        }
    }
    if(d.type === 'arm' || d.type === 'acc') {
        // 順便修復防禦為 0 (例如 T恤) 時不顯示的問題
        if(d.ac !== undefined) desc += `<br><span class="text-blue-300">防禦(AC): ${d.ac >= 0 ? '-' + d.ac : '+' + (-d.ac)}</span>`;   // 🩹 v3.1.76 負值 ac（曼波帽子 -1＝防禦變弱·確認為刻意設計）：原字串前綴寫死「-」會顯示成「--1」→ 負值改顯示 +N
        let isRanged = (d.ranged === true);
        let hitLabel = isRanged ? "遠距離命中" : "近距離命中";
        let dmgLabel = isRanged ? "遠距離傷害" : "近距離傷害";
        if(d.hit !== undefined)        desc += ` / ${hitLabel}: ${formatBonus(d.hit)}`;
        if(d.dmgBonus !== undefined)   desc += ` / ${dmgLabel}: ${formatBonus(d.dmgBonus)}`;
        if(d.mr || d.mrPerEn) { let _en = capEn(item.en, d); desc += ` / 魔防(MR): ${formatBonus((d.mr||0) + (d.mrPerEn||0)*_en)}` + (d.mrPerEn ? `（每強化 +${d.mrPerEn}）` : ''); }
        if(d.resFire)  desc += ` / 火屬性抗性: ${formatBonus(d.resFire)}`;
        if(d.resWater) desc += ` / 水屬性抗性: ${formatBonus(d.resWater)}`;
        if(d.resWind)  desc += ` / 風屬性抗性: ${formatBonus(d.resWind)}`;
        if(d.resEarth) desc += ` / 地屬性抗性: ${formatBonus(d.resEarth)}`;
        if(d.resNone)  desc += ` / 無屬性抗性: ${formatBonus(d.resNone)}（只對魔法）`;   // 🛡️ v3.3.29 取代舊「無屬性魔法傷害減少%」
        if(d.meleeHit)  desc += ` / 近距離命中: ${formatBonus(d.meleeHit)}`;
        if(d.rangedHit) desc += ` / 遠距離命中: ${formatBonus(d.rangedHit)}`;
        if(d.meleeDmg)  desc += ` / 近距離傷害: ${formatBonus(d.meleeDmg)}`;
        if(d.rangedDmg) desc += ` / 遠距離傷害: ${formatBonus(d.rangedDmg)}`;
        // 🦴 寵物武器（之牙）：依強化等級(+N，上限+5)動態顯示該寵物加成（每強化+1 → 傷害+1、命中+1）
        if(d.petDmg || d.petHit) {
            let en = capEn(item.en, d);
            let _pd = (d.petDmg || 0) + en, _ph = (d.petHit || 0) + en, _parts = [];
            if(_pd > 0) _parts.push('額外傷害 +' + _pd);
            if(_ph > 0) _parts.push('額外命中 +' + _ph);
            if(_parts.length) desc += `<br><span class="text-amber-300">裝備的寵物${_parts.join('、')}（每強化 +1，上限 +5）。</span>`;
        }
        // 🛡️ v3.2.37 寵物防具：依強化等級(+N，上限+5)動態顯示該寵物加成（每強化+1 → 防禦再-1）
        if(d.petAc || d.petMr || d.petInt || d.petWis) {
            let en = capEn(item.en, d);
            let _parts = [];
            if(d.petAc) _parts.push('防禦 -' + ((d.petAc || 0) + en));
            if(d.petMr) _parts.push('魔法防禦 +' + d.petMr);
            if(d.petInt) _parts.push('智力 +' + d.petInt + '（技能傷害 +' + d.petInt + '）');
            if(d.petWis) _parts.push('精神 +' + d.petWis + '（MP上限 +' + (d.petWis * 5) + '·MP恢復 +' + d.petWis + '）');
            if(_parts.length) desc += `<br><span class="text-amber-300">裝備的寵物${_parts.join('、')}（每強化 防禦再 -1，上限 +5）。</span>`;
        }
        // 🛡️ 臂甲：依強化值動態顯示門檻特效現值＋每強化HP（🏺 遺物臂甲 noEnhance：跳過強化相關文字，特效寫在 d:）
        if(d.armguard && !d.noEnhance) {
            let en = capEn(item.en, d);
            let ag = d.armguard;
            let tier = en >= 9 ? ag.th[2] : en >= 7 ? ag.th[1] : en >= 5 ? ag.th[0] : 0;
            let val = (ag.base || 0) + tier;
            let perEnHp = en * 10;
            if(ag.stat === 'mhp') desc += `<br><span class="text-amber-300">HP +${val + perEnHp}（特效 +${val}、每強化 HP+10 共 +${perEnHp}）</span>`;
            else if(ag.stat && ag.stat !== 'none' && val) { let _agLbl = ag.stat === 'dr' ? '額外減傷' : ag.stat === 'magicDmg' ? '魔法傷害' : ag.stat === 'rangedDmg' ? '遠距離傷害' : ag.stat === 'meleeDmg' ? '近距離傷害' : ag.stat; desc += `<br><span class="text-amber-300">${_agLbl} +${val}　HP +${perEnHp}（每強化+1，HP+10）</span>`; }
            else desc += `<br><span class="text-amber-300">HP +${perEnHp}（每強化+1，HP+10）</span>`;   // 🛡️ 無門檻特效臂甲（如龍鱗臂甲 stat:none）：只顯示每強化HP，不顯示「none +0」
        }
    }

    // 👇 裝備特效標籤：顯示「名稱＋精簡機制說明」，讓玩家不必只靠特效名稱猜用途。涵蓋 武器/防具/飾品。
    if (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') {
        let _eff = [];
        if (d.unBonus) _eff.push('不死／狼人加成（額外造成1D20傷害）');   // 🧹 v3.5.87 #128：unDice / sp:'elf' 全 DB.items 零定義（恆假死運算元）→ 只留 unBonus
        if (d.eff === 'pierce')     _eff.push('穿透 ' + (d.pierceChance !== undefined ? d.pierceChance : 100) + '%（命中後追加攻擊另一名敵人）');
        if (d.alsoPierce)           _eff.push('穿透 ' + (d.pierceChance !== undefined ? d.pierceChance : 100) + '%（命中後追加攻擊另一名敵人）');   // 主特效槽被占用時仍可附帶「穿透」；與無視硬皮的「貫穿」不同
        if (d.eff === 'moonburst')  _eff.push('月光爆裂（命中時8%造成1D30＋強化×2風屬性魔法傷害·受魔法傷害公式與MR影響）');
        if (d.eff === 'dice_death') _eff.push('即死（命中時1%使非首領目標死亡）');
        if (d.eff === 'haste')      _eff.push('自我加速（裝備時常駐加速）');
        if (d.eff === 'crush')      _eff.push('重擊（提高重擊機率，重擊取武器最大傷害）');
        if (d.eff === 'cleave')     _eff.push('切割（重擊時攻速+20%，持續2秒）');
        if (d.eff === 'combo')      _eff.push('雙擊 ' + (d.comboRate || 0) + '%（追加一次完整一般攻擊）');
        if (d.weakExpose)           _eff.push('弱點曝光（命中12%疊加，供屠宰者增傷）');   // 🐉 鎖鏈劍：一般攻擊命中12%附加（最多3層）
        if (d.vampPct)              _eff.push('吸取HP ' + Math.round(d.vampPct * 100) + '%（依本次傷害恢復）');
        if (d.ignHardSkin)          _eff.push('貫穿（無視硬皮額外減傷）');   // 🗡️ 暗黑十字弓：攻擊無視硬皮額外減傷
        if (d.redSpecter)           _eff.push('紅惡靈逆襲（4%＋每強化1%，造成水魔傷並吸取10%HP）');   // 👹 隱藏的魔族武器
        if (d.blueSpecter)          _eff.push('藍惡靈奪魔（4%＋每強化1%，恢復3D6 MP）');   // 👹 隱藏的魔族武器
        if (d.rapidfire)            _eff.push('連射 ' + d.rapidfire + '%（追加1～3箭，每箭30%傷害）');
        if (d.block)                _eff.push('格檔 ' + d.block + '%（重擊時依此機率減半傷害；一般攻擊為上述機率的30%）');
        if (d.immStone)             _eff.push('免疫石化');
        if (d.immPoison)            _eff.push('免疫中毒');
        if (d.unique)               _eff.push('唯一（最多裝備1個）');
        if (d.eff === 'magicstrike') _eff.push('魔擊（攻擊時依力量觸發必中重擊）');
        if (d.eff === 'magicburst') _eff.push('魔爆（傷害魔法時依智力觸發，追加該次總傷害30%的無屬性傷害）');   // 🔧 神官魔杖
        if (d.meleeHitSpell)        _eff.push('命中施法（攻擊命中時施放' + (d.meleeHitSpell.skn || '附加法術') + '）');
        if (d.spellProc) {
            let _spellRate = (d.procRateBase || 1) + (d.procRatePerEn || 0) * capWpnEn(item.en || 0);
            _eff.push(`攻擊施法 ${_spellRate}%（觸發${d.spellProc.skn || '附加法術'}）`);
        }
        if (d.procSkill) {
            let _procName = (DB.skills[d.procSkill] && DB.skills[d.procSkill].n) || '技能';
            let _procRate = (d.procRateBase || 1) + (d.procRatePerEn || 0) * capWpnEn(item.en || 0);
            _eff.push(`${d.procOnHit ? '命中施法' : '攻擊施法'} ${_procRate}%（觸發${_procName}）`);
        }
        if (d.procSkill2 && d.procSkill2.skId) _eff.push(`攻擊施法 ${d.procSkill2.rate || 5}%（觸發${(DB.skills[d.procSkill2.skId] && DB.skills[d.procSkill2.skId].n) || '技能'}）`);   // 🌅 九尾妖狐的怒火：第二觸發槽
        if (d.procPoisonPct) _eff.push(`附毒（命中附加每秒該次傷害${d.procPoisonPct.pct || 50}%的中毒，最多1層，持續${d.procPoisonPct.dur || 6}秒）`);   // 🌅 毒鵺的黑尾
        if (d.iaiCrit) _eff.push('居合必定爆擊');   // 🌅 鐮鼬的尾刃
        if (d.heavyBonusDmg) _eff.push(`重擊時額外傷害+${d.heavyBonusDmg}`);   // 🌅 牛鬼的斷角
        if (d.procStatusSkill) {
            let _statusName = (DB.skills[d.procStatusSkill.skId] && DB.skills[d.procStatusSkill.skId].n) || '異常狀態';
            _eff.push(`異常攻擊 ${d.procStatusSkill.rate || 0}%（命中時造成${_statusName}）`);
        }
        if (d.procStatus && d.procStatus.kind) _eff.push(`異常攻擊 ${d.procStatus.rate || 0}%（攻擊時使目標${(typeof STATUS_NAME !== 'undefined' && STATUS_NAME[d.procStatus.kind]) || '異常狀態'} ${d.procStatus.dur || 6} 秒）`);   // 🕸️ v3.7.75 深紅之弩：束縛
        if (d.procPoison)            _eff.push(`中毒 ${d.procPoison.rate || 0}%（命中時使目標中毒${d.procPoison.dur ? `，持續${d.procPoison.dur}秒` : ''}）`);
        else if (d.procPoisonRate)   _eff.push(`中毒 ${d.procPoisonRate}%（命中時使目標中毒）`);
        if (d.procInstakill) {
            let _ik = d.procInstakill, _ikCond = _ik.tag === 'undead' ? '不死系' : (_ik.hpBelow ? `HP低於${Math.round(_ik.hpBelow * 100)}%` : '非首領');
            _eff.push(`即死 ${Math.round((_ik.p || 0) * 100)}%（命中${_ikCond}目標時發動）`);
        }
        if (d.procBonusDmg)          _eff.push(`額外傷害 ${d.procBonusDmg.rate}%（攻擊時追加${d.procBonusDmg.dmg}點傷害）`);
        if (d.procDmgReduce)         _eff.push(`傷害減免 ${d.procDmgReduce.rate}%（受傷時減少${d.procDmgReduce.amount}點傷害）`);
        if (d.allLures)              _eff.push('視為持有全部誘捕狀態');
        if (d.eleBonusDmg) {
            let _bonusEleName = { fire:'火', water:'水', wind:'風', earth:'地' }[d.eleBonusDmg.ele] || '特定屬性';
            _eff.push(`屬性專攻（攻擊${_bonusEleName}屬性敵人時額外傷害+${d.eleBonusDmg.dmg || d.eleBonusDmg.add || 0}）`);
        }
        if (d.counterAllEle)         _eff.push('一般攻擊剋制所有屬性敵人');
        if (d.counterEles)           _eff.push(`一般攻擊剋制${d.counterEles.map(e => ({ earth: '地', wind: '風', fire: '火', water: '水' }[e] || e)).join('、')}屬性敵人（×1.4）`);
        if (d.procBurn)              _eff.push(`灼燒${d.procBurn.rate ? ` ${d.procBurn.rate}%` : ''}（命中後每秒${d.procBurn.dmg || 10}點火傷，持續${d.procBurn.dur || 6}秒）`);
        if (d.onHitEleDmg) {
            let _eleName = { fire:'火焰', water:'寒冰', wind:'風雷', earth:'大地', none:'無屬性' }[d.onHitEleDmg.ele] || '屬性';
            _eff.push(`${_eleName}附傷${d.onHitEleDmg.rate ? ` ${d.onHitEleDmg.rate}%` : ''}（命中時追加${d.onHitEleDmg.dmg}點傷害）`);
        }
        if (d.freeChill)             _eff.push('施放寒冰氣息不消耗魔力');
        if (d.windHelm)              _eff.push('施放加速術／強力加速術不消耗魔力（裝備或放在背包皆有效）');   // 🌀 v3.5.87 風之頭盔：實作在 js/08 playerHasWindHelm（背包持有即生效），說明補上實際效果
        if (d.noConsume && d.isArrow) _eff.push('箭矢不會消耗');
        if (d.oneHand && d.isBow)    _eff.push('可單手持握');
        if (d.ele && d.ele !== 'none') {
            let _wpnEleName = { fire:'火', water:'水', wind:'風', earth:'地' }[d.ele] || d.ele;
            _eff.push('一般攻擊化為' + _wpnEleName + '屬性');
        }
        if (d.skillDmgMult) {
            let _skillNames = Object.keys(d.skillDmgMult).map(skId => `${(DB.skills[skId] && DB.skills[skId].n) || skId}×${d.skillDmgMult[skId]}`);
            if (_skillNames.length) _eff.push('技能增幅（' + _skillNames.join('、') + '）');
        }
        if (d.autoCastMpMult && d.autoCastMpMult > 1) _eff.push(`自動施法代價（MP消耗×${d.autoCastMpMult}）`);
        if (d.autoCastDmgMult && d.autoCastDmgMult > 1) _eff.push(`自動施法增幅（傷害×${d.autoCastDmgMult}）`);
        if (d.silencedBonusDmg)      _eff.push(`沉默專攻（攻擊沉默目標額外傷害+${d.silencedBonusDmg}）`);
        if (d.poisonedBonusDmg)      _eff.push(`中毒專攻（攻擊中毒目標額外傷害+${d.poisonedBonusDmg}）`);
        if (d.slowedBonusDmg)        _eff.push(`緩速專攻（攻擊緩速目標額外傷害+${d.slowedBonusDmg}）`);
        if (d.immParalyzeBonusDmg)   _eff.push(`強韌專攻（攻擊免疫麻痺目標額外傷害+${d.immParalyzeBonusDmg}）`);
        if (typeof weaponHasBleed === 'function' && weaponHasBleed(item.id)) _eff.push('出血（命中疊加8秒流血，每秒造成該次傷害20%）');
        if (typeof getWeaponTags === 'function' && getWeaponTags(item.id).includes('單手劍')) _eff.push('反擊（受一般攻擊命中時50%反擊；格檔時必定）');
        if (typeof getWeaponTags === 'function' && getWeaponTags(item.id).includes('武士刀')) _eff.push('居合（無盾且迴避／敵人未命中時50%反擊）');
        if (typeof getWeaponTags === 'function' && getWeaponTags(item.id).includes('單手鈍器')) _eff.push('鈍擊（命中時延遲目標攻擊1秒）');
        if (typeof getWeaponTags === 'function' && getWeaponTags(item.id).includes('雙刀')) _eff.push('雙刃（有機率造成雙倍傷害）');
        if (typeof getWeaponTags === 'function' && getWeaponTags(item.id).includes('鋼爪')) _eff.push('重擊 +5%（重擊取武器最大傷害）');
        if (typeof WAND_LIGHTARROW_IDS !== 'undefined' && WAND_LIGHTARROW_IDS.includes(item.id)) _eff.push('共鳴（攻擊時依智力免費施放光箭）');
        _eff.push(...weaponPurposeLabels(d));
        if (d.relic) _eff.push(...relicPurposeLabels(d));
        _eff = dedupeGeneratedTooltipEffects([...new Set(_eff)], d, { main:true });
        _eff = filterClassicEffLabels(_eff, d);   // 🎮 經典模式：移除已停用特效字樣（classicOk 物品不過濾）
        if (_eff.length) desc += `<br><span class="text-rose-300 font-bold">特效：${_eff.join(' / ')}</span>`;
    }
    // 👆

    // 👇🌟 新增以下這段：統一處理所有裝備的基礎能力加成顯示 🌟👇
    let statsArr = [];
    if(d.str) statsArr.push(`力量(STR)${formatBonus(d.str)}`);
    if(d.dex) statsArr.push(`敏捷(DEX)${formatBonus(d.dex)}`);
    if(d.con) statsArr.push(`體質(CON)${formatBonus(d.con)}`);
    if(d.int) statsArr.push(`智力(INT)${formatBonus(d.int)}`);
    if(d.wis) statsArr.push(`精神(WIS)${formatBonus(d.wis)}`);
    if(d.cha) statsArr.push(`魅力(CHA)${formatBonus(d.cha)}`);
    if(d.mhp) statsArr.push(`HP上限${formatBonus(d.mhp)}`);
    if(d.mmp) statsArr.push(`MP上限${formatBonus(d.mmp)}`);
    if(d.hpR) statsArr.push(`HP恢復${formatBonus(d.hpR)}`);
    if(d.mpR) statsArr.push(`MP恢復${formatBonus(d.mpR)}`);
    // 補齊通用裝備能力。前方武器/防具區已列出的欄位不重複加入。
    if(d.mdmg && d.type !== 'wpn') statsArr.push(`魔法傷害${formatBonus(d.mdmg)}`);
    if(d.extraMp) statsArr.push(`額外魔法點數${formatBonus(d.extraMp)}`);
    if(d.magicHit) statsArr.push(`魔法命中${formatBonus(d.magicHit)}`);
    if(d.extraDmg) statsArr.push(`額外傷害${formatBonus(d.extraDmg)}`);
    if(d.extraHit) statsArr.push(`額外命中${formatBonus(d.extraHit)}`);
    if(d.dr) {
        // 🐉 v3.7.69 安塔瑞斯四防具：傷害減免隨強化成長（+7 起每 +1 再 +1・最高 +3）→ 顯示「該實體當前實際值」，不是死的基礎值
        let _drGrow = d.drEnFrom7Max3 ? Math.min(3, Math.max(0, (typeof capEn === 'function' ? capEn(item && item.en, d) : (item && item.en) || 0) - 6)) : 0;
        statsArr.push(`傷害減免${formatBonus(d.dr + _drGrow)}` + (d.drEnFrom7Max3 ? `（強化 +7 起每 +1 再增加 1，最高 +${d.dr + 3}）` : ''));
    }
    if(d.er) statsArr.push(`迴避(ER)${formatBonus(d.er)}`);
    if(d.weightCap) statsArr.push(`負重上限${formatBonus(d.weightCap)}`);
    if(d.potionBonus) statsArr.push(`藥水恢復量+${d.potionBonus}%`);
    if(d.expBonus) statsArr.push(`經驗值獲得量+${d.expBonus}%`);
    if(d.goldBonus) statsArr.push(`金幣獲得量+${d.goldBonus}%`);

    // 基礎能力保留實際數值；機率觸發類能力在上方「特效」以名稱、發動率與精簡機制說明列出。
    if(d.abnormalResist) statsArr.push(`異常狀態抵抗+${d.abnormalResist}%`);
    if(d.freezeResist) statsArr.push(d.freezeResist >= 100 ? '免疫冰凍' : `冰凍抵抗+${d.freezeResist}%`);
    if(d.stunResist) statsArr.push(d.stunResist >= 100 ? '免疫暈眩' : `暈眩抵抗+${d.stunResist}%`);
    if(d.sleepResist) statsArr.push(d.sleepResist >= 100 ? '免疫睡眠' : `睡眠抵抗+${d.sleepResist}%`);
    if(d.immParalyze) statsArr.push('免疫麻痺');
    if(d.immSlow) statsArr.push('免疫緩速');
    if(d.immBurn) statsArr.push('免疫灼燒');
    if(d.immFreeze) statsArr.push('免疫冰凍');
    if(d.immStun) statsArr.push('免疫暈眩');
    if(d.immSleep) statsArr.push('免疫睡眠');
    if(d.paralyzeResist) statsArr.push(d.paralyzeResist >= 100 ? '免疫麻痺' : `麻痺抵抗+${d.paralyzeResist}%`);
    if(d.slowResist) statsArr.push(d.slowResist >= 100 ? '免疫緩速' : `緩速抵抗+${d.slowResist}%`);
    if(d.poisonResist) statsArr.push(d.poisonResist >= 100 ? '免疫中毒' : `中毒抵抗+${d.poisonResist}%`);
    
    if (statsArr.length > 0) {
        // 如果前面沒有換行過，就幫它換行
        if (!desc.includes('<br>')) desc += '<br>';
        else desc += ' / ';
        desc += `<span class="text-violet-400 font-bold">${statsArr.join(' / ')}</span>`;
    }
    // 👆 新增結束 👆

    if(item.bless) {
        if(item.bless === 'cursed') {
            let _ct;
            if(d.type === 'wpn') _ct = '額外傷害-1，命中-1，額外魔法點數-2';
            else { let _acc = (d.slot==='ring'||d.slot==='amulet'||d.slot==='belt'||d.slot==='ear'); _ct = _acc ? '防禦(AC)+1，魔防(MR)-1' : '防禦(AC)+1，傷害減免-1'; }
            desc += `<br><span class="c-cursed">詛咒的：${_ct}</span>`;
        } else {
            let _bt;
            if(d.type === 'wpn') _bt = '額外傷害+1，額外魔法點數+2，額外命中+1';
            else { let _acc = (d.slot==='ring'||d.slot==='amulet'||d.slot==='belt'||d.slot==='ear'); _bt = _acc ? '防禦(AC)-1，魔防(MR)+1' : '防禦(AC)-1，傷害減免+1'; }
            desc += `<br><span class="text-yellow-400">祝福的：${_bt}</span>`;
        }
    }
    if(item.anc) {
        let _acc = (d.slot==='ring'||d.slot==='amulet'||d.slot==='belt'||d.slot==='ear');
        let _slot = (d.type === 'wpn') ? 'wpn' : (_acc ? 'acc' : 'arm');
        let _v = (item.anc === true) ? 'ancient' : item.anc;
        let _at;
        if(_slot === 'wpn')      _at = (_v==='eternal') ? '額外傷害+4' : (_v==='immortal') ? '額外命中+4' : (_v==='primordial') ? '魔法傷害+2' : '額外傷害+2，魔法傷害+1';
        else if(_slot === 'arm') _at = (_v==='eternal') ? '防禦(AC)-2' : (_v==='immortal') ? '迴避(ER)+2' : (_v==='primordial') ? '魔防(MR)+4' : '傷害減免+2';
        else                     _at = (_v==='eternal') ? '額外傷害+1，防禦(AC)-1' : (_v==='immortal') ? '額外傷害+1，額外命中+1' : (_v==='primordial') ? '魔防(MR)+2，額外魔法點數+2' : '傷害減免+1，魔防(MR)+1';
        desc += `<br><span class="${ancColorClass(item.anc)}">${ancName(item.anc)}：${_at}</span>`;
    }
    let _aff = getAttrAffix(item.attr);
    if(_aff) {
        let eleName = { fire:'火', water:'水', wind:'風', earth:'地' }[_aff.ele];
        let counterName = { fire:'地', water:'火', wind:'水', earth:'風' }[_aff.ele];
        desc += `<br><span class="c-attr-${attrCanon(item.attr)}">${_aff.n}（屬性第${_aff.tier}階）：額外傷害+${_aff.dmg}、額外魔法點數+${_aff.mp}，一般攻擊轉為${eleName}屬性（剋${counterName} ×1.4）。</span>`;   // 🔥 v3.0.77 五階制
    }
    let _attrMagic = getAttrMagicProc(item);
    if (_attrMagic) {
        let _attrMagicName = (DB.skills[_attrMagic.skId] && DB.skills[_attrMagic.skId].n) || _attrMagic.skId;
        let _attrMagicStars = '★'.repeat(_attrMagic.star);
        let _attrMagicRateNote = _attrMagic.star > 1 ? `（基礎 ${_attrMagic.baseRate}% × ${_attrMagic.star}）` : '';
        desc += `<br><span class="text-yellow-300 font-bold">${_attrMagicStars} 屬性附加魔法：攻擊時 ${_attrMagic.rate}% 機率觸發${_attrMagicName}${_attrMagicRateNote}。</span>`;
    }

    // 🪄 授予技能（力量／敏捷／治癒魔法頭盔等 grantSkills 裝備）：列出可額外使用的魔法。
    //    接線在 js/02 recomputeStats：①任何職業「裝備」→ 授予；②騎士／王族／戰士「背包持有」即授予（不需裝備）。
    if (d.grantSkills && d.grantSkills.length) {
        let _gsk = d.grantSkills.map(sk => (DB.skills[sk] && DB.skills[sk].n) || sk).join('、');
        desc += `<br><span class="text-emerald-300 font-bold">可額外使用魔法：${_gsk}</span>`;
        desc += `<br><span class="text-slate-400 text-xs">${d.grantSkillsEquipOnly ? '必須裝備才可使用。' : '騎士／王族／戰士放在背包即可使用；其他職業需裝備。'}</span>`;
    }

    // 🛡️ 適用職業：以職業 logo 顯示可裝備此裝備的職業（騎士/妖精/法師/黑暗妖精/幻術士；黑暗妖精走 darkEquipOk 真實規則）
    if (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') {
        const _EQ_CLASSES = [['knight','騎士'], ['elf','妖精'], ['mage','法師'], ['dark','黑暗妖精'], ['illusion','幻術士'], ['dragon','龍騎士'], ['warrior','戰士'], ['royal','王族']];
        let _logos = _EQ_CLASSES
            .filter(([c]) => isRelic(d) ? reqAllowsClass(d, c) : (c === 'dark') ? darkEquipOk(d, item.id) : (c === 'illusion') ? illusionEquipOk(d, item.id) : (c === 'dragon') ? dragonEquipOk(d, item.id) : (c === 'warrior') ? warriorEquipOk(d, item.id) : (c === 'royal') ? royalEquipOk(d, item.id) : reqAllowsClass(d, c))   // 🏺 遺物：職業適用純以 req 白名單判定（同 checkCanEquip 短路）
            .map(([, nm]) => `<img src="assets/logo/${nm}icon.png" alt="${nm}" title="${nm}" class="class-eq-icon" onerror="this.style.display='none';">`)
            .join('');
        if (_logos) desc += `<br><span class="text-slate-400">適用職業：</span>${_logos}`;
    }

    // ⚖️ 負重：計入負重的裝備（武器/防具/飾品）顯示重量
    if ((d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') && ITEM_WEIGHTS[d.n] !== undefined) {
        desc += `<br><span class="text-amber-300">重量: ${ITEM_WEIGHTS[d.n]}</span>`;
    }

    // 🔧 安定值 / 無法強化（武器/防具/飾品）
    if (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') {
        if (d.noEnhance) desc += `<br><span class="text-rose-300 font-bold">無法強化</span>`;
        else desc += `<br><span class="text-slate-400">安定值: ${d.safe || 0}</span>`;
    }

    return desc;
}

function compareCardHTML(eqItem, slotLabel) {
    let ed = DB.items[eqItem.id];
    if(!ed) return `<div class="text-emerald-300 text-xs font-bold mb-1">【${slotLabel}】</div><div class="text-slate-500 text-sm">（無資料）</div>`;
    let glow = getGlowClass(eqItem, ed);
    let icon = `<img src="${getIconUrl(ed)}" onerror="this.style.display='none';" class="w-7 h-7 mr-2 object-contain pointer-events-none ${glow}">`;
    let header = `<div class="flex items-center font-bold text-lg ${getItemColor(eqItem)} border-b border-slate-700 pb-2 mb-2">${icon}<span>${getItemFullName(eqItem)}</span></div>`;
    let body = buildItemDescHTML(eqItem);
    return `<div class="text-emerald-300 text-xs font-bold mb-1">【${slotLabel}】</div>${header}<div class="text-sm text-slate-300 leading-relaxed">${body}</div>`;
}

function openModal(item, isEq, slot) {
    let d = DB.items[item.id];
    if(!d) return;
    if (!isEq && item.id === 'candle') { startRespec(); return; }   // 🕯️ 回憶蠟燭：點擊物品直接進入配點重置（不開物品視窗、不顯示使用按鈕）

    let lockIcon = item.lock ? '🔒' : '🔓';
    let lockBtnHTML = !isEq ? `<span id="modal-lock-icon" class="text-xl cursor-pointer hover:text-red-400" onclick="toggleLock('${item.uid}')">${lockIcon}</span>` : '';
    
    let imgUrl = getIconUrl(d);
    // 👇 加入螢光判定
    let glowClass = getGlowClass(item, d);
    let iconHtml = `<img src="${imgUrl}" onerror="this.style.display='none';" class="w-8 h-8 mr-2 object-contain pointer-events-none ${glowClass}">`;
    
    let _legendTag = (d && d.legend) ? ` <span class="c-legend text-sm font-bold border border-amber-600/70 rounded px-1.5 py-0.5">傳說</span>` : '';   // 🏅 傳說武器：名字右方標註
    document.getElementById('modal-item-name').innerHTML = `<div class="flex items-center">${iconHtml}<span>${getItemFullName(item)}${_legendTag}</span></div> ${lockBtnHTML}`;
    document.getElementById('modal-item-name').className = `text-2xl font-bold mb-3 border-b border-slate-600 pb-3 flex justify-between items-center ${getItemColor(item)}`;
    
    let desc = buildItemDescHTML(item);
    let _modalEquipItem = d.type === 'wpn' || d.type === 'arm' || d.type === 'acc';
    let _modalCanEquip = !_modalEquipItem || checkCanEquip(item);
    if (!isEq && _modalEquipItem && !_modalCanEquip) desc += `<br><span class="text-red-400 font-bold">無法裝備${d.reqAvatar ? `：僅限${d.reqAvatar}` : ''}</span>`;
    
    let sellPrice = getSellPrice(item);

    // 只要是放在背包裡的物品，都顯示販賣價格
    if (!isEq) {
         desc += `<br><span class="text-yellow-400 mt-2 block">販賣價格: ${sellPrice} 金幣</span>`;
    }
    
    document.getElementById('modal-item-desc').innerHTML = desc;
    
    let act = '';
    if (isEq) {
        // 🔧 詛咒裝備無法卸下：按鈕變灰並禁用
        if (item.bless === 'cursed') {
            act += `<button class="col-span-2 w-full btn border-slate-600 bg-slate-700 text-slate-400 py-3 text-lg font-bold cursor-not-allowed" disabled title="被詛咒的裝備無法卸下，需先解除詛咒">🔒 詛咒中・無法卸除</button>`;
        } else {
            act += `<button class="col-span-2 w-full btn border-red-700 bg-red-900 hover:bg-red-800 text-red-200 py-3 text-lg font-bold" onclick="unequipItem('${slot}')">卸除</button>`;
        }
    } else {
        if(d.type === 'pot' || d.type === 'skillbk' || ((d.type === 'misc' || d.type === 'etc') && d.eff && !d.noUse)) {   // 🔧 misc/etc 且有效果(萬能藥/回憶蠟燭/靈魂之球/🥚頑皮幼龍蛋等)亦顯示使用按鈕；noUse 除外
            act += `<button class="col-span-2 w-full btn border-green-700 bg-emerald-800 hover:bg-emerald-700 text-green-100 py-3 text-lg font-bold" onclick="useItem('${item.uid}')">使用</button>`;
            if (d.batchUse && item.cnt > 1) act += `<button class="col-span-2 w-full btn border-sky-700 bg-sky-900 hover:bg-sky-800 text-sky-100 py-3 text-lg font-bold" onclick="batchUseItem('${item.uid}')">批量使用（可輸入數量）</button>`;   // 🌅 巨大骷髏的妖魂：批量使用
        }
        if(d.type === 'scroll') {
            act += `<button class="col-span-2 w-full btn border-green-700 bg-emerald-800 hover:bg-emerald-700 text-green-100 py-3 text-lg font-bold" onclick="useItem('${item.uid}')">使用卷軸</button>`;
        }
        if(d.type === 'wpn' || d.type === 'arm' || d.type === 'acc') {
            if (_modalCanEquip) act += `<button class="col-span-2 w-full btn border-blue-700 bg-blue-900 hover:bg-blue-800 text-blue-200 py-3 text-lg font-bold" onclick="equipItem(${JSON.stringify(item).replace(/"/g, '&quot;')})">裝備</button>`;
            else act += `<button class="col-span-2 w-full btn border-red-900 bg-red-950 text-red-400 py-3 text-lg font-bold cursor-not-allowed" disabled>無法裝備${d.reqAvatar ? `・僅限${d.reqAvatar}` : ''}</button>`;
        }
        
        // 把販賣按鈕移出來，讓所有道具都可以賣
        if (!item.lock) {
            act += `<button class="btn border-orange-700 bg-orange-900 hover:bg-orange-800 py-2 text-base font-bold" onclick="sellItem('${item.uid}', 1, ${sellPrice})">販賣</button>
                    <button class="btn border-orange-700 bg-orange-900 hover:bg-orange-800 py-2 text-base font-bold" onclick="sellItem('${item.uid}', ${item.cnt}, ${sellPrice})">全部賣出</button>`;
        }
    }

    // 👇 修改：為武器、防具、飾品加入專屬的「強化」按鈕 (加入 !d.isArrow 防呆，箭矢不顯示強化按鈕)
    if (((d.type === 'wpn' && !d.isArrow) || d.type === 'arm' || d.type === 'acc') && !isMaxEnhanced(item) && !d.noEnhance) {   // 🔧 已達淬鍊（強化上限）：隱藏強化按鈕；🏛️ 無法強化的裝備（古老系列）不顯示強化鈕
        act += `<button class="col-span-2 w-full btn border-purple-700 bg-purple-900 hover:bg-purple-800 text-purple-200 py-3 text-lg font-bold mt-2" onclick="showEnhanceOptions('${item.uid}', ${isEq})">強化</button>`;
    }

    // 廢品勾選（所有背包道具：武器/防具/飾品/藥水/卷軸/魔法書/技能書/材料/試煉道具等）：
    //   勾選後，從「最後一次手動標示」起算 10 秒（掃描節奏；真正的寬限期是 autoSellRules.delaySec，預設 60 秒）沒有新動作，系統才自動賣出（autoSellJunk·每次手動標示會重置倒數）；鎖定中無法勾選且會自動取消。
    if (!isEq && !(DB.items[item.id] && DB.items[item.id].noJunk)) {   // 🎴 noJunk(收集冊等)：不顯示「標記為廢品」
        let locked = !!item.lock;
        let checked = (item.junk && !locked) ? 'checked' : '';
        act += `<label class="col-span-2 w-full btn ${locked ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed' : 'border-amber-700 bg-amber-950 hover:bg-amber-900 cursor-pointer'} py-2 text-base font-bold flex items-center justify-center gap-2 mt-2">`
             + `<input type="checkbox" class="w-4 h-4" ${checked} ${locked ? 'disabled' : ''} onchange="toggleJunk('${item.uid}')">`
             + `<span class="text-amber-200">標記為廢品${locked ? '（鎖定中無法標記）' : ''}</span></label>`;
    }

    document.getElementById('modal-actions').innerHTML = act;

    // === 旁邊顯示「目前裝備中」對應欄位，方便比對（僅背包中的武器/防具/飾品，箭矢除外）===
    let _cmp = document.getElementById('modal-compare');
    if(_cmp) {
        const SLOT_LABEL = { wpn:'武器', offwpn:'副手武器', helm:'頭盔', armor:'盔甲', shin:'脛甲', shield:'副手', cloak:'斗篷', tshirt:'內衣', gloves:'手套', boots:'鞋子', ring1:'戒指 1', ring2:'戒指 2', ring3:'戒指 3', ring4:'戒指 4', amulet:'項鍊', ear1:'耳環 1', ear2:'耳環 2', belt:'腰帶' };   // 🦴 v3.2.37 寵物裝備欄移除（改為每隻寵物於包武保管個別裝備）
        if(!isEq && !d.isArrow && d.slot !== 'petwpn' && d.slot !== 'petarm' && (d.type === 'wpn' || d.type === 'arm' || d.type === 'acc')) {   // 🦴 v3.2.42 稽核修：寵物武器/防具非玩家可穿→不顯示「目前裝備中」比較卡（原顯示 petwpn 原字誤導可穿）
            let slots = (d.type === 'wpn') ? ['wpn'] : (d.slot === 'ring' ? ['ring1','ring2','ring3','ring4'] : (d.slot === 'ear' ? ['ear1','ear2'] : [d.slot]));
            let cards = slots.map(sl => {
                let eq = player.eq[sl];
                let label = SLOT_LABEL[sl] || sl;
                return eq ? compareCardHTML(eq, label)
                          : `<div class="text-emerald-300 text-xs font-bold mb-1">【${label}】</div><div class="text-slate-500 text-sm">（此欄位目前未裝備）</div>`;
            });
            _cmp.innerHTML = `<div class="text-slate-300 text-sm font-bold border-b border-slate-600 pb-2 mb-3">目前裝備中（比對）</div>`
                           + cards.join('<div class="my-3 border-t border-dashed border-slate-700"></div>');
            _cmp.classList.remove('hidden');
        } else {
            _cmp.classList.add('hidden');
            _cmp.innerHTML = '';
        }
    }

    document.getElementById('item-modal').classList.remove('hidden');
}
// 👇 新增功能：返回裝備視窗
function returnToItemModal(uid, isEq) {
    let item = isEq ? Object.values(player.eq).find(e => e && e.uid === uid) : player.inv.find(i => i.uid === uid);
    if (item) {
        let slot = isEq ? Object.keys(player.eq).find(k => player.eq[k] === item) : undefined;
        openModal(item, isEq, slot);
    } else {
        closeModal();
    }
}

// 👇 修改後的功能：顯示選擇卷軸的介面
function showEnhanceOptions(uid, isEq) {
    let item = isEq ? Object.values(player.eq).find(e => e && e.uid === uid) : player.inv.find(i => i.uid === uid);
    if (!item) return;
    let d = DB.items[item.id];
    
    let scrollNorm, scrollBless, scrollCurse;
    let scrollNormId = ''; // 🌟 紀錄該裝備對應的一般卷軸 ID
    let scrollCurseId = ''; // 詛咒卷軸 ID（武器/盔甲）

    if (d.type === 'wpn') {
        scrollNormId = 'scroll_weapon';
        scrollNorm = player.inv.find(i => i.id === 'scroll_weapon');
        scrollBless = player.inv.find(i => i.id === 'scroll_weapon_b');
        scrollCurseId = 'scroll_weapon_c';
        scrollCurse = player.inv.find(i => i.id === 'scroll_weapon_c');
    } else if (d.type === 'arm') {
        scrollNormId = 'scroll_armor';
        scrollNorm = player.inv.find(i => i.id === 'scroll_armor');
        scrollBless = player.inv.find(i => i.id === 'scroll_armor_b');
        scrollCurseId = 'scroll_armor_c';
        scrollCurse = player.inv.find(i => i.id === 'scroll_armor_c');
    } else if (d.type === 'acc') {
        scrollNormId = 'scroll_acc';
        scrollNorm = player.inv.find(i => i.id === 'scroll_acc');
    }
    
    // 飾品特殊處理：若有卷軸直接點爆，不用選
    if (d.type === 'acc') {
        if (!scrollNorm) {
            logSys(`<span class="text-red-400 font-bold">強化卷軸不足。</span>`);
            return;
        }
        activeScroll = scrollNorm;
        doEnhance(item.uid, isEq);
        return;
    }
    
    // 武器/防具：如果一般／祝福／詛咒卷軸全都沒有，直接跳錯
    if (!scrollNorm && !scrollBless && !scrollCurse) {
        logSys(`<span class="text-red-400 font-bold">強化卷軸不足。</span>`);
        return;
    }
    
    // 如果有卷軸，將 Modal 畫面替換為「選擇卷軸介面」
    document.getElementById('modal-item-name').innerHTML = `強化 ${getItemFullName(item)}`;
    document.getElementById('modal-item-name').className = `text-xl font-bold mb-3 border-b border-slate-600 pb-3 text-purple-300`;
    document.getElementById('modal-item-desc').innerHTML = "請選擇你要使用的強化卷軸：";
    
    let act = '';
    if (scrollNorm) {
        act += `<button class="col-span-2 w-full btn border-slate-600 bg-slate-800 hover:bg-slate-700 py-3 text-base font-bold text-white shadow" onclick="executeEnhance('${scrollNorm.uid}', '${item.uid}', ${isEq})">使用 ${DB.items[scrollNorm.id].n} (擁有: ${scrollNorm.cnt})</button>`;
    }
    if (scrollBless) {
        act += `<button class="col-span-2 w-full btn border-yellow-600 bg-yellow-900 hover:bg-yellow-800 py-3 text-base font-bold text-yellow-300 shadow" onclick="executeEnhance('${scrollBless.uid}', '${item.uid}', ${isEq})">使用 ${DB.items[scrollBless.id].n} (擁有: ${scrollBless.cnt})</button>`;
    }
    if (scrollCurse) {
        act += `<button class="col-span-2 w-full btn border-red-800 bg-red-950 hover:bg-red-900 py-3 text-base font-bold c-cursed shadow" onclick="executeCurseDeEnhance('${item.uid}', ${isEq}, '${scrollCurseId}')">使用 ${DB.items[scrollCurse.id].n} (擁有: ${scrollCurse.cnt})｜強化值 -1</button>`;
    }
    
    // 🌟 一鍵強化到指定值：右側可選目標強化值（預設＝安定值），逐級嘗試，過程中任一階失敗即視為失敗（爆裝）
    let safe = d.safe || 0;
    if (scrollNorm && (d.type === 'wpn' || d.type === 'arm')) {
        let _cur = Number(item.en) || 0;
        let _max = Math.min(enhanceCap(d), Math.max(safe, _cur) + 6);   // 🔧 可選目標上限不超過淬鍊（強化上限）
        let _def = Math.min(_max, Math.max(safe, _cur + 1));
        let _opts = '';
        for (let _t = _cur + 1; _t <= _max; _t++) {
            _opts += `<option value="${_t}" ${_t === _def ? 'selected' : ''}>+${_t}${_t <= safe ? '（安定）' : ''}</option>`;
        }
        act += `<div class="col-span-2 flex gap-2 mt-2">`
            + `<button class="flex-1 btn border-blue-600 bg-blue-900 hover:bg-blue-800 py-3 text-base font-bold text-blue-300 shadow" onclick="executeAutoSafeEnhance('${item.uid}', ${isEq}, '${scrollNormId}', Number(document.getElementById('auto-enh-target').value))">一鍵強化到指定值</button>`
            + `<select id="auto-enh-target" class="btn border-blue-700 bg-slate-800 text-blue-200 font-bold px-2 py-3 rounded shadow">${_opts}</select>`
            + `</div>`;
    }
    
    act += `<button class="col-span-2 w-full btn py-3 bg-slate-700 text-lg font-bold mt-2" onclick="returnToItemModal('${item.uid}', ${isEq})">返回</button>`;
    
    document.getElementById('modal-actions').innerHTML = act;
}

// 👇 一鍵強化到指定值：逐級嘗試直到目標值。安定值前必定成功；安定值起依天堂經典衝裝規則（enhanceRollOutcome js/01），
//    過程中任一階失敗即爆裝（視為失敗）；武器 +9 起 1/6 無事（卷軸消耗、強化值不變、續衝）；卷軸用盡則停在目前等級。
function executeAutoSafeEnhance(targetUid, isEq, scrollId, goal) {
    let target;
    if (isEq) {
        target = Object.values(player.eq).find(e => e && e.uid === targetUid);
    } else {
        target = player.inv.find(i => i.uid === targetUid);
    }

    if (!target) return;
    target.en = Number(target.en) || 0;   // 🔧 舊存檔 en 可能為 undefined：統一正規化為有效數字

    let d = DB.items[target.id];
    let safe = d.safe || 0;
    let slot = isEq ? Object.keys(player.eq).find(k => player.eq[k] === target) : null;

    // 目標值防呆：必須高於目前強化值，且不超過強化上限（淬鍊）
    goal = Math.min(Number(goal) || 0, enhanceCap(d));
    if (goal <= target.en) {
        logSys(`<span class="text-red-400 font-bold">目標強化值必須高於目前 (+${target.en})。</span>`);
        return;
    }

    // 尋找背包裡的一般卷軸
    let scrollItem = player.inv.find(i => i.id === scrollId);
    let scrollName = DB.items[scrollId] ? DB.items[scrollId].n : "強化卷軸";
    if (!scrollItem || scrollItem.cnt <= 0) {
        logSys(`<span class="text-red-400 font-bold">${scrollName} 數量不足。</span>`);
        return;
    }

    // 堆疊保護：若強化的是「背包」裡且數量大於 1 的裝備，拆分出一件來衝
    if (!isEq && target.cnt > 1) {
        target.cnt -= 1;
        let singleItem = { ...target, cnt: 1, uid: uid() };
        player.inv.push(singleItem);
        target = singleItem;
    }

    let fn0 = getItemFullName(target);
    let used = 0, destroyed = false, hadRisk = false, ranOut = false;

    // 逐級強化，直到抵達目標、卷軸用盡或爆裝
    while (target.en < goal) {
        if (!scrollItem || scrollItem.cnt <= 0) { ranOut = true; break; }
        // 消耗一張卷軸
        scrollItem.cnt -= 1; used += 1;
        if (scrollItem.cnt <= 0) {
            player.inv = player.inv.filter(i => i.uid !== scrollItem.uid);
            scrollItem = null;
        }

        if (target.en < safe) {
            target.en += 1;   // 安定值前必定成功
        } else {
            hadRisk = true;
            let _oc = enhanceRollOutcome(d, target.en);   // 🏰 天堂經典衝裝規則（機率單一真相 js/01·與單抽 doEnhance 同一套）；🎲 即時擲骰可 save/load 重抽
            if (_oc === 'ok') target.en += 1;             // 成功
            else if (_oc === 'none') continue;            // 武器 +9 起 1/6 無事：卷軸已消耗、強化值不變，續衝
            else { destroyed = true; break; }             // 失敗即爆裝，過程視為失敗
        }
    }

    if (destroyed) {
        if (isEq) { if (slot) player.eq[slot] = null; if (typeof syncShahaArrow === 'function') syncShahaArrow(); if (typeof syncDualWield === 'function') syncDualWield(); }   // ⚠️ 快速強化爆裝同樣要同步副手／沙哈箭（與 js/08 doEnhance 一致）
        else { player.inv = player.inv.filter(i => i.uid !== target.uid); }
        logSys(`消耗了 ${used} 張 ${scrollName}。<span class="text-red-500 font-bold">${fn0} 強烈的發出銀色的光芒就消失了。</span>`);
    } else if (ranOut) {
        logSys(`${scrollName} 不足，消耗了 ${used} 張，<span class="text-yellow-400 font-bold">+${target.en} ${d.n} 發出銀色的光芒。</span>`);
    } else {
        let prefix = hadRisk ? `<span class="text-green-300 font-bold">強化成功！</span>` : '';
        logSys(`${prefix}消耗了 ${used} 張 ${scrollName}，<span class="text-yellow-400 font-bold">+${target.en} ${d.n} 發出銀色的光芒。</span>`);
    }

    calcStats();
    renderTabs();
    closeModal();
    saveGame();
}

function executeEnhance(scrollUid, targetUid, isEq) {
    let scroll = player.inv.find(i => i.uid === scrollUid);
    if (!scroll) return;
    activeScroll = scroll;
    doEnhance(targetUid, isEq);
}

// 詛咒卷軸：消耗 1 個，使裝備強化值 -1（100% 成功、不爆裝）
function executeCurseDeEnhance(targetUid, isEq, scrollId) {
    let target = isEq ? Object.values(player.eq).find(e => e && e.uid === targetUid) : player.inv.find(i => i.uid === targetUid);
    if (!target) return;
    target.en = Number(target.en) || 0;
    let d = DB.items[target.id];
    if (target.en <= -1) { logSys(`<span class="text-red-400 font-bold">${d.n} 已是 -1，無法再降低強化值。</span>`); return; }   // 🏰 天堂經典：可降至 -1（紅變後祝福卷必成功，見 enhanceRollOutcome）

    let scrollItem = player.inv.find(i => i.id === scrollId);
    let scrollName = DB.items[scrollId] ? DB.items[scrollId].n : "詛咒卷軸";
    if (!scrollItem || scrollItem.cnt <= 0) { logSys(`<span class="text-red-400 font-bold">${scrollName} 數量不足。</span>`); return; }

    // 堆疊保護：背包內數量 > 1 先拆一件出來降階
    if (!isEq && target.cnt > 1) {
        target.cnt -= 1;
        let single = { ...target, cnt: 1, uid: uid() };
        player.inv.push(single);
        target = single;
    }

    // 消耗 1 個詛咒卷軸
    scrollItem.cnt -= 1;
    if (scrollItem.cnt <= 0) player.inv = player.inv.filter(i => i.uid !== scrollItem.uid);

    target.en -= 1;   // 100% 成功降 1 階（強化已改純機率→重爬時各階自然重新擲骰，無需重骰身份）
    logSys(`消耗了 1 個 <span class="c-cursed">${scrollName}</span>，<span class="text-red-300 font-bold">${target.en < 0 ? target.en : '+' + target.en} ${d.n} 散發出黯淡的光芒。</span>`);

    calcStats();
    renderTabs();
    closeModal();
    saveGame();
}

// ========== ⚡ 快速強化（批次強化）==========
// 強化成敗一律走 enhanceRollOutcome（js/01·天堂經典衝裝規則·與 doEnhance/executeAutoSafeEnhance 同一套機率）

// ⚡ v3.5.87 共用資格判定（單一真相）：渲染端（背包列勾選框）與執行端（_qeEligibleItems）都用它，
//    防止 noEnhance 等不合格物品顯示可勾（藍框）卻在執行時被靜默略過、表頭全選狀態對不上
function _qeCanSelect(d, i, type) {
    if (!d || i.lock || d.noEnhance) return false;   // 🪆 無法強化(古老系列/魔法娃娃)不列入快速強化
    if (type === 'wpn') return d.type === 'wpn' && !d.isArrow;
    return d.type === 'arm' || d.type === 'acc';
}
// 該分頁可被批次強化的背包裝備（未鎖定；武器分頁＝武器(非箭矢)，防具分頁＝防具/飾品）
function _qeEligibleItems(type) {
    return player.inv.filter(i => _qeCanSelect(DB.items[i.id], i, type));
}

// 模擬單一件裝備從 startEn 強化到 goal：每階消耗對應卷軸，安定值前必成功、安定值起依機率，失敗即爆裝。
// scrollStacks 為 {scrollId:{cnt}} 的可變計數器（多件共用同一池），回傳 {en, destroyed, used}
function _quickEnhanceUnit(d, startEn, goal, scrollStacks, useBless) {
    let en = startEn, used = 0, destroyed = false;
    let safe = d.safe || 0;
    let cap = enhanceCap(d);
    goal = Math.min(goal, cap);   // 🔧 批次強化亦不超過各裝備的強化上限（淬鍊）
    let normalId = d.type === 'wpn' ? 'scroll_weapon' : (d.type === 'acc' ? 'scroll_acc' : 'scroll_armor');
    let blessId = d.type === 'wpn' ? 'scroll_weapon_b' : (d.type === 'arm' ? 'scroll_armor_b' : null);   // 🌟 飾品無祝福卷（scroll_acc_b 不存在）
    let bless = !!(useBless && blessId && DB.items[blessId]);   // 此類型有祝福卷才套用；飾品恆走一般卷
    let scrollId = bless ? blessId : normalId;
    while (en < goal) {
        let st = scrollStacks[scrollId];
        if (!st || st.cnt <= 0) break;   // 卷軸用盡：停在目前等級（不爆裝）
        st.cnt -= 1; used += 1;
        let _oc = enhanceRollOutcome(d, en);   // 🏰 天堂經典衝裝規則（機率單一真相 js/01）：安定值前必成功；🎲 即時擲骰可 save/load 重抽
        if (_oc === 'break') { destroyed = true; break; }   // 失敗即爆裝
        if (_oc === 'none') continue;   // 武器 +9 起 1/6 無事：卷軸已消耗、強化值不變，續衝
        let add = bless ? blessEnhanceGain(en) : 1;   // 🌟 祝福卷：+2 以下 +1~+3、+3~+5 +1~+2、+6 起 +1；一般卷 +1
        en = Math.min(cap, en + add);   // 跳級不超過淬鍊上限
    }
    return { en, destroyed, used };
}

function buildQuickEnhanceHeader(type) {
    let st = quickEnh[type];
    let hdr = document.createElement('div');
    hdr.className = 'classic-list-toolbar sticky top-0 z-10 bg-slate-800 pb-2';   // 🔧 遮擋條改用與框底色(.panel=#1e293b=slate-800)相同色→融入面板不突兀；仍為不透明：滾動時物品不會從按鈕上/下方透出；🎨 v3.0.40 1.8皮膚：標記工具列（保留在 viewport 外）
    // 🔧 表頭上緣亦覆蓋容器的 12px 上內距(p-3)：往上拉時 sticky 黏在裁切邊(top/margin-top:-12)、paddingTop:12 維持按鈕原位 → 物品也不會從按鈕「上方」透出（滾動後＝滾動前）。用 inline style（Tailwind CDN JIT 不保證新 class 即時生成）
    hdr.style.top = '-12px'; hdr.style.marginTop = '-12px'; hdr.style.paddingTop = '12px';
    if (!st.active) {
        hdr.innerHTML = `<button onclick="toggleQuickEnhance('${type}')" class="w-full btn border-blue-700 bg-blue-900/70 hover:bg-blue-800 py-1.5 text-sm font-bold text-blue-200 rounded shadow">⚡ 快速強化</button>`;
        return hdr;
    }
    let eligible = _qeEligibleItems(type);
    let allSel = eligible.length > 0 && eligible.every(i => st.sel[i.uid]);
    let someSel = eligible.some(i => st.sel[i.uid]);
    let target = st.target || 6;
    let opts = '';
    for (let t = 1; t <= 12; t++) opts += `<option value="${t}" ${t === target ? 'selected' : ''}>+${t}</option>`;
    let _blessId = type === 'wpn' ? 'scroll_weapon_b' : 'scroll_armor_b';   // 🌟 祝福卷（飾品無祝福卷，仍以防具祝福卷數量顯示）
    let _blessCnt = (player.inv.find(i => i.id === _blessId) || {}).cnt || 0;
    hdr.innerHTML = `<div class="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded p-1">
        <button onclick="cancelQuickEnhance('${type}')" class="btn border-slate-600 bg-slate-700 hover:bg-slate-600 px-2 py-1 text-xs font-bold text-white rounded">取消</button>
        <button onclick="runQuickEnhance('${type}')" class="btn border-blue-600 bg-blue-800 hover:bg-blue-700 px-2 py-1 text-xs font-bold text-blue-200 rounded">強化</button>
        <label class="flex items-center gap-1 text-xs ${_blessCnt > 0 ? 'text-yellow-300' : 'text-slate-500'} cursor-pointer select-none whitespace-nowrap" title="勾選＝使用『祝福的卷軸』強化（成功時隨機 +1~+3）；不勾＝一般卷軸（+1）。飾品無祝福卷，恆以一般卷強化。"><input type="checkbox" ${st.useBless ? 'checked' : ''} onchange="quickEnh['${type}'].useBless=this.checked"> 祝福卷(${_blessCnt})</label>
        <select id="qe-target-${type}" onchange="quickEnh['${type}'].target=Number(this.value)" class="bg-slate-800 border border-slate-600 text-blue-200 text-xs font-bold rounded px-1 py-1 ml-auto">${opts}</select>
        <label class="flex items-center gap-1 text-xs text-slate-300 cursor-pointer select-none whitespace-nowrap"><input type="checkbox" ${allSel ? 'checked' : ''} onchange="quickEnhanceSelectAll('${type}', this.checked)"> 全選</label>
    </div>`;
    let cb = hdr.querySelector('input[onchange*="quickEnhanceSelectAll"]'); if (cb) cb.indeterminate = someSel && !allSel;   // 部分勾選顯示半選（精準選取全選框，避免被新增的祝福卷框搶到）
    return hdr;
}

// 注意：renderTabs 有「背包/裝備內容簽章」快取，內容未變會提早 return。快速強化只改 quickEnh 狀態（不在簽章內），
//       故這些切換一律用 renderTabs(true) 強制重建，否則畫面不會更新。
function toggleQuickEnhance(type) { if (quickJunk[type] && quickJunk[type].active) { quickJunk[type].active = false; quickJunk[type].sel = {}; } let st = quickEnh[type]; st.active = true; if (st.target == null) st.target = 6; st.sel = {}; renderTabs(true); }
function cancelQuickEnhance(type) { let st = quickEnh[type]; st.active = false; st.sel = {}; renderTabs(true); }
function quickEnhanceSelectAll(type, checked) { let st = quickEnh[type]; st.sel = {}; if (checked) _qeEligibleItems(type).forEach(i => st.sel[i.uid] = true); renderTabs(true); }
function toggleQuickItem(type, uid) { let st = quickEnh[type]; if (st.sel[uid]) delete st.sel[uid]; else st.sel[uid] = true; renderTabs(true); }

function runQuickEnhance(type) {
    let st = quickEnh[type];
    let goal = Number((document.getElementById('qe-target-' + type) || {}).value) || st.target || 0;
    let entries = _qeEligibleItems(type).filter(i => st.sel[i.uid]);
    if (!entries.length) { logSys(`<span class="text-red-400 font-bold">尚未勾選任何裝備。</span>`); return; }

    // 三種卷軸共用計數池（武器/防具/飾品各自扣自己的卷軸）
    let scrollStacks = {};
    ['scroll_weapon', 'scroll_armor', 'scroll_acc', 'scroll_weapon_b', 'scroll_armor_b'].forEach(sid => {   // 🌟 含祝福卷（武器/防具）
        let it = player.inv.find(i => i.id === sid);
        scrollStacks[sid] = { cnt: it ? (it.cnt || 0) : 0 };
    });

    let reached = 0, destroyed = 0, partial = 0, skipped = 0, usedTotal = 0;
    let removeUids = new Set();
    let survivors = [];

    entries.forEach(entry => {
        let d = DB.items[entry.id];
        let cnt = entry.cnt || 1;
        removeUids.add(entry.uid);
        for (let u = 0; u < cnt; u++) {
            if ((entry.en || 0) >= Math.min(goal, enhanceCap(d))) { skipped++; survivors.push({ ...entry, cnt: 1, uid: uid() }); continue; }   // 已達/超過目標（或已達淬鍊上限）：原樣保留
            let r = _quickEnhanceUnit(d, entry.en || 0, goal, scrollStacks, st.useBless);   // 🌟 st.useBless＝使用祝福卷（強化成敗為即時擲骰）
            usedTotal += r.used;
            if (r.destroyed) { destroyed++; continue; }   // 爆裝：不保留
            if (r.en >= goal) reached++; else partial++;  // 抵達 or 卷軸不足停在中途
            survivors.push({ ...entry, cnt: 1, uid: uid(), en: r.en, lock: false });
        }
    });

    // 套用結果：移除原件 → 回寫卷軸 → 加入存活件（同簽章疊加）
    player.inv = player.inv.filter(i => !removeUids.has(i.uid));
    ['scroll_weapon', 'scroll_armor', 'scroll_acc', 'scroll_weapon_b', 'scroll_armor_b'].forEach(sid => {   // 🌟 含祝福卷回寫
        let it = player.inv.find(i => i.id === sid);
        if (it) { it.cnt = scrollStacks[sid].cnt; if (it.cnt <= 0) player.inv = player.inv.filter(x => x.uid !== it.uid); }
    });
    survivors.forEach(s => { let ex = player.inv.find(x => sameItemSig(x, s)); if (ex) ex.cnt = (ex.cnt || 1) + 1; else player.inv.push(s); });

    st.active = false; st.sel = {};
    let parts = [`成功 ${reached} 件`];
    if (partial) parts.push(`卷軸不足停 ${partial} 件`);
    if (skipped) parts.push(`已達標 ${skipped} 件`);
    parts.push(`<span class="text-red-400">爆裝 ${destroyed} 件</span>`);
    logSys(`<span class="text-blue-300 font-bold">快速強化完成（目標 +${goal}${st.useBless ? '·祝福卷' : ''}）：</span>${parts.join('、')}，消耗 ${usedTotal} 張${st.useBless ? '祝福' : ''}卷軸。`);
    calcStats();
    renderTabs(true);
    saveGame();
}

// ========== 🗑️ 快速廢品（批次標記廢品）==========
// 🗑️ v3.5.87 共用資格判定（單一真相）：渲染端（背包列勾選框）與執行端（_qjEligibleItems）都用它（理由同 _qeCanSelect）
// ⚠️ noJunk 現況：DB.items 靜態只有 8 筆（席琳遺骸 rem_*·全為 type:'acc'），另由本檔「娃娃硬保護」在載入後
//    動態補上 50 筆魔法娃娃（doll·同樣是 type:'acc'）→ 兩者都落在防具分頁(arm)。
//    因此下方 d.noJunk 判定實際只對 arm 分頁生效；道具分頁(item)現無任何 noJunk 資料命中（死條件），
//    保留供日後出現 type:'misc'/藥水卷軸類的 noJunk 物品使用。
function _qjCanSelect(d, i, type) {
    if (!d || i.lock || d.noJunk) return false;   // 🎴 noJunk(收集冊等)不納入快速廢品
    if (type === 'wpn') return d.type === 'wpn';
    if (type === 'arm') return d.type === 'arm' || d.type === 'acc';
    return d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc';
}
// 該分頁可批次標記廢品的背包物品（未鎖定）：wpn=武器(含箭矢)、arm=防具/飾品、item=其餘（藥水/卷軸/書/材料等）
function _qjEligibleItems(type) {
    return player.inv.filter(i => _qjCanSelect(DB.items[i.id], i, type));
}
// ⚡🗑️ 分頁頂端快速操作表頭：武器/防具＝[快速強化][快速廢品]；道具＝[快速廢品]（強化進行中沿用原強化表頭）
function buildQuickHeader(type) {
    let hasEnh = (type === 'wpn' || type === 'arm');
    if (hasEnh && quickEnh[type].active) return buildQuickEnhanceHeader(type);   // 強化進行中：沿用原強化表頭
    let jnk = quickJunk[type];
    if (jnk.active) _qjSync(type);   // 🔧 渲染前先同步新掉落物品到面板狀態（新廢品預先勾選），確認時才不會誤取消其標記
    let hdr = document.createElement('div');
    hdr.className = 'sticky top-0 z-10 bg-slate-800 pb-2';   // 🔧 遮擋條改用與框底色(.panel=#1e293b=slate-800)相同色→融入面板不突兀；仍為不透明：滾動時物品不會從按鈕上/下方透出
    // 🔧 表頭上緣亦覆蓋容器的 12px 上內距(p-3)：往上拉時 sticky 黏在裁切邊(top/margin-top:-12)、paddingTop:12 維持按鈕原位 → 物品也不會從按鈕「上方」透出（滾動後＝滾動前）。用 inline style（Tailwind CDN JIT 不保證新 class 即時生成）
    hdr.style.top = '-12px'; hdr.style.marginTop = '-12px'; hdr.style.paddingTop = '12px';
    if (jnk.active) {   // 快速廢品進行中：取消／確認／全選（無數值選擇）
        let eligible = _qjEligibleItems(type);
        let allSel = eligible.length > 0 && eligible.every(i => jnk.sel[i.uid]);
        let someSel = eligible.some(i => jnk.sel[i.uid]);
        hdr.innerHTML = `<div class="flex items-center gap-1 bg-slate-900/80 border border-amber-800/60 rounded p-1">
            <button onclick="cancelQuickJunk('${type}')" class="btn border-slate-600 bg-slate-700 hover:bg-slate-600 px-2 py-1 text-xs font-bold text-white rounded">取消</button>
            <button onclick="runQuickJunk('${type}')" class="btn border-amber-600 bg-amber-800 hover:bg-amber-700 px-2 py-1 text-xs font-bold text-amber-100 rounded">確認</button>
            <label class="flex items-center gap-1 text-xs text-slate-300 cursor-pointer select-none whitespace-nowrap ml-auto"><input type="checkbox" ${allSel ? 'checked' : ''} onchange="quickJunkSelectAll('${type}', this.checked)"> 全選</label>
        </div>`;
        let cb = hdr.querySelector('label input'); if (cb) cb.indeterminate = someSel && !allSel;
        return hdr;
    }
    // 皆未啟用：顯示按鈕（武器/防具有強化＋廢品；道具僅廢品）
    let btns = '';
    if (hasEnh) btns += `<button onclick="toggleQuickEnhance('${type}')" class="flex-1 btn border-blue-700 bg-blue-900/70 hover:bg-blue-800 py-1.5 text-sm font-bold text-blue-200 rounded shadow">⚡ 快速強化</button>`;
    btns += `<button onclick="toggleQuickJunk('${type}')" class="flex-1 btn border-amber-700 bg-amber-900/60 hover:bg-amber-800 py-1.5 text-sm font-bold text-amber-200 rounded shadow">🗑️ 快速廢品</button>`;
    hdr.innerHTML = `<div class="flex gap-1">${btns}</div>`;
    return hdr;
}
// 啟用快速廢品：取消同分頁快速強化＋預先勾選「已是廢品」者（用戶要求：廢品一開始就是勾選中）
function toggleQuickJunk(type) {
    if ((type === 'wpn' || type === 'arm') && quickEnh[type].active) { quickEnh[type].active = false; quickEnh[type].sel = {}; }
    let st = quickJunk[type]; st.active = true; st.sel = {}; st.known = {};
    _qjEligibleItems(type).forEach(i => { st.known[i.uid] = true; if (i.junk) st.sel[i.uid] = true; });   // 開啟當下：全部納入 known，已是廢品者預先勾選
    renderTabs(true);
}
// 🔧 面板開啟後才掉落／新增的可廢品物品：比照「開啟當下」納入面板——標記 known，且「已是廢品(junkPrefs 自動標記)」者預先勾選。
//    這樣確認時不會把這些新廢品當成「未勾選」而誤 i.junk=false＋刪除 junkPrefs（刪簽章＝整類廢品記憶被取消）。已在 known 者不再覆寫其勾選狀態（尊重使用者手動取消勾選）。
function _qjSync(type) {
    let st = quickJunk[type]; if (!st.active) return;
    if (!st.known) st.known = {};
    _qjEligibleItems(type).forEach(i => { if (!st.known[i.uid]) { st.known[i.uid] = true; if (i.junk) st.sel[i.uid] = true; } });
}
function cancelQuickJunk(type) { let st = quickJunk[type]; st.active = false; st.sel = {}; st.known = {}; renderTabs(true); }
function quickJunkSelectAll(type, checked) { let st = quickJunk[type]; st.sel = {}; if (checked) _qjEligibleItems(type).forEach(i => st.sel[i.uid] = true); renderTabs(true); }
function toggleQuickJunkItem(type, uid) { let st = quickJunk[type]; if (st.sel[uid]) delete st.sel[uid]; else st.sel[uid] = true; renderTabs(true); }
// 確認：依勾選最終狀態設定每件 junk（勾＝廢品、未勾＝取消廢品），同步 junkPrefs（記憶/取消記憶）
function runQuickJunk(type) {
    let st = quickJunk[type];
    _qjSync(type);   // 🔧 確認前再同步一次：戰鬥節流期間(renderTabs 被合併)剛掉落的廢品也納入並預先勾選，避免被當未勾選誤取消標記
    if (!player.junkPrefs) player.junkPrefs = {};
    let marked = 0, unmarked = 0;
    _qjEligibleItems(type).forEach(i => {
        let want = !!st.sel[i.uid];
        if (want === !!i.junk) return;   // 無變動
        i.junk = want;
        if (want) { player.junkPrefs[itemSig(i)] = true; delete i._userKeep; marked++; }
        else { delete player.junkPrefs[itemSig(i)]; unmarked++; if (i._ruleJunk) { i._userKeep = true; i._ruleJunk = false; delete i.junkSince; delete i._autoSellQty; } }   // 🛡️ v2.6.69 審計#10：取消「規則標記」的廢品→記住玩家意圖，自動販賣不再重標（直到重新儲存規則）
    });
    if (marked > 0) _bumpJunkSellTimer();   // 🗑️ 有新標記廢品→重置自動賣出倒數（標完 10 秒（掃描節奏；真正的寬限期是 autoSellRules.delaySec，預設 60 秒）才賣）
    st.active = false; st.sel = {}; st.known = {};
    logSys(`<span class="text-amber-300 font-bold">快速廢品完成：</span>標記 ${marked} 件、取消 ${unmarked} 件。`);
    renderTabs(true);
    saveGame();
}

// 計算物品賣價（含詞綴疊乘）：與物品面板顯示價一致
function getSellPrice(item) {
    let d = DB.items[item.id];
    if (!d) return 0;
    let price = Math.floor((d.p || 0) * 0.3);   // 賣價為定價的 30%（經典模式與一般模式相同）
    let mult = 1;
    if (getAttrAffix(item.attr)) mult *= 10;
    if (item.bless === true) mult *= 10;   // 🔧 僅「祝福的」享 10 倍賣價；'cursed'（詛咒的）為負面詞綴不加價
    if (item.anc)   mult *= 10;
    return price * mult;
}

// 🗑️ 玩家手動標示廢品 → 把自動賣出倒數重置為 10 秒（掃描節奏；真正的寬限期是 autoSellRules.delaySec，預設 60 秒）（標完 10 秒（掃描節奏；真正的寬限期是 autoSellRules.delaySec，預設 60 秒）沒有新動作才會賣，避免剛標就被賣掉）。
//    ⚠️farming 自動標記（junkPrefs 命中掉落，js/04/js/08 gainItem）刻意不呼叫此函式，否則持續掉落會讓倒數永遠被重置、永不賣出。
function _bumpJunkSellTimer() {
    if (typeof state !== 'undefined' && state) state._junkSellAt = (state.ticks || 0) + JUNK_AUTOSELL_TICKS;
}

// 切換「廢品」勾選（僅背包內武器/防具/飾品；鎖定者無法勾選且自動取消）
function toggleJunk(uid) {
    let item = player.inv.find(i => i.uid === uid);
    if (!item) return;
    let d = DB.items[item.id];
    if (!d) return;
    if (!player.junkPrefs) player.junkPrefs = {};
    if (item.lock) { item.junk = false; openModal(item, false); return; }
    if (d.noJunk) { item.junk = false; delete player.junkPrefs[itemSig(item)]; openModal(item, false); return; }   // 🎴 收集冊等 noJunk：無法標示為廢品
    item.junk = !item.junk;
    // 🔧 記憶廢品勾選（依完整簽章 id＋詞綴）：之後獲得「完全相同詞綴」的同種物品自動標記，直到玩家取消勾選為止
    if (item.junk) { player.junkPrefs[itemSig(item)] = true; delete item._userKeep; _bumpJunkSellTimer(); }   // 🗑️ 標為廢品→重置自動賣出倒數（標完 10 秒（掃描節奏；真正的寬限期是 autoSellRules.delaySec，預設 60 秒）才賣）
    else { delete player.junkPrefs[itemSig(item)]; if (item._ruleJunk) { item._userKeep = true; item._ruleJunk = false; delete item.junkSince; delete item._autoSellQty; } }   // 🛡️ v2.6.69 審計#10：取消「規則標記」→ 記住玩家意圖，applyAutoSellRules 不再重標（防呆說明「可取消廢品標記」自此屬實）
    openModal(item, false);
    renderTabs();
}

// 一鍵排列：依規則重新排序背包（武器 / 防具飾品 / 道具 各自分頁內排序）
// 🗑️ v3.5.83 移除 legacyInvSortCmp：零呼叫點，且其規則已與現行 invSortCmp 分歧（缺鎖定/廢品優先、
//    缺分類/品質/名稱排序模式、缺 seteff/legend/cardTier 排名）——留著只會讓排序規則的修改落到永不執行的程式碼。
//    現行單一真相＝下方的 invSortCmp（背包「一鍵排列」與倉庫共用）。

// 🔧 v2.6.73 一鍵排列改「獲得物品時自動觸發」（gainItem 尾端掛點）：每 10 秒最多 1 次·靜默（不 saveGame·排序結果隨其他存檔點落地）
// 🔧 v2.6.80 與「啟用自動販賣」合併控制（用戶要求）：player.autoSellOn=false 時自動排列一併停用
// 背包整理：判斷物品目前的結果，不區分加工或掉落來源。
const INV_SORT_MODE_KEY = 'inventorySortMode';
function inventorySortMode(){ return (player && player[INV_SORT_MODE_KEY]) || 'category'; }
function inventoryDef(i){ return (i && DB.items[i.id]) || {}; }
function inventoryTypeRank(i,d){ return d.type==='wpn'?0:((d.type==='arm'||d.type==='acc'||d.doll||d.slot==='doll')?1:2); }
function weaponSortRank(i,d){
    let s=(i.id||'')+'|'+(d.n||'')+'|'+(typeof getWeaponTags==='function'?getWeaponTags(i.id).join('|'):'');
    if(/dagger|匕首/.test(s))return 0; if(/katana|武士刀/.test(s))return 1;
    if(/2hsword|雙手劍/.test(s))return 3; if(/sword|劍/.test(s))return 2;
    if(/spear|矛|槍/.test(s))return 4; if(/2h.*axe|giantaxe|battleaxe|雙手鈍器|雙手斧/.test(s))return 6;
    if(/axe|hammer|mace|鈍器|斧/.test(s))return 5; if(/bow|弓/.test(s))return 7;
    if(/claw|鋼爪/.test(s))return 8; if(/dual|雙刀/.test(s))return 9;
    if(/chain|鎖鏈劍/.test(s))return 10; if(/wand|staff|法杖/.test(s))return 11; return 90;
}
function armorSortRank(i,d){
    let s=(d.slot||'')+'|'+(i.id||'')+'|'+(d.n||'');
    if(/helm|head|頭盔/.test(s))return 0; if(/shirt|內衣|T恤/.test(s))return 1;
    if(/armor|body|盔甲/.test(s))return 2; if(/cloak|斗篷/.test(s))return 3;
    if(/shield|盾/.test(s))return 4; if(/glove|手套/.test(s))return 5;
    if(/boot|shoe|長靴|靴/.test(s))return 6; if(/ear|耳環/.test(s))return 7;
    if(/amulet|neck|項鍊/.test(s))return 8; if(/ring|戒指/.test(s))return 9;
    if(/belt|腰帶/.test(s))return 10; if(d.doll||/doll|娃娃/.test(s))return 11; return 90;
}
function itemSortRank(i,d){
    if(d.eff==='card')return 0;
    let s=(d.type||'')+'|'+(i.id||'')+'|'+(d.n||'');
    if(/pot|potion|藥水/.test(s))return 1; if(/scroll|卷軸/.test(s))return 2;
    if(/skillbk|魔法書|法術書|精靈水晶|技能書/.test(s))return 3;
    if(/gem|crystal|寶石|水晶/.test(s))return 4; if(/material|材料/.test(s))return 5;
    if(/quest|任務/.test(s))return 6; return 90;
}
function inventorySubRank(i,d){ let c=inventoryTypeRank(i,d); return c===0?weaponSortRank(i,d):(c===1?armorSortRank(i,d):itemSortRank(i,d)); }
function inventoryNameCmp(a,b){ return (inventoryDef(a).n||a.id||'').localeCompare(inventoryDef(b).n||b.id||'','zh-Hant'); }
function ancientSortRank(v){ return v==='primordial'?4:(v==='immortal'?3:(v==='eternal'?2:(v?1:0))); }
function attributeSortRank(v){ if(!v||(typeof getAttrAffix==='function'&&!getAttrAffix(v)))return 0; let m=String(v).match(/(\d+)/g); return 1+(m?Number(m[m.length-1]):0); }
function inventoryQualityCmp(a,b){
    if(!!a.lock!==!!b.lock)return a.lock?-1:1; if(!!a.junk!==!!b.junk)return a.junk?1:-1;
    if((b.en||0)!==(a.en||0))return (b.en||0)-(a.en||0);
    if(!!a.seteff!==!!b.seteff)return a.seteff?-1:1;
    if(a.seteff&&b.seteff){let s=String(a.seteff).localeCompare(String(b.seteff),'zh-Hant');if(s)return s;}
    let aa=ancientSortRank(a.anc),ab=ancientSortRank(b.anc);if(aa!==ab)return ab-aa;
    let xa=attributeSortRank(a.attr),xb=attributeSortRank(b.attr);if(xa!==xb)return xb-xa;
    let ba=a.bless===true?1:0,bb=b.bless===true?1:0;if(ba!==bb)return bb-ba;
    let la=inventoryDef(a).legend?1:0,lb=inventoryDef(b).legend?1:0;if(la!==lb)return lb-la;
    let ca=a.bless==='cursed'?1:0,cb=b.bless==='cursed'?1:0;if(ca!==cb)return ca-cb;
    let ta=inventoryDef(a).cardTier||0,tb=inventoryDef(b).cardTier||0;if(ta!==tb)return tb-ta;
    return inventoryNameCmp(a,b);
}
const invSortCmp=function(a,b){
    let da=inventoryDef(a),db=inventoryDef(b),mode=inventorySortMode();
    if(!!a.lock!==!!b.lock)return a.lock?-1:1; if(!!a.junk!==!!b.junk)return a.junk?1:-1;
    let ca=inventoryTypeRank(a,da),cb=inventoryTypeRank(b,db);if(ca!==cb)return ca-cb;
    let sa=inventorySubRank(a,da),sb=inventorySubRank(b,db);
    if(mode==='name'){let n=inventoryNameCmp(a,b);return n||inventoryQualityCmp(a,b);}
    if(mode==='quality'){let q=inventoryQualityCmp(a,b);return q||(sa-sb)||inventoryNameCmp(a,b);}
    if(sa!==sb)return sa-sb; return inventoryQualityCmp(a,b);
};
function setInventorySortMode(mode){
    if(!player||!['category','quality','name'].includes(mode))return;
    player[INV_SORT_MODE_KEY]=mode; player.inv.sort(invSortCmp);
    if(typeof resetCatchupGainItemIndex==='function')resetCatchupGainItemIndex();
    if(typeof saveGame==='function')saveGame(); renderTabs(true);
}
function toggleInventoryAutoSort(on){ if(!player)return;player.inventoryAutoSort=!!on;if(typeof saveGame==='function')saveGame(); }

let _autoSortAt = -99999;
function autoSortInventory() {
    if (typeof _deferItemTransactionEffect === 'function' && _deferItemTransactionEffect(autoSortInventory, arguments)) return;
    if (!player || !Array.isArray(player.inv) || typeof state === 'undefined' || !state.running) return;   // 遊戲未開始（創角配發起始道具等）不排
    if (player.inventoryAutoSort === false) return;   // 整理開關獨立於自動販賣
    if (state.ticks - _autoSortAt < 100) return;   // ⏲️ 10 秒節流（100 ticks）
    _autoSortAt = state.ticks;
    player.inv.sort(invSortCmp);
    if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();
    renderTabs(true);
}
// 🔧 v2.6.80 規則視窗「立即一鍵排列」：純排序＋提示·不 saveGame（避免把視窗草稿規則一併落地·排序結果隨其他存檔點落地）·視窗保持開啟
function sortInventoryNow() {
    if (!player || !Array.isArray(player.inv)) return;
    player.inv.sort(invSortCmp);
    if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();
    renderTabs(true);
    logSys('<span class="text-cyan-300 font-bold">背包已重新排列。</span>');
}
// 🔧 v2.6.74 自動化設定改「分頁內嵌」（#tab-automation·與能力/技能同框架·switchTab 切換）；v2.6.73 的浮動視窗與 toggleAutomationWindow 已移除。
//    set-* 控制項恆在 DOM（分頁隱藏時仍可 getElementById 讀值）→ saveGame/自動化邏輯完全不受影響。
// 🗑️ v3.5.83 移除 sortInventory()：零呼叫點，現行入口為 sortInventoryNow()。

// 一鍵賣出所有已勾為廢品的武器/防具/飾品（鎖定者不會被賣，因鎖定時已自動取消勾選）
// ⏲️ 自動賣出廢品：由主迴圈 tick（每 10 秒·JUNK_AUTOSELL_TICKS）呼叫；賣掉所有標示為廢品(且非鎖定/可販售)的物品。無廢品→靜默不洗版。
//    ⚡ 2026-07-01 效能：自動路徑（manual 未帶）賣出後「不 saveGame」——避免每 10 秒都壓縮整包存檔；賣掉的廢品/金幣靠其他既有存檔點(頭目擊殺/換地圖/裝備/操作/手動存檔)落地，崩潰重載最多回到未賣狀態(廢品仍在→下輪重標再賣·自癒)。手動「一鍵賣出」仍立即 saveGame。
function autoSellJunk(manual) {   // manual=true → 玩家按「一鍵賣出」立即賣(並存檔)；不帶參數＝主迴圈自動賣(靜默·不存檔)
    if (!player || !Array.isArray(player.inv)) return;
    // 🛡️ 規則視窗開著（草稿制）時，背景自動賣一律停手。
    //    setAutoSellOverride/deleteAutoSellOverride 會把「還沒儲存」的草稿寫進 live player.autoSellRules，
    //    而這個迴圈每 10 秒跑一次 → 玩家還在調規則、按 Close 想撤銷之前，東西就已經被永久賣掉了。
    if (!manual && _asBackup) return;
    if (!manual && typeof applyAutoSellRules === 'function') applyAutoSellRules();
    let _delayMs = manual ? 0 : ((typeof getAutoSellRules === 'function' ? getAutoSellRules().delaySec : 10) * 1000);
    let _now = Date.now();
    let toSell = player.inv.filter(i => {
        let d = DB.items[i.id];
        if (i.junk && !i.junkSince) i.junkSince = _now;
        return i.junk && !i.lock && d && !d.noSell && (manual || (_now - i.junkSince >= _delayMs));
    });
    if (toSell.length === 0) { if (manual) logSys('<span class="text-slate-400">目前沒有標記為廢品的物品可賣出（請先在 武器／防具／道具 分頁用「🗑️ 快速廢品」標記）。</span>'); return; }   // 無廢品→自動靜默、手動給提示
    let totalGold = 0, totalCount = 0;
    toSell.forEach(i => { let q = Math.min(i.cnt, i._autoSellQty || i.cnt); totalGold += getSellPrice(i) * q; totalCount += q; });
    let _grantSold = toSell.some(i => DB.items[i.id] && DB.items[i.id].grantSkills);
    // ⚠️ uid 精準移除：舊寫法 player.inv.filter(i => i.cnt > 0) 會把「cnt 為 undefined 的舊存檔物品」
    //    連同鎖定件、noSell 任務道具一併靜默刪除，而本函式每 10 秒由 gameLoop 自動跑一次＝無人看管的資料流失。
    let _gone = new Set();
    toSell.forEach(i => { let q = Math.min(i.cnt, i._autoSellQty || i.cnt); i.cnt -= q; delete i._autoSellQty; if (i.cnt > 0) { i.junk = false; delete i.junkSince; } else _gone.add(i.uid); });
    if (_gone.size) player.inv = player.inv.filter(i => !_gone.has(i.uid));
    player.gold += totalGold;
    logSys(`<span class="text-amber-300">${manual ? '一鍵賣出' : '系統自動賣出'} ${toSell.length} 件(共 ${totalCount} 個)廢品，獲得 <span class="text-yellow-400 font-bold">${totalGold}</span> 金幣。</span>`);
    renderTabs();
    updateUI();
    if(_grantSold) { calcStats(); renderSkillSelects(); }
    if(manual) saveGame();   // ⚡ 只有手動「一鍵賣出」才立即存檔；自動賣出不 saveGame（避免每 10 秒壓縮整包存檔·靠其他存檔點落地）
}

// 🗑️ 自動賣出狀態指示（右上角按鈕）：亮＝自動賣出開啟(每 10 秒)；暗＋文字「停止賣出」＝已暫停。
//    狀態存 player.autoSellOn(預設開·undefined 視為開)，隨存檔持久化。
// 🗑️ v3.5.94 修正註解：這顆按鈕**不是**開關——#btn-autosell 於 index.html 綁的是 openAutoSellRules()，點下去只會開啟規則視窗。
//    真正的開關是自動販賣視窗內的 as-on 勾選框（由 openAutoSellRules() 內的表單模板字串 inline 產生、讀取於 _readAutoSellForm）；
//    （🔧 v3.5.95 更正：v3.5.94 這句原本寫「渲染於 _renderAutoSellForm」，該函式全專案不存在。）
//    _renderAutoSellBtn 只負責把「開/停」狀態畫到按鈕上，不改變狀態。
// 🗑️ v3.5.83 移除 toggleAutoSell()：零呼叫點（舊的點擊切換行為已不存在）。
function _renderAutoSellBtn() {
    let b = document.getElementById('btn-autosell'); if (!b) return;
    let on = !player || player.autoSellOn !== false;   // 預設(undefined)＝開
    b.textContent = on ? '自動賣出' : '停止賣出';
    b.style.opacity = on ? '' : '0.4';            // 變暗＝停止
    b.style.filter = on ? '' : 'grayscale(0.85)';
    b.title = on ? '自動販賣已開啟。' : '自動販賣已停止。';
}

// ===== 自動販賣規則（初版） =====
function getAutoSellRules() {
    if (!player.autoSellRules) player.autoSellRules = {
        delaySec: 60,
        protectBless: true, protectAnc: true, protectAttr: true, protectSet: true, protectLegend: true, protectOldSeries: true,
        protectRelic: true,
        protectCraftEquip: true, craftSets: 1,
        equip: { wpn: { on:false, max:0 }, arm: { on:false, max:0 }, acc: { on:false, max:0 } },
        misc: {}, overrides: {}
    };
    let r = player.autoSellRules;
    if (!r.equip) r.equip = {};
    ['wpn','arm','acc'].forEach(k => { if (!r.equip[k]) r.equip[k] = { on:false, max:0 }; });
    if (!r.misc) r.misc = {};
    if (!r.overrides) r.overrides = {};
    if (r.delaySec == null) r.delaySec = 60;
    ['protectBless','protectAnc','protectAttr','protectSet','protectLegend'].forEach(k => { if (r[k] == null) r[k] = true; });   // 🔧 v2.6.77 加 保護傳說裝備（預設開）
    if (r.protectOldSeries == null) r.protectOldSeries = true;   // 🏛️ v2.7.56 保護解封後古老系列（預設開）
    if (r.protectRelic == null) r.protectRelic = true;   // 🏺 v3.1.44 保護遺物（預設開）
    if (r.protectCraftEquip == null) r.protectCraftEquip = true;
    if (r.craftSets == null) r.craftSets = 1;
    return r;
}
// ===== 🔧 v2.6.91 合併 2683 參考版 5 功能 =====
// 功能5：套用全部存檔（8 角色共用自動販賣設定·存全域 localStorage·各角色載入時套用）
const AUTOSELL_GLOBAL_KEY = 'lineage_idle_autosell_global_v1';
function _autoSellClone(v){ return JSON.parse(JSON.stringify(v)); }
function _getGlobalAutoSellSettings(){
    try { let s=_lzGet(AUTOSELL_GLOBAL_KEY); if(!s)return null; let x=JSON.parse(s); return x&&x.enabled&&x.rules?x:null; } catch(e){ return null; }
}
function applyGlobalAutoSellSettings(){
    let x=_getGlobalAutoSellSettings();
    if(x){ player.autoSellRules=_autoSellClone(x.rules); player.autoSellOn=x.on!==false; player.autoSellGlobal=true; }
    else player.autoSellGlobal=false;
}
function _saveGlobalAutoSellSettings(enabled){
    player.autoSellGlobal=!!enabled;
    if(enabled) _lzSet(AUTOSELL_GLOBAL_KEY,JSON.stringify({enabled:true,on:player.autoSellOn!==false,rules:_autoSellClone(getAutoSellRules())}));
    else _lsRemove(AUTOSELL_GLOBAL_KEY);
}
// 功能1：娃娃硬保護——原資料雖註明不可販賣，部分項目未帶 noSell/noJunk；資料表載入後統一補上。
Object.values(DB.items).forEach(d=>{if(d&&(d.doll||d.slot==='doll')){d.noSell=true;d.noJunk=true;}});
// 功能3/4：保護製作素材裝備——掃全部製作配方，算出「每種當素材的裝備」需求量（保留可製作 N 次的份量）
let _craftEquipNeedCache=null;
function _craftEquipNeeds(){
    if(_craftEquipNeedCache)return _craftEquipNeedCache;
    let out={};
    let add=rec=>{let mats=(rec&&((rec.req)||(rec.mats)))||[];if(rec&&rec.src)mats=mats.concat([{id:rec.src,cnt:1}]);mats.forEach(m=>{let id=m.id||m[0],n=Number(m.n||m.cnt||m[1]||0),d=DB.items[id];if(id&&n>0&&_asEquipType(d))out[id]=Math.max(out[id]||0,n);});};
    try{if(typeof CRAFT_RECIPES!=='undefined')Object.values(CRAFT_RECIPES).flat().forEach(add);}catch(e){}
    try{if(typeof DEMONKING_RECIPES!=='undefined')DEMONKING_RECIPES.forEach(add);}catch(e){}
    try{if(typeof LUMIEL_RECIPES!=='undefined')LUMIEL_RECIPES.forEach(add);}catch(e){}
    return (_craftEquipNeedCache=out);
}
function _craftReserveMap(r){let x={};if(r.protectCraftEquip){let sets=Math.max(1,Number(r.craftSets)||1);Object.entries(_craftEquipNeeds()).forEach(([id,n])=>x[id]=n*sets);}return x;}
function _asTypeLabel(t) {
    return ({pot:'藥水',scroll:'卷軸',book:'魔法書／技能書',skillbk:'技能書',mat:'材料',gem:'寶石',etc:'製作材料',misc:'特殊道具',quest:'任務道具',wpn:'武器',arm:'防具',acc:'飾品'})[t] || t;
}
function _asEquipType(d) {
    if (!d) return null;
    if (d.type === 'wpn' && !d.isArrow) return 'wpn';
    if (d.type === 'arm') return 'arm';
    if (d.type === 'acc') return 'acc';
    return null;
}
function _autoSellDecision(i, ruleSnapshot, craftRemain) {   // 🔧 v2.6.77 ruleSnapshot：預覽用「快照複本」判定，不讀（也不寫）live 規則；v2.6.91 craftRemain：製作素材保留額度（逐件扣）
    let r = ruleSnapshot || getAutoSellRules(), d = DB.items[i.id];
    if (!d || i.lock || d.noSell || d.noJunk) return { sell:false };
    if (i._userKeep) return { sell:false };   // 🛡️ v2.6.69 審計#10：玩家曾手動取消規則標記→豁免自動販賣（重新儲存規則時清除）
    let ov = r.overrides[i.id];
    if (ov === 'keep') return { sell:false };
    if (ov === 'sell') return { sell:true, qty:i.cnt };
    // 🏛️ v2.7.56 解除封印後的「古老的○○」是普通武器／防具，沒有詞綴且多數無法強化，會立即符合一般裝備販賣規則；整系列優先保護（個別「永遠販賣」例外仍優先，故置於 overrides 之後）。
    if (r.protectOldSeries && (String(i.id).startsWith('wpn_old_') || String(i.id).startsWith('amr_old_'))) return { sell:false };
    if (r.protectRelic !== false && typeof isRelic === 'function' && isRelic(d)) return { sell:false };   // 🏺 v3.1.44 保護遺物（預設開·個別「永遠販賣」例外仍優先）
    let et = _asEquipType(d);
    if (et) {
        let protectedQty=0;   // 🔧 v2.6.91 功能3/4：製作素材裝備保留額度（保留可製作 N 次的數量·多餘才依規則賣）
        if(craftRemain&&craftRemain[i.id]>0){protectedQty=Math.min(Number(i.cnt)||1,craftRemain[i.id]);craftRemain[i.id]-=protectedQty;}
        let er = r.equip[et];
        if (!er || !er.on || (i.en || 0) > Number(er.max || 0)) return { sell:false };
        if ((r.protectBless && i.bless) || (r.protectAnc && i.anc) || (r.protectAttr && i.attr) || (r.protectSet && i.seteff) || (r.protectLegend && d.legend)) return { sell:false };   // 🔧 v2.6.77 保護傳說裝備
        return { sell:(Number(i.cnt)||1)>protectedQty, qty:Math.max(0,(Number(i.cnt)||1)-protectedQty) };
    }
    let mr = r.misc[d.type];
    if (!mr || !mr.on) return { sell:false };
    let keep = Math.max(0, Number(mr.keep || 0));
    return { sell:i.cnt > keep, qty:Math.max(0, i.cnt - keep) };
}
function applyAutoSellRules(force) {
    if (!player || !Array.isArray(player.inv)) return;
    if(player.autoSellOn===false&&!force){player.inv.forEach(i=>{if(i._ruleJunk){i.junk=false;delete i.junkSince;delete i._autoSellQty;delete i._ruleJunk;}});return;}   // 🔧 v2.6.91 功能2：停用自動販賣→清除規則產生的廢品標記（force=立即賣出時不清）
    let now = Date.now();
    let craftRemain=_craftReserveMap(getAutoSellRules());   // 🔧 v2.6.91 功能3/4：製作素材保留額度圖
    player.inv.forEach(i => {
        let x = _autoSellDecision(i,null,craftRemain);
        if (x.sell) {
            if (!i.junk) i.junkSince = now;
            i.junk = true; i._autoSellQty = x.qty;
        } else if (i._ruleJunk) {
            i.junk = false; delete i.junkSince; delete i._autoSellQty;
        }
        i._ruleJunk = !!x.sell;
    });
}
let _asBackup = null;   // 🛡️ v2.6.69 審計#11：規則視窗草稿制——開窗拍快照；Close＝還原（不生效）、儲存規則＝生效
function openAutoSellRules() {
    let r = getAutoSellRules();
    if (!_asBackup) _asBackup = { rules: JSON.parse(JSON.stringify(r)), on: player.autoSellOn, global:!!player.autoSellGlobal };   // 只在「第一次開窗」快照（setAutoSellOverride 重繪不覆蓋草稿基準）
    let old = document.getElementById('autosell-rule-modal'); if (old) old.remove();
    let miscTypes = [...new Set(Object.values(DB.items).filter(d => d && !_asEquipType(d)).map(d => d.type).filter(Boolean))].sort();
    let ids = Object.keys(DB.items).filter(id => DB.items[id]).sort((a,b) => (DB.items[a]?.n || a).localeCompare(DB.items[b]?.n || b, 'zh-Hant'));
    let exceptionTypes = [...new Set(ids.map(id => _asEquipType(DB.items[id]) || DB.items[id].type).filter(Boolean))].sort();
    let equipRows = [['wpn','武器'],['arm','防具'],['acc','飾品']].map(([k,n]) => `<label class="as-row"><input id="as-e-${k}" type="checkbox" ${r.equip[k].on?'checked':''}> ${n}，強化值 ≤ <input id="as-em-${k}" type="number" min="0" max="99" value="${r.equip[k].max}"> 自動販賣</label>`).join('');
    let miscRows = miscTypes.map(t => { let x=r.misc[t]||{on:false,keep:0}; return `<label class="as-row"><input class="as-misc" data-type="${t}" type="checkbox" ${x.on?'checked':''}> ${_asTypeLabel(t)}：每種保留 <input class="as-keep" data-type="${t}" type="number" min="0" value="${x.keep}"> 個，多餘販賣</label>`; }).join('');
    let itemRows = ids.map(id => `<option value="${id}">${DB.items[id]?.n || id}</option>`).join('');
    let exceptionTypeRows = exceptionTypes.map(t => `<option value="${t}">${_asTypeLabel(t)}</option>`).join('');
    let rules = Object.entries(r.overrides).map(([id,v]) => `<div class="as-ex"><span>${DB.items[id]?.n || id}</span><b>${v==='keep'?'永遠保留':'永遠販賣'}</b><button onclick="deleteAutoSellOverride('${id}')">刪除</button></div>`).join('') || '<div class="as-muted">目前沒有個別例外</div>';
    let el=document.createElement('div'); el.id='autosell-rule-modal'; el.innerHTML=`<style>
      #autosell-rule-modal{position:fixed;inset:0;background:#020617aa;z-index:10050;display:flex;align-items:center;justify-content:center;color:#e2e8f0}
      .as-box{width:min(720px,92vw);max-height:88vh;overflow:auto;background:#172033;border:2px solid #b7791f;border-radius:14px;padding:18px;box-shadow:0 18px 60px #000}
      .as-head{display:flex;justify-content:space-between;align-items:center;font-size:23px;font-weight:bold;color:#fde68a}.as-sec{background:#0f172acc;border:1px solid #475569;border-radius:10px;padding:12px;margin-top:12px}.as-title{font-weight:bold;color:#fbbf24;margin-bottom:7px}.as-row{display:block;padding:5px 0}.as-row input[type=number]{width:72px;background:#020617;border:1px solid #64748b;border-radius:5px;padding:3px;text-align:center}.as-row input[type=checkbox]{width:18px;height:18px;vertical-align:middle}.as-help,.as-muted{font-size:13px;color:#94a3b8}.as-actions{display:flex;gap:8px;margin-top:12px}.as-actions button,.as-head button,.as-ex button,.as-ex-tools button{background:#334155;border:1px solid #64748b;border-radius:6px;padding:6px 12px}.as-actions .primary{background:#92400e;border-color:#f59e0b}.as-ex{display:flex;gap:10px;align-items:center;padding:5px;border-bottom:1px solid #334155}.as-ex span{flex:1}.as-ex b{color:#fcd34d}.as-ex-tools{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.as-ex-tools input,.as-ex-tools select,select{background:#020617;border:1px solid #64748b;padding:6px;border-radius:6px}.as-ex-tools input{min-width:180px;flex:1}.as-btnrow{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.as-quick-actions{display:inline-flex;align-items:center;gap:8px;flex:0 0 auto}.as-sell-now-btn{margin-left:0;height:38px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;line-height:1;padding:0 12px;border:2px solid #fb923c;border-radius:7px;background:#7c2d12;color:#ffedd5;font-weight:bold;cursor:pointer;box-shadow:0 2px 7px #0008}.as-sell-now-btn:hover{filter:brightness(1.25)}.as-sort-now-btn{border-color:#22d3ee;background:#164e63;color:#cffafe}.as-override-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.as-override-actions button{padding:7px 13px;border:2px solid;border-radius:7px;font-weight:bold;cursor:pointer;box-shadow:0 2px 7px #0008;transition:filter .15s,transform .15s}.as-override-actions button:hover{filter:brightness(1.25);transform:translateY(-1px)}.as-keep-btn{color:#bbf7d0;background:#14532d;border-color:#4ade80!important}.as-sell-btn{color:#fecaca;background:#7f1d1d;border-color:#f87171!important}#as-item{width:min(100%,390px);margin-bottom:7px}
    </style><div class="as-box"><div class="as-head"><span>自動販賣規則</span><button onclick="closeAutoSellRules()">Close</button></div>
      <div class="as-sec"><label class="as-row"><input id="as-on" type="checkbox" ${player.autoSellOn!==false?'checked':''}> 啟用自動販賣</label><label class="as-row"><input id="as-global" type="checkbox" ${player.autoSellGlobal?'checked':''}> 套用全部存檔（8 個角色共用此設定）</label><div class="as-row as-btnrow"><span>物品取得／符合規則後，等待</span><input id="as-delay" type="number" min="10" max="86400" value="${r.delaySec}"><span>秒才販賣</span><span class="as-quick-actions"><button type="button" class="as-sell-now-btn" onclick="sellAutoSellItemsNow()">立即賣出</button><button type="button" class="as-sell-now-btn as-sort-now-btn" onclick="sortInventoryNow()">立即排列</button></span></div><div class="as-help">等待期間可取消廢品標記或鎖定物品；「立即賣出」會跳過等待秒數。背包整理方式與自動整理開關請在背包左側的整理按鈕設定，與自動販賣互不影響。</div></div>
      <div class="as-sec"><div class="as-title">裝備條件</div>${equipRows}<label class="as-row"><input id="as-pb" type="checkbox" ${r.protectBless?'checked':''}> 保護祝福裝備</label><label class="as-row"><input id="as-pa" type="checkbox" ${r.protectAnc?'checked':''}> 保護古代裝備</label><label class="as-row"><input id="as-pt" type="checkbox" ${r.protectAttr?'checked':''}> 保護屬性裝備</label><label class="as-row"><input id="as-ps" type="checkbox" ${r.protectSet?'checked':''}> 保護套裝詞綴裝備</label><label class="as-row"><input id="as-pl" type="checkbox" ${r.protectLegend?'checked':''}> 保護傳說裝備</label><label class="as-row"><input id="as-prelic" type="checkbox" ${r.protectRelic!==false?'checked':''}> 保護遺物</label><label class="as-row"><input id="as-pold" type="checkbox" ${r.protectOldSeries?'checked':''}> 保護解封後的「古老的」系列裝備</label><div class="as-help">解除封印完成後立即保護古老的劍、巨劍、弩槍、鱗甲、皮盔甲、長袍及金屬盔甲，避免成品在取得瞬間被規則標為廢品。</div><label class="as-row"><input id="as-pcraft" type="checkbox" ${r.protectCraftEquip?'checked':''}> 保護製作素材裝備；保留可製作 <input id="as-craftsets" type="number" min="1" max="99" value="${r.craftSets}"> 次的數量</label><div class="as-help">系統會掃描全部製作配方，例如配方需要「暗殺軍王之痕 ×1」，保留 1 次就至少留 1 件，多餘數量才依武器規則處理。</div></div>
      <div class="as-sec"><div class="as-title">材料與一般物品</div>${miscRows}<div class="as-help">任務物品、不可販賣物品與系統保護物品不會被處理。</div></div>
      <div class="as-sec"><div class="as-title">個別例外（全遊戲物品）</div><div class="as-ex-tools"><input id="as-item-search" type="search" placeholder="輸入物品名稱搜尋" oninput="refreshAutoSellItemOptions()"><select id="as-item-type" onchange="refreshAutoSellItemOptions()"><option value="all">全部分類</option>${exceptionTypeRows}</select><select id="as-item-scope" onchange="refreshAutoSellItemOptions()"><option value="all">全部物品</option><option value="held">目前持有</option></select></div><div class="as-override-actions"><select id="as-item">${itemRows}</select><button class="as-keep-btn" onclick="setAutoSellOverride('keep')">永遠保留</button><button class="as-sell-btn" onclick="setAutoSellOverride('sell')">永遠販賣</button></div><div class="as-help">例外依物品本體全局套用，包含未取得物品及其所有強化、祝福、屬性與套裝版本。</div><div id="as-overrides">${rules}</div></div>
      <div class="as-actions"><button onclick="previewAutoSellRules()">預覽符合物品</button><button class="primary" onclick="saveAutoSellRules()">儲存規則</button></div></div>`;
    document.body.appendChild(el);
}
function closeAutoSellRules(){ if(_asBackup){ player.autoSellRules=_asBackup.rules; player.autoSellOn=_asBackup.on; player.autoSellGlobal=_asBackup.global; _asBackup=null; try{_renderAutoSellBtn();}catch(e){} }   // 🛡️ 審計#11：Close＝還原快照——預覽/例外操作寫進的草稿全部撤銷，只有「儲存規則」才生效
    let e=document.getElementById('autosell-rule-modal'); if(e)e.remove(); }
function _readAutoSellForm(ruleSnapshot){   // 🔧 v2.6.77 ruleSnapshot：預覽傳入「快照複本」→ 表單只讀進複本、完全不動 live 規則與 player.autoSellOn
    let r=ruleSnapshot || getAutoSellRules(); r.delaySec=Math.max(10,Number(document.getElementById('as-delay').value)||60); if(!ruleSnapshot) player.autoSellOn=document.getElementById('as-on').checked;
    ['wpn','arm','acc'].forEach(k=>{r.equip[k].on=document.getElementById('as-e-'+k).checked;r.equip[k].max=Math.max(0,Number(document.getElementById('as-em-'+k).value)||0)});
    r.protectBless=document.getElementById('as-pb').checked;r.protectAnc=document.getElementById('as-pa').checked;r.protectAttr=document.getElementById('as-pt').checked;r.protectSet=document.getElementById('as-ps').checked;r.protectLegend=document.getElementById('as-pl').checked;r.protectRelic=document.getElementById('as-prelic').checked;r.protectOldSeries=document.getElementById('as-pold').checked;r.protectCraftEquip=document.getElementById('as-pcraft').checked;r.craftSets=Math.max(1,Number(document.getElementById('as-craftsets').value)||1);if(!ruleSnapshot)player.autoSellGlobal=document.getElementById('as-global').checked;
    document.querySelectorAll('.as-misc').forEach(x=>{let t=x.dataset.type,k=document.querySelector(`.as-keep[data-type="${t}"]`);r.misc[t]={on:x.checked,keep:Math.max(0,Number(k.value)||0)}}); return r;
}
function saveAutoSellRules(){_readAutoSellForm();(player.inv||[]).forEach(i=>{delete i._userKeep;});_saveGlobalAutoSellSettings(player.autoSellGlobal);_asBackup=null;applyAutoSellRules();_renderAutoSellBtn();saveGame();renderTabs();closeAutoSellRules();logSys('<span class="text-amber-300">已儲存自動販賣規則；符合的物品會先進入防呆等待期。</span>')}   // 🔧 v2.6.91 功能5：儲存時把設定寫入/移除全域桶   // 🛡️ 審計#10/#11：儲存＝清除 _userKeep 豁免（規則重編→重新評估）＋捨棄草稿快照（此後 Close 不再還原）
// 🔧 v2.6.77 立即賣出：以目前表單規則「提交生效」（比照儲存規則·但不清 _userKeep 豁免——玩家單件取消仍受保護）→ 關窗 → 走手動一鍵賣出（跳過等待秒數·autoSellJunk(true) 內含 saveGame）
function sellAutoSellItemsNow(){_readAutoSellForm();_asBackup=null;applyAutoSellRules(true);_renderAutoSellBtn();closeAutoSellRules();autoSellJunk(true)}   // 🔧 v2.6.91 force=true：即使開關關閉也強制依規則標記後立即賣
function _autoSellPlainItemName(item) {   // 🔧 v2.6.77 預覽清單去 HTML：getItemFullName 回傳含 <span> 上色 → 轉純文字
    let box = document.createElement('div');
    box.innerHTML = getItemFullName(item);
    return (box.textContent || box.innerText || DB.items[item.id]?.n || item.id).trim();
}
function closeAutoSellPreview(){let e=document.getElementById('autosell-preview-modal');if(e)e.remove()}
// 🔧 v2.6.77 預覽重做（參考用戶 2667 修正版）：①表單讀進「快照複本」→ 預覽零副作用、不儲存規則；②自建 DOM 覆蓋層（z-index 10060 高於規則視窗 10050）→ 不被規則頁蓋住；③物品名稱轉純文字 → 不再出現 HTML 語法
function previewAutoSellRules(){
    let previewRules=JSON.parse(JSON.stringify(getAutoSellRules()));
    _readAutoSellForm(previewRules);
    closeAutoSellPreview();
    let previewCraftRemain=_craftReserveMap(previewRules);let a=(player.inv||[]).map(i=>({i,x:_autoSellDecision(i,previewRules,previewCraftRemain)})).filter(o=>o.x.sell);   // 🔧 v2.6.91 預覽也套製作素材保留
    let overlay=document.createElement('div');
    overlay.id='autosell-preview-modal';
    Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'10060',display:'flex',alignItems:'center',justifyContent:'center',background:'#02061799',padding:'20px'});
    let panel=document.createElement('div');
    Object.assign(panel.style,{width:'min(620px,92vw)',maxHeight:'80vh',display:'flex',flexDirection:'column',background:'#172033',border:'2px solid #d69e2e',borderRadius:'12px',boxShadow:'0 20px 70px #000',color:'#e2e8f0'});
    let head=document.createElement('div');
    Object.assign(head.style,{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderBottom:'1px solid #475569'});
    let title=document.createElement('strong'); title.textContent='符合自動販賣規則的物品'; title.style.color='#fde68a'; title.style.fontSize='20px';
    let close=document.createElement('button'); close.textContent='Close'; close.onclick=closeAutoSellPreview;
    Object.assign(close.style,{background:'#334155',border:'1px solid #64748b',borderRadius:'6px',padding:'6px 12px',color:'#fff'});
    head.append(title,close); panel.appendChild(head);
    let body=document.createElement('div'); Object.assign(body.style,{padding:'14px 16px',overflow:'auto',lineHeight:'1.65'});
    if(!a.length){body.textContent='目前沒有符合規則的物品。'}
    else {
        let summary=document.createElement('div'); summary.textContent=`目前符合 ${a.length} 種物品：`; summary.style.marginBottom='8px'; body.appendChild(summary);
        a.forEach(o=>{let row=document.createElement('div');row.textContent=`${_autoSellPlainItemName(o.i)} × ${o.x.qty}`;row.style.padding='4px 0';row.style.borderBottom='1px solid #263449';body.appendChild(row)});
    }
    panel.appendChild(body); overlay.appendChild(panel); document.body.appendChild(overlay);
}
function refreshAutoSellItemOptions(){
    let select=document.getElementById('as-item'); if(!select)return;
    let q=(document.getElementById('as-item-search')?.value||'').trim().toLowerCase();
    let type=document.getElementById('as-item-type')?.value||'all';
    let scope=document.getElementById('as-item-scope')?.value||'all';
    let held=new Set((player.inv||[]).map(i=>i.id));
    let ids=Object.keys(DB.items).filter(id=>{let d=DB.items[id];if(!d)return false;let cat=_asEquipType(d)||d.type;if(type!=='all'&&cat!==type)return false;if(scope==='held'&&!held.has(id))return false;return !q||((d.n||id)+' '+id).toLowerCase().includes(q)}).sort((a,b)=>(DB.items[a]?.n||a).localeCompare(DB.items[b]?.n||b,'zh-Hant'));
    select.innerHTML=ids.map(id=>`<option value="${id}">${DB.items[id]?.n||id}${DB.items[id]?.noSell?'（不可販賣）':''}</option>`).join('');
    if(!ids.length)select.innerHTML='<option value="">沒有符合的物品</option>';
}
function setAutoSellOverride(v){let id=document.getElementById('as-item').value;if(!id)return;_readAutoSellForm();getAutoSellRules().overrides[id]=v;openAutoSellRules()}
function deleteAutoSellOverride(id){_readAutoSellForm();delete getAutoSellRules().overrides[id];openAutoSellRules()}
function toggleLock(uid) {
    let item = player.inv.find(i => i.uid === uid);
    if (item) {
        item.lock = !item.lock;
        if (item.lock) item.junk = false;   // 鎖定自動解除廢品勾選
        // 🔒 v3.6.92 上鎖／解鎖後都併回同簽章的另一疊（取代 v3.6.57 的「僅解鎖時併回未鎖疊」）：
        //    現行不變量＝同簽章永遠只有一格（gainItem／倉庫／載入合併同口徑），舊存檔留下的分裂在此收斂。
        //    ⚠️ 剛「解鎖」時只找未鎖定的對象——若併進鎖定疊會被 _whStackAbsorb 式的保護擴散重新鎖回去，
        //       玩家的解鎖動作等於當場失效；剛「上鎖」則可併入任何一疊（結果本來就是整疊鎖定）。
        //    ⚠️ 巨靈的三個願望(gw)每只戒指的願望各自獨立，永不合併（sameItemSig 不含 gw，須顯式排除）。
        if (!item.gw) {
            let host = player.inv.find(i => i !== item && !i.gw && (item.lock || !i.lock) && sameItemSig(i, item));
            if (host) {
                host.cnt = (host.cnt || 1) + (item.cnt || 1);
                if (item.lock) { host.lock = true; host.junk = false; }   // 保護狀態只會擴散、不會遺失
                player.inv.splice(player.inv.indexOf(item), 1);
                item = host;
            }
        }
        openModal(item, false);
        renderTabs();
    }
}

function sellItem(uid, count, unitPrice) {
    let item = player.inv.find(i => i.uid === uid);
    if (!item || item.lock) return;
    if (DB.items[item.id] && DB.items[item.id].noSell && !(typeof trialDropBlocked === 'function' && trialDropBlocked(item.id))) { logSys('此物品無法販售。'); return; }   // 🏅 精通之證等不可販售；🔒 例外：「非本職的試煉道具」(誤撿/倉庫帶來、本職用不到)允許賣出清理，本職的試煉道具仍受保護
    let _wasGrant = !!(DB.items[item.id] && DB.items[item.id].grantSkills);   // 賣出授予技能頭盔時需重算
    let sellCount = Math.min(count, item.cnt);
    let totalGot = sellCount * unitPrice;
    player.gold += totalGot;
    item.cnt -= sellCount;
    logSys(`賣出了 ${sellCount} 個 ${DB.items[item.id].n}，獲得 ${totalGot} 金幣。`);
    if (item.cnt <= 0) {
        player.inv = player.inv.filter(i => i.uid !== uid);
        closeModal();
    } else {
        openModal(item, false);
    }
    renderTabs();
    updateUI();
    if(_wasGrant) { calcStats(); renderSkillSelects(); }   // 失去授予技能頭盔：立即更新
}

function closeModal() {
    if (typeof _deferItemTransactionEffect === 'function' && _deferItemTransactionEffect(closeModal, arguments)) return; document.getElementById('item-modal').classList.add('hidden'); }
function _pvpTabEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}
function _pvpTabMix(a, b, t) {
    t = Math.max(0, Math.min(1, Number(t) || 0));
    let pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
    let pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
    return '#' + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, '0')).join('');
}
function updatePvpButtonTone() {
    let btn = document.getElementById('btn-pvp');
    if (!btn) return;
    let align = (typeof pvpClampAlignment === 'function') ? pvpClampAlignment(player && player.alignmentValue) : Math.max(-32767, Math.min(32767, Math.round(Number(player && player.alignmentValue) || 0)));
    let kind = (typeof pvpAlignmentKind === 'function') ? pvpAlignmentKind(align) : (align >= 1000 ? 'justice' : (align <= -1000 ? 'evil' : 'neutral'));
    let bg = '#4b5563', border = '#6b7280', fg = '#f1f5f9';
    if (kind === 'justice') {
        let t = Math.max(0, Math.min(1, (align - 1000) / (32767 - 1000)));
        bg = _pvpTabMix('#1e3a8a', '#3b82f6', t);
        border = _pvpTabMix('#2563eb', '#93c5fd', t);
        fg = '#eff6ff';
    } else if (kind === 'evil') {
        let t = Math.max(0, Math.min(1, (Math.abs(align) - 1000) / (32767 - 1000)));
        bg = _pvpTabMix('#7f1d1d', '#ef4444', t);
        border = _pvpTabMix('#b91c1c', '#fecaca', t);
        fg = '#fff1f2';
    }
    let top = _pvpTabMix(bg, '#e2e8f0', 0.14);
    let shine = _pvpTabMix(bg, '#f8fafc', 0.24);
    let notch = _pvpTabMix(bg, '#020617', 0.26);
    let lower = _pvpTabMix(bg, '#f8fafc', 0.10);
    let bottom = _pvpTabMix(bg, '#020617', 0.34);
    btn.style.background = (kind === 'neutral')
        ? 'linear-gradient(135deg, #565d68 0%, #6b7280 26%, #3f4651 48%, #5a6270 72%, #313740 100%)'
        : `linear-gradient(135deg, ${top} 0%, ${shine} 26%, ${notch} 48%, ${lower} 72%, ${bottom} 100%)`;
    btn.style.color = fg;
    btn.style.borderColor = border;
    btn.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.22), 0 1px 2px rgba(0,0,0,.35)';
}
let _socialPanelMode = 'pvp';
function setSocialPanelMode(mode) {
    _socialPanelMode = mode === 'private' ? 'private' : 'pvp';
    renderPvpTab();
}
function _socialNpcRow(rec) {
    if (!rec || !rec.n) return '';
    let align = typeof pvpClampAlignment === 'function' ? pvpClampAlignment(rec.alignmentValue) : Number(rec.alignmentValue) || 0;
    let name = typeof pvpNameHtml === 'function'
        ? pvpNameHtml(rec.n, align, 'font-bold')
        : `<span class="font-bold">${_pvpTabEsc(rec.n)}</span>`;
    let arg = encodeURIComponent(rec.n).replace(/'/g, '%27');
    let clan = rec.clanName ? `${rec.clanLeader ? '盟主・' : ''}${_pvpTabEsc(rec.clanName)}` : '無血盟';
    return `<div class="bg-slate-900/80 border border-slate-700 rounded p-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
            <div class="truncate">${name}${rec.clanLeader ? '<span class="ml-2 text-xs text-amber-300">盟主</span>' : ''}</div>
            <div class="text-xs text-slate-500 mt-1 truncate">${_pvpTabEsc(rec.avatar || '男戰士')}・${clan}</div>
        </div>
        <button class="btn shrink-0 px-3 py-2 text-sm font-bold bg-cyan-950 hover:bg-cyan-900 border-cyan-700 text-cyan-100" onclick="socialOpenPrivateByName('${arg}')">私訊</button>
    </div>`;
}
function _socialPrivatePanelHtml() {
    let recent = typeof socialGetRecentContacts === 'function' ? socialGetRecentContacts() : [];
    return `<div class="flex flex-col gap-3">
        <div class="bg-slate-900/80 border border-slate-700 rounded p-3">
            <div class="text-sm font-bold text-slate-200 mb-2">搜尋玩家 NPC</div>
            <input id="social-npc-search" type="search" maxlength="24" autocomplete="off"
                class="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-slate-100 outline-none focus:border-cyan-500"
                placeholder="輸入至少 2 個字" oninput="renderSocialNpcSearch(this.value)">
            <div id="social-npc-search-results" class="flex flex-col gap-2 mt-3"></div>
        </div>
        <div class="flex items-center justify-between">
            <div class="font-bold text-cyan-200">最近私訊</div>
            <div class="text-xs text-slate-500">${recent.length} / 20</div>
        </div>
        <div class="flex flex-col gap-2">
            ${recent.map(_socialNpcRow).join('') || '<div class="text-slate-500 text-sm bg-slate-900/60 border border-slate-800 rounded p-4 text-center">目前沒有私訊紀錄。</div>'}
        </div>
    </div>`;
}
function renderSocialNpcSearch(query) {
    let box = document.getElementById('social-npc-search-results');
    if (!box) return;
    let clean = String(query || '').trim();
    if (clean.replace(/\s+/g, '').length < 2) {
        box.innerHTML = '';
        return;
    }
    let rows = typeof socialSearchNpcCandidates === 'function' ? socialSearchNpcCandidates(clean) : [];
    box.innerHTML = rows.map(_socialNpcRow).join('') ||
        '<div class="text-slate-500 text-sm border border-slate-800 rounded p-3 text-center">找不到符合的玩家 NPC。</div>';
}
function renderPvpTab() {
    let div = document.getElementById('tab-pvp');
    if (!div || !player || !player.cls) return;
    if (typeof pvpEnsureState === 'function') pvpEnsureState();
    updatePvpButtonTone();
    let socialNav = `<div class="grid grid-cols-2 gap-2 mb-3">
        <button class="btn py-2 font-bold ${_socialPanelMode === 'pvp' ? 'bg-red-950 border-red-600 text-red-100' : 'bg-slate-900 border-slate-700 text-slate-400'}" onclick="setSocialPanelMode('pvp')">PVP</button>
        <button class="btn py-2 font-bold ${_socialPanelMode === 'private' ? 'bg-cyan-950 border-cyan-600 text-cyan-100' : 'bg-slate-900 border-slate-700 text-slate-400'}" onclick="setSocialPanelMode('private')">私訊</button>
    </div>`;
    if (_socialPanelMode === 'private') {
        div.innerHTML = socialNav + _socialPrivatePanelHtml();
        return;
    }
    let align = (typeof pvpClampAlignment === 'function') ? pvpClampAlignment(player.alignmentValue) : (Number(player.alignmentValue) || 0);
    let color = (typeof pvpAlignmentColor === 'function') ? pvpAlignmentColor(align) : '#fff';
    let label = (typeof pvpAlignmentLabel === 'function') ? pvpAlignmentLabel(align) : '中立';
    let clanConflict = typeof npcClanEncounterProfile === 'function' ? npcClanEncounterProfile(player) : null;
    let warForced = clanConflict ? clanConflict.forcePvp : (typeof npcClanWarActive === 'function' && npcClanWarActive(player));
    if (warForced) player.pvpOn = true;
    let pvpOn = !!player.pvpOn;
    let pvpBoxCls = pvpOn ? 'bg-red-950/70 border-red-600' : 'bg-slate-900/80 border-slate-700';
    let pvpTextCls = pvpOn ? 'text-red-300' : 'text-slate-100';
    let pvpHintCls = pvpOn ? 'text-red-200' : 'text-slate-400';
    let pvpHint = '開啟後，野外戰鬥有 1% 機率遭遇玩家 NPC。';
    if (clanConflict && clanConflict.hasMutual) {
        pvpHint = '雙方互宣：同模式角色強制開啟 PVP，野外遭遇率為 3%，其中 80% 為互宣血盟。';
    } else if (clanConflict && clanConflict.hasPlayerOnly) {
        pvpHint = '玩家單方面宣戰：同模式角色強制開啟 PVP，野外遭遇率維持 1%，其中 50% 為宣戰血盟。';
    } else if (clanConflict && clanConflict.hasNpcOnly) {
        pvpHint = 'NPC單方面宣戰：即使關閉 PVP，野外仍有 1% 機率遭遇該敵盟。';
    }
    let rows = (player.pvpRevengeList || []).map((r, i) => {
        let a = (typeof pvpClampAlignment === 'function') ? pvpClampAlignment(r.alignmentValue) : (Number(r.alignmentValue) || 0);
        let n = (typeof pvpNameHtml === 'function') ? pvpNameHtml(r.n, a, 'font-bold') : `<span class="font-bold">${_pvpTabEsc(r.n)}</span>`;
        let chasing = player.trollPlayers && player.trollPlayers.some(t => t && t.n === r.n && (t.pvpRevenge || t.noExpire));
        let disabled = chasing ? 'disabled' : '';   // 🐛 v3.5.74 稽核修#1：追殺中一併鎖定按鈕（防重按重複建立追殺）
        let _nArg = encodeURIComponent(r.n).replace(/'/g, '%27');   // 🐛 v3.5.74 稽核修#2：onclick 改帶名字（名單於戰鬥中可能移除位移·index 會指錯人）
        return `<div class="bg-slate-900/80 border border-slate-700 rounded p-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
                <div class="truncate">${n}</div>
                <div class="text-xs text-slate-500 mt-1">${_pvpTabEsc(r.avatar || '男戰士')}・死亡紀錄 ${Math.max(1, Number(r.deaths) || 1)}${chasing ? '・追殺中' : ''}</div>
            </div>
            <button class="btn shrink-0 px-3 py-2 text-sm font-bold ${disabled ? 'opacity-50' : 'bg-red-900 hover:bg-red-800 border-red-600 text-red-100'}" ${disabled} onclick="openPvpRevengeTauntMenu(decodeURIComponent('${_nArg}'),event)">${chasing ? '追殺中' : '嗆他'}</button>
        </div>`;
    }).join('');
    div.innerHTML = socialNav + `
        <div class="flex flex-col gap-3">
            <div class="bg-slate-900/80 border border-slate-700 rounded p-3">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <div class="text-slate-400 text-xs">性向值</div>
                        <div class="text-lg font-bold" style="color:${color};text-shadow:0 0 8px rgba(0,0,0,.75);">${label} ${align.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            <div class="${pvpBoxCls} border rounded p-3">
                <label class="flex items-center justify-between gap-3 cursor-pointer">
                    <span class="font-bold ${pvpTextCls}">是否開啟 PVP</span>
                    <input type="checkbox" class="w-5 h-5 accent-red-600" ${pvpOn ? 'checked' : ''} ${warForced ? 'disabled' : ''} onchange="setPvpMode(this.checked)">
                </label>
                <div class="text-xs ${pvpHintCls} mt-2">${pvpHint}</div>
            </div>
            <div class="flex items-center justify-between">
                <div class="font-bold text-amber-200">復仇名單</div>
                <div class="text-xs text-slate-500">${(player.pvpRevengeList || []).length} / 20</div>
            </div>
            ${rows || '<div class="text-slate-500 text-sm bg-slate-900/60 border border-slate-800 rounded p-4 text-center">目前沒有復仇目標。</div>'}
        </div>`;
}
function setPvpMode(on) {
    if (typeof pvpEnsureState === 'function') pvpEnsureState();
    if (!on && typeof npcClanWarActive === 'function' && npcClanWarActive(player)) {
        player.pvpOn = true;
        renderPvpTab();
        return;
    }
    player.pvpOn = !!on;
    saveGame();
    renderPvpTab();
}
const PVP_REVENGE_TAUNT_LINES = [
    '剛剛那刀我記住了，現在換你準備回村。',
    '殺我一次很開心？等一下看你還笑不笑得出來。',
    '別急著補紅水，我已經在找你了。',
    '你剛剛很會打，現在換我很會嘴。',
    '剛殺完就想裝沒事？出來把帳算一算。',
    '你那一下不是實力，是我剛好分心。',
    '偷到一條命很爽是不是？準備還兩條。',
    '我復活不是為了練功，是為了找你。',
    '你剛剛下手很快，等等逃跑也記得快一點。',
    '躺一次不代表輸，讓你躺回去才算結束。',
    '我回村補完了，換你回村報到了。',
    '別躲了，剛剛不是很勇？',
    '剛剛那場算你撿到，下一場算我討回來。',
    '你最好祈禱我找不到你。',
    '我不是來討公道，我是來討你。',
    '剛剛殺我那麼用力，現在別裝路過。',
    '你那名字我已經標記了，別想混在人群裡。',
    '你殺的是我的角色，不是我的脾氣。',
    '我死一次，你等一下死到記得我名字。',
    '別急著下線，我還沒講完。',
    '剛剛讓你表演完了，現在輪到我。',
    '你這筆帳我先寫在武器上。',
    '你敢殺，我就敢追。',
    '少躲安全區，剛剛不是很有種？',
    '這次不收裝，我收你。',
    '你剛剛打得像偷襲，等等我讓你知道什麼叫正面。',
    '別以為殺一次就能裝高手。',
    '我回來了，你的好日子結束了。',
    '你剛剛那一下值多少？我用死亡紀錄跟你算。',
    '先別慶祝，復仇名單才剛開張。',
    '剛剛讓你拿一顆頭，現在我要拿回整場面子。',
    '你殺我可以，別後悔我開始記仇。',
    '剛剛那次算你運氣好，這次我不會讓你有第二句台詞。',
    '我不是輸不起，我是專門回來讓你輸一次。',
    '你剛剛砍得很爽吧？等等換我讓你體驗。',
    '別急著換地圖，我已經把你名字圈起來了。',
    '你以為我倒下就結束？我只是回村拿藥水。',
    '這筆帳不靠系統記，我自己記。',
    '剛剛那場你先手，下一場我先開嘴。',
    '別躲在人群後面，剛剛殺人的氣勢拿出來。',
    '你敢讓我躺，我就敢讓你排隊復活。',
    '我現在不是找怪，是找你。',
    '你剛剛那刀很吵，等等我讓你安靜。',
    '別裝沒看到，復仇名單第一個就是你。',
    '我回來不是為了報仇而已，是為了讓你知道別亂殺。',
    '你剛剛殺得很漂亮，等等死得也要漂亮一點。',
    '這次不用喊價，我直接收你的人頭。',
    '剛剛那一下我認了，接下來你也要認。',
    '你先別跑，讓我看看你剛剛那股勇氣還剩多少。',
    '殺完人就想當路人？名字都紅到我眼裡了。'
];
let _pvpRevengeTauntMenu = null, _pvpRevengeTauntMenuHandler = null, _pvpRevengeTauntChoiceState = null;
function _pvpRevengeTauntArg(name) {
    return encodeURIComponent(String(name || '')).replace(/'/g, '%27');
}
function _pvpRevengeTauntPickThree() {
    let pool = PVP_REVENGE_TAUNT_LINES.slice();
    for (let i = pool.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, 3);
}
function _closePvpRevengeTauntMenu() {
    if (_pvpRevengeTauntMenu && _pvpRevengeTauntMenu.parentNode) _pvpRevengeTauntMenu.parentNode.removeChild(_pvpRevengeTauntMenu);
    _pvpRevengeTauntMenu = null;
    _pvpRevengeTauntChoiceState = null;
    if (_pvpRevengeTauntMenuHandler) {
        try { document.removeEventListener('click', _pvpRevengeTauntMenuHandler); } catch (e) {}
        _pvpRevengeTauntMenuHandler = null;
    }
}
function _mountPvpRevengeTauntMenu(menu, ev) {
    document.body.appendChild(menu);
    let x = ev && Number.isFinite(ev.clientX) ? ev.clientX : Math.round(window.innerWidth / 2);
    let y = ev && Number.isFinite(ev.clientY) ? ev.clientY : Math.round(window.innerHeight / 2);
    let rect = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y + 8, window.innerHeight - rect.height - 8)) + 'px';
    _pvpRevengeTauntMenu = menu;
    setTimeout(() => {
        if (_pvpRevengeTauntMenu !== menu) return;
        _pvpRevengeTauntMenuHandler = e => {
            if (!_pvpRevengeTauntMenu || !_pvpRevengeTauntMenu.contains(e.target)) _closePvpRevengeTauntMenu();
        };
        document.addEventListener('click', _pvpRevengeTauntMenuHandler);
    }, 0);
}
function openPvpRevengeTauntMenu(i, ev) {
    if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }
    if (typeof pvpEnsureState === 'function') pvpEnsureState();
    _closePvpRevengeTauntMenu();
    let list = player.pvpRevengeList || [];
    let r = (typeof i === 'string') ? list.find(x => x && x.n === i) : list[i];
    if (!r) return;
    if (player.trollPlayers && player.trollPlayers.some(t => t && t.n === r.n && (t.pvpRevenge || t.noExpire))) { renderPvpTab(); return; }
    let a = (typeof pvpClampAlignment === 'function') ? pvpClampAlignment(r.alignmentValue) : (Number(r.alignmentValue) || 0);
    let nameHtml = (typeof pvpNameHtml === 'function') ? pvpNameHtml(r.n, a, 'font-bold') : `<span class="font-bold">${_pvpTabEsc(r.n)}</span>`;
    let choices = _pvpRevengeTauntPickThree();
    _pvpRevengeTauntChoiceState = { name: r.n, choices: choices, createdAt: Date.now() };
    let arg = _pvpRevengeTauntArg(r.n);
    let esc = (typeof _trollEncounterEsc === 'function') ? _trollEncounterEsc : _pvpTabEsc;
    let menu = document.createElement('div');
    menu.id = 'pvp-revenge-taunt-menu';
    menu.className = 'pvp-kill-whisper-menu';
    menu.innerHTML =
        `<div class="pvp-kill-whisper-heading">選一句嗆 ${nameHtml}</div>` +
        choices.map((line, index) =>
            `<button type="button" onclick="pvpRevenge(decodeURIComponent('${arg}'),${index})">${esc(line)}</button>`
        ).join('');
    _mountPvpRevengeTauntMenu(menu, ev);
}
function pvpRevenge(i, choiceIndex) {
    if (typeof pvpEnsureState === 'function') pvpEnsureState();
    let list = player.pvpRevengeList || [];
    let r = (typeof i === 'string') ? list.find(x => x && x.n === i) : list[i];   // 🐛 v3.5.74 稽核修#2：以名字定位（index 僅舊呼叫相容）
    if (!r) return;
    if (player.trollPlayers && player.trollPlayers.some(t => t && t.n === r.n && (t.pvpRevenge || t.noExpire))) { renderPvpTab(); return; }   // 🐛 v3.5.74 稽核修#1：追殺中不重複建立追殺（雙保險·UI 已 disable）
    let active = _pvpRevengeTauntChoiceState;
    let line = active && active.name === r.n && Date.now() - active.createdAt < 5 * 60 * 1000
        ? active.choices[Math.max(0, Math.floor(Number(choiceIndex) || 0))]
        : _pvpRevengeTauntPickThree()[0];
    _closePvpRevengeTauntMenu();
    if (typeof pvpMarkForChase === 'function') pvpMarkForChase(r);
    let a = (typeof pvpClampAlignment === 'function') ? pvpClampAlignment(r.alignmentValue) : (Number(r.alignmentValue) || 0);
    let nameHtml = (typeof pvpNameHtml === 'function') ? pvpNameHtml(r.n, a, 'font-bold') : `<span class="font-bold">${_pvpTabEsc(r.n)}</span>`;
    let esc = (typeof _trollEncounterEsc === 'function') ? _trollEncounterEsc : _pvpTabEsc;
    if (typeof logSys === 'function') {
        logSys(`<span class="wander-chat-out"><span class="wander-chat-arrow">-&gt;</span> <span class="wander-chat-target">[${nameHtml}]</span> ${esc(line)}</span>`);
        let replies = (typeof PVP_KILL_WHISPER_REVENGE_REPLIES !== 'undefined') ? PVP_KILL_WHISPER_REVENGE_REPLIES : [];
        let reply = (replies.length && typeof _trollEncounterPick === 'function') ? _trollEncounterPick(replies) : '來啊，誰怕誰。';
        logSys(`<span class="wander-chat-in"><span class="wander-chat-speaker">[${nameHtml}]</span> ${esc(reply)}</span>`);
    }
    logSys(`<span class="text-red-300 font-bold">你對 ${_pvpTabEsc(r.n)} 嗆聲，對方再次開始追殺你。</span>`);
    saveGame();
    updateUI();
    renderPvpTab();
}
function switchTab(t, btn) {
    Array.from(btn.parentElement.children).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // 👇 更新陣列名單
    ['stats', 'equip', 'weapons', 'skill', 'armors', 'items', 'audit', 'pvp', 'clan', 'automation'].forEach(id => { let _e = document.getElementById(`tab-${id}`); if(_e) _e.classList.add('hidden'); });   // 🔧 v2.6.74 自動化設定改分頁內嵌（tab-automation）
    document.getElementById(`tab-${t}`).classList.remove('hidden');
    if(typeof setEquipmentPanelEmbedded === 'function') setEquipmentPanelEmbedded(t === 'equip');
    if(t === 'audit' && typeof renderAuditTab === 'function') renderAuditTab();
    if(t === 'pvp' && typeof renderPvpTab === 'function') renderPvpTab();
    if(t === 'clan' && typeof renderClanTab === 'function') renderClanTab();
    if(t === 'automation' && typeof syncNpcLanguageSetting === 'function') syncNpcLanguageSetting();
}

// ===== 🤝 協力傭兵隊伍面板（Phase 1：顯示血/魔/經驗條＋每傭兵攻擊技能/治癒魔法設定）=====
let _squadSigTeam = '';      // 🩹 v3.2.74 拆兩簽章：team 分頁(血/魔/經驗條·含寵物/召喚 HP 5%階)——變動才重建 team DOM
let _squadSigSkill = '';     // 🩹 v3.2.74 skill 分頁(攻擊/治癒/轉換技能下拉＋自動維持勾選)——只看傭兵名單/等級，戰鬥中寵物/召喚掉血不重建→開啟的技能下拉不會被關掉（原用單一簽章·寵物/召喚每 tick 掉血→整面板重建→下拉自動收合）
let _squadTab = 'team';      // 目前分頁：team / skill
let _autoCollapseInit = false;   // 自動化設定收合偏好只在首次套用

// 依某個傭兵「自身的可學技能」產生攻擊／治癒下拉選項（比照 renderSkillSelects 過濾，但讀 ally 而非 player）
function _allySkillOptions(ally, kind, cur) {
    let opts = '<option value="">無</option>';
    let skills = (ally && ally.skills) ? ally.skills : [];
    let sorted = [...skills].filter(s => DB.skills[s] && !DB.skills[s].procOnly).sort((a, b) => (DB.skills[a].tier || 0) - (DB.skills[b].tier || 0));
    sorted.forEach(sid => {
        let sk = DB.skills[sid];
        // ⚠️ ally.skills 皆為「該傭兵已學會」的技能→一律可選；不可用 skillReqLv 判可用性（那會依『目前玩家』職業誤判，使跨職業傭兵如幻術士的攻擊技全被 disabled）
        // 🧝 v3.8.5 唯一例外＝妖精屬性閘：改讀 **ally.elfEle**（傭兵快照自帶）而非 player.elfEle 就不會誤判。
        //    來源角色換屬性後那些魔法在他自己身上已是灰色不可用 → 擔任傭兵時直接不列（施放端 js/06 同步停放）。
        if (typeof allySkillElementOk === 'function' && !allySkillElementOk(ally, sid)) return;
        let match = (kind === 'atk')
            ? (sk.type === 'atk' && !sk.healSlot)
            : (kind === 'convert')
            ? (sk.type === 'convert' || sid === 'sk_illu_cube_harmony')   // 🔄 轉換技能欄：type:'convert'（魂體/心靈/魔力奪取）＋ 立方和諧
            : ((sk.type === 'heal' && !sk.autoBuff && !['sk_antidote', 'sk_holy_light', 'sk_cancel'].includes(sid)) || (sk.type === 'atk' && sk.healSlot));
        if (!match) return;
        opts += `<option value="${sid}"${cur === sid ? ' selected' : ''}>${sk.n}</option>`;
    });
    return opts;
}
// 🆕 v3.0.97 傭兵「自動維持」勾選列：把受 _mercAutoOn 閘控制的技能（buff/召喚/團隊回復/淨化/持續傷害/立方）列成小勾選，逐兵開關。
//   勾選狀態＝_mercAutoOn(a,sid)（覆寫優先·否則來源角色快照）；toggle→setAllyAutoBuff。無此類技能→不顯示本列。
function _allyAutoBuffChips(a) {
    let list = (typeof allyAutoCastableSkills === 'function') ? allyAutoCastableSkills(a) : [];
    if (!list.length) return '';
    let s = a._slot;
    let chips = list.map(it => {
        let on = (typeof _mercAutoOn === 'function') ? _mercAutoOn(a, it.sid) : false;
        let name = (it.sid === 'sk_zombie' && a.eq && a.eq.shield && a.eq.shield.id === 'relic_necro_book') ? '骷髏復生' : it.n;
        return `<label class="flex items-center gap-0.5 px-1 rounded border cursor-pointer" style="border-color:${on ? '#0891b2' : '#475569'};background:${on ? 'rgba(8,145,178,0.18)' : 'rgba(15,23,42,0.4)'};" title="自動維持 ${name}（${it.cat}）"><input type="checkbox" ${on ? 'checked' : ''} onchange="setAllyAutoBuff('${s}','${it.sid}',this.checked)" style="width:11px;height:11px;margin:0;"><span style="color:${on ? '#67e8f9' : '#94a3b8'};">${name}</span></label>`;
    }).join('');
    return `<div class="flex flex-col gap-0.5" style="margin-top:1px;"><span class="text-cyan-400 font-bold" style="font-size:10px;">自動維持（增益／召喚／回復／淨化）</span><div class="flex flex-wrap gap-1" style="font-size:10px;line-height:1.4;">${chips}</div></div>`;
}

function renderSquadPanel() {
    // 🩹 v3.8.1 補跑期間不重建隊伍面板：傭兵/寵物/召喚物/城堡護衛 的 HP 變動都經由此函式（22 處呼叫·多為每 tick/每擊），
    //    而它會整區重建 team 分頁 DOM——補跑上千 tick 時是主要拖慢來源（比照 renderMobs/flushTickRender 已有的 catchupActive 閘）。
    //    補跑結束後由下一個 tick 的各實體 render 或 js/23 的 500ms interval 自動刷新（補跑中面板不可見·無感）。
    if (typeof catchupActive === 'function' && catchupActive()) return;
    let panel = document.getElementById('squad-panel');
    if (!panel) return;
    if (!_autoCollapseInit) { _autoCollapseInit = true; }   // 🔧 v2.6.76 收合偏好停用：自動化設定已改分頁內嵌(v2.6.74)、傭兵隊伍面板取消收合恆展開（舊 fb5_*_collapsed 偏好不再套用·防「收合過就永遠展不開」）
    let allies = (player && player.allies) ? player.allies.filter(Boolean) : [];
    let _pets = (typeof petsOutList === 'function' && player && player.cls) ? petsOutList() : [];   // 🐾 v3.2.17 出戰寵物：顯示於隊伍清單下方
    let _summons = (typeof summonV2List === 'function' && player && player.cls) ? summonV2List().filter(s => s && !s._downed && (s.hp || 0) > 0) : [];
    if (typeof necroSkeletonList === 'function' && player && player.cls) _summons = _summons.concat(necroSkeletonList().filter(s => s && !s._downed && (s.hp || 0) > 0));
    let _summonSk = (typeof summonV2ActiveSk === 'function') ? summonV2ActiveSk() : '';
    let _summonVisible = _summons.length > 0 || !!(player && player._summonV2On && _summonSk && typeof summonV2Knows === 'function' && summonV2Knows(_summonSk));
    let _guards = (typeof guardV2List === 'function' && player && player.cls) ? guardV2List() : [];   // 🏰 城堡護衛（可招募的協同角色）
    if (!allies.length && !_pets.length && !_summonVisible && !_guards.length) { panel.style.display = 'none'; _squadSigTeam = ''; _squadSigSkill = ''; return; }
    panel.style.display = '';
    let _sigAllies = allies.map(a => a._slot + ':' + (a._allyName || '') + ':' + (a._downed ? 'D' : '') + ':' + (a.lv || 1)).join('|');
    let sigTeam = _sigAllies
        + '||P:' + _pets.map(p => p.uid + ':' + p.lv + ':' + (p._downed ? 'D' : '') + ':' + Math.round(p.hp / Math.max(1, p.mhp) * 20) + ':' + Math.round(p.mp / Math.max(1, p.mmp) * 20) + ':' + Math.round((p.exp || 0) / Math.max(1, petExpReq(p.lv)) * 20) + ':' + (p.potPct || 0) + ':' + Math.ceil((p._reviveCd || 0) / 10)).join('|')
        + '||S:' + ((typeof summonTeamSignature === 'function') ? summonTeamSignature() : '')   // team 分頁：名單/倒地/等級＋寵物/召喚血量(5%階)變動才重建
        + '||G:' + ((typeof guardTeamSignature === 'function') ? guardTeamSignature() : '');   // 🏰 城堡護衛血量/倒地/復活倒數變動才重建
    let sigSkill = _sigAllies + '||E:' + allies.map(a => a.elfEle || '').join(',');   // 🩹 v3.2.74 skill 分頁只看傭兵名單/等級→戰鬥中寵物/召喚掉血不重建·開啟的技能下拉不被關
    // 🧝 v3.8.5 追加 elfEle：來源妖精換屬性後 refreshAllyOnce 重建快照時名字/等級都沒變 → 簽章不動 → 技能下拉與自動維持勾選會停在舊屬性的清單（該隱藏的沒隱藏）
    let _squadRebuilt = false;
    if (sigTeam !== _squadSigTeam) {
        _squadSigTeam = sigTeam;
        document.getElementById('squad-tab-team').innerHTML = allies.map(a => {
            let s = a._slot;
            if (a._downed) {   // 🤝 Phase 3：倒地→灰顯卡片。返生術＝手動鈕（消耗MP·無冷卻立即）；復活卷軸＝v2.6.6 改自動（15秒冷卻結束身上有卷軸即自動使用），此處只顯示狀態文字（不可點）。每幀更新。
                return `<div class="bg-slate-900/70 border border-red-900 rounded p-2 flex items-center justify-between gap-2" style="opacity:0.85;">
                    <div class="text-sm"><span class="font-bold text-slate-400">${a._allyName}</span> <span class="text-slate-600 text-xs">Lv.${a.lv || 1}</span> <span class="text-red-400 font-bold">【倒地】</span></div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button id="squad-rez-${s}" class="py-1 px-2 text-xs font-bold rounded border whitespace-nowrap" style="background:#1e3a8a;border-color:#3b82f6;color:#bfdbfe;" onclick="reviveMercenary('${s}','rez')">返生術</button>
                        <span id="squad-revive-${s}" class="py-1 px-2 text-xs font-bold rounded border whitespace-nowrap" style="background:#3f1d1d;border-color:#7f1d1d;color:#fca5a5;cursor:default;" title="倒地 15 秒後，若身上有復活卷軸將自動使用。">卷軸</span>
                    </div>
                </div>`;
            }
            return `<div class="bg-slate-800/60 border border-slate-600 rounded p-2 flex flex-col gap-1 ally-compact-card">
                <div class="ally-compact-head text-sm">
                    <span class="font-bold text-amber-200 ally-compact-name">${a._allyName}</span>
                    <span class="text-slate-400 text-xs whitespace-nowrap">Lv.${a.lv || 1}</span>
                    <div class="bar-bg ally-exp-bar"><div id="squad-exp-${s}" class="bar-fill bg-yellow-500" style="width:0%"></div><div id="squad-exp-txt-${s}" class="bar-text text-white">0%</div></div>
                </div>
                <div id="squad-status-${s}" class="text-xs" style="color:#fca5a5;line-height:1.2;"></div>
                <div class="compact-dual-vitals">
                    <div class="bar-bg compact-team-bar" title="HP"><div id="squad-hp-${s}" class="bar-fill bg-red-600" style="width:100%"></div><div id="squad-hp-txt-${s}" class="bar-text text-white">0/0</div></div>
                    <div class="bar-bg compact-team-bar" title="MP"><div id="squad-mp-${s}" class="bar-fill bg-blue-600" style="width:100%"></div><div id="squad-mp-txt-${s}" class="bar-text text-white">0/0</div></div>
                </div>
            </div>`;
        }).join('')
            + ((typeof renderPetTeamHTML === 'function') ? renderPetTeamHTML() : '')
            + ((typeof renderSummonTeamHTML === 'function') ? renderSummonTeamHTML() : '')
            + ((typeof renderMercSummonTeamHTML === 'function') ? renderMercSummonTeamHTML() : '')
            + ((typeof renderGuardTeamHTML === 'function') ? renderGuardTeamHTML() : '');   // 隊伍排列：傭兵 → 寵物 → 玩家召喚物 → 傭兵召喚物 → 🏰 城堡護衛
        _squadRebuilt = true;
    }
    if (sigSkill !== _squadSigSkill) {
        _squadSigSkill = sigSkill;
        document.getElementById('squad-tab-skill').innerHTML = allies.map(a => {
            let s = a._slot;
            let hpPct = (a._healHpPct != null) ? a._healHpPct : 70;
            let potPct = (a._potHpPct != null) ? a._potHpPct : ((a._hpSafePct != null) ? a._hpSafePct : 0);
            let skillPct = (a._hpSkillPct != null) ? a._hpSkillPct : ((a._hpSafePct != null) ? a._hpSafePct : 0);
            let mpPct = (a._castMpPct != null) ? a._castMpPct : 0;   // 🆕 v2.6.27 施法MP門檻
            return `<div class="bg-slate-800/60 border border-slate-600 rounded p-2 flex flex-col gap-1">
                <div class="text-sm font-bold text-amber-200">${a._allyName} <span class="text-slate-500 text-xs">Lv.${a.lv || 1}</span></div>
                <div class="flex items-center gap-1 text-xs"><span class="text-cyan-400 font-bold shrink-0" style="width:3rem;">攻擊技能</span><select class="flex-1 min-w-0 bg-slate-900 border border-slate-600 text-cyan-300 px-1 py-1 rounded text-xs outline-none" onchange="setAllyAtkSkill('${s}', this.value)">${_allySkillOptions(a, 'atk', a._atkSkill || '')}</select><span class="shrink-0 flex items-center text-blue-300 whitespace-nowrap" title="MP％ 高於此值才施放攻擊技（0 = 不限）。">MP&gt;<input type="number" min="0" max="100" value="${mpPct}" class="w-10 bg-slate-900 border border-blue-700 text-center text-white rounded" onchange="setAllyCastMp('${s}', this.value)">%</span></div>
                <div class="flex items-center gap-1 text-xs"><span class="text-green-400 font-bold shrink-0" style="width:3rem;">治癒魔法</span><select class="flex-1 min-w-0 bg-slate-900 border border-slate-600 text-green-300 px-1 py-1 rounded text-xs outline-none" onchange="setAllyHealSkill('${s}', this.value)">${_allySkillOptions(a, 'heal', a._healSkill || '')}</select><span class="shrink-0 flex items-center text-green-300 whitespace-nowrap" title="HP％ 低於此值才施放治癒。">HP&lt;<input type="number" min="0" max="100" value="${hpPct}" class="w-10 bg-slate-900 border border-green-700 text-center text-white rounded" onchange="setAllyHealHp('${s}', this.value)">%</span></div>
                <div class="flex items-center gap-1 text-xs"><span class="text-purple-400 font-bold shrink-0" style="width:3rem;">轉換技能</span><select class="flex-1 min-w-0 bg-slate-900 border border-slate-600 text-purple-300 px-1 py-1 rounded text-xs outline-none" onchange="setAllyConvertSkill('${s}', this.value)">${_allySkillOptions(a, 'convert', a._convertSkill || '')}</select></div>
                <div class="flex items-stretch gap-1 text-xs">
                    <span class="flex-1 flex items-center justify-center gap-0.5 text-amber-400 bg-slate-900/40 border border-amber-800 rounded py-0.5" title="低於此％時，喝隊長設定的藥水回血。0 = 關閉。">HP&lt;<input type="number" min="0" max="100" value="${potPct}" class="w-10 bg-slate-900 border border-amber-700 text-center text-white rounded" onchange="setAllyPotHp('${s}', this.value)">%喝水</span>
                    <span class="flex-1 flex items-center justify-center gap-0.5 text-rose-400 bg-slate-900/40 border border-rose-800 rounded py-0.5" title="低於此％時，暫停施放消耗 HP 的技能（龍騎士 HP 技／轉換技能／立方和諧），退回普攻。0 = 關閉。">HP&lt;<input type="number" min="0" max="100" value="${skillPct}" class="w-10 bg-slate-900 border border-rose-700 text-center text-white rounded" onchange="setAllyHpSkill('${s}', this.value)">%停技</span>
                </div>
                ${_allyAutoBuffChips(a)}
            </div>`;
        }).join('');
        _squadRebuilt = true;
    }
    if (_squadRebuilt) switchSquadTab(_squadTab);   // 有任一分頁重建→還原目前分頁與按鈕高亮
    // 每幀更新血/魔/經驗條（不重建 DOM）
    allies.forEach(a => {
        let s = a._slot, el;
        if (a._downed) {   // 🤝 倒地卡：更新兩種復活鈕（返生術=學會+MP夠即可立即；卷軸=死亡15秒後+持有）
            let rb = document.getElementById('squad-rez-' + s);
            if (rb) {
                let learned = !!(player.skills && player.skills.includes('sk_resurrection'));
                let rk = DB.skills.sk_resurrection;
                let cost = rk ? player.d.getMpCost(rk.mp, rk.tier) : Infinity;
                let ok = learned && !player.dead && (player.mp || 0) >= cost;
                rb.style.display = learned ? '' : 'none';   // 未學會返生術→不顯示此鈕
                rb.style.opacity = ok ? '1' : '0.45';
                rb.title = !learned ? '尚未學會返生術' : (player.dead ? '你已死亡' : ((player.mp || 0) >= cost ? ('立即復活（消耗 ' + cost + ' MP·無冷卻）') : ('MP 不足（需 ' + cost + '）')));
            }
            let b = document.getElementById('squad-revive-' + s);
            if (b) {   // 🎫 v2.6.6：卷軸改自動（狀態顯示·不可點）。倒數中→顯示自動復活秒數；冷卻結束無卷軸→提示補卷軸即自動復活（返生術可手動立即）。
                let cd = a._reviveCd || 0;
                if (cd > 0) { b.textContent = '自動 ' + Math.ceil(cd / 10) + 's'; b.style.opacity = '0.7'; b.title = '倒地 15 秒後，若身上有復活卷軸將自動使用（返生術可手動立即復活）。'; }
                else { let sc = player.inv && player.inv.find(i => i.id === 'scroll_revive'); let n = sc ? (sc.cnt || 0) : 0; b.textContent = n > 0 ? ('卷軸×' + n) : '無卷軸'; b.style.opacity = n > 0 ? '1' : '0.6'; b.title = n > 0 ? '冷卻結束，將自動使用復活卷軸復活。' : '身上無復活卷軸；補充後將自動復活（或用返生術立即復活）。'; }
            }
            return;   // 倒地卡無血條，跳過下面 hp/mp/exp 更新
        }
        if ((el = document.getElementById('squad-hp-' + s))) {
            let mhp = Math.max(1, Math.floor(a.mhp || 1)), cur = Math.max(0, Math.floor(a.curHp || 0));
            el.style.width = Math.max(0, (cur / mhp) * 100) + '%';
            let t = document.getElementById('squad-hp-txt-' + s); if (t) t.innerText = cur + '/' + mhp;
        }
        if ((el = document.getElementById('squad-mp-' + s))) {
            let mmp = Math.max(1, Math.floor(a.mmp || 1)), cur = Math.max(0, Math.floor(a.mp || 0));
            el.style.width = Math.max(0, (cur / mmp) * 100) + '%';
            let t = document.getElementById('squad-mp-txt-' + s); if (t) t.innerText = cur + '/' + mmp;
        }
        if ((el = document.getElementById('squad-exp-' + s))) {
            let req = (typeof getExpReq === 'function') ? getExpReq(a.lv || 1) : 0;
            let pct = (req > 0 && isFinite(req)) ? ((a.exp || 0) / req) * 100 : 0;
            el.style.width = Math.min(100, Math.max(0, pct)) + '%';
            let t = document.getElementById('squad-exp-txt-' + s); if (t) t.innerText = pct >= 100 ? '滿' : pct.toFixed(1) + '%';   // 不即時升級→累積超過一級顯「滿」（解雇可回收）
        }
        if ((el = document.getElementById('squad-status-' + s))) {   // 🤝 Phase4：傭兵異常狀態小字（無狀態時空白不佔版面）
            let _ss = a.statuses || {}, _out = [];
            [['stun', '暈眩'], ['freeze', '冰凍'], ['stone', '石化'], ['paralyze', '麻痺'], ['sleep', '沉睡'], ['silence', '沉默'], ['magicseal', '魔封'], ['poison', '中毒'], ['burn', '灼燒'], ['scald', '燙傷'], ['bleed', '出血'], ['slowAtk', '緩速'], ['weaken', '弱化'], ['disease', '疾病'], ['blind', '目盲'], ['potionFrost', '藥水霜化'], ['foulWater', '汙濁之水']].forEach(p => { if ((_ss[p[0]] || 0) > 0) _out.push(p[1]); });   // 🌊 v3.6.20 含汙濁之水
            el.textContent = _out.length ? ('⚠ ' + _out.join('·')) : '';
        }
    });
}

function switchSquadTab(t) {
    _squadTab = t;
    ['team', 'skill'].forEach(id => {
        let e = document.getElementById('squad-tab-' + id); if (e) e.classList.toggle('hidden', id !== t);
        let b = document.getElementById('squad-tab-btn-' + id);
        if (b) {
            let on = (id === t);
            b.style.background = on ? '#b45309' : '#334155';      // amber-700 / slate-700
            b.style.borderColor = on ? '#f59e0b' : '#475569';     // amber-500 / slate-600
            b.style.color = on ? '#ffffff' : '#cbd5e1';
        }
    });
}

function _findAlly(slot) { return (player.allies || []).find(a => a && String(a._slot) === String(slot)); }
function setAllyAtkSkill(slot, val) { let a = _findAlly(slot); if (a) { a._atkSkill = val || ''; saveGame(); } }   // _atkSkill 即時生效（傭兵攻擊路徑直接讀 ally._atkSkill）
function setAllyHealSkill(slot, val) { let a = _findAlly(slot); if (a) { a._healSkill = val || ''; saveGame(); } }   // _healSkill 儲存待 Phase 3 傭兵自動補血讀取
function setAllyConvertSkill(slot, val) { let a = _findAlly(slot); if (a) { a._convertSkill = val || ''; saveGame(); } }   // 🔄 v2.6.4 轉換技能（type:'convert'／立方和諧）：即時生效（allyCubeTick/轉換施放路徑直接讀 ally._convertSkill）
function setAllyHealHp(slot, val) { let a = _findAlly(slot); if (a) { a._healHpPct = Math.max(0, Math.min(100, parseInt(val) || 0)); saveGame(); } }
function setAllyPotHp(slot, val) { let a = _findAlly(slot); if (a) { a._potHpPct = Math.max(0, Math.min(100, parseInt(val) || 0)); saveGame(); } }   // 🍶 v2.6.4 喝藥水門檻（獨立·低於此%→喝隊長藥水；0=關閉）
function setAllyHpSkill(slot, val) { let a = _findAlly(slot); if (a) { a._hpSkillPct = Math.max(0, Math.min(100, parseInt(val) || 0)); saveGame(); } }   // 🛡️ v2.6.4 停耗HP技門檻（獨立·低於此%→暫停龍騎HP技/轉換技/立方和諧；0=關閉）
function setAllyCastMp(slot, val) { let a = _findAlly(slot); if (a) { a._castMpPct = Math.max(0, Math.min(100, parseInt(val) || 0)); saveGame(); } }   // 🆕 v2.6.27 施法MP門檻（MP% 高於此才施放攻擊技·0=不限·allyActWithSkillGate 讀 allyCastMpPct）
// 🆕 v3.0.97 逐兵「自動維持」開關（覆寫 _mercAutoOn·存 ally._autoBuff·隨存檔）。關閉 self-buff→立即結束該 buff 並重算（比照玩家取消打勾立即結束）；召喚/HoT/淨化/立方 屬即時或全隊·僅停止再施放不強制解除。
function setAllyAutoBuff(slot, sid, on) {
    let a = _findAlly(slot); if (!a || !sid) return;
    if (!a._autoBuff) a._autoBuff = {};
    a._autoBuff[sid] = !!on;
    if (!on && a.buffs && (a.buffs[sid] || 0) > 0) {   // 關閉→即時結束自我增益 buff（召喚/HoT 走各自到期·不在此強制解）
        let sk = DB.skills[sid]; a.buffs[sid] = 0; if (sk && sk.haste) a.buffs.haste = 0;
        try { if (typeof _allyLevelRecompute === 'function') _allyLevelRecompute(a); } catch (e) {}
    }
    if ((typeof TEAM_AURA_SKILLS !== 'undefined' && TEAM_AURA_SKILLS.includes(sid)) || (DB.skills[sid] && DB.skills[sid].illuSummon)) { try { if (typeof calcStats === 'function') calcStats(); } catch (e) {} }   // 🌟 v3.0.100 團隊光環開關→刷新玩家 d（化身攻擊光環注入玩家；關閉時傭兵化身已於上方清 0）；🔮 v3.2.2 幻覺（歐吉/巫妖/高崙）關閉時同樣要刷新，否則玩家 d 殘留 +4傷/+4命/+2魔傷 直到下次重算
    try { saveGame(); } catch (e) {}
    _squadSigSkill = '';   // 🩹 v3.2.74 強制重建 skill 分頁→更新勾選外觀（邊框/文字色於建構時決定；勾選列在 skill 分頁·team 分頁不受影響）
    try { renderSquadPanel(); } catch (e) {}
}

// 自動化設定面板收合（只留標題）：收合時去掉 flex-1 改 0 0 auto，body 隱藏
// 🗑️ v3.5.83 移除 _applyAutomationCollapse／toggleAutomationCollapse：#automation-panel／-body／-collapse-arrow 三個 ID
//    自 v2.6.74「自動化設定改分頁內嵌」後已不存在於任何 HTML/CSS，兩函式零外部呼叫者，寫入的 fb5_automation_collapsed 亦零讀取端。
//    （比照 v2.6.76 處理 _applySquadCollapse/toggleSquadCollapse 的先例。）
// 🔧 v2.6.76 傭兵隊伍面板收合已移除（恆展開·用戶要求）：_applySquadCollapse/toggleSquadCollapse 刪除、index.html 標題列改純標題無箭頭。
