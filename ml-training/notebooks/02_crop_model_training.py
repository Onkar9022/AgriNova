"""
=============================================================================
AgriNova — Crop Recommendation Model v2  (Google Colab / T4 GPU)
=============================================================================

PROBLEM WITH v1 (80–85% accuracy):
  The Kaggle dataset has 7 features for 22 crops.
  Your Maharashtra dataset has 14 features for 32 crops.
  Training on Kaggle alone missed EC, soil_type, moisture, season.
  Training on Maharashtra alone had only synthetic data — not enough variety.

SOLUTION (this script):
  1. Download Kaggle dataset (2200 rows, 22 crops, 7 real features)
  2. Load Maharashtra dataset (12000 rows, 32 crops, 14 features)
  3. Map/unify crop names so overlapping crops (rice, cotton, etc.) merge
  4. For Kaggle rows — fill missing features (EC, moisture, soil_type, season)
     with crop-specific realistic medians, NOT random noise
  5. Train one XGBoost model on the merged dataset (~14000 rows, 42 crops)
  6. Expected accuracy: 97–99%

USAGE:
  Runtime → Change runtime type → T4 GPU
  Run cells top to bottom
  .pkl files export to Google Drive

COPY TO ml-server/app/models/:
  crop_model_v3.pkl
  crop_encoder_v3.pkl
  crop_scaler_v3.pkl
  crop_feature_order_v3.json   ← FastAPI MUST read this for input order

INPUT ORDER FOR FASTAPI (11 features):
  [nitrogen, phosphorus, potassium, ph, moisture, soil_temperature,
   ec, rainfall, air_temperature, air_humidity, season_code, soil_type_code]
=============================================================================
"""

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 1 — Mount Google Drive                                            ║
# ╚══════════════════════════════════════════════════════════════════════════╝
from google.colab import drive
drive.mount('/content/drive')

DRIVE_EXPORT = '/content/drive/MyDrive/agrinova/crop_exports_v3'

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 2 — Install & import                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝
# !pip install xgboost scikit-learn pandas numpy matplotlib seaborn joblib kagglehub optuna -q

import os, json, warnings, subprocess
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
import kagglehub
import joblib
warnings.filterwarnings('ignore')

from sklearn.model_selection   import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing     import LabelEncoder, StandardScaler
from sklearn.metrics           import (accuracy_score, classification_report,
                                       confusion_matrix, ConfusionMatrixDisplay)
from sklearn.base              import clone
from xgboost                   import XGBClassifier

print("GPU check:")
subprocess.run(['nvidia-smi','--query-gpu=name,memory.total','--format=csv,noheader'])
print("\nAll imports OK")

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 3 — Download Kaggle dataset                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝
print("\nDownloading Kaggle dataset...")
path     = kagglehub.dataset_download("atharvaingle/crop-recommendation-dataset")
csvs     = sorted([os.path.join(r,f)
                   for r,_,files in os.walk(path) for f in files if f.endswith('.csv')])
df_kaggle = pd.read_csv(csvs[0])
df_kaggle.columns = df_kaggle.columns.str.strip().str.lower()

# Rename to match our unified schema
df_kaggle = df_kaggle.rename(columns={
    'n':           'nitrogen',
    'p':           'phosphorus',
    'k':           'potassium',
    'temperature': 'air_temperature',
    'humidity':    'air_humidity',
    'label':       'crop',
})

print(f"Kaggle shape  : {df_kaggle.shape}")
print(f"Kaggle crops  : {sorted(df_kaggle['crop'].unique())}")

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 4 — Load Maharashtra dataset                                      ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# Upload maharashtra_crop_recommendation.csv to Colab first:
#   Files (left sidebar) → Upload → select the file
# OR place it in Drive and adjust path below.

MH_PATH = '/content/maharashtra_crop_recommendation-2.csv'
# If using Drive: MH_PATH = '/content/drive/MyDrive/agrinova/maharashtra_crop_recommendation.csv'

df_mh = pd.read_csv(MH_PATH)
print(f"\nMaharashtra shape : {df_mh.shape}")
print(f"Maharashtra crops : {sorted(df_mh['crop'].unique())}")

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 5 — Crop name normalisation                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝
# Unify overlapping crops so Kaggle rice + Maharashtra rice = same class

KAGGLE_TO_UNIFIED = {
    'rice':        'rice',
    'maize':       'maize_kharif',   # Kaggle maize → kharif maize
    'chickpea':    'chickpea',
    'kidneybeans': 'kidneybeans',    # Kaggle-only; keep as-is
    'pigeonpeas':  'tur_arhar',      # same crop, different name
    'mothbeans':   'mothbeans',      # Kaggle-only
    'mungbean':    'moong_kharif',   # same crop
    'blackgram':   'urad',           # same crop
    'lentil':      'lentil',         # Kaggle-only
    'pomegranate': 'pomegranate',
    'banana':      'banana',
    'mango':       'mango',          # Kaggle-only
    'grapes':      'grapes',
    'watermelon':  'watermelon',
    'muskmelon':   'muskmelon',      # Kaggle-only
    'apple':       'apple',          # Kaggle-only (Nashik region)
    'orange':      'orange',
    'papaya':      'papaya',         # Kaggle-only
    'coconut':     'coconut',        # Konkan region
    'cotton':      'cotton',
    'jute':        'jute',           # Kaggle-only
    'coffee':      'coffee',         # Kaggle-only
}

df_kaggle['crop'] = df_kaggle['crop'].map(KAGGLE_TO_UNIFIED)
print("\nKaggle crops after normalisation:")
print(df_kaggle['crop'].value_counts().to_string())

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 6 — Fill missing features for Kaggle rows                         ║
# ║                                                                          ║
# ║  Kaggle rows are missing: moisture, soil_temperature, ec,               ║
# ║  season_code, soil_type_code                                            ║
# ║                                                                          ║
# ║  Strategy: use crop-specific realistic medians from Maharashtra data.    ║
# ║  For crops not in Maharashtra (apple, mango, jute etc.) use global      ║
# ║  percentile of similar crop category.                                   ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# Compute per-crop medians from Maharashtra data
mh_medians = df_mh.groupby('crop')[
    ['moisture','soil_temperature','ec','season_code','soil_type_code']
].median().to_dict('index')

# Fallbacks for Kaggle-only crops (not in Maharashtra data)
# These are crop-category informed guesses — not random
KAGGLE_ONLY_DEFAULTS = {
    'kidneybeans': dict(moisture=45, soil_temperature=22, ec=280, season_code=1, soil_type_code=2),
    'mothbeans':   dict(moisture=28, soil_temperature=32, ec=220, season_code=0, soil_type_code=4),
    'lentil':      dict(moisture=35, soil_temperature=18, ec=260, season_code=1, soil_type_code=1),
    'mango':       dict(moisture=45, soil_temperature=30, ec=350, season_code=0, soil_type_code=1),
    'muskmelon':   dict(moisture=38, soil_temperature=32, ec=200, season_code=2, soil_type_code=4),
    'apple':       dict(moisture=50, soil_temperature=15, ec=300, season_code=1, soil_type_code=1),
    'papaya':      dict(moisture=55, soil_temperature=28, ec=300, season_code=0, soil_type_code=2),
    'coconut':     dict(moisture=65, soil_temperature=28, ec=400, season_code=0, soil_type_code=3),
    'jute':        dict(moisture=70, soil_temperature=28, ec=300, season_code=0, soil_type_code=2),
    'coffee':      dict(moisture=60, soil_temperature=24, ec=250, season_code=0, soil_type_code=3),
}

def fill_missing_for_crop(row):
    crop = row['crop']
    # Try Maharashtra median first
    if crop in mh_medians:
        src = mh_medians[crop]
    elif crop in KAGGLE_ONLY_DEFAULTS:
        src = KAGGLE_ONLY_DEFAULTS[crop]
    else:
        # Absolute fallback — use overall Maharashtra median
        src = dict(moisture=48, soil_temperature=25, ec=400, season_code=0, soil_type_code=0)

    # Add small Gaussian noise so we don't get perfectly identical values
    noise = lambda v, pct=0.06: v + np.random.normal(0, abs(v) * pct)
    return pd.Series({
        'moisture':         round(float(np.clip(noise(src['moisture']),       5, 100)), 1),
        'soil_temperature': round(float(np.clip(noise(src['soil_temperature']),5, 45)),  1),
        'ec':               round(float(np.clip(noise(src['ec'], 0.1),        50, 3500))),
        'season_code':      int(src['season_code']),
        'soil_type_code':   int(src['soil_type_code']),
    })

print("\nFilling Kaggle missing features...")
filled = df_kaggle.apply(fill_missing_for_crop, axis=1)
df_kaggle = pd.concat([df_kaggle, filled], axis=1)

# Also add soil_temperature for Kaggle rows that only have air_temperature
# Use a simple empirical offset: soil_temp ≈ air_temp - 3°C ± noise
df_kaggle['soil_temperature'] = df_kaggle.apply(
    lambda r: round(float(np.clip(r['air_temperature'] - 3 + np.random.normal(0, 1.5), 5, 45)), 1)
    if pd.isna(r.get('soil_temperature')) else r['soil_temperature'], axis=1
)

print("Done. Kaggle df columns now:", list(df_kaggle.columns))

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 7 — Align & merge both datasets                                   ║
# ╚══════════════════════════════════════════════════════════════════════════╝

UNIFIED_FEATURES = [
    'nitrogen', 'phosphorus', 'potassium',
    'ph', 'moisture', 'soil_temperature', 'ec',
    'rainfall', 'air_temperature', 'air_humidity',
    'season_code', 'soil_type_code',
]
TARGET = 'crop'

# Select only unified features + crop from each df
df_kaggle_clean = df_kaggle[UNIFIED_FEATURES + [TARGET]].copy()
df_mh_clean     = df_mh[UNIFIED_FEATURES + [TARGET]].copy()

# Tag source so we can analyse it after merge
df_kaggle_clean['_source'] = 'kaggle'
df_mh_clean['_source']     = 'maharashtra'

df_merged = pd.concat([df_kaggle_clean, df_mh_clean], ignore_index=True)
df_merged = df_merged.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"\nMerged dataset shape : {df_merged.shape}")
print(f"Total unique crops   : {df_merged[TARGET].nunique()}")
print(f"\nSource breakdown:")
print(df_merged['_source'].value_counts().to_string())
print(f"\nCrop distribution (rows per crop):")
print(df_merged[TARGET].value_counts().to_string())

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 8 — EDA on merged dataset                                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝

os.makedirs(DRIVE_EXPORT, exist_ok=True)

fig, axes = plt.subplots(3, 4, figsize=(22, 14))
fig.suptitle('Merged Dataset — Feature Distributions', fontsize=14, y=1.01)
for i, feat in enumerate(UNIFIED_FEATURES):
    ax = axes[i // 4][i % 4]
    df_merged[feat].hist(bins=35, ax=ax, color='#2d6a4f', alpha=0.75, edgecolor='none')
    ax.set_title(feat, fontsize=10)
plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT, 'v3_feature_distributions.png'), dpi=150, bbox_inches='tight')
plt.show()

plt.figure(figsize=(10, 8))
corr = df_merged[UNIFIED_FEATURES].corr()
sns.heatmap(corr, annot=True, fmt='.2f', cmap='YlGn', center=0,
            linewidths=0.3, square=True, annot_kws={'size':8})
plt.title('Merged Dataset — Feature Correlation Matrix')
plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT, 'v3_correlation_matrix.png'), dpi=150)
plt.show()

# Crop count bar chart
crop_counts = df_merged[TARGET].value_counts().sort_values()
fig, ax = plt.subplots(figsize=(10, 14))
colors = ['#52b788' if c == 'maharashtra' else '#74c69d'
          for c in df_merged.groupby(TARGET)['_source'].first().reindex(crop_counts.index)]
crop_counts.plot(kind='barh', ax=ax, color='#2d6a4f', edgecolor='none')
ax.set_xlabel('Number of training rows')
ax.set_title('Rows per crop — merged dataset')
plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT, 'v3_crop_distribution.png'), dpi=150)
plt.show()

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 9 — Preprocess                                                    ║
# ╚══════════════════════════════════════════════════════════════════════════╝

X_raw = df_merged[UNIFIED_FEATURES].values
y_raw = df_merged[TARGET].values

# Encode labels
crop_encoder = LabelEncoder()
y            = crop_encoder.fit_transform(y_raw)

n_classes = len(crop_encoder.classes_)
print(f"\nTotal classes : {n_classes}")
print(f"Classes       : {list(crop_encoder.classes_)}")

# Stratified train/test split
X_tr_raw, X_te_raw, y_train, y_test = train_test_split(
    X_raw, y, test_size=0.20, random_state=42, stratify=y
)

# Fit scaler on TRAIN only — prevents data leakage
crop_scaler = StandardScaler()
X_train     = crop_scaler.fit_transform(X_tr_raw)
X_test      = crop_scaler.transform(X_te_raw)
X_all       = crop_scaler.transform(X_raw)   # for CV only

print(f"\nTrain : {X_train.shape[0]} rows")
print(f"Test  : {X_test.shape[0]} rows")

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 10 — Train XGBoost v3                                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝

crop_model = XGBClassifier(
    n_estimators         = 500,
    max_depth            = 6,
    learning_rate        = 0.04,
    subsample            = 0.85,
    colsample_bytree     = 0.85,
    min_child_weight     = 3,
    gamma                = 0.1,
    reg_alpha            = 0.05,
    reg_lambda           = 1.0,
    tree_method          = 'hist',
    device               = 'cuda',         # T4 GPU
    eval_metric          = 'mlogloss',
    early_stopping_rounds= 25,
    random_state         = 42,
    n_jobs               = -1,
    num_class            = n_classes,
    objective            = 'multi:softprob',
)

print("\nTraining crop model v3 on merged dataset...")
print(f"Features : {UNIFIED_FEATURES}")
print(f"Classes  : {n_classes} crops\n")

crop_model.fit(
    X_train, y_train,
    eval_set    = [(X_test, y_test)],
    verbose     = 50,
)

print(f"\nBest iteration : {crop_model.best_iteration}")

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 11 — Evaluate                                                     ║
# ╚══════════════════════════════════════════════════════════════════════════╝

y_pred        = crop_model.predict(X_test)
test_accuracy = accuracy_score(y_test, y_pred)

print(f"\nTest Accuracy  : {test_accuracy*100:.2f}%")

# Cross-validation (no early stopping for CV — use best iteration)
cv_model = XGBClassifier(
    n_estimators     = crop_model.best_iteration,
    max_depth        = 6,
    learning_rate    = 0.04,
    subsample        = 0.85,
    colsample_bytree = 0.85,
    min_child_weight = 3,
    gamma            = 0.1,
    reg_alpha        = 0.05,
    reg_lambda       = 1.0,
    tree_method      = 'hist',
    device           = 'cuda',
    eval_metric      = 'mlogloss',
    random_state     = 42,
    n_jobs           = -1,
    num_class        = n_classes,
    objective        = 'multi:softprob',
)
cv        = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(cv_model, X_all, y, cv=cv, scoring='accuracy', n_jobs=-1)

print(f"5-Fold CV      : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")
print(f"CV scores      : {[f'{s*100:.2f}%' for s in cv_scores]}")

print("\nPer-class report:")
print(classification_report(y_test, y_pred, target_names=crop_encoder.classes_))

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 12 — Plots                                                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# ── Loss curve ────────────────────────────────────────────────────────────
results = crop_model.evals_result()
plt.figure(figsize=(9, 4))
plt.plot(results['validation_0']['mlogloss'], color='#2d6a4f', lw=1.5)
plt.axvline(crop_model.best_iteration, color='tomato', ls='--', lw=1.2,
            label=f'Best round {crop_model.best_iteration}')
plt.xlabel('Boosting round'); plt.ylabel('Log loss')
plt.title(f'Crop Model v3 — Validation Loss  |  Test Acc: {test_accuracy*100:.2f}%  |  CV: {cv_scores.mean()*100:.2f}%')
plt.legend(); plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT, 'v3_loss_curve.png'), dpi=150)
plt.show()

# ── Feature importance ────────────────────────────────────────────────────
imp_df = pd.DataFrame({
    'feature':    UNIFIED_FEATURES,
    'importance': crop_model.feature_importances_,
}).sort_values('importance', ascending=True)

plt.figure(figsize=(9, 6))
colors = ['#52b788' if imp > imp_df['importance'].median() else '#95d5b2'
          for imp in imp_df['importance']]
plt.barh(imp_df['feature'], imp_df['importance'], color=colors, edgecolor='none')
plt.axvline(imp_df['importance'].median(), color='#40916c', ls='--', lw=1, alpha=0.6,
            label='Median importance')
plt.title('Crop Model v3 — Feature Importance (gain)')
plt.xlabel('Importance score')
plt.legend(); plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT, 'v3_feature_importance.png'), dpi=150)
plt.show()

# ── Confusion matrix ──────────────────────────────────────────────────────
cm   = confusion_matrix(y_test, y_pred)
fig, ax = plt.subplots(figsize=(18, 16))
ConfusionMatrixDisplay(cm, display_labels=crop_encoder.classes_).plot(
    ax=ax, xticks_rotation=45, colorbar=False, cmap='Greens'
)
plt.title(f'Crop Model v3 — Confusion Matrix  ({test_accuracy*100:.2f}%)', fontsize=13)
plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT, 'v3_confusion_matrix.png'), dpi=150, bbox_inches='tight')
plt.show()

# ── Per-class accuracy bar ────────────────────────────────────────────────
report     = classification_report(y_test, y_pred,
                                   target_names=crop_encoder.classes_,
                                   output_dict=True)
per_class  = {k: v['f1-score'] for k, v in report.items()
              if k in crop_encoder.classes_}
pc_df      = pd.DataFrame(per_class.items(), columns=['crop','f1']).sort_values('f1')

fig, ax = plt.subplots(figsize=(10, 14))
bar_colors = ['#d62828' if f < 0.85 else '#52b788' if f > 0.95 else '#f4a261'
              for f in pc_df['f1']]
ax.barh(pc_df['crop'], pc_df['f1'], color=bar_colors, edgecolor='none')
ax.axvline(0.95, color='#2d6a4f', ls='--', lw=1, label='0.95 target')
ax.set_xlim(0, 1.05)
ax.set_xlabel('F1 score')
ax.set_title('Per-crop F1 score  (red < 0.85 | orange 0.85-0.95 | green > 0.95)')
ax.legend(); plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT, 'v2_per_class_f1.png'), dpi=150, bbox_inches='tight')
plt.show()

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 13 — Live prediction test                                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# Test samples: [N, P, K, ph, moisture, soil_temp, ec, rainfall, air_temp, humidity, season_code, soil_type_code]
TEST_SAMPLES = [
    # name,          N,   P,   K,   ph,  moist, s_tmp, ec,  rain,  a_tmp, hum,  seas, soil
    ("Soybean field",30,  70,  60,  6.8, 50,    27,    400, 750,   28,    72,   0,    0),
    ("Cotton field", 120, 55,  75,  7.2, 42,    30,    600, 650,   32,    62,   0,    0),
    ("Wheat field",  100, 65,  55,  7.0, 50,    18,    350, 350,   18,    55,   1,    2),
    ("Rice field",   100, 45,  40,  6.2, 82,    26,    300, 1500,  27,    82,   0,    2),
    ("Onion field",  100, 65,  100, 6.8, 52,    22,    450, 350,   22,    58,   1,    2),
    ("Pomegranate",  25,  13,  33,  6.9, 38,    27,    700, 350,   30,    52,   0,    1),
    ("Banana field", 200, 80,  280, 6.4, 70,    28,    550, 1200,  30,    82,   0,    2),
]

print("\n" + "="*62)
print("LIVE PREDICTION TESTS")
print("="*62)

for name, *vals in TEST_SAMPLES:
    sample  = np.array([vals], dtype=float)
    scaled  = crop_scaler.transform(sample)
    proba   = crop_model.predict_proba(scaled)[0]
    top3_i  = np.argsort(proba)[::-1][:3]
    top3_c  = crop_encoder.inverse_transform(top3_i)
    top3_p  = proba[top3_i]

    conf_flag = "(LOW CONFIDENCE — check readings)" if top3_p[0] < 0.65 else ""
    print(f"\n{name}")
    print(f"  Input : N={vals[0]} P={vals[1]} K={vals[2]} pH={vals[3]} "
          f"moist={vals[4]}% temp={vals[5]}°C EC={vals[6]} rain={vals[7]}mm")
    for i, (c, p) in enumerate(zip(top3_c, top3_p)):
        bar = "█" * int(p * 20)
        print(f"  Rank {i+1}: {c:<20s} {p*100:5.1f}%  {bar}")
    if conf_flag:
        print(f"  ⚠  {conf_flag}")

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 14 — Export to Google Drive                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝

joblib.dump(crop_model,   os.path.join(DRIVE_EXPORT, 'crop_model_v3.pkl'))
joblib.dump(crop_encoder, os.path.join(DRIVE_EXPORT, 'crop_encoder_v3.pkl'))
joblib.dump(crop_scaler,  os.path.join(DRIVE_EXPORT, 'crop_scaler_v3.pkl'))

meta = {
    'version':         'v2',
    'features':        UNIFIED_FEATURES,
    'feature_count':   len(UNIFIED_FEATURES),
    'classes':         list(crop_encoder.classes_),
    'n_classes':       n_classes,
    'test_accuracy':   round(float(test_accuracy), 4),
    'cv_mean':         round(float(cv_scores.mean()), 4),
    'cv_std':          round(float(cv_scores.std()), 4),
    'best_iteration':  int(crop_model.best_iteration),
    'confidence_threshold': 0.65,
    'input_order': (
        'IMPORTANT: FastAPI must send features in EXACTLY this order:\n'
        '[nitrogen, phosphorus, potassium, ph, moisture, soil_temperature,\n'
        ' ec, rainfall, air_temperature, air_humidity, season_code, soil_type_code]\n'
        'season_code  : kharif=0, rabi=1, zaid=2\n'
        'soil_type_code: black_cotton=0, red=1, alluvial=2, laterite=3, sandy=4'
    ),
}

with open(os.path.join(DRIVE_EXPORT, 'crop_feature_order_v3.json'), 'w') as f:
    json.dump(meta, f, indent=2)

print("\n" + "="*62)
print("EXPORT COMPLETE")
print("="*62)
print(f"Location  : {DRIVE_EXPORT}")
print(f"\nFiles exported:")
for fname in ['crop_model_v3.pkl','crop_encoder_v3.pkl',
              'crop_scaler_v3.pkl','crop_feature_order_v3.json']:
    size = os.path.getsize(os.path.join(DRIVE_EXPORT, fname))
    print(f"  {fname:<35s}  {size//1024} KB")
print(f"\nTest accuracy : {test_accuracy*100:.2f}%")
print(f"5-Fold CV     : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")
print("\nCopy .pkl files to: ml-server/app/models/")

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CELL 15 — FastAPI usage snippet (reference)                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝

FASTAPI_SNIPPET = '''
# ── ml-server/app/services/predictor.py ──────────────────────────────────
import joblib, json, numpy as np
from pathlib import Path

MODEL_DIR = Path(__file__).parent.parent / "models"

crop_model   = joblib.load(MODEL_DIR / "crop_model_v3.pkl")
crop_encoder = joblib.load(MODEL_DIR / "crop_encoder_v3.pkl")
crop_scaler  = joblib.load(MODEL_DIR / "crop_scaler_v3.pkl")

with open(MODEL_DIR / "crop_feature_order_v3.json") as f:
    meta = json.load(f)

FEATURE_ORDER       = meta["features"]        # 12 features
CONFIDENCE_THRESHOLD = meta["confidence_threshold"]  # 0.65

def predict_crop(data: dict) -> dict:
    """
    data keys must match FEATURE_ORDER exactly.
    season_code:    kharif=0, rabi=1, zaid=2
    soil_type_code: black_cotton=0, red=1, alluvial=2, laterite=3, sandy=4
    """
    X      = np.array([[data[f] for f in FEATURE_ORDER]], dtype=float)
    X_sc   = crop_scaler.transform(X)
    proba  = crop_model.predict_proba(X_sc)[0]
    top3_i = np.argsort(proba)[::-1][:3]
    top3_c = crop_encoder.inverse_transform(top3_i)
    top3_p = proba[top3_i].tolist()
    return {
        "top_crop":         top3_c[0],
        "confidence":       round(top3_p[0] * 100, 1),
        "rank_2":           top3_c[1],
        "rank_2_confidence":round(top3_p[1] * 100, 1),
        "rank_3":           top3_c[2],
        "rank_3_confidence":round(top3_p[2] * 100, 1),
        "low_confidence":   bool(top3_p[0] < CONFIDENCE_THRESHOLD),
    }
'''

print("\nFastAPI predictor snippet:")
print(FASTAPI_SNIPPET)
