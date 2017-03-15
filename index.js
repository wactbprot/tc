var blessed = require('blessed');

// Create a screen object.
var screen = blessed.screen({
  smartCSR: true
});
screen.title = 'se3 vs';

var valve = {
  width: 30,
  height: 10,
  align : 'center',
  content: '{bold}open{/bold}!',
  tags: true,
  style: {
    fg: 'white',
    bg: 'black',
    hover: {
      bg: '#f4c542',
      fg: 'black'
    }
  }
}

// Create a box perfectly centered horizontally and vertically.
var vb1 = JSON.parse(JSON.stringify(valve));
var vb2 = JSON.parse(JSON.stringify(valve));
var vb3 = JSON.parse(JSON.stringify(valve));
var vb4 = JSON.parse(JSON.stringify(valve));

var vb5 = JSON.parse(JSON.stringify(valve));
var vb6 = JSON.parse(JSON.stringify(valve));
var vb7 = JSON.parse(JSON.stringify(valve));
var vb8 = JSON.parse(JSON.stringify(valve));

vb1.top= 0;
vb1.left= 0;

vb2.top= 10;
vb1.left= 0;

vb3.top= 20;
vb3.left= 0;

vb4.top= 30;
vb4.left= 0;

vb5.top= 0;
vb5.left= 30;

vb6.top= 10;
vb6.left= 30;

vb7.top= 20;
vb7.left= 30;

vb8.top= 30;
vb8.left= 30;


var v1 = blessed.box(vb1);
var v2 = blessed.box(vb2);
var v3 = blessed.box(vb3);
var v4 = blessed.box(vb4);

var v5 = blessed.box(vb5);
var v6 = blessed.box(vb6);
var v7 = blessed.box(vb7);
var v8 = blessed.box(vb8);

screen.append(v1);
screen.append(v2);
screen.append(v3);
screen.append(v4);

screen.append(v5);
screen.append(v6);
screen.append(v7);
screen.append(v8);

v1.on('click', function(data) {
  v1.setContent('V1 {bold}close{/bold}!');
  screen.render();
});

v2.on('click', function(data) {
  v2.setContent('V2 {bold}close{/bold}!');
  screen.render();
});

screen.render();
// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
