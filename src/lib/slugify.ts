export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+=,.<>/?'"|{}\[\]\\:;]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
