# MIS2001 销售数据看板

一个基于 **Flask + React** 的销售数据可视化看板项目。后端用 Python 聚合订单数据并以 JSON 接口提供，前端用纯 React（JSX）+ Babel 在浏览器内实时编译，**无需任何构建步骤、无需联网**。

## 功能亮点

- 📊 **总览 KPI**：总营收、订单数、销售件数、客单价
- 📈 **月度销售趋势**：12 个月营收柱状图，悬停查看详情
- 🏆 **热销商品排行**：按营收排序的横向条形图
- 👥 **客户画像**：年龄段 / 性别 / 地区分布
- 🎨 **深色科技感 UI**：纯 CSS + SVG 实现，无图表库依赖

## 技术栈

| 端 | 技术 |
|----|------|
| 后端 | Python 3 · Flask 3.0 · 内置 `random` + `math` 生成确定性数据 |
| 前端 | React 18 · Babel Standalone（浏览器内编译 JSX）· 纯 CSS / SVG 图表 |
| 运行 | 单进程 Flask 同时托管 API 和前端静态资源 |

## 快速开始

### 环境要求
- Python ≥ 3.10

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/124090918/MIS2001.git
cd MIS2001

# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
```

浏览器访问 <http://127.0.0.1:5000> 即可看到看板。

> 首次加载 Babel 需要把 JSX 编译成 JavaScript，约 1–2 秒；之后会缓存在浏览器中。

## 项目结构

```
.
├── app.py                  # Flask 后端：数据生成 + API + 静态托管
├── requirements.txt        # Python 依赖
├── .gitignore              # 忽略 __pycache__ / venv / IDE 文件等
├── .gitattributes          # 统一换行符为 LF
└── web/
    ├── index.html          # 页面骨架 + 样式
    ├── app.jsx             # React 前端逻辑（BarChart / RankBars / Donut / Dashboard）
    └── vendor/             # 本地化的 React、Babel 库（无需联网）
        ├── react.js
        ├── react-dom.js
        └── babel.js
```

## 数据说明

订单数据由 `app.py` 中的 `generate_orders()` 函数以 **固定随机种子 `2026`** 生成，保证每次运行结果完全一致：

- **时间维度**：12 个月（含季节性：夏季小高峰 + Q4 节庆加成）
- **商品维度**：6 款 SKU，覆盖笔记本 / 显示器 / 音频 / 配件
- **用户维度**：5 个年龄段 × 3 种性别 × 4 个地区

最终聚合出看板所需的月度营收、商品销量、用户分布等指标。

## API 文档

### `GET /api/dashboard`

返回看板所需的全部聚合数据：

```json
{
  "kpis": {
    "revenue": 1234567,
    "orders": 4321,
    "units": 8765,
    "avgOrder": 285.76
  },
  "monthlySales": [
    { "month": "1月", "revenue": 80000, "orders": 280 }
  ],
  "topProducts": [
    { "name": "Aurora 14 笔记本", "category": "笔记本", "units": 320, "revenue": 415680 }
  ],
  "demographics": {
    "age":    [{ "label": "18-24 岁", "value": 1200 }],
    "gender": [{ "label": "女性", "value": 1800 }],
    "region": [{ "label": "华北", "value": 1300 }]
  }
}
```

### `GET /`

返回 `web/index.html`。

### `GET /web/<path:filename>`

返回 `web/` 目录下的静态资源（含 `app.jsx`、`vendor/*`）。

## 二次开发建议

- 替换数据源：把 `generate_orders()` 改为读取 CSV / 数据库，再让 `/api/dashboard` 输出相同的 JSON 结构即可，前端无需修改。
- 添加图表：参考 `web/app.jsx` 中 `BarChart` / `RankBars` / `Donut` 的写法，用 CSS 或 SVG 绘制即可。
- 引入真实打包：把 `web/app.jsx` 改为正经的 Vite/Webpack 项目，可以去掉 `web/vendor/` 中的 Babel。

## 许可

MIT