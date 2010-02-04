
/* Class Pattern
 * A set of closed curves that form a motif
 *
 * Parameters:
 * subdivision: a Subdivision to base the motif on
 * shape1, shape2: 2 numbers that control the form of the curves
 */
function Pattern(subdivision, shape1, shape2)
{
  this.splines = [];
  this.shape1=shape1;
  this.shape2=shape2;
  this.graph=subdivision;
  return this;
}

Pattern.prototype = {

  draw: function()
  {
    print(this.toString());
  },

  getSplines: function()
  {
    return splines;
  },

  toString: function()
  {
    var result="Pattern: { splines: [";
    for (var i=0;i<this.splines.length;i++) {
      result+=this.splines[i]+", ";
    }
    return result+"]}";
  },

  draw: function()
  {
    for (var i=0;i<this.splines.length;i++) {
      this.splines[i].draw();
    }
  },


  /*
   *  Add a cubic Bezier curve segment to a spline (s)
   */
  addBezierCurve: function(s, node, edge1, edge2, direction)
  {
    // Parameters:
    // - s: the spline to add the Bezier to
    // - node: a node
    // - edge1: an edge which must include 'node' as one of its nodes
    // - edge2: ditto
    // - direction: whether the bezier should go clockwise or anticlockwise around the node
    //
    //  P1     (x1,y1)          (x4,y4)   P2
    //   *-------x---------*------x-------*
    //         edge1      node   edge2


    // The 4 control points are:
    // (x1,y1) the midpoint of edge1
    // (x2,y2) a complicated function of the pattern's shape parameters, the direction, and the angle between edge1 and edge2
    // (x3,y3) ditto.
    // (x4,y4) the midpoint of edge2

//    print("addBezierCurve(s :"+s+", node: "+node+", edge1: "+edge1+", edge2: "+edge2+", direction: "+direction);

    var P1x, P1y, P2x, P2y;
    if (edge1.org() == node) {
      P1x = edge1.dest().x();
      P1y = edge1.dest().y();
    } else {
      P1x = edge1.org().x();
      P1y = edge1.org().y();
    }

    if (edge2.org() == node) {
      P2x = edge2.dest().x();
      P2y = edge2.dest().y();
    } else {
      P2x = edge2.org().x();
      P2y = edge2.org().y();
    }

    var nx = node.x(), ny=node.y();
    var x1=(P1x+nx)/2.0;
    var y1=(P1y+ny)/2.0;
    var x4=(P2x+nx)/2.0;
    var y4=(P2y+ny)/2.0;

    // angle formed by the edges: acos(scalar_product(edge1, edge2))
    var e1x = P1x - nx;
    var e1y = P1y - ny;
    var e1m = Math.sqrt(e1x*e1x+e1y*e1y);

    e1x = e1x/e1m;
    e1y = e1y/e1m;

    var e2x = P2x - nx;
    var e2y = P2y - ny;
    var e2m = Math.sqrt(e2x*e2x+e2y*e2y);

    e2x = e2x / e2m;
    e2y = e2y / e2m;

    var angle = Math.acos(e1x*e2x + e1y*e2y);
    var alpha=angle*this.shape1;
    var beta=angle*this.shape2;

    var i1x,i1y,i2x,i2y,x2,y2,x3,y3;

    switch(direction) {
    case ANTICLOCKWISE:
      // (i1x,i2x) must stick out to the left of NP1 and I2 to the right of NP4
      i1x =  alpha*(ny-y1)+x1;
      i1y = -alpha*(nx-x1)+y1;
      i2x = -alpha*(ny-y4)+x4;
      i2y =  alpha*(nx-x4)+y4;
      x2 =  beta*(y1-i1y) + i1x;
      y2 = -beta*(x1-i1x) + i1y;
      x3 = -beta*(y4-i2y) + i2x;
      y3 =  beta*(x4-i2x) + i2y;
      break;
    case CLOCKWISE:
      // I1 must stick out to the left of NP1 and I2 to the right of NP4
      i1x = -alpha*(ny-y1)+x1;
      i1y =  alpha*(nx-x1)+y1;
      i2x =  alpha*(ny-y4)+x4;
      i2y = -alpha*(nx-x4)+y4;
      x2 = -beta*(y1-i1y) + i1x;
      y2 =  beta*(x1-i1x) + i1y;
      x3 =  beta*(y4-i2y) + i2x;
      y3 = -beta*(x4-i2x) + i2y;
      break;
    default:
      print("Error in addBezierCurve: direction is neither CLOCKWISE nor ANTICLOCKWISE: "+direction);
    }
//    print("adding Bezier ("+x1+","+y1+" -- "+x2+","+y2+" -- "+x3+","+y3+" -- "+x4+","+y4+")");
    s.add_segment(x1,y1,x2,y2,x3,y3,x4,y4);
  },


  /*
   * Find a curve that hasn't been computed yet: go through each edge and check if its left and right curves have been done yet.
   * returns an object {edge: Edge, direction: int}
   */
  nextCurveToCompute: function()
  {
    var edges = this.graph.edgeList;
    for (var i=edges.length-1; i>=0; i--) {
      if (!edges[i].org().isInOriginalTriangulation && !edges[i].dest().isInOriginalTriangulation) {
        if (!edges[i].leftCurveIsComputed) return {edge: edges[i], direction: ANTICLOCKWISE};
        if (!edges[i].rightCurveIsComputed) return {edge: edges[i], direction: CLOCKWISE};
      }
    }
    return null; // all the curves have been computed.
  },

  makeCurves: function()
  {
    var i=0;
    var current_edge, first_edge, next_edge;
    var current_node, first_node;
    var current_direction, first_direction;
    var s; //Spline
    var firstCurveOrigin;

    while ((firstCurveOrigin=this.nextCurveToCompute())!=null) {
      first_edge = firstCurveOrigin.edge;
      first_direction = firstCurveOrigin.direction;

      // start a new loop
      s=new Spline(0,0,0);

      current_edge = first_edge;
      current_direction = first_direction;
      current_node=first_node=current_edge.org();

      do {

        // add a new segment (cubic Bezier) to the loop
        // a segment is defined by current_node, current_edge, next_edge, current_direction
        //                     ^         _____segment_____
        //  current_direction  |        /                 \
        //                     |       /                   \
        //                +----current_edge------+-----------next_edge--------+
        //                                    current_node


        if (current_direction == ANTICLOCKWISE) {
          current_edge.leftCurveIsComputed = true;
        } else {
          current_edge.rightCurveIsComputed = true;
        }

        next_edge = this.graph.nextEdgeAround(current_node,current_edge,current_direction);

        // if the edge found is not to be used, go for the next one
        while ((next_edge.org().isInOriginalTriangulation || next_edge.dest().isInOriginalTriangulation) &&
               (next_edge!=current_edge)) {
          next_edge = this.graph.nextEdgeAround(current_node,next_edge,current_direction);
        }

        // add the spline segment to the spline
        this.addBezierCurve(s,current_node, current_edge, next_edge, current_direction);

        // cross the edge
        current_edge = next_edge;
        current_node = next_edge.other_node(current_node);
        current_direction = 1-current_direction;

      } while (current_node!=first_node ||
               current_edge != first_edge ||
               current_direction != first_direction); // until we're back at the start
      if (s.segments().length>2) // spline is just one point: remove it
        this.splines.push(s);
    }
    return this;
  }
};

