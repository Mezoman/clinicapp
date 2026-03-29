import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'info').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'debug').mockImplementation(() => { });
    });

    it('should call console.info on logger.info', () => {
        logger.info('Test info message');
        expect(console.info).toHaveBeenCalled();
    });

    it('should call console.error on logger.error', () => {
        logger.error('Test error message');
        expect(console.error).toHaveBeenCalled();
    });
});
