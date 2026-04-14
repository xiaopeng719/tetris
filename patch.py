code = open('D:/tetris-game/tetris.js','r',encoding='utf-8').read()

# ── 1. 新常量 ──────────────────────────────────────────────────────────────────
code = code.replace(
'const GARB=[0,0,1,2,4];',
"""const GARB=[0,0,1,2,4];
const COMBO_ATK=[0,0,1,1,2,2,3,3,4,4,4,5]; // combo段 -> 垃圾行
const TS_ATK={full:[0,2,4,6],mini:[0,0,1,0]};   // T旋消行 -> 垃圾行
const TS_PTS={full:[0,800,1200,1600],mini:[0,200,400,0]}; // T旋得分""",1)

# ── 2. reset() 新增字段 ────────────────────────────────────────────────────────
code = code.replace(
'this._lt=0;this._dacc=0;this._ld=0;this._lm=0;this._og=false;',
'this._lt=0;this._dacc=0;this._ld=0;this._lm=0;this._og=false;\n    this.combo=0;this._lastRot=false;',1)

# ── 3. rotate() 记录最后动作是旋转 ───────────────────────────────────────────
code = code.replace(
'this.cur.r+=dr;this.cur.c+=dc;this.cur.rot=tr;this._rld();return;',
'this.cur.r+=dr;this.cur.c+=dc;this.cur.rot=tr;this._lastRot=true;this._rld();return;',1)

# ── 4. 移动/软降重置旋转标志 ──────────────────────────────────────────────────
code = code.replace(
'moveLeft(){if(this._fits(this.cur,0,-1)){this.cur.c--;this._rld();}}',
'moveLeft(){if(this._fits(this.cur,0,-1)){this.cur.c--;this._lastRot=false;this._rld();}}',1)
code = code.replace(
'moveRight(){if(this._fits(this.cur,0,+1)){this.cur.c++;this._rld();}}',
'moveRight(){if(this._fits(this.cur,0,+1)){this.cur.c++;this._lastRot=false;this._rld();}}',1)
code = code.replace(
'if(this._fits(this.cur,1,0)){this.cur.r++;this._addSc(1);this._dacc=0;return true;}return false;}',
'if(this._fits(this.cur,1,0)){this.cur.r++;this._addSc(1);this._dacc=0;this._lastRot=false;return true;}return false;}',1)

# ── 5. lock() 检测T旋 ─────────────────────────────────────────────────────────
code = code.replace(
'    this.cur=null;this._og=false;this._ld=0;this._lm=0;\n    this._clearLines();',
'    const tspin=this._tspinCheck();\n    this.cur=null;this._og=false;this._ld=0;this._lm=0;this._lastRot=false;\n    this._clearLines(tspin);',1)

print('phase1 ok')
open('D:/tetris-game/tetris.js','w',encoding='utf-8').write(code)
