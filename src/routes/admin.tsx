import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookPlus, Upload, Pencil, CheckCircle2, EyeOff, Trash2, FilePlus, Scissors } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { parseHtmlFile, recleanStoredPage, resplitCombinedHtml } from "@/lib/html-import";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "관리 — 섭리 신학 e-BOOK" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Book = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  is_published: boolean;
  created_at: string;
};
type Chapter = { id: string; title: string; order_index: number };
type PageRow = { id: string; chapter_id: string; page_number: number };

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState<string>("");
  const [savingDescId, setSavingDescId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"date" | "title" | "lecture">("date");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pagesByBook, setPagesByBook] = useState<
    Record<string, { chapter: Chapter; pages: PageRow[] }[]>
  >({});

  const filteredBooks = searchQuery.trim()
    ? books.filter((b) => b.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : books;
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortMode === "title") return a.title.localeCompare(b.title, "ko");
    if (sortMode === "lecture")
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditTitle = (b: Book) => {
    setEditingTitleId(b.id);
    setTitleDraft(b.title);
  };
  const commitTitle = async (b: Book) => {
    const next = titleDraft.trim();
    setEditingTitleId(null);
    if (!next || next === b.title) {
      setTitleDraft("");
      return;
    }
    setSavingTitleId(b.id);
    const { error } = await supabase.from("books").update({ title: next }).eq("id", b.id);
    setSavingTitleId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("제목 저장됨");
    setBooks((prev) => prev.map((x) => (x.id === b.id ? { ...x, title: next } : x)));
  };

  const startEditDesc = (b: Book) => {
    setEditingDescId(b.id);
    setDescDraft(b.description ?? "");
  };
  const commitDesc = async (b: Book) => {
    const next = descDraft.trim();
    setEditingDescId(null);
    if (next === (b.description ?? "")) {
      setDescDraft("");
      return;
    }
    setSavingDescId(b.id);
    const { error } = await supabase
      .from("books")
      .update({ description: next || null })
      .eq("id", b.id);
    setSavingDescId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("설명 저장됨");
    setBooks((prev) =>
      prev.map((x) => (x.id === b.id ? { ...x, description: next || null } : x)),
    );
  };

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/login" });
      else if (!isAdmin) navigate({ to: "/library" });
    }
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    setBooks((data as Book[]) ?? []);
  };
  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  if (location.pathname.startsWith("/admin/") && location.pathname !== "/admin") {
    return <Outlet />;
  }

  const loadPages = async (bookId: string) => {
    if (pagesByBook[bookId]) return;
    const { data: cs } = await supabase
      .from("chapters")
      .select("id,title,order_index")
      .eq("book_id", bookId)
      .order("order_index");
    const chapters = (cs as Chapter[]) ?? [];
    if (chapters.length === 0) {
      setPagesByBook((p) => ({ ...p, [bookId]: [] }));
      return;
    }
    const { data: ps } = await supabase
      .from("pages")
      .select("id,chapter_id,page_number")
      .in(
        "chapter_id",
        chapters.map((c) => c.id),
      )
      .order("page_number");
    const pages = (ps as PageRow[]) ?? [];
    setPagesByBook((p) => ({
      ...p,
      [bookId]: chapters.map((c) => ({
        chapter: c,
        pages: pages.filter((x) => x.chapter_id === c.id),
      })),
    }));
  };

  const toggle = async (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) await loadPages(next);
  };

  const handleHtmlUpload = async (file: File) => {
    setUploading(true);
    try {
      const text = await file.text();
      const parsed = parseHtmlFile(text);
      if (parsed.pages.length === 0) {
        toast.error("페이지를 추출할 수 없습니다.");
        return;
      }
      const { data: book, error: be } = await supabase
        .from("books")
        .insert({ title: parsed.title, created_by: user!.id, language: "ko" })
        .select()
        .single();
      if (be || !book) {
        toast.error(be?.message || "책 생성 실패");
        return;
      }
      const { data: chapter, error: ce } = await supabase
        .from("chapters")
        .insert({ book_id: book.id, title: parsed.title, order_index: 0 })
        .select()
        .single();
      if (ce || !chapter) {
        toast.error(ce?.message || "챕터 생성 실패");
        return;
      }
      const rows = parsed.pages.map((html, i) => ({
        chapter_id: chapter.id,
        page_number: i + 1,
        content_html: html,
      }));
      const { error: pe } = await supabase.from("pages").insert(rows);
      if (pe) {
        toast.error(pe.message);
        return;
      }
      toast.success(`업로드 완료: ${parsed.pages.length}페이지`);
      refresh();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "업로드 실패"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const recleanAll = async () => {
    if (!confirm("기존에 업로드한 모든 페이지를 다시 정제합니다. 진행할까요?")) return;
    setUploading(true);
    try {
      const { data: all } = await supabase.from("pages").select("id,content_html");
      if (!all) {
        toast.error("페이지를 불러올 수 없습니다.");
        return;
      }
      let n = 0;
      for (const p of all) {
        const cleaned = recleanStoredPage(p.content_html);
        if (cleaned !== p.content_html) {
          await supabase.from("pages").update({ content_html: cleaned }).eq("id", p.id);
          n++;
        }
      }
      toast.success(`정제 완료: ${n}/${all.length} 페이지 업데이트`);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "정제 실패"));
    } finally {
      setUploading(false);
    }
  };

  const createBook = async () => {
    const title = prompt("책 제목:");
    if (!title) return;
    const { error } = await supabase.from("books").insert({ title, created_by: user!.id });
    if (error) return toast.error(error.message);
    toast.success("책 생성");
    refresh();
  };
  const publishBook = async (b: Book) => {
    const { error } = await supabase
      .from("books")
      .update({ is_published: !b.is_published })
      .eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success(b.is_published ? "비공개로 전환" : "도서관에 게시됨");
    refresh();
  };
  const deleteBook = async (id: string) => {
    if (!confirm("이 책과 모든 챕터/페이지를 삭제합니다.")) return;
    await supabase.from("books").delete().eq("id", id);
    setPagesByBook((p) => {
      const c = { ...p };
      delete c[id];
      return c;
    });
    refresh();
  };

  const resplitBook = async (b: Book) => {
    if (
      !confirm(
        `"${b.title}"의 모든 페이지를 합쳐서 다시 페이지별로 자동 분할합니다.\n원본 내용은 그대로 보존되고 페이지 단위만 새로 나뉩니다. 진행할까요?`,
      )
    )
      return;
    setUploading(true);
    try {
      const { data: cs } = await supabase
        .from("chapters")
        .select("id")
        .eq("book_id", b.id)
        .order("order_index");
      const chapters = cs ?? [];
      if (chapters.length === 0) {
        toast.error("챕터가 없습니다.");
        return;
      }
      const chapterId = chapters[0].id;
      const { data: ps } = await supabase
        .from("pages")
        .select("id,page_number,content_html")
        .in(
          "chapter_id",
          chapters.map((c) => c.id),
        )
        .order("page_number");
      const allPages = ps ?? [];
      if (allPages.length === 0) {
        toast.error("페이지가 없습니다.");
        return;
      }
      const combined = allPages.map((p) => p.content_html).join("\n");
      const newPages = resplitCombinedHtml(combined);
      if (newPages.length <= allPages.length) {
        toast.error(
          `더 작은 페이지 단위를 찾지 못했습니다. (현재 ${allPages.length} → 분할 결과 ${newPages.length})`,
        );
        return;
      }
      // Delete pages across all chapters of this book, then insert into first chapter
      const { error: de } = await supabase
        .from("pages")
        .delete()
        .in(
          "chapter_id",
          chapters.map((c) => c.id),
        );
      if (de) {
        toast.error(de.message);
        return;
      }
      const rows = newPages.map((html, i) => ({
        chapter_id: chapterId,
        page_number: i + 1,
        content_html: html,
      }));
      const { error: ie } = await supabase.from("pages").insert(rows);
      if (ie) {
        toast.error(ie.message);
        return;
      }
      toast.success(`재분할 완료: ${allPages.length} → ${newPages.length}페이지`);
      setPagesByBook((p) => {
        const c = { ...p };
        delete c[b.id];
        return c;
      });
      if (openId === b.id) await loadPages(b.id);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "재분할 실패"));
    } finally {
      setUploading(false);
    }
  };
  const addPage = async (bookId: string, chapterId: string) => {
    const groups = pagesByBook[bookId] ?? [];
    const max = Math.max(
      0,
      ...(groups.find((g) => g.chapter.id === chapterId)?.pages.map((p) => p.page_number) ?? []),
    );
    const { data, error } = await supabase
      .from("pages")
      .insert({ chapter_id: chapterId, page_number: max + 1, content_html: "" })
      .select()
      .single();
    if (error || !data) return toast.error(error?.message || "페이지 생성 실패");
    navigate({ to: "/admin/edit/$pageId", params: { pageId: (data as PageRow).id } });
  };

  if (loading || !isAdmin)
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-8 text-center">권한 확인 중…</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">관리자 전용</p>
          <div>
            <h1 className="font-sans text-3xl font-bold">관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              도서관의 책 카드 화면과 다르게, 관리 화면은 전체 책을 한 줄 표로 확인하고 수정합니다.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-md border border-border">
              <button
                type="button"
                onClick={() => setSortMode("lecture")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortMode === "lecture" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                강의순
              </button>
              <button
                type="button"
                onClick={() => setSortMode("title")}
                className={`border-l border-border px-3 py-1.5 text-xs font-medium transition-colors ${sortMode === "title" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                제목순
              </button>
              <button
                type="button"
                onClick={() => setSortMode("date")}
                className={`border-l border-border px-3 py-1.5 text-xs font-medium transition-colors ${sortMode === "date" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                날짜순
              </button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목으로 검색…"
              className="h-8 w-56 rounded-md border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
            />
            {searchQuery && (
              <span className="text-xs text-muted-foreground">
                {sortedBooks.length}건
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,text/html"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleHtmlUpload(f);
            }}
          />
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "처리 중…" : "HTML 업로드"}
          </Button>
          <Button variant="secondary" disabled={uploading} onClick={recleanAll}>
            기존 책 정제
          </Button>
          <Button onClick={createBook}>
            <BookPlus className="mr-1 h-4 w-4" />새 책
          </Button>
        </div>

        <section className="overflow-hidden rounded-md border border-border bg-background">
          <div className="grid grid-cols-[2.2fr_3fr_0.8fr_1.2fr] items-center border-b border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
            <span>책 제목 전체</span>
            <span>설명 내용</span>
            <span>상태</span>
            <span className="text-right">수정 / 완료</span>
          </div>

          <ul className="divide-y divide-border">
            {sortedBooks.map((b) => {
              const open = openId === b.id;
              const groups = pagesByBook[b.id] ?? [];
              const totalPages = groups.reduce((n, g) => n + g.pages.length, 0);
              return (
                <li key={b.id}>
                  <div
                    className={`grid grid-cols-[2.2fr_3fr_0.8fr_1.2fr] items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      open ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : "hover:bg-muted/30"
                    }`}
                  >
                    {editingTitleId === b.id ? (
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={() => commitTitle(b)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") {
                            setEditingTitleId(null);
                            setTitleDraft("");
                          }
                        }}
                        className="min-w-0 w-full rounded border border-primary bg-background px-2 py-1 text-sm font-medium outline-none ring-1 ring-primary/40"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditTitle(b)}
                        title="클릭해서 제목 수정"
                        className={`min-w-0 truncate text-left font-medium hover:text-primary hover:underline ${open ? "text-primary" : ""} ${savingTitleId === b.id ? "opacity-60" : ""}`}
                      >
                        {b.title}
                        {savingTitleId === b.id && " · 저장 중…"}
                      </button>
                    )}
                    {editingDescId === b.id ? (
                      <input
                        autoFocus
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        onBlur={() => commitDesc(b)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") {
                            setEditingDescId(null);
                            setDescDraft("");
                          }
                        }}
                        placeholder="설명 내용을 입력하세요"
                        className="min-w-0 w-full rounded border border-primary bg-background px-2 py-1 text-sm outline-none ring-1 ring-primary/40"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditDesc(b)}
                        title="클릭해서 설명 수정"
                        className={`min-w-0 truncate text-left text-muted-foreground hover:text-primary hover:underline ${savingDescId === b.id ? "opacity-60" : ""}`}
                      >
                        {b.description || "설명 없음 (클릭해서 추가)"}
                        {savingDescId === b.id && " · 저장 중…"}
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {b.is_published ? "게시됨" : "비공개"}
                    </p>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={open ? "default" : "outline"}
                        onClick={() => toggle(b.id)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        {open ? "선택됨" : "수정"}
                      </Button>
                      <Button
                        size="sm"
                        variant={b.is_published ? "secondary" : "default"}
                        onClick={() => publishBook(b)}
                      >
                        {b.is_published ? (
                          <>
                            <EyeOff className="mr-1 h-3 w-3" />
                            비공개
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            완료
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBook(b.id)}
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-border bg-muted/20 px-4 py-3">
                      {groups.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          불러오는 중… 또는 챕터 없음.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {groups.map((g) => (
                            <div key={g.chapter.id}>
                              <div className="mb-1 flex items-center justify-between">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  {g.chapter.title} · {g.pages.length}페이지
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addPage(b.id, g.chapter.id)}
                                >
                                  <FilePlus className="mr-1 h-3 w-3" />
                                  페이지 추가
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {g.pages.map((p) => {
                                  const selected = selectedPageId === p.id;
                                  return (
                                    <Link
                                      key={p.id}
                                      to="/admin/edit/$pageId"
                                      params={{ pageId: p.id }}
                                      onClick={() => setSelectedPageId(p.id)}
                                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                        selected
                                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                          : "border-border bg-background hover:border-primary hover:bg-primary/10 hover:text-primary"
                                      }`}
                                    >
                                      <Pencil className="h-3 w-3" />
                                      p.{p.page_number}
                                    </Link>
                                  );
                                })}
                                {g.pages.length === 0 && (
                                  <p className="text-xs text-muted-foreground">페이지 없음.</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {totalPages > 0 && (
                            <p className="pt-1 text-[11px] text-muted-foreground">
                              페이지를 클릭하면 원본 본문(글자·자간·띄어쓰기)을 바로 수정할 수
                              있습니다.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
            {books.length === 0 && (
              <li className="px-4 py-12 text-center text-sm text-muted-foreground">
                아직 책이 없습니다. HTML 업로드 또는 새 책으로 시작하세요.
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
