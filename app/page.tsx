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

/* ══════════════════════════════════════════════════
   ステップ定義
══════════════════════════════════════════════════ */
const STEPS: StepDef[] = [
  {
    key: 'name',
    bot: 'はじめまして！\nまず、お名前かニックネームを教えてください。',
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
    bot: 'ありがとうございます！\n最後に、LINE IDか電話番号を教えてください。\n担当者から直接ご連絡します。',
    type: 'input',
    placeholder: 'LINE ID または 090-XXXX-XXXX',
  },
];

/* ══════════════════════════════════════════════════
   チャットフォーム コンポーネント
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

  const showBotMessage = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      setCurrentButtons(null);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('bot', text);
        resolve();
      }, 900);
    });
  };

  // 初期化
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      await new Promise((r) => setTimeout(r, 500));
      await showBotMessage('こんにちは！\n軽配送ドライバーの求人にご興味いただきありがとうございます。\nいくつかお聞きしてもよいですか？');
      await new Promise((r) => setTimeout(r, 400));
      const first = STEPS[0];
      const text = typeof first.bot === 'function' ? first.bot(answers) : first.bot;
      await showBotMessage(text);
      if (first.type === 'buttons') {
        setCurrentButtons(first.options!);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自動スクロール
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
  }, [messages, isTyping, currentButtons]);

  const handleAnswer = async (value: string) => {
    const currentStepDef = STEPS[step];
    const display = currentStepDef.formatDisplay ? currentStepDef.formatDisplay(value) : value;

    addMessage('user', display);
    setInputValue('');
    setCurrentButtons(null);

    const newAnswers = { ...answers, [currentStepDef.key]: value };
    setAnswers(newAnswers);

    const nextStep = step + 1;

    if (nextStep >= STEPS.length) {
      // 全ステップ完了 → Supabase送信
      await new Promise((r) => setTimeout(r, 500));
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
          addMessage('bot', '送信中にエラーが発生しました。\nお手数ですが、もう一度お試しください。');
        } else {
          addMessage('bot', `${newAnswers.name}さん、ご回答ありがとうございました！\n\n担当者より「${newAnswers.contact}」にご連絡いたします。\nお気軽にお待ちください😊`);
          setIsDone(true);
        }
      }, 1600);
      return;
    }

    setStep(nextStep);
    const next = STEPS[nextStep];
    const nextText = typeof next.bot === 'function' ? next.bot(newAnswers) : next.bot;
    await new Promise((r) => setTimeout(r, 350));
    await showBotMessage(nextText);
    if (next.type === 'buttons') {
      setCurrentButtons(next.options!);
    } else {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleInputSubmit = () => {
    const val = inputValue.trim();
    if (!val) return;
    handleAnswer(val);
  };

  const currentStepDef = STEPS[step];
  const showInput = !isDone && !isTyping && !currentButtons && currentStepDef?.type === 'input';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '520px',
      background: 'rgba(6, 11, 22, 0.97)',
      border: '1px solid rgba(251,191,36,0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '0.9rem 1.25rem',
        borderBottom: '1px solid rgba(251,191,36,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(10,18,35,0.9)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '34px', height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.04))',
          border: '1px solid rgba(251,191,36,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0,
        }}>🚗</div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#f1f5f9', letterSpacing: '0.04em' }}>
            採用担当
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.7)' }} />
            <span style={{ fontSize: '0.62rem', color: 'rgba(148,163,184,0.6)', letterSpacing: '0.05em' }}>オンライン</span>
          </div>
        </div>
        {!isDone && (
          <div style={{ marginLeft: 'auto', fontSize: '0.63rem', color: 'rgba(251,191,36,0.45)', letterSpacing: '0.1em' }}>
            {Math.min(step + 1, STEPS.length)} / {STEPS.length}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      {!isDone && (
        <div style={{ height: '2px', background: 'rgba(251,191,36,0.07)', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            width: `${(step / STEPS.length) * 100}%`,
            background: 'linear-gradient(to right, rgba(251,191,36,0.4), rgba(251,191,36,0.75))',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.1rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
            animation: 'chatFadeIn 0.3s ease both',
          }}>
            {msg.from === 'bot' && (
              <div style={{
                width: '24px', height: '24px',
                borderRadius: '50%',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                marginRight: '7px',
                marginTop: '3px',
                fontSize: '10px',
              }}>🚗</div>
            )}
            <div style={{
              maxWidth: '76%',
              padding: '0.6rem 0.85rem',
              background: msg.from === 'bot'
                ? 'rgba(15,23,42,0.9)'
                : 'rgba(251,191,36,0.1)',
              border: '1px solid',
              borderColor: msg.from === 'bot'
                ? 'rgba(51,65,85,0.5)'
                : 'rgba(251,191,36,0.28)',
              fontSize: '0.8rem',
              lineHeight: 1.75,
              color: msg.from === 'bot' ? '#cbd5e1' : '#fbbf24',
              letterSpacing: '0.03em',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', animation: 'chatFadeIn 0.3s ease both' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '10px',
            }}>🚗</div>
            <div style={{
              padding: '0.6rem 0.9rem',
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(51,65,85,0.5)',
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'rgba(251,191,36,0.45)',
                  animation: `typingDot 1.2s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Button choices */}
        {currentButtons && !isTyping && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.45rem',
            paddingLeft: '31px',
            animation: 'chatFadeIn 0.35s ease both',
          }}>
            {currentButtons.map((opt) => (
              <button key={opt.value} onClick={() => handleAnswer(opt.value)} style={{
                padding: '0.48rem 0.95rem',
                background: 'rgba(251,191,36,0.05)',
                border: '1px solid rgba(251,191,36,0.32)',
                color: '#fbbf24',
                fontSize: '0.77rem',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                fontFamily: 'var(--font-zen-kaku)',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.14)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(251,191,36,0.65)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(251,191,36,0.32)';
                }}
              >{opt.label}</button>
            ))}
          </div>
        )}

        {/* Done message */}
        {isDone && (
          <div style={{
            margin: '0.5rem 0',
            padding: '1rem',
            background: 'rgba(74,222,128,0.05)',
            border: '1px solid rgba(74,222,128,0.2)',
            textAlign: 'center',
            fontSize: '0.73rem',
            color: 'rgba(74,222,128,0.8)',
            letterSpacing: '0.1em',
            animation: 'chatFadeIn 0.5s ease both',
          }}>
            ✓ 応募が完了しました
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      {showInput && (
        <div style={{
          padding: '0.65rem 0.9rem',
          borderTop: '1px solid rgba(251,191,36,0.1)',
          display: 'flex', gap: '8px',
          background: 'rgba(6,11,22,0.95)',
          flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            type={currentStepDef?.inputType || 'text'}
            placeholder={currentStepDef?.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleInputSubmit(); }}
            style={{
              flex: 1,
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(251,191,36,0.18)',
              color: '#f1f5f9',
              padding: '0.6rem 0.85rem',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-zen-kaku)',
              outline: 'none',
              letterSpacing: '0.03em',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(251,191,36,0.55)'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(251,191,36,0.18)'; }}
          />
          <button
            onClick={handleInputSubmit}
            disabled={!inputValue.trim()}
            style={{
              padding: '0.6rem 1.1rem',
              background: inputValue.trim() ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.03)',
              border: '1px solid',
              borderColor: inputValue.trim() ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.12)',
              color: inputValue.trim() ? '#fbbf24' : 'rgba(251,191,36,0.25)',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontSize: '0.78rem',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-zen-kaku)',
              flexShrink: 0,
            }}
          >送信</button>
        </div>
      )}

      {isDone && (
        <div style={{
          padding: '0.6rem', borderTop: '1px solid rgba(251,191,36,0.08)',
          textAlign: 'center', fontSize: '0.63rem',
          color: 'rgba(100,116,139,0.5)', letterSpacing: '0.12em', flexShrink: 0,
        }}>
          ご応募完了 ✓
        </div>
      )}

      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
          40%            { transform: scale(1);   opacity: 1;    }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Hero セクション
══════════════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{
      position: 'relative',
      minHeight: '100svh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      background: '#05080f',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 30% 40%, rgba(15,40,80,0.5) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 85% 20%, rgba(251,191,36,0.05) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)',
        backgroundSize: '70px 70px',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: '12%',
        width: '1px', height: '100%',
        background: 'linear-gradient(to bottom, transparent, rgba(251,191,36,0.15) 40%, rgba(251,191,36,0.07) 70%, transparent)',
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: '1100px', width: '100%',
        margin: '0 auto',
        padding: 'clamp(5rem,12vw,8rem) 1.5rem 4rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: 'clamp(2.5rem, 5vw, 4rem)',
        alignItems: 'center',
      }}>
        {/* Left */}
        <div>
          <div className="animate-fade-in-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.75rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px rgba(251,191,36,0.7)' }} />
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.4em', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 300 }}>
              軽配送ドライバー 業務委託・正社員
            </span>
          </div>

          <h1 className="animate-fade-in-up delay-100" style={{
            fontFamily: 'var(--font-noto-serif)',
            fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
            fontWeight: 300,
            lineHeight: 1.8,
            color: '#f1f5f9',
            letterSpacing: '0.04em',
            marginBottom: '1.5rem',
          }}>
            {/* SEO: キーワードを含む非表示テキスト */}
            <span className="sr-only">
              軽配送ドライバー求人｜寮完備・初期費用0円｜西船橋【Diabro】
            </span>
            住む場所も、<br />
            稼ぎ方も、<br />
            <span style={{ color: '#fbbf24' }}>ここで決める。</span>
          </h1>

          <p className="animate-fade-in-up delay-200" style={{
            fontSize: 'clamp(0.8rem, 2vw, 0.88rem)',
            lineHeight: 2.1,
            color: 'rgba(148,163,184,0.8)',
            fontWeight: 300,
            letterSpacing: '0.06em',
            marginBottom: '1.75rem',
          }}>
            寮完備・初期費用ゼロ・未経験歓迎。<br />
            地元を離れたい方、すぐ住む場所が必要な方、<br />
            副業で稼ぎたい方。全員に部屋と仕事を用意します。
          </p>

          <div className="animate-fade-in-up delay-300" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '2.25rem' }}>
            {['寮完備', '初期費用¥0', '未経験OK', 'Wワーク可', '日払い相談可'].map((tag) => (
              <span key={tag} style={{
                fontSize: '0.68rem', padding: '0.28rem 0.7rem',
                border: '1px solid rgba(251,191,36,0.28)',
                color: 'rgba(251,191,36,0.75)',
                letterSpacing: '0.05em', fontWeight: 300,
              }}>{tag}</span>
            ))}
          </div>

          <a href="#apply" className="animate-fade-in-up delay-400" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '0.85rem 1.85rem',
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.48)',
            color: '#fbbf24',
            fontSize: '0.78rem', letterSpacing: '0.22em',
            textDecoration: 'none', textTransform: 'uppercase',
            transition: 'all 0.3s',
          }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.15)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 28px rgba(251,191,36,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.08)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
            }}
          >
            <span>まず話を聞く</span>
            <svg width="15" height="8" viewBox="0 0 16 8" fill="none">
              <path d="M0 4H14M10 1L14 4L10 7" stroke="#fbbf24" strokeWidth="1" />
            </svg>
          </a>
        </div>

        {/* Right: detail card */}
        <div className="animate-fade-in-up delay-300" style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,14,26,0.98))',
          border: '1px solid rgba(251,191,36,0.14)',
          padding: '1.75rem',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '28px', height: '28px', borderTop: '1px solid rgba(251,191,36,0.5)', borderLeft: '1px solid rgba(251,191,36,0.5)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderBottom: '1px solid rgba(251,191,36,0.5)', borderRight: '1px solid rgba(251,191,36,0.5)' }} />

          <div style={{ fontSize: '0.6rem', letterSpacing: '0.4em', color: 'rgba(251,191,36,0.45)', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
            Job Details
          </div>

          {[
            { label: '月収目安', value: '25〜45万円' },
            { label: '雇用形態', value: '業務委託 / 正社員' },
            { label: '勤務地', value: '西船橋・船橋エリア' },
            { label: '入居費用', value: '¥0（報酬相殺）' },
            { label: '免許', value: '普通免許（AT可）' },
            { label: '経験', value: '未経験・ブランクOK' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.65rem 0',
              borderBottom: '1px solid rgba(51,65,85,0.35)',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.55)', letterSpacing: '0.05em', fontWeight: 300, flexShrink: 0 }}>
                {item.label}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#f1f5f9', letterSpacing: '0.03em', textAlign: 'right' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ width: '1px', height: '44px', background: 'linear-gradient(to bottom, rgba(251,191,36,0.45), transparent)' }} />
        <span style={{ fontSize: '0.56rem', letterSpacing: '0.35em', color: 'rgba(148,163,184,0.3)', textTransform: 'uppercase' }}>scroll</span>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   安心ポイント 3 カード
══════════════════════════════════════════════════ */
function FeatureSection() {
  const features = [
    {
      icon: '🏠',
      en: 'Private Room · Zero Deposit',
      title: '即日入居できる個室',
      desc: '敷金・礼金・初期費用はすべてゼロ。手持ちが少なくても大丈夫。西船橋エリアの完全個室に今日から住めます。報酬からの相殺でOK。',
    },
    {
      icon: '🚗',
      en: 'No Experience Needed',
      title: '未経験から始められる',
      desc: '配送は一人で車に乗るだけ。難しい対人接客もなし。免許があれば大丈夫。ブランク明けの方も多数活躍中。',
    },
    {
      icon: '💰',
      en: 'Earn at Your Own Pace',
      title: '自分のペースで稼ぐ',
      desc: '副業・Wワーク歓迎。週3日〜相談可。日払いにも対応しているので急な出費があっても安心です。',
    },
  ];

  return (
    <section style={{ background: '#060b16', padding: 'clamp(4rem,9vw,6rem) 1.5rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.5em', color: 'rgba(251,191,36,0.45)', textTransform: 'uppercase' }}>Why Choose Us</span>
        </div>
        <h2 className="animate-fade-in-up delay-100" style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.25rem, 3.5vw, 1.9rem)',
          fontWeight: 300, textAlign: 'center',
          color: '#f1f5f9', letterSpacing: '0.06em', marginBottom: '0.6rem',
        }}>
          「不安ゼロ」で始められる理由。
        </h2>
        <div style={{ width: '34px', height: '1px', background: 'rgba(251,191,36,0.5)', margin: '0 auto 3.25rem' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center' }}>
          {features.map((f, i) => (
            <div key={i} className={`animate-fade-in-up delay-${(i + 1) * 100}`} style={{
              flex: '1 1 270px', maxWidth: '310px',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(10,18,35,0.98))',
              border: '1px solid rgba(251,191,36,0.11)',
              padding: '1.65rem',
              transition: 'border-color 0.35s, transform 0.35s',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.38)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.11)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.9rem' }}>{f.icon}</div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(251,191,36,0.45)', marginBottom: '0.35rem', textTransform: 'uppercase', fontWeight: 300 }}>{f.en}</div>
              <h3 style={{ fontFamily: 'var(--font-noto-serif)', fontSize: '1rem', fontWeight: 400, color: '#f1f5f9', marginBottom: '0.85rem', letterSpacing: '0.04em' }}>{f.title}</h3>
              <p style={{ fontSize: '0.78rem', lineHeight: 1.9, color: 'rgba(148,163,184,0.72)', fontWeight: 300, letterSpacing: '0.04em' }}>{f.desc}</p>
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
    { icon: '✈️', text: '地元を出て、誰も知らない場所でやり直したい' },
    { icon: '🏠', text: 'すぐに住む場所が必要。敷金礼金を払う余裕がない' },
    { icon: '🔰', text: '未経験でも、ブランクがあっても働ける仕事を探している' },
    { icon: '⏰', text: '今の仕事と掛け持ちで、もっと稼ぎたい' },
  ];

  return (
    <section style={{ background: '#080e1a', padding: 'clamp(4rem,9vw,6rem) 1.5rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.5em', color: 'rgba(251,191,36,0.45)', textTransform: 'uppercase' }}>For You</span>
        </div>
        <h2 className="animate-fade-in-up delay-100" style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.25rem, 3.5vw, 1.8rem)',
          fontWeight: 300, textAlign: 'center',
          color: '#f1f5f9', letterSpacing: '0.06em', marginBottom: '0.6rem',
        }}>
          こんな方、ぜひ話を聞いてください。
        </h2>
        <div style={{ width: '34px', height: '1px', background: 'rgba(251,191,36,0.5)', margin: '0 auto 2.75rem' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {targets.map((t, i) => (
            <div key={i} className={`animate-fade-in-up delay-${(i + 1) * 100}`} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.9rem',
              padding: '1rem 1.15rem',
              background: 'rgba(15,23,42,0.55)',
              border: '1px solid rgba(51,65,85,0.38)',
              transition: 'border-color 0.3s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.28)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(51,65,85,0.38)'; }}
            >
              <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>{t.icon}</span>
              <p style={{ fontSize: '0.83rem', lineHeight: 1.8, color: '#cbd5e1', letterSpacing: '0.04em', fontWeight: 300 }}>{t.text}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-in-up delay-400" style={{
          marginTop: '1.75rem',
          padding: '1.15rem',
          background: 'rgba(251,191,36,0.04)',
          border: '1px solid rgba(251,191,36,0.18)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.8rem', lineHeight: 1.9, color: 'rgba(251,191,36,0.8)', letterSpacing: '0.05em', fontWeight: 300 }}>
            一つでも当てはまるなら、まず話だけ聞いてみてください。<br />
            <span style={{ color: 'rgba(148,163,184,0.55)', fontSize: '0.72rem' }}>履歴書不要・私服でオンライン面談OK</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   応募セクション（チャット）
══════════════════════════════════════════════════ */
function ApplySection() {
  return (
    <section id="apply" style={{
      background: 'linear-gradient(to bottom, #060b16, #080e1a)',
      padding: 'clamp(4rem,9vw,6rem) 1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-25%', left: '50%', transform: 'translateX(-50%)',
        width: '550px', height: '550px',
        background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '580px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.5em', color: 'rgba(251,191,36,0.45)', textTransform: 'uppercase' }}>Apply Now</span>
        </div>
        <h2 className="animate-fade-in-up delay-100" style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: 'clamp(1.25rem, 3.5vw, 1.8rem)',
          fontWeight: 300, textAlign: 'center',
          color: '#f1f5f9', letterSpacing: '0.06em', marginBottom: '0.6rem',
        }}>
          まず、話だけでも聞かせてください。
        </h2>
        <div style={{ width: '34px', height: '1px', background: 'rgba(251,191,36,0.5)', margin: '0 auto 0.75rem' }} />
        <p className="animate-fade-in-up delay-200" style={{
          textAlign: 'center', marginBottom: '2rem',
          fontSize: '0.76rem', color: 'rgba(148,163,184,0.55)',
          letterSpacing: '0.08em', lineHeight: 1.9, fontWeight: 300,
        }}>
          以下のチャットに答えるだけで完了。1〜2分で終わります。
        </p>

        <div className="animate-fade-in-up delay-300">
          <ChatForm />
        </div>

        <p className="animate-fade-in-up delay-400" style={{
          textAlign: 'center', marginTop: '1.1rem',
          fontSize: '0.63rem', color: 'rgba(100,116,139,0.5)',
          letterSpacing: '0.06em', lineHeight: 1.9, fontWeight: 300,
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
      background: '#05080f',
      borderTop: '1px solid rgba(251,191,36,0.07)',
      padding: '2.25rem 1.5rem',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '0.65rem' }}>
        <div style={{ width: '18px', height: '1px', background: 'rgba(251,191,36,0.28)' }} />
        <span style={{ fontSize: '0.56rem', letterSpacing: '0.4em', color: 'rgba(251,191,36,0.3)', textTransform: 'uppercase', fontWeight: 300 }}>
          Diabro Co., Ltd.
        </span>
        <div style={{ width: '18px', height: '1px', background: 'rgba(251,191,36,0.28)' }} />
      </div>
      <p style={{ fontSize: '0.6rem', color: 'rgba(100,116,139,0.4)', letterSpacing: '0.06em', fontWeight: 300 }}>
        © {new Date().getFullYear()} Diabro. All rights reserved.
      </p>
    </footer>
  );
}

/* ══════════════════════════════════════════════════
   Page エクスポート
══════════════════════════════════════════════════ */
export default function DeliveryRecruitPage() {
  return (
    <main style={{ background: '#05080f' }}>
      <Hero />
      <FeatureSection />
      <TargetSection />
      <ApplySection />
      <Footer />
    </main>
  );
}
