export class AnatomyFileTreeError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message);
    this.name = "AnatomyFileTreeError";
  }
}
