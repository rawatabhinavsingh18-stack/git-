/* ========================================================
   DeepDTA Explorer — JavaScript Application Logic
   ======================================================== */

// ══════════════ NAVIGATION ══════════════
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Nav click handlers
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(item.dataset.page);
  });
});

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
});

document.getElementById('overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
});

// ══════════════ ACCORDION ══════════════
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const body = header.nextElementSibling;
    const isOpen = body.classList.contains('open');
    // close all
    document.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
    document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('open'));
    if (!isOpen) {
      body.classList.add('open');
      header.classList.add('open');
    }
  });
});

// ══════════════ TABS ══════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  });
});

// ══════════════ SMILES VOCABULARY ══════════════
// 64 SMILES characters from DeepDTA paper (collected from ~2M PubChem SMILES)
const SMILES_CHARS = [
  ' ','#','%','(',')','+','-','.','/',
  '0','1','2','3','4','5','6','7','8','9',
  '=','@','A','B','C','F','H','I','K','L',
  'M','N','O','P','R','S','T','V','W','X',
  'Y','Z','[','\\',']','a','b','c','d','e',
  'f','g','h','i','k','l','m','n','o','p',
  'r','s','t','u','v','y'
];

// 25 amino acid characters from DeepDTA paper (from 550K UniProt sequences)
const PROTEIN_CHARS = [
  'A','C','D','E','F','G','H','I','K','L',
  'M','N','P','Q','R','S','T','V','W','X',
  'Y','Z','U','O','B'
];

// Build lookup maps (1-indexed like DeepDTA)
const SMILES_MAP = {};
SMILES_CHARS.forEach((c, i) => { SMILES_MAP[c] = i + 1; });

const PROTEIN_MAP = {};
PROTEIN_CHARS.forEach((c, i) => { PROTEIN_MAP[c] = i + 1; });

// Render vocabulary grids
function renderVocabGrid(containerId, chars, map) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = chars.map(c => `
    <div class="vocab-item">
      <span class="vocab-char">${c === ' ' ? '⎵' : escapeHtml(c)}</span>
      <span class="vocab-idx">${map[c]}</span>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

renderVocabGrid('smiles-vocab-grid', SMILES_CHARS, SMILES_MAP);
renderVocabGrid('protein-vocab-grid', PROTEIN_CHARS, PROTEIN_MAP);

// ══════════════ SMILES ENCODER ══════════════
function encodeSMILES() {
  const input = document.getElementById('smiles-encode-input').value.trim();
  const out = document.getElementById('smiles-encode-output');
  if (!input) { out.innerHTML = '<p style="color:var(--text-muted)">Please enter a SMILES string.</p>'; return; }

  const tokens = input.split('').map(c => ({
    char: c,
    idx: SMILES_MAP[c] || 0
  }));

  const unknowns = tokens.filter(t => t.idx === 0).map(t => t.char);

  out.innerHTML = `
    <div style="margin-bottom:10px; font-size:0.8rem; color:var(--text-muted)">
      Length: <strong style="color:var(--text)">${tokens.length}</strong> chars
      ${input.length > 85 ? '<span style="color:var(--accent)"> ⚠ Exceeds Davis max (85) — will be truncated</span>' : ''}
      ${input.length > 100 ? '<span style="color:var(--accent)"> ⚠ Exceeds KIBA max (100) — will be truncated</span>' : ''}
      ${unknowns.length > 0 ? `<span style="color:var(--danger)"> ⚠ Unknown chars (→0): ${[...new Set(unknowns)].join(', ')}</span>` : ''}
    </div>
    <div class="encode-tokens">
      ${tokens.map(t => `
        <div class="token">
          <span class="token-char">${t.char === ' ' ? '⎵' : escapeHtml(t.char)}</span>
          <span class="token-num">${t.idx}</span>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:12px; font-size:0.78rem; color:var(--text-muted)">Integer array:</div>
    <div class="code-block">[${tokens.map(t => t.idx).join(', ')}]</div>
  `;
}

function encodeProtein() {
  const input = document.getElementById('protein-encode-input').value.trim().toUpperCase();
  const out = document.getElementById('protein-encode-output');
  if (!input) { out.innerHTML = '<p style="color:var(--text-muted)">Please enter a protein sequence.</p>'; return; }

  const tokens = input.split('').map(c => ({
    char: c,
    idx: PROTEIN_MAP[c] || 0
  }));

  const unknowns = tokens.filter(t => t.idx === 0).map(t => t.char);

  out.innerHTML = `
    <div style="margin-bottom:10px; font-size:0.8rem; color:var(--text-muted)">
      Length: <strong style="color:var(--text)">${tokens.length}</strong> residues
      ${input.length > 1200 ? '<span style="color:var(--accent)"> ⚠ Exceeds Davis max (1200)</span>' : ''}
      ${unknowns.length > 0 ? `<span style="color:var(--danger)"> ⚠ Unknown chars (→0): ${[...new Set(unknowns)].join(', ')}</span>` : ''}
    </div>
    <div class="encode-tokens">
      ${tokens.slice(0, 60).map(t => `
        <div class="token">
          <span class="token-char">${escapeHtml(t.char)}</span>
          <span class="token-num">${t.idx}</span>
        </div>
      `).join('')}
      ${tokens.length > 60 ? `<div class="token" style="color:var(--text-dim)"><span class="token-char">…</span><span class="token-num">+${tokens.length - 60}</span></div>` : ''}
    </div>
    <div style="margin-top:12px; font-size:0.78rem; color:var(--text-muted)">Integer array (first 20):</div>
    <div class="code-block">[${tokens.slice(0, 20).map(t => t.idx).join(', ')}${tokens.length > 20 ? ', ...' : ''}]</div>
  `;
}

// Auto-encode on page load
document.addEventListener('DOMContentLoaded', () => {
  encodeSMILES();
});
// Also encode at script load
encodeSMILES();

// ══════════════ PREDICTOR ══════════════
const EXAMPLE_SMILES = {
  'imatinib': 'Cc1ccc(cc1Nc2nccc(n2)c3cccnc3)NC(=O)c4ccc(cc4)CN5CCN(CC5)C',
  'erlotinib': 'C#Cc1cccc(c1)Nc2ncnc3cc(c(cc23)OCCO)OCCO',
  'aspirin':   'CC(=O)Oc1ccccc1C(=O)O',
  'paracetamol':'CC(=O)Nc1ccc(cc1)O'
};

const EXAMPLE_PROTEIN = 'MKKFFDSRREQGGSGLGSGSSGGGGSTSGLGSGYIGRVFGIGRQQVTVDEVLAEGGFAIVFLVRTSNGMKCALKRMFVNNEHDLPQLEAVFEREAQIMQSLDNPYIVRMLDVPREQFEREKVGEIMQFLSEKLSRDVTQQTLEQLIEAFKERETLIQLDNQNLEQFREAFEREIG';

function loadExample(type) {
  if (type === 'smiles') {
    const keys = Object.keys(EXAMPLE_SMILES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    document.getElementById('smiles-input').value = EXAMPLE_SMILES[key];
    // show encoding in preview
    const encoded = EXAMPLE_SMILES[key].split('').map(c => SMILES_MAP[c] || 0);
    const preview = document.getElementById('smiles-encoding-preview');
    preview.classList.remove('hidden');
    preview.innerHTML = `<strong>${key.toUpperCase()} encoding (first 20):</strong><br>[${encoded.slice(0,20).join(', ')}${encoded.length > 20 ? ', ...' : ''}]`;
  } else {
    document.getElementById('protein-input').value = EXAMPLE_PROTEIN;
  }
}

function clearField(id) {
  document.getElementById(id).value = '';
  if (id === 'smiles-input') {
    document.getElementById('smiles-encoding-preview').classList.add('hidden');
  }
}

// SMILES input → show live encoding preview
document.getElementById('smiles-input').addEventListener('input', function() {
  const val = this.value.trim();
  const preview = document.getElementById('smiles-encoding-preview');
  if (!val) { preview.classList.add('hidden'); return; }
  const encoded = val.split('').map(c => SMILES_MAP[c] || 0);
  preview.classList.remove('hidden');
  preview.innerHTML = `Encoded (${encoded.length} chars): [${encoded.slice(0,25).join(', ')}${encoded.length > 25 ? ', ...' : ''}]`;
});

function runPrediction() {
  const smiles = document.getElementById('smiles-input').value.trim();
  const protein = document.getElementById('protein-input').value.trim().toUpperCase();
  const mode = document.querySelector('input[name="dataset-mode"]:checked').value;
  const resultsDiv = document.getElementById('predict-results');

  if (!smiles) { alert('Please enter a SMILES string.'); return; }
  if (!protein) { alert('Please enter a protein sequence.'); return; }

  const btn = document.getElementById('predict-btn');
  btn.textContent = '⏳ Analysing…';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = '🚀 Analyse & Predict';
    btn.disabled = false;
    displayPrediction(smiles, protein, mode);
  }, 1200);
}

function displayPrediction(smiles, protein, mode) {
  // Encode sequences
  const smilesEncoded = smiles.split('').map(c => SMILES_MAP[c] || 0);
  const proteinEncoded = protein.split('').map(c => PROTEIN_MAP[c] || 0);

  const maxSmiles = mode === 'davis' ? 85 : 100;
  const maxProtein = mode === 'davis' ? 1200 : 1000;

  // Pad/truncate
  let smilesPadded = [...smilesEncoded];
  if (smilesPadded.length < maxSmiles) {
    smilesPadded = [...smilesPadded, ...Array(maxSmiles - smilesPadded.length).fill(0)];
  } else {
    smilesPadded = smilesPadded.slice(0, maxSmiles);
  }

  let proteinPadded = [...proteinEncoded];
  if (proteinPadded.length < maxProtein) {
    proteinPadded = [...proteinPadded, ...Array(maxProtein - proteinPadded.length).fill(0)];
  } else {
    proteinPadded = proteinPadded.slice(0, maxProtein);
  }

  // Heuristic score based on sequence features
  const score = simulateAffinityScore(smiles, protein, mode);
  const scoreNorm = Math.min(1, Math.max(0, (score - 3) / 7)); // normalize pKd range ~3-10
  const interpretation = interpretScore(score, mode);

  const knownCount = smilesEncoded.filter(x => x > 0).length;
  const unknownSmiles = smiles.split('').filter(c => !SMILES_MAP[c]).length;

  document.getElementById('predict-results').innerHTML = `
    <div class="predict-output-card">
      <div class="predict-output-header">
        <h3>🔬 Binding Affinity Analysis</h3>
        <p>Simulated DeepDTA CNN-based prediction · ${mode.toUpperCase()} mode</p>
      </div>
      <div class="predict-output-body">

        <div class="affinity-score-display">
          <div class="score-value">${score.toFixed(3)}</div>
          <div class="score-label">${mode === 'davis' ? 'Predicted pKd' : 'Predicted KIBA Score'}</div>
          <div class="score-bar-wrap">
            <div class="score-bar-label">
              <span>Weak (3)</span>
              <span>Strong (10)</span>
            </div>
            <div class="score-bar">
              <div class="score-bar-fill" style="width: ${(scoreNorm * 100).toFixed(1)}%"></div>
            </div>
          </div>
          <div style="margin-top:12px; padding:10px; border-radius:8px; background:${interpretation.bg}; border:1px solid ${interpretation.border}; font-size:0.85rem; color:${interpretation.color}">
            ${interpretation.text}
          </div>
        </div>

        <div class="predict-info-grid">
          <div class="predict-info-box">
            <div class="info-label">SMILES Length</div>
            <div class="info-value">${smiles.length} chars ${smiles.length > maxSmiles ? '⚠ truncated to ' + maxSmiles : '(padded to ' + maxSmiles + ')'}</div>
          </div>
          <div class="predict-info-box">
            <div class="info-label">Protein Length</div>
            <div class="info-value">${protein.length} residues ${protein.length > maxProtein ? '⚠ truncated to ' + maxProtein : '(padded to ' + maxProtein + ')'}</div>
          </div>
          <div class="predict-info-box">
            <div class="info-label">SMILES Vocabulary Coverage</div>
            <div class="info-value">${knownCount}/${smiles.length} known chars ${unknownSmiles > 0 ? '⚠ ' + unknownSmiles + ' unknown → 0' : '✓ all recognized'}</div>
          </div>
          <div class="predict-info-box">
            <div class="info-label">Dataset Mode</div>
            <div class="info-value">${mode === 'davis' ? 'Davis (pKd, Kd-based)' : 'KIBA (Ki+Kd+IC₅₀ combined)'}</div>
          </div>
        </div>

        <div class="predict-info-box" style="margin-bottom:12px">
          <div class="info-label">SMILES Encoding (first 20 tokens)</div>
          <div class="info-value">[${smilesPadded.slice(0,20).join(', ')}, ...]</div>
        </div>
        <div class="predict-info-box" style="margin-bottom:16px">
          <div class="info-label">Protein Encoding (first 20 tokens)</div>
          <div class="info-value">[${proteinPadded.slice(0,20).join(', ')}, ...]</div>
        </div>

        <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:8px; padding:14px; font-size:0.8rem; color:var(--text-muted); line-height:1.6">
          <strong style="color:var(--primary)">ℹ️ About this prediction:</strong>
          This app simulates the DeepDTA encoding pipeline and provides a heuristic affinity estimate based on sequence composition features (aromatic ring density, hydrophobicity, sequence length, known pharmacophore patterns). For a true DeepDTA prediction, the trained CNN weights would be applied to the encoded input tensors. The encoding and padding shown above is exactly how DeepDTA's model processes inputs.
        </div>
      </div>
    </div>
  `;
}

function simulateAffinityScore(smiles, protein, mode) {
  // Heuristic score designed to reflect biologically plausible ranges
  // Based on structural features used in QSAR literature

  // Drug features
  const aromaticRings = (smiles.match(/c/g) || []).length;
  const nitrogenCount = (smiles.match(/N|n/g) || []).length;
  const oxygenCount = (smiles.match(/O|o/g) || []).length;
  const hasHeteroatoms = nitrogenCount + oxygenCount;
  const smilesLen = smiles.length;

  // Protein features
  const hydrophobic = (protein.match(/[VILMFYW]/g) || []).length;
  const charged = (protein.match(/[RKHDE]/g) || []).length;
  const protLen = protein.length;

  // Kinase-specific residues (common in Davis/KIBA datasets)
  const kinaseMotif = (protein.match(/DFG|GXGXXG|HRD/g) || []).length;

  // Score computation (heuristic, in pKd range 4–9)
  let base = 5.5;
  base += aromaticRings * 0.08;
  base += hasHeteroatoms * 0.04;
  base += (smilesLen > 20 && smilesLen < 80) ? 0.3 : 0;
  base += (hydrophobic / Math.max(protLen, 1)) * 4;
  base += kinaseMotif * 0.5;
  base += (nitrogenCount > 2) ? 0.25 : 0;
  base -= (smilesLen < 10) ? 1 : 0;

  // Add slight deterministic variation based on sequence hash
  const hash = simpleHash(smiles + protein);
  base += (hash % 100 - 50) * 0.01;

  return Math.max(3.5, Math.min(9.5, base));
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  }
  return h;
}

function interpretScore(score, mode) {
  if (mode === 'davis') {
    if (score >= 7) return { text: '🟢 Strong binding predicted (pKd ≥ 7 → Kd ≤ 100 nM) — likely active compound', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7' };
    if (score >= 5) return { text: '🟡 Moderate binding predicted (5 ≤ pKd < 7) — may require optimization', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d' };
    return { text: '🔴 Weak binding predicted (pKd < 5 → Kd > 10 µM) — likely inactive at physiological concentrations', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5' };
  } else {
    if (score >= 12.1) return { text: '🟢 Strong binding predicted (KIBA ≥ 12.1 threshold) — classified as active', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7' };
    if (score >= 7) return { text: '🟡 Moderate KIBA score — borderline activity', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d' };
    return { text: '🔴 Low KIBA score — weak or no binding predicted', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5' };
  }
}

// ══════════════ PUBCHEM INTEGRATION ══════════════
const PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

async function searchPubChem() {
  const query = document.getElementById('pubchem-query').value.trim();
  if (!query) { alert('Please enter a compound name or CID.'); return; }

  showPubChemLoading(true);
  hidePubChemError();
  document.getElementById('pubchem-results').classList.add('hidden');
  document.getElementById('pubchem-results').innerHTML = '';

  try {
    let cids = [];

    // Check if numeric (CID search) or name search
    if (/^\d+$/.test(query)) {
      cids = [parseInt(query)];
    } else {
      // Name → CID lookup
      const nameRes = await fetch(`${PUBCHEM_BASE}/compound/name/${encodeURIComponent(query)}/cids/JSON`);
      if (!nameRes.ok) {
        if (nameRes.status === 404) throw new Error(`No compound found for "${query}". Try a different name or use a CID.`);
        throw new Error(`PubChem search failed (status ${nameRes.status}). Please try again.`);
      }
      const nameData = await nameRes.json();
      cids = nameData.IdentifierList.CID.slice(0, 3); // show up to 3 matches
    }

    // Fetch properties for each CID
    const results = await Promise.all(cids.map(cid => fetchCompoundDetails(cid)));
    renderPubChemResults(results.filter(Boolean));

  } catch (err) {
    showPubChemError(err.message || 'An error occurred while searching PubChem.');
  } finally {
    showPubChemLoading(false);
  }
}

async function fetchCompoundDetails(cid) {
  try {
    const propsRes = await fetch(
      `${PUBCHEM_BASE}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,IsomericSMILES,CanonicalSMILES,XLogP,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,TPSA/JSON`
    );
    if (!propsRes.ok) return null;
    const propsData = await propsRes.json();
    const props = propsData.PropertyTable.Properties[0];

    // Fetch synonyms for common name
    let name = props.IUPACName || `CID ${cid}`;
    try {
      const synRes = await fetch(`${PUBCHEM_BASE}/compound/cid/${cid}/synonyms/JSON`);
      if (synRes.ok) {
        const synData = await synRes.json();
        const syns = synData.InformationList.Information[0].Synonym;
        // Pick first short synonym as common name
        const shortSyn = syns.find(s => s.length < 30 && /^[A-Za-z]/.test(s));
        if (shortSyn) name = shortSyn;
      }
    } catch {}

    return { cid, name, props };
  } catch {
    return null;
  }
}

function renderPubChemResults(results) {
  const container = document.getElementById('pubchem-results');
  if (!results || results.length === 0) {
    showPubChemError('No results found. Try a different search term.');
    return;
  }

  container.innerHTML = results.map(r => {
    const p = r.props;
    const smiles = p.IsomericSMILES || p.CanonicalSMILES || '';
    const encoded = smiles ? smiles.split('').map(c => SMILES_MAP[c] || 0) : [];
    const imgUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${r.cid}/PNG?record_type=2d&image_size=200x160`;
    const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/compound/${r.cid}`;

    return `
      <div class="compound-card">
        <div class="compound-structure">
          <img src="${imgUrl}" alt="Structure of ${escapeHtml(r.name)}" title="${escapeHtml(r.name)}" loading="lazy" />
        </div>
        <div class="compound-info">
          <h3>${escapeHtml(r.name)}</h3>
          <div class="compound-cid">PubChem CID: ${r.cid} · <a href="${pubchemUrl}" target="_blank" style="color:var(--primary)">View on PubChem ↗</a></div>

          <div class="compound-props">
            <div class="prop-row">
              <span class="prop-label">Formula</span>
              <span class="prop-value">${p.MolecularFormula || '—'}</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">Mol. Weight</span>
              <span class="prop-value">${p.MolecularWeight ? p.MolecularWeight + ' g/mol' : '—'}</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">XLogP</span>
              <span class="prop-value">${p.XLogP !== undefined ? p.XLogP : '—'}</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">TPSA</span>
              <span class="prop-value">${p.TPSA !== undefined ? p.TPSA + ' Å²' : '—'}</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">H-Bond Donors</span>
              <span class="prop-value">${p.HBondDonorCount !== undefined ? p.HBondDonorCount : '—'}</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">H-Bond Acceptors</span>
              <span class="prop-value">${p.HBondAcceptorCount !== undefined ? p.HBondAcceptorCount : '—'}</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">Rotatable Bonds</span>
              <span class="prop-value">${p.RotatableBondCount !== undefined ? p.RotatableBondCount : '—'}</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">Lipinski RO5</span>
              <span class="prop-value">${checkLipinski(p)}</span>
            </div>
          </div>

          <div style="font-size:0.72rem; color:var(--text-muted); font-weight:600; margin-bottom:4px">
            SMILES (${smiles.length} chars${smiles.length > 85 ? ' ⚠ > Davis max 85' : ''})
          </div>
          <div class="compound-smiles-box">${escapeHtml(smiles) || '—'}</div>

          ${encoded.length > 0 ? `
            <div style="font-size:0.72rem; color:var(--text-muted); font-weight:600; margin-bottom:4px">
              DeepDTA Encoding (first 20 tokens)
            </div>
            <div class="compound-smiles-box" style="color:var(--accent)">
              [${encoded.slice(0,20).join(', ')}${encoded.length > 20 ? ', ...' : ''}]
            </div>
          ` : ''}

          <div class="compound-actions">
            <button class="btn btn-primary btn-sm" onclick="useSMILES('${smiles.replace(/'/g, "\\'")}')">
              🔬 Use in Predictor
            </button>
            <a href="${pubchemUrl}" target="_blank" class="btn btn-outline btn-sm">
              🔗 PubChem Page
            </a>
            <button class="btn btn-outline btn-sm" onclick="useSMILES('${smiles.replace(/'/g, "\\'")}'); showPage('smiles')">
              ⚗️ Visualize Encoding
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.classList.remove('hidden');
}

function checkLipinski(p) {
  const violations = [];
  if (p.MolecularWeight > 500) violations.push('MW > 500');
  if (p.XLogP > 5) violations.push('LogP > 5');
  if (p.HBondDonorCount > 5) violations.push('HBD > 5');
  if (p.HBondAcceptorCount > 10) violations.push('HBA > 10');
  if (violations.length === 0) return '✓ Passes (drug-like)';
  return `⚠ ${violations.length} violation${violations.length > 1 ? 's' : ''}`;
}

function useSMILES(smiles) {
  document.getElementById('smiles-input').value = smiles;
  document.getElementById('smiles-encode-input').value = smiles;
  // trigger encoding preview
  const event = new Event('input');
  document.getElementById('smiles-input').dispatchEvent(event);
  showPage('predict');
}

function quickSearch(name) {
  document.getElementById('pubchem-query').value = name;
  searchPubChem();
}

function showPubChemLoading(show) {
  const el = document.getElementById('pubchem-loading');
  if (show) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

function showPubChemError(msg) {
  const el = document.getElementById('pubchem-error');
  el.textContent = '⚠ ' + msg;
  el.classList.remove('hidden');
}

function hidePubChemError() {
  document.getElementById('pubchem-error').classList.add('hidden');
}

// Allow Enter key on PubChem search
document.getElementById('pubchem-query').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchPubChem();
});

// ══════════════ DATASETS CHARTS ══════════════
function renderBarChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const max = Math.max(...data.map(d => d.value));
  container.innerHTML = data.map(d => `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px">
      <div style="width:200px; font-size:0.8rem; color:var(--text-muted); text-align:right; flex-shrink:0">${d.label}</div>
      <div style="flex:1; background:var(--bg); border-radius:999px; height:24px; overflow:hidden; border:1px solid var(--border)">
        <div style="
          height:100%;
          width:${((d.value / max) * 100).toFixed(1)}%;
          background:${d.best ? 'linear-gradient(90deg,var(--primary),var(--secondary))' : 'rgba(99,102,241,0.3)'};
          border-radius:999px;
          transition:width 0.8s ease;
          display:flex; align-items:center; justify-content:flex-end; padding-right:8px;
          font-size:0.72rem; font-weight:700; color:#fff;
        ">
          ${d.value}
        </div>
      </div>
      ${d.best ? '<span style="font-size:0.75rem; color:var(--success)">⭐ Best</span>' : ''}
    </div>
  `).join('');
}

renderBarChart('davis-chart', [
  { label: 'KronRLS (SW + PubChem Sim)', value: 0.871, best: false },
  { label: 'SimBoost (SW + PubChem Sim)', value: 0.872, best: false },
  { label: 'DeepDTA (SW + PubChem Sim)', value: 0.790, best: false },
  { label: 'DeepDTA (CNN + PubChem Sim)', value: 0.835, best: false },
  { label: 'DeepDTA (SW + CNN)', value: 0.886, best: false },
  { label: 'DeepDTA (CNN + CNN)', value: 0.878, best: true },
]);

renderBarChart('kiba-chart', [
  { label: 'KronRLS (SW + PubChem Sim)', value: 0.782, best: false },
  { label: 'SimBoost (SW + PubChem Sim)', value: 0.836, best: false },
  { label: 'DeepDTA (SW + PubChem Sim)', value: 0.710, best: false },
  { label: 'DeepDTA (CNN + PubChem Sim)', value: 0.718, best: false },
  { label: 'DeepDTA (SW + CNN)', value: 0.854, best: false },
  { label: 'DeepDTA (CNN + CNN)', value: 0.863, best: true },
]);

// ══════════════ GLOSSARY ══════════════
const GLOSSARY_TERMS = [
  { term: 'DTA', abbr: 'Drug-Target Affinity', def: 'A continuous measure of <strong>how strongly a drug binds to its target protein</strong>. Unlike binary DTI (binds/does not bind), DTA provides a quantitative score (e.g., pKd, IC₅₀, KIBA score) enabling ranking and comparison of drug candidates.' },
  { term: 'DTI', abbr: 'Drug-Target Interaction', def: 'A <strong>binary prediction</strong> of whether a drug molecule interacts with a target protein (1 = interacts, 0 = does not). DeepDTA extends this to the continuous DTA setting.' },
  { term: 'SMILES', abbr: 'Simplified Molecular Input Line Entry System', def: 'A <strong>text-based notation for representing chemical structures</strong>. Example: CC(=O)O for acetic acid. DeepDTA uses SMILES strings directly as 1D character sequences, encoding each character as an integer. SMILES strings were sourced from PubChem.' },
  { term: 'pKd', abbr: '−log₁₀(Kd / 10⁻⁹)', def: 'Log-transformed <strong>dissociation constant</strong>. Kd measures how tightly a drug binds to a protein — lower Kd = tighter binding. pKd = −log₁₀(Kd/nM). Higher pKd = stronger binding. Used as the affinity label in the Davis dataset.' },
  { term: 'Kd', abbr: 'Dissociation Constant', def: 'Equilibrium constant describing the tendency of a drug-protein complex to dissociate. <strong>Lower Kd = tighter (stronger) binding</strong>. Measured in molar units (nM, µM). The Davis dataset uses Kd values transformed to pKd.' },
  { term: 'Ki', abbr: 'Inhibition Constant', def: 'A measure of inhibitor potency — <strong>the concentration of inhibitor needed to reduce enzyme activity by half</strong> (in a competitive inhibition context). Lower Ki = more potent inhibitor. Part of the KIBA score.' },
  { term: 'IC₅₀', abbr: 'Half-maximal Inhibitory Concentration', def: 'The concentration of a drug required to <strong>inhibit 50% of target activity</strong>. A common measure of drug potency in cell-based assays. Part of the KIBA combined score.' },
  { term: 'KIBA Score', abbr: 'Kinase Inhibitor BioActivity', def: 'A <strong>unified bioactivity score</strong> that combines Ki, Kd, and IC₅₀ measurements using statistical optimization to maximize consistency across sources. Used in the KIBA dataset as the affinity label.' },
  { term: 'CI', abbr: 'Concordance Index', def: 'Primary evaluation metric for DTA prediction. <strong>Measures how well the model preserves the ranking order</strong> of binding affinities. CI = 1.0 is perfect; CI = 0.5 is random. DeepDTA achieves CI = 0.878 (Davis) and 0.863 (KIBA).' },
  { term: 'MSE', abbr: 'Mean Squared Error', def: 'Regression loss: average of squared differences between predicted and true values. <strong>Lower MSE = more accurate predictions</strong>. Used as both training objective and evaluation metric in DeepDTA.' },
  { term: 'CNN', abbr: 'Convolutional Neural Network', def: 'A deep learning architecture using <strong>convolutional filters to detect local patterns</strong> in sequential data. DeepDTA uses 1D CNNs to learn from character sequences of SMILES and proteins, with three stacked layers (32→64→96 filters).' },
  { term: 'ReLU', abbr: 'Rectified Linear Unit', def: 'Activation function: g(x) = max(0, x). <strong>Introduces non-linearity</strong> in neural networks, enabling learning of complex patterns. Used throughout DeepDTA\'s CNN and FC layers.' },
  { term: 'PubChem', abbr: 'NCBI Public Chemical Database', def: 'A free, publicly accessible database of <strong>chemical molecules and their biological activities</strong>. DeepDTA sourced all SMILES strings from PubChem using compound CIDs. PubChem Sim (structure clustering) was used as a baseline similarity measure.' },
  { term: 'UniProt', abbr: 'Universal Protein Knowledgebase', def: 'A comprehensive, freely accessible database of <strong>protein sequence and functional information</strong>. DeepDTA extracted all target protein sequences from UniProt using gene names or accession numbers.' },
  { term: 'KronRLS', abbr: 'Kronecker Regularized Least Squares', def: 'A baseline method for DTA prediction using <strong>Kronecker product of drug and protein similarity kernels</strong> with regularized least squares regression. Uses PubChem Sim for drugs and Smith-Waterman for proteins.' },
  { term: 'SimBoost', abbr: 'Similarity-based Gradient Boosting', def: 'A gradient boosting machine (XGBoost) based method for DTA prediction. Uses <strong>engineered features from drug-drug, target-target, and drug-target networks</strong>. A competitive baseline that DeepDTA significantly outperforms on KIBA.' },
  { term: 'Smith-Waterman', abbr: 'SW Similarity', def: 'A <strong>dynamic programming algorithm for local sequence alignment</strong> between protein sequences. Used by KronRLS and SimBoost to compute pairwise protein similarity matrices. DeepDTA replaces this with CNN-learned representations.' },
  { term: 'PubChem Sim', abbr: 'PubChem Structure Clustering', def: 'A PubChem tool using <strong>2D structural properties and single-linkage clustering</strong> to compute compound similarity. Used by baseline methods (KronRLS, SimBoost) for drug representation. DeepDTA replaces this with CNN on SMILES.' },
  { term: 'Label Encoding', abbr: 'Integer Encoding', def: 'Representation of characters as <strong>unique integers</strong>. DeepDTA uses label encoding for 64 SMILES characters and 25 protein amino acid characters. The integer vectors are then passed to Keras Embedding layers to get dense 128-dim vectors.' },
  { term: 'Embedding', abbr: 'Keras Embedding Layer', def: 'A <strong>trainable lookup table mapping integers to dense vectors</strong>. DeepDTA uses 128-dimensional embeddings for each character, allowing the model to learn meaningful representations during training.' },
  { term: 'Dropout', abbr: 'Regularization Technique', def: 'A technique that randomly <strong>sets neuron activations to zero during training</strong> (rate = 0.1 in DeepDTA), preventing overfitting by forcing the network to learn redundant representations.' },
  { term: 'Adam', abbr: 'Adaptive Moment Estimation', def: 'An <strong>adaptive learning rate optimization algorithm</strong>. Combines advantages of AdaGrad and RMSProp. Used in DeepDTA with default learning rate 0.001 to update CNN and FC layer weights during backpropagation.' },
  { term: 'QSAR', abbr: 'Quantitative Structure-Activity Relationship', def: 'Mathematical models relating <strong>molecular structure features to biological activity</strong>. DeepDTA contributes to QSAR studies by learning structure-activity relationships directly from raw SMILES without handcrafted descriptors.' },
  { term: 'r²ₘ', abbr: 'Modified r-squared for QSAR', def: 'Metric for <strong>QSAR model validation</strong>: r²ₘ = r² × (1 − √|r² − r²₀|). Values > 0.5 on the test set indicate an acceptable QSAR model. DeepDTA achieves r²ₘ = 0.630 (Davis) and 0.673 (KIBA).' },
  { term: 'AUPR', abbr: 'Area Under Precision-Recall Curve', def: 'Metric for <strong>binary classification performance</strong>. Continuous affinity values are binarized using thresholds (pKd ≥ 7 for Davis, KIBA ≥ 12.1). DeepDTA achieves AUPR = 0.714 (Davis) and 0.788 (KIBA).' },
  { term: 'Kinase', abbr: 'Protein Kinase', def: 'An enzyme that <strong>transfers phosphate groups to substrate proteins</strong>, regulating cell signaling. Both Davis and KIBA datasets focus on kinase inhibitors — a critical drug target class in oncology, inflammation, and neurological diseases.' },
  { term: 'LSTM', abbr: 'Long Short-Term Memory', def: 'A type of Recurrent Neural Network with <strong>memory gates for learning long-range dependencies</strong> in sequences. DeepDTA\'s future work suggests LSTM may be better suited than CNN for protein sequences due to their long-range amino acid dependencies.' },
];

function renderGlossary(terms) {
  const list = document.getElementById('glossary-list');
  list.innerHTML = terms.map(item => `
    <div class="glossary-item">
      <div>
        <div class="glossary-term">${item.term}</div>
        <div class="glossary-abbr">${item.abbr}</div>
      </div>
      <div class="glossary-def">${item.def}</div>
    </div>
  `).join('');
}

renderGlossary(GLOSSARY_TERMS);

function filterGlossary() {
  const q = document.getElementById('glossary-search').value.toLowerCase();
  if (!q) { renderGlossary(GLOSSARY_TERMS); return; }
  const filtered = GLOSSARY_TERMS.filter(item =>
    item.term.toLowerCase().includes(q) ||
    item.abbr.toLowerCase().includes(q) ||
    item.def.toLowerCase().includes(q)
  );
  renderGlossary(filtered);
}

// ══════════════ INIT ══════════════
// Open first accordion
document.querySelector('.accordion-header').click();
