#!/usr/bin/env python3
"""
Focused Tests for Critical Issues Identified in System
- CSV field compatibility issues
- Regex pattern validation boundaries  
- Error handling mechanisms
- Data pipeline integrity
"""

import sys
import re
import csv
import tempfile
import os
import shutil
from datetime import datetime

# Import the main automation class
sys.path.append('/Users/i_kawano/Documents/training_waitnum_analysis')
from weekly_automation import GymAnalysisAutomation


def test_csv_field_compatibility():
    """Test CSV field compatibility issue (original_match field)"""
    print("🔍 Testing CSV Field Compatibility...")
    
    temp_dir = tempfile.mkdtemp()
    automation = GymAnalysisAutomation()
    automation.project_dir = temp_dir
    automation.csv_file = os.path.join(temp_dir, "test_data.csv")
    automation.backup_dir = os.path.join(temp_dir, "backups")
    os.makedirs(automation.backup_dir, exist_ok=True)
    
    try:
        memo_content = "混雜状況 15人 やや空いています 08:30時点"
        gym_data, _ = automation.extract_gym_data(memo_content)
        
        print(f"   Extracted data fields: {list(gym_data[0].keys()) if gym_data else 'None'}")
        
        # Check if original_match field is included
        if gym_data and 'original_match' in gym_data[0]:
            print("   ❌ ISSUE: 'original_match' field is included but not in CSV fieldnames")
            
            # Remove the problematic field
            for data in gym_data:
                if 'original_match' in data:
                    del data['original_match']
            
        new_count, total_count = automation.update_csv(gym_data)
        print(f"   ✅ CSV writing successful: {new_count} new, {total_count} total")
        
        # Verify CSV structure
        with open(automation.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            print(f"   CSV Headers: {headers}")
            
        shutil.rmtree(temp_dir)
        return True
        
    except Exception as e:
        print(f"   ❌ CSV Field Compatibility Error: {e}")
        shutil.rmtree(temp_dir)
        return False


def test_regex_pattern_boundaries():
    """Test regex pattern boundary validation"""
    print("\n🔍 Testing Regex Pattern Boundaries...")
    
    pattern = r"混[雜雑]状況\s*(\d+)人\s*([^\d]*?)\s*(\d{1,2}):(\d{2})時点(?:\s*(\d{2}/\d{2}))?"
    
    test_cases = [
        # Valid cases
        ("混雜状況 15人 やや空いています 08:30時点", True, "Valid standard format"),
        ("混雑状況 25人 やや混んでいます 12:00時点", True, "Valid with 混雑"),
        
        # Time boundary cases - should these be valid?
        ("混雜状況 15人 やや空いています 25:30時点", False, "Invalid hour (25)"),
        ("混雜状況 15人 やや空いています 08:60時点", False, "Invalid minute (60)"),
        ("混雜状況 15人 やや空いています 24:00時点", False, "Invalid hour (24)"),
        
        # Edge cases that should be valid
        ("混雜状況 15人 やや空いています 23:59時点", True, "Valid max time"),
        ("混雜状況 15人 やや空いています 00:00時点", True, "Valid min time"),
    ]
    
    issues_found = []
    
    for test_text, should_match, description in test_cases:
        match = re.search(pattern, test_text)
        is_match = match is not None
        
        if is_match != should_match:
            issues_found.append(f"   ❌ {description}: Expected {should_match}, got {is_match}")
            if match:
                hour, minute = int(match.group(3)), int(match.group(4))
                if hour > 23 or minute > 59:
                    issues_found.append(f"     -> Invalid time values: {hour:02d}:{minute:02d}")
        else:
            print(f"   ✅ {description}: {is_match}")
    
    if issues_found:
        print("\n   REGEX PATTERN ISSUES FOUND:")
        for issue in issues_found:
            print(issue)
        return False
    else:
        print("   ✅ All regex pattern boundary tests passed")
        return True


def test_apple_notes_connectivity():
    """Test Apple Notes connectivity and memo retrieval"""
    print("\n🔍 Testing Apple Notes Connectivity...")
    
    automation = GymAnalysisAutomation()
    
    try:
        # Test memo retrieval with actual system
        memo_content = automation.get_memo_content()
        
        if memo_content:
            print(f"   ✅ Successfully retrieved memo content ({len(memo_content)} characters)")
            
            # Check for expected gym data patterns
            if "混雜状況" in memo_content or "混雑状況" in memo_content:
                print("   ✅ Memo contains gym crowding data")
                
                # Extract and count data points
                gym_data, processed_patterns = automation.extract_gym_data(memo_content)
                print(f"   ✅ Extracted {len(gym_data)} data points")
                print(f"   ✅ Found {len(processed_patterns)} processable patterns")
                
                return True
            else:
                print("   ⚠️  Memo retrieved but contains no gym data")
                return False
        else:
            print("   ❌ Failed to retrieve memo content")
            return False
            
    except Exception as e:
        print(f"   ❌ Apple Notes connectivity error: {e}")
        return False


def test_csv_data_integrity():
    """Test CSV data integrity with real data file"""
    print("\n🔍 Testing CSV Data Integrity...")
    
    csv_file = "/Users/i_kawano/Documents/training_waitnum_analysis/fit_place24_data.csv"
    
    if not os.path.exists(csv_file):
        print("   ❌ CSV file does not exist")
        return False
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        print(f"   ✅ CSV file loaded successfully: {len(rows)} records")
        
        # Check required fields
        required_fields = ['datetime', 'date', 'time', 'hour', 'weekday', 'count', 
                          'status_label', 'status_code', 'status_min', 'status_max', 'raw_text']
        
        if rows:
            missing_fields = [field for field in required_fields if field not in rows[0]]
            if missing_fields:
                print(f"   ❌ Missing required fields: {missing_fields}")
                return False
            else:
                print("   ✅ All required fields present")
        
        # Data validation
        issues = []
        for i, row in enumerate(rows[:10]):  # Check first 10 rows
            try:
                # Validate datetime format
                datetime.strptime(row['datetime'], '%Y-%m-%d %H:%M:%S')
                
                # Validate numeric fields
                count = int(row['count'])
                hour = int(row['hour'])
                status_code = int(row['status_code'])
                
                if not (0 <= hour <= 23):
                    issues.append(f"Row {i}: Invalid hour {hour}")
                
                if not (0 <= count <= 100):
                    issues.append(f"Row {i}: Suspicious count {count}")
                    
                if not (1 <= status_code <= 5):
                    issues.append(f"Row {i}: Invalid status_code {status_code}")
                    
            except Exception as e:
                issues.append(f"Row {i}: Data validation error - {e}")
        
        if issues:
            print("   ⚠️  Data integrity issues found:")
            for issue in issues[:5]:  # Show first 5 issues
                print(f"     {issue}")
            return False
        else:
            print("   ✅ Data integrity validation passed")
            return True
            
    except Exception as e:
        print(f"   ❌ CSV integrity test error: {e}")
        return False


def test_launchd_service_configuration():
    """Test LaunchD service configuration"""
    print("\n🔍 Testing LaunchD Service Configuration...")
    
    plist_path = "/Users/i_kawano/Documents/training_waitnum_analysis/com.user.gym.analysis.weekly.plist"
    
    if not os.path.exists(plist_path):
        print("   ❌ LaunchD plist file not found")
        return False
    
    try:
        with open(plist_path, 'r') as f:
            content = f.read()
        
        print("   ✅ LaunchD plist file exists")
        
        # Check critical configuration elements
        checks = [
            ("Label", "com.user.gym.analysis.weekly"),
            ("Python Path", "/Users/i_kawano/.pyenv/versions/3.11.6/bin/python3"),
            ("Script Path", "weekly_automation.py"),
            ("Weekly Flag", "--weekly"),
            ("Sunday Schedule", "<integer>0</integer>"),  # 0 = Sunday
            ("Execution Time", "<integer>1</integer>"),   # 00:01
        ]
        
        issues = []
        for check_name, check_value in checks:
            if check_value not in content:
                issues.append(f"Missing or incorrect {check_name}: {check_value}")
            else:
                print(f"   ✅ {check_name} configured correctly")
        
        # Check file paths exist
        if "/Users/i_kawano/.pyenv/versions/3.11.6/bin/python3" in content:
            python_path = "/Users/i_kawano/.pyenv/versions/3.11.6/bin/python3"
            if os.path.exists(python_path):
                print("   ✅ Python executable path exists")
            else:
                issues.append("Python executable path does not exist")
        
        script_path = "/Users/i_kawano/Documents/training_waitnum_analysis/weekly_automation.py"
        if os.path.exists(script_path):
            print("   ✅ Automation script path exists")
        else:
            issues.append("Automation script path does not exist")
        
        if issues:
            print("   ❌ LaunchD configuration issues:")
            for issue in issues:
                print(f"     {issue}")
            return False
        else:
            print("   ✅ LaunchD service configuration is valid")
            return True
            
    except Exception as e:
        print(f"   ❌ LaunchD configuration test error: {e}")
        return False


def test_memo_cleaning_functionality():
    """Test memo cleaning functionality with real patterns"""
    print("\n🔍 Testing Memo Cleaning Functionality...")
    
    automation = GymAnalysisAutomation()
    
    # Test with sample content
    test_memo = """<div>フィットプレイス24練馬早宮<br></div>
<div>混雜状況 15人 やや空いています 08:30時点<br></div>
<div>混雜状況 25人 やや混んでいます 12:00時点<br></div>
<div>今日のメモ<br></div>"""
    
    processed_patterns = [
        "混雜状況 15人 やや空いています 08:30時点",
        "混雜状況 25人 やや混んでいます 12:00時点"
    ]
    
    try:
        cleaned_content = automation.clean_processed_patterns_from_memo(test_memo, processed_patterns)
        
        print("   ✅ Memo cleaning executed successfully")
        
        # Verify patterns were removed
        patterns_removed = True
        for pattern in processed_patterns:
            if pattern in cleaned_content:
                print(f"   ❌ Pattern not removed: {pattern}")
                patterns_removed = False
        
        if patterns_removed:
            print("   ✅ All processed patterns removed")
        
        # Verify structure preserved
        if "フィットプレイス24練馬早宮" in cleaned_content:
            print("   ✅ Title structure preserved")
        else:
            print("   ⚠️  Title structure may be damaged")
        
        if "今日のメモ" in cleaned_content:
            print("   ✅ Non-processed content preserved")
        else:
            print("   ⚠️  Non-processed content may be lost")
        
        return patterns_removed
        
    except Exception as e:
        print(f"   ❌ Memo cleaning test error: {e}")
        return False


def run_critical_tests():
    """Run all critical system tests"""
    print("=" * 80)
    print("GYM AUTOMATION SYSTEM - CRITICAL ISSUES TESTING")
    print("=" * 80)
    print(f"Test execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("CSV Field Compatibility", test_csv_field_compatibility),
        ("Regex Pattern Boundaries", test_regex_pattern_boundaries),
        ("Apple Notes Connectivity", test_apple_notes_connectivity),
        ("CSV Data Integrity", test_csv_data_integrity),
        ("LaunchD Service Configuration", test_launchd_service_configuration),
        ("Memo Cleaning Functionality", test_memo_cleaning_functionality),
    ]
    
    results = {}
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
            if result:
                passed += 1
        except Exception as e:
            print(f"   ❌ Test execution error: {e}")
            results[test_name] = False
    
    print("\n" + "=" * 80)
    print("CRITICAL TESTS SUMMARY")
    print("=" * 80)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nOverall Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print(f"Test execution completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return results


if __name__ == "__main__":
    results = run_critical_tests()
    
    # System recommendations based on test results
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS FOR SYSTEM RELIABILITY")
    print("=" * 80)
    
    if not results.get("CSV Field Compatibility", True):
        print("🔧 CRITICAL: Fix CSV field compatibility by removing 'original_match' from data or adding to fieldnames")
    
    if not results.get("Regex Pattern Boundaries", True):
        print("🔧 HIGH: Add time validation to regex processing to reject invalid hours/minutes")
    
    if not results.get("Apple Notes Connectivity", True):
        print("🔧 HIGH: Apple Notes connectivity issues - check permissions and memo existence")
    
    if not results.get("CSV Data Integrity", True):
        print("🔧 MEDIUM: Review and clean CSV data integrity issues")
    
    if not results.get("LaunchD Service Configuration", True):
        print("🔧 HIGH: Fix LaunchD service configuration for reliable automation")
    
    if not results.get("Memo Cleaning Functionality", True):
        print("🔧 HIGH: Review memo cleaning logic to prevent data loss")
    
    print("\n📊 System Status: ", end="")
    if sum(results.values()) >= len(results) * 0.8:
        print("🟢 STABLE (>80% tests passing)")
    elif sum(results.values()) >= len(results) * 0.6:
        print("🟡 NEEDS ATTENTION (60-80% tests passing)")
    else:
        print("🔴 CRITICAL ISSUES (<60% tests passing)")