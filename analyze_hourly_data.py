#!/usr/bin/env python3
import pandas as pd
import numpy as np
from collections import defaultdict


def analyze_hourly_patterns():
    # CSVファイルを読み込み
    df = pd.read_csv(
        "/Users/i_kawano/Documents/training_waitnum_analysis/crowd-dashboard-modern/public/fit_place24_data.csv"
    )

    # 時間別データを集計
    hourly_stats = defaultdict(list)

    for _, row in df.iterrows():
        hour = row["hour"]
        count = row["count"]
        hourly_stats[hour].append(count)

    # 24時間の平均を計算
    hourly_averages = []

    print("=== 実際のCSVデータに基づく時間別混雑パターン ===")
    print("時間 | 記録数 | 平均人数 | 最小-最大")
    print("-" * 45)

    for hour in range(24):
        if hour in hourly_stats:
            counts = hourly_stats[hour]
            avg = np.mean(counts)
            min_count = min(counts)
            max_count = max(counts)
            record_count = len(counts)
            hourly_averages.append(round(avg))
            print(
                f"{hour:2d}時 | {record_count:4d}回 | {avg:6.1f}人 | {min_count:2d}-{max_count:2d}人"
            )
        else:
            hourly_averages.append(0)
            print(f"{hour:2d}時 | {0:4d}回 | {0:6.1f}人 | データなし")

    print("\n=== 現在のHTMLデフォルト値 ===")
    html_defaults = [
        5,
        3,
        2,
        2,
        3,
        8,
        12,
        18,
        25,
        22,
        28,
        30,  # 0-11時 (AM)
        35,
        38,
        32,
        30,
        33,
        40,
        42,
        45,
        40,
        35,
        25,
        18,  # 12-23時 (PM)
    ]

    print("時間 | HTML値 | 実際平均 | 差異")
    print("-" * 35)

    for hour in range(24):
        html_val = html_defaults[hour]
        actual_val = hourly_averages[hour]
        diff = actual_val - html_val
        print(f"{hour:2d}時 | {html_val:5d} | {actual_val:7.1f} | {diff:+5.1f}")

    print("\n=== 実データベースの推奨デフォルト値 ===")
    print("const defaultCrowdData = [")
    for i, avg in enumerate(hourly_averages):
        if i == 12:
            print("  // 12-23時 (PM)")
        elif i == 0:
            print("  // 0-11時 (AM)")

        suffix = "," if i < 23 else ""
        print(f"  {avg}{suffix}")

    print("];")

    # 統計情報
    total_records = sum(len(counts) for counts in hourly_stats.values())
    hours_with_data = len([h for h in range(24) if hourly_averages[h] > 0])

    print(f"\n=== 統計情報 ===")
    print(f"総記録数: {total_records}件")
    print(f"データがある時間: {hours_with_data}/24時間")
    print(
        f"最も混雑: {max(hourly_averages):.1f}人 ({hourly_averages.index(max(hourly_averages))}時)"
    )
    print(f"最も空いている: {min([x for x in hourly_averages if x > 0]):.1f}人")


if __name__ == "__main__":
    analyze_hourly_patterns()
