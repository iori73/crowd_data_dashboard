#!/usr/bin/env python3
"""
System-Level Tests for LaunchD Automation Service
- Service status and configuration validation
- Automation script execution testing
- End-to-end weekly automation workflow
- Error recovery and logging validation
"""

import subprocess
import os
import sys
import json
from datetime import datetime, timedelta

# Import the main automation class
sys.path.append('/Users/i_kawano/Documents/training_waitnum_analysis')
from weekly_automation import GymAnalysisAutomation


def test_launchd_service_status():
    """Test LaunchD service status and management"""
    print("🔍 Testing LaunchD Service Status...")
    
    service_label = "com.user.gym.analysis.weekly"
    
    try:
        # Check if service is loaded
        result = subprocess.run(
            ['launchctl', 'list', service_label],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print("   ✅ LaunchD service is loaded")
            output_lines = result.stdout.strip().split('\n')
            for line in output_lines:
                if line.strip():
                    print(f"   📊 {line}")
        else:
            print("   ⚠️  LaunchD service is not currently loaded")
            print(f"   ℹ️  This is normal if not manually loaded: {result.stderr.strip()}")
        
        # Check service file permissions
        plist_path = "/Users/i_kawano/Documents/training_waitnum_analysis/com.user.gym.analysis.weekly.plist"
        if os.path.exists(plist_path):
            stat_info = os.stat(plist_path)
            permissions = oct(stat_info.st_mode)[-3:]
            print(f"   ✅ Service file permissions: {permissions}")
            
            if permissions in ['644', '755']:
                print("   ✅ Permissions are appropriate for LaunchD")
            else:
                print("   ⚠️  Permissions may need adjustment for LaunchD")
        
        return True
        
    except subprocess.TimeoutExpired:
        print("   ❌ LaunchD service check timed out")
        return False
    except Exception as e:
        print(f"   ❌ LaunchD service test error: {e}")
        return False


def test_automation_script_execution():
    """Test direct automation script execution"""
    print("\n🔍 Testing Automation Script Execution...")
    
    script_path = "/Users/i_kawano/Documents/training_waitnum_analysis/weekly_automation.py"
    python_path = "/Users/i_kawano/.pyenv/versions/3.11.6/bin/python3"
    
    # Verify paths exist
    if not os.path.exists(script_path):
        print(f"   ❌ Automation script not found: {script_path}")
        return False
    
    if not os.path.exists(python_path):
        print(f"   ❌ Python executable not found: {python_path}")
        # Try system python as fallback
        python_path = "/usr/bin/python3"
        if os.path.exists(python_path):
            print(f"   ℹ️  Using system Python: {python_path}")
        else:
            print("   ❌ No suitable Python executable found")
            return False
    
    try:
        # Test script execution with --weekly flag
        print("   🚀 Testing automation script execution...")
        
        result = subprocess.run(
            [python_path, script_path, '--weekly'],
            capture_output=True,
            text=True,
            timeout=30,
            cwd="/Users/i_kawano/Documents/training_waitnum_analysis"
        )
        
        print(f"   📊 Script exit code: {result.returncode}")
        
        if result.stdout:
            stdout_lines = result.stdout.strip().split('\n')
            print(f"   📝 Output preview ({len(stdout_lines)} lines):")
            for line in stdout_lines[-5:]:  # Show last 5 lines
                print(f"     {line}")
        
        if result.stderr:
            stderr_lines = result.stderr.strip().split('\n')
            print(f"   ⚠️  Error output ({len(stderr_lines)} lines):")
            for line in stderr_lines[-3:]:  # Show last 3 error lines
                print(f"     {line}")
        
        if result.returncode == 0:
            print("   ✅ Automation script executed successfully")
            return True
        else:
            print(f"   ❌ Automation script failed with code {result.returncode}")
            return False
            
    except subprocess.TimeoutExpired:
        print("   ❌ Automation script execution timed out (>30s)")
        return False
    except Exception as e:
        print(f"   ❌ Script execution test error: {e}")
        return False


def test_log_file_analysis():
    """Analyze automation log files for issues"""
    print("\n🔍 Testing Log File Analysis...")
    
    log_files = [
        "/Users/i_kawano/Documents/training_waitnum_analysis/automation.log",
        "/Users/i_kawano/Documents/training_waitnum_analysis/automation_output.log",
        "/Users/i_kawano/Documents/training_waitnum_analysis/automation_error.log"
    ]
    
    log_analysis = {}
    
    for log_file in log_files:
        log_name = os.path.basename(log_file)
        
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                lines = content.strip().split('\n') if content.strip() else []
                
                # Analyze log content
                error_lines = [line for line in lines if 'ERROR' in line or 'エラー' in line]
                warning_lines = [line for line in lines if 'WARNING' in line or '⚠️' in line]
                success_lines = [line for line in lines if '✅' in line or 'SUCCESS' in line]
                
                log_analysis[log_name] = {
                    'exists': True,
                    'total_lines': len(lines),
                    'errors': len(error_lines),
                    'warnings': len(warning_lines),
                    'successes': len(success_lines),
                    'last_entries': lines[-3:] if lines else []
                }
                
                print(f"   📊 {log_name}: {len(lines)} lines, {len(error_lines)} errors, {len(warning_lines)} warnings")
                
                # Show recent critical entries
                if error_lines:
                    print(f"     ❌ Recent errors: {len(error_lines)}")
                    for error in error_lines[-2:]:  # Show last 2 errors
                        print(f"       {error[:100]}...")
                
            except Exception as e:
                log_analysis[log_name] = {'exists': True, 'error': str(e)}
                print(f"   ❌ Error reading {log_name}: {e}")
        else:
            log_analysis[log_name] = {'exists': False}
            print(f"   ℹ️  {log_name}: Not found (may not have run yet)")
    
    return log_analysis


def test_backup_system():
    """Test backup system functionality"""
    print("\n🔍 Testing Backup System...")
    
    backup_dir = "/Users/i_kawano/Documents/training_waitnum_analysis/backups"
    
    if not os.path.exists(backup_dir):
        print(f"   ❌ Backup directory not found: {backup_dir}")
        return False
    
    try:
        # List backup files
        backup_files = [f for f in os.listdir(backup_dir) if f.startswith('memo_backup_')]
        backup_files.sort(reverse=True)  # Most recent first
        
        print(f"   📊 Found {len(backup_files)} backup files")
        
        if backup_files:
            # Analyze recent backups
            recent_backups = backup_files[:5]
            print("   📝 Recent backups:")
            
            for backup_file in recent_backups:
                backup_path = os.path.join(backup_dir, backup_file)
                stat_info = os.stat(backup_path)
                size = stat_info.st_size
                mtime = datetime.fromtimestamp(stat_info.st_mtime)
                
                print(f"     {backup_file}: {size} bytes, {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Check if backup contains actual data
                with open(backup_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "混雜状況" in content or "混雑状況" in content:
                    print(f"       ✅ Contains gym data")
                else:
                    print(f"       ⚠️  No gym data found")
            
            print("   ✅ Backup system is operational")
            return True
        else:
            print("   ⚠️  No backup files found (system may not have run recently)")
            return False
            
    except Exception as e:
        print(f"   ❌ Backup system test error: {e}")
        return False


def test_data_processing_accuracy():
    """Test data processing accuracy with known inputs"""
    print("\n🔍 Testing Data Processing Accuracy...")
    
    automation = GymAnalysisAutomation()
    
    # Test with controlled input
    test_memo = """<div>フィットプレイス24練馬早宮<br></div>
<div>混雜状況 15人 やや空いています 08:30時点 08/04<br></div>
<div>混雑状況 25人 やや混んでいます 12:00時点<br></div>
<div>混雜状況 35人 混んでいます 18:30時点<br></div>
<div>その他のメモ内容<br></div>"""
    
    try:
        # Extract data
        gym_data, processed_patterns = automation.extract_gym_data(test_memo)
        
        print(f"   📊 Extracted {len(gym_data)} data points")
        print(f"   📊 Found {len(processed_patterns)} processable patterns")
        
        # Verify extracted data accuracy
        expected_data = [
            {'count': 15, 'hour': 8, 'minute': 30, 'status_code': 4},  # やや空いています
            {'count': 25, 'hour': 12, 'minute': 0, 'status_code': 3},   # やや混んでいます  
            {'count': 35, 'hour': 18, 'minute': 30, 'status_code': 2}   # 混んでいます
        ]
        
        accuracy_issues = []
        
        for i, (actual, expected) in enumerate(zip(gym_data, expected_data)):
            if actual['count'] != expected['count']:
                accuracy_issues.append(f"Record {i}: Count mismatch - expected {expected['count']}, got {actual['count']}")
            
            if actual['hour'] != expected['hour']:
                accuracy_issues.append(f"Record {i}: Hour mismatch - expected {expected['hour']}, got {actual['hour']}")
            
            if actual['status_code'] != expected['status_code']:
                accuracy_issues.append(f"Record {i}: Status code mismatch - expected {expected['status_code']}, got {actual['status_code']}")
        
        if accuracy_issues:
            print("   ❌ Data processing accuracy issues:")
            for issue in accuracy_issues:
                print(f"     {issue}")
            return False
        else:
            print("   ✅ Data processing accuracy validated")
            
            # Test time boundary validation
            invalid_memo = "混雜状況 15人 やや空いています 25:70時点"
            invalid_data, _ = automation.extract_gym_data(invalid_memo)
            
            if invalid_data:
                print("   ⚠️  System accepts invalid time values - needs validation")
                return False
            else:
                print("   ✅ Invalid time values properly rejected")
            
            return True
            
    except Exception as e:
        print(f"   ❌ Data processing accuracy test error: {e}")
        return False


def test_system_resilience():
    """Test system resilience under various conditions"""
    print("\n🔍 Testing System Resilience...")
    
    automation = GymAnalysisAutomation()
    
    resilience_tests = [
        ("Empty memo content", ""),
        ("Only HTML tags", "<div><br></div>"),
        ("No matching patterns", "今日は良い天気です。"),
        ("Mixed valid/invalid data", "混雜状況 15人 やや空いています 08:30時点\n混雜状況 abc人 エラー 99:99時点"),
        ("Very long memo", "A" * 10000 + "\n混雜状況 15人 やや空いています 08:30時点"),
    ]
    
    passed_tests = 0
    total_tests = len(resilience_tests)
    
    for test_name, test_input in resilience_tests:
        try:
            gym_data, processed_patterns = automation.extract_gym_data(test_input)
            print(f"   ✅ {test_name}: Processed without error ({len(gym_data)} data points)")
            passed_tests += 1
        except Exception as e:
            print(f"   ❌ {test_name}: Failed with error - {e}")
    
    resilience_score = passed_tests / total_tests * 100
    print(f"   📊 Resilience score: {resilience_score:.1f}% ({passed_tests}/{total_tests} tests passed)")
    
    return resilience_score >= 80.0


def run_system_tests():
    """Run comprehensive system-level tests"""
    print("=" * 80)
    print("GYM AUTOMATION SYSTEM - SYSTEM-LEVEL TESTING")
    print("=" * 80)
    print(f"Test execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("LaunchD Service Status", test_launchd_service_status),
        ("Automation Script Execution", test_automation_script_execution),
        ("Log File Analysis", test_log_file_analysis),
        ("Backup System", test_backup_system),
        ("Data Processing Accuracy", test_data_processing_accuracy),
        ("System Resilience", test_system_resilience),
    ]
    
    results = {}
    passed = 0
    
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
    print("SYSTEM-LEVEL TESTS SUMMARY") 
    print("=" * 80)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    success_rate = passed / len(tests) * 100
    print(f"\nSystem Tests: {passed}/{len(tests)} passed ({success_rate:.1f}%)")
    
    # System readiness assessment
    print("\n" + "=" * 80)
    print("AUTOMATION READINESS ASSESSMENT")
    print("=" * 80)
    
    critical_tests = ["Automation Script Execution", "Data Processing Accuracy"]
    critical_passed = sum(1 for test in critical_tests if results.get(test, False))
    
    if critical_passed == len(critical_tests):
        print("🟢 SYSTEM READY: Core automation functionality is operational")
    else:
        print("🔴 SYSTEM NOT READY: Critical automation components have issues")
    
    if results.get("LaunchD Service Status", False):
        print("🟢 SCHEDULING READY: LaunchD service is properly configured")
    else:
        print("🟡 SCHEDULING NEEDS SETUP: LaunchD service may need manual loading")
    
    if results.get("Backup System", False):
        print("🟢 DATA SAFETY: Backup system is operational")
    else:
        print("🟡 DATA SAFETY: Backup system needs attention")
    
    print(f"\nTest execution completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return results


if __name__ == "__main__":
    results = run_system_tests()
    
    # Generate system reliability report
    print("\n" + "=" * 80)
    print("SYSTEM RELIABILITY RECOMMENDATIONS")
    print("=" * 80)
    
    if not results.get("Automation Script Execution", True):
        print("🔧 CRITICAL: Fix automation script execution issues before deploying")
    
    if not results.get("Data Processing Accuracy", True):
        print("🔧 HIGH: Address data processing accuracy issues for reliable data")
    
    if not results.get("LaunchD Service Status", True):
        print("🔧 MEDIUM: Load LaunchD service for automated scheduling")
        print("   Command: launchctl load ~/Documents/training_waitnum_analysis/com.user.gym.analysis.weekly.plist")
    
    if not results.get("Backup System", True):
        print("🔧 MEDIUM: Verify backup system functionality for data recovery")
    
    total_passed = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    print(f"\n📊 Overall System Health: {total_passed}/{total_tests} components operational")
    
    if total_passed >= total_tests * 0.9:
        print("🟢 EXCELLENT: System is highly reliable and ready for production")
    elif total_passed >= total_tests * 0.8:
        print("🟡 GOOD: System is mostly reliable with minor issues to address")
    elif total_passed >= total_tests * 0.6:
        print("🟡 FAIR: System has moderate issues that should be addressed")
    else:
        print("🔴 POOR: System has significant reliability issues requiring immediate attention")