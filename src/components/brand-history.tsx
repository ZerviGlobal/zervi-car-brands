import Image from "next/image";

export interface ContentBlock {
  tag: string;
  text: string;
}

export interface ContentImage {
  src: string;
  localPath: string | null;
  alt: string;
}

export interface BrandHistoryProps {
  brandName: string;
  contentBlocks: ContentBlock[];
  images: ContentImage[];
}

export function BrandHistory({ brandName, contentBlocks, images }: BrandHistoryProps) {
  if (!contentBlocks || contentBlocks.length === 0) return null;
  let imgIdx = 0;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        {brandName} Logo History
      </h2>
      <div className="mt-2">
        {contentBlocks.map((b, i) => {
          if (b.tag === "h2") {
            return (
              <h2 key={i} className="mt-10 mb-3 text-2xl font-bold tracking-tight text-foreground">
                {b.text}
              </h2>
            );
          }
          if (b.tag === "h3") {
            const yearImgs: ContentImage[] = [];
            while (imgIdx < images.length && yearImgs.length < 2) {
              yearImgs.push(images[imgIdx]);
              imgIdx++;
            }
            return (
              <div key={i} className="mt-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
                  {b.text}
                </h3>
                {yearImgs.map((im, j) =>
                  im.localPath ? (
                    <div key={j} className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
                      <div className="relative h-40 sm:h-52">
                        <Image
                          src={im.localPath}
                          alt={im.alt || b.text}
                          fill
                          sizes="(max-width: 768px) 100vw, 600px"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            );
          }
          if (b.tag === "p") {
            return (
              <p key={i} className="mt-3 text-base leading-relaxed text-foreground/90">
                {b.text}
              </p>
            );
          }
          if (b.tag === "h4") {
            return (
              <h4 key={i} className="mt-5 text-base font-semibold text-foreground">
                {b.text}
              </h4>
            );
          }
          return null;
        })}
      </div>
    </section>
  );
}
