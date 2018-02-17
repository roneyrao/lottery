(function(U, G, B){
  var URL={
    gbPrize:'getChancePrize.do'
    ,gamble:'chance.do'
  };

  for(var i in URL){
    URL[i]='MOCK/'+URL[i]+'.json';
  }

  var App={
    doms:{flowTotal:'#spFlowTotal', flowGottenCtnr:'#spFlowGottenCtnr', flowGotten:'#spFlowGotten', login:'#login', flows:'#ctFlows', ctnr:'#gb' ,prizeCtnr:'#gbPanel', iptBetFlow:'#iptBetFlow', btnCancel:'.btnCancel', shortageDlg:'#shortageDlg', failDlg:'#failDlg', gotDlgFirst:'#gbGotDlgFirst', gotDlg:'#gbGotDlg', spGotFlowFirst:'#spGotFlowFirst', spGotFlow:'#spGotFlow', luckyList:'#exgLucky', luckyListCtnr:'#exgLuckyCtnr', btnRetype:'.btnRetype' ,btnBet:'.btnBet' ,btnSaveCard:'#btnSaveCard' ,gbChip:'#gbChip' ,lkIndex:'.lkIndex'}
    ,minFlow:20 ,fonts:3 ,minRunDuration:1500 ,minRunDurationDelta:500 ,stopInterval:500, evenInterval:60 ,decelerateInterval:0, decelerateDelta:0
    ,clsNoPrize:'none_prize' ,clsFontPrefix:'f', clsFocus:'focused' ,clsHideFlow:'chipNoFlow' ,clsStable:'stable' ,clsStatic:'static'
    ,focusIx:0
    ,totalFlow:null ,captchaTimestamp:null ,prizeBtn:null ,prizeTpl:null ,luckyTpl:null
    ,chips:null//[]
    ,init:function(){
      var doms=this.doms;
      U.initDoms(doms);


      var chl=doms.prizeCtnr.children();
      this.prizeTpl=$(chl[0]);
      this.prizeBtn=$(chl[1]);
      this.luckyTpl=$(doms.luckyList.children()[0]).remove();

      this.prizeTpl.addClass(this.clsFocus);//preload the background image;

      doms.btnBet.click(this.bet.bind(this));
      doms.btnCancel.click(function(){U.hideDlg()});
      doms.btnSaveCard.click(this.saveCard.bind(this));
      var t=this;
      doms.btnRetype.click(function(){
        doms.iptBetFlow.focus();
      });
      // doms.lkIndex.attr('href', U.getWVUrl('index.html?earn=1'));
      doms.lkIndex.attr('href', '#');

      this.resizeHdlr=this.onResize.bind(this);
      this.inputHdlr=this.onInput.bind(this);
      doms.iptBetFlow.on({'input': this.inputHdlr  ,'focus':this.onFocus.bind(this) ,'click':this.onFocus.bind(this)});
      //doms.iptBetFlow.on('keydown', this.onKeyup.bind(this));

      doms.flowTotal.attr('min', this.minFlow);

      this.loadPrize();
    }
    /*
    ,onKeyup:function(evt){
      var str='';
      for(var i in evt){
        if(typeof(evt[i])!='function'){
          str+=i+'='+evt[i]+' ';
        }
      }
      LOGA(str);
      var code=evt.which||evt.keyCode||evt.charCode;
      LOGA(code);
      if(code==8)return true;
      if(evt.ctrlKey || evt. shiftKey || code<48 || code>57){
        U.toast('请输入整数');
        return false;
      }
    }
    */
    ,adjustTop:function(dom){
      var thisTp=dom.offset().top, sTp=document.body.scrollTop, vpHt=U.getVP(true).height;
      LOGA(sTp+' '+vpHt+' '+thisTp);
      if(sTp+vpHt<thisTp || sTp>thisTp){
        var os=thisTp-vpHt/2;
        LOGA(os);
        if(os>0){
          document.body.scrollTop=os;
        }
      }
    }
    ,onFocus:function(){
      if(this.isAdjusting)return;
      var t=this;
      this.isAdjusting=window.setTimeout(function(){
        t.isAdjusting=null;
        t.adjustTop(t.doms.iptBetFlow);
      }, 800);

      if(!this.resizing){
        this.resizing=true;
        G.win.on('resize', this.resizeHdlr);
      }
    }
    ,onResize:function(){
      if(U.getVP().height==U.getVP(true).height){
        if(this.isAdjusting){
          window.clearTimeout(this.isAdjusting);
          this.isAdjusting=null;
        }
        G.body.scrollTop(0);
        this.doms.iptBetFlow.blur();
        G.win.off('resize', this.resizeHdlr);
        this.resizing=false;
      }
    }
    ,onInput:function(){
      var c=this.doms.iptBetFlow.val();
      if(c){
        c=parseInt(c);
        if(c>=this.minFlow){
          this.doms.ctnr.addClass(this.clsStable);
          this.doms.iptBetFlow.off('input', this.inputHdlr);
        }
      }
    }
    /*
    ,onInput:function(){
      var c=this.doms.iptBetFlow.val();
      if(!c){
        this.doms.iptBetFlow.val('');
        U.toast('请输入整数');
        return;
      }
      var code=c.charCodeAt(c.length-1);
      LOGA(c+' '+code);
      if(code<48 || code>57){
        U.toast('请输入整数');
        this.doms.iptBetFlow.val(c.substr(0, c.length-1));
      }else if(!this.isStable){
        c=parseInt(c);
        if(c>=this.minFlow){
          this.isStable=true;
          this.doms.ctnr.addClass(this.clsStable);
  //this.doms.iptBetFlow.off('input', this.inputHdlr);
        }
      }
    }
    */
    ,stop:function(abort){
      window.clearInterval(this.timer);
      this.timer=null;
      if(abort){
        this.chips[this.focusIx].removeClass(this.clsFocus);
        return;
      }
      this.decelerateSteps=this.prize?this.prizes.indexOf(this.prize.score):this.nonePrizeIndex;
      if(this.decelerateSteps==-1)return U.toast('对不起发生异常，请重试');
      //this.decelerateSteps+=(this.chips.length+(this.chips.length-this.focusIx));//finish the current ring plus a whole ring, then go to the target;
      this.decelerateSteps+=(this.chips.length-this.focusIx);//finish the current ring, then go to the target;
      this.decelerateDelta=(this.stopInterval-this.evenInterval)/this.decelerateSteps;
      this.decelerateInterval=this.evenInterval;
      this.decelerate();
    }
    ,decelerate:function(){
      this.decelerateInterval+=this.decelerateDelta;
      this.decelerateSteps--;
      window.setTimeout((function(){
        this.move();
        if(this.decelerateSteps){
          this.decelerate();
        }else{
          window.setTimeout(this.showBetRs.bind(this), 100);
        }
      }).bind(this), this.decelerateInterval);
    }
    ,showBetRs:function(){
      // this.fillFlows(this.gambleResult);
      if(this.prize&&this.prize.score){
        if(this.isFirst){
          this.doms.spGotFlowFirst.html(this.prize.prizeDesc);
          U.showDlg(this.doms.gotDlgFirst);
        }else{
          // this.doms.spGotFlow.html(this.prize.prizeDesc);
          this.doms.spGotFlow.html(this.prize.score+'元代金劵');
          U.showDlg(this.doms.gotDlg);
        }
      }else{
        U.showDlg(this.doms.failDlg);
      }
      if(this.isFirst){
        this.isFirst=false;
        G.body.attr('first', '');
        this.doms.ctnr.removeClass(this.clsHideFlow);
      }
    }
    ,saveCard:function(){
      U.hideDlg();
      var t=this;
      U.get(URL.saveCard, {logId:this.gambleResult.logId, prizeId:this.prize.prizeId}, function(d){
        if(d.ret){
          t.fillFlows(d);
          U.toast('已加入流量卡，可继续博奖');
        }
      });
    }
    ,run:function(){
      if(this.timer)return U.toast('请稍等');
      this.runTime=new Date();
      this.move();
      this.timer=window.setInterval(this.move.bind(this), this.evenInterval);
    }
    ,move:function(){
      this.chips[this.focusIx].removeClass(this.clsFocus);
      this.focusIx++;
      if(this.focusIx==this.chips.length){
        this.focusIx=0;
      }
      this.chips[this.focusIx].addClass(this.clsFocus);
    }
    ,bet:function(){
      if(this.timer||this.decelerateSteps)return;
      if(this.isFirst){
        this.sendBet(0);
      }else{
        var c=this.doms.iptBetFlow.val();
        if(!c){
          U.toast('请输入正确的流量');
        }else if(c<0){
          U.toast('流量不能输入负数');
        }else if(c.indexOf('.')>-1){
          U.toast('请输入正确的流量');
        }else{
          c=parseInt(c);
          if(c<this.minFlow||c>this.totalFlow){
            U.showDlg(this.doms.shortageDlg);
          }else{
            this.sendBet(c);
          }
          return;
        }
        this.doms.iptBetFlow.focus();
      }
    }
    ,sendBet:function(flow){
      this.run();
      var t=this;
      // U.get(URL.gamble, {inactive:B.isInactive, chanceFlow:flow}, this.handleBet.bind(this), function(){

      // emulate random server response
      U.get('MOCK/chance_'+this.prizes[Math.floor(this.prizes.length*Math.random())]+'.do.json', null, this.handleBet.bind(this), function(){
        t.stop(true);
        U.toast('网络异常，请重试');
      });
    }
    ,handleBet:function(d){
      this.gambleResult=d;
      // this.prize=d.prizeInfo;
      this.prize=d;
      var dif=new Date().valueOf()-this.runTime.valueOf();
      if(dif<this.minRunDuration){
        //the start point is variable.
        window.setTimeout(this.stop.bind(this), this.minRunDuration+Math.random()*this.minRunDurationDelta-dif);
      }else{
        this.stop();
      }
    }
    ,loadPrize:function(){
      var t=this;
      U.get(URL.gbPrize, {inactive:B.isInactive}, function(d){
        t.prizeTpl.removeClass(t.clsFocus).remove();//preload the background image;
        t.renderPrize(d);
        G.body.addClass(LEN.CLS.rendered);
      });
    }
    ,fillFlows:function(d){
      var doms=this.doms;
      doms.flowTotal.html(d.userScore);
      doms.flowTotal.attr('total', d.userScore);
      if(d.changeScore){
        doms.flowGotten.html(d.changeScore);
        doms.flowGottenCtnr.show();
      }else{
        doms.flowGottenCtnr.hide();
      }
      this.totalFlow=d.userScore;
    }
    ,renderPrize:function(d){
      var doms=this.doms;

      doms.flows.show();
      this.fillFlows(d);

      if(B.isInactive&&!d.firstChance){
        this.isFirst=true;
        G.body.attr('first', true);
        doms.ctnr.addClass(this.clsHideFlow);
      }

      var d=d.prizeList;
      this.prizes=[];
      if(d&&d.length){
        var fonts=[];
        for(var i=0; i<this.fonts; i++){
          fonts.push(this.clsFontPrefix+i);
        }
        var st=Math.round(Math.random()*(this.fonts-1));
        if(st>0){
          fonts=fonts.concat(fonts.splice(0, st));
        }
        /*
        if(this.fonts>2){
          var cp=fonts.slice(1, this.fonts-1);
          cp.reverse();
          fonts=fonts.concat(cp);
        }
        */

        st=0;
        this.chips=[];
        var c=document.createDocumentFragment();
        for(var i=0, len=d.length; i<len; i++){
          var tpl=this.prizeTpl.clone();
          if(!d[i]){
            this.nonePrizeIndex=i;
            tpl.addClass(this.clsNoPrize);
            tpl.find('.num').html(d[i].prizeDesc);
          }else{
            st=(st+1)%fonts.length;
            tpl.addClass(fonts[st]);
            tpl.find('.num').html(d[i]);
          }
          c.appendChild(tpl[0]);
          this.prizes.push(d[i]);
          this.chips.push(tpl);
        }
        this.doms.prizeCtnr.append(c);
      }
    }
  };

  $(function(){
    App.init(App);
  });
})(LEN.UTIL, LEN.GLOBAL, {});
