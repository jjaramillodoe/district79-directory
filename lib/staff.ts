export type NamedPhone = { name: string; phone: string };

/** Parse slash-separated name/phone strings into aligned rows. */
export function parseNamedPhones(names?: string | null, phones?: string | null): NamedPhone[] {
  const nameList = names ? names.split('/').map((n) => n.trim()).filter(Boolean) : [];
  const phoneList = phones ? phones.split('/').map((p) => p.trim()).filter(Boolean) : [];
  const max = Math.max(nameList.length, phoneList.length);
  if (max === 0) return [];
  return Array.from({ length: max }, (_, i) => ({
    name: nameList[i] || '',
    phone: phoneList[i] || '',
  }));
}

/** Join supervisor rows into slash-separated strings, keeping name/phone aligned. */
export function joinNamedPhones(people: NamedPhone[]): { names: string; phones: string } {
  const filled = people.filter((p) => p.name.trim() || p.phone.trim());
  return {
    names: filled.map((p) => p.name.trim()).join(' / '),
    phones: filled.map((p) => p.phone.trim()).join(' / '),
  };
}

/** Copy AP names onto supervisors, using the site business phone for each person. */
export function supervisorsFromAssistantPrincipals(
  assistantPrincipal?: string | null,
  businessPhone?: string | null
): { names: string; phones: string } | null {
  const names = assistantPrincipal
    ? assistantPrincipal.split('/').map((n) => n.trim()).filter(Boolean)
    : [];
  if (names.length === 0) return null;
  const phone = (businessPhone || '').trim();
  return joinNamedPhones(names.map((name) => ({ name, phone })));
}
