/** 遊戲核心資料庫 */
// 🏷️ 遊戲版本號（顯示於登入頁面下方·單一真相來源）：更新版本時只改這一行，登入頁面自動同步。
const GAME_VERSION = 'v3.8.39';   // 🏷️ 版本號：末段 0~99 線性遞增，達 100 進位（中位 +1、末段歸 0）
// ===== 💾 存檔壓縮（LZString compressToUTF16/decompressFromUTF16·MIT, Pieroxy）：localStorage 內部以 UTF-16 壓縮，省 ~89%，繞過 5MB 上限 =====
//  ⚠️ 只壓 localStorage（存檔位/倉庫/共用桶/_bak）；匯出檔維持明文 JSON（可攜·importSave 用 JSON.parse 驗證）。_lzGet 相容舊明文存檔（無 'LZ1:' 前綴→原樣回傳）。
var LZString = (function () {
  var f = String.fromCharCode;
  var LZString = {
    compressToUTF16: function (input) { if (input == null) return ""; return LZString._compress(input, 15, function (a) { return f(a + 32); }) + " "; },
    decompressFromUTF16: function (compressed) { if (compressed == null) return ""; if (compressed == "") return null; return LZString._decompress(compressed.length, 16384, function (index) { return compressed.charCodeAt(index) - 32; }); },
    _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
      if (uncompressed == null) return "";
      var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
      for (ii = 0; ii < uncompressed.length; ii += 1) {
        context_c = uncompressed.charAt(ii);
        if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) { context_dictionary[context_c] = context_dictSize++; context_dictionaryToCreate[context_c] = true; }
        context_wc = context_w + context_c;
        if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) { context_w = context_wc; } else {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
            if (context_w.charCodeAt(0) < 256) {
              for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 8; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = value >> 1; }
            } else {
              value = 1;
              for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | value; if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = 0; }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 16; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = value >> 1; }
            }
            context_enlargeIn--; if (context_enlargeIn == 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = value >> 1; }
          }
          context_enlargeIn--; if (context_enlargeIn == 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
          context_dictionary[context_wc] = context_dictSize++; context_w = String(context_c);
        }
      }
      if (context_w !== "") {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = value >> 1; }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | value; if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = 0; }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = value >> 1; }
          }
          context_enlargeIn--; if (context_enlargeIn == 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = value >> 1; }
        }
        context_enlargeIn--; if (context_enlargeIn == 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
      }
      value = 2;
      for (i = 0; i < context_numBits; i++) { context_data_val = (context_data_val << 1) | (value & 1); if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; } value = value >> 1; }
      while (true) { context_data_val = (context_data_val << 1); if (context_data_position == bitsPerChar - 1) { context_data.push(getCharFromInt(context_data_val)); break; } else context_data_position++; }
      return context_data.join('');
    },
    _decompress: function (length, resetValue, getNextValue) {
      var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
      for (i = 0; i < 3; i += 1) { dictionary[i] = i; }
      bits = 0; maxpower = Math.pow(2, 2); power = 1;
      while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
      switch (next = bits) {
        case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } c = f(bits); break;
        case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } c = f(bits); break;
        case 2: return "";
      }
      dictionary[3] = c; w = c; result.push(c);
      while (true) {
        if (data.index > length) { return ""; }
        bits = 0; maxpower = Math.pow(2, numBits); power = 1;
        while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
        switch (c = bits) {
          case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } dictionary[dictSize++] = f(bits); c = dictSize - 1; enlargeIn--; break;
          case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1; while (power != maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; } dictionary[dictSize++] = f(bits); c = dictSize - 1; enlargeIn--; break;
          case 2: return result.join('');
        }
        if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
        if (dictionary[c]) { entry = dictionary[c]; } else { if (c === dictSize) { entry = w + w.charAt(0); } else { return null; } }
        result.push(entry);
        dictionary[dictSize++] = w + entry.charAt(0); enlargeIn--; w = entry;
        if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
      }
    }
  };
  return LZString;
})();
// ===== 🗄️ 統一儲存層（單一切換點：打包版檔案存檔 vs 網頁版 localStorage）=====
//   打包版(Electron)：preload.js 注入 window.fableStore（後端＝exe 同層 userdata/filestore 的真實檔案），
//     容量只受硬碟限制，徹底繞過 Chromium localStorage ~5–10MB 配額（5000 格倉庫等大量資料不會寫不進去）。
//   網頁版/file://：無 fableStore → 退回 localStorage，行為與舊版完全一致。
//   所有持久化(存檔位/倉庫/圖鑑桶/_bak)都改走 _lsGet/_lsSet/_lsRemove。
var _FS = (typeof window !== 'undefined' && window.fableStore) ? window.fableStore : null;
// 🖥️ 打包版標記：在 <html> 加 .pkg-build → 套用打包專屬樣式（如下拉清單選項間隔加大·見 css/style.css）。網頁版(無 fableStore)不加→維持原樣。
try { if (_FS && typeof document !== 'undefined' && document.documentElement) document.documentElement.classList.add('pkg-build'); } catch (e) {}
var _itemTransaction = null;
var _itemTransactionStorageBlocked = false;
var _itemTransactionStorageError = null;
var _itemTransactionLockHeld = false;
var _itemTransactionRecoveryPending = false;
var _itemTransactionRecoveryReadBlocked = false;
var _itemTransactionRecoveryPromise = null;
var _itemTransactionReloadRequested = false;
const ITEM_TRANSACTION_JOURNAL_KEY = 'lineage_idle_item_transaction';
const ITEM_TRANSACTION_LOCK_NAME = 'lineage_idle_item_transaction_lock';
function _itemTransactionNotice(message, persistent) {
  let shown = false;
  try {
    if (persistent && typeof document !== 'undefined') {
      let host = document.body || document.documentElement;
      if (host) {
        let el = document.getElementById('item-transaction-storage-notice');
        if (!el) {
          el = document.createElement('div'); el.id = 'item-transaction-storage-notice';
          el.setAttribute('role', 'alert');
          el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:32px;background:rgba(15,23,42,.96);color:#fef3c7;font:18px/1.7 sans-serif;text-align:center;';
          host.appendChild(el);
        }
        el.textContent = message; shown = true;
      }
    } else if (typeof logSys === 'function') {
      logSys(String(message).replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c])));
      shown = true;
    }
  } catch (_) {}
  if (!shown) { try { if (typeof alert === 'function') alert(message); } catch (_) {} }
}
function _itemLockManager() {
  return typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function' ? navigator.locks : null;
}
async function _withItemTransactionLock(action, label) {
  let name = label || '物品操作', locks = _itemLockManager();
  if (!locks) {
    _itemTransactionNotice('目前環境不支援安全儲存，已取消' + name + '。請使用新版瀏覽器的 HTTPS 網址或安裝版。');
    return false;
  }
  if (_itemTransactionStorageBlocked || _itemTransactionRecoveryReadBlocked) {
    _itemTransactionNotice('儲存資料尚未恢復，已取消' + name + '。請依畫面提示處理。');
    return false;
  }
  try {
    return await locks.request(ITEM_TRANSACTION_LOCK_NAME, { mode: 'exclusive', ifAvailable: true }, async lock => {
      if (!lock) { _itemTransactionNotice('另一個視窗正在保存物品，已取消' + name + '，請稍後再試。'); return false; }
      _itemTransactionLockHeld = true;
      try {
        if (_itemTransactionStorageBlocked || _itemTransactionRecoveryReadBlocked) return false;
        if (_itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY) != null) {
          _itemBlockStorage(new Error('An unfinished item transaction requires reload and recovery'));
          _itemTransactionNotice('偵測到未完成的物品交易，已暫停儲存。請重新載入遊戲以恢復原始資料。', true);
          return false;
        }
        return await action();
      } finally { _itemTransactionLockHeld = false; }
    });
  } catch (e) {
    _itemTransactionNotice(name + '未完成：' + (e && e.message ? e.message : '無法取得安全儲存鎖。'));
    return false;
  }
}
// 底層原始讀取不經草稿，僅供提交、驗證與恢復使用。
function _itemReadRaw(k) {
  let raw = _FS ? _FS.get(k) : localStorage.getItem(k);
  if (raw == null && _FS && typeof _FS.has === 'function' && _FS.has(k)) throw new Error('Stored value could not be read: ' + k);
  if (raw != null && typeof raw !== 'string') throw new Error('Invalid stored value: ' + k);
  return raw == null ? null : raw;
}
function _itemTransactionFail(tx, error) {
  if (tx && !tx.error) tx.error = error instanceof Error ? error : new Error(String(error));
  return false;
}
function _itemSnapshotRaw(tx, key) {
  if (tx.error) throw tx.error;
  if (!tx.before.has(key)) tx.before.set(key, _itemReadRaw(key));
  return tx.before.get(key);
}
function _lsGetStrict(k) {
  let tx = _itemTransaction;
  try {
    if (_itemTransactionRecoveryReadBlocked) throw _itemTransactionStorageError || new Error('Item transaction recovery is pending');
    let key = String(k);
    if (!tx) return _itemReadRaw(key);
    let before = _itemSnapshotRaw(tx, key);
    return tx.pending.has(key) ? tx.pending.get(key) : before;
  } catch (e) { _itemTransactionFail(tx, e); throw e; }
}
function _lsGet(k) {
  if (_itemTransaction) return _lsGetStrict(k); // 交易不能把讀取失敗偽裝成空桶。
  if (_itemTransactionRecoveryReadBlocked) return null;
  try { return _FS ? _FS.get(k) : localStorage.getItem(k); } catch (e) { return null; }
}
function _itemStageRaw(key, value) {
  let tx = _itemTransaction;
  try {
    if (_itemTransactionStorageBlocked) throw _itemTransactionStorageError || new Error('Storage recovery is required');
    if (key === ITEM_TRANSACTION_JOURNAL_KEY) throw new Error('Reserved transaction key');
    _itemSnapshotRaw(tx, key);
    tx.pending.set(key, value);
    return true;
  } catch (e) { return _itemTransactionFail(tx, e); }
}
function _lsSet(k, v) {
  if (_itemTransaction) {
    try { return _itemStageRaw(String(k), String(v)); } catch (e) { return _itemTransactionFail(_itemTransaction, e); }
  }
  if (!_itemCanWriteStorage()) return false;
  try { if (_FS) return _FS.set(k, v); localStorage.setItem(k, v); return true; } catch (e) { return false; }
}
function _lsRemove(k) {
  if (_itemTransaction) {
    try { return _itemStageRaw(String(k), null); } catch (e) { return _itemTransactionFail(_itemTransaction, e); }
  }
  if (!_itemCanWriteStorage()) return false;
  try { if (_FS) _FS.remove(k); else localStorage.removeItem(k); return true; } catch (e) { return false; }
}
function _itemCanWriteStorage() {
  if (_itemTransactionStorageBlocked || _itemTransactionRecoveryReadBlocked) return false;
  try { return _itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY) == null; }
  catch (e) { return _itemBlockStorage(e); }
}

// Web saves are written immediately, then compressed in a Worker so LZString cannot block
// rendering or combat. A per-key revision plus raw-value guard prevents stale Worker output
// from replacing a newer save, including writes made by another open tab/window.
var _lzWorker = null, _lzWorkerSeq = 0, _lzWorkerRev = Object.create(null), _lzWorkerRaw = Object.create(null);
function _itemWriteRaw(key, value) {
  if (!_FS) _lzWorkerRev[key] = (_lzWorkerRev[key] || 0) + 1;
  if (value == null) {
    if (_FS) _FS.remove(key); else localStorage.removeItem(key);
  } else if (_FS) {
    if (_FS.set(key, value) !== true) throw new Error('Stored value could not be written: ' + key);
  } else localStorage.setItem(key, value);
  if (_itemReadRaw(key) !== value) throw new Error('Stored value verification failed: ' + key);
}
function _itemWriteWithQuotaFallback(key, value) {
  try { _itemWriteRaw(key, value); return value; }
  catch (e) {
    let quota = e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
    if (_FS || !quota || typeof value !== 'string' || value.startsWith('LZ1:')) throw e;
    // 與一般存檔一致：只有配額不足才同步壓縮；一般手動交易不阻塞主執行緒壓大檔。
    let packed = 'LZ1:' + LZString.compressToUTF16(value);
    if (packed.length >= value.length) throw e;
    _itemWriteRaw(key, packed);
    return packed;
  }
}
function _itemBlockStorage(error) {
  _itemTransactionStorageBlocked = true;
  _itemTransactionStorageError = error instanceof Error ? error : new Error(String(error));
  return false;
}
function _itemJournalEntries(raw) {
  let decoded = raw.startsWith('LZ1:') ? LZString.decompressFromUTF16(raw.slice(4)) : raw;
  let journal = JSON.parse(decoded);
  if (!journal || journal.v !== 1 || typeof journal.id !== 'string' || !journal.id || !Array.isArray(journal.before))
    throw new Error('Invalid item transaction journal');
  let seen = new Set();
  for (let entry of journal.before) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' || !entry[0]
        || entry[0] === ITEM_TRANSACTION_JOURNAL_KEY || seen.has(entry[0])
        || (entry[1] !== null && typeof entry[1] !== 'string')) throw new Error('Invalid item transaction entry');
    seen.add(entry[0]);
  }
  return journal.before;
}
function _itemEnsureJournal(raw) {
  let current = _itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY);
  if (current == null) _itemWriteRaw(ITEM_TRANSACTION_JOURNAL_KEY, raw);
  else if (current !== raw) throw new Error('Item transaction journal changed');
}
function _itemRestoreRaw(entries, journalRaw) {
  let restore = entry => {
    try {
      if (_itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY) !== journalRaw) throw new Error('Item transaction journal changed');
      // 即使原值已在，也必須使尚未回覆的壓縮工作失效。
      if (!_FS) _lzWorkerRev[entry[0]] = (_lzWorkerRev[entry[0]] || 0) + 1;
      if (_itemReadRaw(entry[0]) !== entry[1]) _itemWriteRaw(entry[0], entry[1]);
      return _itemReadRaw(entry[0]) === entry[1];
    } catch (e) { return false; }
  };
  let failed = [];
  for (let i = entries.length - 1; i >= 0; i--) if (!restore(entries[i])) failed.push(entries[i]);
  // 新鍵移除後可能釋出空間，僅對失敗項再試一次。
  return failed.map(restore).every(Boolean);
}
function _itemFinishJournal(raw) {
  if (_itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY) !== raw) throw new Error('Item transaction journal changed');
  try { _itemWriteRaw(ITEM_TRANSACTION_JOURNAL_KEY, null); }
  catch (e) {
    // 刪除已發生但驗證失敗時，盡力補回 before images，維持下次啟動可恢復。
    try { _itemEnsureJournal(raw); } catch (_) {}
    throw e;
  }
}
function _recoverItemTransaction() {
  if (_itemTransaction) return _itemBlockStorage(new Error('Cannot recover while an item transaction is staged'));
  try {
    let raw = _itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY);
    if (raw != null) {
      let entries = _itemJournalEntries(raw);
      if (!_itemRestoreRaw(entries, raw)) throw new Error('Item transaction recovery failed; original data is retained in the journal');
      _itemFinishJournal(raw);
    }
    _itemTransactionStorageBlocked = false;
    _itemTransactionStorageError = null;
    return true;
  } catch (e) { return _itemBlockStorage(e); }
}
function _startItemTransactionRecovery() {
  if (_itemTransactionRecoveryPending || _itemTransactionReloadRequested) return _itemTransactionRecoveryPromise;
  let raw;
  try { raw = _itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY); }
  catch (e) {
    _itemTransactionRecoveryReadBlocked = true;
    _itemBlockStorage(e);
    _itemTransactionNotice('無法讀取儲存資料，已暫停遊戲。請保留現有資料，排除讀寫問題後再重新載入。', true);
    return false;
  }
  // 無 journal 的一般啟動只讀一次；不可再無鎖重讀後恢復，以免撞上另一頁剛開始的提交。
  if (raw == null && !_itemTransactionRecoveryReadBlocked) return true;
  _itemTransactionRecoveryPending = true;
  _itemTransactionRecoveryReadBlocked = true;
  _itemBlockStorage(new Error('Waiting for item transaction recovery'));
  let locks = _itemLockManager();
  if (!locks) {
    _itemTransactionRecoveryPending = false;
    _itemTransactionNotice('偵測到未完成的物品交易，但目前環境無法安全恢復。請保留現有資料，使用新版瀏覽器的 HTTPS 網址或安裝版重新開啟。', true);
    return false;
  }
  _itemTransactionNotice('偵測到未完成的物品交易，正在等待其他視窗完成並恢復資料，請稍候。', true);
  _itemTransactionRecoveryPromise = Promise.resolve().then(() => locks.request(ITEM_TRANSACTION_LOCK_NAME, { mode: 'exclusive' }, lock => {
    if (!lock) throw new Error('Item transaction recovery lock unavailable');
    _itemTransactionLockHeld = true;
    try {
      if (!_recoverItemTransaction()) throw _itemTransactionStorageError;
      // 其他腳本曾讀到被阻擋的空資料；保持公開讀寫關閉，重新載入後才使用恢復完成的資料。
      _itemBlockStorage(new Error('Item transaction recovered; page reload required'));
      _itemTransactionReloadRequested = true;
      try {
        if (typeof location !== 'undefined' && typeof location.reload === 'function') location.reload();
        else _itemTransactionNotice('物品資料已恢復，請手動重新載入遊戲。', true);
      } catch (_) { _itemTransactionNotice('物品資料已恢復，請手動重新載入遊戲。', true); }
      return true;
    } finally { _itemTransactionLockHeld = false; _itemTransactionRecoveryPending = false; }
  })).catch(e => {
    _itemTransactionRecoveryPending = false;
    _itemBlockStorage(e);
    _itemTransactionNotice('物品交易尚未恢復，已暫停遊戲並保留復原資料。請排除儲存空間或讀寫問題後再重新載入。', true);
    return false;
  });
  return _itemTransactionRecoveryPromise;
}
function _commitItemTransaction(tx) {
  if (!tx || !(tx.before instanceof Map) || !(tx.pending instanceof Map)) return false;
  if (_itemTransaction || _itemTransactionStorageBlocked) return _itemTransactionFail(tx, _itemTransactionStorageError || new Error('Item transaction cannot commit'));
  if (tx.error) return false;
  let journalRaw = null, journalAttempted = false, attempted = [], written = new Map();
  try {
    if (_itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY) != null) {
      _itemBlockStorage(new Error('An unfinished item transaction requires recovery'));
      throw _itemTransactionStorageError;
    }
    for (let [key, value] of tx.before) {
      if (_itemReadRaw(key) !== value) throw new Error('Stored data changed during the item transaction: ' + key);
    }
    let entries = [];
    for (let [key, value] of tx.pending) {
      if (typeof key !== 'string' || !key || key === ITEM_TRANSACTION_JOURNAL_KEY || !tx.before.has(key) || (value !== null && typeof value !== 'string'))
        throw new Error('Invalid staged item transaction write');
      if (value !== tx.before.get(key)) entries.push([key, tx.before.get(key)]);
    }
    if (!entries.length) return true;
    journalRaw = JSON.stringify({ v: 1, id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), before: entries });
    journalAttempted = true;
    journalRaw = _itemWriteWithQuotaFallback(ITEM_TRANSACTION_JOURNAL_KEY, journalRaw); // before images 先落盤，空間不足就不碰原資料。
    for (let [key, value] of tx.before) {
      if (_itemReadRaw(key) !== value) throw new Error('Stored data changed before item transaction commit: ' + key);
    }
    for (let entry of entries) {
      if (_itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY) !== journalRaw) throw new Error('Item transaction journal changed');
      if (_itemReadRaw(entry[0]) !== entry[1]) throw new Error('Stored data changed before item transaction write: ' + entry[0]);
      attempted.push(entry); // 寫入可能先成功再拋例外，因此必須先登記。
      written.set(entry[0], _itemWriteWithQuotaFallback(entry[0], tx.pending.get(entry[0])));
    }
    for (let entry of entries) {
      if (_itemReadRaw(entry[0]) !== written.get(entry[0])) throw new Error('Committed item transaction data changed: ' + entry[0]);
    }
    _itemFinishJournal(journalRaw);
    if (!_FS) for (let [key, raw] of written) {
      if (typeof raw === 'string' && raw.length >= 1024 && !raw.startsWith('LZ1:')) {
        try { _queueLzCompression(key, raw, _lzWorkerRev[key] || 0); } catch (_) {}
      }
    }
    return true;
  } catch (e) {
    _itemTransactionFail(tx, e);
    if (!journalAttempted) return false;
    try {
      let current = _itemReadRaw(ITEM_TRANSACTION_JOURNAL_KEY);
      if (!attempted.length && current == null) return false; // journal 配額失敗，原鍵完全未變。
      _itemEnsureJournal(journalRaw);
      if (!_itemRestoreRaw(attempted, journalRaw)) throw new Error('Item transaction rollback failed; retain the journal and stop writing');
      _itemFinishJournal(journalRaw);
    } catch (restoreError) { _itemBlockStorage(restoreError); }
    return false;
  }
}
// Direct raw replacements (backup restore / migration) must invalidate a queued compression
// result for the same key, otherwise an older Worker reply can overwrite the restored value.
function _lzSetStoredRaw(key, value) {
  if (!_FS) _lzWorkerRev[key] = (_lzWorkerRev[key] || 0) + 1;
  return _lsSet(key, value);
}
function _lzRemoveStored(key) {
  if (!_FS) _lzWorkerRev[key] = (_lzWorkerRev[key] || 0) + 1;
  _lsRemove(key);
}
function _getLzWorker() {
  if (_lzWorker || typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return _lzWorker;
  try {
    var source = [
      'var f=String.fromCharCode,LZString={};',
      'LZString._compress=' + LZString._compress.toString() + ';',
      'LZString.compressToUTF16=' + LZString.compressToUTF16.toString() + ';',
      'self.onmessage=function(e){var d=e.data;try{self.postMessage({id:d.id,key:d.key,rev:d.rev,packed:"LZ1:"+LZString.compressToUTF16(d.value)});}catch(err){self.postMessage({id:d.id,key:d.key,rev:d.rev,error:true});}};'
    ].join('\n');
    _lzWorker = new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
    _lzWorker.onmessage = function(e) {
      var d = e.data || {};
      var token = d.key + '@' + d.rev, raw = _lzWorkerRaw[token];
      if (d.error || _lzWorkerRev[d.key] !== d.rev) { delete _lzWorkerRaw[token]; return; }
      delete _lzWorkerRaw[token];
      if (raw == null || _lsGet(d.key) !== raw) return;
      _lsSet(d.key, d.packed);
    };
    _lzWorker.onerror = function() { try { _lzWorker.terminate(); } catch (e) {} _lzWorker = null; _lzWorkerRaw = Object.create(null); };
  } catch (e) { _lzWorker = null; }
  return _lzWorker;
}
function _queueLzCompression(key, value, rev) {
  if (_FS) return;
  var worker = _getLzWorker();
  if (!worker) return;
  var token = key + '@' + rev;
  _lzWorkerRaw[token] = value;
  try { worker.postMessage({ id: ++_lzWorkerSeq, key: key, rev: rev, value: value }); } catch (e) { delete _lzWorkerRaw[token]; }
}
// 一次性遷移：打包版首次啟用檔案存檔時，把舊版存在 Chromium localStorage(userdata/Local Storage)的所有資料複製進檔案存檔，避免玩家存檔「消失」。
(function _migrateToFileStore() {
  try {
    if (!_FS || _FS.has('__fs_migrated_v1')) return;
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) { let k = localStorage.key(i); if (k && !_FS.has(k)) { let v = localStorage.getItem(k); if (v != null) _FS.set(k, v); } }
    }
    _FS.set('__fs_migrated_v1', '1');
  } catch (e) {}
})();
// 壓縮寫入：把 JSON 字串以 'LZ1:'+UTF16 壓縮存入；壓縮或寫入失敗(多半 localStorage 配額)時退回明文（再不行才警告）
function _lzSet(key, jsonStr) {
  if (_itemTransaction) return _lsSet(key, jsonStr);
  if (!_itemCanWriteStorage()) return false;
  // Electron uses real files and is not constrained by localStorage quotas. Writing the
  // signed JSON directly avoids blocking the game loop while LZString compresses a large save.
  // _lzGet already accepts both LZ1-compressed and plain values, so old saves remain compatible.
  if (_FS) return _lsSet(key, jsonStr);
  // Web: make the save durable first and move compression off the main thread. This keeps both
  // manual and timed saves responsive. If raw data exceeds the quota, retain the synchronous
  // compressed fallback below so an already-large save can still be written safely.
  var rev = (_lzWorkerRev[key] || 0) + 1;
  _lzWorkerRev[key] = rev; // Invalidate every older result before either write path starts.
  if (_lsSet(key, jsonStr)) { _queueLzCompression(key, jsonStr, rev); return true; }
  var packed = null;
  try { packed = 'LZ1:' + LZString.compressToUTF16(jsonStr); } catch (e) { packed = null; }
  if (packed != null && _lsSet(key, packed)) return true;
  if (_lsSet(key, jsonStr)) return true;   // 退明文（壓縮失敗或寫入失敗）
  if (typeof logSys === 'function') logSys('<span class="text-red-400 font-bold">⚠ 儲存空間不足，存檔可能未完整寫入。</span>');
  return false;
}
// 解壓讀取：'LZ1:' 前綴→解壓；否則原樣回傳（相容舊明文存檔）。回傳 JSON 字串或 null（key 不存在）
function _lzGet(key) {
  if (_itemTransaction) return _lzGetStrict(key);
  var raw = _lsGet(key); if (raw == null) return null;
  if (raw.slice(0, 4) === 'LZ1:') { try { return LZString.decompressFromUTF16(raw.slice(4)); } catch (e) { return null; } }
  return raw;
}
// 匯出與倉庫交易不能把「讀取／解壓失敗」當成空資料；只有真正不存在才回 null。
function _lzGetStrict(key) {
  try {
  let raw = _lsGetStrict(key);
  if (raw == null) return null;
  if (typeof raw !== 'string') throw new Error('Invalid stored value: ' + key);
  if (raw.slice(0, 4) !== 'LZ1:') return raw;
  let decoded = LZString.decompressFromUTF16(raw.slice(4));
  if (typeof decoded !== 'string' || decoded === '') throw new Error('Stored value could not be decompressed: ' + key);
  return decoded;
  } catch (e) { _itemTransactionFail(_itemTransaction, e); throw e; }
}

// 儲存層與舊桌面資料遷移就緒後，先恢復未完成交易，再讓其餘遊戲腳本載入。
_startItemTransactionRecovery();

// 🎲 種子型亂數（決定論 PRNG·xmur3→mulberry32）：相同的字串輸入永遠得到同一個 [0,1) 值。
//    用途＝把「強化成敗」改成由存檔內種子決定，讓讀檔/匯入舊檔回到強化前也算出完全相同的結果（杜絕 save/load 刷強化值）。
function _seedHash(str) {
  str = String(str); let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
function _seededFloat(str) {
  let a = (_seedHash(str) + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
// 🎲 強化成敗＝即時 Math.random()（每次嘗試獨立擲骰）：2026-06 用戶要求改回純機率
//    （「物品強化值由種子預先決定」違背賭博本意）。強化已不再走 committed RNG，可被 save/load 重抽。
//    player.enSeed 改僅供 lootRng（掉落）與娃娃 _dollRng 使用，與強化無關。

// 🎲 「獲得/抽取瞬間」決定論亂數（committed RNG·防 SL 存讀檔重抽）：把掉落/製作/兌換/潘朵拉/開箱/裂痕領取/碧恩賦予 等
//   在行動當下擲出、且會 baked 進存檔的隨機（自帶強化值／詞綴／席琳套裝效果／抽到哪一件…）改由「存檔內遞增序號 player.lootSeq」決定。
//   序號入存檔且受 SIG1 簽章 → 讀檔或重匯入舊檔回到行動前 → 相同序號 → 算出完全相同結果 → 重抽無效。比照娃娃 dollSeq。
//   ⚠️標題/載入畫面（尚無 player）退回 Math.random（該情境無存檔可 SL，不影響玩家）。每呼叫一次消耗一個序號。
function lootRng(tag) {
    if (typeof player === 'undefined' || !player) return Math.random();
    if (player.lootSeq == null) player.lootSeq = 0;
    return _seededFloat((player.enSeed || 'nseed') + '|loot|' + (player.lootSeq++) + '|' + (tag || ''));
}

// 🛡️ 存檔簽章：網頁版使用 SIG1；WebView2 內部與安裝版專用匯出由 Host 產生 SIG2。
//    SIG1 的鹽值必須留在純網頁版；SIG2 金鑰只存在桌面 Host，JS 不接觸金鑰。
const _SAVE_SALT = 'fb5#9c3a7e1d-save-integrity-salt-do-not-edit#a1b2c3';
function _signSave(s) {
  let a = _seedHash(_SAVE_SALT + '::' + s);
  let b = _seedHash(s + '::' + _SAVE_SALT + '::' + a);
  return (a >>> 0).toString(36) + '.' + (b >>> 0).toString(36) + '.' + (s.length).toString(36);
}
function _saveWrapPortable(payloadStr) {
  payloadStr = String(payloadStr);
  return 'SIG1:' + _signSave(payloadStr) + ':' + payloadStr;
}
function _desktopSaveSign(payloadStr) {
  if (!_FS || typeof _FS.sign !== 'function') return null;
  let sig = String(_FS.sign(payloadStr));
  if (!/^[A-Za-z0-9_-]{43}\.[0-9a-z]+$/.test(sig)) throw new Error('desktop save signer returned an invalid signature');
  return sig;
}
// 包簽章：桌面內部資料優先 SIG2；一般瀏覽器與不支援 Sign 的舊桌面殼維持 SIG1。
function _saveWrap(payloadStr) {
  payloadStr = String(payloadStr);
  let desktopSig = _desktopSaveSign(payloadStr);
  return desktopSig ? ('SIG2:' + desktopSig + ':' + payloadStr) : _saveWrapPortable(payloadStr);
}
// 解簽章：回傳 {payload, signed, ok}。未簽章（舊檔/舊匯出明文）→ signed:false、ok:true、payload 原樣（向後相容）
function _saveUnwrap(raw) {
  if (raw == null) return { payload: null, signed: false, ok: true };
  let prefix = String(raw).slice(0, 5);
  if (prefix === 'SIG1:' || prefix === 'SIG2:') {
    let rest = raw.slice(5), i = rest.indexOf(':');
    if (i < 0) return { payload: raw, signed: true, ok: false };   // 🛡️ 有 SIG1 前綴卻缺分隔符＝格式毀損/被竄改：視為簽章不符（交由呼叫端拒絕）
    let sig = rest.slice(0, i), payload = rest.slice(i + 1);
    let expected = prefix === 'SIG2:' ? _desktopSaveSign(payload) : _signSave(payload);
    return { payload: payload, signed: true, ok: (expected != null && expected === sig) };
  }
  return { payload: raw, signed: false, ok: true };
}
const EXP_T = [0, 125, 175, 200, 250, 546, 1105, 1695, 2465, 3439, 4641, 6095, 7825, 9855, 12209, 14911, 17985, 21455, 25345, 29679, 34481, 40033, 45585, 51935, 58849, 66351, 74465, 83215, 92625, 102719, 113521, 125055, 137345, 150415, 164289, 178991, 194545, 210975, 228305, 246559, 265761, 285935, 307105, 329817, 352529, 729360, 1508416, 3495263, 9912189, 36065092];
// ⚠️v3.0.82：Lv1-69 使用天堂經典版經驗表；一般與經典模式需求相同。
// ⚖️v3.4.58：Lv70-99 不再沿用過陡的幾何推估，改以 Lv69 的「需求／同級怪經驗」比例為錨點。
//   同級怪經驗＝等級²＋1；Lv69 需約 385,717 隻，因此 Lv70-99 每級皆維持相同擊殺比例，怪物經驗本身不變。
//   下列 V2 表保留舊存檔進度百分比遷移之用；正式需求由其 Lv1-69＋新比例組成。
const EXP_REQ_CLASSIC_V2 = [0,
    3, 16, 50, 113, 245, 485, 898, 1584, 2685, 4407,
    7043, 11005, 16865, 25408, 37702, 55190, 79799, 114083, 161403, 226142,
    313974, 432193, 590100, 799479, 1075145, 1435599, 1903780, 2507936, 3282607, 4269738,
    5519907, 7093682, 9063076, 11513098, 14543375, 18269802, 22826176, 28365775, 35062787, 35413415,
    35774602, 36244146, 36854552, 37648081, 38679668, 40020732, 41764114, 44030511, 46976827, 50807038,
    55786313, 62259370, 70674343, 81613809, 95835115, 114322812, 138356819, 169601028, 210218499, 263021211,
    331664738, 420901322, 443914114, 558686964, 705596211, 893640048, 1134336160, 1442427182, 1836783691,
    2341899206, 2988263387, 3816012345, 4876863777, 6237508771, 7984011227, 10227518382, 13111678566, 16822283600, 21599812142,
    27755758602, 35693905562, 45938056458, 59168216718, 76267831350, 98385502442, 127015683653, 164104263280, 212186812421, 274569735273,
    355567807179, 460815878104, 597678193901, 775786295683, 1007746398092, 1310070317520, 1703091412776, 2214018836609, 2878224487592, 3741691833870
];
const EXP_REQ_LV69_KILLS = Math.ceil(EXP_REQ_CLASSIC_V2[69] / (69 * 69 + 1));   // 385,717
const EXP_REQ_CLASSIC = EXP_REQ_CLASSIC_V2.map((req, lv) =>
    (lv >= 70 && lv < 100) ? (lv * lv + 1) * EXP_REQ_LV69_KILLS : req
);   // index＝等級；Lv99→100＝3,780,798,034（約 38 億，不再是 3.74 兆）
function _expReqClassicV2(lv) {   // v3.4.58 以前的經典表；僅供 expMigV=3 百分比遷移
    if (lv >= 100) return Infinity;
    return EXP_REQ_CLASSIC_V2[lv] || Infinity;
}
function getExpReq(lv) {
    if (lv >= 100) return Infinity;
    return EXP_REQ_CLASSIC[lv] || Infinity;
}
// 舊制需求（v2.6.40 分段放大制·僅供 js/13 expMigV=2 一次性遷移換算，勿用於遊戲邏輯）
function _expReqOldV1(lv) {
    if (lv >= 100) return Infinity;
    if (lv >= 90)  return 36930654208;
    if (lv >= 87)  return 18465327104;
    if (lv >= 86)  return 9232663552;
    if (lv >= 84)  return 4616331776;
    if (lv >= 82)  return 2308165888;
    if (lv >= 80)  return 1154082944;
    if (lv >= 79)  return 577041472;
    if (lv >= 75)  return 288520736;
    if (lv >= 70)  return 144260368;
    if (lv >= 50)  return 72130184;
    if (lv >= 49)  return 36065092;
    return EXP_T[lv];
}
function getExpGainMult(lv) { return lv >= 100 ? 0 : 1; }   // ⚠️v2.6.40 取消高等經驗遞減（恆全額）；滿等(100)仍不獲得。遞減效果改由 getExpReq 提高需求承擔。

const DB = {
        items: {
        "wpn_alien": { n: "亞連", type: "wpn", dmgS: 4, dmgL: 4, hit: 2, spd: 1.1, req: "all", safe: 6, p: 14, gachaWeight: 100 },
        "wpn_katana": { n: "武士刀", type: "wpn", dmgS: 10, dmgL: 12, hit: 1, spd: 0.9, req: "knight,elf", safe: 6, p: 28200, gachaWeight: 10 },
        "wpn_longsword": { n: "長劍", type: "wpn", dmgS: 8, dmgL: 12, hit: 0, spd: 0.9, req: "knight,elf", safe: 6, p: 4200, gachaWeight: 50 },
        "wpn_1": { n: "斧", type: "wpn", dmgS: 3, dmgL: 5, hit: 0, spd: 1, req: "all", safe: 6, p: 28, gachaWeight: 100 },
        "wpn_2hsword": { n: "雙手劍", type: "wpn", w2h: true,dmgS: 14, dmgL: 16, hit: 0, spd: 1, req: "knight", safe: 6, p: 25200, eff: "cleave", gachaWeight: 10 },
        "wpn_official_2h": { n: "武官雙手劍", type: "wpn", w2h: true, dmgS: 19, dmgL: 23, hit: 1, dmgBonus: 2, spd: 1, req: "knight", safe: 6, p: 95940, eff: "cleave", gachaWeight: 10 },   // 🔧 非傳說：權重 10（同武官頭盔/護鎧），避免潘朵拉抽獎誤判為「傳說大獎(權重1)」
        "wpn_dragonslayer": { n: "屠龍劍", type: "wpn", w2h: true, dmgS: 28, dmgL: 35, hit: 2, dmgBonus: 9, spd: 1, req: "royal,knight,dragon", safe: 6, p: 300000, eff: "cleave", dragonStrike: 12, legend: true, gachaWeight: 1, d: "傳說中為屠龍而鍛造的雙手巨劍，劍身中沉眠著龍魂，一旦甦醒便嗜血咆哮。" },   // 🔧 卡瑞 100% 掉落（🎮 經典模式亦 100%·v2.6.75）；潘朵拉抽不到
        "wpn_vander_sword": { n: "騎士范德之劍", type: "wpn", w2h: true, dmgS: 22, dmgL: 34, hit: 5, dmgBonus: 6, spd: 1, req: "knight", safe: 6, p: 210000, eff: "cleave", str: 1, vanderStunHit: true, legend: true, gachaWeight: 1, d: "闇黑騎士范德生前佩持的雙手巨劍，劍上仍纏著未散的殺意。" },
        "wpn_2": { n: "釘錘", type: "wpn", dmgS: 6, dmgL: 8, hit: 0, spd: 1.1, req: "all", safe: 6, p: 133, gachaWeight: 100 },
        "wpn_3": { n: "弓", type: "wpn", isBow: true, ranged: true, rapidfire: 20, dmgS: 2, dmgL: 2, hit: 0, spd: 1.0, req: "all", safe: 6, p: 70, gachaWeight: 100 },
        "wpn_4": { n: "矛", type: "wpn", dmgS: 6, dmgL: 8, hit: 0, spd: 1, req: "all", safe: 6, p: 120, gachaWeight: 100 },
        "wpn_battleaxe": { n: "戰斧", type: "wpn", w2h: true, dmgS: 18, dmgL: 18, hit: 0, spd: 1.1, req: "knight,elf", safe: 6, p: 980, gachaWeight: 100, eff: "crush" },
        "wpn_5": { n: "箭", type: "wpn", isArrow: true, dmgS: 6, dmgL: 5, hit: 0, p: 0, gachaWeight: 0 },
        "wpn_6": { n: "巴迪須", type: "wpn", w2h: true, dmgS: 10, dmgL: 12, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 56, gachaWeight: 100, eff: "pierce", pierceChance: 35 },
        "wpn_7": { n: "柴刀", type: "wpn", w2h: true, dmgS: 10, dmgL: 17, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 252, gachaWeight: 100, eff: "pierce", pierceChance: 35 },
        "wpn_elfbow": { n: "精靈弓", type: "wpn", isBow: true, ranged: true, rapidfire: 45, dmgS: 2, dmgL: 2, hit: 0, dmgBonus: 1, spd: 1.0, req: "all", safe: 6, p: 620, gachaWeight: 100 },
        "wpn_8": { n: "歐西斯弓", type: "wpn", isBow: true, ranged: true, rapidfire: 10, dmgS: 2, dmgL: 2, hit: 0, dmgBonus: -1, spd: 1.0, req: "all", safe: 6, p: 30, gachaWeight: 100 },
        "wpn_9": { n: "闊劍", type: "wpn", dmgS: 4, dmgL: 6, hit: 0, spd: 0.9, req: "all", safe: 6, p: 490, gachaWeight: 100 },
        "wpn_10": { n: "木棒", type: "wpn", dmgS: 6, dmgL: 3, hit: 0, spd: 1.1, req: "all", safe: 6, p: 42, gachaWeight: 100 },
        "wpn_dagger2": { n: "精靈匕首", type: "wpn", dmgS: 4, dmgL: 3, hit: 2, spd: 0.6, req: "all", safe: 6, p: 42, unBonus: true, gachaWeight: 100 },
        "wpn_dagger1": { n: "歐西斯匕首", type: "wpn", dmgS: 2, dmgL: 3, hit: 2, spd: 0.6, req: "all", safe: 6, p: 10, gachaWeight: 100 },
        "wpn_11": { n: "匕首", type: "wpn", dmgS: 4, dmgL: 2, hit: 2, spd: 0.6, req: "all", safe: 6, p: 10, gachaWeight: 100 },
        "wpn_12": { n: "貝卡合金", type: "wpn", w2h: true, dmgS: 17, dmgL: 17, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 22400, eff: "pierce", pierceChance: 100, gachaWeight: 10 },
        "wpn_halberd": { n: "法丘", type: "wpn", w2h: true, dmgS: 16, dmgL: 16, hit: 0, spd: 0.8, req: "knight,elf", safe: 6, p: 11200, unBonus: true, gachaWeight: 50, eff: "pierce", pierceChance: 80 },
        "wpn_13": { n: "弗萊爾", type: "wpn", dmgS: 6, dmgL: 4, hit: 0, spd: 1.1, req: "all", safe: 6, p: 56, gachaWeight: 100 },
        "wpn_14": { n: "闊矛", type: "wpn", w2h: true, dmgS: 12, dmgL: 16, hit: 0, spd: 1.1, req: "knight,elf", safe: 6, p: 42, gachaWeight: 100, eff: "pierce", pierceChance: 60 },
        "wpn_15": { n: "吉薩", type: "wpn", w2h: true, dmgS: 12, dmgL: 14, hit: 0, spd: 1.1, req: "knight,elf", safe: 6, p: 280, gachaWeight: 100, eff: "pierce", pierceChance: 70 },
        "wpn_16": { n: "戟", type: "wpn", w2h: true, dmgS: 16, dmgL: 12, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 2800, gachaWeight: 50, eff: "pierce", pierceChance: 60 },
        "wpn_17": { n: "槍", type: "wpn", w2h: true, dmgS: 6, dmgL: 8, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 84, gachaWeight: 100, eff: "pierce", pierceChance: 35 },   // 🔱 雙手矛＝穿透（原漏 eff·唯一沒穿透的雙手矛→補 35%·比照巴迪須/柴刀基礎階）
        "wpn_18": { n: "露西錘", type: "wpn", w2h: true, dmgS: 15, dmgL: 17, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 14000, gachaWeight: 30, eff: "pierce", pierceChance: 50 },
        "wpn_19": { n: "戰錘", type: "wpn", w2h: true, dmgS: 17, dmgL: 19, hit: 0, spd: 1.2, req: "knight,elf", safe: 6, p: 1400, gachaWeight: 100, eff: "crush" },
        "wpn_20": { n: "流星錘", type: "wpn", dmgS: 9, dmgL: 10, hit: 0, spd: 1.1, req: "knight,elf", safe: 6, p: 4900, gachaWeight: 50 },
        "wpn_21": { n: "帕提森", type: "wpn", dmgS: 6, dmgL: 6, hit: 0, spd: 1, req: "knight,elf", safe: 6, p: 700, gachaWeight: 100 },
        "wpn_scimitar": { n: "彎刀", type: "wpn", dmgS: 8, dmgL: 8, hit: 0, spd: 0.9, req: "all", safe: 6, p: 1400, gachaWeight: 100 },
        "wpn_22": { n: "銀箭", type: "wpn", isArrow: true, dmgS: 7, dmgL: 6, hit: 0, p: 0, unBonus: true, gachaWeight: 0 },
        "wpn_23": { n: "侏儒鐵斧", type: "wpn", w2h: true, dmgS: 18, dmgL: 24, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 1376, gachaWeight: 100, eff: "crush" },
        "wpn_24": { n: "精靈之矛", type: "wpn", dmgS: 7, dmgL: 8, hit: 0, spd: 1, req: "all", safe: 6, p: 1180, unBonus: true, gachaWeight: 100 },
        "wpn_25": { n: "歐西斯之矛", type: "wpn", dmgS: 4, dmgL: 6, hit: 0, spd: 1, req: "all", safe: 6, p: 16, gachaWeight: 100 },
        "wpn_26": { n: "小侏儒短劍", type: "wpn", dmgS: 7, dmgL: 8, hit: 0, spd: 0.8, req: "all", safe: 6, p: 58, gachaWeight: 100 },
        "wpn_elfsword": { n: "精靈短劍", type: "wpn", dmgS: 8, dmgL: 8, hit: 0, spd: 0.8, req: "all", safe: 6, p: 3680, unBonus: true, gachaWeight: 100 },
        "wpn_27": { n: "歐西斯短劍", type: "wpn", dmgS: 4, dmgL: 4, hit: 0, spd: 0.8, req: "all", safe: 6, p: 10, gachaWeight: 100 },
        "wpn_shortsword": { n: "短劍", type: "wpn", dmgS: 6, dmgL: 8, hit: 0, spd: 0.8, req: "all", safe: 6, p: 140, gachaWeight: 100 },
        "wpn_28": { n: "三叉戟", type: "wpn", dmgS: 5, dmgL: 4, hit: 0, spd: 1, req: "knight,elf", safe: 6, p: 35, gachaWeight: 100 },
        "wpn_siruge": { n: "瑟魯基之劍", type: "wpn", dmgS: 16, dmgL: 10, hit: 2, spd: 0.9, req: "knight", safe: 6, p: 41196, gachaWeight: 10 },
        "wpn_29": { n: "尤米弓", type: "wpn", isBow: true, ranged: true, rapidfire: 55, dmgS: 3, dmgL: 3, hit: 0, dmgBonus: 3, spd: 1.0, req: "elf", safe: 6, p: 32680, gachaWeight: 10 },
        "wpn_shortbow": { n: "短弓", type: "wpn", isBow: true, ranged: true, rapidfire: 10, dmgS: 2, dmgL: 2, hit: 0, dmgBonus: -1, spd: 1.0, req: "all", safe: 6, p: 10, gachaWeight: 100 },
        "wpn_30": { n: "米索莉箭", type: "wpn", isArrow: true, dmgS: 10, dmgL: 9, hit: 0, p: 1, unBonus: true, gachaWeight: 0 },
        "wpn_31": { n: "十字弓", type: "wpn", isBow: true, ranged: true, rapidfire: 50, dmgS: 3, dmgL: 2, hit: 3, dmgBonus: 2, spd: 1.0, req: "knight,elf,dark", safe: 6, p: 59400, gachaWeight: 10 },   // 🖤 v3.2.4：黑暗妖精可用改由 req 顯式標示（原靠 DARK_XBOW_LEGACY 通則·通則已刪·現狀保留）
        "wpn_32": { n: "獵人之弓", type: "wpn", isBow: true, ranged: true, rapidfire: 30, dmgS: 2, dmgL: 2, hit: 5, dmgBonus: 1, spd: 1.0, req: "all", safe: 6, p: 11000, gachaWeight: 20 },
		"wpn_flaming_angel": { n: "熾炎天使弓", type: "wpn", isBow: true, ranged: true, rapidfire: 40, dmgS: 3, dmgL: 3, hit: 3, dmgBonus: 4, spd: 1.0, req: "elf", safe: 6, p: 137300, w2h: true, eff: "moonburst", legend: true, gachaWeight: 1 },   // 🔧 潘朵拉抽不到；取得來源：羅賓孫製作、死神(0.001%)、惡魔(0.5%)
        "wpn_redknight": { n: "紅騎士之劍", type: "wpn", dmgS: 8, dmgL: 12, hit: 0, spd: 0.9, req: "all", safe: 6, p: 2400, str: 1, gachaWeight: 20 },
        "wpn_invader": { n: "侵略者之劍", type: "wpn", dmgS: 9, dmgL: 11, hit: 0, spd: 0.9, req: "all", safe: 6, p: 3500, gachaWeight: 100 },
        "wpn_33": { n: "骰子匕首", type: "wpn", dmgS: 3, dmgL: 3, hit: 0, spd: 0.7, eff: "dice_death", req: "all", safe: 6, p: 444, gachaWeight: 10 },
        "wpn_damascus": { n: "大馬士革刀", type: "wpn", dmgS: 10, dmgL: 11, hit: 0, spd: 0.9, req: "knight,elf", safe: 6, p: 22000, ignHardSkin: true, gachaWeight: 20 },   // ⚔️ 單手劍：反擊由 WEAPON_TAGS 賦予；貫穿無視硬皮額外減傷
        "wpn_34": { n: "短劍的劍身", type: "wpn", dmgS: 2, dmgL: 2, hit: 0, spd: 0.8, req: "all", safe: 6, p: 320, unBonus: true, gachaWeight: 100 },
        "wpn_35": { n: "長劍的劍身", type: "wpn", dmgS: 3, dmgL: 3, hit: 0, spd: 0.9, req: "all", safe: 6, p: 360, unBonus: true, gachaWeight: 100 },
        "wpn_36": { n: "奧里哈魯根的劍身", type: "wpn", dmgS: 4, dmgL: 4, hit: 0, spd: 0.9, req: "all", safe: 6, p: 960, unBonus: true, gachaWeight: 100 },
        "wpn_rapier": { n: "細劍", type: "wpn", dmgS: 11, dmgL: 6, hit: 0, spd: 0.9, req: "knight,elf", safe: 6, p: 5230, unBonus: true, gachaWeight: 20 },
        "wpn_mailbreaker": { n: "鎖子甲破壞者", type: "wpn", dmgS: 4, dmgL: 5, hit: 10, spd: 0.9, req: "all", safe: 6, p: 12000, unBonus: true, gachaWeight: 10 },
        "wpn_silversword": { n: "銀長劍", type: "wpn", dmgS: 8, dmgL: 12, hit: 0, spd: 0.9, req: "all", safe: 6, p: 18200, unBonus: true, gachaWeight: 50 },
        "wpn_37": { n: "銀劍", type: "wpn", dmgS: 7, dmgL: 7, hit: 0, spd: 0.9, req: "all", safe: 6, p: 2520, unBonus: true, gachaWeight: 70 },
        "wpn_oakwand": { n: "橡木魔法杖", type: "wpn", dmgS: 3, dmgL: 4, hit: 0, spd: 1.0, req: "all", safe: 6, p: 330, gachaWeight: 100, extraMpPerEn: 1 },
        "wpn_38": { n: "美基魔法杖", type: "wpn", dmgS: 4, dmgL: 5, hit: 0, spd: 1.0, req: "mage", safe: 6, p: 3500, gachaWeight: 100, extraMpPerEn: 1 },
        "wpn_witchwand": { n: "巫術魔法杖", type: "wpn", dmgS: 2, dmgL: 3, hit: 0, mdmg: 1, spd: 1.0, req: "mage", safe: 6, p: 12600, gachaWeight: 50, extraMpPerEn: 1 },
        "wpn_strwand": { n: "力量魔法杖", type: "wpn", dmgS: 9, dmgL: 9, hit: 0, dmgBonus: 3, mdmg: -2, str: 3, spd: 1.0, req: "mage", safe: 6, p: 71500, meleeHitPerEn: 1, eff: "magicstrike", gachaWeight: 10 },
        "wpn_manawand": { n: "瑪那魔杖", type: "wpn", dmgS: 3, dmgL: 3, hit: -1, spd: 1.0, req: "mage", safe: 6, p: 10000, eff: "mp_drain", gachaWeight: 20 },
        // 🔷🔶 鋼鐵瑪那魔杖（象牙塔『神秘的魔法師』客製製作·成品恆 +0）：單手魔杖（名稱含「魔杖」→ 自動歸類魔杖家族＋貫穿）；mpOnHitBase:2 → 命中回 2 MP、+7 起每強化再 +1
        "wpn_steel_manawand_blue": { n: "藍色鋼鐵瑪那魔杖", type: "wpn", dmgS: 15, dmgL: 15, hit: 6, dmgBonus: 3, str: 3, mdmg: 3, spd: 1.0, req: "mage,illusion", safe: 6, p: 75000, mpOnHit: true, mpOnHitBase: 2, gachaWeight: 10, d: "以鋼鐵重鑄的瑪那魔杖，杖心的魔法寶石映著幽藍冷光。" },
        "wpn_steel_manawand_red": { n: "紅色鋼鐵瑪那魔杖", type: "wpn", dmgS: 15, dmgL: 15, hit: 6, dmgBonus: 3, str: 3, mdmg: 3, spd: 1.0, req: "mage,illusion", safe: 6, p: 75000, eff: "magicstrike", mpOnHit: true, mpOnHitBase: 2, gachaWeight: 10, d: "以鋼鐵重鑄的力量魔法杖，杖心的魔法寶石燃著赤紅烈焰。" },
        "wpn_crystalwand": { n: "水晶魔杖", type: "wpn", dmgS: 1, dmgL: 1, hit: 0, spd: 1.0, req: "mage", safe: 6, p: 10000, mpR: 10, mpROverSafe: 2, gachaWeight: 20 },
        "wpn_powerless_baless": { n: "失去魔力的巴列斯魔杖", type: "wpn", dmgS: 1, dmgL: 1, hit: 0, dmgBonus: 0, spd: 1.0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, d: "魔力早已枯竭的古老魔杖，杖芯卻仍隱隱悸動。攜帶它並使用『靈魂之球』，或許能喚回沉睡的力量……（封印狀態無法強化；傳統模式下解封印才附加隨機強化值。可販售，售價 100000）" },   // 🔧 巴列斯任務武器；🏛️ noEnhance＝封印恆 +0（傳統模式自帶強化值延後到靈魂之球解封印時附加）
        "wpn_baless": { n: "巴列斯魔杖", type: "wpn", dmgS: 2, dmgL: 3, hit: 0, dmgBonus: 0, mdmg: 2, spd: 1.0, req: "mage", safe: 0, p: 250000, mpR: 10, mpROverSafe: 2, legend: true, gachaWeight: 1, d: "重獲魔力的傳說魔杖，杖身蘊含撼動萬物的共鳴之力。" },   // 🏅 傳說武器（共鳴：見 WAND_LIGHTARROW_IDS）；🔧 安定值0：+0 為 MP自然恢復10，每強化+1再+2（10/12/14…）
        "wpn_39": { n: "潘的角", type: "wpn", dmgS: 3, dmgL: 4, hit: 0, spd: 1, req: "all", safe: 6, p: 10, gachaWeight: 100 },
        "wpn_40": { n: "覆上米索莉的角", type: "wpn", dmgS: 4, dmgL: 4, hit: 0, spd: 1, req: "all", safe: 6, p: 178, unBonus: true, gachaWeight: 100 },
        "wpn_41": { n: "覆上奧里哈魯根的角", type: "wpn", dmgS: 7, dmgL: 8, hit: 0, spd: 1, req: "all", safe: 6, p: 1430, unBonus: true, gachaWeight: 100 },
        "wpn_giantaxe": { n: "巨斧", type: "wpn", w2h: true, dmgS: 20, dmgL: 26, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 18200, gachaWeight: 50, eff: "crush" },
        "wpn_berserker": { n: "狂戰士斧", type: "wpn", w2h: true, dmgS: 19, dmgL: 19, hit: 0, spd: 0.9, req: "knight", safe: 6, p: 13520, gachaWeight: 10, eff: "crush" },
		"wpn_silveraxe": { n: "銀斧", type: "wpn", w2h: true, dmgS: 17, dmgL: 24, hit: 0, spd: 1.1, req: "knight", safe: 6, p: 11200, unBonus: true, gachaWeight: 20, eff: "crush" },
        // ===== 黑暗妖精武器：鋼爪（雙手，連擊） =====
        "wpn_claw_bronze":   { n: "青銅鋼爪", type: "wpn", w2h: true, dmgS: 8,  dmgL: 7,  hit: 2, spd: 0.9, req: "dark", safe: 6, p: 250,   eff: "combo", gachaWeight: 100 },
        "wpn_claw_steel":    { n: "鋼鐵鋼爪", type: "wpn", w2h: true, dmgS: 10, dmgL: 8,  hit: 1, spd: 0.9, req: "dark", safe: 6, p: 500,   eff: "combo", gachaWeight: 100 },
        "wpn_claw_shadow":   { n: "暗影鋼爪", type: "wpn", w2h: true, dmgS: 12, dmgL: 10, hit: 1, spd: 0.9, req: "dark", safe: 6, p: 35000, eff: "combo", gachaWeight: 50 },
        "wpn_claw_silver":   { n: "銀光鋼爪", type: "wpn", w2h: true, dmgS: 13, dmgL: 10, hit: 0, dmgBonus: 1, spd: 0.9, req: "dark", safe: 6, p: 3800,  eff: "combo", unBonus: true, gachaWeight: 50 },
        "wpn_claw_dark":     { n: "黑暗鋼爪", type: "wpn", w2h: true, dmgS: 14, dmgL: 11, hit: 0, dmgBonus: 2, spd: 0.9, req: "dark", safe: 6, p: 5000,  eff: "combo", gachaWeight: 50 },
        "wpn_claw_gloom":    { n: "幽暗鋼爪", type: "wpn", w2h: true, dmgS: 17, dmgL: 15, hit: 0, dmgBonus: 3, spd: 0.9, req: "dark", safe: 6, p: 36000, eff: "combo", gachaWeight: 30 },
        "wpn_claw_damascus": { n: "大馬士革鋼爪", type: "wpn", w2h: true, dmgS: 17, dmgL: 13, hit: 0, spd: 0.9, req: "dark", safe: 6, p: 48000, eff: "combo", hardWear: 1, gachaWeight: 50 },
        "wpn_claw_abyss":    { n: "暗黑鋼爪", type: "wpn", w2h: true, dmgS: 22, dmgL: 18, hit: 4, dmgBonus: 5, spd: 0.9, req: "dark", safe: 6, p: 10000, eff: "combo", gachaWeight: 5 },
        // ===== 魔獸軍王巴蘭卡：雙爪（鋼爪類，連擊） =====
        "wpn_baranka_claw":      { n: "魔獸軍王之爪", type: "wpn", w2h: true, dmgS: 12, dmgL: 12, hit: 0, dmgBonus: 2, spd: 0.8, req: "dark", safe: 6, p: 25000,  eff: "combo", gachaWeight: 10 },
        "wpn_baranka_steelclaw": { n: "巴蘭卡鋼爪",   type: "wpn", w2h: true, dmgS: 18, dmgL: 18, hit: 0, dmgBonus: 8, spd: 0.7, req: "dark", safe: 6, p: 125000, eff: "combo", legend: true, gachaWeight: 1 },
        // ===== 傳說單手劍：附帶魔法施放特效（spellProc，不需學會技能、必中、受魔法傷害影響） =====
        "wpn_dk_flameblade": { n: "死亡騎士的烈炎之劍", type: "wpn", dmgS: 16, dmgL: 10, hit: 5, dmgBonus: 2, spd: 0.8, req: "knight", safe: 6, p: 152000, legend: true, gachaWeight: 1, spellProc: { skn: "地獄火", dice: [16, 5], flat: 40, ele: "fire", aoe: true }, procRateBase: 3, procRatePerEn: 1, d: "死亡騎士緊握至死的劍，劍刃終年燃著不滅的地獄業火。" },
        "wpn_kurt_sword":    { n: "克特之劍", type: "wpn", dmgS: 15, dmgL: 11, hit: 9, dmgBonus: 5, spd: 0.8, req: "knight,elf", safe: 6, p: 152000, legend: true, gachaWeight: 1, spellProc: { skn: "極道落雷", dice: [5, 8], flat: 40, ele: "wind" }, procRateBase: 15, procRatePerEn: 1, d: "克特之劍，劍鋒間遊走著被馴服的雷霆。" },
        // ===== ⚡ 元素施放傳說武器（spellProc·攻擊1%+每強化1%觸發·必中·受魔法傷害影響·不吃法師階級加成） =====
        "wpn_thor_hammer":   { n: "雷神之鎚", type: "wpn", dmgS: 7, dmgL: 12, hit: 3, dmgBonus: 0, spd: 0.9, req: "royal,knight,elf,mage,warrior", safe: 6, p: 46000, legend: true, gachaWeight: 1, ignHardSkin: true, spellProc: { skn: "電光衝擊", dice: [5, 5], flat: 5, ele: "wind", status: { kind: "stun", pct: 5, dur: 3 } }, procRateBase: 1, procRatePerEn: 1, d: "雷神遺落的戰鎚，鎚頭間纏繞著未平息的雷霆。" },
        "wpn_pagrio_wrath":  { n: "帕格里奧之怒", type: "wpn", dmgS: 13, dmgL: 9, hit: 2, dmgBonus: 2, spd: 0.8, req: "royal,knight,elf", safe: 6, p: 56000, legend: true, gachaWeight: 1, ignHardSkin: true, spellProc: { skn: "火焰之陣", dice: [6, 6], flat: 6, ele: "fire", aoe: true }, procRateBase: 1, procRatePerEn: 1, d: "帕格里奧之怒，劍身灼燒著永不熄滅的怒火。" },
        "wpn_mapler_punish": { n: "馬普勒的懲罰", type: "wpn", w2h: true, dmgS: 14, dmgL: 15, hit: 0, dmgBonus: 11, spd: 1, req: "royal,knight,elf,warrior", safe: 6, p: 46000, legend: true, gachaWeight: 1, eff: "crush", ignHardSkin: true, spellProc: { skn: "震裂術", dice: [6, 11], ele: "earth", aoe: true }, procRateBase: 1, procRatePerEn: 1, d: "馬普勒降下的懲戒之鎚，每一擊都撼動大地。" },
        "wpn_osis_hammer":   { n: "歐西斯衝撞錘", type: "wpn", dmgS: 8, dmgL: 9, hit: 3, dmgBonus: 0, spd: 0.9, req: "royal,knight,warrior", safe: 6, p: 66000, legend: true, gachaWeight: 1, ignHardSkin: true, spellProc: { skn: "流星雨", dice: [10, 11], ele: "fire", aoe: true }, procRateBase: 1, procRatePerEn: 1, d: "歐西斯鍛造的衝撞之錘，揮動之間天降流火。" },
        "wpn_eva_scold":     { n: "伊娃的責罵", type: "wpn", dmgS: 9, dmgL: 9, hit: 1, dmgBonus: 1, spd: 0.8, req: "royal,knight,elf,mage,dark,dragon,illusion", safe: 6, p: 56400, legend: true, gachaWeight: 1, ignHardSkin: true, spellProc: { skn: "水之矛", dice: [5, 5], flat: 5, ele: "water", status: { kind: "freeze", pct: 5, dur: 4 } }, procRateBase: 1, procRatePerEn: 1, d: "伊娃的責罵，劍鋒凝著沁骨的寒泉。" },
        // ===== 軍王之室：掉落裝備 =====
        "wpn_assassin_mark": { n: "暗殺軍王之痕", type: "wpn", w2h: true, dmgS: 13, dmgL: 13, hit: 0, dmgBonus: 2, spd: 0.7, req: "dark", safe: 6, p: 25000, eff: "combo", gachaWeight: 10 },   // 雙刀・連擊
        "wpn_priest_wand":   { n: "神官魔杖", type: "wpn", w2h: true, dmgS: 9, dmgL: 9, hit: 0, spd: 1.0, req: "mage", safe: 6, p: 13340, unBonus: true, eff: "magicburst", gachaWeight: 10, d: "神官祈禱經年的法杖，能將信仰化為爆裂的魔力。" },
        "wpn_laia_wand":     { n: "蕾雅魔杖", type: "wpn", dmgS: 1, dmgL: 1, hit: -3, dmgBonus: 0, mdmg: -2, spd: 1.0, req: "mage", safe: 6, p: 23340, legend: true, gachaWeight: 1, meleeHitSpell: { skn: "冰裂術", dice: [6, 10], ele: "water", freezePbase: 200, shatter: 100 }, d: "冰之女王蕾雅愛用的魔杖，杖尖凝結著永不消融的寒霜。" },
        "shd_priest_book":   { n: "神官魔法書", type: "arm", slot: "shield", ac: 3, mmp: 50, mpR: 3, req: "mage", safe: 6, p: 93000, gachaWeight: 5 },
        "amr_laia_robe":     { n: "蕾雅長袍", type: "arm", slot: "armor", ac: 2, mmp: 100, req: "mage", safe: 4, p: 58000, gachaWeight: 1 },
        "acc_necro_king_ring": { n: "冥法軍王之戒", legend: true, type: "acc", slot: "amulet", ac: 0, cha: 3, req: "mage,elf", safe: 0, p: 193000, gachaWeight: 1 },
        "acc_laia_amulet":   { n: "蕾雅項鍊", legend: true, type: "acc", slot: "amulet", ac: 0, con: -2, int: 1, wis: 1, req: "mage", safe: 0, p: 100000, gachaWeight: 1 },
        "acc_darkmage_amulet": { n: "黑法師項鍊", type: "acc", slot: "amulet", ac: 0, con: -1, int: 2, req: "mage", safe: 0, p: 100000, gachaWeight: 1 },
        "acc_summoner_amulet": { n: "喚獸師項鍊", type: "acc", slot: "amulet", ac: 0, wis: -1, cha: 2, req: "mage", safe: 0, p: 100000, gachaWeight: 1 },
        "acc_law_king_chain": { n: "法令軍王之鍊", legend: true, type: "acc", slot: "amulet", ac: 0, mmp: 15, mpR: 5, req: "mage,elf", safe: 0, p: 100000, gachaWeight: 1 },
        "acc_laia_ring":     { n: "蕾雅戒指", legend: true, type: "acc", slot: "ring", ac: 5, req: "all", safe: 0, p: 250000, gachaWeight: 1, stunResist: 5, d: "冰之女王蕾雅指間的戒指，冷冽之氣令神智不致動搖。" },
        "acc_orin_amulet": { n: "歐林的項鍊", legend: true, type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 1, set: "orin", d: "歐林珍藏的項鍊，與西瑪戒指本是一對，分離已久。" },
        "acc_sima_ring":   { n: "西瑪戒指", legend: true, type: "acc", slot: "ring", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 1, set: "orin", d: "刻著西瑪之名的古老戒指，與歐林的項鍊遙相呼應。" },
        "hlm_icequeen_charm": { n: "冰之女王魅力頭飾", legend: true, type: "arm", slot: "helm",  ac: 3, req: "royal", reqAvatar: "公主", safe: 4, p: 126000, gachaWeight: 1, set: "icequeen_charm", d: "冰之女王魅力套裝之一（公主限定），頭飾上的冰晶折射出懾人的高貴。" },
        "amr_icequeen_charm": { n: "冰之女王魅力禮服", legend: true, type: "arm", slot: "armor", ac: 7, req: "royal", reqAvatar: "公主", safe: 4, p: 186000, gachaWeight: 1, set: "icequeen_charm", d: "冰之女王魅力套裝之一（公主限定），禮服如初雪般華美而凜然。" },
        "bot_icequeen_charm": { n: "冰之女王魅力涼鞋", legend: true, type: "arm", slot: "boots", ac: 3, req: "royal", reqAvatar: "公主", safe: 4, p: 115000, gachaWeight: 1, set: "icequeen_charm", d: "冰之女王魅力套裝之一（公主限定），踏之如行於薄冰，步步生寒。" },
        "hlm_frost": { n: "寒冰頭盔", legend: true, type: "arm", slot: "helm",  ac: 4, req: "royal,dragon", safe: 4, p: 136000, gachaWeight: 0, set: "frost", d: "寒冰套裝之一，頭盔覆著萬年不化的堅冰。" },
        "amr_frost": { n: "寒冰盔甲", legend: true, type: "arm", slot: "armor", ac: 5, req: "royal,dragon", safe: 4, p: 196000, gachaWeight: 0, set: "frost", d: "寒冰套裝之一，盔甲沁出徹骨寒氣，護身如冰封壁壘。" },
        "bot_frost": { n: "寒冰長靴", legend: true, type: "arm", slot: "boots", ac: 4, req: "royal,dragon", safe: 4, p: 125000, gachaWeight: 0, set: "frost", d: "千年寒霜凝鑄的長靴，踏處留下不化的冰痕。寒冰套裝之一。" },
        "wpn_icequeen_wand": { n: "冰之女王魔杖", type: "wpn", dmgS: 3, dmgL: 4, hit: 5, dmgBonus: 1, spd: 1.0, req: "mage", safe: 6, p: 143340, legend: true, gachaWeight: 1, procSkill: "sk_ice_spike", procRateBase: 8, procRatePerEn: 2, d: "冰之女王御用的魔杖，杖尖凝著永不消融的霜華。" },
        "wpn_demon_scythe":  { n: "惡魔鐮刀", type: "wpn", dmgS: 1, dmgL: 1, hit: 0, dmgBonus: 0, mdmg: 5, spd: 1.0, req: "mage", safe: 6, p: 173340, legend: true, gachaWeight: 1, isWand: true },   // 🔮 單手魔杖（共鳴·見 WAND_LIGHTARROW_IDS）；isWand→魔劍精通排除、不轉奇古獸
        "wpn_angel_wand":    { n: "天使魔杖", type: "wpn", dmgS: 12, dmgL: 12, hit: 0, dmgBonus: 0, req: "mage,illusion", safe: 6, p: 36000, unBonus: true, int: 1, mpR: 4, procSkill: "sk_undead_bane", procRateBase: 1, procRatePerEn: 1, gachaWeight: 20, d: "天使羽翼化成的單手魔杖，杖端流轉著淨化亡者的聖光。" },   // 😇 v3.7.74 單手魔杖（共鳴·見 WAND_LIGHTARROW_IDS）；起死回生術 1%＋每強化+1%（成敗仍走 tryInstakill＝施放者魔法命中 vs 目標魔抗·僅對不死·頭目免疫）
        // ===== 冥法軍訓練場：掉落武器 =====
        "wpn_blood_2hsword":   { n: "血色巨劍", type: "wpn", w2h: true, dmgS: 13, dmgL: 15, hit: 0, dmgBonus: 0, spd: 1, req: "knight",      safe: 6, p: 11140, eff: "cleave", gachaWeight: 30 },   // 切割（雙手劍）
        "wpn_dark_sword":      { n: "黑暗之劍", type: "wpn",            dmgS: 15, dmgL: 12, hit: 0, dmgBonus: 1, spd: 0.7, req: "knight,dark", safe: 6, p: 12000, gachaWeight: 10 },   // 反擊（單手劍 tag 自動）
        "wpn_red_crystalwand": { n: "紅水晶魔杖", type: "wpn", w2h: true, dmgS: 8, dmgL: 8, hit: 0, spd: 1.0, req: "mage", safe: 6, p: 13340, mpR: 5, int: 1, wis: 1, gachaWeight: 10 },   // 共鳴（WAND_LIGHTARROW_IDS）
        // ===== 黑暗妖精武器：雙刀（雙手，連擊） =====
        "wpn_dual_bronze":   { n: "青銅雙刀", type: "wpn", w2h: true, dmgS: 8,  dmgL: 6,  hit: 3, spd: 0.8, req: "dark", safe: 6, p: 960,   eff: "combo", gachaWeight: 100 },
        "wpn_dual_steel":    { n: "鋼鐵雙刀", type: "wpn", w2h: true, dmgS: 10, dmgL: 7,  hit: 1, spd: 0.8, req: "dark", safe: 6, p: 1800,  eff: "combo", gachaWeight: 100 },
        "wpn_dual_silver":   { n: "銀光雙刀", type: "wpn", w2h: true, dmgS: 11, dmgL: 8,  hit: 3, spd: 0.8, req: "dark", safe: 6, p: 3800,  eff: "combo", unBonus: true, gachaWeight: 50 },
        "wpn_dual_gloom":    { n: "幽暗雙刀", type: "wpn", w2h: true, dmgS: 15, dmgL: 10, hit: 3, dmgBonus: 1, spd: 0.8, req: "dark", safe: 6, p: 8800,  eff: "combo", gachaWeight: 30 },
        "wpn_dual_dark":     { n: "黑暗雙刀", type: "wpn", w2h: true, dmgS: 12, dmgL: 8,  hit: 3, spd: 0.8, req: "dark", safe: 6, p: 8800,  eff: "combo", gachaWeight: 50 },
        "wpn_dual_shadow":   { n: "暗影雙刀", type: "wpn", w2h: true, dmgS: 11, dmgL: 7,  hit: 1, spd: 0.8, req: "dark", safe: 6, p: 3600,  eff: "combo", gachaWeight: 100 },
        "wpn_dual_damascus": { n: "大馬士革雙刀", type: "wpn", w2h: true, dmgS: 15, dmgL: 9, hit: 1, spd: 0.8, req: "dark", safe: 6, p: 39600, eff: "combo", hardWear: 1, gachaWeight: 50 },
        "wpn_dual_abyss":    { n: "暗黑雙刀", type: "wpn", w2h: true, dmgS: 18, dmgL: 14, hit: 4, dmgBonus: 3, spd: 0.8, req: "dark", safe: 6, p: 80000, eff: "combo", gachaWeight: 5 },
        // ===== 🏛️ 底比斯·歐西里斯武器（攻擊時 4% 發動「惡魔之吻」：3D20 地屬性魔法傷害，受魔法傷害公式影響；玩家＋傭兵皆觸發） =====
        "wpn_thebes_bow":     { n: "底比斯歐西里斯弓", legend: true, type: "wpn", isBow: true, ranged: true, rapidfire: 80, dmgS: 3, dmgL: 3, hit: 0, dmgBonus: 1, int: 2, wis: 1, spd: 0.9, req: "elf,illusion", safe: 6, p: 235000, gachaWeight: 1, procSkill: "sk_demon_kiss", procRateBase: 4, procRatePerEn: 0, d: "底比斯亡靈守護者持用的長弓，弓弦低語著歐西里斯的審判。" },
        "wpn_thebes_dual":    { n: "底比斯歐西里斯雙刀", legend: true, type: "wpn", w2h: true, dmgS: 16, dmgL: 11, hit: 0, dmgBonus: 1, dex: 2, wis: 1, spd: 0.7, req: "dark", safe: 6, p: 215000, eff: "combo", comboRate: 30, gachaWeight: 1, procSkill: "sk_demon_kiss", procRateBase: 4, procRatePerEn: 0, d: "自底比斯神殿出土的雙刃，刀身刻滿守墓的咒文。雙擊。" },
        "wpn_thebes_2hsword": { n: "底比斯歐西里斯雙手劍", legend: true, type: "wpn", w2h: true, dmgS: 21, dmgL: 26, hit: 5, dmgBonus: 0, str: 1, con: 2, spd: 0.9, req: "knight,dragon", safe: 6, p: 255000, eff: "cleave", gachaWeight: 1, procSkill: "sk_demon_kiss", procRateBase: 4, procRatePerEn: 0, d: "沉睡於歐西里斯祭壇的巨劍，承載著冥府之主的威壓。切割。" },
        "wpn_thebes_wand":    { n: "底比斯歐西里斯魔杖", legend: true, type: "wpn", w2h: true, dmgS: 20, dmgL: 18, hit: 2, dmgBonus: 3, str: 2, mdmg: 2, mpR: 7, spd: 0.9, req: "mage,illusion", safe: 6, p: 185000, eff: "magicstrike", gachaWeight: 1, procSkill: "sk_demon_kiss", procRateBase: 4, procRatePerEn: 0, d: "底比斯祭司執掌的魔杖，引動黃沙與亡魂之力。魔擊。" },
        "blt_thebes_osiris":  { n: "底比斯歐西里斯腰帶", type: "acc", slot: "belt", ac: 0, mmp: 10, mpR: 2, weightCap: 250, req: "all", safe: 0, p: 326000, gachaWeight: 1, d: "以歐西里斯之名祝聖的腰帶，繫上者得享冥界的豐沃。" },
        "acc_thebes_horus":   { n: "底比斯賀洛斯戒指", legend: true, type: "acc", slot: "ring", ac: 0, int: 1, mpR: 1, mdmg: 2, req: "all", safe: 0, p: 600000, gachaWeight: 1, d: "鑲著鷹神賀洛斯之眼的戒指，洞悉魔力的流轉。" },
        "acc_thebes_anubis":  { n: "底比斯阿努比斯戒指", legend: true, type: "acc", slot: "ring", ac: 0, str: 1, mhp: 15, stunResist: 25, req: "all", safe: 0, p: 600000, gachaWeight: 1, d: "鐫刻胡狼神阿努比斯印記的戒指，守護佩戴者免於昏厥。" },
        // ===== 黑暗妖精武器：十字弓（雙手，遠程，連射） =====
        "wpn_xbow_dark":  { n: "黑暗十字弓", type: "wpn", isBow: true, ranged: true, rapidfire: 35, w2h: true, dmgS: 2, dmgL: 2, hit: 4, dmgBonus: 0, spd: 1.0, req: "elf,dark", safe: 6, p: 17300, gachaWeight: 70 },
        "wpn_xbow_gloom": { n: "幽暗十字弓", type: "wpn", isBow: true, ranged: true, rapidfire: 70, w2h: true, dmgS: 3, dmgL: 2, hit: 5, dmgBonus: 2, spd: 1.0, req: "elf,dark", safe: 6, p: 33300, gachaWeight: 50 },
        "wpn_xbow_abyss": { n: "暗黑十字弓", type: "wpn", isBow: true, ranged: true, rapidfire: 70, w2h: true, dmgS: 5, dmgL: 5, hit: 4, dmgBonus: 6, spd: 1.0, req: "elf,dark", safe: 6, p: 180000, gachaWeight: 1, ignHardSkin: true, d: "以深淵暗黑之力凝成的十字弓，箭矢能穿透一切血肉與甲冑。" },
        // ===== 魔力短劍（匕首，全職業） =====
        "wpn_manadagger": { n: "魔力短劍", type: "wpn", dmgS: 6, dmgL: 4, hit: 0, dmgBonus: 1, spd: 0.6, req: "all", safe: 6, p: 191000, eff: "mp_drain", unBonus: true, str: 1, mpR: 1, legend: true, gachaWeight: 1, d: "刃中封藏著流動魔力的短劍，飲血之餘亦能回吐法力。" },   // 🔧 傳說武器：琥珀金名稱＋專屬藍色圖示光芒
        // ===== 拉斯塔巴德地下洞穴：掉落武器 =====
        "wpn_xbow_rasta":   { n: "拉斯塔巴德十字弓", type: "wpn", isBow: true, ranged: true, rapidfire: 45, w2h: true, dmgS: 3, dmgL: 3, hit: 2, dmgBonus: 2, spd: 0.9, req: "elf,dark", safe: 6, p: 2300, gachaWeight: 80 },
        "wpn_bow_rasta":    { n: "拉斯塔巴德弓", type: "wpn", isBow: true, ranged: true, rapidfire: 55, w2h: true, dmgS: 2, dmgL: 2, hit: 2, dmgBonus: 2, spd: 0.9, req: "knight,elf", safe: 6, p: 1800, gachaWeight: 80 },
        "wpn_small_katana": { n: "小武士刀", type: "wpn", dmgS: 8, dmgL: 8, hit: 1, spd: 0.7, req: "all", safe: 6, p: 11000, gachaWeight: 30 },
        "wpn_sword_rasta":  { n: "拉斯塔巴德長劍", type: "wpn", dmgS: 10, dmgL: 12, hit: 1, spd: 0.9, req: "knight,elf,dark", safe: 6, p: 990, gachaWeight: 50 },
        "wpn_dagger_rasta": { n: "拉斯塔巴德短劍", type: "wpn", dmgS: 4, dmgL: 3, hit: 2, spd: 0.6, req: "all", safe: 6, p: 1000, gachaWeight: 80 },
        "wpn_wand_rasta":   { n: "拉斯塔巴德魔杖", type: "wpn", dmgS: 2, dmgL: 3, hit: 0, mdmg: 1, spd: 1.0, req: "mage", safe: 6, p: 10000, gachaWeight: 80 },
        "wpn_darkmage_wand": { n: "黑法師之杖", type: "wpn", dmgS: 1, dmgL: 1, hit: 0, dmgBonus: 0, mdmg: 2, mpR: 5, spd: 1.0, req: "mage", safe: 6, p: 94510, gachaWeight: 5 },   // 共鳴（見 WAND_LIGHTARROW_IDS）
        "wpn_dual_rasta":   { n: "拉斯塔巴德雙刀", type: "wpn", w2h: true, dmgS: 15, dmgL: 10, hit: 0, spd: 0.8, req: "dark", safe: 6, p: 10000, eff: "combo", gachaWeight: 50 },
        "wpn_xbow_heavy_rasta": { n: "拉斯塔巴德重十字弓", type: "wpn", isBow: true, ranged: true, rapidfire: 45, w2h: true, dmgS: 3, dmgL: 3, hit: 2, dmgBonus: 3, spd: 0.9, req: "elf", safe: 6, p: 5300, gachaWeight: 80 },
        "wpn_spear_rasta":  { n: "拉斯塔巴德矛", type: "wpn", dmgS: 8, dmgL: 8, hit: 0, spd: 0.9, req: "knight,elf", safe: 6, p: 1800, gachaWeight: 100 },
        // ===== 🏛️ 格蘭肯神殿．長老之室 新物品（掉落用武器/防具/特殊道具/製作材料；5 把傳說製作武器另於製作階段新增） =====
        "wpn_dual_spike":     { n: "尖刺雙刀", type: "wpn", w2h: true, dmgS: 8, dmgL: 8, hit: 0, dmgBonus: 3, spd: 0.8, req: "dark", safe: 6, p: 2000, gachaWeight: 100, eff: "combo", comboRate: 25, ignHardSkin: true, d: "佈滿尖刺的雙刀，連環撕咬穿透敵人的防護。" },
        "wpn_official_blade": { n: "武官之刃", type: "wpn", dmgS: 13, dmgL: 10, hit: 1, dmgBonus: 2, spd: 0.9, req: "knight,elf,royal,dragon", safe: 6, p: 58000, gachaWeight: 10, d: "拉斯塔巴德武官佩帶的單手劍，以靜制動、伺機反擊。" },
        "arm_official_cloak": { n: "武官斗篷", type: "arm", slot: "cloak", ac: 2, mhp: 20, hpR: 3, req: "knight,dark,royal,dragon", safe: 4, p: 13000, gachaWeight: 20, d: "拉斯塔巴德武官的斗篷，內襯堅韌、護住要害。" },
        "glv_dark": { n: "黑暗手套", type: "arm", slot: "gloves", ac: 1, rangedHit: 2, req: "dark", safe: 4, p: 4000, gachaWeight: 90, d: "黑暗妖精的手套，握持間更顯穩準。" },
        "item_dk_insignia":   { n: "死亡騎士之印記", type: "etc", p: 50000, maxHold: 1, noUse: true, gachaWeight: 0, c: "text-red-400", d: "死亡騎士的印記（唯一）。持有時於拉斯塔巴德區域擊敗怪物，有機率獲得聖地遺物。可賣出。" },
        "mat_holy_relic":     { n: "聖地遺物", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-yellow-200", d: "格蘭肯神殿的聖地遺物。製作材料。" },
        "mat_black_blood":    { n: "黑色血痕", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-red-300", d: "凝結不散的黑色血痕。製作材料。" },
        "mat_black_powder":   { n: "黑魔法粉", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-purple-300", d: "蘊含黑魔法之力的粉末。製作材料。" },
        "mat_history_1": { n: "封印的歷史書第1頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        "mat_history_2": { n: "封印的歷史書第2頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        "mat_history_3": { n: "封印的歷史書第3頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        "mat_history_4": { n: "封印的歷史書第4頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        "mat_history_5": { n: "封印的歷史書第5頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        "mat_history_6": { n: "封印的歷史書第6頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        "mat_history_7": { n: "封印的歷史書第7頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        "mat_history_8": { n: "封印的歷史書第8頁", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-200", d: "封印的歷史書殘頁。集齊 8 頁可製作『拉斯塔巴德製作武器秘笈』。" },
        // ===== 🏛️ 長老之室 5 傳說製作武器（可羅蘭斯製作·潘朵拉0·安定0·無法在商店/抽獎取得） =====
        "wpn_emperor_blade":   { n: "真．冥皇執行劍", type: "wpn", w2h: true, legend: true, dmgS: 28, dmgL: 33, hit: 5, dmgBonus: 20, spd: 1, req: "knight,dragon", safe: 0, p: 500000, gachaWeight: 0, eff: "cleave", ignHardSkin: true, str: 2, dex: 1, stunHitBonus: 20, d: "冥皇執行劍的真實之姿，劍勢凝著鎮魂的威壓。" },
        "wpn_windblade_dagger":{ n: "風刃短劍", type: "wpn", legend: true, dmgS: 23, dmgL: 16, hit: 10, dmgBonus: 10, spd: 0.6, req: "knight,elf,mage,royal,dark", safe: 0, p: 500000, gachaWeight: 0, ignHardSkin: true, mhp: 100, dex: 2, vampPct: 0.1, d: "風之精靈寄宿的短劍，揮斬之間清風奪命。" },
        "wpn_redshadow_dual":  { n: "紅影雙刀", type: "wpn", w2h: true, legend: true, dmgS: 27, dmgL: 18, hit: 10, dmgBonus: 18, spd: 0.8, req: "dark", safe: 0, p: 500000, gachaWeight: 0, eff: "combo", comboRate: 35, ignHardSkin: true, dex: 2, wis: 2, procStatusSkill: { skId: "sk_slow", rate: 10 }, d: "殷紅殘影交織的雙刀，刃過之處敵人遲滯難動。" },
        "wpn_beastking_claw":  { n: "獸王鋼爪", type: "wpn", w2h: true, legend: true, dmgS: 25, dmgL: 20, hit: 15, dmgBonus: 10, spd: 0.9, req: "dark", safe: 0, p: 500000, gachaWeight: 0, eff: "combo", comboRate: 33, ignHardSkin: true, str: 2, dex: 2, d: "獸王之力灌注的鋼爪，撕咬如百獸之王臨陣。" },
        "wpn_rond_dual":       { n: "倫得雙刀", type: "wpn", w2h: true, dmgS: 18, dmgL: 8, hit: 7, dmgBonus: 2, spd: 0.8, req: "dark", safe: 6, p: 56000, gachaWeight: 5, eff: "combo", comboRate: 33, ignHardSkin: true, procSkill: "sk_revenge_spike", procRateBase: 5, procRatePerEn: 1, d: "倫得一族代代相傳的雙刃，刃身封著大地的怨念，斬擊時激起復仇的尖石。" },   // 🗡️ 雙擊33/貫穿/復仇尖石 5%＋每強化+1%（+20→25%·WEAPON_TAGS 雙刀 於 js/10·重量與掉落於 js/01）
        "wpn_holycrystal_wand":{ n: "聖晶魔杖", type: "wpn", w2h: true, legend: true, dmgS: 13, dmgL: 15, hit: 8, dmgBonus: 0, spd: 1.0, req: "mage,illusion", safe: 0, p: 500000, gachaWeight: 0, eff: "magicburst", ignHardSkin: true, int: 2, mdmg: 8, mmp: 50, procSkill: "sk_holy_lightning", procRateBase: 10, procRatePerEn: 1, d: "聖潔水晶鑲嵌的魔杖，杖端雷光蓄勢待發。" },
        "mat_rasta_codex":     { n: "拉斯塔巴德製作武器秘笈", type: "etc", p: 100, noUse: true, gachaWeight: 0, c: "text-amber-300", d: "集封印的歷史書八頁殘篇而成的武器鍛造秘笈。可羅蘭斯製作五件傳說武器的核心材料。" },
        "hlm_elf": { n: "精靈皮盔", type: "arm", slot: "helm", ac: 1, req: "elf,mage", safe: 6, p: 120, gachaWeight: 100 },
        "hlm_oasis": { n: "歐西斯頭盔", type: "arm", slot: "helm", ac: 1, req: "all", safe: 4, p: 10, gachaWeight: 100 },
        "hlm_gnome": { n: "侏儒鐵盔", type: "arm", slot: "helm", ac: 2, req: "all", safe: 4, p: 30, gachaWeight: 100 },
        "arm_42": { n: "頭盔", type: "arm", slot: "helm", ac: 1, req: "all", safe: 4, p: 60, gachaWeight: 100 },
        "arm_43": { n: "騎士面甲", type: "arm", slot: "helm", ac: 3, req: "knight", safe: 4, p: 5500, gachaWeight: 70 },
        "hlm_mr": { n: "抗魔法頭盔", type: "arm", slot: "helm", ac: 2, mr: 4, mrPerEn: 1, req: "all", safe: 4, p: 4200, gachaWeight: 80 },
        "arm_44": { n: "艾爾穆的祝福", type: "arm", slot: "helm", ac: 2, req: "elf", safe: 6, p: 8900, dex: 1, gachaWeight: 10 },
        "arm_45": { n: "治癒魔法頭盔", type: "arm", slot: "helm", ac: 1, req: "knight", safe: 4, p: 21000, grantSkills: ["sk_helm_heal1", "sk_helm_heal2"], gachaWeight: 10 },
        "arm_46": { n: "敏捷魔法頭盔", type: "arm", slot: "helm", ac: 1, req: "knight", safe: 4, p: 30800, grantSkills: ["sk_helm_dex1", "sk_helm_dex2"], gachaWeight: 10 },
        "arm_47": { n: "力量魔法頭盔", type: "arm", slot: "helm", ac: 1, req: "knight", safe: 4, p: 25200, grantSkills: ["sk_helm_str1", "sk_helm_str2", "sk_helm_str3"], gachaWeight: 10 },
        "arm_48": { n: "皮帽子", type: "arm", slot: "helm", ac: 0, req: "all", safe: 4, p: 20, gachaWeight: 100 },
        "hlm_silver": { n: "銀釘皮帽", type: "arm", slot: "helm", ac: 2, req: "all", safe: 4, p: 320, gachaWeight: 100 },
        "arm_49": { n: "皮頭盔", type: "arm", slot: "helm", ac: 1, req: "all", safe: 4, p: 60, gachaWeight: 100 },
        "hlm_bone": { n: "骷髏頭盔", type: "arm", slot: "helm", ac: 3, req: "all", safe: 0, p: 100, gachaWeight: 100 },
        "hlm_steel": { n: "鋼鐵頭盔", type: "arm", slot: "helm", ac: 3, req: "knight", safe: 4, p: 18250, gachaWeight: 20 },
        "hlm_mage": { n: "法師之帽", type: "arm", slot: "helm", ac: 2, req: "mage", safe: 4, p: 4250, gachaWeight: 50 },
        "hlm_dk": { n: "死亡騎士頭盔", legend: true, type: "arm", slot: "helm", ac: 3, req: "knight", safe: 4, p: 36000, gachaWeight: 1, d: "死亡騎士頭盔，殘存的怨念在頭盔深處幽幽燃燒。死亡騎士套裝之一。" },
        "arm_50": { n: "精靈敏捷頭盔", type: "arm", slot: "helm", ac: 1, req: "elf", safe: 6, p: 4800, dex: 1, gachaWeight: 20 },
        "arm_51": { n: "精靈體質頭盔", type: "arm", slot: "helm", ac: 1, req: "elf", safe: 6, p: 4800, con: 1, gachaWeight: 20 },
        "arm_53": { n: "紅騎士頭巾", type: "arm", slot: "helm", ac: 2, req: "knight", safe: 6, p: 6500, gachaWeight: 20 },
        "arm_54": { n: "巴土瑟之帽", legend: true, type: "arm", slot: "helm", ac: 2, req: "mage", safe: 4, p: 23500, mpR: 5, gachaWeight: 1 },
        "arm_55": { n: "卡士柏之帽", legend: true, type: "arm", slot: "helm", ac: 2, req: "mage", safe: 4, p: 23500, mmp: 25, gachaWeight: 1 },
        "arm_56": { n: "馬庫爾之帽", legend: true, type: "arm", slot: "helm", ac: 2, req: "mage", safe: 4, p: 23500, int: 1, gachaWeight: 1 },
        "arm_57": { n: "西瑪之帽", legend: true, type: "arm", slot: "helm", ac: 2, req: "mage", safe: 4, p: 23500, mmp: 15, mpR: 2, gachaWeight: 1 },
        "hlm_kurt": { n: "克特頭盔", legend: true, type: "arm", slot: "helm", ac: 3, req: "knight", safe: 4, p: 32000, gachaWeight: 1, d: "曾屬於墮落者克特的頭盔，盔影下不見生人氣息。克特套裝之一。" },
        "amr_plate": { n: "金屬盔甲", type: "arm", slot: "armor", ac: 7, req: "knight", safe: 4, p: 51800, gachaWeight: 30 },
        "arm_59": { n: "水晶盔甲", type: "arm", slot: "armor", ac: 8, req: "knight", safe: 4, p: 48000, gachaWeight: 20 },   // 🔧 由 惡魔(10%)／密密(0.1%)／黑暗復仇者(0.1%) 掉落；潘朵拉權重 20（進黑市/血盟野外抽獎池）
        "arm_60": { n: "青銅盔甲", type: "arm", slot: "armor", ac: 6, req: "knight", safe: 4, p: 22400, gachaWeight: 50 },
        "arm_61": { n: "藤甲", type: "arm", slot: "armor", ac: 6, req: "knight", safe: 4, p: 28000, gachaWeight: 50 },
        "arm_62": { n: "皮甲", type: "arm", slot: "armor", ac: 6, req: "knight", safe: 4, p: 32300, gachaWeight: 50 },
        "arm_63": { n: "鏈甲", type: "arm", slot: "armor", ac: 5, req: "knight,elf", safe: 4, p: 1980, gachaWeight: 100 },
        "arm_64": { n: "歐西斯鏈甲", type: "arm", slot: "armor", ac: 4, req: "knight,elf", safe: 4, p: 264, gachaWeight: 100 },
        "arm_65": { n: "鱗甲", type: "arm", slot: "armor", ac: 4, req: "knight,elf", safe: 4, p: 2800, gachaWeight: 100 },
        "arm_66": { n: "銀釘皮甲", type: "arm", slot: "armor", ac: 3, req: "all", safe: 4, p: 420, gachaWeight: 100 },
        "arm_67": { n: "環甲", type: "arm", slot: "armor", ac: 3, req: "all", safe: 4, p: 700, gachaWeight: 100 },
        "amr_oasis": { n: "歐西斯環甲", type: "arm", slot: "armor", ac: 2, req: "all", safe: 4, p: 66, gachaWeight: 100 },
        "arm_68": { n: "小藤甲", type: "arm", slot: "armor", ac: 2, req: "all", safe: 4, p: 140, gachaWeight: 100 },
        "amr_jacket": { n: "皮夾克", type: "arm", slot: "armor", ac: 1, req: "all", safe: 4, p: 1, gachaWeight: 100 },
        "arm_69": { n: "抗魔法鏈甲", type: "arm", slot: "armor", ac: 5, mr: 4, mrPerEn: 1, req: "knight,elf", safe: 4, p: 11200, gachaWeight: 50 },
        "amr_robe": { n: "綿質長袍", type: "arm", slot: "armor", ac: 2, mr: 4, req: "all", safe: 4, p: 1400, gachaWeight: 100 },
        "arm_70": { n: "木甲", type: "arm", slot: "armor", ac: 3, req: "all", safe: 4, p: 240, gachaWeight: 100 },
        "arm_71": { n: "精靈護胸金屬板", type: "arm", slot: "armor", ac: 4, req: "knight,elf", safe: 6, p: 2240, gachaWeight: 50 },
        "arm_72": { n: "精靈金屬盔甲", type: "arm", slot: "armor", ac: 6, req: "knight,elf", safe: 6, p: 57200, gachaWeight: 10 },
        "arm_73": { n: "精靈鏈甲", type: "arm", slot: "armor", ac: 5, req: "knight,elf", safe: 6, p: 2880, gachaWeight: 50 },
        "arm_74": { n: "木製的夾克", type: "arm", slot: "armor", ac: 1, req: "all", safe: 4, p: 1, gachaWeight: 100 },
        "arm_75": { n: "皮背心", type: "arm", slot: "armor", ac: 1, req: "all", safe: 4, p: 10, gachaWeight: 100 },
        "arm_76": { n: "皮盔甲", type: "arm", slot: "armor", ac: 3, req: "all", safe: 4, p: 210, gachaWeight: 100 },
        "arm_77": { n: "銀釘皮背心", type: "arm", slot: "armor", ac: 2, req: "all", safe: 4, p: 280, gachaWeight: 100 },
        "arm_78": { n: "硬皮背心", type: "arm", slot: "armor", ac: 3, req: "all", safe: 4, p: 240, gachaWeight: 100 },
        "amr_bone": { n: "骷髏盔甲", type: "arm", slot: "armor", ac: 5, req: "all", safe: 0, p: 100, gachaWeight: 100 },
        "arm_79": { n: "鋼鐵金屬盔甲", type: "arm", slot: "armor", ac: 7, req: "knight", safe: 4, p: 59800, gachaWeight: 20 },
        "amr_magerobe": { n: "法師長袍", type: "arm", slot: "armor", ac: 3, req: "mage", safe: 4, p: 2800, gachaWeight: 50 },
        "arm_80": { n: "水龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 9, resWater: 20, req: "all", safe: 4, p: 336000, gachaWeight: 1 },
        "arm_81": { n: "地龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 9, resEarth: 20, req: "all", safe: 4, p: 336000, gachaWeight: 1 },
        "arm_82": { n: "火龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 9, resFire: 20, req: "all", safe: 4, p: 336000, gachaWeight: 1 },
        "arm_83": { n: "風龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 9, resWind: 20, req: "all", safe: 4, p: 336000, gachaWeight: 1 },
        "amr_dk": { n: "死亡騎士盔甲", legend: true, type: "arm", slot: "armor", ac: 7, req: "knight", safe: 4, p: 128000, gachaWeight: 1, d: "死亡騎士的胸甲，甲面浮現著不滅的死亡紋章。死亡騎士套裝之一。" },
        "arm_84": { n: "黑長者長袍", legend: true, type: "arm", slot: "armor", ac: 5, req: "mage", safe: 4, p: 124000, mmp: 50, mpR: 5, gachaWeight: 1 },
        "amr_kurt": { n: "克特盔甲", legend: true, type: "arm", slot: "armor", ac: 7, req: "knight", safe: 4, p: 126000, gachaWeight: 1, d: "克特生前征戰所披的盔甲，鎧縫間仍滲著陳年的血鏽。克特套裝之一。" },
        "tsh_tshirt": { n: "T恤", type: "arm", slot: "tshirt", ac: 0, req: "all", safe: 4, p: 8500, gachaWeight: 50 },
        "arm_85": { n: "精靈T恤", type: "arm", slot: "tshirt", ac: 0, req: "elf", safe: 6, p: 6600, gachaWeight: 20 },
        // ===== 🏺 遺物（relic:true）：單一怪物專屬掉落·名稱/圖示海藍色·無法強化(noEnhance)/不會祝福/無法賦予屬性·永不進潘朵拉黑市(gachaWeight:0)·獨立遺物圖鑑(分類同裝備圖鑑) =====
        "relic_orc_lid":           { n: "妖魔的鍋蓋",         type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 4, dr: 3, cha: -2, block: 30, req: "royal,knight,elf,mage,dark,dragon,illusion", p: 10000, gachaWeight: 0, d: "【遺物】妖魔隨手抓來擋刀的鍋蓋，凹痕累累卻意外耐打。" },
        "relic_goblin_blade":      { n: "哥布林的石刃",       type: "wpn", relic: true, noEnhance: true, dmgS: 4, dmgL: 6, hit: 4, dmgBonus: 3, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】哥布林用石片磨成的粗劣短刃，鋒利得不像廢料。" },
        "relic_orcarcher_bow":     { n: "妖魔弓箭手的彈簧弓", type: "wpn", isBow: true, ranged: true, relic: true, noEnhance: true, ignHardSkin: true, rapidfire: 50, dmgS: 2, dmgL: 2, hit: 4, dmgBonus: 3, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】妖魔弓箭手臨時綁製的彈簧弓，射出的箭竟能穿透硬甲。" },
        "relic_gremlin_club":      { n: "地靈的木棍",         type: "wpn", relic: true, noEnhance: true, dmgS: 6, dmgL: 3, hit: 2, dmgBonus: 2, procStatusSkill: { skId: "sk_relic_stun", rate: 1 }, req: "royal,knight,elf,mage,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】地靈揮舞的粗木棍，敲中要害會令人眼冒金星。" },
        "relic_mushroom_cap":      { n: "菌菇傘帽",           type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 5, mr: 5, req: "elf,mage,dark,dragon,illusion", p: 10000, gachaWeight: 0, d: "【遺物】從巨大蘑菇摘下的傘帽，戴上竟能抵禦魔法。" },
        "relic_gnomeearth_tshirt": { n: "髒汙的地精靈T恤",     type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 7, resFire: -10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】沾滿污泥的破舊 T 恤，防禦驚人卻格外怕火。" },
        "relic_wolf_shawl":        { n: "狼毛披肩",           type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 6, resEarth: -5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】以狼毛編成的粗獷披肩，厚實但沾著泥土氣息。" },
        "relic_husky_bone":        { n: "哈士奇的骨棒",       type: "wpn", relic: true, noEnhance: true, dmgS: 6, dmgL: 3, hit: 6, dmgBonus: 6, partnerHit: { "哈士奇": 6 }, req: "royal,knight,elf,mage,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】哈士奇最愛叼著到處跑的骨棒。" },
        "relic_dwarf_sheet":       { n: "侏儒的舊床單",       type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 9, cha: -2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】侏儒睡了不知多久的舊床單，防禦極佳但氣味擾人。" },
        "relic_bear_fishbone":     { n: "吃剩的魚骨頭",       type: "acc", slot: "ear", relic: true, noEnhance: true, ac: 1, dex: -1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】熊吃剩後掛在耳邊的魚骨，硌得人動作遲鈍。" },
        "relic_shepherd_boots":    { n: "放牧者的皮靴",       type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 5, dex: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】牧羊犬主人遺落的皮靴，走起路來格外輕快。" },
        "relic_zombie_shin":       { n: "殭屍的小腿骨",       type: "wpn", isWand: true, relic: true, noEnhance: true, dmgS: 3, dmgL: 4, hit: 3, dmgBonus: 3, extraMp: 7, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】殭屍的小腿骨，握著竟能感應到殘留的魔力。" },
        "relic_doberman_fang":     { n: "杜賓的尖銳犬齒",     type: "wpn", relic: true, noEnhance: true, dmgS: 4, dmgL: 2, hit: 11, dmgBonus: 9, req: "royal,knight,elf,mage,dark", p: 10000, gachaWeight: 0, d: "【遺物】杜賓狗銳利的犬齒，出手又快又狠。" },
        "relic_amp_staff":          { n: "安普長老的拐杖",     type: "wpn", isWand: true, relic: true, noEnhance: true, dmgS: 3, dmgL: 4, hit: 5, dmgBonus: 5, extraMp: 9, procSkill: "sk_hell_fang", procRateBase: 15, procRatePerEn: 0, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】安普長老生前倚仗的拐杖，杖端仍纏繞著地獄的餘燼。" },
        "relic_ent_bark":           { n: "安特的乾枯樹皮",     type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 6, dr: 5, resFire: -10, block: 50, req: "royal,knight,elf,mage,dark,dragon,illusion", p: 10000, gachaWeight: 0, d: "【遺物】污染之安特剝落的乾枯樹皮，堅硬如盾卻格外怕火。" },
        "relic_eye_crystal":        { n: "通透的水晶體",       type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, mhp: 10, mmp: 10, mr: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】漂浮之眼的透明晶體，凝視久了竟覺神清氣爽。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_gladiator_scimitar": { n: "鬥士的歷戰彎刀",     type: "wpn", relic: true, noEnhance: true, dmgS: 8, dmgL: 8, hit: 9, dmgBonus: 9, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】妖魔鬥士在無數搏鬥中砍缺了刃口的彎刀，殺意未減。" },
        "relic_icefield_pick":      { n: "冰原十字鎬",         type: "wpn", relic: true, noEnhance: true, dmgS: 6, dmgL: 4, hit: 5, dmgBonus: 5, procStatusSkill: { skId: "sk_relic_freeze", rate: 1 }, req: "royal,knight,elf,mage,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】冰原狼人用來鑿冰的十字鎬，敲擊時激起刺骨寒氣。" },
        "relic_monsterhand_skin":   { n: "怪手皮",             type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 7, mr: -5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】怪手蛻下的厚實皮膜，護住雙手卻削弱了魔法防護。" },
        "relic_werewolf_mace":      { n: "狼人的釘錘",         type: "wpn", relic: true, noEnhance: true, dmgS: 6, dmgL: 8, hit: 6, dmgBonus: 6, str: 1, req: "royal,knight,elf,mage,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】狼人揮舞的粗製釘錘，掄起時帶著野性的蠻力。" },
        "relic_dwarf_chainmail":    { n: "侏儒的笨重鎖甲",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 11, req: "royal,knight,elf,dark,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】侏儒戰士笨重的鎖子甲，防禦極佳但沉重無比。" },
        "relic_weathered_skull":    { n: "風化的頭蓋骨",       type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 5, mr: 10, abnormalResist: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】不知名骷髏風化的頭蓋骨，戴上竟能穩定心神。" },
        "relic_orc_nail":           { n: "惡臭的妖魔指甲",     type: "wpn", relic: true, noEnhance: true, dmgS: 2, dmgL: 3, hit: 9, dmgBonus: 7, procPoison: { rate: 30, dmg: [10, 1], dur: 10, tick: 1 }, req: "royal,knight,elf,mage,dark", p: 10000, gachaWeight: 0, d: "【遺物】妖魔殭屍剝落的惡臭指甲，抓傷處會潰爛流膿。" },
        "relic_orc_gloves":         { n: "妖魔的拳擊套",       type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 4, meleeHit: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】甘地妖魔纏在拳上的破爛拳套，出拳更準更狠。" },
        "relic_pan_staff":          { n: "牧神的放牧棍",       type: "wpn", relic: true, noEnhance: true, dmgS: 6, dmgL: 8, hit: 6, dmgBonus: 6, petDmgAll: 3, req: "royal,knight,elf,mage,warrior", p: 10000, gachaWeight: 0, d: "【遺物】污染之潘驅趕牲口的長棍，揮舞時彷彿能號令群獸。" },
        "relic_croc_tshirt":        { n: "鱷魚皮內衣",         type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 5, dex: -1, con: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】以鱷魚皮縫製的貼身內衣，堅韌卻略顯笨重。" },
        "relic_maid_gift":          { n: "侍女的贈禮",         type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 3, resWater: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】冰之女王侍女偷偷相贈的髮飾，蘊藏著寒冰的祝福。" },
        "relic_giantant_antenna":   { n: "巨蟻的誘導觸角",     type: "wpn", isBow: true, ranged: true, relic: true, noEnhance: true, rapidfire: 100, dmgS: 2, dmgL: 2, hit: 11, dmgBonus: 6, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】巨蟻的誘導觸角改製而成的長弓，能引導箭矢精準命中。" },
        "relic_orcmage_cloth":      { n: "妖魔法師的餐桌巾",   type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 2, wis: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】妖魔法師當作斗篷披著的餐桌巾，殘留著施法的靈光。" },
        "relic_elastic_rib":        { n: "有彈性的肋骨",       type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 8, dmgL: 8, hit: 6, dmgBonus: 9, dr: 2, eff: "combo", comboRate: 30, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】骷髏弓箭手身上抽出的柔韌肋骨，揮舞如刃、格擋如盾。" },
        "relic_roach_shell":        { n: "蟑螂的黑光甲殼",     type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 1, extraDmg: 3, cha: -3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】蟑螂人泛黑光的甲殼，堅硬中透出令人不適的氣息。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_golem_fist":         { n: "石頭高崙的重拳",     type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 17, dmgL: 19, hit: 7, dmgBonus: 7, eff: "crush", procSkill: "sk_quake", procRateBase: 5, procRatePerEn: 0, req: "royal,knight,elf,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】石頭高崙揮出的沉重巨拳，砸中地面震起碎石。" },
        "relic_orc_cleaver":        { n: "妖魔的老舊菜刀",     type: "wpn", relic: true, noEnhance: true, dmgS: 8, dmgL: 8, hit: 6, dmgBonus: 6, ele: "earth", req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】妖魔廚房裡鏽蝕的老菜刀，刀身沾染大地的濁氣。" },
        "relic_strong_femur":       { n: "強韌的大腿骨",       type: "wpn", relic: true, noEnhance: true, dmgS: 6, dmgL: 3, hit: 4, dmgBonus: 4, procInstakill: { p: 0.20, tag: "undead", maxLv: 49 }, req: "royal,knight,elf,mage,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】異常強韌的大腿骨，對付不死生物格外好使。" },
        "relic_forgotten_spear":    { n: "遺忘士兵的老舊長槍",  type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 10, dmgL: 12, hit: 7, dmgBonus: 7, eff: "pierce", pierceChance: 90, req: "royal,elf", p: 10000, gachaWeight: 0, d: "【遺物】遺忘士兵生前緊握的長槍，槍尖仍殘留貫穿之志。" },
        "relic_spider_claw":        { n: "巨大蜘蛛的恐懼尖爪",  type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 17, dmgL: 15, hit: 10, dmgBonus: 9, eff: "combo", comboRate: 30, procPoison: { rate: 50, dmg: [10, 1], dur: 10, tick: 1 }, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】巨大蜘蛛的恐懼尖爪，撕裂處滲出致命劇毒。" },
        "relic_scout_scope":        { n: "巡守的望遠鏡",       type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 4, rangedHit: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】妖魔巡守用來遠望的望遠鏡，看得更遠也瞄得更準。" },
        "relic_hobgoblin_grinder":  { n: "哈柏哥布林的研磨刀",  type: "wpn", relic: true, noEnhance: true, dmgS: 4, dmgL: 6, hit: 12, dmgBonus: 11, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】哈柏哥布林反覆研磨的短刀，鋒利得能削鐵如泥。" },
        "relic_orc_butcher":        { n: "妖魔的屠刀",         type: "wpn", relic: true, noEnhance: true, dmgS: 8, dmgL: 8, hit: 10, dmgBonus: 10, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】阿吐巴妖魔宰殺獵物的厚重屠刀，寒光森森。" },
        "relic_orc_pole":           { n: "妖魔的曬衣桿",       type: "wpn", relic: true, noEnhance: true, dmgS: 4, dmgL: 6, hit: 9, dmgBonus: 9, unBonus: true, req: "royal,knight,elf,mage,warrior", p: 10000, gachaWeight: 0, d: "【遺物】妖魔拿來曬衣的細長桿子，捅刺不死與狼人格外有效。" },
        "relic_bear_fur":           { n: "歐熊的柔軟毛皮",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 6, er: 20, mr: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】歐熊柔軟厚實的毛皮，披上後身形靈巧、魔法難侵。" },
        "relic_lizard_shield":      { n: "蜥蜴人的鋼鐵圓盾",   type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 7, block: 30, immFreeze: true, req: "royal,knight,elf,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】蜥蜴人鑄造的鋼鐵圓盾，冷血之軀使它不懼冰寒。" },
        "relic_caveman_webbing":    { n: "穴居人的蹼",         type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 5, resWater: 10, mpR: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】穴居人腳上的蹼，涉水如履平地。" },
        "relic_sparta_grudge":      { n: "史巴托的怨念",       type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 11, dmgL: 7, hit: 11, dmgBonus: 10, eff: "combo", comboRate: 25, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】史巴托死後凝聚的怨念雙刀，揮舞時透出徹骨恨意。" },
        "relic_ghoul_bracelet":     { n: "食屍鬼的手環",       type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 1, immParalyze: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】食屍鬼腐朽的手環，戴上後肢體不再僵麻。" },
        "relic_shark_teeth":        { n: "鯊魚的千刃牙",       type: "wpn", relic: true, noEnhance: true, dmgS: 4, dmgL: 3, hit: 9, dmgBonus: 7, unBonus: true, ele: "water", req: "royal,knight,elf,mage,dark", p: 10000, gachaWeight: 0, d: "【遺物】鯊魚層疊如刃的利牙，撕咬帶著洶湧水勢。" },
        "relic_guard_towershield":  { n: "鎧衛隊的漆黑塔盾",   type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 9, block: 60, dr: 5, req: "knight", p: 10000, gachaWeight: 0, d: "【遺物】鎧衛隊的漆黑塔盾，厚重如壁、堅不可摧。" },
        // ===== 🏺 遺物 第二批（v3.1.1·29 件·單一怪物專屬掉落 0.0001%）=====
        "relic_guard_spear":        { n: "鎧衛隊的漆黑長槍",   type: "wpn", relic: true, noEnhance: true, ignHardSkin: true, dmgS: 6, dmgL: 8, hit: 12, dmgBonus: 12, req: "royal,knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】鎧衛隊配發的漆黑長槍，槍尖既裂皮肉又破重甲。" },
        "relic_mermaid_tear":       { n: "人魚的淚滴",         type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, mpR: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】人魚落下凝成寶石的淚滴，蘊藏綿延不絕的魔力。" },
        "relic_orc_loincloth":      { n: "妖魔的兜襠布",       type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 2, crushDr: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】那魯加妖魔僅存的遮羞布，卻莫名擅長卸去重擊之力。" },
        "relic_crescent_earring":   { n: "月牙耳環",           type: "acc", slot: "ear", relic: true, noEnhance: true, ac: 0, hpR: 30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】映著月牙微光的耳環，佩戴時傷勢悄然癒合。" },
        "relic_ungoliant_plate":    { n: "楊果里恩的腹甲",     type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 5, resFire: -5, req: "royal,knight,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】楊果里恩剝落的腹甲，厚重堅硬卻格外怕火。" },
        "relic_crab_claw":          { n: "蟹人的巨鉗",         type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 14, dmgL: 12, hit: -2, dmgBonus: 7, eff: "combo", comboRate: 33, mcrit: 5, ele: "water", req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】蟹人巨大的甲鉗，一開一闔便是致命的雙重夾擊。" },
        "relic_wild_mane_coat":     { n: "狂野的鬃毛外套",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 12, meleeHaste: 15, meleeHit: -1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】狂野之毒身上狂亂的鬃毛外套，激起野性的迅捷。" },
        "relic_venom_fang":         { n: "劇毒的獠牙",         type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 17, dmgL: 21, hit: 9, dmgBonus: 12, eff: "cleave", procPoison: { rate: 50, dmg: [30, 1], dur: 10, tick: 1 }, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】狂野毒牙淬鍊的巨牙，切開之處毒液奔流不止。" },
        "relic_ohm_shackle":        { n: "歐姆的腳鐐",         type: "acc", slot: "belt", relic: true, noEnhance: true, ac: 1, weightCap: 300, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】歐姆囚身的沉重腳鐐，習慣其重量後負重如無物。" },
        "relic_soldierant_carapace":{ n: "兵蟻的光澤背甲",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 14, resEarth: 10, req: "royal,knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】巨大兵蟻泛著光澤的背甲，厚實堅硬、親和大地。" },
        "relic_ratman_skewer":      { n: "鼠人的烤肉叉",       type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 16, dmgL: 16, hit: 11, dmgBonus: 8, eff: "pierce", pierceChance: 80, extraDmg: 10, unBonus: true, ele: "fire", req: "royal,knight,elf,warrior", p: 10000, gachaWeight: 0, d: "【遺物】鼠人炙烤獵物的長叉，燒得通紅、一叉貫穿數敵。" },
        "relic_starfish_arm":       { n: "海星的分裂腕足",     type: "wpn", w2h: true, chainsword: true, weakExpose: true, relic: true, noEnhance: true, dmgS: 21, dmgL: 20, hit: 14, dmgBonus: 11, eff: "combo", comboRate: 20, procStatusSkill: { skId: "sk_relic_paralyze", rate: 1 }, str: 2, wis: 2, req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】海星再生不絕的分裂腕足，纏擊之間暴露敵人弱點。" },
        "relic_croc_soul":          { n: "被遺忘的鱷魚靈魂",   type: "wpn", qigu: true, relic: true, noEnhance: true, dmgS: 24, dmgL: 24, hit: 0, mdmg: 2, wis: 2, extraMp: 9, procSkill: "sk_icearrow", procRateBase: 15, procRatePerEn: 0, req: "illusion", p: 10000, gachaWeight: 0, d: "【遺物】遺忘之島鱷魚殘留的靈魂，化作幻術士的奇古獸。一般攻擊化為必中的魔法傷害（受魔抗減免）。" },
        "relic_lizard_scale":       { n: "破舊的蜥蜴甲",       type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 1, mpR: 3, mr: 5, req: "mage,elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】遺忘之島蜥蜴人剝下的破舊甲片，涼薄卻凝聚魔力。" },
        "relic_veteran_lizard_gauntlet":{ n: "資深蜥蜴族護手", type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 7, meleeDmg: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】狂暴蜥蜴人的護手，久經戰陣使出手更具威力。" },
        "relic_black_gale":         { n: "黑色疾風",           type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 10, hpR: 20, mpR: 1, dr: 6, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】狂野之魔化成的漆黑疾風，纏身而過生機盎然。" },
        "relic_elder_thunder":      { n: "長老的雷電能量",     type: "wpn", isWand: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 4, dmgL: 5, hit: 4, dmgBonus: 4, extraMp: 3, procSkill: "sk_thunder", procRateBase: 100, procRatePerEn: 0, procOnHit: true, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】長老掌中凝聚的雷電能量。一般攻擊命中時，必定額外觸發極道落雷；未命中時不會觸發。" },
        "relic_green_imp_nail":     { n: "綠色妖鬼的指甲",     type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 3, atkSpdPct: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】卡司特尖銳的綠色指甲，套上後出手快如鬼魅。" },
        "relic_ohm_hidepants":      { n: "歐姆的粗皮褲",       type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 1, mr: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】狂暴的歐姆脫下的粗皮褲，粗糙厚實、抗拒魔法。" },
        "relic_ogre_mawashi":       { n: "食人妖精的相撲褌",   type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 3, resFire: 5, dr: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】食人妖精纏腰的相撲褌，厚布層層擋下烈焰與重擊。" },
        "relic_lamia_tailscale":    { n: "蛇女的尾鱗甲",       type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 1, meleeDmg: 1, extraDmg: 5, mhp: 50, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】蛇女尾端剝落的鱗甲，貼身護衛且蘊藏毒性之力。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_bat_wing":           { n: "飛蝠之翼",           type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 5, er: 15, mr: 15, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】魔蝙蝠的薄翼，披上後身形飄忽、魔法難侵。" },
        "relic_mandra_spirit":      { n: "曼陀羅之靈",         type: "wpn", qigu: true, relic: true, noEnhance: true, dmgS: 26, dmgL: 26, hit: 0, mpR: 15, int: 1, extraMp: 7, procInstakill: { p: 0.01 }, req: "illusion", p: 10000, gachaWeight: 0, d: "【遺物】底比斯曼陀羅草凝成的靈體，化作幻術士的奇古獸。一般攻擊化為必中的魔法傷害（受魔抗減免）。" },
        "relic_ohm_heavyarmor":     { n: "歐姆士兵的重裝鎧甲", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 20, er: -50, dr: 10, req: "knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】歐姆裝甲兵的重裝鎧甲，堅不可摧卻笨重難行。" },
        "relic_cerberus_wand":      { n: "三頭犬魔杖",         type: "wpn", isWand: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 2, dmgL: 3, hit: 9, dmgBonus: 9, mdmg: 3, extraMp: 5, ele: "fire", spellProc: { skn: "噴火", dice: [4, 6], ele: "fire", aoe: true }, procRateBase: 10, procRatePerEn: 0, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】以地獄犬三首煉成的魔杖，杖端噴吐地獄業火。" },
        "relic_watersprite_string": { n: "水靈的琴弦",         type: "wpn", isBow: true, ranged: true, w2h: true, relic: true, noEnhance: true, ignHardSkin: true, rapidfire: 70, dmgS: 3, dmgL: 3, hit: 8, dmgBonus: 11, extraDmg: 5, ele: "water", spellProc: { skn: "寒冰氣息", dice: [5, 5], flat: 5, ele: "water", aoe: true }, procRateBase: 5, procRatePerEn: 0, req: "elf,illusion", p: 10000, gachaWeight: 0, d: "【遺物】希爾黛斯撥動的水靈琴弦，箭如寒流連綿不絕。" },
        "relic_dragonturtle_shell": { n: "龍龜的背殼",         type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 10, dr: 6, resFire: 5, resWater: 5, resEarth: 5, resWind: 5, req: "royal,dragon,knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】龍龜堅不可摧的背殼，抵禦萬般傷害與四方之力。" },
        "relic_bluetail_tail":      { n: "藍尾蜥蜴的斷尾",     type: "acc", slot: "belt", relic: true, noEnhance: true, ac: 0, weightCap: 150, hpR: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】藍尾蜥蜴自斷的尾巴，輕盈且生機勃勃、再生不息。" },
        "relic_lizardman_cleaver":  { n: "蜥蜴人的大砍刀",     type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 10, dmgL: 17, hit: 10, dmgBonus: 10, eff: "pierce", pierceChance: 50, vampPct: 0.03, mhp: 60, req: "royal,knight,elf,warrior", p: 10000, gachaWeight: 0, d: "【遺物】重裝蜥蜴人揮舞的大砍刀，一刀劈落數敵、飲血自癒。" },
        // ===== 🏺 遺物 第三批（v3.1.2·19 件·單一怪物專屬掉落 0.0001%）=====
        "relic_ohm_maul":           { n: "歐姆裝甲兵的超重鎚", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 20, dmgL: 26, hit: 7, dmgBonus: 11, eff: "crush", mcrit: 3, mcritDmg: 10, req: "royal,knight,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】歐姆裝甲兵掄起的超重戰鎚，一擊粉碎鋼鐵。" },
        "relic_darkspirit_shroud":  { n: "暗靈的迷霧披肩",   type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 0, mr: 30, dr: 3, er: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】闇之精靈凝成的迷霧披肩，輕如無物卻魔法難侵。" },
        "relic_armadillo_helm":     { n: "犰狳尖刺頭盔",     type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 5, thorns: 15, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】犰狳背甲製成的尖刺頭盔，觸之者反受其傷。" },
        "relic_whiteant_shell":     { n: "白螞蟻蛋殼",       type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 0, onDmgHeal: "sk_heal1", req: "royal,knight,elf,mage,dark,dragon,illusion", p: 10000, gachaWeight: 0, d: "【遺物】白螞蟻群未孵化的堅殼，受創時湧出療癒之力。" },
        "relic_high_lizard_armguard":{ n: "高等蜥蜴鱗臂甲",  type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, rangedDmg: 5, rangedHit: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】高等蜥蜴人的鱗片臂甲，穩住持弓的手。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_parrot_beak":        { n: "七彩鸚鵡喙",       type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 20, dmgL: 17, hit: 9, dmgBonus: 12, eff: "cleave", ele: "wind", procStatusSkill: { skId: "sk_relic_silence", rate: 1 }, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】奇異鸚鵡巨大的七彩喙，啄擊如疾風、令人噤聲。" },
        "relic_pirate_scimitar":    { n: "海賊經典彎刀",     type: "wpn", relic: true, noEnhance: true, dmgS: 8, dmgL: 8, hit: 15, dmgBonus: 15, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】海賊骷髏至死緊握的經典彎刀，鋒芒歷久不衰。" },
        "relic_scorpion_sting":     { n: "毒蠍的尾刺",       type: "wpn", relic: true, noEnhance: true, dmgS: 3, dmgL: 3, hit: 7, dmgBonus: 5, procPoison: { rate: 100, dmg: [30, 1], dur: 10, tick: 1 }, procInstakill: { p: 0.01 }, req: "royal,knight,elf,mage,dark", p: 10000, gachaWeight: 0, d: "【遺物】毒蠍淬滿劇毒的尾刺，一擊致命。" },
        "relic_harvey_claw":        { n: "哈維的吸血爪",     type: "wpn", relic: true, noEnhance: true, dmgS: 9, dmgL: 11, hit: 8, dmgBonus: 8, vampPct: 0.05, spellProc: { skn: "吸血鬼之吻", dice: [2, 10], flat: 10, ele: "none", heal: 1.0 }, procRateBase: 3, procRatePerEn: 0, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】哈維鮮血淋漓的利爪，撕咬間奪取生命。" },
        "relic_death_leaf":         { n: "隱蔽的死亡草葉",   type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 5, stealth: true, instakillFull: 0.01, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】底比斯曼陀羅草化成的隱蔽草葉，藏形匿影、致人於死。" },
        "relic_apprentice_wand":    { n: "黑魔法學徒魔杖",   type: "wpn", isWand: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 1, dmgL: 1, hit: 6, dmgBonus: 6, extraMp: 6, mpR: 15, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精魔法學徒的入門魔杖，蘊藏綿延魔力。" },
        "relic_bear_vitality":      { n: "巨熊的生命力",     type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, mhp: 100, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】魔熊凝於指環的旺盛生命力，令持有者體魄強健。" },
        "relic_militia_armor":      { n: "民兵的萬用護甲",   type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 9, mr: 9, extraDmg: 1, extraHit: 1, extraMp: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】歐姆民兵的萬用護甲，四平八穩、面面俱到。" },
        "relic_sharpshooter_bow":   { n: "神射手的重弦弓",   type: "wpn", isBow: true, ranged: true, w2h: true, relic: true, noEnhance: true, ignHardSkin: true, rapidfire: 90, dmgS: 2, dmgL: 2, hit: 13, dmgBonus: 9, rcrit: 3, req: "royal,knight,elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】骷髏神射手的重弦長弓，箭無虛發、勁貫甲胄。" },
        "relic_guard_pike":         { n: "警衛的穿心矛",     type: "wpn", relic: true, noEnhance: true, dmgS: 7, dmgL: 8, hit: 9, dmgBonus: 9, unBonus: true, mmp: 50, mpOnHit: true, req: "royal,knight,elf,mage,warrior", p: 10000, gachaWeight: 0, d: "【遺物】骷髏警衛的穿心長矛，破甲奪魂、汲取魔力。" },
        "relic_whirlwind_xbow":     { n: "旋風十字弓",       type: "wpn", isBow: true, ranged: true, oneHand: true, relic: true, noEnhance: true, rapidfire: 70, dmgS: 3, dmgL: 3, hit: 13, dmgBonus: 10, mdmg: 2, ele: "wind", procSkill: "sk_tornado", procRateBase: 3, procRatePerEn: 0, req: "elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】黑暗精靈的旋風十字弓，箭矢裹挾狂風。單手十字弓（可與盾牌／臂甲並用，需裝備箭矢）。" },
        "relic_darkremnant_boots":  { n: "黑暗殘兵的訓練靴", type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 6, dex: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精殘兵的訓練靴，久經操練、步履輕捷。" },
        "relic_ogi_greataxe":       { n: "歐吉的巨大戰斧",   type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 20, dmgL: 26, hit: 12, dmgBonus: 12, eff: "crush", str: 3, mhp: 50, req: "royal,knight,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】歐吉揮舞的巨大戰斧，蠻力橫掃、摧枯拉朽。" },
        "relic_doro_vitality":      { n: "多羅的生命能量",   type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 2, mhp: 30, hpR: 50, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】多羅蘊含的旺盛生命能量，源源不絕地修復傷勢。" },
        // ===== 🏺 遺物 第四批（v3.1.4·11 遺物＋1 一般防具雪人手套·單一怪物專屬掉落 0.0001%）=====
        "relic_deepfish_skin":      { n: "深海魚的電擊皮",   type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 10, resWind: 10, resWater: 10, mr: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】深海電魚剝下的皮膜，帶著麻痺的電流與海潮氣息。" },
        "relic_bandit_token":       { n: "盜掠者的信物",     type: "acc", slot: "ear", relic: true, noEnhance: true, ac: 0, hpR: 3, mpR: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】強盜掛在耳邊的贓物信物，佩戴時精神格外充沛。" },
        "relic_yeti_fist":          { n: "雪人之拳",         type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 6, immFreeze: true, resWater: 8, mhp: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】雪人厚重的拳套，凝結千年寒冰卻不畏冰凍。" },
        "arm_yeti_gloves":          { n: "雪人手套",         type: "arm", slot: "gloves", ac: 1, resWater: 8, mhp: 5, req: "all", safe: 4, p: 30000, gachaWeight: 30, d: "雪人毛皮縫製的厚實手套，隔絕刺骨寒氣。" },
        "relic_paper_cloak":        { n: "輕薄的紙披風",     type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 0, resFire: -10, extraMp: 10, mpR: 10, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】紙人身上輕薄的符紙披風，蘊藏充沛魔力卻一觸即燃。" },
        "relic_darkthief_claw":     { n: "黑暗盜賊的兇殺爪", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 17, dmgL: 15, hit: 10, dmgBonus: 13, eff: "combo", comboRate: 50, extraDmg: 10, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精盜賊行兇的雙爪，撕裂之間血花四濺。" },
        "relic_darkelf_chainsword": { n: "暗精靈鎖鏈劍",     type: "wpn", w2h: true, chainsword: true, weakExpose: true, relic: true, noEnhance: true, dmgS: 22, dmgL: 16, hit: 8, dmgBonus: 8, hpR: 10, extraMp: 5, spellProc: { skn: "吸血鬼之吻", dice: [2, 10], flat: 10, ele: "none", heal: 1.0 }, procRateBase: 10, procRatePerEn: 0, req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】闇精靈王御用的鎖鏈劍，斬擊之餘吸食敵人的生命。" },
        "relic_seawater_shirt":     { n: "浸泡海水的內衣",   type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 6, resWind: -10, resFire: 10, mpR: 3, dr: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】海賊骷髏浸透海水的內衣，濕冷卻能澆熄烈焰。" },
        "relic_fighter_axe":        { n: "鬥士的老舊戰斧",   type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 18, dmgL: 18, hit: 9, dmgBonus: 9, eff: "crush", hardWear: 100, req: "royal,knight,elf,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】骷髏鬥士的老舊戰斧，一劈便將堅甲硬皮盡數崩碎。" },
        "relic_hermitcrab_shell":   { n: "寄居蟹的巨大背殼", type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 10, dr: 15, moveSpeedPct: -50, req: "knight", p: 10000, gachaWeight: 0, d: "【遺物】奎斯坦修的巨大背殼，堅如磐石卻沉重拖累身形。" },
        "relic_bombflower_core":    { n: "爆彈花蕊",         type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 6, resFire: 20, hurtExplode: 100, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】爆彈花不穩定的花蕊，受創時炸裂波及四周；爆裂反噬屬於火屬性魔法傷害，可由魔防與火屬性抗性減輕。" },
        "relic_scarab_shin":        { n: "古代聖甲蟲脛甲",   type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 4, resEarth: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】底比斯聖甲蟲的甲殼脛甲，親和大地之力。" },
        "relic_darkelf_grindblade": { n: "黑暗殘兵的研磨利刃", type: "wpn", relic: true, noEnhance: true, ignHardSkin: true, dmgS: 10, dmgL: 12, hit: 15, dmgBonus: 14, req: "royal,knight,elf,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精殘兵研磨至極的單手武士刀，刃鋒薄透卻能破甲穿骨。" },
        "relic_darkelf_shootglove": { n: "黑暗殘兵輔助射擊手套", type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 5, rangedDmg: 2, rangedHit: 2, req: "knight,elf,dark,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精殘兵操弩的皮手套，穩住扣弦瞄準的每一次呼吸。" },
        "relic_giant_clubfrag":     { n: "巨人的木棒殘片",   type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 3, dr: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】巨人巨棒斷裂的殘片，綁在臂上厚重如盾。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_ogreking_collar":    { n: "食人妖精王的尖刺項圈", type: "acc", slot: "belt", relic: true, noEnhance: true, ac: 0, weightCap: 300, petDmgAll: 3, petHitAll: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】食人妖精王套在獸群頸上的尖刺項圈，號令群獸為其效死。" },
        "relic_monia_sandals":      { n: "莫妮亞的疾速涼鞋", type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 6, moveSpeedPct: 50, er: 10, dex: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】莫妮亞輕盈編織的涼鞋，穿上便如疾風般迅捷。" },
        "relic_wornout_underwear":  { n: "戰場風化的老舊內衣", type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 5, con: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】艾爾摩士兵陣亡後遺留的貼身內衣，歷經戰火依舊堅韌。" },
        "relic_dream_mushroom_soul":{ n: "夢幻的蘑菇靈魂",   type: "wpn", qigu: true, relic: true, noEnhance: true, dmgS: 28, dmgL: 28, hit: 0, int: 1, wis: 2, extraMp: 11, procPoison: { rate: 30, dmg: [10, 1], dur: 10, tick: 1 }, req: "illusion", p: 10000, gachaWeight: 0, d: "【遺物】夢幻之島蘑菇凝聚的靈魂，化為幻術士操縱的奇古獸。幻術士專屬·奇古獸（一般攻擊化為必中的魔法傷害，受魔抗減免）。" },
        "relic_wisp_remnant":       { n: "幽光的殘念",       type: "wpn", relic: true, noEnhance: true, dmgS: 10, dmgL: 12, hit: 13, dmgBonus: 12, onHitEleDmg: { dmg: 30, ele: "fire" }, req: "royal,knight,elf,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】夢幻之島鬼火凝成的殘念，寒光深處透著不滅的火意。單手武士刀。" },
        "relic_frostdeath_breath":  { n: "殘冰的死亡氣息",   type: "wpn", w2h: true, isWand: true, relic: true, noEnhance: true, ignHardSkin: true, eff: "magicburst", freeChill: true, dmgS: 9, dmgL: 9, hit: 10, dmgBonus: 9, extraMp: 7, int: 1, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】冰人臨終吐出的最後一縷氣息，凝成雙手魔杖。" },
        "relic_remnant_barrier":    { n: "殘兵法師的魔力護盾", type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 4, mr: 20, int: 1, con: -1, req: "elf,mage,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精殘兵法師以殘餘魔力凝成的護盾，副手裝備。" },
        "relic_summoner_whip":      { n: "喚獸師的訓練鞭",   type: "wpn", relic: true, noEnhance: true, eff: "crush", dmgS: 6, dmgL: 4, hit: 8, dmgBonus: 8, summonDmg: 3, summonHit: 6, petDmgAll: 6, petHitAll: 3, req: "royal,knight,elf,mage,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】喚獸師馴服百獸的長鞭，號令召喚物與寵物同心協力。單手鈍器。" },
        "relic_metalshell_shin":    { n: "金屬甲殼脛甲",     type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 7, req: "royal,knight,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】金屬蜈蚣蛻下的甲殼，包覆小腿堅硬如鐵。" },
        "relic_griffin_claw":       { n: "獅鷲的鋒利鷹爪",   type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "combo", comboRate: 50, mcritDmg: 10, dmgS: 20, dmgL: 18, hit: 13, dmgBonus: 14, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】格利芬鋒利的巨爪，撕裂空氣的速度快得肉眼難辨。雙手鋼爪。" },
        "relic_wither_amulet":      { n: "凋零法師的護身符", type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, int: 3, mpR: 5, con: -2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】凋零法師貼身的護身符，以生命為代價換取深邃魔力。" },
        "relic_stalker_chest":      { n: "潛行者的祕密箱子", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 9, dr: 15, mr: 15, moveSpeedPct: -100, req: "royal,elf,knight,dark,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】潛行者藏身其中的沉重箱子，堅不可摧卻寸步難行。" },
        "relic_giantant_eye":       { n: "巨大螞蟻的複眼",   type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 3, showMobEle: true, weakHitBonus: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】巨大螞蟻的複眼，能洞悉敵人的屬性弱點。" },
        "relic_croc_fang":          { n: "巨大鱷魚的狩獵牙", type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "cleave", ignHardSkin: true, hardSkinMult: 1.5, dmgS: 17, dmgL: 21, hit: 13, dmgBonus: 16, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】巨大鱷魚的狩獵利牙，專破厚甲硬皮。雙手劍。" },
        "relic_icestone_maul":      { n: "冰石的強襲鎚",     type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "crush", ele: "water", onHitEleDmg: { dmg: 10, ele: "water" }, procStatusSkill: { skId: "sk_relic_freeze", rate: 1 }, dmgS: 18, dmgL: 24, hit: 10, dmgBonus: 10, req: "royal,knight,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】冰石高崙揮舞的強襲鎚，每一擊都帶著徹骨寒意。雙手鈍器。" },
        "relic_scarab_nest":        { n: "聖甲蟲的孵育巢",   type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 1, cha: -3, aggroHide: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】聖甲蟲守護幼蟲的孵育巢，散發使敵人本能迴避的氣味。" },
        "relic_blackmage_pants":    { n: "黑法師的修身褲",   type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 0, dex: 2, int: 1, wis: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】黑法師合身的修身褲，輕巧靈活。" },
        "relic_mutant_lamia_scale": { n: "變種蛇女的詭異鱗片", type: "wpn", relic: true, noEnhance: true, ignHardSkin: true, unBonus: true, dmgS: 7, dmgL: 7, hit: 9, dmgBonus: 11, procStatusSkill: { skId: "sk_relic_paralyze", rate: 1 }, procPoison: { rate: 100, dmg: [10, 1], dur: 10, tick: 1 }, req: "royal,knight,elf,mage,dark", p: 10000, gachaWeight: 0, d: "【遺物】變種蛇女詭異的鱗片，鋒利如刃、淬滿劇毒。匕首。" },
        "relic_pirate_bandana":     { n: "海賊骷髏的陳年頭巾", type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 5, wis: 2, resWater: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】海賊骷髏刀手陳年的頭巾，浸透海風鹹味。" },
        "relic_pirate_ring":        { n: "海賊的統御之戒",   type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, summonDmg: 10, petDmgAll: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】海賊統御群屍的指環，令召喚物與寵物為其效死。" },
        "relic_giant_toothpick":    { n: "巨人戰士的牙籤",   type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "cleave", ignHardSkin: true, procStatusSkill: { skId: "sk_relic_stun", rate: 1 }, dmgS: 20, dmgL: 17, hit: 14, dmgBonus: 17, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】巨人戰士隨手的牙籤，於常人卻是巨劍。雙手劍。" },
        "relic_giant_throwstone":   { n: "巨人的拋投石",     type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "crush", dr: 3, procStatusSkill: { skId: "sk_relic_broken", rate: 5 }, dmgS: 18, dmgL: 24, hit: 12, dmgBonus: 12, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】巨人拋投的巨石，砸中即令甲冑碎裂。雙手鈍器。" },
        "relic_redimp_nail":        { n: "紅色妖鬼的詛咒指甲", type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 1, atkSpdPct: 35, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】紅色妖鬼詛咒的指甲，纏於指間催動疾速。" },
        "relic_armor_spareblade":   { n: "詛咒鎧甲的備用刀", type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "combo", comboRate: 25, unBonus: true, dmgS: 11, dmgL: 8, hit: 14, dmgBonus: 11, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】活鎧甲備用的雙刀，無主自舞、寒光凜冽。雙刀。" },
        "relic_beholder_gaze":      { n: "眼魔的凝視",       type: "wpn", isWand: true, relic: true, noEnhance: true, eff: "magicstrike", str: 4, procStatusSkill: { skId: "sk_relic_stone", rate: 1 }, dmgS: 9, dmgL: 9, hit: 13, dmgBonus: 16, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】眼魔封存的凝視，杖端仍殘留石化之力。單手魔杖。" },
        "relic_fly_curse":          { n: "蠅災的詛咒",       type: "acc", slot: "ear", relic: true, noEnhance: true, ac: 0, auraDmg: { dmg: 50, interval: 20, ele: "none" }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】龍蠅群聚的災禍化為詛咒，環繞使用者嗡鳴不止。" },
        "relic_whitetiger_coat":    { n: "純白虎皮大衣",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 11, resWater: 15, immFreeze: true, req: "royal,knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】純白虎皮縫製的大衣，禦寒抗凍。" },
        "relic_yeti_foot":          { n: "雪怪的大腳",       type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 8, mpR: 3, dr: 2, resWater: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】雪怪碩大的腳掌製成的長靴，踏雪無痕。" },
        "relic_shapeshifter_underwear": { n: "百變的透明內衣", type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 0, mr: 5, highestAttrPlus: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】變形怪擬態而成的透明內衣，隨主人潛能起伏。" },
        "relic_veteran_greatsword": { n: "資深殘兵的重型劍", type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "cleave", counterBarrierX2: true, dmgS: 17, dmgL: 21, hit: 11, dmgBonus: 15, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】資深殘兵慣用的重型劍，格擋反擊間盡顯老練。雙手劍。" },
        "relic_thorn_needle":       { n: "刺針",             type: "wpn", relic: true, noEnhance: true, ignHardSkin: true, unBonus: true, raceBonus: { race: "蜘蛛", mult: 3 }, dmgS: 8, dmgL: 8, hit: 14, dmgBonus: 16, req: "royal,knight,elf,mage,dark", p: 10000, gachaWeight: 0, d: "【遺物】名為「刺針」的匕首，專為獵殺蛛類而鑄。匕首。" },
        "relic_thorn_curse":        { n: "荊棘纏身的詛咒",   type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 2, thorns: 30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】荊棘纏身的詛咒附於脛甲，觸之者反受其傷。" },
        "relic_cockatrice_gaze":    { n: "石化雞蛇的凝視",   type: "wpn", w2h: true, chainsword: true, relic: true, noEnhance: true, weakExpose: true, procStatusSkill: { skId: "sk_mummy_curse", rate: 5 }, int: 1, wis: 2, dmgS: 23, dmgL: 20, hit: 15, dmgBonus: 14, req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】石化雞蛇凝望的視線封入鎖鏈劍，斬擊間石化敵軀。鎖鏈劍（雙手・近距離）。" },
        // 🏺 遺物 第八批（v3.1.21·3 件）
        "relic_moonhowl_helm":      { n: "月下狂嘯",         type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 6, str: 1, meleeHit: 5, req: "royal,knight,dragon,elf,dark,warrior", p: 10000, gachaWeight: 0, d: "【遺物】狼人於月下狂嘯凝成的頭盔，激發持有者的近戰狩獵本能。" },
        "relic_poison_vial":        { n: "施毒者的實驗瓶",   type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, immPoison: true, immParalyze: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】施毒者珍藏的實驗瓶，內盛抗性血清使百毒不侵。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_ant_incubessence":   { n: "孵育螞蟻精華",     type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 0, onDmgHeal: "sk_heal_mid", onDmgHealCd: 8, req: "elf,mage,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】強化白螞蟻群孵育用的濃縮精華，受創時湧現豐沛的療癒之力。" },
        // 🏺 遺物 第九批（v3.1.28·10 件）
        "relic_aruba_haste":        { n: "阿魯巴的加速棍棒", type: "wpn", relic: true, noEnhance: true, eff: "crush", atkSpdPct: 20, dmgS: 4, dmgL: 4, hit: 17, dmgBonus: 15, req: "royal,knight,elf,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】阿魯巴揮舞的加速棍棒，看似笨重卻快得殘影四起。單手鈍器。" },
        "relic_ashwarrior_flamesword": { n: "灰燼戰士的火焰長劍", type: "wpn", relic: true, noEnhance: true, ele: "fire", onHitEleDmg: { ele: "fire", dmg: 50, rate: 3 }, dmgS: 8, dmgL: 12, hit: 12, dmgBonus: 12, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】灰燼戰士至死緊握的火焰長劍，餘燼未熄。單手劍。" },
        "relic_deadgeneral_greatsword": { n: "不死將軍的珍愛巨劍", type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "cleave", softMult: 1.3, dmgS: 20, dmgL: 17, hit: 12, dmgBonus: 15, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】不死將軍生前珍愛的雙手巨劍，專斬血肉之軀。雙手劍。" },
        "relic_steel_bulwark":      { n: "不動的鋼鐵堅壁",   type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 13, hitstunReduce: 5, req: "royal,knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】鋼鐵高崙的軀殼鍛成的盔甲，穩如不動的堅壁。" },
        "relic_raider_belt":        { n: "掠奪者的染血腰帶", type: "acc", slot: "belt", relic: true, noEnhance: true, ac: 0, weightCap: 200, con: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】強盜頭目染血的腰帶，掛滿掠奪來的戰利品仍游刃有餘。" },
        "relic_darkscorpion_pincers": { n: "暗黑蠍的雙鉗",   type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "combo", comboRate: 30, procSkill: "sk_demon_kiss", procRateBase: 4, procRatePerEn: 0, ele: "earth", poisonMult: 1.2, dmgS: 16, dmgL: 11, hit: 12, dmgBonus: 13, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】暗黑蠍撕裂而下的一對毒鉗，滴著大地的劇毒。雙刀。" },
        "relic_forgotten_sniperbow": { n: "遺忘者的狙擊弓",  type: "wpn", isBow: true, ranged: true, oneHand: true, relic: true, noEnhance: true, rapidfire: 80, fullHpMult: 3, fullHpMultTriple: 2, dmgS: 3, dmgL: 3, hit: 13, dmgBonus: 14, req: "elf", p: 10000, gachaWeight: 0, d: "【遺物】遺忘者遺留的單手狙擊弓，專取滿血敵人的要害。" },
        "relic_arrowfur_cloak":     { n: "佈滿箭矢的毛皮",   type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 5, dr: 8, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】遺忘之島歐熊插滿斷箭的厚毛皮，箭簇反成護身之甲。" },
        "relic_evillizard_eye":     { n: "邪惡蜥蜴的眼瞳",   type: "wpn", isWand: true, relic: true, noEnhance: true, mpOnHit: true, mpOnHitAmt: 6, procStatusSkill: { skId: "sk_mummy_curse", rate: 3 }, extraMp: 3, dmgS: 3, dmgL: 3, hit: 11, dmgBonus: 11, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】邪惡蜥蜴凝固的眼瞳鑲成的魔杖，凝視間魔力湧動。單手魔杖。" },
        "relic_flamearcher_bracer": { n: "烈焰射手的護腕",   type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 3, rangedDmg: 4, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】烈焰射手綁縛拉弦之臂的護腕，穩住每一次瞄準。" },
        // 🏺 遺物 第十批（v3.1.32·5 件）
        "relic_modded_crossbow":    { n: "擅自改造的十字弓", type: "wpn", isBow: true, ranged: true, oneHand: true, relic: true, noEnhance: true, rapidfire: 100, dex: 2, dmgS: 3, dmgL: 3, hit: 11, dmgBonus: 12, req: "elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】被人擅自改造過的單手十字弓，扳機輕觸即傾瀉箭雨。" },
        "relic_medusa_stinger":     { n: "蛇妖的無慈悲尾刺", type: "wpn", relic: true, noEnhance: true, eff: "crush", stoneInstakill: true, dmgS: 9, dmgL: 10, hit: 9, dmgBonus: 9, req: "royal,knight,elf,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】蛇妖斷落的尾刺，凝望與尖刺同樣致命。單手鈍器。" },
        "relic_silent_venom":       { n: "沉默的毒液",       type: "wpn", relic: true, noEnhance: true, procStatusSkill: { skId: "sk_relic_silence", rate: 3 }, silencedBonusDmg: 20, dmgS: 8, dmgL: 8, hit: 13, dmgBonus: 13, req: "royal,knight,elf,warrior", p: 10000, gachaWeight: 0, d: "【遺物】滴淌著沉默毒液的單手矛，刺中者噤聲難言。單手矛。" },
        "relic_charm_heart":        { n: "魅惑之心",         type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 4, cha: 2, wis: -1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】思克巴摘下的魅惑之心，教人神魂顛倒卻也迷失心神。" },
        "relic_swordsman_underwear": { n: "劍客的輕便內衣",  type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 3, dex: 2, meleeDmg: 3, meleeHit: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】劍客貼身的輕便內衣，不著痕跡地輔佐每一次揮劍。" },
        // 🏺 遺物 第十一批（v3.1.33·5 件）
        "relic_fireegg_orb":        { n: "纏繞炎球",         type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, mr: 5, resFire: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】恐怖的火炎蛋纏繞不散的炎球，環伺臂間燒退邪法與烈焰。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_venom_avatar":       { n: "毒液化身",         type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 5, poisonHealMult: 1.5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】蛇女蛻下的毒液化身，穿上便與毒共生。" },
        "relic_lycan_swiftlegs":    { n: "黑夜狼人的駿腿",   type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 9, er: 10, dex: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】黑夜狼人矯健的駿腿，步伐輕捷難以捕捉。" },
        "relic_axetaurus_brutalaxe": { n: "牛頭怪的殘暴巨斧", type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "crush", atkSpdPct: 25, dmgS: 22, dmgL: 24, hit: 11, dmgBonus: 11, req: "royal,knight,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】巨斧牛人揮舞的殘暴巨斧，勢大力沉卻快得不合常理。雙手鈍器。" },
        "relic_troll_belly":        { n: "食人妖精的緩衝肚", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 0, dr: 20, mr: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】食人妖精厚實的緩衝肚皮，再重的打擊都陷入其中消弭無形。" },
        // ===== 🏺 遺物 第五批（v3.1.52·19 件·單一怪物專屬掉落 0.0001%）=====
        "relic_burning_love":       { n: "火熱愛意",           type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 0, fireNullify: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】熱戀般滾燙的貼身衣物，將撲面而來的火焰溫柔擋下。" },
        "relic_fearless_charge":    { n: "無所畏懼的突擊",     type: "wpn", w2h: true, chainsword: true, weakExpose: true, relic: true, noEnhance: true, dmgS: 24, dmgL: 16, hit: 15, dmgBonus: 19, str: 2, hpR: 5, procStatusSkill: { skId: "sk_relic_stun", rate: 1 }, req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】無畏衝鋒者緊握的鎖鏈劍，纏擊之間撕開敵人的破綻。" },
        "relic_lizard_tongue":      { n: "灼熱蜥蜴長舌",       type: "wpn", relic: true, noEnhance: true, dmgS: 10, dmgL: 10, hit: 12, dmgBonus: 12, ele: "fire", onHitEleVuln: "fire", req: "royal,knight,elf,mage,warrior", p: 10000, gachaWeight: 0, d: "【遺物】灼熱蜥蜴吐出的長舌鍛成的矛，舔舐之處灼痕遍佈。" },
        "relic_flame_avatar":       { n: "火焰化身的外皮",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 10, wearerEle: "fire", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】火焰化身剝落的外皮，披上者的軀體化為烈焰之姿。" },
        "relic_killerbee_sting":    { n: "殺人蜂的尾刺",       type: "wpn", relic: true, noEnhance: true, dmgS: 7, dmgL: 7, hit: 9, dmgBonus: 9, hasteStrike: true, req: "royal,knight,elf,mage,dark", p: 10000, gachaWeight: 0, d: "【遺物】殺人蜂的致命尾刺，唯有疾風般的身法方能發揮其真髓。" },
        "relic_runaway_carrot":     { n: "暴走兔最愛的胡蘿蔔", type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, skillDmgMult: { "sk_ice_spike": 1.5 }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】暴走兔珍藏的胡蘿蔔，咬一口便寒氣大盛。" },
        "relic_frost_avatar":       { n: "寒冷化身的堅軀",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 10, wearerEle: "water", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】寒冷化身凝結的堅軀，披上者的軀體化為寒冰之姿。" },
        "relic_handy_quiver":       { n: "改造便利箭筒",       type: "wpn", isArrow: true, noConsume: true, relic: true, noEnhance: true, dmgS: 10, dmgL: 10, req: "royal,knight,elf,mage,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】改裝過的便利箭筒，箭矢取之不盡、用之不竭。" },
        "relic_soldier_medal":      { n: "士兵的榮譽勳章",     type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, mhp: 150, resFire: 5, resWater: 5, resEarth: 5, resWind: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】士兵用生命換來的榮譽勳章，佩於臂間護體驅邪。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_evilchest_relic":    { n: "邪惡寶箱內的遺物",   type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, str: -1, dex: -1, int: -1, wis: -1, con: -1, cha: -1, mpR: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】邪惡寶箱最深處的遺物，汲取佩戴者的生命力回饋為魔力。" },
        "relic_ancient_spider_claw":{ n: "上古蜘蛛之爪",       type: "wpn", relic: true, noEnhance: true, dmgS: 16, dmgL: 10, hit: 15, dmgBonus: 14, raceFlat: { race: "動物", add: 10 }, req: "knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】上古巨蜘蛛蛻下的尖爪，磨作單手劍鋒利無匹。" },
        "relic_flame_belt":         { n: "火焰環繞的腰帶",     type: "acc", slot: "belt", relic: true, noEnhance: true, ac: 0, resFire: 20, resWater: -10, thorns: 30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】火焰環繞不息的腰帶，膽敢近身者反遭烈焰灼身。" },
        "relic_thunder_crown":      { n: "雷光加護的頭飾",     type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 6, resWind: 10, mpR: 3, extraMp: 5, req: "royal,mage,elf,illusion", p: 10000, gachaWeight: 0, d: "【遺物】受雷光加護的頭飾，戴上者思緒如電、靈識通明。" },
        "relic_guardian_greatsword":{ n: "鎧甲守衛的笨重巨劍", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 40, dmgL: 40, hit: 3, dmgBonus: 3, eff: "cleave", str: 3, atkSpdPct: -50, heavyMult: 1.5, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】鎧甲守衛揮舞的笨重巨劍，一擊千鈞卻遲緩無比。" },
        "relic_dream_flamesoul":    { n: "幻夢的火炎靈魂",     type: "wpn", qigu: true, relic: true, noEnhance: true, dmgS: 24, dmgL: 24, hit: 0, int: 2, extraMp: 23, procSkill: "sk_fireball", procRateBase: 4, procRatePerEn: 0, req: "illusion", p: 10000, gachaWeight: 0, d: "【遺物】幻夢中的火炎靈魂，化作幻術士的奇古獸。一般攻擊化為必中的魔法傷害（受魔抗減免）。" },
        "relic_frost_stone_shield": { n: "剝落的厚重冰石",     type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 12, mr: 10, req: "royal,knight", p: 10000, gachaWeight: 0, d: "【遺物】從冰石高崙剝落的厚重冰石，堅硬如盾、寒氣護身。" },
        "relic_redscorpion_ring":   { n: "紅蠍尾環戒",         type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, dex: 1, wis: 2, mhp: -30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】以紅蠍尾節製成的環戒，敏銳靈動卻略損元氣。" },
        "relic_cerberus_horn":      { n: "詛咒三頭獸的犄角",   type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 0, immStone: true, immPoison: true, immBurn: true, immParalyze: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】詛咒三頭獸的犄角，佩戴者百邪不侵。" },
        "relic_lightbeam_wand":     { n: "光束強化魔杖",       type: "wpn", isWand: true, relic: true, noEnhance: true, dmgS: 3, dmgL: 3, hit: 9, dmgBonus: 9, mdmg: 2, skillDmgMult: { "sk_lightarrow": 1.5, "sk_disintegrate": 1.5 }, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】強化光束的魔杖，杖尖迸發的每道光箭都威力倍增。" },
        // ===== 🐍 蛇神降臨·提卡爾 庫庫爾坎傳說裝備（庫庫爾坎寶箱開出·legend） =====
        "wpn_kukulkan_spear":    { n: "提卡爾庫庫爾坎之矛", legend: true, type: "wpn", w2h: true, noBleed: true, dmgS: 24, dmgL: 20, hit: 5, dmgBonus: 0, eff: "pierce", pierceChance: 90, ignHardSkin: true, strawCurse: { rate: 4, stacks: 3 }, dex: 2, mr: 5, req: "royal,knight,warrior", safe: 6, p: 235000, gachaWeight: 1, d: "庫庫爾坎神廟守衛執掌的巨矛，槍尖纏繞羽蛇神的詛咒。" },
        "wpn_kukulkan_gauntlet": { n: "提卡爾庫庫爾坎鐵手甲", legend: true, type: "wpn", isBow: true, ranged: true, animFam: "gauntlet", rapidfire: 100, dmgS: 3, dmgL: 3, hit: 0, dmgBonus: 4, strawCurse: { rate: 4, stacks: 3 }, dex: 1, mhp: 30, req: "dark,dragon", safe: 6, p: 235000, gachaWeight: 1, d: "以庫庫爾坎鱗片鍛成的鐵手甲，揮拳如連珠箭雨傾瀉（需裝備箭矢）。" },
        "shd_kukulkan":          { n: "提卡爾庫庫爾坎之盾", legend: true, type: "arm", slot: "shield", ac: 3, dr: 2, hitstunReduce: 2, req: "royal,knight,elf", safe: 6, p: 100000, gachaWeight: 1, d: "刻著羽蛇神圖騰的重盾，卸去衝擊如流水般順暢。" },
        "hlm_kukulkan":          { n: "提卡爾庫庫爾坎面具", legend: true, type: "arm", slot: "helm", ac: 3, mr: 5, mpR: 2, req: "all", safe: 4, p: 100000, gachaWeight: 1, d: "庫庫爾坎祭司的黃金羽蛇面具，佩戴者思緒澄澈。" },
        // ===== 🐍 蛇神降臨·提卡爾 遺物（18 件·單一怪物專屬掉落 0.0001%） =====
        "relic_azt_mirror":     { n: "阿茲特的反光石",       type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, resNone: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】艾庫阿茲特體內折射光線的反光石，扭曲無形的法術。" },
        "relic_azt_prism":      { n: "阿茲特的折射寶石",     type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, resFire: 5, resWater: 5, resEarth: 5, resWind: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】艾庫阿茲特凝結的折射寶石，分解四方元素之力。" },
        "relic_yuka_blowdart":  { n: "艾庫尤卡的吹箭",       type: "wpn", isBow: true, ranged: true, relic: true, noEnhance: true, ignHardSkin: true, rapidfire: 30, atkSpdPct: 30, dmgS: 2, dmgL: 2, hit: 12, dmgBonus: 9, req: "elf,mage,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】艾庫尤卡的毒吹箭，快若疾風、連發如雨（需裝備箭矢）。" },
        "relic_yuka_quiver":    { n: "艾庫尤卡的永續箭筒",   type: "wpn", isArrow: true, noConsume: true, relic: true, noEnhance: true, dmgS: 15, dmgL: 7, req: "royal,knight,elf,mage,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】艾庫尤卡取之不盡的永續箭筒。" },
        "relic_kaira_fang":     { n: "艾庫卡伊拉的毒牙",     type: "wpn", relic: true, noEnhance: true, dmgS: 9, dmgL: 9, hit: 13, dmgBonus: 8, procPoison: { rate: 3, dmg: [10, 1], dur: 10, tick: 1 }, poisonedBonusDmg: 15, req: "royal,elf,mage,knight,dark", p: 10000, gachaWeight: 0, d: "【遺物】艾庫卡伊拉的滴毒獠牙，撕咬之處毒咒纏身。" },
        "relic_kaira_hood":     { n: "艾庫卡伊拉的華麗兜帽", type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 7, dr: 5, aggroWeight: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】艾庫卡伊拉華麗的鱗紋兜帽，鮮豔奪目引敵注目。" },
        "relic_bara_wing":      { n: "沾滿鱗粉的飛翼",       type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 3, mr: 30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】艾庫巴拉沾滿鱗粉的薄翼，抖落的粉塵擾亂法術。" },
        "relic_bara_eye":       { n: "毒蛾的赤紅眼球",       type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 7, immPoison: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】艾庫巴拉赤紅的複眼，凝視劇毒亦無動於衷。" },
        "relic_eto_whip":       { n: "艾庫艾托的鞭笞藤",     type: "wpn", w2h: true, noBleed: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 17, dmgL: 17, hit: 12, dmgBonus: 12, eff: "pierce", pierceChance: 100, procStatusSkill: { skId: "sk_relic_slow", rate: 5 }, slowedBonusDmg: 10, req: "knight,elf,warrior", p: 10000, gachaWeight: 0, d: "【遺物】艾庫艾托的鞭笞藤蔓，抽擊纏繞使敵遲滯。" },
        "relic_eto_wand":       { n: "艾庫艾托的枯竭魔杖",   type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 9, dmgL: 9, hit: 9, dmgBonus: 9, eff: "magicburst", autoCastMpMult: 2, autoCastDmgMult: 1.5, mdmg: 5, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】艾庫艾托枯竭的魔杖，榨乾魔力換取毀滅之威。" },
        "relic_mud_idol":       { n: "特產易碎泥偶",         type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 20, dmgL: 20, hit: 13, dmgBonus: 11, eff: "crush", selfBreakProc: { dur: 5 }, req: "royal,knight,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】提卡爾特產的易碎泥偶，猛擊爆裂卻反噬自身。" },
        "relic_mud_jar":        { n: "祭祀儀式陶罐",         type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 8, physDrGated: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】提卡爾祭祀用的厚重陶罐，卸去衝擊護住頭首。" },
        "relic_ska_soul":       { n: "阿茲特獻祭亡靈",       type: "wpn", qigu: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 26, dmgL: 26, hit: 0, int: 3, con: -3, mpR: 10, extraMp: 13, procInstakill: { p: 0.01, tag: null, healPct: 0.05 }, req: "illusion", p: 10000, gachaWeight: 0, d: "【遺物】阿茲特獻祭的亡靈化作幻術士的奇古獸。一般攻擊化為必中的魔法傷害（受魔抗減免）。" },
        "relic_ska_armguard":   { n: "薩德司卡石護臂",       type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 6, mhp: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】薩德司卡剝落的石護臂，堅厚護體。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_teo_hammer":     { n: "薩德提歐的玩具鎚",     type: "wpn", relic: true, noEnhance: true, dmgS: 13, dmgL: 12, hit: 11, dmgBonus: 13, ele: "wind", req: "royal,knight,elf,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】薩德提歐揮舞的笨重玩具鎚，掄起帶起狂風。" },
        "relic_teo_footprint":  { n: "薩德提歐的笨重足跡",   type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 6, req: "royal,knight,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】薩德提歐踏出的笨重足跡凝成的脛甲，沉穩厚實。" },
        "relic_serpent_fang":   { n: "蛇神的倒勾獠牙",       type: "wpn", w2h: true, noBleed: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 24, dmgL: 20, hit: 28, dmgBonus: 13, eff: "pierce", pierceChance: 90, strawCurse: { rate: 8, stacks: 3 }, dex: 2, mr: 5, req: "knight,elf,warrior", p: 10000, gachaWeight: 0, d: "【遺物】羽蛇神杰弗雷庫的倒勾獠牙，纏擊之間種下滅亡的詛咒。" },
        "relic_serpent_gaze":   { n: "蛇神的凝視",           type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, int: 1, con: 1, mmp: 50, lowMpRegenBonus: 30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】羽蛇神杰弗雷庫凝視的餘光，於力竭時湧現魔力。" },
        // ===== 🏺 遺物 第十三批（v3.1.80·28 件·單一怪物專屬掉落 0.0001%） =====
        "relic_executor_axe":      { n: "處刑人的護身斧",     type: "wpn", relic: true, noEnhance: true, dmgS: 13, dmgL: 13, hit: 14, dmgBonus: 14, procHealFlat: { rate: 3, hp: 10 }, req: "warrior", p: 10000, gachaWeight: 0, d: "【遺物】處刑人隨身護命的短柄斧，飲血亦能療傷。" },
        "relic_executor_skewer":   { n: "處刑者的串刺刑具",   type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 21, dmgL: 21, hit: 19, dmgBonus: 14, eff: "pierce", pierceChance: 100, unBonus: true, mhp: 80, req: "royal,knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】處刑者用以貫穿死囚的長刺，怨魂纏繞不散。" },
        "relic_jack_sling":        { n: "傑克的彈弓",         type: "wpn", isBow: true, ranged: true, relic: true, noEnhance: true, ignHardSkin: true, rapidfire: 80, giantBonus: true, atkSpdPct: 20, dmgS: 2, dmgL: 2, hit: 12, dmgBonus: 16, req: "elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】傑克攀上魔豆藤時帶著的彈弓，傳說他曾用它擊退追來的巨人（需裝備箭矢）。" },
        "relic_endless_nightmare": { n: "永不終止的夢魘",     type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 5, dotCrit: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】夢魘蛻下的皮革手套，讓折磨綿延不絕。" },
        "relic_dullahan_ember":    { n: "無頭騎士的餘火",     type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 3, mr: 15, mpR: 3, dr: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】無頭騎士頭顱處搖曳的鬼火，凝成頭盔守護新主。" },
        "relic_guard_roughgloves": { n: "歷練的警衛粗布手套", type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 7, str: 1, meleeHit: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精警衛久經磨練的粗布手套，握槍沉穩有力。" },
        "relic_blacktiger_whip":   { n: "黑虎的雙尾鞭",       type: "wpn", w2h: true, chainsword: true, weakExpose: true, relic: true, noEnhance: true, dmgS: 23, dmgL: 23, hit: 17, dmgBonus: 14, eff: "pierce", pierceChance: 50, classicOk: true, dex: 2, ele: "water", req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】黑虎雙尾化成的鎖鏈長鞭，抽擊如浪濤翻湧。龍騎士專屬·鎖鏈劍（雙手・近距離）。" },
        "relic_hellhound_chain":   { n: "束縛犬的控制鎖鏈",   type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 2, mhp: -100, str: 2, dex: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】束縛地獄犬的控制鎖鏈，戴上者力量暴增卻元氣受損。" },
        "relic_gatekeeper_boots":  { n: "守門人的破舊履",     type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 10, dr: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】拉斯塔巴德守門人踏破的舊履，千年站崗磨出堅實。" },
        "relic_dark_manaball":     { n: "漆黑的瑪那水晶球",   type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 7, int: 2, mpR: 10, con: -2, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精法師的漆黑水晶球，魔力汩汩卻侵蝕肉身。" },
        "relic_blackmane_coat":    { n: "漆黑鬃毛長大衣",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 12, er: 5, dex: 1, req: "knight,elf,dark,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】魔狼漆黑鬃毛織成的長大衣，披上者步伐輕捷如狼。" },
        "relic_wearying_dream":    { n: "耗弱精神的惡夢",     type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, meleeDmg: 2, meleeHit: 3, wis: -2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】恐怖夢魘凝成的戒指，以精神換取致命的殺意。" },
        "relic_earthfang_core":    { n: "地之牙的殘核",       type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, mhp: 30, eleWpnMult: { ele: "earth", mult: 1.2 }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】地之牙碎裂後殘存的地脈之核。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_windfang_breeze":   { n: "風之牙的微風",       type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 1, er: 3, eleWpnMult: { ele: "wind", mult: 1.2 }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】風之牙消散後留下的一縷微風。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_waterfang_tear":    { n: "水之牙的淚滴",       type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, mpR: 2, eleWpnMult: { ele: "water", mult: 1.2 }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】水之牙凝結的清澈淚滴。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_firefang_ember":    { n: "火之牙的餘燼",       type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 3, eleWpnMult: { ele: "fire", mult: 1.2 }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】火之牙熄滅後仍溫熱的餘燼。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_tamer_dogclub":     { n: "馴獸師的訓狗棒",     type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 5, dr: 3, petSkillDmgMult: 1.5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】馴獸師調教猛獸的短棒，號令之下獸性盡出。" },
        "relic_healer_wand":       { n: "治癒者的恢復魔棒",   type: "wpn", relic: true, noEnhance: true, dmgS: 8, dmgL: 8, hit: 11, dmgBonus: 11, mpR: 20, groupHealMult: 2, req: "mage,elf", p: 10000, gachaWeight: 0, d: "【遺物】巨大強化白螞蟻體液浸潤的魔棒，使體力回復術與生命的祝福恢復量×2。" },
        "relic_succubus_temptation":{ n: "魅魔女皇的誘惑",    type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 7, dmgReflect: 10, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】思克巴女皇的魅惑之衣，使攻擊者反受其害。" },
        "relic_shadow_stinger":    { n: "來自陰影的刺劍",     type: "wpn", relic: true, noEnhance: true, dmgS: 9, dmgL: 9, hit: 16, dmgBonus: 11, procInstakill: { p: 1, tag: null, hpBelow: 0.10 }, req: "royal,knight,mage,elf,dark", p: 10000, gachaWeight: 0, d: "【遺物】影魔自陰影中遞出的刺劍，專取殘喘者性命。" },
        "relic_weathered_obelisk": { n: "風化的巨型方尖碑",   type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 26, dmgL: 26, hit: 12, dmgBonus: 16, eff: "crush", heavyRatePct: 10, ele: "wind", req: "royal,knight,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】尖碑石奴背負的風化方尖碑，掄起挾帶千年風沙。" },
        "relic_soulreaper_dual":   { n: "奪魂者雙刃劍",       type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 18, dmgL: 14, hit: 18, dmgBonus: 17, eff: "combo", comboRate: 30, onHitCastSkill: { skId: "sk_cold_shiver", cdSec: 5 }, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】魂騎士的奪魂雙刃，斬擊間滲出徹骨寒意。" },
        "relic_griffin_feather":   { n: "格利芬的輕柔羽翼",   type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 9, dex: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】格利芬輕柔的羽翼織成的披風，身形隨風輕盈。" },
        "relic_minotaur_flail":    { n: "牛頭人的流星鎚",     type: "wpn", relic: true, noEnhance: true, dmgS: 9, dmgL: 10, hit: 15, dmgBonus: 15, procStatusSkill: { skId: "sk_relic_stun", rate: 2 }, req: "royal,knight,elf,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】鏈鎚牛人掄轉的流星鎚，砸中要害令人天旋地轉。" },
        "relic_vigor_belt":        { n: "精氣流動的腰帶",     type: "acc", slot: "belt", relic: true, noEnhance: true, ac: 0, weightCap: 100, hpR: 5, mpR: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】哈維精氣流轉的腰帶，繫上者氣血生生不息。" },
        "relic_succubus_wand":     { n: "思克巴女皇的熱情魔杖", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 9, dmgL: 9, hit: 8, dmgBonus: 8, eff: "magicburst", ele: "fire", procFireSkillRate: 10, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】炎魔思克巴女皇的熱情魔杖，狂熱的火焰隨杖尖迸發。" },
        "relic_wisp_thought":      { n: "幽光的思念",         type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, mr: 15, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】鬼魂殘存的思念凝成的幽光戒指，護持心神不受侵擾。" },
        "relic_warlock_grimoire":  { n: "巫師的黑暗魔導書",   type: "wpn", isWand: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 3, dmgL: 3, hit: 7, dmgBonus: 7, mdmg: 3, extraMp: 5, fullHpMpHalf: true, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】巫師畢生鑽研的黑暗魔導書，滿溢的生命力使咒文事半功倍。" },
        // ===== 🐾 v3.2.17 夥伴更新遺物（第十四批·12 件·新捕捉動物 0.0001% 掉落）=====
        "relic_tiger_fur":       { n: "虎男的斑紋毛皮",   type: "arm", slot: "cloak",  relic: true, noEnhance: true, ac: 3, resWater: 5, aggroWeight: -1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】猛虎火焰般的斑紋毛皮，披上便隱入草叢的錯覺。" },
        "relic_cat_paw":         { n: "柔軟的肉球",       type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 0, dr: 6, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】觸感無上柔軟的貓咪肉球手套，卸去千鈞之力。" },
        "relic_panda_eyes":      { n: "熊貓的黑眼圈",     type: "arm", slot: "helm",   relic: true, noEnhance: true, ac: 4, dr: 3, mr: 8, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】戴上便睡意朦朧的黑眼圈頭飾，以慵懶化解攻勢。" },
        // ===== 🏺 遺物 第十四批（v3.3.0）：與歐林的定情之戒 ~ 熔岩灼燒的雙拳（單一怪物 0.0001% 掉落·MOB_DROPS/ITEM_WEIGHTS 於 js/01；WEAPON_TAGS 於 js/10） =====
        "relic_orin_ring":       { n: "與歐林的定情之戒", type: "acc", slot: "ring",   relic: true, noEnhance: true, ac: 1, mdmg: 1, extraMp: 5, mpR: 3, mmp: 30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】與歐林互許終身的定情之戒，指環間流轉著綿長不絕的魔力。" },
        "relic_tamer_feedbag":   { n: "馴獸師的飼料袋",   type: "acc", slot: "ring",   relic: true, noEnhance: true, ac: 0, allLures: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】馴獸師隨身的飼料袋，各種野獸聞香而至、俯首認主。裝備時視為持有全部誘捕狀態，卸下即消失。" },
        "relic_earth_barrier":   { n: "地元素屏障",       type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 4, mr: 10, resEarth: 20, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】地元素凝聚而成的護盾，厚土之力抵禦四方衝擊。" },
        "relic_water_barrier":   { n: "水元素屏障",       type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 1, con: 1, mr: 10, resWater: 20, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】水元素流轉而成的護盾，柔波之力承接一切鋒芒。" },
        "relic_fire_barrier":    { n: "火元素屏障",       type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 1, str: 1, mr: 10, resFire: 20, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】火元素燃燒而成的護盾，烈焰之力灼退進犯之敵。" },
        "relic_wind_barrier":    { n: "風元素屏障",       type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 1, dex: 1, mr: 10, resWind: 20, req: "royal,knight,elf,mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】風元素環繞而成的護盾，疾風之力卸去來襲之勢。" },
        "relic_ghoul_fang":      { n: "兇殘惡鬼的毒牙",   type: "wpn", relic: true, noEnhance: true, dmgS: 9, dmgL: 11, hit: 15, dmgBonus: 15, ele: "earth", eleBonusDmg: { ele: "wind", add: 10 }, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】殘暴食屍鬼口中兇殘的毒牙，咬痕間纏繞著克制疾風的地脈之力。" },
        "relic_sparto_shard":    { n: "殘暴骸骨的破片",   type: "wpn", relic: true, noEnhance: true, dmgS: 4, dmgL: 5, hit: 14, dmgBonus: 13, unBonus: true, req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】殘暴史巴托碎裂的骸骨破片，殘存著獵殺不死生物與狼人的執念。" },
        "relic_corpse_needle":   { n: "屍毒之針",         type: "wpn", isBow: true, ranged: true, oneHand: true, rapidfire: 65, relic: true, noEnhance: true, dmgS: 3, dmgL: 2, hit: 16, dmgBonus: 15, procStatusSkill: { skId: "sk_relic_paralyze", rate: 3 }, immParalyzeBonusDmg: 5, req: "knight,elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】淬滿屍毒的細針，可單手持握、連射如雨，麻痺獵物後仍能刺穿其頑強的抵抗（需裝備箭矢）。" },
        "relic_morph_blade":     { n: "不定形的變幻劍",   type: "wpn", w2h: true, chainsword: true, weakExpose: true, relic: true, noEnhance: true, dmgS: 21, dmgL: 17, hit: 17, dmgBonus: 15, str: 1, counterAllEle: true, req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】不斷變幻形貌的鎖鏈劍，能隨敵人的力量改變姿態，反制地、水、火、風四大屬性。" },
        "relic_croc_leather":    { n: "巨大鱷魚的皮革盔甲", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 15, weightCap: 250, dr: 5, mhp: 50, req: "elf,dark,dragon,illusion", p: 10000, gachaWeight: 0, d: "【遺物】巨大鱷魚厚實皮革縫製的盔甲，堅韌耐重，足以卸去迎面而來的鋒芒。" },
        "relic_kasta_hump":      { n: "妖鬼王的畸形背瘤", type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 12, hpR: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】卡司特王背上腫脹的畸形背瘤，搏動之間源源不絕地湧出生機。" },
        "relic_pirate_dual":     { n: "傳說海賊的迷幻雙刀", type: "wpn", w2h: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 15, dmgL: 10, hit: 18, dmgBonus: 16, eff: "combo", comboRate: 30, ele: "water", dex: 3, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】傳說海賊珍藏的迷幻雙刀，刃光如潮，交錯之間翻湧著深海的幻影。" },
        "relic_lava_fists":      { n: "熔岩灼燒的雙拳",   type: "wpn", relic: true, noEnhance: true, ignHardSkin: true, dmgS: 15, dmgL: 15, hit: 12, dmgBonus: 13, unBonus: true, ele: "fire", procBurn: { dmg: 20, dur: 6 }, req: "warrior", p: 10000, gachaWeight: 0, d: "【遺物】熔岩高崙熔鑄的雙拳，一擊裂地，灼熱拳痕會在敵人身上持續燃燒。" },
        "relic_pup_fang":        { n: "幼犬的稚嫩犬齒",   type: "acc", slot: "ear",    relic: true, noEnhance: true, ac: 1, meleeDmg: 1, rangedDmg: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】高麗幼犬換牙時掉落的小小犬齒，蘊含初生之銳。" },
        "relic_raccoon_leaf":    { n: "浣熊的變身葉",     type: "arm", slot: "helm",   relic: true, noEnhance: true, ac: 2, polyAtkSpdPct: 20, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】浣熊變身戲法用的神奇樹葉，頂在頭上就能幻化萬千。" },
        "relic_stbernard_barrel":{ n: "聖伯納的急救酒桶", type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, lowHpPotionX2: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】聖伯納犬掛在頸間的救難小酒桶，危急時刻滴滴救命。" },
        "relic_fox_scarf":       { n: "貴重狐毛圍巾",     type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, mr: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】以整條狐尾織成的華貴圍巾，軟毛間流轉抗魔的靈氣。" },
        "relic_rabbit_foot":     { n: "幸運暴走兔腳",     type: "acc", slot: "ear",    relic: true, noEnhance: true, ac: 0, relicDropX2: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】傳說中招來厄運之外一切好運的兔腳護符。" },
        "relic_beagle_nose":     { n: "小獵犬的追蹤鼻",   type: "acc", slot: "ear",    relic: true, noEnhance: true, ac: 0, trackBoost: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】小獵犬引以為傲的靈敏鼻子做成的護符，氣味無所遁形。" },
        "relic_collie_fur":      { n: "柯利的柔毛",       type: "arm", slot: "shin",   relic: true, noEnhance: true, ac: 1, mr: 5, dr: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】柯利牧羊犬蓬鬆柔毛織成的護脛，溫暖而堅韌。" },
        "relic_kangaroo_gloves": { n: "袋鼠的拳擊套",     type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 4, meleeDmg: 2, meleeHit: 4, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】袋鼠拳王的專用拳擊套，出拳快狠準。" },
        "relic_monkey_staff":    { n: "猴子的金箍棒",     type: "wpn", relic: true, noEnhance: true, eff: "crush", ignHardSkin: true, dmgS: 6, dmgL: 3, hit: 6, dmgBonus: 6, lvDmgDiv: 5, lvHitDiv: 5, req: "royal,knight,elf,mage,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】猴王隨心變化的如意金箍棒。單手鈍器。" },
        // ===== 🏺 遺物 第十五批：元素精靈王與職業特化遺物（單一怪物 0.0001% 掉落） =====
        "relic_magic_resist_shirt": { n: "魔力阻抗襯衫", type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 0, mrPerWis: 1, relicRole: "精神越高，魔法防禦越強", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】以紅鬼魂殘留的靈質織成，布面會隨穿戴者的精神波動泛起幽光。" },
        "relic_fireking_blast": { n: "火精靈王的爆焰", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 17, dmgL: 21, hit: 15, dmgBonus: 18, eff: "cleave", ele: "fire", hitEchoMagic: { rate: 10, ele: "fire" }, relicRole: "兼具切割攻速與命中爆破的近戰爆發武器", req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】劍身封存著火精靈王未熄的核心，每次揮斬都會拖曳灼熱的爆燃火痕。" },
        "relic_waterking_caress": { n: "水精靈王的撫摸", type: "wpn", relic: true, noEnhance: true, ignHardSkin: true, dmgS: 17, dmgL: 13, hit: 15, dmgBonus: 15, eff: "combo", comboRate: 35, ele: "water", missGrazeRate: 30, relicRole: "以雙擊、貫穿與擦傷補正穩定近戰輸出", req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】冷冽水流纏繞爪刃，即使攻勢落空，也可能被迴旋的水勢牽回敵身。" },
        "relic_windking_roar": { n: "風精靈王的狂嘯", type: "wpn", isWand: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 3, dmgL: 3, hit: 15, dmgBonus: 15, ele: "wind", windSpellProcRate: 15, relicRole: "強化風屬性主動法術的連鎖爆發", req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】風精靈王不息的狂嘯被封入杖心，施法時仍能聽見風暴在其中翻湧。" },
        "relic_earthking_resist": { n: "地精靈王的抗拒", type: "wpn", isBow: true, ranged: true, w2h: true, rapidfire: 65, relic: true, noEnhance: true, dmgS: 3, dmgL: 3, hit: 15, dmgBonus: 18, ele: "earth", hurtRapidfire: true, relicRole: "兼具主動連射與受擊反制的遠距離武器", req: "elf,illusion", p: 10000, gachaWeight: 0, d: "【遺物】弓身承載地精靈王拒絕屈服的意志，越是遭受壓迫，反擊便越發猛烈。" },
        "relic_pure_maiden_love": { n: "純潔少女的憐愛", type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, dex: 2, int: 2, mpR: 3, relicRole: "女妖精專屬的敏捷、智力與魔力恢復項鍊", req: "elf", reqAvatar: "女妖精", strictAvatar: true, p: 10000, gachaWeight: 0, d: "【遺物】獨角獸回應純潔少女的憐愛所留下的項鍊，唯有同樣純淨的靈魂能得到它的祝福。" },
        "relic_rockmage_secret": { n: "破岩法師的秘術", type: "wpn", isWand: true, relic: true, noEnhance: true, ignHardSkin: true, dmgS: 3, dmgL: 3, hit: 15, dmgBonus: 15, extraMp: 15, ele: "earth", procSkill: "sk_hell_fang", procRateBase: 100, procRatePerEn: 0, relicRole: "以每次攻擊必定施法，補強魔法型普攻輸出", req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】破岩法師將撼動大地的秘術封入杖中，每次揮動都會喚醒地底尖牙。" },
        "relic_general_swordguard": { n: "將軍愛用的握劍護腕", type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 6, swordStr: 3, relicRole: "主手持單手劍或雙手劍時，進一步強化力量", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】黑暗妖精將軍久經戰陣的護腕，磨損的握帶仍殘留著不容退讓的劍勢。" },
        // ===== 🏺 遺物 第十六批（單一怪物 0.0001% 掉落·MOB_DROPS/ITEM_WEIGHTS 於 js/01；WEAPON_TAGS 於 js/10；新機制掛點見 js/02/03/04/06/07/22） =====
        "relic_tamer_petarm":    { n: "馴獸師手做寵物專用盔甲", type: "arm", slot: "petarm", relic: true, noEnhance: true, petAc: 5, petDmgReduce: 0.2, relicRole: "寵物專用生存護甲，兼具防禦與20%傷害減免", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】馴獸師依照愛寵的身形一針一線縫製，內襯至今仍留著主人掌心的溫度。寵物專用，無法強化。" },
        "relic_slave_shirt":     { n: "奴隸粗布衫",         type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 9, dr: 5, relicRole: "以高防禦與固定減傷承受正面攻擊", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】粗布浸透地獄奴隸的血汗，在無盡苦役中磨出了難以撕裂的堅韌。" },
        "relic_cerberus_pin":    { n: "地獄犬三頭釵",       type: "wpn", relic: true, noEnhance: true, dmgS: 20, dmgL: 18, hit: 13, dmgBonus: 16, eff: "combo", comboRate: 35, ele: "fire", atkSpdPct: 33, relicRole: "高攻速火屬性鋼爪，兼具35%雙擊與貫穿", req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】地獄犬的三顆頭顱化為獠牙鋼釵，揮舞時彷彿仍有三道咆哮同時撲向獵物。" },
        "relic_troll_regen_ring":{ n: "巨魔的再生戒指",     type: "acc", slot: "ring",   relic: true, noEnhance: true, ac: 0, mhp: 50, hpR: 20, relicRole: "提高最大HP與HP自然恢復量", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】戒面如活物般緩慢搏動，封存著巨魔即使重創也能再度站起的生命力。" },   // 🔧 v3.4.69 改能力（替換原 hpRegenFaster）：AC-0、HP+50(mhp)、HP自然恢復量+20(hpR)
        "relic_flamemage_robe":  { n: "烈焰巫師的正式長袍", type: "arm", slot: "armor",  relic: true, noEnhance: true, ac: 11, resFire: 5, mdmg: 2, fireballBurst: true, relicRole: "強化火抗與魔法輸出，並將燃燒的火球升級", req: "mage,elf", p: 10000, gachaWeight: 0, d: "【遺物】只在烈焰儀式中穿著的正式長袍，衣襬繡紋會隨施法化作奔流火光。" },
        "relic_burden_gauntlet": { n: "負重的堅忍巨臂",     type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 8, weightCap: 150, con: 2, relicRole: "兼顧高防禦、體質與負重上限", req: "royal,knight,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】巨臂在重壓下仍維持緊握姿態，彷彿世上再沉重的負擔也不足以令其屈服。" },
        "relic_imp_fang":        { n: "仿製小惡魔尖牙套",   type: "acc", slot: "petwpn", relic: true, noEnhance: true, petDmg: 3, petHit: 9, petBleed: true, relicRole: "寵物專用輸出武器，提升傷害、命中並附加出血", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】仿照小惡魔獠牙打造的尖牙套，細小刃口卻帶著令人難以止血的惡意。寵物專用，無法強化。" },
        "relic_iron_stone_shield":{ n: "笨重的鋼鐵石盾",    type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 0, dr: 30, mhp: 150, noEvade: true, relicRole: "犧牲一般迴避，換取大量HP與固定減傷", req: "royal,knight", p: 10000, gachaWeight: 0, d: "【遺物】以整塊鋼鐵與岩心鑄成，持盾者無法輕易挪步，卻也幾乎不會被正面撼動。" },
        "relic_mana_spring_boots":{ n: "魔力泉源長靴",      type: "arm", slot: "boots",  relic: true, noEnhance: true, ac: 6, mpR: 7, mmp: 100, relicRole: "提高MP上限與自然恢復，適合長時間施法", req: "mage,elf,illusion", p: 10000, gachaWeight: 0, d: "【遺物】靴底封存著不竭的魔力泉源，每一步都會帶起細微而清澈的魔力漣漪。" },
        "relic_dark_metal_club": { n: "暗黑的金屬棍棒",     type: "wpn", relic: true, noEnhance: true, dmgS: 6, dmgL: 8, hit: 18, dmgBonus: 15, eleBonusDmg: { ele: "none", add: 10 }, relicRole: "高命中、貫穿的無屬性敵人專攻鈍器", req: "royal,knight,mage,elf,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】暗黑金屬不反射任何光芒，沉重棍身專為粉碎缺乏元素庇護的軀殼而鑄。" },
        "relic_summon_cloth":    { n: "召喚儀式的魔術布",   type: "arm", slot: "shin",   relic: true, noEnhance: true, ac: 3, wis: 1, summonCtrl: true, relicRole: "法師召喚控制用脛甲，兼具精神加成", req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】布面描繪著層層召喚契約，纏上雙脛後，異界眷屬的低語便清晰可辨。" },
        "relic_ant_pincer":      { n: "斷裂的昆蟲巨鉗",     type: "wpn", relic: true, noEnhance: true, dmgS: 16, dmgL: 10, hit: 20, dmgBonus: 15, mcrit: 5, relicRole: "高命中單手劍，兼具近距離爆擊、反擊與居合", req: "knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】巨大守護螞蟻的巨鉗在斷裂後依然銳利，開闔間仍殘留截斷獵物的本能。" },
        "relic_ocean_orb":       { n: "魔力塑造的海洋水晶球", type: "wpn", isWand: true, relic: true, noEnhance: true, eff: "magicstrike", dmgS: 15, dmgL: 15, hit: 20, dmgBonus: 17, str: 3, mdmg: 3, ele: "water", mpOnHit: true, onHitWet: true, relicRole: "水屬性魔戰武器，以潮濕放大下一次風屬性傷害", req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】水晶球中封存著一片不眠之海，潮汐會追隨持有者的攻勢漫過敵身。" },
        "relic_ash_fist":        { n: "燃燒殆盡的灰燼之拳", type: "wpn", relic: true, noEnhance: true, dmgS: 4, dmgL: 4, hit: 16, dmgBonus: 14, ele: "fire", atkSpdPct: 30, relicRole: "高攻速火屬性鈍器，適合穩定快速輸出", req: "royal,knight,mage,elf,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】火焰雖已熄滅，灰燼深處仍藏著灼人的餘溫，每次揮擊都會重新迸出火星。" },
        "relic_reaper_scythe":   { n: "死神的鐮刀破片",     type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "cleave", ignHardSkin: true, dmgS: 21, dmgL: 30, hit: 18, dmgBonus: 14, mcritDmg: 30, relicRole: "貫穿型雙手劍，強化對大型目標與近距離爆擊傷害", req: "knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】碎片仍殘留死神收割生命的軌跡，重新鍛成劍刃後，鋒芒依舊令人窒息。" },
        "relic_djinn_promise":   { n: "巨靈的承諾",         type: "acc", slot: "ear",    relic: true, noEnhance: true, ac: 3, autoReviveScroll: true, relicRole: "消耗復活卷軸，自動救回死亡的傭兵與寵物", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】耳環承載著巨靈親口許下的守護誓言，微光會在同伴倒下時驟然燃起。" },
        "relic_mini_darkelf":    { n: "被差遣的迷你闇精靈", type: "wpn", qigu: true, relic: true, noEnhance: true, dmgS: 25, dmgL: 25, hit: 0, int: 1, mdmg: 1, extraMp: 11, procSkill: "sk_darkwave", procRateBase: 8, procRatePerEn: 0, relicRole: "幻術士專用必中魔法型奇古獸，並機率觸發闇黑波動", req: "illusion", p: 10000, gachaWeight: 0, d: "【遺物】被闇精靈王差遣而來的微小侍從，身形雖小，掌中的黑暗魔力卻絲毫未減。" },
        "relic_avenger_crossbow":{ n: "復仇者的十字弩弓",   type: "wpn", isBow: true, ranged: true, w2h: true, rapidfire: 75, relic: true, noEnhance: true, ignHardSkin: true, rapidMax: true, dmgS: 3, dmgL: 2, hit: 20, dmgBonus: 17, relicRole: "高機率貫穿連射，發動時固定射出最大額外箭數", req: "elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】弩臂刻滿黑暗復仇者的誓言，一旦扣下扳機，積蓄的恨意便會化作箭雨傾瀉。" },
        // ===== 🏺 遺物 第十七批（單一怪物 0.0001% 掉落·MOB_DROPS/ITEM_WEIGHTS 於 js/01；WEAPON_TAGS 於 js/10；新機制掛點見 js/02/03/04/06） =====
        "relic_heavy_belt":      { n: "重戰士的鏈鎖腰帶",   type: "acc", slot: "belt",   relic: true, noEnhance: true, ac: 4, con: 1, relicRole: "泛用型體質與防禦腰帶", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】每一節鎖鏈都曾承受戰士的重量，扣緊腰帶時，身軀也會如鐵壁般穩固。" },
        "relic_bone_bow":        { n: "殘暴的骸骨意志之弓", type: "wpn", isBow: true, ranged: true, w2h: true, rapidfire: 80, relic: true, noEnhance: true, bonespike: true, dmgS: 3, dmgL: 3, hit: 16, dmgBonus: 13, relicRole: "以連射累積骨刺，再由一般攻擊一次引爆", req: "elf,illusion", p: 10000, gachaWeight: 0, d: "【遺物】殘暴骸骨的不甘被扭成弓身，射出的每一箭都像碎骨般鑽入獵物體內。" },
        "relic_fighter_armor":   { n: "鬥士的決戰服裝",     type: "arm", slot: "armor",  relic: true, noEnhance: true, ac: 8, er: 5, mcrit: 3, critDmgLowHp: { hp: 1000, add: 20 }, relicRole: "低血量時強化近距離爆擊的決戰型防具", req: "royal,knight,elf,dark,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】這套戰裝只為無路可退的決戰而披，染血越深，穿戴者的殺意便越發銳利。" },
        "relic_drake_pawprint":  { n: "幼龍的爪印",         type: "arm", slot: "boots",  relic: true, noEnhance: true, ac: 9, extraDmg: 3, extraMp: 3, mr: 5, relicRole: "同時強化物理與魔法輸出的泛用長靴", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】幼龍尚未展翼時留下的爪印化作長靴，步伐間蘊藏著逐漸甦醒的龍之力量。" },
        "relic_red_wraith":      { n: "滲透紅光的背後靈",   type: "arm", slot: "cloak",  relic: true, noEnhance: true, ac: 0, mr: 40, er: 10, relicRole: "以高額MR與ER兼顧魔法防禦及迴避", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】亡靈貼伏在穿戴者背後，幽紅微光會吞去逼近的魔力，並在危急時牽引身形閃避。" },
        "relic_mage_dagger":     { n: "法師的護身短刀",     type: "wpn", relic: true, noEnhance: true, dmgS: 2, dmgL: 3, hit: 8, dmgBonus: 6, castOnHurt: { rate: 20 }, relicRole: "法師專用受擊反擊武器，20%免費施放設定的自動攻擊傷害法術", req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】短刀並非為決鬥而造；當持有者受創，刃上的護身術式便會自行喚醒反擊魔法。" },
        // 🌑 v3.4.67 解除詛咒的真死亡騎士．冥皇執行劍（遺物·冥皇丹特斯 0.0001% 掉落）：反擊+居合＝WEAPON_TAGS 雙標籤（js/10）·貫穿=ignHardSkin·裝備變身 真死亡騎士 冥皇丹特斯（js/02 _setPoly·APM 依武器查表）·攻擊 15% 觸發大地崩裂（procSkill·遺物 en=0→固定 15%）·對地/風屬性敵一般攻擊 ×1.4（counterEles·js/03/06）
        "wpn_uncursed_emperor_blade": { n: "解除詛咒的真死亡騎士．冥皇執行劍", type: "wpn", relic: true, noEnhance: true, dmgS: 19, dmgL: 22, hit: 19, dmgBonus: 15, ignHardSkin: true, procSkill: "sk_earth_collapse", procRateBase: 15, procRatePerEn: 0, counterEles: ["earth", "wind"], relicRole: "解咒的冥皇執行劍：反擊居合貫穿俱全，化身真死亡騎士並喚起大地崩裂", req: "royal,knight,elf,mage,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】詛咒褪去後，劍身浮現冥皇丹特斯的真銘。反擊（一般限定）、居合（一般限定）、貫穿；裝備時變身為 真死亡騎士 冥皇丹特斯；攻擊時15%機率觸發大地崩裂；一般攻擊對地、風屬性敵人傷害×1.4。" },
        // ===== 🌅 日出之國（依《日出之國.md》）：材料＋2 傳說＋體力戒指＋16 遺物 =====
        "mat_youkai_soul": { n: "封印的妖怪之魂", type: "etc", p: 1, noUse: true, gachaWeight: 0, c: "text-purple-300", d: "被陰陽師封印於符中的妖怪之魂，蘊含日出之國的妖異之力。希培利亞的巴特爾能以 100 個凝鍊出巨大骷髏的妖魂。" },
        "mat_gasha_soul": { n: "巨大骷髏的妖魂", type: "etc", eff: "expsoul", expGain: 1000000, batchUse: true, p: 1, gachaWeight: 0, c: "text-sky-300", d: "巨大骷髏的怨念凝鍊而成的妖魂結晶。使用後獲得 100 萬點經驗值（可批量使用）。" },
        "wpn_onmyoji_fan": { n: "陰陽師的扇子", type: "wpn", legend: true, isWand: true, dmgS: 2, dmgL: 2, hit: 4, dmgBonus: 4, ignHardSkin: true, mdmg: 4, mpR: 4, req: "mage,illusion", safe: 6, p: 385000, gachaWeight: 1, d: "陰陽師驅使式神的摺扇，輕搖之間便有妖力共鳴迴盪。" },
        "blt_gasha_ring": { n: "巨型骷髏之指環", type: "acc", slot: "belt", legend: true, ac: 0, mmp: 30, wis: 1, mr: 8, weightCap: 150, req: "all", safe: 0, p: 286000, gachaWeight: 1, d: "以巨大骷髏的指骨環繞而成的腰帶，冥界的重量對佩戴者輕若無物。" },
        "acc_ring_con": { n: "體力戒指", type: "acc", slot: "ring", ac: 0, mhp: 50, con: 1, req: "all", safe: 0, p: 76000, gachaWeight: 10, d: "灌注體力的戒指。" },
        "relic_sr_kettle_lid":   { n: "沸騰蒸氣的鍋蓋",     type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 10, resWater: 10, resFire: 10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】嗚釜沸騰不止的鍋蓋，蒸氣的熱與釜水的潤同時護持頭頂。" },
        "relic_sr_kama_pot":     { n: "鐮鼬的藥壺",         type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, potionBonus: 10, hpR: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】鎌鼬三兄弟中么弟隨身的藥壺，塗上傷口便能止痛癒合。" },
        "relic_sr_neck_scarf":   { n: "長首妖怪的圍巾",     type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 1, er: 10, dex: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】轆轤首纏繞長頸的圍巾，柔滑得讓攻擊都滑開了。" },
        "relic_sr_old_umbrella": { n: "老舊的百年唐傘",     type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 8, resWater: 30, resFire: -10, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】經百年而成妖的老唐傘，撐開便滴水不沾，卻也擋不住火星。" },
        "relic_sr_kettle_maul":  { n: "沸騰蒸氣的巨釜",     type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "crush", ignHardSkin: true, counterEles: ["earth", "fire"], dmgS: 22, dmgL: 24, hit: 14, dmgBonus: 14, req: "royal,knight,dragon,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】整座嗚釜妖釜倒提為鎚，沸騰的蒸氣隨揮擊噴散。" },
        "relic_sr_kama_blade":   { n: "鐮鼬的尾刃",         type: "wpn", relic: true, noEnhance: true, iaiCrit: true, mcritDmg: 10, dmgS: 16, dmgL: 10, hit: 18, dmgBonus: 18, req: "knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】鎌鼬長兄尾端的鐮刃，出鞘的瞬間便已割裂要害。" },
        "relic_sr_kappa_plate":  { n: "河童的尻子玉",       type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 3, resFire: 3, resWater: 3, resEarth: 3, resWind: 3, wis: -1, cha: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】河童珍藏的尻子玉，妖力溫潤護體，只是讓人有點心神渙散。" },
        "relic_sr_akaoni_pants": { n: "赤鬼的內褲",         type: "arm", slot: "shin", relic: true, noEnhance: true, ac: 2, str: 2, con: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】赤鬼的虎紋兜襠布，穿上便湧現蠻勇之力。" },
        "relic_sr_aooni_shirt":  { n: "青鬼的虎皮衫",       type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 12, str: 1, con: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】青鬼披掛的虎皮衫，粗獷厚實如鬼族的筋骨。" },
        "relic_sr_nue_tail":     { n: "毒鵺的黑尾",         type: "wpn", chainsword: true, relic: true, noEnhance: true, weakExpose: true, ignHardSkin: true, procPoisonPct: { pct: 50, dur: 6 }, atkSpdPct: 20, dmgS: 26, dmgL: 26, hit: 16, dmgBonus: 18, req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】鵺的蛇頭黑尾製成的鎖鏈劍，噬咬之毒滲入每一道傷口。" },
        "relic_sr_tengu_fan":    { n: "天狗的羽扇",         type: "wpn", isBow: true, ranged: true, relic: true, noEnhance: true, rapidfire: 80, ignHardSkin: true, ele: "wind", onHitCastSkill: { skId: "sk_windblade", cdSec: 5 }, mdmg: 2, dmgS: 2, dmgL: 2, hit: 17, dmgBonus: 13, req: "elf,illusion", p: 10000, gachaWeight: 0, d: "【遺物】天狗搧起狂風的羽團扇，每一擊都挾帶撕裂的風刃。" },
        "relic_sr_asura_arm":    { n: "阿修羅的武神技",     type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, atkSpdPct: 20, extraDmg: 2, extraHit: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】阿修羅像六臂的戰技凝為臂甲，出手快如修羅。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_sr_kyuubi_wand":  { n: "九尾妖狐的怒火",     type: "wpn", isWand: true, relic: true, noEnhance: true, ignHardSkin: true, ele: "fire", procSkill: "sk_fireball", procRateBase: 15, procRatePerEn: 0, procSkill2: { skId: "sk_fire_storm", rate: 5 }, mdmg: 4, mpR: 6, dmgS: 2, dmgL: 2, hit: 16, dmgBonus: 16, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】九尾妖狐的怒火凝成的妖杖，狐火隨揮舞飛散燎原。" },
        "relic_sr_ushioni_horn": { n: "牛鬼的斷角",         type: "wpn", w2h: true, noBleed: true, relic: true, noEnhance: true, eff: "pierce", pierceChance: 100, ignHardSkin: true, procStatusSkill: { skId: "sk_disease", rate: 15 }, heavyBonusDmg: 20, dmgS: 25, dmgL: 25, hit: 17, dmgBonus: 18, req: "royal,knight", p: 10000, gachaWeight: 0, d: "【遺物】牛鬼折斷的巨角削成的長矛，帶著瘴癘之氣貫穿一切。" },
        "relic_sr_child_ring":   { n: "牛鬼之子的黑戒",     type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, statusHealHp: 50, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】牛鬼之子甲殼磨成的黑戒，受到異常狀態侵襲時反而激發生機，恢復 50 點 HP。" },
        "relic_sr_gasha_skull":  { n: "巨大骷髏的頭骨",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 20, mr: 10, resNone: 10, req: "royal,knight,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】巨大骷髏的頭骨鑿成的胸鎧，怨念的殘響替穿戴者擋下詛咒。" },
        // ===== 🏺 遺物 第十八批（v3.5.27·5 件）：黑騎士的精銳長槍／水靈的魔力珠／被敲爛的半邊頭盔／黝黑的烈火皮囊／食屍鬼的啃食面容 =====
        "relic_bk_lance":        { n: "黑騎士的精銳長槍", type: "wpn", relic: true, noEnhance: true, dmgS: 8, dmgL: 10, hit: 15, dmgBonus: 15, req: "royal,knight,warrior", p: 10000, gachaWeight: 0, d: "【遺物】暗黑黑騎士精銳部隊的長槍，槍鋒撕裂之處鮮血難止。與鎧衛隊的漆黑塔盾同時裝備時：格檔機率提升至 100%（經典模式亦可觸發格檔），並額外獲得近距離傷害 +15。" },
        "relic_water_orb":       { n: "水靈的魔力珠", type: "wpn", isWand: true, relic: true, noEnhance: true, frozenBonusDmg: 50, waterFreezeProc: { pct: 3, dur: 4 }, dmgS: 2, dmgL: 2, hit: 13, dmgBonus: 13, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】水靈之主的魔力凝成的珠球，寒流隨法術奔湧（共鳴）。施放原本不具冰凍效果的水屬性傷害魔法時，3% 機率附加冰凍 4 秒；一般攻擊命中冰凍中的敵人時，追加 50 點固定傷害。" },
        "relic_broken_halfhelm": { n: "被敲爛的半邊頭盔", type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 3, immSilence: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】被敲爛只剩半邊的頭盔，罩不住頭顱卻護住了心神——免疫沉默。" },
        "relic_fire_hide":       { n: "黝黑的烈火皮囊", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 6, firePrisonMult: 2, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】被烈焰燻得黝黑的皮囊護甲，餘燼與咒火共鳴，使「火牢」造成的傷害加倍。" },
        "relic_ghoul_visage":    { n: "食屍鬼的啃食面容", type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 10, mhp: 30, killHealHp: 30, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】深淵食屍鬼猙獰面容鑄成的頭盔，HP +30；擊殺敵人時吞噬其殘存的生氣，恢復 30 點 HP。" },
        // ===== 🏺 遺物 第十九批（v3.6.44·用戶規格 15 件）=====
        "relic_marksman_corset":   { n: "精銳射手的戰鬥束衣", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 10, rangedHit: 3, dex: 2, er: 5, req: "elf,dark,illusion", p: 10000, gachaWeight: 0, d: "【遺物】深淵精銳射手的貼身戰鬥束衣，收束的皮革讓每一次拉弦都又穩又快。遠距離命中 +3、敏捷 +2、ER +5。" },
        "relic_earthshatter_sword":{ n: "大地碎裂劍", type: "wpn", relic: true, noEnhance: true, dmgS: 10, dmgL: 11, hit: 13, dmgBonus: 17, req: "royal,knight,mage,elf,dark,dragon", p: 10000, gachaWeight: 0, ignHardSkin: true, ele: "earth", slowScaleDmg: true, d: "【遺物】地靈之主崩解時凝成的巨劍，劍身沉重如山岳。反擊；貫穿；一般攻擊變成地屬性；攻擊速度越慢傷害越高——以 0.10 秒為基準，攻擊間隔每慢 0.05 秒，近距離傷害 +1。" },
        "relic_gale_fistblade":    { n: "疾風拳刃", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 12, dmgL: 16, hit: 15, dmgBonus: 12, req: "dark", p: 10000, gachaWeight: 0, eff: "combo", comboRate: 70, ignHardSkin: true, atkSpdPct: 35, windbladeProc: 3, d: "【遺物】風靈之主的疾風凝成的拳刃，出手快得只剩殘影。雙擊 70；貫穿；攻擊速度增加 35%；攻擊時 3% 機率觸發風刃，使目標出血（每秒 10 點固定傷害，持續 6 秒）。" },
        "relic_hellfire_hammer":   { n: "業火鍛造鎚", type: "wpn", relic: true, noEnhance: true, eff: "crush", dmgS: 8, dmgL: 6, hit: 13, dmgBonus: 13, req: "royal,knight,illusion,dragon,warrior", p: 10000, gachaWeight: 0, ignHardSkin: true, hardskinFireProc: true, d: "【遺物】火靈之主的業火鍛成的鐵鎚，專為敲碎頑固的外殼而生。鈍擊；貫穿；命中擁有硬皮值的敵人時，額外造成目標剩餘 HP 1% 的火屬性魔法傷害。" },
        "relic_pet_devotion":      { n: "珍愛夥伴的執念", type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, petReviveBuff: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】墳墓守護者至死仍護著夥伴的執念。寵物復活後 8 秒內：受到的傷害減少 100%、額外傷害 +8。" },
        "relic_blood_ritual_dagger":{ n: "血祭儀式短刀", type: "wpn", relic: true, noEnhance: true, dmgS: 7, dmgL: 7, hit: 15, dmgBonus: 12, req: "royal,mage,elf", p: 10000, gachaWeight: 0, autocastBacklash: true, spellIgnoreMr: true, d: "【遺物】血色術士獻祭用的短刀，以持有者的血肉換取穿透一切的咒力。出血；若自身 HP 大於 200，施放自動技能時受到等同消耗 MP 的固定傷害；施放的傷害魔法無視目標魔法抗性。" },
        "relic_genie_wishes":      { n: "巨靈的三個願望", type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, wishRing: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】被恐怖的伊弗利特吞下的許願戒指，獲得時會從諸多能力中隨機許下三個願望（HP/MP/近遠魔傷/SP/自然恢復/減免/AC/MR/六維）。" },
        "relic_cold_blueflame":    { n: "凜冽的青色火炎", type: "wpn", chainsword: true, w2h: true, relic: true, noEnhance: true, dmgS: 26, dmgL: 26, hit: 16, dmgBonus: 18, req: "dragon", p: 10000, gachaWeight: 0, ignHardSkin: true, ele: "fire", slaughterHits: 5, slaughterRandom: true, d: "【遺物】藍色火焰之靈魂凝成的鎖鏈劍，青焰冷冽卻灼人。弱點曝光；貫穿；一般攻擊變成火屬性；屠宰者變成攻擊 5 次，隨機攻擊場上任意目標。" },
        "relic_scorch_greatsword": { n: "烈炎燒灼的滾燙巨劍", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 21, dmgL: 24, hit: 15, dmgBonus: 19, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, ignHardSkin: true, ele: "fire", hardWear: 100, d: "【遺物】火焰烈炎獸的體溫燒灼的滾燙巨劍，握柄至今仍燙手。切割；貫穿；一般攻擊變成火屬性；一般攻擊命中時額外削減目標 100 點硬皮值。" },
        "relic_guardian_riddle":   { n: "守護獸的難題", type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 8, mr: 5, playerHardSkin: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】斯芬克斯的謎題織成的斗篷，答不出的攻擊都會被外殼擋下。裝備後獲得 30 點硬皮值：有硬皮時受到的一般攻擊傷害 -2 並消耗 1 點；每 5 秒恢復 1 點，上限 20。MR +5。" },
        "relic_mana_array_boots":  { n: "魔力凝聚的法陣", type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 9, statArray: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】闇黑君王腳下的法陣凝成的長靴，將肉身素質煉成魔力。每 5 點體質增加 1% 攻擊速度、每 5 點敏捷增加 1 點近距離傷害、每 5 點力量增加 1 點遠距離傷害。" },
        "relic_bloodknight_dual":  { n: "嗜血騎士的雙刀", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 18, dmgL: 12, hit: 18, dmgBonus: 14, req: "dark", p: 10000, gachaWeight: 0, eff: "combo", comboRate: 35, ignHardSkin: true, hpOnHit: 10, mpOnComboHit: 10, d: "【遺物】血騎士的嗜血雙刀，每一刀都渴飲敵人的生命。雙擊 35；貫穿；一般攻擊命中恢復 10 HP；雙擊觸發的追擊命中時恢復 10 MP。" },
        "relic_cursed_egg":        { n: "充滿詛咒氣息的蛋", type: "etc", relic: true, eff: "cursedegg", req: "all", p: 10000, c: "text-purple-300", gachaWeight: 0, d: "【遺物】骨龍巢穴深處的蛋，殼上纏繞著揮之不去的詛咒氣息。使用後獲得 詛咒蜥蜴（自動存入寵物保管；寵物保管已滿時無法使用、蛋不會消失）。" },
        "relic_elmo_spear":        { n: "艾爾摩尖頭槍", type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "pierce", pierceChance: 100, dmgS: 17, dmgL: 17, hit: 15, dmgBonus: 15, req: "royal,knight,elf,dragon,warrior", p: 10000, gachaWeight: 0, ignHardSkin: true, pierceMainMult: 1.3, pierceSubMult: 0.9, d: "【遺物】受詛咒的艾爾摩士兵至死緊握的尖頭槍。穿透 100；貫穿；一般攻擊對主目標傷害增加 30%，對穿透波及目標傷害減少 10%。" },
        "relic_petrify_essence":   { n: "石化魔法的精髓", type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 11, stoneEssence: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】亞力安石化魔法的精髓凝成的頭盔。受到石化狀態時獲得「石化精髓」：傷害減免 +50、MR +50，持續 10 秒；受到的石化狀態持續時間減半。" },
        // 🏺 v3.6.47 遺物第二十批（3 件·0.0001% 單怪掉落）：熔岩噴嘴=鎖鏈劍旗標自帶弱點曝光+貫穿·火球 proc 走既有 procSkill(procOnHit=僅命中)；粉碎鎚=eff crush 重擊(經典自動停用=一般限定)·procInstakill 擴充 hardOnly/hasteSec（js/04＋js/06 傭兵鏡像）；厄運蛋=鏡像詛咒蛋（js/08 doomegg→js/22 petUseCursedEgg 泛化）
        "relic_lava_nozzle":       { n: "火山怪獸的熔岩噴嘴", type: "wpn", chainsword: true, w2h: true, relic: true, noEnhance: true, dmgS: 21, dmgL: 21, hit: 18, dmgBonus: 14, int: 2, str: 1, ignHardSkin: true, ele: "fire", procSkill: "sk_fireball", procRateBase: 20, procRatePerEn: 0, procOnHit: true, req: "dragon", p: 10000, gachaWeight: 0, d: "【遺物】烈炎獸噴吐熔岩的噴嘴鍛成的鎖鏈劍，劍身仍殘留著火山的餘溫。弱點曝光；貫穿；一般攻擊變成火屬性；一般攻擊命中時 20% 機率觸發燃燒的火球；智力 +2、力量 +1。" },
        "relic_doom_egg":          { n: "充滿厄運氣息的蛋", type: "etc", relic: true, eff: "doomegg", req: "all", p: 10000, c: "text-purple-300", gachaWeight: 0, d: "【遺物】飛龍巢中混入的異樣之蛋，殼上盤旋著揮之不去的厄運氣息。使用後獲得 厄運蜥蜴（自動存入寵物保管；寵物保管已滿時無法使用、蛋不會消失）。" },
        "relic_crusher_hammer":    { n: "重裝戰士的粉碎鎚", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 24, dmgL: 20, hit: 13, dmgBonus: 17, eff: "crush", ignHardSkin: true, procInstakill: { p: 0.01, hardOnly: true, hasteSec: 8 }, req: "knight,illusion,warrior", p: 10000, gachaWeight: 0, d: "【遺物】重裝歐姆戰士的粉碎鎚，連最堅硬的外殼也能一鎚砸穿。重擊（一般限定）；貫穿；一般攻擊命中時 1% 機率使非頭目的硬皮怪立即死亡；觸發即死時攻擊速度 +20%，持續 8 秒。" },
        // 🥚 v3.6.62 遺物第二十一批（2 件·0.0001% 單怪掉落）：破滅蛋／災厄蛋＝補完四蜥蜴的取得管道（PET_BOOK 早已定義·此前只有詛咒/厄運兩顆蛋有來源）。分派見 js/08 RELIC_EGG_PETS 表
        "relic_doomsday_egg":      { n: "充滿破滅氣息的蛋", type: "etc", relic: true, eff: "doomsdayegg", req: "all", p: 10000, c: "text-purple-300", gachaWeight: 0, d: "【遺物】遺忘之島飛龍守著的蛋，殼上翻湧著揮之不去的破滅氣息。使用後獲得 破滅蜥蜴（自動存入寵物保管；寵物保管已滿時無法使用、蛋不會消失）。" },
        "relic_calamity_egg":      { n: "充滿災厄氣息的蛋", type: "etc", relic: true, eff: "calamityegg", req: "all", p: 10000, c: "text-purple-300", gachaWeight: 0, d: "【遺物】深淵地靈周身塵土凝成的蛋，殼上沉積著揮之不去的災厄氣息。使用後獲得 災厄蜥蜴（自動存入寵物保管；寵物保管已滿時無法使用、蛋不會消失）。" },
        // 🏺 v3.7.20 遺物第二十二批（18 件·各 0.0001% 單怪掉落）
        "relic_maze_demon_glare":  { n: "迷宮惡魔的瞥視",     type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 22, dmgL: 24, hit: 14, dmgBonus: 14, eff: "crush", ignHardSkin: true, atkSpdPct: 30, missGrazeRate: 100, grazeDmgPct: 30, req: "royal,knight,illusion,dragon,warrior", p: 10000, gachaWeight: 0, d: "【遺物】迷宮深處惡魔的瞥視凝成的雙手鈍器，被盯上的獵物無處可逃。重擊（一般限定）；貫穿；攻擊速度增加 30%；一般攻擊未命中時改為挫傷，造成 30% 傷害（挫傷不會爆擊）。" },
        "relic_lining_chainshirt": { n: "盔甲內襯鎖鏈衣",     type: "arm", slot: "tshirt", relic: true, noEnhance: true, ac: 6, liningChain: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】穿在盔甲底下的細密鎖鏈衣，替輕便的護甲補上第二層防線。若裝備防禦 6 以下的盔甲（含未強化 AC-0～AC-6），額外獲得 AC-10 與 MR+10。" },
        "relic_icefang_armguard":  { n: "冰牙虎臂甲",         type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, dex: 2, extraHit: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】冷酷冰原老虎的獠牙磨成的臂甲，握武器的手穩得像結了冰。敏捷 +2、額外命中 +5。臂甲（裝於副手，可與雙手武器並用）。" },
        "relic_powder_arrow":      { n: "無限火藥爆裂矢",     type: "wpn", isArrow: true, noConsume: true, relic: true, noEnhance: true, dmgS: 8, dmgL: 14, onHitEleDmg: { dmg: 50, ele: "fire", rate: 10 }, req: "royal,knight,elf,mage,dark,illusion,dragon", p: 10000, gachaWeight: 0, d: "【遺物】填滿火藥的爆裂箭矢，射出後總會自己回到箭筒。裝備在箭矢欄位，視同箭矢但不會被消耗；裝備遠距離武器時，一般攻擊命中有 10% 機率追加 50 點火屬性傷害（固定值，不受魔法傷害影響）。" },
        "relic_lizardlord_crown":  { n: "蜥蜴領主的王冠",     type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 7, cha: 1, petHpAll: 100, petMpRAll: 5, petMdmgAll: 3, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】統領蜥蜴的王冠，戴上後所有寵物都對你俯首聽命。寵物 HP+100、MP 自然恢復量 +5、魔法傷害 +3；魅力 +1。" },
        "relic_steelmonk_staff":   { n: "鋼鐵僧侶的錫杖",     type: "wpn", w2h: true, isWand: true, relic: true, noEnhance: true, dmgS: 18, dmgL: 18, hit: 15, dmgBonus: 16, eff: "magicstrike", ignHardSkin: true, atkSpdPct: 30, str: 5, procHealSkill: { skId: "sk_regen", rate: 5 }, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】鋼鐵僧侶隨身的錫杖，環音每一響都同時是祝禱與重擊。魔擊（一般限定）；貫穿；攻擊速度增加 30%；一般攻擊命中時 5% 機率觸發體力回復術；力量 +5。" },
        "relic_elder_obsidian_orb":{ n: "長老的黑曜水晶球",   type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 8, block: 10, int: 3, mr: 10, mpR: 10, crushTornado: true, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】黑長者懷中的黑曜水晶球，球心封存著一整場風暴。格檔 10（一般限定）；智力 +3、MR+10、MP 自然恢復量 +10；被重擊時，對敵方全體施放龍捲風。" },
        "relic_myriad_avatar":     { n: "百變化身",           type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 8, polyAtkSpdPct: 20, polyAllStats: 2, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】變形怪首領蛻下的表皮製成的手套，戴上的人連骨相都跟著改變。變身時：攻擊速度增加 20%、全屬性 +2。" },
        "relic_unsealed_baphomet_wand": { n: "解除封印的巴風特魔杖", type: "wpn", isWand: true, relic: true, noEnhance: true, dmgS: 7, dmgL: 6, hit: 20, dmgBonus: 17, ignHardSkin: true, mdmg: 3, extraMp: 3, procDualSkill: { skn: "熾焰地裂術", rate: 25, parts: [[4, 20, "earth"], [4, 20, "fire"]] }, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】掙脫封印的巴風特魔杖，杖中的魔神之力再無拘束。共鳴（一般限定）；貫穿；魔法傷害 +3、額外魔法點數 +3；攻擊時 25% 機率觸發熾焰地裂術（必定命中，對目標同時造成地屬性與火屬性魔法傷害，受魔法傷害影響）。" },
        "relic_sphinx_black_wing": { n: "人面獅身的漆黑羽翼", type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 7, er: 5, drPerEr: 5, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】黑斯芬克斯的漆黑羽翼，展開便讓謎語與刀鋒都失了準頭。ER+5；傷害減免+（ER÷5）。" },
        "relic_overlook_thunder":  { n: "俯瞰大地的雷電",     type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 2, auraSkill: { skId: "sk_thunder_storm", interval: 100 }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】尼荷斯俯瞰大地的目光化作項鍊，雷雲永遠跟在配戴者頭頂。每 10 秒觸發一次雷霆風暴。" },
        "relic_elmore_greatsword": { n: "艾爾摩古戰場巨劍",   type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 20, dmgL: 17, hit: 14, dmgBonus: 17, eff: "cleave", dblStrikeRate: 3, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】自艾爾摩古戰場出土的巨劍，劍身還記得千軍萬馬的殺伐。切割（一般限定）；一般攻擊有 3% 機率造成 2 倍傷害。" },
        "relic_warrior_blackblade":{ n: "戰士的漆黑之劍",     type: "wpn", relic: true, noEnhance: true, dmgS: 16, dmgL: 10, hit: 19, dmgBonus: 14, traumaProc: { pct: 5, dur: 6, maxStacks: 2, dmg: 5 }, req: "knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】暗黑火焰戰士的漆黑之劍，每道劍痕都久久無法癒合。反擊（一般限定）；居合（一般限定）；一般攻擊命中有 5% 機率使目標陷入創傷：受到的所有物理傷害 +5，持續 6 秒，最多 2 層。" },
        "relic_cyclops_dollsuit":  { n: "獨眼巨人的手製娃娃裝", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 5, mr: 7, mpR: 7, dr: 7, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】獨眼巨人笨拙縫製的娃娃裝，針腳歪斜卻縫進了滿滿的守護。MR+7、MP 自然恢復量 +7、傷害減免 +7。" },
        "relic_beheading_scythe":  { n: "斬首的巨大鐮刀",     type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 21, dmgL: 26, hit: 13, dmgBonus: 13, eff: "cleave", crushInstakill: { cdSec: 3, healHp: 30 }, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】死神西斯的巨大鐮刀，刀刃劃過之處連呼吸都被收割。切割（一般限定）；重擊時，若目標等級比自己低且非頭目怪物則觸發即死（每 3 秒最多 1 次）；觸發即死時自身恢復 30 HP。" },
        "relic_treasured_carrot":  { n: "珍藏的巨大胡蘿蔔",   type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 1, cha: 3, petDmgAll: 5, petHitAll: 5, petMdmgAll: 1, summonDmg: 5, summonHit: 5, summonMdmg: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】曼波兔珍藏多年的巨大胡蘿蔔，背在身上就是所有夥伴的精神支柱。魅力 +3；寵物與召喚物額外傷害 +5、額外命中 +5、魔法傷害 +1。" },
        "relic_cross_tombshield":  { n: "十字墓碑盾",         type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 12, dr: 5, undeadImmune: { cdSec: 5 }, req: "royal,knight", p: 10000, gachaWeight: 0, d: "【遺物】墳墓守護者騎士扛著的十字墓碑，亡者的爪牙無法傷及碑後之人。傷害減免 +5；免疫不死族的傷害（每 5 秒最多觸發 1 次）。" },
        "relic_mage_scrap_note":   { n: "古代法師的隨手小抄", type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 0, grantSkills: ["sk_frost_spike"], grantSkillsEquipOnly: true, req: "mage,illusion", p: 10000, gachaWeight: 0, d: "【遺物】古代法師隨手寫下的咒文小抄，紙上寒氣至今未散。裝備者可在自動技能施展 寒冰尖刺（水屬性單體魔法傷害，對非頭目怪物 50% 機率冰凍，視為 10 級法師法術）。" },
        // 🏺 遺物第二十三批（v3.7.52·16 件·各 0.0001% 單怪掉落）
        "relic_golem_lifemark":    { n: "高崙的生命印記",     type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 8, mr: 60, golemMarkDebuff: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】象牙塔石頭高崙額上的生命印記，戴上便分得高崙的頑固。MR+60；受到重擊時，MR-100，持續 3 秒。" },
        "relic_serrated_fangs":    { n: "無數鋸齒的邪惡利牙", type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 21, dmgL: 17, hit: 14, dmgBonus: 18, eff: "combo", comboRate: 25, comboForceCrit: true, critFuryHaste: { pct: 30, sec: 5 }, ignHardSkin: true, req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】密密麻麻的鋸齒獠牙鑄成的雙刀，每一齒都渴著血。雙擊 25；貫穿；雙擊的追加攻擊必定爆擊；攻擊爆擊時，獲得攻擊速度 +30%，持續 5 秒。" },
        "relic_kurt_shield":       { n: "克特之盾",           type: "arm", slot: "shield", relic: true, noEnhance: true, ac: 13, block: 80, resWind: 5, judgmentThunder: { skn: "審判落雷", dice: [5, 20], flat: 60, ele: "wind", statusMagicHit: { kind: "paralyze", dur: 3 }, requireWpn: "wpn_kurt_sword" }, req: "royal,knight,dragon,elf", p: 10000, gachaWeight: 0, d: "【遺物】風之洞穴主人克特的巨盾，盾面仍迴盪著雷鳴。格檔 80（一般限定）；風屬性抗性 +5；當裝備克特之劍時，克特之劍觸發的極道落雷變成審判落雷（更強大的風屬性單體傷害，並有機率使目標麻痺）。" },
        "relic_follower_cloak":    { n: "隨從的護身斗篷",     type: "arm", slot: "cloak", relic: true, noEnhance: true, ac: 7, raceDr: { race: "拉斯塔巴德", pct: 20 }, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】長老隨從的護身斗篷，浸透了拉斯塔巴德的瘴氣而百毒不侵。受到 拉斯塔巴德 敵人的傷害減少 20%。" },
        "relic_ashbeast_chain":    { n: "灰燼巨獸的束鏈",     type: "acc", slot: "belt", relic: true, noEnhance: true, ac: 0, weightCap: 300, wis: 1, con: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】束縛火焰阿西塔基奧的巨鏈，繫上便得巨獸之軀。負重 +300；精神 +1、體質 +1。" },
        "relic_flame_baphomet_armor": { n: "烈焰焚燒的巴風特盔甲", type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 15, immBurn: true, dr: 3, mr: 10, req: "knight,warrior,dragon", p: 10000, gachaWeight: 0, d: "【遺物】在炎魔烈焰中焚燒千年的巴風特盔甲，火早已燒不進去。免疫灼燒；傷害減免 +3、MR+10。" },
        "relic_priest_hood":       { n: "司祭的無眼頭飾",     type: "arm", slot: "helm", relic: true, noEnhance: true, ac: 0, immBlind: true, set: "priest", req: "mage,elf,illusion,dark", p: 10000, gachaWeight: 0, d: "【遺物】墮落司祭縫死雙眼的頭飾，看不見的人不會再被奪去視界。免疫闇盲。司祭苦行套裝（5 件）：AC-50、MR+50、HP+300、MP 自然恢復量 +30、近/遠/魔法爆擊率 +5%、近/遠/魔法爆擊傷害 +50%。" },
        "relic_priest_gloves":     { n: "司祭的斷指護手",     type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 0, immParalyze: true, set: "priest", req: "mage,elf,illusion,dark", p: 10000, gachaWeight: 0, d: "【遺物】墮落司祭斷指後仍戴著的護手，殘缺的手不再僵麻。免疫麻痺。司祭苦行套裝（5 件）：AC-50、MR+50、HP+300、MP 自然恢復量 +30、近/遠/魔法爆擊率 +5%、近/遠/魔法爆擊傷害 +50%。" },
        "relic_priest_collar":     { n: "司祭的鎖喉頸圈",     type: "acc", slot: "amulet", relic: true, noEnhance: true, ac: 0, immSilence: true, set: "priest", req: "mage,elf,illusion,dark", p: 10000, gachaWeight: 0, d: "【遺物】墮落司祭鎖住喉頭的頸圈，被鎖過的喉嚨不會再被奪聲。免疫沉默。司祭苦行套裝（5 件）：AC-50、MR+50、HP+300、MP 自然恢復量 +30、近/遠/魔法爆擊率 +5%、近/遠/魔法爆擊傷害 +50%。" },
        "relic_priest_robe":       { n: "司祭的腐爛長袍",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 0, immPoison: true, set: "priest", req: "mage,elf,illusion,dark", p: 10000, gachaWeight: 0, d: "【遺物】墮落司祭腐爛見骨仍不脫下的長袍，爛透的身軀百毒難侵。免疫中毒。司祭苦行套裝（5 件）：AC-50、MR+50、HP+300、MP 自然恢復量 +30、近/遠/魔法爆擊率 +5%、近/遠/魔法爆擊傷害 +50%。" },
        "relic_priest_sandals":    { n: "司祭的殘破草鞋",     type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 0, immSlow: true, set: "priest", req: "mage,elf,illusion,dark", p: 10000, gachaWeight: 0, d: "【遺物】墮落司祭行遍荒野磨破的草鞋，苦行的腳步不受拖滯。免疫緩速。司祭苦行套裝（5 件）：AC-50、MR+50、HP+300、MP 自然恢復量 +30、近/遠/魔法爆擊率 +5%、近/遠/魔法爆擊傷害 +50%。" },
        "relic_mageblade_knife":   { n: "專精劍術的魔劍士之刀", type: "wpn", relic: true, noEnhance: true, dmgS: 10, dmgL: 12, hit: 9, dmgBonus: 9, atkSpdPct: 30, spellbladeBuff: true, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】專精劍術的魔劍士佩刀，劍鋒與咒文共鳴。反擊（一般限定）；居合（一般限定）；攻擊速度增加 30%；消耗 MP 施放傷害法術後 10 秒內：依法術階級提升近距離傷害與近距離命中（1 階 +1 ～ 10 階 +25），且一般攻擊變成最後施放法術的屬性。" },
        "relic_ghost_teardrop":    { n: "受困幽魂的淚滴",     type: "acc", slot: "ring", relic: true, noEnhance: true, ac: 2, dotMpRefund: 25, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】受困幽魂凝結的淚滴，痛楚在其中化作魔力。因持續傷害損失 HP 時，恢復損失 HP 25% 量的 MP。" },
        "relic_true_dragonslayer": { n: "真‧屠龍劍",          type: "wpn", w2h: true, relic: true, noEnhance: true, dmgS: 37, dmgL: 45, hit: 17, dmgBonus: 30, eff: "cleave", ignHardSkin: true, mcrit: 3, dragonSlayStrike: { rate: 15, dice: 5, flat: 60, dragonMult: 3 }, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】屠龍劍中沉眠的龍魂徹底甦醒後的真身，劍鳴即龍吟。切割（一般限定）；貫穿；爆擊率 +3%；攻擊時 15% 機率觸發滅龍的一擊，對全體造成依力量、敏捷、體質而定的無視防禦物理固定傷害；滅龍的一擊對 龍 類型敵人造成 3 倍傷害。" },
        "relic_flame_dk_sword":    { n: "烈焰的死亡騎士之劍", type: "wpn", relic: true, noEnhance: true, dmgS: 25, dmgL: 25, hit: 15, dmgBonus: 25, ele: "fire", ignHardSkin: true, flameDkMorph: true, procRateBase: 25, procRatePerEn: 0, spellProc: { skn: "煉獄火", dice: [16, 10], flat: 80, ele: "fire", aoe: true, burnDot: { dmg: 30, dur: 6 } }, procBurn: { magicHit: true, dmg: 30, dur: 6 }, req: "royal,knight,dragon", p: 10000, gachaWeight: 0, d: "【遺物】烈焰死亡騎士的佩劍，劍身裹著永不熄滅的地獄之火。反擊（一般限定）；居合（一般限定）；貫穿；裝備時變身 烈焰的死亡騎士；一般攻擊變成火屬性；攻擊時 25% 機率觸發煉獄火（火屬性全體魔法傷害，受魔法傷害影響，並有機率使目標陷入灼燒）；一般攻擊命中時，有機率使目標陷入灼燒（每秒 30 點火屬性傷害，持續 6 秒）。" },
        // 🏺 遺物第二十四批（v3.8.12·2 件·各 0.0001% 單怪掉落）
        "relic_sky_god_avatar":     { n: "天空之神的化身",     type: "arm", slot: "armor", relic: true, noEnhance: true, ac: 11, wearerEle: "wind", req: "all", p: 10000, gachaWeight: 0, d: "【遺物】天空之神遺留在人間的羽衣，披上後身軀便與長風融為一體。" },
        "relic_necro_book":         { n: "死靈之書",           type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, necroBook: true, killTeamHealPct: 1, req: "mage", p: 10000, gachaWeight: 0, d: "【遺物】以亡者皮骨裝訂的禁書，書頁會在敵人倒下時自行翻動，喚回仍不願安息的骸骨。" },
        // 🏺 遺物第二十五批（v3.8.26·5 件·各 0.0001% 單怪掉落）
        "relic_wing_chaos_blades":  { n: "飛翼的混沌雙刀",     type: "wpn", w2h: true, relic: true, noEnhance: true, eff: "combo", comboRate: 30, ignHardSkin: true, str: 2, dex: 1, dmgS: 16, dmgL: 11, hit: 15, dmgBonus: 16, darkCritMorph: "flywing_double", req: "dark", p: 10000, gachaWeight: 0, d: "【遺物】混沌司祭折翼後留下的雙刀，斬擊如殘翼同時掠過。雙擊 30；貫穿；力量 +2、敏捷 +1；裝備時會心一擊變為飛翼雙連：消耗 MP 12，立即進行兩次一般攻擊，兩次皆必定觸發雙擊。" },
        "relic_corrosive_jelly_skin": { n: "腐蝕的果凍外皮",  type: "arm", slot: "gloves", relic: true, noEnhance: true, ac: 4, dr: 5, corrosiveJellySkin: true, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】象牙塔果凍怪的腐蝕外皮仍在緩緩蠕動。傷害減免 +5；受到一般攻擊時，使攻擊者的一般攻擊力永久 -3，最多疊加 5 層，直到該目標死亡。" },
        "relic_goat_demon_feet":    { n: "山羊惡魔的雙足",   type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 11, str: 3, int: 3, moveSpeedPct: 33, mpR: 3, bossEncounterPct: 3, req: "knight,elf,dark,dragon", p: 10000, gachaWeight: 0, d: "【遺物】巴列斯踏碎地獄岩層的雙足，仍帶著炙熱蹄印。力量 +3、智力 +3、移動速度 +33%、MP 自然恢復量 +3；頭目遭遇機率變更為 3%。" },
        "relic_succubus_queen_kiss": { n: "斯克巴女皇的魅惑之吻", type: "arm", slot: "shield", armguard: { stat: "none", base: 0, th: [0, 0, 0] }, relic: true, noEnhance: true, ac: 0, cha: 1, charmOnHit: true, req: "elf,mage", p: 10000, gachaWeight: 0, d: "【遺物】斯克巴女皇留下的吻痕，會在武器命中時低語。魅力 +1；迷魅術變為魅惑術：自身沒有迷魅怪物時，一般攻擊命中會自動嘗試迷魅目標；對頭目無效。" },
        "relic_spider_queen_footprints": { n: "蜘蛛女王的足跡", type: "arm", slot: "boots", relic: true, noEnhance: true, ac: 8, immSlow: true, dr: 4, extraHit: 1, req: "all", p: 10000, gachaWeight: 0, d: "【遺物】傲慢的潔尼斯女王踏過的地面留下冰冷足跡。免疫緩速；傷害減免 +4；額外命中 +1。" },
        "clk_elf": { n: "精靈斗篷", type: "arm", slot: "cloak", ac: 1, req: "all", safe: 6, p: 900, gachaWeight: 100 },
        "clk_oasis": { n: "歐西斯斗篷", type: "arm", slot: "cloak", ac: 0, req: "all", safe: 4, p: 15, gachaWeight: 100 },
        "arm_86": { n: "侏儒斗篷", type: "arm", slot: "cloak", ac: 0, req: "all", safe: 4, p: 18, gachaWeight: 100 },
        "arm_87": { n: "保護者斗篷", type: "arm", slot: "cloak", ac: 3, req: "all", safe: 4, p: 8500, gachaWeight: 50 },
        "arm_88": { n: "隱身斗篷", type: "arm", slot: "cloak", ac: 1, legend: true, aggroMin: true, d: "織入隱匿術法的斗篷，披上便彷彿融入暗影。穿戴時等同維持隱身術：非BOSS敵人在滿血時不會主動攻擊，受創後才會反擊；被攻擊權重必定為 1（最低），敵人選擇攻擊對象時最不容易挑中你（卸下即失效）。", req: "all", safe: 4, p: 100000, gachaWeight: 1 },
        "clk_mr": { n: "抗魔法斗篷", type: "arm", slot: "cloak", ac: 1, mr: 10, mrPerEn: 2, req: "all", safe: 4, p: 3300, gachaWeight: 100 },
        "arm_89": { n: "瑪那斗篷", type: "arm", slot: "cloak", ac: 2, req: "mage", safe: 4, p: 7200, mpR: 5, gachaWeight: 10 },
        "bot_short": { n: "短統靴", type: "arm", slot: "boots", ac: 1, req: "all", safe: 4, p: 299, gachaWeight: 100 },
        "arm_90": { n: "長靴", type: "arm", slot: "boots", ac: 2, req: "all", safe: 4, p: 3260, gachaWeight: 100 },
        "bot_baless": { n: "巴列斯長靴", legend: true, type: "arm", slot: "boots", ac: 2, str: 1, req: "knight,elf", safe: 6, p: 60000, gachaWeight: 1 },   // 🔧 巴列斯掉落（AC-2＝ac:2；力量+1）
        "arm_91": { n: "皮涼鞋", type: "arm", slot: "boots", ac: 0, req: "all", safe: 4, p: 20, gachaWeight: 100 },
        "arm_92": { n: "銀釘皮涼鞋", type: "arm", slot: "boots", ac: 1, req: "all", safe: 4, p: 230, gachaWeight: 100 },
        "arm_93": { n: "皮長靴", type: "arm", slot: "boots", ac: 2, req: "all", safe: 4, p: 720, gachaWeight: 100 },
        "arm_94": { n: "鋼鐵長靴", type: "arm", slot: "boots", ac: 3, req: "all", safe: 4, p: 16500, gachaWeight: 20 },
        "arm_95": { n: "深水長靴", type: "arm", slot: "boots", ac: 2, req: "all", safe: 4, p: 36500, mpR: 1, gachaWeight: 10 },
        "bot_dk": { n: "死亡騎士長靴", legend: true, type: "arm", slot: "boots", ac: 3, req: "knight", safe: 4, p: 24000, gachaWeight: 1, d: "死亡騎士的戰靴，所踏之地寸草不生。死亡騎士套裝之一。" },
        "arm_96": { n: "黑長者涼鞋", legend: true, type: "arm", slot: "boots", ac: 2, req: "mage", safe: 4, p: 21000, mmp: 25, mpR: 5, gachaWeight: 1 },
        "arm_97": { n: "克特長靴", legend: true, type: "arm", slot: "boots", ac: 3, req: "knight", safe: 4, p: 22000, gachaWeight: 1, d: "克特踏遍沙場的長靴，靴底沾染著無數亡者的塵土。克特套裝之一。" },
        "glv_glove": { n: "手套", type: "arm", slot: "gloves", ac: 0, req: "all", safe: 4, p: 1720, gachaWeight: 100 },
        "arm_stone_glove": { n: "石製手套", type: "arm", slot: "gloves", ac: 3, dr: 1, req: "all", safe: 4, p: 66000, gachaWeight: 10, d: "以高崙碎石打磨嵌合而成的厚重石造手套，堅硬如岩、刀劍難傷。" },   // 🗿 高崙掉落
        "glv_official": { n: "武官手套", type: "arm", slot: "gloves", ac: 1, mhp: 10, req: "knight,dark", safe: 6, p: 5900, gachaWeight: 10 },
        "bot_official": { n: "武官長靴", type: "arm", slot: "boots", ac: 2, mhp: 20, req: "knight,dark", safe: 6, p: 8900, gachaWeight: 10 },
		"glv_crystal": { n: "水晶手套", type: "arm", slot: "gloves", ac: 3, req: "knight", safe: 4, p: 11500, gachaWeight: 10 },
        "arm_98": { n: "腕甲", type: "arm", slot: "gloves", ac: 0, req: "knight,elf", safe: 4, p: 11550, rangedHit: 2, gachaWeight: 20 },
        "arm_99": { n: "力量手套", type: "arm", slot: "gloves", ac: 0, req: "all", safe: 4, p: 19800, str: 2, gachaWeight: 5 },
        "glv_reaper": { n: "死神之手", type: "arm", slot: "gloves", ac: 1, mmp: 20, mpR: 3, wis: 1, req: "mage,dark", safe: 0, p: 79000, gachaWeight: 1, d: "死神親手脫下的枯骨之手，攥緊時透出徹骨的寒意。" },
        "arm_100": { n: "鋼鐵手套", type: "arm", slot: "gloves", ac: 1, req: "all", safe: 4, p: 11550, gachaWeight: 20 },
        "glv_dk": { n: "死亡騎士手套", legend: true, type: "arm", slot: "gloves", ac: 2, req: "knight", safe: 4, p: 18500, gachaWeight: 1, d: "死亡騎士的鐵手套，曾握緊過奪命的鋒刃。死亡騎士套裝之一。" },
        "arm_shadowglove": { n: "影子手套", type: "arm", slot: "gloves", ac: 1, con: 1, req: "dark", safe: 6, p: 1720, gachaWeight: 50 },   // 🔧 黑暗妖精：倫得以死亡誓約兌換
        "arm_shadowmask": { n: "影子面具", type: "arm", slot: "helm", ac: 2, req: "dark", safe: 6, p: 1240, gachaWeight: 50 },   // 🔧 黑暗妖精：康以妖魔長老首級兌換
        "arm_shadowboots": { n: "影子長靴", type: "arm", slot: "boots", ac: 2, mhp: 50, hpR: 4, req: "dark", safe: 4, p: 2660, gachaWeight: 50 },   // 🔧 黑暗妖精：布魯迪卡以雪怪首級兌換
        // ===== 拉斯塔巴德地下洞穴：掉落防具 =====
        "arm_rasta_leather": { n: "拉斯塔巴德皮盔甲", type: "arm", slot: "armor", ac: 3, req: "all", safe: 4, p: 590, gachaWeight: 100 },
        "bot_rasta": { n: "拉斯塔巴德長靴", type: "arm", slot: "boots", ac: 2, req: "all", safe: 4, p: 380, gachaWeight: 100 },
        "clk_dark": { n: "黑暗斗篷", type: "arm", slot: "cloak", ac: 3, mhp: 30, req: "dark", safe: 4, p: 6350, gachaWeight: 60 },
        "amr_rasta_robe": { n: "拉斯塔巴德長袍", type: "arm", slot: "armor", ac: 4, mpR: 5, req: "mage", safe: 4, p: 14000, gachaWeight: 10 },
        "amr_darkmage_robe": { n: "黑法師長袍", type: "arm", slot: "armor", ac: 4, mmp: 5, mpR: 5, req: "mage", safe: 4, p: 53100, gachaWeight: 10 },
        "amr_summoner_robe": { n: "喚獸師長袍", type: "arm", slot: "armor", ac: 4, mhp: 5, mpR: 5, req: "mage", safe: 4, p: 53100, gachaWeight: 10 },
        "shd_rasta": { n: "拉斯塔巴德圓盾", type: "arm", slot: "shield", ac: 2, req: "all", safe: 4, p: 500, gachaWeight: 100, block: 35 },
        "arm_101": { n: "克特手套", legend: true, type: "arm", slot: "gloves", ac: 2, req: "knight", safe: 4, p: 17500, gachaWeight: 1, d: "克特的戰手套，指節間還殘留著最後一戰的握痕。克特套裝之一。" },
        "arm_102": { n: "保護者手套", type: "arm", slot: "gloves", ac: 0, req: "elf", safe: 4, p: 4500, mhp: 20, mmp: 20, gachaWeight: 30 },
        "arm_103": { n: "小盾牌", type: "arm", slot: "shield", ac: 1, req: "all", safe: 4, p: 84, gachaWeight: 100, block: 20 },
        "shd_elf": { n: "精靈盾牌", type: "arm", slot: "shield", ac: 2, req: "all", safe: 6, p: 3200, gachaWeight: 100, block: 40 },
        "arm_104": { n: "阿克海盾牌", type: "arm", slot: "shield", ac: 1, req: "all", safe: 4, p: 28, gachaWeight: 100, block: 30 },
        "arm_105": { n: "大盾牌", type: "arm", slot: "shield", ac: 2, req: "knight,elf", safe: 4, p: 1680, gachaWeight: 100, block: 50 },
        "shd_gnome": { n: "侏儒圓盾", type: "arm", slot: "shield", ac: 2, req: "knight,elf", safe: 4, p: 240, gachaWeight: 100, block: 30 },
        "arm_106": { n: "反射之盾", type: "arm", slot: "shield", ac: 2, req: "knight,elf", safe: 4, p: 28000, immStone: true, resNone: 10, d: "盾面如鏡，能將敵人的法術回擲其身。", gachaWeight: 1, block: 40 },
        "arm_107": { n: "伊娃之盾", type: "arm", slot: "shield", ac: 3, req: "all", safe: 4, p: 5200, mhp: 20, eff: "haste", gachaWeight: 0, block: 40 },
        "arm_108": { n: "塔盾", type: "arm", slot: "shield", ac: 3, req: "knight", safe: 4, p: 9800, gachaWeight: 50, block: 70 },
        "arm_109": { n: "木盾", type: "arm", slot: "shield", ac: 1, req: "all", safe: 4, p: 16, gachaWeight: 100, block: 30 },
        "arm_110": { n: "銀騎士之盾", type: "arm", slot: "shield", ac: 2, mr: 4, req: "knight", safe: 4, p: 2600, gachaWeight: 20, block: 70 },
        "arm_111": { n: "皮盾牌", type: "arm", slot: "shield", ac: 1, req: "all", safe: 4, p: 32, gachaWeight: 100, block: 20 },
        "arm_112": { n: "銀釘皮盾", type: "arm", slot: "shield", ac: 2, req: "all", safe: 4, p: 255, gachaWeight: 100, block: 30 },
        "shd_bone": { n: "骷髏盾牌", type: "arm", slot: "shield", ac: 3, req: "all", safe: 0, p: 255, gachaWeight: 100, block: 30 },
		"shd_redknight": { n: "紅騎士盾牌", type: "arm", slot: "shield", ac: 2, req: "knight", safe: 6, p: 9800, immStone: true, resNone: 20, d: "紅騎士團傳承的戰盾，染血的盾面磨礪出抗魔的韌性。", gachaWeight: 20, block: 50 },
        "arm_113": { n: "鋼鐵盾牌", type: "arm", slot: "shield", ac: 3, req: "knight", safe: 4, p: 16500, gachaWeight: 20, block: 60 },
        "arm_115": { n: "魔法能量之書", type: "arm", slot: "shield", ac: 2, req: "mage", safe: 4, p: 9800, int: 1, gachaWeight: 20, block: 10 },
        "acc_116": { n: "傳送控制戒指", type: "acc", slot: "ring", ac: 0, req: "all", safe: 0, p: 150000, gachaWeight: 1, unique: true, d: "刻著古老座標的戒指，撕裂空間之餘總會引來潛伏的強敵。攜帶在背包即可生效（無需裝備）：手動施放傳送術/使用瞬移卷軸時必定遭遇 BOSS。" },
        "acc_117": { n: "變形控制戒指", type: "acc", slot: "ring", ac: 0, req: "all", safe: 0, p: 150000, gachaWeight: 1, unique: true, d: "嵌著變幻紋路的戒指，讓施術者得以主宰自身形貌的流轉。攜帶在背包即可生效（無需裝備）：使用變形卷軸時可指定變身型態。" },
        "acc_summon_ctrl": { n: "召喚控制戒指", type: "acc", slot: "ring", ac: 0, req: "all", safe: 0, p: 50000, gachaWeight: 1, unique: true, d: "召喚師夢寐以求的戒指，能讓喚出的眷屬完全聽從號令。裝備後可在技能清單的「召喚術」挑選要召喚的怪物（含各階稀有種），且 28~48 級階段的召喚數量上限由 5 隻提升為 6 隻。" },
        "rng_earth": { n: "地靈戒指", type: "acc", slot: "ring", ac: 0, resEarth: 10, req: "all", safe: 0, p: 50000, gachaWeight: 1, d: "封存著厚土脈動的戒指，握之如握住一方大地。蘊含大地之力的戒指。" },
        "rng_water": { n: "水靈戒指", type: "acc", slot: "ring", ac: 0, resWater: 10, req: "all", safe: 0, p: 50000, gachaWeight: 1, d: "封存著潺潺水靈的戒指，指尖彷彿淌過清泉。蘊含流水之力的戒指。" },
        "rng_wind": { n: "風靈戒指", type: "acc", slot: "ring", ac: 0, resWind: 10, req: "all", safe: 0, p: 50000, gachaWeight: 1, d: "封存著疾風精魄的戒指，戴上便覺步履輕盈。蘊含疾風之力的戒指。" },
        "rng_fire": { n: "火靈戒指", type: "acc", slot: "ring", ac: 0, resFire: 10, req: "all", safe: 0, p: 50000, gachaWeight: 1, d: "封存著熾烈火魂的戒指，掌心始終餘有一絲溫熱。蘊含烈焰之力的戒指。" },
        "sherine_crystal": { n: "席琳結晶", type: "etc", p: 0, noUse: true, c: "c-sherine", gachaWeight: 0, d: "蘊含席琳力量的珍貴結晶，無法直接使用。可於席琳神殿向「伊奧」兌換指定部位的席琳遺骸（每件 1 顆）。（席琳的世界掉落限定）" },   // 🔮 潘朵拉抽不到(gachaWeight:0)、無法使用(noUse)、名稱同套裝綠光(c-sherine)
        "item_dragon_claw": { n: "飛龍的爪子", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "鋒利如刃的巨爪，仍殘留著撕裂風與骨的記憶，似乎與龍之谷深處的傳說有關……（無法使用）" },   // 🔧 卡瑞任務道具：飛龍 1% 掉落
        "item_lizard_horn": { n: "蜥蜴的角", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "邪惡蜥蜴額上隆起的尖角，泛著爬蟲類特有的冷光，似乎與龍之谷深處的傳說有關……（無法使用）" },   // 🔧 卡瑞任務道具：邪惡蜥蜴 0.01% 掉落
        "item_crystal_ball": { n: "水晶球", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "巫師用以窺探命運的水晶球，霧色在其中緩緩流轉，似乎與龍之谷深處的傳說有關……（無法使用）" },   // 🔧 卡瑞任務道具：巫師 0.01% 掉落
        "item_orc_amulet": { n: "妖魔戰士護身符", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "妖魔戰士臨陣時緊握於掌心的護身符，沾染著舊日的血與汗，似乎與龍之谷深處的傳說有關……（無法使用）" },   // 🔧 卡瑞任務道具：五種妖魔各 0.01% 掉落
        "item_death_oath": { n: "死亡誓約", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "自強盜屍身上奪來、以鮮血簽署的死亡契約，字裡行間仍透著怨毒。可在沉默洞穴交給「倫得」交換影子手套。（無法使用）" },   // 🔧 任務道具：強盜 1% 掉落
        "item_orc_elder_head": { n: "妖魔長老首級", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "妖魔法師頂禮膜拜、供奉於暗壇的妖魔長老首級。可在沉默洞穴交給「康」交換影子面具。（無法使用）" },   // 🔧 任務道具：妖魔法師 1% 掉落
        "item_yeti_head": { n: "雪怪首級", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "自暴雪中的雪怪斬下、猶帶寒霜的巨大首級。可在沉默洞穴交給「布魯迪卡」交換影子長靴。（無法使用）" },   // 🔧 任務道具：雪怪 1% 掉落
        "item_mastery_proof": { n: "精通之證", p: 0, c: "text-blue-300", noUse: true, noSell: true, gachaWeight: 0, d: "證明你已踏碎自身極限的徽記，灼灼生輝。帶回威頓村交給「漢」，便能開啟職業精通之路。（唯一・無法存入倉庫・無法販售）" },   // 🏅 精通任務道具
        "item_dragon_egg": { n: "頑皮幼龍蛋", type: "etc", req: "all", p: 0, c: "text-amber-300", eff: "dragonegg", eggPet: "頑皮龍", gachaWeight: 0, d: "一顆尚在沉睡的幼龍蛋，蛋殼下彷彿有火在躍動。擊敗安塔瑞斯／法利昂／巴拉卡斯／林德拜爾時有機率拾獲。身上持有任意幼龍蛋時，於任何野外地圖有極微小機率引來傳說中的風龍「林德拜爾」；也可以直接使用——若寵物保管未滿，將消耗蛋並孵出 頑皮龍 一隻。可存入倉庫；蛋全數收進倉庫或賣出後，便不再引來風龍。" },   // 🐉 v3.7.56 林德拜爾遭遇觸發道具＋定向孵化（頑皮龍）·四大龍 10% 掉落（js/05）·不再唯一/禁倉
        "item_dragon_egg2": { n: "淘氣幼龍蛋", type: "etc", req: "all", p: 0, c: "text-sky-300", eff: "dragonegg", eggPet: "淘氣龍", gachaWeight: 0, d: "一顆尚在沉睡的幼龍蛋，蛋殼下彷彿有風在流動。擊敗安塔瑞斯／法利昂／巴拉卡斯／林德拜爾時有機率拾獲。身上持有任意幼龍蛋時，於任何野外地圖有極微小機率引來傳說中的風龍「林德拜爾」；也可以直接使用——若寵物保管未滿，將消耗蛋並孵出 淘氣龍 一隻。可存入倉庫；蛋全數收進倉庫或賣出後，便不再引來風龍。" },   // 🐉 v3.7.56 新蛋：定向孵化（淘氣龍）·四大龍 10% 掉落（js/05）·同樣觸發林德拜爾遭遇
        "item_soul_orb": { n: "靈魂之球", type: "misc", p: 0, c: "text-slate-200", eff: "soulorb", gachaWeight: 0, d: "蘊含微弱靈魂之力的水晶球，貼近耳邊彷彿能聽見低語。據說與某把失去魔力的魔杖共鳴時，能喚回沉睡的傳說。" },   // 🔧 巴列斯任務道具（可使用）
        // ===== 🐉 v3.7.57 安塔瑞斯副本：材料／魔眼／裝備 =====
        "mat_antharas_scale": { n: "安塔瑞斯之鱗", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "從被侵蝕的安塔瑞斯身上剝落的巨鱗。可在威頓村向「萊利的輔佐官」兌換積分。" },
        "mat_antharas_bone":  { n: "安塔瑞斯之骨", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "被侵蝕的安塔瑞斯的骨片，堅硬如岩。可在威頓村向「萊利的輔佐官」兌換積分。" },
        "mat_antharas_claw":  { n: "安塔瑞斯之爪", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "被侵蝕的安塔瑞斯的利爪，仍殘留大地之力。可在威頓村向「萊利的輔佐官」兌換積分。" },
        "mat_antharas_blood": { n: "安塔瑞斯之血", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "被侵蝕的安塔瑞斯的龍血，黏稠而灼熱。可在威頓村向「萊利的輔佐官」兌換積分。" },
        "mat_antharas_flesh": { n: "安塔瑞斯之肉", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "被侵蝕的安塔瑞斯的龍肉，蘊含濃烈的侵蝕氣息。可在威頓村向「萊利的輔佐官」兌換積分。" },
        "mat_antharas_fang":  { n: "安塔瑞斯之牙", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "被侵蝕的安塔瑞斯的龍牙，足以貫穿鋼鐵。可在威頓村向「萊利的輔佐官」兌換積分。" },
        "mat_antharas_eye":   { n: "安塔瑞斯之眼", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "被侵蝕的安塔瑞斯的龍眼，凝視深處彷彿仍有意識。可在威頓村向「萊利的輔佐官」兌換積分。" },
        "mat_antharas_heart": { n: "安塔瑞斯之心", type: "etc", p: 1000, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "被侵蝕的安塔瑞斯的心臟，仍在微微搏動。只能用於製作安塔瑞斯系列裝備，無法兌換積分。" },
        "item_sealed_earth_eye": { n: "受封印 地龍之魔眼", type: "etc", p: 1000, c: "text-purple-300", noUse: true, gachaWeight: 0, d: "封印著地龍魔力的魔眼，隱約透出土黃色的光。帶去威頓村找「米米」，支付代價便能解開封印。" },
        "acc_earth_dragon_eye": { n: "地龍之魔眼", type: "acc", slot: "eye", relic: false, noEnhance: true, req: "all", safe: 0, p: 100000, gachaWeight: 0, eyePetrify: true, d: "解開封印的地龍魔眼，裝備於魔眼欄。裝備者被石化時觸發：立即解除石化，接下來 10 分鐘內免疫石化，並且額外傷害 +5、額外命中 +5、ER +5。每 1 小時最多觸發 1 次。" },
        "arm_ancient_dragonscale_earth": { n: "古代地龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 11, resEarth: 50, req: "knight", safe: 4, p: 786000, gachaWeight: 0, d: "以遠古工法重鑄的地龍鱗盔甲，鱗片間流動著大地的守護之力。" },
        "arm_ancient_dragonscale_water": { n: "古代水龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 11, resWater: 50, req: "knight", safe: 4, p: 786000, gachaWeight: 0, d: "以遠古工法重鑄的水龍鱗盔甲，鱗片間流動著深海的守護之力。" },
        "arm_ancient_dragonscale_fire":  { n: "古代火龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 11, resFire: 50, req: "knight", safe: 4, p: 786000, gachaWeight: 0, d: "以遠古工法重鑄的火龍鱗盔甲，鱗片間流動著烈焰的守護之力。" },
        "arm_ancient_dragonscale_wind":  { n: "古代風龍鱗盔甲", legend: true, type: "arm", slot: "armor", ac: 11, resWind: 50, req: "knight", safe: 4, p: 786000, gachaWeight: 0, d: "以遠古工法重鑄的風龍鱗盔甲，鱗片間流動著暴風的守護之力。" },
        "arm_antharas_power":  { n: "安塔瑞斯的力量", legend: true, type: "arm", slot: "armor", ac: 10, resEarth: 50, immPoison: true, hpR: 28, dr: 3, drEnFrom7Max3: true, str: 1, con: 1, req: "knight,warrior", safe: 4, p: 1000000, gachaWeight: 0, d: "凝聚安塔瑞斯之力鍛成的盔甲，穿上便湧起大地般沉穩的力量。地屬性抗性 +50；免疫中毒；HP 自然恢復量 +28；力量 +1；體質 +1；傷害減免 +3（強化 +7 起每 +1 再增加 1，最高 +6）。" },
        "arm_antharas_charm":  { n: "安塔瑞斯的魅惑", legend: true, type: "arm", slot: "armor", ac: 6, resEarth: 50, immPoison: true, hpR: 6, mpR: 15, dr: 3, drEnFrom7Max3: true, int: 1, wis: 1, req: "mage,illusion", safe: 4, p: 1000000, gachaWeight: 0, d: "凝聚安塔瑞斯魔性的長袍，龍魔力如低語般環繞穿戴者。地屬性抗性 +50；免疫中毒；HP 自然恢復量 +6；MP 自然恢復量 +15；智力 +1；精神 +1；傷害減免 +3（強化 +7 起每 +1 再增加 1，最高 +6）。" },
        "arm_antharas_spring": { n: "安塔瑞斯的泉源", legend: true, type: "arm", slot: "armor", ac: 8, resEarth: 50, immPoison: true, hpR: 12, mpR: 8, dr: 3, drEnFrom7Max3: true, str: 1, dex: 1, req: "elf,dark,dragon", safe: 4, p: 1000000, gachaWeight: 0, d: "凝聚安塔瑞斯生命力的皮甲，如泉水般源源不絕地滋養穿戴者。地屬性抗性 +50；免疫中毒；HP 自然恢復量 +12；MP 自然恢復量 +8；力量 +1；敏捷 +1；傷害減免 +3（強化 +7 起每 +1 再增加 1，最高 +6）。" },
        "arm_antharas_majesty": { n: "安塔瑞斯的霸氣", legend: true, type: "arm", slot: "armor", ac: 9, resEarth: 50, immPoison: true, hpR: 20, mpR: 4, dr: 3, drEnFrom7Max3: true, cha: 1, con: 1, req: "royal,dragon", safe: 4, p: 1000000, gachaWeight: 0, d: "凝聚安塔瑞斯威嚴的戰甲，舉手投足間散發王者般的霸氣。地屬性抗性 +50；免疫中毒；HP 自然恢復量 +20；MP 自然恢復量 +4；魅力 +1；體質 +1；傷害減免 +3（強化 +7 起每 +1 再增加 1，最高 +6）。" },
        "wpn_crimson_xbow": { n: "深紅之弩", type: "wpn", isBow: true, ranged: true, rapidfire: 80, w2h: true, dmgS: 3, dmgL: 3, hit: 1, dmgBonus: 0, req: "elf", safe: 6, p: 56000, gachaWeight: 0, procStatus: { kind: "bind", rate: 2, dur: 6 }, d: "染上龍血的深紅十字弓，弦音如龍吟低鳴。" },   // 🕸️ v3.7.75 依規格重寫（原 5/4·命中+5·傷害+5·連射70·妖精+黑妖·15萬）：連射80(一般限定)＋攻擊時 2% 束縛 6 秒（成敗仍看魔法命中／目標魔抗·頭目免疫）
        // ===== 🗼 傲慢之塔：道具／素材／裝備 =====（封印傳送符 item_pride_sealed_* 由 initPrideTalismans 程式化產生）
        "mat_chimera_snake":  { n: "奇美拉之皮(蛇)",   type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "奇美拉身上蛇之部位的堅韌皮革。可在傲慢之塔入口交給巴姆特，製作 詛咒的皮革(地)。（製作材料）" },
        "mat_chimera_dragon": { n: "奇美拉之皮(龍)",   type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "奇美拉身上龍之部位的堅韌皮革。可在傲慢之塔入口交給巴姆特，製作 詛咒的皮革(水)。（製作材料）" },
        "mat_chimera_goat":   { n: "奇美拉之皮(山羊)", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "奇美拉身上山羊之部位的堅韌皮革。可在傲慢之塔入口交給巴姆特，製作 詛咒的皮革(風)。（製作材料）" },
        "mat_chimera_lion":   { n: "奇美拉之皮(獅子)", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "奇美拉身上獅子之部位的堅韌皮革。可在傲慢之塔入口交給巴姆特，製作 詛咒的皮革(火)。（製作材料）" },
        "mat_cursed_leather_earth": { n: "詛咒的皮革(地)", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "被大地之詛咒浸染的皮革。製作 地屬性斗篷 的材料。（製作材料）" },
        "mat_cursed_leather_water": { n: "詛咒的皮革(水)", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "被流水之詛咒浸染的皮革。製作 水屬性斗篷 的材料。（製作材料）" },
        "mat_cursed_leather_wind":  { n: "詛咒的皮革(風)", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "被疾風之詛咒浸染的皮革。製作 風屬性斗篷 的材料。（製作材料）" },
        "mat_cursed_leather_fire":  { n: "詛咒的皮革(火)", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "被烈焰之詛咒浸染的皮革。製作 火屬性斗篷 的材料。（製作材料）" },
        "wpn_crystal_dagger": { n: "水晶短劍", type: "wpn", dmgS: 10, dmgL: 4, hit: 0, dmgBonus: 1, spd: 0.6, req: "all", safe: 6, p: 18000, gachaWeight: 10, d: "以整塊水晶細細打磨而成的鋒利匕首，刃緣割裂血肉，攻擊帶有出血。" },
        "arm_pride_medusa_shield": { n: "梅杜莎盾牌", type: "arm", slot: "shield", ac: 2, immStone: true, req: "all", safe: 4, p: 9600, gachaWeight: 10, block: 40, d: "盾面鑲嵌著梅杜莎之眼的圓盾，那凝視至今仍令觸者心生寒意。" },
        "acc_jenis_ring": { n: "潔尼斯戒指", legend: true, type: "acc", slot: "ring", ac: 0, immPoison: true, req: "all", safe: 0, p: 250000, gachaWeight: 1, d: "潔尼斯女王曾佩於指間的戒指，王者氣度不減。也免疫麻痺。" },
        "clk_pride_earth": { n: "地屬性斗篷", type: "arm", slot: "cloak", ac: 3, resEarth: 10, mpR: 2, req: "all", safe: 4, p: 150000, gachaWeight: 0 },
        "clk_pride_water": { n: "水屬性斗篷", type: "arm", slot: "cloak", ac: 3, resWater: 10, mpR: 2, req: "all", safe: 4, p: 150000, gachaWeight: 0 },
        "clk_pride_fire":  { n: "火屬性斗篷", type: "arm", slot: "cloak", ac: 3, resFire: 10,  mpR: 2, req: "all", safe: 4, p: 150000, gachaWeight: 0 },
        "clk_pride_wind":  { n: "風屬性斗篷", type: "arm", slot: "cloak", ac: 3, resWind: 10,  mpR: 2, req: "all", safe: 4, p: 150000, gachaWeight: 1 },
        "bot_dark": { n: "黑暗長靴", type: "arm", slot: "boots", ac: 2, dex: 1, req: "dark", safe: 6, p: 37000, gachaWeight: 10 },
        "hlm_dark": { n: "黑暗頭飾", type: "arm", slot: "helm", ac: 1, mpR: 3, req: "dark", safe: 4, p: 7000, gachaWeight: 30 },
        "shd_phantom_eye": { n: "幻象眼魔的心眼", type: "arm", slot: "shield", ac: 0, int: 1, mmp: 100, mpR: 2, immStone: true, block: 10, req: "mage", safe: 6, p: 127000, gachaWeight: 1, legend: true, d: "挖自幻象眼魔的核心之眼，凝視深處仍翻湧著扭曲的幻象。" },
        "clk_marcus": { n: "馬昆斯斗篷", legend: true, type: "arm", slot: "cloak", ac: 2, mhp: 60, hpR: 4, mr: 3, mrPerEn: 3, req: "mage,dark", safe: 6, p: 123000, gachaWeight: 1 },
        "clk_silver_light": { n: "銀光斗篷", type: "arm", slot: "cloak", ac: 2, mpR: 4, mr: 15, req: "mage,elf,dark", safe: 4, p: 63000, gachaWeight: 1 },
        "clk_lich": { n: "巫妖斗篷", legend: true, type: "arm", slot: "armor", ac: 7, mmp: 50, mpR: 15, mdmgEnFrom4: true, req: "mage", safe: 4, p: 363000, gachaWeight: 1, d: "巫妖未散的怨念縈繞其上的法袍，愈是浸染暗魔力愈見威能。" },
        "hlm_demon": { n: "惡魔頭盔", legend: true, type: "arm", slot: "helm",   ac: 2, req: "all", safe: 4, p: 25000, gachaWeight: 1, d: "惡魔套裝之一。" },
        "amr_demon": { n: "惡魔盔甲", legend: true, type: "arm", slot: "armor",  ac: 6, req: "all", safe: 4, p: 33000, gachaWeight: 1, d: "惡魔套裝之一。" },
        "glv_demon": { n: "惡魔手套", legend: true, type: "arm", slot: "gloves", ac: 2, req: "all", safe: 4, p: 18000, gachaWeight: 1, d: "惡魔套裝之一。" },
        "bot_demon": { n: "惡魔長靴", legend: true, type: "arm", slot: "boots",  ac: 3, req: "all", safe: 4, p: 18000, gachaWeight: 1, d: "惡魔套裝之一。" },
        "rng_mr": { n: "抗魔戒指", type: "acc", slot: "ring", ac: 0, mr: 5, req: "all", safe: 0, p: 10000, gachaWeight: 1 },
        "acc_demonbane": { n: "滅魔戒指", type: "acc", slot: "ring", ac: 0, mr: 10, req: "all", safe: 0, p: 100000, gachaWeight: 1, d: "蘊含滅魔之力的戒指。" },
        "acc_doro": { n: "多羅戒指", type: "acc", slot: "ring", ac: 0, mhp: 5, weightCap: 5, req: "all", safe: 0, p: 20000, gachaWeight: 20, d: "多羅的戒指。" },
        "hlm_mummy_crown": { n: "木乃伊王的王冠", type: "arm", slot: "helm", ac: 2, hpR: 3, dex: 2, req: "elf,dark", safe: 6, p: 163000, legend: true, gachaWeight: 1, d: "自木乃伊王枯朽的頭顱上取下的黃金王冠，千年塵封下金光依舊。" },
        "acc_118": { n: "守護戒指", type: "acc", slot: "ring", ac: 1, req: "all", safe: 0, p: 10000, gachaWeight: 1 },
        "acc_119": { n: "長者戒指", type: "acc", slot: "ring", ac: 0, req: "all", safe: 0, p: 10000, mmp: 10, mpR: 1, gachaWeight: 1 },
        "amu_str": { n: "力量項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 25000, str: 1, gachaWeight: 1 },
        "acc_120": { n: "敏捷項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 25000, dex: 1, gachaWeight: 1 },
        "acc_121": { n: "體質項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 25000, con: 1, gachaWeight: 1 },
        "amu_int": { n: "智力項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 25000, int: 1, gachaWeight: 1 },
        "acc_122": { n: "精神項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 25000, wis: 1, gachaWeight: 1 },
        "amu_cha": { n: "魅力項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 100000, cha: 1, gachaWeight: 1 },
        "amu_iris": { n: "艾莉絲項鍊", type: "acc", slot: "amulet", ac: 0, cha: 3, req: "mage", safe: 0, p: 300000, legend: true, gachaWeight: 1, d: "冷酷的艾莉絲貼身佩戴的項鍊，鍊墜映著她無情的眼神。" },
        "acc_123": { n: "妖魔戰士項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 5000, mhp: 20, gachaWeight: 20 },
        "acc_124": { n: "守護項鍊", type: "acc", slot: "amulet", ac: 1, req: "all", safe: 0, p: 15000, gachaWeight: 1 },
        "acc_125": { n: "長老項鍊", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 20000, mmp: 30, mpR: 1, gachaWeight: 1 },
        "acc_126": { n: "抗魔項鍊", type: "acc", slot: "amulet", ac: 0, mr: 5, req: "all", safe: 0, p: 15000, gachaWeight: 1 },
        "acc_127": { n: "老舊的身體腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 3000, mhp: 30, gachaWeight: 20 },
        "acc_128": { n: "老舊的精神腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 3000, mmp: 30, gachaWeight: 20 },
        "acc_129": { n: "老舊的靈魂腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 3000, mhp: 15, mmp: 15, gachaWeight: 20 },
        "blt_body": { n: "身體腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 7000, mhp: 50, gachaWeight: 10 },
        "blt_dark": { n: "黑暗腰帶", type: "acc", slot: "belt", ac: 1, req: "dark", safe: 0, p: 21000, gachaWeight: 10 },
        // ===== 魔獸軍王巴蘭卡：掉落防具（武官系列／巴蘭卡系列） =====
        "hlm_official":   { n: "武官頭盔", type: "arm", slot: "helm",   ac: 2, mmp: 10,                 req: "knight,dark",     safe: 6, p: 9600,   gachaWeight: 10 },
        "hlm_baranka":    { n: "巴蘭卡頭盔", type: "arm", slot: "helm", ac: 2, con: 1, cha: -1,         req: "knight,elf,dark", safe: 4, p: 39600,  gachaWeight: 1 },
        "amr_official":   { n: "武官護鎧", type: "arm", slot: "armor",  ac: 4, mhp: 50, hpR: 10,        req: "knight",          safe: 6, p: 24600,  gachaWeight: 10 },
        "amr_baranka":    { n: "巴蘭卡盔甲", type: "arm", slot: "armor", ac: 8, str: 1, dex: 1, cha: -2, req: "knight",          safe: 4, p: 134600, gachaWeight: 1 },
        "glv_baranka":    { n: "巴蘭卡手套", type: "arm", slot: "gloves", ac: 3,                        req: "knight,elf,dark", safe: 4, p: 73000,  gachaWeight: 1 },
        "bot_baranka":    { n: "巴蘭卡長靴", type: "arm", slot: "boots", ac: 3,                         req: "all",             safe: 4, p: 63000,  gachaWeight: 1 },
        // ===== 四大軍王套裝（傳統套裝；4 件齊：HP+30/MP+30/HP恢復+10/MP恢復+10/魅力+3） =====
        "bot_kingbeast":    { n: "魔獸軍王長靴", legend: true, type: "arm", slot: "boots",  ac: 4, req: "all", safe: 6, p: 133000, gachaWeight: 1, d: "四大軍王套裝之一。" },
        "clk_kingnecro":    { n: "冥法軍王斗篷", legend: true, type: "arm", slot: "cloak",  ac: 5, req: "all", safe: 4, p: 153000, gachaWeight: 1, d: "四大軍王套裝之一。" },
        "amr_kinglaw":      { n: "法令軍王長袍", legend: true, type: "arm", slot: "armor",  ac: 8, req: "all", safe: 6, p: 178000, gachaWeight: 1, d: "四大軍王套裝之一。" },
        "glv_kingassassin": { n: "暗殺軍王手套", legend: true, type: "arm", slot: "gloves", ac: 4, req: "all", safe: 6, p: 145000, gachaWeight: 1, d: "四大軍王套裝之一。" },
        // ===== 冥法軍訓練場：掉落防具（神官系列／黑暗披肩） =====
        "hlm_priest":    { n: "神官頭飾", type: "arm", slot: "helm",   ac: 1, mhp: 10, mpR: 1, req: "mage,elf", safe: 6, p: 15900, gachaWeight: 10 },
        "amr_priest":    { n: "神官法袍", type: "arm", slot: "armor",  ac: 6, mhp: 10, mpR: 5, req: "mage,elf", safe: 6, p: 25900, gachaWeight: 10 },
        "amr_dark_cape": { n: "黑暗披肩", type: "arm", slot: "armor",  ac: 5, hpR: 5,          req: "dark",     safe: 6, p: 10000, gachaWeight: 20 },
        "bot_priest":    { n: "神官長靴", type: "arm", slot: "boots",  ac: 2, mhp: 5,          req: "mage,elf", safe: 6, p: 18900, gachaWeight: 10 },
        "clk_priest":    { n: "神官斗篷", type: "arm", slot: "cloak",  ac: 2, mhp: 10, mpR: 3, req: "mage,elf", safe: 4, p: 18900, gachaWeight: 10 },
        "glv_priest":    { n: "神官手套", type: "arm", slot: "gloves", ac: 0, mhp: 5,  mpR: 1, req: "mage,elf", safe: 6, p: 15500, gachaWeight: 10 },
        // ===== 巨蟻女皇：掉落斗篷（MR 隨強化成長） =====
        "clk_antqueen_gold":   { n: "巨蟻女皇的金翅膀", legend: true, type: "arm", slot: "cloak", ac: 4, mhp: 50,                mr: 5, mrPerEn: 2, req: "knight,elf",   safe: 4, p: 337200, gachaWeight: 1 },
        "clk_antqueen_silver": { n: "巨蟻女皇的銀翅膀", legend: true, type: "arm", slot: "cloak", ac: 2, mmp: 50, wis: 1, mpR: 3, mr: 5, mrPerEn: 2, req: "elf,mage,dark", safe: 4, p: 337200, gachaWeight: 1 },
        "acc_130": { n: "精神腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 7000, mmp: 50, gachaWeight: 10 },
        "acc_131": { n: "靈魂腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 7000, mhp: 25, mmp: 25, gachaWeight: 10 },
        "acc_132": { n: "多羅皮帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 2000, weightCap: 160, gachaWeight: 10 },   // 🔧 取消體質+1，改為負重上限+160；全職業可裝備
        "acc_133": { n: "歐吉皮帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 15000, weightCap: 320, gachaWeight: 1 },   // 🔧 取消力量+1，改為負重上限+320
        "acc_134": { n: "勇敢皮帶", type: "acc", slot: "belt", ac: 1, req: "knight", safe: 0, p: 2000, mhp: 30, gachaWeight: 10 },
        "acc_135": { n: "光明身體腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 11000, mhp: 50, hpR: 1, gachaWeight: 0 },
        "acc_136": { n: "光明精神腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 11000, mmp: 50, mpR: 1, gachaWeight: 0 },
        "acc_137": { n: "光明靈魂腰帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 11000, mhp: 20, mmp: 20, hpR: 1, mpR: 1, gachaWeight: 0 },
        "acc_138": { n: "守護皮帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 11000, weightCap: 130, gachaWeight: 1 },   // 🔧 AC改為0，增加負重上限+130
		"blt_mr": { n: "抗魔皮帶", type: "acc", slot: "belt", ac: 0, req: "all", safe: 0, p: 11000, weightCap: 130, gachaWeight: 1 },   // 🔧 取消MR+5，增加負重上限+130
        "blt_titan": { n: "泰坦皮帶", type: "acc", slot: "belt", ac: 0, weightCap: 500, req: "all", safe: 0, p: 92000, gachaWeight: 1, d: "傳說中泰坦束於腰間的巨帶，承載著撼動山岳之力。" },
        "blt_giant_ring": { n: "古代巨人戒指", type: "acc", slot: "belt", legend: true, ac: 2, str: 1, req: "all", safe: 0, p: 352000, gachaWeight: 1, d: "雖名為戒指，實為古代巨人腰間的一環，於常人已是一圈鐵帶（部位：腰帶）。" },
        // ===== 🌑 黑暗妖精聖地（依《黑暗妖精聖地.md》·v3.3.33）：任務道具／材料／裝備／真．冥皇套裝 =====
        "item_dk_book":        { n: "死亡騎士之書", type: "etc", p: 0, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "記載死亡騎士祕儀的古書。交給長老會議廳的 真．冥皇丹特斯，可選擇進入 黑暗妖精聖地 或 受詛咒的黑暗妖精聖地（每次進入消耗 1 本）。在受詛咒的黑暗妖精聖地擊敗吉爾塔斯後，牠每次復活會再消耗 1 本；身上沒有時將被逐出。" },
        "item_giltas_seal":    { n: "吉爾塔斯的封印", type: "etc", p: 0, c: "text-red-300", noUse: true, noSell: true, gachaWeight: 0, d: "封印著吉爾塔斯之力的印記。交給 真．冥皇丹特斯 後，會被傳送至 崩壞的長老會議廳（消耗 1 個）。在廳中擊敗冥皇丹特斯後，牠每次復活會再消耗 1 個；身上沒有時將被逐出。" },
        "mat_ascetic_classic": { n: "修行者經典", type: "etc", p: 5000, gachaWeight: 0, d: "修行者傳承的典籍，鍛造 真．冥皇 系列防具的材料。" },
        "mat_summonorb_core":  { n: "召喚球之核", type: "etc", p: 10000, gachaWeight: 0, d: "凝聚召喚之力的核心。搭配 4 個召喚球碎片，可請亞提利歐合成 完整的召喚球 或 真．冥皇製作防具秘笈。" },
        "mat_summonorb_shard": { n: "召喚球碎片", type: "etc", p: 2000, gachaWeight: 0, d: "破碎的召喚球殘片，集齊四片可供亞提利歐合成。" },
        "item_summonorb_full": { n: "完整的召喚球", type: "etc", p: 0, c: "text-cyan-300", noUse: true, noSell: true, gachaWeight: 0, d: "完整無缺的召喚球。挑戰吉爾塔斯期間若持有，以任何方式離開（回村、瞬移、切換地圖或戰敗）都會消耗 1 顆，使吉爾塔斯的 HP 保持不變（暫停回血）直到你再次進入；若身上沒有完整的召喚球，重新進入將面對全新的吉爾塔斯。" },
        "mat_emperor_manual":  { n: "真．冥皇製作防具秘笈", type: "etc", p: 0, c: "text-amber-300", noSell: true, gachaWeight: 0, d: "記載 真．冥皇 系列防具鍛造祕法的秘笈，每鍛造一件消耗 1 本。" },
        "mat_de_soul_crystal": { n: "黑暗妖精的靈魂水晶", type: "etc", p: 3000, gachaWeight: 0, d: "受詛咒的黑暗妖精殘留的靈魂結晶，鍛造 真．冥皇 系列防具的材料。" },
        "wpn_giltas_sword":  { n: "吉爾塔斯之劍", type: "wpn", w2h: true, legend: true, dmgS: 43, dmgL: 53, hit: 7, dmgBonus: 30, spd: 1, req: "knight,dragon", safe: 0, p: 990000, gachaWeight: 0, eff: "cleave", ignHardSkin: true, str: 2, con: 1, cha: 2, d: "吉爾塔斯魔力凝成的雙手魔劍，劍身纏繞著異界的沙塵與血氣。切割（一般限定）、貫穿、力量+2、體質+1、魅力+2；擊殺敵人後，依邪惡值提高額外傷害，滿邪惡時額外傷害+10，持續10秒。" },
"wpn_giltas_wand":   { n: "吉爾塔斯魔杖", type: "wpn", w2h: true, legend: true, dmgS: 15, dmgL: 15, hit: 0, dmgBonus: 0, spd: 1.0, req: "mage,illusion", safe: 0, p: 990000, gachaWeight: 0, eff: "magicburst", int: 2, wis: 2, mpR: 15, d: "吉爾塔斯魔力凝成的雙手魔杖，杖端迴盪著異界的低語。魔爆（一般限定）、貫穿、智力+2、精神+2、MP自然恢復量+15；擊殺敵人後，依邪惡值提高額外魔法點數，滿邪惡時額外魔法點數+20，持續10秒。" },
        "wpn_rotten_longbow":{ n: "腐壞的長弓", type: "wpn", w2h: true, isBow: true, ranged: true, legend: true, dmgS: 5, dmgL: 4, hit: 7, dmgBonus: 5, rapidfire: 100, ignHardSkin: true, req: "elf,illusion", safe: 6, p: 850000, gachaWeight: 1, d: "在聖地深處腐朽多年的長弓，弓身雖朽、殺意未減。連射100%（一般限定）、貫穿（需裝備箭矢）。" },
        "wpn_cursed_emperor_blade": { n: "受詛咒的真．冥皇執行劍", type: "wpn", legend: true, dmgS: 19, dmgL: 22, hit: 4, dmgBonus: 0, spd: 1, ignHardSkin: true, hpR: -30, req: "royal,knight,elf,mage,dark", safe: 6, p: 990000, gachaWeight: 0, d: "冥皇的詛咒滲入劍身的漆黑執行劍，握柄傳來刺骨的死寂。反擊（一般限定）、居合（一般限定）、貫穿、HP自然恢復量-30；裝備時變身為 死亡騎士。" },   // 🌑 v3.4.0 裝備時變身死亡騎士＝js/02 _setPoly 管線；反擊+居合＝WEAPON_TAGS 雙標籤（js/10）
        "shd_rebel":    { n: "反叛者的盾牌", type: "arm", slot: "shield", legend: true, ac: 3, hitstunReduce: 5, dmgReduceProc: { rate: 1, per: 2, amt: 50 }, req: "royal,knight", safe: 4, p: 700000, gachaWeight: 1, d: "反叛者們代代相傳的堅盾。硬質減少0.5秒；受到傷害時 1% 機率使該次傷害減少 50，每強化 +1 機率 +2%。" },
        "shd_official": { n: "武官之盾", type: "arm", slot: "shield", ac: 3, mhp: 10, hpR: 4, req: "knight,dragon", safe: 6, p: 80000, gachaWeight: 10, d: "武官配發的制式盾牌。HP+10、HP自然恢復量+4。" },
        "amu_pain":     { n: "苦痛項鍊", type: "acc", slot: "amulet", ac: 0, stunResist: 50, hpR: -5, req: "all", safe: 0, p: 20000, gachaWeight: 30, d: "凝聚苦痛意志的項鍊。50% 機率免疫暈眩；HP自然恢復量-5。" },
        "amu_doom":     { n: "厄運項鍊", type: "acc", slot: "amulet", ac: 0, hitstunReduce: 2.5, mpR: -5, req: "all", safe: 0, p: 20000, gachaWeight: 30, d: "散發不祥氣息的項鍊。硬質減少0.25秒；MP自然恢復量-5。" },
        "ear_cursed_black": { n: "受詛咒的黑色耳環", type: "etc", p: 60000, gachaWeight: 0, d: "受詛咒的黑暗妖精遺留的黑色耳環，環上縈繞著微弱的怨念。經亞提利歐以淨化藥水洗去怨念後，可重生為靈魂耳環。" },
        "rng_sage":     { n: "賢者之戒", type: "acc", slot: "ring", ac: 0, int: 1, wis: 1, mhp: 30, req: "all", safe: 0, p: 2000000, gachaWeight: 1, d: "傳說中賢者佩戴的戒指，助人凝神靜思。智力+1、精神+1、HP上限+30。" },
        "mat_purify_potion": { n: "淨化藥水", type: "etc", p: 3000, gachaWeight: 0, d: "融合土／風／水／火四大元素氣息與品質綠寶石煉成的淨化之水，能洗去受詛咒黑色耳環上的怨念。亞提利歐製作靈魂耳環的材料。" },
        "ear_soul_mage":    { n: "靈魂耳環(法師)", type: "acc", slot: "ear", ac: 0, mmp: 30, mpR: 2, mdmg: 1, req: "mage,illusion,elf", safe: 0, p: 30000, gachaWeight: 0, d: "淨化怨念後重生的靈魂耳環，蘊含充沛魔力。MP上限+30、MP自然恢復量+2、魔法傷害+1。" },
        "ear_soul_fighter": { n: "靈魂耳環(鬥士)", type: "acc", slot: "ear", ac: 0, mhp: 20, mmp: 10, meleeDmg: 1, req: "dark,warrior", safe: 0, p: 30000, gachaWeight: 0, d: "淨化怨念後重生的靈魂耳環，剛柔並濟。HP上限+20、MP上限+10、近距離傷害+1。" },
        "ear_soul_knight":  { n: "靈魂耳環(騎士)", type: "acc", slot: "ear", ac: 0, mhp: 40, hpR: 3, meleeHit: 1, req: "royal,knight,dragon", safe: 0, p: 30000, gachaWeight: 0, d: "淨化怨念後重生的靈魂耳環，堅毅不拔。HP上限+40、HP自然恢復量+3、近距離命中+1。" },
        "clk_emperor":  { n: "真．冥皇披風", type: "arm", slot: "cloak",  legend: true, set: "emperor", ac: 7,  req: "royal,knight,dark,dragon,warrior", safe: 0, p: 500000, gachaWeight: 0, d: "真．冥皇套裝之一。集齊披風／鎧甲／面甲／護手／鋼靴五件：防禦-20、HP+100、MP+20、HP自然恢復量+10、攻擊速度額外+30%（可與加速、勇敢藥水堆疊）、額外傷害+5。" },
        "amr_emperor":  { n: "真．冥皇鎧甲", type: "arm", slot: "armor",  legend: true, set: "emperor", ac: 10, req: "royal,knight,dark,dragon,warrior", safe: 0, p: 500000, gachaWeight: 0, d: "真．冥皇套裝之一。集齊披風／鎧甲／面甲／護手／鋼靴五件：防禦-20、HP+100、MP+20、HP自然恢復量+10、攻擊速度額外+30%（可與加速、勇敢藥水堆疊）、額外傷害+5。" },
        "hlm_emperor":  { n: "真．冥皇面甲", type: "arm", slot: "helm",   legend: true, set: "emperor", ac: 6,  req: "royal,knight,dark,dragon,warrior", safe: 0, p: 500000, gachaWeight: 0, d: "真．冥皇套裝之一。集齊披風／鎧甲／面甲／護手／鋼靴五件：防禦-20、HP+100、MP+20、HP自然恢復量+10、攻擊速度額外+30%（可與加速、勇敢藥水堆疊）、額外傷害+5。" },
        "glv_emperor":  { n: "真．冥皇護手", type: "arm", slot: "gloves", legend: true, set: "emperor", ac: 5,  req: "royal,knight,dark,dragon,warrior", safe: 0, p: 500000, gachaWeight: 0, d: "真．冥皇套裝之一。集齊披風／鎧甲／面甲／護手／鋼靴五件：防禦-20、HP+100、MP+20、HP自然恢復量+10、攻擊速度額外+30%（可與加速、勇敢藥水堆疊）、額外傷害+5。" },
        "bot_emperor":  { n: "真．冥皇鋼靴", type: "arm", slot: "boots",  legend: true, set: "emperor", ac: 7,  req: "royal,knight,dark,dragon,warrior", safe: 0, p: 500000, gachaWeight: 0, d: "真．冥皇套裝之一。集齊披風／鎧甲／面甲／護手／鋼靴五件：防禦-20、HP+100、MP+20、HP自然恢復量+10、攻擊速度額外+30%（可與加速、勇敢藥水堆疊）、額外傷害+5。" },
        "potion_heal": { n: "紅色藥水", type: "pot", p: 37, c: "text-red-300", d: "亞丁冒險者最常攜帶的治癒藥水，飲用後能恢復少量體力。", val: 15, valMin: 10, valMax: 20, gachaWeight: 0 },
        "potion_strong": { n: "橙色藥水", type: "pot", req: "all", p: 200, c: "text-orange-300", d: "以濃縮藥草調製的治癒藥水，能迅速修復較重的傷勢。", val: 40, valMin: 30, valMax: 50, gachaWeight: 0 },
        "potion_ult": { n: "白色藥水", type: "pot", req: "all", p: 600, c: "text-white", d: "散發柔和白光的高級治癒藥水，能為瀕危的冒險者帶來生機。", val: 70, valMin: 60, valMax: 80, gachaWeight: 0 },
        "potion_haste": { n: "自我加速藥水", type: "pot", req: "all", p: 200, c: "text-green-300", d: "飲下後身體變得輕盈，戰鬥動作也隨之加快。", eff: "haste", dur: 300, gachaWeight: 0 },
        "potion_blue": { n: "藍色藥水", type: "pot", req: "all", p: 1046, c: "text-blue-300", d: "以珍稀藍草煉製的藥水，精神越堅定，越能從中汲取充沛魔力。", eff: "blue", dur: 600, gachaWeight: 0 },
        "potion_brave": { n: "勇敢藥水", type: "pot", req: "knight,dragon,warrior,royal", p: 880, c: "text-purple-300", d: "激起戰士血性的秘藥，使近身作戰者以更勇猛的步調迎敵。", eff: "brave", dur: 300, gachaWeight: 0 },
        "new_item_139": { n: "精靈餅乾", type: "pot", req: "elf", p: 1980, c: "text-yellow-200", d: "受精靈祝福的餅乾，妖精食用後能與風的律動同步。", eff: "elfcookie", dur: 300, gachaWeight: 0 },
        "new_item_140": { n: "慎重藥水", type: "pot", req: "mage,illusion", p: 600, c: "text-purple-300", d: "使思緒沉靜澄明的秘藥，能增進施法者的魔力運行與恢復。", eff: "cautious", dur: 300, gachaWeight: 0 },
        "new_item_141": { n: "安特的水果", type: "pot", req: "all", p: 360, c: "text-green-300", d: "由安特孕育的奇異果實，飽含森林的生命力。", gachaWeight: 0 },
        "scroll_poly": { n: "變形卷軸", type: "scroll", req: "all", p: 1300, c: "text-gray-300", d: "記載古老變形術的卷軸，能讓使用者暫時化為與自身歷練相稱的姿態。", eff: "poly", dur: 1800, gachaWeight: 0 },
        "scroll_magicbarrier": { n: "魔法卷軸(魔法屏障)", type: "scroll", req: "all", p: 1500, c: "text-cyan-300", d: "封存魔法屏障的卷軸，展開後能抵擋一次來襲的技能。", eff: "magicbarrier", gachaWeight: 0 },
        "scroll_teleport": { n: "瞬間移動卷軸", type: "scroll", req: "all", p: 82, c: "text-sky-300", d: "使用後發動傳送術", eff: "teleport_scroll", gachaWeight: 0 },
        "scroll_revive": { n: "復活卷軸", type: "scroll", req: "all", p: 1000, c: "text-yellow-300", d: "蘊藏復甦之力的神聖卷軸，能使倒下的冒險者或傭兵在原地重新站起。", gachaWeight: 0 },
        "item_blueflute": { n: "藍色長笛", p: 1, c: "text-blue-300", d: "試煉所需的材料。", gachaWeight: 0 },   // 🔧 試煉材料統一藍色
        "item_ancientkey": { n: "古代鑰匙", p: 1, c: "text-blue-300", d: "試煉所需的材料。", gachaWeight: 0 },   // 🔧 試煉材料統一藍色
        "item_nightvision": { n: "夜之視野", p: 1, c: "text-blue-300", d: "凝視黑暗也不失方向的祕術之眼，試煉所需的材料。", gachaWeight: 0 },
        "candle": { n: "回憶蠟燭", type: "misc", req: "all", p: 100000, c: "text-red-500", d: "點擊使用：六大屬性回到 Lv1，於資訊面板以 +／- 重新分配能力點數，按「確認」才生效（按「取消」則不消耗蠟燭）。同時退還已使用的萬能藥；若重置後魅力不足，超出上限的出戰寵物會自動返回保管。", eff: "reset", gachaWeight: 0 },
        "panacea_str": { n: "萬能藥(STR)", type: "misc", req: "all", p: 10000, c: "text-pink-300", d: "傳說中能重塑筋骨的靈藥。", eff: "panacea", batchUse: true, pstat: "str", gachaWeight: 5 },
        "panacea_dex": { n: "萬能藥(DEX)", type: "misc", req: "all", p: 10000, c: "text-pink-300", d: "飲下後身手如風的靈藥。", eff: "panacea", batchUse: true, pstat: "dex", gachaWeight: 5 },
        "panacea_con": { n: "萬能藥(CON)", type: "misc", req: "all", p: 10000, c: "text-pink-300", d: "淬鍊體魄、固本培元的靈藥。", eff: "panacea", batchUse: true, pstat: "con", gachaWeight: 5 },
        "panacea_int": { n: "萬能藥(INT)", type: "misc", req: "all", p: 10000, c: "text-pink-300", d: "啟迪心智、開悟靈光的靈藥。", eff: "panacea", batchUse: true, pstat: "int", gachaWeight: 5 },
        "panacea_wis": { n: "萬能藥(WIS)", type: "misc", req: "all", p: 10000, c: "text-pink-300", d: "沉澱心神、堅定意志的靈藥。", eff: "panacea", batchUse: true, pstat: "wis", gachaWeight: 5 },
        "panacea_white": { n: "純白的萬能藥", type: "misc", req: "all", p: 5000, c: "text-slate-100", noUse: true, d: "純白無瑕、尚未沾染屬性的萬能藥原料（無法直接使用，僅作製作材料）。使用回憶蠟燭重置配點時，依已使用過的萬能藥瓶數獲得。可在象牙塔的塔斯處，以 3 個製作成任一屬性的萬能藥。", gachaWeight: 0 },
        "panacea_cha": { n: "萬能藥(CHA)", type: "misc", req: "all", p: 10000, c: "text-pink-300", d: "令人顧盼生輝、風采動人的靈藥。", eff: "panacea", batchUse: true, pstat: "cha", gachaWeight: 5 },
        
        // ===== 🐾 夥伴系統 v2（v3.2.17）：誘捕道具（使用後獲得對應誘捕狀態 600 秒·期間擊殺對應動物→寵物保管獲得基本等級寵物並失去狀態）=====
        //   🚫 舊項圈系統（哨子/8種項圈/肉/舊進化果實）已全數移除；舊存檔項圈由 petMigrateLegacy 轉換為寵物。
        "item_eye_meat":      { n: "漂浮之眼肉",       type: "pot", req: "all", p: 100, c: "text-pink-300",    eff: "petlure", lure: "lure_general",  dur: 600, d: "漂浮之眼身上切下的奇特肉塊，散發野獸無法抗拒的氣味。使用後獲得「一般誘捕」600秒：期間擊殺 狼／牧羊犬／杜賓狗／哈士奇／熊／貓／浣熊／聖伯納犬／狐狸／小獵犬／柯利 時，寵物保管將獲得基本等級的該寵物並失去此狀態。", gachaWeight: 0 },
        "item_carrot":        { n: "胡蘿蔔",           type: "pot", req: "all", p: 100, c: "text-orange-300",  eff: "petlure", lure: "lure_rabbit",   dur: 600, d: "水靈飽滿的胡蘿蔔，暴走兔見了會不顧一切衝過來。使用後獲得「暴走兔誘捕」600秒：期間擊殺 暴走兔 時，寵物保管將獲得基本等級的暴走兔並失去此狀態。", gachaWeight: 0 },
        "item_tiger_feed":    { n: "虎男誘食",         type: "pot", req: "all", p: 100, c: "text-amber-300",   eff: "petlure", lure: "lure_tiger",    dur: 600, d: "馴獸師特製的腥香餌食，能喚醒猛虎心中的認主之念。使用後獲得「虎男誘捕」600秒：期間擊殺 老虎 時，寵物保管將獲得基本等級的虎男並失去此狀態。", gachaWeight: 0 },
        "item_kangaroo_feed": { n: "袋鼠的飼料",       type: "pot", req: "all", p: 100, c: "text-lime-300",    eff: "petlure", lure: "lure_kangaroo", dur: 600, d: "混入香草的特調飼料，袋鼠聞了便會收起拳頭。使用後獲得「袋鼠誘捕」600秒：期間擊殺 袋鼠 時，寵物保管將獲得基本等級的袋鼠並失去此狀態。", gachaWeight: 0 },
        "item_panda_feed":    { n: "熊貓的飼料",       type: "pot", req: "all", p: 100, c: "text-slate-100",   eff: "petlure", lure: "lure_panda",    dur: 600, d: "以嫩竹筍壓成的飼料磚，是熊貓無法拒絕的美味。使用後獲得「熊貓誘捕」600秒：期間擊殺 熊貓 時，寵物保管將獲得基本等級的熊貓並失去此狀態。", gachaWeight: 0 },
        "item_monkey_feed":   { n: "猴子的飼料",       type: "pot", req: "all", p: 100, c: "text-yellow-200",  eff: "petlure", lure: "lure_monkey",   dur: 600, d: "塞滿堅果與香蕉乾的飼料袋，猴群為之瘋狂。使用後獲得「猴子誘捕」600秒：期間擊殺 猴子 時，寵物保管將獲得基本等級的猴子並失去此狀態。", gachaWeight: 0 },
        "item_koreadog_feed": { n: "高麗犬誘食",       type: "pot", req: "all", p: 100, c: "text-cyan-200",    eff: "petlure", lure: "lure_koreadog", dur: 600, d: "熬煮入味的肉乾誘食，幼犬聞香便搖著尾巴跟來。使用後獲得「高麗幼犬誘捕」600秒：期間擊殺 高麗幼犬 時，寵物保管將獲得基本等級的高麗幼犬並失去此狀態。", gachaWeight: 0 },
        // 🐾 進化材料（於包武的寵物保管介面對 Lv30+ 寵物使用進化按鈕時消耗；諾斯製作）
        "item_dragon_heart":  { n: "龍之心",   type: "etc", req: "all", p: 5000, c: "text-red-300",    noUse: true, gachaWeight: 0, d: "幼龍胸腔中仍在搏動的緋紅心臟，蘊含純粹的龍之力。製作材料：亞丁「諾斯」可用它製作勝利果實。" },
        "item_evo_fruit":     { n: "進化果實", type: "etc", req: "all", p: 0,    c: "text-green-300",  noUse: true, gachaWeight: 0, d: "蘊含生命躍遷之力的神祕果實。亞丁「諾斯」可製作：光明的鱗片×100＋綠寶石×20＋金幣20000。", gachaWeight: 0 },
        "item_victory_fruit": { n: "勝利果實", type: "etc", req: "all", p: 0,    c: "text-yellow-300", noUse: true, gachaWeight: 0, d: "凝聚龍之心力量的黃金果實。亞丁「諾斯」可製作：龍之心×1＋高品質紅寶石×5。", gachaWeight: 0 },
        // 不死鳥之心（製作材料，不死鳥 1% 掉落）
        "new_phoenix_heart": { n: "不死鳥之心", type: "etc", p: 0, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "不死鳥體內不滅的核心。製作材料。" },
        // ===== 🦴 寵物裝備（之牙）：裝在「寵物裝備」欄，能力只影響寵物，可用對飾品施法的卷軸強化至+5 =====
        "pet_fang_hound":   { n: "獵犬之牙", type: "acc", slot: "petwpn", req: "all", safe: 0, p: 10000,  c: "text-white", petHit: 2,            d: "獵犬的尖牙磨成的護符，喚醒寵物的野性。", gachaWeight: 10 },
        "pet_fang_steel":   { n: "鋼鐵之牙", type: "acc", slot: "petwpn", req: "all", safe: 0, p: 10000,  c: "text-white", petDmg: 2,            d: "以鋼鐵鑄成的森冷利齒，使寵物撕咬更為兇猛。", gachaWeight: 10 },
        "pet_fang_ruin":    { n: "破滅之牙", type: "acc", slot: "petwpn", req: "all", safe: 0, p: 100000, c: "text-white", petDmg: 2, petHit: 3, d: "沾染破滅氣息的獠牙，令寵物的撕咬帶來毀滅。", gachaWeight: 0 },
        "pet_fang_victory": { n: "勝利之牙", type: "acc", slot: "petwpn", req: "all", safe: 0, p: 100000, c: "text-white", petDmg: 3, petHit: 1, d: "銘刻無數勝戰的榮耀之牙，激起寵物的鬥志。", gachaWeight: 0 },
        // ===== 🛡️ 寵物防具（v3.2.37）：type:arm·slot:petarm·於包武的寵物保管為單一寵物裝上；防具卷軸強化規則·安定值0·上限+5·每+1 防禦再-1（petAc/petMr/petInt/petWis 只作用於該寵物）=====
        "pet_arm_leather":  { n: "寵物皮盔甲",     type: "arm", slot: "petarm", req: "all", safe: 0, maxEn: 5, p: 3800,  c: "text-white", petAc: 4,                                     d: "以高級皮革縫製的輕便護甲。", gachaWeight: 0 },
        "pet_arm_bone":     { n: "寵物骷髏盔甲",   type: "arm", slot: "petarm", req: "all", safe: 0, maxEn: 5, p: 6000,  c: "text-white", petAc: 7,                                     d: "綴滿骨片的猙獰護甲，令寵物氣勢懾人。", gachaWeight: 0 },
        "pet_arm_steel":    { n: "寵物鋼鐵盔甲",   type: "arm", slot: "petarm", req: "all", safe: 0, maxEn: 5, p: 12000, c: "text-white", petAc: 8,                                     d: "鋼鐵鍛成的堅實護甲。", gachaWeight: 0 },
        "pet_arm_cross":    { n: "寵物十字盔甲",   type: "arm", slot: "petarm", req: "all", safe: 0, maxEn: 5, p: 25000, c: "text-white", petAc: 13,                                    d: "胸口鑄有十字徽記的重護甲。", gachaWeight: 0 },
        "pet_arm_chain":    { n: "寵物鏈甲",       type: "arm", slot: "petarm", req: "all", safe: 0, maxEn: 5, p: 45000, c: "text-white", petAc: 20,                                    d: "細密鎖環編成的全身鏈甲。", gachaWeight: 0 },
        "pet_arm_mithril":  { n: "寵物米索莉盔甲", type: "arm", slot: "petarm", req: "all", safe: 0, maxEn: 5, p: 75000, c: "text-white", petAc: 12, petMr: 10, petInt: 1, petWis: 1, d: "米索莉鍛造的名匠護甲，輕盈而蘊含魔力。", gachaWeight: 0 },
        // 🪆 魔法娃娃（slot:doll·全職業·裝備後滑鼠游標變成 assets/doll/<物品名稱>.png；亦帶屬性加成）。dollTier=階級(1~6)；袋子開出/合成取得（價格0·無法強化·不可賣）。
        // 特殊效果引擎欄位：procBonusDmg{rate,dmg}=攻擊機率額外傷害、procPoisonRate=攻擊機率中毒、procSkill+procRateBase=攻擊機率觸發技能、procDmgReduce{rate,amount}=受傷機率減免、abnormalResist=機率抵抗異常、freezeResist/stunResist=抵抗(100=免疫)、immParalyze/immSlow/immPoison=免疫、expBonus/goldBonus=經驗/金錢%、potionBonus=藥水恢復%、weightCap=負重、er/magicHit/extraMp/mdmg=ER/魔法命中/額外魔點/固定魔傷。
        // ===== 🦴 席琳遺骸（v3.1.68）：套裝效果新載體 =====
        // 8 部位遺骸（視為飾品·noEnhance·不可賦予屬性·潘朵拉權重0·重量0）。每件必附一種席琳詞綴(seteff·由掉落/伊奧/菈克希絲附加)，
        // 顯示名＝「組名+部位」（如 魔女之爪·getItemFullName seteff 前綴機制）。裝於裝備分頁底部 8 格專屬欄（欄位鍵=物品id·浮動裝備視窗不顯示）。
        // 「相同組名的遺骸」達 2/3/5 格 → 發動現行套裝效果（recomputeStats 計件改掃遺骸欄·裝備上的舊詞綴不再計入）。
        "rem_claw":  { n: "之爪", type: "acc", slot: "rem_claw",  remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的獸爪遺骸，對應武器部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "rem_eye":   { n: "之眼", type: "acc", slot: "rem_eye",   remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的眼珠遺骸，對應頭盔部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "rem_blood": { n: "之血", type: "acc", slot: "rem_blood", remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的凝血遺骸，對應斗篷部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "rem_flesh": { n: "之肉", type: "acc", slot: "rem_flesh", remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的血肉遺骸，對應長靴部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "rem_heart": { n: "之心", type: "acc", slot: "rem_heart", remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的心臟遺骸，對應腰帶部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "rem_bone":  { n: "之骨", type: "acc", slot: "rem_bone",  remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的骨骸遺骸，對應手套部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "rem_fang":  { n: "之牙", type: "acc", slot: "rem_fang",  remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的利牙遺骸，對應副手部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "rem_scale": { n: "之鱗", type: "acc", slot: "rem_scale", remains: true, noEnhance: true, noJunk: true, req: "all", safe: 0, p: 0, gachaWeight: 0, d: "【席琳遺骸】蘊含席琳之力的鱗片遺骸，對應盔甲部位。裝備於遺骸欄；集齊相同套裝名的遺骸即可發動套裝效果。" },
        "doll_野狼寶寶":   { n: "魔法娃娃：野狼寶寶", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", procBonusDmg: { rate: 3, dmg: 15 }, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_史巴托":     { n: "魔法娃娃：史巴托", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", procDmgReduce: { rate: 4, amount: 3 }, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_奎斯坦修":   { n: "魔法娃娃：奎斯坦修", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", procBonusDmg: { rate: 3, dmg: 15 }, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_稻草人":     { n: "魔法娃娃：稻草人", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", mhp: 50, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_蛇女":       { n: "魔法娃娃：蛇女", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", mpR: 4, procPoisonRate: 5, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_肥肥":       { n: "魔法娃娃：肥肥", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", weightCap: 20, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_希爾黛斯":   { n: "魔法娃娃：希爾黛斯", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", hpR: 10, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_石頭高崙":   { n: "魔法娃娃：石頭高崙", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 1, noEnhance: true, gachaWeight: 0, c: "text-slate-200", dr: 1, d: "一階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_長老":       { n: "魔法娃娃：長老", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 2, noEnhance: true, gachaWeight: 0, c: "text-green-300", mpR: 4, d: "二階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_雪怪":       { n: "魔法娃娃：雪怪", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 2, noEnhance: true, gachaWeight: 0, c: "text-green-300", ac: 3, freezeResist: 5, d: "二階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_亞力安":     { n: "魔法娃娃：亞力安", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 2, noEnhance: true, gachaWeight: 0, c: "text-green-300", rangedDmg: 1, rangedHit: 1, d: "二階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_美人魚":     { n: "魔法娃娃：美人魚", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 2, noEnhance: true, gachaWeight: 0, c: "text-green-300", expBonus: 3, d: "二階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_小思克巴":   { n: "魔法娃娃：小思克巴", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 2, noEnhance: true, gachaWeight: 0, c: "text-green-300", mpR: 4, d: "二階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_巨人":       { n: "魔法娃娃：巨人", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 2, noEnhance: true, gachaWeight: 0, c: "text-green-300", meleeDmg: 1, meleeHit: 1, dr: 1, mhp: 50, d: "二階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_王子":       { n: "魔法娃娃：王子", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", hpR: 15, weightCap: 15, str: 1, con: 1, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_公主":       { n: "魔法娃娃：公主", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, weightCap: 15, str: 1, con: 1, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_男騎士":     { n: "魔法娃娃：男騎士", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", hpR: 15, con: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_女騎士":     { n: "魔法娃娃：女騎士", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, con: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_男妖精":     { n: "魔法娃娃：男妖精", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", hpR: 15, dex: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_女妖精":     { n: "魔法娃娃：女妖精", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, dex: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_男法師":     { n: "魔法娃娃：男法師", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", hpR: 15, int: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_女法師":     { n: "魔法娃娃：女法師", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, int: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_男黑暗妖精": { n: "魔法娃娃：男黑暗妖精", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", hpR: 15, str: 1, dex: 1, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_女黑暗妖精": { n: "魔法娃娃：女黑暗妖精", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, str: 1, dex: 1, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_男龍騎士":   { n: "魔法娃娃：男龍騎士", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", hpR: 15, str: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_女龍騎士":   { n: "魔法娃娃：女龍騎士", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, str: 2, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_男幻術士":   { n: "魔法娃娃：男幻術士", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", hpR: 15, int: 1, wis: 1, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_女幻術士":   { n: "魔法娃娃：女幻術士", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, int: 1, wis: 1, weightCap: 15, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_思克巴女皇": { n: "魔法娃娃：思克巴女皇", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 3, noEnhance: true, gachaWeight: 0, c: "text-sky-300", mpR: 5, mdmg: 1, extraMp: 1, d: "三階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_阿魯巴":     { n: "魔法娃娃：阿魯巴", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", rangedHit: 2, rangedDmg: 2, dex: 1, mhp: 25, mmp: 25, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_墮落":       { n: "魔法娃娃：墮落", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", mpR: 3, mdmg: 2, magicHit: 5, abnormalResist: 10, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_變形怪":     { n: "魔法娃娃：變形怪", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", ac: 1, hpR: 5, mpR: 2, extraDmg: 1, extraHit: 2, weightCap: 20, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_飛龍":       { n: "魔法娃娃：飛龍", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", mpR: 5, er: 3, mr: 10, resFire: 3, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_莫提斯":     { n: "魔法娃娃：莫提斯", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", mpR: 2, expBonus: 10, goldBonus: 10, weightCap: 80, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_黑長者":     { n: "魔法娃娃：黑長者", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", mpR: 10, int: 2, wis: 2, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_獨眼巨人":   { n: "魔法娃娃：獨眼巨人", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", hpR: 30, str: 2, con: 2, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_雪人":       { n: "魔法娃娃：雪人", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 4, noEnhance: true, gachaWeight: 0, c: "text-purple-300", potionBonus: 10, mhp: 50, mmp: 30, d: "四階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_艾莉絲":     { n: "魔法娃娃：艾莉絲", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", mpR: 5, rangedDmg: 4, rangedHit: 3, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_木乃伊王":   { n: "魔法娃娃：木乃伊王", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", hpR: 20, mhp: 150, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_死亡騎士":   { n: "魔法娃娃：死亡騎士", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", hpR: 15, meleeDmg: 5, procSkill: "sk_blaze", procRateBase: 1, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_巴風特":     { n: "魔法娃娃：巴風特", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", mpR: 3, mdmg: 1, magicHit: 1, procSkill: "sk_earthquake", procRateBase: 1, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_吸血鬼":     { n: "魔法娃娃：吸血鬼", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", hpR: 35, potionBonus: 15, er: 5, dr: 3, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_克特":       { n: "魔法娃娃：克特", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", extraHit: 3, ac: 2, procSkill: "sk_thunder", procRateBase: 1, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_冰之女王":   { n: "魔法娃娃：冰之女王", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", mpR: 10, int: 2, wis: 2, resWater: 10, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_巴蘭卡":     { n: "魔法娃娃：巴蘭卡", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", meleeDmg: 3, meleeHit: 3, dr: 3, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_巫妖":       { n: "魔法娃娃：巫妖", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 5, noEnhance: true, gachaWeight: 0, c: "text-orange-300", mpR: 5, mdmg: 3, int: 2, mmp: 50, procDmgReduce: { rate: 5, amount: 5 }, d: "五階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_安塔瑞斯":   { n: "魔法娃娃：安塔瑞斯", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 6, noEnhance: true, gachaWeight: 0, c: "text-red-400", hpR: 20, mpR: 10, resEarth: 20, ac: 5, mr: 10, mhp: 100, dr: 10, immPoison: true, immParalyze: true, d: "六階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_法利昂":     { n: "魔法娃娃：法利昂", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 6, noEnhance: true, gachaWeight: 0, c: "text-red-400", hpR: 20, mpR: 10, resWater: 20, mdmg: 5, int: 2, wis: 2, freezeResist: 100, d: "六階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_林德拜爾":   { n: "魔法娃娃：林德拜爾", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 6, noEnhance: true, gachaWeight: 0, c: "text-red-400", hpR: 20, mpR: 10, resWind: 20, rangedDmg: 4, rangedHit: 8, er: 5, immSlow: true, d: "六階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_巴拉卡斯":   { n: "魔法娃娃：巴拉卡斯", type: "acc", slot: "doll", req: "all", safe: 0, p: 0, doll: true, dollTier: 6, noEnhance: true, gachaWeight: 0, c: "text-red-400", hpR: 20, mpR: 10, resFire: 20, meleeDmg: 4, meleeHit: 8, dr: 5, stunResist: 100, d: "六階魔法娃娃。裝於魔法娃娃欄，游標變其模樣。" },
        "doll_bag":        { n: "魔法娃娃的袋子", type: "misc", p: 0, c: "text-pink-300", eff: "doll_bag", noSell: true, gachaWeight: 0, d: "打開可隨機獲得一隻魔法娃娃。於威頓村魔法娃娃商人用多餘銀卡兌換取得。" },
        "doll_box_high":   { n: "高級魔法娃娃的盒子", type: "misc", p: 0, c: "text-amber-300", eff: "doll_box_high", noSell: true, gachaWeight: 0, d: "打開可隨機獲得一隻較高階（二～四階）的魔法娃娃。於威頓村魔法娃娃商人用多餘金卡兌換取得。" },
        "scroll_weapon": { n: "對武器施法的卷軸", p: 22500, c: "text-white", d: "刻著強化咒文的卷軸，能將魔力灌入武器；過度追求力量也可能使武器崩毀。", gachaWeight: 100 },
        "scroll_armor": { n: "對盔甲施法的卷軸", p: 9000, c: "text-white", d: "刻著防護咒文的卷軸，能強化盔甲；越過裝備承受的極限便可能使其崩毀。", gachaWeight: 100 },
        "scroll_weapon_b": { n: "祝福的 對武器施法的卷軸", p: 22500, c: "text-yellow-300", d: "受到殷海薩祝福的卷軸，較容易喚醒尚未成熟的武器潛能。", isB: true, gachaWeight: 0 },
        "scroll_armor_b": { n: "祝福的 對盔甲施法的卷軸", p: 9000, c: "text-yellow-300", d: "受到殷海薩祝福的卷軸，較容易喚醒尚未成熟的防具潛能。", isB: true, gachaWeight: 0 },
        "scroll_weapon_c": { n: "詛咒的 對武器施法的卷軸", p: 33334, c: "c-cursed", d: "纏繞格蘭肯氣息的卷軸，會削弱武器上既有的強化魔力。", isC: true, gachaWeight: 20 },
        "scroll_armor_c": { n: "詛咒的 對盔甲施法的卷軸", p: 33334, c: "c-cursed", d: "纏繞格蘭肯氣息的卷軸，會削弱防具上既有的強化魔力。", isC: true, gachaWeight: 20 },
        "scroll_acc": { n: "對飾品施法的卷軸", p: 50000, c: "text-white", d: "專為飾品刻寫的強化卷軸，細小的器物難以承受失控的魔力。", gachaWeight: 10 },
        // ===== 🔥 屬性強化卷軸（v3.0.77 屬性強化系統）：怪物掉落·於象牙塔『碧恩』對裝備中武器使用·7% 獨立事件·失敗僅消耗卷軸 =====
        "scroll_attr_fire":  { n: "火之武器強化卷軸", type: "misc", p: 100000, c: "c-attr-fr3", noUse: true, gachaWeight: 0, d: "封存帕格里奧烈焰的卷軸，可交由象牙塔的碧恩嘗試將火之力灌入武器。" },
        "scroll_attr_water": { n: "水之武器強化卷軸", type: "misc", p: 100000, c: "c-attr-wa3", noUse: true, gachaWeight: 0, d: "封存伊娃潮汐的卷軸，可交由象牙塔的碧恩嘗試將水之力灌入武器。" },
        "scroll_attr_wind":  { n: "風之武器強化卷軸", type: "misc", p: 100000, c: "c-attr-wi3", noUse: true, gachaWeight: 0, d: "封存沙哈疾風的卷軸，可交由象牙塔的碧恩嘗試將風之力灌入武器。" },
        "scroll_attr_earth": { n: "地之武器強化卷軸", type: "misc", p: 100000, c: "c-attr-ea3", noUse: true, gachaWeight: 0, d: "封存馬普勒大地之力的卷軸，可交由象牙塔的碧恩嘗試將地之力灌入武器。" },
        "new_item_bless_wpn": { n: "賦予武器祝福卷軸", type: "misc", p: 0, c: "text-purple-300", d: "舊時代的祝福卷軸（祝福裝備功能已由『賦予屬性』取代，此卷軸已無用途）。", isAnc: true, noUse: true, gachaWeight: 0 },   // 🔥 v3.0.77 停用（碧恩改賦予屬性·克里斯特移除）
        "new_item_bless_arm": { n: "賦予盔甲祝福卷軸", type: "misc", p: 0, c: "text-purple-300", d: "舊時代的祝福卷軸（祝福裝備功能已由『賦予屬性』取代，此卷軸已無用途）。", isAnc: true, noUse: true, gachaWeight: 0 },
        "new_item_bless_acc": { n: "賦予飾品祝福卷軸", type: "misc", p: 0, c: "text-purple-300", d: "舊時代的祝福卷軸（祝福裝備功能已由『賦予屬性』取代，此卷軸已無用途）。", isAnc: true, noUse: true, gachaWeight: 0 },
        "new_item_uncurse": { n: "解除詛咒的卷軸", type: "misc", p: 0, c: "text-cyan-200", d: "於象牙塔『碧恩』處用來移除裝備的詛咒（無法直接使用；沒有卷軸時碧恩也可收費 100 萬金幣解除）。", noUse: true, gachaWeight: 0 },
        // 🚫 v3.2.17「肉 new_item_143」已隨舊項圈夥伴系統移除（誘捕改用 漂浮之眼肉 等專屬誘捕道具）
        "new_item_144": { n: "夏洛伯之爪", p: 1, c: "text-blue-300", gachaWeight: 0 },   // 🔧 試煉材料統一藍色
        "new_item_145": { n: "阿吐巴圖騰", p: 667, gachaWeight: 0 },
        "new_item_146": { n: "那魯加圖騰", p: 334, gachaWeight: 0 },
        "new_item_147": { n: "都達瑪拉圖騰", p: 167, gachaWeight: 0 },
        "new_item_148": { n: "甘地圖騰", p: 100, gachaWeight: 0 },
        "new_item_149": { n: "羅孚圖騰", p: 167, gachaWeight: 0 },
        "new_item_150": { n: "魔法寶石", p: 99, gachaWeight: 0 },
        "mat_moonlight_breath": { n: "月光之氣息", type: "etc", p: 5000, noUse: true, gachaWeight: 0, c: "text-sky-200", d: "月華凝鍊而成的氣息，賽巴斯寶石加工的稀有材料。" },
        // ===== 雷德的復仇：任務道具（蕾雅部下的證明物，無法裝備）=====
        "quest_ring_darkdweller": { n: "黑暗棲林者戒指", p: 1, c: "text-amber-300", gachaWeight: 0, d: "自黑暗棲林者指間奪下的戒指。雷德的復仇任務道具，無法裝備。蕾雅部下的證明物。" },
        "quest_ring_beasttamer": { n: "馴獸師戒指", p: 1, c: "text-amber-300", gachaWeight: 0, d: "曾號令群獸的馴獸師遺物。雷德的復仇任務道具，無法裝備。蕾雅部下的證明物。" },
        "quest_ring_elfcaller": { n: "精靈使戒指", p: 1, c: "text-amber-300", gachaWeight: 0, d: "驅使精靈作戰的精靈使所佩之戒。雷德的復仇任務道具，無法裝備。蕾雅部下的證明物。" },
        "quest_ring_summoner": { n: "喚獸師戒指", p: 1, c: "text-amber-300", gachaWeight: 0, d: "喚獸師用以締結召喚契約的戒指。雷德的復仇任務道具，無法裝備。蕾雅部下的證明物。" },
        "quest_ring_darkmage": { n: "黑法師戒指", p: 1, c: "text-amber-300", gachaWeight: 0, d: "染著黑暗魔力的黑法師戒指。雷德的復仇任務道具，無法裝備。蕾雅部下的證明物。" },
        // ===== 倫提斯製作材料：四軍團印記 + 四軍王徽印（暫無掉落怪）=====
        "mat_legion_necro": { n: "冥法軍團印記", p: 500, gachaWeight: 0, d: "倫提斯製作材料。" },
        "mat_legion_law": { n: "法令軍團印記", p: 500, gachaWeight: 0, d: "法令軍團的徽記，由忠於律法的軍士佩於胸前。倫提斯製作材料。" },
        "mat_legion_beast": { n: "魔獸軍團印記", p: 500, gachaWeight: 0, d: "魔獸軍團的徽記，染著野性與血腥的氣味。倫提斯製作材料。" },
        "mat_legion_assassin": { n: "暗殺軍團印記", p: 500, gachaWeight: 0, d: "暗殺軍團的徽記，刻於暗影中流轉的密令。倫提斯製作材料。" },
        "mat_crest_beast": { n: "魔獸軍王徽印", p: 5000, gachaWeight: 0, d: "魔獸軍王的徽印，唯有踏過其領地者方能取得。倫提斯製作材料。" },
        "mat_crest_law": { n: "法令軍王徽印", p: 5000, gachaWeight: 0, d: "法令軍王的徽印，銘刻著不容違逆的鐵律。倫提斯製作材料。" },
        "mat_crest_assassin": { n: "暗殺軍王徽印", p: 5000, gachaWeight: 0, d: "暗殺軍王的徽印，沉默無聲卻奪命於無形。倫提斯製作材料。" },
        "mat_crest_necro": { n: "冥法軍王徽印", p: 5000, gachaWeight: 0, d: "冥法軍王的徽印，縈繞著亡者國度的幽冷氣息。倫提斯製作材料。" },
        "item_king_key": { n: "軍王的鑰匙", p: 1, c: "text-amber-300", gachaWeight: 0, d: "刻有軍王紋章的古老鑰匙，唯有持之者能跨越那道封閉的界線。通往特定區域的鑰匙，持有後方可入場。" },
        "new_item_151": { n: "鑽石", p: 250, gachaWeight: 0 },
        "new_item_152": { n: "品質鑽石", p: 750, gachaWeight: 0 },
        "new_item_153": { n: "高品質鑽石", p: 2500, gachaWeight: 0 },
        "new_item_154": { n: "綠寶石", p: 125, gachaWeight: 0 },
        "new_item_155": { n: "品質綠寶石", p: 500, gachaWeight: 0 },
        "new_item_156": { n: "高品質綠寶石", p: 1250, gachaWeight: 0 },
        "new_item_157": { n: "紅寶石", p: 175, gachaWeight: 0 },
        "new_item_158": { n: "品質紅寶石", p: 550, gachaWeight: 0 },
        "new_item_159": { n: "高品質紅寶石", p: 1750, gachaWeight: 0 },
        "new_item_160": { n: "藍寶石", p: 200, gachaWeight: 0 },
        "new_item_161": { n: "品質藍寶石", p: 650, gachaWeight: 0 },
        "new_item_162": { n: "高品質藍寶石", p: 2000, gachaWeight: 0 },
        "mat_unicorn_horn":   { n: "神聖獨角獸之角", p: 5000, gachaWeight: 0, d: "獨角獸頭上的神聖之角，蘊含純淨之力。製作熾炎天使弓的核心材料。" },
        "mat_wind_breath":    { n: "風之氣息", p: 1500, gachaWeight: 0, d: "風精靈呼出的一縷靈息，於掌心仍微微鼓動著看不見的氣流。凝聚自風精靈的元素氣息。" },
        "mat_water_breath":   { n: "水之氣息", p: 1500, gachaWeight: 0, d: "水精靈吐納的一抹清涼，似有潺潺水聲在其中流轉不息。凝聚自水精靈的元素氣息。" },
        "mat_fire_breath":    { n: "火之氣息", p: 1500, gachaWeight: 0, d: "火精靈呵出的一息餘溫，貼近時仍能感到躍動的炙熱。凝聚自火精靈的元素氣息。" },
        "mat_earth_breath":   { n: "土之氣息", p: 1500, gachaWeight: 0, d: "地精靈沉吐的一口厚實氣息，蘊著大地深處的沉穩重量。凝聚自地精靈的元素氣息。" },
        "mat_griffon_feather":{ n: "格利芬羽毛", p: 1000, gachaWeight: 0, d: "自翱翔天際的格利芬身上取下的羽毛，輕盈似風卻韌如鋼。" },
        "new_item_163": { n: "潘的鬃毛", p: 10, gachaWeight: 0 },
        "new_item_164": { n: "粗糙的米索莉塊", p: 20, gachaWeight: 0 },
        "new_item_165": { n: "元素石", p: 20, gachaWeight: 0 },
        "new_item_166": { n: "蘑菇汁", p: 10, gachaWeight: 0 },
        "new_item_167": { n: "食人巨魔的血", p: 10000, gachaWeight: 0 },
        "new_item_168": { n: "線", p: 10, gachaWeight: 0 },
        "new_item_169": { n: "純粹的米索莉塊", p: 1, gachaWeight: 0 },
        "new_item_170": { n: "精靈粉末", p: 1, gachaWeight: 0 },
        "new_item_171": { n: "芮克妮的網", p: 10, gachaWeight: 0 },
        "new_item_172": { n: "安特的樹皮", p: 10, gachaWeight: 0 },
        "new_item_173": { n: "奧里哈魯根", p: 10, gachaWeight: 0 },
        "new_item_174": { n: "米索莉線", p: 10, gachaWeight: 0 },
        "new_item_175": { n: "芮克妮的蛻皮", p: 10, gachaWeight: 0 },
        "new_item_176": { n: "魔法笛子", p: 10, gachaWeight: 0 },
        "new_item_177": { n: "米索莉金屬板", p: 10, gachaWeight: 0 },
        "new_item_178": { n: "奧里哈魯根金屬板", p: 10, gachaWeight: 0 },
        "new_item_179": { n: "皮革", p: 10, gachaWeight: 0 },
        "new_item_180": { n: "金屬塊", p: 10, gachaWeight: 0 },
        "new_item_181": { n: "皮帶", p: 10, gachaWeight: 0 },
        "new_item_182": { n: "高級皮革", p: 10, gachaWeight: 0 },
        "mat_blackstone2": { n: "二級黑魔石", p: 50,   gachaWeight: 0, d: "黑得吸光的礦石，貼近耳畔彷彿能聽見幽幽暗影的低語。黑暗妖精製作的基礎材料。（野外戰鬥掉落，學習提煉魔石後掉落率提高）" },
        "mat_blackstone3": { n: "三級黑魔石", p: 200,  gachaWeight: 0, d: "暗影魔力層層凝結而成的黑石，握於掌中沉甸甸地泛著冷意。黑暗妖精製作的進階材料。（野外戰鬥掉落，學習提煉魔石後掉落率提高）" },
        "mat_blackstone4": { n: "四級黑魔石", p: 1000, gachaWeight: 0, d: "千錘百鍊純化至極的黑魔石，暗影之力濃稠得幾乎要溢出表面。黑暗妖精頂級裝備的關鍵材料。（稀有掉落）" },
        "mat_silverore":   { n: "銀礦石",     p: 100,  gachaWeight: 0, d: "夾雜著銀脈的粗礦，於爐火中提煉方能顯露其皎潔本色。於庫普處以 10 個＋500 金幣可精煉成『銀』。" },
        "mat_silver":      { n: "銀",         p: 500,  gachaWeight: 0, d: "提煉至純的皎潔白銀，自古便是邪祟畏懼之物。可用於打造銀光系武器（對不死/狼人有效）。" },
        "new_item_183": { n: "骨頭碎片", p: 10, gachaWeight: 0 },
        // 🚫 v3.2.17 new_item_184「項圈 (杜賓狗)」／new_item_185「項圈 (狼)」已隨舊項圈夥伴系統移除
        "new_item_186": { n: "糖果", p: 10, gachaWeight: 0 },
        "new_item_187": { n: "藍色布料", p: 220, gachaWeight: 0 },
        "new_item_188": { n: "紅色布料", p: 220, gachaWeight: 0 },
        "new_item_189": { n: "白色布料", p: 220, gachaWeight: 0 },
        "new_item_190": { n: "水龍鱗", p: 5000, gachaWeight: 0 },
        "new_item_191": { n: "地龍鱗", p: 5000, gachaWeight: 0 },
        "new_item_192": { n: "火龍鱗", p: 5000, gachaWeight: 0 },
        "new_item_193": { n: "風龍鱗", p: 5000, gachaWeight: 0 },
        "new_item_194": { n: "阿西塔基奧的灰燼", p: 1000, gachaWeight: 0 },
        "new_item_195": { n: "精靈玉", p: 100, gachaWeight: 0 },
        "new_item_196": { n: "古老的交易文件", p: 1, c: "text-blue-300", gachaWeight: 0 },   // 🔧 試煉材料統一藍色
        "new_item_197": { n: "搜索狀", p: 1, noUse: true, noSell: true, gachaWeight: 0, c: "text-amber-300", d: "王族 15 級試煉道具。接取甘特的試煉後，擊殺 黑騎士搜索隊 必定掉落（達需求數量即停止掉落·無法存入倉庫）。" },
        "new_item_198": { n: "黑騎士的誓約", p: 1, c: "text-blue-300", gachaWeight: 0 },   // 🔧 試煉材料統一藍色（198~206、208、212~214、240 同）
        "new_item_199": { n: "都達瑪拉妖魔魔法書", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_200": { n: "那魯加妖魔魔法書", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_201": { n: "甘地妖魔魔法書", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_202": { n: "阿吐巴妖魔魔法書", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_203": { n: "骷髏頭", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_204": { n: "食屍鬼的指甲", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_205": { n: "食屍鬼的牙齒", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_206": { n: "龍龜甲", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_207": { n: "生命的卷軸", p: 1, gachaWeight: 0 },
        "new_item_208": { n: "蛇女之鱗", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_209": { n: "返生藥水", p: 1, gachaWeight: 0 },
        "new_item_210": { n: "感謝信", p: 1, gachaWeight: 0 },
        "new_item_211": { n: "村民的遺物", p: 1, gachaWeight: 0 },
        "new_item_212": { n: "不死族的骨頭", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_213": { n: "受詛咒的精靈書", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_214": { n: "不死族的鑰匙", p: 1, c: "text-blue-300", gachaWeight: 0 },
        "new_item_215": { n: "殭屍鑰匙", p: 1, gachaWeight: 0 },
        "new_item_216": { n: "骷髏鑰匙", p: 1, gachaWeight: 0 },
        "new_item_217": { n: "密室鑰匙", p: 1, gachaWeight: 0 },
        "new_item_218": { n: "神秘水晶球", p: 1, gachaWeight: 0 },
        "new_item_219": { n: "神秘魔杖", p: 1, gachaWeight: 0 },
        "new_item_220": { n: "蛇女房間鑰匙", p: 1, gachaWeight: 0 },
        "new_item_221": { n: "光明的鱗片", p: 1, gachaWeight: 0 },
        "item_hatin_diary": { n: "黑暗哈汀的日記本", type: "misc", p: 5000, c: "text-purple-300", noUse: true, gachaWeight: 0, d: "黑暗法師哈汀殘存的日記本，扉頁間滿是癲狂的黑魔法筆記與禁咒草圖。可交給說話之島的尤麗婭兌換 隱藏的魔族武器（六選一）。" },
        "new_item_222": { n: "畢克斯的羽毛", p: 1, gachaWeight: 0 },
        "new_item_223": { n: "畢克斯的沙漏", p: 1, gachaWeight: 0 },
        "new_item_224": { n: "贖罪聖書", p: 1, gachaWeight: 0 },
        "new_item_225": { n: "被偷的項鍊", p: 1, gachaWeight: 0 },
        "new_item_226": { n: "被偷的戒指", p: 1, gachaWeight: 0 },
        "new_item_228": { n: "污染的精靈水晶(水)", p: 1, gachaWeight: 0 },
        "new_item_229": { n: "污染的精靈水晶(火)", p: 1, gachaWeight: 0 },
        "new_item_230": { n: "污染的精靈水晶(地)", p: 1, gachaWeight: 0 },
        "new_item_231": { n: "污染的精靈水晶(風)", p: 1, gachaWeight: 0 },
        "new_item_232": { n: "邪惡蜥蜴之鱗", p: 1, gachaWeight: 0 },
        "new_item_233": { n: "神秘魔力恢復藥水", p: 1, gachaWeight: 0 },
        "new_item_234": { n: "神秘慎重藥水", p: 1, gachaWeight: 0 },
        "new_item_235": { n: "思克巴女皇的神祕魔杖", p: 1, gachaWeight: 0 },
        "new_item_236": { n: "說話之島的回憶", p: 1, gachaWeight: 0 },
		"new_item_237": { n: "安特的樹枝", p: 1, gachaWeight: 0 },
		"new_item_elfwing": { n: "精靈羽翼", p: 10, gachaWeight: 0 },
		"new_item_mermaid_scale": { n: "人魚之鱗", p: 10, gachaWeight: 0 },
		"new_item_240": { n: "變形怪的血", p: 1, c: "text-blue-300", gachaWeight: 0 },
		        // ===== 🔥 50級試煉擴充：製作材料（潘朵拉權重0）=====
        "mat_demon_anklet_white": { n: "惡魔的白色腳鐐", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_demon_anklet_black": { n: "惡魔的黑色腳鐐", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_demon_anklet_red":   { n: "惡魔的紅色腳鐐", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_demon_anklet_blue":  { n: "惡魔的藍色腳鐐", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_black_mithril":      { n: "黑色米索莉",     type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_fallen_poison":      { n: "墮落之毒",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_fallen_hand":        { n: "墮落之手",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_fallen_fang":        { n: "墮落之牙",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_fallen_tongue":      { n: "墮落之舌",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_fallen_scythe":      { n: "墮落鐮刀",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_fallen_head":        { n: "墮落首級",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_fallen_key":        { n: "墮落鑰匙",       type: "etc", p: 1, c: "text-purple-300", noUse: true, gachaWeight: 0, d: "可交給沉默洞窟的布魯迪卡換取獎勵。" },
        "mat_soulstone_shard":    { n: "靈魂石碎片",     type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_silver_plate":       { n: "銀金屬板",       type: "etc", p: 10, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "炎魔鐵匠鍛造的金屬板。製作材料。" },
        "mat_blackmithril_plate": { n: "黑色米索莉金屬板", type: "etc", p: 10, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "炎魔鐵匠鍛造的金屬板。製作材料。" },
        "mat_flame_sword":        { n: "炎魔之劍",       type: "etc", p: 1, c: "text-red-300", noUse: true, gachaWeight: 0, d: "炎魔之力的結晶，可作為試煉交付物。" },
        "mat_flame_claw":         { n: "炎魔之爪",       type: "etc", p: 1, c: "text-red-300", noUse: true, gachaWeight: 0, d: "炎魔之力的結晶，可作為試煉交付物。" },
        "mat_flame_heart":        { n: "炎魔之心",       type: "etc", p: 1, c: "text-red-300", noUse: true, gachaWeight: 0, d: "炎魔之力的結晶，可作為試煉交付物。" },
        "mat_flame_eye":          { n: "炎魔之眼",       type: "etc", p: 1, c: "text-red-300", noUse: true, gachaWeight: 0, d: "炎魔之力的結晶，可作為試煉交付物。" },
        "mat_dragon_heart":       { n: "飛龍之心",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "飛龍體內不滅的核心。王族聖器製作材料。" },
        "mat_steel_chunk":        { n: "鋼鐵塊",         type: "etc", p: 10, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "沉甸甸的粗鍛鋼鐵。寵物防具製作材料。" },
        "mat_golem_heart":        { n: "高崙之心",       type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "高崙體內的核心。王族聖器製作材料。" },
        "mat_icequeen_heart":     { n: "冰之女王之心",   type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "冰之女王的寒冰核心。王族聖器製作材料。" },
        // ===== 🔥 50級試煉任務道具 =====
        "item_dantes_letter": { n: "丹特斯的召書", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "騎士 50 級試煉任務道具。無法刪除、無法存倉庫、最多持有 1 個。" },
        "item_elf_whisper":   { n: "精靈的私語", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, maxHold: 10, d: "騎士 50 級試煉任務道具。最多持有 10 個；完成交付後會自動清除。" },
        "item_ancient_book":  { n: "古代黑妖之秘笈", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "妖精 50 級試煉任務道具。無法刪除、無法存倉庫、最多持有 1 個。" },
        "item_sealed_intel":  { n: "密封的情報書", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "妖精 50 級試煉任務道具。無法刪除、無法存倉庫、最多持有 1 個。" },
        "item_spy_report":    { n: "間諜報告書", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "法師 50 級試煉任務道具。無法刪除、無法存倉庫、最多持有 1 個。" },
        "item_chaos_key":     { n: "混沌鑰匙", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "黑暗妖精 50 級試煉任務道具。最多持有 1 個。" },
        "item_royal_order":   { n: "調職命令書", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "王族 50 級試煉任務道具。無法刪除、無法存倉庫、最多持有 1 個。" },
        "item_lost_soul":     { n: "失去光明的靈魂", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "王族試煉任務道具（馬沙）：可兌換守護者的戒指。" },
        // ===== 🔥 50級試煉擴充：基礎裝備（飾品/手套/防具/斗篷）=====
        "glv_earth_spirit": { n: "地靈手套", type: "arm", slot: "gloves", ac: 0, str: 1, resEarth: 4, mpR: 1, req: "all", safe: 4, p: 120000, gachaWeight: 1 },
        "glv_wind_spirit":  { n: "風靈手套", type: "arm", slot: "gloves", ac: 0, str: 1, resWind: 4,  mpR: 1, req: "all", safe: 4, p: 120000, gachaWeight: 1 },
        "glv_water_spirit": { n: "水靈手套", type: "arm", slot: "gloves", ac: 0, str: 1, resWater: 4, mpR: 1, req: "all", safe: 4, p: 120000, gachaWeight: 1 },
        "glv_fire_spirit":  { n: "火靈手套", type: "arm", slot: "gloves", ac: 0, str: 1, resFire: 4,  mpR: 1, req: "all", safe: 4, p: 120000, gachaWeight: 1 },
        "hlm_mambo": { n: "曼波帽子", type: "arm", slot: "helm", ac: -1, cha: 1, sleepResist: 10, freezeResist: 10, req: "all", safe: 4, p: 59600, gachaWeight: 10, d: "綴著奇異羽飾的輕巧帽子，戴上時心神格外清明安定。" },
        "amr_mambo": { n: "曼波外套", type: "arm", slot: "armor", ac: 3, resWater: 10, resFire: -10, str: -1, cha: 2, req: "all", safe: 4, p: 89600, gachaWeight: 10 },
        "amr_centipede": { n: "金屬蜈蚣皮盔甲", type: "arm", slot: "armor", ac: 8, req: "knight,dark", safe: 4, p: 39600, gachaWeight: 30 },
        "amr_darkdweller": { n: "黑暗棲林者盔甲", type: "arm", slot: "armor", ac: 4, mmp: 10, req: "all", safe: 4, p: 2300, gachaWeight: 100 },
        "bot_darkdweller": { n: "黑暗棲林者長靴", type: "arm", slot: "boots", ac: 2, mhp: 30, req: "knight,elf,dark", safe: 4, p: 3300, gachaWeight: 50 },
        "clk_blacktiger": { n: "黑虎皮斗篷", type: "arm", slot: "cloak", ac: 3, hpR: 2, req: "all", safe: 4, p: 12000, gachaWeight: 20 },
        "clk_wolf": { n: "狼皮斗篷", type: "arm", slot: "cloak", ac: 3, req: "all", safe: 4, p: 4000, gachaWeight: 50 },
        "acc_bear_ring": { n: "熊戒指", type: "acc", slot: "ring", ac: 0, hpR: 3, resEarth: 10, req: "all", safe: 0, p: 100000, gachaWeight: 1, d: "鑲著熊牙的厚實戒指，蘊含猛獸般堅韌的生命力。" },
        "acc_abyss_ring": { n: "深淵戒指", type: "acc", slot: "ring", ac: 0, mpR: 1, sleepResist: 10, freezeResist: 10, req: "all", safe: 0, p: 100000, gachaWeight: 10, d: "凝望深淵時，深淵也凝望著你；戴上它，神智便不再為寒冷與睡意所惑。" },
        // ===== 🔥 50級試煉擴充：武器與傳說裝備 =====
        "wpn_mithril_dagger": { n: "米索莉短劍", type: "wpn", dmgS: 6, dmgL: 5, hit: 0, dmgBonus: 0, spd: 0.6, req: "all", safe: 6, p: 70000, gachaWeight: 20, unBonus: true, mpR: 3, mdmg: 1, d: "以稀有米索莉鍛成的鋒銳匕首，寒光所及邪物退避。帶出血、對不死 / 狼人加成。" },
        "wpn_ori_dagger": { n: "奧里哈魯根短劍", type: "wpn", dmgS: 7, dmgL: 7, hit: 0, dmgBonus: 2, spd: 0.6, req: "all", safe: 6, p: 80000, gachaWeight: 10, unBonus: true, d: "以傳說金屬奧里哈魯根鍛成的匕首，刃身流轉著聖潔的微光。帶出血、對不死 / 狼人加成。" },
        "wpn_crimson_spear": { n: "深紅長矛", type: "wpn", w2h: true, dmgS: 21, dmgL: 21, hit: 1, dmgBonus: 0, spd: 1.1, req: "knight", safe: 6, p: 89000, gachaWeight: 1, eff: "pierce", pierceChance: 80, unBonus: true, mhp: 50, d: "矛身被無數鮮血浸透成暗紅，貫穿之勢如奔流不可阻擋。" },
        "wpn_frost_spear": { n: "酷寒之矛", type: "wpn", dmgS: 15, dmgL: 15, hit: 0, dmgBonus: 1, spd: 1.1, req: "royal,knight,elf,warrior", safe: 6, p: 185000, gachaWeight: 1, spellProc: { skn: "寒冰追擊", dice: [4, 30], ele: "water" }, procRateBase: 1, procRatePerEn: 1, d: "矛身凝著永不消融的寒霜，刺出時帶起徹骨冰風。單手矛。" },   // 🧊 單手矛（矛 tag→出血・一般限定）；v3.2.1 用戶：移除 noMagicDmg → 觸發傷害吃魔法傷害加成
        "wpn_thunder_sword": { n: "雷雨之劍", type: "wpn", dmgS: 13, dmgL: 12, hit: 1, dmgBonus: 1, spd: 0.9, req: "royal,knight,elf,dark,dragon", safe: 6, p: 185000, gachaWeight: 1, spellProc: { skn: "雷擊", dice: [4, 30], ele: "wind" }, procRateBase: 1, procRatePerEn: 1, d: "劍身間遊走著被封入的雷霆，揮砍時炸開刺目的電光。單手劍。" },   // ⚡ 單手劍（單手劍 tag→反擊・一般限定）；v3.2.1 用戶：移除 noMagicDmg → 觸發傷害吃魔法傷害加成
        "wpn_demon_axe": { n: "惡魔斧頭", type: "wpn", w2h: true, dmgS: 30, dmgL: 30, hit: -2, dmgBonus: 0, spd: 1.1, req: "knight", safe: 0, p: 9000, gachaWeight: 30, eff: "crush", d: "惡魔揮舞過的猙獰巨斧，每一擊都帶著地獄的沉重。重擊。" },
        "wpn_vengeance": { n: "復仇之劍", type: "wpn", w2h: true, dmgS: 4, dmgL: 36, hit: 3, dmgBonus: 0, spd: 1.2, req: "knight", safe: 0, p: 10000, gachaWeight: 20, eff: "cleave", d: "凝結著不散怨念的雙手劍，劍鋒所向皆為宿仇而斬。切割。" },
        "wpn_hate_claw": { n: "恨之鋼爪", type: "wpn", w2h: true, dmgS: 26, dmgL: 15, hit: 2, dmgBonus: 5, spd: 0.9, req: "dark", safe: 0, p: 10000, gachaWeight: 20, eff: "combo", comboRate: 50, d: "由純粹恨意鍛成的鋼爪，撕裂時彷彿能聽見亡者的嘶吼。雙擊。" },
        "wpn_demon_sword": { n: "惡魔之劍", type: "wpn", dmgS: 17, dmgL: 9, hit: 4, dmgBonus: 0, spd: 0.9, req: "knight,elf", safe: 6, p: 50000, gachaWeight: 1, eff: "haste", d: "惡魔親手淬煉的單手劍，揮舞間迅疾如魔影掠過。反擊、加速（與自我加速藥水/加速術無法重疊）。" },
        "wpn_demon_dual": { n: "惡魔雙刀", type: "wpn", w2h: true, dmgS: 18, dmgL: 13, hit: 4, dmgBonus: 3, spd: 0.8, req: "dark", safe: 6, p: 50000, gachaWeight: 1, eff: "combo", equipHaste: true, d: "自惡魔利爪幻化而成的一對雙刀，揮舞間殺意如影隨形。雙擊、加速（與自我加速藥水/加速術無法重疊）。" },
        "wpn_demon_claw": { n: "惡魔鋼爪", type: "wpn", w2h: true, dmgS: 20, dmgL: 18, hit: 0, dmgBonus: 3, spd: 0.9, req: "dark", safe: 6, p: 50000, gachaWeight: 1, eff: "combo", equipHaste: true, d: "惡魔指骨淬煉的鋼爪，撕裂血肉只在彈指之間。雙擊、加速（與自我加速藥水/加速術無法重疊）。" },
        "wpn_dual_destroy": { n: "破壞雙刀", type: "wpn", w2h: true, dmgS: 16, dmgL: 10, hit: 6, dmgBonus: 1, str: 1, wis: 2, spd: 0.8, req: "dark", safe: 6, p: 150000, legend: true, gachaWeight: 1, eff: "combo", comboRate: 30, procBurstPoison: { rateBase: 1, ratePerEn: 1 }, d: "蘊含猛爆毒性的漆黑雙刃，揮舞間散逸出腐蝕一切的劇毒。黑暗妖精專屬・雙刀（雙手・近距離）。" },
        "wpn_claw_destroy": { n: "破壞鋼爪", type: "wpn", w2h: true, dmgS: 19, dmgL: 18, hit: 6, dmgBonus: 1, str: 1, wis: 2, spd: 0.9, req: "dark", safe: 6, p: 150000, legend: true, gachaWeight: 1, eff: "combo", comboRate: 30, procBurstPoison: { rateBase: 1, ratePerEn: 1 }, d: "凝聚猛爆毒性的漆黑利爪，每一抓都將致命劇毒灌入血肉。黑暗妖精專屬・鋼爪（雙手・近距離）。" },
        "wpn_demon_xbow": { n: "惡魔十字弓", type: "wpn", isBow: true, ranged: true, rapidfire: 60, w2h: true, dmgS: 3, dmgL: 3, hit: 2, dmgBonus: 4, spd: 1.0, req: "elf", safe: 6, p: 47300, gachaWeight: 1, equipHaste: true, d: "以惡魔之骨為弦的十字弓，箭雨傾瀉如墮入煉獄。" },
        "wpn_powerless_baphomet": { n: "失去魔力的巴風特魔杖", type: "wpn", dmgS: 1, dmgL: 1, hit: 0, dmgBonus: 0, spd: 1.0, req: "all", safe: 6, p: 100000, gachaWeight: 0, noEnhance: true, d: "曾屬於魔神巴風特的魔杖，如今魔力枯竭、沉默不語。對靈魂之球使用可恢復為巴風特魔杖。（封印狀態無法強化；傳統模式下解封印才附加隨機強化值。可販售，售價 100000）" },   // 🏛️ noEnhance＝封印恆 +0（傳統模式自帶強化值延後到靈魂之球解封印時附加）
        "wpn_baphomet_wand": { n: "巴風特魔杖", type: "wpn", dmgS: 7, dmgL: 6, hit: 8, dmgBonus: 5, spd: 1.0, req: "mage", safe: 0, p: 210000, legend: true, gachaWeight: 1, procSkill: "sk_earthquake", procRateBase: 8, procRatePerEn: 2, mdmgEnFrom7Max3: true, d: "魔神巴風特之力重新甦醒，杖身迴盪著大地撕裂的共鳴。" },
        "wpn_qigu_obsidian": { n: "黑曜石奇古獸", type: "wpn", qigu: true, dmgS: 24, dmgL: 24, hit: 0, spd: 0.8, mdmg: 1, wis: 1, req: "illusion", safe: 6, p: 100000, gachaWeight: 10, d: "幻術士豢養的奇古獸，化作以心念支配的兵器。幻術士專屬·奇古獸。一般攻擊化為必中的魔法傷害（受魔抗減免）。" },
        "wpn_qigu_meditate": { n: "冥想奇古獸", type: "wpn", qigu: true, dmgS: 25, dmgL: 25, hit: 0, spd: 0.8, wis: 1, mpR: 5, mpRPerEn: 1, req: "illusion", safe: 6, p: 100000, gachaWeight: 10, d: "沉入冥想的奇古獸，靜默中源源汲取魔力。幻術士專屬·奇古獸。" },
        "wpn_qigu_resonance": { n: "共鳴奇古獸", type: "wpn", qigu: true, dmgS: 25, dmgL: 25, hit: 0, spd: 0.8, mdmg: 1, wis: 3, qiguProc: "phantom", req: "illusion", safe: 6, p: 300000, gachaWeight: 1, d: "與持有者心神共鳴的奇古獸，偶爾爆發出虛幻的衝擊。幻術士專屬·奇古獸。" },
        "wpn_qigu_frost": { n: "寒冰奇古獸", type: "wpn", qigu: true, dmgS: 25, dmgL: 25, hit: 0, spd: 0.8, mdmg: 1, int: 1, qiguProc: "mindbreak", req: "illusion", safe: 6, p: 300000, gachaWeight: 1, d: "凝著寒霜的奇古獸，能撬開敵人最脆弱的心防。幻術士專屬·奇古獸。" },
        "wpn_qigu_sapphire": { n: "藍寶石奇古獸", type: "wpn", qigu: true, dmgS: 26, dmgL: 26, hit: 0, spd: 0.8, mpR: 10, req: "illusion", safe: 6, p: 10000, gachaWeight: 20, d: "通體湛藍如海的奇古獸，魔力在其中緩緩流轉不息。幻術士專屬·奇古獸。" },
        "wpn_illu_wand": { n: "幻術士魔杖", type: "wpn", dmgS: 10, dmgL: 10, hit: 3, dmgBonus: 0, spd: 1.0, mpR: 5, req: "illusion", safe: 6, p: 6000, gachaWeight: 30, d: "幻術士入門的法杖，杖頭水晶迴盪著淡淡共鳴之音。幻術士專屬魔杖。" },
        "shd_illu_book": { n: "幻術士法書", type: "arm", slot: "shield", ac: 2, block: 10, mhp: 20, mmp: 20, wis: 1, mpR: 1, req: "illusion", safe: 6, p: 6000, gachaWeight: 10, d: "記載幻術奧義的副手法書，翻動間護住持書者周身。幻術士專屬副手法書。" },
        "clk_illu": { n: "幻術士斗篷", type: "arm", slot: "cloak", ac: 1, mmp: 20, mpR: 4, req: "illusion", safe: 6, p: 6000, gachaWeight: 10, d: "織入幻術絲線的斗篷，披上便覺魔力綿綿不絕。幻術士專屬斗篷。" },
        // ===== 🐉 龍騎士武器 / 防具 =====
        "wpn_dragon_2h": { n: "龍騎士雙手劍", type: "wpn", w2h: true, dmgS: 19, dmgL: 17, hit: 4, dmgBonus: 2, spd: 1, eff: "cleave", req: "dragon", safe: 6, p: 10000, gachaWeight: 20, d: "龍騎士所執的雙手巨劍，劍鋒可斬碎龍鱗。龍騎士的雙手巨劍。" },
        "wpn_chain_annihilator": { n: "消滅者鎖鏈劍", type: "wpn", w2h: true, chainsword: true, weakExpose: true, unBonus: true, dmgS: 17, dmgL: 13, hit: 5, dmgBonus: 3, spd: 0.9, req: "dragon", safe: 6, p: 10000, gachaWeight: 20, d: "龍騎士的鎖鏈巨劍，劍刃如蛇竄出、撕開敵人的破綻。龍騎士專屬·鎖鏈劍（雙手・近距離）。" },
        "wpn_chain_destroyer": { n: "破滅者鎖鏈劍", type: "wpn", w2h: true, chainsword: true, weakExpose: true, str: 1, dmgS: 21, dmgL: 17, hit: 5, dmgBonus: 3, spd: 0.9, req: "dragon", safe: 6, p: 88000, gachaWeight: 30, d: "以毀滅為名的鎖鏈劍，每一擊都逼出敵人的致命弱點。龍騎士專屬·鎖鏈劍（雙手・近距離）。" },
        "wpn_chain_bloodthirst": { n: "嗜血者鎖鏈劍", type: "wpn", w2h: true, chainsword: true, weakExpose: true, vampPct: 0.05, dmgS: 21, dmgL: 20, hit: 5, dmgBonus: 3, spd: 0.9, req: "dragon", safe: 6, p: 138000, gachaWeight: 1, d: "渴飲鮮血的鎖鏈劍，斬擊之餘將敵人的生命據為己有。龍騎士專屬·鎖鏈劍（雙手・近距離）。" },
        "wpn_chain_resonance": { n: "共鳴鎖鏈劍", type: "wpn", w2h: true, chainsword: true, weakExpose: true, str: 1, wis: 2, dmgS: 21, dmgL: 20, hit: 6, dmgBonus: 3, spd: 0.9, req: "dragon", safe: 6, p: 164000, gachaWeight: 1, spellProc: { skn: "共鳴衝擊", dice: [4, 8], ele: "water" }, procRateBase: 1, procRatePerEn: 1, d: "鎖鏈之中迴盪著水之共鳴，揮舞時偶有冰瀾炸裂。龍騎士專屬·鎖鏈劍（雙手・近距離）。" },
        "wpn_chain_frost": { n: "寒冰鎖鏈劍", type: "wpn", w2h: true, chainsword: true, weakExpose: true, dmgS: 24, dmgL: 20, hit: 4, dmgBonus: 3, spd: 0.9, req: "dragon", safe: 6, p: 324000, gachaWeight: 1, spellProc: { skn: "冰之地裂術", dice: [8, 4], ele: "water", heal: 0.2 }, procRateBase: 1, procRatePerEn: 1, d: "凍結寒氣纏繞的鎖鏈劍，破地之餘為持劍者奪回生機。龍騎士專屬·鎖鏈劍（雙手・近距離）。" },
        "armguard_dragonscale": { n: "龍鱗臂甲", type: "arm", slot: "shield", ac: 0, armguard: { stat: "none", base: 0, th: [0, 0, 0] }, extraDmg: 1, extraHit: 2, req: "dragon", safe: 0, p: 8000, gachaWeight: 30, d: "以龍鱗鍛成的臂甲，越是淬鍊越堅不可摧。龍騎士的臂甲（裝於副手，可與雙手武器並用）。" },
        "clk_dragon": { n: "龍騎士斗篷", type: "arm", slot: "cloak", ac: 1, mhp: 30, hpR: 1, req: "dragon", safe: 6, p: 9000, gachaWeight: 20, d: "繡有龍紋的斗篷，披於肩上生機隱隱回流。龍騎士的斗篷。" },
        "wpn_golden_scepter": { n: "黃金權杖", type: "wpn", dmgS: 14, dmgL: 20, hit: 0, dmgBonus: 5, spd: 0.9, req: "royal", safe: 6, p: 10000, gachaWeight: 20, d: "👑 王族世代相傳的黃金權杖，象徵君臨天下的威儀。" },
        "clk_royal_red": { n: "紅色斗篷", type: "arm", slot: "cloak", ac: 2, cha: 1, req: "royal", safe: 4, p: 3000, gachaWeight: 100, d: "👑 王族披掛的緋紅斗篷，襯出與生俱來的高貴氣度。" },
        "clk_royal_majesty": { n: "君主的威嚴", type: "arm", slot: "cloak", ac: 2, str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1, req: "royal", safe: 4, p: 6000, gachaWeight: 50, d: "👑 凝聚一身君主威嚴的華服，舉手投足皆是王者風範。" },
        "acc_royal_guard": { n: "守護者的戒指", type: "acc", slot: "ring", ac: 0, mhp: 30, mmp: 20, req: "royal", safe: 0, p: 5000, gachaWeight: 70, d: "👑 賜予近身守護者的戒指，注入守護王室的堅毅之力。" },
        // ===== ⚔️ 戰士裝備（多文試煉兌換／琉米埃爾製作）=====
        "wpn_warrior_trial_axe": { n: "試煉斧頭", type: "wpn", dmgS: 13, dmgL: 13, hit: 0, dmgBonus: 0, spd: 0.9, req: "warrior", safe: 6, p: 5000, gachaWeight: 100, d: "戰士試煉所授的斧頭，沉甸甸地考驗著揮斧者的臂力。單手鈍器（鈍擊）。" },
        "wpn_master_axe": { n: "大匠的斧頭", type: "wpn", dmgS: 13, dmgL: 13, hit: 0, dmgBonus: 1, spd: 0.9, req: "warrior", safe: 6, p: 10000, gachaWeight: 20, unBonus: true, d: "出自大匠之手的斧頭，刃口閃著銀輝專剋暗夜之物。單手鈍器（鈍擊）、對不死／狼人加成。" },
        "wpn_demon_axehead": { n: "魔物的斧頭", type: "wpn", dmgS: 18, dmgL: 18, hit: -1, dmgBonus: 0, spd: 0.9, req: "warrior", safe: 0, p: 55000, gachaWeight: 10, d: "由魔物殘骸之力凝鑄的斧頭，揮砍間透著一股戾氣。單手鈍器（鈍擊）。" },
        "wpn_iron_axehead": { n: "鐵斧頭", type: "wpn", dmgS: 19, dmgL: 23, hit: 1, dmgBonus: 1, spd: 0.9, req: "warrior", safe: 6, p: 155000, gachaWeight: 1, d: "精鐵反覆鍛打而成的斧頭，紮實順手、無懈可擊。單手鈍器（鈍擊）。" },
        "wpn_giant_axehead": { n: "巨人的斧頭", type: "wpn", legend: true, dmgS: 28, dmgL: 36, hit: 2, dmgBonus: 5, spd: 0.9, req: "warrior", safe: 6, p: 355000, gachaWeight: 1, d: "昔日巨人揮舞的巨大斧頭，一斧落下足以撼動大地。單手鈍器（鈍擊）。" },
        "hlm_warrior_corps": { n: "戰士團頭盔", type: "arm", slot: "helm", ac: 2, mhp: 20, mrPerEn: 1, req: "warrior", safe: 4, p: 3000, gachaWeight: 50, d: "戰士團精銳所配發的鋼盔，內襯著無數場惡戰的痕跡。" },
        "clk_warrior_corps": { n: "戰士團斗篷", type: "arm", slot: "cloak", ac: 2, mhp: 20, req: "warrior", safe: 4, p: 3000, gachaWeight: 50, d: "披在戰士團肩上的厚實斗篷，曾為衝鋒者擋下風霜與箭雨。" },
        "hlm_holy_corps": { n: "神聖執行團的頭盔", type: "arm", slot: "helm", ac: 3, mhp: 20, hpR: 4, mr: 11, req: "warrior", safe: 4, p: 7000, gachaWeight: 20, d: "神聖執行團的聖盔，鍍金的紋章映照著討伐邪惡的誓言。" },
        "clk_holy_corps": { n: "神聖執行團的斗篷", type: "arm", slot: "cloak", ac: 4, mhp: 30, hpR: 2, mr: 20, req: "warrior", safe: 4, p: 9000, gachaWeight: 20, d: "神聖執行團的聖潔斗篷，受過祝福的織紋能彈開暗影的侵蝕。" },
        "item_cyclops_blood": { n: "獨眼巨人的血", p: 1, gachaWeight: 0, noSell: true, d: "自獨眼巨人胸膛湧出、猶帶餘溫的暗紅鮮血，是勇者試煉的鐵證。戰士試煉任務道具。可向海音的多文兌換戰士團頭盔。" },
        // ===== ⚔️ 戰士技能印記（多文試煉兌換；技能效果於技能階段補完）=====
        "bk_warrior_dualaxe": { type: "skillbk", n: "戰士的印記(迅猛雙斧)", p: 2400, sk: "sk_warrior_dualaxe", gachaWeight: 30, d: "記載著「迅猛雙斧」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_roar": { type: "skillbk", n: "戰士的印記(咆哮)", p: 7200, sk: "sk_warrior_roar", gachaWeight: 30, d: "記載著「咆哮」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_crush": { type: "skillbk", n: "戰士的印記(粉碎)", p: 7200, sk: "sk_warrior_crush", gachaWeight: 10, d: "記載著「粉碎」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_armorbody": { type: "skillbk", n: "戰士的印記(護甲身軀)", p: 21600, sk: "sk_warrior_armorbody", gachaWeight: 1, d: "記載著「護甲身軀」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_berserk": { type: "skillbk", n: "戰士的印記(狂暴)", p: 43200, sk: "sk_warrior_berserk", gachaWeight: 1, d: "記載著「狂暴」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_titan_rock": { type: "skillbk", n: "戰士的印記(泰坦：岩石)", p: 43200, sk: "sk_warrior_titan_rock", gachaWeight: 1, d: "記載著「泰坦：岩石」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_titan_magic": { type: "skillbk", n: "戰士的印記(泰坦：魔法)", p: 43200, sk: "sk_warrior_titan_magic", gachaWeight: 1, d: "記載著「泰坦：魔法」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_titan_bullet": { type: "skillbk", n: "戰士的印記(泰坦：子彈)", p: 43200, sk: "sk_warrior_titan_bullet", gachaWeight: 1, d: "記載著「泰坦：子彈」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_throwaxe": { type: "skillbk", n: "戰士的印記(戰斧投擲)", p: 2400, sk: "sk_warrior_throwaxe", gachaWeight: 50, d: "記載著「戰斧投擲」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_endurance": { type: "skillbk", n: "戰士的印記(體能強化)", p: 43200, sk: "sk_warrior_endurance", gachaWeight: 1, d: "記載著「體能強化」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_warrior_outlaw": { type: "skillbk", n: "戰士的印記(亡命之徒)", p: 43200, sk: "sk_warrior_outlaw", gachaWeight: 1, d: "記載著「亡命之徒」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_royal_precise":    { type: "skillbk", n: "魔法書(精準目標)", p: 4800,  sk: "sk_royal_precise",    gachaWeight: 30, d: "場上所有敵人受到的傷害增加 [1+(玩家等級/15)]%，持續 16 秒（結束才再施放）。可學等級 15。" },
        "bk_royal_callally":   { type: "skillbk", n: "魔法書(呼喚盟友)", p: 12400, sk: "sk_royal_callally",   gachaWeight: 30, d: "所有傭兵立即發動一次額外攻擊。可學等級 30。" },
        "bk_royal_burnweapon": { type: "skillbk", n: "魔法書(灼熱武器)", p: 12400, sk: "sk_royal_burnweapon", gachaWeight: 0,  d: "可學等級 40。" },
        "bk_royal_bravewill":  { type: "skillbk", n: "魔法書(勇猛意志)", p: 12400, sk: "sk_royal_bravewill",  gachaWeight: 0,  d: "可學等級 50。" },
        "bk_royal_shield":     { type: "skillbk", n: "魔法書(閃亮之盾)", p: 12400, sk: "sk_royal_shield",     gachaWeight: 0,  d: "可學等級 50。" },
        "bk_royal_kingguard":  { type: "skillbk", n: "魔法書(王者加護)", p: 12400, sk: "sk_royal_kingguard",  gachaWeight: 0,  d: "記載著「王者加護」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        // 🐉 龍騎士任務道具（普洛凱爾試煉用）
        "item_demon_search": { n: "妖魔搜索文件", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "龍騎士任務道具。可向普洛凱爾兌換龍騎士雙手劍或龍之護鎧書板（3 個）。" },
        "item_demon_spy":    { n: "妖魔密使首領間諜書", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "龍騎士任務道具。可向普洛凱爾兌換龍鱗臂甲或血之渴望書板（1 個）。" },
        "item_yeti_heart":   { n: "雪怪之心", type: "etc", p: 1, c: "text-cyan-300", noUse: true, noSell: true, gachaWeight: 0, d: "龍騎士任務道具。可向普洛凱爾兌換龍騎士斗篷（10 個）。" },
        "item_soulfire_ash": { n: "靈魂之火灰燼", type: "etc", p: 1, c: "text-orange-300", noUse: true, noSell: true, gachaWeight: 0, d: "龍騎士任務道具。50 級試煉第二階段，可向普洛凱爾兌換消滅者鎖鏈劍（1 個）。" },
        "amr_baphomet": { n: "巴風特盔甲", type: "arm", slot: "armor", ac: 8, immPoison: true, dr: 2, mrPerEn: 1, req: "knight,dragon", safe: 4, p: 225300, legend: true, gachaWeight: 1, d: "自惡魔巴風特身上剝下的傳說重甲，魔氣使穿戴者百毒不侵。" },
        "clk_flame_blood": { n: "炎魔的血光斗篷", type: "arm", slot: "cloak", ac: 5, stealth: true, req: "all", safe: 4, p: 150000, legend: true, gachaWeight: 0, d: "以炎魔鮮血浸染而成的斗篷，纏身時身影隱沒於灼熱的暗影裡。穿戴時等同維持隱身（卸下即失效）。" },
        "clk_fallen": { n: "墮落斗篷", type: "arm", slot: "cloak", ac: 2, mhp: 100, con: 1, req: "dark", safe: 4, p: 150000, legend: true, gachaWeight: 1, d: "墮落者遺落的傳說斗篷，腐朽中仍透出不滅的生命力。" },
        "amr_fallen": { n: "墮落長袍", type: "arm", slot: "armor", ac: 13, mmp: 100, mpR: 5, req: "mage", safe: 0, p: 150000, legend: true, gachaWeight: 1, d: "墮落者的傳說長袍，衣襟間流淌著源源不絕的魔力暗潮。" },
        "glv_fallen": { n: "墮落手套", type: "arm", slot: "gloves", ac: 2, mhp: 100, con: 1, req: "knight", safe: 4, p: 150000, legend: true, gachaWeight: 1, d: "墮落者的傳說手套，握緊時彷彿能感受到墮落前殘存的氣力。" },
        "bot_fallen": { n: "墮落長靴", type: "arm", slot: "boots", ac: 2, mhp: 100, req: "elf", safe: 4, p: 150000, legend: true, gachaWeight: 1, d: "墮落者的傳說長靴，踏過深淵也不曾停下的步伐凝結其上。" },
        "wpn_blackflame_sword": { n: "黑燄之劍", type: "wpn", dmgS: 16, dmgL: 10, hit: 2, dmgBonus: 0, spd: 0.9, req: "knight", safe: 6, p: 10000, gachaWeight: 20, unBonus: true, d: "以炎魔之力鍛成的漆黑長劍，劍刃燃著看不見的黑色火焰。反擊、居合、對不死 / 狼人加成。" },
        "wpn_redflame_bow": { n: "赤焰之弓", type: "wpn", isBow: true, ranged: true, rapidfire: 70, w2h: true, dmgS: 3, dmgL: 3, hit: 2, dmgBonus: 4, spd: 1.0, req: "elf", safe: 6, p: 10000, gachaWeight: 20, d: "灌注炎魔之力的長弓，拉滿弦時箭尖泛起赤紅的熱浪。" },
        "wpn_redflame_sword": { n: "赤焰之劍", type: "wpn", dmgS: 14, dmgL: 6, hit: 4, dmgBonus: 0, spd: 0.9, req: "elf", safe: 6, p: 10000, gachaWeight: 20, unBonus: true, d: "灌注炎魔之力的烈焰之劍，揮砍時帶起灼人的赤光。反擊、居合、對不死 / 狼人加成。" },
        "wpn_mana_orb": { n: "瑪那水晶球", type: "arm", slot: "shield", ac: 2, block: 10, mmp: 100, int: 1, req: "mage", safe: 4, p: 10000, gachaWeight: 20, d: "凝聚瑪那之力的水晶球盾，澄澈的核心中緩緩流轉著無盡魔力。" },
        // 🔥 50 級試煉長靴（迪嘉勒廷·交付炎魔素材兌換；各職業專屬·AC-3·安定4·重量15·席琳可兌換）
        "bot_divine_will": { n: "神意長靴", type: "arm", slot: "boots", ac: 3, cha: 1, req: "royal", safe: 4, p: 12000, gachaWeight: 10, d: "👑 承載王族神聖意志的長靴，每一步都散發君臨天下的威儀。" },
        "bot_courage":     { n: "勇氣長靴", type: "arm", slot: "boots", ac: 3, meleeHit: 1, req: "knight", safe: 4, p: 12000, gachaWeight: 10, d: "鼓舞騎士勇往直前的長靴，踏出無畏的步伐。" },
        "bot_sephia":      { n: "賽菲亞長靴", type: "arm", slot: "boots", ac: 3, rangedHit: 1, req: "elf", safe: 4, p: 12000, gachaWeight: 10, d: "賽菲亞祝福的輕盈長靴，使妖精的步伐如風、箭矢更準。" },
        "bot_mana":        { n: "瑪那長靴", type: "arm", slot: "boots", ac: 3, mpR: 2, req: "mage", safe: 4, p: 12000, gachaWeight: 10, d: "蘊含瑪那之力的長靴，行走間不斷牽引魔力回流。" },
        "wpn_death_finger": { n: "死亡之指", type: "wpn", w2h: true, dmgS: 17, dmgL: 15, hit: 3, dmgBonus: 2, spd: 0.9, req: "dark", safe: 6, p: 10000, gachaWeight: 20, eff: "combo", comboRate: 20, procPoison: { rate: 2, dur: 15, tick: 3, dmg: [1, 8] }, d: "墮落之力凝成的枯瘦指爪，觸及之物無不沾染腐毒。" },
        // ===== 🌑 暗影神殿：材料 / 鑰匙 =====
        "mat_chaos_head": { n: "混沌首級", type: "etc", p: 1, c: "text-purple-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_death_head": { n: "死亡首級", type: "etc", p: 1, c: "text-purple-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_shadow_temple_key": { n: "暗影神殿鑰匙", type: "etc", p: 1, c: "text-amber-300", noUse: true, noSell: true, gachaWeight: 0, d: "進入暗影神殿所需的鑰匙。持有即可進入（不會被消耗），另需炎魔友好度達標。" },
        // ===== 🌑 暗影神殿：混沌系列（混沌 掉落） =====
        "wpn_chaos_thorn": { n: "混沌之刺", type: "wpn", dmgS: 18, dmgL: 2, hit: 0, dmgBonus: 2, spd: 0.6, req: "all", safe: 0, p: 21000, gachaWeight: 10, d: "自混沌中誕生的匕首，刃身扭曲難辨、所傷必裂血不止。攻擊帶有出血。" },
        "hlm_chaos": { n: "混沌頭盔", type: "arm", slot: "helm", ac: 1, stunResist: 100, req: "all", safe: 0, p: 15000, gachaWeight: 10, d: "由混沌之力塑成的頭盔，戴上後心神再不為昏聵所動。免疫暈眩。" },
        "clk_chaos": { n: "混沌斗篷", type: "arm", slot: "cloak", ac: 3, mr: 10, mrPerEn: 3, req: "all", safe: 0, p: 15000, gachaWeight: 10, d: "以混沌織就的斗篷，愈是強化，抵禦魔力的力場便愈深沉。" },
        "amr_chaos": { n: "混沌法袍", type: "arm", slot: "armor", ac: 6, mpR: 12, req: "mage", safe: 0, p: 25000, gachaWeight: 10, d: "混沌之力編成的法袍，吸納四散的魔力源源回灌。" },
        "glv_chaos": { n: "混沌手套", type: "arm", slot: "gloves", ac: 3, str: 1, req: "all", safe: 0, p: 25000, gachaWeight: 10, d: "沾染混沌氣息的手套，握拳間湧出原始的蠻力。" },
        // ===== 🌑 暗影神殿：死亡系列（死亡 掉落・傳說） =====
        "clk_death": { n: "死亡斗篷", type: "arm", slot: "cloak", ac: 3, str: 1, mhp: 100, mmp: 50, hpR: -10, req: "all", safe: 0, p: 55000, legend: true, gachaWeight: 1, d: "散發死亡氣息的傳說斗篷，以生機為代價換來磅礴之力。" },
        "amr_death": { n: "死亡盔甲", type: "arm", slot: "armor", ac: 8, str: 2, dex: 2, wis: -2, cha: -2, hpR: 5, req: "knight", safe: 0, p: 85000, legend: true, gachaWeight: 1, d: "亡者之魂縈繞的傳說盔甲，賜予力量與敏捷，卻奪去心神與光采。" },
        "glv_death": { n: "死亡手套", type: "arm", slot: "gloves", ac: 3, str: 1, dex: 1, cha: -2, req: "all", safe: 0, p: 75000, legend: true, gachaWeight: 1, d: "死亡所淬鍊的傳說手套，握者得其力與巧，卻為旁人所畏。" },
        "shd_death": { n: "死亡之盾", type: "arm", slot: "shield", ac: 1, block: 100, stunResist: 100, req: "knight,elf,dark", safe: 0, p: 45000, legend: true, gachaWeight: 1, d: "由死亡本身鑄成的傳說之盾，任何打擊都被它無聲吞沒。" },
        // ===== 🛡️ 臂甲（裝於「副手/盾牌」欄，可與雙手武器並用；type:arm 沿用盾牌的祝福/詞綴/上限+15；強化每+1 HP+10；門檻特效達標套用、取最高階非累加）=====
        "armguard_guardian": { n: "守護者臂甲", type: "arm", slot: "shield", ac: 1, req: "knight,elf,dark", safe: 0, p: 52000, gachaWeight: 10, armguard: { stat: "dr", base: 1, th: [1, 2, 3] }, d: "守護者代代相傳的臂甲（裝於副手，可與雙手武器並用），堅實的護面為持有者擋下重擊。" },
        "armguard_mage": { n: "法師臂甲", type: "arm", slot: "shield", ac: 2, int: 2, req: "mage", safe: 0, p: 52000, gachaWeight: 10, armguard: { stat: "magicDmg", base: 0, th: [1, 2, 3] }, d: "刻滿符文的法師臂甲（裝於副手，可與雙手武器並用），引導魔力流轉於指尖。" },
        "armguard_con": { n: "體力臂甲", type: "arm", slot: "shield", ac: 0, req: "knight,elf,dark", safe: 0, p: 52000, gachaWeight: 10, armguard: { stat: "mhp", base: 50, th: [25, 50, 75] }, d: "厚重結實的體力臂甲（裝於副手，可與雙手武器並用），承載著千錘百鍊的強韌體魄。" },
        "item_olin_diary": { n: "歐林的日記本", type: "etc", p: 0, c: "text-amber-300", gachaWeight: 0, d: "歐林留下的日記本。可交給說話之島的尤麗婭，換取一件臂甲（三選一）。" },
        // ===== 👑 惡魔王武器（炎魔之影 客製製作；強化值/詞綴/席琳套裝由被消耗的惡魔武器繼承） =====
        "wpn_demonking_spear": { n: "惡魔王矛", type: "wpn", w2h: true, dmgS: 25, dmgL: 25, hit: 2, dmgBonus: 3, spd: 1.1, req: "knight", safe: 6, p: 380000, legend: true, gachaWeight: 1, eff: "pierce", pierceChance: 90, procStatusSkill: { skId: "sk_disease", rate: 10 }, d: "惡魔王執掌的雙手長矛，矛尖所向皆化作瘟疫橫行之地。" },
        "wpn_demonking_dual": { n: "惡魔王雙刀", type: "wpn", w2h: true, dmgS: 18, dmgL: 16, hit: 5, dmgBonus: 3, spd: 0.8, req: "dark", safe: 6, p: 420000, legend: true, gachaWeight: 1, eff: "combo", procStatusSkill: { skId: "sk_disease", rate: 10 }, d: "惡魔王手中的雙刀，交錯的刃光帶來病厄與死亡。" },
        "wpn_demonking_2hsword": { n: "惡魔王雙手劍", type: "wpn", w2h: true, dmgS: 23, dmgL: 24, hit: 1, dmgBonus: 5, spd: 0.9, req: "knight", safe: 6, p: 354510, legend: true, gachaWeight: 1, eff: "cleave", procStatusSkill: { skId: "sk_disease", rate: 10 }, d: "惡魔王曾以此巨劍劈開無數生靈，劍鋒至今仍滲著腐敗的氣息。" },
        "wpn_demonking_wand": { n: "惡魔王魔杖", type: "wpn", w2h: true, dmgS: 12, dmgL: 12, hit: 6, dmgBonus: 2, spd: 1.0, req: "mage", safe: 6, p: 494510, legend: true, gachaWeight: 1, eff: "magicburst", mdmg: 2, mpR: 10, mpOnHit: true, procStatusSkill: { skId: "sk_disease", rate: 10 }, d: "惡魔王施法用的魔杖，杖端凝著不散的瘴癘之力。" },
        "wpn_demonking_bow": { n: "惡魔王弓", type: "wpn", isBow: true, ranged: true, rapidfire: 90, w2h: true, dmgS: 5, dmgL: 5, hit: 4, dmgBonus: 6, spd: 1.0, req: "elf", safe: 6, p: 547300, legend: true, gachaWeight: 1, procStatusSkill: { skId: "sk_disease", rate: 10 }, d: "惡魔王的長弓，射出的每一箭都帶著瘟疫的詛咒。" },
        // ===== 🏝️ 遺忘之島：武器 =====
        "wpn_greatsword": { n: "巨劍", type: "wpn", w2h: true, dmgS: 20, dmgL: 14, hit: 0, dmgBonus: 0, spd: 1, req: "knight", safe: 6, p: 15000, gachaWeight: 80, eff: "cleave", d: "沉重而厚實的雙手巨劍，一揮便能將成排敵人一同斬開。切割。" },
        "wpn_taurus_axe": { n: "牛人斧頭", type: "wpn", w2h: true, dmgS: 22, dmgL: 24, hit: 0, dmgBonus: 0, spd: 1.2, req: "knight", safe: 6, p: 15000, gachaWeight: 30, eff: "crush", d: "牛人族戰士慣用的雙手鈍器，蠻力一砸足以震碎骨骼。重擊。" },
        "wpn_shaha_bow": { n: "沙哈之弓", type: "wpn", isBow: true, ranged: true, w2h: true, legend: true, rapidfire: 70, dmgS: 4, dmgL: 4, hit: 2, dmgBonus: 5, spd: 1.0, req: "elf", safe: 6, p: 230000, gachaWeight: 0, shahaBow: true, d: "傳說中神射手沙哈所遺的名弓，拉滿弦時便有清風自箭袋憑空生出。" },
        "wpn_shaha_arrow": { n: "沙哈之箭", type: "wpn", img: "assets/icons/weapons/箭.png", isArrow: true, dmgS: 15, dmgL: 12, hit: 0, p: 0, gachaWeight: 0, shahaArrow: true, noSell: true, d: "沙哈之弓憑風凝成的箭矢，取之不竭（卸下沙哈之弓即消失）。" },
        // ===== 🏝️ 遺忘之島：防具 =====
        "hlm_wind": { n: "風之頭盔", type: "arm", slot: "helm", ac: 2, req: "mage", safe: 4, p: 26000, gachaWeight: 10, windHelm: true, d: "以疾風祝福鍛成的頭盔，戴上時身形彷彿被風托起。" },
        "hlm_darkelf": { n: "黑暗妖精頭箍", type: "arm", slot: "helm", ac: 1, req: "elf,dark", safe: 6, p: 6000, gachaWeight: 30, d: "承載著高等黑暗精靈血脈記憶的頭箍，集齊全套方能喚醒沉睡的暗夜之姿。" },
        "amr_darkelf": { n: "黑暗妖精鱗甲", type: "arm", slot: "armor", ac: 1, req: "elf,dark", safe: 6, p: 10000, gachaWeight: 30, d: "以暗影精煉而成的鱗甲，與其餘部件呼應時便流轉著幽冷光澤。" },
        "bot_darkelf": { n: "黑暗妖精涼鞋", type: "arm", slot: "boots", ac: 1, req: "elf,dark", safe: 6, p: 6000, gachaWeight: 30, d: "步履無聲的黑暗妖精涼鞋，齊備全套時方顯其敏捷真章。" },
        // ===== 🏝️ 遺忘之島：飾品 =====
        "rng_harpy": { n: "哈維戒指", type: "acc", slot: "ring", ac: 0, resWind: 10, mpR: 1, req: "all", safe: 0, p: 100000, gachaWeight: 1, d: "鑲嵌哈維羽風的戒指，戴上時指間隱隱有微風盤旋。" },
        // ===== 🏝️ 遺忘之島：製作材料 =====
        "item_ancient_scroll": { n: "古代的卷軸", type: "etc", p: 1, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_wind_tear": { n: "風之淚", type: "etc", p: 1, c: "text-cyan-300", noUse: true, gachaWeight: 0, d: "製作材料。沙哈之弓的材料之一。" },
        "item_unknown_spear": { n: "不為人知的矛", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "mat_unknown_axe": { n: "不為人知的斧", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_forgotten_sword": { n: "受封印 被遺忘的劍", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_forgotten_greatsword": { n: "受封印 被遺忘的巨劍", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_forgotten_xbow": { n: "受封印 被遺忘的弩槍", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_forgotten_scale": { n: "被遺忘的鱗甲", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_forgotten_leather": { n: "被遺忘的皮盔甲", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_forgotten_robe": { n: "被遺忘的長袍", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        "item_forgotten_plate": { n: "被遺忘的金屬盔甲", type: "etc", p: 1, c: "text-blue-300", noUse: true, gachaWeight: 0, d: "製作材料。" },
        // ===== 🏛️ 古代/古老裝備（威頓村 客盧亞 製作）=====
        "armguard_archer": { n: "古代神射臂甲", type: "arm", slot: "shield", ac: 0, mhp: 80, req: "all", safe: 0, p: 100000, gachaWeight: 0, armguard: { stat: "rangedDmg", base: 1, th: [1, 2, 3] }, d: "古代神射手綁縛拉弦之臂的護甲，仍留有他百步穿楊的氣度（裝於副手，可與雙手武器並用）。" },
        "armguard_fighter": { n: "古代鬥士臂甲", type: "arm", slot: "shield", ac: 0, resFire: 5, resWater: 5, resEarth: 5, resWind: 5, req: "all", safe: 0, p: 100000, gachaWeight: 0, armguard: { stat: "meleeDmg", base: 1, th: [1, 2, 3] }, d: "古代競技場鬥士磨礪近身搏殺的臂甲，刻滿了無數場生死搏鬥的痕跡（裝於副手，可與雙手武器並用）。" },
        "wpn_old_sword": { n: "古老的劍", type: "wpn", dmgS: 35, dmgL: 20, hit: 5, dmgBonus: 0, spd: 0.8, req: "knight,elf,dark", safe: 0, p: 15000, gachaWeight: 0, noEnhance: true, d: "塵封已久的古代單手劍，劍身雖舊，鋒芒卻不減當年。反擊、居合；無法強化，但可請象牙塔的碧恩賦予屬性（免 +10/+11 門檻，可直上第五階）。" },
        "wpn_old_greatsword": { n: "古老的巨劍", type: "wpn", w2h: true, dmgS: 27, dmgL: 45, hit: 3, dmgBonus: 3, spd: 0.9, req: "knight", safe: 0, p: 15000, gachaWeight: 0, eff: "cleave", noEnhance: true, d: "古老戰場上遺落的雙手巨劍，沉甸甸的劍身仍能一掃千軍。切割；無法強化，但可請象牙塔的碧恩賦予屬性（免 +10/+11 門檻，可直上第五階）。" },
        "wpn_old_xbow": { n: "古老的弩槍", type: "wpn", isBow: true, ranged: true, oneHand: true, rapidfire: 90, dmgS: 3, dmgL: 3, hit: 5, dmgBonus: 2, spd: 0.9, req: "elf,dark", safe: 6, p: 15000, gachaWeight: 0, d: "古代工匠巧製的單手弩槍，是有史以來第一把可單手持握的弓。" },
        "wpn_ancient_spear": { n: "古代神之槍", type: "wpn", w2h: true, legend: true, dmgS: 27, dmgL: 30, hit: 3, dmgBonus: 5, spd: 1.1, req: "knight", safe: 6, p: 465000, gachaWeight: 0, eff: "pierce", pierceChance: 90, d: "傳說由古代神祇親手持握的雙手神槍，槍尖所向無可阻擋。" },
        "wpn_ancient_axe": { n: "古代神之斧", type: "wpn", legend: true, dmgS: 25, dmgL: 28, hit: 3, dmgBonus: 8, spd: 1, req: "warrior", safe: 6, p: 465000, gachaWeight: 0, d: "古代神祇腰間配掛的單手神斧，劈下時連神明也為之低首。鈍擊。" },
        "wpn_ancient_darkelf_sword": { n: "古代黑暗妖精之劍", type: "wpn", dmgS: 12, dmgL: 12, hit: 3, dmgBonus: 1, spd: 0.9, req: "elf", safe: 6, p: 68000, gachaWeight: 1, unBonus: true, dex: 1, mhp: 50, d: "古代黑暗妖精所執的單手劍，劍身流轉著暗夜的寒光。" },
        "wpn_ancient_elf_xbow": { n: "古代妖精弩槍", type: "wpn", isBow: true, ranged: true, oneHand: true, rapidfire: 55, dmgS: 3, dmgL: 3, hit: 1, dmgBonus: 2, spd: 1.0, req: "elf", safe: 6, p: 68000, gachaWeight: 1, dex: 1, d: "古代妖精打造的單手弩槍，輕巧迅捷、箭如疾風。" },
        // ===== 👹 隱藏的魔族武器（說話之島 尤麗婭以 黑暗哈汀的日記本 六選一兌換；紅惡靈逆襲＝水魔傷+吸HP / 藍惡靈奪魔＝回MP，4%+每強化1%） =====
        "wpn_demon_sword_hidden": { n: "隱藏的魔族之劍", type: "wpn", dmgS: 23, dmgL: 25, hit: 3, dmgBonus: 0, spd: 0.9, req: "royal,knight,elf,dragon", safe: 0, p: 28000, gachaWeight: 1, mhp: 30, ignHardSkin: true, redSpecter: true, d: "潛藏魔族之力的單手劍，劍身浮現赤紅惡靈的低語。" },
        "wpn_demon_bow_hidden": { n: "隱藏的魔族弓箭", type: "wpn", isBow: true, ranged: true, oneHand: true, rapidfire: 70, dmgS: 2, dmgL: 2, hit: 3, dmgBonus: 6, spd: 1.0, req: "royal,mage,elf,illusion", safe: 0, p: 28000, gachaWeight: 1, blueSpecter: true, d: "潛藏魔族之力的單手弓，弦上纏繞著湛藍惡靈的氣息。" },
        "wpn_demon_wand_hidden": { n: "隱藏的魔族魔杖", type: "wpn", dmgS: 15, dmgL: 16, hit: 3, dmgBonus: 0, spd: 1.0, mdmg: 1, mpR: 3, req: "mage,illusion", safe: 0, p: 28000, gachaWeight: 1, blueSpecter: true, d: "潛藏魔族之力的魔杖，杖頭湛藍惡靈共鳴不息。" },
        "wpn_demon_claw_hidden": { n: "隱藏的魔族鋼爪", type: "wpn", w2h: true, dmgS: 24, dmgL: 26, hit: 3, dmgBonus: 0, spd: 0.9, eff: "combo", comboRate: 33, req: "dark", safe: 0, p: 28000, gachaWeight: 1, redSpecter: true, d: "潛藏魔族之力的雙手鋼爪，爪尖撕扯間迸出赤紅惡靈之火。" },
        "wpn_demon_chain_hidden": { n: "隱藏的魔族鎖鏈劍", type: "wpn", w2h: true, chainsword: true, weakExpose: true, dmgS: 25, dmgL: 26, hit: 3, dmgBonus: 0, spd: 0.9, req: "dragon", safe: 0, p: 28000, gachaWeight: 1, redSpecter: true, d: "潛藏魔族之力的雙手鎖鏈劍，鏈節間糾纏著赤紅惡靈的怨念。" },
        "wpn_demon_qigu_hidden": { n: "隱藏的魔族奇古獸", type: "wpn", qigu: true, dmgS: 28, dmgL: 28, hit: 3, dmgBonus: 0, spd: 1.0, mdmg: 1, mpR: 1, req: "illusion", safe: 0, p: 28000, gachaWeight: 1, blueSpecter: true, d: "潛藏魔族之力的奇古獸，獸身散發湛藍惡靈的魔力。" },
        "amr_old_plate": { n: "古老的金屬盔甲", type: "arm", slot: "armor", ac: 16, hpR: 1, req: "knight", safe: 0, p: 10000, gachaWeight: 0, noEnhance: true, d: "歷經歲月仍未鏽蝕的古代金屬盔甲，沉默地守護著穿戴者。" },
        "amr_old_scale": { n: "古老的鱗甲", type: "arm", slot: "armor", ac: 14, hpR: 8, mpR: 4, req: "knight,elf,dark", safe: 0, p: 10000, gachaWeight: 0, noEnhance: true, d: "古代工匠以層層鱗片疊織的鎧甲，輕巧卻不失堅韌。" },
        "amr_old_leather": { n: "古老的皮盔甲", type: "arm", slot: "armor", ac: 14, hpR: 4, mpR: 8, req: "elf,dark", safe: 0, p: 10000, gachaWeight: 0, noEnhance: true, d: "古代遊俠所穿的皮製戰甲，柔軟貼身，行動無拘。" },
        "amr_old_robe": { n: "古老的長袍", type: "arm", slot: "armor", ac: 12, mpR: 12, req: "mage", safe: 0, p: 10000, gachaWeight: 0, noEnhance: true, d: "古代術士披掛的長袍，織線間仍縈繞著淡淡的魔力餘韻。" },
        // 🔥 滅魔系列（威頓村・宙斯之熔岩高崙製作＝古老的盔甲＋+7以上抗魔法鏈甲＋金幣1000萬·依《滅魔裝備.md》）：高魔防盔甲·每強化+1魔防額外+1
        "amr_slayer_plate": { n: "滅魔的 金屬盔甲", type: "arm", slot: "armor", ac: 15, mhp: 20, hpR: 1, mr: 7, mrPerEn: 1, req: "knight,warrior", safe: 0, p: 500000, gachaWeight: 0, d: "熔岩爐火重鑄的滅魔戰甲，甲面銀紋流轉，令邪法無從近身。" },
        "amr_slayer_shawl": { n: "滅魔的 披肩", type: "arm", slot: "armor", ac: 11, mhp: 20, mpR: 12, mr: 7, mrPerEn: 1, req: "mage,illusion", safe: 0, p: 500000, gachaWeight: 0, d: "織入滅魔銀線的術士披肩，輕若無物，卻能撥開襲來的咒殺。" },
        "amr_slayer_scale": { n: "滅魔的 鱗甲", type: "arm", slot: "armor", ac: 14, mhp: 20, hpR: 8, mpR: 4, mr: 7, mrPerEn: 1, req: "royal,dragon", safe: 0, p: 500000, gachaWeight: 0, d: "以滅魔之力淬鍊的層鱗鎧甲，每一片鱗都映著驅魔的冷光。" },
        "amr_slayer_vine": { n: "滅魔的 小藤甲", type: "arm", slot: "armor", ac: 13, mhp: 20, hpR: 4, mpR: 8, mr: 7, mrPerEn: 1, req: "elf,dark,dragon,illusion", safe: 0, p: 500000, gachaWeight: 0, d: "滅魔藤蔓編成的輕甲，柔韌貼身，妖邪之氣無法滲入。" },
        // ===== 法師魔法書 =====
        "bk_heal1": { type: "skillbk", n: "魔法書(初級治癒術)", p: 100, sk: "sk_heal1", gachaWeight: 0 },
        "bk_sunlight": { type: "skillbk", n: "魔法書(日光術)", p: 100, sk: "sk_sunlight", gachaWeight: 0 },
        "bk_shield": { type: "skillbk", n: "魔法書(保護罩)", p: 100, sk: "sk_shield", gachaWeight: 0 },
        "bk_lightarrow": { type: "skillbk", n: "魔法書(光箭)", p: 100, sk: "sk_lightarrow", gachaWeight: 0 },
        "bk_teleport": { type: "skillbk", n: "魔法書(指定傳送)", p: 100, sk: "sk_teleport", gachaWeight: 0 },
        "bk_icearrow": { type: "skillbk", n: "魔法書(冰箭)", p: 100, sk: "sk_icearrow", gachaWeight: 0 },
        "bk_windblade": { type: "skillbk", n: "魔法書(風刃)", p: 100, sk: "sk_windblade", gachaWeight: 0 },
        "bk_holy_wpn": { type: "skillbk", n: "魔法書(神聖武器)", p: 100, sk: "sk_holy_wpn", gachaWeight: 0 },
        
        "bk_antidote": { type: "skillbk", n: "魔法書(解毒術)", p: 400, sk: "sk_antidote", gachaWeight: 0 },
        "bk_cold_shiver": { type: "skillbk", n: "魔法書(寒冷戰慄)", p: 400, sk: "sk_cold_shiver", gachaWeight: 0 },
        "bk_poison_curse": { type: "skillbk", n: "魔法書(毒咒)", p: 400, sk: "sk_poison_curse", gachaWeight: 0 },
        "bk_ench_wpn": { type: "skillbk", n: "魔法書(擬似魔法武器)", p: 400, sk: "sk_ench_wpn", gachaWeight: 0 },
        "bk_reveal": { type: "skillbk", n: "魔法書(無所遁形術)", p: 400, sk: "sk_reveal", gachaWeight: 0 },
        "bk_load_up": { type: "skillbk", n: "魔法書(負重強化)", p: 400, sk: "sk_load_up", gachaWeight: 0 },
        "bk_firearrow": { type: "skillbk", n: "魔法書(火箭)", p: 400, sk: "sk_firearrow", gachaWeight: 0 },
        "bk_hell_fang": { type: "skillbk", n: "魔法書(地獄之牙)", p: 400, sk: "sk_hell_fang", gachaWeight: 0 },

        "bk_aurora": { type: "skillbk", n: "魔法書(極光雷電)", p: 1200, sk: "sk_aurora", gachaWeight: 0 },
        "bk_undead_bane": { type: "skillbk", n: "魔法書(起死回生術)", p: 1200, sk: "sk_undead_bane", gachaWeight: 0 },
        "bk_heal_mid": { type: "skillbk", n: "魔法書(中級治癒術)", p: 1200, sk: "sk_heal_mid", gachaWeight: 0 },
        "bk_dark_blind": { type: "skillbk", n: "魔法書(闇盲咒術)", p: 1200, sk: "sk_dark_blind", gachaWeight: 0 },
        "bk_shield2": { type: "skillbk", n: "魔法書(鎧甲護持)", p: 1200, sk: "sk_shield2", gachaWeight: 0 },
        "bk_chill": { type: "skillbk", n: "魔法書(寒冰氣息)", p: 1200, sk: "sk_chill", gachaWeight: 0 },
        "bk_energy_sense": { type: "skillbk", n: "魔法書(能量感測)", p: 1200, sk: "sk_energy_sense", gachaWeight: 0 },
        "bk_fireball": { type: "skillbk", n: "魔法書(燃燒的火球)", p: 1200, sk: "sk_fireball", gachaWeight: 0 },

        "bk_dex_up": { type: "skillbk", n: "魔法書(通暢氣脈術)", p: 3300, sk: "sk_dex_up", gachaWeight: 30 },
        "bk_break": { type: "skillbk", n: "魔法書(壞物術)", p: 3300, sk: "sk_break", gachaWeight: 80 },
        "bk_vampire": { type: "skillbk", n: "魔法書(吸血鬼之吻)", p: 3300, sk: "sk_vampire", gachaWeight: 80 },
        "bk_slow": { type: "skillbk", n: "魔法書(緩速術)", p: 3300, sk: "sk_slow", gachaWeight: 80 },
        "bk_rock_prison": { type: "skillbk", n: "魔法書(岩牢)", p: 3300, sk: "sk_rock_prison", gachaWeight: 80 },
        "bk_magic_shield": { type: "skillbk", n: "魔法書(魔法屏障)", p: 3300, sk: "sk_magic_shield", gachaWeight: 20 },
        "bk_meditation": { type: "skillbk", n: "魔法書(冥想術)", p: 3300, sk: "sk_meditation", gachaWeight: 20 },

        "bk_mummy_curse": { type: "skillbk", n: "魔法書(木乃伊的詛咒)", p: 8250, sk: "sk_mummy_curse", gachaWeight: 70 },
        "bk_charm": { type: "skillbk", n: "魔法書(迷魅術)", p: 8250, sk: "sk_charm", gachaWeight: 70 },
        "bk_thunder": { type: "skillbk", n: "魔法書(極道落雷)", p: 8250, sk: "sk_thunder", gachaWeight: 70 },
        "bk_heal2": { type: "skillbk", n: "魔法書(高級治癒術)", p: 8250, sk: "sk_heal2", gachaWeight: 70 },
        "bk_holy_light": { type: "skillbk", n: "魔法書(聖潔之光)", p: 8250, sk: "sk_holy_light", gachaWeight: 50 },
        "bk_ice_spike": { type: "skillbk", n: "魔法書(冰錐)", p: 8250, sk: "sk_ice_spike", gachaWeight: 70 },
        "bk_mana_drain": { type: "skillbk", n: "魔法書(魔力奪取)", p: 8250, sk: "sk_mana_drain", gachaWeight: 70 },
        "bk_dark_shadow": { type: "skillbk", n: "魔法書(黑闇之影)", p: 8250, sk: "sk_dark_shadow", gachaWeight: 70 },

        "bk_zombie": { type: "skillbk", n: "魔法書(造屍術)", p: 18000, sk: "sk_zombie", gachaWeight: 60 },
        "bk_haste_spell": { type: "skillbk", n: "魔法書(加速術)", p: 18000, sk: "sk_haste_spell", gachaWeight: 60 },
        "bk_cancel": { type: "skillbk", n: "魔法書(魔法相消術)", p: 18000, sk: "sk_cancel", gachaWeight: 10 },
        "bk_earthquake": { type: "skillbk", n: "魔法書(地裂術)", p: 18000, sk: "sk_earthquake", gachaWeight: 20 },
        "bk_str_up": { type: "skillbk", n: "魔法書(體魄強健術)", p: 18000, sk: "sk_str_up", gachaWeight: 10 },
        "bk_bless_wpn": { type: "skillbk", n: "魔法書(祝福魔法武器)", p: 18000, sk: "sk_bless_wpn", gachaWeight: 10 },
        "bk_weaken": { type: "skillbk", n: "魔法書(弱化術)", p: 18000, sk: "sk_weaken", gachaWeight: 60 },

        "bk_regen": { type: "skillbk", n: "魔法書(體力回復術)", p: 36000, sk: "sk_regen", gachaWeight: 50 },
        "bk_greater_haste": { type: "skillbk", n: "魔法書(強力加速術)", p: 36000, sk: "sk_greater_haste", gachaWeight: 50 },
        "bk_ice_lance": { type: "skillbk", n: "魔法書(冰矛圍籬)", p: 36000, sk: "sk_ice_lance", gachaWeight: 20 },
        "bk_tornado": { type: "skillbk", n: "魔法書(龍捲風)", p: 36000, sk: "sk_tornado", gachaWeight: 1 },
        "bk_berserk": { type: "skillbk", n: "魔法書(狂暴術)", p: 36000, sk: "sk_berserk", gachaWeight: 30 },
        "bk_summon": { type: "skillbk", n: "魔法書(召喚術)", p: 36000, sk: "sk_summon", gachaWeight: 1 },
        "bk_holy_dash": { type: "skillbk", n: "魔法書(神聖疾走)", p: 36000, sk: "sk_holy_dash", gachaWeight: 10 },
        "bk_disease": { type: "skillbk", n: "魔法書(疾病術)", p: 36000, sk: "sk_disease", gachaWeight: 50 },

        "bk_full_heal": { type: "skillbk", n: "魔法書(全部治癒術)", p: 54000, sk: "sk_full_heal", gachaWeight: 40 },
        "bk_blizzard": { type: "skillbk", n: "魔法書(冰雪暴)", p: 54000, sk: "sk_blizzard", gachaWeight: 1 },
        "bk_blizzard_storm": { type: "skillbk", n: "魔法書(冰雪颶風)", p: 102400, sk: "sk_blizzard_storm", gachaWeight: 1, d: "記載著「冰雪颶風」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_fire_prison": { type: "skillbk", n: "魔法書(火牢)", p: 25600, sk: "sk_fire_prison", gachaWeight: 1, d: "記載著「火牢」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_heal_energy_storm": { type: "skillbk", n: "魔法書(治癒能量風暴)", p: 25600, sk: "sk_heal_energy_storm", gachaWeight: 1, d: "記載著「治癒能量風暴」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_quake": { type: "skillbk", n: "魔法書(震裂術)", p: 54000, sk: "sk_quake", gachaWeight: 10 },
        "bk_invisible": { type: "skillbk", n: "魔法書(隱身術)", p: 54000, sk: "sk_invisible", gachaWeight: 1 },
        "bk_resurrection": { type: "skillbk", n: "魔法書(返生術)", p: 54000, sk: "sk_resurrection", gachaWeight: 1 },
        "bk_seal": { type: "skillbk", n: "魔法書(魔法封印)", p: 54000, sk: "sk_seal", gachaWeight: 40 },

        "bk_holy_barrier": { type: "skillbk", n: "魔法書(聖結界)", p: 120000, sk: "sk_holy_barrier", gachaWeight: 1 },
        "bk_sleep_mist": { type: "skillbk", n: "魔法書(沉睡之霧)", p: 120000, sk: "sk_sleep_mist", gachaWeight: 30 },
        "bk_thunder_storm": { type: "skillbk", n: "魔法書(雷霆風暴)", p: 120000, sk: "sk_thunder_storm", gachaWeight: 10 },
        "bk_fire_storm": { type: "skillbk", n: "魔法書(火風暴)", p: 120000, sk: "sk_fire_storm", gachaWeight: 1 },
        "bk_blaze": { type: "skillbk", n: "魔法書(烈炎術)", p: 6400, sk: "sk_blaze", gachaWeight: 0 },

        "bk_meteor": { type: "skillbk", n: "魔法書(流星雨)", p: 250000, sk: "sk_meteor", gachaWeight: 1 },
        "bk_soul_up": { type: "skillbk", n: "魔法書(靈魂昇華)", p: 250000, sk: "sk_soul_up", gachaWeight: 1 },
        "bk_abs_barrier": { type: "skillbk", n: "魔法書(絕對屏障)", p: 102400, sk: "sk_abs_barrier", gachaWeight: 1, d: "記載著「絕對屏障」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },
        "bk_disintegrate": { type: "skillbk", n: "魔法書(究極光裂術)", p: 250000, sk: "sk_disintegrate", gachaWeight: 1 },

        // ===== 騎士技術書 =====
        "bk_solid_shield": { type: "skillbk", n: "技術書(堅固防護)", p: 30000, sk: "sk_solid_shield", gachaWeight: 10 },
        "bk_reduction_armor": { type: "skillbk", n: "技術書(增幅防禦)", p: 30000, sk: "sk_reduction_armor", gachaWeight: 10 },
        "bk_shock_stun": { type: "skillbk", n: "技術書(衝擊之暈)", p: 30000, sk: "sk_shock_stun", gachaWeight: 10 },
        "bk_spike_armor": { type: "skillbk", n: "技術書(尖刺盔甲)", p: 30000, sk: "sk_spike_armor", gachaWeight: 1 },
        "bk_counter_barrier": { type: "skillbk", n: "技術書(反擊屏障)", p: 30000, sk: "sk_counter_barrier", gachaWeight: 1, d: "記載著「反擊屏障」術式的古老魔法書，研讀後可將咒文銘刻於記憶。" },

        // ===== 妖精精靈水晶 =====
        "bk_elf_mr": { type: "skillbk", n: "精靈水晶(魔法防禦)", p: 3000, sk: "sk_elf_mr", gachaWeight: 0 },
        "bk_elf_mind": { type: "skillbk", n: "精靈水晶(心靈轉換)", p: 3000, sk: "sk_elf_mind", gachaWeight: 0 },
        "bk_elf_worldtree": { type: "skillbk", n: "精靈水晶(世界樹的呼喚)", p: 3000, sk: "sk_elf_worldtree", gachaWeight: 0 },
        "bk_elf_triple": { type: "skillbk", n: "精靈水晶(三重矢)", p: 3000, sk: "sk_elf_triple", gachaWeight: 10 },

        "bk_elf_purify": { type: "skillbk", n: "精靈水晶(淨化精神)", p: 7500, sk: "sk_elf_purify", gachaWeight: 0 },
        "bk_elf_eleres": { type: "skillbk", n: "精靈水晶(屬性防禦)", p: 7500, sk: "sk_elf_eleres", gachaWeight: 0 },
        "bk_elf_release": { type: "skillbk", n: "精靈水晶(釋放元素)", p: 7500, sk: "sk_elf_release", gachaWeight: 0 },
        "bk_elf_soul": { type: "skillbk", n: "精靈水晶(魂體轉換)", p: 7500, sk: "sk_elf_soul", gachaWeight: 20 },

        "bk_elf_singleres": { type: "skillbk", n: "精靈水晶(單屬性防禦)", p: 15000, sk: "sk_elf_singleres", gachaWeight: 0 },
        "bk_elf_firewpn": { type: "skillbk", n: "精靈水晶(火焰武器)", p: 15000, sk: "sk_elf_firewpn", gachaWeight: 0 },
        "bk_elf_windshot": { type: "skillbk", n: "精靈水晶(風之神射)", p: 15000, sk: "sk_elf_windshot", gachaWeight: 0 },
        "bk_elf_winddash": { type: "skillbk", n: "精靈水晶(風之疾走)", p: 15000, sk: "sk_elf_winddash", gachaWeight: 0 },
        "bk_elf_earthguard": { type: "skillbk", n: "精靈水晶(大地防護)", p: 15000, sk: "sk_elf_earthguard", gachaWeight: 0 },
        "bk_elf_groundtrap": { type: "skillbk", n: "精靈水晶(地面障礙)", p: 15000, sk: "sk_elf_groundtrap", gachaWeight: 0 },

        "bk_elf_magicerase": { type: "skillbk", n: "精靈水晶(魔法消除)", p: 30000, sk: "sk_elf_magicerase", gachaWeight: 40 },
        "bk_elf_summon": { type: "skillbk", n: "精靈水晶(召喚屬性精靈)", p: 30000, sk: "sk_elf_summon", gachaWeight: 20 },
        "bk_elf_dancefire": { type: "skillbk", n: "精靈水晶(舞躍之火)", p: 30000, sk: "sk_elf_dancefire", gachaWeight: 10 },
        "bk_elf_stormeye": { type: "skillbk", n: "精靈水晶(暴風之眼)", p: 30000, sk: "sk_elf_stormeye", gachaWeight: 10 },
        "bk_elf_mirror": { type: "skillbk", n: "精靈水晶(鏡反射)", p: 16000, sk: "sk_elf_mirror", gachaWeight: 1, d: "封存著「鏡反射」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_earthshield": { type: "skillbk", n: "精靈水晶(大地屏障)", p: 30000, sk: "sk_elf_earthshield", gachaWeight: 10 },
        "bk_elf_lifespring": { type: "skillbk", n: "精靈水晶(生命之泉)", p: 30000, sk: "sk_elf_lifespring", gachaWeight: 10 },
        "bk_elf_earthbless": { type: "skillbk", n: "精靈水晶(大地的祝福)", p: 30000, sk: "sk_elf_earthbless", gachaWeight: 10, d: "封存著「大地的祝福」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },

        "bk_elf_summon2": { type: "skillbk", n: "精靈水晶(召喚強力屬性精靈)", p: 60000, sk: "sk_elf_summon2", gachaWeight: 1 },
        "bk_elf_lifebless": { type: "skillbk", n: "精靈水晶(生命的祝福)", p: 60000, sk: "sk_elf_lifebless", gachaWeight: 5 },
        "bk_elf_seal": { type: "skillbk", n: "精靈水晶(封印禁地)", p: 60000, sk: "sk_elf_seal", gachaWeight: 10 },
        "bk_elf_muddywater": { type: "skillbk", n: "精靈水晶(污濁之水)", p: 16000, sk: "sk_elf_muddywater", gachaWeight: 1, d: "封存著「污濁之水」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_blazewpn": { type: "skillbk", n: "精靈水晶(烈炎武器)", p: 60000, sk: "sk_elf_blazewpn", gachaWeight: 1 },
        "bk_elf_flamesoul": { type: "skillbk", n: "精靈水晶(烈焰之魂)", p: 16000, sk: "sk_elf_flamesoul", gachaWeight: 1, d: "封存著「烈焰之魂」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_physboost": { type: "skillbk", n: "精靈水晶(體能激發)", p: 16000, sk: "sk_elf_physboost", gachaWeight: 20, d: "封存著「體能激發」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_energyboost": { type: "skillbk", n: "精靈水晶(能量激發)", p: 16000, sk: "sk_elf_energyboost", gachaWeight: 20, d: "封存著「能量激發」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_attrfire": { type: "skillbk", n: "精靈水晶(屬性之火)", p: 16000, sk: "sk_elf_attrfire", gachaWeight: 1, d: "封存著「屬性之火」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_preciseshot": { type: "skillbk", n: "精靈水晶(精準射擊)", p: 16000, sk: "sk_elf_preciseshot", gachaWeight: 1, d: "封存著「精準射擊」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_stormshot": { type: "skillbk", n: "精靈水晶(暴風神射)", p: 60000, sk: "sk_elf_stormshot", gachaWeight: 1 },
        "bk_elf_steelguard": { type: "skillbk", n: "精靈水晶(鋼鐵防護)", p: 60000, sk: "sk_elf_steelguard", gachaWeight: 1, d: "封存著「鋼鐵防護」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        "bk_elf_watervital": { type: "skillbk", n: "精靈水晶(水之元氣)", p: 4000, sk: "sk_elf_watervital", gachaWeight: 10, d: "封存著「水之元氣」精靈之力的水晶，與之共鳴便能領悟其中奧祕。" },
        // ===== 黑暗精靈水晶（黑暗妖精魔法，賽帝亞販售；潘朵拉抽不到） =====
        "bk_dark_str":       { type: "skillbk", n: "黑暗精靈水晶(力量提升)", p: 500,   sk: "sk_dark_str",       gachaWeight: 0 },
        "bk_dark_mrup":      { type: "skillbk", n: "黑暗精靈水晶(影之防護)", p: 500,   sk: "sk_dark_mrup",      gachaWeight: 0 },
        "bk_dark_stealth":   { type: "skillbk", n: "黑暗精靈水晶(暗隱術)",   p: 500,   sk: "sk_dark_stealth",   gachaWeight: 0 },
        "bk_dark_poison":    { type: "skillbk", n: "黑暗精靈水晶(附加劇毒)", p: 500,   sk: "sk_dark_poison",    gachaWeight: 0 },
        "bk_dark_refine":    { type: "skillbk", n: "黑暗精靈水晶(提煉魔石)", p: 500,   sk: "sk_dark_refine",    gachaWeight: 0 },
        "bk_dark_dex":       { type: "skillbk", n: "黑暗精靈水晶(敏捷提升)", p: 2500,  sk: "sk_dark_dex",       gachaWeight: 0 },
        "bk_dark_poisonres": { type: "skillbk", n: "黑暗精靈水晶(毒性抵抗)", p: 2500,  sk: "sk_dark_poisonres", gachaWeight: 0 },
        "bk_dark_burn":      { type: "skillbk", n: "黑暗精靈水晶(燃燒鬥志)", p: 2500,  sk: "sk_dark_burn",      gachaWeight: 0 },
        "bk_dark_walkhaste": { type: "skillbk", n: "黑暗精靈水晶(行走加速)", p: 2500,  sk: "sk_dark_walkhaste", gachaWeight: 0 },
        "bk_dark_fang":      { type: "skillbk", n: "黑暗精靈水晶(暗影之牙)", p: 12500, sk: "sk_dark_fang",      gachaWeight: 10 },
        "bk_dark_dodge":     { type: "skillbk", n: "黑暗精靈水晶(暗影閃避)", p: 12500, sk: "sk_dark_dodge",     gachaWeight: 10 },
        "bk_dark_crit":      { type: "skillbk", n: "黑暗精靈水晶(會心一擊)", p: 12500, sk: "sk_dark_crit",      gachaWeight: 10 },
        "bk_dark_erup":      { type: "skillbk", n: "黑暗精靈水晶(迴避提升)", p: 12500, sk: "sk_dark_erup",      gachaWeight: 10 },
        "bk_dark_double":    { type: "skillbk", n: "黑暗精靈水晶(雙重破壞)", p: 12500, sk: "sk_dark_double",    gachaWeight: 10 },
        "bk_dark_armorbreak":{ type: "skillbk", n: "黑暗精靈水晶(破壞盔甲)", p: 12500, sk: "sk_dark_armorbreak", gachaWeight: 1 },
        // ===== 記憶水晶（幻術士法術，史菲爾販售）=====
        "mem_ogre":       { type: "skillbk", n: "記憶水晶(幻覺：歐吉)", p: 1800,  sk: "sk_illu_ogre",       gachaWeight: 0, d: "封存幻術「幻覺：歐吉」的記憶水晶，凝視其中便能窺見扭曲現實的祕法。" },
        "mem_confuse":    { type: "skillbk", n: "記憶水晶(混亂)",       p: 1800,  sk: "sk_illu_confuse",    gachaWeight: 0 },
        "mem_cube_burn":  { type: "skillbk", n: "記憶水晶(立方：燃燒)", p: 1800,  sk: "sk_illu_cube_burn",  gachaWeight: 0 },
        "mem_crush":      { type: "skillbk", n: "記憶水晶(粉碎能量)",   p: 1800,  sk: "sk_illu_crush",      gachaWeight: 0 },
        "mem_mirror":     { type: "skillbk", n: "記憶水晶(鏡像)",       p: 1800,  sk: "sk_illu_mirror",     gachaWeight: 0 },
        "mem_focus":      { type: "skillbk", n: "記憶水晶(專注)",       p: 4800,  sk: "sk_illu_focus",      gachaWeight: 0 },
        "mem_lich":       { type: "skillbk", n: "記憶水晶(幻覺：巫妖)", p: 4800,  sk: "sk_illu_lich",       gachaWeight: 0, d: "封存幻術「幻覺：巫妖」的記憶水晶，凝視其中便能窺見扭曲現實的祕法。" },
        "mem_mindbreak":  { type: "skillbk", n: "記憶水晶(心靈破壞)",   p: 4800,  sk: "sk_illu_mindbreak",  gachaWeight: 20 },
        "mem_cube_quake": { type: "skillbk", n: "記憶水晶(立方：地裂)", p: 4800,  sk: "sk_illu_cube_quake", gachaWeight: 20 },
        "mem_skullbreak": { type: "skillbk", n: "記憶水晶(骷髏毀壞)",   p: 4800,  sk: "sk_illu_skullbreak", gachaWeight: 0 },
        "mem_fantasy":    { type: "skillbk", n: "記憶水晶(幻想)",       p: 10800, sk: "sk_illu_fantasy",    gachaWeight: 10 },
        "mem_golem":      { type: "skillbk", n: "記憶水晶(幻覺：鑽石高崙)", p: 10800, sk: "sk_illu_golem",  gachaWeight: 1, d: "封存幻術「幻覺：鑽石高崙」的記憶水晶，凝視其中便能窺見扭曲現實的祕法。" },
        "mem_cube_shock": { type: "skillbk", n: "記憶水晶(立方：衝擊)", p: 10800, sk: "sk_illu_cube_shock", gachaWeight: 0 },
        "mem_endure":     { type: "skillbk", n: "記憶水晶(耐力)",       p: 10800, sk: "sk_illu_endure",     gachaWeight: 0 },
        "mem_avatar":     { type: "skillbk", n: "記憶水晶(幻覺：化身)", p: 43200, sk: "sk_illu_avatar",     gachaWeight: 1, d: "封存幻術「幻覺：化身」的記憶水晶，凝視其中便能窺見扭曲現實的祕法。" },
        "mem_panic":      { type: "skillbk", n: "記憶水晶(恐慌)",       p: 43200, sk: "sk_illu_panic",      gachaWeight: 10 },
        "mem_insight":    { type: "skillbk", n: "記憶水晶(洞察)",       p: 43200, sk: "sk_illu_insight",    gachaWeight: 10 },
        "mem_cube_harmony":{ type: "skillbk", n: "記憶水晶(立方：和諧)", p: 43200, sk: "sk_illu_cube_harmony", gachaWeight: 1 },
        "mem_pain":       { type: "skillbk", n: "記憶水晶(疼痛的歡愉)", p: 43200, sk: "sk_illu_pain",       gachaWeight: 10 },
        // ===== 🐉 龍騎士書板（龍魔法，森帕爾販售一部分・其餘怪物掉落）=====
        "bk_dragon_armor":          { type: "skillbk", n: "龍騎士書板(龍之護鎧)",     p: 2400,  sk: "sk_dragon_armor",          gachaWeight: 30, d: "以龍語刻下「龍之護鎧」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_flameslash":     { type: "skillbk", n: "龍騎士書板(燃燒擊砍)",     p: 2400,  sk: "sk_dragon_flameslash",     gachaWeight: 0,  d: "以龍語刻下「燃燒擊砍」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_guardbreak":     { type: "skillbk", n: "龍騎士書板(護衛毀滅)",     p: 2400,  sk: "sk_dragon_guardbreak",     gachaWeight: 0,  d: "以龍語刻下「護衛毀滅」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_lavaspit":       { type: "skillbk", n: "龍騎士書板(岩漿噴吐)",     p: 2400,  sk: "sk_dragon_lavaspit",       gachaWeight: 30, d: "以龍語刻下「岩漿噴吐」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_awaken_antares": { type: "skillbk", n: "龍騎士書板(覺醒：安塔瑞斯)", p: 2400,  sk: "sk_dragon_awaken_antares", gachaWeight: 10, d: "龍騎士同時只能使用一種覺醒。" },
        "bk_dragon_bloodlust":      { type: "skillbk", n: "龍騎士書板(血之渴望)",     p: 10800, sk: "sk_dragon_bloodlust",      gachaWeight: 10, d: "以龍語刻下「血之渴望」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_slaughter":      { type: "skillbk", n: "龍騎士書板(屠宰者)",       p: 10800, sk: "sk_dragon_slaughter",      gachaWeight: 0,  d: "以龍語刻下「屠宰者」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_terror":         { type: "skillbk", n: "龍騎士書板(恐懼無助)",     p: 10800, sk: "sk_dragon_terror",         gachaWeight: 0,  d: "以龍語刻下「恐懼無助」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_lavabolt":       { type: "skillbk", n: "龍騎士書板(岩漿之箭)",     p: 10800, sk: "sk_dragon_lavabolt",       gachaWeight: 10, d: "以龍語刻下「岩漿之箭」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_awaken_falion":  { type: "skillbk", n: "龍騎士書板(覺醒：法利昂)",  p: 10800, sk: "sk_dragon_awaken_falion",  gachaWeight: 1,  d: "同時只能使用一種覺醒。" },
        "bk_dragon_deadlybody":     { type: "skillbk", n: "龍騎士書板(致命身軀)",     p: 43200, sk: "sk_dragon_deadlybody",     gachaWeight: 10, d: "以龍語刻下「致命身軀」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_deathlightning": { type: "skillbk", n: "龍騎士書板(奪命之雷)",     p: 43200, sk: "sk_dragon_deathlightning", gachaWeight: 10, d: "以龍語刻下「奪命之雷」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_reaper":         { type: "skillbk", n: "龍騎士書板(驚悚死神)",     p: 43200, sk: "sk_dragon_reaper",         gachaWeight: 1,  d: "以龍語刻下「驚悚死神」奧義的書板，唯有龍騎士能喚醒其中力量。" },
        "bk_dragon_awaken_baraka":  { type: "skillbk", n: "龍騎士書板(覺醒：巴拉卡斯)", p: 43200, sk: "sk_dragon_awaken_baraka",  gachaWeight: 1,  d: "同時只能使用一種覺醒。" },
        // ===== 幻術士階段5：材料 / 任務道具（巴特爾製作 + 希蓮恩試煉用） =====
        "mat_rough_stone": { n: "原石碎片", p: 1, c: "text-slate-300", noUse: true, gachaWeight: 0, d: "未經雕琢的原石碎片，製作奇古獸的素材。" },
        "mat_crack_core":  { n: "龜裂之核", p: 1, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "時空裂痕的紊亂之力被凝鍊成的核心，握於掌中仍隱隱震動，製作奇古獸的素材。由巴特爾以時空裂痕碎片打造。" },
        "mat_rift_shard":  { n: "時空裂痕碎片", p: 1, c: "text-cyan-300", noUse: true, gachaWeight: 0, d: "自時空裂痕崩落而出的碎片，棱角間流轉著扭曲的微光。由特定怪物掉落；可製作龜裂之核，並用於職業試煉。" },
        // ===== 🏛️ 底比斯：寶箱碎片（製作材料）／上鎖寶箱（可使用·消耗龜裂之核開啟）／祭壇鑰匙 =====
        "mat_osiris_basic_up":   { n: "歐西里斯初級寶箱碎片(上)", p: 1, c: "text-amber-200", noUse: true, gachaWeight: 0, d: "歐西里斯初級寶箱的上半碎片。與下半碎片各 1 個可由巴特爾合成『上鎖的歐西里斯初級寶箱』。" },
        "mat_osiris_basic_down": { n: "歐西里斯初級寶箱碎片(下)", p: 1, c: "text-amber-200", noUse: true, gachaWeight: 0, d: "歐西里斯初級寶箱的下半碎片。與上半碎片各 1 個可由巴特爾合成『上鎖的歐西里斯初級寶箱』。" },
        "mat_osiris_high_up":    { n: "歐西里斯高級寶箱碎片(上)", p: 1, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "歐西里斯高級寶箱的上半碎片。與下半碎片各 1 個可由巴特爾合成『上鎖的歐西里斯高級寶箱』。" },
        "mat_osiris_high_down":  { n: "歐西里斯高級寶箱碎片(下)", p: 1, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "歐西里斯高級寶箱的下半碎片。與上半碎片各 1 個可由巴特爾合成『上鎖的歐西里斯高級寶箱』。" },
        "item_osiris_box_basic": { n: "上鎖的歐西里斯初級寶箱", type: "misc", p: 0, c: "text-amber-300", gachaWeight: 0, eff: "osiris_box", boxTier: "basic", d: "以歐西里斯封印的初級寶箱，箱面銘刻著古老的咒文。使用時可選擇開啟數量，每開啟 1 個消耗 1 顆 龜裂之核，隨機獲得底比斯寶物。" },
        "item_osiris_box_high":  { n: "上鎖的歐西里斯高級寶箱", type: "misc", p: 0, c: "text-amber-300", gachaWeight: 0, eff: "osiris_box", boxTier: "high",  d: "沉睡於底比斯深處的歐西里斯高級寶箱，金封下藏著更豐厚的賜予。使用時可選擇開啟數量，每開啟 1 個消耗 1 顆 龜裂之核，隨機獲得更豐厚的底比斯寶物。" },
        "item_thebes_altar_key": { n: "底比斯歐西里斯祭壇鑰匙", p: 1, c: "text-amber-300", gachaWeight: 0, d: "鑄有冥神紋章的古鑰，唯有持之者能踏入沉眠死神的聖殿。通往底比斯歐西里斯祭壇的鑰匙，持有後方可入場（進入與軍王再臨各消耗 1 把）。" },
        // ===== 🐍 蛇神降臨·提卡爾：寶箱碎片(材料)／上鎖庫庫爾坎寶箱(消耗龜裂之核開啟)／祭壇鑰匙／頭目素材 =====
        "mat_kukulkan_basic_up":   { n: "庫庫爾坎初級寶箱碎片(上)", p: 1, c: "text-amber-200", noUse: true, gachaWeight: 0, d: "庫庫爾坎初級寶箱的上半碎片，由巴特爾與下半碎片接合即可還原寶箱。製作材料。" },
        "mat_kukulkan_basic_down": { n: "庫庫爾坎初級寶箱碎片(下)", p: 1, c: "text-amber-200", noUse: true, gachaWeight: 0, d: "庫庫爾坎初級寶箱的下半碎片，由巴特爾與上半碎片接合即可還原寶箱。製作材料。" },
        "mat_kukulkan_high_up":    { n: "庫庫爾坎高級寶箱碎片(上)", p: 1, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "庫庫爾坎高級寶箱的上半碎片，由巴特爾與下半碎片接合即可還原寶箱。製作材料。" },
        "mat_kukulkan_high_down":  { n: "庫庫爾坎高級寶箱碎片(下)", p: 1, c: "text-amber-300", noUse: true, gachaWeight: 0, d: "庫庫爾坎高級寶箱的下半碎片，由巴特爾與上半碎片接合即可還原寶箱。製作材料。" },
        "item_kukulkan_box_basic": { n: "上鎖的庫庫爾坎初級寶箱", type: "misc", p: 0, c: "text-amber-300", gachaWeight: 0, eff: "osiris_box", boxTier: "basic", d: "羽蛇神庫庫爾坎封印的初級寶箱。使用時可選擇開啟數量，每開啟 1 個消耗 1 顆 龜裂之核，隨機獲得提卡爾寶物。" },
        "item_kukulkan_box_high":  { n: "上鎖的庫庫爾坎高級寶箱", type: "misc", p: 0, c: "text-amber-300", gachaWeight: 0, eff: "osiris_box", boxTier: "high", d: "沉睡於庫庫爾坎祭壇深處的高級寶箱，金封下藏著更豐厚的賜予。使用時可選擇開啟數量，每開啟 1 個消耗 1 顆 龜裂之核，隨機獲得更豐厚的提卡爾寶物。" },
        "item_tikal_altar_key":    { n: "提卡爾庫庫爾坎祭壇鑰匙", p: 1, c: "text-amber-300", gachaWeight: 0, d: "鐫刻羽蛇神紋章的古鑰，唯有持之者能踏入庫庫爾坎祭壇。通往提卡爾庫庫爾坎祭壇的鑰匙，持有後方可入場（進入與再臨各消耗 1 把）。" },
        "mat_tikal_fang":          { n: "提卡爾杰弗雷庫尖牙", legend: true, type: "acc", slot: "amulet", ac: 0, str: 1, dex: 1, mhp: 30, req: "all", safe: 0, p: 300000, gachaWeight: 1, d: "羽蛇神杰弗雷庫的倒勾尖牙，蘊藏蛇神狂暴之力。" },
        "mat_tikal_eye":           { n: "提卡爾杰弗雷庫之眼", legend: true, type: "acc", slot: "amulet", ac: 0, int: 1, con: 1, mmp: 30, req: "all", safe: 0, p: 300000, gachaWeight: 1, d: "羽蛇神杰弗雷庫凝視萬物的眼球，透出冷冽微光。" },
        "item_ant_fruit":  { n: "污濁安特的水果", p: 0, c: "text-emerald-300", noUse: true, noSell: true, gachaWeight: 0, d: "自腐化安特身上墜落的果實，外皮蒙著一層揮之不去的污濁。希蓮恩的試煉道具。（無法販售）" },
        "item_ant_branch": { n: "污濁安特的樹枝", p: 0, c: "text-emerald-300", noUse: true, noSell: true, gachaWeight: 0, d: "從受污染的安特折下的枯枝，仍滲著黯沉的樹液。希蓮恩的試煉道具。（無法販售）" },
        "item_ant_bark":   { n: "污濁安特的樹皮", p: 0, c: "text-emerald-300", noUse: true, noSell: true, gachaWeight: 0, d: "剝自腐化安特軀幹的樹皮，紋路間爬滿了黑斑。希蓮恩的試煉道具。（無法販售）" },
        "item_elmore_heart": { n: "艾爾摩將軍之心", p: 0, c: "text-rose-300", noUse: true, noSell: true, gachaWeight: 0, d: "自將軍艾爾摩胸中取出、仍微微跳動的心臟，餘威猶在。希蓮恩的試煉道具。（無法販售）" },
        "item_time_orb":   { n: "完成的時間水晶球", p: 0, c: "text-sky-300", noUse: true, noSell: true, gachaWeight: 0, d: "匯聚流逝歲月而成的水晶球，凝視其中彷彿能窺見時光倒流。希蓮恩的試煉道具。（無法販售）" },
        "item_wyvern_blood": { n: "翼龍之血", p: 0, c: "text-red-300", noUse: true, noSell: true, gachaWeight: 0, d: "自翼龍體內汲取的滾燙血液，蘊藏著飛龍一族的兇暴生命力。希蓮恩 50 級試煉道具。（無法販售）" },
        // ===== 🏴‍☠️ 海賊島 武器 =====
        "wpn_pirate_dagger": { n: "血紅慾望短劍", type: "wpn", dmgS: 10, dmgL: 8, hit: 0, spd: 0.6, req: "elf,dark", safe: 6, p: 12000, gachaWeight: 60, unBonus: true, hpR: -3, d: "沁著血色慾望的短刃，渴飲不死與狼人之血。" },
        "wpn_glory_sword": { n: "榮耀之劍", type: "wpn", dmgS: 9, dmgL: 12, hit: 0, dmgBonus: 2, spd: 0.8, req: "knight,dragon", safe: 6, p: 6000, gachaWeight: 80, d: "象徵騎士榮耀的單手劍，反擊來犯之敵。" },
        "wpn_pirate_shortblade": { n: "短刀", type: "wpn", dmgS: 10, dmgL: 12, hit: 1, spd: 0.9, req: "royal,knight,elf,dark,dragon", safe: 6, p: 5000, gachaWeight: 100, d: "輕巧易於揮舞的短刀，適合多數職業使用。" },
        "wpn_pirate_cutlass": { n: "海賊彎刀", type: "wpn", dmgS: 11, dmgL: 6, hit: 1, spd: 0.9, req: "knight,elf,dark,dragon", safe: 6, p: 8000, gachaWeight: 90, unBonus: true, d: "海賊愛用的彎刀，刃口浸染過無數亡者之血。" },
        "wpn_abyss_dualblade": { n: "深淵雙刀", type: "wpn", w2h: true, dmgS: 14, dmgL: 10, hit: 0, spd: 0.8, req: "dark", safe: 6, p: 10000, gachaWeight: 50, eff: "combo", comboRate: 25, ignHardSkin: true, d: "自深淵汲取力量的雙刀，撕裂一切堅硬的防護。" },
        "wpn_dark_crystalball": { n: "漆黑水晶球", type: "wpn", dmgS: 1, dmgL: 1, hit: 0, spd: 1.0, req: "mage,illusion", safe: 6, p: 20000, gachaWeight: 1, mdmg: 1, cha: 2, ignHardSkin: true, d: "凝聚漆黑魔力的水晶球，魔力共鳴而出。" },
        "wpn_silent_crossbow": { n: "寂靜十字弓", type: "wpn", ranged: true, isBow: true, oneHand: true, dmgS: 3, dmgL: 2, hit: 1, dmgBonus: 1, spd: 1.0, req: "elf,illusion", safe: 6, p: 15000, gachaWeight: 30, rapidfire: 50, d: "無聲扣動的十字弓，連發如疾雨。" },
        // ===== 🏴‍☠️ 海賊島 防具 =====
        "arm_faith_shield": { n: "信念之盾", type: "arm", slot: "shield", ac: 3, dr: 2, cha: 2, block: 60, req: "royal", safe: 6, p: 15000, gachaWeight: 1, d: "承載著堅定信念的盾牌，守護持有者的意志。" },
        "arm_bluepirate_boots": { n: "藍海賊長靴", type: "arm", slot: "boots", ac: 2, req: "all", safe: 4, p: 6000, gachaWeight: 40, set: "bluepirate", d: "藍海賊團的航海長靴。" },
        "arm_bluepirate_helm": { n: "藍海賊頭巾", type: "arm", slot: "helm", ac: 2, req: "all", safe: 4, p: 6000, gachaWeight: 40, set: "bluepirate", d: "藍海賊團的標誌頭巾。" },
        "arm_bluepirate_armor": { n: "藍海賊皮盔甲", type: "arm", slot: "armor", ac: 5, req: "all", safe: 4, p: 8000, gachaWeight: 40, set: "bluepirate", d: "藍海賊團的皮製盔甲。" },
        "arm_bluepirate_gloves": { n: "藍海賊手套", type: "arm", slot: "gloves", ac: 1, req: "all", safe: 4, p: 7000, gachaWeight: 40, set: "bluepirate", d: "藍海賊團的皮手套。" },
        "arm_bluepirate_cloak": { n: "藍海賊斗篷", type: "arm", slot: "cloak", ac: 2, cha: 1, req: "all", safe: 4, p: 9000, gachaWeight: 20, d: "藍海賊團的航海斗篷，隨海風飄揚。" },
        // ===== 🏴‍☠️ 海賊島 詛咒耳環（裝備欄＝項鍊）＋ 淨化之耳環（裝備欄＝耳環）=====
        "acc_curse_red": { n: "詛咒的紅色耳環", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 10000, gachaWeight: 50, d: "纏附紅色詛咒的耳環，雖名為耳環，實際裝於項鍊欄。" },
        "acc_curse_blue": { n: "詛咒的藍色耳環", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 10000, gachaWeight: 50, d: "纏附藍色詛咒的耳環，雖名為耳環，實際裝於項鍊欄。" },
        "acc_curse_green": { n: "詛咒的綠色耳環", type: "acc", slot: "amulet", ac: 0, req: "all", safe: 0, p: 10000, gachaWeight: 50, d: "纏附綠色詛咒的耳環，雖名為耳環，實際裝於項鍊欄。" },
        "acc_purify_earring": { n: "淨化之耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 10000, gachaWeight: 30, d: "蘊含淨化之力的耳環，可與任一色詛咒耳環共鳴。" },
        // ===== ❄️ 冰之女王的耳環 Lv0~Lv8（裝備欄＝耳環）=====
        "acc_icequeen_ear_0": { n: "冰之女王的耳環 Lv0", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 1, d: "冰之女王所佩戴耳環的雛形，蘊藏成長的可能。可在歐瑞村 大衛 處以 冰之結晶 逐級精煉。（裝於耳環欄）" },
        "acc_icequeen_ear_1": { n: "冰之女王的耳環 Lv1", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, mhp: 10, d: "經一次精煉的冰之女王耳環。" },
        "acc_icequeen_ear_2": { n: "冰之女王的耳環 Lv2", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, mhp: 10, mmp: 5, d: "經二次精煉的冰之女王耳環。" },
        "acc_icequeen_ear_3": { n: "冰之女王的耳環 Lv3", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, mhp: 15, mmp: 5, d: "經三次精煉的冰之女王耳環。" },
        "acc_icequeen_ear_4": { n: "冰之女王的耳環 Lv4", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, mhp: 15, mmp: 5, hpR: 1, d: "經四次精煉的冰之女王耳環。" },
        "acc_icequeen_ear_5": { n: "冰之女王的耳環 Lv5", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, mhp: 15, mmp: 10, hpR: 1, d: "經五次精煉的冰之女王耳環。" },
        "acc_icequeen_ear_6": { n: "冰之女王的耳環 Lv6", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, mhp: 15, mmp: 10, hpR: 1, mpR: 1, d: "經六次精煉的冰之女王耳環。" },
        "acc_icequeen_ear_7": { n: "冰之女王的耳環 Lv7", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, noEnhance: true, mhp: 20, mmp: 10, hpR: 2, mpR: 1, d: "經七次精煉的冰之女王耳環。" },
        "acc_icequeen_ear_8_str": { n: "冰之女王的耳環 Lv8 力量", type: "acc", slot: "ear", legend: true, ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, mhp: 20, mmp: 10, hpR: 2, mpR: 1, str: 1, d: "冰之女王耳環的至高型態（力量）。" },
        "acc_icequeen_ear_8_dex": { n: "冰之女王的耳環 Lv8 敏捷", type: "acc", slot: "ear", legend: true, ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, mhp: 20, mmp: 10, hpR: 2, mpR: 1, dex: 1, d: "冰之女王耳環的至高型態（敏捷）。" },
        "acc_icequeen_ear_8_int": { n: "冰之女王的耳環 Lv8 智力", type: "acc", slot: "ear", legend: true, ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, mhp: 20, mmp: 10, hpR: 2, mpR: 1, int: 1, d: "冰之女王耳環的至高型態（智力）。" },
        "acc_icequeen_ear_8_con": { n: "冰之女王的耳環 Lv8 體質", type: "acc", slot: "ear", legend: true, ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, mhp: 20, mmp: 10, hpR: 2, mpR: 1, con: 1, d: "冰之女王耳環的至高型態（體質）。" },
        "acc_icequeen_ear_8_wis": { n: "冰之女王的耳環 Lv8 精神", type: "acc", slot: "ear", legend: true, ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, mhp: 20, mmp: 10, hpR: 2, mpR: 1, wis: 1, d: "冰之女王耳環的至高型態（精神）。" },
        "acc_icequeen_ear_8_cha": { n: "冰之女王的耳環 Lv8 魅力", type: "acc", slot: "ear", legend: true, ac: 0, req: "all", safe: 0, p: 100000, gachaWeight: 0, mhp: 20, mmp: 10, hpR: 2, mpR: 1, cha: 1, d: "冰之女王耳環的至高型態（魅力）。" },
        // ===== 🏴‍☠️ 海賊島 受詛咒戒指 =====
        "acc_curse_diamond_ring": { n: "受詛咒的鑽石戒指", type: "acc", slot: "ring", ac: 0, mr: 10, con: -1, wis: -1, req: "all", safe: 0, p: 10000, gachaWeight: 70, d: "受詛咒的鑽石戒指，魔力護身卻折損心神。" },
        "acc_curse_ruby_ring": { n: "受詛咒的紅寶石戒指", type: "acc", slot: "ring", ac: -2, hpR: 1, mpR: 1, req: "all", safe: 0, p: 10000, gachaWeight: 80, d: "受詛咒的紅寶石戒指，加速恢復卻削弱防護。" },
        "acc_curse_sapphire_ring": { n: "受詛咒的藍寶石戒指", type: "acc", slot: "ring", ac: 0, immStone: true, resFire: -10, resWater: -10, resEarth: -10, resWind: -10, req: "all", safe: 0, p: 10000, gachaWeight: 50, d: "受詛咒的藍寶石戒指，免於石化卻喪失屬性抗性。" },
        "acc_curse_emerald_ring": { n: "受詛咒的綠寶石戒指", type: "acc", slot: "ring", ac: 0, mhp: 25, mr: -10, req: "all", safe: 0, p: 10000, gachaWeight: 90, d: "受詛咒的綠寶石戒指，增益體魄卻削弱魔防。" },
        // ===== 💍 賽巴斯（奇岩）寶石加工坊製作：4 屬性戒指 + 4 精靈皮帶 =====
        "acc_ring_magic": { n: "魔力戒指", type: "acc", slot: "ring", ac: 0, mpR: 1, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "蘊含魔力的戒指。" },
        "acc_ring_str":   { n: "力量戒指", type: "acc", slot: "ring", ac: 0, str: 1, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "灌注力量的戒指。" },
        "acc_ring_dex":   { n: "敏捷戒指", type: "acc", slot: "ring", ac: 0, dex: 1, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "輕盈靈動的戒指。" },
        "acc_ring_int":   { n: "知識戒指", type: "acc", slot: "ring", ac: 0, int: 1, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "蘊藏知識的戒指。" },
        "acc_belt_fire":  { n: "火精靈的皮帶", type: "acc", slot: "belt", ac: 0, resFire: 10,  weightCap: 165, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "火精靈祝福的皮帶。" },
        "acc_belt_water": { n: "水精靈的皮帶", type: "acc", slot: "belt", ac: 0, resWater: 10, weightCap: 165, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "水精靈祝福的皮帶。" },
        "acc_belt_earth": { n: "地精靈的皮帶", type: "acc", slot: "belt", ac: 0, resEarth: 10, weightCap: 165, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "地精靈祝福的皮帶。" },
        "acc_belt_wind":  { n: "風精靈的皮帶", type: "acc", slot: "belt", ac: 0, resWind: 10,  weightCap: 165, req: "all", safe: 0, p: 10000, gachaWeight: 0, d: "風精靈祝福的皮帶。" },
        // ===== 🏴‍☠️ 海賊島 材料 / 任務道具 =====
        "mat_ice_crystal": { n: "冰之結晶", type: "etc", p: 1, c: "text-cyan-200", noUse: true, gachaWeight: 0, d: "冰之女王凝聚而成的寒冰結晶。可在歐瑞村 大衛 處精煉 冰之女王的耳環。（製作材料）" },
        "item_son_letter": { n: "兒子的信", type: "etc", p: 10, c: "text-amber-200", noUse: true, gachaWeight: 0, d: "一封未能送達的家書，字跡因海水暈染。可交給海賊島村莊的 希米哲。（任務兌換道具）" },
        "item_son_remains": { n: "兒子的遺骸", type: "etc", p: 10, c: "text-amber-200", noUse: true, gachaWeight: 0, d: "葬身海賊島的某人遺骸。可交給海賊島村莊的 希米哲。（任務兌換道具）" },
        "item_son_portrait": { n: "兒子的肖像畫", type: "etc", p: 10, c: "text-amber-200", noUse: true, gachaWeight: 0, d: "一幅褪色的肖像畫，描繪著年輕的面容。可交給海賊島村莊的 希米哲。（任務兌換道具）" },
        // ===== 💎 大衛 寶石加工 耳環（藍系智慧/真實/支配·綠系憤怒/勇猛/不死·紅系熱情/名譽/寬容；中間階無法強化、最終階可強化）=====
        "acc_ear_wisdom":    { n: "智慧耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mmp: 10, d: "凝聚智慧的耳環。" },
        "acc_ear_truth":     { n: "真實耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mmp: 20, mpR: 1, d: "映照真實的耳環。" },
        "acc_ear_dominate":  { n: "支配耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, mmp: 30, mpR: 2, d: "蘊含支配之力的耳環。" },
        "acc_ear_rage":      { n: "憤怒耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 10, mmp: 5, d: "燃燒憤怒的耳環。" },
        "acc_ear_brave":     { n: "勇猛耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 20, mmp: 5, d: "象徵勇猛的耳環。" },
        "acc_ear_undead":    { n: "不死耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, mhp: 20, mmp: 10, d: "蘊含不死之力的耳環。" },
        "acc_ear_passion":   { n: "熱情耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 20, d: "燃起熱情的耳環。" },
        "acc_ear_honor":     { n: "名譽耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 30, d: "承載名譽的耳環。" },
        "acc_ear_tolerance": { n: "寬容耳環", type: "acc", slot: "ear", ac: 0, req: "all", safe: 0, p: 0, gachaWeight: 0, mhp: 40, hpR: 3, d: "充滿寬容的耳環。" },
        // ===== 🔥 炎魔的輔佐官 靈魂石碎片 耳環（舞動→…→奴隸；前7階無法強化、奴隸可強化）=====
        "acc_ear_dance":    { n: "舞動耳環", type: "acc", slot: "ear", ac: 1, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, d: "隨炎舞動的耳環。" },
        "acc_ear_twin":     { n: "雙子耳環", type: "acc", slot: "ear", ac: 2, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, d: "成對相映的雙子耳環。" },
        "acc_ear_festival": { n: "慶典耳環", type: "acc", slot: "ear", ac: 3, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, d: "炎獄慶典的耳環。" },
        "acc_ear_peak":     { n: "絕頂耳環", type: "acc", slot: "ear", ac: 3, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 25, mmp: 10, d: "登峰絕頂的耳環。" },
        "acc_ear_rampage":  { n: "暴走耳環", type: "acc", slot: "ear", ac: 3, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 50, mmp: 20, d: "失控暴走的耳環。" },
        "acc_ear_phantom":  { n: "幻魔耳環", type: "acc", slot: "ear", ac: 3, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 50, mmp: 20, weightCap: 40, d: "幻魔之力的耳環。" },
        "acc_ear_clan":     { n: "族群耳環", type: "acc", slot: "ear", ac: 3, req: "all", safe: 0, p: 0, gachaWeight: 0, noEnhance: true, mhp: 50, mmp: 20, weightCap: 100, d: "凝聚族群的耳環。" },
        "acc_ear_slave":    { n: "奴隸耳環", type: "acc", slot: "ear", legend: true, ac: 3, req: "all", safe: 0, p: 0, gachaWeight: 0, mhp: 50, mmp: 20, weightCap: 200, d: "禁忌的奴隸耳環。" },
    },
    // ⚠️ 純標記表：僅供 initSetTags（本檔尾）反向標記 DB.items[].set；套裝效果唯一真相在 js/02 recomputeStats（搜 _setEarly）、UI 門檻在 js/10（勿在此加數值欄位·無人讀取）
    sets: {
        "set_0": { n: "皮套裝", items: ["arm_48", "arm_91", "arm_111", "arm_75"] },
        "set_1": { n: "歐西斯套裝", items: ["hlm_oasis", "amr_oasis", "clk_oasis", "arm_104"] },
        "set_2": { n: "侏儒套裝", items: ["hlm_gnome", "arm_86", "shd_gnome"] },
        "set_3": { n: "銀釘套裝", items: ["hlm_silver", "arm_92", "arm_112", "arm_77"] },
        "set_4": { n: "骷髏套裝", items: ["hlm_bone", "shd_bone", "amr_bone"] },
        "set_5": { n: "鋼鐵套裝", items: ["arm_100", "hlm_steel", "arm_113", "arm_94", "arm_79"] },
        "set_6": { n: "法師套裝", items: ["hlm_mage", "amr_magerobe"] },
        "set_7": { n: "死亡騎士套裝", items: ["glv_dk", "amr_dk", "bot_dk", "hlm_dk"] },
        "set_8": { n: "克特套裝", items: ["arm_101", "amr_kurt", "arm_97", "hlm_kurt"] },
        "set_9": { n: "抗魔套裝", items: ["rng_mr", "acc_126", "blt_mr"] },
        "set_10": { n: "守護套裝", items: ["acc_118", "acc_124", "acc_138"] },
        "set_11": { n: "四大軍王套裝", items: ["clk_kingnecro", "amr_kinglaw", "glv_kingassassin", "bot_kingbeast"] },
        "set_12": { n: "惡魔套裝", items: ["hlm_demon", "amr_demon", "glv_demon", "bot_demon"] },
        "set_13": { n: "黑暗妖精套裝", items: ["hlm_darkelf", "amr_darkelf", "bot_darkelf"] }
    },
            
    mobs: {
        "orc": { n: "妖魔", lv: 2, s: "S", beh: "被動", race: "妖魔", e: "fire", hp: 6, ac: 10, mr: 0, exp: 5, goldMin: 10, goldMax: 30, atkSpd: 2, dmg: [2, 2], db: 2, hit: 0 },
        "goblin": { n: "哥布林", lv: 2, s: "S", beh: "被動", race: "哥布林", e: "earth", hp: 3, ac: 10, mr: 2, exp: 5, goldMin: 10, goldMax: 30, atkSpd: 2, dmg: [2, 2], db: 2, hit: 0 },
        "esti_enemy": { n: "依詩蒂", img: "assets/icons/monsters/依詩蒂.png", lv: 1, s: "S", beh: "主動", race: "血盟", wild: true, e: "none", pledgeEnemy: true, excludeAvatar: "女騎士", seeInsight: true, hp: 20, ac: -10, mr: 0, exp: 100, goldMin: 1136, goldMax: 1136, atkSpd: 0.67, dmg: [1, 10], db: 0, hit: 2, regenHp: 15, scale: { hpC: 20, acBase: -10, acDiv: 3, mrBase: 0, mrDiv: 5, dmgSides: 10, hitBase: 2, atkSpd: 0.67 }, mag: { skn: "衝擊之暈", cd: 50, chance: 0.2, type: "extra_attack", stunChance: 10 } },
        "aton_enemy": { n: "阿頓", img: "assets/icons/monsters/阿頓.png", lv: 1, s: "S", beh: "主動", race: "血盟", wild: true, e: "none", pledgeEnemy: true, excludeAvatar: "男騎士", seeInsight: true, hp: 18, ac: -10, mr: 0, exp: 100, goldMin: 1136, goldMax: 1136, atkSpd: 0.6, dmg: [1, 14], db: 0, hit: 0, regenHp: 15, scale: { hpC: 18, acBase: -10, acDiv: 3, mrBase: 0, mrDiv: 5, dmgSides: 14, hitBase: 0, atkSpd: 0.6 }, mag: { skn: "衝擊之暈", cd: 50, chance: 0.2, type: "extra_attack", stunChance: 10 } },
        "julian_enemy": { n: "朱利安", img: "assets/icons/monsters/朱利安.png", lv: 1, s: "S", beh: "主動", race: "血盟", wild: true, e: "none", pledgeEnemy: true, excludeAvatar: "男妖精", hp: 12, ac: -15, mr: 25, exp: 100, goldMin: 1136, goldMax: 1136, atkSpd: 0.67, dmg: [1, 9], db: 0, hit: 5, regenHp: 15, scale: { hpC: 12, acBase: -15, acDiv: 4, mrBase: 25, mrDiv: 2, dmgSides: 9, hitBase: 5, atkSpd: 0.67 }, mag: { skn: "三重矢", cd: 50, chance: 0.2, type: "multi_attack", times: 3 } },
        "ovi_enemy": { n: "歐薇", img: "assets/icons/monsters/歐薇.png", lv: 1, s: "S", beh: "主動", race: "血盟", wild: true, e: "none", pledgeEnemy: true, excludeAvatar: "女妖精", hp: 10, ac: -18, mr: 25, exp: 100, goldMin: 1136, goldMax: 1136, atkSpd: 0.67, dmg: [1, 8], db: 0, hit: 5, regenHp: 15, scale: { hpC: 10, acBase: -10, acDiv: 5, mrBase: 25, mrDiv: 2, dmgSides: 8, hitBase: 5, atkSpd: 0.67 }, mag: { skn: "生命的祝福", cd: 50, chance: 0.2, type: "pledge_bless", healDice: [1, 20], dur: 18, interval: 3 } },
        "joe_enemy": { n: "喬", img: "assets/icons/monsters/喬.png", lv: 1, s: "S", beh: "主動", race: "血盟", wild: true, e: "none", pledgeEnemy: true, excludeAvatar: "男法師", hp: 10, ac: -10, mr: 15, exp: 100, goldMin: 1136, goldMax: 1136, atkSpd: 0.67, dmg: [1, 4], db: 0, hit: 5, regenHp: 15, scale: { hpC: 10, acBase: -10, acDiv: 6, mrBase: 15, mrDiv: 3, dmgSides: 4, hitBase: 5, atkSpd: 0.67, dbHalf: true }, mag: { skn: "光箭", cd: 20, dmg: [2, 6], dbLv: 1, ele: "none", alwaysHit: true }, mag2: { skn: "地裂術", cd: 50, chance: 0.2, dmg: [8, 8], dbLv: 1, dbLvMult: 2, ele: "earth", alwaysHit: true } },
        "senis_enemy": { n: "賽尼斯", img: "assets/icons/monsters/賽尼斯.png", lv: 1, s: "S", beh: "主動", race: "血盟", wild: true, e: "none", pledgeEnemy: true, excludeAvatar: "女法師", hp: 8, ac: -11, mr: 18, exp: 100, goldMin: 1136, goldMax: 1136, atkSpd: 0.67, dmg: [1, 4], db: 0, hit: 0, regenHp: 15, scale: { hpC: 8, acBase: -11, acDiv: 6, mrBase: 18, mrDiv: 3, dmgSides: 4, hitBase: 0, atkSpd: 0.67, dbHalf: true }, mag: { skn: "冰箭", cd: 20, dmg: [2, 6], dbLv: 1, ele: "water", alwaysHit: true }, mag2: { skn: "冰矛圍籬", cd: 50, chance: 0.2, dmg: [5, 12], dbLv: 1, dbLvMult: 2, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 150 } } },
        // ===== 攻城戰（攻城）怪物：等級隨玩家(由 applySiegeEnemyScaling 縮放)，由攻城系統生成 =====
        // 攻城塔/城門：固定HP、不會攻擊；跨圖 HP 持久化＝js/03 依顯示名比對 siegeCityCfg() 還原（spawnMob）、js/11 離圖時存（saveSiegeBossHp），無旗標欄位
        "siege_tower": { hard: true, n: "肯特守護塔", img: "assets/icons/monsters/肯特守護塔.png", lv: 1, s: "L", beh: "被動", race: "建築", siegeEnemy: true, noAttack: true, e: "none", boss: true, hp: 15000, ac: 10, mr: 0, dr: 10, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [0, 0], db: 0, hit: 0, siege: { fixed: true, hpPerLv: 500, ac: 10, mr: 0, dr: 10 } },   // 🔧 HP=500×玩家等級；新增被動：傷害減免10
        "siege_gate": { hard: true, n: "肯特城門", img: "assets/icons/monsters/肯特城門.png", lv: 1, s: "L", beh: "被動", race: "建築", siegeEnemy: true, noAttack: true, e: "none", boss: true, hp: 10000, ac: 10, mr: 0, dr: 20, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [0, 0], db: 0, hit: 0, siege: { fixed: true, hpPerLv: 300, ac: 10, mr: 0, dr: 20 } },   // 🔧 HP=300×玩家等級
        "siege_tower_heine": { hard: true, n: "海音守護塔", img: "assets/icons/monsters/海音守護塔.png", lv: 1, s: "L", beh: "被動", race: "建築", siegeEnemy: true, noAttack: true, e: "none", boss: true, hp: 15000, ac: 10, mr: 0, dr: 10, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [0, 0], db: 0, hit: 0, siege: { fixed: true, hpPerLv: 500, ac: 10, mr: 0, dr: 10 } },   // 🔧 海音守護塔：能力同肯特守護塔
        "siege_gate_heine": { hard: true, n: "海音城門", img: "assets/icons/monsters/海音城門.png", lv: 1, s: "L", beh: "被動", race: "建築", siegeEnemy: true, noAttack: true, e: "none", boss: true, hp: 10000, ac: 10, mr: 0, dr: 20, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [0, 0], db: 0, hit: 0, siege: { fixed: true, hpPerLv: 300, ac: 10, mr: 0, dr: 20 } },   // 🔧 海音城門：能力同肯特城門
        "siege_tower_ww": { hard: true, n: "風木守護塔", img: "assets/icons/monsters/風木守護塔.png", lv: 1, s: "L", beh: "被動", race: "建築", siegeEnemy: true, noAttack: true, e: "none", boss: true, hp: 15000, ac: 10, mr: 0, dr: 10, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [0, 0], db: 0, hit: 0, siege: { fixed: true, hpPerLv: 500, ac: 10, mr: 0, dr: 10 } },   // 🔧 風木守護塔：HP=500×玩家等級、傷害減免10
        "siege_gate_ww": { hard: true, n: "風木城門", img: "assets/icons/monsters/風木城門.png", lv: 1, s: "L", beh: "被動", race: "建築", siegeEnemy: true, noAttack: true, e: "none", boss: true, hp: 10000, ac: 10, mr: 0, dr: 20, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [0, 0], db: 0, hit: 0, siege: { fixed: true, hpPerLv: 300, ac: 10, mr: 0, dr: 20 } },   // 🔧 風木城門：HP=300×玩家等級、傷害減免20
        "baless": { hard: true, n: "巴列斯", lv: 70, s: "S", beh: "主動", race: "惡魔", e: "earth", boss: true, hp: 6200, ac: -66, mr: 80, exp: 2802, goldMin: 385, goldMax: 1554, atkSpd: 1.5, dmg: [3, 94], db: 28, hit: 77,
            mag:  { skn: "燃燒的火球", cd: 50, chance: 0.5, dmg: [4, 100], db: 202, ele: "fire" },
            mag2: { skn: "地獄犬噴吐", cd: 70, dmg: [3, 100], db: 130, ele: "fire" } },   // 🔧 巴列斯 BOSS（風木地監）
        // 特羅斯王子 / 依詩蒂公主：技能「呼喚盟友」(場上敵人<3 立即追加一次普攻，10%暈眩) — 已實作(call_ally)
        "siege_tros": { n: "特羅斯王子", img: "assets/icons/monsters/特羅斯王子.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, e: "none", hp: 14, ac: -10, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 16], db: 0, hit: 2, siege: { hpC: 14, acBase: -10, acDiv: 4, mrBase: 0, mrDiv: 5, dmgSides: 16, hitBase: 2, atkSpd: 0.67 }, mag: { skn: "呼喚盟友", type: "call_ally", cd: 10, stunChance: 10 } },
        "siege_esti": { n: "依詩蒂公主", img: "assets/icons/monsters/依詩蒂公主.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, e: "none", hp: 15, ac: -10, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 12], db: 0, hit: 2, siege: { hpC: 15, acBase: -10, acDiv: 4, mrBase: 0, mrDiv: 5, dmgSides: 12, hitBase: 2, atkSpd: 0.67 }, mag: { skn: "呼喚盟友", type: "call_ally", cd: 10, stunChance: 10 } },
        // 鋼鐵阿頓：衝擊之暈、堅固防護(self_buff/guard)、看破被動(siegeInsight) — 已實作
        "siege_aton": { n: "鋼鐵阿頓", img: "assets/icons/monsters/鋼鐵阿頓.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, siegeInsight: true, e: "none", hp: 18, ac: -15, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.35, dmg: [1, 28], db: 0, hit: 0, siege: { hpC: 18, acBase: -15, acDiv: 3, mrBase: 0, mrDiv: 5, dmgSides: 28, hitBase: 0, atkSpd: 0.35 }, mag: { skn: "衝擊之暈", cd: 50, chance: 0.2, type: "extra_attack", stunChance: 10 }, mag2: { skn: "堅固防護", type: "self_buff", buffKind: "guard", cd: 180 } },
        "siege_julian": { n: "月光朱利安", img: "assets/icons/monsters/月光朱利安.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, e: "none", hp: 12, ac: -15, mr: 25, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.56, dmg: [1, 18], db: 0, hit: 5, siege: { hpC: 12, acBase: -15, acDiv: 4, mrBase: 25, mrDiv: 2, dmgSides: 18, hitBase: 5, atkSpd: 0.56 }, mag: { skn: "三重矢", cd: 50, chance: 0.2, type: "multi_attack", times: 3 }, mag2: { skn: "暴風神射", type: "self_buff", buffKind: "volley", cd: 150 } },
        "siege_ovi": { n: "月之精靈歐薇", img: "assets/icons/monsters/月之精靈歐薇.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, e: "none", hp: 10, ac: -10, mr: 25, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 8], db: 0, hit: 5, siege: { hpC: 10, acBase: -10, acDiv: 5, mrBase: 25, mrDiv: 2, dmgSides: 8, hitBase: 5, atkSpd: 0.67 }, mag: { skn: "三重矢", cd: 50, chance: 0.1, type: "multi_attack", times: 3 }, mag2: { skn: "生命的祝福", cd: 50, chance: 0.2, type: "pledge_bless", healDice: [1, 20], dur: 18, interval: 3 } },
        "siege_joe": { n: "魔法師喬", img: "assets/icons/monsters/魔法師喬.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, e: "none", hp: 10, ac: -10, mr: 15, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 4], db: 0, hit: 5, siege: { hpC: 10, acBase: -10, acDiv: 6, mrBase: 15, mrDiv: 3, dmgSides: 4, dbHalf: true, hitBase: 5, atkSpd: 0.67 }, mag: { skn: "光箭", cd: 20, dmg: [2, 6], dbLv: 1, ele: "none", alwaysHit: true }, mag2: { skn: "地裂術", cd: 50, chance: 0.2, dmg: [8, 8], dbLv: 1, dbLvMult: 2, ele: "earth", alwaysHit: true }, mag3: { skn: "震裂術", cd: 130, chance: 0.1, dmg: [4, 25], dbLv: 1, dbLvMult: 3, ele: "earth", alwaysHit: true } },
        "siege_senis": { n: "魔女賽尼斯", img: "assets/icons/monsters/魔女賽尼斯.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, e: "none", hp: 8, ac: -11, mr: 18, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 4], db: 0, hit: 0, siege: { hpC: 8, acBase: -11, acDiv: 6, mrBase: 18, mrDiv: 3, dmgSides: 4, dbHalf: true, hitBase: 0, atkSpd: 0.67 }, mag: { skn: "冰箭", cd: 20, dmg: [2, 6], dbLv: 1, ele: "water", alwaysHit: true }, mag2: { skn: "冰矛圍籬", cd: 50, chance: 0.2, dmg: [5, 12], dbLv: 1, dbLvMult: 2, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 150 } }, mag3: { skn: "冰雪暴", cd: 130, chance: 0.1, dmg: [8, 12], dbLv: 1, dbLvMult: 3, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 200 } } },
        // 闇影格立特：ER+12、雙重破壞被動(doubleDestroy)、破壞盔甲(armor_break) — 已實作
        "siege_grit": { n: "闇影格立特", img: "assets/icons/monsters/闇影格立特.png", lv: 1, s: "S", beh: "主動", race: "血盟", siegeEnemy: true, doubleDestroy: true, e: "none", hp: 10, ac: -13, mr: 20, er: 12, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.5, dmg: [1, 50], db: 0, hit: 5, siege: { hpC: 10, acBase: -13, acDiv: 5, mrBase: 20, mrDiv: 2, dmgSides: 50, dbHalf: true, hitBase: 5, atkSpd: 0.5, er: 12 }, mag: { skn: "破壞盔甲", type: "armor_break", cd: 50, chance: 0.1 } },
        // ===== 😤 v3.5.59 白目玩家（白目玩家系統.md）：js/24 嗆聲 20% 觸發→野外重生 5% 遭遇·名稱/外觀由叫賣NPC 決定（spawnMob 動態覆蓋 n/img）·等級=玩家±10(applyTrollScaling·無上限)·經驗/金幣 0·擊殺掉落依性向 10%~3%。
        //   🎲 v3.6.23 兩個模板的普攻骰皆＝「同等級怪物」傷害骰模型（用戶拍板·scale.curveDmg→js/03 trollCurveDmg 依等級+攻速生成時計算）。
        //   😤 v3.6.26 模板倍率 dmgMult（用戶拍板·v3.6.24 首設 1.5/2.0）：一模板 2.0／二模板 2.5／法師兩模板皆不掛(×1)——乘在曲線解出的每擊傷害上（帽後）。=====
        "troll_royal":    { n: "白目玩家(王族)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 16, ac: -10, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 12], db: 0, hit: 2, regenFix: 60, scale: { hpC: 16, acBase: -10, acDiv: 4, mrBase: 0, mrDiv: 5, curveDmg: true, dmgMult: 2, hitBase: 2, atkSpd: 0.67 }, mag: { skn: "初級治癒術", type: "self_heal", cd: 60, healDice: [30, 60] } },
        "troll_knight":   { n: "白目玩家(騎士)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 20, ac: -15, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.25, dmg: [1, 28], db: 0, hit: 0, scale: { hpC: 20, acBase: -15, acDiv: 3, mrBase: 0, mrDiv: 5, curveDmg: true, dmgMult: 2, hitBase: 0, atkSpd: 0.25 }, mag: { skn: "衝擊之暈", cd: 50, chance: 0.5, type: "extra_attack", stunChance: 10 }, mag2: { skn: "堅固防護", type: "self_buff", buffKind: "guard", cd: 60 } },
        "troll_elf":      { n: "白目玩家(妖精)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 14, ac: -15, mr: 25, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.56, dmg: [1, 18], db: 0, hit: 5, scale: { hpC: 14, acBase: -15, acDiv: 4, mrBase: 25, mrDiv: 2, curveDmg: true, dmgMult: 2, hitBase: 5, atkSpd: 0.56 }, mag: { skn: "三重矢", cd: 50, chance: 0.5, type: "multi_attack", times: 3 }, mag2: { skn: "暴風神射", type: "self_buff", buffKind: "volley", cd: 60 } },
        "troll_mage":     { n: "白目玩家(法師)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 10, ac: -11, mr: 18, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 4], db: 0, hit: 5, scale: { hpC: 10, acBase: -11, acDiv: 6, mrBase: 18, mrDiv: 3, curveDmg: true, hitBase: 5, atkSpd: 0.67 }, mag: { skn: "光箭", cd: 20, dmg: [3, 6], dbLv: 1, ele: "none", alwaysHit: true }, mag2: { skn: "冰矛圍籬", cd: 50, chance: 0.3, dmg: [8, 12], dbLv: 1, dbLvMult: 2, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 200 } }, mag3: { skn: "冰雪暴", cd: 110, chance: 0.1, dmg: [10, 12], dbLv: 1, dbLvMult: 3, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 200 } }, mag4: { skn: "震裂術", cd: 70, chance: 0.5, dmg: [5, 25], dbLv: 1, dbLvMult: 3, ele: "earth", alwaysHit: true } },
        "troll_dark":     { n: "白目玩家(黑妖)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, doubleDestroy: true, e: "none", hp: 12, ac: -13, mr: 20, er: 20, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.4, dmg: [1, 50], db: 0, hit: 5, scale: { hpC: 12, acBase: -13, acDiv: 5, mrBase: 20, mrDiv: 2, curveDmg: true, dmgMult: 2, hitBase: 5, atkSpd: 0.4, er: 20 }, mag: { skn: "破壞盔甲", type: "armor_break", cd: 50, chance: 0.5 } },
        "troll_dragon":   { n: "白目玩家(龍騎)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 18, ac: -15, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.3, dmg: [1, 24], db: 0, hit: 2, scale: { hpC: 18, acBase: -15, acDiv: 3, mrBase: 0, mrDiv: 5, curveDmg: true, dmgMult: 2, hitBase: 2, atkSpd: 0.3 }, mag: { skn: "屠宰者", cd: 50, chance: 0.5, type: "multi_attack", times: 3 }, mag2: { skn: "奪命之雷", cd: 60, dmg: [5, 25], dbLv: 1, dbLvMult: 3, ele: "wind", alwaysHit: true } },
        "troll_illusion": { n: "白目玩家(幻術)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, magicMelee: true, e: "none", hp: 11, ac: -11, mr: 18, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 4], db: 0, hit: 30, scale: { hpC: 11, acBase: -11, acDiv: 6, mrBase: 18, mrDiv: 3, curveDmg: true, dmgMult: 2, hitBase: 30, atkSpd: 0.67 }, mag: { skn: "粉碎能量", cd: 20, dmg: [3, 6], dbLv: 1, ele: "none", alwaysHit: true }, mag2: { skn: "燃燒立方", cd: 40, dmg: [2, 12], dbLv: 1, dbLvMult: 2, ele: "fire", alwaysHit: true } },
        "troll_warrior":  { n: "白目玩家(戰士)",   lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 22, ac: -15, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.2, dmg: [1, 20], db: 10, hit: 0, scale: { hpC: 22, acBase: -15, acDiv: 3, mrBase: 0, mrDiv: 5, curveDmg: true, dmgMult: 2, hitBase: 0, atkSpd: 0.2, dbPlus: 10 }, onHitPoison: { skn: "出血", pbase: 150, d: 30, tick: 5, dur: 10 }, mag: { skn: "咆哮", cd: 50, chance: 0.5, dmg: [5, 12], dbLv: 1, ele: "none", alwaysHit: true } },
        // ===== 😤 v3.6.20 玩家 NPC 第二能力模板（troll2_*）：生成時 70% 抽上方原模板、30% 抽本組（js/03 trollPickClassMob）。
        //   全組更強：HP 係數+2、AC/MR 大幅提升、攻速加快；🎲 v3.6.22 一般攻擊骰＝「同等級怪物」傷害骰模型（用戶拍板·scale.curveDmg→js/03 trollCurveDmg 依等級+攻速生成時計算·單一真相 tools/mob-designer.js）。
        //   等級規則與原模板相同（玩家±10·尋仇+3/次·無 100 上限·applyTrollScaling）；經驗/金幣 0、名稱外觀由叫賣 NPC 覆蓋、掉落走同一 trollPlayer 管線。
        //   新機制：counter_barrier(反擊屏障)/foulwater(汙濁之水)/troll_bless(生命的祝福) 見 js/04；guard 傷減與 armor_break %數、doubleDestroy 機率均參數化。=====
        "troll2_royal":    { n: "白目玩家(王族)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 18, ac: -20, mr: 50, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.4, dmg: [1, 12], db: 10, hit: 5, regenFix: 60, scale: { hpC: 18, acBase: -20, acDiv: 4, mrBase: 50, mrDiv: 5, curveDmg: true, dmgMult: 2.5, hitBase: 5, dbPlus: 10, atkSpd: 0.4 }, mag: { skn: "中級治癒術", type: "self_heal", cd: 60, healDice: [60, 90] } },   // 常駐：額外傷害+10(dbPlus 疊在曲線db上)·額外命中+5(hitBase)·每2秒回60
        "troll2_knight":   { n: "白目玩家(騎士)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 22, ac: -25, mr: 50, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.2, dmg: [1, 28], db: 0, hit: 0, scale: { hpC: 22, acBase: -25, acDiv: 3, mrBase: 50, mrDiv: 5, curveDmg: true, dmgMult: 2.5, hitBase: 0, atkSpd: 0.2 }, mag: { skn: "衝擊之暈", cd: 50, chance: 0.7, type: "extra_attack", stunChance: 10 }, mag2: { skn: "堅固防護", type: "self_buff", buffKind: "guard", cd: 60, drBase: 10, dr50: 12, drStep: 2 }, mag3: { skn: "反擊屏障", type: "counter_barrier", cd: 150 } },   // 回血走預設40/60；堅固防護：傷減10·50級12·每10級+2·15秒
        "troll2_elf":      { n: "白目玩家(妖精)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 16, ac: -25, mr: 100, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.4, dmg: [1, 18], db: 0, hit: 5, scale: { hpC: 16, acBase: -25, acDiv: 4, mrBase: 100, mrDiv: 2, curveDmg: true, dmgMult: 2.5, hitBase: 5, atkSpd: 0.4 }, mag: { skn: "三重矢", cd: 50, type: "multi_attack", times: 3 }, mag2: { skn: "汙濁之水", cd: 80, type: "foulwater", dur: 8 }, mag3: { skn: "生命的祝福", cd: 150, chance: 0.6, type: "troll_bless", healDice: [1, 200] } },   // 生命的祝福：恢復場上所有玩家NPC 1D200+等級
        "troll2_mage":     { n: "白目玩家(法師)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 12, ac: -21, mr: 80, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.67, dmg: [1, 4], db: 0, hit: 5, regenFix: 60, scale: { hpC: 12, acBase: -21, acDiv: 6, mrBase: 80, mrDiv: 3, curveDmg: true, hitBase: 5, atkSpd: 0.67 }, mag: { skn: "火箭", cd: 30, dmg: [3, 6], dbLv: 1, dbLvMult: 2, ele: "fire", alwaysHit: true }, mag2: { skn: "燃燒的火球", cd: 50, chance: 0.6, dmg: [10, 12], dbLv: 1, dbLvMult: 2, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 250, d: 100, tick: 3, dur: 18 } }, mag3: { skn: "龍捲風", cd: 110, chance: 0.3, dmg: [20, 10], dbLv: 1, dbLvMult: 3, ele: "wind", alwaysHit: true }, mag4: { skn: "流星雨", cd: 130, chance: 0.2, dmg: [20, 12], dbLv: 1, dbLvMult: 4, ele: "fire", alwaysHit: true }, mag5: { skn: "究極光裂術", cd: 90, chance: 0.2, reqAlign: 500, dmg: [1, 500], dbLv: 1, dbLvMult: 5, ele: "none", alwaysHit: true } },   // 火球灼燒=(250-MR)/2%·100固定/3秒·18秒；究極光裂術限性向≥500(reqAlign·js/03 施法閘)
        "troll2_dark":     { n: "白目玩家(黑妖)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, doubleDestroy: true, ddBase: 20, e: "none", hp: 14, ac: -23, mr: 100, er: 30, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.2, dmg: [1, 50], db: 0, hit: 5, regenFix: 60, scale: { hpC: 14, acBase: -23, acDiv: 5, mrBase: 100, mrDiv: 2, curveDmg: true, dmgMult: 2.5, hitBase: 5, atkSpd: 0.2, er: 30 }, mag: { skn: "破壞盔甲", type: "armor_break", cd: 60, pct: 58, dur: 8 } },   // 雙重破壞 20%·50級21%·每5級+1%(ddBase)；破壞盔甲受傷+58%
        "troll2_dragon":   { n: "白目玩家(龍騎)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 20, ac: -25, mr: 50, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.2, dmg: [1, 24], db: 0, hit: 2, regenFix: 60, scale: { hpC: 20, acBase: -25, acDiv: 3, mrBase: 50, mrDiv: 5, curveDmg: true, dmgMult: 2.5, hitBase: 2, atkSpd: 0.2 }, mag: { skn: "屠宰者", cd: 40, type: "multi_attack", times: 3 }, mag2: { skn: "奪命之雷", cd: 60, dmg: [10, 25], dbLv: 1, dbLvMult: 3, ele: "wind", alwaysHit: true } },
        "troll2_illusion": { n: "白目玩家(幻術)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, magicMelee: true, e: "none", hp: 14, ac: -21, mr: 80, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.5, dmg: [1, 4], db: 0, hit: 30, regenFix: 60, scale: { hpC: 14, acBase: -21, acDiv: 6, mrBase: 80, mrDiv: 3, curveDmg: true, dmgMult: 2.5, hitBase: 30, atkSpd: 0.5 }, mag: { skn: "粉碎能量", cd: 20, dmg: [7, 6], dbLv: 1, ele: "none", alwaysHit: true }, mag2: { skn: "燃燒立方", cd: 40, dmg: [8, 12], dbLv: 1, dbLvMult: 2, ele: "fire", alwaysHit: true } },
        "troll2_warrior":  { n: "白目玩家(戰士)", lv: 1, s: "S", beh: "主動", race: "玩家", wild: true, trollPlayer: true, e: "none", hp: 24, ac: -25, mr: 50, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 0.2, dmg: [1, 20], db: 20, hit: 0, regenFix: 60, scale: { hpC: 24, acBase: -25, acDiv: 3, mrBase: 50, mrDiv: 5, curveDmg: true, dmgMult: 2.5, hitBase: 0, atkSpd: 0.2, dbPlus: 20 }, onHitPoison: { skn: "出血", pbase: 150, d: 30, tick: 5, dur: 10 }, mag: { skn: "咆哮", cd: 50, chance: 0.5, dmg: [5, 12], dbLv: 1, dbLvMult: 2, ele: "none", alwaysHit: true } },   // 常駐：額外傷害+20(dbPlus 疊在曲線db上)·命中附加出血·咆哮 5D12+等級×2
        "orc_archer": { n: "妖魔弓箭手", lv: 3, s: "S", beh: "被動", race: "妖魔", e: "fire", hp: 12, ac: 10, mr: 2, exp: 10, goldMin: 11, goldMax: 32, atkSpd: 2, dmg: [2, 4], db: 2, hit: 0 },
        "gremlin": { n: "地靈", lv: 3, s: "S", beh: "被動", race: "地靈", e: "earth", hp: 7, ac: 10, mr: 2, exp: 10, goldMin: 11, goldMax: 32, atkSpd: 2, dmg: [2, 4], db: 2, hit: 0 },
        "nm_001": { n: "污染的地精靈", lv: 3, s: "S", beh: "被動", race: "元素", elem: true, e: "earth", hp: 10, ac: 10, mr: 10, exp: 10, goldMin: 11, goldMax: 32, atkSpd: 2, dmg: [2, 4], db: 2, hit: 0 },
        "nm_002": { n: "蘑菇", lv: 4, s: "S", beh: "被動", race: "蘑菇", e: "earth", hp: 20, ac: 5, mr: 0, exp: 17, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 5], db: 3, hit: 0, mag: { skn: "中毒", cd: 100, type: "poison", pbase: 30, d: 10, tick: 5, dur: 20 } },
        "nm_003": { n: "狼", lv: 4, s: "S", beh: "被動", race: "動物", e: "wind", hp: 30, ac: 10, mr: 2, exp: 37, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 5], db: 3, hit: 0 },
        "nm_004": { n: "哈士奇", lv: 5, s: "S", beh: "被動", race: "動物", e: "water", hp: 30, ac: 10, mr: 1, exp: 26, goldMin: 13, goldMax: 36, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0 },
        "侏儒": { n: "侏儒", lv: 5, s: "S", beh: "被動", race: "侏儒", e: "earth", hp: 30, ac: 10, mr: 2, exp: 26, goldMin: 13, goldMax: 36, atkSpd: 2, dmg: [1, 5], db: 1, hit: 0 },
        "nm_005": { n: "熊", lv: 5, s: "S", beh: "被動", race: "動物", e: "earth", hp: 50, ac: 10, mr: 80, exp: 26, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [2, 6], db: 3, hit: 0 },
        "zombie": { n: "人形殭屍", lv: 6, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 45, ac: 8, mr: 5, exp: 37, goldMin: 10, goldMax: 120, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "doberman": { n: "杜賓狗", lv: 6, s: "S", beh: "被動", race: "動物", e: "fire", hp: 20, ac: 10, mr: 30, exp: 37, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 8], db: 1, hit: 0 },
        // ===== 🐾 v3.2.17 夥伴更新：12 隻可捕捉動物（依「夥伴更新.md」·皆小型被動·金幣 0）=====
        "wild_tiger":     { n: "老虎",     lv: 5, s: "S", beh: "被動", race: "動物", e: "earth", hp: 40, ac: 10, mr: 15, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 8], db: 4, hit: 0 },
        "wild_cat":       { n: "貓",       lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 20, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0, mag: { skn: "寒冷戰慄", cd: 50, dmg: [1, 10], db: 0, ele: "none", alwaysHit: true, vamp: [1, 10] } },
        "wild_panda":     { n: "熊貓",     lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 30, ac: 10, mr: 70, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0 },
        "wild_koreapup":  { n: "高麗幼犬", lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 30, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0 },
        "wild_raccoon":   { n: "浣熊",     lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 30, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0, mag: { skn: "緩速術", cd: 50, type: "slowatk", pbase: 100, dur: 8 } },
        "wild_stbernard": { n: "聖伯納犬", lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 30, ac: 10, mr: 40, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0, mag: { skn: "風刃", cd: 50, dmg: [1, 10], db: 0, ele: "wind", alwaysHit: true } },
        "wild_fox":       { n: "狐狸",     lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 15, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0, mag: { skn: "火箭", cd: 50, dmg: [1, 12], db: 0, ele: "fire", alwaysHit: true } },
        "wild_rabbit":    { n: "暴走兔",   lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 20, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0, mag: { skn: "冰錐", cd: 50, dmg: [1, 12], db: 0, ele: "water", alwaysHit: true } },
        "wild_beagle":    { n: "小獵犬",   lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 20, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0, mag: { skn: "地獄之牙", cd: 50, dmg: [1, 10], db: 0, ele: "earth", alwaysHit: true } },
        "wild_collie":    { n: "柯利",     lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 40, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0 },
        "wild_kangaroo":  { n: "袋鼠",     lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 25, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0, mag: { skn: "火焰拳", cd: 50, dmg: [1, 10], db: 0, ele: "fire", alwaysHit: true } },
        "wild_monkey":    { n: "猴子",     lv: 5, s: "S", beh: "被動", race: "動物", e: "none",  hp: 30, ac: 10, mr: 30, exp: 25, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0 },
        "nm_006": { n: "安普長老", lv: 6, s: "S", beh: "被動", race: "安普", e: "wind", hp: 100, ac: 10, mr: 30, exp: 37, goldMin: 15, goldMax: 38, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0, mag: { skn: "落石術", cd: 50, dmg: [1, 4], db: 0, ele: "earth" } },
        "nm_007": { n: "污染的安特", lv: 6, s: "S", beh: "被動", race: "安特", e: "none", hp: 50, ac: 6, mr: 0, exp: 37, goldMin: 15, goldMax: 38, atkSpd: 3, dmg: [2, 7], db: 4, hit: 0, mag: { skn: "中毒", cd: 100, type: "poison", pbase: 30, d: 10, tick: 5, dur: 20 } },
        "floating_eye": { n: "漂浮之眼", lv: 7, s: "S", beh: "被動", race: "眼魔", e: "none", hp: 40, ac: 5, mr: 200, exp: 50, goldMin: 0, goldMax: 0, atkSpd: 60, dmg: [2, 8], db: 5, hit: 0, mag: { skn: "木乃伊的詛咒", cd: 50, type: "stone", pbase: 100 } },
        "fighter": { n: "妖魔鬥士", lv: 8, s: "S", beh: "被動", race: "妖魔", e: "fire", hp: 50, ac: 5, mr: 5, exp: 65, goldMin: 20, goldMax: 45, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "ice_wolf": { n: "冰原狼人", lv: 8, s: "S", beh: "被動", race: "狼人", isWolf: true, e: "wind", hp: 60, ac: 4, mr: 1, exp: 65, goldMin: 20, goldMax: 45, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "nm_008": { n: "怪手", lv: 8, s: "S", beh: "主動", race: "魔法生物", e: "wind", hp: 30, ac: 0, mr: 5, exp: 65, goldMin: 20, goldMax: 45, atkSpd: 1, dmg: [1, 8], db: 1, hit: 1 },
        "wolf": { n: "狼人", lv: 9, s: "S", beh: "被動", race: "狼人", isWolf: true, e: "wind", hp: 50, ac: 4, mr: 10, exp: 82, goldMin: 22, goldMax: 50, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "gnome_warrior": { n: "侏儒戰士", lv: 9, s: "S", beh: "被動", race: "侏儒", e: "earth", hp: 70, ac: 5, mr: 1, exp: 82, goldMin: 22, goldMax: 50, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "skeleton": { n: "骷髏", lv: 10, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 80, ac: 3, mr: 10, exp: 101, goldMin: 25, goldMax: 54, atkSpd: 1.8, dmg: [1, 13], db: 1, hit: 1 },
        "orc_zombie": { n: "妖魔殭屍", lv: 10, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 100, ac: 0, mr: 1, exp: 101, goldMin: 25, goldMax: 54, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0, mag: { skn: "中毒", cd: 100, type: "poison", pbase: 60, d: 10, tick: 5, dur: 20 } },
        "gandi_orc": { n: "甘地妖魔", lv: 10, s: "S", beh: "主動", race: "妖魔", e: "fire", hp: 80, ac: 0, mr: 15, exp: 101, goldMin: 25, goldMax: 54, atkSpd: 1, dmg: [1, 8], db: 1, hit: 1 },
        "nm_009": { n: "污染的潘", lv: 10, s: "S", beh: "主動", race: "潘", e: "fire", hp: 100, ac: 0, mr: 50, exp: 101, goldMin: 25, goldMax: 54, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "croc": { n: "鱷魚", lv: 10, s: "S", beh: "主動", race: "動物", e: "water", hp: 90, ac: 1, mr: 60, exp: 101, goldMin: 25, goldMax: 54, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "ant": { n: "巨蟻", lv: 12, s: "S", beh: "主動", race: "昆蟲", e: "earth", hp: 90, ac: -4, mr: 60, exp: 145, goldMin: 33, goldMax: 65, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "orc_mage": { n: "妖魔法師", lv: 12, s: "S", beh: "被動", race: "妖魔", e: "fire", hp: 80, ac: 0, mr: 30, exp: 145, goldMin: 33, goldMax: 65, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0, mag: { skn: "燃燒的火球", cd: 50, dmg: [2, 10], db: 0, ele: "fire" } },
        "skel_archer": { n: "骷髏弓箭手", lv: 12, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 80, ac: 0, mr: 10, exp: 145, goldMin: 33, goldMax: 65, atkSpd: 1.5, dmg: [1, 15], db: 2, hit: 1 },
        "roach": { n: "蟑螂人", lv: 12, s: "S", beh: "主動", race: "昆蟲", e: "earth", hp: 100, ac: -1, mr: 0, exp: 145, goldMin: 33, goldMax: 65, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0, mag: { skn: "中毒", cd: 100, type: "poison", pbase: 60, d: 10, tick: 5, dur: 20 } },
        "stone_golem": { hard: true, n: "石頭高崙", lv: 13, s: "L", beh: "被動", race: "高崙", e: "earth", hp: 150, ac: -1, mr: 5, exp: 170, goldMin: 37, goldMax: 72, atkSpd: 3, dmg: [2, 14], db: 7, hit: 0 },
        "rova_orc": { n: "羅孚妖魔", lv: 13, s: "S", beh: "主動", race: "妖魔", e: "fire", hp: 80, ac: -2, mr: 5, exp: 170, goldMin: 37, goldMax: 72, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "skel_axe": { n: "骷髏斧手", lv: 13, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 90, ac: 0, mr: 10, exp: 170, goldMin: 37, goldMax: 72, atkSpd: 1, dmg: [1, 11], db: 1, hit: 1 },
        "skel_spear": { n: "骷髏槍兵", lv: 13, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 90, ac: 8, mr: 10, exp: 170, goldMin: 37, goldMax: 72, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "spider": { n: "夏洛伯", lv: 14, s: "L", beh: "主動", race: "蜘蛛", e: "earth", hp: 100, ac: 0, mr: 12, exp: 197, goldMin: 41, goldMax: 78, atkSpd: 1, dmg: [1, 11], db: 1, hit: 2 },
        "orc_scout": { n: "妖魔巡守", lv: 14, s: "S", beh: "主動", race: "妖魔", e: "fire", hp: 90, ac: -3, mr: 5, exp: 197, goldMin: 41, goldMax: 78, atkSpd: 1.5, dmg: [1, 16], db: 2, hit: 2 },
        "hobgoblin": { n: "哈柏哥布林", lv: 14, s: "S", beh: "被動", race: "哥布林", e: "earth", hp: 90, ac: 1, mr: 1, exp: 197, goldMin: 41, goldMax: 78, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "atuba_orc": { n: "阿吐巴妖魔", lv: 15, s: "S", beh: "主動", race: "妖魔", e: "fire", hp: 120, ac: -5, mr: 10, exp: 226, goldMin: 45, goldMax: 86, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "duda_orc": { n: "都達瑪拉妖魔", lv: 15, s: "S", beh: "主動", race: "妖魔", e: "fire", hp: 100, ac: -5, mr: 20, exp: 226, goldMin: 45, goldMax: 86, atkSpd: 3, dmg: [2, 15], db: 8, hit: 0 },
        "bear": { n: "歐熊", lv: 15, s: "L", beh: "主動", race: "動物", e: "earth", hp: 250, ac: -6, mr: 10, exp: 226, goldMin: 45, goldMax: 86, atkSpd: 3, dmg: [2, 15], db: 8, hit: 0 },
        "lizardman": { n: "蜥蜴人", lv: 15, s: "S", beh: "主動", race: "蜥蜴人", e: "water", hp: 90, ac: -2, mr: 5, exp: 226, goldMin: 45, goldMax: 86, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "troglodyte": { n: "穴居人", lv: 15, s: "S", beh: "被動", race: "亞人", e: "water", hp: 60, ac: -4, mr: 10, exp: 226, goldMin: 45, goldMax: 86, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "sparto": { n: "史巴托", lv: 16, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 120, ac: -3, mr: 18, exp: 257, goldMin: 50, goldMax: 93, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "ghoul": { n: "食屍鬼", lv: 16, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 110, ac: -4, mr: 13, exp: 257, goldMin: 50, goldMax: 93, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0, mag: { skn: "麻痺", cd: 100, type: "paralyze", pbase: 50 } },
        "nm_010": { n: "鯊魚", lv: 16, s: "L", beh: "主動", race: "鯊魚", e: "water", hp: 90, ac: -2, mr: 50, exp: 257, goldMin: 50, goldMax: 93, atkSpd: 1.5, dmg: [1, 16], db: 2, hit: 2 },
        "b_knight": { n: "黑騎士", lv: 16, s: "S", beh: "被動", race: "黑騎士", e: "none", hp: 100, ac: -10, mr: 10, exp: 257, goldMin: 50, goldMax: 93, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "nm_011": { n: "黑騎士搜索隊", lv: 16, s: "S", beh: "被動", race: "黑騎士", e: "none", hp: 100, ac: -10, mr: 10, exp: 257, goldMin: 50, goldMax: 93, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "mermaid": { n: "人魚", lv: 16, s: "S", beh: "主動", race: "人魚", e: "water", hp: 85, ac: -2, mr: 5, exp: 257, goldMin: 50, goldMax: 93, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "neruga_orc": { n: "那魯加妖魔", lv: 17, s: "S", beh: "主動", race: "妖魔", e: "fire", hp: 150, ac: -8, mr: 7, exp: 290, goldMin: 56, goldMax: 102, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "lycan": { n: "萊肯", lv: 17, s: "S", beh: "主動", race: "狼人", isWolf: true, e: "wind", hp: 120, ac: -4, mr: 7, exp: 290, goldMin: 56, goldMax: 102, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "ungoliant": { n: "楊果里恩", lv: 18, s: "L", beh: "主動", race: "蜘蛛", e: "earth", hp: 200, ac: -5, mr: 10, exp: 325, goldMin: 61, goldMax: 110, atkSpd: 1, dmg: [1, 11], db: 1, hit: 2, mag: { skn: "中毒", cd: 100, type: "poison", pbase: 100, d: 10, tick: 5, dur: 20 } },
        "crabman": { n: "蟹人", lv: 18, s: "S", beh: "主動", race: "螃蟹", e: "water", hp: 200, ac: -10, mr: 1, exp: 325, goldMin: 61, goldMax: 110, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "giant": { n: "巨人", lv: 30, s: "L", beh: "主動", race: "巨人", e: "earth", hp: 400, ac: -20, mr: 30, exp: 901, goldMin: 138, goldMax: 229, atkSpd: 2, dmg: [2, 42], db: 22, hit: 28 },
        "giant_warrior": { n: "巨人戰士", lv: 33, s: "L", beh: "主動", race: "巨人", e: "earth", hp: 420, ac: -25, mr: 40, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 2, dmg: [2, 46], db: 24, hit: 32 },
        "giant_elder": { n: "巨人長老", lv: 33, s: "L", beh: "主動", race: "巨人", e: "earth", hp: 1000, ac: -25, mr: 40, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 2, dmg: [2, 46], db: 24, hit: 32 },
        "giant_ancient": { hard: true, n: "古代巨人", lv: 70, s: "L", beh: "主動", race: "巨人", boss: true, e: "earth", hp: 8000, ac: -70, mr: 70, exp: 3137, goldMin: 1000, goldMax: 2000, atkSpd: 2, dmg: [4, 75], db: 76, hit: 81, mag: { skn: "震裂術", cd: 70, chance: 0.35, dmg: [1, 300], db: 299, ele: "earth", alwaysHit: true, sec: { type: "stun", pbase: 150 } } },
        "giant_ant": { n: "巨大兵蟻", lv: 20, s: "L", beh: "主動", race: "昆蟲", e: "earth", hp: 150, ac: -7, mr: 60, exp: 401, goldMin: 100, goldMax: 200, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "ratman": { n: "鼠人", lv: 20, s: "S", beh: "主動", race: "鼠人", e: "earth", hp: 150, ac: -5, mr: 10, exp: 401, goldMin: 73, goldMax: 129, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "starfish": { n: "海星", lv: 20, s: "L", beh: "主動", race: "海星", e: "water", hp: 180, ac: -10, mr: 5, exp: 401, goldMin: 73, goldMax: 129, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0, mag: { skn: "麻痺", cd: 100, type: "paralyze", pbase: 50 } },
        "elder": { n: "長老", lv: 21, s: "S", beh: "被動", race: "長老", e: "none", hp: 250, ac: -5, mr: 30, exp: 442, goldMin: 80, goldMax: 140, atkSpd: 2, dmg: [2, 18], db: 9, hit: 0, mag: { skn: "極道落雷", cd: 50, dmg: [1, 20], db: 20, ele: "wind" } },
        "gaster": { n: "卡司特", lv: 21, s: "S", beh: "主動", race: "卡司特", e: "earth", hp: 200, ac: -10, mr: 10, exp: 442, goldMin: 80, goldMax: 140, atkSpd: 1, dmg: [1, 14], db: 2, hit: 7, mag: { skn: "沉默", cd: 100, type: "magicseal", pbase: 60 } },
        "ogre": { n: "食人妖精", lv: 22, s: "L", beh: "主動", race: "食人妖精", e: "fire", hp: 250, ac: -6, mr: 10, exp: 485, goldMin: 46, goldMax: 359, atkSpd: 2, dmg: [2, 23], db: 12, hit: 4, mag: { skn: "火牢", cd: 30, chance: 0.1, dmg: [1, 10], db: 22, ele: "fire" } },
        "lamia": { n: "蛇女", lv: 22, s: "L", beh: "主動", race: "蛇女", e: "water", hp: 200, ac: -6, mr: 10, exp: 485, goldMin: 56, goldMax: 214, atkSpd: 2, dmg: [2, 23], db: 12, hit: 4 },
        "cerberus": { n: "地獄犬", lv: 24, s: "S", beh: "主動", race: "惡魔", e: "fire", hp: 120, ac: -20, mr: 12, exp: 577, goldMin: 102, goldMax: 173, atkSpd: 2, dmg: [2, 32], db: 16, hit: 13, mag: { skn: "噴火", cd: 50, dmg: [2, 10], db: 24, ele: "fire" } },
        "sildeis": { n: "希爾黛斯", lv: 24, s: "S", beh: "主動", race: "元素", elem: true, e: "water", hp: 210, ac: -23, mr: 35, exp: 730, goldMin: 102, goldMax: 173, atkSpd: 2, dmg: [2, 32], db: 16, hit: 13, mag: { skn: "漩渦", cd: 50, dmg: [3, 6], db: 24, ele: "water" } },
        "dragon_turtle": { hard: true, n: "龍龜", lv: 24, s: "L", beh: "主動", race: "龍龜", e: "water", hp: 280, ac: -4, mr: 5, exp: 577, goldMin: 102, goldMax: 173, atkSpd: 3, dmg: [2, 32], db: 16, hit: 13 },
        "scorpion": { n: "毒蠍", lv: 26, s: "L", beh: "主動", race: "毒蠍", e: "fire", hp: 200, ac: -15, mr: 5, exp: 677, goldMin: 60, goldMax: 150, atkSpd: 1.8, dmg: [1, 43], db: 4, hit: 30, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 100, d: 10, tick: 5, dur: 20 } },
        "harpy": { n: "哈維", lv: 26, s: "S", beh: "主動", race: "哈維", e: "wind", hp: 230, ac: -18, mr: 25, exp: 677, goldMin: 118, goldMax: 198, atkSpd: 1.5, dmg: [1, 43], db: 4, hit: 30, mag: { skn: "吸血鬼之吻", cd: 80, dmg: [1, 10], db: 26, ele: "none", vamp: [1, 26] } },
        "skel_sniper": { n: "骷髏神射手", lv: 27, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 250, ac: -15, mr: 25, exp: 730, goldMin: 70, goldMax: 210, atkSpd: 1.5, dmg: [1, 44], db: 5, hit: 31 },
        "skel_guard": { n: "骷髏警衛", lv: 27, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 270, ac: -15, mr: 25, exp: 730, goldMin: 70, goldMax: 210, atkSpd: 2, dmg: [2, 38], db: 20, hit: 24 },
        "dark_elf": { n: "黑暗精靈", lv: 27, s: "S", beh: "主動", race: "黑暗精靈", e: "earth", hp: 350, ac: -24, mr: 30, exp: 730, goldMin: 126, goldMax: 212, atkSpd: 1.5, dmg: [1, 44], db: 5, hit: 31, mag: { skn: "龍捲風", cd: 110, dmg: [1, 27], db: 27, ele: "wind" } },
        "ogre_warrior": { n: "歐吉", lv: 28, s: "L", beh: "主動", race: "歐吉", e: "none", hp: 500, ac: -18, mr: 20, exp: 785, goldMin: 135, goldMax: 225, atkSpd: 3, dmg: [2, 40], db: 20, hit: 25 },
        "troll": { n: "多羅", lv: 28, s: "L", beh: "主動", race: "多羅", e: "earth", hp: 270, ac: -15, mr: 20, exp: 785, goldMin: 135, goldMax: 225, atkSpd: 2.5, dmg: [2, 40], db: 20, hit: 25 },
        "electon": { n: "伊萊克頓", lv: 28, s: "L", beh: "主動", race: "鮟鱇", e: "water", hp: 350, ac: -20, mr: 46, exp: 1226, goldMin: 135, goldMax: 225, atkSpd: 2, dmg: [2, 40], db: 20, hit: 25, mag: { skn: "防身電擊", cd: 130, dmg: [1, 14], db: 28, ele: "wind" } },
        "bandit": { n: "強盜", lv: 28, s: "S", beh: "主動", race: "強盜", e: "none", hp: 500, ac: -16, mr: 25, exp: 785, goldMin: 135, goldMax: 225, atkSpd: 1.7, dmg: [1, 46], db: 5, hit: 33 },
        "nm_012": { n: "雪人", lv: 28, s: "S", beh: "被動", race: "元素", elem: true, e: "water", hp: 444, ac: -18, mr: 25, exp: 1370, goldMin: 135, goldMax: 225, atkSpd: 2, dmg: [2, 40], db: 20, hit: 25 },
        "nm_013": { n: "紙人", lv: 28, s: "S", beh: "被動", race: "魔法生物", e: "wind", hp: 250, ac: -30, mr: 5, exp: 1370, goldMin: 235, goldMax: 425, atkSpd: 2, dmg: [2, 40], db: 20, hit: 25 },
        "skel_fighter": { n: "骷髏鬥士", lv: 29, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 280, ac: -15, mr: 25, exp: 842, goldMin: 70, goldMax: 210, atkSpd: 2, dmg: [2, 41], db: 21, hit: 27 },
        "crustacean": { hard: true, n: "奎斯坦修", lv: 29, s: "L", beh: "主動", race: "寄居蟹", e: "water", hp: 450, ac: -23, mr: 45, exp: 1090, goldMin: 128, goldMax: 236, atkSpd: 2.5, dmg: [2, 41], db: 21, hit: 27 },
        "bomb_flower": { n: "爆彈花", lv: 29, s: "S", beh: "主動", race: "爆彈花", e: "fire", hp: 230, ac: -10, mr: 25, exp: 677, goldMin: 118, goldMax: 198, atkSpd: 2, dmg: [2, 41], db: 21, hit: 27 },
        "ogre_king": { n: "食人妖精王", lv: 30, s: "L", beh: "主動", race: "食人妖精", e: "fire", hp: 400, ac: -13, mr: 20, exp: 901, goldMin: 153, goldMax: 254, atkSpd: 1.7, dmg: [1, 49], db: 5, hit: 36, mag: { skn: "火牢", cd: 30, chance: 0.1, dmg: [2, 10], db: 30, ele: "fire" } },
        "monia": { n: "莫妮亞", lv: 30, s: "S", beh: "主動", race: "蜘蛛", e: "earth", hp: 350, ac: -12, mr: 35, exp: 901, goldMin: 145, goldMax: 235, atkSpd: 1.5, dmg: [1, 49], db: 5, hit: 36 },
        "nm_014": { n: "艾爾摩士兵", lv: 30, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 250, ac: -15, mr: 0, exp: 901, goldMin: 165, goldMax: 215, atkSpd: 2, dmg: [2, 42], db: 22, hit: 28 },
        "griffon": { n: "格利芬", lv: 31, s: "L", beh: "主動", race: "格利芬", e: "wind", hp: 380, ac: -20, mr: 10, exp: 962, goldMin: 163, goldMax: 270, atkSpd: 1.8, dmg: [1, 51], db: 5, hit: 37 },
        "nm_015": { n: "艾爾摩法師", lv: 31, s: "L", beh: "主動", race: "不死", un: true, e: "earth", hp: 230, ac: -10, mr: 50, exp: 962, goldMin: 163, goldMax: 270, atkSpd: 2, dmg: [2, 44], db: 22, hit: 30, mag: { skn: "冰錐", cd: 30, dmg: [3, 10], db: 31, ele: "water" } },
        "nm_016": { hard: true, n: "密密", lv: 31, s: "S", beh: "主動", race: "魔法生物", e: "earth", hp: 300, ac: -16, mr: 20, exp: 962, goldMin: 163, goldMax: 270, atkSpd: 2, dmg: [2, 44], db: 22, hit: 30 },
        "giant_croc": { hard: true, n: "巨大鱷魚", lv: 32, s: "L", beh: "主動", race: "動物", e: "water", hp: 400, ac: -23, mr: 10, exp: 1025, goldMin: 173, goldMax: 285, atkSpd: 2.5, dmg: [2, 45], db: 23, hit: 31 },
        "nm_017": { hard: true, n: "冰石高崙", lv: 32, s: "L", beh: "被動", race: "高崙", e: "water", hp: 400, ac: -31, mr: 7, exp: 1025, goldMin: 173, goldMax: 285, atkSpd: 2.5, dmg: [2, 45], db: 23, hit: 31 },
        "gaster_king": { n: "卡司特王", lv: 33, s: "S", beh: "主動", race: "卡司特", e: "earth", hp: 300, ac: -13, mr: 20, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 1, dmg: [1, 50], db: 5, hit: 40, mag: { skn: "沉默", cd: 100, type: "magicseal", pbase: 100 } },
        "nm_018": { hard: true, n: "活鎧甲", lv: 33, s: "S", beh: "主動", race: "魔法生物", e: "earth", hp: 300, ac: -25, mr: 40, exp: 1090, goldMin: 183, goldMax: 280, atkSpd: 1, dmg: [1, 50], db: 5, hit: 40 },
        "beholder": { n: "多眼怪", lv: 33, s: "L", beh: "主動", race: "眼魔", e: "wind", hp: 450, ac: -10, mr: 50, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 1.5, dmg: [1, 54], db: 5, hit: 40, mag: { skn: "木乃伊的詛咒", cd: 80, type: "stone", pbase: 100 } },
        "dragon_fly": { n: "龍蠅", lv: 33, s: "S", beh: "主動", race: "昆蟲", e: "wind", hp: 350, ac: -20, mr: 70, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 1.5, dmg: [1, 54], db: 5, hit: 40 },
        "nm_019": { n: "冰原老虎", lv: 33, s: "S", beh: "主動", race: "動物", e: "water", hp: 270, ac: -18, mr: 0, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 1.5, dmg: [1, 54], db: 5, hit: 40 },
        "nm_020": { n: "雪怪", lv: 33, s: "L", beh: "主動", race: "雪怪", e: "water", hp: 400, ac: -18, mr: 0, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 3, dmg: [2, 46], db: 24, hit: 32 },
        "doppelganger": { n: "變形怪", lv: 33, s: "S", beh: "主動", race: "變形怪", e: "earth", hp: 320, ac: -20, mr: 20, exp: 1090, goldMin: 184, goldMax: 302, atkSpd: 2, dmg: [2, 46], db: 24, hit: 32 },
        "arian": { n: "亞力安", lv: 34, s: "L", beh: "主動", race: "亞力安", e: "earth", hp: 500, ac: -20, mr: 30, exp: 1157, goldMin: 165, goldMax: 365, atkSpd: 1.2, dmg: [1, 55], db: 6, hit: 41, mag: { skn: "石化光線", cd: 90, type: "stone", pbase: 100 } },
        "aruba": { n: "阿魯巴", lv: 35, s: "L", beh: "主動", race: "巨人", e: "earth", hp: 500, ac: -22, mr: 50, exp: 1226, goldMin: 165, goldMax: 253, atkSpd: 1.5, dmg: [1, 57], db: 6, hit: 43, mag: { skn: "加速術", type: "self_haste", cd: 140, spd: 1, dur: 8 } },
        "fire_warrior": { n: "火焰戰士", lv: 35, s: "S", beh: "主動", race: "亞人", e: "fire", hp: 350, ac: -16, mr: 20, exp: 1226, goldMin: 165, goldMax: 253, atkSpd: 1.2, dmg: [1, 57], db: 6, hit: 43 },
        "nm_021": { n: "艾爾摩將軍", lv: 35, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 280, ac: -10, mr: 0, exp: 1226, goldMin: 125, goldMax: 302, atkSpd: 3, dmg: [2, 49], db: 25, hit: 35 },
        "nm_022": { hard: true, n: "鋼鐵高崙", lv: 35, s: "L", beh: "主動", race: "高崙", e: "earth", hp: 650, ac: -18, mr: 50, exp: 1226, goldMin: 125, goldMax: 302, atkSpd: 3, dmg: [2, 49], db: 25, hit: 35 },
        "bandit_boss": { n: "強盜頭目", lv: 35, s: "S", beh: "主動", race: "強盜", e: "none", hp: 500, ac: -25, mr: 50, exp: 1226, goldMin: 185, goldMax: 302, atkSpd: 1.5, dmg: [1, 57], db: 6, hit: 43 },
        "evil_lizard": { n: "邪惡蜥蜴", lv: 36, s: "L", beh: "主動", race: "邪惡蜥蜴", e: "water", hp: 800, ac: -20, mr: 30, exp: 1297, goldMin: 165, goldMax: 365, atkSpd: 2, dmg: [2, 51], db: 26, hit: 37, mag: { skn: "石化噴吐", cd: 110, type: "stone", pbase: 100 } },
        // 🔧 卡瑞：攜帶四樣任務道具時於龍之谷地監6樓 1% 機率出現（spawnMob 特殊判定·遭遇不消耗道具）；「擊殺」才 100% 掉屠龍劍並消耗四道具各一（🎮 v2.6.75 經典模式亦維持 100%）
        "kari": { hard: true, n: "卡瑞", lv: 52, s: "S", beh: "主動", race: "不死", un: true, e: "earth", boss: true, noAutoTeleport: true, hp: 3000, ac: -45, mr: 100, exp: 3000, goldMin: 1000, goldMax: 2000, atkSpd: 0.9, dmg: [3, 67], db: 21, hit: 76,   // 🔧 BOSS（但不觸發瞬移卷軸自動使用）
            mag:  { skn: "地面震裂", cd: 50, chance: 0.2, dmg: [4, 100], db: 99, ele: "earth" },                 // 每 5 秒判定，20% 機率施放：必中 4D100+99 地屬性魔法傷害
            mag2: { skn: "龍的一擊", cd: 70, dmg: [1, 100], db: 25, ele: "none", fixedDmg: true } },             // 每 7 秒：必中 1D100+25 無屬性固定傷害（不受屬抗/抗魔/減免影響）
        "fire_archer": { n: "火焰弓箭手", lv: 36, s: "S", beh: "主動", race: "亞人", e: "fire", hp: 320, ac: -5, mr: 20, exp: 1297, goldMin: 165, goldMax: 365, atkSpd: 0.8, dmg: [1, 43], db: 4, hit: 44 },
        "succubus": { n: "思克巴", lv: 37, s: "S", beh: "主動", race: "思克巴", e: "earth", hp: 400, ac: -25, mr: 50, exp: 1370, goldMin: 153, goldMax: 244, atkSpd: 1.8, dmg: [1, 61], db: 6, hit: 46, mag: { skn: "吸血鬼之吻", cd: 80, dmg: [2, 10], db: 37, ele: "none", vamp: [1, 37] } },
        "salamander": { n: "火蜥蜴", lv: 38, s: "S", beh: "主動", race: "元素", elem: true, e: "fire", hp: 383, ac: -23, mr: 11, exp: 1450, goldMin: 165, goldMax: 284, atkSpd: 1.5, dmg: [1, 63], db: 6, hit: 47 },
        "fire_egg": { n: "火炎蛋", lv: 39, s: "S", beh: "主動", race: "元素", elem: true, e: "fire", hp: 500, ac: -36, mr: 40, exp: 1520, goldMin: 153, goldMax: 244, atkSpd: 2, dmg: [2, 55], db: 28, hit: 41 },
        "nm_023": { n: "夢幻之島閃電球", lv: 39, s: "S", beh: "主動", race: "元素", elem: true, e: "wind", hp: 340, ac: -40, mr: 40, exp: 1520, goldMin: 153, goldMax: 244, atkSpd: 1, dmg: [1, 53], db: 5, hit: 49 },
        "nm_024": { hard: true, n: "夢幻之島鎧甲守衛", lv: 39, s: "L", beh: "主動", race: "元素", elem: true, e: "earth", hp: 400, ac: -40, mr: 0, exp: 1520, goldMin: 153, goldMax: 244, atkSpd: 4, dmg: [2, 55], db: 28, hit: 41 },
        "cyclops": { n: "獨眼巨人", lv: 40, s: "L", beh: "主動", race: "巨人", e: "wind", hp: 800, ac: -23, mr: 30, exp: 1601, goldMin: 265, goldMax: 429, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43 },
        "succubus_queen": { n: "思克巴女皇", lv: 41, s: "S", beh: "主動", race: "思克巴", e: "earth", hp: 500, ac: -32, mr: 80, exp: 1682, goldMin: 162, goldMax: 256, atkSpd: 1.8, dmg: [1, 67], db: 7, hit: 51, mag: { skn: "吸血鬼之吻", cd: 80, dmg: [2, 11], db: 41, ele: "none", vamp: [1, 41] } },
        "nm_025": { n: "影魔", lv: 41, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 832, ac: -43, mr: 30, exp: 1682, goldMin: 362, goldMax: 656, atkSpd: 1.5, dmg: [1, 67], db: 7, hit: 51 },
        "nm_026": { n: "鬼魂", lv: 42, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 644, ac: -31, mr: 5, exp: 1765, goldMin: 150, goldMax: 700, atkSpd: 2, dmg: [2, 59], db: 30, hit: 45 },
        "necromancer": { hard: true, n: "巫師", lv: 42, s: "S", beh: "主動", race: "長老", e: "none", hp: 800, ac: -32, mr: 80, exp: 1765, goldMin: 350, goldMax: 500, atkSpd: 2, dmg: [2, 59], db: 30, hit: 45, mag: { skn: "極光雷電", cd: 80, dmg: [1, 80], db: 82, ele: "wind" } },
        "lava_golem": { hard: true, n: "熔岩高崙", lv: 43, s: "L", beh: "主動", race: "高崙", e: "fire", hp: 700, ac: -18, mr: 50, exp: 1850, goldMin: 350, goldMax: 500, atkSpd: 3, dmg: [2, 61], db: 31, hit: 46, mag: { skn: "燃燒的火球", cd: 80, dmg: [1, 20], db: 43, ele: "fire" } },
        "nm_027": { n: "紅鬼魂", lv: 43, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 666, ac: -33, mr: 5, exp: 1850, goldMin: 150, goldMax: 700, atkSpd: 2, dmg: [2, 59], db: 30, hit: 46 },
        "nm_028": { hard: true, n: "夢幻之島火精靈王", lv: 43, s: "L", beh: "主動", race: "元素", elem: true, boss: true, e: "fire", hp: 1500, ac: -53, mr: 45, exp: 3601, goldMin: 450, goldMax: 790, atkSpd: 2, dmg: [3, 67], db: 51, hit: 64, mag: { skn: "爆炎的火球", cd: 50, dmg: [1, 50], db: 53, ele: "fire", alwaysHit: true } },
        "nm_029": { hard: true, n: "夢幻之島水精靈王", lv: 43, s: "L", beh: "主動", race: "元素", elem: true, boss: true, e: "water", hp: 2500, ac: -53, mr: 45, exp: 3601, goldMin: 450, goldMax: 790, atkSpd: 2, dmg: [3, 67], db: 51, hit: 64, mag: { skn: "水柱", cd: 50, dmg: [3, 30], db: 43, ele: "water", alwaysHit: true } },
        "nm_030": { hard: true, n: "夢幻之島風精靈王", lv: 43, s: "L", beh: "主動", race: "元素", elem: true, boss: true, e: "wind", hp: 1500, ac: -53, mr: 45, exp: 3601, goldMin: 450, goldMax: 790, atkSpd: 1, dmg: [2, 75], db: 15, hit: 64, mag: { skn: "龍捲風", cd: 50, dmg: [4, 30], db: 30, ele: "wind", alwaysHit: true } },
        "nm_031": { hard: true, n: "夢幻之島地精靈王", lv: 43, s: "L", beh: "主動", race: "元素", elem: true, boss: true, e: "earth", hp: 2000, ac: -53, mr: 45, exp: 3601, goldMin: 450, goldMax: 790, atkSpd: 3, dmg: [3, 67], db: 51, hit: 64, mag: { skn: "巨石之擊", cd: 50, dmg: [2, 60], db: 23, ele: "earth", alwaysHit: true } },
        "nm_032": { hard: true, n: "獨角獸", lv: 43, s: "L", beh: "主動", race: "獨角獸", boss: true, e: "earth", hp: 3000, ac: -48, mr: 45, exp: 3601, goldMin: 450, goldMax: 790, atkSpd: 1.5, dmg: [3, 73], db: 22, hit: 64 },
        "nm_037": { hard: true, n: "夢魘", lv: 40, s: "L", beh: "主動", race: "惡魔", boss: true, e: "none", hp: 1500, ac: -42, mr: 80, exp: 1601, goldMin: 161, goldMax: 264, atkSpd: 1.5, dmg: [3, 71], db: 22, hit: 60 },
        "nm_038": { n: "夢幻之島蘑菇", lv: 30, s: "S", beh: "主動", race: "蘑菇", e: "earth", hp: 250, ac: -27, mr: 0, exp: 901, goldMin: 165, goldMax: 215, atkSpd: 1, dmg: [1, 49], db: 5, hit: 36, mag: { skn: "中毒", cd: 100, type: "poison", pbase: 100, d: 30, tick: 5, dur: 20 } },
        "nm_039": { n: "夢幻之島鬼火", lv: 30, s: "S", beh: "主動", race: "鬼火", e: "earth", hp: 360, ac: -33, mr: 35, exp: 901, goldMin: 165, goldMax: 215, atkSpd: 2, dmg: [2, 42], db: 22, hit: 28 },
        "nm_040": { n: "夢幻之島火蜥蜴", lv: 38, s: "S", beh: "主動", race: "元素", elem: true, e: "fire", hp: 383, ac: -28, mr: 11, exp: 1450, goldMin: 165, goldMax: 284, atkSpd: 1.5, dmg: [1, 63], db: 6, hit: 47 },
        "nm_041": { n: "夢幻之島殺人蜂", lv: 38, s: "S", beh: "被動", race: "昆蟲", e: "none", hp: 200, ac: -36, mr: 10, exp: 1450, goldMin: 43, goldMax: 444, atkSpd: 0.5, dmg: [1, 30], db: 3, hit: 47 },
        "nm_042": { n: "夢幻之島暴走兔", lv: 38, s: "S", beh: "被動", race: "動物", e: "none", hp: 250, ac: -26, mr: 30, exp: 1450, goldMin: 343, goldMax: 444, atkSpd: 1, dmg: [1, 52], db: 5, hit: 47, mag: { skn: "冰錐", cd: 30, dmg: [1, 30], db: 23, ele: "water", alwaysHit: true } },
        "nm_043": { n: "夢幻之島火炎蛋", lv: 39, s: "S", beh: "主動", race: "元素", elem: true, e: "fire", hp: 500, ac: -36, mr: 40, exp: 1520, goldMin: 153, goldMax: 244, atkSpd: 2, dmg: [2, 55], db: 28, hit: 41 },
        "nm_044": { n: "夢幻之島冰石高崙", lv: 39, s: "L", beh: "被動", race: "高崙", e: "water", hp: 573, ac: -31, mr: 7, exp: 1520, goldMin: 153, goldMax: 244, atkSpd: 2.5, dmg: [2, 55], db: 28, hit: 41 },
        "nm_045": { n: "夢幻之島大鬼火", lv: 40, s: "S", beh: "主動", race: "鬼火", e: "earth", hp: 360, ac: -33, mr: 35, exp: 1520, goldMin: 153, goldMax: 244, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43 },
        "nm_046": { n: "冰人", lv: 30, s: "L", beh: "被動", race: "元素", elem: true, e: "water", hp: 300, ac: -20, mr: 21, exp: 901, goldMin: 143, goldMax: 324, atkSpd: 2, dmg: [2, 42], db: 22, hit: 28 },
        "ice_maid": { n: "冰之女王侍女", lv: 10, s: "S", beh: "主動", race: "元素", elem: true, e: "water", hp: 1000, ac: -35, mr: 60, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 7], db: 4, hit: 0 },
        "ice_queen": { hard: true, n: "冰之女王", lv: 75, s: "S", beh: "主動", race: "元素", elem: true, boss: true, e: "water", hp: 15000, ac: -65, mr: 60, exp: 5000, goldMin: 9000, goldMax: 18000, atkSpd: 2, dmg: [4, 97], db: 98, hit: 113, mag: { skn: "冰雪暴", cd: 80, chance: 0.3, dmg: [7, 150], db: 99, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 200 } }, mag2: { skn: "寒冰吐息", cd: 130, type: "frost_breath", pbase: 200, dur: 8 }, mag3: { skn: "冰錐", cd: 50, dmg: [1, 400], db: 99, ele: "water", alwaysHit: true } },
        "ice_demon": { hard: true, n: "冰魔", lv: 70, s: "S", beh: "主動", race: "元素", elem: true, boss: true, e: "none", hp: 10000, ac: -68, mr: 80, exp: 3600, goldMin: 10000, goldMax: 20000, atkSpd: 2, dmg: [4, 86], db: 87, hit: 101, mag: { skn: "冰裂術", cd: 70, chance: 0.3, dmg: [5, 200], db: 99, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 250 } }, mag2: { skn: "雷霆風暴", cd: 130, dmg: [3, 200], db: 66, ele: "wind", alwaysHit: true }, mag3: { skn: "衝擊之暈", cd: 90, chance: 0.5, type: "stun", pbase: 200 } },
        "batus": { hard: true, n: "巴土瑟", lv: 43, s: "S", beh: "主動", race: "四色", boss: true, e: "none", hp: 2400, ac: -32, mr: 80, exp: 1850, goldMin: 150, goldMax: 300, atkSpd: 2, dmg: [3, 67], db: 51, hit: 64, mag: { skn: "地裂術", cd: 70, dmg: [3, 80], db: 183, ele: "earth" } },
        "casper": { hard: true, n: "卡士柏", lv: 44, s: "S", beh: "主動", race: "四色", boss: true, e: "none", hp: 1350, ac: -32, mr: 80, exp: 1937, goldMin: 150, goldMax: 300, atkSpd: 2, dmg: [3, 68], db: 52, hit: 65, mag: { skn: "燃燒的火球", cd: 60, dmg: [2, 100], db: 196, ele: "fire" } },
        "marcus": { hard: true, n: "馬庫爾", lv: 45, s: "S", beh: "主動", race: "四色", boss: true, e: "none", hp: 1350, ac: -32, mr: 80, exp: 2026, goldMin: 1500, goldMax: 3000, atkSpd: 2, dmg: [3, 70], db: 53, hit: 67, mag: { skn: "光箭", cd: 30, dmg: [1, 120], db: 90, ele: "none" } },
        "ashitakio": { n: "阿西塔基奧", lv: 45, s: "L", beh: "主動", race: "阿西塔基奧", e: "fire", hp: 500, ac: -18, mr: 30, exp: 2026, goldMin: 250, goldMax: 500, atkSpd: 1.5, dmg: [1, 74], db: 7, hit: 57 },
        "nm_033": { n: "死神", lv: 45, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 280, ac: -60, mr: 9, exp: 2026, goldMin: 350, goldMax: 600, atkSpd: 1.5, dmg: [1, 74], db: 7, hit: 57 },
        "ifrit": { hard: true, n: "伊弗利特", lv: 45, s: "L", beh: "主動", race: "惡魔", boss: true, e: "fire", hp: 3300, ac: -38, mr: 40, exp: 2117, goldMin: 2500, goldMax: 4000, atkSpd: 1.5, dmg: [3, 73], db: 22, hit: 67, mag: { skn: "火之矛", cd: 70, dmg: [3, 120], db: 245, ele: "fire" } },
        "fire_beast": { n: "烈炎獸", lv: 48, s: "S", beh: "主動", race: "地獄犬", e: "fire", hp: 1154, ac: -28, mr: 35, exp: 2810, goldMin: 351, goldMax: 430, atkSpd: 1.2, dmg: [1, 64], db: 6, hit: 60, mag: { skn: "火焰噴吐", cd: 50, dmg: [1, 120], db: 45, ele: "fire" } },
        "wyvern": { hard: true, n: "飛龍", lv: 48, s: "L", beh: "主動", race: "飛龍", boss: true, e: "wind", hp: 2200, ac: -48, mr: 70, exp: 2810, goldMin: 340, goldMax: 545, atkSpd: 1, dmg: [2, 76], db: 15, hit: 70, mag: { skn: "火焰噴吐", cd: 70, dmg: [3, 120], db: 248, ele: "fire" } },
        "blackelder": { hard: true, n: "黑長者", lv: 50, s: "S", beh: "主動", race: "長老", boss: true, e: "none", hp: 2500, ac: -45, mr: 90, exp: 2501, goldMin: 245, goldMax: 1121, atkSpd: 2, dmg: [3, 78], db: 59, hit: 73, mag: { skn: "龍捲風", cd: 110, dmg: [4, 100], db: 148, ele: "wind" }, mag2: { skn: "靈光箭", cd: 30, chance: 0.7, dmg: [1, 100], db: 50, ele: "none" } },
        "doppel_boss": { hard: true, n: "變形怪首領", lv: 65, s: "S", beh: "主動", race: "變形怪", boss: true, e: "wind", hp: 2000, ac: -63, mr: 80, exp: 2501, goldMin: 345, goldMax: 1224, atkSpd: 2, dmg: [3, 78], db: 59, hit: 73, mag: { skn: "冰雪暴", cd: 50, chance: 0.5, dmg: [2, 100], db: 148, ele: "water" }, mag2: { skn: "火風暴", cd: 70, chance: 0.2, dmg: [2, 110], db: 248, ele: "fire" } },
        "baphomet": { hard: true, n: "巴風特", lv: 61, s: "S", beh: "主動", race: "惡魔", boss: true, e: "earth", hp: 16000, ac: -65, mr: 80, exp: 2602, goldMin: 365, goldMax: 1354, atkSpd: 1.5, dmg: [3, 89], db: 27, hit: 73, mag: { skn: "地裂術", cd: 50, chance: 0.5, dmg: [3, 100], db: 252, ele: "earth" }, mag2: { skn: "震裂術", cd: 60, chance: 0.4, dmg: [6, 100], db: 130, ele: "earth" } },
        "kurt": { hard: true, n: "克特", lv: 65, s: "S", beh: "主動", race: "黑騎士", boss: true, e: "none", hp: 4500, ac: -67, mr: 65, exp: 5185, goldMin: 426, goldMax: 2155, atkSpd: 1, dmg: [3, 75], db: 23, hit: 74, mag: { skn: "盾擊", cd: 70, chance: 0.3, type: "stun", pbase: 150 }, mag2: { skn: "極道落雷", cd: 110, dmg: [2, 100], db: 199, ele: "wind" } },
        "dk": { hard: true, n: "死亡騎士", lv: 75, s: "S", beh: "主動", race: "不死", boss: true, un: true, e: "earth", hp: 6000, ac: -72, mr: 100, exp: 6185, goldMin: 521, goldMax: 3155, atkSpd: 0.8, dmg: [2, 91], db: 18, hit: 76, mag: { skn: "地面震裂", cd: 50, chance: 0.2, dmg: [5, 100], db: 499, ele: "earth" }, mag2: { skn: "吸血鬼之吻", cd: 130, dmg: [1, 100], db: 199, ele: "none", vamp: [1, 212] }, mag3: { skn: "光球", cd: 30, chance: 0.2, dmg: [1, 200], db: 199, ele: "none" } },
        "ant_queen": { hard: true, n: "巨蟻女皇", lv: 70, s: "L", beh: "主動", race: "螞蟻", boss: true, e: "earth", hp: 10000, ac: -65, mr: 60, exp: 3250, goldMin: 426, goldMax: 2845, atkSpd: 1.5, dmg: [4, 87], db: 35, hit: 82, mag: { skn: "震裂術", cd: 70, dmg: [5, 100], db: 99, ele: "earth" } },
        "phoenix": { hard: true, n: "不死鳥", lv: 69, s: "L", beh: "主動", race: "不死鳥", boss: true, un: true, e: "fire", hp: 10000, ac: -68, mr: 150, exp: 5790, goldMin: 936, goldMax: 3748, atkSpd: 1.2, dmg: [3, 99], db: 30, hit: 85, mag: { skn: "火焰雨", cd: 130, dmg: [2, 100], db: 318, ele: "fire", sec: { type: "burn", tick: 5, d: 100, dur: 20, pbase: 100 } }, mag2: { skn: "流星雨", cd: 60, chance: 0.2, dmg: [4, 100], db: 318, ele: "fire" } },
        "nm_034": { hard: true, n: "惡魔", lv: 70, s: "L", beh: "主動", race: "惡魔", boss: true, e: "earth", hp: 15000, ac: -68, mr: 100, exp: 3722, goldMin: 13500, goldMax: 22500, atkSpd: 1, dmg: [3, 84], db: 25, hit: 89, mag: { skn: "火焰之舞", cd: 60, chance: 0.3, dmg: [6, 66], db: 666, ele: "fire", sec: { type: "burn", tick: 5, d: 66, dur: 20, pbase: 100 } }, mag2: { skn: "禁地封印", cd: 90, chance: 0.3, type: "magicseal", pbase: 200 }, mag3: { skn: "地面震裂", cd: 50, chance: 0.2, dmg: [5, 100], db: 499, ele: "earth" } },
        "antaras": { hard: true, n: "安塔瑞斯", lv: 93, s: "L", beh: "主動", race: "龍", boss: true, e: "earth", hp: 150000, ac: -80, mr: 200, exp: 9200, goldMin: 19236, goldMax: 26524, atkSpd: 1.5, dmg: [4, 94], db: 38, hit: 128, mag: { skn: "毒氣風暴", cd: 130, type: "poison", pbase: 250, d: 200, tick: 3, dur: 12 }, mag2: { skn: "地裂術", cd: 70, dmg: [6, 100], db: 499, ele: "earth" }, mag3: { skn: "大地怒吼", cd: 90, chance: 0.3, dmg: [1, 600], db: 999, ele: "earth" } },
        "fafurion": { hard: true, n: "法利昂", lv: 93, s: "L", beh: "主動", race: "龍", boss: true, e: "water", hp: 130000, ac: -80, mr: 250, exp: 9400, goldMin: 18236, goldMax: 28524, atkSpd: 2, dmg: [5, 79], db: 101, hit: 128, mag: { skn: "巨水炮", cd: 50, dmg: [3, 100], db: 250, ele: "water" }, mag2: { skn: "寒冰噴吐", cd: 70, chance: 0.3, dmg: [4, 100], db: 399, ele: "water", sec: { type: "freeze", pbase: 200 } }, mag3: { skn: "冰裂術", cd: 70, dmg: [1, 100], db: 200, ele: "water", ext_freeze: 666 } },
        "valakas": { hard: true, n: "巴拉卡斯", lv: 95, s: "L", beh: "主動", race: "龍", boss: true, e: "fire", hp: 200000, ac: -99, mr: 200, exp: 10000, goldMin: 20236, goldMax: 36524, atkSpd: 4, dmg: [5, 96], db: 122, hit: 128, mag: { skn: "火牢", cd: 50, chance: 0.1, type: "burn", d: 200, tick: 3, dur: 21 }, mag2: { skn: "流星雨", cd: 100, dmg: [5, 100], db: 560, ele: "fire", sec: { type: "scald", tick: 3, d: 100, dur: 15, pbase: 200 } }, mag3: { skn: "火焰噴吐", cd: 170, dmg: [2, 100], db: 1200, ele: "fire" } },
        "lindvior": { hard: true, n: "林德拜爾", lv: 90, s: "L", beh: "主動", race: "龍", boss: true, noAutoTeleport: true, e: "wind", hp: 120000, ac: -90, mr: 200, exp: 7922, goldMin: 13236, goldMax: 21524, atkSpd: 1, dmg: [3, 86], db: 26, hit: 128, mag: { skn: "封印禁地", cd: 50, chance: 0.1, type: "silence", pbase: 250 }, mag2: { skn: "閃電風暴", cd: 70, dmg: [7, 100], db: 299, ele: "wind" }, mag3: { skn: "電擊", cd: 90, chance: 0.5, dmg: [1, 500], db: 599, ele: "wind", sec: { type: "paralyze", pbase: 200 } } },
        // ===== 🐉 v3.7.57 侵蝕的安塔瑞斯巢穴（副本怪·普攻=同級一般怪2倍 DPS 手填·王類走 boss 曲線自動≈2.05×）=====
        "ant_kama_nan":   { n: "喀瑪南", lv: 53, s: "S", beh: "主動", race: "喀瑪", e: "fire",  hp: 1900, ac: -40, mr: 80, exp: 2026, goldMin: 380, goldMax: 660, atkSpd: 2, dmg: [4, 59], db: 120, hit: 30, mag: { skn: "礦石投擲", cd: 50, chance: 0.5, dmg: [4, 20], db: 100, ele: "none" } },
        "ant_kama_flame": { n: "喀瑪焰", lv: 53, s: "S", beh: "主動", race: "喀瑪", e: "water", hp: 2200, ac: -40, mr: 30, exp: 2200, goldMin: 380, goldMax: 660, atkSpd: 1, dmg: [3, 39], db: 60,  hit: 30, mag: { skn: "礦石投擲", cd: 50, chance: 0.5, dmg: [4, 20], db: 100, ele: "none" } },
        "ant_kama_flame_king": { hard: true, n: "喀瑪焰王", lv: 62, s: "L", beh: "主動", race: "喀瑪", boss: true, noAutoTeleport: true, noHpCurve: true, e: "water", hp: 15200, ac: -50, mr: 60,  exp: 4097, goldMin: 1800, goldMax: 3200, atkSpd: 2, dmg: [4, 40], db: 60, hit: 60, mag: { skn: "光球", cd: 50, chance: 0.5, dmg: [4, 20], db: 200, ele: "none" }, mag2: { skn: "地面震裂", cd: 70, chance: 0.5, dmg: [4, 50], db: 300, ele: "earth" } },
        "ant_kama_nan_king":   { hard: true, n: "喀瑪南王", lv: 62, s: "L", beh: "主動", race: "喀瑪", boss: true, noAutoTeleport: true, noHpCurve: true, e: "fire",  hp: 13200, ac: -50, mr: 120, exp: 4097, goldMin: 1800, goldMax: 3200, atkSpd: 2, dmg: [4, 40], db: 60, hit: 60, mag: { skn: "光球", cd: 50, chance: 0.5, dmg: [4, 20], db: 200, ele: "none" }, mag2: { skn: "地面震裂", cd: 70, chance: 0.5, dmg: [4, 50], db: 300, ele: "earth" } },
        "ant_kama_king":  { hard: true, n: "喀瑪王", lv: 70, s: "L", beh: "主動", race: "喀瑪", boss: true, noAutoTeleport: true, noHpCurve: true, e: "none", hp: 25000, ac: -65, mr: 120, exp: 6400, goldMin: 2600, goldMax: 4600, atkSpd: 1, dmg: [3, 30], db: 45, hit: 70, mag: { skn: "光球", cd: 50, chance: 0.5, dmg: [6, 20], db: 250, ele: "none" }, mag2: { skn: "地面震裂", cd: 70, chance: 0.5, dmg: [6, 50], db: 450, ele: "earth" } },
        "ant_earth_wild_dragon": { hard: true, n: "大地荒龍", lv: 62, s: "L", beh: "主動", race: "龍", e: "earth", hp: 2500, ac: -75, mr: 80, exp: 3845, goldMin: 1200, goldMax: 2200, atkSpd: 2, dmg: [5, 59], db: 150, hit: 60, mag: { skn: "屬性噴吐", cd: 70, chance: 0.5, dmg: [3, 50], db: 250, ele: "earth" } },
        // 三段變身鏈：HP<1% 或被打到 0 皆強制變身回滿血（transformTo/transformHpPct·killMob 頂端攔截＝中間階不死不發獎勵）；僅最終階「被侵蝕的瘋狂安塔瑞斯」會死亡並結算掉落
        "ant_antharas_eroded": { hard: true, n: "被侵蝕的安塔瑞斯", lv: 85, s: "L", beh: "主動", race: "龍", boss: true, noAutoTeleport: true, noDmgCurve: true, noHpCurve: true, e: "earth", hp: 90000, ac: -80, mr: 150, exp: 9200, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [4, 250], db: 265, hit: 90, transformTo: "ant_antharas_fury", transformHpPct: 0.01, transformFxText: "被侵蝕的安塔瑞斯陷入狂怒", transformLogText: "受到黑龍之力更深的侵蝕而狂暴", mag: { skn: "劇毒噴吐", cd: 50, chance: 0.5, dmg: [5, 26], db: 300, ele: "none", sec: { type: "poison", pbase: 300, d: 100, tick: 3, dur: 18 } }, mag2: { skn: "巨岩炮", cd: 70, chance: 0.5, dmg: [9, 50], db: 550, ele: "earth" } },
        "ant_antharas_fury":   { hard: true, n: "被侵蝕的狂怒安塔瑞斯", lv: 90, s: "L", beh: "主動", race: "龍", boss: true, noAutoTeleport: true, noDmgCurve: true, noHpCurve: true, e: "earth", hp: 180000, ac: -80, mr: 200, exp: 9200, goldMin: 0, goldMax: 0, atkSpd: 1.5, dmg: [4, 200], db: 465, hit: 95, transformTo: "ant_antharas_mad", transformHpPct: 0.01, transformFxText: "被侵蝕的狂怒安塔瑞斯陷入瘋狂", transformLogText: "陷入瘋狂，完全失去理智", mag: { skn: "劇毒噴吐", cd: 50, chance: 0.7, dmg: [5, 26], db: 400, ele: "none", sec: { type: "poison", pbase: 300, d: 200, tick: 3, dur: 18 } }, mag2: { skn: "巨岩炮", cd: 70, chance: 0.6, dmg: [10, 70], db: 550, ele: "earth" }, mag3: { skn: "集體衝暈", cd: 110, chance: 0.3, dmg: [5, 20], db: 300, ele: "none", sec: { type: "stun", pbase: 250, dur: 3 } } },
        "ant_antharas_mad":    { hard: true, n: "被侵蝕的瘋狂安塔瑞斯", lv: 95, s: "L", beh: "主動", race: "龍", boss: true, noAutoTeleport: true, noDmgCurve: true, noHpCurve: true, e: "earth", hp: 360000, ac: -90, mr: 250, exp: 10200, goldMin: 15000, goldMax: 25000, atkSpd: 1, dmg: [4, 200], db: 500, hit: 100, mag: { skn: "劇毒噴吐", cd: 50, dmg: [5, 26], db: 500, ele: "none", sec: { type: "poison", pbase: 350, d: 300, tick: 3, dur: 18 } }, mag2: { skn: "地裂術", cd: 70, chance: 0.7, dmg: [10, 50], db: 500, ele: "earth" }, mag3: { skn: "集體衝暈", cd: 110, chance: 0.3, dmg: [5, 20], db: 300, ele: "none", sec: { type: "stun", pbase: 250, dur: 3 } }, mag4: { skn: "毀滅隕石", cd: 130, chance: 0.5, dmg: [10, 50], db: 1000, ele: "earth" } },
        "nm_035": { n: "牧羊犬", lv: 5, s: "S", beh: "被動", race: "動物", e: "earth", hp: 30, ac: 10, mr: 30, exp: 26, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 6], db: 3, hit: 0 },
        "nm_036": { n: "夢幻之島冰人", lv: 38, s: "L", beh: "被動", race: "元素", elem: true, e: "water", hp: 350, ac: -30, mr: 21, exp: 1450, goldMin: 243, goldMax: 364, atkSpd: 2, dmg: [2, 54], db: 27, hit: 40 },
        "sema": { hard: true, n: "西瑪", lv: 42, s: "S", beh: "主動", boss: true, race: "四色", e: "none", hp: 2400, ac: -32, mr: 80, exp: 1765, goldMin: 426, goldMax: 800, atkSpd: 2.0, dmg: [2, 99], db: 50, hit: 63, mag: { skn: "極光雷電", sk: 'thunder', cd: 50, dmg: [2, 80], db: 182, ele: 'wind' } },
        // ===== 🏛️ 底比斯（時空裂痕·狩獵區域）：沙漠／金字塔內部／歐西里斯祭壇 =====
        "thebes_mandra_w":  { n: "底比斯 曼陀羅草(白)", lv: 23, s: "S", beh: "被動", race: "底比斯", e: "earth", hp: 280, ac: -10, mr: 50, exp: 530, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 30], db: 15, hit: 8 },
        "thebes_mandra":    { n: "底比斯 曼陀羅草", lv: 26, s: "S", beh: "被動", race: "底比斯", e: "fire", hp: 320, ac: -15, mr: 50, exp: 677, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 37], db: 19, hit: 22 },
        "thebes_scarab":    { n: "底比斯 聖甲蟲", lv: 29, s: "S", beh: "被動", race: "底比斯", e: "earth", hp: 400, ac: -25, mr: 60, exp: 842, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 41], db: 21, hit: 27 },
        "thebes_scarab_b":  { n: "底比斯 聖甲蟲(藍)", lv: 32, s: "S", beh: "主動", race: "底比斯", e: "earth", hp: 480, ac: -25, mr: 65, exp: 1025, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 50], db: 5, hit: 38 },
        "thebes_kebis_b":   { n: "底比斯 凱比斯(黑)", lv: 35, s: "S", beh: "被動", race: "底比斯", e: "earth", hp: 480, ac: -20, mr: 66, exp: 1025, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 50], db: 5, hit: 43, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 200, d: 10, tick: 5, dur: 20 } },
        "thebes_kebis_r":   { n: "底比斯 凱比斯(紅)", lv: 39, s: "S", beh: "主動", race: "底比斯", e: "earth", hp: 600, ac: -25, mr: 66, exp: 1522, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 53], db: 5, hit: 49, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 200, d: 10, tick: 5, dur: 20 } },
        "thebes_obelisk":   { hard: true, n: "底比斯 尖碑石奴", lv: 41, s: "L", beh: "被動", race: "底比斯", e: "water", hp: 700, ac: -25, mr: 80, exp: 1682, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [2, 58], db: 29, hit: 44, mag: { skn: "龍捲風", cd: 90, dmg: [3, 41], db: 63, ele: "wind" } },
        "thebes_obelisk_b": { hard: true, n: "底比斯 尖碑石奴(黑)", lv: 44, s: "L", beh: "被動", race: "底比斯", e: "fire", hp: 800, ac: -25, mr: 80, exp: 1937, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [2, 62], db: 32, hit: 48, mag: { skn: "龍捲風", cd: 90, dmg: [3, 44], db: 65, ele: "wind" } },
        "thebes_sphinx":    { n: "底比斯 斯芬克斯", lv: 47, s: "L", beh: "被動", race: "底比斯", e: "none", hp: 880, ac: -29, mr: 100, exp: 2210, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 60], db: 30, hit: 52, mag: { skn: "彩虹波動", cd: 70, chance: 0.5, dmg: [4, 47], db: 50, ele: "none" } },
        "thebes_sphinx_b":  { n: "底比斯 斯芬克斯(黑)", lv: 50, s: "L", beh: "主動", race: "底比斯", e: "earth", hp: 1120, ac: -32, mr: 100, exp: 2501, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 71], db: 36, hit: 56, mag: { skn: "彩虹波動", cd: 70, chance: 0.5, dmg: [4, 50], db: 60, ele: "none" } },
        "thebes_nehos":     { n: "底比斯 尼荷斯", lv: 50, s: "S", beh: "被動", race: "底比斯", e: "fire", hp: 900, ac: -20, mr: 60, exp: 2501, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 78], db: 8, hit: 63, mag: { skn: "火球", cd: 70, chance: 0.5, dmg: [5, 50], db: 30, ele: "fire" } },
        "thebes_nehos_b":   { n: "底比斯 尼荷斯(藍)", lv: 52, s: "S", beh: "主動", race: "底比斯", e: "fire", hp: 1120, ac: -30, mr: 60, exp: 2705, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 78], db: 8, hit: 66, mag: { skn: "火球", cd: 70, chance: 0.5, dmg: [5, 50], db: 40, ele: "fire" } },
        "thebes_anus":      { n: "底比斯 阿努斯", lv: 54, s: "S", beh: "被動", race: "底比斯", e: "none", hp: 1200, ac: -40, mr: 65, exp: 2917, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 76], db: 39, hit: 61 },
        "thebes_anus_b":    { n: "底比斯 阿努斯(黑)", lv: 56, s: "S", beh: "主動", race: "底比斯", e: "none", hp: 1300, ac: -40, mr: 65, exp: 3137, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 91], db: 46, hit: 63 },
        "thebes_bas":       { n: "底比斯 巴斯", lv: 58, s: "S", beh: "被動", race: "底比斯", e: "none", hp: 1400, ac: -30, mr: 70, exp: 3365, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 94], db: 48, hit: 66, mag: { skn: "雷霆風暴", cd: 70, chance: 0.5, dmg: [6, 50], db: 40, ele: "wind" } },
        "thebes_bas_r":     { n: "底比斯 巴斯(紅)", lv: 60, s: "S", beh: "主動", race: "底比斯", e: "none", hp: 1500, ac: -30, mr: 70, exp: 3601, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "雷霆風暴", cd: 70, chance: 0.5, dmg: [6, 50], db: 50, ele: "wind" } },
        "thebes_anubis":    { hard: true, n: "底比斯 阿努比斯", lv: 70, s: "L", beh: "主動", race: "底比斯", boss: true, e: "wind", hp: 25000, ac: -140, mr: 80, exp: 4901, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [4, 92], db: 93, hit: 107, mag: { skn: "震裂踏擊", cd: 70, chance: 0.5, dmg: [6, 100], db: 50, ele: "earth", sec: { type: "stun", pbase: 200, dur: 3 } }, mag2: { skn: "審判之雷", cd: 90, chance: 0.5, dmg: [1, 1000], db: 0, ele: "wind" } },
        "thebes_horus":     { hard: true, n: "底比斯 賀洛斯", lv: 70, s: "L", beh: "主動", race: "底比斯", boss: true, e: "water", hp: 20000, ac: -140, mr: 80, exp: 4901, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [4, 92], db: 93, hit: 107, mag: { skn: "火焰放射", cd: 70, chance: 0.5, dmg: [3, 100], db: 50, ele: "fire", sec: { type: "burn", pbase: 250, d: 100, tick: 3, dur: 18 } }, mag2: { skn: "火球", cd: 110, chance: 0.5, dmg: [1, 800], db: 0, ele: "fire" } },
        // ===== 🐍 蛇神降臨·提卡爾（時空裂痕·狩獵區域·庫庫爾坎神廟）：一般攻擊 dmg/db/hit 依同等級底比斯怪物鏡射（同裂痕層級平衡） =====
        "tikal_azt":      { n: "提卡爾艾庫阿茲特", lv: 23, s: "S", beh: "被動", race: "提卡爾", e: "none", hp: 252, ac: -13, mr: 50, exp: 530, goldMin: 0, goldMax: 0, atkSpd: 1.5, dmg: [2, 30], db: 15, hit: 8 },
        "tikal_azt_y":    { n: "提卡爾艾庫阿茲特(黃)", lv: 26, s: "S", beh: "主動", race: "提卡爾", e: "none", hp: 288, ac: -20, mr: 40, exp: 677, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 37], db: 19, hit: 22 },
        "tikal_yuka_b":   { n: "提卡爾艾庫尤卡(藍)", lv: 29, s: "S", beh: "主動", race: "提卡爾", e: "none", hp: 360, ac: -33, mr: 10, exp: 842, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 41], db: 21, hit: 27, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 150, d: 10, tick: 5, dur: 20 } },
        "tikal_yuka_w":   { n: "提卡爾艾庫尤卡(白)", lv: 32, s: "S", beh: "主動", race: "提卡爾", e: "none", hp: 432, ac: -36, mr: 10, exp: 1025, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 50], db: 5, hit: 38, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 150, d: 10, tick: 5, dur: 20 } },
        "tikal_kaira_b":  { n: "提卡爾艾庫卡伊拉(藍)", lv: 35, s: "S", beh: "被動", race: "提卡爾", e: "none", hp: 528, ac: -18, mr: 15, exp: 1226, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [1, 50], db: 5, hit: 43, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 200, d: 10, tick: 5, dur: 20 } },
        "tikal_kaira_y":  { n: "提卡爾艾庫卡伊拉(黃)", lv: 39, s: "S", beh: "主動", race: "提卡爾", e: "earth", hp: 660, ac: -23, mr: 15, exp: 1522, goldMin: 0, goldMax: 0, atkSpd: 1.5, dmg: [1, 53], db: 5, hit: 49, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 200, d: 10, tick: 5, dur: 20 } },
        "tikal_bara":     { n: "提卡爾艾庫巴拉", lv: 41, s: "L", beh: "被動", race: "提卡爾", e: "none", hp: 840, ac: -23, mr: 20, exp: 1682, goldMin: 0, goldMax: 0, atkSpd: 1.5, dmg: [2, 58], db: 29, hit: 44, mag: { skn: "毒液", cd: 50, type: "poison", pbase: 200, d: 20, tick: 5, dur: 20 } },
        "tikal_bara_r":   { n: "提卡爾艾庫巴拉(紅)", lv: 44, s: "L", beh: "主動", race: "提卡爾", e: "none", hp: 960, ac: -24, mr: 20, exp: 1937, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 62], db: 32, hit: 48, mag: { skn: "毒液", cd: 50, type: "poison", pbase: 200, d: 20, tick: 5, dur: 20 } },
        "tikal_eto":      { n: "提卡爾艾庫艾托", lv: 47, s: "L", beh: "被動", race: "提卡爾", e: "none", hp: 1056, ac: -26, mr: 80, exp: 2210, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [2, 60], db: 30, hit: 52, mag: { skn: "光球", cd: 70, chance: 0.5, dmg: [1, 80], db: 50, ele: "none", alwaysHit: true } },
        "tikal_eto_dry":  { n: "提卡爾艾庫艾托(枯竭)", lv: 50, s: "L", beh: "主動", race: "提卡爾", e: "none", hp: 1344, ac: -29, mr: 10, exp: 2501, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [2, 71], db: 36, hit: 56, mag: { skn: "光球", cd: 70, chance: 0.5, dmg: [1, 100], db: 50, ele: "none", alwaysHit: true } },
        "tikal_mud":      { n: "提卡爾薩德泥偶", lv: 50, s: "S", beh: "被動", race: "提卡爾", e: "none", hp: 810, ac: -26, mr: 30, exp: 2501, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [1, 78], db: 8, hit: 63 },
        "tikal_mud_k":    { n: "提卡爾薩德泥偶(黑)", lv: 52, s: "S", beh: "主動", race: "提卡爾", e: "none", hp: 1008, ac: -39, mr: 10, exp: 2705, goldMin: 0, goldMax: 0, atkSpd: 1.5, dmg: [1, 78], db: 8, hit: 66 },
        "tikal_ska_p":    { n: "提卡爾薩德司卡(紫)", lv: 54, s: "S", beh: "被動", race: "提卡爾", e: "none", hp: 1440, ac: -36, mr: 5, exp: 2917, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 76], db: 39, hit: 61 },
        "tikal_ska_r":    { n: "提卡爾薩德司卡(紅)", lv: 56, s: "S", beh: "主動", race: "提卡爾", e: "none", hp: 1560, ac: -36, mr: 5, exp: 3137, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 91], db: 46, hit: 63 },
        "tikal_teo_b":    { n: "提卡爾薩德提歐(藍)", lv: 58, s: "L", beh: "被動", race: "提卡爾", e: "none", hp: 1680, ac: -27, mr: 50, exp: 3365, goldMin: 0, goldMax: 0, atkSpd: 2.5, dmg: [2, 94], db: 48, hit: 66, mag: { skn: "彩虹雷電", cd: 90, chance: 0.5, dmg: [2, 80], db: 20, ele: "wind", alwaysHit: true } },
        "tikal_teo_y":    { n: "提卡爾薩德提歐(黃)", lv: 60, s: "L", beh: "主動", race: "提卡爾", e: "none", hp: 1800, ac: -36, mr: 35, exp: 3601, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "彩虹雷電", cd: 90, chance: 0.5, dmg: [2, 80], db: 40, ele: "wind", alwaysHit: true } },
        "tikal_boss_m":   { hard: true, n: "提卡爾杰弗雷庫(雄)", lv: 70, s: "L", beh: "主動", race: "提卡爾", boss: true, e: "earth", hp: 25000, ac: -140, mr: 80, exp: 4901, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [4, 92], db: 93, hit: 107, mag: { skn: "雷霆風暴", cd: 110, dmg: [8, 80], db: 240, ele: "wind", alwaysHit: true }, mag2: { skn: "寒冰吐息", cd: 130, type: "frost_breath", pbase: 250, dur: 8 }, mag3: { skn: "沙塵暴", cd: 90, chance: 0.15, type: "silence", pbase: 300 } },
        "tikal_boss_f":   { hard: true, n: "提卡爾杰弗雷庫(雌)", lv: 70, s: "L", beh: "主動", race: "提卡爾", boss: true, e: "none", hp: 20000, ac: -140, mr: 80, exp: 4901, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [4, 92], db: 93, hit: 107, mag: { skn: "毒氣風暴", cd: 120, type: "poison", pbase: 300, d: 100, tick: 3, dur: 12 }, mag2: { skn: "震裂重擊", cd: 90, chance: 0.15, dmg: [8, 100], db: 120, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 200, dur: 3 } }, mag3: { skn: "冰雪颶風", cd: 30, dmg: [2, 100], db: 0, ele: "water", alwaysHit: true } },
        // ===== 🌅 日出之國（依《日出之國.md》·時空裂痕第三區）：13 一般怪＋5 頭目 =====
        //  ・一般攻擊 dmg/db/hit＝tools/mob-designer.js 曲線值（同裂痕層級平衡）；HP/AC/MR/exp/gold/atkSpd/技能＝照 MD 原文
        //  ・三段變身頭目：transformTo/transformHpPct＝HP 低於門檻（或被打到 0）不死、原槽位強制變身為下一階並回滿血（js/03 tick 門檻偵測＋js/05 killMob 頂端攔截）
        //  ・onHitPoison＝一般攻擊命中附加中毒（(pbase-玩家MR)/2 %·js/04 enemyPhysicalAttack）；恐怖的面貌 type:'terror_visage'＝隨機免疫 近/遠/魔 其一 10 秒（重用血壁 _reflectWall 結構·block:true）
        "sr_narikama":    { hard: true, n: "嗚釜", lv: 65, s: "S", beh: "主動", race: "妖怪", e: "fire", hp: 1800, ac: -60, mr: 100, exp: 8451, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [3, 66], db: 50, hit: 84, mag: { skn: "火焰散落", cd: 70, chance: 0.5, dmg: [2, 60], db: 100, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 200, d: 30, tick: 5, dur: 20 } } },
        "sr_kamaitachi":  { n: "鎌鼬", lv: 65, s: "S", beh: "主動", race: "妖怪", e: "wind", hp: 1750, ac: -70, mr: 80, exp: 8451, goldMin: 300, goldMax: 600, atkSpd: 0.5, dmg: [1, 55], db: 6, hit: 91, mag: { skn: "鎌鼬旋風", cd: 70, chance: 0.5, dmg: [2, 80], db: 120, ele: "wind", alwaysHit: true } },
        "sr_rokurokubi":  { n: "轆轤首", lv: 68, s: "S", beh: "主動", race: "妖怪", e: "fire", hp: 2800, ac: -63, mr: 120, exp: 9249, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [3, 69], db: 53, hit: 87, mag: { skn: "弱化術", cd: 50, chance: 0.2, type: "weaken", pbase: 250, dur: 15 } },
        "sr_karakasa":    { n: "唐傘小僧", lv: 68, s: "S", beh: "主動", race: "妖怪", e: "water", hp: 2950, ac: -60, mr: 100, exp: 9249, goldMin: 400, goldMax: 600, atkSpd: 1, dmg: [1, 89], db: 9, hit: 95, mag: { skn: "疾病術", cd: 50, chance: 0.2, type: "disease", pbase: 250, dur: 20 } },
        "sr_narikama_rage": { hard: true, n: "憤怒的嗚釜", lv: 70, s: "S", beh: "主動", race: "妖怪", e: "fire", hp: 2200, ac: -65, mr: 80, exp: 9801, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [3, 66], db: 50, hit: 90, mag: { skn: "火焰散落", cd: 70, chance: 0.5, dmg: [2, 60], db: 140, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 200, d: 30, tick: 5, dur: 20 } } },
        "sr_kamaitachi_elder": { n: "鎌鼬長兄", lv: 70, s: "S", beh: "主動", race: "妖怪", e: "wind", hp: 2150, ac: -80, mr: 120, exp: 9801, goldMin: 300, goldMax: 600, atkSpd: 0.5, dmg: [1, 55], db: 6, hit: 97, mag: { skn: "鎌鼬旋風", cd: 70, chance: 0.5, dmg: [2, 80], db: 160, ele: "wind", alwaysHit: true } },
        "sr_kappa":       { hard: true, n: "河童", lv: 70, s: "S", beh: "主動", race: "妖怪", e: "water", hp: 2500, ac: -65, mr: 140, exp: 9801, goldMin: 300, goldMax: 600, atkSpd: 3, dmg: [3, 74], db: 56, hit: 91, mag: { skn: "寒冰氣息", cd: 70, chance: 0.5, dmg: [3, 80], db: 100, ele: "water", alwaysHit: true } },
        "sr_akaoni":      { n: "赤鬼", lv: 70, s: "S", beh: "主動", race: "妖怪", e: "fire", hp: 3500, ac: -66, mr: 100, exp: 9801, goldMin: 400, goldMax: 600, atkSpd: 2, dmg: [3, 66], db: 50, hit: 90 },
        "sr_aooni":       { n: "青鬼", lv: 70, s: "S", beh: "主動", race: "妖怪", e: "water", hp: 3500, ac: -66, mr: 100, exp: 9801, goldMin: 400, goldMax: 600, atkSpd: 2, dmg: [3, 66], db: 50, hit: 90 },
        "sr_nue":         { n: "鵺", lv: 72, s: "S", beh: "主動", race: "妖怪", e: "earth", hp: 3350, ac: -69, mr: 100, exp: 10083, goldMin: 400, goldMax: 600, atkSpd: 1, dmg: [1, 95], db: 10, hit: 99, mag: { skn: "夢咒", cd: 70, chance: 0.5, dmg: [2, 100], db: 100, ele: "none", alwaysHit: true, sec: { type: "blind", pbase: 200, dur: 15 } } },
        "sr_tengu":       { n: "天狗", lv: 72, s: "S", beh: "主動", race: "妖怪", e: "wind", hp: 3800, ac: -65, mr: 160, exp: 10083, goldMin: 400, goldMax: 600, atkSpd: 2, dmg: [3, 68], db: 52, hit: 92, mag: { skn: "風刃", cd: 50, dmg: [2, 100], db: 60, ele: "wind", alwaysHit: true } },
        "sr_asura":       { hard: true, n: "阿修羅像", lv: 72, s: "S", beh: "主動", race: "妖怪", e: "none", hp: 4500, ac: -66, mr: 120, exp: 10083, goldMin: 400, goldMax: 600, atkSpd: 1, dmg: [1, 95], db: 10, hit: 99, dr: 10 },
        "sr_ushioni_child": { n: "牛鬼之子", lv: 50, s: "S", beh: "主動", race: "妖怪", e: "earth", hp: 1000, ac: -60, mr: 110, exp: 2501, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [1, 78], db: 8, hit: 63, onHitPoison: { skn: "毒素", pbase: 200, d: 50, tick: 5, dur: 20 } },
        "sr_tamamo": { hard: true, n: "白面金毛九尾狐・玉藻", lv: 75, s: "L", beh: "主動", race: "妖怪", boss: true, noDmgCurve: true, noHpCurve: true, e: "water", hp: 18000, ac: -80, mr: 130, exp: 11251, goldMin: 400, goldMax: 600, atkSpd: 1, dmg: [3, 85], db: 26, hit: 113, transformTo: "sr_kyuubi", transformHpPct: 0.5, transformFxText: "妖狐展現真面目", mag: { skn: "妖狐之火", cd: 50, chance: 0.5, dmg: [4, 60], db: 200, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 300, d: 50, tick: 5, dur: 20 } } },
        "sr_kyuubi": { hard: true, n: "白面金毛九尾狐・九尾", lv: 75, s: "L", beh: "主動", race: "妖怪", boss: true, noDmgCurve: true, noHpCurve: true, e: "fire", hp: 25000, ac: -80, mr: 180, exp: 11251, goldMin: 14000, goldMax: 36000, atkSpd: 1, dmg: [3, 85], db: 26, hit: 113, transformTo: "sr_sessyoseki", transformHpPct: 0.3, transformFxText: "妖狐露出真身", mag: { skn: "妖狐之火", cd: 50, chance: 0.5, dmg: [4, 60], db: 300, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 300, d: 100, tick: 5, dur: 20 } } },
        "sr_sessyoseki": { hard: true, n: "白面金毛九尾狐・殺生石", lv: 80, s: "L", beh: "主動", race: "妖怪", boss: true, noDmgCurve: true, noHpCurve: true, e: "none", hp: 10000, ac: -99, mr: 200, exp: 13251, goldMin: 14000, goldMax: 36000, atkSpd: 1, dmg: [3, 86], db: 26, hit: 118, mag: { skn: "妖狐之火", cd: 50, chance: 0.5, dmg: [4, 100], db: 300, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 300, d: 150, tick: 5, dur: 20 } } },
        "sr_ushioni": { hard: true, n: "牛鬼", lv: 90, s: "L", beh: "主動", race: "妖怪", boss: true, noDmgCurve: true, e: "earth", hp: 120000, ac: -100, mr: 200, exp: 16201, goldMin: 15400, goldMax: 47000, atkSpd: 2, dmg: [5, 79], db: 101, hit: 128, onHitPoison: { skn: "猛毒", pbase: 300, d: 100, tick: 3, dur: 18 }, mag: { skn: "牛鬼突進", cd: 70, chance: 0.3, dmg: [4, 100], db: 400, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 300, dur: 3 } }, mag2: { skn: "大地崩裂", cd: 110, dmg: [4, 200], db: 300, ele: "earth", alwaysHit: true } },
        "sr_gashadokuro": { hard: true, n: "巨大骷髏", lv: 99, s: "L", beh: "主動", race: "妖怪", boss: true, noDmgCurve: true, noHpCurve: true, e: "none", hp: 99999, ac: -99, mr: 300, exp: 20000, goldMin: 40000, goldMax: 80000, atkSpd: 3, dmg: [6, 83], db: 126, hit: 128, mag: { skn: "槌擊", cd: 90, type: "stun", pbase: 250 }, mag2: { skn: "幽魂怨念", cd: 70, chance: 0.5, dmg: [5, 150], db: 200, ele: "none", alwaysHit: true, sec: { type: "sleep", pbase: 300 } }, mag3: { skn: "枯竭詛咒", cd: 110, chance: 0.2, type: "potionfrost", pbase: 300, dur: 8 }, mag4: { skn: "恐怖的面貌", cd: 100, type: "terror_visage", dur: 10 } },
        // ===== 拉斯塔巴德地下洞穴：歐姆族 =====
        "ohm": { n: "歐姆", lv: 19, s: "S", beh: "被動", race: "歐姆", e: "earth", hp: 152, ac: -10, mr: 19, exp: 362, goldMin: 20, goldMax: 300, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "ohm_rage": { n: "狂暴的歐姆", lv: 21, s: "S", beh: "被動", race: "歐姆", e: "earth", hp: 168, ac: -11, mr: 21, exp: 442, goldMin: 20, goldMax: 300, atkSpd: 2, dmg: [2, 18], db: 9, hit: 0 },
        "ohm_armor": { n: "歐姆裝甲兵", lv: 23, s: "L", beh: "被動", race: "歐姆", e: "water", hp: 184, ac: -12, mr: 21, exp: 530, goldMin: 100, goldMax: 400, atkSpd: 3, dmg: [2, 30], db: 15, hit: 8 },
        "ohm_armor_rage": { n: "狂暴的歐姆裝甲兵", lv: 25, s: "L", beh: "被動", race: "歐姆", e: "water", hp: 200, ac: -13, mr: 25, exp: 626, goldMin: 100, goldMax: 400, atkSpd: 2, dmg: [2, 34], db: 18, hit: 18 },
        // ===== 拉斯塔巴德地下洞穴：黑暗妖精殘兵 =====
        "de_remnant_bow": { n: "黑暗妖精殘兵(弓)", lv: 27, s: "S", beh: "被動", race: "黑暗妖精", e: "none", hp: 216, ac: -11, mr: 27, exp: 730, goldMin: 50, goldMax: 400, atkSpd: 1, dmg: [1, 43], db: 4, hit: 31 },
        "de_remnant_sword": { n: "黑暗妖精殘兵(劍)", lv: 29, s: "S", beh: "被動", race: "黑暗妖精", e: "none", hp: 261, ac: -15, mr: 29, exp: 842, goldMin: 50, goldMax: 400, atkSpd: 1.5, dmg: [1, 48], db: 5, hit: 34 },
        "de_remnant_xbow": { n: "黑暗妖精殘兵(十字弓)", lv: 29, s: "S", beh: "被動", race: "黑暗妖精", e: "none", hp: 232, ac: -12, mr: 29, exp: 842, goldMin: 50, goldMax: 400, atkSpd: 1, dmg: [1, 44], db: 4, hit: 34 },
        "de_remnant_mage": { n: "黑暗妖精殘兵(法師)", lv: 30, s: "S", beh: "被動", race: "黑暗妖精", e: "none", hp: 240, ac: -10, mr: 30, exp: 901, goldMin: 50, goldMax: 400, atkSpd: 2, dmg: [2, 42], db: 22, hit: 28, mag: { skn: "冰錐", cd: 70, dmg: [2, 30], db: 38, ele: "water", alwaysHit: true }, mag2: { skn: "龍捲風", cd: 50, chance: 0.2, dmg: [3, 30], db: 48, ele: "wind", alwaysHit: true } },
        "de_remnant_2h": { n: "黑暗妖精殘兵(雙手劍)", lv: 33, s: "S", beh: "被動", race: "黑暗妖精", e: "none", hp: 330, ac: -20, mr: 40, exp: 1090, goldMin: 50, goldMax: 400, atkSpd: 1, dmg: [1, 50], db: 5, hit: 40 },
        "dark_spirit_caller": { n: "黑暗精靈使", lv: 45, s: "S", beh: "被動", race: "黑暗妖精", e: "earth", hp: 550, ac: -38, mr: 45, exp: 2026, goldMin: 50, goldMax: 400, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49, mag: { skn: "邪靈之氣", type: "stat_debuff", cd: 70, acUp: 10, erDown: 10, dur: 6 }, mag2: { skn: "召喚闇之精靈", cd: 30, dmg: [3, 45], db: 48, ele: "none", alwaysHit: true } },
        // ===== 拉斯塔巴德正門：黑暗妖精守軍（主動）=====
        "de_gate_xbow": { n: "黑暗妖精警衛(十字弓)", lv: 36, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 240, ac: -20, mr: 10, exp: 1297, goldMin: 118, goldMax: 198, atkSpd: 2, dmg: [2, 51], db: 26, hit: 37 },
        "de_gate_apprentice": { n: "黑暗妖精魔法學徒", lv: 26, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 180, ac: -8, mr: 75, exp: 2026, goldMin: 120, goldMax: 200, atkSpd: 2, dmg: [2, 37], db: 19, hit: 22, mag: { skn: "冰錐", cd: 50, dmg: [2, 26], db: 40, ele: "water", alwaysHit: true } },
        "de_gate_spear": { n: "黑暗妖精警衛(矛)", lv: 40, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 800, ac: -23, mr: 30, exp: 1601, goldMin: 153, goldMax: 254, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43 },
        "de_gate_patrol": { n: "黑暗妖精巡守", lv: 38, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 500, ac: -20, mr: 40, exp: 1445, goldMin: 241, goldMax: 390, atkSpd: 1, dmg: [1, 52], db: 5, hit: 47 },
        "de_gate_soldier": { n: "黑暗妖精士兵", lv: 38, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 500, ac: -28, mr: 35, exp: 1445, goldMin: 241, goldMax: 390, atkSpd: 2, dmg: [2, 54], db: 27, hit: 40 },
        "de_gate_general": { n: "黑暗妖精將軍", lv: 43, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 900, ac: -40, mr: 45, exp: 1850, goldMin: 50, goldMax: 400, atkSpd: 2, dmg: [2, 59], db: 30, hit: 46 },
        // ===== 魔獸訓練場 =====
        "de_train_blacktiger": { n: "黑虎", lv: 40, s: "S", beh: "主動", race: "野獸", e: "fire", hp: 600, ac: -37, mr: 45, exp: 1601, goldMin: 10, goldMax: 100, atkSpd: 1, dmg: [1, 53], db: 5, hit: 50, tamedByAura: true },
        "de_train_tamer": { n: "拉斯塔巴德馴獸師", lv: 42, s: "S", beh: "主動", race: "拉斯塔巴德", e: "fire", hp: 378, ac: -37, mr: 65, exp: 1765, goldMin: 10, goldMax: 200, atkSpd: 2, dmg: [2, 59], db: 30, hit: 45, tamerAura: true },
        "de_train_cursetamer": { n: "受詛咒的馴獸師", lv: 43, s: "S", beh: "主動", race: "拉斯塔巴德", e: "fire", hp: 728, ac: -39, mr: 65, exp: 1850, goldMin: 110, goldMax: 300, atkSpd: 1, dmg: [1, 53], db: 5, hit: 54, tamerAura: true },
        "de_train_hellhound": { n: "地獄束縛犬", lv: 40, s: "S", beh: "主動", race: "惡魔", e: "earth", hp: 657, ac: -40, mr: 0, exp: 1601, goldMin: 110, goldMax: 300, atkSpd: 1, dmg: [1, 53], db: 5, hit: 50, tamedByAura: true, mag: { skn: "火焰噴吐", cd: 70, dmg: [4, 30], db: 28, ele: "fire", alwaysHit: true } },
        "de_train_soulknight": { n: "魂騎士", lv: 41, s: "S", beh: "主動", race: "拉斯塔巴德", e: "earth", hp: 1080, ac: -43, mr: 50, exp: 1682, goldMin: 110, goldMax: 300, atkSpd: 1, dmg: [1, 53], db: 5, hit: 51, mag: { skn: "地面震裂", cd: 70, dmg: [3, 40], db: 18, ele: "earth", alwaysHit: true } },
        "de_train_summoner": { n: "喚獸師", lv: 30, s: "S", beh: "主動", race: "拉斯塔巴德", e: "earth", hp: 600, ac: -28, mr: 35, exp: 962, goldMin: 10, goldMax: 200, atkSpd: 2, dmg: [2, 42], db: 22, hit: 28 },
        "de_train_gatekeeper": { n: "拉斯塔巴德守門人", lv: 40, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 800, ac: -27, mr: 30, exp: 1601, goldMin: 110, goldMax: 400, atkSpd: 1.5, dmg: [1, 66], db: 7, hit: 50 },
        // ===== 魔獸軍王之室（純BOSS房，需軍王的鑰匙入場） =====
        "de_king_baranka": { n: "魔獸軍王巴蘭卡", lv: 63, s: "L", beh: "被動", race: "拉斯塔巴德", e: "water", boss: true, hard: true, hp: 17290, ac: -58, mr: 65, exp: 3970, goldMin: 1250, goldMax: 4000, atkSpd: 0.5, dmg: [2, 68], db: 14, hit: 95 },
        // ===== 黑魔法研究室 =====
        "de_lab_earth": { n: "地元素守護者", lv: 42, s: "S", beh: "主動", race: "元素", elem: true, e: "earth", hp: 725, ac: -37, mr: 60, exp: 1765, goldMin: 100, goldMax: 300, atkSpd: 3, dmg: [2, 59], db: 30, hit: 45 },
        "de_lab_water": { n: "水元素守護者", lv: 42, s: "S", beh: "主動", race: "元素", elem: true, e: "water", hp: 725, ac: -37, mr: 60, exp: 1765, goldMin: 100, goldMax: 300, atkSpd: 3, dmg: [2, 59], db: 30, hit: 45 },
        "de_lab_wind":  { n: "風元素守護者", lv: 42, s: "S", beh: "主動", race: "元素", elem: true, e: "wind",  hp: 725, ac: -37, mr: 60, exp: 1765, goldMin: 100, goldMax: 300, atkSpd: 3, dmg: [2, 59], db: 30, hit: 45 },
        "de_lab_fire":  { n: "火元素守護者", lv: 42, s: "S", beh: "主動", race: "元素", elem: true, e: "fire",  hp: 725, ac: -37, mr: 60, exp: 1765, goldMin: 100, goldMax: 300, atkSpd: 3, dmg: [2, 59], db: 30, hit: 45 },
        "de_lab_mage":  { n: "黑暗妖精法師", lv: 40, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 500, ac: -32, mr: 70, exp: 1601, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43, mag: { skn: "冰錐", cd: 70, dmg: [4, 30], db: 28, ele: "water", alwaysHit: true }, mag2: { skn: "龍捲風", cd: 90, chance: 0.5, dmg: [4, 30], db: 40, ele: "wind", alwaysHit: true } },
        "de_lab_blackmage": { n: "黑法師", lv: 32, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 380, ac: -22, mr: 25, exp: 1025, goldMin: 120, goldMax: 200, atkSpd: 2, dmg: [2, 45], db: 23, hit: 31, mag: { skn: "極寒冰錐", cd: 60, dmg: [3, 26], db: 40, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 100 } } },   // 🔧 極寒冰錐：必中、3D26+40水魔法，freeze pbase100 → (100-MR)/2% 機率冰凍6秒
        // ===== 冥法軍訓練場 =====
        "de_necro_avenger":    { n: "黑暗復仇者", lv: 45, s: "S", beh: "主動", race: "拉斯塔巴德", e: "earth", hard: true, hp: 1056, ac: -52, mr: 55, exp: 2026, goldMin: 100, goldMax: 300, atkSpd: 1, dmg: [1, 53], db: 5, hit: 57 },
        "de_necro_warlock":    { n: "血色術士", lv: 46, s: "S", beh: "主動", race: "拉斯塔巴德", e: "earth", hard: true, hp: 1198, ac: -54, mr: 70, exp: 2117, goldMin: 110, goldMax: 300, atkSpd: 2, dmg: [2, 59], db: 30, hit: 50, mag: { skn: "黑霧", cd: 50, dmg: [4, 46], db: 35, ele: "none", alwaysHit: true } },
        "de_necro_omwarrior":  { n: "歐姆戰士", lv: 45, s: "S", beh: "主動", race: "歐姆", e: "earth", hard: true, hp: 828, ac: -50, mr: 40, exp: 2026, goldMin: 200, goldMax: 300, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49 },
        "de_necro_darklord":   { n: "闇黑君王", lv: 47, s: "S", beh: "主動", race: "拉斯塔巴德", e: "earth", hard: true, hp: 1274, ac: -55, mr: 75, exp: 2210, goldMin: 110, goldMax: 300, atkSpd: 2, dmg: [2, 60], db: 30, hit: 52, mag: { skn: "火焰氣息", cd: 70, chance: 0.5, dmg: [5, 46], db: 35, ele: "fire", alwaysHit: true } },
        "de_necro_bloodknight":{ n: "血騎士", lv: 47, s: "S", beh: "主動", race: "拉斯塔巴德", un: true, e: "earth", hp: 1274, ac: -55, mr: 65, exp: 2210, goldMin: 200, goldMax: 500, atkSpd: 1.5, dmg: [1, 77], db: 8, hit: 59, mag: { skn: "迴旋斬", cd: 50, chance: 0.4, dmg: [2, 30], db: 47, ele: "none", alwaysHit: true } },
        "de_necro_omheavy":    { n: "重裝歐姆戰士", lv: 48, s: "L", beh: "主動", race: "歐姆", e: "earth", hard: true, hp: 998, ac: -54, mr: 40, exp: 2305, goldMin: 200, goldMax: 500, atkSpd: 2, dmg: [2, 60], db: 30, hit: 53 },
        // ===== 🏛️ 格蘭肯神殿．長老之室（拉斯塔巴德新狩獵地圖）：3 一般怪 + 8 長老 BOSS（掉落待新物品建立後補；BOSS 出場節流另行實作） =====
        "de_elder_guard":     { n: "拉斯塔巴德近衛隊", lv: 48, s: "S", beh: "主動", race: "拉斯塔巴德", e: "none", hp: 500, ac: -40, mr: 30, exp: 2305, goldMin: 200, goldMax: 400, atkSpd: 3, dmg: [2, 68], db: 34, hit: 53 },
        "de_elder_captain":   { n: "拉斯塔巴德近衛隊隊長", lv: 54, s: "S", beh: "主動", race: "拉斯塔巴德", e: "fire", hp: 3500, ac: -63, mr: 60, exp: 2917, goldMin: 300, goldMax: 600, atkSpd: 1, dmg: [1, 79], db: 8, hit: 68, mag: { skn: "放射斬", cd: 90, chance: 0.5, dmg: [2, 60], db: 80, ele: "none", alwaysHit: true } },
        "de_elder_follower":  { n: "長老隨從", lv: 51, s: "S", beh: "主動", race: "拉斯塔巴德", e: "earth", hp: 1500, ac: -49, mr: 60, exp: 2602, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 72], db: 37, hit: 57, mag: { skn: "光球．闇", cd: 130, dmg: [2, 51], db: 140, ele: "none", alwaysHit: true } },
        "de_elder_kina":   { n: "長老．琪娜", lv: 78, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 16200, ac: -81, mr: 75, exp: 9612, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [4, 99], db: 100, hit: 116, mag: { skn: "迴旋鞭打", cd: 50, chance: 0.5, dmg: [4, 78], db: 230, ele: "none", alwaysHit: true }, mag2: { skn: "光球．闇", cd: 110, chance: 0.6, dmg: [4, 178], db: 100, ele: "none", alwaysHit: true } },
        "de_elder_andis":  { n: "長老．安迪斯", lv: 91, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 22426, ac: -98, mr: 88, exp: 13326, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [5, 79], db: 101, hit: 128, mag: { skn: "衝擊波動", cd: 70, chance: 0.5, dmg: [5, 150], db: 150, ele: "wind", alwaysHit: true } },
        "de_elder_batas":  { n: "長老．巴塔斯", lv: 85, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 18600, ac: -86, mr: 63, exp: 11562, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [3, 86], db: 26, hit: 123, mag: { skn: "千刃破軍", cd: 90, chance: 0.5, dmg: [6, 120], db: 120, ele: "wind", alwaysHit: true } },
        "de_elder_balos":  { n: "長老．巴洛斯", lv: 88, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 19997, ac: -89, mr: 85, exp: 12252, goldMin: 0, goldMax: 0, atkSpd: 3, dmg: [5, 90], db: 113, hit: 126, mag: { skn: "闇黑波動", cd: 90, chance: 0.5, dmg: [1, 800], db: 100, ele: "none", alwaysHit: true }, mag2: { skn: "靈魂波動", cd: 40, dmg: [1, 400], db: 0, ele: "none", alwaysHit: true } },
        "de_elder_balud":  { n: "長老．巴陸德", lv: 96, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 23626, ac: -98, mr: 100, exp: 14826, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [5, 79], db: 101, hit: 128, mag: { skn: "光球", cd: 90, chance: 0.5, dmg: [1, 800], db: 200, ele: "none", alwaysHit: true }, mag2: { skn: "靈魂波動", cd: 40, dmg: [1, 500], db: 0, ele: "none", alwaysHit: true } },
        "de_elder_ramas":  { n: "長老．拉曼斯", lv: 93, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 22382, ac: -98, mr: 81, exp: 13692, goldMin: 0, goldMax: 0, atkSpd: 1, dmg: [3, 86], db: 26, hit: 128, mag: { skn: "火焰爆發", cd: 110, chance: 0.5, dmg: [1, 900], db: 100, ele: "fire", alwaysHit: true } },
        "de_elder_taimas": { n: "長老．泰瑪斯", lv: 90, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 21773, ac: -94, mr: 89, exp: 12962, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [5, 79], db: 101, hit: 128, mag: { skn: "黑暗流星雨", cd: 110, chance: 0.4, dmg: [1, 1000], db: 200, ele: "fire", alwaysHit: true } },
        "de_elder_adiel":  { n: "長老．艾迪爾", lv: 80, s: "L", beh: "主動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 17746, ac: -85, mr: 75, exp: 10242, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [4, 99], db: 100, hit: 118, mag: { skn: "光球．闇", cd: 110, chance: 0.5, dmg: [4, 160], db: 100, ele: "none", alwaysHit: true } },
        // ===== 🌑 黑暗妖精聖地（依《黑暗妖精聖地.md》·v3.3.33）：7 新一般怪＋2 頭目（重裝歐姆戰士沿用 de_necro_omheavy）=====
        "sanct_hellslave":      { n: "地獄奴隸", lv: 48, s: "S", beh: "主動", race: "異界生物", e: "earth", hp: 900, ac: -77, mr: 80, exp: 2305, goldMin: 150, goldMax: 400, atkSpd: 2, dmg: [2, 60], db: 30, hit: 53 },   // 聖地版（拉斯塔巴德訓練場同名孤兒定義 de_train_hellslave 已刪·地獄奴隸僅此一筆）
        "sanct_cursed_fighter": { n: "受詛咒的黑暗妖精鬥士", lv: 46, s: "S", beh: "主動", race: "黑暗妖精", e: "fire", hp: 800, ac: -43, mr: 60, exp: 2117, goldMin: 150, goldMax: 400, atkSpd: 1, dmg: [1, 55], db: 6, hit: 58, mag: { skn: "衝擊之暈", cd: 90, chance: 0.3, type: "stun", pbase: 150 } },   // 每9秒判定30%·全體暈眩(150-MR)/2%
        "sanct_cursed_mage":    { n: "受詛咒的黑暗妖精法師", lv: 48, s: "S", beh: "主動", race: "黑暗妖精", e: "wind", hp: 750, ac: -38, mr: 120, exp: 2305, goldMin: 150, goldMax: 400, atkSpd: 2, dmg: [2, 60], db: 30, hit: 53, mag: { skn: "黑暗落雷", cd: 60, dmg: [3, 50], db: 40, ele: "wind", alwaysHit: true } },
        "sanct_cursed_knight":  { n: "受詛咒的黑暗妖精騎士", lv: 50, s: "S", beh: "主動", race: "黑暗妖精", e: "earth", hp: 1100, ac: -52, mr: 50, exp: 2501, goldMin: 180, goldMax: 420, atkSpd: 1, dmg: [1, 70], db: 7, hit: 63, mag: { skn: "黑暗地裂斬", cd: 80, dmg: [3, 60], db: 50, ele: "earth", alwaysHit: true } },
        "sanct_scavenger":      { n: "食腐獸", lv: 50, s: "S", beh: "主動", race: "異界生物", e: "none", hp: 1500, ac: -50, mr: 50, exp: 2501, goldMin: 180, goldMax: 420, atkSpd: 1, dmg: [1, 70], db: 7, hit: 63, mag: { skn: "腐蝕毒液", cd: 90, type: "poison", pbase: 200, d: 20, tick: 3, dur: 12 } },
        "sanct_tethys":         { n: "特提斯", lv: 52, s: "L", beh: "主動", race: "異界生物", e: "none", hp: 1700, ac: -55, mr: 75, exp: 2705, goldMin: 180, goldMax: 420, atkSpd: 2, dmg: [2, 72], db: 37, hit: 57, mag: { skn: "震裂踏擊", cd: 90, dmg: [2, 50], db: 50, ele: "earth", alwaysHit: true } },   // 震裂踏擊已在 MOB_PARTY_AOE_SKILLS
        "sanct_wyvern":         { n: "翼龍", lv: 54, s: "L", beh: "主動", race: "飛龍", e: "none", hp: 2000, ac: -61, mr: 100, exp: 2917, goldMin: 200, goldMax: 450, atkSpd: 1.5, dmg: [1, 84], db: 9, hit: 66, mag: { skn: "龍捲風", cd: 70, dmg: [2, 50], db: 60, ele: "wind", alwaysHit: true } },
        // 吉爾塔斯：一般攻擊＝龍的2倍傷害(基準 法利昂 5D79+101 ×2)；血壁空間＝type:'reflectwall'(js/04 隨機 近/遠/魔法反射 10 秒·反彈同等傷害給攻擊方)
        "sanct_giltas": { n: "吉爾塔斯", lv: 99, s: "L", beh: "主動", race: "異界生物", boss: true, hard: true, noDmgCurve: true, e: "none", hp: 440000, ac: -99, mr: 300, exp: 9802, goldMin: 50000, goldMax: 200000, atkSpd: 2, dmg: [5, 158], db: 403, hit: 132, rageHpPct: 0.30, rageHitMult: 1.20, rageDmgMult: 1.20, mag: { skn: "沙塵暴", cd: 70, chance: 0.15, type: "silence", pbase: 350 }, mag2: { skn: "岩漿流星雨", cd: 130, dmg: [10, 150], db: 500, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 300, d: 200, tick: 3, dur: 18 } }, mag3: { skn: "毒氣風暴", cd: 120, type: "poison", pbase: 350, d: 200, tick: 3, dur: 18 }, mag4: { skn: "血壁空間", cd: 160, chance: 0.5, type: "reflectwall", dur: 10 } },
        "sanct_dantes": { n: "真‧死亡騎士 冥皇丹特斯", lv: 99, s: "S", beh: "主動", race: "不死", un: true, boss: true, hard: true, noDmgCurve: true, e: "none", hp: 150000, ac: -120, mr: 200, exp: 9802, goldMin: 50000, goldMax: 200000, atkSpd: 0.25, dmg: [2, 40], db: 39, hit: 132, rageHpPct: 0.30, rageHitMult: 1.20, rageDmgMult: 1.20, mag: { skn: "吸血鬼之吻", cd: 70, chance: 0.2, dmg: [5, 150], db: 100, ele: "none", alwaysHit: true, vampFull: true }, mag2: { skn: "地面震裂", cd: 130, dmg: [6, 150], db: 500, ele: "none", alwaysHit: true }, mag3: { skn: "集體衝暈", cd: 120, dmg: [3, 150], db: 300, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 300 } } },
        // ===== 軍王之室 BOSS（法令／冥法／暗殺） =====
        "de_king_laia":   { n: "法令軍王蕾雅", lv: 65, s: "S", beh: "被動", race: "拉斯塔巴德", e: "earth", boss: true, hard: true, hp: 15070, ac: -57, mr: 80, exp: 4226, goldMin: 1250, goldMax: 4000, atkSpd: 2, dmg: [4, 86], db: 87, hit: 101, mag: { skn: "冰裂術", cd: 50, chance: 0.5, dmg: [8, 30], db: 128, ele: "water", alwaysHit: true, ext_freeze: 200, extUnfreeze: true, sec: { type: "freeze", pbase: 200 } }, mag2: { skn: "高級治癒術", cd: 130, chance: 0.7, type: "heal_allies", healDice: [2, 200] } },
        "de_king_heruby": { n: "冥法軍王海露拜", lv: 70, s: "L", beh: "被動", race: "拉斯塔巴德", e: "earth", boss: true, hard: true, hp: 22672, ac: -78, mr: 85, exp: 4901, goldMin: 2250, goldMax: 5000, atkSpd: 2, dmg: [4, 92], db: 93, hit: 107, mag: { skn: "流星雨", cd: 110, dmg: [8, 50], db: 128, ele: "fire", alwaysHit: true }, mag2: { skn: "黑暗流星雨", cd: 130, chance: 0.5, dmg: [10, 100], db: 250, ele: "none", alwaysHit: true } },
        "de_king_slayer": { n: "暗殺軍王史雷佛", lv: 61, s: "L", beh: "被動", race: "拉斯塔巴德", e: "none", boss: true, hard: true, hp: 16202, ac: -71, mr: 75, exp: 3722, goldMin: 1250, goldMax: 4000, atkSpd: 1, dmg: [3, 84], db: 25, hit: 89, mag: { skn: "放射斬", cd: 50, chance: 0.2, dmg: [4, 100], db: 250, ele: "none", alwaysHit: true } },
        // ===== 🗼 傲慢之塔 怪物 =====
        "pride_stairs":     { n: "往上層的樓梯", lv: 1, s: "L", beh: "被動", race: "建築", boss: true, noAutoTeleport: true, e: "none", hp: 1, ac: 10, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 60, dmg: [1, 1], db: 0, hit: 0 },   // 🗼 攀登用：擊敗即前往上一層（不會攻擊；不觸發自動瞬移）
        "pride_lamia":      { n: "變種蛇女", lv: 32, s: "L", beh: "主動", race: "蛇女", e: "water", hp: 330, ac: -10, mr: 15, exp: 1025, goldMin: 163, goldMax: 265, atkSpd: 2, dmg: [2, 45], db: 23, hit: 31 },
        "pride_ungoliant":  { n: "變種楊果里恩", lv: 33, s: "L", beh: "主動", race: "蜘蛛", e: "earth", hp: 370, ac: -13, mr: 20, exp: 1090, goldMin: 162, goldMax: 266, atkSpd: 1, dmg: [1, 50], db: 5, hit: 40, mag: { skn: "烈毒", cd: 50, type: "poison", pbase: 150, d: 30, tick: 5, dur: 20 } },
        "pride_medusa":     { n: "梅杜莎", lv: 36, s: "S", beh: "主動", race: "梅杜莎", e: "none", hp: 420, ac: -16, mr: 50, exp: 1297, goldMin: 171, goldMax: 280, atkSpd: 2, dmg: [2, 51], db: 26, hit: 37, mag: { skn: "木乃伊的詛咒", cd: 70, type: "stone", pbase: 150 } },
        "pride_chimera":    { n: "奇美拉", lv: 39, s: "S", beh: "主動", race: "奇美拉", e: "none", hp: 550, ac: -25, mr: 35, exp: 1522, goldMin: 171, goldMax: 280, atkSpd: 2, dmg: [2, 55], db: 28, hit: 41, mag: { skn: "烈毒", cd: 50, type: "poison", pbase: 150, d: 30, tick: 5, dur: 20 } },
        "pride_jenis":      { n: "扭曲的潔尼斯女王", lv: 60, s: "L", beh: "主動", race: "惡魔", boss: true, hard: true, e: "none", hp: 4000, ac: -50, mr: 70, exp: 3601, goldMin: 500, goldMax: 1000, atkSpd: 2, dmg: [4, 80], db: 81, hit: 86, mag: { skn: "劇毒", cd: 50, type: "poison", pbase: 200, d: 50, tick: 3, dur: 18 }, mag2: { skn: "麻痺蜘蛛網", cd: 70, chance: 0.3, type: "paralyze", pbase: 150 }, mag3: { skn: "劇毒龍捲風", cd: 130, chance: 0.3, type: "poison", pbase: 200, d: 80, tick: 3, dur: 18 } },
        // ----- 傲慢之塔 11~20 樓 -----
        "pride_wolf":       { n: "魔狼", lv: 40, s: "L", beh: "主動", race: "魔狼", e: "fire", hp: 600, ac: -30, mr: 35, exp: 1601, goldMin: 161, goldMax: 264, atkSpd: 1, dmg: [1, 53], db: 5, hit: 50 },
        "pride_mimic":      { n: "邪惡密密", lv: 38, s: "S", beh: "主動", race: "魔法生物", hard: true, e: "none", hp: 500, ac: -2, mr: 40, exp: 1445, goldMin: 155, goldMax: 253, atkSpd: 1.5, dmg: [1, 63], db: 6, hit: 47 },
        "pride_beholder":   { n: "邪惡多眼怪", lv: 39, s: "L", beh: "主動", race: "眼魔", e: "wind", hp: 540, ac: -20, mr: 55, exp: 1522, goldMin: 158, goldMax: 260, atkSpd: 2, dmg: [2, 55], db: 28, hit: 41, mag: { skn: "木乃伊的詛咒", cd: 70, type: "stone", pbase: 150 } },
        "pride_deathsword": { n: "死亡之劍", lv: 37, s: "S", beh: "主動", race: "魔法生物", e: "water", hp: 380, ac: -43, mr: 40, exp: 1370, goldMin: 153, goldMax: 244, atkSpd: 1, dmg: [1, 52], db: 5, hit: 46 },
        "pride_phantom_boss": { n: "不幸的幻象眼魔", lv: 60, s: "S", beh: "主動", race: "眼魔", boss: true, hard: true, e: "none", hp: 5000, ac: -53, mr: 75, exp: 3601, goldMin: 500, goldMax: 1000, atkSpd: 2, dmg: [4, 80], db: 81, hit: 86, mag: { skn: "木乃伊的詛咒", cd: 70, type: "stone", pbase: 200 }, mag2: { skn: "幻象光線", cd: 50, chance: 0.3, dmg: [8, 40], db: 143, ele: "none", alwaysHit: true }, mag3: { skn: "集體相消", cd: 130, chance: 0.3, type: "dispel" } },
        // ----- 傲慢之塔 21~30 樓 -----
        "pride_fireegg":    { n: "恐怖的火炎蛋", lv: 37, s: "S", beh: "主動", race: "元素", e: "none", hp: 500, ac: -36, mr: 40, exp: 1370, goldMin: 153, goldMax: 244, atkSpd: 2, dmg: [2, 52], db: 27, hit: 38 },
        "pride_nightmare":  { n: "恐怖夢魘", lv: 40, s: "L", beh: "主動", race: "惡魔", e: "none", hp: 450, ac: -42, mr: 80, exp: 1601, goldMin: 161, goldMax: 264, atkSpd: 1.5, dmg: [1, 66], db: 7, hit: 50 },
        "pride_hellhound":  { n: "恐怖的地獄犬", lv: 43, s: "S", beh: "主動", race: "惡魔", e: "none", hp: 350, ac: -35, mr: 25, exp: 1850, goldMin: 168, goldMax: 274, atkSpd: 2, dmg: [2, 59], db: 30, hit: 46, mag: { skn: "火焰噴吐", cd: 70, dmg: [4, 40], db: 43, ele: "fire", alwaysHit: true } },
        "pride_imp":        { n: "小惡魔", lv: 44, s: "S", beh: "主動", race: "惡魔", e: "earth", hp: 420, ac: -38, mr: 80, exp: 1937, goldMin: 168, goldMax: 274, atkSpd: 2, dmg: [2, 59], db: 30, hit: 48, mag: { skn: "火焰之陣", cd: 70, dmg: [4, 60], db: 13, ele: "fire", alwaysHit: true } },
        "pride_ifrit":      { n: "恐怖的伊弗利特", lv: 46, s: "L", beh: "主動", race: "惡魔", e: "fire", hp: 1100, ac: -28, mr: 40, exp: 2117, goldMin: 182, goldMax: 293, atkSpd: 1.5, dmg: [1, 75], db: 8, hit: 58, mag: { skn: "火之矛", cd: 70, dmg: [2, 46], db: 83, ele: "fire", alwaysHit: true } },
        "pride_vampire_boss": { n: "恐怖的吸血鬼", lv: 60, s: "S", beh: "主動", race: "吸血鬼", boss: true, hard: true, e: "earth", hp: 6000, ac: -53, mr: 85, exp: 3601, goldMin: 500, goldMax: 1000, atkSpd: 2, dmg: [4, 80], db: 81, hit: 86, mag: { skn: "吸血鬼之吻", cd: 70, chance: 0.4, dmg: [8, 30], db: 60, ele: "none", alwaysHit: true, vampFull: true }, mag2: { skn: "夜魔飛襲", cd: 150, dmg: [1, 400], db: 243, ele: "none", alwaysHit: true }, mag3: { skn: "血夜月彎刀", cd: 130, chance: 0.2, dmg: [1, 100], db: 143, ele: "none", alwaysHit: true, sec: { type: "bleed", d: 50, tick: 3, dur: 18, pbase: 200 } } },
        // ----- 傲慢之塔 31~40 樓 -----
        "pride_skel_axe":    { n: "殘暴的骷髏斧兵", lv: 39, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 500, ac: -30, mr: 25, exp: 1522, goldMin: 161, goldMax: 264, atkSpd: 1, dmg: [1, 53], db: 5, hit: 49 },
        "pride_ghoul2":      { n: "殘暴的食屍鬼", lv: 42, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 550, ac: -35, mr: 45, exp: 1764, goldMin: 168, goldMax: 274, atkSpd: 2, dmg: [2, 59], db: 30, hit: 45 },
        "pride_skel_spear":  { n: "殘暴的骷髏槍兵", lv: 39, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 450, ac: -30, mr: 35, exp: 1522, goldMin: 161, goldMax: 264, atkSpd: 1.5, dmg: [1, 64], db: 7, hit: 49 },
        "pride_sparto":      { n: "殘暴的史巴托", lv: 42, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 550, ac: -38, mr: 40, exp: 1764, goldMin: 168, goldMax: 274, atkSpd: 2, dmg: [2, 59], db: 30, hit: 45 },
        "pride_skel_archer": { n: "殘暴的骷髏神射手", lv: 45, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 650, ac: -38, mr: 45, exp: 2026, goldMin: 182, goldMax: 288, atkSpd: 1, dmg: [1, 53], db: 5, hit: 57 },
        "pride_skel_fighter":{ n: "殘暴的骷髏鬥士", lv: 45, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 700, ac: -40, mr: 45, exp: 2026, goldMin: 182, goldMax: 288, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49 },
        "pride_zombie_king": { n: "死亡的殭屍王", lv: 62, s: "L", beh: "主動", race: "殭屍", boss: true, hard: true, e: "none", hp: 8000, ac: -58, mr: 50, exp: 3845, goldMin: 9000, goldMax: 16200, atkSpd: 3, dmg: [4, 82], db: 83, hit: 92, mag: { skn: "邪靈之氣", cd: 70, chance: 0.5, dmg: [6, 50], db: 160, ele: "none", alwaysHit: true }, mag2: { skn: "腐蝕之血", cd: 130, chance: 0.5, dmg: [1, 100], db: 153, ele: "none", alwaysHit: true, sec: { type: "poison", d: 50, tick: 3, dur: 18, pbase: 200 } } },
        // ----- 傲慢之塔 41~50 樓 -----
        "pride_drake":       { n: "幼龍", lv: 45, s: "L", beh: "主動", race: "龍", hard: true, e: "none", hp: 800, ac: -45, mr: 80, exp: 2026, goldMin: 180, goldMax: 305, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49, mag: { skn: "火焰噴吐", cd: 70, chance: 0.7, dmg: [4, 60], db: 63, ele: "fire", alwaysHit: true } },
        "pride_flamesoul_r": { n: "火焰之靈魂(紅)", lv: 45, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 500, ac: -45, mr: 45, exp: 2026, goldMin: 180, goldMax: 305, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49 },
        "pride_flamesoul_b": { n: "火焰之靈魂(藍)", lv: 46, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 500, ac: -48, mr: 45, exp: 2117, goldMin: 182, goldMax: 294, atkSpd: 2, dmg: [2, 59], db: 30, hit: 50 },
        "pride_irongolem":   { n: "恐怖的鋼鐵高崙", lv: 44, s: "L", beh: "主動", race: "高崙", hard: true, e: "none", hp: 800, ac: -37, mr: 35, exp: 1937, goldMin: 152, goldMax: 335, atkSpd: 3, dmg: [2, 62], db: 32, hit: 48 },
        "pride_flamemage":   { n: "火焰之魔法師", lv: 44, s: "S", beh: "主動", race: "長老", e: "fire", hp: 450, ac: -32, mr: 90, exp: 1937, goldMin: 144, goldMax: 285, atkSpd: 2, dmg: [2, 59], db: 30, hit: 48, mag: { skn: "燃燒的火球", cd: 50, chance: 0.5, dmg: [3, 60], db: 63, ele: "fire", alwaysHit: true } },
        "pride_bonedragon":  { n: "骨龍", lv: 47, s: "L", beh: "主動", race: "龍", hard: true, e: "none", hp: 720, ac: -48, mr: 90, exp: 2210, goldMin: 224, goldMax: 368, atkSpd: 2, dmg: [2, 60], db: 30, hit: 52, mag: { skn: "寒冰噴吐", cd: 50, chance: 0.7, dmg: [4, 60], db: 73, ele: "none", alwaysHit: true } },
        "pride_panther_boss": { n: "地獄的黑豹", lv: 65, s: "L", beh: "主動", race: "野獸", boss: true, hard: true, e: "none", hp: 8400, ac: -65, mr: 75, exp: 4226, goldMin: 10000, goldMax: 20000, atkSpd: 1, dmg: [3, 84], db: 26, hit: 101, mag: { skn: "衝擊之暈", cd: 70, chance: 0.2, dmg: [4, 50], db: 160, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 250 } }, mag2: { skn: "沉睡打擊", cd: 70, chance: 0.2, dmg: [2, 100], db: 153, ele: "none", alwaysHit: true, sec: { type: "sleep", pbase: 250 } } },
        // ----- 傲慢之塔 51~60 樓 -----
        "pride_curse_zombie":  { n: "受詛咒的妖魔殭屍", lv: 42, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 800, ac: -60, mr: 25, exp: 1765, goldMin: 185, goldMax: 221, atkSpd: 2, dmg: [2, 59], db: 30, hit: 45, mag: { skn: "烈毒", cd: 50, type: "poison", pbase: 150, d: 30, tick: 5, dur: 20 } },
        "pride_curse_soldier": { n: "受詛咒的艾爾摩士兵", lv: 47, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 700, ac: -61, mr: 30, exp: 2210, goldMin: 210, goldMax: 305, atkSpd: 2, dmg: [2, 60], db: 30, hit: 52 },
        "pride_curse_mage":    { n: "受詛咒的艾爾摩法師", lv: 45, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 300, ac: -62, mr: 90, exp: 2026, goldMin: 185, goldMax: 221, atkSpd: 3, dmg: [2, 63], db: 32, hit: 49, mag: { skn: "冰錐", cd: 30, dmg: [2, 60], db: 42, ele: "water", alwaysHit: true }, mag2: { skn: "冰矛圍籬", cd: 50, chance: 0.4, dmg: [5, 50], db: 30, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 150 } } },
        "pride_curse_general": { n: "受詛咒的艾爾摩將軍", lv: 50, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 750, ac: -63, mr: 40, exp: 2501, goldMin: 254, goldMax: 335, atkSpd: 3, dmg: [2, 71], db: 36, hit: 56 },
        "pride_mummy_king":    { n: "不死的木乃伊王", lv: 65, s: "L", beh: "主動", race: "殭屍", boss: true, hard: true, e: "none", hp: 10000, ac: -60, mr: 99, exp: 4226, goldMin: 10000, goldMax: 20000, atkSpd: 1, dmg: [3, 84], db: 26, hit: 101, mag: { skn: "巨石爆裂", cd: 70, chance: 0.25, dmg: [6, 50], db: 160, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 150 } }, mag2: { skn: "地面障礙", cd: 120, type: "slowatk", pbase: 250, dur: 8 }, mag3: { skn: "鋼鐵防護", type: "self_buff", buffKind: "acguard", cd: 150, chance: 0.5, acDown: 7, dur: 30 } },
        // ----- 傲慢之塔 61~70 樓 -----
        "pride_dark_lycan":  { n: "暗黑萊肯", lv: 44, s: "S", beh: "主動", race: "狼人", isWolf: true, e: "wind", hp: 750, ac: -64, mr: 45, exp: 1937, goldMin: 185, goldMax: 333, atkSpd: 1.5, dmg: [1, 72], db: 7, hit: 55 },
        "pride_ice_tiger":   { n: "冷酷冰原老虎", lv: 48, s: "L", beh: "主動", race: "野獸", e: "none", hp: 850, ac: -64, mr: 20, exp: 2305, goldMin: 198, goldMax: 320, atkSpd: 1, dmg: [1, 55], db: 6, hit: 60 },
        "pride_flame_beast": { n: "火焰烈炎獸", lv: 46, s: "L", beh: "主動", race: "惡魔", e: "fire", hp: 830, ac: -65, mr: 55, exp: 2117, goldMin: 255, goldMax: 422, atkSpd: 2, dmg: [2, 59], db: 30, hit: 50, mag: { skn: "火焰噴吐", cd: 30, dmg: [2, 46], db: 46, ele: "fire", alwaysHit: true } },
        "pride_flame_atki":  { n: "火焰阿西塔基奧", lv: 51, s: "L", beh: "主動", race: "阿西塔基奧", e: "fire", hp: 900, ac: -65, mr: 50, exp: 2602, goldMin: 285, goldMax: 411, atkSpd: 2, dmg: [2, 72], db: 37, hit: 57 },
        "pride_iris_boss":   { n: "冷酷的艾莉絲", lv: 65, s: "L", beh: "主動", race: "惡魔", boss: true, hard: true, e: "none", hp: 8200, ac: -75, mr: 99, exp: 4226, goldMin: 10000, goldMax: 20000, atkSpd: 0.5, dmg: [2, 68], db: 14, hit: 101, mag: { skn: "集體衝暈", cd: 70, chance: 0.15, dmg: [2, 50], db: 163, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 200 } }, mag2: { skn: "水氣爆裂", cd: 120, dmg: [3, 200], db: 63, ele: "water", alwaysHit: true }, mag3: { skn: "冰錐流星雨", cd: 110, chance: 0.15, dmg: [5, 200], db: 63, ele: "water", alwaysHit: true } },
        // ----- 傲慢之塔 71~80 樓 -----
        "pride_dark_blackknight":    { n: "暗黑黑騎士", lv: 45, s: "S", beh: "主動", race: "黑騎士", hard: true, e: "none", hp: 900, ac: -67, mr: 65, exp: 2026, goldMin: 285, goldMax: 356, atkSpd: 1.5, dmg: [1, 74], db: 7, hit: 57 },
        "pride_dark_flamewarrior":   { n: "暗黑火焰戰士", lv: 50, s: "S", beh: "主動", race: "亞人", e: "fire", hp: 950, ac: -64, mr: 30, exp: 2501, goldMin: 233, goldMax: 386, atkSpd: 2, dmg: [2, 71], db: 36, hit: 56 },
        "pride_dark_flamearcher":    { n: "暗黑火焰弓箭手", lv: 48, s: "S", beh: "主動", race: "亞人", e: "none", hp: 800, ac: -58, mr: 45, exp: 2305, goldMin: 221, goldMax: 354, atkSpd: 1, dmg: [1, 55], db: 6, hit: 60 },
        "pride_dark_succubus_queen": { n: "暗黑思克巴女皇", lv: 53, s: "S", beh: "主動", race: "思克巴", e: "none", hp: 1800, ac: -70, mr: 80, exp: 2810, goldMin: 288, goldMax: 415, atkSpd: 1.8, dmg: [1, 87], db: 9, hit: 67, mag: { skn: "吸血鬼之吻", cd: 80, dmg: [2, 33], db: 61, ele: "none", alwaysHit: true, vamp: [1, 53] } },
        "pride_vander_boss":         { n: "闇黑的騎士范德", lv: 75, s: "L", beh: "主動", race: "亞人", boss: true, hard: true, e: "none", hp: 10000, ac: -70, mr: 80, exp: 5626, goldMin: 10000, goldMax: 20000, atkSpd: 1, dmg: [3, 85], db: 26, hit: 113, mag: { skn: "單刀斬", type: "extra_attack", cd: 50, chance: 0.2 }, mag2: { skn: "雙刀斬", type: "multi_attack", cd: 70, times: 2 }, mag3: { skn: "闇黑波動", cd: 110, chance: 0.2, dmg: [3, 200], db: 187, ele: "none", alwaysHit: true } },
        // ----- 傲慢之塔 81~90 樓 -----
        "pride_proud_jenis":        { n: "傲慢的潔尼斯女王", lv: 53, s: "L", beh: "主動", race: "惡魔", e: "none", hp: 1800, ac: -65, mr: 100, exp: 2810, goldMin: 432, goldMax: 681, atkSpd: 2, dmg: [2, 75], db: 38, hit: 59, mag: { skn: "劇毒", cd: 50, type: "poison", pbase: 200, d: 50, tick: 3, dur: 18 } },
        "pride_small_phantom":      { n: "小幻象眼魔", lv: 54, s: "L", beh: "主動", race: "眼魔", e: "none", hp: 1600, ac: -63, mr: 99, exp: 2917, goldMin: 454, goldMax: 722, atkSpd: 2, dmg: [2, 76], db: 39, hit: 61, mag: { skn: "木乃伊的詛咒", cd: 70, type: "stone", pbase: 200 }, mag2: { skn: "幻象光線", cd: 50, chance: 0.3, dmg: [2, 40], db: 143, ele: "none", alwaysHit: true } },
        "pride_marcus_vampire":     { n: "馬昆斯吸血鬼", lv: 56, s: "S", beh: "主動", race: "吸血鬼", e: "earth", hp: 2500, ac: -63, mr: 65, exp: 3137, goldMin: 481, goldMax: 760, atkSpd: 2, dmg: [2, 91], db: 46, hit: 63, mag: { skn: "吸血鬼之吻", cd: 70, dmg: [2, 50], db: 51, ele: "none", alwaysHit: true, vamp: [1, 56] } },
        "pride_terror_zombie_king": { n: "恐怖的殭屍王", lv: 55, s: "L", beh: "主動", race: "殭屍", e: "earth", hp: 3500, ac: -68, mr: 40, exp: 3026, goldMin: 451, goldMax: 802, atkSpd: 3, dmg: [2, 90], db: 45, hit: 62, mag: { skn: "腐蝕之血", cd: 130, chance: 0.5, dmg: [1, 50], db: 55, ele: "none", alwaysHit: true, sec: { type: "poison", pbase: 150, d: 50, tick: 3, dur: 18 } } },
        "pride_lich_boss":          { n: "不滅的巫妖", lv: 80, s: "L", beh: "主動", race: "巫妖", boss: true, hard: true, e: "none", hp: 12000, ac: -75, mr: 99, exp: 6401, goldMin: 10000, goldMax: 20000, atkSpd: 2, dmg: [4, 99], db: 100, hit: 118, mag: { skn: "闇黑波動", cd: 70, chance: 0.3, dmg: [2, 400], db: 180, ele: "none", alwaysHit: true }, mag2: { skn: "靈光箭", cd: 50, dmg: [2, 200], db: 150, ele: "none", alwaysHit: true }, mag3: { skn: "審判之雷", cd: 130, chance: 0.2, dmg: [5, 300], db: 1, ele: "wind", alwaysHit: true } },
        // ----- 傲慢之塔 91~100 樓 -----
        "pride_earth_king":      { n: "土精靈王", lv: 60, s: "L", beh: "主動", race: "元素", e: "earth", hp: 2500, ac: -66, mr: 50, exp: 3601, goldMin: 600, goldMax: 1200, atkSpd: 2, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "巨石之擊", cd: 70, dmg: [1, 100], db: 40, ele: "earth", alwaysHit: true, sec: { type: "stun", pbase: 150 } }, mag2: { skn: "震裂術", cd: 80, chance: 0.5, dmg: [4, 40], db: 140, ele: "earth", alwaysHit: true } },
        "pride_water_king":      { n: "水精靈王", lv: 60, s: "L", beh: "主動", race: "元素", e: "water", hp: 2500, ac: -66, mr: 50, exp: 3601, goldMin: 600, goldMax: 1200, atkSpd: 2, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "水之矛", cd: 70, dmg: [1, 100], db: 40, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 150 } }, mag2: { skn: "水柱", cd: 80, chance: 0.5, dmg: [4, 40], db: 140, ele: "water", alwaysHit: true } },
        "pride_wind_king":       { n: "風精靈王", lv: 60, s: "L", beh: "主動", race: "元素", e: "wind", hp: 2500, ac: -66, mr: 50, exp: 3601, goldMin: 600, goldMax: 1200, atkSpd: 1, dmg: [1, 88], db: 9, hit: 76, mag: { skn: "龍捲風", cd: 90, dmg: [3, 100], db: 40, ele: "wind", alwaysHit: true } },
        "pride_fire_king":       { n: "火精靈王", lv: 60, s: "L", beh: "主動", race: "元素", e: "fire", hp: 2500, ac: -66, mr: 50, exp: 3601, goldMin: 600, goldMax: 1200, atkSpd: 3, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "爆炎的火球", cd: 130, dmg: [3, 100], db: 90, ele: "fire", alwaysHit: true } },
        "pride_iris_mob":        { n: "艾莉絲", lv: 55, s: "S", beh: "主動", race: "惡魔", e: "none", hp: 2500, ac: -70, mr: 80, exp: 3026, goldMin: 550, goldMax: 1200, atkSpd: 1, dmg: [1, 87], db: 9, hit: 70, mag: { skn: "龍捲風", cd: 130, dmg: [1, 150], db: 190, ele: "wind", alwaysHit: true } },
        "pride_mummy_king_mob":  { n: "木乃伊王", lv: 58, s: "L", beh: "主動", race: "殭屍", e: "earth", hp: 4000, ac: -55, mr: 80, exp: 3365, goldMin: 550, goldMax: 1200, atkSpd: 3, dmg: [2, 94], db: 48, hit: 66, mag: { skn: "木乃伊的詛咒", cd: 90, type: "stone", pbase: 150 } },
        "pride_vander_mob":      { n: "騎士范德", lv: 60, s: "S", beh: "主動", race: "亞人", e: "none", hp: 5000, ac: -65, mr: 55, exp: 3601, goldMin: 600, goldMax: 1200, atkSpd: 1, dmg: [1, 88], db: 9, hit: 76, mag: { skn: "震裂術", cd: 90, chance: 0.5, dmg: [4, 40], db: 100, ele: "earth", alwaysHit: true } },
        "pride_reaper_boss":     { n: "邪惡的鐮刀死神", lv: 80, s: "L", beh: "主動", race: "死神", boss: true, hard: true, e: "none", hp: 16000, ac: -80, mr: 80, exp: 6401, goldMin: 10000, goldMax: 20000, atkSpd: 1.5, dmg: [4, 93], db: 38, hit: 118, mag: { skn: "闇黑波動", cd: 70, chance: 0.2, dmg: [5, 400], db: 399, ele: "none", alwaysHit: true }, mag2: { skn: "鐮刀波動", type: "extra_attack", cd: 50 }, mag3: { skn: "鐮刀劍氣斬", type: "multi_attack", cd: 130, chance: 0.2, times: 9, atkDmg: [3, 70], atkDb: 99 } },
        // ===== 🔥 50級試煉擴充：精靈墓穴 =====
        "elf_earthfang":  { n: "地之牙", lv: 40, s: "S", beh: "被動", race: "元素", e: "earth", hp: 1200, ac: -30, mr: 20, exp: 1601, goldMin: 265, goldMax: 429, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43, mag: { skn: "地獄之牙", cd: 70, dmg: [3, 40], db: 88, ele: "earth", alwaysHit: true } },
        "elf_windfang":   { n: "風之牙", lv: 40, s: "S", beh: "被動", race: "元素", e: "wind", hp: 1200, ac: -30, mr: 20, exp: 1601, goldMin: 265, goldMax: 429, atkSpd: 1, dmg: [1, 53], db: 5, hit: 50, mag: { skn: "風刃", cd: 50, dmg: [5, 20], db: 78, ele: "wind", alwaysHit: true } },
        "elf_waterfang":  { n: "水之牙", lv: 40, s: "S", beh: "被動", race: "元素", e: "water", hp: 1200, ac: -30, mr: 20, exp: 1601, goldMin: 265, goldMax: 429, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43, mag: { skn: "冰錐", cd: 60, dmg: [4, 20], db: 98, ele: "water", alwaysHit: true } },
        "elf_firefang":   { n: "火之牙", lv: 40, s: "S", beh: "被動", race: "元素", e: "fire", hp: 1200, ac: -30, mr: 20, exp: 1601, goldMin: 265, goldMax: 429, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43, mag: { skn: "火箭", cd: 30, dmg: [2, 20], db: 68, ele: "fire", alwaysHit: true } },
        "elf_waterlord":  { n: "水靈之主", lv: 45, s: "S", beh: "被動", race: "元素", e: "water", hp: 1400, ac: -40, mr: 35, exp: 2026, goldMin: 265, goldMax: 429, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49, mag: { skn: "冰錐", cd: 50, dmg: [5, 20], db: 98, ele: "water", alwaysHit: true } },
        // ===== 🏝️ 遺忘之島：傳送門（擊敗即進入遺忘之島；不會攻擊、不觸發自動瞬移）=====
        "obli_portal":      { n: "遺忘之島", lv: 1, s: "L", beh: "被動", race: "建築", boss: true, noAutoTeleport: true, e: "none", hp: 1, ac: 10, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 60, dmg: [1, 1], db: 0, hit: 0 },
        // ===== 🏝️ 遺忘之島：怪物 =====
        "obli_croc":        { n: "遺忘之島鱷魚", lv: 20, s: "S", beh: "主動", race: "動物", e: "water", hp: 150, ac: -14, mr: 5, exp: 401, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "obli_werewolf":    { n: "遺忘之島狼人", lv: 34, s: "S", beh: "主動", race: "狼人", e: "wind", hp: 180, ac: -20, mr: 10, exp: 1157, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 48], db: 24, hit: 34 },
        "obli_sharlob":     { n: "遺忘之島夏洛伯", lv: 34, s: "L", beh: "主動", race: "蜘蛛", e: "none", hp: 170, ac: -15, mr: 12, exp: 1157, goldMin: 10, goldMax: 100, atkSpd: 1, dmg: [1, 50], db: 5, hit: 41 },
        "obli_arian":       { n: "遺忘之島亞力安", lv: 47, s: "L", beh: "主動", race: "亞力安", e: "earth", hp: 600, ac: -25, mr: 30, exp: 2210, goldMin: 10, goldMax: 100, atkSpd: 1.2, dmg: [1, 64], db: 6, hit: 59, mag: { skn: "冷凍光線", type: "stone", cd: 70, pbase: 200 } },
        "obli_darkelf":     { n: "遺忘之島黑暗精靈", lv: 35, s: "S", beh: "主動", race: "黑暗精靈", e: "earth", hp: 350, ac: -29, mr: 30, exp: 1226, goldMin: 10, goldMax: 100, atkSpd: 1.5, dmg: [1, 57], db: 6, hit: 43, mag: { skn: "龍捲風", cd: 70, dmg: [1, 70], db: 70, ele: "wind" } },
        "obli_bear":        { n: "遺忘之島歐熊", lv: 35, s: "L", beh: "主動", race: "動物", e: "earth", hp: 250, ac: -21, mr: 10, exp: 1226, goldMin: 10, goldMax: 100, atkSpd: 3, dmg: [2, 49], db: 25, hit: 35 },
        "obli_lizardman":   { n: "遺忘之島蜥蜴人", lv: 20, s: "S", beh: "主動", race: "蜥蜴人", e: "water", hp: 180, ac: -17, mr: 5, exp: 401, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "obli_kasta":       { n: "遺忘之島卡司特", lv: 36, s: "S", beh: "主動", race: "卡司特", e: "earth", hp: 240, ac: -20, mr: 10, exp: 1370, goldMin: 10, goldMax: 100, atkSpd: 1, dmg: [1, 52], db: 5, hit: 44, mag: { skn: "沉默", type: "magicseal", cd: 100, pbase: 150 } },
        "obli_lamia":       { n: "遺忘之島蛇女", lv: 37, s: "L", beh: "主動", race: "蛇女", e: "water", hp: 240, ac: -16, mr: 10, exp: 1370, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 52], db: 27, hit: 38, mag: { skn: "烈毒", type: "poison", cd: 70, pbase: 200, d: 50, tick: 3, dur: 12 } },
        "obli_lycan":       { n: "遺忘之島萊肯", lv: 37, s: "S", beh: "主動", race: "狼人", e: "wind", hp: 220, ac: -24, mr: 25, exp: 1370, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 52], db: 27, hit: 38 },
        "obli_axetaurus":   { n: "遺忘之島巨斧牛人", lv: 37, s: "S", beh: "主動", race: "牛人", e: "earth", hp: 300, ac: -20, mr: 0, exp: 1370, goldMin: 10, goldMax: 100, atkSpd: 3, dmg: [2, 52], db: 27, hit: 38 },
        "obli_troll":       { n: "遺忘之島食人妖精", lv: 37, s: "L", beh: "主動", race: "食人妖精", e: "fire", hp: 300, ac: -16, mr: 10, exp: 1370, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 52], db: 27, hit: 38, mag: { skn: "火牢", cd: 30, chance: 0.1, dmg: [3, 37], db: 37, ele: "fire" } },
        "obli_ungoliant":   { n: "遺忘之島楊果里恩", lv: 38, s: "L", beh: "主動", race: "蜘蛛", e: "earth", hp: 250, ac: -20, mr: 10, exp: 1445, goldMin: 10, goldMax: 100, atkSpd: 1, dmg: [1, 52], db: 5, hit: 47, mag: { skn: "烈毒", type: "poison", cd: 50, pbase: 200, d: 50, tick: 3, dur: 12 } },
        "obli_griffon":     { n: "遺忘之島格利芬", lv: 41, s: "L", beh: "主動", race: "格利芬", e: "wind", hp: 410, ac: -25, mr: 10, exp: 1682, goldMin: 10, goldMax: 100, atkSpd: 1.8, dmg: [1, 67], db: 7, hit: 51 },
        "obli_hammertaurus":{ n: "遺忘之島鏈鎚牛人", lv: 41, s: "S", beh: "主動", race: "牛人", e: "earth", hp: 430, ac: -20, mr: 0, exp: 1682, goldMin: 10, goldMax: 100, atkSpd: 3, dmg: [2, 58], db: 29, hit: 44 },
        "obli_harpy":       { n: "遺忘之島哈維", lv: 41, s: "S", beh: "主動", race: "哈維", e: "wind", hp: 250, ac: -28, mr: 25, exp: 677, goldMin: 10, goldMax: 100, atkSpd: 1.5, dmg: [1, 67], db: 7, hit: 51, mag: { skn: "吸血鬼之吻", cd: 60, dmg: [1, 50], db: 41, ele: "none", vamp: [1, 41] }, mag2: { skn: "木乃伊的詛咒", type: "stone", cd: 50, pbase: 150 } },
        "obli_shapeshifter":{ n: "遺忘之島變形怪", lv: 42, s: "S", beh: "主動", race: "變形怪", e: "earth", hp: 350, ac: -21, mr: 60, exp: 1765, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 59], db: 30, hit: 45 },
        "obli_bigcroc":     { n: "遺忘之島巨大鱷魚", lv: 42, s: "L", beh: "主動", race: "動物", e: "water", hp: 440, ac: -28, mr: 10, exp: 1765, goldMin: 10, goldMax: 100, atkSpd: 2.5, dmg: [2, 59], db: 30, hit: 45 },
        "obli_kastaking":   { n: "遺忘之島卡司特王", lv: 42, s: "S", beh: "主動", race: "卡司特", e: "earth", hp: 360, ac: -22, mr: 20, exp: 1765, goldMin: 10, goldMax: 100, atkSpd: 1, dmg: [1, 53], db: 5, hit: 53, mag: { skn: "沉默", type: "magicseal", cd: 70, pbase: 200 } },
        "obli_doro":        { n: "遺忘之島多羅", lv: 43, s: "L", beh: "主動", race: "多羅", e: "earth", hp: 330, ac: -25, mr: 20, exp: 1850, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 59], db: 30, hit: 46 },
        "obli_aruba":       { n: "遺忘之島阿魯巴", lv: 45, s: "L", beh: "主動", race: "巨人", e: "earth", hp: 550, ac: -27, mr: 0, exp: 2026, goldMin: 10, goldMax: 100, atkSpd: 1.5, dmg: [1, 74], db: 7, hit: 57, mag: { skn: "加速術", type: "self_haste", cd: 70, spd: 1, dur: 8 } },
        "obli_trollking":   { n: "遺忘之島食人妖精王", lv: 45, s: "L", beh: "主動", race: "食人妖精", e: "fire", hp: 480, ac: -18, mr: 20, exp: 2026, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49, mag: { skn: "火牢", cd: 30, chance: 0.1, dmg: [3, 45], db: 45, ele: "fire" } },
        "obli_evillizard":  { n: "遺忘之島邪惡蜥蜴", lv: 48, s: "L", beh: "主動", race: "邪惡蜥蜴", e: "water", hp: 800, ac: -25, mr: 30, exp: 2305, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 60], db: 30, hit: 53, mag: { skn: "寒冷噴吐", type: "stone", cd: 90, pbase: 200 } },
        "obli_cyclops":     { n: "遺忘之島獨眼巨人", lv: 50, s: "L", beh: "主動", race: "巨人", e: "wind", hp: 880, ac: -28, mr: 30, exp: 2501, goldMin: 10, goldMax: 100, atkSpd: 2, dmg: [2, 71], db: 36, hit: 56 },
        "obli_wyvern":      { n: "遺忘之島飛龍", lv: 53, s: "L", beh: "主動", race: "飛龍", e: "wind", hp: 1200, ac: -38, mr: 80, exp: 2810, goldMin: 10, goldMax: 100, atkSpd: 1, dmg: [1, 78], db: 8, hit: 67, mag: { skn: "火焰噴吐", cd: 70, dmg: [3, 100], db: 153, ele: "fire" } },
        "obli_bigtaurus":   { hard: true, n: "遺忘之島巨大牛人", lv: 53, s: "L", beh: "主動", race: "牛人", boss: true, e: "earth", hp: 5000, ac: -65, mr: 60, exp: 2810, goldMin: 800, goldMax: 1600, atkSpd: 3, dmg: [3, 82], db: 63, hit: 77, mag: { skn: "震裂術", cd: 70, chance: 0.5, dmg: [1, 300], db: 399, ele: "earth", sec: { type: "stun", pbase: 200 } } },
        "abyss_ghoul":    { n: "深淵食屍鬼", lv: 45, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 2400, ac: -10, mr: 68, exp: 2026, goldMin: 333, goldMax: 536, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49 },
        "abyss_archer":   { n: "深淵弓箭手", lv: 45, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 600, ac: -65, mr: 58, exp: 2026, goldMin: 333, goldMax: 536, atkSpd: 1, dmg: [1, 53], db: 5, hit: 57 },
        "elf_earthlord":  { n: "地靈之主", lv: 45, s: "S", beh: "被動", race: "元素", e: "earth", hp: 1400, ac: -40, mr: 35, exp: 2026, goldMin: 333, goldMax: 536, atkSpd: 3, dmg: [2, 63], db: 32, hit: 49, mag: { skn: "地裂術", cd: 70, dmg: [5, 40], db: 58, ele: "earth", alwaysHit: true } },
        "elf_windlord":   { n: "風靈之主", lv: 45, s: "S", beh: "被動", race: "元素", e: "wind", hp: 1400, ac: -40, mr: 35, exp: 2026, goldMin: 333, goldMax: 536, atkSpd: 1, dmg: [1, 53], db: 5, hit: 57, mag: { skn: "極道落雷", cd: 70, dmg: [2, 90], db: 18, ele: "wind", alwaysHit: true } },
        "elf_firelord":   { n: "火靈之主", lv: 45, s: "S", beh: "被動", race: "元素", e: "fire", hp: 1400, ac: -40, mr: 35, exp: 2026, goldMin: 333, goldMax: 536, atkSpd: 2, dmg: [2, 59], db: 30, hit: 49, mag: { skn: "燃燒的火球", cd: 70, dmg: [1, 180], db: 28, ele: "fire", alwaysHit: true } },
        "abyss_sith":     { n: "西斯", lv: 50, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 2400, ac: -35, mr: 75, exp: 2501, goldMin: 409, goldMax: 654, atkSpd: 2, dmg: [2, 71], db: 36, hit: 56, mag: { skn: "風之枷鎖", cd: 70, type: "slowatk", pbase: 9999, dur: 6 } },
        "abyss_water":    { n: "深淵水靈", lv: 55, s: "S", beh: "主動", race: "元素", e: "water", hp: 1800, ac: -50, mr: 45, exp: 3026, goldMin: 493, goldMax: 786, atkSpd: 2, dmg: [2, 90], db: 45, hit: 62, mag: { skn: "冰錐", cd: 50, dmg: [5, 30], db: 98, ele: "water", alwaysHit: true } },
        "abyss_earth":    { n: "深淵地靈", lv: 55, s: "S", beh: "主動", race: "元素", e: "earth", hp: 1800, ac: -50, mr: 45, exp: 3026, goldMin: 493, goldMax: 786, atkSpd: 3, dmg: [2, 90], db: 45, hit: 62, mag: { skn: "地裂術", cd: 80, dmg: [5, 30], db: 158, ele: "earth", alwaysHit: true } },
        "abyss_wind":     { n: "深淵風靈", lv: 55, s: "S", beh: "主動", race: "元素", e: "wind", hp: 1800, ac: -50, mr: 45, exp: 3026, goldMin: 493, goldMax: 786, atkSpd: 1, dmg: [1, 87], db: 9, hit: 70, mag: { skn: "極道落雷", cd: 70, dmg: [1, 200], db: 28, ele: "wind", alwaysHit: true } },
        "abyss_fire":     { n: "深淵火靈", lv: 55, s: "S", beh: "主動", race: "元素", e: "fire", hp: 1800, ac: -50, mr: 45, exp: 3026, goldMin: 493, goldMax: 786, atkSpd: 2, dmg: [2, 90], db: 45, hit: 62, mag: { skn: "裂炎術", cd: 90, dmg: [1, 250], db: 28, ele: "fire", alwaysHit: true } },
        "mambo_rabbit":   { n: "曼波兔", lv: 50, s: "S", beh: "被動", hard: true, race: "精靈", e: "none", hp: 3000, ac: -40, mr: 65, exp: 2000, goldMin: 493, goldMax: 786, atkSpd: 2, dmg: [2, 71], db: 36, hit: 56, mag: { skn: "跳躍波動", cd: 90, chance: 0.5, dmg: [1, 250], db: 1, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 200 } }, mag2: { skn: "冰裂術", cd: 110, chance: 0.7, dmg: [1, 250], db: 1, ele: "water", alwaysHit: true, sec: { type: "freeze", pbase: 200 } } },
        "abyss_lord":     { n: "深淵之主", lv: 65, s: "S", beh: "被動", hard: true, boss: true, race: "惡魔", e: "none", hp: 6000, ac: -60, mr: 60, exp: 3601, goldMin: 1000, goldMax: 5000, atkSpd: 2, dmg: [4, 80], db: 81, hit: 86, mag: { skn: "火焰之舞", cd: 70, chance: 0.3, dmg: [2, 366], db: 66, ele: "fire", alwaysHit: true }, mag2: { skn: "燃燒的火球", cd: 130, dmg: [1, 666], db: 66, ele: "fire", alwaysHit: true } },
        // ===== 🔥 50級試煉擴充：大洞穴隱遁者村莊地區 =====
        "demon_bat":      { n: "魔蝙蝠", lv: 22, s: "S", beh: "被動", race: "野獸", e: "wind", hp: 250, ac: -6, mr: 10, exp: 485, goldMin: 87, goldMax: 150, atkSpd: 2, dmg: [2, 23], db: 12, hit: 4 },
        "de_thief":       { n: "黑暗妖精盜賊", lv: 28, s: "S", beh: "主動", race: "黑暗妖精", e: "wind", hp: 500, ac: -18, mr: 20, exp: 785, goldMin: 87, goldMax: 150, atkSpd: 2, dmg: [2, 40], db: 20, hit: 25 },
        "dark_spirit_mob":{ n: "闇之精靈", lv: 25, s: "S", beh: "主動", race: "元素", e: "earth", hp: 120, ac: -14, mr: 35, exp: 626, goldMin: 109, goldMax: 186, atkSpd: 1, dmg: [1, 37], db: 4, hit: 25 },
        "armadillo":      { n: "犰狳", lv: 25, s: "S", beh: "主動", race: "野獸", e: "earth", hp: 120, ac: -14, mr: 35, exp: 626, goldMin: 109, goldMax: 186, atkSpd: 2, dmg: [2, 34], db: 18, hit: 18 },
        "demon_bear":     { n: "魔熊", lv: 26, s: "L", beh: "被動", race: "野獸", e: "earth", hp: 300, ac: -15, mr: 5, exp: 677, goldMin: 118, goldMax: 198, atkSpd: 3, dmg: [2, 37], db: 19, hit: 22 },
        "ohm_militia":    { n: "歐姆民兵", lv: 26, s: "S", beh: "被動", race: "歐姆", e: "none", hp: 230, ac: -18, mr: 25, exp: 677, goldMin: 118, goldMax: 198, atkSpd: 2, dmg: [2, 37], db: 19, hit: 22 },
        "dark_spirit_king":{ n: "闇精靈王", lv: 28, s: "L", beh: "被動", race: "元素", e: "earth", hp: 270, ac: -15, mr: 20, exp: 785, goldMin: 135, goldMax: 225, atkSpd: 1, dmg: [1, 43], db: 4, hit: 33 },
        "metal_centipede":{ n: "金屬蜈蚣", lv: 30, s: "L", beh: "被動", race: "蜈蚣", e: "earth", hp: 400, ac: -13, mr: 20, exp: 901, goldMin: 153, goldMax: 254, atkSpd: 2, dmg: [2, 42], db: 22, hit: 28, mag: { skn: "毒液噴吐", cd: 50, type: "poison", pbase: 150, d: 30, tick: 5, dur: 20 } },
        "beast_tamer":    { n: "馴獸師", lv: 40, s: "S", beh: "主動", race: "黑暗妖精", e: "none", hp: 600, ac: -30, mr: 35, exp: 1601, goldMin: 265, goldMax: 429, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43 },
        // ===== 🔥 50級試煉擴充：古代巨人之墓 =====
        "tomb_guardian":  { n: "墳墓守護者", lv: 45, s: "L", beh: "主動", hard: true, race: "墳墓守護者", e: "none", hp: 1000, ac: -45, mr: 70, exp: 2026, goldMin: 265, goldMax: 429, atkSpd: 3, dmg: [2, 63], db: 32, hit: 49, mag: { skn: "木乃伊的詛咒", cd: 50, chance: 0.3, type: "stone", pbase: 150 } },
        "tomb_guardian_mage": { n: "墳墓守護者法師", lv: 48, s: "L", beh: "主動", hard: true, race: "墳墓守護者", e: "fire", hp: 1500, ac: -50, mr: 70, exp: 2305, goldMin: 265, goldMax: 429, atkSpd: 3, dmg: [2, 68], db: 34, hit: 53, mag: { skn: "木乃伊的詛咒", cd: 50, chance: 0.3, type: "stone", pbase: 150 }, mag2: { skn: "燃燒的火球", cd: 70, dmg: [3, 40], db: 143, ele: "fire", alwaysHit: true } },
        "tomb_guardian_knight": { n: "墳墓守護者騎士", lv: 50, s: "L", beh: "主動", hard: true, race: "墳墓守護者", e: "fire", hp: 2000, ac: -55, mr: 70, exp: 2305, goldMin: 265, goldMax: 429, atkSpd: 3, dmg: [2, 71], db: 36, hit: 56, mag: { skn: "木乃伊的詛咒", cd: 50, chance: 0.3, type: "stone", pbase: 150 } },
        "tomb_guardian_giant": { n: "巨大墳墓守護者", lv: 56, s: "L", beh: "主動", hard: true, race: "墳墓守護者", e: "fire", hp: 5000, ac: -63, mr: 70, exp: 3137, goldMin: 265, goldMax: 429, atkSpd: 4, dmg: [2, 91], db: 46, hit: 63, mag: { skn: "木乃伊的詛咒", cd: 50, chance: 0.3, type: "stone", pbase: 150 } },
        // ===== 🔥 50級試煉擴充：魔族暗殺團（條件出現）=====
        "demon_assassin": { n: "魔族暗殺團", lv: 53, s: "S", beh: "被動", race: "不死", un: true, e: "none", hp: 1800, ac: -58, mr: 70, exp: 1, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 75], db: 38, hit: 59 },
        // ===== 🔥 50級試煉擴充：魔族神殿 =====
        "flame_avatar":   { n: "炎魔的分身", lv: 57, s: "L", beh: "主動", race: "惡魔", e: "none", hp: 8000, ac: -60, mr: 70, exp: 3250, goldMin: 165, goldMax: 429, atkSpd: 3, dmg: [2, 92], db: 47, hit: 65, mag: { skn: "地面震裂", cd: 70, chance: 0.5, dmg: [5, 40], db: 157, ele: "earth", alwaysHit: true } },
        "darkdweller":    { n: "黑暗棲林者", lv: 33, s: "S", beh: "主動", race: "黑暗棲林者", e: "none", hp: 450, ac: -10, mr: 50, exp: 1090, goldMin: 65, goldMax: 229, atkSpd: 2, dmg: [2, 46], db: 24, hit: 32, mag: { skn: "突刺術", cd: 50, dmg: [2, 33], db: 47, ele: "earth", alwaysHit: true } },
        "flame_skba":     { n: "炎魔的思克巴", lv: 37, s: "S", beh: "主動", race: "思克巴", e: "earth", hp: 400, ac: -25, mr: 50, exp: 1370, goldMin: 65, goldMax: 229, atkSpd: 2, dmg: [2, 52], db: 27, hit: 38, mag: { skn: "吸血鬼之吻", cd: 60, dmg: [2, 37], db: 21, ele: "none", alwaysHit: true, vamp: [1, 37] } },
        "flame_skba_queen": { n: "炎魔的思克巴女皇", lv: 41, s: "S", beh: "主動", race: "思克巴", e: "none", hp: 500, ac: -32, mr: 80, exp: 1682, goldMin: 85, goldMax: 259, atkSpd: 2, dmg: [2, 58], db: 29, hit: 44, mag: { skn: "吸血鬼之吻", cd: 60, dmg: [2, 41], db: 31, ele: "none", alwaysHit: true, vamp: [1, 41] } },
        "flame_imp":      { n: "炎魔的小惡魔", lv: 44, s: "S", beh: "主動", race: "惡魔", e: "earth", hp: 420, ac: -38, mr: 80, exp: 1937, goldMin: 85, goldMax: 359, atkSpd: 2, dmg: [2, 59], db: 30, hit: 48, mag: { skn: "火焰之陣", cd: 80, dmg: [3, 44], db: 66, ele: "fire", alwaysHit: true } },
        "flame_baphomet": { n: "炎魔的巴風特", lv: 51, s: "S", beh: "主動", race: "惡魔", e: "fire", hp: 3000, ac: -65, mr: 80, exp: 2602, goldMin: 285, goldMax: 459, atkSpd: 2, dmg: [2, 72], db: 37, hit: 57, mag: { skn: "地裂術", cd: 70, dmg: [4, 44], db: 56, ele: "earth", alwaysHit: true } },
        "fallen_priest1": { n: "墮落的司祭(一階)", lv: 51, s: "S", beh: "主動", race: "不死", un: true, e: "water", hp: 1500, ac: -50, mr: 70, exp: 2602, goldMin: 285, goldMax: 459, atkSpd: 2, dmg: [2, 72], db: 37, hit: 57, mag: { skn: "裂炎術", cd: 70, dmg: [3, 44], db: 51, ele: "fire", alwaysHit: true } },
        "fallen_priest2": { n: "墮落的司祭(二階)", lv: 51, s: "S", beh: "主動", race: "不死", un: true, e: "water", hp: 1500, ac: -53, mr: 70, exp: 2602, goldMin: 285, goldMax: 459, atkSpd: 2, dmg: [2, 72], db: 37, hit: 57 },
        "fallen_priest3": { n: "墮落的司祭(三階)", lv: 53, s: "S", beh: "主動", race: "不死", un: true, e: "none", hp: 3000, ac: -58, mr: 70, exp: 2810, goldMin: 285, goldMax: 459, atkSpd: 1.5, dmg: [1, 87], db: 9, hit: 67, mag: { skn: "突刺術", cd: 50, dmg: [4, 33], db: 53, ele: "earth", alwaysHit: true } },
        "flame_baless":   { n: "炎魔的巴列斯", lv: 53, s: "S", beh: "主動", hard: true, race: "惡魔", e: "earth", hp: 2100, ac: -66, mr: 80, exp: 2810, goldMin: 285, goldMax: 459, atkSpd: 1.5, dmg: [1, 87], db: 9, hit: 67, mag: { skn: "燃燒的火球", cd: 70, dmg: [1, 200], db: 66, ele: "fire", alwaysHit: true } },
        "fallen_priest4": { n: "墮落的司祭(四階)", lv: 54, s: "S", beh: "主動", race: "不死", un: true, e: "water", hp: 4000, ac: -63, mr: 70, exp: 2917, goldMin: 285, goldMax: 559, atkSpd: 1, dmg: [1, 79], db: 8, hit: 68, mag: { skn: "毒咒", cd: 70, chance: 0.5, type: "poison", pbase: 250, d: 50, tick: 5, dur: 20 } },
        "fallen_priest5": { n: "墮落的司祭(五階)", lv: 56, s: "S", beh: "主動", race: "不死", un: true, e: "water", hp: 3800, ac: -60, mr: 70, exp: 3137, goldMin: 285, goldMax: 559, atkSpd: 1, dmg: [1, 87], db: 9, hit: 71, mag: { skn: "舌頭突擊", cd: 30, chance: 0.5, dmg: [1, 100], db: 99, ele: "none", alwaysHit: true } },
        "flame_demon":    { n: "炎魔的惡魔", lv: 61, s: "L", beh: "主動", race: "惡魔", e: "earth", hp: 6000, ac: -68, mr: 75, exp: 3722, goldMin: 285, goldMax: 559, atkSpd: 1, dmg: [1, 89], db: 9, hit: 79, mag: { skn: "火焰之舞", cd: 70, chance: 0.5, dmg: [2, 166], db: 66, ele: "fire", alwaysHit: true }, mag2: { skn: "燃燒的火球", cd: 130, dmg: [1, 300], db: 66, ele: "fire", alwaysHit: true } },
        "fallen_boss":    { n: "墮落", lv: 68, s: "L", beh: "主動", boss: true, hard: true, race: "不死", un: true, e: "water", hp: 8000, ac: -75, mr: 100, exp: 4625, goldMin: 285, goldMax: 559, atkSpd: 1, dmg: [3, 85], db: 26, hit: 105, mag: { skn: "闇黑波動", cd: 70, chance: 0.5, dmg: [3, 166], db: 66, ele: "none", alwaysHit: true }, mag2: { skn: "爆炎之擊", cd: 130, dmg: [1, 500], db: 0, ele: "fire", alwaysHit: true, sec: { type: "burn", pbase: 200, d: 50, tick: 5, dur: 20 } } },
        // ===== 🌑 暗影神殿 怪物（種族：不死／魔族；以 un:true 套用不死機制） =====
        "death_priest_succubus": { n: "死亡的司祭(思克巴)", lv: 52, s: "L", beh: "主動", race: "不死", un: true, e: "none", hp: 750, ac: -55, mr: 100, exp: 2705, goldMin: 300, goldMax: 486, atkSpd: 2, dmg: [2, 73], db: 37, hit: 58, mag: { skn: "吸血鬼之吻", cd: 60, dmg: [2, 52], db: 52, ele: "none", alwaysHit: true, vamp: [1, 52] } },
        "death_priest_baphomet": { n: "死亡的司祭(巴風特)", lv: 55, s: "L", beh: "主動", race: "不死", un: true, e: "none", hp: 1000, ac: -60, mr: 100, exp: 3026, goldMin: 300, goldMax: 486, atkSpd: 2, dmg: [2, 90], db: 45, hit: 62, mag: { skn: "地裂術", cd: 70, dmg: [4, 52], db: 52, ele: "earth", alwaysHit: true } },
        "chaos_priest_wing": { n: "混沌的司祭(飛翼)", lv: 52, s: "L", beh: "主動", race: "不死", un: true, e: "none", hp: 750, ac: -65, mr: 100, exp: 2705, goldMin: 300, goldMax: 486, atkSpd: 2, dmg: [2, 73], db: 37, hit: 58 },
        "chaos_priest_beast": { n: "混沌的司祭(野獸)", lv: 55, s: "L", beh: "主動", race: "不死", un: true, e: "none", hp: 1000, ac: -70, mr: 100, exp: 3026, goldMin: 300, goldMax: 486, atkSpd: 1, dmg: [1, 87], db: 9, hit: 70, mag: { skn: "衝擊之暈", cd: 70, chance: 0.3, dmg: [1, 91], db: 31, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 200 } } },
        "flameshadow_guard_baphomet": { n: "火焰之影親衛隊(巴風特)", lv: 65, s: "L", beh: "主動", race: "不死", un: true, e: "fire", hp: 2000, ac: -70, mr: 100, exp: 4226, goldMin: 300, goldMax: 486, atkSpd: 2, dmg: [3, 68], db: 52, hit: 84, mag: { skn: "地裂術", cd: 70, dmg: [4, 100], db: 52, ele: "earth", alwaysHit: true } },
        "chaos_boss": { n: "混沌", lv: 70, s: "L", beh: "主動", boss: true, hard: true, race: "不死", un: true, e: "none", hp: 10000, ac: -60, mr: 100, exp: 3601, goldMin: 3000, goldMax: 4860, atkSpd: 2, dmg: [4, 92], db: 93, hit: 107, mag: { skn: "鐮刀波動", cd: 90, dmg: [4, 170], db: 75, ele: "none", alwaysHit: true }, mag2: { skn: "毒霧", cd: 100, type: "poison", pbase: 200, d: 100, tick: 5, dur: 20 } },
        "death_boss": { n: "死亡", lv: 70, s: "L", beh: "主動", boss: true, hard: true, race: "不死", un: true, e: "none", hp: 10000, ac: -65, mr: 100, exp: 4901, goldMin: 3000, goldMax: 4860, atkSpd: 1, dmg: [3, 85], db: 26, hit: 107, atkDoubleChance: 0.10, mag: { skn: "闇黑波動", cd: 90, dmg: [4, 170], db: 95, ele: "none", alwaysHit: true }, mag2: { skn: "衝擊之暈", cd: 70, chance: 0.2, dmg: [1, 151], db: 71, ele: "none", alwaysHit: true, sec: { type: "stun", pbase: 200 } } },
        // ===== 🏛️ 隱藏狩獵區域：象牙塔系列怪物（無生物研究室／黑魔法研究室／惡靈封印室／魔物封印室／惡魔封印室） =====
        "iv_paper": { n: "象牙塔紙人", lv: 50, s: "S", beh: "被動", race: "魔法生物", e: "wind", hp: 1250, ac: -30, mr: 5, exp: 2501, goldMin: 200, goldMax: 400, atkSpd: 2, dmg: [2, 71], db: 36, hit: 56 },
        "iv_stone_golem": { hard: true, n: "象牙塔石頭高崙", lv: 50, s: "L", beh: "被動", race: "高崙", e: "wind", hp: 875, ac: -50, mr: 45, exp: 2501, goldMin: 300, goldMax: 600, atkSpd: 3, dmg: [2, 71], db: 36, hit: 56 },
        "iv_iron_golem": { hard: true, n: "象牙塔鋼鐵高崙", lv: 51, s: "L", beh: "被動", race: "高崙", e: "wind", hp: 910, ac: -51, mr: 20, exp: 2602, goldMin: 400, goldMax: 800, atkSpd: 3, dmg: [2, 72], db: 37, hit: 57 },
        "iv_jelly": { n: "象牙塔果凍怪", lv: 52, s: "L", beh: "被動", race: "史萊姆", e: "wind", hp: 946, ac: -47, mr: 0, exp: 2705, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 73], db: 37, hit: 58, mag: { skn: "烈毒", cd: 50, type: "poison", pbase: 200, d: 30, tick: 3, dur: 15 } },
        "iv_armor": { hard: true, n: "象牙塔活鎧甲", lv: 53, s: "S", beh: "被動", race: "魔法生物", e: "wind", hp: 1021, ac: -44, mr: 50, exp: 2917, goldMin: 300, goldMax: 600, atkSpd: 1, dmg: [1, 78], db: 8, hit: 67 },
        "iv_deathsword": { n: "象牙塔死亡之劍", lv: 55, s: "S", beh: "被動", race: "魔法生物", e: "wind", hp: 1059, ac: -50, mr: 40, exp: 3026, goldMin: 300, goldMax: 600, atkSpd: 0.5, dmg: [1, 50], db: 5, hit: 70 },
        "iv_lightball": { n: "象牙塔閃電球", lv: 55, s: "S", beh: "被動", race: "元素", e: "wind", hp: 1059, ac: -50, mr: 45, exp: 3026, goldMin: 300, goldMax: 600, atkSpd: 1, dmg: [1, 87], db: 9, hit: 70 },
        "iv_mimi": { hard: true, n: "象牙塔密密", lv: 50, s: "S", beh: "被動", race: "魔法生物", e: "wind", hp: 1250, ac: -50, mr: 20, exp: 2501, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [2, 71], db: 36, hit: 56 },
        "iv_elder": { n: "象牙塔長者", lv: 55, s: "S", beh: "主動", race: "長者", e: "wind", hp: 1059, ac: -35, mr: 30, exp: 3026, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 90], db: 45, hit: 62, mag: { skn: "極道落雷", cd: 50, dmg: [1, 150], db: 55, ele: "wind", alwaysHit: true } },
        "iv_blackelder": { n: "象牙塔黑長者", lv: 57, s: "S", beh: "主動", race: "長者", e: "wind", hp: 1137, ac: -37, mr: 90, exp: 3250, goldMin: 500, goldMax: 1200, atkSpd: 2, dmg: [2, 92], db: 47, hit: 65, mag: { skn: "靈光箭", cd: 30, dmg: [1, 100], db: 50, ele: "none", alwaysHit: true } },
        "iv_chimera": { n: "象牙塔奇美拉", lv: 55, s: "S", beh: "主動", race: "奇美拉", e: "wind", hp: 1059, ac: -35, mr: 35, exp: 3026, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 90], db: 45, hit: 62, mag: { skn: "烈毒", cd: 50, type: "poison", pbase: 200, d: 30, tick: 3, dur: 15 } },
        "iv_lamia": { n: "象牙塔蛇女", lv: 56, s: "L", beh: "主動", race: "蛇女", e: "wind", hp: 1098, ac: -36, mr: 10, exp: 3137, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 91], db: 46, hit: 63, mag: { skn: "烈毒", cd: 50, type: "poison", pbase: 200, d: 30, tick: 3, dur: 15 } },
        "iv_blackmage": { n: "象牙塔黑魔法師", lv: 58, s: "S", beh: "主動", race: "法師", e: "wind", hp: 1177, ac: -38, mr: 80, exp: 3365, goldMin: 500, goldMax: 1200, atkSpd: 2, dmg: [2, 94], db: 48, hit: 66, mag: { skn: "火球", cd: 30, dmg: [1, 150], db: 40, ele: "fire", alwaysHit: true } },
        "iv_reaper": { n: "象牙塔死神", lv: 58, s: "S", beh: "主動", race: "不死", un: true, e: "wind", hp: 1177, ac: -53, mr: 9, exp: 3365, goldMin: 500, goldMax: 1000, atkSpd: 1, dmg: [1, 88], db: 9, hit: 73, mag: { skn: "風之枷鎖", cd: 80, type: "slowatk", pbase: 200, dur: 8 } },
        "iv_shadow": { n: "象牙塔影魔", lv: 58, s: "S", beh: "主動", race: "不死", un: true, e: "wind", hp: 1177, ac: -53, mr: 30, exp: 3365, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 94], db: 48, hit: 66 },
        "iv_spirit": { n: "象牙塔惡靈", lv: 59, s: "S", beh: "主動", race: "不死", un: true, e: "wind", hp: 1218, ac: -54, mr: 45, exp: 3482, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 96], db: 48, hit: 67 },
        "iv_baless": { hard: true, n: "象牙塔巴列斯之影", lv: 60, s: "S", beh: "主動", race: "惡魔", e: "wind", hp: 1260, ac: -55, mr: 80, exp: 3601, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "火球", cd: 30, dmg: [1, 200], db: 10, ele: "fire", alwaysHit: true } },
        "iv_karuta": { hard: true, n: "卡魯塔", lv: 51, s: "L", beh: "主動", boss: true, race: "靈魂", e: "wind", hp: 2200, ac: -51, mr: 50, exp: 2601, goldMin: 300, goldMax: 600, atkSpd: 2, dmg: [3, 79], db: 60, hit: 74, mag: { skn: "龍捲風", cd: 100, dmg: [3, 200], db: 100, ele: "wind", alwaysHit: true }, mag2: { skn: "魅魔之吻", cd: 50, chance: 0.2, dmg: [1, 1], db: 0, ele: "none", alwaysHit: true, sec: { type: "sleep", pbase: 200 } } },
        "iv_hatin": { n: "哈汀之影", lv: 60, s: "S", beh: "主動", noCharm: true, race: "法師", e: "wind", hp: 5000, ac: -50, mr: 99, exp: 3601, goldMin: 2000, goldMax: 4000, atkSpd: 2, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "黑魔法力場", cd: 80, dmg: [2, 200], db: 70, ele: "none", alwaysHit: true } },
        "iv_flameslave": { n: "象牙塔炎魔的奴隸", lv: 59, s: "L", beh: "主動", race: "惡魔", e: "wind", hp: 1218, ac: -54, mr: 75, exp: 3482, goldMin: 400, goldMax: 1000, atkSpd: 2, dmg: [2, 96], db: 48, hit: 67, mag: { skn: "落石術", cd: 70, dmg: [2, 150], db: 20, ele: "earth", alwaysHit: true } },
        "iv_imp": { n: "象牙塔小惡魔", lv: 60, s: "S", beh: "主動", race: "惡魔", e: "wind", hp: 1260, ac: -55, mr: 80, exp: 3601, goldMin: 500, goldMax: 1000, atkSpd: 2, dmg: [2, 97], db: 49, hit: 69, mag: { skn: "火焰之陣", cd: 70, chance: 0.5, dmg: [3, 150], db: 10, ele: "fire", alwaysHit: true } },
        "iv_baphomet": { hard: true, n: "象牙塔巴風特之影", lv: 62, s: "S", beh: "主動", race: "惡魔", e: "wind", hp: 1345, ac: -57, mr: 80, exp: 3845, goldMin: 500, goldMax: 1100, atkSpd: 2, dmg: [3, 66], db: 50, hit: 75, mag: { skn: "地裂術", cd: 30, dmg: [1, 200], db: 30, ele: "earth", alwaysHit: true } },
        "iv_wing": { n: "象牙塔翼魔", lv: 61, s: "L", beh: "主動", race: "惡魔", e: "wind", hp: 1302, ac: -56, mr: 50, exp: 3722, goldMin: 400, goldMax: 1000, atkSpd: 2, dmg: [2, 98], db: 50, hit: 72 },
        "iv_flameshadow": { n: "象牙塔炎魔之影", lv: 63, s: "L", beh: "主動", race: "惡魔", e: "wind", hp: 1389, ac: -58, mr: 70, exp: 3970, goldMin: 600, goldMax: 1200, atkSpd: 2, dmg: [3, 67], db: 51, hit: 78, mag: { skn: "地獄火", cd: 130, dmg: [1, 500], db: 50, ele: "fire", alwaysHit: true } },
        "iv_demonshadow": { n: "象牙塔惡魔之影", lv: 63, s: "L", beh: "主動", race: "惡魔", e: "wind", hp: 1389, ac: -58, mr: 60, exp: 3970, goldMin: 600, goldMax: 1200, atkSpd: 2, dmg: [3, 67], db: 51, hit: 78, mag: { skn: "火焰之舞", cd: 70, chance: 0.5, dmg: [1, 500], db: 50, ele: "fire", alwaysHit: true } },
        // ===== 🐜 螞蟻洞窟新增怪物（1樓/2樓/巨蟻女皇棲息地） =====
        "ant_white": { n: "白螞蟻群", lv: 25, s: "S", beh: "主動", race: "昆蟲", e: "fire", hp: 300, ac: -12, mr: 60, exp: 626, goldMin: 50, goldMax: 80, atkSpd: 2, dmg: [2, 34], db: 18, hit: 18 },
        "ant_giant_white": { n: "巨大白螞蟻", lv: 28, s: "L", beh: "主動", race: "昆蟲", e: "water", hp: 380, ac: -15, mr: 60, exp: 785, goldMin: 50, goldMax: 80, atkSpd: 2, dmg: [2, 40], db: 20, hit: 25 },
        "ant_enh": { n: "強化巨蟻", lv: 31, s: "S", beh: "主動", race: "昆蟲", e: "wind", hp: 440, ac: -15, mr: 60, exp: 962, goldMin: 60, goldMax: 90, atkSpd: 2, dmg: [2, 44], db: 22, hit: 30 },
        "ant_enh_white": { n: "強化白螞蟻群", lv: 34, s: "S", beh: "主動", race: "昆蟲", e: "fire", hp: 580, ac: -16, mr: 60, exp: 1157, goldMin: 65, goldMax: 100, atkSpd: 1, dmg: [1, 50], db: 5, hit: 41 },
        "ant_assault": { n: "巨大突擊螞蟻", lv: 37, s: "S", beh: "主動", race: "昆蟲", e: "wind", hp: 640, ac: -20, mr: 60, exp: 1370, goldMin: 75, goldMax: 110, atkSpd: 2, dmg: [2, 52], db: 27, hit: 38 },
        "ant_giant_enh_white": { n: "巨大強化白螞蟻", lv: 40, s: "L", beh: "主動", race: "昆蟲", e: "fire", hp: 740, ac: -24, mr: 60, exp: 1601, goldMin: 85, goldMax: 115, atkSpd: 2, dmg: [2, 57], db: 29, hit: 43 },
        "ant_guard": { n: "巨大守護螞蟻", lv: 44, s: "L", beh: "主動", race: "昆蟲", e: "none", hp: 650, ac: -48, mr: 60, exp: 1937, goldMin: 100, goldMax: 135, atkSpd: 2, dmg: [2, 59], db: 30, hit: 48, mag: { skn: "觸角攻擊", cd: 50, dmg: [1, 60], db: 20, ele: "none", alwaysHit: true } },
        // ===== 🏴‍☠️ 海賊島 怪物 =====
        "pirate_wildpoison": { n: "狂野之毒", lv: 18, s: "S", beh: "主動", race: "動物", e: "wind", hp: 180, ac: 0, mr: 5, exp: 325, goldMin: 41, goldMax: 78, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0, mag: { skn: "中毒", cd: 50, type: "poison", pbase: 100, d: 10, tick: 5, dur: 20 } },
        "pirate_lizardrage": { n: "狂暴蜥蜴人", lv: 20, s: "S", beh: "主動", race: "蜥蜴人", e: "wind", hp: 200, ac: -4, mr: 10, exp: 485, goldMin: 50, goldMax: 93, atkSpd: 2, dmg: [2, 9], db: 5, hit: 0 },
        "pirate_wildfang": { n: "狂野毒牙", lv: 18, s: "S", beh: "主動", race: "動物", e: "earth", hp: 180, ac: -6, mr: 10, exp: 325, goldMin: 61, goldMax: 110, atkSpd: 1, dmg: [1, 11], db: 1, hit: 2 },
        "pirate_wilddemon": { n: "狂野之魔", lv: 20, s: "S", beh: "主動", race: "動物", e: "wind", hp: 200, ac: -10, mr: 10, exp: 401, goldMin: 73, goldMax: 129, atkSpd: 1, dmg: [1, 11], db: 1, hit: 2, mag: { skn: "初級治癒術", cd: 70, type: "self_heal", heal: [1, 30] } },
        "pirate_lizardhigh": { n: "高等蜥蜴人", lv: 25, s: "S", beh: "主動", race: "蜥蜴人", e: "water", hp: 160, ac: -10, mr: 15, exp: 626, goldMin: 80, goldMax: 140, atkSpd: 2, dmg: [2, 34], db: 18, hit: 18, mag: { skn: "初級治癒術", cd: 70, type: "self_heal", heal: [1, 30] }, mag2: { skn: "投射水泡", cd: 50, dmg: [2, 25], db: 10, ele: "water", alwaysHit: true } },
        "pirate_bluetail": { n: "藍尾蜥蜴", lv: 24, s: "S", beh: "主動", race: "動物", e: "water", hp: 240, ac: -15, mr: 10, exp: 577, goldMin: 102, goldMax: 173, atkSpd: 2, dmg: [2, 32], db: 16, hit: 13 },
        "pirate_parrot": { n: "奇異鸚鵡", lv: 25, s: "S", beh: "主動", race: "動物", e: "wind", hp: 300, ac: -20, mr: 10, exp: 626, goldMin: 109, goldMax: 186, atkSpd: 2, dmg: [2, 34], db: 18, hit: 18 },
        "pirate_chest": { n: "藏寶箱", lv: 1, s: "S", beh: "被動", race: "寶箱", noAttack: true, e: "none", hp: 1, ac: 0, mr: 0, exp: 0, goldMin: 0, goldMax: 0, atkSpd: 2, dmg: [0, 0], db: 0, hit: 0 },
        "pirate_skeleton": { n: "海賊骷髏", lv: 25, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 220, ac: -18, mr: 40, exp: 626, goldMin: 109, goldMax: 186, atkSpd: 2, dmg: [2, 34], db: 18, hit: 18 },
        "pirate_lizardheavy": { n: "重裝蜥蜴人", lv: 24, s: "S", beh: "主動", race: "蜥蜴人", e: "wind", hp: 250, ac: -15, mr: 15, exp: 577, goldMin: 102, goldMax: 173, atkSpd: 2, dmg: [2, 32], db: 16, hit: 13 },
        "pirate_skelsoldier": { n: "海賊骷髏士兵", lv: 28, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 260, ac: -16, mr: 25, exp: 785, goldMin: 135, goldMax: 225, atkSpd: 2, dmg: [2, 40], db: 20, hit: 25 },
        "pirate_skelblade": { n: "海賊骷髏刀手", lv: 32, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 500, ac: -25, mr: 60, exp: 1025, goldMin: 173, goldMax: 285, atkSpd: 3, dmg: [2, 45], db: 23, hit: 31 },
        "pirate_skelchief": { n: "海賊骷髏首領", lv: 32, s: "S", beh: "主動", race: "不死", un: true, e: "earth", hp: 350, ac: -23, mr: 50, exp: 1025, goldMin: 173, goldMax: 285, atkSpd: 2, dmg: [2, 45], db: 23, hit: 31 },
        "pirate_drake": { n: "德雷克", lv: 42, s: "S", beh: "主動", boss: true, hard: true, race: "不死", un: true, e: "earth", hp: 2200, ac: -35, mr: 50, exp: 1765, goldMin: 292, goldMax: 470, atkSpd: 2, dmg: [2, 99], db: 50, hit: 63, mag: { skn: "迴旋斬", cd: 100, dmg: [5, 42], db: 42, ele: "none", alwaysHit: true } },
    },
	
	    // 👇 完整的城鎮系統資料庫
    towns: {
        "town_silver_knight": {
            n: "銀騎士村",
            npcs: [
                { id: "npc_glin", n: "格林", title: "雜貨商人", type: "shop", d: "櫃檯後堆滿了行囊與雜物，格林笑著招呼上門的冒險者，販賣各種日常消耗品。" },
                { id: "npc_wh_silver", n: "高特", title: "倉庫", type: "warehouse", d: "高特看守著厚重的鐵庫房，替旅人妥善存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_moli", n: "茉莉", title: "製作", type: "craft", d: "茉莉指間的針線從不停歇，能為冒險者製作皮革裝備。" },
				{ id: "npc_finn", n: "芬", title: "製作", type: "craft", d: "芬在工坊裡敲打不停，提供物品製作服務。" },
                { id: "npc_joel", n: "喬爾", title: "製作", type: "craft", d: "喬爾是個沉默而可靠的老匠人，提供物品製作服務。" },
                { id: "npc_ricky", n: "瑞奇", title: "試煉", type: "quest", d: "瑞奇曾是身經百戰的騎士。主持騎士的 15 級試煉：達等級後接取任務，試煉道具擊殺指定怪物必定掉落，收集齊後一次完成領取獎勵。" },
                { id: "npc_red", n: "雷德", title: "任務", type: "quest", d: "雷德眼中燃著難以平息的怒火。雷德的復仇：打倒蕾雅的部下並帶回證明物。" }
            ]
        },
        "town_kent_castle": {
            n: "肯特城",
            npcs: [
                { id: "npc_nikki", n: "尼奇", title: "雜貨商人", type: "shop", d: "硝煙散去後，尼奇在新得的城裡擺起攤子——攻城獲勝後開放的肯特城雜貨商。" },
                { id: "npc_wh_kent", n: "巴歐", title: "倉庫", type: "warehouse", d: "巴歐替占領者看管著肯特城的庫房，存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_ally_b", n: "傭兵公會", title: "協力", type: "ally", d: "傭兵公會替你牽起命運的絲線，召喚其他存檔位的角色一起作戰。" },
                { id: "npc_ismael", n: "伊賽馬利", title: "交換物品", type: "exchange", d: "伊賽馬利精於以物易物，以卷軸或金幣交換稀有的祝福卷軸與飾品卷軸。" },
                { id: "npc_pandora", n: "潘朵拉", title: "黑市", type: "exchange", d: "潘朵拉的黑市藏匿著來路不明的寶物，每 10 分鐘隨機上架一件商品，可直接購買。" },
                { id: "npc_kent_guard", n: "肯特守衛隊長", title: "城堡護衛", type: "castleguard", d: "肯特守衛隊長統領藍色鯊魚部隊，招募血厚耐打的護衛與你並肩作戰（死亡 30 秒自動復活）。" },
                { id: "npc_esti", n: "依詩蒂", title: "血盟", type: "pledge", d: "依詩蒂低聲訴說著血盟的古老誓言，為你尋找以血為盟的夥伴。" },
                { id: "npc_tros", n: "特羅斯", title: "血盟", type: "pledge", d: "特羅斯握劍而立，為你尋找以血為盟的夥伴。" },
                { id: "npc_obel", n: "奧貝勒", title: "魔物追蹤", type: "exchange", d: "奧貝勒是追蹤魔物的老手，花費金幣追蹤指定地區的特定魔物。" }
            ]
        },
        "town_windwood_castle": {
            n: "風木城",
            npcs: [
                { id: "npc_landish", n: "藍迪西", title: "雜貨商人", type: "shop", d: "風木城易主後，藍迪西重新支起攤位——攻下風木城後開放的雜貨商。" },
                { id: "npc_wh_windwood", n: "寶金", title: "倉庫", type: "warehouse", d: "寶金在風木城的庫房裡清點貨物，替你存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_ww_guard", n: "風木傭兵隊長", title: "城堡護衛", type: "castleguard", d: "風木傭兵隊長統領暴風之刃部隊，招募攻速最快、輸出最高的護衛與你並肩作戰（死亡 30 秒自動復活）。" },
                { id: "npc_esti", n: "依詩蒂", title: "血盟", type: "pledge", d: "依詩蒂低聲訴說著血盟的古老誓言，為你尋找以血為盟的夥伴。" },
                { id: "npc_tros", n: "特羅斯", title: "血盟", type: "pledge", d: "特羅斯握劍而立，為你尋找以血為盟的夥伴。" },
                { id: "npc_hert", n: "赫特", title: "魔物追蹤", type: "exchange", d: "赫特循著魔物的氣息而行，花費金幣追蹤指定地區的特定魔物。" }
            ]
        },
        "town_heine_castle": {
            n: "海音城",
            npcs: [
                { id: "npc_suvan", n: "須凡", title: "雜貨商人", type: "shop", d: "海音城歸入麾下後，須凡在港邊開張——攻下海音城後開放的雜貨商。" },
                { id: "npc_wh_heine", n: "哈金", title: "倉庫", type: "warehouse", d: "哈金守著海音城的倉庫，替你存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_ally_heinec", n: "傭兵公會", title: "協力", type: "ally", d: "傭兵公會替你牽起命運的絲線，召喚其他存檔位的角色一起作戰。" },
                { id: "npc_heine_guard", n: "海音神官隊長", title: "城堡護衛", type: "castleguard", d: "海音神官隊長統領毒蛇之牙部隊，招募攻守均衡的護衛與你並肩作戰（死亡 30 秒自動復活）。" },
                { id: "npc_esti", n: "依詩蒂", title: "血盟", type: "pledge", d: "依詩蒂低聲訴說著血盟的古老誓言，為你尋找以血為盟的夥伴。" },
                { id: "npc_tros", n: "特羅斯", title: "血盟", type: "pledge", d: "特羅斯握劍而立，為你尋找以血為盟的夥伴。" },
                { id: "npc_diren", n: "帝倫", title: "魔物追蹤", type: "exchange", d: "帝倫熟知各地魔物的蹤跡，花費金幣追蹤指定地區的特定魔物。" }
            ]
        },
        "town_talking": {
            n: "說話之島",
            npcs: [
                { id: "npc_gilen", n: "吉倫", title: "魔法傳授者", type: "skill", d: "吉倫是位循循善誘的魔法導師，提供玩家學習1~3級一般魔法。" },
                { id: "npc_basin", n: "巴辛", title: "妖魔商人", type: "shop", d: "巴辛是混跡市集的妖魔商人，販賣各種日常消耗品。" },
                { id: "npc_wh_talking", n: "朵琳", title: "倉庫", type: "warehouse", d: "朵琳細心地替旅人看管行囊，存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_pandora", n: "潘朵拉", title: "黑市", type: "exchange", d: "潘朵拉的黑市藏匿著來路不明的寶物，每 10 分鐘隨機上架一件商品，可直接購買。" },
                { id: "npc_ladal", n: "拉達爾", title: "製作", type: "craft", d: "拉達爾揉皮裁料樣樣精通，能為冒險者製作皮革裝備。" },
				{ id: "npc_falin", n: "法林", title: "製作", type: "craft", d: "法林手藝獨到，能製作銀釘皮裝備。" },
                { id: "npc_ryan", n: "萊恩", title: "製作", type: "craft", d: "萊恩在爐火旁默默打磨成品，提供物品製作服務。" },
				{ id: "npc_james", n: "詹姆", title: "試煉", type: "quest", d: "詹姆鑽研不死族的黑暗奧義。主持法師的 15 級試煉：達等級後接取任務，收集祭品一次完成，換取魔法能量之書。" },
				{ id: "npc_gunter", n: "甘特", title: "試煉", type: "quest", d: "甘特深信榮耀從不輕易賜予。主持騎士 30 級與王族 15、30 級試煉：達等級後接取任務，收集齊道具一次完成領取全部獎勵。" },
                { id: "npc_yuria", n: "尤麗婭", title: "兌換", type: "quest", d: "據說歐林曾將自己的鍛甲心得寫進日記。以歐林的日記本兌換臂甲（裝於副手，可與雙手武器並用；三選一）。" },
                { id: "npc_rabiani", n: "拉比安尼", title: "製作", type: "craft", d: "宮廷御用的鍛書師，能將四顆心臟之力封入書頁。以四種心之材料為王族鍛造特殊魔法書（灼熱武器／勇猛意志／閃亮之盾／王者加護）。" }
            ]
        },
        "town_elf": {
            n: "妖精森林",
            npcs: [			
                { id: "npc_elpin", n: "埃爾頻", title: "雜貨商人", type: "shop", d: "店裡擺滿旅人路上少不了的小東西。販售各種日常消耗品。" },
                { id: "npc_wh_elf", n: "艾爾", title: "倉庫", type: "warehouse", d: "沉默寡言的守庫人，替你看顧每一枚硬幣。存放物品與金幣，四個存檔角色共用。" },
				{ id: "npc_linda", n: "琳達", title: "精靈魔法商人", type: "shop", d: "精靈族的水晶在她手中閃著微光。販賣各種基本精靈水晶。" },
                { id: "npc_elion", n: "艾利溫", title: "妖精屬性學習", type: "quest", d: "掌管妖精元素契約的智者，他會引領你做出一生只有一次的抉擇。妖精選擇屬性魔法的重要NPC，四種屬性只能選擇一種。" },
                { id: "npc_nalien", n: "那翰", title: "製作", type: "craft", d: "指間流轉著森林的旋律，他能將你的素材化為動聽之器。提供協助製作魔法笛子。" },
                { id: "npc_narupa", n: "娜魯帕", title: "製作", type: "craft", d: "妖精族的巧手匠人，最懂得貼合妖精身形的工藝。提供協助製作各種妖精專用裝備。" },
                { id: "npc_elfqueen", n: "精靈女皇", title: "製作", type: "craft", d: "端坐於精靈聖域的女皇，唯有她識得奧里哈魯根的鍛造秘法。提供協助製作奧里哈魯根。" },
                { id: "npc_elf", n: "精靈", title: "製作", type: "craft", d: "靜守森林深處的精靈，能將原料淬鍊出純粹的光輝。提供協助製作純粹的米索莉塊、精靈羽翼。" },
                { id: "npc_ent", n: "安特", title: "製作", type: "craft", d: "年歲悠長的樹人，只要奉上一杯蘑菇汁，便願剝下一片自己的樹皮相贈。給予蘑菇汁可獲得安特之樹皮。" },
                { id: "npc_pan", n: "潘", title: "製作", type: "craft", d: "頭頂彎角的牧神，金屬與骨角皆在他的爐火下成形。提供協助製作米索莉金屬板、奧里哈魯根金屬板、潘的角。" },
                { id: "npc_rekne", n: "芮克妮", title: "製作", type: "craft", d: "以蛛絲織就萬物的紡者，她的線能縫合最堅韌之物。提供協助製作線、米索莉線、芮克妮的蛻皮。" },
				{ id: "npc_brabo", n: "布拉伯", title: "製作", type: "craft", d: "精靈軍械的老匠師，弓與刃的每一處部件都出自他手。提供精靈專屬武器與部件的製作。" },
				{ id: "npc_robinson", n: "羅賓孫", title: "製作", type: "craft", d: "傳說中的鑄弓人，唯有集齊精靈王與神獸的精魄，才肯點燃那把傳說之炎。蒐集精靈王與獨角獸、格利芬的稀有素材，可打造傳說的熾炎天使弓。" },
				{ id: "npc_mother", n: "迷幻森林之母", title: "試煉", type: "quest", d: "迷幻森林的守護之母，她的恩賜只賜予能洗淨黑暗之人。主持妖精的 30 級試煉：達等級後接取任務，淨化受詛咒的書，一次完成領取全部恩賜。" }
            ]
        },
		"town_gludin": {
            n: "古魯丁村莊",
            npcs: [
                { id: "npc_arena", n: "巴魯特", title: "鬥技場管理者", type: "arena", d: "古魯丁港口的退役鬥士，如今替往來的冒險者安排決鬥。可產生你的「對戰名片」交給其他玩家，或貼上對方的名片後由他安排場地——決鬥不給經驗與金幣，只記錄勝負戰績；落敗方完全無損失——不扣經驗、不掉裝備、不影響性向值，也無須祈求復活。任一方倒下即分出勝負，接著可自行選擇留在競技場再戰，或回古魯丁村莊。" },
                { id: "npc_wh_gludin", n: "凱倫", title: "倉庫", type: "warehouse", d: "凱倫在港邊的庫房裡清點著往來的貨物，替你存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_lucy", n: "露西", title: "雜貨商人", type: "shop", d: "露西的攤子就擺在通往碼頭的路上，出海遠行前該備的東西一樣不缺。販售各種日常消耗品。" },
                { id: "npc_ally_gludin", n: "傭兵公會", title: "協力", type: "ally", d: "傭兵公會替你牽起命運的絲線，召喚其他存檔位的角色一起作戰。" },
                { id: "npc_austin", n: "奧斯丁", title: "寵物保管", type: "petstore", d: "看慣了碼頭來去的旅人，奧斯丁願替他們照看捕獲的寵物。最多保管 32 隻（同模式角色共通）；可在此讓寵物出戰、鎖定、放生，或讓等級 30 以上「一般型態」的寵物進化——用進化果實→對應高等，或用勝利果實→黃金龍（兩種果實都帶著時可自選）；高等型態與黃金龍皆為最終型態。" }
            ]
        },
		"town_gludio": {
            n: "燃柳村",
            npcs: [
                { id: "npc_os", n: "歐斯", title: "試煉", type: "quest", d: "考驗妖精意志的試煉者。主持妖精的 15 級試煉：達等級後接取任務，收集四大妖魔魔法書，一次完成領取全部獎勵。" }
            ]
        },
        "town_giran": {
            n: "奇岩",
            npcs: [
                { id: "npc_meyer", n: "邁爾", title: "雜貨商人", type: "shop", d: "親切的雜貨老闆，再偏遠的旅途也備齊了該有的補給。販售各種日常消耗品。" },
				{ id: "npc_wino", n: "溫諾", title: "武器商人", type: "shop", d: "識貨的武器商人，架上每一把都曾飲過血。販賣各式各樣強大的武器。" },
				{ id: "npc_vangil", n: "范吉爾", title: "防具商人", type: "shop", d: "防具商人，深知活著回來的人靠的是一身好甲。販售各種堅固耐用的防具。" },
                { id: "npc_evert", n: "愛弗特", title: "布料商人", type: "shop", d: "眼光獨到的布料商，遠渡重洋的織品只為最講究的裁縫而備。販售製作高級服飾所需的進口布料。" },
				{ id: "npc_moliya", n: "莫麗雅", title: "製作", type: "craft", d: "潛心鑽研奧術的女工匠，唯有同道的法師方能托她打造法器。只有法師職業來此，可以製作法師專用的道具。" },
                { id: "npc_hector", n: "海克特", title: "製作", type: "craft", d: "爐火終年不熄的鋼鐵鍛造師，他的鎚聲就是品質的保證。為顧客製造鋼鐵道具。" },
                { id: "npc_herbert", n: "哈巴特", title: "製作", type: "craft", d: "手藝精湛的裁縫師，一針一線都縫進了對穿戴者的庇護。可以為人們縫製布料防具。" },
                { id: "npc_lentis", n: "倫提斯", title: "製作", type: "craft", d: "擅長將軍團之力封入金屬的戒指匠師。以軍團印記與軍王徽印打造四屬性的精靈戒指。" },
                { id: "npc_sebas", n: "賽巴斯", title: "寶石加工", type: "craft", d: "奇岩寶石加工坊的巨匠賽巴斯，能將稀世寶石與龍鱗鍛入飾品。製作四屬性戒指與四精靈皮帶。" },
                { id: "npc_wh_giran", n: "蘇瑞耳", title: "倉庫", type: "warehouse", d: "蘇瑞耳看守著奇岩繁忙商街旁的庫房，替你妥善存放物品與金幣，四個存檔角色共用。" }
            ]
        },
        "town_heine": {
            n: "海音",
            npcs: [
                { id: "npc_bit", n: "比特", title: "雜貨商人", type: "shop", d: "笑容可掬的雜貨商，總在你最需要時遞上補給。販售各種日常消耗品。" },
                { id: "npc_wh_heine", n: "哈金", title: "倉庫", type: "warehouse", d: "哈金守著海音城的倉庫，替你存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_ally_heine", n: "傭兵公會", title: "協力", type: "ally", d: "傭兵公會的協力之約，可讓不同命運的自己並肩而戰。召喚其他存檔位的角色一起作戰。" },
				{ id: "npc_lumiel", n: "琉米埃爾", title: "製作", type: "craft", d: "受伊娃眷顧的鍛者，能將神聖的祝福織入凡鐵。交換受到伊娃祝福的裝備。" },
                { id: "npc_duwen", n: "多文", title: "試煉", type: "quest", d: "歷盡沙場的老戰士多文。主持戰士的 15／30／45 級試煉與 50 級試煉：達等級後接取任務，試煉道具擊殺指定怪物必定掉落，一次完成領取全部獎勵。" },
                { id: "npc_esti", n: "依詩蒂", title: "血盟", type: "pledge", d: "依詩蒂低聲訴說著血盟的古老誓言，為你尋找以血為盟的夥伴。" },
                { id: "npc_isba", n: "依斯巴", title: "港口", type: "travel", d: "老船長依斯巴守著通往迷霧的航線。搭船前往遺忘之島（費用 10 萬金幣）。" }
            ]
        },
		"town_oren": {
            n: "歐瑞村莊",
            npcs: [
                { id: "npc_piwood", n: "畢伍德", title: "雜貨商人", type: "shop", d: "販售各種日常消耗品。" },
                { id: "npc_wh_oren", n: "希林", title: "倉庫", type: "warehouse", d: "存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_ally_oren", n: "傭兵公會", title: "協力", type: "ally", d: "召喚其他存檔位的角色一起作戰。" },
				{ id: "npc_ibelbin", n: "伊貝爾賓", title: "製作", type: "craft", d: "傳說中的鍛冶名匠伊貝爾賓，爐火曾淬煉過斬龍之鋒。能打造屠龍級神兵與護甲。" },
                { id: "npc_david", n: "大衛", title: "寶石加工", type: "craft", d: "大衛擅長雕琢寶石與寒冰結晶，能將 冰之女王的耳環 逐級精煉至更高型態。" },
                { id: "npc_tros", n: "特羅斯", title: "血盟", type: "pledge", d: "特羅斯握劍而立，為你尋找以血為盟的夥伴。" }
            ]
        },
        "town_aden": {
            n: "亞丁",
            npcs: [
                { id: "npc_lawen", n: "拉溫", title: "雜貨商人", type: "shop", d: "販售各種日常消耗品。" },
                { id: "npc_wh_aden", n: "恬金", title: "倉庫", type: "warehouse", d: "存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_upni", n: "烏普尼", title: "製作", type: "craft", d: "通曉禁忌符文的烏普尼，能將塔之力封入一紙。以 傲慢之塔傳送符 與 移動卷軸 製作 傲慢之塔支配符。" },
                { id: "npc_norse", n: "諾斯", title: "寵物裝備製作", type: "craft", d: "獸語匠人諾斯，懂得讓忠犬之牙更加銳利。鍛造寵物裝備，強化你的寵物。" },
                { id: "npc_baowu", n: "包武", title: "寵物保管", type: "petstore", d: "和善的看護人包武，願替遠行的旅人照看捕獲的寵物。最多保管 32 隻（同模式角色共通）；可在此讓寵物出戰、鎖定、放生，或讓等級 30 以上「一般型態」的寵物進化——用進化果實→對應高等，或用勝利果實→黃金龍（兩種果實都帶著時可自選）；高等型態與黃金龍皆為最終型態。" },
                { id: "npc_arkata", n: "聖使阿卡塔", title: "經驗買回・裝備贖回", type: "pray", d: "聖使阿卡塔能以聖光凝聚你死亡時散逸的事物。【裝備贖回】邪惡（紅名）狀態下死亡遺失的裝備會被記錄（最多 5 件），可花費 1000 龍之鑽石指定贖回其中一件。【死亡經驗買回】經典模式限定：每次死亡的實際經驗損失都會被記錄（最多 10 筆），可花費「死亡時等級×等級×1000」金幣，買回該筆損失經驗的 50%。" }   // 🕊️ v3.4.73 起經驗買回；v3.6.84 加裝備贖回並取消 classicOnly（紅名噴裝兩模式皆會發生·經驗買回段落內部仍限經典）
            ]
        },
        "town_elder_council": {   // 🌑 黑暗妖精聖地樞紐（依《黑暗妖精聖地.md》·v3.3.33）
            n: "長老會議廳",
            npcs: [
                { id: "npc_dantes_lord", n: "真．冥皇丹特斯", title: "聖地引路人", type: "quest", d: "端坐於骸骨王座的真．冥皇丹特斯。交出 死亡騎士之書 可進入 黑暗妖精聖地 或 受詛咒的黑暗妖精聖地（各消耗 1 本）；交出 吉爾塔斯的封印 則會被傳送至 崩壞的長老會議廳（消耗 1 個）。" },
                { id: "npc_atelier", n: "亞提利歐", title: "製作", type: "craft", d: "沉默寡言的矮人鐵匠亞提利歐，爐火中鍛著冥皇的遺志。以召喚球之核與碎片合成 完整的召喚球／真．冥皇製作防具秘笈，並以秘笈與材料鍛造 真．冥皇 系列防具。" }
            ]
        },
        "town_pride": {
            n: "傲慢之塔入口",
            npcs: [
                { id: "npc_pride_shop", n: "雜貨商人", title: "雜貨商人", type: "shop", d: "販售各種日常消耗品。" },
                { id: "npc_bamut", n: "巴姆特", title: "製作", type: "craft", d: "與墮落之物為伍的巴姆特，能將奇美拉之皮鞣成不祥的革。以奇美拉之皮製作詛咒的皮革，並打造四屬性斗篷。" }
            ]
        },
        "town_rift": {   // 🌀 時空裂痕入口（無 NPC，只有進入/領獎按鈕＋時間排名）
            n: "時空裂痕入口",
            npcs: []
        },
		"town_ivory_tower": {
            n: "象牙塔",
            npcs: [
                { id: "npc_paro", n: "帕羅", title: "雜貨商人", type: "shop", d: "販售各種日常消耗品。" },
                { id: "npc_taras", n: "塔拉斯", title: "試煉", type: "quest", d: "鑽研亡者學識的塔拉斯。主持法師的 30、45 級試煉：達等級後接取任務，收集不死族遺物，一次完成領取全部獎勵。" },
                { id: "npc_tas", n: "塔斯", title: "製作", type: "craft", d: "煉藥師塔斯能將純白之力調和成各色靈藥。以 3 個純白的萬能藥，製作任一屬性的萬能藥。" },
                { id: "npc_bayes", n: "巴耶斯", title: "魔法商人", type: "shop", d: "博覽群書的巴耶斯，書架上盡是深奧的咒文。販售各種高階魔法書。" },
                { id: "npc_bian", n: "碧恩", title: "賦予屬性", type: "bless", d: "屬性強化師碧恩，能將四大元素之力銘刻於武器。使用屬性強化卷軸為裝備中的武器（與副手武器）賦予或提升屬性（成功率 7%，失敗僅消耗卷軸）。" },
                { id: "npc_digallatin", n: "迪嘉勒廷", title: "試煉", type: "quest", d: "嚴苛的試煉主持者迪嘉勒廷，只認可真正的強者。主持騎士、妖精、法師與王族的 50 級試煉（需等級 50 接取；完成階段任務後開啟魔族神殿）。" },
                { id: "npc_dytite", n: "迪泰特", title: "解除封印", type: "craft", d: "通曉古法的迪泰特，能讀懂被歲月遺忘的封印。以古代的卷軸解除被遺忘裝備的封印，還原成古老的武器與防具。" },
                { id: "npc_mystic_mage", n: "神秘的魔法師", title: "魔杖改造", type: "craft", d: "不願透露姓名的魔法師，擅長以鋼鐵重鑄法器。以 +7 以上的瑪那魔杖或力量魔法杖，加上魔法寶石與金屬塊，鍛造出鋼鐵瑪那魔杖（成品為 +0）。" }
            ]
        },
        "town_witon": {
            n: "威頓村",
            npcs: [
                { id: "npc_masha", n: "馬沙", title: "試煉", type: "quest", d: "沉默寡言的試煉者馬沙，靜候挑戰者前來。主持騎士、妖精與王族的 45 級試煉：達等級後接取任務，一次完成領取全部獎勵。" },
                { id: "npc_han", n: "漢", title: "精通", type: "mastery", classicHide: true, d: "威頓村的傳奇人物漢，早已超越凡人的極限。等級 50 以上的強者，可在此接受超越自我的精通任務。" },   // 🏅
                { id: "npc_keluya", n: "客盧亞", title: "製作", type: "craft", d: "客盧亞傳承著上古鍛造的失落技藝。以古代材料打造古代臂甲與傳說武器（古代神之槍／古代神之斧）。" },
                { id: "npc_zeus_golem", n: "宙斯之熔岩高崙", title: "製作", type: "craft", d: "由熔岩鑄成的宙斯之熔岩高崙，爐心燃著遠古之火，專為戰士鍛兵。以惡魔斧頭與黑色米索莉金屬板為戰士鍛造「魔物的斧頭」；亦能以古老的盔甲融合 +7 以上的抗魔法鏈甲，鍛造出驅邪避魔的「滅魔」系列裝備。" },
                { id: "npc_doll_merchant", n: "魔法娃娃商人", title: "卡片合成", type: "synth", d: "蒐羅怪物卡片的魔法娃娃商人。能將你身上重複的卡片合成為更高階的卡片——10 張同名普卡換 1 張銀卡，10 張同名銀卡換 1 張金卡。" },
                { id: "npc_wh_witon", n: "艾斯倫", title: "倉庫", type: "warehouse", d: "艾斯倫在威頓村的庫房裡替旅人看管行囊，存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_doruga_bell", n: "多魯嘉貝爾", title: "副本", type: "dungeon", d: "多魯嘉家族的守望者，世代看守著被侵蝕的龍之巢穴。可由此進入「侵蝕的安塔瑞斯巢穴」（每個角色每日可擔任主戰或傭兵通關 1 次·UTC+8 凌晨重置；成功時全體出戰角色都會消耗次數；副本內禁止傳送），並設定最多 4 位助戰者提供增益。" },   // 🐉 安塔瑞斯副本入口＋助戰者
                { id: "npc_mimi", n: "米米", title: "製作", type: "craft", d: "精通龍鱗鍛造的工匠米米。能解開地龍之魔眼的封印，並以龍鱗盔甲與龍族之心重鑄「古代龍鱗盔甲」，再融合安塔瑞斯之心鍛出安塔瑞斯系列盔甲。" },   // 🐉 v3.7.57
                { id: "npc_riley_aide", n: "萊利的輔佐官", title: "兌換", type: "exchange", d: "替萊利打理庶務的輔佐官。收購安塔瑞斯的素材兌換積分（同一模式角色共通累積），每滿 10 積分即可開啟一次「多魯嘉7世傳家之寶」。" }   // 🐉 v3.7.57
            ]
        },
        "town_sherine": {   // 🔮 新安全區：席琳神殿
            n: "席琳神殿",
            npcs: [
                { id: "npc_sherine", n: "席琳", title: "祈禱", type: "pray", d: "靜謐的神女席琳，傾聽虔誠者的禱詞。等級 40 以上可向席琳祈禱，開啟或關閉「席琳的世界」。" },
                { id: "npc_io", n: "伊奧", title: "遺骸兌換", type: "quest", d: "看守遺骸祭壇的祭司伊奧。以席琳結晶兌換指定部位的席琳遺骸（之爪／之眼／之血／之肉／之心／之骨／之牙／之鱗），遺骸必附隨機一種席琳套裝詞綴。" }
            ]
        },
        "town_silent": {   // 🔧 黑暗妖精出生地：沉默洞穴
            n: "沉默洞穴",
            npcs: [
                { id: "npc_skvati", n: "史克瓦提", title: "雜貨商人", type: "shop", d: "黑暗妖精商人史克瓦提，攤上既有日常所需，也有暗影鍛成的兵刃。販售日常消耗品與基礎的黑暗妖精武器。" },
                { id: "npc_wh_silent", n: "雷亞斯", title: "倉庫", type: "warehouse", d: "存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_saedia", n: "賽帝亞", title: "魔法商人", type: "shop", d: "通曉暗影晶體的賽帝亞。販賣黑暗精靈水晶。" },
                { id: "npc_kupu", n: "庫普", title: "製作", type: "craft", d: "黑暗妖精的鋒刃巨匠庫普，以銀與暗影鍛造致命之器。鍛造銀與黑暗妖精的鋼爪、雙刀、十字弓。" },
                { id: "npc_kororanz", n: "可羅蘭斯", title: "製作", type: "craft", d: "鑽研拉斯塔巴德古史的鍛造師可羅蘭斯。集齊封印的歷史書八頁可製成製作武器秘笈，再以軍王／武官武器與聖地遺物等鍛成五件傳說武器。" },
                { id: "npc_runde", n: "倫得", title: "試煉", type: "quest", darkOnly: true, d: "黑暗妖精的 30 級試煉：達等級後接取任務，呈上以鮮血締結的死亡誓約，換得潛行於暗影中的影子手套。" },
                { id: "npc_kang", n: "康", title: "試煉", type: "quest", darkOnly: true, d: "黑暗妖精的 15 級試煉：達等級後接取任務，獻上妖魔長老首級為憑，換得隱沒氣息的影子面具。" },
                { id: "npc_brudica", n: "布魯迪卡", title: "試煉", type: "quest", darkOnly: true, d: "黑暗妖精的 45 級試煉：達等級後接取任務，帶回雪怪首級換得影子長靴；並主持黑暗妖精的 50 級試煉。" }
            ]
        },
        "town_hyperia": {   // 🔧 幻術士出生地：希培利亞村莊（試煉/製作 NPC 於後續階段補上）
            n: "希培利亞村莊",
            npcs: [
                { id: "npc_wh_hyperia", n: "倉庫保管員", title: "倉庫", type: "warehouse", d: "存放物品與金幣，所有存檔角色共用。" },
                { id: "npc_sphere", n: "史菲爾", title: "魔法商人", type: "shop", d: "史菲爾守著幻術士代代相傳的記憶水晶，將虛實之術凝於晶中販售。" },
                { id: "npc_bartel", n: "巴特爾", title: "製作", type: "craft", d: "巴特爾能以時空裂痕碎片打造龜裂之核，更擅長鍛造黑曜石奇古獸。" },
                { id: "npc_shenien", n: "希蓮恩", title: "試煉", type: "quest", d: "希蓮恩主持幻術士的 15／30／45 級試煉與 50 級試煉：達等級後接取任務，試煉道具擊殺指定怪物必定掉落，一次完成領取全部獎勵。" }
            ]
        },
        "town_behemoth": {   // 🐉 龍騎士出生地：貝希摩斯
            n: "貝希摩斯",
            npcs: [
                { id: "npc_wh_behemoth", n: "倉庫保管員", title: "倉庫", type: "warehouse", d: "存放物品與金幣，所有存檔角色共用。" },
                { id: "npc_sempal", n: "森帕爾", title: "龍魔法商人", type: "shop", d: "森帕爾販賣龍騎士書板與消滅者鎖鏈劍，言談間滿是對龍族秘術的敬畏。" },
                { id: "npc_pir", n: "皮爾", title: "製作", type: "craft", d: "皮爾的爐火終年不熄，能鍛造破滅者鎖鏈劍與古代臂甲。" },
                { id: "npc_procel", n: "普洛凱爾", title: "試煉", type: "quest", d: "普洛凱爾主持龍騎士的 15／30／45 級試煉與 50 級試煉：達等級後接取任務，試煉道具擊殺指定怪物必定掉落，一次完成領取全部獎勵。" }
            ]
        },
        "town_flame_audience": {
            n: "炎魔謁見所",
            npcs: [
                { id: "npc_flame_shadow", n: "炎魔之影", title: "製作", type: "craft", d: "自炎獄投影而生的炎魔之影，能以墮落素材編織出炎魔的血光斗篷。" },
                { id: "npc_imp", n: "小惡魔", title: "製作", type: "craft", d: "狡黠的小惡魔以惡魔腳鐐與墮落素材，為人鍛造惡魔系列武器。" },
                { id: "npc_flame_smith", n: "炎魔鐵匠", title: "製作", type: "craft", d: "炎魔鐵匠在熔岩爐前敲打不歇，鍛造銀金屬板、黑色米索莉金屬板等金屬板。" },
                { id: "npc_flame_aide", n: "炎魔的輔佐官", title: "耳環製作", type: "craft", d: "炎魔身旁的輔佐官，以靈魂石碎片為人鍛造各式禁忌耳環。" }
            ]
        },
        "town_pirate_village": {
            n: "海賊島村莊",
            npcs: [
                { id: "npc_boni", n: "波尼", title: "雜貨商人", type: "shop", d: "波尼在棧橋邊擺著攤子，販售各種航海日常與消耗品。" },
                { id: "npc_wh_pirate", n: "庫得", title: "倉庫", type: "warehouse", d: "庫得替往來的海賊看守貨艙，存放物品與金幣，四個存檔角色共用。" },
                { id: "npc_shimizhe", n: "希米哲", title: "任務", type: "quest", d: "希米哲在岸邊久候，盼著尋回亡子的遺物。帶來 兒子的信、兒子的遺骸、兒子的肖像畫 各一，可兌換 藍海賊頭巾。" }
            ]
        }

    },
	
	skills: {
        // ================= 【法師魔法】 =================
        // 一階魔法 (Lv 4)
        "sk_heal1": { n: "初級治癒術", type: "heal", justiceHeal: true, tier: 1, reqM: 4, reqE: 8, reqK: 16, mp: 4, valBase: 0, valDice: [1, 15], healDice: [1, 20], healBase: 20, classicHeal: { baseDice: 2, sides: 4 }, msg: "你感覺舒服了一點。" },
        "sk_sunlight": { n: "日光術", type: "buff", tier: 1, reqM: 4, reqE: 8, reqK: 16, reqI: 10, reqDk: 15, mp: 4, dur: 7200, msg: "你更容易被怪物發現了。" },
        "sk_shield": { n: "保護罩", type: "buff", tier: 1, reqM: 4, reqE: 8, reqK: 16, mp: 2, dur: 1200, d: { ac: 2 } },
        "sk_lightarrow": { n: "光箭", type: "atk", tier: 1, reqM: 4, reqE: 8, reqK: 16, mp: 3, dmgType: "magic", ele: "none", dmgDice: [1, 10], dmgBase: 8 },
        "sk_teleport": { n: "傳送術", type: "manual", tier: 1, reqM: 4, reqE: 8, reqK: 16, reqI: 10, reqDk: 15, mp: 5, mEff: "teleport" },
        "sk_icearrow": { n: "冰箭", type: "atk", tier: 1, reqM: 4, reqE: 8, reqK: 16, mp: 3, dmgType: "magic", ele: "water", dmgDice: [1, 10], dmgBase: 10 },
        "sk_windblade": { n: "風刃", type: "atk", tier: 1, reqM: 4, reqE: 8, reqK: 16, mp: 3, dmgType: "magic", ele: "wind", dmgDice: [1, 10], dmgBase: 10 },
        "sk_holy_wpn": { n: "神聖武器", type: "buff", tier: 1, reqM: 4, reqE: 8, reqK: 16, mp: 10, dur: 1200, d: { extraDmg: 1, extraHit: 1 }, msg: "你的武器暫時被注入了神聖力量。" },

        // 二階魔法 (Lv 8)
        "sk_antidote": { n: "解毒術", type: "heal", tier: 2, reqM: 8, reqE: 16, mp: 8, msg: "你感覺毒素消退了。" },
        "sk_cold_shiver": { n: "寒冷戰慄", type: "atk", tier: 2, reqM: 8, reqE: 16, mp: 9, dmgType: "magic", ele: "none", dmgDice: [2, 10], dmgBase: 10, lifesteal: true, healSlot: true },
        "sk_poison_curse": { n: "毒咒", type: "atk", tier: 2, reqM: 8, reqE: 16, mp: 10, dmgType: "magic", status: { kind: "poison", pbase: 100, dur: 15, tick: 3, dmg: [1, 8] }, msg: "你使目標中毒了。" },
        "sk_ench_wpn": { n: "擬似魔法武器", type: "buff", tier: 2, reqM: 8, reqE: 16, mp: 20, dur: 1800, d: { extraDmg: 2 }, msg: "你的武器暫時被注入了魔法力量。" },
        "sk_reveal": { n: "無所遁形術", type: "buff", tier: 2, reqM: 8, reqE: 16, mp: 8, dur: 180 },
        "sk_load_up": { n: "負重強化", type: "buff", tier: 2, reqM: 8, reqE: 16, reqD: 16, mp: 10, dur: 1800, label: "增益", msg: "感覺到身體變輕了。" },   // 🔧 改版：負重上限+50（持續1800秒，效果結束才再施放）
        "sk_firearrow": { n: "火箭", type: "atk", tier: 2, reqM: 8, reqE: 16, mp: 3, dmgType: "magic", ele: "fire", dmgDice: [2, 10], dmgBase: 10 },
        "sk_hell_fang": { n: "地獄之牙", type: "atk", tier: 2, reqM: 8, reqE: 16, mp: 3, dmgType: "magic", ele: "earth", dmgDice: [2, 10], dmgBase: 10 },

        // 三階魔法 (Lv 12)
        "sk_aurora": { n: "極光雷電", type: "atk", tier: 3, reqM: 12, reqE: 24, mp: 13, dmgType: "magic", ele: "wind", target: "all", dmgDice: [4, 10] },
        "sk_undead_bane": { n: "起死回生術", type: "atk", tier: 3, reqM: 12, reqE: 24, mp: 15, dmgType: "magic", instakill: { tag: "undead", cap: 12 } },   // 🔧 即死成功率最高 60%
        "sk_heal_mid": { n: "中級治癒術", type: "heal", justiceHeal: true, tier: 3, reqM: 12, reqE: 24, mp: 11, valDice: [1, 30], healDice: [1, 50], healBase: 50, classicHeal: { baseDice: 4, sides: 8 }, msg: "你感覺舒服了一點。" },
        "sk_dark_blind": { n: "闇盲咒術", type: "atk", tier: 3, reqM: 12, reqE: 24, mp: 20, dmgType: "magic", status: { kind: "blind", pbase: 150, hit: 4, dur: 10 } },
        "sk_shield2": { n: "鎧甲護持", type: "buff", tier: 3, reqM: 12, reqE: 24, mp: 20, dur: 1800, d: { ac: 3 }, msg: "你的盔甲暫時被注入了魔法力量。" },
        "sk_chill": { n: "寒冰氣息", type: "atk", tier: 3, reqM: 12, reqE: 24, mp: 9, dmgType: "magic", ele: "water", target: "all", dmgDice: [5, 5], dmgBase: 5 },
        "sk_energy_sense": { n: "能量感測", type: "manual", tier: 3, reqM: 12, reqE: 24, mp: 8, mEff: "sense" },

        // 四階魔法 (Lv 16)
        "sk_fireball": { n: "燃燒的火球", type: "atk", tier: 4, reqM: 16, reqE: 32, mp: 16, dmgType: "magic", ele: "fire", target: "all", dmgDice: [5, 9] },
        "sk_fireball_burst": { n: "爆裂的火球", type: "atk", tier: 4, mp: 20, dmgType: "magic", ele: "fire", target: "all", dmgDice: [6, 10] },   // 🏺 遺物「烈焰巫師的正式長袍」：已學燃燒的火球時，於施法瞬間替換（castSkillInner→_fireballMorphId·js/07；傭兵鏡像 js/06）；特效由 js/09 SPELL_FX 直接註冊「爆裂的火球」；非可學技能
        "sk_darkwave": { n: "闇黑波動", type: "atk", tier: 4, dmgType: "magic", ele: "none", target: "all", dmgDice: [5, 9] },   // 🏺 遺物「被差遣的迷你闇精靈」奇古獸 procSkill(8%) 用；非可學技能·對全體造成無屬性魔法傷害
        "sk_dex_up": { n: "通暢氣脈術", type: "buff", tier: 4, reqM: 16, reqE: 32, mp: 45, dur: 1200, d: { dex: 5 }, msg: "你覺得身手變得更靈活。" },
        "sk_break": { n: "壞物術", type: "atk", tier: 4, reqM: 16, reqE: 32, mp: 20, dmgType: "magic", status: { kind: "broken", pbase: 150, dur: 25 } },
        "sk_vampire": { n: "吸血鬼之吻", type: "atk", tier: 4, reqM: 16, reqE: 32, mp: 13, dmgType: "magic", ele: "none", dmgDice: [3, 10], dmgBase: 15, lifesteal: true, healSlot: true },
        "sk_slow": { n: "緩速術", type: "atk", tier: 4, reqM: 16, reqE: 32, mp: 20, dmgType: "magic", status: { kind: "slow", pbase: 150, dur: 30 } },
        "sk_relic_stun": { n: "暈眩", type: "atk", status: { kind: "stun", dur: 2, force: true } },   // 🏺 遺物「地靈的木棍」攻擊命中觸發用（procStatusSkill·非可學技能·force 跳過魔抗故 proc 率＝最終暈眩率·BOSS 免疫仍生效）
        "sk_relic_freeze": { n: "冰凍", type: "atk", status: { kind: "freeze", dur: 6, force: true } },   // 🏺 遺物「冰原十字鎬」攻擊命中觸發用（procStatusSkill·非可學技能·force 跳過魔抗故 proc 率＝最終冰凍率·BOSS 免疫仍生效）
        "sk_relic_paralyze": { n: "麻痺", type: "atk", status: { kind: "stun", dur: 2, force: true } },   // 🏺 遺物「海星的分裂腕足」攻擊命中觸發用（procStatusSkill·非可學技能）；怪物無 paralyze 狀態欄→以 stun 實現「無法行動」效果，日誌標示為麻痺
        "sk_relic_silence": { n: "沉默", type: "atk", status: { kind: "magicseal", dur: 8, force: true } },
        "sk_relic_slow": { n: "緩速", type: "atk", status: { kind: "slow", dur: 8, force: true } },   // 🐍 遺物「艾庫艾托的鞭笞藤」攻擊命中觸發（procStatusSkill·force·緩速＝敵攻擊間隔+1秒·js/03:367）
        "sk_relic_stone": { n: "石化", type: "atk", status: { kind: "stone", dur: 6, force: true } },   // 🏺 遺物「眼魔的凝視」攻擊命中觸發（procStatusSkill·force 跳魔抗→proc 率＝最終石化率·BOSS 免疫仍生效）
        "sk_relic_broken": { n: "損壞", type: "atk", status: { kind: "broken", dur: 8, force: true } },   // 🏺 遺物「巨人的拋投石」攻擊命中觸發（procStatusSkill·force·損壞＝敵一般攻擊傷害-2）   // 🏺 遺物「七彩鸚鵡喙」攻擊命中觸發用（procStatusSkill·非可學技能）；怪物用 magicseal(魔法封印) 實現沉默·js/03:367 施法閘讀 st.magicseal
        "sk_holy_lightning": { n: "致命落雷", type: "atk", tier: 6, dmgType: "magic", ele: "wind", dmgDice: [6, 10] },   // 🏛️ 聖晶魔杖 procSkill 用：6D10 風屬性·走 procFreeMagicSkill（武器 proc 不套法師階級加成·非可學技能）
        "sk_rock_prison": { n: "岩牢", type: "atk", tier: 4, reqM: 16, reqE: 32, mp: 11, dmgType: "magic", ele: "earth", target: "all", dmgDice: [5, 8] },
        "sk_magic_shield": { n: "魔法屏障", type: "buff", tier: 4, reqM: 16, reqE: 32, mp: 16, dur: 16 },
        "sk_meditation": { n: "冥想術", type: "buff", tier: 4, reqM: 16, reqE: 32, hpCost: 40, mp: 10, dur: 600, d: { mpR: 5 } },

        // 五階魔法 (Lv 20)
        "sk_mummy_curse": { n: "木乃伊的詛咒", type: "atk", tier: 5, reqM: 20, reqE: 40, mp: 35, dmgType: "magic", status: { kind: "stone", pbase: 100, dur: 6 } },
        "sk_charm": { n: "迷魅術", type: "manual", tier: 5, reqM: 20, reqE: 40, mp: 30, mEff: "charm" },
        "sk_thunder": { n: "極道落雷", type: "atk", tier: 5, reqM: 20, reqE: 40, mp: 25, dmgType: "magic", ele: "wind", dmgDice: [5, 8], dmgBase: 40 },
        "sk_heal2": { n: "高級治癒術", type: "heal", justiceHeal: true, tier: 5, reqM: 20, reqE: 40, mp: 20, valDice: [2, 30], healDice: [1, 100], healBase: 100, classicHeal: { baseDice: 10, sides: 8 }, msg: "你感覺舒服了一點。" },
        "sk_holy_light": { n: "聖潔之光", type: "heal", tier: 5, reqM: 20, reqE: 40, mp: 10, msg: "神聖光芒驅散了詛咒。" },
        "sk_ice_spike": { n: "冰錐", type: "atk", tier: 5, reqM: 20, reqE: 40, mp: 21, dmgType: "magic", ele: "water", dmgDice: [5, 6], dmgBase: 40 },
        "sk_demon_kiss": { n: "惡魔之吻", type: "atk", tier: 3, mp: 0, dmgType: "magic", ele: "earth", dmgDice: [3, 20], procOnly: true },   // 🏛️ 底比斯歐西里斯武器附魔施放（procSkill·不需學習/不耗MP·受魔法傷害公式影響）；procOnly：純武器proc、不顯示於技能列表/下拉
        "sk_revenge_spike": { n: "復仇尖石", type: "atk", tier: 5, mp: 0, dmgType: "magic", ele: "earth", dmgDice: [5, 3], dmgBase: 50, procOnly: true },   // 🗡️ 倫得雙刀附魔施放（procSkill·不需學習/不耗MP·受魔法傷害公式影響）；procOnly：純武器proc、不顯示於技能列表/下拉
        "sk_earth_collapse": { n: "大地崩裂", type: "atk", tier: 5, mp: 0, dmgType: "magic", ele: "earth", target: "all", dmgDice: [8, 12], procOnly: true },   // 🌑 v3.4.67 冥皇執行劍（解咒版）附魔施放：對全體敵人 8D12 地屬性魔法傷害（受魔法傷害公式影響·target:all 靠 procFreeMagicSkill fan-out）；VFX 沿用地裂術（js/09 SPELL_FX alias）
        "sk_mana_drain": { n: "魔力奪取", type: "convert", tier: 5, reqM: 20, reqE: 40, hpCost: 50, drain: true },   // 🔧 改為轉換技能（法師/妖精）：消耗HP、需對怪物施展且以異常魔法命中判定，命中吸取 MP=1D(怪物等級/2)；其餘機制比照魂體轉換
        "sk_dark_shadow": { n: "黑闇之影", type: "atk", tier: 5, reqM: 20, reqE: 40, mp: 25, dmgType: "magic", status: { kind: "blind", pbase: 150, hit: 5, dur: 20 } },

        // 六階魔法 (Lv 24)
        "sk_zombie": { n: "造屍術", type: "buff", tier: 6, reqM: 24, reqE: 48, mp: 35, dur: 3600, desc: "以死靈魔法喚醒倒下的人形軀殼，使其服從施術者並肩作戰。施術者的力量越成熟，甦醒的亡者也越強韌。", summon: { n: "隨從：人形殭屍", dmgDice: [1, 12], dmgDiv: 5, dmgLvDiv: 20, dmgMult: 0.90, interval: 20, kind: "melee", hitLvOff: 0 } },
        "sk_haste_spell": { n: "加速術", type: "buff", tier: 6, reqM: 24, reqE: 48, mp: 40, dur: 1200, haste: true, msg: "你感到身體變得非常輕盈。" },
        "sk_cancel": { n: "魔法相消術", type: "heal", tier: 6, reqM: 24, reqE: 48, mp: 40, msg: "你全身上下感到涼意。" },
        "sk_earthquake": { n: "地裂術", type: "atk", tier: 6, reqM: 24, reqE: 48, mp: 25, dmgType: "magic", ele: "earth", dmgDice: [5, 3], dmgBase: 50 },
        "sk_blaze": { n: "烈炎術", type: "atk", tier: 6, reqM: 24, reqE: 48, mp: 30, dmgType: "magic", ele: "fire", dmgDice: [16, 5], dmgBase: 40 },
        "sk_str_up": { n: "體魄強健術", type: "buff", tier: 6, reqM: 24, reqE: 48, mp: 50, dur: 1200, d: { str: 5 }, msg: "你覺得身體充滿了力量。" },
        "sk_bless_wpn": { n: "祝福魔法武器", type: "buff", tier: 6, reqM: 24, reqE: 48, mp: 20, dur: 1200, d: { extraDmg: 2, extraHit: 2 }, msg: "你的武器暫時被注入了魔法力量。" },
        "sk_weaken": { n: "弱化術", type: "atk", tier: 6, reqM: 24, reqE: 48, mp: 25, dmgType: "magic", status: { kind: "weaken", pbase: 150, dur: 30 } },

        // 七階魔法 (Lv 28)
        "sk_regen": { n: "體力回復術", type: "heal", justiceHeal: true, tier: 7, reqM: 28, mp: 35, valDice: [1, 20], healDice: [1, 30], healBase: 30, classicHeal: { baseDice: 10, sides: 8, mult: 0.8 }, groupHeal: true, healCooldownTicks: 30, msg: "治癒之光立即籠罩全隊。" },
        "sk_greater_haste": { n: "強力加速術", type: "buff", tier: 7, reqM: 28, mp: 60, dur: 2400, haste: true, msg: "你感到身體變得非常輕盈。" },
        "sk_ice_lance": { n: "冰矛圍籬", type: "atk", tier: 7, reqM: 28, mp: 30, dmgType: "magic", ele: "water", dmgDice: [10, 6], dmgBase: 45, freeze: 200 },
        "sk_tornado": { n: "龍捲風", type: "atk", tier: 7, reqM: 28, mp: 45, dmgType: "magic", ele: "wind", target: "all", multiDmg: [[2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10]] },
        "sk_berserk": { n: "狂暴術", type: "buff", tier: 7, reqM: 28, mp: 40, dur: 1200, d: { meleeDmg: 5, ac: -10 }, msg: "你的野性逐漸支配理智。" },
        "sk_summon": { n: "召喚術", type: "buff", tier: 7, reqM: 28, mp: 50, dur: 3600, summon: { tiered: true } },
        "sk_holy_dash": { n: "神聖疾走", type: "buff", tier: 7, reqM: 28, mp: 20, dur: 64, moveSpeedMult: 1.33, msg: "你覺得身體變輕了。" },
        "sk_disease": { n: "疾病術", type: "atk", tier: 7, reqM: 28, mp: 30, dmgType: "magic", status: { kind: "disease", pbase: 150, dur: 30 } },

        // 八階魔法 (Lv 32)
        "sk_full_heal": { n: "全部治癒術", type: "heal", justiceHeal: true, tier: 8, reqM: 32, mp: 30, valDice: [3, 30], healDice: [3, 50], healBase: 150, classicHeal: { baseDice: 12, sides: 12 }, msg: "你感覺舒服了不少。" },
        "sk_blizzard": { n: "冰雪暴", type: "atk", tier: 8, reqM: 32, mp: 60, dmgType: "magic", ele: "water", target: "all", multiDmg: [[2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10]] },
        "sk_blizzard_storm": { n: "冰雪颶風", type: "buff", tier: 10, reqM: 40, mp: 60, dur: 32, ele: "water", target: "all", noRefresh: true, stormInterval: 40, dmgDice: [2, 10], freezeHitOff: -3, msg: "冰雪颶風在你周身成形。" },   // 🌨️ 輔助勾選維持的傷害增益：每4秒對全體造成2D10水傷+冰凍(魔命-3)；傷害由 stormBuffTick 處理
        "sk_fire_prison": { n: "火牢", type: "buff", tier: 8, reqM: 32, mp: 60, dur: 10, ele: "fire", target: "all", noRefresh: true, stormInterval: 20, dmgDice: [2, 15], msg: "熊熊火牢在你周身燃起。" },   // 🔥 輔助勾選維持的傷害增益：每2秒對全體造成2D15火傷（無異常）；傷害由 stormBuffTick 處理
        "sk_quake": { n: "震裂術", type: "atk", tier: 8, reqM: 32, mp: 40, dmgType: "magic", ele: "earth", target: "all", dmgDice: [8, 10], dmgBase: 30 },
        "sk_invisible": { n: "隱身術", type: "buff", tier: 8, reqM: 32, hpCost: 20, mp: 45, dur: 64 },
        "sk_resurrection": { n: "返生術", type: "passive", tier: 8, reqM: 32, mp: 50 },
        "sk_seal": { n: "魔法封印", type: "atk", tier: 8, reqM: 32, mp: 30, dmgType: "magic", status: { kind: "vacuum", pbase: 100, dur: 16 } },
        "sk_heal_energy_storm": { n: "治癒能量風暴", type: "buff", tier: 8, reqM: 32, mp: 20, dur: 320, noRefresh: true, hpRegenIv: 30, desc: "HP自然恢復時間變成3秒", msg: "治癒的能量風暴環繞著你，生命力快速匯聚。" },   // 🌀 八階增益：維持中 HP 自然恢復間隔固定 3 秒(hpRegenIv=30 tick·玩家 js/03 gameLoop／傭兵 js/06 alliesTick)；施放消耗 MP20；noRefresh＝效果結束才能再次施放；單體輔助＝TEAM_SHARE_BUFFS 共享給傭兵(js/01)

        // 九階魔法 (Lv 36)
        "sk_holy_barrier": { n: "聖結界", type: "buff", tier: 9, reqM: 36, mp: 30, dur: 32, msg: "一道神聖的防禦屏障保護著你。" },
        "sk_sleep_mist": { n: "沉睡之霧", type: "atk", tier: 9, reqM: 36, mp: 40, dmgType: "magic", target: "all", status: { kind: "sleep", pbase: 100, dur: 8 } },
        "sk_thunder_storm": { n: "雷霆風暴", type: "atk", tier: 9, reqM: 36, mp: 48, dmgType: "magic", ele: "wind", target: "all", multiDmg: [[2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10], [2, 10]] },
        "sk_fire_storm": { n: "火風暴", type: "atk", tier: 9, reqM: 36, mp: 48, dmgType: "magic", ele: "fire", target: "all", multiDmg: [[4, 10], [4, 10], [4, 10], [4, 10]] },
        // 🏺 v3.7.20 寒冰尖刺（遺物 古代法師的隨手小抄 grantSkills 專屬·無魔法書=不可自然學會）：單體水屬性，
        //    對非頭目 50% 固定機率冰凍（status.pct=固定機率擲骰·頭目由 BOSS_IMMUNE 擋·見 applyMobStatus）；視為 10 級法師法術（tier:10 吃階級係數）
        "sk_frost_spike": { n: "寒冰尖刺", type: "atk", tier: 10, reqM: 40, mp: 30, dmgType: "magic", ele: "water", dmgDice: [5, 20], dmgBase: 20, status: { kind: "freeze", force: true, pct: 50, dur: 4 } },

        // 十階魔法 (Lv 40)
        "sk_meteor": { n: "流星雨", type: "atk", tier: 10, reqM: 40, mp: 60, dmgType: "magic", ele: "fire", target: "all", multiDmg: [[2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9]] },
        "sk_soul_up": { n: "靈魂昇華", type: "buff", tier: 10, reqM: 40, mp: 20, dur: 1200, msg: "你覺得身體充滿了活力。" },
        "sk_abs_barrier": { n: "絕對屏障", type: "manual", tier: 10, reqM: 40, mp: 30, mEff: "barrier", dur: 7, label: "增益", msg: "你感覺身體與這個世界隔絕了。" },
        "sk_disintegrate": { n: "究極光裂術", type: "atk", reqJustice: true, tier: 10, reqM: 40, mp: 70, dmgType: "magic", ele: "none", dmgDice: [10, 20], dmgBase: 100 },

        // ================= 【騎士技術】 =================
        "sk_solid_shield": { n: "堅固防護", type: "buff", tier: 2, reqK: 40, hpCost: 30, mp: 5, dur: 180, reqShield: true, d: { er: 15 } },
        "sk_reduction_armor": { n: "增幅防禦", type: "buff", tier: 1, reqK: 30, mp: 10, dur: 1200 },
        "sk_shock_stun": { n: "衝擊之暈", type: "atk", tier: 1, reqK: 30, mp: 12, dmgType: "physical", reqWpn: "w2h", skillAddDmg: 10, stunChance: 0.1, stun: 150 },
        "sk_spike_armor": { n: "尖刺盔甲", type: "buff", tier: 1, reqK: 30, mp: 10, dur: 1200, d: { meleeHit: 5 } },
        "sk_counter_barrier": { n: "反擊屏障", type: "buff", tier: 1, reqK: 30, mp: 10, dur: 64, label: "增益", msg: "你擺出了反擊的架式。" },   // 🔧 雙手武器可發動反擊；原生反擊/居合武器的反擊與居合最終傷害×2（持續64秒，效果結束才再施放）

        // ================= 【妖精精靈魔法】 =================
        // 一階 (Lv 10)
        "sk_elf_mr": { n: "魔法防禦", type: "buff", tier: 1, reqE: 10, mp: 10, dur: 1200, d: { mr: 10 } },
        "sk_elf_mind": { n: "心靈轉換", type: "convert", tier: 1, reqE: 10, hpCost: 8, mpGain: 2 },
        "sk_elf_worldtree": { n: "世界樹的呼喚", type: "passive", tier: 1, reqE: 10 },
        "sk_elf_triple": { n: "三重矢", type: "atk", tier: 1, reqE: 10, mp: 15, dmgType: "physical", ranged: true, reqWpn: "bow", hits: 3 },

        // 二階 (Lv 20)
        "sk_elf_purify": { n: "淨化精神", type: "buff", tier: 2, reqE: 20, mp: 10, dur: 1200, d: { wis: 3 } },
        "sk_elf_eleres": { n: "屬性防禦", type: "buff", tier: 2, reqE: 20, mp: 10, dur: 1200, d: { resFire: 10, resWater: 10, resEarth: 10, resWind: 10 } },
        "sk_elf_release": { n: "釋放元素", type: "atk", tier: 2, reqE: 20, mp: 30, dmgType: "magic", instakill: { tag: "element", cap: 12 } },   // 🔧 即死成功率最高 60%
        "sk_elf_soul": { n: "魂體轉換", type: "convert", tier: 2, reqE: 20, hpCost: 50, mpGain: 15 },

        // 三階 (Lv 30) - 需要對應屬性
        "sk_elf_singleres": { n: "單屬性防禦", type: "buff", tier: 3, reqE: 30, mp: 10, dur: 64, reqEleAny: true },
        "sk_elf_firewpn": { n: "火焰武器", type: "buff", tier: 3, reqE: 30, mp: 20, dur: 1200, reqEle: "fire", d: { meleeDmg: 3 } },
        "sk_elf_windshot": { n: "風之神射", type: "buff", tier: 3, reqE: 30, mp: 15, dur: 1200, reqEle: "wind", d: { rangedHit: 5 } },
        "sk_elf_winddash": { n: "風之疾走", type: "buff", tier: 3, reqE: 30, mp: 20, dur: 1200, reqEle: "wind", moveSpeedMult: 1.33, moveSpeedReplacesCookie: true },
        "sk_elf_earthguard": { n: "大地防護", type: "buff", tier: 3, reqE: 30, mp: 15, dur: 1200, reqEle: "earth", d: { ac: 4 } },
        "sk_elf_groundtrap": { n: "地面障礙", type: "atk", tier: 3, reqE: 30, mp: 20, dmgType: "magic", reqEle: "earth", target: "all", status: { kind: "slow", pbase: 150, dur: 30 } },   // 🤝 Phase4：改為全體緩速
        "sk_elf_watervital": { n: "水之元氣", type: "buff", tier: 3, reqE: 30, mp: 1, dur: 64, reqEle: "water", noRefresh: true, msg: "水之元氣環繞著你。" },   // 🔧 buff 期間內「下次」受到治癒術（玩家自身瞬間治癒，不含持續回復HoT）時恢復量加倍、觸發後7秒冷卻（見 waterVitalHeal）；noRefresh：效果結束才可再施放

        // 四階 (Lv 40)
        "sk_elf_magicerase": { n: "魔法消除", type: "atk", tier: 4, reqE: 40, mp: 30, dmgType: "magic", status: { kind: "mrhalf", pbase: 150, dur: 16 } },
        "sk_elf_summon": { n: "召喚屬性精靈", type: "buff", tier: 4, reqE: 40, mp: 30, dur: 3600, reqEleAny: true, desc: "向締結契約的元素祈求援助，召來與自身屬性相同的精靈並肩作戰。", summon: { n: "夥伴：{ele}之精靈", dmgDice: [1, 40], elemScale: 20, dmgMult: 1.00, mrPenBase: 10, interval: 10, kind: "ranged", eleFromPlayer: true, hitLvOff: 10 } },   // ⚠️ 以下召喚數值欄位(dmgDice/elemScale/dmgMult/mrPenBase/interval/hitLvOff)已被 _elfSpiritKingOverride(js/07·讀 js/23 _spiritSpec 規格表)無條件覆蓋·僅存參考
        "sk_elf_dancefire": { n: "舞躍之火", type: "buff", tier: 4, reqE: 40, mp: 30, dur: 1200, reqEle: "fire", d: { meleeDmg: 3 }, msg: "舞動的火焰環繞全隊，所有隊員的近距離傷害提升。" },   // 🔥 v3.8.3 改團隊光環（TEAM_AURA_SKILLS）：任一來源維持即惠及玩家／傭兵／寵物／召喚物／城堡護衛，近距離傷害 +3（原自身 +5）
        "sk_elf_stormeye": { n: "暴風之眼", type: "buff", tier: 4, reqE: 40, mp: 40, dur: 1200, reqEle: "wind", d: { rangedDmg: 2, rangedHit: 2 } },
        "sk_elf_earthshield": { n: "大地屏障", type: "buff", tier: 4, reqE: 40, mp: 50, dur: 8, reqEle: "earth" },
        "sk_elf_lifespring": { n: "生命之泉", type: "heal", tier: 4, reqE: 40, mp: 50, reqEle: "water", valDice: [4, 35], healDice: [5, 50], healBase: 250, fullRestore: true, ignoreWaterVital: true, healCooldownTicks: 200, msg: "生命之泉使傷勢完全復原。" },
        "sk_elf_earthbless": { n: "大地的祝福", type: "buff", tier: 4, reqE: 40, mp: 35, dur: 1200, reqEle: "earth", d: { ac: 7 } },

        // 五階 (Lv 50)
        "sk_elf_summon2": { n: "召喚強力屬性精靈", type: "buff", tier: 5, reqE: 50, mp: 50, dur: 3600, reqEleAny: true, desc: "以更深的元素契約呼喚高位精靈。精通精靈之道的妖精，甚至能使精靈王親臨戰場。", summon: { n: "夥伴：強力{ele}之精靈", dmgDice: [2, 40], elemScale: 10, dmgMult: 1.18, mrPenBase: 20, interval: 10, kind: "ranged", eleFromPlayer: true, hitLvOff: 20 } },   // ⚠️ 以下召喚數值欄位(dmgDice/elemScale/dmgMult/mrPenBase/interval/hitLvOff)已被 _elfSpiritKingOverride(js/07·讀 js/23 _spiritSpec 規格表)無條件覆蓋·僅存參考
        "sk_elf_lifebless": { n: "生命的祝福", type: "heal", justiceHeal: true, tier: 5, reqE: 50, mp: 30, reqEle: "water", valDice: [1, 20], healDice: [1, 28], healBase: 28, classicHeal: { baseDice: 12, sides: 12, mult: 0.8 }, groupHeal: true, healCooldownTicks: 60, msg: "生命的祝福立即治癒全隊。" },
        "sk_elf_seal": { n: "封印禁地", type: "atk", tier: 5, reqE: 50, mp: 40, dmgType: "magic", reqEleAny: true, status: { kind: "magicseal", pbase: 100, dur: 8 } },
        "sk_elf_muddywater": { n: "污濁之水", type: "atk", tier: 5, reqE: 50, mp: 20, dmgType: "magic", ele: "water", reqEle: "water", bossOnly: true, status: { kind: "muddywater", force: true, dur: 32 }, desc: "只能對頭目施放；必定命中，使其HP自然恢復量減半", msg: "污濁的水流纏繞著目標，阻滯其生命力的匯聚。" },   // 🌊 五階水靈異常：bossOnly=只對頭目施放·force=跳過命中判定(必中)·dur單位秒·效果=js/03 頭目每5秒%回血減半·純異常技(無傷害骰)→js/07 守衛=目標狀態結束前不重複施放
        "sk_elf_blazewpn": { n: "烈炎武器", type: "buff", tier: 5, reqE: 50, mp: 30, dur: 1200, reqEle: "fire", d: { meleeDmg: 5, meleeHit: 5 } },
        "sk_elf_flamesoul": { n: "烈焰之魂", type: "buff", tier: 5, reqE: 50, mp: 30, dur: 1280, reqEle: "fire", noRefresh: true },   // 🔧 持續內近距離一般攻擊武器擲骰必定最大值（見 getPhysicalDmg）；noRefresh：效果結束才可再施放
        "sk_elf_stormshot": { n: "暴風神射", type: "buff", tier: 5, reqE: 50, mp: 30, dur: 1200, reqEle: "wind", d: { rangedDmg: 6, rangedHit: 3 } },
        "sk_elf_preciseshot": { n: "精準射擊", type: "buff", tier: 5, reqE: 50, mp: 15, dur: 64, reqEle: "wind", noRefresh: true, msg: "你的目光變得無比銳利，攻擊精準無比。" },   // 🏹 持續內一般攻擊擲骰1由必定未命中→必定命中（最高命中率可達100%·見 getPhysicalDmg）；noRefresh：效果結束才可再施放
        "sk_elf_steelguard": { n: "鋼鐵防護", type: "buff", tier: 5, reqE: 50, mp: 30, dur: 1200, reqEle: "earth", d: { ac: 10 } },   // 🛡️ 鋼鐵防護：僅施法者自身 AC-10；不再提供全隊百分比減傷
        "sk_elf_attrfire": { n: "屬性之火", type: "buff", tier: 5, reqE: 50, mp: 20, dur: 320, reqEle: "fire", noRefresh: true, msg: "屬性之火在你的攻擊中燃燒。" },   // 🔧 一般攻擊30%機率傷害×1.5（見 playerAttack，與燃燒鬥志同效）；noRefresh：效果結束才可再施放
        "sk_elf_physboost": { n: "體能激發", type: "buff", tier: 5, reqE: 50, mp: 30, dur: 960, reqEle: "earth", noRefresh: true, loadFreeRegen: true, msg: "體能激發，負重之下仍能調息。" },   // 🔧 負重狀態仍可自然恢復HP/MP（見 js/03 _regenHP/_regenMP 與 hasLoadFreeRegen）；noRefresh：效果結束才可再施放
        "sk_elf_energyboost": { n: "能量激發", type: "buff", tier: 5, reqE: 50, mp: 30, dur: 960, reqEle: "fire", noRefresh: true, loadFreeRegen: true, msg: "能量激發，負重之下仍能調息。" },   // 🔧 同體能激發，火屬性版本
        "sk_elf_mirror": { n: "鏡反射", type: "buff", tier: 5, reqE: 50, mp: 10, dur: 16, msg: "你的周身浮現一面鏡子。" },   // 🪞 受魔法傷害時 精神%機率（每1點精神+1%），對施法者造成等量必中固定傷害（見 applyMobMagic）；type:buff → 自動施放且效果結束才再施放
        // ================= 【黑暗妖精魔法】 =================
        // 一階（黑暗妖精 Lv15）
        "sk_dark_str":      { n: "力量提升", type: "buff", tier: 1, reqD: 15, mp: 10, dur: 960, d: { str: 3 }, msg: "你感到力量湧現。" },
        "sk_dark_mrup":     { n: "影之防護", type: "buff", tier: 1, reqD: 15, mp: 12, dur: 960, d: { mr: 5 }, msg: "暗影包覆了你。" },
        "sk_dark_stealth":  { n: "暗隱術", type: "buff", tier: 1, reqD: 15, mp: 10, dur: 32, darkStealth: true, msg: "你隱沒於暗影之中。" },
        "sk_dark_poison":   { n: "附加劇毒", type: "buff", tier: 1, reqD: 15, mp: 10, dur: 320, darkPoison: true, msg: "你的武器淬上了劇毒。" },
        "sk_dark_refine":   { n: "提煉魔石", type: "passive", tier: 1, reqD: 15 },
        // 二階（黑暗妖精 Lv30）
        "sk_dark_dex":      { n: "敏捷提升", type: "buff", tier: 2, reqD: 30, mp: 10, dur: 960, d: { dex: 3 }, msg: "你的身手更敏捷了。" },
        "sk_dark_poisonres":{ n: "毒性抵抗", type: "buff", tier: 2, reqD: 30, mp: 20, dur: 320, msg: "你對毒素產生了抵抗。" },
        "sk_dark_burn":     { n: "燃燒鬥志", type: "buff", tier: 2, reqD: 30, mp: 20, dur: 300, msg: "鬥志在你體內燃燒。" },
        "sk_dark_walkhaste":{ n: "行走加速", type: "buff", tier: 2, reqD: 30, mp: 10, dur: 960, msg: "你的步伐如影般輕快。" },   // 🔧 攻速+15%，可與加速術疊加
        // 三階（黑暗妖精 Lv45）
        "sk_dark_fang":     { n: "暗影之牙", type: "buff", tier: 3, reqD: 45, mp: 20, dur: 192, d: { extraDmg: 5 }, msg: "暗影凝聚成獠牙。" },
        "sk_dark_dodge":    { n: "暗影閃避", type: "buff", tier: 3, reqD: 45, mp: 20, dur: 32, msg: "你能看穿魔法的軌跡。" },
        "sk_dark_crit":     { n: "會心一擊", type: "atk", tier: 3, reqD: 45, darkCrit: true, dmgType: "physical", msg: "你凝聚全身之力，致命一擊！" },
        "sk_dark_erup":     { n: "迴避提升", type: "buff", tier: 3, reqD: 45, mp: 20, dur: 192, d: { er: 12 }, msg: "你的迴避能力提升了。" },
        "sk_dark_double":   { n: "雙重破壞", type: "buff", tier: 3, reqD: 45, mp: 20, dur: 192, msg: "你的攻擊蘊含雙重之力。" },
        "sk_dark_armorbreak":{ n: "破壞盔甲", type: "atk", tier: 3, reqD: 45, mp: 32, dmgType: "magic", status: { kind: "armorbreak", dur: 8 }, msg: "你撕裂了目標的防護，使其受到的傷害提高。" },
        // ================= 【幻術士 記憶水晶法術】（reqI = 幻術士需求等級；一階10/二階20/三階30/四階40） =================
        // 一階幻術
        "sk_illu_ogre":      { n: "幻覺：歐吉", type: "buff", label: "增益", tier: 1, reqI: 10, mp: 20, dur: 64, d: { extraDmg: 4, extraHit: 4 }, illuSummon: "ogre", msg: "你以幻覺塑造出歐吉的形象。" },
        "sk_illu_confuse":   { n: "混亂", type: "atk", tier: 1, reqI: 10, mp: 15, hpCost: 10, dmgType: "magic", ele: "none", dmgDice: [2, 11], status: { kind: "confuse", pbase: 100, dur: 8 }, noRecastStatus: "confuse" },
        "sk_illu_cube_burn": { n: "立方：燃燒", type: "buff", label: "增益", tier: 1, reqI: 10, mp: 30, dur: 20, d: { resFire: 30 }, cube: { iv: 40, kind: "dmg", dice: [1, 20], ele: "fire" }, msg: "燃燒立方在你周身旋轉。" },
        "sk_illu_crush":     { n: "粉碎能量", type: "atk", tier: 1, reqI: 10, mp: 5, dmgType: "physical", weaponDmg: true, magScale: true, msg: "你將能量灌入武器，粉碎目標。", d: "將幻術能量灌入手中武器，化為必中的衝擊，穿透盔甲與堅硬外皮；武器與施術能力越強，威力越盛。" },
        "sk_illu_mirror":    { n: "鏡像", type: "buff", label: "增益", tier: 1, reqI: 10, mp: 10, dur: 1200, d: { er: 25 }, msg: "你分裂出無數鏡像。" },
        // 二階幻術
        "sk_illu_focus":     { n: "專注", type: "buff", label: "增益", tier: 2, reqI: 20, mp: 30, dur: 600, d: { mpR: 4 }, msg: "你進入高度專注。" },
        "sk_illu_lich":      { n: "幻覺：巫妖", type: "buff", label: "增益", tier: 2, reqI: 20, mp: 20, dur: 64, d: { magicDmg: 2 }, illuSummon: "lich", msg: "你以幻覺塑造出巫妖的形象。" },
        "sk_illu_mindbreak": { n: "心靈破壞", type: "atk", tier: 2, reqI: 20, mpDmgPct: 0.05, dmgType: "magic", ele: "none", msg: "你以消耗的魔力撕裂目標的心靈。", d: "燃燒自身魔力侵入敵人的意識，魔力越深厚，撕裂心靈的力量越強；意志堅定的目標較能抵禦。" },
        "sk_illu_cube_quake":{ n: "立方：地裂", type: "buff", label: "增益", tier: 2, reqI: 20, mp: 35, dur: 20, d: { resEarth: 30 }, cube: { iv: 40, kind: "slow" }, msg: "地裂立方在你周身旋轉。" },
        "sk_illu_skullbreak":{ n: "骷髏毀壞", type: "atk", tier: 2, reqI: 20, mp: 30, dmgType: "physical", weaponDmg: true, magScale: true, instakill: { tag: "undead", cap: 12 }, flatBonus: 20, tagReq: "undead", msg: "你試圖將不死者的骨骸徹底粉碎。" },   // 🦴 效果等同起死回生(即死·不死系·最高60%)；即死失敗才造成傷害＝粉碎能量公式+20固定
        // 三階幻術
        "sk_illu_fantasy":   { n: "幻想", type: "atk", tier: 3, reqI: 30, mp: 30, hpCost: 25, dmgType: "magic", ele: "none", dmgDice: [5, 12], status: { kind: "sleep", pbase: 100, dur: 8 }, msg: "你以幻想擾亂目標的心神。" },
        "sk_illu_golem":     { n: "幻覺：鑽石高崙", type: "buff", label: "增益", tier: 3, reqI: 30, mp: 30, hpCost: 25, dur: 64, d: { ac: 10 }, illuSummon: "golem", msg: "你以幻覺塑造出鑽石高崙的形象。" },
        "sk_illu_cube_shock":{ n: "立方：衝擊", type: "buff", label: "增益", tier: 3, reqI: 30, mp: 55, dur: 20, d: { resWind: 30 }, cube: { iv: 50, kind: "mrdown", dur: 4 }, msg: "衝擊立方在你周身旋轉。" },
        "sk_illu_endure":    { n: "耐力", type: "buff", label: "增益", tier: 3, reqI: 30, mp: 25, dur: 600, d: { dr: 2 }, msg: "你的意志化為堅韌的耐力。" },
        // 四階幻術
        "sk_illu_avatar":    { n: "幻覺：化身", type: "buff", label: "增益", tier: 4, reqI: 40, mp: 50, dur: 64, d: { extraDmg: 10 }, dmgTakenReduce: 3, msg: "你化身為幻象的存在。" },   // 🔮 v2.6.7：受傷減免 10%→3%，且改全隊生效（走 teamDmgReduceMult）；額外傷害+10 亦全隊生效（幻覺全隊光環·見 alliesTick 注入）
        "sk_illu_panic":     { n: "恐慌", type: "atk", tier: 4, reqI: 40, mp: 30, hpCost: 30, dmgType: "magic", ele: "none", status: { kind: "panic", pbase: 100, dur: 64 }, noRecastStatus: "panic" },
        "sk_illu_insight":   { n: "洞察", type: "buff", label: "增益", tier: 4, reqI: 40, mp: 60, dur: 640, d: { str: 1, dex: 1, con: 1, int: 1, wis: 1 }, msg: "你的感官變得無比敏銳。" },
        "sk_illu_cube_harmony":{ n: "立方：和諧", type: "buff", label: "增益", tier: 4, reqI: 40, mp: 0, hpCost: 25, dur: 20, cube: { iv: 10, kind: "dmgmp", dice: [1, 25], ele: "fire", val: 5 }, msg: "和諧立方在你周身旋轉，引動魔力。" },   // 🔮 每秒：對當前目標 1D25 火傷 ＋ 自身回 5 MP
        "sk_illu_pain":      { n: "疼痛的歡愉", type: "buff", label: "增益", tier: 4, reqI: 40, mp: 0, hpCost: 40, dur: 64, painReflect: true, msg: "你迎向疼痛，化痛楚為反擊之力。" },
        // ================= 【龍騎士 龍魔法】（reqDk = 龍騎士需求等級；一階15/二階30/三階45；多數消耗 HP） =================
        // —— 一階龍魔法（Lv15）——
        "sk_dragon_armor":         { n: "龍之護鎧", type: "buff", label: "增益", tier: 1, reqDk: 15, mp: 0, hpCost: 12, dur: 1800, noRefresh: true, d: { dr: 5 }, msg: "龍鱗般的護鎧覆上你的身軀。" },
        "sk_dragon_flameslash":    { n: "燃燒擊砍", type: "buff", label: "增益", tier: 1, reqDk: 15, mp: 0, hpCost: 6, dur: 60, noRefresh: true, reqWpnMelee: true, msg: "你的下一擊燃起烈焰。" },
        "sk_dragon_guardbreak":    { n: "護衛毀滅", type: "atk", tier: 1, reqDk: 15, mp: 0, hpCost: 20, fixedStatus: { kind: "guardbreak", chance: 0.10, dur: 32 }, noRecastStatus: "guardbreak" },
        "sk_dragon_lavaspit":      { n: "岩漿噴吐", type: "atk", tier: 1, reqDk: 15, mp: 0, hpCost: 10, dmgType: "magic", ele: "fire", target: "all", multiDmg: [[5, 7]] },
        "sk_dragon_awaken_antares":{ n: "覺醒：安塔瑞斯", type: "buff", label: "增益", tier: 1, reqDk: 15, mp: 20, hpCost: 10, dur: 600, noRefresh: true, awaken: true, d: { ac: 8 }, msg: "你引動安塔瑞斯之力，龍血沸騰、毒麻不侵。" },
        // —— 二階龍魔法（Lv30）——
        "sk_dragon_bloodlust":     { n: "血之渴望", type: "buff", label: "增益", tier: 2, reqDk: 30, mp: 0, hpCost: 30, dur: 300, noRefresh: true, msg: "嗜血的渴望湧現，攻勢更為迅猛。" },
        "sk_dragon_slaughter":     { n: "屠宰者", type: "atk", tier: 2, reqDk: 30, mp: 0, hpCost: 16, slaughter: true, hits: 3 },
        "sk_dragon_terror":        { n: "恐懼無助", type: "atk", tier: 2, reqDk: 30, mp: 0, hpCost: 12, fixedStatus: { kind: "terror", chance: 0.10, dur: 16 }, noRecastStatus: "terror" },
        "sk_dragon_lavabolt":      { n: "岩漿之箭", type: "atk", tier: 2, reqDk: 30, mp: 0, hpCost: 16, dmgType: "magic", ele: "fire", multiDmg: [[10, 8]] },
        "sk_dragon_awaken_falion": { n: "覺醒：法利昂", type: "buff", label: "增益", tier: 2, reqDk: 30, mp: 30, hpCost: 20, dur: 600, noRefresh: true, awaken: true, d: { resFire: 15, resWater: 15, resEarth: 15, resWind: 15 }, msg: "你引動法利昂之力，魔抗與全屬性抗性大增。" },
        // —— 三階龍魔法（Lv45）——
        "sk_dragon_deadlybody":    { n: "致命身軀", type: "buff", label: "增益", tier: 3, reqDk: 45, mp: 0, hpCost: 50, dur: 300, noRefresh: true, msg: "你的身軀化為致命的反擊之刃。" },
        "sk_dragon_deathlightning":{ n: "奪命之雷", type: "atk", tier: 3, reqDk: 45, mp: 0, hpCost: 35, dmgType: "magic", ele: "wind", target: "all", multiDmg: [[8, 8]], status: { kind: "stun", dur: 6 } },
        "sk_dragon_reaper":        { n: "驚悚死神", type: "atk", tier: 3, reqDk: 45, mp: 0, hpCost: 20, fixedStatus: { kind: "doom", chance: 0.50, dur: 32 }, noRecastStatus: "doom" },
        "sk_dragon_awaken_baraka": { n: "覺醒：巴拉卡斯", type: "buff", label: "增益", tier: 3, reqDk: 45, mp: 50, hpCost: 30, dur: 600, noRefresh: true, awaken: true, d: { str: 3, con: 3, dex: 3, int: 3, wis: 3, extraHit: 5 }, msg: "你引動巴拉卡斯之力，全身充滿磅礡之力。" },
        // ================= ⚔️【戰士技能·印記習得】 =================（cat:熱血blood/憤怒rage/忍耐endure）
        // —— 熱血 blood ——
        "sk_warrior_dualaxe":     { n: "迅猛雙斧", type: "passive", cat: "blood", reqW: 15, desc: "以雙手各持一柄鈍器，讓每次揮擊都化為接連不斷的猛攻。" },
        "sk_warrior_crush":       { n: "粉碎", type: "passive", cat: "blood", reqW: 30, desc: "將戰士歷經百戰的力量灌入近身攻擊，等級越高，破壞力越驚人。" },
        "sk_warrior_armorbody":   { n: "護甲身軀", type: "passive", cat: "blood", reqW: 45, desc: "把鎧甲與肉身鍛鍊成一體，防具越堅固，越能卸去迎面而來的衝擊。" },
        "sk_warrior_berserk":     { n: "狂暴", type: "passive", cat: "blood", reqW: 50, desc: "戰意沸騰時爆發超越常人的蠻力，偶爾能揮出格外沉重的一擊。" },
        // —— 忍耐 endure ——
        "sk_warrior_titan_rock":  { n: "泰坦：岩石", type: "passive", cat: "endure", reqW: 50, desc: "身陷危境時喚醒泰坦之力，將敵人的近身猛攻反震回去。" },
        "sk_warrior_titan_magic": { n: "泰坦：魔法", type: "passive", cat: "endure", reqW: 50, desc: "身陷危境時喚醒泰坦之力，使來襲的魔法與戰技反噬施術者。" },
        "sk_warrior_titan_bullet":{ n: "泰坦：子彈", type: "passive", cat: "endure", reqW: 60, desc: "身陷危境時感官變得異常敏銳，更容易避開遠方射來的箭矢。" },
        // —— 憤怒 rage ——
        "sk_warrior_throwaxe":    { n: "戰斧投擲", type: "buff", label: "增益", cat: "rage", reqW: 15, mp: 5, dur: 64, noRefresh: true, reqWpnBlunt: true, throwAxe: true, msg: "你蓄勢待發，斧刃將撕裂一切阻擋。" },   // ⚔️ v3.1.74：持續 64 秒，期間近距離一般攻擊皆附加出血（不再一擊消耗）
        "sk_warrior_roar":        { n: "咆哮", type: "atk", cat: "rage", reqW: 30, mp: 5, roarFixed: true, target: "all" },
        "sk_warrior_endurance":   { n: "體能強化", type: "buff", label: "增益", cat: "rage", reqW: 50, mp: 10, dur: 3000, noRefresh: true, msg: "你的體魄變得更加強韌。" },
        "sk_warrior_outlaw":      { n: "亡命之徒", type: "buff", label: "增益", cat: "rage", reqW: 60, mp: 10, dur: 60, noRefresh: true, msg: "你豁出性命，攻勢勢在必中。" },
        // 👑 王族魔法（reqRoy；cat:'royal' → 技能欄「王族魔法」分區）
        "sk_royal_precise":    { n: "精準目標", type: "buff", label: "增益", cat: "royal", reqRoy: 15, mp: 2, dur: 16, noRefresh: true, msg: "你鎖定全場敵人，使其露出破綻。" },
        "sk_royal_callally":   { n: "呼喚盟友", type: "atk", label: "攻擊", cat: "royal", reqRoy: 30, mp: 30, callAllies: true },
        "sk_royal_burnweapon": { n: "灼熱武器", type: "buff", label: "增益", cat: "royal", reqRoy: 40, mp: 25, dur: 640, noRefresh: true, d: { extraDmg: 5, extraHit: 5 }, msg: "灼熱之炎籠罩全隊武器，所有隊員的額外傷害與命中提升。" },
        "sk_royal_bravewill":  { n: "勇猛意志", type: "buff", label: "增益", cat: "royal", reqRoy: 50, mp: 25, dur: 640, noRefresh: true, msg: "勇猛的意志充盈你的全身。" },
        "sk_royal_shield":     { n: "閃亮之盾", type: "buff", label: "增益", cat: "royal", reqRoy: 50, mp: 25, dur: 640, noRefresh: true, d: { ac: 8 }, msg: "閃亮的護盾環繞全隊，使所有隊員的防禦提升。" },
        "sk_royal_kingguard":  { n: "王者加護", type: "passive", label: "被動", cat: "royal", reqRoy: 50, desc: "亞丁王族不屈的意志護持身心，使邪術與撼動神智的攻擊更難得逞。" },
        // ================= 【魔法頭盔技能】 =================
        // 治癒魔法頭盔技能
        "sk_helm_heal1": { n: "治盔：初級治癒術", mp: 2, type: "heal", justiceHeal: true, valBase: 0, valDice: [1, 15], healDice: [1, 20], healBase: 20, classicHeal: { baseDice: 2, sides: 4 }, label: "恢復", msg: "你感覺舒服了一點。" },
        "sk_helm_heal2": { n: "治盔：中級治癒術", mp: 7, type: "heal", justiceHeal: true, valBase: 0, valDice: [1, 30], healDice: [1, 50], healBase: 50, classicHeal: { baseDice: 4, sides: 8 }, label: "恢復", msg: "你感覺舒服了一點。" },

        // 敏捷魔法頭盔技能
        "sk_helm_dex1": { n: "敏盔：通暢氣脈術", mp: 25, type: "buff", label: "增益", dur: 1200, d: { dex: 5 }, msg: "你覺得身手變得更靈活。" },
        "sk_helm_dex2": { n: "敏盔：加速術", mp: 20, type: "buff", label: "增益", dur: 1200, haste: true, msg: "你感到身體變得非常輕盈。" },

        // 力量魔法頭盔技能
        "sk_helm_str1": { n: "力盔：擬似魔法武器", mp: 10, type: "buff", label: "增益", dur: 1800, d: { extraDmg: 2 }, msg: "你的武器暫時被注入了魔法力量。" },
        "sk_helm_str2": { n: "力盔：無所遁形術", mp: 8, type: "buff", label: "增益", dur: 180 },
        "sk_helm_str3": { n: "力盔：體魄強健術", mp: 25, type: "buff", label: "增益", dur: 1200, d: { str: 5 }, msg: "你覺得身體充滿了力量。" }

    },

    maps: {
        // ⚔️ 決鬥競技場（js/28 存檔 PvP）：出怪池刻意留空＝不會自動出怪，只有按下「挑戰」才由 pvpArenaStart 生成對手。
        //    spawn 路徑取到 undefined base 會在 js/03 早退（if(!base) return;），故空池安全無副作用。
        "arena_pvp": [],
        "pirate_wild": ["nm_035", "nm_003", "doberman", "pirate_wildpoison", "pirate_lizardrage", "pirate_wildfang", "pirate_wilddemon", "pirate_lizardhigh", "pirate_bluetail", "pirate_parrot", "pirate_chest", "wild_tiger", "wild_koreapup", "wild_raccoon"],
        "pirate_dungeon": ["pirate_lizardrage", "pirate_lizardhigh", "pirate_skeleton", "pirate_lizardheavy", "pirate_skelsoldier", "pirate_skelblade", "pirate_skelchief", "pirate_drake"],
        "training": ["orc", "goblin", "orc_archer", "gremlin"],
        "silent_outer": ["orc", "orc_archer", "zombie", "nm_008", "fighter", "nm_002", "nm_001", "wolf", "skeleton", "orc_zombie", "skel_archer", "stone_golem", "bear", "lizardman", "sparto"],
        "elf_grave": ["elf_earthfang","elf_windfang","elf_waterfang","elf_firefang","elf_waterlord","abyss_ghoul","abyss_archer","elf_earthlord","elf_windlord","elf_firelord","abyss_sith","abyss_water","abyss_earth","abyss_wind","abyss_fire","mambo_rabbit","abyss_lord"],
        "hidden_cave": ["demon_bat","de_thief","dark_spirit_mob","armadillo","demon_bear","de_gate_xbow","de_gate_apprentice","ohm_militia","scorpion","dark_spirit_king","de_gate_spear","metal_centipede","monia","darkdweller","ohm_armor","de_train_blacktiger","dark_spirit_caller","de_train_summoner","de_gate_patrol","de_gate_soldier","de_lab_blackmage","fire_beast","beast_tamer","de_gate_general"],
        "giant_tomb": ["tomb_guardian","tomb_guardian_mage","tomb_guardian_knight","tomb_guardian_giant"],
        "demon_temple": ["metal_centipede","flame_avatar","darkdweller","ohm_militia","flame_skba","de_lab_blackmage","flame_skba_queen","ohm_armor","flame_imp","tomb_guardian","flame_baphomet","fallen_priest1","fallen_priest2","fallen_priest3","flame_baless","fallen_priest4","fallen_priest5","flame_demon","fallen_boss"],
        "shadow_temple": ["death_priest_succubus","death_priest_baphomet","chaos_priest_wing","chaos_priest_beast","flameshadow_guard_baphomet","death_boss","chaos_boss"],
        "dream_island": ["nm_038", "nm_039", "nm_040", "nm_036", "nm_041", "nm_042", "nm_043", "nm_044", "nm_023", "nm_024", "nm_045", "nm_028", "nm_029", "nm_030", "nm_031", "nm_032", "nm_037"],
        "kent_outer": ["siege_gate"],
        "kent_inner": ["siege_tower"],
        "ww_outer": ["siege_gate_ww"],
        "ww_inner": ["siege_tower_ww"],
        "heine_outer": ["siege_gate_heine"],
        "heine_inner": ["siege_tower_heine"],
        "windwood_dungeon": ["zombie", "skeleton", "skel_archer", "skel_axe", "skel_spear", "sparto", "ghoul", "ungoliant", "ogre", "cerberus", "ogre_king", "nm_008", "baless"],
        "silver_knight": ["orc", "goblin", "orc_archer", "gremlin", "侏儒", "nm_003", "zombie", "fighter", "ice_wolf", "wolf", "gnome_warrior", "skeleton", "orc_mage", "stone_golem", "hobgoblin", "b_knight", "ghoul", "sparto", "lycan", "dragon_turtle"],
        "talking_island": ["orc", "goblin", "orc_archer", "gremlin", "侏儒", "nm_035", "nm_003", "doberman", "zombie", "floating_eye", "fighter", "wolf", "skeleton", "stone_golem", "spider"],
        "zone_01": ["orc", "orc_archer", "nm_002", "nm_003", "侏儒", "fighter", "zombie", "wolf", "gandi_orc", "orc_mage", "rova_orc", "stone_golem", "atuba_orc", "duda_orc", "neruga_orc", "nm_007", "nm_009", "wild_kangaroo"],
        "talking_island_port": ["fighter", "wolf", "stone_golem", "spider", "b_knight", "elder", "kurt"],
        "elf_forest": ["orc_archer", "nm_003", "fighter", "wolf", "gandi_orc", "orc_mage", "rova_orc", "orc_scout", "atuba_orc", "duda_orc", "ghoul", "sparto", "neruga_orc", "lycan", "gaster", "dark_elf", "ogre_warrior", "gaster_king", "wild_monkey"],
        "gludio": ["orc", "goblin", "orc_archer", "gremlin", "侏儒", "nm_035", "nm_003", "zombie", "doberman", "fighter", "wolf", "skeleton", "orc_mage", "skel_archer", "stone_golem", "hobgoblin", "spider", "ghoul", "sparto", "nm_011", "lycan", "elder", "ogre", "ogre_warrior", "wild_beagle", "wild_collie"],
        "windwood": ["orc_archer", "fighter", "nm_035", "nm_003", "doberman", "floating_eye", "gnome_warrior", "wolf", "orc_mage", "stone_golem", "hobgoblin", "lizardman", "ant", "lycan", "harpy"],
        "desert": ["evil_lizard", "scorpion", "ant", "giant_ant", "lizardman", "stone_golem", "sparto", "wolf", "griffon"],
        "kent": ["orc", "goblin", "orc_archer", "gremlin", "nm_002", "侏儒", "nm_035", "nm_003", "doberman", "nm_006", "fighter", "gnome_warrior", "wolf", "stone_golem", "spider", "hobgoblin", "bear", "lycan", "ungoliant", "elder", "harpy", "ogre_warrior"],
        "dragon_valley": ["侏儒", "nm_003", "wolf", "gnome_warrior", "sparto", "lycan", "scorpion", "harpy", "skel_sniper", "skel_guard", "dark_elf", "ogre_warrior", "skel_fighter", "arian", "wyvern", "blackelder"],
        "fire_dragon": ["侏儒", "gnome_warrior", "fire_archer", "bomb_flower", "dragon_fly", "fire_warrior", "salamander", "fire_egg", "lava_golem", "ashitakio", "ifrit", "fire_beast", "phoenix"],
        "giran": ["goblin", "侏儒", "nm_006", "gnome_warrior", "hobgoblin", "bear", "lizardman", "wolf", "spider", "lycan", "ungoliant", "gaster", "bandit", "bandit_boss", "griffon", "dark_elf", "gaster_king", "fire_egg", "cyclops", "wild_panda"],
        "heine": ["croc", "spider", "bear", "lizardman", "troglodyte", "lycan", "ungoliant", "lamia", "giant_croc", "beholder", "wild_cat"],
        "twilight_mt": ["giant", "giant_warrior", "giant_elder", "giant_ancient"],
        "mirror_forest": ["doppelganger", "doppel_boss", "crabman", "croc", "dragon_turtle", "beholder", "spider", "ungoliant", "lamia"],
        "zone_02": ["侏儒", "nm_005", "nm_004", "zombie", "ice_wolf", "gnome_warrior", "bear", "troglodyte", "ghoul", "nm_012", "nm_014", "nm_015", "nm_019", "nm_020", "nm_021", "wild_fox"],
        "zone_03": ["nm_012", "nm_014", "nm_015", "nm_017", "nm_019", "nm_020", "nm_021", "nm_022", "wild_stbernard", "wild_rabbit"],
        "crystal_cave1": ["nm_002", "nm_012", "nm_046", "nm_017", "nm_019", "nm_020", "nm_022"],
        "crystal_cave2": ["nm_002", "nm_012", "nm_046", "nm_017", "nm_019", "nm_020", "nm_022", "ice_demon"],
        "crystal_cave3": ["nm_046", "nm_017", "nm_019", "nm_020", "ice_maid", "ice_queen"],
        "zone_04": ["zombie", "ghoul", "nm_014", "nm_015", "nm_021"],
        "zone_05": ["nm_004", "nm_012", "nm_014", "nm_046", "nm_015", "nm_017", "nm_019", "nm_020", "nm_022"],
        "zone_06": ["orc", "orc_archer", "zombie", "fighter", "skeleton", "skel_archer", "ghoul", "sparto"],
        "zone_07": ["zombie", "skeleton", "skel_archer", "skel_spear", "spider", "ghoul", "sparto", "ungoliant", "ogre"],
        "zone_08": ["zombie", "skeleton", "skel_archer", "stone_golem", "ghoul", "sparto", "ungoliant", "ogre", "sema", "batus", "casper", "marcus"],
        "zone_09": ["zombie", "skeleton", "skel_archer", "spider", "ghoul", "sparto", "ungoliant", "ogre", "cerberus", "sema", "batus", "casper", "marcus"],
        "zone_10": ["skeleton", "skel_archer", "skel_axe", "skel_spear", "ghoul", "sparto", "ungoliant", "ogre", "cerberus", "dk"],
        "zone_11": ["floating_eye", "nm_008", "skel_archer", "ghoul", "sparto", "ungoliant", "elder", "ogre", "cerberus", "ogre_king", "necromancer", "dk"],
        "zone_12": ["nm_008", "skel_archer", "ghoul", "sparto", "ungoliant", "ogre", "cerberus", "ogre_king", "dk"],
        "zone_13": ["orc", "zombie", "floating_eye", "fighter", "wolf", "skeleton", "skel_archer", "stone_golem", "elder"],
        "zone_14": ["zombie", "floating_eye", "wolf", "skeleton", "skel_archer", "skel_axe", "skel_spear", "stone_golem", "spider", "sparto", "baphomet"],
        "zone_15": ["orc", "orc_archer", "zombie", "fighter", "nm_007", "nm_009", "nm_002", "nm_001"],
        "zone_16": ["nm_002", "fighter", "wolf", "gandi_orc", "rova_orc", "duda_orc", "nm_007", "nm_009"],
        "zone_17": ["nm_002", "atuba_orc", "ghoul", "sparto", "neruga_orc", "gaster", "nm_007", "nm_009"],
        "zone_18": ["orc_zombie", "bear", "ghoul", "sparto"],
        "zone_19": ["orc_zombie", "bear", "ghoul", "lycan"],
        "zone_20": ["orc_zombie", "bear", "gaster"],
        "zone_21": ["bear", "gaster", "cerberus", "dark_elf"],
        "zone_22": ["orc", "zombie", "floating_eye", "fighter", "wolf", "skeleton", "skel_archer", "stone_golem", "spider"],
        "zone_23": ["zombie", "ghoul", "sparto", "ogre"],
        "zone_24": ["skeleton", "skel_archer", "skel_axe", "skel_spear", "ghoul", "sparto", "ogre"],
        "zone_25": ["ogre", "cerberus", "ogre_king"],
        "zone_26": ["sparto", "ungoliant", "skel_sniper", "skel_guard", "troll", "skel_fighter"],
        "zone_27": ["skel_sniper", "skel_guard", "troll", "skel_fighter", "monia"],
        "zone_28": ["skel_sniper", "skel_guard", "troll", "skel_fighter", "monia", "aruba"],
        "zone_29": ["skel_sniper", "skel_guard", "troll", "skel_fighter", "monia", "aruba", "succubus"],
        "zone_30": ["monia", "aruba", "succubus", "succubus_queen"],
        "zone_31": ["aruba", "succubus", "succubus_queen"],
        "zone_32": ["ant", "giant_ant", "ant_white", "ant_giant_white"],
        "zone_33": ["ant", "giant_ant", "ant_enh", "ant_enh_white", "ant_assault", "ant_giant_enh_white"],
        "zone_34": ["croc", "roach", "lizardman", "troglodyte", "ratman", "lamia"],
        "zone_35": ["croc", "roach", "crabman", "ratman", "lamia", "beholder"],
        "zone_36": ["croc", "crabman", "ratman", "lamia", "beholder"],
        "eva_kingdom": ["crabman", "mermaid", "nm_010", "starfish", "sildeis", "electon", "crustacean"],
        "zone_37": ["nm_013", "nm_016", "nm_018", "nm_022"],
        "zone_38": ["nm_013", "nm_016", "nm_018", "nm_022"],
        "zone_39": ["nm_025", "nm_026", "nm_027", "nm_033"],
        "zone_40": ["nm_025", "nm_026", "nm_027", "nm_033"],
        "zone_41": ["nm_025", "nm_026", "nm_027", "nm_033"],
        // ===== 🏛️ 隱藏狩獵區域出怪池（僅能由對應地圖手動傳送進入；不列於地圖選單、魔物追蹤亦無法指定·見 obelMapList 排除） =====
        "hidden_lab_nolife": ["iv_paper", "iv_stone_golem", "iv_iron_golem", "iv_jelly", "iv_armor", "iv_deathsword", "iv_lightball", "iv_mimi"],
        "hidden_lab_darkmagic": ["iv_elder", "iv_blackelder", "iv_chimera", "iv_lamia", "iv_blackmage"],
        "hidden_seal_spirit": ["iv_blackmage", "iv_reaper", "iv_shadow", "iv_spirit", "iv_baless", "iv_karuta", "iv_hatin"],
        "hidden_seal_monster": ["iv_shadow", "iv_spirit", "iv_baless", "iv_flameslave", "iv_imp", "iv_baphomet", "iv_hatin"],
        "hidden_seal_demon": ["iv_baless", "iv_flameslave", "iv_imp", "iv_baphomet", "iv_wing", "iv_flameshadow", "iv_demonshadow", "nm_034"],
        "hidden_antqueen": ["ant_assault", "ant_giant_enh_white", "ant_guard", "ant_queen"],
        "rastabad_cave1": ["ohm", "ohm_rage", "ohm_armor", "ohm_armor_rage"],
        "rastabad_cave2": ["de_remnant_bow", "de_remnant_sword", "de_remnant_xbow", "de_remnant_mage", "de_remnant_2h"],
        "rastabad_cave3": ["de_remnant_bow", "de_remnant_sword", "de_remnant_xbow", "de_remnant_mage", "de_remnant_2h", "dark_spirit_caller"],
        "rastabad_gate": ["de_gate_xbow", "de_gate_apprentice", "de_gate_spear", "de_gate_patrol", "de_gate_soldier", "de_gate_general"],
        "rastabad_beast": ["de_gate_general", "de_train_blacktiger", "de_train_tamer", "de_train_cursetamer", "de_train_hellhound", "de_train_soulknight", "de_train_summoner", "de_train_gatekeeper"],   // 🌑 v3.4.21 地獄奴隸移出：地獄奴隸改為只在黑暗妖精聖地(sanct_hellslave)出沒（原 de_train_hellslave 孤兒定義已刪）
        "king_baranka_room": ["de_king_baranka"],
        "law_king_room": ["de_king_laia"],
        "necro_king_room": ["de_king_heruby"],
        "assassin_king_room": ["de_king_slayer"],
        "thebes_desert": ["thebes_mandra_w", "thebes_mandra", "thebes_scarab", "thebes_scarab_b", "thebes_kebis_b", "thebes_kebis_r", "thebes_obelisk", "thebes_obelisk_b", "thebes_sphinx", "thebes_sphinx_b"],
        "thebes_pyramid": ["thebes_nehos", "thebes_nehos_b", "thebes_bas", "thebes_bas_r", "thebes_anus", "thebes_anus_b"],
        "thebes_temple": ["thebes_horus", "thebes_anubis"],
        "tikal_area": ["tikal_azt", "tikal_azt_y", "tikal_yuka_b", "tikal_yuka_w", "tikal_kaira_b", "tikal_kaira_y", "tikal_bara", "tikal_bara_r", "tikal_eto", "tikal_eto_dry"],
        "tikal_deep": ["tikal_eto", "tikal_eto_dry", "tikal_mud", "tikal_mud_k", "tikal_ska_p", "tikal_ska_r", "tikal_teo_b", "tikal_teo_y"],
        "tikal_altar": ["tikal_boss_m", "tikal_boss_f"],
        // ===== 🌅 日出之國（時空裂痕·暫用既有怪物；待日出之國專屬怪物完成後替換） =====
        "sunrise_castle": ["sr_narikama", "sr_kamaitachi", "sr_rokurokubi", "sr_karakasa", "sr_ushioni_child", "sr_narikama_rage", "sr_kamaitachi_elder"],
        "sunrise_east": ["sr_rokurokubi", "sr_karakasa", "sr_ushioni_child", "sr_narikama_rage", "sr_kamaitachi_elder", "sr_kappa", "sr_akaoni", "sr_aooni", "sr_tamamo"],
        "sunrise_west": ["sr_kappa", "sr_akaoni", "sr_aooni", "sr_nue", "sr_tengu", "sr_asura", "sr_ushioni_child", "sr_ushioni"],
        "sunrise_north": ["sr_akaoni", "sr_aooni", "sr_nue", "sr_tengu", "sr_asura", "sr_narikama_rage", "sr_kamaitachi_elder", "sr_gashadokuro"],
        "dark_magic_lab": ["de_lab_earth", "de_lab_water", "de_lab_wind", "de_lab_fire", "de_lab_mage", "de_lab_blackmage", "de_train_gatekeeper"],
        "necro_training": ["de_necro_avenger", "de_necro_warlock", "de_necro_omwarrior", "de_necro_darklord", "de_necro_bloodknight", "de_necro_omheavy", "de_train_gatekeeper"],
        "elder_room": ["de_elder_guard", "de_elder_captain", "de_elder_follower", "de_lab_blackmage", "de_train_soulknight", "de_necro_bloodknight", "dark_spirit_king", "darkdweller", "de_lab_earth", "de_lab_water", "de_lab_fire", "de_lab_wind", "dark_spirit_caller", "de_elder_kina", "de_elder_andis", "de_elder_batas", "de_elder_balos", "de_elder_balud", "de_elder_ramas", "de_elder_taimas", "de_elder_adiel"],   // 🏛️ 格蘭肯神殿．長老之室：3 新一般怪 + 既有出沒怪物 + 8 長老 BOSS（BOSS 出場由 spawnMob 節流：場上最多 2 隻、第 1 隻存活滿 3 分鐘才出第 2 隻）
        // ===== 🌑 黑暗妖精聖地（依《黑暗妖精聖地.md》設定·v3.3.33）：三張圖皆「無法從地圖選單選擇」＝只在 DB.maps（隱藏區前例 hidden-area）·入口＝長老會議廳(town_elder_council) NPC 真．冥皇丹特斯（消耗 死亡騎士之書／吉爾塔斯的封印）=====
        "dark_elf_sanctuary": ["sanct_hellslave", "de_necro_omheavy", "sanct_cursed_fighter", "sanct_cursed_mage", "sanct_cursed_knight", "sanct_scavenger", "sanct_tethys", "sanct_wyvern"],
        "cursed_dark_elf_sanctuary": ["sanct_giltas"],   // 純BOSS房：吉爾塔斯（完整的召喚球＝戰敗保留其HP·見 js/05 revive／js/03 spawnMob）
        "collapsed_elder_council_hall": ["sanct_dantes"],   // 純BOSS房：真‧死亡騎士 冥皇丹特斯（交出吉爾塔斯的封印後傳送）
        "antaras_lair": ["antaras"],
        "fafurion_lair": ["fafurion"],
        "valakas_lair": ["valakas"],
        // ===== 🗼 傲慢之塔 =====
        // 攀登樓層（pride_f2~f10）：每層含「往上層的樓梯」(F2~F9) 或頭目(F10)；擊敗即前往下一層
        "pride_f2":  ["pride_lamia", "pride_ungoliant", "pride_medusa", "pride_stairs"],
        "pride_f3":  ["pride_lamia", "pride_ungoliant", "pride_medusa", "pride_chimera", "pride_stairs"],
        "pride_f4":  ["pride_lamia", "pride_ungoliant", "pride_medusa", "pride_chimera", "pride_stairs"],
        "pride_f5":  ["pride_medusa", "pride_chimera", "arian", "pride_stairs"],
        "pride_f6":  ["pride_medusa", "pride_chimera", "arian", "pride_stairs"],
        "pride_f7":  ["pride_medusa", "pride_chimera", "arian", "pride_stairs"],
        "pride_f8":  ["pride_medusa", "pride_chimera", "arian", "pride_stairs"],
        "pride_f9":  ["pride_medusa", "pride_chimera", "arian", "pride_stairs"],
        "pride_f10": ["pride_medusa", "pride_chimera", "arian", "pride_jenis"],
        // 直接挑戰的 2~10 樓farming（擊敗頭目不前進）
        "pride_2_10": ["pride_lamia", "pride_ungoliant", "pride_medusa", "pride_chimera", "arian", "pride_jenis"],   // 🐍🕷️ 補上變種蛇女/變種楊果里恩（原僅攀登樓 pride_f2~f4 有、自由farming層漏列）
        // 攀登 11~20 樓（succubus=思克巴）
        "pride_f11": ["succubus", "pride_wolf", "pride_stairs"],
        "pride_f12": ["succubus", "pride_wolf", "pride_mimic", "pride_stairs"],
        "pride_f13": ["succubus", "pride_wolf", "pride_mimic", "pride_stairs"],
        "pride_f14": ["succubus", "pride_wolf", "pride_mimic", "pride_stairs"],
        "pride_f15": ["pride_beholder", "pride_wolf", "pride_mimic", "pride_stairs"],
        "pride_f16": ["pride_beholder", "pride_wolf", "pride_mimic", "pride_stairs"],
        "pride_f17": ["pride_beholder", "pride_wolf", "pride_deathsword", "pride_stairs"],
        "pride_f18": ["pride_beholder", "pride_wolf", "pride_deathsword", "pride_stairs"],
        "pride_f19": ["pride_beholder", "pride_wolf", "pride_deathsword", "pride_stairs"],
        "pride_f20": ["pride_beholder", "pride_wolf", "pride_deathsword", "pride_phantom_boss"],
        "pride_11_20": ["succubus", "pride_wolf", "pride_mimic", "pride_beholder", "pride_deathsword", "pride_phantom_boss"],
        // 攀登 21~30 樓
        "pride_f21": ["pride_fireegg", "pride_nightmare", "pride_stairs"],
        "pride_f22": ["pride_fireegg", "pride_nightmare", "pride_hellhound", "pride_stairs"],
        "pride_f23": ["pride_fireegg", "pride_nightmare", "pride_hellhound", "pride_stairs"],
        "pride_f24": ["pride_fireegg", "pride_nightmare", "pride_hellhound", "pride_stairs"],
        "pride_f25": ["pride_nightmare", "pride_hellhound", "pride_imp", "pride_stairs"],
        "pride_f26": ["pride_nightmare", "pride_hellhound", "pride_imp", "pride_stairs"],
        "pride_f27": ["pride_ifrit", "pride_hellhound", "pride_imp", "pride_stairs"],
        "pride_f28": ["pride_ifrit", "pride_hellhound", "pride_imp", "pride_stairs"],
        "pride_f29": ["pride_ifrit", "pride_hellhound", "pride_imp", "pride_stairs"],
        "pride_f30": ["pride_ifrit", "pride_hellhound", "pride_imp", "pride_nightmare", "pride_vampire_boss"],
        "pride_21_30": ["pride_ifrit", "pride_fireegg", "pride_hellhound", "pride_imp", "pride_nightmare", "pride_vampire_boss"],
        // 攀登 31~40 樓
        "pride_f31": ["pride_skel_axe", "pride_ghoul2", "pride_stairs"],
        "pride_f32": ["pride_skel_axe", "pride_skel_spear", "pride_ghoul2", "pride_stairs"],
        "pride_f33": ["pride_sparto", "pride_skel_spear", "pride_ghoul2", "pride_stairs"],
        "pride_f34": ["pride_sparto", "pride_skel_spear", "pride_ghoul2", "pride_stairs"],
        "pride_f35": ["pride_sparto", "pride_skel_archer", "pride_ghoul2", "pride_stairs"],
        "pride_f36": ["pride_sparto", "pride_skel_archer", "pride_ghoul2", "pride_stairs"],
        "pride_f37": ["pride_sparto", "pride_skel_archer", "pride_skel_fighter", "pride_stairs"],
        "pride_f38": ["pride_sparto", "pride_skel_archer", "pride_skel_fighter", "pride_stairs"],
        "pride_f39": ["pride_sparto", "pride_skel_archer", "pride_skel_fighter", "pride_stairs"],
        "pride_f40": ["pride_sparto", "pride_skel_archer", "pride_skel_fighter", "pride_zombie_king"],
        "pride_31_40": ["pride_skel_axe", "pride_skel_spear", "pride_ghoul2", "pride_sparto", "pride_skel_archer", "pride_skel_fighter", "pride_zombie_king"],
        // 攀登 41~50 樓
        "pride_f41": ["pride_drake", "pride_flamesoul_r", "pride_flamesoul_b", "pride_stairs"],
        "pride_f42": ["pride_irongolem", "pride_flamesoul_r", "pride_flamesoul_b", "pride_stairs"],
        "pride_f43": ["pride_drake", "pride_flamesoul_r", "pride_flamesoul_b", "pride_stairs"],
        "pride_f44": ["pride_drake", "pride_flamesoul_r", "pride_flamesoul_b", "pride_stairs"],
        "pride_f45": ["pride_drake", "pride_flamesoul_r", "pride_flamesoul_b", "pride_stairs"],
        "pride_f46": ["pride_drake", "pride_flamesoul_r", "pride_flamesoul_b", "pride_stairs"],
        "pride_f47": ["pride_drake", "pride_flamemage", "pride_bonedragon", "pride_stairs"],
        "pride_f48": ["pride_drake", "pride_flamemage", "pride_bonedragon", "pride_stairs"],
        "pride_f49": ["pride_drake", "pride_flamemage", "pride_bonedragon", "pride_stairs"],
        "pride_f50": ["pride_drake", "pride_flamemage", "pride_bonedragon", "pride_panther_boss"],
        "pride_41_50": ["pride_drake", "pride_flamemage", "pride_bonedragon", "pride_irongolem", "pride_flamesoul_r", "pride_flamesoul_b", "pride_panther_boss"],
        // 攀登 51~60 樓
        "pride_f51": ["pride_curse_zombie", "pride_curse_soldier", "pride_stairs"],
        "pride_f52": ["pride_curse_zombie", "pride_curse_soldier", "pride_curse_mage", "pride_stairs"],
        "pride_f53": ["pride_curse_zombie", "pride_curse_soldier", "pride_curse_general", "pride_stairs"],
        "pride_f54": ["pride_curse_mage", "pride_curse_soldier", "pride_curse_general", "pride_stairs"],
        "pride_f55": ["pride_curse_mage", "pride_curse_soldier", "pride_curse_general", "pride_stairs"],
        "pride_f56": ["pride_curse_mage", "pride_curse_soldier", "pride_curse_general", "pride_stairs"],
        "pride_f57": ["pride_curse_mage", "pride_curse_zombie", "pride_curse_general", "pride_stairs"],
        "pride_f58": ["pride_curse_zombie", "pride_curse_mage", "pride_curse_soldier", "pride_curse_general", "pride_stairs"],
        "pride_f59": ["pride_curse_mage", "pride_curse_soldier", "pride_curse_general", "pride_stairs"],
        "pride_f60": ["pride_curse_mage", "pride_curse_soldier", "pride_curse_general", "pride_mummy_king"],
        "pride_51_60": ["pride_curse_zombie", "pride_curse_mage", "pride_curse_soldier", "pride_curse_general", "pride_mummy_king"],
        // 攀登 61~70 樓
        "pride_f61": ["pride_dark_lycan", "pride_ice_tiger", "pride_stairs"],
        "pride_f62": ["pride_dark_lycan", "pride_ice_tiger", "pride_flame_beast", "pride_stairs"],
        "pride_f63": ["pride_dark_lycan", "pride_ice_tiger", "pride_flame_atki", "pride_stairs"],
        "pride_f64": ["pride_dark_lycan", "pride_ice_tiger", "pride_flame_beast", "pride_flame_atki", "pride_stairs"],
        "pride_f65": ["pride_ice_tiger", "pride_flame_beast", "pride_flame_atki", "pride_stairs"],
        "pride_f66": ["pride_ice_tiger", "pride_flame_beast", "pride_flame_atki", "pride_stairs"],
        "pride_f67": ["pride_dark_lycan", "pride_flame_beast", "pride_flame_atki", "pride_stairs"],
        "pride_f68": ["pride_dark_lycan", "pride_ice_tiger", "pride_flame_beast", "pride_flame_atki", "pride_stairs"],
        "pride_f69": ["pride_ice_tiger", "pride_flame_beast", "pride_flame_atki", "pride_stairs"],
        "pride_f70": ["pride_ice_tiger", "pride_flame_beast", "pride_flame_atki", "pride_iris_boss"],
        "pride_61_70": ["pride_dark_lycan", "pride_ice_tiger", "pride_flame_beast", "pride_flame_atki", "pride_iris_boss"],
        // 攀登 71~80 樓
        "pride_f71": ["pride_dark_blackknight", "pride_dark_flamewarrior", "pride_stairs"],
        "pride_f72": ["pride_dark_blackknight", "pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_stairs"],
        "pride_f73": ["pride_dark_blackknight", "pride_dark_flamewarrior", "pride_dark_succubus_queen", "pride_stairs"],
        "pride_f74": ["pride_dark_blackknight", "pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_stairs"],
        "pride_f75": ["pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_stairs"],
        "pride_f76": ["pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_stairs"],
        "pride_f77": ["pride_dark_blackknight", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_stairs"],
        "pride_f78": ["pride_dark_blackknight", "pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_stairs"],
        "pride_f79": ["pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_stairs"],
        "pride_f80": ["pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_vander_boss"],
        "pride_71_80": ["pride_dark_blackknight", "pride_dark_flamewarrior", "pride_dark_flamearcher", "pride_dark_succubus_queen", "pride_vander_boss"],
        // 攀登 81~90 樓
        "pride_f81": ["pride_proud_jenis", "pride_small_phantom", "pride_marcus_vampire", "pride_stairs"],
        "pride_f82": ["pride_proud_jenis", "pride_small_phantom", "pride_marcus_vampire", "pride_stairs"],
        "pride_f83": ["pride_proud_jenis", "pride_small_phantom", "pride_terror_zombie_king", "pride_stairs"],
        "pride_f84": ["pride_proud_jenis", "pride_small_phantom", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_stairs"],
        "pride_f85": ["pride_small_phantom", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_stairs"],
        "pride_f86": ["pride_small_phantom", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_stairs"],
        "pride_f87": ["pride_proud_jenis", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_stairs"],
        "pride_f88": ["pride_proud_jenis", "pride_small_phantom", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_stairs"],
        "pride_f89": ["pride_small_phantom", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_stairs"],
        "pride_f90": ["pride_small_phantom", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_lich_boss"],
        "pride_81_90": ["pride_proud_jenis", "pride_small_phantom", "pride_marcus_vampire", "pride_terror_zombie_king", "pride_lich_boss"],
        // 攀登 91~100 樓
        "pride_f91":  ["pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_stairs"],
        "pride_f92":  ["pride_iris_mob", "pride_mummy_king_mob", "pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_stairs"],
        "pride_f93":  ["pride_iris_mob", "pride_mummy_king_mob", "pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_stairs"],
        "pride_f94":  ["pride_iris_mob", "pride_mummy_king_mob", "pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_vander_mob", "pride_stairs"],
        "pride_f95":  ["pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_stairs"],
        "pride_f96":  ["pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_stairs"],
        "pride_f97":  ["pride_iris_mob", "pride_mummy_king_mob", "pride_fire_king", "pride_vander_mob", "pride_stairs"],
        "pride_f98":  ["pride_iris_mob", "pride_mummy_king_mob", "pride_water_king", "pride_vander_mob", "pride_stairs"],
        "pride_f99":  ["pride_iris_mob", "pride_mummy_king_mob", "pride_water_king", "pride_vander_mob", "pride_stairs"],
        "pride_f100": ["pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_reaper_boss"],
        "pride_91_100": ["pride_iris_mob", "pride_mummy_king_mob", "pride_earth_king", "pride_water_king", "pride_wind_king", "pride_fire_king", "pride_vander_mob", "pride_reaper_boss"],
        "oblivion_travel": ["lamia", "mermaid", "harpy", "griffon", "sildeis", "obli_portal"],
        // 🐉 v3.7.57 侵蝕的安塔瑞斯巢穴（副本·不進 MAP_CATEGORIES/MAP_REGIONS＝不列下拉·進場走 js/05 antharas 狀態機·頭目由固定佈陣生成非池抽）
        "antharas_nest_1": ["ant_kama_nan", "ant_kama_flame"],
        "antharas_nest_2": ["ant_kama_nan", "ant_kama_flame"],
        "antharas_nest_3": ["ant_kama_nan", "ant_kama_flame", "ant_earth_wild_dragon"],
        "antharas_lair":   ["ant_earth_wild_dragon"],
        "oblivion_island": ["obli_croc", "obli_werewolf", "obli_sharlob", "obli_arian", "obli_darkelf", "obli_bear", "obli_lizardman", "obli_kasta", "obli_lamia", "obli_lycan", "obli_axetaurus", "obli_troll", "obli_ungoliant", "obli_griffon", "obli_hammertaurus", "obli_harpy", "obli_shapeshifter", "obli_bigcroc", "obli_kastaking", "obli_doro", "obli_aruba", "obli_trollking", "obli_evillizard", "obli_cyclops", "obli_wyvern", "obli_bigtaurus"]
    }
}; // DB 結尾在這裡

// ===== Lv51+ 頭目基礎 HP 曲線 =====
// 只提高低於同級下限的頭目，不降低既有高血量；卡瑞維持原始 3,000 HP。
(function normalizeHighLevelBossHp() {
    function hpFloor(lv) {
        let raw;
        if (lv < 60) raw = 10000 + (lv - 51) * 1250;
        else if (lv < 70) raw = 20000 + (lv - 60) * 2000;
        else if (lv < 80) raw = 40000 + (lv - 70) * 2500;
        else if (lv < 90) raw = 65000 + (lv - 80) * 3000;
        else raw = 100000 + (lv - 90) * 5000;
        return Math.round(raw / 500) * 500;
    }
    Object.keys(DB.mobs).forEach(id => {
        let mob = DB.mobs[id];
        if (!mob || !mob.boss || (mob.lv || 0) < 51 || mob.n === '卡瑞' || mob.race === '建築' || mob.noHpCurve) return;   // 🌅 noHpCurve：日出之國三段變身鏈/巨大骷髏＝HP 照 MD 手填（變身鏈難度弧線刻意遞減·比照卡瑞豁免）
        mob.hp = Math.max(mob.hp || 1, hpFloor(mob.lv));
    });
})();

// ===== 頭目傷害曲線（基準：玩家 AC -50、MR 100）=====
// 普攻依等級與攻擊間隔分配單次傷害；技能依冷卻、範圍、控場與段數分配總傷害。
// 僅改變傷害載荷，不改技能種類、觸發率、控制率、血量或命中。
(function normalizeBossDamageByLevel() {
    const AC50_AVG_REDUCTION = 13;
    const MR100_MULT = 0.5;
    // 與戰鬥系統的 MOB_PARTY_AOE_SKILLS 同步；00-data 載入時該清單尚未建立。
    const PARTY_AOE_SKILLS = new Set([
        '闇黑波動', '毒霧', '鐮刀波動', '火焰之舞', '燃燒的火球', '火焰之陣', '地面震裂',
        '跳躍波動', '冰雪暴', '震裂術', '火焰噴吐', '流星雨', '火牢', '寒冰噴吐', '巨水炮',
        '大地怒吼', '毒氣風暴', '閃電風暴', '火焰雨', '寒冰吐息', '地獄犬噴吐', '火風暴',
        '龍捲風', '爆炎的火球', '噴火', '漩渦', '防身電擊', '震裂踏擊', '火焰放射', '黑霧',
        '火焰氣息', '黑暗流星雨', '放射斬', '迴旋鞭打', '衝擊波動', '千刃破軍', '靈魂波動',
        '火焰爆發', '迴旋斬', '龍的一擊', '地獄火', '黑魔法力場', '鐮刀劍氣斬', '腐蝕之血',
        '冰錐流星雨', '水氣爆裂', '集體衝暈', '巨石爆裂', '地面障礙', '邪靈之氣',
        '血夜月彎刀', '夜魔飛襲', '幻象光線', '集體相消', '劇毒龍捲風', '麻痺蜘蛛網',
        '雷霆風暴', '沙塵暴', '震裂重擊', '冰雪颶風',
        '火焰散落', '鎌鼬旋風', '寒冰氣息', '妖狐之火', '牛鬼突進', '大地崩裂', '幽魂怨念',   // 🌅 日出之國全體技（與 js/01 MOB_PARTY_AOE_SKILLS 同步）
        '屬性噴吐', '劇毒噴吐', '毀滅隕石'   // 🐉 v3.7.57 安塔瑞斯副本全體技（與 js/01 MOB_PARTY_AOE_SKILLS 同步）
    ]);

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function mean(values) { return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length); }
    function cooldownMult(cd) { return clamp(Math.sqrt((cd || 70) / 70), 0.8, 1.35); }
    function physicalAfterAc(lv) { return 12 + lv * 1.05; }
    function magicAfterMr(lv) { return 30 + lv * 1.9; }
    function rollAverage(dice, bonus) {
        if (!dice) return 0;
        return dice[0] * (dice[1] + 1) / 2 + (bonus || 0);
    }

    // 一般怪基準排除頭目、建築、攻城與血盟鏡像單位；精確等級無樣本時逐步擴大至最近等級。
    const normalMobs = Object.keys(DB.mobs).map(id => DB.mobs[id]).filter(mob =>
        mob && !mob.boss && mob.race !== '建築' && !mob.siegeEnemy && !mob.pledgeEnemy &&
        !mob.noAttack && (mob.hp || 0) > 1 && mob.dmg
    );
    const peerCache = {};

    function normalPeers(lv) {
        if (peerCache[lv]) return peerCache[lv];
        for (let span of [0, 1, 2, 3, 5, 10]) {
            let peers = normalMobs.filter(mob => Math.abs((mob.lv || 1) - lv) <= span);
            if (peers.length) return (peerCache[lv] = peers);
        }
        return (peerCache[lv] = normalMobs);
    }

    function physicalPostAc(mob) {
        return Math.max(1, rollAverage(mob.dmg, mob.db) - AC50_AVG_REDUCTION);
    }

    function normalPhysicalDps(lv) {
        return mean(normalPeers(lv).map(mob => physicalPostAc(mob) / Math.max(0.5, mob.atkSpd || 1.5)));
    }

    function normalSkillImpact(mob, sk) {
        if (!sk) return null;
        if (sk.dmg) {
            let extra = (sk.db || 0) + (sk.dbLv ? (mob.lv || 0) * (sk.dbLvMult || 1) : 0);
            let raw = rollAverage(sk.dmg, extra);
            return sk.fixedDmg ? raw : raw * MR100_MULT;
        }
        if (sk.type === 'multi_attack') {
            let times = Math.max(1, sk.times || 3);
            let dice = sk.atkDmg || mob.dmg;
            let bonus = sk.atkDb != null ? sk.atkDb : mob.db;
            return Math.max(1, rollAverage(dice, bonus) - AC50_AVG_REDUCTION) * times;
        }
        if (typeof sk.d === 'number') {
            let tick = Math.max(1, sk.tick || 3);
            let dur = Math.max(tick, sk.dur || tick);
            return sk.d * Math.max(1, Math.ceil(dur / tick));
        }
        return null;
    }

    function normalSkillDamage(lv) {
        let peers = normalPeers(lv);
        let values = [];
        peers.forEach(mob => {
            [mob.mag, mob.mag2, mob.mag3].forEach(sk => {
                let impact = normalSkillImpact(mob, sk);
                if (impact != null) values.push(impact);
            });
        });
        // 同級一般怪沒有傷害技能時，以其單次普攻作為最低技能參考。
        return values.length ? mean(values) : mean(peers.map(physicalPostAc));
    }

    function setAverageRoll(obj, rollKey, bonusKey, targetMean, fallbackCount) {
        let old = obj[rollKey];
        let count = old && old[0] ? old[0] : (fallbackCount || 1);
        count = clamp(Math.round(count), 1, 8);
        targetMean = Math.max(count + 1, targetMean);
        let bonus = Math.max(0, Math.round(targetMean * 0.5));
        let sides = Math.max(2, Math.round(((targetMean - bonus) * 2 / count) - 1));
        obj[rollKey] = [count, sides];
        obj[bonusKey] = bonus;
    }

    function normalizeDot(holder, parentSkill, targetSkillDamage) {
        if (!holder || typeof holder.d !== 'number') return;
        let tick = Math.max(1, holder.tick || 3);
        let dur = Math.max(tick, holder.dur || tick);
        let tickCount = Math.max(1, Math.ceil(dur / tick));
        let totalMult = parentSkill && parentSkill.dmg ? 0.55 : 1.0;
        holder.d = Math.max(1, Math.round(targetSkillDamage * totalMult / tickCount));
    }

    function normalizeSkill(mob, sk) {
        if (!sk) return;
        let lv = Math.max(1, mob.lv || 1);
        let targetPostMr = magicAfterMr(lv) * cooldownMult(sk.cd);
        if (sk.aoe || sk.allTarget || sk.targetAll || PARTY_AOE_SKILLS.has(sk.skn)) targetPostMr *= 0.85;
        if (sk.sec && ['stun', 'freeze', 'sleep', 'paralyze', 'stone'].includes(sk.sec.type)) targetPostMr *= 0.9;
        targetPostMr = Math.max(targetPostMr, normalSkillDamage(lv) * 2.05);

        if (sk.type === 'multi_attack') {
            let times = Math.max(1, sk.times || 3);
            let totalPostAc = targetPostMr * 1.1;
            let perHitRaw = totalPostAc / times + AC50_AVG_REDUCTION;
            setAverageRoll(sk, 'atkDmg', 'atkDb', perHitRaw, mob.dmg && mob.dmg[0]);
            return;
        }

        if (sk.dmg) {
            let rawTarget = sk.fixedDmg ? targetPostMr : targetPostMr / MR100_MULT;
            setAverageRoll(sk, 'dmg', 'db', rawTarget, sk.dmg[0]);
        }

        normalizeDot(sk, sk, targetPostMr);
        normalizeDot(sk.sec, sk, targetPostMr);

        // 冰凍追擊為不經 MR 的額外傷害，限制在同級法術約 45%。
        if (typeof sk.ext_freeze === 'number') sk.ext_freeze = Math.max(1, Math.round(targetPostMr * 0.45));
    }

    Object.keys(DB.mobs).forEach(id => {
        let mob = DB.mobs[id];
        if (!mob || !mob.boss || mob.race === '建築' || mob.siegeEnemy || mob.noAttack || (mob.hp || 0) <= 1) return;
        if (mob.noDmgCurve) return;   // 🌑 v3.4.4 豁免旗標（用戶拍板）：吉爾塔斯/真‧死亡騎士 冥皇丹特斯＝普攻與技能傷害照定義原值（普攻自調 DPS≈400·技能照《黑暗妖精聖地.md》）·不吃本曲線

        let lv = Math.max(1, mob.lv || 1);
        let interval = clamp(mob.atkSpd || 1.5, 0.5, 4);
        let speedWeight = clamp(Math.sqrt(interval / 1.5), 0.8, 1.35);
        let rawPhysicalTarget = physicalAfterAc(lv) * speedWeight + AC50_AVG_REDUCTION;
        let doubleNormalDpsTarget = normalPhysicalDps(lv) * 2.05 * interval + AC50_AVG_REDUCTION;
        rawPhysicalTarget = Math.max(rawPhysicalTarget, doubleNormalDpsTarget);
        setAverageRoll(mob, 'dmg', 'db', rawPhysicalTarget, mob.dmg && mob.dmg[0]);

        normalizeSkill(mob, mob.mag);
        normalizeSkill(mob, mob.mag2);
        normalizeSkill(mob, mob.mag3);
    });

    // 🐉 四大龍傷害錨定吉爾塔斯：普攻原始 DPS 約為吉爾塔斯 52.5%；技能單次傷害依冷卻落在約 42%～60%，DoT 完整傷害為 52.5%。
    // 置於通用頭目曲線之後，避免四龍再次被同級曲線壓低；保留各龍原有攻速、冷卻、屬性、觸發率與控場特色。
    const giltas = DB.mobs.sanct_giltas;
    if (giltas && giltas.dmg && giltas.mag2 && giltas.mag2.dmg) {
        const DRAGON_GILTAS_RATIO = 0.525;
        const giltasPhysicalDps = rollAverage(giltas.dmg, giltas.db) / Math.max(0.5, giltas.atkSpd || 2);
        const dragonPhysicalDps = giltasPhysicalDps * DRAGON_GILTAS_RATIO;
        const giltasSkillImpact = rollAverage(giltas.mag2.dmg, giltas.mag2.db);
        const dragonSkillImpact = giltasSkillImpact * DRAGON_GILTAS_RATIO;
        const giltasDot = giltas.mag3;
        const giltasDotTicks = Math.max(1, Math.ceil((giltasDot.dur || giltasDot.tick || 3) / Math.max(1, giltasDot.tick || 3)));
        const dragonDotImpact = (giltasDot.d || 0) * giltasDotTicks * DRAGON_GILTAS_RATIO;

        function anchorDragonDot(holder) {
            if (!holder || typeof holder.d !== 'number') return;
            let tick = Math.max(1, holder.tick || 3);
            let dur = Math.max(tick, holder.dur || tick);
            holder.d = Math.max(1, Math.round(dragonDotImpact / Math.max(1, Math.ceil(dur / tick))));
        }
        function anchorDragonSkill(sk) {
            if (!sk) return;
            if (sk.dmg) {
                let cooldownWeight = clamp(Math.sqrt((sk.cd || 130) / Math.max(1, giltas.mag2.cd || 130)), 0.8, 1.15);
                setAverageRoll(sk, 'dmg', 'db', dragonSkillImpact * cooldownWeight, sk.dmg[0]);
            }
            anchorDragonDot(sk);
            anchorDragonDot(sk.sec);
            if (typeof sk.ext_freeze === 'number') sk.ext_freeze = Math.max(1, Math.round(dragonSkillImpact * 0.30));
        }

        ['antaras', 'fafurion', 'valakas', 'lindvior'].forEach(id => {
            let dragon = DB.mobs[id];
            if (!dragon) return;
            let targetMean = dragonPhysicalDps * Math.max(0.5, dragon.atkSpd || 1.5);
            setAverageRoll(dragon, 'dmg', 'db', targetMean, dragon.dmg && dragon.dmg[0]);
            anchorDragonSkill(dragon.mag);
            anchorDragonSkill(dragon.mag2);
            anchorDragonSkill(dragon.mag3);
        });
    }
})();

// ===== 套裝代碼初始化：將 DB.sets 反向掛到各裝備的 .set 屬性 =====
// 修正：原本沒有任何物品擁有 .set，導致 setCheck 永遠為空、套裝加成與底色判定都不會觸發。
// 註：.set 掛在「基底物品 ID」上，與強化/祝福/遠古/屬性詞綴（存在裝備實例上）無關，
//     因此帶詞綴的裝備一樣會被正確計入套裝。
(function initSetTags() {
    const SET_CODE = {
        set_0: 'leather', set_1: 'oasis', set_2: 'gnome', set_3: 'silver',
        set_4: 'bone',    set_5: 'steel', set_6: 'mage',  set_7: 'dk',
        set_8: 'kurt',    set_9: 'mr',    set_10: 'guard', set_11: 'kinglord',
        set_12: 'demon',  set_13: 'darkelf'
    };
    for (let sid in DB.sets) {
        let code = SET_CODE[sid];
        if (!code) continue;
        (DB.sets[sid].items || []).forEach(iid => {
            if (DB.items[iid]) DB.items[iid].set = code;
        });
    }
})();

// ===== 🗼 傲慢之塔：傳送符 / 支配符 / 移動卷軸（11F~91F 共 9 組，程式化產生）=====
//  prideKind: 'pass'(傳送符) | 'dom'(支配符) | 'scroll'(移動卷軸)；prideTier: 樓層區間起始(11,21,...,91)
//  傳送符＝持有即可進入；支配符＝持有可進入並可在塔內手動傳送；移動卷軸＝無符時進入消耗一張
(function initPrideTalismans() {
    [11, 21, 31, 41, 51, 61, 71, 81, 91].forEach(N => {
        DB.items['item_pride_pass_' + N] = {
            n: `傲慢之塔傳送符(${N}F)`, type: 'misc', p: 0, c: 'text-amber-300', noUse: true, gachaWeight: 0,
            prideKind: 'pass', prideTier: N,
            d: `攜帶在身上即可進入傲慢之塔 ${N}~${N + 9}樓`
        };
        DB.items['item_pride_dom_' + N] = {
            n: `傲慢之塔支配符(${N}F)`, type: 'misc', p: 0, c: 'text-orange-300', noUse: true, gachaWeight: 0,
            prideKind: 'dom', prideTier: N,
            d: `攜帶在身上即可進入傲慢之塔${N}~${N + 9}樓，並可使用傳送術與瞬間移動卷軸。城堡的魔物追蹤可指定傲慢之塔${N}~${N + 9}樓的魔物。`
        };
        DB.items['item_pride_scroll_' + N] = {
            n: `傲慢之塔移動卷軸(${N}F)`, type: 'misc', p: 0, c: 'text-sky-300', noUse: true, gachaWeight: 0,
            prideKind: 'scroll', prideTier: N,
            d: `進入 傲慢之塔${N}~${N + 9}樓 時消耗一張（持有 傳送符 或 支配符 則不消耗）。`
        };
        DB.items['item_pride_sealed_' + N] = {
            n: `封印的傲慢之塔傳送符(${N}F)`, type: 'misc', p: 100000, c: 'text-amber-200', eff: 'pride_unseal',
            prideKind: 'sealed', prideTier: N, gachaWeight: 1,
            d: `封印著傲慢之塔之力的符咒。使用後解除封印，獲得 傲慢之塔傳送符(${N}F)。`
        };
    });
})();

    // ===== 怪物專屬掉落表（依「怪物掉落資料.md」）=====
    // 格式：怪物顯示名稱: [[物品ID, 掉落機率(%)], ...]  每樣獨立判定一次

/* ============================================================================
 * 🛡️ 原作者標記 / 官方版指引（原作者：shines871｜官方免費版：idle-lineage-class）
 *   授權立場：本作**開放非商業轉載**（須標示原作者出處），**僅禁止商業營利**。
 *   故此段刻意「中性、無指控」，只做兩件事，皆無破壞性、不蒐集任何個資：
 *     1) 於「非官方網域」的部署頂端蓋一條**中性**橫幅：告知這是非官方轉載、
 *        並提供官方最新免費版連結（把玩家導回原作者·對合法非商業轉載與商業盜用皆為真陳述）。
 *        ⚠️措辭嚴禁出現「盜版 / 未授權 / 廣告 / 惡意」等指控字眼——因授權允許非商業轉載，
 *        對合法轉載者作此指控＝不實/毀謗，風險落在原作者身上。
 *     2) 於原始碼留存作者浮水印與唯一識別碼，供「商業營利」侵權時著作權 / DMCA 舉證。
 *   官方網域 / localhost / 127.0.0.1 / file://（本機離線遊玩）/ 官方打包版（WebView2 桌面版）一律放行。
 *   🔒 舉證用不可移除的唯一識別碼（canary，請勿刪除）：ORIG-shines871-idle-lineage-class-8F3C1A2B
 * ========================================================================== */
// 可見浮水印（executable，去註解 / 壓縮也清不掉；請勿刪除，這是舉證依據之一）
try {
  console.log('%c© shines871 · 官方最新免費版：https://shines871.github.io/idle-lineage-class/ ｜ 本作開放非商業轉載（須標示出處）· 禁止商業營利',
    'color:#c8a24a;font-weight:bold;font-size:12px');
} catch (_) {}

// 🖥️ v3.7.38 官方打包版（.NET + WebView2 桌面版）例外：桌面殼以 AddScriptToExecuteOnDocumentCreated
//    在任何頁面腳本之前注入 window.idleLineageDesktop = {host:'webview2'} 與 window.fableStore
//    （見 desktop-dotnet/MainWindow.xaml.cs）。打包版經虛擬網域 https://idle-lineage.test/ 載入，
//    不在下方網域白名單內 → 若不獨立放行，官方自家安裝版會被自己的「非官方轉載」橫幅蓋住。
//    ⚠️刻意「不快取 false」：橋接物件若因故延後注入，快取 false 會讓橫幅在官方版永久掛著
//       （gameLoop 每輪重掛，無法自癒）；只有偵測成立才快取 true（物件已凍結不會消失）。
//       未命中時的成本＝兩次屬性讀取，可忽略。
var _origDesktopCache = false;
function _origOfficialDesktop() {
  if (_origDesktopCache) return true;
  try {
    if (typeof window === 'undefined') return false;
    var d = window.idleLineageDesktop;
    if ((d && d.host === 'webview2') || window.fableStore) { _origDesktopCache = true; return true; }
  } catch (_) {}
  return false;
}

// 授權網域判定（結果快取；hostname 一整個 session 不變，之後每次呼叫都是讀布林值，零成本）
var _origAuthCache = null;
function _origAuthorizedHost() {
  if (_origOfficialDesktop()) return true;   // 官方打包版先於網域判定放行；不寫入 _origAuthCache，避免污染網域快取
  if (_origAuthCache !== null) return _origAuthCache;
  try {
    if (location.protocol === 'file:') { _origAuthCache = true; return true; }   // 本機離線遊玩放行
    var h = (location.hostname || '').toLowerCase();
    // 官方網域以字元碼還原，避免整包 find/replace「shines871.github.io」一次抹除 = shines871.github.io
    var official = String.fromCharCode(115,104,105,110,101,115,56,55,49,46,103,105,116,104,117,98,46,105,111);
    var localhost = String.fromCharCode(108,111,99,97,108,104,111,115,116);
    _origAuthCache = (h === official || h === localhost || h === '127.0.0.1' || h === '');
  } catch (_) { _origAuthCache = true; }   // 例外一律放行，絕不誤傷合法玩家
  return _origAuthCache;
}

// 官方版指引橫幅（中性·無指控）：僅在非官方網域顯示；若被移除可安全重掛（見 gameLoop）
function _origEnforce() {
  try {
    if (_origAuthorizedHost()) return;
    if (!document.body || document.getElementById('_orig_pbar')) return;
    var url = 'https://shines871.github.io/idle-lineage-class/';
    var bar = document.createElement('div');
    bar.id = '_orig_pbar';
    bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;'
      + 'background:linear-gradient(90deg,#0d1f3a,#17408a,#0d1f3a);color:#eef4ff;'
      + 'font:bold 15px/1.5 "Microsoft JhengHei","Segoe UI",Arial,sans-serif;'
      + 'padding:11px 16px;text-align:center;letter-spacing:.3px;'
      + 'box-shadow:0 2px 14px rgba(0,0,0,.45);border-bottom:2px solid #ffcf5a;';
    // ⚠️中性措辭·勿加「盜版/未授權/廣告/惡意」等指控（授權允許非商業轉載→指控合法轉載者有毀謗風險）
    bar.innerHTML = '📢 這是<span style="color:#ffcf5a">非官方轉載版本</span>，內容可能不是最新。'
      + '本遊戲<span style="color:#ffcf5a">永久免費</span>，前往<span style="color:#ffcf5a">官方最新版</span>：'
      + '<a href="' + url + '" style="color:#ffcf5a;font-weight:bold;text-decoration:underline">'
      + 'shines871.github.io/idle-lineage-class</a>';
    document.body.appendChild(bar);
  } catch (_) {}
}

try {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _origEnforce);
  else _origEnforce();
} catch (_) {}
