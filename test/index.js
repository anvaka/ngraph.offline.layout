const test = require('tap').test;
const createLayout = require('../index.js');
const createGraph = require('ngraph.graph');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

// Test directory for output files
const TEST_DIR = path.join(__dirname, 'test-data');

// Helper to clean up test directory
function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    rimraf.sync(TEST_DIR);
  }
}

test('setup', t => {
  cleanup();
  t.end();
});

test('throws when graph is not provided', t => {
  t.throws(() => createLayout(), /graph is required/);
  t.end();
});

test('initializes with default options', t => {
  const graph = createGraph();
  graph.addNode('a');
  graph.addNode('b');
  graph.addLink('a', 'b');
  
  const layout = createLayout(graph, {
    outDir: TEST_DIR
  });
  
  t.ok(layout.getLayout(), 'should return the layout');
  t.equal(layout.lastIteration(), 0, 'should start with iteration 0');
  t.ok(fs.existsSync(TEST_DIR), 'should create output directory');
  t.end();
});

test('runs layout iterations and saves files', t => {
  const graph = createGraph();
  graph.addNode('a');
  graph.addNode('b');
  graph.addLink('a', 'b');
  
  const layout = createLayout(graph, {
    outDir: TEST_DIR,
    iterations: 20 + 1, // last value is saved as positions.bin
    saveEach: 5
  });
  
  layout.run();
  
  // Should have saved iterations 5, 10, 15, 20 and 'positions'
  const files = fs.readdirSync(TEST_DIR);
  t.ok(files.includes('5.bin'), 'should save iteration 5');
  t.ok(files.includes('10.bin'), 'should save iteration 10');
  t.ok(files.includes('15.bin'), 'should save iteration 15');
  t.ok(files.includes('20.bin'), 'should save iteration 20');
  t.ok(files.includes('positions.bin'), 'should save final positions');
  
  t.end();
});

test('reports last iteration correctly', t => {
  const graph = createGraph();
  graph.addNode('a');
  
  const layout = createLayout(graph, {
    outDir: TEST_DIR
  });
  
  // At this point we should have files from previous test
  t.equal(layout.lastIteration(), 20, 'should detect last iteration');
  t.end();
});

test('resumes from last iteration', t => {
  const graph = createGraph();
  graph.addNode('a');
  graph.addNode('b');
  graph.addLink('a', 'b');
  
  // First create layout with 30 iterations
  const layout = createLayout(graph, {
    outDir: TEST_DIR,
    iterations: 30 + 1,
    saveEach: 5
  });
  
  // This should continue from iteration 20 (from previous test) to 30
  layout.run();
  
  const files = fs.readdirSync(TEST_DIR);
  t.ok(files.includes('25.bin'), 'should save iteration 25');
  t.ok(files.includes('30.bin'), 'should save iteration 30');
  
  t.end();
});

test('overwrites when specified', t => {
  const graph = createGraph();
  graph.addNode('a');
  
  const layout = createLayout(graph, {
    outDir: TEST_DIR,
    iterations: 10 + 1,
    saveEach: 5
  });
  
  // This should overwrite everything
  layout.run(true);
  
  t.equal(layout.lastIteration(), 10, 'should have new last iteration');
  t.end();
});

test('supports 2D coordinates', t => {
  const graph = createGraph();
  graph.addNode('a');
  
  const layout = createLayout(graph, {
    outDir: TEST_DIR,
    is2d: true,
    iterations: 5,
    saveEach: 5
  });
  
  layout.run(true);
  
  // Check if file size matches 2D data (8 bytes per node)
  const filePath = path.join(TEST_DIR, 'positions.bin');
  const stats = fs.statSync(filePath);
  t.equal(stats.size, 8, 'file size should match 2D data size');
  
  t.end();
});

test('supports 3D coordinates', t => {
  const graph = createGraph();
  graph.addNode('a');
  
  const layout = createLayout(graph, {
    outDir: TEST_DIR,
    is2d: false, // 3D
    iterations: 5,
    saveEach: 5
  });
  
  layout.run(true);
  
  // Check if file size matches 3D data (12 bytes per node)
  const filePath = path.join(TEST_DIR, 'positions.bin');
  const stats = fs.statSync(filePath);
  t.equal(stats.size, 12, 'file size should match 3D data size');
  
  t.end();
});

test('cleanup', t => {
  cleanup();
  t.end();
});
