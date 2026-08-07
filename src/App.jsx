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

const newId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};
const d100 = () => Math.floor(Math.random() * 100) + 1;

const storeGet = async (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (e) { return null; }
};

const storeSet = async (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error(e); }
};

const storeDelete = async (key) => {
  try { localStorage.removeItem(key); } catch (e) { console.error(e); }
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
const CHAR_LABEL = { STR: "근력", CON: "건강", SIZ: "크기", DEX: "민첩성", APP: "외모", INT: "지능", POW: "정신력", EDU: "교육" };
const SKILL_LIST = [
  ["관찰력", 25], ["듣기", 20], ["자료 조사", 20], ["심리학", 10], ["설득", 10], ["말재주", 15], ["위협", 15], 
  ["오컬트", 5], ["의료", 1], ["응급처치", 30], ["회피", 30], ["근접 전투(육탄전)", 25], ["사격(권총)", 20], 
  ["운전", 20], ["은밀행동", 20], ["열쇠공", 1]
];

const blankProfile = (name = "탐사자") => ({ name, avatar: "" });

const blankCharSheet = (name = "새 탐사자") => ({
  name, occupation: "조사관", age: 28, sex: "기타", residence: "서울", birthplace: "서울", avatar: "",
  characteristics: { STR: 50, CON: 50, SIZ: 50, DEX: 50, APP: 50, INT: 50, POW: 50, EDU: 50 },
  derived: { HP: 10, maxHP: 10, MP: 10, maxMP: 10, SAN: 50, maxSAN: 99, Luck: 50 },
  skills: Object.fromEntries(SKILL_LIST), backstory: "", inventory: ""
});

const THEMES = {
  sky: { bg: "#f4f7fb", cardBg: "#ffffff", panelBg: "#edf2f9", border: "#d0dbe7", borderSoft: "#e2e9f3", text: "#1e293b", textDim: "#475569", textFaint: "#94a3b8", accent: "#3b82f6", accentSoft: "#60a5fa", accentDeep: "#1d4ed8", purple: "#7c3aed", green: "#10b981" },
  dark: { bg: "#0f172a", cardBg: "#1e293b", panelBg: "#334155", border: "#475569", borderSoft: "#334155", text: "#f8fafc", textDim: "#cbd5e1", textFaint: "#64748b", accent: "#60a5fa", accentSoft: "#93c5fd", accentDeep: "#3b82f6", purple: "#a78bfa", green: "#34d399" }
};

const themeVars = (t) => ({ "--bg": t.bg, "--bg-card": t.cardBg, "--bg-panel": t.panelBg, "--border": t.border, "--border-soft": t.borderSoft, "--text": t.text, "--text-dim": t.textDim, "--text-faint": t.textFaint, "--accent": t.accent, "--accent-soft": t.accentSoft, "--accent-deep": t.accentDeep, "--purple-c": t.purple, "--green": t.green });

/* ============================== CSS STYLES (폰트만 적용) ============================== */

const CSS = `
  @font-face {
    font-family: 'MaruBuri';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/MaruBuri-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
  .coc-root, .coc-root * {
    font-family: 'MaruBuri', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  }
`;

// ... 이하 기존 App.jsx의 나머지 컴포넌트 코드들은 모두 그대로 유지합니다 ...
// (여기에 나머지 함수들을 포함해서 전체 코드를 완성하시면 됩니다.)
