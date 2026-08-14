import { Link, useRouterState } from "@tanstack/react-router";
import { useNavEntries } from "@/lib/nav-items";
import { DEFAULT_NAV, useActiveTheme } from "@/lib/theme";

/**
 * Fixed icon navigation. Order, position and shape all come from the
 * active theme, so the dashboard can redesign it without code changes.
 */
export function AppNav() {
  const theme = useActiveTheme();
  const entries = useNavEntries(theme?.nav_items?.length ? theme.nav_items : DEFAULT_NAV);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin") || pathname.startsWith("/settingsin")) return null;

  const position = theme?.nav_position ?? "bottom";
  const style = theme?.nav_style ?? "pill";
  const labels = theme?.show_labels !== false;

  const shape = style === "round" ? "rounded-full" : style === "flat" ? "rounded-lg" : "rounded-2xl";

  const shell =
    position === "top"
      ? "fixed inset-x-0 top-[64px] z-40 md:top-[80px]"
      : position === "floating"
        ? "fixed inset-x-0 bottom-4 z-40 px-4"
        : "fixed inset-x-0 bottom-0 z-40";

  const box =
    position === "floating"
      ? "mx-auto flex max-w-md items-stretch justify-between gap-1 rounded-[28px] border border-border bg-card/95 p-2 shadow-lift backdrop-blur-xl"
      : "mx-auto flex max-w-2xl items-stretch justify-between gap-1 border-t border-border bg-card/95 px-2 py-1.5 backdrop-blur-xl md:mb-3 md:rounded-[26px] md:border md:shadow-lift";

  return (
    <nav
      aria-label="التنقل السريع"
      className={`${shell} pb-[env(safe-area-inset-bottom)]`}
    >
      <div className={box}>
        {entries.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.key}
              to={item.to}
              search={item.search as never}
              aria-label={item.label}
              className="group flex flex-1 flex-col items-center justify-center gap-1 py-1.5"
            >
              <span
                className={`relative flex h-10 w-10 items-center justify-center ${shape} transition-all duration-200 ${
                  active
                    ? "gradient-gold text-primary-foreground shadow-soft"
                    : "bg-secondary/60 text-muted-foreground group-hover:bg-secondary group-hover:text-primary"
                }`}
              >
                <item.icon className="h-[19px] w-[19px]" />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </span>
              {labels && (
                <span
                  className={`text-[10px] font-bold leading-none ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
