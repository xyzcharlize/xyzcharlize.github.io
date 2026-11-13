import raw from '../../spine/spine.json';

export type SpineSample =
  | string
  | {
      text: string;
      href: string;
    };

export type SpinePillar = {
  id: string;
  label: string;
  text: string;
  samples?: SpineSample[];
  glossary?: string[];
};

export function sampleText(sample: SpineSample): string {
  return typeof sample === 'string' ? sample : sample.text;
}

export function sampleHref(sample: SpineSample): string | undefined {
  return typeof sample === 'string' ? undefined : sample.href;
}

export type Spine = typeof raw;

/** Single source of truth for positioning — edit spine/spine.json */
export const spine = raw as Spine;

export const boxSentence = spine.box.sentence;
export const oneLiner = spine.spine.oneLiner;
export const mantra = spine.spine.mantra;
export const thread = spine.spine.thread;
export const support = spine.spine.support;
export const siteDescription = spine.site.description;
export const credentialsHome = spine.site.credentialsHome as string[];
export const pillars = spine.pillars as SpinePillar[];
export const practice = (spine.practice ?? []) as string[];

export {
  glossary,
  glossaryTerm,
  definedTerms,
  preferredForm,
  spineGlossary,
} from './glossary';
