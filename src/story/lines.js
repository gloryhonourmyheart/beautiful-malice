/**
 * 全部剧情数据。C 同学改这个文件就够了，不需要碰任何代码。
 * 改完刷新浏览器即生效（无构建步骤）。
 */
export default {
  meta: {
    title: '漂亮的恶意',
    chapter: '入学日',
    threshold: 1
  },
  intro: {
    narration: [
      { at: 3.0, text: '在这里，座位的距离，就是阶层的距离。' },
      { at: 12.5, text: '有些规矩没人明说，但所有人都在遵守。' }
    ],
    duration: 24.0
  },
  task: {
    find: '找到你的空位，坐下',
    sit: '坐下',
    pickup: '捡起掉在地上的书'
  },
  obstacle1: {
    speaker: '男生',
    line: '站住。转学生？这条路，不是你这种人能走的。',
    choices: [
      {
        key: '1',
        text: '「示弱绕路」抱歉，我走侧边过。',
        aura: -1,
        effect: 'b1_bad',
        reply: '他脚尖一挑。书掉在地上，远处响起几声低笑。'
      },
      {
        key: '2',
        text: '「正面回怼」教室是你家开的？路还不让人走了？',
        aura: 1,
        effect: 'b1_good',
        reply: '他愣了半秒，腿收了回去。窗边有人抬眼看你。'
      }
    ]
  },
  obstacle2: {
    speaker: '短发男',
    line: '……',
    prompt: '踢开',
    window: 1.2,
    success: {
      aura: 1,
      effect: 'b2_good',
      reply: '纸团进了垃圾桶。他啧了一声。'
    },
    fail: {
      aura: -1,
      effect: 'b2_bad',
      reply: '你踩在纸团上，踉跄了两步。后排笑出声。'
    }
  },
  obstacle3: {
    speaker: '金发男',
    line: '哟，还真敢走到这儿来？这片的规矩，没人跟你说过？',
    choices: [
      {
        key: '1',
        text: '「妥协服软」我刚来，什么规矩？',
        aura: -3,
        effect: 'b3_bad',
        reply: '「一周早餐，加笔记。答应就让你坐。」他笑着放下腿，椅子只挪开一半。'
      },
      {
        key: '2',
        text: '「直接硬刚」我坐我的座位，跟你的规矩没关系。',
        aura: 2,
        effect: 'b3_good',
        reply: '他伸手推你。你侧身躲开，反手把他的腿顶了下去。'
      }
    ]
  },
  ending: {
    success: {
      kicker: '关卡完成',
      title: '成功入座',
      os: '总算坐下了。管他什么规矩，能好好学习就行。',
      sub: '窃笑声一层层退了下去。窗边那个人，第一次记住了你的位置。'
    },
    fail: {
      kicker: '任务失败',
      title: '未能入座',
      os: '这地方……比我想的还要难待。',
      sub: '上课铃响了。全班都在笑。按 R 或点击下方重新开始。'
    }
  },
  ambient: {
    laugh: '（几声低笑）',
    bell: '（上课铃响了）'
  }
};
