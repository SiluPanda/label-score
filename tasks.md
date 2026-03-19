# label-score — Task Breakdown

## Phase 1: Project Scaffolding and Core Types

- [ ] **Install dev dependencies** — Add `typescript`, `vitest`, and `eslint` as devDependencies in `package.json`. Ensure `vitest run`, `eslint src/`, and `tsc` all execute without errors on the empty project. | Status: not_done

- [ ] **Add CLI bin entry to package.json** — Add a `"bin": { "label-score": "dist/cli.js" }` field to `package.json` so the CLI is available after global install or via npx. | Status: not_done

- [ ] **Create `src/types.ts` — Core type definitions** — Define all public TypeScript types from the spec: `Label`, `MeasurementLevel`, `MetricName`, `AnnotationTriple`, `Interpretation`, `AlphaInterpretation`, `ConfidenceInterval`, `KappaResult`, `FleissKappaResult`, `AlphaResult`, `PiResult`, `AC1Result`, `ConfusionMatrix`, `AgreementReport`, and all options interfaces (`CohensKappaOptions`, `FleissKappaOptions`, `KrippendorffOptions`, `ScottsPiOptions`, `AC1Options`, `AgreementOptions`, `CIOptions`). Export all types from `src/index.ts`. | Status: not_done

- [ ] **Create `src/interpret.ts` — Interpretation scale logic** — Implement the Landis & Koch interpretation scale (poor/slight/fair/moderate/substantial/almost-perfect) for Kappa-family metrics and the Krippendorff thresholds (unreliable/tentative/reliable) for Alpha. Export functions `interpretKappa(value: number): Interpretation` and `interpretAlpha(value: number): AlphaInterpretation`. | Status: not_done

- [ ] **Create `src/validate.ts` — Input validation utilities** — Implement validation functions: check that two arrays have equal length, check that arrays are non-empty, check that a matrix has consistent row lengths, check that category-count matrix rows sum to the same value, check that annotators-per-item >= 2, detect and report duplicate item+annotator pairs in long format. Each validation failure should throw a descriptive error message. | Status: not_done

- [ ] **Create `src/format.ts` — Input format detection and conversion** — Implement auto-detection logic: (1) two arrays of primitives -> pairwise, (2) array of objects with `item`/`annotator`/`label` -> long format, (3) 2D array of primitives/null -> matrix, (4) 2D array of non-negative integers with constant row sums -> category-count matrix. Implement converters: long-to-matrix, matrix-to-long, matrix-to-category-count-matrix, long-to-category-count-matrix. Handle the `missingData` option (`'exclude'` or `'error'`; default `'exclude'`). Log warnings with counts of excluded items when filtering. | Status: not_done

- [ ] **Create `src/prng.ts` — Seeded pseudo-random number generator** — Implement a linear congruential generator (LCG) that accepts a numeric seed and produces reproducible uniform random numbers in [0, 1). Provide a function to generate a random integer in a range (for bootstrap resampling indices). Keep implementation minimal (~10 lines as spec suggests). | Status: not_done

- [ ] **Update `src/index.ts` — Public API barrel export** — Set up `src/index.ts` to re-export all public functions (`cohensKappa`, `scottsPi`, `fleissKappa`, `krippendorffAlpha`, `gwetsAC1`, `percentAgreement`, `confusionMatrix`, `agreement`) and all public types. Initially export stubs; replace with real implementations as they are built. | Status: not_done

## Phase 2: Confusion Matrix and Percentage Agreement

- [ ] **Create `src/confusion-matrix.ts` — Confusion matrix construction** — Implement `confusionMatrix(annotatorA, annotatorB): ConfusionMatrix`. Build the matrix from two parallel label arrays. Compute: sorted label list, matrix cells (counts), total items, agreement count (diagonal sum), row marginals (annotator A), column marginals (annotator B). Validate inputs (equal length, non-empty). | Status: not_done

- [ ] **Create `src/metrics/percent-agreement.ts` — Percentage agreement** — Implement `percentAgreement(dataOrAnnotatorA, annotatorB?)`. Support pairwise format (two arrays), matrix format (2D array, N annotators), and long format (annotation triples). For 2 annotators: fraction of items where labels match. For N annotators: mean per-item agreement using the formula `PA_item = (1/(r*(r-1))) * sum_k(n_ik * (n_ik - 1))`. Handle edge cases: all identical labels (return 1.0), zero items (return NaN with warning), one item (return 0 or 1). | Status: not_done

- [ ] **Write tests for confusion matrix** — Test correct cell counts, marginals, diagonal sum, sorted label order. Test with 2 categories, 5+ categories, string labels, numeric labels, boolean labels. Test error on unequal array lengths and empty input. | Status: not_done

- [ ] **Write tests for percentage agreement** — Test pairwise format, matrix format (N annotators), long format. Test all-agree case (1.0), no-agree case (0.0), partial agreement. Test edge cases: zero items (NaN), one item, single category. | Status: not_done

## Phase 3: Cohen's Kappa

- [ ] **Create `src/metrics/cohens-kappa.ts` — Unweighted Cohen's Kappa** — Implement the core unweighted Cohen's Kappa computation: build confusion matrix, compute p_o (observed agreement from diagonal), compute p_e (expected agreement from individual marginals), compute kappa = (p_o - p_e) / (1 - p_e). Return a `KappaResult` with kappa, interpretation, pObserved, pExpected, weights='unweighted', n, categories count. Handle edge cases: p_e = 1.0 (return NaN with warning about prevalence paradox, recommend Gwet's AC1), empty input (NaN), unequal array lengths (throw error). | Status: not_done

- [ ] **Create `src/weights.ts` — Weight matrix construction** — Implement functions to build weight matrices: `linearWeights(K)` produces w_ij = |i-j|/(K-1), `quadraticWeights(K)` produces w_ij = (i-j)^2/(K-1)^2, and validation for custom weight matrices (must be symmetric, zeros on diagonal). | Status: not_done

- [ ] **Add weighted Cohen's Kappa support** — Extend `cohens-kappa.ts` to support linear, quadratic, and custom weight matrices. Implement the weighted kappa formula: `kappa_w = 1 - (sum w_ij * o_ij) / (sum w_ij * e_ij)`. Accept `weights` option as `'unweighted' | 'linear' | 'quadratic' | number[][]`. | Status: not_done

- [ ] **Add asymptotic standard error for Cohen's Kappa** — Implement the exact standard error formula from Fleiss, Cohen, and Everitt (1969), using diagonal and off-diagonal elements of the confusion matrix. Include SE in the `KappaResult` when computed. | Status: not_done

- [ ] **Write tests for Cohen's Kappa — unweighted** — Test perfect agreement (kappa=1.0), chance agreement (kappa=0.0), partial agreement, negative kappa (worse than chance). Test with 2 categories, 5+ categories. Verify against sklearn `cohen_kappa_score` reference values (hardcoded expected values from Python). Test edge cases: p_e=1.0 (single category, NaN), empty input, unequal lengths. | Status: not_done

- [ ] **Write tests for Cohen's Kappa — weighted** — Test linear-weighted and quadratic-weighted kappa on ordinal data (e.g., 1-5 ratings). Verify against sklearn `cohen_kappa_score(weights='linear')` and `cohen_kappa_score(weights='quadratic')` reference values. Test custom weight matrix. Test that quadratic-weighted kappa penalizes large disagreements more than linear. | Status: not_done

- [ ] **Write tests for weight matrix construction** — Test linear weights: correct values for K=2,3,5. Test quadratic weights: correct values for K=2,3,5. Test custom weight validation: reject non-symmetric, reject non-zero diagonal. | Status: not_done

## Phase 4: Scott's Pi

- [ ] **Create `src/metrics/scotts-pi.ts` — Scott's Pi** — Implement Scott's Pi: compute p_o (same as Cohen's), compute p_e using pooled marginals (`p_e = sum_k(((p_k_A + p_k_B)/2)^2)`), compute pi = (p_o - p_e) / (1 - p_e). Return `PiResult` with pi, interpretation, pObserved, pExpected, n. Handle edge cases same as Cohen's Kappa (p_e=1.0 -> NaN, empty input, unequal lengths). | Status: not_done

- [ ] **Write tests for Scott's Pi** — Test perfect agreement, no agreement, partial agreement. Compare with Cohen's Kappa on same data: verify they are close when annotators have similar marginals and diverge when marginals differ. Verify against reference values. Test edge cases: single category (NaN), empty input. | Status: not_done

## Phase 5: Fleiss' Kappa

- [ ] **Create `src/metrics/fleiss-kappa.ts` — Fleiss' Kappa** — Implement Fleiss' Kappa: accept category-count matrix or raw matrix (convert internally). Compute per-item agreement P_i, overall P_bar, per-category proportions p_k, expected agreement P_e_bar, and kappa = (P_bar - P_e_bar) / (1 - P_e_bar). Compute per-category kappa_k values. Return `FleissKappaResult` with kappa, interpretation, pObserved, pExpected, perCategory array, n, annotatorsPerItem, categories count. Handle edge cases: P_e_bar = 1 (NaN), r=1 (throw error), variable r across items (throw error recommending Krippendorff's Alpha). Support format option (`'category-counts'` or `'matrix'`; auto-detect by default). | Status: not_done

- [ ] **Write tests for Fleiss' Kappa** — Test all-agree (kappa=1.0), no agreement, partial agreement. Test with 3 annotators, 10 annotators. Verify per-category kappa computation. Verify against Fleiss's original 1971 paper example data (use fixture file). Test with category-count matrix input and matrix format input. Test error on variable r, error on r=1. Test edge case: all labels in one category (NaN). | Status: not_done

## Phase 6: Krippendorff's Alpha

- [ ] **Create `src/distance.ts` — Distance functions per measurement level** — Implement four distance functions: (1) nominal: 0 if same, 1 if different; (2) ordinal: based on cumulative frequency ranks `d(c,k) = (sum n_g for g in [c,k] - (n_c+n_k)/2)^2`; (3) interval: `(c-k)^2`; (4) ratio: `((c-k)/(c+k))^2` with d(0,0)=0. Each function takes two label values and (for ordinal) the frequency distribution. Export a dispatcher that selects the right distance function given a `MeasurementLevel`. | Status: not_done

- [ ] **Create `src/metrics/krippendorff-alpha.ts` — Krippendorff's Alpha** — Implement using the coincidence matrix formulation: (1) build coincidence matrix from annotation data (for each item with m_i >= 2, each pair contributes 1/(m_i-1)), (2) compute marginal frequencies n_c, (3) compute observed disagreement D_o, (4) compute expected disagreement D_e, (5) compute alpha = 1 - D_o/D_e. Accept long format (annotation triples) or matrix format with null for missing. Support all four measurement levels via the distance functions. Return `AlphaResult` with alpha, interpretation (Krippendorff scale), dObserved, dExpected, level, n, annotators count, distinct values count. Handle edge cases: all identical labels (alpha=1.0), all items single-rater (NaN), D_e=0 (NaN), small sample warning (<5 items). | Status: not_done

- [ ] **Write tests for distance functions** — Test nominal: same=0, different=1. Test ordinal: verify against known examples with frequency distributions. Test interval: verify squared difference. Test ratio: verify squared ratio difference, d(0,0)=0. | Status: not_done

- [ ] **Write tests for Krippendorff's Alpha — nominal** — Test perfect agreement (alpha=1.0), no agreement, partial agreement with missing data. Verify against Krippendorff's canonical "four annotators, twelve items" example from Krippendorff 2011 (use fixture file). Test long format and matrix format inputs. Test edge cases: all single-rater items (NaN), D_e=0 (NaN), small sample warning. | Status: not_done

- [ ] **Write tests for Krippendorff's Alpha — ordinal** — Test ordinal distance computation integrated into alpha. Verify against Python `krippendorff` package reference values. Test with explicit category ordering. | Status: not_done

- [ ] **Write tests for Krippendorff's Alpha — interval and ratio** — Test interval level with numeric labels, verify against reference values. Test ratio level, verify d(0,0)=0 edge case. Verify against Python reference implementations. | Status: not_done

## Phase 7: Gwet's AC1

- [ ] **Create `src/metrics/gwets-ac1.ts` — Gwet's AC1** — Implement AC1: compute p_o, compute p_e_AC1 = (2/(K*(K-1))) * sum_k(pi_k * (1-pi_k)), compute AC1 = (p_o - p_e_AC1) / (1 - p_e_AC1). Support 2-annotator pairwise input and N-annotator matrix/long format input. Return `AC1Result` with ac1, interpretation, pObserved, pExpected, n. Handle edge cases: all labels in one category (p_e_AC1=0, AC1=p_o, which is the correct behavior). | Status: not_done

- [ ] **Write tests for Gwet's AC1** — Test high-prevalence scenario where Cohen's Kappa is misleadingly low but AC1 correctly reflects high agreement (the prevalence paradox example from the spec). Test perfect agreement, no agreement, partial agreement. Test 2-annotator and N-annotator inputs. Test edge case: all labels in one category (AC1 = p_o). | Status: not_done

## Phase 8: Bootstrap Confidence Intervals

- [ ] **Create `src/bootstrap.ts` — Bootstrap CI and standard error** — Implement the bootstrap procedure: (1) resample n items with replacement (paired bootstrap: both annotators' labels sampled together), (2) compute metric on resampled data, (3) repeat B times, (4) sort values, (5) extract percentile CI at specified confidence level. Compute standard error as standard deviation of bootstrap values. Compute p-value as proportion of bootstrap samples with metric <= 0. Accept a generic metric computation function so bootstrap works with any metric. Support seeded PRNG for reproducibility. Default B=1000, configurable via `bootstrapIterations`. | Status: not_done

- [ ] **Integrate bootstrap CI into Cohen's Kappa** — Wire up the `ci`, `bootstrapIterations`, and `seed` options in `cohensKappa()` to call the bootstrap module. Include `ci`, `standardError`, and `pValue` in the `KappaResult` when CI is requested. | Status: not_done

- [ ] **Integrate bootstrap CI into Scott's Pi** — Wire up CI options in `scottsPi()`. Include CI, SE, and p-value in `PiResult`. | Status: not_done

- [ ] **Integrate bootstrap CI into Fleiss' Kappa** — Wire up CI options in `fleissKappa()`. Include CI, SE in `FleissKappaResult`. | Status: not_done

- [ ] **Integrate bootstrap CI into Krippendorff's Alpha** — Wire up CI options in `krippendorffAlpha()`. Include CI, SE in `AlphaResult`. | Status: not_done

- [ ] **Integrate bootstrap CI into Gwet's AC1** — Wire up CI options in `gwetsAC1()`. Include CI, SE in `AC1Result`. | Status: not_done

- [ ] **Write tests for bootstrap CI** — Test that seeded bootstrap produces identical results across runs. Test that CI width decreases with larger n and more iterations. Test that CI contains the known true value for a controlled distribution (with tolerance for statistical noise). Test p-value computation. Test that bootstrap preserves pairing structure. | Status: not_done

- [ ] **Write tests for PRNG** — Test that the LCG produces deterministic sequences given a seed. Test that different seeds produce different sequences. Test uniform distribution properties (rough chi-squared check over many samples). | Status: not_done

## Phase 9: Comprehensive Agreement Report

- [ ] **Create `src/agreement.ts` — Comprehensive agreement report** — Implement `agreement(dataOrAnnotatorA, annotatorBOrOptions?, options?)` that computes all applicable metrics and returns `AgreementReport`. Logic: detect data shape (2 annotators vs N), detect measurement level, compute applicable metrics (2-annotator: Cohen's Kappa, Scott's Pi, Gwet's AC1, percent agreement, confusion matrix; N-annotator: Fleiss' Kappa, Krippendorff's Alpha, percent agreement). Support `metrics` option to select specific metrics. Support overloaded signature (pairwise or single-argument). | Status: not_done

- [ ] **Implement per-annotator statistics in agreement report** — For data with identifiable annotators (long format), compute per-annotator stats: items rated, label distribution (as `Record<string, number>`). Include in `annotatorStats` field of `AgreementReport`. | Status: not_done

- [ ] **Implement data summary in agreement report** — Compute and return: total items, total annotators, number of categories, missing data rate, measurement level used. Include in `summary` field of `AgreementReport`. | Status: not_done

- [ ] **Implement recommendation logic in agreement report** — Generate a recommendation string based on data characteristics: (1) 2 annotators + categorical + balanced prevalence -> recommend Cohen's Kappa, (2) 2 annotators + skewed prevalence (>80%) -> recommend AC1 alongside Kappa with prevalence paradox note, (3) 2 annotators + ordinal -> recommend weighted Kappa (quadratic), (4) N annotators + complete data -> recommend Fleiss' Kappa, (5) N annotators + missing data -> recommend Krippendorff's Alpha, (6) ordinal/interval/ratio -> recommend Krippendorff's Alpha with appropriate level. | Status: not_done

- [ ] **Implement per-category breakdown in agreement report** — For 2-annotator data: compute per-category agreement rate (from confusion matrix diagonal), per-category confusion (most common alternative label on disagreement), category prevalence (averaged across annotators). Include in the report. | Status: not_done

- [ ] **Write tests for agreement report — 2-annotator scenario** — Test that Cohen's Kappa, Scott's Pi, Gwet's AC1, percent agreement, and confusion matrix are all present. Test that per-category breakdown is correct. Test recommendation text for balanced and skewed distributions. | Status: not_done

- [ ] **Write tests for agreement report — N-annotator scenario** — Test that Fleiss' Kappa, Krippendorff's Alpha, and percent agreement are present. Test per-annotator statistics. Test recommendation text for complete vs missing data. | Status: not_done

- [ ] **Write tests for agreement report — metric selection** — Test the `metrics` option to select specific metrics (e.g., only Cohen's Kappa and percent agreement). Verify unselected metrics are not computed. | Status: not_done

## Phase 10: CLI Implementation

- [ ] **Create `src/cli.ts` — CLI entry point and argument parsing** — Implement CLI argument parsing without external dependencies. Parse all flags from the spec: `--input`, `--format`, `--item-col`, `--annotator-col`, `--label-col`, `--metric`, `--level`, `--weights`, `--categories`, `--ci`, `--bootstrap`, `--seed`, `--threshold`, `--threshold-metric`, `--output`, `--quiet`, `--verbose`, `--version`, `--help`. Add shebang line `#!/usr/bin/env node`. Validate required flags (--input is required unless piped). Return exit code 2 for configuration errors. | Status: not_done

- [ ] **Implement CSV file reading in CLI** — Implement a lightweight CSV/TSV parser (no external dependency). Parse long-format CSV (item, annotator, label columns with customizable names) and matrix-format CSV (items as rows, annotators as columns, empty cells as missing). Support `.tsv` files (tab-delimited). Handle common edge cases: trailing newlines, BOM characters, quoted fields with commas. | Status: not_done

- [ ] **Implement JSON and JSONL file reading in CLI** — Read `.json` files (expect array of annotation triples or matrix). Read `.jsonl` files (one annotation triple per line). Auto-detect format from file extension. | Status: not_done

- [ ] **Implement human-readable output formatting** — Format results matching the spec's example: version header, data summary (items, annotators, categories, missing rate, level), metric values with interpretations, per-category kappa (when verbose), confusion matrix (when verbose), recommendation text. Right-align numeric values for readability. | Status: not_done

- [ ] **Implement JSON output mode** — When `--output json` is specified, serialize the `AgreementReport` as a JSON string to stdout. No extra formatting or decoration. | Status: not_done

- [ ] **Implement threshold-based exit codes** — When `--threshold <value>` is set, compare the computed metric value against the threshold. Use `--threshold-metric` to select which metric (default: first computed). Exit code 0 if metric >= threshold, exit code 1 if metric < threshold. Work correctly with `--quiet` (suppress output, only exit code matters). | Status: not_done

- [ ] **Implement environment variable support** — Read `LABEL_SCORE_INPUT`, `LABEL_SCORE_METRIC`, `LABEL_SCORE_LEVEL`, `LABEL_SCORE_THRESHOLD`, `LABEL_SCORE_FORMAT` environment variables. CLI flags override environment variables. | Status: not_done

- [ ] **Implement --help and --version flags** — `--help` prints usage information matching the spec's flag documentation. `--version` prints the version from package.json. Both exit with code 0. | Status: not_done

- [ ] **Write CLI integration tests** — Test end-to-end: create temp CSV/JSON/JSONL files, invoke the CLI, verify output matches expected format and values. Test human-readable and JSON output modes. Test threshold exit codes (0 and 1). Test configuration errors (exit code 2): missing input, invalid metric, malformed data. Test environment variable support. Test `--quiet` and `--verbose` modes. Test custom column names (`--item-col`, `--annotator-col`, `--label-col`). | Status: not_done

## Phase 11: Test Fixtures and Reference Verification

- [ ] **Create `tests/fixtures/sklearn-reference.json`** — Generate reference values by running Python sklearn `cohen_kappa_score` on multiple test cases (unweighted, linear-weighted, quadratic-weighted, 2 categories, 5 categories, edge cases). Include input data and expected output in the fixture. | Status: not_done

- [ ] **Create `tests/fixtures/nltk-reference.json`** — Generate reference values by running Python nltk `AnnotationTask` on multiple test cases for Fleiss' Kappa and Krippendorff's Alpha. Include input data and expected output. | Status: not_done

- [ ] **Create `tests/fixtures/krippendorff-book.json`** — Encode the canonical "four annotators, twelve items" example from Krippendorff (2011) with known-correct alpha values for nominal, ordinal, interval, and ratio levels. | Status: not_done

- [ ] **Create `tests/fixtures/fleiss-paper.json`** — Encode the example data from Fleiss's original 1971 paper with the known-correct kappa value. | Status: not_done

- [ ] **Write cross-reference verification tests** — For each fixture, write a test that loads the fixture, runs the corresponding `label-score` function, and asserts the result matches the reference value to at least 10 decimal places (as spec requires for sklearn comparison). | Status: not_done

## Phase 12: Input Format Edge Cases and Validation Tests

- [ ] **Write tests for format auto-detection** — Test that pairwise format (two arrays of primitives) is correctly detected. Test that long format (array of objects with item/annotator/label) is detected. Test that matrix format (2D array of primitives/null) is detected. Test that category-count matrix (2D array of non-negative integers with constant row sums) is detected. Test ambiguous cases where explicit format is needed. | Status: not_done

- [ ] **Write tests for pairwise format validation** — Test error on unequal array lengths. Test error on empty arrays. Test that strings, numbers, and booleans are all accepted as labels. | Status: not_done

- [ ] **Write tests for matrix format handling** — Test null/undefined handling for missing data. Test auto-conversion to category-count matrix for Fleiss' Kappa. Test exclusion of items with fewer than 2 non-null labels. Test warning message when items are excluded. | Status: not_done

- [ ] **Write tests for long format handling** — Test correct grouping by item. Test missing data handling (implicit: no triple means not rated). Test duplicate detection (same item+annotator appears twice -> error or warning). Test with string and numeric item/annotator IDs. | Status: not_done

- [ ] **Write tests for category-count matrix validation** — Test that rows must sum to the same value. Test error when they do not. Test correct conversion from matrix format. | Status: not_done

- [ ] **Write tests for missing data option** — Test `missingData: 'exclude'` (default): items with missing data are filtered and a warning is logged with count. Test `missingData: 'error'`: throw error when missing data is present. Test that Krippendorff's Alpha handles missing data natively without filtering. | Status: not_done

## Phase 13: Edge Case Hardening

- [ ] **Test all metrics with empty input** — Verify every metric function returns NaN (or throws, as appropriate) when given zero items. Ensure no crashes, no infinite loops, no uncaught exceptions. | Status: not_done

- [ ] **Test all metrics with single item** — Verify behavior: metrics that need variance return NaN with warning, percentage agreement returns 0 or 1. | Status: not_done

- [ ] **Test all metrics with single category** — Verify that p_e = 1.0 is handled: Cohen's Kappa returns NaN with warning about prevalence paradox, Scott's Pi returns NaN, Fleiss' Kappa returns NaN. Gwet's AC1 returns p_o (correct behavior per spec). | Status: not_done

- [ ] **Test negative kappa values** — Construct inputs where annotators agree less than chance. Verify kappa is negative and correctly computed. Verify interpretation is 'poor'. | Status: not_done

- [ ] **Test all-missing data** — Verify appropriate error when all items have missing data (no item has >= 2 raters). | Status: not_done

- [ ] **Test large dataset performance** — Create synthetic datasets with 100,000 items and verify Cohen's Kappa completes in < 10ms, Fleiss' Kappa in < 50ms, Krippendorff's Alpha in < 100ms. Verify memory usage stays reasonable (no data copying in hot loops). | Status: not_done

- [ ] **Test boolean labels** — Verify that `true`/`false` labels work correctly in all metrics (treated as categorical). | Status: not_done

- [ ] **Test mixed label types** — Verify behavior when labels contain a mix of strings and numbers (should work for nominal, may need explicit handling for ordinal). | Status: not_done

## Phase 14: Documentation and README

- [ ] **Create README.md** — Write comprehensive README covering: package description, installation (`npm install label-score`), quick start examples for each metric, API reference (all function signatures and option types), CLI usage with all flags, measurement level guide, interpretation scale tables, integration examples with npm-master ecosystem packages, zero-dependency note, Node.js >= 18 requirement. | Status: not_done

- [ ] **Add JSDoc comments to all public functions** — Add JSDoc comments with `@param`, `@returns`, `@example`, and `@throws` tags to every exported function: `cohensKappa`, `scottsPi`, `fleissKappa`, `krippendorffAlpha`, `gwetsAC1`, `percentAgreement`, `confusionMatrix`, `agreement`. | Status: not_done

- [ ] **Add JSDoc comments to all public types** — Add JSDoc comments to every exported interface and type, explaining the purpose and usage of each field. | Status: not_done

## Phase 15: Build Verification and Publishing Prep

- [ ] **Verify TypeScript compilation** — Run `tsc` and confirm zero errors. Verify that `dist/` output includes `.js`, `.d.ts`, and `.d.ts.map` files for all source modules. Verify the `dist/index.d.ts` exports all public types. | Status: not_done

- [ ] **Verify ESLint passes** — Run `eslint src/` with zero errors and zero warnings. Fix any linting issues. | Status: not_done

- [ ] **Run full test suite** — Execute `vitest run` and verify all tests pass. Report total test count and coverage summary. | Status: not_done

- [ ] **Verify CLI works end-to-end** — Test the built CLI binary: `node dist/cli.js --input <testfile> --metric all --verbose`. Verify human-readable and JSON outputs are correct. Test `--version` and `--help`. | Status: not_done

- [ ] **Version bump** — Bump version in `package.json` appropriately based on which phase is complete (0.1.0 for Phase 1 core, incrementing through 1.0.0 for full release). | Status: not_done

- [ ] **Verify package publishes correctly** — Run `npm pack` and inspect the tarball contents. Verify only `dist/` is included (per `"files": ["dist"]`). Verify the package installs and imports correctly in a fresh project. | Status: not_done
