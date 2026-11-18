import glossaryRaw from '../../spine/glossary.json';
import spineRaw from '../../spine/spine.json';

export type GlossaryTerm = {
  id: string;
  forms: string[];
  state: 'defined' | 'undefined' | 'unapproved' | string;
  text?: string;
};

export type GlossaryFile = {
  terms: GlossaryTerm[];
};

type SpineGlossaryLink = {
  id: string;
  pillar?: string;
  role?: string;
};

export const glossary = glossaryRaw as GlossaryFile;

export function glossaryTerm(id: string): GlossaryTerm | undefined {
  return glossary.terms.find((term) => term.id === id);
}

/** Only defined terms may be printed on public surfaces. */
export function definedTerms(): Array<GlossaryTerm & { text: string }> {
  return glossary.terms.filter(
    (term): term is GlossaryTerm & { text: string } =>
      term.state === 'defined' && typeof term.text === 'string' && term.text.trim().length > 0,
  );
}

export function preferredForm(term: GlossaryTerm): string {
  return term.forms[0] ?? term.id;
}

/** Spine-anchored glossary entries that are safe to show publicly. */
export function spineGlossary() {
  const links = ((spineRaw as { glossary?: { onSpine?: SpineGlossaryLink[] } }).glossary?.onSpine ??
    []) as SpineGlossaryLink[];

  return links
    .map((link) => {
      const term = glossaryTerm(link.id);
      if (!term || term.state !== 'defined' || !term.text) return null;
      return {
        id: term.id,
        form: preferredForm(term),
        text: term.text,
        pillar: link.pillar,
        role: link.role,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}
