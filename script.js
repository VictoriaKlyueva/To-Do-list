class Task {
    constructor(name, description='', flag=false) {
        this.id = currentId;
        this.name = name;
        this.description = description;
        this.flag=flag;
        this.div = this.makeTaskDiv();
        currentId += 1;
    }

    // Создание элемента div для дела 
    makeTaskDiv() {
        let id = 'task' + currentId.toString();
    
        // Создание task-div
        var newTaskDiv = document.createElement('div');
        newTaskDiv.className = 'task-div';
        newTaskDiv.id = id;
        document.querySelector('.tasks-divs').appendChild(newTaskDiv);
    
        // Создание task-info внутри task-div
        var taskInfoDiv = document.createElement('div');
        taskInfoDiv.className = 'task-info';
        taskInfoDiv.id = 'task-info' + id;
        document.getElementById(id).appendChild(taskInfoDiv);
    
        // Создание кнопки "Удалить" внутри task-div
        var deleteButton = document.createElement('button');
        deleteButton.className = 'delete';
        deleteButton.id = 'delete' + id;
        deleteButton.innerHTML = 'Удалить';
        document.getElementById(id).appendChild(deleteButton);

        // Удаление дела по нажатию на кнопку
        deleteButton.onclick = function() {deleteTask(id)}
    
        // Создание чекбокса внутри task-info
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'taskCheckbox';
        checkbox.id = 'checbox' + id;
        document.getElementById('task-info' + id).appendChild(checkbox);

        // Замена состояния flag при нажатии на чекбокс
        checkbox.onclick = () => {this.flag = !this.flag};
    
        // Создание имени дела внутри task-info
        var taskNameP = document.createElement('p');
        taskNameP.className = 'taskName';
        taskNameP.id = 'taskName' + id;
        taskNameP.innerHTML = this.name;
        document.getElementById('task-info' + id).appendChild(taskNameP);
    
        // Создание описания дела внутри task-info
        var taskDescriptionText = document.createElement('input');
        taskDescriptionText.type = 'text';
        taskDescriptionText.className = 'taskDescriptionText';
        taskDescriptionText.id = 'taskDescriptionText' + id;
        taskDescriptionText.value = this.description;
        document.getElementById('task-info' + id).appendChild(taskDescriptionText);

        return newTaskDiv;
    }
}

// Добавление дела
function addTask() {
    let inputName = document.querySelector('input[name="taskInput"]');
    let inputDescription = document.querySelector('input[name="taskDescription"]');

    // Получение текста из полей
    let taskName = inputName.value;
    let taskDescription = inputDescription.value;

    // Создание дела с обработкой их количества
    if (count < 10) {
        let newTask = new Task(taskName, taskDescription);
        tasks.push(newTask);
        count += 1;
    }
    else {
        window.alert('Слишком много задач');
    }

    // Очистка текстовых полей
    inputName.value = "";
    inputDescription.value = "";

    console.log(tasks);
}

// Удаление элемента из списка
function deleteTask(id) {
    // Удаление div
    var task = document.getElementById(id);
    task.remove();

    // Удаление элемента из списка
    for (let i = 0; i < tasks.length; i++) {
        let current = 'task' + tasks[i].id.toString();
        console.log(current);
        if (current == id) {
            tasks.splice(i, 1);
            break;
        }
    }

    count -= 1;

    console.log(tasks);
}

// Сохранение списка
function saveTasks() {
    
}

document.getElementById('add').onclick = addTask;

var count = 0;
var currentId = 0;
var tasks = [];