import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookPlus, Upload, Pencil, CheckCircle2, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { parseHtmlFile, recleanStoredPage } from "@/lib/html-import";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "관리 — 섭리 신학 e-BOOK" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Book = { id: string; title: string; description: string | null; language: string; is_published: boolean; created_at: string };

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/login" });
      else if (!isAdmin) navigate({ to: "/library" });
    }
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    setBooks((data as Book[]) ?? []);
  };
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

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
      toast.success(`업로드 완료: ${parsed.pages.length}페이지`);
      refresh();
    } catch (e: any) { toast.error(e?.message || "업로드 실패"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const recleanAll = async () => {
    if (!confirm("기존에 업로드한 모든 페이지를 다시 정제합니다. 진행할까요?")) return;
    setUploading(true);
    try {
      const { data: all } = await supabase.from("pages").select("id,content_html");
      if (!all) { toast.error("페이지를 불러올 수 없습니다."); return; }
      let n = 0;
      for (const p of all) {
        const cleaned = recleanStoredPage(p.content_html);
        if (cleaned !== p.content_html) {
          await supabase.from("pages").update({ content_html: cleaned }).eq("id", p.id);
          n++;
        }
      }
      toast.success(`정제 완료: ${n}/${all.length} 페이지 업데이트`);
    } catch (e: any) { toast.error(e?.message || "정제 실패"); }
    finally { setUploading(false); }
  };

  const createBook = async () => {
    const title = prompt("책 제목:"); if (!title) return;
    const { error } = await supabase.from("books").insert({ title, created_by: user!.id });
    if (error) return toast.error(error.message);
    toast.success("책 생성"); refresh();
  };
  const publishBook = async (b: Book) => {
    const { error } = await supabase.from("books").update({ is_published: !b.is_published }).eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success(b.is_published ? "비공개로 전환" : "도서관에 게시됨");
    refresh();
  };
  const deleteBook = async (id: string) => {
    if (!confirm("이 책과 모든 챕터/페이지를 삭제합니다.")) return;
    await supabase.from("books").delete().eq("id", id);
    refresh();
  };

  if (loading || !isAdmin) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-8 text-center">권한 확인 중…</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div>
            <h1 className="font-serif text-3xl font-bold">관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">책을 한 줄로 표시합니다. 수정 후 [완료]를 누르면 도서관에 게시됩니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept=".html,.htm,text/html" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHtmlUpload(f); }} />
            <Button variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" />{uploading ? "처리 중…" : "HTML 업로드"}
            </Button>
            <Button variant="secondary" disabled={uploading} onClick={recleanAll}>기존 책 정제</Button>
            <Button onClick={createBook}><BookPlus className="mr-1 h-4 w-4" />새 책</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[1fr_2fr_110px_320px] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div>제목</div>
            <div>설명</div>
            <div>상태</div>
            <div className="text-right">작업</div>
          </div>
          {books.map((b) => (
            <div key={b.id} className="grid grid-cols-[1fr_2fr_110px_320px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/20">
              <div className="min-w-0">
                <div className="truncate font-medium">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.language.toUpperCase()} · {new Date(b.created_at).toLocaleDateString()}</div>
              </div>
              <div className="line-clamp-2 text-sm text-muted-foreground">{b.description || "—"}</div>
              <div>
                {b.is_published
                  ? <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">게시됨</span>
                  : <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">비공개</span>}
              </div>
              <div className="flex justify-end gap-2">
                <Link to="/admin/book/$bookId" params={{ bookId: b.id }}>
                  <Button size="sm" variant="outline"><Pencil className="mr-1 h-3 w-3" />수정</Button>
                </Link>
                <Button size="sm" onClick={() => publishBook(b)}>
                  {b.is_published
                    ? <><EyeOff className="mr-1 h-3 w-3" />비공개</>
                    : <><CheckCircle2 className="mr-1 h-3 w-3" />완료</>}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteBook(b.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {books.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">아직 책이 없습니다. HTML 업로드 또는 새 책으로 시작하세요.</div>
          )}
        </div>
      </main>
    </div>
  );
}
