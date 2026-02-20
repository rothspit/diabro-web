'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/* ══════════════════════════════════════════════════
   型定義
══════════════════════════════════════════════════ */
type MessageFrom = 'bot' | 'user';

interface ChatMessage {
  id: string;
  from: MessageFrom;
  text: string;
}

interface Answers {
  name: string;
  age: string;
  gender: string;
  has_license: string;
  area: string;
  move_in_timing: string;
  contact: string;
}

interface StepDef {
  key: keyof Answers;
  bot: string | ((a: Answers) => string);
  type: 'input' | 'buttons';
  options?: { label: string; value: string }[];
  placeholder?: string;
  inputType?: string;
  formatDisplay?: (v: string) => string;
}

const ORANGE = '#f97316';
const ORANGE_DARK = '#ea6e0a';
const ORANGE_LIGHT = '#fff7ed';
const ORANGE_MID = '#ffedd5';

const STEPS: StepDef[] = [
  {
    key: 'name',
    bot: 'はじめまして！\nまず、お名前かニックネームを教えてください😊',
    type: 'input',
    placeholder: '例：ケンジ、田中、なんでもOK',
  },
  {
    key: 'age',
    bot: (a) => `${a.name}さん、よろしくお願いします！\n年齢を教えてください。`,
    type: 'input',
    placeholder: '例：28',
    inputType: 'number',
    formatDisplay: (v) => `${v}歳`,
  },
  {
    key: 'gender',
    bot: '性別を教えてください。',
    type: 'buttons',
    options: [
      { label: '男性', value: '男性' },
      { label: '女性', value: '女性' },
      { label: '回答しない', value: '回答しない' },
    ],
  },
  {
    key: 'has_license',
    bot: '普通自動車免許はお持ちですか？',
    type: 'buttons',
    options: [
      { label: 'はい（AT限定も可）', value: 'あり' },
      { label: 'いいえ / 取得予定', value: 'なし・取得予定' },
    ],
  },
  {
    key: 'area',
    bot: '希望の勤務・居住エリアを教えてください。',
    type: 'buttons',
    options: [
      { label: '西船橋エリア', value: '西船橋' },
      { label: '船橋・津田沼', value: '船橋・津田沼' },
      { label: '東京方面', value: '東京方面' },
      { label: 'どこでも可', value: 'どこでも可' },
    ],
  },
  {
    key: 'move_in_timing',
    bot: 'いつ頃から入居・お仕事を開始できますか？',
    type: 'buttons',
    options: [
      { label: '今すぐ（今週中）', value: '今すぐ' },
      { label: '1〜2週間以内', value: '1〜2週間以内' },
      { label: '今月中', value: '今月中' },
      { label: '来月以降', value: '来月以降' },
    ],
  },
  {
    key: 'contact',
    bot: 'ありがとうございます！\nLINE IDか電話番号を教えてください。\n担当者から直接ご連絡します📱',
    type: 'input',
    placeholder: 'LINE ID または 090-XXXX-XXXX',
  },
];


/* ══════════════════════════════════════════════════
   フィーチャーアイコン SVG
══════════════════════════════════════════════════ */
function FeatureIcon({ type, size = 28, color = ORANGE }: { type: string; size?: number; color?: string }) {
  const props = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '2',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { width: size, height: size, display: 'block' },
  };
  if (type === 'home') return (
    <svg {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
  if (type === 'truck') return (
    <svg {...props}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
  if (type === 'id') return (
    <svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
      <path d="M8 10h.01" />
      <path d="M12 10h4" />
      <path d="M12 14h4" />
      <path d="M8 14h.01" />
    </svg>
  );
  return null;
}

/* ══════════════════════════════════════════════════
   チャットフォーム
══════════════════════════════════════════════════ */
function ChatForm() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState<Answers>({
    name: '', age: '', gender: '', has_license: '',
    area: '', move_in_timing: '', contact: '',
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [currentButtons, setCurrentButtons] = useState<{ label: string; value: string }[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const addMessage = (from: MessageFrom, text: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id, from, text }]);
  };

  const showBotMessage = (text: string): Promise<void> =>
    new Promise((resolve) => {
      setIsTyping(true);
      setCurrentButtons(null);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('bot', text);
        resolve();
      }, 800);
    });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const init = async () => {
      await new Promise((r) => setTimeout(r, 400));
      await showBotMessage('こんにちは！\n軽配送ドライバーの求人にご興味いただきありがとうございます。\nいくつかお聞きしてもよいですか？');
      await new Promise((r) => setTimeout(r, 300));
      const first = STEPS[0];
      const text = typeof first.bot === 'function' ? first.bot(answers) : first.bot;
      await showBotMessage(text);
      if (first.type === 'buttons') setCurrentButtons(first.options!);
      else setTimeout(() => inputRef.current?.focus(), 150);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }, [messages, isTyping, currentButtons]);

  const handleAnswer = async (value: string) => {
    const def = STEPS[step];
    const display = def.formatDisplay ? def.formatDisplay(value) : value;
    addMessage('user', display);
    setInputValue('');
    setCurrentButtons(null);
    const newAnswers = { ...answers, [def.key]: value };
    setAnswers(newAnswers);
    const nextStep = step + 1;

    if (nextStep >= STEPS.length) {
      await new Promise((r) => setTimeout(r, 400));
      setIsTyping(true);
      setTimeout(async () => {
        const { error } = await supabase.from('applicants_delivery').insert([{
          name: newAnswers.name,
          age: newAnswers.age ? parseInt(newAnswers.age, 10) : null,
          gender: newAnswers.gender,
          has_license: newAnswers.has_license,
          area: newAnswers.area,
          move_in_timing: newAnswers.move_in_timing,
          contact: newAnswers.contact,
        }]);
        setIsTyping(false);
        if (error) {
          addMessage('bot', '送信中にエラーが発生しました。\nもう一度お試しください。');
        } else {
          addMessage('bot', `${newAnswers.name}さん、ありがとうございました！🎉\n\n「${newAnswers.contact}」にご連絡します。\nしばらくお待ちください😊`);
          setIsDone(true);
        }
      }, 1400);
      return;
    }

    setStep(nextStep);
    const next = STEPS[nextStep];
    const nextText = typeof next.bot === 'function' ? next.bot(newAnswers) : next.bot;
    await new Promise((r) => setTimeout(r, 300));
    await showBotMessage(nextText);
    if (next.type === 'buttons') setCurrentButtons(next.options!);
    else setTimeout(() => inputRef.current?.focus(), 150);
  };

  const currentDef = STEPS[step];
  const showInput = !isDone && !isTyping && !currentButtons && currentDef?.type === 'input';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '500px',
      background: '#fff',
      border: '2px solid #fed7aa',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(249,115,22,0.12)',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.9rem 1.25rem',
        borderBottom: '1px solid #fed7aa',
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'linear-gradient(to right, #fff7ed, #fff)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
        }}>🚗</div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1c1917', letterSpacing: '0.02em' }}>
            採用担当
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
            <span style={{ fontSize: '0.65rem', color: '#78716c' }}>オンライン</span>
          </div>
        </div>
        {!isDone && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i <= step ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i <= step ? ORANGE : '#e7e5e4',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: '#fafaf9' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeUp 0.3s ease both',
          }}>
            {msg.from === 'bot' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginRight: '8px', marginTop: '2px',
                fontSize: '12px',
                boxShadow: '0 2px 6px rgba(249,115,22,0.35)',
              }}>🚗</div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: '0.65rem 0.9rem',
              borderRadius: msg.from === 'bot' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
              background: msg.from === 'bot' ? '#fff' : `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
              border: msg.from === 'bot' ? '1px solid #e7e5e4' : 'none',
              boxShadow: msg.from === 'bot' ? '0 1px 4px rgba(0,0,0,0.06)' : '0 2px 8px rgba(249,115,22,0.35)',
              fontSize: '0.83rem',
              lineHeight: 1.75,
              color: msg.from === 'bot' ? '#292524' : '#fff',
              letterSpacing: '0.02em',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              fontWeight: msg.from === 'user' ? 500 : 400,
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeUp 0.3s ease both' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '12px',
              boxShadow: '0 2px 6px rgba(249,115,22,0.35)',
            }}>🚗</div>
            <div style={{
              padding: '0.65rem 1rem',
              background: '#fff', border: '1px solid #e7e5e4',
              borderRadius: '4px 16px 16px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: ORANGE,
                  animation: `typingDot 1.2s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {currentButtons && !isTyping && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
            paddingLeft: '36px',
            animation: 'fadeUp 0.35s ease both',
          }}>
            {currentButtons.map((opt) => (
              <button key={opt.value} onClick={() => handleAnswer(opt.value)} style={{
                padding: '0.5rem 1rem',
                background: '#fff',
                border: `1.5px solid ${ORANGE}`,
                borderRadius: '100px',
                color: ORANGE,
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                fontFamily: 'var(--font-zen-kaku)',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = ORANGE;
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(249,115,22,0.35)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                  (e.currentTarget as HTMLButtonElement).style.color = ORANGE;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >{opt.label}</button>
            ))}
          </div>
        )}

        {isDone && (
          <div style={{
            margin: '0.5rem 0 0 36px',
            padding: '0.85rem 1rem',
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#16a34a',
            fontWeight: 600,
            animation: 'fadeUp 0.5s ease both',
          }}>
            ✅ 応募が完了しました
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {showInput && (
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #fed7aa',
          display: 'flex', gap: '8px',
          background: '#fff',
          flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            type={currentDef?.inputType || 'text'}
            placeholder={currentDef?.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const v = inputValue.trim(); if (v) handleAnswer(v); } }}
            style={{
              flex: 1,
              border: '1.5px solid #d6d3d1',
              borderRadius: '100px',
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              color: '#1c1917',
              outline: 'none',
              fontFamily: 'var(--font-zen-kaku)',
              transition: 'border-color 0.2s',
              background: '#fafaf9',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = ORANGE; (e.target as HTMLInputElement).style.background = '#fff'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#d6d3d1'; (e.target as HTMLInputElement).style.background = '#fafaf9'; }}
          />
          <button
            onClick={() => { const v = inputValue.trim(); if (v) handleAnswer(v); }}
            disabled={!inputValue.trim()}
            style={{
              width: '40px', height: '40px',
              borderRadius: '50%',
              background: inputValue.trim() ? `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})` : '#e7e5e4',
              border: 'none',
              color: '#fff',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: inputValue.trim() ? '0 2px 8px rgba(249,115,22,0.4)' : 'none',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}



/* ══════════════════════════════════════════════════
   ロゴ SVG コンポーネント
══════════════════════════════════════════════════ */
function DiaBroLogo({ size = 32, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size, display: 'block', flexShrink: 0 }}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
      <path d="M12 12l8.5-5.5" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   トラストバー
══════════════════════════════════════════════════ */
function TrustBar() {
  const items = [
    { icon: '📅', text: 'Since 2018' },
    { icon: '📍', text: '西船橋を拠点に安定成長中' },
    { icon: '💻', text: 'ITで物流を変える次世代企業' },
    { icon: '👥', text: '男女・年齢・経験不問' },
    { icon: '🏆', text: '大手ECの安定案件のみ取り扱い' },
  ];

  return (
    <div style={{
      background: '#fff7ed',
      borderTop: '1px solid #fed7aa',
      borderBottom: '1px solid #fed7aa',
      padding: '0.7rem 1.5rem',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'center', alignItems: 'center',
        gap: '0.25rem 2rem',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.72rem', color: '#92400e', fontWeight: 500,
            letterSpacing: '0.02em', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: '0.8rem' }}>{item.icon}</span>
            {item.text}
            {i < items.length - 1 && (
              <span style={{ marginLeft: '1rem', color: '#fdba74', fontSize: '0.6rem' }}>|</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ナビゲーション
══════════════════════════════════════════════════ */
function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 100,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #fed7aa',
      padding: '0 1.5rem',
      height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DiaBroLogo size={28} color={ORANGE} />
        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1c1917', letterSpacing: '0.06em' }}>
          Diabro
        </span>
      </div>
      <a href="#apply" style={{
        padding: '0.5rem 1.25rem',
        background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
        color: '#fff',
        borderRadius: '100px',
        fontSize: '0.8rem',
        fontWeight: 600,
        textDecoration: 'none',
        letterSpacing: '0.03em',
        boxShadow: '0 2px 12px rgba(249,115,22,0.4)',
        transition: 'all 0.2s',
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(249,115,22,0.5)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 12px rgba(249,115,22,0.4)'; }}
      >
        無料で相談する
      </a>
    </nav>
  );
}

/* ══════════════════════════════════════════════════
   Hero
══════════════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{
      minHeight: '100svh',
      display: 'flex', alignItems: 'center',
      background: 'linear-gradient(160deg, #fff7ed 0%, #fff 50%, #fff7ed 100%)',
      position: 'relative', overflow: 'hidden',
      paddingTop: '60px',
    }}>
      {/* 背景デコレーション */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', left: '-5%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* ドット柄 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(249,115,22,0.12) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: '1100px', width: '100%',
        margin: '0 auto',
        padding: 'clamp(4rem,10vw,6rem) 1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'clamp(2.5rem, 5vw, 4rem)',
        alignItems: 'center',
      }}>
        {/* Left */}
        <div>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: ORANGE_MID,
            border: `1px solid #fdba74`,
            borderRadius: '100px',
            padding: '0.3rem 0.85rem',
            marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ORANGE_DARK, letterSpacing: '0.05em' }}>
              🚗 軽配送ドライバー 業務委託・正社員 募集中
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-noto-serif)',
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 700,
            lineHeight: 1.55,
            color: '#1c1917',
            letterSpacing: '-0.01em',
            marginBottom: '1.25rem',
          }}>
            <span className="sr-only">軽配送ドライバー求人｜寮完備・初期費用0円｜西船橋【Diabro】</span>
            住む場所も、<br />
            稼ぎ方も、<br />
            <span style={{
              color: ORANGE,
              position: 'relative',
              display: 'inline-block',
            }}>
              ここで決める。
              <svg style={{ position: 'absolute', bottom: '-4px', left: 0, width: '100%' }} height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 6 Q50 2 100 5 Q150 8 200 4" stroke={ORANGE} strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            lineHeight: 1.9,
            color: '#57534e',
            marginBottom: '1.75rem',
            fontWeight: 400,
          }}>
            寮完備・初期費用ゼロ・未経験歓迎。<br />
            地元を離れたい方、すぐ住む場所が必要な方、<br />
            副業で稼ぎたい方。全員に部屋と仕事を用意します。
          </p>

          {/* タグ */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {['🏠 寮完備', '💴 初期費用¥0', '🔰 未経験OK', '👩 女性もOK', '🚗 格安レンタル', '💸 日払い相談可'].map((tag) => (
              <span key={tag} style={{
                fontSize: '0.78rem', padding: '0.35rem 0.85rem',
                background: '#fff',
                border: '1.5px solid #fed7aa',
                borderRadius: '100px',
                color: '#57534e',
                fontWeight: 500,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>{tag}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#apply" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '0.9rem 2rem',
              background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
              color: '#fff',
              borderRadius: '100px',
              fontSize: '0.95rem', fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 20px rgba(249,115,22,0.45)',
              transition: 'all 0.25s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 28px rgba(249,115,22,0.5)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(249,115,22,0.45)'; }}
            >
              まず話を聞く
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M13 6L19 12L13 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#features" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.9rem 1.75rem',
              border: '1.5px solid #d6d3d1',
              borderRadius: '100px',
              color: '#57534e',
              fontSize: '0.9rem', fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
              background: '#fff',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = ORANGE; (e.currentTarget as HTMLAnchorElement).style.color = ORANGE; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#d6d3d1'; (e.currentTarget as HTMLAnchorElement).style.color = '#57534e'; }}
            >
              詳しく見る
            </a>
          </div>
        </div>

        {/* Right: Job card */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 4px 40px rgba(0,0,0,0.1)',
          border: '1px solid #fed7aa',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '120px', height: '120px',
            background: 'radial-gradient(circle at top right, rgba(249,115,22,0.08) 0%, transparent 70%)',
          }} />
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
            color: ORANGE, textTransform: 'uppercase', marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <DiaBroLogo size={18} color={ORANGE} />
            Job Details
          </div>

          {[
            { icon: '💴', label: '月収目安', value: '25〜50万円以上' },
            { icon: '📅', label: '日収目安', value: '15,000〜22,000円' },
            { icon: '⏰', label: '勤務時間', value: '8:00〜20:00（配属先による）' },
            { icon: '🏖', label: '休日', value: '週休2日制（業界では希少！）' },
            { icon: '📍', label: '勤務地', value: '関東全域（直行直帰可）' },
            { icon: '🏠', label: '入居費用', value: '実質¥0（※初回報酬受取時にお支払い）' },
            { icon: '🚗', label: '免許', value: '普通免許（AT可）・男女OK' },
            { icon: '🔰', label: '経験', value: '未経験・ブランクOK' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem 0',
              borderBottom: '1px solid #f5f5f4',
            }}>
              <span style={{ fontSize: '0.78rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{item.icon}</span>{item.label}
              </span>
              <span style={{ fontSize: '0.88rem', color: '#1c1917', fontWeight: 600 }}>
                {item.value}
              </span>
            </div>
          ))}

          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem',
            background: ORANGE_LIGHT,
            borderRadius: '10px',
            border: `1px solid #fed7aa`,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.8rem', color: ORANGE_DARK, fontWeight: 600, lineHeight: 1.6 }}>
              履歴書不要・私服でオンライン面談OK<br />
              <span style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 400 }}>まずは気軽にご応募ください</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   安心ポイント3カード
══════════════════════════════════════════════════ */
function FeatureSection() {
  const features = [
    {
      svgPath: 'home',
      color: '#dbeafe',
      accent: '#3b82f6',
      title: '即日入居できる個室',
      subtitle: 'Private Room · Zero Deposit',
      desc: '敷金・礼金・初期費用はすべてゼロ。西船橋エリアの完全個室に今日から住めます。初回報酬受取時のお支払いなので手持ちがなくても大丈夫。',
    },
    {
      svgPath: 'truck',
      color: '#dcfce7',
      accent: '#16a34a',
      title: '未経験から始められる',
      subtitle: 'No Experience Needed',
      desc: '配送は一人で車に乗るだけ。難しい対人接客もなし。免許があれば大丈夫。ブランク明けの方も多数活躍中。',
    },
    {
      svgPath: 'id',
      color: ORANGE_MID,
      accent: ORANGE_DARK,
      title: '自分のペースで稼ぐ',
      subtitle: 'Earn at Your Own Pace',
      desc: '副業・Wワーク歓迎。週3日〜相談可。日払い対応もしているので急な出費があっても安心です。',
    },
  ];

  return (
    <section id="features" style={{
      background: '#fff',
      padding: 'clamp(4rem,8vw,6rem) 1.5rem',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            background: ORANGE_MID,
            color: ORANGE_DARK,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            padding: '0.3rem 0.85rem', borderRadius: '100px',
            textTransform: 'uppercase',
          }}>Why Choose Us</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
          fontWeight: 700, textAlign: 'center',
          color: '#1c1917', marginBottom: '0.75rem',
        }}>
          「不安ゼロ」で始められる理由。
        </h2>
        <p style={{ textAlign: 'center', color: '#78716c', fontSize: '0.9rem', marginBottom: '3rem', lineHeight: 1.8 }}>
          初めての方でも安心して飛び込める環境を用意しています。
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              flex: '1 1 280px', maxWidth: '310px',
              background: '#fff',
              border: '1.5px solid #e7e5e4',
              borderRadius: '16px',
              padding: '1.75rem',
              transition: 'all 0.3s ease',
              cursor: 'default',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = f.accent;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.1)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#e7e5e4';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: f.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.1rem',
              }}>
                <FeatureIcon type={f.svgPath} size={26} color={f.accent} />
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: f.accent, textTransform: 'uppercase', marginBottom: '0.35rem' }}>{f.subtitle}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.75rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.85, color: '#78716c' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   こんな人に
══════════════════════════════════════════════════ */
function TargetSection() {
  const targets = [
    { emoji: '💰', text: 'とにかく稼ぎたい。単価が良い仕事を探している' },
    { emoji: '✈️', text: '地元を出て、誰も知らない場所でやり直したい' },
    { emoji: '🏠', text: 'すぐに住む場所が必要。敷金礼金を払う余裕がない' },
    { emoji: '🧑‍💼', text: '1人で気楽に、淡々と自分のペースで働きたい' },
    { emoji: '🔰', text: '未経験でも、ブランクがあっても働ける仕事を探している' },
    { emoji: '👨‍👩‍👧', text: '家族を養うために、しっかり稼ぎたい' },
    { emoji: '📅', text: '年齢的に再就職が難しく、長く続けられる仕事を探している' },
    { emoji: '⏰', text: '今の仕事と掛け持ちで、もっと稼ぎたい' },
  ];

  return (
    <section style={{ background: ORANGE_LIGHT, padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            background: ORANGE_MID,
            color: ORANGE_DARK,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            padding: '0.3rem 0.85rem', borderRadius: '100px',
            textTransform: 'uppercase',
          }}>For You</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)',
          fontWeight: 700, textAlign: 'center',
          color: '#1c1917', marginBottom: '2.5rem',
        }}>
          こんな方、ぜひ話を聞いてください。
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {targets.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1.1rem 1.25rem',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
              transition: 'all 0.25s',
              border: '1px solid #fed7aa',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateX(6px)';
                (e.currentTarget as HTMLDivElement).style.borderColor = ORANGE;
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(249,115,22,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#fed7aa';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 8px rgba(0,0,0,0.07)';
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: ORANGE_MID,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', flexShrink: 0,
              }}>{t.emoji}</div>
              <p style={{ fontSize: '0.88rem', color: '#1c1917', fontWeight: 500, lineHeight: 1.6 }}>{t.text}</p>
              <div style={{ marginLeft: 'auto', color: ORANGE, flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '1.75rem',
          padding: '1.25rem',
          background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
          borderRadius: '14px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
        }}>
          <p style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, lineHeight: 1.8 }}>
            一つでも当てはまるなら、まず話だけ聞いてみてください。<br />
            <span style={{ fontSize: '0.78rem', fontWeight: 400, opacity: 0.85 }}>履歴書不要・私服でオンライン面談OK</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   応募フォームセクション
══════════════════════════════════════════════════ */
function ApplySection() {
  return (
    <section id="apply" style={{
      background: '#fff',
      padding: 'clamp(4rem,8vw,6rem) 1.5rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '580px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            background: ORANGE_MID,
            color: ORANGE_DARK,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            padding: '0.3rem 0.85rem', borderRadius: '100px',
            textTransform: 'uppercase',
          }}>Apply Now</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)',
          fontWeight: 700, textAlign: 'center',
          color: '#1c1917', marginBottom: '0.75rem',
        }}>
          まず、話だけでも聞かせてください。
        </h2>
        <p style={{
          textAlign: 'center', marginBottom: '2rem',
          fontSize: '0.85rem', color: '#78716c', lineHeight: 1.8,
        }}>
          以下のチャットに答えるだけで完了。<strong style={{ color: '#1c1917' }}>1〜2分</strong>で終わります。
        </p>

        <ChatForm />

        <p style={{
          textAlign: 'center', marginTop: '1.1rem',
          fontSize: '0.68rem', color: '#a8a29e', lineHeight: 1.8,
        }}>
          個人情報は採用目的のみに使用します。第三者への提供は一切行いません。
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   フッター
══════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{
      background: '#1c1917',
      padding: '2.5rem 1.5rem',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.65rem' }}>
        <DiaBroLogo size={24} color="#fdba74" />
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>Diabro</span>
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem 1.5rem',
        marginBottom: '1rem',
      }}>
        {[
          { label: '設立', value: '2018年' },
          { label: '拠点', value: '千葉県船橋市（西船橋）' },
          { label: '事業内容', value: 'ITを活用した次世代物流ソリューションの提供' },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: '#57534e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}　</span>
            <span style={{ fontSize: '0.65rem', color: '#a8a29e' }}>{item.value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.65rem', color: '#78716c', letterSpacing: '0.06em' }}>
        © {new Date().getFullYear()} Diabro Co., Ltd. All rights reserved.
      </p>
    </footer>
  );
}

/* ══════════════════════════════════════════════════
   FAQ セクション
══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   お仕事の流れ
══════════════════════════════════════════════════ */
function WorkflowSection() {
  const steps = [
    { num: '01', icon: '📦', title: '荷物の積み込み', desc: '営業所で荷物を積み込み。慣れれば手際よくこなせます。' },
    { num: '02', icon: '🚗', title: '企業・個人宅へ配送', desc: '1人でドライブしながら、マイペースに配達。車内は完全なプライベート空間。' },
    { num: '03', icon: '🔄', title: '積荷がなくなったら再積み込み', desc: 'そのまま営業所に戻って次の荷物を積み込み、再配達へ。' },
    { num: '04', icon: '🏁', title: 'お疲れ様でした！', desc: '配達完了で終業。直行直帰なので無駄な時間がありません。' },
  ];

  return (
    <section style={{ background: '#fff', padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            background: ORANGE_MID,
            color: ORANGE_DARK,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            padding: '0.3rem 0.85rem', borderRadius: '100px',
            textTransform: 'uppercase',
          }}>Workflow</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)',
          fontWeight: 700, textAlign: 'center',
          color: '#1c1917', marginBottom: '0.75rem',
        }}>
          1日の仕事の流れ
        </h2>
        <p style={{ textAlign: 'center', color: '#78716c', fontSize: '0.88rem', marginBottom: '3rem', lineHeight: 1.8 }}>
          シンプルで覚えやすい。3日あればひとり立ちできます。
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0',
          position: 'relative',
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '1.5rem 1rem',
              position: 'relative',
              textAlign: 'center',
            }}>
              {/* 矢印コネクター */}
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', right: '-10px', top: '2.5rem',
                  zIndex: 10,
                  display: 'flex', alignItems: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M13 6L19 12L13 18" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {/* ステップ番号 */}
              <div style={{
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em',
                color: ORANGE, marginBottom: '0.6rem',
                fontFamily: 'monospace',
              }}>STEP {step.num}</div>
              {/* アイコン */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: ORANGE_MID,
                border: `2px solid #fdba74`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', marginBottom: '1rem',
                boxShadow: '0 2px 12px rgba(249,115,22,0.15)',
              }}>{step.icon}</div>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.5rem' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#78716c', lineHeight: 1.75 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   待遇・特典
══════════════════════════════════════════════════ */
function BenefitsSection() {
  const benefits = [
    { icon: '🚙', title: '格安車両レンタル', desc: 'プライベートでも乗れる格安レンタカー制度あり。マイカーなしでOK。' },
    { icon: '🏠', title: '寮完備（個室・家具家電付）', desc: '敷金・礼金不要。報酬相殺で初期費用ゼロ。今日から住める。' },
    { icon: '🛣', title: '直行直帰OK', desc: '毎日の出勤ラッシュなし。現場に直接行って、直接帰れます。' },
    { icon: '💸', title: '日払い相談可', desc: '給料日を待たずに受け取れます。急な出費にも対応。' },
    { icon: '📚', title: '研修制度（約3日）', desc: '先輩が横乗りで丁寧に指導。3日あれば1人で走れるようになります。' },
    { icon: '🚀', title: '独立支援制度', desc: '将来、軽貨物で独立したい方へのサポートも行っています。' },
  ];

  return (
    <section style={{ background: ORANGE_LIGHT, padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            background: ORANGE_MID,
            color: ORANGE_DARK,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            padding: '0.3rem 0.85rem', borderRadius: '100px',
            textTransform: 'uppercase',
          }}>Benefits</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)',
          fontWeight: 700, textAlign: 'center',
          color: '#1c1917', marginBottom: '0.75rem',
        }}>
          待遇・福利厚生
        </h2>
        <p style={{ textAlign: 'center', color: '#78716c', fontSize: '0.88rem', marginBottom: '2.5rem', lineHeight: 1.8 }}>
          稼ぐだけじゃない、長く続けられる環境を用意しています。
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}>
          {benefits.map((b, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1.5px solid #fed7aa',
              display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
              transition: 'all 0.25s',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = ORANGE;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(249,115,22,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#fed7aa';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{
                width: '44px', height: '44px', flexShrink: 0,
                borderRadius: '10px',
                background: ORANGE_MID,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.35rem',
              }}>{b.icon}</div>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.3rem' }}>{b.title}</h3>
                <p style={{ fontSize: '0.75rem', color: '#78716c', lineHeight: 1.75 }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: '本当に手持ちの現金がなくても生活を始められますか？',
    a: 'はい、可能です。初期費用や敷金・礼金は一切かかりません。当面の家賃等につきましても、初回の報酬をお受け取りになった際にお支払いいただければ大丈夫ですので、まとまった現金は不要です。遠方からお越しの場合の交通費や生活のサポートについても柔軟にご相談に乗ります。',
  },
  {
    q: '寮は相部屋ですか？いきなり引っ越すのが少し不安です。',
    a: '寮は相部屋ではなく、西船橋・船橋エリアの「完全個室（家具家電付き）」をご用意しますので、プライバシーは完全に守られます。もし環境が合うか不安な場合は、数日間の「お試し宿泊（体験入社）」も可能です。まずはオンライン面談でお気軽にご相談ください。',
  },
  {
    q: 'どのような荷物を配送する仕事ですか？',
    a: '主に大手ECサイトで注文された日用品や、企業向けのルート配送などが中心です。極端に重いものを運び続けるような重労働ではありませんし、素性の分からない荷物を扱うような業務は一切ありませんのでご安心ください。',
  },
  {
    q: '普通免許しか持っていませんが、未経験でも大丈夫ですか？',
    a: '普通自動車免許（AT限定可）があれば全く問題ありません。業務委託・正社員問わず、現在のスタッフも未経験スタートが多く活躍しています。最初のうちは先輩スタッフが同乗して丁寧にサポートします。',
  },
  {
    q: '人間関係が苦手なのですが……。',
    a: '配送中は人間関係に悩むことは一切ありません。車内はあなただけの完全なプライベート空間です。ご自身のペースで、好きな音楽を流しながらモクモクと仕事に取り組むことができる環境です。',
  },
  {
    q: '遠方からの引っ越しで、荷物を運ぶ足（車）や費用がありません…。',
    a: '弊社は物流会社ですので、自社の運送車両を使った「お引越しサポート」も可能です。ご自身で高いレンタカーや引越し業者を手配していただく必要はありません。手荷物だけで上京される方も、少し荷物が多い方も、状況に合わせて柔軟にサポートしますので、面談時に気兼ねなくご相談ください。',
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section style={{ background: '#fafaf9', padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-block',
            background: ORANGE_MID,
            color: ORANGE_DARK,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
            padding: '0.3rem 0.85rem', borderRadius: '100px',
            textTransform: 'uppercase',
          }}>FAQ</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)',
          fontWeight: 700, textAlign: 'center',
          color: '#1c1917', marginBottom: '0.75rem',
        }}>
          よくある質問
        </h2>
        <p style={{
          textAlign: 'center', color: '#78716c',
          fontSize: '0.88rem', marginBottom: '2.5rem', lineHeight: 1.8,
        }}>
          応募前の不安・疑問にお答えします。
        </p>

        {/* アコーディオン */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} style={{
                background: '#fff',
                border: `1.5px solid ${isOpen ? ORANGE : '#e7e5e4'}`,
                borderRadius: '14px',
                overflow: 'hidden',
                transition: 'border-color 0.25s ease',
                boxShadow: isOpen ? '0 4px 20px rgba(249,115,22,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                {/* 質問行 */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '1.1rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', fontFamily: 'var(--font-zen-kaku)',
                  }}
                >
                  {/* Q バッジ */}
                  <div style={{
                    width: '28px', height: '28px', flexShrink: 0,
                    borderRadius: '8px',
                    background: isOpen ? `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})` : ORANGE_MID,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800,
                    color: isOpen ? '#fff' : ORANGE_DARK,
                    transition: 'all 0.25s',
                  }}>Q</div>

                  {/* 質問テキスト */}
                  <span style={{
                    flex: 1,
                    fontSize: '0.88rem', fontWeight: 600,
                    color: '#1c1917', lineHeight: 1.6,
                    letterSpacing: '0.01em',
                  }}>{item.q}</span>

                  {/* 矢印アイコン */}
                  <div style={{
                    width: '24px', height: '24px', flexShrink: 0,
                    borderRadius: '50%',
                    background: isOpen ? `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})` : '#f5f5f4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke={isOpen ? '#fff' : '#78716c'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {/* 回答（アコーディオン） */}
                <div style={{
                  maxHeight: isOpen ? '600px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s ease',
                }}>
                  <div style={{
                    padding: '0 1.25rem 1.25rem',
                    display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                  }}>
                    {/* A バッジ */}
                    <div style={{
                      width: '28px', height: '28px', flexShrink: 0,
                      borderRadius: '8px',
                      background: '#f0fdf4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800,
                      color: '#16a34a',
                      marginTop: '2px',
                    }}>A</div>
                    <p style={{
                      fontSize: '0.84rem', lineHeight: 1.9,
                      color: '#57534e', letterSpacing: '0.02em',
                    }}>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '2.5rem', textAlign: 'center',
          padding: '1.5rem',
          background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(249,115,22,0.35)',
        }}>
          <p style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.7 }}>
            他にも気になることがあれば、何でも聞いてください。<br />
            <span style={{ fontWeight: 400, opacity: 0.85, fontSize: '0.8rem' }}>面談でお答えします。</span>
          </p>
          <a href="#apply" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0.75rem 1.75rem',
            background: '#fff',
            color: ORANGE_DARK,
            borderRadius: '100px',
            fontSize: '0.88rem', fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.02em',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; }}
          >
            無料で相談する
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M13 6L19 12L13 18" stroke={ORANGE_DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════ */
export default function DeliveryRecruitPage() {
  return (
    <main style={{ background: '#fff' }}>
      <Nav />
      <Hero />
      <TrustBar />
      <FeatureSection />
      <TargetSection />
      <WorkflowSection />
      <BenefitsSection />
      <FAQSection />
      <ApplySection />
      <Footer />
    </main>
  );
}
