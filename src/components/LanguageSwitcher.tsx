import { Button } from "@/components/ui/button";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
      {LANGS.map((l) => {
        const active = l.code === lang;
        return (
          <Button
            key={l.code}
            variant={active ? "default" : "ghost"}
            size="sm"
            onClick={() => setLang(l.code as Lang)}
            aria-pressed={active}
            className={
              "h-7 px-2 text-xs " +
              (active ? "" : "text-muted-foreground hover:text-foreground")
            }
            title={l.label}
          >
            {l.native}
          </Button>
        );
      })}
    </div>
  );
}
