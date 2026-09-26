import type { Metadata } from "next";
import { RunnerLogo } from "@/components/sport/RunnerLogo";
import styles from "./sport.module.css";

export const metadata: Metadata = {
  title: "Sport",
};

export default function SportPage() {
  return (
    <main className={styles.stage}>
      <div aria-hidden className={styles.grid} />
      <div aria-hidden className={styles.glow} />
      <RunnerLogo className={styles.logo} />
    </main>
  );
}
