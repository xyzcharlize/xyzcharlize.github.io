/** Copy shared with the current home page, so the studies compare layout rather than wording. */

export type HomeWork = {
  title: string;
  meta: string;
  blurb: string;
};

export const selectedWork: HomeWork[] = [
  {
    title: 'Agentic content factory',
    meta: '2026 – present · Switzerland',
    blurb:
      'Python + Agent Skills. Specialised agents for curriculum, storyboard, script, slides, video, and quality review, with a human gate before anything ships.',
  },
  {
    title: 'AI-native product engineering',
    meta: '2024 – present · Switzerland',
    blurb:
      'GenAI enterprise search (RAG) from pilot to production for 1,000+ users in two months; agentic Copilot tooling and enablement.',
  },
  {
    title: 'Enterprise agile & delivery coaching',
    meta: '2017 – 2022 · Switzerland',
    blurb:
      'Co-founded a consulting practice. Lean-agile delivery across public transport and insurance; transformation coaching for 500+ practitioners.',
  },
];

export type HomeExplore = {
  href: string;
  title: string;
  text: string;
};

export function exploreLinks(base: string): HomeExplore[] {
  return [
    {
      href: `${base}how-i-work/`,
      title: 'How I work',
      text: 'The maturity spiral, and three ways to work together: build, advise, and teach.',
    },
    {
      href: `${base}use-cases/`,
      title: 'Use cases',
      text: 'Common problems when teams bring AI into software delivery. Turn a card to see how we tackle it.',
    },
    {
      href: `${base}field-notes/`,
      title: 'Field notes',
      text: 'Short notes from the practice. The latest: measure the value AI creates, not the time it saves.',
    },
    {
      href: `${base}speaking/`,
      title: 'Speaking & teaching',
      text: 'Talks and practitioner sessions where AI tools become practice.',
    },
    {
      href: `${base}about/`,
      title: 'About',
      text: 'Work across the lifecycle, samples from the CV, and credentials.',
    },
  ];
}
