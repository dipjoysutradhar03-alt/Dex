<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dex — Perfect Calculation Expert</title>
  <meta name="description" content="Dex is a fast, accurate, and elegant calculator suite for standard, scientific, programmer, and unit conversions.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230a0a0a'/><text x='50' y='62' font-size='56' text-anchor='middle' fill='white' font-family='Arial, Helvetica, sans-serif'>D</text></svg>">
  <link rel="preconnect" href=""/>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="shell">
    <div class="brand">
      <div class="logo">D</div>
      <div class="titles">
        <h1>Dex</h1>
        <p class="tagline">perfect calculation expert</p>
      </div>
    </div>
    <div class="actions">
      <button id="themeToggle" title="Toggle theme">🌗</button>
      <a class="btn" href="LICENSE.txt" target="_blank" title="MIT License">License</a>
      <a class="btn" href="README.md" target="_blank" title="Docs">Docs</a>
    </div>
  </header>

  <main class="shell grid">
    <aside class="panel">
      <nav class="tabs" role="tablist" aria-label="Dex modes">
        <button class="tab active" data-target="#calc">Calculator</button>
        <button class="tab" data-target="#convert">Converter</button>
        <button class="tab" data-target="#programmer">Programmer</button>
        <button class="tab" data-target="#finance">Finance</button>
        <button class="tab" data-target="#about">About</button>
      </nav>

      <section id="history" class="history">
        <div class="history-head">
          <h3>History</h3>
          <div class="history-actions">
            <button id="exportHistory" title="Export history">↗</button>
            <button id="clearHistory" title="Clear history">✖</button>
          </div>
        </div>
        <ol id="historyList" aria-live="polite"></ol>
      </section>

      <section class="memory">
        <h3>Memory</h3>
        <div class="mem-buttons">
          <button data-mem="mc">MC</button>
          <button data-mem="mr">MR</button>
          <button data-mem="mplus">M+</button>
          <button data-mem="mminus">M-</button>
        </div>
        <div id="memValue" class="mem-value">M: 0</div>
      </section>
    </aside>

    <section id="calc" class="panel active" role="tabpanel" aria-labelledby="Calculator">
      <div class="display">
        <input id="expr" aria-label="Expression" spellcheck="false" autocomplete="off" placeholder="Type or tap — try: sin(30°) + 2^10 / 5" />
        <output id="result" aria-live="polite">0</output>
      </div>

      <div class="keypad">
        <div class="row">
          <button data-fn="clear">AC</button>
          <button data-fn="back">⌫</button>
          <button data-insert="(">(</button>
          <button data-insert=")">)</button>
        </div>
        <div class="row">
          <button data-insert="sin(">sin</button>
          <button data-insert="cos(">cos</button>
          <button data-insert="tan(">tan</button>
          <button data-insert="√(">√</button>
        </div>
        <div class="row">
          <button data-insert="ln(">ln</button>
          <button data-insert="log(">log</button>
          <button data-insert="^">^</button>
          <button data-insert="%">%</button>
        </div>
        <div class="row">
          <button data-insert="7">7</button>
          <button data-insert="8">8</button>
          <button data-insert="9">9</button>
          <button data-insert="/">÷</button>
        </div>
        <div class="row">
          <button data-insert="4">4</button>
          <button data-insert="5">5</button>
          <button data-insert="6">6</button>
          <button data-insert="*">×</button>
        </div>
        <div class="row">
          <button data-insert="1">1</button>
          <button data-insert="2">2</button>
          <button data-insert="3">3</button>
          <button data-insert="-">−</button>
        </div>
        <div class="row">
          <button data-insert="0">0</button>
          <button data-insert=".">.</button>
          <button data-fn="toggleDegRad">deg</button>
          <button data-insert="+">+</button>
        </div>
        <div class="row">
          <button class="wide" data-fn="equals">=</button>
        </div>
      </div>
      <p class="hint">Keyboard-friendly: type expressions, press Enter to evaluate. Use ↑/↓ to browse history.</p>
    </section>

    <section id="convert" class="panel" role="tabpanel">
      <h2>Unit Converter</h2>
      <div class="converter">
        <div class="conv-row">
          <label>Category</label>
          <select id="convCategory">
            <option value="length">Length</option>
            <option value="mass">Mass</option>
            <option value="temperature">Temperature</option>
            <option value="area">Area</option>
            <option value="volume">Volume</option>
            <option value="time">Time</option>
          </select>
        </div>
        <div class="conv-row">
          <label>From</label>
          <select id="convFrom"></select>
        </div>
        <div class="conv-row">
          <label>To</label>
          <select id="convTo"></select>
        </div>
        <div class="conv-row">
          <label>Value</label>
          <input id="convValue" type="number" step="any" value="1">
        </div>
        <div class="conv-row">
          <label>Result</label>
          <output id="convResult">1</output>
        </div>
      </div>
    </section>

    <section id="programmer" class="panel" role="tabpanel">
      <h2>Programmer</h2>
      <div class="programmer">
        <input id="progInput" placeholder="Enter a number..." />
        <div class="bases">
          <div><label>BIN</label><output id="binOut"></output></div>
          <div><label>OCT</label><output id="octOut"></output></div>
          <div><label>DEC</label><output id="decOut"></output></div>
          <div><label>HEX</label><output id="hexOut"></output></div>
        </div>
        <div class="bitwise">
          <h3>Bitwise</h3>
          <div class="ops">
            <input id="bitA" placeholder="A (integer)">
            <select id="bitOp">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
              <option value="XOR">XOR</option>
              <option value="SHL">SHL</option>
              <option value="SHR">SHR</option>
            </select>
            <input id="bitB" placeholder="B / shift">
            <button id="bitGo">Compute</button>
          </div>
          <output id="bitResult"></output>
        </div>
      </div>
    </section>

    <section id="finance" class="panel" role="tabpanel">
      <h2>Finance</h2>
      <div class="finance">
        <div class="card">
          <h3>Simple Interest</h3>
          <div class="form">
            <input id="siP" type="number" step="any" placeholder="Principal">
            <input id="siR" type="number" step="any" placeholder="Rate % p.a.">
            <input id="siT" type="number" step="any" placeholder="Time (years)">
            <button id="siGo">Calculate</button>
          </div>
          <output id="siOut"></output>
        </div>
        <div class="card">
          <h3>Compound Interest</h3>
          <div class="form">
            <input id="ciP" type="number" step="any" placeholder="Principal">
            <input id="ciR" type="number" step="any" placeholder="Rate % p.a.">
            <input id="ciN" type="number" step="1" placeholder="Compounds / year" value="12">
            <input id="ciT" type="number" step="any" placeholder="Time (years)">
            <button id="ciGo">Calculate</button>
          </div>
          <output id="ciOut"></output>
        </div>
        <div class="card">
          <h3>EMI (Loan)</h3>
          <div class="form">
            <input id="emiP" type="number" step="any" placeholder="Loan Amount">
            <input id="emiR" type="number" step="any" placeholder="Annual Rate %">
            <input id="emiT" type="number" step="any" placeholder="Tenure (years)">
            <button id="emiGo">Calculate</button>
          </div>
          <output id="emiOut"></output>
        </div>
      </div>
    </section>

    <section id="about" class="panel" role="tabpanel">
      <h2>About Dex</h2>
      <p>Dex is a lightweight, offline-ready calculator suite built with vanilla JavaScript—no external dependencies. It strives for accurate results and clear UX.</p>
      <ul>
        <li>Standard & scientific math with history and memory</li>
        <li>Degree/Radian toggle, %, power, roots, factorial</li>
        <li>Unit conversions across common categories</li>
        <li>Programmer tools: base conversion & bitwise ops</li>
        <li>Finance: Simple/Compound interest and EMI</li>
      </ul>
      <p>Made for you. MIT licensed. Customize freely.</p>
    </section>
  </main>

  <footer class="shell">
    <small>© <span id="year"></span> Dex. MIT License. <a href="https://opensource.org/license/mit" target="_blank" rel="noopener">MIT</a></small>
  </footer>

  <script src="app.js"></script>
</body>
</html>
