export class AnatomyDefinitionFileError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message);
    this.name = "AnatomyDefinitionFileError";
  }
}
