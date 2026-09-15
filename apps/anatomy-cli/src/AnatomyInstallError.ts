export class AnatomyInstallError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AnatomyInstallError";
  }
}
