/** Acilir-kapanir soru/cevap listesi. */
export default function FaqList({ faqs }: { faqs: { id: string; question: string; answer: string }[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.id} className="card p-5">
          <summary className="cursor-pointer font-bold">{faq.question}</summary>
          <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
