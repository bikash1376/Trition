import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Table01Icon,
  Comment01Icon,
  UserGroupIcon,
  ArtboardToolIcon,
  Tick02Icon,
  SmartPhone01Icon,
  SidebarLeft01Icon,
} from "@hugeicons/core-free-icons";
import { TextShimmer } from "@/components/better/text-shimmer";
import styles from "./landing-page.module.css";

const FEATURES = [
  {
    icon: DashboardSquare01Icon,
    fg: "var(--orange)",
    title: "Block-based pages",
    body: "Text, page links, tables, bookmarks, and images, composed freely on the page canvas.",
  },
  {
    icon: Table01Icon,
    fg: "var(--accent)",
    title: "Custom table columns",
    body: "Full schema support for table blocks. Add, type, and reorder columns without a database migration.",
  },
  {
    icon: Comment01Icon,
    fg: "var(--teal)",
    title: "Comments & attachments",
    body: "Leave comments and drop attachments straight on a card. They show up natively in Trello too.",
  },
  {
    icon: UserGroupIcon,
    fg: "var(--amber)",
    title: "Board invites & membership",
    body: "Invite teammates and manage access through Trello's own membership model, with nothing new to learn.",
  },
  {
    icon: ArtboardToolIcon,
    fg: "var(--accent)",
    title: "Freeform image canvas",
    body: "A dedicated canvas page type for arranging images and visual references outside the linear document flow.",
  },
  {
    icon: Tick02Icon,
    fg: "var(--orange)",
    title: "Optimistic UI everywhere",
    body: "Edits land instantly in the interface, while a two-layer cache keeps Trello in sync behind the scenes.",
  },
  {
    icon: SmartPhone01Icon,
    fg: "var(--teal)",
    title: "Responsive by default",
    body: "A collapsible sidebar and touch-friendly canvas mean the workspace holds up on a phone, not just a desktop.",
  },
  {
    icon: SidebarLeft01Icon,
    fg: "var(--accent)",
    title: "Persistent workspace nav",
    body: "Boards, lists, and pages stay one click away in a persistent sidebar that mirrors your Trello structure.",
  },
];

export function LandingPage() {
  return (
    <div className={styles.landing}>
      <div className={styles.wrap}>
        <nav className={styles.nav}>
          <TextShimmer as="span" className={`font-script ${styles.brand}`} duration={2.5}>
            Trition
          </TextShimmer>
          <Link href="/login" className={`${styles.btn} ${styles.navBtn}`}>
            Get Started
          </Link>
        </nav>
      </div>

      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <h1>
            A workspace built entirely
            <br className={styles.heroBreak} /> on your Trello boards.
          </h1>
          <p className={styles.dek}>Pages, blocks, and tables, with no separate database.</p>
          <div className={styles.ctaRow}>
            <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
              Get Started
            </Link>
            <Link href="/login" className={`${styles.btn} ${styles.btnOutline}`}>
              Try Now
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.wrap}>
        <div className={styles.heroBanner}>
          <Image
            src="/trition-banner.jpeg"
            alt="Trition workspace"
            fill
            priority
            sizes="(max-width: 1000px) 100vw, 980px"
            className={styles.heroBannerImg}
          />
          <div className={styles.heroBannerFade} />
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <h2 className={styles.featureHead}>A full workspace UI, built entirely on the Trello API.</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.badge} style={{ color: feature.fg }}>
                  <HugeiconsIcon icon={feature.icon} size={34} strokeWidth={2.25} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.ctaBand}>
          <h2>Your workspace, your Trello, your infra.</h2>
          <p>Trition is free and open source. Read the code, self-host it, or just try it out before you commit to anything.</p>
          <div className={styles.ctaRow}>
            <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
              Get Started
            </Link>
            <Link href="/login" className={`${styles.btn} ${styles.btnOutline}`}>
              Try Now
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.wrap}>
        <footer className={styles.footer}>
          <div className={styles.footRow}>
            <div>
              Project by{" "}
              <a href="https://github.com/bikash1376" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>
                Bikash
              </a>
              .
            </div>
            <div className={styles.footLinks}>
              <a href="https://github.com/bikash1376/Trition" target="_blank" rel="noopener">
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
