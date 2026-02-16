# DaKa — 工时记录

专为小店老板设计的工时打卡工具。第一客户：Mugi Ramen & Poke (Edgewater, CO)。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- shadcn/ui + Tailwind CSS 4
- localStorage 持久化（无后端）
- PWA standalone 模式

## 项目结构

```
src/app/page.tsx          — 主页（状态管理 + Tabs + 对话框）
src/app/layout.tsx        — LocaleProvider 包裹
src/app/manifest.ts       — PWA manifest
src/components/today-tab.tsx     — 今日打卡
src/components/employees-tab.tsx — 员工管理
src/components/summary-tab.tsx   — 工资汇总 + 分享
src/lib/timesheet-store.ts      — 数据层（localStorage CRUD + 计算）
src/lib/i18n/translations.ts    — 中英翻译字典
src/lib/i18n/use-locale.tsx     — LocaleProvider + hook + LocalePicker
src/lib/i18n/index.ts           — re-exports
```

## 开发命令

```bash
npm run dev    # 本地开发
npm run build  # 构建验证
npm run lint   # ESLint
```

## 关键设计决定

1. **移动端优先** — 目标用户在手机上操作
2. **单页 Tabs 布局** — 今日打卡 / 员工管理 / 工资汇总
3. **localStorage 存储** — Phase 1 无后端，key 前缀 `daka-*`
4. **中英双语 i18n** — `useSyncExternalStore` + localStorage 持久化
5. **跨夜班计算** — `diff < 0 ? diff += 24*60`（餐饮场景必备）
6. **Web Share API** — 手机原生分享，桌面端 fallback 到剪贴板

## 注意事项

- localStorage key 前缀统一用 `daka-`，不要和其他项目冲突
- 翻译 key 以 zh 为基准类型，en 必须对齐所有 key
- `fmtHours` 在 timesheet-store.ts 里导出，组件直接引用
