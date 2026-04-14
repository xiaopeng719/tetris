code = open('D:/tetris-game/tetris.js','r',encoding='utf-8').read()

# ── 6. 替换 _clearLines 为完整版（支持T旋/连击/全消） ───────────────────────
OLD = """  _clearLines(){
    const full=[];
    for(let r=0;r<ROWS;r++)if(this.board[r].every(c=>c!==null))full.push(r);
    const applyAndSpawn=()=>{
      if(this.pendingGarbage>0){
        const n=Math.min(this.pendingGarbage,ROWS-2);this.pendingGarbage=0;
        for(let i=0;i<n;i++){this.board.shift();this.board.push(makeGarbageLine());}
      }
      if(!this.dead)this.spawnNext();
    };
    if(!full.length){applyAndSpawn();return;}
    const n=full.length;
    let pts=PTS[n]*this.level;
    if(n===4){if(this.btb)pts=Math.floor(pts*1.5);this.btb=true;}else this.btb=false;
    this._addSc(pts);this.lines+=n;this.level=Math.min(15,1+Math.floor(this.lines/10));
    const garb=GARB[Math.min(n,GARB.length-1)]+(n===4&&this.btb?1:0);
    if(garb>0&&this.onClear)this.onClear(garb);
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
  }"""

NEW = """  _clearLines(tspin){
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
  }"""

assert OLD in code, "clearLines pattern not found!"
code = code.replace(OLD, NEW, 1)
open('D:/tetris-game/tetris.js','w',encoding='utf-8').write(code)
print('phase2 ok')
