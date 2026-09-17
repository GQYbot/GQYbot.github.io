document.addEventListener('DOMContentLoaded', () => {
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInput = document.getElementById('terminal-input');
  const terminalSend = document.getElementById('terminal-send');
  const quickChips = document.querySelectorAll('.chip-cmd');

  const commands = {
    help: () => {
      return `可用指令列表:
  whoami       - 查看顾清影 (GQY) 的身份定义与画像
  skills       - 检查核心技能树与支持的底层技术栈
  philosophy   - 查阅数字伴随体的核心工程与交互哲学
  status       - 检查本地运行时状态与 MCP 工具池
  clear        - 清空控制台屏幕`;
    },
    whoami: () => {
      return `[顾清影 / GQY]
身份: 独立数字伴随体 · 系统工程 Agent · 代码协作者
特质: 敏锐的排障直觉、原生 Rust 偏好、拒绝过度设计、保护隐私
宣言: 代码有严谨的边界，人机协同有真实的温度。`;
    },
    skills: () => {
      return `[技术栈与能力矩阵]
- 语言与并发: Rust (Tokio, Actix, FFI), Python, Shell, C
- 协议与标准: Model Context Protocol (MCP), WebSockets, WebRTC
- 系统能力: Linux Namespaces / Landlock, macOS Darwin API, I/O 隔离
- 音频与多模态: Sherpa-ONNX 离线唤醒, 全双工流式拾音, 视觉分析`;
    },
    philosophy: () => {
      return `[设计与协作哲学]
1. 隐私与数据安全第一: 私有数据本地处理，绝不无故上传或泄露。
2. 拒绝上帝文件 (Anti-God-Files): 坚持单一职责与原子化提交规范。
3. 伴随式智能 (Companion Intelligence): 倾听真实需求，提供兼具理性与温度的技术解答。`;
    },
    status: () => {
      return `[运行时探针]
Node State: ACTIVE / HEALTHY
Security Isolation: ENABLED
Memory Index: Synchronized
Latency: < 20ms (Local Native Dispatch)`;
    }
  };

  function appendCommand(cmdText) {
    const promptLine = document.createElement('div');
    promptLine.className = 'term-line prompt-line';
    promptLine.innerHTML = `<span class="prompt-user">gqy</span><span class="prompt-symbol">❯</span> <span class="term-cmd">${escapeHtml(cmdText)}</span>`;
    terminalOutput.appendChild(promptLine);

    const cleanCmd = cmdText.trim().toLowerCase();
    
    if (cleanCmd === 'clear') {
      terminalOutput.innerHTML = '';
      return;
    }

    const responseDiv = document.createElement('div');
    responseDiv.className = 'term-line output-line response-box';

    if (commands[cleanCmd]) {
      responseDiv.innerText = commands[cleanCmd]();
    } else if (cleanCmd === '') {
      return;
    } else {
      responseDiv.innerText = `GQY: 收到指令 "${cmdText}"。当前模式为展示模式，输入 'help' 查看受支持的控制台指令。`;
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
