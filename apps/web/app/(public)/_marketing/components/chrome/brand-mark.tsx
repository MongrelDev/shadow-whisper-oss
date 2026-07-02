import Image from "next/image";
import Link from "next/link";
import type { Locale } from "~/paraglide/runtime";

import { homeHref } from "../../lib/routes";

export function BrandMark({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <Link href={homeHref(locale)} className="flex shrink-0 items-center gap-2.5 text-foreground">
      <Image src="/logo-light.svg" alt="" width={22} height={22} className="dark:hidden" priority />
      <Image
        src="/logo-dark.svg"
        alt=""
        width={22}
        height={22}
        className="hidden dark:block"
        priority
      />
      <span className="text-[15px] font-semibold tracking-tight">Shadow Whisper</span>
    </Link>
  );
}
