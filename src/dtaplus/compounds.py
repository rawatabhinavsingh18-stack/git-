"""Compound resolution and chemical name lookup utilities for DeepDTA+."""

from __future__ import annotations

import functools
import json
import urllib.parse
import urllib.request

from dtaplus.data import CHARISOSMISET


def canonicalize_smiles(smiles: str) -> str:
    """Validate a chemical string with RDKit and return canonical SMILES."""
    try:
        from rdkit import Chem
    except ImportError as exc:  # pragma: no cover - dependency error is environment-specific
        raise RuntimeError("RDKit is required for chemical validation. Install requirements.txt.") from exc

    molecule = Chem.MolFromSmiles(smiles)
    if molecule is None:
        raise ValueError("RDKit could not parse this SMILES as a valid molecule.")
    canonical = Chem.MolToSmiles(molecule, canonical=True)
    unsupported = sorted(set(c for c in canonical if c not in CHARISOSMISET))
    if unsupported:
        raise ValueError(f"Canonical SMILES contains characters unsupported by this model: {unsupported}")
    return canonical

# Pre-indexed chemical dictionary containing common kinase inhibitors and benchmark drugs
COMMON_COMPOUNDS: dict[str, str] = {
    # Davis kinase inhibitors
    "dasatinib": "CC1=C(C(=CC=C1)Cl)NC(=O)C2=CN=C(S2)NC3=CC(=NC(=N3)C)N4CCN(CC4)CCO",
    "lapatinib": "CS(=O)(=O)CCNCC1=CC=C(O1)C2=CC3=C(C=C2)N=CN=C3NC4=CC(=C(C=C4)OCC5=CC(=CC=C5)F)Cl",
    "imatinib": "CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5",
    "erlotinib": "COCCOC1=C(C=C2C(=C1)C(=NC=N2)NC3=CC=CC(=C3)C#C)OCCOC",
    "gefitinib": "COC1=C(C=C2C(=C1)N=CN=C2NC3=CC(=C(C=C3)F)Cl)OCCCN4CCOCC4",
    "sorafenib": "CNC(=O)C1=NC=CC(=C1)OC2=CC=C(C=C2)NC(=O)NC3=CC(=C(C=C3)Cl)C(F)(F)F",
    "sunitinib": "CCN(CC)CCNC(=O)C1=C(NC(=C1C)C=C2C3=C(C=CC(=C3)F)NC2=O)C",
    "nilotinib": "CC1=C(C=C(C=C1)C(=O)NC2=CC(=CC(=C2)N3C=C(N=C3)C)C(F)(F)F)NC4=NC=CC(=N4)C5=CN=CC=C5",
    "bosutinib": "CN1CCN(CC1)CCCOC2=C(C=C3C(=C2)N=CC(=C3NC4=CC(=C(C=C4Cl)Cl)OC)C#N)OC",
    "axitinib": "CNC(=O)C1=CC=CC=C1SC2=CC3=C(C=C2)C(=NN3)C=CC4=CC=CC=N4",
    "crizotinib": "CC(C1=C(C=CC(=C1Cl)F)Cl)OC2=C(N=CC(=C2)C3=CN(N=C3)C4CCNCC4)N",
    "pazopanib": "CC1=C(C=C(C=C1)NC2=NC=CC(=N2)N(C)C3=CC4=NN(C(=C4C=C3)C)C)S(=O)(=O)N",
    "afatinib": "CN(C)CC=CC(=O)NC1=C(C=C2C(=C1)C(=NC=N2)NC3=CC(=C(C=C3)F)Cl)OC4CCOC4",
    "ruxolitinib": "C1CCC(C1)C(CC#N)N2C=C(C=N2)C3=C4C=CNC4=NC=N3",
    "jakafi": "C1CCC(C1)C(CC#N)N2C=C(C=N2)C3=C4C=CNC4=NC=N3",
    "tofacitinib": "CC1CCN(CC1N(C)C2=NC=NC3=C2C=CN3)C(=O)CC#N",
    "vandetanib": "CN1CCC(CC1)COC2=C(C=C3C(=C2)N=CN=C3NC4=C(C=C(C=C4)Br)F)OC",
    "vatalanib": "C1=CC=C2C(=C1)C(=NN=C2NC3=CC=C(C=C3)Cl)CC4=CC=NC=C4",
    "staurosporine": "CC12C(C(CC(O1)N3C4=CC=CC=C4C5=C6C(=C7C8=CC=CC=C8N2C7=C53)CNC6=O)NC)OC",
    "quizartinib": "CC(C)(C)C1=CC(=NO1)NC(=O)NC2=CC=C(C=C2)C3=CN4C5=C(C=C(C=C5)OCCN6CCOCC6)SC4=N3",
    "neratinib": "CCOC1=C(C=C2C(=C1)N=CC(=C2NC3=CC(=C(C=C3)OCC4=CC=CC=N4)Cl)C#N)NC(=O)C=CCN(C)C",
    "selumetinib": "CN1C=NC2=C1C=C(C(=C2F)NC3=C(C=C(C=C3)Br)Cl)C(=O)NOCCO",
    "fedratinib": "CC1=CN=C(N=C1NC2=CC(=CC=C2)S(=O)(=O)NC(C)(C)C)NC3=CC=C(C=C3)OCCN4CCCC4",
    "canertinib": "C=CC(=O)NC1=C(C=C2C(=C1)C(=NC=N2)NC3=CC(=C(C=C3)F)Cl)OCCCN4CCOCC4",
    "cediranib": "CC1=CC2=C(N1)C=CC(=C2F)OC3=NC=NC4=CC(=C(C=C43)OC)OCCCN5CCCC5",
    "enzastaurin": "CN1C=C(C2=CC=CC=C21)C3=C(C(=O)NC3=O)C4=CN(C5=CC=CC=C54)C6CCN(CC6)CC7=CC=CC=N7",
    "foretinib": "COC1=CC2=C(C=CN=C2C=C1OCCCN3CCOCC3)OC4=C(C=C(C=C4)NC(=O)C5(CC5)C(=O)NC6=CC=C(C=C6)F)F",
    "lestaurtinib": "CC12C(CC(O1)N3C4=CC=CC=C4C5=C6C(=C7C8=CC=CC=C8N2C7=C53)CNC6=O)(CO)O",
    "masitinib": "CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC(=CS4)C5=CN=CC=C5",
    "motesanib": "CC1(CNC2=C1C=CC(=C2)NC(=O)C3=C(N=CC=C3)NCC4=CC=NC=C4)C",
    "pictilisib": "CS(=O)(=O)N1CCN(CC1)CC2=CC3=C(S2)C(=NC(=N3)C4=C5C=NNC5=CC=C4)N6CCOCC6",
    "tandutinib": "CC(C)OC1=CC=C(C=C1)NC(=O)N2CCN(CC2)C3=NC=NC4=CC(=C(C=C43)OC)OCCCN5CCCCC5",
    "tozasertib": "CC1=CC(=NN1)NC2=NC(=NC(=C2)N3CCN(CC3)C)SC4=CC=C(C=C4)NC(=O)C5CC5",
    # Common household / reference drugs
    "aspirin": "CC(=O)OC1=CC=CC=C1C(=O)O",
    "acetylsalicylic acid": "CC(=O)OC1=CC=CC=C1C(=O)O",
    "caffeine": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    "metformin": "CN(C)C(=N)N=C(N)N",
    "ibuprofen": "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O",
    "acetaminophen": "CC(=O)NC1=CC=C(C=C1)O",
    "paracetamol": "CC(=O)NC1=CC=C(C=C1)O",
}


@functools.lru_cache(maxsize=512)
def query_pubchem(name: str, timeout: float = 4.0) -> tuple[str | None, str | None]:
    """
    Queries PubChem PUG REST API to fetch canonical SMILES by compound name.
    Cached in memory for zero-latency repeated queries.
    """
    clean_name = name.strip()
    encoded = urllib.parse.quote(clean_name)
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded}/property/Title,SMILES/JSON"
    req = urllib.request.Request(url, headers={"User-Agent": "DeepDTA-Research-Assistant"})

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            props = data["PropertyTable"]["Properties"][0]
            title = props.get("Title", clean_name)
            smiles = props.get("SMILES") or props.get("ConnectivitySMILES")
            return title, smiles
    except Exception:  # noqa: BLE001
        return None, None


def resolve_compound(name_or_smiles: str) -> tuple[str, str, str | None]:
    """
    Resolves input string to (display_name, smiles, error_message).
    1. Checks if it's already a valid SMILES.
    2. Checks local pre-indexed dictionary.
    3. Queries PubChem REST API.
    """
    query = name_or_smiles.strip()
    if not query:
        return "", "", "Please provide a compound name or SMILES string."

    # Check if query is in local dictionary
    lower_query = query.lower()
    if lower_query in COMMON_COMPOUNDS:
        display_title = query.capitalize() if not query.isupper() else query
        return display_title, COMMON_COMPOUNDS[lower_query], None

    # Check if query itself looks like a SMILES (contains bonds/rings like =, #, @, numbers)
    # and has characters that match our SMILES character set
    is_mostly_smiles = any(c in query for c in "()=#123456789") and not (" " in query)
    if is_mostly_smiles:
        # Check invalid characters
        invalid_chars = [ch for ch in query if ch not in CHARISOSMISET]
        if not invalid_chars:
            return "Custom SMILES", query, None

    # Try online PubChem lookup
    title, pubchem_smiles = query_pubchem(query)
    if pubchem_smiles:
        # Validate that characters are supported by our model dictionary
        unsupported = [ch for ch in pubchem_smiles if ch not in CHARISOSMISET]
        if unsupported:
            return (
                title or query,
                pubchem_smiles,
                f"Resolved compound contains characters {set(unsupported)} outside standard vocab.",
            )
        return title or query, pubchem_smiles, None

    # If it was treated as direct SMILES with invalid characters
    if is_mostly_smiles:
        invalid_chars = [ch for ch in query if ch not in CHARISOSMISET]
        return (
            query,
            "",
            f"SMILES contains invalid character(s): {set(invalid_chars)}",
        )

    return (
        query,
        "",
        f"Could not find compound '{query}'. Please check the spelling or enter a SMILES string directly.",
    )


def get_popular_compound_names() -> list[str]:
    """Returns a curated list of popular compounds for UI dropdown / auto-completion."""
    return [
        "Dasatinib",
        "Lapatinib",
        "Imatinib",
        "Erlotinib",
        "Gefitinib",
        "Sorafenib",
        "Sunitinib",
        "Nilotinib",
        "Bosutinib",
        "Axitinib",
        "Crizotinib",
        "Pazopanib",
        "Afatinib",
        "Ruxolitinib",
        "Tofacitinib",
        "Aspirin",
        "Caffeine",
        "Metformin",
        "Ibuprofen",
        "Acetaminophen",
    ]
