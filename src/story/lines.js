/**
 * 全部剧情数据（v3 · 黑板擦闪避版）。C 同学改这个文件就够了，不需要碰任何代码。
 * 改完刷新浏览器即生效（无构建步骤）。
 */
export default {
  meta: {
    title: '漂亮的恶意',
    chapter: '入学日',
    threshold: 0
  },
  intro: {
    narration: [
      { at: 2.5, text: '在这里，座位的距离，就是阶层的距离。' },
      { at: 9.0, text: '有人被簇拥着，有人被隔开。' },
      { at: 15.0, text: '有些规矩没人明说，但所有人都在遵守。' }
    ],
    duration: 24.0
  },
  task: {
    find: '走到你的座位并坐下',
    sit: '坐下',
    pickup: '捡起散落的课本'
  },
  obstacle1: {
    speaker: '',
    line: '',
    prompt: '向左闪避',
    window: 1.0,
    key: 'A',
    success: {
      aura: 1,
      effect: 'b1_good',
      reply: '黑板擦擦着发丝飞过，砸在身后的柜门上。靠窗那个人，第一次抬眼看你。'
    },
    fail: {
      aura: -1,
      effect: 'b1_bad',
      reply: '黑板擦砸中肩膀，怀里的书哗啦散了一地。前排传来压低的哄笑。'
    }
  },
  obstacle2: {
    speaker: '短发男',
    line: '……',
    prompt: '清理通路',
    window: 1.2,
    key: 'E',
    success: {
      aura: 1,
      effect: 'b2_good',
      reply: '她抬脚把纸团踢进墙角，脚尖拨回练习册，全程没有停下。看戏的男生啧了一声。'
    },
    fail: {
      aura: -1,
      effect: 'b2_bad',
      reply: '脚下打滑，踉跄一步才站稳，书又掉出几本。后排的起哄声更大了。'
    }
  },
  obstacle3: {
    speaker: '男生',
    line: '哟，新同学？别站着啊，坐这儿来，以后在班里哥罩着你。',
    choices: [
      {
        key: '1',
        text: '「婉拒但坚定」不用了，谢谢。这是我的座位，麻烦让一下。',
        aura: 2,
        effect: 'b3_good',
        reply: '她扶住椅背，眼神没有退让。男生的笑僵住，讪讪把椅子挪了回去。'
      },
      {
        key: '2',
        text: '「犹豫退让」……我、我还是找别的位置吧。',
        aura: -2,
        effect: 'b3_bad',
        reply: '男生拉住她的书包带不让走：「别啊，坐一下怎么了？给个面子。」起哄声四起。'
      }
    ]
  },
  ending: {
    success: {
      kicker: '关卡完成',
      title: '成功入座',
      os: '总算坐下了。管他什么花样，能好好学习就行。',
      sub: '窃笑声渐渐平息。靠窗那个冷淡的身影第一次侧过头，目光落在最后排的她身上。'
    },
    fail: {
      kicker: '任务失败',
      title: '未能入座',
      os: '这地方……比我想的还要难待。',
      sub: '老师皱眉问：「那位同学，上课了为什么不坐下？」全班哄笑。按 R 重新开始。'
    }
  },
  ambient: {
    whistle: '（一声口哨）',
    laugh: '（几声哄笑）',
    bell: '（上课铃骤然响起）'
  }
};
