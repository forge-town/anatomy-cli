export class AnatomyVersionError extends Error {
  constructor(public readonly path: string, options?: ErrorOptions) {
    super(`Could not read Anatomy version from ${path}.`, options);
    this.name = "AnatomyVersionError";
  }
}
