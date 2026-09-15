export class AnatomyCliArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnatomyCliArgumentError";
  }
}
