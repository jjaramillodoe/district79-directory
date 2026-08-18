export type DescriptionSource = 'template' | 'ai' | 'manual';

export type SiteDescriptionFacts = {
  siteName?: string;
  program?: string;
  buildingAddress?: string;
  borough?: string;
  category?: string;
  daytimeDays?: string;
  daytimeHours?: string;
  eveningDays?: string;
  eveningHours?: string;
  saturdayHours?: string;
};

export type StoredDescription = {
  description?: string | null;
  descriptionSource?: DescriptionSource | string | null;
  descriptionFactsKey?: string | null;
};

export function descriptionFactsKey(site: SiteDescriptionFacts): string {
  return [
    (site.siteName || '').trim().toLowerCase(),
    (site.program || '').trim().toLowerCase(),
    (site.buildingAddress || '').trim().toLowerCase(),
    (site.borough || '').trim().toLowerCase(),
  ].join('|');
}

function programBlurb(program: string, category?: string): string {
  const p = program.toLowerCase();
  if (p.includes('yabc')) {
    return 'Young Adult Borough Centers help over-age, under-credited students finish a high school diploma with more flexible schedules, including evening options.';
  }
  if (p.includes('pathways') || p.includes('path to graduation') || p.includes('p2g')) {
    return 'Pathways to Graduation helps students who have left school or fallen behind earn a high school equivalency diploma.';
  }
  if (p.includes('restart') || p.includes('re-start')) {
    return 'ReStart Academy offers alternative education in a smaller, more supportive setting.';
  }
  if (p.includes('passages')) {
    return 'Passages Academy provides continuity of instruction for students in temporary housing or court-involved settings.';
  }
  if (p.includes('alc') || p.includes('alternate learning') || p.includes('alternative learning')) {
    return 'Alternative Learning Centers serve students who need a non-traditional school setting to stay on track academically.';
  }
  if (p.includes('adult') || category === 'adult-ed') {
    return 'District 79 Adult Education programs offer HSE preparation, English language instruction, and career pathways for adult learners.';
  }
  return 'This District 79 program provides academic instruction and support for students who need an alternative path to a diploma or next step.';
}

function hoursSummary(site: SiteDescriptionFacts): string {
  const parts: string[] = [];
  if (site.daytimeHours && !site.daytimeHours.includes('undefined') && site.daytimeHours !== 'N/A') {
    parts.push(`daytime${site.daytimeDays ? ` (${site.daytimeDays})` : ''} ${site.daytimeHours}`);
  }
  if (site.eveningHours && !site.eveningHours.includes('undefined') && site.eveningHours !== 'N/A') {
    parts.push(`evening${site.eveningDays ? ` (${site.eveningDays})` : ''} ${site.eveningHours}`);
  }
  if (site.saturdayHours && !site.saturdayHours.includes('undefined') && site.saturdayHours !== 'N/A') {
    parts.push(`Saturday ${site.saturdayHours}`);
  }
  return parts.join('; ');
}

/** Free, deterministic description built from directory fields — no AI credits. */
export function buildTemplateDescription(site: SiteDescriptionFacts): string {
  const name = (site.siteName || '').trim() || 'This site';
  const program = (site.program || '').trim() || 'program';
  const borough = (site.borough || '').trim();
  const address = (site.buildingAddress || '').trim();
  const location = [address, borough].filter(Boolean).join(', ');
  const hours = hoursSummary(site);

  const sentences = [
    `${name} is a District 79 ${program} site${borough ? ` in ${borough}` : ''} operated by New York City Public Schools.`,
    programBlurb(program, site.category),
  ];

  if (location) {
    sentences.push(`The program is located at ${location}.`);
  }
  if (hours) {
    sentences.push(`Scheduled hours include ${hours}.`);
  }
  sentences.push(
    'Staff at this location can confirm enrollment, schedules, and the best next step for students and families.'
  );

  return sentences.join(' ');
}

/**
 * Keep paid/edited copy. Refresh template text when name, program, or address changes.
 * Fill blanks with a template so CSV updates do not require another AI run.
 */
export function reconcileDescription(
  existing: StoredDescription | undefined,
  next: SiteDescriptionFacts
): {
  description: string;
  descriptionSource: DescriptionSource;
  descriptionFactsKey: string;
} {
  const key = descriptionFactsKey(next);
  const existingText = (existing?.description || '').trim();
  const source = (existing?.descriptionSource || '') as DescriptionSource | '';

  if (!existingText) {
    return {
      description: buildTemplateDescription(next),
      descriptionSource: 'template',
      descriptionFactsKey: key,
    };
  }

  if (source === 'template' && existing.descriptionFactsKey !== key) {
    return {
      description: buildTemplateDescription(next),
      descriptionSource: 'template',
      descriptionFactsKey: key,
    };
  }

  return {
    description: existingText,
    descriptionSource: source === 'template' || source === 'ai' || source === 'manual' ? source : 'manual',
    descriptionFactsKey: key,
  };
}
