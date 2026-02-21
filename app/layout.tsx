import type { Metadata } from 'next';
import './globals.css';

/* ══════════════════════════════════════════════════
   サイト基本情報
══════════════════════════════════════════════════ */
const SITE = {
  name: 'Diabro｜軽配送ドライバー求人',
  url: 'https://diabro.co.jp',
  description:
    '寮完備・敷金礼金ゼロで今日から住める。軽配送ドライバー求人（西船橋エリア）。未経験・ブランクOK・副業Wワーク歓迎。月収25〜45万円。',
};

/* ══════════════════════════════════════════════════
   ルートメタデータ
══════════════════════════════════════════════════ */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: '軽配送ドライバー求人｜寮完備・初期費用0円｜西船橋【Diabro】',
    template: '%s｜Diabro',
  },
  description: SITE.description,
  keywords: [
    '軽配送', 'ドライバー', '求人', '寮完備', '西船橋', '船橋',
    '初期費用無料', '敷金礼金なし', '未経験歓迎', 'ブランクOK',
    '出稼ぎ', 'Wワーク', '副業', '日払い', '個室', '住み込み',
    '軽貨物', '業務委託', '正社員', '千葉', '東京近郊',
  ],
  authors: [{ name: 'Diabro Co., Ltd.', url: SITE.url }],
  creator: 'Diabro Co., Ltd.',
  publisher: 'Diabro Co., Ltd.',
  alternates: { canonical: SITE.url },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: SITE.name,
    title: '軽配送ドライバー求人｜寮完備・初期費用0円｜西船橋【Diabro】',
    description: SITE.description,
    locale: 'ja_JP',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '軽配送ドライバー求人 寮完備 西船橋 Diabro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '軽配送ドライバー求人｜寮完備・初期費用0円｜西船橋',
    description: SITE.description,
    images: ['/og-image.png'],
  },
  category: '求人・転職',
  formatDetection: { telephone: false },
};

/* ══════════════════════════════════════════════════
   構造化データ
══════════════════════════════════════════════════ */
const jobPostingSchema = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: '軽配送ドライバー（業務委託・正社員）',
  description: '寮完備・敷金礼金ゼロで今日から住める軽配送ドライバー求人。未経験・ブランクOK。副業・Wワーク歓迎。西船橋エリア。',
  datePosted: '2025-02-20',
  validThrough: '2025-05-31',
  employmentType: ['CONTRACTOR', 'FULL_TIME'],
  hiringOrganization: {
    '@type': 'Organization',
    name: 'Diabro Co., Ltd.',
    sameAs: 'https://diabro.co.jp',
  },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: '船橋市',
      addressRegion: '千葉県',
      addressCountry: 'JP',
    },
  },
  baseSalary: {
    '@type': 'MonetaryAmount',
    currency: 'JPY',
    value: {
      '@type': 'QuantitativeValue',
      minValue: 250000,
      maxValue: 450000,
      unitText: 'MONTH',
    },
  },
  qualifications: '普通自動車免許（AT限定可）',
  experienceRequirements: '未経験歓迎・ブランクOK',
  jobBenefits: '完全個室寮・敷金礼金不要・日払い対応',
  workHours: '週3日〜応相談',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Diabro Co., Ltd.',
  url: 'https://diabro.co.jp',
  description: '軽配送ドライバー求人・寮提供事業',
  address: {
    '@type': 'PostalAddress',
    addressLocality: '船橋市',
    addressRegion: '千葉県',
    addressCountry: 'JP',
  },
};

/* ══════════════════════════════════════════════════
   Layout Component
══════════════════════════════════════════════════ */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;500;700&family=Noto+Serif+JP:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
