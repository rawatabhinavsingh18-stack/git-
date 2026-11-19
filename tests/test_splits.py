"""Tests for dataset split protocols: random, cold-drug, and cold-target."""


from dtaplus.data import DavisData


def test_random_split_folds():
    data = DavisData(data_dir="data/davis")
    for val_fold_idx in range(5):
        splits = data.get_random_split(val_fold_idx=val_fold_idx)
        train_set = set(splits.train_idx.tolist())
        val_set = set(splits.val_idx.tolist())
        test_set = set(splits.test_idx.tolist())

        # All disjoint
        assert len(train_set.intersection(val_set)) == 0
        assert len(train_set.intersection(test_set)) == 0
        assert len(val_set.intersection(test_set)) == 0

        # Total count
        assert len(train_set) + len(val_set) == 25046
        assert len(test_set) == 5010


def test_cold_drug_splits_no_leakage():
    data = DavisData(data_dir="data/davis")
    for seed in range(5):
        splits = data.get_cold_drug_split(seed=seed, test_ratio=0.2, val_ratio=0.1)

        train_drugs = set(data.ri[splits.train_idx].tolist())
        val_drugs = set(data.ri[splits.val_idx].tolist())
        test_drugs = set(data.ri[splits.test_idx].tolist())

        # No test drug in train or val
        assert len(train_drugs.intersection(test_drugs)) == 0, (
            f"Seed {seed}: Leakage! Test drugs appeared in train: {train_drugs.intersection(test_drugs)}"
        )
        assert len(val_drugs.intersection(test_drugs)) == 0, (
            f"Seed {seed}: Leakage! Test drugs appeared in val: {val_drugs.intersection(test_drugs)}"
        )

        # No val drug in train
        assert len(train_drugs.intersection(val_drugs)) == 0, (
            f"Seed {seed}: Leakage! Val drugs appeared in train: {train_drugs.intersection(val_drugs)}"
        )

        # Check total number of unique drugs
        total_drugs = len(train_drugs.union(val_drugs).union(test_drugs))
        assert total_drugs == data.num_drugs


def test_cold_target_splits_no_leakage():
    data = DavisData(data_dir="data/davis")
    for seed in range(5):
        splits = data.get_cold_target_split(seed=seed, test_ratio=0.2, val_ratio=0.1)

        train_prots = set(data.ci[splits.train_idx].tolist())
        val_prots = set(data.ci[splits.val_idx].tolist())
        test_prots = set(data.ci[splits.test_idx].tolist())

        # No test protein in train or val
        assert len(train_prots.intersection(test_prots)) == 0, (
            f"Seed {seed}: Leakage! Test proteins appeared in train: {train_prots.intersection(test_prots)}"
        )
        assert len(val_prots.intersection(test_prots)) == 0, (
            f"Seed {seed}: Leakage! Test proteins appeared in val: {val_prots.intersection(test_prots)}"
        )

        # No val protein in train
        assert len(train_prots.intersection(val_prots)) == 0, (
            f"Seed {seed}: Leakage! Val proteins appeared in train: {train_prots.intersection(val_prots)}"
        )

        # Check total number of unique proteins
        total_prots = len(train_prots.union(val_prots).union(test_prots))
        assert total_prots == data.num_proteins
