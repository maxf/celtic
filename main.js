
const CLOCKWISE=0;
const ANTICLOCKWISE=1;

function print(text)
{
  if (navigator.userAgent.indexOf("Opera")!=-1) opera.postError(text);
  else if (navigator.userAgent.indexOf("Mozilla")!=-1) console.log(text);
}


DelaunayCeltic = window.DelaunayCeltic || {

init: function()
{
  DelaunayCeltic.canvas = document.getElementById("canvas");
  DelaunayCeltic.width = DelaunayCeltic.canvas.width;
  DelaunayCeltic.height = DelaunayCeltic.canvas.height;

  DelaunayCeltic.param1 = 1;
  DelaunayCeltic.param2 = 1;

  if (DelaunayCeltic.canvas) {
    G2D.init(DelaunayCeltic.canvas.getContext("2d"), DelaunayCeltic.width, DelaunayCeltic.height);
    G2D.clear(200,200,200);
    var scale=1;
    var offset=-10;

    var node1 = new Node(offset-DelaunayCeltic.width/scale,  offset+DelaunayCeltic.height/scale+1);
    var node2 = new Node(offset+DelaunayCeltic.width/(2*scale), offset-DelaunayCeltic.height/(2*scale));
    var node3 = new Node(offset+2*DelaunayCeltic.width/scale, offset+DelaunayCeltic.height/scale+1);

    /*
    var node1 = new Node(100,100);
    var node2 = new Node(500,100);
    var node3 = new Node(300,440);
     */

    node1.shouldBeIgnoredWhenDrawing = true;
    node2.shouldBeIgnoredWhenDrawing = true;
    node3.shouldBeIgnoredWhenDrawing = true;

    DelaunayCeltic.subdivision = new Subdivision(node1,node2,node3);

    // simulate a click, for testing
    DelaunayCeltic.clicked({clientX: 600, clientY: 300});
    DelaunayCeltic.clicked({clientX: 300, clientY: 300});
    DelaunayCeltic.clicked({clientX: 300, clientY: 600});


//    DelaunayCeltic.subdivision.draw();
//    DelaunayCeltic.pattern = new Pattern(DelaunayCeltic.subdivision, DelaunayCeltic.param1, DelaunayCeltic.param2)
//    .makeCurves()
//    .draw();
  }
},

clicked: function(event)
{
  event._x = event.clientX - DelaunayCeltic.canvas.offsetLeft;
  event._y = event.clientY - DelaunayCeltic.canvas.offsetTop;

  G2D.clear(200,200,200);
  var s = DelaunayCeltic.subdivision.insertSite(new Node(event._x, event._y).draw());
  DelaunayCeltic.subdivision.draw();

  DelaunayCeltic.pattern = new Pattern(DelaunayCeltic.subdivision, DelaunayCeltic.param1, DelaunayCeltic.param2)
    .makeCurves()
    .draw();
}
};

window.addEventListener("load", DelaunayCeltic.init, false);
window.addEventListener("mouseup", DelaunayCeltic.clicked, false);

