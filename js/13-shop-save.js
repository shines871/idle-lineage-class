// ===================== 妖精屬性系統 (NPC 艾利溫) =====================
const ELF_ELE = {
    fire:  { name:'火', color:'#ef4444', cls:'text-red-400',     border:'#ef4444' },
    water: { name:'水', color:'#3b82f6', cls:'text-blue-400',    border:'#3b82f6' },
    wind:  { name:'風', color:'#10b981', cls:'text-emerald-400', border:'#10b981' },
    earth: { name:'地', color:'#facc15', cls:'text-yellow-400',  border:'#facc15' }
};
const ELF_SWITCH_COST = 500000;

const SPECIAL_AREA_BG = {   // 特殊地圖：逐張對應背景
    kent_outer: 'assets/area/1920x1080/肯特外門區.jpg',
    kent_inner: 'assets/area/1920x1080/肯特內城.jpg',
    ww_outer: 'assets/area/1920x1080/風木外門區.jpg',
    ww_inner: 'assets/area/1920x1080/風木內城.jpg',
    heine_outer: 'assets/area/1920x1080/海音外門區.jpg',
    heine_inner: 'assets/area/1920x1080/海音內城.jpg',
    rift_battle: 'assets/area/1920x1080/時空裂痕戰場.jpg',
    desert: 'assets/area/沙漠.jpg',   // 🏜️ 沙漠（野外·專屬背景·完整路徑直接用）
    // 🆕 新狩獵區背景（皆 area-fit 沙漠格式·需 1920×580 條狀圖·放 assets/area/）：
    crystal_cave1: 'assets/area/水晶洞穴.jpg', crystal_cave2: 'assets/area/水晶洞穴.jpg', crystal_cave3: 'assets/area/水晶洞穴.jpg',   // 💎 水晶洞穴（地監·3樓共用）
    fire_dragon: 'assets/area/火龍窟.jpg',   // 🔥 火龍窟（野外）
    elf_forest: 'assets/area/森林.jpg', zone_01: 'assets/area/森林.jpg', mirror_forest: 'assets/area/森林.jpg',   // 🌲 妖魔森林/妖精森林周邊/鏡子森林（野外·共用森林背景）
    zone_15: 'assets/area/洞窟.jpg', zone_16: 'assets/area/洞窟.jpg',   // 🕳️ 眠龍洞穴1~2樓
    zone_17: 'assets/area/龍之谷地監深層.jpg',   // 🐉 眠龍洞穴3樓（改龍之谷地監深層·area-fit）
    zone_22: 'assets/area/洞窟.jpg', zone_23: 'assets/area/洞窟.jpg', zone_24: 'assets/area/洞窟.jpg', zone_25: 'assets/area/洞窟.jpg',   // 🕳️ 沙漠地監1~4樓
    zone_26: 'assets/area/洞窟.jpg', zone_27: 'assets/area/洞窟.jpg', zone_28: 'assets/area/洞窟.jpg',   // 🕳️ 龍之谷地監1~3樓
    zone_29: 'assets/area/龍之谷地監深層.jpg', zone_30: 'assets/area/龍之谷地監深層.jpg', zone_31: 'assets/area/龍之谷地監深層.jpg',   // 🐉 龍之谷地監4~6樓（改深層·area-fit）
    zone_32: 'assets/area/洞窟.jpg',   // 🐜 螞蟻洞窟1樓（共用洞窟背景）
    zone_33: 'assets/area/龍之谷地監深層.jpg',   // 🐜 螞蟻洞窟2樓（改龍之谷地監深層·area-fit）
    zone_37: 'assets/area/象牙塔.jpg', zone_38: 'assets/area/象牙塔.jpg',   // 🏛️ 象牙塔4~5樓
    zone_39: 'assets/area/象牙塔深層.jpg', zone_40: 'assets/area/象牙塔深層.jpg', zone_41: 'assets/area/象牙塔深層.jpg',   // 🏛️ 象牙塔6~8樓（改深層背景·area-fit）
    hidden_lab_nolife: 'assets/area/象牙塔.jpg', hidden_lab_darkmagic: 'assets/area/象牙塔.jpg',   // 🏛️ 隱藏區域 fallback＝轉換前地圖背景（象牙塔4/5樓）；有同名 <區域名>.jpg 則優先
    hidden_seal_spirit: 'assets/area/象牙塔深層.jpg', hidden_seal_monster: 'assets/area/象牙塔深層.jpg', hidden_seal_demon: 'assets/area/象牙塔深層.jpg',   // 🏛️ 隱藏區域 fallback＝象牙塔6~8樓深層背景
    hidden_antqueen: 'assets/area/龍之谷地監深層.jpg',   // 🐜 巨蟻女皇棲息地 fallback＝螞蟻洞窟2樓背景
    heine: 'assets/area/森林.jpg',   // 🌲 海音（野外狩獵·共用森林背景·安全區 town_heine 不變）
    eva_kingdom: 'assets/area/伊娃王國.jpg',   // 🏰 伊娃王國（地監·專屬背景·area-fit）
    windwood: 'assets/area/沙漠.jpg',   // 🏜️ 風木（野外·共用沙漠背景）
    windwood_dungeon: 'assets/area/地監.jpg',   // 🏰 風木地監（攻城獲勝後開放的城堡狩獵區）：實際取此 fallback＝地監.jpg（經 upgradeAreaPath 升級成 1920×1080 版）。下方 applyAreaBackground 雖仍把顯示名補成「風木地監」，但該名不在 AREA_1920 → 不會有同名圖；日後真的放了 assets/area/1920x1080/風木地監.jpg，記得把檔名加進 AREA_1920 才會被採用
    gludio: 'assets/area/城鎮周邊.jpg', kent: 'assets/area/城鎮周邊.jpg', giran: 'assets/area/城鎮周邊.jpg',   // 🏙️ 古魯丁/肯特/奇岩（野外·城鎮周邊·≠村莊周邊）
    training: 'assets/area/村莊周邊.jpg',   // 🆕 新兵修鍊場（套 area-fit·與其餘野外共用村莊周邊背景）
    dream_island: 'assets/area/夢幻之島.jpg',   // 🆕 夢幻之島（套 area-fit·專屬背景）
    zone_02: 'assets/area/歐瑞.jpg', zone_03: 'assets/area/歐瑞.jpg', zone_05: 'assets/area/歐瑞.jpg',   // 🗺️ 歐瑞/歐瑞雪原/國境要塞（野外·共用歐瑞背景）
    zone_04: 'assets/area/艾爾摩.jpg',   // ⚔️ 艾爾摩激戰地（野外·專屬背景）
    zone_09: 'assets/area/地監深層.jpg', zone_10: 'assets/area/地監深層.jpg', zone_11: 'assets/area/地監深層.jpg', zone_12: 'assets/area/地監深層.jpg', zone_14: 'assets/area/地監深層.jpg',   // 🕳️ 古魯丁地監4~7樓＋說話之島地監2樓（改深層背景·area-fit）
    dragon_valley: 'assets/area/龍之谷.jpg', twilight_mt: 'assets/area/龍之谷.jpg',   // 🐉 龍之谷/黃昏山脈（野外·共用龍之谷背景；地監龍之谷 zone_26~31 仍為洞窟.jpg）
    elf_grave: 'assets/area/拉斯塔巴德.jpg', hidden_cave: 'assets/area/拉斯塔巴德.jpg', giant_tomb: 'assets/area/拉斯塔巴德.jpg',   // 🏚️ 精靈墓穴/大洞穴隱遁者村莊地區/古代巨人之墓（野外·拉斯塔巴德背景）
    rastabad_cave1: 'assets/area/拉斯塔巴德.jpg', rastabad_cave2: 'assets/area/拉斯塔巴德.jpg', rastabad_cave3: 'assets/area/拉斯塔巴德.jpg', rastabad_gate: 'assets/area/拉斯塔巴德.jpg', rastabad_beast: 'assets/area/拉斯塔巴德.jpg', dark_magic_lab: 'assets/area/拉斯塔巴德.jpg', necro_training: 'assets/area/拉斯塔巴德.jpg',   // 🏚️ 拉斯塔巴德地下洞穴1~3樓/正門/魔獸訓練場/黑魔法研究室/冥法軍訓練場（地監·拉斯塔巴德背景）
    talking_island_port: 'assets/area/說話之島港口.jpg', oblivion_travel: 'assets/area/說話之島港口.jpg',   // 🏝️ 說話之島港口/遺忘之島途中（共用說話之島港口背景·area-fit）
    oblivion_island: 'assets/area/遺忘之島.jpg',   // 🏝️ 遺忘之島（專屬背景·area-fit）
    antaras_lair: 'assets/area/安塔瑞斯.jpg',   // 🐉 安塔瑞斯棲息地
    fafurion_lair: 'assets/area/法利昂.jpg',   // 🐉 法利昂洞穴
    valakas_lair: 'assets/area/巴拉卡斯.jpg',   // 🐉 巴拉卡斯巢穴（專屬背景）
    silent_outer: 'assets/area/拉斯塔巴德.jpg',   // 🏚️ 沉默洞穴周邊（狩獵·改拉斯塔巴德·area-fit）；安全區 town_silent 仍 silentcave.png 不變
    king_baranka_room: 'assets/area/軍王之室.jpg',  // 👑 魔獸軍王之室（純BOSS房·4室共用軍王之室背景）
    law_king_room: 'assets/area/軍王之室.jpg',      // 👑 法令軍王之室
    necro_king_room: 'assets/area/軍王之室.jpg',    // 👑 冥法軍王之室
    assassin_king_room: 'assets/area/軍王之室.jpg', // 👑 暗殺軍王之室
    elder_room: 'assets/area/軍王之室.jpg',         // 🏛️ 格蘭肯神殿．長老之室（無專屬背景圖·借用軍王之室背景）
    dark_elf_sanctuary: 'assets/area/1920x1080/黑暗妖精聖地.jpg',
    cursed_dark_elf_sanctuary: 'assets/area/1920x1080/受詛咒的黑暗妖精聖地.jpg',
    collapsed_elder_council_hall: 'assets/area/1920x1080/崩壞的長老會議廳.jpg',   // 🌑 v3.3.33 長老會議廳改為安全區 town_elder_council（背景走 TOWN_BG_1920）
    thebes_desert: 'assets/area/底比斯沙漠.jpg',   // 🏛️ 底比斯 沙漠（專屬背景）
    thebes_pyramid: 'assets/area/底比斯.jpg',      // 🏛️ 底比斯 金字塔內部（與祭壇共用底比斯背景）
    thebes_temple: 'assets/area/底比斯.jpg',        // 🏛️ 底比斯 歐西里斯祭壇（純BOSS房）
    sunrise_castle: 'assets/area/1920x1080/日出之國城墎.jpg',
    sunrise_east: 'assets/area/1920x1080/日出之國東之地.jpg',
    sunrise_west: 'assets/area/1920x1080/日出之國西之地.jpg',
    sunrise_north: 'assets/area/1920x1080/日出之國北之地.jpg',   // 🌅 日出之國四區（時空裂痕·日本風 1920×1080）
    arena_pvp: 'assets/area/1920x1080/決鬥競技場.jpg',   // ⚔️ v3.7.13 決鬥競技場（不在 MAP_CATEGORIES→mapDisplayName 回 null·同名圖走不到，逐張指定完整路徑）
    pirate_wild: 'assets/area/古魯丁.jpg',      // 🏴‍☠️ 海賊島（野外·借用古魯丁背景）
    pirate_dungeon: 'assets/area/說話之島地監1樓.jpg' // 🏴‍☠️ 海賊島地監（借用說話之島地監1樓背景）
};
const CATEGORY_AREA_BG = { wild: 'assets/area/村莊周邊.jpg', dungeon: 'assets/area/地監.jpg', siege: 'castle.png', tower: 'assets/area/傲慢之塔.jpg', rift: 'Rift.png' };   // 🆕 野外/地監/傲慢之塔狩獵使用 area-fit；攻城/裂痕有 SPECIAL_AREA_BG 新圖時同樣使用 area-fit，只有退回舊 castle.png/Rift.png 時維持舊版面。🗼 塔狩獵=傲慢之塔.jpg，入口安全區另由 TOWN_AREA_BG.tower 保留 TowerofInsolence.png 不變；🏛️ 底比斯3圖另由 SPECIAL_AREA_BG 覆寫（底比斯沙漠.jpg／底比斯.jpg）
// 🗑️ v3.5.83 移除 AREA_BG_FIT：自 v2.5.2 改為「預設套用 area-fit＋AREA_BG_NOFIT 反向黑名單」後即成零引用死表，
//    但整行註解仍以現行規則的口吻要求「日後新增條狀背景就把路徑加進來」＝保證無效的維護指示；
//    表內 29 個 assets/area/*.jpg 路徑在磁碟上也已全部不存在（現行走 assets/area/1920x1080/）。
// ⚔️ v2.5.2：area-fit(怪物站立帶/2排·見 applyAreaBackground)改「預設全開、僅舊式背景例外」。
//   新版攻城／裂痕 1920×1080 圖必須使用 area-fit，玩家、傭兵、寵物的戰鬥序列幀才會掛上戰鬥舞台。
//   只有仍使用舊 castle.png／Rift.png 的地圖維持舊式置中版面。
const AREA_BG_NOFIT = new Set(['castle.png', 'Rift.png']);
const SPECIAL_TOWN_BG = { town_silent: 'silentcave.png' };                                        // 🔧 安全區逐張對應背景（沉默洞穴）
const TOWN_AREA_BG = { village: 'village.png', castle: 'castle.png', tower: 'TowerofInsolence.png', rift: 'Rift.png' };   // 村莊畫面依分類（🗼 傲慢之塔入口；🌀 時空裂痕入口 Rift.png）
// 🗑️ 移除「同名平面圖 assets/area/<地圖名>.jpg 優先」的非同步探測與其快取 _areaNameBgCache：
//   assets/area 底下的平面 .jpg 已全數清空(只剩 1920x1080 子資料夾) → 探測永遠命不中，
//   卻仍會對每個「名稱不在 AREA_1920」的地圖發出一次保證 404 的請求(例：風木地監)。
//   現行流程＝AREA_1920 同步判定 → 命中取 1920×1080 版，否則走 fallback 圖並經 upgradeAreaPath 升級。
// 🖼️ v3.2.80 高解析場景圖：assets/area/1920x1080/<名>.jpg＝新一批 1920×1080(16:9)全景圖。
//   AREA_1920＝目前資料夾內既有檔名(單一真相·同步判定·無探測閃爍)。狩獵區同名圖＋fallback 圖，凡名稱在此集合者一律優先取 1920x1080 版；安全區走下方 TOWN_BG_1920 逐城對應。
//   ⚠️日後新增 assets/area/1920x1080/ 的圖，檔名(不含 .jpg)務必加進本集合才會被採用（否則退回舊 assets/area/ 或分類 fallback）。
const AREA_1920 = new Set(['亞丁城鎮','伊娃王國','傲慢之塔','傲慢之塔11~20樓','傲慢之塔1樓','傲慢之塔21~30樓','傲慢之塔2~10樓','傲慢之塔31~40樓','傲慢之塔41~50樓','傲慢之塔51~60樓','傲慢之塔61~70樓','傲慢之塔71~80樓','傲慢之塔81~90樓','傲慢之塔91~100樓','冥法軍王之室','冥法軍訓練場','古代巨人之墓','古魯丁','古魯丁地監1樓','古魯丁地監2樓','古魯丁地監3樓','古魯丁地監4樓','古魯丁地監5樓','古魯丁地監6樓','古魯丁地監7樓','國境要塞','地下通道1樓','地下通道2樓','地下通道3樓','地監','地監深層','城鎮周邊','夢幻之島','大洞穴隱遁者村莊地區','奇岩','奇岩地監1樓','奇岩地監2樓','奇岩地監3樓','奇岩地監4樓','奇岩城鎮','妖精森林周邊','妖精森林村莊','妖魔森林','威頓村莊','安塔瑞斯','安塔瑞斯棲息地','巴拉卡斯','巴拉卡斯巢穴','希培利亞','席琳神殿','底比斯','底比斯 歐西里斯祭壇','底比斯 沙漠','底比斯 金字塔內部','底比斯沙漠','拉斯塔巴德','拉斯塔巴德地下洞穴1樓','拉斯塔巴德地下洞穴2樓','拉斯塔巴德地下洞穴3樓','拉斯塔巴德正門','提卡爾 庫庫爾坎祭壇','提卡爾神廟地區','提卡爾神廟地區深處','新兵修練場','時空裂痕入口','暗影神殿','暗殺軍王之室','村莊周邊','格蘭肯神殿．長老之室','森林','歐瑞','歐瑞村莊','歐瑞雪原','歐瑞雪壁','水晶洞穴','水晶洞穴1樓','水晶洞穴2樓','水晶洞穴3樓','沉默洞穴','沉默洞穴周邊','沙漠','沙漠地監1樓','沙漠地監2樓','沙漠地監3樓','沙漠地監4樓','法令軍王之室','法利昂','法利昂洞穴','洞窟','海賊島','海賊島地監','海賊島村莊','海音','海音城鎮','火龍窟','炎魔謁見所','燃柳村莊','眠龍洞穴1樓','眠龍洞穴2樓','眠龍洞穴3樓','精靈墓穴','肯特','艾爾摩','艾爾摩激戰地','荒野','螞蟻洞穴1樓','螞蟻洞穴2樓','螞蟻洞窟1樓','螞蟻洞窟2樓','說話之島周邊','說話之島地監1樓','說話之島地監2樓','說話之島村莊','說話之島港口','象牙塔','象牙塔4樓','象牙塔5樓','象牙塔6樓','象牙塔7樓','象牙塔8樓','象牙塔深層','象牙塔（1~3樓）','貝希摩斯','軍王之室','遺忘之島','銀騎士地區','銀騎士村莊','鏡子森林','風木','魔族神殿','魔獸訓練場','魔獸軍王之室','黃昏山脈','黑魔法研究室','龍之谷','龍之谷地監1樓','龍之谷地監2樓','龍之谷地監3樓','龍之谷地監4樓','龍之谷地監5樓','龍之谷地監6樓','龍之谷地監深層']);
AREA_1920.add('古魯丁村莊');
AREA_1920.add('決鬥競技場');
['肯特外門區','肯特內城','風木外門區','風木內城','海音外門區','海音內城','時空裂痕戰場','日出之國城墎','日出之國東之地','日出之國西之地','日出之國北之地'].forEach(name => AREA_1920.add(name));
['侵蝕的安塔瑞斯巢穴入口','侵蝕的安塔瑞斯巢穴通道','侵蝕的安塔瑞斯巢穴深處','侵蝕的安塔瑞斯棲息地'].forEach(name => AREA_1920.add(name));   // 🐉 v3.7.58 安塔瑞斯副本 4 區專屬背景（名稱對應 js/05 ANTHARAS_AREA_NAMES）
function areaBg1920(name) { return (name && AREA_1920.has(name)) ? ('assets/area/1920x1080/' + name + '.jpg') : null; }   // 名稱→1920 路徑(存在才回傳)
function upgradeAreaPath(path) { if (!path) return path; let m = /^assets\/area\/([^\/]+)\.jpg$/.exec(path); return (m && AREA_1920.has(m[1])) ? ('assets/area/1920x1080/' + m[1] + '.jpg') : path; }   // 舊 assets/area/<名>.jpg fallback 路徑就地升級到 1920×1080(若有新圖)；非此格式(如 castle.png)原樣
// 🏙️ v3.2.80 安全區逐城 1920×1080 背景(town id → 檔名)：命名差異(村/村莊/城鎮/full-width括號)以此表精準對應；未列者(攻城城堡 town_*_castle 等)退回舊 assets/background 通用圖
const TOWN_BG_1920 = {
    town_aden: '亞丁城鎮', town_giran: '奇岩城鎮', town_heine: '海音城鎮', town_oren: '歐瑞村莊',
    town_kent_castle: '肯特城', town_windwood_castle: '風木城', town_heine_castle: '海音城',
    town_elf: '妖精森林村莊', town_talking: '說話之島村莊', town_gludio: '燃柳村莊', town_gludin: '古魯丁村莊', town_witon: '威頓村莊',
    town_hyperia: '希培利亞', town_silver_knight: '銀騎士村莊', town_ivory_tower: '象牙塔（1~3樓）',
    town_sherine: '席琳神殿', town_silent: '沉默洞穴', town_behemoth: '貝希摩斯', town_flame_audience: '炎魔謁見所',
    town_pride: '傲慢之塔1樓', town_rift: '時空裂痕入口', town_pirate_village: '海賊島村莊',
    town_elder_council: '長老會議廳'   // 🌑 v3.3.33 黑暗妖精聖地樞紐安全區
};
function mapDisplayName(v) { for (let _c in MAP_CATEGORIES) { let _e = MAP_CATEGORIES[_c].find(x => x.v === v); if (_e) return _e.t; } return null; }
function applyAreaBackground() {
    let cur = mapState.current, cat = mapCategoryOf(cur);
    let ov = a => `linear-gradient(rgba(15,23,42,${a}), rgba(15,23,42,${a}))`;
    let bv = document.getElementById('battle-view');
    if (bv && cur.startsWith('town_')) {   // 🏙️ v2.6.0：安全區(town_)戰鬥框恆隱藏、絕不套狩獵背景。必須清掉 area-fit/has-bg——否則 CSS `#battle-view.area-fit{display:flex}`(1,1,0) 會蓋過 `.hidden`(0,1,0) 使隱藏的戰鬥框又顯示、露出與安全區同名的狩獵圖(如象牙塔/傲慢之塔安全區顯示名＝有同名 assets/area/<名>.jpg)。
        bv.style.backgroundImage = ''; bv.style.backgroundSize = ''; bv.classList.remove('area-fit'); bv.classList.remove('has-bg');
    } else if (bv) {
        let fbImg = SPECIAL_AREA_BG[cur] || CATEGORY_AREA_BG[cat] || null;   // 既有設定圖(fallback)：特殊地圖逐張優先，否則依分類(野外/地監/攻城)
        let useSrc = null, useFit = false;
        // 🖼️ 優先尋找「同名地圖圖檔」assets/area/1920x1080/[地圖名稱].jpg：以 AREA_1920 集合同步判定(無探測、無 404、無閃爍)；不在集合者一律走 fallback 圖。
        let _nm = mapDisplayName(cur);
        if (!_nm && cur === 'windwood_dungeon') _nm = '風木地監';   // 🏰 風木地監＝動態城堡區(不在 MAP_CATEGORIES)：手動指定同名圖名；'風木地監' 不在 AREA_1920 → 實際取 fbImg(地監.jpg→升級為 1920×1080 版)
        if (!_nm && HIDDEN_AREA_BG[cur]) _nm = HIDDEN_AREA_BG[cur];
        if (!_nm && typeof ANTHARAS_AREA_NAMES !== 'undefined' && ANTHARAS_AREA_NAMES[cur]) _nm = ANTHARAS_AREA_NAMES[cur];   // 🐉 v3.7.58 安塔瑞斯副本 4 區(不在 MAP_CATEGORIES)：顯示名→同名 1920×1080 專屬背景   // 🏛️ 隱藏狩獵區域(不在 MAP_CATEGORIES)：背景＝對應母地圖樓層圖（無生物研究室→象牙塔4樓…惡魔封印室→象牙塔8樓、巨蟻女皇棲息地→螞蟻洞穴2樓）；樓層名須在 AREA_1920 才會採用，否則退回 SPECIAL_AREA_BG（母圖通用背景）
        let _s1920 = areaBg1920(_nm);   // 🖼️ v3.2.80 新版 1920×1080 同名場景圖(同步判定·優先於分類 fallback)
        if (_s1920) { useSrc = _s1920; useFit = true; }
        else if (fbImg) { let _fb = upgradeAreaPath(fbImg); useSrc = _fb.indexOf('/') >= 0 ? _fb : `assets/background/${_fb}`; useFit = !AREA_BG_NOFIT.has(fbImg); }   // ⚔️ 預設 area-fit，僅舊 castle.png/Rift.png 例外；🖼️ fallback 圖亦經 upgradeAreaPath 升級 1920×1080(若有新圖)
        if (useSrc) { bv.style.backgroundImage = `url("${useSrc}")`; bv.style.backgroundSize = useFit ? 'cover' : ''; bv.classList.toggle('area-fit', useFit); bv.classList.add('has-bg'); }   // 🖥️ 條狀比例背景改 cover＋area-fit(戰鬥框由 flex 吃滿地圖面板·背景滿版置中裁切)、其餘清空 inline 回退 CSS 的 cover
        else { bv.style.backgroundImage = ''; bv.style.backgroundSize = ''; bv.classList.remove('area-fit'); bv.classList.remove('has-bg'); }
    }
    let tv = document.getElementById('town-view');
    if (tv) {
        // 🏘️ v3.2.84 城鎮改地圖式 NPC 後，場景背景改由 #town-npc-map(800×450·自帶 _townMapBg) 承載
        //   → town-view 不再鋪舊的半透明底圖與 has-bg 圓角框（移除城鎮舊 assets/background 底圖與框架，只保留新區域）
        tv.style.backgroundImage = ''; tv.classList.remove('has-bg');
    }
}
function applyElfBorder() {
    if(!document.body) return;
    let e = (player.cls === 'elf' && player.elfEle) ? ELF_ELE[player.elfEle] : null;
    document.body.style.boxShadow = e ? `inset 0 0 0 6px ${e.border}` : 'none';   // 攻城獲勝標記改用頭像旁徽章顯示，避免與妖精地屬性黃色邊框衝突
}

function renderElionUI(div) {
    if(player.cls !== 'elf') {
        div.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <span class="text-5xl mb-4">🚫</span><span class="text-lg">只有妖精能夠選擇屬性。</span></div>`;
        return;
    }
    if(player.lv < 30) {
        div.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <span class="text-5xl mb-4">🔒</span><span class="text-lg">需要達到 Lv 30 才能選擇屬性。</span>
            <span class="text-sm mt-2 text-slate-500">目前等級 Lv ${player.lv}</span></div>`;
        return;
    }
    let cur = player.elfEle ? ELF_ELE[player.elfEle] : null;
    let header = cur
        ? `<p class="text-slate-300 mb-1">目前屬性：<span class="${cur.cls} font-bold text-lg">${cur.name}屬性</span></p>
           <p class="text-sm text-yellow-400 mb-4">轉換屬性需花費 ${ELF_SWITCH_COST.toLocaleString()} 金幣（目前持有 ${player.gold.toLocaleString()}）</p>`
        : `<p class="text-slate-300 mb-4">選擇一種屬性，首次選擇免費。選擇後將解鎖對應的三、四階精靈魔法。</p>`;
    let btns = Object.keys(ELF_ELE).map(k => {
        let e = ELF_ELE[k];
        let isCur = player.elfEle === k;
        return `<button onclick="chooseElfElement('${k}')" ${isCur?'disabled':''}
            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-transform
            ${isCur ? 'opacity-50 cursor-not-allowed border-slate-600' : 'cursor-pointer hover:scale-105'}"
            style="border-color:${e.border}; background:${e.color}1a;">
            <span class="text-3xl font-bold ${e.cls}">${e.name}</span>
            <span class="text-xs text-slate-400">${isCur?'目前屬性':e.name+'屬性'}</span>
        </button>`;
    }).join('');
    div.innerHTML = `<div class="p-4">${header}<div class="grid grid-cols-2 md:grid-cols-4 gap-3">${btns}</div></div>`;
}

function chooseElfElement(ele) {
    if(player.cls !== 'elf' || player.lv < 30 || !ELF_ELE[ele]) return;
    if(player.elfEle === ele) return;
    if(player.elfEle) {
        if(player.gold < ELF_SWITCH_COST) { logSys('金幣不足，無法轉換屬性。'); return; }
        if(!confirm(`確定花費 ${ELF_SWITCH_COST.toLocaleString()} 金幣將屬性轉換為「${ELF_ELE[ele].name}」？`)) return;
        player.gold -= ELF_SWITCH_COST;
        logSys(`你花費 ${ELF_SWITCH_COST.toLocaleString()} 金幣，屬性轉換為 <span class="${ELF_ELE[ele].cls}">${ELF_ELE[ele].name}屬性</span>。`);
    } else {
        logSys(`你選擇了 <span class="${ELF_ELE[ele].cls}">${ELF_ELE[ele].name}屬性</span>。`);
    }
    player.elfEle = ele;
    // 🧝 v3.2.42 稽核修：換屬性時在場屬性精靈立即收回（保留自動重施開關→下個 tick 以新屬性重新現身；原本舊屬性精靈會一直打到死/到期）
    if ((player._summonV2Sk === 'sk_elf_summon' || player._summonV2Sk === 'sk_elf_summon2')
        && typeof summonV2List === 'function' && summonV2List().length && typeof summonV2DismissAll === 'function') {
        const _on = player._summonV2On;
        summonV2DismissAll(true);
        player._summonV2On = _on;
        logSys('屬性精靈隨著屬性的轉換而消散——牠將以新屬性重新現身。');
    }
    applyElfBorder();
    calcStats();
    renderTabs();
    renderSkillSelects();
    let div = document.getElementById('interaction-content');
    if(div) renderElionUI(div);
    updateUI();
}

// ========== 村莊商店 ─ 單頁捲動版 ==========
let _currentShopNpc = ''; // 用來記住目前是哪位商人

// 根據 NPC ID 取得該商人販售的所有物品
const SHOP_LISTS = {
    npc_boni: ['potion_heal','potion_strong','potion_ult','potion_blue','potion_haste','scroll_poly','scroll_magicbarrier','scroll_teleport','scroll_revive','wpn_5','wpn_22','candle'],   // 🏴‍☠️ 波尼（海賊島村莊 雜貨商人）·🚫 v3.2.17 肉已移除
    npc_linda: ['bk_elf_mr','bk_elf_mind','bk_elf_worldtree','bk_elf_purify','bk_elf_firewpn','bk_elf_windshot','bk_elf_earthguard','bk_elf_eleres','bk_elf_singleres'],
    npc_bayes: ['bk_fireball','bk_vampire','bk_rock_prison','bk_thunder','bk_ice_spike','bk_bless_wpn'],
    npc_gilen: ['bk_heal1','bk_sunlight','bk_shield','bk_lightarrow','bk_teleport','bk_icearrow','bk_windblade','bk_holy_wpn','bk_antidote','bk_cold_shiver','bk_poison_curse','bk_ench_wpn','bk_reveal','bk_load_up','bk_firearrow','bk_hell_fang','bk_heal_mid','bk_shield2','bk_energy_sense','bk_chill','bk_aurora','bk_dark_blind','bk_undead_bane'],
    npc_vangil: ['arm_103','arm_105','arm_108','arm_42','arm_43','hlm_mr','arm_68','arm_66','arm_67','amr_robe','arm_65','arm_63','arm_69','arm_60','arm_61','arm_62','amr_plate'],
    npc_evert: ['new_item_189','new_item_188','new_item_187'],
    npc_wino: ['wpn_shortsword','wpn_9','wpn_scimitar','wpn_37','wpn_invader','wpn_longsword','wpn_damascus','wpn_silversword','wpn_2hsword','wpn_katana','wpn_10','wpn_13','wpn_1','wpn_battleaxe','wpn_19','wpn_38','wpn_20','wpn_silveraxe','wpn_witchwand','wpn_18','wpn_giantaxe','wpn_28','wpn_14','wpn_6','wpn_3','wpn_17','wpn_15','wpn_7','wpn_21','wpn_16','wpn_halberd','wpn_12'],
    npc_skvati: ['potion_heal','potion_strong','potion_ult','potion_blue','potion_haste','scroll_poly','scroll_magicbarrier','scroll_teleport','scroll_revive','wpn_5','wpn_22','candle','wpn_claw_bronze','wpn_claw_steel','wpn_claw_shadow','wpn_claw_damascus','wpn_dual_bronze','wpn_dual_steel','wpn_dual_shadow','wpn_dual_damascus'],
    npc_saedia: ['bk_dark_str','bk_dark_mrup','bk_dark_stealth','bk_dark_poison','bk_dark_refine','bk_dark_dex','bk_dark_poisonres','bk_dark_burn','bk_dark_walkhaste'],
    npc_sphere: ['mem_confuse','mem_mirror','mem_crush','mem_ogre','mem_focus','mem_skullbreak','mem_lich','mem_endure'],   // 🔮 史菲爾只販賣這 8 種記憶水晶；其餘水晶改由掉落/製作/兌換取得（日光術改由吉蘭購得）
    npc_sempal: ['bk_dragon_guardbreak','bk_dragon_slaughter','bk_dragon_flameslash','bk_dragon_terror'],   // 🐉 森帕爾：4 種龍騎士書板（消滅者鎖鏈劍改為潘朵拉/普洛凱爾試煉取得）
    default: ['potion_heal','potion_strong','potion_ult','potion_blue','potion_haste','potion_brave','new_item_140','new_item_139','scroll_poly','scroll_magicbarrier','scroll_teleport','scroll_revive','wpn_5','wpn_22','candle']   // 🚫 v3.2.17 哨子/肉已隨舊項圈系統移除
};
// 🔧 商店販售清單（單一來源）：getShopItemsForNpc 與潘朵拉權重覆寫共用此表
function getShopItemsForNpc(npcId) {
    let list = SHOP_LISTS[npcId] || SHOP_LISTS.default;
    return list.filter(id => {
        let d = DB.items[id];
        if (!d) return false;
        // 🔧 武器/防具：不限職業，全部販售（買得到；能否裝備仍由 equipItem/checkCanEquip 白名單把關）。
        if (d.type === 'wpn' || d.type === 'arm') return true;
        // 飾品（acc）：仍以「實際可裝備」判定（涵蓋各職業白名單）。
        if (d.type === 'acc') return checkCanEquip({ id });
        // 其餘（消耗品/技能書/材料等）：沿用職業白名單
        return reqAllowsClass(d, player.cls) || loadUpAllows(id);
    });
}

function renderTownShop(containerElement, npcId = '') {
    if (npcId) _currentShopNpc = npcId;
    let div = containerElement || document.getElementById('interaction-content');
    div.innerHTML = '';

    // 直接建立商品清單容器，不再建立 select 下拉選單
    let listDiv = document.createElement('div');
    listDiv.id = 'shop-items-list';
    div.appendChild(listDiv);

    renderShopItems();
}

function renderShopItems() {
    let listDiv = document.getElementById('shop-items-list');
    if(!listDiv) return;
    listDiv.innerHTML = '';

    let ids = getShopItemsForNpc(_currentShopNpc);
    if(!ids.length) {
        listDiv.innerHTML = '<div class="text-slate-500 text-sm text-center py-8">此商人目前沒有販售適合你的商品。</div>';
        return;
    }
    
    ids.forEach(id => {
        let d = DB.items[id];
        let el = document.createElement('div');
        el.className = 'list-item bg-slate-800 rounded mb-2 border border-slate-700 p-3 hover:bg-slate-750 transition-colors';
        el.style.cssText = 'display:flex !important; justify-content:space-between !important; align-items:center !important; width:100% !important; box-sizing:border-box !important;';
        let imgUrl = getIconUrl(d);
        let glowClass = getGlowClass(null, d);
        let learned = d.type === 'skillbk' && player.skills.includes(d.sk);
        let cantLearn = d.type === 'skillbk' && !learned && DB.skills[d.sk] && skillReqLv(DB.skills[d.sk], d.sk) === undefined;   // 🔧 該職業無法學習（如黑暗妖精三階以上法師魔法）：以「已習得」相同暗色呈現
        let dim = learned || cantLearn;

        // 箭矢與肉的顯示判斷
        let nameDisp = id === 'wpn_5' ? '箭 (1000根)' : (id === 'wpn_22' ? '銀箭 (1000根)' : d.n);
        let priceDisp = id === 'wpn_5' ? shopPrice(100).toLocaleString() : (id === 'wpn_22' ? shopPrice(200).toLocaleString() : shopPrice(d.p || 0).toLocaleString());

        el.innerHTML = `
            <div class="flex items-center gap-4 min-w-0 flex-1 ${dim ? 'opacity-50' : ''}">
                <div class="w-12 h-12 bg-slate-900 rounded border border-slate-600 flex items-center justify-center shrink-0 tip-host">
                    <img src="${imgUrl}" onerror="this.style.display='none';" class="w-10 h-10 object-contain pointer-events-none ${glowClass}">
                </div>
                <div class="flex flex-col items-start gap-1.5">
                    <span class="${getItemColor({ id })} font-bold text-lg leading-none truncate">
                        ${nameDisp}${learned ? ' <span class="text-slate-500 text-xs font-normal">已習得</span>' : (cantLearn ? ' <span class="text-red-500 text-xs font-normal">無法學習</span>' : '')}
                    </span>
                    <div class="flex items-center gap-2">
                        <span class="text-yellow-400 font-bold text-base leading-none">${priceDisp} 金幣</span>
                        <span class="text-slate-400 text-xs hidden md:block leading-none">${d.d || ''}</span>
                    </div>
                </div>
            </div>
            ${ d.type === 'skillbk'
                ? (cantLearn
                    ? `<button class="btn bg-slate-700 border-slate-600 text-slate-500 py-2 px-6 font-bold shrink-0 cursor-not-allowed opacity-60" disabled>無法學習</button>`
                    : `<button class="btn bg-blue-700 hover:bg-blue-600 border-blue-500 py-2 px-6 font-bold shrink-0 shadow" onclick="buyItem('${id}')">${learned ? '再買' : '購買'}</button>`)
                : `<div class="flex items-center gap-2 shrink-0">
                       <input type="number" id="shop-qty-${id}" value="1" min="1" class="w-16 bg-slate-900 border border-slate-600 text-center text-white rounded py-1 outline-none">
                       <button class="btn bg-blue-700 hover:bg-blue-600 border-blue-500 py-2 px-5 font-bold shadow" onclick="buyItem('${id}', document.getElementById('shop-qty-${id}').value)">購買</button>
                   </div>` }
        `;
        listDiv.appendChild(el);
    });
}

function migrateSaves(){
    // 舊單一存檔 → 第1格（既有玩家預設落在存檔1）
    let oldS = _lsGet('lineage_idle_save');
    if(oldS && !_lsGet('lineage_idle_save_1')) _lzSetStoredRaw('lineage_idle_save_1', oldS);
}
// 🗑️ v3.7.94 清掉離線掛機（js/27，已整檔刪除）留下的 localStorage 殘骸：
//    checkpoint／catchup／claim／profile 四種 key 都以 `lineage_idle_offline_v1_` 開頭，現在沒有任何讀取者，
//    留著只是白佔配額（本專案的 localStorage 配額本來就吃緊）。存檔內的 player.offlineHunt 由 loadGame 順手刪除。
(function _purgeOfflineLeftovers(){
    try {
        if(typeof localStorage === 'undefined') return;
        Object.keys(localStorage)
            .filter(k => String(k).indexOf('lineage_idle_offline_v1_') === 0)
            .forEach(k => { try { localStorage.removeItem(k); } catch(e){} });
    } catch(e){}
})();
// 🗑️ v3.5.83 移除 anySaveExists()：唯一用途是顯示主選單的 #btn-load，而該按鈕早已從 HTML 移除
//    （主選單只剩「開始遊戲」→ openLoadSelect），四處 `btnLoad &&` 守衛全部恆為 null 短路。
// 🗑️ v3.7.94 用戶指定移除離線掛機（js/27 整檔刪除）：登入畫面的「掛機中」徽章、離線收益明細與其
//    checkpoint 資料源（_slotOfflineStatusNow／_slotOfflineDuration／savedHunt／offlineId）一併移除。
//    這個位置現在只剩「擔任傭兵」徽章，故 meta 縮到 mercEmployerOfSlot 需要的最小身分欄位。
function _slotBadgeMeta(n, sum){
    if(!sum) return null;
    // 🧑‍🤝‍🧑 v3.7.85 「擔任傭兵」徽章：僱傭關係會變·每次刷新現查·不快取結果
    return { slot: n, mercWho: { cls: sum.rawCls, name: sum.name, enSeed: sum.enSeed, classic: !!sum.classic } };
}
// 🧑‍🤝‍🧑 v3.7.85 該存檔位角色是否正受僱為別人的傭兵（受僱＝只能待安全區）
function _slotPartyStatusNow(meta){
    if(!meta || !meta.mercWho || typeof mercEmployerOfSlot !== 'function') return null;
    try { return mercEmployerOfSlot(meta.slot, meta.mercWho); } catch(e){ return null; }
}
// 立繪頭頂置中的單行徽章。class 名沿用 `.load-slot-badge`＋紫色 `.load-badge-party`（v3.7.94 由 .load-offline-* 更名）。
function _slotBadgeHtml(party){
    if(!party) return '';
    return `<span class="load-slot-status"><span class="load-slot-badge load-badge-party"><strong>擔任傭兵</strong></span></span>`;
}

function _summaryFromRaw(s){
    if(!s) return null;
    s = _saveUnwrap(s).payload;   // 🛡️ 先解存檔簽章（摘要顯示不驗章、僅取 payload；舊明文檔原樣回傳）
    try { let d = JSON.parse(s); let p = d.p;
        let clsName = { knight:'騎士', mage:'法師', elf:'妖精', dark:'黑暗妖精', illusion:'幻術士', dragon:'龍騎士', warrior:'戰士', royal:'王族' }[p.cls] || p.cls;
        return {
            name: p.name || '',
            cls: clsName,
            rawCls: p.cls || '',
            lv: p.lv || 1,
            gold: p.gold || 0,
            classic: !!p.classicMode,
            avatar: p.avatar || null,
            enSeed: p.enSeed || '',
            roleFp: _roleFingerprint(p),
            pledge: (typeof clanNameForPlayer === 'function' ? clanNameForPlayer(p) : '') || '',
            hp: p.hp || 0,
            mhp: p.mhp || p.maxHp || 0,
            mp: p.mp || 0,
            mmp: p.mmp || p.maxMp || 0,
            ac: p.d && typeof p.d.ac === 'number' ? p.d.ac : '',
            base: p.base || {}
        };   // 🎮 經典模式旗標：供存檔位顯示與傭兵同模式招募限制（🏛️v3.0.83 傳統已取消·未載入過的舊傳統存檔以 classicMode 歸類）；avatar＝職業性別頭像名（assets/character/<avatar>.png）；name 未命名時留空字串（顯示端自行省略）
    } catch(e){ return null; }
}
function slotSummary(n){ return _summaryFromRaw(_lzGet('lineage_idle_save_' + n)); }

// ===== 角色多開／刪除保護 =====
// 每個正在遊戲中的分頁每 2 秒留下心跳。刪角時只要還有其他活躍分頁就拒絕，
// 並以角色世代指紋阻止已刪除的舊分頁在稍後自動存檔時把角色寫回來。
const ROLE_SESSION_REGISTRY_KEY = 'fb5_active_role_sessions_v1';
const ROLE_DELETED_GUARD_KEY = 'fb5_deleted_role_guards_v1';
const ROLE_SESSION_TTL_MS = 90000;   // ⏱️ v3.6.97 8秒→90秒：背景分頁計時器被 Chrome 節流到每分鐘一拍，8 秒會把「還開著的隱藏分頁」誤判成離線（掛機中徽章誤亮＋刪角保護空窗）；正常關頁走 pagehide/beforeunload 立即除名，不受 TTL 影響
const _roleSessionId = 'rs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
function _roleEpoch(){ return 're_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2); }
function _roleFingerprint(p){
    if(!p || !p.cls) return '';
    // ⚠️ 舊存檔無 enSeed：必須用與 loadGame 完全相同的衍生式（名稱|職業|lz），否則
    //    「記憶體 player 已補種子 vs 磁碟 d.p 尚未補」會算出兩個不同指紋 →_roleSaveAllowed 恆為 false
    //    → 該角色此後 saveGame 一律靜默失敗，且因寫不進去而永遠補不到種子（死鎖）。
    let owner = p.enSeed || ('es' + _seedHash((p.name || '') + '|' + (p.cls || '') + '|lz').toString(36));
    return String(owner) + '|' + String(p._roleEpoch || 'legacy');
}
function _roleReadSavePlayer(slot){
    try {
        let u = _saveUnwrap(_lzGet('lineage_idle_save_' + slot));
        if(!u || !u.ok || !u.payload) return null;
        let d = JSON.parse(u.payload);
        return d && d.p && d.p.cls ? d.p : null;
    } catch(e){ return null; }
}
function _roleReadObject(key){
    try { let v = JSON.parse(_lsGet(key) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
    catch(e){ return {}; }
}
function _roleWriteObject(key, value){ return _lsSet(key, JSON.stringify(value)); }
function _rolePruneSessions(reg, now){
    now = now || Date.now();
    for(let id in reg) if(!reg[id] || now - (Number(reg[id].ts) || 0) > ROLE_SESSION_TTL_MS) delete reg[id];
    return reg;
}
function _roleSessionForget(){
    let reg = _rolePruneSessions(_roleReadObject(ROLE_SESSION_REGISTRY_KEY));
    if(reg[_roleSessionId]) { delete reg[_roleSessionId]; _roleWriteObject(ROLE_SESSION_REGISTRY_KEY, reg); }
}
function _roleSessionHeartbeat(){
    let gs = document.getElementById('game-screen');
    let active = !!(typeof state !== 'undefined' && state.running && player && player.cls && gs && !gs.classList.contains('hidden'));
    let reg = _rolePruneSessions(_roleReadObject(ROLE_SESSION_REGISTRY_KEY));
    if(active) reg[_roleSessionId] = { ts:Date.now(), slot:currentSlot, fp:_roleFingerprint(player), name:player.name || '未命名' };
    else delete reg[_roleSessionId];
    _roleWriteObject(ROLE_SESSION_REGISTRY_KEY, reg);
    if(active && typeof syncMercenaryEmploymentRegistry === 'function') syncMercenaryEmploymentRegistry();
    if(active && typeof enforceMercenarySafeArea === 'function') enforceMercenarySafeArea();
}
function _roleOtherActiveSessions(){
    let reg = _rolePruneSessions(_roleReadObject(ROLE_SESSION_REGISTRY_KEY));
    _roleWriteObject(ROLE_SESSION_REGISTRY_KEY, reg);
    return Object.keys(reg).filter(id => id !== _roleSessionId).map(id => reg[id]);
}
function _roleMarkDeleted(fp){
    if(!fp) return false;
    let guards = _roleReadObject(ROLE_DELETED_GUARD_KEY), now = Date.now();
    for(let k in guards) if(now - (Number(guards[k]) || 0) > 30 * 86400000) delete guards[k];
    guards[fp] = now;
    return _roleWriteObject(ROLE_DELETED_GUARD_KEY, guards);
}
function _roleSaveAllowed(){
    let fp = _roleFingerprint(player);
    if(!fp) return false;
    let guards = _roleReadObject(ROLE_DELETED_GUARD_KEY);
    if(guards[fp]) return false;
    let stored = _roleReadSavePlayer(currentSlot);
    return !stored || _roleFingerprint(stored) === fp;
}
setInterval(_roleSessionHeartbeat, 2000);
// 🔄 登入畫面徽章活刷：只重算徽章、原地增刪 span——不整頁重繪（不打斷選取與立繪動畫），存檔面資料用 _loadSlotMeta 快取。
//    🗑️ v3.7.94 移除離線掛機後這裡只剩「擔任傭兵」：僱主在別的分頁解散傭兵→這裡 2 秒內消失。
setInterval(function(){
    let panel = document.getElementById('load-select-panel');
    if(!panel || panel.classList.contains('hidden')) return;
    let grid = document.getElementById('load-slot-grid');
    if(!grid) return;
    grid.querySelectorAll('.load-slot-card[data-slot]').forEach(btn => {
        let party = _slotPartyStatusNow(_loadSlotMeta[Number(btn.getAttribute('data-slot'))]);
        let old = btn.querySelector('.load-slot-status');
        if(party){
            let html = _slotBadgeHtml(party);
            if(old) old.outerHTML = html;
            else btn.insertAdjacentHTML('beforeend', html);
        } else if(old) old.remove();
    });
}, 2000);
// 💾 v3.7.94 關頁／切背景的最終存檔。
//    ⚠️ **這段不是可有可無的**：離線掛機（js/27）被移除前，唯一的 visibilitychange／pagehide／beforeunload
//    存檔掛點在 js/27 裡（_offlinePauseAndSave／_offlineCloseAndSave）。整檔刪掉而不補這段的話，
//    自動存檔是每 5 分鐘一次 → 關分頁最多會吐掉 5 分鐘進度。
//    __fb5CloseFlush＝繞過下方 saveGame 的「補跑期間延後存檔」閘（背景節流喚醒間 _tickDebt 常 ≥100ms，
//    不繞過＝最終進度不落地）。旗標名沿用 v3.7.31，由此處設定與清除。
function _flushSaveNow(){
    if(typeof player === 'undefined' || !player || !player.cls || typeof saveGame !== 'function') return;
    if(typeof window !== 'undefined') window.__fb5CloseFlush = true;
    try { saveGame(); } catch(e) {}
    finally { if(typeof window !== 'undefined') window.__fb5CloseFlush = false; }
}
if(typeof document !== 'undefined' && document.addEventListener)
    document.addEventListener('visibilitychange', function(){ if(document.hidden) _flushSaveNow(); });
if(typeof window !== 'undefined') window.addEventListener('beforeunload', function(){ _flushSaveNow(); _roleSessionForget(); });
if(typeof window !== 'undefined') window.addEventListener('pagehide', function(){ _flushSaveNow(); _roleSessionForget(); });   // beforeunload 在背景分頁被關閉時常不觸發；bfcache 還原後心跳 2 秒內自動重新註冊

// 🗑️ v3.5.83 移除 openSlotSelect／chooseSlot／slotBackToMenu 與 #slot-select-panel：
//    主選單唯一入口早已是 openLoadSelect()（index.html「開始遊戲」），舊的兩段式存檔位面板不可達。
//    創角改由 renderLoadSelect 的空欄位直接進 showCreation()。

// ===== 存檔 匯出 / 匯入 =====
// 單一角色匯出不攜帶跨角色的出戰歸屬：傭兵由其他存檔位衍生，寵物名冊則保留但全部回到保管。
function portablePetRoster(list){
    let stamp = () => (typeof _petNowStamp === 'function') ? _petNowStamp() : (Date.now() * 1024);
    return (Array.isArray(list) ? list : []).filter(p => p && typeof p === 'object').map(p => {
        let clean = JSON.parse(JSON.stringify(p));
        clean.outOwner = null;
        clean.outSlot = null;
        clean.outV = stamp();
        delete clean.out;
        return clean;
    });
}
// 匯出：先儲存當前進度，再把該角色存檔寫成 .json 檔。優先用檔案系統 API（可自選資料夾），
//       不支援時退回瀏覽器下載（落在預設下載資料夾）。
// Validate the fields used before loadGame can apply legacy defaults.
// Optional migration fields and unknown item/map IDs remain compatible.
function _validatePortableSave(d) {
    let record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    let fail = field => { throw new Error('存檔資料格式不正確：' + field); };
    if (!record(d) || !record(d.p) || !record(d.ms)) fail('角色或地圖');
    if (d.v != null && (!Number.isInteger(d.v) || d.v < 1 || d.v > SAVE_VERSION)) fail('不支援的存檔版本');
    if (d.ticks != null && (!Number.isFinite(d.ticks) || d.ticks < 0)) fail('時間');
    let p = d.p;
    if (!['royal', 'knight', 'elf', 'mage', 'dark', 'dragon', 'warrior', 'illusion'].includes(p.cls)) fail('職業');
    if (!record(p.base) || !record(p.d) || !record(p.eq)) fail('能力或裝備');
    for (let key of ['str', 'dex', 'con', 'int', 'wis']) {
        if (!Number.isFinite(p.base[key])) fail('基本能力 ' + key);
    }
    if (p.base.cha != null && !Number.isFinite(p.base.cha)) fail('基本能力 cha');
    for (let key of ['lv', 'exp', 'gold']) {
        if (p[key] != null && !Number.isFinite(p[key])) fail(key);
    }
    let item = value => record(value) && typeof value.id === 'string' && value.id.length > 0
        && (value.cnt === undefined || (Number.isInteger(value.cnt) && value.cnt > 0));
    if (!Array.isArray(p.inv) || !p.inv.every(item)) fail('背包');
    if (!Object.values(p.eq).every(value => value == null || item(value))) fail('裝備物品');
    if (!Array.isArray(p.skills) || !p.skills.every(value => typeof value === 'string')) fail('技能');
    // These containers may be absent in old saves, but a present scalar/array cannot
    // safely pass the migrations that precede applySaveDefaults.
    for (let key of ['alloc', 'panacea', 'cds', 'buffs', 'statuses', 'siege', 'config',
        'junkPrefs', 'cardDex', 'equipDex', 'miscDex', 'relicDex', 'summon', 'charmed']) {
        if (p[key] != null && !record(p[key])) fail(key);
    }
    if (p.allies != null && (!Array.isArray(p.allies)
        || !p.allies.every(value => value == null || record(value)))) fail('傭兵');
    if (d.ms.mobs != null && (!Array.isArray(d.ms.mobs)
        || !d.ms.mobs.every(value => value == null || record(value)))) fail('怪物');
}

// Merge shared collection progress into the parsed export copy, never live player.
// Read the selected role's mode explicitly; the currently playing role may differ.
function _mergePortableCollections(p) {
    let record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    let read = base => {
        let raw = _lzGetStrict(_dexKey(base, p));
        if (raw == null) return {};
        let value = JSON.parse(raw);
        if (!record(value)) throw new Error('共用圖鑑資料格式不正確：' + base);
        return value;
    };
    let sharedCard = read(CARDDEX_KEY), ownCard = p.cardDex || {};
    if (!record(ownCard)) throw new Error('角色卡片圖鑑資料格式不正確');
    let cards = Object.create(null);
    let mergeCard = (source, old) => {
        for (let key of Object.keys(source)) {
            if (key === '_v') continue;
            let value = source[key];
            if (!Number.isFinite(value) || value < 0) throw new Error('卡片圖鑑積分不正確');
            let score = old ? cardTierToScore(value) : value;
            cards[key] = Math.max(cards[key] || 0, score);
        }
    };
    mergeCard(sharedCard, sharedCard._v !== 2);
    mergeCard(ownCard, p.cardDexV !== 2);
    p.cardDex = cards;
    p.cardDexV = 2;
    for (let [base, field] of [[EQUIPDEX_KEY, 'equipDex'], [MISCDEX_KEY, 'miscDex'], [RELICDEX_KEY, 'relicDex']]) {
        let shared = read(base), own = p[field] || {};
        if (!record(own)) throw new Error('角色圖鑑資料格式不正確：' + field);
        let combined = Object.create(null);
        for (let source of [shared, own]) {
            for (let key of Object.keys(source)) if (source[key]) combined[key] = true;
        }
        p[field] = combined;
    }
}

function _readTransferObject(key) {
    let raw = _lzGetStrict(key);
    if (raw == null) return null;
    let unwrapped = _saveUnwrap(raw);
    if (!unwrapped.ok) throw new Error('Stored signature is invalid: ' + key);
    let value = JSON.parse(unwrapped.payload);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Stored object is invalid: ' + key);
    return value;
}
function _restoreImportSnapshots(before) {
    let restore = entry => {
        try {
            if (_lsGetStrict(entry.key) === entry.raw) return true;
            if (entry.raw == null) _lzRemoveStored(entry.key);
            else _lzSetStoredRaw(entry.key, entry.raw);
            return _lsGetStrict(entry.key) === entry.raw;
        } catch (e) { return false; }
    };
    let failed = [];
    for (let i = before.length - 1; i >= 0; i--) if (!restore(before[i])) failed.push(before[i]);
    // 刪除本輪新鍵後空間可能已釋出，僅對失敗項再試一次並驗證結果。
    return failed.map(restore).every(Boolean);
}
async function exportSave(slot){
    let slotNo = Math.max(1, Math.floor(Number(slot || currentSlot) || 1));
    if (slotNo === currentSlot && player && player.cls) {
        let saved = false;
        try { saved = saveGame() === true; } catch(e){}
        if(!saved){ alert('匯出已取消：目前角色或寵物資料未能成功儲存，請先排除儲存空間問題。'); return; }
    }
    let stored;
    try { stored = _saveUnwrap(_lzGetStrict('lineage_idle_save_' + slotNo)); }
    catch(e){ alert('匯出失敗：角色存檔無法完整讀取，未產生匯出檔。'); return; }
    if(stored.signed && !stored.ok){ alert('匯出失敗：角色存檔完整性校驗未通過。'); return; }
    let data = stored.payload;   // 💾 解壓並解簽 → 取出明文 JSON payload
    if(!data){ alert('目前沒有可匯出的存檔。'); return; }
    // 🔧 一併收錄共用倉庫（依角色的經典/非經典模式取對應倉庫）；匯入時可選擇是否還原
    try {
        let _obj = JSON.parse(data);
        _validatePortableSave(_obj);
        let _p = _obj.p;
        _mergePortableCollections(_p);
        // 🐉 傭兵通關日記在角色外部小鍵，匯出任意存檔位時同步回角色欄位，確保跨機匯入後仍保留今日次數。
        if(typeof antharasRoleRef === 'function' && typeof antharasRoleClearDay === 'function'){
            let _antRef = antharasRoleRef(_p, slotNo);
            if(_antRef) _p.antharasClearDay = Math.max(Number(_p.antharasClearDay) || 0, antharasRoleClearDay(_antRef));
        }
        _obj.p.allies = [];   // 🤝 傭兵引用其他存檔位；單角色備份一律不攜帶，避免幽靈傭兵
        let _wh = _readTransferObject(whKey(_p));
        _obj.wh = normalizeWarehouseData(_wh == null ? { items: [], gold: 0 } : _wh);
        let _whTombs = _readTransferObject(whKey(_p) + '_rm') || {};
        _obj.wh.items = _obj.wh.items.filter(it => it.uid == null || !_whTombs[it.uid]);
        // 🐾 一併收錄模式共用寵物名冊，但匯出副本全部設為未出戰，避免其他角色歸屬在新環境永久卡住。
        let _petKey = (typeof PET_ROSTER_KEY !== 'undefined' ? PET_ROSTER_KEY : 'fb5_pet_roster') + (typeof modeSuffix === 'function' ? modeSuffix(!!(_p && _p.classicMode), false) : '');
        let _petRaw = _lzGetStrict(_petKey), _arr = [];
        if(_petRaw != null){
            let _pu = _saveUnwrap(_petRaw);
            if(!_pu || !_pu.ok) throw new Error('invalid pet roster signature');
            _arr = JSON.parse(_pu.payload);
            if(!Array.isArray(_arr)) throw new Error('invalid pet roster');
        }
        _obj.pets = portablePetRoster(_arr);
        _readTransferObject('fb5_pandora_relic_market_v1');   // 先拒絕損壞桶，避免共用 API 的預設值掩蓋遺失。
        _readTransferObject(CLAN_STATE_KEY);
        if(typeof window.pandoraGetSharedDiamonds !== 'function') throw new Error('pandora diamond API unavailable');
        let _diamonds = Number(window.pandoraGetSharedDiamonds());
        if(!Number.isFinite(_diamonds)) throw new Error('invalid pandora diamonds');
        _obj.pandoraDiamonds = Math.max(0, Math.floor(_diamonds));
        if(typeof window.clanExportSharedState !== 'function') throw new Error('clan export API unavailable');
        let _clanState = window.clanExportSharedState();
        if(!_clanState || typeof _clanState !== 'object') throw new Error('invalid clan state');
        _obj.clanState = _clanState;
        data = JSON.stringify(_obj);
    } catch(e){
        try { console.error('[exportSave] failed', e); } catch(_e){}
        alert('匯出失敗：角色、倉庫、寵物、龍之鑽石或血盟資料無法正確讀取，未產生匯出檔。');
        return;
    }
    const desktopExport = !!_FS;
    if(desktopExport){
        if(typeof _FS.sign !== 'function'){
            alert('匯出失敗：安裝版儲存服務未就緒，請重新啟動遊戲後再試。');
            return;
        }
        // 桌面版備份使用 Host 簽發的 SIG2，並以獨立容器標記來源；網頁版無法驗證或讀取。
        data = _saveWrap(JSON.stringify({
            format: 'idle-lineage-desktop-save',
            schema: 1,
            version: GAME_VERSION,
            exportedAt: new Date().toISOString(),
            save: JSON.parse(data)
        }));
    } else {
        data = _saveWrapPortable(data);   // 網頁版維持既有 SIG1 可攜格式
    }
    let sum = slotSummary(slotNo);
    let cname = (sum && sum.name) ? sum.name : ('slot' + slotNo);   // 未命名 → 用 slotN 當檔名
    let fname = desktopExport ? `idle_lineage_desktop_save_${slotNo}_${cname}.json` : `fable5_save_${slotNo}_${cname}.json`;
    if(window.showSaveFilePicker){
        try {
            let handle = await window.showSaveFilePicker({
                suggestedName: fname,
                types: [{ description: desktopExport ? 'Idle Lineage 安裝版存檔' : '放置天堂網頁版存檔', accept: { 'application/json': ['.json'] } }]
            });
            let w = await handle.createWritable();
            await w.write(data);
            await w.close();
            logSys(`<span class="text-indigo-300 font-bold">✔ 存檔已匯出：${fname}</span>`);
            return;
        } catch(e){
            if(e && e.name === 'AbortError') return;   // 使用者取消選擇資料夾
            downloadSaveFile(data, fname);             // 其他錯誤 → 退回下載
            return;
        }
    }
    downloadSaveFile(data, fname);
}
function downloadSaveFile(data, fname){
    let blob = new Blob([data], { type: 'application/json' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logSys(`<span class="text-indigo-300 font-bold">✔ 存檔已匯出至下載資料夾：${fname}</span>`);
}
// 匯入：對指定存檔位 n 開啟選檔視窗，驗證後用匯入的存檔「取代」該位置的存檔，並刷新清單。
function importSave(n){
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = function(){
        let file = input.files && input.files[0];
        if(!file) return;
        let reader = new FileReader();
        reader.onload = function(){
            try {
            let _raw = String(reader.result || '');
            const desktopImport = !!_FS;
            if(!desktopImport && _raw.startsWith('SIG2:')){
                alert('匯入失敗：這是 Idle Lineage 安裝版匯出檔，網頁版資料與安裝版資料彼此獨立。');
                return;
            }
            let _u = _saveUnwrap(_raw);
            if(_u.signed && !_u.ok){ alert('匯入失敗：檔案完整性校驗未通過，可能已被竄改。'); return; }
            if(!desktopImport && !_u.signed && !confirm('此存檔檔案沒有完整性簽章（可能來自舊版本，或被外部修改/移除簽章）。\n仍要匯入嗎？')) return;
            let text = _u.payload;
            let d;
            try { d = JSON.parse(text); }
            catch(e){ alert('匯入失敗：檔案不是有效的存檔（JSON 解析錯誤）。'); return; }
            if(desktopImport){
                if(!_u.signed || !_u.ok || !d || d.format !== 'idle-lineage-desktop-save' || d.schema !== 1 || !d.save){
                    alert('匯入失敗：安裝版只支援由 Idle Lineage 安裝版匯出的專用存檔，網頁版資料無法匯入。');
                    return;
                }
                d = d.save;
            } else if(d && d.format === 'idle-lineage-desktop-save'){
                alert('匯入失敗：這是 Idle Lineage 安裝版匯出檔，網頁版資料與安裝版資料彼此獨立。');
                return;
            }
            _validatePortableSave(d);   // 在覆蓋任何角色／共用桶之前確認可載入。
            let existing = slotSummary(n);
            if(existing){ alert(`存檔 ${n} 已有角色，請先刪除角色後再匯入。`); return; }
            // 同一角色不可複製到另一存檔格：寵物以 enSeed 判斷主人，重複身分會讓兩個角色共用出戰權。
            let importSeed = d.p.enSeed || ('es' + _seedHash((d.p.name || '') + '|' + (d.p.cls || '') + '|lz').toString(36));
            for(let slotN = 1; slotN <= 8; slotN++){
                if(String(slotN) === String(n)) continue;
                let other = _roleReadSavePlayer(slotN);
                if(!other || !other.cls) continue;
                let otherSeed = other.enSeed || ('es' + _seedHash((other.name || '') + '|' + (other.cls || '') + '|lz').toString(36));
                if(otherSeed === importSeed){
                    alert(`匯入失敗：相同角色已存在於存檔 ${slotN}。請先刪除原角色後再還原備份，避免角色與寵物身分重複。`);
                    return;
                }
            }
            d.p.enSeed = importSeed;
            d.p._roleEpoch = _roleEpoch();   // 匯入視為新的角色世代，已刪角色的舊分頁不能覆蓋這份匯入檔
            d.p.allies = [];   // 🤝 舊匯出檔也強制移除傭兵；來源角色未一併匯入時不可保留快照
            // 🔧 抽出倉庫資料（若匯入檔含 wh）；🐾 v3.2.75 也抽出寵物名冊（pets）；龍之鑽石同為共用資料。
            //    寫入存檔位時不保留這些匯出專用欄位（它們不進角色存檔）。
            let whData = d.wh;
            let petData = d.pets;
            let pandoraDiamonds = d.pandoraDiamonds;
            let clanState = d.clanState;
            if(whData !== undefined){
                whData = normalizeWarehouseData(whData);
            }
            if(petData !== undefined){
                if(!Array.isArray(petData)){ alert('匯入失敗：寵物名冊格式不正確。'); return; }
                petData = portablePetRoster(petData);   // 🐾 舊檔可能仍帶出戰歸屬；匯入端再次清理
            }
            if(pandoraDiamonds !== undefined){
                pandoraDiamonds = Number(pandoraDiamonds);
                if(!Number.isFinite(pandoraDiamonds)){ alert('匯入失敗：龍之鑽石資料格式不正確。'); return; }
                pandoraDiamonds = Math.max(0, Math.floor(pandoraDiamonds));
            }
            if(clanState !== undefined && (!clanState || typeof clanState !== 'object' || Array.isArray(clanState) || !clanState.modes || !clanState.members)){
                alert('匯入失敗：血盟資料格式不正確。'); return;
            }
            let saveText = JSON.stringify(d);
            if(whData !== undefined || petData !== undefined || pandoraDiamonds !== undefined || clanState !== undefined){ let _c = {}; for(let k in d){ if(k !== 'wh' && k !== 'pets' && k !== 'pandoraDiamonds' && k !== 'clanState') _c[k] = d[k]; } saveText = JSON.stringify(_c); }
            // 🔧 詢問是否一併還原共用倉庫（會覆蓋現有倉庫，四個存檔位共用）
            let whMsg = '', restoreWh = false;
            if(whData !== undefined){
                let _cnt = (whData.items && whData.items.length) || 0;
                let _gold = whData.gold || 0;
                if(confirm(`此匯入檔包含倉庫資料（物品 ${_cnt} 項、金幣 ${_gold.toLocaleString()}）。\n是否一併還原倉庫？\n⚠ 會覆蓋該角色所屬模式（${(d.p && d.p.classicMode) ? '經典' : '非經典'}）的共用倉庫。`)){
                    restoreWh = true;
                    whMsg = '\n倉庫已一併還原。';
                } else {
                    whMsg = '\n（倉庫維持原狀，未還原）';
                }
            }
            // 🐾 v3.2.75 詢問是否一併還原共用寵物名冊（會覆蓋該模式現有名冊·同模式角色共用·比照倉庫）。桶存 _saveWrap 簽章格式。
            let petMsg = '', restorePets = false;
            if(petData !== undefined){
                if(confirm(`此匯入檔包含寵物名冊（${petData.length} 隻，匯入後全部為未出戰）。\n是否一併還原寵物？\n⚠ 會覆蓋該角色所屬模式（${(d.p && d.p.classicMode) ? '經典' : '非經典'}）的共用寵物名冊。`)){
                    restorePets = true;
                    petMsg = '\n寵物名冊已一併還原，所有寵物均為未出戰。';
                } else {
                    petMsg = '\n（寵物名冊維持原狀，未還原）';
                }
            }
            // 💎 龍之鑽石為全角色共用；只還原數量，不覆蓋目前的叫賣 NPC、遺物布告欄與冷卻資料。
            let pandoraMsg = '', restorePandoraDiamonds = false;
            if(pandoraDiamonds !== undefined){
                if(confirm(`此匯入檔包含龍之鑽石 ${pandoraDiamonds.toLocaleString()} 顆。\n是否一併還原龍之鑽石？\n⚠ 會覆蓋目前所有角色共用的龍之鑽石數量。`)){
                    restorePandoraDiamonds = true;
                    pandoraMsg = '\n龍之鑽石已一併還原。';
                } else {
                    pandoraMsg = '\n（龍之鑽石維持原狀，未還原）';
                }
            }
            let clanMsg = '', restoreClan = false;
            if(clanState !== undefined){
                if(confirm('此匯入檔包含血盟資料。\n是否一併還原血盟？\n⚠ 會覆蓋一般與經典模式的血盟、全模式共用經驗、角色貢獻與城堡狀態。')){
                    restoreClan = true;
                    clanMsg = '\n血盟資料已一併還原。';
                } else {
                    clanMsg = '\n（血盟資料維持原狀，未還原）';
                }
            }
            // 💾 角色／倉庫／寵物／龍之鑽石／血盟視為同一批匯入；失敗時回復匯入前資料。
            let roleKey = 'lineage_idle_save_' + n;
            let whRestoreKey = restoreWh ? whKey(d.p) : '';
            let petRestoreKey = restorePets ? ((typeof PET_ROSTER_KEY !== 'undefined' ? PET_ROSTER_KEY : 'fb5_pet_roster') + (typeof modeSuffix === 'function' ? modeSuffix(!!(d.p && d.p.classicMode), false) : '')) : '';
            let writes = [{ key: roleKey, value: _saveWrap(saveText) }];
            if(restoreWh){
                writes.push({ key: whRestoreKey, value: JSON.stringify(whData) });
                writes.push({ key: whRestoreKey + '_rm', value: '{}' });   // 🪦 清除舊領出墓碑，否則備份物品會再次被隱藏
            }
            if(restorePets){
                writes.push({ key: petRestoreKey, value: _saveWrap(JSON.stringify(petData)) });
                writes.push({ key: petRestoreKey + '_rm', value: _saveWrap('{}') });   // 🪦 清除舊放生墓碑，允許備份寵物合法還原
            }
            let keys = writes.map(w => w.key);
            if (restorePandoraDiamonds) keys.push('fb5_pandora_relic_market_v1');
            if (restoreClan) keys.push(CLAN_STATE_KEY);
            // 保存原始位元組，連同外部 API 寫入的桶依提交反序回滾，避免重簽／膨脹造成配額不足。
            let before = keys.map(key => ({ key: key, raw: _lsGetStrict(key) }));
            let attempted = [];
            try {
                for(let i = 0; i < writes.length; i++) {
                    attempted.push(before[i]);
                    if(!_lzSet(writes[i].key, writes[i].value)) throw new Error('write failed');
                }
                if(restorePandoraDiamonds){
                    attempted.push(before.find(entry => entry.key === 'fb5_pandora_relic_market_v1'));
                    let result = typeof window.pandoraRestoreSharedDiamonds === 'function' && window.pandoraRestoreSharedDiamonds(pandoraDiamonds);
                    if(!result || !result.ok) throw new Error('diamond restore failed');
                }
                if(restoreClan){
                    attempted.push(before.find(entry => entry.key === CLAN_STATE_KEY));
                    let result = typeof window.clanRestoreSharedState === 'function' && window.clanRestoreSharedState(clanState);
                    if(!result || !result.ok) throw new Error('clan restore failed');
                }
            } catch(e) {
                let restored = _restoreImportSnapshots(attempted);
                try { if (typeof _npcClanWarCache !== 'undefined') { delete _npcClanWarCache.normal; delete _npcClanWarCache.classic; } } catch(_) {}
                alert(restored ? '匯入失敗：寫入異常，已確認還原匯入前的角色與共用資料。' : '匯入失敗，且部分原始資料未能還原。請保留匯入檔、停止遊戲操作，先排除儲存空間或讀寫問題。');
                return;
            }
            if(restoreWh){
                try { if(typeof _whLoadUids !== 'undefined') _whLoadUids = null; if(typeof _whLoadOk !== 'undefined') _whLoadOk = true; } catch(e){}
            }
            if(restorePets){
                try {
                    if(typeof _petRoster !== 'undefined') _petRoster = [];
                    if(typeof _petRosterKey !== 'undefined') _petRosterKey = null;
                    if(typeof _petRosterDirty !== 'undefined') _petRosterDirty = false;
                    if(typeof _petReleasedUids !== 'undefined') _petReleasedUids = {};
                } catch(e){}
            }
            renderLoadSelect();   // 重新整理存檔位清單（更新名稱/等級與可載入狀態）
            let ns = slotSummary(n);
            alert(`已匯入到存檔 ${n}：${ns ? (ns.cls + ' Lv.' + ns.lv + '　' + ns.name) : '完成'}。${whMsg}${petMsg}${pandoraMsg}${clanMsg}`);
            } catch(e) {
                alert('匯入失敗：資料格式或讀取異常。' + (e && e.message ? '\n' + e.message : ''));
            }
        };
        reader.onerror = function(){ alert('匯入失敗：無法讀取選取的存檔，未寫入資料。'); };
        reader.readAsText(file);
    };
    input.click();
}
// 🗑️ v3.5.83 移除 restoreBackup／slotBackupSummary：「匯入前自動備份」機制早已改成 importSave 內的
//    記憶體 before[] 回滾（本檔 importSave），全專案不再有任何 lineage_idle_save_<n>_bak 寫入點，
//    復原按鈕也因舊 slot-select-panel 移除而無入口 → 整條救援路徑不存在。
//    loadGame 的兩則毀損提示已改為指向「重新匯入先前匯出的 .json」。
//    loadDeleteSelected 仍會清 <n>_bak 鍵，當作舊版遺留資料的清理。
const CREATION_CLASS_ANIM_FRAMES = {
    prince: [714, 798], princess: [629, 710],
    m_knight: [378, 448], f_knight: [315, 374],
    m_mage: [531, 625], f_mage: [452, 527],
    m_elf: [245, 311], f_elf: [166, 241],
    m_dark: [90, 162], f_dark: [25, 86],
    m_illusionist: [968, 1036], f_illusionist: [1039, 1125],
    m_Dknight: [841, 905], f_Dknight: [908, 965],
    m_warrior: [1992, 2076], f_warrior: [1908, 1991]
};
const LOAD_NONE_ANIM_FRAMES = [1, 24];
const LOAD_AVATAR_TO_START_KEY = {
    '王子': 'prince', '公主': 'princess',
    '男騎士': 'm_knight', '女騎士': 'f_knight',
    '男法師': 'm_mage', '女法師': 'f_mage',
    '男妖精': 'm_elf', '女妖精': 'f_elf',
    '男黑暗妖精': 'm_dark', '女黑暗妖精': 'f_dark',
    '男幻術士': 'm_illusionist', '女幻術士': 'f_illusionist',
    '男龍騎士': 'm_Dknight', '女龍騎士': 'f_Dknight',
    '男戰士': 'm_warrior', '女戰士': 'f_warrior'
};
const LOAD_CLASS_TO_START_KEY = {
    royal: 'prince', knight: 'm_knight', mage: 'm_mage', elf: 'm_elf',
    dark: 'm_dark', illusion: 'm_illusionist', dragon: 'm_Dknight', warrior: 'm_warrior'
};
let _loadSelectedSlot = 1;
let _loadPage = 0;
let _loadSlotMeta = {};   // 🔋 存檔位徽章快取（renderLoadSelect 建立）：活刷計時器只重讀輕量 checkpoint／session 名單，不重解壓整份存檔
let _loadAnimState = { key: null, frame: 0, noneFrame: LOAD_NONE_ANIM_FRAMES[0], lastAt: 0, stepMs: 92 };
let _loadLastClickSlot = 0;
let _loadLastClickAt = 0;
function loadEsc(v){
    return String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function loadStartKeyFromSummary(sum){
    if(!sum) return 'none';
    if(sum.avatar && LOAD_AVATAR_TO_START_KEY[sum.avatar]) return LOAD_AVATAR_TO_START_KEY[sum.avatar];
    return LOAD_CLASS_TO_START_KEY[sum.rawCls] || LOAD_CLASS_TO_START_KEY[sum.cls] || 'prince';
}
function loadFrameSrc(key, frame){
    if(key === 'none') return `assets/start/none/${frame}.png`;
    return `assets/start/${key}/${frame}.png`;
}
function loadFirstFrame(key){
    if(key === 'none') return LOAD_NONE_ANIM_FRAMES[0];
    const range = CREATION_CLASS_ANIM_FRAMES[key] || CREATION_CLASS_ANIM_FRAMES.prince;
    return range[0];
}
function openLoadSelect(){
    const main = document.getElementById('main-menu');
    const create = document.getElementById('creation-panel');
    const load = document.getElementById('load-select-panel');
    if(main) main.classList.add('hidden');
    if(create) create.classList.add('hidden');
    if(load) load.classList.remove('hidden');
    _loadLastClickSlot = 0; _loadLastClickAt = 0;
    _loadPage = 0;
    _loadSelectedSlot = [1,2,3,4].find(n => !!slotSummary(n)) || 1;
    renderLoadSelect();
}
function loadSetPage(page){
    _loadLastClickSlot = 0; _loadLastClickAt = 0;
    _loadPage = page === 2 ? 1 : 0;
    const start = _loadPage * 4 + 1;
    const slots = [start, start + 1, start + 2, start + 3];
    _loadSelectedSlot = slots.find(n => !!slotSummary(n)) || start;
    renderLoadSelect();
}
function loadBackToMenu(){
    const load = document.getElementById('load-select-panel');
    const main = document.getElementById('main-menu');
    _loadLastClickSlot = 0; _loadLastClickAt = 0;
    if(load) load.classList.add('hidden');
    if(main) main.classList.remove('hidden');
}

function returnToCharacterSelect(){
    if(typeof player === 'undefined' || !player || !player.cls) return false;
    _flushSaveNow();   // 🗑️ v3.7.94 原本走 js/27 的 offlinePrepareCharacterSelect（存檔＋寫離線快照）；離線掛機移除後只留最終存檔
    if (typeof resetWorldChannelSession === 'function') resetWorldChannelSession();

    if(typeof stopGameTimers === 'function') stopGameTimers();
    if(typeof state !== 'undefined' && state) state.running = false;
    try { _roleSessionForget(); } catch(e) {}
    try { if(typeof _vfxClearAll === 'function') _vfxClearAll(); } catch(e) {}

    const game = document.getElementById('game-screen');
    const creationScreen = document.getElementById('creation-screen');
    const main = document.getElementById('main-menu');
    const creation = document.getElementById('creation-panel');
    const load = document.getElementById('load-select-panel');
    if(game) game.classList.add('hidden');
    if(creationScreen) creationScreen.classList.remove('hidden');
    if(main) main.classList.add('hidden');
    if(creation) creation.classList.add('hidden');
    if(load) load.classList.remove('hidden');
    document.body.classList.remove('game-bg-dim', 'sherine-world', 'sherine-mad');

    _loadLastClickSlot = 0;
    _loadLastClickAt = 0;
    _loadPage = currentSlot > 4 ? 1 : 0;
    _loadSelectedSlot = currentSlot;
    renderLoadSelect();
    try { if(typeof _bgmTick === 'function') { _bgmScene = null; _bgmTick(); } } catch(e) {}
    return true;
}
function renderLoadSelect(){
    const grid = document.getElementById('load-slot-grid');
    if(!grid) return;
    let html = '';
    const start = _loadPage * 4 + 1;
    for(let n = start; n <= start + 3; n++){
        const sum = slotSummary(n);
        const key = loadStartKeyFromSummary(sum);
        const selected = n === _loadSelectedSlot;
        const empty = !sum;
        const frame = loadFirstFrame(key);
        _loadSlotMeta[n] = _slotBadgeMeta(n, sum);
        const title = sum ? `角色 ${n} ${sum.cls} Lv.${sum.lv}` : `角色 ${n} 空`;
        html += `<button type="button" onclick="loadSelectSlot(${n})" data-slot="${n}" data-key="${key}" class="load-slot-card ${selected ? 'selected' : ''} ${empty ? 'empty' : 'filled'}" title="${loadEsc(title)}">`
            + `<img src="${loadFrameSrc(key, frame)}" alt="${loadEsc(title)}" draggable="false">`
            + _slotBadgeHtml(_slotPartyStatusNow(_loadSlotMeta[n]))
            + `</button>`;
    }
    grid.innerHTML = html;
    const selectedSum = slotSummary(_loadSelectedSlot);
    const selectedKey = loadStartKeyFromSummary(selectedSum);
    _loadAnimState.key = selectedKey;
    _loadAnimState.frame = loadFirstFrame(selectedKey);
    _loadAnimState.lastAt = 0;
    const page1 = document.getElementById('load-page-1');
    const page2 = document.getElementById('load-page-2');
    if(page1) page1.classList.toggle('active', _loadPage === 0);
    if(page2) page2.classList.toggle('active', _loadPage === 1);
    updateLoadInfo();
}
function updateLoadInfo(){
    const sum = slotSummary(_loadSelectedSlot);
    const set = (id, text) => { const el = document.getElementById(id); if(el) el.innerText = text; };
    const base = (sum && sum.base) || {};
    const empty = !sum;
    set('load-info-name', empty ? '' : (sum.name || '未命名'));
    set('load-info-pledge', empty ? '' : ({ tros:'特羅斯', esti:'依詩蒂' }[sum.pledge] || sum.pledge || '-'));
    set('load-info-class', empty ? '' : sum.cls);
    set('load-info-alignment', empty ? '' : (sum.classic ? '經典' : '一般'));
    set('load-info-hp', empty ? '' : `${Math.floor(sum.hp || 0)} / ${Math.floor(sum.mhp || 0)}`);
    set('load-info-mp', empty ? '' : `${Math.floor(sum.mp || 0)} / ${Math.floor(sum.mmp || 0)}`);
    set('load-info-ac', empty ? '' : (sum.ac === '' ? '-' : sum.ac));
    set('load-info-lv', empty ? '' : sum.lv);
    set('load-info-str', empty ? '' : (base.str || ''));
    set('load-info-dex', empty ? '' : (base.dex || ''));
    set('load-info-con', empty ? '' : (base.con || ''));
    set('load-info-wis', empty ? '' : (base.wis || ''));
    set('load-info-cha', empty ? '' : (base.cha || ''));
    set('load-info-int', empty ? '' : (base.int || ''));
    const create = document.getElementById('load-btn-create');
    const importBtn = document.getElementById('load-btn-import');
    const enter = document.getElementById('load-btn-enter');
    const exportBtn = document.getElementById('load-btn-export');
    const del = document.getElementById('load-btn-delete');
    if(create) create.classList.toggle('hidden', !empty);
    if(importBtn) importBtn.classList.toggle('hidden', !empty);
    if(enter) enter.classList.toggle('hidden', empty);
    if(exportBtn) exportBtn.classList.toggle('hidden', empty);
    if(del) del.classList.toggle('hidden', empty);
}
function loadSelectSlot(n){
    const sum = slotSummary(n);
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const doubleClick = !!sum && _loadLastClickSlot === n && now - _loadLastClickAt <= 500;
    _loadLastClickSlot = doubleClick ? 0 : n;
    _loadLastClickAt = doubleClick ? 0 : now;
    _loadSelectedSlot = n;
    if(doubleClick){ loadEnterSelected(); return; }
    if(document.querySelector(`.load-slot-card.selected[data-slot="${n}"]`)){
        updateLoadInfo();
        return;
    }
    renderLoadSelect();
}
function loadCreateSelected(){
    const sum = slotSummary(_loadSelectedSlot);
    if(sum){ alert(`存檔 ${_loadSelectedSlot} 已有角色，請先刪除角色後再創建新角色。`); return; }
    currentSlot = _loadSelectedSlot;
    const load = document.getElementById('load-select-panel');
    if(load) load.classList.add('hidden');
    showCreation();
}
function loadEnterSelected(){
    const sum = slotSummary(_loadSelectedSlot);
    if(!sum) return;
    _loadLastClickSlot = 0; _loadLastClickAt = 0;
    currentSlot = _loadSelectedSlot;
    loadGame();
}
function loadImportSelected(){ importSave(_loadSelectedSlot); }
function loadExportSelected(){ exportSave(_loadSelectedSlot); }
function loadDeleteSelected(){
    const slot = _loadSelectedSlot, sum = slotSummary(slot);
    if(!sum){ renderLoadSelect(); return; }
    const active = _roleOtherActiveSessions();
    if(active.length){
        const names = Array.from(new Set(active.map(s => s.name || ('存檔 ' + s.slot)))).join('、');
        alert(`偵測到其他角色仍在遊戲中${names ? `（${names}）` : ''}。\n\n為避免角色、寵物與傭兵資料錯亂，請先關閉其他遊戲分頁，等待約 8 秒後再刪除。`);
        return;
    }
    const expected = sum.name || '未命名';
    const typed = prompt(`即將刪除存檔 ${slot}：${sum.cls} Lv.${sum.lv} ${expected}\n\n刪除後才能在此欄位創建新角色或匯入進度。\n請輸入角色名稱「${expected}」確認刪除：`, '');
    if(typed === null) return;
    if(typed.trim() !== expected){ alert('角色名稱不正確，已取消刪除。'); return; }
    if(_roleOtherActiveSessions().length){ alert('刪除期間偵測到其他遊戲分頁，已取消刪除。請先關閉其他角色後再試。'); return; }
    const oldPlayer = _roleReadSavePlayer(slot), fp = _roleFingerprint(oldPlayer);
    // 👑 v3.6.01 血盟盟主刪角警告（用戶拍板）：盟主刪除＝clanOnRoleDeleted 會解散該模式血盟並清空同模式所有角色的貢獻，刪前必須講明
    let _clanWarn = '';
    try { if(typeof clanIsLeaderRole === 'function' && clanIsLeaderRole(oldPlayer)) _clanWarn = '\n\n⚠ 此角色是血盟盟主：刪除後將解散該模式的血盟，並清空同模式所有角色的血盟貢獻（血盟等級經驗保留）！'; } catch(e){}
    if(!confirm(`確定永久刪除「${expected}」嗎？\n角色存檔與角色專屬傭兵資料將刪除；共享倉庫、圖鑑與寵物名冊會保留。${_clanWarn}`)) return;
    // 🛡️ 簽章不符／內容毀損的存檔位讀不出 player（fp 為空）→ 無法建立刪除保護。
    //    但這種存檔任何分頁都載入不了，也就不可能被舊分頁寫回，故直接放行刪除；
    //    否則玩家會落入「載不了也刪不掉、該欄位永久報廢」的死局。
    if(fp && !_roleMarkDeleted(fp)){ alert('無法建立刪除保護，為避免舊分頁寫回角色，本次刪除已取消。'); return; }
    try { if(typeof petReleaseSlotAssignments === 'function') petReleaseSlotAssignments(slot); } catch(e){ console.warn('pet delete cleanup', e); }
    try { if(typeof mercLedgerPurgeSlot === 'function') mercLedgerPurgeSlot(slot); } catch(e){ console.warn('merc delete cleanup', e); }
    try { if(typeof antharasForgetRoleClear === 'function') antharasForgetRoleClear(oldPlayer, slot); } catch(e){ console.warn('antharas clear cleanup', e); }
    _lsRemove('lineage_idle_save_' + slot);
    _lsRemove('lineage_idle_save_' + slot + '_bak');
    if(_lsGet('lineage_idle_save_' + slot)){ alert('角色存檔刪除失敗，請重新整理後再試。'); return; }
    try { if(typeof clanOnRoleDeleted === 'function') clanOnRoleDeleted(oldPlayer); } catch(e){ console.warn('clan delete cleanup', e); }
    renderLoadSelect();
    alert(`角色「${expected}」已刪除。現在可以在此欄位創建新角色或匯入進度。`);
}
(function animateLoadSelectPreview(){
    function tick(now){
        const panel = document.getElementById('load-select-panel');
        if(panel && !panel.classList.contains('hidden') && now - _loadAnimState.lastAt >= _loadAnimState.stepMs){
            _loadAnimState.noneFrame = _loadAnimState.noneFrame >= LOAD_NONE_ANIM_FRAMES[1] ? LOAD_NONE_ANIM_FRAMES[0] : _loadAnimState.noneFrame + 1;
            document.querySelectorAll('.load-slot-card.empty img').forEach(img => { img.src = loadFrameSrc('none', _loadAnimState.noneFrame); });
            const selected = document.querySelector('.load-slot-card.selected.filled');
            if(selected){
                const key = selected.dataset.key || 'prince';
                const range = CREATION_CLASS_ANIM_FRAMES[key] || CREATION_CLASS_ANIM_FRAMES.prince;
                if(_loadAnimState.key !== key){
                    _loadAnimState.key = key;
                    _loadAnimState.frame = range[0];
                } else {
                    _loadAnimState.frame = _loadAnimState.frame >= range[1] ? range[0] : _loadAnimState.frame + 1;
                }
                const img = selected.querySelector('img');
                if(img) img.src = loadFrameSrc(key, _loadAnimState.frame);
            }
            _loadAnimState.lastAt = now;
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
})();
let creationClassAnim = { key: 'prince', frame: 714, first: 714, last: 798, lastAt: 0, stepMs: 82, static: false };
function creationAnimKey(c){ if(!c || c === 'none') return 'none'; return c === 'm_royal' ? 'prince' : (c === 'f_royal' ? 'princess' : c); }
const CREATION_CLASS_BASE_TO_RAW = {
    royal: { m: 'm_royal', f: 'f_royal' }, knight: { m: 'm_knight', f: 'f_knight' },
    mage: { m: 'm_mage', f: 'f_mage' }, elf: { m: 'm_elf', f: 'f_elf' },
    dark: { m: 'm_dark', f: 'f_dark' }, illusionist: { m: 'm_illusionist', f: 'f_illusionist' },
    Dknight: { m: 'm_Dknight', f: 'f_Dknight' }, warrior: { m: 'm_warrior', f: 'f_warrior' }
};
let creationSelectedClassBase = null;
let creationSelectedGender = 'm';
function creationClassBaseFromRaw(raw){
    if(!raw) return null;
    if(raw.includes('royal')) return 'royal';
    if(raw.includes('Dknight')) return 'Dknight';
    if(raw.includes('illusionist')) return 'illusionist';
    if(raw.includes('dark')) return 'dark';
    if(raw.includes('knight')) return 'knight';
    if(raw.includes('mage')) return 'mage';
    if(raw.includes('elf')) return 'elf';
    if(raw.includes('warrior')) return 'warrior';
    return null;
}
function rawClassFromBaseAndGender(base, gender){
    const pair = CREATION_CLASS_BASE_TO_RAW[base] || CREATION_CLASS_BASE_TO_RAW.royal;
    return pair[gender] || pair.m;
}
function selectClassBase(base){
    creationSelectedClassBase = base;
    selectClass(rawClassFromBaseAndGender(creationSelectedClassBase, creationSelectedGender));
}
function selectGender(gender){
    creationSelectedGender = gender === 'f' ? 'f' : 'm';
    document.querySelectorAll('.creation-gender-btn').forEach(btn => btn.classList.remove('active'));
    const genderBtn = document.getElementById('btn-gender-' + creationSelectedGender);
    if(genderBtn) genderBtn.classList.add('active');
    if(creationSelectedClassBase) selectClass(rawClassFromBaseAndGender(creationSelectedClassBase, creationSelectedGender));
}
function updateCreationChoiceButtons(raw){
    creationSelectedClassBase = creationClassBaseFromRaw(raw);
    creationSelectedGender = raw.startsWith('f_') ? 'f' : 'm';
    document.querySelectorAll('.creation-class-btn,.creation-gender-btn').forEach(btn => btn.classList.remove('active'));
    const classBtn = document.getElementById('btn-class-base-' + creationSelectedClassBase);
    const genderBtn = document.getElementById('btn-gender-' + creationSelectedGender);
    if(classBtn) classBtn.classList.add('active');
    if(genderBtn) genderBtn.classList.add('active');
}
function resetCreationSelection(){
    creationSelectedClassBase = null;
    creationSelectedGender = 'm';
    curCreate.rawCls = null;
    curCreate.cls = null;
    curCreate.str = 0; curCreate.dex = 0; curCreate.con = 0; curCreate.int = 0; curCreate.wis = 0; curCreate.cha = 0;
    document.querySelectorAll('.creation-class-btn,.creation-gender-btn').forEach(btn => btn.classList.remove('active'));
    const titleEl = document.getElementById('creation-class-title');
    if(titleEl) titleEl.innerText = '選擇職業';
    const descEl = document.getElementById('class-desc');
    if(descEl) descEl.innerText = '';
    setCreationClassAnimation('none');
    updateCreateUI();
}
function setCreationClassAnimation(c){
    const key = creationAnimKey(c);
    if(key === 'none'){
        if(typeof stopCreationFrameSfx === 'function') stopCreationFrameSfx();
        creationClassAnim = { key: 'none', frame: 0, first: 0, last: 0, lastAt: 0, stepMs: 82, static: true };
        const img = document.getElementById('class-preview-img');
        if(img){
            img.src = 'assets/start/0.png';
            img.style.display = 'block';
        }
        return;
    }
    const range = CREATION_CLASS_ANIM_FRAMES[key] || CREATION_CLASS_ANIM_FRAMES.prince;
    creationClassAnim = { key, frame: range[0], first: range[0], last: range[1], lastAt: 0, stepMs: 82, static: false };
    const img = document.getElementById('class-preview-img');
    if(img){
        img.src = `assets/start/${key}/${range[0]}.png`;
        img.style.display = 'block';
    }
    if(typeof playCreationFrameSfx === 'function') playCreationFrameSfx(key, range[0]);
    for(let n = range[0]; n <= Math.min(range[1], range[0] + 10); n++){
        const pre = new Image(); pre.src = `assets/start/${key}/${n}.png`;
    }
}
(function animateCreationClassPreview(){
    function tick(now){
        const panel = document.getElementById('creation-panel');
        const img = document.getElementById('class-preview-img');
        const gs = document.getElementById('game-screen');   // 🔊 v3.4.17 已進遊戲→停創角動畫（防 creation-panel classList 殘留→動畫續跑並每 loop 重觸發創角音效）
        if(panel && img && !panel.classList.contains('hidden') && (!gs || gs.classList.contains('hidden')) && !creationClassAnim.static && now - creationClassAnim.lastAt >= creationClassAnim.stepMs){
            creationClassAnim.frame = creationClassAnim.frame >= creationClassAnim.last ? creationClassAnim.first : creationClassAnim.frame + 1;
            img.src = `assets/start/${creationClassAnim.key}/${creationClassAnim.frame}.png`;
            if(creationClassAnim.frame === creationClassAnim.first && typeof playCreationFrameSfx === 'function') playCreationFrameSfx(creationClassAnim.key, creationClassAnim.frame);
            creationClassAnim.lastAt = now;
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
})();
function showCreation() {
    const main = document.getElementById('main-menu');
    const creation = document.getElementById('creation-panel');
    const load = document.getElementById('load-select-panel');
    if(main) main.classList.add('hidden');
    if(load) load.classList.add('hidden');
    if(creation) creation.classList.remove('hidden');
    const classicToggle = document.getElementById('create-classic-toggle');
    if(classicToggle) classicToggle.checked = false;   // 刪角後同頁重創時不得沿用上一輪的經典模式勾選

    creationSelectedClassBase = 'royal';
    creationSelectedGender = 'm';
    selectClass('m_royal');
}

function backToMenu() {
    const main = document.getElementById('main-menu');
    const creation = document.getElementById('creation-panel');
    const load = document.getElementById('load-select-panel');
    if(typeof stopCreationFrameSfx === 'function') stopCreationFrameSfx();
    if(creation) creation.classList.add('hidden');
    if(load){
        if(main) main.classList.add('hidden');
        load.classList.remove('hidden');
        renderLoadSelect();
    } else {
        if(main) main.classList.remove('hidden');
    }
}

function selectClass(c) {
    curCreate.rawCls = c; // 記住玩家選的具體選項 (例如 f_knight)
    
    updateCreationChoiceButtons(c);

    setCreationClassAnimation(c);

    // 2. 判斷底層職業（⚠️ Dknight 含 'knight' 子字串，須先判斷；royal 無子字串衝突）
    if(c.includes('royal')) curCreate.cls = 'royal';   // 👑 王族
    else if(c.includes('Dknight')) curCreate.cls = 'dragon';
    else if(c.includes('illusionist')) curCreate.cls = 'illusion';
    else if(c.includes('dark')) curCreate.cls = 'dark';
    else if(c.includes('knight')) curCreate.cls = 'knight';
    else if(c.includes('mage')) curCreate.cls = 'mage';
    else if(c.includes('elf')) curCreate.cls = 'elf';
    else if(c.includes('warrior')) curCreate.cls = 'warrior';   // ⚔️ 戰士

    const titleEl = document.getElementById('creation-class-title');
    if(titleEl){
        const titleMap = { royal:'王族', knight:'騎士', mage:'法師', elf:'妖精', dark:'黑暗妖精', illusion:'幻術士', dragon:'龍騎士', warrior:'戰士' };
        titleEl.innerText = titleMap[curCreate.cls] || '角色介紹';
    }
    // 3. 更新說明文字
    const classDescMap = {
        royal: "召集成員克服險惡的苦難與逆境\n只為了建立自己國家的遠大夢想\n就能夠犧牲所有的一切，那麼你就\n具備了王族最重要的「心」。\n\n『王族』是個非常特別的職業\n在天堂世界中只有\n『王族』才能創造血盟。\n雖然王族在戰鬥的時候\n沒有任何一個職業的優點\n但是如果想在天堂世界裡\n實現自己遠大的夢想，\n那麼唯有王族才能滿足你的夢想。\n王族必須聚集擁有相同夢想的成員\n並建立屬於自己的城堡。",
        knight: "沒有什麼特別突出的才能\n只有默默地不間斷地修練，\n奮勇地擋在前端面對危險，\n就像主角一樣。\n\n騎士剛開始是以「自由騎士」\n的身份出發，並自由地到各地旅遊\n與冒險。但是騎士是個最重視\n自己要服從的王族與組織血盟\n並為他們奉獻、\n團體生活時騎士能夠表現出\n他的強大，並擁有堅忍的毅力。\n騎士是戰鬥最基本的職業，\n能夠使用多種武器與與盔甲等\n騎士強大的攻擊力及優越的防禦\n是其他職業無法比擬的\n尤其在近距離戰鬥時\n所表現出的強大戰鬥力。\n但是他們對於魔法的耐性不是很好，\n受到魔法的傷害比其他職業還高。",
        elf: "妖精擁有比人類更長的壽命\n與美麗的外貌，他們順應自然\n追求融合安定的生活\n並對所有的事情表現較為保守\n因此妖精不喜歡與人類接觸\n在『森林之母』的保護之下\n建立獨自的文化生活。\n\n妖精能夠使用的武器比騎士少\n但是他可以使用大部分的武器\n尤其可以使用遠距離攻擊的弓箭\n比其他武器擁有更多的優勢\n而且能夠使用法師的多種魔法\n可謂是個最均衡的職業。\n\n你想要以妖精的身份存活\n就必須取得妖森守護者\n『那魯帕』的協助，妖精所使用的\n物品都是透過她製造出來的。",
        mage: "將此世界的神秘現象體制地處理\n並在現實中完成這些事的人\n被人們尊稱為「賢者」\n他們利用「瑪那」的力量\n釋放出神般的偉大力量\n他們的力量甚至能夠導致世界\n的滅亡，在幻想的世界中最為突出\n成為他人最具威脅\n又最受尊崇的對象。\n\n法師優先於精神上的發展與學習\n並能使用多種魔法\n因此法師比其他職業在剛開始時\n看似非常地軟弱\n但是透過冒險逐漸成長後\n最後一定能受到所有人的肯定。\n法師在戰鬥時總是在後方\n給予成員多種的魔法協助。",
        dark: "黑暗妖精承襲妖精的敏銳與長壽\n卻選擇在陰影中磨練自己的道路。\n他們不以守護森林為使命，\n而是追求更快速、更致命的力量，\n在寂靜之中完成一次決定勝負的攻擊。\n\n黑暗妖精能夠使用匕首、雙刀、鋼爪\n與十字弓等武器，\n並以毒與閃避牽制敵人的行動。\n他們的防禦並不穩固，\n但是敏捷的身手與爆發性的殺傷力\n足以在短時間內扭轉戰局。\n\n你若想以黑暗妖精的身份生存，\n就必須習慣孤獨與危險，\n並相信藏在黑暗中的刀鋒。",
        illusion: "幻術士研究精神與幻象的力量，\n並將不可見的意志化為現實。\n他們不以強壯的肉體戰鬥，\n而是藉由奇古獸與神秘魔法\n動搖敵人的判斷，支援同伴的行動。\n\n幻術士能夠使用獨特的幻術，\n讓敵人在混亂中失去方向，\n也能以魔法強化自己與隊伍。\n在冒險剛開始時他們並不顯眼，\n但當知識與經驗累積之後，\n幻術士便能在戰場上展現\n任何人都難以忽視的影響力。\n\n若你選擇幻術士的道路，\n就必須學會看穿表象，\n並操縱他人看不見的真實。",
        dragon: "龍騎士繼承龍的血脈與戰鬥本能，\n他們相信真正的力量\n來自承受痛苦後仍向前踏出的意志。\n在戰場上，龍騎士總是以強韌的身體\n突破敵人的防線，\n並用龍之力量壓制對手。\n\n龍騎士能夠使用鎖鏈劍與龍魔法，\n以生命力換取強大的攻擊能力。\n他們的戰鬥方式比騎士更加猛烈，\n也比一般戰士更具危險性。\n只要掌握敵人的弱點，\n龍騎士便能在瞬間爆發出\n令人畏懼的破壞力。\n\n若你想成為龍騎士，\n就必須接受血脈的代價，\n並將痛楚化為勝利的力量。",
        warrior: "戰士是在無數戰場中成長的鬥士，\n他們沒有華麗的魔法，\n也不依靠血統或神秘力量，\n只憑強健的身體、沉重的武器\n以及永不退縮的意志生存。\n\n戰士能夠使用斧頭與鈍器，\n並以連續而沉重的攻擊壓迫敵人。\n他們在近距離戰鬥中擁有\n非常可靠的耐久力與破壞力，\n即使被包圍也能站在最前方\n為同伴開出前進的道路。\n\n想以戰士的身份冒險，\n就必須相信自己的雙手，\n並在每一次揮擊中證明力量。"
    };
    document.getElementById('class-desc').innerText = classDescMap[curCreate.cls] || "";
    // 🖋️ v3.2.5 排版自動適配：先重設回 CSS 預設（15px/行高1.5），若文案超出框高（overflow:hidden 會無聲裁切）則
    //    ①字級 0.5px 步進縮小（地板 11px）→ ②仍超出再微收行高（1.5 → 最低 1.2·仍優於舊版 1.1）。
    //    行高/字距為相對單位會等比縮放；面板隱藏時 clientHeight=0 → 跳過（開啟創角時 selectClassBase 會再跑一次）。
    (function () {
        let _de = document.getElementById('class-desc'); if (!_de || !_de.clientHeight) return;
        _de.style.fontSize = ''; _de.style.lineHeight = '';
        let _fs = parseFloat(getComputedStyle(_de).fontSize) || 15;
        while (_fs > 11 && _de.scrollHeight > _de.clientHeight + 1) { _fs -= 0.5; _de.style.fontSize = _fs + 'px'; }
        let _lh = 1.5;
        while (_lh > 1.2 && _de.scrollHeight > _de.clientHeight + 1) { _lh -= 0.05; _de.style.lineHeight = _lh.toFixed(2); }
    })();

    curCreate.str = 0; curCreate.dex = 0; curCreate.con = 0; curCreate.int = 0; curCreate.wis = 0; curCreate.cha = 0;
    updateCreateUI();
    if(typeof _bgmTick === 'function') _bgmTick();
}

function adjStat(s, v) {
    if(!curCreate.cls || !createBase[curCreate.cls]) return;
    let b = createBase[curCreate.cls];
    let spent = curCreate.str + curCreate.dex + curCreate.con + curCreate.int + curCreate.wis + curCreate.cha;
    let left = b.pts - spent;
    let capN = 20;   // 創角階段各屬性最高點到 20（含魅力，與其他屬性一致；之後靠升級點數突破至上限 60）
    if (v > 0 && left > 0 && (b[s] + curCreate[s]) < capN) curCreate[s]++;
    else if (v < 0 && curCreate[s] > 0) curCreate[s]--;
    updateCreateUI();
}

function updateCreateUI() {
    if(!curCreate.cls || !createBase[curCreate.cls]){
        ['str','dex','con','int','wis','cha'].forEach(s => {
            let el = document.getElementById(`c-${s}`);
            if(el) el.innerText = '';
        });
        document.getElementById('creation-pts').innerText = '';
        document.getElementById('btn-start').disabled = true;
        return;
    }
    let b = createBase[curCreate.cls];
    ['str','dex','con','int','wis','cha'].forEach(s => document.getElementById(`c-${s}`).innerText = b[s] + curCreate[s]);
    let left = b.pts - (curCreate.str + curCreate.dex + curCreate.con + curCreate.int + curCreate.wis + curCreate.cha);
    document.getElementById('creation-pts').innerText = left;
    document.getElementById('btn-start').disabled = left <= 0 ? false : true;
}

function onToggleClassic(el) {
    if (!el.checked) return;   // 取消勾選不需確認
    let ok = confirm('⚔ 經典模式（硬核挑戰）\n\n開啟後，此角色將「永久」套用下列規則，建立後無法關閉：\n\n‧ 死亡 → 損失該等級 5% 最大經驗（不會降等）\n‧ 無法進行職業精通\n‧ 無法進入「席琳的世界」\n\n確定要以「經典模式」創建此角色嗎？');   // 🎮 v3.2.9 文案精簡：移除「無法賦予裝備祝福」與「掉落率/經驗值/金幣相同」說明（用戶要求）
    if (!ok) { el.checked = false; return; }
}
function startGame() {
    if(!curCreate.cls || !curCreate.rawCls) return;
    if(slotSummary(currentSlot)){
        alert(`存檔 ${currentSlot} 已有角色，無法直接覆蓋。請返回角色選擇畫面並先刪除原角色。`);
        backToMenu();
        return;
    }
    // 🧼 v3.7.73 新角色＝乾淨的 player（修「刪角後創新職業，上一個角色的傭兵／萬能藥瓶數／精通狀態還在」）：
    //   遊戲中按「返回角色選擇」→刪角→創新角色的過程沒有重載頁面，全域 player 仍是上一個角色的物件，
    //   而本函式只逐欄覆寫其中一部分 → 未覆寫欄位被新角色整包繼承。這裡先還原成「頁面剛載入」的原型，
    //   使之與「重新整理後創角」完全等價（下方逐欄設定的流程不變）。
    _uiConfigReady = false;   // 還原期間 DOM 仍是上一角色的設定 → 禁止 saveGame 以它重建 config（與 loadGame 同一守則）
    try { if (typeof _petRosterDirty !== 'undefined' && _petRosterDirty && player && player.cls && typeof petRosterSave === 'function') petRosterSave(); } catch (e) {}   // 上一角色未寫入的寵物名冊先 flush（比照 loadGame）
    try { if (typeof _petRosterKey !== 'undefined') _petRosterKey = null; } catch (e) {}   // 失效記憶體快取→新角色重新從共用桶載入（防跨角色髒鏡像）
    if (typeof resetWorldChannelSession === 'function') resetWorldChannelSession();
    if (typeof freshPlayerState === 'function') player = freshPlayerState();
    if (typeof freshMapState === 'function') mapState = freshMapState();
    if(typeof stopCreationFrameSfx === 'function') stopCreationFrameSfx();
    // 🔊 v3.4.17 進遊戲：隱藏 creation-panel（原本只隱藏 creation-screen 父層·子面板 classList 無 .hidden 殘留）＋停創角動畫。
    //    否則 _bgmIsCreateScreen()(js/17) 與創角逐幀動畫 tick(下方 animateCreationClassPreview) 都看 creation-panel→誤判「還在創角」→登入/創角 BGM 一直播、創角音效每 loop 重觸發。
    { let _cp = document.getElementById('creation-panel'); if(_cp) _cp.classList.add('hidden'); }
    creationClassAnim.static = true;   // 立即停創角動畫迴圈（免離開畫面仍每幀更新 img＋每 loop 重觸發 SFX）
    document.getElementById('creation-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.body.classList.add('game-bg-dim');   // 正式遊戲後：背景淡化
    if (typeof mercLedgerPurgeSlot === 'function') { try { mercLedgerPurgeSlot(currentSlot); } catch (e) {} }   // 🩹 v3.0.108 新角色覆蓋此存檔位→清除前一個角色的待領傭兵經驗（新角色不繼承）
    if (typeof petReleaseSlotAssignments === 'function') { try { petReleaseSlotAssignments(currentSlot); } catch (e) { console.warn('pet slot ownership cleanup', e); } }   // 🐾 覆蓋角色時，舊角色出戰寵物回保管，避免卡在不存在的角色名下
    
    const avatarMap = {
        'm_royal': '王子', 'f_royal': '公主',
        'm_knight': '男騎士', 'f_knight': '女騎士',
        'm_mage': '男法師', 'f_mage': '女法師',
        'm_elf': '男妖精', 'f_elf': '女妖精',
        'm_dark': '男黑暗妖精', 'f_dark': '女黑暗妖精',
        'm_illusionist': '男幻術士', 'f_illusionist': '女幻術士',
        'm_Dknight': '男龍騎士', 'f_Dknight': '女龍騎士',
        'm_warrior': '男戰士', 'f_warrior': '女戰士'
    };
    player.avatar = avatarMap[curCreate.rawCls] || '男騎士';
    player.cls = curCreate.cls;
    player.bloodPledge = null;   // 血盟改由同模式王族花費金幣創立，不再於創角時自動加入。
    player.classicMode = !!(document.getElementById('create-classic-toggle') && document.getElementById('create-classic-toggle').checked);   // 🎮 經典模式：依創角開關決定（此角色永久生效）；🏛️v3.0.83 傳統模式已取消（traditionalMode 由 SAVE_DEFAULTS 恆 false）
    player.name = null;   // 預設未取名，狀態欄顯示「點擊取名」，玩家可點擊命名
    player.enSeed = 'es' + uid() + uid();   // 🎲 強化決定論種子（創角產生一次、存進存檔永久固定）：讓強化成敗由種子決定、不可用 save/load 刷
    player._roleEpoch = _roleEpoch();        // 🛡️ 角色世代：刪除後舊分頁不得把同欄位的舊角色寫回
    if (typeof clanSyncCurrentPlayer === 'function') clanSyncCurrentPlayer();   // 同模式已有血盟時，新角色自動成為成員。
    player.expMigV = 3;   // ⚠️ 新角色天生使用最新經驗刻度（Lv70+ 同級怪等比例曲線）→ 標記免遷移

    let b = createBase[curCreate.cls];
    player.base = { str: b.str+curCreate.str, dex: b.dex+curCreate.dex, con: b.con+curCreate.con, int: b.int+curCreate.int, wis: b.wis+curCreate.wis, cha: b.cha+curCreate.cha };
    player.lv = 1; player.exp = 0; player.gold = 1000;
    player.inv = []; player.eq = { wpn: null, helm: null, armor: null, shield: null, cloak: null, tshirt: null, gloves: null, boots: null, ring1: null, ring2: null, ring3: null, ring4: null, amulet: null, ear1: null, ear2: null, belt: null, rem_claw: null, rem_eye: null, rem_blood: null, rem_flesh: null, rem_heart: null, rem_bone: null, rem_fang: null, rem_scale: null }; player.junkPrefs = {};   // 🦴 v3.1.68 席琳遺骸 8 欄（舊存檔缺鍵無害：undefined 視同空·裝備時動態建鍵）
    player.skills = [];
    player.summon = null; player.charmed = null; player.manualCd = {}; player.hots = {}; player.elfEle = null; player.buffs = { haste: 0, brave: 0, blue: 0, cautious: 0, elfcookie: 0, poly: 0, shield: 0 };   // 🔧 v3.5.94 移除零讀取的舊制孤兒欄位 hot(單數)；團隊 HoT 休眠機制狀態一律存 hots(複數 dict)
    
    resetConfigDomToDefaults();   // 🧼 v3.7.73 設定面板還原為預設：原本只清下面 7 個勾選框，藥水/施法門檻(HP%、MP%)、技能下拉與其餘勾選會被新角色繼承
    ['set-haste', 'set-brave', 'set-blue', 'set-cautious', 'set-poly', 'set-auto-buy-pot', 'set-auto-buy-arrow'].forEach(id => {
        let el = document.getElementById(id);
        if(el) el.checked = false;   // 這 7 項維持「新角色一律關閉」（set-auto-buy-arrow 的 HTML 預設為勾選，但新角色刻意不開）
    });

    // 依據不同職業配發專屬起始道具
    if (player.cls === 'elf') {
        gainItem('wpn_shortbow', 1, true, true);  // 短弓
        gainItem('arm_74', 1, true, true);        // 木製的夾克
        gainItem('wpn_5', 1000, true, true);      // 箭 x 1000
        gainItem('wpn_11', 1, true, true);        // 匕首 (放背包)
        gainItem('potion_heal', 100, true, true); // 紅色藥水 x 100
    } else if (player.cls === 'dark') {
        gainItem('wpn_11', 1, true, true);        // 🔧 匕首（黑暗妖精起始武器，非歐西斯匕首）
        gainItem('amr_jacket', 1, true, true);    // 皮夾克
        gainItem('potion_heal', 100, true, true); // 紅色藥水 x 100
    } else if (player.cls === 'illusion') {
        gainItem('wpn_10', 1, true, true);        // 🔧 木棒（幻術士起始武器）
        gainItem('amr_jacket', 1, true, true);    // 皮夾克
        gainItem('potion_heal', 100, true, true); // 紅色藥水 x 100
    } else if (player.cls === 'dragon') {
        gainItem('wpn_10', 1, true, true);        // 🐉 木棒（龍騎士起始武器）
        gainItem('amr_jacket', 1, true, true);    // 皮夾克
        gainItem('potion_heal', 100, true, true); // 治癒藥水 x 100
    } else if (player.cls === 'warrior') {
        gainItem('wpn_1', 1, true, true);         // ⚔️ 斧（戰士起始武器）
        gainItem('amr_jacket', 1, true, true);    // 皮夾克
        gainItem('potion_heal', 100, true, true); // 治癒藥水 x 100
    } else if (player.cls === 'royal') {
        gainItem('wpn_11', 1, true, true);        // 👑 匕首（王族起始武器）
        gainItem('amr_jacket', 1, true, true);    // 皮夾克
        gainItem('potion_heal', 100, true, true); // 治癒藥水 x 100
    } else {
        gainItem('wpn_11', 1, true, true);        // 匕首（騎士、法師起始武器）
        gainItem('amr_jacket', 1, true, true);    // 皮夾克
        gainItem('potion_heal', 100, true, true); // 紅色藥水 x 100
        if(player.cls === 'mage') {
            gainItem('bk_lightarrow', 1, true, true); // 光箭魔法書
        }
    }
    if (typeof loadSharedCollections === 'function') loadSharedCollections();   // 🎴🗡️🧰 創角：載入同模式共用收集圖鑑（新角色即承接同模式既有收集）
    if (typeof ensureCardBook === 'function') ensureCardBook();   // 🎴 怪物收集冊改由「收藏」面板開啟（移除道具欄本體）
    if (typeof ensureEquipBook === 'function') ensureEquipBook();   // 🗡️ 裝備收集冊改由「收藏」面板開啟＋登錄起始裝備
    if (typeof ensureMiscDex === 'function') ensureMiscDex();   // 🧰 道具收集冊：登錄起始道具
    if (typeof ensureRelicDex === 'function') ensureRelicDex();   // 🏺 遺物收集冊：登錄起始遺物

    calcStats();
    player.hp = player.mhp; player.mp = player.mmp;
    
    // 依據不同職業自動穿上對應裝備
    if (player.cls === 'elf') {
        equipItem(player.inv.find(i=>i.id==='wpn_shortbow'));
        equipItem(player.inv.find(i=>i.id==='arm_74'));
    } else if (player.cls === 'dark') {
        equipItem(player.inv.find(i=>i.id==='wpn_11'));        // 🔧 匕首
        equipItem(player.inv.find(i=>i.id==='amr_jacket'));
    } else if (player.cls === 'illusion') {
        equipItem(player.inv.find(i=>i.id==='wpn_10'));        // 🔧 木棒
        equipItem(player.inv.find(i=>i.id==='amr_jacket'));
    } else if (player.cls === 'dragon') {
        equipItem(player.inv.find(i=>i.id==='wpn_10'));        // 🐉 木棒
        equipItem(player.inv.find(i=>i.id==='amr_jacket'));
    } else if (player.cls === 'warrior') {
        equipItem(player.inv.find(i=>i.id==='wpn_1'));         // ⚔️ 斧
        equipItem(player.inv.find(i=>i.id==='amr_jacket'));
    } else if (player.cls === 'royal') {
        equipItem(player.inv.find(i=>i.id==='wpn_11'));        // 👑 匕首
        equipItem(player.inv.find(i=>i.id==='amr_jacket'));
    } else {
        equipItem(player.inv.find(i=>i.id==='wpn_11'));        // 匕首（騎士、法師）
        equipItem(player.inv.find(i=>i.id==='amr_jacket'));
    }
    
    updateClassPotionRows();
    renderSkillSelects();
    
    // 👇 正確的新版起點邏輯
    let startMap = 'town_silver_knight';
    if (player.cls === 'mage') startMap = 'town_talking';
    else if (player.cls === 'elf') startMap = 'town_elf';
    else if (player.cls === 'dark') startMap = 'town_silent';
    else if (player.cls === 'illusion') startMap = 'town_hyperia';
    else if (player.cls === 'dragon') startMap = 'town_behemoth';
    else if (player.cls === 'warrior') startMap = 'town_heine';   // ⚔️ 戰士：海音
    else if (player.cls === 'royal') startMap = 'town_talking';   // 👑 王族：說話之島

    setMapSelectors(startMap);
    _uiConfigReady = true;   // 🛡️ 審計#1：新角色 UI 已重設為預設（563 行）＝當下 DOM 即正確 config
    changeMap(true);

    state.running = true;
    _roleSessionHeartbeat();   // 立即登記，不等待第一個 2 秒心跳，避免剛進遊戲就被另一分頁刪除
    state.ticks = 0;   // 🔧 新角色從 0 tick 開始（避免承接前一場的計時）
    applySherineTheme();   // 🔮 新角色預設關閉席琳的世界，重置視覺主題
    startGameTimers();
    logSys(`===== 歡迎來到天堂放置冒險 =====`);
    if (typeof applyGlobalAutoSellSettings === 'function') applyGlobalAutoSellSettings();   // 🔧 v2.6.91 功能5：新角色套用全域自動販賣設定（若已啟用共用）
    saveGame();   // 🔧 創角完成立即存檔：先前要等 5 分鐘自動存檔，期間關閉頁面角色會直接消失
}

// 🧼 v3.7.73 自動化設定面板的「頁面載入預設值」快照＋還原（新角色專用）。
//   不還原的話：saveGame 會用「上一個角色留在畫面上的設定」重建新角色的 player.config
//   （藥水種類/HP%、攻擊技與 MP%、治癒技與 HP%、消耗HP技能門檻、各卷軸勾選…）。
//   於本檔求值當下擷取——index.html 的設定面板 markup 在 <script> 標籤之前，此時取到的就是 HTML 預設值。
const CONFIG_DOM_IDS = ['set-pot', 'set-hp-pot', 'set-auto-buy-pot', 'set-mp-atk', 'sel-atk-skill', 'set-mp-heal', 'sel-heal-skill',
    'set-hp-skill', 'set-hp-convert', 'sel-convert-skill', 'set-haste', 'set-brave', 'set-blue', 'set-cautious',
    'set-elfcookie', 'set-poly', 'set-magicbarrier', 'set-teleport', 'set-auto-buy-arrow'];
const CONFIG_DOM_DEFAULTS = (function () {
    let d = {};
    try { CONFIG_DOM_IDS.forEach(id => { let el = document.getElementById(id); if (el) d[id] = (el.type === 'checkbox') ? el.checked : el.value; }); } catch (e) {}
    return d;
})();
function resetConfigDomToDefaults() {
    CONFIG_DOM_IDS.forEach(id => {
        let el = document.getElementById(id);
        if (!el || CONFIG_DOM_DEFAULTS[id] === undefined) return;
        if (el.type === 'checkbox') el.checked = CONFIG_DOM_DEFAULTS[id]; else el.value = CONFIG_DOM_DEFAULTS[id];
    });
    // 藥水下拉的文字顏色由 onchange 維護，程式化賦值不會觸發 → 比照 loadGame 自行補上
    let ps = document.getElementById('set-pot');
    if (ps) {
        ps.classList.remove('text-red-300', 'text-orange-300', 'text-white');
        ps.classList.add(ps.value === 'potion_heal' ? 'text-red-300' : (ps.value === 'potion_strong' ? 'text-orange-300' : 'text-white'));
    }
    // 動態產生的法術 Buff 勾選列（上一角色的技能）：全部取消；新角色的清單稍後由 renderSkillSelects 重建
    try { document.querySelectorAll('#auto-buff-skills input[type="checkbox"]').forEach(c => { c.checked = false; }); } catch (e) {}
}
function updateClassPotionRows() {
    // 勇敢藥水：騎士／龍騎士限定；慎重藥水：法師／幻術士限定；精靈餅乾：妖精限定
    let braveRow = document.getElementById('ui-brave-row');
    let cautiousRow = document.getElementById('ui-cautious-row');
    let elfRow = document.getElementById('ui-elfcookie-row');
    if(braveRow) braveRow.classList.toggle('hidden', player.cls !== 'knight' && player.cls !== 'dragon' && player.cls !== 'warrior' && player.cls !== 'royal');
    if(cautiousRow) cautiousRow.classList.toggle('hidden', player.cls !== 'mage' && player.cls !== 'illusion');
    if(elfRow) elfRow.classList.toggle('hidden', player.cls !== 'elf');
}

// 🛡️ v2.6.69 修（審計#1）：UI「自動化設定」是否已與目前角色同步完成。
//    loadGame 途中（config 還原在尾端）觸發的 saveGame（如進村領取傭兵經驗）若照舊以「當下 DOM」重建 player.config，
//    會把靜態預設 UI 寫進存檔、永久洗掉玩家全部自動化設定。未就緒時保留既有 player.config 原樣入檔。
let _uiConfigReady = false;
let _saveFailureNotified = false;
function normalizeFacingRefsForSave() {
    if(!player) return;
    if(player._faceTgt) {
        if(player._faceTgt.uid != null) player._faceTgtUid = player._faceTgt.uid;
        delete player._faceTgt;
    }
    (player.allies || []).forEach(a => {
        if(a && a._faceTgt) {
            if(a._faceTgt.uid != null) a._faceTgtUid = a._faceTgt.uid;
            delete a._faceTgt;
        }
    });
    ((mapState && mapState.mobs) || []).forEach(m => {
        if(!m || !m._faceTgt) return;
        if(m._faceTgt === player) m._facePartyKey = 'P';
        else if(m._faceTgt._slot != null) m._facePartyKey = 'A:' + String(m._faceTgt._slot);
        delete m._faceTgt;
    });
}
function saveStateJson() {
    normalizeFacingRefsForSave();
    // Facing references are normalized above. Avoid a replacer callback for every field in
    // the save, which becomes noticeably expensive for large inventories and companion data.
    // 戰鬥暫存僅從存檔副本排除；存檔成功或失敗都不改動當前仇恨、嘲諷、召喚與護衛。
    let savedPlayer = { ...player };
    if (player.summonsV2 && player.summonsV2.length) savedPlayer.summonsV2 = [];
    if (player.guardsV2 && player.guardsV2.length) savedPlayer.guardsV2 = [];
    let savedMap = { ...mapState, mobs: ((mapState && mapState.mobs) || []).map(m => {
        if (!m) return m;
        let savedMob = { ...m };
        delete savedMob._threat;
        delete savedMob._threatT;
        delete savedMob._ironGuardTaunt;
        return savedMob;
    }) };
    return JSON.stringify({ v: SAVE_VERSION, p: savedPlayer, ms: savedMap, ticks: state.ticks });
}
// 🤝 v3.8.2 受僱中角色「經驗只增不減」防護（用戶指定）：擔任傭兵的角色被鎖在安全區、無法自行掛機打怪，
//    其存檔經驗的唯一來源＝待領帳本領取（additive）。若另一情境（別分頁／先前一次領取）已把「磁碟上的」
//    經驗墊高，本情境用較舊的記憶體快照存回會覆蓋掉墊高的經驗＝待領經驗遺失。對策：存檔序列化前，
//    若「目前正擔任傭兵（mercRoleSafeAreaOnly·2 秒快取）」且磁碟等級/經驗高於記憶體 → 吸收磁碟較高值，
//    保證存回只增不減（不以舊經驗覆蓋主玩家攜帶存回的經驗）。非受僱角色不受影響（閘門快取 false 直接早退）。
function _mercMonotonicExpGuard() {
    try {
        if (typeof mercRoleSafeAreaOnly !== 'function' || !mercRoleSafeAreaOnly()) return;   // 只在「受僱中·被鎖安全區·無法外掛」時啟用
        if (!player || !player.cls || typeof currentSlot === 'undefined' || currentSlot == null) return;
        let stored = _saveUnwrap(_lzGet('lineage_idle_save_' + currentSlot));
        if (stored.signed && !stored.ok) return;                                  // 磁碟簽章壞 → 不冒險比對
        let raw = stored.payload; if (!raw) return;
        let dp = JSON.parse(raw).p; if (!dp || dp.cls !== player.cls) return;      // 不同職業＝別的角色（同位重創）→ 不吸收
        if (player.enSeed && dp.enSeed && player.enSeed !== dp.enSeed) return;     // enSeed 不符＝別的角色 → 不吸收
        let dLv = Math.floor(dp.lv || 1), dExp = Math.floor(dp.exp || 0);
        let mLv = Math.floor(player.lv || 1), mExp = Math.floor(player.exp || 0);
        if (!((dLv > mLv) || (dLv === mLv && dExp > mExp))) return;                // 磁碟不比記憶體高 → 照常存回（含記憶體剛領取到的較高值）
        player.lv = dLv; player.exp = dExp;
        if (typeof dp.bonus === 'number') player.bonus = Math.max(Math.floor(player.bonus || 0), Math.floor(dp.bonus));   // 配點點數不倒退
        if (dLv !== mLv && typeof calcStats === 'function') { try { calcStats(); } catch (e) {} }   // 升級 → 重算 HP/MP 上限
        try { logSys(`<span class="text-emerald-300">受僱中偵測到存檔經驗較新（Lv.${dLv}），已保留較高進度、不以舊經驗覆蓋。</span>`); } catch (e) {}
    } catch (e) {}
}
// 製作／卡片交易在同一個同步事件中執行；畫面與成功訊息於持久化完成後才發布。
function _deferItemTransactionEffect(fn, args, repeat) {
    if (typeof _itemTransaction === 'undefined' || !_itemTransaction) return false;
    let call = { fn: fn, args: Array.from(args || []) };
    if (repeat) _itemTransaction.effects.push(call);
    else _itemTransaction.renders.set(fn, call);
    return true;
}
function _itemTransactionAbort(message) {
    let error = new Error(message || 'Item transaction cancelled');
    if (_itemTransaction) _itemTransaction.error = error;
    throw error;
}
function _itemTransactionCount(value) {
    let count = value === undefined ? 1 : value;
    if (!Number.isSafeInteger(count) || count <= 0) _itemTransactionAbort('物品數量無法安全計算');
    return count;
}
// 記錄原物件及原欄位，回復時保留 uid 物件、裝備引用與循環引用的身分。
// 僅複製可變欄位表，不做 JSON 深拷貝，不把 DOM 或原型物件納入。
function _snapshotItemTransactionObjects(roots) {
    let seen = new Set(), snapshots = [];
    function visit(value) {
        if (!value || typeof value !== 'object' || seen.has(value)) return;
        let proto = Object.getPrototypeOf(value);
        if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) return;
        seen.add(value);
        let fields = Object.entries(value);
        snapshots.push({ value: value, fields: fields, length: Array.isArray(value) ? value.length : null });
        for (let entry of fields) visit(entry[1]);
    }
    roots.forEach(visit);
    return function restore() {
        for (let entry of snapshots) {
            let keys = new Set(entry.fields.map(pair => pair[0]));
            for (let key of Object.keys(entry.value)) if (!keys.has(key)) delete entry.value[key];
            for (let pair of entry.fields) entry.value[pair[0]] = pair[1];
            if (entry.length !== null) entry.value.length = entry.length;
        }
    };
}
function runItemTransaction(label, action) {
    if (_itemTransaction) return action();
    if (!_itemTransactionLockHeld) return _withItemTransactionLock(() => runItemTransaction(label, action), label);
    if (!player || !player.cls || player.dead) return false;
    let tx = { pending: new Map(), before: new Map(), error: null, effects: [], renders: new Map(), saveRequested: false };
    let restore = _snapshotItemTransactionObjects([player, mapState, _audit, MISC_ITEM_CAT, MISC_CAT_ITEMS]);
    let flags = [_craftBlessCount, _lockMergeOff, _tradLootCtx, _noAffixCtx, _forceBless, _forceSherineSet, _vfxLootCtx];
    let result, completed = false;
    _itemTransaction = tx;
    _vfxLootCtx = false;
    try {
        if (_itemTransactionStorageBlocked) _itemTransactionAbort('儲存資料尚待復原');
        let storedRaw = _lzGetStrict('lineage_idle_save_' + currentSlot);
        if (storedRaw != null) {
            let stored = _saveUnwrap(storedRaw);
            if (stored.signed && !stored.ok) _itemTransactionAbort('角色存檔校驗失敗');
            let data = JSON.parse(stored.payload);
            if (!data || !data.p || typeof data.p !== 'object' || Array.isArray(data.p) || !data.p.cls)
                _itemTransactionAbort('角色存檔無法完整讀取');
        }
        // 同時將角色身分讀取納入衝突檢查；不能對已刪除或已換人的存檔位扣料。
        if (!_roleSaveAllowed()) _itemTransactionAbort('角色存檔位已變更');
        // 合法舊存檔的缺省數量為 1；統一後再計算材料池，避免 undefined/字串參與加減。
        for (let item of player.inv) item.cnt = _itemTransactionCount(item.cnt);
        if (typeof _lkInvalidateWhCache === 'function') _lkInvalidateWhCache();
        result = action();
        if (tx.error) throw tx.error;
        if (tx.saveRequested || tx.pending.size) {
            if (typeof sanitizeState === 'function') sanitizeState();
            _mercMonotonicExpGuard();
            // 這些操作不改寵物名冊，直接保存角色，避免 saveGame 的寵物第二階段另開交易。
            if (!_lzSet('lineage_idle_save_' + currentSlot, _saveWrap(saveStateJson())))
                _itemTransactionAbort('角色存檔準備失敗');
        }
        if (tx.error) throw tx.error;
        _itemTransaction = null;
        if (!_commitItemTransaction(tx)) throw tx.error || new Error('儲存失敗或資料已被其他視窗更新');
        completed = true;
    } catch (e) {
        restore();
        try { console.error('[item transaction] ' + label, e); } catch (_) {}
    } finally {
        _itemTransaction = null;
        [_craftBlessCount, _lockMergeOff, _tradLootCtx, _noAffixCtx, _forceBless, _forceSherineSet, _vfxLootCtx] = flags;
        if (typeof resetCatchupGainItemIndex === 'function') resetCatchupGainItemIndex();
        if (typeof _lkInvalidateWhCache === 'function') _lkInvalidateWhCache();
        // 暫存的倉庫物件不能被後續操作當成已提交快照。
        _whLastSnapshot = null; _whLoadUids = null;
    }
    if (!completed) {
        logSys('<span class="text-red-400 font-bold">' + label + '已取消：資料未能完整儲存，材料與獎勵已回復。請排除儲存問題後再試。</span>');
        if (typeof _itemTransactionStorageBlocked !== 'undefined' && _itemTransactionStorageBlocked)
            logSys('<span class="text-red-400 font-bold">儲存裝置尚未完成回復，已保留復原紀錄並暫停寫入；請修復儲存問題後重新開啟遊戲。</span>');
        return false;
    }
    // UI 例外不能把已落盤的成功交易重新當成失敗、再退還材料。
    for (let call of tx.effects.concat(Array.from(tx.renders.values()))) {
        try { call.fn.apply(null, call.args); } catch (e) { console.error('[item transaction UI]', e); }
    }
    return result === undefined ? true : result;
}

function saveGame() {
    if (typeof _itemTransaction !== 'undefined' && _itemTransaction) { _itemTransaction.saveRequested = true; return true; }
    // 死亡狀態不寫檔：避免把 player.dead=true 存進去，導致下次讀檔卡在死亡狀態而不出怪。
    // 死亡期間沒有可保存的進度，保留上一份「存活」存檔即可。
    if (player && player.dead) return false;
    // 🛡️ v3.3.14 防「空殼玩家覆蓋既有存檔」資料遺失：標題／載入畫面的 player 是 cls:null 的空殼（尚未載入/創建角色）。
    //    5 分鐘自動存檔計時器（startGameTimers）在「返回主選單」後不會被清除、beforeunload／寵物名冊 dirty 也可能觸發 saveGame，
    //    這些背景觸發會把空殼 player 寫進 currentSlot（預設 1）→ 毀掉該格真正的角色（顯示為 null／Lv.1／預設王族／資料不完整）。
    //    無 cls＝不是進行中的遊戲角色 → 一律拒寫，確保空殼永遠不覆蓋既有存檔。（真正的角色必有職業；創角於選職業後才 saveGame，不受影響。）
    if (!player || !player.cls) return false;
    // ⏩ v3.7.30 補跑存檔延後（接上 v3.7.25 就設計好但漏接線的 deferCatchupSave）：真補跑會殺 BOSS（v3.7.24），
    //    killMob 的頭目存檔點每殺必全量存檔（sanitize＋LZ＋寫入）拖慢補跑並造成卡頓尖峰；
    //    補跑期間一律改記 _ffSavePending，還清後由 gameLoop 收尾的 takeCatchupSaveRequest 統一補存一次。
    if (typeof catchupActive === 'function' && catchupActive() && typeof deferCatchupSave === 'function'
        && !(typeof window !== 'undefined' && window.__fb5CloseFlush)) return deferCatchupSave();   // 🔚 v3.7.31 __fb5CloseFlush＝關頁/切背景的最終存檔（_flushSaveNow）不延後

    if (!_roleSaveAllowed()) {
        if(!_saveFailureNotified && typeof logSys === 'function') {
            _saveFailureNotified = true;
            logSys('<span class="text-red-400 font-bold">⚠ 此角色已被刪除或存檔位已更換角色，本分頁已停止寫入。請關閉此分頁。</span>');
        }
        return false;
    }
    try {
    if (typeof sanitizeState === 'function') sanitizeState();   // 🛡️ 寫檔前合理性夾擠：把 runtime(Console)改出的不可能數值夾回合法範圍，連同簽章一起固化、不讓作弊值被存檔/匯出
    // 收集目前的自動化設定 UI 狀態（🛡️ 僅在 UI 已同步時重建；否則沿用記憶體中既有 config）
    if (_uiConfigReady) {
    player.config = {
        setPot: document.getElementById('set-pot').value,
        setHpPot: document.getElementById('set-hp-pot').value,
        setAutoBuyPot: document.getElementById('set-auto-buy-pot').checked,
        selAtkSkill: document.getElementById('sel-atk-skill').value,
        setMpAtk: document.getElementById('set-mp-atk').value,
        selHealSkill: document.getElementById('sel-heal-skill').value,
        setMpHeal: document.getElementById('set-mp-heal').value,
        selConvertSkill: document.getElementById('sel-convert-skill') ? document.getElementById('sel-convert-skill').value : '',
        setHpConvert: document.getElementById('set-hp-convert') ? document.getElementById('set-hp-convert').value : '',
        setHpSkill: document.getElementById('set-hp-skill') ? document.getElementById('set-hp-skill').value : '',
        setHaste: document.getElementById('set-haste').checked,
        setBrave: document.getElementById('set-brave').checked,
        setBlue: document.getElementById('set-blue').checked,
        setCautious: document.getElementById('set-cautious').checked,
        setElfcookie: document.getElementById('set-elfcookie').checked,
        setPoly: document.getElementById('set-poly').checked,
        setMagicbarrier: document.getElementById('set-magicbarrier').checked,
        setTeleport: document.getElementById('set-teleport').checked,
        setAutoBuyArrow: document.getElementById('set-auto-buy-arrow').checked,   // 🧪 v3.3.15 各藥水/卷軸「自動購買」已併入「自動使用」→移除獨立收集；弓箭自動購買維持
        autoBuffSkills: {} // 用來儲存動態生成的法術 Buff
    };
    
    // 收集所有法術 Buff 勾選框的狀態
    player.skills.forEach(sid => {
        let chk = document.getElementById(`auto-sk-${sid}`);
        if (chk) player.config.autoBuffSkills[sid] = chk.checked;
    });
    }   // ← _uiConfigReady 閘（審計#1）

    _mercMonotonicExpGuard();   // 🤝 v3.8.2 受僱中經驗只增不減：序列化前吸收磁碟較高的等級/經驗，防舊快照覆蓋待領帳本領取的經驗
    if(!_lzSet('lineage_idle_save_' + currentSlot, _saveWrap(saveStateJson()))) throw new Error('persistent storage write failed');   // 🔧 寫入成功才回報；並由 saveStateJson 排除戰鬥面向暫存參照
    if(typeof petRosterSave === 'function' && !petRosterSave()) throw new Error('pet roster write failed');
    logSys(`遊戲進度已儲存。`);
    _saveFailureNotified = false;
    return true;
    } catch(e) {
        try { console.error('[saveGame] failed', e); } catch(_e) {}
        if(!_saveFailureNotified && typeof logSys === 'function') {
            _saveFailureNotified = true;
            // ⚠️ v3.5.92 原文案宣稱「倉庫存取將暫停」＝不存在的機制（唯一的倉庫暫停在 js/12 loadWarehouse 讀取失敗處，
            //    與存檔失敗無關）。寵物上限回滾會走到這裡並在下一拍補存成功，玩家等於被假警報趕去重新整理。
            logSys('<span class="text-red-400 font-bold">⚠ 遊戲進度儲存失敗，本次進度未寫入。請重新整理後再試；若反覆失敗，請先用「匯出進度」備份存檔。</span>');
        }
        return false;
    }
}

// 合併同一性物品堆疊（相容舊存檔：修復前被拆分的相同卷軸/物品會重新合併）。
// 僅合併未強化(en===0)的物品；強化品(+N)維持獨立。
// 🔒 v3.6.57 鎖定狀態改為「同一性的一部分」：鎖定疊與未鎖定疊各自成堆、載入時不再互相吸收。
//    原本是「合併後只要任一原堆疊鎖定就整疊鎖定」，等於每次載入都把 gainItem 刻意分開的兩疊(v3.5.84)
//    重新黏回去，並讓新獲得的同名物品連帶變成鎖定 → 製作/任務扣料會跳過它們（「看得到卻扣不到」）。
// 🏺 巨靈的三個願望(gw)每只戒指的願望各自獨立，永不合併（sameItemSig 不含 gw，須顯式排除）。
function consolidateInventory() {
    if (!player.inv) return;
    let seen = {};
    let out = [];
    player.inv.forEach(it => {
        if (it.gw) { out.push(it); return; }                // 巨靈願望戒指：逐只獨立
        let key = itemSig(it);   // 🔧 架構#3：統一簽章（祝福/詛咒/遠古變體/屬性/en 全部入鍵；不同來源不分堆）
        // 🔒 v3.6.92 鎖定狀態不再入鍵（取代 v3.6.57 的 `|lock` 分堆）：同簽章一律併成一格，任一方鎖定→整疊鎖定。
        //    這是「再次獲得直接合併同一格」的收尾——舊存檔留下的「鎖定一疊＋未鎖定一疊」載入時自動歸併，
        //    製作遞迴留下的中間物殘量（js/14 _lockMergeOff）也在此併回鎖定疊。
        if (seen[key]) {
            let base = seen[key];
            base.cnt += (it.cnt || 1);
            if (it.lock) base.lock = true;   // 任一來源鎖定→合併後維持保護（下方 forEach 會一併清掉 junk）
        } else {
            seen[key] = it;
            out.push(it);
        }
    });
    out.forEach(it => { if (it.lock) it.junk = false; });   // 鎖定的堆疊不視為廢品
    player.inv = out;
}

// 🧹 v3.2.62 清除「已停用的舊版物品」：功能被移除後連 DB.items 定義都刪掉的孤兒物品（如舊版進化果實/肉/哨子）
//   ——渲染時被 `if(!DB.items[id])` 守衛跳過（看不到卻仍佔背包格＋脹存檔）、無價格無法販售、無 eff/type 無法使用。
//   載入時自動從「背包＋共用倉庫」移除並彙總一則訊息。⚠️保留舊項圈 ID（由 petMigrateLegacy 轉為寵物·勿當孤兒刪）。
//   倉庫僅在「讀取成功」時寫回（沿用 saveWarehouse 的 _whLoadOk 防護·不覆蓋救得回的位元組）。
function purgeOrphanItems(warehouse) {
    try {
        if (!player || typeof DB === 'undefined' || !DB.items) return 0;
        let _keepCollar = (typeof _PET_LEGACY_COLLARS !== 'undefined') ? _PET_LEGACY_COLLARS : {};
        let isOrphan = (id) => id != null && !DB.items[id] && !_keepCollar[id];
        let removed = 0;
        if (Array.isArray(player.inv)) {
            let before = player.inv.length;
            player.inv = player.inv.filter(i => i && !isOrphan(i.id));
            removed += before - player.inv.length;
        }
        try {
            if (typeof loadWarehouse === 'function' && typeof saveWarehouse === 'function') {
                let wh = warehouse && typeof warehouse === 'object' ? warehouse : loadWarehouse();
                if (typeof _whLoadOk === 'undefined' || _whLoadOk !== false) {
                    let items = (wh && wh.items) || [];
                    let kept = items.filter(it => it && !isOrphan(it.id));
                    if (kept.length !== items.length) { wh.items = kept; saveWarehouse(wh); removed += items.length - kept.length; }
                }
            }
        } catch (e) { console.warn('purgeOrphanItems warehouse', e); }
        if (removed > 0 && typeof logSys === 'function') {
            logSys(`<span class="text-slate-400">🧹 已自動清除 ${removed} 個已停用的舊版物品（功能已移除·無法使用或販售）。</span>`);
        }
        return removed;
    } catch (e) { console.warn('purgeOrphanItems', e); return 0; }
}

function loadGame() {
    _uiConfigReady = false;   // 🛡️ 審計#1：載入期間 DOM 仍是上一個畫面/預設值，禁止 saveGame 以它重建 config
    let _masteryRepair = null;
    // 🐾 v3.3.16 換角色前：先把上一角色未存的寵物進度 flush 進共用桶，再失效記憶體快取→新角色 petRoster() 從桶重載（防跨角色髒鏡像互洗裝備/出戰）。
    try { if (typeof _petRosterDirty !== 'undefined' && _petRosterDirty && player && player.cls && typeof petRosterSave === 'function') petRosterSave(); } catch (e) {}
    try { if (typeof _petRosterKey !== 'undefined') _petRosterKey = null; } catch (e) {}
    let _u = _saveUnwrap(_lzGet('lineage_idle_save_' + currentSlot));   // 🛡️ 解存檔簽章（舊明文存檔 signed:false 照常載入）
    // 🛡️ 簽章不符＝被竄改：拒絕載入
    //    ⚠️ v3.5.94 文案必須跟著按鈕顯隱規則走：摘要 _summaryFromRaw 不驗章，簽章壞掉但 payload 仍是合法 JSON 的存檔
    //    照樣解得出角色摘要 → updateLoadInfo 的 empty=false → 「匯入進度」帶 hidden、只有「刪除角色」看得見。
    //    舊文案叫玩家直接去點「匯入進度」，那顆按鈕在此情境根本不渲染（且 importSave 的「已有角色請先刪除」閘門也會擋），
    //    故改成先刪後匯的正確順序（刪除流程走既有的輸入角色名確認，不繞過保護）。
    if (_u.signed && !_u.ok) { alert('此存檔的完整性校驗未通過，可能已被外部修改，無法載入。\n可改用其他存檔位。\n若要還原先前匯出的 .json 備份檔：請先在載入畫面按「刪除角色」清空本欄位，清空後「匯入進度」按鈕才會出現，再用它還原。'); return; }
    let s = _u.payload;
    if (s) {
        // 🛡️ 與其他讀檔點一致：毀損時乾淨報錯而非拋例外卡死
        //    ⚠️ v3.5.94 這條與上面簽章失敗那條方向相反：payload 連 JSON.parse 都失敗時 _summaryFromRaw 也回 null
        //    → 該欄位在載入畫面顯示為空、empty=true → 「匯入進度」可見而「刪除角色」被 hidden。
        //    舊文案多寫的「仍可用『刪除角色』清空」正好點名此情境唯一看不見的那顆按鈕，故移除。
        let d; try { d = JSON.parse(s); } catch(e){ alert('此存檔位的資料已毀損，無法載入。\n此欄位在載入畫面會顯示為空，請直接按「匯入進度」還原先前匯出的 .json 備份檔。'); return; }
        try { _validatePortableSave(d); }
        catch(e){ alert('無法載入：' + e.message + '\n原始存檔尚未變更，請使用完整備份或相容版本。'); return; }
        if (typeof resetWorldChannelSession === 'function') resetWorldChannelSession();
        player = d.p; mapState = d.ms;
        delete player.offlineHunt;   // 🗑️ v3.7.94 離線掛機已移除：舊存檔的逐地圖速率快照沒有讀取者，載入即丟掉（否則每次存檔都白帶一份）
        normalizeFacingRefsForSave();   // 舊存檔若含 v3.2.12 面向物件副本，載入時立即轉為 UID／隊員鍵並移除物件參照
        if (typeof stripThreatForSave === 'function') stripThreatForSave();   // 舊存檔若帶戰鬥暫存，僅在讀檔時清除。
        if (typeof applyGlobalAutoSellSettings === 'function') applyGlobalAutoSellSettings();   // 🔧 v2.6.91 功能5：載入角色時套用全域自動販賣設定（8 角色共用時覆蓋本檔規則）
        if (!player.enSeed) player.enSeed = 'es' + _seedHash((player.name || '') + '|' + (player.cls || '') + '|lz').toString(36);   // 🎲 舊存檔無強化種子：由角色名+職業決定論衍生（重匯入同一份舊檔也得相同種子→不能靠重匯入重洗強化）
        if (typeof sanitizeState === 'function') sanitizeState();   // 🛡️ 讀檔後合理性夾擠（抓改過/竄改的存檔：等級>100、強化值超上限、負金幣等）
        state.ticks = d.ticks || 0;   // 🔧 還原 tick 計數：讓召喚物/迷魅以絕對 tick 記錄的 endTick 在重載後仍然有效
        // 修復：自動存檔可能在「死亡放置」期間把 player.dead=true 寫入存檔。
        // 讀檔一律以「在村莊甦醒、存活」載入，否則 tick() 會因 player.dead 提早 return，
        // 導致載入後不出怪、且無復活按鈕可按而卡死。後續進村流程會補滿 HP/MP 並清除異常狀態。
        player.dead = false;
        { let b1 = document.getElementById('btn-revive'); if(b1) b1.classList.add('hidden');
          let b2 = document.getElementById('btn-revive-inplace'); if(b2) b2.classList.add('hidden'); }
        document.getElementById('creation-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.body.classList.add('game-bg-dim');   // 正式遊戲後：背景淡化
        
        player.inv.forEach(i => { if(i.lock === undefined) i.lock = false; });
        player.inv.forEach(i => { if(i.junk === undefined) i.junk = false; });
        // 🔧 v2.6.91 功能1：娃娃為系統保護物品——修復舊存檔殘留的廢品標記與規則記憶
        player.inv.forEach(i => { let _d=DB.items[i.id]; if(_d&&(_d.doll||_d.slot==='doll')){i.junk=false;delete i.junkSince;delete i._autoSellQty;delete i._ruleJunk;delete i._userKeep;} });
        // 修復重複 uid：強化裝備曾因共用 uid 互相覆蓋/消失，載入時確保 inv+eq 所有物品 uid 唯一
        { let _seen = new Set(); let _fix = (it) => { if(!it) return; if(it.uid === undefined || _seen.has(it.uid)) it.uid = uid(); _seen.add(it.uid); }; player.inv.forEach(_fix); if(player.eq) Object.values(player.eq).forEach(_fix); }
        // 廢品記憶（依完整簽章）：舊存檔初始化，並把目前已標記為廢品的物品轉成記憶
        if(!player.junkPrefs) {
            player.junkPrefs = {};
            player.inv.forEach(i => { if(i.junk) player.junkPrefs[itemSig(i)] = true; });
        }
        // 🔧 廢品記憶改以「完整簽章」為鍵（同 id＋完全相同詞綴才自動標記）；舊存檔的純 id 鍵轉為無詞綴簽章
        {
            let _np = {};
            for (let k in player.junkPrefs) { if (player.junkPrefs[k]) _np[k.includes('|') ? k : (k + '|0|0|0||')] = true; }
            player.junkPrefs = _np;
        }
        player.inv.forEach(i=>{let _d=DB.items[i.id];if(_d&&(_d.doll||_d.slot==='doll'))delete player.junkPrefs[itemSig(i)];});   // 🔧 v2.6.91 功能1：娃娃移出廢品記憶（未來掉落不再自動標記）
        // 相容舊存檔：新增第六屬性 魅力(cha)，起始 8
        if(player.base && player.base.cha === undefined) player.base.cha = (createBase[player.cls] ? createBase[player.cls].cha : 8);
        if(player.alloc && player.alloc.cha === undefined) player.alloc.cha = 0;
        if(!player.panacea) player.panacea = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
        if(!player.siege) player.siege = { active:false, city:'kent', gateKilled:false, towerKilled:false, endTime:0, kills:0, result:null, cooldownUntil:0, accCdUntil:0 };
        if(player.panaceaUsed === undefined) player.panaceaUsed = 0;
        if(player.siege.accCdUntil === undefined) player.siege.accCdUntil = 0;
        if(player.cds && player.cds.purifySk === undefined) player.cds.purifySk = 0;   // 🔧 舊檔遷移：淨化技獨立冷卻
        if(player.cds && player.cds.convertSk === undefined) player.cds.convertSk = 0;   // 🔄 舊檔遷移：轉換技獨立施法冷卻
        if(!player.lastMapByCat) player.lastMapByCat = {};
        if(player.tracking === undefined) player.tracking = null;
        // 相容舊存檔：單一 partner → partners 陣列
        if(player.partners === undefined) player.partners = (player.partner ? [player.partner] : []);
        if(player.allies === undefined || !Array.isArray(player.allies)) player.allies = [];   // 協力角色（其他存檔位）
        // 🐾 v3.2.17 夥伴系統 v2：舊項圈/肉/哨子/舊進化果實/舊 petStorage 一次性轉換與清除（項圈→新寵物入共用保管）
        try { if (typeof petMigrateLegacy === 'function') petMigrateLegacy(); } catch (e) { console.warn('petMigrateLegacy', e); }
        // 舊網頁版匯入資料的倉庫可能很大。下方清理、套裝修正與三種圖鑑遷移共用同一份解析結果，
        // 避免首次進角連續完整解碼多次；資料仍由既有的 saveWarehouse 安全流程回寫。
        let _loadWarehouse = null, _loadWarehouseReady = false;
        try { if (typeof loadWarehouse === 'function') { _loadWarehouse = loadWarehouse(); _loadWarehouseReady = true; } } catch (e) {}
        try { purgeOrphanItems(_loadWarehouseReady ? _loadWarehouse : undefined); } catch (e) { console.warn('purgeOrphanItems', e); }   // 🧹 v3.2.62 清除已停用舊物品（DB 無定義的孤兒·背包+倉庫·排除待轉換的舊項圈）
        // 相容舊存檔：返生術改為被動技能，清除先前施放殘留的無作用 buff；初始化復活卷軸冷卻
        if(player.buffs) player.buffs.sk_resurrection = 0;
        if(player.buffs && player.buffs.haste >= 999999) player.buffs.haste = 0;   // 修復舊版伊娃之盾殘留的永久加速（改由 _equipHaste 旗標處理）
        if(player.reviveScrollCd === undefined) player.reviveScrollCd = 0;
        if(player.magicShieldCd === undefined) player.magicShieldCd = 0;   // 相容舊存檔：魔法屏障抵擋後冷卻
        // 修復舊版「召喚死亡後 buff 未清除」卡關：載入時若目前沒有召喚物，清除殘留的召喚 buff，
        // 讓自動施放能立即重新召喚（不必等死亡復活或 buff 自然倒數）。
        if(player.charmed === undefined) player.charmed = null;   // 相容舊存檔：迷魅獨立槽位
        if(player.summon && ['sk_zombie', 'sk_elf_summon', 'sk_elf_summon2'].includes(player.summon.skId)) player.summon = null;   // 🧟 v3.2.21 造屍術/屬性精靈改走 v2 實體制：清除舊管線殘留（勾選仍在→v2 自動重新召喚）
        player.summonsV2 = [];   // 🧙 v3.2.40 稽核修：v2 召喚實體不入檔（本行清 v3.2.39 以前舊檔殘留·防改名 null-deref）·勾選仍在→自動重施
        player.guardsV2 = [];    // 🏰 城堡護衛實體不入檔（讀檔後 castleGuardSync 依血盟名冊重建）
        if (player.castleGuard !== undefined) delete player.castleGuard;   // 🏰 v3.7.96 舊「承擔傷害的城堡護衛」已移除→清掉舊存檔殘留欄位
        if(player.summon && typeof refreshSummonBalance === 'function') refreshSummonBalance(player.summon, player);   // 召喚平衡改版：既有存檔中的召喚物同步新階級倍率、穿透與技能間隔
        if(!player.summon && player.buffs) {
            (player.skills || []).forEach(s => { if(DB.skills[s] && DB.skills[s].summon) player.buffs[s] = 0; });
        }
        if(!player.charmed && player.buffs) player.buffs.sk_charm = 0;
        if(player.bloodPledge === undefined) player.bloodPledge = null;   // 相容舊存檔：血盟陣營（null/esti/tros）
        if(player.name === undefined) player.name = null;   // 相容舊存檔：未取名則狀態欄顯示「點擊取名」
        delete player.blessings;      // 舊版血盟祝福已移除；新版血盟 Buff 不使用角色 blessings。
        delete player.blessingAuto;
        // 🔥 v3.0.78 試煉接取制：初始化任務狀態；幻術士/戰士/龍騎士 50 級試煉原以 demonTempleOpen 為唯一狀態 → 統一遷移為 trialStage=2（最終兌換階段·一次性）
        if(!player.trialQ || typeof player.trialQ !== 'object') player.trialQ = {};
        if(['illusion','warrior','dragon'].includes(player.cls) && player.demonTempleOpen && (player.trialStage || 0) < 2) player.trialStage = 2;
        // 🔥 v3.0.77 屬性詞綴改版遷移：舊12代碼→新5階代碼（fire1/3/5→fr1/fr2/fr3…名稱身分不變·冪等）；
        //    屬性詞綴只能存在於武器→防具/飾品上的舊屬性詞綴一律清除；非法值（true/未知碼）清除。
        //    倉庫刻意不改寫（資料遺失敏感）——讀取路徑 getAttrAffix 相容舊碼，提領後下次載入在此轉正。
        let _normAttr = (i) => {
            if (!i) return;
            if (typeof i.attr === 'string' && ATTR_LEGACY[i.attr]) i.attr = ATTR_LEGACY[i.attr];
            if (i.attr) { let dd = DB.items[i.id]; if (!getAttrAffix(i.attr) || !dd || dd.type !== 'wpn') i.attr = false; }
        };
        player.inv.forEach(_normAttr);
        for (let k in player.eq) _normAttr(player.eq[k]);
        (player.allies || []).forEach(a => { if (a && a.eq) { for (let k in a.eq) _normAttr(a.eq[k]); } if (a && a.inv) a.inv.forEach(_normAttr); });
        // 🔮 席琳套裝效果改置腰帶：一次性清除既有「項鍊」上的套裝效果（背包/裝備/傭兵快照/共用倉庫）
        {
            let _fixSet = (it) => { if (it && it.seteff) { let dd = DB.items[it.id]; if (dd && dd.slot === 'amulet') it.seteff = false; } };
            player.inv.forEach(_fixSet);
            for (let k in player.eq) _fixSet(player.eq[k]);
            (player.allies || []).forEach(a => { if (a && a.eq) { for (let k in a.eq) _fixSet(a.eq[k]); } if (a && a.inv) a.inv.forEach(_fixSet); });
            try { let _w = _loadWarehouseReady ? _loadWarehouse : loadWarehouse(); let _chg = false; _w.items.forEach(it => { if (it && it.seteff) { let dd = DB.items[it.id]; if (dd && dd.slot === 'amulet') { it.seteff = false; _chg = true; } } }); if (_chg) saveWarehouse(_w); } catch (e) {}
        }
        consolidateInventory();   // 相容舊存檔：合併修復前被拆分的相同卷軸/物品堆疊
        purgeCompletedElfWhisper();   // 🔥 載入時：若已交付完成精靈的私語階段，自動清除身上殘留的精靈的私語
        if(!player.statuses) player.statuses = { stun: 0, freeze: 0, stone: 0, poison: 0, poisonDmg: 0, poisonTick: 0, burn: 0, burnDmg: 0, burnTick: 0, scald: 0, scaldDmg: 0, scaldTick: 0, bleed: 0, bleedDmg: 0, bleedTick: 0, sleep: 0, silence: 0, paralyze: 0 };
        if (player.eq.arrow === undefined) player.eq.arrow = null; // 相容舊存檔
        // 相容舊存檔：手套曾被錯存於 eq.glove（單數），搬移到正確的 gloves 欄位
        if (player.eq.glove) { if (!player.eq.gloves) player.eq.gloves = player.eq.glove; delete player.eq.glove; }
        // 🏺 v3.2.79 相容舊存檔：聖伯納的急救酒桶／貴重狐毛圍巾曾誤用 slot:'neck'（非法欄位）→ 裝備後落入幽靈槽 eq.neck、界面不顯示而「消失」。
        //   定義已改回 'amulet'；此處把卡在幽靈槽的既有裝備搬回項鍊欄（項鍊欄已占用則退回背包），玩家＋傭兵皆處理。
        {
            let _fixNeck = (owner) => {
                if (!owner || !owner.eq || !owner.eq.neck) return;
                let _it = owner.eq.neck;
                if (!owner.eq.amulet) owner.eq.amulet = _it;
                else (Array.isArray(owner.inv) ? owner.inv : player.inv).push(_it);   // 項鍊欄已有裝備→退回背包（傭兵無自身背包則退玩家背包，與卸下傭兵裝備一致）
                delete owner.eq.neck;
            };
            _fixNeck(player);
            (player.allies || []).forEach(_fixNeck);
        }

        // ⚠️ v2.6.47 一次性經驗刻度遷移（修「更新後經驗條看似歸零」）：v2.6.40 取消打怪經驗遞減、改把「高等升級需求」放大 ×2~×1024，
        //    但既有存檔的 per-level 經驗未同步放大 → 經驗條%＝exp/getExpReq(lv) 從舊制比例暴跌（Lv90 半滿→0.05%）看似歸零（數值其實還在）。
        //    這裡把「舊制殘留經驗」等比放大到新刻度，讓經驗條%回到改制前比例；同時修正經典模式死亡扣經驗（需求×10%）因刻度不符而把小殘留一次扣光的問題。
        //    安全設計：① 只遷移「明顯是舊制殘留」的 exp（< 舊固定需求 EXP_MIG_OLD_BASE；舊制 Lv49+ 未升級的 exp 必 < 此值）→ 改制後才練出的大數值不動；
        //             ② 放大後夾在「不足以升級」(< getExpReq(lv))→ 絕不因遷移白升等；③ 版本戳 player.expMigV 保證每檔只跑一次（新角色於 startGame 已標記，永不遷移）。
        if (!player.expMigV) {
            const EXP_MIG_OLD_BASE = 36065092;   // v2.6.40 前 Lv49+ 的固定升級需求（＝EXP_T[49]，新制 getExpReq 的未放大基準）
            let _mlv = player.lv || 1;
            if (_mlv >= 50 && _mlv < 100 && (player.exp || 0) > 0 && player.exp < EXP_MIG_OLD_BASE) {
                let _v1Req = _expReqOldV1(_mlv);
                let _factor = Math.round(_v1Req / EXP_MIG_OLD_BASE);   // 舊固定需求 → v1 分段需求
                if (_factor > 1) player.exp = Math.min(Math.floor(player.exp * _factor), _v1Req - 1);   // 夾在「不足以升級」→ 不白升等
            }
            player.expMigV = 1;   // 標記本檔已遷移（存檔時固化·跨載入不重跑）
        }
        // ⚠️ v3.0.82 經驗刻度遷移（expMigV=2）：升級需求改「天堂經典表」——等級不變、該級剩餘經驗以進度 % 等比換算（玩家＋受雇傭兵）。
        //   newExp = floor(oldExp ÷ 舊需求(lv) × 新需求(lv))，夾在 < 新需求（絕不因遷移白升級）；滿等(100)歸 0。
        if ((player.expMigV || 0) < 2) {
            let _mig2 = (lv, exp) => {
                lv = Math.max(1, Math.min(100, Math.floor(lv || 1)));
                if (lv >= 100) return 0;
                let o = _expReqOldV1(lv), n = _expReqClassicV2(lv);
                if (!isFinite(o) || !isFinite(n) || o <= 0) return 0;
                return Math.min(Math.floor(Math.max(0, exp || 0) / o * n), n - 1);
            };
            player.exp = _mig2(player.lv, player.exp);
            (player.allies || []).forEach(a => { if (a) a.exp = _mig2(a.lv, a.exp); });
            player.expMigV = 2;
        }
        // ⚖️ v3.4.58 經驗刻度遷移（expMigV=3）：Lv70-99 改為與同級怪經驗等比例。
        //   玩家與目前在隊傭兵保留該級原有進度百分比，避免需求降低後下一次擊殺連升多級；Lv1-69 數值不變。
        if ((player.expMigV || 0) < 3) {
            let _mig3 = (lv, exp) => {
                lv = Math.max(1, Math.min(100, Math.floor(lv || 1)));
                if (lv >= 100) return 0;
                let o = _expReqClassicV2(lv), n = getExpReq(lv);
                if (!isFinite(o) || !isFinite(n) || o <= 0) return 0;
                return Math.min(Math.floor(Math.max(0, exp || 0) / o * n), n - 1);
            };
            player.exp = _mig3(player.lv, player.exp);
            (player.allies || []).forEach(a => { if (a) a.exp = _mig3(a.lv, a.exp); });
            player.expMigV = 3;
        }
        // 🏛️ v3.0.83 傳統模式已取消：舊傳統角色一次性併入對應基礎模式（一般+傳統→一般、經典+傳統→經典）。
        //   共用倉庫/圖鑑桶另由 js/12 _mergeTradBuckets 於頁面載入時合併（'_tradonly'→''、'_trad'→'_classic'）。
        if (player.traditionalMode) {
            player.traditionalMode = false;
            logSys(`<span class="text-amber-300 font-bold">🏛️ 傳統模式已取消：此角色已轉為${player.classicMode ? '「經典模式」' : '「一般模式」'}，裝備強化與施法卷軸恢復可用。</span>`);
        }

        // ⚔️ v3.0.75 武器強化上限 +20→+15：既有 >+15 武器一律實體降為 +15（數值＝能力·搭配 ENHANCE_CAP.wpn=15＋capWpnEn/enhanceWpnFinalMult 讀取夾擠）。
        //    範圍＝玩家背包／已裝備（含副手 offwpn）／傭兵裝備；每次載入都跑（只夾 >15·冪等·免版本戳）。倉庫武器靠 capEn 顯示 +15、提領後下次載入自動夾。
        try {
            let _cwp = it => { if (it && it.id && DB.items[it.id] && DB.items[it.id].type === 'wpn' && (Number(it.en) || 0) > 15) it.en = 15; };
            (player.inv || []).forEach(_cwp);
            if (player.eq) Object.values(player.eq).forEach(_cwp);
            (player.allies || []).forEach(a => { if (a && a.eq) Object.values(a.eq).forEach(_cwp); });
        } catch (e) {}

        // 🔧 架構#6：集中式預設值合併（放在所有「轉換型」遷移之後，作為缺漏欄位的統一保底）。
        // 日後新增欄位只需登錄於 SAVE_DEFAULTS；上方逐項 if(undefined) 為歷史遷移，不必再增列。
        applySaveDefaults(player);
        if (typeof repairMasteryState === 'function') _masteryRepair = repairMasteryState(player);
        if (!player.siege || typeof player.siege !== 'object') player.siege = {};
        if (player.ismaelAccUsed && !(player.siege.accCdUntil > 0)) player.siege.accCdUntil = Date.now() + 24 * 3600 * 1000;
        delete player.ismaelAccUsed;   // 舊版「攻城獲勝重置額度」遷移為購買後 24 小時冷卻。
        if (typeof clanSyncCurrentPlayer === 'function') clanSyncCurrentPlayer();   // 共用血盟為權威，同步成員與清除舊 24h 城堡欄位。
        // 🛡️ v2.6.69 審計#8：上次分頁關閉前未寫進帳本的傭兵經驗待寫紀錄（隨存檔攜帶）→ 重載後補 flush（uid 冪等·帳本已有同 uid 自動跳過）
        if (typeof _mercLedgerOutbox !== 'undefined' && Array.isArray(player.mercLedgerOutbox) && player.mercLedgerOutbox.length) {
            let _mNow = Date.now();
            player.mercLedgerOutbox.forEach(r => { if (r && r.uid && (_mNow - (r.ts || 0)) < MERC_LEDGER_KEEP_CLAIMED) _mercLedgerOutbox.push(r); });   // 超過已領保留期(7天)的陳舊鏡像不再補寫（防已領又被清的紀錄復活＝重複領取）
            player.mercLedgerOutbox = [];
            try { _mercLedgerFlush(); } catch (e) {}
        }
        if (typeof loadSharedCollections === 'function') loadSharedCollections();   // 🎴🗡️ 讀檔：載入同模式共用收集圖鑑（卡片/裝備·併入該角色既有資料）
        if (typeof ensureCardBook === 'function') ensureCardBook();   // 🎴 舊存檔遷移：移除道具欄的卡片收集冊本體（改由「收藏」面板開啟）
        if (typeof ensureEquipBook === 'function') ensureEquipBook(_loadWarehouseReady ? _loadWarehouse : undefined);   // 🗡️ 舊存檔遷移：移除裝備收集冊本體＋登錄現有(背包/已裝備)裝備
        if (typeof ensureMiscDex === 'function') ensureMiscDex(_loadWarehouseReady ? _loadWarehouse : undefined);   // 🧰 舊存檔遷移：登錄現有道具到道具收集冊
        if (typeof ensureRelicDex === 'function') ensureRelicDex(_loadWarehouseReady ? _loadWarehouse : undefined);   // 🏺 舊存檔遷移：登錄現有遺物到遺物收集冊

        // 👇 正確的新版起點邏輯
        // 🔧 讀檔回「家」改走 getHomeTown()：血盟成員回盟主村莊（海音/歐瑞），否則回職業起始村，與回村按鈕邏輯一致
        setMapSelectors(getHomeTown());

        if (player.eq && player.eq.ring3 === undefined) player.eq.ring3 = null;   // 🔧 舊存檔補上第三戒指欄
        if (player.eq && player.eq.ring4 === undefined) player.eq.ring4 = null;   // 🔧 舊存檔補上第四戒指欄
        // 🔧 負重改版遷移：負重強化不再開放重甲，卸下現在無法裝備的裝備到背包
        ['wpn','arrow','helm','armor','shin','shield','cloak','tshirt','gloves','boots','ring1','ring2','ring3','ring4','amulet','belt'].forEach(_sl => {
            let _e = player.eq && player.eq[_sl]; if (!_e) return;
            let _ok = true; try { _ok = checkCanEquip(_e); } catch(err) { _ok = true; }
            if (!_ok) {
                if (!invMergeBack(_e)) player.inv.push(_e);   // 🔒 v3.6.92 單一真相 invMergeBack（js/01）
                player.eq[_sl] = null;
                logSys(`<span class="text-amber-300">因負重強化改版，無法再裝備的 ${DB.items[_e.id] ? DB.items[_e.id].n : '裝備'} 已自動卸下至背包。</span>`);
            }
        });
        syncShahaArrow();   // 🏝️ 沙哈之弓：載入時校正無限箭狀態
        calcStats();
        try { if (typeof _petEnforceCarry === 'function') { _petEnforceCarry(); if (_petRosterDirty) petRosterSave(); } } catch (e) { console.warn('pet carry enforcement', e); }
        applySherineTheme();   // 🔮 還原席琳的世界視覺主題
        changeMap(true);
        renderTabs();
        renderSkillSelects();
        renderMobs();
        
        // 載入自動化設定 (如果有存過的話)
        if (player.config) {
            let c = player.config;
            
            // 藥水設定與顏色變更
            if (c.setPot) {
                let potSel = document.getElementById('set-pot');
                potSel.value = c.setPot;
                potSel.classList.remove('text-red-300', 'text-orange-300', 'text-white');
                potSel.classList.add(c.setPot === 'potion_heal' ? 'text-red-300' : (c.setPot === 'potion_strong' ? 'text-orange-300' : 'text-white'));
            }
            if (c.setHpPot) document.getElementById('set-hp-pot').value = c.setHpPot;
            if (c.setAutoBuyPot !== undefined) document.getElementById('set-auto-buy-pot').checked = c.setAutoBuyPot;
            
            // 施法設定
            if (c.selAtkSkill) document.getElementById('sel-atk-skill').value = c.selAtkSkill;
            if (c.setMpAtk) document.getElementById('set-mp-atk').value = c.setMpAtk;
            if (c.selHealSkill) document.getElementById('sel-heal-skill').value = c.selHealSkill;
            if (c.setMpHeal) document.getElementById('set-mp-heal').value = c.setMpHeal;
            if (c.selConvertSkill && document.getElementById('sel-convert-skill')) document.getElementById('sel-convert-skill').value = c.selConvertSkill;
            if (c.setHpConvert && document.getElementById('set-hp-convert')) document.getElementById('set-hp-convert').value = c.setHpConvert;
            if (c.setHpSkill != null && c.setHpSkill !== '' && document.getElementById('set-hp-skill')) document.getElementById('set-hp-skill').value = c.setHpSkill;
            
            // 藥水與卷軸開關
            if (c.setHaste !== undefined) document.getElementById('set-haste').checked = c.setHaste;
            if (c.setBrave !== undefined) document.getElementById('set-brave').checked = c.setBrave;
            if (c.setBlue !== undefined) document.getElementById('set-blue').checked = c.setBlue;
            if (c.setCautious !== undefined) document.getElementById('set-cautious').checked = c.setCautious;
            if (c.setElfcookie !== undefined) document.getElementById('set-elfcookie').checked = c.setElfcookie;
            if (c.setPoly !== undefined) document.getElementById('set-poly').checked = c.setPoly;
            if (c.setMagicbarrier !== undefined) document.getElementById('set-magicbarrier').checked = c.setMagicbarrier;
            if (c.setTeleport !== undefined) document.getElementById('set-teleport').checked = c.setTeleport;
            if (c.setAutoBuyArrow !== undefined) document.getElementById('set-auto-buy-arrow').checked = c.setAutoBuyArrow;   // 🧪 v3.3.15 各藥水/卷軸「自動購買」勾選已移除（併入自動使用）→不再還原
            
            // 動態魔法 Buff 設定還原
            if (c.autoBuffSkills) {
                for (let sid in c.autoBuffSkills) {
                    let chk = document.getElementById(`auto-sk-${sid}`);
                    if (chk) chk.checked = c.autoBuffSkills[sid];
                }
                // 🧙 v3.2.42 稽核修：召喚技勾選互斥——舊/手改存檔若同時勾多個召喚技，只保留第一個（防每秒交替施放互洗 MP）
                let _sumKept = false;
                for (let sid in c.autoBuffSkills) {
                    if (!DB.skills[sid] || !DB.skills[sid].summon) continue;
                    let chk = document.getElementById(`auto-sk-${sid}`);
                    if (chk && chk.checked) { if (_sumKept) chk.checked = false; else _sumKept = true; }
                }
            }
        } else {
            // 舊版存檔相容：如果沒有 config 就預設全關
            ['set-haste', 'set-brave', 'set-blue', 'set-cautious', 'set-poly', 'set-auto-buy-pot', 'set-auto-buy-arrow'].forEach(id => {
                let el = document.getElementById(id);
                if(el) el.checked = false;
            });
        }
        
        updateClassPotionRows();
        try { if (typeof _renderAutoSellBtn === 'function') _renderAutoSellBtn(); } catch (e) {}   // 🗑️ 還原「自動賣出」按鈕點亮/變暗狀態（player.autoSellOn）
        _uiConfigReady = true;   // 🛡️ 審計#1：config→DOM 還原完成，此後 saveGame 才可用 DOM 重建 config

        state.running = true;
        _roleSessionHeartbeat();   // 立即登記，不等待第一個 2 秒心跳
        // 自然恢復（每 16 秒）已由主迴圈 tick() 內的 state.ticks % 160 統一驅動，不再額外 setInterval。
        // 計時器統一由 startGameTimers() 註冊（內含去重），含每 5 分鐘自動存檔。
        startGameTimers();
        logSys(`===== 歡迎回來 =====`);
        if (_masteryRepair && _masteryRepair.reset) {
            if (_masteryRepair.reason === 'class-mismatch') {
                logSys('<span class="text-amber-300 font-bold">已修復舊版刪角殘留的跨職業精通資料；此角色可重新向威頓村的漢接取精通任務。</span>');
            } else if (_masteryRepair.reason === 'classic-mode') {
                logSys('<span class="text-slate-400">已清除經典模式角色中不應存在的舊精通資料。</span>');
            }
        }
        if (_masteryRepair && _masteryRepair.changed) saveGame();   // 修復後立即固化，避免重載時再次遇到同一壞狀態
        try { if (typeof purgeReplacedAllies === 'function') purgeReplacedAllies(); } catch (e) {}   // 🤝 v3.4.23 載入後掃描：出戰傭兵的來源存檔位若已換成新角色（enSeed 不同）→ 自動解散
    }
}

// 配點/萬能藥的「自然屬性值」：基礎+配點+萬能藥（不含裝備與 buff）；屬性上限只套用在此值上，裝備/buff 可再往上疊加
function naturalStat(s) { return (player.base[s] || 0) + (player.alloc[s] || 0) + ((player.panacea && player.panacea[s]) || 0); }
function adjBonusStat(s) {
    let capN = 60;   // 屬性配點上限：一律 60，不分等級；上限只看 naturalStat(base+配點+萬能藥)，裝備/buff 一律不計入、可再往上疊加
    if (player.bonus > 0 && naturalStat(s) < capN) {
        player.alloc[s]++; player.bonus--;
        calcStats();
    }
}

// ===== 🕯️ 回憶蠟燭：六大屬性「配點重置」（草稿式：玩家實際數值不變、確認後才一次套用；資訊面板顯示 Lv1+草稿）=====
let _respec = null;   // { draft:{str..cha}, pts:N }；null=非重置中
function _respecSpent() { let d = _respec.draft; return d.str + d.dex + d.con + d.int + d.wis + d.cha; }
function respecPtsLeft() { return _respec ? (_respec.pts - _respecSpent()) : 0; }
function startRespec() {
    if (_respec) return;   // 已在重置中
    let c = player.inv.find(i => i.id === 'candle');
    if (!c) { logSys('你沒有回憶蠟燭。'); return; }
    let b = createBase[player.cls];
    _respec = { draft: { str:0, dex:0, con:0, int:0, wis:0, cha:0 }, pts: b.pts + Math.max(0, (player.lv || 1) - 49) };   // 可重配＝創角點數＋(等級-49)升級點數
    { let _sb = document.querySelector('[onclick*="switchTab(\'stats\'"]'); if (_sb) switchTab('stats', _sb); }   // 切到能力分頁讓玩家配點
    updateUI();
    logSys('🕯️ 回憶蠟燭：六大屬性已暫時回到 Lv1，請以 +／- 重新分配後按「確認」生效（「取消」則不消耗蠟燭）。');
}
// 六大屬性的 +/- 路由：重置中＝改草稿；否則＝花用升級點數（僅 +、不可退）
function adjAlloc(s, dir) {
    let capN = 60;
    if (_respec) {
        let b = createBase[player.cls];
        if (dir > 0) { if (respecPtsLeft() > 0 && (b[s] + _respec.draft[s]) < capN) _respec.draft[s]++; }
        else { if (_respec.draft[s] > 0) _respec.draft[s]--; }
        updateUI();
    } else if (dir > 0 && (player.bonus || 0) > 0) {
        adjBonusStat(s); updateUI();
    }
}
function confirmRespec() {
    if (!_respec) return;
    let c = player.inv.find(i => i.id === 'candle');
    if (!c) { _respec = null; updateUI(); logSys('沒有回憶蠟燭，已取消重置。'); return; }
    let b = createBase[player.cls];
    let left = Math.max(0, respecPtsLeft());
    // 消耗一個蠟燭
    if ((c.cnt || 1) > 1) c.cnt--; else player.inv = player.inv.filter(i => i !== c);
    // 套用：base 還原純職業起始、alloc=草稿、清空萬能藥（退還純白）、賣項圈解夥伴、未配點轉升級點數
    let used = player.panaceaUsed || 0;
    player.base = { str:b.str, dex:b.dex, con:b.con, int:b.int, wis:b.wis, cha:b.cha };
    player.alloc = { str:_respec.draft.str, dex:_respec.draft.dex, con:_respec.draft.con, int:_respec.draft.int, wis:_respec.draft.wis, cha:_respec.draft.cha };
    player.panacea = { str:0, dex:0, con:0, int:0, wis:0, cha:0 }; player.panaceaUsed = 0;
    if (used > 0) { gainItem('panacea_white', used, true, true); logSys(`回收已使用的萬能藥，獲得 <span class="text-slate-100 font-bold">純白的萬能藥</span> ×${used}。`); }
    // 🚫 v3.2.17 舊「賣項圈解夥伴」已隨項圈系統移除；改為魅力變動後重新把關出戰寵物（魅力不足者自動收回保管）
    player.bonus = left;
    _respec = null;
    calcStats();
    try { if (typeof _petEnforceCarry === 'function') { _petEnforceCarry(); petRosterSave(); } } catch (e) {}
    renderTabs(true); updateUI(); saveGame();
    logSys('配點已確認生效。' + (left > 0 ? ` 尚有 <b>${left}</b> 點未分配（已轉為升級點數，可日後再配）。` : ''));
}
function cancelRespec() {
    if (!_respec) return;
    _respec = null;
    updateUI();
    logSys('已取消配點重置，未使用回憶蠟燭。');
}
function useCandle() { startRespec(); }   // 🔧 舊入口（保留相容）：導向新的配點重置流程

// 🗑️ v3.5.83 移除 resetStatsCandle()：零引用的舊「一次性蠟燭配點重置」，已被草稿式 startRespec/confirmRespec 取代；
//    它既不檢查也不消耗 candle 道具、也不 saveGame。唯一舊入口 useCandle() 已導向 startRespec()。
