---
name: auto-regression
description: Autonomously preprocesses tabular data, fits Ridge and Random Forest regression models, logs metrics and parameters to MLflow, and exports the top-performing pipeline. Use whenever regression, price/salary prediction, or tabular model fitting is requested.
---

# Auto Regression Training Protocol

When triggered to fit or train a regression model on a tabular dataset:

## 1. Data Inspection & Cleaning
- Inspect the target dataset CSV.
- Identify the target column specified by the user.
- Split feature columns strictly into numerical and categorical subsets.
- Check for missing values and drop constant or uninformative ID columns.

## 2. Leak-Free Pipeline Preprocessing
- Construct a Scikit-Learn `ColumnTransformer`:
  - **Numerical:** Impute missing values using `SimpleImputer(strategy='median')`, then scale with `StandardScaler()`.
  - **Categorical:** Impute with `SimpleImputer(strategy='most_frequent')`, then encode with `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`.
- Perform an 80/20 train/test split with `random_state=42`.

## 3. Autonomous Training & Evaluation
1. **Model A (Linear Baseline):** Fit a regularized `Ridge(alpha=1.0)` regression pipeline.
2. **Model B (Non-linear Tree):** Fit a `RandomForestRegressor(random_state=42, n_jobs=-1)` with a 3-fold cross-validation grid search (`n_estimators=[100, 200]`, `max_depth=[5, 10, None]`).
3. Compute test set metrics for both models: $R^2$, RMSE, and MAE.

## 4. MLflow Logging via MCP / Code
- Connect to the tracking URI `http://127.0.0.1:5000` under the experiment `tabular-regression-benchmark`.
- Log parameters and test metrics ($R^2$, RMSE, MAE) for both models.
- Save the winning model pipeline directly to disk as `best_regression_model.joblib`.

## 5. Output Summary
Provide a clean summary table containing:
- Train/Test sizes and total feature count after one-hot encoding.
- Ridge vs. Random Forest comparison ($R^2$ and RMSE).
- Confirmation of the exported `.joblib` file path.
- Top 5 most influential features.