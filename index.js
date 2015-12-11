module.exports = createLayout;
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var layout3d = require('ngraph.forcelayout3d');

function createLayout(graph, options) {
  options = options || {};
  var iterations = typeof options.iterations === 'number' ? options.iterations : 500;
  var saveEach = typeof options.saveEach === 'number' ? options.saveEach : 5;
  var outDir = typeof options.outDir === 'string' ? options.outDir : './data';
  var is2d = options.is2d ? true : false;
  var coordinatesPerRecord = is2d ? 2 : 3;
  var intSize = 4;
  var layouter = is2d ? layout3d.get2dLayout : layout3d;
  var layout = layouter(graph);
  if (!fs.existsSync(outDir)) {
    mkdirp.sync(outDir);
  }
  var lastIteration = getLastIteration(outDir);

  return {
    run: run,
    lastIteration: getLastIteration
  };

  function getLastIteration() {
    var files = fs.readdirSync(outDir);
    var largest = 0;
    for (var i = 0; i < files.length; ++i) {
      var match = files[i].match(/^(\d+)\.bin$/i);
      if (!match) continue;
      var iterationNumber = parseInt(match[1], 10);
      if (iterationNumber > largest) largest = iterationNumber;
    }
    return largest;
  }

  function run(overwrite) {
    if (overwrite) {
      lastIteration = 0;
    } else {
      if (lastIteration >= iterations) {
        printLastIterationHelp();
        return;
      } else if (lastIteration > 0) {
        initLayout(lastIteration);
      }
    }

    for (var step = lastIteration + 1; step < iterations; ++step) {
      console.log('Step ' + step);
      layout.step();
      if (step % saveEach === 0) {
        saveIteration(step);
      }
    }
    saveIteration('positions');
  }

  function initLayout(iteration) {
    var lastName = path.join(outDir, iteration + '.bin');
    console.log('Attempting to resume layout from ' + lastName);
    var buf = fs.readFileSync(lastName);
    var idx = 0;
    graph.forEachNode(initPosition);

    function initPosition(node) {
      var x = buf.readInt32LE(idx);
      var y = buf.readInt32LE(idx + 4);
      if (is2d) {
        layout.setNodePosition(node.id, x, y);
        idx += 8;
      } else {
        var z = buf.readInt32LE(idx + 8);
        layout.setNodePosition(node.id, x, y, z);
        idx += 12;
      }
    }
  }

  function printLastIterationHelp() {
    console.log('The ' + outDir + ' already has ' + lastIteration + ' saved iterations.');
    console.log('* If you want to overwite existing work call `layout.run(true)`');
    console.log('* If you want to perform more iterations set higher value for `options.iterations`');
  }

  function saveIteration(name) {
    var fname = path.join(outDir, name + '.bin');

    console.log("Saving: ", fname);
    var nodesLength = graph.getNodesCount();
    var buf = new Buffer(nodesLength * intSize * coordinatesPerRecord);
    var i = 0;

    graph.forEachNode(saveNode);

    fs.writeFileSync(fname, buf);

    function saveNode(node) {
        var idx = i * intSize * coordinatesPerRecord;
        var pos = layout.getNodePosition(node.id);
        buf.writeInt32LE(pos.x, idx);
        buf.writeInt32LE(pos.y, idx + 4);
        if (!is2d) {
          buf.writeInt32LE(pos.z, idx + 8);
        }
        i++;
    }
  }
}
