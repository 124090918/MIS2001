"""Sales dashboard - Python API (Flask) + React frontend.

Run:
    pip install -r requirements.txt
    python app.py

Then open http://127.0.0.1:5000
"""

import math
import random
from collections import defaultdict
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"

MONTHS = [f"{i}月" for i in range(1, 13)]

# name, category, unit price, popularity
PRODUCTS = [
    ("Aurora 14 笔记本", "笔记本", 1299, 1.0),
    ('Vertex 27" 显示器', "显示器", 349, 1.4),
    ("Halo 头戴耳机", "音频", 249, 1.2),
    ("Orbit 机械键盘", "配件", 119, 1.8),
    ("Pulse 蓝牙音箱", "音频", 89, 2.0),
    ("Nimbus 无线鼠标", "配件", 39, 2.6),
]

REGIONS = ["华北", "华南", "华东", "华西"]
AGE_GROUPS = ["18-24 岁", "25-34 岁", "35-44 岁", "45-54 岁", "55 岁以上"]
AGE_BIAS = {"18-24 岁": 0.9, "25-34 岁": 1.5, "35-44 岁": 1.3, "45-54 岁": 1.0, "55 岁以上": 0.6}

GENDERS = ["女性", "男性", "其他"]
GENDER_BIAS = {"女性": 1.05, "男性": 1.0, "其他": 0.2}

app = Flask(__name__, static_folder=None)


def generate_orders():
    """Build a deterministic order log: one row per (month, product, age, gender, region)."""
    rng = random.Random(2026)
    rows = []
    for m, month in enumerate(MONTHS):
        # seasonality: a summer peak plus a Q4 holiday bump
        season = 1 + 0.25 * math.sin(m / 12 * 2 * math.pi) + (0.45 if m >= 9 else 0)
        for name, category, price, popularity in PRODUCTS:
            for age in AGE_GROUPS:
                for gender in GENDERS:
                    for region in REGIONS:
                        factor = season * popularity * AGE_BIAS[age] * GENDER_BIAS[gender]
                        orders = max(1, round(rng.gauss(3, 1.2) * factor))
                        units = orders * rng.randint(1, 3)
                        rows.append({
                            "month": month,
                            "product": name,
                            "category": category,
                            "price": price,
                            "region": region,
                            "age": age,
                            "gender": gender,
                            "orders": orders,
                            "units": units,
                            "revenue": units * price,
                        })
    return rows


ORDERS = generate_orders()


@app.route("/api/dashboard")
def dashboard():
    """Aggregate the raw order log into everything the dashboard needs."""
    monthly = defaultdict(lambda: {"revenue": 0.0, "orders": 0})
    products = defaultdict(lambda: {"units": 0, "revenue": 0.0, "category": ""})
    by_age = defaultdict(int)
    by_gender = defaultdict(int)
    by_region = defaultdict(int)

    for row in ORDERS:
        monthly[row["month"]]["revenue"] += row["revenue"]
        monthly[row["month"]]["orders"] += row["orders"]

        product = products[row["product"]]
        product["units"] += row["units"]
        product["revenue"] += row["revenue"]
        product["category"] = row["category"]

        by_age[row["age"]] += row["orders"]
        by_gender[row["gender"]] += row["orders"]
        by_region[row["region"]] += row["orders"]

    monthly_sales = [
        {"month": m, "revenue": round(monthly[m]["revenue"]), "orders": monthly[m]["orders"]}
        for m in MONTHS
    ]

    top_products = sorted(
        ({"name": n, "category": d["category"], "units": d["units"], "revenue": round(d["revenue"])}
         for n, d in products.items()),
        key=lambda p: p["revenue"],
        reverse=True,
    )

    total_revenue = sum(m["revenue"] for m in monthly_sales)
    total_orders = sum(m["orders"] for m in monthly_sales)

    return jsonify({
        "kpis": {
            "revenue": total_revenue,
            "orders": total_orders,
            "units": sum(p["units"] for p in top_products),
            "avgOrder": round(total_revenue / total_orders, 2),
        },
        "monthlySales": monthly_sales,
        "topProducts": top_products,
        "demographics": {
            "age": [{"label": a, "value": by_age[a]} for a in AGE_GROUPS],
            "gender": [{"label": g, "value": by_gender[g]} for g in GENDERS],
            "region": [{"label": r, "value": by_region[r]} for r in REGIONS],
        },
    })


@app.route("/")
def index():
    return send_from_directory(WEB_DIR, "index.html")


@app.route("/web/<path:filename>")
def web_files(filename):
    return send_from_directory(WEB_DIR, filename)


if __name__ == "__main__":
    print("Dashboard running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
