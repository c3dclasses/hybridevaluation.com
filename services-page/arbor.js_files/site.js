//
// site.js
//
// the Services website
//

// sets preloaded images for the graph
var img1 = new Image(); 
img1.src = "youtube.png";
var img2 = new Image(); 
img2.src = "kitty.png";

(function($){ 
  var Renderer = function(elt){
    var dom = $(elt)
    var canvas = dom.get(0)
    var ctx = canvas.getContext("2d");
    var gfx = arbor.Graphics(canvas)
    var sys = null

    var selected = null,
        nearest = null,
        _mouseP = null;

    var that = {
      init:function(pSystem){
        sys = pSystem
        sys.screen({size:{width:dom.width(), height:dom.height()}, padding:[40,40,40,40]})
        $(window).resize(that.resize)
        that.resize()
        that._initMouseHandling()
      },
	  
      resize:function(){
        canvas.width = $(window).width()
        canvas.height = $(window).height()
        sys.screen({size:{width:canvas.width, height:canvas.height}})
        //_vignette = null
        that.redraw()
      },
      
	  redraw:function(){
        gfx.clear()
        sys.eachEdge(function(edge, p1, p2){
         // if (edge.source.data.alpha * edge.target.data.alpha == 0) return
          gfx.line(p1, p2, {stroke:"#0081e6", width:2, alpha:edge.target.data.alpha})
        })
        sys.eachNode(function(node, pt){
			
          var w = Math.max(20, 20+gfx.textWidth(node.title) )
          
		  if( node.data.service )
		  	gfx.text(node.data.title, pt.x, pt.y+7, {color:node.data.color, align:"center", font:"Arial", size:24})
          else
		  	gfx.text(node.data.title, pt.x, pt.y+7, {color:"black", align:"center", font:"Arial", size:72})
          
		  //gfx.text(node.data.title, pt.x, pt.y+7, {color:"black", align:"center", font:"Arial", size:72})
          
		  
		  //if (node.data.alpha===0) return
          //if (node.data.shape=='dot'){
            //gfx.oval(pt.x-w/2, pt.y-w/2, w, w, {fill:node.data.color, alpha:node.data.alpha})
          //  gfx.text(node.name, pt.x, pt.y+7, {color:"black", align:"center", font:"Arial", size:72})
          //  gfx.text(node.name, pt.x, pt.y+7, {color:"black", align:"center", font:"Arial", size:72})
          //}else{
          //  gfx.rect(pt.x-w/2, pt.y-8, w, 20, 4, {fill:node.data.color, alpha:node.data.alpha})
          //  gfx.text(node.name, pt.x, pt.y+9, {color:"white", align:"center", font:"Arial", size:72})
          //  gfx.text(node.name, pt.x, pt.y+9, {color:"white", align:"center", font:"Arial", size:72})
          //}
        })
      //  that._drawVignette()
      },
     
      switchSection:function(newSection){
        var parent = sys.getEdgesFrom(newSection)[0].source
        var children = $.map(sys.getEdgesFrom(newSection), function(edge){
          return edge.target
        })
        
        sys.eachNode(function(node){
          if (node.data.shape=='dot') return // skip all but leafnodes

          var nowVisible = ($.inArray(node, children)>=0)
          var newAlpha = (nowVisible) ? 1 : 0
          var dt = (nowVisible) ? .5 : .5
          sys.tweenNode(node, dt, {alpha:newAlpha})

          if (newAlpha==1){
            node.p.x = parent.p.x + .05*Math.random() - .025
            node.p.y = parent.p.y + .05*Math.random() - .025
            node.tempMass = .001
          }
        })
      },
       
      _initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        selected = null;
        nearest = null;
        var dragged = null;
        var oldmass = 1

        var _section = null

        var handler = {
          moved:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            nearest = sys.nearest(_mouseP);

            if (!nearest.node) return false

            if (nearest.node.data.shape!='dot'){
              selected = (nearest.distance < 50) ? nearest : null
              if (selected){
                 dom.addClass('linkable')
				 if (selected.node.data.link)
                 	window.status = selected.node.data.link.replace(/^\//,"http://"+window.location.host+"/").replace(/^#/,'')
              }
              else{
                 dom.removeClass('linkable')
                 window.status = ''
              }
            }else if ($.inArray(nearest.node.name, childNodes) >=0 ){
              if (nearest.node.name!=_section){
                _section = nearest.node.name
                that.switchSection(_section)
              }
              dom.removeClass('linkable')
              window.status = ''
            }
            
            return false
          },
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            nearest = dragged = sys.nearest(_mouseP);
            
            if (nearest && selected && nearest.node===selected.node){
              var link = selected.node.data.link
              if (link && link.match(/^#/)){
                 $(that).trigger({type:"navigate", path:link.substr(1)})
              }else{
                 window.location = link
              }
              return false
            }
            
            
            if (dragged && dragged.node !== null) dragged.node.fixed = true

            $(canvas).unbind('mousemove', handler.moved);
            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var old_nearest = nearest && nearest.node._id
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (!nearest) return
            if (dragged !== null && dragged.node !== null){
              var p = sys.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null;
            // selected = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            $(canvas).bind('mousemove', handler.moved);
            _mouseP = null
            return false
          }
        }

        $(canvas).mousedown(handler.clicked);
        $(canvas).mousemove(handler.moved);

      }
    }
    
    return that
  }
  
  $(document).ready(function(){
    var CLR = {
      branch:"#b2b19d",
      code:"orange",
      doc:"#922E00",
      demo:"#a7af00"
    }
	
	//childNodes = ['Services','code','docs','demos'];
	
    var theUI = {
     	nodes: {
				"services": {
					title: "Services",
					content: "This is the content of the service",
					img: img1,
					posx: 0,
					posy: 0			
				},
				
				"dualevaluate": {
					title: "Dual-Evaluative",
					content: "Together, External, and Internal evaluation services will be provided, limiting the amount of outsourcing and cost to your organization.",
					img: img2,
					posx: 50,
					posy: 50,
					color: "#0081e6",
					service: true
				}
		},
		
		edges: {
        		"services":{
          			"dualevaluate":{length:.8},
        		}
		}
      }
	 
	 /*
	  nodes:{"Services":{color:"red", shape:"dot", alpha:1}, 
      
             demos:{color:CLR.branch, shape:"dot", alpha:1}, 
             halfviz:{color:CLR.demo, alpha:0, link:'/halfviz'},
             atlas:{color:CLR.demo, alpha:0, link:'/atlas'},
             echolalia:{color:CLR.demo, alpha:0, link:'/echolalia'},

             docs:{color:CLR.branch, shape:"dot", alpha:1}, 
             reference:{color:CLR.doc, alpha:0, link:'#reference'},
             introduction:{color:CLR.doc, alpha:0, link:'#introduction'},

             code:{color:CLR.branch, shape:"dot", alpha:1},
             github:{color:CLR.code, alpha:0, link:'https://github.com/samizdatco/arbor'},
             ".zip":{color:CLR.code, alpha:0, link:'/js/dist/arbor-v0.92.zip'},
             ".tar.gz":{color:CLR.code, alpha:0, link:'/js/dist/arbor-v0.92.tar.gz'}
			 
            },
      edges:{
        "Services":{
          demos:{length:.8},
          docs:{length:.8},
          code:{length:.8}
        },
        demos:{halfviz:{},
               atlas:{},
               echolalia:{}
        },
        docs:{reference:{},
              introduction:{}
        },
        code:{".zip":{},
              ".tar.gz":{},
              "github":{}
        }
      }
	  
    }*/

    var sys = arbor.ParticleSystem()
    sys.parameters({stiffness:900, repulsion:2000, gravity:true, dt:0.015})
    sys.renderer = Renderer("#sitemap")
    sys.graft(theUI)
  })
})(this.jQuery)