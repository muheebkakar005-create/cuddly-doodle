import Link from "next/link";
import Image from "next/image";

export function Logo({ mobileOnly = false }: { mobileOnly?: boolean }) {
  if (mobileOnly) {
    return (
      <Link href="/" className="flex items-center shrink-0 pr-1" aria-label="Q_Salons Home">
        <Image
          src="/logo-mobile.png"
          alt="Q Salons"
          width={36}
          height={36}
          priority
          className="h-8 w-auto object-contain rounded-lg"
        />
      </Link>
    );
  }

  return (
    <Link href="/" className="flex items-center shrink-0">
      <Image
        src="/logo-web.png"
        alt="Q Salons – Style For Everyone"
        width={180}
        height={48}
        priority
        className="h-10 w-auto object-contain"
      />
    </Link>
  );
}
