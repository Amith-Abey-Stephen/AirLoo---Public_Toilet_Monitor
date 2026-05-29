import Link from "next/link";
import { LayoutDashboard, Shield, Store, Waves } from "lucide-react";

export function TopNav() {
  return (
    <header className="top-nav">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <Waves size={22} />
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
