document.addEventListener('DOMContentLoaded', () => {
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInput = document.getElementById('terminal-input');
  const terminalSend = document.getElementById('terminal-send');
  const quickChips = document.querySelectorAll('.chip-cmd');

  const commands = {
    help: () => {
      return `可用指令列表:
  whoami       - 查看顾清影 (GQY) 的身份画像与设定
  developer    - 了解核心创造者与开发者 yxxbc
  repos        - 查看核心代码仓库 (gqy-agent 等)
  skills       - 检查核心技能树与支持的底层技术栈
  clear        - 清空控制台屏幕`;
    },
    whoami: () => {
      return `[顾清影 / GQY]
身份: 独立数字伴随体 · 系统工程 Agent · 代码协作者
创造者: yxxbc (https://github.com/yxxbc)
特质: 敏锐的排障直觉、原生 Rust 偏好、拒绝过度设计、守护隐私
宣言: 代码有严谨的边界，人机协同有真实的温度。`;
    },
    developer: () => {
      return `[开发者画像: yxxbc]
GitHub: https://github.com/yxxbc
定位: 顾清影的架构师与系统开发者
专长: Rust 系统级编程、Tokio 异步并发、进程沙箱隔离、全双工多模态系统设计
理念: 本地优先 (Local-First)、单一职责、抗上帝文件、重视隐私保护与工程优雅`;
    },
    repos: () => {
      return `[推荐与核心项目]
1. yxxbc/gqy-agent (https://github.com/yxxbc/gqy-agent)
   - 顾清影的核心 Agent 运行时，基于 Rust 与原生系统调用构建。
2. yxxbc/Miyu (https://github.com/yxxbc/Miyu)
   - 探索性实验性 Agent 演进分支。`;
    },
    skills: () => {
      return `[技术栈与能力矩阵]
- 语言底座: Rust (Tokio, FFI, Native Bindings), Python, Shell
- 协议标准: Model Context Protocol (MCP), WebSockets, WebRTC
- 系统能力: Darwin / Linux Native APIs, Landlock / RLIMIT 隔离
- 音频拾音: Sherpa-ONNX 离线唤醒, 全双工流式传输`;
    }
  };

  function appendCommand(cmdText) {
    const promptDiv = document.createElement('div');
    promptDiv.className = 'text-slate-300';
    promptDiv.innerHTML = `gqy ❯ <span class="text-slate-100">${escapeHtml(cmdText)}</span>`;
    terminalOutput.appendChild(promptDiv);

    const cleanCmd = cmdText.trim().toLowerCase();
    
    if (cleanCmd === 'clear') {
      terminalOutput.innerHTML = '';
      return;
    }

    const responseDiv = document.createElement('div');
    responseDiv.className = 'text-slate-400 pl-3 border-l border-slate-600 text-[11px] py-1 whitespace-pre-wrap';

    if (commands[cleanCmd]) {
      responseDiv.innerText = commands[cleanCmd]();
    } else if (cleanCmd === '') {
      return;
    } else {
      responseDiv.innerText = `GQY: 收到指令 "${cmdText}"。输入 'help' 或点击快捷标签查看常用探针。`;
    }

    terminalOutput.appendChild(responseDiv);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function handleInput() {
    const val = terminalInput.value.trim();
    if (!val) return;
    appendCommand(val);
    terminalInput.value = '';
  }

  if (terminalSend && terminalInput) {
    terminalSend.addEventListener('click', handleInput);
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleInput();
      }
    });
  }

  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      if (cmd) {
        appendCommand(cmd);
      }
    });
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }
});
