export class NpmReleaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NpmReleaseError";
  }
}
