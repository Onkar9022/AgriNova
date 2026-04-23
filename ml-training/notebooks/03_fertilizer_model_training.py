# """
# =============================================================================
# AgriNova — Fertilizer Prediction Model Training Script v5
# =============================================================================
# Run this script in Google Colab with T4 GPU runtime.

# Datasets (all downloaded automatically via kagglehub):
#   1. gdabhishek/fertilizer-prediction          → 99 rows, primary fertilizer labels
#   2. nishchalchandel/fertilizer-recommendation → 3100 rows, extra fertilizer rows
#   3. atharvaingle/crop-recommendation-dataset  → 2200 rows, crop sub-model (accuracy booster)

# Fixes in v5:
#   - cross_val_score crash: model cloned without early_stopping_rounds for CV
#   - Dataset 2 'Soil'/'Crop' columns now mapped to 'Soil Type'/'Crop Type'
#   - Dataset 2 missing 'Humidity' filled with median from dataset 1
# =============================================================================
# """

# # ============== CELL 1: Mount Google Drive ==============
# from google.colab import drive
# drive.mount('/content/drive')

# DRIVE_EXPORT_PATH = '/content/drive/MyDrive/agrinova/fertilizer_exports'

# # ============== CELL 2: Install dependencies ==============
# # !pip install xgboost scikit-learn pandas numpy matplotlib seaborn joblib kagglehub -q

# # ============== CELL 3: Imports & GPU check ==============
# import subprocess
# import pandas as pd
# import numpy as np
# import matplotlib.pyplot as plt
# import seaborn as sns
# import kagglehub
# import joblib
# import os
# import warnings
# warnings.filterwarnings('ignore')

# from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
# from sklearn.preprocessing import LabelEncoder, StandardScaler
# from sklearn.metrics import (classification_report, accuracy_score,
#                              ConfusionMatrixDisplay, confusion_matrix)
# from sklearn.base import clone
# from xgboost import XGBClassifier

# print("🖥️  GPU check:")
# subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'])
# print("\n✅ Libraries imported")

# # ==============================================================
# # CELL 4: Download all datasets via kagglehub
# # ==============================================================

# print("\n📥 Downloading datasets...")
# path1 = kagglehub.dataset_download("gdabhishek/fertilizer-prediction")
# path2 = kagglehub.dataset_download("nishchalchandel/fertilizer-recommendation")
# path3 = kagglehub.dataset_download("atharvaingle/crop-recommendation-dataset")
# print(f"Dataset 1: {path1}\nDataset 2: {path2}\nDataset 3: {path3}")

# # ==============================================================
# # CELL 5: Load CSV files
# # ==============================================================

# def find_csvs(base_path):
#     csvs = []
#     for root, dirs, files in os.walk(base_path):
#         for f in files:
#             if f.endswith('.csv'):
#                 csvs.append(os.path.join(root, f))
#     return sorted(csvs)

# df_fert1 = pd.read_csv(find_csvs(path1)[0])
# df_fert2 = pd.read_csv(find_csvs(path2)[0])
# df_crop  = pd.read_csv(find_csvs(path3)[0])

# for df in [df_fert1, df_fert2, df_crop]:
#     df.columns = df.columns.str.strip()

# print(f"\nDataset 1 — {df_fert1.shape}: {list(df_fert1.columns)}")
# print(f"Dataset 2 — {df_fert2.shape}: {list(df_fert2.columns)}")
# print(f"Dataset 3 — {df_crop.shape}:  {list(df_crop.columns)}")

# # ==============================================================
# # CELL 6: Normalise & merge fertilizer datasets
# #
# # Dataset 1 (gdabhishek):     Temparature, Humidity, Moisture, Soil Type,
# #                              Crop Type, Nitrogen, Potassium, Phosphorous,
# #                              Fertilizer Name
# # Dataset 2 (nishchalchandel): Temperature, Moisture, Rainfall, PH,
# #                               Nitrogen, Phosphorous, Potassium, Carbon,
# #                               Soil, Crop, Fertilizer, Remark
# #
# # Differences handled:
# #   'Soil' → 'Soil Type',  'Crop' → 'Crop Type'
# #   'Fertilizer' → 'Fertilizer Name'
# #   'Temparature' → 'Temperature'
# #   'Humidity' missing in DS2 → filled with DS1 median
# # ==============================================================

# FERT_COLUMN_MAP = {
#     'temparature': 'Temperature', 'temperature': 'Temperature',
#     'humidity': 'Humidity',
#     'moisture': 'Moisture',
#     'soil type': 'Soil Type', 'soil': 'Soil Type',
#     'soiltype': 'Soil Type', 'soil_type': 'Soil Type',
#     'crop type': 'Crop Type', 'crop': 'Crop Type',
#     'croptype': 'Crop Type', 'crop_type': 'Crop Type',
#     'nitrogen': 'Nitrogen',
#     'potassium': 'Potassium',
#     'phosphorous': 'Phosphorous', 'phosphorus': 'Phosphorous',
#     'fertilizer name': 'Fertilizer Name', 'fertilizer': 'Fertilizer Name',
#     'fertilizername': 'Fertilizer Name', 'fertilizer_name': 'Fertilizer Name',
# }

# def normalise_columns(df, col_map):
#     df = df.copy()
#     df.columns = [col_map.get(c.lower().strip(), c) for c in df.columns]
#     return df

# df_fert1 = normalise_columns(df_fert1, FERT_COLUMN_MAP)
# df_fert2 = normalise_columns(df_fert2, FERT_COLUMN_MAP)

# REQUIRED = ['Temperature', 'Humidity', 'Moisture', 'Soil Type', 'Crop Type',
#             'Nitrogen', 'Potassium', 'Phosphorous', 'Fertilizer Name']

# # Fill Humidity in dataset 2 with the median from dataset 1
# humidity_median = df_fert1['Humidity'].median()
# if 'Humidity' not in df_fert2.columns:
#     df_fert2['Humidity'] = humidity_median
#     print(f"ℹ️  Dataset 2: 'Humidity' not present — filled with DS1 median ({humidity_median:.1f})")

# # Confirm all required columns now exist in both
# for name, df in [('Dataset 1', df_fert1), ('Dataset 2', df_fert2)]:
#     missing = [c for c in REQUIRED if c not in df.columns]
#     if missing:
#         print(f"⚠️  {name} still missing: {missing}")
#     else:
#         print(f"✅ {name} columns OK")

# fert1_clean = df_fert1[REQUIRED].copy()
# fert2_clean = df_fert2[REQUIRED].copy()

# df_fert = pd.concat([fert1_clean, fert2_clean], ignore_index=True).drop_duplicates()
# print(f"\n✅ Combined fertilizer dataset: {df_fert.shape[0]} rows")
# print(f"   Distribution:\n{df_fert['Fertilizer Name'].value_counts()}")

# min_count = df_fert['Fertilizer Name'].value_counts().min()
# if min_count < 30:
#     print(f"\n⚠️  Smallest class has {min_count} samples — watch for imbalance")

# # ==============================================================
# # CELL 7: Crop sub-model (accuracy booster)
# # ==============================================================

# df_crop.columns = df_crop.columns.str.lower().str.strip()
# CROP_FEATURES   = ['n', 'p', 'k', 'temperature', 'humidity', 'ph', 'rainfall']
# missing_crop    = [c for c in CROP_FEATURES if c not in df_crop.columns]
# USE_CROP_FEATURE = len(missing_crop) == 0

# if not USE_CROP_FEATURE:
#     print(f"⚠️  Crop dataset missing {missing_crop} — skipping crop sub-model")
# else:
#     print("\n🌱 Training crop sub-model...")
#     crop_encoder  = LabelEncoder()
#     crop_y        = crop_encoder.fit_transform(df_crop['label'])
#     crop_X        = df_crop[CROP_FEATURES].values
#     crop_scaler   = StandardScaler()
#     crop_X_scaled = crop_scaler.fit_transform(crop_X)

#     Xc_tr, Xc_te, yc_tr, yc_te = train_test_split(
#         crop_X_scaled, crop_y, test_size=0.2, random_state=42, stratify=crop_y
#     )
#     crop_model = XGBClassifier(
#         n_estimators=300, max_depth=5, learning_rate=0.05,
#         subsample=0.8, colsample_bytree=0.8,
#         tree_method='hist', device='cuda',
#         eval_metric='mlogloss', early_stopping_rounds=20,
#         random_state=42, n_jobs=-1,
#     )
#     crop_model.fit(Xc_tr, yc_tr, eval_set=[(Xc_te, yc_te)], verbose=50)
#     print(f"✅ Crop sub-model accuracy : {accuracy_score(yc_te, crop_model.predict(Xc_te))*100:.2f}%")
#     print(f"   Best iteration          : {crop_model.best_iteration}")

#     # Generate predicted_crop feature for fertilizer dataset
#     ph_median       = df_crop['ph'].median()
#     rainfall_median = df_crop['rainfall'].median()

#     fert_as_crop = pd.DataFrame({
#         'n':           df_fert['Nitrogen'].values,
#         'p':           df_fert['Phosphorous'].values,
#         'k':           df_fert['Potassium'].values,
#         'temperature': df_fert['Temperature'].values,
#         'humidity':    df_fert['Humidity'].values,
#         'ph':          ph_median,
#         'rainfall':    rainfall_median,
#     })
#     df_fert['predicted_crop'] = crop_model.predict(
#         crop_scaler.transform(fert_as_crop[CROP_FEATURES].values)
#     )
#     print("   predicted_crop feature appended ✅")

# # ==============================================================
# # CELL 8: Encode & preprocess fertilizer dataset
# # ==============================================================

# soil_enc      = LabelEncoder()
# fert_crop_enc = LabelEncoder()
# fert_enc      = LabelEncoder()

# df_fert['Soil Type_enc']  = soil_enc.fit_transform(df_fert['Soil Type'])
# df_fert['Crop Type_enc']  = fert_crop_enc.fit_transform(df_fert['Crop Type'])
# df_fert['Fertilizer_enc'] = fert_enc.fit_transform(df_fert['Fertilizer Name'])

# FEATURE_COLS  = ['Temperature', 'Humidity', 'Moisture',
#                  'Soil Type_enc', 'Crop Type_enc',
#                  'Nitrogen', 'Potassium', 'Phosphorous']
# FEATURE_NAMES = ['Temperature', 'Humidity', 'Moisture', 'Soil Type',
#                  'Crop Type', 'Nitrogen', 'Potassium', 'Phosphorous']

# if USE_CROP_FEATURE:
#     FEATURE_COLS.append('predicted_crop')
#     FEATURE_NAMES.append('Predicted crop')

# X = df_fert[FEATURE_COLS].values
# y = df_fert['Fertilizer_enc'].values

# X_tr_raw, X_te_raw, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, random_state=42, stratify=y
# )

# fert_scaler  = StandardScaler()
# X_train      = fert_scaler.fit_transform(X_tr_raw)
# X_test       = fert_scaler.transform(X_te_raw)
# X_scaled_all = fert_scaler.transform(X)

# print(f"\nFeatures    : {FEATURE_NAMES}")
# print(f"Train / Test: {X_train.shape[0]} / {X_test.shape[0]}")
# print(f"Classes     : {list(fert_enc.classes_)}")

# # ==============================================================
# # CELL 9: Train fertilizer XGBoost (GPU, with early stopping)
# # ==============================================================

# fert_model = XGBClassifier(
#     n_estimators=300,
#     max_depth=5,
#     learning_rate=0.05,
#     subsample=0.8,
#     colsample_bytree=0.8,
#     tree_method='hist',
#     device='cuda',
#     eval_metric='mlogloss',
#     early_stopping_rounds=20,   # used during .fit() only
#     random_state=42,
#     n_jobs=-1,
# )

# fert_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)
# print(f"\n✅ Best iteration: {fert_model.best_iteration} / 300")

# # ==============================================================
# # CELL 10: Evaluate
# #
# # cross_val_score cannot pass eval_set so early_stopping_rounds
# # would crash. We clone the model and remove early_stopping_rounds
# # for CV only — the production model above is unchanged.
# # ==============================================================

# y_pred   = fert_model.predict(X_test)
# accuracy = accuracy_score(y_test, y_pred)
# print(f"\nTest Accuracy : {accuracy*100:.2f}%")

# # Clone model for CV — fix best_iteration as n_estimators, remove early stopping
# cv_model = clone(fert_model)
# cv_model.set_params(
#     n_estimators=fert_model.best_iteration,
#     early_stopping_rounds=None,
# )
# cv        = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
# cv_scores = cross_val_score(cv_model, X_scaled_all, y, cv=cv, scoring='accuracy')
# print(f"5-Fold CV     : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

# print("\nClassification Report:")
# print(classification_report(y_test, y_pred, target_names=fert_enc.classes_))

# # ==============================================================
# # CELL 11: Plots
# # ==============================================================

# os.makedirs(DRIVE_EXPORT_PATH, exist_ok=True)

# # Loss curve
# results = fert_model.evals_result()
# plt.figure(figsize=(8, 4))
# plt.plot(results['validation_0']['mlogloss'], color='steelblue', linewidth=1.5)
# plt.axvline(fert_model.best_iteration, color='tomato', linestyle='--',
#             linewidth=1, label=f'Best: round {fert_model.best_iteration}')
# plt.xlabel('Boosting round'); plt.ylabel('Log loss')
# plt.title('Fertilizer Model — Validation Loss Curve')
# plt.legend(); plt.tight_layout()
# plt.savefig(os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_loss_curve.png'))
# plt.show()

# # Feature importance
# plt.figure(figsize=(8, 5))
# imp_df = pd.DataFrame({'feature': FEATURE_NAMES,
#                        'importance': fert_model.feature_importances_})
# imp_df = imp_df.sort_values('importance', ascending=True)
# sns.barplot(data=imp_df, x='importance', y='feature', palette='Blues_r')
# plt.title('Fertilizer Model — Feature Importance')
# plt.tight_layout()
# plt.savefig(os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_feature_importance.png'))
# plt.show()

# # Confusion matrix
# cm   = confusion_matrix(y_test, y_pred)
# disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=fert_enc.classes_)
# fig, ax = plt.subplots(figsize=(10, 8))
# disp.plot(ax=ax, xticks_rotation=45)
# plt.title('Fertilizer Model — Confusion Matrix')
# plt.tight_layout()
# plt.savefig(os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_confusion_matrix.png'))
# plt.show()

# # ==============================================================
# # CELL 12: Export all artefacts to Google Drive
# # ==============================================================

# joblib.dump(fert_model,    os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_model.pkl'))
# joblib.dump(fert_enc,      os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_encoder.pkl'))
# joblib.dump(soil_enc,      os.path.join(DRIVE_EXPORT_PATH, 'fert_soil_encoder.pkl'))
# joblib.dump(fert_crop_enc, os.path.join(DRIVE_EXPORT_PATH, 'fert_crop_encoder.pkl'))
# joblib.dump(fert_scaler,   os.path.join(DRIVE_EXPORT_PATH, 'fert_scaler.pkl'))

# if USE_CROP_FEATURE:
#     joblib.dump(crop_model,   os.path.join(DRIVE_EXPORT_PATH, 'crop_model.pkl'))
#     joblib.dump(crop_encoder, os.path.join(DRIVE_EXPORT_PATH, 'crop_encoder.pkl'))
#     joblib.dump(crop_scaler,  os.path.join(DRIVE_EXPORT_PATH, 'crop_scaler.pkl'))
#     joblib.dump({'ph_median': ph_median, 'rainfall_median': rainfall_median},
#                 os.path.join(DRIVE_EXPORT_PATH, 'crop_fill_values.pkl'))

# print(f"\n✅ All artefacts exported → {DRIVE_EXPORT_PATH}\n")
# print("  Fertilizer model:")
# print("    📦 fertilizer_model.pkl")
# print("    📦 fertilizer_encoder.pkl")
# print("    📦 fert_soil_encoder.pkl")
# print("    📦 fert_crop_encoder.pkl")
# print("    📦 fert_scaler.pkl")
# if USE_CROP_FEATURE:
#     print("\n  Crop sub-model (required at inference):")
#     print("    📦 crop_model.pkl")
#     print("    📦 crop_encoder.pkl")
#     print("    📦 crop_scaler.pkl")
#     print("    📦 crop_fill_values.pkl")
# print("\n  Plots:")
# print("    📊 fertilizer_loss_curve.png")
# print("    📊 fertilizer_feature_importance.png")
# print("    📊 fertilizer_confusion_matrix.png")
# print("\n📋 Copy all .pkl files to: ml-server/app/models/")
# print("\n⚠️  INFERENCE ORDER (FastAPI server):")
# print("   1. Input: {Temperature, Humidity, Moisture, Soil Type, Crop Type, N, P, K}")
# print("   2. Build crop input using N, P, K, Temperature, Humidity + ph/rainfall medians")
# print("   3. crop_scaler.transform → crop_model.predict → predicted_crop")
# print("   4. Append predicted_crop → 9 features total")
# print("   5. fert_scaler.transform → fert_model.predict → fertilizer name")
# print("   Always .transform(), never .fit_transform() on new data.")

# ============================== CELL 1: Mount Google Drive ==============================
from google.colab import drive
drive.mount('/content/drive')

DRIVE_EXPORT_PATH = '/content/drive/MyDrive/agrinova/fertilizer_merged'

# ============================== CELL 2: Install dependencies ==============================


# ============================== CELL 3: Imports & GPU check ==============================
import subprocess
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import kagglehub
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (classification_report, accuracy_score,
                             ConfusionMatrixDisplay, confusion_matrix)
from sklearn.base import clone
from xgboost import XGBClassifier

print("🖥️  GPU check:")
subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'])
print("\n✅ Libraries imported")

# ============================== CELL 4: Download & Load Datasets ==============================

print("\n📥 Downloading Kaggle datasets...")
path1 = kagglehub.dataset_download("gdabhishek/fertilizer-prediction")
path2 = kagglehub.dataset_download("nishchalchandel/fertilizer-recommendation")
path3 = kagglehub.dataset_download("atharvaingle/crop-recommendation-dataset")
print(f"Dataset 1 (Kaggle Fert): {path1}\nDataset 2 (Kaggle Fert): {path2}\nDataset 3 (Kaggle Crop): {path3}")

def find_csvs(base_path):
    csvs = []
    for root, dirs, files in os.walk(base_path):
        for f in files:
            if f.endswith('.csv'):
                csvs.append(os.path.join(root, f))
    return sorted(csvs)

df_fert1 = pd.read_csv(find_csvs(path1)[0])
df_fert2 = pd.read_csv(find_csvs(path2)[0])
df_crop  = pd.read_csv(find_csvs(path3)[0])

# Load user-provided Maharashtra datasets
MH_FERT_REC_PATH = '/content/maharashtra_fertilizer_recommendation.csv'
MH_SOIL_HEALTH_PATH = '/content/maharashtra_soil_health.csv'

df_fert_mh_rec = pd.read_csv(MH_FERT_REC_PATH)
df_soil_health = pd.read_csv(MH_SOIL_HEALTH_PATH)

for df in [df_fert1, df_fert2, df_crop, df_fert_mh_rec, df_soil_health]:
    df.columns = df.columns.str.strip()

print(f"\nDataset 1 (Kaggle Fert) — {df_fert1.shape}: {list(df_fert1.columns)}")
print(f"Dataset 2 (Kaggle Fert) — {df_fert2.shape}: {list(df_fert2.columns)}")
print(f"Dataset 3 (Kaggle Crop) — {df_crop.shape}:  {list(df_crop.columns)}")
print(f"Maharashtra Fertilizer Rec — {df_fert_mh_rec.shape}: {list(df_fert_mh_rec.columns)}")
print(f"Maharashtra Soil Health — {df_soil_health.shape}: {list(df_soil_health.columns)}")

# ============================== CELL 5: Normalise & Merge Fertilizer Datasets ==============================

FERT_COLUMN_MAP = {
    'temparature': 'Temperature', 'temperature': 'Temperature',
    'humidity': 'Humidity',
    'moisture': 'Moisture',
    'soil type': 'Soil Type', 'soil': 'Soil Type', 'soiltype': 'Soil Type', 'soil_type': 'Soil Type',
    'crop type': 'Crop Type', 'crop': 'Crop Type', 'croptype': 'Crop Type', 'crop_type': 'Crop Type',
    'nitrogen': 'Nitrogen', 'n': 'Nitrogen', 'nitrogen_n': 'Nitrogen', # Added for MH dataset
    'potassium': 'Potassium', 'k': 'Potassium', 'potassium_k': 'Potassium', # Added for MH dataset
    'phosphorous': 'Phosphorous', 'phosphorus': 'Phosphorous', 'p': 'Phosphorous', 'phosphorus_p': 'Phosphorous', # Added for MH dataset
    'fertilizer name': 'Fertilizer Name', 'fertilizer': 'Fertilizer Name', 'fertilizername': 'Fertilizer Name', 'fertilizer_name': 'Fertilizer Name',
}

def normalise_columns(df, col_map):
    df = df.copy()
    df.columns = [col_map.get(c.lower().strip(), c) for c in df.columns]
    return df

df_fert1 = normalise_columns(df_fert1, FERT_COLUMN_MAP)
df_fert2 = normalise_columns(df_fert2, FERT_COLUMN_MAP)
df_fert_mh_rec = normalise_columns(df_fert_mh_rec, FERT_COLUMN_MAP)

REQUIRED_FERT_COLS = ['Temperature', 'Humidity', 'Moisture', 'Soil Type', 'Crop Type',
                      'Nitrogen', 'Potassium', 'Phosphorous', 'Fertilizer Name']

# Calculate medians for Temperature and Humidity from Kaggle datasets
# to fill missing values in Maharashtra dataset
kaggle_fert_combined = pd.concat([df_fert1, df_fert2], ignore_index=True)
temperature_median = kaggle_fert_combined['Temperature'].median()
humidity_median = kaggle_fert_combined['Humidity'].median()

# Fill missing 'Humidity' in df_fert2 if not already handled
if 'Humidity' not in df_fert2.columns:
    df_fert2['Humidity'] = humidity_median
    print(f"ℹ️  Dataset 2: 'Humidity' not present — filled with combined Kaggle median ({humidity_median:.1f})")

# Fill missing 'Temperature' and 'Humidity' in df_fert_mh_rec
if 'Temperature' not in df_fert_mh_rec.columns:
    df_fert_mh_rec['Temperature'] = temperature_median
    print(f"ℹ️  Maharashtra Fert Rec: 'Temperature' not present — filled with combined Kaggle median ({temperature_median:.1f})")
if 'Humidity' not in df_fert_mh_rec.columns:
    df_fert_mh_rec['Humidity'] = humidity_median
    print(f"ℹ️  Maharashtra Fert Rec: 'Humidity' not present — filled with combined Kaggle median ({humidity_median:.1f})")

# Check for missing required columns in all fertilizer dataframes after normalization
for name, df in [('Kaggle Fert 1', df_fert1), ('Kaggle Fert 2', df_fert2), ('Maharashtra Fert Rec', df_fert_mh_rec)]:
    missing = [c for c in REQUIRED_FERT_COLS if c not in df.columns]
    if missing:
        print(f"⚠️  {name} is missing required columns: {missing}. This should not happen after filling.")
    else:
        print(f"✅ {name} columns OK")

# Select only required columns before concatenation
fert1_clean = df_fert1[REQUIRED_FERT_COLS].copy()
fert2_clean = df_fert2[REQUIRED_FERT_COLS].copy()
fert_mh_rec_clean = df_fert_mh_rec[REQUIRED_FERT_COLS].copy()

df_fert = pd.concat([fert1_clean, fert2_clean, fert_mh_rec_clean], ignore_index=True).drop_duplicates()
print(f"\n✅ Combined fertilizer dataset: {df_fert.shape[0]} rows")
print(f"   Distribution:\n{df_fert['Fertilizer Name'].value_counts()}")

min_count = df_fert['Fertilizer Name'].value_counts().min()
if min_count < 30:
    print(f"\n⚠️  Smallest class has {min_count} samples — watch for imbalance")

# Note on df_soil_health
print("\n--- Note on maharashtra_soil_health.csv ---")
print("The 'maharashtra_soil_health.csv' dataset contains valuable soil parameters but lacks 'Crop Type' and 'Fertilizer Name' columns. Therefore, it is not directly merged into the training data for this supervised fertilizer prediction model. Its features could be used for more complex inference scenarios or feature engineering in an expanded model.")

# ============================== CELL 6: Crop sub-model (accuracy booster) ==============================

df_crop.columns = df_crop.columns.str.lower().str.strip()
CROP_FEATURES   = ['n', 'p', 'k', 'temperature', 'humidity', 'ph', 'rainfall']
missing_crop    = [c for c in CROP_FEATURES if c not in df_crop.columns]
USE_CROP_FEATURE = len(missing_crop) == 0

if not USE_CROP_FEATURE:
    print(f"⚠️  Crop dataset missing {missing_crop} — skipping crop sub-model")
else:
    print("\n🌱 Training crop sub-model...")
    crop_encoder  = LabelEncoder()
    crop_y        = crop_encoder.fit_transform(df_crop['label'])
    crop_X        = df_crop[CROP_FEATURES].values
    crop_scaler   = StandardScaler()
    crop_X_scaled = crop_scaler.fit_transform(crop_X)

    Xc_tr, Xc_te, yc_tr, yc_te = train_test_split(
        crop_X_scaled, crop_y, test_size=0.2, random_state=42, stratify=yc_y
    )
    crop_model = XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        tree_method='hist', device='cuda',
        eval_metric='mlogloss', early_stopping_rounds=20,
        random_state=42, n_jobs=-1,
    )
    crop_model.fit(Xc_tr, yc_tr, eval_set=[(Xc_te, yc_te)], verbose=50)
    print(f"✅ Crop sub-model accuracy : {accuracy_score(yc_te, crop_model.predict(Xc_te))*100:.2f}%")
    print(f"   Best iteration          : {crop_model.best_iteration}")

    # Generate predicted_crop feature for fertilizer dataset
    ph_median       = df_crop['ph'].median()
    rainfall_median = df_crop['rainfall'].median()

    fert_as_crop = pd.DataFrame({
        'n':           df_fert['Nitrogen'].values,
        'p':           df_fert['Phosphorous'].values,
        'k':           df_fert['Potassium'].values,
        'temperature': df_fert['Temperature'].values,
        'humidity':    df_fert['Humidity'].values,
        'ph':          ph_median,
        'rainfall':    rainfall_median,
    })
    df_fert['predicted_crop'] = crop_model.predict(
        crop_scaler.transform(fert_as_crop[CROP_FEATURES].values)
    )
    print("   predicted_crop feature appended ✅")

# ============================== CELL 7: Encode & Preprocess Fertilizer Dataset ==============================

soil_enc      = LabelEncoder()
fert_crop_enc = LabelEncoder()
fert_enc      = LabelEncoder()

df_fert['Soil Type_enc']  = soil_enc.fit_transform(df_fert['Soil Type'])
df_fert['Crop Type_enc']  = fert_crop_enc.fit_transform(df_fert['Crop Type'])
df_fert['Fertilizer_enc'] = fert_enc.fit_transform(df_fert['Fertilizer Name'])

FEATURE_COLS  = ['Temperature', 'Humidity', 'Moisture',
                 'Soil Type_enc', 'Crop Type_enc',
                 'Nitrogen', 'Potassium', 'Phosphorous']
FEATURE_NAMES = ['Temperature', 'Humidity', 'Moisture', 'Soil Type',
                 'Crop Type', 'Nitrogen', 'Potassium', 'Phosphorous']

if USE_CROP_FEATURE:
    FEATURE_COLS.append('predicted_crop')
    FEATURE_NAMES.append('Predicted crop')

X = df_fert[FEATURE_COLS].values
y = df_fert['Fertilizer_enc'].values

X_tr_raw, X_te_raw, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

fert_scaler  = StandardScaler()
X_train      = fert_scaler.fit_transform(X_tr_raw)
X_test       = fert_scaler.transform(X_te_raw)
X_scaled_all = fert_scaler.transform(X)

print(f"\nFeatures    : {FEATURE_NAMES}")
print(f"Train / Test: {X_train.shape[0]} / {X_test.shape[0]}")
print(f"Classes     : {list(fert_enc.classes_)}")

# ============================== CELL 8: Train Fertilizer XGBoost (GPU, with early stopping) ==============================

fert_model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    tree_method='hist',
    device='cuda',
    eval_metric='mlogloss',
    early_stopping_rounds=20,
    random_state=42,
    n_jobs=-1,
)

fert_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)
print(f"\n✅ Best iteration: {fert_model.best_iteration} / 300")

# ============================== CELL 9: Evaluate ==============================

y_pred   = fert_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nTest Accuracy : {accuracy*100:.2f}%")

# Clone model for CV — fix best_iteration as n_estimators, remove early stopping
cv_model = clone(fert_model)
cv_model.set_params(
    n_estimators=fert_model.best_iteration,
    early_stopping_rounds=None,
)
cv        = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(cv_model, X_scaled_all, y, cv=cv, scoring='accuracy', n_jobs=-1)
print(f"5-Fold CV     : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=fert_enc.classes_))

# ============================== CELL 10: Plots ==============================

os.makedirs(DRIVE_EXPORT_PATH, exist_ok=True)

# Loss curve
results = fert_model.evals_result()
plt.figure(figsize=(8, 4))
plt.plot(results['validation_0']['mlogloss'], color='steelblue', linewidth=1.5)
plt.axvline(fert_model.best_iteration, color='tomato', linestyle='--', 
            linewidth=1, label=f'Best: round {fert_model.best_iteration}')
plt.xlabel('Boosting round'); plt.ylabel('Log loss')
plt.title('Fertilizer Model — Validation Loss Curve')
plt.legend(); plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_merged_loss_curve.png'))
plt.show()

# Feature importance
plt.figure(figsize=(8, 5))
imp_df = pd.DataFrame({'feature': FEATURE_NAMES,
                       'importance': fert_model.feature_importances_})
imp_df = imp_df.sort_values('importance', ascending=True)
sns.barplot(data=imp_df, x='importance', y='feature', palette='Blues_r')
plt.title('Fertilizer Model — Feature Importance')
plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_merged_feature_importance.png'))
plt.show()

# Confusion matrix
cm   = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=fert_enc.classes_)
fig, ax = plt.subplots(figsize=(10, 8))
disp.plot(ax=ax, xticks_rotation=45)
plt.title('Fertilizer Model — Confusion Matrix')
plt.tight_layout()
plt.savefig(os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_merged_confusion_matrix.png'))
plt.show()

# ============================== CELL 11: Export all artefacts to Google Drive ==============================

joblib.dump(fert_model,    os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_merged_model.pkl'))
joblib.dump(fert_enc,      os.path.join(DRIVE_EXPORT_PATH, 'fertilizer_merged_encoder.pkl'))
joblib.dump(soil_enc,      os.path.join(DRIVE_EXPORT_PATH, 'fert_merged_soil_encoder.pkl'))
joblib.dump(fert_crop_enc, os.path.join(DRIVE_EXPORT_PATH, 'fert_merged_crop_encoder.pkl'))
joblib.dump(fert_scaler,   os.path.join(DRIVE_EXPORT_PATH, 'fert_merged_scaler.pkl'))

if USE_CROP_FEATURE:
    joblib.dump(crop_model,   os.path.join(DRIVE_EXPORT_PATH, 'crop_merged_sub_model.pkl'))
    joblib.dump(crop_encoder, os.path.join(DRIVE_EXPORT_PATH, 'crop_merged_sub_encoder.pkl'))
    joblib.dump(crop_scaler,  os.path.join(DRIVE_EXPORT_PATH, 'crop_merged_sub_scaler.pkl'))
    joblib.dump({'ph_median': ph_median, 'rainfall_median': rainfall_median},
                os.path.join(DRIVE_EXPORT_PATH, 'crop_merged_fill_values.pkl'))

print(f"\n✅ All artefacts exported → {DRIVE_EXPORT_PATH}\n")
print("  Fertilizer model:")
print("    📦 fertilizer_merged_model.pkl")
print("    📦 fertilizer_merged_encoder.pkl")
print("    📦 fert_merged_soil_encoder.pkl")
print("    📦 fert_merged_crop_encoder.pkl")
print("    📦 fert_merged_scaler.pkl")
if USE_CROP_FEATURE:
    print("\n  Crop sub-model (required at inference):")
    print("    📦 crop_merged_sub_model.pkl")
    print("    📦 crop_merged_sub_encoder.pkl")
    print("    📦 crop_merged_sub_scaler.pkl")
    print("    📦 crop_merged_fill_values.pkl")
print("\n  Plots:")
print("    📊 fertilizer_merged_loss_curve.png")
print("    📊 fertilizer_merged_feature_importance.png")
print("    📊 fertilizer_merged_confusion_matrix.png")
print("\n📋 Copy all .pkl files to: ml-server/app/models/")
print("\n⚠️  INFERENCE ORDER (FastAPI server):")
print("   1. Input: {Temperature, Humidity, Moisture, Soil Type, Crop Type, N, P, K}")
print("   2. Build crop input using N, P, K, Temperature, Humidity + ph/rainfall medians")
print("   3. crop_merged_sub_scaler.transform → crop_merged_sub_model.predict → predicted_crop")
print("   4. Append predicted_crop → 9 features total")
print("   5. fert_merged_scaler.transform → fertilizer_merged_model.predict → fertilizer name")
print("   Always .transform(), never .fit_transform() on new data.")