code = open('D:/tetris-game/tetris.js','r',encoding='utf-8').read()

# ── 7. 在 _rld() 前插入 T旋检测 + 攻击通知 ───────────────────────────────────
INSERT = """
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
    let text="",color="#e0e0e0";
    if(perfect){
      text="PERFECT\nCLEAR!";color="#ffd700";
    } else if(tspin==="full"){
      const names=["","SINGLE","DOUBLE","TRIPLE"];
      text=(btb?"B2B ":"")+"T-SPIN\n"+(names[Math.min(lines,3)]||"");
      color="#bf5fff";
    } else if(tspin==="mini"){
      text=(btb?"B2B ":"")+"T-SPIN\nMINI";color="#dd88ff";
    } else if(lines===4){
      text=(btb?"BACK-TO-BACK\n":"")+"TETRIS!";color="#00f5ff";
    } else if(lines===3){
      text="TRIPLE!";color="#39ff14";
    }
    if(combo>=2){
      const comboLine="COMBO x"+combo;
      text=text?text+"\n"+comboLine:comboLine;
      if(!color||color==="#e0e0e0")color="#ff8c00";
    }
    if(!text)return;
    const el=this.notifEl;
    el.innerHTML=text.split("\n").map(t=>"<span>"+t+"</span>").join("<br>");
    el.style.color=color;
    el.style.textShadow="0 0 20px "+color;
    el.classList.remove("notif-show");
    void el.offsetWidth;
    el.classList.add("notif-show");
  }

"""

# 插入在 _rld() 方法前
code = code.replace(
  '  _rld(){if(this._og&&this._lm<15){this._ld=0;this._lm++;}}',
  INSERT + '  _rld(){if(this._og&&this._lm<15){this._ld=0;this._lm++;}}',
  1)

# ── 8. constructor 加 notifEl=null ─────────────────────────────────────────
code = code.replace(
  'this.onClear=null;this.onDead=null;this.onScore=null;this.onNewPiece=null;',
  'this.onClear=null;this.onDead=null;this.onScore=null;this.onNewPiece=null;\n    this.notifEl=null;',
  1)

open('D:/tetris-game/tetris.js','w',encoding='utf-8').write(code)
print('phase3 ok')
