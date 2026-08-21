import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { quizzes } from "@/data/quizzes";
import { loadSectionContent } from "@/lib/section-content";

export function generateStaticParams() {
  return quizzes.map((q) => ({ slug: q.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const q = quizzes.find((a) => a.slug === p.slug);
    return { title: q ? q.title : "Quiz not found" };
  });
}

export default async function QuizDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quiz = quizzes.find((q) => q.slug === slug);
  if (!quiz) notFound();
  const content = loadSectionContent("quiz-content", slug);

  // Render: intro paragraph(s), then the quiz image (the actual quiz), then related quizzes
  const blocks = content?.contentBlocks ?? [];
  const introParas = blocks.filter((b) => b.tag === "p").slice(0, 2);
  const related = blocks.filter((b) => b.tag === "li");

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/quizzes/" className="hover:text-foreground">Quizzes</Link>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{quiz.h1}</h1>

      <div className="mt-4 space-y-3">
        {introParas.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-foreground/90">{p.text}</p>
        ))}
      </div>

      {/* The quiz itself is the embedded image */}
      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4">
        {content?.images.map((im, j) =>
          im.localPath && !im.alt.includes("Explore More") ? (
            <div key={j} className="mb-4 last:mb-0">
              <div className="relative h-80 sm:h-96">
                <Image src={im.localPath} alt={im.alt || quiz.title} fill sizes="(max-width: 768px) 100vw, 700px" className="object-contain" />
              </div>
            </div>
          ) : null
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-10 rounded-xl border border-border bg-muted/20 p-5">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Explore More Quizzes</h2>
          <ul className="space-y-2">
            {related.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground">{r.text}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <Link href="/quizzes/" className="text-sm font-medium text-accent hover:underline">← All quizzes</Link>
      </div>
    </article>
  );
}
