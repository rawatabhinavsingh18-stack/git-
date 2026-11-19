import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("src"))

import numpy as np
from fastapi.testclient import TestClient

from service.app import app


def run_load_test(n_requests: int = 200) -> None:
    print(f"Starting load test: {n_requests} sequential requests to /predict...")
    payload = {
        "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
        "protein_sequence": "MKWVTFISLLFLFSSAYSRGVFRRDTHKSEIAHRFKDLGEEHFKGLVLIAFSQYLQQCPFDEHVKLVNELTEFAKTCVADESHAGCEKSLHTLFGDELCKVASLRETYGDMADCCEKQEPERNECFLSHKDDSPDLPKLKPDPNTLCDEFKADEKKFWGKYLYEIARRHPYFYAPELLYYANKYNGVFQECCQAEDKGACLLPKIETMREKVLASSARQRLRCASIQKFGERALKAWSVARLSQKFPKAEFVEVTKLVTDLTKVHKECCHGDLLECADDRADLAKYICDNQDTISSKLKECCDKPLLEKSHCIAEVEKDAIPENLPPLTADFAEDKDVCKNYQEAKDAFLGSFLYEYSRRHPEYAVSVLLRLAKEYEATLEECCAKDDPHACYSTVFDKLKHLVDEPQNLIKQNCDQFEKLGEYGFQNALIVRYTRKVPQVSTPTLVEVSRSLGKVGTRCCTKPESERMPCTEDYLSLILNRLCVLHEKTPVSEKVTKCCTESLVNRRPCFSALTVDETYVPKEFKAETFTFHADICTLSEKERQIKKQTALVELVKHKPKATKEQLKAVMDDFAAFVEKCCKADDKETCFAEEGKKLVAASQAALGL",
    }

    latencies_ms = []
    with TestClient(app) as client:
        # Warm-up
        for _ in range(5):
            client.post("/predict", json=payload)

        for i in range(n_requests):
            t0 = time.perf_counter()
            resp = client.post("/predict", json=payload)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            assert resp.status_code == 200
            latencies_ms.append(elapsed_ms)

    latencies = np.array(latencies_ms)
    p50 = np.percentile(latencies, 50)
    p90 = np.percentile(latencies, 90)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)
    mean_lat = np.mean(latencies)

    print("\n========== Load Test Latency Results (200 requests) ==========")
    print(f"Mean Latency: {mean_lat:.2f} ms")
    print(f"p50  Latency: {p50:.2f} ms")
    print(f"p90  Latency: {p90:.2f} ms")
    print(f"p95  Latency: {p95:.2f} ms")
    print(f"p99  Latency: {p99:.2f} ms")
    print(f"Target Check: p95 < 300 ms -> {'PASS' if p95 < 300.0 else 'FAIL'}")
    print("===============================================================\n")


if __name__ == "__main__":
    run_load_test()
