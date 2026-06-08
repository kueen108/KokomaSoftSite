import type { AppInfo } from '../i18n/apps';
import type { Lang } from '../i18n/translations';
import { languages, t } from '../i18n/translations';

export const SITE_URL = 'https://kokomasoft.com';

export const localeMap: Record<Lang, string> = {
  ko: 'ko_KR',
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

export const languageCodes = Object.keys(languages) as Lang[];

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).href;
}

export function localizedPath(lang: Lang, path: string = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${normalizedPath}`.replace(/\/{2,}/g, '/');
}

export function localizedPaths(path: string = '/') {
  return Object.fromEntries(
    languageCodes.map((lang) => [lang, localizedPath(lang, path)]),
  ) as Record<Lang, string>;
}

export function homeAlternates() {
  return localizedPaths('/');
}

export function appAlternates(appId: string) {
  return localizedPaths(`/apps/${appId}/`);
}

export function privacyAlternates(appId: string) {
  return localizedPaths(`/privacy/${appId}/`);
}

export function supportAlternates(appId: string) {
  return localizedPaths(`/support/${appId}/`);
}

export function termsAlternates(appId: string) {
  return localizedPaths(`/terms/${appId}/`);
}

export function accountDeletionAlternates(appId: string) {
  return localizedPaths(`/account-deletion/${appId}/`);
}

export function homeTitle(lang: Lang) {
  const tr = t(lang);
  return `${tr.siteTitle} - ${tr.siteDescription}`;
}

export function homeDescription(lang: Lang) {
  const descriptions: Record<Lang, string> = {
    ko: 'KokomaSoft는 MarkNote, 왕꽃선녀, Onul, 인생로또 645, 인생연금 720, MyTube 등 모바일 앱을 개발하는 앱 스튜디오입니다. 앱 소개, 공식 다운로드, 개인정보처리방침, 계정 삭제 안내를 제공합니다.',
    en: 'KokomaSoft is a mobile app studio behind MarkNote, Ungyeol, Onul, Life Lotto 645, Life Pension 720, and MyTube. Find official app information, store links, privacy policies, and account deletion guidance.',
    zh: 'KokomaSoft 是开发 MarkNote、Ungyeol、Onul、人生乐透 645、人生年金 720 和 MyTube 的移动应用工作室。您可以查看应用介绍、官方商店链接、隐私政策和账号删除说明。',
    ja: 'KokomaSoftはMarkNote、Ungyeol、Onul、人生ロト 645、人生年金 720、MyTubeを開発するモバイルアプリスタジオです。公式アプリ情報、ストアリンク、プライバシーポリシー、アカウント削除案内を掲載しています。',
  };
  return descriptions[lang];
}

export function appTitle(app: AppInfo, lang: Lang) {
  const tr = t(lang);
  const suffix: Record<Lang, string> = {
    ko: `${tr.appCategories[app.category]} 앱`,
    en: `${tr.appCategories[app.category]} App`,
    zh: `${tr.appCategories[app.category]}应用`,
    ja: `${tr.appCategories[app.category]}アプリ`,
  };
  return `${app.name[lang]} - ${suffix[lang]} | KokomaSoft`;
}

export function privacyTitle(appName: string, lang: Lang) {
  const titles: Record<Lang, string> = {
    ko: `${appName} 개인정보처리방침 | KokomaSoft`,
    en: `${appName} Privacy Policy | KokomaSoft`,
    zh: `${appName} 隐私政策 | KokomaSoft`,
    ja: `${appName} プライバシーポリシー | KokomaSoft`,
  };
  return titles[lang];
}

export function privacyDescription(appName: string, lang: Lang) {
  const descriptions: Record<Lang, string> = {
    ko: `${appName}의 개인정보 처리, 이용 목적, 보관 및 삭제, 외부 서비스 이용, 이용자 권리와 문의 방법을 안내합니다.`,
    en: `Read how ${appName} handles data processing, use purposes, retention and deletion, external services, user rights, and privacy contact requests.`,
    zh: `查看 ${appName} 如何处理数据、使用目的、保存与删除、外部服务、用户权利和隐私咨询。`,
    ja: `${appName}のデータ処理、利用目的、保持と削除、外部サービス、ユーザーの権利、問い合わせ方法を確認できます。`,
  };
  return descriptions[lang];
}

export function supportTitle(appName: string, lang: Lang) {
  const titles: Record<Lang, string> = {
    ko: `${appName} 지원 | KokomaSoft`,
    en: `${appName} Support | KokomaSoft`,
    zh: `${appName} 支援 | KokomaSoft`,
    ja: `${appName} サポート | KokomaSoft`,
  };
  return titles[lang];
}

export function supportDescription(appName: string, lang: Lang) {
  const descriptions: Record<Lang, string> = {
    ko: `${appName} 문의, 개인정보처리방침, 건강 정보 계산 기준과 출처 링크를 안내합니다.`,
    en: `Find ${appName} support contact, privacy policy, health information calculation basis, and source links.`,
    zh: `查看 ${appName} 支援聯絡方式、隱私權政策、健康資訊計算基準與資料來源連結。`,
    ja: `${appName}の問い合わせ先、プライバシーポリシー、健康情報の計算基準と出典リンクを案内します。`,
  };
  return descriptions[lang];
}

export function accountDeletionTitle(appName: string, lang: Lang) {
  const titles: Record<Lang, string> = {
    ko: `${appName} 계정 및 데이터 삭제 안내 | KokomaSoft`,
    en: `${appName} Account and Data Deletion | KokomaSoft`,
    zh: `${appName} 账号和数据删除说明 | KokomaSoft`,
    ja: `${appName} アカウントとデータ削除案内 | KokomaSoft`,
  };
  return titles[lang];
}

export function accountDeletionDescription(appName: string, lang: Lang) {
  const descriptions: Record<Lang, string> = {
    ko: `${appName} 계정 삭제 요청 방법, 삭제되는 데이터, 보관 기간, 처리 일정을 안내합니다.`,
    en: `Learn how to request ${appName} account deletion, what data is deleted, what may be retained, and how long processing takes.`,
    zh: `了解如何请求删除 ${appName} 账号、会删除哪些数据、可能保留哪些数据以及处理时间。`,
    ja: `${appName}のアカウント削除依頼方法、削除対象データ、保持される可能性がある情報、処理期間を案内します。`,
  };
  return descriptions[lang];
}

export function organizationSchema(lang: Lang) {
  const tr = t(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KokomaSoft',
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    description: tr.siteDescription,
    email: 'kokomasoft@gmail.com',
  };
}

export function websiteSchema(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KokomaSoft',
    url: SITE_URL,
    inLanguage: lang,
    publisher: {
      '@type': 'Organization',
      name: 'KokomaSoft',
    },
  };
}

export function mobileApplicationSchema(app: AppInfo, lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: app.name[lang],
    description: app.description[lang],
    applicationCategory: app.category,
    operatingSystem: app.operatingSystem ?? (app.appStoreUrl ? 'Android, iOS' : 'Android'),
    image: absoluteUrl(app.iconUrl),
    url: absoluteUrl(localizedPath(lang, `/apps/${app.id}/`)),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'KokomaSoft',
      url: SITE_URL,
    },
    sameAs: [
      app.googlePlayUrl,
      app.appStoreUrl,
      lang === 'ko' ? app.introVideoUrl : undefined,
    ].filter(Boolean),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
