// 潘朵拉遺物布告欄＋安全區玩家收購系統
// 共用資料獨立於角色存檔：同一套遊戲的所有角色共用龍之鑽石、玩家 NPC 與三個遺物欄位。
(function () {
    'use strict';

    const TEST_BUILD = !!(typeof window !== 'undefined' && window.__FB5_TEST_BUILD);
    const STORE_KEY = 'fb5_pandora_relic_market_v1';
    const LOCK_KEY = STORE_KEY + '_lock';
    const STORE_VERSION = 3;
    const CHECK_MS = 10 * 60 * 1000;
    const WANDERER_LIFE_MS = 2 * 60 * 60 * 1000;
    const BROADCAST_MS = 5 * 60 * 1000;
    const GOLD_BROADCAST_OFFSET_MS = 1 * 60 * 1000;   // 龍鑽先喊；金幣延後 1 分鐘，兩者仍各自每 5 分鐘廣播
    const BROADCAST_PIN_MAX = 2;   // 📌 v3.5.77 叫賣訊息常駐在「系統與物品日誌」頂端的最大條數（超出者排隊，前面的人被互動/離場後自動遞補）
    const BOARD_COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const RELIC_SEARCH_COST = 100;
    const WANDERER_CHANCE = 0.50;
    const GOLD_WANDERER_CHANCE = 0.30;
    const WANDERER_CARD_CHANCE = 0.10;

    // 🚫 v3.5.53 出沒排除（用戶拍板）：攻城三城（限持城者進入·NPC 形同碰不到）＋炎魔謁見所＋席琳神殿；
    //    其餘安全區皆可出沒（含 傲慢之塔入口/時空裂痕入口/沉默洞穴/長老會議廳/希培利亞村莊/貝希摩斯）。
    const EXCLUDED_TOWNS = new Set([
        'town_sherine',           // 席琳神殿
        'town_kent_castle',       // 肯特城（攻城據點）
        'town_heine_castle',      // 海音城（攻城據點）
        'town_windwood_castle',   // 風木城（攻城據點）
        'town_flame_audience'     // 炎魔謁見所
    ]);
    const EXCLUDED_TOWN_NAMES = ['席琳神殿'];

    const PLAYER_AVATARS = [
        '王子', '公主', '男騎士', '女騎士', '男法師', '女法師', '男妖精', '女妖精',
        '男黑暗妖精', '女黑暗妖精', '男幻術士', '女幻術士', '男龍騎士', '女龍騎士', '男戰士', '女戰士'
    ];
    const SILENCE_COMPLAINTS = [
        '吵死了', '安靜一點', '別再喊了', '不要一直廣播', '別洗了', '可以停一下嗎', '別再洗頻了', '安靜啦',
        '不要重複喊', '我已經看到了', '別一直刷訊息', '可以閉嘴了', '讓頻道安靜一下', '不要再洗版', '停一下好嗎', '夠了喔',
        '別喊個不停', '大家都看見了', '不要一直刷存在感', '休息一下吧', '請停止廣播', '耳朵都要聾了', '真的很吵', '不要再重複了',
        '訊息看到了別再喊', '安靜三分鐘好嗎', '別一直佔頻道', '讓別人說話啦', '不要再刷頻', '已經知道你要收了', '先停一下', '別吵了',
        '能不能小聲一點', '請你安靜', '廣播到此為止', '不用再提醒了', '別再大聲宣傳', '頻道都被你洗掉了', '不要每次都喊', '收購訊息看到了',
        '可以不要洗畫面嗎', '安靜做生意吧', '別再吵大家', '讓頻道休息一下', '不用一直宣傳', '停手吧廣播王', '別把頻道當你家', '少喊兩句',
        '這裡不是廣播台', '請停止洗頻行為', '別再連續宣傳', '你的收購大家知道了', '先安靜做生意', '不要再佔版面', '可以收聲了', '別一直洗同一句',
        '拜託安靜一下', '不要再廣播收購了', '讓我看其他訊息', '你的廣播太密集了', '別再吵人了', '到此為止吧', '停止重播', '請把廣播關掉'
    ];
    const LOW_PRICE_COMPLAINTS = [
        '出這什麼白目價', '先去看一下市場價格好嗎？', '不會喊價就不要喊', '這價格你自己留著吧', '你是在收裝還是在搶劫？',
        '這點錢也敢洗頻？', '市場價都不查就來收？', '你當大家都是新手？', '這價格連路邊商人都笑你', '少拿這種破價來騙人',
        '你這出價是在侮辱誰？', '先把行情搞懂再喊', '這種價格還敢說意者密', '你是少打一個零吧？', '這價錢連鑑定費都不夠',
        '收不到不是沒有原因', '拿零頭出來收神裝喔？', '你乾脆叫人免費送你好了', '這價格是在釣新手吧', '別把便宜當成行情',
        '你的算盤是不是壞了？', '這價我丟商店都比較多', '商店老闆都比你有誠意', '這種出價還想成交？', '喊這價不怕被全頻笑？',
        '你先補點金幣再來收', '這價低到我以為看錯', '你收購價少得太誇張了', '別用乞丐價洗頻道', '想撿漏也不是這樣撿',
        '這行情你從哪個夢裡看的？', '你是不是沒逛過市場？', '出不起就別一直喊', '這價格只夠買空氣', '你的誠意跟出價一樣低',
        '這價連我倉庫灰塵都不賣', '先學會估價再來做生意', '你把別人都當白癡喔？', '這價也想收到東西，做夢吧', '少在頻道喊這種笑話',
        '這不是收購，這是明搶', '你的價格比掉寶率還低', '看到這出價我都笑了', '這點金幣留著買藥水吧', '行情差成這樣還敢收',
        '你先問問正常玩家怎麼出價', '這種價只騙得到剛創角的', '你是不是以為裝備不用打？', '價格開正常一點再說', '再喊這種低價照樣噴你'
    ];
    const SILENCE_APOLOGIES = [
        '對不起', '抱歉', '打擾了', '不好意思', '真的很抱歉', '我會安靜的', '對不起我不喊了', '抱歉打擾大家',
        '知道了，我會停下來', '不好意思，我收聲', '抱歉，我沒注意到', '對不起，造成困擾了', '我這就停止廣播', '抱歉讓你覺得吵', '不好意思，打擾你了', '收到，我不再喊了',
        '對不起，我安靜做生意', '抱歉，是我喊太多次了', '我明白了，對不起', '不好意思，我會克制', '抱歉佔用頻道了', '對不起，已經關掉廣播', '我不再重複了，抱歉', '抱歉影響你看訊息',
        '不好意思，馬上停止', '對不起，讓大家困擾了', '抱歉，我會保持安靜', '了解，我不廣播了', '是我太吵了，對不起', '抱歉，我只是急著收東西', '不好意思，我會小聲點', '收到，我停止宣傳',
        '對不起，不會再洗頻了', '抱歉，我這就閉麥', '不好意思，造成打擾', '了解，接下來我會安靜', '對不起，我不再刷訊息', '抱歉，讓你的頻道被洗掉了', '我會停手，真的抱歉', '不好意思，是我太心急',
        '對不起，我沒有惡意', '抱歉，我馬上關掉廣播', '收到，之後不再打擾', '不好意思，我安靜等人來', '抱歉，我會耐心一點', '對不起，辛苦你提醒了', '好，我不喊了，抱歉', '不好意思，廣播已停止',
        '抱歉，我會注意頻率', '對不起，讓你不舒服了', '了解，謝謝提醒', '不好意思，我不再佔版面', '抱歉，接下來保持安靜', '收到，我會乖乖等', '對不起，我已經停止重播', '抱歉，是我宣傳過頭了',
        '不好意思，我不再吵大家', '了解，廣播到此為止', '對不起，我會改進', '抱歉，給你添麻煩了', '不好意思，我這就停', '收到，請別生氣', '對不起，打擾到你了', '抱歉，我會安靜等候'
    ];
    const SILENCE_SPICY_REPLIES = [
        '叫三小？', '來 PK 啊', '你算老幾？', '你很大聲欸', '不爽來奇岩外面', '少在那邊指揮', '我收東西礙到你喔', '有種報座標',
        '別哭啦', '安靜的是你吧', '你誰啦', '不要一副 GM 樣', '打字很兇喔', '來啊，單挑', '笑死，玻璃心喔', '我就喊，怎樣',
        '先問你等級多少', '別躲安全區嘴', '菜味很重喔', '懂不懂市場行情', '這頻道你開的？', '我喊我的，你練你的', '想管我先打贏', '你這麼急幹嘛',
        '怕吵可以關頻道', '看不爽就來', '喔是喔真的假的', '你先排隊啦', '講那麼多，不服來戰', '別在那邊裝大哥', '小聲點？你先啦', '已讀不回也要管？',
        '笑死，講得你好像很強', '你的存在感比掉寶率還低', '先把裝備穿好再嘴', '你那戰力也敢出聲喔', '喊你一下就破防？', '你很勇嘛，報名牌啊', '別急著丟臉', '你先去練等啦',
        '嘴很快，手速有跟上嗎', '別只會在安全區當高手', '你這氣勢只夠買紅水', '講那麼大聲，錢夠嗎', '你是不是沒人理才來管我', '我還以為是哪位大人物呢', '這麼兇，結果只會按抱怨', '別把自尊拿來拍賣',
        '你的意見我放倉庫了', '收到，完全不想聽', '再吵我加價收給你看', '你管天管地管不到我喊價', '先贏一場再教我安靜', '你這發言很有 Lv.1 的美感', '別鬧，市場不是給你哭的', '笑到我忘記要收什麼',
        '你這句話傷害大概 1 點', '你是不是把勇氣喝到嘴上了', '來啊，我站著等你', '你喊破喉嚨也不會變強', '嘴砲有安定值嗎', '你這氣勢連卷軸都點不亮', '別演了，大家都看著呢', '先存夠傳送費再兇'
    ];
    const OFFLINE_TAUNT_CHOICES = {
        lowPrice: [
            '出 {price} 金幣收 {item}，你是少打一個零嗎？',
            '這種價格也敢喊，你當整個頻道都是新手？',
            '{price} 金幣留著買紅水吧，別拿來侮辱 {item}。',
            '你的出價比掉寶率還難看，先去市場繞一圈。',
            '開這種破價還敢叫人密你，臉皮點幾的？',
            '收不起 {item} 就直說，不用在這裡裝行情大師。',
            '這價錢拿去買箭都嫌寒酸，別拿來喊 {item}。',
            '{item} 被你喊到像清倉廢料，拜託尊重一下物品。',
            '你這不是收購，是在公開示範什麼叫沒預算。',
            '出 {price} 金幣還敢喊那麼大聲，勇氣藥水喝太多？',
            '市場看到你這價格都想登出。',
            '別侮辱 {item}，它再爛也不是這個價。',
            '喊這種低價還裝老手，笑點比價格還低。',
            '{price} 金幣收 {item}？你是不是把倉庫當慈善箱。',
            '這價位連路過的新手都會搖頭。',
            '省錢不是問題，問題是你省到沒尊嚴。'
        ],
        price: [
            '{price} 金幣的行情是你夢裡查到的嗎？',
            '有錢喊價不代表你懂價格，先做點功課吧。',
            '你這價格很有自信，可惜看起來沒什麼常識。',
            '拿金幣砸頻道很帥嗎？先確定真的有人想賣。',
            '喊得像市場老大，結果價格一看就露餡。',
            '價格開成這樣，你是收裝還是在收笑話？',
            '你這價格像亂數骰出來的，還敢叫行情。',
            '喊價前先醒醒，別把夢裡的市場搬出來。',
            '{price} 金幣講得像很豪邁，實際看起來很外行。',
            '這價格不是盤，就是想找盤。',
            '你是不是把估價師點到負數了？',
            '行情不是靠你嘴硬就會成立。',
            '別用這種價格測大家智商。',
            '你喊價的自信，比你的市場觀念還誇張。',
            '價格開成這樣，我懷疑你連商店在哪都不知道。',
            '先學會算錢，再來當收購大師。'
        ],
        item: [
            '連 {item} 都要靠洗頻收，你平常到底在打什麼？',
            '為了 {item} 喊成這樣，看來你真的很缺。',
            '收個 {item} 也能這麼高調，你是怕沒人認識你？',
            '{item} 還沒收到，存在感倒是先刷滿了。',
            '你跟 {item} 哪一個比較難掉？我看是你的面子。',
            '一直喊 {item}，不知道的還以為你在解新手任務。',
            '你連 {item} 都收不到，還敢在這裡擺架子。',
            '為了 {item} 叫成這樣，場面真的很難看。',
            '{item} 還沒到手，你的名聲先掉光了。',
            '一直喊 {item}，是怕大家不知道你打不到嗎？',
            '你跟 {item} 的距離，大概比你跟強者還遠。',
            '收個 {item} 搞得像攻城宣戰，有必要嗎？',
            '{item} 不難，難的是忍受你一直喊。',
            '看你收 {item} 收成這樣，我都替你裝備難過。',
            '缺 {item} 就去打，別在這裡演悲情頻道主。',
            '{item} 聽到你喊價大概自己躲回倉庫。'
        ],
        spam: [
            '整個頻道都是你，收不到就安靜一點。',
            '喊這麼久還收不到，問題可能不是頻道。',
            '別再刷存在感了，大家早就看到你要收什麼。',
            '{town}不是你家的廣播台，少洗幾次行不行？',
            '收東西靠行情，不是靠把別人的訊息洗掉。',
            '你再喊下去，大家記住的只會是你很吵。',
            '{town} 的頻道快被你刷成個人頻道了。',
            '你這廣播頻率比怪物重生還煩。',
            '洗這麼久還沒人理，答案已經很明顯了。',
            '大家不是沒看到，是懶得理你。',
            '拜託把頻道還給正常人。',
            '你再喊下去，NPC 都想把你封鎖。',
            '收購不是靠音量，少刷一點。',
            '你把 {town} 當自己血盟頻道喔？',
            '刷到我都會背了，還是沒人賣你。',
            '你的廣播存在感很高，價值感很低。'
        ],
        strength: [
            '嘴那麼大聲，戰力有跟上嗎？',
            '先把裝備穿好，再來裝市場老大。',
            '你是來收裝，還是來證明自己很缺存在感？',
            '有本事出安全區講，別只會躲著喊。',
            '看你喊得這麼有力，我還以為你能單吃頭目。',
            '你這氣勢很強，可惜看起來只有頻道吃得到傷害。',
            '你這口氣很像會噴裝的人。',
            '少裝大尾，出村三步就知道答案。',
            '別只會嘴，武器拿穩再說。',
            '你那氣勢拿去打怪，大概怪都覺得吵。',
            '講得像王者，站姿像等救援。',
            '你這程度還想壓場，先壓住自己的嘴。',
            '別在頻道裝狠，傷害數字會說真話。',
            '你看起來比較適合躲倉庫，不適合嗆人。',
            '嘴巴點滿也不會加命中。',
            '你如果真的很強，就不會需要一直刷存在感。'
        ]
    };
    const OFFLINE_NPC_CHAT = {
        fierce: {
            open: ['叫三小？', '你又是哪位？', '嘴很秋喔，', '敢這樣講，'],
            end: ['不爽就來城外。', '有種報座標。', '別只會躲安全區。', '先打贏我再繼續嘴。']
        },
        proud: {
            open: ['笑死，', '就這？', '我還以為是哪位大人物，', '嘴完了嗎？'],
            end: ['先照照鏡子再回來。', '你的意見我先丟倉庫。', '再練幾級才比較有說服力。', '別急著在頻道丟臉。']
        },
        trader: {
            open: ['先學會看行情再開口，', '做生意不是靠你一張嘴，', '沒貨就別裝專家，', '市場看久一點再來，'],
            end: ['有東西就拿來，沒有就旁邊站。', '成交不了也輪不到你教我。', '行情不是你喊了算。', '別拿嘴巴當貨交。']
        },
        cool: {
            open: ['講完了嗎？', '嗯，然後呢？', '你很在意我喔，', '特地點我就為了這句？'],
            end: ['要賣就密，不賣就算了。', '我繼續收，你慢慢氣。', '別讓自己看起來更急。', '省點力氣去打怪吧。']
        }
    };
    const OFFLINE_NPC_REPLY_CORES = {
        price: [
            '我開 {price} 金幣，收不收輪不到你替別人決定。',
            '價格看不懂就別裝行情專家。',
            '嫌價格不合就別賣，市場又不是只有你。',
            '至少我金幣拿得出來，你有貨嗎？',
            '會嫌價的人很多，真的有 {item} 的沒幾個。'
        ],
        item: [
            '至少我收得起 {item}，你身上有嗎？',
            '打不到 {item} 才需要收，這道理很難懂？',
            '我要收什麼關你什麼事，先顧好自己的背包。',
            '{item} 還沒看到，倒是先看到你跑來刷存在感。',
            '有貨就拿出來，沒貨別拿嘴巴湊數。'
        ],
        spam: [
            '頻道又不是你租的，我喊我的，你可以不看。',
            '我每三分鐘才喊一次，這樣你就破防了？',
            '大家都沒說話，就你急著跳出來管。',
            '收得到自然就不喊，還用你提醒？',
            '嫌吵可以關頻道，別把自己當管理員。'
        ],
        strength: [
            '你 Lv.{level} 的自信，是哪隻怪掉的？',
            '{player}，先出安全區再說，別只讓鍵盤替你打。',
            '戰力先報出來，不然我以為在跟新手說話。',
            '嘴砲沒有命中加成，你喊再大聲也一樣。',
            '等你能單吃頭目，再來評論別人的裝備。'
        ]
    };
    const OFFLINE_NPC_REPEAT_OPENERS = ['同一套一直講，', '又是這句？', '你只會抓著這點喔？', '講第二次也不會比較有傷害，'];

    const RELIC_CATEGORIES = {
        weapon: { label: '武器遺物', short: '武器' },
        armor: { label: '防具遺物', short: '防具' },
        accessory: { label: '飾品遺物', short: '飾品' },
        unknown: { label: '未知遺物', short: '未知' }   // 🥚 v3.6.48 不限類型·必定搜到「圖鑑未收錄」的遺物（武防飾看 relicDex·蛋等道具型看 miscDex）；充滿詛咒/厄運氣息的蛋只進這個池
    };

    let _lastBroadcastCycles = Object.create(null);
    let _wanderBroadcastQueue = [];
    let _wanderBroadcastQueuedIds = new Set();
    let _wanderBroadcastTimer = null;
    let _wanderBroadcastLastAt = 0;
    let _lastMapSignature = '';
    let _classFrameCache = Object.create(null);
    let _wanderingShoutMenu = null;
    let _activeTauntChoices = null;
    const _wandererChatMemory = new Map();

    function _esc(s) {
        if (typeof _pandoraEsc === 'function') return _pandoraEsc(s);
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function _defaultState() {
        return {
            v: STORE_VERSION,
            seed: 'pb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10),
            seq: 0,
            lastCheckBucket: -1,
            diamonds: 0,
            wanderers: [],
            boards: [
                { contract: null, cooldownUntil: 0 },
                { contract: null, cooldownUntil: 0 },
                { contract: null, cooldownUntil: 0 }
            ],
            nameHistory: [],
            updatedAt: Date.now()
        };
    }

    function _normalizeState(value) {
        let st = value && typeof value === 'object' ? value : _defaultState();
        st.v = STORE_VERSION;
        if (!st.seed) st.seed = _defaultState().seed;
        st.seq = Math.max(0, Math.floor(Number(st.seq) || 0));
        st.lastCheckBucket = Number.isFinite(Number(st.lastCheckBucket)) ? Math.floor(Number(st.lastCheckBucket)) : -1;
        st.diamonds = Math.max(0, Math.floor(Number(st.diamonds) || 0));
        // v1 僅能保存全遊戲一名玩家 NPC；v2 改為每個符合條件的安全區各自最多一名；
        // v3 同一安全區可各有一位龍鑽／金幣收購 NPC。
        let oldWanderer = st.wanderer && typeof st.wanderer === 'object' ? st.wanderer : null;
        let wanderers = Array.isArray(st.wanderers) ? st.wanderers.slice() : [];
        if (oldWanderer) wanderers.push(oldWanderer);
        let seenTownCurrency = new Set();
        let seenId = new Set();
        st.wanderers = wanderers.filter(w => {
            if (!w || typeof w !== 'object' || !w.id || !w.townId) return false;
            let currency = w.currency === 'gold' ? 'gold' : 'diamond';
            let townCurrencyKey = currency + '|' + w.townId;
            if (seenTownCurrency.has(townCurrencyKey) || seenId.has(w.id)) return false;
            seenTownCurrency.add(townCurrencyKey);
            seenId.add(w.id);
            let spawnedAt = Math.max(0, Math.floor(Number(w.spawnedAt) || 0));
            let expiresAt = Math.max(0, Math.floor(Number(w.expiresAt) || 0));
            if (spawnedAt) w.expiresAt = Math.min(expiresAt || (spawnedAt + WANDERER_LIFE_MS), spawnedAt + WANDERER_LIFE_MS);
            w.currency = currency;   // 舊存檔未記錄幣別者一律視為原本的龍鑽收購。
            if (currency === 'gold') w.price = Math.max(1, Math.floor(Number(w.price) || 1));
            else w.reward = Math.max(1, Math.floor(Number(w.reward) || 1));
            w.alignmentValue = _normalizeAlignmentValue(w.alignmentValue);
            w.dismissed = !!w.dismissed;
            w.dismissedAt = w.dismissed ? Math.max(0, Math.floor(Number(w.dismissedAt) || 0)) : 0;
            w.broadcastStopped = !!w.broadcastStopped || w.dismissed;
            w.quietAt = Math.max(0, Math.floor(Number(w.quietAt) || 0));
            w.playerBlocked = !!w.playerBlocked;
            w.playerBlockedAt = w.playerBlocked ? Math.max(0, Math.floor(Number(w.playerBlockedAt) || 0)) : 0;
            return true;
        });
        delete st.wanderer;
        if (!Array.isArray(st.boards)) st.boards = [];
        st.boards = [0, 1, 2].map(i => {
            let b = st.boards[i] && typeof st.boards[i] === 'object' ? st.boards[i] : {};
            return {
                contract: b.contract && typeof b.contract === 'object' ? b.contract : null,
                cooldownUntil: Math.max(0, Math.floor(Number(b.cooldownUntil) || 0))
            };
        });
        delete st.equipmentProofUntil;   // 舊版「裝備僅查驗」資料不再使用；現在交易會直接消耗裝備。
        st.nameHistory = Array.isArray(st.nameHistory) ? st.nameHistory.filter(x => typeof x === 'string').slice(-20) : [];
        st.updatedAt = Math.max(0, Math.floor(Number(st.updatedAt) || 0));
        return st;
    }

    function _readState() {
        try {
            let raw = _lzGet(STORE_KEY);
            if (!raw) return _defaultState();
            let unwrapped = _saveUnwrap(raw);
            if (!unwrapped.ok) return _defaultState();
            return _normalizeState(JSON.parse(unwrapped.payload));
        } catch (e) {
            return _defaultState();
        }
    }

    function _writeState(st) {
        try {
            st.updatedAt = Date.now();
            return _lzSet(STORE_KEY, _saveWrap(JSON.stringify(_normalizeState(st)))) !== false;
        } catch (e) {
            return false;
        }
    }

    function _withStateLock(mutator) {
        let now = Date.now();
        let token = Math.random().toString(36).slice(2) + now.toString(36);
        let stamp = token + '|' + now;
        try {
            let old = _lsGet(LOCK_KEY);
            if (old) {
                let p = old.lastIndexOf('|');
                let oldAt = p >= 0 ? Number(old.slice(p + 1)) : 0;
                if (oldAt && now - oldAt < 5000) return { ok: false, busy: true };
            }
            _lsSet(LOCK_KEY, stamp);
            if (_lsGet(LOCK_KEY) !== stamp) return { ok: false, busy: true };
            let st = _readState();
            let result = mutator(st) || {};
            if (result.commit === false) return Object.assign({ ok: false, state: st }, result);
            if (!_writeState(st)) {
                // ⚠️ mutator 內若已對倉庫/背包做過「已經落盤」的破壞性變更（_consumeMatchedItems），
                //    共用狀態寫入失敗時必須把它還原，否則玩家物品被吃掉卻沒拿到鑽石／遺物。
                try { if (typeof result.rollback === 'function') result.rollback(); } catch (e) {}
                return { ok: false, error: '共用資料儲存失敗，請稍後重試。', state: st };
            }
            return Object.assign({ ok: true, state: st }, result);
        } catch (e) {
            return { ok: false, error: '共用資料暫時忙碌，請稍後重試。' };
        } finally {
            try { if (_lsGet(LOCK_KEY) === stamp) _lsRemove(LOCK_KEY); } catch (e) {}
        }
    }

    function _rand(st, tag) {
        let n = st.seq++;
        return _seededFloat(st.seed + '|' + n + '|' + String(tag || ''));
    }

    function _pick(st, list, tag) {
        if (!list || !list.length) return null;
        return list[Math.floor(_rand(st, tag) * list.length) % list.length];
    }

    function _pickSilenceReply(forceSpicy) {
        let spicy = !!forceSpicy || Math.random() < 0.8;
        let list = spicy ? SILENCE_SPICY_REPLIES : SILENCE_APOLOGIES;
        return { text: list[Math.floor(Math.random() * list.length)], spicy: spicy };
    }

    function _pickSilenceComplaint(w) {
        let isGoldBuyer = _wandererCurrency(w) === 'gold';
        let d = isGoldBuyer && typeof DB !== 'undefined' && DB.items ? DB.items[w.itemId] : null;
        let basePrice = Math.max(0, Math.floor(Number(d && d.p) || 0));
        let offeredPrice = isGoldBuyer ? _goldBuyerPrice(w) : 0;
        let belowBase = isGoldBuyer && offeredPrice < basePrice;
        let useLowPriceComplaint = belowBase || (isGoldBuyer && offeredPrice > basePrice && Math.random() < 0.30);
        let list = useLowPriceComplaint ? LOW_PRICE_COMPLAINTS : SILENCE_COMPLAINTS;
        return list[Math.floor(Math.random() * list.length)];
    }

    function _normalizeAlignmentValue(v) {
        if (typeof pvpClampAlignment === 'function') return pvpClampAlignment(v);
        v = Math.round(Number(v) || 0);
        return Math.max(-32767, Math.min(32767, v));
    }

    function _isEvilAlignmentValue(v) {
        let a = _normalizeAlignmentValue(v);
        let evilLine = (typeof PVP_ALIGN_EVIL !== 'undefined') ? PVP_ALIGN_EVIL : -1000;
        return a <= evilLine;
    }

    function _tauntChaseRate(alignmentValue) {
        let alignment = _normalizeAlignmentValue(alignmentValue);
        let evilLine = (typeof PVP_ALIGN_EVIL !== 'undefined') ? PVP_ALIGN_EVIL : -1000;
        let justiceLine = (typeof PVP_ALIGN_JUSTICE !== 'undefined') ? PVP_ALIGN_JUSTICE : 1000;
        if (alignment <= evilLine) return 1;
        if (alignment >= justiceLine) return 0.2;
        return 0.5;
    }

    function _logWandererBlocked(w) {
        if (typeof logSys !== 'function') return;
        logSys('<span class="text-slate-400">你已被對方封鎖</span>');
    }

    function _startWandererChase(w) {
        if (!w || typeof player === 'undefined' || !player || !player.cls) return false;
        if (!Array.isArray(player.trollPlayers)) player.trollPlayers = [];
        let old = player.trollPlayers.find(t => t && t.n === w.name);
        let alignmentValue = (typeof pvpLockAlignment === 'function')
            ? pvpLockAlignment(w.name, w.alignmentValue, old && old.clanId)
            : _normalizeAlignmentValue(w.alignmentValue);
        let chase = {
            n: w.name,
            avatar: w.avatar || '男戰士',
            alignmentValue: alignmentValue,
            until: Date.now() + 2 * 60 * 60 * 1000
        };
        if (old && Number.isFinite(Number(old.levelOffset))) chase.levelOffset = old.levelOffset;
        player.trollPlayers = player.trollPlayers.filter(t => t && t.n !== w.name);
        player.trollPlayers.push(chase);
        let quietResult = _stopWanderingBroadcast(w.id);
        if (quietResult && !quietResult.gone) _lastBroadcastCycles[w.id] = 'quiet';
        try { if (typeof saveGame === 'function') saveGame(); } catch (e) {}
        return true;
    }

    function pandoraUpdateWandererAlignment(name, alignmentValue) {
        name = String(name || '').slice(0, 24);
        if (!name) return false;
        let value = _normalizeAlignmentValue(alignmentValue);
        let result = _withStateLock(st => {
            let changed = false;
            (st.wanderers || []).forEach(w => {
                if (!w || String(w.name || '').slice(0, 24) !== name || w.alignmentValue === value) return;
                w.alignmentValue = value;
                changed = true;
            });
            return changed ? { alignmentValue:value } : { commit:false, unchanged:true };
        });
        return !!(result && result.ok);
    }

    function _blockPlayerForWanderer(wandererId) {
        return _withStateLock(st => {
            let w = _findWanderer(st, wandererId);
            if (!_wandererPresent(w)) return { commit: false, gone: true };
            if (w.playerBlocked) return { commit: false, already: true, name: w.name };
            w.playerBlocked = true;
            w.playerBlockedAt = Date.now();
            return { name: w.name };
        });
    }

    function _makeAlignmentValue(st) {
        return _normalizeAlignmentValue(Math.floor(-32767 + _rand(st, 'wander-alignment') * 65535));
    }

    // 🛡️ v3.6.80 叫賣收購 NPC 也接血盟世界（比照 js/26 世界頻道）：50% 隨機入 20 個 NPC 血盟之一，無盟者不顯示。
    //   ⚠️ 採「懶指派」而非建立時寫入：血盟成員資格是**以名字為 key** 存在血盟共用桶（world.memberships），
    //      第一次查會擲骰並寫入、之後同名一律回傳同一個盟 → 不必動 wanderer 存檔結構，既有的叫賣 NPC 也一起涵蓋。
    //   ⚠️ 必須傳 noLeader:true：npcClanAssignOpponent 有 8% 機率把對象換成盟主「連名字一起換」，
    //      而叫賣 NPC 的名字已寫進交易紀錄與已發出的廣播，改名會前後對不上。
    //   ⚠️ _readState() 每次都回傳新物件 → 不能把結果快取在 w 上，改用名字為鍵的模組層快取（省下每次重繪的共用桶鎖）。
    let _wandererClanCache = Object.create(null);
    function _wandererClanName(w) {
        let n = w && w.name ? String(w.name) : '';
        if (!n) return '';
        if (Object.prototype.hasOwnProperty.call(_wandererClanCache, n)) return _wandererClanCache[n];
        let clan = '';
        if (typeof npcClanAssignOpponent === 'function' && typeof player !== 'undefined' && player && player.cls) {
            try {
                let res = npcClanAssignOpponent({
                    n: n,
                    avatar: w.avatar || '男戰士',
                    alignmentValue: _normalizeAlignmentValue(w.alignmentValue),
                    levelOffset: 0,
                    pvpRandom: true
                }, { noLeader: true });
                if (res && res.n === n) clan = res.clanName || '';   // 名字被改掉＝非預期，寧可不顯示也不要張冠李戴
            } catch (e) {}
        } else {
            return '';   // 尚未載入角色（血盟世界還沒建立）→ 不快取，等進遊戲後再查
        }
        _wandererClanCache[n] = clan;
        return clan;
    }
    function _wandererClanRowHtml(w) {
        let clan = _wandererClanName(w);
        return clan ? `<div class="wc-menu-clan">［${_esc(clan)}］</div>` : '';   // 無盟＝整條不輸出
    }

    function _wandererNameHtml(w) {
        let a = _normalizeAlignmentValue(w && w.alignmentValue);
        let n = w && w.name ? w.name : '';
        return (typeof pvpNameHtml === 'function') ? pvpNameHtml(n, a, 'font-bold') : `<span class="font-bold">${_esc(n)}</span>`;
    }

    function _chatHash(text) {
        let h = 2166136261;
        text = String(text || '');
        for (let i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function _chatMemoryFor(w) {
        let id = String(w && w.id || '');
        let memory = _wandererChatMemory.get(id);
        if (!memory) {
            memory = { turns: 0, lastIntent: '', used: Object.create(null), touchedAt: Date.now() };
            _wandererChatMemory.set(id, memory);
        }
        memory.touchedAt = Date.now();
        if (_wandererChatMemory.size > 20) {
            let oldestId = '', oldestAt = Infinity;
            _wandererChatMemory.forEach((entry, entryId) => {
                if (entryId !== id && entry.touchedAt < oldestAt) {
                    oldestAt = entry.touchedAt;
                    oldestId = entryId;
                }
            });
            if (oldestId) _wandererChatMemory.delete(oldestId);
        }
        return memory;
    }

    function _chatPick(memory, key, list) {
        if (!Array.isArray(list) || !list.length) return '';
        let recent = memory.used[key] || [];
        let available = list.filter(text => !recent.includes(text));
        if (!available.length) available = list.slice();
        let picked = available[Math.floor(Math.random() * available.length)] || available[0];
        recent.push(picked);
        memory.used[key] = recent.slice(-Math.min(4, Math.max(1, list.length - 1)));
        return picked;
    }

    function _chatContext(w) {
        let d = (typeof DB !== 'undefined' && DB.items) ? DB.items[w.itemId] : null;
        let isGold = _wandererCurrency(w) === 'gold';
        return {
            item: _requirementText(w.itemId, w.en),
            price: isGold ? _goldBuyerPrice(w).toLocaleString() : '龍之鑽石',
            town: _townName(w.townId),
            player: (typeof player !== 'undefined' && player && player.name) ? player.name : '你',
            level: Math.max(1, Math.floor(Number(typeof player !== 'undefined' && player && player.lv) || 1)),
            basePrice: Math.max(0, Math.floor(Number(d && d.p) || 0)),
            isGold: isGold
        };
    }

    function _chatFill(template, ctx) {
        return String(template || '').replace(/\{(item|price|town|player|level)\}/g, (_, key) => String(ctx[key] == null ? '' : ctx[key]));
    }

    function _chatPersona(w) {
        if (_isEvilAlignmentValue(w && w.alignmentValue)) return 'fierce';
        let alignment = _normalizeAlignmentValue(w && w.alignmentValue);
        let pool = alignment >= 1000 ? ['cool', 'trader'] : ['proud', 'trader', 'cool'];
        return pool[_chatHash((w && w.id) + '|persona') % pool.length];
    }

    function _buildOfflineTauntChoices(w) {
        let memory = _chatMemoryFor(w);
        let ctx = _chatContext(w);
        let pools = [];
        if (ctx.isGold) {
            let low = ctx.basePrice > 0 && _goldBuyerPrice(w) < ctx.basePrice;
            pools.push({ intent: 'price', key: low ? 'lowPrice' : 'price' });
        } else {
            pools.push({ intent: 'item', key: 'item' });
        }
        pools.push({ intent: 'spam', key: 'spam' }, { intent: 'strength', key: 'strength' });
        return pools.map(entry => ({
            intent: entry.intent,
            text: _chatFill(_chatPick(memory, 'choice-' + entry.key, OFFLINE_TAUNT_CHOICES[entry.key]), ctx)
        }));
    }

    function _buildOfflineNpcReply(w, choice) {
        let memory = _chatMemoryFor(w);
        let ctx = _chatContext(w);
        let personaKey = _chatPersona(w);
        let persona = OFFLINE_NPC_CHAT[personaKey];
        let repeated = memory.lastIntent === choice.intent;
        let opener = repeated
            ? _chatPick(memory, 'repeat-open', OFFLINE_NPC_REPEAT_OPENERS)
            : _chatPick(memory, 'open-' + personaKey, persona.open);
        let core = _chatPick(memory, 'reply-' + choice.intent, OFFLINE_NPC_REPLY_CORES[choice.intent] || OFFLINE_NPC_REPLY_CORES.item);
        let ending = memory.turns > 0 ? _chatPick(memory, 'end-' + personaKey, persona.end) : '';
        memory.turns += 1;
        memory.lastIntent = choice.intent;
        return _chatFill(opener + core + ending, ctx);
    }

    function _isEquipmentDef(d) {
        if (!d) return false;
        return d.type === 'wpn' || d.type === 'arm' || d.type === 'acc' || d.slot === 'petwpn' || d.slot === 'petarm';
    }

    function _isEnhanceableDef(d) {
        return _isEquipmentDef(d) && !d.noEnhance && !d.isArrow && Number.isFinite(Number(d.safe));
    }

    function _safeValue(d) {
        return Math.max(0, Math.min(20, Math.floor(Number(d && d.safe) || 0)));
    }

    function _wandererCurrency(w) {
        return w && w.currency === 'gold' ? 'gold' : 'diamond';
    }

    function _goldBuyerPrice(w) {
        return Math.max(1, Math.floor(Number(w && w.price) || 1));
    }

    function _makeGoldBuyerPrice(st, d, mult, alignmentValue) {
        let basePrice = Math.max(1, Math.floor(Math.max(0, Number(d && d.p) || 0)));
        mult = Math.max(1, Number(mult) || 1);
        let lowball = basePrice > 1
            && _isEvilAlignmentValue(alignmentValue)
            && _rand(st, 'wander-gold-lowball') < 0.5;
        let rollMax = lowball
            ? Math.max(1, Math.floor((basePrice - 1) / mult))
            : Math.max(1, basePrice * 50);
        let rolledPrice = 1 + Math.floor(_rand(st, 'wander-gold-price') * rollMax);
        let price = Math.max(1, Math.floor(rolledPrice * mult));
        return lowball ? Math.min(basePrice - 1, price) : price;
    }

    function _buyerTitle(w) {
        return _wandererCurrency(w) === 'gold' ? '金幣收購' : '龍鑽收購';
    }

    function _requirementText(id, en) {
        let d = DB.items[id];
        if (!d) return id;
        return (en == null ? '' : ('+' + en + ' ')) + d.n;
    }

    function _townName(id) {
        return DB.towns && DB.towns[id] ? DB.towns[id].n : id;
    }

    function _eligibleTowns() {
        if (typeof DB === 'undefined' || !DB.towns) return [];
        return Object.keys(DB.towns).filter(id => {
            let t = DB.towns[id];
            if (!t || EXCLUDED_TOWNS.has(id)) return false;
            let name = String(t.n || '');
            return !EXCLUDED_TOWN_NAMES.some(x => name.includes(x));
        });
    }

    function _wandererItemPool(currency) {
        if (typeof DB === 'undefined' || !DB.items) return [];
        let maxWeight = currency === 'gold' ? 80 : 10;
        return Object.keys(DB.items).filter(id => {
            let d = DB.items[id];
            let w = Math.floor(Number(d && d.gachaWeight) || 0);
            return !!(d && d.n && !d.relic && w >= 1 && w <= maxWeight);
        });
    }

    function _pickWeightedWandererItem(st, items, tag) {
        let pool = (items || []).map(id => ({
            id: id,
            weight: Math.max(0, Number(DB.items[id] && DB.items[id].gachaWeight) || 0)
        })).filter(entry => entry.weight > 0);
        if (!pool.length) return null;
        let roll = _rand(st, tag) * pool.reduce((sum, entry) => sum + entry.weight, 0);
        for (let entry of pool) {
            roll -= entry.weight;
            if (roll < 0) return entry.id;
        }
        return pool[pool.length - 1].id;
    }

    function _pickWandererItem(st, currency) {
        let items = _wandererItemPool(currency);
        if (!items.length) return null;
        let wantCard = _rand(st, 'wander-item-kind|' + currency) < WANDERER_CARD_CHANCE;
        let categoryPool = items.filter(id => (DB.items[id] && DB.items[id].eff === 'card') === wantCard);
        if (!categoryPool.length) categoryPool = items;
        return _pickWeightedWandererItem(st, categoryPool, 'wander-item|' + currency + '|' + (wantCard ? 'card' : 'normal'));
    }

    function _makeName(st) {
        let history = new Set(st.nameHistory || []);
        let made = '';
        for (let tries = 0; tries < 12; tries++) {
            made = (typeof pvpRandomNameWith === 'function')
                ? pvpRandomNameWith(() => _rand(st, 'name-pvp'))
                : (typeof pvpRandomName === 'function' ? pvpRandomName() : ('玩家' + Math.floor(_rand(st, 'name-fallback') * 100000)));
            if (!history.has(made)) break;
        }
        st.nameHistory.push(made);
        st.nameHistory = st.nameHistory.slice(-20);
        return made;
    }

    function _makeWanderer(st, now, townId, currency) {
        let towns = _eligibleTowns();
        currency = currency === 'gold' ? 'gold' : 'diamond';
        if (!towns.length) return null;
        if (!townId || !towns.includes(townId)) townId = _pick(st, towns, 'wander-town');
        let itemId = _pickWandererItem(st, currency);
        if (!itemId) return null;
        let d = DB.items[itemId];
        let en = null;
        if (_isEnhanceableDef(d)) {
            let max = _safeValue(d) + 3;
            en = Math.floor(_rand(st, 'wander-enhance') * (max + 1));
        }
        let weight = Math.max(1, Math.min(currency === 'gold' ? 80 : 10, Math.floor(Number(d.gachaWeight) || 10)));
        let over = en == null ? 0 : Math.max(0, en - _safeValue(d));
        let mult = over === 1 ? 1.2 : over === 2 ? 1.5 : over >= 3 ? 2 : 1;
        let buyer = {
            id: 'wander-' + currency + '-' + now.toString(36) + '-' + Math.floor(_rand(st, 'wander-id|' + currency) * 0xffffff).toString(36),
            townId: townId,
            name: _makeName(st),
            avatar: _pick(st, PLAYER_AVATARS, 'wander-avatar'),
            alignmentValue: _makeAlignmentValue(st),
            currency: currency,
            itemId: itemId,
            en: en,
            weight: weight,
            spawnedAt: now,
            expiresAt: now + WANDERER_LIFE_MS,
            broadcastStopped: false,
            quietAt: 0,
            dismissed: false,
            dismissedAt: 0
        };
        if (currency === 'gold') {
            buyer.price = _makeGoldBuyerPrice(st, d, mult, buyer.alignmentValue);
        } else {
            buyer.reward = Math.max(1, Math.ceil((11 - weight) * mult));
        }
        return buyer;
    }

    function _activeSignature(wanderers) {
        if (!Array.isArray(wanderers)) return '';
        return wanderers
            .filter(w => w && w.id && w.townId)
            .map(w => [w.id, _wandererCurrency(w), w.townId, w.expiresAt, w.dismissed ? 1 : 0].join('|'))
            .sort()
            .join('||');
    }

    function _findWanderer(st, wandererId) {
        if (!st || !Array.isArray(st.wanderers)) return null;
        return st.wanderers.find(w => w && w.id === wandererId) || null;
    }

    function _wandererPresent(w, now) {
        return !!(w && !w.dismissed && Number(w.expiresAt) > (now == null ? Date.now() : now));
    }

    function _findWanderersForTown(st, townId) {
        if (!st || !Array.isArray(st.wanderers)) return [];
        return st.wanderers
            .filter(w => w && w.townId === townId && _wandererPresent(w))
            .sort((a, b) => _wandererCurrency(a).localeCompare(_wandererCurrency(b)) || String(a.id).localeCompare(String(b.id)));
    }

    function _findWandererForTown(st, townId) {
        return _findWanderersForTown(st, townId)[0] || null;
    }

    function _currentTownWanderer(st) {
        let townId = typeof mapState !== 'undefined' && mapState ? mapState.current : '';
        return _findWandererForTown(st, townId);
    }

    function _wanderBroadcastGapMs() {
        return 10000 + Math.floor(Math.random() * 10001);
    }

    function _queuedLiveWanderer(wandererId) {
        if (typeof player === 'undefined' || !player || typeof logWorld !== 'function') return null;
        if (typeof state !== 'undefined' && state && state.ff) return null;
        let live = _findWanderer(_readState(), wandererId);
        return _wandererPresent(live) && !live.broadcastStopped ? live : null;
    }

    function _runWanderBroadcastQueue() {
        _wanderBroadcastTimer = null;
        // 🐛 v3.7.70 補跑期間不要把佇列吃掉：_queuedLiveWanderer 在 state.ff 時對「所有人」都回 null，
        //    下面的 while 會把整條佇列 shift 光卻一句都沒印 → 那批喊話直接消失（且 _announceWanderer
        //    已先寫了 _lastBroadcastCycles，要等下一個 5 分鐘週期才會再喊）＝回到遊戲時世界頻道空空的。
        //    改成「補跑中就延後重試」，等 ff 結束再照常輪播。
        if (typeof state !== 'undefined' && state && state.ff) {
            if (_wanderBroadcastQueue.length) _wanderBroadcastTimer = setTimeout(_runWanderBroadcastQueue, _wanderBroadcastGapMs());
            return;
        }
        let live = null;
        while (_wanderBroadcastQueue.length && !live) {
            let wandererId = _wanderBroadcastQueue.shift();
            _wanderBroadcastQueuedIds.delete(wandererId);
            live = _queuedLiveWanderer(wandererId);
        }
        if (live) {
            logWorld(_broadcastLineHTML(live));
            _wanderBroadcastLastAt = Date.now();
        }
        if (!_wanderBroadcastQueue.length) return;
        _wanderBroadcastTimer = setTimeout(_runWanderBroadcastQueue, _wanderBroadcastGapMs());
    }

    function _queueWanderBroadcast(w) {
        let wandererId = String(w && w.id || '');
        if (!wandererId || _wanderBroadcastQueuedIds.has(wandererId)) return;
        _wanderBroadcastQueuedIds.add(wandererId);
        _wanderBroadcastQueue.push(wandererId);
        if (_wanderBroadcastTimer) return;

        let sinceLast = Date.now() - _wanderBroadcastLastAt;
        if (!_wanderBroadcastLastAt || sinceLast >= 10000) {
            _runWanderBroadcastQueue();
            return;
        }
        _wanderBroadcastTimer = setTimeout(_runWanderBroadcastQueue, _wanderBroadcastGapMs());
    }

    function _announceWanderer(w) {
        // ⚠️ 到期守衛放在這裡＝單一真相：tick 路徑（_normalizeState 已濾）與 storage 多開同步路徑共用。
        //    WANDERER_LIFE_MS(2h) 剛好是 BROADCAST_MS(5min) 的整數倍，cycle 邊界正好落在到期瞬間，
        //    去重必然放行 → 另一分頁寫入時會替「已到期但本頁還沒 tick 清掉」的叫賣者重播喊話。
        if (!_wandererPresent(w) || w.broadcastStopped) return;
        if (typeof player === 'undefined' || !player || typeof logSys !== 'function') return;
        if (typeof state !== 'undefined' && state && state.ff) return;
        let spawnedAt = Math.max(0, Number(w.spawnedAt) || Date.now());
        let offset = _wandererCurrency(w) === 'gold' ? GOLD_BROADCAST_OFFSET_MS : 0;
        let elapsed = Date.now() - spawnedAt - offset;
        if (elapsed < 0) return;
        let cycle = Math.floor(elapsed / BROADCAST_MS);
        if (_lastBroadcastCycles[w.id] === cycle) return;
        // 📌 v3.5.77 已釘在日誌頂端者不再重複廣播（訊息本來就一直看得到，重播只會洗版）；
        //    首次到場的喊話仍照舊進日誌，排隊中（第 3 位以後）也維持每 5 分鐘的廣播，才不會完全看不到。
        if (cycle > 0 && _pinnedWandererIds().has(w.id)) { _lastBroadcastCycles[w.id] = cycle; return; }
        _lastBroadcastCycles[w.id] = cycle;
        // 名稱可點擊；可傳送、嘲諷，選擇「吵死了」後只會停止這名玩家後續的廣播。
        _queueWanderBroadcast(w);
    }

    // ===== 📌 v3.5.77 叫賣訊息釘選列（用戶指定）=====
    // 目前正在叫賣（未被喊停、未離場）的 NPC；依到場先後排序＝釘選位固定，前面的人離開才輪到後面的人。
    function _activeBroadcasters(st) {
        let now = Date.now();
        let list = (st && Array.isArray(st.wanderers)) ? st.wanderers : [];
        return list
            .filter(w => w && w.id && !w.broadcastStopped && _wandererPresent(w, now))
            .sort((a, b) => ((Number(a.spawnedAt) || 0) - (Number(b.spawnedAt) || 0)) || String(a.id).localeCompare(String(b.id)));
    }

    function _pinnedWanderers(st) {
        return _activeBroadcasters(st || _readState()).slice(0, BROADCAST_PIN_MAX);
    }

    // 目前釘選中的 id 快取：由 renderWanderBroadcastPins 更新（廣播前一定先重畫），供 _announceWanderer 判斷免重播。
    let _pinnedIdSet = new Set();
    function _pinnedWandererIds() { return _pinnedIdSet; }

    // 釘選中最早的離場時間：讓 1 秒定時器只在「真的有人到期」的那一刻重畫（免每秒解壓讀共用狀態），
    // 否則離場遞補要等最多 30 秒的 wanderingBuyerSystemTick，中間會顯示已經不在的人。
    let _pinExpiryDue = 0;
    function _pinExpiryWatch() {
        if (!_pinExpiryDue || Date.now() < _pinExpiryDue) return;
        _pinExpiryDue = 0;
        renderWanderBroadcastPins();
    }

    function _broadcastLineHTML(w) {
        let offer = _wandererCurrency(w) === 'gold'
            ? `收 ${_esc(_requirementText(w.itemId, w.en))} ${_goldBuyerPrice(w).toLocaleString()} 金幣`
            : `鑽收 ${_esc(_requirementText(w.itemId, w.en))}`;
        return `<button type="button" class="wander-broadcast-name" ` +
            `onclick="openWanderingShoutMenu('${_esc(w.id)}',event)">${_wandererNameHtml(w)}</button>` +
            `<span class="wander-broadcast-text">：${offer}，人在 ` +
            `<span class="text-amber-200">${_esc(_townName(w.townId))}</span>，意者密</span>`;
    }

    // 重畫釘選列：最多 BROADCAST_PIN_MAX 條常駐在日誌頂端；空的時候 CSS :empty 會自動收起整條。
    // 簽章 early-return＝每 30 秒的 tick 不會無謂重建 DOM（重建會弄掉滑鼠停留/選單狀態）。
    function renderWanderBroadcastPins(st) {
        let list = _pinnedWanderers(st);
        let el = (typeof document !== 'undefined') ? document.getElementById('sys-log-pins') : null;
        // ⚠️ 沒有釘選列的頁面（例如舊版 HTML）：快取要清空，否則「被當成已釘選→免廣播」而釘選列又不存在＝這兩位徹底消失
        _pinnedIdSet = el ? new Set(list.map(w => w.id)) : new Set();
        _pinExpiryDue = el && list.length ? Math.min.apply(null, list.map(w => Number(w.expiresAt) || 0)) : 0;
        if (!el) return;
        let sig = list.map(w => [w.id, _wandererCurrency(w), w.itemId, w.en, w.price, w.townId].join('|')).join('||');
        if (el._pinSig === sig) return;
        el._pinSig = sig;
        el.innerHTML = list.map(w =>
            `<div class="wander-pin"><span class="wander-pin-tag">${_esc(_buyerTitle(w))}</span>` +
            `<span class="wander-pin-body">${_broadcastLineHTML(w)}</span></div>`
        ).join('');
    }

    function _refreshTownMapIfNeeded(signature) {
        if (signature === _lastMapSignature) return;
        _lastMapSignature = signature;
        try {
            if (typeof mapState !== 'undefined' && mapState && String(mapState.current || '').startsWith('town_') &&
                typeof renderTownNPCMap === 'function') {
                renderTownNPCMap(mapState.current);
            }
        } catch (e) {}
    }

    function wanderingBuyerSystemTick() {
        if (typeof DB === 'undefined' || !DB.items || !DB.towns) return;
        let now = Date.now();
        let bucket = Math.floor(now / CHECK_MS);
        let before = _readState();
        let beforeSig = _activeSignature(before.wanderers);
        let result = _withStateLock(st => {
            let changed = false;
            let active = st.wanderers.filter(w => w && Number(w.expiresAt) > now);
            if (active.length !== st.wanderers.length) {
                st.wanderers = active;
                changed = true;
            }
            if (st.lastCheckBucket !== bucket) {
                st.lastCheckBucket = bucket;
                changed = true;
                [
                    { currency: 'diamond', chance: WANDERER_CHANCE },
                    { currency: 'gold', chance: GOLD_WANDERER_CHANCE }
                ].forEach(kind => {
                    let occupiedTowns = new Set(st.wanderers
                        .filter(w => _wandererCurrency(w) === kind.currency)
                        .map(w => w.townId));
                    let availableTowns = _eligibleTowns().filter(id => !occupiedTowns.has(id));
                    if (availableTowns.length && _rand(st, 'wander-roll|' + kind.currency + '|' + bucket) < kind.chance) {
                        let townId = _pick(st, availableTowns, 'wander-town|' + kind.currency + '|' + bucket);
                        let made = _makeWanderer(st, now, townId, kind.currency);
                        if (made) st.wanderers.push(made);
                    }
                });
            }
            return changed ? {} : { commit: false, unchanged: true };
        });
        let latest = result.state || _readState();
        // 已離場的叫賣者不再需要週期記錄，避免每次生成新 ID 都永久保留一筆。
        let activeIds = new Set(latest.wanderers.filter(w => _wandererPresent(w, now)).map(w => w.id));
        for (let id of Object.keys(_lastBroadcastCycles)) {
            if (!activeIds.has(id)) delete _lastBroadcastCycles[id];
        }
        let sig = _activeSignature(latest.wanderers);
        if (sig !== beforeSig || sig !== _lastMapSignature) _refreshTownMapIfNeeded(sig);
        renderWanderBroadcastPins(latest);   // 📌 v3.5.77 先更新釘選列（新到場/離場遞補），_announceWanderer 才知道誰已釘選不必重播
        latest.wanderers
            .filter(w => _wandererPresent(w, now))
            .forEach(_announceWanderer);
    }

    function getWanderingBuyersForTown(townId) {
        let st = _readState();
        let list = _findWanderersForTown(st, townId);
        return list.map((w, index) => Object.assign({
            _wanderer: true,
            _wandererIndex: index,
            _wandererCount: list.length,
            n: w.name,
            title: _buyerTitle(w)
        }, w));
    }

    function getWanderingBuyerForTown(townId) {
        return getWanderingBuyersForTown(townId)[0] || null;
    }

    function wanderingBuyerSpriteData(w) {
        // 🎲 v3.5.52 三方向隨機 idle：依 wanderer id 雜湊決定論選 右('')/正面('F')/左('2') classanim 資料夾——同一位 NPC 重繪/跨分頁方向固定，不同 NPC 隨機
        let _dirs = ['', 'F', '2'];
        let _sid = String((w && w.id) || ''), _h = 0;
        for (let i = 0; i < _sid.length; i++) _h = (_h * 31 + _sid.charCodeAt(i)) >>> 0;
        let folder = String((w && w.avatar) || '男騎士') + _dirs[_h % 3];
        let key = folder + '|idle';
        if (!_classFrameCache[key]) {
            let base = 'assets/classanim/' + folder;
            let manifest = (typeof ANIM_MANIFEST !== 'undefined' && ANIM_MANIFEST) ? ANIM_MANIFEST[base] : null;
            let count = Math.max(1, Math.floor(Number(manifest && manifest.unarmed_idle_) || 8));
            let frames = [], shadows = [];
            for (let i = 0; i < count; i++) {
                let body = new Image();
                body.src = base + '/unarmed_idle_' + i + '.png';
                frames.push(body);
                let shadow = new Image();
                shadow.src = base + '/unarmed_idle_s_' + i + '.png';
                shadows.push(shadow);
            }
            _classFrameCache[key] = { folder: folder, frames: frames, shadows: shadows };
        }
        return _classFrameCache[key];
    }

    function _findMatches(requirements, st) {
        let inv = (typeof player !== 'undefined' && player && Array.isArray(player.inv)) ? player.inv : [];
        let warehouse = [];
        try {
            if (typeof loadWarehouse === 'function') {
                let w = loadWarehouse();
                warehouse = w && Array.isArray(w.items) ? w.items : [];
            }
        } catch (e) {}
        let sources = [
            { name: 'inventory', items: inv },
            { name: 'warehouse', items: warehouse }
        ];
        let used = new Set();
        let matches = [];
        for (let req of requirements) {
            let found = null;
            for (let source of sources) {
                for (let i = 0; i < source.items.length; i++) {
                    let usedKey = source.name + ':' + i;
                    if (used.has(usedKey)) continue;
                    let it = source.items[i];
                    let count = Math.floor(Number(it && it.cnt));
                    if (!Number.isFinite(count) || count < 1) count = it ? 1 : 0;
                    if (!it || it.id !== req.id || count < 1) continue;
                    if (req.en != null && Math.floor(Number(it.en) || 0) !== Math.floor(Number(req.en) || 0)) continue;
                    found = { source: source.name, index: i, item: it, usedKey: usedKey };
                    break;
                }
                if (found) break;
            }
            if (!found) return { ok: false, matches: matches, missing: req };
            used.add(found.usedKey);
            matches.push({ source: found.source, index: found.index, item: found.item, req: req });
        }
        return { ok: true, matches: matches };
    }

    // 🛡️ 交付前快照倉庫與背包，回傳一個還原函式（供 _withStateLock 在共用狀態寫入失敗時呼叫）。
    function _snapshotItemState() {
        let wh = null, inv = null;
        try { wh = JSON.parse(JSON.stringify(loadWarehouse())); } catch (e) {}
        try { inv = JSON.parse(JSON.stringify(player.inv || [])); } catch (e) {}
        return function () {
            // 🪦 v3.5.94 還原倉庫前必須先 loadWarehouse() 重新整理 js/12 的 _whLoadUids 快照。
            //    否則：_consumeMatchedItems 落盤刪除時 saveWarehouse 已替該 uid 寫下墓碑（js/12:138-141），
            //    而 _whLoadUids 仍停在「消耗前」的集合、仍含該 uid → 回滾寫回時被 js/12:118-122 的墓碑過濾
            //    判為「快照殘留＝已被領出」直接丟棄，且 saveWarehouse 照樣回 true，這裡的 try/catch 完全察覺不到。
            //    先重讀一次讓 _whLoadUids 變成「消耗後」的集合，該 uid 不在其中 → 走「合法回歸」分支自動解墓碑並保留。
            try { if (wh && typeof loadWarehouse === 'function') loadWarehouse(); } catch (e) {}
            try { if (wh) saveWarehouse(wh); } catch (e) {}
            try { if (inv) player.inv = inv; } catch (e) {}
            try { if (typeof renderTabs === 'function') renderTabs(true); } catch (e) {}
        };
    }
    function _consumeMatchedItems(matches) {
        let warehouseMatches = matches.filter(m => m.source === 'warehouse');
        if (warehouseMatches.length) {
            if (typeof loadWarehouse !== 'function' || typeof saveWarehouse !== 'function') return false;
            let w;
            try { w = loadWarehouse(); } catch (e) { return false; }
            if (!w || !Array.isArray(w.items)) return false;
            for (let m of warehouseMatches) {
                let idx = m.item && m.item.uid != null
                    ? w.items.findIndex(it => it && it.uid === m.item.uid)
                    : w.items.findIndex(it => it && it.id === m.item.id &&
                        Math.floor(Number(it.en) || 0) === Math.floor(Number(m.item.en) || 0) &&
                        !!it.bless === !!m.item.bless && !!it.anc === !!m.item.anc &&
                        String(it.attr || '') === String(m.item.attr || '') &&
                        String(it.seteff || '') === String(m.item.seteff || ''));
                if (idx < 0) return false;
                let count = Math.floor(Number(w.items[idx].cnt));
                if (!Number.isFinite(count) || count < 1) count = 1;
                count -= 1;
                if (count <= 0) w.items.splice(idx, 1);
                else w.items[idx].cnt = count;
            }
            try { if (!saveWarehouse(w)) return false; } catch (e) { return false; }
        }

        let remove = [];
        for (let m of matches.filter(x => x.source !== 'warehouse')) {
            let live = m.item && m.item.uid != null
                ? player.inv.find(it => it && it.uid === m.item.uid)
                : player.inv.find(it => it === m.item);
            if (!live) return false;
            let count = Math.floor(Number(live.cnt));
            if (!Number.isFinite(count) || count < 1) count = 1;
            count -= 1;
            if (count <= 0) remove.push(live);
            else live.cnt = count;
        }
        if (remove.length) player.inv = player.inv.filter(it => !remove.includes(it));
        return true;
    }

    function _remainingText(ms) {
        ms = Math.max(0, Number(ms) || 0);
        let totalMin = Math.ceil(ms / 60000);
        let d = Math.floor(totalMin / 1440);
        let h = Math.floor((totalMin % 1440) / 60);
        let m = totalMin % 60;
        if (d) return `${d}天 ${h}小時`;
        if (h) return `${h}小時 ${m}分`;
        return `${Math.max(1, m)}分`;
    }

    let _shoutMenuDocHandler = null;
    function _closeWanderingShoutMenu() {
        if (_wanderingShoutMenu && _wanderingShoutMenu.parentNode) {
            _wanderingShoutMenu.parentNode.removeChild(_wanderingShoutMenu);
        }
        _wanderingShoutMenu = null;
        _activeTauntChoices = null;
        if (_shoutMenuDocHandler) { try { document.removeEventListener('click', _shoutMenuDocHandler); } catch (e) {} _shoutMenuDocHandler = null; }
    }

    function _mountWanderingShoutMenu(menu, ev) {
        document.body.appendChild(menu);
        let x = ev && Number.isFinite(ev.clientX) ? ev.clientX : Math.round(window.innerWidth / 2);
        let y = ev && Number.isFinite(ev.clientY) ? ev.clientY : Math.round(window.innerHeight / 2);
        let rect = menu.getBoundingClientRect();
        menu.style.left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)) + 'px';
        menu.style.top = Math.max(8, Math.min(y + 8, window.innerHeight - rect.height - 8)) + 'px';
        _wanderingShoutMenu = menu;

        // 點在選單 padding 不消耗監聽器；只有點到選單外才關閉。
        setTimeout(() => {
            if (_wanderingShoutMenu !== menu) return;
            _shoutMenuDocHandler = function (e) {
                if (!_wanderingShoutMenu || !_wanderingShoutMenu.contains(e.target)) _closeWanderingShoutMenu();
            };
            document.addEventListener('click', _shoutMenuDocHandler);
        }, 0);
    }

    function openWanderingShoutMenu(wandererId, ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        _closeWanderingShoutMenu();
        let st = _readState();
        let w = _findWanderer(st, wandererId);
        // ⚠️ broadcastStopped（按過「吵死了」或已對話過）≠ 已離場：該玩家仍在城裡最長 2 小時、照常可交易。
        //    原本把兩者併成同一分支，會讓「馬上到」傳送（此函式是唯一入口）在剩餘生命期內再也用不了。
        if (!_wandererPresent(w)) {
            // 📌 點到「已離場但還沒被下一次 tick 清掉」的釘選列：給明確回覆並立刻重畫（否則按了完全沒反應，像壞掉）
            if (typeof logSys === 'function') logSys('<span class="text-slate-400">這名玩家已經離開。</span>');
            _lastMapSignature = '__force__';   // 立繪也要跟著消失（比照成交路徑）
            renderWanderBroadcastPins(st);
            return;
        }

        let menu = document.createElement('div');
        menu.id = 'wandering-shout-menu';
        menu.className = 'wandering-shout-menu';
        menu.innerHTML =
            _wandererClanRowHtml(w) +   // 🛡️ v3.6.80 點名字時一併顯示血盟（無盟不出現這條）
            `<button type="button" class="wandering-taunt-entry" onclick="openWanderingTauntMenu('${_esc(w.id)}',event)">嘲諷</button>` +
            (w.broadcastStopped ? '' : `<button type="button" onclick="silenceWanderingBuyer('${_esc(w.id)}')">吵死了</button>`) +   // 已靜音者不再顯示「吵死了」
            `<button type="button" onclick="hurryToWanderingBuyer('${_esc(w.id)}')">馬上到</button>`;
        _mountWanderingShoutMenu(menu, ev);
    }

    function openWanderingTauntMenu(wandererId, ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        _closeWanderingShoutMenu();
        let st = _readState();
        let w = _findWanderer(st, wandererId);
        if (!_wandererPresent(w)) {
            if (typeof logSys === 'function') logSys('<span class="text-slate-400">這名玩家已經離開。</span>');
            renderWanderBroadcastPins(st);
            return;
        }
        if (w.playerBlocked) {
            _logWandererBlocked(w);
            return;
        }
        let choices = _buildOfflineTauntChoices(w);
        _activeTauntChoices = { wandererId: w.id, choices: choices, createdAt: Date.now() };
        let menu = document.createElement('div');
        menu.id = 'wandering-shout-menu';
        menu.className = 'wandering-shout-menu wandering-taunt-menu';
        menu.innerHTML =
            `<div class="wandering-taunt-heading">選一句回 ${_wandererNameHtml(w)}</div>` +
            choices.map((choice, index) =>
                `<button type="button" onclick="tauntWanderingBuyer('${_esc(w.id)}',${index})">${_esc(choice.text)}</button>`
            ).join('');
        _mountWanderingShoutMenu(menu, ev);
    }

    function tauntWanderingBuyer(wandererId, choiceIndex) {
        let active = _activeTauntChoices;
        let choice = active && active.wandererId === wandererId && Date.now() - active.createdAt < 60000
            ? active.choices[Math.max(0, Math.floor(Number(choiceIndex) || 0))]
            : null;
        let st = _readState();
        let w = _findWanderer(st, wandererId);
        _closeWanderingShoutMenu();
        if (!_wandererPresent(w)) {
            if (typeof logSys === 'function') logSys('<span class="text-slate-400">這名玩家已經離開。</span>');
            renderWanderBroadcastPins(st);
            return;
        }
        if (w.playerBlocked) {
            _logWandererBlocked(w);
            return;
        }
        if (!choice) {
            if (typeof logSys === 'function') logSys('<span class="text-slate-400">嘲諷選項已失效，請重新點選這名玩家。</span>');
            return;
        }
        let reply = _buildOfflineNpcReply(w, choice);
        if (typeof logSys === 'function') {
            logWorld(
                `<span class="wander-chat-out"><span class="wander-chat-arrow">-&gt;</span> ` +
                `<span class="wander-chat-target">[${_wandererNameHtml(w)}]</span> ${_esc(choice.text)}</span>`
            );
            logWorld(
                `<span class="wander-chat-in"><span class="wander-chat-speaker">[${_wandererNameHtml(w)}]</span> ` +
                `${_esc(reply)}</span>`
            );
        }
        if (Math.random() < _tauntChaseRate(w.alignmentValue)) {
            if (_startWandererChase(w) && typeof logSys === 'function') {
                logWorld(`<span class="text-rose-400 font-bold">[${_wandererNameHtml(w)}] 惡狠狠地記住了你……</span>`);
            }
            return;
        }
        if (Math.random() < 0.2) {
            let blockResult = _blockPlayerForWanderer(w.id);
            if (blockResult.ok || blockResult.already) {
                w.playerBlocked = true;
                _logWandererBlocked(w);
            } else if (!blockResult.gone && typeof logSys === 'function') {
                logSys(`<span class="text-slate-400">${_esc(blockResult.error || '共用資料暫時忙碌，封鎖狀態未能儲存。')}</span>`);
            }
        }
    }

    function _stopWanderingBroadcast(wandererId) {
        let result = _withStateLock(st => {
            let w = _findWanderer(st, wandererId);
            if (!_wandererPresent(w)) {
                // 🏷️ v3.5.94 標記 gone＝「真的離場」，讓呼叫端能跟 already／busy／寫入失敗這些「只是沒停下叫賣」區分開。
                return { commit: false, gone: true, error: '這名玩家已經離開。' };
            }
            if (w.broadcastStopped) return { commit: false, already: true, name: w.name };
            w.broadcastStopped = true;
            w.quietAt = Date.now();
            return { name: w.name };
        });
        renderWanderBroadcastPins(result && result.state);   // 📌 v3.5.77 玩家與這位互動後空出釘選位 → 立刻補上下一位排隊中的叫賣（沿用鎖內已讀好的狀態，免再解壓一次）
        return result;
    }

    function silenceWanderingBuyer(wandererId) {
        let st = _readState();
        let w = _findWanderer(st, wandererId);
        if (!_wandererPresent(w)) {
            _closeWanderingShoutMenu();
            return;
        }
        if (w.playerBlocked) {
            _closeWanderingShoutMenu();
            _logWandererBlocked(w);
            return;
        }
        let forceSpicy = _isEvilAlignmentValue(w.alignmentValue);
        let complaint = _pickSilenceComplaint(w);
        let _reply = _pickSilenceReply(forceSpicy);
        let apology = _reply.text;
        let result = _stopWanderingBroadcast(w.id);
        _closeWanderingShoutMenu();
        // 🔇 v3.5.94 這裡失敗＝叫賣真的沒停下（本按鈕只在 !broadcastStopped 時渲染，already 僅剩多分頁競態），
        //    照舊中止流程即可；但至少補一行訊息，別讓玩家按了完全沒反應。
        if (!result.ok) {
            if (!result.already && typeof logSys === 'function') {
                logSys(`<span class="text-slate-400">${_esc(result.error || '共用資料暫時忙碌，請稍後重試。')}</span>`);
            }
            return;
        }

        _lastBroadcastCycles[w.id] = 'quiet';
        if (typeof logSys === 'function') {
            logWorld(
                `<span class="wander-chat-out"><span class="wander-chat-arrow">-&gt;</span> ` +
                `<span class="wander-chat-target">[${_wandererNameHtml(w)}]</span> ${_esc(complaint)}</span>`
            );
            logWorld(
                `<span class="wander-chat-in"><span class="wander-chat-speaker">[${_wandererNameHtml(w)}]</span> ` +
                `${_esc(apology)}</span>`
            );
        }
        // 😤 白目玩家系統：NPC 嗆聲回覆→正式版 20% 記仇；若叫賣者是紅名，玩家選「吵死了」必定反嗆並追殺。
        if (_reply.spicy && (forceSpicy || TEST_BUILD || Math.random() < 0.2) && _startWandererChase(w)) {   // 🧪 TEST版：回嗆必定記仇（正式版 20%；紅名 100%）
            if (typeof logWorld === "function") logWorld(`<span class="text-rose-400 font-bold">[${_wandererNameHtml(w)}] 惡狠狠地記住了你……</span>`);
        }
    }

    function hurryToWanderingBuyer(wandererId) {
        let st = _readState();
        let w = _findWanderer(st, wandererId);
        if (!_wandererPresent(w)) {
            _closeWanderingShoutMenu();
            return;
        }
        if (!DB.towns || !DB.towns[w.townId] ||
            typeof setMapSelectors !== 'function' || typeof changeMap !== 'function') {
            _closeWanderingShoutMenu();
            if (typeof logSys === 'function') {
                logSys('<span class="text-red-400">目前無法前往該玩家所在的安全區。</span>');
            }
            return;
        }

        let result = _stopWanderingBroadcast(w.id);
        _closeWanderingShoutMenu();
        // 🚚 v3.5.94 「傳送過去」與「停止叫賣」是兩件獨立的事：靜音失敗不該把按鈕變成死鍵。
        //    已對話過／按過「吵死了」的叫賣者 broadcastStopped 早就是 true，mutator 回 already（ok=false），
        //    舊碼在此直接 return → 對這些人「馬上到」永久失效且完全沒有回饋。
        //    already 本來就不需要再寫共用狀態；busy／寫入失敗也只是叫賣沒停下，一樣照常傳送，只補一行提示。
        //    唯一該中止的是這名玩家真的離場（gone），而且必須留訊息，避免按下去毫無反應。
        if (result.gone) {
            if (typeof logSys === 'function') logSys('<span class="text-slate-400">這名玩家已經離開。</span>');
            return;
        }
        if (!result.ok && !result.already && typeof logSys === 'function') {
            logSys(`<span class="text-amber-300">${_esc(result.error || '共用資料暫時忙碌，叫賣沒能停下。')}</span>`);
        }
        _lastBroadcastCycles[w.id] = 'quiet';

        if (typeof logSys === 'function') {
            logWorld(
                `<span class="wander-chat-out"><span class="wander-chat-arrow">-&gt;</span> ` +
                `<span class="wander-chat-target">[${_wandererNameHtml(w)}]</span> 馬上到</span>`
            );
        }

        // 直接前往玩家所在的安全區；同步清理各種旅程狀態，避免強制轉場後殘留。
        if (typeof state !== 'undefined' && state) {
            if (state.prideClimb) {
                if (state.prideRanked && typeof prideRecord === 'function') prideRecord(state.prideFloor || 2);
                state.prideClimb = false;
                state.prideRanked = false;
                state.prideFloor = 0;
            }
            if (state.riftRun && typeof riftEndRun === 'function') riftEndRun();
            if (state.oblivion) {
                state.oblivion = null;
                state._oblivionAdvance = false;
            }
        }

        setMapSelectors(w.townId);
        changeMap(true);
        if (typeof logSys === 'function') {
            logSys(`<span class="text-emerald-300">你傳送到了 ${_esc(_townName(w.townId))}。</span>`);
        }
        try { saveGame(); } catch (e) {}
    }

    function openWanderingBuyerDialog(wandererId) {
        let st = _readState();
        let w = wandererId ? _findWanderer(st, wandererId) : _currentTownWanderer(st);
        if (!_wandererPresent(w)) {
            if (typeof logSys === 'function') logSys('<span class="text-slate-400">這名玩家已經離開。</span>');
            // ⚠️ _activeSignature 不排除已到期者＝簽章與 _lastMapSignature 相同 → _refreshTownMapIfNeeded 會早退成空操作，
            //    幽靈立繪最長會留在城鎮地圖 30 秒（tick 間隔）並可重複點擊。比照成交路徑強制重畫。
            _lastMapSignature = '__force__';
            _refreshTownMapIfNeeded(_activeSignature(st.wanderers));
            return;
        }
        if (typeof mapState !== 'undefined' && mapState && mapState.current !== w.townId) return;
        if (!w.broadcastStopped) {
            _stopWanderingBroadcast(w.id);
            _lastBroadcastCycles[w.id] = 'quiet';
        }
        if (typeof openTownFloatWindow === 'function') {
            openTownFloatWindow(w.name, _buyerTitle(w), div => renderWanderingBuyerDialog(div, w.id));
        }
    }

    function renderWanderingBuyerDialog(div, wandererId) {
        if (!div) return;
        let st = _readState();
        let w = wandererId ? _findWanderer(st, wandererId) : _currentTownWanderer(st);
        if (!_wandererPresent(w)) {
            div.innerHTML = '<div class="p-8 text-center text-slate-400">這名玩家已經離開。</div>';
            return;
        }
        let d = DB.items[w.itemId];
        let req = { id: w.itemId, en: w.en };
        let match = _findMatches([req], st);
        let icon = d ? getIconUrl(d) : '';
        let isGoldBuyer = _wandererCurrency(w) === 'gold';
        let goldPrice = _goldBuyerPrice(w);
        let buyerVerb = isGoldBuyer ? '收' : '鑽收';
        let buyerAmount = isGoldBuyer ? ` <b>${goldPrice.toLocaleString()} 金幣</b>` : '';
        let rewardText = isGoldBuyer ? `報酬：${goldPrice.toLocaleString()} 金幣` : `報酬：龍之鑽石 × ${Math.max(1, Math.floor(Number(w.reward) || 1))}`;
        let proofText = d && _isEquipmentDef(d)
            ? '成交後會消耗道具欄或倉庫內這件指定裝備；已穿戴的裝備不會被消耗。'
            : '成交後會消耗道具欄或倉庫內 1 個指定物品。';
        div.innerHTML = `
            <div class="wandering-buyer-dialog">
                <div class="wandering-buyer-head">
                    <div class="wandering-buyer-avatar">${_esc(w.avatar || '')}</div>
                    <div>
                        <div class="wandering-buyer-line">${_wandererNameHtml(w)}：${buyerVerb} <b>${_esc(_requirementText(w.itemId, w.en))}</b>${buyerAmount}</div>
                        <div class="wandering-buyer-meta">位於 ${_esc(_townName(w.townId))}・剩餘 ${_remainingText(w.expiresAt - Date.now())}${_wandererClanName(w) ? '・血盟 ' + _esc(_wandererClanName(w)) : ''}</div>
                    </div>
                </div>
                <div class="wandering-buyer-offer">
                    <img src="${_esc(icon)}" alt="" onmouseenter="pandoraRelicTipShow(event,'${_esc(w.itemId)}')" onmousemove="pandoraTipMove(event)" onmouseleave="pandoraTipHide()">
                    <div class="wandering-buyer-offer-main">
                        <div class="${d ? getItemColor({ id: w.itemId }) : ''}">${_esc(_requirementText(w.itemId, w.en))}</div>
                        <div class="wandering-buyer-reward">${rewardText}</div>
                        <div class="wandering-buyer-note">${_esc(proofText)}</div>
                    </div>
                    <div class="${match.ok ? 'text-green-400' : 'text-red-400'} wandering-buyer-state">${match.ok ? '可交付' : '道具欄／倉庫缺少'}</div>
                </div>
                <div class="wandering-buyer-actions">
                    <button class="btn wandering-buyer-dismiss" onclick="dismissWanderingBuyer('${_esc(w.id)}')">驅離</button>
                    <button class="btn wandering-buyer-submit ${match.ok ? '' : 'opacity-60'}" onclick="performWanderingBuyerTrade('${_esc(w.id)}')">交付物品</button>
                </div>
                <div id="wandering-buyer-msg"></div>
            </div>`;
    }

    function _wanderingMessage(text, error) {
        let el = document.getElementById('wandering-buyer-msg');
        if (el) el.innerHTML = `<span class="${error ? 'text-red-400' : 'text-green-400'}">${_esc(text)}</span>`;
    }

    function dismissWanderingBuyer(wandererId) {
        let before = _readState();
        let w = _findWanderer(before, wandererId);
        if (!_wandererPresent(w)) {
            _wanderingMessage('這名玩家已經離開。', true);
            return;
        }
        let result = _withStateLock(st => {
            let liveWanderer = _findWanderer(st, wandererId);
            if (!_wandererPresent(liveWanderer)) {
                return { commit: false, gone: true, error: '這名玩家已經離開。' };
            }
            liveWanderer.dismissed = true;
            liveWanderer.dismissedAt = Date.now();
            liveWanderer.broadcastStopped = true;
            liveWanderer.quietAt = liveWanderer.dismissedAt;
            return { name: liveWanderer.name, expiresAt: liveWanderer.expiresAt };
        });
        if (!result.ok) {
            _wanderingMessage(result.error || '共用資料暫時忙碌，請稍後重試。', true);
            return;
        }
        _lastBroadcastCycles[w.id] = 'dismissed';
        _lastMapSignature = '__force__';
        let after = result.state || _readState();
        _refreshTownMapIfNeeded(_activeSignature(after.wanderers));
        renderWanderBroadcastPins(after);
        if (typeof logSys === 'function') {
            logSys(`<span class="text-slate-300">你將 ${_wandererNameHtml(w)} 驅離了這座城鎮。</span>`);
        }
        try { closeNpcInteraction(); } catch (e) {}
    }

    function performWanderingBuyerTrade(wandererId) {
        let before = _readState();
        let w = wandererId ? _findWanderer(before, wandererId) : _currentTownWanderer(before);
        if (!_wandererPresent(w)) {
            _wanderingMessage('這名玩家已經離開。', true);
            return;
        }
        let match = _findMatches([{ id: w.itemId, en: w.en }], before);
        if (!match.ok) {
            _wanderingMessage('道具欄與倉庫內都沒有符合強化值的指定物品。', true);
            return;
        }
        let result = _withStateLock(st => {
            let liveWanderer = _findWanderer(st, w.id);
            if (!_wandererPresent(liveWanderer)) {
                return { commit: false, error: '這筆收購已經結束。' };
            }
            let liveMatch = _findMatches([{ id: liveWanderer.itemId, en: liveWanderer.en }], st);
            if (!liveMatch.ok) {
                return { commit: false, error: '道具欄與倉庫內都沒有符合強化值的指定物品。' };
            }
            let isGoldBuyer = _wandererCurrency(liveWanderer) === 'gold';
            if (isGoldBuyer && (typeof player === 'undefined' || !player)) {
                return { commit: false, error: '目前無法發放金幣，請稍後重試。' };
            }
            let _rb = _snapshotItemState();   // 🛡️ 交付前快照（倉庫＋背包），供 _writeState 失敗時回滾
            if (!_consumeMatchedItems(liveMatch.matches)) {
                return { commit: false, error: '交付物品時倉庫資料發生變動，請重新開啟視窗確認。' };
            }
            let amount = isGoldBuyer
                ? _goldBuyerPrice(liveWanderer)
                : Math.max(1, Math.floor(Number(liveWanderer.reward) || 1));
            let goldBefore = Math.max(0, Math.floor(Number(player.gold) || 0));
            if (isGoldBuyer) player.gold = goldBefore + amount;
            else st.diamonds += amount;
            st.wanderers = st.wanderers.filter(entry => entry && entry.id !== liveWanderer.id);
            return {
                isGoldBuyer: isGoldBuyer,
                amount: amount,
                rollback: function () {
                    _rb();
                    if (isGoldBuyer && typeof player !== 'undefined' && player) player.gold = goldBefore;
                }
            };
        });
        if (!result.ok) {
            _wanderingMessage(result.error || '交易資料正忙碌，請稍後重試。', true);
            return;
        }
        try { saveGame(); } catch (e) {}
        try { updateUI(); renderTabs(); } catch (e) {}
        if (typeof logSys === 'function') {
            let rewardText = result.isGoldBuyer
                ? `${result.amount.toLocaleString()} 金幣`
                : `龍之鑽石 × ${result.amount}`;
            logSys(`<span class="text-amber-300">完成 ${_wandererNameHtml(w)} 的收購，獲得 <b>${rewardText}</b>。</span>`);
        }
        _lastMapSignature = '__force__';
        let _after = result.state || _readState();
        _refreshTownMapIfNeeded(_activeSignature(_after.wanderers));
        renderWanderBroadcastPins(_after);   // 📌 v3.5.77 成交後這位離場 → 釘選位讓給下一位叫賣者
        try { closeNpcInteraction(); } catch (e) {}
    }

    function _craftableIds() {
        let out = new Set();
        if (typeof CRAFT_RECIPES === 'undefined' || !CRAFT_RECIPES) return out;
        Object.keys(CRAFT_RECIPES).forEach(k => {
            (CRAFT_RECIPES[k] || []).forEach(r => {
                if (r && r.result && DB.items[r.result]) out.add(r.result);
            });
        });
        return out;
    }

    function _relicCategoryOf(d) {
        if (!d || !d.relic) return null;
        if (d.type === 'wpn' || d.slot === 'petwpn') return 'weapon';
        if (d.type === 'arm' || d.slot === 'petarm') return 'armor';
        if (d.type === 'acc') return 'accessory';
        return null;
    }

    function _ownedRelicIds() {
        let ids = new Set();
        if (typeof player === 'undefined' || !player) return ids;
        (player.inv || []).forEach(it => { if (it && DB.items[it.id] && DB.items[it.id].relic) ids.add(it.id); });
        if (player.eq && typeof player.eq === 'object') {
            Object.keys(player.eq).forEach(k => {
                let it = player.eq[k];
                if (it && DB.items[it.id] && DB.items[it.id].relic) ids.add(it.id);
            });
        }
        return ids;
    }

    // 🥚 v3.6.48 未知遺物用：該遺物是否已收錄圖鑑（武防飾→遺物收集冊 relicDex；type:'etc' 蛋等道具型→道具收集冊 miscDex）
    function _relicDexKnown(id) {
        let d = DB.items[id] || {};
        if (d.type === 'etc') return typeof miscDexHas === 'function' && miscDexHas(id);
        return typeof relicDexHas === 'function' && relicDexHas(id);
    }

    function _makeRelicContract(st, category) {
        let active = new Set();
        st.boards.forEach(b => { if (b.contract && b.contract.relicId) active.add(b.contract.relicId); });
        let owned = _ownedRelicIds();
        let relicPool = Object.keys(DB.items).filter(id => {
            let d = DB.items[id];
            if (!d || !d.relic || active.has(id)) return false;
            // 🥚 未知遺物：不限類型（含武防飾＋type:'etc' 蛋——蛋在黑市只有這個管道能搜到）·必定挑「圖鑑未收錄」者
            if (category === 'unknown') {
                if (!_relicCategoryOf(d) && d.type !== 'etc') return false;   // 排除既非裝備也非道具型的異常定義
                return TEST_BUILD || !_relicDexKnown(id);
            }
            return _relicCategoryOf(d) === category && (TEST_BUILD || !owned.has(id));
        });
        if (!relicPool.length) return { error: category === 'unknown' ? '所有遺物都已收錄圖鑑，目前沒有可搜尋的未知遺物。' : '此類別目前沒有可搜尋的新遺物。' };
        let relicId = _pick(st, relicPool, 'relic-target|' + category);
        let craftable = _craftableIds();
        let base = Object.keys(DB.items).filter(id => {
            let d = DB.items[id];
            let w = Math.floor(Number(d && d.gachaWeight) || 0);
            return !!(d && d.n && !d.relic && d.eff !== 'card' && id !== relicId && ((w >= 1 && w <= 50) || craftable.has(id)));
        });
        let p1 = base.filter(id => Math.floor(Number(DB.items[id].gachaWeight) || 0) === 1);
        let p2 = base.filter(id => {
            let w = Math.floor(Number(DB.items[id].gachaWeight) || 0);
            return w >= 1 && w <= 20;
        });
        let p3 = base.filter(id => {
            let w = Math.floor(Number(DB.items[id].gachaWeight) || 0);
            return (w >= 1 && w <= 50) || craftable.has(id);
        });
        if (!p1.length || !p2.length || !p3.length) return { error: '遺物委託材料池不足，請先檢查潘朵拉權重與製作資料。' };
        let chosen = [];
        function choose(pool, tag) {
            let avail = pool.filter(id => !chosen.includes(id));
            let id = _pick(st, avail, tag);
            if (id) chosen.push(id);
            return id;
        }
        let a = choose(p1, 'relic-req-weight1');
        let b = choose(p2, 'relic-req-weight1-20');
        let c = choose(p3, 'relic-req-weight1-50-craft');
        if (!a || !b || !c) return { error: '無法建立三種不重複的委託物品。' };
        return {
            contract: {
                id: 'relic-' + Date.now().toString(36) + '-' + Math.floor(_rand(st, 'relic-contract-id') * 0xffffff).toString(36),
                category: category,
                relicId: relicId,
                requirements: chosen.map(id => ({
                    id: id,
                    en: null,
                    weight: Math.floor(Number(DB.items[id].gachaWeight) || 0),
                    craftable: craftable.has(id)
                })),
                createdAt: Date.now()
            }
        };
    }

    function pandoraRelicSuggestionHTML(query) {
        query = String(query || '').trim();
        if (!query.includes('遺物')) return '';
        return Object.keys(RELIC_CATEGORIES).map(key => {
            let c = RELIC_CATEGORIES[key];
            return `<button type="button" class="pandora-buy-suggestion pandora-relic-suggestion" onclick="pandoraChooseRelicSearch('${key}')">${c.label}<span>消耗 ${RELIC_SEARCH_COST} 龍之鑽石</span></button>`;
        }).join('');
    }

    function pandoraRelicOnSearchInput(value) {
        let nameEl = document.getElementById('pandora-buy-name');
        let priceEl = document.getElementById('pandora-buy-price');
        if (!nameEl || !nameEl.dataset.relicCat) return;
        let cat = nameEl.dataset.relicCat;
        if (!RELIC_CATEGORIES[cat] || String(value || '').trim() !== RELIC_CATEGORIES[cat].label) {
            delete nameEl.dataset.relicCat;
            if (priceEl) {
                priceEl.disabled = false;
                priceEl.value = '';
                priceEl.placeholder = '收購價錢';
            }
        }
    }

    function pandoraClearRelicSearchChoice() {
        let nameEl = document.getElementById('pandora-buy-name');
        let priceEl = document.getElementById('pandora-buy-price');
        if (nameEl) delete nameEl.dataset.relicCat;
        if (priceEl) priceEl.disabled = false;
    }

    function pandoraChooseRelicSearch(category) {
        let cfg = RELIC_CATEGORIES[category];
        if (!cfg) return;
        let nameEl = document.getElementById('pandora-buy-name');
        let priceEl = document.getElementById('pandora-buy-price');
        let box = document.getElementById('pandora-buy-suggestions');
        if (nameEl) {
            nameEl.value = cfg.label;
            nameEl.dataset.relicCat = category;
        }
        if (priceEl) {
            priceEl.value = String(RELIC_SEARCH_COST) + ' 龍之鑽石';
            priceEl.disabled = true;
        }
        if (box) {
            box.innerHTML = '';
            box.classList.add('hidden');
        }
    }

    function _setPandoraNotice(type, text) {
        let m = typeof player !== 'undefined' && player ? player.pandoraMarket2 : null;
        if (typeof _pandoraSetNotice === 'function') _pandoraSetNotice(m, type, text);
    }

    function _rerenderPandora() {
        try {
            if (typeof _pandoraDiv !== 'undefined' && _pandoraDiv && typeof pandoraRenderMarket === 'function') {
                pandoraRenderMarket(_pandoraDiv);
            }
        } catch (e) {}
    }

    function pandoraTryRelicSearchFromInputs() {
        let nameEl = document.getElementById('pandora-buy-name');
        let name = nameEl ? nameEl.value.trim() : '';
        let category = nameEl && nameEl.dataset ? nameEl.dataset.relicCat : '';
        if (!category) {
            Object.keys(RELIC_CATEGORIES).some(k => {
                if (RELIC_CATEGORIES[k].label === name) { category = k; return true; }
                return false;
            });
        }
        if (!category && name === '遺物') {
            _setPandoraNotice('error', '請先從候補選擇武器遺物、防具遺物、飾品遺物或未知遺物。');
            _rerenderPandora();
            return true;
        }
        if (!category) return false;
        pandoraStartRelicSearch(category);
        return true;
    }

    function pandoraStartRelicSearch(category) {
        if (!RELIC_CATEGORIES[category]) return;
        let now = Date.now();
        let result = _withStateLock(st => {
            let slot = st.boards.findIndex(b => !b.contract && Number(b.cooldownUntil || 0) <= now);
            if (slot < 0) return { commit: false, error: '三個遺物欄位都在使用中或冷卻中。' };
            if (st.diamonds < RELIC_SEARCH_COST) return { commit: false, error: `龍之鑽石不足，需要 ${RELIC_SEARCH_COST} 顆。` };
            let made = _makeRelicContract(st, category);
            if (made.error) return { commit: false, error: made.error };
            st.diamonds -= RELIC_SEARCH_COST;
            st.boards[slot].contract = made.contract;
            st.boards[slot].cooldownUntil = 0;
            return { slot: slot, contract: made.contract };
        });
        if (!result.ok) {
            _setPandoraNotice('error', result.error || '遺物搜尋資料正忙碌，請稍後重試。');
        } else {
            let d = DB.items[result.contract.relicId];
            _setPandoraNotice('success', `已在第 ${result.slot + 1} 欄找到${d ? d.n : '遺物'}的布告，消耗 ${RELIC_SEARCH_COST} 顆龍之鑽石。`);
            try { saveGame(); } catch (e) {}
        }
        _rerenderPandora();
    }

    function pandoraRelicBalanceHTML() {
        let st = _readState();
        return `｜龍之鑽石 <span class="pandora-diamond-count">${st.diamonds.toLocaleString()}</span>`;
    }

    function pandoraRelicBoardHTML() {
        let st = _readState();
        let now = Date.now();
        let cards = st.boards.map((b, i) => {
            if (b.contract) {
                let c = b.contract;
                let d = DB.items[c.relicId];
                let match = _findMatches(c.requirements || [], st);
                let reqHtml = (c.requirements || []).map(req => {
                    let one = _findMatches([req], st).ok;
                    let rd = DB.items[req.id];
                    return `<div class="pandora-relic-req ${one ? 'has' : 'missing'}"
                        onmouseenter="pandoraRelicTipShow(event,'${_esc(req.id)}')" onmousemove="pandoraTipMove(event)" onmouseleave="pandoraTipHide()">
                        <img src="${rd ? _esc(getIconUrl(rd)) : ''}" alt="">
                        <span>${_esc(_requirementText(req.id, req.en))}</span>
                    </div>`;
                }).join('');
                let category = RELIC_CATEGORIES[c.category] || { short: '遺物' };
                return `<div class="pandora-relic-slot active">
                    <div class="pandora-relic-slot-no">布告 ${i + 1}・${category.short}</div>
                    <div class="pandora-relic-target" onmouseenter="pandoraRelicTipShow(event,'${_esc(c.relicId)}')" onmousemove="pandoraTipMove(event)" onmouseleave="pandoraTipHide()">
                        <div class="pandora-collection-icon pandora-relic-icon-wrap">
                            <img src="${d ? _esc(getIconUrl(d)) : ''}" alt="">
                            ${typeof pandoraUncollectedBadgeHTML === 'function' ? pandoraUncollectedBadgeHTML(c.relicId) : ''}
                        </div>
                        <b class="${d ? getItemColor({ id: c.relicId }) : ''}">${_esc(d ? d.n : c.relicId)}</b>
                    </div>
                    <div class="pandora-relic-reqs">${reqHtml}</div>
                    <div class="pandora-relic-actions">
                        <button class="btn pandora-relic-exchange ${match.ok ? '' : 'opacity-60'}" onclick="pandoraExchangeRelic(${i})">兌換</button>
                        <button class="pandora-relic-cancel" onclick="pandoraCancelRelicBoard(${i})">取消布告</button>
                    </div>
                </div>`;
            }
            if (Number(b.cooldownUntil || 0) > now) {
                return `<div class="pandora-relic-slot cooling">
                    <div class="pandora-relic-slot-no">布告 ${i + 1}</div>
                    <div class="pandora-relic-empty-icon">⌛</div>
                    <div>欄位冷卻中</div>
                    <small class="pandora-relic-cd" data-until="${Math.floor(b.cooldownUntil)}">${_remainingText(b.cooldownUntil - now)}</small>
                </div>`;
            }
            return `<div class="pandora-relic-slot empty">
                <div class="pandora-relic-slot-no">布告 ${i + 1}</div>
                <div class="pandora-relic-empty-icon">◇</div>
                <div>尚未搜尋遺物</div>
                <small>在上方輸入「遺物」選擇類別</small>
            </div>`;
        }).join('');
        return `<section class="pandora-relic-board">
            <div class="pandora-relic-board-head">
                <b>遺物布告欄</b>
                <span>搜尋費用 ${RELIC_SEARCH_COST} 龍之鑽石・完成或取消後，該欄冷卻 24 小時</span>
            </div>
            <div class="pandora-relic-grid">${cards}</div>
        </section>`;
    }

    function pandoraRelicBindBoardCountdowns() {
        document.querySelectorAll('.pandora-relic-cd[data-until]').forEach(el => {
            let until = Number(el.dataset.until) || 0;
            el.textContent = until > Date.now() ? _remainingText(until - Date.now()) : '冷卻完成，重新開啟黑市即可使用';
        });
    }

    function pandoraRelicTipShow(ev, id) {
        let d = DB.items[id];
        if (!d || typeof _pandoraTipEl !== 'function') return;
        let inst = { id: id, en: 0, bless: false, anc: false, attr: false };
        let desc = '';
        try { desc = buildItemDescHTML(inst); } catch (e) {}
        let el = _pandoraTipEl();
        el.innerHTML = `<div class="font-bold ${getItemColor(inst)}">${_esc(d.n || id)}</div><div class="text-slate-300">${desc}</div>`;
        el.style.display = 'block';
        if (typeof pandoraTipMove === 'function') pandoraTipMove(ev);
    }

    function pandoraExchangeRelic(slotIndex) {
        let before = _readState();
        let board = before.boards[slotIndex];
        let contract = board && board.contract;
        if (!contract) {
            _setPandoraNotice('error', '此遺物布告已不存在。');
            _rerenderPandora();
            return;
        }
        let match = _findMatches(contract.requirements || [], before);
        if (!match.ok) {
            let missing = match.missing;
            _setPandoraNotice('error', `道具欄與倉庫缺少：${_requirementText(missing.id, missing.en)}。`);
            _rerenderPandora();
            return;
        }
        let result = _withStateLock(st => {
            let live = st.boards[slotIndex] && st.boards[slotIndex].contract;
            if (!live || live.id !== contract.id) return { commit: false, error: '此遺物布告已被完成或取消。' };
            let liveMatch = _findMatches(live.requirements || [], st);
            if (!liveMatch.ok) {
                return { commit: false, error: `道具欄與倉庫缺少：${_requirementText(liveMatch.missing.id, liveMatch.missing.en)}。` };
            }
            let _rb = _snapshotItemState();   // 🛡️ 交付前快照（倉庫＋背包），供 _writeState 失敗時回滾
            if (!_consumeMatchedItems(liveMatch.matches)) {
                return { commit: false, error: '交付物品時倉庫資料發生變動，請重新開啟黑市確認。' };
            }
            st.boards[slotIndex].contract = null;
            st.boards[slotIndex].cooldownUntil = Date.now() + BOARD_COOLDOWN_MS;
            return { relicId: live.relicId, rollback: _rb };
        });
        if (!result.ok) {
            _setPandoraNotice('error', result.error || '兌換資料正忙碌，請稍後重試。');
            _rerenderPandora();
            return;
        }
        try {
            let oldTrad = (typeof _tradLootCtx !== 'undefined') ? _tradLootCtx : false;
            if (typeof _tradLootCtx !== 'undefined') _tradLootCtx = true;
            try { gainItem(result.relicId, 1, true, true, false); } finally {
                if (typeof _tradLootCtx !== 'undefined') _tradLootCtx = oldTrad;
            }
        } catch (e) {
            gainItem(result.relicId, 1, true, true, false);
        }
        let d = DB.items[result.relicId];
        _setPandoraNotice('success', `完成遺物布告，獲得${d ? d.n : '遺物'}。第 ${slotIndex + 1} 欄進入 24 小時冷卻。`);
        if (typeof logSys === 'function') logSys(`<span class="text-purple-300 font-bold">完成潘朵拉遺物布告，獲得 ${_esc(d ? d.n : result.relicId)}。</span>`);
        try { updateUI(); renderTabs(); saveGame(); } catch (e) {}
        _rerenderPandora();
    }

    function pandoraCancelRelicBoard(slotIndex) {
        let result = _withStateLock(st => {
            let b = st.boards[slotIndex];
            if (!b || !b.contract) return { commit: false, error: '此欄目前沒有遺物布告。' };
            let relicId = b.contract.relicId;
            b.contract = null;
            b.cooldownUntil = Date.now() + BOARD_COOLDOWN_MS;
            return { relicId: relicId };
        });
        if (!result.ok) _setPandoraNotice('error', result.error || '取消資料正忙碌，請稍後重試。');
        else _setPandoraNotice('info', `已取消第 ${slotIndex + 1} 欄的遺物布告，該欄進入 24 小時冷卻。`);
        _rerenderPandora();
    }

    // test.html 專用：測試版創角時重設帳號共用龍之鑽石；正式版即使誤呼叫也不會生效。
    function pandoraTestSetDiamonds(amount) {
        if (!TEST_BUILD) return false;
        let value = Math.max(0, Math.floor(Number(amount) || 0));
        let result = _withStateLock(st => {
            st.diamonds = value;
            return { diamonds: value };
        });
        if (result.ok) _rerenderPandora();
        return !!result.ok;
    }

    // 匯出／匯入只處理龍之鑽石，不覆蓋叫賣 NPC、遺物布告欄與冷卻中的共用市場資料。
    function pandoraGetSharedDiamonds() {
        return _readState().diamonds;
    }

    function pandoraAdjustSharedDiamonds(delta) {
        delta = Math.trunc(Number(delta) || 0);
        if (!delta) return { ok: true, diamonds: _readState().diamonds };
        let result = _withStateLock(st => {
            let next = Math.floor(Number(st.diamonds) || 0) + delta;
            if (next < 0) return { commit: false, error: '龍之鑽石不足。' };
            st.diamonds = next;
            return { diamonds: next };
        });
        if (result.ok) _rerenderPandora();
        return result;
    }

    function pandoraRestoreSharedDiamonds(amount) {
        let value = Math.max(0, Math.floor(Number(amount) || 0));
        let result = _withStateLock(st => {
            st.diamonds = value;
            return { diamonds: value };
        });
        if (result.ok) _rerenderPandora();
        return result;
    }

    window.wanderingBuyerSystemTick = wanderingBuyerSystemTick;
    window.pandoraUpdateWandererAlignment = pandoraUpdateWandererAlignment;
    window.renderWanderBroadcastPins = renderWanderBroadcastPins;
    window.getWanderingBuyersForTown = getWanderingBuyersForTown;
    window.getWanderingBuyerForTown = getWanderingBuyerForTown;
    window.wanderingBuyerSpriteData = wanderingBuyerSpriteData;
    window.openWanderingBuyerDialog = openWanderingBuyerDialog;
    window.openWanderingShoutMenu = openWanderingShoutMenu;
    window.openWanderingTauntMenu = openWanderingTauntMenu;
    window.tauntWanderingBuyer = tauntWanderingBuyer;
    window.silenceWanderingBuyer = silenceWanderingBuyer;
    window.hurryToWanderingBuyer = hurryToWanderingBuyer;
    window.renderWanderingBuyerDialog = renderWanderingBuyerDialog;
    window.dismissWanderingBuyer = dismissWanderingBuyer;
    window.performWanderingBuyerTrade = performWanderingBuyerTrade;
    window.pandoraRelicSuggestionHTML = pandoraRelicSuggestionHTML;
    window.pandoraRelicOnSearchInput = pandoraRelicOnSearchInput;
    window.pandoraClearRelicSearchChoice = pandoraClearRelicSearchChoice;
    window.pandoraChooseRelicSearch = pandoraChooseRelicSearch;
    window.pandoraTryRelicSearchFromInputs = pandoraTryRelicSearchFromInputs;
    window.pandoraStartRelicSearch = pandoraStartRelicSearch;
    window.pandoraRelicBalanceHTML = pandoraRelicBalanceHTML;
    window.pandoraRelicBoardHTML = pandoraRelicBoardHTML;
    window.pandoraRelicBindBoardCountdowns = pandoraRelicBindBoardCountdowns;
    window.pandoraRelicTipShow = pandoraRelicTipShow;
    window.pandoraExchangeRelic = pandoraExchangeRelic;
    window.pandoraCancelRelicBoard = pandoraCancelRelicBoard;
    window.pandoraTestSetDiamonds = pandoraTestSetDiamonds;
    window.pandoraGetSharedDiamonds = pandoraGetSharedDiamonds;
    window.pandoraAdjustSharedDiamonds = pandoraAdjustSharedDiamonds;
    window.pandoraRestoreSharedDiamonds = pandoraRestoreSharedDiamonds;

    setTimeout(wanderingBuyerSystemTick, 1500);
    setInterval(wanderingBuyerSystemTick, 30000);
    setInterval(pandoraRelicBindBoardCountdowns, 1000);
    setInterval(_pinExpiryWatch, 1000);   // 📌 v3.5.77 釘選中的叫賣者一到期就換下一位（只比對兩個數字·到期那一刻才真的重畫）
    try {
        window.addEventListener('storage', e => {
            if (e && e.key === STORE_KEY) {
                let st = _readState();
                _refreshTownMapIfNeeded(_activeSignature(st.wanderers));
                renderWanderBroadcastPins(st);   // 📌 v3.5.77 多開同步：另一個分頁互動/成交後，本頁釘選列一起遞補
                st.wanderers.forEach(_announceWanderer);
            }
        });
    } catch (e) {}
})();
