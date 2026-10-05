# AI 时代数字化全技术栈 · 交互式架构图谱站
## 产品手册 & 多 Agent 协同开发指南

> 版本：v1.0 ｜ 更新：2026-10-05 ｜ 维护方：豆包 MainAgent + 多 Agent 协作组

---

## 一、产品是什么

一个**单文件、零依赖、可交互**的 AI 全技术栈架构图谱站点。它把 AI 时代数字化生态（从物理感知到用户交互）梳理成 **10 层技术链路 × 8 大架构视图**，每层、每个模块都可以**点击下钻**看到：
- 技术模块介绍
- 开源 / 闭源 / 混合 授权标签
- 成熟度标签（成熟 / 成长 / 萌芽 / 热点）
- 代表性产品清单（开源产品带 GitHub 链接、安装命令、Star 数）

同时内置**每日 AI 动态资讯系统**：今日动态 + 历史资讯（按日期倒序沉淀）。

### 关键数字
| 指标 | 数值 |
|---|---|
| 技术层级 | 10 层（L1 物理感知 → L10 用户交互） |
| 架构视图 | 8 个（全景 + 7 大分类） |
| 技术模块 | 200+ |
| 开源项目 | 80+（可直接部署） |
| 厂商产品 | 50+ |
| 每日动态 | 8~10 条/天，历史沉淀 |

### 部署形态（已上线）
- **GitHub 仓库**：`https://github.com/EastSouthWestNorthMiddle/doubao-site`（main 分支）
- **公网站点**：`https://regal-kitten-95e400.netlify.app`（Netlify 托管，GitHub 连接已配置）
- **发布机制**：push 到 GitHub main 分支 → Netlify 自动构建 → 自动上线（约 1~2 分钟）

---

## 二、文件结构与入口

```
ai-tech-ecosystem/
├── index.html          # 唯一站点文件（单文件应用，约 151KB）
├── README.md           # 仓库说明
├── PRODUCT_MANUAL.md   # 本文档（产品手册 + 协同协议）
├── assets/             # 预留静态资源目录（当前为空）
├── data/               # 预留数据目录（当前为空）
└── .git/               # git 仓库（main 分支）
```

> **重要**：站点是**单文件应用**，所有 HTML/CSS/JS/数据都在 `index.html` 内。任何 Agent 修改都必须直接编辑 `index.html`，不要新建外部文件引用。

---

## 三、index.html 内部结构（核心数据地图）

### 3.1 总体区块划分

| 行号范围（近似） | 内容 |
|---|---|
| 1 ~ 199 | CSS 样式（变量、布局、响应式） |
| 203 ~ 360 | HTML 骨架（顶部导航、8 个视图容器、详情弹窗） |
| 365 ~ 1302 | `ARCH_DATA` —— 架构图谱核心数据（7 大视图） |
| 1305 ~ 1316 | `DAILY_NEWS` —— 今日动态数组 |
| 1319 ~ 1388 | `HISTORY_NEWS` —— 历史资讯数组（按日期倒序） |
| 1396 ~ 1670 | 渲染引擎（路由、渲染函数、交互逻辑） |

> 行号随编辑会漂移，定位请用关键词搜索（如 `const ARCH_DATA`、`const DAILY_NEWS`）。

### 3.2 导航与视图对应关系

顶部导航有 9 个 `nav-item`，`data-view` 属性对应 `ARCH_DATA` 的键：

| 导航文字 | data-view | ARCH_DATA 键 | 说明 |
|---|---|---|---|
| 全景总览 | overview | （特殊，堆叠渲染） | 10 层全景图 + 今日动态 + 指标 |
| 物理与具身 | physical | `ARCH_DATA.physical` | L1 感知/执行/IoT |
| 网络与边缘 | network | `ARCH_DATA.network` | L2 网络/边缘 |
| 硬件与算力 | hardware | `ARCH_DATA.hardware` | L3 算力/硬件 |
| 软件与数据 | softdata | `ARCH_DATA.softdata` | L4 基础软件 + L5 数据 |
| AI模型算法 | aimodel | `ARCH_DATA.aimodel` | L6 模型/算法 |
| AI工程/Harness | aieng | `ARCH_DATA.aieng` | L7 AI工程/Harness |
| 应用与安全 | appsec | `ARCH_DATA.appsec` | L8 应用 + L9 业务 + L10 交互 |
| 历史资讯 | history | （特殊，HISTORY_NEWS） | 历史动态按日沉淀 |

---

## 四、数据结构规范（Agent 必须遵守）

### 4.1 ARCH_DATA —— 架构图谱

```js
const ARCH_DATA = {
  physical: {   // ← 视图键，与 data-view 一致（overview/history 除外）
    layers: [
      {
        id: 'sense',           // 层唯一 ID（小写英文）
        num: '1.1',            // 层编号（可显示序号）
        title: '感知传感器系统',  // 层标题
        desc: '物理世界信号采集',  // 层一句话描述
        color: 'l1',           // 颜色主题：l1~l10（对应 CSS 变量）
        groups: [              // 分组数组
          {
            name: '视觉感知',   // 分组名
            modules: [         // 模块数组
              {
                id: 'cam',            // 模块唯一 ID（小写英文，全局不重复）
                name: '摄像头/视觉传感器', // 模块名
                desc: 'RGB/深度/红外成像…', // 模块描述（一句话）
                license: 'mixed',     // 授权：open | closed | mixed
                maturity: 'mature',   // 成熟度：mature | growing | emerging | hot
                products: [           // 代表产品（可选）
                  {
                    name: 'OpenCV',    // 产品名
                    type: 'open',      // open | closed | mixed
                    desc: '全球最流行的开源计算机视觉库',
                    url: 'https://github.com/opencv/opencv', // GitHub/官网链接
                    install: 'pip install opencv-python',    // 安装命令（没有留空字符串）
                    stars: '80k+'      // GitHub Star 数（没有留空字符串）
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  // network / hardware / softdata / aimodel / aieng / appsec 结构相同
};
```

**修改规则**：
- **新增模块**：在对应视图的对应 layer → group → modules 数组末尾追加对象，`id` 必须全局唯一。
- **新增分组**：在 layer.groups 数组追加。
- **新增产品**：在模块的 products 数组追加。
- **删除/修改**：只动目标对象，不要改其他模块。
- **不要改动**：`renderArchPage` / `showDetail` 等渲染函数（除非要加新功能）。

### 4.2 DAILY_NEWS —— 今日动态

```js
const DAILY_NEWS = [
  {
    cat: '大模型',        // 分类：大模型 | AI芯片 | 具身智能 | AI工程 | 开源生态 | AI应用 | 政策监管 | 资本动态
    text: '一句话摘要…',   // 首页列表显示的一句话
    detail: '详细描述（100-200字）…', // 点击展开的详细内容
    source: '来源媒体',     // 来源
    url: 'https://…'       // 原文链接（没有则填 '#'）
  }
];
```

### 4.3 HISTORY_NEWS —— 历史资讯（日期倒序）

```js
const HISTORY_NEWS = [
  {
    date: '2026年10月3日',          // 日期字符串（中文格式，与 todayDate 一致）
    items: [ /* 与 DAILY_NEWS 条目结构完全一致 */ ]
  },
  // 更早的日期排在后面
];
```

**规则**：
- 新一天动态追加到**数组最前面**（最新的在最前）。
- 若已有同日期记录，**替换**该日期的 items，不重复追加。
- 每条 item 与 DAILY_NEWS 结构一致（cat/text/detail/source/url）。

### 4.4 todayDate —— 今日日期

```html
<span class="daily-date" id="todayDate">2026年10月3日</span>
```
更新时改成当天日期（中文格式：`2026年10月5日`）。

---

## 五、渲染机制速览（了解即可，一般不用改）

| 函数 | 职责 |
|---|---|
| `switchView(viewName)` | 视图路由切换（同步 URL hash） |
| `renderArchPage(containerId, data)` | 渲染单视图架构页（层/分组/模块卡片） |
| `renderOverview()` | 渲染全景总览（10 层堆叠 + 今日动态 + 指标） |
| `showDetail(modId, containerId, layerIdx)` | 打开模块详情弹窗（产品清单 + 安装命令） |
| `renderTab(type)` | 详情弹窗内按授权类型筛选产品 |
| `toggleNews(index)` | 展开/收起今日动态条目详情 |
| `renderHistory(filter)` | 渲染历史资讯（支持分类筛选） |
| `searchModules(keyword)` | 全局搜索技术模块 |
| `DOMContentLoaded` 初始化 | 绑定导航/搜索事件，渲染全部视图 |

---

## 六、每日更新 SOP（定时任务）

「AI生态每日动态更新」定时任务（每天自动执行）流程：

1. **搜索当天 AI 最新动态**，覆盖 8 大类：
   大模型发布 / AI芯片·算力 / 具身智能·机器人 / AI工程·Harness·Agent框架 / 开源项目动态 / AI应用落地 / 政策监管·安全争议 / 资本动态
2. **筛选 8~10 条**当天最新最重要动态，每条含：`cat`、`text`（一句话）、`detail`（100-200字）、`source`、`url`。
3. 编辑 `index.html`：
   - 替换 `DAILY_NEWS` 数组
   - `HISTORY_NEWS` 最前面新增当天记录（同日则替换）
   - 更新 `id="todayDate"` 为当天日期
4. 检查 HTML 结构完整、JS 语法正确（无未闭合标签/引号）。
5. **推送 GitHub**：`git add index.html && git commit -m "daily: 2026-10-05 AI动态" && git push`
6. Netlify 自动构建部署，验证公网 `https://regal-kitten-95e400.netlify.app` 正常。

> ⚠️ 定时任务需要 **PC 端在运行**（文件在本地 C 盘）。如果电脑关机任务失败，可随时对豆包说"执行"手动补跑。

---

## 七、多 Agent 协同开发协议（本文档重点）

### 7.1 总体协作模式

**GitHub 单一事实源 + Netlify 自动发布 + 谁改谁负责验证**。

- 所有代码/数据变更通过 **GitHub 仓库 main 分支**流转；
- push 到 main 即自动上线（无需手动部署）；
- **约定：直接协作 main 分支**（小团队/Agent 协作场景，简单直接；如需严格流程可后续引入 PR）。

### 7.2 角色分工建议（角色可互换，不写死）

| 角色 | 建议承担者 | 职责 |
|---|---|---|
| **统筹/主编**（当前默认：豆包 MainAgent） | 豆包 | 维护本手册、架构数据增删改、每日动态更新、冲突仲裁、最终验收 |
| **实施/开发** | OpenClaw、Codex、DeepSeek Harness 等任意 Agent | 按手册实现新功能/修改数据、本地验证、提交推送 |
| **评审/质检** | 任一 Agent | 推送前检查数据结构合法性、JS 语法、链接有效性 |

> 角色**不固定**：任何 Agent 拿到本手册即可充当任一角色。谁先开始谁就是执行者，统筹职责随时可移交（重要决策过李先生）。

### 7.3 协作流程（串行 & 并行）

**串行接力（推荐用于同一模块深度修改）**：
1. Agent A 拉取仓库最新代码 → 修改 → 本地验证 → `commit + push`（commit message 写明改动内容）。
2. Agent B `git pull` → 在 A 的基础上继续 → push。
3. 冲突时：先 `git pull --rebase`，解决冲突后再 push；解决不了就找统筹者。

**并行分工（推荐用于互不干扰的部分）**：
- Agent A 改 `ARCH_DATA` 的 physical/network 视图；
- Agent B 改 `ARCH_DATA` 的 hardware/aimodel 视图；
- Agent C 改今日动态 `DAILY_NEWS`；
- 各自完成后依次 push（先 pull 再 push，避免覆盖）。
- **并行大忌**：两个 Agent 同时改同一个模块/同一条新闻。

### 7.4 变更类型与操作指引

| 变更类型 | 改哪里 | 示例 |
|---|---|---|
| 新增技术模块 | `ARCH_DATA.xxx.layers[].groups[].modules[]` | 加一个"量子传感"模块 |
| 新增开源产品 | `modules[].products[]` | 给某个模块补 GitHub 项目 |
| 修正模块信息 | 定位到目标对象，改字段值 | 改描述/license/maturity |
| 更新今日动态 | `DAILY_NEWS` + `todayDate` | 每天定时任务 |
| 沉淀历史 | `HISTORY_NEWS` 最前插入/替换 | 当天记录归档 |
| 新增视图/功能 | HTML 骨架 + 渲染函数（需谨慎，先讨论） | 加"行业落地"视图 |
| 改样式 | CSS 变量区（1~199 行） | 换主题色 |

### 7.5 硬性规范（每个 Agent 必须遵守）

1. **只改被点名的范围**：不要顺手"优化"无关代码。
2. **数据结构合法**：新增对象必须包含全部必填字段（见第四章），`id` 全局唯一，`license`/`maturity`/`type` 只能是枚举值。
3. **单文件原则**：所有改动落在 `index.html`，不新建外部 js/css/data 文件（除非统筹者批准重构）。
4. **JS 语法完整**：修改后确认无未闭合引号/括号/标签；可用 `node --check` 抽取 `<script>` 验证或浏览器打开验证。
5. **commit message 规范**：
   - 数据更新：`daily: 2026-10-05 AI动态`
   - 模块新增：`feat: 新增XX模块`
   - 修正：`fix: 修正XX描述`
   - 样式：`style: XX`
6. **推送前必做**：本地浏览器打开 `index.html` 确认页面正常渲染、无报错（F12 Console 无红色错误）。
7. **链接有效性**：新增产品 url 必须是真实可访问的 GitHub/官网地址；不确定就写 `#`。
8. **不要提交敏感信息**：token、密码、验证码绝不入仓库。

### 7.6 与豆包 MainAgent 的协同接口

- **怎么找豆包**：直接对豆包说话即可（当前对话窗口）。
- **豆包能做什么**（建议让豆包干的活）：
  - 每日动态搜索与更新（自动定时 + 手动触发）
  - 架构数据梳理与补充（联网核实最新技术）
  - 冲突仲裁、最终验收、部署状态确认
  - 生成/更新本文档
- **其他 Agent 能做什么**（豆包默认让位）：
  - 具体功能开发（新视图、新交互）
  - 批量数据补充（按手册结构）
  - 独立验证与测试
- **交接方式**：任何 Agent 完成改动后，push 到 GitHub 并在群/对话中说明"改了哪里、验证结果"。豆包收到后拉取复查。

### 7.7 本地运行方式

```bash
# 克隆仓库
git clone https://github.com/EastSouthWestNorthMiddle/doubao-site.git
cd doubao-site

# 本地预览（任选其一）
# 1) 直接双击 index.html 用浏览器打开（file:// 即可，无依赖）
# 2) 起本地静态服务（可选）
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

---

## 八、验收清单（发布前逐项确认）

- [ ] `index.html` 在浏览器打开渲染正常（导航/视图/详情弹窗/搜索可用）
- [ ] 新增模块 id 全局唯一，字段齐全，枚举值合法
- [ ] 今日动态 8~10 条，每条含 cat/text/detail(100-200字)/source/url
- [ ] HISTORY_NEWS 日期倒序，同日不重复
- [ ] todayDate 为当天日期
- [ ] 无未闭合标签/引号，Console 无报错
- [ ] 已 push 到 GitHub main 分支
- [ ] Netlify 自动部署完成，公网可访问
- [ ] commit message 符合规范，无敏感信息

---

## 九、常见问题

**Q: 改了 index.html 但线上没更新？**
A: 确认已 push 到 GitHub（`git log` 看最新 commit），然后等 1~2 分钟，刷新公网站点（可能需强刷 Ctrl+F5）。

**Q: 两个 Agent 同时改了同一处，冲突了？**
A: 后提交者 `git pull` 出现冲突时，对比两边改动，保留正确的，删掉冲突标记 `<<<<<<< ======= >>>>>>>`，再 commit。无法判断找豆包。

**Q: 想加一个全新视图（如"行业应用"）？**
A: 这是结构性改动，先在对话/群中说明方案，由统筹者确认后再动 HTML 骨架和渲染逻辑。

**Q: Netlify token 过期了怎么办？**
A: 自动部署走的是 GitHub↔Netlify 连接（不需要 token 也能自动构建）。只有手动 API 部署才需要 token（有效期 7 天，过期后重新生成）。

---

*本文档由豆包 MainAgent 维护，多 Agent 协同组共同执行。如有更新需求，@豆包。*
