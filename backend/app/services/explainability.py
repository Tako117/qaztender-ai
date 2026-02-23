def build_explanations(factors: dict, contrib: dict, flags: dict) -> list[str]:
    expl = []

    if flags.get("overpriced"):
        expl.append(f"Price deviation contributed +{contrib['price_deviation']:.1f} points: bid is {flags['deviation_pct']:.0f}% above market mean (flag > 30%).")

    if factors["technical_narrowness"] >= 50:
        expl.append(f"Technical narrowness contributed +{contrib['technical_narrowness']:.1f} points: restrictive/brand-oriented wording detected in specification.")

    if factors["quantity_anomaly"] >= 40:
        expl.append(f"Quantity anomaly contributed +{contrib['quantity_anomaly']:.1f} points: requested quantity appears unusually high versus baseline.")

    if factors["participant_count_risk"] >= 50:
        expl.append(f"Low competition contributed +{contrib['participant_count_risk']:.1f} points: only {flags.get('participants_count')} participant(s).")

    if factors["winner_history_pattern"] >= 40:
        expl.append(f"Winner history contributed +{contrib['winner_history_pattern']:.1f} points: supplier dominance pattern in similar tenders.")

    if not expl:
        expl.append("No major red flags triggered. Tender appears broadly competitive and within market norms.")

    return expl