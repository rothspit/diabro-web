'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#05080f',
      }}
    >
      {/* Background layers */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 80% at 50% -10%, rgba(15,52,96,0.55) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(251,191,36,0.06) 0%, transparent 60%)',
        }}
      />
      {/* Subtle grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      {/* Diagonal accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '20%',
          width: '1px',
          height: '100%',
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(251,191,36,0.12) 30%, rgba(251,191,36,0.25) 60%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '800px',
          width: '100%',
          padding: '2rem 1.5rem',
          margin: '0 auto',
        }}
      >
        {/* Badge */}
        <div
          className="animate-fade-in-up delay-100"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#fbbf24',
              boxShadow: '0 0 10px rgba(251,191,36,0.6)',
            }}
          />
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.4em',
              color: '#fbbf24',
              fontWeight: 400,
              textTransform: 'uppercase',
            }}
          >
            Tokyo Base Camp
          </span>
          <div
            style={{
              width: '40px',
              height: '1px',
              background: 'linear-gradient(to right, rgba(251,191,36,0.6), transparent)',
            }}
          />
        </div>

        {/* Main copy */}
        <h1
          className="animate-fade-in-up delay-200"
          style={{
            fontFamily: 'var(--font-noto-serif)',
            fontSize: 'clamp(1.75rem, 5vw, 3.25rem)',
            fontWeight: 300,
            lineHeight: 1.7,
            color: '#f1f5f9',
            letterSpacing: '0.04em',
            marginBottom: '1.75rem',
          }}
        >
          誰もあなたを知らない街へ。
          <br />
          <span
            style={{
              color: 'rgba(241,245,249,0.65)',
              fontSize: '0.85em',
            }}
          >
            カバンひとつで、静かに引っ越そう。
          </span>
        </h1>

        {/* Lead text */}
        <p
          className="animate-fade-in-up delay-400"
          style={{
            fontSize: 'clamp(0.82rem, 2vw, 0.95rem)',
            lineHeight: 2,
            color: 'rgba(148,163,184,0.85)',
            fontWeight: 300,
            letterSpacing: '0.06em',
            maxWidth: '520px',
            marginBottom: '2.5rem',
          }}
        >
          地元のしがらみも、息苦しい人間関係も。
          <br />
          すべて置いて、リセットしませんか。
          <br />
          西船橋に、あなたの「新しい部屋」と
          <br className="hidden sm:block" />
          「一人になれる仕事」を用意しました。
        </p>

        {/* CTA button */}
        <a
          href="#contact"
          className="animate-fade-in-up delay-600"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0.875rem 2rem',
            border: '1px solid rgba(251,191,36,0.4)',
            color: '#fbbf24',
            fontSize: '0.8rem',
            letterSpacing: '0.25em',
            textDecoration: 'none',
            fontWeight: 400,
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            background: 'rgba(251,191,36,0.04)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.1)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(251,191,36,0.8)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.04)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(251,191,36,0.4)';
          }}
        >
          <span>まず話を聞く</span>
          <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
            <path d="M0 4H14M10 1L14 4L10 7" stroke="#fbbf24" strokeWidth="1" />
          </svg>
        </a>

        {/* Scroll indicator */}
        <div
          className="animate-fade-in-up delay-800"
          style={{
            marginTop: '5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '50px',
              background:
                'linear-gradient(to bottom, rgba(251,191,36,0.5), transparent)',
            }}
          />
          <span
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.3em',
              color: 'rgba(148,163,184,0.4)',
              textTransform: 'uppercase',
              writingMode: 'vertical-rl',
            }}
          >
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─── Spec Card ─── */
interface CardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: string[];
  delay: string;
}

function SpecCard({ icon, title, subtitle, items, delay }: CardProps) {
  return (
    <div
      className={`animate-fade-in-up ${delay}`}
      style={{
        position: 'relative',
        background:
          'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(10,18,35,0.98) 100%)',
        border: '1px solid rgba(251,191,36,0.15)',
        padding: '2rem 1.75rem',
        flex: '1 1 280px',
        transition: 'border-color 0.4s, transform 0.4s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.45)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.15)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Corner accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '40px',
          height: '40px',
          borderTop: '1px solid rgba(251,191,36,0.5)',
          borderLeft: '1px solid rgba(251,191,36,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '40px',
          height: '40px',
          borderBottom: '1px solid rgba(251,191,36,0.5)',
          borderRight: '1px solid rgba(251,191,36,0.5)',
        }}
      />

      <div style={{ marginBottom: '1.25rem', color: '#fbbf24' }}>{icon}</div>

      <h3
        style={{
          fontFamily: 'var(--font-noto-serif)',
          fontSize: '1.15rem',
          fontWeight: 400,
          color: '#f1f5f9',
          marginBottom: '0.4rem',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.72rem',
          color: '#fbbf24',
          letterSpacing: '0.15em',
          marginBottom: '1.5rem',
          fontWeight: 300,
          textTransform: 'uppercase',
        }}
      >
        {subtitle}
      </p>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.82rem',
              color: 'rgba(148,163,184,0.85)',
              lineHeight: 1.6,
              letterSpacing: '0.03em',
            }}
          >
            <span style={{ color: 'rgba(251,191,36,0.5)', marginTop: '3px', flexShrink: 0 }}>
              ▸
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpecSection() {
  const cards = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="2" y="7" width="20" height="14" rx="1" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      ),
      title: '初期費用・敷金礼金 ゼロ',
      subtitle: 'Zero Initial Cost',
      items: ['まとまった現金は一切不要', '報酬からの相殺でOK', '今日から即入居可能'],
      delay: 'delay-100',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      title: '生活家電付き・完全個室',
      subtitle: 'Private & Furnished',
      items: ['相部屋ではない完全個室', '西船橋エリアの好立地', 'スーツケース一つで生活開始'],
      delay: 'delay-300',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      ),
      title: '干渉のない、一人の仕事',
      subtitle: 'Your Own Pace',
      items: ['車内はあなただけのプライベート空間', '自分のペースで稼げる', '人間関係の煩わしさゼロ'],
      delay: 'delay-400',
    },
  ];

  return (
    <section
      style={{
        background: '#060b16',
        padding: 'clamp(4rem, 10vw, 7rem) 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent line top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '80px',
          background:
            'linear-gradient(to bottom, transparent, rgba(251,191,36,0.3), transparent)',
        }}
      />

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section label */}
        <div
          className="animate-fade-in-up"
          style={{ textAlign: 'center', marginBottom: '1rem' }}
        >
          <span
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.5em',
              color: 'rgba(251,191,36,0.6)',
              textTransform: 'uppercase',
              fontWeight: 300,
            }}
          >
            Your Safe Zone
          </span>
        </div>

        <h2
          className="animate-fade-in-up delay-100"
          style={{
            fontFamily: 'var(--font-noto-serif)',
            fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
            fontWeight: 300,
            textAlign: 'center',
            color: '#f1f5f9',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}
        >
          今日からここが、あなたの「安全地帯」。
        </h2>

        {/* Decorative line */}
        <div
          className="animate-fade-in-up delay-200"
          style={{
            width: '40px',
            height: '1px',
            background: 'rgba(251,191,36,0.5)',
            margin: '0 auto 4rem',
          }}
        />

        {/* Cards */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            justifyContent: 'center',
          }}
        >
          {cards.map((card, i) => (
            <SpecCard key={i} {...card} />
          ))}
        </div>

        {/* Stats row */}
        <div
          className="animate-fade-in-up delay-600"
          style={{
            marginTop: '4rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '2rem 4rem',
            padding: '2rem',
            borderTop: '1px solid rgba(251,191,36,0.08)',
            borderBottom: '1px solid rgba(251,191,36,0.08)',
          }}
        >
          {[
            { num: '¥0', label: '入居初期費用' },
            { num: '即日', label: '入居可能' },
            { num: '完全', label: '個室保証' },
            { num: '24h', label: 'サポート対応' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-noto-serif)',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 300,
                  color: '#fbbf24',
                  letterSpacing: '0.05em',
                  marginBottom: '0.3rem',
                }}
              >
                {stat.num}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(148,163,184,0.6)',
                  letterSpacing: '0.15em',
                  fontWeight: 300,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Contact Form ─── */
function ContactSection() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: sbError } = await supabase
      .from('applicants_driver')
      .insert([{ name, contact, message }]);

    if (sbError) {
      setError('送信に失敗しました。もう一度お試しください。');
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section
      id="contact"
      style={{
        background:
          'linear-gradient(to bottom, #060b16 0%, #080e1a 50%, #060b16 100%)',
        padding: 'clamp(4rem, 10vw, 7rem) 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* BG glow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background:
            'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Section header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <span
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.5em',
              color: 'rgba(251,191,36,0.6)',
              textTransform: 'uppercase',
              fontWeight: 300,
            }}
          >
            First Step
          </span>
        </div>

        <h2
          className="animate-fade-in-up delay-100"
          style={{
            fontFamily: 'var(--font-noto-serif)',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 300,
            textAlign: 'center',
            color: '#f1f5f9',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}
        >
          環境を、変えるだけだ。
        </h2>

        <div
          className="animate-fade-in-up delay-200"
          style={{
            width: '40px',
            height: '1px',
            background: 'rgba(251,191,36,0.5)',
            margin: '0 auto 1.5rem',
          }}
        />

        <p
          className="animate-fade-in-up delay-300"
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'rgba(148,163,184,0.75)',
            lineHeight: 2,
            letterSpacing: '0.05em',
            fontWeight: 300,
            marginBottom: '3rem',
          }}
        >
          履歴書不要。まずは「今の状況」をこっそり教えてください。
          <br />
          私服でオンライン面談OK。
        </p>

        {submitted ? (
          /* ── Thank you message ── */
          <div
            className="animate-fade-in-up"
            style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              border: '1px solid rgba(251,191,36,0.25)',
              background: 'rgba(251,191,36,0.03)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '30px',
                height: '30px',
                borderTop: '1px solid rgba(251,191,36,0.5)',
                borderLeft: '1px solid rgba(251,191,36,0.5)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '30px',
                height: '30px',
                borderBottom: '1px solid rgba(251,191,36,0.5)',
                borderRight: '1px solid rgba(251,191,36,0.5)',
              }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '1px solid rgba(251,191,36,0.4)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-noto-serif)',
                fontSize: '1.1rem',
                fontWeight: 300,
                color: '#f1f5f9',
                letterSpacing: '0.1em',
                marginBottom: '0.75rem',
              }}
            >
              送信完了しました
            </h3>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'rgba(148,163,184,0.65)',
                lineHeight: 1.9,
                letterSpacing: '0.05em',
                fontWeight: 300,
              }}
            >
              ご連絡ありがとうございます。
              <br />
              通常24時間以内にご連絡いたします。
            </p>
          </div>
        ) : (
          /* ── Form ── */
          <form
            className="animate-fade-in-up delay-400"
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div>
              <label
                htmlFor="name"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  letterSpacing: '0.3em',
                  color: 'rgba(251,191,36,0.6)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  fontWeight: 300,
                }}
              >
                お名前（匿名可）
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="例：田中、ニックネームでもOK"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="contact"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  letterSpacing: '0.3em',
                  color: 'rgba(251,191,36,0.6)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  fontWeight: 300,
                }}
              >
                連絡先（LINE / Tel / メール）
              </label>
              <input
                id="contact"
                type="text"
                className="form-input"
                placeholder="LINEのIDまたは電話番号"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="message"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  letterSpacing: '0.3em',
                  color: 'rgba(251,191,36,0.6)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  fontWeight: 300,
                }}
              >
                今の状況・希望（自由記入）
              </label>
              <textarea
                id="message"
                className="form-input"
                placeholder="例：地元を離れたい、すぐ住む場所が欲しい、稼ぎたい理由など、なんでもどうぞ。"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {error && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#f87171',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !contact}
              style={{
                marginTop: '0.5rem',
                padding: '1rem 2rem',
                background: loading
                  ? 'rgba(251,191,36,0.1)'
                  : 'rgba(251,191,36,0.08)',
                border: '1px solid',
                borderColor: loading
                  ? 'rgba(251,191,36,0.3)'
                  : !contact
                  ? 'rgba(251,191,36,0.15)'
                  : 'rgba(251,191,36,0.55)',
                color: !contact ? 'rgba(251,191,36,0.4)' : '#fbbf24',
                fontSize: '0.78rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-zen-kaku)',
                fontWeight: 400,
                cursor: !contact || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!loading && contact) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(251,191,36,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.08)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              {loading ? '送信中...' : 'こっそり相談する'}
            </button>

            <p
              style={{
                textAlign: 'center',
                fontSize: '0.68rem',
                color: 'rgba(100,116,139,0.7)',
                letterSpacing: '0.05em',
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              個人情報は採用目的にのみ使用します。
              <br />
              第三者への提供・公開は一切行いません。
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer
      style={{
        background: '#05080f',
        borderTop: '1px solid rgba(251,191,36,0.07)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '1rem',
        }}
      >
        <div style={{ width: '24px', height: '1px', background: 'rgba(251,191,36,0.3)' }} />
        <span
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.4em',
            color: 'rgba(251,191,36,0.4)',
            textTransform: 'uppercase',
            fontWeight: 300,
          }}
        >
          Diabro Co., Ltd.
        </span>
        <div style={{ width: '24px', height: '1px', background: 'rgba(251,191,36,0.3)' }} />
      </div>
      <p
        style={{
          fontSize: '0.65rem',
          color: 'rgba(100,116,139,0.5)',
          letterSpacing: '0.08em',
          fontWeight: 300,
        }}
      >
        © {new Date().getFullYear()} Diabro. All rights reserved.
      </p>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   Page Export
───────────────────────────────────────────── */
export default function RecruitPage() {
  return (
    <main style={{ background: '#05080f' }}>
      <HeroSection />
      <SpecSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
