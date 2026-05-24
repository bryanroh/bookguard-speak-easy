import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, BookPlus, FilePlus, Save, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { RichEditor } from "@/components/RichEditor";
import { parseHtmlFile } from "@/lib/html-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "관리 — 섭리 웹북" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Book = { id: string; title: string; description: string | null; language: string; is_published: boolean };
type Chapter = { id: string; book_id: string; title: string; order_index: number };
type PageRow = { id: string; chapter_id: string; page_number: number; content_html: string };

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<PageRow | null>(null);
  const [pageHtml, setPageHtml] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHtmlUpload = async (file: File) => {
    setUploading(true);
    try {
      const text = await file.text();
      const parsed = parseHtmlFile(text);
      if (parsed.pages.length === 0) { toast.error("페이지를 추출할 수 없습니다."); return; }
      const { data: book, error: be } = await supabase.from("books")
        .insert({ title: parsed.title, created_by: user!.id, language: "ko" })
        .select().single();
      if (be || !book) { toast.error(be?.message || "책 생성 실패"); return; }
      const { data: chapter, error: ce } = await supabase.from("chapters")
        .insert({ book_id: book.id, title: parsed.title, order_index: 0 })
        .select().single();
      if (ce || !chapter) { toast.error(ce?.message || "챕터 생성 실패"); return; }
      const rows = parsed.pages.map((html, i) => ({ chapter_id: chapter.id, page_number: i + 1, content_html: html }));
      const { error: pe } = await supabase.from("pages").insert(rows);
      if (pe) { toast.error(pe.message); return; }
      toast.success(`업로드 완료: ${parsed.pages.length}페이지 (서식 유지)`);
      setSelectedBookId(book.id);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/login" });
      else if (!isAdmin) navigate({ to: "/library" });
    }
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const { data: b } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    setBooks(b ?? []);
    if (selectedBookId) {
      const { data: c } = await supabase.from("chapters").select("*").eq("book_id", selectedBookId).order("order_index");
      setChapters(c ?? []);
      if (c && c.length > 0) {
        const { data: p } = await supabase.from("pages").select("*").in("chapter_id", c.map((x) => x.id)).order("page_number");
        setPages(p ?? []);
      } else setPages([]);
    }
  };
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin, selectedBookId]);

  const createBook = async () => {
    const title = prompt("책 제목:"); if (!title) return;
    const { error } = await supabase.from("books").insert({ title, created_by: user!.id });
    if (error) return toast.error(error.message);
    toast.success("책 생성"); refresh();
  };
  const updateBook = async (id: string, patch: Partial<Book>) => {
    const { error } = await supabase.from("books").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("저장됨"); refresh(); }
  };
  const deleteBook = async (id: string) => {
    if (!confirm("이 책과 모든 챕터/페이지를 삭제합니다.")) return;
    await supabase.from("books").delete().eq("id", id);
    setSelectedBookId(null); refresh();
  };

  const createChapter = async () => {
    if (!selectedBookId) return;
    const title = prompt("챕터 제목:"); if (!title) return;
    const order = chapters.length;
    await supabase.from("chapters").insert({ book_id: selectedBookId, title, order_index: order });
    refresh();
  };
  const deleteChapter = async (id: string) => {
    if (!confirm("이 챕터를 삭제합니다.")) return;
    await supabase.from("chapters").delete().eq("id", id); refresh();
  };

  const createPage = async (chapterId: string) => {
    const max = Math.max(0, ...pages.filter((p) => p.chapter_id === chapterId).map((p) => p.page_number));
    const { data, error } = await supabase.from("pages").insert({ chapter_id: chapterId, page_number: max + 1, content_html: "" }).select().single();
    if (error) return toast.error(error.message);
    refresh();
    if (data) { setEditingPage(data as PageRow); setPageHtml(""); }
  };
  const deletePage = async (id: string) => {
    if (!confirm("페이지 삭제?")) return;
    await supabase.from("pages").delete().eq("id", id);
    if (editingPage?.id === id) setEditingPage(null);
    refresh();
  };
  const savePage = async () => {
    if (!editingPage) return;
    const { error } = await supabase.from("pages").update({ content_html: pageHtml }).eq("id", editingPage.id);
    if (error) toast.error(error.message); else toast.success("저장됨");
    refresh();
  };

  const selectedBook = books.find((b) => b.id === selectedBookId);

  if (loading || !isAdmin) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-8 text-center">권한 확인 중…</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-2">
          <h1 className="font-serif text-3xl font-bold">관리</h1>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".html,.htm,text/html"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHtmlUpload(f); }} />
            <Button variant="outline" disabled={uploading}
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" />{uploading ? "업로드 중…" : "HTML 업로드"}
            </Button>
            <Button onClick={createBook}><BookPlus className="mr-1 h-4 w-4" />새 책</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Books list */}
          <aside className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">책 목록</h2>
            {books.map((b) => (
              <button key={b.id} onClick={() => setSelectedBookId(b.id)}
                className={`block w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:border-primary ${selectedBookId === b.id ? "border-primary bg-primary/5" : "bg-card"}`}>
                <div className="font-medium">{b.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{b.language.toUpperCase()} · {b.is_published ? "게시됨" : "비공개"}</div>
              </button>
            ))}
            {books.length === 0 && <p className="text-sm text-muted-foreground">아직 책이 없습니다.</p>}
          </aside>

          {/* Detail */}
          <section>
            {!selectedBook ? (
              <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">왼쪽에서 책을 선택하세요.</div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>제목</Label><Input value={selectedBook.title} onChange={(e) => setBooks((bs) => bs.map((b) => b.id === selectedBook.id ? { ...b, title: e.target.value } : b))} /></div>
                    <div><Label>언어</Label>
                      <Select value={selectedBook.language} onValueChange={(v) => setBooks((bs) => bs.map((b) => b.id === selectedBook.id ? { ...b, language: v } : b))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ko">한국어</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ja">日本語</SelectItem>
                          <SelectItem value="zh">中文</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2"><Label>설명</Label>
                      <Textarea value={selectedBook.description ?? ""} onChange={(e) => setBooks((bs) => bs.map((b) => b.id === selectedBook.id ? { ...b, description: e.target.value } : b))} />
                    </div>
                    <div className="flex items-center gap-2"><Switch checked={selectedBook.is_published} onCheckedChange={(v) => setBooks((bs) => bs.map((b) => b.id === selectedBook.id ? { ...b, is_published: v } : b))} /><Label>게시</Label></div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <Button variant="destructive" size="sm" onClick={() => deleteBook(selectedBook.id)}><Trash2 className="mr-1 h-4 w-4" />책 삭제</Button>
                    <Button size="sm" onClick={() => updateBook(selectedBook.id, { title: selectedBook.title, description: selectedBook.description, language: selectedBook.language, is_published: selectedBook.is_published })}><Save className="mr-1 h-4 w-4" />저장</Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-serif text-lg font-semibold">챕터 & 페이지</h3>
                    <Button size="sm" onClick={createChapter}><Plus className="mr-1 h-4 w-4" />챕터 추가</Button>
                  </div>
                  <div className="space-y-2">
                    {chapters.map((c) => {
                      const cPages = pages.filter((p) => p.chapter_id === c.id);
                      const open = openChapter === c.id;
                      return (
                        <div key={c.id} className="rounded-md border border-border">
                          <div className="flex items-center justify-between px-3 py-2">
                            <button onClick={() => setOpenChapter(open ? null : c.id)} className="flex items-center gap-2 text-left">
                              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="font-medium">{c.title}</span>
                              <span className="text-xs text-muted-foreground">({cPages.length} 페이지)</span>
                            </button>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => createPage(c.id)}><FilePlus className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteChapter(c.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                          {open && (
                            <div className="border-t border-border bg-muted/20 p-3">
                              <div className="flex flex-wrap gap-2">
                                {cPages.map((p) => (
                                  <button key={p.id} onClick={() => { setEditingPage(p); setPageHtml(p.content_html); }}
                                    className={`rounded-md border border-border px-3 py-1 text-sm ${editingPage?.id === p.id ? "border-primary bg-primary/10" : "bg-card"}`}>
                                    p.{p.page_number}
                                  </button>
                                ))}
                                {cPages.length === 0 && <p className="text-xs text-muted-foreground">페이지 없음. + 버튼으로 추가</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {chapters.length === 0 && <p className="text-sm text-muted-foreground">챕터를 추가하세요.</p>}
                  </div>
                </div>

                {editingPage && (
                  <div className="rounded-lg border border-border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-serif text-lg font-semibold">페이지 {editingPage.page_number} 편집</h3>
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={() => deletePage(editingPage.id)}><Trash2 className="mr-1 h-4 w-4" />삭제</Button>
                        <Button size="sm" onClick={savePage}><Save className="mr-1 h-4 w-4" />저장</Button>
                      </div>
                    </div>
                    <RichEditor value={pageHtml} onChange={setPageHtml} placeholder="여기에 본문을 입력하세요…" />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
