/**
 * Structured data as a JSON-LD script tag.
 *
 * JSON.stringify does not escape "<", so a CMS or Shopify value containing
 * "</script>" could close the tag and inject markup. Escaping "<" as
 * < keeps the JSON identical for parsers while making that
 * impossible (the approach recommended in the Next.js JSON-LD guide).
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
