
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCollection } from './use-collection';
import { onSnapshot, CollectionReference, QuerySnapshot, DocumentChange } from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => {
  return {
    onSnapshot: jest.fn(),
    FirestoreError: class extends Error {},
  };
});

// Mock emit
jest.mock('@/firebase/error-emitter', () => ({
  errorEmitter: {
    emit: jest.fn(),
  },
}));

// Mock errors
jest.mock('@/firebase/errors', () => ({
  FirestorePermissionError: class extends Error {
    operation: string;
    path: string;
    constructor({ operation, path }: { operation: string, path: string }) {
      super('Permission Error');
      this.operation = operation;
      this.path = path;
    }
  },
}));

describe('useCollection', () => {
  let mockOnSnapshot: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    mockUnsubscribe = jest.fn();
    mockOnSnapshot = onSnapshot as jest.Mock;
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      return mockUnsubscribe;
    });
    jest.clearAllMocks();
  });

  const createMockDoc = (id: string, data: any) => ({
    id,
    data: () => data,
  });

  const createMockSnapshot = (docs: any[], docChanges: DocumentChange[] = []) => ({
    docs,
    docChanges: () => docChanges,
    metadata: { fromCache: false, hasPendingWrites: false },
  } as unknown as QuerySnapshot);

  it('should initialize with loading false and data null', () => {
    const { result } = renderHook(() => useCollection(null));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should subscribe to query and handle initial load', async () => {
    const mockQuery = { type: 'collection', path: 'users', __memo: true } as any;

    const { result } = renderHook(() => useCollection(mockQuery));

    expect(result.current.isLoading).toBe(true);
    expect(mockOnSnapshot).toHaveBeenCalledWith(mockQuery, expect.any(Function), expect.any(Function));

    // Simulate initial snapshot
    const callback = mockOnSnapshot.mock.calls[0][1];
    const initialDocs = [
        createMockDoc('1', { name: 'Alice' }),
        createMockDoc('2', { name: 'Bob' })
    ];
    // Initial load usually has all added events
    const initialChanges: DocumentChange[] = [
        { type: 'added', doc: initialDocs[0], newIndex: 0, oldIndex: -1 } as any,
        { type: 'added', doc: initialDocs[1], newIndex: 1, oldIndex: -1 } as any
    ];

    act(() => {
        callback(createMockSnapshot(initialDocs, initialChanges));
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data).toEqual([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' }
    ]);
  });

  it('should handle document updates (modified)', async () => {
    const mockQuery = { type: 'collection', path: 'users', __memo: true } as any;
    const { result } = renderHook(() => useCollection(mockQuery));

    const callback = mockOnSnapshot.mock.calls[0][1];

    // Initial load
    const doc1 = createMockDoc('1', { name: 'Alice', score: 10 });
    const doc2 = createMockDoc('2', { name: 'Bob', score: 20 });
    act(() => {
        callback(createMockSnapshot([doc1, doc2], [
            { type: 'added', doc: doc1, newIndex: 0, oldIndex: -1 } as any,
            { type: 'added', doc: doc2, newIndex: 1, oldIndex: -1 } as any
        ]));
    });

    // Update doc1
    const doc1Updated = createMockDoc('1', { name: 'Alice', score: 15 });
    act(() => {
        callback(createMockSnapshot([doc1Updated, doc2], [
            { type: 'modified', doc: doc1Updated, newIndex: 0, oldIndex: 0 } as any
        ]));
    });

    await waitFor(() => {
        expect(result.current.data?.[0].score).toBe(15);
    });
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[1].name).toBe('Bob');
  });

  it('should handle document additions', async () => {
    const mockQuery = { type: 'collection', path: 'users', __memo: true } as any;
    const { result } = renderHook(() => useCollection(mockQuery));
    const callback = mockOnSnapshot.mock.calls[0][1];

    // Initial
    const doc1 = createMockDoc('1', { name: 'Alice' });
    act(() => callback(createMockSnapshot([doc1], [{ type: 'added', doc: doc1, newIndex: 0, oldIndex: -1 } as any])));

    // Add doc2
    const doc2 = createMockDoc('2', { name: 'Bob' });
    act(() => callback(createMockSnapshot([doc1, doc2], [{ type: 'added', doc: doc2, newIndex: 1, oldIndex: -1 } as any])));

    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(result.current.data?.[1].name).toBe('Bob');
  });

  it('should handle document removals', async () => {
    const mockQuery = { type: 'collection', path: 'users', __memo: true } as any;
    const { result } = renderHook(() => useCollection(mockQuery));
    const callback = mockOnSnapshot.mock.calls[0][1];

    // Initial
    const doc1 = createMockDoc('1', { name: 'Alice' });
    const doc2 = createMockDoc('2', { name: 'Bob' });
    act(() => callback(createMockSnapshot([doc1, doc2], [
        { type: 'added', doc: doc1, newIndex: 0, oldIndex: -1 } as any,
        { type: 'added', doc: doc2, newIndex: 1, oldIndex: -1 } as any
    ])));

    // Remove doc1 (index 0)
    act(() => callback(createMockSnapshot([doc2], [
        { type: 'removed', doc: doc1, oldIndex: 0, newIndex: -1 } as any
    ])));

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data?.[0].name).toBe('Bob');
  });

  it('should handle document moves', async () => {
    const mockQuery = { type: 'collection', path: 'users', __memo: true } as any;
    const { result } = renderHook(() => useCollection(mockQuery));
    const callback = mockOnSnapshot.mock.calls[0][1];

    // Initial: Alice (0), Bob (1), Charlie (2)
    const doc1 = createMockDoc('1', { name: 'Alice', score: 10 });
    const doc2 = createMockDoc('2', { name: 'Bob', score: 20 });
    const doc3 = createMockDoc('3', { name: 'Charlie', score: 30 });

    act(() => callback(createMockSnapshot([doc1, doc2, doc3], [
        { type: 'added', doc: doc1, newIndex: 0, oldIndex: -1 } as any,
        { type: 'added', doc: doc2, newIndex: 1, oldIndex: -1 } as any,
        { type: 'added', doc: doc3, newIndex: 2, oldIndex: -1 } as any
    ])));

    // Update: Charlie moves to 0 (score 40). Alice moves to 1. Bob moves to 2.
    const doc3Updated = createMockDoc('3', { name: 'Charlie', score: 40 });

    act(() => callback(createMockSnapshot([doc3Updated, doc1, doc2], [
        { type: 'modified', doc: doc3Updated, oldIndex: 2, newIndex: 0 } as any
    ])));

    await waitFor(() => expect(result.current.data?.[0].name).toBe('Charlie'));
    expect(result.current.data?.[0].score).toBe(40);
    expect(result.current.data?.[1].name).toBe('Alice');
    expect(result.current.data?.[2].name).toBe('Bob');
  });

  it('should handle multiple removals correctly (batch update)', async () => {
    const mockQuery = { type: 'collection', path: 'users', __memo: true } as any;
    const { result } = renderHook(() => useCollection(mockQuery));
    const callback = mockOnSnapshot.mock.calls[0][1];

    // Initial: A, B, C
    const docA = createMockDoc('A', { val: 'A' });
    const docB = createMockDoc('B', { val: 'B' });
    const docC = createMockDoc('C', { val: 'C' });

    act(() => callback(createMockSnapshot([docA, docB, docC], [
        { type: 'added', doc: docA, newIndex: 0, oldIndex: -1 } as any,
        { type: 'added', doc: docB, newIndex: 1, oldIndex: -1 } as any,
        { type: 'added', doc: docC, newIndex: 2, oldIndex: -1 } as any
    ])));

    // Remove A and B. Remaining: C.
    // Firestore usually emits changes.
    // If we assume standard Firestore behavior, what order do they come?
    // Let's assume indices are original indices?
    // Removed A (old: 0). Removed B (old: 1).

    act(() => callback(createMockSnapshot([docC], [
        { type: 'removed', doc: docA, oldIndex: 0, newIndex: -1 } as any,
        { type: 'removed', doc: docB, oldIndex: 1, newIndex: -1 } as any
    ])));

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data?.[0].id).toBe('C');
  });
});
