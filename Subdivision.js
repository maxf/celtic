/*
 * Subdivision: a subdivision of the plane into polygons
 */

var Subdivision = function(a,b,c) {
  // a,b,c are the Nodes of the original triangle

  // Attributes:
  //  startingEdge: the first Edge of this subdivision, from a to b

  var da = new Node(a.x(), a.y());// Graph.allNodes.push(da);
  var db = new Node(b.x(), b.y());// Graph.allNodes.push(db);
  var dc = new Node(c.x(), c.y());// Graph.allNodes.push(dc);

  da.isInOriginalTriangulation = true;
  db.isInOriginalTriangulation = true;
  dc.isInOriginalTriangulation = true;

//  var ea = makeEdge();
//  ea.endPoints(da,db);

  var ea = new QuadEdge(da, db).baseEdge();

//  var eb = makeEdge();
  var eb = new QuadEdge().baseEdge();

  ea.sym().spliceWith(eb);
  eb.endPoints(db,dc);
//  var ec = makeEdge();
  var ec = new QuadEdge().baseEdge();
  eb.sym().spliceWith(ec);
  ec.endPoints(dc,da);
  ec.sym().spliceWith(ea);
  this.startingEdge = ea;

  this._listEdges();

  return this;
};

Subdivision.prototype = {

  /*
   * linear array of edges, for drawing or enumerating
   */
  edgeList: null,

  toString: function() {
    return "Subdivision: {startingEdge: "+this.startingEdge+"}";
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
    if (x.isAt(e.org()) || x.isAt(e.dest())) {
      // point is already in
      this._listEdges(); // TODO: we should add edges incrementally
      return this;
    }
    else if (x.isOnEdge(e)) {
      e=e.oPrev();
      e.oNext().remove();
    }

    // Connect the new point to the vertices of the containing
    // triangle (or quadrilateral, if the new point fell on an
    // existing edge.)

    var base = new QuadEdge().baseEdge();
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
      else if (e.oNext()==this.startingEdge) {// no more suspect edges
        this._listEdges();
        return this;
      }
      else // pop a suspect edge
      {
        e=e.oNext().lPrev();
      }
    } while(true);
  },

 	/*
	 * draws the subdivision
	 */
  draw: function() {
  	if (this.edgeList) {
	    for (var i=this.edgeList.length-1;i>=0;i--) {
        var e=this.edgeList[i];
        // skip edges to origin points
        if (!e.org().isInOriginalTriangulation && !e.dest().isInOriginalTriangulation)
      	  this.edgeList[i].draw();
      }
    }
  },

  /*
   * returns the edge that is next after 'edge' around node 'e', in direction 'd' (clockwise, or anticlockwise)
   */
  nextEdgeAround: function(node, edge, direction)
  {
    if(node==edge.org()) {
      if (direction==CLOCKWISE) {
        return (this._edgeListContains(edge.oPrev())) ? edge.oPrev() : edge.oPrev().sym();
      } else {
        return (this._edgeListContains(edge.oNext())) ? edge.oNext() : edge.oNext().sym();
      }
    } else {
      if (direction==CLOCKWISE) {
        return (this._edgeListContains(edge.dPrev())) ? edge.dPrev() : edge.dPrev().sym();
      } else {
        return (this._edgeListContains(edge.dNext())) ? edge.dNext() : edge.dNext().sym();
      }
    }
  },


  /*
   * check if the edge list contains the passed edge. Returns boolean
   */
  _edgeListContains: function(e) {
    var c;
    for (var j=this.edgeList.length-1; j>=0; j--) {
      c = this.edgeList[j];
      if (e==c) {
        return true;
      }
    }
    return false;
  },

  /*
   * Make a linear list of edges (e.g. for drawing)
   */
  _listEdges: function() {
    this.edgeList=[];
    var addedEdges=[this.startingEdge];
    var e,n,d;
    this.startingEdge.added=true;

    while (addedEdges.length>0) {
      e=addedEdges.pop();
      if(!this._edgeListContains(e.sym())) {
        this.edgeList.push(e);
        // mark the edges that connect to any of the 3 original nodes
        if (e.org().isInOriginalTriangulation || e.dest().isInOriginalTriangulation)
          e.ignoreForCurves = true;
      }
      var neighbours=[e.oNext(), e.oPrev(), e.dNext(), e.dPrev()];
      for (var i=neighbours.length-1; i>=0;i--) {
        n=neighbours[i];
        if (!n.added) {
          n.added=n.sym().added=true;
          addedEdges.push(n);
        }
      }
    }
    // reset flags.
    for (var i=this.edgeList.length-1;i>=0;i--) {
      d=this.edgeList[i];
      d.added=false;
      d.sym().added=false;
    }
  },

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
      if ((x.x()==e.org().x()&&x.y()==e.org().y()) || (x.x()==e.dest().x()&&x.y()==e.dest().y())) return e;
      else if (x.isRightOf(e)) e=e.sym();
      else if (!x.isRightOf(e.oNext())) e=e.oNext();
      else if (!x.isRightOf(e.dPrev())) e=e.dPrev();
      else return e;
    }
  }

};
