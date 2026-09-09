export class AnatomySourceAnalysisError extends Error {
  constructor(public readonly path: string, message: string) {
    super(message);
    this.name = "AnatomySourceAnalysisError";
  }
}
