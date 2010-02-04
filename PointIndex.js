function PointIndex(new_x,new_y,new_i) {
  // Typically one point of a spline and the segment index of the spline that
  // the point is on


  var x=new_x, y=new_y, i=new_i;
  var p=new Point(x,y);

  this.getPoint = function() { return p; };
  this.toString = function() { return "PointIndex {point: "+p+", index: "+i+"}"; };
}

