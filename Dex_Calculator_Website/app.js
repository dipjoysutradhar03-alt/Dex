// Dex app.js — no external deps
(function(){
  const $ = (sel, ctx=document)=>ctx.querySelector(sel);
  const $$ = (sel, ctx=document)=>Array.from(ctx.querySelectorAll(sel));

  // Theme
  const themeBtn = $('#themeToggle');
  const savedTheme = localStorage.getItem('dex-theme');
  if(savedTheme==='light') document.body.classList.add('light');
  themeBtn.addEventListener('click', ()=>{
    document.body.classList.toggle('light');
    localStorage.setItem('dex-theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });

  // Tabs
  $$('.tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      $$('.tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      $$('.panel').forEach(p=>p.classList.remove('active'));
      const target = tab.getAttribute('data-target');
      $(target).classList.add('active');
    });
  });

  // State
  let degMode = (localStorage.getItem('dex-deg') ?? 'deg') === 'deg' ? 'deg' : 'rad';
  let memory = parseFloat(localStorage.getItem('dex-mem') ?? '0') || 0;
  let history = JSON.parse(localStorage.getItem('dex-history') || '[]');
  const exprInput = $('#expr');
  const resultOut = $('#result');
  const memValue = $('#memValue');
  const degBtn = $('[data-fn="toggleDegRad"]');
  const historyList = $('#historyList');

  const setMem = (v)=>{
    memory = v;
    memValue.textContent = 'M: ' + fmt(memory);
    localStorage.setItem('dex-mem', String(memory));
  };
  setMem(memory);

  const setDegMode = (mode)=>{
    degMode = mode;
    degBtn.textContent = mode === 'deg' ? 'deg' : 'rad';
    localStorage.setItem('dex-deg', mode);
  };
  setDegMode(degMode);

  function fmt(n){
    if (!isFinite(n)) return String(n);
    // Smart formatting
    const abs = Math.abs(n);
    if (abs !== 0 && (abs < 1e-6 || abs >= 1e9)) return n.toExponential(10).replace(/(?:\.0+|0+)e/,'e').replace(/e\+?/, 'e');
    let s = n.toFixed(12).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
    return s;
  }

  // Expression parser (shunting-yard) + evaluator with functions
  const ops = {
    '+': {p:1, a:'L', f:(a,b)=>a+b},
    '-': {p:1, a:'L', f:(a,b)=>a-b},
    '*': {p:2, a:'L', f:(a,b)=>a*b},
    '/': {p:2, a:'L', f:(a,b)=>a/b},
    '^': {p:3, a:'R', f:(a,b)=>Math.pow(a,b)},
  };
  const funcs = {
    'sin': (x)=> Math.sin(degMode==='deg' ? x*Math.PI/180 : x),
    'cos': (x)=> Math.cos(degMode==='deg' ? x*Math.PI/180 : x),
    'tan': (x)=> Math.tan(degMode==='deg' ? x*Math.PI/180 : x),
    'asin': (x)=> (degMode==='deg' ? (Math.asin(x)*180/Math.PI) : Math.asin(x)),
    'acos': (x)=> (degMode==='deg' ? (Math.acos(x)*180/Math.PI) : Math.acos(x)),
    'atan': (x)=> (degMode==='deg' ? (Math.atan(x)*180/Math.PI) : Math.atan(x)),
    'ln': (x)=> Math.log(x),
    'log': (x)=> Math.log10(x),
    '√': (x)=> Math.sqrt(x),
    'sqrt': (x)=> Math.sqrt(x),
    'abs': (x)=> Math.abs(x),
    'fact': (n)=> {
      n = Math.floor(n);
      if(n<0) return NaN;
      let r=1; for(let i=2;i<=n;i++) r*=i; return r;
    },
  };

  function tokenize(s){
    s = s.replace(/\s+/g,'');
    s = s.replace(/π/g, 'pi').replace(/°/g,'deg'); // support 30° via 30*deg
    const tokens = [];
    let i=0;
    while(i<s.length){
      const ch = s[i];
      if(/[0-9.]/.test(ch)){
        let j=i+1; while(j<s.length && /[0-9.]/.test(s[j])) j++;
        tokens.push({t:'num', v: parseFloat(s.slice(i,j))});
        i=j; continue;
      }
      if(/[a-zA-Z_]/.test(ch)){
        let j=i+1; while(j<s.length && /[a-zA-Z0-9_]/.test(s[j])) j++;
        const word = s.slice(i,j);
        tokens.push({t:'id', v: word});
        i=j; continue;
      }
      if(ch==='('||ch===')'){ tokens.push({t:ch}); i++; continue; }
      if(ch==='+'||ch==='-'||ch==='*'||ch==='/'||ch==='^'||ch==='%'){ tokens.push({t:'op', v: ch}); i++; continue; }
      throw new Error('Unexpected character: ' + ch);
    }
    return tokens;
  }

  function toRPN(tokens){
    const out=[], st=[];
    for(let i=0;i<tokens.length;i++){
      const tok = tokens[i];
      if(tok.t==='num') out.push(tok);
      else if(tok.t==='id'){
        // constants or functions
        if(tok.v==='pi') out.push({t:'num', v: Math.PI});
        else if(tok.v==='e') out.push({t:'num', v: Math.E});
        else if(tok.v==='deg') out.push({t:'num', v: (degMode==='deg'?1:Math.PI/180)}); // 30*deg equals 30 degrees when in deg mode; in rad, converts to rad
        else st.push({t:'func', v: tok.v});
      } else if(tok.t==='op'){
        if(tok.v==='%'){
          // Postfix percent: convert previous number to /100
          out.push({t:'op', v: '%'});
        } else {
          while(st.length){
            const top = st[st.length-1];
            if(top.t==='op'){
              const o1 = ops[tok.v], o2 = ops[top.v];
              if((o1.a==='L' && o1.p<=o2.p) || (o1.a==='R' && o1.p<o2.p)){
                out.push(st.pop()); continue;
              }
            }
            break;
          }
          st.push({t:'op', v: tok.v});
        }
      } else if(tok.t==='('){
        st.push(tok);
      } else if(tok.t===')'){
        while(st.length && st[st.length-1].t!=='(') out.push(st.pop());
        if(!st.length) throw new Error('Mismatched parentheses');
        st.pop(); // remove '('
        // If a function on stack, pop it
        if(st.length && st[st.length-1].t==='func') out.push(st.pop());
      }
    }
    while(st.length){
      const x = st.pop();
      if(x.t==='(') throw new Error('Mismatched parentheses');
      out.push(x);
    }
    return out;
  }

  function evalRPN(rpn){
    const st=[];
    for(const tok of rpn){
      if(tok.t==='num') st.push(tok.v);
      else if(tok.t==='op'){
        if(tok.v==='%'){
          const a = st.pop();
          st.push(a/100);
        } else {
          const b = st.pop(), a = st.pop();
          st.push(ops[tok.v].f(a,b));
        }
      } else if(tok.t==='func'){
        const a = st.pop();
        const f = funcs[tok.v];
        if(!f) throw new Error('Unknown function: ' + tok.v);
        st.push(f(a));
      }
    }
    if(st.length!==1) throw new Error('Invalid expression');
    return st[0];
  }

  function evaluate(expr){
    const tokens = tokenize(expr);
    // handle unary minus by inserting 0 before leading '-' or '(-'
    for(let i=0;i<tokens.length;i++){
      const t = tokens[i];
      if(t.t==='op' && t.v==='-'){
        const prev = tokens[i-1];
        if(i===0 || (prev && (prev.t==='op' || prev.t==='('))){
          tokens.splice(i,0,{t:'num', v:0}); i++;
        }
      }
    }
    const rpn = toRPN(tokens);
    let v = evalRPN(rpn);
    if(Number.isNaN(v)) throw new Error('Result is not a number');
    return v;
  }

  function addToHistory(expr, value){
    const item = { expr, value, ts: Date.now() };
    history.unshift(item);
    if(history.length>200) history.pop();
    localStorage.setItem('dex-history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory(){
    historyList.innerHTML = '';
    for(const h of history){
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.innerHTML = `<code>${escapeHtml(h.expr)}</code>`;
      const right = document.createElement('div');
      right.textContent = fmt(h.value);
      li.appendChild(left); li.appendChild(right);
      li.addEventListener('click', ()=>{
        exprInput.value = h.expr;
        resultOut.textContent = fmt(h.value);
        exprInput.focus();
      });
      historyList.appendChild(li);
    }
  }
  function escapeHtml(s){return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  renderHistory();

  // Keypad
  $$('.keypad [data-insert]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const ins = btn.getAttribute('data-insert');
      insertAtCursor(exprInput, ins);
      exprInput.dispatchEvent(new Event('input'));
      exprInput.focus();
    });
  });
  $('[data-fn="clear"]').addEventListener('click', ()=>{ exprInput.value=''; resultOut.textContent='0'; exprInput.focus(); });
  $('[data-fn="back"]').addEventListener('click', ()=>{
    const s = exprInput.value; exprInput.value = s.slice(0, Math.max(0, exprInput.selectionStart-1)) + s.slice(exprInput.selectionEnd);
    exprInput.dispatchEvent(new Event('input'));
    exprInput.focus();
  });
  $('[data-fn="equals"]').addEventListener('click', ()=> compute());
  $('[data-fn="toggleDegRad"]').addEventListener('click', ()=> setDegMode(degMode==='deg'?'rad':'deg'));

  exprInput.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){ e.preventDefault(); compute(); }
    if(e.key==='ArrowUp'){ if(history[0]){ exprInput.value = history[0].expr; exprInput.setSelectionRange(exprInput.value.length, exprInput.value.length);} }
    if(e.key==='ArrowDown'){ if(history[1]){ exprInput.value = history[1].expr; exprInput.setSelectionRange(exprInput.value.length, exprInput.value.length);} }
  });
  exprInput.addEventListener('input', ()=>{
    try{
      const v = evaluate(exprInput.value);
      resultOut.textContent = fmt(v);
    }catch(err){
      resultOut.textContent = '…';
    }
  });

  function compute(){
    const expr = exprInput.value.trim();
    if(!expr){ resultOut.textContent='0'; return; }
    try{
      const v = evaluate(expr);
      resultOut.textContent = fmt(v);
      addToHistory(expr, v);
    }catch(err){
      resultOut.textContent = 'Error';
      console.error(err);
    }
  }

  function insertAtCursor(el, text){
    const start = el.selectionStart, end = el.selectionEnd;
    el.value = el.value.slice(0,start) + text + el.value.slice(end);
    const pos = start + text.length;
    el.setSelectionRange(pos,pos);
  }

  // History actions
  $('#clearHistory').addEventListener('click', ()=>{
    history = [];
    localStorage.removeItem('dex-history');
    renderHistory();
  });
  $('#exportHistory').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(history, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dex-history.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // Memory buttons
  $$('.mem-buttons button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const op = b.getAttribute('data-mem');
      if(op==='mc') setMem(0);
      else if(op==='mr') insertAtCursor(exprInput, String(memory));
      else if(op==='mplus') setMem(memory + parseFloat(resultOut.textContent || '0'));
      else if(op==='mminus') setMem(memory - parseFloat(resultOut.textContent || '0'));
    });
  });

  // Converter
  const conv = {
    length: {
      m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254
    },
    mass: {
      kg: 1, g: 0.001, mg: 1e-6, lb: 0.45359237, oz: 0.028349523125, t: 1000
    },
    area: {
      'm²':1, 'km²':1e6, 'cm²':1e-4, 'mm²':1e-6, 'ft²':0.09290304, 'in²':0.00064516, 'acre':4046.8564224, 'ha':10000
    },
    volume: {
      'm³':1, 'L':0.001, 'mL':1e-6, 'ft³':0.028316846592, 'in³':0.000016387064, 'gal(US)':0.003785411784, 'qt(US)':0.000946352946
    },
    time: {
      s:1, ms:1e-3, min:60, h:3600, day:86400, week:604800
    },
    temperature: {
      // handled specially
    }
  };
  const convCategory = $('#convCategory');
  const convFrom = $('#convFrom');
  const convTo = $('#convTo');
  const convValue = $('#convValue');
  const convResult = $('#convResult');

  function fillUnits(cat){
    convFrom.innerHTML=''; convTo.innerHTML='';
    let units = [];
    if(cat==='length') units = Object.keys(conv.length);
    if(cat==='mass') units = Object.keys(conv.mass);
    if(cat==='area') units = Object.keys(conv.area);
    if(cat==='volume') units = Object.keys(conv.volume);
    if(cat==='time') units = Object.keys(conv.time);
    if(cat==='temperature') units = ['°C','°F','K'];
    for(const u of units){
      const o1 = document.createElement('option'); o1.value=u; o1.textContent=u; convFrom.appendChild(o1);
      const o2 = document.createElement('option'); o2.value=u; o2.textContent=u; convTo.appendChild(o2);
    }
    convFrom.selectedIndex=0; convTo.selectedIndex=1;
    updateConv();
  }
  convCategory.addEventListener('change', ()=>fillUnits(convCategory.value));
  convFrom.addEventListener('change', updateConv);
  convTo.addEventListener('change', updateConv);
  convValue.addEventListener('input', updateConv);

  function updateConv(){
    const cat = convCategory.value, from = convFrom.value, to = convTo.value;
    const val = parseFloat(convValue.value||'0');
    let res = 0;
    if(cat==='temperature'){
      res = convertTemp(val, from, to);
    } else {
      const map = conv[cat];
      res = val * map[from] / map[to];
    }
    convResult.textContent = fmt(res);
  }
  function convertTemp(v, from, to){
    // Convert to K then to target
    let k;
    if(from==='°C') k = v + 273.15;
    else if(from==='°F') k = (v - 32) * 5/9 + 273.15;
    else k = v; // K
    if(to==='°C') return k - 273.15;
    if(to==='°F') return (k - 273.15)*9/5 + 32;
    return k;
  }
  fillUnits('length');

  // Programmer
  const progInput = $('#progInput'), binOut = $('#binOut'), octOut=$('#octOut'), decOut=$('#decOut'), hexOut=$('#hexOut');
  progInput.addEventListener('input', ()=>{
    const s = progInput.value.trim();
    if(!s){ binOut.textContent=octOut.textContent=decOut.textContent=hexOut.textContent=''; return; }
    const n = Number(s);
    if(!Number.isFinite(n)){ binOut.textContent='Invalid'; return; }
    const asInt = Math.trunc(n);
    binOut.textContent = (asInt>>>0).toString(2);
    octOut.textContent = (asInt>>>0).toString(8);
    decOut.textContent = String(asInt>>>0);
    hexOut.textContent = (asInt>>>0).toString(16).toUpperCase();
  });

  $('#bitGo').addEventListener('click', ()=>{
    const A = parseInt($('#bitA').value,10);
    const B = parseInt($('#bitB').value,10);
    const op = $('#bitOp').value;
    if(Number.isNaN(A) || (Number.isNaN(B) && op!=='NOT')){ $('#bitResult').textContent='Enter valid integers'; return; }
    let r;
    switch(op){
      case 'AND': r = (A & B); break;
      case 'OR': r = (A | B); break;
      case 'XOR': r = (A ^ B); break;
      case 'SHL': r = (A << B); break;
      case 'SHR': r = (A >>> B); break;
      default: r = 0;
    }
    $('#bitResult').textContent = `DEC ${r} | HEX ${r.toString(16).toUpperCase()} | BIN ${(r>>>0).toString(2)}`;
  });

  // Finance
  function toNum(id){ return parseFloat($(id).value||'0'); }
  $('#siGo').addEventListener('click', ()=>{
    const P=toNum('#siP'), R=toNum('#siR')/100, T=toNum('#siT');
    const I = P*R*T, A = P+I;
    $('#siOut').textContent = `Interest: ${fmt(I)} | Amount: ${fmt(A)}`;
  });
  $('#ciGo').addEventListener('click', ()=>{
    const P=toNum('#ciP'), R=toNum('#ciR')/100, N=toNum('#ciN')||1, T=toNum('#ciT');
    const A = P*Math.pow(1+R/N, N*T);
    const I = A-P;
    $('#ciOut').textContent = `Interest: ${fmt(I)} | Amount: ${fmt(A)}`;
  });
  $('#emiGo').addEventListener('click', ()=>{
    const P=toNum('#emiP'), r=(toNum('#emiR')/100)/12, n=Math.round(toNum('#emiT')*12);
    if(r===0){ const emi=P/n; $('#emiOut').textContent=`EMI: ${fmt(emi)}`; return; }
    const emi = (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    $('#emiOut').textContent = `EMI: ${fmt(emi)}`;
  });

  // History persistence on load
  window.addEventListener('load', ()=>{ $('#year').textContent = new Date().getFullYear(); });

})();