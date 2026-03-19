# label-score -- Specification

## 1. Overview

`label-score` is a library for computing inter-annotator agreement (IAA) metrics in JavaScript. It takes annotation data -- labels assigned to items by multiple annotators -- and computes chance-corrected agreement metrics that quantify how consistently the annotators agree. It supports Cohen's Kappa (2 annotators), Fleiss' Kappa (N annotators), Krippendorff's Alpha (N annotators, any measurement level, missing data), Scott's Pi (2 annotators, pooled marginals), Gwet's AC1 (stable under prevalence skew), and simple percentage agreement. It provides both a TypeScript/JavaScript API for programmatic use and a CLI for computing agreement from CSV or JSON files.

The gap this package fills is specific and well-defined. Inter-annotator agreement is a foundational metric in any annotation workflow. When multiple humans label the same data (sentiment, toxicity, quality ratings, intent classification), the first question is always: how much do the annotators agree? If agreement is low, the labels are unreliable -- the annotation guidelines are ambiguous, the task is too subjective, or some annotators need retraining. If agreement is high, the labels can be trusted as ground truth for training and evaluation. Every machine learning textbook, every annotation handbook, and every dataset paper reports IAA metrics. They are as fundamental to annotation quality as unit tests are to code quality.

In Python, computing these metrics is straightforward. `sklearn.metrics.cohen_kappa_score` computes Cohen's Kappa. `nltk.agreement.AnnotationTask` computes multiple agreement metrics from annotation triples. The standalone `krippendorff` package on PyPI computes Krippendorff's Alpha with full support for ordinal, interval, and ratio measurement levels. `statsmodels.stats.inter_rater` provides Fleiss' Kappa and Cohens' Kappa. The `irr` package in R provides a comprehensive suite of agreement metrics. In JavaScript, the situation is completely different: there are zero npm packages that compute chance-corrected agreement metrics. A developer working in Node.js who needs to validate annotation quality must either shell out to Python, reimplement the formulas from scratch, or skip IAA entirely and hope the labels are consistent. None of these options is acceptable for professional annotation workflows.

The need for IAA metrics in JavaScript has grown sharply with the rise of LLM-as-judge evaluation. Teams now routinely use multiple LLMs to label the same data -- GPT-4 and Claude both rate response quality on a 1-5 scale -- and need to measure how consistently the models agree. They use multiple human annotators to create gold-standard evaluation datasets. They compare human labels against LLM labels to measure model alignment. All of these workflows require agreement metrics, and all of them increasingly happen in JavaScript/TypeScript codebases (promptfoo, LangChain.js, Vercel AI SDK). `label-score` provides the missing primitive: compute any standard agreement metric, on any annotation data, in JavaScript, with zero dependencies.

`label-score` provides both a TypeScript/JavaScript API for programmatic use and a CLI for terminal and shell-script use. The API returns structured result objects with the metric value, interpretation label, intermediate computations (observed agreement, expected agreement, confusion matrix), and optional confidence intervals. The CLI reads annotation data from CSV, JSON, or JSONL files and prints results as human-readable text or JSON. All metrics are verified against Python sklearn and nltk outputs to ensure numerical equivalence.

---

## 2. Goals and Non-Goals

### Goals

- Provide `cohensKappa(annotatorA, annotatorB, options?)` that computes Cohen's Kappa for exactly two annotators with categorical or ordinal labels. Support unweighted, linear-weighted, and quadratic-weighted variants for ordinal data.
- Provide `fleissKappa(matrix, options?)` that computes Fleiss' Kappa for any number of annotators (>=2) rating items into categorical labels. Accept both a category-count matrix and raw annotation data.
- Provide `krippendorffAlpha(data, options?)` that computes Krippendorff's Alpha for any number of annotators, any measurement level (nominal, ordinal, interval, ratio), with full support for missing data and unequal numbers of raters per item.
- Provide `scottsPi(annotatorA, annotatorB)` that computes Scott's Pi for two annotators using pooled marginals.
- Provide `gwetsAC1(data, options?)` that computes Gwet's AC1 as a prevalence-stable alternative to Kappa.
- Provide `percentAgreement(data)` that computes the simplest agreement metric -- the fraction of items where annotators assign the same label.
- Provide `confusionMatrix(annotatorA, annotatorB)` that builds a confusion matrix showing label correspondence between two annotators.
- Provide `agreement(data, options?)` that computes all applicable metrics for the given data and returns a comprehensive `AgreementReport`.
- Support three input data formats: matrix format (rows = items, columns = annotators, cells = labels), long format (`{ item, annotator, label }` triples), and pairwise format (two parallel arrays). Auto-detect format when possible.
- Support four measurement levels: nominal, ordinal, interval, and ratio. Each level uses the appropriate distance function for metrics that depend on it (Krippendorff's Alpha, weighted Cohen's Kappa).
- Provide bootstrap confidence intervals and standard error estimation for all metrics.
- Provide a CLI (`label-score`) that reads annotation data from CSV, JSON, or JSONL files and computes agreement metrics with configurable options.
- Ship complete TypeScript type definitions. All public types are exported. All result objects are fully typed.
- Keep runtime dependencies at zero. All statistical computations are implemented using built-in JavaScript capabilities.
- Verify all metric implementations against Python sklearn, nltk, and krippendorff package outputs. Test with published benchmark datasets where known-correct values exist.

### Non-Goals

- **Not an annotation tool.** This package computes agreement metrics on existing annotation data. It does not provide a UI for creating annotations, managing annotator assignments, or coordinating annotation workflows. For annotation tooling, use Label Studio, Prodigy, or Argilla.
- **Not an LLM-as-judge framework.** This package does not call LLMs to generate labels. It measures agreement between labels that already exist, regardless of whether those labels were produced by humans or LLMs. For LLM-as-judge evaluation, use promptfoo, deepeval, or `rag-eval-node-ts` from this monorepo.
- **Not a statistical testing framework.** This package computes agreement metrics and provides confidence intervals. It does not perform full hypothesis testing (ANOVA, chi-squared tests, power analysis). For general statistics in JavaScript, use `jstat` or `simple-statistics`.
- **Not an embedding similarity tool.** This package measures agreement on discrete labels (categorical, ordinal) or numeric ratings. It does not compute embedding-based semantic similarity between free-text annotations. For text similarity, use an embedding model.
- **Not a data labeling quality management system.** This package computes point-in-time agreement metrics. It does not track annotator performance over time, flag underperforming annotators, or manage annotation review queues. It provides the metric primitive that such systems would consume.
- **Not a Python replacement.** This package implements the same metrics as sklearn, nltk, and the krippendorff Python package, but it does not replicate their full API surface. Advanced features like multi-label agreement, fuzzy category matching, or custom kernel functions are not included. The target is the 90% of use cases that need standard agreement metrics computed correctly and quickly in JavaScript.

---

## 3. Target Users and Use Cases

### Annotation Team Leads Validating Label Quality

Team leads managing human annotation projects (sentiment labeling, intent classification, content moderation, named entity annotation) who need to measure whether their annotators agree on labels. They have 5 annotators labeling 1,000 items into 4 categories. Before using the labels for training, they compute Fleiss' Kappa to measure overall agreement and per-category agreement. If Kappa is below 0.6, they review the annotation guidelines and retrain annotators before proceeding. `label-score` provides the metrics they need without requiring a Python environment or statistical expertise.

### LLM Evaluation Engineers Measuring Judge Consistency

Engineers using LLM-as-judge evaluation patterns who need to validate that their judge model produces consistent ratings. They have GPT-4 and Claude both rating 500 responses on a 1-5 quality scale. They compute weighted Cohen's Kappa (quadratic weights, since the scale is ordinal) to measure how consistently the two models agree. A Kappa of 0.75 (substantial agreement) gives them confidence that either model can be used as a judge. A Kappa of 0.35 (fair agreement) tells them the models disagree significantly and they need to investigate which ratings diverge and why. `label-score` integrates into their existing Node.js evaluation pipeline.

### Dataset Curators Building Gold-Standard Test Sets

Curators creating ground-truth evaluation datasets for LLM testing who need to ensure label reliability. Each test case has an expected output quality label (pass/fail, or a rubric score) assigned by multiple reviewers. Before finalizing the dataset, they compute Krippendorff's Alpha to measure reliability, choosing it because some items have missing ratings (not every reviewer rated every item). An Alpha above 0.8 indicates reliable labels suitable for automated evaluation. Items where reviewers disagree are flagged for adjudication. `label-score` computes the metrics and identifies the disagreement items, feeding naturally into `eval-dataset` from this monorepo.

### ML Engineers Validating Training Data

Engineers preparing labeled datasets for fine-tuning or classification model training who need to verify annotation quality before investing compute in training. Low agreement in the training labels means the model will learn conflicting signals and perform poorly. They compute agreement metrics on a subset of doubly-annotated data (items labeled by at least two annotators) to estimate overall label quality. `label-score` provides the metrics; the engineer decides whether the labels are reliable enough to train on.

### Researchers Reporting IAA in Papers

Researchers conducting human evaluation studies who need to report standard IAA metrics in their papers. Academic convention requires reporting Cohen's Kappa or Krippendorff's Alpha with confidence intervals. The researcher has annotation data in a CSV file and needs Kappa values with 95% confidence intervals. The CLI (`label-score --input annotations.csv --metric krippendorff --ci 0.95 --level ordinal`) produces the numbers they need for the paper's methodology section.

### Teams Comparing Annotation Guidelines

Teams testing whether a revised annotation guideline improves annotator agreement. They run the same annotators on the same data under two different guidelines and compare agreement metrics. If the revised guideline produces higher Kappa, it is adopted. `label-score` computes the before/after metrics. The agreement report includes per-category breakdowns that show which categories improved and which did not.

### CI/CD Pipelines Gating on Annotation Quality

Teams that integrate annotation quality checks into their CI pipeline. When new annotations are committed to the repository, a CI step computes agreement metrics and fails the build if agreement drops below a threshold. The CLI's exit code (0 for above-threshold, 1 for below-threshold) integrates naturally with CI/CD systems. `label-score --input annotations.csv --metric fleiss --threshold 0.6 --quiet` exits with code 0 if Fleiss' Kappa is at least 0.6, and code 1 otherwise.

---

## 4. Core Concepts

### Annotator

An annotator is an entity that assigns labels to items. An annotator can be a human (a data labeler, a domain expert, a crowd worker) or a machine (an LLM judge, a classification model, a rule-based system). `label-score` is agnostic about the nature of annotators -- it operates on the labels they produce, not on who or what produced them. Annotators are identified by string IDs in long-format data, or by column position in matrix-format data.

### Item

An item is a thing being labeled. In a sentiment annotation project, an item is a text passage. In an LLM evaluation, an item is a model response. In a medical imaging study, an item is a scan. `label-score` does not examine item content -- it only uses item identity to match labels from different annotators to the same item. Items are identified by string IDs in long-format data, or by row position in matrix-format data.

### Label

A label is the value assigned by an annotator to an item. Labels can be categorical (sentiment: positive/negative/neutral), ordinal (quality: 1/2/3/4/5), interval (temperature difference: -10 to +10), or ratio (word count: 0 to infinity). The type of label determines which metrics are applicable and which distance functions are used.

### Measurement Level

The measurement level describes the mathematical properties of the labels. It determines how "distance" between labels is computed, which affects metrics like Krippendorff's Alpha and weighted Cohen's Kappa. The four standard measurement levels are:

- **Nominal**: Labels are categories with no inherent order. The only distinction is "same" or "different." Distance: 0 if labels match, 1 if they differ. Example: sentiment (positive, negative, neutral), intent (booking, cancellation, inquiry).
- **Ordinal**: Labels have a meaningful order but the distances between consecutive labels are not necessarily equal. Distance: based on rank positions, not raw values. Example: quality ratings (poor, fair, good, excellent), Likert scales (1-5).
- **Interval**: Labels are numeric with meaningful, equal distances between values, but no true zero. Distance: squared difference between values. Example: temperature in Celsius, year.
- **Ratio**: Labels are numeric with meaningful distances and a true zero. Distance: squared ratio of values. Example: word count, response time in milliseconds.

### Observed Agreement (p_o)

Observed agreement is the fraction of items where annotators actually agree. For two annotators rating 100 items, if they assign the same label on 80 items, p_o = 0.80. Observed agreement is the numerator component in chance-corrected metrics. By itself, it is misleading: if there are two categories and both annotators label 95% of items as category A, p_o will be approximately 0.90 even if the annotators are labeling randomly, because random chance alone would produce about 0.90 agreement. This is why chance correction is essential.

### Expected Agreement (p_e)

Expected agreement is the probability that annotators would agree by chance alone, given the label distributions they use. For Cohen's Kappa, p_e is computed from each annotator's individual label distribution (marginal probabilities). For Scott's Pi, p_e is computed from the pooled label distribution across both annotators. For Fleiss' Kappa, p_e is computed from the overall proportion of labels in each category across all annotators. The formula for chance-corrected agreement is: metric = (p_o - p_e) / (1 - p_e). When p_o equals p_e, the metric is 0 (agreement is exactly at chance level). When p_o is 1, the metric is 1 (perfect agreement). When p_o is less than p_e, the metric is negative (agreement worse than chance).

### Chance-Corrected Agreement

A chance-corrected agreement metric adjusts the raw agreement rate to account for the probability of agreement by chance. The general formula shared by Cohen's Kappa, Scott's Pi, Fleiss' Kappa, and Gwet's AC1 is:

```
metric = (p_o - p_e) / (1 - p_e)
```

Where `p_o` is observed agreement and `p_e` is expected agreement by chance. The metrics differ in how they compute `p_e`. Cohen's Kappa uses each annotator's individual marginals. Scott's Pi uses pooled marginals. Fleiss' Kappa extends pooled marginals to N annotators. Gwet's AC1 uses a different formulation for p_e that is more stable when the prevalence of categories is highly skewed.

### Disagreement (for Krippendorff's Alpha)

Krippendorff's Alpha uses disagreement rather than agreement. It computes observed disagreement (D_o) and expected disagreement (D_e), then: alpha = 1 - D_o / D_e. This formulation handles missing data naturally because disagreement is computed over all pairs of labels assigned to the same item, regardless of whether all annotators rated every item. The distance function used to compute disagreement varies by measurement level.

### Interpretation Scale

Agreement metrics produce a number in the range [-1, 1] (theoretically), most commonly [0, 1]. The standard interpretation scale for Kappa-family metrics (Landis & Koch, 1977) is:

| Range | Interpretation |
|-------|---------------|
| < 0.00 | Poor (worse than chance) |
| 0.00 - 0.20 | Slight |
| 0.21 - 0.40 | Fair |
| 0.41 - 0.60 | Moderate |
| 0.61 - 0.80 | Substantial |
| 0.81 - 1.00 | Almost perfect |

For Krippendorff's Alpha, the conventional thresholds are stricter. Krippendorff recommends: alpha >= 0.800 for reliable data, alpha >= 0.667 for tentative conclusions, alpha < 0.667 for unreliable data. `label-score` reports both the raw metric value and an interpretation label based on the appropriate scale for each metric.

### Confusion Matrix

For two annotators, a confusion matrix is a table where rows represent annotator A's labels and columns represent annotator B's labels. Each cell (i, j) counts the number of items where annotator A assigned label i and annotator B assigned label j. The diagonal cells represent agreement; off-diagonal cells represent disagreement. The confusion matrix is the foundation for computing Cohen's Kappa: observed agreement is the sum of diagonal cells divided by the total, and expected agreement is derived from the row and column marginal sums.

---

## 5. Metrics Catalog

### 5.1 Percentage Agreement

**Metric ID**: `percent-agreement`

**What it measures**: The simplest agreement metric -- the fraction of items where all annotators assigned the same label. For two annotators: the number of items with matching labels divided by the total number of items. For N annotators: the number of items where all N annotators assigned the same label divided by the total number of items.

**Formula (2 annotators)**:

```
PA = (number of items where A[i] == B[i]) / n
```

Where `A[i]` and `B[i]` are the labels assigned by annotator A and annotator B to item i, and n is the total number of items.

**Formula (N annotators)**:

For N annotators rating each item, compute per-item agreement as the proportion of agreeing annotator pairs:

```
PA_item = (1 / (r * (r - 1))) * sum_k(n_ik * (n_ik - 1))
```

Where r is the number of annotators per item, n_ik is the number of annotators who assigned category k to item i. Overall percentage agreement is the mean of per-item agreement across all items.

**Input**: Two parallel label arrays (pairwise format), or a matrix/long-format dataset.

**Assumptions**: All items have labels from all annotators (no missing data for the basic formulation). Labels are categorical.

**Interpretation**: 0.0 = no items agreed, 1.0 = all items agreed. There is no standard interpretation scale because percentage agreement is not chance-corrected.

**Limitations**: Does not account for chance agreement. If there are two categories and both annotators label 90% of items as category A, percentage agreement will be approximately 0.82 even with random labeling. This makes percentage agreement misleadingly high when label distributions are skewed. Always pair percentage agreement with a chance-corrected metric (Kappa, Alpha).

**When to use**: As a quick sanity check, as a complement to chance-corrected metrics, or when presenting results to a non-technical audience that finds "80% of items agreed" more intuitive than "Kappa = 0.65."

**Edge cases**:
- All labels identical: PA = 1.0.
- Zero items: return NaN with a warning.
- One item: PA is either 0 or 1.

---

### 5.2 Cohen's Kappa

**Metric ID**: `cohens-kappa`

**What it measures**: Agreement between exactly two annotators on categorical labels, corrected for chance agreement. It is the most widely used agreement metric for two-annotator scenarios. Cohen's Kappa uses each annotator's individual marginal distribution to estimate expected agreement, which means it does not assume the annotators have the same labeling tendencies.

**Formula**:

```
kappa = (p_o - p_e) / (1 - p_e)
```

Where:

```
p_o = (1/n) * sum_k(n_kk)
```

p_o is the observed agreement: the proportion of items where both annotators assigned the same label. n_kk is the count on the diagonal of the confusion matrix for category k.

```
p_e = sum_k(p_k_A * p_k_B)
```

p_e is the expected agreement by chance: the sum over all categories k of the product of annotator A's proportion of category k (p_k_A) and annotator B's proportion of category k (p_k_B). This is computed from the marginal totals of the confusion matrix.

**Full derivation from confusion matrix**:

Given a confusion matrix C where C[i][j] is the count of items labeled i by annotator A and j by annotator B:

1. n = sum of all cells in C (total items).
2. p_o = sum(C[k][k] for all k) / n.
3. Row marginal for category k: r_k = sum(C[k][j] for all j) / n = proportion of items annotator A labeled as k.
4. Column marginal for category k: c_k = sum(C[i][k] for all i) / n = proportion of items annotator B labeled as k.
5. p_e = sum(r_k * c_k for all k).
6. kappa = (p_o - p_e) / (1 - p_e).

**Weighted Cohen's Kappa** (for ordinal data):

When labels have a natural order (e.g., a 1-5 rating scale), not all disagreements are equal. Rating an item 1 when the other annotator rated it 5 is a worse disagreement than rating it 4 when the other rated it 5. Weighted Kappa assigns weights to disagreements based on the distance between the labels.

```
kappa_w = 1 - (sum_{i,j} w_{ij} * o_{ij}) / (sum_{i,j} w_{ij} * e_{ij})
```

Where w_{ij} is the weight (penalty) for a disagreement between categories i and j, o_{ij} is the observed proportion in cell (i,j), and e_{ij} is the expected proportion in cell (i,j).

**Weight types**:

- **Linear weights**: w_{ij} = |i - j| / (k - 1), where k is the number of categories. Disagreements are penalized proportionally to the distance between categories.
- **Quadratic weights**: w_{ij} = (i - j)^2 / (k - 1)^2. Disagreements are penalized proportionally to the squared distance. Quadratic weights penalize large disagreements more heavily than linear weights.
- **Custom weights**: A user-provided weight matrix where w_{ij} specifies the penalty for each pair of categories.

**Input**: Two parallel label arrays of equal length.

**Assumptions**: Exactly two annotators. Every item labeled by both annotators (no missing data). Labels are categorical (unweighted) or ordinal (weighted).

**Interpretation scale** (Landis & Koch, 1977):

| Kappa | Interpretation |
|-------|---------------|
| < 0.00 | Poor |
| 0.00 - 0.20 | Slight |
| 0.21 - 0.40 | Fair |
| 0.41 - 0.60 | Moderate |
| 0.61 - 0.80 | Substantial |
| 0.81 - 1.00 | Almost perfect |

**Standard error** (for asymptotic confidence intervals):

```
SE(kappa) = sqrt((p_o * (1 - p_o)) / (n * (1 - p_e)^2))
```

This is the simplified large-sample standard error. The exact formula involves the diagonal and off-diagonal elements of the confusion matrix and is more complex. `label-score` implements the exact formula from Fleiss, Cohen, and Everitt (1969).

**Edge cases**:
- Perfect agreement (p_o = 1): kappa = 1.0.
- Chance agreement (p_o = p_e): kappa = 0.0.
- p_e = 1.0 (both annotators assign all items to the same single category): kappa is undefined (division by zero). Return NaN with a warning explaining that kappa is undefined when expected agreement is 1.0.
- Empty input: return NaN with a warning.
- Unequal array lengths: throw an error.
- Labels from only one category: p_e = 1.0, kappa is undefined. This is the "prevalence paradox" -- when one category dominates, Kappa can be misleadingly low or undefined even when agreement is high. In this case, recommend Gwet's AC1 as an alternative.

---

### 5.3 Scott's Pi

**Metric ID**: `scotts-pi`

**What it measures**: Agreement between exactly two annotators on categorical labels, corrected for chance agreement using pooled marginals. The key difference from Cohen's Kappa is how expected agreement is computed. Cohen's Kappa uses each annotator's individual marginal distribution (allowing for different labeling tendencies). Scott's Pi assumes both annotators have the same underlying distribution and computes expected agreement from the pooled (averaged) distribution. This makes Scott's Pi stricter than Cohen's Kappa when annotators have different marginals.

**Formula**:

```
pi = (p_o - p_e) / (1 - p_e)
```

Where p_o is the observed agreement (identical to Cohen's Kappa), and:

```
p_e = sum_k(((p_k_A + p_k_B) / 2)^2)
```

The pooled proportion for each category k is the average of annotator A's proportion and annotator B's proportion. Expected agreement is the sum of squared pooled proportions.

**How it differs from Cohen's Kappa**: When both annotators have similar marginal distributions, Scott's Pi and Cohen's Kappa produce nearly identical values. When annotators have different marginals (one annotator labels 60% positive and the other labels 40% positive), they diverge. Scott's Pi will be lower because it assumes the annotators should have the same distribution, and the differing marginals are treated as a source of disagreement in the chance correction.

**Input**: Two parallel label arrays of equal length.

**Assumptions**: Exactly two annotators. Every item labeled by both. Labels are categorical (no weighted variant). Both annotators drawn from the same population (same underlying label distribution).

**When to use**: When the annotators are interchangeable (sampled from the same pool, received the same training, expected to behave identically). In practice, Cohen's Kappa is more commonly reported because it makes fewer assumptions. Scott's Pi is included for completeness and for contexts where the equal-marginals assumption is justified.

**Edge cases**: Same as Cohen's Kappa. p_e = 1.0 leads to undefined pi.

---

### 5.4 Fleiss' Kappa

**Metric ID**: `fleiss-kappa`

**What it measures**: Agreement among N annotators (N >= 2) on categorical labels, corrected for chance agreement. Fleiss' Kappa extends the logic of Scott's Pi to any number of annotators. Each item is rated by a fixed number of annotators (not necessarily the same annotators for each item), and agreement is measured as the proportion of annotator pairs that agree on each item, corrected for the expected proportion of agreement by chance.

**Formula**:

1. For each item i and each category k, let n_ik be the number of annotators who assigned category k to item i.
2. Let r be the number of annotators per item (must be the same for all items in the standard formulation).
3. Let n be the total number of items.

Per-item agreement:

```
P_i = (1 / (r * (r - 1))) * (sum_k(n_ik^2) - r)
```

This is the proportion of agreeing annotator pairs for item i. If all r annotators agree on item i, P_i = 1. If they are evenly split, P_i is near 0.

Overall observed agreement:

```
P_bar = (1/n) * sum_i(P_i)
```

Per-category expected agreement:

```
p_k = (1 / (n * r)) * sum_i(n_ik)
```

p_k is the overall proportion of assignments to category k.

Expected agreement by chance:

```
P_e_bar = sum_k(p_k^2)
```

Fleiss' Kappa:

```
kappa = (P_bar - P_e_bar) / (1 - P_e_bar)
```

**Input**: A category-count matrix (n items x K categories, where each cell is the count of annotators who assigned that category to that item) or long-format annotation triples. `label-score` accepts both and converts internally to the category-count matrix.

**Assumptions**: Fixed number of annotators per item (r is constant). Labels are categorical (no ordinal extension in the standard formulation). At least 2 annotators per item.

**Interpretation**: Same scale as Cohen's Kappa (Landis & Koch).

**Per-category Kappa**: Fleiss also defined a per-category Kappa (kappa_k) that measures agreement for each category independently. This is useful for identifying which categories annotators agree on (kappa_k is high) and which are problematic (kappa_k is low). `label-score` computes per-category Kappa as part of the Fleiss' Kappa result.

```
kappa_k = (P_bar_k - p_k) / (1 - p_k)
```

Where P_bar_k is the observed agreement specific to category k.

**Edge cases**:
- P_e_bar = 1 (all labels in one category): kappa is undefined. Return NaN with a warning.
- r = 1 (only one annotator per item): agreement is undefined. Throw an error.
- All items have perfect agreement: kappa = 1.0.
- Variable r across items: Fleiss' Kappa requires constant r. If r varies, throw an error with a message recommending Krippendorff's Alpha, which handles variable r naturally.

---

### 5.5 Krippendorff's Alpha

**Metric ID**: `krippendorff-alpha`

**What it measures**: The most general agreement metric. Krippendorff's Alpha handles any number of annotators, any measurement level (nominal, ordinal, interval, ratio), missing data (not all annotators rate all items), and different numbers of annotators per item. It is the recommended metric when any of these conditions apply -- which in practice means most real-world annotation scenarios, where missing data is common and measurement levels vary.

**Formula**:

Krippendorff's Alpha is defined in terms of observed and expected disagreement:

```
alpha = 1 - D_o / D_e
```

Where D_o is observed disagreement and D_e is expected disagreement.

**Computing D_o (observed disagreement)**:

For each item i, consider all pairs of labels assigned to that item by different annotators. For each pair of labels (c, k), compute the distance d(c, k) using the appropriate distance function for the measurement level. Sum the distances across all pairs and all items, weighted by the number of pairs per item.

```
D_o = (1 / (n_pairs)) * sum over all items i: sum over all pairs (c,k) in item i: d(c, k) / (m_i - 1)
```

Where m_i is the number of annotators who rated item i, and n_pairs is the normalizing factor.

More precisely, using the coincidence matrix formulation:

1. Build a coincidence matrix o_ck: for each item with m_i >= 2 annotators, each pair of values (c, k) assigned to the item contributes 1/(m_i - 1) to o_ck. The coincidence matrix is symmetric: o_ck = o_kc.
2. Let n_total = sum of all o_ck values = total number of pairable values.
3. Let n_c = sum_k(o_ck) = marginal frequency for value c.

```
D_o = (1/n_total) * sum_{c != k} o_ck * d(c, k)
```

**Computing D_e (expected disagreement)**:

```
D_e = (1 / (n_total * (n_total - 1))) * sum_{c != k} n_c * n_k * d(c, k)
```

**Distance functions by measurement level**:

| Level | d(c, k) | Description |
|-------|---------|-------------|
| Nominal | 0 if c == k, 1 if c != k | Binary: same or different. |
| Ordinal | Based on cumulative ranks. d(c, k) = (sum of n_g for g between c and k, inclusive, minus (n_c + n_k)/2)^2 | Accounts for the ordered nature of categories. Categories that are further apart in rank order have larger distances. |
| Interval | (c - k)^2 | Squared difference between numeric values. Appropriate when equal differences in value represent equal differences in meaning. |
| Ratio | ((c - k) / (c + k))^2 | Squared ratio difference. Appropriate when the ratio between values is more meaningful than the absolute difference (e.g., a difference of 10 between 100 and 110 is less significant than between 10 and 20). |

**Input**: Long-format annotation triples `{ item, annotator, label }` (recommended, handles missing data naturally) or a matrix with null/undefined for missing entries.

**Assumptions**: At least 2 annotators must rate at least one item. Items with only one rater are excluded from computation (they contribute no disagreement information). Labels must be consistent with the specified measurement level.

**Interpretation** (Krippendorff's recommended thresholds):

| Alpha | Interpretation |
|-------|---------------|
| >= 0.800 | Reliable for drawing conclusions |
| 0.667 - 0.799 | Tentative conclusions only |
| < 0.667 | Unreliable data, do not use |

These thresholds are stricter than the Landis & Koch scale used for Kappa because Alpha is designed as a reliability metric for research data, where the consequences of using unreliable data are more severe.

**Edge cases**:
- All labels identical: D_o = 0, alpha = 1.0.
- All items have exactly one rater: no pairs exist. Return NaN with a warning.
- Completely random labeling: alpha approaches 0.
- D_e = 0 (only one distinct label in the data): alpha is undefined (division by zero). Return NaN with a warning.
- Very small sample size (fewer than 5 items): alpha is statistically unreliable. Return the value but include a warning about small sample size.

---

### 5.6 Gwet's AC1

**Metric ID**: `gwets-ac1`

**What it measures**: An alternative chance-corrected agreement metric that addresses the "prevalence paradox" and the "bias paradox" that afflict Kappa-family metrics. When one category dominates the label distribution (high prevalence) or when annotators have very different marginals (high bias), Kappa can produce counterintuitively low values even when observed agreement is high. Gwet's AC1 uses a different formulation for expected agreement that is more stable under these conditions.

**The prevalence paradox**: Consider two annotators rating 100 items into positive/negative. If both label 95 items as positive, observed agreement is approximately 0.90. But p_e is also approximately 0.90 (because chance alone would produce high agreement with such skewed distributions). Cohen's Kappa = (0.90 - 0.90) / (1 - 0.90) = 0.0, suggesting zero agreement beyond chance. This is mathematically correct but practically misleading -- the annotators genuinely agree on 90 items.

**AC1 formula**:

```
AC1 = (p_o - p_e_AC1) / (1 - p_e_AC1)
```

Where:

```
p_e_AC1 = (2 / (K * (K - 1))) * sum_k(pi_k * (1 - pi_k))
```

Where K is the number of categories and pi_k is the overall proportion of labels in category k. This formulation estimates the expected agreement from a model where annotators randomly assign labels with some probability (1/K) of guessing correctly on "hard" items.

**When to prefer AC1 over Kappa**:
- When label distributions are highly skewed (one category dominates).
- When the number of categories is small (binary labeling is particularly affected by the prevalence paradox).
- When Kappa produces values that seem inconsistent with high observed agreement.
- As a complementary metric alongside Kappa -- report both and compare. If they diverge significantly, the prevalence or bias paradox is likely at play.

**Input**: Two parallel label arrays (2 annotators) or a category-count matrix (N annotators).

**Assumptions**: Labels are categorical. No weighted variant in the standard formulation.

**Interpretation**: Same range as Kappa (0 to 1 for the practical cases). The Landis & Koch scale can be applied, though AC1 values tend to be higher than Kappa values on the same data when prevalence is skewed.

**Edge cases**: Same as Cohen's Kappa. When all labels are in one category, p_e_AC1 = 0, and AC1 = p_o, which is the intuitively correct result (AC1 does not penalize for prevalence).

---

## 6. Input Data Formats

### 6.1 Pairwise Format

The simplest format, for exactly two annotators. Two arrays of labels of equal length, where index i in each array corresponds to item i.

```typescript
const annotatorA = ['positive', 'negative', 'positive', 'neutral', 'positive'];
const annotatorB = ['positive', 'negative', 'neutral', 'neutral', 'positive'];

const result = cohensKappa(annotatorA, annotatorB);
```

Labels can be strings, numbers, or booleans. `label-score` treats all labels as categorical by default; to enable ordinal treatment (for weighted Kappa or Krippendorff's Alpha), the caller specifies the measurement level and the label ordering.

### 6.2 Matrix Format

A 2D array where rows are items and columns are annotators. Each cell contains the label assigned by that annotator to that item. `null` or `undefined` represents missing data (annotator did not rate that item).

```typescript
const matrix = [
  ['positive', 'positive', 'positive'],   // item 0: all agree
  ['negative', 'negative', 'neutral'],     // item 1: 2 agree, 1 differs
  ['positive', null,       'positive'],    // item 2: annotator 1 did not rate
  ['neutral',  'neutral',  'neutral'],     // item 3: all agree
  ['positive', 'negative', null],          // item 4: annotator 2 did not rate
];

const result = fleissKappa(matrix);
// or
const result = krippendorffAlpha(matrix, { level: 'nominal' });
```

### 6.3 Long Format

An array of annotation triples `{ item, annotator, label }`. This is the most flexible format: it handles any number of annotators, any number of items, and missing data naturally (if annotator X did not rate item Y, there is simply no triple for that combination).

```typescript
const annotations = [
  { item: 'doc1', annotator: 'alice', label: 'positive' },
  { item: 'doc1', annotator: 'bob',   label: 'positive' },
  { item: 'doc1', annotator: 'carol', label: 'neutral' },
  { item: 'doc2', annotator: 'alice', label: 'negative' },
  { item: 'doc2', annotator: 'bob',   label: 'negative' },
  // carol did not rate doc2 -- this is missing data, handled naturally
  { item: 'doc3', annotator: 'alice', label: 'positive' },
  { item: 'doc3', annotator: 'carol', label: 'positive' },
  // bob did not rate doc3
];

const result = krippendorffAlpha(annotations, { level: 'nominal' });
```

### 6.4 Category-Count Matrix (for Fleiss' Kappa)

A 2D array where rows are items and columns are categories. Each cell contains the number of annotators who assigned that category to that item. This is the native input format for Fleiss' Kappa. `label-score` can convert matrix-format or long-format data to category-count format internally.

```typescript
// 5 items rated by 3 annotators into 3 categories: positive, negative, neutral
const categoryMatrix = [
  [3, 0, 0],  // item 0: all 3 say positive
  [0, 2, 1],  // item 1: 2 say negative, 1 says neutral
  [2, 0, 1],  // item 2: 2 say positive, 1 says neutral
  [0, 0, 3],  // item 3: all 3 say neutral
  [1, 1, 1],  // item 4: one of each (no agreement)
];

const result = fleissKappa(categoryMatrix, { categories: ['positive', 'negative', 'neutral'] });
```

### 6.5 Format Auto-Detection

When data is passed to the `agreement()` function or to metric functions that accept multiple formats, `label-score` auto-detects the format:

1. If the input is two arrays of primitives, it is pairwise format.
2. If the input is an array of objects with `item`, `annotator`, and `label` properties, it is long format.
3. If the input is a 2D array where the inner arrays contain primitives (strings, numbers, or null), it is matrix format.
4. If the input is a 2D array where the inner arrays contain only non-negative integers and every row sums to the same value, it is category-count matrix format.

Auto-detection is best-effort. When the format is ambiguous (e.g., a 2D array of small integers could be either matrix format or category-count format), the caller should specify the format explicitly via the `format` option.

### 6.6 Missing Data Handling

Missing data (an annotator did not rate an item) is represented differently per format:

- **Pairwise format**: Missing data is not supported. Both arrays must be the same length with no missing values. For two-annotator data with missing entries, use matrix format or long format.
- **Matrix format**: `null` or `undefined` in a cell means the annotator did not rate that item. Items with fewer than 2 non-null labels are excluded from computation.
- **Long format**: Missing data is implicit -- the absence of a triple means the annotator did not rate the item.
- **Category-count matrix**: Missing data is not representable in this format (each row sums to a fixed r). If r varies, use matrix or long format.

Metrics that support missing data: Krippendorff's Alpha (fully supports variable numbers of raters per item), percentage agreement (can exclude items with fewer than 2 raters). Metrics that require complete data: Cohen's Kappa (requires both annotators for every item), Scott's Pi (same), Fleiss' Kappa (requires fixed r per item). When a metric that requires complete data receives data with missing entries, `label-score` either filters to items with complete data (and logs a warning with the number of excluded items) or throws an error, configurable via the `missingData` option (`'exclude'` or `'error'`; default: `'exclude'`).

---

## 7. Measurement Levels and Distance Functions

### Nominal

**When to use**: Labels are unordered categories. There is no meaningful "distance" between them. Examples: sentiment (positive/negative/neutral), language (English/Spanish/French), intent (booking/cancellation/inquiry).

**Distance function**: d(c, k) = 0 if c == k, 1 if c != k.

**Applicable metrics**: All metrics. Cohen's Kappa (unweighted), Scott's Pi, Fleiss' Kappa, Krippendorff's Alpha (nominal), Gwet's AC1, percentage agreement.

### Ordinal

**When to use**: Labels have a meaningful order but the intervals between consecutive labels are not necessarily equal. Examples: Likert scales (strongly disagree / disagree / neutral / agree / strongly agree), quality ratings (1-5 stars), severity levels (low/medium/high/critical).

**Distance function for Krippendorff's Alpha**: Uses cumulative frequency ranks. The distance between two ordinal values c and k (where c < k) is:

```
d(c, k) = (sum of n_g for g from c to k, inclusive, minus (n_c + n_k) / 2)^2
```

Where n_g is the number of times value g appears in the data. This accounts for the fact that ordinal values with many observations between them are further apart in practical terms.

**Applicable metrics**: Krippendorff's Alpha (ordinal), weighted Cohen's Kappa (linear or quadratic weights). Fleiss' Kappa and Scott's Pi do not have standard ordinal extensions. `label-score` requires an explicit category ordering for ordinal data, provided via the `categories` option (e.g., `categories: ['poor', 'fair', 'good', 'excellent']`).

### Interval

**When to use**: Labels are numeric with meaningful, equal distances between values, but there is no true zero point. Example: temperature in Celsius (the difference between 10C and 20C is the same as between 20C and 30C, but 0C is not "no temperature").

**Distance function**: d(c, k) = (c - k)^2. Squared difference.

**Applicable metrics**: Krippendorff's Alpha (interval), weighted Cohen's Kappa with custom weights derived from the squared difference.

### Ratio

**When to use**: Labels are numeric with meaningful distances and a true zero point. The ratio between values is meaningful. Example: word count (0 means no words; 200 words is twice as many as 100 words), response time in milliseconds.

**Distance function**: d(c, k) = ((c - k) / (c + k))^2. Squared ratio difference. This function is undefined when c = k = 0; in that case, d(0, 0) = 0 (identical values).

**Applicable metrics**: Krippendorff's Alpha (ratio).

### Which Metrics Support Which Levels

| Metric | Nominal | Ordinal | Interval | Ratio |
|--------|---------|---------|----------|-------|
| Percentage agreement | Yes | Yes (treats as nominal) | No | No |
| Cohen's Kappa (unweighted) | Yes | Yes (treats as nominal) | No | No |
| Cohen's Kappa (weighted) | No | Yes | Yes (via custom weights) | No |
| Scott's Pi | Yes | No | No | No |
| Fleiss' Kappa | Yes | No | No | No |
| Krippendorff's Alpha | Yes | Yes | Yes | Yes |
| Gwet's AC1 | Yes | No | No | No |

---

## 8. Weighted Agreement

### Linear Weights

For ordinal data with K ordered categories (indexed 0 to K-1), linear weights define the disagreement penalty as proportional to the distance between category indices:

```
w_{ij} = |i - j| / (K - 1)
```

w = 0 for perfect agreement (i == j), w = 1 for maximum disagreement (i = 0 and j = K-1). All other disagreements are proportionally penalized.

### Quadratic Weights

Quadratic weights define the penalty as proportional to the squared distance:

```
w_{ij} = (i - j)^2 / (K - 1)^2
```

Quadratic weights penalize large disagreements much more heavily than small ones. Rating an item 1 when the other annotator rated it 5 (distance 4) is penalized 16 times as much as rating it 4 when the other rated it 5 (distance 1). Quadratic-weighted Cohen's Kappa is mathematically equivalent to the intraclass correlation coefficient (ICC), making it a standard choice for ordinal reliability studies.

### Custom Weight Matrix

The caller can provide an explicit weight matrix where w_{ij} specifies the disagreement penalty for each pair of categories. The matrix must be symmetric (w_{ij} = w_{ji}) and have zeros on the diagonal (w_{ii} = 0). This allows domain-specific weighting schemes where some disagreements are more serious than others.

```typescript
const weights = [
  [0, 0.5, 1.0],  // positive vs positive=0, positive vs neutral=0.5, positive vs negative=1.0
  [0.5, 0, 0.5],  // neutral vs positive=0.5, neutral vs neutral=0, neutral vs negative=0.5
  [1.0, 0.5, 0],  // negative vs positive=1.0, negative vs neutral=0.5, negative vs negative=0
];

const result = cohensKappa(annotatorA, annotatorB, { weights });
```

### Interaction with Metrics

Weighted agreement is primarily used with Cohen's Kappa. Fleiss' Kappa does not have a standard weighted variant. Krippendorff's Alpha handles ordinal data through its distance function (ordinal, interval, ratio levels) rather than through a separate weight matrix. Scott's Pi and Gwet's AC1 do not have weighted variants.

---

## 9. Confidence Intervals and Statistical Significance

### Bootstrap Confidence Intervals

For all metrics, `label-score` provides bootstrap confidence intervals. The bootstrap procedure:

1. From the original n items, sample n items with replacement (a bootstrap sample).
2. Compute the metric on the bootstrap sample.
3. Repeat B times (default B = 1000).
4. Sort the B metric values.
5. The confidence interval at level alpha is [percentile(alpha/2), percentile(1 - alpha/2)].

For example, a 95% confidence interval uses percentile(0.025) and percentile(0.975) from the sorted bootstrap values.

```typescript
const result = cohensKappa(annotatorA, annotatorB, {
  ci: 0.95,
  bootstrapIterations: 2000,
});

console.log(result.kappa);         // 0.72
console.log(result.ci);            // { lower: 0.65, upper: 0.79 }
console.log(result.standardError); // 0.035
```

Bootstrap resampling preserves the pairing structure: when resampling items, both annotators' labels for a given item are sampled together (paired bootstrap). This ensures the resampled data maintains the same annotator correspondence as the original.

### Standard Error Estimation

For Cohen's Kappa, the asymptotic standard error is computed analytically using the formula from Fleiss, Cohen, and Everitt (1969). For other metrics, the standard error is estimated from the bootstrap distribution as the standard deviation of the B bootstrap metric values.

### P-Value: Is Agreement Better Than Chance?

The null hypothesis is that the true agreement metric is zero (agreement is at chance level). The p-value is the proportion of bootstrap samples that produce a metric value less than or equal to zero. A small p-value (< 0.05) indicates that the observed agreement is statistically significantly better than chance.

```typescript
const result = cohensKappa(annotatorA, annotatorB, { ci: 0.95 });
console.log(result.pValue); // 0.001 (agreement is significantly better than chance)
```

### Confidence Interval Configuration

```typescript
interface CIOptions {
  /** Confidence level (0-1). Default: 0.95 for 95% CI. */
  ci?: number;

  /** Number of bootstrap iterations. Default: 1000. Higher values produce more precise CIs but take longer. */
  bootstrapIterations?: number;

  /** Random seed for reproducible bootstrap results. */
  seed?: number;
}
```

### Performance Implications

Bootstrap confidence intervals require computing the metric B times. For Cohen's Kappa on 1,000 items with B = 1,000, this takes approximately 50-100ms. For Krippendorff's Alpha with its more complex computation, B = 1,000 on 1,000 items takes approximately 200-500ms. The `bootstrapIterations` option allows callers to trade precision for speed: B = 200 gives a rough confidence interval quickly; B = 10,000 gives a precise one slowly.

---

## 10. API Surface

### Installation

```bash
npm install label-score
```

### No Runtime Dependencies

`label-score` has zero runtime dependencies. All statistical computations -- matrix operations, bootstrap resampling, distance functions, combinatorial counting -- are implemented using built-in JavaScript capabilities. This keeps the package lightweight, avoids supply chain risk, and ensures compatibility across Node.js versions 18+.

### Main Export: `cohensKappa`

Computes Cohen's Kappa for two annotators.

```typescript
import { cohensKappa } from 'label-score';

// Unweighted (categorical/nominal data)
const result = cohensKappa(
  ['pos', 'neg', 'pos', 'neu', 'pos', 'neg', 'pos', 'neg', 'neu', 'pos'],
  ['pos', 'neg', 'neu', 'neu', 'pos', 'neg', 'pos', 'pos', 'neu', 'pos'],
);
console.log(result.kappa);          // 0.68
console.log(result.interpretation); // 'substantial'
console.log(result.pObserved);      // 0.80
console.log(result.pExpected);      // 0.375

// Weighted (ordinal data)
const weighted = cohensKappa(
  [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
  [1, 2, 3, 3, 5, 2, 2, 3, 4, 4],
  { weights: 'quadratic' },
);
console.log(weighted.kappa);          // 0.89
console.log(weighted.interpretation); // 'almost-perfect'
```

**Signature**:

```typescript
function cohensKappa(
  annotatorA: Label[],
  annotatorB: Label[],
  options?: CohensKappaOptions,
): KappaResult;

interface CohensKappaOptions {
  /** Weight type for ordinal data. Default: 'unweighted'. */
  weights?: 'unweighted' | 'linear' | 'quadratic' | number[][];

  /** Confidence level for bootstrap CI. Omit to skip CI computation. */
  ci?: number;

  /** Number of bootstrap iterations. Default: 1000. */
  bootstrapIterations?: number;

  /** Random seed for reproducible bootstrap. */
  seed?: number;
}
```

### `fleissKappa`

Computes Fleiss' Kappa for N annotators.

```typescript
import { fleissKappa } from 'label-score';

// Category-count matrix: 5 items, 3 categories, 4 annotators per item
const result = fleissKappa([
  [4, 0, 0],  // all 4 agree: category 0
  [3, 1, 0],  // 3 say category 0, 1 says category 1
  [0, 0, 4],  // all 4 agree: category 2
  [1, 2, 1],  // split
  [0, 4, 0],  // all 4 agree: category 1
]);

console.log(result.kappa);          // 0.76
console.log(result.interpretation); // 'substantial'
console.log(result.perCategory);    // [{ category: 0, kappa: 0.82 }, { category: 1, kappa: 0.71 }, ...]

// From matrix format (auto-converted to category-count matrix)
const matrixResult = fleissKappa([
  ['A', 'A', 'A', 'A'],
  ['A', 'A', 'A', 'B'],
  ['C', 'C', 'C', 'C'],
  ['A', 'B', 'C', 'A'],
  ['B', 'B', 'B', 'B'],
], { format: 'matrix' });
```

**Signature**:

```typescript
function fleissKappa(
  data: number[][] | Label[][],
  options?: FleissKappaOptions,
): FleissKappaResult;

interface FleissKappaOptions {
  /** Data format: 'category-counts' or 'matrix'. Default: auto-detected. */
  format?: 'category-counts' | 'matrix';

  /** Category names for labeling per-category results. */
  categories?: string[];

  /** Confidence level for bootstrap CI. Omit to skip. */
  ci?: number;

  /** Number of bootstrap iterations. Default: 1000. */
  bootstrapIterations?: number;

  /** Random seed for reproducible bootstrap. */
  seed?: number;
}
```

### `krippendorffAlpha`

Computes Krippendorff's Alpha for any number of annotators and any measurement level.

```typescript
import { krippendorffAlpha } from 'label-score';

// Long format with missing data
const result = krippendorffAlpha([
  { item: 'i1', annotator: 'a1', label: 'pos' },
  { item: 'i1', annotator: 'a2', label: 'pos' },
  { item: 'i1', annotator: 'a3', label: 'neg' },
  { item: 'i2', annotator: 'a1', label: 'neg' },
  { item: 'i2', annotator: 'a2', label: 'neg' },
  // a3 did not rate i2
  { item: 'i3', annotator: 'a1', label: 'pos' },
  { item: 'i3', annotator: 'a3', label: 'pos' },
  // a2 did not rate i3
], { level: 'nominal' });

console.log(result.alpha);          // 0.691
console.log(result.interpretation); // 'tentative'
console.log(result.dObserved);      // 0.167
console.log(result.dExpected);      // 0.540

// Ordinal data
const ordinalResult = krippendorffAlpha([
  { item: 'i1', annotator: 'a1', label: 3 },
  { item: 'i1', annotator: 'a2', label: 4 },
  { item: 'i2', annotator: 'a1', label: 1 },
  { item: 'i2', annotator: 'a2', label: 1 },
  { item: 'i3', annotator: 'a1', label: 5 },
  { item: 'i3', annotator: 'a2', label: 4 },
], { level: 'ordinal' });

// Matrix format with missing data
const matrixResult = krippendorffAlpha([
  [1, 2, 3],
  [1, 2, null],
  [3, 3, 3],
  [null, 2, 2],
], { level: 'interval', format: 'matrix' });
```

**Signature**:

```typescript
function krippendorffAlpha(
  data: AnnotationTriple[] | (Label | null)[][],
  options?: KrippendorffOptions,
): AlphaResult;

interface KrippendorffOptions {
  /** Measurement level. Default: 'nominal'. */
  level?: MeasurementLevel;

  /** Data format. Default: auto-detected. */
  format?: 'long' | 'matrix';

  /** Confidence level for bootstrap CI. Omit to skip. */
  ci?: number;

  /** Number of bootstrap iterations. Default: 1000. */
  bootstrapIterations?: number;

  /** Random seed for reproducible bootstrap. */
  seed?: number;
}
```

### `scottsPi`

Computes Scott's Pi for two annotators.

```typescript
import { scottsPi } from 'label-score';

const result = scottsPi(
  ['pos', 'neg', 'pos', 'neu', 'pos'],
  ['pos', 'neg', 'neu', 'neu', 'pos'],
);

console.log(result.pi);             // 0.54
console.log(result.interpretation); // 'moderate'
```

**Signature**:

```typescript
function scottsPi(
  annotatorA: Label[],
  annotatorB: Label[],
  options?: ScottsPiOptions,
): PiResult;

interface ScottsPiOptions {
  ci?: number;
  bootstrapIterations?: number;
  seed?: number;
}
```

### `gwetsAC1`

Computes Gwet's AC1.

```typescript
import { gwetsAC1 } from 'label-score';

// Binary labels with high prevalence -- demonstrates AC1 advantage over Kappa
const annotatorA = Array(95).fill('yes').concat(Array(5).fill('no'));
const annotatorB = Array(93).fill('yes').concat(Array(7).fill('no'));

const kappaResult = cohensKappa(annotatorA, annotatorB);
const ac1Result = gwetsAC1(annotatorA, annotatorB);

console.log(kappaResult.kappa);  // 0.21 (misleadingly low due to prevalence paradox)
console.log(ac1Result.ac1);      // 0.88 (better reflects the high observed agreement)
```

**Signature**:

```typescript
function gwetsAC1(
  annotatorA: Label[],
  annotatorB: Label[],
  options?: AC1Options,
): AC1Result;

// Also works with N annotators via matrix/long format:
function gwetsAC1(
  data: AnnotationTriple[] | Label[][],
  options?: AC1Options,
): AC1Result;

interface AC1Options {
  format?: 'pairwise' | 'matrix' | 'long';
  ci?: number;
  bootstrapIterations?: number;
  seed?: number;
}
```

### `percentAgreement`

Computes simple percentage agreement.

```typescript
import { percentAgreement } from 'label-score';

// Pairwise
const pa = percentAgreement(
  ['pos', 'neg', 'pos', 'neu', 'pos'],
  ['pos', 'neg', 'neu', 'neu', 'pos'],
);
console.log(pa); // 0.80

// Matrix format (N annotators)
const paMatrix = percentAgreement([
  ['A', 'A', 'A'],
  ['A', 'B', 'A'],
  ['B', 'B', 'B'],
]);
console.log(paMatrix); // 0.778
```

**Signature**:

```typescript
function percentAgreement(
  dataOrAnnotatorA: Label[] | Label[][] | AnnotationTriple[],
  annotatorB?: Label[],
): number;
```

### `confusionMatrix`

Builds a confusion matrix for two annotators.

```typescript
import { confusionMatrix } from 'label-score';

const cm = confusionMatrix(
  ['pos', 'neg', 'pos', 'neu', 'pos', 'neg'],
  ['pos', 'neg', 'neu', 'neu', 'pos', 'pos'],
);

console.log(cm.labels);   // ['neg', 'neu', 'pos']
console.log(cm.matrix);
// [
//   [1, 0, 1],  // neg: 1 agreed neg, 0 neu, 1 called pos
//   [0, 1, 0],  // neu: 0 neg, 1 agreed neu, 0 pos
//   [0, 1, 2],  // pos: 0 neg, 1 called neu, 2 agreed pos
// ]
console.log(cm.total);    // 6
console.log(cm.agreement); // 4 (sum of diagonal)
```

**Signature**:

```typescript
function confusionMatrix(
  annotatorA: Label[],
  annotatorB: Label[],
): ConfusionMatrix;
```

### `agreement` (Comprehensive Report)

Computes all applicable metrics and returns a comprehensive agreement report.

```typescript
import { agreement } from 'label-score';

// Two annotators -- computes Cohen's Kappa, Scott's Pi, Gwet's AC1, percentage agreement
const report = agreement(
  ['pos', 'neg', 'pos', 'neu', 'pos'],
  ['pos', 'neg', 'neu', 'neu', 'pos'],
  { ci: 0.95 },
);

console.log(report.metrics.cohensKappa);     // { kappa: 0.54, interpretation: 'moderate', ... }
console.log(report.metrics.scottsPi);        // { pi: 0.53, interpretation: 'moderate', ... }
console.log(report.metrics.gwetsAC1);        // { ac1: 0.62, interpretation: 'substantial', ... }
console.log(report.metrics.percentAgreement); // 0.80
console.log(report.confusionMatrix);         // ConfusionMatrix object
console.log(report.recommendation);          // 'Use Cohen\'s Kappa as the primary metric...'

// N annotators -- computes Fleiss' Kappa, Krippendorff's Alpha, percentage agreement
const nReport = agreement([
  { item: 'i1', annotator: 'a1', label: 'pos' },
  { item: 'i1', annotator: 'a2', label: 'pos' },
  { item: 'i1', annotator: 'a3', label: 'neg' },
  // ...
], { level: 'nominal', ci: 0.95 });

console.log(nReport.metrics.fleissKappa);        // { kappa: 0.65, ... }
console.log(nReport.metrics.krippendorffAlpha);  // { alpha: 0.68, ... }
console.log(nReport.annotatorStats);             // per-annotator statistics
```

**Signature**:

```typescript
function agreement(
  dataOrAnnotatorA: Label[] | Label[][] | AnnotationTriple[],
  annotatorBOrOptions?: Label[] | AgreementOptions,
  options?: AgreementOptions,
): AgreementReport;

interface AgreementOptions {
  /** Measurement level. Default: 'nominal'. */
  level?: MeasurementLevel;

  /** Weight type for ordinal data. Default: 'unweighted'. */
  weights?: 'unweighted' | 'linear' | 'quadratic' | number[][];

  /** Data format. Default: auto-detected. */
  format?: 'pairwise' | 'matrix' | 'long' | 'category-counts';

  /** Confidence level. Omit to skip CI computation. */
  ci?: number;

  /** Number of bootstrap iterations. Default: 1000. */
  bootstrapIterations?: number;

  /** Random seed. */
  seed?: number;

  /** Which metrics to compute. Default: all applicable. */
  metrics?: MetricName[];

  /** How to handle missing data. Default: 'exclude'. */
  missingData?: 'exclude' | 'error';

  /** Ordered list of categories (required for ordinal data). */
  categories?: Label[];
}
```

### Type Definitions

```typescript
// ── Core Types ──────────────────────────────────────────────────────

/** A label value. Can be a string, number, or boolean. */
type Label = string | number | boolean;

/** Measurement level for annotation data. */
type MeasurementLevel = 'nominal' | 'ordinal' | 'interval' | 'ratio';

/** Metric name for selecting specific metrics. */
type MetricName =
  | 'cohens-kappa'
  | 'scotts-pi'
  | 'fleiss-kappa'
  | 'krippendorff-alpha'
  | 'gwets-ac1'
  | 'percent-agreement';

/** An annotation triple in long format. */
interface AnnotationTriple {
  /** Item identifier. */
  item: string | number;

  /** Annotator identifier. */
  annotator: string | number;

  /** The label assigned. */
  label: Label;
}

// ── Result Types ────────────────────────────────────────────────────

/** Interpretation label for agreement metrics. */
type Interpretation =
  | 'poor'
  | 'slight'
  | 'fair'
  | 'moderate'
  | 'substantial'
  | 'almost-perfect';

/** Interpretation label for Krippendorff's Alpha. */
type AlphaInterpretation =
  | 'unreliable'
  | 'tentative'
  | 'reliable';

/** Confidence interval. */
interface ConfidenceInterval {
  /** Lower bound of the confidence interval. */
  lower: number;

  /** Upper bound of the confidence interval. */
  upper: number;

  /** Confidence level (e.g., 0.95 for 95%). */
  level: number;
}

/** Result of Cohen's Kappa computation. */
interface KappaResult {
  /** Cohen's Kappa value. Range: [-1, 1]. */
  kappa: number;

  /** Human-readable interpretation (Landis & Koch scale). */
  interpretation: Interpretation;

  /** Observed proportion of agreement. */
  pObserved: number;

  /** Expected proportion of agreement by chance. */
  pExpected: number;

  /** Weight type used. */
  weights: 'unweighted' | 'linear' | 'quadratic' | 'custom';

  /** Asymptotic standard error, if computed. */
  standardError?: number;

  /** Bootstrap confidence interval, if computed. */
  ci?: ConfidenceInterval;

  /** P-value for H0: kappa = 0, if CI was computed. */
  pValue?: number;

  /** Number of items used in computation. */
  n: number;

  /** Number of distinct categories. */
  categories: number;
}

/** Result of Fleiss' Kappa computation. */
interface FleissKappaResult {
  /** Fleiss' Kappa value. */
  kappa: number;

  /** Human-readable interpretation. */
  interpretation: Interpretation;

  /** Mean observed agreement across items. */
  pObserved: number;

  /** Expected agreement by chance. */
  pExpected: number;

  /** Per-category Kappa values. */
  perCategory: Array<{
    category: Label;
    kappa: number;
    interpretation: Interpretation;
  }>;

  /** Standard error, if computed. */
  standardError?: number;

  /** Bootstrap confidence interval, if computed. */
  ci?: ConfidenceInterval;

  /** Number of items. */
  n: number;

  /** Number of annotators per item. */
  annotatorsPerItem: number;

  /** Number of categories. */
  categories: number;
}

/** Result of Krippendorff's Alpha computation. */
interface AlphaResult {
  /** Krippendorff's Alpha value. */
  alpha: number;

  /** Interpretation using Krippendorff's thresholds. */
  interpretation: AlphaInterpretation;

  /** Observed disagreement. */
  dObserved: number;

  /** Expected disagreement. */
  dExpected: number;

  /** Measurement level used. */
  level: MeasurementLevel;

  /** Standard error, if computed. */
  standardError?: number;

  /** Bootstrap confidence interval, if computed. */
  ci?: ConfidenceInterval;

  /** Number of items with at least 2 annotators. */
  n: number;

  /** Total number of annotators. */
  annotators: number;

  /** Number of distinct values. */
  values: number;
}

/** Result of Scott's Pi computation. */
interface PiResult {
  /** Scott's Pi value. */
  pi: number;

  /** Human-readable interpretation. */
  interpretation: Interpretation;

  /** Observed agreement. */
  pObserved: number;

  /** Expected agreement (pooled marginals). */
  pExpected: number;

  /** Standard error, if computed. */
  standardError?: number;

  /** Bootstrap confidence interval, if computed. */
  ci?: ConfidenceInterval;

  /** Number of items. */
  n: number;
}

/** Result of Gwet's AC1 computation. */
interface AC1Result {
  /** AC1 value. */
  ac1: number;

  /** Human-readable interpretation. */
  interpretation: Interpretation;

  /** Observed agreement. */
  pObserved: number;

  /** Expected agreement (AC1 formulation). */
  pExpected: number;

  /** Standard error, if computed. */
  standardError?: number;

  /** Bootstrap confidence interval, if computed. */
  ci?: ConfidenceInterval;

  /** Number of items. */
  n: number;
}

/** A confusion matrix for two annotators. */
interface ConfusionMatrix {
  /** Ordered list of label values (rows and columns). */
  labels: Label[];

  /** The matrix: matrix[i][j] = count of items labeled labels[i] by A and labels[j] by B. */
  matrix: number[][];

  /** Total number of items. */
  total: number;

  /** Count of items where annotators agreed (sum of diagonal). */
  agreement: number;

  /** Per-label counts for annotator A (row marginals). */
  marginalsA: number[];

  /** Per-label counts for annotator B (column marginals). */
  marginalsB: number[];
}

/** Comprehensive agreement report from agreement(). */
interface AgreementReport {
  /** All computed metrics. Only includes metrics applicable to the data. */
  metrics: {
    cohensKappa?: KappaResult;
    scottsPi?: PiResult;
    fleissKappa?: FleissKappaResult;
    krippendorffAlpha?: AlphaResult;
    gwetsAC1?: AC1Result;
    percentAgreement: number;
  };

  /** Confusion matrix (only for 2-annotator data). */
  confusionMatrix?: ConfusionMatrix;

  /** Per-annotator statistics (only for data with identifiable annotators). */
  annotatorStats?: Array<{
    annotator: string | number;
    itemsRated: number;
    labelDistribution: Record<string, number>;
  }>;

  /** Data summary. */
  summary: {
    items: number;
    annotators: number;
    categories: number;
    missingRate: number;
    measurementLevel: MeasurementLevel;
  };

  /** Recommendation text explaining which metric to trust and why. */
  recommendation: string;
}
```

---

## 11. Agreement Report

### What It Contains

The `AgreementReport` returned by `agreement()` is a comprehensive summary of annotation agreement. It contains:

1. **All applicable metrics**: For 2-annotator data: Cohen's Kappa, Scott's Pi, Gwet's AC1, and percentage agreement. For N-annotator data: Fleiss' Kappa, Krippendorff's Alpha, and percentage agreement. Each metric includes its value, interpretation, observed/expected agreement, and optional confidence interval.

2. **Confusion matrix**: For 2-annotator data, a full confusion matrix showing the label correspondence. This enables visual inspection of which categories are confused.

3. **Per-annotator statistics**: For each annotator: the number of items rated, the distribution of labels assigned, and the mean agreement with other annotators. This identifies annotators who deviate from the group (potential training issues or different interpretation of guidelines).

4. **Data summary**: The number of items, annotators, categories, and the missing data rate. This provides context for interpreting the metrics.

5. **Recommendation**: A text string explaining which metric to prioritize and why, based on the data characteristics. The recommendation logic:
   - If 2 annotators with categorical data and balanced prevalence: recommend Cohen's Kappa.
   - If 2 annotators with skewed prevalence (any category > 80%): recommend Gwet's AC1 alongside Kappa, noting the prevalence paradox.
   - If 2 annotators with ordinal data: recommend weighted Cohen's Kappa (quadratic).
   - If N annotators with complete data: recommend Fleiss' Kappa.
   - If N annotators with missing data: recommend Krippendorff's Alpha.
   - If ordinal/interval/ratio data with any number of annotators: recommend Krippendorff's Alpha with the appropriate measurement level.

### Per-Category Breakdown

For Fleiss' Kappa, the report includes per-category Kappa values. For the agreement report, all two-annotator metrics include a per-category breakdown derived from the confusion matrix:

- **Per-category agreement rate**: For each category k, the proportion of items labeled k by annotator A that were also labeled k by annotator B.
- **Per-category confusion**: The most common alternative label assigned when annotators disagree on this category.
- **Category prevalence**: The proportion of items assigned to this category (averaged across annotators).

This breakdown identifies problematic categories -- categories where agreement is low -- and informs annotation guideline revisions.

---

## 12. Configuration

### Measurement Level

The measurement level affects Krippendorff's Alpha (which distance function to use) and Cohen's Kappa (whether weights are applicable).

```typescript
// Nominal (default)
krippendorffAlpha(data, { level: 'nominal' });

// Ordinal (requires categories option for ordering)
krippendorffAlpha(data, { level: 'ordinal' });

// Interval
krippendorffAlpha(data, { level: 'interval' });

// Ratio
krippendorffAlpha(data, { level: 'ratio' });
```

### Weight Configuration

Weights apply to Cohen's Kappa for ordinal data.

```typescript
// Linear weights
cohensKappa(a, b, { weights: 'linear' });

// Quadratic weights
cohensKappa(a, b, { weights: 'quadratic' });

// Custom weight matrix
cohensKappa(a, b, { weights: [[0, 0.5, 1], [0.5, 0, 0.5], [1, 0.5, 0]] });
```

### Missing Data

```typescript
// Exclude items with missing data (default)
krippendorffAlpha(data, { missingData: 'exclude' });

// Throw an error if any data is missing
fleissKappa(data, { missingData: 'error' });
```

### Bootstrap Configuration

```typescript
// 95% CI with 2000 bootstrap iterations, seeded for reproducibility
cohensKappa(a, b, { ci: 0.95, bootstrapIterations: 2000, seed: 42 });
```

---

## 13. CLI Design

### Installation and Invocation

```bash
# Global install
npm install -g label-score
label-score --input annotations.csv --metric cohens-kappa

# npx (no install)
npx label-score --input annotations.csv

# Package script
# package.json: { "scripts": { "iaa": "label-score --input annotations.csv" } }
npm run iaa
```

### CLI Binary Name

`label-score`

### Commands and Flags

```
label-score [options]

Input:
  --input <file>           Input file path. Formats: .csv, .tsv, .json, .jsonl.
  --format <format>        Input format override. Values: csv, json, jsonl, matrix, long.
                           Default: auto-detected from file extension and content.
  --item-col <name>        Column name for item IDs (CSV/TSV). Default: 'item'.
  --annotator-col <name>   Column name for annotator IDs (CSV/TSV). Default: 'annotator'.
  --label-col <name>       Column name for labels (CSV/TSV). Default: 'label'.

Metric:
  --metric <metric>        Which metric to compute. Values: cohens-kappa, scotts-pi,
                           fleiss-kappa, krippendorff-alpha, gwets-ac1, percent-agreement, all.
                           Default: all (computes all applicable metrics).
  --level <level>          Measurement level. Values: nominal, ordinal, interval, ratio.
                           Default: nominal.
  --weights <type>         Weight type (for Cohen's Kappa). Values: unweighted, linear, quadratic.
                           Default: unweighted.
  --categories <list>      Comma-separated ordered category list (for ordinal data).

Confidence intervals:
  --ci <level>             Confidence level (0-1). Example: --ci 0.95. Omit to skip CI.
  --bootstrap <n>          Number of bootstrap iterations. Default: 1000.
  --seed <n>               Random seed for reproducible bootstrap.

Quality gate:
  --threshold <value>      Minimum acceptable metric value. Exit code 1 if below.
  --threshold-metric <m>   Which metric to check against threshold.
                           Default: first metric computed.

Output:
  --output <format>        Output format. Values: human, json. Default: human.
  --quiet                  Suppress all output except the exit code.
  --verbose                Show detailed breakdown including confusion matrix.

Meta:
  --version                Print version and exit.
  --help                   Print help and exit.
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success. If `--threshold` is set, the metric meets or exceeds the threshold. |
| `1` | Metric below threshold (when `--threshold` is set), or computation error. |
| `2` | Configuration error (invalid flags, missing input, malformed data). |

### Human-Readable Output Example

```
$ label-score --input annotations.csv --verbose

  label-score v0.1.0

  Data: 500 items, 3 annotators, 4 categories
  Missing rate: 5.2% (78 of 1500 possible annotations)
  Level: nominal

  Fleiss' Kappa:         0.72  substantial
  Krippendorff's Alpha:  0.71  reliable
  Percent Agreement:     0.81

  Per-category Kappa:
    positive   0.78  substantial
    negative   0.85  almost-perfect
    neutral    0.54  moderate
    mixed      0.41  moderate

  Confusion Matrix (annotators 1 vs 2):
              pos   neg   neu   mix
    pos        95     2    12     3
    neg         1    87     4     0
    neu         8     3    72     5
    mix         2     0     6    33

  Recommendation: Use Krippendorff's Alpha as the primary metric.
  The data has missing annotations (5.2%), and Alpha handles missing
  data natively. Fleiss' Kappa excludes items with missing data, which
  may bias the result.
```

### JSON Output Example

```bash
$ label-score --input annotations.csv --output json
```

Outputs the `AgreementReport` object as a JSON string to stdout.

### CSV Input Format (Long Format)

The default expected CSV format has three columns: `item`, `annotator`, `label`.

```csv
item,annotator,label
doc1,alice,positive
doc1,bob,positive
doc1,carol,neutral
doc2,alice,negative
doc2,bob,negative
doc3,alice,positive
doc3,carol,positive
```

Column names can be customized with `--item-col`, `--annotator-col`, and `--label-col`.

### CSV Input Format (Matrix Format)

If the CSV has items as rows and annotators as columns (no `item`/`annotator`/`label` headers), specify `--format matrix`:

```csv
alice,bob,carol
positive,positive,neutral
negative,negative,
positive,,positive
```

Empty cells represent missing data.

### Environment Variables

| Environment Variable | Equivalent Flag |
|---------------------|-----------------|
| `LABEL_SCORE_INPUT` | `--input` |
| `LABEL_SCORE_METRIC` | `--metric` |
| `LABEL_SCORE_LEVEL` | `--level` |
| `LABEL_SCORE_THRESHOLD` | `--threshold` |
| `LABEL_SCORE_FORMAT` | `--output` |

---

## 14. Integration with the npm-master Ecosystem

### eval-dataset

`eval-dataset` manages collections of evaluation test cases, which often have labels assigned by multiple annotators (human reviewers or LLM judges). Before finalizing a dataset, `label-score` computes agreement metrics on the annotation data to validate label quality. Workflow: load dataset with `eval-dataset`, extract the annotation data (expected outputs from multiple reviewers), pass it to `label-score`'s `agreement()`, check that agreement meets a threshold, then export the validated dataset.

```typescript
import { loadDataset } from 'eval-dataset';
import { agreement } from 'label-score';

const dataset = await loadDataset('qa-eval', { version: '^2.0.0' });
const annotations = dataset.testCases.flatMap(tc =>
  tc.metadata.reviewerLabels.map(rl => ({
    item: tc.id,
    annotator: rl.reviewer,
    label: rl.quality,
  }))
);

const report = agreement(annotations, { level: 'ordinal', ci: 0.95 });
if (report.metrics.krippendorffAlpha.alpha < 0.67) {
  console.warn('Annotation quality is unreliable. Review labels before using dataset.');
}
```

### synthdata-gen

`synthdata-gen` generates synthetic training data. When synthetic labels are generated by multiple LLMs (or by the same LLM with different prompts/temperatures), `label-score` measures how consistent the generated labels are. Low agreement across synthetic labeling strategies suggests the task definition is ambiguous or the LLM is sensitive to prompt variations.

### llm-eval-lite / rag-eval-node-ts

These packages evaluate LLM and RAG system outputs using automated judges. When using multiple judges (multiple LLMs or multiple evaluation rubrics), `label-score` quantifies judge consistency. This is essential for trusting evaluation results -- if two judges disagree frequently, the evaluation scores are unreliable. `label-score` provides the reliability metric.

### output-grade

`output-grade` produces quality scores for LLM output. When multiple grading configurations or models produce scores for the same outputs, `label-score` can measure the consistency of those scores. For continuous scores, discretize into bins (e.g., 0-0.3 = poor, 0.3-0.7 = fair, 0.7-1.0 = good) and compute agreement on the binned labels, or use Krippendorff's Alpha with the interval measurement level on the raw scores.

---

## 15. Testing Strategy

### Verification Against Python Reference Implementations

All metrics are verified against Python sklearn, nltk, and the `krippendorff` package. The test suite includes test cases where the expected values are computed in Python and hardcoded in the JavaScript tests:

```python
# Python reference computation (not part of label-score; used to generate test fixtures)
from sklearn.metrics import cohen_kappa_score
kappa = cohen_kappa_score([0, 1, 2, 0, 1], [0, 1, 1, 0, 2])
# kappa = 0.4489795918367347
```

```typescript
// JavaScript test verifies match
test('Cohen\'s Kappa matches sklearn', () => {
  const result = cohensKappa([0, 1, 2, 0, 1], [0, 1, 1, 0, 2]);
  expect(result.kappa).toBeCloseTo(0.4489795918367347, 10);
});
```

This pattern is applied to every metric with multiple test cases per metric, including edge cases, weighted variants, and different measurement levels.

### Unit Tests

- **Cohen's Kappa**: Perfect agreement, no agreement, partial agreement, 2 categories, 5+ categories, weighted (linear, quadratic, custom), single-category edge case (undefined kappa).
- **Fleiss' Kappa**: All agree, no agreement, partial agreement, 3 annotators, 10 annotators, per-category kappa computation. Verified against the original Fleiss (1971) paper's example data.
- **Krippendorff's Alpha**: Nominal, ordinal, interval, ratio levels. Missing data with varying patterns. Verified against Krippendorff's own published example (the canonical "four annotators, twelve items" example from Krippendorff 2011).
- **Scott's Pi**: Comparison with Cohen's Kappa on the same data (they should be close when annotators have similar marginals and diverge when they do not).
- **Gwet's AC1**: High-prevalence scenarios where Kappa is misleadingly low but AC1 correctly reflects high agreement.
- **Percentage agreement**: Trivial cases, edge cases (0 items, 1 item).
- **Confusion matrix**: Correct cell counts, marginals, diagonal sum.
- **Agreement report**: Correct metric selection based on data characteristics (2 vs N annotators, complete vs missing data).

### Input Format Tests

- Pairwise format: correct parsing, error on unequal lengths.
- Matrix format: correct parsing, null handling, auto-detection.
- Long format: correct grouping by item, missing data handling, duplicate detection (same item+annotator twice).
- Category-count matrix: correct parsing, validation that rows sum to the same value.
- Auto-detection: verify that each format is correctly identified.

### Confidence Interval Tests

- Seeded bootstrap produces identical results across runs.
- CI width decreases with more data (larger n) and more bootstrap iterations.
- CI contains the true value on a known distribution (statistical test with a tolerance for false negative rate).

### Edge Case Tests

- Empty input: every metric returns NaN or throws, depending on the function.
- Single item: metrics return NaN with a warning.
- Single category: metrics that divide by (1 - p_e) return NaN when p_e = 1.
- All missing data: appropriate error.
- Negative kappa (agreement worse than chance): correctly computed and reported.

### Test Framework

Tests use Vitest, matching the project's existing `package.json` configuration (`vitest run`).

---

## 16. Performance

### Computational Complexity

| Metric | Time Complexity | Space Complexity |
|--------|----------------|-----------------|
| Percentage agreement | O(n) | O(1) |
| Cohen's Kappa | O(n) | O(K^2) for confusion matrix |
| Scott's Pi | O(n) | O(K) |
| Fleiss' Kappa | O(n * K) | O(n * K) for category-count matrix |
| Krippendorff's Alpha | O(n * m^2) where m = avg annotators per item | O(V^2) for coincidence matrix (V = distinct values) |
| Gwet's AC1 | O(n) | O(K) |
| Confusion matrix | O(n) | O(K^2) |
| Bootstrap CI | O(B * T) where B = iterations, T = time for one metric computation | O(B) for storing metric values |

### Benchmarks

Target performance on a modern laptop (M1/M2 MacBook):

| Scenario | Expected Time |
|----------|--------------|
| Cohen's Kappa, 1,000 items | < 1ms |
| Cohen's Kappa, 100,000 items | < 10ms |
| Fleiss' Kappa, 1,000 items, 5 annotators, 10 categories | < 2ms |
| Krippendorff's Alpha, 1,000 items, 3 annotators, nominal | < 5ms |
| Krippendorff's Alpha, 1,000 items, 3 annotators, ordinal | < 10ms |
| Bootstrap CI (B=1000), Cohen's Kappa, 1,000 items | < 100ms |
| Bootstrap CI (B=1000), Krippendorff's Alpha, 1,000 items | < 500ms |
| Full agreement report, 1,000 items, 3 annotators, with CI | < 1s |

### Memory

All metrics operate on the input data in-place or with small intermediate structures (confusion matrix, coincidence matrix). Memory usage is dominated by the input data itself. For 100,000 items with 10 annotators, the input data is approximately 8MB; intermediate structures add at most 1MB. Bootstrap resampling does not create copies of the data -- it creates index arrays that reference the original data.

### Streaming

`label-score` does not support streaming input. All data must fit in memory. For datasets that do not fit in memory (millions of items), sample a representative subset and compute agreement on the sample. This is standard practice -- agreement metrics on a random sample of 5,000 items from a 5,000,000-item dataset are statistically valid.

---

## 17. Dependencies

### Runtime Dependencies

None. `label-score` has zero runtime dependencies. All computations -- matrix arithmetic, combinatorics, bootstrap resampling, pseudo-random number generation, CSV parsing -- are implemented using built-in JavaScript/Node.js capabilities.

The seeded PRNG for bootstrap reproducibility uses a simple linear congruential generator (LCG) implemented in approximately 10 lines of code. Full-featured PRNG libraries are unnecessary because the only requirement is reproducible uniform random numbers for resampling indices.

CSV parsing for the CLI uses a lightweight parser implemented within the package. The CSV inputs expected by `label-score` are simple (3 columns, no complex quoting requirements), so a full CSV parsing library is not warranted.

### Dev Dependencies

| Dependency | Purpose |
|-----------|---------|
| `typescript` | TypeScript compiler. |
| `vitest` | Test runner. |
| `eslint` | Linter. |

---

## 18. File Structure

```
label-score/
├── package.json
├── tsconfig.json
├── SPEC.md
├── README.md
├── src/
│   ├── index.ts                  # Public API exports
│   ├── types.ts                  # All TypeScript type definitions
│   ├── metrics/
│   │   ├── cohens-kappa.ts       # Cohen's Kappa implementation
│   │   ├── scotts-pi.ts          # Scott's Pi implementation
│   │   ├── fleiss-kappa.ts       # Fleiss' Kappa implementation
│   │   ├── krippendorff-alpha.ts # Krippendorff's Alpha implementation
│   │   ├── gwets-ac1.ts          # Gwet's AC1 implementation
│   │   └── percent-agreement.ts  # Percentage agreement implementation
│   ├── confusion-matrix.ts       # Confusion matrix construction
│   ├── agreement.ts              # Comprehensive agreement report
│   ├── distance.ts               # Distance functions per measurement level
│   ├── weights.ts                # Weight matrix construction (linear, quadratic, custom)
│   ├── bootstrap.ts              # Bootstrap CI and standard error estimation
│   ├── format.ts                 # Input format detection and conversion
│   ├── interpret.ts              # Interpretation scale logic (Landis & Koch, Krippendorff)
│   ├── validate.ts               # Input validation (array lengths, missing data checks)
│   ├── prng.ts                   # Seeded pseudo-random number generator
│   └── cli.ts                    # CLI entry point: argument parsing, file reading, output
├── tests/
│   ├── cohens-kappa.test.ts
│   ├── scotts-pi.test.ts
│   ├── fleiss-kappa.test.ts
│   ├── krippendorff-alpha.test.ts
│   ├── gwets-ac1.test.ts
│   ├── percent-agreement.test.ts
│   ├── confusion-matrix.test.ts
│   ├── agreement.test.ts
│   ├── distance.test.ts
│   ├── weights.test.ts
│   ├── bootstrap.test.ts
│   ├── format.test.ts
│   ├── cli.test.ts
│   └── fixtures/
│       ├── sklearn-reference.json   # Test values computed with sklearn
│       ├── nltk-reference.json      # Test values computed with nltk
│       ├── krippendorff-book.json   # Krippendorff's canonical example
│       └── fleiss-paper.json        # Fleiss's 1971 paper example
└── dist/                            # Compiled output (generated by tsc)
```

---

## 19. Implementation Roadmap

### Phase 1: Core Metrics (v0.1.0)

1. Type definitions (`types.ts`).
2. Input validation (`validate.ts`).
3. Input format detection and conversion (`format.ts`).
4. Confusion matrix (`confusion-matrix.ts`).
5. Cohen's Kappa -- unweighted (`metrics/cohens-kappa.ts`).
6. Scott's Pi (`metrics/scotts-pi.ts`).
7. Percentage agreement (`metrics/percent-agreement.ts`).
8. Interpretation scale logic (`interpret.ts`).
9. Tests for all Phase 1 components, verified against sklearn.

### Phase 2: Extended Metrics (v0.2.0)

1. Distance functions for all measurement levels (`distance.ts`).
2. Weight matrix construction (`weights.ts`).
3. Cohen's Kappa -- weighted (linear, quadratic, custom).
4. Fleiss' Kappa (`metrics/fleiss-kappa.ts`).
5. Krippendorff's Alpha (`metrics/krippendorff-alpha.ts`) -- nominal, ordinal, interval, ratio.
6. Gwet's AC1 (`metrics/gwets-ac1.ts`).
7. Tests for all Phase 2 components, verified against nltk and the krippendorff package.

### Phase 3: Statistics and Reporting (v0.3.0)

1. Seeded PRNG (`prng.ts`).
2. Bootstrap confidence intervals and standard error (`bootstrap.ts`).
3. Comprehensive agreement report (`agreement.ts`).
4. Per-category breakdown.
5. Per-annotator statistics.
6. Recommendation logic.
7. Tests for CI accuracy, reproducibility, and report correctness.

### Phase 4: CLI (v0.4.0)

1. CLI argument parsing (`cli.ts`).
2. CSV/JSON/JSONL file reading.
3. Human-readable output formatting.
4. JSON output.
5. Threshold-based exit codes.
6. Environment variable support.
7. CLI integration tests.

### Phase 5: Polish and Release (v1.0.0)

1. README with usage examples.
2. Performance benchmarking and optimization.
3. Edge case hardening (large datasets, extreme distributions, adversarial inputs).
4. API stabilization -- no breaking changes after v1.0.0.

---

## 20. Example Use Cases

### 20.1 LLM-as-Judge Consistency Check

Two LLMs (GPT-4 and Claude) rate 500 customer support responses on a 1-5 quality scale. Before trusting either model as a judge, measure their consistency.

```typescript
import { cohensKappa, agreement } from 'label-score';

// Ratings from two LLM judges
const gpt4Ratings  = [4, 5, 3, 2, 5, 4, 3, 1, 5, 4, /* ...500 items */];
const claudeRatings = [4, 4, 3, 2, 5, 5, 3, 1, 5, 4, /* ...500 items */];

// Quadratic-weighted Kappa for ordinal data
const result = cohensKappa(gpt4Ratings, claudeRatings, {
  weights: 'quadratic',
  ci: 0.95,
});

console.log(`Weighted Kappa: ${result.kappa.toFixed(3)} (${result.interpretation})`);
console.log(`95% CI: [${result.ci.lower.toFixed(3)}, ${result.ci.upper.toFixed(3)}]`);
// Weighted Kappa: 0.823 (almost-perfect)
// 95% CI: [0.791, 0.855]
```

### 20.2 Human Annotation Quality Validation

Five annotators label 200 social media posts for sentiment (positive, negative, neutral). Validate annotation quality before using labels for training.

```typescript
import { agreement } from 'label-score';

// Annotations loaded from CSV
const annotations = loadAnnotationsFromCSV('sentiment-labels.csv');

const report = agreement(annotations, {
  level: 'nominal',
  ci: 0.95,
});

console.log(`Fleiss' Kappa: ${report.metrics.fleissKappa.kappa.toFixed(3)}`);
console.log(`Krippendorff's Alpha: ${report.metrics.krippendorffAlpha.alpha.toFixed(3)}`);

// Per-category breakdown
for (const cat of report.metrics.fleissKappa.perCategory) {
  console.log(`  ${cat.category}: kappa = ${cat.kappa.toFixed(3)} (${cat.interpretation})`);
}

// Output:
// Fleiss' Kappa: 0.65 (substantial)
// Krippendorff's Alpha: 0.64 (tentative)
//   positive: kappa = 0.78 (substantial)
//   negative: kappa = 0.82 (almost-perfect)
//   neutral:  kappa = 0.35 (fair)   <-- annotators struggle with "neutral"
```

### 20.3 Comparing Annotation Guidelines

Test whether a revised annotation guideline improves agreement. Run the same annotators on the same data with both the old and new guidelines.

```typescript
import { cohensKappa, fleissKappa } from 'label-score';

const oldGuidelines = loadAnnotations('annotations-v1.csv');
const newGuidelines = loadAnnotations('annotations-v2.csv');

const oldReport = fleissKappa(oldGuidelines);
const newReport = fleissKappa(newGuidelines);

console.log(`Old guidelines: Fleiss' Kappa = ${oldReport.kappa.toFixed(3)}`);
console.log(`New guidelines: Fleiss' Kappa = ${newReport.kappa.toFixed(3)}`);
// Old guidelines: Fleiss' Kappa = 0.52
// New guidelines: Fleiss' Kappa = 0.71
// The revised guidelines improved agreement from moderate to substantial.
```

### 20.4 Multi-Annotator Labeling with Missing Data

A labeling project where each item is rated by 2-4 out of 6 possible annotators (different annotators have different availability). Krippendorff's Alpha handles this naturally.

```typescript
import { krippendorffAlpha } from 'label-score';

const annotations = [
  { item: 'item-001', annotator: 'ann-A', label: 'spam' },
  { item: 'item-001', annotator: 'ann-B', label: 'spam' },
  { item: 'item-001', annotator: 'ann-C', label: 'ham' },
  { item: 'item-002', annotator: 'ann-A', label: 'ham' },
  { item: 'item-002', annotator: 'ann-D', label: 'ham' },
  // ann-B, ann-C, ann-E, ann-F did not rate item-002
  { item: 'item-003', annotator: 'ann-B', label: 'spam' },
  { item: 'item-003', annotator: 'ann-E', label: 'spam' },
  { item: 'item-003', annotator: 'ann-F', label: 'spam' },
  { item: 'item-003', annotator: 'ann-A', label: 'spam' },
  // ...hundreds more items
];

const result = krippendorffAlpha(annotations, {
  level: 'nominal',
  ci: 0.95,
});

console.log(`Alpha: ${result.alpha.toFixed(3)} (${result.interpretation})`);
console.log(`Items: ${result.n}, Annotators: ${result.annotators}`);
console.log(`95% CI: [${result.ci.lower.toFixed(3)}, ${result.ci.upper.toFixed(3)}]`);
```

### 20.5 CI/CD Quality Gate

A CI pipeline checks that annotation agreement meets a minimum threshold before merging new labels.

```yaml
# GitHub Actions workflow
- name: Check annotation quality
  run: |
    npx label-score \
      --input data/annotations.csv \
      --metric krippendorff-alpha \
      --level nominal \
      --threshold 0.67 \
      --quiet
```

Exit code 0 if Alpha >= 0.67, exit code 1 otherwise. The pipeline fails if annotation quality is unreliable.

### 20.6 Prevalence Paradox Diagnosis

Binary labeling with high prevalence of one category. Cohen's Kappa is misleadingly low. Gwet's AC1 provides a more reasonable measure.

```typescript
import { cohensKappa, gwetsAC1, agreement } from 'label-score';

// 95% of items are "benign", 5% are "malicious"
const annotatorA = Array(190).fill('benign').concat(Array(10).fill('malicious'));
const annotatorB = Array(188).fill('benign').concat(Array(12).fill('malicious'));

const report = agreement(annotatorA, annotatorB);

console.log(`Percent agreement: ${report.metrics.percentAgreement.toFixed(3)}`);
console.log(`Cohen's Kappa: ${report.metrics.cohensKappa.kappa.toFixed(3)} (${report.metrics.cohensKappa.interpretation})`);
console.log(`Gwet's AC1: ${report.metrics.gwetsAC1.ac1.toFixed(3)} (${report.metrics.gwetsAC1.interpretation})`);
console.log(report.recommendation);
// Percent agreement: 0.940
// Cohen's Kappa: 0.38 (fair)       <-- misleadingly low!
// Gwet's AC1: 0.92 (almost-perfect) <-- better reflects reality
// Recommendation: The label distribution is highly skewed (benign: 95%).
// Cohen's Kappa is affected by the prevalence paradox. Consider Gwet's AC1
// as the primary metric for this data.
```
