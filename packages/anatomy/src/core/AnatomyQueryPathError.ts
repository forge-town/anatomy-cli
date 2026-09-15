export class AnatomyQueryPathError extends Error {
  constructor(public readonly path: string) {
    super(`Query path must be relative to the target, without parent traversal: ${path}`);
    this.name = "AnatomyQueryPathError";
  }
}
