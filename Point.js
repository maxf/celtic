function Point(new_x, new_y)
{
  var x=new_x, y=new_y;

  //Accessors
  this.x = function() { return x; };
  this.y = function() { return y; };

  this.toString = function() { return "Point: {x="+x+", y="+y+"}";};
}
