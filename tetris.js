"use strict";
const COLS=10,ROWS=20,CELL=30,W=300,H=600;
const PIECES={
  I:{color:"#00f5ff",spawnC:3,rots:[[[-1,0],[-1,1],[-1,2],[-1,3]],[[0,2],[1,2],[2,2],[3,2]],[[2,0],[2,1],[2,2],[2,3]],[[0,1],[1,1],[2,1],[3,1]]]},
  O:{color:"#ffd700",spawnC:4,rots:[[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[1,0],[1,1]]]},
  T:{color:"#bf5fff",spawnC:3,rots:[[[-1,1],[0,0],[0,1],[0,2]],[[-1,1],[0,1],[0,2],[1,1]],[[0,0],[0,1],[0,2],[1,1]],[[-1,1],[0,0],[0,1],[1,1]]]},
  S:{color:"#39ff14",spawnC:3,rots:[[[-1,1],[-1,2],[0,0],[0,1]],[[0,1],[1,1],[1,2],[2,2]],[[1,1],[1,2],[2,0],[2,1]],[[0,0],[1,0],[1,1],[2,1]]]},
  Z:{color:"#ff3131",spawnC:3,rots:[[[-1,0],[-1,1],[0,1],[0,2]],[[0,2],[1,1],[1,2],[2,1]],[[1,0],[1,1],[2,1],[2,2]],[[0,1],[1,0],[1,1],[2,0]]]},
  J:{color:"#4169e1",spawnC:3,rots:[[[-1,0],[0,0],[0,1],[0,2]],[[-1,1],[-1,2],[0,1],[1,1]],[[0,0],[0,1],[0,2],[1,2]],[[-1,1],[0,1],[1,0],[1,1]]]},
  L:{color:"#ff8c00",spawnC:3,rots:[[[-1,2],[0,0],[0,1],[0,2]],[[-1,1],[0,1],[1,1],[1,2]],[[0,0],[0,1],[0,2],[1,0]],[[-1,0],[-1,1],[0,1],[1,1]]]}
};
const KEYS=["I","O","T","S","Z","J","L"];
const PTS=[0,100,300,500,800];
const GARB=[0,0,1,2,4];
const COMBO_ATK=[0,0,1,1,2,2,3,3,4,4,4,5]; // combo段 -> 垃圾行
const TS_ATK={full:[0,2,4,6],mini:[0,0,1,0]};   // T旋消行 -> 垃圾行
const TS_PTS={full:[0,800,1200,1600],mini:[0,200,400,0]}; // T旋得分
const KICK={
  g:[[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]]],
  gL:[[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]],[[0,0],[0,1],[1,1],[-2,0],[-2,1]],[[0,0],[0,-1],[-1,-1],[2,0],[2,-1]]],
  I:[[[0,0],[0,-2],[0,1],[-1,-2],[2,1]],[[0,0],[0,-1],[0,2],[2,-1],[-1,2]],[[0,0],[0,2],[0,-1],[1,2],[-2,-1]],[[0,0],[0,1],[0,-2],[-2,1],[1,-2]],[[0,0],[0,2],[0,-1],[1,2],[-2,-1]],[[0,0],[0,-2],[0,1],[-1,-2],[2,1]],[[0,0],[0,1],[0,-2],[-2,1],[1,-2]],[[0,0],[0,-2],[0,1],[-1,-2],[2,1]]],
  IL:[[[0,0],[0,-2],[0,1],[-1,-2],[2,1]],[[0,0],[0,-1],[0,2],[2,-1],[-1,2]],[[0,0],[0,2],[0,-1],[1,2],[-2,-1]],[[0,0],[0,1],[0,-2],[-2,1],[1,-2]],[[0,0],[0,2],[0,-1],[1,2],[-2,-1]],[[0,0],[0,-2],[0,1],[-1,-2],[2,1]],[[0,0],[0,1],[0,-2],[-2,1],[1,-2]],[[0,0],[0,-2],[0,1],[-1,-2],[2,1]]]
};

const ACTIONS=[{id:"left",label:"左移",def:"ArrowLeft",rep:true},{id:"right",label:"右移",def:"ArrowRight",rep:true},
  {id:"softDrop",label:"软降",def:"ArrowDown",rep:true},{id:"hardDrop",label:"硬降",def:"Space",rep:false},
  {id:"rotCW",label:"顺时针旋转",def:"ArrowUp",rep:false},{id:"rotCCW",label:"逆时针旋转",def:"KeyZ",rep:false},
  {id:"hold",label:"保留方块",def:"KeyC",rep:false},{id:"pause",label:"暂停",def:"KeyP",rep:false}];

function codeName(c){
  if(!c)return"—";
  const m={ArrowLeft:"← 左",ArrowRight:"→ 右",ArrowUp:"↑ 上",ArrowDown:"↓ 下",
    Space:"空格",Enter:"Enter",Escape:"Esc",Backspace:"退格",Tab:"Tab",
    ShiftLeft:"LShift",ShiftRight:"RShift",ControlLeft:"LCtrl",ControlRight:"RCtrl"};
  if(m[c])return m[c];
  if(c.startsWith("Key"))return c.slice(3);
  if(c.startsWith("Digit"))return c.slice(5);
  if(c.startsWith("Numpad"))return"N"+c.slice(6);
  return c;
}
function spd(lv){return Math.max(50,1000-(lv-1)*65);}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
class Bag{constructor(){this.q=[];}fill(){this.q.push(...shuffle([...KEYS]));}next(){if(this.q.length<4)this.fill();return this.q.shift();}peek(n){while(this.q.length<n+3)this.fill();return this.q.slice(0,n);}}
const mkB=()=>Array.from({length:ROWS},()=>new Array(COLS).fill(null));
function ge(id){return document.getElementById(id);}
function show(id){ge(id).classList.remove("hidden");}
function hide(id){ge(id).classList.add("hidden");}
function makeGarbageLine(){const ln=new Array(COLS).fill("#444");ln[Math.floor(Math.random()*COLS)]=null;return ln;}
function loadKeyMap(){
  try{const r=JSON.parse(localStorage.getItem("tetris_keys")||"null"),km={};for(const a of ACTIONS)km[a.id]=(r&&r[a.id])||a.def;return km;}
  catch(e){const km={};for(const a of ACTIONS)km[a.id]=a.def;return km;}
}
function saveKeyMap(km){localStorage.setItem("tetris_keys",JSON.stringify(km));}

// ── TetrisBoard: 单个棋盘完整逻辑+渲染 ─────────────────────────────────────
class TetrisBoard{
  constructor(cvs,hcvs,ncvs){
    this.cvs=cvs;this.ctx=cvs.getContext("2d");
    this.hcvs=hcvs;this.hctx=hcvs.getContext("2d");
    this.ncvs=ncvs;this.nctx=ncvs.getContext("2d");
    this.boardEl=null;
    this.onClear=null;this.onDead=null;this.onScore=null;this.onNewPiece=null;
    this.notifEl=null;
    this.reset();
  }
  reset(){
    this.board=mkB();this.bag=new Bag();
    this.score=0;this.level=1;this.lines=0;this.btb=false;
    this.cur=null;this.held=null;this.canH=true;
    this.busy=false;this.dead=false;this.pendingGarbage=0;
    this._lt=0;this._dacc=0;this._ld=0;this._lm=0;this._og=false;
    this.combo=0;this._lastRot=false;
  }
  spawn(key){
    const p=PIECES[key];const r0=(key==="I")?1:0;
    this.cur={key,rot:0,r:r0,c:p.spawnC};
    if(!this.fits(this.cur)){
      this.cur.r--;
      if(!this.fits(this.cur)||PIECES[key].rots[0].every(([cr])=>this.cur.r+cr<0)){
        this.dead=true;if(this.onDead)this.onDead();return;
      }
    }
  }
  spawnNext(){
    this.spawn(this.bag.next());
    this.canH=true;this._dacc=0;this._ld=0;this._lm=0;this._og=false;
    this.drawNext();if(this.onNewPiece)this.onNewPiece();
  }
  fits(p,dr=0,dc=0,rot=p.rot){
    for(const [cr,cc] of PIECES[p.key].rots[rot]){
      const nr=p.r+cr+dr,nc=p.c+cc+dc;
      if(nc<0||nc>=COLS||nr>=ROWS)return false;
      if(nr>=0&&this.board[nr][nc])return false;
    }
    return true;
  }
  moveLeft(){if(this.fits(this.cur,0,-1)){this.cur.c--;this._rld();}}
  moveRight(){if(this.fits(this.cur,0,+1)){this.cur.c++;this._rld();}}
  softDrop(){if(this.fits(this.cur,1,0)){this.cur.r++;this._addSc(1);this._dacc=0;return true;}return false;}
  hardDrop(){let n=0;while(this.fits(this.cur,1,0)){this.cur.r++;n++;}this._addSc(n*2);this.lock();}
  rotate(d){
    const fr=this.cur.rot,tr=((fr+d)+4)%4,isI=this.cur.key==="I";
    const tbl=isI?(d>0?KICK.I[fr]:KICK.IL[fr]):(d>0?KICK.g[fr]:KICK.gL[fr]);
    for(const [dr,dc] of tbl){
      if(this.fits(this.cur,dr,dc,tr)){this.cur.r+=dr;this.cur.c+=dc;this.cur.rot=tr;this._lastRot=true;this._rld();return;}
    }
  }
  ghost(){let r=this.cur.r;while(this.fits({...this.cur,r:r+1}))r++;return r;}

  // ── T旋检测（3角规则） ───────────────────────────────────────────────────
  _tspinCheck(){
    if(!this.cur||this.cur.key!=="T"||!this._lastRot)return null;
    const r=this.cur.r, c=this.cur.c, rot=this.cur.rot;
    // T块轴心始终在 (r, c+1)
    const pr=r, pc=c+1;
    const corners=[
      [pr-1,pc-1],[pr-1,pc+1], // A(0) B(1) 上两角
      [pr+1,pc-1],[pr+1,pc+1]  // C(2) D(3) 下两角
    ];
    const filled=corners.map(([cr,cc])=>
      cc<0||cc>=COLS||cr>=ROWS||(cr>=0&&!!this.board[cr][cc])
    );
    const cnt=filled.filter(Boolean).length;
    if(cnt<3)return null;
    // 正面角（T茎指向方向）
    const front=[[0,1],[1,3],[2,3],[0,2]][rot];
    const frontFilled=front.filter(i=>filled[i]).length;
    return frontFilled===2?"full":"mini";
  }


  // ── 攻击/特殊消除通知 ────────────────────────────────────────────────────
  _showAttack(tspin,lines,perfect,btb,combo){
    if(!this.notifEl)return;
    const rows=[];
    let color="#e0e0e0";
    if(perfect){
      rows.push("PERFECT");rows.push("CLEAR!");color="#ffd700";
    } else if(tspin==="full"){
      if(btb)rows.push("BACK-TO-BACK");
      rows.push("T-SPIN");
      const nm=["ZERO","SINGLE","DOUBLE","TRIPLE"];
      if(lines>0)rows.push(nm[Math.min(lines,3)]);
      color="#bf5fff";
    } else if(tspin==="mini"){
      if(btb)rows.push("B2B");
      rows.push("T-SPIN MINI");
      color="#dd88ff";
    } else if(lines===4){
      if(btb)rows.push("BACK-TO-BACK");
      rows.push("TETRIS!");color="#00f5ff";
    } else if(lines===3){
      rows.push("TRIPLE!");color="#39ff14";
    }
    if(combo>=2) rows.push("COMBO x"+combo);
    if(!rows.length)return;
    if(combo>=2&&!color)color="#ff8c00";
    const el=this.notifEl;
    el.innerHTML=rows.map(function(t){return"<span>"+t+"</span>";}).join("<br>");
    el.style.color=color;
    el.style.textShadow="0 0 20px "+color;
    el.classList.remove("notif-show");
    void el.offsetWidth;
    el.classList.add("notif-show");
  }

  _rld(){if(this._og&&this._lm<15){this._ld=0;this._lm++;}}
  hold(){
    if(!this.canH||!this.cur)return;
    this.canH=false;const prev=this.held;this.held=this.cur.key;
    if(prev)this.spawn(prev);else this.spawnNext();this.drawHold();
  }
  lock(){
    if(!this.cur)return;
    const {key,rot,r}=this.cur;
    const cells=PIECES[key].rots[rot];
    if(cells.some(([cr])=>r+cr<0)){this.dead=true;if(this.onDead)this.onDead();return;}
    for(const [cr,cc] of cells)this.board[r+cr][this.cur.c+cc]=PIECES[key].color;
    const tspin=this._tspinCheck();
    this.cur=null;this._og=false;this._ld=0;this._lm=0;this._lastRot=false;
    this._clearLines(tspin);
  }
  _clearLines(tspin){
    const full=[];
    for(let r=0;r<ROWS;r++)if(this.board[r].every(c=>c!==null))full.push(r);
    const applyAndSpawn=()=>{
      if(this.pendingGarbage>0){
        const n=Math.min(this.pendingGarbage,ROWS-2);this.pendingGarbage=0;
        for(let i=0;i<n;i++){this.board.shift();this.board.push(makeGarbageLine());}
      }
      if(!this.dead)this.spawnNext();
    };
    if(!full.length){
      this.combo=0; // 连击中断
      applyAndSpawn();return;
    }
    const n=full.length;

    // ── 全消判定（清除后棋盘是否空白）─────────────────────────────────────
    const willEmpty=this.board.filter((_,i)=>!full.includes(i)).every(r=>r.every(c=>c===null));

    // ── 得分计算 ──────────────────────────────────────────────────────────
    let pts=0;
    if(tspin==="full") pts=(TS_PTS.full[Math.min(n,3)]||0)*this.level;
    else if(tspin==="mini") pts=(TS_PTS.mini[Math.min(n,2)]||0)*this.level;
    else pts=PTS[Math.min(n,PTS.length-1)]*this.level;

    // 连击加分
    const comboIdx=Math.min(this.combo,COMBO_ATK.length-1);
    pts+=50*this.combo*this.level;
    this.combo++;

    // B2B
    const isBTBworthy=(tspin!==null||n===4||willEmpty);
    let btbBonus=0;
    if(isBTBworthy){if(this.btb)btbBonus=1;this.btb=true;}
    else this.btb=false;
    if(n===4&&!tspin&&btbBonus)pts=Math.floor(pts*1.5);
    if(willEmpty)pts+=3500*this.level;

    this._addSc(pts);
    this.lines+=n;
    this.level=Math.min(15,1+Math.floor(this.lines/10));

    // ── 垃圾行计算 ────────────────────────────────────────────────────────
    let garb=0;
    if(willEmpty) garb=10;
    else if(tspin==="full") garb=(TS_ATK.full[Math.min(n,3)]||0)+btbBonus;
    else if(tspin==="mini") garb=(TS_ATK.mini[Math.min(n,2)]||0)+btbBonus;
    else garb=GARB[Math.min(n,GARB.length-1)]+btbBonus;
    garb+=COMBO_ATK[comboIdx];
    if(garb>0&&this.onClear)this.onClear(garb);

    // ── 通知提示 ──────────────────────────────────────────────────────────
    this._showAttack(tspin,n,willEmpty,btbBonus>0,this.combo-1);

    // ── 消行动画 ──────────────────────────────────────────────────────────
    this.busy=true;
    const el=this.boardEl;
    const divs=el?full.map(row=>{
      const d=document.createElement("div");
      d.className="line-clear-flash";d.style.top=(row*CELL)+"px";d.style.height=CELL+"px";
      el.appendChild(d);return d;
    }):[];
    setTimeout(()=>{
      divs.forEach(d=>d.remove());
      for(let i=full.length-1;i>=0;i--)this.board.splice(full[i],1);
      while(this.board.length<ROWS)this.board.unshift(new Array(COLS).fill(null));
      this.busy=false;if(this.onScore)this.onScore(this.score,this.level,this.lines);
      applyAndSpawn();
    },300);
  }
  addGarbage(n){this.pendingGarbage=Math.min(this.pendingGarbage+n,18);}
  _addSc(n){
    this.score+=n;if(this.onScore)this.onScore(this.score,this.level,this.lines);
  }
  tick(dt){
    if(this.dead||this.busy||!this.cur)return;
    this._dacc+=dt;
    const s=spd(this.level),onG=!this.fits(this.cur,1,0);
    if(onG&&!this._og){this._og=true;this._ld=0;}if(!onG){this._og=false;this._ld=0;}
    if(onG){this._ld+=dt;if(this._ld>=500)this.lock();}
    else{while(this._dacc>=s){this._dacc-=s;if(!this.fits(this.cur,1,0))break;this.cur.r++;}}
  }
  // ── rendering ──
  _cell(ctx,x,y,col,a=1){
    const s=CELL-1;ctx.save();ctx.globalAlpha=a;
    ctx.fillStyle=col;ctx.fillRect(x,y,s,s);
    ctx.fillStyle="rgba(255,255,255,0.2)";ctx.fillRect(x,y,s,3);ctx.fillRect(x,y,3,s);
    ctx.fillStyle="rgba(0,0,0,0.3)";ctx.fillRect(x,y+s-3,s,3);ctx.fillRect(x+s-3,y,3,s);
    ctx.restore();
  }
  draw(){
    const ctx=this.ctx;
    ctx.clearRect(0,0,W,H);ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="rgba(255,255,255,0.04)";ctx.lineWidth=1;
    for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,H);ctx.stroke();}
    for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(W,r*CELL);ctx.stroke();}
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(this.board[r][c])this._cell(ctx,c*CELL,r*CELL,this.board[r][c]);
    if(!this.cur)return;
    const gr=this.ghost();
    for(const [cr,cc] of PIECES[this.cur.key].rots[this.cur.rot]){
      const gy=gr+cr,gx=this.cur.c+cc;
      if(gy>=0)this._cell(ctx,gx*CELL,gy*CELL,PIECES[this.cur.key].color,0.18);
    }
    for(const [cr,cc] of PIECES[this.cur.key].rots[this.cur.rot]){
      const py=this.cur.r+cr,px=this.cur.c+cc;
      if(py>=0)this._cell(ctx,px*CELL,py*CELL,PIECES[this.cur.key].color);
    }
  }
  _mini(ctx,key,sw,sh,a,ox,oy){
    const p=PIECES[key],cells=p.rots[0];
    const rs=cells.map(([r])=>r),cs=cells.map(([,c])=>c);
    const minR=Math.min(...rs),maxR=Math.max(...rs),minC=Math.min(...cs),maxC=Math.max(...cs);
    const pw=maxC-minC+1,ph=maxR-minR+1;
    const cs2=Math.min(20,Math.floor(sw/(pw+1)),Math.floor(sh/(ph+1)));
    const sx=ox+Math.floor((sw-pw*cs2)/2),sy=oy+Math.floor((sh-ph*cs2)/2);
    ctx.save();ctx.globalAlpha=a;
    for(const [cr,cc] of cells){
      const x=sx+(cc-minC)*cs2,y=sy+(cr-minR)*cs2;
      ctx.fillStyle=p.color;ctx.fillRect(x,y,cs2-1,cs2-1);
      ctx.fillStyle="rgba(255,255,255,0.2)";ctx.fillRect(x,y,cs2-1,2);ctx.fillRect(x,y,2,cs2-1);
    }
    ctx.restore();
  }
  drawHold(){
    const ctx=this.hctx,w=this.hcvs.width,h=this.hcvs.height;
    ctx.clearRect(0,0,w,h);ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
    if(this.held)this._mini(ctx,this.held,w,h,this.canH?1:0.4,0,0);
  }
  drawNext(){
    const ctx=this.nctx,w=this.ncvs.width,h=this.ncvs.height;
    ctx.clearRect(0,0,w,h);ctx.fillStyle="#0d0d1a";ctx.fillRect(0,0,w,h);
    const keys=this.bag.peek(3),sh=h/3;
    for(let i=0;i<keys.length;i++)this._mini(ctx,keys[i],w,sh,1,0,i*sh);
  }
}

// ── AI Controller ────────────────────────────────────────────────────────────
// 策略: 2步精确前瞻 + T旋感知 + 留井打Tetris + 深埋洞额外惩罚
class AIController{
  constructor(board){
    this.board=board;
    this.plan=null;this.acc=0;this.delay=50;this.active=false;
    this.board.onNewPiece=()=>this._plan();
  }

  _plan(){
    if(this.board.dead||!this.board.cur)return;
    const peek=this.board.bag.peek(2);
    this.plan=this._best(this.board.board,this.board.cur.key,peek[0],peek[1]);
    this.active=true;this.acc=0;
  }

  update(dt){
    if(!this.active||!this.plan||this.board.dead||this.board.busy||!this.board.cur)return;
    this.acc+=dt;if(this.acc<this.delay)return;this.acc=0;
    const cur=this.board.cur;const {tr,tc}=this.plan;
    if(cur.rot!==tr){
      const d=((tr-cur.rot)+4)%4;
      d<=2?this.board.rotate(1):this.board.rotate(-1);return;
    }
    if(cur.c<tc){this.board.moveRight();return;}
    if(cur.c>tc){this.board.moveLeft();return;}
    this.active=false;this.plan=null;this.board.hardDrop();
  }

  // 2步精确前瞻: 枚举当前块所有落点, 再枚举下一块所有落点
  // 第2步加权0.45; 用第3块做轻量抽样加权0.2
  _best(board,key,nk1,nk2){
    let best=null,bestSc=-Infinity;
    for(let rot=0;rot<4;rot++){
      const cells=PIECES[key].rots[rot];
      const minC=Math.min(...cells.map(([,c])=>c));
      const maxC=Math.max(...cells.map(([,c])=>c));
      for(let col=-minC;col<=COLS-1-maxC;col++){
        const r1=this._sim(board,key,rot,col);if(!r1)continue;
        let sc=this._eval(r1.board,r1.lines,r1.tspin);
        if(nk1){
          let bNext=-Infinity;
          for(let r2=0;r2<4;r2++){
            const c2=PIECES[nk1].rots[r2];
            const mn=Math.min(...c2.map(([,c])=>c)),mx=Math.max(...c2.map(([,c])=>c));
            for(let col2=-mn;col2<=COLS-1-mx;col2++){
              const r2r=this._sim(r1.board,nk1,r2,col2);if(!r2r)continue;
              let s2=this._eval(r2r.board,r2r.lines,r2r.tspin);
              // 第3步: 只采样前几个旋转/列, 不全枚举(控制耗时)
              if(nk2){
                let b3=-Infinity;
                for(let r3=0;r3<4;r3++){
                  const c3=PIECES[nk2].rots[r3];
                  const mn3=Math.min(...c3.map(([,c])=>c)),mx3=Math.max(...c3.map(([,c])=>c));
                  // 仅采样偶数列位置(减少计算量)
                  for(let col3=-mn3;col3<=COLS-1-mx3;col3+=2){
                    const r3r=this._sim(r2r.board,nk2,r3,col3);if(!r3r)continue;
                    const s3=this._eval(r3r.board,r3r.lines,r3r.tspin);
                    if(s3>b3)b3=s3;
                  }
                }
                if(b3>-Infinity)s2+=0.2*b3;
              }
              if(s2>bNext)bNext=s2;
            }
          }
          if(bNext>-Infinity)sc+=0.45*bNext;
        }
        if(sc>bestSc){bestSc=sc;best={tr:rot,tc:col};}
      }
    }
    return best||{tr:0,tc:PIECES[key].spawnC};
  }

  // 模拟落下, 返回 {board, lines, tspin}
  // 棋盘用数字(0/1)加速; board原始值truthy=填充
  _sim(board,key,rot,col){
    const cells=PIECES[key].rots[rot];
    let r=(key==="I")?1:0;
    const ok=(tr)=>{
      for(const [cr,cc] of cells){
        const nr=tr+cr,nc=col+cc;
        if(nc<0||nc>=COLS||nr>=ROWS)return false;
        if(nr>=0&&board[nr][nc])return false;
      }return true;
    };
    if(!ok(r)){r--;if(!ok(r))return null;}
    for(;;){
      let can=true;
      for(const [cr,cc] of cells){
        const nr=r+cr+1,nc=col+cc;
        if(nr>=ROWS||(nr>=0&&board[nr][nc])){can=false;break;}
      }
      if(!can)break;r++;
    }
    if(cells.some(([cr])=>r+cr<0))return null;
    // 复制棋盘并放置方块
    const nb=board.map(row=>row.slice());
    for(const [cr,cc] of cells){const br=r+cr,bc=col+cc;if(br>=0)nb[br][bc]=1;}
    // 放置后立即检测T旋(清行前)
    let tspin=null;
    if(key==="T")tspin=this._tSim(nb,r,col,rot);
    // 消行
    const kept=nb.filter(row=>!row.every(c=>c));
    const lines=ROWS-kept.length;
    while(kept.length<ROWS)kept.unshift(new Array(COLS).fill(0));
    return{board:kept,lines,tspin};
  }

  // 模拟环境下的T旋检测(3角规则)
  _tSim(board,r,col,rot){
    const pr=r,pc=col+1;  // T块轴心固定在col+1
    const corners=[
      [pr-1,pc-1],[pr-1,pc+1],
      [pr+1,pc-1],[pr+1,pc+1]
    ];
    const f=corners.map(([cr,cc])=>
      cc<0||cc>=COLS||cr>=ROWS||(cr>=0&&!!board[cr][cc])
    );
    if(f.filter(Boolean).length<3)return null;
    const front=[[0,1],[1,3],[2,3],[0,2]][rot];
    return front.filter(i=>f[i]).length===2?"full":"mini";
  }

  // 评估函数: 综合洞/高度/凹凸度/T旋/留井/危险区
  _eval(board,lines,tspin){
    // 列高
    const h=new Array(COLS).fill(0);
    for(let c=0;c<COLS;c++)
      for(let r=0;r<ROWS;r++)
        if(board[r][c]){h[c]=ROWS-r;break;}

    const agg=h.reduce((s,v)=>s+v,0);
    const maxH=Math.max(...h);

    // 洞 & 深埋洞惩罚
    let holes=0,buried=0;
    for(let c=0;c<COLS;c++){
      let blk=false;
      for(let r=0;r<ROWS;r++){
        if(board[r][c])blk=true;
        else if(blk){holes++;buried+=h[c];}
      }
    }

    // 凹凸度
    const bump=h.slice(1).reduce((s,v,i)=>s+Math.abs(v-h[i]),0);

    // 危险区(超过14格指数惩罚)
    const danger=maxH>14?Math.pow(maxH-14,2)*1.8:0;

    // 垃圾行价值: T旋使用TS_ATK, 普通使用GARB
    let gv=0;
    if(tspin==="full")gv=TS_ATK.full[Math.min(lines,3)]||0;
    else if(tspin==="mini")gv=TS_ATK.mini[Math.min(lines,2)]||0;
    else gv=GARB[Math.min(lines,GARB.length-1)];

    // 留井奖励: 边缘列明显低于邻列(为I块Tetris准备)
    let well=0;
    for(let c=0;c<COLS;c++){
      const L=c>0?h[c-1]:9999,R=c<COLS-1?h[c+1]:9999;
      const d=Math.min(L,R)-h[c];
      if(d>=2){
        const em=(c===0||c===COLS-1)?1.6:0.7;
        well=Math.max(well,Math.min(d,8)*em);
      }
    }

    // 全消检测
    const perfect=board.every(row=>row.every(c=>!c));
    if(perfect)gv=Math.max(gv,10);

    return -0.52*agg
          +3.8*gv          // T旋/Tetris/全消价值
          -2.4*holes        // 洞惩罚
          -0.07*buried      // 深埋洞额外惩罚
          -0.32*bump        // 凹凸惩罚
          -danger           // 危险高度
          +0.72*well;       // 留井奖励
  }
}

// ── HumanController ──────────────────────────────────────────────────────────
class HumanController{
  constructor(board){
    this.board=board;this._rep={};this.km=loadKeyMap();this._cm={};this._buildCM();
    this._kd=this._onKD.bind(this);this._ku=this._onKU.bind(this);this.active=false;
  }
  _buildCM(){this._cm={};for(const a of ACTIONS)this._cm[this.km[a.id]]=a.id;}
  attach(){this.active=true;document.addEventListener("keydown",this._kd);document.addEventListener("keyup",this._ku);}
  detach(){
    this.active=false;document.removeEventListener("keydown",this._kd);document.removeEventListener("keyup",this._ku);
    for(const k of Object.keys(this._rep)){clearTimeout(this._rep[k]);clearInterval(this._rep[k]);}this._rep={};
  }
  updateKM(km){this.km=km;this._buildCM();}
  _onKD(e){
    if(!this.active)return;
    if(e.code==="Enter"&&window._onEnter){e.preventDefault();window._onEnter();return;}
    if(e.code==="Escape"){e.preventDefault();if(window._onPause)window._onPause();return;}
    const aid=this._cm[e.code];if(!aid)return;
    e.preventDefault();this._do(aid);
    const act=ACTIONS.find(a=>a.id===aid);
    if(act&&act.rep&&!this._rep[e.code]){
      this._rep[e.code]=setTimeout(()=>{this._rep[e.code]=setInterval(()=>this._do(aid),50);},170);
    }
  }
  _onKU(e){
    if(e.code==="Escape"&&window._onPause){window._onPause();return;}
    if(this._rep[e.code]){clearTimeout(this._rep[e.code]);clearInterval(this._rep[e.code]);delete this._rep[e.code];}
  }
  _do(aid){
    const b=this.board;if(b.dead||b.busy||!b.cur)return;
    switch(aid){
      case"left":b.moveLeft();break;case"right":b.moveRight();break;
      case"softDrop":b.softDrop();break;case"hardDrop":b.hardDrop();break;
      case"rotCW":b.rotate(1);break;case"rotCCW":b.rotate(-1);break;
      case"hold":b.hold();break;case"pause":if(window._onPause)window._onPause();break;
    }
  }
}

// ── SingleGame ────────────────────────────────────────────────────────────────
class SingleGame{
  constructor(){
    this.board=new TetrisBoard(ge("s-canvas"),ge("s-hold"),ge("s-next"));
    this.board.boardEl=ge("s-board");
    this.board.notifEl=ge("notif-s");
    this.board.best=+(localStorage.getItem("tetris_best")||0);
    this.board.onScore=(s,lv,ln)=>{
      ge("s-score").textContent=s;ge("s-level").textContent=lv;ge("s-lines").textContent=ln;
      if(s>this.board.best){this.board.best=s;localStorage.setItem("tetris_best",s);}
      ge("s-best").textContent=this.board.best;
    };
    this.board.onDead=()=>this._over();
    this.ctrl=new HumanController(this.board);
    this.state="idle";this._lt=0;
  }
  start(){
    this.board.reset();this.board.best=+(localStorage.getItem("tetris_best")||0);
    this.board.onScore(0,1,0);ge("s-best").textContent=this.board.best;
    this.board.drawHold();this.state="playing";this._lt=0;
    window._onPause=()=>this.pause();window._onEnter=null;
    this.ctrl.attach();this.board.spawnNext();
    requestAnimationFrame(t=>this._loop(t));
  }
  pause(){
    if(this.state==="playing"){this.state="paused";show("pause-screen");this.ctrl.detach();}
    else if(this.state==="paused"){this.state="playing";hide("pause-screen");this._lt=0;this.ctrl.attach();}
  }
  _over(){
    this.state="over";this.ctrl.detach();
    ge("final-score").textContent=this.board.score;ge("final-best").textContent=this.board.best;
    show("gameover-screen");window._onEnter=()=>this.start();
  }
  destroy(){this.ctrl.detach();this.state="over";window._onPause=null;window._onEnter=null;}
  _loop(ts){
    if(this.state==="over")return;
    requestAnimationFrame(t=>this._loop(t));
    if(this.state==="paused"){this.board.draw();return;}
    if(!this._lt)this._lt=ts;
    const dt=Math.min(ts-this._lt,50);this._lt=ts;
    this.board.tick(dt);this.board.draw();
  }
}

// ── BattleGame ────────────────────────────────────────────────────────────────
class BattleGame{
  constructor(){
    this.p1=new TetrisBoard(ge("b-canvas-p1"),ge("b-hold-p1"),ge("b-next-p1"));
    this.p1.boardEl=ge("b-board-p1");
    this.p2=new TetrisBoard(ge("b-canvas-p2"),ge("b-hold-p2"),ge("b-next-p2"));
    this.p2.boardEl=ge("b-board-p2");
    this.ai=new AIController(this.p2);
    this.ctrl=new HumanController(this.p1);
    this.state="idle";this._lt=0;
  }
  _wire(){
    this.p1.onClear=(n)=>{this._sendGarb(this.p2,"gbar-p2",n);this._flashAtk("atk-p1",n);};
    this.p2.onClear=(n)=>{this._sendGarb(this.p1,"gbar-p1",n);this._flashAtk("atk-p2",n);};
    this.p1.onScore=(s,lv,ln)=>{ge("b-score-p1").textContent=s;ge("b-lines-p1").textContent=ln;};
    this.p2.onScore=(s,lv,ln)=>{ge("b-score-p2").textContent=s;ge("b-lines-p2").textContent=ln;};
    this.p1.onDead=()=>this._end("ai");
    this.p2.onDead=()=>this._end("player");
    this.p1.notifEl=ge("notif-p1");
    this.p2.notifEl=ge("notif-p2");
    this.p1.onNewPiece=null;
  }
  start(){
    this.p1.reset();this.p2.reset();this._wire();
    ge("b-score-p1").textContent="0";ge("b-lines-p1").textContent="0";
    ge("b-score-p2").textContent="0";ge("b-lines-p2").textContent="0";
    ge("gbar-p1").innerHTML="";ge("gbar-p2").innerHTML="";
    ge("atk-p1").innerHTML="";ge("atk-p2").innerHTML="";
    this.p1.drawHold();this.p2.drawHold();
    this.state="playing";this._lt=0;
    window._onPause=()=>this.pause();window._onEnter=null;
    this.ctrl.attach();this.p1.spawnNext();this.p2.spawnNext();
    this.p2.onNewPiece=()=>this.ai._plan();
    requestAnimationFrame(t=>this._loop(t));
  }
  pause(){
    if(this.state==="playing"){this.state="paused";show("pause-screen");this.ctrl.detach();}
    else if(this.state==="paused"){this.state="playing";hide("pause-screen");this._lt=0;this.ctrl.attach();}
  }
  _sendGarb(target,barId,n){target.addGarbage(n);this._updateBar(barId,target.pendingGarbage);}
  _updateBar(id,n){
    const bar=ge(id);
    bar.innerHTML="";
    if(n<=0)return;
    // 颜色分级: 绿<4 黄4-7 橙8-11 红12+
    const col=n>=12?"#ff3131":n>=8?"#ff8c00":n>=4?"#ffd700":"#39ff14";
    const bgCol=n>=12?"rgba(255,49,49,0.18)":n>=8?"rgba(255,140,0,0.18)":n>=4?"rgba(255,215,0,0.18)":"rgba(57,255,20,0.18)";
    // 数字标签
    const num=document.createElement("div");
    num.className="garb-num";
    num.textContent=n;
    num.style.color=col;
    num.style.background=bgCol;
    bar.appendChild(num);
    // 每格 = 1 行垃圾，固定高度
    const show=Math.min(n,18);
    const bh=Math.min(28,Math.floor(570/show)-2);
    for(let i=0;i<show;i++){
      const d=document.createElement("div");
      d.className="garbage-block";
      d.style.height=bh+"px";
      d.style.background=col;
      bar.appendChild(d);
    }
  }
  _flashAtk(id,n){
    const col=ge(id);col.innerHTML="";
    for(let i=0;i<n;i++){const d=document.createElement("div");d.className="atk-block";col.appendChild(d);}
    setTimeout(()=>{if(col)col.innerHTML="";},800);
  }
  _end(winner){
    if(this.state==="over")return;
    this.state="over";this.ctrl.detach();
    const title=ge("result-title");
    if(winner==="player"){title.textContent="&#127881; 胜利!";title.className="win";}
    else{title.textContent="&#128128; 失败!";title.className="lose";}
    ge("result-stats").innerHTML=
      "<div class='sd-row'><span>你的得分</span><span>"+this.p1.score+"</span></div>"+
      "<div class='sd-row'><span>AI 得分</span><span>"+this.p2.score+"</span></div>";
    show("result-screen");window._onPause=null;
  }
  destroy(){this.ctrl.detach();this.state="over";window._onPause=null;window._onEnter=null;}
  _loop(ts){
    if(this.state==="over")return;
    requestAnimationFrame(t=>this._loop(t));
    if(this.state==="paused"){this.p1.draw();this.p2.draw();return;}
    if(!this._lt)this._lt=ts;
    const dt=Math.min(ts-this._lt,50);this._lt=ts;
    this.p1.tick(dt);this.p2.tick(dt);this.ai.update(dt);
    this._updateBar("gbar-p1",this.p1.pendingGarbage);
    this._updateBar("gbar-p2",this.p2.pendingGarbage);
    this.p1.draw();this.p2.draw();
  }
}

// ── Settings UI ──────────────────────────────────────────────────────────────
let _inSettings=false,_capturing=null;
const _capFn=(e)=>{
  e.preventDefault();e.stopPropagation();
  if(e.code==="Escape"){_cancelCapture();return;}
  const aid=_capturing;const oldCode=_km[aid];
  const conflict=ACTIONS.find(a=>a.id!==aid&&_km[a.id]===e.code);
  if(conflict){
    _km[conflict.id]=oldCode;
    const ck=ge("kb-k-"+conflict.id);
    if(ck){ck.textContent=codeName(oldCode);ck.classList.add("conflict");setTimeout(()=>ck.classList.remove("conflict"),600);}
  }
  _km[aid]=e.code;saveKeyMap(_km);_buildCMAll();
  const ks=ge("kb-k-"+aid);if(ks)ks.textContent=codeName(e.code);
  _cancelCapture();
};
let _km=loadKeyMap();
function _buildCMAll(){if(window._currentGame&&window._currentGame.ctrl)window._currentGame.ctrl.updateKM(_km);}
function _openSettings(){
  if(window._currentGame&&window._currentGame.state==="playing")window._currentGame.pause();
  _inSettings=true;_buildSettingsUI();show("keybind-screen");
}
function _closeSettings(){_cancelCapture();_inSettings=false;hide("keybind-screen");_buildCMAll();}
function _buildSettingsUI(){
  const list=ge("kb-list");list.innerHTML="";
  for(const act of ACTIONS){
    const code=_km[act.id]||act.def;
    const row=document.createElement("div");row.className="kb-row";
    const lbl=document.createElement("span");lbl.className="kb-label";lbl.textContent=act.label;
    const key=document.createElement("span");key.className="kb-key";key.id="kb-k-"+act.id;key.textContent=codeName(code);
    const btn=document.createElement("button");btn.className="kb-edit";btn.id="kb-b-"+act.id;btn.textContent="修改";
    btn.addEventListener("click",()=>_startCapture(act.id));
    row.appendChild(lbl);row.appendChild(key);row.appendChild(btn);list.appendChild(row);
  }
  const nr=ge("kb-reset").cloneNode(true);ge("kb-reset").parentNode.replaceChild(nr,ge("kb-reset"));
  const nd=ge("kb-done").cloneNode(true);ge("kb-done").parentNode.replaceChild(nd,ge("kb-done"));
  ge("kb-reset").addEventListener("click",()=>{const km={};for(const a of ACTIONS)km[a.id]=a.def;_km=km;saveKeyMap(_km);_buildSettingsUI();});
  ge("kb-done").addEventListener("click",_closeSettings);
}
function _startCapture(aid){
  _cancelCapture();_capturing=aid;
  const btn=ge("kb-b-"+aid);if(btn){btn.textContent="请按键...";btn.classList.add("listening");}
  document.addEventListener("keydown",_capFn,true);
}
function _cancelCapture(){
  if(_capturing){const btn=ge("kb-b-"+_capturing);if(btn){btn.textContent="修改";btn.classList.remove("listening");}}
  document.removeEventListener("keydown",_capFn,true);_capturing=null;
}

// ── App Init ─────────────────────────────────────────────────────────────────
window._currentGame=null;
function startSingle(){
  if(window._currentGame)window._currentGame.destroy();
  hide("start-screen");show("single-wrapper");hide("battle-wrapper");
  hide("gameover-screen");hide("pause-screen");hide("result-screen");
  window._currentGame=new SingleGame();window._currentGame.start();
}
function startBattle(){
  if(window._currentGame)window._currentGame.destroy();
  hide("start-screen");hide("single-wrapper");show("battle-wrapper");
  hide("result-screen");hide("pause-screen");
  window._currentGame=new BattleGame();window._currentGame.start();
}
function goMenu(){
  if(window._currentGame){window._currentGame.destroy();window._currentGame=null;}
  hide("single-wrapper");hide("battle-wrapper");
  hide("gameover-screen");hide("result-screen");hide("pause-screen");
  show("start-screen");
  ge("start-best").textContent=localStorage.getItem("tetris_best")||"0";
}
window.addEventListener("DOMContentLoaded",()=>{
  ge("btn-single").addEventListener("click",startSingle);
  ge("btn-battle").addEventListener("click",startBattle);
  ge("settings-btn").addEventListener("click",_openSettings);
  ge("pause-menu-btn").addEventListener("click",()=>{hide("pause-screen");goMenu();});
  ge("go-retry").addEventListener("click",startSingle);
  ge("go-menu").addEventListener("click",goMenu);
  ge("result-retry").addEventListener("click",startBattle);
  ge("result-menu").addEventListener("click",goMenu);
  ge("start-best").textContent=localStorage.getItem("tetris_best")||"0";
  // Mobile buttons
  const mob={"btn-left":"left","btn-right":"right","btn-down":"softDrop",
              "btn-drop":"hardDrop","btn-cw":"rotCW","btn-ccw":"rotCCW","btn-hold":"hold"};
  for(const [id,aid] of Object.entries(mob)){
    const el=ge(id);if(!el)continue;
    el.addEventListener("touchstart",e=>{
      e.preventDefault();
      if(window._currentGame&&window._currentGame.ctrl)window._currentGame.ctrl._do(aid);
    },{passive:false});
    el.addEventListener("mousedown",e=>{
      e.preventDefault();
      if(window._currentGame&&window._currentGame.ctrl)window._currentGame.ctrl._do(aid);
    });
  }
  // Global Enter key
  document.addEventListener("keydown",e=>{
    if(e.code==="Enter"&&window._onEnter){e.preventDefault();window._onEnter();}
  });
});
