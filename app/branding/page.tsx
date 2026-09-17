import type { Metadata } from "next";
import { TrackContent } from "@/components/sections/TrackContent";
import { getTrack } from "@/lib/tracks";

const track = getTrack("branding")!;

export const metadata: Metadata = { title: `${track.title} | יעקב-אליה` };

export default function BrandingPage() {
  return <TrackContent track={track} />;
}
