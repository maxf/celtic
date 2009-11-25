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
  var _quad; // the quad-edge that this edge is a member of

  /*
   * returns (as an Edge) the dual of the current edge, directed from its left to its right
   */
  this.rot = function() { return this._quad._edges[(this._num+1)%4]; };

  /*
   * returns (as an Edge) the dual of the current edge, directed from its right to its left
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

  };

  /*
   * returns the destination node (as Node) of this edge
   */
  this.dest = function()
  {

  };

  /*
   * n1 and n2 are Nodes
   */
  this.endPoints = function(n1,n2)
  {

  };


  this.qEdge = function()
  {

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

function QuadEdge() {
  var _edges = [];
  // array of 4 Edges:
  // [0] the base edge of this QuadEdge
  // [1] the dual of the base edge which goes from its right to its left
  // [2] the reversed edge of this edge
  // [3] the dual of the base edge which goes from its left to its right



}


/*################################################################################*/
/*
 * a Subdivision of the planes into polygons - @@a Graph?
 */
function Subdivision(n1,n2,n3) {

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
  // n1, n2 and n3 are Nodes


}