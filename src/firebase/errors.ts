
export class FirestorePermissionError extends Error {
  operation: string;
  path: string;
  constructor({ operation, path }: { operation: string, path: string }) {
    super(`Permission denied for ${operation} on ${path}`);
    this.operation = operation;
    this.path = path;
  }
}
