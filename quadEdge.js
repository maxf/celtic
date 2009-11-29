function Node(new_x, new_y)
{
  var _x=new_x;
  var _y=new_y;

  this.x = function() { return x; };
  this.y = function() { return y; };
  this.setX = function(new_x) { x=new_x; };
  this.setY = function(new_y) { y=new_y; };

  this.draw = function() { circle(this.x, this.y, 4.0); };
  this.toString = function() { return "Node: {x:"+this.x+", y:"+this.y+"}"; };
}

//================================================================================

/*
 * Directed edge
 */
function Edge() {
  var _data; // the edge's origin (Node)
  var _next; // the edge's next counterclockwise edge (from) around the origin of this edge (Edge)
  var _num=0; // number of this edge in the QuadEdge that contains it
  var _quad; // the QuadEdge that this edge is the base edge of

  /*
   * returns (as an Edge) the dual of the current edge, directed from its right to its left
   */
  this.rot = function() { return this._quad._edges[(this._num+1)%4]; };

  /*
   * returns (as an Edge) the dual of the current edge, directed from its left to its right
   */
  this.invRot = function() { return this._quad._edges[(this._num+1)%4]; };

  /*
   * returns (as an Edge) the edge from the destination to the origin of this edge
   */
  this.sym = function() { return this._quad._edges[(this._num+2)%4]; };

  /*
   * returns (as an Edge) the next ccw edge around (from) the origin of the current edge
   */
  this.oNext = function() { return this._next; };

  /*
   * returns (as an Edge) the next cw edge around (from) the origin of the current edge
   */
  this.oPrev = function() { return this.rot().oNext().rot(); };

  /*
   * returns (as an Edge) the next ccw edge around (into) the destination of the current edge
   */
  this.dNext = function() { return this.sym().oNext().sym(); };

  /*
   * returns (as an Edge) the next cw edge around (into) the destination of the current edge
   */
  this.dPrev = function() { return this.invRot().oNext().invRot(); };

  /*
   * returns (as an Edge) the ccw edge around the left face following the current edge
   */
  this.lNext = function() { return this.invRot().oNext().rot(); };

  /*
   * returns (as an Edge) the ccw edge around the left face before the current edge
   */
  this.lPrev = function() { return this.oNext().sym(); };

  /*
   * returns (as an Edge) the edge around the right face ccw following the current edge
   */
  this.rNext = function() { return this.rot().oNext().invRot(); };

  /*
   * returns (as an Edge) the edge around the right face ccw before the current edge
   */
  this.rPrev = function() { return this.sym().oNext(); };

  /*
   * returns the origin node (as Node) of this edge
   */
  this.org = function()
  {
    return this._data;
  };

  /*
   * returns the destination node (as Node) of this edge
   */
  this.dest = function()
  {
    return this.sym().org();
  };

  /*
   * Sets this edge's origin and destination
   * origin and destination are Nodes
   */
  this.endPoints = function(origin,destination)
  {
    this._data = origin;
    this.sym()._data = destination;
  };

  /*
   * returns the QuadEdge that this edge is the base edge of
   */

  this.qEdge = function()
  {
    return this._quad;
  };


};

/*################################################################################*/

/*
 * A quad-edge: 4 directed edges corresponding to a single undirected edge
 * - that edge
 * - its reversed edge
 * - the dual edge
 * - the reversed dual edge
 */

function QuadEdge() {
  var _edges = [];
  // array of 4 Edges:
  // [0] the base edge of this QuadEdge
  // [1] the dual of the base edge which goes from its right to its left
  // [2] the reversed edge of this edge
  // [3] the dual of the base edge which goes from its left to its right

  // constructor
  for (var i=0;i<4;i++) {
    _edges[i] = new Edge();
    _edges[i].num=i;
  }

  _edges[0].next = _edges[0];
  _edges[1].next = _edges[3];
  _edges[2].next = _edges[2];
  _edges[3].next = _edges[1];

}


/*################################################################################*/
/*
 * a Subdivision of the plane into polygons
 */
function Subdivision(a,b,c) {

  var _startingEdge; // an Edge

  function _locate(n) {
    // n is a Node
    ;
  }

  this.insertSite = function(n) {
    // n is a Node
  };

  this.draw = function() {
    //
  };

  // constructor
  // a,b,c are Nodes
  var da = new Node(a.x(), a.y());
  var db = new Node(b.x(), b.y());
  var dc = new Node(c.x(), c.y());
  var ea = makeEdge(); ea.endPoints(da,db);
  var eb = makeEdge(); splice(ea.sym(),eb); eb.endPoints(db,dc);
  var ec = makeEdge(); splice(eb.sym(),ec); ec.endPoints(dc,da); splice(ec.sym(),ea);
  this.startingEdge = ea;


}

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
         (b.x()*b.x()+b.y()*b.y()) * triArea(a,c,d) -
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
  t3 = (e.dest.x()-e.org.x())*(e.dest.x()-e.org.x())+(e.dest.y()-e.org.y())*(e.dest.y()-e.org.y());


  if (t1>t3 || t2>t3) return false;

  var line = new Line(e.org(), e.dest()); // @@ need Line class
  return Math.abs(line.eval(x)) < EPS;
}