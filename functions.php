<?php
	require "eng.php";

	if (!isset($_POST["mode"]) || $_POST["mode"] === "") {
		exit;
	}
	// Jeśli jest sprawdza czy istnieje taka funkcja w klasie
	else {
		// Zapisuje tryb i usuwa tryb z tablicy $_POST
		$mode = $_POST["mode"];
		unset($_POST["mode"]);
		
		// tworzy instancje klasy
		$dict = new Dictionary();
		
		header('Expires: Fri, 25 Dec 1980 00:00:00 GMT'); // czas w przeszłości
		header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . 'GMT'); 
		header('Cache-Control: no-cache, must-revalidate'); 
		header('Pragma: no-cache');
		header('Content-Type: text/xml');
		
		$xml =  '<?xml version="1.0" encoding="UTF-8"?>';
		
		// Wywołuje metodę
		$xml .= $dict->{$mode}($_POST);
		
		echo $xml;
	}
?>