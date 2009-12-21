DelaunayCeltic = window.DelaunayCeltic || {};

DelaunayCeltic.init = function()
{
  this.canvas = document.getElementById("canvas");
  this.width = this.canvas.width;
  this.height = this.canvas.height;

  if (this.canvas) {
    G2D.init(this.canvas.getContext("2d"), this.width, this.height);
    G2D.clear(200,200,200);    
    var scale=1;
    var offset=-10;
    
    var node1 = new Node(offset-this.width/scale,  offset+this.height/scale+1);
    var node2 = new Node(offset+this.width/(2*scale), offset-this.height/(2*scale));
    var node3 = new Node(offset+2*this.width/scale, offset+this.height/scale+1);
    
    Graph.init(node1,node2,node3);
  }
};

DelaunayCeltic.clicked = function(event)
{
  event._x = event.clientX - this.canvas.offsetLeft;
  event._y = event.clientY - this.canvas.offsetTop;

  G2D.clear(200,200,200);
  Graph.insertNode(new Node(event._x, event._y))
       .draw();
};

window.addEventListener("load", DelaunayCeltic.init, false);
window.addEventListener("mouseup", DelaunayCeltic.clicked, false);
