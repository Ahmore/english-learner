$(function() {
	dictionary.init();
});

var dictionary = {
	memory: {
		url: "functions.php",	// URL do portu między js a PHP
		currentMode: "",		// Przechowuje aktualnie wyświetlany tryb
		container: null,		// Namiar na kontener słownika
		currentPage: 1,			// Aktualnie wyświetlana strona słów
		pageLimit: 5,			// Limit słów na stronę
		pagesAmount: 0,			// Nr strony
		lastUnit: null,			// Ostatnio wybierany unit do testu
		lastTestMode: null,		// Ostatni tryb testu
		units: null,			// Dostępne unity
		grid: {}				// Pamięć do grida
	},
	
	// Inicjuje słownik
	init: function() {
		var that = this,
			memory = that.memory;
		
		// Zapamiętuje referencję do kontenera głównego
		memory.container = $("#dictionary-container");
		
		// Nowy test
		$("#dictionary-test").on("click", function() {
			that.getUnits.apply(that);
		});
	
		$("#dictionary-dictionary").on("click", function() {
			that.getWords.apply(that);
		});
		
		that.getWords();
	},
	
	// Pobiera słówka 
	getWords: function() {
		var that = this,
			memory = that.memory,
			container = memory.container,
			wp = memory.currentPage,
			pl = memory.pageLimit,
			params,
			mode = "getWords";
		
		// Zapamiętuje działanie
		memory.currentMode = "dictionary";
		that.showMode();
		
		params = {
			mode: mode,
			wp: wp,
			pl: pl
		};
		
		// Pobiera słówka
		$.post(memory.url, params, function(data) {	
			// Tworzy strukturę 
			container.html("");
			
			that.displayPageInformations(data);	// Dodaje informacje o stronie i narzędzia nawigacyjne
			that.addTitle();					// Dodaje pole do dodawania nowego leku
			that.displayWords(data);			// Wyświetla słowa
			that.addNewWordLine();				// Dodaje linię do dodawania nowego leku
			that.displayPageInformations(data);	// Dodaje informacje o stronie i narzędzia nawigacyjne
		});
	},
	
	// Wyświetla słowka
	displayWords: function(data) {
		var that = this,
			memory = that.memory,
			container = memory.container,
			root = data.documentElement,
			ids = root.getElementsByTagName("id"),
			polish_words = root.getElementsByTagName("pl"),
			other_words = root.getElementsByTagName("other"),
			units = root.getElementsByTagName("unit"),
			i,
			max = ids.length,
			id,
			pl,
			oth,
			unit,
			contain = "<table border=1 id='dictionary-words'>";
			
			
		for (i = 0; i < max; i += 1) {
			id = ids[i].firstChild.nodeValue;
			pl = polish_words[i].firstChild.nodeValue;
			oth = other_words[i].firstChild.nodeValue;
			unit = units[i].firstChild.nodeValue;
			
			contain += "<tr>";
				contain += "<td class='dictionary-grid' name='words/polish/" + id + "/text'>" + pl + "</td>";
				contain += "<td class='dictionary-grid' name='words/other/" + id + "/text'>" + oth + "</td>";
				contain += "<td class='dictionary-grid' name='words/unit/" + id + "/text'>" + unit + "</td>";
				contain += "<td class='dictionary-word-delete'><a data-id='" + id + "'>&#10008</a></td>";
			contain += "</tr>";
		}
		
		contain += "</table>";
		
		var form = $(contain).appendTo(container);
		// Aktywuje grida
		form.find(".dictionary-grid").on("dblclick", that.activeGrid).attr("title", "Kliknij dwukrotnie, aby edytować");
		
		
		// Dodaje możliwość usuwania
		form.find("a").on("click", that.deleteWord).attr("title", "Usuń rekord");
	},
	
	// Dodaje do struktury pole do dodania nowej pary słowko-tlumaczenie + język
	addTitle: function() {
		var memory = this.memory,
			container = memory.container,
			contain = "<table border=1 id='dictionary-header'>";
			
		contain += "<tr>";
			contain += "<td>Polski</td>";
			contain += "<td>Tłumaczenie</td>";
			contain += "<td>Rozdział</td>";
		contain += "</tr>";
		
		
		contain += "</table>";
		
		var form = $(contain).appendTo(container);
	},
	
	addNewWordLine: function() {
		var memory = this.memory,
			container = memory.container,
			contain = "<form><table border=1 id='dictionary-footer'>";
			
		contain += "<tr>";
			contain += "<td><input type='text' name='new_pl' placeholder='Polskie słowo...' required/></td>";
			contain += "<td><input type='text' name='new_other' placeholder='Tłumaczenie...' required/></td>";
			contain += "<td><input type='text' name='new_word_unit' placeholder='Rozdział...' required/></td>";
		contain += "</tr>";
		
		
		contain += "</table><input type='submit' style='display: none;'/></form>";
		
		var form = $(contain).appendTo(container);
		
		form.on("submit", this.addWord);
	},
	
	// Wyświetla informacje o słówkach
	displayPageInformations: function(data) {
		var that = this,
			memory = that.memory,
			container = memory.container,
			currentPage = memory.currentPage,
			contain = "",
			root = data.documentElement,
			amount = parseInt(root.getElementsByTagName("amount")[0].firstChild.nodeValue),
			pages = parseInt(root.getElementsByTagName("pages")[0].firstChild.nodeValue),
			i,
			index;
		
		// Zapamiętuje ilość stron w pamięci
		memory.pagesAmount = pages;
		
		// Tworzy strukturę narzędzi
		contain += "<div id='dictionary-page-informations'><div>";
			contain += "<div class='float arrow'>";
			if (!this.isFirst(currentPage)) {
				contain += "<a data-mode='-' class='dictionary-arrow'>&#10092;</a> ";
			}
			contain += "</div>";
			
			contain += "<div class='float'>";
				contain += "<input type='text' id='dictionary-crt_page' value='" + currentPage + "' />";
				contain += "<span>z</span><a data-id='" + pages + "' id='dictionary-last_page'>" + pages + "</a>";
			contain += "</div>";
			
			contain += "<div class='float arrow'>";
			if (!this.isLast(currentPage)) {
				contain += " <a data-mode='+' class='dictionary-arrow'>&#10093;</a>";
			}
			contain += "</div>";
		contain += "</div></div>"
		
		
		var info = $(contain).appendTo(container);
		info.find(".dictionary-arrow").on("click", this.changePage);
		info.find("#dictionary-last_page").on("click", function() {
			that.goTo(pages);
		});
		info.find("input").on("keydown", function(e) {
			switch (e.keyCode) {
				case 8:
				case 48:
				case 49:
				case 50:
				case 51:
				case 52:
				case 53:
				case 54:
				case 55:
				case 56:
				case 57:
					break;
					
				case 13:
					if (that.isOk($(this).val())) {
						that.goTo($(this).val());
					}
					else {
						$(this).val(currentPage);
					}
					
					break;
					
				default: 
					return false;
			}
		});
		
	},
	
	isOk: function(index) {
		var memory = this.memory,
			pages = memory.pagesAmount;
		
		return parseInt(index) > 0 && parseInt(index) <= pages;
	},
	
	isFirst: function(index) {
		return parseInt(index) === 1;
	},
	
	isLast: function(index) {
		var memory = this.memory,
			pages = memory.pagesAmount;
		
		return parseInt(index) === pages;
	},
	
	// Zmienia stronę wyświetlanych słowek
	changePage: function() {
		var that = dictionary,
			memory = that.memory,
			pagesAmount = memory.pagesAmount,
			mode = $(this).attr("data-mode"),
			action = false;
			
		switch(mode) {
			case "-":
				if (memory.currentPage > 0) {
					memory.currentPage -= 1;
					action = true;
				}
				break;
			
			case "+":
				if (memory.currentPage < pagesAmount) {
					memory.currentPage += 1;
					action = true;
				}
			
				break;
		}
		
		if (action) {
			that.getWords();
		}
	},
	
	// Idzie do wybranej strony
	goTo: function(page) {
		var that = dictionary;
			memory = that.memory;
		
		memory.currentPage = parseInt(page);
		that.getWords();
	},
	
	// Dodaje nowe słowo do słownika jeśli przejdzie walidacje
	addWord: function() {
		var that = dictionary,
			memory = that.memory,
			form = $(this),
			pl = form.find("input[name='new_pl']"),
			oth = form.find("input[name='new_other']"),
			unit = form.find("input[name='new_word_unit']"),
			params,
			mode = "addWord",
			result;
			
		params = {
			mode: mode,
			polish: pl.val(),
			other: oth.val(),
			unit: unit.val()
		}
		
		$.post(memory.url, params, function(data) {
			result = parseInt(data.documentElement.firstChild.nodeValue);
			
			if (result === 1) {
				that.getWords();
			}
			else {
				alert("Dodawanie słowa nie powiodło się");
			}
		});
		
		return false;
	},
	
	// Usuwa wybrane słowo
	deleteWord: function() {
		var that = dictionary,
			memory = that.memory,
			id = $(this).attr("data-id"),
			conf = confirm("Czy jesteś pewien?"),
			params,
			mode = "deleteWord",
			result;
			
			
		if (conf) {
			params = {
				mode: mode,
				id: id
			}
			
			$.post(memory.url, params, function(data) {
				result = data.documentElement.firstChild.nodeValue;
				
				if (result === "1") {
					that.getWords();
				}
				else {
					alert("Dodawanie słowa nie powiodło się");
				}
			});
		}
	},
	
	activeGrid: function() {
		var that = dictionary,
			memory = that.memory,
			td = $(this),
			value = td.text(),
			name = td.attr("name"),
			mode = name.split("/")[3],
			contain = "",
			grid = memory.grid,
			input;
			
		// Zapamiętuje stare dane
		grid.last = {
			value: value,
			name: name
		}
		
		td.html("");
		switch (mode) {
			case "text":
				contain += "<input type='text' name='" + name + "' value='" + value + "' />";
				input = $(contain).appendTo(td);//.focus();
				// Ustawia kursor na końcu
				
				that.endFocus(input[0]);
				
				input.on("blur", that.editWord).on("keydown", function(e) {
					if (e.keyCode === 13) {
						$(this).blur();
					}
					else if (e.keyCode === 27) {
						that.closeGrid(input, "last")
					}
				});
				break;
				
			case "select":
			
				// DO POPRAWKI
				/*
				contain += "<select name='" + name + "' value='" + value + "'>";
					contain += "<option value='1' selected>English</option>";
					contain += "<option value='2'>Dutch</option>";
				contain += "</select>";
				input = $(contain).appendTo(td);
				input.on("change", that.editWord);
				*/
				
				break;
		}
		
		// Usuwa bąbelkowe dblclick
		input.on("dblclick", function(e) {
			e.stopPropagation();
		});
	},
	
	endFocus: function(node, pos) {		
		node = (typeof node == "string" || node instanceof String) ? document.getElementById(node) : node;
		pos = pos || node.value.length;

		if (!node){
			return false;
		}
		else if (node.createTextRange) {
			var textRange = node.createTextRange();
			textRange.collapse(true);
			textRange.moveEnd(pos);
			textRange.moveStart(pos);
			textRange.select();
			return true;
		}
		else if (node.setSelectionRange) {
			node.focus();
			node.setSelectionRange(pos, pos);
			return true;
		}

		return false;
	},
	
	editWord: function() {
		var that = dictionary,
			memory = that.memory,
			input = $(this),
			value = input.val(),
			name = input.attr("name"),
			grid = memory.grid,
			params,
			mode = "editWord";
		
		// Sprawdza czy value nie jest puste
		if ($.trim(value) === "") {
			return false;
		}
		
		// Zapamiętuje nowe dane
		grid.current = {
			value: value,
			name: name.split("/").splice(0, 3).join("/")
		}
		
		params = {
			mode: mode,
			value: value,
			name: name
		}
		
		console.dir(params);
		
		
		$.post(memory.url, params, function(data) {
			result = data.documentElement.firstChild.nodeValue;
			
			// Wstaw nową wartość
			if (result === "1") {
				that.closeGrid(input, "current");
			}
			// Przywróc stare z pamięci
			else {
				that.closeGrid(input, "last");
				alert("Podana wartość jest niepoprawna!");
			}
		});
	},
	
	closeGrid: function(input, mode) {
		var memory = this.memory,
			grid = memory.grid,
			data = grid[mode],
			td = input.parent();
			
		td.html(data.value);
	},
	
	/*
	 *	Test
	 */
	 
	
	// Pobiera dostępne unity
	getUnits: function() {
		var that = this,
			memory = that.memory,
			params,
			mode = "getUnits";
			
			var test = "";
			
		params = {
			mode: mode
		}
		
		$.post(memory.url, params, function(data) {
			that.setTestSettings(data);
		});
	},
	
	// Prosi o wybranie ustawień testu
	setTestSettings: function(data) {
		var memory = this.memory,
			container = memory.container,
			content = "",
			root = data.documentElement,
			units = root.getElementsByTagName("unit"),
			i,
			max = units.length,
			unit;
		
		// Zapamiętuje działanie
		memory.currentMode = "test";
		this.showMode();
		
		content = "<form class='chooseParamsToTest'>";
			content += "<div>Ustawienia</div>";
			content += "<label><span>Rozdział: </span><select>";
				for (i = 0; i < max; i += 1) {
					unit = units[i].firstChild.nodeValue;
					content += "<option value='" + unit + "'>" + unit + "</option>";
				}
			content += "</select></label>";
			content += "<label><span>Tryb: </span><select>";
				content += "<option value='0'>Polsko - Angielski</option>";
				content += "<option value='1'>Angielsko - Polski</option>";
			content += "</select></label>";
			content += "<label for='mode_with_help'><span>Podpowiedzi:</span> <input type='checkbox' name='mode_with_help' id='mode_with_help'/></label>";
			content += "<input type='submit' value='Pokaż'/>";
		content += "</form>";
		
		container.html("");
		$(content).appendTo(container).on("submit", this.showTest);
	},
	
	// Pobiera test
	showTest: function() {
		var that = dictionary,
			memory = that.memory,
			form = $(this),
			unit = form.find("select")[0].value,
			testMode = form.find("select")[1].value,
			helpMode = form.find("#mode_with_help").prop("checked"),
			params,
			mode = "showTest";
		
		// Zapamiętuje w pamięci unit
		memory.lastUnit = unit;
		memory.lastTestMode = testMode;
		
		params = {
			mode: mode,
			unit: unit,
			testMode: testMode
		}
		
		// Pobiera informacje potrzebne do testu
		$.post(memory.url, params, function(data) {
			that.displayTest.apply(that, [data]);
			
			if (helpMode) {
				that.addHelpMode();
			}
		});
		
		return false;
	},
	
	// Wyświetla test
	displayTest: function(data) {
		var memory = this.memory,
			container = memory.container,
			root = data.documentElement,
			ids = root.getElementsByTagName("id"),
			wordsToTranslate = root.getElementsByTagName("wordToTranslate"),
			i,
			max = ids.length,
			id,
			wordToTranslate,
			contain = "<form><table id='dictionary-table-test'>";
			contain += "<tr><td>Słowo</td><td></td><td>Tłumaczenie</td></tr>";
			
		for (i = 0; i < max; i += 1) {
			id = ids[i].firstChild.nodeValue;
			wordToTranslate = wordsToTranslate[i].firstChild.nodeValue;
			
			contain += "<tr name='" + id + "' class='dictionary-test-words'>";
				contain += "<td>" + wordToTranslate + "</td>";
				contain += "<td> - </td>";
				contain += "<td><input type='text' name='" + id + "' autocomplete='off'/></td>";
			contain += "<tr>";
			
		}
		contain += "</table><input type='submit' value='Sprawdź!' /></form>";
		
		container.html("");
		var form = $(contain).appendTo(container).on("submit", this.checkTest);
	},
	
	// W razie potrzeby dodaje tryb pomocy
	addHelpMode: function() {
		var that = this,
			memory = that.memory,
			container = memory.container,
			trs = container.find(".dictionary-test-words"),
			tr,
			id,
			contain = "";
			
		trs.each(function() {
			tr = $(this);
			id = tr.attr("name");
			
			contain = "<td><a name='" + id + "' class='dictionary-test-helper'>&#10068;</a></td>";
			$(contain).appendTo(tr).find("a").on("click", that.getFirstLetter);
		});
	},
	
	// Pobiera pierwszą litere słowa w ramach tłumaczenia
	getFirstLetter: function() {
		var that = dictionary,
			memory = that.memory,
			lastTestMode = memory.lastTestMode,
			params,
			mode = "getFirstLetter",
			id = $(this).attr("name");
			
		params = {
			mode: mode,
			id: id,
			testMode: lastTestMode
		}
		
		console.dir(params);
		
		$.post(memory.url, params, function(data) {
			var result = data.documentElement.firstChild.nodeValue;
			if (result !== "0") {
				alert(result);
			}
			else {
				alert("Wystąpił błąd, sprubój za chwilę");
			}
		});
		
	},
	
	// Sprawdza test
	checkTest: function() {
		var that = dictionary,
			memory = that.memory,
			testMode = memory.lastTestMode,
			answers = $(this).find("input[type='text']"),
			input,
			id,
			answer,
			params,
			mode = "checkTest",
			unit = memory.lastUnit;
			
		params = {
			mode: mode,
			unit: unit,
			testMode: testMode
		}
		
		// Tworzy łańcuch do zapytania id:tłumaczenie
		answers.each(function() {
			input = $(this);
			id = input.attr("name");
			answer = input.val();
			
			params[id] = answer;
		});
		
		$.post(memory.url, params, function(data) {
			that.showTestResult(data);
		});
		
		return false;
	},
	
	// Wyświetla wynik testu
	showTestResult: function(data) {
		var memory = this.memory,
			container = memory.container,
			root = data.documentElement,
			score = root.getElementsByTagName("score")[0].firstChild.nodeValue,
			all = root.getElementsByTagName("all")[0].firstChild.nodeValue,
			
			ids = root.getElementsByTagName("id"),
			results = root.getElementsByTagName("result"),
			answers = root.getElementsByTagName("answer"),
			wordsToTranslate = root.getElementsByTagName("wordToTranslate"),
			correctsTranslate = root.getElementsByTagName("correctTranslate"),
			max = ids.length,
			i,
			contain = "",
			id,
			result,
			answer,
			wordToTranslate,
			correctTranslate,
			answer_class;
		
		
		// Dodaje wynik do struktury
		contain	+= "<div id='dictionary-score'>Twój wynik to: " + score + "/" + all + "</div>";
			

		contain += "<table id='dictionary-score-details'>";
		contain += "<tr><td>Słowo</td><td>Twoje tlumaczenie</td><td>Poprawne tłumaczenie</td></tr>";
		
		for (i = 0; i < max; i += 1) {
			id = ids[i].firstChild.nodeValue;
			result = results[i].firstChild.nodeValue;
			answer = answers[i].firstChild.nodeValue;
			wordToTranslate = wordsToTranslate[i].firstChild.nodeValue;
			correctTranslate = correctsTranslate[i].firstChild.nodeValue;
			
			if (result === "0") {
				answer_class = "incorrect";
			}
			else {
				answer_class = "correct";
			}
			contain += "<tr>";
				contain += "<td class='" + answer_class + "'>" + wordToTranslate + "</td>";
				contain += "<td>" + answer + "</td>";
				contain += "<td>" + correctTranslate + "</td>";
			contain += "</tr>";
			
		}
		contain += "</table>";
		
		container.html(contain);
	},
	
	/*
	 *		Pozostałe funkcje
	 */
	
	// Podświetla aktualny tryb
	showMode: function() {
		var memory = this.memory
			currentMode = memory.currentMode,
			id = "#dictionary-" + currentMode;
		
		// Usuwa inne podświetlenia
		this.deleteShowMode();
		
		// Podświetla aktualny tryb
		$(id).addClass("dictionary-currentMode");
	},
	
	// Ukrywa podświetlone tryby
	deleteShowMode: function() {
		$(".dictionary-currentMode").removeClass("dictionary-currentMode");
	}
}