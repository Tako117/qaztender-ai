import math, random

def lognormal_samples(mean: float, cv: float, n: int = 5000) -> list[float]:
    # Convert mean + coefficient of variation to lognormal params
    # cv = sigma/mean
    variance = (cv * mean) ** 2
    phi = math.sqrt(variance + mean**2)
    mu = math.log(mean**2 / phi)
    sigma = math.sqrt(math.log(phi**2 / mean**2))
    return [random.lognormvariate(mu, sigma) for _ in range(n)]

def ci95(samples: list[float]) -> tuple[float, float]:
    s = sorted(samples)
    lo = s[int(0.025 * len(s))]
    hi = s[int(0.975 * len(s))]
    return lo, hi

def price_deviation_score(deviation_pct: float) -> float:
    # Smooth ramp: 0 at 0%, ~100 at 80%+
    x = max(0.0, deviation_pct)
    return min(100.0, (x / 80.0) * 100.0)