<?php 
	require_once("config.php");
	
	session_start();
	
	class Dictionary {
		private $mMysqli;
		
		public function __construct() {
			$this->mMysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
			$this->mMysqli->query ('SET NAMES utf8');
			$this->mMysqli->query ('SET CHARACTER_SET utf8_unicode_ci');
		}
		
		public function getWords($post) {
			$wordsPage = $post["wp"]-1; 				// Aktualna strona słówek
			$pageLimit = $post["pl"];					// Limit słówek na stronie
			$from = $wordsPage*$pageLimit;				// Wylicza numer pierwszego słówka do pobrania
			
			$return = "<dictionary>";
			
			// Tworzy zapytanie
			$query = "SELECT polish, other, id, unit FROM words ORDER BY polish ASC LIMIT $from, $pageLimit";
			$results = $this->mMysqli->query($query);
			
			
			while ($row = $results->fetch_array(MYSQLI_ASSOC)) {
				$id = htmlentities($row["id"]);
				$polish = htmlentities($row["polish"]);
				$other = htmlentities($row["other"]);
				$unit = htmlentities($row["unit"]);
				
				$return .= "<word>";
					$return .= "<id>" . $id . "</id>";
					$return .= "<pl><![CDATA[" . $polish . "]]></pl>";
					$return .= "<other><![CDATA[" . $other . "]]></other>";
					$return .= "<unit><![CDATA[" . $unit . "]]></unit>";
				$return .= "</word>";
			}
			
			// Pobiera dodoatkowe informacje o stronach
			$return .= $this->getOtherInformations($pageLimit);
			
			$return .= "</dictionary>";
			
			return $return;
		}
		
		private function getOtherInformations($pageLimit) {
			$query = "SELECT id FROM words";
			$results = $this->mMysqli->query($query);
			
			// Ilość słówek
			$amount = $results->num_rows;
			
			// Ilość stron
			$pages = ceil($amount/$pageLimit);
			
			$return = "<informations>";
				$return .= "<amount>" . $amount . "</amount>";
				$return .= "<pages>" . $pages . "</pages>";
			$return .= "</informations>";
			
			return $return;
		}
		
		public function addWord($post) {
			$polish = $this->mMysqli->real_escape_string($post["polish"]); $polish = trim($post["polish"]);
			$other = $this->mMysqli->real_escape_string($post["other"]); $other = trim($post["other"]);
			$unit = $this->mMysqli->real_escape_string($post["unit"]); $unit = trim($post["unit"]);
			
			// Sprawdza cyz słówko już nie istnieje
			$exist = $this->checkWord($post);
			if (!$exist) {
				$query = "INSERT INTO words (polish, other, unit) VALUE ('$polish', '$other', '$unit')";
				$result = $this->mMysqli->query($query);
				
				if ($result) {
					return "<dictionary>1</dictionary>"; 
				}
				return "<dictionary>0</dictionary>";
			}
			return "<dictionary>0</dictionary>";
		}
		
		public function deleteWord($post) {
			$id = $post["id"];
			
			$query = "DELETE FROM words WHERE id = '$id' ";
			$result = $this->mMysqli->query($query);
			
			if ($result) {
				return "<dictionary>1</dictionary>"; 
			}
			return "<dictionary>0</dictionary>"; 
		}
		
		public function editWord($post) {
			$value = $this->mMysqli->real_escape_string($post["value"]); $value = trim($post["value"]);
			$name = $this->mMysqli->real_escape_string($post["name"]); $name = trim($post["name"]);
			
			$parts = explode("/", $name);
			$table = $parts[0];
			$column = $parts[1];
			$id = $parts[2];
			
			$query = "UPDATE $table SET $column = '$value' WHERE id = '$id' ";
			$result = $this->mMysqli->query($query);
			
			if ($result) {
				return "<dictionary>1</dictionary>"; 
			}
			return "<dictionary>0</dictionary>"; 
		}
		
		// Sprawdza istnienie słówka w bazie
		private function checkWord($post) {
			$polish = $this->mMysqli->real_escape_string($post["polish"]); $polish = trim($post["polish"]);
			$other = $this->mMysqli->real_escape_string($post["other"]); $other = trim($post["other"]);
			$unit = $this->mMysqli->real_escape_string($post["unit"]); $unit = trim($post["unit"]);
			
			$query = "SELECT id FROM words WHERE polish = '$polish' AND other = '$other' AND unit = '$unit'";
			$result = $this->mMysqli->query($query);
			
			if ($result->num_rows > 0) {
				return true;
			}
			return false;
		}
		
		// Pobiera dostępne unity
		public function getUnits($post) {
			$query = "SELECT DISTINCT unit FROM words ORDER BY unit ASC";
			$results = $this->mMysqli->query($query);
			
			$return = "<dictionary>";
			
			while ($row = $results->fetch_array(MYSQLI_ASSOC)) {
				$unit = htmlentities($row["unit"]);
				$return .= "<unit><![CDATA[" . $unit . "]]></unit>";
			}
			$return .= "</dictionary>";
			
			return $return;
		}
		
		// Pokazuje test
		public function showTest($post) {
			$unit = $this->mMysqli->real_escape_string($post["unit"]); $unit = trim($post["unit"]);
			
			/*
			 *		testMode
			 *			0 - tryb polsko - ...
			 *			1 - tryb ... - polski
			 */
			$testMode = $this->mMysqli->real_escape_string($post["testMode"]); $testMode = trim($post["testMode"]);
			
			if ($testMode == 0) {
				$query = "SELECT id, polish as wordToTranslate FROM words WHERE unit = '$unit' ORDER BY rand()";
			}
			else {
				$query = "SELECT id, other as wordToTranslate FROM words WHERE unit = '$unit' ORDER BY rand()";
			}
			
			$results = $this->mMysqli->query($query);
			
			$return = "<dictionary>";
			
			while ($row = $results->fetch_array(MYSQLI_ASSOC)) {
				$id = htmlentities($row["id"]);
				$wordToTranslate = htmlentities($row["wordToTranslate"]);
				
				$return .= "<word>";
					$return .= "<id>" . $id . "</id>";
					$return .= "<wordToTranslate><![CDATA[" . $wordToTranslate . "]]></wordToTranslate>";
				$return .= "</word>";
			}
			$return .= "</dictionary>";
			
			return $return;
		}
		
		// Pobiera 1 literę słowa w ramach pomocy
		public function getFirstLetter($post) {
			$testMode = $this->mMysqli->real_escape_string($post["testMode"]); $testMode = trim($post["testMode"]);
			$id = $this->mMysqli->real_escape_string($post["id"]); $id = trim($post["id"]);
			
			if ($testMode == 0) {
				$query = "SELECT SUBSTRING(other, 1, 1) as word FROM words WHERE id = '$id'";
			}
			else {
				$query = "SELECT SUBSTRING(polish, 1, 1) as word FROM words WHERE id = '$id'";
			}
			
			$result = $this->mMysqli->query($query)->fetch_array(MYSQLI_ASSOC);
			$result = htmlentities($result["word"]);
			
			if ($result) {
				return "<dictionary><![CDATA[" . $result . "]]></dictionary>";
			}
			return "<dictionary>0</dictionary>";
			
		}
		
		// Sprawdza test
		public function checkTest($post) {
			// Pobiera z tablicy unit i usuwa go z niej
			$unit = $this->mMysqli->real_escape_string($post["unit"]); $unit = trim($post["unit"]);
			unset($post["unit"]);
			
			/*
			 *		testMode
			 *			0 - tryb polsko - ...
			 *			1 - tryb ... - polski
			 */
			$testMode = $this->mMysqli->real_escape_string($post["testMode"]); $testMode = trim($post["testMode"]);
			unset($post["testMode"]);
			
			// Pobiera wszystkie słówka z unitu
			if ($testMode == 0) {
				$query = "SELECT id, polish as wordToTranslate, other as correctTranslate FROM words WHERE unit = '$unit' ORDER BY id";
			}
			else {
				$query = "SELECT id, other as wordToTranslate, polish as correctTranslate FROM words WHERE unit = '$unit' ORDER BY id";
			}
			
			$results = $this->mMysqli->query($query);
			
			$score = 0;
			$all = count($post);
			
			$return = "<dictionary>";
			
			while ($row = $results->fetch_array(MYSQLI_ASSOC)) {
				$id = htmlentities($row["id"]);
				$wordToTranslate = htmlentities($row["wordToTranslate"]);
				$correctTranslate = htmlentities($row["correctTranslate"]);
				$answer = htmlentities(trim($post[$id]));
				
				$return .= "<word>";
					if ($answer === $correctTranslate) {
						$score++;
						$return .= "<result>1</result>";
					}
					else {
						$return .= "<result>0</result>";
					}
					
					$return .= "<id>" . $id . "</id>";
					$return .= "<answer><![CDATA[" . (($answer === "") ? "------" : $answer) . "]]></answer>";
					$return .= "<wordToTranslate><![CDATA[" . $wordToTranslate . "]]></wordToTranslate>";
					$return .= "<correctTranslate><![CDATA[" . $correctTranslate . "]]></correctTranslate>";
				$return .= "</word>";
			}
			
			// Dodatkowe informacje
			$return .= "<score>" . $score . "</score>";
			$return .= "<all>" . $all . "</all>";
			
			
			$return .= "</dictionary>";
			return $return;
		}
	}
?>