import { Button } from "@/components/ui/button";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ variant = "row" }: { variant?: "row" | "grid" }) {
  const { lang, setLang } = useI18n();
  const wrap =
    variant === "grid"
      ? "grid grid-cols-3 gap-2"
      : "flex flex-nowrap items-center gap-1";

  return (
    <div className={wrap}>
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
              "h-8 px-3 text-sm whitespace-nowrap " +
              (variant === "grid" ? "w-full border border-border " : "") +
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
