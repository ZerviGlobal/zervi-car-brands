import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { ContentBlock, ContentImage } from "@/components/brand-history";

export interface SectionContent {
  slug: string;
  name: string;
  h1: string;
  contentBlocks: ContentBlock[];
  images: ContentImage[];
  facts: Record<string, string>;
}

export function loadSectionContent(
  contentDir: string,
  slug: string
): SectionContent | null {
  const p = join(process.cwd(), "docs/research", contentDir, slug + ".json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as SectionContent;
  } catch {
    return null;
  }
}
