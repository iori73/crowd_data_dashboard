#!/usr/bin/env python3
"""
Comprehensive Test Suite for Gym Crowding Analysis Automation System
- Unit Tests for all core functionality
- Integration Tests for data pipeline
- Error Handling and Security Tests
- Data Integrity Validation
"""

import unittest
import tempfile
import os
import csv
import re
import json
import shutil
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, mock_open
import subprocess

# Import the main automation class
import sys
sys.path.append('/Users/i_kawano/Documents/training_waitnum_analysis')
from weekly_automation import GymAnalysisAutomation


class TestRegexPatternMatching(unittest.TestCase):
    """Test the core regex pattern matching functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.pattern = r"混[雜雑]状況\s*(\d+)人\s*([^\d]*?)\s*(\d{1,2}):(\d{2})時点(?:\s*(\d{2}/\d{2}))?"
        
    def test_basic_pattern_matching(self):
        """Test basic pattern matching with various formats"""
        test_cases = [
            # Traditional format
            ("混雜状況 15人 やや空いています 08:30時点", (15, "やや空いています", 8, 30, None)),
            # Simplified format
            ("混雑状況 25人 やや混んでいます 12:00時点", (25, "やや混んでいます", 12, 0, None)),
            # With date
            ("混雜状況 8人 空いています 14:30時点 08/04", (8, "空いています", 14, 30, "08/04")),
            # Various spacing
            ("混雜状況15人やや空いています08:30時点", (15, "やや空いています", 8, 30, None)),
            ("混雜状況  30人  少し混んでいます  18:00時点", (30, "少し混んでいます", 18, 0, None)),
        ]
        
        for test_text, expected in test_cases:
            with self.subTest(test_text=test_text):
                match = re.search(self.pattern, test_text)
                self.assertIsNotNone(match, f"Pattern should match: {test_text}")
                
                count = int(match.group(1))
                status = match.group(2).strip()
                hour = int(match.group(3))
                minute = int(match.group(4))
                date_part = match.group(5)
                
                self.assertEqual(count, expected[0])
                self.assertEqual(status, expected[1])
                self.assertEqual(hour, expected[2])
                self.assertEqual(minute, expected[3])
                self.assertEqual(date_part, expected[4])
    
    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        edge_cases = [
            # Single digit time
            ("混雜状況 5人 空いています 9:05時点", (5, "空いています", 9, 5, None)),
            # Large numbers
            ("混雜状況 99人 非常に混んでいます 23:59時点", (99, "非常に混んでいます", 23, 59, None)),
            # Various status texts
            ("混雜状況 0人 完全に空いています 6:00時点", (0, "完全に空いています", 6, 0, None)),
            # Complex status text with special characters
            ("混雜状況 15人 やや空いています（余裕あり） 10:30時点", (15, "やや空いています（余裕あり）", 10, 30, None)),
        ]
        
        for test_text, expected in edge_cases:
            with self.subTest(test_text=test_text):
                match = re.search(self.pattern, test_text)
                self.assertIsNotNone(match, f"Pattern should match edge case: {test_text}")
    
    def test_invalid_patterns(self):
        """Test patterns that should NOT match"""
        invalid_cases = [
            "混雜状況人やや空いています08:30時点",  # Missing count
            "混雜状況 15 やや空いています 08:30時点",  # Missing 人
            "混雜状況 15人 やや空いています 25:30時点",  # Invalid hour
            "混雜状況 15人 やや空いています 08:60時点",  # Invalid minute
            "状況 15人 やや空いています 08:30時点",  # Missing 混雜/混雑
            "",  # Empty string
            "混雜状況 abc人 やや空いています 08:30時点",  # Non-numeric count
        ]
        
        for test_text in invalid_cases:
            with self.subTest(test_text=test_text):
                match = re.search(self.pattern, test_text)
                self.assertIsNone(match, f"Pattern should NOT match invalid case: {test_text}")


class TestDataExtraction(unittest.TestCase):
    """Test data extraction and processing functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        # Override paths for testing
        self.automation.project_dir = self.temp_dir
        self.automation.csv_file = os.path.join(self.temp_dir, "test_data.csv")
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    def test_extract_gym_data_basic(self):
        """Test basic gym data extraction"""
        memo_content = """
        <div>フィットプレイス24練馬早宮<br></div>
        <div>混雜状況 15人 やや空いています 08:30時点<br></div>
        <div>混雜状況 25人 やや混んでいます 12:00時点<br></div>
        """
        
        gym_data, processed_patterns = self.automation.extract_gym_data(memo_content)
        
        self.assertEqual(len(gym_data), 2)
        self.assertEqual(len(processed_patterns), 2)
        
        # Check first record
        first_record = gym_data[0]
        self.assertEqual(first_record['count'], 15)
        self.assertEqual(first_record['hour'], 8)
        self.assertEqual(first_record['status_code'], 4)  # やや空いています
        
        # Check second record
        second_record = gym_data[1]
        self.assertEqual(second_record['count'], 25)
        self.assertEqual(second_record['hour'], 12)
        self.assertEqual(second_record['status_code'], 3)  # やや混んでいます
    
    def test_status_code_mapping(self):
        """Test status code mapping logic"""
        test_cases = [
            ("空いています", 5, "空いています（~10人）"),
            ("やや空いています", 4, "やや空いています（~20人）"),
            ("やや混んでいます", 3, "少し混んでいます（~30人）"),
            ("少し混んでいます", 3, "少し混んでいます（~30人）"),
            ("混んでいます", 2, "混んでいます（~40人）"),
        ]
        
        for status_text, expected_code, expected_label in test_cases:
            memo_content = f"混雜状況 20人 {status_text} 12:00時点"
            gym_data, _ = self.automation.extract_gym_data(memo_content)
            
            self.assertEqual(len(gym_data), 1)
            self.assertEqual(gym_data[0]['status_code'], expected_code)
            self.assertEqual(gym_data[0]['status_label'], expected_label)
    
    def test_date_parsing_with_explicit_date(self):
        """Test date parsing when explicit date is provided"""
        memo_content = "混雜状況 15人 やや空いています 08:30時点 08/04"
        gym_data, _ = self.automation.extract_gym_data(memo_content)
        
        self.assertEqual(len(gym_data), 1)
        record = gym_data[0]
        
        # Should parse to current year with provided month/day
        expected_date = datetime(datetime.now().year, 8, 4).date()
        self.assertEqual(record['date'], str(expected_date))
    
    def test_html_tag_removal(self):
        """Test HTML tag removal from memo content"""
        memo_content = """
        <div><b>フィットプレイス24練馬早宮</b><br></div>
        <div><span style="color: red;">混雜状況 15人 やや空いています 08:30時点</span><br></div>
        """
        
        gym_data, _ = self.automation.extract_gym_data(memo_content)
        self.assertEqual(len(gym_data), 1)
        self.assertEqual(gym_data[0]['count'], 15)


class TestCSVOperations(unittest.TestCase):
    """Test CSV file operations and data management"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        self.automation.project_dir = self.temp_dir
        self.automation.csv_file = os.path.join(self.temp_dir, "test_data.csv")
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    def test_csv_creation_and_writing(self):
        """Test CSV file creation and data writing"""
        test_data = [{
            "datetime": "2025-08-05 10:30:00",
            "date": "2025-08-05",
            "time": "10:30",
            "hour": 10,
            "weekday": "Monday",
            "count": 15,
            "status_label": "やや空いています（~20人）",
            "status_code": 4,
            "status_min": 11,
            "status_max": 20,
            "raw_text": "混雜状況 15人 やや空いています 10:30時点",
        }]
        
        new_count, total_count = self.automation.update_csv(test_data)
        
        self.assertEqual(new_count, 1)
        self.assertEqual(total_count, 1)
        self.assertTrue(os.path.exists(self.automation.csv_file))
        
        # Verify CSV content
        with open(self.automation.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['count'], '15')
        self.assertEqual(rows[0]['status_code'], '4')
    
    def test_duplicate_prevention(self):
        """Test that duplicate datetime entries are prevented"""
        test_data1 = [{
            "datetime": "2025-08-05 10:30:00",
            "date": "2025-08-05",
            "time": "10:30",
            "hour": 10,
            "weekday": "Monday",
            "count": 15,
            "status_label": "やや空いています（~20人）",
            "status_code": 4,
            "status_min": 11,
            "status_max": 20,
            "raw_text": "混雜状況 15人 やや空いています 10:30時点",
        }]
        
        test_data2 = [{
            "datetime": "2025-08-05 10:30:00",  # Same datetime
            "date": "2025-08-05",
            "time": "10:30",
            "hour": 10,
            "weekday": "Monday",
            "count": 20,  # Different count
            "status_label": "やや空いています（~20人）",
            "status_code": 4,
            "status_min": 11,
            "status_max": 20,
            "raw_text": "混雜状況 20人 やや空いています 10:30時点",
        }]
        
        # First write
        new_count1, total_count1 = self.automation.update_csv(test_data1)
        self.assertEqual(new_count1, 1)
        self.assertEqual(total_count1, 1)
        
        # Second write with duplicate datetime
        new_count2, total_count2 = self.automation.update_csv(test_data2)
        self.assertEqual(new_count2, 0)  # No new data added
        self.assertEqual(total_count2, 1)  # Total remains the same
    
    def test_chronological_sorting(self):
        """Test that CSV data is sorted chronologically"""
        test_data = [
            {
                "datetime": "2025-08-05 12:00:00",
                "date": "2025-08-05", "time": "12:00", "hour": 12, "weekday": "Monday",
                "count": 25, "status_label": "少し混んでいます（~30人）", "status_code": 3,
                "status_min": 21, "status_max": 30, "raw_text": "混雜状況 25人 少し混んでいます 12:00時点"
            },
            {
                "datetime": "2025-08-05 08:00:00",  # Earlier time
                "date": "2025-08-05", "time": "08:00", "hour": 8, "weekday": "Monday",
                "count": 10, "status_label": "空いています（~10人）", "status_code": 5,
                "status_min": 0, "status_max": 10, "raw_text": "混雜状況 10人 空いています 08:00時点"
            }
        ]
        
        self.automation.update_csv(test_data)
        
        # Read back and verify order
        existing_data, _ = self.automation.get_existing_csv_data()
        self.assertEqual(len(existing_data), 2)
        
        # Should be sorted chronologically (08:00 before 12:00)
        self.assertEqual(existing_data[0]['datetime'], "2025-08-05 08:00:00")
        self.assertEqual(existing_data[1]['datetime'], "2025-08-05 12:00:00")


class TestMemoCleaningFunctionality(unittest.TestCase):
    """Test memo cleaning and pattern removal functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        self.automation.project_dir = self.temp_dir
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    def test_pattern_removal_basic(self):
        """Test basic pattern removal from memo content"""
        memo_content = """<div>フィットプレイス24練馬早宮<br></div>
<div>混雜状況 15人 やや空いています 08:30時点<br></div>
<div>混雜状況 25人 やや混んでいます 12:00時点<br></div>
<div>その他のメモ内容<br></div>"""
        
        processed_patterns = [
            "混雜状況 15人 やや空いています 08:30時点",
            "混雜状況 25人 やや混んでいます 12:00時点"
        ]
        
        cleaned_content = self.automation.clean_processed_patterns_from_memo(
            memo_content, processed_patterns
        )
        
        # Should remove processed patterns but keep other content
        self.assertNotIn("混雜状況 15人 やや空いています 08:30時点", cleaned_content)
        self.assertNotIn("混雜状況 25人 やや混んでいます 12:00時点", cleaned_content)
        self.assertIn("フィットプレイス24練馬早宮", cleaned_content)
        self.assertIn("その他のメモ内容", cleaned_content)
    
    def test_empty_patterns_handling(self):
        """Test handling of empty processed patterns list"""
        memo_content = "<div>フィットプレイス24練馬早宮<br></div>"
        processed_patterns = []
        
        cleaned_content = self.automation.clean_processed_patterns_from_memo(
            memo_content, processed_patterns
        )
        
        # Should return original content when no patterns to remove
        self.assertIn("フィットプレイス24練馬早宮", cleaned_content)
    
    def test_complete_pattern_removal(self):
        """Test complete removal of all patterns"""
        memo_content = """<div>フィットプレイス24練馬早宮<br></div>
<div>混雜状況 15人 やや空いています 08:30時点<br></div>"""
        
        processed_patterns = ["混雜状況 15人 やや空いています 08:30時点"]
        
        cleaned_content = self.automation.clean_processed_patterns_from_memo(
            memo_content, processed_patterns
        )
        
        # Should maintain basic structure even when all data is removed
        self.assertIn("フィットプレイス24練馬早宮", cleaned_content)
        self.assertNotIn("混雜状況", cleaned_content)
    
    def test_backup_creation(self):
        """Test backup file creation during memo operations"""
        test_content = "Test memo content for backup"
        
        backup_file = self.automation.backup_memo_content(test_content)
        
        self.assertIsNotNone(backup_file)
        self.assertTrue(os.path.exists(backup_file))
        
        with open(backup_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        self.assertEqual(content, test_content)


class TestErrorHandlingAndRecovery(unittest.TestCase):
    """Test error handling and recovery mechanisms"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        self.automation.project_dir = self.temp_dir
        self.automation.csv_file = os.path.join(self.temp_dir, "test_data.csv")
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    @patch('subprocess.run')
    def test_applescript_timeout_handling(self, mock_subprocess):
        """Test handling of AppleScript timeout scenarios"""
        mock_subprocess.side_effect = subprocess.TimeoutExpired(['osascript'], 15)
        
        result = self.automation.get_memo_content()
        
        # Should handle timeout gracefully and return None
        self.assertIsNone(result)
    
    @patch('subprocess.run')
    def test_applescript_error_handling(self, mock_subprocess):
        """Test handling of AppleScript execution errors"""
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stderr = "AppleScript execution error"
        mock_result.stdout = ""
        mock_subprocess.return_value = mock_result
        
        result = self.automation.get_memo_content()
        
        # Should handle AppleScript errors gracefully
        self.assertIsNone(result)
    
    def test_corrupted_csv_handling(self):
        """Test handling of corrupted CSV files"""
        # Create a corrupted CSV file
        with open(self.automation.csv_file, 'w', encoding='utf-8') as f:
            f.write("Invalid CSV content\nwithout proper headers\n")
        
        existing_data, existing_datetimes = self.automation.get_existing_csv_data()
        
        # Should handle corrupted CSV gracefully
        self.assertEqual(len(existing_data), 0)
        self.assertEqual(len(existing_datetimes), 0)
    
    def test_invalid_regex_matches(self):
        """Test handling of invalid data in regex matches"""
        memo_content = """
        混雜状況 abc人 やや空いています 08:30時点
        混雜状況 15人 やや空いています 25:30時点
        混雜状況 20人 やや空いています 08:70時点
        """
        
        gym_data, processed_patterns = self.automation.extract_gym_data(memo_content)
        
        # Should skip invalid matches and continue processing
        self.assertEqual(len(gym_data), 0)  # All matches should be invalid
        self.assertEqual(len(processed_patterns), 0)
    
    def test_directory_creation_failure(self):
        """Test handling of directory creation failures"""
        # Make directory creation fail by setting invalid permissions
        invalid_path = "/root/nonexistent/path"
        self.automation.backup_dir = invalid_path
        
        # Should handle directory creation failure gracefully
        backup_file = self.automation.backup_memo_content("test content")
        self.assertIsNone(backup_file)


class TestSecurityAndInputValidation(unittest.TestCase):
    """Test security aspects and input validation"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        self.automation.project_dir = self.temp_dir
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    def test_applescript_injection_prevention(self):
        """Test prevention of AppleScript injection attacks"""
        malicious_inputs = [
            'test"; tell application "System Events" to restart; "',
            "test' & (do shell script \"rm -rf /\") & '",
            'test\"; osascript -e "beep"; \"',
            "test\n tell application \"Terminal\" to activate",
        ]
        
        for malicious_input in malicious_inputs:
            # Test that malicious input doesn't break the regex pattern
            gym_data, _ = self.automation.extract_gym_data(malicious_input)
            self.assertEqual(len(gym_data), 0)
    
    def test_file_path_validation(self):
        """Test file path validation and sanitization"""
        # Test with potentially dangerous file paths
        dangerous_paths = [
            "../../../etc/passwd",
            "/etc/passwd",
            "~/../../etc/passwd",
            "file:///etc/passwd",
        ]
        
        for dangerous_path in dangerous_paths:
            # Ensure system doesn't attempt to access dangerous paths
            self.automation.csv_file = dangerous_path
            existing_data, _ = self.automation.get_existing_csv_data()
            # Should return empty data for non-existent/inaccessible files
            self.assertEqual(len(existing_data), 0)
    
    def test_large_input_handling(self):
        """Test handling of unusually large inputs"""
        # Create very large memo content
        large_content = "A" * 1000000  # 1MB of data
        large_content += "混雜状況 15人 やや空いています 08:30時点"
        
        # Should handle large input without crashing
        gym_data, processed_patterns = self.automation.extract_gym_data(large_content)
        self.assertEqual(len(gym_data), 1)
        self.assertEqual(len(processed_patterns), 1)
    
    def test_special_character_handling(self):
        """Test handling of special characters and encoding"""
        special_content = """
        混雜状況 15人 やや空いています（特殊文字：™®©） 08:30時点
        混雜状況 20人 ⭐️空いています⭐️ 12:00時点
        混雜状況 25人 🏃‍♂️少し混んでいます🏃‍♂️ 18:00時点
        """
        
        gym_data, processed_patterns = self.automation.extract_gym_data(special_content)
        
        # Should handle special characters properly
        self.assertEqual(len(gym_data), 3)
        self.assertTrue(all(record['count'] > 0 for record in gym_data))


class TestDataIntegrityAndValidation(unittest.TestCase):
    """Test data integrity and validation across the system"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        self.automation.project_dir = self.temp_dir
        self.automation.csv_file = os.path.join(self.temp_dir, "test_data.csv")
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    def test_data_consistency_across_pipeline(self):
        """Test data consistency from extraction to CSV storage"""
        memo_content = "混雜状況 15人 やや空いています 08:30時点"
        
        # Extract data
        gym_data, processed_patterns = self.automation.extract_gym_data(memo_content)
        
        # Store in CSV
        new_count, total_count = self.automation.update_csv(gym_data)
        
        # Read back from CSV
        existing_data, _ = self.automation.get_existing_csv_data()
        
        # Verify consistency
        self.assertEqual(len(gym_data), 1)
        self.assertEqual(new_count, 1)
        self.assertEqual(len(existing_data), 1)
        
        original = gym_data[0]
        stored = existing_data[0]
        
        self.assertEqual(original['count'], int(stored['count']))
        self.assertEqual(original['hour'], int(stored['hour']))
        self.assertEqual(original['status_code'], int(stored['status_code']))
    
    def test_boundary_value_validation(self):
        """Test boundary values for all numeric fields"""
        boundary_cases = [
            # Edge cases for count
            ("混雜状況 0人 空いています 08:30時点", 0),
            ("混雜状況 1人 空いています 08:30時点", 1),
            ("混雜状況 999人 非常に混んでいます 08:30時点", 999),
            
            # Edge cases for time
            ("混雜状況 15人 やや空いています 0:00時点", (0, 0)),
            ("混雜状況 15人 やや空いています 23:59時点", (23, 59)),
            ("混雜状況 15人 やや空いています 1:01時点", (1, 1)),
        ]
        
        for memo_content, expected in boundary_cases:
            gym_data, _ = self.automation.extract_gym_data(memo_content)
            self.assertEqual(len(gym_data), 1)
            
            record = gym_data[0]
            if isinstance(expected, int):
                self.assertEqual(record['count'], expected)
            else:
                self.assertEqual(record['hour'], expected[0])
                self.assertEqual(record['time'].split(':')[1], f"{expected[1]:02d}")
    
    def test_datetime_format_consistency(self):
        """Test datetime format consistency across all records"""
        memo_content = """
        混雜状況 15人 やや空いています 08:30時点
        混雜状況 20人 少し混んでいます 12:05時点
        混雜状況 25人 混んでいます 23:59時点
        """
        
        gym_data, _ = self.automation.extract_gym_data(memo_content)
        
        for record in gym_data:
            # Validate datetime format
            datetime_obj = datetime.strptime(record['datetime'], '%Y-%m-%d %H:%M:%S')
            self.assertIsInstance(datetime_obj, datetime)
            
            # Validate date format
            date_obj = datetime.strptime(record['date'], '%Y-%m-%d').date()
            self.assertIsInstance(date_obj, type(datetime.now().date()))
            
            # Validate time format
            time_match = re.match(r'^\d{2}:\d{2}$', record['time'])
            self.assertIsNotNone(time_match)
    
    def test_status_code_range_validation(self):
        """Test that status codes are within expected ranges"""
        memo_content = """
        混雜状況 5人 空いています 08:30時点
        混雜状況 15人 やや空いています 09:30時点
        混雜状況 25人 少し混んでいます 10:30時点
        混雜状況 35人 混んでいます 11:30時点
        """
        
        gym_data, _ = self.automation.extract_gym_data(memo_content)
        
        for record in gym_data:
            # Status codes should be between 2-5
            self.assertGreaterEqual(record['status_code'], 2)
            self.assertLessEqual(record['status_code'], 5)
            
            # Status ranges should be logical
            self.assertLessEqual(record['status_min'], record['status_max'])
            self.assertGreaterEqual(record['status_min'], 0)
            self.assertLessEqual(record['status_max'], 50)  # Reasonable upper bound


class TestSystemIntegration(unittest.TestCase):
    """Test system integration and end-to-end functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        self.automation.project_dir = self.temp_dir
        self.automation.csv_file = os.path.join(self.temp_dir, "test_data.csv")
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        self.automation.log_file = os.path.join(self.temp_dir, "test.log")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    @patch.object(GymAnalysisAutomation, 'get_memo_content')
    def test_full_automation_pipeline(self, mock_get_memo):
        """Test the complete automation pipeline from memo to CSV"""
        # Mock memo content
        mock_memo_content = """
        <div>フィットプレイス24練馬早宮<br></div>
        <div>混雜状況 15人 やや空いています 08:30時点<br></div>
        <div>混雜状況 25人 少し混んでいます 12:00時点<br></div>
        <div>混雜状況 10人 空いています 18:30時点<br></div>
        """
        mock_get_memo.return_value = mock_memo_content
        
        # Run automation without memo cleaning
        result = self.automation.run_weekly_automation(clean_memo=False)
        
        self.assertTrue(result)
        
        # Verify CSV was created and populated
        self.assertTrue(os.path.exists(self.automation.csv_file))
        
        existing_data, _ = self.automation.get_existing_csv_data()
        self.assertEqual(len(existing_data), 3)
        
        # Verify data integrity
        counts = [int(record['count']) for record in existing_data]
        self.assertEqual(sorted(counts), [10, 15, 25])
    
    def test_launchd_configuration_validation(self):
        """Test LaunchD configuration file validation"""
        plist_path = "/Users/i_kawano/Documents/training_waitnum_analysis/com.user.gym.analysis.weekly.plist"
        
        # Check if plist file exists
        self.assertTrue(os.path.exists(plist_path), "LaunchD plist file should exist")
        
        # Read and validate plist content
        with open(plist_path, 'r') as f:
            content = f.read()
        
        # Verify key configuration elements
        self.assertIn("com.user.gym.analysis.weekly", content)
        self.assertIn("weekly_automation.py", content)
        self.assertIn("--weekly", content)
        self.assertIn("<integer>0</integer>", content)  # Sunday = 0
        self.assertIn("StandardOutPath", content)
        self.assertIn("StandardErrorPath", content)
    
    @patch.object(GymAnalysisAutomation, 'get_memo_content')
    @patch.object(GymAnalysisAutomation, 'clean_memo_content_with_patterns')
    def test_memo_cleaning_integration(self, mock_clean_memo, mock_get_memo):
        """Test integration of memo cleaning with data processing"""
        mock_memo_content = "混雜状況 15人 やや空いています 08:30時点"
        mock_get_memo.return_value = mock_memo_content
        mock_clean_memo.return_value = True
        
        result = self.automation.run_weekly_automation(clean_memo=True)
        
        self.assertTrue(result)
        mock_clean_memo.assert_called_once()
        
        # Verify processed patterns were passed to cleaning function
        call_args = mock_clean_memo.call_args[0]
        processed_patterns = call_args[0]
        self.assertEqual(len(processed_patterns), 1)
        self.assertIn("混雜状況 15人 やや空いています 08:30時点", processed_patterns[0])


class TestSystemReliabilityAndPerformance(unittest.TestCase):
    """Test system reliability and performance characteristics"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.automation = GymAnalysisAutomation()
        self.automation.project_dir = self.temp_dir
        self.automation.csv_file = os.path.join(self.temp_dir, "test_data.csv")
        self.automation.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.automation.backup_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir)
    
    def test_large_dataset_handling(self):
        """Test handling of large datasets"""
        # Create a large dataset
        large_memo_content = ""
        expected_count = 100
        
        for i in range(expected_count):
            hour = 8 + (i % 12)
            minute = i % 60
            count = 10 + (i % 30)
            large_memo_content += f"混雜状況 {count}人 やや空いています {hour:02d}:{minute:02d}時点\n"
        
        # Test extraction performance
        start_time = datetime.now()
        gym_data, processed_patterns = self.automation.extract_gym_data(large_memo_content)
        extraction_time = (datetime.now() - start_time).total_seconds()
        
        self.assertEqual(len(gym_data), expected_count)
        self.assertEqual(len(processed_patterns), expected_count)
        self.assertLess(extraction_time, 5.0)  # Should complete within 5 seconds
        
        # Test CSV writing performance
        start_time = datetime.now()
        new_count, total_count = self.automation.update_csv(gym_data)
        csv_time = (datetime.now() - start_time).total_seconds()
        
        self.assertEqual(new_count, expected_count)
        self.assertEqual(total_count, expected_count)
        self.assertLess(csv_time, 3.0)  # Should complete within 3 seconds
    
    def test_memory_usage_optimization(self):
        """Test memory usage with repeated operations"""
        import tracemalloc
        
        tracemalloc.start()
        
        # Perform multiple automation cycles
        for i in range(10):
            memo_content = f"混雜状況 {10+i}人 やや空いています 08:{30+i:02d}時点"
            gym_data, _ = self.automation.extract_gym_data(memo_content)
            self.automation.update_csv(gym_data)
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        # Memory usage should be reasonable (less than 10MB peak)
        self.assertLess(peak, 10 * 1024 * 1024)
    
    def test_concurrent_access_safety(self):
        """Test safety of concurrent file access operations"""
        import threading
        import time
        
        results = []
        errors = []
        
        def write_data(thread_id):
            try:
                memo_content = f"混雜状況 {thread_id}人 やや空いています 08:30時点"
                gym_data, _ = self.automation.extract_gym_data(memo_content)
                # Add unique datetime to avoid duplicates
                for data in gym_data:
                    data['datetime'] = f"2025-08-05 08:{30+thread_id:02d}:00"
                new_count, total_count = self.automation.update_csv(gym_data)
                results.append((thread_id, new_count, total_count))
            except Exception as e:
                errors.append((thread_id, str(e)))
        
        # Create multiple threads
        threads = []
        for i in range(5):
            thread = threading.Thread(target=write_data, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check results
        self.assertEqual(len(errors), 0, f"Concurrent access errors: {errors}")
        self.assertEqual(len(results), 5)


def run_comprehensive_test_suite():
    """Run the complete test suite and generate a detailed report"""
    
    # Configure test discovery
    test_classes = [
        TestRegexPatternMatching,
        TestDataExtraction,
        TestCSVOperations,
        TestMemoCleaningFunctionality,
        TestErrorHandlingAndRecovery,
        TestSecurityAndInputValidation,
        TestDataIntegrityAndValidation,
        TestSystemIntegration,
        TestSystemReliabilityAndPerformance,
    ]
    
    # Create test suite
    suite = unittest.TestSuite()
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(
        verbosity=2,
        stream=sys.stdout,
        descriptions=True,
        failfast=False
    )
    
    print("=" * 80)
    print("GYM CROWDING ANALYSIS AUTOMATION - COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    print(f"Test execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    result = runner.run(suite)
    
    print("\n" + "=" * 80)
    print("TEST EXECUTION SUMMARY")
    print("=" * 80)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print("\nFAILED TESTS:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback.split('AssertionError: ')[-1].split(chr(10))[0]}")
    
    if result.errors:
        print("\nERROR TESTS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback.split(chr(10))[-2]}")
    
    print(f"\nTest execution completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_comprehensive_test_suite()
    sys.exit(0 if success else 1)