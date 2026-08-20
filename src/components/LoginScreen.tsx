import React, { useState } from "react";
import { playSound } from "../utils/sounds";
import { apiFetch, IS_STANDALONE_BUILD } from "../config/api";

interface LoginScreenProps {
  backgroundUrl?: string | null;
  notice?: string;
  onLogin: (
    name: string,
    role: "admin" | "player",
    color: string,
    token?: string,
    forceId?: string
  ) => void;
}

const PALETTE = [
  { name: "Рубин", hex: "#B91C1C" },
  { name: "Изумруд", hex: "#047857" },
  { name: "Сапфир", hex: "#1D4ED8" },
  { name: "Золото султана", hex: "#D4AF37" },
  { name: "Аметист", hex: "#7C3AED" },
  { name: "Жемчуг", hex: "#E5E7EB" },
];

export default function LoginScreen({ backgroundUrl, notice, onLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState("#D4AF37");
  const [errorMsg, setErrorMsg] = useState(notice || "");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (notice) setErrorMsg(notice);
  }, [notice]);

  const bg = backgroundUrl || "/LogALI.mp4?v=4";
  const isVideo = bg.endsWith(".mp4") || bg.endsWith(".mov") || bg.startsWith("data:video");

  React.useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.username) {
      setName("@" + tg.initDataUnsafe.user.username);
    } else if (tg?.initDataUnsafe?.user?.first_name) {
      const sanitizedName = tg.initDataUnsafe.user.first_name.replace(/\s+/g, "").toLowerCase();
      setName("@" + sanitizedName);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    if (!name.trim()) {
      setErrorMsg("Назовите своё имя, путник!");
      playSound("error");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Шепните тайное слово!");
      playSound("error");
      return;
    }
    playSound("click");
    setLoading(true);
    try {
      const tg = (window as any).Telegram?.WebApp;
      const response = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password: password.trim(),
          color: selectedColor,
          telegramId: tg?.initDataUnsafe?.user?.id,
          telegramUsername: tg?.initDataUnsafe?.user?.username,
        }),
      });
      const data = await response.json();
      setLoading(false);
      if (!response.ok) {
        setErrorMsg(data.error || "Врата закрыты");
        playSound("error");
      } else {
        playSound("success");
        onLogin(data.name, data.role, data.color, data.token, data.id);
      }
    } catch {
      setLoading(false);
      setErrorMsg("Гонец не дошёл до дворца");
      playSound("error");
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0B1426] flex items-center justify-center overflow-hidden select-none">
      <div className="relative h-full w-full max-w-[56.25vh] aspect-[9/16]">
        {isVideo ? (
          <video
            src={bg}
            autoPlay
            loop
            muted
            playsInline
            poster="/LogALI.png?v=4"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
        )}

        {errorMsg && (
          <div className="absolute top-[8%] left-[8%] right-[8%] z-30 bg-red-950/90 border border-red-500/50 rounded-lg p-2 text-xs text-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="absolute inset-0 z-20">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
            maxLength={20}
            autoComplete="username"
            className="absolute left-[18%] top-[54%] w-[64%] h-[4.2%] bg-transparent text-amber-100 text-sm px-2 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
            autoComplete="current-password"
            className="absolute left-[18%] top-[62.5%] w-[64%] h-[4.2%] bg-transparent text-amber-100 text-sm px-2 focus:outline-none"
          />

          <div className="absolute left-[18%] top-[70%] w-[64%] h-[4%] flex items-center justify-between">
            {PALETTE.map((color) => (
              <button
                key={color.hex}
                type="button"
                title={color.name}
                onClick={() => {
                  playSound("click");
                  setSelectedColor(color.hex);
                }}
                className="h-6 w-6 rounded-full border-2"
                style={{
                  backgroundColor: selectedColor === color.hex ? color.hex : "transparent",
                  borderColor: color.hex,
                }}
              />
            ))}
          </div>

          {!IS_STANDALONE_BUILD && (
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (!name.trim()) {
                  setErrorMsg("Сначала назовите имя!");
                  playSound("error");
                  return;
                }
                playSound("click");
                try {
                  const res = await apiFetch("/api/telegram/request-registration", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: name.trim() }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) {
                    setErrorMsg(
                      data.alreadyPending
                        ? "Прошение уже у визиря. Ждите ответа."
                        : "Прошение отправлено! Слово придёт в чат с гонцом."
                    );
                    playSound("success");
                  } else {
                    setErrorMsg(data.error || "Не удалось отправить прошение.");
                    playSound("error");
                  }
                } catch {
                  setErrorMsg("Не удалось отправить прошение.");
                  playSound("error");
                }
              }}
              className="absolute left-[20%] top-[88%] w-[60%] h-[4%] text-[10px] font-black tracking-wider text-[#D4AF37]"
            >
              ПРОСИТЬ ДОПУСК
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="absolute left-[32%] top-[77%] w-[36%] h-[9%] bg-transparent cursor-pointer"
            aria-label="Войти"
          >
            {loading ? (
              <span className="text-[#D4AF37] text-xs font-black">…</span>
            ) : null}
          </button>
        </form>
      </div>
    </div>
  );
}
