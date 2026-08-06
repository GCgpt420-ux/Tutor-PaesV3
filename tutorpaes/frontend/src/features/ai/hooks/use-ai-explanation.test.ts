import { TextEncoder, TextDecoder } from 'util';

// Mock de TextEncoder y TextDecoder para entorno JSDOM en Jest
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

import { renderHook, act } from '@testing-library/react';
import { useAiExplanation } from './use-ai-explanation';

describe('useAiExplanation', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe streamear la explicación exitosamente (contrato 200 OK)', async () => {
    const encoder = new TextEncoder();
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({ value: encoder.encode("data: Primera parte de la explicación. "), done: false })
        .mockResolvedValueOnce({ value: encoder.encode("Segunda parte.\n\n"), done: false })
        .mockResolvedValueOnce({ value: encoder.encode("data: [DONE]\n\n"), done: true }),
    };

    const mockResponse = {
      ok: true,
      status: 200,
      body: {
        getReader: () => mockReader,
      },
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHook(() => useAiExplanation());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.requestExplanation({
        questionId: '101',
        selectedAnswer: 'A',
        attemptId: '42',
      });
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.explanation).toBe('Primera parte de la explicación. Segunda parte.');
  });

  it('debe manejar error 429 de límite de tarifa (contrato 429 Rate Limit)', async () => {
    const mockResponse = {
      ok: false,
      status: 429,
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHook(() => useAiExplanation());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.requestExplanation({
        questionId: '101',
        selectedAnswer: 'A',
        attemptId: '42',
      });
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.explanation).toBeNull();
    expect(result.current.error).toContain('Alcanzaste el limite diario');
  });

  it('debe manejar errores del servidor genéricos (contrato 500 Error)', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHook(() => useAiExplanation());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.requestExplanation({
        questionId: '101',
        selectedAnswer: 'A',
        attemptId: '42',
      });
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.explanation).toBeNull();
    expect(result.current.error).toBe('Error generando explicacion. Intenta de nuevo.');
  });

  it('debe manejar el abort por timeout (contrato Timeout Abort)', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';

    global.fetch = jest.fn().mockRejectedValue(abortError);

    const { result } = renderHook(() => useAiExplanation());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.requestExplanation({
        questionId: '101',
        selectedAnswer: 'A',
        attemptId: '42',
        timeoutMs: 1000,
      });
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.explanation).toBeNull();
    expect(result.current.error).toContain('tardo demasiado (35s)');
  });
});
