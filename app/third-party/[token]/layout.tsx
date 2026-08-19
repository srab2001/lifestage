import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ThirdPartyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader minimal />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
