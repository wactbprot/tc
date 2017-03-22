var blessed = require('blessed')
  , _       = require("underscore")
  , request = require("request")
  , pj      = require("./package.json")
  , poll    = 300
  , W = 4
  , H = 4
  , N = W * H
;
var con = { method: 'POST',
            uri: 'http://i75422:55555/',
            json: true,
            body: {
              "Skip": 1,
              "Quantity": 8,
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
                 , n = N;
               return {
                 current:function(){
                   return i;
                 },
                 next: function(){
                   var j = i;
                   i++;
                   if(i == N) i=0;
                   return j;
                 }
               }
             })();

var state = (function(){
               var ec = {}
                 , eo = {}
                 , vs = {};
               return {
                 ecGet:function(adr){
                   return ec[adr];
                 },
                 eoGet:function(adr){
                   return eo[adr];
                 },
                 ecSet:function(s, adr){
                   ec[adr] = s;

                 },
                 eoSet:function(s, adr){
                   eo[adr] = s;

                 },
                 vGet:function(adr){
                   return vs[adr];
                 },
                 vSet:function(s, adr){
                   vs[adr] = s;
                 },
                 draw:function(v, i){
                   var nd  = (new Date()).toTimeString().split(" ")[0]
                   if(ec && eo && vs && v.box && v.box[i]){
                     var ecl = ec[v.eadr[i]][v.eclosed[i]] ? 'closed-sw: off' : 'closed-sw: on'
                       , eop = eo[v.eadr[i]][v.eopen[i]] ? 'open-sw: off'   : 'open-sw: on'
                       , ostr = '{green-fg}{bold}' + v.name[i] +'{/bold}\nopen\n'   + ecl + '\n' + eop + '\n{/green-fg}'
                       , cstr = '{red-fg}{bold}'   + v.name[i] +'{/bold}\nclosed\n' + ecl + '\n' + eop + '\n{/red-fg}'

                     var vstr = vs[v.vadr[i]][v.vpos[i]] ? ostr : cstr;
                     v.box[i].setContent( vstr  + 'update: ' + nd);
                     screen.render();
                   }
                 }
               }
             })();


var valve = {
  proto : {
    width: parseInt(screen.width / W),
    height: parseInt((screen.height)/ H),
    align : 'center',
    content: '{green-fg} start up ...{/green-fg}',
    tags: true,
    border: {
      fg: 'blue',
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black'
    }
  },
  "vadr": ["45407","45407","45407","45407"
          ,"45409","45409","45409","45409"
          ,"45411","45411","45411","45411"
          ,"45413","45413","45413","45413"
          ],
  "eadr": ["45395","45395","45395","45395"
          ,"45397","45397","45397","45397"
          ,"45399","45399","45399","45399"
          ,"45401","45401","45401","45401"
          ],
  "wadr": ["40003","40003","40003","40003"
          ,"40004","40004","40004","40004"
          ,"40005","40005","40005","40005"
          ,"40006","40006","40006","40006"
          ],
  name:[ "V1 (shutter)" , "V2 (1T CDGs)" , "V3 (10T CDGs)" , "V4 (100T CDGs)"
       , "V5 (vessel)"  , "V6"           , "V7"            , "V8"
       , "V9"           , "V10"          , "V11"           , "V12"
       , "V13"          , "V14"          , "V15"           , "V16"
       ],
  row     :[ 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  col     :[ 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
  vpos    :[ 0, 2, 4, 6, 0, 2, 4, 6, 0, 2, 4, 6, 0, 2, 4, 6],
  eopen   :[ 0, 2, 4, 6, 0, 2, 4, 6, 0, 2, 4, 6, 0, 2, 4, 6],
  eclosed :[ 1, 3, 5, 7, 1, 3, 5, 7, 1, 3, 5, 7, 1, 3, 5, 7],
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
  var wadr = valve.wadr[j];
  var vadr = valve.vadr[j];

  wcon.body.Address = wadr ;
  var vc =  state.vGet(vadr);
  if(_.isArray(vc)){
    vc[valve.vpos[j]] = vc[valve.vpos[j]] == 1 ? 0 : 1;
    wcon.body.Value = vc;
    request(wcon, function(error, response, body){
      if(error) {
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
    if(i == N - 1) first = false
  }

  var vadr = valve.vadr[i]
  rcon.body.Address = vadr;
  request(rcon, function(error, response, body){
    if(error) {
      console.log(error);
    } else {
      if(body.Result){
        state.vSet(body.Result, vadr, i);
        var eadr = valve.eadr[i]
        rcon.body.Address = eadr;

        request(rcon, function(error, response, body){
          if(error) {
            console.log(error);
          } else {
            state.ecSet(body.Result, eadr, i);
            state.eoSet(body.Result, eadr, i);
            state.draw(valve, i);

          }
        });
      }
    }
  });
}, poll);
//ini();
