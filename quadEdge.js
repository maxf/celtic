Math.TWO_PI = 6.2932;


/*
 * QuadEdge Class
 */

var QuadEdge = function(node1, node2) {
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

  if (node1 && node2)
    this._edges[0].endPoints(node1, node2);
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

