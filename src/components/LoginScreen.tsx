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

  const bg = backgroundUrl || "/LogALI.mp4?v=3";
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
    <div className="h-[100dvh] w-full bg-[#0B1426] flex items-center justify-center font-sans overflow-hidden select-none">
      <div className="relative h-full w-full max-w-[56.25vh] aspect-[9/16] overflow-hidden">
        {isVideo ? (
          <video
            src={bg}
            autoPlay
            loop
            muted
            playsInline
            poster="/LogALI.png?v=3"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0914]/95 via-[#0B0914]/35 to-transparent z-10" />

        <form
          onSubmit={handleSubmit}
          className="absolute z-20 left-5 right-5 bottom-6 rounded-2xl border-2 border-[#D4AF37]/70 bg-[#0B1426]/80 backdrop-blur-md p-4 flex flex-col gap-3 shadow-[0_0_30px_rgba(212,175,55,0.25)]"
        >
          <div className="text-center">
            <div className="text-[#D4AF37] text-[10px] tracking-[0.25em] font-black">ВРАТА БАЗАРА</div>
            <div className="text-white text-lg font-black leading-tight">Али-Баба и 40 кладов</div>
          </div>

          {errorMsg && (
            <div className="bg-red-950/80 border border-red-500/50 rounded-lg p-2 text-xs text-red-200 text-center">
              {errorMsg}
            </div>
          )}

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя, например: @sinbad"
            maxLength={20}
            className="w-full bg-black/50 border border-[#D4AF37]/40 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Тайное слово"
            className="w-full bg-black/50 border border-[#D4AF37]/40 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
          />

          <div className="flex items-center justify-between px-1">
            {PALETTE.map((color) => (
              <button
                key={color.hex}
                type="button"
                title={color.name}
                onClick={() => {
                  playSound("click");
                  setSelectedColor(color.hex);
                }}
                className="h-7 w-7 rounded-full border-2"
                style={{
                  backgroundColor: selectedColor === color.hex ? color.hex : "transparent",
                  borderColor: color.hex,
                  boxShadow: selectedColor === color.hex ? `0 0 10px ${color.hex}` : undefined,
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
              className="w-full py-2 border border-[#D4AF37]/50 text-[#D4AF37] rounded-lg text-[11px] font-black tracking-wider"
            >
              ПРОСИТЬ ДОПУСК
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#D4AF37] text-[#0B0914] rounded-lg text-sm font-black tracking-wider"
          >
            {loading ? "ОТКРЫВАЮ ВРАТА…" : "ВОЙТИ В ПЕЩЕРУ"}
          </button>
        </form>
      </div>
    </div>
  );
}
