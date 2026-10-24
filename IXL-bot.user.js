// ==UserScript==
// @name        IXL Bot
// @namespace   ixl-bot
// @version     1.0.4
// @description Automated vision and text solver for IXL learning platform
// @match       https://*.ixl.com/*
// @run-at      document-end
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @connect     generativelanguage.googleapis.com
// @require     https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// ==/UserScript==

(() => {
    'use strict';

    if (window.__ixlCleanup) window.__ixlCleanup();

    const css = document.createElement('style');
    css.textContent = `
    #ixl-bot {
      --bg:#0b101a;--panel:#111a29;--line:#26364d;
      --txt:#e6eefb;--muted:#8d9bb2;--green:#49efad;--blue:#70adff;--red:#ff9696;
      position:fixed;top:80px;right:20px;width:390px;max-width:calc(100vw - 16px);
      max-height:calc(100vh - 16px);overflow:auto;z-index:2147483647;
      background:var(--bg);color:var(--txt);border:1px solid #304663;
      border-radius:13px;box-shadow:0 15px 45px #0009;
      font:12px/1.45 Segoe UI,Arial,sans-serif;
    }
    #ixl-bot *{box-sizing:border-box}
    #ixl-bot button,#ixl-bot input,#ixl-bot select{font:inherit}
    #ixl-bot button{cursor:pointer}
    #ixl-bot button:focus-visible,#ixl-bot input:focus-visible,#ixl-bot select:focus-visible{
      outline:2px solid var(--green);outline-offset:2px}
    #ixl-bot .top{position:sticky;top:0;display:flex;align-items:center;gap:9px;
      padding:11px 12px;background:#101827;border-bottom:1px solid var(--line);
      cursor:grab;z-index:2;touch-action:none}
    #ixl-bot .logo{display:grid;place-items:center;width:30px;height:30px;
      border-radius:9px;color:var(--green);background:#49efad15;font-size:21px}
    #ixl-bot .title{font-weight:800;font-size:13px}
    #ixl-bot .sub{color:var(--muted);font-size:10px}
    #ixl-bot .spacer{flex:1}
    #ixl-bot .status{color:var(--green);font-size:10px;white-space:nowrap}
    #ixl-bot .iconbtn{background:transparent;border:0;color:var(--muted);
      font-size:17px;padding:2px 5px}
    #ixl-bot .nav{display:flex;gap:5px;padding:8px;border-bottom:1px solid var(--line);
      background:#0d1420}
    #ixl-bot .nav button{flex:1;padding:7px 3px;border:1px solid transparent;
      border-radius:7px;background:transparent;color:var(--muted);font-size:11px}
    #ixl-bot .nav button.active{color:var(--green);background:#49efad12;
      border-color:#49efad30}
    #ixl-bot .content{padding:12px}
    #ixl-bot .page{display:none}
    #ixl-bot .page.active{display:block}
    #ixl-bot .label{display:block;color:#b7c6dc;margin:10px 0 5px;font-size:11px}
    #ixl-bot .field{width:100%;height:34px;padding:0 9px;border-radius:7px;
      background:#121d2d;border:1px solid var(--line);color:var(--txt)}
    #ixl-bot .row{display:flex;gap:7px;align-items:center}
    #ixl-bot .row>*{min-width:0;flex:1}
    #ixl-bot .btn{padding:8px 10px;border-radius:7px;border:1px solid var(--line);
      background:#152136;color:var(--txt);text-align:center;text-decoration:none;display:inline-block;}
    #ixl-bot .primary{background:var(--green);border-color:var(--green);
      color:#07150f;font-weight:800}
    #ixl-bot .danger{background:#ff9696;border-color:#ff9696;
      color:#07150f;font-weight:800}
    #ixl-bot .box{padding:10px;border:1px solid var(--line);
      border-radius:9px;background:var(--panel);margin-top:9px}
    #ixl-bot .muted{color:var(--muted);font-size:10px}
    #ixl-bot .console{height:140px;overflow:auto;background:#080d15;
      border:1px solid var(--line);border-radius:8px;padding:9px;
      font:10px/1.8 Consolas,monospace;overflow-wrap:anywhere}
    #ixl-bot .logline{color:#b0bfd5}
    #ixl-bot .ok{color:var(--green)}
    #ixl-bot .info{color:var(--blue)}
    #ixl-bot .error{color:#ff9696}
    #ixl-bot a { color: var(--blue); text-decoration: none; }
    #ixl-bot a:hover { text-decoration: underline; }
    @media(max-width:420px){#ixl-bot{right:8px;width:calc(100vw - 16px)}}
    `;
    document.head.appendChild(css);

    const ui = document.createElement('div');
    ui.id = 'ixl-bot';
    ui.innerHTML = `
      <header class="top" id="ixl-drag">
        <div class="logo"> :P</div>
        <div><div class="title">IXL <span style="color:#49efad">Bot</span></div>
          <div class="sub">AI Auto-Solver</div></div>
        <div class="spacer"></div>
        <span class="status" id="ixl-status">● READY</span>
        <button class="iconbtn" id="ixl-hide" title="Hide">−</button>
        <button class="iconbtn" id="ixl-delete" title="Delete UI">×</button>
      </header>
      <nav class="nav">
        <button class="active" data-page="home">⌂ Solver</button>
        <button data-page="models">✧ Models</button>
        <button data-page="history">☷ History</button>
        <button data-page="about">ⓘ About</button>
      </nav>
      <main class="content">
        <section class="page active" data-section="home">
          <div style="font-weight:750">Active Workspace</div>
          <div class="muted">Configure your API key & model to solve IXL questions.</div>

          <label class="label" for="ixl-key">Gemini API Key</label>
          <input class="field" id="ixl-key" type="password" placeholder="AIzaSy..." autocomplete="off">

          <div class="row" style="margin-top:8px">
            <button class="btn" id="ixl-toggle-key">Show key</button>
            <a class="btn" href="https://aistudio.google.com/api-keys" target="_blank">Get API Key</a>
          </div>

          <label class="label" for="ixl-model">Gemini Model</label>
          <select class="field" id="ixl-model">
              <optgroup label="Text-out Models">
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
                  <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                  <option value="gemini-2-flash">Gemini 2 Flash</option>
                  <option value="gemini-2-flash-lite">Gemini 2 Flash Lite</option>
              </optgroup>
              <optgroup label="Agents">
                  <option value="antigravity">Antigravity</option>
                  <option value="deep-research-pro-preview">Deep Research Pro Preview</option>
              </optgroup>
          </select>

          <label class="label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:10px;">
            <input type="checkbox" id="ixl-thinking" style="width:16px;height:16px;accent-color:var(--green);">
            <span style="color:#b7c6dc;font-weight:600;">Enable Think / Reasoning Mode</span>
          </label>

          <label class="label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:6px;">
            <input type="checkbox" id="ixl-image-parsing" style="width:16px;height:16px;accent-color:var(--green);" checked>
            <span style="color:#b7c6dc;font-weight:600;">Enable Image Parsing (Vision)</span>
          </label>

          <div class="row" style="margin-top:11px">
            <button class="btn primary" id="ixl-run-single" style="flex:1;">⚡ Solve Current</button>
            <button class="btn primary" id="ixl-run-auto" style="flex:1;background:#70adff;border-color:#70adff;color:#07150f;">🔄 Auto-Answer</button>
          </div>

          <div class="box">
            <div class="row" style="margin-bottom:7px">
              <strong>Activity log</strong><span class="spacer"></span>
              <button class="iconbtn" id="ixl-clear" title="Clear log">⌫</button>
            </div>
            <div class="console" id="ixl-log" aria-live="polite">
              <div class="logline ok">✓ IXL Bot interface initialized.</div>
              <div class="logline info">› Ready to solve IXL problems.</div>
            </div>
          </div>
        </section>

        <section class="page" data-section="models">
          <strong>Model configuration</strong>
          <div class="muted">Currently active engine configuration.</div>
          <label class="label">Active Provider</label>
          <select class="field" disabled>
            <option>Google Gemini API</option>
          </select>
        </section>

        <section class="page" data-section="history">
          <strong>Session history</strong>
          <div class="muted">Activity log in this session.</div>
          <div id="ixl-history" style="margin-top:8px;"></div>
          <button class="btn" id="ixl-history-clear" style="margin-top:10px">Clear history</button>
        </section>

        <section class="page" data-section="about">
          <strong>About IXL Bot</strong>
          <div class="muted">Automated IXL question solving assistant.</div>

          <div class="box">
            <strong style="color:var(--red)">🛑 Academic Integrity & Research Disclaimer</strong>
            <div class="muted" style="margin-top:6px">
              This utility was developed strictly for software development, DOM manipulation testing, and technical AI vision research. It is NOT intended for cheating, academic dishonesty, or circumventing educational assignments. Use responsibly and ethically.
            </div>
          </div>

          <div class="box">
            <strong style="color:var(--green)">⚠️ Verify Your Answers</strong>
            <div class="muted" style="margin-top:6px">
              AI vision and text models can hallucinate or misinterpret complex mathematical figures, diagrams, or text inputs. Always double-check answers.
            </div>
          </div>

          <div class="box">
            <strong style="color:var(--blue)">🛠️ Work in Progress</strong>
            <div class="muted" style="margin-top:6px">
              IXL Bot is an active technical project. Page structure updates or DOM adjustments on the platform may alter functionality over time.
            </div>
          </div>
        </section>
      </main>
    `;
    document.body.appendChild(ui);

    const $ = id => document.getElementById(id);
    let hidden = false;
    let autoRunning = false;
    let history = [];

    // Load saved settings
    const apiKeyInput = $('ixl-key');
    apiKeyInput.value = GM_getValue('ixl_gemini_key', '');
    apiKeyInput.addEventListener('input', () => GM_setValue('ixl_gemini_key', apiKeyInput.value));

    const modelSelect = $('ixl-model');
    modelSelect.value = GM_getValue('ixl_gemini_model', 'gemini-3.5-flash-lite');
    modelSelect.addEventListener('change', () => GM_setValue('ixl_gemini_model', modelSelect.value));

    const thinkingCheckbox = $('ixl-thinking');
    thinkingCheckbox.checked = GM_getValue('ixl_gemini_thinking', false);
    thinkingCheckbox.addEventListener('change', () => GM_setValue('ixl_gemini_thinking', thinkingCheckbox.checked));

    const imageParsingCheckbox = $('ixl-image-parsing');
    imageParsingCheckbox.checked = GM_getValue('ixl_gemini_image_parsing', true);
    imageParsingCheckbox.addEventListener('change', () => GM_setValue('ixl_gemini_image_parsing', imageParsingCheckbox.checked));

    function log(message, kind = 'info') {
      const line = document.createElement('div');
      line.className = 'logline ' + kind;
      line.textContent = (kind === 'ok' ? '✓ ' : kind === 'error' ? '! ' : '› ') + message;
      $('ixl-log').appendChild(line);
      $('ixl-log').scrollTop = $('ixl-log').scrollHeight;
    }

    function status(message) {
      $('ixl-status').textContent = '● ' + message;
    }

    function navigate(page) {
      ui.querySelectorAll('[data-page]').forEach(b =>
        b.classList.toggle('active', b.dataset.page === page));
      ui.querySelectorAll('[data-section]').forEach(s =>
        s.classList.toggle('active', s.dataset.section === page));
    }

    ui.querySelectorAll('[data-page]').forEach(button =>
      button.addEventListener('click', () => navigate(button.dataset.page)));

    $('ixl-toggle-key').addEventListener('click', () => {
      const key = $('ixl-key');
      key.type = key.type === 'password' ? 'text' : 'password';
      $('ixl-toggle-key').textContent = key.type === 'password' ? 'Show key' : 'Hide key';
    });

    $('ixl-clear').addEventListener('click', () => {
      $('ixl-log').textContent = '';
      log('Log cleared.', 'ok');
      status('READY');
    });

    function renderHistory() {
      const area = $('ixl-history');
      area.textContent = '';
      if (!history.length) {
        area.textContent = 'No activity yet.';
        return;
      }
      history.forEach(item => {
        const box = document.createElement('div');
        box.className = 'box';
        box.textContent = item;
        area.appendChild(box);
      });
    }

    $('ixl-history-clear').addEventListener('click', () => {
      history = [];
      renderHistory();
    });

    // --- Core Single Solver Execution ---
    $('ixl-run-single').addEventListener('click', async () => {
        if (autoRunning) return;
        await solveCurrentQuestion();
    });

    // --- Auto-Answer Loop Toggle ---
    $('ixl-run-auto').addEventListener('click', async () => {
        if (autoRunning) {
            autoRunning = false;
            $('ixl-run-auto').textContent = '🔄 Auto-Answer';
            $('ixl-run-auto').style.background = '#70adff';
            status('READY');
            log('Auto-answer stopped.', 'info');
            return;
        }

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            log('API key is missing.', 'error');
            status('KEY REQUIRED');
            return;
        }

        autoRunning = true;
        $('ixl-run-auto').textContent = '⏹ Stop Auto';
        $('ixl-run-auto').style.background = '#ff9696';
        log('Auto-answer loop started...', 'ok');

        while (autoRunning) {
            try {
                await solveCurrentQuestion();
                log('Waiting 2s for next question...', 'info');
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                log(`Loop error: ${e.message}`, 'error');
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    });

    async function solveCurrentQuestion() {
        const apiKey = apiKeyInput.value.trim();
        const selectedModel = modelSelect.value;
        const thinkingEnabled = thinkingCheckbox.checked;
        const imageParsingEnabled = imageParsingCheckbox.checked;

        if (!apiKey) {
            log('API key is missing.', 'error');
            status('KEY REQUIRED');
            return;
        }

        status('CAPTURING');
        let payloadData;

        try {
            if (imageParsingEnabled) {
                ui.style.display = 'none';
                const canvas = await html2canvas(document.body, {
                    useCORS: true,
                    scale: window.devicePixelRatio > 1 ? 1 : 2
                });
                ui.style.display = hidden ? 'none' : 'block';
                payloadData = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
            } else {
                payloadData = document.body.innerText;
            }
        } catch (e) {
            ui.style.display = hidden ? 'none' : 'block';
            throw new Error('Capture failed: ' + e.message);
        }

        status('QUERYING');
        log(`Querying ${selectedModel}...`);

        const solution = await askGemini(apiKey, selectedModel, payloadData, imageParsingEnabled, thinkingEnabled);
        await executeIXLAnswers(solution);

        history.unshift(`Solved question · ${new Date().toLocaleTimeString()}`);
        renderHistory();
        status('READY');
    }

    async function askGemini(apiKey, model, data, isVision, thinkingEnabled) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const thinkingDirective = thinkingEnabled
            ? "CRITICAL: Before outputting JSON, perform step-by-step reasoning inside a <think>...</think> block."
            : "";

        const prompt = `You are an automated solver for IXL learning platform questions on screen.
Analyze the provided ${isVision ? 'screenshot' : 'text content'} carefully.
${thinkingDirective}

Respond ONLY with a raw, valid JSON object following this format:
{
  "type": "single" | "multiple" | "text" | "dropdown",
  "answers": ["exact option text or input value"],
  "submit": true
}

Instructions:
1. For multiple choice or clickable options, set type="single" or type="multiple" and provide the exact answer text in "answers".
2. For text entry fields, set type="text" and provide the answer string in "answers".
3. Set "submit" to true if an explicit submit/enter button needs to be pressed after filling or clicking.`;

        let parts = [{ text: prompt }];
        if (isVision) {
            parts.push({ inline_data: { mime_type: 'image/jpeg', data: data } });
        } else {
            parts.push({ text: `\n\n--- PAGE TEXT ---\n${data}` });
        }

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                timeout: 20000,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ contents: [{ parts: parts }] }),
                onload: (res) => {
                    if (res.status === 200) {
                        try {
                            const json = JSON.parse(res.responseText);
                            let rawText = json.candidates[0].content.parts[0].text.trim();
                            const jsonStart = rawText.indexOf('{');
                            const jsonEnd = rawText.lastIndexOf('}');
                            if (jsonStart !== -1 && jsonEnd !== -1) {
                                rawText = rawText.substring(jsonStart, jsonEnd + 1);
                            } else {
                                rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                            }
                            resolve(JSON.parse(rawText));
                        } catch (err) { reject(new Error('JSON Parse failed')); }
                    } else {
                        reject(new Error(`API fail: Status ${res.status}`));
                    }
                },
                onerror: () => reject(new Error('Network connection error')),
                ontimeout: () => reject(new Error('API request timed out'))
            });
        });
    }

    async function executeIXLAnswers(solution) {
        if (!solution || !solution.type) {
            log('Invalid solution format received.', 'error');
            return;
        }

        // 1. Text Inputs
        if (solution.type === 'text' && solution.answers && solution.answers.length > 0) {
            const inputs = document.querySelectorAll('input[type="text"], textarea, input[class*="fill"]');
            for (let i = 0; i < inputs.length && i < solution.answers.length; i++) {
                await typeManually(inputs[i], solution.answers[i]);
                log(`Typed into input: ${solution.answers[i]}`, 'ok');
            }
        }
        // 2. Choice Options
        else if ((solution.type === 'single' || solution.type === 'multiple') && solution.answers) {
            solution.answers.forEach(targetAns => {
                const cleanTarget = targetAns.toLowerCase().trim();
                const optionElements = document.querySelectorAll('div[class*="choice"], label, button[role="checkbox"], button[role="radio"], span[class*="answer"]');

                let matched = false;
                optionElements.forEach(el => {
                    const txt = el.innerText ? el.innerText.toLowerCase().trim() : '';
                    if (txt && (txt.includes(cleanTarget) || cleanTarget.includes(txt))) {
                        triggerClick(el);
                        matched = true;
                    }
                });
                if (matched) {
                    log(`Selected option: ${targetAns}`, 'ok');
                } else {
                    log(`Could not find clickable element for: ${targetAns}`, 'error');
                }
            });
        }

        // 3. Trigger Enter keypress or Click Submit button
        await new Promise(r => setTimeout(r, 300));
        const activeInput = document.activeElement;
        if (activeInput && (activeInput.tagName === 'INPUT' || activeInput.tagName === 'TEXTAREA')) {
            ['keydown', 'keypress', 'keyup'].forEach(evtType => {
                activeInput.dispatchEvent(new KeyboardEvent(evtType, {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                }));
            });
            log('Simulated Enter keypress.', 'info');
        } else {
            const submitButtons = document.querySelectorAll('button[class*="submit"], button[aria-label*="Submit"], input[type="submit"]');
            let clickedSubmit = false;
            submitButtons.forEach(btn => {
                if (btn && btn.offsetParent !== null && !clickedSubmit) {
                    triggerClick(btn);
                    clickedSubmit = true;
                    log('Clicked submit button.', 'info');
                }
            });
        }
    }

    async function typeManually(inputEl, text) {
        inputEl.focus();
        inputEl.value = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            inputEl.value += char;
            inputEl.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true }));
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 30) + 15));
        }
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function triggerClick(element) {
        if (!element) return;
        element.click();
        ['mousedown', 'mouseup', 'click'].forEach(evtType => {
            element.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true }));
        });
    }

    function toggleHidden() {
        hidden = !hidden;
        ui.style.display = hidden ? 'none' : 'block';
    }

    function deleteUI() {
        document.removeEventListener('keydown', onKey);
        ui.remove();
        css.remove();
        window.__ixlCleanup = null;
    }

    function onKey(event) {
        if (event.code === 'ShiftRight' && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) {
            event.preventDefault();
            toggleHidden();
        }
    }
    document.addEventListener('keydown', onKey, true);

    const drag = $('ixl-drag');
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

    drag.addEventListener('pointerdown', event => {
        if (event.target.closest('button')) return;
        dragging = true;
        const rect = ui.getBoundingClientRect();
        startX = event.clientX;
        startY = event.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        ui.style.right = 'auto';
        ui.style.left = startLeft + 'px';
        ui.style.top = startTop + 'px';
        drag.setPointerCapture(event.pointerId);
    });

    drag.addEventListener('pointermove', event => {
        if (!dragging) return;
        ui.style.left = (startLeft + event.clientX - startX) + 'px';
        ui.style.top = (startTop + event.clientY - startY) + 'px';
    });

    const stopDrag = () => { dragging = false; };
    drag.addEventListener('pointerup', stopDrag);
    drag.addEventListener('pointercancel', stopDrag);

    $('ixl-hide').addEventListener('click', toggleHidden);
    $('ixl-delete').addEventListener('click', deleteUI);
    window.__ixlCleanup = deleteUI;
})();
