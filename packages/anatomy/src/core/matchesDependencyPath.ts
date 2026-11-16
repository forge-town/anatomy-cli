export const matchesDependencyPath = (path: string, patterns: string[]): boolean => {
  const segments = path.split("/");
  const segmentMatches = (value: string, pattern: string): boolean => {
    let position = 0, token = 0, star = -1, checkpoint = 0;
    while (position < value.length) {
      if (pattern[token] === "*") { star = token++; checkpoint = position; }
      else if (pattern[token] === value[position]) { position++; token++; }
      else if (star >= 0) { token = star + 1; position = ++checkpoint; }
      else return false;
    }
    while (pattern[token] === "*") token++;
    return token === pattern.length;
  };
  return patterns.some((pattern) => {
    let matches = segments.map(() => false);
    matches.unshift(true);
    for (const part of pattern.split("/")) {
      const next = segments.map(() => false);
      next.unshift(part === "**" && matches[0]!);
      for (let index = 1; index <= segments.length; index++) next[index] = part === "**"
        ? matches[index]! || next[index - 1]!
        : matches[index - 1]! && segmentMatches(segments[index - 1]!, part);
      matches = next;
    }
    return matches[segments.length]!;
  });
};
