var blessed = require('blessed')
  , broker  = require("sc-broker")
  , _       = require("underscore")
  , pj        = require("./package.json")  //, prog      = require("commander")
  , mem       = broker.createClient({port: 9000})
  , mpid      = "mpd-se3_valves"
  , poll      = 1000;

mem.publish("get_mp", mpid , function(err){
  if(!err){
    // Create a screen object.
    var screen = blessed.screen({
      smartCSR: true
    });
    screen.title = pj.name +' version: ' + pj.version + ' (q: quit)';
    var valve = {
      proto : {
        width: parseInt(screen.width/3),
        height: parseInt((screen.height)/4),
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
           , "V9"
           , "V10"
           , "V11"
           , "V12"],
      row     :[ 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
      col     :[ 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2],
      vpos    :[ 0, 2, 4, 6, 8,10,12,14,16,16,16,16],
      eopen   :[ 0, 2, 4, 6, 8,10,12,14,16,16,16,16],
      eclosed :[ 1, 3, 5, 7, 9,11,13,15,17,17,17,17],
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
                                    mem.get([mpid, "exchange"], function(err, d){

                                      if(s){
                                        b.setContent('{red-fg}' + n +' closed{/red-fg}');
                                        screen.render();
                                        s = !s;
                                      } else {
                                        b.setContent(' {green-fg}' + n +' open{/green-fg}');
                                        screen.render();
                                        s = !s;
                                      }

                                    });

                                  }
                                }
                               )( valve, i));
    }
    screen.render();

    // Quit on Escape, q, or Control-C.
    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
      mem.publish("rm_mp", mpid , function(err){
        return process.exit(0);
      });
    });

    setInterval(function(){
      mem.get([mpid, "exchange"], function(err, exch){
        if(!err){
          var v =  update(valve, exch);
            if(v){
              valve = v;
              screen.render();
            }
          }
      });
    }, poll);

  }
});


var update = function(v, e){
  for(var i = 0; i < v.name.length; i++){
    var n = v.name[i]
      , vp = v.vpos[i]
      , ec = v.eclosed[i]
      , eo = v.eopen[i]
    if(_.isArray(e.Vold) && _.isArray(e.Eall)){
      var vstate  = e.Vold[vp] ? '{green-fg}open{/green-fg}'          : '{red-fg}closed{/red-fg}'
        , eclosed = e.Eall[eo] ? '{red-fg}closed-switch: no{/red-fg}' : '{green-fg}closed-switch: yes{/green-fg}'
        , eopen   = e.Eall[ec] ? '{red-fg}open-switch: no{/red-fg}'   : '{green-fg}open-switch: yes{/green-fg}';

      v.box[i].setContent('' + n +'\n\n' + vstate + '\n' + eclosed + '\n' + eopen );
    }
  }
  return v;
}