Math.TWO_PI = 6.2932;

Graph = window.Graph || {};

Graph.init = function(node1,node2,node3) {
  this.node1 = node1;
  this.node2 = node2;
  this.node3 = node3;
  this.allNodes = [];
  this.drawableEdges = [];
  this.subdivision = new Subdivision(node1,node2,node3);
  return this;
};

Graph.insertNode = function(newNode) {
  var e = this.subdivision.locate(newNode);
  if (newNode.isAt(e.org()) || newNode.isAt(e.dest())) {
    // point is already in, remove it and recompute the whole subdivision (yes, horrible)
    var nodes = this.allNodes;
    this.init(this.node1, this.node2, this.node3);
    for (var i=3; i<nodes.length; i++) {
      if (!newNode.isAt(nodes[i]))
        this.subdivision.insertSite(nodes[i]);
    }
  } else
    this.subdivision.insertSite(newNode);
  return this;
};

Graph.draw = function()
{
  this.subdivision.draw();
};

Graph.drawableEdges = []; // The list of all existing edges.
Graph.allNodes = []; // The list of all existing nodes

//================================================================================
// Node Class

var Node = function(new_x, new_y)
{
  this._x=new_x;
  this._y=new_y;
};

Node.prototype = {
  x: function() { return this._x; },
  y: function() { return this._y; },
  setX: function(new_x) { this._x=new_x; },
  setY: function(new_y) { this._y=new_y; },
  draw: function() { G2D.circle(this._x, this._y, 4.0); },
  toString: function() { return "Node: {x:"+this._x+", y:"+this._y+"}"; },

  /*
   * returns twice the area of the oriented triangle (this,b,c), i.e., the
   * area is positive if the triangle is oriented couterclockwise
   * b,c: Nodes
   * returns: number
   */
  triArea: function(b,c)
  {
    return (b.x()-this._x)*(c.y()-this._y)-(b.y()-this._y)*(c.x()-this._x);
  },

  /*
   * returns true if this point is inside the circle defined by the points a,b,c
   * See Guibas and Stolfi (1985) p.107.
   * a,b,c: Nodes
   * returns: Boolean
   */
  inCircle: function(a,b,c)
  {
    return (a.x()*a.x()+a.y()*a.y()) * b.triArea(c,this) -
           (b.x()*b.x()+b.y()*b.y()) * a.triArea(c,this) +
           (c.x()*c.x()+c.y()*c.y()) * a.triArea(b,this) -
           (this._x*this._x+this._y*this._y) * a.triArea(b,c) > 0;
  },

  /*
   * returns true if the node passed is near this node
   */
  isAt: function(n)
  {
    var threshold=5; //pixels
    return Math.abs(n.x()-this._x)<threshold && Math.abs(n.y()-this._y)<threshold;
  },

  /*
   * returns true if the points this,b,c are in a counterclockwise order
   * b,c: Nodes
   * returns: Boolean
   */
  ccw: function(b,c)
  {
    return this.triArea(b,c)>0;
  },

  /*
   * returns true if this node is to the right of edge e
   * e: Edge
   * returns: Boolean
   */
  isRightOf: function(e)
  {
    return this.ccw(e.dest(),e.org());
  },

  /*
   * returns true if this node is to the left of edge e
   * e: Edge
   * returns: Boolean
   */
  isLeftOf: function(e)
  {
    return this.ccw(e.org(),e.dest());
  },

  /*
   * A predicate that determines if this point is on the edge e.
   * The point is considered on if it is in the EPS-neighborhood
   * of the edge.
   * e: Edge
   * returns: Boolean
   */
  isOnEdge: function(e)
  {
    var EPS=0.00000001;
    var t1,t2,t3; // Numbers

    //  t1 = (x-e.org()).norm();
    t1 = (this._x-e.org().x())*(this._x-e.org().x())+(this._y-e.org().y())*(this._y-e.org().y());

    //  t2 = (x-e.dest()).norm();
    t2 = (this._x-e.dest().x())*(this._x-e.dest().x())+(this._y-e.dest().y())*(this._y-e.dest().y());

    if (t1<EPS || t2<EPS) return true;

    //  t3 = (e.org()-e.dest()).norm();
    t3 = (e.dest().x()-e.org().x())*(e.dest().x()-e.org().x())+(e.dest().y()-e.org().y())*(e.dest().y()-e.org().y());

    if (t1>t3 || t2>t3) return false;

    // var line = new Line(e.org(), e.dest()); // @@ need Line class
    //  return Math.abs(line.eval(x)) < EPS;
    var x1 = e.org().x(), y1=e.org().y();
    var x2 = e.dest().x(), y2=e.dest().y();
    var a,b,dist;
    if (x2-x1==0) { // line is vertical
      dist = this._x-x2;
    } else {
      a=(y2-y1)/(x2-x1), b=y1-a*x1;
      dist = Math.abs(a*this._x+b*this._y);
    }

    return dist < EPS;
  }
};

//== /Node =======================================================================

//================================================================================
/*
 * Edge: Directed edge class
 */

function Edge() {
  this._num=0; // number of this edge in the QuadEdge that contains it
  this._data = null; // the edge's origin (Node)
  this._next = null; // the edge's next counterclockwise edge (from) around the origin of this edge (Edge)
  this._quad = null; // the QuadEdge that this edge is the base edge of


  // Stuff for celtic curves
  // through an Edge pass 2 curves, one coming clockwise, the other anticlockwise
  this.curveDrawn = new Array(2);
  this.curveDrawn[this.LEFT_TO_RIGHT] = false;
  this.curveDrawn[this.RIGHT_TO_LEFT] = false;

};

Edge.prototype = {
  /*
   * returns (as an Edge) the dual of the current edge, directed from its right to its left
   */
  rot: function() { return this._quad._edges[(this._num+1)%4]; },

  /*
   * returns (as an Edge) the dual of the current edge, directed from its left to its right
   */
  invRot: function() { return this._quad._edges[(this._num+3)%4]; },

  /*
   * returns (as an Edge) the edge from the destination to the origin of this edge
   */
  sym: function() { return this._quad._edges[(this._num+2)%4]; },

  /*
   * returns (as an Edge) the next ccw edge around (from) the origin of the current edge
   */
  oNext: function() { return this._next; },

  /*
   * returns (as an Edge) the next cw edge around (from) the origin of the current edge
   */
  oPrev: function() { return this.rot().oNext().rot(); },

  /*
   * returns (as an Edge) the next ccw edge around (into) the destination of the current edge
   */
  dNext: function() { return this.sym().oNext().sym(); },

  /*
   * returns (as an Edge) the next cw edge around (into) the destination of the current edge
   */
  dPrev: function() { return this.invRot().oNext().invRot(); },

  /*
   * returns (as an Edge) the ccw edge around the left face following the current edge
   */
  lNext: function() { return this.invRot().oNext().rot(); },

  /*
   * returns (as an Edge) the ccw edge around the left face before the current edge
   */
  lPrev: function() { return this.oNext().sym(); },

  /*
   * returns (as an Edge) the edge around the right face ccw following the current edge
   */
  rNext: function() { return this.rot().oNext().invRot(); },

  /*
   * returns (as an Edge) the edge around the right face ccw before the current edge
   */
  rPrev: function() { return this.sym().oNext(); },

  /*
   * returns the origin node (as Node) of this edge
   */
  org: function()
  {
    return this._data;
  },

  /*
   * returns the destination node (as Node) of this edge
   */
  dest: function()
  {
    return this.sym().org();
  },

  /*
   * Sets this edge's origin and destination
   * origin and destination are Nodes
   */
  endPoints: function(origin,destination)
  {
    this._data = origin;
    this.sym()._data = destination;
  },

  /*
   * returns the QuadEdge that this edge is the base edge of
   */
  qEdge: function()
  {
    return this._quad;
  },


  /*
   * Attach edges together or break them appart
   *
   * b: the edge to attach or break (Edge)
   */
  spliceWith: function(b)
  {
    var alpha = this.oNext().rot(); // Edge
    var beta = b.oNext().rot(); // Edge
    var t1 = b.oNext(); // Edge
    var t2 = this.oNext(); // Edge
    var t3 = beta.oNext(); // Edge
    var t4 = alpha.oNext(); // Edge

    this._next = t1;
    b._next = t2;
    alpha._next = t3;
    beta._next = t4;
  },


  /*
   * Add a new edge e connecting the destination of this edge to the
   * origin of b in such a way that all 3 have the same left face
   * after the connection is complete. Additionally the data pointers
   * of the new edge are set.
   *
   * parameters: b: Edge
   * returns: Edge
   */
  connectTo: function(edgeConstructor, b)
  {
//    var e=makeEdge();
    var e = new QuadEdge(edgeConstructor).baseEdge();

    e.spliceWith(this.lNext());
    e.sym().spliceWith(b);
    e.endPoints(this.dest(),b.org());
    return e;
  },

  /*
   * Remove from the subdivision
   */
  remove: function() // e is an edge
  {
    this.spliceWith(this.oPrev());
    this.sym().spliceWith(this.sym().oPrev());
    delete this._quad;
  },

  /*
   * Essentially turns this edge counterclockwise inside its enclosing
   * quadrilateral. The data pointers are modified accordingly.
   */
  swap: function()
  {
    var a = this.oPrev();
    var b = this.sym().oPrev();
    this.spliceWith(a);
    this.sym().spliceWith(b);
    this.spliceWith(a.lNext());
    this.sym().spliceWith(b.lNext());
    this.endPoints(a.dest(),b.dest());
  },


  /*
   * draw this edge and the ones connected to it
   */
  draw: function()
  {
    G2D.line(this.org().x(),this.org().y(),this.dest().x(),this.dest().y());
//    this.org().draw();
    this.dest().draw();
  },

  toString: function()
  {
    return "[Edge from "+this.org()+" to "+this.dest()+"]";
  }

};
//== /Edge =======================================================================

//================================================================================
/*
 * QuadEdge Class
 */

var QuadEdge = function(edgeConstructor, node1, node2) {
  this._edges = new Array(4);
  // array of 4 Edges:
  // [0] the base edge of this QuadEdge
  // [1] the dual of the base edge which goes from its right to its left
  // [2] the reversed edge of this edge
  // [3] the dual of the base edge which goes from its left to its right

  for (var i=0;i<4;i++) {
    this._edges[i] = new edgeConstructor();
    this._edges[i]._num=i;
    this._edges[i]._quad = this;
  }

  this._edges[0]._next = this._edges[0];
  this._edges[1]._next = this._edges[3];
  this._edges[2]._next = this._edges[2];
  this._edges[3]._next = this._edges[1];

  if (node1 && node2)
    this._edges[0].endPoints(node1, node2);

  Graph.drawableEdges.push(this._edges[0]);

};

QuadEdge.prototype = {

  baseEdge: function()
  {
    return this._edges[0];
  },

  toString: function()
  {
    return "[QuadEdge: base edge: "+this._edges[0]+", oNext: "+this._edges[0].oNext()+"]";
  }
}

//== /QuadEdge ===================================================================

//================================================================================
/*
 * Subdivision: a subdivision of the plane into polygons
 */
var Subdivision = function(a,b,c,edgeConstructor) {
  // a,b,c are the Nodes of the original triangle

  this.edgeType = edgeConstructor;

  // Attributes:
  //  startingEdge: the first Edge of this subdivision, from a to b

  var da = new Node(a.x(), a.y());// Graph.allNodes.push(da);
  var db = new Node(b.x(), b.y());// Graph.allNodes.push(db);
  var dc = new Node(c.x(), c.y());// Graph.allNodes.push(dc);

//  var ea = makeEdge();
//  ea.endPoints(da,db);

  var ea = new QuadEdge(this.edgeType, da, db).baseEdge();

//  var eb = makeEdge();
  var eb = new QuadEdge(this.edgeType).baseEdge();

  ea.sym().spliceWith(eb);
  eb.endPoints(db,dc);
//  var ec = makeEdge();
  var ec = new QuadEdge(this.edgeType).baseEdge();
  eb.sym().spliceWith(ec);
  ec.endPoints(dc,da);
  ec.sym().spliceWith(ea);
  this.startingEdge = ea;
};

Subdivision.prototype = {

  /*
   * Returns an edge e, such that either x is on e, or e is an edge of
   * a triangle containing x. The search starts from startingEdge and
   * proceeds in the general direction of x. Based on the pseudocode
   * in Guibas and Stolfi (1985) p.121.
   *
   * x : Node
   */
  locate: function(x) {
    var e = this.startingEdge; //Edge
    while (true) {
      if ((x.x()==e.org().x()&&x.y()==e.org().y()) || (x.x()==e.dest().x()&&x.y()==e.dest().y())) return e;
      else if (x.isRightOf(e)) e=e.sym();
      else if (!x.isRightOf(e.oNext())) e=e.oNext();
      else if (!x.isRightOf(e.dPrev())) e=e.dPrev();
      else return e;
    }
  },

  /*
   * Inserts a new point into a subdivision representing a Delaunay
   * triangulation, and fixes the affected edges so that the result
   * is still a Delaunay triangulation. This is based on the
   * pseudocode from Guibas and Stolfi (1985) p.120, with slight
   * modifications and a bug fix.
   *
   * x: Node
   */
  insertSite: function(x) {

    var e = this.locate(x); // Edge
    if (x.isAt(e.org()) || x.isAt(e.dest())) {
      // point is already in
      return this;
    }
    else if (x.isOnEdge(e)) {
      e=e.oPrev();
      e.oNext().remove();
    }

//    Graph.allNodes.push(x);

    // Connect the new point to the vertices of the containing
    // triangle (or quadrilateral, if the new point fell on an
    // existing edge.)

//    var base = makeEdge(); //Edge
    var base = new QuadEdge(this.edgeType).baseEdge();
    base.endPoints(e.org(), new Node(x.x(),x.y()));
    base.spliceWith(e);
    this.startingEdge = base;
    do {
      base = e.connectTo(this.edgeType, base.sym());
      e = base.oPrev();
    } while (e.lNext() != this.startingEdge);


    // Examine syspect edges to ensure that the Delaunay triangulation
    // is satisfied
    do {
      var t = e.oPrev(); //Edge
      if (t.dest().isRightOf(e) && x.inCircle(e.org(),t.dest(),e.dest())) {
        e.swap();
        e=e.oPrev();
      }
      else if (e.oNext()==this.startingEdge) {// no more suspect edges
        return this;
      }
      else // pop a suspect edge
      {
        e=e.oNext().lPrev();
      }
    } while(true);
  },

  draw: function() {
//    this.startingEdge.draw();
    for (var i=0;i<Graph.drawableEdges.length;i++)
      Graph.drawableEdges[i].draw();
  }
};

/*################################################################################*/

/*
 * creates a new quadEdge and return its base edge
 */
//function makeEdge(edgeConstructor)
//{
//  var q = new QuadEdge(edgeConstructor);
//  return q._edges[0]; // type Edge
//}



function print(text)
{
  if (navigator.userAgent.indexOf("Opera")!=-1) opera.postError(text);
  else if (navigator.userAgent.indexOf("Mozilla")!=-1) console.log(text);
}


//################################################################################
