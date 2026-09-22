import * as React from 'react';
import { act, renderHook } from '@testing-library/react';
import { useAiTutor } from './use-ai-tutor';

jest.mock('react', () => {
  const actualReact = jest.requireActual<typeof import('react')>('react');
  return {
    ...actualReact,
    useState: jest.fn(actualReact.useState),
  };
});

describe('useAiTutor cancellation', () => {
  const originalFetch = global.fetch;
  const actualUseState = jest.requireActual<typeof import('react')>('react').useState;
  const mockedUseState = jest.mocked(React.useState);

  afterEach(() => {
    global.fetch = originalFetch;
    mockedUseState.mockImplementation(actualUseState);
  });

  it('does not restore a cancellation error after cancel followed by reset', async () => {
    global.fetch = jest.fn((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    ) as jest.MockedFunction<typeof fetch>;
    const { result } = renderHook(() => useAiTutor());

    let sendPromise: Promise<void> | undefined;
    act(() => {
      sendPromise = result.current.sendMessage('Ayúdame con esta pregunta.');
    });

    act(() => {
      result.current.cancelMessage();
      result.current.resetChat();
    });
    await act(async () => {
      await sendPromise;
    });

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('does not write error or loading state after unmount aborts the request', async () => {
    const setMessages = jest.fn();
    const setLoading = jest.fn();
    const setError = jest.fn();
    const setters = [setMessages, setLoading, setError];
    let stateIndex = 0;

    mockedUseState.mockImplementation(((initialState: unknown) => {
      const [value] = actualUseState(initialState);
      const setter = setters[stateIndex] ?? jest.fn();
      stateIndex += 1;
      return [value, setter];
    }) as unknown as typeof React.useState);
    global.fetch = jest.fn((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    ) as jest.MockedFunction<typeof fetch>;

    const { result, unmount } = renderHook(() => useAiTutor());
    let sendPromise: Promise<void> | undefined;
    act(() => {
      sendPromise = result.current.sendMessage('Explica esta respuesta.');
    });

    unmount();
    setLoading.mockClear();
    setError.mockClear();
    await act(async () => {
      await sendPromise;
    });

    expect(setError).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });
});
