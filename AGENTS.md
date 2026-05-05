# AGENTS.md — device 项目

## 项目概述

device 是一个基于 **uni-app（Vue2/Vue3 兼容）** 的**医疗设备管理移动端 App**（含 H5/小程序），托管于 **uniCloud 支付宝云** 环境。基于 uni-starter v2.2.15 模板改造，内置 uni-id-pages 用户认证、国际化、App 升级中心、UniPush 推送等功能。

### ⚠️ 重要：与 neihao-web 的关系

本项目和同级目录下的 **`neihao-web`** 共同构成一套完整的**医疗设备管理系统**：

| 项目 | 模板 | 定位 | 用户 |
|------|------|------|------|
| **device**（本项目） | uni-starter v2.2.15 | 移动端 App（H5/App/小程序） | 普通用户/医护人员 |
| **neihao-web** | uni-admin v2.5.13 | 管理后台 Web 端 | 管理员 |

**两项目共享同一个 uniCloud 支付宝云环境**（相同的数据库和云函数）。两项目均包含 100 个数据表 schema（93 基础表 + 7 个 `medical-device*` 业务表）。

**开发时注意**：修改数据库 schema 或云函数需两项目同步更新。业务逻辑可能会在两项目间复用。

---

## 项目结构

```
device/
├── App.vue                    # 应用入口（onLaunch 初始化）
├── main.js                    # Vue 实例挂载（兼容 Vue2/Vue3）
├── manifest.json              # 应用配置（AppID、权限、打包配置）
├── pages.json                 # 页面路由、TabBar、分包、globalStyle
├── uni.scss                   # SCSS 变量（颜色、字号、间距、圆角等）
├── uni-starter.config.js      # 项目业务配置（H5域名、国际化开关）
├── androidPrivacy.json        # Android 隐私协议提示配置
├── index.html                 # H5 平台入口 HTML
│
├── common/                    # 通用逻辑模块
│   ├── appInit.js             # 初始化：挂载配置、拦截云对象、clientDB 错误监听
│   └── openApp.js             # H5 端全局悬浮栏（引导下载 App）
│
├── pages/                     # 页面文件
│   ├── index/                 # 首页仪表盘（统计卡片 + 快捷操作 + 待处理提醒）
│   │   └── index.vue
│   ├── device/                # 设备管理
│   │   ├── device-list.vue    # 设备列表（搜索 + 分类筛选 + 状态标签）
│   │   ├── detail.vue         # 设备详情（全字段展示 + 报修入口 + 维修记录）
│   │   └── scan.vue           # 扫码（App 原生扫码 + 手动输入）
│   ├── repair-request/        # 报修与维修
│   │   ├── list.vue           # 报修与维修记录列表（双 tab 切换）
│   │   └── add.vue            # 提交报修表单
│   ├── alert/                 # 提醒消息
│   │   └── list.vue           # 提醒列表（已读/未读标记 + 类型标签）
│   ├── ucenter/               # 个人中心、设置、关于、邀请、阅读记录
│   └── uni-agree/             # 隐私协议同意页
│
├── components/                # 自定义组件
│   ├── refreshBox/            # nvue 下拉刷新组件
│   └── uni-load-state/        # 通用加载状态组件
│
├── lang/                      # 国际化（i18n）
│   ├── i18n.js                # i18n 初始化（Vue2:VueI18n / Vue3:createI18n）
│   ├── zh-Hans.js             # 简体中文
│   └── en.js                  # 英文
│
├── static/                    # 静态资源（tabbar 图标、字体图标文件、logo 等）
├── node_modules/              # npm 依赖（仅 qrcodejs2）
│
├── uni_modules/               # 62 个插件（核心：uni-id-pages, uni-upgrade-center-app, uni-ui 等）
│
└── uniCloud-alipay/           # uniCloud 支付宝云（与 neihao-web 共享）
    ├── database/              # 100 个数据表 schema（93 基础 + 7 医疗业务表）+ 初始化数据
    └── cloudfunctions/        # 7 个云函数（uni-id-co, uni-sms-co, uni-portal 等）
```

### 关键设计决策

- **状态管理**：无 Vuex/Pinia，使用 `uni-id-pages/common/store.js` 响应式 store（Vue2: `Vue.observable` / Vue3: `reactive`）
- **API 层**：无 HTTP API 封装，直接使用 uniCloud clientDB（`unicloud-db` 组件 + `uniCloud.database()`）+ 云对象（`uniCloud.importObject`）
- **组件注册**：通过 `uni_modules` 目录自动满足 easycom 规则，无需手动 import
- **分包**：`uni-id-pages` 和 `uni-feedback` 配置为 subPackages
- **页面路由**：TabBar 包含"首页""设备""我的"三个入口，报修/提醒等通过页面跳转访问

---

## 构建 / 运行 / 测试命令

本项目为 uni-app 模板项目，**无 package.json scripts**，构建与运行由 HBuilderX IDE 统一管理：

| 操作 | 方式 |
|------|------|
| 运行到 H5 | HBuilderX 顶部菜单 → 运行 → 运行到浏览器 |
| 运行到 App | HBuilderX → 运行 → 运行到手机或模拟器 |
| 运行到小程序 | HBuilderX → 运行 → 运行到小程序模拟器 |
| 发行打包 | HBuilderX → 发行 → 相应平台 |
| 云函数本地运行 | HBuilderX 中右键云函数目录 → 本地运行 |
| 初始化云数据库 | 右键 `uniCloud-alipay/database/db_init.json` → 初始化云数据库 |

**无 lint / 测试 / 格式化命令**（无 ESLint、Prettier、Jest 等配置）。编码时需人工保证代码质量。

---

## 代码风格与协作规则

### 通用规范

- **缩进**：使用 tab 缩进
- **引号**：字符串默认使用双引号 `"`
- **分号**：语句末尾统一加分号
- **编码**：UTF-8，行尾 LF
- **Vue 文件**：`<template>` / `<script>` / `<style>` 顺序，`<style>` 使用 `scss`（默认 `scoped`）

### Import 规则

```javascript
// 1. 项目配置
import uniStarterConfig from '@/uni-starter.config.js'
// 2. 通用模块
import initApp from '@/common/appInit.js'
// 3. uni_modules 插件
import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js'
```

- 使用 `@/` 别名引用根目录模块
- uni_modules 通过插件名直接引用
- 条件编译使用 `// #ifdef PLATFORM` / `// #endif`，平台宏：`APP`、`H5`、`MP-WEIXIN`、`VUE2`、`VUE3`

### 命名规范

- **组件文件**：kebab-case（`refreshBox.vue` → `<refresh-box />`）
- **变量/函数**：camelCase（如 `getApp`, `initAppVersion`）
- **SCSS 变量**：`$uni-` 前缀（如 `$uni-color-primary`）
- **路由路径**：小写，多级用 `/` 分隔
- **语言包 key**：与页面路径层级对应

### 错误处理

- clientDB 错误通过 `db.on('error', handler)` 全局监听
- 云对象请求通过 `uniCloud.interceptObject()` 统一拦截（失败时 `console.error`）
- 异步操作优先使用 `async/await`，配合 `.catch()` 兜底
- 用户提示使用 `uni.showToast()` / `uni.showModal()`，调试日志用 `console.log`

### uni-app H5 注意事项

- **禁止**对 `input` / `textarea` 设置 `box-sizing: border-box`（H5 平台会导致无法聚焦输入）
- 条件编译代码块内的 JSON 需保持语法合法

### Git 协作

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范提交
- 敏感配置（`uni-config-center/uni-id/config.json` 中的 `tokenSecret` 等）禁止提交
- 新增 uni_modules 通过 HBuilderX 插件市场安装，保留 `uni_modules/` 目录结构
- 修改 `uniCloud-alipay/` 下的 schema 或云函数时，确认 neihao-web 项目是否需要同步

---

## 补充信息

- **neihao-web 位置**：`../neihao-web/`
- **neihao-web AGENTS.md** 参见该目录下的 `AGENTS.md`，包含管理后台侧完整的代码规范、组件使用清单（`unicloud-db` + `uni-table` + `uni-forms` 模式）、业务表结构等
- **业务表清单**（在 neihao-web 的 `uniCloud-alipay/database/` 下）：
  - `medical-device` — 设备台账
  - `medical-device-category` — 设备分类
  - `medical-device-location` — 存放位置
  - `medical-device-repair` — 维修记录
  - `medical-device-repair-request` — 设备报修
  - `medical-device-maintenance` — 保养计划
  - `medical-device-alert` — 报警提醒
