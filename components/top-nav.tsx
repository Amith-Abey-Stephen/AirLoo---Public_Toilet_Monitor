import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, Shield, Store } from "lucide-react";

export function TopNav() {
  return (
    <header className="top-nav">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <Image src="/logo.png" alt="AirLoo" width={22} height={22} />
        </span>
        <span>
          <strong>AirLoo</strong>
          <small>public toilet monitor</small>
        </span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/">
          <Store size={17} />
          Public
        </Link>
        <Link href="/owner">
          <LayoutDashboard size={17} />
          Owner
        </Link>
        <Link href="/admin">
          <Shield size={17} />
          Admin
        </Link>
      </nav>
    </header>
  );
}
