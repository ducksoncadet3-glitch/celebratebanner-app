/**
 * Server-rendered JSON-LD. Escapes `<` so a `</script>` inside any string can't break out of
 * the script element (XSS-safe). This is Next's recommended structured-data pattern for the
 * App Router. Never emit rating/review schema we can't substantiate.
 */
export function JsonLd({ id, data }: { id: string; data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
