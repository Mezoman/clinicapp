export interface ITransactionContext {
    readonly id: string;
    /**
     * Optional transaction client for consistency if supported by the provider.
     */
    readonly transaction?: any;
}

export interface IUnitOfWork {
    /**
     * Executes a block of work within a transaction boundary.
     * All operations performed via the provided context should be atomic.
     */
    run<T>(work: (context: ITransactionContext) => Promise<T>): Promise<T>;
}
