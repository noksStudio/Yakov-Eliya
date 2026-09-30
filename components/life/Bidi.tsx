import { Fragment } from "react";

// Number ranges ("10–12", "2.5–3") inside Hebrew text get reordered by the bidi algorithm and read
// backwards ("12–10"). Isolating each range as LTR keeps it in the order it was written.
const RANGE = /(\d+(?:[.,]\d+)?\s*[–-]\s*\d+(?:[.,]\d+)?)/;

export function Bidi({ text }: { text: string }) {
  const parts = text.split(RANGE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <bdi key={i} dir="ltr">
            {part}
          </bdi>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
