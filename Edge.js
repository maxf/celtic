//== Edge ========================================================================
/*
 * Edge: Directed edge class
 */

function Edge() {
  this._num=0; // number of this edge in the QuadEdge that contains it
  this._origin = null; // the edge's origin (Node)
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
  rot: function() {
    return this._quad._edges[(this._num+1)%4];
  },

  /*
   * returns the node of this edge that is not the one passed
   */
  other_node: function(n) {
    if (n==this.org())
      return this.dest();
    else
      return this.org();
  },

  /*
   * returns (as an Edge) the dual of the current edge, directed from its left to its right
   */
  invRot: function() {
    return this._quad._edges[(this._num+3)%4];
  },

  /*
   * returns (as an Edge) the edge from the destination to the origin of this edge
   */
  sym: function() {
    return this._quad._edges[(this._num+2)%4];
  },

  /*
   * returns (as an Edge) the next ccw edge around (from) the origin of the current edge
   */
  oNext: function() {
    return this._next;
  },

  /*
   * returns (as an Edge) the next cw edge around (from) the origin of the current edge
   */
  oPrev: function() {
    return this.rot().oNext().rot();
  },

  /*
   * returns (as an Edge) the next ccw edge around (into) the destination of the current edge
   */
  dNext: function() {
    return this.sym().oNext().sym();
  },

  /*
   * returns (as an Edge) the next cw edge around (into) the destination of the current edge
   */
  dPrev: function() {
    return this.invRot().oNext().invRot();
  },

  /*
   * returns (as an Edge) the ccw edge around the left face following the current edge
   */
  lNext: function() {
    return this.invRot().oNext().rot();
  },

  /*
   * returns (as an Edge) the ccw edge around the left face before the current edge
   */
  lPrev: function() {
    return this.oNext().sym();
  },

  /*
   * returns (as an Edge) the edge around the right face ccw following the current edge
   */
  rNext: function() {
    return this.rot().oNext().invRot();
  },

  /*
   * returns (as an Edge) the edge around the right face ccw before the current edge
   */
  rPrev: function() {
    return this.sym().oNext();
  },

  /*
   * returns the origin node (as Node) of this edge
   */
  org: function()
  {
    return this._origin;
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
    this._origin = origin;
    this.sym()._origin = destination;
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
    var e = new QuadEdge().baseEdge();

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
    this.org().draw();
    this.dest().draw();
  },

  toString: function()
  {
    return "[Edge from "+this.org()+" to "+this.dest()+"]";
  }

};
