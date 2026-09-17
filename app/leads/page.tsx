import type { Metadata } from "next";
import { TrackContent } from "@/components/sections/TrackContent";
import { getTrack } from "@/lib/tracks";

const track = getTrack("leads")!;

export const metadata: Metadata = { title: `${track.title} | יעקב-אליה` };

export default function LeadsPage() {
  return <TrackContent track={track} />;
}
