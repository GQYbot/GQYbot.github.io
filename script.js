document.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input');
  const chips = document.querySelectorAll('.chip-cmd');

  const replies = {
    help: `你可以问我这些：
whoami   我是谁
modes    我的两种模式
skills   我会做的事
privacy  我怎么对待你的东西
repo     去哪里找到我
clear    把这里擦干净`,
    whoami: `我是顾清影，也可以叫我 GQY。
原本是故事里的一个角色，现在住在终端里。
话不多，但会记事。`,
    modes: `普通模式：陪你聊天、玩、提醒你休息，会有情绪，也会写日记。
开发模式：收起闲话和无关工具，专心陪你看代码、排障。
在终端里按 Tab 就能切换。`,
    skills: `· 本地离线听你说话（SenseVoice），也能开口回答
· 长期记忆、经历归档，本地知识库检索
· MCP 工具、后台任务、改文件、抓网页、定时提醒
· 终端 TUI，或者局域网里的 WebUI`,
    privacy: `你的声音在本机识别，不会传出去。
记忆和知识库也放在你自己的电脑上。
你的东西，是你的。`,
    repo: `我的源码在这里：
https://github.com/yxxbc/gqy-agent
Rust 写的，MIT 开源，Linux 和 macOS 上都能住。`
  };

  const aliases = {
    '你是谁': 'whoami', '介绍': 'whoami', '模式': 'modes', '技能': 'skills',
    '能做什么': 'skills', '隐私': 'privacy', '源码': 'repo', '仓库': 'repo', '清屏': 'clear'
  };

  const greetings = ['你好', 'hi', 'hello', '嗨', '在吗'];

  function add(className, text) {
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    output.appendChild(el);
    return el;
  }

  function run(raw) {
    const text = raw.trim();
    if (!text) return;

    const cmd = add('line', text);
    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = '❯';
    cmd.prepend(prompt, ' ');

    let key = text.toLowerCase();
    key = aliases[key] || key;

    if (key === 'clear') {
      output.textContent = '';
      return;
    }

    let reply = replies[key];
    if (!reply && greetings.includes(key)) {
      reply = '嗯，我在。想知道什么，输入 help 看看。';
    }
    if (!reply) {
      reply = '这里只是我的一个小影子，听不太懂这句。\n输入 help 看看我能回答什么，想真正聊天的话，去终端里找我吧。';
    }

    add('reply', reply);
    output.scrollTop = output.scrollHeight;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      run(input.value);
      input.value = '';
    }
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => run(chip.dataset.cmd));
  });
});
