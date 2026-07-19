def compute_variance(value_a: float, value_b: float) -> dict:
    """Shared diff calc: value_a (module/system) vs value_b (GL/manual baseline)."""
    variance = round(value_a - value_b, 2)
    variance_pct = round(abs(variance) / abs(value_b) * 100, 2) if value_b else 0.0
    return {"variance": variance, "variance_pct": variance_pct}


def flag_status(variance: float, threshold_amount: float = None, tolerance_pct: float = None, variance_pct: float = None) -> str:
    if threshold_amount is not None:
        return "flagged" if abs(variance) > threshold_amount else "ok"
    if tolerance_pct is not None and variance_pct is not None:
        return "within_tolerance" if variance_pct <= tolerance_pct else "flagged"
    return "ok"
