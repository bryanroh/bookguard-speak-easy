import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ko" | "en" | "ja" | "zh" | "es" | "fr";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "en", label: "English", native: "English" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
];

type Dict = Record<string, string>;

const dict: Record<Lang, Dict> = {
  ko: {
    "brand.suffix": "e-BOOK",
    "nav.library": "도서관",
    "nav.admin": "관리",
    "nav.users": "회원관리",
    "nav.signOut": "로그아웃",
    "nav.signIn": "로그인",
    "nav.language": "언어",
    "nav.about": "소개",
    "nav.publications": "출판물",
    "nav.editorial": "편집위원회",

    "home.subtitle": "회원 전용 디지털 도서관에 오신 것을 환영합니다.",
    "home.enterLibrary": "도서관 입장",
    "home.loginSignup": "로그인 / 가입",
    "home.shelf.best": "베스트셀러",
    "home.shelf.new": "새로운 말씀",
    "home.shelf.poem": "시와 만남",
    "home.more": "더보기 →",
    "home.comingSoon": "준비 중",

    "library.title": "도서관",
    "library.subtitle": "읽으실 책을 선택하세요.",
    "library.loading": "불러오는 중…",
    "library.empty": "아직 게시된 책이 없습니다.",

    "login.signIn": "로그인",
    "login.signUp": "회원가입",
    "login.email": "이메일",
    "login.password": "비밀번호",
    "login.passwordMin": "비밀번호 (6자 이상)",
    "login.displayName": "표시 이름",
    "login.namePlaceholder": "이름",
    "login.or": "또는",
    "login.google": "Google로 계속",
    "login.noAccount": "계정이 없으신가요?",
    "login.success": "로그인 성공",
    "login.signupComplete": "가입 완료! 이메일을 확인해 주세요.",

    "book.back": "도서관",
    "book.totals": "전체 {chapters}장 · {pages} 페이지",
    "book.tagline": "— 섭리 신학 e-BOOK —",
    "book.continue": "이어서 읽기",
    "book.start": "읽기 시작",
    "book.memberOnly": "본문 읽기는 정회원 전용입니다. 관리자에게 정회원 승격을 요청해 주세요.",
    "book.toc": "목 차",
    "book.tocMemberOnly": "목차와 본문은 정회원만 열람할 수 있습니다.",
    "book.noChapters": "아직 챕터가 없습니다.",
    "book.chapter": "제 {n} 장",
    "book.loading": "불러오는 중…",

    "read.bookmark": "북마크",
    "read.bookmarkPrompt": "메모(선택):",
    "read.bookmarkSaved": "북마크 저장됨",
    "read.prev": "이전",
    "read.next": "다음",
    "read.loading": "불러오는 중…",

    "common.notFound": "페이지를 찾을 수 없습니다.",
    "common.home": "홈으로",
    "common.retry": "다시 시도",
    "common.error": "문제가 발생했습니다",
  },
  en: {
    "brand.suffix": "e-BOOK",
    "nav.library": "Library",
    "nav.admin": "Admin",
    "nav.users": "Members",
    "nav.signOut": "Sign out",
    "nav.signIn": "Sign in",
    "nav.language": "Language",
    "nav.about": "About",
    "nav.publications": "Publications",
    "nav.editorial": "Editorial Board",

    "home.subtitle": "Welcome to the members-only digital library.",
    "home.enterLibrary": "Enter Library",
    "home.loginSignup": "Sign in / Sign up",
    "home.shelf.best": "Bestsellers",
    "home.shelf.new": "New Releases",
    "home.shelf.poem": "Poetry",
    "home.more": "More →",
    "home.comingSoon": "Coming soon",

    "library.title": "Library",
    "library.subtitle": "Choose a book to read.",
    "library.loading": "Loading…",
    "library.empty": "No books published yet.",

    "login.signIn": "Sign in",
    "login.signUp": "Sign up",
    "login.email": "Email",
    "login.password": "Password",
    "login.passwordMin": "Password (6+ chars)",
    "login.displayName": "Display name",
    "login.namePlaceholder": "Name",
    "login.or": "or",
    "login.google": "Continue with Google",
    "login.noAccount": "Don't have an account?",
    "login.success": "Signed in",
    "login.signupComplete": "Signup complete! Please check your email.",

    "book.back": "Library",
    "book.totals": "{chapters} chapters · {pages} pages",
    "book.tagline": "— Providence Theology e-BOOK —",
    "book.continue": "Continue reading",
    "book.start": "Start reading",
    "book.memberOnly": "Reading is for full members only. Please request a member upgrade from the admin.",
    "book.toc": "Contents",
    "book.tocMemberOnly": "Contents and pages are visible to full members only.",
    "book.noChapters": "No chapters yet.",
    "book.chapter": "Chapter {n}",
    "book.loading": "Loading…",

    "read.bookmark": "Bookmark",
    "read.bookmarkPrompt": "Note (optional):",
    "read.bookmarkSaved": "Bookmark saved",
    "read.prev": "Previous",
    "read.next": "Next",
    "read.loading": "Loading…",

    "common.notFound": "Page not found.",
    "common.home": "Home",
    "common.retry": "Try again",
    "common.error": "Something went wrong",
  },
  ja: {
    "brand.suffix": "e-BOOK",
    "nav.library": "図書館",
    "nav.admin": "管理",
    "nav.users": "会員管理",
    "nav.signOut": "ログアウト",
    "nav.signIn": "ログイン",
    "nav.language": "言語",
    "nav.about": "紹介",
    "nav.publications": "出版物",
    "nav.editorial": "編集委員会",

    "home.subtitle": "会員専用デジタル図書館へようこそ。",
    "home.enterLibrary": "図書館へ",
    "home.loginSignup": "ログイン / 登録",
    "home.shelf.best": "ベストセラー",
    "home.shelf.new": "新着",
    "home.shelf.poem": "詩",
    "home.more": "もっと見る →",
    "home.comingSoon": "準備中",

    "library.title": "図書館",
    "library.subtitle": "読みたい本を選んでください。",
    "library.loading": "読み込み中…",
    "library.empty": "まだ公開された本はありません。",

    "login.signIn": "ログイン",
    "login.signUp": "新規登録",
    "login.email": "メール",
    "login.password": "パスワード",
    "login.passwordMin": "パスワード (6文字以上)",
    "login.displayName": "表示名",
    "login.namePlaceholder": "名前",
    "login.or": "または",
    "login.google": "Googleで続行",
    "login.noAccount": "アカウントをお持ちでないですか?",
    "login.success": "ログインしました",
    "login.signupComplete": "登録完了!メールをご確認ください。",

    "book.back": "図書館",
    "book.totals": "全{chapters}章 · {pages} ページ",
    "book.tagline": "— 摂理神学 e-BOOK —",
    "book.continue": "続きから読む",
    "book.start": "読み始める",
    "book.memberOnly": "本文の閲覧は正会員専用です。管理者にお問い合わせください。",
    "book.toc": "目 次",
    "book.tocMemberOnly": "目次と本文は正会員のみ閲覧できます。",
    "book.noChapters": "まだ章がありません。",
    "book.chapter": "第 {n} 章",
    "book.loading": "読み込み中…",

    "read.bookmark": "ブックマーク",
    "read.bookmarkPrompt": "メモ(任意):",
    "read.bookmarkSaved": "ブックマーク保存",
    "read.prev": "前へ",
    "read.next": "次へ",
    "read.loading": "読み込み中…",

    "common.notFound": "ページが見つかりません。",
    "common.home": "ホームへ",
    "common.retry": "再試行",
    "common.error": "問題が発生しました",
  },
  zh: {
    "brand.suffix": "e-BOOK",
    "nav.library": "图书馆",
    "nav.admin": "管理",
    "nav.users": "会员管理",
    "nav.signOut": "退出",
    "nav.signIn": "登录",
    "nav.language": "语言",
    "nav.about": "关于",
    "nav.publications": "出版物",
    "nav.editorial": "编委会",

    "home.subtitle": "欢迎来到会员专属数字图书馆。",
    "home.enterLibrary": "进入图书馆",
    "home.loginSignup": "登录 / 注册",
    "home.shelf.best": "畅销书",
    "home.shelf.new": "新作",
    "home.shelf.poem": "诗集",
    "home.more": "更多 →",
    "home.comingSoon": "即将推出",

    "library.title": "图书馆",
    "library.subtitle": "请选择您要阅读的书。",
    "library.loading": "加载中…",
    "library.empty": "尚无已发布的书籍。",

    "login.signIn": "登录",
    "login.signUp": "注册",
    "login.email": "邮箱",
    "login.password": "密码",
    "login.passwordMin": "密码 (至少6位)",
    "login.displayName": "显示名称",
    "login.namePlaceholder": "姓名",
    "login.or": "或",
    "login.google": "使用 Google 继续",
    "login.noAccount": "还没有账号?",
    "login.success": "登录成功",
    "login.signupComplete": "注册完成!请查收邮件。",

    "book.back": "图书馆",
    "book.totals": "共 {chapters} 章 · {pages} 页",
    "book.tagline": "— 摄理神学 e-BOOK —",
    "book.continue": "继续阅读",
    "book.start": "开始阅读",
    "book.memberOnly": "正文阅读仅限正式会员。请向管理员申请会员升级。",
    "book.toc": "目 录",
    "book.tocMemberOnly": "目录与正文仅正式会员可查看。",
    "book.noChapters": "暂无章节。",
    "book.chapter": "第 {n} 章",
    "book.loading": "加载中…",

    "read.bookmark": "书签",
    "read.bookmarkPrompt": "备注(可选):",
    "read.bookmarkSaved": "书签已保存",
    "read.prev": "上一页",
    "read.next": "下一页",
    "read.loading": "加载中…",

    "common.notFound": "未找到页面。",
    "common.home": "首页",
    "common.retry": "重试",
    "common.error": "出现问题",
  },
  es: {
    "brand.suffix": "e-BOOK",
    "nav.library": "Biblioteca",
    "nav.admin": "Admin",
    "nav.users": "Miembros",
    "nav.signOut": "Cerrar sesión",
    "nav.signIn": "Iniciar sesión",
    "nav.language": "Idioma",
    "nav.about": "Acerca",
    "nav.publications": "Publicaciones",
    "nav.editorial": "Comité Editorial",

    "home.subtitle": "Bienvenido a la biblioteca digital exclusiva para miembros.",
    "home.enterLibrary": "Entrar a la biblioteca",
    "home.loginSignup": "Entrar / Registrarse",
    "home.shelf.best": "Más vendidos",
    "home.shelf.new": "Novedades",
    "home.shelf.poem": "Poesía",
    "home.more": "Ver más →",
    "home.comingSoon": "Próximamente",

    "library.title": "Biblioteca",
    "library.subtitle": "Elige un libro para leer.",
    "library.loading": "Cargando…",
    "library.empty": "Aún no hay libros publicados.",

    "login.signIn": "Iniciar sesión",
    "login.signUp": "Registrarse",
    "login.email": "Correo electrónico",
    "login.password": "Contraseña",
    "login.passwordMin": "Contraseña (mín. 6)",
    "login.displayName": "Nombre visible",
    "login.namePlaceholder": "Nombre",
    "login.or": "o",
    "login.google": "Continuar con Google",
    "login.noAccount": "¿No tienes cuenta?",
    "login.success": "Sesión iniciada",
    "login.signupComplete": "¡Registro completo! Revisa tu correo.",

    "book.back": "Biblioteca",
    "book.totals": "{chapters} capítulos · {pages} páginas",
    "book.tagline": "— Teología de la Providencia e-BOOK —",
    "book.continue": "Continuar leyendo",
    "book.start": "Empezar a leer",
    "book.memberOnly": "La lectura es solo para miembros titulares. Solicita el ascenso al administrador.",
    "book.toc": "Índice",
    "book.tocMemberOnly": "El índice y el contenido son solo para miembros titulares.",
    "book.noChapters": "Aún no hay capítulos.",
    "book.chapter": "Capítulo {n}",
    "book.loading": "Cargando…",

    "read.bookmark": "Marcador",
    "read.bookmarkPrompt": "Nota (opcional):",
    "read.bookmarkSaved": "Marcador guardado",
    "read.prev": "Anterior",
    "read.next": "Siguiente",
    "read.loading": "Cargando…",

    "common.notFound": "Página no encontrada.",
    "common.home": "Inicio",
    "common.retry": "Reintentar",
    "common.error": "Algo salió mal",
  },
  fr: {
    "brand.suffix": "e-BOOK",
    "nav.library": "Bibliothèque",
    "nav.admin": "Admin",
    "nav.users": "Membres",
    "nav.signOut": "Déconnexion",
    "nav.signIn": "Connexion",
    "nav.language": "Langue",
    "nav.about": "À propos",
    "nav.publications": "Publications",
    "nav.editorial": "Comité éditorial",

    "home.subtitle": "Bienvenue dans la bibliothèque numérique réservée aux membres.",
    "home.enterLibrary": "Entrer dans la bibliothèque",
    "home.loginSignup": "Connexion / Inscription",
    "home.shelf.best": "Meilleures ventes",
    "home.shelf.new": "Nouveautés",
    "home.shelf.poem": "Poésie",
    "home.more": "Plus →",
    "home.comingSoon": "Bientôt",

    "library.title": "Bibliothèque",
    "library.subtitle": "Choisissez un livre à lire.",
    "library.loading": "Chargement…",
    "library.empty": "Aucun livre publié pour le moment.",

    "login.signIn": "Connexion",
    "login.signUp": "Inscription",
    "login.email": "E-mail",
    "login.password": "Mot de passe",
    "login.passwordMin": "Mot de passe (6 caractères min.)",
    "login.displayName": "Nom affiché",
    "login.namePlaceholder": "Nom",
    "login.or": "ou",
    "login.google": "Continuer avec Google",
    "login.noAccount": "Pas encore de compte ?",
    "login.success": "Connecté",
    "login.signupComplete": "Inscription terminée ! Vérifiez votre e-mail.",

    "book.back": "Bibliothèque",
    "book.totals": "{chapters} chapitres · {pages} pages",
    "book.tagline": "— Théologie de la Providence e-BOOK —",
    "book.continue": "Reprendre la lecture",
    "book.start": "Commencer la lecture",
    "book.memberOnly": "La lecture est réservée aux membres titulaires. Demandez la promotion à l'administrateur.",
    "book.toc": "Table des matières",
    "book.tocMemberOnly": "La table et le contenu sont réservés aux membres titulaires.",
    "book.noChapters": "Pas encore de chapitres.",
    "book.chapter": "Chapitre {n}",
    "book.loading": "Chargement…",

    "read.bookmark": "Signet",
    "read.bookmarkPrompt": "Note (facultative) :",
    "read.bookmarkSaved": "Signet enregistré",
    "read.prev": "Précédent",
    "read.next": "Suivant",
    "read.loading": "Chargement…",

    "common.notFound": "Page introuvable.",
    "common.home": "Accueil",
    "common.retry": "Réessayer",
    "common.error": "Une erreur est survenue",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string, vars?: Record<string, string | number>) => string };
const I18nCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "app.lang";

function detectInitial(): Lang {
  // 기본은 항상 한국어. 사용자가 직접 선택한 언어만 기억합니다.
  if (typeof window === "undefined") return "ko";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && dict[saved]) return saved;
  return "ko";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => { setLangState(detectInitial()); }, []);
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    const raw = dict[lang][key] ?? dict.ko[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  };

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
