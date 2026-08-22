"use client";

import { useState } from "react";
import type { AnnotationElement, ManifestMural } from "@/data/muralData";
import ReadingGuide from "./ReadingGuide";
import ResearchStatusNote from "./ResearchStatusNote";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { locAnnotationMural, locElement } from "@/lib/i18n/localize";

type MuralInfoPanelProps = {
  mural: ManifestMural;
  relatedElements?: AnnotationElement[];
};

export default function MuralInfoPanel({
  mural,
  relatedElements = [],
}: MuralInfoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { locale, t } = useLocale();
  const copy = locAnnotationMural(locale, mural);
  const figures = relatedElements.map((element) => locElement(locale, element));
  const storyId = `mural-story-${copy.id}`;

  return (
    <div className="min-w-0">
      <p className="type-meta text-gold">
        {copy.temple}
        {copy.hall ? ` / ${copy.hall}` : ""}
      </p>
      <h2 className="type-page mt-2">
        {copy.displayTitle}
      </h2>
      <p className="type-meta mt-2 text-gold">{copy.dynasty}</p>

      <section className="mt-6" aria-labelledby={`${storyId}-heading`}>
        <h3
          id={`${storyId}-heading`}
          className="type-meta text-ink/70"
        >
          {t("detail.whatPainted")}
        </h3>
        <p
          className={`type-body mt-2 text-ink ${
            expanded ? "" : "line-clamp-6"
          }`}
        >
          {copy.detailedDescription}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="btn-tertiary mt-2 text-cinnabar"
          aria-expanded={expanded}
        >
          {expanded ? t("detail.collapse") : t("detail.readMore")}
        </button>
      </section>

      <section className="mt-6" aria-labelledby={`${storyId}-guide`}>
        <h3
          id={`${storyId}-guide`}
          className="type-meta mb-2 text-ink/70"
        >
          {t("detail.howToRead")}
        </h3>
        <ReadingGuide steps={copy.readingGuide} />
      </section>

      {figures.length > 0 && (
        <section className="mt-6" aria-labelledby={`${storyId}-figures`}>
          <h3
            id={`${storyId}-figures`}
            className="type-meta text-ink/70"
          >
            {t("detail.figures")}
          </h3>
          <ul className="mt-2 space-y-1">
            {figures.map((element) => (
              <li
                key={element.id}
                className="type-body text-ink"
              >
                {element.displayName}
                <span className="type-meta ml-2 text-gold">
                  {element.category}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 border-t border-stone/15 pt-4">
        <h3 className="type-meta mb-2 text-ink/70">
          {t("detail.research")}
        </h3>
        <ResearchStatusNote text={copy.locationPrecision} />
        <p className="type-caption mt-2 text-ink/70">
          {copy.location}
        </p>
      </section>
    </div>
  );
}
