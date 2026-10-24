import os
import sys
import time
import json
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOT_DIRS = [
    Path(r"c:\Users\SaDSBKGDatyam singh\OneDrive\Desktop\BUIld_w_Ai\verification_screenshots"),
    Path(r"C:\Users\SaDSBKGDatyam singh\.gemini\antigravity-ide\brain\21e79f1a-697c-46ef-ae1f-655c8a039da6\screenshots")
]

for d in SCREENSHOT_DIRS:
    d.mkdir(parents=True, exist_ok=True)

def save_screenshot(page, filename):
    for d in SCREENSHOT_DIRS:
        target = d / filename
        page.screenshot(path=str(target), full_page=True)
    print(f"  [SCREENSHOT SAVED] -> {filename}")

def run_verification():
    print("=" * 65)
    print("  EXPERIMENTPILOT: FULL AUTOMATED BROWSER VERIFICATION SUITE  ")
    print("=" * 65)

    console_logs = []
    failed_requests = []
    step_results = {}

    with sync_playwright() as p:
        print("\n1. Launching system Chrome browser in headless mode...")
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--disable-web-security", "--no-sandbox"]
        )

        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        page = context.new_page()

        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url} - {req.failure}"))

        # --- STEP 1: Overview Page & Viewports ---
        print("\n--- STEP 1: Verify Overview Page, Value Proposition & Responsive Viewports ---")
        try:
            page.goto("http://127.0.0.1:5173", wait_until="networkidle")
            page.wait_for_selector(".workspace-header", timeout=5000)

            # Check Title
            h1_text = page.locator("h1").first.inner_text()
            assert "Overview" in h1_text, f"Unexpected h1 text: {h1_text}"

            # Check Hero Banner Value Proposition
            hero_banner = page.locator("text=Bridge the Gap Between Raw Model Predictions and Verifiable Scientific Hypotheses")
            assert hero_banner.count() > 0, "Hero banner value proposition not found!"

            # Check 4 Workflow Pillars
            assert page.locator("text=1. Track & Record").count() > 0, "Pillar 1 missing"
            assert page.locator("text=2. Verify Metrics").count() > 0, "Pillar 2 missing"
            assert page.locator("text=3. Analyze Behavior").count() > 0, "Pillar 3 missing"
            assert page.locator("text=4. Propose Hypotheses").count() > 0, "Pillar 4 missing"

            # Check Primary Action Button
            primary_btn = page.locator("button:has-text('Launch Model Comparison')")
            assert primary_btn.is_visible(), "Primary action button 'Launch Model Comparison' not visible"

            # Check KPI Cards and Badges
            assert page.locator("text=Total Recorded Runs").is_visible(), "KPI Total Recorded Runs missing"
            assert page.locator("text=Best Validated Model").is_visible(), "KPI Best Validated Model missing"
            assert page.locator("text=Scientific Compatibility Guard").is_visible(), "KPI Scientific Guard missing"

            # Check Synthetic vs User Run Badges
            assert page.locator("text=SYNTHETIC FIXTURE").count() > 0, "Synthetic badges missing"
            assert page.locator("text=USER RUN").count() > 0, "User run badges missing"

            save_screenshot(page, "01_overview_1440x900.png")

            # Check 1366x768 Viewport
            page.set_viewport_size({"width": 1366, "height": 768})
            time.sleep(0.3)
            save_screenshot(page, "01_overview_1366x768.png")

            # Check Narrower Viewport (1024x768)
            page.set_viewport_size({"width": 1024, "height": 768})
            time.sleep(0.3)
            save_screenshot(page, "01_overview_1024x768.png")

            # Reset back to 1440x900
            page.set_viewport_size({"width": 1440, "height": 900})

            step_results["Step 1: Overview Page & Hero"] = "PASS"
            print("  Step 1 PASSED: Overview value proposition, 4 pillars, primary action & KPI cards verified across 1440x900, 1366x768, 1024x768.")
        except Exception as e:
            step_results["Step 1: Overview Page & Hero"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 1 FAILED:\n{traceback.format_exc()}")

        # --- STEP 2: Run Facts Navigation & Inspection ---
        print("\n--- STEP 2: Navigate to Run Facts & Inspect Experiment Metadata ---")
        try:
            # Click sidebar button for Run Facts
            page.locator("button[title*='Run Facts']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)

            # Verify title
            header_h1 = page.locator(".workspace-title-area h1").inner_text()
            print(f"  Run Facts Active Experiment: {header_h1}")

            # Verify Metadata Section
            assert page.locator("text=Metadata").is_visible(), "Metadata section heading missing"
            assert page.locator("text=JIRA Owner").is_visible(), "JIRA Owner missing"
            assert page.locator("text=Git Branch").is_visible(), "Git Branch missing"
            assert page.locator("text=Hyperparameter").is_visible(), "Hyperparameter section missing"

            # Verify Metrics Section
            assert page.locator("h2:has-text('Metrics')").is_visible(), "Metrics section heading missing"
            assert page.locator("text=Loss").count() > 0, "Loss stat missing"
            assert page.locator("text=Confusion Matrix").is_visible(), "Confusion Matrix card missing"
            assert page.locator("text=Feature Importance").is_visible(), "Feature Importance card missing"

            # Verify Audited Metrics banner
            assert page.locator("text=Independently Calculated Verification Metrics").is_visible(), "Verification Metrics card missing"
            assert page.locator("text=Verified Accuracy").is_visible(), "Verified Accuracy missing"
            assert page.locator("text=Verified Macro-F1").is_visible(), "Verified Macro-F1 missing"

            # Verify Header tabs
            assert page.locator("button:has-text('Run Facts')").is_visible(), "Tab 'Run Facts' missing"
            assert page.locator("button:has-text('Demo Space')").is_visible(), "Tab 'Demo Space' missing"
            assert page.locator("button:has-text('Analysis')").is_visible(), "Tab 'Analysis' missing"

            save_screenshot(page, "02_run_facts.png")
            step_results["Step 2: Run Facts Inspection"] = "PASS"
            print("  Step 2 PASSED: Run facts metadata, audited metrics, confusion matrix & hyperparameters verified.")
        except Exception as e:
            step_results["Step 2: Run Facts Inspection"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 2 FAILED:\n{traceback.format_exc()}")

        # --- STEP 3: Model Comparison (Compatible Pair) ---
        print("\n--- STEP 3: Open Model Comparison & Select Compatible Pair ---")
        try:
            page.locator("button[title*='Model Comparison']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)

            # Select Model A: exp_coatnet_consensus
            select_a = page.locator(".workspace-body select").nth(0)
            select_a.select_option("exp_coatnet_consensus")

            # Select Model B: exp_convnext_pool
            select_b = page.locator(".workspace-body select").nth(1)
            select_b.select_option("exp_convnext_pool")

            # Wait for comparison metrics to render
            page.wait_for_selector("text=Evaluation Protocols Compatible & Verified", timeout=5000)

            # Assert Compatibility Banner
            banner = page.locator("text=Evaluation Protocols Compatible & Verified")
            assert banner.is_visible(), "Green compatibility banner not visible!"

            # Assert Delta Metrics
            assert page.locator("text=Comparative Performance Metrics").is_visible()
            assert page.locator("text=Delta:").count() > 0

            save_screenshot(page, "03_model_comparison_compatible.png")
            step_results["Step 3: Model Comparison (Compatible)"] = "PASS"
            print("  Step 3 PASSED: Compatible runs selected, green guardrail verified & comparative metrics rendered.")
        except Exception as e:
            step_results["Step 3: Model Comparison (Compatible)"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 3 FAILED:\n{traceback.format_exc()}")

        # --- STEP 4: Behavior Explorer & Filters ---
        print("\n--- STEP 4: Open Behavior Explorer & Test Filters ---")
        try:
            page.locator("button[title*='Model Behavior Explorer']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)

            # Ensure compatible pair is selected
            page.locator(".workspace-header select").nth(0).select_option("exp_coatnet_consensus")
            page.locator(".workspace-header select").nth(1).select_option("exp_convnext_pool")
            time.sleep(0.5)

            # Test Quick Filter Pills (Buttons)
            btn_mutual = page.locator("button:has-text('Mutual Agreement')")
            assert btn_mutual.is_visible(), "Mutual Agreement filter button missing"
            btn_mutual.click()
            time.sleep(0.6)

            btn_both_error = page.locator("button:has-text('Both In Error')")
            assert btn_both_error.is_visible(), "Both In Error filter button missing"
            btn_both_error.click()
            time.sleep(0.6)

            btn_disagreements = page.locator("button:has-text('Disagreements (A ≠ B)')")
            assert btn_disagreements.is_visible(), "Disagreements filter button missing"
            btn_disagreements.click()

            # Wait for disagreement cases to load
            page.wait_for_selector(".data-table tbody tr", timeout=6000)
            case_items = page.locator(".data-table tbody tr")
            item_count = case_items.count()
            print(f"  Behavior Explorer Cases Count: {item_count}")
            assert item_count > 0, "No disagreement cases loaded in table!"

            # Click the first case item
            case_items.first.click()
            time.sleep(0.4)

            # Verify case inspection panel
            assert page.locator("text=Single Instance").count() > 0 or page.locator("text=axial slices").count() > 0 or page.locator("text=slice").count() > 0

            save_screenshot(page, "04_behavior_explorer.png")
            step_results["Step 4: Behavior Explorer Filters"] = "PASS"
            print("  Step 4 PASSED: Disagreement/mutual agreement filters tested & case inspector verified.")
        except Exception as e:
            step_results["Step 4: Behavior Explorer Filters"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 4 FAILED:\n{traceback.format_exc()}")

        # --- STEP 5: Generic Tabular Experiment (No CT/Medical language) ---
        print("\n--- STEP 5: Select Generic Tabular Experiment & Verify Terminology Cleanliness ---")
        try:
            # Find an imported generic tabular experiment from options in Run A
            select_a = page.locator(".workspace-header select").nth(0)
            options = select_a.locator("option")
            tab_id = None
            for idx in range(options.count()):
                val = options.nth(idx).get_attribute("value")
                text = options.nth(idx).inner_text()
                if "XGBoost" in text or "Tabular" in text:
                    tab_id = val
                    break

            if not tab_id:
                for idx in range(options.count()):
                    val = options.nth(idx).get_attribute("value")
                    if val and val.startswith("exp_imp_"):
                        tab_id = val
                        break

            print(f"  Selected Tabular Experiment ID: {tab_id}")
            assert tab_id is not None, "Generic tabular experiment not found in options!"

            # Select tabular experiment for Model A and Model B
            select_a.select_option(tab_id)
            select_b = page.locator(".workspace-header select").nth(1)
            select_b.select_option(tab_id)

            # Click All Cases filter
            btn_all = page.locator("button:has-text('All Cases')")
            btn_all.click()
            time.sleep(0.8)

            # Inspect page content
            page_text = page.locator(".main-workspace").inner_text().lower()

            # Medical terms that should NEVER appear for generic tabular:
            forbidden_medical_terms = ["hemorrhage", "streak artifact", "skull base", "brain parenchyma"]
            for term in forbidden_medical_terms:
                assert term not in page_text, f"Found forbidden medical term '{term}' in generic tabular view!"

            save_screenshot(page, "05_tabular_generic_clean.png")
            step_results["Step 5: Generic Tabular Cleanliness"] = "PASS"
            print("  Step 5 PASSED: Generic tabular experiment rendered cleanly with zero medical/CT artifacts.")
        except Exception as e:
            step_results["Step 5: Generic Tabular Cleanliness"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 5 FAILED:\n{traceback.format_exc()}")

        # --- STEP 6: AI Insights & Cross-View Selection Synchronization ---
        print("\n--- STEP 6: AI Insights & Selection Synchronization ---")
        try:
            page.locator("button[title*='AI Experiment Insights']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)

            # Select compatible runs: exp_coatnet_consensus & exp_convnext_pool
            select_a = page.locator(".workspace-body select").nth(0)
            select_a.select_option("exp_coatnet_consensus")

            select_b = page.locator(".workspace-body select").nth(1)
            select_b.select_option("exp_convnext_pool")

            # Wait for insights to render
            page.wait_for_selector("text=Controlled Follow-Up Experiment Recommendations", timeout=6000)

            # Assert findings and recommendations exist
            assert page.locator("text=Measured Diagnostic Findings").count() > 0
            assert page.locator("text=Controlled Follow-Up Experiment Recommendations").count() > 0

            save_screenshot(page, "06_ai_insights.png")

            # Switch to Model Comparison and verify synchronization of selection state
            page.locator("button[title*='Model Comparison']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)
            sync_val_a = page.locator(".workspace-body select").nth(0).input_value()
            sync_val_b = page.locator(".workspace-body select").nth(1).input_value()
            assert sync_val_a == "exp_coatnet_consensus", f"Expected synchronized Model A exp_coatnet_consensus, got {sync_val_a}"
            assert sync_val_b == "exp_convnext_pool", f"Expected synchronized Model B exp_convnext_pool, got {sync_val_b}"

            step_results["Step 6: AI Insights & Synchronization"] = "PASS"
            print("  Step 6 PASSED: AI Insights generated & run selections verified synchronized across views.")
        except Exception as e:
            step_results["Step 6: AI Insights & Synchronization"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 6 FAILED:\n{traceback.format_exc()}")

        # --- STEP 7: Incompatibility Warning ---
        print("\n--- STEP 7: Incompatibility Warning on Invalid Run Pairing ---")
        try:
            # Ensure we are on Model Comparison view
            page.locator("button[title*='Model Comparison']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)

            # Pair exp_coatnet_consensus with tabular experiment (dataset mismatch)
            select_a = page.locator(".workspace-body select").nth(0)
            select_a.select_option("exp_coatnet_consensus")
            select_b = page.locator(".workspace-body select").nth(1)
            select_b.select_option(tab_id) # Using tabular exp from step 5

            # Wait for incompatibility warning
            page.wait_for_selector("text=Incompatible Evaluation Protocols Detected", timeout=6000)
            warning_text = page.locator(".workspace-body").inner_text()
            assert "Incompatible" in warning_text, "Incompatibility warning text not found"
            assert "mismatch" in warning_text.lower(), "Mismatch explanation not found"

            save_screenshot(page, "07_incompatibility_warning.png")
            step_results["Step 7: Incompatibility Warning"] = "PASS"
            print("  Step 7 PASSED: Guardrail blocked mismatched pairing with clear protocol warning.")
        except Exception as e:
            step_results["Step 7: Incompatibility Warning"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 7 FAILED:\n{traceback.format_exc()}")

        # --- STEP 8: Promote Evidence-Backed Finding to Hypothesis ---
        print("\n--- STEP 8: Promote Finding to Hypothesis & Persist ---")
        try:
            # Go back to AI Insights with compatible runs
            page.locator("button[title*='AI Experiment Insights']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)

            select_a = page.locator(".workspace-body select").nth(0)
            select_a.select_option("exp_coatnet_consensus")
            select_b = page.locator(".workspace-body select").nth(1)
            select_b.select_option("exp_convnext_pool")

            page.wait_for_selector(".btn-create-hypothesis", timeout=6000)

            # Click Promote to Hypothesis
            promote_btns = page.locator(".btn-create-hypothesis")
            assert promote_btns.count() > 0, "Promote to Hypothesis button missing"
            promote_btns.first.click()

            # Wait for modal to open
            page.wait_for_selector(".modal-dialog", timeout=4000)
            assert page.locator("text=Formulate New Hypothesis").is_visible()

            # Verify title and rationale prefilled
            title_input = page.locator(".modal-dialog input.form-input").first
            val = title_input.input_value()
            assert len(val) > 0, "Prefilled title is empty!"
            print(f"  Prefilled Hypothesis Title: {val}")

            # Submit form
            submit_btn = page.locator(".modal-dialog button[type='submit']")
            submit_btn.click()

            # Wait for modal to close
            page.wait_for_selector(".modal-dialog", state="detached", timeout=4000)
            time.sleep(0.5)

            # Verify new hypothesis appeared in drawer
            drawer_hypo_count = page.locator(".flow-hypo-card").count()
            print(f"  Hypothesis Drawer Count after Promotion: {drawer_hypo_count}")
            assert drawer_hypo_count >= 4, f"Expected at least 4 hypotheses, got {drawer_hypo_count}"

            save_screenshot(page, "08_promoted_hypothesis.png")
            step_results["Step 8: Promote Hypothesis"] = "PASS"
            print("  Step 8 PASSED: Evidence-backed proposal promoted & immediately logged in drawer.")
        except Exception as e:
            step_results["Step 8: Promote Hypothesis"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 8 FAILED:\n{traceback.format_exc()}")

        # --- STEP 9: Collapse and Expand Hypothesis Drawer ---
        print("\n--- STEP 9: Collapse & Expand Hypothesis Drawer ---")
        try:
            # Find collapse button in drawer
            collapse_btn = page.locator("button[title='Collapse Drawer']")
            assert collapse_btn.is_visible(), "Collapse button not visible"
            collapse_btn.click()
            time.sleep(0.3)

            # Assert drawer has collapsed class
            drawer = page.locator("aside.flow-pane")
            drawer_classes = drawer.get_attribute("class")
            assert "collapsed" in drawer_classes, f"Drawer did not receive 'collapsed' class: {drawer_classes}"

            # Verify collapsed rail indicator
            assert page.locator("button[title='Expand Experiment Flow']").is_visible(), "Expand button missing in collapsed state"
            save_screenshot(page, "09_drawer_collapsed.png")

            # Click Expand button
            expand_btn = page.locator("button[title='Expand Experiment Flow']")
            expand_btn.click()
            time.sleep(0.3)

            # Assert drawer expanded back
            drawer_classes_after = drawer.get_attribute("class")
            assert "collapsed" not in drawer_classes_after, "Drawer failed to un-collapse"
            assert page.locator("text=Experiment Flow").is_visible(), "Experiment Flow title not visible after expand"
            save_screenshot(page, "09_drawer_expanded.png")

            step_results["Step 9: Hypothesis Drawer Collapse/Expand"] = "PASS"
            print("  Step 9 PASSED: Hypothesis drawer cleanly collapses to rail and expands back.")
        except Exception as e:
            step_results["Step 9: Hypothesis Drawer Collapse/Expand"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 9 FAILED:\n{traceback.format_exc()}")

        # --- STEP 10: Import Experiment & Verify in UI ---
        print("\n--- STEP 10: Ingest New Experiment & Verify UI Registry Ingestion ---")
        try:
            # Click sidebar Import/Export button
            page.locator("button[title*='Import / Export']").click()
            page.wait_for_selector(".modal-dialog", timeout=4000)

            # Click CSV Import tab: "Ingest CSV Results"
            csv_tab = page.locator("button:has-text('Ingest CSV Results')")
            assert csv_tab.is_visible(), "Ingest CSV Results tab button missing"
            csv_tab.click()
            time.sleep(0.3)

            # Fill Experiment Name
            unique_name = f"Demo Run {int(time.time()) % 10000}"
            name_input = page.locator(".modal-dialog input").first
            name_input.fill(unique_name)

            # Fill CSV content
            csv_data = """case_id,true_label,predicted_label,probability,confidence
DEMO-A01,1,1,0.92,0.92
DEMO-A02,0,0,0.05,0.95
DEMO-A03,1,0,0.35,0.65
DEMO-A04,0,1,0.78,0.78
DEMO-A05,1,1,0.88,0.88
"""
            textarea = page.locator(".modal-dialog textarea")
            textarea.fill(csv_data)

            # Submit CSV Import using exact button text: "Ingest & Compute Metrics"
            import_btn = page.locator("button:has-text('Ingest & Compute Metrics')")
            assert import_btn.is_visible(), "Ingest & Compute Metrics button missing"
            import_btn.click()

            # Wait for success message
            page.wait_for_selector("text=CSV Imported successfully!", timeout=6000)
            print("  CSV Ingestion API succeeded!")

            # Wait for modal to auto close
            time.sleep(1.8)
            if page.locator(".modal-dialog").count() > 0:
                page.locator(".modal-close-btn").click()

            # Navigate to Overview to confirm newly imported experiment in registry
            page.locator("button[title*='Overview']").click()
            page.wait_for_selector(".workspace-header", timeout=5000)

            # Verify unique_name appears in table
            page.wait_for_selector(f"text={unique_name}", timeout=6000)
            row = page.locator(f"tr:has-text('{unique_name}')")
            assert row.is_visible(), f"Imported experiment row '{unique_name}' not visible in table!"
            assert row.locator("text=USER RUN").is_visible(), "Imported experiment missing 'USER RUN' badge!"

            save_screenshot(page, "10_imported_experiment_verified.png")
            step_results["Step 10: Experiment Ingestion & UI Update"] = "PASS"
            print(f"  Step 10 PASSED: Imported experiment '{unique_name}' visible in table with USER RUN badge.")
        except Exception as e:
            step_results["Step 10: Experiment Ingestion & UI Update"] = f"FAIL: {traceback.format_exc()}"
            print(f"  Step 10 FAILED:\n{traceback.format_exc()}")

        browser.close()

    print("\n" + "=" * 65)
    print("  VERIFICATION JOURNEY RESULTS SUMMARY  ")
    print("=" * 65)
    all_passed = True
    for step, res in step_results.items():
        print(f"  {step}: {res}")
        if not res.startswith("PASS"):
            all_passed = False

    print("\nConsole Logs Captured:", len(console_logs))
    error_logs = [log for log in console_logs if "[error]" in log.lower()]
    print("Console Error Logs:", len(error_logs))
    for err in error_logs:
        print("   ->", err)

    print("\nFailed Network Requests:", len(failed_requests))
    for req in failed_requests:
        print("   ->", req)

    summary_file = Path(SCREENSHOT_DIRS[0]) / "verification_summary.json"
    with open(summary_file, "w") as f:
        json.dump({
            "all_passed": all_passed,
            "step_results": step_results,
            "error_logs": error_logs,
            "failed_requests": failed_requests
        }, f, indent=2)

    return all_passed

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
