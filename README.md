# 设备管家 - 医疗设备全生命周期管理

基于 uni-starter v2.2.15 模板开发的医疗设备管理移动端 App，支持 H5/App/小程序多端运行。

## 项目定位

与 [neihao-web](https://github.com/aiweisoft/neihao-web) 管理后台共享同一 uniCloud 支付宝云环境，构成完整的医疗设备管理系统：

| 项目 | 定位 | 用户 |
|------|------|------|
| **device**（本仓库） | 移动端 App（H5/App/小程序） | 普通用户/医护人员 |
| neihao-web | 管理后台 Web 端 | 管理员 |

## 功能模块

- **首页仪表盘**：设备统计卡片、快捷操作入口、待处理提醒
- **设备管理**：设备列表（搜索/分类/状态标签）、设备详情、扫码
- **报修与维修**：申请报修、报修记录、维修记录、维修详情
- **提醒消息**：已读/未读标记、类型标签
- **用户中心**：登录注册、个人设置、关于

## 技术栈

- 框架：uni-app（Vue2/Vue3 兼容）
- 后端：uniCloud 支付宝云（clientDB + 云对象）
- 认证：uni-id-pages 用户认证
- 推送：UniPush
- 国际化：VueI18n
- UI：uni-ui 组件库

## 报修与维修操作流程

### 首页入口

| 快捷操作 | 跳转页面 | 说明 |
|----------|---------|------|
| 我的报修 | `pages/repair-request/repair` | 双 Tab 页面（申请报修 + 报修记录） |
| 维修记录 | `pages/repair-request/list?tab=1` | 查看与当前用户关联的维修记录 |

### 申请报修

1. 点击首页 **"我的报修"** → 进入 `repair.vue` 的 **"申请报修"** Tab
2. 表单自动填入当前登录用户的**报修人**和**联系电话**
3. 选择故障设备（仅显示使用中的设备）、报修日期、故障描述、紧急程度
4. 提交后：创建报修单（状态=待处理），同时将设备状态置为**维修中**（status=3）
5. 提交成功自动切换到 **"报修记录"** Tab 查看最新记录

### 报修记录

- 在 `repair.vue` **"报修记录"** Tab 中查看当前用户的所有报修单
- 每个报修单展示设备名称、故障描述、紧急程度、处理状态标签
- 点击卡片进入**报修详情页**（`detail.vue`）
- **编辑**：修改报修信息（仅限未关联维修记录的报修单）
- **删除**：删除报修单（存在关联维修记录时禁止删除），同时恢复设备状态为使用中

### 维修记录

- 首页 **"维修记录"** 或 `list.vue` 切换到 **"维修记录"** Tab
- 显示与当前用户报修单关联的所有维修记录
- 点击卡片进入**维修详情页**（`repair-detail.vue`）
- 支持编辑和删除维修记录

### 报修单操作按钮（`list.vue`"我的报修"Tab）

| 按钮 | 出现条件 | 功能 |
|------|---------|------|
| 去维修 | 状态=待处理 | 跳转 `repair-add.vue` 创建维修记录 |
| 记录维修 | 状态=处理中 | 跳转 `repair-add.vue` 继续记录维修 |

### 设备状态联动

| 操作 | 设备状态变化 |
|------|-------------|
| 提交报修 | status: 2(使用中) → 3(维修中) |
| 删除报修单 | status: 3(维修中) → 2(使用中) |
| 维修完成（结果=已修复） | status: 3(维修中) → 2(使用中)，报修单→已完成 |
| 删除维修记录 | status: 2(使用中) → 3(维修中)，报修单→恢复待处理 |

### 数据表

| 表名 | 说明 |
|------|------|
| `medical-device-repair-request` | 报修单（软删除，含 creator、status、urgency、device_id） |
| `medical-device-repair` | 维修记录（软删除，关联报修单、含 result、cost、repair_person 等） |
| `medical-device` | 设备台账（状态联动更新，status 字段：2=使用中/3=维修中） |

## 快速开始

1. 使用 HBuilderX 打开项目
2. 在 `manifest.json` 中配置各平台 AppID
3. 右键 `uniCloud-alipay/database/db_init.json` → 初始化云数据库
4. 运行到浏览器 / 手机 / 小程序模拟器

## 项目结构

```
├── pages/                # 页面文件
│   ├── index/           # 首页
│   ├── device/          # 设备管理
│   ├── repair-request/  # 报修维修
│   ├── alert/           # 提醒消息
│   └── ucenter/         # 个人中心
├── components/          # 自定义组件
├── common/              # 通用逻辑
├── lang/                # 国际化
├── static/              # 静态资源
└── uniCloud-alipay/     # uniCloud 云环境
```

## 依赖

- [uni-starter](https://uniapp.dcloud.io/uniCloud/uni-starter.html) - 项目基础模板
- uni-id-pages - 用户认证
- uni-ui - UI 组件库
