export class AnatomyWatchError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AnatomyWatchError";
  }
}
