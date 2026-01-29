
const { performance } = require('perf_hooks');

// Types
type DocumentData = { [key: string]: any };

interface MockDoc {
  id: string;
  data: () => DocumentData;
}

interface MockChange {
  type: 'added' | 'modified' | 'removed';
  doc: MockDoc;
  oldIndex: number;
  newIndex: number;
}

interface MockSnapshot {
  docs: MockDoc[];
  docChanges: () => MockChange[];
}

// Data Generation
const generateDocs = (count: number): MockDoc[] => {
  const docs: MockDoc[] = [];
  for (let i = 0; i < count; i++) {
    docs.push({
      id: `doc-${i}`,
      data: () => ({
        name: `Name ${i}`,
        value: i,
        nested: { prop: i * 2 },
        description: `Description for document ${i} with some long text to simulate parsing overhead.`
      })
    });
  }
  return docs;
};

// Current Implementation Logic
const processSnapshotCurrent = (snapshot: MockSnapshot) => {
  const results: any[] = [];
  for (const doc of snapshot.docs) {
    results.push({ ...doc.data(), id: doc.id });
  }
  return results;
};

// Optimized Implementation Logic (Maintained Map Strategy)
const processSnapshotOptimized = (snapshot: MockSnapshot, prevMap: Map<string, any>) => {
  const changes = snapshot.docChanges();
  changes.forEach(change => {
      if (change.type === 'removed') {
          prevMap.delete(change.doc.id);
      } else {
          prevMap.set(change.doc.id, { ...change.doc.data(), id: change.doc.id });
      }
  });

  const results: any[] = [];
  for (const doc of snapshot.docs) {
      results.push(prevMap.get(doc.id));
  }
  return results;
};

// Benchmark Runner
const runBenchmark = () => {
  const DOC_COUNT = 5000;
  const ITERATIONS = 100;

  console.log(`Setting up benchmark with ${DOC_COUNT} documents...`);

  // 1. Initial Load
  const initialDocs = generateDocs(DOC_COUNT);
  const initialSnapshot: MockSnapshot = {
    docs: initialDocs,
    docChanges: () => initialDocs.map((doc, index) => ({
      type: 'added',
      doc,
      oldIndex: -1,
      newIndex: index
    }))
  };

  let start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    processSnapshotCurrent(initialSnapshot);
  }
  let end = performance.now();
  const currentInitialTime = (end - start) / ITERATIONS;

  // Setup Map for Maintained Map Strategy
  const prevMap = new Map(); // Empty initially

  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
      // Simulate initial load clearing/filling map
      prevMap.clear();
      processSnapshotOptimized(initialSnapshot, prevMap);
  }
  end = performance.now();
  const optimizedInitialTime = (end - start) / ITERATIONS;

  console.log(`Initial Load (avg of ${ITERATIONS} runs):`);
  console.log(`  Current:   ${currentInitialTime.toFixed(3)} ms`);
  console.log(`  Optimized: ${optimizedInitialTime.toFixed(3)} ms`);

  // 2. Small Update (1 doc modified)
  // Prepare states
  processSnapshotCurrent(initialSnapshot); // Warmup?

  // Prepare map
  prevMap.clear();
  processSnapshotOptimized(initialSnapshot, prevMap);

  const updateIndex = 2500;
  const updatedDoc = {
      id: initialDocs[updateIndex].id,
      data: () => ({ ...initialDocs[updateIndex].data(), value: 99999 })
  };

  const updatedDocs = [...initialDocs];
  updatedDocs[updateIndex] = updatedDoc;

  const updateSnapshot: MockSnapshot = {
      docs: updatedDocs,
      docChanges: () => [{
          type: 'modified',
          doc: updatedDoc,
          oldIndex: updateIndex,
          newIndex: updateIndex
      }]
  };

  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    processSnapshotCurrent(updateSnapshot);
  }
  end = performance.now();
  const currentUpdateTime = (end - start) / ITERATIONS;

  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    // For fair benchmark, we should copy the map or reset it, but that's expensive.
    // However, the function modifies the map in place.
    processSnapshotOptimized(updateSnapshot, prevMap);
  }
  end = performance.now();
  const optimizedUpdateTime = (end - start) / ITERATIONS;

  console.log(`Single Update (avg of ${ITERATIONS} runs):`);
  console.log(`  Current:   ${currentUpdateTime.toFixed(3)} ms`);
  console.log(`  Optimized: ${optimizedUpdateTime.toFixed(3)} ms`);
  console.log(`  Improvement: ${((currentUpdateTime - optimizedUpdateTime) / currentUpdateTime * 100).toFixed(1)}%`);

};

runBenchmark();
