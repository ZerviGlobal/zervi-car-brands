import Link from "next/link";
import Image from "next/image";
import { quizzes } from "@/data/quizzes";

export const metadata = {
  title: "Quizzes — Test Your Car Logo Knowledge",
  description: "Test your knowledge of car logos and brand history with our quizzes.",
};

export default function QuizzesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Quizzes</h1>
        <p className="mt-2 text-muted-foreground">{quizzes.length} quizzes to test your car logo knowledge.</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((q) => (
          <Link
            key={q.slug}
            href={"/quizzes/" + q.slug}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/30 hover:shadow-md"
          >
            {q.thumb ? (
              <div className="relative h-40 w-full bg-muted/40">
                <Image src={q.thumb} alt={q.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform group-hover:scale-105" />
              </div>
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-muted/40 text-3xl">🎯</div>
            )}
            <div className="p-4">
              <p className="line-clamp-2 font-semibold text-foreground">{q.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
