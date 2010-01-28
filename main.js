DelaunayCeltic = window.DelaunayCeltic || {};



DelaunayCeltic.init = function()
{
  DelaunayCeltic.canvas = document.getElementById("canvas");
  DelaunayCeltic.width = DelaunayCeltic.canvas.width;
  DelaunayCeltic.height = DelaunayCeltic.canvas.height;

  if (DelaunayCeltic.canvas) {
    G2D.init(DelaunayCeltic.canvas.getContext("2d"), DelaunayCeltic.width, DelaunayCeltic.height);
    G2D.clear(200,200,200);
    var scale=1;
    var offset=-10;

    var node1 = new Node(offset-DelaunayCeltic.width/scale,  offset+DelaunayCeltic.height/scale+1);
    var node2 = new Node(offset+DelaunayCeltic.width/(2*scale), offset-DelaunayCeltic.height/(2*scale));
    var node3 = new Node(offset+2*DelaunayCeltic.width/scale, offset+DelaunayCeltic.height/scale+1);

    DelaunayCeltic.subdivision = new Subdivision(node1,node2,node3, CelticEdge);

    // simulate a click, for testing
    DelaunayCeltic.clicked({clientX: 300, clientY: 200});
  }
};

DelaunayCeltic.clicked = function(event)
{
  event._x = event.clientX - DelaunayCeltic.canvas.offsetLeft;
  event._y = event.clientY - DelaunayCeltic.canvas.offsetTop;

  G2D.clear(200,200,200);
  DelaunayCeltic.subdivision.insertSite(new Node(event._x, event._y))
                   .draw();

  DelaunayCeltic.pattern = new Pattern(DelaunayCeltic.subdivision, 1.0, 1.0)
    .makeCurves()
    .draw();
};

window.addEventListener("load", DelaunayCeltic.init, false);
window.addEventListener("mouseup", DelaunayCeltic.clicked, false);

