import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { useSettings } from "@/lib/store";

export function Footer() {
  const { data: settings } = useSettings();
  const storeName = settings?.store_name ?? "إيهاب ستور للعناية والتجميل";

  return (
    <footer className="mt-16 border-t border-border gradient-soft">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt={storeName} className="h-12 w-12" width={48} height={48} loading="lazy" />
            <span className="text-base font-extrabold">{storeName}</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {settings?.about ??
              "متجر متخصص في منتجات العناية بالبشرة والشعر والمكياج والعطور بجودة أصلية مضمونة."}
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold">روابط سريعة</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/products" className="hover:text-primary">
                جميع المنتجات
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                من نحن
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                تواصل معنا
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-primary">
                سلة المشتريات
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold">تواصل معنا</h3>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
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
            {settings?.instagram && (
              <li className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-primary" />
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="hover:text-primary">
                  إنستغرام
                </a>
              </li>
            )}
            {([
              ["facebook", "فيسبوك"],
              ["tiktok", "تيك توك"],
              ["snapchat", "سناب شات"],
              ["twitter", "إكس (تويتر)"],
              ["youtube", "يوتيوب"],
            ] as const).map(([key, label]) => {
              const href = settings?.[key];
              if (!href) return null;
              return (
                <li key={key} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <a href={href} target="_blank" rel="noreferrer" className="hover:text-primary">
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {storeName} — جميع الحقوق محفوظة ·{" "}
        <Link to="/admin" className="hover:text-primary">
          لوحة التحكم
        </Link>
      </div>
    </footer>
  );
}