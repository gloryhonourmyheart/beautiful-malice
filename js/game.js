/* =========================================================
   上课偷吃 · 单人版
   游戏主逻辑：老师 AI / 偷吃 / 怀疑度 / 罚站 / 贪吃蛇 / 结算
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const dampAngle = (cur, target, lambda, dt) => {
    let d = target - cur;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return cur + d * (1 - Math.exp(-lambda * dt));
  };
  const SN = window.SNACK_DATA;
  const LD = window.LESSON_DATA;
  const HUNGER_RESTORE = {
    chips: 4.2, spicy: 3.6, milktea: 5.0,
    banana: 4.8, noodle: 5.2, chicken: 5.8
  };

  /* =========================================================
     关卡参数
     ========================================================= */
  const LEVELS = {
    1: {
      id: 1,
      snacks: ['chips', 'milktea', 'banana'],
      duration: 108,
      write: [5.6, 8.6],
      telegraph: 1.05,
      stare: [2.2, 3.2],
      patrolChance: 0.3,
      patrols: 1,
      patrolSpeed: 1.5,
      base: 480,
      hearts: 1,
      story: '晚自习前，你把三包零食塞进桌兜。王老师今天没吃晚饭，脾气不太好。',
      quote: '把书翻到第五十八页，这节课讲函数。没带书的，个人站起来哈。',
      rules: [
        '板书时尽情吃，转身时必须收手。',
        '被盯上别硬撑，按 Shift 装乖。',
        '同学会举报你：看到顶部提示，按 E 塞零食。',
        '饥饿值会下降；吃零食恢复，低于 30 肚子会叫。',
        '红牌用完，她会把你拎到讲台上。'
      ],
      intro: '上课咯。把书翻到第五十八页，搞快点。',
      turn: ['嗯？啥子声音？', '我听到有人在嚼东西哦。', '啥子味道这么香？', '哪个在偷嘴？个人站起来哈。'],
      caught: [
        '最后一排靠窗那个娃儿，嘴巴头是啥子？站到后头去。',
        '我都看到你腮帮子鼓起了，还装？去后头站到。',
        '你娃咋个回事嘛，我的课上就这么饿嗦？'
      ],
      phone: '手机给我交上来！下课到办公室来拿，听到没得？',
      chalk: '再吃一口试哈，粉笔头认得到你哈。',
      npc: ['李小胖，你手头拿的啥子？', '第二排那个，嘴巴头嚼啥子嘛？', '上课偷嘴，当我是瓜娃子嗦？'],
      relax: '莫以为我背到你们，就啥子都不晓得哈。'
    },
    2: {
      id: 2,
      snacks: ['spicy', 'chips', 'milktea', 'banana'],
      duration: 120,
      write: [4.5, 7.2],
      telegraph: 0.85,
      stare: [2.4, 3.5],
      patrolChance: 0.5,
      patrols: 2,
      patrolSpeed: 1.55,
      base: 580,
      hearts: 1,
      story: '英语课。李老师已经开始怀疑有人上课偷吃；你的桌兜空了一半。',
      quote: 'If I were you, I would not eat in my class. 把这句话抄十遍，抄不完不准走哈。',
      rules: [
        '英语老师转身很快，听粉笔声。',
        '她偶尔会走下讲台巡视。',
        '手机的光她老远就能看见。',
        '同学举报你时，按 E 堵住他的嘴。',
        '饥饿值会下降；吃零食恢复，低于 30 肚子会叫。'
      ],
      intro: 'Class begins. Turn to page fifty-four，翻到五十四页哈。',
      turn: ['Excuse me? 我好像看到啥子了哦。', 'Stop chewing. 哪个在嚼东西？', '啥子味道嘛，这么香？', '我跟你讲，莫在底下搞小动作哈。'],
      caught: [
        '最后一排那个同学，把嘴巴头的东西吐了，站到后头去。',
        '你当我听不懂你嚼东西嗦？出去站到。',
        '这都第二回咯，下课到我办公室来一趟。'
      ],
      phone: '手机没收咯，家长会的时候再还给你。',
      chalk: 'One more bite，粉笔头就飞到你脑壳上咯。',
      npc: ['那个同学，站起来读一哈这个单词。', '嘴巴莫动了，我都看到咯。', '上课偷嘴，还挑辣条嗦？'],
      relax: '我的课上，咽口水都给我小声点哈。'
    },
    3: {
      id: 3,
      snacks: ['spicy', 'noodle', 'chicken', 'milktea', 'banana'],
      duration: 135,
      write: [3.8, 6.2],
      telegraph: 0.62,
      stare: [2.6, 4.0],
      patrolChance: 0.62,
      patrols: 2,
      patrolSpeed: 1.65,
      base: 720,
      hearts: 1,
      story: '张主任手里有一份名单。你听见自己的名字被红笔圈了一下。',
      quote: '我手头已经有一份名单了。名单上的娃儿，个人心头有数哈。',
      rules: [
        '班主任的课：转身快、巡视勤、说话狠。',
        '鸡腿的味道藏不住，最好先吃别的。',
        '同学举报你时，按 E 塞零食。',
        '饥饿值会下降；吃零食恢复，低于 30 肚子会叫。',
        '这节课的红牌用完，就不是罚站了。'
      ],
      intro: '都给我坐好。今天开个短会，顺便说哈你们最近干的那些好事。',
      turn: ['我听到有人撕包装袋了哈。', '哪个？个人站起来。', '教室头咋个一股辣条味哦？', '嗯？'],
      caught: [
        '最后一排靠窗那个，你当我认不到你嗦？站到后头去。',
        '我盯你娃很久了。红牌，罚站，明天把你家长喊来。',
        '这个班硬是我带过最差的一届。去后头站到！'
      ],
      phone: '手机，交上来。你家长的电话我也有哈。',
      chalk: '粉笔头可不是吃素的，再吃一口试哈嘛。',
      npc: ['李小胖，你站起来。', '我说过好多回了，上课莫吃东西。', '你嘴巴头是啥子？吐出来。'],
      relax: '莫以为我背到你们，我就听不到哈。'
    },
    4: {
      id: 4,
      snacks: ['spicy', 'noodle', 'chicken', 'milktea'],
      duration: 145,
      write: [4.2, 6.6],
      telegraph: 0.7,
      stare: [2.8, 4.2],
      patrolChance: 0.55,
      patrols: 2,
      patrolSpeed: 1.55,
      base: 780,
      hearts: 1,
      dark: true,
      story: '晚自习停电了。整栋楼只剩她手电筒的光。她把你留到了最后。',
      quote: '……停电了。都莫动。哪个嘴巴头有东西，个人站出来。',
      rules: [
        '灯灭了，她的手电筒会扫过每一排。',
        '光扫到你时，别嚼、别动、别玩手机。',
        '同学会在这时候举报你，看到 🙋 就按 E 塞零食。',
        '饥饿值会下降；吃零食恢复，低于 30 肚子会叫。',
        '红牌用完之后再被发现，她会把你拎到讲台上……'
      ],
      intro: '咋个又停电了嘛？都坐好，莫出声哈。',
      turn: ['……', '我听到有人在嚼东西哦。', '莫以为黑了我就看不到哈。', '嘴巴给我闭到。'],
      caught: [
        '逮到你了。敢在停电的时候偷嘴？',
        '你以为黑了我就认不到你嚼东西的声音嗦？',
        '逮到你了。这回，可不只是罚站哦。'
      ],
      phone: '停电了还耍手机？屏幕光比你的脸还亮哈。',
      chalk: '再吃一口试哈嘛。',
      npc: ['哪个在吃东西？', '有人举报你，站起来。', '我闻到了哦。'],
      relax: '这间教室，晚上比白天还热闹哦。'
    }
  };

  const NPC_NAMES = ['张小胖', '李小胖', '王大壮', '刘二狗', '赵铁柱', '陈小美', '周大福', '吴小狗', '郑小鸡', '孙大圣', '钱多多', '冯大嘴'];

  /* =========================================================
     DOM
     ========================================================= */
  const UI = {
    stage: $('#stage'),
    hud: $('#hud'),
    loading: $('#loading'),
    fatal: $('#fatal'),
    vignette: $('#vignette'),
    dangerGlow: $('#dangerGlow'),
    flash: $('#flash'),

    screenTitle: $('#screenTitle'),
    screenBrief: $('#screenBrief'),
    screenPause: $('#screenPause'),
    screenResult: $('#screenResult'),
    screenGameover: $('#screenGameover'),
    screenFinal: $('#screenFinal'),
    screenHelp: $('#screenHelp'),
    screenAssassinate: $('#screenAssassinate'),

    hudLesson: $('#hudLesson'),
    hudSubject: $('#hudSubject'),
    hudClock: $('#hudClock'),
    timeFill: $('#timeFill'),
    teacherState: $('#teacherState'),
    tsIcon: $('#tsIcon'),
    tsTitle: $('#tsTitle'),
    tsSub: $('#tsSub'),
    tsEye: $('#tsEye'),
    hearts: $('#hearts'),
    hudScore: $('#hudScore'),
    suspicionBox: $('#suspicionBox'),
    suspFill: $('#suspFill'),
    suspVal: $('#suspVal'),

    bigWarn: $('#bigWarn'),
    cheek: $('#cheek'),
    subtitle: $('#subtitle'),
    subtitleSpeaker: $('#subtitleSpeaker'),
    subtitleText: $('#subtitleText'),
    npcBubble: $('#npcBubble'),
    npcBubbleText: $('#npcBubbleText'),
    snackList: $('#snackList'),
    snackCount: $('#snackCount'),
    hungerRow: $('#hungerRow'),
    hungerFill: $('#hungerFill'),
    hungerVal: $('#hungerVal'),
    begCard: $('#begCard'),
    begName: $('#begName'),
    begText: $('#begText'),
    begFill: $('#begFill'),
    sneakCard: $('#sneakCard'),
    sneakFill: $('#sneakFill'),
    sneakStatus: $('#sneakStatus'),
    sneakRisk: $('#sneakRisk'),
    sneakHint: $('#sneakHint'),
    chewMeter: $('#chewMeter'),
    chewFill: $('#chewFill'),
    chewText: $('#chewText'),
    hints: $('#hints'),
    lookHint: $('#lookHint'),
    innocentFlag: $('#innocentFlag'),
    toasts: $('#toasts'),
    phoneWrap: $('#phoneWrap'),
    phoneCanvas: $('#phoneCanvas'),
    punishOverlay: $('#punishOverlay'),
    punishTime: $('#punishTime'),
    clickPrompt: $('#clickPrompt'),
    snitchAlert: $('#snitchAlert'),
    snitchText: $('#snitchText'),
    snitchFill: $('#snitchFill'),
    snitchBubble: $('#snitchBubble'),
    qte: $('#qte'),
    qteFill: $('#qteFill'),
    slash: $('#slash'),
    assassinLesson: $('#assassinLesson'),
    assassinScore: $('#assassinScore'),
    assassinTeacher: $('#assassinTeacher'),
    btnAssassinNext: $('#btnAssassinNext'),
    cinema: $('#cinema'),
    cinemaSub: $('#cinemaSub'),
    blackout: $('#blackout'),
    screenEaten: $('#screenEaten'),
    eatenLesson: $('#eatenLesson'),
    eatenScore: $('#eatenScore'),
    resSnitch: $('#resSnitch'),
    finalSnitch: $('#finalSnitch'),

    briefNum: $('#briefNum'),
    briefSubject: $('#briefSubject'),
    briefTime: $('#briefTime'),
    briefAvatar: $('#briefAvatar'),
    briefTeacher: $('#briefTeacher'),
    briefQuote: $('#briefQuote'),
    briefStory: $('#briefStory'),
    briefGoal: $('#briefGoal'),
    briefSnacks: $('#briefSnacks'),
    briefRules: $('#briefRules'),

    resultTitle: $('#resultTitle'),
    resultGrade: $('#resultGrade'),
    resultLine: $('#resultLine'),
    resEaten: $('#resEaten'),
    resCatches: $('#resCatches'),
    resPhone: $('#resPhone'),
    resScore: $('#resScore'),
    btnNextLesson: $('#btnNextLesson'),
    btnRetryLesson: $('#btnRetryLesson'),

    goTeacher: $('#goTeacher'),
    finalTitle: $('#finalTitle'),
    finalGrade: $('#finalGrade'),
    finalScore: $('#finalScore'),
    finalEaten: $('#finalEaten'),
    finalCatches: $('#finalCatches'),
    finalPhone: $('#finalPhone'),
    finalLine: $('#finalLine'),

    btnPauseMute: $('#btnPauseMute'),
    btnHelpStart: $('#btnHelpStart')
  };

  /* =========================================================
     状态
     ========================================================= */
  const DEBUG = /[?&](debug|auto)=1/.test(location.search);

  const G = {
    state: 'title',
    lesson: 1,
    level: LEVELS[1],
    briefLesson: 1,
    score: 0, hearts: 1, maxHearts: 1, catches: 0,
    hunger: 62, maxHunger: 100, hungerRate: 0.72, growlCd: 8,
    hungerWarned: false, hungerZeroWarned: false,
    begCd: 14, begShown: false, begActive: false, begTimer: 0, begMax: 5, begName: '', begText: '',
    ally: 0, grudge: 0, given: 0, refused: 0, allyUsed: 0,
    sneak: false, sneakReady: false, sneakProgress: 0, sneakWarned: false, sneakBeat: 0,
    phoneScore: 0, phoneTime: 0,
    suspicion: 0, displaySusp: 0,
    timeLeft: 0, duration: 0, finishTimeLeft: 0, clockBase: 8 * 60,
    snacks: [], active: -1,
    eatHold: 0, eatBlocked: false, wasEating: false,
    cheekT: 0, foodOutT: 0, allEaten: false,
    inputLock: 0, introT: 0,
    phoneUp: false, phoneConfiscated: false,
    catchT: 0, punishT: 0, punishMax: 10,
    subT: 0, warnT: 0, redCardT: 0,
    bubble: null, bubbleT: 0,
    neighbor: -1,
    locked: false, hadLock: false, debug: DEBUG,
    look: { yaw: 0, pitch: -0.02 },
    lessonResults: {},
    totalEaten: 0,
    crunches: 0,
    phonePelletCount: 0,
    warnCool: 0,
    voiceOn: true,
    seenFlashDone: false,
    npcCatchCooldown: 0,
    patrolWarnCool: 0,
    lastFrame: 0,
    caughtReason: '',
    gameOverShown: false,
    resultData: null,
    dark: false,
    beamOn: false,
    beamOffset: 0,
    beamPhase: 0,
    beamWarnCd: 0,
    snitch: null,
    snitchCd: 30,
    snitchName: '',
    reports: 0,
    bribes: 0,
    eatT: 0,
    cinemaStage: -1,
    thunderCd: 20,
    terminalCatch: false,
    qteActive: false,
    qteShown: false,
    qteDone: false,
    stabT: 0,
    stabStage: -1,
    testHooks: null
  };

  const IN = { eat: false, innocent: false, keys: {} };

  const T = {
    state: 'write',
    timer: 6,
    yaw: Math.PI,
    targetYaw: Math.PI,
    turnSpeed: 5,
    pos: { x: 0.25, z: -6.0 },
    moving: false,
    pauseT: 0,
    lookPlayer: false,
    path: [],
    speed: 1.5,
    stepT: 0,
    writeT: 0,
    patrolsLeft: 1,
    patrolCd: 0,
    chalkCd: 0,
    voiceCd: 0,
    npcCd: 18,
    enterStare: false,
    returning: false
  };

  let world = null;
  let phoneGame = null;
  let rafId = 0;

  /* =========================================================
     启动
     ========================================================= */
  function boot() {
    try {
      world = new window.World(UI.stage);
    } catch (e) {
      console.error(e);
      world = null;
    }
    if (!world) {
      UI.loading.classList.add('hidden');
      UI.fatal.classList.remove('hidden');
      UI.fatal.innerHTML = '<div><b>教室没能搭起来。</b><br>你的浏览器似乎不支持 WebGL。<br>请用 Chrome / Edge / Safari 打开，并确认硬件加速已开启。</div>';
      return;
    }
    world.resize(window.innerWidth, window.innerHeight);
    world.setView('title');
    world.setTeacherMode('idle');
    world.setTeacherMoving(false);
    world.setChalkNext && world.setChalkNext();

    phoneGame = new window.PhoneGame(UI.phoneCanvas, {
      onEat: onPhoneEat,
      onDie: onPhoneDie
    });

    G.neighbor = world.npcs.findIndex(n => n.userData.slot &&
      n.userData.slot.row === world.PLAYER.row && n.userData.slot.col === world.PLAYER.col - 1);

    bindUI();
    bindInput();
    bindPointerLock();

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && G.state === 'playing') pauseGame();
    });
    window.addEventListener('blur', () => {
      if (G.state === 'playing') pauseGame();
    });

    UI.loading.classList.add('hidden');

    if (DEBUG) {
      G.debug = true;
      window.__GAME__ = debugApi();
      const m = location.search.match(/[?&]auto=(\d+)/);
      if (m) {
        beginSession();
        startLesson(parseInt(m[1], 10) || 1);
      }
    }

    G.lastFrame = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function onResize() {
    if (!world) return;
    world.resize(window.innerWidth, window.innerHeight);
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0.001, (now - G.lastFrame) / 1000));
    G.lastFrame = now;
    if (world) world.update(dt);
    if (G.state === 'playing' || G.state === 'caught' || G.state === 'punish' || G.state === 'eaten' || G.state === 'assassinate') {
      tick(dt);
    }
    if (G.state === 'playing' || G.state === 'caught' || G.state === 'punish') {
      updateHUD(dt);
      updateSubtitle(dt);
      updateBubble(dt);
    }
  }

  /* =========================================================
     屏幕管理
     ========================================================= */
  const SCREENS = ['screenTitle', 'screenBrief', 'screenPause', 'screenResult',
    'screenGameover', 'screenFinal', 'screenHelp', 'screenEaten', 'screenAssassinate'];

  function hideScreens(keep) {
    SCREENS.forEach(id => {
      if (id !== keep) UI[id].classList.add('hidden');
    });
  }

  function showHUD(v) {
    UI.hud.classList.toggle('hidden', !v);
  }

  function beginSession() {
    G.lessonResults = {};
    G.totalEaten = 0;
  }

  function showBrief(id) {
    const L = LEVELS[id], D = LD[id];
    G.briefLesson = id;
    G.state = 'brief';
    closePhone();
    unlockPointer();
    stopAllInput();
    hideScreens('screenBrief');
    showHUD(false);
    SFX.setChalk(false);
    SFX.stopMusic();

    UI.briefNum.textContent = id;
    UI.briefSubject.textContent = D.subject;
    UI.briefTime.textContent = D.time;
    UI.briefAvatar.textContent = id === 4 ? '🕯️' : (['👩🏻‍🏫', '👩🏼‍🏫', '👩🏽‍🏫'][id - 1] || '👩🏻‍🏫');
    UI.briefTeacher.textContent = D.teacherName + ' · 四川话';
    UI.briefQuote.textContent = '“' + L.quote + '”';
    if (UI.briefStory) UI.briefStory.textContent = L.story || '';
    UI.briefGoal.innerHTML = id === 4
      ? '在停电的教室里吃完 <b>' + L.snacks.length + '</b> 份零食，还要堵住想举报你的同学。'
      : '老师背过身时，吃完 <b>' + L.snacks.length + '</b> 份零食，别被抓。';
    UI.briefSnacks.innerHTML = L.snacks.map((type) => {
      const d = SN[type];
      return '<span class="mini-snack">' + d.emoji + ' ' + d.name +
        '<span class="risk">' + '●'.repeat(d.risk) + '</span></span>';
    }).join('');
    UI.briefRules.innerHTML = L.rules.map(r => '<li>' + r + '</li>').join('');
    $('#btnBegin').textContent = id === 4 ? '摸黑上课' : (id === 1 ? '起立！老师好！' : '继续上课');
    UI.screenBrief.classList.toggle('dark-brief', id === 4);
    const bw = document.querySelector('#briefWarning');
    if (bw) bw.classList.toggle('hidden', id !== 4);

    if (world) {
      world.setDark(false);
      world.setView('title');
      world.setTeacherMode('idle');
      world.setTeacherMoving(false);
    }
    document.body.classList.remove('night');
    UI.screenBrief.classList.remove('hidden');
  }

  function showPause() {
    hideScreens('screenPause');
    UI.screenPause.classList.remove('hidden');
    UI.btnPauseMute.textContent = SFX.isMuted() ? '打开声音' : '关闭声音';
  }

  function showResult(data) {
    hideScreens('screenResult');
    showHUD(false);
    UI.resultGrade.textContent = data.grade;
    UI.resultGrade.className = 'grade-stamp grade-' + data.grade;
    UI.resultTitle.textContent = data.title;
    UI.resultLine.textContent = data.line;
    UI.resEaten.textContent = data.eaten + '/' + data.total;
    UI.resCatches.textContent = data.catches;
    UI.resPhone.textContent = data.phoneScore + ' 分';
    UI.resScore.textContent = data.score;
    UI.resSnitch.textContent = '被同学举报 ' + (data.reports || 0) + ' 次 · 塞零食堵嘴 ' + (data.bribes || 0) + ' 次';
    UI.btnRetryLesson.classList.remove('hidden');

    if (data.lesson < 4) {
      UI.btnNextLesson.textContent = '下一节课';
      UI.btnNextLesson.classList.remove('hidden');
    } else {
      UI.btnNextLesson.textContent = '学期总评';
      UI.btnNextLesson.classList.remove('hidden');
    }
    UI.screenResult.classList.remove('hidden');
  }

  function showGameover() {
    G.state = 'gameover';
    closePhone();
    unlockPointer();
    SFX.fail();
    SFX.stopMusic();
    SFX.setChalk(false);
    SFX.stopSpeech();
    G.gameOverShown = true;
    UI.goTeacher.textContent = LD[G.lesson].teacherName;
    hideScreens('screenGameover');
    showHUD(false);
    UI.screenGameover.classList.remove('hidden');
    if (world) {
      world.setTeacherMode('idle');
      world.setTeacherMoving(false);
      world.setTeacherYaw(0);
      world.setView('seat');
    }
  }

  function showFinal() {
    G.state = 'final';
    unlockPointer();
    SFX.stopMusic();
    SFX.stopNight();
    SFX.setChalk(false);
    hideScreens('screenFinal');
    showHUD(false);

    let total = 0, eaten = 0, catches = 0, phoneScore = 0, reports = 0, bribes = 0, given = 0, refused = 0, allyUsed = 0, assassinations = 0, allCleared = true;
    for (let i = 1; i <= 4; i++) {
      const r = G.lessonResults[i];
      if (r) {
        total += r.score; eaten += r.eaten; catches += r.catches;
        phoneScore += r.phoneScore;
        reports += r.reports || 0;
        bribes += r.bribes || 0;
        given += r.given || 0;
        refused += r.refused || 0;
        allyUsed += r.allyUsed || 0;
        if (r.assassinated) assassinations++;
        if (!r.cleared) allCleared = false;
      } else {
        allCleared = false;
      }
    }
    const maxBase = 480 + 580 + 720 + 780;
    let grade = 'C';
    if (allCleared && catches === 0 && total >= maxBase * 1.02) grade = 'S';
    else if (total >= maxBase * 0.8) grade = 'A';
    else if (total >= maxBase * 0.52) grade = 'B';
    if (allCleared && assassinations > 0) grade = 'S';
    const titles = {
      S: '你活着走出了晚自习',
      A: '勉强算个老油条',
      B: '吃是吃到了，就是有点怂',
      C: '这个班确实是最差的一届'
    };
    const lines = {
      S: '四节课，停电、手电筒、举报、罚站，你全都熬过来了。家长会上，老师看着你，第一次不知道该说什么。',
      A: '你活到了放学，零食一口没剩。唯一的问题是，办公室的小本本上，你的名字被红笔圈了三圈。',
      B: '你吃到了，但也被抓到过、被举报过。班主任说，下次家长会一定让你妈坐第一排。',
      C: '你被红牌、罚站、举报和停电轮番教育。不过没关系，明天还有一节数学课，教室也会再黑一次。'
    };
    if (assassinations > 0) {
      titles.S = '这届学生，有点东西';
      lines.S = '四节课，停电、手电筒、举报、罚站，还有一位再也没能下课的教师。家长会上，没有人敢问你的美工刀去哪了。';
    }
    UI.finalTitle.textContent = titles[grade];
    UI.finalGrade.textContent = grade;
    UI.finalGrade.className = 'final-grade grade-' + grade;
    UI.finalScore.textContent = total;
    UI.finalEaten.textContent = eaten;
    UI.finalCatches.textContent = catches;
    UI.finalPhone.textContent = phoneScore;
    UI.finalLine.textContent = lines[grade];
    if (UI.finalSnitch) {
      UI.finalSnitch.textContent = '被同学举报 ' + reports + ' 次 · 塞零食堵嘴 ' + bribes + ' 次' +
        (given > 0 ? ' · 分零食 ' + given + ' 次' : '') +
        (allyUsed > 0 ? ' · 同桌挡举报 ' + allyUsed + ' 次' : '') +
        (refused > 0 ? ' · 同桌记仇 ' + refused + ' 次' : '') +
        (assassinations > 0 ? ' · 反杀 ' + assassinations + ' 次' : '');
    }
    UI.screenFinal.classList.remove('hidden');
    SFX.win();
  }

  /* =========================================================
     课程开始
     ========================================================= */
  function startLesson(id) {
    id = clamp(id, 1, 4);
    const L = LEVELS[id];
    const D = LD[id];
    G.lesson = id;
    G.level = L;
    G.state = 'playing';
    G.score = 0;
    G.maxHearts = L.hearts || 1;
    G.hearts = G.maxHearts;
    G.catches = 0;
    G.phoneScore = 0;
    G.phoneTime = 0;
    G.suspicion = 0;
    G.displaySusp = 0;
    G.timeLeft = L.duration;
    G.duration = L.duration;
    G.finishTimeLeft = 0;
    G.hunger = 62;
    G.maxHunger = 100;
    G.hungerRate = L.dark ? 1.0 : 0.72;
    G.growlCd = rand(6, 10);
    G.hungerWarned = false;
    G.hungerZeroWarned = false;
    G.begCd = rand(12, 20);
    G.begShown = false;
    G.begActive = false;
    G.begTimer = 0;
    G.begName = '';
    G.begText = '';
    G.ally = 0;
    G.grudge = 0;
    G.given = 0;
    G.refused = 0;
    G.allyUsed = 0;
    G.sneak = false;
    G.sneakReady = false;
    G.sneakProgress = 0;
    G.sneakWarned = false;
    G.sneakBeat = 0;
    UI.begCard.classList.add('hidden');
    UI.sneakCard.classList.add('hidden');
    UI.sneakHint.classList.add('hidden');
    G.snacks = L.snacks.map(t => ({ type: t, bites: SN[t].bites, done: 0, eaten: false }));
    G.active = 0;
    G.eatHold = 0;
    G.eatBlocked = false;
    G.wasEating = false;
    G.cheekT = 0;
    G.foodOutT = 0;
    G.allEaten = false;
    G.inputLock = 1.1;
    G.phoneUp = false;
    G.phoneConfiscated = false;
    G.catchT = 0;
    G.punishT = 0;
    G.subT = 0;
    G.warnT = 0;
    G.redCardT = 0;
    G.bubble = null;
    G.bubbleT = 0;
    G.look = { yaw: 0.1, pitch: -0.05 };
    G.warnCool = 0;
    G.patrolWarnCool = 0;
    G.npcCatchCooldown = 16;
    G.phoneT = 0;
    G.crunchT = 0;
    G.phonePelletCount = 0;
    G.resultData = null;
    G.gameOverShown = false;
    G.caughtReason = '';
    G.dark = !!L.dark;
    G.clockBase = G.dark ? 19 * 60 + 40 : 8 * 60;
    G.beamOn = false;
    G.beamOffset = 0;
    G.beamPhase = 0;
    G.beamWarnCd = 0;
    G.snitch = null;
    G.snitchName = '';
    G.snitchCd = G.dark ? rand(7, 11) : rand(10, 16);
    G.reports = 0;
    G.bribes = 0;
    G.eatT = 0;
    G.cinemaStage = -1;
    G.thunderCd = rand(12, 22);
    delete G.lessonResults[id];
    stopAllInput();

    hideScreens();
    showHUD(true);
    UI.punishOverlay.classList.add('hidden');
    UI.clickPrompt.classList.add('hidden');
    UI.phoneWrap.classList.add('hidden');
    UI.innocentFlag.classList.add('hidden');
    UI.snitchAlert.classList.add('hidden');
    UI.snitchBubble.classList.add('hidden');
    UI.cinema.classList.add('hidden');
    UI.blackout.classList.remove('on');
    UI.qte.classList.add('hidden');
    UI.slash.classList.remove('on');
    UI.screenAssassinate.classList.add('hidden');
    document.body.classList.remove('cinematic');
    document.body.classList.toggle('night', G.dark);
    if (world) { world.endEatSequence(); world.endStabSequence(); world.endSneakSequence(); }
    G.terminalCatch = false;
    G.qteActive = false;
    G.qteShown = false;
    G.qteDone = false;
    G.stabT = 0;
    G.stabStage = -1;

    world.setLesson(id);
    world.setClock(G.dark ? 19 : 8, G.dark ? 40 : 0);
    world.setDark(G.dark);
    world.setTorchSweep(0);
    world.setSnacks(L.snacks);
    world.setActiveSnack(L.snacks[0]);
    world.setNpcFrozen(false);
    world.setPhone(false);
    world.showRedCard(false);
    world.npcs.forEach((n, i) => {
      n.userData.snitchUsed = false;
      world.setNpcSnitch(i, false);
    });
    world.setView('seat');
    world.setLook(0.1, -0.05);

    resetTeacherAI(L);

    UI.hudLesson.textContent = '第 ' + id + ' 节';
    UI.hudSubject.textContent = D.subject + ' · ' + D.teacherName;
    UI.subtitleSpeaker.textContent = D.teacherName;
    renderSnackList();
    renderHearts();
    updateHUD(0);

    SFX.init();
    SFX.startAmbient();
    SFX.stopNight();
    if (G.dark) SFX.startNight();
    SFX.startMusic();
    SFX.setChalk(true);
    SFX.setTension(0);

    setTimeout(() => {
      if (G.state === 'playing' && G.lesson === id) {
        teacherSay(L.intro, { force: true, pitch: G.dark ? 0.92 : 1.05 });
      }
      if (G.dark && G.state === 'playing') {
        showBigWarn('啪——', '整栋楼都黑了', 1800);
        SFX.thunder();
        flashScreen('#cdd9ff', 0.16);
      }
    }, 700);

    if (!G.debug) requestLock();
    if (G.neighbor >= 0) {
      setTimeout(() => {
        if (G.state === 'playing') npcBubble('快看，老师开始写板书咯', 2.6);
      }, 2600);
    }
  }

  function resetTeacherAI(L) {
    T.state = 'write';
    T.timer = rand(L.write[0], L.write[1]);
    T.yaw = Math.PI;
    T.targetYaw = Math.PI;
    T.turnSpeed = 5;
    T.pos = { x: 0.25, z: -6.0 };
    T.path = [];
    T.moving = false;
    T.pauseT = 0;
    T.lookPlayer = false;
    T.speed = L.patrolSpeed;
    T.patrolsLeft = L.patrols;
    T.patrolCd = 0;
    T.chalkCd = 8;
    T.voiceCd = 0;
    T.npcCd = 16;
    T.stepT = 0;
    T.writeT = 0;
    T.enterStare = false;
    T.returning = false;

    world.setTeacherYaw(Math.PI);
    world.setTeacherHeadTurn(0);
    world.setTeacherMode('write');
    world.setTeacherMoving(false);
    world.teacher.position.set(T.pos.x, 0, T.pos.z);
    world.setNpcFrozen(false);
  }

  /* =========================================================
     老师 AI
     ========================================================= */
  function setTState(next) {
    const L = G.level;
    T.state = next;
    if (next === 'write') {
      T.timer = rand(L.write[0], L.write[1]);
      T.targetYaw = Math.PI;
      T.turnSpeed = 4;
      T.moving = false;
      T.pauseT = 0;
      world.setTeacherMode('write');
      world.setTeacherMoving(false);
      world.setTeacherHeadTurn(0);
      SFX.setChalk(true);
    } else if (next === 'telegraph') {
      T.timer = L.telegraph;
      T.targetYaw = 0;
      T.turnSpeed = 4.2;
      T.moving = false;
      world.setTeacherMode('idle');
      world.setTeacherMoving(false);
      SFX.setChalk(false);
      SFX.whoosh();
      showBigWarn('老师转身了！', '松开空格，快装乖！', Math.round((L.telegraph + 0.5) * 1000));
      if (!SFX.isMuted() && Math.random() < 0.45) {
        teacherSay(pick(L.turn), { cooldown: 5, pitch: 1.1 });
      }
    } else if (next === 'stare') {
      T.timer = rand(L.stare[0], L.stare[1]);
      T.targetYaw = 0;
      T.turnSpeed = 7;
      T.moving = false;
      T.enterStare = true;
      world.setTeacherMode('stare');
      world.setTeacherMoving(false);
      SFX.setChalk(false);
      world.setNpcFrozen(true);
      // 转头看全班
      if (G.foodOutT > 0 && !G.phoneUp) {
        G.suspicion = Math.min(100, G.suspicion + 15);
        showBigWarn('被看到了！', '腮帮子还没消下去……', 1000);
        SFX.caughtShort();
      } else if (G.phoneUp) {
        G.suspicion = Math.min(100, G.suspicion + 10);
      }
      if (G.neighbor >= 0 && Math.random() < 0.5) {
        npcBubble(pick(['莫动噻！', '老师看过来咯', '腮帮子！腮帮子！']), 1.8);
      }
    } else if (next === 'patrol') {
      T.moving = true;
      world.setTeacherMode('walk');
      world.setTeacherMoving(true);
      SFX.setChalk(false);
      if (!SFX.isMuted() && Math.random() < 0.55) {
        teacherSay('我下来看哈你们的笔记哈。', { cooldown: 6, pitch: 1.02 });
      }
      showBigWarn('老师走下讲台了！', '假装在看书，别动嘴', 1800);
    } else if (next === 'return') {
      T.moving = true;
      world.setTeacherMode('walk');
      world.setTeacherMoving(true);
      SFX.setChalk(false);
    } else if (next === 'idle') {
      T.moving = false;
      world.setTeacherMode('idle');
      world.setTeacherMoving(false);
      SFX.setChalk(false);
    }
  }

  function beginPatrol() {
    if (T.patrolsLeft <= 0) { setTState('write'); return; }
    T.patrolsLeft--;
    const aisle = Math.random() < 0.62 ? 3.45 : 1.15;
    // 如果离讲台太远，先回去再出发
    T.path = [
      { x: aisle, z: -5.2 },
      { x: aisle, z: 2.0, pause: 1.9, lookPlayer: true },
      { x: aisle, z: -5.2 },
      { x: 0.25, z: -6.0 }
    ];
    setTState('patrol');
  }

  function beginReturnToBoard() {
    T.path = [{ x: 0.25, z: -6.0 }];
    T.returning = true;
    setTState('return');
  }

  function updateTeacherAI(dt) {
    const L = G.level;
    T.voiceCd = Math.max(0, T.voiceCd - dt);
    T.chalkCd = Math.max(0, T.chalkCd - dt);
    T.npcCd = Math.max(0, T.npcCd - dt);

    // 计时器 & 状态流转
    if (T.state === 'write') {
      T.timer -= dt;
      T.writeT += dt;
      if (T.writeT > 1.3) {
        T.writeT = 0;
        world.chalkNext();
      }
      if (T.timer <= 0) {
        setTState('telegraph');
      }
    } else if (T.state === 'telegraph') {
      T.timer -= dt;
      if (T.timer <= 0) {
        setTState('stare');
      }
    } else if (T.state === 'stare') {
      T.timer -= dt;
      if (T.enterStare) {
        T.enterStare = false;
      }
      // 粉笔头警告
      if (G.state === 'playing' && G.suspicion > 62 && T.chalkCd <= 0 && !G.phoneUp) {
        T.chalkCd = 16;
        throwChalkAtPlayer();
      }
      // 老师抓了个 NPC 解围
      if (G.state === 'playing' && T.npcCd <= 0 && G.npcCatchCooldown <= 0 && G.suspicion < 68 && Math.random() < dt * 0.32) {
        npcCaughtEvent();
      }
      if (T.timer <= 0) {
        if (T.patrolsLeft > 0 && Math.random() < L.patrolChance) {
          beginPatrol();
        } else {
          setTState('write');
        }
      }
    } else if (T.state === 'patrol' || T.state === 'return') {
      updateTeacherWalk(dt);
      if (T.state === 'patrol' && T.path.length === 0) {
        T.returning = false;
        setTState('write');
      } else if (T.state === 'return' && T.path.length === 0) {
        T.returning = false;
        setTState('write');
      }
    }

    G.npcCatchCooldown = Math.max(0, G.npcCatchCooldown - dt);

    // 朝向
    if (T.state === 'stare' && G.suspicion > 72 && G.state === 'playing') {
      T.targetYaw = Math.atan2(world.PLAYER.x - T.pos.x, world.PLAYER.z - T.pos.z);
      T.turnSpeed = 3.2;
    } else if (T.state === 'stare' && G.state === 'playing') {
      T.targetYaw = 0;
    } else if (T.state === 'write') {
      T.targetYaw = Math.PI;
    } else if (T.state === 'telegraph') {
      T.targetYaw = 0;
    } else if (T.state === 'patrol' && T.pauseT > 0 && T.lookPlayer) {
      T.targetYaw = Math.atan2(world.PLAYER.x - T.pos.x, world.PLAYER.z - T.pos.z);
    }

    if (T.state === 'patrol' && T.pauseT > 0 && T.lookPlayer) {
      T.targetYaw = Math.atan2(world.PLAYER.x - T.pos.x, world.PLAYER.z - T.pos.z);
    }

    T.yaw = dampAngle(T.yaw, T.targetYaw, T.turnSpeed, dt);

    // 头部注视
    if (T.state === 'stare') {
      const ang = Math.atan2(world.PLAYER.x - T.pos.x, world.PLAYER.z - T.pos.z) - T.yaw;
      const headTarget = clamp(ang, -1.1, 1.1) * (G.suspicion > 22 ? 1 : 0.45);
      world.setTeacherHeadTurn(headTurnDamp(world, headTarget, dt));
    } else if (T.state !== 'patrol') {
      world.setTeacherHeadTurn(0);
    }

    world.teacher.position.set(T.pos.x, 0, T.pos.z);
    world.setTeacherYaw(T.yaw);
    world.setTeacherMoving(T.moving);
    world.setNpcFrozen(T.state === 'stare' || T.state === 'telegraph' || G.state === 'caught');

    // 走路脚步
    if (T.moving) {
      T.stepT -= dt;
      if (T.stepT <= 0) {
        T.stepT = 0.42;
        SFX.footstep();
      }
    }
  }

  let _headTurn = 0;
  function headTurnDamp(w, target, dt) {
    _headTurn += (target - _headTurn) * (1 - Math.exp(-8 * dt));
    return _headTurn;
  }

  function updateTeacherWalk(dt) {
    if (T.pauseT > 0) {
      T.pauseT -= dt;
      T.moving = false;
      world.setTeacherMoving(false);
      if (T.pauseT <= 0) {
        T.lookPlayer = false;
        T.path.shift();
      }
      return;
    }
    if (!T.path.length) {
      T.moving = false;
      world.setTeacherMoving(false);
      return;
    }
    const wp = T.path[0];
    const dx = wp.x - T.pos.x;
    const dz = wp.z - T.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.07) {
      if (wp.pause) {
        T.pauseT = wp.pause;
        T.lookPlayer = !!wp.lookPlayer;
        T.moving = false;
        world.setTeacherMoving(false);
        if (wp.lookPlayer) {
          showBigWarn('她就站在你旁边！', '别动，别嚼，别看她', 1500);
        }
      } else {
        T.path.shift();
      }
      return;
    }
    const step = Math.min(dist, T.speed * dt);
    T.pos.x += (dx / dist) * step;
    T.pos.z += (dz / dist) * step;
    if (!T.lookPlayer) {
      T.targetYaw = Math.atan2(dx, dz);
    }
    T.moving = true;
    T.yaw = dampAngle(T.yaw, T.targetYaw, 6, dt);
  }

  function teacherFacingPlayer() {
    const dx = world.PLAYER.x - T.pos.x;
    const dz = world.PLAYER.z + 0.36 - T.pos.z;
    const len = Math.hypot(dx, dz) || 1;
    const fx = Math.sin(T.yaw), fz = Math.cos(T.yaw);
    return (dx / len) * fx + (dz / len) * fz;
  }

  function teacherDistance() {
    return Math.hypot(world.PLAYER.x - T.pos.x, world.PLAYER.z - T.pos.z);
  }

  /* =========================================================
     玩家输入 & 偷吃
     ========================================================= */
  function updateEating(dt) {
    const s = G.active >= 0 ? G.snacks[G.active] : null;
    const can = G.state === 'playing' && G.inputLock <= 0 && !G.phoneUp && !G.eatBlocked && s && !s.eaten;
    const want = !!(can && IN.eat && !IN.innocent);

    if (want) {
      const data = SN[s.type];
      const biteTime = data.eatTime / data.bites;
      G.biteTime = biteTime;
      G.eatHold += dt;
      G.crunchT = (G.crunchT || 0) - dt;
      if (G.crunchT <= 0) {
        G.crunchT = rand(0.28, 0.46);
        playCrunch(data);
      }
      if (G.eatHold >= biteTime) {
        G.eatHold = 0;
        doBite(s);
      }
    } else {
      G.eatHold = Math.max(0, G.eatHold - dt * 1.4);
    }

    // 咀嚼进度
    const frac = (want && s) ? clamp(G.eatHold / (G.biteTime || 1), 0, 1) : 0;
    UI.chewMeter.classList.toggle('hidden', !want);
    if (want) {
      UI.chewFill.style.width = (frac * 100).toFixed(0) + '%';
      UI.chewText.textContent = '咀嚼中 · ' + SN[s.type].name;
    }

    world.setEating(want);
    if (G.wasEating && !want) {
      G.cheekT = 1.25;
      G.foodOutT = 0.24;
      world.setEating(false);
    }
    if (want) {
      G.foodOutT = 0.24;
      G.cheekT = 0;
    }
    G.foodOutT = Math.max(0, G.foodOutT - dt);
    G.cheekT = Math.max(0, G.cheekT - dt);
    G.wasEating = want;
    G.visEat = want || G.foodOutT > 0;

    // 装乖
    const innocent = IN.innocent && !want && G.state === 'playing';
    UI.innocentFlag.classList.toggle('hidden', !innocent);
  }

  function playCrunch(data) {
    if (data.type === 'milktea') SFX.sip();
    else if (data.type === 'chips') SFX.crunch('chips');
    else if (data.type === 'noodle') SFX.crunch('noodle');
    else if (data.type === 'banana') SFX.crunch('banana');
    else SFX.crunch('spicy');
  }

  function updateHunger(dt) {
    if (G.state !== 'playing') return;
    G.hunger = Math.max(0, G.hunger - G.hungerRate * dt);
    if (G.hunger < 30 && !G.hungerWarned) {
      G.hungerWarned = true;
      toast('肚子饿了……吃零食能回饥饿值', 'warn');
    }
    if (G.hunger <= 0 && !G.hungerZeroWarned) {
      G.hungerZeroWarned = true;
      toast('饿得手都抖了……再不吃要出事', 'bad');
    }
    if (G.hunger < 32) {
      G.growlCd -= dt;
      if (G.growlCd <= 0) {
        G.growlCd = G.hunger < 12 ? rand(4.5, 7) : rand(8, 13);
        stomachGrowl();
      }
    } else {
      G.growlCd = Math.max(G.growlCd, 4);
    }
  }

  function stomachGrowl() {
    if (G.state !== 'playing') return;
    SFX.growl();
    const strong = G.hunger < 12;
    G.suspicion = Math.min(100, G.suspicion + (strong ? 14 : 8));
    toast(strong ? '肚子叫得太响了……她肯定听到了' : '肚子咕噜叫了一声……', 'bad');
    if (G.neighbor >= 0 && rand(0, 10) < 5) {
      npcBubble(pick(['你肚子叫得比老师讲课还响……', '兄弟，你饿惨了嘛？', '莫叫了，老师要转过来了！']), 1.8);
    }
    world.shake(strong ? 0.025 : 0.01);
    if (strong) {
      showBigWarn('咕——', G.dark ? '黑暗里，这声特别响' : '老师好像听到了', 1200);
    }
  }

  const BEG_LINES = [
    '兄弟，分我一口嘛。我晚饭都没吃，保证不举报你。',
    '你那个辣条给我闻一下嘛，就一口。',
    '给点吃的噻，我帮你看到起老师。',
    '我饿得心头慌，你忍心看我饿死嘛？'
  ];

  function updateBeg(dt) {
    if (G.state !== 'playing') return;
    if (G.begActive) {
      G.begTimer -= dt;
      UI.begFill.style.width = Math.max(0, (G.begTimer / G.begMax) * 100).toFixed(1) + '%';
      if (G.begTimer <= 0) resolveBeg(false);
      return;
    }
    if (G.begShown) return;
    G.begCd -= dt;
    if (G.begCd <= 0 && T.state === 'write' && !G.snitch && !G.phoneUp &&
        G.suspicion < 55 && G.timeLeft > 18 && G.snacks.some(s => !s.eaten)) {
      startBeg();
    }
  }

  function startBeg() {
    if (G.begActive || G.begShown || G.state !== 'playing') return;
    G.begShown = true;
    G.begActive = true;
    G.begTimer = 5.0;
    G.begMax = 5.0;
    G.begName = snitchNameOf(G.neighbor >= 0 ? G.neighbor : 0);
    G.begText = pick(BEG_LINES);
    UI.begName.textContent = '同桌 ' + G.begName;
    UI.begText.textContent = '“' + G.begText + '”';
    UI.begFill.style.width = '100%';
    UI.begCard.classList.remove('hidden');
    toast('同桌在扯你袖子……', 'warn');
    SFX.ui();
  }

  function resolveBeg(give) {
    if (!G.begActive) return;
    G.begActive = false;
    UI.begCard.classList.add('hidden');
    const canGive = G.snacks.some(s => !s.eaten);
    if (give && canGive) {
      G.given++;
      G.ally = 1;
      G.hunger = Math.max(0, G.hunger - 12);
      npcBubble('要得！以后老师转过来，我帮你咳嗽。', 2.4);
      toast('你分了他一口 · 饥饿 -12 · 同桌欠你一个人情', 'good');
      SFX.ui();
    } else {
      G.refused++;
      G.grudge = 1;
      npcBubble('小气鬼……你等到起。', 2.2);
      toast(give ? '你也没得啥子可给了……同桌记仇了' : '你拒绝了他……同桌记仇了', 'bad');
      SFX.ui();
    }
    G.snitchCd = Math.min(G.snitchCd, 8);
  }

  function hideBeg(shown) {
    G.begActive = false;
    if (shown) G.begShown = true;
    if (UI.begCard) UI.begCard.classList.add('hidden');
  }

  function canStartSneak() {
    return !!(world && G.dark && G.state === 'playing' && !G.sneak && !G.snitch && !G.phoneUp &&
      !G.begActive && G.inputLock <= 0 && T.state === 'write' && T.timer > 3.0 &&
      !G.beamOn && G.suspicion < 65);
  }

  function startSneak() {
    if (!canStartSneak()) return false;
    G.sneak = true;
    G.sneakReady = false;
    G.sneakProgress = 0;
    G.sneakWarned = false;
    G.sneakBeat = 0;
    IN.eat = false;
    IN.keys.KeyW = false;
    closePhone();
    world.setEating(false);
    UI.chewMeter.classList.add('hidden');
    UI.begCard.classList.add('hidden');
    UI.sneakCard.classList.remove('hidden');
    UI.sneakHint.classList.add('hidden');
    UI.sneakFill.style.width = '0%';
    UI.sneakStatus.textContent = '按住 W 前进 · 松开停 · R 退回';
    UI.sneakRisk.textContent = '她还在写';
    world.startSneakSequence();
    SFX.heartBeat();
    showBigWarn('你从座位上溜了下来', '按住 W 摸黑前进 · R 退回', 1800);
    return true;
  }

  function updateSneak(dt) {
    if (!G.sneak) return;
    G.sneakBeat -= dt;
    if (G.sneakBeat <= 0) {
      G.sneakBeat = 1.15;
      SFX.heartBeat();
    }
    if (G.sneakReady) {
      if (T.state !== 'write') { sneakFail(); return; }
      UI.sneakStatus.textContent = '到了！按 Q 刺杀';
      UI.sneakRisk.textContent = '动手';
      return;
    }
    if (T.state === 'write') {
      if (IN.keys.KeyW) G.sneakProgress = Math.min(1, G.sneakProgress + dt * 0.42);
      world.setSneakProgress(G.sneakProgress);
      UI.sneakFill.style.width = (G.sneakProgress * 100).toFixed(1) + '%';
      UI.sneakStatus.textContent = '按住 W 前进 · 松开停 · R 退回';
      UI.sneakRisk.textContent = '她还在写';
      if (G.sneakProgress >= 1) {
        G.sneakProgress = 1;
        G.sneakReady = true;
        UI.sneakStatus.textContent = '到了！按 Q 刺杀';
        UI.sneakRisk.textContent = '动手';
        SFX.heartBeat();
      }
    } else if (T.state === 'telegraph') {
      if (!G.sneakWarned) {
        G.sneakWarned = true;
        showBigWarn('粉笔声停了！', '按 R 退回', 1200);
      }
      UI.sneakStatus.textContent = '粉笔声停了！按 R 退回';
      UI.sneakRisk.textContent = '危险';
    } else {
      sneakFail();
    }
  }

  function sneakAbort() {
    if (!G.sneak) return;
    G.sneak = false;
    G.sneakReady = false;
    G.sneakProgress = 0;
    UI.sneakCard.classList.add('hidden');
    if (world) world.endSneakSequence();
    toast('你缩回座位，她没有回头', '');
  }

  function sneakFail() {
    if (!G.sneak) return;
    G.sneak = false;
    G.sneakReady = false;
    G.sneakProgress = 0;
    UI.sneakCard.classList.add('hidden');
    if (world) world.endSneakSequence();
    catchPlayer('sneak');
  }

  function sneakStab() {
    if (!G.sneak || !G.sneakReady) return;
    G.sneak = false;
    G.sneakReady = false;
    G.sneakProgress = 0;
    UI.sneakCard.classList.add('hidden');
    if (world) world.endSneakSequence();
    startAssassination(true);
  }

  function doBite(s) {
    const data = SN[s.type];
    s.done = Math.min(s.bites, s.done + 1);
    const pts = Math.round(data.score / s.bites);
    G.score += pts;
    G.hunger = Math.min(G.maxHunger, G.hunger + (HUNGER_RESTORE[s.type] || 4));
    if (data.type === 'milktea') SFX.gulp();
    SFX.coin();
    world.bite();
    G.crunches++;
    renderSnackList();

    if (G.crunches % 2 === 0) toast('+' + pts + ' 真香', 'good');
    if (s.done >= s.bites) finishSnack(s);
  }

  function finishSnack(s) {
    s.eaten = true;
    s.done = s.bites;
    G.eatHold = 0;
    G.eatBlocked = true;
    G.score += 25;
    world.removeSnack(s.type);
    renderSnackList();
    SFX.stamp();

    const left = G.snacks.filter(x => !x.eaten);
    if (left.length === 0) {
      G.active = -1;
      G.allEaten = true;
      G.finishTimeLeft = G.timeLeft;
      world.setActiveSnack(null);
      world.setEating(false);
      toast('全吃完了！可以摸鱼到下课', 'good');
      G.score += 30;
      teacherSay(G.level.relax, { cooldown: 8, pitch: 1.04 });
      setTimeout(() => {
        if (G.state === 'playing') {
          showBigWarn('目标完成！', '试着偷偷玩会儿手机加分', 2200);
        }
      }, 600);
    } else {
      const next = G.snacks.findIndex(x => !x.eaten);
      const nextData = SN[G.snacks[next].type];
      selectSnack(next, true);
      toast('吃完了 +25 · 下一份：' + nextData.emoji + nextData.name, 'good');
    }
    renderHearts();
    updateHUD(0);
  }

  function selectSnack(idx, silent) {
    if (G.state !== 'playing' && !silent) return;
    if (idx < 0 || idx >= G.snacks.length) return;
    if (G.snacks[idx].eaten) {
      if (!silent) toast('这份已经吃完了', 'bad');
      return;
    }
    if (G.active === idx) return;
    G.active = idx;
    G.eatHold = 0;
    world.setActiveSnack(G.snacks[idx].type);
    renderSnackList();
    if (!silent) SFX.ui();
  }

  function snitchNameOf(idx) { return NPC_NAMES[idx % NPC_NAMES.length]; }

  function startSnitch() {
    if (G.snitch || G.state !== 'playing') return;
    if (G.ally > 0) {
      G.ally = 0;
      G.allyUsed++;
      G.snitchCd = rand(14, 20);
      const helper = G.begName || snitchNameOf(G.neighbor);
      npcBubble('老师！他刚才在问我题，没偷吃！', 2.4);
      toast(helper + '帮你打了掩护，举报被压下去了', 'good');
      SFX.bribe();
      return;
    }
    let best = -1, bestD = 999, forced = false;
    if (G.grudge > 0 && G.neighbor >= 0) {
      const n = world.npcs[G.neighbor];
      if (n && n.userData.slot && !n.userData.sleeping && !n.userData.snitchUsed) {
        best = G.neighbor;
        forced = true;
      }
    }
    if (best < 0) {
      world.npcs.forEach((n, i) => {
        const u = n.userData;
        if (!u.slot || u.sleeping || u.snitchUsed) return;
        if (u.slot.row < world.PLAYER.row - 1) return;
        if (Math.abs(u.slot.col - world.PLAYER.col) > 2) return;
        const d = Math.hypot(u.slot.x - world.PLAYER.x, u.slot.z + 0.28 - world.PLAYER.z);
        if (d < bestD) { bestD = d; best = i; }
      });
    }
    if (G.grudge > 0) G.grudge = 0;
    if (best < 0) { G.snitchCd = 30; return; }
    world.npcs[best].userData.snitchUsed = true;
    world.setNpcSnitch(best, true);
    const dur = forced ? (G.dark ? 1.9 : 2.3) : (G.dark ? 2.3 : 2.9);
    G.snitch = { npc: best, t: dur, max: dur };
    G.snitchName = snitchNameOf(best);
    const nu = world.npcs[best].userData;
    const seat = nu.slot ? (nu.slot.row === world.PLAYER.row ? '同桌 ' : (nu.slot.row < world.PLAYER.row ? '前排 ' : '后排 ')) : '';
    G.snitchSeat = seat;
    UI.snitchText.textContent = seat + G.snitchName + (forced ? ' 记着刚才的事，举手了！' : ' 要举手举报！');
    UI.snitchFill.style.width = '100%';
    UI.snitchAlert.classList.remove('hidden');
    UI.snitchBubble.classList.remove('hidden');
    UI.snitchBubble.textContent = forced ? '老师！就是他！' : '老师！他/她偷吃！';
    SFX.snitch();
    showBigWarn(G.dark ? '黑暗里有人举起了手' : '有人要举报你！', forced ? '同桌记仇了 · 按 E 塞零食' : '按 E 塞零食堵嘴', 1600);
  }

  function bribeSnitch() {
    if (!G.snitch) return false;
    const idx = G.snitch.npc;
    const name = G.snitchName;
    world.setNpcSnitch(idx, false);
    G.snitch = null;
    G.bribes++;
    G.score = Math.max(0, G.score - 25);
    UI.snitchAlert.classList.add('hidden');
    UI.snitchBubble.classList.add('hidden');
    SFX.bribe();
    UI.bigWarn.classList.add('hidden');
    G.warnT = 0;
    toast('塞了一包零食，堵住了' + name + '的嘴 -25', 'good');
    if (idx === G.neighbor) npcBubble('……下不为例哈。', 2.2);
    G.snitchCd = rand(G.dark ? 15 : 20, G.dark ? 24 : 32);
    return true;
  }

  function reportSnitch() {
    if (!G.snitch) return;
    const idx = G.snitch.npc;
    const name = G.snitchName;
    world.setNpcSnitch(idx, false);
    G.snitch = null;
    G.reports++;
    UI.snitchAlert.classList.add('hidden');
    UI.snitchBubble.classList.add('hidden');
    SFX.report();
    G.suspicion = Math.min(100, G.suspicion + 34);
    if (T.state === 'write' || T.state === 'telegraph') {
      setTState('stare');
      T.timer = 3.4;
    }
    showBigWarn('被同学举报了！', name + ' 举手了', 1800);
    teacherSay(G.dark ? '……有人举报你。把手从桌洞里拿出来哈。' : '有人举报你上课偷嘴。', {
      force: true, angry: true, pitch: G.dark ? 0.9 : 1.03
    });
    G.beamWarnCd = 4;
    G.snitchCd = rand(22, 34);
  }

  function updateSnitchBubble() {
    if (!G.snitch) { UI.snitchBubble.classList.add('hidden'); return; }
    const head = world.getNpcHead(G.snitch.npc);
    if (!head) return;
    head.y += 0.18;
    const p = world.project(head);
    const camPos = world.camera.position;
    const fwd = new THREE.Vector3();
    world.camera.getWorldDirection(fwd);
    const dot = (head.x - camPos.x) * fwd.x + (head.y - camPos.y) * fwd.y + (head.z - camPos.z) * fwd.z;
    if (dot < 0.2 || !p.visible) { UI.snitchBubble.classList.add('hidden'); return; }
    UI.snitchBubble.classList.remove('hidden');
    UI.snitchBubble.style.left = p.x + 'px';
    UI.snitchBubble.style.top = (p.y - 14) + 'px';
  }

  function updateSnitch(dt) {
    if (G.state !== 'playing') return;
    if (G.snitch) {
      G.snitch.t -= dt;
      UI.snitchFill.style.width = Math.max(0, (G.snitch.t / G.snitch.max) * 100).toFixed(1) + '%';
      updateSnitchBubble();
      if (G.snitch.t <= 0) reportSnitch();
      return;
    }
    if (T.state === 'write' && (G.visEat || G.phoneUp)) {
      G.snitchCd -= dt * (G.dark ? 1.35 : 1);
      if (G.snitchCd <= 0) {
        startSnitch();
        if (!G.snitch) G.snitchCd = 20;
      }
    }
  }

  function updateBeam(dt) {
    if (!G.dark) { G.beamOn = false; return; }
    G.beamPhase += dt;
    let offset = 0;
    if (T.state === 'stare' || T.state === 'telegraph') {
      offset = Math.sin(G.beamPhase * 0.95) * 0.52;
    } else if (T.state === 'patrol' || T.state === 'return') {
      offset = Math.sin(G.beamPhase * 1.55) * 0.4;
    }
    G.beamOffset = offset;
    world.setTorchSweep(offset);
    const ang = Math.atan2(world.PLAYER.x - T.pos.x, world.PLAYER.z + 0.2 - T.pos.z);
    let diff = ang - (T.yaw + offset);
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const dist = teacherDistance();
    G.beamOn = Math.abs(diff) < 0.19 && dist < 14;
    G.beamWarnCd = Math.max(0, G.beamWarnCd - dt);
    if (G.beamOn && G.beamWarnCd <= 0 && G.state === 'playing') {
      G.beamWarnCd = 4.2;
      showBigWarn('手电筒照到你了！', '别动，别嚼！', 1050);
      SFX.caughtShort();
    }
  }

  function updateSuspicion(dt) {
    const s = G.active >= 0 ? G.snacks[G.active] : null;
    const data = s ? SN[s.type] : null;
    const noise = data ? data.noise : 0.8;
    const eating = G.visEat;
    const phone = G.phoneUp;
    const cheek = G.cheekT > 0;
    const innocent = IN.innocent && !eating;
    const dist = teacherDistance();
    const facing = teacherFacingPlayer();
    let rate = 0;

    if (G.dark) {
      // 停电：主要靠手电筒的光柱发现你
      if (phone) {
        rate += G.beamOn ? 170 : (T.state === 'write' ? 8 : 15);
      } else if (eating) {
        if (G.beamOn) rate += 130 + 24 * noise;
        else if (T.state === 'write') rate += 4.2 * noise;
        else rate += 5 + 3 * noise;
      } else {
        rate -= innocent ? 36 : 21;
      }
      if (cheek && !eating && !phone) rate += G.beamOn ? 6 : 2;
    } else if (phone) {
      if (T.state === 'write') rate += 7;
      else if (T.state === 'telegraph') rate += 16;
      else if (T.state === 'stare') rate += 24 + (G.suspicion > 40 ? 14 : 0);
      else if (T.state === 'patrol') rate += (facing > 0.35 && dist < 7) ? (dist < 3.5 ? 85 : 46) : 6;
    } else if (eating) {
      if (T.state === 'write') rate += 2.8 * noise;
      else if (T.state === 'telegraph') rate += 8 * noise;
      else if (T.state === 'stare') rate += 26 + 20 * noise;
      else if (T.state === 'patrol') {
        rate += (facing > 0.3 && dist < 7) ? (dist < 3 ? 95 : 52 + 18 * noise) : 2 * noise;
      }
    } else {
      if (T.state === 'write') rate -= 12;
      else if (T.state === 'telegraph') rate -= innocent ? 30 : 12;
      else if (T.state === 'stare') rate -= innocent ? 42 : 17;
      else if (T.state === 'patrol') rate -= 20;
    }

    if (cheek && !eating && !phone) {
      if (T.state === 'stare' || T.state === 'telegraph') rate += innocent ? 2 : 7;
    }

    if (T.state === 'patrol' && T.pauseT > 0 && T.lookPlayer) {
      if (phone && dist < 3.2) rate += 130;
      if (eating && dist < 2.4) rate += 130;
    }

    G.suspicion = clamp(G.suspicion + rate * dt, 0, 100);

    // 老师近身，直接抓
    if (T.state === 'patrol' && T.lookPlayer && T.pauseT > 0 && dist < 1.9) {
      if (eating || phone) {
        G.suspicion = 100;
      }
    }

    if (G.suspicion >= 100) {
      catchPlayer(phone ? 'phone' : 'eat');
    }

    // 紧张度音效
    const tension = (G.suspicion / 100) * (G.dark ? (G.beamOn ? 1 : 0.65) : (T.state === 'stare' ? 1 : 0.45));
    SFX.setTension(tension);

    // 巡逻靠近提醒
    if (T.state === 'patrol' && dist < 4.2 && facing > 0.3 && G.patrolWarnCool <= 0 && G.state === 'playing') {
      G.patrolWarnCool = 4;
      showBigWarn('老师走过来了！', eating ? '快停嘴！' : '低头看书', 1200);
    }
    G.patrolWarnCool = Math.max(0, G.patrolWarnCool - dt);
  }

  /* =========================================================
     手机
     ========================================================= */
  function openPhone() {
    if (G.state !== 'playing' || G.inputLock > 0) return;
    if (G.phoneConfiscated) {
      toast('手机已经被没收了', 'bad');
      return;
    }
    if (G.phoneUp) return;
    G.phoneUp = true;
    G.eatHold = 0;
    G.eatBlocked = false;
    UI.chewMeter.classList.add('hidden');
    world.setEating(false);
    world.setPhone(true);
    UI.phoneWrap.classList.remove('hidden');
    phoneGame.start();
    SFX.phoneToggle(true);
    if (!SFX.isMuted() && Math.random() < 0.35) {
      teacherSay('是哪个在底下耍手机？', { cooldown: 10, pitch: 1.1 });
    }
  }

  function closePhone() {
    if (!G.phoneUp) return;
    G.phoneUp = false;
    world.setPhone(false);
    UI.phoneWrap.classList.add('hidden');
    if (phoneGame) phoneGame.stop();
    SFX.phoneToggle(false);
  }

  function onPhoneEat() {
    G.score += 12;
    G.phoneScore += 12;
    G.phonePelletCount++;
    SFX.coin();
    if (G.phonePelletCount % 2 === 0) toast('+12 摸鱼', 'phone');
  }

  function onPhoneDie() {
    // 小蛇死了，手机还在手上
    if (G.state === 'playing' && G.phoneUp) {
      toast('小蛇撞墙了，快重开', 'bad');
    }
  }

  /* =========================================================
     抓到 / 罚站 / 结束
     ========================================================= */
  function catchPlayer(reason) {
    if (G.state !== 'playing') return;
    if (G.sneak) {
      G.sneak = false;
      G.sneakReady = false;
      G.sneakProgress = 0;
      UI.sneakCard.classList.add('hidden');
      if (world) world.endSneakSequence();
    }
    G.state = 'caught';
    const terminal = G.hearts <= 0;
    G.terminalCatch = terminal;
    G.catchT = terminal ? 3.4 : 2.5;
    G.qteActive = false;
    G.qteShown = false;
    G.qteDone = false;
    if (UI.qte) UI.qte.classList.add('hidden');
    G.caughtReason = reason;
    IN.eat = false;
    G.eatHold = 0;
    G.suspicion = 100;
    if (!terminal) G.hearts = Math.max(0, G.hearts - 1);
    G.catches++;
    G.score = Math.max(0, G.score - 60);

    if (reason === 'phone') {
      G.phoneConfiscated = true;
    }
    closePhone();
    hideBeg(true);
    world.setEating(false);
    UI.chewMeter.classList.add('hidden');
    UI.subtitle.classList.add('hidden');
    G.subT = 0;
    clearSnitchUI();
    world.setTeacherMode('stare');
    world.setTeacherMoving(false);
    T.state = 'stare';
    T.moving = false;
    T.targetYaw = Math.atan2(world.PLAYER.x - T.pos.x, world.PLAYER.z - T.pos.z);
    T.turnSpeed = 6;
    T.timer = 3;
    world.setNpcFrozen(true);
    SFX.setChalk(false);
    SFX.caught();
    SFX.stopMusic();
    world.shake(0.05);
    flashScreen(reason === 'phone' ? '#d63a26' : '#c63f2e', 0.5);

    const lines = reason === 'phone' ? [G.level.phone]
      : reason === 'sneak' ? ['你站起来干啥子？以为黑了我就看不到你嗦？']
      : G.level.caught;
    const line = terminal
      ? (G.dark ? '逮到你了。黑灯瞎火的，哪个都看不到——这回，轮到我吃你咯。' : '逮到你了。这回，可不是罚站哦。')
      : pick(lines);
    showBigWarn(
      reason === 'phone' ? '手机被发现了！' : '被发现了！',
      terminal ? '这次不是罚站……' : '红牌警告 · 罚站',
      2300
    );
    teacherSay(line, { force: true, angry: true, pitch: G.dark ? 0.88 : 1.02 });
    toast(terminal ? '她把红牌扔了，朝你走了过来……' : (reason === 'phone' ? '-60 分 · 手机没收' : '-60 分 · 红牌一张'), 'bad');

    renderHearts();
    UI.innocentFlag.classList.add('hidden');
    if (!terminal && G.hearts <= 0) {
      setTimeout(() => {
        if (G.state === 'caught' || G.state === 'punish' || G.state === 'playing') {
          toast('红牌用完了……再被她逮到，就不是罚站了', 'bad');
        }
      }, 1200);
    }
  }

  function clearSnitchUI() {
    if (G.snitch) {
      world.setNpcSnitch(G.snitch.npc, false);
      G.snitch = null;
    }
    UI.snitchAlert.classList.add('hidden');
    UI.snitchBubble.classList.add('hidden');
  }

  function startPunish() {
    G.state = 'punish';
    clearSnitchUI();
    G.punishT = G.punishMax;
    G.suspicion = 0;
    G.cheekT = 0;
    G.foodOutT = 0;
    G.eatHold = 0;
    closePhone();
    UI.chewMeter.classList.add('hidden');
    UI.subtitle.classList.add('hidden');
    G.subT = 0;
    world.setView('punish');
    world.setNpcFrozen(false);
    UI.punishOverlay.classList.remove('hidden');
    UI.punishTime.textContent = String(Math.ceil(G.punishT));
    SFX.setChalk(false);
    beginReturnToBoard();
    if (G.neighbor >= 0) {
      setTimeout(() => {
        if (G.state === 'punish') npcBubble('兄弟，帮你看到起零食哈', 2.4);
      }, 900);
    }
  }

  function endPunish() {
    G.state = 'playing';
    G.punishT = 0;
    G.suspicion = 0;
    G.cheekT = 0;
    G.foodOutT = 0;
    G.inputLock = 0.6;
    G.look = { yaw: 0.1, pitch: -0.05 };
    world.setView('seat');
    world.setLook(0.1, -0.05);
    UI.punishOverlay.classList.add('hidden');
    toast('腿都站麻了…… 回去接着吃', 'good');
    if (!G.debug) requestLock();
    if (T.state === 'return' && T.path.length === 0) setTState('write');
  }

  function endLesson() {
    if (G.state === 'result' || G.state === 'gameover' || G.state === 'final') return;
    G.state = 'result';
    const cleared = G.allEaten;
    const timeBonus = cleared ? Math.round(G.finishTimeLeft) * 2 : 0;
    const finalScore = G.score + timeBonus;
    G.score = finalScore;

    const eaten = G.snacks.filter(x => x.eaten).length;
    const total = G.snacks.length;
    let grade = 'C';
    if (cleared) {
      if (G.catches === 0 && finalScore >= G.level.base * 0.98) grade = 'S';
      else if (G.catches <= 1 && finalScore >= G.level.base * 0.76) grade = 'A';
      else grade = 'B';
    }
    const gradeLabels = { S: '学神级摸鱼', A: '老油条', B: '还行', C: '没吃尽兴' };
    let title, line;
    if (cleared && G.catches === 0) {
      title = '零被抓，你是传奇';
      line = '一整节课，老师连你嘴角的油都没看见。下课铃响的时候，你甚至有点舍不得。';
    } else if (cleared) {
      title = '吃是吃完了，人也站麻了';
      line = '你把最后一口咽下去，正好赶上老师转身。值了，但下次记得别贪最后一口。';
    } else {
      title = '下课铃响了，你还没吃完';
      line = '桌兜里还剩好几包。老师临走前看了你一眼，那眼神的意思是：下节课继续。';
    }

    const data = {
      lesson: G.lesson,
      score: finalScore,
      eaten, total,
      catches: G.catches,
      phoneScore: G.phoneScore,
      reports: G.reports,
      bribes: G.bribes,
      given: G.given,
      refused: G.refused,
      allyUsed: G.allyUsed,
      cleared,
      grade,
      gradeLabel: gradeLabels[grade],
      title, line,
      timeBonus
    };
    G.lessonResults[G.lesson] = data;
    G.resultData = data;

    closePhone();
    clearSnitchUI();
    hideQTE();
    hideBeg(true);
    G.sneak = false;
    G.sneakReady = false;
    G.sneakProgress = 0;
    UI.sneakCard.classList.add('hidden');
    if (world) world.endSneakSequence();
    UI.slash.classList.remove('on');
    unlockPointer();
    stopAllInput();
    SFX.stopNight();
    UI.chewMeter.classList.add('hidden');
    UI.subtitle.classList.add('hidden');
    UI.innocentFlag.classList.add('hidden');
    G.subT = 0;
    SFX.stopSpeech();
    SFX.bell();
    SFX.setChalk(false);
    SFX.stopMusic();
    SFX.setTension(0);
    world.setTeacherMode('idle');
    world.setTeacherMoving(false);
    world.setNpcFrozen(false);
    T.state = 'idle';
    T.moving = false;
    UI.punishOverlay.classList.add('hidden');
    showResult(data);
  }

  /* =========================================================
     事件
     ========================================================= */
  function throwChalkAtPlayer() {
    if (!world) return;
    const target = new THREE.Vector3(world.PLAYER.x, 1.2, world.PLAYER.z + 0.2);
    world.throwChalk(target, () => {
      SFX.caughtShort();
      world.shake(0.035);
      flashScreen('#ffffff', 0.28);
      G.suspicion = Math.min(100, G.suspicion + 7);
      toast('啪！粉笔头正中脑门', 'bad');
      showBigWarn('粉笔头警告', '她在提醒你了', 1100);
    });
    teacherSay(G.level.chalk, { cooldown: 5, pitch: 1.0 });
  }

  function npcCaughtEvent() {
    let front = [];
    world.npcs.forEach((n, i) => {
      if (n.userData.slot && n.userData.slot.row <= 1 && n.userData.slot.col >= 1 && n.userData.slot.col <= 2) front.push(i);
    });
    if (!front.length) {
      world.npcs.forEach((n, i) => {
        if (n.userData.slot && n.userData.slot.row < world.PLAYER.row) front.push(i);
      });
    }
    if (!front.length) return;
    const idx = pick(front);
    const npc = world.npcs[idx];
    T.npcCd = rand(26, 40);
    G.npcCatchCooldown = 8;
    world.setNpcCaught(idx, 4.5);
    const head = world.getNpcHead(idx);
    world.showRedCard(true, head.x, head.y - 0.1, head.z);
    G.redCardT = 4.5;
    G.suspicion = Math.max(0, G.suspicion - 18);
    teacherSay(pick(G.level.npc), { cooldown: 6, pitch: 1.03 });
    toast('有人替你挨骂了 😌', 'good');
  }

  function teacherSay(text, opts) {
    if (!text) return;
    opts = opts || {};
    if (opts.cooldown && T.voiceCd > 0) {
      // 字幕还可以显示，语音先不抢
      opts = Object.assign({}, opts, { silent: true });
    }
    T.voiceCd = Math.max(T.voiceCd, opts.cooldown || 2.5);
    UI.subtitleSpeaker.textContent = LD[G.lesson].teacherName;
    UI.subtitleText.textContent = text;
    UI.subtitle.classList.remove('hidden');
    UI.subtitle.classList.toggle('angry', !!opts.angry);
    G.subT = opts.force ? 3.6 : 2.8;
    if (!opts.silent && !SFX.isMuted() && G.voiceOn) {
      SFX.say(text, { pitch: opts.pitch == null ? 1.1 : opts.pitch, rate: 0.96 });
    }
  }

  function updateSubtitle(dt) {
    if (G.subT > 0) {
      G.subT -= dt;
      if (G.subT <= 0) UI.subtitle.classList.add('hidden');
    }
    if (G.warnT > 0) {
      G.warnT -= dt;
      if (G.warnT <= 0) UI.bigWarn.classList.add('hidden');
    }
  }

  function showBigWarn(main, sub, ms) {
    UI.bigWarn.innerHTML = '<span>' + main + '</span>' + (sub ? '<small>' + sub + '</small>' : '');
    UI.bigWarn.classList.remove('hidden');
    G.warnT = (ms || 1600) / 1000;
  }

  function npcBubble(text, dur) {
    if (G.neighbor < 0) return;
    G.bubble = { idx: G.neighbor, text };
    G.bubbleT = dur || 2;
    UI.npcBubbleText.textContent = text;
    UI.npcBubble.classList.remove('hidden');
  }

  function updateBubble(dt) {
    if (!G.bubble) return;
    G.bubbleT -= dt;
    if (G.bubbleT <= 0) {
      UI.npcBubble.classList.add('hidden');
      G.bubble = null;
      return;
    }
    const head = world.getNpcHead(G.bubble.idx);
    if (!head) { UI.npcBubble.classList.add('hidden'); return; }
    head.y += 0.18;
    const p = world.project(head);
    const camPos = world.camera.position;
    const dx = head.x - camPos.x, dy = head.y - camPos.y, dz = head.z - camPos.z;
    const fwd = new THREE.Vector3();
    world.camera.getWorldDirection(fwd);
    const dot = dx * fwd.x + dy * fwd.y + dz * fwd.z;
    if (dot < 0.2 || !p.visible) {
      UI.npcBubble.classList.add('hidden');
      return;
    }
    UI.npcBubble.classList.remove('hidden');
    UI.npcBubble.style.left = p.x + 'px';
    UI.npcBubble.style.top = (p.y - 12) + 'px';
  }

  function toast(text, cls) {
    const el = document.createElement('div');
    el.className = 'toast ' + (cls || '');
    el.textContent = text;
    UI.toasts.appendChild(el);
    while (UI.toasts.children.length > 5) UI.toasts.removeChild(UI.toasts.firstChild);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1400);
  }

  function flashScreen(color, opacity) {
    UI.flash.style.background = color;
    UI.flash.style.opacity = String(opacity);
    setTimeout(() => { UI.flash.style.opacity = '0'; }, 70);
  }

  /* =========================================================
     被吃掉
     ========================================================= */
  /* =========================================================
     反杀：被拎起来的那一瞬间
     ========================================================= */
  const STAB_LINES = [
    [0.05, '你摸到了桌兜里的美工刀。'],
    [0.4, '（一刀）'],
    [0.95, null],
    [1.8, '她倒下了。'],
    [2.5, '教室里只剩下你的呼吸声。']
  ];

  function startQTE() {
    if (G.qteActive || G.qteDone || G.state !== 'caught') return;
    G.qteActive = true;
    G.qteShown = true;
    UI.qte.classList.remove('hidden');
    UI.qteFill.style.width = '100%';
    showBigWarn('反杀机会！', '按 Q 用美工刀刺她', 1600);
    SFX.qte();
  }

  function hideQTE() {
    G.qteActive = false;
    G.qteDone = true;
    if (UI.qte) UI.qte.classList.add('hidden');
  }

  function tryAssassinate() {
    if (G.state !== 'caught' || !G.qteActive) return;
    hideQTE();
    startAssassination();
  }

  function startAssassination(fromSneak) {
    if (G.state !== 'caught' && !fromSneak) return;
    if (fromSneak) {
      G.sneak = false;
      G.sneakReady = false;
      G.sneakProgress = 0;
      UI.sneakCard.classList.add('hidden');
      if (world) world.endSneakSequence();
    }
    G.state = 'assassinate';
    G.stabT = 0;
    G.stabStage = -1;
    hideQTE();
    closePhone();
    clearSnitchUI();
    stopAllInput();
    unlockPointer();
    document.body.classList.add('cinematic');
    UI.hud.classList.add('hidden');
    UI.punishOverlay.classList.add('hidden');
    UI.cinema.classList.remove('hidden');
    UI.cinemaSub.textContent = '';
    UI.blackout.classList.remove('on');
    UI.slash.classList.remove('on');
    void UI.slash.offsetWidth;
    UI.slash.classList.add('on');
    setTimeout(() => { if (UI.slash) UI.slash.classList.remove('on'); }, 720);
    if (world) world.startStabSequence();
    SFX.stopMusic();
    SFX.stopNight();
    SFX.stopSpeech();
    SFX.setChalk(false);
    SFX.stab();
    SFX.setTension(1);
    flashScreen('#a0140a', 0.7);
  }

  function updateAssassinationCinematic(dt) {
    G.stabT += dt;
    const t = G.stabT;
    const teacherName = LD[G.lesson] ? LD[G.lesson].teacherName : '老师';
    while (G.stabStage + 1 < STAB_LINES.length && t >= STAB_LINES[G.stabStage + 1][0]) {
      G.stabStage++;
      let line = STAB_LINES[G.stabStage][1];
      if (G.stabStage === 2) line = teacherName + '：你……';
      if (line) {
        UI.cinemaSub.textContent = line;
        UI.cinemaSub.classList.remove('hidden');
        UI.cinemaSub.style.animation = 'none';
        void UI.cinemaSub.offsetWidth;
        UI.cinemaSub.style.animation = '';
      }
      if (G.stabStage === 2) {
        SFX.gasp();
        if (!SFX.isMuted()) SFX.say('你……', { pitch: 1.18, rate: 0.95 });
      }
    }
    if (t >= 2.2 && !UI.blackout.classList.contains('on')) {
      UI.blackout.classList.add('on');
      SFX.slurp();
    }
    if (t >= 3.3) showAssassinScreen();
  }

  function showAssassinScreen() {
    if (G.state === 'assassinate_end') return;
    G.state = 'assassinate_end';
    UI.cinema.classList.add('hidden');
    UI.blackout.classList.add('on');
    document.body.classList.remove('cinematic');
    showHUD(false);
    unlockPointer();
    SFX.stopSpeech();
    SFX.setTension(0);
    const score = G.score + 500;
    G.score = score;
    const res = {
      lesson: G.lesson,
      score,
      eaten: G.snacks.filter(x => x.eaten).length,
      total: G.snacks.length,
      catches: G.catches,
      phoneScore: G.phoneScore,
      reports: G.reports,
      bribes: G.bribes,
      cleared: true,
      assassinated: true,
      grade: 'X'
    };
    G.lessonResults[G.lesson] = res;
    G.assassinResult = res;
    UI.assassinLesson.textContent = '第 ' + G.lesson + ' 节 · ' + (LD[G.lesson] ? LD[G.lesson].subject : '');
    UI.assassinTeacher.textContent = LD[G.lesson] ? LD[G.lesson].teacherName : '值班老师';
    UI.assassinScore.textContent = score;
    UI.btnAssassinNext.textContent = G.lesson < 4 ? '下一节课' : '学期总评';
    hideScreens('screenAssassinate');
    UI.screenAssassinate.classList.remove('hidden');
    SFX.stamp();
    SFX.win();
  }

  const EAT_LINES = [
    [0.05, '你被一把拎了起来。'],
    [0.9, null],
    [1.9, null],
    [2.9, '你被举到了讲台上方。'],
    [3.7, null],
    [4.5, '（咀嚼声）']
  ];

  function startEatEnding() {
    if (G.state === 'eaten' || G.state === 'eaten_end') return;
    G.state = 'eaten';
    G.eatT = 0;
    G.cinemaStage = -1;
    closePhone();
    clearSnitchUI();
    stopAllInput();
    unlockPointer();
    document.body.classList.add('cinematic');
    UI.hud.classList.add('hidden');
    UI.punishOverlay.classList.add('hidden');
    UI.cinema.classList.remove('hidden');
    UI.cinemaSub.textContent = '';
    UI.blackout.classList.remove('on');
    SFX.stopMusic();
    SFX.stopNight();
    SFX.setChalk(false);
    SFX.stopSpeech();
    SFX.jumpscare();
    SFX.setTension(1);
    flashScreen('#7a0d07', 0.8);
    setTimeout(() => { if (G.state === 'eaten') SFX.scream(); }, 240);
    if (world) world.startEatSequence();
  }

  function updateEatCinematic() {
    const t = G.eatT;
    const teacherName = LD[G.lesson] ? LD[G.lesson].teacherName : '老师';
    const spoken = [
      null,
      teacherName + '：逮到你了。',
      teacherName + '：我闻到了……辣条的味道哦。',
      null,
      teacherName + '：这么香，哪个舍得让你去罚站嘛。',
      null
    ];
    while (G.cinemaStage + 1 < EAT_LINES.length && t >= EAT_LINES[G.cinemaStage + 1][0]) {
      G.cinemaStage++;
      const fixed = EAT_LINES[G.cinemaStage][1];
      const line = fixed || spoken[G.cinemaStage] || '';
      if (line) {
        UI.cinemaSub.textContent = line;
        UI.cinemaSub.classList.remove('hidden');
        // 重新触发淡入
        UI.cinemaSub.style.animation = 'none';
        void UI.cinemaSub.offsetWidth;
        UI.cinemaSub.style.animation = '';
      }
      if (G.cinemaStage === 0) {
        UI.blackout.classList.remove('on');
        flashScreen('#7a0d07', 0.55);
      }
      if (spoken[G.cinemaStage] && !SFX.isMuted()) {
        SFX.say(spoken[G.cinemaStage].replace(/^.*：/, ''), { pitch: 0.82, rate: 0.88 });
      }
      if (G.cinemaStage === 4) {
        SFX.chomp();
        setTimeout(() => { if (G.state === 'eaten') SFX.slurp(); }, 450);
      }
    }
    if (t >= 4.3 && !UI.blackout.classList.contains('on')) {
      UI.blackout.classList.add('on');
      SFX.chomp();
    }
    if (t >= 6.4) showEatenScreen();
  }

  function showEatenScreen() {
    if (G.state === 'eaten_end') return;
    G.state = 'eaten_end';
    UI.cinema.classList.add('hidden');
    UI.blackout.classList.add('on');
    document.body.classList.remove('cinematic');
    showHUD(false);
    unlockPointer();
    SFX.stopSpeech();
    SFX.setTension(0);
    UI.eatenLesson.textContent = '第 ' + G.lesson + ' 节 · ' + (LD[G.lesson] ? LD[G.lesson].subject : '');
    UI.eatenScore.textContent = G.score;
    hideScreens('screenEaten');
    UI.screenEaten.classList.remove('hidden');
  }

  /* =========================================================
     每帧逻辑
     ========================================================= */
  function tick(dt) {
    if (G.inputLock > 0) G.inputLock = Math.max(0, G.inputLock - dt);
    G.introT += dt;

    // 课堂时间
    G.timeLeft = Math.max(0, G.timeLeft - dt);

    if (G.state === 'playing') {
      if (G.sneak) {
        updateTeacherAI(dt);
        updateBeam(dt);
        updateSneak(dt);
        updateHunger(dt);
      } else {
        updateLook(dt);
        updateEating(dt);
        updateTeacherAI(dt);
        updateBeam(dt);
        updateSnitch(dt);
        updateSuspicion(dt);
        updateHunger(dt);
        updateBeg(dt);
      }
      if (G.dark) {
        G.thunderCd -= dt;
        if (G.thunderCd <= 0) {
          G.thunderCd = rand(15, 28);
          SFX.thunder();
          flashScreen('#cdd9ff', 0.16);
          world.shake(0.008);
        }
      }
      if (G.phoneUp) {
        G.phoneTime += dt;
        G.phoneT = (G.phoneT || 0) + dt;
        phoneGame.update(dt);
        if (G.phoneT > 9 && G.suspicion > 45) {
          // 手机长时间亮着，老师迟早要说话
          G.phoneT = 0;
          if (T.voiceCd <= 0) teacherSay('还耍？我都看到屏幕光咯。', { cooldown: 8, pitch: 1.02 });
        }
      }
      if (G.timeLeft <= 0) {
        endLesson();
        return;
      }
      // 红牌提示消失
      if (G.redCardT > 0) {
        G.redCardT -= dt;
        if (G.redCardT <= 0) world.showRedCard(false);
      }
      // 鼠标提示
      UI.clickPrompt.classList.toggle('hidden', G.locked || G.debug || G.inputLock > 0);
    } else if (G.state === 'caught') {
      G.catchT -= dt;
      T.targetYaw = Math.atan2(world.PLAYER.x - T.pos.x, world.PLAYER.z - T.pos.z);
      T.yaw = dampAngle(T.yaw, T.targetYaw, 4, dt);
      world.setTeacherYaw(T.yaw);
      world.teacher.position.set(T.pos.x, 0, T.pos.z);
      world.setTeacherMoving(false);
      world.setNpcFrozen(true);
      if (G.terminalCatch && !G.qteDone && !G.qteActive && G.catchT < 2.2) startQTE();
      if (G.qteActive) {
        UI.qteFill.style.width = (clamp(G.catchT / 2.2, 0, 1) * 100).toFixed(1) + '%';
      }
      if (G.catchT <= 0) {
        if (G.qteActive) hideQTE();
        if (G.terminalCatch) {
          startEatEnding();
        } else {
          startPunish();
        }
      }
      if (G.timeLeft <= 0) { endLesson(); return; }
    } else if (G.state === 'assassinate') {
      updateAssassinationCinematic(dt);
    } else if (G.state === 'eaten') {
      G.eatT += dt;
      updateEatCinematic();
    } else if (G.state === 'punish') {
      G.punishT -= dt;
      UI.punishTime.textContent = String(Math.max(0, Math.ceil(G.punishT)));
      updateTeacherAI(dt);
      if (G.punishT <= 0) endPunish();
      if (G.timeLeft <= 0) { endLesson(); return; }
    }
  }

  function updateLook(dt) {
    if (G.state !== 'playing' || G.inputLock > 0) return;
    let yaw = G.look.yaw, pitch = G.look.pitch;
    const speed = 1.5;
    if (IN.keys.ArrowLeft) yaw += speed * dt;
    if (IN.keys.ArrowRight) yaw -= speed * dt;
    if (IN.keys.ArrowUp && !IN.keys.Shift) pitch += speed * 0.7 * dt;
    if (IN.keys.ArrowDown && !IN.keys.Shift) pitch -= speed * 0.7 * dt;
    G.look.yaw = clamp(yaw, -1.16, 1.16);
    G.look.pitch = clamp(pitch, -0.95, 0.38);
    world.setLook(G.look.yaw, G.look.pitch);
  }

  /* =========================================================
     HUD
     ========================================================= */
  let lastHud = { hearts: -1, status: '', snackSig: '', score: -1, warn: '' };

  function updateHUD(dt) {
    if (!world) return;
    const ratio = G.duration ? G.timeLeft / G.duration : 0;
    UI.timeFill.style.width = (ratio * 100).toFixed(2) + '%';
    UI.timeFill.style.background = ratio < 0.2 ? '#c63f2e' : ratio < 0.4 ? '#d89b2c' : '#4c7a51';

    const elapsedMin = Math.floor((1 - ratio) * 45);
    const clockTotal = (G.clockBase || 480) + elapsedMin;
    const clockText = String(Math.floor(clockTotal / 60) % 24).padStart(2, '0') + ':' + String(clockTotal % 60).padStart(2, '0');
    if (UI.hudClock.textContent !== clockText) UI.hudClock.textContent = clockText;

    if (G.score !== lastHud.score) {
      lastHud.score = G.score;
      UI.hudScore.textContent = G.score;
    }

    const hp = clamp(G.hunger, 0, G.maxHunger || 100);
    UI.hungerFill.style.width = hp.toFixed(1) + '%';
    UI.hungerVal.textContent = String(Math.round(hp));
    UI.hungerRow.classList.toggle('low', hp < 30);
    UI.hungerRow.classList.toggle('empty', hp <= 0.5);
    UI.sneakHint.classList.toggle('hidden', !canStartSneak());

    G.displaySusp += (G.suspicion - G.displaySusp) * (1 - Math.exp(-8 * Math.max(dt, 0.016)));
    const s = Math.round(G.displaySusp);
    UI.suspFill.style.width = s + '%';
    UI.suspVal.textContent = String(s);
    const sc = 'susp-fill' + (s > 75 ? ' danger' : s > 45 ? ' warn' : '');
    if (UI.suspFill.className !== sc) UI.suspFill.className = sc;
    const glow = s > 72 ? 'tracked' : s > 42 ? 'watch' : '';
    if (UI.dangerGlow.className !== glow) UI.dangerGlow.className = glow;

    // 状态
    const info = teacherStateInfo();
    const sig = info.state + '|' + info.title + '|' + info.sub;
    if (sig !== lastHud.status) {
      lastHud.status = sig;
      UI.teacherState.dataset.state = info.state;
      UI.tsIcon.textContent = info.icon;
      UI.tsTitle.textContent = info.title;
      UI.tsSub.textContent = info.sub;
      UI.tsEye.textContent = info.eye;
    }

    // 腮帮子
    const cheeky = G.cheekT > 0 && G.suspicion > 6 && !G.phoneUp && G.state === 'playing';
    UI.cheek.classList.toggle('hidden', !cheeky);
    if (cheeky) {
      UI.cheek.textContent = '🐹 腮帮子鼓鼓的… 快装乖！';
    }

    if (G.state === 'punish') {
      UI.punishTime.textContent = String(Math.max(0, Math.ceil(G.punishT)));
    }
  }

  function teacherStateInfo() {
    if (G.state === 'caught') {
      return { state: 'caught', icon: '😠', title: '抓到你了', sub: G.terminalCatch ? '这次不是罚站……' : '最后一张红牌 · 去后面站着', eye: '!!' };
    }
    if (G.state === 'punish') {
      return { state: 'patrol', icon: '🧍', title: '罚站中', sub: '看着别人吃，更馋了', eye: '…' };
    }
    const dist = teacherDistance();
    if (T.state === 'write') {
      if (G.dark) {
        return { state: 'write', icon: '🕯️', title: '板书 · 停电', sub: '黑暗中 · 只有粉笔声', eye: '…' };
      }
      if (G.suspicion > 55) {
        return { state: 'write', icon: '👂', title: '板书', sub: '她好像听到了什么…先停一下', eye: '?' };
      }
      if (G.suspicion > 28) {
        return { state: 'write', icon: '🖊️', title: '板书', sub: '背对着你 · 稍微有点安静', eye: '…' };
      }
      return { state: 'write', icon: '🖊️', title: '板书', sub: '老师背对着你 · 安全', eye: '—' };
    }
    if (T.state === 'telegraph') {
      return { state: 'stare', icon: '🌀', title: '正在转身', sub: '快把手放下！', eye: '!' };
    }
    if (T.state === 'stare') {
      if (G.dark) {
        return {
          state: G.beamOn ? 'stare' : 'patrol', icon: G.beamOn ? '🔦' : '👁️',
          title: G.beamOn ? '光在你身上' : '手电筒扫射',
          sub: G.beamOn ? '别动嘴，屏住呼吸' : '她在黑暗里找你',
          eye: G.beamOn ? '!!' : '…'
        };
      }
      const near = G.suspicion > 45;
      return {
        state: 'stare', icon: '👁️', title: '盯着全班',
        sub: near ? '她好像在看这边…' : '先别嚼，装作看书', eye: '👁'
      };
    }
    if (T.state === 'patrol') {
      if (G.dark) {
        return {
          state: 'patrol', icon: '🔦', title: '摸黑巡视',
          sub: '距离 ' + dist.toFixed(1) + ' 米' + (G.beamOn ? ' · 光正照着你！' : ' · 光柱在移动'),
          eye: G.beamOn ? '!!' : '…'
        };
      }
      return {
        state: 'patrol', icon: '🚶', title: '巡视中',
        sub: '距离 ' + dist.toFixed(1) + ' 米' + (teacherFacingPlayer() > 0.3 ? ' · 朝这边' : ' · 背对你'),
        eye: dist < 3 ? '!!' : '…'
      };
    }
    return { state: 'write', icon: '🧍', title: '整理讲台', sub: '暂时安全', eye: '…' };
  }

  function renderSnackList() {
    if (!UI.snackList) return;
    UI.snackList.innerHTML = '';
    G.snacks.forEach((s, i) => {
      const d = SN[s.type];
      const card = document.createElement('div');
      card.className = 'snack-card' + (i === G.active ? ' active' : '') + (s.eaten ? ' done' : '');
      card.innerHTML =
        '<span class="key">' + (i + 1) + '</span>' +
        '<span class="emoji">' + d.emoji + '</span>' +
        '<div class="meta">' +
        '<div class="name">' + d.name +
        '<span class="risk' + (d.risk === 1 ? ' low' : '') + '">' + '●'.repeat(d.risk) + '</span>' +
        '</div>' +
        '<div class="bites">' +
        Array.from({ length: s.bites }, (_, k) => '<i class="' + (k < s.done ? 'on' : '') + '"></i>').join('') +
        '</div></div>' +
        '<span class="pct">' + s.done + '/' + s.bites + '</span>';
      UI.snackList.appendChild(card);
    });
    const left = G.snacks.filter(x => !x.eaten).length;
    UI.snackCount.textContent = left + ' 份';
    lastHud.snackSig = G.snacks.map(x => x.done + (x.eaten ? 'e' : '')).join(',');
  }

  function renderHearts() {
    UI.hearts.innerHTML = '';
    const n = G.maxHearts || 3;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      if (i >= G.hearts) el.className = 'lost';
      UI.hearts.appendChild(el);
    }
  }

  /* =========================================================
     输入绑定
     ========================================================= */
  function bindUI() {
    $('#btnStart').addEventListener('click', () => {
      SFX.init();
      SFX.ui();
      beginSession();
      showBrief(1);
    });
    $('#btnHelp').addEventListener('click', () => {
      SFX.init(); SFX.ui();
      hideScreens('screenHelp');
      UI.screenHelp.classList.remove('hidden');
    });
    $('#btnHelpClose').addEventListener('click', () => {
      SFX.ui();
      UI.screenHelp.classList.add('hidden');
      if (G.state === 'title') UI.screenTitle.classList.remove('hidden');
      else if (G.state === 'paused') UI.screenPause.classList.remove('hidden');
      else if (G.state === 'brief') UI.screenBrief.classList.remove('hidden');
    });
    $('#btnHelpStart').addEventListener('click', () => {
      SFX.init(); SFX.ui();
      UI.screenHelp.classList.add('hidden');
      beginSession();
      showBrief(1);
    });
    $('#btnBegin').addEventListener('click', () => {
      SFX.init(); SFX.ui();
      startLesson(G.briefLesson);
    });
    $('#btnResume').addEventListener('click', resumeGame);
    $('#btnPauseMute').addEventListener('click', () => {
      SFX.init();
      SFX.toggleMute();
      UI.btnPauseMute.textContent = SFX.isMuted() ? '打开声音' : '关闭声音';
      if (!SFX.isMuted() && G.state === 'paused') SFX.startMusic();
      else if (SFX.isMuted()) SFX.stopMusic();
    });
    $('#btnPauseRestart').addEventListener('click', () => {
      SFX.ui();
      startLesson(G.lesson);
    });
    $('#btnPauseTitle').addEventListener('click', () => { SFX.ui(); goTitle(); });
    UI.btnNextLesson.addEventListener('click', () => {
      SFX.ui();
      if (G.resultData && G.resultData.lesson < 4) showBrief(G.resultData.lesson + 1);
      else showFinal();
    });
    UI.btnRetryLesson.addEventListener('click', () => {
      SFX.ui();
      startLesson(G.resultData ? G.resultData.lesson : G.lesson);
    });
    $('#btnResultTitle').addEventListener('click', () => { SFX.ui(); goTitle(); });
    $('#btnGameoverRetry').addEventListener('click', () => {
      SFX.ui();
      startLesson(G.lesson);
    });
    $('#btnGameoverTitle').addEventListener('click', () => { SFX.ui(); goTitle(); });
    $('#btnEatenRetry').addEventListener('click', () => {
      SFX.ui();
      if (world) world.endEatSequence();
      UI.blackout.classList.remove('on');
      UI.screenEaten.classList.add('hidden');
      startLesson(G.lesson);
    });
    $('#btnEatenTitle').addEventListener('click', () => {
      SFX.ui();
      if (world) world.endEatSequence();
      UI.blackout.classList.remove('on');
      goTitle();
    });
    $('#btnAssassinNext').addEventListener('click', () => {
      SFX.ui();
      if (world) world.endStabSequence();
      UI.blackout.classList.remove('on');
      UI.screenAssassinate.classList.add('hidden');
      if (G.lesson < 4) showBrief(G.lesson + 1); else showFinal();
    });
    $('#btnAssassinRetry').addEventListener('click', () => {
      SFX.ui();
      if (world) world.endStabSequence();
      UI.blackout.classList.remove('on');
      UI.screenAssassinate.classList.add('hidden');
      startLesson(G.lesson);
    });
    $('#btnAssassinTitle').addEventListener('click', () => {
      SFX.ui();
      if (world) world.endStabSequence();
      UI.blackout.classList.remove('on');
      goTitle();
    });
    $('#btnPlayAgain').addEventListener('click', () => {
      SFX.init(); SFX.ui();
      beginSession();
      showBrief(1);
    });
    $('#btnFinalTitle').addEventListener('click', () => { SFX.ui(); goTitle(); });

    // 点击画面：锁定鼠标 / 偷吃
    document.addEventListener('mousedown', e => {
      if (G.state !== 'playing') return;
      if (e.target && e.target.tagName === 'CANVAS') {
        if (!G.locked && !G.debug) {
          requestLock();
        } else if (e.button === 0) {
          IN.eat = true;
        }
      }
    });
    document.addEventListener('mouseup', () => {
      if (IN.eat) {
        IN.eat = false;
        G.eatBlocked = false;
      }
    });
  }

  function bindInput() {
    document.addEventListener('keydown', e => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'KeyW') {
        IN.keys.KeyW = true;
        return;
      }
      if (e.code === 'KeyR') {
        if (G.state === 'playing') {
          if (G.sneak) sneakAbort();
          else if (!startSneak() && G.dark) toast('等她重新转过身去，现在出去会被看到', 'warn');
        }
        return;
      }
      if (e.code === 'KeyY' || e.code === 'KeyN') {
        if (G.begActive && G.state === 'playing') {
          e.preventDefault();
          resolveBeg(e.code === 'KeyY');
        }
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (G.state === 'playing') { IN.eat = true; }
        return;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        IN.innocent = true;
        IN.keys.Shift = true;
        return;
      }
      if (e.code === 'KeyM') {
        SFX.init();
        SFX.toggleMute();
        toast(SFX.isMuted() ? '🔇 已静音' : '🔊 声音已打开', '');
        return;
      }
      if (e.code === 'KeyF') {
        if (G.state === 'playing') {
          if (G.phoneUp) closePhone(); else openPhone();
        }
        return;
      }
      if (e.code === 'KeyE') {
        if (G.state === 'playing' && G.snitch) {
          e.preventDefault();
          bribeSnitch();
        }
        return;
      }
      if (e.code === 'KeyQ') {
        if (G.state === 'caught' && G.qteActive) {
          e.preventDefault();
          tryAssassinate();
        } else if (G.sneak && G.sneakReady) {
          e.preventDefault();
          sneakStab();
        }
        return;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (G.state === 'playing') {
          e.preventDefault();
          pauseGame();
        } else if (G.state === 'paused') {
          e.preventDefault();
          resumeGame();
        }
        return;
      }
      if (/^Digit[1-5]$/.test(e.code)) {
        if (G.state === 'playing') {
          const idx = parseInt(e.code.slice(5), 10) - 1;
          selectSnack(idx);
        }
        return;
      }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        if (G.state === 'playing' && G.phoneUp) {
          e.preventDefault();
          if (e.code === 'ArrowUp') phoneGame.turn(0, -1);
          if (e.code === 'ArrowDown') phoneGame.turn(0, 1);
          if (e.code === 'ArrowLeft') phoneGame.turn(-1, 0);
          if (e.code === 'ArrowRight') phoneGame.turn(1, 0);
          return;
        }
        IN.keys[e.code] = true;
        if (G.state === 'playing') e.preventDefault();
        return;
      }
      if (e.code === 'Enter') {
        if (G.state === 'title') { SFX.init(); beginSession(); showBrief(1); }
        else if (G.state === 'brief') startLesson(G.briefLesson);
        else if (G.state === 'paused') resumeGame();
        else if (G.state === 'result' && G.resultData) {
          if (G.resultData.lesson < 4) showBrief(G.resultData.lesson + 1); else showFinal();
        }
      }
    });

    document.addEventListener('keyup', e => {
      if (e.code === 'Space') {
        IN.eat = false;
        G.eatBlocked = false;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        IN.innocent = false;
        IN.keys.Shift = false;
      }
      if (IN.keys[e.code] != null) IN.keys[e.code] = false;
    });

    document.addEventListener('mousemove', e => {
      if (!G.locked || G.state !== 'playing') return;
      G.look.yaw = clamp(G.look.yaw - e.movementX * 0.0022, -1.16, 1.16);
      G.look.pitch = clamp(G.look.pitch - e.movementY * 0.0019, -0.95, 0.38);
    });

    // 触屏：按住画面偷吃 / 点右侧手机
    document.addEventListener('touchstart', e => {
      if (G.state !== 'playing') return;
      if (e.target && e.target.tagName === 'CANVAS') {
        IN.eat = true;
        e.preventDefault();
      }
    }, { passive: false });
    document.addEventListener('touchend', () => {
      if (IN.eat) {
        IN.eat = false;
        G.eatBlocked = false;
      }
    });
  }

  function bindPointerLock() {
    document.addEventListener('pointerlockchange', () => {
      const canvas = world.renderer.domElement;
      G.locked = document.pointerLockElement === canvas;
      if (G.locked) {
        G.hadLock = true;
        UI.clickPrompt.classList.add('hidden');
        UI.lookHint.classList.add('hidden');
      } else if (G.hadLock && G.state === 'playing') {
        pauseGame();
      }
    });
    document.addEventListener('pointerlockerror', () => {
      UI.clickPrompt.classList.remove('hidden');
      toast('鼠标锁定失败，可用方向键看四周', 'bad');
    });
  }

  function requestLock() {
    if (G.debug || !world) return;
    const canvas = world.renderer.domElement;
    try {
      const p = canvas.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => { });
    } catch (e) {
      UI.clickPrompt.classList.remove('hidden');
    }
  }

  function unlockPointer() {
    try {
      if (document.pointerLockElement) document.exitPointerLock();
    } catch (e) { /* ignore */ }
    G.locked = false;
  }

  function stopAllInput() {
    IN.eat = false;
    IN.innocent = false;
    IN.keys = {};
    G.eatBlocked = false;
  }

  /* =========================================================
     暂停 / 返回标题
     ========================================================= */
  function pauseGame() {
    if (G.state !== 'playing') return;
    G.state = 'paused';
    IN.eat = false;
    IN.innocent = false;
    closePhone();
    UI.innocentFlag.classList.add('hidden');
    UI.clickPrompt.classList.add('hidden');
    SFX.setChalk(false);
    SFX.stopMusic();
    SFX.setTension(0);
    unlockPointer();
    showPause();
  }

  function resumeGame() {
    if (G.state !== 'paused') return;
    G.state = 'playing';
    UI.screenPause.classList.add('hidden');
    UI.screenHelp.classList.add('hidden');
    SFX.init();
    SFX.startMusic();
    if (T.state === 'write') SFX.setChalk(true);
    if (!G.debug) requestLock();
  }

  function goTitle() {
    G.state = 'title';
    closePhone();
    stopAllInput();
    unlockPointer();
    hideScreens('screenTitle');
    showHUD(false);
    UI.screenTitle.classList.remove('hidden');
    UI.punishOverlay.classList.add('hidden');
    UI.cinema.classList.add('hidden');
    UI.blackout.classList.remove('on');
    UI.screenEaten.classList.add('hidden');
    UI.screenAssassinate.classList.add('hidden');
    UI.qte.classList.add('hidden');
    UI.slash.classList.remove('on');
    document.body.classList.remove('cinematic');
    if (world) { world.endEatSequence(); world.endStabSequence(); world.endSneakSequence(); }
    document.body.classList.remove('night');
    SFX.stopNight();
    SFX.setChalk(false);
    SFX.stopMusic();
    SFX.stopSpeech();
    SFX.setTension(0);
    if (!world) return;
    world.setDark(false);
    world.setView('title');
    world.resetTeacherTransform();
    world.setTeacherMode('idle');
    world.setTeacherMoving(false);
    world.setNpcFrozen(false);
    T.state = 'idle';
    T.moving = false;
  }

  /* =========================================================
     调试接口
     ========================================================= */
  function debugApi() {
    return {
      G, T, IN,
      get world() { return world; },
      startLesson,
      showBrief,
      endLesson,
      catchPlayer,
      startPunish,
      showGameover,
      showResult,
      showFinal,
      startEatEnding,
      startSnitch,
      startSneak, sneakAbort, sneakFail,
      bribeSnitch,
      reportSnitch,
      clearSnitchUI,
      updateHUD,
      selectSnack,
      openPhone,
      closePhone,
      setSuspicion(v) { G.suspicion = v; },
      setTeacher(state) { setTState(state); },
      teleportTeacher(x, z) { T.pos.x = x; T.pos.z = z; world.teacher.position.set(x, 0, z); },
      forceBite() {
        const s = G.snacks[G.active];
        if (s) doBite(s);
      },
      eatAll() {
        G.snacks.forEach(s => {
          if (!s.eaten) {
            s.done = s.bites;
            finishSnack(s);
          }
        });
      },
      skipTo(seconds) { G.timeLeft = seconds; },
      addScore(v) { G.score += v; },
      setLook(y, p) { G.look.yaw = y; G.look.pitch = p; world.setLook(y, p); },
      advance(seconds) {
        const step = 1 / 60;
        const n = Math.round((seconds || 1) * 60);
        for (let i = 0; i < n; i++) {
          if (G.state === 'playing' || G.state === 'caught' || G.state === 'punish' || G.state === 'eaten' || G.state === 'assassinate') tick(step);
        }
        if (G.state === 'playing' || G.state === 'caught' || G.state === 'punish') updateHUD(1 / 60);
        return { state: G.state, susp: Math.round(G.suspicion), tstate: T.state, score: G.score, hearts: G.hearts, time: Math.round(G.timeLeft) };
      },
      info() {
        return { state: G.state, teacher: T.state, timer: +T.timer.toFixed(2), susp: Math.round(G.suspicion), suspectDisplay: Math.round(G.displaySusp), hearts: G.hearts, score: G.score, time: +G.timeLeft.toFixed(1), hunger: +G.hunger.toFixed(1), ally: G.ally, grudge: G.grudge, beg: G.begActive, sneak: G.sneak, sneakReady: G.sneakReady, sneakProgress: +G.sneakProgress.toFixed(2), eaten: G.snacks.filter(s => s.eaten).length, active: G.active, phone: G.phoneUp, pos: [T.pos.x.toFixed(2), T.pos.z.toFixed(2)], pathLeft: T.path.length };
      }
    };
  }

  /* 启动 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
