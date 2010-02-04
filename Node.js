//== Node ==========================================================================
// Node Class

var Node = function(new_x, new_y)
{
  this._x=new_x;
  this._y=new_y;
  this.leftCurveIsComputed = false; // The curve starting from the left side of this edge hasn't been computed yet
  this.rightCurveIsComputed = false;  // The curve starting from the right side of this edge hasn't been computed yet
  return this;
};

Node.prototype = {
  x: function() { return this._x; },
  y: function() { return this._y; },
  setX: function(new_x) { this._x=new_x; },
  setY: function(new_y) { this._y=new_y; },
  draw: function() { G2D.circle(this._x, this._y, 4.0); return this; },
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

