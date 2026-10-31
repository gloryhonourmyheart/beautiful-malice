const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class HUD {
  constructor() {
    this.$task = document.getElementById('task');
    this.$taskText = document.getElementById('task-text');
    this.$subtitle = document.getElementById('subtitle');
    this.$speaker = document.getElementById('speaker');
    this.$line = document.getElementById('line');
    this.$choices = document.getElementById('choices');
    this.$qte = document.getElementById('qte');
    this.$qteLabel = document.getElementById('qte-label');
    this.$qteFill = document.getElementById('qte-fill');
    this.$prompt = document.getElementById('prompt');
    this.$promptLabel = document.getElementById('prompt-label');
    this.$vignette = document.getElementById('vignette');
    this.$fade = document.getElementById('fade');
    this.$start = document.getElementById('start');
    this.$card = document.getElementById('card');
    this.$cardKicker = document.getElementById('card-kicker');
    this.$cardTitle = document.getElementById('card-title');
    this.$cardSub = document.getElementById('card-sub');
    this.$debug = document.getElementById('debug');
    this.$skip = document.getElementById('skip');
    this._typing = 0;
  }

  setTask(text) {
    this.$taskText.textContent = text;
    this.$task.classList.remove('hidden');
  }

  hideTask() {
    this.$task.classList.add('hidden');
  }

  async say(text, speaker = '', speed = 34) {
    const token = ++this._typing;
    this.$subtitle.classList.remove('hidden');
    this.$speaker.textContent = speaker;
    this.$line.textContent = '';

    const chars = Array.from(text);
    const delay = 1000 / speed;
    for (let i = 0; i < chars.length; i++) {
      if (token !== this._typing) return;
      this.$line.textContent += chars[i];
      await sleep(delay);
    }
    await sleep(120);
  }

  async sayAndWait(text, speaker = '', hold = 700, speed = 34) {
    await this.say(text, speaker, speed);
    await sleep(hold);
  }

  hideSubtitle() {
    this._typing++;
    this.$subtitle.classList.add('hidden');
    this.$speaker.textContent = '';
    this.$line.textContent = '';
  }

  async choose(choices) {
    return new Promise((resolve) => {
      this.$choices.innerHTML = '';
      this.$choices.classList.remove('hidden');

      const pick = (c) => {
        this.$choices.classList.add('hidden');
        this.$choices.innerHTML = '';
        window.removeEventListener('keydown', onKey);
        resolve(c);
      };

      choices.forEach((c, i) => {
        const el = document.createElement('div');
        el.className = 'choice';
        el.innerHTML = `<span class="k">${i + 1}</span><span class="t">${c.text}</span>`;
        el.addEventListener('click', () => pick(c));
        this.$choices.appendChild(el);
      });

      const onKey = (e) => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= choices.length) pick(choices[n - 1]);
      };
      window.addEventListener('keydown', onKey);
    });
  }

  showPrompt(label) {
    this.$promptLabel.textContent = label;
    this.$prompt.classList.remove('hidden');
  }

  hidePrompt() {
    this.$prompt.classList.add('hidden');
  }

  runQTE(label, windowSec, key = 'KeyE', keyLabel = 'E') {
    return new Promise((resolve) => {
      this.$qteLabel.textContent = label;
      document.getElementById('qte-key').textContent = keyLabel;
      this.$qte.classList.remove('hidden');
      this.$qteFill.style.transition = 'none';
      this.$qteFill.style.transform = 'scaleX(1)';

      requestAnimationFrame(() => {
        this.$qteFill.style.transition = `transform ${windowSec}s linear`;
        this.$qteFill.style.transform = 'scaleX(0)';
      });

      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        window.removeEventListener('keydown', onKey);
        clearTimeout(timer);
        this.$qte.classList.add('hidden');
        resolve(ok);
      };
      const onKey = (e) => {
        if (e.code === key) finish(true);
      };
      window.addEventListener('keydown', onKey);
      const timer = setTimeout(() => finish(false), windowSec * 1000);
    });
  }

  flashAura(delta) {
    const cls = delta > 0 ? 'good' : 'bad';
    this.$vignette.classList.add(cls);
    setTimeout(() => this.$vignette.classList.remove(cls), 900);
  }

  fade(on) {
    this.$fade.classList.toggle('on', on);
  }

  hideStart() {
    this.$start.classList.add('hidden');
  }

  showCard({ kicker, title, sub }) {
    this.$cardKicker.textContent = kicker;
    this.$cardTitle.textContent = title;
    this.$cardSub.textContent = sub;
    this.$card.classList.remove('hidden');
  }

  showSkip(on) {
    this.$skip.classList.toggle('hidden', !on);
  }

  debug(text) {
    this.$debug.textContent = text;
  }

  toggleDebug() {
    this.$debug.classList.toggle('hidden');
  }
}
