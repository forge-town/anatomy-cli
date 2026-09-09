export const quoteShell = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
