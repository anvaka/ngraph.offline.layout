# ngraph.offline.layout

Performs offline 3D layout of large graphs and saves results to the disk. This is
somewhat experimental.

The results are saved into `data` folder by default.

# usage

``` js
// Assume you have a huge graph (instance of ngraph.graph):
var graph = require('ngraph.generators').grid(10000, 10000);
var createLayout = require('ngraph.offline.layout');
var layout = createLayout(graph);
layout.run();
```

This will run the 3d `force-based layout` for `500` iterations. Each `5th`
iteration is saved into `./data/{ITERATION_NUMBER}.bin` file.

The layout can be configured with options argument:

``` js
// run only 100 iterations
var layout = createLayout(graph, {
  iterations: 100, // Run `100` iterations only
  saveEach: 10, // Save each `10th` iteration
  outDir: './myFolder', // Save results into `./myFolder`
  layout: require('ngraph.forcelayout3d') // use custom layouter
});
```

After all iterations are completed, the final `positions.bin` file will be
saved into `outDir`. This file consists of Int32's written in Little Endian format.
Each node of the graph is given three integers in the output file. The order
of positions matches the order of graph traversal for `graph.forEachNode()`
method.

If the `outDir` contains data from previous run the layouter will attempt to resume
based on the last saved iteration. If you don't want this, you can tell it to
overwrite existing files:

```
var overwrite = true;
layout.run(overwrite);
```

# install

With [npm](https://npmjs.org) do:

```
npm install ngraph.offline.layout
```

# license

MIT
