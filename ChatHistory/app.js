const fileInput = document.getElementById('fileInput');
const reloadBtn = document.getElementById('reloadBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const chatContainer = document.getElementById('chatContainer');
const statusBar = document.getElementById('statusBar');
const identityGroup = document.getElementById('identityGroup');
const identitySelect = document.getElementById('identitySelect');

const state = {
  messages: [],
  participants: new Map(),
  fileName: '',
  selfName: '',
  searchTerm: '',
};

const EMOTICON_MAP = {
  ':)': '😊',
  ':-)': '😊',
  '=)': '😊',
  ':D': '😄',
  ':-D': '😄',
  '=D': '😄',
  ':(': '☹️',
  ':-(': '☹️',
  ':O': '😮',
  ':-O': '😮',
  ':P': '😛',
  ':-P': '😛',
  ';)': '😉',
  ';-)': '😉',
  ':S': '😖',
  ':-S': '😖',
  ':@': '😡',
  ':-@': '😡',
  ':$': '😳',
  ':-$': '😳',
  ':|': '😐',
  ':-|': '😐',
  ":'(": '😢',
  '(H)': '😎',
  '(h)': '😎',
  '(A)': '😇',
  '(a)': '😇',
  '8O|': '😱',
  '8o|': '😱',
  '8-|': '😑',
  '+O(': '🤢',
  '+o(': '🤢',
  ':-#': '🤐',
  ':-*': '😘',
  '^o)': '😜',
  '8-)': '🤓',
  ':-^)': '😏',
  '(L)': '❤️',
  '(l)': '❤️',
  '(U)': '💔',
  '(u)': '💔',
  '(M)': '👫',
  '(m)': '👫',
  '(@)': '🐱',
  '(&)': '🐶',
  '(sn)': '🐌',
  '(bah)': '🐑',
  '(Y)': '👍',
  '(y)': '👍',
  '(N)': '👎',
  '(n)': '👎',
  '(B)': '🍺',
  '(b)': '🍺',
  '(C)': '☕',
  '(c)': '☕',
  '(S)': '🌙',
  '(s)': '🌙',
  '(*)': '⭐',
  '(8)': '🎶',
  '(R)': '🌈',
  '(r)': '🌈',
  '(I)': '💡',
  '(i)': '💡',
  '(G)': '🎁',
  '(g)': '🎁',
  '(F)': '🌹',
  '(f)': '🌹',
  '(W)': '🥀',
  '(w)': '🥀',
  '(K)': '💋',
  '(k)': '💋',
  '(O)': '🕘',
  '(o)': '🕘',
};

const EMOTICON_PATTERNS = Object.entries(EMOTICON_MAP)
  .flatMap(([code, emoji]) => {
    const variants = [[code, emoji]];
    const htmlSafe = escapeHtml(code);
    if (htmlSafe !== code) {
      variants.push([htmlSafe, emoji]);
    }
    return variants;
  })
  .sort((a, b) => b[0].length - a[0].length)
  .map(([code, emoji]) => ({
    regex: new RegExp(escapeRegExp(code), /[A-Za-z]/.test(code) ? 'gi' : 'g'),
    emoji,
  }));

fileInput.addEventListener('change', handleFileSelection);
reloadBtn.addEventListener('click', resetApp);
searchBtn.addEventListener('click', triggerSearch);
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    triggerSearch();
  }
});
identitySelect.addEventListener('change', () => {
  state.selfName = identitySelect.value;
  renderMessages(state.searchTerm);
  setStatus(`目前以「${state.selfName}」作為本人身份顯示`);
});

function setStatus(message) {
  statusBar.textContent = message;
}

function handleFileSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = parseMsnXml(reader.result);
      state.messages = parsed.messages;
      state.participants = parsed.participants;
      state.fileName = file.name;
      state.selfName = inferSelfIdentity(parsed, parsed.messages);
      state.searchTerm = '';

      enableControls();
      populateIdentityOptions();
      renderMessages('');
      setStatus(`已載入：${file.name}（訊息 ${state.messages.length} 筆）`);
    } catch (error) {
      showError(error.message);
      console.error(error);
      setStatus('解析檔案時發生錯誤，請確認是否為有效的 MSN XML 檔案。');
    }
  };

  reader.onerror = () => {
    showError('檔案讀取失敗，請再試一次。');
    setStatus('檔案讀取失敗。');
  };

  reader.readAsText(file, 'utf-8');
}

function enableControls() {
  reloadBtn.disabled = false;
  searchInput.disabled = false;
  searchBtn.disabled = false;
  searchInput.focus();
}

function resetApp() {
  state.messages = [];
  state.participants = new Map();
  state.fileName = '';
  state.selfName = '';
  state.searchTerm = '';
  fileInput.value = '';
  searchInput.value = '';
  searchInput.disabled = true;
  searchBtn.disabled = true;
  reloadBtn.disabled = true;
  identityGroup.hidden = true;
  identitySelect.innerHTML = '';
  chatContainer.innerHTML = `
    <div class="empty-state">
      <p>選擇一個 MSN 對話記錄檔開始瀏覽。</p>
    </div>
  `;
  setStatus('尚未載入檔案。');
}

function triggerSearch() {
  state.searchTerm = searchInput.value.trim();
  if (!state.messages.length) {
    setStatus('尚未載入任何對話。');
    return;
  }
  renderMessages(state.searchTerm);
}

function populateIdentityOptions() {
  const participantNames = [...state.participants.keys()].filter(Boolean);
  if (!participantNames.length) {
    identityGroup.hidden = true;
    return;
  }

  identitySelect.innerHTML = '';
  participantNames.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    identitySelect.appendChild(option);
  });

  const defaultName = participantNames.includes(state.selfName)
    ? state.selfName
    : participantNames[0];

  state.selfName = defaultName;
  identitySelect.value = defaultName;
  identityGroup.hidden = participantNames.length <= 1;
}

function renderMessages(searchTerm) {
  chatContainer.innerHTML = '';

  if (!state.messages.length) {
    chatContainer.innerHTML = `
      <div class="empty-state">
        <p>尚未找到任何可顯示的訊息。</p>
      </div>
    `;
    return;
  }

  const normalizedTerm = searchTerm.toLowerCase();
  let matchCount = 0;
  let firstMatchElement = null;

  state.messages.forEach((message) => {
    const messageRow = document.createElement('article');
    const isSelf = state.selfName && message.sender === state.selfName;

    messageRow.className = `chat-row ${isSelf ? 'outgoing' : 'incoming'}`;

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = `👤 ${message.sender} · ${formatDate(message.timestamp)}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const text = document.createElement('div');
    text.className = 'message-text';
    text.innerHTML = formatMessageText(message.text, normalizedTerm);

    if (normalizedTerm && text.querySelector('mark')) {
      matchCount += text.querySelectorAll('mark').length;
      if (!firstMatchElement) {
        firstMatchElement = messageRow;
      }
    }

    bubble.append(meta, text);
    messageRow.appendChild(bubble);
    chatContainer.appendChild(messageRow);
  });

  if (normalizedTerm) {
    if (matchCount > 0 && firstMatchElement) {
      firstMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setStatus(`找到 ${matchCount} 筆符合「${searchTerm}」的結果。`);
    } else {
      setStatus(`找不到符合「${searchTerm}」的內容。`);
    }
  } else {
    setStatus(state.fileName ? `已載入：${state.fileName}（訊息 ${state.messages.length} 筆）` : '訊息已清除。');
  }
}

function formatMessageText(rawText, normalizedTerm) {
  if (!rawText) {
    return '<em>（無內容）</em>';
  }

  const escaped = escapeHtml(rawText);
  if (!normalizedTerm) {
    const withBreaks = escaped.replace(/\n/g, '<br />');
    return replaceEmoticons(withBreaks);
  }

  const regex = new RegExp(`(${escapeRegExp(normalizedTerm)})`, 'gi');
  const highlighted = escaped.replace(regex, '<mark class="highlight">$1</mark>');
  return replaceEmoticons(highlighted.replace(/\n/g, '<br />'));
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '未知時間';
  }

  return new Intl.DateTimeFormat('zh-Hant', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceEmoticons(html) {
  let output = html;
  EMOTICON_PATTERNS.forEach(({ regex, emoji }) => {
    output = output.replace(regex, emoji);
  });
  return output;
}

function showError(message) {
  chatContainer.innerHTML = `
    <div class="error-banner">
      <h2>⚠️ 解析失敗</h2>
      <p>${escapeHtml(message)}</p>
      <p>請確認檔案是否為 MSN 對話紀錄原始 XML 格式。</p>
    </div>
  `;
}

function parseMsnXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('無法讀取檔案內容。');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error('檔案不是有效的 XML 格式。');
  }

  const messageNodes = [...doc.getElementsByTagName('Message')];
  if (!messageNodes.length) {
    throw new Error('找不到任何訊息節點。');
  }

  const participants = new Map();
  const messages = [];

  messageNodes.forEach((node, index) => {
    const message = decodeMessageNode(node, index);
    if (!message) {
      return;
    }

    messages.push(message);

    if (!participants.has(message.sender)) {
      participants.set(message.sender, { sent: 0 });
    }
    participants.get(message.sender).sent += 1;
  });

  messages.sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    if (a.timestamp) {
      return -1;
    }
    if (b.timestamp) {
      return 1;
    }
    return a.originalIndex - b.originalIndex;
  });

  return { messages, participants, document: doc };
}

function decodeMessageNode(node, index) {
  const sender = extractSender(node) || '未知發送者';
  const text = extractMessageText(node);
  const timestamp = extractTimestamp(node);

  return {
    sender,
    text,
    timestamp,
    originalIndex: index,
  };
}

function extractSender(node) {
  const attrKeys = [
    'FriendlyName',
    'UserNickname',
    'DisplayName',
    'Name',
    'Nickname',
    'From',
  ];

  for (const key of attrKeys) {
    const value = getAttributeCaseInsensitive(node, key);
    if (value) {
      return value.trim();
    }
  }

  const fromNode = node.querySelector('From, Sender, Author, Source, Account');
  const nested = findFriendlyName(fromNode, true) || findFriendlyName(node, false);
  return nested || '';
}

function findFriendlyName(contextNode, allowTextFallback = false) {
  if (!contextNode) {
    return '';
  }

  const attrCandidates = [
    'FriendlyName',
    'DisplayName',
    'Name',
    'Nickname',
    'UserNickname',
    'UserDisplayName',
  ];

  if (contextNode.nodeType === Node.ELEMENT_NODE) {
    for (const attr of attrCandidates) {
      const value = getAttributeCaseInsensitive(contextNode, attr);
      if (value) {
        return value.trim();
      }
    }
  }

  if (contextNode.children && contextNode.children.length) {
    for (const child of contextNode.children) {
      const nested = findFriendlyName(child, allowTextFallback);
      if (nested) {
        return nested;
      }
    }
  }

  if (allowTextFallback && contextNode.textContent) {
    const text = contextNode.textContent.trim();
    if (text) {
      return text;
    }
  }

  return '';
}

function extractMessageText(node) {
  const textNodes = [...node.getElementsByTagName('Text')];
  if (textNodes.length) {
    return textNodes
      .map((textNode) => collectTextContent(textNode))
      .join('\n')
      .trim();
  }

  // 部分匯出格式直接將訊息放在 Message 節點內
  const alt = [...node.childNodes]
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent)
    .join('\n')
    .trim();

  return alt;
}

function collectTextContent(node) {
  const fragments = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      fragments.push(child.textContent);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tagName = child.tagName.toLowerCase();
      if (tagName === 'emoticon' && child.getAttribute('Shortcut')) {
        fragments.push(child.getAttribute('Shortcut'));
      } else if (tagName === 'br') {
        fragments.push('\n');
      } else if (tagName === 'a') {
        fragments.push(`${child.textContent} (${child.getAttribute('href') || ''})`);
      } else {
        fragments.push(collectTextContent(child));
      }
    }
  });
  return fragments.join('');
}

function extractTimestamp(node) {
  const attributeCandidates = [
    'DateTime',
    'Date',
    'Time',
    'Timestamp',
    'LogTime',
  ];
  let rawDateTime = '';

  for (const attr of attributeCandidates) {
    const value = getAttributeCaseInsensitive(node, attr);
    if (value) {
      rawDateTime = combineTimestamp(rawDateTime, value);
    }
  }

  if (!rawDateTime) {
    const dateNode = node.querySelector('DateTime, Time, Date');
    if (dateNode?.textContent) {
      rawDateTime = dateNode.textContent.trim();
    }
  }

  const parsed = parseTimestampString(rawDateTime);
  return parsed;
}

function combineTimestamp(previous, nextPart) {
  if (!previous) {
    return nextPart;
  }
  if (!nextPart) {
    return previous;
  }
  if (/\d{2}:\d{2}/.test(nextPart) && !/\d{2}:\d{2}/.test(previous)) {
    return `${previous} ${nextPart}`;
  }
  return previous;
}

function parseTimestampString(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const isoMatch = trimmed.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  if (isoMatch) {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // 將 2020-01-01 10:00:00 這類格式轉為 Date
  const normalized = trimmed.replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, '$1T$2');
  let date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  // 嘗試解析 01/31/2020 10:00:00 PM 類型
  date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  return null;
}

function getAttributeCaseInsensitive(node, attributeName) {
  const direct = node.getAttribute(attributeName);
  if (direct) {
    return direct;
  }

  const lower = attributeName.toLowerCase();
  const upper = attributeName.toUpperCase();

  for (const attr of node.attributes ?? []) {
    if (attr.name === lower || attr.name === upper) {
      return attr.value;
    }
  }
  return null;
}

function inferSelfIdentity(parsed, messages) {
  const { document: doc, participants } = parsed;
  const candidateNames = new Set();

  const ownerAttributes = ['OwnerFriendlyName', 'UserFriendlyName', 'SelfFriendlyName', 'Owner'];
  const logNode = doc.querySelector('Log');
  ownerAttributes.forEach((attr) => {
    const value = logNode && getAttributeCaseInsensitive(logNode, attr);
    if (value) {
      candidateNames.add(value.trim());
    }
  });

  const localUserNode = doc.querySelector('LocalUser, MyProfile, From[messengeruser="1"], User[role="Local"]');
  if (localUserNode) {
    const name = getAttributeCaseInsensitive(localUserNode, 'FriendlyName')
      || getAttributeCaseInsensitive(localUserNode, 'Name')
      || localUserNode.textContent;
    if (name) {
      candidateNames.add(name.trim());
    }
  }

  [...participants.keys()].forEach((name) => {
    if (/\bme\b|\(me\)|\b我\b|\b自己\b/i.test(name)) {
      candidateNames.add(name);
    }
  });

  for (const candidate of candidateNames) {
    if (participants.has(candidate)) {
      return candidate;
    }
  }

  const participantEntries = [...participants.entries()];
  if (participantEntries.length === 1) {
    return participantEntries[0][0];
  }

  if (participantEntries.length === 2) {
    // 將發送訊息較少的一方視為自己（常見於匯出檔案中 "Me" 為回應方較少）
    participantEntries.sort((a, b) => a[1].sent - b[1].sent);
    return participantEntries[0][0];
  }

  return participantEntries[0]?.[0] ?? '';
}

// 初始化預設狀態
resetApp();
