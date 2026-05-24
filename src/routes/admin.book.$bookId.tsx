import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, FilePlus, Trash2, Save, Pencil, ChevronDown, ChevronRight, CheckCircle2, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/book/$bookId")({
  head: () => ({ meta: [{ title: "책 편집 — 섭리 신학 e-BOOK" }, { name: "robots", content: "noindex" }] }),
  component: BookEditPage,
});

type Book = { id: string; title: string; description: string | null; language: string; is_published: boolean };
type Chapter = { id: string; book_id: string; title: string; order_index: number };
type PageRow = { id: string; chapter_id: string; page_number: number; content_html: string };

function BookEditPage() {
  const { bookId } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [openChapter, setOpenChapter] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/login" });
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    const { data: b } = await supabase.from("books").select("*").eq("id", bookId).single();
    setBook(b as Book);
    const { data: c } = await supabase.from("chapters").select("*").eq("book_id", bookId).order("order_index");
    setChapters((c as Chapter[]) ?? []);
    if (c && c.length > 0) {
      const { data: p } = await supabase.from("pages").select("*").in("chapter_id", c.map((x: any) => x.id)).order("page_number");
      setPages((p as PageRow[]) ?? []);
      if (!openChapter) setOpenChapter((c[0] as any).id);
    }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, bookId]);

  const saveBook = async () => {
    if (!book) return;
    const { error } = await supabase.from("books").update({
      title: book.title, description: book.description, language: book.language,
    }).eq("id", book.id);
    if (error) toast.error(error.message); else toast.success("저장됨");
  };
  const publish = async () => {
    if (!book) return;
    const { error } = await supabase.from("books").update({ is_published: !book.is_published }).eq("id", book.id);
    if (error) return toast.error(error.message);
    toast.success(book.is_published ? "비공개로 전환" : "도서관에 게시됨");
    load();
  };
  const createChapter = async () => {
    const title = prompt("챕터 제목:"); if (!title) return;
    await supabase.from("chapters").insert({ book_id: bookId, title, order_index: chapters.length });
    load();
  };
  const deleteChapter = async (id: string) => {
    if (!confirm("이 챕터를 삭제합니다.")) return;
    await supabase.from("chapters").delete().eq("id", id); load();
  };
  const createPage = async (chapterId: string) => {
    const max = Math.max(0, ...pages.filter((p) => p.chapter_id === chapterId).map((p) => p.page_number));
    const { data, error } = await supabase.from("pages").insert({ chapter_id: chapterId, page_number: max + 1, content_html: "" }).select().single();
    if (error) return toast.error(error.message);
    if (data) navigate({ to: "/admin/edit/$pageId", params: { pageId: (data as PageRow).id } });
  };
  const deletePage = async (id: string) => {
    if (!confirm("페이지 삭제?")) return;
    await supabase.from("pages").delete().eq("id", id); load();
  };

  if (loading || !isAdmin || !book) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-8 text-center">불러오는 중…</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />관리자
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-bold">{book.title}</h1>

        <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
          <div><Label>제목</Label><Input value={book.title} onChange={(e) => setBook({ ...book, title: e.target.value })} /></div>
          <div><Label>언어</Label>
            <Select value={book.language} onValueChange={(v) => setBook({ ...book, language: v })}>
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
            <Textarea value={book.description ?? ""} onChange={(e) => setBook({ ...book, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button onClick={saveBook} variant="outline"><Save className="mr-1 h-4 w-4" />책 정보 저장</Button>
            <Button onClick={publish}>
              {book.is_published
                ? <><EyeOff className="mr-1 h-4 w-4" />비공개로</>
                : <><CheckCircle2 className="mr-1 h-4 w-4" />완료 — 도서관에 게시</>}
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">챕터 & 페이지</h2>
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
                          <div key={p.id} className="flex items-center gap-1">
                            <Link to="/admin/edit/$pageId" params={{ pageId: p.id }}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1 text-sm hover:border-primary">
                              <Pencil className="h-3 w-3" />p.{p.page_number}
                            </Link>
                            <Button size="sm" variant="ghost" onClick={() => deletePage(p.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
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
      </main>
    </div>
  );
}
