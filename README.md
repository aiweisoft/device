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
- **报修与维修**：报修提交、维修记录列表
- **提醒消息**：已读/未读标记、类型标签
- **用户中心**：登录注册、个人设置、关于

## 技术栈

- 框架：uni-app（Vue2/Vue3 兼容）
- 后端：uniCloud 支付宝云（clientDB + 云对象）
- 认证：uni-id-pages 用户认证
- 推送：UniPush
- 国际化：VueI18n
- UI：uni-ui 组件库

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
