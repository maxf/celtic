var drawnEdges=[]; // Array of Edge

Math.TWO_PI = 6.2932;

var Node = function(new_x, new_y)
{
  // constructor
  this._x=new_x;
  this._y=new_y;
};

Node.prototype = {
  x: function() { return this._x; },
  y: function() { return this._y; },
  setX: function(new_x) { this._x=new_x; },
  setY: function(new_y) { this._y=new_y; },
  draw: function() { circle(this._x, this._y, 4.0); },
  toString: function() { return "Node: {x:"+this._x+", y:"+this._y+"}"; }
};

//================================================================================



//================================================================================
/*
 * Edge: Directed edge class
 */

function Edge() {
//  this._data; // the edge's origin (Node)
//  this._next; // the edge's next counterclockwise edge (from) around the origin of this edge (Edge)
  this._num=0; // number of this edge in the QuadEdge that contains it
//  this._quad; // the QuadEdge that this edge is the base edge of
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


  draw: function()
  {
    if (!alreadyDrawn(this)) {
      line(this.org().x(),this.org().y(),this.dest().x(),this.dest().y());
      this.org().draw();
      drawnEdges.push(this);
      this.oNext().draw();
      this.dNext().draw();
      this.oPrev().draw();
      this.dPrev().draw();
    }
  }

};

/*################################################################################*/

/*
 * A quad-edge: 4 directed edges corresponding to a single undirected edge
 * - that edge
 * - its reversed edge
 * - the dual edge
 * - the reversed dual edge
 */

var QuadEdge = function() {
  this._edges = new Array(4);
  // array of 4 Edges:
  // [0] the base edge of this QuadEdge
  // [1] the dual of the base edge which goes from its right to its left
  // [2] the reversed edge of this edge
  // [3] the dual of the base edge which goes from its left to its right

  // constructor
  for (var i=0;i<4;i++) {
    this._edges[i] = new Edge();
    this._edges[i]._num=i;
    this._edges[i]._quad = this;
  }

  this._edges[0]._next = this._edges[0];
  this._edges[1]._next = this._edges[3];
  this._edges[2]._next = this._edges[2];
  this._edges[3]._next = this._edges[1];
};


/*################################################################################*/
/*
 * a Subdivision of the plane into polygons
 */
var Subdivision = function(a,b,c) {

  //  startingEdge; // an Edge

  // constructor
  // a,b,c are Nodes
  var da = new Node(a.x(), a.y());
  var db = new Node(b.x(), b.y());
  var dc = new Node(c.x(), c.y());
  var ea = makeEdge();
  ea.endPoints(da,db);
  var eb = makeEdge();
  splice(ea.sym(),eb);
  eb.endPoints(db,dc);
  var ec = makeEdge();
  splice(eb.sym(),ec);
  ec.endPoints(dc,da);
  splice(ec.sym(),ea);
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
  _locate: function(x) {
    var e = this.startingEdge; //Edge
    while (true) {
      if (x==e.org() || x==e.dest()) return e;
      else if (rightOf(x,e)) e=e.sym();
      else if (!rightOf(x,e.oNext())) e=e.oNext();
      else if (!rightOf(x,e.dPrev())) e=e.dPrev();
      else return e;
    }
  },

  // Inserts a new point into a subdivision representing a Delaunay
  // triangulation, and fixes the affected edges so that the result
  // is still a Delaunay triangulation. This is based on the
  // pseudocode from Guibas and Stolfi (1985) p.120, with slight
  // modifications and a bug fix.
  // x: Node
  insertSite: function(x) {
    var e = this._locate(x); // Edge
    if ((x==e.org())||(x==e.dest())) // point is already in
      return;
    else if (onEdge(x,e)) {
      e=e.oPrev();
      deleteEdge(e.oNext);
    }

    // Connect the new point to the vertices of the containing
    // triangle (or quadrilateral, if the new point fell on an
    // existing edge.)

    var base = makeEdge(); //Edge
    base.endPoints(e.org(), new Node(x.x(),x.y()));
    splice(base,e);
    this.startingEdge = base;
    do {
      base = connect(e,base.sym());
      e = base.oPrev();
    } while (e.lNext() != this.startingEdge);

    // Examine syspect edges to ensure that the Delaunay triangulation
    // is satisfied
    do {
      var t = e.oPrev(); //Edge
      if (rightOf(t.dest(),e) && inCircle(e.org(),t.dest(),e.dest(),x)) {
        swap(e);
        e=e.oPrev();
      }
      else if (e.oNext()==this.startingEdge) // no more suspect edges
        return;
      else // pop a suspect edge
        e=e.oNext().lPrev();
    } while(true);
  },


  draw: function() {
    this.startingEdge.draw();
  }
};

/*################################################################################*/

/*
 * creates a new quadEdge and return its base edge
 */
function makeEdge()
{
  var q = new QuadEdge();
  return q._edges[0]; // type Edge
}

/*
 * Attach edges together or break them appart
 */
function splice(a,b) // a and b are Edges
{
  var alpha = a.oNext().rot(); // Edge
  var beta = b.oNext().rot(); // Edge
  var t1 = b.oNext(); // Edge
  var t2 = a.oNext(); // Edge
  var t3 = beta.oNext(); // Edge
  var t4 = alpha.oNext(); // Edge

  a._next = t1;
  b._next = t2;
  alpha._next = t3;
  beta._next = t4;
}

function deleteEdge(e) // e is an edge
{
  splice(e,e.oPrev());
  splice(e.sym(), e.sym().oPrev());
}


/*
 * Add a new edge e connection the destination of a to the origin of b
 * in such a way that all 3 have the same left face after the connection
 * is complete. Additionally the data pointers of the new edge are set.
 * parameters: a, b: Edge
 * returns: Edge
 */
function connect(a,b)
{
  var e=makeEdge();
  splice(e,a.lNext());
  splice(e.sym(),b);
  e.endPoints(a.dest(),b.org());
  return e;
};

/*
 * Essentially turns edge e counterclockwise inside its enclosing
 * quadrilateral. The data pointers are modified accordingly.
 * params: e: Edge
 */
function swap(e)
{
  var a = e.oPrev();
  var b = e.sym().oPrev();
  splice(e,a);
  splice(e.sym(),b);
  splice(e,a.lNext());
  splice(e.sym(),b.lNext());
  e.endPoints(a.dest(),b.dest());
}

/******************* Geometric Predicates for Delaunay Diagrams **************************/

/*
 * returns twice the area of the oriented triangle (a,b,c), i.e., the
 * area is positive if the triangle is oriented couterclockwise
 * a,b,c: Nodes
 * returns: number
 */
function triArea(a,b,c)
{
  return (b.x()-a.x())*(c.y()-a.y())-(b.y()-a.y())*(c.x()-a.x());
}

/*
 * returns true if point d is inside the circle defined by the points a,b,c.
 * See Guibas and Stolfi (1985) p.107.
 * a,b,c,d: Nodes
 * returns: Boolean
 */
function inCircle(a,b,c,d)
{
  return (a.x()*a.x()+a.y()*a.y()) * triArea(b,c,d) -
         (b.x()*b.x()+b.y()*b.y()) * triArea(a,c,d) +
         (c.x()*c.x()+c.y()*c.y()) * triArea(a,b,d) -
         (d.x()*d.x()+d.y()*d.y()) * triArea(a,b,c) > 0;
}

/*
 * returns true if the points a,b,c are in a counterclockwise order
 * a,b,c: Nodes
 * returns: Boolean
 */
function ccw(a,b,c)
{
  return triArea(a,b,c)>0;
}

/*
 * x: Point, e: Edge
 * returns: Boolean
 */
function rightOf(x,e)
{
  return ccw(x,e.dest(),e.org());
}

/*
 * x: Node, e: Edge
 * returns: Boolean
 */
function leftOf(x,e)
{
  return ccw(x,e.org(),e.dest());
}

/*
 * A predicate that determines if the point x is on the edge e.
 * The point is considered on if it is in the EPS-neighborhood
 * of the edge.
 * x: Node, e: Edge
 * returns: Boolean
 */
function onEdge(x,e)
{
  var EPS=0.00000001;
  var t1,t2,t3; // Numbers

//  t1 = (x-e.org()).norm();
  t1 = (x.x()-e.org().x())*(x.x()-e.org().x())+(x.y()-e.org().y())*(x.y()-e.org().y());

//  t2 = (x-e.dest()).norm();
  t2 = (x.x()-e.dest().x())*(x.x()-e.dest().x())+(x.y()-e.dest().y())*(x.y()-e.dest().y());

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
    dist = x.x()-x2;
  } else {
    a=(y2-y1)/(x2-x1), b=y1-a*x1;
    dist = a*x.x()+b*x.y();
  }
  return dist < EPS;
}



var g_canvas = document.getElementById("canvas");
var g_ctx;
if (g_canvas) {
  g_ctx = g_canvas.getContext("2d");
  g_ctx.strokeStyle = "rgb(100,100,100)";

  var node1 = new Node(100,100);
  var node2 = new Node(200,100);
  var node3 = new Node(200,200);

  var s = new Subdivision(node1,node2,node3);

  s.insertSite(new Node(175,125));

  s.draw();

}

function circle(cx,cy,radius)
{
  g_ctx.lineWidth = 2;
  g_ctx.beginPath();
  g_ctx.arc(cx,cy,radius,0,Math.TWO_PI,false);
  g_ctx.closePath();
  g_ctx.stroke();
}


function line(x1,y1, x2,y2)
{
//  g_ctx.strokeStyle="rgb("+randomInt(0,255)+","+randomInt(0,255)+","+randomInt(0,255)+")";
//  print("tracing line from ("+x1+","+y1+" to ("+x2+","+y2+")");
  g_ctx.beginPath();
  g_ctx.moveTo(x1,y1);
  g_ctx.lineTo(x2,y2);
  g_ctx.closePath();
  g_ctx.stroke();
}

//################################################################################



function alreadyDrawn(edge)
{
  for (var i=0; i<drawnEdges.length; i++)
    if (edge===drawnEdges[i]) return true;
  return false;
}

