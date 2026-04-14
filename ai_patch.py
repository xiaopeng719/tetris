code = open('D:/tetris-game/tetris.js','r',encoding='utf-8').read()

start = code.index('// ── AI Controller')
end   = code.index('// ── HumanController')

NEW_AI = r"""// ── AI Controller ────────────────────────────────────────────────────────────
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

"""

code = code[:start] + NEW_AI + code[end:]
open('D:/tetris-game/tetris.js','w',encoding='utf-8').write(code)
print('AI replaced, len:', len(NEW_AI), 'chars')
