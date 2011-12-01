/*jslint devel: true, browser: true, maxerr: 50, indent: 2 */

var G3D; // externals

Math.SQRT_3 = 1.73205080756887729352;
Math.randomFloat = function (min, max) {
  "use strict";
  // return a number in [min, max[
  // <http://processing.org/reference/random_.html>
  return Math.random() * (max - min) + min;
};

Math.randomInt = function (min, max) {
  "use strict";
  return Math.floor(Math.random() * (max - min) + min);
};


var Const = {
  ANTICLOCKWISE: 0,
  CLOCKWISE: 1,
  RGB: 0,
  HSB: 1
};

//######################################################################

function Node(new_x, new_y) {
  "use strict";

  var
    x = new_x,
    y = new_y,
    edges = [];

  this.getX = function () { return x; };
  this.getY = function () { return y; };
  this.getEdges = function () { return edges; };
  this.setX = function (new_x) { x = new_x; };
  this.setY = function (new_y) { y = new_y; };
  this.setEdges = function (new_edges) { edges = new_edges; };

  this.draw = function (scene) {
    G3D.add_sphere(scene, x, y, 0, 10);
  };

  this.toString = function () {
    return "Node: {x:" + x + ", y:" + y + "}";
  };

  this.add_edge = function (e) {
    edges.push(e);
  };
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function Edge(n1, n2) {
  "use strict";

  var
    node1 = n1,
    node2 = n2,
    angle1, angle2;

  angle1 = Math.atan2(n2.getY() - n1.getY(), n2.getX() - n1.getX());
  if (angle1 < 0) { angle1 += 2 * Math.PI; }
  angle2 = Math.atan2(n1.getY() - n2.getY(), n1.getX() - n2.getX());
  if (angle2 < 0) { angle2 += 2 * Math.PI; }

  // Accessors
  this.getNode1 = function () { return node1; };
  this.getNode2 = function () { return node2; };

  this.draw = function (scene) {
    G3D.line(scene, node1.getX(), node1.getY(), 0, node2.getX(), node2.getY(), 0);
  };

  this.toString = function () {
    return "Edge: {node1: " + node1 + ", node2: " + node2 + ", angle1: " + (this.angle(node1) * 180 / Math.PI) + ", angle2: " + (this.angle(node2) * 180 / Math.PI) + "}";
  };

  this.angle = function (n) {
    // return the angle of the edge at Node n
    if (n === node1) { return angle1; } else { return angle2; }
  };

  this.other_node = function (n) {
    if (n === node1) { return node2; } else { return node1; }
  };

  this.angle_to = function (e2, node, direction) {
    /* returns the absolute angle from this edge to "edge2" around
     "node" following "direction" */
    var a;

    if (direction === Const.CLOCKWISE) {
      a = this.angle(node) - e2.angle(node);
    } else {
      a = e2.angle(node) - this.angle(node);
    }

    if (a < 0) { return a + 2 * Math.PI; } else { return a; }
  };
}

//######################################################################

function Graph(params) {
  "use strict";

  var
    cx, cy, x, y, size, //float
    grid, // array of Node
    step, nbcol, nbrow, //int
    edge_size, L, p2x, p2y, nsteps, // for triangle
    nbp, nbo, os, o, p, row, col, // for polar
    cluster_size, ci, // for kennicott
    node1, node2, node3; // for custom graph type

  this.params = params;
  this.width = this.params.width;
  this.height = this.params.height;
  this.nodes = [];
  this.edges = [];

  this.add_edge = function (edge) {
    this.edges.push(edge);
    // for each node of edge 'edge', add it to 'e'
    edge.getNode1().add_edge(edge);
    edge.getNode2().add_edge(edge);
    //    console.log("Adding: " + e+"\n");
  };

  this.add_node = function (node) {
    this.nodes.push(node);
    //    console.log("Adding: " + n+"\n");
  };

  switch (this.params.type) {
  case Graph.TYPE_POLAR:
    nbp = Math.floor(this.params.nb_nodes_per_orbit); // number of points on each orbit
    nbo = Math.floor(this.params.nb_orbits); // number of orbits
    os = (this.width < this.height ? this.width : this.height) / (2 * nbo); // orbit height

    grid = []; // array of Node (1+nbp*nbo of them)

    this.add_node(grid[0] = new Node(0, 0));

    for (o = 0; o < nbo; o = o + 1) {
      for (p = 0; p < nbp; p = p + 1) {
        this.add_node(grid[1 + o * nbp + p] = new Node((o + 1) * os * Math.sin(p * 2 * Math.PI / nbp),
                                                       (o + 1) * os * Math.cos(p * 2 * Math.PI / nbp)));
      }
    }

    // generate edges
    for (o = 0; o < nbo; o = o + 1) {
      for (p = 0; p < nbp; p = p + 1) {
        if (o === 0) {
          // link first orbit nodes with centre
          this.add_edge(new Edge(grid[1 + o * nbp + p], grid[0]));
        } else { // link orbit nodes with lower orbit
          this.add_edge(new Edge(grid[1 + o * nbp + p], grid[1 + (o - 1) * nbp + p]));
        }
        // link along orbit
        this.add_edge(new Edge(grid[1 + o * nbp + p], grid[1 + o * nbp + (p + 1) % nbp]));
      }
    }
    break;

  case Graph.TYPE_TRIANGLE:
    edge_size = this.params.triangle_edge_size;
    L = (this.width < this.height ? this.width : this.height) / 2.0; // circumradius of the triangle
    p2x = (- L * Math.SQRT_3 / 2.0);
    p2y = (  L / 2.0); /* p2 is the bottom left vertex */
    nsteps = Math.floor(3 * L / (Math.SQRT_3 * edge_size));
    grid = []; //new Array((nsteps + 1) * (nsteps + 1));

    // create node grid
    for (row = 0; row <= nsteps; row = row + 1) {
      for (col = 0; col <= nsteps; col = col + 1) {
        if (row + col <= nsteps) {
          x = p2x + col * L * Math.SQRT_3 / nsteps + row * L * Math.SQRT_3 / (2 * nsteps);
          y = p2y - row * 3 * L / (2 * nsteps);
          grid[col + row * (nsteps + 1)] = new Node(x, y);
          this.add_node(grid[col + row * (nsteps + 1)]);
        }
      }
    }
    // create edges
    for (row = 0; row < nsteps; row = row + 1) {
      for (col = 0; col < nsteps; col = col + 1) {
        if (row + col < nsteps) {
          // horizontal edges
          this.add_edge(new Edge(grid[row + col * (nsteps + 1)], grid[row + (col + 1) * (nsteps + 1)]));
          // vertical edges
          this.add_edge(new Edge(grid[row + col * (nsteps + 1)], grid[row + 1 + col * (nsteps + 1)]));
          // diagonal edges
          this.add_edge(new Edge(grid[row + 1 + col * (nsteps + 1)], grid[row + (col + 1) * (nsteps + 1)]));
        }
      }
    }
    break;

  case Graph.TYPE_KENNICOTT:
    // make a graph inspired by one of the motifs from the Kennicott bible
    // square grid of clusters of the shape  /|\
    //                                       ---
    //                                       \|/
    // cluster_size is the length of an edge of a cluster

    step = this.params.kennicott_edge_size;
    cluster_size = this.params.kennicott_cluster_size;
    size = this.width < this.height ? this.height : this.width;
    nbcol = Math.floor((1 + size / step) / 2 * 2);
    nbrow = Math.floor((1 + size / step) / 2 * 2);
    grid = []; //new Array(5 * nbrow * nbcol);   /* there are 5 nodes in each cluster */

    this.xmin = -this.width / 2;
    this.ymin = -this.height / 2;

    /* adjust xmin and xmax so that the grid is centred */
    this.xmin += (this.width - (nbcol - 1) * step) / 2;
    this.ymin += (this.height - (nbrow - 1) * step) / 2;

    /* create node grid */
    for (row = 0; row < nbrow; row = row + 1) {
      for (col = 0; col < nbcol; col = col + 1) {
        ci = 5 * (row + col * nbrow);
        x = col * step + this.xmin;
        y = row * step + this.ymin;

        /* create a cluster centred on x, y */
        grid[ci] = new Node(x, y);
        grid[ci + 1] = new Node((x + cluster_size), y);
        grid[ci + 2] = new Node(x, (y - cluster_size));
        grid[ci + 3] = new Node((x - cluster_size), y);
        grid[ci + 4] = new Node(x, (y + cluster_size));

        this.add_node(grid[ci]);
        this.add_node(grid[ci + 1]);
        this.add_node(grid[ci + 2]);
        this.add_node(grid[ci + 3]);
        this.add_node(grid[ci + 4]);

        /* internal edges */
        this.add_edge(new Edge(grid[ci], grid[ci + 1]));
        this.add_edge(new Edge(grid[ci], grid[ci + 2]));
        this.add_edge(new Edge(grid[ci], grid[ci + 3]));
        this.add_edge(new Edge(grid[ci], grid[ci + 4]));
        this.add_edge(new Edge(grid[ci + 1], grid[ci + 2]));
        this.add_edge(new Edge(grid[ci + 2], grid[ci + 3]));
        this.add_edge(new Edge(grid[ci + 3], grid[ci + 4]));
        this.add_edge(new Edge(grid[ci + 4], grid[ci + 1]));
      }
    }

    // create inter-cluster edges
    for (row = 0; row < nbrow; row = row + 1) {
      for (col = 0; col < nbcol; col = col + 1) {
        if (col !== nbcol - 1) {
          // horizontal edge from edge 1 of cluster (row, col) to edge 3
          // of cluster (row, col + 1)
          this.add_edge(new Edge(grid[5 * (row + col * nbrow) + 1], grid[5 * (row + (col + 1) * nbrow) + 3]));
        }
        if (row !== nbrow - 1) {
          // vertical edge from edge 4 of cluster (row, col) to edge 2
          // of cluster (row + 1, col)
          this.add_edge(new Edge(grid[5 * (row + col * nbrow) + 4], grid[5 * (row + 1 + col * nbrow) + 2]));
        }
      }
    }
    break;

  case Graph.TYPE_TGRID:
    // simple grid graph
    step = Math.floor(params.tgrid_edge_size);
    size = this.width < this.height ? this.height : this.width;

    // it seems there are 2 curves only if both
    // nbcol and nbrow are even, so we round them to even
    nbcol = Math.floor((2 + size / step) / 2 * 2); //@@ /2 * 2?
    nbrow = Math.floor((2 + size / step) / 2 * 2);
    // was: nbcol = (int)((2 + size / step) / 2 * 2);
    //      nbrow = (int)((2 + size / step) / 2 * 2);

    grid = []; //new Array((nbrow * nbcol)|0);

    this.xmin = -this.width / 2;
    this.ymin = -this.height / 2;


    /* adjust xmin and xmax so that the grid is centered */
    this.xmin += (this.width - (nbcol - 1) * step) / 2;
    this.ymin += (this.height - (nbrow - 1) * step) / 2;

    /* create node grid */
    for (row = 0; row < nbrow; row = row + 1) {
      for (col = 0; col < nbcol; col = col + 1) {
        x = col * step + this.xmin;
        y = row * step + this.ymin;
        grid[row + col * nbrow] = new Node(x, y);
        this.add_node(grid[row + col * nbrow]);
      }
    }
    /* create edges */
    for (row = 0; row < nbrow; row = row + 1) {
      for (col = 0; col < nbcol; col = col + 1) {
        if (col !== nbcol - 1) {
          this.add_edge(new Edge(grid[row + col * nbrow], grid[row + (col + 1) * nbrow]));
        }
        if (row !== nbrow - 1) {
          this.add_edge(new Edge(grid[row + col * nbrow], grid[row + 1 + col * nbrow]));
        }
        if (col !== nbcol - 1 && row !== nbrow - 1) {
          this.add_edge(new Edge(grid[row + col * nbrow], grid[row + 1 + (col + 1) * nbrow]));
          this.add_edge(new Edge(grid[row + 1 + col * nbrow], grid[row + (col + 1) * nbrow]));
        }
      }
    }
    break;
  case Graph.TYPE_CUSTOM:
    node1 = new Node(50, 50); this.add_node(node1);
    node2 = new Node(50, 100); this.add_node(node2);
    node3 = new Node(100, 100); this.add_node(node3);

    this.add_edge(new Edge(node1, node2));
    this.add_edge(new Edge(node2, node3));
    this.add_edge(new Edge(node3, node1));
    break;
  }
}



Graph.prototype.next_edge_around = function (node, edge_direction) {
  // find the next edge in the direction around node from edge
//console.log("Next edge around " + node + ", " + edge_direction);
  "use strict";
  var
    theNode = node,
    theEdge = edge_direction.getEdge(),
    theDirection = edge_direction.getDirection(),
    angle, minangle = 20,
    next_edge, edgeCandidate,
    edgesAroundNode = theNode.getEdges(),
    i;
  for (i = 0; i < edgesAroundNode.length; i = i + 1) {
    edgeCandidate = edgesAroundNode[i];
    if (edgeCandidate !== theEdge) {
      angle = theEdge.angle_to(edgeCandidate, theNode, theDirection);
      if (angle < minangle) {
        next_edge = edgeCandidate;
        minangle = angle;
      }
    }
  }
//console.log("Next edge around. redturning: " + next_edge);
  return next_edge;
};

Graph.prototype.draw = function (scene) {
  "use strict";
  var i;
//  scene.strokeStyle = "rgb(0, 0, 0)";
//  scene.lineWidth = 2;
  for (i = 0; i < this.nodes.length; i = i + 1) { this.nodes[i].draw(scene); }
  for (i = 0; i < this.edges.length; i = i + 1) { this.edges[i].draw(scene); }
};

Graph.prototype.toString = function () {
  "use strict";
  var i, s = "Graph: ";
  s += "\n- " + this.nodes.length + " nodes: ";
  for (i = 0; i < this.nodes.length; i = i + 1) { s += this.nodes[i] + ", "; }
  s += "\n- " + this.edges.length + " edges: ";
  for (i = 0; i < this.edges.length; i = i + 1) { s += this.edges[i] + ", "; }
  return s;
};

Graph.prototype.rotate = function (angle) {
  "use strict";
  // rotate all the nodes of this graph around centre
  var c = Math.cos(angle), s = Math.sin(angle), x, y, n, i;
  for (i = 0; i < this.nodes.length; i = i + 1) {
    n = this.nodes[i];
    x = n.getX(); y = n.getY();
    n.setX(x * c - y * s);
    n.setY(x * s + y * c);
  }
};

Graph.TYPE_RANDOM = 0;
Graph.TYPE_TGRID = 1;
Graph.TYPE_TRIANGLE = 2;
Graph.TYPE_POLAR = 3;
Graph.TYPE_KENNICOTT = 4;
Graph.TYPE_CUSTOM = 5;


var EdgeCoupleArray = (function () {
  "use strict";
  var i;
  return function (nb_edges) {
    this.size = nb_edges;
    this.array = []; //new Array(this.size);
    for (i = 0; i < this.size; i = i + 1) {
      this.array[i] = []; //new Array(2);
      this.array[i][Const.CLOCKWISE] = 0;
      this.array[i][Const.ANTICLOCKWISE] = 0;
    }
  };
}());

EdgeCoupleArray.prototype = {
  getSize: function () { "use strict"; return this.size; },
  getArray: function () { "use strict"; return this.array; },
  toString: function () {
    "use strict";
    var i, s = ["EdgeCoupleArray"];
    for (i = 0; i < this.size; i = i + 1) {
      s.push(this.array[i][Const.CLOCKWISE]);
      s.push(this.array[i][Const.ANTICLOCKWISE]);
      s.push(",");
    }
    return s.join('');
  }
};




//######################################################################
var EdgeDirection = (function () {
  "use strict";
  return function (newEdge, newDirection) {
    this.edge = newEdge;
    this.direction = newDirection;
  };
}());

EdgeDirection.prototype = {
  getEdge: function () { "use strict"; return this.edge; },
  setEdge: function (edge) { "use strict"; this.edge = edge; },
  getDirection: function () { "use strict"; return this.direction; },
  setDirection: function (direction) { "use strict"; this.direction = direction; },
  toString: function () {
    "use strict";
    return "EdgeDirection {e: " + this.edge + ", d:" + (this.direction === Const.ANTICLOCKWISE ? "ANTICLOCKWISE" : "CLOCKWISE") + "}";
  }
};

//######################################################################

// A Bezier spline segment: with 4 control points
function CubicBezierCurve(new_x1, new_y1, new_x2, new_y2, new_x3, new_y3, new_x4, new_y4) {
  "use strict";
  var x1, y1, x2, y2, x3, y3, x4, y4;
  x1 = new_x1; y1 = new_y1;
  x2 = new_x2; y2 = new_y2;
  x3 = new_x3; y3 = new_y3;
  x4 = new_x4; y4 = new_y4;

  // Accessors
  this.getX1 = function () { return x1; };
  this.getY1 = function () { return y1; };
  this.getX2 = function () { return x2; };
  this.getY2 = function () { return y2; };
  this.getX3 = function () { return x3; };
  this.getY3 = function () { return y3; };
  this.getX4 = function () { return x4; };
  this.getY4 = function () { return y4; };


  this.draw = function (scene) {
    G3D.add_sphere(scene, x1, y1, 0, 10);
    G3D.add_sphere(scene, x2, y2, 0, 10);
    G3D.add_sphere(scene, x3, y3, 0, 10);
    G3D.add_sphere(scene, x4, y4, 0, 10);
    G3D.line(scene, x1, y1, 0, x2, y2, 0);
    G3D.line(scene, x2, y2, 0, x3, y3, 0);
    G3D.line(scene, x3, y3, 0, x4, y4, 0);
  };

  this.toString = function () {
    return "CubicBezierCurve { " + x1 + ", " + y1 + " = " + x2 + ", " + y2 + " = " + x3 + ", " + y3 + " = " + x4 + ", " + y4 + "}";

  };
}

//######################################################################

function Point(new_x, new_y) {
  "use strict";
  var x = new_x, y = new_y;

  //Accessors
  this.getX = function () { return x; };
  this.getY = function () { return y; };

  this.toString = function () { return "Point: {x= " + x + ", y= " + y + "}"; };
}

//######################################################################

function PointIndex(new_x, new_y, new_i) {
  // Typically one point of a spline and the segment index of the spline that
  // the point is on
  "use strict";


  var x = new_x, y = new_y, i = new_i, p = new Point(x, y);

  this.getPoint = function () { return p; };
  this.toString = function () { return "PointIndex {point: " + p + ", index: " + i + "}"; };
}

//######################################################################

function Spline(new_red, new_green, new_blue) {
  "use strict";
  var
    segments = [];
  this.red = new_red;
  this.green = new_green;
  this.blue = new_blue;

//    var cssColorString = "rgb(" + red + ", " + green + ", " + blue + ")";
//    console.log("new Spline: " + cssColorString)
//    ctx.strokeStyle = cssColorString;

  // accessors
  this.getSegments = function () { return segments; };
  this.getRed = function () { return this.red; };
  this.getGreen = function () { return this.green; };
  this.getBlue = function () { return this.blue; };

  this.add_segment = function (x1, y1, x2, y2, x3, y3, x4, y4) {
    var bezier = new CubicBezierCurve(x1, y1, x2, y2, x3, y3, x4, y4);
    segments.push(bezier);
    return bezier;
  };

  this.value_at = function (t) {
    var si, tt, ss, pi;
    si = Math.floor(t * segments.length);
    if (si === segments.length) { si = si - 1; }
//    console.log("out: " + si + ", " + segments.length + ", " + t + "\n");
    tt = t * segments.length - si;
    ss = segments[si];
    pi = new PointIndex(ss.getX1() * (1 - tt) * (1 - tt) * (1 - tt) + 3 * ss.getX2() * tt * (1 - tt) * (1 - tt) + 3 * ss.getX3() * tt * tt * (1 - tt) + ss.getX4() * tt * tt * tt,
                        ss.getY1() * (1 - tt) * (1 - tt) * (1 - tt) + 3 * ss.getY2() * tt * (1 - tt) * (1 - tt) + 3 * ss.getY3() * tt * tt * (1 - tt) + ss.getY4() * tt * tt * tt,
                          si);
    return pi;
  };

  this.draw = function (scene) {
    var i;
    for (i = 0; i < segments.length; i = i + 1) {
      segments[i].draw(scene);
    }
  };

  this.toString = function () {
    var i, s = [];
    for (i = 0; i < segments.length; i = i + 1) {
      s.push(segments[i].toString());
    }
    return "Spline: { " + segments.length + " segments (" + s.join(",") + ") }";

  };
}

//######################################################################


// A Pattern is a set of closed curves that form a motif
function Pattern(new_g, new_shape1, new_shape2) {
  "use strict";
  var
    splines = [],
    shape1 = new_shape1,
    shape2 = new_shape2,
    graph = new_g,
    ec = new EdgeCoupleArray(new_g.edges.length),
    i;

  this.draw = function (ctx) {
//    ctx.strokeStyle = "red";
    for (i = 0; i < splines.length; i = i + 1) {
      ctx.strokeStyle = "rgb(" + Math.randomInt(0, 255) + "," + Math.randomInt(0, 255) + "," + Math.randomInt(0, 255) + ")";
      splines[i].draw(ctx);
    }
  };

  this.toString = function () {
    var i, result = "Pattern: { " + splines.length + " splines: [";
    for (i = 0; i < splines.length; i = i + 1) {
      result += splines[i];
    }
    return result + "]}";
  };

  this.edge_couple_set = function (edgeDirection, value) {
    var i;
    for (i = 0; i < graph.edges.length; i = i + 1) {
      if (graph.edges[i] === edgeDirection.getEdge()) {
        ec.getArray()[i][edgeDirection.getDirection()] = value;
//        console.log("setting edge_index " + i + " with dir: " + edgeDirection.getDirection() + " to " + value);
//        console.log(ec.toString());
        return;
      }
    }
  };

  // Add a cubic Bezier curve segment to a spline (s)
  this.addBezierCurve = function (s, node, edge1, edge2, direction) {
//    console.log("<addBezierCurve>" + s + " -- " + node + " -- " + edge1 + " -- " + edge2 + " -- " + direction + "</addBezierCurve>");
    // Parameters:
    // - s: the spline to add the Bezier to
    // - node: a node
    // - edge1: an edge which must include 'node' as one of its nodes
    // - edge2: ditto
    // - direction: whether the bezier should go clockwise or anticlockwise around the node
    //
    //   *----------------- * --------------*
    //         edge1      node   edge2


    // The 4 control points are:
    // (x1, y1) the midpoint of edge1
    // (x2, y2) a complicated function of the pattern's shape parameters, the direction, and the angle between edge1 and edge2
    // (x3, y3) ditto.
    // (x4, y4) the midpoint of edge2

//    console.log("addBezierCurve(s :" + s + ", node: " + node + ", edge1: " + edge1 + ", edge2: " + edge2 + ", direction: " + direction);

    var
      x1 = (edge1.getNode1().getX() + edge1.getNode2().getX()) / 2.0,
      y1 = (edge1.getNode1().getY() + edge1.getNode2().getY()) / 2.0,
      x4 = (edge2.getNode1().getX() + edge2.getNode2().getX()) / 2.0,
      y4 = (edge2.getNode1().getY() + edge2.getNode2().getY()) / 2.0,
      alpha = edge1.angle_to(edge2, node, direction) * shape1,
      beta = shape2,
      i1x, i1y, i2x, i2y, x2, y2, x3, y3;

    switch (direction) {
    case Const.ANTICLOCKWISE:
      // (i1x, i2x) must stick out to the left of NP1 and I2 to the right of NP4
      i1x =  alpha * (node.getY() - y1) + x1;
      i1y = -alpha * (node.getX() - x1) + y1;
      i2x = -alpha * (node.getY() - y4) + x4;
      i2y =  alpha * (node.getX() - x4) + y4;
      x2 =  beta * (y1 - i1y) + i1x;
      y2 = -beta * (x1 - i1x) + i1y;
      x3 = -beta * (y4 - i2y) + i2x;
      y3 =  beta * (x4 - i2x) + i2y;
      break;
    case Const.CLOCKWISE:
      // I1 must stick out to the left of NP1 and I2 to the right of NP4
      i1x = -alpha * (node.getY() - y1) + x1;
      i1y =  alpha * (node.getX() - x1) + y1;
      i2x =  alpha * (node.getY() - y4) + x4;
      i2y = -alpha * (node.getX() - x4) + y4;
      x2 = -beta * (y1 - i1y) + i1x;
      y2 =  beta * (x1 - i1x) + i1y;
      x3 =  beta * (y4 - i2y) + i2x;
      y3 = -beta * (x4 - i2x) + i2y;
      break;
    default:
      console.log("Error in addBezierCurve: direction is neither CLOCKWISE nor ANTICLOCKWISE: " + direction);
    }
    //console.log("adding Bezier (" + x1 + "," + y1 + " -- " + x2 + "," + y2 + " -- " + x3 + "," + y3 + " -- " + x4 + "," + y4 + ")");
    return s.add_segment(x1, y1, x2, y2, x3, y3, x4, y4);
  };


  this.next_unfilled_couple = function () {
    var i, ed = null; //EdgeDirection
    for (i = 0; i < ec.getSize(); i = i + 1) {
      if (ec.getArray()[i][Const.CLOCKWISE] === 0) {
        ed = new EdgeDirection(graph.edges[i], Const.CLOCKWISE);
        return ed;
      } else {
        if (ec.getArray()[i][Const.ANTICLOCKWISE] === 0) {
          ed = new EdgeDirection(graph.edges[i], Const.ANTICLOCKWISE);
          return ed;
        }
      }
    }
    return ed; // possibly null if no edge found
  };

  this.make_curves = function () {
    var
      next_edge,
      current_node, first_node,

      s, //Spline
      bez,
      first_edge_direction, current_edge_direction;

    while ((first_edge_direction = this.next_unfilled_couple()) !== null) {
      // start a new loop

      s = new Spline(Math.randomInt(100, 255), Math.randomInt(100, 255), Math.randomInt(100, 255));

      current_edge_direction = new EdgeDirection(first_edge_direction.getEdge(),
                                                 first_edge_direction.getDirection());
      current_node = first_node = current_edge_direction.getEdge().getNode1();


      do {

//      console.log("current_edge_direction " + current_edge_direction);
//      console.log("current_node " + current_node);

        this.edge_couple_set(current_edge_direction, 1);
        next_edge = graph.next_edge_around(current_node, current_edge_direction);

//      console.log("next_edge " + next_edge);

        // add the spline segment to the spline
        bez = this.addBezierCurve(s, current_node, current_edge_direction.getEdge(), next_edge, current_edge_direction.getDirection());

        // cross the edge
        current_edge_direction.setEdge(next_edge);
        current_node = next_edge.other_node(current_node);
        current_edge_direction.setDirection(1 - current_edge_direction.getDirection());

//        console.log("current e_d: " + current_edge_direction);


      } while (current_node !== first_node ||
               current_edge_direction.getEdge() !== first_edge_direction.getEdge() ||
               current_edge_direction.getDirection() !== first_edge_direction.getDirection());
      if (s.getSegments().length > 2) { // spline is just one point: remove it
        splines.push(s);
      }
    }
  };
}


//######################################################################

var Celtic = (function () {
  "use strict";

  return function (params) {
    var
      curve_width, shadow_width,
      canvas,
      width, height,
      colorMode = Const.RGB, // one of RGB or HSB
      graphRotationAngle = Math.randomFloat(0, 2 * Math.PI),
      graphParams;

    this.color = function (a, b, c) {
      switch (this.colorMode) {
      case Const.RGB: this.r = a; this.g = b; this.b = c; break;
      }
    };

    // constructor code
    params.height = params.width;
    this.delay = 10; // step delay in microsecs
    this.step = 0.001; // parameter increment for progressive rendering
    curve_width = Math.randomFloat(4, 10);
    shadow_width = curve_width + 4;

      // if the type is random, then we pick one other type and compute
      // its parameter randomly. Otherwise it is expected that all
      // parameters are set in the UI and have been retrieved in params
      if (params.type === Graph.TYPE_RANDOM) {
        params.type = Math.randomInt(1, 5);

        switch (params.type) {
        case Graph.TYPE_POLAR:
          params.nb_orbits = Math.randomInt(2, 11);
          params.nb_nodes_per_orbit = Math.randomInt(4, 13);
          break;
        case Graph.TYPE_TGRID:
          params.shape1 = -Math.randomFloat(0.3, 1.2);
          params.shape2 = -Math.randomFloat(0.3, 1.2);
          params.edge_size = Math.randomFloat(50, 90);
          break;
        case Graph.TYPE_KENNICOTT:
          params.shape1 = Math.randomFloat(-1, 1);
          params.shape2 = Math.randomFloat(-1, 1);
          params.edge_size = Math.randomFloat(70, 90);
          params.kennicott_cluster_size = params.edge_size / Math.randomFloat(3, 12) - 1;
          break;
        case Graph.TYPE_TRIANGLE:
          params.edge_size = Math.randomFloat(60, 100);
          params.margin = Math.randomFloat(-900, 0);
          break;
        case Graph.TYPE_CUSTOM:
          params.nb_orbits = Math.randomInt(2, 11);
          params.nb_nodes_per_orbit = Math.randomInt(4, 13);
          break;
        default: console.log("error: graph type out of bounds: " + this.params.type);
        }
      }
      this.graph = new Graph(params);

      this.graph.rotate(graphRotationAngle);
      this.pattern = new Pattern(this.graph, params.shape1, params.shape2);
      this.pattern.make_curves();

      colorMode = Const.HSB;
      this.color(Math.randomInt(0, 256), 200, 200);
  };
}());


// public methods
Celtic.prototype = {
  getGraph: function () { "use strict"; return this.graph; },
  draw: function () {
    "use strict";
    var
      that = this,
      t = 0,
      intervalId;

    intervalId = setInterval(
      function () {
        var t2, pi1, pi2, i, s, p1, p2, splines = that.pattern.getSplines();
        if (t >= 1.0) {
          clearInterval(intervalId);
        } else {
          t2 = (t + that.step > 1.0) ? 1.0 : t + that.step;
          for (i = 0; i < splines.length; i = i + 1) {
            s = splines[i];
            if (s !== null) {
              that.ctx.strokeStyle = "rgb(" + s.getRed() + "," + s.getGreen() + "," + s.getBlue() + ")";
              pi1 = s.value_at(t);
              pi2 = s.value_at(t2);
              p1 = pi1.getPoint();
              p2 = pi2.getPoint();
              G3D.line(that.scene, p1.getX(), p1.getY(), 0, p2.getX(), p2.getY(), 0);
            }
          }
          t = t2;
        }
      },
      this.delay
    );
  }
};
