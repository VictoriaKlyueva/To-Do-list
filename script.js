class Case {
    constructor(name, description='', flag=false) {
        this.name = name;
        this.description = description;
        this.flag=flag;
    }
}

// Добавление дела
function addCase() {
    let inputName = document.querySelector('input[name="caseInput"]')
    let inputDescription = document.querySelector('input[name="caseDescription"]')
    // Получение текста из полей
    let caseName = inputName.value;
    let caseDescription = inputDescription.value;
    // Создание и дела
    let newCase = new Case(caseName, caseDescription);
    cases.push(newCase);

    // Очистка текстовых полей
    inputName.value = "";
    inputDescription.value = "";

    console.log(cases)
}

// Удаление элемента из списка
function deleteCase(index) {
    cases.splice(index, 1);
}

document.getElementById('add').onclick = addCase;
var cases = []