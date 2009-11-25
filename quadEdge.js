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
  var _data; // the edge's origin (Point2D)
  var _next; // the edge's next counterclockwise edge around the origin of this edge (Edge)
  var num=0; // number of this edge in the QuadEdge that contains it

  /*
   * returns (as Edge) the dual of the current edge, directed from its left to its right
   */
  this.rot = function() {
    return (num<3) ? this+1 : this-3;
  };


};

/*
 * A quad-edge: 4 directed edges corresponding to a single undirected edge
 * - that edge
 * - its reversed edge
 * - the dual edge
 * - the reversed dual edge
 */

function QuadEdge() {
  var _e = [];
  // array of 4 Edges:
  // [0] the base edge of this QuadEdge
  // [1] the dual of the base edge, which goes from its right to its left
  // [2] the reversed edge of this edge
  // [3] the dual of the base edge, which goes from its left to its right


}