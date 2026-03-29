import type { IUnitOfWork, ITransactionContext } from '../../application/ports/IUnitOfWork';

class SupabaseTransactionContext implements ITransactionContext {
    constructor(
        public readonly id: string,
        public readonly transaction?: any
    ) { }
}

/**
 * Supabase implementation of Unit of Work.
 * NOTE: Since Supabase client-side doesn't support multi-request transactions (BEGIN/COMMIT),
 * this implementation provides a context for orchestration. 
 * For true atomicity in complex use cases, this should be refactored to use a single RPC call. 
 */
export class SupabaseUnitOfWork implements IUnitOfWork {
    async run<T>(work: (context: ITransactionContext) => Promise<T>): Promise<T> {
        const context = new SupabaseTransactionContext(crypto.randomUUID());

        try {
            // In a real transactional environment (e.g. Node/pg-promise), 
            // the context would hold the transaction client.
            // Here, we provide the architectural boundary.
            const result = await work(context);

            // If we have a buffered command pattern, this would be where we 'flush' to an RPC.
            return result;
        } catch (error) {
            // Handle rollback logic here if applicable
            throw error;
        }
    }
}

export const unitOfWork = new SupabaseUnitOfWork();
