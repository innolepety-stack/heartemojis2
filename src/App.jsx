import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun,
  Swords,
  UserRound,
  Settings,
  LogOut,
  ArrowLeft,
  MessageCircle,
  Users,
  BookOpen,
  Send,
  Dice5,
  Trash2,
  Plus,
  Sparkles,
} from "lucide-react";

/* ============================== HELPER & STORAGE ============================== */

// 고유 ID 생성
const newId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// 간단한 시간 포맷팅
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

// 1d100 굴림
const d100 = () => Math.floor(Math.random() * 100) + 1;

// LocalStorage 기반 비동기 인터페이스 (브라우저 저장소 동기화용)
const storeGet = async (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    return null;
  }
};

const storeSet = async (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
};

const storeDelete = async (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(e);
  }
};

const storeListValues = async (prefix) => {
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        results.push({ key, value });
      } catch (e) {}
    }
  }
  return results;
};

/* ============================== CONSTANTS & INITIAL DATA ============================== */

const CHAR_KEYS = ["STR", "CON", "SIZ", "DEX", "APP", "INT", "POW", "EDU"];
const CHAR_LABEL = {
  STR: "근력",
  CON: "건강",
  SIZ: "크기",
  DEX: "민첩성",
  APP: "외모",
  INT: "지능",
  POW: "정신력",
  EDU: "교육",
};

const SKILL_LIST = [
  ["관찰력", 25],
  ["듣기", 20],
  ["자료 조사", 20],
  ["심리학", 10],
  ["설득", 10],
  ["말재주", 15],
  ["위협", 15],
  ["오컬트", 5],
  ["의료", 1],
  ["응급처치", 30],
  ["회피", 30],
  ["근접 전투(육탄전)", 25],
  ["사격(권총)", 20],
  ["운전", 20],
  ["은밀행동", 20],
  ["열쇠공", 1],
];

const blankProfile = (name = "탐사자") => ({
  name,
  avatar: "",
});

const blankCharSheet = (name = "새 탐사자") => ({
  name,
  occupation: "조사관",
  age: 28,
  sex: "기타",
  residence: "서울",
  birthplace: "서울",
  avatar: "",
  characteristics: {
    STR: 50,
    CON: 50,
    SIZ: 50,
    DEX: 50,
    APP: 50,
    INT: 50,
    POW: 50,
    EDU: 50,
  },
  derived: {
    HP: 10,
    maxHP: 10,
    MP: 10,
    maxMP: 10,
    SAN: 50,
    maxSAN: 99,
    Luck: 50,
  },
  skills: Object.fromEntries(SKILL_LIST),
  backstory: "",
  inventory: "",
});

const THEMES = {
  sky: {
    bg: "#f4f7fb",
    cardBg: "#ffffff",
    panelBg: "#edf2f9",
    border: "#d0dbe7",
    borderSoft: "#e2e9f3",
    text: "#1e293b",
    textDim: "#475569",
    textFaint: "#94a3b8",
    accent: "#3b82f6",
    accentSoft: "#60a5fa",
    accentDeep: "#1d4ed8",
    purple: "#7c3aed",
    green: "#10b981",
  },
  dark: {
    bg: "#0f172a",
    cardBg: "#1e293b",
    panelBg: "#334155",
    border: "#475569",
    borderSoft: "#334155",
    text: "#f8fafc",
    textDim: "#cbd5e1",
    textFaint: "#64748b",
    accent: "#60a5fa",
    accentSoft: "#93c5fd",
    accentDeep: "#3b82f6",
    purple: "#a78bfa",
    green: "#34d399",
  },
};

const themeVars = (t) => ({
  "--bg": t.bg,
  "--bg-card": t.cardBg,
  "--bg-panel": t.panelBg,
  "--border": t.border,
  "--border-soft": t.borderSoft,
  "--text": t.text,
  "--text-dim": t.textDim,
  "--text-faint": t.textFaint,
  "--accent": t.accent,
  "--accent-soft": t.accentSoft,
  "--accent-deep": t.accentDeep,
  "--purple-c": t.purple,
  "--green": t.green,
});

/* ============================== CSS STYLES (마루부리 폰트 적용) ============================== */

const CSS = `
  /* 네이버 마루부리 웹폰트 임포트 */
  @font-face {
    font-family: 'MaruBuri';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/MaruBuri-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }

  .coc-root {
    background-color: var(--bg);
    color: var(--text);
    min-height: 100vh;
    font-family: 'MaruBuri', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .coc-card {
    background: var(--bg-card);
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }
  .coc-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.2s;
    font-family: inherit;
  }
  .coc-btn:hover { opacity: 0.9; }
  .coc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .coc-btn.ghost {
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .coc-btn.ghost:hover { background: var(--bg-panel); }
  .coc-btn.ghost.active {
    background: var(--bg-panel);
    color: var(--accent-deep);
    border-color: var(--accent);
  }
  .coc-btn.small { padding: 4px 10px; font-size: 12px; }
  .coc-input, .coc-select, .coc-textarea {
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .coc-input:focus, .coc-select:focus, .coc-textarea:focus {
    border-color: var(--accent);
  }
  .coc-tabbar { display: flex; gap: 4px; background: var(--bg-panel); padding: 4px; border-radius: 8px; }
  .coc-tab {
    padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; border-radius: 6px; color: var(--text-dim);
    display: flex; align-items: center; gap: 4px;
  }
  .coc-tab.active { background: var(--bg-card); color: var(--accent-deep); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .chat-tab-bar { display: flex; gap: 8px; margin-bottom: 8px; }
  .chat-tab { font-size: 11px; font-weight: 600; color: var(--text-faint); cursor: pointer; padding: 2px 6px; border-radius: 4px; }
  .chat-tab.active { color: var(--accent-deep); background: var(--bg-panel); }
  .coc-mono { font-family: monospace; }
  .coc-avatar { object-fit: cover; }
  .coc-seal {
    background: var(--bg-panel); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--accent);
  }
  .coc-divider { height: 1px; background: var(--border-soft); margin: 12px 0; }
  .coc-label { font-size: 12px; font-weight: 700; color: var(--text-dim); }
  .coc-scroll::-webkit-scrollbar { width: 6px; }
  .coc-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

/* ============================== COMPONENT: LOGIN ============================== */

function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onLogin({ name: name.trim(), code: code.trim() });
  };

  return (
    <div style={{ maxWidth: 360, margin: "100px auto 0", padding: 20 }}>
      <div className="coc-card" style={{ padding: 24, textAlign: "center" }}>
        <div className="coc-seal" style={{ width: 48, height: 48, margin: "0 auto 12px" }}>
          <Sun size={24} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-deep)", marginBottom: 16 }}>
          무츄의 하루 세션 온보딩
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="coc-input"
            placeholder="플레이어 이름 / 닉네임"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="coc-input"
            placeholder="접속 식별 코드 (예: user123)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="coc-btn" type="submit" style={{ justifyContent: "center", marginTop: 6 }}>
            입장하기
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================== COMPONENT: SHEET EDITOR ============================== */

function SheetEditor({ sheet, setSheet }) {
  const updateChar = (key, val) => {
    setSheet((prev) => ({
      ...prev,
      characteristics: { ...prev.characteristics, [key]: Number(val) || 0 },
    }));
  };

  const updateDerived = (key, val) => {
    setSheet((prev) => ({
      ...prev,
      derived: { ...prev.derived, [key]: Number(val) || 0 },
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input
          className="coc-input"
          value={sheet.name || ""}
          onChange={(e) => setSheet({ ...sheet, name: e.target.value })}
          placeholder="탐사자 이름"
        />
        <input
          className="coc-input"
          value={sheet.occupation || ""}
          onChange={(e) => setSheet({ ...sheet, occupation: e.target.value })}
          placeholder="직업"
        />
      </div>

      <div className="coc-label">주요 능력치</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {CHAR_KEYS.map((k) => (
          <div key={k} style={{ background: "var(--bg-panel)", padding: 6, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{CHAR_LABEL[k]}</div>
            <input
              type="number"
              className="coc-input"
              style={{ textAlign: "center", padding: "2px 4px", marginTop: 2 }}
              value={sheet.characteristics?.[k] || 0}
              onChange={(e) => updateChar(k, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="coc-label">상태 / 파생치</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        <div style={{ background: "var(--bg-panel)", padding: 6, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: "var(--text-faint)" }}>HP (현재/최대)</div>
          <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
            <input
              type="number"
              className="coc-input"
              value={sheet.derived?.HP || 0}
              onChange={(e) => updateDerived("HP", e.target.value)}
            />
            <input
              type="number"
              className="coc-input"
              value={sheet.derived?.maxHP || 0}
              onChange={(e) => updateDerived("maxHP", e.target.value)}
            />
          </div>
        </div>
        <div style={{ background: "var(--bg-panel)", padding: 6, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: "var(--text-faint)" }}>이성 (SAN)</div>
          <input
            type="number"
            className="coc-input"
            style={{ marginTop: 2 }}
            value={sheet.derived?.SAN || 0}
            onChange={(e) => updateDerived("SAN", e.target.value)}
          />
        </div>
        <div style={{ background: "var(--bg-panel)", padding: 6, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: "var(--text-faint)" }}>행운 (Luck)</div>
          <input
            type="number"
            className="coc-input"
            style={{ marginTop: 2 }}
            value={sheet.derived?.Luck || 0}
            onChange={(e) => updateDerived("Luck", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================== COMPONENT: ROOMS TAB ============================== */

function RoomsTab({ userCode, onEnterRoom }) {
  const [rooms, setRooms] = useState([]);
  const [title, setTitle] = useState("");

  const loadRooms = async () => {
    const list = await storeListValues("room:");
    setRooms(list.map((x) => x.value));
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const createRoom = async () => {
    if (!title.trim()) return;
    const room = { id: newId(), title: title.trim(), creatorCode: userCode, createdAt: Date.now() };
    await storeSet(`room:${room.id}`, room);
    setTitle("");
    loadRooms();
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="coc-card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="coc-label" style={{ marginBottom: 8 }}>새 세션 방 만들기</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="coc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="세션 제목을 입력하세요"
          />
          <button className="coc-btn" onClick={createRoom}><Plus size={14} /> 생성</button>
        </div>
      </div>

      <div className="coc-label" style={{ marginBottom: 8 }}>세션 목록</div>
      <div style={{ display: "grid", gap: 8 }}>
        {rooms.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 20 }}>개설된 세션 방이 없습니다.</div>
        ) : (
          rooms.map((r) => (
            <div
              key={r.id}
              className="coc-card"
              style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                <div className="coc-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
                  생성자: {r.creatorCode === userCode ? "나" : r.creatorCode}
                </div>
              </div>
              <button className="coc-btn small" onClick={() => onEnterRoom(r)}>입장</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ============================== COMPONENT: MY PAGE ============================== */

function MyPage({ userCode, profile, setProfile }) {
  const [name, setName] = useState(profile.name || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");

  const save = async () => {
    const updated = { name, avatar };
    setProfile(updated);
    await storeSet(`profile:${userCode}`, updated);
    alert("프로필이 저장되었습니다.");
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="coc-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="coc-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-deep)" }}>
          마이페이지 / 프로필 설정
        </div>
        <div>
          <div className="coc-label" style={{ marginBottom: 4 }}>닉네임</div>
          <input className="coc-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <div className="coc-label" style={{ marginBottom: 4 }}>아바타 이미지 URL</div>
          <input className="coc-input" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
        </div>
        <button className="coc-btn" onClick={save} style={{ alignSelf: "flex-end" }}>저장</button>
      </div>
    </div>
  );
}

/* ============================== COMPONENT: SETTINGS ============================== */

function SettingsTab({ currentTheme, setCurrentTheme }) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="coc-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="coc-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-deep)" }}>
          환경 설정
        </div>
        <div>
          <div className="coc-label" style={{ marginBottom: 6 }}>테마 선택</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`coc-btn ghost ${currentTheme === "sky" ? "active" : ""}`}
              onClick={() => setCurrentTheme("sky")}
            >
              스카이 블루 (라이트)
            </button>
            <button
              className={`coc-btn ghost ${currentTheme === "dark" ? "active" : ""}`}
              onClick={() => setCurrentTheme("dark")}
            >
              다크 모드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== ROOM DETAIL / CHAT ============================== */

function RoomView({ room, userCode, profile, onBack }) {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'chars' | 'memo'
  const [chars, setChars] = useState([]);
  const [myChar, setMyChar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 다이스 & 메시지 입력 관련 State
  const [chatTab, setChatTab] = useState("main"); // 'main' | 'anon' | 'dice'
  const [msgText, setMsgText] = useState("");
  const [anonName, setAnonName] = useState("익명");
  const [anonText, setAnonText] = useState("");
  const [selectedStat, setSelectedStat] = useState("");
  const [memo, setMemo] = useState("");

  const chatScrollRef = useRef(null);
  const isGM = room.creatorCode === userCode;

  // 데이터 로드 & 실시간 동기화
  const refreshData = useCallback(async () => {
    const [msgEntries, charEntries, memoData] = await Promise.all([
      storeListValues(`chat:${room.id}:`),
      storeListValues(`char:${room.id}:`),
      storeGet(`memo:${room.id}`),
    ]);

    const msgList = msgEntries.map((x) => x.value).sort((a, b) => a.createdAt - b.createdAt);
    const charList = charEntries.map((x) => x.value);
    const mine = charList.find((c) => c.ownerCode === userCode);

    setMessages(msgList);
    setChars(charList);
    setMyChar(mine || null);
    if (memoData) setMemo(memoData.text || "");
    setLoading(false);
  }, [room.id, userCode]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // 메시지 전송
  const sendMessage = async (payload) => {
    const msg = {
      id: newId(),
      roomId: room.id,
      senderCode: userCode,
      senderName: profile.name || "탐사자",
      avatar: myChar?.avatar || profile.avatar || "",
      charName: myChar?.name || profile.name || "탐사자",
      createdAt: Date.now(),
      ...payload,
    };
    setMessages((prev) => [...prev, msg]);
    await storeSet(`chat:${room.id}:${msg.id}`, msg);
  };

  const handleSendText = async () => {
    const t = msgText.trim();
    if (!t) return;
    setMsgText("");
    await sendMessage({ type: "text", content: t });
  };

  const handleSendAnon = async () => {
    const t = anonText.trim();
    const n = anonName.trim() || "익명";
    if (!t) return;
    setAnonText("");
    await sendMessage({ type: "anon", anonName: n, content: t });
  };

  const handleDeleteMsg = async (msgId) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    await storeDelete(`chat:${room.id}:${msgId}`);
  };

  // 판정 / 주사위 로직
  const rollDiceCheck = async () => {
    if (!selectedStat) return;
    let targetVal = 50;
    if (myChar) {
      if (myChar.characteristics?.[selectedStat]) targetVal = myChar.characteristics[selectedStat];
      else if (myChar.skills?.[selectedStat]) targetVal = myChar.skills[selectedStat];
      else if (myChar.derived?.[selectedStat]) targetVal = myChar.derived[selectedStat];
    }
    const dice = d100();
    let resultStr = "실패";
    let isSuccess = false;

    if (dice === 1) {
      resultStr = "대성공 (Critical!)";
      isSuccess = true;
    } else if (dice === 100) {
      resultStr = "대실패 (Fumble!)";
      isSuccess = false;
    } else if (dice <= Math.floor(targetVal / 5)) {
      resultStr = "극단적 성공";
      isSuccess = true;
    } else if (dice <= Math.floor(targetVal / 2)) {
      resultStr = "어려운 성공";
      isSuccess = true;
    } else if (dice <= targetVal) {
      resultStr = "보통 성공";
      isSuccess = true;
    }

    await sendMessage({
      type: "dice",
      statName: selectedStat,
      targetVal,
      diceVal: dice,
      resultStr,
      isSuccess,
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 90px)" }}>
      {/* 상단 헤더 */}
      <div
        className="coc-card"
        style={{ padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="coc-btn ghost small" onClick={onBack}>
            <ArrowLeft size={13} /> 목록
          </button>
          <div>
            <div className="coc-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-deep)" }}>
              {room.title}
            </div>
            <div className="coc-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
              GM: {isGM ? "나" : room.creatorCode}
            </div>
          </div>
        </div>
        <div className="coc-tabbar">
          <div className={`coc-tab ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
            <MessageCircle size={13} /> 세션 챗
          </div>
          <div className={`coc-tab ${activeTab === "chars" ? "active" : ""}`} onClick={() => setActiveTab("chars")}>
            <Users size={13} /> 탐사자 ({chars.length})
          </div>
          <div className={`coc-tab ${activeTab === "memo" ? "active" : ""}`} onClick={() => setActiveTab("memo")}>
            <BookOpen size={13} /> 공유 메모
          </div>
        </div>
      </div>

      {/* 탭 1: 세션 채팅 */}
      {activeTab === "chat" && (
        <div className="coc-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 12 }}>
          {/* 메시지 리스트 영역 */}
          <div ref={chatScrollRef} className="coc-scroll" style={{ flex: 1, overflowY: "auto", paddingRight: 6, display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 20 }}>채팅 기록 불러오는 중...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 40, fontSize: 12 }}>
                첫 메시지를 남겨 세션을 시작해보세요!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderCode === userCode;
                if (m.type === "anon") {
                  return (
                    <div
                      key={m.id}
                      className="anon-msg"
                      style={{ background: "var(--bg-panel)", border: "1px dashed var(--border)", borderRadius: 8, padding: "8px 12px", position: "relative" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--purple-c)" }}>👤 {m.anonName}</span>
                        <span className="coc-mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>
                          {fmtTime(m.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "var(--text)" }}>{m.content}</div>
                      {(isMe || isGM) && (
                        <button
                          className="msg-actions coc-btn ghost small"
                          onClick={() => handleDeleteMsg(m.id)}
                          style={{ position: "absolute", top: 4, right: 4, padding: 3 }}
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  );
                }

                if (m.type === "dice") {
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginBottom: 2, textAlign: isMe ? "right" : "left" }}>
                        {m.charName}
                      </div>
                      <div
                        style={{
                          background: m.isSuccess ? "var(--bg-panel)" : "#fff5f5",
                          border: `1px solid ${m.isSuccess ? "var(--accent)" : "#ffcdd2"}`,
                          borderRadius: 10,
                          padding: "10px 14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--accent-deep)", marginBottom: 4 }}>
                          <Dice5 size={14} /> {m.statName} 판정
                        </div>
                        <div className="coc-mono" style={{ fontSize: 13, marginBottom: 2 }}>
                          굴림: <strong>{m.diceVal}</strong> / 목표: {m.targetVal}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: m.isSuccess ? "var(--green)" : "#d32f2f" }}>
                          {m.resultStr}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "var(--bg-panel)", flexShrink: 0, border: "1px solid var(--border)" }}>
                      {m.avatar ? (
                        <img src={m.avatar} alt="avatar" style={{ width: "100%", height: "100%" }} className="coc-avatar" />
                      ) : (
                        <Sparkles size={14} color="var(--accent-soft)" style={{ margin: 8 }} />
                      )}
                    </div>
                    <div style={{ maxWidth: "70%" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{m.charName}</span>
                        <span className="coc-mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>
                          {fmtTime(m.createdAt)}
                        </span>
                      </div>
                      <div
                        style={{
                          background: isMe ? "var(--accent)" : "var(--bg-panel)",
                          color: isMe ? "#fff" : "var(--text)",
                          border: isMe ? "none" : "1px solid var(--border-soft)",
                          padding: "8px 12px",
                          borderRadius: 12,
                          fontSize: 13,
                          whiteSpace: "pre-wrap",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                    {(isMe || isGM) && (
                      <button className="msg-actions coc-btn ghost small" onClick={() => handleDeleteMsg(m.id)} style={{ padding: 3, alignSelf: "center" }}>
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 하단 입력 패널 */}
          <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 8, marginTop: 6 }}>
            <div className="chat-tab-bar">
              <div className={`chat-tab ${chatTab === "main" ? "active" : ""}`} onClick={() => setChatTab("main")}>
                💬 대화
              </div>
              <div className={`chat-tab ${chatTab === "dice" ? "active" : ""}`} onClick={() => setChatTab("dice")}>
                🎲 다이스 굴림
              </div>
              <div className={`chat-tab ${chatTab === "anon" ? "active" : ""}`} onClick={() => setChatTab("anon")}>
                👤 익명/NPC
              </div>
            </div>

            {chatTab === "main" && (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="coc-input"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                  placeholder={myChar ? `${myChar.name}(으)로 메시지 작성...` : "대화 메시지 작성..."}
                />
                <button className="coc-btn" onClick={handleSendText}>
                  <Send size={13} />
                </button>
              </div>
            )}

            {chatTab === "dice" && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select className="coc-select" value={selectedStat} onChange={(e) => setSelectedStat(e.target.value)} style={{ flex: 1 }}>
                  <option value="">-- 판정할 능력치/기능 선택 --</option>
                  <optgroup label="주요 능력치">
                    {CHAR_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {CHAR_LABEL[k]} ({k})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="파생 능력치">
                    <option value="SAN">이성 (SAN)</option>
                    <option value="Luck">행운 (Luck)</option>
                  </optgroup>
                  <optgroup label="기능치">
                    {SKILL_LIST.map(([n]) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <button className="coc-btn" onClick={rollDiceCheck} disabled={!selectedStat}>
                  <Dice5 size={13} /> 굴리기 (1D100)
                </button>
              </div>
            )}

            {chatTab === "anon" && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="coc-input"
                  value={anonName}
                  onChange={(e) => setAnonName(e.target.value)}
                  placeholder="이름 (예: 수상한 노인)"
                  style={{ width: 140 }}
                />
                <input
                  className="coc-input"
                  value={anonText}
                  onChange={(e) => setAnonText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendAnon();
                    }
                  }}
                  placeholder="익명 메시지 내용..."
                  style={{ flex: 1 }}
                />
                <button className="coc-btn" onClick={handleSendAnon}>
                  <Send size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 탭 2: 탐사자 시트 관리 */}
      {activeTab === "chars" && (
        <div className="coc-card coc-scroll" style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {myChar ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div className="coc-display" style={{ fontSize: 15, color: "var(--accent-deep)" }}>
                  내 탐사자 시트
                </div>
                <button
                  className="coc-btn ghost small"
                  onClick={async () => {
                    await storeSet(`char:${room.id}:${myChar.id}`, myChar);
                    await storeSet(`char:${myChar.id}`, myChar);
                    alert("탐사자 시트가 저장되었습니다.");
                  }}
                >
                  저장
                </button>
              </div>
              <SheetEditor sheet={myChar} setSheet={setMyChar} />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ color: "var(--text-dim)", marginBottom: 12 }}>이 세션에 등록된 내 탐사자가 없습니다.</div>
              <button
                className="coc-btn"
                onClick={() => {
                  const newC = { id: newId(), roomId: room.id, ownerCode: userCode, createdAt: Date.now(), ...blankCharSheet(profile.name || "새 탐사자") };
                  setMyChar(newC);
                }}
              >
                <Plus size={13} /> 새 탐사자 생성하기
              </button>
            </div>
          )}

          <div className="coc-divider" />
          <div className="coc-label" style={{ marginBottom: 10 }}>
            세션 참가자 시트 목록
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {chars
              .filter((c) => c.ownerCode !== userCode)
              .map((c) => (
                <div key={c.id} className="coc-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "var(--bg-panel)", flexShrink: 0 }}>
                    {c.avatar ? (
                      <img src={c.avatar} alt="avatar" style={{ width: "100%", height: "100%" }} className="coc-avatar" />
                    ) : (
                      <UserRound size={18} color="var(--accent-soft)" style={{ margin: 9 }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div className="coc-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
                      HP {c.derived?.HP}/{c.derived?.maxHP} | SAN {c.derived?.SAN}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 탭 3: 공유 메모 */}
      {activeTab === "memo" && (
        <div className="coc-card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="coc-display" style={{ fontSize: 14.5, color: "var(--accent-deep)" }}>
              공유 단서 & 조사 메모
            </div>
            <button
              className="coc-btn ghost small"
              onClick={async () => {
                await storeSet(`memo:${room.id}`, { text: memo });
                alert("공유 메모가 저장되었습니다.");
              }}
            >
              메모 저장
            </button>
          </div>
          <textarea
            className="coc-textarea"
            style={{ flex: 1, resize: "none" }}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="모든 플레이어가 함께 공유하는 메모장입니다. 발견한 단서나 암호를 적어두세요."
          />
        </div>
      )}
    </div>
  );
}

/* ============================== MAIN APP ============================== */

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [tab, setTab] = useState("rooms"); // 'rooms' | 'mypage' | 'settings'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("sky");

  // 로그인 시 프로필 로드
  useEffect(() => {
    if (!user) return;
    (async () => {
      const saved = await storeGet(`profile:${user.code}`);
      if (saved) setProfile(saved);
      else setProfile(blankProfile(user.name));
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="coc-root" style={themeVars(THEMES[currentTheme])}>
        <style>{CSS}</style>
        <LoginScreen onLogin={setUser} />
      </div>
    );
  }

  const activeTheme = THEMES[currentTheme] || THEMES.sky;

  return (
    <div className="coc-root" style={themeVars(activeTheme)}>
      <style>{CSS}</style>

      {/* 내비게이션 바 */}
      <div style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--bg-card)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={() => {
              setCurrentRoom(null);
              setTab("rooms");
            }}
          >
            <div className="coc-seal" style={{ width: 34, height: 34 }}>
              <Sun size={15} />
            </div>
            <div className="coc-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-deep)" }}>
              무츄의 하루
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className={`coc-btn ghost small ${tab === "rooms" && !currentRoom ? "active" : ""}`}
              onClick={() => {
                setCurrentRoom(null);
                setTab("rooms");
              }}
            >
              <Swords size={12} /> 세션
            </button>
            <button
              className={`coc-btn ghost small ${tab === "mypage" ? "active" : ""}`}
              onClick={() => {
                setCurrentRoom(null);
                setTab("mypage");
              }}
            >
              <UserRound size={12} /> 마이페이지
            </button>
            <button
              className={`coc-btn ghost small ${tab === "settings" ? "active" : ""}`}
              onClick={() => {
                setCurrentRoom(null);
                setTab("settings");
              }}
            >
              <Settings size={12} /> 설정
            </button>
            <button className="coc-btn ghost small" onClick={() => setUser(null)} style={{ padding: 6, marginLeft: 4 }} title="로그아웃">
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div style={{ padding: "16px", minHeight: "calc(100vh - 60px)" }}>
        {currentRoom ? (
          <RoomView room={currentRoom} userCode={user.code} profile={profile} onBack={() => setCurrentRoom(null)} />
        ) : tab === "rooms" ? (
          <RoomsTab userCode={user.code} onEnterRoom={setCurrentRoom} />
        ) : tab === "mypage" ? (
          <MyPage userCode={user.code} profile={profile} setProfile={setProfile} />
        ) : (
          <SettingsTab currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />
        )}
      </div>
    </div>
  );
}
