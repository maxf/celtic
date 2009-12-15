Math.TWO_PI = 6.2932;


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
  draw: function() { circle(this._x, this._y, 4.0); },
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
      dist = a*this._x+b*this._y;
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
//  this._data; // the edge's origin (Node)
//  this._next; // the edge's next counterclockwise edge (from) around the origin of this edge (Edge)
  this._num=0; // number of this edge in the QuadEdge that contains it
//  this._quad; // the QuadEdge that this edge is the base edge of
  this._drawn = false; // Boolean. True if this edge has already been drawn
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
  connectTo: function(b)
  {
    var e=makeEdge();
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
    if (!this._drawn) {
      line(this.org().x(),this.org().y(),this.dest().x(),this.dest().y());
      this._drawn = true;
      this.org().draw();
      this.oNext().draw();
      this.dNext().draw();
      this.oPrev().draw();
      this.dPrev().draw();
    }
  }

};
//== /Edge =======================================================================

//================================================================================
/* 
 * QuadEdge Class
 */

var QuadEdge = function() {
  this._edges = new Array(4);
  // array of 4 Edges:
  // [0] the base edge of this QuadEdge
  // [1] the dual of the base edge which goes from its right to its left
  // [2] the reversed edge of this edge
  // [3] the dual of the base edge which goes from its left to its right

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

//== /QuadEdge ===================================================================

//================================================================================
/*
 * Subdivision: a subdivision of the plane into polygons
 */
var Subdivision = function(a,b,c) {
  // a,b,c are the Nodes of the original triangle

  // Attributes:
  //  startingEdge: the first Edge of this subdivision, from a to b

  var da = new Node(a.x(), a.y());
  var db = new Node(b.x(), b.y());
  var dc = new Node(c.x(), c.y());
  var ea = makeEdge();
  ea.endPoints(da,db);
  var eb = makeEdge();
  ea.sym().spliceWith(eb);
  eb.endPoints(db,dc);
  var ec = makeEdge();
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
  _locate: function(x) {
    var e = this.startingEdge; //Edge
    while (true) {
      if (x==e.org() || x==e.dest()) return e;
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
    var e = this._locate(x); // Edge
    if ((x==e.org())||(x==e.dest())) 
      // point is already in
      return;
    else if (x.isOnEdge(e)) {
      e=e.oPrev();
      e.oNext().remove();
    }

    // Connect the new point to the vertices of the containing
    // triangle (or quadrilateral, if the new point fell on an
    // existing edge.)

    var base = makeEdge(); //Edge
    base.endPoints(e.org(), new Node(x.x(),x.y()));
    base.spliceWith(e);
    this.startingEdge = base;
    do {
      base = e.connectTo(base.sym());
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
  s.insertSite(new Node(190,125));

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
