import { Link } from "@tanstack/react-router";
import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useBottomItems } from "@/components/BottomBar";
import { useSettings } from "@/lib/store";

export function Footer() {
  const { data: settings } = useSettings();
  const items = useBottomItems();

  const socials = [
    { href: settings?.instagram, label: "إنستغرام", icon: Instagram },
    { href: settings?.facebook, label: "فيسبوك", icon: Facebook },
    { href: settings?.tiktok, label: "تيك توك", icon: Music2 },
    { href: settings?.snapchat, label: "سناب شات", icon: Send },
    { href: settings?.twitter, label: "إكس (تويتر)", icon: Twitter },
    { href: settings?.youtube, label: "يوتيوب", icon: Youtube },
  ].filter((s) => Boolean(s.href));

  const whatsapp = settings?.whatsapp_number;

  return (
    <footer className="mt-16 border-t border-border bg-card pb-24 md:pb-0">
      {/* Icon button navigation */}
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <ul className="grid grid-cols-5 gap-2 rounded-3xl border border-border bg-background p-3 shadow-soft">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                to={item.to}
                search={item.search as never}
                aria-label={item.label}
                className="group flex flex-col items-center gap-2 rounded-2xl py-3 transition-colors hover:bg-secondary"
              >
                <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary transition-all group-hover:gradient-gold group-hover:text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-bold text-foreground">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <BrandMark size="md" />
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {settings?.about ??
              "متجر متخصص في منتجات العناية بالبشرة والشعر والمكياج والعطور بجودة أصلية مضمونة."}
          </p>
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href as string}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary transition-colors hover:gradient-gold hover:text-primary-foreground"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold">روابط سريعة</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/products" className="hover:text-primary">جميع المنتجات</Link></li>
            <li><Link to="/favorites" className="hover:text-primary">المفضلة</Link></li>
            <li><Link to="/account" className="hover:text-primary">حسابي</Link></li>
            <li><Link to="/about" className="hover:text-primary">من نحن</Link></li>
            <li><Link to="/contact" className="hover:text-primary">تواصل معنا</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold">تواصل معنا</h3>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            {whatsapp && (
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                  الطلب عبر واتساب
                </a>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span dir="ltr">{settings?.phone ?? "+967780187409"}</span>
            </li>
            {settings?.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span dir="ltr">{settings.email}</span>
              </li>
            )}
            {settings?.address && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings?.working_hours && (
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{settings.working_hours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings?.store_name ?? "إيهاب ستور للعناية والتجميل"} — جميع الحقوق محفوظة ·{" "}
        <Link to="/admin" className="hover:text-primary">لوحة التحكم</Link>
      </div>
    </footer>
  );
}
