var blessed = require('blessed')
  , _       = require("underscore")
  , request = require("request")
  , pj      = require("./package.json")
  , poll    = 100;
var con = { method: 'POST',
            uri: 'http://localhost:55555/',
            json: true,
            body: {
              "Skip": 1,
              "Quantity": 20,
              "OutMode": "8Bits*",
              "Host": "172.30.56.46",
              "Action": "MODBUS"
            }
          };
var rcon = JSON.parse(JSON.stringify(con))
  ,  wcon = JSON.parse(JSON.stringify(con));

rcon.body.FunctionCode = "ReadHoldingRegisters";
wcon.body.FunctionCode = "writeSingleRegister";

var screen = blessed.screen({
  smartCSR: true
});

screen.title = pj.name +' version: ' + pj.version + ' (q: quit)';


var count = (function(){
               var i = 0
                 , n = 12;
               return {
                 current:function(){
                   return i;
                 },
                 next: function(){
                   var j = i;
                   i++;
                   if(i == 12) i=0;
                   return j;
                 }
               }
             })();

var state = (function(){
               var es
                 , vs;
               return {
                 eGet:function(){
                   return es;
                 },
                 eSet:function(s){
                   es = s;
                 },
                 vGet:function(){
                   return vs;
                 },
                 vSet:function(s){
                   vs = s;
                 },
                 draw:function(v, i){
                   var nd  = (new Date()).toTimeString().split(" ")[0]
                   if(es && vs && v.box && v.box[i]){
                     var vst = vs[v.vpos[i]] ? '{green-fg}open{/green-fg}'          : '{red-fg}closed{/red-fg}'
                       , ecl = es[v.eopen[i]] ? '{red-fg}closed-switch: no{/red-fg}' : '{green-fg}closed-switch: yes{/green-fg}'
                       , eop = es[v.eclosed[i]] ? '{red-fg}open-switch: no{/red-fg}'   : '{green-fg}open-switch: yes{/green-fg}';

                     v.box[i].setContent('' + v.name[i] +'\n\n' + vst + '\n' + ecl + '\n' + eop + '\n' + nd);
                     screen.render();
                   }
                 }
               }
             })();


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
  "vadr": ["45407","45407","45407","45407","45407","45407","45407","45407","45407","45407","45407","45407"],
  "eadr": ["45395","45395","45395","45395","45395","45395","45395","45395","45395","45395","45395","45395"],
  "wadr": ["40003","40003","40003","40003","40003","40003","40003","40003","40003","40003","40003","40003"],
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

var ini = function(i){

  valve.ini.push(JSON.parse(JSON.stringify(valve.proto)))

  valve.ini[i].top      = valve.proto.height * valve.row[i];
  valve.ini[i].left     = valve.proto.width * valve.col[i];
  valve.ini[i].content  = valve.name[i];

  valve.box.push(blessed.box(valve.ini[i]));
  screen.append(valve.box[i]);

  valve.box[i].on('click', function(data){
                  swtch(i);
                 });


  screen.render();
}

var swtch =  function(j){
  wcon.body.Address = valve.wadr[j];
  var vc =  state.vGet();
  if(_.isArray(vc)){
    vc[valve.vpos[j]] = vc[valve.vpos[j]] == 1 ? 0 : 1;
    wcon.body.Value = vc;
    request(wcon, function(error, response, body){
      if(error) {
      console.log(error);
      } else {
        state.draw(valve, j);
      }

    });
  }
}



screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});


var first = true;
setInterval(function(){
  var i =  count.next();
  if(first){
    ini(i);
    if(i == 11) first = false
  }

  rcon.body.Address = valve.vadr[i];
  request(rcon, function(error, response, body){
    if(error) {
      console.log(error);
    } else {
      if(body.Result){
      state.vSet(body.Result);
        rcon.body.Address = valve.eadr[i];
        request(rcon, function(error, response, body){
          if(error) {
            console.log(error);
          } else {
            state.eSet(body.Result);
            state.draw(valve, i);

          }
        });
      }
    }
  });
}, poll);
//ini();
