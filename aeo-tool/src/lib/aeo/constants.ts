export const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  { category: 'Head-to-Head Comparison', keywords: ['vs', 'vs.', 'versus', 'compared', 'which is better', 'difference between'] },
  { category: 'Best/Discovery', keywords: ['best', 'top', 'recommend'] },
  { category: 'Trust/Legitimacy', keywords: ['legit', 'scam', 'trust', 'safe', 'accurate', 'reviews', 'worth'] },
  { category: 'Pricing/Billing', keywords: ['price', 'cost', 'free', 'trial', 'cancel', 'refund', 'charged', 'fees', 'pay'] },
  { category: 'Privacy/Opt-out', keywords: ['remove', 'opt out', 'delete', 'taken off', 'privacy', 'sell my data', 'legal for websites'] },
  { category: 'AI vs. People Search', keywords: ['chatgpt', 'ai', 'perplexity'] },
  { category: 'Compliance/Legal', keywords: ['fcra', 'employer', 'hiring', 'tenant', 'compliance', 'consumer background'] },
  { category: 'How-to/Informational', keywords: ['how to', 'how do', 'how can', 'find', 'look up', 'check', 'search'] },
];

export const FUNNEL_MAP: Record<string, string> = {
  'Best/Discovery': 'Awareness',
  'How-to/Informational': 'Awareness',
  'AI vs. People Search': 'Awareness',
  'Trust/Legitimacy': 'Consideration',
  'Head-to-Head Comparison': 'Consideration',
  'Compliance/Legal': 'Consideration',
  'Pricing/Billing': 'Decision',
  'Privacy/Opt-out': 'Post-Purchase',
  'General': 'Awareness',
};

export const POSITIVE_WORDS = [
  'best', 'top', 'leading', 'excellent', 'comprehensive', 'reliable', 'trusted',
  'popular', 'well-known', 'reputable', 'accurate', 'user-friendly', 'affordable',
  'recommended', 'great', 'powerful', 'robust', 'standout', 'strong',
];

export const NEGATIVE_WORDS = [
  'scam', 'inaccurate', 'expensive', 'complaints', 'issues', 'limited', 'outdated',
  'controversial', 'concerns', 'caution', 'misleading', 'hidden fees',
  'difficult to cancel', 'frustrating',
];

export const SCORING_WEIGHTS = {
  presence: 0.25,
  citation: 0.15,
  sentiment: 0.15,
  topRec: 0.15,
  depth: 0.15,
  firstMention: 0.15,
};

export const CLIENT_COLORS = ['#2F5496', '#4472C4', '#7BA0D4', '#A5C0DE', '#C5D7EB'];
export const COMPETITOR_COLORS = ['#C55A11', '#ED7D31', '#F4B183', '#F8CBB0', '#FCE4D6'];
