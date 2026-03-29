/**
 * Domain-specific error class to maintain domain independence from infrastructure.
 */
export class DomainError extends Error {
    constructor(public readonly code: string, message: string) {
        super(message);
        this.name = 'DomainError';
    }
}
