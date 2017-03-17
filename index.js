var blessed = require('blessed');

// Create a screen object.
var screen = blessed.screen({
  smartCSR: true
});
screen.title = 'se3 vs (q:quit)';


var valve = {
  proto : {
    width: parseInt(screen.width/3) -1,
    height: parseInt((screen.height)/3) -1,
    align : 'center',
    content: '{green-fg} start up ...{/green-fg}',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black'
    }
  },
  name:[ "V1 (shutter)"
       , "V2 (1T CDGs)"
       , "V3 (10T CDGs)"
       , "V4 (100T CDGs)"
       , "V5 (vessel)"
       , "V6"
       , "V7"
       , "V8"
       , "V9"],
  row :[ 0, 1, 2, 0, 1, 2, 0, 1, 2],
  col :[ 0, 0, 0, 1, 1, 1, 2, 2, 2],
  ini:[],
  box:[]
}

for( var i = 0; i < valve.name.length; i++){

  valve.ini.push(JSON.parse(JSON.stringify(valve.proto)))

  valve.ini[i].top      = valve.proto.height * valve.row[i];
  valve.ini[i].left     = valve.proto.width * valve.col[i]
  valve.ini[i].content  = valve.name[i]
  valve.box.push(blessed.box(valve.ini[i]));
  screen.append(valve.box[i])

  valve.box[i].on('click', (function(v, j){
                              var s = true
                                , b = v.box[j]
                                , n = v.name[j]

                              return function(data) {
                                if(s){
                                  b.setContent('{red-fg}' + n +' closed{/red-fg}');
                                  screen.render();
                                  s = !s;
                                } else {
                                  b.setContent(' {green-fg}' + n +' open{/green-fg}');
                                  screen.render();
                                  s = !s;
                                }
                              }})( valve, i));
}


screen.render();
// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
